// Red Solar Viva · _shared/terraBatallas.ts v1.2 — (v1.2, la compra, 2026-10-17: cada fila trae también `m`, `s` y `e`, el muro de la compra, la salida
// y los errores de su bitácora, para _shared/terraMuro.ts; aquí no se usan) — 🜂 LO QUE USAN EN CADA BATALLA Y LO QUE CONTESTAN (Sala 42 E de Terra Cristal, tercera tanda,
// 2026-10-15): cada batalla suma lo que hizo la alianza en ella (documento.bitacora.batallas[id].acciones, desde el juego de la Sala 42 E:
// «ilumina», «magia:<id>», «portal», «portal_sella», «regreso»...): cuántas veces entre todos y cuántos jugadores lo usaron (`acciones`, de lo
// que más se usa a lo que menos); y lo que contestan a «¿Por qué sigues en Terra Cristal?» (documento.respuesta, `r`; `respuestas`).
// Red Solar Viva · _shared/terraBatallas.ts v1.0 — 🜂 LAS BATALLAS QUE MÁS CUESTAN (Sala 39 de Terra Cristal, 2026-10-13)
// =============================================================================
// La cuenta pura (sin base ni red) que hace admin-action v1.62 en el modo «batallas» de admin_terra_cristal: las batallas de la bitácora
// de cada partida (documento.bitacora.batallas, el contrato de terra-cristal-pixel3/src/juego/bitacora.ts: intentos, ganadas, perdidas,
// regresos, rondas del último intento, mejor = las rondas de la victoria más corta, ultima = cuándo se peleó) sumadas entre todos.
// Aparte para probarla sin la base (terra-cristal-pixel3/herramientas/motor_batallas.ts) y para que el banco del Motor arme sus números
// de ejemplo con la misma cuenta.
//   · victorias: de los intentos que terminaron (ganados, perdidos o dejados con el Regreso); null si ninguno terminó.
//   · se quedan aquí: la última batalla que pelearon y todavía no ganan (el primer reto se pierde a propósito: si es la última, se
//     quedaron después de perderlo); se fueron: de ellos, quienes no juegan hace tres días o más.
//   · las cuentas de administrador no cuentan (excluidos).
//   · (Zak, segunda tanda: «asegúrate que venga qué dificultad eligieron en el Motor») con `dificultad`, solo las partidas de esa manera de
//     viajar (densidad o friccion; las que no eligieron, «sin»); `viajes` cuenta cuántas hay de cada una (sin el filtro).

export type FilaBatallas = { clerk_user_id: string; b: unknown; u: string | null; /** la manera de viajar (densidad, friccion o null) */ d?: string | null; /** v1.1 · su respuesta a «¿Por qué sigues en Terra Cristal?» */ r?: string | null; /** v1.2 · el muro de la compra, la salida y los errores de su bitácora (documento.bitacora.muro, .salida, .errores) */ m?: unknown; s?: unknown; e?: unknown }

export type BatallaSuma = {
    id: string
    jugadores: number
    ganaron: number
    intentos: number
    ganadas: number
    perdidas: number
    regresos: number
    sin_terminar: number
    victorias: number | null
    intentos_por_jugador: number | null
    intentos_hasta_ganar: number | null
    rondas_ganar: number | null
    rondas_ultima: number | null
    se_quedan: number
    se_fueron: number
    ultima: string | null
    /** v1.1 · lo que hizo la alianza en esta batalla, entre todos: cuántas veces y cuántos jugadores (de lo que más a lo que menos) */
    acciones: { k: string; veces: number; jugadores: number }[]
}

export type SumaBatallas = {
    batallas: BatallaSuma[]
    jugadores: number
    con_batallas: number
    quedados: number
    excluidos: number
    /** cuántas partidas hay de cada manera de viajar (sin el administrador, sin el filtro) */
    viajes: { densidad: number; friccion: number; sin: number }
    /** el filtro que se usó (null: las dos) */
    dificultad: string | null
    /** v1.1 · lo que contestan a «¿Por qué sigues en Terra Cristal?» (alma, rindo, llamaron, nose), entre los jugadores que cuentan */
    respuestas: Record<string, number>
}
/** v1.1 · Cuántas acciones distintas devuelve cada batalla (las que más se usan). */
export const ACCIONES_TOPE = 24
/** La manera de viajar de una partida, como la cuenta el Motor. */
const viajeDe = (d: unknown): "densidad" | "friccion" | "sin" => (d === "densidad" || d === "friccion" ? d : "sin")

/** Cuánto sin jugar para contar como «se fue» (tres días). */
export const SE_FUERON_MS = 3 * 86400000

export const mediana = (xs: number[]): number | null => {
    if (!xs.length) return null
    const o = [...xs].sort((a, b) => a - b)
    const m = Math.floor(o.length / 2)
    return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}
const promedio = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0)

