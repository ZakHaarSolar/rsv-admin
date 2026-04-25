// ════════════════════════════════════════════════════════════════════
// Red Solar Viva — stripe-webhook (v2.2 — 2026-04-23)
//
// v2.2 (2026-04-23) — Fix de timezone definitivo:
//   v2.1 normalizó start_time a "...Z" (UTC ISO), pero Zoom IGNORA el
//   sufijo Z cuando el campo `timezone` tiene una zona no-UTC. Usa
//   `timezone` para reparsear los dígitos como hora local → corre la
//   reunión N horas (5 para Panamá/Cancún). Diagnosticado vía
//   zoom_meta.start_time: mandamos 20:00Z + tz=America/Panama, Zoom
//   guardó 01:00Z del día siguiente (= 20:00 Panamá local).
//   Fix: mandar timezone="UTC" siempre. start_time con Z + timezone UTC
//   deja cero ambigüedad. Zak'Haar ve la hora correcta igual porque
//   Zoom convierte al timezone de SU cuenta para display.
//
// v2.1 (2026-04-23) — normalización start_time → Z suffix (insuficiente).
//
// v2 (2026-04-23) — integración Zoom automática 1:1:
//   Cuando un pago de reserva individual_30/45/60 se confirma, creamos
//   una sala de Zoom única (fecha + hora + duración del slot) usando
//   Server-to-Server OAuth. El join_url se guarda en reservas.zoom_*
//   y se pasa al webhook de Pipedream para que el correo lleve el link
//   específico del cliente. Si Zoom falla, caemos a ZOOM_FALLBACK_JOIN_URL
//   (la sala "Red Solar Viva 1-1" de Zak'Haar) y marcamos
//   reservas.zoom_used_fallback=true para la bitácora.
//
//   Secrets requeridos nuevos: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID,
//   ZOOM_CLIENT_SECRET, ZOOM_FALLBACK_JOIN_URL.
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Stripe from "https://esm.sh/stripe@16.7.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-06-30.basil"
})

const encoder = new TextEncoder()

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ====================== PRODUCT → GROUP MAP ====================== */
// Mapeo de Product IDs de Stripe → group_name en subscriptions
// Cuando crees nuevos productos, agrega su ID aquí.
const PRODUCT_GROUP_MAP: Record<string, string> = {
    'prod_UJPj3SUcvleCdS': 'cuasar',     // Inmersión Solar - Cuásar (4:30pm)
    'prod_UOf1RrEypuWFTg': 'sintonia',   // Sintonía Solar ($777 MXN/mes)
    // 'prod_XXXXXXXXX': 'pulsar',         // ← Agrega aquí tu Product ID de Púlsar cuando lo tengas
}

// Si el producto NO está en el mapa, default → 'pulsar' (grupo original)
function detectGroupName(sub: any): string {
    const items = sub.items?.data || []
    for (const item of items) {
        const productId = item.price?.product || item.plan?.product || null
        if (productId && PRODUCT_GROUP_MAP[productId]) {
            return PRODUCT_GROUP_MAP[productId]
        }
    }
    // Default: si no reconocemos el producto, asumimos Púlsar (grupo original)
    return 'pulsar'
}

/* ====================== HELPERS ====================== */
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const parts = signature.split(",")
    const timestampPart = parts.find(p => p.startsWith("t="))
    const sigPart = parts.find(p => p.startsWith("v1="))
    if (!timestampPart || !sigPart) return false

    const timestamp = timestampPart.split("=")[1]
    const expectedSig = sigPart.split("=")[1]
    const signedPayload = `${timestamp}.${payload}`

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload))
    const computedSig = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, "0")).join("")

    if (computedSig.length !== expectedSig.length) return false
    let result = 0
    for (let i = 0; i < computedSig.length; i++) result |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
    if (result !== 0) return false

    const tolerance = 300
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - parseInt(timestamp)) > tolerance) return false

    return true
}

