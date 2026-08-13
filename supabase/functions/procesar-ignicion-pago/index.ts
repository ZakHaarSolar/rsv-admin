// ════════════════════════════════════════════════════════════════════
// Red Solar Viva — Edge Function `procesar-ignicion-pago` (v1.7)
//
// v1.7 (2026-06-13) — SEGURIDAD: rate-limit anti-griefing. Antes de crear el
//   hold llama reserve_edge_spend (por IP + email, ventana 10 min) → 429 si
//   excede. Frena el griefing de cupos con holds sin pagar. Fail-open si la
//   RPC no existe / falla (nunca rompe una reserva legítima).
// v1.6 (2026-06-09) — Quitado el descuento de miembro en Sesiones 1:1:
//   amount_member_cents = amount_mxn_cents para individual_30/45/60.
//   Todos pagan el precio completo (1,333 / 1,777 / 2,222 MXN).
// v1.5 (2026-06-07) — SEGURIDAD: se elimina amount_override_mxn_cents del body
//   (permitía al cliente fijar cualquier precio ≥1 peso). El monto ahora es
//   100% server-side (env test flags → miembro verificado → catálogo).
// v1.4 (2026-04-23) — nuevo flag BOOKING_1TO1_TEST_MODE que SOLO afecta
// a slot_types individual_* (30/45/60). Cuando true, cobra 10 MXN
// (mínimo Stripe Checkout MXN). Útil para QA end-to-end del flujo de
// Transmisión 1:1 sin gastar 1,333–2,222 por prueba. Apagar con:
//    supabase secrets unset BOOKING_1TO1_TEST_MODE
// El flag anterior BOOKING_TEST_MODE (afecta TODO pago) sigue funcionando.
//
// Crea una reserva temporal (hold de 15 min) en `reservas` para un slot
// específico y devuelve la URL de Stripe Checkout en MXN. El Stripe
// webhook (checkout.session.completed) la confirma vía RPC
// `confirm_booking_by_session` cuando el pago se procesa.
//
// Flow:
//   1. Cliente llama POST con { slot_id, name, email, clerk_user_id?,
//      slot_type, success_url, cancel_url }
//   2. Edge Function:
//      a. Valida payload.
//      b. Llama RPC `create_booking_hold` → reserva_id.
//      c. Crea Stripe Checkout Session (currency: mxn).
//      d. Llama RPC `attach_stripe_session(reserva_id, session.id)`.
//      e. Devuelve { checkout_url, reserva_id }.
//
// Secrets requeridos:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - STRIPE_SECRET_KEY
//
// Despliegue: supabase functions deploy procesar-ignicion-pago --no-verify-jwt
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Stripe from "https://esm.sh/stripe@16.7.0"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-06-30.basil",
})

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// ═══ Catálogo de productos ═══
//
// Cada slot_type tiene precio regular + precio miembro (Inmersión Solar
// activa). El server VERIFICA contra la tabla subscriptions antes de
// aplicar el descuento — nunca se le confía al cliente.
//
// Todos los precios en centavos MXN.
const PRODUCT_CATALOG: Record<
    string,
    {
        name: string
        description: string
        amount_mxn_cents: number
        amount_member_cents: number
    }
> = {
    grupal_pulsar: {
        name: "Pase de Exploración · Cámara Solar",
        description: "Sesión grupal de 60 minutos",
        amount_mxn_cents: 55500, // 555 MXN
        amount_member_cents: 55500,
    },
    grupal_cuasar: {
        name: "Pase de Exploración · Cámara Solar",
        description: "Sesión grupal de 60 minutos",
        amount_mxn_cents: 55500,
        amount_member_cents: 55500,
    },
    individual_30: {
        name: "Cámara de Resonancia · 30 min",
        description: "Sesión 1:1 con Zak'Haar — 30 min",
        amount_mxn_cents: 133300, // 1,333 MXN
        amount_member_cents: 133300, // = regular (33% miembro eliminado 2026-06-09)
    },
    individual_45: {
        name: "Cámara de Resonancia · 45 min",
        description: "Sesión 1:1 con Zak'Haar — 45 min",
        amount_mxn_cents: 177700, // $1,777 MXN
        amount_member_cents: 177700, // = regular (33% miembro eliminado 2026-06-09)
    },
    individual_60: {
        name: "Cámara de Resonancia · 60 min",
        description: "Sesión 1:1 con Zak'Haar — 60 min",
        amount_mxn_cents: 222200, // $2,222 MXN
        amount_member_cents: 222200, // = regular (33% miembro eliminado 2026-06-09)
    },
}

