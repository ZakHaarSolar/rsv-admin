// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// Red Solar Viva — Edge Function: decode-matter v6.19
// v6.19 — AUDITORÍA PARTE 4 — techo DIARIO por persona + FRENO GLOBAL de gasto (una cota por hora dejaba pasar 24 veces esa cifra al día, y no existía techo de ecosistema).
// v6.18 — CLASIFICACIÓN DIETÉTICA (Zak 2026-07-13): el dictamen suma el campo
//         "clasificacion_dietetica" {vegano, vegetariano, sin_gluten} (booleanos,
//         derivados de los ingredientes con regla CONSERVADORA: ante duda → false,
//         nunca afirmar una cualidad sin certeza — sin_gluten es sensible para
//         celiacos). El cliente (EV_Decoder v1.61) pinta los sellos premium
//         arriba de la Cámara de Lectura + la sección "PERFIL DEL ALIMENTO".
//         Campo OPCIONAL para el cliente: dictámenes viejos sin él renderizan
//         igual. SEÑAL CORRUPTA no lo trae (no hay ingredientes que clasificar).
// v6.17 — LENGUAJE SIN CARBONO/SILICIO en el texto generado (Zak 2026-07-13):
//         el estilo de las frases del análisis habla de densidad/entropía/
//         ligereza y del "cuerpo" (prohibición explícita de 'carbono' y
//         'silicio' en texto visible). Los ENUMS del contrato (estado,
//         termodinamica_resumen "Anclaje al Carbono"/"Conductividad de
//         Silicio") NO cambian — el cliente los re-etiqueta al mostrar
//         (Carga de Entropía / Combustible de Luz), incluidos los registros
//         viejos de la Bóveda.
// v6.16 — i18n: idioma del DISPOSITIVO. El body trae `lang` ("es"|"en", default
//         "es", retrocompatible). Los campos de TEXTO LIBRE (cada item de
//         analisis_quirurgico + comando_final) salen en ese idioma; los ENUM de
//         sistema (categoria_detectada, estado, termodinamica_resumen) y los
//         numéricos NO se traducen — la app los localiza. `lang` viaja a
//         buildMatterPayload → llega a los 3 modos (matter_name/OCR/visión) en
//         AMBOS caminos (síncrono y async). Shape del JSON intacto.
// v6.15 — (1) CASCADA con modelos NOMBRADOS, no el alias `gemini-flash-latest`
//         (crónicamente saturado del lado de Google → 503 constantes): ahora
//         gemini-3.5-flash → gemini-3-flash-preview → gemini-2.5-flash (3
//         familias; si una está saturada, las otras no). (2) GATE DEL PUSH: el
//         push "ya está listo" SOLO se dispara si el Tripulante NO lo vio en vivo
//         (gracia de 6s + chequeo de seen_at). Antes llegaba aunque ya hubieras
//         leído el dictamen.
// v6.14 — (1) BÓVEDA DE MATERIA: el job asíncrono ahora guarda el NOMBRE del
//         material (input_label) → create_matter_job lo recibe (texto: matter_name;
//         foto: se deriva del dictamen al completar). El job 'done' queda como
//         registro permanente en la galería (matter_jobs ya no se purga). (2)
//         CASCADA MÁS RÁPIDA: gemini-flash-latest 6→3 intentos antes de caer al
//         respaldo (recorta ~25s durante los picos de 503 de Google).
// v6.13 — FIX del dictamen truncado (se quedaba "decodificando" y luego SEÑAL
//         CORRUPTA con materias válidas). Causa raíz (mismo bug que decode-dream
//         v1.2): cuando la cascada cae a gemini-2.5-flash / gemini-3.5-flash —
//         modelos de RAZONAMIENTO — el "thinking" se come el presupuesto de
//         salida pensando y emite el JSON truncado (finishReason MAX_TOKENS,
//         ~299 chars, cortado a media `analisis_quirurgico`). Fix: (1) los 3
//         payloads llevan `thinkingConfig.thinkingBudget = 0` → JSON completo,
//         más rápido y barato; (2) RESCATE de JSON truncado (salvageMatter): si
//         el `dictamen_hud` ya vino completo pero el array se cortó, se reconstruye
//         con valores por defecto en vez de devolver SEÑAL CORRUPTA. Los 503 de
//         Gemini siguen siendo saturación de Google (ajena al código); el async
//         deja que la cascada termine en segundo plano.
// v6.12 — MODO ASÍNCRONO (espejo de decode-dream v1.8, a prueba de salir de la
//         app). Con `async: true` la edge crea un job 'processing' en matter_jobs
//         (create_matter_job), responde {job_id} AL INSTANTE (202), y corre la
//         cascada de Gemini en segundo plano (EdgeRuntime.waitUntil) → al
//         terminar complete_matter_job lo deja 'done' (dictamen en result) o
//         'failed' (cascada agotada por sobrecarga), registra el cupo freemium y
//         dispara un push ("Tu decodificación está lista" → revelación) si el
//         push está configurado (no-op si no). El cliente poolea get_matter_job;
//         si el Tripulante sale de la app, el job sobrevive in-flight y se revela
//         al volver. La OCR (extract-text) sigue síncrona; solo la cascada de
//         Gemini va al background. El modo síncrono (sin `async`) queda intacto
//         como fallback. La construcción del payload, la cascada, el parse y la
//         normalización se extrajeron a buildMatterPayload() + decodeMatterOnce()
//         para que ambos modos compartan exactamente la misma lógica.
//         Reintentos BOUNDED (la cascada ~13 intentos/~70s + reserve_edge_spend
//         que capea por usuario/IP) — NUNCA reintento infinito (riesgo de costo).
// v6.11 — gemini-2.0-flash está DECOMISIONADO (404) → reemplazado por el vivo
//         gemini-3.5-flash como 3er respaldo de la cascada.
// v6.10 — A PRUEBA DE SOBRECARGA (espejo de decode-dream v1.7): callGeminiWithRetry
//        pasa de 2 modelos (5 intentos, backoff sin jitter ni tope) a una CASCADA
//        de 3 (gemini-flash-latest ×6 → gemini-2.5-flash ×4 → gemini-2.0-flash ×3)
//        con backoff exponencial + JITTER + tope 9s + reintento ante caída de red.
//        ~13 intentos en ~70s absorben los picos de 503 de Gemini.
// v6.9 — Estilo del analisis_quirurgico: directiva anti-relleno-barato (basta de
//        "legumbre de carga terrestre"); descripciones elegantes/pro de marca.
// v6.8 — FIX JSON truncado: concatenar TODOS los `parts` de Gemini (antes solo parts[0]).
// v6.7 — Auditoría: budget governor (reserve_edge_spend) por usuario+IP antes de Gemini.
// v6.6 — Resiliencia de modelo. callGeminiWithRetry ahora tiene un modelo
// de RESPALDO (gemini-2.5-flash): si el primario (gemini-flash-latest)
// falla — sea por 5xx (saturación de Google) tras agotar reintentos, o por
// 4xx (el alias del modelo rotó / no existe) — reintenta con el modelo
// pineado. Esto sobrevive tanto a la saturación transitoria como a la
// deprecación del alias, que dejaban al Decodificador colgado y luego en
// "Interferencia con el núcleo de síntesis" (502 al cliente).
// v6.5 — Blindaje anti-abuso (Ola A de seguridad). (1) Exige un token de
// sesión de Clerk verificado (firma contra el JWKS de la instancia) antes
// de llamar a Gemini → se acaba el disparo anónimo que quemaba créditos.
// (2) Aplica el límite freemium (3 de por vida para no-miembros) en el
// SERVIDOR leyendo membresía + conteo real. (3) Registra el escaneo
// server-side (record_decoder_scan) → el conteo ya no se puede saltar
// omitiendo el registro desde el cliente. El cliente debe mandar `token`
// en el body. Secrets: CLERK_SECRET_KEY + SUPABASE_SERVICE_ROLE_KEY.
//
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
import { jwtVerify, createLocalJWKSet } from "https://esm.sh/jose@5.9.6"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GEMINI_MODEL = "gemini-3.6-flash"
/* v6.12 — `GEMINI_MODEL_FALLBACK` (v6.6) quedó muerto desde la cascada v6.10
   (el respaldo ahora vive en GEMINI_CASCADE) → removido. */
