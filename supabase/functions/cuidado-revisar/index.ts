// Red Solar Viva · cuidado-revisar v1.1 — 🜂 JSON A PRUEBA DE BALAS: se exige un ESQUEMA de respuesta (responseSchema) además del mime JSON, la salida sube a 8.192 tokens y la transcripción se acota (una pieza de 86 cuadros con audio devolvía un JSON cortado por el tope y el panel decía "el motor contestó algo que no se pudo leer"); un limpiador quita cercas, texto alrededor y comas colgantes, y si aun así llega truncado, CIERRA lo abierto y rescata lo que se pueda. Devuelve el uso real de tokens (usageMetadata) para el ticket de telemetría.
// Red Solar Viva · cuidado-revisar v1.0
// =====================================================================
// 🜂 EL PANEL DE CUIDADO DEL COUNCIL: revisa una pieza TERMINADA desde la
// persona filmada y devuelve segundos exactos con su veredicto.
//
// Zak (2026-08-17 · IV): "permite subir un video, extrae frames, transcribe el
// audio, analiza buscando incomodidad, vulnerabilidad expuesta, contextos que
// puedan avergonzar, o fragmentos donde el gesto del creador opaque el de la
// persona. Devuelve APROBADO o REQUIERE AJUSTE con los segundos exactos".
//
// ── POR QUÉ EL VIDEO NO SUBE AQUÍ ────────────────────────────────────────
// El NAVEGADOR hace el trabajo pesado y esta función solo razona. El video se
// queda en la Mac: el cliente lo decodifica, saca un cuadro por segundo a 448
// px, extrae el audio y lo baja a 16 kHz mono, y manda solo eso. Tres razones,
// y las tres importan:
//   1. Un Reel de 90 s en 1080p pesa 20-40 MB; los cuadros y el audio pesan
//      2-4 MB. Ni el cuerpo de la petición ni el tiempo de subida se vuelven
//      el cuello de botella.
//   2. Cada cuadro llega ETIQUETADO con su segundo, así que los tiempos del
//      informe son exactos y no una estimación del modelo.
//   3. Un cuadro por segundo es EXACTAMENTE lo que Gemini muestrea de un video
//      nativo, así que no se pierde nada de la lectura y sí se ahorra.
//
// ── EL MOTOR ─────────────────────────────────────────────────────────────
// Gemini (misma llave que el resto de la casa: GEMINI_API_KEY), con la cascada
// de siempre: gemini-3-flash-preview y de respaldo gemini-2.5-flash. Se le
// entregan los cuadros con su marca de tiempo, el audio para que oiga tono y
// palabras, el CRITERIO acumulado del Nodo E (su playbook y lo que el
// Arquitecto ya aprobó o corrigió), y se le pide JSON estricto. La
// transcripción sale del MISMO análisis: el audio va en la petición y el
// modelo devuelve lo dicho junto con los hallazgos, así que no hay una segunda
// llamada ni un segundo proveedor que pueda fallar.
//
// ── LO QUE NO HACE ───────────────────────────────────────────────────────
// No juzga el método de captura: se graba sin avisar y el permiso se pide al
// final; eso está decidido y el prompt lo dice explícitamente. No opina de
// vistas ni de dinero. No guarda el video en ningún sitio.
//
// Secrets: GEMINI_API_KEY · CLERK_SECRET_KEY (portón de Arquitecto)

import { gateAdmin } from "../_shared/clerkAuth.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
}

/* La cascada de la casa: el rápido primero, el de respaldo detrás */
const MODELOS = [
    { model: "gemini-3-flash-preview", attempts: 2 },
    { model: "gemini-2.5-flash", attempts: 2 },
]

/* Topes de cordura del payload. Un Reel de tres minutos son 180 cuadros; con
   448 px y calidad 0.72 cada uno pesa ~28 KB, así que 200 cuadros son ~5.6 MB.
   Más que eso es otra cosa, no un Reel. */
const MAX_CUADROS = 220
const MAX_AUDIO_B64 = 14_000_000
const MAX_CUADRO_B64 = 300_000

interface CuadroIn {
    t?: unknown
    jpg?: unknown
}

