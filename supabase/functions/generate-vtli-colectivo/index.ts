// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-vtli-colectivo/index.ts v2.1
// v2.1 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// Atelier · Zak'Haar Video — GENERADOR de Colectivos (y Ambientes) de referencia.
//
// MODO SOLO PROMPTS ($0). A diferencia de "Sintonizar nuevo Colectivo" en el
// storyboard (que crea 4-6 cuadros), esto diseña UN ser/escenario nuevo y te
// devuelve UN prompt fotorrealista listo para copiar/pegar en Nano Banana (plan
// Pro, $0). NO genera la imagen por API ni la sube a R2 — eso lo hace Zak a mano
// (pega el prompt, genera la foto, la descarga y la sube como referencia).
//
// Flujo: admin gate → (texto) inventa la ficha del ser (suggested_name + traits
// + variation) + un prompt de retrato → ensambla el prompt final (prefijo
// fotorrealista + formato 3:4) → devuelve { suggested_name, traits, variation,
// prompt }. SIN imagen, SIN R2, SIN escrituras a DB. El panel rellena la ficha,
// muestra el prompt para copiar, y Zak guarda con upsert_vtli_colectivo.
//
// kind: "colectivo" (un SER) | "ambiente" (un ESCENARIO).
//
// v2.0 — Quitada la generación de imagen por API + subida a R2 (costaba dinero).
//        Ahora solo devuelve el prompt. Secrets: solo GEMINI_API_KEY,
//        SUPABASE_URL, SUPABASE_ANON_KEY (+ SERVICE_ROLE opcional anti-duplicado).
// v1.0 — Generaba la imagen por API (descartado).
//
// Deploy: supabase functions deploy generate-vtli-colectivo --no-verify-jwt

import { gateAdmin } from "../_shared/clerkAuth.ts"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const GEMINI_TEXT_MODEL = "gemini-3.6-flash"
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`

const MAX_RETRIES = 4
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000]

function sleep(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms))
}

/* ═══════════════════════════════════════════════════════════════
   1. FORMATO 3:4 (retrato de referencia) — solo prompts → va por texto
   ═══════════════════════════════════════════════════════════════ */

const FORMAT_3X4_HEAD = `[FORMATO — IMAGEN VERTICAL 3:4 (RETRATO DE REFERENCIA)]
Genera la imagen en formato VERTICAL retrato 3:4 (más alta que ancha), tipo ficha de personaje. Si tu herramienta tiene selector de proporción, elige 3:4 (o 4:5). El sujeto centrado y completo en el marco.

`

const FORMAT_3X4_TAIL = `

[RECORDATORIO: imagen VERTICAL 3:4 (retrato), el sujeto completo, nítido y centrado sobre un fondo simple — es una FOTO DE REFERENCIA limpia, no una escena recargada.]`

/* ═══════════════════════════════════════════════════════════════
   2. PREFIJOS FOTORREALISTAS (se anteponen al prompt que se copia)
   ═══════════════════════════════════════════════════════════════ */

// Para COLECTIVO (un SER): foto de cine, ser de luz de alta frecuencia, jamás
// oscuro.
const PHOTO_REAL_BEING = `[ESTILO OBLIGATORIO — FOTOGRAFÍA FOTORREALISTA DE CINE]
RAW photo, extreme photorealism, hyperrealistic, live-action cinematography shot on ARRI Alexa 65, 85mm lens f/1.8. Real optical depth of field with natural bokeh. Micro-detailed organic textures, natural imperfections, true-to-life physics. Perfect subsurface scattering on the skin/surface. Volumetric lighting, subtle film grain, feature-film color grade, 8K resolution. Strictly photographic, indistinguishable from reality. NO 3D render, NO digital art, NO illustration.
Capturado por una cámara de cine real frente a un sujeto real: un FOTOGRAMA de película live-action, NO un render ni un dibujo. Texturas orgánicas micro-detalladas y reales: piel con poros y vello fino, superficies con imperfecciones y asimetrías naturales, ojos húmedos reales, materiales físicamente reales (cristal, agua, tela, metal con reflejos reales). Al verlo debe parecer la FOTO de un ser real, no la ilustración de un ser.