export function sumaBatallas(filas: FilaBatallas[], admins: Set<string> = new Set(), ahora = Date.now(), dificultad: string | null = null): SumaBatallas {
    const filtro = dificultad === "densidad" || dificultad === "friccion" || dificultad === "sin" ? dificultad : null
    const viajes = { densidad: 0, friccion: 0, sin: 0 }
    type Suma = {
        id: string
        jugadores: number
        ganaron: number
        intentos: number
        ganadas: number
        perdidas: number
        regresos: number
        sinTerminar: number
        hastaGanar: number[]
        rondasGanar: number[]
        rondasUltima: number[]
        seQuedan: number
        seFueron: number
        ultima: number
        acciones: Map<string, { veces: number; jugadores: number }>
    }
    const suma = new Map<string, Suma>()
    const de = (id: string): Suma => {
        let s = suma.get(id)
        if (!s) {
            s = { id, jugadores: 0, ganaron: 0, intentos: 0, ganadas: 0, perdidas: 0, regresos: 0, sinTerminar: 0, hastaGanar: [], rondasGanar: [], rondasUltima: [], seQuedan: 0, seFueron: 0, ultima: -Infinity, acciones: new Map() }
            suma.set(id, s)
        }
        return s
    }
    let jugadores = 0, conBatallas = 0, excluidos = 0, quedados = 0
    const respuestas: Record<string, number> = {}
    for (const f of filas) {
        if (admins.has(f.clerk_user_id)) {
            excluidos++
            continue
        }
        const v = viajeDe(f.d)
        viajes[v]++
        if (filtro && v !== filtro) continue
        jugadores++
        // v1.1 · su respuesta (una por jugador)
        if (typeof f.r === "string" && f.r && f.r.length <= 20) respuestas[f.r] = (respuestas[f.r] ?? 0) + 1
        const b = f.b && typeof f.b === "object" && !Array.isArray(f.b) ? (f.b as Record<string, Record<string, unknown>>) : null
        if (!b) continue
        let ultimaId: string | null = null, ultimaT = -Infinity, alguna = false
        for (const [id, v] of Object.entries(b)) {
            if (!id || id.length > 40 || !v || typeof v !== "object" || Array.isArray(v)) continue
            const intentos = n(v.intentos)
            if (!intentos) continue
            alguna = true
            const ganadas = n(v.ganadas), perdidas = n(v.perdidas), regresos = n(v.regresos)
            const s = de(id)
            s.jugadores++
            s.intentos += intentos
            s.ganadas += ganadas
            s.perdidas += perdidas
            s.regresos += regresos
            s.sinTerminar += Math.max(0, intentos - ganadas - perdidas - regresos)
            if (ganadas > 0) {
                s.ganaron++
                s.hastaGanar.push(intentos)
                if (n(v.mejor) > 0) s.rondasGanar.push(n(v.mejor))
            }
            if (n(v.rondas) > 0) s.rondasUltima.push(n(v.rondas))
            // v1.1 · lo que hizo en ella (desde el juego de la Sala 42 E)
            const ac = v.acciones && typeof v.acciones === "object" && !Array.isArray(v.acciones) ? (v.acciones as Record<string, unknown>) : null
            if (ac)
                for (const [k, x] of Object.entries(ac)) {
                    const veces = n(x)
                    if (!veces || !k || k.length > 40) continue
                    const a = s.acciones.get(k) ?? { veces: 0, jugadores: 0 }
                    a.veces += veces
                    a.jugadores++
                    s.acciones.set(k, a)
                }
            const t = Date.parse(String(v.ultima || ""))
            if (Number.isFinite(t)) {
                if (t > s.ultima) s.ultima = t
                if (t > ultimaT) {
                    ultimaT = t
                    ultimaId = id
                }
            }
        }
        if (!alguna) continue
        conBatallas++
        if (ultimaId && n(b[ultimaId]?.ganadas) === 0) {
            const s = de(ultimaId)
            s.seQuedan++
            quedados++
            const u = Date.parse(String(f.u || ""))
            if (Number.isFinite(u) && ahora - u >= SE_FUERON_MS) s.seFueron++
        }
    }
    const batallas = [...suma.values()].map((s): BatallaSuma => {
        const terminadas = s.ganadas + s.perdidas + s.regresos
        return {
            id: s.id,
            jugadores: s.jugadores,
            ganaron: s.ganaron,
            intentos: s.intentos,
            ganadas: s.ganadas,
            perdidas: s.perdidas,
            regresos: s.regresos,
            sin_terminar: s.sinTerminar,
            victorias: terminadas ? s.ganadas / terminadas : null,
            intentos_por_jugador: s.jugadores ? s.intentos / s.jugadores : null,
            intentos_hasta_ganar: mediana(s.hastaGanar),
            rondas_ganar: mediana(s.rondasGanar),
            rondas_ultima: promedio(s.rondasUltima),
            se_quedan: s.seQuedan,
            se_fueron: s.seFueron,
            ultima: Number.isFinite(s.ultima) ? new Date(s.ultima).toISOString() : null,
            acciones: [...s.acciones.entries()]
                .map(([k, a]) => ({ k, veces: a.veces, jugadores: a.jugadores }))
                .sort((a, b) => b.veces - a.veces || b.jugadores - a.jugadores || a.k.localeCompare(b.k))
                .slice(0, ACCIONES_TOPE),
        }
    })
    return { batallas, jugadores, con_batallas: conBatallas, quedados, excluidos, viajes, dificultad: filtro, respuestas }
}
