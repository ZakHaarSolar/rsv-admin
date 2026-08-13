import crypto from "crypto";

/**
 * Red Solar Viva · RSV_Padron v2
 * ==============================
 * v2 (2026-08-10) — 🜂 EL ALTA DEL FORMULARIO AHORA SALUDA: tras registrar un
 * correo nuevo por la puerta ③, dispara la carta de bienvenida de Red Solar
 * Viva (BienvenidaNodo v5, rama `tipo:"rsv_bienvenida"`, firmada con
 * RSV_DISPATCH_SECRET). Env var NUEVA del workspace:
 *   BIENVENIDA_WEBHOOK_URL = la URL del trigger HTTP de BienvenidaNodo.
 * Fail-open: sin la var o con el viaje caído, el alta queda igual y solo se
 * pierde el correo (rastro en el log). Las puertas firmadas no saludan.
 *
 * v1 — FUSIÓN de tres workflows en uno: GuardarMensajes + SubscribeEmail +
 * UnsubscribeEmail. Todo lo que TOCA el padrón de correos vive acá.
 *
 * 🜂 POR QUÉ (2026-08-10): el plan gratis de Pipedream da 3 workflows y había
 *    10. Con la Cámara Solar y las sesiones 1:1 apagadas, y las compras
 *    escribiendo directo a la base, sobrevivieron 5. Estos 3 hacían lo mismo
 *    —leer o escribir en `nodo_central` / `email_opt_outs`— y comparten el
 *    MISMO secreto HMAC y la MISMA landing. Fusionarlos deja los otros dos
 *    (BienvenidaNodo y CicloSellado) intactos, que es donde vive el HTML de
 *    los correos y donde un error se nota de verdad.
 *
 * ── TRIGGER ────────────────────────────────────────────────────────────────
 * HTTP webhook con "Return a custom response from your workflow" ACTIVADO
 * (igual que los dos que reemplaza). Sin eso, las landings no se pintan.
 *
 * ── LAS TRES PUERTAS (se distinguen por el PATH de la URL) ─────────────────
 * Pipedream entrega cualquier ruta al mismo workflow y la deja en
 * `steps.trigger.event.path`. Eso permite tres entradas sin tres workflows:
 *
 *   ①  …/alta?email=X&t=<hmac>&from=<origen>     GET   → alta + landing
 *   ②  …/baja?email=X&t=<hmac>                   GET   → baja + landing
 *   ③  …/form                                    POST  → formulario público
 *
 * Y desde las landings, dos botones de arrepentimiento (POST con token):
 *   { action: "revoke",  email, t }   → da de baja al que acaba de darse alta
 *   { action: "restore", email, t }   → devuelve al que acaba de darse baja
 *
 * Respaldo: si el path no llega (proxy raro, llamada manual), se decide por
 * la forma del pedido — un GET con token es alta salvo que traiga `baja=1`;
 * un POST con `email` y sin token es el formulario.
 *
 * ── QUÉ HAY QUE CAMBIAR AL DESPLEGARLO ─────────────────────────────────────
 * En las VARIABLES DE ENTORNO de Pipedream (workspace, no del workflow):
 *   SUBSCRIBE_WEBHOOK_URL   = https://<nueva>.m.pipedream.net/alta
 *   UNSUBSCRIBE_WEBHOOK_URL = https://<nueva>.m.pipedream.net/baja
 * Esas dos las leen BienvenidaNodo y CicloSellado para armar los enlaces del
 * pie de cada correo. NO hay que tocar el código de esos workflows.
 *
 * En Framer (property control de Domo.tsx, panel derecho):
 *   webhookUrl            = https://<nueva>.m.pipedream.net/form
 *   afinacionesWebhookUrl = https://<nueva>.m.pipedream.net/form
 *
 * ── ENV VARS QUE NECESITA ──────────────────────────────────────────────────
 *   EMAIL_UNSUBSCRIBE_SECRET   (el MISMO de siempre — si cambia, todos los
 *                               enlaces ya enviados dejan de validar)
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *
 * ── LO QUE SE ARREGLA DE PASO ──────────────────────────────────────────────
 * El formulario de AFINACIONES de redsolarviva.com manda `{mensaje, source}`
 * SIN email, y GuardarMensajes lo rechazaba con 400 → la persona veía "error"
 * aunque su mensaje estuviera bien escrito. Acá se acepta, se registra en el
 * log y se responde 200. ⚠️ Ese mensaje vive SOLO en el log de Pipedream (7
 * días en el plan gratis): si esos mensajes importan, hay que darles tabla.
 */
