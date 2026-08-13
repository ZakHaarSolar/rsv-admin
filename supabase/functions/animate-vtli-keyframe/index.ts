// admin/supabase/functions/animate-vtli-keyframe/index.ts v1.2
// v1.2 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend. fal.ai
//        LTX-2 cuesta ~$0.40-0.60/clip y esta edge no tenía ninguna cota más
//        allá de la sesión de admin. Cota por-usuario 15/día + global 40/día;
//        el modo rescate (reusa un request_id YA pagado) queda FUERA del gate.
// v1.1 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// ---------------------------------------------------------------
// Atelier · Estudio Manual — animar UN keyframe por API (camino auto).
// Motor: fal.ai LTX-2 Fast image-to-video (~$0.40-0.60 / 10s 1080p).
// Persistencia: vtli_draft_keyframes (video_r2_url) + Cloudflare R2.
//
// QUÉ HACE
//   Toma un keyframe ya generado (image_r2_url + prompt_animation) y lo
//   anima: manda la imagen + el prompt de movimiento a LTX-2 Fast, hace
//   polling al queue de fal.ai, baja el mp4, lo sube a R2 y PATCH del
//   keyframe (video_r2_url + video_source='api_ltx' + anim_status).
//   Es el botón "Animar por API" — el camino AUTO. El camino principal
//   (manual con Grok + subida del mp4) NO usa esta función.
//
// NOTA aspect ratio: la doc de LTX-2 reporta 16:9 como aspect nominal,
//   pero image-to-video hereda el encuadre de la imagen de entrada (el
//   keyframe es 9:16). Validar en el primer test que el clip salga
//   vertical; si sale horizontal, el camino manual con Grok (9:16 nativo)
//   es el recomendado para Reels y este botón queda para casos puntuales.
//
// Endpoints lógicos:
//   1) Animar:  POST { admin_clerk_id, keyframe_id }
//   2) Rescate: POST { admin_clerk_id, rescue_keyframe_id, fal_request_id }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy animate-vtli-keyframe --no-verify-jwt
//
// Secrets requeridos (todos ya existen):
//   FAL_KEY · SUPABASE_URL · SUPABASE_ANON_KEY ·
//   SUPABASE_SERVICE_ROLE_KEY · R2_ACCOUNT_ID · R2_ACCESS_KEY_ID ·
//   R2_SECRET_ACCESS_KEY · R2_BUCKET · R2_PUBLIC_BASE_URL

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

/* AUDITORÍA PARTE 4 · gobernador de gasto. fal.ai LTX-2 image-to-video cuesta
   ~$0.40-0.60/clip y esta edge no tenía ninguna cota más allá de la sesión
   de admin: la alcanza cualquier cuenta admin comprometida, sin techo. Reusa
   la RPC reserve_edge_spend (mismo gobernador de la ola E / Parte 3, ver
   upload-matter-photo). Fail-open a propósito: si la RPC no responde, la
   operación sigue (nunca rompe una animación legítima). Sin ventana por IP
   (no se fijó límite para esta edge — el gobernador la salta con
   p_ip_limit:0). */
