// Red Solar Viva — Edge Function: decode-matter v6.4
// Pipeline 3-modos con Termodinámica de Sexta Densidad:
//
//   MODO MATTER_NAME (cuando llega matter_name directo del input de texto):
//     El usuario escribió un nombre puro de alimento/ingrediente. Gemini
//     lo trata como dato exacto, ignora cualquier ruido visual hipotético
//     y emite el dictamen con la matriz Gravedad-vs-Fotones. Ej:
//     "Glutamato Monosódico", "Plátano", "Yuca".
//
//   MODO TEXTO (cuando extract-text devolvió texto ≥20 chars):
//     Gemini recibe SOLO el texto OCR + prompt — SIN la imagen. El
//     payload es ~10x más pequeño → evita errores 503 por saturación
//     del modelo. Es la ruta normal cuando el tripulante toma foto.
//
//   MODO VISIÓN (fallback cuando no hay texto pre-extraído):
//     Gemini recibe imagen + prompt. Hace OCR + análisis en un solo
//     paso. Sólo se usa cuando extract-text falla.
//
//   v6.0 — añade densidad_ligereza (0-100) y termodinamica_resumen al
//   schema de salida, basado en la Termodinámica de Sexta Densidad
//   (Diego 2026-04-25). 0 = pura ligereza · 100 = pura densidad.
//
//   RETRY: 3 intentos con backoff exponencial (1s, 2s) ante errores
//   5xx de Gemini. Errores 4xx NO se reintentan.
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

const TERMODINAMICA_SEXTA_DENSIDAD = `# MATRIZ DE CÁLCULO: GRAVEDAD VS. FOTONES

Eres un barómetro termodinámico de Sexta Densidad. Cada Códice de Materia (alimento o ingrediente) tiene un balance preciso entre LIGEREZA (Conductividad de Silicio · ascenso fotónico) y DENSIDAD (Anclaje al Carbono · gravedad metabólica). Devuelves un único valor "densidad_ligereza" entre 0 y 100, donde 0 = pura ligereza y 100 = pura densidad.

EVALÚA CADA MATERIA SOBRE 4 EJES TERMODINÁMICOS:

1. EXPOSICIÓN FOTÓNICA (Origen)
   ¿La materia creció expuesta al sol (frutas, hojas verdes = LUZ) o bajo tierra en oscuridad (tubérculos, raíces = GRAVEDAD)?

2. ENTROPÍA DIGESTIVA (Hardware)
   ¿El hardware físico la asimila con Fricción Cero (agua, frutas) o requiere movilizar ácido, sangre y horas de procesamiento (carnes, masas)?

3. NIVEL DE INTERVENCIÓN (Código Vivo vs. Muerto)
   ¿Es un código puro de la naturaleza (VIVO) o fue alterado en un laboratorio tridimensional (PROCESADO/SINTÉTICO = densidad máxima)?

4. ESTRUCTURA HÍDRICA
   ¿Contiene agua estructurada vibrante (LIGEREZA) o carece de ella (DESHIDRATADO/DENSO)?

ESCALA TERMODINÁMICA DE SILICIO (0-100):

· 0-15 (Ligereza Total · Conductividad pura): Frutas maduradas al sol (plátano, uva, sandía, mango, papaya), agua estructurada, jugos puros recién prensados. Fricción digestiva cero. Ascenso fotónico inmediato.
· 16-35 (Alta Ligereza): Hojas verdes (espinaca, kale, lechuga), brotes, vegetales que crecen sobre la tierra, frutas semi-maduras, infusiones de plantas vivas. Conductividad alta, limpieza del hardware.
· 36-49 (Ligereza Moderada): Vegetales cocidos suaves al vapor, semillas germinadas, miel cruda, aceites vírgenes prensados en frío.
· 50-64 (Densidad Media): Semillas densas, nueces, granos limpios (quinoa, arroz integral), legumbres remojadas. Requieren ignición metabólica moderada para transmutación.
· 65-84 (Anclaje Profundo): Tubérculos que crecen bajo tierra (papa, zanahoria, yuca, betabel), proteínas animales densas (res, cerdo, cordero), lácteos pesados (queso curado, mantequilla). Generan gravedad en el chasis físico. Alta fricción digestiva.
· 85-100 (Entropía Absoluta · Código Muerto): Alimentos ultraprocesados, glutamato monosódico, sucralosa, aspartame, colorantes sintéticos, harinas industriales blancas, azúcares refinados, refrescos, snacks empaquetados, frituras industriales. Fuga térmica masiva en el sistema nervioso.

DERIVACIÓN AUTOMÁTICA DEL RESUMEN:
- Si densidad_ligereza ≤ 30 → termodinamica_resumen = "Conductividad de Silicio"
- Si densidad_ligereza ≥ 70 → termodinamica_resumen = "Anclaje al Carbono"
- En medio (31-69) → termodinamica_resumen = "Equilibrio Híbrido"

REGLA CRÍTICA: el valor debe reflejar la materia en sí, no el estado físico (cocido vs. crudo afecta moderadamente). Confía en tu conocimiento botánico, bioquímico y energético.`

