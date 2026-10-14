// Red Solar Viva · terra-cristal-bitacora v1.0 — 🜂 LA BITÁCORA DE QUIEN JUEGA SIN CUENTA (Sala 40 de Terra Cristal, 2026-10-14)
// =====================================================================
// Terra Cristal (play.redsolarviva.com/terra-cristal-pixel3/) se puede jugar sin cuenta, y sin cuenta la partida vive solo en el aparato:
// el Motor no veía a quien jugaba así (Zak, Sala 40: «que el Motor vea también a quien juega sin cuenta, su bitácora con el id de su
// aparato»). Desde la Sala 40 el juego manda aquí, cada cinco minutos mientras se juega, después de cada guardado y al cerrar la pestaña,
// su partida con la bitácora del viaje (terra-cristal-pixel3/src/juego/huella.ts). Se guarda en terra_cristal_aparatos (migración
// 20261014_terra_cristal_aparatos): UNA fila por aparato, siempre con lo último. Con la sesión de Red Solar Viva el envío lleva el token y
// la fila queda ligada a la cuenta (el id sale del token, nunca del cuerpo); así el Motor ve también la bitácora más fresca de quien juega
// con cuenta, sin esperar a su siguiente guardado. Se lee en el Motor → Terra Cristal (admin-action v1.63).
//
// Contra el abuso: un aparato nuevo cuesta un lugar en el gobernador de siempre (reserve_edge_spend: 3 al día por aparato, 30 por IP y
// 5000 en total); uno que ya existe se actualiza como mucho cada 40 segundos (sin tocar el gobernador: no llena su libro); lo que llega
// mide como mucho 120 KB y un envío más viejo que lo guardado (la bitácora con una fecha anterior) no lo pisa. Mientras la tabla no exista,
// contesta 503 «falta_migracion»: el juego lo vuelve a intentar en su siguiente envío (la bitácora sigue en el aparato).
//
//   POST { v: 1, aparato: string, token?: string, admin?: boolean, documento: DocPartida (con su bitácora v1, sin la batalla a medias),
//          juego?, navegador?, idioma?, zona? }
//   →    200 { ok: true } · 200 { ok: true, viejo: true } (no pisó lo guardado) · 400 { error } · 413 · 429 { error: "pronto" | "limite" }
//        · 503 { error: "falta_migracion", migracion } · 500 { error }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy terra-cristal-bitacora --no-verify-jwt
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY (los de siempre)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

const TABLA = "terra_cristal_aparatos"
const MIGRACION = "20261014_terra_cristal_aparatos"
/** Lo más que puede medir lo que llega y el documento que se guarda (la bitácora mide como mucho 40 KB en el juego; la partida, unos 5). */
const MAX_CUERPO = 160_000
const MAX_DOCUMENTO = 120_000
const MAX_BITACORA = 64_000
/** Cada cuánto, como mucho, se actualiza un aparato (el juego manda cada cinco minutos, tras cada guardado y al cerrar la pestaña). */
const MIN_ENTRE_ENVIOS_MS = 40_000
/** El cupo para los aparatos NUEVOS: por aparato, por IP y en total, en 24 horas. */
const CUPO = { porAparato: 3, porIp: 30, total: 5000, ventana: 86400 }

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

const FALTA = new Set(["42P01", "PGRST205", "PGRST202", "42883"])
const APARATO = /^[A-Za-z0-9-]{8,64}$/

const esObj = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x)
/** Un texto limpio (sin caracteres de control) y con tope, o null. */
function txt(v: unknown, max: number): string | null {
    if (typeof v !== "string") return null
    const s = v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim()
    return s ? s.slice(0, max) : null
}
/** Una fecha ISO que se lee, o "" (así se comparan como texto). */
const iso = (v: unknown): string => {
    const t = typeof v === "string" && v.length <= 40 ? Date.parse(v) : NaN
    return Number.isFinite(t) ? new Date(t).toISOString() : ""
}

/** La bitácora tal cual si tiene su forma (v: 1) y cabe; si no cabe, sin sus sucesos más viejos; null si no es una bitácora. */
function bitacoraLimpia(b: unknown): Record<string, unknown> | null {
    if (!esObj(b) || b.v !== 1) return null
    const copia: Record<string, any> = { ...b }
    let s = JSON.stringify(copia)
    while (s.length > MAX_BITACORA && Array.isArray(copia.sucesos) && copia.sucesos.length) {
        copia.sucesos = copia.sucesos.slice(Math.ceil(copia.sucesos.length / 4))
        s = JSON.stringify(copia)
    }
    return s.length > MAX_BITACORA ? null : (JSON.parse(s) as Record<string, unknown>)
}

/** El documento de la partida: un objeto con su bitácora, sin la batalla a medias y sin la cuenta que diga traer (la cuenta la pone el
 *  token); null si no tiene la forma o no cabe. */
