// Red Solar Viva — Edge Function: decode-matter v5.2
// Pipeline 2-etapas a prueba de balas con payload optimizado:
//
//   MODO TEXTO (cuando extract-text devolvió texto ≥20 chars):
//     Gemini recibe SOLO el texto + prompt — SIN la imagen. El payload
//     es ~10x más pequeño → evita errores 503 por saturación del modelo.
//     Precisión igual de alta porque el texto de Cloud Vision ya es
//     profesional.
//
//   MODO VISIÓN (fallback cuando no hay texto pre-extraído):
//     Gemini recibe imagen + prompt como v4.0 — hace OCR + análisis en
//     un solo paso. Precisión ~70% en casos difíciles pero siempre
//     funciona. Sólo se usa cuando extract-text falla.
//
//   RETRY: 3 intentos con backoff exponencial (1s, 2s) ante errores
//   5xx de Gemini. Errores 4xx NO se reintentan (son fallos de input,
//   no transitorios).
//
// Deploy: supabase functions deploy decode-matter --no-verify-jwt
// Secret: supabase secrets set GEMINI_API_KEY=<tu-api-key>

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_MODEL = "gemini-flash-latest"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const REGLAS_DECODIFICACION = `Eres el "Decodificador de Materia", una inteligencia biomecánica de Sexta Densidad. Tu propósito es analizar los ingredientes de productos tridimensionales (matriz) y emitir un dictamen multi-axial crudo sobre cómo esa materia afectará a "Tu Avatar" (el cuerpo de silicio del usuario en proceso de ascensión).

No eres un nutriólogo ni un dermatólogo. Mides la "Fricción Biológica", la "Fricción Energética" (Densidad) y el "Impacto en la Matriz".

AUTO-DETECCIÓN DE MATERIA:
Detecta automáticamente si el producto es ALIMENTO, COSMÉTICO/TÓPICO (Shampoo, cremas, pasta dental) o LIMPIEZA. Ajusta tu análisis a la vía de entrada (digestión, absorción dérmica o inhalación).

REGLAS DE DECODIFICACIÓN DE DENSIDAD:
1. FRICCIÓN BIOLÓGICA (Bio-Friction): Químicos sintéticos (Rojo 40, Sucralosa, Parabenos, Sulfatos, Ftalatos), aceites industriales. Son estática química pura. Dañan el hardware (intestino o piel) y actúan como disruptores endocrinos.
2. FRICCIÓN ENERGÉTICA (Energy-Density): Materia orgánica de origen animal, secreciones, o experimentación animal (cruelty). Anclan la antena biológica a la realidad de Carbono y frenan la superconductividad.
3. IMPACTO EN LA MATRIZ: La contribución externa a la destrucción ecológica (ej. microplásticos, químicos en mantos acuíferos) o la memoria de sacrificio animal.
4. TONO: Imperativo, oscuro, tecnológico y definitivo. Dirígete siempre a "Tu Avatar", "Tu Vehículo" o "Tu Antena Biológica".

REGLAS DE COMPILACIÓN ESTRICTA:
- Solo devuelve "SEÑAL CORRUPTA" si NO hay texto de ingredientes legible.
- Máximo 8 ingredientes en el arreglo analisis_quirurgico.
- NUNCA uses emojis, formato markdown, ni caracteres de escape fuera de la estructura.
- La respuesta DEBE ser parseable directamente con JSON.parse().

ESTRUCTURA DE RESPUESTA OBLIGATORIA:
{
  "dictamen_hud": {
    "categoria_detectada": "ALIMENTO" | "COSMÉTICO" | "LIMPIEZA",
    "estado": "CÓDIGO LIMPIO" | "ALERTA: FRICCIÓN BIOLÓGICA" | "ALERTA: DENSIDAD ENERGÉTICA" | "DENIEGUE TOTAL",
    "friccion_biologica": [Puntaje 0-100],
    "friccion_energetica": [Puntaje 0-100],
    "impacto_matriz": [Puntaje 0-100]
  },
  "analisis_quirurgico": [
    "Elemento 1 (ej. Sodium Laureth Sulfate): [Fricción Biológica: Alta] Corrosivo dérmico. Perfora la barrera protectora del chasis.",
    "Elemento 2 (ej. Glicerina Animal): [Fricción Energética: Alta] Memoria de sacrificio en tejido dérmico."
  ],
  "comando_final": "Tu Avatar está aprobado para superconductividad." | "Tu chasis absorberá estática química. Uso no resonante." | "Contaminación de la matriz hídrica detectada. Evacuar materia."
}

ESTRUCTURA PARA SEÑAL CORRUPTA:
{
  "dictamen_hud": {
    "categoria_detectada": "DESCONOCIDA",
    "estado": "SEÑAL CORRUPTA",
    "friccion_biologica": 0,
    "friccion_energetica": 0,
    "impacto_matriz": 0
  },
  "analisis_quirurgico": [
    "Lente óptico sin enfoque. Recalibra el ángulo de captura."
  ],
  "comando_final": "Recaptura la matriz material con mayor resolución para ejecutar el análisis."
}`