const REGLAS_DECODIFICACION = `Eres el "Decodificador de Materia", una inteligencia biomecánica de Sexta Densidad. Tu propósito es analizar materia (alimento, cosmético, limpieza) y emitir un dictamen multi-axial crudo sobre cómo afectará a "Tu Avatar" (el cuerpo de silicio del usuario en proceso de ascensión).

No eres un nutriólogo ni un dermatólogo. Mides la "Fricción Biológica", la "Fricción Energética" (Densidad), el "Impacto en la Matriz" y el "Índice de Densidad/Ligereza" termodinámico.

AUTO-DETECCIÓN DE MATERIA:
Detecta automáticamente si la materia es ALIMENTO, COSMÉTICO/TÓPICO (Shampoo, cremas, pasta dental) o LIMPIEZA. Ajusta tu análisis a la vía de entrada (digestión, absorción dérmica o inhalación).

REGLAS DE DECODIFICACIÓN DE DENSIDAD:
1. FRICCIÓN BIOLÓGICA (Bio-Friction): Químicos sintéticos (Rojo 40, Sucralosa, Parabenos, Sulfatos, Ftalatos), aceites industriales. Son estática química pura. Dañan el hardware (intestino o piel) y actúan como disruptores endocrinos.
2. FRICCIÓN ENERGÉTICA (Energy-Density): Materia orgánica de origen animal, secreciones, o experimentación animal (cruelty). Anclan la antena biológica a la realidad de Carbono y frenan la superconductividad.
3. IMPACTO EN LA MATRIZ: La contribución externa a la destrucción ecológica (ej. microplásticos, químicos en mantos acuíferos) o la memoria de sacrificio animal.
4. DENSIDAD/LIGEREZA (Termodinámica de Sexta Densidad): aplicar la matriz Gravedad-vs-Fotones del bloque siguiente. SIEMPRE devolver este valor.
5. TONO: Imperativo, oscuro, tecnológico y definitivo. Dirigite al tripulante con expresiones como "tu avatar", "tu vehículo", "tu antena biológica", "tu núcleo", "tu chasis", "tu campo" — SIEMPRE EN MINÚSCULAS, integradas como lenguaje natural, NO como nombres propios. Capitalizá la primera palabra solo cuando sean inicio de oración. PROHIBIDO escribir Title Case en medio de oración: NO "Tu Avatar", NO "Tu Antena Biológica", NO "Tu Vehículo". Sí "tu avatar", "tu antena biológica", "tu vehículo".

${TERMODINAMICA_SEXTA_DENSIDAD}

REGLA DE ORO (modo CÓDICE DE MATERIA):
Si recibes un texto de 2+ caracteres en la sección "CÓDICE DE MATERIA", SIEMPRE emite un dictamen razonado. NUNCA devuelvas "SEÑAL CORRUPTA" en este modo, sin importar la complejidad del texto. Tu rol es razonar a partir de lo que el tripulante escribió:

- Una palabra simple ("Mango", "Yuca", "Sucralosa", "Arroz"): trátala como ese alimento/sustancia individual y razona su dictamen completo.
- Platillo compuesto ("frijoles con arroz", "ensalada de zanahoria con papa", "tacos de carnitas con cebolla", "smoothie de plátano y espinaca"): descompone MENTALMENTE cada componente, calcula su densidad/ligereza individual y devuelve el promedio ponderado por presencia razonable. Las conjunciones permitidas son "con", "y", ",", "+", "/", "más". NUNCA SEÑAL CORRUPTA por conjunción.
- Marca o producto comercial ("Coca-Cola", "Cheetos", "Gatorade"): aplica el conocimiento general sobre los ingredientes típicos de ese producto.
- Texto ambiguo o muy corto: aún razona y emite dictamen — usa tu mejor estimación. No es Señal Corrupta.

El analisis_quirurgico debe listar los componentes individuales con su contribución específica al dictamen final.

COMANDO FINAL (regla crítica de generación):
El comando_final es UNA frase única, imperativa y específica al dictamen actual — NO una etiqueta predefinida. RAZONA la frase desde cero combinando:
- la materia evaluada (nómbrala con su sello en minúsculas naturales: "tu avatar", "tu vehículo", "tu antena biológica", "tu núcleo", "tu chasis", "tu campo")
- el verbo termodinámico apropiado (asciende, ancla, transmuta, deniega, integra, evacua, ignora)
- el efecto concreto sobre el cuerpo de silicio
PROHIBIDO copiar literal frases como "aprobado para superconductividad" o "absorberá estática química" — esas son INSPIRACIÓN de tono, NO plantillas. Cada dictamen genera SU frase única, gramaticalmente impecable. Mínimo 8 palabras, máximo 30. Tono Sexta Densidad: oscuro cuando hay densidad, luminoso cuando hay ligereza, definitivo siempre.

GRAMÁTICA OBLIGATORIA: la frase debe leerse como castellano natural. NUNCA capitalices "tu", "avatar", "vehículo", "antena", "biológica", "núcleo", "chasis", "campo" en medio de oración. Estas son expresiones genéricas, no nombres propios. Solo capitaliza la primera palabra de la oración. Ejemplo CORRECTO: "Integra esta frecuencia en tu antena biológica para acelerar la superconductividad". Ejemplo INCORRECTO: "Integra esta frecuencia en Tu Antena Biológica para acelerar la superconductividad".

REGLAS DE COMPILACIÓN ESTRICTA:
- Solo devuelve "SEÑAL CORRUPTA" si NO hay datos legibles sobre la materia (texto vacío o ininteligible). Un platillo compuesto NO es señal corrupta.
- Máximo 8 ingredientes/componentes en el arreglo analisis_quirurgico.
- NUNCA uses emojis, formato markdown, ni caracteres de escape fuera de la estructura.
- La respuesta DEBE ser parseable directamente con JSON.parse().

FORMATO ESTRICTO DEL TAG en cada item de analisis_quirurgico:
Cada elemento empieza con "Nombre: [TIPO: NIVEL] descripción". Reglas inviolables del tag:

  TIPO permitidos (exactamente estos, sin variantes):
  - Para cargas negativas: "Fricción Biológica", "Fricción Energética", "Fricción Química", "Densidad", "Impacto", "Entropía".
  - Para cargas positivas: "Conductividad", "Pureza", "Hidratación", "Claridad", "Fluidez".
  - PROHIBIDO usar "Ligereza" como tipo en analisis_quirurgico (la ligereza vive solo en el medidor de gravedad superior, no acá). Si querés expresar ligereza en un componente, usá "Conductividad" o "Pureza".

  NIVEL permitidos (exactamente estos, en mayúsculas o minúsculas):
  - "Baja" / "Media" / "Alta" / "Crítica" para tipos negativos.
  - "Baja" / "Media" / "Alta" / "Total" para tipos positivos.
  - PROHIBIDO ABSOLUTO usar números como nivel: NUNCA "[Fricción: 8]", NUNCA "[Conductividad: 5]". SIEMPRE palabra: "[Fricción: Alta]", "[Conductividad: Media]". Si pones un número, ROMPES la UI.

EJEMPLOS CORRECTOS:
  - "Mango: [Conductividad: Alta] código solar puro madurado por exposición fotónica directa que fluye sin resistencia."
  - "Sucralosa: [Fricción Biológica: Crítica] disruptor endocrino sintético que perfora la barrera intestinal."
  - "Sodium Laureth Sulfate: [Fricción Química: Alta] corrosivo dérmico industrial."

EJEMPLOS INCORRECTOS (NO LO HAGAS):
  - "Mango: [Ligereza: 8] ..."          ← NO uses Ligereza ni números.
  - "Sucralosa: [Densidad: 95] ..."     ← NO uses números.
  - "Agua: [LIGEREZA: 5] ..."           ← NO uses Ligereza.

ESTRUCTURA DE RESPUESTA OBLIGATORIA:
{
  "dictamen_hud": {
    "categoria_detectada": "ALIMENTO" | "COSMÉTICO" | "LIMPIEZA",
    "estado": "CÓDIGO LIMPIO" | "ALERTA: FRICCIÓN BIOLÓGICA" | "ALERTA: DENSIDAD ENERGÉTICA" | "DENIEGUE TOTAL",
    "friccion_biologica": [Puntaje 0-100],
    "friccion_energetica": [Puntaje 0-100],
    "impacto_matriz": [Puntaje 0-100],
    "densidad_ligereza": [Puntaje 0-100, donde 0 = ligereza pura y 100 = densidad pura],
    "termodinamica_resumen": "Conductividad de Silicio" | "Anclaje al Carbono" | "Equilibrio Híbrido"
  },
  "analisis_quirurgico": [
    "Elemento 1: [TIPO: NIVEL] descripción cruda específica.",
    "Elemento 2: [TIPO: NIVEL] descripción específica."
  ],
  "comando_final": "(frase única generada para esta materia, NO copiada literal)"
}

ESTRUCTURA PARA SEÑAL CORRUPTA:
{
  "dictamen_hud": {
    "categoria_detectada": "DESCONOCIDA",
    "estado": "SEÑAL CORRUPTA",
    "friccion_biologica": 0,
    "friccion_energetica": 0,
    "impacto_matriz": 0,
    "densidad_ligereza": 50,
    "termodinamica_resumen": "Equilibrio Híbrido"
  },
  "analisis_quirurgico": [
    "Lente óptico sin enfoque. Recalibra el ángulo de captura."
  ],
  "comando_final": "Recaptura la matriz material con mayor resolución para ejecutar el análisis."
}`