function unixToISO(unixSeconds: number | null | undefined): string | null {
    if (!unixSeconds) return null
    return new Date(unixSeconds * 1000).toISOString()
}

async function getProfileByClerkId(clerkUserId: string) {
    const { data } = await supabase.from("profiles").select("id").eq("clerk_user_id", clerkUserId).single()
    return data
}

async function getProfileByEmail(email: string) {
    const { data } = await supabase.from("profiles").select("id").eq("email", email.toLowerCase().trim()).single()
    return data
}

function latestDate(a: string | null, b: string | null): string | null {
    if (!a) return b
    if (!b) return a
    return new Date(a) > new Date(b) ? a : b
}

async function getExistingSubDates(stripeSubId: string): Promise<{ current_period_start: string | null; current_period_end: string | null } | null> {
    const { data } = await supabase
        .from("subscriptions")
        .select("current_period_start, current_period_end")
        .eq("stripe_subscription_id", stripeSubId)
        .single()
    return data || null
}

/* ====================== ZOOM HELPERS (v2 — 2026-04-23) ======================
 * Creación automática de salas 1:1 con Server-to-Server OAuth.
 * App "Red Solar Viva 1-1" en Zoom Marketplace.
 * Secrets: ZOOM_ACCOUNT_ID · ZOOM_CLIENT_ID · ZOOM_CLIENT_SECRET
 * Fallback: ZOOM_FALLBACK_JOIN_URL (sala recurrente de Zak'Haar).
 */

const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID")
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID")
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET")
const ZOOM_FALLBACK_JOIN_URL = Deno.env.get("ZOOM_FALLBACK_JOIN_URL")

/* Cache de token en memoria del worker. Renovamos 5 min antes de
   vencer para cubrir drift de reloj + latencia. */
let zoomTokenCache: { token: string; expiresAt: number } | null = null

async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    ms: number
): Promise<Response> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ms)
    try {
        return await fetch(url, { ...init, signal: ctrl.signal })
    } finally {
        clearTimeout(timer)
    }
}

async function getZoomAccessToken(): Promise<string | null> {
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        console.warn(
            "[zoom] credenciales incompletas — skipeando creación de sala"
        )
        return null
    }
    const now = Date.now()
    if (zoomTokenCache && now < zoomTokenCache.expiresAt - 5 * 60 * 1000) {
        return zoomTokenCache.token
    }
    try {
        const basic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)
        const body = new URLSearchParams({
            grant_type: "account_credentials",
            account_id: ZOOM_ACCOUNT_ID,
        })
        const r = await fetchWithTimeout(
            "https://zoom.us/oauth/token",
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${basic}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            },
            8000
        )
        if (!r.ok) {
            const txt = await r.text().catch(() => "")
            console.error(
                `[zoom] token HTTP ${r.status}: ${txt.slice(0, 200)}`
            )
            return null
        }
        const data = await r.json()
        const token = data?.access_token
        const expiresIn = Number(data?.expires_in) || 3600
        if (!token) return null
        zoomTokenCache = {
            token,
            expiresAt: now + expiresIn * 1000,
        }
        console.log(
            `[zoom] token renovado (expira en ${expiresIn}s)`
        )
        return token
    } catch (e) {
        console.error("[zoom] token throw:", (e as Error).message)
        return null
    }
}

interface ZoomMeetingResult {
    joinUrl: string
    meetingId: string | null
    password: string | null
    usedFallback: boolean
    error: string | null
    meta: unknown
}

/* Crea una meeting Type 2 (scheduled, fecha fija). Si la API falla,
   devuelve un resultado con usedFallback=true y joinUrl=ZOOM_FALLBACK_JOIN_URL.
   Nunca lanza — el caller siempre recibe un ZoomMeetingResult válido
   para poder UPDATEar reservas y seguir con el correo. */
