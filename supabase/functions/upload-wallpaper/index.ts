// admin/supabase/functions/upload-wallpaper/index.ts v1.1
// v1.1 — AUDITORÍA PARTE 4 — valida magic bytes + tope de tamaño con
//        _shared/upload.ts.
// v1.0 — Wallpapers · subida admin de un fondo full-res a Cloudflare R2 + INSERT
//        en public.wallpapers (service role). Copia el motor de subida de
//        upload-vtli-post-image (AWS Sig V4 uploadToR2, base64ToUint8,
//        extForMime, todayDateString, gateAdmin). Diferencia: sin post_id ni
//        table; tras subir a R2 (key Wallpapers/{fecha}/{uuid}.{ext}) INSERTA
//        la fila nueva y la devuelve. sort_order = MAX(sort_order)+1.
//
//   POST { token, image_base64 (sin prefijo data:), image_mime, title? }
//   →    { success, wallpaper: { id, title, image_url, is_free, sort_order, active, created_at } }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy upload-wallpaper --no-verify-jwt
//
// Secrets: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY ·
//   R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY · R2_BUCKET ·
//   R2_PUBLIC_BASE_URL · CLERK_SECRET_KEY (lo usa gateAdmin)

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"
import { verifyUpload, IMAGE_KINDS } from "../_shared/upload.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* AUDITORÍA PARTE 4 — tope de tamaño de la imagen subida (magic bytes en
   _shared/upload.ts deciden el tipo real; el image_mime del cliente se ignora). */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/* ── R2 sig V4 ──────────────────────────────────────────────────── */

interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

function bytesToHex(bytes: Uint8Array): string {
    let s = ""
    for (let i = 0; i < bytes.length; i++) {
        s += bytes[i].toString(16).padStart(2, "0")
    }
    return s
}

async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf =
        typeof data === "string" ? new TextEncoder().encode(data) : data
    const hash = await crypto.subtle.digest("SHA-256", buf)
    return bytesToHex(new Uint8Array(hash))
}

async function hmacSha256(
    key: Uint8Array | string,
    msg: string
): Promise<Uint8Array> {
    const keyData =
        typeof key === "string" ? new TextEncoder().encode(key) : key
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        new TextEncoder().encode(msg)
    )
    return new Uint8Array(sig)
}

function s3CanonicalPath(bucket: string, key: string): string {
    const segments = key.split("/").map((s) => encodeURIComponent(s))
    return `/${encodeURIComponent(bucket)}/${segments.join("/")}`
}

async function uploadToR2(
    cfg: R2Config,
    bytes: Uint8Array,
    key: string,
    contentType: string
): Promise<string> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto"
    const service = "s3"
    const method = "PUT"

    const canonicalUri = s3CanonicalPath(cfg.bucket, key)
    const url = `https://${host}${canonicalUri}`
    const payloadHash = await sha256Hex(bytes)

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)

    const canonicalHeaders =
        `content-type:${contentType}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"

    const canonicalRequest =
        `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign =
        `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(
            canonicalRequest
        )}`

    const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp)
    const kRegion = await hmacSha256(kDate, region)
    const kService = await hmacSha256(kRegion, service)
    const kSigning = await hmacSha256(kService, "aws4_request")
    const signature = bytesToHex(await hmacSha256(kSigning, stringToSign))

    const authHeader =
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": contentType,
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
            Authorization: authHeader,
        },
        body: bytes,
    })
    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`R2 PUT ${res.status}: ${txt.slice(0, 400)}`)
    }

    const encodedKey = key
        .split("/")
        .map((s) => encodeURIComponent(s))
        .join("/")
    const baseUrl = cfg.publicBaseUrl.replace(/\/+$/, "")
    return `${baseUrl}/${encodedKey}`
}

function todayDateString(): string {
    const d = new Date()
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

/* ── Supabase ───────────────────────────────────────────────────── */

interface SupabaseConfig {
    url: string
    serviceRoleKey: string
}

// sort_order del nuevo wallpaper = MAX(sort_order)+1. GET REST con service role.
async function nextSortOrder(cfg: SupabaseConfig): Promise<number> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/wallpapers?select=sort_order&order=sort_order.desc&limit=1`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return 1
        const rows: any = await res.json()
        const max = Array.isArray(rows) && rows.length ? Number(rows[0]?.sort_order ?? 0) : 0
        return (Number.isFinite(max) ? max : 0) + 1
    } catch {
        return 1
    }
}

// INSERT de la fila nueva (service role) y devuelve la fila creada.
async function insertWallpaper(
    cfg: SupabaseConfig,
    row: { image_url: string; title: string; is_free: boolean; active: boolean; sort_order: number }
): Promise<any> {
    const res = await fetch(`${cfg.url}/rest/v1/wallpapers`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(row),
    })
    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`INSERT wallpapers ${res.status}: ${txt.slice(0, 400)}`)
    }
    const data: any = await res.json()
    return Array.isArray(data) ? data[0] : data
}

/* ── Handler ────────────────────────────────────────────────────── */

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missing: string[] = []
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missing.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL")
    if (missing.length) {
        return jsonResponse(500, { error: "missing_secrets", missing })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    const title = String(body?.title ?? "").trim() || "Wallpaper"

    const supabase: SupabaseConfig = {
        url: SUPABASE_URL!,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
    }
    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID!,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
        bucket: R2_BUCKET!,
        publicBaseUrl: R2_PUBLIC_BASE_URL!,
    }

    // Token de Clerk verificado server-side (gateAdmin → JWKS + is_admin).
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })

    const _v = verifyUpload(String(body?.image_base64 ?? ""), {
        allow: IMAGE_KINDS,
        maxBytes: MAX_UPLOAD_BYTES,
    })
    if (!_v.ok) return jsonResponse(_v.status, { error: _v.error, detail: _v.detail })

    let imageUrl: string
    try {
        const key = `Wallpapers/${todayDateString()}/${crypto.randomUUID()}.${_v.ext}`
        imageUrl = await uploadToR2(r2, _v.bytes, key, _v.mime)
    } catch (err: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(err?.message ?? err),
        })
    }

    let wallpaper: any
    try {
        const sortOrder = await nextSortOrder(supabase)
        wallpaper = await insertWallpaper(supabase, {
            image_url: imageUrl,
            title,
            is_free: false,
            active: true,
            sort_order: sortOrder,
        })
    } catch (err: any) {
        return jsonResponse(502, {
            error: "insert_failed",
            detail: String(err?.message ?? err),
        })
    }

    return jsonResponse(200, { success: true, wallpaper })
})