async function reserveSpend(
    edge: string,
    userKey: string,
    userLimit: number,
    userWindowSeconds: number,
    globalLimit: number,
    globalWindowSeconds: number
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
                p_ip: "",
                p_cost: 1,
                p_user_limit: userLimit,
                p_user_window_seconds: userWindowSeconds,
                p_ip_limit: 0,
                p_ip_window_seconds: userWindowSeconds,
                p_global_limit: globalLimit,
                p_global_window_seconds: globalWindowSeconds,
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
declare const EdgeRuntime: any

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// fal.ai — LTX-2 Fast image-to-video. A diferencia de bytedance/seedance,
// los modelos de fal-ai SÍ llevan el prefijo "fal-ai/" en el path.
const FAL_MODEL_PATH = "fal-ai/ltx-2/image-to-video/fast"
const FAL_SUBMIT_ENDPOINT = `https://queue.fal.run/${FAL_MODEL_PATH}`

const ANIM_DURATION_SECONDS = 10 // por keyframe (clip que Zak luego une)
const ANIM_RESOLUTION = "1080p"

const POLL_INTERVAL_MS = 4_000
const POLL_MAX_MS = 7 * 60 * 1000
const DOWNLOAD_TIMEOUT_MS = 120_000

/* ═══════════════════════════════════════════════════════════════
   2. UTILITIES
   ═══════════════════════════════════════════════════════════════ */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function todayDateString(): string {
    const d = new Date()
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
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

/* ═══════════════════════════════════════════════════════════════
   3. FAL.AI — LTX-2 Fast image-to-video (async queue pattern)
   ═══════════════════════════════════════════════════════════════ */

interface FalSubmitResponse {
    request_id: string
    [key: string]: any
}

type FalStatus =
    | "IN_QUEUE"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"

interface FalStatusResponse {
    status: FalStatus
    error?: string | null
}

interface FalVideoResult {
    video?: { url: string; content_type?: string; file_name?: string }
    [key: string]: any
}

async function submitFalAnimation(
    falKey: string,
    imageUrl: string,
    prompt: string
): Promise<FalSubmitResponse> {
    const res = await fetch(FAL_SUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt,
            image_url: imageUrl,
            resolution: ANIM_RESOLUTION,
            duration: String(ANIM_DURATION_SECONDS),
            // Reels llevan música externa; el audio nativo no es necesario
            // y evita rechazos de moderación.
            generate_audio: false,
        }),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `fal.ai submit ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    const data = await res.json()
    if (!data?.request_id) {
        throw new Error(
            `fal.ai submit: sin request_id: ${JSON.stringify(data).slice(0, 300)}`
        )
    }
    return data as FalSubmitResponse
}

async function pollFalStatus(
    falKey: string,
    requestId: string
): Promise<FalStatusResponse> {
    const url = `${FAL_SUBMIT_ENDPOINT}/requests/${requestId}/status`
    const startedAt = Date.now()
    while (Date.now() - startedAt < POLL_MAX_MS) {
        await sleep(POLL_INTERVAL_MS)
        const res = await fetch(url, {
            headers: { Authorization: `Key ${falKey}` },
        })
        if (!res.ok) {
            console.warn(`[animate:poll] ${requestId} status GET ${res.status}`)
            continue
        }
        const data: FalStatusResponse = await res.json()
        if (
            data.status === "COMPLETED" ||
            data.status === "FAILED" ||
            data.status === "CANCELLED"
        ) {
            return data
        }
    }
    throw new Error(`fal.ai polling timeout (request ${requestId})`)
}

async function fetchFalResult(
    falKey: string,
    requestId: string
): Promise<FalVideoResult> {
    const url = `${FAL_SUBMIT_ENDPOINT}/requests/${requestId}`
    const res = await fetch(url, {
        headers: { Authorization: `Key ${falKey}` },
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `fal.ai result GET ${res.status}: ${errBody.slice(0, 400)}`
        )
    }
    return (await res.json()) as FalVideoResult
}

async function downloadVideo(url: string): Promise<Uint8Array> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
    try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
            throw new Error(`Download ${res.status}: ${url.slice(0, 100)}`)
        }
        return new Uint8Array(await res.arrayBuffer())
    } finally {
        clearTimeout(timeoutId)
    }
}

/* ═══════════════════════════════════════════════════════════════
   4. R2 UPLOAD (Sig V4 manual)
   ═══════════════════════════════════════════════════════════════ */

interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

function s3CanonicalPath(bucket: string, key: string): string {
    const segments = key.split("/").map((s) => encodeURIComponent(s))
    return `/${encodeURIComponent(bucket)}/${segments.join("/")}`
}

async function uploadVideoToR2(
    cfg: R2Config,
    bytes: Uint8Array,
    key: string
): Promise<string> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto"
    const service = "s3"
    const method = "PUT"
    const contentType = "video/mp4"

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

/* ═══════════════════════════════════════════════════════════════
   5. SUPABASE HELPERS
   ═══════════════════════════════════════════════════════════════ */

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
    if (!res.ok) {
        console.warn(`[animate:admin] check failed ${res.status}`)
        return false
    }
    const profile: any = await res.json()
    return Boolean(profile?.is_admin)
}

async function fetchKeyframeById(
    cfg: SupabaseConfig,
    keyframeId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?id=eq.${keyframeId}&select=*`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    return rows[0] ?? null
}

async function patchKeyframe(
    cfg: SupabaseConfig,
    keyframeId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
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
    if (!res.ok) {
        const errBody = await res.text()
        console.error(
            `[animate:patch] ${res.status} for ${keyframeId}: ${errBody.slice(0, 200)}`
        )
    }
}

/* ═══════════════════════════════════════════════════════════════
   6. BACKGROUND — animar (poll → download → R2 → PATCH)
   ═══════════════════════════════════════════════════════════════ */

async function animateBackground(
    falKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    keyframeId: string,
    requestId: string
): Promise<void> {
    const tStart = Date.now()
    try {
        const status = await pollFalStatus(falKey, requestId)
        if (status.status !== "COMPLETED") {
            await patchKeyframe(supabase, keyframeId, { anim_status: "failed" })
            console.error(
                `[animate:bg] ${keyframeId} fal status ${status.status}: ${status.error ?? ""}`
            )
            return
        }
        const result = await fetchFalResult(falKey, requestId)
        const videoUrl = result?.video?.url
        if (!videoUrl) {
            await patchKeyframe(supabase, keyframeId, { anim_status: "failed" })
            console.error(`[animate:bg] ${keyframeId} sin video.url en result`)
            return
        }
        const bytes = await downloadVideo(videoUrl)
        const uuid = crypto.randomUUID()
        const key = `Veo tu Luz Interna/Videos/Atelier/${todayDateString()}/${uuid}.mp4`
        const r2Url = await uploadVideoToR2(r2, bytes, key)
        await patchKeyframe(supabase, keyframeId, {
            video_r2_url: r2Url,
            video_source: "api_ltx",
            anim_status: "animated",
        })
        console.log(
            `[animate:bg] ${keyframeId} ✓ (${Date.now() - tStart}ms)`
        )
    } catch (err: any) {
        await patchKeyframe(supabase, keyframeId, { anim_status: "failed" })
        console.error(
            `[animate:bg] ${keyframeId} FAILED: ${String(err?.message ?? err)}`
        )
    }
}

function dispatchBackground(fn: Promise<void>) {
    const hasWaitUntil =
        typeof EdgeRuntime !== "undefined" &&
        typeof EdgeRuntime?.waitUntil === "function"
    if (hasWaitUntil) EdgeRuntime.waitUntil(fn)
    else fn.catch((e) => console.error("[animate:bg] crashed", e))
}

/* ═══════════════════════════════════════════════════════════════
   7. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    admin_clerk_id?: string
    keyframe_id?: string
    // rescate: si el waitUntil murió entre COMPLETED y el PATCH R2, el
    // clip queda en fal.ai sin costo extra; recuperarlo con el request_id.
    rescue_keyframe_id?: string
    fal_request_id?: string
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
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const FAL_KEY = Deno.env.get("FAL_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missingSecrets: string[] = []
    if (!FAL_KEY) missingSecrets.push("FAL_KEY")
    if (!SUPABASE_URL) missingSecrets.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missingSecrets.push("SUPABASE_ANON_KEY")
    if (!SUPABASE_SERVICE_ROLE_KEY)
        missingSecrets.push("SUPABASE_SERVICE_ROLE_KEY")
    if (!R2_ACCOUNT_ID) missingSecrets.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missingSecrets.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missingSecrets.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missingSecrets.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missingSecrets.push("R2_PUBLIC_BASE_URL")
    if (missingSecrets.length) {
        return jsonResponse(500, {
            error: "missing_secrets",
            missing: missingSecrets,
        })
    }

    let body: RequestBody
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    let adminClerkId = ""

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
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    /* ── MODO rescate ───────────────────────────────────────────── */
    const rescueId = body.rescue_keyframe_id?.trim()
    const rescueReqId = body.fal_request_id?.trim()
    if (rescueId && rescueReqId) {
        await patchKeyframe(supabase, rescueId, { anim_status: "animating" })
        dispatchBackground(
            animateBackground(FAL_KEY!, supabase, r2, rescueId, rescueReqId)
        )
        return jsonResponse(200, {
            success: true,
            mode: "rescue",
            keyframe_id: rescueId,
        })
    }

    /* ── MODO animar ────────────────────────────────────────────── */
    const keyframeId = body.keyframe_id?.trim()
    if (!keyframeId) {
        return jsonResponse(400, { error: "missing_keyframe_id" })
    }

    const kf = await fetchKeyframeById(supabase, keyframeId)
    if (!kf) return jsonResponse(404, { error: "keyframe_not_found" })

    const imageUrl = String(kf.image_r2_url ?? "").trim()
    if (!imageUrl) {
        return jsonResponse(422, {
            error: "keyframe_has_no_image",
            detail: "El keyframe no tiene image_r2_url; generá la imagen primero.",
        })
    }
    const prompt = String(kf.prompt_animation ?? "").trim() || "Movimiento sutil cinematográfico: respiración suave, leve deriva de cámara, partículas de luz flotando."

    // AUDITORÍA PARTE 4 — gobernador de gasto (fal.ai LTX-2, ~$0.40-0.60/clip).
    if (
        !(await reserveSpend(
            "animate-vtli-keyframe",
            adminClerkId,
            15,
            86400,
            40,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    // Submit a LTX-2 (sincrónico, rápido)
    let submit: FalSubmitResponse
    try {
        submit = await submitFalAnimation(FAL_KEY!, imageUrl, prompt)
    } catch (err: any) {
        await patchKeyframe(supabase, keyframeId, { anim_status: "failed" })
        return jsonResponse(502, {
            error: "fal_submit_failed",
            detail: String(err?.message ?? err),
        })
    }

    // Persistir request_id (para rescate) + marcar animating
    await patchKeyframe(supabase, keyframeId, {
        anim_status: "animating",
        anim_request_id: submit.request_id,
    })

    // BACKGROUND: poll → download → R2 → PATCH
    dispatchBackground(
        animateBackground(FAL_KEY!, supabase, r2, keyframeId, submit.request_id)
    )

    return jsonResponse(200, {
        success: true,
        async: true,
        keyframe_id: keyframeId,
        fal_request_id: submit.request_id,
        message:
            "Animación en curso (LTX-2 Fast). Polling a get_vtli_drafts_by_ids hasta que video_r2_url se popule y anim_status sea 'animated'.",
    })
})
