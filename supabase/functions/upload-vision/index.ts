// admin/supabase/functions/upload-vision/index.ts v1.0
// v1.0 — REALIDAD ELEGIDA: fotos de la constelación del Tripulante → R2.
//        Clon de upload-avatar (gateUser + Sig V4 manual). El cliente manda
//        la imagen ya reducida (canvas ≤1400px, JPEG); aquí solo se valida
//        tamaño, se firma y se sube. La URL resultante se guarda CIFRADA en
//        vision_photos vía add_vision_photo (gateway user-action) — la ruta
//        lleva uuid (imposible de adivinar) y el bucket no es listable.
//
//   POST { token, image_base64 (sin prefijo data:), image_mime }
//   →    { success, url }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy upload-vision --no-verify-jwt
//
// Secrets: R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY ·
//   R2_BUCKET · R2_PUBLIC_BASE_URL · CLERK_SECRET_KEY (lo usa gateUser)

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateUser } from "../_shared/clerkAuth.ts"
import { verifyUpload, IMAGE_KINDS } from "../_shared/upload.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* Techo duro de la imagen decodificada (el cliente ya reduce a ≤1400px
   JPEG ~0.82 → normalmente <1 MB; 8 MB corta cualquier abuso). */
const MAX_BYTES = 8 * 1024 * 1024

/* ── R2 sig V4 (idéntico a upload-avatar / upload-wallpaper) ────────── */
interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

function bytesToHex(bytes: Uint8Array): string {
    let s = ""
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0")
    return s
}
async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf = typeof data === "string" ? new TextEncoder().encode(data) : data
    const hash = await crypto.subtle.digest("SHA-256", buf)
    return bytesToHex(new Uint8Array(hash))
}
async function hmacSha256(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
    const keyData = typeof key === "string" ? new TextEncoder().encode(key) : key
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg))
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
        `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`
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
    const encodedKey = key.split("/").map((s) => encodeURIComponent(s)).join("/")
    const baseUrl = cfg.publicBaseUrl.replace(/\/+$/, "")
    return `${baseUrl}/${encodedKey}`
}
function base64ToUint8(b64: string): Uint8Array {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
}
function extForMime(mime: string): string {
    if (mime === "image/jpeg" || mime === "image/jpg") return "jpg"
    if (mime === "image/webp") return "webp"
    return "png"
}
/* clerk_user_id → segmento de key seguro (R2). */
function safeId(id: string): string {
    return (id || "anon").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
}

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
    if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" })

    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missing: string[] = []
    if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missing.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL")
    if (missing.length) return jsonResponse(500, { error: "missing_secrets", missing })

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    // Token de Clerk verificado server-side (gateUser → JWKS). El id sale del token.
    const _g = await gateUser(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })

    // AUDITORÍA PARTE 3 · tipo real por firma de bytes; el peso se corta antes
    // de decodificar (antes se decodificaba entero y luego se medía).
    const _v = verifyUpload(String(body?.image_base64 ?? ""), {
        allow: IMAGE_KINDS,
        maxBytes: MAX_BYTES,
    })
    if (!_v.ok) return jsonResponse(_v.status, { error: _v.error, detail: _v.detail })

    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID!,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
        bucket: R2_BUCKET!,
        publicBaseUrl: R2_PUBLIC_BASE_URL!,
    }

    try {
        // Ruta con uuid → imposible de adivinar; la URL además se guarda
        // cifrada en la base (add_vision_photo).
        const key = `Vision/${safeId(_g.userId!)}/${crypto.randomUUID()}.${_v.ext}`
        const url = await uploadToR2(r2, _v.bytes, key, _v.mime)
        return jsonResponse(200, { success: true, url })
    } catch (err: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(err?.message ?? err),
        })
    }
})
