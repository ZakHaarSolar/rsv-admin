// Red Solar Viva · me v1.0
// =====================================================================
// Perfil propio del Tripulante, server-authoritative. REEMPLAZA el uso de
// get_profile_by_clerk_id para el self-lookup: el clerk_user_id sale del
// claim `sub` del token de sesión de Clerk (verificado contra el JWKS de
// nuestra instancia vía el helper compartido), NUNCA de un parámetro del
// body. Así nadie puede leer el perfil de otro pasando un id arbitrario —
// cierra el oráculo de is_admin/email.
//
// Devuelve el MISMO shape que el oráculo (objeto profiles) MENOS
// stripe_customer_id, para ser drop-in con los callers existentes
// (leen .is_admin / .id / .full_name).
//
// Secrets requeridos: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// Despliegue: supabase functions deploy me --no-verify-jwt
//
// Request body (JSON): { "token": "<token de sesión de Clerk, de getToken()>" }
// Response: el objeto profiles (sin stripe_customer_id), o null si no existe.
//           Error: { "error": "invalid_token" } (401) | { "error": "missing_token" } (400)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

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

// Todas las columnas de profiles MENOS stripe_customer_id.
const SAFE_COLUMNS =
    "id, clerk_user_id, email, full_name, avatar_url, created_at, updated_at, is_admin, avatar_material, avatar_polarity, ai_consent_at"

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }

    const body = await req.json().catch(() => ({}))
    const gate = await gateUser(body?.token)
    if (!gate.ok) {
        return json({ error: gate.error }, gate.status || 401)
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(SAFE_COLUMNS)
        .eq("clerk_user_id", gate.userId!)
        .maybeSingle()

    if (error) {
        console.error("[me] profile lookup fail:", error.code || error.message)
        return json({ error: "profile_lookup_failed" }, 500)
    }

    // Mismo shape que el oráculo (objeto), o null si el perfil no existe aún.
    return json(data ?? null)
})
