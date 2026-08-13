/**
 * Red Solar Viva · Guardar Mensajes — STEP intermedio
 * ===================================================
 * Versión "step-style" del workflow Guardar Mensajes. NO toca el
 * trigger ni el step append_to_record que ya existen. Se agrega como
 * un step nuevo de Node.js entre los dos.
 *
 * Layout esperado del workflow (después de pegar este step):
 *   1. trigger (HTTP, Return HTTP 200 OK) ← existente, sin cambios.
 *   2. nodo_central_supabase ← este step nuevo (pega este archivo).
 *   3. append_to_record (Pipedream Data Store) ← existente, sin cambios.
 *
 * Cómo agregarlo:
 *   En el editor del workflow, hacé click en el "+" entre `trigger`
 *   y `append_to_record` → buscá "Run Node.js code" → pegá este
 *   archivo entero en el code editor del step. Ponele de nombre
 *   "nodo_central_supabase". Deploy.
 *
 * Comportamiento del step:
 *   · Lee el body del HTTP trigger.
 *   · Sanitiza email (lower-trim).
 *   · Si el email es inválido → return ok:false (los steps siguientes
 *     siguen corriendo igual; no aborto).
 *   · Si está en email_opt_outs → return ok:true skipped:true.
 *   · Si pasa los gates → llamada al RPC record_nodo_subscription para
 *     persistir en Supabase. Idempotente.
 *
 * Env vars necesarias en el workspace de Pipedream:
 *   SUPABASE_URL, SUPABASE_ANON_KEY (ya las tenés cargadas).
 *
 * Nota: este step NO maneja el http.respond — ya lo maneja el trigger
 * con su modo "Return HTTP 200 OK". El response al cliente sale apenas
 * el trigger termina; los steps de más abajo corren en background y
 * no demoran la respuesta. Esto significa que si Supabase está caído,
 * el form de Origen igual recibe success — y nosotros vemos el error
 * en los logs de Pipedream para investigar después.
 */
export default defineComponent({
  async run({ steps, $ }) {
    const body = steps.trigger.event.body || {};

    const rawEmail = (body.email || "").toString().trim().toLowerCase();
    const source = (body.source || "origen_landing").toString().slice(0, 64);
    const name = body.name ? String(body.name).slice(0, 256) : null;
    const message = body.message ? String(body.message).slice(0, 2000) : null;

    if (!rawEmail || !rawEmail.includes("@")) {
      console.warn(`[nodo_central] email inválido: "${rawEmail}"`);
      return { ok: false, reason: "invalid_email" };
    }

    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[nodo_central] Supabase no configurado — skip");
      return { ok: false, reason: "supabase_not_configured" };
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

    // 1. Si el email tiene opt-out activo, esto es un re-opt-in
    //    EXPLÍCITO (la persona vino al form a meterse de vuelta a la
    //    lista). Revocamos el opt-out y seguimos al insert. Diferente
    //    del flujo silencioso anterior, donde un opt-out previo
    //    bloqueaba para siempre — ahora la voluntad fresca manda.
    const optOutCheck = await callRpc("is_email_opted_out", {
      p_email: rawEmail,
      p_category: "all",
    });
    let revivedFromOptOut = false;
    if (optOutCheck.ok && optOutCheck.data === true) {
      console.log(
        `↻ nodo_central · re-opt-in explícito — ${rawEmail} estaba dado de baja`
      );
      const restore = await callRpc("restore_email_opt_in", {
        p_email: rawEmail,
      });
      if (!restore.ok) {
        console.warn(
          `[nodo_central] restore_email_opt_in fail: ${restore.error}`
        );
        return { ok: false, error: restore.error };
      }
      revivedFromOptOut = true;
    }

    // 2. Insert / refresh idempotente en nodo_central.
    const metadata = {};
    if (name) metadata.name = name;
    if (message) metadata.message = message;
    const ua = steps.trigger.event.headers?.["user-agent"];
    if (ua) metadata.user_agent = ua;

    const r = await callRpc("record_nodo_subscription", {
      p_email: rawEmail,
      p_source: source,
      p_metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });

    if (!r.ok) {
      console.error(`❌ nodo_central RPC fail: ${r.error}`);
      return { ok: false, error: r.error };
    }

    console.log(
      `✅ Nodo Central · ${rawEmail} (source=${source}${
        revivedFromOptOut ? ", revived" : ""
      })`
    );
    return {
      ok: true,
      persisted: true,
      email: rawEmail,
      source,
      revived_from_opt_out: revivedFromOptOut,
    };
  },
});
