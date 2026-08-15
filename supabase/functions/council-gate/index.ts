// Red Solar Viva · council-gate v1.0 — 🜂 EL PORTÓN DEL COUNCIL SOLAR
// (redsolarviva.com/council, el Centro de Mando).
//
// Dos servicios, un solo portón:
//   { token, quiero: "acceso" } → verifica que el token de Clerk sea de un
//     Arquitecto (gateAdmin: JWKS de nuestra instancia + profiles.is_admin) y
//     responde { ok: true }. El cliente expulsa a la portada si no.
//   { token, quiero: "voz" }    → mismo portón, y además ACUÑA una llave
//     TEMPORAL de Soniox (usage_type transcribe_websocket) para que el SDK web
//     abra la sesión de dictado. La llave maestra SONIOX_API_KEY nunca sale
//     de aquí. Se ata al Arquitecto con client_reference_id.
//
// La inferencia del Council NO pasa por aquí: corre en la Mac del Arquitecto
// (Ollama, localhost) y el navegador le habla directo.
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY ·
//          SONIOX_API_KEY (ya existe para espejo-voz) · SONIOX_STT_MODEL (opcional)
// Despliegue: supabase functions deploy council-gate --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

const SONIOX_KEY = Deno.env.get("SONIOX_API_KEY") || ""
const STT_MODEL = Deno.env.get("SONIOX_STT_MODEL") || "stt-rt-v5"
/* Vida de la llave temporal: solo se usa para ABRIR el socket; una vez
   abierta, la sesión sigue aunque la llave venza. */
const EXPIRA_S = 600

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    let body: { token?: string; quiero?: string } = {}
    try {
        body = await req.json()
    } catch {
        return json({ error: "bad_json" }, 400)
    }

    const gate = await gateAdmin(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status ?? 401)

    const quiero = body.quiero === "voz" ? "voz" : "acceso"
    if (quiero === "acceso") return json({ ok: true, userId: gate.userId })

    if (!SONIOX_KEY) return json({ ok: false, error: "soniox_key_missing" }, 500)
    try {
        const r = await fetch("https://api.soniox.com/v1/auth/temporary-api-key", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SONIOX_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usage_type: "transcribe_websocket",
                expires_in_seconds: EXPIRA_S,
                client_reference_id: `council:${gate.userId}`,
            }),
        })
        if (!r.ok) {
            const detalle = await r.text().catch(() => "")
            console.error("[council-gate] soniox", r.status, detalle.slice(0, 300))
            return json({ ok: false, error: `soniox_${r.status}` }, 502)
        }
        const j = (await r.json()) as { api_key?: string; expires_in_seconds?: number }
        if (!j.api_key) return json({ ok: false, error: "soniox_sin_llave" }, 502)
        return json({
            ok: true,
            voz: { apiKey: j.api_key, model: STT_MODEL, expiresIn: j.expires_in_seconds ?? EXPIRA_S },
        })
    } catch (e) {
        console.error("[council-gate] soniox fetch", String(e))
        return json({ ok: false, error: "soniox_unreachable" }, 502)
    }
})
