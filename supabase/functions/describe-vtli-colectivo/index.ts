// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/describe-vtli-colectivo/index.ts v1.4
// v1.4 — AUDITORÍA PARTE 4 — valida magic bytes + tope de tamaño con
//        _shared/upload.ts.
// v1.3 — Fallback de modelo (espejo de decode-matter v6.6): la visión prueba el
//        primario (gemini-3.5-flash) con reintentos ante 503/429 y, si se agota
//        o el alias se rompe (4xx), cae al respaldo (gemini-2.5-flash). Sobrevive
//        a la saturación de Google ("high demand") sin dejar los textos en blanco.
// v1.2 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v1.1 — GENÉRICO colectivo + ambiente. Acepta kind:"colectivo"|"ambiente":
//        con "ambiente" describe un ENTORNO (escenario) y sube la imagen a
//        .../Atelier/Ambientes/. Salida genérica { suggested_name, traits,
//        variation } para ambos (el panel mapea traits/variation al campo que
//        corresponde). Reusa todo el firmado R2 + admin gate.
// v1.0 — FASE B del cargador de Colectivos. Recibe una imagen de un colectivo
//        (civilización) → (1) la sube a R2 en
//        "Veo tu Luz Interna/Imagenes/Atelier/Colectivos/{uuid}.{ext}" con el
//        mismo firmado AWS Sig V4 manual del storyboard; (2) la describe con
//        Gemini Vision generando species_traits + individual_variation en el
//        ESTILO de los seeds (rasgos de ESPECIE fijos + margen de variación
//        individual leve, analogía humanos) + un nombre sugerido. NO guarda en
//        DB: devuelve los textos para que Zak los revise/edite en el panel y
//        después los persista vía RPC upsert_vtli_colectivo.
//
//   Input  POST { admin_clerk_id, image_base64 (sin prefijo data:), image_mime }
//   Output { image_r2_url, species_traits, individual_variation, suggested_name }
//
//   Secrets: GEMINI_API_KEY · SUPABASE_URL · SUPABASE_ANON_KEY ·
//            SUPABASE_SERVICE_ROLE_KEY · R2_ACCOUNT_ID · R2_ACCESS_KEY_ID ·
//            R2_SECRET_ACCESS_KEY · R2_BUCKET · R2_PUBLIC_BASE_URL

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"
import { verifyUpload, IMAGE_KINDS } from "../_shared/upload.ts"

declare const Deno: any

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS · CORS
   ═══════════════════════════════════════════════════════════════ */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Primario + respaldo. Si el primario está saturado (503 "high demand") o su
// alias se rompe (4xx), se prueba el respaldo. Patrón espejo de decode-matter v6.6.
const GEMINI_VISION_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash"]
const geminiVisionUrl = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const MAX_RETRIES = 4
const RETRY_DELAYS_MS = [1500, 3000, 5000]
const VISION_TIMEOUT_MS = 50_000

/* AUDITORÍA PARTE 4 — tope de tamaño de la imagen subida (magic bytes en
   _shared/upload.ts deciden el tipo real; el image_mime del cliente se ignora). */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

/* ═══════════════════════════════════════════════════════════════
   2. PROMPT — describe SOLO el ser, en el estilo de los seeds
   ═══════════════════════════════════════════════════════════════ */

