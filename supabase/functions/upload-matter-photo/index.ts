// 2026-07-21 — El nombre del producto lo lee gemini-3.5-flash-lite (era 3.5
//   Flash): tarea trivial de visión con salida mínima → ~5x más barato.
// admin/supabase/functions/upload-matter-photo/index.ts v1.2
// v1.2 — AUDITORÍA PARTE 4 — techo DIARIO por persona + FRENO GLOBAL de gasto (una cota por hora dejaba pasar 24 veces esa cifra al día, y no existía techo de ecosistema).
// v1.1 — NOMBRE AUTOMÁTICO: si el body trae { record_id, identify:true }, tras
//        subir la foto el ojo de Gemini lee el nombre comercial del frente y
//        set_matter_name_from_photo lo escribe SOLO si el registro no fue
//        nombrado por la persona (label_manual=false). Best-effort: si falla la
//        visión/RPC, la foto igual se subió (name:null). Requiere migración
//        20260721b_matter_autoname + secrets GEMINI_API_KEY + SUPABASE_URL +
//        SUPABASE_SERVICE_ROLE_KEY (los dos de Supabase ya existen). Respuesta:
//        { success, url, name }.
// v1.0 — DECODIFICADOR DE MATERIA: foto del FRENTE del producto → R2.
//        Clon de upload-avatar (gateUser + Sig V4 manual). El cliente manda
//        la imagen ya reducida (canvas ≤1400px, JPEG); aquí solo se valida
//        tamaño, se firma y se sube. La URL resultante se guarda CIFRADA en
//        matter_jobs vía set_my_matter_photo (gateway user-action) — la ruta
//        lleva uuid (imposible de adivinar) y el bucket no es listable.
//
//   POST { token, image_base64 (sin prefijo data:), image_mime }
//   →    { success, url }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy upload-matter-photo --no-verify-jwt
//
// Secrets: R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY ·
//   R2_BUCKET · R2_PUBLIC_BASE_URL · CLERK_SECRET_KEY (lo usa gateUser)

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateUser } from "../_shared/clerkAuth.ts"
import { verifyUpload, IMAGE_KINDS } from "../_shared/upload.ts"

/* AUDITORÍA PARTE 3 · gobernador de gasto. Esta edge llamaba a Gemini (leer el
   nombre del producto en la foto) sin ninguna cota: la alcanza cualquier cuenta
   gratis con sesión, así que en bucle quemaba API de pago sin techo. Reusa la
   RPC reserve_edge_spend del gobernador de la ola E. Fail-open a propósito: si
   la RPC no responde, la foto se sube igual (nunca rompe el Decodificador). */
async function reserveSpend(
    edge: string,
    userKey: string,
    ip: string,
    userLimit: number,
    ipLimit: number,
    windowSeconds: number,
    /* AUDITORÍA PARTE 4 — freno global diario (0 = sin techo, como antes). */
    globalLimit = 0
): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return true
    try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: edge,
                p_user_key: userKey,
                p_ip: ip,
                p_cost: 1,
                p_user_limit: userLimit,
                p_user_window_seconds: windowSeconds,
                p_ip_limit: ipLimit,
                p_ip_window_seconds: windowSeconds,
                p_global_limit: globalLimit,
                p_global_window_seconds: 86400,
            }),
        })
        if (!res.ok) return true
        const j = await res.json().catch(() => null)
        return j?.ok !== false
    } catch {
        return true
    }
}

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

/* v1.1 — NOMBRE AUTOMÁTICO desde el FRENTE. Best-effort: si falla, la foto ya
   se subió igual (el nombre no bloquea nada). El ojo de Gemini lee el nombre
   comercial impreso; luego set_matter_name_from_photo lo escribe SOLO si el
   registro no fue nombrado por la persona (label_manual=false). */
const NAME_MODEL = "gemini-3.5-flash-lite"
async function readProductName(
    imageBase64: string,
    mime: string
): Promise<string | null> {
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) return null
    const prompt =
        "En la imagen está el FRENTE de un producto de consumo. Devuelve " +
        "EXCLUSIVAMENTE el nombre comercial tal como aparece impreso (marca + " +
        "nombre del producto), en máximo 6 palabras, sin comillas ni texto " +
        "extra. Si no puedes leer un nombre claro, devuelve exactamente: NONE"
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mime, data: imageBase64 } },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 40,
            thinkingConfig: { thinkingBudget: 0 },
        },
    }
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 8000)
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${NAME_MODEL}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: ctrl.signal,
            }
        )
        if (!res.ok) return null
        const j = await res.json()
        const txt = j?.candidates?.[0]?.content?.parts?.[0]?.text
        const name = String(txt ?? "")
            .trim()
            .replace(/^["'`]+|["'`]+$/g, "")
            .slice(0, 120)
        if (!name || /^none$/i.test(name)) return null
        return name
    } catch {
        return null
    } finally {
        clearTimeout(to)
    }
}
async function setNameFromPhoto(
    clerkId: string,
    recordId: string,
    name: string
): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return false
    try {
        const res = await fetch(
            `${supaUrl}/rest/v1/rpc/set_matter_name_from_photo`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                },
                body: JSON.stringify({
                    p_clerk_user_id: clerkId,
                    p_record_id: recordId,
                    p_name: name,
                }),
            }
        )
        if (!res.ok) return false
        const j = await res.json().catch(() => null)
        return j?.applied === true
    } catch {
        return false
    }
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

    // Tipo real por firma de bytes; el peso se corta antes de decodificar.
    const _v = verifyUpload(String(body?.image_base64 ?? ""), {
        allow: IMAGE_KINDS,
        maxBytes: MAX_BYTES,
    })
    if (!_v.ok) return jsonResponse(_v.status, { error: _v.error, detail: _v.detail })

    const _ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("cf-connecting-ip") ??
        ""

    // Cota de SUBIDA (almacenamiento/egress). Holgada: no estorba el uso real.
    /* Parte 4 — la ventana pasa a DIARIA + freno global de ecosistema.
       Una cota por hora dejaba pasar 24 veces esa cifra al día. */
    if (!(await reserveSpend("upload-matter-photo", _g.userId!, _ip, 150, 300, 86400, 8000))) {
        return jsonResponse(429, { error: "rate_limited" })
    }

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
        const key = `Materia/Fotos/${safeId(_g.userId!)}/${crypto.randomUUID()}.${_v.ext}`
        const url = await uploadToR2(r2, _v.bytes, key, _v.mime)
        /* v1.1 — Nombre automático (best-effort, no bloquea la subida). Solo si
           el cliente lo pide (identify) y hay registro. La escritura respeta el
           nombre manual (label_manual) en la RPC. */
        let name: string | null = null
        const recordId = String(body?.record_id ?? "").trim()
        if (body?.identify === true && recordId) {
            try {
                // Gobernador del gasto de Gemini (lo que cuesta dinero).
                if (
                    !(await reserveSpend(
                        "upload-matter-photo-vision",
                        _g.userId!,
                        _ip,
                        80,
                        160,
                        86400,
                        4000
                    ))
                ) {
                    return jsonResponse(200, { success: true, url, name: null })
                }
                const read = await readProductName(_v.b64, _v.mime)
                if (read && (await setNameFromPhoto(_g.userId!, recordId, read)))
                    name = read
            } catch {
                /* el nombre es opcional; la foto ya está subida */
            }
        }
        return jsonResponse(200, { success: true, url, name })
    } catch (err: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(err?.message ?? err),
        })
    }
})
