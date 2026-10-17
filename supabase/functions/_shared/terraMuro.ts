// Red Solar Viva · _shared/terraMuro.ts v1.1 — (v1.1: lee el muro, la salida y los errores de las columnas `m`, `s` y `e` de cada fila, porque `b`
// trae solo las batallas) — 🜂 EL MURO DE LA COMPRA, DÓNDE SE VAN Y LOS ERRORES (la compra de Terra Cristal, segunda tanda,
// 2026-10-17; Zak: «adelante, implementemos esas 4 que faltan de telemetría»)
// =============================================================================
// La cuenta pura (sin base ni red) que hace admin-action v1.65 en el modo «batallas» de admin_terra_cristal, con las mismas filas: la
// bitácora de cada jugador (documento.bitacora, el contrato de terra-cristal-pixel3/src/juego/bitacora.ts v1.6):
//   · el embudo del muro: cuántos jugadores llegaron a cada paso al menos una vez (lo vieron, tocaron Desbloquear, entraron a su cuenta,
//     abrieron el pago, pagaron, dijeron «Ahora no») y cuántas veces en total;
//   · por qué «Ahora no»: los motivos, en veces («precio», «despues», «ver_mas», «no_convence», «sin_motivo»);
//   · dónde se van: la última salida de cada jugador (el lugar y la escena donde cerró o dejó el juego), de la más común a la menos;
//   · los errores del juego: cada mensaje, cuántos jugadores lo tuvieron, cuántas veces y la última vez.
// Las cuentas de administrador no cuentan (como en las batallas).

export type FilaMuro = { clerk_user_id: string; m?: unknown; s?: unknown; e?: unknown }
type Pasos = { visto: number; desbloquear: number; cuenta: number; pago: number; pagado: number; ahora_no: number }
export type SumaMuro = {
    /** jugadores (sin los administradores) */
    jugadores: number
    /** cuántos jugadores llegaron a cada paso (al menos una vez) */
    embudo: Pasos
    /** cuántas veces pasó cada paso, entre todos */
    veces: Pasos
    /** por qué «Ahora no», en veces */
    motivos: Record<string, number>
    /** la última salida de cada jugador: dónde (lugar y escena), de la más común a la menos (las 12 primeras) */
    salidas: { lugar: string; escena: string; jugadores: number }[]
    /** los errores: cada mensaje con sus jugadores, sus veces y la última vez (los 12 que más jugadores tuvieron) */
    errores: { m: string; jugadores: number; veces: number; ultima: string }[]
    /** cuántos jugadores tuvieron algún error */
    con_errores: number
}

const PASOS = ["visto", "desbloquear", "cuenta", "pago", "pagado", "ahora_no"] as const
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
const txt = (x: unknown, max = 160): string => (typeof x === "string" ? x.slice(0, max) : "")

export function sumaMuro(filas: FilaMuro[], admins: Set<string> = new Set()): SumaMuro {
    const embudo: Pasos = { visto: 0, desbloquear: 0, cuenta: 0, pago: 0, pagado: 0, ahora_no: 0 }
    const veces: Pasos = { visto: 0, desbloquear: 0, cuenta: 0, pago: 0, pagado: 0, ahora_no: 0 }
    const motivos: Record<string, number> = {}
    const salidas = new Map<string, { lugar: string; escena: string; jugadores: number }>()
    const errores = new Map<string, { m: string; jugadores: number; veces: number; ultima: string }>()
    let jugadores = 0, conErrores = 0
    for (const f of filas) {
        if (admins.has(f.clerk_user_id)) continue
        const m = obj(f.m), sal = obj(f.s), er = obj(f.e)
        jugadores++
        for (const p of PASOS) {
            const n = num(m[p])
            veces[p] += n
            if (n > 0) embudo[p]++
        }
        for (const [k, v] of Object.entries(obj(m.motivos))) if (k.length <= 20 && num(v)) motivos[k] = (motivos[k] ?? 0) + num(v)
        const escena = txt(sal.escena, 40)
        if (escena) {
            const lugar = txt(sal.lugar, 40)
            const llave = `${lugar}|${escena}`
            const e = salidas.get(llave) ?? { lugar, escena, jugadores: 0 }
            e.jugadores++
            salidas.set(llave, e)
        }
        const ultimos = Array.isArray(er.ultimos) ? er.ultimos : []
        if (ultimos.length) conErrores++
        for (const x of ultimos) {
            const o = obj(x)
            const msg = txt(o.m)
            if (!msg) continue
            const e = errores.get(msg) ?? { m: msg, jugadores: 0, veces: 0, ultima: "" }
            e.jugadores++
            e.veces += Math.max(1, num(o.veces))
            const t = txt(o.t, 40)
            if (t > e.ultima) e.ultima = t
            errores.set(msg, e)
        }
    }
    return {
        jugadores,
        embudo,
        veces,
        motivos,
        salidas: [...salidas.values()].sort((a, b) => b.jugadores - a.jugadores).slice(0, 12),
        errores: [...errores.values()].sort((a, b) => b.jugadores - a.jugadores || b.veces - a.veces).slice(0, 12),
        con_errores: conErrores,
    }
}
