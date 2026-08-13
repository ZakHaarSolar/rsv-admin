import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * Red Solar Viva · BienvenidaNodo v5
 * ===============================
 *
 * v5 (2026-08-10) — 🜂 LA BIENVENIDA DE LA CASA MADRE. Zak se suscribió desde
 * redsolarviva.com y no llegó ningún correo: el Padrón registraba el alta y
 * ahí moría. Ahora RSV_Padron (v2) dispara a este workflow con
 * `tipo:"rsv_bienvenida"` (misma firma simple `email|ts`) y este manda LA OTRA
 * CARTA: la de Red Solar Viva como casa madre, con el Escáner Vibracional
 * presentado como la creación estrella y la promesa concreta ("cuando algo
 * nuevo nazca en la Red, te llega primero a ti"). Un solo workflow, dos
 * cartas: acá vive el HTML de los correos y las dos ramas comparten paleta,
 * candado anti-Gmail, sello tipográfico y pie de baja — el mismo vibe, cada
 * una con su identidad (el Escáner es CIAN; la casa es ORO).
 *   · Idempotencia por tipo: `bienvenida_rsv` y `bienvenida_nodo` se dedupan
 *     por separado (suscribirse hoy en la web y crear cuenta mañana son dos
 *     bienvenidas legítimas), y el dedupe ahora también funciona sin
 *     clerk_user_id (llave `email:<correo>`).
 *   · En la carta de la casa el bloque "Recibir las transmisiones" no existe:
 *     quien la recibe acaba de darse de alta en el padrón.
 *   · Env vars nuevas que necesita: NINGUNA (usa RSV_DISPATCH_SECRET y el
 *     SMTP que ya estaban). La nueva vive en RSV_Padron:
 *     BIENVENIDA_WEBHOOK_URL = la URL del trigger de ESTE workflow.
 *
 * v4 (2026-07-27) — CORREO REESCRITO (feedback de Zak sobre el envío real).
 * Tres cosas estaban mal:
 *   1. El logo salía ROTO: apuntaba a un enlace de Google Drive, que ya no
 *      sirve imágenes a clientes de correo. Ahora NO hay ninguna imagen
 *      externa (ni logo ni fondo de estrellas): el sello es tipográfico,
 *      como en CicloSellado. Se ve igual en todos lados, para siempre.
 *   2. La identidad era de Red Solar Viva ("[NODO ACTIVADO]", "acceso a Red
 *      Solar Viva"). Quien crea su cuenta viene por el ESCÁNER; RSV es la
 *      casa madre y vive en el pie. El encabezado ahora es del Escáner.
 *   3. El lenguaje era de computadora ("tu firma térmica está registrada en
 *      la matriz", "la entropía de tu chasis", "de carbono a silicio"), lo
 *      que la regla de LENGUAJE EXPERIENCIAL manda sacar. Reescrito para que
 *      lo entienda cualquiera en su primer contacto, sosteniendo el tono
 *      vibracional: qué es el Escáner, qué mide, por dónde empezar.
 * + El bloque de transmisiones ya no habla de un paso que nadie vio (ver la
 *   nota junto a `transmisionesBlock`).
 * Diseño calcado de CicloSellado.js (paleta, candado de gradiente anti-Gmail,
 * sello ✦, tarjetas y separadores).
 *
 * v3 (2026-07-27) — AUDITORÍA PARTE 4. El workflow aceptaba cualquier POST con
 * forma de evento de Clerk, sin verificar nada: quien conociera la dirección
 * mandaba un correo de bienvenida con nuestra marca a la dirección que
 * quisiera, y de paso suscribía a esa persona al Nodo Central.
 *
 * 🜂 CAMBIO DE VÍA. La firma de Clerk (svix) se calcula sobre el cuerpo CRUDO
 * byte a byte, y el diagnóstico en vivo mostró que Pipedream NO expone ese
 * cuerpo acá (`rawLen=0`): validarla era imposible. Entonces la verificación se
 * mudó al edge `clerk-webhook`, que ya valida svix desde siempre y es quien
 * crea el perfil; desde ahí nos avisa con una firma HMAC simple, el mismo
 * mecanismo probado de punta a punta con el Ciclo Sellado.
 *
 * Consecuencias:
 *   · La forma de Clerk directa se RECHAZA con 410. Si aparece en los logs,
 *     el endpoint viejo sigue registrado en Clerk y hay que quitarlo (si no,
 *     el correo saldría duplicado).
 *   · La forma simple `{email, full_name, clerk_user_id, nodo_consent}` exige
 *     `ts` + `_sig` (HMAC de `email|ts` con RSV_DISPATCH_SECRET, ventana de
 *     10 minutos). Fail-open solo mientras ese secreto no esté configurado.
 *
 * Env nueva: RSV_DISPATCH_SECRET (la misma del Ciclo Sellado y del Pase).
 * Trigger: HTTP webhook que dispara cuando se crea una cuenta nueva.
 * El cliente puede ser:
 *   · El webhook de Clerk `user.created` (configurar en clerk.com →
 *     Webhooks → endpoint URL = este workflow). Payload trae
 *     `data.email_addresses[0].email_address` y `data.first_name`.
 *   · Un fetch manual desde el frontend o desde el edge function
 *     `clerk-webhook` que ya tenemos. Payload simple `{email, full_name,
 *     clerk_user_id}`.
 *
 * Propósito: confirmar la creación de cuenta. Es un envío
 * TRANSACCIONAL — la persona acaba de registrarse y necesita
 * confirmación de que su acceso al Escáner Vibracional quedó
 * configurado.
 *
 * Reglas del flujo (acordadas con Diego, 2026-04-27):
 *   1. Pre-flight opt-out: si la persona ya está en email_opt_outs,
 *      skipeamos. Aunque sea transaccional, respetamos el bloqueo.
 *   2. Si el payload trae `unsafe_metadata.nodoConsent === true` (el
 *      tripulante marcó el checkbox del modal de signup), suscribir
 *      al Nodo Central inmediatamente y considerar in_nodo=true para
 *      omitir el CTA "Activar Recepción" del correo. Aplica tanto al
 *      flow de email/password como al de Google OAuth.
 *   3. Bloque "Activar Recepción de Pulsos" SE OMITE si la persona
 *      ya está suscrita al Nodo (in_nodo=true). Si no está suscrita,
 *      lo incluimos con CTA "1-click subscribe" firmado.
 *   4. Footer "Ajustar Frecuencia de Señales" SIEMPRE incluido
 *      (es la baja transaccional). Si la persona pica baja después
 *      de este correo y luego se suscribe activamente, la suscripción
 *      revoca el opt-out (lógica del form de Origen y del Subscribe).
 *
 * Payload esperado:
 *   { email, full_name?, clerk_user_id? }
 *   o el formato Clerk: { type: "user.created", data: { ... } }
 *
 * Env vars (Pipedream):
 *   PROTON_SMTP_USER, PROTON_SMTP_PASS, PROTON_SMTP_HOST, PROTON_SMTP_PORT
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 *   UNSUBSCRIBE_WEBHOOK_URL  — URL del workflow UnsubscribeEmail.js
 *   SUBSCRIBE_WEBHOOK_URL    — URL del workflow SubscribeEmail.js
 *   EMAIL_UNSUBSCRIBE_SECRET — secret HMAC compartido
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

    /* ── AUDITORÍA PARTE 4 · GUARD DE AUTENTICIDAD ──────────────────────────
       Este workflow aceptaba cualquier POST con forma de evento de Clerk, sin
       verificar la firma. Quien conociera la dirección mandaba un correo de
       bienvenida con nuestra marca a la dirección que quisiera, y de paso
       suscribía a esa persona al Nodo Central (`nodo_consent`).

       Dos formas de payload, dos firmas:

         · Forma Clerk (`type: "user.created"`) → firma SVIX, la que Clerk
           manda de verdad. Se verifica igual que en el edge `clerk-webhook`,
           que ya la valida bien: HMAC-SHA256 de `id.timestamp.cuerpoCrudo`
           con la parte que sigue a `whsec_` decodificada de base64.

         · Forma simple (`{email, full_name, clerk_user_id}`) → nuestra firma
           HMAC (`ts` + `_sig`), la misma del Ciclo Sellado y del Pase. Hoy no
           hay ningún llamador de esta forma en el repo; queda soportada por si
           algún servidor nuestro la necesita, pero ya no sin firmar.

       Cada rama es fail-open MIENTRAS su secreto no esté configurado en
       Pipedream, a propósito: así los correos de bienvenida no se cortan en la
       ventana entre pegar este código y pegar el secreto.

       🜂 La firma svix se calcula sobre el cuerpo CRUDO, byte a byte. Un
       `JSON.stringify(body)` reordena claves y espacios, así que jamás
       coincidiría. El log de abajo dice en cada corrida si el cuerpo crudo
       está disponible — se lee en el inspector de Pipedream (Live Events →
       abrir un evento → pestaña Exports del paso `code`) y con eso se confirma
       en UNA ronda, sin adivinar. */
    const esFormaClerk = !!(body && body.type && body.data);

    const rawCandidato =
      (typeof steps?.trigger?.event?.bodyRaw === "string" && steps.trigger.event.bodyRaw) ||
      (typeof this.http?.bodyRaw === "string" && this.http.bodyRaw) ||
      (typeof steps?.trigger?.event?.body === "string" && steps.trigger.event.body) ||
      "";

    /* 🜂 Diagnóstico que corre SIEMPRE, aunque el guard esté en modo abierto.
       Se lee en el inspector de Pipedream (Live Events → abrir un evento →
       pestaña Logs del paso `code`) y dice, sin adivinar, si el cuerpo crudo
       llega. Sirve para confirmar ANTES de pegar el secreto que la firma va a
       poder validarse — si `rawLen` viniera 0, setear el secreto rechazaría
       hasta los registros legítimos. */
    console.log(
      `[BienvenidaNodo] diag · formaClerk=${esFormaClerk} rawLen=${rawCandidato.length} ` +
        `headersTipo=${Array.isArray(this.http?.headers || steps?.trigger?.event?.headers) ? "array" : typeof (this.http?.headers || steps?.trigger?.event?.headers)} ` +
        `clerkSecretSet=${!!process.env.CLERK_WEBHOOK_SECRET} rsvSecretSet=${!!process.env.RSV_DISPATCH_SECRET}`
    );

    const compararSeguro = (a, b) =>
      a.length === b.length &&
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

    if (esFormaClerk) {
      /* 🜂 VÍA RETIRADA. Clerk ya no debe apuntar acá.
         La firma de Clerk (svix) se calcula sobre el cuerpo CRUDO byte a byte,
         y el diagnóstico en vivo del 2026-07-27 mostró que Pipedream no expone
         ese cuerpo en este workflow (`rawLen=0`): la firma sería imposible de
         validar y el endpoint quedaría abierto para siempre.

         Desde la Parte 4 el aviso lo manda el edge `clerk-webhook`, que SÍ
         valida svix (y lo hace desde siempre), con nuestra firma HMAC simple.
         Si este rechazo aparece en los logs significa que el endpoint viejo
         sigue registrado en Clerk: hay que quitarlo de su lista de webhooks.
         Rechazamos en vez de dejar pasar, porque dejar pasar mandaría el correo
         de bienvenida DUPLICADO además de dejar el hueco abierto. */
      console.warn(
        `[BienvenidaNodo] vía Clerk directa RETIRADA (rawLen=${rawCandidato.length}). ` +
          `Quitá este endpoint de la lista de webhooks de Clerk: el aviso ahora ` +
          `sale del edge clerk-webhook, firmado.`
      );
      await this.http.respond({
        status: 410,
        body: { ok: false, error: "endpoint_retirado" },
      });
      return { ok: false, reason: "clerk_directo_retirado" };
    } else {
      const secretoRsv = process.env.RSV_DISPATCH_SECRET || "";
      if (secretoRsv) {
        const correoFirma = (body.email || "").toString().trim().toLowerCase();
        const sig = (body._sig || "").toString().trim();
        const sigTs = Number(body.ts || 0);
        const fresco =
          Number.isFinite(sigTs) && Math.abs(Date.now() - sigTs) < 10 * 60 * 1000;
        let firmaOk = false;
        if (sig && fresco) {
          const esperado = crypto
            .createHmac("sha256", secretoRsv)
            .update(`${correoFirma}|${sigTs}`)
            .digest("hex");
          firmaOk = compararSeguro(esperado, sig);
        }
        if (!firmaOk) {
          console.warn(
            `[BienvenidaNodo] payload simple sin firma valida · email="${correoFirma}" sigLen=${sig.length} fresco=${fresco}`
          );
          await this.http.respond({
            status: 401,
            body: { ok: false, error: "unauthorized" },
          });
          return { ok: false, reason: "bad_signature" };
        }
      } else {
        console.warn(
          "[BienvenidaNodo] RSV_DISPATCH_SECRET no configurada — guard simple en modo abierto (transitorio)"
        );
      }
    }

    /* Soporte dual: payload simple o payload de Clerk webhook. */
    let email = "";
    let fullName = "";
    let clerkUserId = "";
    /* Consent al Nodo Central: viene de Auth2Modal vía
       unsafeMetadata.nodoConsent que el frontend pasa al signUp.create
       o signUp.authenticateWithRedirect de Clerk. Si es true, este
       workflow suscribe al usuario a nodo_central tras enviar el correo
       de bienvenida. Default false (opt-in explícito). */
    let nodoConsent = false;
    if (body && body.type === "user.created" && body.data) {
      const d = body.data;
      email = (d.email_addresses?.[0]?.email_address || "").toLowerCase().trim();
      fullName = `${d.first_name || ""} ${d.last_name || ""}`.trim();
      clerkUserId = d.id || "";
      nodoConsent = !!d.unsafe_metadata?.nodoConsent;
    } else {
      email = (body.email || "").toString().trim().toLowerCase();
      fullName = (body.full_name || "").toString().trim();
      clerkUserId = (body.clerk_user_id || "").toString().trim();
      nodoConsent = !!body.nodo_consent;
    }

    /* 🜂 v5 — LA BIENVENIDA DE LA CASA MADRE. RSV_Padron (v2) dispara
       `tipo:"rsv_bienvenida"` cuando alguien deja su correo en el formulario
       de redsolarviva.com. Mismo workflow (acá vive el HTML), OTRA carta. */
    const esBienvenidaRsv = !esFormaClerk && body.tipo === "rsv_bienvenida";
    const emailType = esBienvenidaRsv ? "bienvenida_rsv" : "bienvenida_nodo";

    if (!email || !email.includes("@")) {
      await this.http.respond({
        status: 400,
        body: { ok: false, error: "missing_email" },
      });
      return { ok: false, reason: "missing_email" };
    }

    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    const supabaseReady = supabaseUrl && supabaseKey;

    const callRpc = async (rpcName, payload) => {
      if (!supabaseReady) return { ok: false, error: "supabase_not_configured" };
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
            p_email_type: emailType,
            p_status: status,
            p_error_message: errorMessage,
            p_metadata: extraMeta,
          }),
        });
      } catch (e) {
        console.warn(`[BienvenidaNodo] log fail: ${e.message}`);
      }
    };

    // ==========================================================
    // 0. SKIP idempotente: si ya enviamos bienvenida_nodo a este
    //    clerk_user_id en las últimas 24 horas, no reenviar. Cubre
    //    retry automático del webhook user.created Y dual-fire de
    //    Clerk (caso edmundospina@gmail.com 2026-04-28: dos disparos
    //    a las 08:52 y 17:15, mismo clerk_user_id, 8h 23min de
    //    diferencia → la ventana original de 6h no los atrapaba).
    //    Si no hay clerk_user_id en el payload (test manual), el
    //    chequeo se omite — fallback no-bloqueante.
    // ==========================================================
    /* v5 — el dedupe también corre SIN clerk_user_id (la bienvenida de la
       casa llega solo con el correo): la llave cae a `email:<correo>`, la
       misma que logDispatch escribe. Cada carta dedupa por su propio tipo. */
    const dedupeKey = clerkUserId || `email:${email}`;
    if (supabaseReady) {
      try {
        const dupRes = await callRpc("is_recent_dispatch", {
          p_clerk_user_id: dedupeKey,
          p_email_type: emailType,
          p_within_minutes: 1440,
        });
        if (dupRes.ok && dupRes.data === true) {
          console.log(
            `↷ BienvenidaNodo SKIP duplicate — ${email} ya recibió ${emailType} en las últimas 24h`
          );
          await this.http.respond({
            status: 200,
            body: { ok: true, skipped: true, reason: "duplicate" },
          });
          return { ok: true, skipped: true, reason: "duplicate" };
        }
      } catch (e) {
        console.warn(`[BienvenidaNodo] dup check fail: ${e.message}`);
      }
    }

    // ==========================================================
    // 1. SKIP si tiene opt-out activo (respetamos siempre la baja,
    //    aunque la cuenta sea recién creada).
    // ==========================================================
    if (supabaseReady) {
      try {
        const optRes = await callRpc("is_email_opted_out", {
          p_email: email,
          p_category: "all",
        });
        if (optRes.ok && optRes.data === true) {
          console.log(`↷ BienvenidaNodo SKIP — ${email} tiene opt-out activo`);
          await logDispatch("skipped", null, { reason: "opted_out" });
          await this.http.respond({
            status: 200,
            body: { ok: true, skipped: true, reason: "opted_out" },
          });
          return { ok: true, skipped: true };
        }
      } catch (e) {
        console.warn(`[BienvenidaNodo] opt-out check fail: ${e.message}`);
      }
    }

    // ==========================================================
    // 2. Si el usuario marcó el checkbox "Recibir transmisiones del
    //    Nodo Central" en el modal de signup (nodoConsent=true),
    //    suscribirlo ahora vía record_nodo_subscription. Esto asegura
    //    que el correo de bienvenida ya OMITA el bloque "Activar
    //    Recepción de Pulsos" (porque ya está dentro) y que el alta
    //    quede en la DB sin requerir un segundo click. Fire-and-forget
    //    pero con log: si falla, el correo sigue saliendo y queda
    //    evidencia para debug.
    // ==========================================================
    if (supabaseReady && nodoConsent) {
      try {
        const sub = await callRpc("record_nodo_subscription", {
          p_email: email,
          p_source: "clerk_signup_consent",
          p_metadata: {
            clerk_user_id: clerkUserId || null,
            ts: new Date().toISOString(),
          },
        });
        if (!sub.ok) {
          console.warn(
            `[BienvenidaNodo] record_nodo_subscription fail: ${sub.error}`
          );
        } else {
          console.log(
            `✅ ${email} suscrito al Nodo Central por consent en signup`
          );
        }
      } catch (e) {
        console.warn(
          `[BienvenidaNodo] consent record fail: ${e.message}`
        );
      }
    }

    // ==========================================================
    // 3. ¿Está en el Nodo Central? Decide si mostrar el bloque
    //    "Activar Recepción de Pulsos". Si nodoConsent=true ya
    //    asumimos in_nodo (acabamos de insertarlo arriba), así
    //    que omitimos el CTA. Si el RPC anterior falló, igual
    //    asumimos in_nodo=true porque el user dio consent
    //    explícito — el bloque del CTA sería inconsistente.
    // ==========================================================
    /* v5 — en la carta de la casa el alta al padrón YA ocurrió (la hizo el
       Padrón antes de disparar acá): el bloque "Recibir las transmisiones"
       sobra siempre. */
    let isInNodo = esBienvenidaRsv || nodoConsent;
    if (supabaseReady && !isInNodo) {
      try {
        const inRes = await callRpc("is_email_in_nodo", { p_email: email });
        if (inRes.ok && inRes.data === true) isInNodo = true;
      } catch (e) {
        console.warn(`[BienvenidaNodo] in_nodo check fail: ${e.message}`);
      }
    }

    // ==========================================================
    // 3. Construir links firmados HMAC para los CTAs del email.
    // ==========================================================
    const subscribeBase = (process.env.SUBSCRIBE_WEBHOOK_URL || "").replace(/\/+$/, "");
    const unsubscribeBase = (process.env.UNSUBSCRIBE_WEBHOOK_URL || "").replace(/\/+$/, "");
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || "";

    const sign = (e) => {
      try {
        return crypto.createHmac("sha256", secret).update(e).digest("base64url");
      } catch {
        return "";
      }
    };
    const token = secret ? sign(email) : "";
    /* v2 — `&from=<carta>` para tracking de origen en nodo_central: por SQL
       se sabe desde qué correo específico vino un alta o una baja. */
    const fromTag = emailType;
    const subscribeLink = subscribeBase && token
      ? `${subscribeBase}?email=${encodeURIComponent(email)}&t=${token}&from=${fromTag}`
      : `https://redsolarviva.com`;
    const unsubscribeLink = unsubscribeBase && token
      ? `${unsubscribeBase}?email=${encodeURIComponent(email)}&t=${token}&from=${fromTag}`
      : `mailto:redsolarviva@protonmail.com?subject=Baja%20${encodeURIComponent(email)}`;

    // ==========================================================
    // 4. Visuales del email
    // ==========================================================
    /* 🜂 v4 — MURIERON LAS IMÁGENES EXTERNAS.
       El logo apuntaba a un enlace de Google Drive (`drive.google.com/uc?
       export=view&id=…`): Drive dejó de servir imágenes así a clientes de
       correo, el proxy de Gmail no puede traerla y salía el ícono roto que
       vio Zak. El fondo de estrellas venía de transparenttextures.com, otro
       host ajeno que puede caerse o ser bloqueado.
       Norte = CicloSellado: CERO imágenes, el sello es TIPOGRÁFICO (✦ dentro
       de un círculo de borde). Se ve igual en todos los clientes, para
       siempre, y no depende de nadie más.

       Paleta + "candado de gradiente" calcados de CicloSellado: Gmail
       invierte los fondos oscuros a blanco salvo que se declaren TAMBIÉN
       como background-image: linear-gradient del mismo color. */
    const BG = "#04070D";
    const CARD = "#0A1322";
    const INK = "#E8EEF5";
    const INK_SOFT = "#9FB2C4";
    const MUTED = "#5E7186";
    const CYAN = "#00E5FF";
    const GOLD = "#D4A843";
    const lock = (hex) =>
      `background-color:${hex};background-image:linear-gradient(${hex},${hex});`;

    /* CTA: la App Store. Quien acaba de crear su cuenta casi siempre está
       DENTRO de la app, así que el botón es refuerzo; para un alta desde web
       es la vía real de descarga. No se usa el puente /activar porque ese
       aterriza en el selector de Sintonía, y un correo de bienvenida no
       debe abrir en un muro de pago. */
    const appStoreLink = "https://apps.apple.com/app/id6774143866";

    const nombre =
      fullName || email.split("@")[0].replace(/[._-]/g, " ") || "Tripulante";
    const primerNombre = nombre.split(" ")[0];

    /* Fila de "lo que vas a encontrar" — mismo patrón que CicloSellado. */
    const capa = (titulo, texto) => `
      <tr>
        <td style="padding:7px 0;font-size:13.5px;line-height:1.65;color:${INK_SOFT};">
          <span style="color:${CYAN};">✦</span>&nbsp;&nbsp;<strong style="color:${INK};font-weight:600;">${titulo}.</strong> ${texto}
        </td>
      </tr>`;

    /* 🜂 v4 — BLOQUE DE TRANSMISIONES REESCRITO.
       Antes decía "Si durante tu ingreso no enlazaste tu correo, puedes
       activar ahora…". Quien crea su cuenta DESDE LA APP nunca vio esa
       casilla (el consentimiento al Nodo solo existe en el alta web), así
       que a la enorme mayoría el texto le hablaba de un paso inexistente.
       Ahora es una invitación limpia, sin referencias a nada previo. */
    const transmisionesBlock = isInNodo
      ? ""
      : `
            <tr>
              <td style="padding:26px 0 0 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td bgcolor="${CARD}" style="${lock(CARD)}border:1px solid rgba(0,229,255,0.22);border-radius:14px;padding:22px 22px;">
                      <div style="font-size:10px;letter-spacing:3.5px;color:${CYAN};text-transform:uppercase;margin-bottom:8px;">
                        ◈ Transmisiones
                      </div>
                      <div style="font-size:13.5px;color:${INK_SOFT};line-height:1.7;margin-bottom:16px;">
                        Cada tanto abrimos algo nuevo: una capa del Escáner, una meditación, una sesión en vivo. Si quieres que te lleguen, actívalas aquí. Puedes darte de baja cuando quieras.
                      </div>
                      <table border="0" cellpadding="0" cellspacing="0" align="left"><tbody><tr>
                        <td align="center" style="border-radius:9px;border:1px solid rgba(0,229,255,0.45);${lock("#08192B")}">
                          <a href="${subscribeLink}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11.5px;font-weight:600;letter-spacing:2px;color:${CYAN};text-decoration:none;text-transform:uppercase;">
                            Recibir las transmisiones
                          </a>
                        </td>
                      </tr></tbody></table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Tu acceso al Escáner Vibracional</title>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;${lock(BG)}">
  <!-- preheader oculto -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Tu cuenta quedó creada. El Escáner ya está abierto para ti.</div>
  <table width="100%" bgcolor="${BG}" cellpadding="0" cellspacing="0" border="0" role="presentation" style="${lock(BG)}">
    <tr>
      <td align="center" bgcolor="${BG}" style="${lock(BG)}padding:44px 18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${INK};">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">
          <tbody>

            <!-- HEADER · sello tipográfico, sin imágenes externas -->
            <tr>
              <td align="center" style="padding:0 0 8px 0;">
                <p style="margin:0 0 26px 0;font-size:11px;letter-spacing:7px;color:${INK_SOFT};text-transform:uppercase;">Escáner Vibracional</p>
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
                  <tr>
                    <td align="center" style="width:74px;height:74px;border:1px solid rgba(0,229,255,0.4);border-radius:50%;font-size:26px;color:${CYAN};line-height:74px;">✦</td>
                  </tr>
                </table>
                <div style="margin-top:26px;">
                  <span style="display:inline-block;font-size:13px;letter-spacing:5px;color:${GOLD};font-weight:600;white-space:nowrap;">◈&nbsp;&nbsp;ACCESO ABIERTO&nbsp;&nbsp;◈</span>
                </div>
                <p style="margin:12px 0 0 0;font-size:11px;letter-spacing:2.5px;color:${INK_SOFT};text-transform:uppercase;">Tu cuenta quedó creada</p>
              </td>
            </tr>

            <tr><td align="center" style="padding:24px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.35),transparent);width:82%;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>

            <!-- GREETING -->
            <tr>
              <td style="padding:0 8px;font-size:15px;line-height:1.8;color:${INK_SOFT};" align="left">
                <p style="margin:0 0 18px 0;font-size:18px;color:${INK};">
                  Tripulante <strong style="color:${GOLD};">${primerNombre}</strong>,
                </p>
                <p style="margin:0 0 16px 0;">
                  Bienvenido. Tu cuenta ya está activa y el Escáner Vibracional está abierto para ti.
                </p>
                <p style="margin:0 0 6px 0;">
                  El Escáner mide seis corrientes de tu vida: <strong style="color:${INK};">cuerpo, mente, emociones, abundancia, propósito y vínculos</strong>. Cada escaneo te devuelve una lectura de cómo estás en este momento, y un número que las resume: tu Índice de Luz.
                </p>
              </td>
            </tr>

            <!-- PRIMER PASO -->
            <tr>
              <td style="padding:26px 0 0 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td bgcolor="${CARD}" style="${lock(CARD)}border:1px solid rgba(0,229,255,0.3);border-radius:14px;padding:22px 22px;">
                      <div style="font-size:10px;letter-spacing:3.5px;color:${CYAN};text-transform:uppercase;margin-bottom:8px;">
                        ◈ Tu primer paso
                      </div>
                      <div style="font-size:15px;color:${INK};font-weight:600;margin-bottom:10px;">
                        Haz tu primer escaneo
                      </div>
                      <div style="font-size:13.5px;color:${INK_SOFT};line-height:1.7;">
                        Abre la app y entra al Radar. Vas a responder unas preguntas por cada corriente, y al cerrar las seis verás tu Índice de Luz por primera vez. Tu primer ciclo completo es libre.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- LO QUE VAS A ENCONTRAR -->
            <tr>
              <td style="padding:30px 8px 0 8px;" align="left">
                <div style="font-size:10px;letter-spacing:4px;color:${INK_SOFT};text-transform:uppercase;margin-bottom:10px;">
                  Lo que vas a encontrar adentro
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  ${capa("El Radar", "tus seis corrientes medidas, y cómo se mueven semana a semana.")}
                  ${capa("Decodificador de Alimentos", "apunta la cámara a lo que vas a comer y mira su frecuencia antes de que entre a tu cuerpo.")}
                  ${capa("Decodificador de Sueños", "escribe lo que soñaste y recíbelo traducido en lenguaje claro.")}
                  ${capa("El Espejo", "una presencia que conversa contigo desde tu vibración más alta.")}
                  ${capa("Tus capas de vuelo", "Bitácora, Plan de Vuelo, Rachas, Sendero de Luz y Realidad Elegida.")}
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:32px 0 8px 0;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tbody>
                    <tr>
                      <td align="center" style="border-radius:12px;background:linear-gradient(90deg,#D4AF37,#F3E5AB);">
                        <a href="${appStoreLink}" target="_blank" style="display:inline-block;padding:17px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#050505;text-decoration:none;text-transform:uppercase;border-radius:12px;">
                          ABRIR EL ESCÁNER
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style="margin:16px 0 0 0;font-size:11px;color:${MUTED};letter-spacing:1.5px;line-height:1.8;">
                  Si ya tienes la app instalada, ábrela y entra al Radar
                </p>
              </td>
            </tr>

            ${transmisionesBlock}

            <!-- CIERRE -->
            <tr>
              <td style="padding:30px 8px 0 8px;font-size:14px;color:${INK_SOFT};line-height:1.7;" align="left">
                <p style="margin:0 0 14px 0;color:${GOLD};font-weight:500;letter-spacing:0.04em;">Fricción cero.</p>
                <p style="margin:0;font-size:13px;color:${MUTED};letter-spacing:0.04em;">
                  Zak'Haar Solar<br>
                  <span style="font-size:11px;color:#42536A;">Escáner Vibracional</span>
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
                Escáner Vibracional &middot; creado por Red Solar Viva
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 18px 0 18px;font-size:10px;color:${MUTED};line-height:1.7;letter-spacing:0.04em;">
                <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:2px;color:#42536A;text-transform:uppercase;">Ajuste de señal</p>
                <p style="margin:0 0 6px 0;">
                  Recibes este correo porque creaste tu cuenta en el Escáner Vibracional.
                </p>
                <p style="margin:0;">
                  Si prefieres no recibir los resultados de tus escaneos ni los avisos de tu cuenta, puedes <a href="${unsubscribeLink}" style="color:${MUTED};text-decoration:underline;">darte de baja aquí</a>.
                </p>
              </td>
            </tr>

          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    /* ══════════════════════════════════════════════════════════════════
       🜂 v5 — LA CARTA DE LA CASA MADRE (tipo:"rsv_bienvenida")
       Misma gramática que la del Escáner (tablas, candado anti-Gmail,
       sello tipográfico, pie de baja) para que las dos se sientan de la
       misma casa; identidad propia: el ORO es el color rector (el Escáner
       es cian). Presenta a Red Solar Viva como el árbol donde nacen las
       creaciones, al Escáner como la creación estrella, y deja UNA promesa
       concreta: cuando algo nuevo nazca en la Red, te llega primero a ti.
       ══════════════════════════════════════════════════════════════════ */
    const landingEscaner = "https://escanervibracional.com";
    const htmlRsv = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Tu lugar en Red Solar Viva</title>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;${lock(BG)}">
  <!-- preheader oculto -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Estás en la Red. Cuando algo nuevo nazca aquí, te llega primero a ti.</div>
  <table width="100%" bgcolor="${BG}" cellpadding="0" cellspacing="0" border="0" role="presentation" style="${lock(BG)}">
    <tr>
      <td align="center" bgcolor="${BG}" style="${lock(BG)}padding:44px 18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${INK};">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">
          <tbody>

            <!-- HEADER · sello tipográfico dorado -->
            <tr>
              <td align="center" style="padding:0 0 8px 0;">
                <p style="margin:0 0 26px 0;font-size:11px;letter-spacing:7px;color:${INK_SOFT};text-transform:uppercase;">Red Solar Viva</p>
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
                  <tr>
                    <td align="center" style="width:74px;height:74px;border:1px solid rgba(212,168,67,0.5);border-radius:50%;font-size:26px;color:${GOLD};line-height:74px;">✦</td>
                  </tr>
                </table>
                <div style="margin-top:26px;">
                  <span style="display:inline-block;font-size:13px;letter-spacing:5px;color:${GOLD};font-weight:600;white-space:nowrap;">◈&nbsp;&nbsp;ESTÁS EN LA RED&nbsp;&nbsp;◈</span>
                </div>
                <p style="margin:12px 0 0 0;font-size:11px;letter-spacing:2.5px;color:${INK_SOFT};text-transform:uppercase;">Tu correo quedó enlazado</p>
              </td>
            </tr>

            <tr><td align="center" style="padding:24px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,67,0.4),transparent);width:82%;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>

            <!-- GREETING -->
            <tr>
              <td style="padding:0 8px;font-size:15px;line-height:1.8;color:${INK_SOFT};" align="left">
                <p style="margin:0 0 18px 0;font-size:18px;color:${INK};">
                  <strong style="color:${GOLD};">${primerNombre}</strong>, bienvenido a la Red.
                </p>
                <p style="margin:0 0 16px 0;">
                  Red Solar Viva es la casa donde nacen nuestras creaciones: herramientas, música, transmisiones y experiencias hechas para recordarte quién eres y elevar tu frecuencia.
                </p>
                <p style="margin:0 0 6px 0;">
                  Desde hoy tu correo está enlazado a la Red. Eso significa una sola cosa, y la cumplimos: <strong style="color:${INK};">cuando algo nuevo nazca aquí, te llega primero a ti</strong>. Sin ruido de relleno; solo lanzamientos y aperturas reales.
                </p>
              </td>
            </tr>

            <!-- LA CREACIÓN ESTRELLA -->
            <tr>
              <td style="padding:26px 0 0 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td bgcolor="${CARD}" style="${lock(CARD)}border:1px solid rgba(212,168,67,0.35);border-radius:14px;padding:22px 22px;">
                      <div style="font-size:10px;letter-spacing:3.5px;color:${GOLD};text-transform:uppercase;margin-bottom:8px;">
                        ◈ La creación estrella
                      </div>
                      <div style="font-size:15px;color:${INK};font-weight:600;margin-bottom:10px;">
                        El Escáner Vibracional
                      </div>
                      <div style="font-size:13.5px;color:${INK_SOFT};line-height:1.7;margin-bottom:16px;">
                        Tu terminal de telemetría biológica y espiritual: mide las seis corrientes de tu vida (cuerpo, mente, emociones, abundancia, propósito y vínculos) y te devuelve tu Índice de Luz. Es la primera nave de la Red, y crece cada semana.
                      </div>
                      <table border="0" cellpadding="0" cellspacing="0" align="left"><tbody><tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(90deg,#D4AF37,#F3E5AB);">
                          <a href="${landingEscaner}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:#050505;text-decoration:none;text-transform:uppercase;border-radius:12px;">
                            CONOCER EL ESCÁNER
                          </a>
                        </td>
                      </tr></tbody></table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- LO QUE VIENE POR LA RED -->
            <tr>
              <td style="padding:30px 8px 0 8px;" align="left">
                <div style="font-size:10px;letter-spacing:4px;color:${INK_SOFT};text-transform:uppercase;margin-bottom:10px;">
                  Lo que te va a llegar por aquí
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  ${capa("Aperturas del Escáner", "cada capa nueva de la nave, antes que nadie.")}
                  ${capa("Música y frecuencias", "las creaciones sonoras de la casa cuando vean la luz.")}
                  ${capa("Transmisiones", "sesiones y encuentros en vivo cuando se abran las compuertas.")}
                  ${capa("Lo que viene", "las próximas creaciones de la Red, contadas primero aquí.")}
                </table>
              </td>
            </tr>

            <!-- CIERRE -->
            <tr>
              <td style="padding:30px 8px 0 8px;font-size:14px;color:${INK_SOFT};line-height:1.7;" align="left">
                <p style="margin:0 0 14px 0;color:${GOLD};font-weight:500;letter-spacing:0.04em;">Nos vemos dentro.</p>
                <p style="margin:0;font-size:13px;color:${MUTED};letter-spacing:0.04em;">
                  Zak'Haar Solar<br>
                  <span style="font-size:11px;color:#42536A;">Red Solar Viva</span>
                </p>
              </td>
            </tr>

            <tr><td align="center" style="padding:26px 0 22px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,67,0.4),transparent);width:82%;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding:0 0 10px 0;">
                <p style="margin:0;font-size:12px;color:${MUTED};letter-spacing:4px;">NOS VEMOS EN LA RED ◈</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 0 12px 0;font-size:11px;color:#42536A;letter-spacing:1px;">
                redsolarviva.com
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 18px 0 18px;font-size:10px;color:${MUTED};line-height:1.7;letter-spacing:0.04em;">
                <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:2px;color:#42536A;text-transform:uppercase;">Ajuste de señal</p>
                <p style="margin:0 0 6px 0;">
                  Recibes este correo porque dejaste tu correo en redsolarviva.com.
                </p>
                <p style="margin:0;">
                  Si prefieres no recibir los avisos de la Red, puedes <a href="${unsubscribeLink}" style="color:${MUTED};text-decoration:underline;">darte de baja aquí</a>.
                </p>
              </td>
            </tr>

          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    /* La carta y el asunto que corresponden a esta rama. */
    const asunto = esBienvenidaRsv
      ? "Tu lugar en Red Solar Viva está abierto"
      : "Tu acceso al Escáner Vibracional está abierto";
    const htmlFinal = esBienvenidaRsv ? htmlRsv : htmlBody;

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

    /* v3 — Patrón resiliente para evitar retries de Clerk/Svix que
       multiplican emails (caso edmundospina@gmail.com 2026-04-27/28:
       8 retries, 4 emails enviados, mismo svix-id). El bug raíz era
       que logDispatch("sent") corría DESPUÉS del sendMail; si el RPC
       log_email_dispatch fallaba, el workflow tiraba excepción → 400
       → Svix retry → siguiente intento NO encontraba registro previo
       (porque nunca se logueó) → mandaba email otra vez. El nuevo
       flow:
         1. logDispatch("queued") ANTES del sendMail. Si se loguea
            exitoso, futuros retries lo atraparán por el dedupe de 24h.
         2. Cada logDispatch usa .catch(()=>null) para que NUNCA rompa
            el flow del workflow.
         3. Si email se envió, SIEMPRE responder 200 (aunque algo
            posterior falle). Clerk no debe retry: el email ya fue.
         4. Si sendMail falla antes de enviar, responder 500 para que
            Clerk retry — pero el dedupe queued atrapa retries que
            sucedieron tras un sendMail exitoso. */
    let emailSent = false;
    try {
      // 1. Pre-registro del intento (dedupe atrapa retries siguientes).
      await logDispatch("queued", null, { in_nodo: isInNodo }).catch(() => null);

      // 2. Send email.
      await transporter.sendMail({
        from: process.env.PROTON_SMTP_USER,
        to: email,
        subject: asunto,
        html: htmlFinal,
      });
      emailSent = true;
      console.log(
        `✅ BienvenidaNodo enviado a ${email} (carta=${emailType} in_nodo=${isInNodo})`
      );

      // 3. Actualizar status a "sent". Si falla, no rompe — el email ya fue.
      await logDispatch("sent", null, { in_nodo: isInNodo }).catch(() => null);

      // 4. Responder 200 — siempre que el email haya salido.
      try {
        await this.http.respond({
          status: 200,
          body: { ok: true, email, in_nodo: isInNodo },
        });
      } catch {}
      return { ok: true, email };
    } catch (err) {
      console.error(`❌ BienvenidaNodo fail ${email}: ${err.message}`);
      await logDispatch(
        emailSent ? "post_send_error" : "failed",
        err.message
      ).catch(() => null);

      /* Si el email YA se envió, respondemos 200 — Clerk no debe
         retry o se mandaría dos veces. Si NO se envió, respondemos
         500 para que retry; el dedupe queued atrapa el caso del retry
         siguiente al email exitoso de un attempt previo. */
      const httpStatus = emailSent ? 200 : 500;
      try {
        await this.http.respond({
          status: httpStatus,
          body: { ok: emailSent, error: err.message },
        });
      } catch {}
      return { ok: emailSent, error: err.message };
    }
  },
});