/* ═══ Test Modes ═══
   Dos flags independientes; ambos bajan el cobro a 10 MXN (mínimo de
   Stripe Checkout MXN), suficiente para pruebas end-to-end con tarjeta
   real + verificación del flujo de ingresos en Telemetría del Núcleo.

   - BOOKING_TEST_MODE=true           → TODOS los slot_type (incluye grupales).
   - BOOKING_1TO1_TEST_MODE=true      → SOLO individual_30/45/60 (v1.4).

   Apagar después del QA:
       supabase secrets unset BOOKING_TEST_MODE
       supabase secrets unset BOOKING_1TO1_TEST_MODE
*/
const TEST_MODE =
    (Deno.env.get("BOOKING_TEST_MODE") || "").toLowerCase() === "true"
const TEST_1TO1_MODE =
    (Deno.env.get("BOOKING_1TO1_TEST_MODE") || "").toLowerCase() === "true"
const TEST_AMOUNT_CENTS = 1000 // $10 MXN (mínimo de Stripe Checkout MXN)

/* Verificá contra Supabase si el tripulante tiene Inmersión Solar activa.
   Se usa email para resolver — funciona para guests también.
   Devuelve true si encuentra cualquier fila subscriptions con status='active'. */
async function verifyActiveMember(email: string): Promise<boolean> {
    if (!email) return false
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .eq("status", "active")
            .limit(1)
        if (error) {
            console.error("[procesar-ignicion-pago] verifyMember error:", error)
            return false
        }
        return Array.isArray(data) && data.length > 0
    } catch (e) {
        console.error("[procesar-ignicion-pago] verifyMember throw:", e)
        return false
    }
}