function documentoLimpio(d: unknown): Record<string, unknown> | null {
    if (!esObj(d)) return null
    const bitacora = bitacoraLimpia(d.bitacora)
    if (!bitacora) return null
    const { batalla: _batalla, bitacora: _b, ...resto } = d
    const doc = { ...resto, bitacora }
    const s = JSON.stringify(doc)
    if (s.length > MAX_DOCUMENTO) return null
    return JSON.parse(s) as Record<string, unknown>
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" })
    if (Number(req.headers.get("content-length") || 0) > MAX_CUERPO) return json(413, { error: "muy_grande" })

    let body: any
    try {
        const crudo = await req.text()
        if (crudo.length > MAX_CUERPO) return json(413, { error: "muy_grande" })
        body = JSON.parse(crudo)
    } catch {
        return json(400, { error: "invalid_json_body" })
    }
    if (!esObj(body) || body.v !== 1) return json(400, { error: "envio_invalido" })
    const aparato = typeof body.aparato === "string" && APARATO.test(body.aparato) ? body.aparato : null
    if (!aparato) return json(400, { error: "aparato_invalido" })
    const documento = documentoLimpio(body.documento)
    if (!documento) return json(400, { error: "documento_invalido" })

    // ── de quién: la cuenta verificada (si el token valida); sin token, la fila se queda como estaba (o sin cuenta)
    let cuenta: string | null = null
    const token = typeof body.token === "string" ? body.token : ""
    if (token) {
        const g = await gateUser(token)
        if (g.ok && g.userId) cuenta = g.userId
    }

    // ── ¿existe la tabla? ¿ya está este aparato? ¿llegó hace muy poco? ¿lo de aquí es más nuevo?
    const ya = await supabase.from(TABLA).select("aparato,clerk_user_id,envios,actualizado,ultima:documento->bitacora->>ultima").eq("aparato", aparato).maybeSingle()
    if (ya.error) {
        const code = String(ya.error.code || "")
        console.error("[terra-cristal-bitacora] tabla:", code, ya.error.message)
        if (FALTA.has(code)) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        return json(500, { error: "lectura_fallo" })
    }
    const antes = ya.data as { clerk_user_id: string | null; envios: number | null; actualizado: string | null; ultima: string | null } | null
    const ultimaNueva = iso((documento.bitacora as Record<string, unknown>)?.ultima)
    if (antes) {
        const hace = Date.now() - (Date.parse(String(antes.actualizado || "")) || 0)
        if (hace < MIN_ENTRE_ENVIOS_MS) return json(429, { error: "pronto", espera: Math.ceil((MIN_ENTRE_ENVIOS_MS - hace) / 1000) })
        const ultimaVieja = iso(antes.ultima)
        if (ultimaVieja && ultimaNueva && ultimaNueva < ultimaVieja) return json(200, { ok: true, viejo: true })
    } else {
        // ── un aparato nuevo pasa por el gobernador (aparato, IP, total)
        const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim()
        const cupo = await supabase.rpc("reserve_edge_spend", {
            p_edge: "terra_aparato",
            p_user_key: `ap:${aparato}`,
            p_ip: ip || null,
            p_cost: 1,
            p_user_limit: CUPO.porAparato,
            p_user_window_seconds: CUPO.ventana,
            p_ip_limit: CUPO.porIp,
            p_ip_window_seconds: CUPO.ventana,
            p_global_limit: CUPO.total,
            p_global_window_seconds: CUPO.ventana,
        })
        if (cupo.error) console.error("[terra-cristal-bitacora] cupo:", cupo.error.message)
        else if (cupo.data && cupo.data.ok === false) return json(429, { error: "limite", razon: cupo.data.reason ?? null })
    }

    const fila = {
        aparato,
        clerk_user_id: cuenta ?? antes?.clerk_user_id ?? null,
        documento,
        admin: body.admin === true,
        juego: txt(body.juego, 40),
        navegador: txt(body.navegador, 240),
        idioma: txt(body.idioma, 20),
        zona: txt(body.zona, 60),
        envios: Math.min(2_000_000_000, (Number(antes?.envios) || 0) + 1),
        actualizado: new Date().toISOString(),
    }
    const up = await supabase.from(TABLA).upsert(fila, { onConflict: "aparato" })
    if (up.error) {
        const code = String(up.error.code || "")
        console.error("[terra-cristal-bitacora] guardar:", code, up.error.message)
        if (FALTA.has(code)) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        return json(500, { error: "guardar_fallo" })
    }
    if (!antes) console.log(`[terra-cristal-bitacora] aparato nuevo ${aparato.slice(0, 8)} · ${cuenta ? "con cuenta" : "sin cuenta"}${fila.admin ? " · admin" : ""}`)
    return json(200, { ok: true })
})
