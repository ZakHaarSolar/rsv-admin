// admin/supabase/functions/vtli-procesar-reserva/index.ts v1.4
// Veo Tu Luz Interna · Motor de Reservas — crea Stripe Checkout + hold atómico
//
// v1.4 — SEGURIDAD: rate-limit anti-griefing. Antes de crear la Stripe session
//        + hold llama reserve_edge_spend (por IP + email, ventana 10 min) → 429
//        si excede. Frena el griefing de cupos con holds sin pagar. Fail-open
//        si la RPC no existe / falla.
// v1.3 — Fix raíz del confirm vacío. Orden invertido: ahora generamos un
//        groupId localmente con crypto.randomUUID(), creamos la Stripe
//        Checkout Session primero (con metadata.ciclo_group_id), y SOLO
//        después llamamos vtli_create_hold pasándole group_id +
//        stripe_session_id ya cableados. Atomic: si el hold falla, no
//        queda nada huérfano. Devuelve manage_token al cliente para uso
//        futuro del Magic Link de Gestionar.
// v1.2 — Descripción del producto a 60 min + allow_promotion_codes.
// v1.1 — Precios hardcoded inline (price_data en lugar de price_id), mismo
//        patrón que `procesar-ignicion-pago` de RSV. Cero Payment Links que
//        crear a mano. Si Zak quiere cambiar precios, ajusta VTLI_CATALOG
//        abajo y vuelve a deployar.
//
// Recibe POST con:
// {
//   slot_ids: string[],     // UUIDs de vtli_slots (length === sessions_count)
//   nombre: string,
//   email: string,
//   telefono?: string,
//   pilar_id: string,       // "vision" | "telekinesis" | "calibracion" | "sintonia"
//   sessions_count: 1|3|4|8 // ciclo elegido
//   success_url?: string,   // opcional; default veotuluzinterna.com/agendado
//   cancel_url?: string,    // opcional; default veotuluzinterna.com/?canceled=1
// }
//
// Devuelve:
// { url: string, session_id: string, ciclo_group_id: string }
//
// Secrets requeridos en Supabase:
//   · STRIPE_SECRET_KEY            (compartido con RSV)
//   · SUPABASE_URL                 (auto)
//   · SUPABASE_SERVICE_ROLE_KEY    (auto)
//   · VTLI_SITE_URL                (opcional, default https://veotuluzinterna.com)
//
// Deploy:
//   supabase functions deploy vtli-procesar-reserva --no-verify-jwt

import { serve } from "https://deno.land/std@0.207.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SITE_URL = Deno.env.get("VTLI_SITE_URL") ?? "https://veotuluzinterna.com"

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })

// ═══════════════════════════════════════════════════════════════════════════
// CATÁLOGO · Veo Tu Luz Interna
// Precios EN CENTAVOS MXN. Ajusta los valores y haz redeploy.
// ═══════════════════════════════════════════════════════════════════════════
const VTLI_CATALOG: Record<
    number,
    { name: string; description: string; amount_mxn_cents: number }
> = {
    1: {
        name: "Veo Tu Luz Interna · 1 sesión",
        description: "Una sesión presencial 1:1 en Cancún · 60 min",
        amount_mxn_cents: 111100, // 1,111 MXN
    },
    3: {
        name: "Veo Tu Luz Interna · Ciclo de 3 sesiones",
        description: "Tres sesiones presenciales 1:1, mismo día y hora durante 3 semanas",
        amount_mxn_cents: 333300, // 3,333 MXN
    },
    4: {
        name: "Veo Tu Luz Interna · Ciclo VEO Base (4 sesiones)",
        description: "Cuatro sesiones presenciales 1:1, mismo día y hora durante 4 semanas",
        amount_mxn_cents: 444400, // 4,444 MXN
    },
    8: {
        name: "Veo Tu Luz Interna · Ciclo Maestría (8 sesiones)",
        description: "Ocho sesiones presenciales 1:1, mismo día y hora durante 8 semanas",
        amount_mxn_cents: 888800, // 8,888 MXN
    },
}

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
}

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, "Content-Type": "application/json" },
    })

/* Rate-limit anti-griefing: reusa reserve_edge_spend (service_role). Devuelve
   true si la reserva se permite, false si excede la ventana. Fail-open ante
   cualquier error (RPC inexistente / red) → nunca rompe una reserva legítima. */