[NATURALEZA DEL SER — LUMINOSO, DE ALTA COHERENCIA, JAMÁS OSCURO NI SINIESTRO]
El protagonista es SIEMPRE un ser de altísima frecuencia: sereno, benévolo, de belleza luminosa. Si es una persona, está serena e iluminada por luz cálida. Si es un ser no humano, es un SER DE LUZ — superficie nacarada, translúcida, cristalina, de plasma o luz líquida que IRRADIA luz desde adentro, con subsurface scattering radiante, ojos serenos y luminosos, rasgos bellos y apacibles. Su superficie es de COLOR CLARO Y LUMINOSO (blanco perla, nácar, cristal claro, dorado claro, tonos pastel) — JAMÁS de color oscuro.
ILUMINACIÓN OBLIGATORIA: el ser está bien iluminado de frente o con luz envolvente, de modo que su superficie clara y luminosa SE VE por completo. PROHIBIDO mostrarlo en SILUETA, a CONTRALUZ que lo ennegrezca, en penumbra, en sombra dura o en una escena oscura que lo apague.
ESTRICTAMENTE PROHIBIDO que el ser sea: oscuro, negro, de obsidiana, gris ceniza, biomecánico siniestro, demoníaco, monstruoso, insectoide aterrador, de body-horror o de terror. Si se ve oscuro o de pesadilla, está MAL: rehazlo como un ser de LUZ radiante, sereno y de alta coherencia.

[FOTORREALISMO, NO ILUSTRACIÓN]
ESTRICTAMENTE PROHIBIDO el aspecto de: illustration, digital art, painting, 3D render, CGI, Octane, Unreal Engine, anime, cartoon, stylized, plastic, smooth, concept art, Pixar, videojuego. NADA de superficies plásticas, lisas o "perfectas" de render: la realidad tiene textura, poros, asimetrías leves e imperfecciones naturales. Si parece dibujado o renderizado en 3D, está MAL: rehazlo como FOTOGRAFÍA real de cine.

ESCENA:
`

// Para AMBIENTE (un ESCENARIO, sin protagonista).
const PHOTO_REAL_SCENE = `[ESTILO OBLIGATORIO — FOTOGRAFÍA FOTORREALISTA DE CINE]
RAW photo, extreme photorealism, hyperrealistic, live-action cinematography shot on ARRI Alexa 65, wide cinematic lens. Real optical depth of field, micro-detailed real materials, volumetric lighting, god rays, subtle film grain, feature-film color grade, 8K. Strictly photographic, indistinguishable from reality. NO 3D render, NO CGI, NO illustration, NO videogame, NO concept art.
Es la FOTO real de un LUGAR (un establishing shot de cine), NO un render ni un dibujo. Materiales físicamente reales con reflejos e imperfecciones naturales.

[ENTORNO DE ALTA FRECUENCIA — LUMINOSO, JAMÁS OSCURO NI RETRO]
El escenario es de altísima frecuencia: cristal y luz vivos, hologramas e interfaces de luz flotantes, geometría sagrada luminosa, superficies translúcidas iridiscentes, o naturaleza etérea (bosque/gruta/cosmos/cristal). Limpio, claro, luminoso y sagrado. Si hay tecnología, es del FUTURO LUMÍNICO (holográfica) — JAMÁS retro/industrial: nada de botones físicos, cables, monitores con marco, metal remachado ni consolas viejas. PROHIBIDO oscuro, siniestro o de terror.
SIN PERSONAJES: es una toma del lugar vacío, pensada como referencia de escenario.

ESCENA:
`

/* ═══════════════════════════════════════════════════════════════
   3. DISEÑADORES (Gemini texto) — inventan la ficha + el prompt del frame
   ═══════════════════════════════════════════════════════════════ */

const DESIGN_SYSTEM_COLECTIVO = `Eres el diseñador de civilizaciones del universo holográfico de Zak'Haar. Inventas UN COLECTIVO nuevo (una especie de seres interdimensionales de alta frecuencia) y devuelves su ficha + un prompt de retrato, en español neutro.

Tu ficha tiene el estilo EXACTO de estos ejemplos:

