// ════════════════════════════════════════════════════════════════════
// Red Solar Viva — Edge Function `destilar-nodo` (v1.3)
//
// v1.3 (2026-04-24) — Vuelve a Gemini 3.1 Pro preview (más profundo
// que flash para el análisis de 3 pilares). Para absorber los 503
// transitorios del modelo agregamos `callGeminiWithRetry` con
// backoff exponencial (3 intentos: 1s, 2s) — mismo patrón que usa
// decode-matter y que lo mantiene estable. Sampling vuelve a 10k
// caracteres por sesión y maxOutputTokens a 4096. Costo ~$3 MXN/tanda.
//
// v1.2 (2026-04-24) — (retirada) Intento con gemini-2.5-flash +
// recortes de contexto. Calidad del análisis bajaba, Diego prefirió
// pagar un poco más y esperar un poco más por profundidad.
//
// v1.1 (2026-04-24) — Fix: fetchPerfil pedía columna `nombre` que no
// existe en `perfiles_nodo`. El campo correcto es `nombre_ancla`.
// Síntoma: cualquier nodo (incluso con perfil válido) devolvía
// "perfil_not_found" porque el SELECT fallaba silencioso.
//
// Destilación profunda por Nodo. Cruza los turnos del speaker de un
// perfil anclado a través de sus últimas N sesiones (default 4, máx 6)
// y destila 3 pilares vía Gemini:
//   1. INTERFERENCIAS — fricciones recurrentes (cansancio, mental,
//      ansiedad, miedo, etc.)
//   2. INTENCIONES — hacia dónde quiere llegar, proyectos, objetivos.
//   3. LOGROS — cosas positivas reportadas, avances, micro-victorias.
//
// El resultado se persiste en `destilacion_nodo` (UNIQUE por
// perfil_nodo_id → cada nueva reemplaza la anterior).
//
// Pipeline:
//   1. Valida admin (clerk_user_id → profiles.is_admin).
//   2. Fetcha aliases NO eliminados del perfil.
//   3. Trae las últimas N sesiones donde apareció, extrae SOLO los
//      turnos del speaker correspondiente.
//   4. Llama a Gemini 3.1 Pro preview con el prompt de destilación.
//   5. Upsert en destilacion_nodo. Devuelve el resultado al frontend.
//
// Secrets requeridos (ya instalados):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - GEMINI_API_KEY
//
// Deploy: supabase functions deploy destilar-nodo --no-verify-jwt
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
}

const DEFAULT_N = 4
const MAX_N = 6
const TURNOS_SAMPLE_CHARS_POR_SESION = 10000
/* v1.3 — cascada de modelos. Probamos pro-preview primero (más
   profundo); si responde 5xx después de los retries, caemos a
   gemini-2.5-pro (stable, calidad muy cercana). El modelo que
   finalmente respondió se persiste en `destilacion_nodo.modelo`. */
const MODELOS_CASCADA = ["gemini-3.1-pro-preview", "gemini-2.5-pro"]

