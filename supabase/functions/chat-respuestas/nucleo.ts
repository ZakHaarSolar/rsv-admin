// chat-respuestas/nucleo.ts v1.1 — 🜂 HACIA ABAJO Y HACIA ARRIBA (Zak 2026-10-23: «que también sea para
// abajo como para arriba… poder ver los que ella contestó, no solo en reply, también en contexto»).
// Una sola lectura decide las dos cosas de un mensaje tocado (el OBJETIVO, escrito por «Autor»):
//   · respuestas: cuáles mensajes de la contraparte, DESPUÉS, lo contestan aunque no lo citen.
//   · contesta:   a cuáles mensajes de la contraparte, ANTES, contesta el objetivo.
// La contraparte es el otro lado de la charla: si tocaste un mensaje suyo, tú; si tocaste uno
// tuyo, los demás. Las demás personas de un grupo, cuando no son contraparte, son «tercero».
// v1.0 — ¿Lo contesté?: solo hacia abajo y solo para un mensaje del otro.
// Vive aparte del index para poder probarlo en la Mac (deno run) con la misma lógica.
//
// Entrada v2 (la arma la app con lo que ya tiene descifrado en pantalla):
//   objetivo: { texto, tipo }
//   antes:    [{ q?, quien, texto, tipo }]           hasta 8; q = "aN" en candidatos hacia arriba
//   despues:  [{ q?, quien, texto, tipo, cita }]     hasta 40; q = "rN" en candidatos hacia abajo
//     quien = "autor" | "contraparte" | "tercero"
//     cita  = "objetivo" (respondió citándolo) | "otro" (citó otro mensaje) | null
//   La entrada v1 (app 1.1.64: quien = "yo" | "autor" | "otro", solo hacia abajo) se traduce sola.
// Solo las líneas con etiqueta pueden salir en la respuesta (el esquema lo impone con un enum).

import { claudeJson } from "../_shared/claudeHaiku.ts"

export type Quien = "autor" | "contraparte" | "tercero"
export type Linea = { q?: string; quien: Quien; texto: string; tipo?: string; cita?: "objetivo" | "otro" | null }
export type Pedido = {
    v?: number
    idioma?: string
    objetivo: { texto: string; tipo?: string }
    antes: Linea[]
    despues: Linea[]
}
export type Veredicto = { q: string; seguridad: "alta" | "media" }
export type Lectura = { respuestas: Veredicto[]; contesta: Veredicto[] }

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

const NOMBRE: Record<Quien, string> = { autor: "Autor", contraparte: "Interlocutor", tercero: "Otra persona" }

/* La app 1.1.64 manda la forma v1: «yo» era la contraparte y «otro» un tercero. */
function traducirV1(l: any): Linea {
    const quien: Quien = l?.quien === "yo" ? "contraparte" : l?.quien === "autor" ? "autor" : l?.quien === "otro" ? "tercero" : l?.quien
    return { ...l, quien }
}

export function normalizar(p: Pedido): { pedido: Pedido; abajo: string[]; arriba: string[] } {
    const v1 = Number(p?.v || 1) < 2
    let antes = (Array.isArray(p?.antes) ? p.antes : []).slice(-MAX_ANTES)
    let despues = (Array.isArray(p?.despues) ? p.despues : []).slice(0, MAX_DESPUES)
    if (v1) {
        antes = antes.map((l) => ({ ...traducirV1(l), q: undefined }))
        despues = despues.map(traducirV1)
    }
    const tomar = (lineas: Linea[], prefijo: string): string[] => {
        const out: string[] = []
        for (const l of lineas) {
            const q = String(l?.q || "").slice(0, 12)
            if (l?.quien === "contraparte" && !l?.cita && q.startsWith(prefijo) && !out.includes(q)) out.push(q)
        }
        return out
    }
    return {
        pedido: { v: 2, idioma: p?.idioma, objetivo: { texto: p?.objetivo?.texto ?? "", tipo: p?.objetivo?.tipo }, antes, despues },
        abajo: tomar(despues, "r"),
        arriba: tomar(antes, "a"),
    }
}

