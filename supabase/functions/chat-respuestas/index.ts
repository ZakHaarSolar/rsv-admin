// admin/supabase/functions/chat-respuestas/index.ts v1.0 — 🜂 ¿LO CONTESTÉ? (Zak 2026-10-23)
// Al tocar un mensaje del otro en el chat de la Comunidad, la app muestra debajo qué mensajes
// tuyos lo contestan: los que lo citaron (los sabe sola) y los que lo contestan sin citarlo,
// que decide esta función leyendo el contexto con Claude Haiku 5.5 (lógica en nucleo.ts).
//
//   POST { token, objetivo, antes, despues, idioma }  →  { respuestas: [{ q, seguridad }] } | { error }
//
// · El texto lo manda la app (ya descifrado en pantalla, solo el tramo necesario, sin
//   nombres ni ids). Nada se guarda: ni el texto ni el resultado.
// · Gobernador (edge_spend_ledger): 300 lecturas al día por persona y 20 mil en total. Cada
//   lectura cuesta ~0.0003 USD (unos 2,500 tokens de entrada). Si el gobernador no contesta
//   se deja pasar: es una lectura de centavos para alguien con sesión verificada.
// · Sin candidatos (no escribiste nada después sin citar) responde vacío sin llamar a la IA.
//
// Deploy:   supabase functions deploy chat-respuestas --no-verify-jwt
// Secrets:  ANTHROPIC_API_KEY · CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY

import { gateUser } from "../_shared/clerkAuth.ts"
import { decidir, normalizar, type Pedido } from "./nucleo.ts"

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const EDGE_NAME = "chat-respuestas"
const USER_LIMIT_DAY = 300
const GLOBAL_LIMIT_DAY = 20000

const json = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v), { status, headers: { ...CORS, "Content-Type": "application/json" } })

async function reservar(userKey: string): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL") || ""
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    if (!supaUrl || !supaKey) return true
    try {
        const r = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: supaKey, Authorization: `Bearer ${supaKey}` },
            body: JSON.stringify({
                p_edge: EDGE_NAME,
                p_user_key: userKey,
                p_cost: 1,
                p_user_limit: USER_LIMIT_DAY,
                p_user_window_seconds: 86400,
                p_global_limit: GLOBAL_LIMIT_DAY,
                p_global_window_seconds: 86400,
            }),
        })
        const j = await r.json().catch(() => null)
        return !(j && j.ok === false)
    } catch {
        return true
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
    if (req.method !== "POST") return json({ error: "method" }, 405)
    let body: any = null
    try {
        body = await req.json()
    } catch {
        return json({ error: "body" }, 400)
    }
    const gate = await gateUser(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status)

    const pedido: Pedido = {
        idioma: body?.idioma,
        objetivo: body?.objetivo || { texto: "" },
        antes: body?.antes || [],
        despues: body?.despues || [],
    }
    if (!normalizar(pedido).candidatos.length) return json({ respuestas: [] })
    if (!(await reservar(gate.userId))) return json({ error: "limite" }, 429)

    const respuestas = await decidir(pedido)
    if (!respuestas) return json({ error: "ia" }, 503)
    return json({ respuestas })
})