async function createZoomMeetingSafe(input: {
    topic: string
    startTime: string // ISO 8601
    durationMinutes: number
    timezone: string
}): Promise<ZoomMeetingResult> {
    const fallback: ZoomMeetingResult = {
        joinUrl: ZOOM_FALLBACK_JOIN_URL || "",
        meetingId: null,
        password: null,
        usedFallback: true,
        error: null,
        meta: null,
    }

    /* v2.1 — Normalizar a UTC ISO con sufijo "Z". PostgREST devuelve
       timestamptz como "...+00:00" y Zoom lo malinterpreta (trunca el
       offset y reutiliza el timezone param para la zona → la hora se
       corre). toISOString() siempre devuelve el formato con "Z" que
       Zoom sí reconoce como instante UTC estricto. */
    let startTimeUtc: string
    try {
        startTimeUtc = new Date(input.startTime).toISOString()
    } catch {
        console.error(
            `[zoom] start_time inválido: ${input.startTime}`
        )
        return { ...fallback, error: "invalid_start_time" }
    }
    console.log(
        `[zoom] start_time normalizado: ${input.startTime} → ${startTimeUtc}`
    )

    const token = await getZoomAccessToken()
    if (!token) {
        return { ...fallback, error: "no_access_token" }
    }
    try {
        const r = await fetchWithTimeout(
            "https://api.zoom.us/v2/users/me/meetings",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: input.topic,
                    type: 2,
                    start_time: startTimeUtc,
                    duration: input.durationMinutes,
                    /* v2.2 — forzar "UTC" porque Zoom usa este campo
                       para reparsear start_time aunque tenga sufijo Z.
                       Si mandamos America/Panama acá, los dígitos
                       "20:00" se reinterpretan como 20:00 Panamá (en
                       vez de 20:00 UTC) y la reunión se corre 5h.
                       Con UTC + Z, cero ambigüedad. */
                    timezone: "UTC",
                    settings: {
                        host_video: true,
                        participant_video: true,
                        join_before_host: true,
                        waiting_room: false,
                        auto_recording: "none",
                        mute_upon_entry: false,
                        approval_type: 2,
                    },
                }),
            },
            8000
        )
        if (!r.ok) {
            const txt = await r.text().catch(() => "")
            const err = `HTTP ${r.status}: ${txt.slice(0, 240)}`
            console.error(`[zoom] create_meeting fail: ${err}`)
            return { ...fallback, error: err }
        }
        const data = await r.json()
        const joinUrl = data?.join_url
        const meetingId = data?.id
        const password = data?.password ?? null
        if (!joinUrl || !meetingId) {
            return {
                ...fallback,
                error: "missing_join_url_or_id",
                meta: data,
            }
        }
        console.log(
            `[zoom] ✅ meeting creado: ${meetingId} · ${input.durationMinutes}min · ${input.startTime}`
        )
        return {
            joinUrl,
            meetingId: String(meetingId),
            password,
            usedFallback: false,
            error: null,
            meta: data,
        }
    } catch (e) {
        const msg = (e as Error)?.message || String(e)
        console.error("[zoom] create_meeting throw:", msg)
        return { ...fallback, error: msg }
    }
}

async function persistZoomOnReserva(
    reservaId: string,
    result: ZoomMeetingResult
): Promise<void> {
    try {
        const { error } = await supabase
            .from("reservas")
            .update({
                zoom_join_url: result.joinUrl || null,
                zoom_meeting_id: result.meetingId,
                zoom_password: result.password,
                zoom_used_fallback: result.usedFallback,
                zoom_error: result.error,
                zoom_created_at: new Date().toISOString(),
                zoom_meta: result.meta ?? null,
            })
            .eq("id", reservaId)
        if (error) {
            console.error(
                `[zoom] UPDATE reserva ${reservaId} error: ${error.message}`
            )
        }
    } catch (e) {
        console.error("[zoom] UPDATE throw:", (e as Error).message)
    }
}

function durationMinutesForSlotType(slotType: string): number {
    if (slotType === "individual_30") return 30
    if (slotType === "individual_45") return 45
    if (slotType === "individual_60") return 60
    return 60
}