/* v6.10 — Cascada A PRUEBA DE SOBRECARGA (espejo de decode-dream v1.7): si el
   primario está saturado (503), baja al siguiente modelo. ~13 intentos en
   ~70s de presupuesto absorben los picos de 503 de Gemini.
   v6.15 — MODELOS ESPECÍFICOS, NO el alias saturado (a pedido de Zak): el alias
   rotativo `gemini-flash-latest` apuntaba a un modelo crónicamente saturado del
   lado de Google (503 constantes en los logs). Lo cambiamos por modelos
   nombrados de 3 familias distintas (si una está saturada, las otras no):
   gemini-3.5-flash (estable, el más capaz) → gemini-3-flash-preview (rápido y
   barato) → gemini-2.5-flash (el respaldo probado que SÍ respondía). Todos son
   modelos de razonamiento → thinkingBudget:0 en cada payload (ya seteado). */
const GEMINI_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 3 },
    { model: "gemini-3-flash-preview", attempts: 2 },
    { model: "gemini-2.5-flash", attempts: 3 },
]
const geminiUrl = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* ════════════════════════════════════════════════════════════════
   Gate del Decodificador (Ola A). Verifica el token de sesión de Clerk
   contra el JWKS de NUESTRA instancia y aplica el límite freemium en el
   servidor. `record_decoder_scan` registra el escaneo (conteo a prueba
   de bypass). Mismo patrón que extract-text.
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

