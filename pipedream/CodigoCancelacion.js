import Stripe from "stripe";

export default defineComponent({
  async run({ steps, $ }) {
    
    // Conectamos con Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', 
    });

    // =========================================================
    // VERIFICACIÓN DE FIRMA DE STRIPE (Auditoría 2026-06-12)
    // ---------------------------------------------------------
    // Antes este workflow confiaba en el body crudo sin verificar firma:
    // un POST falso de customer.subscription.deleted con el customer_id de
    // una víctima le DESACTIVABA su cupón. Mismo hueco que Compras.js ya
    // cerró; acá se replica el patrón.
    //
    // ⚠️ PREREQUISITO: el trigger HTTP de ESTE workflow debe estar en modo
    // "Raw Request" (Pipedream → trigger → Configure → Raw Request: ON), así
    // steps.trigger.event.body es el STRING crudo que Stripe firmó.
    // ⚠️ SECRETO PROPIO: STRIPE_WEBHOOK_SECRET_CANCELACION = el whsec_ del
    // endpoint de Stripe "Cancelación de Códigos" (≠ el de Compras.js ni el
    // de Supabase). Los env vars de Pipedream son compartidos por workspace,
    // por eso este usa un nombre distinto.
    // ⚠️ En Raw Request, steps.trigger.event.headers es un ARRAY APLANADO
    // [clave, valor, ...]; la firma se busca recorriendo el array.
    // =========================================================
    const rawHeaders = steps.trigger.event.headers;
    let sig;
    if (Array.isArray(rawHeaders)) {
      const idx = rawHeaders.findIndex(
        (item) => typeof item === "string" && item.toLowerCase() === "stripe-signature"
      );
      if (idx >= 0) sig = rawHeaders[idx + 1];
    } else if (rawHeaders && typeof rawHeaders === "object") {
      sig = rawHeaders["stripe-signature"] || rawHeaders["Stripe-Signature"];
    }
    if (!sig) throw new Error("❌ No hay firma de Stripe. POST rechazado (fail-closed).");

    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_CANCELACION;
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("❌ STRIPE_WEBHOOK_SECRET_CANCELACION no configurada en Pipedream. Cancelando (fail-closed).");
    }

    const rawBody = typeof steps.trigger.event === "string"
      ? steps.trigger.event
      : steps.trigger.event.body;
    if (typeof rawBody !== "string") {
      throw new Error("❌ El body no llegó como string crudo. Activá 'Raw Request' en el trigger HTTP del workflow.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new Error(`❌ Firma de Stripe inválida — POST rechazado: ${err.message}`);
    }

    // Confirmamos que sea cancelación (la desactivación de un cupón ya
    // apagado es un no-op terminal → el reproceso de un evento es idempotente).
    if (event.type !== "customer.subscription.deleted") {
      return { status: "Evento ignorado", type: event.type };
    }

    const subscription = event.data.object;
    const customerId = subscription.customer;

    if (!customerId) return { status: "No hay customer ID en la suscripción." };

    // ---------------------------------------------------------
    // 1. OBTENER EL EMAIL DEL CLIENTE QUE CANCELÓ
    // ---------------------------------------------------------
    let customerEmail;
    try {
      const customerInfo = await stripe.customers.retrieve(customerId);
      customerEmail = customerInfo.email;
    } catch (err) {
      throw new Error(`❌ Error buscando al cliente en Stripe: ${err.message}`);
    }

    console.log(`🔎 La membresía de ${customerEmail} ha terminado. Buscando su código...`);

    // ---------------------------------------------------------
    // 2. BUSCAR TODOS LOS CÓDIGOS ACTIVOS EN TU STRIPE
    // ---------------------------------------------------------
    let promoCodes;
    try {
      promoCodes = await stripe.promotionCodes.list({ active: true, limit: 100 });
    } catch (err) {
      throw new Error(`❌ Error al obtener los códigos: ${err.message}`);
    }

    // ---------------------------------------------------------
    // 3. ENCONTRAR EL CÓDIGO EXACTO DE ESTA PERSONA Y APAGARLO
    // ---------------------------------------------------------
    // Buscamos el código que tenga guardado su email en la "metadata"
   const userPromoCode = promoCodes.data.find(
  (code) =>
    code.metadata &&
    (
      code.metadata.customer_email === customerEmail ||
      code.metadata.customer_id === customerId
    )
);

    if (!userPromoCode) {
      return { status: `⚠️ No se encontró un código activo para ${customerEmail}. Tal vez ya estaba apagado.` };
    }

    console.log(`🎯 ¡Código encontrado!: ${userPromoCode.code}. Procediendo a apagarlo...`);

    // Apagamos el código cambiando active a false
    try {
      await stripe.promotionCodes.update(userPromoCode.id, {
        active: false
      });
      console.log(`✅ Código ${userPromoCode.code} desactivado correctamente.`);
      return { 
        status: `Éxito`, 
        mensaje: `Se canceló la suscripción de ${customerEmail} y se desactivó su cupón ${userPromoCode.code}` 
      };
    } catch (err) {
      throw new Error(`❌ Error al desactivar el código: ${err.message}`);
    }
  }
});