interface BookingPayload {
    slot_id: string
    slot_type: keyof typeof PRODUCT_CATALOG
    name: string
    email: string
    clerk_user_id?: string | null
    success_url: string
    cancel_url: string
    /* Cliente indica si cree que es miembro; el server re-verifica
       contra subscriptions antes de aplicar descuento. */
    is_active_member?: boolean
    /* v1.3 — timezone del browser del tripulante (ej. "America/Mexico_City"
       o "Europe/Madrid"). Viaja por metadata de Stripe → webhook →
       PaseExploracion.js que renderiza las horas del email en esa zona. */
    timezone?: string
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

/* v1.2 — construye el success_url correctamente cuando la URL tiene hash.
   Input ejemplo:
     "https://www.redsolarviva.com/nucleo#camara-solar"
   Output:
     "https://www.redsolarviva.com/nucleo?session_id={CHECKOUT_SESSION_ID}#camara-solar"
   Si el caller ya incluye {CHECKOUT_SESSION_ID} literal, lo respetamos. */
function buildSuccessUrl(baseUrl: string): string {
    if (baseUrl.includes("{CHECKOUT_SESSION_ID}")) return baseUrl
    const hashIdx = baseUrl.indexOf("#")
    if (hashIdx === -1) {
        const joiner = baseUrl.includes("?") ? "&" : "?"
        return `${baseUrl}${joiner}session_id={CHECKOUT_SESSION_ID}`
    }
    const beforeHash = baseUrl.slice(0, hashIdx)
    const afterHash = baseUrl.slice(hashIdx) // incluye el '#'
    const joiner = beforeHash.includes("?") ? "&" : "?"
    return `${beforeHash}${joiner}session_id={CHECKOUT_SESSION_ID}${afterHash}`
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405)
    }

    let payload: BookingPayload
    try {
        payload = await req.json()
    } catch {
        return jsonResponse({ error: "JSON inválido" }, 400)
    }

    const {
        slot_id,
        slot_type,
        name,
        email,
        clerk_user_id,
        success_url,
        cancel_url,
        is_active_member,
        timezone,
    } = payload

    if (!slot_id || !slot_type || !name?.trim() || !email?.trim() || !success_url || !cancel_url) {
        return jsonResponse({ error: "Faltan campos obligatorios (slot_id, slot_type, name, email, success_url, cancel_url)" }, 400)
    }

    const product = PRODUCT_CATALOG[slot_type]
    if (!product) {
        return jsonResponse({ error: `slot_type desconocido: ${slot_type}` }, 400)
    }

    /* ── Rate-limit anti-griefing (holds sin pagar saturan cupos) ──
       Reusa reserve_edge_spend (service_role): por IP y por email, ventana de
       10 min. Fail-open si la RPC no existe / falla → nunca rompe la reserva. */
    const clientIp = (
        req.headers.get("x-forwarded-for") ||
        req.headers.get("cf-connecting-ip") ||
        ""
    )
        .split(",")[0]
        .trim()
    try {
        const { data: rl } = await supabase.rpc("reserve_edge_spend", {
            p_edge: "rsv_booking_hold",
            p_user_key: email.trim().toLowerCase(),
            p_ip: clientIp || null,
            p_cost: 1,
            p_user_limit: 6,
            p_user_window_seconds: 600,
            p_ip_limit: 6,
            p_ip_window_seconds: 600,
            p_global_limit: 150,
            p_global_window_seconds: 3600,
        })
        if (rl && (rl as any).ok === false) {
            return jsonResponse(
                { error: "Demasiados intentos de reserva. Esperá unos minutos." },
                429
            )
        }
    } catch (_) {
        // fail-open: si la RPC no existe / falla, no bloqueamos la reserva.
    }

    /* ── Cálculo del monto (100% server-side; el cliente NO fija el precio) ──
       Prioridad:
         1. BOOKING_TEST_MODE (env, todos los tipos) → 10 MXN.
         2. BOOKING_1TO1_TEST_MODE (env, solo individual_*) → 10 MXN.
         3. Miembro activo verificado → amount_member_cents.
         4. Default → amount_mxn_cents.
    */
    const is1to1 = slot_type.startsWith("individual_")
    let amount: number
    let pricing_source: string
    if (TEST_MODE) {
        amount = TEST_AMOUNT_CENTS
        pricing_source = "test_mode"
    } else if (TEST_1TO1_MODE && is1to1) {
        amount = TEST_AMOUNT_CENTS
        pricing_source = "test_1to1_mode"
    } else if (is_active_member === true) {
        // Server-side verify — no le confiamos al cliente el descuento
        const isMember = await verifyActiveMember(email)
        if (isMember) {
            amount = product.amount_member_cents
            pricing_source = "member_verified"
        } else {
            amount = product.amount_mxn_cents
            pricing_source = "regular_not_member"
        }
    } else {
        amount = product.amount_mxn_cents
        pricing_source = "regular"
    }
    console.log(`💰 pricing: ${pricing_source} → ${amount} cents MXN`)

    if (amount < 100) {
        return jsonResponse({ error: "Monto inválido" }, 400)
    }

    /* ── 1. Crear hold en Supabase ── */
    let reservaId: string
    try {
        const { data, error } = await supabase.rpc("create_booking_hold", {
            p_asiento_id: slot_id,
            p_name: name.trim(),
            p_email: email.trim().toLowerCase(),
            p_amount_mxn_cents: amount,
            p_clerk_user_id: clerk_user_id ?? null,
            p_hold_minutes: 15,
        })
        if (error) {
            console.error("[procesar-ignicion-pago] create_hold error:", error)
            return jsonResponse({ error: error.message || "No se pudo crear el hold" }, 409)
        }
        reservaId = data as string
        console.log(`✅ Hold creado: ${reservaId} para slot ${slot_id}`)
    } catch (e) {
        console.error("[procesar-ignicion-pago] create_hold throw:", e)
        return jsonResponse({ error: String((e as Error).message || e) }, 500)
    }

    /* ── 2. Crear Stripe Checkout Session ── */
    let session: Stripe.Checkout.Session
    try {
        session = await stripe.checkout.sessions.create({
            mode: "payment",
            currency: "mxn",
            payment_method_types: ["card"],
            // Permite ingresar códigos de descuento en el Checkout (igual
            // que VTLI). Solo aparece el campo si hay al menos un Promotion
            // Code activo creado en el Stripe Dashboard.
            allow_promotion_codes: true,
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
            customer_email: email.trim().toLowerCase(),
            /* v1.2 — build correcto de success_url cuando tiene hash.
               Antes si success_url era `/nucleo#camara-solar`, el append
               de `?session_id=...` quedaba DESPUÉS del hash, resultando
               en `/nucleo#camara-solar?session_id=...` → el navegador
               interpretaba todo el tail como hash y MiNucleo no leía
               bien el tab. Ahora inyectamos el query ANTES del hash:
               `/nucleo?session_id=...#camara-solar`. */
            success_url: buildSuccessUrl(success_url),
            cancel_url,
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Stripe expira el checkout en 30 min (mín 30, máx 24h)
            metadata: {
                payment_type: "booking",
                reserva_id: reservaId,
                slot_id,
                slot_type,
                name: name.trim(),
                clerk_user_id: clerk_user_id ?? "",
                /* v1.3 — viaja con el checkout; el webhook de Supabase lo
                   lee y lo manda al Pipedream PaseExploracion.js para
                   renderizar el email en la zona real del tripulante. */
                timezone: timezone || "America/Cancun",
            },
        })
        console.log(`✅ Checkout creado: ${session.id} → ${session.url}`)
    } catch (e: any) {
        /* v1.1 — logging detallado + mensaje con la razón real en la
           respuesta para que el cliente pueda mostrar algo útil en lugar
           de "Error creando sesión de pago" genérico. */
        const stripeMsg =
            e?.raw?.message ||
            e?.message ||
            (typeof e === "string" ? e : "desconocido")
        const stripeCode = e?.code || e?.raw?.code || ""
        console.error(
            "[procesar-ignicion-pago] stripe error:",
            stripeCode,
            stripeMsg,
            e
        )
        try {
            await supabase
                .from("reservas")
                .update({
                    status: "cancelada",
                    cancel_reason: `stripe:${stripeCode || "unknown"}:${String(stripeMsg).slice(0, 120)}`,
                })
                .eq("id", reservaId)
        } catch (cleanupErr) {
            console.error("[procesar-ignicion-pago] cleanup error:", cleanupErr)
        }
        return jsonResponse(
            {
                error: `Stripe: ${stripeMsg}`,
                stripe_code: stripeCode,
            },
            502
        )
    }

    /* ── 3. Vincular session_id a la reserva ── */
    try {
        const { error } = await supabase.rpc("attach_stripe_session", {
            p_reserva_id: reservaId,
            p_stripe_session_id: session.id,
        })
        if (error) {
            console.error("[procesar-ignicion-pago] attach_session error:", error)
            // No es fatal — el webhook puede correlacionar por otros medios.
            // Pero loggeamos.
        }
    } catch (e) {
        console.error("[procesar-ignicion-pago] attach throw:", e)
    }

    return jsonResponse({
        checkout_url: session.url,
        reserva_id: reservaId,
        session_id: session.id,
        expires_at_utc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
})