const INSTRUCCION = `Eres el NODO E · CUIDADO del Council Solar de Red Solar Viva. Tu único trabajo: custodiar la dignidad de la persona filmada en un video que está a punto de publicarse.

MIRAS DESDE ELLA, NO DESDE EL CREADOR.

LA VARA, y es la única que decide: imagina a la persona filmada viendo ese momento sentada junto a alguien a quien ama (su madre, su pareja, su hija, su jefe). Si sentiría ORGULLO, sale. Si sentiría VERGÜENZA, no sale.

QUÉ BUSCAS, segundo por segundo:
1. INCOMODIDAD: se tensa, retrocede, mira alrededor buscando salida, ríe nerviosa, cruza los brazos, tarda en responder, se despide antes de que la interacción termine.
2. VULNERABILIDAD EXPUESTA: llora, cuenta algo íntimo, se le ve la carencia (pide, acepta con apuro), o aparece un dato que la identifica: uniforme con nombre, placa de auto, credencial, dirección, el nombre de su negocio, un menor de edad reconocible.
3. CONTEXTO QUE AVERGÜENZA: lo que se ve podría lastimarla si lo ven quienes la conocen (que se sepa que le hacía falta el dinero, dónde trabaja, con quién estaba, en qué estado se encontraba).
4. EL GESTO DEL CREADOR QUE TAPA EL SUYO: el creador habla encima de su reacción, se pone delante de la cámara justo cuando ella reacciona, celebra su propio acto en vez de mostrar el de ella, o el montaje corta su respuesta para lucir la entrega. En el momento del regalo, la cámara está para ELLA.

LO QUE NO ES TU TRABAJO, y no lo mencionas nunca:
- NO juzgas el método de captura. Se graba SIN AVISAR y el permiso se pide AL FINAL. Eso es intencional, está decidido por el Arquitecto y no se cuestiona. Que la persona no supiera que la grababan NO es un hallazgo.
- NO opinas de vistas, retención, gancho, edición creativa ni dinero.
- NO inventas hallazgos para parecer útil. Un nodo que marca todo no cuida a nadie: estorba y deja de leerse. Si el video está limpio, dilo y ya.

CÓMO RESPONDES. Solo JSON válido, sin texto alrededor y sin cercas de código:
{
  "veredicto": "APROBADO" | "REQUIERE AJUSTE",
  "resumen": "una frase sobre lo que pasa en el video, desde la persona filmada",
  "transcripcion": "lo que se dice en el video, seguido, sin marcas de tiempo",
  "personas": "cuántas personas filmadas aparecen y quiénes son (sin nombres si no se dicen)",
  "hallazgos": [
    {
      "segundo": 12.5,
      "tipo": "incomodidad" | "vulnerabilidad" | "contexto" | "gesto_del_creador" | "dato_identificable",
      "que": "qué se ve o se oye, en una frase",
      "porque": "por qué lastimaría a la persona",
      "accion": "cortar" | "difuminar" | "reencuadrar" | "acortar" | "silenciar",
      "gravedad": "alta" | "media" | "baja"
    }
  ],
  "notas": "lo que dudaste y decidiste dejar pasar, en una o dos líneas"
}

REGLAS DEL JSON:
- "segundo" es un número en segundos, tomado de la etiqueta del cuadro donde lo viste. Nunca lo inventes.
- El veredicto es REQUIERE AJUSTE si hay al menos un hallazgo de gravedad alta o dos de media. Con solo hallazgos bajos, es APROBADO y los bajos van igual en la lista, para que el creador los vea.
- Si no hay hallazgos, "hallazgos" es un arreglo vacío.
- Máximo 12 hallazgos: los que más importan.
- "transcripcion": lo dicho, seguido; si el video es largo, resúmelo fielmente en no más de 2.500 caracteres. Ningún campo de texto pasa de 600 caracteres salvo la transcripción.`

/* 🜂 EL ESQUEMA que Gemini tiene que respetar (structured output). Con esto y el
   mime JSON, el modelo no puede devolver prosa ni cercas; lo único que puede
   fallar es el TOPE de salida, que también se subió. */
const ESQUEMA = {
    type: "OBJECT",
    properties: {
        veredicto: { type: "STRING", enum: ["APROBADO", "REQUIERE AJUSTE"] },
        resumen: { type: "STRING" },
        transcripcion: { type: "STRING" },
        personas: { type: "STRING" },
        hallazgos: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    segundo: { type: "NUMBER" },
                    tipo: { type: "STRING", enum: ["incomodidad", "vulnerabilidad", "contexto", "gesto_del_creador", "dato_identificable"] },
                    que: { type: "STRING" },
                    porque: { type: "STRING" },
                    accion: { type: "STRING", enum: ["cortar", "difuminar", "reencuadrar", "acortar", "silenciar"] },
                    gravedad: { type: "STRING", enum: ["alta", "media", "baja"] },
                },
                required: ["segundo", "tipo", "que", "porque", "accion", "gravedad"],
            },
        },
        notas: { type: "STRING" },
    },
    required: ["veredicto", "resumen", "transcripcion", "personas", "hallazgos", "notas"],
}

/* 🜂 EL LIMPIADOR. Quita cercas de código (donde estén), texto antes del primer
   { y después del último }, y comas colgantes. Si el JSON llegó CORTADO (el
   modelo se quedó sin tokens a media cadena), cierra la cadena y los corchetes
   y llaves abiertos: se pierde el último campo, no la revisión entera. */
