// Red Solar Viva · revenuecat-webhook v1.6 — no pisa rc_user_* con $RCAnonymousID. v1.5 leftover — TRANSFER re-liga stripe_customer_id al clerk destino (SIWA / $RCAnonymousID). v1.4 leftover: CICLO SEMANAL SIN CRISTALES — CICLO SEMANAL SIN CRISTALES (decisión 2026-08-02): el ciclo semanal de Sintonía (sintonia_solar_weekly) da el Escáner completo pero YA NO emite los 2 Cristales de Extracción — esos viven SOLO en el ciclo mensual. Cierra el arbitraje (1 semana = 2 Cristales = 621+ MXN de valor y cancelas). El fix es el gate: emitCristales corre solo si NO es el semanal (helper esCicloSemanal por substring, robusto). Cero migración SQL (la RPC emit_cristales_for_subscription no cambia; solo deja de llamarse para el semanal). Inmersión (cuasar) y Sintonía mensual siguen emitiendo igual.
// Red Solar Viva · revenuecat-webhook v1.3 — AUDITORÍA 2026-07-24 · PARTE 2: las compras SANDBOX (TestFlight / license testers de Play) ya NO conceden membresía ni Cristales. Llegaban a este mismo endpoint con el mismo Authorization y eran indistinguibles de una compra real: escribían status=active con la membresía completa y emitían los 2 Cristales del mes. Interruptor para QA propio: secrets set REVENUECAT_ALLOW_SANDBOX=true + redeploy (y unset al terminar). El evento TEST del dashboard sigue pasando siempre. + PRODUCT_GROUP_MAP suma sintonia_solar_weekly (faltaba: solo funcionaba por el default legacy).
// ════════════════════════════════════════════════════════════════════
// Red Solar Viva — revenuecat-webhook (v1.1 — 2026-06-12)
// v1.1 · Auditoría: fix de escalada por subpago. detectGroupName ya NO
//        defaultea TODO a 'sintonia' (un comprador del tier 199/399 recibía
//        group_name='sintonia' = acceso completo). Mapeo explícito por
//        producto + salvaguarda por substring (decoder/dual nunca → sintonia)
//        + Cristales solo para membresía completa (sintonia/cuasar).
//
// Sincroniza las suscripciones de iOS (Sintonía Solar comprada vía
// StoreKit / App Store) con la tabla `subscriptions` de Supabase, para
// que el ecosistema entero (gating freemium, Telemetría del Núcleo,
// Motor de Intervención, Cristales de Extracción, Pulsos de Pipedream)
// trate a un Tripulante que pagó por iPhone exactamente igual que uno
// que pagó por Stripe web.
//
// RevenueCat dispara este webhook ante cada cambio de estado de la
// suscripción. El `app_user_id` que llega ES el clerk_user_id, porque
// el cliente (escaner-app) llama `Purchases.logIn(clerkUserId)` al
// inicializar el SDK. Así podemos resolver el perfil del Tripulante.
//
// VERIFICACIÓN: a diferencia de Stripe (HMAC firmado), RevenueCat usa
// un Authorization header simple (shared secret). Lo configuras en
// RevenueCat Dashboard → Integrations → Webhooks → "Authorization header
// value" y lo guardas como secret `REVENUECAT_WEBHOOK_AUTH` en Supabase.
// El edge function compara el header `Authorization` con ese secret
// (comparación timing-safe).
//
// MAPEO DE EVENTOS → status de subscriptions:
//   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE
//     → status='active', cancel_at_period_end=false
//   CANCELLATION (apagó auto-renew, conserva acceso hasta expirar)
//     → status='active', cancel_at_period_end=true
//   EXPIRATION (perdió acceso)
//     → status='canceled', cancel_at_period_end=false
//   BILLING_ISSUE (fallo de cobro — grace period 16 días activo)
//     → status='active' (mantenemos acceso durante el grace period)
//   TRANSFER → mueve la suscripción al nuevo app_user_id
//   TEST → responde 200 sin escribir nada
//
// IDENTIFICADOR ÚNICO: como la tabla `subscriptions` usa
// `stripe_subscription_id` como onConflict, reutilizamos esa columna con
// un valor sintético `rc_<original_transaction_id>` (estable a través de
// renovaciones). El prefijo `rc_` lo distingue de los IDs reales de
// Stripe y de los `gift_*` (que el cálculo de revenue admin filtra).
//
// CRISTALES: en INITIAL_PURCHASE y RENEWAL llamamos la misma RPC
// `emit_cristales_for_subscription` que usa el stripe-webhook, para que
// los Tripulantes iOS reciban sus 2 Cristales de Extracción mensuales.
//
// Secret requerido nuevo: REVENUECAT_WEBHOOK_AUTH.
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const revenuecatWebhookAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* Mapeo explícito Product ID iOS → group_name de `subscriptions`.
   Sintonía/Inmersión = membresía COMPLETA (reciben Cristales).
   decoder/dream = sub-tiers (199/399) que abren SOLO el Decodificador,
   NO la app completa → NUNCA deben quedar como 'sintonia'. */