EJEMPLO A — "Cristalinos":
  traits: "Humanoide esbelto y grácil de la civilización Cristalina: piel nacarada de tono gris-perla con sutiles vetas lila y verdosas y un patrón fino de escamas/puntos sobre el cráneo; cabeza alargada y lisa sin cabello, frente amplia con una cresta central sutil; ojos grandes, claros y serenos de iris plateado-cristalino; rasgos finos, apacibles y sabios; viste una túnica larga de hilos plateados tejidos que brilla como seda metálica. Aire de archivista y sabio interdimensional."
  variation: "Cada individuo Cristalino es único dentro de la misma especie: varía SUTILMENTE el tono de piel (más perla, más lila o más plata), la densidad del patrón del cráneo, el color del iris (plata, oro pálido o cian claro), la edad aparente y la expresión. Claramente de la misma civilización, pero un ser distinto — como dos humanos distintos."

EJEMPLO B — "Tejedores de Luz":
  traits: "Humanoide alto y estilizado de la civilización Tejedora: exoestructura lisa azul-marino profundo con placas de porcelana blanco-perlada iridiscente en pecho, hombros y cráneo; cráneo alargado y liso; del dorso, la espalda y la nuca brotan numerosos filamentos finos de luz blanca que fluyen hacia atrás; extremidades largas y delgadas; rostro sereno de rasgos suaves. Aire de navegante y tejedor de redes de luz."
  variation: "Cada individuo Tejedor es único dentro de la misma especie: varía SUTILMENTE la proporción de azul vs blanco perla, la cantidad y el largo de los filamentos de luz, el matiz iridiscente (azul, violeta o cian) y el patrón de las placas. Claramente de la misma civilización, pero un ser distinto."

REGLAS:
- Inventa UN ser nuevo y coherente. Si el usuario da un brief, respétalo y desarróllalo; si no, invéntalo libremente. NO repitas los colectivos ya existentes que se listen.
- Es un ser de LUZ de alta frecuencia: color claro que irradia (nácar, cristal, plasma, porcelana, luz), sereno y bello, NUNCA oscuro, demoníaco ni de body-horror.
- traits: rasgos FIJOS que hacen reconocible a la ESPECIE (lo que comparten TODOS los individuos). Una sola frase rica, terminando con un "Aire de ..." que capture su esencia/rol. 60-110 palabras.
- variation: el margen de variación individual leve, SIEMPRE arrancando con "Cada individuo ... es único dentro de la misma especie: varía SUTILMENTE ..." y enumerando 3-5 rasgos que cambian entre individuos, cerrando con "Claramente de la misma civilización, pero un ser distinto." 40-70 palabras.
- suggested_name: un nombre breve y evocador (ej. "Cristalinos", "Tejedores de Luz", "Guardianes de Ámbar").
- portrait_prompt: el prompt para generar la FOTO de referencia de UN individuo de la especie, en español. Describe al ser ENTERO y con detalle (morfología, material/piel y color, cabeza, ojos, rostro, extremidades, vestuario/exoestructura), de pie en PLANO ENTERO o 3/4, de frente o ligeramente en 3/4, mirando a cámara, sereno, bien iluminado con luz frontal suave, sobre un FONDO ETÉREO SIMPLE Y NEUTRO (bruma de luz clara o gradiente suave) que NO distraiga. El ser nítido, completo y centrado — una foto de referencia de personaje limpia. NO describas el estilo fotográfico (eso ya está fijado aparte): describe SOLO al ser y el encuadre. 60-120 palabras.
- Responde SOLO un objeto JSON: {"suggested_name": "...", "traits": "...", "variation": "...", "portrait_prompt": "..."}. Sin texto extra, sin markdown.`

const DESIGN_SYSTEM_AMBIENTE = `Eres el diseñador de ENTORNOS del universo holográfico de Zak'Haar. Inventas UN AMBIENTE nuevo (un escenario donde transcurre un Reel) y devuelves su ficha + un prompt de toma, en español neutro.

Tu ficha tiene el estilo EXACTO de estos ejemplos:

