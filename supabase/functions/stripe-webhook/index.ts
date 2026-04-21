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
    // 'prod_XXXXXXXXX': 'pulsar',         // ← Agrega aquí tu Product ID de Púlsar cuando lo tengas
    // 'prod_YYYYYYYYY': 'sintonia',        // ← Futuro: Sintonía Solar
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