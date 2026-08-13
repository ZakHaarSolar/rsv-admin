// admin/supabase/functions/subir-keyframe-video/index.ts v1.2
// v1.2 — AUDITORÍA PARTE 4 — valida magic bytes + tope de tamaño con
//        _shared/upload.ts.
// v1.1 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// ---------------------------------------------------------------
// Atelier · Estudio Manual — subir el video animado MANUAL de un keyframe.
// El Tripulante animó el keyframe en Grok web (con su SuperGrok) y sube
// el .mp4 acá. La edge function lo recibe (multipart/form-data), lo sube
// a Cloudflare R2 server-side (sin tocar CORS del bucket) y hace el PATCH
// del keyframe: video_r2_url + video_source='manual_grok' + anim_status.
//
// Recibe (multipart/form-data):
//   admin_clerk_id : text
//   keyframe_id    : uuid
//   file           : el archivo de video (mp4 recomendado, <~50MB)
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy subir-keyframe-video --no-verify-jwt
//
// Secrets requeridos (todos ya existen):
//   SUPABASE_URL · SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY ·
//   R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY ·
//   R2_BUCKET · R2_PUBLIC_BASE_URL

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"
import { verifyUploadFile, VIDEO_KINDS } from "../_shared/upload.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Límite defensivo: clips de Reels rondan 2-15MB. Cortamos en 80MB.
const MAX_VIDEO_BYTES = 80 * 1024 * 1024

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

async function uploadVideoToR2(
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
    const signedHeaders =
        "content-type;host;x-amz-content-sha256;x-amz-date"

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
    anonKey: string
    serviceRoleKey: string
}

async function checkAdmin(
    cfg: SupabaseConfig,
    clerkUserId: string
): Promise<boolean> {
    const res = await fetch(
        `${cfg.url}/rest/v1/rpc/get_profile_by_clerk_id`,
        {
            method: "POST",
            headers: {
                apikey: cfg.anonKey,
                Authorization: `Bearer ${cfg.anonKey}`,
                "Content-Type": "application/json",
                Prefer: "params=single-object",
            },
            body: JSON.stringify({ p_clerk_id: clerkUserId }),
        }
    )
    if (!res.ok) return false
    const profile: any = await res.json()
    return Boolean(profile?.is_admin)
}

async function keyframeExists(
    cfg: SupabaseConfig,
    keyframeId: string
): Promise<boolean> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?id=eq.${keyframeId}&select=id`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return false
    const rows: any[] = await res.json()
    return rows.length > 0
}

async function patchKeyframe(
    cfg: SupabaseConfig,
    keyframeId: string,
    patch: Record<string, any>
): Promise<void> {
    await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?id=eq.${keyframeId}`,
        {
            method: "PATCH",
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({
                ...patch,
                updated_at: new Date().toISOString(),
            }),
        }
    )
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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missing: string[] = []
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY")
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missing.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL")
    if (missing.length) {
        return jsonResponse(500, { error: "missing_secrets", missing })
    }

    let form: FormData
    try {
        form = await req.formData()
    } catch {
        return jsonResponse(400, { error: "invalid_form_data" })
    }

    let adminClerkId = ""
    const keyframeId = String(form.get("keyframe_id") ?? "").trim()
    const file = form.get("file")

    if (!keyframeId) {
        return jsonResponse(400, { error: "missing_keyframe_id" })
    }
    if (!(file instanceof File)) {
        return jsonResponse(400, { error: "missing_file" })
    }

    const supabase: SupabaseConfig = {
        url: SUPABASE_URL!,
        anonKey: SUPABASE_ANON_KEY!,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
    }
    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID!,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
        bucket: R2_BUCKET!,
        publicBaseUrl: R2_PUBLIC_BASE_URL!,
    }

    // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
    const _g = await gateAdmin(String(form.get("token") ?? ""))
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    if (!(await keyframeExists(supabase, keyframeId))) {
        return jsonResponse(404, { error: "keyframe_not_found" })
    }

    const _v = await verifyUploadFile(file, {
        allow: VIDEO_KINDS,
        maxBytes: MAX_VIDEO_BYTES,
    })
    if (!_v.ok) return jsonResponse(_v.status, { error: _v.error, detail: _v.detail })

    let r2Url: string
    try {
        const uuid = crypto.randomUUID()
        const key = `Veo tu Luz Interna/Videos/Atelier/${todayDateString()}/${uuid}.${_v.ext}`
        r2Url = await uploadVideoToR2(r2, _v.bytes, key, _v.mime)
    } catch (err: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(err?.message ?? err),
        })
    }

    await patchKeyframe(supabase, keyframeId, {
        video_r2_url: r2Url,
        video_source: "manual_grok",
        anim_status: "animated",
        anim_request_id: null,
    })

    return jsonResponse(200, {
        success: true,
        keyframe_id: keyframeId,
        video_r2_url: r2Url,
        bytes: _v.size,
    })
})