EJEMPLO A — "Biblioteca de Cristal":
  traits: "Gran biblioteca-archivo de cristal del universo holográfico: columnas translúcidas altísimas, hileras de tablillas de luz flotantes cubiertas de glifos dorados, piso pulido con reflejos iridiscentes, partículas de luz suspendidas y god rays suaves entre las columnas. Arquitectura sagrada, limpia y luminosa, toda en cristal, plata, blanco perla y dorado. Aire de archivo cósmico del conocimiento."
  variation: "Entre Reels puede variar SUTILMENTE: la densidad de tablillas y glifos flotantes, la altura y separación de las columnas, la cantidad de partículas y god rays, y si al fondo se insinúa el cosmos o solo el cristal. Siempre la misma biblioteca de cristal, pero cada toma muestra un rincón distinto."

EJEMPLO B — "Cubierta Orbital":
  traits: "Cubierta o domo de una nave cristalina del universo holográfico: gran ventanal translúcido al cosmos, hologramas de datos de luz flotando en el aire, anillos de geometría sagrada dorada girando lento, superficies de cristal sin costuras con reflejos iridiscentes y azul cósmico profundo del espacio. Tecnología lumínica del futuro, nunca retro. Aire de puente de mando sereno entre las estrellas."
  variation: "Entre Reels puede variar SUTILMENTE: si se ve un planeta, una nebulosa o solo el campo de estrellas por el ventanal, la cantidad de hologramas y anillos de geometría, y el ángulo de la cubierta. Siempre la misma cubierta de cristal, pero cada toma es un rincón distinto."

