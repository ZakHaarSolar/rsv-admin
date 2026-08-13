/**
 * Red Solar Viva · Guardar Mensajes v2
 * ====================================
 *
 * v2 (2026-07-27) — AUDITORÍA PARTE 4, cierre del último residual.
 *
 * 🜂 POR QUÉ ESTE WORKFLOW **NO** LLEVA FIRMA HMAC (a diferencia de
 *    CicloSellado, PaseExploracion y BienvenidaNodo):
 *
 *    El plan era firmarlo igual que a los otros tres. Al verificar antes de
 *    escribir, resultó que sería teatro de seguridad:
 *
 *      · `record_nodo_subscription` está GRANTed a anon desde 20260427 y
 *        nunca se revocó.
 *      · El frontend la llama DIRECTO con la llave pública, en dos lugares
 *        de `Code/Auth2Modal.tsx` (~1075 y ~1229).
 *
 *    La misma capacidad (meter un correo al padrón) ya está a un POST de
 *    distancia sin pasar por acá. Cerrar esta puerta con una firma dejaría
 *    la ventana de al lado abierta, y encima la firma sería inútil: este
 *    endpoint lo llama un FORM PÚBLICO desde el navegador, que no puede
 *    guardar un secreto (mismo problema que tuvo el Ciclo Sellado).
 *
 *    El blindaje real vive DENTRO de la RPC (migración 20260727g), que es
 *    por donde pasan las dos entradas: correo validado de verdad, metadata
 *    acotada y freno global de altas nuevas por día.
 *
 *    Acá solo se suma defensa en profundidad barata: validar el correo con
 *    el mismo criterio antes de gastar un viaje a la base.
 *
 * Trigger: HTTP webhook que recibe submits del form
 * "ÚNETE AL NODO CENTRAL" del Portal de Inducción (Origen.tsx) y de
 * cualquier otro form chico de RSV que mande {email, source} u
 * opcionalmente {email, name, message}.
 *
 * Comportamiento:
 *   1. Sanitiza email (lower-trim).
 *   2. Si no es email válido → 400.
 *   3. Si está en email_opt_outs → respondemos 200 ok pero NO grabamos
 *      en nodo_central (el opt-out manda; respetamos su decisión sin
 *      darle señal de que el envío "no funcionó").
 *   4. Si es válido y no está dado de baja → llamamos al RPC
 *      public.record_nodo_subscription(email, source, metadata).
 *      Idempotente: si ya estaba, refresca last_event_at.
 *
 * Reemplaza el workflow vivo "Guardar Mensajes" que sólo logueaba a
 * Pipedream sin escribir a la DB. Pegar este código en el step de
 * Node.js del workflow existente.
 *
 * Payload esperado (cualquier de estos formatos):
 *   { email: "x@y.com" }
 *   { email: "x@y.com", source: "redsolarviva_landing" }
 *   { email: "x@y.com", name: "Nombre", message: "Hola" }
 *
 * Env vars (Pipedream):
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

    const rawEmail = (body.email || "").toString().trim().toLowerCase();
    const source = (body.source || "origen_landing").toString().slice(0, 64);
    const name = body.name ? String(body.name).slice(0, 256) : null;
    const message = body.message ? String(body.message).slice(0, 2000) : null;

    /* v2 — mismo criterio que la RPC (20260727g). Antes bastaba con que el
       texto tuviera una arroba: "@", "a@b" y "  @  " pasaban derecho. */
    const correoValido =
      rawEmail.length >= 6 &&
      rawEmail.length <= 254 &&
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(rawEmail);

    if (!correoValido) {
      await this.http.respond({
        status: 400,
        body: { ok: false, error: "missing_or_invalid_email" },
      });
      return { ok: false, reason: "invalid_email" };
    }

    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[GuardarMensajes] Supabase no configurado — saltando insert");
      await this.http.respond({
        status: 200,
        body: { ok: true, persisted: false, reason: "supabase_not_configured" },
      });
      return { ok: true, persisted: false };
    }

    const callRpc = async (rpcName, payload) => {
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

    // -----------------------------------------------------------------
    // 1. Pre-flight: respeta opt-out previo. Si está dado de baja,
    //    devolvemos ok pero no escribimos. UI ve "success" igual.
    // -----------------------------------------------------------------
    const optOutCheck = await callRpc("is_email_opted_out", {
      p_email: rawEmail,
      p_category: "all",
    });
    if (optOutCheck.ok && optOutCheck.data === true) {
      console.log(`↷ GuardarMensajes SKIP — ${rawEmail} tiene opt-out activo`);
      await this.http.respond({
        status: 200,
        body: { ok: true, persisted: false, reason: "opted_out" },
      });
      return { ok: true, persisted: false, reason: "opted_out" };
    }

    // -----------------------------------------------------------------
    // 2. Insert / refresh en nodo_central.
    // -----------------------------------------------------------------
    const metadata = {};
    if (name) metadata.name = name;
    if (message) metadata.message = message;
    const ua = this.http?.headers?.["user-agent"];
    if (ua) metadata.user_agent = ua;

    const r = await callRpc("record_nodo_subscription", {
      p_email: rawEmail,
      p_source: source,
      p_metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });

    if (!r.ok) {
      console.error(`❌ GuardarMensajes RPC fail: ${r.error}`);
      await this.http.respond({
        status: 500,
        body: { ok: false, error: r.error },
      });
      return { ok: false, error: r.error };
    }

    console.log(`✅ Nodo Central · ${rawEmail} (source=${source})`);
    await this.http.respond({
      status: 200,
      body: { ok: true, persisted: true, email: rawEmail, source },
    });
    return { ok: true, persisted: true, email: rawEmail };
  },
});
