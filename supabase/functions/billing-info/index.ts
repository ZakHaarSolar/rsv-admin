/*
 * ══════════════════════════════════════════════════════════════
 *  Supabase Edge Function: billing-info  v1.0
 *  Tu plan y tus pagos, para leerlos DENTRO de la casa.
 *
 *  Hasta ahora "Tu plan y pagos" era un salto directo al portal de Stripe:
 *  otra pestaña, otra marca, otra tipografía, y de vuelta. Esta función
 *  devuelve lo que se necesita para MOSTRARLO adentro (plan, estado, cuándo
 *  se renueva, con qué tarjeta y los últimos cobros), y el salto a Stripe
 *  queda para lo único que de verdad tiene que pasar allá: cambiar la
 *  tarjeta o cancelar.
 *
 *  La identidad se resuelve SERVER-SIDE del token de Clerk, exactamente
 *  igual que create-portal-session: el cliente jamás manda un customer_id.
 *
 *  Deploy: supabase functions deploy billing-info --no-verify-jwt
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

const stripeGet = async (path: string) => {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    })
    if (!r.ok) {
        console.error("[billing-info] stripe", path, r.status, await r.text())
        return null
    }
    return await r.json().catch(() => null)
}

serve(async (req) => {
    if (req.method === "OPTIONS")
        return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    try {
        if (!STRIPE_SECRET_KEY) return json({ error: "sin_stripe" }, 503)

        const body = await req.json().catch(() => ({}))
        const gate = await gateUser(body?.token)
        if (!gate.ok) return json({ error: gate.error }, gate.status || 401)

        /* ── ¿Hay cliente de Stripe a nombre de esta persona? ──────────
           Si no lo hay, no es un fallo: es la respuesta. Puede que su plan
           viva en la App Store, o que todavía no tenga ninguno. La pantalla
           lo dice en una línea en vez de mostrar un error. */
        const { data: perfil, error: errPerfil } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("clerk_user_id", gate.userId)
            .limit(1)
        if (errPerfil) {
            console.error("[billing-info] perfil", errPerfil.message)
            return json({ error: "perfil_falló" }, 500)
        }
        const customer = (perfil?.[0] as { stripe_customer_id?: string } | undefined)
            ?.stripe_customer_id

        /* La membresía puede existir sin pagos por la web: en ese caso la
           fuente de verdad es `subscriptions`, que el webhook de la tienda
           también escribe. Se lee siempre para poder decir "tu plan vive en
           el iPhone" en vez de "no tienes plan". */
        const { data: subs } = await supabase
            .from("subscriptions")
            .select("group_name, status, current_period_end, platform")
            .eq("clerk_user_id", gate.userId)
            .order("current_period_end", { ascending: false })
            .limit(1)
        const suscripcion = (subs?.[0] as Record<string, unknown> | undefined) || null

        if (!customer) {
            return json({
                ok: true,
                origen: suscripcion ? "tienda" : "ninguno",
                plan: (suscripcion?.group_name as string) || null,
                estado: (suscripcion?.status as string) || null,
                periodo_fin: (suscripcion?.current_period_end as string) || null,
                tarjeta: null,
                facturas: [],
            })
        }

        /* ── El plan vivo en Stripe ────────────────────────────────────
           `expand` trae el precio y el método de pago por defecto en la
           MISMA llamada: tres viajes de red se vuelven uno. */
        const subStripe = await stripeGet(
            `subscriptions?customer=${customer}&status=all&limit=1` +
                `&expand[]=data.default_payment_method` +
                `&expand[]=data.items.data.price`
        )
        const s = subStripe?.data?.[0] || null

        /* Si la suscripción no trae tarjeta propia, la del cliente sirve. */
        let pm = s?.default_payment_method
        if (!pm || typeof pm === "string") {
            const cli = await stripeGet(
                `customers/${customer}?expand[]=invoice_settings.default_payment_method`
            )
            pm = cli?.invoice_settings?.default_payment_method || null
        }
        const tarjeta =
            pm && typeof pm === "object" && pm.card
                ? {
                      marca: String(pm.card.brand || ""),
                      ultimos4: String(pm.card.last4 || ""),
                      mes: Number(pm.card.exp_month) || null,
                      anio: Number(pm.card.exp_year) || null,
                  }
                : null

        const fac = await stripeGet(`invoices?customer=${customer}&limit=8`)
        const facturas = Array.isArray(fac?.data)
            ? fac.data.map((i: Record<string, any>) => ({
                  id: String(i.id || ""),
                  /* Stripe cuenta en centavos; la pantalla habla en pesos. */
                  monto: (Number(i.amount_paid ?? i.amount_due) || 0) / 100,
                  moneda: String(i.currency || "mxn").toUpperCase(),
                  estado: String(i.status || ""),
                  fecha: i.created
                      ? new Date(Number(i.created) * 1000).toISOString()
                      : null,
                  link: i.hosted_invoice_url || i.invoice_pdf || null,
              }))
            : []

        return json({
            ok: true,
            origen: "web",
            plan:
                s?.items?.data?.[0]?.price?.nickname ||
                s?.items?.data?.[0]?.price?.product ||
                (suscripcion?.group_name as string) ||
                null,
            estado: s?.status || (suscripcion?.status as string) || null,
            /* `cancel_at_period_end` es la diferencia entre "se renueva" y
               "termina": sin este dato la fecha miente por omisión. */
            cancela_al_final: Boolean(s?.cancel_at_period_end),
            periodo_fin: s?.current_period_end
                ? new Date(Number(s.current_period_end) * 1000).toISOString()
                : (suscripcion?.current_period_end as string) || null,
            monto: s?.items?.data?.[0]?.price?.unit_amount
                ? Number(s.items.data[0].price.unit_amount) / 100
                : null,
            moneda: String(
                s?.items?.data?.[0]?.price?.currency || "mxn"
            ).toUpperCase(),
            intervalo: s?.items?.data?.[0]?.price?.recurring?.interval || null,
            tarjeta,
            facturas,
        })
    } catch (e) {
        console.error("[billing-info]", String(e))
        return json({ error: (e as Error).message }, 500)
    }
})
