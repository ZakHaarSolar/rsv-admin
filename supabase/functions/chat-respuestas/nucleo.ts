// chat-respuestas/nucleo.ts v1.0 — 🜂 ¿LO CONTESTÉ? (Zak 2026-10-23)
// Lee un tramo del chat y decide cuáles de MIS mensajes posteriores contestan un mensaje
// del otro aunque no lo hayan citado. Vive aparte del index para poder probarlo en la Mac
// (deno run) con la misma lógica que corre en el servidor.
//
// Entrada (la arma la app con lo que ya tiene descifrado en pantalla):
//   objetivo: { texto, tipo }                      el mensaje que se tocó
//   antes:    [{ quien, texto, tipo }]             hasta 8, para entender de qué se hablaba
//   despues:  [{ q, quien, texto, tipo, cita }]    hasta 40, en orden
//     quien = "yo" | "autor" (quien escribió el objetivo) | "otro" (alguien más, en grupos)
//     cita  = "objetivo" (respondió citándolo) | "otro" (citó otro mensaje) | null
//   Candidatos = mis mensajes de después sin cita. Solo ellos llevan etiqueta y solo
//   ellos pueden salir en la respuesta (el esquema lo impone con un enum).
//
// Salida: [{ q, seguridad: "alta" | "media" }].

import { claudeJson } from "../_shared/claudeHaiku.ts"

export type Quien = "yo" | "autor" | "otro"
export type Linea = { q?: string; quien: Quien; texto: string; tipo?: string; cita?: "objetivo" | "otro" | null }
export type Pedido = {
    idioma?: string
    objetivo: { texto: string; tipo?: string }
    antes: Linea[]
    despues: Linea[]
}
export type Veredicto = { q: string; seguridad: "alta" | "media" }

const MAX_TEXTO = 500
const MAX_ANTES = 8
const MAX_DESPUES = 40

function limpio(s: unknown): string {
    return String(s ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_TEXTO)
}

/* Lo que no es texto se nombra para que el modelo sepa que existió (una foto puede ser
   la respuesta a «mándame la foto»). */
function cuerpo(l: { texto: string; tipo?: string }): string {
    const t = limpio(l.texto)
    const marca =
        l.tipo === "foto" ? "[foto]" : l.tipo === "voz" ? "[nota de voz]" : l.tipo === "sticker" ? "[sticker]" : ""
    if (marca && t) return `${marca} ${t}`
    return t || marca || "[mensaje vacío]"
}

const NOMBRE: Record<Quien, string> = { yo: "Yo", autor: "Autor", otro: "Otra persona" }

export function normalizar(p: Pedido): { pedido: Pedido; candidatos: string[] } {
    const antes = (Array.isArray(p?.antes) ? p.antes : []).slice(-MAX_ANTES)
    const despues = (Array.isArray(p?.despues) ? p.despues : []).slice(0, MAX_DESPUES)
    const candidatos: string[] = []
    const vistos = new Set<string>()
    for (const l of despues) {
        const q = String(l?.q || "").slice(0, 12)
        if (l?.quien === "yo" && !l?.cita && q && !vistos.has(q)) {
            vistos.add(q)
            candidatos.push(q)
        }
    }
    return {
        pedido: { idioma: p?.idioma, objetivo: { texto: p?.objetivo?.texto ?? "", tipo: p?.objetivo?.tipo }, antes, despues },
        candidatos,
    }
}

export function armarTexto(p: Pedido, candidatos: Set<string>): string {
    const filas: string[] = []
    if (p.antes.length) {
        filas.push("ANTES:")
        for (const l of p.antes) filas.push(`  ${NOMBRE[l.quien] || "Otra persona"}: ${cuerpo(l)}`)
    }
    filas.push("", `>>> MENSAJE OBJETIVO (Autor): ${cuerpo(p.objetivo)}`, "", "DESPUÉS:")
    for (const l of p.despues) {
        const quien = NOMBRE[l.quien] || "Otra persona"
        const q = l.quien === "yo" && l.q && candidatos.has(l.q) ? `[${l.q}] ` : ""
        const cita =
            l.cita === "objetivo"
                ? " (respondió citando el mensaje objetivo)"
                : l.cita === "otro"
                  ? " (respondió citando otro mensaje)"
                  : ""
        filas.push(`  ${q}${quien}${cita}: ${cuerpo(l)}`)
    }
    return filas.join("\n")
}

const SISTEMA = `Lees un tramo de un chat entre personas. Hay un MENSAJE OBJETIVO escrito por «Autor». Tu tarea: decidir cuáles de los mensajes de «Yo» que llevan etiqueta entre corchetes ([r1], [r2]…) contestan o reaccionan directamente a ese mensaje objetivo.

Cuenta como contestar: responder su pregunta, comentar o reaccionar a lo que dijo o compartió (también una foto o un sticker), aceptar o rechazar lo que propone, agradecerlo, o seguir el hilo de ese mismo tema justo después.
No cuenta: un mensaje de Yo que contesta otra cosa (un mensaje posterior del Autor o de otra persona, o algo de antes), un saludo o un tema nuevo sin relación, o una pregunta nueva que no retoma lo del objetivo.
Si el Autor mandó varios mensajes seguidos y Yo contestó todo con un solo mensaje, ese mensaje cuenta para cada uno que de verdad conteste.
«alta» cuando es claro; «media» cuando es probable pero podría referirse a otra cosa. Si ninguno lo contesta, devuelve la lista vacía. Nunca inventes etiquetas.`

export async function decidir(p: Pedido): Promise<Veredicto[] | null> {
    const { pedido, candidatos } = normalizar(p)
    if (!candidatos.length) return []
    const schema = {
        type: "object",
        properties: {
            respuestas: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        q: { type: "string", enum: candidatos },
                        seguridad: { type: "string", enum: ["alta", "media"] },
                    },
                    required: ["q", "seguridad"],
                    additionalProperties: false,
                },
            },
        },
        required: ["respuestas"],
        additionalProperties: false,
    }
    const texto = await claudeJson({
        tag: "chat-respuestas",
        system: SISTEMA,
        content: armarTexto(pedido, new Set(candidatos)),
        schema,
        maxTokens: 400,
    })
    if (!texto) return null
    try {
        const j = JSON.parse(texto)
        const permitidos = new Set(candidatos)
        const out: Veredicto[] = []
        const vistos = new Set<string>()
        for (const r of Array.isArray(j?.respuestas) ? j.respuestas : []) {
            const q = String(r?.q || "")
            if (!permitidos.has(q) || vistos.has(q)) continue
            vistos.add(q)
            out.push({ q, seguridad: r?.seguridad === "media" ? "media" : "alta" })
        }
        return out
    } catch {
        return null
    }
}