async function allowBooking(userKey: string, ip: string): Promise<boolean> {
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                p_edge: "vtli_booking_hold",
                p_user_key: userKey || null,
                p_ip: ip || null,
                p_cost: 1,
                p_user_limit: 6,
                p_user_window_seconds: 600,
                p_ip_limit: 6,
                p_ip_window_seconds: 600,
                p_global_limit: 120,
                p_global_window_seconds: 3600,
            }),
        })
        if (!r.ok) return true // fail-open
        const d = await r.json()
        return d?.ok !== false
    } catch {
        return true // fail-open
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS")
        return new Response(null, { headers: CORS })
    if (req.method !== "POST")
        return json(405, { error: "Method not allowed" })

    try {
        const body = await req.json()
        const {
            slot_ids,
            nombre,
            email,
            telefono,
            pilar_id,
            sessions_count,
            success_url,
            cancel_url,
            is_for_child,
            child_name,
            child_age,
        } = body || {}

        // ── Validaciones ────────────────────────────────────────────────────
        if (!Array.isArray(slot_ids) || slot_ids.length === 0)
            throw new Error("slot_ids vacío o inválido")
        if (typeof email !== "string" || !email.includes("@"))
            throw new Error("email inválido")
        if (typeof nombre !== "string" || nombre.trim().length < 2)
            throw new Error("nombre requerido")
        if (typeof pilar_id !== "string" || !pilar_id)
            throw new Error("pilar_id requerido")

        const sessions = Number(sessions_count) || 0
        const product = VTLI_CATALOG[sessions]
        if (!product)
            throw new Error(`sessions_count inválido: ${sessions} (válidos: 1, 3, 4, 8)`)
        if (slot_ids.length !== sessions)
            throw new Error(
                `slot_ids tiene ${slot_ids.length} elementos pero sessions_count es ${sessions}`
            )

        // ── Rate-limit anti-griefing (holds sin pagar saturan cupos) ──
        const clientIp = (
            req.headers.get("x-forwarded-for") ||
            req.headers.get("cf-connecting-ip") ||
            ""
        )
            .split(",")[0]
            .trim()
        if (!(await allowBooking(email.trim().toLowerCase(), clientIp)))
            return json(429, {
                error: "Demasiados intentos de reserva. Esperá unos minutos.",
            })

        const amount = product.amount_mxn_cents

        // ── 1) Generar groupId localmente (UUID v4) ─────────────────────────
        // Lo necesitamos para meterlo en metadata de Stripe antes del hold.
        const groupId = crypto.randomUUID()

        // ── 2) Crear Stripe Checkout Session (price_data inline) ────────────
        const successUrl =
            success_url || `${SITE_URL}/?vtli_success=1&pilar=${pilar_id}&session={CHECKOUT_SESSION_ID}`
        const cancelUrl = cancel_url || `${SITE_URL}/?canceled=1`

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            currency: "mxn",
            payment_method_types: ["card"],
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: "mxn",
                        unit_amount: amount,
                        product_data: {
                            name: product.name,
                            description: product.description,
                        },
                    },
                },
            ],
            // Acepta códigos promocionales (incluyendo cupones 100 % off
            // para pruebas creados desde el Dashboard de Stripe).
            allow_promotion_codes: true,
            customer_email: email.trim().toLowerCase(),
            client_reference_id: email.trim().toLowerCase(),
            success_url: successUrl,
            cancel_url: cancelUrl,
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
            metadata: {
                product_family: "VTLI",
                ciclo_group_id: groupId,
                pilar_id,
                sessions_count: String(sessions),
                nombre: nombre.trim(),
                telefono: telefono ?? "",
                is_for_child: is_for_child ? "true" : "false",
                child_name:
                    typeof child_name === "string" ? child_name.trim() : "",
                child_age:
                    typeof child_age === "number" ? String(child_age) : "",
            },
            payment_intent_data: {
                metadata: {
                    product_family: "VTLI",
                    ciclo_group_id: groupId,
                    pilar_id,
                    sessions_count: String(sessions),
                },
            },
        })

        // ── 3) Crear hold atómico en Supabase con TODO cableado ─────────────
        // group_id + stripe_session_id ya van adentro. Si falla, ni Stripe
        // session quedó completada del lado del cliente (aún no ha pagado),
        // así que el daño es ninguno.
        const holdRes = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/vtli_create_hold`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                    p_slot_ids: slot_ids,
                    p_nombre: nombre.trim(),
                    p_email: email.trim().toLowerCase(),
                    p_telefono: telefono ?? "",
                    p_pilar_id: pilar_id,
                    p_sessions_count: sessions,
                    p_amount_mxn_cents: amount,
                    p_is_for_child: Boolean(is_for_child),
                    p_child_name:
                        typeof child_name === "string" && child_name.trim()
                            ? child_name.trim()
                            : null,
                    p_child_age:
                        typeof child_age === "number" && child_age > 0
                            ? Math.floor(child_age)
                            : null,
                    p_group_id: groupId,
                    p_stripe_session_id: session.id,
                }),
            }
        )
        if (!holdRes.ok) {
            const txt = await holdRes.text()
            // Intentamos expirar la Stripe session para no dejar un cobro
            // huérfano (cliente NO ha pagado todavía pero el link existe).
            try {
                await stripe.checkout.sessions.expire(session.id)
            } catch (_) {}
            throw new Error(`vtli_create_hold falló: ${txt.slice(0, 200)}`)
        }
        const holdResult = (await holdRes.json()) as {
            group_id?: string
            manage_token?: string
        }
        const manage_token = holdResult?.manage_token ?? null

        return json(200, {
            url: session.url,
            session_id: session.id,
            ciclo_group_id: groupId,
            manage_token,
            amount_mxn_cents: amount,
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[vtli-procesar-reserva]", msg)
        return json(400, { error: msg })
    }
})
