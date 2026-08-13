/*
 * ══════════════════════════════════════════════════════════════
 *  Supabase Edge Function: create-portal-session  (v2 — Ola C #6)
 *  Crea una sesión de Stripe Customer Portal para el PROPIO usuario.
 *
 *  El customer_id se resuelve SERVER-SIDE del token de sesión de Clerk
 *  verificado (gateUser → clerk_user_id → profiles.stripe_customer_id).
 *  Ya NO se confía en ningún customer_id que mande el cliente: antes
 *  cualquiera podía pasar un `cus_` ajeno y abrir el portal de facturación
 *  de otra persona (IDOR). Ahora el token firmado es la única fuente de
 *  identidad.
 *
 *  Deploy: supabase functions deploy create-portal-session --no-verify-jwt
 *  Secrets: STRIPE_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *           · CLERK_SECRET_KEY (lo usa gateUser para el JWKS)
 * ══════════════════════════════════════════════════════════════
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || ""
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

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }

    try {
        if (!STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY not configured")
        }

        const { token, return_url } = await req.json()

        // Identidad verificada server-side. El customer_id sale de acá,
        // NUNCA del cuerpo del request (cierra el IDOR de facturación).
        const gate = await gateUser(token)
        if (!gate.ok) {
            return json({ error: gate.error }, gate.status || 401)
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("clerk_user_id", gate.userId)
            .not("stripe_customer_id", "is", null)
            .limit(1)
        if (error) {
            console.error("profile lookup error:", error.message)
            return json({ error: "profile_lookup_failed" }, 500)
        }
        const customer_id = (data?.[0] as { stripe_customer_id?: string } | undefined)
            ?.stripe_customer_id
        if (!customer_id) {
            return json({ error: "no_stripe_customer" }, 404)
        }

        // Crear sesión de Stripe Customer Portal para ESE customer.
        const params = new URLSearchParams()
        params.append("customer", customer_id)
        if (return_url) {
            params.append("return_url", return_url)
        }

        const stripeResponse = await fetch(
            "https://api.stripe.com/v1/billing_portal/sessions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            }
        )

        if (!stripeResponse.ok) {
            const err = await stripeResponse.text()
            console.error("Stripe error:", err)
            return json({ error: "Failed to create portal session" }, 500)
        }

        const session = await stripeResponse.json()
        return json({ url: session.url })
    } catch (error) {
        console.error("Error:", error)
        return json({ error: (error as Error).message }, 500)
    }
})