const PROMPT_SISTEMA = `ACTÚA COMO: Zak'Haar, analista de resonancia en Red Solar Viva. Vas a recibir los turnos de UN SOLO NODO (una persona) a través de sus últimas sesiones en la Cámara Solar grupal. Tu misión es destilar TRES pilares sobre este nodo específico:

1. INTERFERENCIAS — lo que bloquea su expansión. Qué fricciones repite: cansancio, sobre-mental, ansiedad, duda, miedo, escasez, postergación, sobre-validación, reactividad, sobre-control, etc. Extraé SOLO lo que el nodo literalmente dice sentir o vivir. Cada interferencia incluye un nombre corto, una descripción breve (1-2 frases) y opcionalmente una cita textual muy corta.

2. INTENCIONES — hacia dónde quiere llegar. Objetivos, aspiraciones, proyectos, visiones que declara. Cosas que desea lograr, estados que busca alcanzar.

3. LOGROS — cosas positivas que ya pasaron. Avances, micro-victorias, momentos de claridad, estados positivos reportados (ej. "me sentí en paz", "por fin me animé a ...", "dejé de ..."). Lo que está funcionando.

REGLAS ABSOLUTAS:
- NO inventes ni proyectes. Solo registrá lo que el nodo literalmente expresó en sus turnos.
- Si una interferencia/intención/logro aparece en 2+ sesiones, anótalo — es persistente.
- Si NO hay suficiente data en alguno de los 3 pilares, devolvé array vacío y mencionalo brevemente en "sintesis".
- Cada item: nombre corto + descripción accionable. No párrafos largos.
- Español directo, voz de Zak'Haar (sin jerga corporativa, sin relleno).
- Nunca menciones nombres propios de OTROS nodos — es una lectura individual.

FORMATO DE SALIDA — RESPONDE SOLO UN JSON VÁLIDO, SIN PREÁMBULO NI MARKDOWN:

{
  "interferencias": [
    {
      "nombre": "Ansiedad por resultados",
      "descripcion": "Aparece en 3 sesiones — presión por ver cambios rápidos en sus finanzas.",
      "cita": "no puedo dejar de pensar que ya tendría que estar viendo algo"
    }
  ],
  "intenciones": [
    {
      "nombre": "Abrir su propio espacio",
      "descripcion": "Declaró querer rentar un local propio antes de fin de año."
    }
  ],
  "logros": [
    {
      "nombre": "Cortó ciclo de validación externa",
      "descripcion": "Dejó de pedir permiso a su mamá para sus decisiones financieras."
    }
  ],
  "sintesis": "1-2 líneas con la lectura agregada del nodo a través del sprint."
}`

interface Utterance {
    speaker?: string
    text?: string
    start?: number
}

interface Alias {
    id_sesion: string
    speaker_id: string
    perfil_nodo_id: string
    eliminado: boolean
}

interface PerfilRow {
    id: string
    nombre_ancla: string | null
}

async function verifyAdmin(clerkUserId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle()
    if (error) return false
    return data?.is_admin === true
}

async function fetchPerfil(perfilId: string): Promise<PerfilRow | null> {
    /* v1.1 — la columna canónica es `nombre_ancla` (no `nombre`). */
    const { data, error } = await supabase
        .from("perfiles_nodo")
        .select("id, nombre_ancla")
        .eq("id", perfilId)
        .maybeSingle()
    if (error) {
        console.error("[destilar-nodo] fetchPerfil:", error)
        return null
    }
    return data as PerfilRow | null
}

async function fetchAliases(perfilId: string): Promise<Alias[]> {
    const { data, error } = await supabase
        .from("alias_nodos_sesion")
        .select("id_sesion, speaker_id, perfil_nodo_id, eliminado")
        .eq("perfil_nodo_id", perfilId)
        .eq("eliminado", false)
    if (error) {
        console.error("[destilar-nodo] fetchAliases:", error)
        return []
    }
    return (data || []) as Alias[]
}

async function fetchTurnosPorSesion(
    aliases: Alias[],
    n: number
): Promise<{ fecha: string; id_sesion: string; turnos: string }[]> {
    if (aliases.length === 0) return []
    const ids = aliases.map((a) => a.id_sesion)
    const { data: sesiones, error } = await supabase
        .from("telemetria_camara")
        .select("id_sesion, fecha, transcript_json")
        .in("id_sesion", ids)
        .order("fecha", { ascending: false })
        .limit(n)
    if (error) {
        console.error("[destilar-nodo] fetchTurnosPorSesion:", error)
        return []
    }
    const result: { fecha: string; id_sesion: string; turnos: string }[] = []
    for (const s of sesiones || []) {
        const alias = aliases.find((a) => a.id_sesion === s.id_sesion)
        if (!alias) continue
        const utts: Utterance[] =
            (s as any).transcript_json?.utterances || []
        const turnosText = utts
            .filter(
                (u) =>
                    u.speaker === alias.speaker_id &&
                    (u.text || "").trim().length > 0
            )
            .map((u) => (u.text || "").trim())
            .join("\n\n")
        if (!turnosText) continue
        result.push({
            fecha: (s as any).fecha,
            id_sesion: (s as any).id_sesion,
            turnos: turnosText,
        })
    }
    return result
}