const PRODUCT_GROUP_MAP: Record<string, string> = {
    sintonia_solar_monthly: "sintonia",
    // AUDITORÍA 2026-07-24 · Parte 2: el plan SEMANAL faltaba en el mapa y
    // solo funcionaba por el default legacy a 'sintonia'. Ahora es explícito
    // (mismo entitlement `sintonia_active`, otra duración).
    sintonia_solar_weekly: "sintonia",
    inmersion_solar_monthly: "cuasar",   // si algún día es IAP (hoy es web/Stripe)
    decoder_materia_monthly: "decoder",  // tier 199 — solo Decodificador de Materia
    decoder_dual_monthly: "dream",        // tier 399 — Materia + Sueños
}

/* El Códice de Luz (`codice_luz`, 399) NO va en el mapa de arriba a propósito:
   es un CONSUMIBLE, no una suscripción, y lo maneja su rama dedicada más abajo
   (CODICE_PRODUCT_ID → concede 1 Cristal, sin tocar `subscriptions`). Se anota
   aquí para que su ausencia se lea como intencional y no como un olvido. */

function detectGroupName(productId: string | null | undefined): string {
    if (productId && PRODUCT_GROUP_MAP[productId]) {
        return PRODUCT_GROUP_MAP[productId]
    }
    // Salvaguarda por substring: aunque el Product ID cambie de formato, un
    // sub-tier NUNCA puede colarse como Sintonía completa (era la escalada
    // por subpago: pagar 199/399 y recibir el acceso de 599).
    const p = (productId || "").toLowerCase()
    if (p.includes("dual") || p.includes("dream") || p.includes("sueno")) return "dream"
    if (p.includes("decoder") || p.includes("materia")) return "decoder"
    if (p.includes("inmersion")) return "cuasar"
    // Default legacy = 'sintonia' (único IAP de membresía completa vivo hoy).
    // ⚠️ TODO: confirmar el Product ID real de Sintonía en los logs de
    // RevenueCat y agregarlo arriba; entonces este default puede pasar a
    // 'unknown' (fail-closed total) sin riesgo de degradar al sub vivo.
    console.warn(`⚠️ Product ID sin mapear: "${productId}" → default 'sintonia' (revisar)`)
    return "sintonia"
}

/* ¿Es el CICLO SEMANAL de Sintonía? Decisión 2026-08-02: el semanal da el
   Escáner completo pero NO emite Cristales de Extracción — esos viven SOLO en
   el ciclo mensual (cierra el arbitraje de 1 semana = 2 Cristales). Robusto por
   substring por si el Product ID cambia de formato; los sub-tiers decoder/dream
   ya quedan fuera por groupName, así que esto solo filtra dentro de sintonia. */
function esCicloSemanal(productId: string | null | undefined): boolean {
    const p = (productId || "").toLowerCase()
    return (
        p === "sintonia_solar_weekly" ||
        p.includes("weekly") ||
        p.includes("semanal")
    )
}

/* ====================== HELPERS ====================== */

/* Comparación timing-safe del Authorization header. Si el secret no
   está configurado, rechazamos todo (fail-closed). */
