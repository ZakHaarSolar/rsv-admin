// admin/supabase/functions/generar-narracion-voz/index.ts v1.5
// v1.5 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend (ElevenLabs
//        cobra 1 crédito por carácter, del mismo bolsón que los audiolibros;
//        cota por-usuario 40/día + global 120/día) + TOPE DURO de 6000
//        caracteres por narración (413 si se pasa) — antes no existía ningún
//        límite de largo en esta edge.
// v1.4 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v1.3 — TOMAS ACUMULABLES + AJUSTES POR VOZ. Cada voz generada se APPENDEA
//        como una toma {voice_id, voice_name, audio_url, created_at} en
//        narration_takes_json (no pisa la anterior) — así Zak prueba varias
//        voces y las compara escuchándolas todas. narration_audio_url sigue
//        apuntando a la última. Acepta voice_name, voice_settings y model_id
//        opcionales por voz; si no vienen, usa los ajustes del canal.
// v1.2 — RITMO LENTO: speed 0.9 en voice_settings (rango ElevenLabs 0.7-1.2,
//        <1 = más lento). Da el medio-susurro hablado, pausado y contemplativo
//        del canal — no una lectura de corrida. Aplica a todas las voces.
// v1.1 — voice_settings del canal Zak'Haar (stability 0.9, similarity 0.6,
//        style 0, speaker_boost on) + output mp3 44.1kHz 128kbps.
// ---------------------------------------------------------------
// Atelier · Estudio Manual — genera la VOZ EN OFF de un storyboard con
// ElevenLabs (text-to-speech multilingüe, español), sube el mp3 a R2 y
// appendea la toma al draft. El panel reproduce todas las tomas y descarga.
//
//   POST { admin_clerk_id, draft_id, voice_id, voice_name?, voice_settings?, model_id? }
//   →    { success, narration_audio_url, take, takes }
//
// model_id default: eleven_multilingual_v2 (soporta español).
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy generar-narracion-voz --no-verify-jwt
//
// Secrets: ELEVENLABS_API_KEY (NUEVO) · SUPABASE_URL · SUPABASE_ANON_KEY ·
//   SUPABASE_SERVICE_ROLE_KEY · R2_ACCOUNT_ID · R2_ACCESS_KEY_ID ·
//   R2_SECRET_ACCESS_KEY · R2_BUCKET · R2_PUBLIC_BASE_URL

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

/* AUDITORÍA PARTE 4 · gobernador de gasto. ElevenLabs cobra 1 crédito por
   CARÁCTER y ese gasto sale del MISMO bolsón que la producción de
   audiolibros; esta edge no tenía ninguna cota más allá de la sesión de
   admin. Reusa la RPC reserve_edge_spend (mismo gobernador de la ola E /
   Parte 3, ver upload-matter-photo). Fail-open a propósito: si la RPC no
   responde, la operación sigue (nunca rompe una narración legítima). Sin
   ventana por IP (no se fijó límite para esta edge — el gobernador la salta
   con p_ip_limit:0). */
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

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const DEFAULT_MODEL_ID = "eleven_multilingual_v2"

// AUDITORÍA PARTE 4 — tope duro de largo por narración. ElevenLabs cobra 1
// crédito/carácter del mismo bolsón que los audiolibros; sin este tope una
// narración desmedida podía quemar el presupuesto de un tirón.
const MAX_NARRATION_CHARS = 6000

// Ajustes de voz por defecto del canal Zak'Haar: voz estable y serena para la
// semilla de consciencia. speed 0.9 (<1 = más lento) da el medio-susurro
// pausado. Se usan cuando la voz elegida NO trae sus propios ajustes.
const CHANNEL_VOICE_SETTINGS = {
    stability: 0.9,
    similarity_boost: 0.6,
    style: 0,
    use_speaker_boost: true,
    speed: 0.9,
}

// Tope de tomas guardadas por storyboard (las más recientes). Suficiente para
// comparar varias voces sin que la lista crezca sin freno.
const MAX_TAKES = 12

interface NarrationTake {
    voice_id: string
    voice_name: string
    audio_url: string
    created_at: string
}

// Sanea los ajustes de voz que llegan del panel: solo los campos válidos de
// ElevenLabs, en su rango. Si no hay nada usable, devuelve null (→ canal).
function sanitizeVoiceSettings(raw: any): Record<string, any> | null {
    if (!raw || typeof raw !== "object") return null
    const out: Record<string, any> = {}
    const num = (v: any, lo: number, hi: number) =>
        typeof v === "number" && isFinite(v)
            ? Math.min(hi, Math.max(lo, v))
            : undefined
    const stability = num(raw.stability, 0, 1)
    const similarity = num(raw.similarity_boost ?? raw.similarity, 0, 1)
    const style = num(raw.style, 0, 1)
    const speed = num(raw.speed, 0.7, 1.2)
    if (stability !== undefined) out.stability = stability
    if (similarity !== undefined) out.similarity_boost = similarity
    if (style !== undefined) out.style = style
    if (speed !== undefined) out.speed = speed
    if (typeof raw.use_speaker_boost === "boolean")
        out.use_speaker_boost = raw.use_speaker_boost
    return Object.keys(out).length ? out : null
}

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
    const res = await fetch(`${cfg.url}/rest/v1/rpc/get_profile_by_clerk_id`, {
        method: "POST",
        headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
            "Content-Type": "application/json",
            Prefer: "params=single-object",
        },
        body: JSON.stringify({ p_clerk_id: clerkUserId }),
    })
    if (!res.ok) return false
    const profile: any = await res.json()
    return Boolean(profile?.is_admin)
}

