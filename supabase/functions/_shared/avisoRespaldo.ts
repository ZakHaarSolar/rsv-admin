// _shared/avisoRespaldo.ts v1.0 — 🜂 EL AVISO CUANDO OPENROUTER FALLA (Zak 2026-10-18: «si llega un fallback, ¿hay forma de
// que me llegue un email de aviso o algo… para ver de inmediato qué sucede? Es respaldo, pero la idea es que DeepSeek funcione»).
//
// Cada vez que el Espejo no puede escribir con OpenRouter (llave, saldo, caída, red) el Arquitecto se entera al momento:
//   · una NOTIFICACIÓN a sus teléfonos (send-push a las cuentas con is_admin). Funciona hoy sin nada más;
//   · un CORREO a AVISO_RESPALDO_CORREO (zakhaarsol@pm.me por defecto) en cuanto exista el secreto RESEND_API_KEY:
//     Proton solo manda desde Pipedream y Supabase bloquea su puerto 587, así que el correo va por HTTP.
// El texto dice si contestó el respaldo (Claude Haiku 5.5) o si la persona se quedó sin reflejo.
// Uno cada 30 minutos como máximo para toda la app (ventana global 'aviso-respaldo'): una caída larga no manda cien.
// Cada reflejo que escribió el respaldo se anota en 'oraculo-respaldo', para contarlos.
// Nunca lanza. Quien lo llama no lo espera (EdgeRuntime.waitUntil).

declare const EdgeRuntime: any

const CORREO_POR_DEFECTO = "zakhaarsol@pm.me"
const VENTANA_SEG = 30 * 60

function servicio(): { url: string; key: string } | null {
    const url = Deno.env.get("SUPABASE_URL")
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    return url && key ? { url, key } : null
}

async function rpc(nombre: string, params: unknown): Promise<any> {
    const s = servicio()
    if (!s) return null
    try {
        const r = await fetch(`${s.url}/rest/v1/rpc/${nombre}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: s.key, Authorization: `Bearer ${s.key}` },
            body: JSON.stringify(params),
            signal: AbortSignal.timeout(5000),
        })
        return r.ok ? await r.json().catch(() => null) : null
    } catch {
        return null
    }
}

export type AvisoRespaldo = {
    /** "dio 402", "dio 503", "no contestó"… */
    motivo: string
    /** true si el reflejo lo escribió el respaldo; false si la persona se quedó sin reflejo */
    respondio: boolean
    /** prueba: no anota, no respeta la ventana y lo dice en el título */
    prueba?: boolean
}

export async function avisarRespaldo(a: AvisoRespaldo): Promise<{ push: number; correo: boolean; omitido?: string }> {
    const s = servicio()
    if (!s) return { push: 0, correo: false, omitido: "sin_servicio" }
    try {
        if (!a.prueba) {
            if (a.respondio)
                await rpc("reserve_edge_spend", { p_edge: "oraculo-respaldo", p_cost: 1, p_user_limit: 0, p_ip_limit: 0, p_global_limit: 0 })
            const v = await rpc("reserve_edge_spend", {
                p_edge: "aviso-respaldo",
                p_cost: 1,
                p_global_limit: 1,
                p_global_window_seconds: VENTANA_SEG,
            })
            if (v && v.ok === false) return { push: 0, correo: false, omitido: "ya_avisado" }
        }
        const hora = new Date().toLocaleTimeString("es-MX", { timeZone: "America/Cancun", hour: "2-digit", minute: "2-digit" })
        const titulo = `${a.prueba ? "Prueba · " : ""}${a.respondio ? "El Espejo está usando el respaldo" : "El Espejo no pudo responder"}`
        const cuerpo = a.respondio
            ? `OpenRouter ${a.motivo} a las ${hora}. Contestó Claude Haiku 5.5. Revisa el saldo y el estado de OpenRouter.`
            : `OpenRouter ${a.motivo} a las ${hora} y el respaldo no contestó (o está apagado). Revisa el saldo y el estado de OpenRouter.`

        let push = 0
        const secreto = Deno.env.get("PUSH_DISPATCH_SECRET") || ""
        if (secreto) {
            const r = await fetch(`${s.url}/rest/v1/profiles?is_admin=eq.true&select=clerk_user_id`, {
                headers: { apikey: s.key, Authorization: `Bearer ${s.key}` },
                signal: AbortSignal.timeout(5000),
            }).catch(() => null)
            const admins = r && r.ok ? ((await r.json().catch(() => [])) as Array<{ clerk_user_id: string }>) : []
            for (const ad of admins) {
                if (!ad?.clerk_user_id) continue
                const rp = await fetch(`${s.url}/functions/v1/send-push`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-dispatch-secret": secreto, Authorization: `Bearer ${s.key}` },
                    body: JSON.stringify({ clerk_user_id: ad.clerk_user_id, title: titulo, body: cuerpo, data: { type: "aviso_respaldo" } }),
                    signal: AbortSignal.timeout(10000),
                }).catch(() => null)
                const jp = rp && rp.ok ? await rp.json().catch(() => null) : null
                push += Number(jp?.sent) || 0
            }
        }

        let correo = false
        const resend = Deno.env.get("RESEND_API_KEY") || ""
        if (resend) {
            const rc = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: Deno.env.get("AVISO_RESPALDO_REMITENTE") || "Escáner Vibracional <onboarding@resend.dev>",
                    to: [Deno.env.get("AVISO_RESPALDO_CORREO") || CORREO_POR_DEFECTO],
                    subject: titulo,
                    text: `${cuerpo}\n\nSaldo: https://openrouter.ai/settings/credits\nEstado: https://status.openrouter.ai`,
                }),
                signal: AbortSignal.timeout(10000),
            }).catch(() => null)
            correo = !!rc && rc.ok
            if (rc && !rc.ok) console.warn("[aviso-respaldo] el correo no salió:", rc.status, (await rc.text().catch(() => "")).slice(0, 200))
        }
        console.warn(`[aviso-respaldo] ${titulo} · OpenRouter ${a.motivo} · notificaciones ${push} · correo ${correo}`)
        return { push, correo }
    } catch (e) {
        console.warn("[aviso-respaldo] falló:", String(e).slice(0, 200))
        return { push: 0, correo: false, omitido: "error" }
    }
}

/** Dispara el aviso sin hacer esperar la respuesta de quien escribió. */
export function avisarRespaldoSinEsperar(a: AvisoRespaldo): void {
    const p = avisarRespaldo(a).catch(() => null)
    try {
        if (typeof EdgeRuntime !== "undefined" && typeof EdgeRuntime?.waitUntil === "function") EdgeRuntime.waitUntil(p)
    } catch {
        /* sin EdgeRuntime: la promesa corre sola */
    }
}