function authHeaderValid(received: string | null): boolean {
    if (!revenuecatWebhookAuth) {
        console.error(
            "❌ REVENUECAT_WEBHOOK_AUTH no configurado — rechazando todo"
        )
        return false
    }
    if (!received) return false
    // RevenueCat manda el valor tal cual lo configures. Aceptamos tanto
    // el valor crudo como con prefijo "Bearer " por si lo configuraste así.
    const candidate = received.startsWith("Bearer ")
        ? received.slice(7)
        : received
    const a = candidate
    const b = revenuecatWebhookAuth
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
}

function msToISO(ms: number | null | undefined): string | null {
    if (!ms || typeof ms !== "number") return null
    return new Date(ms).toISOString()
}

async function getProfileByClerkId(clerkUserId: string) {
    const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, clerk_user_id")
        .eq("clerk_user_id", clerkUserId)
        .single()
    return data
}

/* Deriva (status, cancelAtPeriodEnd) del tipo de evento RevenueCat. */
function mapEventToStatus(
    eventType: string
): { status: string; cancelAtPeriodEnd: boolean; write: boolean } {
    switch (eventType) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "UNCANCELLATION":
        case "PRODUCT_CHANGE":
        case "SUBSCRIPTION_EXTENDED":
        case "NON_RENEWING_PURCHASE":
            return { status: "active", cancelAtPeriodEnd: false, write: true }
        case "CANCELLATION":
            // Apagó auto-renew pero conserva acceso hasta expirar.
            return { status: "active", cancelAtPeriodEnd: true, write: true }
        case "BILLING_ISSUE":
            // Grace period 16 días activo → mantenemos acceso.
            return { status: "active", cancelAtPeriodEnd: false, write: true }
        case "EXPIRATION":
            return { status: "canceled", cancelAtPeriodEnd: false, write: true }
        case "SUBSCRIPTION_PAUSED":
            // Feature de Android; en iOS no aplica. Tratamos como canceled.
            return { status: "canceled", cancelAtPeriodEnd: false, write: true }
        default:
            // TEST, SUBSCRIBER_ALIAS, TRANSFER (manejado aparte), etc.
            return { status: "", cancelAtPeriodEnd: false, write: false }
    }
}

/* Emite los 2 Cristales de Extracción mensuales (1 códice + 1 meditación)
   para el mes lunar correspondiente. Idempotente por la RPC. */
async function emitCristales(
    clerkUserId: string,
    purchasedAtMs: number | null | undefined
) {
    try {
        const baseMs = purchasedAtMs || Date.now()
        const dt = new Date(baseMs)
        const mesLunar = `${dt.getUTCFullYear()}-${String(
            dt.getUTCMonth() + 1
        ).padStart(2, "0")}`
        const { data, error } = await supabase.rpc(
            "emit_cristales_for_subscription",
            {
                p_clerk_user_id: clerkUserId,
                p_origen: "sintonia",
                p_mes_lunar: mesLunar,
            }
        )
        if (error) {
            console.error("❌ [cristales] emit error:", error)
        } else {
            console.log(
                `💎 [cristales] emit sintonia ${mesLunar} → user ${clerkUserId}: ${JSON.stringify(
                    data
                )}`
            )
        }
    } catch (e) {
        console.error("❌ [cristales] excepción:", (e as Error).message)
    }
}

/* ====================== HANDLERS ====================== */

/* v1.2 — Consumible "Códice de Luz" (codice_luz): no es una suscripción.
   Cada compra concede 1 Cristal de Códice server-side, idempotente por
   transacción (RPC grant_codice_cristal_from_purchase). */
const CODICE_PRODUCT_ID = "codice_luz"

