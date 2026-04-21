// Red Solar Viva — Edge Function: extract-text v1.1
// OCR profesional usando Google Cloud Vision API DOCUMENT_TEXT_DETECTION.
// Es la primera etapa del pipeline a prueba de balas del Decodificador
// de Materia. Devuelve el texto crudo de la imagen para que decode-matter
// haga el análisis contextual sin tener que "leer" la imagen.
//
// DOCUMENT_TEXT_DETECTION es el modo de Cloud Vision optimizado para
// texto denso, mal iluminado, en superficies curvas o reflectantes —
// 99%+ de precisión incluso en bolsas de aluminio brillante, botellas
// curvas, texto de bajo contraste (amarillo en morado, etc).
//
// Deploy: supabase functions deploy extract-text --no-verify-jwt
// Secret: supabase secrets set GOOGLE_CLOUD_VISION_KEY=<api-key>

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const VISION_ENDPOINT =
    "https://vision.googleapis.com/v1/images:annotate"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_KEY")
        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "GOOGLE_CLOUD_VISION_KEY not set",
                }),
                {
                    status: 500,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        /* v1.1 — Parse del body con try/catch explícito para devolver
           mensaje claro cuando el body esté vacío o mal formado (antes
           daba "Unexpected end of JSON input" al catch genérico). */
        let body: any
        try {
            const rawText = await req.text()
            console.log(
                "[extract-text] incoming body length:",
                rawText.length,
                "first 60:",
                rawText.slice(0, 60)
            )
            if (!rawText || rawText.trim().length === 0) {
                return new Response(
                    JSON.stringify({
                        error: "empty_body",
                        hint: "POST con JSON { image_base64: string }",
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
            body = JSON.parse(rawText)
        } catch (parseErr: any) {
            console.error(
                "[extract-text] JSON parse error:",
                parseErr?.message
            )
            return new Response(
                JSON.stringify({
                    error: "invalid_json",
                    detail: String(parseErr?.message || parseErr),
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

        const image_base64 = body?.image_base64
        if (!image_base64 || typeof image_base64 !== "string") {
            return new Response(
                JSON.stringify({ error: "image_base64 required" }),
                {
                    status: 400,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        /* Cloud Vision payload — DOCUMENT_TEXT_DETECTION es la mejor
           opción para etiquetas de productos:
           - Detecta orientación y la corrige automáticamente.
           - Maneja superficies curvas (botellas, latas, bolsas).
           - Robusto a brillos, reflejos y bajo contraste.
           - Extrae estructura jerárquica (paragraphs > lines > words).
           - languageHints prioriza español + inglés, los idiomas
             más comunes en productos vendidos en MX. */
        const visionPayload = {
            requests: [
                {
                    image: { content: image_base64 },
                    features: [
                        {
                            type: "DOCUMENT_TEXT_DETECTION",
                            maxResults: 1,
                        },
                    ],
                    imageContext: {
                        languageHints: ["es", "en"],
                    },
                },
            ],
        }

        const r = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visionPayload),
        })

        if (!r.ok) {
            const errText = await r.text().catch(() => "")
            console.error(
                "[extract-text] Cloud Vision error:",
                r.status,
                errText
            )
            return new Response(
                JSON.stringify({
                    error: "Cloud Vision upstream failure",
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

        const vjson = await r.json()
        const fullAnnotation = vjson?.responses?.[0]?.fullTextAnnotation
        const text = fullAnnotation?.text ?? ""

        /* Confidence aproximada: promedio de confianzas de los words
           del primer page. Para uso interno — no es estricto. */
        let confidence = 0
        try {
            const pages = fullAnnotation?.pages || []
            const confidences: number[] = []
            for (const page of pages) {
                for (const block of page.blocks || []) {
                    for (const para of block.paragraphs || []) {
                        for (const word of para.words || []) {
                            if (typeof word.confidence === "number") {
                                confidences.push(word.confidence)
                            }
                        }
                    }
                }
            }
            if (confidences.length > 0) {
                confidence =
                    confidences.reduce((a, b) => a + b, 0) /
                    confidences.length
            }
        } catch {
            confidence = 0
        }

        if (!text || text.trim().length < 3) {
            return new Response(
                JSON.stringify({
                    text: "",
                    confidence: 0,
                    error: "no_text_detected",
                }),
                {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        return new Response(
            JSON.stringify({
                text,
                confidence,
                char_count: text.length,
            }),
            {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "application/json",
                },
            }
        )
    } catch (e: any) {
        console.error("[extract-text] fatal:", e)
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
