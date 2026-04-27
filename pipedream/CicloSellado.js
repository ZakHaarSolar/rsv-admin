import nodemailer from "nodemailer";

/**
 * Red Solar Viva · CicloSellado
 * =============================
 * Trigger: HTTP webhook (dispara el Escáner Vibracional cuando un tripulante
 * cierra su primer ciclo 6/6 — de 0 a 1 en complete_cycles).
 *
 * Propósito: entregar el Sello del Primer Ciclo. Confirma la integración,
 * resume los 6 puntajes, destaca el pilar más bajo y abre la puerta a
 * Sintonía Solar con CTA al checkout de Stripe.
 *
 * v2 (2026-04-27)
 *  · Skip si el tripulante ya tiene Sintonía Solar activa: el correo es
 *    una invitación al checkout, no tiene sentido mandarlo a quienes ya
 *    pagaron. Verificamos via subscriptions?email=eq.X&status=eq.active.
 *  · Log a Supabase (RPC log_email_dispatch) en CADA terminación: sent,
 *    failed o skipped. Eso le permite al Motor de Intervención mostrar
 *    si el correo llegó, si falló por SMTP, o si fue omitido.
 *
 * Payload esperado (body JSON del POST):
 * {
 *   clerk_user_id: string (recomendado para tracking),
 *   email: string (obligatorio),
 *   full_name: string | null,
 *   indice: number (0-100),
 *   scores: { fisico, mental, emocional, financiero, vector, orbita },
 *   pilar_mas_bajo: { id, label, score },  // opcional — se calcula si falta
 *   fecha: string ISO (opcional — default: now),
 * }
 *
 * Env vars (Pipedream):
 *   PROTON_SMTP_USER, PROTON_SMTP_PASS, PROTON_SMTP_HOST, PROTON_SMTP_PORT
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 */
export default defineComponent({
  props: {
    http: {
      type: "$.interface.http",
      customResponse: true,
    },
  },

  async run({ steps, $ }) {
    const body = this.http?.body || steps?.trigger?.event?.body || {};

    const clerkUserId = (body.clerk_user_id || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      await this.http.respond({
        status: 400,
        body: { error: "missing email" },
      });
      return { ok: false, reason: "missing email" };
    }

    const fullName = (body.full_name || "").trim();
    const indice = Math.max(0, Math.min(100, Math.round(body.indice ?? 0)));
    const scores = body.scores || {};
    const fechaIso = body.fecha || new Date().toISOString();

    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    const supabaseReady = supabaseUrl && supabaseKey;

    /**
     * logDispatch — fire-and-forget al RPC log_email_dispatch para guardar
     * la evidencia del envío (sent / failed / skipped) en email_dispatches.
     * Si Supabase no está configurado, NO bloqueamos — sólo seguimos.
     */
    const logDispatch = async (status, errorMessage = null, extraMeta = {}) => {
      if (!supabaseReady) return;
      try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/log_email_dispatch`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_clerk_user_id: clerkUserId || `email:${email}`,
            p_email: email,
            p_email_type: "ciclo_sellado",
            p_status: status,
            p_error_message: errorMessage,
            p_metadata: { indice, fecha: fechaIso, ...extraMeta },
          }),
        });
      } catch (logErr) {
        console.warn(`[CicloSellado] log_email_dispatch fail: ${logErr.message}`);
      }
    };

    // ==========================================================
    // 1. SKIP si ya tiene Sintonía Solar (o cualquier sub) activa
    // ==========================================================
    if (supabaseReady) {
      try {
        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?email=eq.${encodeURIComponent(
            email
          )}&status=eq.active&select=email&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        if (subRes.ok) {
          const subs = await subRes.json();
          if (Array.isArray(subs) && subs.length > 0) {
            console.log(
              `↷ CicloSellado SKIP — ${email} ya tiene Sintonía Solar activa`
            );
            await logDispatch("skipped", null, {
              reason: "active_subscription",
            });
            await this.http.respond({
              status: 200,
              body: { ok: true, skipped: true, reason: "active_subscription" },
            });
            return { ok: true, skipped: true };
          }
        }
      } catch (subErr) {
        console.warn(`[CicloSellado] subs check fail: ${subErr.message}`);
        /* No bloqueamos por fallar el check — preferimos enviar el correo
           que perderlo. Si el check falla, seguimos al envío normal. */
      }
    }

    // ==========================================================
    // 2. Resolver pilar más bajo (si no viene, calcularlo)
    // ==========================================================
    const PILAR_LABELS = {
      fisico: "HARDWARE · Físico",
      mental: "PROCESADOR · Mental",
      emocional: "MOTOR · Emocional",
      financiero: "GRAVEDAD · Financiera",
      vector: "VECTOR · De Expansión",
      orbita: "ÓRBITA · Relacional",
    };

    let pilarMasBajo = body.pilar_mas_bajo || null;
    if (!pilarMasBajo || !pilarMasBajo.id) {
      let minKey = null;
      let minVal = Infinity;
      for (const k of Object.keys(PILAR_LABELS)) {
        const v = Number(scores[k] ?? NaN);
        if (!isNaN(v) && v < minVal) {
          minVal = v;
          minKey = k;
        }
      }
      if (minKey) {
        pilarMasBajo = {
          id: minKey,
          label: PILAR_LABELS[minKey],
          score: minVal,
        };
      }
    }

    // ==========================================================
    // 3. Visuales del email
    // ==========================================================
    const logoUrl =
      "https://drive.google.com/uc?export=view&id=1t4glJMPN7JmkDKl9v0hDmhH1gavbMycD";
    const spaceBgUrl =
      "https://www.transparenttextures.com/patterns/stardust.png";
    const sintoniaSolarLink =
      "https://buy.stripe.com/bJe9AMe1DcVc9cRdPC0RG0C";

    const nombre =
      fullName || email.split("@")[0].replace(/[._-]/g, " ") || "Tripulante";
    const primerNombre = nombre.split(" ")[0];

    // Barras de los 6 pilares
    const pilarRows = Object.keys(PILAR_LABELS)
      .map((k) => {
        const v = Math.max(0, Math.min(100, Math.round(Number(scores[k] ?? 0))));
        const color = v < 50 ? "#FF4060" : v < 75 ? "#D4A843" : "#00E5FF";
        return `
          <tr>
            <td style="padding: 7px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 10px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase; padding-bottom: 4px;">
                    ${PILAR_LABELS[k]}
                  </td>
                  <td align="right" style="font-size: 13px; color: ${color}; font-weight: 600; padding-bottom: 4px;">
                    ${v}%
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="background: rgba(255,255,255,0.06); border-radius: 3px; height: 6px; line-height: 6px; font-size: 1px;">
                    <div style="background: ${color}; width: ${v}%; height: 6px; border-radius: 3px;">&nbsp;</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join("");

    const indiceColor =
      indice < 50 ? "#FF4060" : indice < 75 ? "#D4A843" : "#00E5FF";

    const pilarMasBajoBlock = pilarMasBajo
      ? `
        <tr>
          <td style="padding: 20px 0 0 0;">
            <div style="background: rgba(255,64,96,0.06); border: 1px solid rgba(255,64,96,0.25); border-radius: 10px; padding: 18px 20px;">
              <div style="font-size: 10px; letter-spacing: 3px; color: #FF4060; text-transform: uppercase; margin-bottom: 6px;">
                ◈ Pilar con mayor fricción
              </div>
              <div style="font-size: 15px; color: #F8FAFC; font-weight: 500; margin-bottom: 8px;">
                ${pilarMasBajo.label} — ${pilarMasBajo.score}%
              </div>
              <div style="font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                Este es el punto del campo con mayor entropía hoy. Ahí es donde las Calibraciones tienen el mayor efecto transmutativo — cada semana que avanzas con tu Sintonía Solar activa se te asignan nuevas rutas para afinar ese pilar.
              </div>
            </div>
          </td>
        </tr>`
      : "";

    // ==========================================================
    // 4. Template del email
    // ==========================================================
    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <title>Ciclo Sellado — Red Solar Viva</title>
</head>
<body bgcolor="#050505" style="margin:0;padding:0;background-color:#050505;">
  <div style="background-color:#050505;width:100%;">
    <table width="100%" bgcolor="#050505" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#050505;">
      <tr>
        <td bgcolor="#050505" align="center" style="background-color:#050505;background-image:url('${spaceBgUrl}');background-repeat:repeat;padding:40px 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#E0E0E0;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">
            <tbody>

              <!-- HEADER -->
              <tr>
                <td align="center" style="padding:0 0 20px 0;">
                  <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:6px;color:#94A3B8;text-transform:uppercase;">RED SOLAR VIVA</p>
                  <img src="${logoUrl}" alt="Red Solar Viva" style="width:164px;max-width:100%;height:auto;">
                  <div style="margin-top:22px;">
                    <span style="display:inline-block;font-size:11px;letter-spacing:2px;color:#00E5FF;text-shadow:0 0 12px rgba(0,240,255,0.3);white-space:nowrap;">◈ CICLO SELLADO ◈</span>
                  </div>
                  <p style="margin:8px 0 0 0;font-size:11px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">Los 6 pilares quedaron diagnosticados</p>
                </td>
              </tr>

              <tr><td align="center" style="padding:0 0 25px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.3),transparent);width:80%;"></div></td></tr>

              <!-- GREETING -->
              <tr>
                <td style="padding:0 10px;font-size:16px;line-height:1.8;color:#CCCCCC;" align="left">
                  <p style="margin:0 0 20px 0;font-size:18px;color:#F8FAFC;">
                    Tripulante <strong style="color:#FFD700;">${primerNombre}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;">
                    Completaste tu primer ciclo de calibración. Los 6 pilares de tu Avatar recibieron diagnóstico — el campo está leído, los desplazamientos del Índice de Silicio quedaron mapeados.
                  </p>
                </td>
              </tr>

              <!-- ÍNDICE DE SILICIO GRANDE -->
              <tr>
                <td align="center" style="padding:10px 10px 25px 10px;">
                  <div style="font-size:10px;letter-spacing:4px;color:#94A3B8;text-transform:uppercase;margin-bottom:10px;">Índice de Silicio</div>
                  <div style="font-size:56px;font-weight:300;color:${indiceColor};letter-spacing:-2px;line-height:1;">
                    ${indice}<span style="font-size:24px;opacity:0.6;">%</span>
                  </div>
                </td>
              </tr>

              <!-- BARRAS POR PILAR -->
              <tr>
                <td style="padding:0 10px 20px 10px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${pilarRows}
                  </table>
                </td>
              </tr>

              ${pilarMasBajoBlock}

              <!-- CTA -->
              <tr>
                <td align="center" style="padding:35px 10px 10px 10px;">
                  <div style="font-size:13px;line-height:1.7;color:#CCCCCC;margin-bottom:22px;">
                    Para recalibrar semana a semana y ver cómo se mueve tu campo, activa tu <strong style="color:#FFD700;">Sintonía Solar</strong>. Obtienes escaneos ilimitados (escaneos semanales), biblioteca completa de Calibraciones, Decodificador de Materia sin tope y las siguientes capas que se integren.
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 0 30px 0;">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr>
                        <td align="center" style="border-radius:8px;background:linear-gradient(90deg,#D4AF37,#F3E5AB);">
                          <a href="${sintoniaSolarLink}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:1px;color:#000000;text-decoration:none;text-transform:uppercase;border-radius:8px;">
                            ACTIVAR SINTONÍA SOLAR · 777 MXN
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="margin:14px 0 0 0;font-size:11px;color:#546e7a;letter-spacing:2px;">
                    Recurrente mensual · cancela cuando quieras
                  </p>
                </td>
              </tr>

              <tr><td align="center" style="padding:0 0 20px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.3),transparent);width:80%;"></div></td></tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="padding:0 0 10px 0;">
                  <p style="margin:0;font-size:12px;color:#546e7a;letter-spacing:4px;">NOS VEMOS EN LA RED ◈</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 0 10px 0;font-size:11px;color:#37474f;">
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

    // ==========================================================
    // 5. Enviar vía ProtonMail SMTP
    // ==========================================================
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

    try {
      await transporter.sendMail({
        from: process.env.PROTON_SMTP_USER,
        to: email,
        subject: `◈ Ciclo Sellado · Índice de Silicio ${indice}%`,
        html: htmlBody,
      });
      console.log(`✅ CicloSellado enviado a ${email} (indice ${indice}%)`);
      await logDispatch("sent");
      await this.http.respond({
        status: 200,
        body: { ok: true, email, indice, fecha: fechaIso },
      });
      return { ok: true, email, indice };
    } catch (err) {
      console.error(`❌ Error enviando CicloSellado a ${email}: ${err.message}`);
      await logDispatch("failed", err.message);
      await this.http.respond({
        status: 500,
        body: { ok: false, error: err.message },
      });
      return { ok: false, error: err.message };
    }
  },
});