/* ====================== HANDLERS ====================== */

async function handleSubscriptionCreated(sub: any) {
    let userId: string | null = null
    let email = (sub.customer_email || "").toLowerCase().trim()

    const clerkUserId = sub.metadata?.clerk_user_id
    if (clerkUserId) {
        const profile = await getProfileByClerkId(clerkUserId)
        userId = profile?.id || null
    }

    if (!userId && email) {
        console.log(`🔍 Buscando por email: ${email}`)
        const profile = await getProfileByEmail(email)
        userId = profile?.id || null
    }

    // Obtener nombre del cliente desde Stripe
    let customerName: string | null = null
    try {
        const customer = await stripe.customers.retrieve(sub.customer)
        if (customer && !customer.deleted) {
            customerName = (customer as any).name || null
        }
    } catch (e) {
        console.log("⚠️ No se pudo obtener nombre del customer:", (e as any).message)
    }

    // ── NUEVO: Detectar grupo (pulsar/cuasar/sintonia) ──
    const groupName = detectGroupName(sub)
    console.log(`🏷️ Grupo detectado: ${groupName}`)

    let periodStart = sub.current_period_start
    let periodEnd = sub.current_period_end

    if (!periodStart && sub.items?.data?.[0]?.current_period_start) {
        periodStart = sub.items.data[0].current_period_start
        periodEnd = sub.items.data[0].current_period_end
        console.log("📍 Fechas tomadas del items.data[0]")
    }

    if (sub.trial_end && sub.trial_end > (periodEnd || 0)) {
        console.log(`📍 trial_end (${unixToISO(sub.trial_end)}) es posterior a period_end (${unixToISO(periodEnd)}), usando trial_end`)
        periodEnd = sub.trial_end
    }

    const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        email: email || null,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer,
        status: sub.status,
        current_period_start: unixToISO(periodStart),
        current_period_end: unixToISO(periodEnd),
        cancel_at_period_end: sub.cancel_at_period_end === true || !!sub.cancel_at,
        customer_name: customerName,
        group_name: groupName,  // ← NUEVO
    }, { onConflict: "stripe_subscription_id" })

    if (error) {
        console.error("❌ Error creando suscripción:", error)
    } else {
        console.log(`✅ Suscripción creada: ${sub.id} → user ${userId || "GUEST"} | email ${email || "sin email"} | name ${customerName || "sin nombre"} | group ${groupName} | status ${sub.status}`)
        console.log(`📅 Período: ${unixToISO(periodStart)} → ${unixToISO(periodEnd)}`)
    }

    if (email) {
        await supabase.from("payments_log").insert({
            user_id: userId,
            email,
            stripe_subscription_id: sub.id,
            payment_type: "subscription",
            description: groupName === 'sintonia' ? 'Sintonía Solar' : `Inmersión Solar — ${groupName === 'cuasar' ? 'Cuásar' : 'Púlsar'}`,
            amount_cents: sub.plan?.amount || 0,
            currency: "usd",
            status: "succeeded",
        })
    }
}