function buildContexto(
    nodoDisplayName: string,
    turnosPorSesion: { fecha: string; id_sesion: string; turnos: string }[]
): string {
    const partes: string[] = []
    partes.push(`NODO ANALIZADO: ${nodoDisplayName}`)
    partes.push(`SESIONES DE CONTEXTO: ${turnosPorSesion.length}`)
    partes.push("")
    for (const t of turnosPorSesion) {
        partes.push("═══════════════════════════════════")
        partes.push(`SESIÓN · ${t.fecha}`)
        partes.push("")
        const sample =
            t.turnos.length > TURNOS_SAMPLE_CHARS_POR_SESION
                ? t.turnos.slice(0, TURNOS_SAMPLE_CHARS_POR_SESION) +
                  "\n[...truncado]"
                : t.turnos
        partes.push(sample)
        partes.push("")
    }
    return partes.join("\n")
}

/* v1.3 — Retry con backoff exponencial (1s, 2s) para absorber 503
   transitorios del modelo. 4xx no reintentan (fallo de input). */
async function callGeminiWithRetry(
    url: string,
    payload: any,
    maxAttempts = 3
): Promise<Response> {
    let lastResp: Response | null = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        if (r.ok) return r
        lastResp = r
        if (r.status < 500 || r.status >= 600) return r
        const waitMs = 1000 * Math.pow(2, attempt - 1)
        console.warn(
            `[destilar-nodo] Gemini ${r.status} intento ${attempt}/${maxAttempts}, reintentando en ${waitMs}ms`
        )
        await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
    return lastResp!
}

