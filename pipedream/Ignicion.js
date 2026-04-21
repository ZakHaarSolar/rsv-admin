import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export default defineComponent({
  props: {
    supabaseUrl: {
      type: "string",
      label: "Supabase URL",
    },
    supabaseServiceKey: {
      type: "string",
      label: "Supabase Service Role Key",
      secret: true,
    },
  },

  async run({ steps, $ }) {
    const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);

    // =============================================
    // 1. CALCULAR FECHA Y HORA EN CANCÚN (UTC-5)
    // =============================================
    const now = new Date();
    const cancunOffset = 5 * 60 * 60 * 1000;
    const cancunNow = new Date(now.getTime() - cancunOffset);
    const todayStr = cancunNow.toISOString().split("T")[0];
    const cancunHour = cancunNow.getUTCHours();

    // =============================================
    // 2. DETECTAR GRUPO POR HORA DE EJECUCIÓN
    //    Cron 11:30 AM → Púlsar (hora < 14)
    //    Cron  3:30 PM → Cuásar (hora >= 14)
    // =============================================
    const targetGroup = cancunHour < 14 ? "pulsar" : "cuasar";
    const groupLabel = targetGroup === "pulsar" ? "Púlsar" : "Cuásar";

    // Horarios dinámicos según grupo
    const SCHEDULE = {
      pulsar: { portal: "12:20 PM", compuertas: "12:25 PM", ignicion: "12:30 PM" },
      cuasar: { portal: "4:20 PM",  compuertas: "4:25 PM",  ignicion: "4:30 PM" },
    };
    const sched = SCHEDULE[targetGroup];

    console.log(`📅 Fecha Cancún: ${todayStr} | Hora: ${cancunHour}:xx`);
    console.log(`🏷️ Grupo objetivo: ${groupLabel} (${sched.ignicion})`);

    // =============================================
    // 3. OBTENER TRIPULANTES DEL GRUPO ACTIVO
    // =============================================
    const { data: subscribers, error: subError } = await supabase
      .from("subscriptions")
      .select("email, customer_name, user_id")
      .eq("status", "active")
      .eq("group_name", targetGroup);

    if (subError) console.error("❌ Error consultando suscriptores:", subError);

    // =============================================
    // 4. OBTENER EXPLORADORES DEL DÍA
    //    (Pases de exploración — incluidos para ambos
    //     grupos por ahora. Cuando exploration_passes
    //     tenga group_name, filtrar aquí también.)
    // =============================================
    const { data: explorers, error: expError } = await supabase
      .from("exploration_passes")
      .select("email, name")
      .eq("event_date", todayStr);

    if (expError) console.error("❌ Error consultando exploradores:", expError);

    console.log(`🪐 Suscriptores ${groupLabel} activos: ${subscribers?.length || 0}`);
    console.log(`🔭 Exploradores del día: ${explorers?.length || 0}`);

    // =============================================
    // 5. OBTENER NOMBRES DE PROFILES
    // =============================================
    const userIds = (subscribers || [])
      .map(s => s.user_id)
      .filter(id => id !== null && id !== undefined);

    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profiles) {
        for (const p of profiles) {
          if (p.full_name && p.full_name.trim() !== "") {
            profilesMap[p.id] = p.full_name.trim();
          }
        }
      }
    }

    // =============================================
    // 6. COMBINAR Y DEDUPLICAR POR EMAIL
    // =============================================
    const recipientMap = new Map();

    for (const sub of (subscribers || [])) {
      const email = sub.email.toLowerCase().trim();
      const nombre =
        (sub.user_id && profilesMap[sub.user_id]) ||
        sub.customer_name ||
        sub.email.split("@")[0].replace(/[._-]/g, " ") ||
        "Tripulante";
      recipientMap.set(email, {
        email,
        primerNombre: nombre.split(" ")[0],
        tipo: "suscriptor",
      });
    }

    for (const exp of (explorers || [])) {
      const email = exp.email.toLowerCase().trim();
      if (!recipientMap.has(email)) {
        recipientMap.set(email, {
          email,
          primerNombre: (exp.name || "Explorador").split(" ")[0],
          tipo: "explorador",
        });
      }
    }

    const allRecipients = Array.from(recipientMap.values());

    if (allRecipients.length === 0) {
      $.flow.exit(`No hay tripulantes ni exploradores para ${groupLabel} hoy.`);
    }

    console.log(`📡 Total destinatarios ${groupLabel} (deduplicados): ${allRecipients.length}`);

    // =============================================
    // 7. CONFIGURAR TRANSPORTER (PROTON SMTP)
    // =============================================
    const transporter = nodemailer.createTransport({
      host: process.env.PROTON_SMTP_HOST || "smtp.protonmail.ch",
      port: parseInt(process.env.PROTON_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.PROTON_SMTP_USER,
        pass: process.env.PROTON_SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // =============================================
    // 8. VISUAL — ALARMA DE IGNICIÓN
    // =============================================
    const logoUrl = "https://drive.google.com/uc?export=view&id=1t4glJMPN7JmkDKl9v0hDmhH1gavbMycD";
    const spaceBgUrl = "https://www.transparenttextures.com/patterns/stardust.png";
    const zoomLink = "https://us06web.zoom.us/j/87033621223";
    const nucleoLink = "https://www.redsolarviva.com/nucleo#camara-solar";

    const buildEmail = (primerNombre) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <u></u>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Secuencia de Ignición</title>
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
                                <div style="margin-top: 22px;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ SECUENCIA DE IGNICIÓN ◈</span>
                                </div>
                                <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase;">T-60 minutos</p>
                            </td>
                        </tr>

                        <!-- LÍNEA SEPARADORA -->
                        <tr>
                            <td align="center" style="padding: 0 0 25px 0;">
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div>
                            </td>
                        </tr>

                        <!-- CONTENIDO -->
                        <tr>
                            <td style="padding: 0 10px; font-size: 16px; line-height: 1.8; color: #CCCCCC;" align="left">

                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #F8FAFC;">
                                    Tripulante <strong style="color: #FFD700;">${primerNombre}</strong>,
                                </p>

                                <p style="margin: 0 0 20px 0;">
                                    Este es tu pulso de aproximación. Los reactores de la Cámara Solar están en fase de ignición.
                                </p>

                                <p style="margin: 0 0 28px 0;">
                                    En exactamente 60 minutos inicia la emisión. El Domo entrará en línea para nuestra sintonización grupal de esta semana.
                                </p>

                                <!-- PROTOCOLO DE ABORDAJE -->
                                <p style="margin: 0 0 18px 0; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; text-align: center;">[ PROTOCOLO DE ABORDAJE ]</p>

                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="margin-bottom: 28px;">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                            <strong style="color: #FFD700;">Desconecta:</strong>
                                            <span style="color: #CCCCCC;"> Aísla temporalmente tu avatar biológico de las distracciones y la estática de la matriz.</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                            <strong style="color: #FFD700;">Ancla:</strong>
                                            <span style="color: #CCCCCC;"> Prepara tu espacio físico y mantén agua cerca para facilitar la conductividad durante la transmisión.</span>
                                        </td>
                                    </tr>
                                </table>

                                <!-- SINTONIZA: TIMELINE DINÁMICO -->
                                <p style="margin: 0 0 6px 0;">
                                    <strong style="color: #FFD700;">Sintoniza:</strong>
                                </p>
                                <p style="margin: 0 0 20px 0; font-size: 11px; color: #546e7a; letter-spacing: 1px;">(Todos los horarios en hora Cancún · UTC-5)</p>

                                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                            <p style="margin: 0 0 6px 0;">
                                                <strong style="color: #00E5FF; font-size: 15px;">${sched.portal}</strong>
                                                <span style="color: #94A3B8;"> │ </span>
                                                <strong style="color: #FFD700;">Activación del Portal:</strong>
                                            </p>
                                            <p style="margin: 0; color: #CCCCCC; font-size: 15px; line-height: 1.7;">
                                                El botón dorado de mando aparecerá en tu bóveda de 'Mi Núcleo'. A partir de ese momento podrás pulsar el enlace para preparar tu conexión.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                            <p style="margin: 0 0 6px 0;">
                                                <strong style="color: #00E5FF; font-size: 15px;">${sched.compuertas}</strong>
                                                <span style="color: #94A3B8;"> │ </span>
                                                <strong style="color: #FFD700;">Apertura de Compuertas:</strong>
                                            </p>
                                            <p style="margin: 0; color: #CCCCCC; font-size: 15px; line-height: 1.7;">
                                                Abriremos el acceso a la sala de Zoom. Puedes entrar en este momento para aclimatar tu sistema biológico con la frecuencia acústica de espera.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 0;">
                                            <p style="margin: 0 0 6px 0;">
                                                <strong style="color: #00E5FF; font-size: 15px;">${sched.ignicion}</strong>
                                                <span style="color: #94A3B8;"> │ </span>
                                                <strong style="color: #FFD700;">Ignición Absoluta:</strong>
                                            </p>
                                            <p style="margin: 0; color: #CCCCCC; font-size: 15px; line-height: 1.7;">
                                                Cerramos la fase de preparación e iniciamos con fuego exacto la transmisión de la semana.
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- BOTÓN CTA: MI NÚCLEO -->
                        <tr>
                            <td align="center" style="padding: 30px 0 20px 0;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #D4AF37, #F3E5AB);">
                                                <a href="${nucleoLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">
                                                    ENTRAR A MI NÚCLEO
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- ENLACE DIRECTO ZOOM -->
                        <tr>
                            <td align="center" style="padding: 0 10px 30px 10px;">
                                <p style="margin: 0; font-size: 14px; color: #94A3B8; line-height: 1.6;">
                                    (Si prefieres la ruta de acceso directo, tu enlace maestro del reactor es este:
                                    <a href="${zoomLink}" target="_blank" style="color: #00E5FF; text-decoration: none;">${zoomLink}</a>)
                                </p>
                            </td>
                        </tr>

                        <!-- DESPEDIDA -->
                        <tr>
                            <td style="padding: 0 10px 25px 10px;" align="left">
                                <p style="margin: 0; font-size: 16px; color: #F8FAFC; line-height: 1.7;">
                                    Nos vemos en el campo de resonancia,<br>
                                    <strong>Zak'Haar</strong> <span style="color: #94A3B8;">| Red Solar Viva</span>
                                </p>
                            </td>
                        </tr>

                        <!-- LÍNEA SEPARADORA INFERIOR -->
                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
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

    // =============================================
    // 9. ENVIAR A TODOS
    // =============================================
    const resultados = [];

    for (const recipient of allRecipients) {
      console.log(`📧 [${groupLabel}] ${recipient.email} → ${recipient.primerNombre} (${recipient.tipo})`);

      const htmlBody = buildEmail(recipient.primerNombre);

      try {
        await transporter.sendMail({
          from: process.env.PROTON_SMTP_USER,
          to: recipient.email,
          subject: `Secuencia de aproximación: La Cámara Solar se abre en 1 hora`,
          html: htmlBody,
        });
        resultados.push({ email: recipient.email, tipo: recipient.tipo, grupo: targetGroup, status: "✅ enviado" });
        console.log(`✅ Enviado a ${recipient.email}`);
      } catch (err) {
        resultados.push({ email: recipient.email, status: "❌ error", error: err.message });
        console.error(`❌ Error con ${recipient.email}: ${err.message}`);
      }
    }

    console.log(`📊 [${groupLabel}] Resumen: ${resultados.filter(r => r.status.includes("✅")).length}/${resultados.length} enviados`);
    return resultados;
  },
});