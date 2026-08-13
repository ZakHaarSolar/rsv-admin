import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * Red Solar Viva · CicloSellado
 * =============================
 * Trigger: HTTP webhook (dispara el Escáner Vibracional cuando un tripulante
 * cierra su primer ciclo 6/6 — de 0 a 1 en complete_cycles).
 *
 * Propósito: entregar el Sello del Primer Ciclo. Confirma la integración,
 * resume los 6 puntajes, destaca el pilar más bajo y abre la puerta a
 * Sintonía Solar.
 *
 * v5 (2026-07-21) — REDISEÑO HOLOGRÁFICO + CTA QUE ABRE LA APP
 *  · Estética nueva: oscuro premium (fondo #04070D con "candado" de
 *    gradiente — Gmail no invierte fondos declarados como gradiente, así el
 *    correo se queda oscuro también ahí), sello tipográfico ✦, hairlines
 *    cyan, tarjetas de cristal, barras por pilar con su color de nivel.
 *    Fuera: el logo hosteado en Google Drive (hotlink poco confiable) y la
 *    textura de estrellas externa. Cero em dashes en todo el copy.
 *  · Copy actualizado al producto de HOY: pilares con el lenguaje
 *    experiencial (CUERPO/MENTE/EMOCIONES/ABUNDANCIA/PROPÓSITO/VÍNCULOS),
 *    fuera las "Calibraciones" (capa retirada), y Sintonía Solar se
 *    PRESENTA (es la membresía del Escáner; el lector aún no la conoce).
 *  · CTA → https://escaner.redsolarviva.com/activar (página puente):
 *    con la app instalada el Universal Link / esquema nativo la ABRE
 *    DIRECTO (aterriza en el selector de planes desde el build 1.1.2);
 *    sin app instalada, respaldo al App Store. La compra sigue ocurriendo
 *    DENTRO de la app (StoreKit, regla 3.1.1 de Apple) y el correo no
 *    hardcodea precios (los muestra el paywall).
 *  · Footer sin enlace a redsolarviva.com: "Escáner Vibracional · creado
 *    por Red Solar Viva" en texto plano. Los bloques de suscripción/baja
 *    (HMAC) se conservan intactos.
 *
 * v4 (2026-04-27)
 *  · Footer condicional según in_nodo (RPC is_email_in_nodo):
 *    - in_nodo=true  → bloque "Ajustar Frecuencia de Señales" (baja
 *      transaccional para suscritos del Nodo Central).
 *    - in_nodo=false → bloque "[Fin de Transmisión Operativa]" con
 *      CTA "Encender Receptor" → workflow SubscribeEmail.js (1-click
 *      subscribe firmado HMAC). Es el último envío automatizado del
 *      ciclo para no-suscritos.
 *  · Reusa el HMAC secret EMAIL_UNSUBSCRIBE_SECRET para los dos links
 *    (subscribe y unsubscribe) porque ambos son operaciones simétricas
 *    reversibles. Env var: SUBSCRIBE_WEBHOOK_URL.
 *
 * v3 (2026-04-27) · Pre-flight de opt-out (is_email_opted_out) + link de
 *    baja firmado HMAC. | v2 (2026-04-27) · Skip si ya tiene membresía
 *    activa + log a Supabase (log_email_dispatch) en cada terminación.
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
 *   UNSUBSCRIBE_WEBHOOK_URL  — URL del workflow UnsubscribeEmail.js
 *   EMAIL_UNSUBSCRIBE_SECRET — secret HMAC compartido con UnsubscribeEmail.js
 *   SUBSCRIBE_WEBHOOK_URL    — URL del workflow SubscribeEmail.js
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

    /* AUDITORÍA PARTE 3 (2026-07-27) · CÓMO RESPONDE ESTE WORKFLOW.
       El trigger HTTP vive como PASO SEPARADO, no como prop de este componente,
       así que `this.http.respond()` no registra la respuesta: Pipedream termina
       el workflow sin encontrar ninguna y devuelve "Error in workflow" (400) a
       TODO, incluso a los envíos legítimos. La API correcta en este caso es
       `$.respond()`. Este helper usa la que exista, en ese orden, y si ninguna
       está disponible no rompe: el workflow sigue su curso igual (que es lo que
       pasaba antes, cuando el trigger estaba en "Return HTTP 200 OK" y estos
       respond fallaban en silencio).
       ⚠️ Requiere que el trigger esté en "Return a custom response from your
       workflow"; con cualquier otra opción, Pipedream ignora la respuesta. */
    const responder = async (status, payload) => {
      try {
        if (typeof $?.respond === "function") {
          await $.respond({ status, body: payload });
          return;
        }
        if (typeof this.http?.respond === "function") {
          await this.http.respond({ status, body: payload });
        }
      } catch (e) {
        console.warn(`[CicloSellado] no se pudo responder ${status}:`, e?.message || e);
      }
    };

    const clerkUserId = (body.clerk_user_id || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      await responder(400, { error: "missing email" });
      return { ok: false, reason: "missing email" };
    }

    /* ── AUDITORÍA PARTE 3 (2026-07-27) · FIRMA OBLIGATORIA ──────────────
       Este endpoint era HTTP abierto y su dirección viaja incrustada en el
       paquete de la app (se saca abriendo el bundle o mirando la red). Sin
       firma, cualquiera mandaba un correo con la marca Red Solar Viva a la
       dirección que quisiera, con el nombre, el Índice y los puntajes que
       quisiera. Ahora solo despacha la edge function `dispatch-ciclo-sellado`,
       que verifica la sesión de Clerk y resuelve correo y nombre contra la
       base antes de firmar.
       La firma viene DENTRO del cuerpo (no en un header) para no tener que
       pasar el trigger a modo "Raw Request". Cubre tres campos y caduca a los
       diez minutos, así una captura no sirve para siempre.
       Requiere la variable RSV_DISPATCH_SECRET, la misma que el secreto
       del mismo nombre en Supabase. */
    {
      const crypto = await import("crypto");
      const secret = process.env.RSV_DISPATCH_SECRET || "";
      const sig = (body._sig || "").trim();
      const ts = Number(body.ts || 0);
      const fresco = Number.isFinite(ts) && Math.abs(Date.now() - ts) < 10 * 60 * 1000;
      /* Transitorio a propósito: mientras RSV_DISPATCH_SECRET no esté
         configurada, el workflow sigue aceptando lo de siempre. Así se puede
         publicar este código sin cortar el correo. El candado se activa solo,
         en el momento en que cargues la variable, y ese es el paso final. */
      let valido = !secret;
      if (secret && sig && fresco) {
        try {
          const esperado = crypto
            .createHmac("sha256", secret)
            .update(`${clerkUserId}|${email}|${ts}`)
            .digest("hex");
          valido =
            esperado.length === sig.length &&
            crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(sig));
        } catch {
          valido = false;
        }
      }
      if (!valido) {
        console.warn(
          `[CicloSellado] firma invalida o vencida · email="${email}" sigLen=${sig.length} fresco=${fresco} secretSet=${!!secret}`
        );
        await responder(401, { error: "unauthorized" });
        return { ok: false, reason: "bad_signature" };
      }
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
            await responder(200, { ok: true, skipped: true, reason: "active_subscription" });
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
    // 1.5. SKIP si tiene opt-out activo (RPC is_email_opted_out)
    // ==========================================================
    if (supabaseReady) {
      try {
        const optRes = await fetch(`${supabaseUrl}/rest/v1/rpc/is_email_opted_out`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_email: email, p_category: "all" }),
        });
        if (optRes.ok) {
          const optedOut = await optRes.json();
          if (optedOut === true) {
            console.log(`↷ CicloSellado SKIP — ${email} tiene opt-out activo`);
            await logDispatch("skipped", null, { reason: "opted_out" });
            await responder(200, { ok: true, skipped: true, reason: "opted_out" });
            return { ok: true, skipped: true };
          }
        }
      } catch (optErr) {
        console.warn(`[CicloSellado] opt-out check fail: ${optErr.message}`);
        /* Si el check falla, preferimos enviar — ya respetamos la baja
           cuando podemos verificarla. No bloqueamos por fallo de red. */
      }
    }

    // ==========================================================
    // 1.6. ¿Está en el Nodo Central? Decide qué footer renderizar:
    //   in_nodo=true  → Ajustar Frecuencia de Señales (baja).
    //   in_nodo=false → [FIN DE TRANSMISIÓN OPERATIVA] + Encender Receptor.
    // ==========================================================
    let isInNodo = false;
    if (supabaseReady) {
      try {
        const inRes = await fetch(`${supabaseUrl}/rest/v1/rpc/is_email_in_nodo`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_email: email }),
        });
        if (inRes.ok) {
          const data = await inRes.json();
          if (data === true) isInNodo = true;
        }
      } catch (e) {
        console.warn(`[CicloSellado] in_nodo check fail: ${e.message}`);
      }
    }

    // ==========================================================
    // 2. Resolver pilar más bajo (si no viene, calcularlo)
    // ==========================================================
    // Lenguaje experiencial (2026-07-13): los 6 pilares como se viven.
    const PILAR_LABELS = {
      fisico: "CUERPO",
      mental: "MENTE",
      emocional: "EMOCIONES",
      financiero: "ABUNDANCIA",
      vector: "PROPÓSITO",
      orbita: "VÍNCULOS",
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
    /* El label puede venir del payload con el formato viejo ("CUERPO ·
       Físico"): lo re-resolvemos por id para hablar el lenguaje actual. */
    if (pilarMasBajo && pilarMasBajo.id && PILAR_LABELS[pilarMasBajo.id]) {
      pilarMasBajo.label = PILAR_LABELS[pilarMasBajo.id];
    }

    // ==========================================================
    // 3. Visuales del email
    // ==========================================================
    /* CTA → página puente /activar: con la app instalada, el Universal
       Link la ABRE DIRECTO (y desde el build 1.1.2 aterriza en el selector
       de planes); sin app, la página ofrece la descarga en el App Store.
       La activación ocurre DENTRO de la app (StoreKit, Apple 3.1.1) y el
       correo no hardcodea precios (los muestra el paywall). */
    const sintoniaSolarLink = "https://escaner.redsolarviva.com/activar";

    /* Paleta holográfica. El "candado de gradiente" (background-image:
       linear-gradient del MISMO color) evita que Gmail invierta el fondo
       oscuro a blanco — la causa del render lavado e ilegible anterior. */
    const BG = "#04070D";
    const CARD = "#0A1322";
    const INK = "#E8EEF5";
    const INK_SOFT = "#9FB2C4";
    const MUTED = "#5E7186";
    const CYAN = "#00E5FF";
    const GOLD = "#D4A843";

    const lock = (hex) =>
      `background-color:${hex};background-image:linear-gradient(${hex},${hex});`;

    /* Links firmados HMAC. Token = HMAC_SHA256(email, secret) base64url.
       El mismo secret se reusa para subscribe y unsubscribe — un atacante
       con el secret podría manipular ambas operaciones, las dos
       reversibles. Caemos a mailto fallback si las env vars faltan. */
    const unsubscribeBase = (process.env.UNSUBSCRIBE_WEBHOOK_URL || "").replace(/\/+$/, "");
    const subscribeBase = (process.env.SUBSCRIBE_WEBHOOK_URL || "").replace(/\/+$/, "");
    const hmacSecret = process.env.EMAIL_UNSUBSCRIBE_SECRET || "";
    const sign = (e) => {
      try {
        return crypto.createHmac("sha256", hmacSecret).update(e).digest("base64url");
      } catch (er) {
        console.warn(`[CicloSellado] HMAC fail: ${er.message}`);
        return "";
      }
    };
    const token = hmacSecret ? sign(email) : "";
    const unsubscribeLink =
      unsubscribeBase && token
        ? `${unsubscribeBase}?email=${encodeURIComponent(email)}&t=${token}&from=ciclo_sellado`
        : `mailto:redsolarviva@protonmail.com?subject=Baja%20${encodeURIComponent(email)}`;
    const subscribeLink =
      subscribeBase && token
        ? `${subscribeBase}?email=${encodeURIComponent(email)}&t=${token}&from=ciclo_sellado`
        : sintoniaSolarLink;

    const nombre =
      fullName || email.split("@")[0].replace(/[._-]/g, " ") || "Tripulante";
    const primerNombre = nombre.split(" ")[0];

    // Barras de los 6 pilares (color por nivel de frecuencia)
    const pilarRows = Object.keys(PILAR_LABELS)
      .map((k) => {
        const v = Math.max(0, Math.min(100, Math.round(Number(scores[k] ?? 0))));
        const color = v < 50 ? "#FF4D6A" : v < 75 ? GOLD : CYAN;
        return `
          <tr>
            <td style="padding: 8px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="font-size: 11px; letter-spacing: 3px; color: ${INK_SOFT}; font-weight: 600; padding-bottom: 5px;">
                    ${PILAR_LABELS[k]}
                  </td>
                  <td align="right" style="font-size: 13px; color: ${color}; font-weight: 700; padding-bottom: 5px;">
                    ${v}%
                  </td>
                </tr>
                <tr>
                  <td colspan="2" bgcolor="#16202F" style="${lock("#16202F")}border-radius: 3px; height: 6px; line-height: 6px; font-size: 1px;">
                    <div style="${lock(color)}width: ${v}%; height: 6px; border-radius: 3px; font-size:1px; line-height:6px;">&nbsp;</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join("");

    const indiceColor =
      indice < 50 ? "#FF4D6A" : indice < 75 ? GOLD : CYAN;

    const pilarMasBajoBlock = pilarMasBajo
      ? `
        <tr>
          <td style="padding: 24px 0 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td bgcolor="${CARD}" style="${lock(CARD)}border: 1px solid rgba(255,77,106,0.35); border-radius: 14px; padding: 20px 22px;">
                  <div style="font-size: 10px; letter-spacing: 3px; color: #FF4D6A; text-transform: uppercase; margin-bottom: 8px;">
                    ◈ Punto de mayor fricción
                  </div>
                  <div style="font-size: 16px; color: ${INK}; font-weight: 600; letter-spacing: 1px; margin-bottom: 10px;">
                    ${pilarMasBajo.label} · ${pilarMasBajo.score}%
                  </div>
                  <div style="font-size: 13.5px; color: ${INK_SOFT}; line-height: 1.7;">
                    Aquí es donde tu campo pierde más energía hoy. No es una falla: es el punto exacto donde vive tu siguiente expansión. Cada escaneo semanal te muestra cómo se mueve, y las capas del Escáner te acompañan a moverlo.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

    const beneficio = (titulo, texto) => `
      <tr>
        <td style="padding: 7px 0; font-size: 13.5px; line-height: 1.65; color: ${INK_SOFT};">
          <span style="color: ${CYAN};">✦</span>&nbsp;&nbsp;<strong style="color: ${INK}; font-weight: 600;">${titulo}.</strong> ${texto}
        </td>
      </tr>`;

    // ==========================================================
    // 4. Template del email (holográfico, oscuro, sin imágenes externas)
    // ==========================================================
    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Ciclo Sellado · Escáner Vibracional</title>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;${lock(BG)}">
  <!-- preheader oculto -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Tu primer ciclo quedó sellado · Índice de Luz ${indice}%</div>
  <table width="100%" bgcolor="${BG}" cellpadding="0" cellspacing="0" border="0" role="presentation" style="${lock(BG)}">
    <tr>
      <td align="center" bgcolor="${BG}" style="${lock(BG)}padding:44px 18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${INK};">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">
          <tbody>

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding:0 0 8px 0;">
                <p style="margin:0 0 26px 0;font-size:11px;letter-spacing:7px;color:${INK_SOFT};text-transform:uppercase;">Esc&aacute;ner Vibracional</p>
                <!-- sello tipográfico -->
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
                  <tr>
                    <td align="center" style="width:74px;height:74px;border:1px solid rgba(0,229,255,0.4);border-radius:50%;font-size:26px;color:${CYAN};line-height:74px;">✦</td>
                  </tr>
                </table>
                <div style="margin-top:26px;">
                  <span style="display:inline-block;font-size:13px;letter-spacing:5px;color:${GOLD};font-weight:600;white-space:nowrap;">◈&nbsp;&nbsp;CICLO SELLADO&nbsp;&nbsp;◈</span>
                </div>
                <p style="margin:12px 0 0 0;font-size:11px;letter-spacing:2.5px;color:${INK_SOFT};text-transform:uppercase;">Los 6 pilares de tu campo quedaron medidos</p>
              </td>
            </tr>

            <tr><td align="center" style="padding:24px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.35),transparent);width:82%;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>

            <!-- GREETING -->
            <tr>
              <td style="padding:0 8px;font-size:15px;line-height:1.8;color:${INK_SOFT};" align="left">
                <p style="margin:0 0 18px 0;font-size:18px;color:${INK};">
                  Tripulante <strong style="color:${GOLD};">${primerNombre}</strong>,
                </p>
                <p style="margin:0 0 6px 0;">
                  Completaste tu primer ciclo de escaneo. Tu campo quedó leído de punta a punta: seis corrientes medidas, una fotografía completa de tu frecuencia en este momento.
                </p>
              </td>
            </tr>

            <!-- ÍNDICE DE LUZ GRANDE -->
            <tr>
              <td align="center" style="padding:26px 8px 28px 8px;">
                <div style="font-size:10px;letter-spacing:5px;color:${INK_SOFT};text-transform:uppercase;margin-bottom:12px;">&Iacute;ndice de Luz</div>
                <div style="font-size:62px;font-weight:200;color:${indiceColor};letter-spacing:-2px;line-height:1;">
                  ${indice}<span style="font-size:26px;opacity:0.6;">%</span>
                </div>
              </td>
            </tr>

            <!-- BARRAS POR PILAR -->
            <tr>
              <td style="padding:0 8px 4px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  ${pilarRows}
                </table>
              </td>
            </tr>

            ${pilarMasBajoBlock}

            <!-- SINTONÍA SOLAR -->
            <tr>
              <td style="padding:34px 0 0 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td bgcolor="${CARD}" style="${lock(CARD)}border: 1px solid rgba(212,168,67,0.35); border-radius: 14px; padding: 24px 22px;">
                      <div style="font-size: 10px; letter-spacing: 4px; color: ${GOLD}; text-transform: uppercase; margin-bottom: 6px;">
                        ✦ Sinton&iacute;a Solar
                      </div>
                      <div style="font-size: 17px; color: ${INK}; font-weight: 600; margin-bottom: 10px;">
                        La membres&iacute;a del Esc&aacute;ner
                      </div>
                      <div style="font-size: 13.5px; color: ${INK_SOFT}; line-height: 1.7; margin-bottom: 14px;">
                        Tu primer ciclo fue la puerta. Con Sinton&iacute;a Solar el instrumento completo queda abierto:
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                        ${beneficio("Escaneos semanales", "mide tus 6 corrientes cada semana y mira tu &Iacute;ndice de Luz moverse.")}
                        ${beneficio("Decodificador de Alimentos sin l&iacute;mite", "escanea lo que comes y mira su frecuencia antes de que entre a tu cuerpo.")}
                        ${beneficio("Decodificador de Sue&ntilde;os", "tus sue&ntilde;os, decodificados en lenguaje claro.")}
                        ${beneficio("El Espejo", "una presencia que conversa contigo desde tu vibraci&oacute;n m&aacute;s alta.")}
                        ${beneficio("Todas las capas del instrumento", "Bit&aacute;cora, Plan de Vuelo, Rachas, Realidad Elegida y las que siguen integr&aacute;ndose.")}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:30px 0 8px 0;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tbody>
                    <tr>
                      <td align="center" style="border-radius:12px;background:linear-gradient(90deg,#D4AF37,#F3E5AB);">
                        <a href="${sintoniaSolarLink}" target="_blank" style="display:inline-block;padding:17px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#050505;text-decoration:none;text-transform:uppercase;border-radius:12px;">
                          ABRIR EL ESC&Aacute;NER
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style="margin:16px 0 0 0;font-size:11px;color:${MUTED};letter-spacing:1.5px;line-height:1.8;">
                  Si tienes la app, se abre directo &middot; la activaci&oacute;n se hace adentro &middot; cancela cuando quieras
                </p>
              </td>
            </tr>

            <tr><td align="center" style="padding:26px 0 22px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.35),transparent);width:82%;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding:0 0 10px 0;">
                <p style="margin:0;font-size:12px;color:${MUTED};letter-spacing:4px;">NOS VEMOS EN LA RED ◈</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 0 12px 0;font-size:11px;color:#42536A;letter-spacing:1px;">
                Esc&aacute;ner Vibracional &middot; creado por Red Solar Viva
              </td>
            </tr>
            ${isInNodo ? `
            <!-- Footer · suscrito al Nodo · opción de baja -->
            <tr>
              <td align="center" style="padding:8px 18px 0 18px;font-size:10px;color:${MUTED};line-height:1.7;letter-spacing:0.04em;">
                <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:2px;color:#42536A;text-transform:uppercase;">Ajuste de Se&ntilde;al</p>
                <p style="margin:0 0 6px 0;">
                  Recibes este pulso porque tu Nodo opera activamente dentro del Esc&aacute;ner Vibracional y formas parte de las transmisiones de Red Solar Viva.
                </p>
                <p style="margin:0;">
                  Si deseas bloquear los reportes y alertas, puedes <a href="${unsubscribeLink}" style="color:${MUTED};text-decoration:underline;">Ajustar Frecuencia de Se&ntilde;ales aqu&iacute;</a>.
                </p>
              </td>
            </tr>` : `
            <!-- Footer · NO suscrito · cierre operativo + 1-click subscribe -->
            <tr>
              <td align="center" style="padding:14px 18px 0 18px;font-size:10px;color:${MUTED};line-height:1.7;letter-spacing:0.04em;">
                <p style="margin:0 0 10px 0;font-size:10px;letter-spacing:3px;color:#42536A;text-transform:uppercase;">[ Fin de Transmisi&oacute;n Operativa ]</p>
                <p style="margin:0 0 10px 0;">
                  Este es el &uacute;ltimo pulso automatizado de tu primer ciclo. La nave entra en silencio de radio.
                </p>
                <p style="margin:0 0 14px 0;">
                  Si resuena contigo recibir las nuevas capas, las transmisiones y los pulsos directos del Esc&aacute;ner Vibracional, puedes encender tu recepci&oacute;n aqu&iacute;:
                </p>
                <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation"><tbody><tr>
                  <td align="center" style="border-radius:8px;border:1px solid rgba(0,229,255,0.4);">
                    <a href="${subscribeLink}" target="_blank" style="display:inline-block;padding:11px 24px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;color:${CYAN};text-decoration:none;text-transform:uppercase;">
                      Encender Receptor
                    </a>
                  </td>
                </tr></tbody></table>
              </td>
            </tr>`}

          </tbody>
        </table>
      </td>
    </tr>
  </table>
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
        subject: `◈ Ciclo Sellado · Índice de Luz ${indice}%`,
        html: htmlBody,
      });
      console.log(`✅ CicloSellado enviado a ${email} (indice ${indice}%)`);
      await logDispatch("sent");
      await responder(200, { ok: true, email, indice, fecha: fechaIso });
      return { ok: true, email, indice };
    } catch (err) {
      console.error(`❌ Error enviando CicloSellado a ${email}: ${err.message}`);
      await logDispatch("failed", err.message);
      await responder(500, { ok: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },
});
