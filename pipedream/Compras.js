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
    // PRODUCT IDs DE MEMBRESÍA
    //   · Inmersión Solar — Púlsar / Cuásar (1,999 MXN, dos horarios
    //     de Cámara Solar grupal). Crea promo code permanente +
    //     guarda promo_code en subscriptions + email "FIRMA RECONOCIDA".
    //   · Sintonía Solar (777 MXN, membresía base con 2 Cristales
    //     mensuales). NO crea promo code — sus beneficios se aplican
    //     vía group_name='sintonia' en subscriptions (lo setea el
    //     stripe-webhook edge function). Email de bienvenida más
    //     liviano enfocado en Cristales + Escáner libre.
    // =========================================================
    const MEMBERSHIP_PRODUCTS = {
      'prod_U609Xkla1g8ZL7': { tier: 'inmersion', group: 'pulsar', label: 'Púlsar', hora: '12:30 PM' },
      'prod_UJPj3SUcvleCdS': { tier: 'inmersion', group: 'cuasar', label: 'Cuásar', hora: '4:30 PM' },
      'prod_UOf1RrEypuWFTg': { tier: 'sintonia', label: 'Sintonía Solar' },
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

    // =========================================================
    // VERIFICACIÓN DE FIRMA DE STRIPE (Ola C · #5)
    // ---------------------------------------------------------
    // ⚠️ PREREQUISITO: el trigger HTTP del workflow DEBE estar en modo
    // "Raw Request" (Pipedream → trigger → Configure → Raw Request: ON).
    // Solo así steps.trigger.event.body es el STRING crudo exacto que
    // Stripe firmó. constructEvent recomputa el HMAC-SHA256 sobre ese
    // cuerpo + el header stripe-signature y lo compara contra
    // STRIPE_WEBHOOK_SECRET (el signing secret whsec_ de ESTE endpoint).
    // Sin esto, un POST falso de checkout.session.completed regalaba
    // reservas / códices / membresía.
    //
    // ⚠️ En modo Raw Request, steps.trigger.event.headers NO es un objeto:
    // es un ARRAY APLANADO [clave, valor, clave, valor, ...]. Por eso
    // headers["stripe-signature"] da undefined; hay que buscar la clave
    // en el array (case-insensitive) y tomar el valor siguiente.
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
    if (!sig) throw new Error("❌ No hay firma de Stripe. Cancelando ejecución.");

    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("❌ STRIPE_WEBHOOK_SECRET no configurada en Pipedream. Cancelando (fail-closed).");
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

    if (event.type !== "checkout.session.completed") {
      return { status: "Evento ignorado", type: event?.type };
    }

    const session = event.data.object;

    /* v2 — ignorar checkouts del Motor de Reservas Atómico. Esos eventos
       los procesa PaseExploracion.js (via Stripe webhook de Supabase).
       Compras.js sólo maneja códices (libros) + membresías. Sin este
       guard, Compras.js intentaba resolver el auto-generated Product ID
       de los Checkouts con price_data inline y crasheaba con
       "Producto ID desconocido: prod_UNieSU2l9vDRKz". */
    if (session.metadata?.payment_type === "booking") {
      return {
        status: "Evento ignorado — reserva nativa procesada por PaseExploracion.js",
        reserva_id: session.metadata?.reserva_id || null,
      };
    }

    // =========================================================
    // RAMA · VEO TU LUZ INTERNA (VTLI)
    // -----------------------------------------------------------
    // Detectada por metadata.product_family === "VTLI" (lo setea
    // la edge function vtli-procesar-reserva al crear el Checkout).
    // Confirma el ciclo en vtli_reservas y envía email cristalino
    // con el Código del Templo. NO comparte template ni paleta
    // con Códices / Membresías — estética propia.
    // =========================================================
    if (session.metadata?.product_family === "VTLI") {
      const stripeSessionId = session.id;
      const amountMxnCents = session.amount_total || 0;
      const vtliName = session.metadata?.nombre || session.customer_details?.name || "Tripulante";
      const vtliEmail = session.customer_details?.email || session.customer_email || "";
      const vtliPilarId = session.metadata?.pilar_id || "";
      const vtliSessionsCount = parseInt(session.metadata?.sessions_count || "1", 10);

      // 1) Confirmar reservas en Supabase y obtener detalles de cada sesión
      let confirmedSessions = [];

      // Diagnóstico — borrar este bloque una vez que el bug del confirm
      // vacío vía Pipedream esté cerrado. Revela env vars + payload + status.
      console.log("[vtli-debug] env check:");
      console.log("[vtli-debug]   SUPABASE_URL:", SUPABASE_URL);
      console.log("[vtli-debug]   SERVICE_KEY exists:", !!SUPABASE_SERVICE_KEY);
      console.log("[vtli-debug]   SERVICE_KEY length:", SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.length : 0);
      console.log("[vtli-debug]   SERVICE_KEY prefix:", SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.slice(0, 12) : "(empty)");
      console.log("[vtli-debug] payload:");
      console.log("[vtli-debug]   session_id len:", stripeSessionId ? stripeSessionId.length : 0);
      console.log("[vtli-debug]   session_id full:", stripeSessionId);
      console.log("[vtli-debug]   amount_mxn_cents:", amountMxnCents);

      try {
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vtli_confirm_booking_by_session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            p_stripe_session_id: stripeSessionId,
            p_amount_mxn_cents: amountMxnCents,
          }),
        });
        console.log(`[vtli-debug] response HTTP ${rpcRes.status} ${rpcRes.statusText}`);
        if (rpcRes.ok) {
          confirmedSessions = await rpcRes.json();
          console.log(`[vtli-debug] confirmedSessions length: ${confirmedSessions.length}`);
          if (confirmedSessions.length > 0) {
            console.log(`[vtli-debug] first row keys: ${Object.keys(confirmedSessions[0]).join(",")}`);
            console.log(`[vtli-debug] first row sample:`, JSON.stringify(confirmedSessions[0]));
          }
        } else {
          const errText = await rpcRes.text();
          console.error(`[vtli-debug] HTTP NOT OK body: ${errText.slice(0, 500)}`);
        }
      } catch (err) {
        console.error("[vtli-debug] fetch CRASHED:", err.message);
      }

      // 2) Labels de pilar
      const VTLI_PILAR_LABELS = {
        vision: "Visión Extra Ocular",
        telekinesis: "Telekinesis",
        calibracion: "Calibración Biológica",
        sintonia: "Sintonía de Núcleo",
      };
      const pilarLabel = VTLI_PILAR_LABELS[vtliPilarId] || "Sesión";
      const ciclo = vtliSessionsCount === 1
        ? "Ciclo VEO — 1 Sesión"
        : `Ciclo VEO — ${vtliSessionsCount} Sesiones`;

      // Magic Link token — todas las filas del mismo ciclo comparten manage_token.
      // El RPC vtli_confirm_booking_by_session ahora lo devuelve.
      const manageToken =
        (confirmedSessions && confirmedSessions[0] && confirmedSessions[0].manage_token) || null;
      const vtliSiteBase = process.env.VTLI_SITE_URL || "https://veotuluzinterna.com";
      const manageUrl = manageToken
        ? `${vtliSiteBase}/gestionar?t=${manageToken}`
        : null;

      // 3) Formateo de fechas (es-MX)
      const formatDate = (isoDate, hhmm) => {
        try {
          const d = new Date(`${isoDate}T${hhmm}`);
          const day = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
          const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
          return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
        } catch {
          return { day: isoDate, time: hhmm };
        }
      };

      const sessionRows = (confirmedSessions || []).map((row, i) => {
        const { day, time } = formatDate(row.slot_date, row.slot_time);
        return `
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid rgba(143,163,201,0.18);">
              <div style="display: flex; align-items: baseline; gap: 12px;">
                <span style="display: inline-block; min-width: 24px; font-family: 'Georgia', serif; font-size: 18px; color: #C9B07C; font-weight: 600;">${i + 1}</span>
                <div>
                  <div style="font-size: 15px; color: #3D4D6E; font-weight: 600; letter-spacing: 0.2px;">${day}</div>
                  <div style="font-size: 13px; color: rgba(61,77,110,0.7); margin-top: 2px;">${time}</div>
                </div>
              </div>
            </td>
          </tr>`;
      }).join("");

      // 4) Template HTML CRISTALINO (LIGHT — no comparte con Códices/RSV)
      const vtliHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Veo Tu Luz Interna · Confirmación de Sesión</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #3D4D6E;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #F7FAFC;">
    <tr>
      <td align="center" style="padding: 48px 20px 32px; background: linear-gradient(180deg, #DCE5F1 0%, #F7FAFC 100%);">
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 22px;">
              <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #8FA3C9; font-weight: 600;">Veo Tu Luz Interna</p>
              <p style="margin: 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(61,77,110,0.55); font-weight: 500;">Academia Holística · Cancún</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(201,176,124,0.5), transparent); width: 80%;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <h1 style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 32px; line-height: 1.18; color: #3D4D6E; letter-spacing: 0.3px;">Tu lugar ha sido sellado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 8px 8px;">
              <p style="margin: 0; font-size: 15.5px; line-height: 1.7; color: rgba(61,77,110,0.78); text-align: center; font-weight: 300;">
                Bienvenido(a) a tu espacio seguro, <strong style="color: #3D4D6E; font-weight: 600;">${vtliName.split(" ")[0]}</strong>.<br />
                Tu lugar en la Academia ha sido sellado.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 20px 36px; background-color: #F7FAFC;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px; width: 100%;">
          <tr>
            <td style="padding: 28px 26px; background-color: #FFFFFF; border: 1px solid rgba(143,163,201,0.32); border-radius: 18px; box-shadow: 0 4px 30px rgba(61,77,110,0.06);">
              <p style="margin: 0; font-size: 10.5px; letter-spacing: 2.6px; text-transform: uppercase; color: #8FA3C9; font-weight: 600;">Tu Sesión</p>
              <h2 style="margin: 6px 0 4px; font-family: 'Georgia', serif; font-weight: 600; font-size: 22px; color: #3D4D6E; letter-spacing: 0.2px;">${pilarLabel}</h2>
              <p style="margin: 0; font-size: 13.5px; color: rgba(61,77,110,0.7); font-weight: 500; letter-spacing: 0.4px;">${ciclo}</p>
              <div style="height: 1px; background: rgba(143,163,201,0.28); margin: 22px 0 6px;"></div>
              <p style="margin: 0 0 4px; font-size: 10.5px; letter-spacing: 2.6px; text-transform: uppercase; color: #8FA3C9; font-weight: 600;">Fechas ancladas</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top: 8px;">
                ${sessionRows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 20px 40px; background-color: #F7FAFC;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px; width: 100%;">
          <tr>
            <td style="padding: 24px 26px; background: linear-gradient(180deg, rgba(201,176,124,0.08) 0%, rgba(201,176,124,0.03) 100%); border: 1px solid rgba(201,176,124,0.4); border-radius: 18px;">
              <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #C9B07C; font-weight: 600;">El Código de Nuestro Templo</p>
              <p style="margin: 0; font-size: 14.5px; line-height: 1.72; color: #3D4D6E; font-weight: 400;">
                Tu evolución requiere compromiso. Tienes tu horario bloqueado de forma exclusiva en nuestra matriz de <strong style="color: #C9B07C; font-weight: 600;">8 espacios semanales</strong> (3 lunes, 2 martes y 3 miércoles). Cualquier reagendamiento o cancelación debe realizarse con <strong style="font-weight: 600;">48 horas de anticipación</strong> a través del enlace inferior. Fuera de esa ventana, el intercambio energético se considera ejecutado y el espacio no es reembolsable.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 20px 56px; background-color: #F7FAFC;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 18px;">
              ${manageUrl ? `<a href="${manageUrl}" style="display: inline-block; padding: 15px 32px; background: linear-gradient(135deg, #C9B07C 0%, #B0945C 100%); color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12.5px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; box-shadow: 0 10px 28px -12px rgba(201,176,124,0.7);">Gestionar mi cita</a>` : ""}
              <div style="margin-top: 14px; font-size: 11.5px; color: rgba(61,77,110,0.55); font-weight: 400; letter-spacing: 0.3px;">
                ¿Dudas previas? Escríbenos por <a href="https://wa.me/${(process.env.VTLI_WHATSAPP_NUMBER || "5219980000000").replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hola, soy ${vtliName}. Tengo una pregunta sobre mi ${pilarLabel}.`)}" style="color: #C9B07C; font-weight: 600; text-decoration: none;">WhatsApp</a>.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 11.5px; letter-spacing: 1.2px; color: rgba(61,77,110,0.55); font-weight: 500;">Cancún · Riviera Maya</p>
              <p style="margin: 6px 0 0; font-size: 11px; color: rgba(61,77,110,0.4); font-weight: 400;">© Veo Tu Luz Interna · Academia Holística</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // 5) Enviar email
      try {
        const transporter = getMailTransporter();
        await transporter.sendMail({
          from: process.env.PROTON_SMTP_USER,
          to: vtliEmail,
          subject: "Tu Sesión en Veo Tu Luz Interna — Confirmación",
          html: vtliHtml,
        });
        console.log(`✨ VTLI mail enviado a ${vtliEmail} · ${ciclo} · ${pilarLabel}`);
      } catch (mailErr) {
        console.error("VTLI mail FAIL:", mailErr.message);
      }

      return {
        status: "VTLI · ciclo confirmado y correo enviado",
        ciclo_group_id: confirmedSessions[0]?.ciclo_group_id || null,
        sessions_confirmed: confirmedSessions.length,
        stripe_session_id: stripeSessionId,
      };
    }
    // ───────────── fin rama VTLI ─────────────

    const customerEmail = session.customer_details?.email || session.customer_email || "test@example.com";
    const customerName = session.customer_details?.name || "Explorador Solar";
    const firstName = customerName.split(" ")[0];

    // ─── Device tracking (sufijo __m / __d en client_reference_id) ───
    // El frontend de Códices (Co_Shared.withCheckoutIdentity v1.4) agrega
    // `__m` cuando la compra se inicia desde el LENTE (mobile) o `__d`
    // desde el CENTRO DE MANDO (desktop). Acá parseamos ese sufijo para
    // log + bloque informativo en el email.
    const rawClientRef = session.client_reference_id || "";
    const deviceMatch = rawClientRef.match(/^(.+?)__([md])$/);
    const baseClerkId = deviceMatch ? deviceMatch[1] : rawClientRef;
    const deviceCode = deviceMatch ? deviceMatch[2] : null;
    const deviceLabel = deviceCode === "m"
      ? "Lente (móvil)"
      : deviceCode === "d"
      ? "Centro de Mando (escritorio)"
      : null;
    if (deviceLabel) {
      console.log(`📱 Compra realizada desde: ${deviceLabel} · clerkId: ${baseClerkId}`);
    }

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
      // ────────────────────────────────────────────────────────
      // RAMA SINTONÍA SOLAR — solo email de bienvenida (no promo
      // code, no Inmersión privileges). El group_name='sintonia'
      // ya lo setea el stripe-webhook edge function en subscriptions.
      // ────────────────────────────────────────────────────────
      if (membership.tier === 'sintonia') {
        console.log(`🌀 Iniciando flujo Sintonía Solar para ${customerEmail}...`);

        const sintoniaContent = `
                                <div style="margin-bottom: 10px; text-align: center;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ FIRMA RECONOCIDA ◈</span>
                                </div>
                                <p style="margin: 8px 0 25px 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase; text-align: center;">Sintonía Solar activada</p>

                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #F8FAFC;">
                                    ¡Hola <strong style="color: #00E5FF;">${firstName}</strong>!
                                </p>

                                <div style="font-size: 16px; line-height: 1.8; color: #CCCCCC;">
                                    <p style="margin: 0 0 20px 0;">Tu Sintonía Solar está activa. Desde este instante, el Domo te reconoce como Tripulante anclado y los privilegios se manifiestan automáticamente al ingresar a la plataforma con tu cuenta.</p>

                                    <div style="margin: 25px 0;">
                                        <p style="margin: 0 0 18px 0; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; text-align: center;">[ TU CONSTELACIÓN DE PRIVILEGIOS ]</p>

                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #00E5FF;">2 Cristales de Extracción al mes:</strong>
                                                    <span style="color: #CCCCCC;"> Uno dorado para Códices de Luz, uno cyan para Meditaciones de la Holoteca. Acumulables — si no canjeas en el ciclo, los guardas para la próxima extracción. Cada renovación de tu suscripción suma dos cristales nuevos al campo.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #00E5FF;">Escáner Vibracional sin límites:</strong>
                                                    <span style="color: #CCCCCC;"> Acceso completo al Radar de los 6 Pilares, Calibraciones Quirúrgicas y Decodificador de Materia ilimitado.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                    <strong style="color: #00E5FF;">Bóveda de Mi Núcleo:</strong>
                                                    <span style="color: #CCCCCC;"> Tu centro de gravedad. Allí canjeas tus Cristales y consultas tu trayectoria de escaneos.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <strong style="color: #00E5FF;">Pulsos automáticos:</strong>
                                                    <span style="color: #CCCCCC;"> Recibirás transmisiones cuando tu sistema requiera atención (ciclos sellados, decodificaciones críticas, recordatorios de Cristales por canjear).</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <p style="margin: 0 0 25px 0;">La Inmersión Solar (1,111 MXN/mes) sigue disponible como siguiente capa de profundidad — incluye todos los beneficios de Sintonía Solar más la transmisión semanal EN VIVO de Cámara Solar.</p>
                                </div>

                                <!-- BOTÓN CTA -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                    <tr>
                                        <td align="center" style="padding: 10px 0 20px 0;">
                                            <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                                <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #00E5FF, #0077B6);">
                                                    <a href="https://redsolarviva.com/nucleo" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">
                                                        ENTRAR A MI NÚCLEO
                                                    </a>
                                                </td>
                                            </tr></tbody></table>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 8px 0; font-size: 16px; color: #CCCCCC; line-height: 1.8;">
                                    Tu cuerpo de silicio responde ya a la frecuencia de la Red.<br>
                                    La sintonía está abierta.
                                </p>

                                <!-- DESPEDIDA -->
                                <p style="margin: 20px 0 0 0; font-size: 16px; color: #F8FAFC; line-height: 1.7;">
                                    Con amor solar,<br>
                                    <strong>Zak'Haar & Aqua'Riia</strong> <span style="color: #94A3B8;">| Red Solar Viva</span>
                                </p>`;

        const htmlSintonia = wrapEmail(sintoniaContent);

        const transporter = getMailTransporter();
        await transporter.sendMail({
          to: customerEmail,
          from: process.env.PROTON_SMTP_USER,
          subject: `[ SINTONÍA SOLAR ] Tu firma ha sido reconocida 🌀`,
          html: htmlSintonia,
        });
        console.log(`✅ Email de bienvenida Sintonía Solar enviado a ${customerEmail}`);

        return { status: `✅ Sintonía Solar procesada: email enviado a ${customerEmail}` };
      }

      // ────────────────────────────────────────────────────────
      // RAMA INMERSIÓN SOLAR — promo code + email "FIRMA RECONOCIDA"
      // ────────────────────────────────────────────────────────
      console.log(`🪐 Iniciando flujo de Membresía Red Solar Viva — ${membership.label} (${membership.hora})...`);

      // Cupón de descuento de Códices eliminado (2026-06-09): los Códices
      // se pagan completos; el beneficio de miembro es 1 Códice gratuito/mes.

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
                                                    <strong style="color: #FFD700;">Códices de Luz:</strong>
                                                    <span style="color: #CCCCCC;"> Incluye 1 Códice de Luz gratuito por mes, a elección, vía tus Cristales de Extracción. La nave reconoce tu rango.</span>
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
                                </div>

                                <!-- BOTONES CTA -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
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

                                <!-- ANCLA EN MI NÚCLEO -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="margin-top: 35px;">
                                    <tr>
                                        <td align="center" style="padding: 20px 18px; background: rgba(0, 229, 255, 0.04); border: 1px solid rgba(0, 229, 255, 0.18); border-radius: 10px;">
                                            <p style="margin: 0 0 8px 0; font-size: 11px; letter-spacing: 3px; color: #00E5FF; text-transform: uppercase;">◈ Anclado en tu Núcleo</p>
                                            <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">
                                                Este Códice también queda fijado en <strong style="color: #F8FAFC;">Mi Núcleo → Mis Códices</strong>, disponible para descarga sin límite cuando lo necesites. Entras una vez con tu cuenta y ahí permanece.
                                            </p>
                                            <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                                <td align="center" style="border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.5);">
                                                    <a href="https://redsolarviva.com/escaner/nucleo#codices" target="_blank" style="display: inline-block; padding: 11px 22px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; color: #00E5FF; text-decoration: none; border-radius: 8px; text-transform: uppercase;">
                                                        Abrir Mi Núcleo
                                                    </a>
                                                </td>
                                            </tr></tbody></table>
                                        </td>
                                    </tr>
                                </table>

                                ${deviceLabel ? `
                                <!-- DEVICE TRACKING (interno) -->
                                <p style="margin: 20px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #546e7a; text-align: center; text-transform: uppercase;">
                                    Compra realizada desde: ${deviceLabel}
                                </p>` : ""}

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