export default defineComponent({
  async run({ steps, $ }) {
    /* ═══════════════════════════════════════════════════════════════════════
       LANDING COMPARTIDA
       Los dos workflows originales tenían esta misma página duplicada, cada
       uno con su botón de arrepentimiento. Acá es una sola, y el botón lo
       decide el modo: quien acaba de darse alta ve "darme de baja", y quien
       acaba de darse de baja ve "quiero seguir recibiendo".
       ═══════════════════════════════════════════════════════════════════════ */
    const renderLanding = ({ title, headline, body: bodyText, mode, email, token }) => {
      const accent =
        mode === "ok-in" ? "#00E5FF" :
        mode === "ok-out" ? "#FF5364" :
                            "#94A3B8";

      /* ok-in  → está DENTRO: se le ofrece salir (POST action=revoke)
         ok-out → está FUERA:  se le ofrece volver (POST action=restore) */
      let actionBtn = "";
      if (email && token && mode === "ok-in") {
        actionBtn = `
          <form method="POST" action="" style="margin:0">
            <input type="hidden" name="action" value="revoke">
            <input type="hidden" name="email" value="${email}">
            <input type="hidden" name="t" value="${token}">
            <button type="submit" style="display:inline-block;padding:14px 30px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;color:#fff;text-transform:uppercase;background:transparent;border:1px solid rgba(255,83,100,0.5);border-radius:8px;cursor:pointer;">REVERTIR · DARME DE BAJA</button>
          </form>`;
      } else if (email && token && mode === "ok-out") {
        actionBtn = `
          <form method="POST" action="" style="margin:0">
            <input type="hidden" name="action" value="restore">
            <input type="hidden" name="email" value="${email}">
            <input type="hidden" name="t" value="${token}">
            <button type="submit" style="display:inline-block;padding:14px 30px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;color:#0a0a0a;text-transform:uppercase;background:linear-gradient(90deg,#D4AF37,#F3E5AB);border:none;border-radius:8px;cursor:pointer;">REVERTIR · QUIERO SEGUIR RECIBIENDO</button>
          </form>`;
      }

      return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark only"><title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#E0E0E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
<div style="max-width:540px;padding:48px 32px;text-align:center;">
  <p style="margin:0 0 20px 0;font-size:11px;letter-spacing:6px;color:#94A3B8;text-transform:uppercase;">RED SOLAR VIVA</p>
  <div style="margin:24px 0;font-size:11px;letter-spacing:3px;color:${accent};text-transform:uppercase;">◈ ${headline} ◈</div>
  <p style="margin:24px 0 32px 0;font-size:15px;line-height:1.7;color:#CCCCCC;">${bodyText}</p>
  ${actionBtn}
  <p style="margin:36px 0 0 0;font-size:11px;color:#37474f;letter-spacing:2px;">redsolarviva.com</p>
</div>
</body></html>`;
    };

    const responderHtml = async (status, html) => {
      try {
        await $.respond({
          status,
          headers: { "Content-Type": "text/html; charset=utf-8" },
          body: html,
          immediate: true,
        });
      } catch (e) {
        console.error(`[Padron] $.respond html fail: ${e.message}`);
      }
    };

    const responderJson = async (status, obj) => {
      try {
        await $.respond({
          status,
          headers: { "Content-Type": "application/json" },
          body: obj,
          immediate: true,
        });
      } catch (e) {
        console.error(`[Padron] $.respond json fail: ${e.message}`);
      }
    };

    try {
      /* ═══════════════════════════════════════════════════════════════════
         LECTURA DEL PEDIDO
         ═══════════════════════════════════════════════════════════════════ */
      const event = steps.trigger.event || {};
      const method = (event.method || "GET").toUpperCase();
      const query = event.query || {};
      const path = (event.path || "").toString().toLowerCase();

      /* Body defensivo: los botones de la landing llegan como formulario
         codificado (string), el formulario de la web llega como JSON. */
      let body = event.body || {};
      if (typeof body === "string" && body.length > 0) {
        try {
          const params = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of params.entries()) obj[k] = v;
          body = obj;
        } catch {
          body = {};
        }
      }

      const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || "";
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
      const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

      const callRpc = async (rpcName, payload) => {
        if (!supabaseUrl || !supabaseKey) {
          return { ok: false, error: "supabase_not_configured" };
        }
        try {
          const r = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (!r.ok) {
            const txt = await r.text();
            return { ok: false, error: `rpc_${r.status}: ${txt}` };
          }
          const data = await r.json().catch(() => null);
          return { ok: true, data };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      };

      /* ═══════════════════════════════════════════════════════════════════
         PUERTA ③ · FORMULARIO PÚBLICO (era GuardarMensajes)
         Va PRIMERO porque es la única que NO lleva token: si llega un POST
         con email y sin `action`, es el formulario de la web.
         ═══════════════════════════════════════════════════════════════════ */
      const esAccionConToken =
        method === "POST" &&
        body &&
        (body.action === "revoke" || body.action === "restore");

      /* Una ruta firmada NUNCA cae al formulario, aunque el cuerpo traiga un
         correo: si alguien llega a /alta o /baja con un POST suelto, tiene que
         chocar contra la validación del token, no colarse por la puerta
         pública. */
      const esRutaFirmada =
        path.includes("alta") || path.includes("baja") || path.includes("sub");

      const esFormulario =
        method === "POST" &&
        !esAccionConToken &&
        !esRutaFirmada &&
        (path.includes("form") || body.email || body.mensaje);

      if (esFormulario) {
        const rawEmail = (body.email || "").toString().trim().toLowerCase();
        const source = (body.source || "origen_landing").toString().slice(0, 64);
        const name = body.name ? String(body.name).slice(0, 256) : null;
        /* El modal de Afinaciones manda `mensaje`; otros forms mandan
           `message`. Se aceptan los dos nombres. */
        const mensaje = body.mensaje
          ? String(body.mensaje).slice(0, 2000)
          : body.message
            ? String(body.message).slice(0, 2000)
            : null;

        /* 🜂 EL MENSAJE SIN CORREO YA NO SE RECHAZA. El modal de Afinaciones
           manda solo `{mensaje, source, fecha}`, y el workflow viejo lo cortaba
           con 400 porque exigía email: la persona escribía su afinación y la
           pantalla le decía que había fallado. Ahora se registra y se responde
           que sí. ⚠️ Vive solo en este log (7 días en el plan gratis). */
        if (!rawEmail && mensaje) {
          console.log(
            `📝 MENSAJE SIN CORREO · source=${source} · ${new Date().toISOString()}\n${mensaje}`
          );
          await responderJson(200, { ok: true, persisted: false, reason: "solo_mensaje" });
          return { ok: true, tipo: "mensaje_suelto", source };
        }

        /* Mismo criterio de validez que la RPC (migración 20260727g): antes
           bastaba con que hubiera una arroba y pasaban "@" o "a@b". */
        const correoValido =
          rawEmail.length >= 6 &&
          rawEmail.length <= 254 &&
          /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(rawEmail);

        if (!correoValido) {
          await responderJson(400, { ok: false, error: "missing_or_invalid_email" });
          return { ok: false, reason: "invalid_email" };
        }

        if (!supabaseUrl || !supabaseKey) {
          console.warn("[Padron] Supabase no configurado — no se persiste");
          await responderJson(200, { ok: true, persisted: false, reason: "supabase_not_configured" });
          return { ok: true, persisted: false };
        }

        /* Respeta una baja previa: se responde ok igual (no se le da señal de
           que "no funcionó") pero no se le vuelve a meter en la lista. */
        const optOut = await callRpc("is_email_opted_out", {
          p_email: rawEmail,
          p_category: "all",
        });
        if (optOut.ok && optOut.data === true) {
          console.log(`↷ SKIP — ${rawEmail} tiene baja activa`);
          await responderJson(200, { ok: true, persisted: false, reason: "opted_out" });
          return { ok: true, persisted: false, reason: "opted_out" };
        }

        const metadata = {};
        if (name) metadata.name = name;
        if (mensaje) metadata.message = mensaje;
        const ua = event.headers?.["user-agent"];
        if (ua) metadata.user_agent = ua;

        const r = await callRpc("record_nodo_subscription", {
          p_email: rawEmail,
          p_source: source,
          p_metadata: Object.keys(metadata).length > 0 ? metadata : null,
        });

        if (!r.ok) {
          console.error(`❌ formulario RPC fail: ${r.error}`);
          await responderJson(500, { ok: false, error: r.error });
          return { ok: false, error: r.error };
        }

        console.log(`✅ Nodo Central · ${rawEmail} (source=${source})`);
        await responderJson(200, { ok: true, persisted: true, email: rawEmail, source });

        /* 🜂 v2 — LA BIENVENIDA DE LA CASA (Zak 2026-08-10: "me suscribí y no
           llegó ningún correo"). Un alta del FORMULARIO dispara el correo de
           bienvenida de Red Solar Viva, que vive en BienvenidaNodo (rama
           `tipo:"rsv_bienvenida"`, misma firma simple `email|ts`): acá se
           registra el alta, allá viven las cartas. Corre DESPUÉS de responder
           para no hacer esperar a la persona, y es fail-open: si falla, el
           alta ya quedó y solo se pierde el correo (con rastro en este log).
           Las puertas firmadas (① alta desde el enlace de un correo nuestro)
           NO disparan esto: quien llega por ahí ya recibió su bienvenida.
           El dedupe de 24 h vive del otro lado (is_recent_dispatch por
           email + tipo), así que un doble envío del formulario no duplica. */
        try {
          const bienvenidaUrl = (process.env.BIENVENIDA_WEBHOOK_URL || "").replace(/\/+$/, "");
          const dispatchSecret = process.env.RSV_DISPATCH_SECRET || "";
          if (bienvenidaUrl && dispatchSecret) {
            const ts = Date.now();
            const sig = crypto
              .createHmac("sha256", dispatchSecret)
              .update(`${rawEmail}|${ts}`)
              .digest("hex");
            const rb = await fetch(bienvenidaUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tipo: "rsv_bienvenida",
                email: rawEmail,
                full_name: name || "",
                ts,
                _sig: sig,
              }),
            });
            console.log(`📨 bienvenida RSV disparada → ${rb.status}`);
          } else {
            console.log(
              "↷ bienvenida RSV omitida: falta BIENVENIDA_WEBHOOK_URL o RSV_DISPATCH_SECRET en las env vars"
            );
          }
        } catch (e) {
          console.warn(`[Padron] bienvenida RSV fail: ${e.message}`);
        }
        return { ok: true, persisted: true, email: rawEmail };
      }

      /* ═══════════════════════════════════════════════════════════════════
         PUERTAS ① y ② · ENLACES FIRMADOS DE LOS CORREOS
         De acá para abajo TODO exige token HMAC válido.
         ═══════════════════════════════════════════════════════════════════ */
      if (!secret) {
        console.error("[Padron] EMAIL_UNSUBSCRIBE_SECRET no está configurado");
        await responderHtml(500, renderLanding({
          title: "Configuración faltante — Red Solar Viva",
          headline: "ERROR DE CONFIGURACIÓN",
          body: "El secreto de validación no está configurado. Escríbenos a <strong style='color:#fff;'>redsolarviva@protonmail.com</strong> y lo resolvemos a mano.",
          mode: "error",
        }));
        return { ok: false, fatal: "missing_secret" };
      }

      let rawEmail = ((esAccionConToken ? body.email : query.email) || "").toString().trim();
      try {
        rawEmail = decodeURIComponent(rawEmail);
      } catch {}
      rawEmail = rawEmail.toLowerCase();

      const rawToken = ((esAccionConToken ? body.t : query.t) || "").toString().trim();

      const verifyToken = (em, tk) => {
        if (!em || !tk || !secret) return false;
        try {
          const expected = crypto
            .createHmac("sha256", secret)
            .update(em)
            .digest("base64url");
          return (
            expected.length === tk.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(tk))
          );
        } catch (e) {
          console.warn(`[Padron] verifyToken throw: ${e.message}`);
          return false;
        }
      };

      if (!rawEmail || !rawToken || !verifyToken(rawEmail, rawToken)) {
        let debugLine = "";
        try {
          const exp = secret
            ? crypto.createHmac("sha256", secret).update(rawEmail).digest("base64url")
            : "";
          debugLine = `secretLen=${secret.length} · emailLen=${rawEmail.length} · expected.start="${exp.slice(0, 8)}" · received.start="${rawToken.slice(0, 8)}" · sameLen=${exp.length === rawToken.length}`;
        } catch {}
        console.warn(`[Padron] token inválido · email="${rawEmail}" · ${debugLine}`);
        await responderHtml(400, renderLanding({
          title: "Enlace inválido — Red Solar Viva",
          headline: "ENLACE INVÁLIDO",
          body: `El enlace que seguiste expiró o fue alterado. Escríbenos a <strong style='color:#fff;'>redsolarviva@protonmail.com</strong> y lo resolvemos a mano.<br><br><span style="font-size:10px;color:#37474f;font-family:monospace;">debug: ${debugLine || "n/a"}</span>`,
          mode: "error",
        }));
        return { ok: false, reason: "invalid_token", debug: debugLine };
      }

      /* ── Qué quiere hacer ───────────────────────────────────────────────
         El PATH manda; si no llegó, se decide por la forma del pedido. Los
         botones de la landing (POST con action) tienen precedencia porque
         son una decisión fresca sobre la que se acaba de tomar. */
      let quiereBaja;
      if (esAccionConToken) {
        quiereBaja = body.action === "revoke";
      } else if (path.includes("baja") || path.includes("unsub")) {
        quiereBaja = true;
      } else if (path.includes("alta") || path.includes("sub")) {
        quiereBaja = false;
      } else {
        /* Sin path reconocible: `?baja=1` decide, y por defecto es ALTA
           (dar de baja por accidente es el error caro de los dos). */
        quiereBaja = String(query.baja || "") === "1";
      }

      /* ═══════════════════════════════════════════════════════════════════
         ② BAJA
         ═══════════════════════════════════════════════════════════════════ */
      if (quiereBaja) {
        console.log(`[Padron] BAJA para ${rawEmail}`);
        const r = await callRpc("record_email_opt_out", {
          p_email: rawEmail,
          p_reason: esAccionConToken
            ? "Revertido tras alta de 1 clic"
            : "Baja desde el pie de un correo",
          p_category: "all",
          p_source: esAccionConToken ? "subscribe_revoke" : "unsubscribe_link",
          p_metadata: {
            ua: event.headers?.["user-agent"] || null,
            ts: new Date().toISOString(),
          },
        });

        if (!r.ok) {
          console.error(`[Padron] baja RPC fail: ${r.error}`);
          await responderHtml(500, renderLanding({
            title: "Error — Red Solar Viva",
            headline: "ERROR DE RED",
            body: `No pudimos procesar la baja: ${r.error}. Reintenta en unos segundos.`,
            mode: "error",
          }));
          return { ok: false, error: r.error };
        }

        console.log(`[Padron] ✅ baja registrada para ${rawEmail}`);
        await responderHtml(200, renderLanding({
          title: "Baja procesada — Red Solar Viva",
          headline: "BAJA PROCESADA",
          body: `Listo. <strong style='color:#FF5364;'>${rawEmail}</strong> queda fuera de la lista de correos de Red Solar Viva. No volverás a recibir transmisiones desde aquí. Si fue un error, puedes revertirlo abajo.`,
          mode: "ok-out",
          email: rawEmail,
          token: rawToken,
        }));
        return { ok: true, action: "opted_out", email: rawEmail };
      }

      /* ═══════════════════════════════════════════════════════════════════
         ① ALTA
         Si tenía una baja activa se revoca primero: la voluntad fresca de
         suscribirse manda sobre la baja vieja.
         ═══════════════════════════════════════════════════════════════════ */
      const optOut = await callRpc("is_email_opted_out", {
        p_email: rawEmail,
        p_category: "all",
      });
      if (optOut.ok && optOut.data === true) {
        console.log(`[Padron] revocando baja previa de ${rawEmail}`);
        const restore = await callRpc("restore_email_opt_in", { p_email: rawEmail });
        if (!restore.ok) {
          await responderHtml(500, renderLanding({
            title: "Error — Red Solar Viva",
            headline: "ERROR DE RED",
            body: `No pudimos revivir tu alta: ${restore.error}.`,
            mode: "error",
          }));
          return { ok: false, error: restore.error };
        }
      }

      /* De qué transmisión vino: cada correo agrega &from=<workflow> a su
         enlace (bienvenida_nodo, ciclo_sellado…). Sin ese dato queda
         "unknown", que se distingue de un valor real. */
      const fromParam = (query.from || "").toString().trim().slice(0, 64);

      console.log(`[Padron] ALTA para ${rawEmail}`);
      const r = await callRpc("record_nodo_subscription", {
        p_email: rawEmail,
        p_source: "email_one_click",
        p_metadata: {
          ua: event.headers?.["user-agent"] || null,
          ts: new Date().toISOString(),
          from: fromParam || "unknown",
        },
      });

      if (!r.ok) {
        console.error(`[Padron] alta RPC fail: ${r.error}`);
        await responderHtml(500, renderLanding({
          title: "Error — Red Solar Viva",
          headline: "ERROR DE RED",
          body: `No pudimos completar tu alta: ${r.error}.`,
          mode: "error",
        }));
        return { ok: false, error: r.error };
      }

      console.log(`[Padron] ✅ alta registrada para ${rawEmail}`);
      await responderHtml(200, renderLanding({
        title: "Recepción activada — Red Solar Viva",
        headline: "RECEPTOR ENCENDIDO",
        body: `Listo. <strong style='color:#00E5FF;'>${rawEmail}</strong> quedó dentro de la lista de Red Solar Viva. Recibirás las próximas transmisiones. Si fue un error, puedes revertirlo abajo.`,
        mode: "ok-in",
        email: rawEmail,
        token: rawToken,
      }));
      return { ok: true, action: "subscribed", email: rawEmail };

    } catch (fatal) {
      console.error(`[Padron] FATAL ${fatal.message}\n${fatal.stack || ""}`);
      await responderHtml(500, renderLanding({
        title: "Error inesperado — Red Solar Viva",
        headline: "ERROR INESPERADO",
        body: `Algo se cruzó: ${fatal.message}. Escríbenos a <strong style='color:#fff;'>redsolarviva@protonmail.com</strong> y lo resolvemos a mano.`,
        mode: "error",
      }));
      return { ok: false, fatal: fatal.message };
    }
  },
});