export function armarTexto(p: Pedido, abajo: Set<string>, arriba: Set<string>): string {
    const linea = (l: Linea, permitidos: Set<string>) => {
        const q = l.q && permitidos.has(l.q) ? `[${l.q}] ` : ""
        const cita =
            l.cita === "objetivo"
                ? " (respondió citando el mensaje objetivo)"
                : l.cita === "otro"
                  ? " (respondió citando otro mensaje)"
                  : ""
        return `  ${q}${NOMBRE[l.quien] || "Otra persona"}${cita}: ${cuerpo(l)}`
    }
    const filas: string[] = []
    if (p.antes.length) {
        filas.push("ANTES:")
        for (const l of p.antes) filas.push(linea(l, arriba))
    }
    filas.push("", `>>> MENSAJE OBJETIVO (Autor): ${cuerpo(p.objetivo)}`, "")
    if (p.despues.length) {
        filas.push("DESPUÉS:")
        for (const l of p.despues) filas.push(linea(l, abajo))
    }
    return filas.join("\n")
}

const CRITERIO = `Cuenta como contestar: responder una pregunta, comentar o reaccionar a lo que se dijo o compartió (también con una foto o un sticker), aceptar o rechazar una propuesta, agradecer, o seguir ese mismo tema justo después.
No cuenta: un mensaje que contesta otra cosa (otro mensaje de antes o de después), un saludo o un tema nuevo sin relación, o una pregunta nueva que no retoma lo anterior.
Si alguien mandó varios mensajes seguidos y le contestaron todo con un solo mensaje, ese mensaje cuenta para cada uno que de verdad conteste.
«alta» cuando es claro; «media» cuando es probable pero podría referirse a otra cosa. Si nada aplica, la lista va vacía. Nunca inventes etiquetas.`

function sistema(abajo: boolean, arriba: boolean): string {
    const tareas: string[] = []
    if (abajo)
        tareas.push(
            "«respuestas»: de los mensajes del «Interlocutor» que vienen DESPUÉS y llevan etiqueta [r1], [r2]…, cuáles contestan o reaccionan directamente al mensaje objetivo."
        )
    if (arriba)
        tareas.push(
            "«contesta»: de los mensajes del «Interlocutor» que vienen ANTES y llevan etiqueta [a1], [a2]…, a cuáles contesta o reacciona directamente el mensaje objetivo. Muchas veces un mensaje abre un tema nuevo y no contesta nada: entonces va vacía."
        )
    return `Lees un tramo de un chat. Hay un MENSAJE OBJETIVO escrito por «Autor»; el «Interlocutor» es el otro lado de la charla. Tu tarea:\n${tareas
        .map((t, i) => `${i + 1}. ${t}`)
        .join("\n")}\n\n${CRITERIO}`
}

const ITEM = (enumq: string[]) => ({
    type: "array",
    items: {
        type: "object",
        properties: {
            q: { type: "string", enum: enumq },
            seguridad: { type: "string", enum: ["alta", "media"] },
        },
        required: ["q", "seguridad"],
        additionalProperties: false,
    },
})

function filtrar(lista: unknown, permitidos: string[]): Veredicto[] {
    const ok = new Set(permitidos)
    const vistos = new Set<string>()
    const out: Veredicto[] = []
    for (const r of Array.isArray(lista) ? lista : []) {
        const q = String((r as any)?.q || "")
        if (!ok.has(q) || vistos.has(q)) continue
        vistos.add(q)
        out.push({ q, seguridad: (r as any)?.seguridad === "media" ? "media" : "alta" })
    }
    return out
}

export async function decidir(p: Pedido): Promise<Lectura | null> {
    const { pedido, abajo, arriba } = normalizar(p)
    if (!abajo.length && !arriba.length) return { respuestas: [], contesta: [] }
    const properties: Record<string, unknown> = {}
    if (abajo.length) properties.respuestas = ITEM(abajo)
    if (arriba.length) properties.contesta = ITEM(arriba)
    const texto = await claudeJson({
        tag: "chat-respuestas",
        system: sistema(abajo.length > 0, arriba.length > 0),
        content: armarTexto(pedido, new Set(abajo), new Set(arriba)),
        schema: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
        maxTokens: 500,
    })
    if (!texto) return null
    try {
        const j = JSON.parse(texto)
        return { respuestas: filtrar(j?.respuestas, abajo), contesta: filtrar(j?.contesta, arriba) }
    } catch {
        return null
    }
}