export function limpiarJson(crudo: string): Record<string, unknown> | null {
    let t = String(crudo || "")
        .replace(/```(?:json|JSON)?/g, "")
        .replace(/\u0000/g, "")
        .trim()
    const i = t.indexOf("{")
    if (i < 0) return null
    const j = t.lastIndexOf("}")
    t = j > i ? t.slice(i, j + 1) : t.slice(i)
    const intentar = (x: string): Record<string, unknown> | null => {
        try {
            const o = JSON.parse(x)
            return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : null
        } catch {
            return null
        }
    }
    const directo = intentar(t)
    if (directo) return directo
    /* comas colgantes antes de } o ] */
    const sinComas = t.replace(/,\s*([}\]])/g, "$1")
    const segundo = intentar(sinComas)
    if (segundo) return segundo
    /* truncado: cerrar lo abierto respetando cadenas y escapes. Si el corte
       cayó en un sitio que no admite cierre (una clave a medias), se recorta
       hasta la coma anterior y se vuelve a intentar: se pierde el último
       campo o el último hallazgo, no la revisión entera. */
    const cerrar = (x: string): string => {
        let enCadena = false
        let escape = false
        const pila: string[] = []
        for (const ch of x) {
            if (enCadena) {
                if (escape) escape = false
                else if (ch === "\\") escape = true
                else if (ch === '"') enCadena = false
                continue
            }
            if (ch === '"') enCadena = true
            else if (ch === "{") pila.push("}")
            else if (ch === "[") pila.push("]")
            else if (ch === "}" || ch === "]") pila.pop()
        }
        let r = x
        if (enCadena) r += '"'
        r = r.replace(/,\s*$/, "").replace(/:\s*$/, ': ""')
        while (pila.length) r += pila.pop()
        return r.replace(/,\s*([}\]])/g, "$1")
    }
    let base = sinComas
    for (let k = 0; k < 60 && base.length > 2; k++) {
        const o = intentar(cerrar(base))
        if (o) return o
        const coma = base.lastIndexOf(",")
        if (coma <= 0) break
        base = base.slice(0, coma)
    }
    return null
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) return json({ error: "gemini_sin_llave" }, 500)

    const body = await req.json().catch(() => null)
    if (!body) return json({ error: "cuerpo_invalido" }, 400)

    /* Solo el Arquitecto: el Council entero vive detrás de este portón */
    const gate = await gateAdmin(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status || 401)

    const cuadrosIn = Array.isArray(body.cuadros) ? (body.cuadros as CuadroIn[]) : []
    if (!cuadrosIn.length) return json({ error: "sin_cuadros" }, 400)

    const cuadros = cuadrosIn
        .filter(
            (c) =>
                c &&
                typeof c.t === "number" &&
                Number.isFinite(c.t) &&
                typeof c.jpg === "string" &&
                c.jpg.length > 500 &&
                c.jpg.length <= MAX_CUADRO_B64
        )
        .slice(0, MAX_CUADROS)
        .map((c) => ({ t: Math.max(0, Number(c.t)), jpg: String(c.jpg) }))
    if (!cuadros.length) return json({ error: "cuadros_invalidos" }, 400)

    const audioB64 = typeof body.audio === "string" && body.audio.length < MAX_AUDIO_B64 ? body.audio : ""
    const audioMime = typeof body.audioMime === "string" && body.audioMime ? String(body.audioMime).slice(0, 40) : "audio/wav"
    const duracion = typeof body.duracion === "number" && Number.isFinite(body.duracion) ? Number(body.duracion) : 0
    /* El criterio acumulado del nodo: su playbook y lo que el Arquitecto ya
       aprobó o corrigió. Sin esto el nodo empieza de cero cada vez. */
    const criterio = typeof body.criterio === "string" ? String(body.criterio).slice(0, 12000) : ""

    /* ── El encargo: cuadros etiquetados + audio + criterio ──────────── */
    const partes: unknown[] = []
    partes.push({
        text:
            `${INSTRUCCION}\n\n` +
            `EL VIDEO: dura ${duracion ? `${duracion.toFixed(1)} segundos` : "una duración que no se pudo medir"} y llegan ${cuadros.length} cuadros, uno cada ${
                duracion && cuadros.length > 1 ? (duracion / (cuadros.length - 1)).toFixed(1) : "1.0"
            } segundos. Cada cuadro viene precedido por su marca de tiempo: usa ESA marca para el campo "segundo".` +
            (audioB64 ? " Después de los cuadros viene el audio completo del video: úsalo para el tono de voz, lo que se dice y lo que se oye alrededor." : " NO llegó el audio de este video: analiza solo la imagen y dilo en \"notas\".") +
            (criterio ? `\n\nEL CRITERIO ACUMULADO DEL ARQUITECTO (manda sobre cualquier intuición tuya; es lo que él ya aprobó o corrigió en revisiones anteriores):\n${criterio}` : ""),
    })
    for (const c of cuadros) {
        partes.push({ text: `[${c.t.toFixed(1)}s]` })
        partes.push({ inlineData: { mimeType: "image/jpeg", data: c.jpg } })
    }
    if (audioB64) {
        partes.push({ text: "AUDIO COMPLETO DEL VIDEO:" })
        partes.push({ inlineData: { mimeType: audioMime, data: audioB64 } })
    }

    const payload = {
        contents: [{ role: "user", parts: partes }],
        generationConfig: {
            temperature: 0.2,
            /* 🜂 8.192: la transcripción de un Reel de 90 s más doce hallazgos
               cabían justo en 4.096 y a veces no; el JSON llegaba cortado */
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: ESQUEMA,
        },
    }

    /* ── La cascada ──────────────────────────────────────────────────── */
    let texto = ""
    let usado = ""
    let ultimo = ""
    /* el uso real de tokens que reporta Gemini, para el ticket del panel */
    let uso: { entrada: number; salida: number } | null = null
    let finalizo = ""
    for (const { model, attempts } of MODELOS) {
        for (let i = 0; i < attempts; i++) {
            try {
                const r = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }
                )
                if (!r.ok) {
                    ultimo = `${model} ${r.status}`
                    const t = await r.text().catch(() => "")
                    console.error("[cuidado-revisar]", model, r.status, t.slice(0, 240))
                    /* 4xx no se reintenta: no va a cambiar */
                    if (r.status >= 400 && r.status < 500 && r.status !== 429) break
                    await new Promise((res) => setTimeout(res, 900 * (i + 1)))
                    continue
                }
                const data = (await r.json()) as {
                    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
                    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
                }
                texto = (data?.candidates?.[0]?.content?.parts || [])
                    .map((p) => p?.text || "")
                    .join("")
                    .trim()
                finalizo = String(data?.candidates?.[0]?.finishReason || "")
                const um = data?.usageMetadata
                if (um && typeof um.promptTokenCount === "number")
                    uso = { entrada: um.promptTokenCount, salida: Number(um.candidatesTokenCount) || 0 }
                if (finalizo && finalizo !== "STOP") console.warn("[cuidado-revisar] finishReason", model, finalizo)
                if (texto) {
                    usado = model
                    break
                }
                ultimo = `${model} vacío`
            } catch (e) {
                ultimo = `${model} ${String((e as Error)?.message || e)}`
                console.error("[cuidado-revisar] red:", ultimo)
                await new Promise((res) => setTimeout(res, 900 * (i + 1)))
            }
        }
        if (texto) break
    }
    if (!texto) return json({ error: "analisis_fallo", detalle: ultimo }, 502)

    /* ── El JSON, a prueba de cercas, texto alrededor y cortes ───────── */
    const out = limpiarJson(texto)
    if (!out) {
        console.error("[cuidado-revisar] JSON ilegible:", finalizo, texto.slice(0, 300), "…", texto.slice(-200))
        return json({ error: "respuesta_ilegible", detalle: finalizo ? `finishReason ${finalizo}` : "sin JSON" }, 502)
    }

    const veredicto = String(out.veredicto || "").toUpperCase().includes("AJUSTE") ? "REQUIERE AJUSTE" : "APROBADO"
    const hallazgos = (Array.isArray(out.hallazgos) ? out.hallazgos : [])
        .slice(0, 12)
        .map((h) => {
            const x = h as Record<string, unknown>
            const seg = Number(x.segundo)
            return {
                segundo: Number.isFinite(seg) ? Math.max(0, seg) : 0,
                tipo: String(x.tipo || "contexto").slice(0, 30),
                que: String(x.que || "").slice(0, 400),
                porque: String(x.porque || "").slice(0, 400),
                accion: String(x.accion || "cortar").slice(0, 20),
                gravedad: ["alta", "media", "baja"].includes(String(x.gravedad)) ? String(x.gravedad) : "media",
            }
        })
        .filter((h) => h.que)
        .sort((a, b) => a.segundo - b.segundo)

    return json({
        ok: true,
        veredicto,
        resumen: String(out.resumen || "").slice(0, 600),
        transcripcion: String(out.transcripcion || "").slice(0, 20000),
        personas: String(out.personas || "").slice(0, 300),
        notas: String(out.notas || "").slice(0, 800),
        hallazgos,
        motor: usado,
        cuadros: cuadros.length,
        conAudio: !!audioB64,
        /* el uso real de tokens (si Gemini lo reportó) y si el JSON llegó
           entero o hubo que rescatarlo */
        uso,
        truncado: finalizo === "MAX_TOKENS",
    })
})