// Few-shot con los 2 seeds para clavar el registro exacto. El universo (entorno,
// paleta holográfica cristalina) es FIJO y vive en el motor; el colectivo define
// SOLO el SER. Por eso le pedimos describir el ser/criatura protagonista de la
// imagen e IGNORAR el fondo.
// COLECTIVO (especie/ser). Salida genérica: { suggested_name, traits, variation }.
const VISION_SYSTEM_COLECTIVO = `Eres el catalogador de civilizaciones del universo holográfico de Zak'Haar. Recibes la imagen de un COLECTIVO (una especie de seres interdimensionales de alta frecuencia) y devuelves su ficha en español neutro.

Tu ficha tiene DOS textos, en el estilo EXACTO de estos ejemplos:

EJEMPLO A — "Cristalinos":
  traits: "Humanoide esbelto y grácil de la civilización Cristalina: piel nacarada de tono gris-perla con sutiles vetas lila y verdosas y un patrón fino de escamas/puntos sobre el cráneo; cabeza alargada y lisa sin cabello, frente amplia con una cresta central sutil; ojos grandes, claros y serenos de iris plateado-cristalino; rasgos finos, apacibles y sabios; viste una túnica larga de hilos plateados tejidos que brilla como seda metálica. Aire de archivista y sabio interdimensional."
  variation: "Cada individuo Cristalino es único dentro de la misma especie: varía SUTILMENTE el tono de piel (más perla, más lila o más plata), la densidad del patrón del cráneo, el color del iris (plata, oro pálido o cian claro), la edad aparente y la expresión. Claramente de la misma civilización, pero un ser distinto — como dos humanos distintos."

EJEMPLO B — "Tejedores de Luz":
  traits: "Humanoide alto y estilizado de la civilización Tejedora: exoestructura lisa azul-marino profundo con placas de porcelana blanco-perlada iridiscente en pecho, hombros y cráneo; cráneo alargado y liso; del dorso, la espalda y la nuca brotan numerosos filamentos finos de luz blanca que fluyen hacia atrás; extremidades largas y delgadas; rostro sereno de rasgos suaves. Aire de navegante y tejedor de redes de luz."
  variation: "Cada individuo Tejedor es único dentro de la misma especie: varía SUTILMENTE la proporción de azul vs blanco perla, la cantidad y el largo de los filamentos de luz, el matiz iridiscente (azul, violeta o cian) y el patrón de las placas. Claramente de la misma civilización, pero un ser distinto."

REGLAS:
- Describe SOLO al SER/criatura protagonista de la imagen: morfología, material/piel y su color, forma de la cabeza, ojos, rasgos del rostro, extremidades y vestuario/exoestructura. IGNORA por completo el fondo, el decorado y el entorno.
- traits: rasgos FIJOS que hacen reconocible a la ESPECIE (lo que comparten TODOS los individuos). Una sola frase rica, fiel a la imagen, terminando con un "Aire de ..." que capture su esencia/rol. 60-110 palabras.
- variation: el margen de variación individual leve, SIEMPRE arrancando con "Cada individuo ... es único dentro de la misma especie: varía SUTILMENTE ..." y enumerando 3-5 rasgos que cambian entre individuos, cerrando con "Claramente de la misma civilización, pero un ser distinto." 40-70 palabras.
- Es un ser de LUZ de alta frecuencia: color claro que irradia (nácar, cristal, plasma, porcelana, luz), NUNCA oscuro, demoníaco ni de body-horror, aunque mantén fiel su morfología real.
- suggested_name: un nombre breve y evocador para el colectivo (ej. "Cristalinos", "Tejedores de Luz", "Guardianes de Ámbar").
- Responde SOLO un objeto JSON: {"suggested_name": "...", "traits": "...", "variation": "..."}. Sin texto extra, sin markdown.`

// AMBIENTE (entorno/escenario). Salida genérica: { suggested_name, traits, variation }.
const VISION_SYSTEM_AMBIENTE = `Eres el catalogador de ENTORNOS del universo holográfico de Zak'Haar. Recibes la imagen de un AMBIENTE (un escenario donde transcurre un Reel) y devuelves su ficha en español neutro.

Tu ficha tiene DOS textos, en el estilo EXACTO de estos ejemplos:

EJEMPLO A — "Biblioteca de Cristal":
  traits: "Gran biblioteca-archivo de cristal del universo holográfico: columnas translúcidas altísimas, hileras de tablillas de luz flotantes cubiertas de glifos dorados, piso pulido con reflejos iridiscentes, partículas de luz suspendidas y god rays suaves entre las columnas. Arquitectura sagrada, limpia y luminosa, toda en cristal, plata, blanco perla y dorado. Aire de archivo cósmico del conocimiento."
  variation: "Entre Reels puede variar SUTILMENTE: la densidad de tablillas y glifos flotantes, la altura y separación de las columnas, la cantidad de partículas y god rays, y si al fondo se insinúa el cosmos o solo el cristal. Siempre la misma biblioteca de cristal, pero cada toma muestra un rincón distinto."

EJEMPLO B — "Cubierta Orbital":
  traits: "Cubierta o domo de una nave cristalina del universo holográfico: gran ventanal translúcido al cosmos, hologramas de datos de luz flotando en el aire, anillos de geometría sagrada dorada girando lento, superficies de cristal sin costuras con reflejos iridiscentes y azul cósmico profundo del espacio. Tecnología lumínica del futuro, nunca retro. Aire de puente de mando sereno entre las estrellas."
  variation: "Entre Reels puede variar SUTILMENTE: si se ve un planeta, una nebulosa o solo el campo de estrellas por el ventanal, la cantidad de hologramas y anillos de geometría, y el ángulo de la cubierta. Siempre la misma cubierta de cristal, pero cada toma es un rincón distinto."

REGLAS:
- Describe SOLO el ENTORNO/escenario de la imagen: arquitectura, materiales, luz, qué objetos y elementos lo componen, la atmósfera. IGNORA cualquier ser/persona que aparezca (eso es aparte).
- traits: rasgos FIJOS que hacen reconocible al AMBIENTE (lo que se mantiene en cada toma). Una sola frase rica, fiel a la imagen, terminando con un "Aire de ..." que capture su esencia. 60-110 palabras.
- variation: qué puede variar SUTILMENTE dentro del ambiente entre Reels, arrancando con "Entre Reels puede variar SUTILMENTE:" y enumerando 3-5 detalles, cerrando con "Siempre el mismo ambiente, pero cada toma muestra un rincón distinto." 40-70 palabras.
- El ambiente es del universo de cristal y luz, alta frecuencia: claro, luminoso, sagrado — NUNCA oscuro, retro/industrial ni de terror. Si hay tecnología, es holográfica y lumínica.
- suggested_name: un nombre breve y evocador para el ambiente (ej. "Biblioteca de Cristal", "Cubierta Orbital", "Pasillo de Portales").
- Responde SOLO un objeto JSON: {"suggested_name": "...", "traits": "...", "variation": "..."}. Sin texto extra, sin markdown.`

