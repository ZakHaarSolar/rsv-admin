import Stripe from "stripe";

export default defineComponent({
  async run({ steps, $ }) {
    
    // Conectamos con Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', 
    });

    // Como usamos el Trigger nativo de Stripe en Pipedream, 
    // el evento ya viene validado y listo en steps.trigger.event
    const event = typeof steps.trigger.event.body === "string"
  ? JSON.parse(steps.trigger.event.body)
  : steps.trigger.event.body;

    // Solo por seguridad extra, confirmamos que sea cancelación
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