async function handleCheckoutCompleted(session: any) {
    const metadata = session.metadata || {}
    const email = (session.customer_email || session.customer_details?.email || "").toLowerCase().trim()

    /* ═══ NUEVO: payment_type=booking ═══
       Reserva nativa creada por la edge function `procesar-ignicion-pago`.
       Confirmamos la reserva en `reservas` y disparamos el webhook
       de Pipedream para que envíe el email de bienvenida (PaseExploracion.js
       para grupales, o un futuro workflow para 1:1). */
    if (metadata.payment_type === "booking") {
        try {
            const { data, error } = await supabase.rpc("confirm_booking_by_session", {
                p_stripe_session_id: session.id,
                p_stripe_payment_intent_id: session.payment_intent || null,
            })
            if (error) {
                console.error("❌ confirm_booking_by_session error:", error)
                return
            }
            const r = Array.isArray(data) ? data[0] : data
            if (!r) {
                console.warn("⚠️ confirm_booking_by_session no devolvió fila")
                return
            }
            console.log(`✅ Reserva confirmada: ${r.reserva_id} | ${r.email} | ${r.slot_type}`)

            /* v2 — Creación automática de sala Zoom para 1:1.
               - Type 2 (scheduled) con el start_time + duración del slot.
               - Timezone del tripulante (viaja por metadata del Checkout).
               - Si falla, caemos al ZOOM_FALLBACK_JOIN_URL (la sala recurrente
                 "Red Solar Viva 1-1" de Zak'Haar).
               - SIEMPRE actualizamos reservas.zoom_* para que la bitácora
                 tenga diagnóstico aunque haya sido fallback.
               - `zoomJoinUrl` queda disponible para pasarlo al payload de
                 Pipedream más abajo. Es NULL para grupales. */
            let zoomJoinUrl: string | null = null
            if (
                r.slot_type === "individual_30" ||
                r.slot_type === "individual_45" ||
                r.slot_type === "individual_60"
            ) {
                const tz =
                    (session.metadata && session.metadata.timezone) ||
                    "America/Cancun"
                const zoomResult = await createZoomMeetingSafe({
                    topic: `Transmisión 1:1 · ${durationMinutesForSlotType(r.slot_type)} min — ${r.name}`,
                    startTime: r.start_time,
                    durationMinutes: durationMinutesForSlotType(r.slot_type),
                    timezone: tz,
                })
                await persistZoomOnReserva(r.reserva_id, zoomResult)
                zoomJoinUrl = zoomResult.joinUrl || null
                console.log(
                    `[zoom] reserva ${r.reserva_id}: ${
                        zoomResult.usedFallback ? "FALLBACK" : "OK"
                    } → ${zoomJoinUrl || "(sin URL)"}`
                )
            }

            /* Mirror legacy a `exploration_passes` para que Ignicion.js
               siga disparando el cron del día de la sesión + Telemetría
               del Núcleo siga contando ingresos. Solo para slots grupales.
               v2 — INSERT plano (no upsert). Antes usaba onConflict:
               "email,event_date" pero esa unique constraint no existe en
               exploration_passes → el upsert fallaba silencioso y el row
               nunca se escribía → Telemetría no registraba el pago.
               Ahora: intentamos insert, si falla (duplicate) loggeamos
               pero no tiramos. Duplicate real solo ocurriría si Stripe
               re-dispara el webhook con el mismo session_id, pero el
               RPC confirm_booking_by_session ya es idempotente en ese
               caso — y aquí simplemente lo skipeamos. */
            if (r.slot_type === "grupal_pulsar" || r.slot_type === "grupal_cuasar") {
                const groupName = r.slot_type === "grupal_pulsar" ? "pulsar" : "cuasar"
                const eventDate = new Date(r.start_time).toISOString().split("T")[0]
                const mirrorRow = {
                    email: r.email,
                    name: r.name,
                    event_date: eventDate,
                    event_start_time: r.start_time,
                    group_name: groupName,
                    calendly_event_uri: null,
                }
                const { error: mirrorErr } = await supabase
                    .from("exploration_passes")
                    .insert(mirrorRow)
                if (mirrorErr) {
                    console.warn(
                        `⚠️ Mirror exploration_passes falló: ${mirrorErr.code} — ${mirrorErr.message}`
                    )
                } else {
                    console.log(
                        `📋 Mirror exploration_passes OK: ${r.email} → ${eventDate} (${groupName})`
                    )
                }
            }

            /* Disparar webhook de Pipedream (PaseExploracion.js) para enviar
               el email de bienvenida. Si la URL no está en env, skipeamos
               silently para no romper el webhook.
               v2 — pasamos el timezone del tripulante (leído desde metadata
               que plantamos al crear el Checkout). PaseExploracion.js lo
               usa para renderizar las horas en su zona local real en vez
               de decir falsamente "hora local" pero mandar Cancún. */
            const pipedreamUrl = Deno.env.get("PIPEDREAM_BOOKING_WEBHOOK_URL")
            if (pipedreamUrl) {
                try {
                    const isGroupal = r.slot_type.startsWith("grupal_")
                    const groupName = r.slot_type === "grupal_cuasar" ? "cuasar" : "pulsar"
                    const tz =
                        (session.metadata && session.metadata.timezone) ||
                        "America/Cancun"
                    const er = await fetch(pipedreamUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            source: isGroupal ? "manual" : "individual",
                            slot_type: r.slot_type,
                            name: r.name,
                            email: r.email,
                            event_date: new Date(r.start_time).toISOString().split("T")[0],
                            event_start_time: r.start_time,
                            event_end_time: r.end_time,
                            group_name: groupName,
                            timezone: tz,
                            amount_mxn_cents: r.amount_mxn_cents,
                            /* v2 — link único de Zoom para 1:1.
                               Null para grupales. */
                            zoom_join_url: zoomJoinUrl,
                        }),
                    })
                    console.log(`📧 Pipedream booking webhook → ${er.status} (tz=${tz})`)
                } catch (e) {
                    console.error("⚠️ Pipedream booking webhook fetch error:", e)
                }
            }
        } catch (e) {
            console.error("❌ booking confirmation throw:", e)
        }
        return
    }

    if (session.mode === "payment") {
        const bookId = metadata.book_id
        const formats = (metadata.formats || "pdf").split(",")
        if (!bookId || !email) return
 
        let userId: string | null = null
        const clerkUserId = metadata.clerk_user_id || null
        if (clerkUserId) {
            const profile = await getProfileByClerkId(clerkUserId)
            userId = profile?.id || null
        }
        if (!userId && email) {
            const profile = await getProfileByEmail(email)
            userId = profile?.id || null
        }
 
        await supabase.from("purchases").upsert({
            user_id: userId, email, book_id: bookId,
            stripe_payment_id: session.payment_intent,
            stripe_checkout_session_id: session.id,
            formats_purchased: formats,
            purchased_at: new Date().toISOString(),
            amount_cents: session.amount_total || 0,  // ← precio real pagado (después de descuentos)
        }, { onConflict: "email,book_id" })
 
        await supabase.from("payments_log").insert({
            user_id: userId, email,
            stripe_payment_intent_id: session.payment_intent,
            payment_type: "book",
            description: `Libro: ${metadata.book_title || bookId}`,
            amount_cents: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "succeeded",
        })
 
        console.log(`✅ Compra libro: ${email} → ${bookId}`)
    }
 
    if (session.mode === "subscription" && session.subscription) {
        console.log(`🔗 Checkout subscription: ${session.subscription} | email: ${email}`)
 
        let userId: string | null = null
        if (email) {
            const profile = await getProfileByEmail(email)
            userId = profile?.id || null
        }

        const customerName = session.customer_details?.name || null

        // ── NUEVO: Intentar detectar grupo desde la suscripción de Stripe ──
        let groupName: string | null = null
        try {
            const stripeSub = await stripe.subscriptions.retrieve(session.subscription)
            groupName = detectGroupName(stripeSub)
            console.log(`🏷️ Checkout → grupo detectado: ${groupName}`)
        } catch (e) {
            console.log("⚠️ No se pudo obtener sub para detectar grupo:", (e as any).message)
        }

        const updatePayload: any = {
            email: email || null,
            user_id: userId,
            customer_name: customerName,
            updated_at: new Date().toISOString(),
        }
        // Solo escribir group_name si lo detectamos (no sobreescribir con null)
        if (groupName) updatePayload.group_name = groupName
 
        const { error } = await supabase
            .from("subscriptions")
            .update(updatePayload)
            .eq("stripe_subscription_id", session.subscription)
 
        if (error) {
            console.error("❌ Error vinculando suscripción:", error)
        } else {
            console.log(`✅ Suscripción vinculada: ${session.subscription} → ${email} | name: ${customerName || "sin nombre"} | group: ${groupName || "sin cambio"} (user: ${userId || "pending"})`)
        }
 
        if (userId && session.customer) {
            await supabase.from("profiles")
                .update({ stripe_customer_id: session.customer })
                .eq("id", userId)
        }
 
        if (email) {
            await supabase.from("payments_log").insert({
                user_id: userId, email,
                stripe_subscription_id: session.subscription,
                payment_type: "subscription",
                description: groupName === 'sintonia' ? 'Sintonía Solar' : `Inmersión Solar — ${groupName === 'cuasar' ? 'Cuásar' : 'Púlsar'}`,
                amount_cents: session.amount_total || 0,
                currency: session.currency || "usd",
                status: "succeeded",
            })
        }
    }
}