async function llamarGemini(
    contexto: string
): Promise<{ destilacion: any; usage: any; modelo: string }> {
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurado")

    const body = {
        contents: [
            {
                parts: [
                    { text: PROMPT_SISTEMA },
                    {
                        text:
                            "\n\nCONTEXTO DE LAS ÚLTIMAS SESIONES DE ESTE NODO:\n\n" +
                            contexto,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
        },
    }

    /* v1.3 — cascada: intento pro-preview con retries; si falla 5xx,
       pruebo gemini-2.5-pro. Si ambos fallan, levanto el último error. */
    let ultResp: Response | null = null
    let modeloUsado = ""
    for (const modelo of MODELOS_CASCADA) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`
        const res = await callGeminiWithRetry(url, body, 3)
        if (res.ok) {
            ultResp = res
            modeloUsado = modelo
            break
        }
        ultResp = res
        if (res.status < 500 || res.status >= 600) {
            /* 4xx — fallo de input, no tiene sentido caer a otro modelo. */
            break
        }
        console.warn(
            `[destilar-nodo] ${modelo} falló con ${res.status}, probando siguiente en la cascada`
        )
    }

    if (!ultResp || !ultResp.ok) {
        const errText = ultResp ? await ultResp.text() : "sin respuesta"
        throw new Error(
            `Gemini ${ultResp?.status || "??"}: ${errText.slice(0, 400)}`
        )
    }

    const data = await ultResp.json()
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const usage = data?.usageMetadata || {}

    let destilacion: any = null
    try {
        destilacion = JSON.parse(rawText)
    } catch {
        destilacion = {
            interferencias: [],
            intenciones: [],
            logros: [],
            sintesis:
                "Gemini devolvió una respuesta no estructurada. Revisá la consola del edge function para diagnóstico.",
        }
    }

    /* Normalizar estructura — si vino mal, garantizar arrays. */
    const asArr = (v: any) => (Array.isArray(v) ? v : [])
    destilacion.interferencias = asArr(destilacion.interferencias)
    destilacion.intenciones = asArr(destilacion.intenciones)
    destilacion.logros = asArr(destilacion.logros)
    destilacion.sintesis = destilacion.sintesis || null

    return {
        destilacion,
        modelo: modeloUsado,
        usage: {
            prompt_tokens: usage.promptTokenCount || null,
            completion_tokens: usage.candidatesTokenCount || null,
            total_tokens: usage.totalTokenCount || null,
        },
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "method_not_allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })
    }

    try {
        const payload = await req.json()
        const clerkUserId: string = payload?.clerk_user_id || ""
        const perfilNodoId: string = payload?.perfil_nodo_id || ""
        let n: number = parseInt(payload?.n || DEFAULT_N, 10) || DEFAULT_N
        if (n < 1) n = 1
        if (n > MAX_N) n = MAX_N

        if (!clerkUserId) {
            return new Response(
                JSON.stringify({ error: "missing_clerk_user_id" }),
                {
                    status: 400,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }
        if (!perfilNodoId) {
            return new Response(
                JSON.stringify({ error: "missing_perfil_nodo_id" }),
                {
                    status: 400,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const isAdmin = await verifyAdmin(clerkUserId)
        if (!isAdmin) {
            return new Response(JSON.stringify({ error: "not_admin" }), {
                status: 403,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "application/json",
                },
            })
        }

        const perfil = await fetchPerfil(perfilNodoId)
        if (!perfil) {
            return new Response(
                JSON.stringify({ error: "perfil_not_found" }),
                {
                    status: 404,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }
        const aliases = await fetchAliases(perfilNodoId)
        if (aliases.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "no_aliases",
                    detail: "El nodo no tiene sesiones ancladas aún.",
                }),
                {
                    status: 404,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }
        const turnosPorSesion = await fetchTurnosPorSesion(aliases, n)
        if (turnosPorSesion.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "no_transcripts",
                    detail: "No hay turnos transcritos de este nodo.",
                }),
                {
                    status: 404,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const displayName = perfil.nombre_ancla?.trim() || "Nodo"
        const contexto = buildContexto(displayName, turnosPorSesion)
        const { destilacion, usage, modelo } = await llamarGemini(contexto)

        const fechasArr = turnosPorSesion.map((t) => t.fecha)

        /* Persistir (upsert) — reemplaza la destilación anterior del nodo. */
        let destilacionId: string | null = null
        try {
            const { data: savedId, error: saveErr } = await supabase.rpc(
                "save_destilacion_nodo",
                {
                    p_perfil_nodo_id: perfilNodoId,
                    p_solicitado_por: clerkUserId,
                    p_n_sesiones: turnosPorSesion.length,
                    p_fechas: fechasArr,
                    p_modelo: modelo,
                    p_interferencias: destilacion.interferencias,
                    p_intenciones: destilacion.intenciones,
                    p_logros: destilacion.logros,
                    p_sintesis: destilacion.sintesis,
                    p_usage: usage,
                }
            )
            if (saveErr) {
                console.error("[destilar-nodo] save failed:", saveErr)
            } else {
                destilacionId = (savedId as unknown as string) || null
            }
        } catch (e) {
            console.error("[destilar-nodo] save throw:", e)
        }

        return new Response(
            JSON.stringify({
                success: true,
                destilacion_id: destilacionId,
                perfil_nodo_id: perfilNodoId,
                nodo_nombre: displayName,
                n_sesiones: turnosPorSesion.length,
                fechas: fechasArr,
                destilacion,
                usage,
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
        console.error("[destilar-nodo] throw:", e)
        return new Response(
            JSON.stringify({
                error: "server_error",
                detail: String(e?.message || e),
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
})
