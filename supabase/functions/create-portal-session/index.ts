/*
 * ══════════════════════════════════════════════════════════════
 *  Supabase Edge Function: create-portal-session
 *  Crea una sesión de Stripe Customer Portal (acceso directo, sin email)
 *
 *  Deploy: supabase functions deploy create-portal-session
 *  Secret: supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXX
 * ══════════════════════════════════════════════════════════════
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || ""

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        if (!STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY not configured")
        }

        const { customer_id, return_url } = await req.json()

        if (!customer_id) {
            return new Response(
                JSON.stringify({ error: "customer_id is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            )
        }

        // Crear sesión de Stripe Customer Portal
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
            return new Response(
                JSON.stringify({ error: "Failed to create portal session" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            )
        }

        const session = await stripeResponse.json()

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error:", error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    }
})