const VISION_USER_COLECTIVO =
    "Cataloga este colectivo. Describe SOLO al ser protagonista (ignora el fondo) y devuelve el JSON con suggested_name, traits y variation en el estilo de los ejemplos."

const VISION_USER_AMBIENTE =
    "Cataloga este ambiente. Describe SOLO el entorno/escenario (ignora cualquier ser) y devuelve el JSON con suggested_name, traits y variation en el estilo de los ejemplos."

/* ═══════════════════════════════════════════════════════════════
   3. GEMINI VISION
   ═══════════════════════════════════════════════════════════════ */

interface VisionResult {
    suggested_name: string
    traits: string
    variation: string
}

function extractJson(raw: string): VisionResult {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
    }
    const first = cleaned.indexOf("{")
    const last = cleaned.lastIndexOf("}")
    if (first === -1 || last === -1) {
        throw new Error(`Sin JSON detectable: ${cleaned.slice(0, 200)}`)
    }
    const parsed = JSON.parse(cleaned.slice(first, last + 1))
    return {
        suggested_name: String(parsed?.suggested_name ?? "").trim(),
        traits: String(
            parsed?.traits ??
                parsed?.species_traits ??
                parsed?.scene_traits ??
                ""
        ).trim(),
        variation: String(
            parsed?.variation ?? parsed?.individual_variation ?? ""
        ).trim(),
    }
}