async function handleSubscriptionUpdated(sub: any) {
    console.log(`🔍 [SUB UPDATE] Sub ID = ${sub.id}`)
    console.log(`🔍 [SUB UPDATE] Raw cancel_at_period_end = ${sub.cancel_at_period_end} (type: ${typeof sub.cancel_at_period_end})`)
    console.log(`🔍 [SUB UPDATE] Raw cancel_at = ${sub.cancel_at} (${sub.cancel_at ? unixToISO(sub.cancel_at) : "null"})`)
    console.log(`🔍 [SUB UPDATE] Raw canceled_at = ${sub.canceled_at}`)
    console.log(`🔍 [SUB UPDATE] Raw cancellation_details.reason = ${sub.cancellation_details?.reason || "none"}`)
    console.log(`🔍 [SUB UPDATE] Raw status = ${sub.status}`)

    const existing = await getExistingSubDates(sub.id)

    const cancelAtPeriodEnd =
        sub.cancel_at_period_end === true ||
        !!sub.cancel_at ||
        sub.cancellation_details?.reason === "cancellation_requested"

    console.log(`🔍 [SUB UPDATE] Computed cancelAtPeriodEnd = ${cancelAtPeriodEnd}`)

    // ── Detectar grupo si aún no está guardado ──
    const groupName = detectGroupName(sub)

    const updatePayload: any = {
        status: sub.status,
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
    }

    // Solo escribir group_name si detectamos algo (no sobreescribir un valor existente con default)
    // Verificamos si ya tiene grupo en la DB antes de sobreescribir
    const { data: currentSub } = await supabase
        .from("subscriptions")
        .select("group_name")
        .eq("stripe_subscription_id", sub.id)
        .single()
    
    if (!currentSub?.group_name && groupName) {
        updatePayload.group_name = groupName
        console.log(`🏷️ [SUB UPDATE] Asignando grupo: ${groupName}`)
    }

    let newPeriodEnd: string | null = null
    let newPeriodStart: string | null = null

    if (sub.current_period_start) {
        newPeriodStart = unixToISO(sub.current_period_start)
    }
    if (sub.current_period_end) {
        newPeriodEnd = unixToISO(sub.current_period_end)
    }

    if (sub.trial_end) {
        const trialEndISO = unixToISO(sub.trial_end)
        if (!newPeriodEnd || new Date(trialEndISO!) > new Date(newPeriodEnd)) {
            console.log(`📍 trial_end (${trialEndISO}) es posterior a period_end (${newPeriodEnd}), usando trial_end`)
            newPeriodEnd = trialEndISO
        }
    }

    if (newPeriodStart) {
        const safePeriodStart = latestDate(newPeriodStart, existing?.current_period_start || null)
        updatePayload.current_period_start = safePeriodStart
    }

    if (newPeriodEnd) {
        const safePeriodEnd = latestDate(newPeriodEnd, existing?.current_period_end || null)
        updatePayload.current_period_end = safePeriodEnd
        console.log(`📅 period_end: DB tenía ${existing?.current_period_end || "null"} → se guardará ${safePeriodEnd}`)
    }

    console.log(`📝 [SUB UPDATE] Payload final:`, JSON.stringify(updatePayload))

    const { error } = await supabase.from("subscriptions").update(updatePayload)
        .eq("stripe_subscription_id", sub.id)

    if (error) {
        console.error("❌ Error actualizando suscripción:", error)
    } else {
        console.log(`✅ Suscripción actualizada: ${sub.id} | status: ${sub.status} | cancel_at_period_end: ${cancelAtPeriodEnd}`)
    }
}

