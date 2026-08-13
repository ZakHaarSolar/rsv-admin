/*
 * ══════════════════════════════════════════════════════════════
 *  Supabase Edge Function: soporte-stripe  v1.0
 *
 *  EL CRUCE QUE NUESTRA BASE NO PUEDE HACER SOLA. El panel de Soporte
 *  del Motor contrasta lo que la persona dijo (últimos 4 de su tarjeta,
 *  id del recibo, monto, fecha) contra el pago REAL. El id del recibo, el
 *  monto y la fecha viven en `payments_log` y los devuelve la RPC
 *  `admin_soporte_buscar_cuenta`. Los ÚLTIMOS 4 DE LA TARJETA no viven en
 *  ninguna tabla nuestra — nunca los guardamos, y está bien que así sea:
 *  se los preguntamos a Stripe en el momento, por el customer del cobro.
 *
 *  Por qué importa que sea este filtro: casi nadie conserva el id de un
 *  recibo, pero cualquiera sabe los últimos 4 de su tarjeta. Sin esto, el
 *  filtro fuerte del panel existe en el papel y no en la práctica.
 *
 *  Nunca devuelve un número de tarjeta: Stripe jamás lo entrega. Solo
 *  marca, últimos 4, vencimiento y país — lo justo para comparar.
 *
 *  Gate: token de sesión de Clerk verificado + is_admin (gateAdmin, el
 *  mismo portón de admin-action). El cliente no manda ningún id de admin.
 *
 *  Deploy: supabase functions deploy soporte-stripe --no-verify-jwt
 *  Secrets: STRIPE_SECRET_KEY · CLERK_SECRET_KEY · SUPABASE_URL
 *           · SUPABASE_SERVICE_ROLE_KEY
 *
 *  Request:  { token, customer_ids: ["cus_...", ...] }
 *  Response: { ok, tarjetas: { "cus_x": [ {brand,last4,exp,funding,pais} ] },
 *              cargos:   { "cus_x": [ {monto,moneda,fecha,last4,recibo_url,id} ] } }
 * ══════════════════════════════════════════════════════════════
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || ""

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

async function stripeGet(path: string): Promise<any> {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    })
    const body = await r.json().catch(() => null)
    if (!r.ok) {
        throw new Error(
            body?.error?.message || `stripe_${r.status}`
        )
    }
    return body
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    let body: any = null
    try {
        body = await req.json()
    } catch {
        return json({ error: "bad_json" }, 400)
    }

    /* Portón de Arquitecto: token firmado + is_admin. */
    const gate = await gateAdmin(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status || 401)

    if (!STRIPE_SECRET_KEY) {
        /* 🜂 Paso 0-quater: el motivo se dice, no se calla. Sin la llave el
           panel debe poder explicar por qué no hay tarjetas, en vez de
           mostrar un hueco que se lee como "esta persona no pagó". */
        return json({ ok: false, error: "sin_llave_stripe" }, 200)
    }

    const ids: string[] = Array.isArray(body?.customer_ids)
        ? body.customer_ids
              .map((x: unknown) => String(x || "").trim())
              .filter((x: string) => x.startsWith("cus_"))
              .slice(0, 8)
        : []

    if (ids.length === 0) return json({ ok: true, tarjetas: {}, cargos: {} })

    const tarjetas: Record<string, unknown[]> = {}
    const cargos: Record<string, unknown[]> = {}
    const errores: Record<string, string> = {}

    for (const cid of ids) {
        try {
            /* Métodos de pago guardados del cliente. */
            const pms = await stripeGet(
                `payment_methods?customer=${encodeURIComponent(cid)}&type=card&limit=5`
            )
            tarjetas[cid] = (pms?.data || []).map((pm: any) => ({
                brand: pm?.card?.brand || null,
                last4: pm?.card?.last4 || null,
                exp: pm?.card?.exp_month && pm?.card?.exp_year
                    ? `${String(pm.card.exp_month).padStart(2, "0")}/${pm.card.exp_year}`
                    : null,
                funding: pm?.card?.funding || null,
                pais: pm?.card?.country || null,
            }))

            /* Cargos reales: traen la tarjeta USADA en ese cobro (que puede
               no ser la guardada hoy) + la liga del recibo de Stripe. */
            const ch = await stripeGet(
                `charges?customer=${encodeURIComponent(cid)}&limit=10`
            )
            cargos[cid] = (ch?.data || []).map((c: any) => ({
                id: c?.id || null,
                monto: typeof c?.amount === "number" ? c.amount : null,
                moneda: (c?.currency || "").toUpperCase(),
                fecha: c?.created
                    ? new Date(c.created * 1000).toISOString()
                    : null,
                estado: c?.status || null,
                reembolsado: c?.refunded === true,
                last4: c?.payment_method_details?.card?.last4 || null,
                brand: c?.payment_method_details?.card?.brand || null,
                recibo_url: c?.receipt_url || null,
                recibo_num: c?.receipt_number || null,
                factura: c?.invoice || null,
            }))
        } catch (e) {
            errores[cid] = String((e as Error)?.message || e)
        }
    }

    return json({
        ok: true,
        tarjetas,
        cargos,
        errores: Object.keys(errores).length ? errores : undefined,
    })
})
