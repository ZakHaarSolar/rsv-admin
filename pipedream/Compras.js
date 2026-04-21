import Stripe from "stripe";
import nodemailer from "nodemailer";

export default defineComponent({
  async run({ steps, $ }) {
    
    // =========================================================
    // CONFIGURACIÓN GLOBAL
    // =========================================================
    const logoUrl = "https://drive.google.com/uc?export=view&id=1t4glJMPN7JmkDKl9v0hDmhH1gavbMycD";
    const spaceBgUrl = "https://www.transparenttextures.com/patterns/stardust.png";

    // Supabase config (para guardar el promo_code en la tabla subscriptions)
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://cobtsltrcsruzcusyqhi.supabase.co";
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // =========================================================
    // PRODUCT IDs DE MEMBRESÍA (Inmersión Solar)
    // =========================================================
    const MEMBERSHIP_PRODUCTS = {
      'prod_U609Xkla1g8ZL7': { group: 'pulsar', label: 'Púlsar', hora: '12:30 PM' },
      'prod_UJPj3SUcvleCdS': { group: 'cuasar', label: 'Cuásar', hora: '4:30 PM' },
    };

    // =========================================================
    // WRAPPER DE EMAIL (formato Calendly-style)
    // =========================================================
    const wrapEmail = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <u></u>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Red Solar Viva</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #050505; }
    </style>
</head>
<body bgcolor="#050505" style="margin: 0; padding: 0; background-color: #050505;">
    <div style="background-color: #050505; width: 100%;">
    <table width="100%" bgcolor="#050505" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #050505;">
        <tr>
            <td bgcolor="#050505" align="center" style="background-color: #050505; background-image: url('${spaceBgUrl}'); background-repeat: repeat; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #E0E0E0;">

                <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; width: 100%;">
                    <tbody>

                        <!-- HEADER -->
                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
                                <p style="margin: 0 0 14px 0; font-size: 11px; letter-spacing: 6px; color: #94A3B8; text-transform: uppercase;">RED SOLAR VIVA</p>
                                <img src="${logoUrl}" alt="Red Solar Viva" style="width: 100px; max-width: 100%; height: auto;">
                            </td>
                        </tr>

                        <!-- LÍNEA SEPARADORA -->
                        <tr>
                            <td align="center" style="padding: 0 0 25px 0;">
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div>
                            </td>
                        </tr>

                        <!-- CONTENIDO DINÁMICO -->
                        <tr>
                            <td style="padding: 0 10px;" align="left">
                                ${content}
                            </td>
                        </tr>

                        <!-- LÍNEA SEPARADORA INFERIOR -->
                        <tr>
                            <td align="center" style="padding: 25px 0 20px 0;">
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div>
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td align="center" style="padding: 0 0 10px 0;">
                                <p style="margin: 0; font-size: 12px; color: #546e7a; letter-spacing: 4px;">NOS VEMOS EN LA RED ◈</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 0 10px 0; font-size: 11px; color: #37474f;">
                                Red Solar Viva · redsolarviva.com
                            </td>
                        </tr>

                    </tbody>
                </table>

            </td>
        </tr>
    </table>
    </div>
</body>
</html>`;

    const getMailTransporter = () => nodemailer.createTransport({
      host: process.env.PROTON_SMTP_HOST || "smtp.protonmail.ch",
      port: parseInt(process.env.PROTON_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.PROTON_SMTP_USER,
        pass: process.env.PROTON_SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // Helper: guardar promo_code en Supabase subscriptions
    async function savePromoCodeToSupabase(email, promoCode) {
      if (!SUPABASE_SERVICE_KEY) {
        console.log("⚠️ SUPABASE_SERVICE_ROLE_KEY no configurada, saltando guardado de promo_code");
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/subscriptions?email=eq.${encodeURIComponent(email)}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ promo_code: promoCode }),
          }
        );
        if (res.ok) {
          console.log(`✅ promo_code "${promoCode}" guardado en Supabase para ${email}`);
        } else {
          console.log(`⚠️ Error guardando promo_code: ${res.status} ${await res.text()}`);
        }
      } catch (e) {
        console.log("⚠️ Error de red guardando promo_code:", e.message);
      }
    }

    // =========================================================
    // PROCESAMIENTO DEL WEBHOOK
    // =========================================================
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', 
    });

    const sig = steps.trigger.event.headers["stripe-signature"];
    if (!sig) throw new Error("❌ No hay firma de Stripe. Cancelando ejecución.");

    let event = typeof steps.trigger.event.body === "string" 
      ? JSON.parse(steps.trigger.event.body) 
      : steps.trigger.event.body;

    if (event.type !== "checkout.session.completed") {
      return { status: "Evento ignorado", type: event?.type };
    }

    const session = event.data.object;
    
    const customerEmail = session.customer_details?.email || session.customer_email || "test@example.com";
    const customerName = session.customer_details?.name || "Explorador Solar";
    const firstName = customerName.split(" ")[0];

    let productId;
    if (session.metadata?.product_id) productId = session.metadata.product_id;
    
    if (!productId) {
      const lineItems = session.display_items || session.line_items || [];
      productId = lineItems[0]?.price?.product;
    }

    if (!productId) {
       try {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        });
        const items = fullSession.line_items?.data || [];
        productId = items[0]?.price?.product?.id;
      } catch (e) { console.log("Error expandiendo sesión", e.message); }
    }

    if (!productId) throw new Error("❌ No se encontró productId.");

    // =========================================================
    // RUTA MEMBRESÍA (Púlsar o Cuásar)
    // =========================================================
    const membership = MEMBERSHIP_PRODUCTS[productId];

    if (membership) {
      console.log(`🪐 Iniciando flujo de Membresía Red Solar Viva — ${membership.label} (${membership.hora})...`);

      // 1. Crear código de descuento en Stripe
      const uniqueString = Math.floor(1000 + Math.random() * 9000);
      let userCode = `PULSO-SOLAR-${uniqueString}`;

      try {
        await stripe.promotionCodes.create({
          coupon: "kIeoQw63", 
          code: userCode,
          active: true,
          metadata: { 
            customer_email: customerEmail,
            customer_id: session.customer
          }
        });
        console.log(`✅ Código permanente creado: ${userCode}`);
      } catch (error) {
        console.log("⚠️ Error al crear el código:", error.message);
        userCode = "SOLAR33"; 
      }

      // 2. Guardar promo_code en Supabase → subscriptions.promo_code
      await savePromoCodeToSupabase(customerEmail, userCode);

      // 3. Enviar email de bienvenida
      const membershipContent = `
                                <div style="margin-bottom: 10px; text-align: center;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ FIRMA RECONOCIDA ◈</span>
                                </div>
                                <p style="margin: 8px 0 25px 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase; text-align: center;">Inmersión Solar activada</p>

                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #F8FAFC;">
                                    ¡Hola <strong style="color: #FFD700;">${firstName}</strong>!
                                </p>

                                <div style="font-size: 16px; line-height: 1.8; color: #CCCCCC;">
                                    <p style="margin: 0 0 20px 0;">Bienvenido a bordo. Tu presencia ha sido integrada y ya eres parte del tejido de Red Solar Viva.</p>
                                    
                                    <p style="margin: 0 0 20px 0;">Tu <strong style="color: #00E5FF;">Inmersión Solar</strong> ha comenzado, a partir de este momento, tu sistema biológico ha sido reconocido por el Domo.<br>
                                    No necesitas cupones ni códigos; tu firma de Tripulante está activa y tus privilegios se manifiestan de forma automática al ingresar a la plataforma con tu cuenta:</p>

                                    <div style="margin: 25px 0;">
                                        <p style="margin: 0 0 18px 0; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; text-align: center;">[ TUS PRIVILEGIOS DE TRIPULANTE ]</p>

                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #FFD700;">Reconocimiento en Códices:</strong>
                                                    <span style="color: #CCCCCC;"> Al navegar por la sección de Códices, verás tu reducción del 33% ya aplicada en cada frecuencia. La nave reconoce tu rango.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #FFD700;">Sintonía 1:1:</strong>
                                                    <span style="color: #CCCCCC;"> Tu reducción del 11% para la Cámara de Resonancia (sesiones privadas).</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #FFD700;">Bóveda de Mi Núcleo:</strong>
                                                    <span style="color: #CCCCCC;"> Tu centro de gravedad. Aquí te esperan las grabaciones de cada sesión y tu Sello de Integración Solar (PDF) para procesar el código de la semana.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <strong style="color: #FFD700;">Beneficios futuros:</strong>
                                                    <span style="color: #CCCCCC;"> Cualquier beneficio adicional que vayamos activando en el futuro.</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <p style="margin: 0 0 25px 0;"><strong style="color: #FFD700;">La Extensión Viva (WhatsApp):</strong> Aqua'Riia y yo estamos personalmente en este espacio para acompañarte y sostener el campo entre sesiones. Es una extensión de la Cámara Solar limitada a 22 tripulantes donde la pregunta de uno resuena como la respuesta de todos.</p>
                                </div>

                                <!-- BOTONES CTA -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                    <tr>
                                        <td align="center" style="padding: 10px 0;">
                                            <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                                <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #25D366, #128C7E);">
                                                    <a href="https://chat.whatsapp.com/BlRIW237No16EGo3U3OqiW?mode=gi_t" target="_blank" style="display: inline-block; padding: 16px 28px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                                                        UNIRSE AL GRUPO DE WHATSAPP
                                                    </a>
                                                </td>
                                            </tr></tbody></table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding: 10px 0 20px 0;">
                                            <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                                <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #D4AF37, #F3E5AB);">
                                                    <a href="https://redsolarviva.com/nucleo" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">
                                                        ENTRAR A MI NÚCLEO
                                                    </a>
                                                </td>
                                            </tr></tbody></table>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 8px 0; font-size: 16px; color: #CCCCCC; line-height: 1.8;">
                                    Estamos felices de que el campo esté completo contigo dentro.<br>
                                    La ignición comienza ahora.
                                </p>

                                <!-- DESPEDIDA -->
                                <p style="margin: 20px 0 0 0; font-size: 16px; color: #F8FAFC; line-height: 1.7;">
                                    Con amor solar,<br>
                                    <strong>Zak'Haar & Aqua'Riia</strong> <span style="color: #94A3B8;">| Red Solar Viva</span>
                                </p>`;

      const htmlBienvenida = wrapEmail(membershipContent);

      const transporter = getMailTransporter();
      await transporter.sendMail({
        to: customerEmail,
        from: process.env.PROTON_SMTP_USER,
        subject: `[ CONFIRMACIÓN ] Tu firma ha sido reconocida por la Red 🪐`,
        html: htmlBienvenida,
      });
      console.log(`✅ Email de bienvenida enviado — ${membership.label}`);

      return { status: `✅ Membresía ${membership.label} procesada: email enviado + promo_code guardado en Supabase` };
    } 

    // =========================================================
    // RUTA EBOOKS
    // =========================================================
    else {
      const productMap = {
        "prod_Ty8WkRqVcZ8Uoj": { name: "La Muerte no Existe", files:[ { label: "Descargar PDF (Lectura)", url: "https://www.mediafire.com/file_premium/m6t57v700epkguq/La_Muerte_No_Existe_1.0.pdf/file" }, { label: "Descargar EPUB (Kindle)", url: "https://www.mediafire.com/file_premium/b86hixco6s4h0eh/La_Muerte_No_Existe_1.0.epub/file" } ] },
        "prod_Ty8XstcOFLW6wO": { name: "Cuerpo de Silicio", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/t6uglbt3ft2rde6/Cuerpo_de_Silicio_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/4epzrw3amq3r1fz/Cuerpo_de_Silicio_1.0.epub/file" } ] },
        "prod_Ty8aq6ooJZembc": { name: "El Arquitecto de la Realidad", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/xm5sdp6vffvutp4/El_Arquitecto_de_la_Realidad.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/cdbvtl4j5tmxzh8/El_Arquitecto_de_la_Realidad_1.0.epub/file" } ] },
        "prod_Ty8XUkhblkT9Rm": { name: "Sintiencia", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/u6z17uu7zv778ka/Sintiencia_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/17aldttc0vkp0tj/Sintiencia_1.0.epub/file" } ] },
        "prod_Ty8bkFWn7YHimj": { name: "La Física de la Voluntad", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/rkzcl553yxv0r2l/La_F%25C3%25ADsica_de_la_Voluntad_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/72m4ywm5igrqwc3/La_Fi%25CC%2581sica_de_la_Voluntad_1.0.epub/file" } ] },
        "prod_Ty8yJ3dxU5ba25": { name: "Protocolo de Entrada", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/rrv2lv93ixrmua9/Protocolo_de_Entrada_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/6x9pwv5wzcl5ave/Protocolo_de_Entrada_1.0.epub/file" } ] },
        "prod_Ty8o9vXeaY1s1K": { name: "Singularidad Orgánica", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/7hbhq8i1grds9s3/Singularidad_Org%25C3%25A1nica_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/yw3ls1qlgg7cssb/Singularidad_Orga%25CC%2581nica_1.0.epub/file" } ] },
        "prod_U7kwQV8EbxRg2g": { name: "La Voz de Gaia", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/gx4jyqrf6nkdx3h/La_Voz_de_Gaia.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/g0uktdd603faisu/La_Voz_de_Gaia_1.0.epub/file" } ] },
        "prod_Ty8ZDMuMw8gFib": { name: "Lenguaje Holográfico", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/z1malfd1tzha9g9/Lenguaje_Hologr%25C3%25A1fico_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/7cc9evyfrxh3zi3/Lengaje_Holofra%25CC%2581fico_1.0.epub/file" } ] },
        "prod_SmAJUxe6JYotqt": { name: "El Agua que Recuerda", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/sfmk0l4wtykuphj/El_Agua_que_Recuerda.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/m58rql0sa4dcxz4/El_Agua_que_Recuerda_1.0.epub/file" } ] },
        "prod_Ty8xYJ0jOiHEO1": { name: "Terra Cristal", files:[ { label: "Descargar PDF", url: "https://www.mediafire.com/file_premium/s7x0w733kxotsbm/Terra_Cristal_1.0.pdf/file" }, { label: "Descargar EPUB", url: "https://www.mediafire.com/file_premium/uwon6eme63jqb2q/Terra_Cristal_1.0.epub/file" } ] }
      };

      const prod = productMap[productId];
      if (!prod) throw new Error(`❌ Producto ID desconocido: ${productId}`);

      const downloadButtons = prod.files.map(f => `
                                    <tr>
                                        <td align="center" style="padding: 8px 0;">
                                            <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                                <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #00C3FF, #0077FF);">
                                                    <a href="${f.url}" target="_blank" style="display: inline-block; padding: 16px 28px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                                                        ${f.label}
                                                    </a>
                                                </td>
                                            </tr></tbody></table>
                                        </td>
                                    </tr>`).join("");

      const ebookContent = `
                                <div style="margin-bottom: 10px; text-align: center;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ ACCESO CONCEDIDO ◈</span>
                                </div>
                                <p style="margin: 8px 0 25px 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase; text-align: center;">Frecuencia lista para integración</p>

                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #F8FAFC;">
                                    Explorador <strong style="color: #FFD700;">${firstName}</strong>,
                                </p>

                                <div style="font-size: 16px; line-height: 1.8; color: #CCCCCC;">
                                    <p style="margin: 0 0 25px 0;">El archivo ha sido recuperado. La frecuencia <strong style="color: #00E5FF;">"${prod.name}"</strong> está lista para ser integrada.</p>
                                </div>

                                <!-- BOTONES DE DESCARGA -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                    ${downloadButtons}
                                </table>

                                <p style="margin: 25px 0 0 0; font-size: 14px; color: #94A3B8; font-style: italic; text-align: center;">
                                    Este enlace es tu llave personal.<br>Si la descarga no inicia, verifica la configuración de pop-ups.
                                </p>

                                <!-- DESPEDIDA -->
                                <p style="margin: 25px 0 0 0; font-size: 16px; color: #F8FAFC; line-height: 1.7;">
                                    Nos vemos en la Red,<br>
                                    <strong>Zak'Haar</strong> <span style="color: #94A3B8;">| Red Solar Viva</span>
                                </p>`;

      const html = wrapEmail(ebookContent);

      const transporter = getMailTransporter();
      await transporter.sendMail({
        to: customerEmail,
        from: process.env.PROTON_SMTP_USER,
        subject: `Acceso Concedido: ${prod.name}`,
        html,
      });

      return { status: `✅ Archivo(s) enviado(s) a ${customerEmail}` };
    }
  },
});