async function handleCodicePurchase(event: any) {
    if (
        event.type !== "NON_RENEWING_PURCHASE" &&
        event.type !== "INITIAL_PURCHASE"
    ) {
        console.log(`ℹ️ [codice] evento ${event.type} no concede — skip`)
        return
    }
    const clerkUserId: string =
        event.app_user_id || event.original_app_user_id || ""
    const txId: string =
        event.transaction_id || event.original_transaction_id || event.id || ""
    if (!clerkUserId || !txId) {
        console.warn(
            `⚠️ [codice] evento sin app_user_id o transaction_id — skip (user="${clerkUserId}" tx="${txId}")`
        )
        return
    }
    const { data, error } = await supabase.rpc(
        "grant_codice_cristal_from_purchase",
        { p_clerk_user_id: clerkUserId, p_transaction_id: txId }
    )
    if (error) {
        console.error("❌ [codice] grant error:", error)
    } else {
        console.log(
            `💎 [codice] grant → user ${clerkUserId} tx ${txId}: ${JSON.stringify(
                data
            )}`
        )
    }
}


function isClerkId(id: string | null | undefined): boolean {
    return typeof id === "string" && id.startsWith("user_")
}

function isAnonymousRcId(id: string | null | undefined): boolean {
    return typeof id === "string" && id.includes("$RCAnonymousID")
}

/* Prefiere Clerk. Nunca elijas anónimo si hay un user_ en el evento. */
function pickClerkUserId(event: any): string {
    const candidates: string[] = []
    const push = (v: any) => {
        if (typeof v === "string" && v.length > 0) candidates.push(v)
    }
    push(event.app_user_id)
    push(event.original_app_user_id)
    for (const a of event.aliases || []) push(a)
    for (const a of event.transferred_to || []) push(a)
    const clerk = candidates.find(isClerkId)
    if (clerk) return clerk
    return candidates[0] || ""
}

