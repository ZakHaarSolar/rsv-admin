// Red Solar Viva — Edge Function: extract-text v1.4
// v1.4 — AUDITORÍA PARTE 4 — techo DIARIO por persona + FRENO GLOBAL de gasto (una cota por hora dejaba pasar 24 veces esa cifra al día, y no existía techo de ecosistema).
// v1.3 — Auditoría: budget governor (reserve_edge_spend) por usuario+IP antes de Vision (cierra M3).
// v1.2 — Blindaje anti-abuso (Ola A de seguridad). Exige un token de
// sesión de Clerk verificado (firma contra el JWKS de la instancia) y
// aplica el límite freemium del Decodificador en el servidor. Sin esto,
// cualquiera con la llave pública podía disparar Cloud Vision en bucle y
// quemar créditos. Secrets nuevos: CLERK_SECRET_KEY + SUPABASE_SERVICE_
// ROLE_KEY (ya existían en el proyecto). El cliente debe mandar
// `{ image_base64, token }`.
//
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
import { jwtVerify, createLocalJWKSet } from "https://esm.sh/jose@5.9.6"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const VISION_ENDPOINT =
    "https://vision.googleapis.com/v1/images:annotate"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* ════════════════════════════════════════════════════════════════
   Gate del Decodificador (Ola A). Verifica el token de sesión de
   Clerk contra el JWKS de NUESTRA instancia (traído con
   CLERK_SECRET_KEY → un token forjado por otra instancia no valida)
   y aplica el límite freemium (3 escaneos de por vida para no-miembros)
   en el servidor. Compartido conceptualmente con decode-matter.
   ════════════════════════════════════════════════════════════════ */
const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""
const FREE_DECODER_LIMIT = 3
const sb = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
)

let _jwks: any = null
async function instanceJwks(): Promise<any> {
    if (_jwks) return _jwks
    const r = await fetch("https://api.clerk.com/v1/jwks", {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    })
    if (!r.ok) throw new Error(`jwks_${r.status}`)
    _jwks = await r.json()
    return _jwks
}

async function gateDecoder(
    token: string | undefined | null
): Promise<{
    ok: boolean
    status?: number
    error?: string
    clerkUserId?: string
    isMember?: boolean
}> {
    if (!CLERK_SECRET) return { ok: false, status: 500, error: "auth_not_configured" }
    if (!token || typeof token !== "string")
        return { ok: false, status: 401, error: "auth_required" }
    let clerkUserId = ""
    try {
        const JWKS = createLocalJWKSet(await instanceJwks())
        const { payload } = await jwtVerify(token, JWKS, { clockTolerance: 10 })
        clerkUserId = (payload.sub || "").toString().trim()
    } catch (_e) {
        return { ok: false, status: 401, error: "invalid_token" }
    }
    if (!clerkUserId) return { ok: false, status: 401, error: "invalid_token" }

    let isMember = false
    try {
        const { data: prof } = await sb
            .from("profiles")
            .select("email")
            .eq("clerk_user_id", clerkUserId)
            .maybeSingle()
        const email = (prof?.email || "").toLowerCase().trim()
        if (email) {
            const { data: subs } = await sb
                .from("subscriptions")
                .select("id")
                .eq("email", email)
                .eq("status", "active")
                .limit(1)
            isMember = (subs?.length ?? 0) > 0
        }
    } catch (_e) {
        isMember = false
    }

    if (!isMember) {
        let count = 0
        try {
            const { data: c } = await sb.rpc("get_my_decoder_scan_count", {
                target_clerk_id: clerkUserId,
            })
            count = typeof c === "number" ? c : 0
        } catch (_e) {
            count = 0
        }
        if (count >= FREE_DECODER_LIMIT) {
            return {
                ok: false,
                status: 403,
                error: "free_limit_reached",
                clerkUserId,
                isMember,
            }
        }
    }
    return { ok: true, clerkUserId, isMember }
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

        /* Gate de seguridad: token de sesión verificado + límite freemium
           server-side. Sin esto, Cloud Vision quedaba abierto a cualquiera. */
        const gate = await gateDecoder(body?.token)
        if (!gate.ok) {
            return new Response(JSON.stringify({ error: gate.error }), {
                status: gate.status || 401,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })
        }

        /* Budget governor (Auditoría 2026-06-12): tope por usuario + por IP
           ANTES de Cloud Vision. Cierra M3 (extract-text gateaba el freemium
           pero nunca lo consumía → Vision gratis ilimitado para no-miembros).
           Fail-open si la RPC aún no existe. */
        {
            const _ip =
                req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
            const _rl = await sb.rpc("reserve_edge_spend", {
                p_edge: "extract-text",
                p_user_key: gate.clerkUserId || null,
                p_ip: _ip,
                p_cost: 1,
                p_user_limit: 120,
                p_user_window_seconds: 86400,
                p_ip_limit: 250,
                p_ip_window_seconds: 86400,
                /* AUDITORÍA PARTE 4 · la ventana pasa de HORARIA a DIARIA y
                   suma FRENO GLOBAL. Una cota por hora deja pasar 24 veces esa
                   cifra al día, así que no acotaba el gasto real; y sin techo
                   global, N cuentas abusivas sumaban sin que nada frenara la
                   factura. 120/día por persona es enorme para alguien real.
                   6000/día es el techo de TODO el ecosistema junto: la perilla
                   a subir cuando crezca la base (editar + volver a desplegar). */
                p_global_limit: 6000,
                p_global_window_seconds: 86400,
            })
            if (_rl?.data && _rl.data.ok === false) {
                return new Response(
                    JSON.stringify({
                        error: "rate_limited",
                        reason: _rl.data.reason,
                    }),
                    {
                        status: 429,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }
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
