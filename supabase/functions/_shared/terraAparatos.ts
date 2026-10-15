// Red Solar Viva · _shared/terraAparatos.ts v1.1 — (Sala 42 E de Terra Cristal, tercera tanda, 2026-10-15) las filas de las batallas llevan
// también la respuesta a «¿Por qué sigues en Terra Cristal?» (`r`).
// Red Solar Viva · _shared/terraAparatos.ts v1.0 — 🜂 LOS JUGADORES SIN CUENTA EN EL MOTOR (Sala 40 de Terra Cristal, 2026-10-14)
// =============================================================================
// La cuenta pura (sin base ni red) que hace admin-action v1.63 en admin_terra_cristal con los APARATOS (terra_cristal_aparatos, migración
// 20261014_terra_cristal_aparatos): cada aparato donde se juega manda su partida con la bitácora a la función terra-cristal-bitacora, con
// o sin cuenta. Aquí:
//   · el resumen de una fila para la lista del Motor (el mismo para una partida con cuenta y para un aparato);
//   · la bitácora más fresca de quien juega con cuenta: la de su partida (su último guardado) o la de alguno de sus aparatos (lo último
//     que jugó), la que tenga la fecha más nueva;
//   · las filas de las batallas: las partidas con su bitácora más fresca y los aparatos sin cuenta («ap:<aparato>»); los aparatos de
//     administrador (el navegador de Zak con ?admin=1, y las pruebas) no cuentan, salvo que se pida.
// Aparte para probarla sin la base (terra-cristal-pixel3/herramientas/sala40.ts) y para que el banco del Motor arme sus números de ejemplo
// con la misma cuenta.

import type { FilaBatallas } from "./terraBatallas.ts"

/** Lo que se lee de cada aparato para la lista: sus datos y unas rutas de su documento (nunca el documento entero). */
export const RUTAS_APARATO_LISTA = [
    "aparato",
    "clerk_user_id",
    "admin",
    "juego",
    "navegador",
    "idioma",
    "zona",
    "envios",
    "creado",
    "actualizado",
    "guardada:documento->>guardada",
    "creada:documento->>creada",
    "nombre:documento->>nombre",
    "avatar:documento->>avatar",
    "fotones:documento->fotones",
    "dificultad:documento->>dificultad",
    "aldea:documento->>aldea",
    "batallas:documento->batallas",
    "historia:documento->historia",
    "tripulacion:documento->tripulacion",
    "almas:documento->almas",
    "lejos:documento->lejos",
    "b_segundos:documento->bitacora->segundos",
    "b_sesiones:documento->bitacora->sesiones",
    "b_primera:documento->bitacora->>primera",
    "b_ultima:documento->bitacora->>ultima",
].join(",")

/** Lo que se lee de los aparatos de una cuenta (para su bitácora más fresca en la lista). */
export const RUTAS_APARATO_DE_CUENTA =
    "aparato,clerk_user_id,admin,navegador,actualizado,b_segundos:documento->bitacora->segundos,b_sesiones:documento->bitacora->sesiones,b_primera:documento->bitacora->>primera,b_ultima:documento->bitacora->>ultima"

/** Lo que se lee de cada aparato para las batallas. */
export const RUTAS_APARATO_BATALLAS = "aparato,clerk_user_id,admin,b:documento->bitacora->batallas,u:documento->bitacora->>ultima,d:documento->>dificultad,r:documento->>respuesta"

export type ResumenBitacora = { segundos: number | null; sesiones: number | null; primera: string | null; ultima: string | null }

const obj = (v: unknown): Record<string, any> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, any>) : {})
const t = (v: unknown): number => {
    const x = typeof v === "string" ? Date.parse(v) : NaN
    return Number.isFinite(x) ? x : -Infinity
}

/** El resumen de la bitácora de una fila leída con las rutas b_* (null si no trae bitácora). */
export function resumenBitacora(f: Record<string, any>): ResumenBitacora | null {
    const con = f.b_segundos != null || f.b_sesiones != null || f.b_ultima != null
    return con ? { segundos: f.b_segundos ?? null, sesiones: f.b_sesiones ?? null, primera: f.b_primera ?? null, ultima: f.b_ultima ?? null } : null
}

/** Lo que la lista pinta de una fila (una partida con cuenta o un aparato), leída con las mismas rutas de su documento. */
export function resumenFila(f: Record<string, any>) {
    const historia = obj(f.historia)
    const marcas = Object.keys(historia).filter((k) => historia[k] === true)
    const niveles: Record<string, number> = {}
    for (const [id, s] of Object.entries(obj(f.tripulacion))) {
        const n = Number((s as { nivel?: unknown })?.nivel)
        if (Number.isFinite(n)) niveles[id] = n
    }
    return {
        nombre: f.nombre ?? null,
        avatar: f.avatar ?? null,
        fotones: typeof f.fotones === "number" ? f.fotones : null,
        dificultad: f.dificultad ?? null,
        aldea: f.aldea ?? null,
        batallas: f.batallas && typeof f.batallas === "object" ? f.batallas : null,
        marcas,
        niveles,
        almas: Array.isArray(f.almas) ? f.almas : [],
        lejos: Array.isArray(f.lejos) ? f.lejos : [],
        bitacora: resumenBitacora(f),
    }
}