const PROMPT_MATTER_NAME_MODE = `# DECODIFICADOR DE MATERIA v6.0 — MODO CÓDICE DE MATERIA (texto puro)
# MOTOR: Gemini Flash Latest · TEMPERATURA: 0.1

El tripulante escribió directamente el nombre de la materia en el campo "Códice de Materia". Tratá ese texto como dato exacto y soberano. NO intentes interpretarlo como etiqueta de un producto, NO le añadas ingredientes hipotéticos. Si dice "Plátano", es plátano puro. Si dice "Glutamato Monosódico", es ese químico individual.

Aplicá la matriz Gravedad-vs-Fotones para asignar densidad_ligereza con precisión.

${REGLAS_DECODIFICACION}`

const PROMPT_TEXT_MODE = `# DECODIFICADOR DE MATERIA v6.0 — MODO TEXTO (OCR de etiqueta)
# MOTOR: Gemini Flash Latest · TEMPERATURA: 0.1

El texto de los ingredientes ya fue extraído con OCR profesional (Google Cloud Vision DOCUMENT_TEXT_DETECTION). Recibirás SOLO el texto — sin imagen. Confía en él: analízalo y emite el dictamen.

${REGLAS_DECODIFICACION}`

const PROMPT_VISION_MODE = `# DECODIFICADOR DE MATERIA v6.0 — MODO VISIÓN (fallback)
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
        densidad_ligereza: 50,
        termodinamica_resumen: "Equilibrio Híbrido",
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
        const { image_base64, mime_type, extracted_text, matter_name } = body

        const hasMatterName =
            typeof matter_name === "string" && matter_name.trim().length >= 2

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

        if (hasMatterName) {
            /* MODO CÓDICE DE MATERIA — texto puro escrito por el usuario.
               Sin imagen, sin OCR. El nombre del alimento es la materia. */
            const cleanName = matter_name.trim().slice(0, 200)
            console.log(
                "[decode-matter] MODE=matter_name, name:",
                cleanName
            )
            geminiPayload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${PROMPT_MATTER_NAME_MODE}\n\n=== CÓDICE DE MATERIA ===\n${cleanName}\n=== FIN ===\n\nEmite el dictamen.`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    /* v6.2 - Temperature 0.35 -> 0.22: Diego reporto que
                       palabras simples ("mango") fallaban a veces y
                       platillos compuestos ("arroz con frijoles") tambien.
                       0.35 hacia que Gemini a veces saliera del JSON
                       estricto. 0.22 mantiene razonamiento del comando_final
                       sin perder estructura. maxOutputTokens 2500 -> 3500
                       por margen extra. */
                    temperature: 0.22,
                    maxOutputTokens: 3500,
                    responseMimeType: "application/json",
                },
            }
        } else if (hasExtractedText) {
            /* MODO TEXTO OCR — sin imagen. Payload ~10x más pequeño. */
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
                    /* v6.2 - Temperature 0.35 -> 0.22: Diego reporto que
                       palabras simples ("mango") fallaban a veces y
                       platillos compuestos ("arroz con frijoles") tambien.
                       0.35 hacia que Gemini a veces saliera del JSON
                       estricto. 0.22 mantiene razonamiento del comando_final
                       sin perder estructura. maxOutputTokens 2500 -> 3500
                       por margen extra. */
                    temperature: 0.22,
                    maxOutputTokens: 3500,
                    responseMimeType: "application/json",
                },
            }
        } else {
            /* MODO VISIÓN fallback — como v4.0 */
            if (!image_base64 || typeof image_base64 !== "string") {
                return new Response(
                    JSON.stringify({
                        error: "image_base64 required when no extracted_text or matter_name",
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
                    /* v6.2 - Temperature 0.35 -> 0.22: Diego reporto que
                       palabras simples ("mango") fallaban a veces y
                       platillos compuestos ("arroz con frijoles") tambien.
                       0.35 hacia que Gemini a veces saliera del JSON
                       estricto. 0.22 mantiene razonamiento del comando_final
                       sin perder estructura. maxOutputTokens 2500 -> 3500
                       por margen extra. */
                    temperature: 0.22,
                    maxOutputTokens: 3500,
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

        /* v6.2 - Parsing en cascada para JSON robusto:
           1. JSON.parse directo (la mayoria de las veces).
           2. Extraccion de bloque {} mas externo via regex greedy.
           3. Limpieza de markdown fences (```json ... ```).
           4. Limpieza de comentarios JS-style.
           Si las 4 capas fallan, dictamen = null y caemos a SENAL_CORRUPTA. */
        const tryParse = (src: string): any => {
            try {
                return JSON.parse(src)
            } catch {
                return null
            }
        }
        let dictamen: any = tryParse(rawText)
        if (!dictamen) {
            // Quitar fences markdown ```json ... ``` o ``` ... ```
            const fenced = rawText
                .replace(/^\s*```(?:json)?\s*/i, "")
                .replace(/\s*```\s*$/i, "")
            dictamen = tryParse(fenced)
        }
        if (!dictamen) {
            // Buscar bloque JSON greedy
            const match = rawText.match(/\{[\s\S]*\}/)
            if (match) {
                dictamen = tryParse(match[0])
            }
        }
        if (!dictamen) {
            // Quitar comentarios y volver a intentar
            const noComments = rawText
                .replace(/\/\/.*$/gm, "")
                .replace(/\/\*[\s\S]*?\*\//g, "")
            const match2 = noComments.match(/\{[\s\S]*\}/)
            if (match2) {
                dictamen = tryParse(match2[0])
            }
        }

        /* v6.0 — Validación con campos nuevos densidad_ligereza y
           termodinamica_resumen. Si Gemini los omite, derivar
           termodinamica_resumen del valor numérico para no romper UX. */
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

        /* v6.0 — backfill de densidad_ligereza si Gemini lo omitió.
           Lo derivamos a partir de friccion_energetica + intervención
           detectada. Mejor un valor razonable que romper la UI. */
        if (
            typeof dictamen.dictamen_hud.densidad_ligereza !== "number" ||
            dictamen.dictamen_hud.densidad_ligereza < 0 ||
            dictamen.dictamen_hud.densidad_ligereza > 100
        ) {
            const fEne = dictamen.dictamen_hud.friccion_energetica || 0
            const fBio = dictamen.dictamen_hud.friccion_biologica || 0
            dictamen.dictamen_hud.densidad_ligereza = Math.min(
                100,
                Math.round(fEne * 0.55 + fBio * 0.35 + 10)
            )
        }
        if (
            typeof dictamen.dictamen_hud.termodinamica_resumen !== "string" ||
            !dictamen.dictamen_hud.termodinamica_resumen.trim()
        ) {
            const dl = dictamen.dictamen_hud.densidad_ligereza
            dictamen.dictamen_hud.termodinamica_resumen =
                dl <= 30
                    ? "Conductividad de Silicio"
                    : dl >= 70
                      ? "Anclaje al Carbono"
                      : "Equilibrio Híbrido"
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