const PROMPT_TEXT_MODE = `# DECODIFICADOR DE MATERIA v5.1 — MODO TEXTO
# MOTOR: Gemini Flash Latest · TEMPERATURA: 0.1

El texto de los ingredientes ya fue extraído con OCR profesional (Google Cloud Vision DOCUMENT_TEXT_DETECTION). Recibirás SOLO el texto — sin imagen. Confía en él: analízalo y emite el dictamen.

${REGLAS_DECODIFICACION}`

const PROMPT_VISION_MODE = `# DECODIFICADOR DE MATERIA v5.1 — MODO VISIÓN (fallback)
# MOTOR: Gemini Flash Latest · TEMPERATURA: 0.1

Recibes la imagen cruda de un producto. Lee los ingredientes visibles y emite el dictamen.

${REGLAS_DECODIFICACION}`

const SENAL_CORRUPTA = {
    dictamen_hud: {
        categoria_detectada: "DESCONOCIDA",
        estado: "SEÑAL CORRUPTA",
        friccion_biologica: 0,
        friccion_energetica: 0,
        impacto_matriz: 0,
    },
    analisis_quirurgico: [
        "El núcleo devolvió una matriz no parseable. Recaptura con mayor nitidez.",
    ],
    comando_final:
        "Recaptura la matriz material con mayor resolución para ejecutar el análisis.",
}