REGLAS:
- Inventa UN entorno nuevo y coherente. Si el usuario da un brief, respétalo; si no, invéntalo libremente. NO repitas los ambientes ya existentes que se listen.
- El ambiente es de cristal y luz, alta frecuencia: claro, luminoso, sagrado — NUNCA oscuro, retro/industrial ni de terror. Si hay tecnología, es holográfica y lumínica.
- traits: rasgos FIJOS que hacen reconocible al AMBIENTE. Una sola frase rica, terminando con un "Aire de ..." que capture su esencia. 60-110 palabras.
- variation: qué puede variar SUTILMENTE entre Reels, arrancando con "Entre Reels puede variar SUTILMENTE:" y enumerando 3-5 detalles, cerrando con "Siempre el mismo ambiente, pero cada toma muestra un rincón distinto." 40-70 palabras.
- suggested_name: un nombre breve y evocador (ej. "Biblioteca de Cristal", "Cubierta Orbital", "Pasillo de Portales").
- portrait_prompt: el prompt para generar la FOTO de referencia del ambiente VACÍO (sin personajes), en español. Un establishing shot amplio que muestre la arquitectura, los materiales, la luz y los elementos clave del lugar, bien iluminado. NO describas el estilo fotográfico (ya está fijado aparte): describe SOLO el entorno y el encuadre. 60-120 palabras.
- Responde SOLO un objeto JSON: {"suggested_name": "...", "traits": "...", "variation": "...", "portrait_prompt": "..."}. Sin texto extra, sin markdown.`

/* ═══════════════════════════════════════════════════════════════
   4. GEMINI — DISEÑO (texto)
   ═══════════════════════════════════════════════════════════════ */

interface DesignResult {
    suggested_name: string
    traits: string
    variation: string
    portrait_prompt: string
}

function extractDesign(raw: string): DesignResult {
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
    const p = JSON.parse(cleaned.slice(first, last + 1))
    return {
        suggested_name: String(p?.suggested_name ?? "").trim(),
        traits: String(
            p?.traits ?? p?.species_traits ?? p?.scene_traits ?? ""
        ).trim(),
        variation: String(
            p?.variation ?? p?.individual_variation ?? ""
        ).trim(),
        portrait_prompt: String(
            p?.portrait_prompt ?? p?.prompt ?? ""
        ).trim(),
    }
}

async function callGeminiDesign(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<DesignResult> {
    let lastErr: any = null
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: {
                        role: "system",
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        { role: "user", parts: [{ text: userPrompt }] },
                    ],
                    generationConfig: {
                        temperature: 0.95,
                        topP: 0.95,
                        maxOutputTokens: 2600,
                        responseMimeType: "application/json",
                    },
                }),
            })
            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                    continue
                }
                throw new Error(
                    `Gemini design ${res.status}: ${errBody.slice(0, 400)}`
                )
            }
            const data = await res.json()
            const text =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
            if (!text) throw new Error("Gemini design: respuesta vacía")
            const parsed = extractDesign(text)
            if (!parsed.traits || !parsed.portrait_prompt) {
                throw new Error(
                    `Diseño incompleto. Raw: ${text.slice(0, 300)}`
                )
            }
            return parsed
        } catch (err) {
            lastErr = err
            if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                continue
            }
        }
    }
    throw lastErr ?? new Error("Gemini design: agotado retries")
}

/* ═══════════════════════════════════════════════════════════════
   5. ADMIN GATE + nombres existentes (anti-duplicado)
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

async function fetchExistingNames(
    url: string,
    serviceKey: string,
    table: string
): Promise<string[]> {
    try {
        const res = await fetch(
            `${url}/rest/v1/${table}?select=name&order=created_at.desc&limit=40`,
            {
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                },
            }
        )
        if (!res.ok) return []
        const rows: any[] = await res.json()
        return rows
            .map((r) => String(r?.name ?? "").trim())
            .filter((n) => n.length > 0)
    } catch {
        return []
    }
}

/* ═══════════════════════════════════════════════════════════════
   6. ENSAMBLADO del prompt copy-paste (prefijo + escena + formato 3:4)
   ═══════════════════════════════════════════════════════════════ */

function assembleColectivoPrompt(
    photoPrefix: string,
    scenePrompt: string
): string {
    return (
        FORMAT_3X4_HEAD +
        photoPrefix +
        "\n" +
        scenePrompt.trim() +
        FORMAT_3X4_TAIL
    )
}

/* ═══════════════════════════════════════════════════════════════
   7. HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    token?: string
    admin_clerk_id?: string
    brief?: string
    kind?: "colectivo" | "ambiente"
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    const missing: string[] = []
    if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY")
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

    const kind = body.kind === "ambiente" ? "ambiente" : "colectivo"
    const table = kind === "ambiente" ? "vtli_ambientes" : "vtli_colectivos"
    const designSystem =
        kind === "ambiente"
            ? DESIGN_SYSTEM_AMBIENTE
            : DESIGN_SYSTEM_COLECTIVO
    const photoPrefix =
        kind === "ambiente" ? PHOTO_REAL_SCENE : PHOTO_REAL_BEING
    const brief = (body.brief ?? "").trim().slice(0, 800)

    // Anti-duplicado: nombres ya guardados (service role bypassa RLS).
    const existing = SUPABASE_SERVICE_ROLE_KEY
        ? await fetchExistingNames(
              SUPABASE_URL!,
              SUPABASE_SERVICE_ROLE_KEY,
              table
          )
        : []

    // DISEÑO (texto): ficha + prompt del frame. SIN imagen, SIN R2.
    let design: DesignResult
    try {
        const existingBlock = existing.length
            ? `\n\nYA EXISTEN estos (NO los repitas, inventa algo distinto): ${existing.join(", ")}.`
            : ""
        const briefBlock = brief
            ? `Brief del usuario (respétalo y desarróllalo): "${brief}".`
            : kind === "ambiente"
            ? "Sin brief: inventa un ambiente nuevo y original del universo."
            : "Sin brief: inventa un ser nuevo y original del universo."
        const userPrompt = `Diseña UN ${kind} nuevo. ${briefBlock}${existingBlock}\n\nDevuelve el JSON con suggested_name, traits, variation y portrait_prompt.`
        design = await callGeminiDesign(
            GEMINI_API_KEY!,
            designSystem,
            userPrompt
        )
    } catch (e: any) {
        return jsonResponse(502, {
            error: "design_failed",
            detail: String(e?.message ?? e),
        })
    }

    const prompt = assembleColectivoPrompt(photoPrefix, design.portrait_prompt)

    console.log(
        `[${kind}:prompts] "${design.suggested_name}" — ficha + prompt listos (sin API de imagen)`
    )

    return jsonResponse(200, {
        mode: "prompts",
        suggested_name: design.suggested_name,
        traits: design.traits,
        variation: design.variation,
        prompt,
    })
})