async function callGeminiVision(
    apiKey: string,
    imageBase64: string,
    imageMime: string,
    systemPrompt: string,
    userPrompt: string
): Promise<VisionResult> {
    const payload = {
        systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }],
        },
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: imageMime,
                            data: imageBase64,
                        },
                    },
                    { text: userPrompt },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.6,
            topP: 0.95,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
        },
    }

    let lastErr: any = null
    // Recorre [primario, respaldo]. Cada modelo conserva su propio ciclo de
    // reintentos ante 5xx/429; un 4xx (alias roto) o el agotamiento de los
    // reintentos pasan directo al siguiente modelo del plan.
    for (const model of GEMINI_VISION_MODELS) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const controller = new AbortController()
            const timeoutId = setTimeout(
                () => controller.abort(),
                VISION_TIMEOUT_MS
            )
            try {
                const res = await fetch(
                    `${geminiVisionUrl(model)}?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    }
                )

                if (!res.ok) {
                    const errBody = await res.text()
                    const transient = res.status === 429 || res.status >= 500
                    if (transient && attempt < MAX_RETRIES - 1) {
                        const base = RETRY_DELAYS_MS[attempt] ?? 3000
                        const delay = res.status === 429 ? base * 3 : base
                        console.warn(
                            `[colectivo:vision] ${res.status} en ${model} retry ${
                                attempt + 1
                            } (espera ${delay}ms)`,
                            errBody.slice(0, 200)
                        )
                        await sleep(delay)
                        continue
                    }
                    // 4xx (alias roto) o reintentos agotados → siguiente modelo.
                    lastErr = new Error(
                        `Gemini vision ${res.status} (${model}): ${errBody.slice(
                            0,
                            500
                        )}`
                    )
                    console.warn(
                        `[colectivo:vision] ${res.status} en ${model} — cambio de modelo`
                    )
                    break
                }

                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts
                        ?.map((p: any) => p?.text ?? "")
                        .join("") ?? ""
                if (!text) throw new Error("Gemini vision: respuesta vacía")
                const parsed = extractJson(text)
                if (!parsed.traits) {
                    throw new Error(
                        `Vision sin traits. Raw: ${text.slice(0, 300)}`
                    )
                }
                if (model !== GEMINI_VISION_MODELS[0]) {
                    console.warn(
                        `[colectivo:vision] respondió el modelo de respaldo ${model}`
                    )
                }
                return parsed
            } catch (err) {
                lastErr = err
                if (attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_DELAYS_MS[attempt] ?? 3000)
                    continue
                }
                // este modelo se agotó → siguiente modelo del plan.
                break
            } finally {
                clearTimeout(timeoutId)
            }
        }
    }
    throw lastErr ?? new Error("Gemini vision: agotado retries")
}

/* ═══════════════════════════════════════════════════════════════
   4. R2 UPLOAD via AWS Signature V4 manual (Web Crypto API)
   ═══════════════════════════════════════════════════════════════ */

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

async function uploadImageToR2(
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

/* ═══════════════════════════════════════════════════════════════
   5. ADMIN GATE
   ═══════════════════════════════════════════════════════════════ */

async function checkAdmin(
    url: string,
    anonKey: string,
    clerkUserId: string
): Promise<boolean> {
    try {
        const res = await fetch(`${url}/rest/v1/rpc/get_profile_by_clerk_id`, {
            method: "POST",
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                "Content-Type": "application/json",
                Prefer: "params=single-object",
            },
            body: JSON.stringify({ p_clerk_id: clerkUserId }),
        })
        if (!res.ok) return false
        const profile: any = await res.json()
        return Boolean(profile?.is_admin)
    } catch {
        return false
    }
}

/* ═══════════════════════════════════════════════════════════════
   6. HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    admin_clerk_id?: string
    image_base64?: string
    image_mime?: string
    kind?: "colectivo" | "ambiente" // qué se describe (default colectivo)
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missing: string[] = []
    if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY")
    if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missing.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL")
    if (missing.length) {
        return jsonResponse(500, { error: "missing_secrets", missing })
    }

    let body: RequestBody
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    let adminClerkId = ""

    // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    const _v = verifyUpload(String(body.image_base64 ?? ""), {
        allow: IMAGE_KINDS,
        maxBytes: MAX_UPLOAD_BYTES,
    })
    if (!_v.ok) return jsonResponse(_v.status, { error: _v.error, detail: _v.detail })

    const kind = body.kind === "ambiente" ? "ambiente" : "colectivo"
    const folder = kind === "ambiente" ? "Ambientes" : "Colectivos"
    const systemPrompt =
        kind === "ambiente" ? VISION_SYSTEM_AMBIENTE : VISION_SYSTEM_COLECTIVO
    const userPrompt =
        kind === "ambiente" ? VISION_USER_AMBIENTE : VISION_USER_COLECTIVO

    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID!,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
        bucket: R2_BUCKET!,
        publicBaseUrl: R2_PUBLIC_BASE_URL!,
    }

    // 1) Subir la imagen a R2.
    let imageR2Url = ""
    try {
        const key = `Veo tu Luz Interna/Imagenes/Atelier/${folder}/${crypto.randomUUID()}.${_v.ext}`
        imageR2Url = await uploadImageToR2(r2, _v.bytes, key, _v.mime)
        console.log(`[${kind}] imagen subida a R2 (${_v.bytes.length} bytes)`)
    } catch (e: any) {
        return jsonResponse(502, {
            error: "r2_upload_failed",
            detail: String(e?.message ?? e),
        })
    }

    // 2) Describir con Gemini Vision (colectivo o ambiente).
    try {
        const vision = await callGeminiVision(
            GEMINI_API_KEY!,
            _v.b64,
            _v.mime,
            systemPrompt,
            userPrompt
        )
        return jsonResponse(200, {
            image_r2_url: imageR2Url,
            suggested_name: vision.suggested_name,
            traits: vision.traits,
            variation: vision.variation,
        })
    } catch (e: any) {
        // La imagen YA está en R2: la devolvemos igual para que Zak pueda
        // escribir los textos a mano si la visión falló.
        return jsonResponse(200, {
            image_r2_url: imageR2Url,
            suggested_name: "",
            traits: "",
            variation: "",
            vision_error: String(e?.message ?? e),
        })
    }
})