/** Con qué juega un aparato (lo que la lista y la ficha dicen de él). */
export function datosAparato(f: Record<string, any>) {
    return {
        id: String(f.aparato || ""),
        admin: f.admin === true,
        navegador: f.navegador ?? null,
        idioma: f.idioma ?? null,
        zona: f.zona ?? null,
        juego: f.juego ?? null,
        envios: typeof f.envios === "number" ? f.envios : null,
        creado: f.creado ?? null,
        actualizado: f.actualizado ?? null,
    }
}

/** Un aparato sin cuenta como fila de la lista del Motor (la misma forma que una partida, con `tipo: "aparato"`). */
export function filaDeAparato(f: Record<string, any>) {
    return {
        tipo: "aparato" as const,
        clerk_user_id: null,
        aparato: datosAparato(f),
        version: null,
        guardada: f.guardada ?? null,
        creada: f.creada ?? f.creado ?? null,
        actualizada: f.actualizado ?? null,
        ...resumenFila(f),
        cuenta: null,
    }
}

/** La más fresca de varias bitácoras (por su última vez), o null si no hay ninguna. */
export function masFresca<T extends { ultima: string | null } | null>(xs: T[]): T | null {
    let mejor: T | null = null
    for (const x of xs) if (x && (!mejor || t(x.ultima) > t(mejor.ultima))) mejor = x
    return mejor
}

/** Una fila de aparato leída con RUTAS_APARATO_BATALLAS. */
export type AparatoBatallas = { aparato: string; clerk_user_id: string | null; admin?: boolean | null; b: unknown; u: string | null; d?: string | null; /** (Sala 42 E) su respuesta */ r?: string | null }

/**
 * Las filas de las batallas del Motor: cada partida con cuenta con la bitácora más fresca (la suya o la de alguno de sus aparatos), las
 * cuentas que solo tienen aparato (jugaron con su sesión pero su partida no llegó) y los aparatos sin cuenta, como «ap:<aparato>». Dice
 * qué ids son de administrador además de los de la base: los aparatos de administrador sin cuenta (salvo que se pidan).
 */
export function filasBatallas(partidas: FilaBatallas[], aparatos: AparatoBatallas[], incluyeAdmin = false): { filas: FilaBatallas[]; adminsAparato: Set<string> } {
    const deCuenta = new Map<string, AparatoBatallas[]>()
    const sinCuenta: AparatoBatallas[] = []
    for (const a of aparatos) {
        if (!a || typeof a.aparato !== "string" || !a.aparato) continue
        if (a.clerk_user_id) {
            const l = deCuenta.get(a.clerk_user_id) ?? []
            l.push(a)
            deCuenta.set(a.clerk_user_id, l)
        } else sinCuenta.push(a)
    }
    const filas: FilaBatallas[] = []
    const vistas = new Set<string>()
    for (const p of partidas) {
        vistas.add(p.clerk_user_id)
        const suyos = deCuenta.get(p.clerk_user_id) ?? []
        // (la bitácora más fresca; la manera de viajar, la de la partida: es lo que eligió en su último guardado)
        const mejor = masFresca<{ ultima: string | null; b: unknown } | null>([{ ultima: p.u, b: p.b }, ...suyos.map((a) => ({ ultima: a.u, b: a.b }))])
        filas.push({ clerk_user_id: p.clerk_user_id, b: mejor?.b ?? p.b, u: mejor?.ultima ?? p.u, d: p.d ?? suyos[0]?.d ?? null, r: p.r ?? suyos.find((a) => a.r)?.r ?? null })
    }
    for (const [cuenta, suyos] of deCuenta) {
        if (vistas.has(cuenta)) continue
        const mejor = masFresca(suyos.map((a) => ({ ultima: a.u, a })))
        if (mejor) filas.push({ clerk_user_id: cuenta, b: mejor.a.b, u: mejor.a.u, d: mejor.a.d ?? null, r: mejor.a.r ?? null })
    }
    const adminsAparato = new Set<string>()
    for (const a of sinCuenta) {
        const id = `ap:${a.aparato}`
        if (a.admin === true && !incluyeAdmin) adminsAparato.add(id)
        filas.push({ clerk_user_id: id, b: a.b, u: a.u, d: a.d ?? null, r: a.r ?? null })
    }
    return { filas, adminsAparato }
}