async function fetchDraftNarration(
    cfg: SupabaseConfig,
    draftId: string
): Promise<{ narration: string; takes: NarrationTake[] } | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_drafts?id=eq.${draftId}&select=narration,narration_takes_json`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    if (!rows[0]) return null
    const rawTakes = rows[0].narration_takes_json
    const takes: NarrationTake[] = Array.isArray(rawTakes) ? rawTakes : []
    return { narration: String(rows[0].narration ?? ""), takes }
}

// Appendea la toma nueva a la lista (tope MAX_TAKES, las más recientes) y deja
// narration_audio_url apuntando a la última. Devuelve la lista resultante.
async function appendDraftTake(
    cfg: SupabaseConfig,
    draftId: string,
    prevTakes: NarrationTake[],
    take: NarrationTake
): Promise<NarrationTake[]> {
    const merged = [...prevTakes, take].slice(-MAX_TAKES)
    await fetch(`${cfg.url}/rest/v1/vtli_drafts?id=eq.${draftId}`, {
        method: "PATCH",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({
            narration_audio_url: take.audio_url,
            narration_takes_json: merged,
        }),
    })
    return merged
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

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missing: string[] = []
    if (!ELEVENLABS_API_KEY) missing.push("ELEVENLABS_API_KEY")
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

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    let adminClerkId = ""
    const draftId = String(body?.draft_id ?? "").trim()
    const voiceId = String(body?.voice_id ?? "").trim()
    const voiceName = String(body?.voice_name ?? "").trim() || voiceId
    const modelId = String(body?.model_id ?? "").trim() || DEFAULT_MODEL_ID
    // Ajustes por voz (si el panel los manda); si no, los del canal.
    const voiceSettings =
        sanitizeVoiceSettings(body?.voice_settings) ?? CHANNEL_VOICE_SETTINGS

    if (!draftId) return jsonResponse(400, { error: "missing_draft_id" })
    if (!voiceId) return jsonResponse(400, { error: "missing_voice_id" })

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

    const draft = await fetchDraftNarration(supabase, draftId)
    if (!draft) return jsonResponse(404, { error: "draft_not_found" })
    const text = draft.narration.trim()
    if (!text) {
        return jsonResponse(422, {
            error: "draft_has_no_narration",
            detail: "El storyboard no tiene narración para vocalizar.",
        })
    }

    // AUDITORÍA PARTE 4 — tope duro de largo (ElevenLabs cobra 1 crédito/carácter).
    if (text.length > MAX_NARRATION_CHARS) {
        return jsonResponse(413, {
            error: "narration_too_long",
            detail: `La narración tiene ${text.length} caracteres; el tope es ${MAX_NARRATION_CHARS}.`,
        })
    }

    // AUDITORÍA PARTE 4 — gobernador de gasto (ElevenLabs TTS).
    if (
        !(await reserveSpend(
            "generar-narracion-voz",
            adminClerkId,
            40,
            86400,
            120,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    // ── ElevenLabs TTS
    let audioBytes: Uint8Array
    try {
        const r = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY!,
                    "Content-Type": "application/json",
                    Accept: "audio/mpeg",
                },
                body: JSON.stringify({
                    text,
                    model_id: modelId,
                    // Ajustes elegidos para ESTA voz (vienen del panel) o, si
                    // no, los del canal Zak'Haar (voz estable, serena, speed 0.9
                    // = medio-susurro pausado, no una lectura de corrida).
                    voice_settings: voiceSettings,
                }),
            }
        )
        if (!r.ok) {
            const errTxt = await r.text()
            return jsonResponse(502, {
                error: "elevenlabs_tts_failed",
                status: r.status,
                detail: errTxt.slice(0, 400),
            })
        }
        audioBytes = new Uint8Array(await r.arrayBuffer())
    } catch (err: any) {
        return jsonResponse(502, {
            error: "elevenlabs_unreachable",
            detail: String(err?.message ?? err),
        })
    }

    if (audioBytes.length === 0) {
        return jsonResponse(502, { error: "empty_audio" })
    }

    // ── R2 upload + PATCH
    let audioUrl: string
    try {
        const uuid = crypto.randomUUID()
        const key = `Veo tu Luz Interna/Audio/Atelier/${todayDateString()}/${uuid}.mp3`
        audioUrl = await uploadToR2(r2, audioBytes, key, "audio/mpeg")
    } catch (err: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(err?.message ?? err),
        })
    }

    // Appendea la toma (no pisa la anterior) → narration_takes_json + última.
    const take: NarrationTake = {
        voice_id: voiceId,
        voice_name: voiceName,
        audio_url: audioUrl,
        created_at: new Date().toISOString(),
    }
    const takes = await appendDraftTake(supabase, draftId, draft.takes, take)

    return jsonResponse(200, {
        success: true,
        draft_id: draftId,
        narration_audio_url: audioUrl,
        take,
        takes,
        bytes: audioBytes.length,
    })
})