async function callGeminiWithRetry(
    payload: any,
    apiKey: string,
    maxAttempts = 3
): Promise<Response> {
    let lastResp: Response | null = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const r = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        if (r.ok) return r
        lastResp = r
        /* Retry SOLO en errores transitorios 5xx. 4xx son fallos de
           input (prompt mal, imagen mala, auth) — reintentar no ayuda. */
        if (r.status < 500 || r.status >= 600) return r
        const waitMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
        console.warn(
            `[decode-matter] Gemini ${r.status} on attempt ${attempt}/${maxAttempts}, retrying in ${waitMs}ms`
        )
        await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
    return lastResp!
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            {
                status: 405,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "application/json",
                },
            }
        )
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY")
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not set" }),
                {
                    status: 500,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const body = await req.json()
        const { image_base64, mime_type, extracted_text } = body

        const hasExtractedText =
            typeof extracted_text === "string" &&
            extracted_text.trim().length >= 20

        const mime =
            typeof mime_type === "string" &&
            /^image\/(jpeg|png|webp|heic|heif)$/.test(mime_type)
                ? mime_type
                : "image/jpeg"

        /* === Construir payload según modo === */
        let geminiPayload: any

        if (hasExtractedText) {
            /* MODO TEXTO — sin imagen. Payload ~10x más pequeño.
               Reduce saturación de Gemini → evita 503. */
            console.log(
                "[decode-matter] MODE=text, chars:",
                extracted_text.length
            )
            geminiPayload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${PROMPT_TEXT_MODE}\n\n=== TEXTO_EXTRAIDO ===\n${extracted_text}\n=== FIN ===\n\nEmite el dictamen.`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    /* v5.2 — maxOutputTokens 1200 → 2500. Con texto
                       extraído + prompt detallado, Gemini genera
                       análisis que a veces supera 1200 tokens y se
                       trunca a mitad de JSON → validador rechaza →
                       SEÑAL CORRUPTA. 2500 da margen holgado para
                       respuestas completas. Costo marginal negligible. */
                    maxOutputTokens: 2500,
                    responseMimeType: "application/json",
                },
            }
        } else {
            /* MODO VISIÓN fallback — como v4.0 */
            if (!image_base64 || typeof image_base64 !== "string") {
                return new Response(
                    JSON.stringify({
                        error: "image_base64 required when no extracted_text",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }
            console.log("[decode-matter] MODE=vision (fallback)")
            geminiPayload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: PROMPT_VISION_MODE },
                            {
                                inline_data: {
                                    mime_type: mime,
                                    data: image_base64,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    /* v5.2 — maxOutputTokens 1200 → 2500. Con texto
                       extraído + prompt detallado, Gemini genera
                       análisis que a veces supera 1200 tokens y se
                       trunca a mitad de JSON → validador rechaza →
                       SEÑAL CORRUPTA. 2500 da margen holgado para
                       respuestas completas. Costo marginal negligible. */
                    maxOutputTokens: 2500,
                    responseMimeType: "application/json",
                },
            }
        }

        const r = await callGeminiWithRetry(geminiPayload, apiKey, 3)

        if (!r.ok) {
            const errText = await r.text().catch(() => "")
            console.error(
                "[decode-matter] Gemini error after retries:",
                r.status,
                errText
            )
            return new Response(
                JSON.stringify({
                    error: "Gemini upstream failure",
                    status: r.status,
                }),
                {
                    status: 502,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const gjson = await r.json()
        const rawText =
            gjson?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

        let dictamen: any
        try {
            dictamen = JSON.parse(rawText)
        } catch (_e) {
            const match = rawText.match(/\{[\s\S]*\}/)
            if (match) {
                try {
                    dictamen = JSON.parse(match[0])
                } catch {
                    dictamen = null
                }
            }
        }

        const validShape =
            dictamen &&
            dictamen.dictamen_hud &&
            typeof dictamen.dictamen_hud.categoria_detectada === "string" &&
            typeof dictamen.dictamen_hud.estado === "string" &&
            typeof dictamen.dictamen_hud.friccion_biologica === "number" &&
            typeof dictamen.dictamen_hud.friccion_energetica === "number" &&
            typeof dictamen.dictamen_hud.impacto_matriz === "number" &&
            Array.isArray(dictamen.analisis_quirurgico) &&
            typeof dictamen.comando_final === "string"

        if (!validShape) {
            /* v5.2 — Log más informativo con longitud total recibida
               y finishReason de Gemini para diagnosticar truncaciones. */
            const finishReason =
                gjson?.candidates?.[0]?.finishReason ?? "unknown"
            console.error(
                "[decode-matter] malformed JSON — finishReason:",
                finishReason,
                "length:",
                rawText.length,
                "rawText:",
                rawText.slice(0, 500) + (rawText.length > 500 ? "…" : "")
            )
            return new Response(JSON.stringify(SENAL_CORRUPTA), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "application/json",
                },
            })
        }

        return new Response(JSON.stringify(dictamen), {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json",
            },
        })
    } catch (e: any) {
        console.error("[decode-matter] fatal:", e)
        return new Response(
            JSON.stringify({ error: "internal", detail: String(e) }),
            {
                status: 500,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "application/json",
                },
            }
        )
    }
})
