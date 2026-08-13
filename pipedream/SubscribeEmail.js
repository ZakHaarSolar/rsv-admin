import crypto from "crypto";

/**
 * Red Solar Viva · SubscribeEmail (v2 — fix HTTP interface)
 * =========================================================
 * Trigger del workflow: HTTP webhook con `customResponse: true`
 * (configurado en el step `trigger` de Pipedream, NO acá).
 *
 * v2 (2026-04-27)
 *  · Mismo fix que UnsubscribeEmail v3: quitamos `defineComponent`
 *    con `props.http` y usamos `$.respond({...})` para la respuesta
 *    custom. Lectura del request via `steps.trigger.event.*`.
 *
 * Espejo de UnsubscribeEmail.js. Mismo HMAC secret. Endpoints:
 *   GET  ?email=X&t=<token>            → suscribe + landing.
 *   POST {action:'revoke', email, t}   → opt-out + landing.
 *
 * Env vars (Pipedream):
 *   EMAIL_UNSUBSCRIBE_SECRET (mismo que Unsubscribe)
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 */
export default defineComponent({
  async run({ steps, $ }) {
    const renderLanding = ({ title, headline, body: bodyText, mode, email, token }) => {
      const accent =
        mode === "ok-in"  ? "#00E5FF" :
        mode === "ok-out" ? "#FF5364" :
                             "#94A3B8";
      const showRevokeBtn = mode === "ok-in" && email && token;
      const actionBtn = showRevokeBtn ? `
          <form id="rev" method="POST" action="" style="margin:0">
            <input type="hidden" name="action" value="revoke">
            <input type="hidden" name="email" value="${email}">
            <input type="hidden" name="t" value="${token}">
            <button type="submit" style="display:inline-block;padding:14px 30px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;color:#fff;text-transform:uppercase;background:transparent;border:1px solid rgba(255,83,100,0.5);border-radius:8px;cursor:pointer;">REVERTIR · DARME DE BAJA</button>
          </form>` : "";

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

    const safeRespond = async (status, html) => {
      try {
        await $.respond({
          status,
          headers: { "Content-Type": "text/html; charset=utf-8" },
          body: html,
          immediate: true,
        });
      } catch (e) {
        console.error(`[Subscribe] $.respond fail: ${e.message}`);
      }
    };

    try {
      const event = steps.trigger.event || {};
      const method = (event.method || "GET").toUpperCase();
      const query = event.query || {};
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

      console.log(
        `[Subscribe] ${method} · query.email=${query.email || ""} · query.t.len=${(query.t || "").length} · body.action=${body?.action || ""}`
      );

      const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || "";
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
      const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

      if (!secret) {
        console.error("[Subscribe] EMAIL_UNSUBSCRIBE_SECRET no está configurado");
        await safeRespond(500, renderLanding({
          title: "Configuración faltante — Red Solar Viva",
          headline: "ERROR DE CONFIGURACIÓN",
          body: "El secret de validación no está configurado en el workspace de Pipedream.",
          mode: "error",
        }));
        return { ok: false, fatal: "missing_secret" };
      }

      const isRevoke = method === "POST" && body && body.action === "revoke";

      let rawEmail = ((isRevoke ? body.email : query.email) || "").toString().trim();
      try {
        rawEmail = decodeURIComponent(rawEmail);
      } catch {}
      rawEmail = rawEmail.toLowerCase();

      const rawToken = ((isRevoke ? body.t : query.t) || "").toString().trim();

      const verifyToken = (em, tk) => {
        if (!em || !tk || !secret) return false;
        try {
          const expected = crypto
            .createHmac("sha256", secret)
            .update(em)
            .digest("base64url");
          const matches =
            expected.length === tk.length &&
            crypto.timingSafeEqual(
              Buffer.from(expected),
              Buffer.from(tk)
            );
          if (!matches) {
            console.warn(
              `[Subscribe] verifyToken FAIL · email="${em}" emailLen=${em.length} secretLen=${secret.length} expected.start="${expected.slice(0, 8)}" expected.end="${expected.slice(-4)}" tk.start="${tk.slice(0, 8)}" tk.end="${tk.slice(-4)}" sameLength=${expected.length === tk.length}`
            );
          }
          return matches;
        } catch (e) {
          console.warn(`[Subscribe] verifyToken throw: ${e.message}`);
          return false;
        }
      };

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

      if (!rawEmail || !rawToken || !verifyToken(rawEmail, rawToken)) {
        let debugLine = "";
        try {
          const exp = secret
            ? crypto.createHmac("sha256", secret).update(rawEmail).digest("base64url")
            : "";
          debugLine = `secretLen=${secret.length} · emailLen=${rawEmail.length} · expected.start="${exp.slice(0, 8)}" · received.start="${rawToken.slice(0, 8)}" · sameLen=${exp.length === rawToken.length}`;
        } catch {}
        console.warn(
          `[Subscribe] token inválido · email="${rawEmail}" · ${debugLine}`
        );
        await safeRespond(400, renderLanding({
          title: "Enlace inválido — Red Solar Viva",
          headline: "ENLACE INVÁLIDO",
          body: `El enlace expiró o fue alterado.<br><br><span style="font-size:10px;color:#37474f;font-family:monospace;">debug: ${debugLine || "n/a"}</span>`,
          mode: "error",
        }));
        return { ok: false, reason: "invalid_token", debug: debugLine };
      }

      /* ---------- camino A · REVOKE (POST con action=revoke) ---------- */
      if (isRevoke) {
        console.log(`[Subscribe] REVOKE para ${rawEmail}`);
        const r = await callRpc("record_email_opt_out", {
          p_email: rawEmail,
          p_reason: "Revertido tras 1-click subscribe",
          p_category: "all",
          p_source: "subscribe_revoke",
          p_metadata: { ts: new Date().toISOString() },
        });
        if (!r.ok) {
          console.error(`[Subscribe] revoke RPC fail: ${r.error}`);
          await safeRespond(500, renderLanding({
            title: "Error — Red Solar Viva",
            headline: "ERROR DE RED",
            body: `No pudimos procesar la reversión: ${r.error}.`,
            mode: "error",
          }));
          return { ok: false, error: r.error };
        }
        await safeRespond(200, renderLanding({
          title: "Baja procesada — Red Solar Viva",
          headline: "BAJA PROCESADA",
          body: `Listo. <strong style='color:#FF5364;'>${rawEmail}</strong> queda fuera de la lista.`,
          mode: "ok-out",
        }));
        return { ok: true, action: "revoked", email: rawEmail };
      }

      /* ---------- camino B · SUBSCRIBE (GET) ---------- */
      /* Si el email tenía opt-out activo, lo revocamos primero. La
         voluntad fresca de suscribirse manda sobre la baja vieja. */
      const optOut = await callRpc("is_email_opted_out", {
        p_email: rawEmail,
        p_category: "all",
      });
      if (optOut.ok && optOut.data === true) {
        console.log(`[Subscribe] revocando opt-out previo de ${rawEmail}`);
        const restore = await callRpc("restore_email_opt_in", {
          p_email: rawEmail,
        });
        if (!restore.ok) {
          await safeRespond(500, renderLanding({
            title: "Error — Red Solar Viva",
            headline: "ERROR DE RED",
            body: `No pudimos revivir tu alta: ${restore.error}.`,
            mode: "error",
          }));
          return { ok: false, error: restore.error };
        }
      }

      console.log(`[Subscribe] SUBSCRIBE para ${rawEmail}`);
      /* v3 — Tracking de origen del suscriptor: cada workflow que
         envía un correo con botón "Activar Recepción" agrega
         `&from=<workflow_id>` al subscribeLink. Ej:
           ?email=...&t=...&from=bienvenida_nodo
           ?email=...&t=...&from=ciclo_sellado
         Ese valor se persiste en metadata.from para poder rastrear
         desde qué transmisión específica vino la suscripción. Si el
         link no trae from (clicks viejos, llamadas manuales), queda
         "unknown" para distinguir del valor presente. */
      const fromParam = (query.from || "").toString().trim().slice(0, 64)
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
        console.error(`[Subscribe] record RPC fail: ${r.error}`);
        await safeRespond(500, renderLanding({
          title: "Error — Red Solar Viva",
          headline: "ERROR DE RED",
          body: `No pudimos completar tu alta: ${r.error}.`,
          mode: "error",
        }));
        return { ok: false, error: r.error };
      }

      console.log(`[Subscribe] ✅ alta registrada para ${rawEmail}`);
      await safeRespond(200, renderLanding({
        title: "Recepción activada — Red Solar Viva",
        headline: "RECEPTOR ENCENDIDO",
        body: `Listo. <strong style='color:#00E5FF;'>${rawEmail}</strong> quedó dentro de la lista de Red Solar Viva. Recibirás las próximas transmisiones. Si fue un error, puedes revertirlo abajo.`,
        mode: "ok-in",
        email: rawEmail,
        token: rawToken,
      }));
      return { ok: true, action: "subscribed", email: rawEmail };

    } catch (fatal) {
      console.error(`[Subscribe] FATAL ${fatal.message}\n${fatal.stack || ""}`);
      await safeRespond(500, renderLanding({
        title: "Error inesperado — Red Solar Viva",
        headline: "ERROR INESPERADO",
        body: `Algo se cruzó: ${fatal.message}.`,
        mode: "error",
      }));
      return { ok: false, fatal: fatal.message };
    }
  },
});