async function handleSubscriptionEvent(event: any) {
    const eventType = event.type as string

    // Consumible Códice de Luz → concede Cristal de Códice y NO escribe en
    // subscriptions (no es una membresía).
    if ((event.product_id || null) === CODICE_PRODUCT_ID) {
        await handleCodicePurchase(event)
        return
    }

    const { status, cancelAtPeriodEnd, write } = mapEventToStatus(eventType)

    if (!write) {
        console.log(`ℹ️ Evento ${eventType} no requiere escritura — skip`)
        return
    }

    let clerkUserId: string = pickClerkUserId(event)
    const productId: string | null = event.product_id || null
    const groupName = detectGroupName(productId)

    // ID sintético estable a través de renovaciones.
    const originalTxId =
        event.original_transaction_id ||
        event.transaction_id ||
        `${clerkUserId}_${productId}`
    const syntheticSubId = `rc_${originalTxId}`

    // Resolver el perfil del Tripulante por clerk_user_id.
    let userId: string | null = null
    let email: string | null = null
    let customerName: string | null = null
    if (clerkUserId && isClerkId(clerkUserId)) {
        const profile = await getProfileByClerkId(clerkUserId)
        if (profile) {
            userId = profile.id
            email = (profile.email || "").toLowerCase().trim() || null
            customerName = profile.full_name || null
        } else {
            console.log(
                `⚠️ Sin perfil para app_user_id="${clerkUserId}" — escribo igual con user_id null`
            )
        }
    } else if (clerkUserId) {
        console.log(
            `⚠️ app_user_id anónimo "${clerkUserId}" — no piso un rc_user_ existente`
        )
    } else {
        console.log("⚠️ Evento sin app_user_id — no puedo resolver perfil")
    }

    const periodStart = msToISO(event.purchased_at_ms)
    const periodEnd = msToISO(event.expiration_at_ms)

    const { data: existingRows } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, user_id, email, customer_name")
        .eq("stripe_subscription_id", syntheticSubId)
        .limit(1)
    const existing = Array.isArray(existingRows) ? existingRows[0] : null
    const existingCustomer = existing?.stripe_customer_id || ""
    const keepClerkCustomer =
        typeof existingCustomer === "string" &&
        existingCustomer.startsWith("rc_user_") &&
        isAnonymousRcId(clerkUserId)

    let stripeCustomerId = `rc_${clerkUserId}`
    if (keepClerkCustomer) {
        stripeCustomerId = existingCustomer
        userId = userId || existing.user_id || null
        email = email || existing.email || null
        customerName = customerName || existing.customer_name || null
        console.log(
            `🔒 Conservo ${existingCustomer}: evento anónimo no pisa Clerk`
        )
    }

    const { error } = await supabase.from("subscriptions").upsert(
        {
            user_id: userId,
            email: email,
            stripe_subscription_id: syntheticSubId,
            stripe_customer_id: stripeCustomerId,
            status: status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            customer_name: customerName,
            group_name: groupName,
        },
        { onConflict: "stripe_subscription_id" }
    )

    if (error) {
        console.error(`❌ Error upsert subscription (${eventType}):`, error)
        return
    }
    console.log(
        `✅ ${eventType} → user ${userId || "SIN PERFIL"} | ${email ||
            "sin email"} | group ${groupName} | status ${status} | cancel_at_period_end ${cancelAtPeriodEnd} | exp ${periodEnd}`
    )

    // Cristales solo en eventos que representan un cobro real Y solo para
    // membresía COMPLETA (Sintonía mensual / Inmersión). Los sub-tiers
    // decoder/dream (199/399) NO los incluyen — son beneficio de Sintonía —,
    // y el CICLO SEMANAL de Sintonía TAMPOCO: los Cristales viven solo en el
    // ciclo mensual (decisión 2026-08-02, cierra el arbitraje de 1 semana =
    // 2 Cristales). El semanal da el Escáner completo, sin Cristales/Holoteca.
    if (
        (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL") &&
        clerkUserId &&
        (groupName === "sintonia" || groupName === "cuasar") &&
        !esCicloSemanal(productId)
    ) {
        await emitCristales(clerkUserId, event.purchased_at_ms)
    } else if (
        (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL") &&
        esCicloSemanal(productId)
    ) {
        console.log(
            `🔒 [cristales] ciclo SEMANAL (${productId}) → SIN Cristales (viven solo en el mensual) · user ${clerkUserId}`
        )
    }
}

/* TRANSFER: RevenueCat mueve compras de un app_user_id a otro (ej. el
   Tripulante reinstaló y entró con otra cuenta). Marcamos la suscripción
   vieja como cancelada y dejamos que el siguiente evento de RENEWAL/
   INITIAL_PURCHASE recree la del nuevo usuario. Defensivo: solo logueamos
   si no hay datos suficientes. */
async function handleTransfer(event: any) {
    const fromIds: string[] = event.transferred_from || []
    const toIds: string[] = event.transferred_to || []
    console.log(
        `🔁 TRANSFER de [${fromIds.join(",")}] → [${toIds.join(",")}]`
    )
    const newClerkId = toIds.find(
        (id) => typeof id === "string" && id.startsWith("user_")
    )
    if (!newClerkId || fromIds.length === 0) {
        console.log("🔁 TRANSFER sin clerk destino o sin origen — solo log")
        return
    }
    const profile = await getProfileByClerkId(newClerkId)
    const userId = profile?.id ?? null
    const email = (profile?.email || "").toLowerCase().trim() || null
    const customerName = profile?.full_name || null
    for (const fromId of fromIds) {
        const { data, error } = await supabase
            .from("subscriptions")
            .update({
                stripe_customer_id: `rc_${newClerkId}`,
                user_id: userId,
                email,
                customer_name: customerName,
            })
            .eq("stripe_customer_id", `rc_${fromId}`)
            .select("stripe_subscription_id")
        if (error) {
            console.error(`❌ TRANSFER update rc_${fromId}:`, error)
            continue
        }
        const n = Array.isArray(data) ? data.length : 0
        console.log(
            `🔁 TRANSFER re-liga ${n} fila(s) rc_${fromId} → rc_${newClerkId} | user ${userId || "SIN PERFIL"}`
        )
    }
}

/* ====================== SERVIDOR ====================== */
serve(async (req: Request) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 })
    }

    // Verificación del Authorization header (shared secret).
    const authHeader = req.headers.get("Authorization")
    if (!authHeaderValid(authHeader)) {
        console.error("❌ Authorization inválido — rechazado")
        return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.text()
    let payload: any
    try {
        payload = JSON.parse(body)
    } catch {
        return new Response("Invalid JSON", { status: 400 })
    }

    const event = payload.event
    if (!event || !event.type) {
        console.log("⚠️ Payload sin event.type — ignorado")
        return new Response("OK", { status: 200 })
    }

    const eventType = event.type as string
    console.log(
        `📡 RevenueCat webhook: ${eventType} | store ${event.store ||
            "?"} | env ${event.environment || "?"} | product ${event.product_id ||
            "?"}`
    )

    /* AUDITORÍA PARTE 3 · anti-duplicados. La autenticación de RevenueCat es un
       secreto fijo sin marca de tiempo, así que un request capturado se puede
       reproducir siempre. Las escrituras de aquí ya son idempotentes una por
       una (los Cristales por mes lunar, el ledger del Códice por transacción),
       pero el dedupe por evento lo cierra de raíz y a nivel de puerta.
       Fail-open: si la RPC no responde, se procesa como antes. */
    try {
        const { data: primeraVez } = await supabase.rpc("webhook_event_seen", {
            p_source: "revenuecat",
            p_event_id: String(event.id ?? ""),
        })
        if (primeraVez === false) {
            console.log(`↩️ Reintento de ${event.id} (${eventType}): ya procesado`)
            return new Response(JSON.stringify({ received: true, duplicate: true }), {
                status: 200,
            })
        }
    } catch (e) {
        console.warn("[revenuecat-webhook] dedupe no disponible, se procesa:", e)
    }

    /* ── AUDITORÍA 2026-07-24 · PARTE 2 · compras de PRUEBA ──────────────
       RevenueCat manda a ESTE mismo endpoint, con el mismo Authorization,
       los eventos de compras SANDBOX (StoreKit de TestFlight/desarrollo y,
       en Android, license testers + pistas de prueba de Play). Una compra
       sandbox no cuesta nada y produce un INITIAL_PURCHASE idéntico al real:
       sin este corte escribía `status='active'` con la membresía completa y
       emitía los 2 Cristales del mes (un Códice de 399 + una Meditación de
       222, canjeables al instante). Cualquiera con acceso a un build de
       TestFlight obtenía Sintonía gratis.

       Decisión de Zak (2026-07-24): se BLOQUEAN por defecto, con interruptor
       para el QA propio. Para probar el flujo completo de activación:
         supabase secrets set REVENUECAT_ALLOW_SANDBOX=true
         supabase functions deploy revenuecat-webhook --no-verify-jwt
       y al terminar la prueba:
         supabase secrets unset REVENUECAT_ALLOW_SANDBOX
         supabase functions deploy revenuecat-webhook --no-verify-jwt
       (No toca la app: es puro servidor.)

       El evento TEST del dashboard de RevenueCat sigue pasando siempre —
       sirve para confirmar que el webhook está conectado y no concede nada. */
    const isSandbox =
        String(event.environment || "").toUpperCase() === "SANDBOX"
    const allowSandbox =
        (Deno.env.get("REVENUECAT_ALLOW_SANDBOX") || "").toLowerCase() === "true"
    if (isSandbox && !allowSandbox && eventType !== "TEST") {
        console.log(
            `🧪 Evento SANDBOX (${eventType} · ${event.product_id || "?"}) IGNORADO: ` +
                `no concede membresía ni Cristales. Para permitirlo durante una ` +
                `prueba: secrets set REVENUECAT_ALLOW_SANDBOX=true + redeploy.`
        )
        return new Response("OK (sandbox ignorado)", { status: 200 })
    }
    if (isSandbox && allowSandbox) {
        console.log(
            "⚠️ SANDBOX PERMITIDO por REVENUECAT_ALLOW_SANDBOX=true — " +
                "recordá apagarlo al terminar la prueba."
        )
    }

    try {
        if (eventType === "TEST") {
            console.log("✅ TEST event recibido — webhook conectado OK")
        } else if (eventType === "TRANSFER") {
            await handleTransfer(event)
        } else {
            await handleSubscriptionEvent(event)
        }
    } catch (err) {
        console.error(`❌ Error procesando ${eventType}:`, err)
        // Respondemos 200 igual para que RevenueCat no reintente en loop
        // ante un error nuestro no recuperable. Los errores quedan en logs.
    }

    return new Response("OK", { status: 200 })
})