const toInt = (x: any): number | null =>
    typeof x === "number" && isFinite(x) ? Math.round(x) : null

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

const REGLAS_DECODIFICACION = `Eres el "Decodificador de Materia", una inteligencia biomecánica de Sexta Densidad. Tu propósito es analizar materia (alimento, cosmético, limpieza) y emitir un dictamen multi-axial crudo sobre cómo afectará a "Tu Avatar" (el cuerpo del usuario en proceso de ascensión).

No eres un nutriólogo ni un dermatólogo. Mides la "Fricción Biológica", la "Fricción Energética" (Densidad), el "Impacto en la Matriz" y el "Índice de Densidad/Ligereza" termodinámico.

AUTO-DETECCIÓN DE MATERIA:
Detecta automáticamente si la materia es ALIMENTO, COSMÉTICO/TÓPICO (Shampoo, cremas, pasta dental) o LIMPIEZA. Ajusta tu análisis a la vía de entrada (digestión, absorción dérmica o inhalación).

REGLAS DE DECODIFICACIÓN DE DENSIDAD:
1. FRICCIÓN BIOLÓGICA (Bio-Friction): Químicos sintéticos (Rojo 40, Sucralosa, Parabenos, Sulfatos, Ftalatos), aceites industriales. Son estática química pura. Dañan el hardware (intestino o piel) y actúan como disruptores endocrinos.
2. FRICCIÓN ENERGÉTICA (Energy-Density): Materia orgánica de origen animal, secreciones, o experimentación animal (cruelty). Anclan tu biología a la densidad, elevan la entropía y frenan tu ligereza.
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
- el efecto concreto sobre el cuerpo
PROHIBIDO copiar literal frases como "aprobado para superconductividad" o "absorberá estática química" — esas son INSPIRACIÓN de tono, NO plantillas. Cada dictamen genera SU frase única, gramaticalmente impecable. Mínimo 8 palabras, máximo 30. Tono Sexta Densidad: oscuro cuando hay densidad, luminoso cuando hay ligereza, definitivo siempre.

GRAMÁTICA OBLIGATORIA: la frase debe leerse como castellano natural. NUNCA capitalices "tu", "avatar", "vehículo", "antena", "biológica", "núcleo", "chasis", "campo" en medio de oración. Estas son expresiones genéricas, no nombres propios. Solo capitaliza la primera palabra de la oración. Ejemplo CORRECTO: "Integra esta frecuencia en tu antena biológica para acelerar la superconductividad". Ejemplo INCORRECTO: "Integra esta frecuencia en Tu Antena Biológica para acelerar la superconductividad".

REGLAS DE COMPILACIÓN ESTRICTA:
- Solo devuelve "SEÑAL CORRUPTA" si NO hay datos legibles sobre la materia (texto vacío o ininteligible). Un platillo compuesto NO es señal corrupta.
- Máximo 8 ingredientes/componentes en el arreglo analisis_quirurgico.
- NUNCA uses emojis, formato markdown, ni caracteres de escape fuera de la estructura.
- La respuesta DEBE ser parseable directamente con JSON.parse().

CLASIFICACIÓN DIETÉTICA (campo obligatorio "clasificacion_dietetica", 3 booleanos):
Deriva de los ingredientes detectados si la materia cumple cada cualidad. REGLA CONSERVADORA INVIOLABLE: ante CUALQUIER duda o información incompleta, el valor es false — NUNCA afirmes una cualidad sin certeza (sin_gluten es crítico para celiacos). Los booleanos son true/false JSON crudos, NUNCA strings.
- "vegano": true solo si NINGÚN ingrediente es de origen animal (carne, pescado, lácteos, huevo, miel, gelatina, grenetina, caseína, suero/whey, lactosa, manteca animal, carmín/cochinilla, lanolina).
- "vegetariano": true solo si no hay carne, pescado, mariscos ni derivados de sacrificio (gelatina/grenetina, manteca de cerdo, caldo de carne, cuajo animal). Lácteos, huevo y miel SÍ son vegetarianos. Todo lo vegano es también vegetariano.
- "sin_gluten": true solo si no hay trigo, cebada, centeno, espelta, kamut, triticale, malta, sémola, harina de trigo, avena (salvo certificada sin gluten) ni derivados con gluten (salsa de soya común, seitán). Un alimento simple naturalmente libre (fruta, verdura, carne sola, arroz, maíz) es true.
- Para COSMÉTICO o LIMPIEZA (no se come): los tres en false.

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

ESTILO DE LA DESCRIPCIÓN (CRÍTICO — calidad de marca):
Cada descripción es UNA frase ELEGANTE, PRECISA y PROFESIONAL que nombra el MECANISMO real del componente sobre el cuerpo, con vocabulario de Sexta Densidad aplicado con criterio (conductividad, densidad, entropía, código solar, transmutación, frecuencia, ignición metabólica, fotónico). Debe sonar de alta gama, mística pero seria — NUNCA amateur. PROHIBIDO usar las palabras 'carbono' y 'silicio' en cualquier texto visible: habla de densidad, entropía y ligereza.
PROHIBIDO el relleno barato y las metáforas literales sin sustancia: nada de "legumbre de carga terrestre", "alimento de la tierra", "producto común", "cosa que comes", descripciones genéricas o infantiles. Si no aportás el mecanismo, no lo escribas.
  - EJEMPLO POBRE (NUNCA): "Habas: [Densidad: Media] legumbre de carga terrestre."
  - EJEMPLO FINO (SÍ): "Habas: [Densidad: Media] proteína de raíz telúrica — combustible denso que exige ignición metabólica para transmutarse en frecuencia utilizable."

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
  "comando_final": "(frase única generada para esta materia, NO copiada literal)",
  "clasificacion_dietetica": {
    "vegano": true | false,
    "vegetariano": true | false,
    "sin_gluten": true | false
  }
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
    _maxAttempts = 3
): Promise<Response> {
    /* CASCADA a prueba de sobrecarga (la define GEMINI_CASCADE, no _maxAttempts):
       v6.14 → gemini-flash-latest ×3 → gemini-2.5-flash ×4 → gemini-3.5-flash ×3,
       con backoff exponencial + JITTER (evita golpear en sincronía) y tope por
       espera de 9s. Un error de red (timeout/conexión) se trata como 5xx y se
       reintenta. ~10 intentos repartidos en ~60s → absorbe los picos de 503. */
    let lastResp: Response | null = null
    for (const { model, attempts } of GEMINI_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            let r: Response | null = null
            try {
                r = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            } catch (e) {
                /* error de red: trátalo como 5xx y reintenta con backoff. */
                console.warn(
                    `[decode-matter] red caída en ${model} intento ${attempt}/${attempts}: ${e}`
                )
                const waitMs =
                    Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                    Math.floor(Math.random() * 400)
                await new Promise((res) => setTimeout(res, waitMs))
                continue
            }
            if (r.ok) {
                if (model !== GEMINI_MODEL)
                    console.warn(
                        `[decode-matter] Respondió el modelo de respaldo ${model}`
                    )
                return r
            }
            lastResp = r
            /* 4xx (incl. 404 modelo no encontrado / alias roto): reintentar
               este modelo no ayuda → pasamos directo al siguiente modelo. */
            if (r.status < 500 || r.status >= 600) {
                console.warn(
                    `[decode-matter] Gemini ${r.status} en ${model} (intento ${attempt}) — no-5xx, cambio de modelo`
                )
                break
            }
            /* 5xx (503 sobrecarga): backoff exponencial con JITTER, tope 9s. */
            const waitMs =
                Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                Math.floor(Math.random() * 400)
            console.warn(
                `[decode-matter] Gemini ${r.status} en ${model} intento ${attempt}/${attempts}, reintento en ${waitMs}ms`
            )
            await new Promise((resolve) => setTimeout(resolve, waitMs))
        }
    }
    return lastResp!
}

/* ════════════════════════════════════════════════════════════════
   Construcción del payload de Gemini según el modo (matter_name / texto OCR /
   visión). Asume input ya validado (al menos uno de los tres presente; para
   visión, image_base64 presente). Compartido por el modo síncrono y el async.
   ════════════════════════════════════════════════════════════════ */
/* v6.16 — Instrucción de idioma de salida. El TEXTO LIBRE (analisis_quirurgico,
   comando_final) sale en el idioma del dispositivo; los ENUM (categoria_detectada,
   estado, termodinamica_resumen) se quedan en español canónico — la app los
   localiza. Español = comportamiento por defecto del prompt (directiva vacía). */
function outputLangDirective(lang: string): string {
    if (lang !== "en") return ""
    return `\n\n# OUTPUT LANGUAGE — ENGLISH\nWrite the FREE-TEXT fields in natural, direct English, second person (you/your), commanding not consoling: every item of "analisis_quirurgico" and "comando_final". Keep these ENUM fields EXACTLY in their canonical Spanish values — never translate them, they are system keys: "categoria_detectada", "estado", "termodinamica_resumen". Numeric fields stay numeric; the "clasificacion_dietetica" booleans stay raw JSON booleans with their Spanish keys.`
}