async function handleSubscriptionDeleted(sub: any) {
    await supabase.from("subscriptions").update({ status: "canceled", cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id)
    console.log(`✅ Suscripción cancelada definitivamente: ${sub.id}`)
}

/* ====================== handleInvoicePaid ====================== */
async function handleInvoicePaid(invoice: any) {
    console.log("🔍 === INICIO handleInvoicePaid ===")
    console.log("Invoice ID:", invoice.id)
    console.log("Hosted Invoice URL:", invoice.hosted_invoice_url || "NO ENVIADA")

    let subscriptionId = invoice.subscription

    if (!subscriptionId && invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription) {
        subscriptionId = invoice.lines.data[0].parent.subscription_item_details.subscription
        console.log("✅ Subscription ID encontrado en .parent.subscription_item_details.subscription")
    }
    if (!subscriptionId && invoice.lines?.data?.[0]?.subscription) {
        subscriptionId = invoice.lines.data[0].subscription
        console.log("✅ Subscription ID encontrado en .subscription")
    }

    console.log("Subscription ID final usado:", subscriptionId)

    if (!subscriptionId) {
        console.log("❌ No se pudo encontrar subscription ID → saliendo")
        return
    }

    const { data: dbSub } = await supabase
        .from("subscriptions")
        .select("id, user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single()

    if (!dbSub) {
        console.log("⚠️ Suscripción no encontrada en DB")
        return
    }

    if (invoice.hosted_invoice_url) {
        const { error } = await supabase
            .from("payments_log")
            .update({
                stripe_hosted_invoice_url: invoice.hosted_invoice_url,
                updated_at: new Date().toISOString()
            })
            .eq("stripe_invoice_id", invoice.id)

        if (error) {
            console.error("❌ Error guardando hosted_invoice_url:", error)
        } else {
            console.log(`✅ hosted_invoice_url guardada correctamente`)
        }
    }

    const lines = invoice.lines?.data || []
    const line = lines[0]

    if (line?.period) {
        console.log("Período del invoice:", {
            start: unixToISO(line.period.start),
            end: unixToISO(line.period.end),
        })

        const { error } = await supabase
            .from("subscription_periods")
            .insert({
                user_id: dbSub.user_id,
                subscription_id: dbSub.id,
                stripe_invoice_id: invoice.id,
                period_start: unixToISO(line.period.start),
                period_end: unixToISO(line.period.end),
            })

        if (error) {
            console.error("❌ Error insertando período:", error)
        } else {
            console.log("🎉 Período insertado correctamente en subscription_periods")
        }
    }

    console.log("🔍 === FIN handleInvoicePaid ===")
}

/* ====================== SERVIDOR ====================== */
serve(async (req: Request) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature || !(await verifyStripeSignature(body, signature, stripeWebhookSecret))) {
        return new Response("Invalid signature", { status: 401 })
    }

    let event: any
    try { event = JSON.parse(body) } catch { return new Response("Invalid JSON", { status: 400 }) }

    const eventType = event.type
    const data = event.data?.object

    console.log(`📡 Webhook recibido: ${eventType}`)

    try {
        switch (eventType) {
            case "checkout.session.completed": await handleCheckoutCompleted(data); break
            case "customer.subscription.created": await handleSubscriptionCreated(data); break
            case "customer.subscription.updated": await handleSubscriptionUpdated(data); break
            case "customer.subscription.deleted": await handleSubscriptionDeleted(data); break
            case "invoice.payment_succeeded": await handleInvoicePaid(data); break
        }
    } catch (err) {
        console.error(`❌ Error procesando ${eventType}:`, err)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
})