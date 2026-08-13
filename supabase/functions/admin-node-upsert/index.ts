// admin/supabase/functions/admin-node-upsert/index.ts v1.0
// =====================================================================
// Ola C · #4 — escritura de `node_details` SOLO por admin verificado.
//
// La lectura de node_details es pública (el hub pinta sus tarjetas con la
// anon key). La ESCRITURA estaba abierta a cualquiera por la anon key
// (tabla UNRESTRICTED). Este edge cierra el hueco: verifica el token de
// sesión de Clerk del admin (gateAdmin vs el JWKS de la instancia) y recién
// entonces hace el upsert con service_role (que bypassa la RLS que ahora
// bloquea la escritura anónima). Replica el mismo upsert PostgREST que hacía
// el cliente (Prefer: merge-duplicates) → formato de datos idéntico.
//
// Request:  POST { token, node: { id, title, ... , sprints, updated_at } }
// Response: { ok: true } | { error } con status.
// Despliegue: supabase functions deploy admin-node-upsert --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }

    const body = await req.json().catch(() => ({}))

    // Gate: token de Clerk verificado + is_admin. Rechaza antes de tocar la DB.
    const gate = await gateAdmin(body?.token)
    if (!gate.ok) {
        return json({ error: gate.error }, gate.status || 401)
    }

    const node = body?.node
    if (!node || typeof node !== "object" || !node.id) {
        return json({ error: "missing_node" }, 400)
    }

    // service_role bypassa RLS → upsert (merge-duplicates por PK id), idéntico
    // al que hacía el cliente con la anon key.
    const r = await fetch(`${SUPABASE_URL}/rest/v1/node_details`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(node),
    })
    if (!r.ok) {
        const detail = (await r.text()).slice(0, 400)
        console.error("[admin-node-upsert] upsert fail:", r.status, detail)
        return json({ error: "upsert_failed", detail }, 400)
    }

    return json({ ok: true })
})
