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
    // 1. CALCULAR HORA EN CANCÚN Y DETECTAR GRUPO
    //    Cron 3:33 PM → Púlsar (hora < 17)
    //    Cron 6:33 PM → Cuásar (hora >= 17)
    // =============================================
    const now = new Date();
    const cancunOffset = 5 * 60 * 60 * 1000;
    const cancunNow = new Date(now.getTime() - cancunOffset);
    const cancunHour = cancunNow.getUTCHours();

    const targetGroup = cancunHour < 17 ? "pulsar" : "cuasar";
    const groupLabel = targetGroup === "pulsar" ? "Púlsar" : "Cuásar";

    console.log(`🏷️ Grupo objetivo: ${groupLabel} | Hora Cancún: ${cancunHour}:xx`);

    // =============================================
    // 2. OBTENER TRIPULANTES DEL GRUPO CON INMERSIÓN ACTIVA
    // =============================================
    const { data: subscribers, error } = await supabase
      .from("subscriptions")
      .select("email, customer_name, user_id")
      .eq("status", "active")
      .eq("group_name", targetGroup);

    if (error) throw new Error(`❌ Supabase error: ${error.message}`);

    if (!subscribers || subscribers.length === 0) {
      $.flow.exit(`No hay tripulantes con Inmersión Solar activa en grupo ${groupLabel}.`);
    }

    console.log(`🪐 Tripulantes ${groupLabel} activos: ${subscribers.length}`);

    // =============================================
    // 3. OBTENER NOMBRES DE PROFILES (PRIORIDAD)
    // =============================================
    const userIds = subscribers
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

    console.log(`👤 Profiles con nombre: ${Object.keys(profilesMap).length}`);

    // =============================================
    // 4. CONFIGURAR TRANSPORTER (PROTON SMTP)
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
    // 5. VISUAL — SELLO DE INTEGRACIÓN
    // =============================================
    const logoUrl = "https://drive.google.com/uc?export=view&id=1t4glJMPN7JmkDKl9v0hDmhH1gavbMycD";
    const spaceBgUrl = "https://www.transparenttextures.com/patterns/stardust.png";

    const buildEmail = (primerNombre) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <u></u>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Sello de Integración</title>
    <style>
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            background-color: #050505;
        }
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
                                <p style="margin: 0 0 16px 0; font-size: 11px; letter-spacing: 6px; color: #94A3B8; text-transform: uppercase;">RED SOLAR VIVA</p>
                                <img src="${logoUrl}" alt="Red Solar Viva" style="width: 164px; max-width: 100%; height: auto;">
                                <div style="margin-top: 22px;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ SELLO DE INTEGRACIÓN ◈</span>
                                </div>
                                <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase;">Calibración completada</p>
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
                                    La calibración de hoy ha completado su proceso de maduración en el campo. Las frecuencias se han cristalizado y el código está listo para ser integrado en tu sistema.
                                </p>

                                <p style="margin: 0 0 20px 0;">
                                    El <strong style="color: #00E5FF;">Sello de Integración</strong> (PDF + Grabación) ya está disponible en tu portal <strong style="color: #FFD700;">Mi Núcleo</strong>.
                                </p>

                                <p style="margin: 0 0 30px 0;">
                                    La ventana de integración es en el eterno ahora.
                                </p>
                            </td>
                        </tr>

                        <!-- BOTÓN CTA -->
                        <tr>
                            <td align="center" style="padding: 0 0 35px 0;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #D4AF37, #F3E5AB);">
                                                <a href="https://redsolarviva.com/nucleo" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">
                                                    ACCEDER A MI NÚCLEO
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
    // 6. ENVIAR A CADA TRIPULANTE DEL GRUPO
    // =============================================
    const resultados = [];

    for (const sub of subscribers) {
      const nombre =
        (sub.user_id && profilesMap[sub.user_id]) ||
        sub.customer_name ||
        sub.email.split("@")[0].replace(/[._-]/g, " ") ||
        "Tripulante";

      const primerNombre = nombre.split(" ")[0];

      console.log(`📧 [${groupLabel}] ${sub.email} → "${primerNombre}"`);

      const htmlBody = buildEmail(primerNombre);

      try {
        await transporter.sendMail({
          from: process.env.PROTON_SMTP_USER,
          to: sub.email,
          subject: `◈ El Sello de Integración ha sido anclado en tu Núcleo`,
          html: htmlBody,
        });
        resultados.push({ email: sub.email, nombre, grupo: targetGroup, status: "✅ enviado" });
        console.log(`✅ Enviado a ${sub.email}`);
      } catch (err) {
        resultados.push({ email: sub.email, status: "❌ error", error: err.message });
        console.error(`❌ Error con ${sub.email}: ${err.message}`);
      }
    }

    console.log(`📊 [${groupLabel}] Resumen: ${resultados.filter(r => r.status.includes("✅")).length}/${resultados.length} enviados`);
    return resultados;
  },
});