function buildMatterPayload(input: {
    matter_name?: any
    extracted_text?: any
    image_base64?: any
    mime_type?: any
    lang?: any
}): any {
    const { matter_name, extracted_text, image_base64, mime_type } = input
    const langDir = outputLangDirective(input.lang === "en" ? "en" : "es")
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

    if (hasMatterName) {
        /* MODO CÓDICE DE MATERIA — texto puro escrito por el usuario. */
        const cleanName = matter_name.trim().slice(0, 200)
        console.log("[decode-matter] MODE=matter_name, name:", cleanName)
        return {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${PROMPT_MATTER_NAME_MODE}\n\n=== CÓDICE DE MATERIA ===\n${cleanName}\n=== FIN ===\n\nEmite el dictamen.${langDir}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.22,
                maxOutputTokens: 3500,
                responseMimeType: "application/json",
                // v6.13 — apaga el "thinking": gemini-2.5/3.5-flash (respaldos de
                // la cascada) lo comen del presupuesto de salida → JSON truncado
                // (MAX_TOKENS) → SEÑAL CORRUPTA. Con 0 sale completo.
                thinkingConfig: { thinkingBudget: 0 },
            },
        }
    }
    if (hasExtractedText) {
        /* MODO TEXTO OCR — sin imagen. Payload ~10x más pequeño. */
        console.log(
            "[decode-matter] MODE=text, chars:",
            extracted_text.length
        )
        return {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${PROMPT_TEXT_MODE}\n\n=== TEXTO_EXTRAIDO ===\n${extracted_text}\n=== FIN ===\n\nEmite el dictamen.${langDir}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.22,
                maxOutputTokens: 3500,
                responseMimeType: "application/json",
                // v6.13 — apaga el "thinking": gemini-2.5/3.5-flash (respaldos de
                // la cascada) lo comen del presupuesto de salida → JSON truncado
                // (MAX_TOKENS) → SEÑAL CORRUPTA. Con 0 sale completo.
                thinkingConfig: { thinkingBudget: 0 },
            },
        }
    }
    /* MODO VISIÓN fallback. */
    console.log("[decode-matter] MODE=vision (fallback)")
    return {
        contents: [
            {
                role: "user",
                parts: [
                    { text: `${PROMPT_VISION_MODE}${langDir}` },
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
            temperature: 0.22,
            maxOutputTokens: 3500,
            responseMimeType: "application/json",
            // v6.13 — apaga el "thinking" (ver buildMatterPayload arriba).
            thinkingConfig: { thinkingBudget: 0 },
        },
    }
}

/* Rescata un dictamen de un JSON truncado (finishReason MAX_TOKENS): el caso
   típico es que el `dictamen_hud` (objeto plano de scalars) llegó completo pero
   el `analisis_quirurgico` se cortó a media frase. Extrae el hud por regex,
   rescata las líneas completas del análisis que alcanzaron a cerrar comillas y
   el comando si está, y rellena lo que falte. Devuelve el dictamen rescatado o
   null si ni siquiera el hud es utilizable. Espejo de salvageDream en
   decode-dream. */
function salvageMatter(raw: string): any | null {
    /* dictamen_hud es plano (sin llaves anidadas) → captura el primer {...}. */
    const m = raw.match(/"dictamen_hud"\s*:\s*(\{[^{}]*\})/)
    if (!m) return null
    let hud: any
    try {
        hud = JSON.parse(m[1])
    } catch {
        return null
    }
    if (
        !hud ||
        typeof hud.estado !== "string" ||
        typeof hud.friccion_biologica !== "number" ||
        typeof hud.friccion_energetica !== "number" ||
        typeof hud.impacto_matriz !== "number"
    )
        return null
    if (
        typeof hud.categoria_detectada !== "string" ||
        !hud.categoria_detectada.trim()
    )
        hud.categoria_detectada = "ALIMENTO"

    /* Rescata las líneas del análisis que SÍ cerraron sus comillas. */
    const items: string[] = []
    const arr = raw.match(/"analisis_quirurgico"\s*:\s*\[([\s\S]*)/)
    if (arr) {
        const re = /"((?:[^"\\]|\\.)*)"/g
        let mm: RegExpExecArray | null
        while ((mm = re.exec(arr[1])) !== null) {
            const s = mm[1]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, " ")
                .trim()
            if (s.length > 8) items.push(s)
            if (items.length >= 8) break
        }
    }
    if (items.length === 0)
        items.push(
            "Lectura parcial recuperada del núcleo — el dictamen base es válido."
        )

    /* comando_final: rescata si cerró comillas; si no, deriva uno genérico. */
    let comando = ""
    const cm = raw.match(/"comando_final"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    if (cm)
        comando = cm[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim()
    if (!comando || comando.length < 8)
        comando =
            "Integra esta lectura en tu campo; vuelve a escanear para el desglose completo."

    return {
        dictamen_hud: hud,
        analisis_quirurgico: items,
        comando_final: comando,
    }
}

/* Corre la cascada de Gemini + parse robusto + validación + backfill sobre el
   payload. Devuelve:
     · el dictamen normalizado (éxito),
     · SENAL_CORRUPTA (Gemini respondió pero el JSON es inválido — resultado
       válido para mostrar "recaptura"; el caller NO registra el escaneo),
     · null (falla upstream de Gemini tras agotar la cascada → 502 / job 'failed').
   Lo comparten el modo síncrono y el asíncrono. */
async function decodeMatterOnce(
    geminiPayload: any,
    apiKey: string
): Promise<any | null> {
    const r = await callGeminiWithRetry(geminiPayload, apiKey, 3)
    if (!r.ok) {
        const errText = await r.text().catch(() => "")
        console.error(
            "[decode-matter] Gemini error after retries:",
            r.status,
            errText
        )
        return null
    }

    const gjson = await r.json()
    /* Concatenar TODOS los `parts` (Gemini parte el JSON en varios). */
    const _parts = gjson?.candidates?.[0]?.content?.parts
    const rawText = Array.isArray(_parts)
        ? _parts.map((p: any) => p?.text ?? "").join("")
        : ""

    const tryParse = (src: string): any => {
        try {
            return JSON.parse(src)
        } catch {
            return null
        }
    }
    let dictamen: any = tryParse(rawText)
    if (!dictamen) {
        const fenced = rawText
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
        dictamen = tryParse(fenced)
    }
    if (!dictamen) {
        const match = rawText.match(/\{[\s\S]*\}/)
        if (match) dictamen = tryParse(match[0])
    }
    if (!dictamen) {
        const noComments = rawText
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
        const match2 = noComments.match(/\{[\s\S]*\}/)
        if (match2) dictamen = tryParse(match2[0])
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
        const finishReason = gjson?.candidates?.[0]?.finishReason ?? "unknown"
        console.error(
            "[decode-matter] malformed JSON — finishReason:",
            finishReason,
            "length:",
            rawText.length,
            "rawText:",
            rawText.slice(0, 500) + (rawText.length > 500 ? "…" : "")
        )
        /* Rescate del JSON truncado: si el hud llegó completo, reconstruimos un
           dictamen utilizable en vez de devolver SEÑAL CORRUPTA. */
        const salv = salvageMatter(rawText)
        if (!salv) return { ...SENAL_CORRUPTA }
        console.warn("[decode-matter] rescate aplicado a JSON truncado")
        dictamen = salv
    }

    /* Backfill de densidad_ligereza + termodinamica_resumen si Gemini los omite. */
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

    /* v6.18 — Normaliza la clasificación dietética a booleanos ESTRICTOS
       (el modelo a veces manda "true" string). Regla conservadora: cualquier
       cosa que no sea `true` literal → false. Si el campo no vino o vino
       malformado, se OMITE (el cliente lo trata como "sin dato" y no pinta
       sellos — jamás inventamos una cualidad). */
    const dietRaw = dictamen.clasificacion_dietetica
    if (dietRaw && typeof dietRaw === "object" && !Array.isArray(dietRaw)) {
        dictamen.clasificacion_dietetica = {
            vegano: dietRaw.vegano === true || dietRaw.vegano === "true",
            vegetariano:
                dietRaw.vegetariano === true || dietRaw.vegetariano === "true",
            sin_gluten:
                dietRaw.sin_gluten === true || dietRaw.sin_gluten === "true",
        }
    } else if (dietRaw !== undefined) {
        delete dictamen.clasificacion_dietetica
    }

    return dictamen
}

/* Registro server-side del escaneo (límite freemium a prueba de bypass).
   SEÑAL CORRUPTA no cuenta como decodificación → el caller no llama acá. */
async function recordScan(clerkUserId: string, dictamen: any): Promise<void> {
    try {
        await sb.rpc("record_decoder_scan", {
            p_clerk_user_id: clerkUserId,
            p_friccion_biologica: toInt(dictamen.dictamen_hud.friccion_biologica),
            p_friccion_energetica: toInt(
                dictamen.dictamen_hud.friccion_energetica
            ),
            p_impacto_matriz: toInt(dictamen.dictamen_hud.impacto_matriz),
            p_categoria_detectada:
                dictamen.dictamen_hud.categoria_detectada ?? null,
            p_comando_final: dictamen.comando_final ?? null,
        })
    } catch (recErr) {
        console.warn("[decode-matter] record scan failed:", String(recErr))
    }
}

/* Nombre del material para la Bóveda (título de la tarjeta + buscador). En modo
   texto es el matter_name del Tripulante; en foto se deriva del dictamen: el
   ingrediente principal (el nombre antes de ":" del 1er ítem del análisis) o,
   en su defecto, la categoría detectada. */
function deriveMatterLabel(dictamen: any): string {
    const arr = dictamen?.analisis_quirurgico
    if (Array.isArray(arr) && arr.length > 0) {
        const first = String(arr[0] ?? "")
        /* Solo si trae el tag "Nombre: [TIPO: NIVEL] …" (si no hay ":", es una
           frase de rescate/sin-tag y NO un nombre de ingrediente → cae a la
           categoría, un título más honesto que una frase suelta). */
        if (first.includes(":")) {
            const name = first.split(":")[0]?.trim()
            if (name && name.length >= 2 && name.length <= 60) return name
        }
    }
    const cat = dictamen?.dictamen_hud?.categoria_detectada
    return typeof cat === "string" && cat.trim()
        ? cat.trim()
        : "Escaneo de materia"
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
        const { image_base64, mime_type, extracted_text, matter_name, token } =
            body
        /* v6.16 — idioma del DISPOSITIVO (no de la etiqueta). Default "es". */
        const deviceLang = body?.lang === "en" ? "en" : "es"

        /* Gate de seguridad: token verificado + límite freemium server-side,
           ANTES de gastar una llamada a Gemini. */
        const gate = await gateDecoder(token)
        if (!gate.ok) {
            return new Response(JSON.stringify({ error: gate.error }), {
                status: gate.status || 401,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })
        }

        /* Budget governor (Auditoría 2026-06-12): tope por usuario + por IP
           ANTES de gastar Gemini/Vision. Fail-open si la RPC aún no existe. */
        {
            const _ip =
                req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
            const _rl = await sb.rpc("reserve_edge_spend", {
                p_edge: "decode-matter",
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

        /* Validación de input compartida (cualquier modo). El modo VISIÓN
           requiere image_base64; los otros, su texto. */
        const hasMatterName =
            typeof matter_name === "string" && matter_name.trim().length >= 2
        const hasExtractedText =
            typeof extracted_text === "string" &&
            extracted_text.trim().length >= 20
        const hasImage =
            typeof image_base64 === "string" && image_base64.length > 0
        if (!hasMatterName && !hasExtractedText && !hasImage) {
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

        const geminiPayload = buildMatterPayload({
            matter_name,
            extracted_text,
            image_base64,
            mime_type,
            lang: deviceLang,
        })

        /* ── MODO ASÍNCRONO (v6.12) ─────────────────────────────────────────
           El cliente manda `async: true`. Creamos un job 'processing' en
           matter_jobs, respondemos {job_id} AL INSTANTE (202), y corremos la
           cascada en segundo plano (EdgeRuntime.waitUntil). El Tripulante puede
           salir de la app; el job sobrevive in-flight y se revela al volver
           (resume por localStorage o por el push). Sin Bóveda: el dictamen vive
           en el job. La OCR (extract-text) ya corrió síncrona en el cliente. */
        if (body?.async === true) {
            const clerkUserId = gate.clerkUserId || ""
            if (!clerkUserId)
                return new Response(
                    JSON.stringify({ error: "auth_required" }),
                    {
                        status: 401,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            /* Nombre del material para la Bóveda: en texto lo conocemos de una
               (matter_name); en foto se rellena al completar (deriveMatterLabel). */
            const typedLabel =
                typeof matter_name === "string" &&
                matter_name.trim().length >= 2
                    ? matter_name.trim().slice(0, 120)
                    : null
            let jobId = ""
            try {
                const { data: jid, error: jerr } = await sb.rpc(
                    "create_matter_job",
                    {
                        p_clerk_user_id: clerkUserId,
                        p_input_label: typedLabel,
                    }
                )
                if (jerr) throw jerr
                jobId = (jid || "").toString()
                if (!jobId) throw new Error("empty_job_id")
            } catch (e) {
                console.error("[decode-matter] create_matter_job falló:", e)
                return new Response(
                    JSON.stringify({ error: "job_create_failed" }),
                    {
                        status: 500,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }

            /* Trabajo en segundo plano: corre la cascada y CIERRA el job.
               Reintentos BOUNDED (la cascada ~13 intentos/~70s + el budget
               governor de arriba); si agota → 'failed' y el cliente muestra
               "el campo está saturado". NUNCA reintento infinito. */
            const work = (async () => {
                let dictamen: any = null
                try {
                    dictamen = await decodeMatterOnce(geminiPayload, apiKey)
                } catch (e) {
                    console.error("[decode-matter] cascada async falló:", e)
                }
                if (!dictamen) {
                    try {
                        await sb.rpc("complete_matter_job", {
                            p_id: jobId,
                            p_result: null,
                            p_status: "failed",
                        })
                    } catch (_e) {
                        /* no-op */
                    }
                    return
                }
                try {
                    await sb.rpc("complete_matter_job", {
                        p_id: jobId,
                        p_result: dictamen,
                        p_status: "done",
                        /* texto → el nombre escrito; foto → derivado del dictamen
                           (la SQL conserva el existente si ya venía de create). */
                        p_input_label:
                            typedLabel || deriveMatterLabel(dictamen),
                    })
                } catch (e) {
                    console.error(
                        "[decode-matter] complete_matter_job falló:",
                        e
                    )
                }
                /* SEÑAL CORRUPTA no cuenta como decodificación → ni cupo ni push
                   (la "recaptura" no es un dictamen listo). */
                if (dictamen?.dictamen_hud?.estado !== "SEÑAL CORRUPTA") {
                    await recordScan(clerkUserId, dictamen)
                    /* v6.15 — Push SOLO si el Tripulante NO lo vio en vivo. Damos
                       una gracia de ~6s para que el poll del primer plano revele
                       el dictamen y lo marque "seen" (mark_decode_seen). Si lo vio
                       → seen_at != null → NO notificamos (evita el push tardío
                       sobre un resultado ya leído). Si salió de la app → seen_at
                       null → push. Defensivo: si la columna seen_at aún no existe
                       (migración sin aplicar), el catch deja pasar el push (comportamiento previo). */
                    let alreadySeen = false
                    try {
                        await new Promise((r) => setTimeout(r, 6000))
                        const { data: seenRow } = await sb
                            .from("matter_jobs")
                            .select("seen_at")
                            .eq("id", jobId)
                            .maybeSingle()
                        alreadySeen = !!seenRow?.seen_at
                    } catch (_e) {
                        alreadySeen = false
                    }
                    if (!alreadySeen) {
                        /* Push (gated/no-op si no está configurado): "tu
                           decodificación está lista" → deep-link a la revelación.
                           _push_dispatch traga cualquier error (sin tokens / sin
                           secreto / pg_net ausente). */
                        try {
                            await sb.rpc("_push_dispatch", {
                                p_clerk_user_id: clerkUserId,
                                p_title: "Tu decodificación está lista ✦",
                                p_body: "El Decodificador de Materia terminó. Ábrelo para ver el dictamen.",
                                p_data: { type: "matter", record_id: jobId },
                            })
                        } catch (_e) {
                            /* no-op */
                        }
                    }
                }
            })()

            try {
                // @ts-ignore — EdgeRuntime global de Supabase
                EdgeRuntime.waitUntil(work)
            } catch (_e) {
                /* Sin EdgeRuntime (entorno local): el job corre best-effort. */
                void work
            }

            return new Response(JSON.stringify({ job_id: jobId }), {
                status: 202,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })
        }

        /* ── MODO SÍNCRONO (fallback) ─────────────────────────────────────
           decodeMatterOnce devuelve el dictamen (válido o SENAL_CORRUPTA) o
           null si Gemini falló upstream tras agotar la cascada. */
        const dictamen = await decodeMatterOnce(geminiPayload, apiKey)
        if (!dictamen) {
            return new Response(
                JSON.stringify({ error: "Gemini upstream failure" }),
                {
                    status: 502,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        /* Registro server-side del escaneo (límite freemium a prueba de
           bypass). SEÑAL CORRUPTA no cuenta como decodificación. */
        if (
            gate.clerkUserId &&
            dictamen?.dictamen_hud?.estado !== "SEÑAL CORRUPTA"
        ) {
            await recordScan(gate.clerkUserId, dictamen)
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
