// clerk-webhook v1.1
// v1.1 (2026-07-27) — AUDITORÍA PARTE 4: tras crear el perfil, despacha el
//        correo de bienvenida a Pipedream FIRMADO. La firma de Clerk (svix)
//        se valida acá, que es donde funciona; el workflow ya no la recibe.
//        ⚠️ Quitar el endpoint de Pipedream de la lista de webhooks de Clerk.
//        Secreto nuevo: PIPEDREAM_BIENVENIDA_WEBHOOK_URL.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Webhook } from "https://esm.sh/svix@1.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET")!

/* ── AUDITORÍA PARTE 4 · el correo de bienvenida pasa por acá ───────────────
   El workflow BienvenidaNodo de Pipedream aceptaba cualquier POST con forma de
   evento de Clerk, sin verificar nada: quien conociera su dirección mandaba un
   correo de bienvenida con nuestra marca a la dirección que quisiera, y de paso
   suscribía a esa persona al Nodo Central.

   La firma de Clerk (svix) se calcula sobre el cuerpo CRUDO, byte a byte, y el
   diagnóstico en vivo del 2026-07-27 mostró que Pipedream NO expone ese cuerpo
   crudo en este workflow (`rawLen=0`). O sea: allá dentro la firma de Clerk no
   se puede validar.

   Solución: la verificación ocurre ACÁ, que es donde ya funciona (este edge
   valida svix desde siempre y es quien crea el perfil), y desde acá se le avisa
   a Pipedream con NUESTRA firma HMAC, el mecanismo simple que ya está probado
   de punta a punta con el Ciclo Sellado.

   Zak debe QUITAR el endpoint de Pipedream de la lista de webhooks de Clerk:
   a partir de este deploy el aviso sale desde acá, y dejar los dos activos
   mandaría el correo de bienvenida por duplicado. */
const BIENVENIDA_HOOK = Deno.env.get("PIPEDREAM_BIENVENIDA_WEBHOOK_URL")
const RSV_DISPATCH_SECRET = Deno.env.get("RSV_DISPATCH_SECRET")

async function hmacHex(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Avisa a Pipedream, firmado. Best-effort: si falla, el perfil ya quedó bien. */
async function dispararBienvenida(
  email: string,
  fullName: string,
  clerkUserId: string,
  nodoConsent: boolean
) {
  if (!BIENVENIDA_HOOK || !RSV_DISPATCH_SECRET) {
    console.warn("⚠️ Bienvenida no despachada: falta PIPEDREAM_BIENVENIDA_WEBHOOK_URL o RSV_DISPATCH_SECRET")
    return
  }
  try {
    /* ⚠️ El correo se normaliza ANTES de firmar porque el workflow lo normaliza
       antes de verificar. Las dos cadenas tienen que ser byte-idénticas o el
       aviso legítimo sale rechazado (fallo #3 de la Parte 3). */
    const correo = email.trim().toLowerCase()
    const ts = Date.now()
    const sig = await hmacHex(RSV_DISPATCH_SECRET, `${correo}|${ts}`)
    const r = await fetch(BIENVENIDA_HOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: correo,
        full_name: fullName,
        clerk_user_id: clerkUserId,
        nodo_consent: nodoConsent,
        ts,
        _sig: sig,
      }),
    })
    console.log(`📧 Bienvenida despachada a Pipedream → ${r.status}`)
  } catch (e) {
    console.error("❌ Bienvenida no pudo despacharse:", e)
  }
}

serve(async (req: Request) => {
  console.log("🔥 Clerk webhook recibido")

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const payload = await req.text()
  const headers = req.headers

  try {
    const wh = new Webhook(webhookSecret)
    const evt = wh.verify(payload, {
      "svix-id": headers.get("svix-id")!,
      "svix-timestamp": headers.get("svix-timestamp")!,
      "svix-signature": headers.get("svix-signature")!,
    })

    console.log(`📨 Evento verificado: ${evt.type}`)

    if (evt.type !== "user.created" && evt.type !== "user.updated") {
      return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    /* AUDITORÍA PARTE 3 · anti-duplicados. El upsert de profiles ya es
       idempotente, pero link_guest_purchases no tiene definición versionada en
       el repo y no se pudo auditar: un reintento de Clerk podría duplicar
       vínculos de compras de invitado. El dedupe por svix-id lo cubre sin
       depender de esa incógnita. Fail-open. */
    try {
      const { data: primeraVez } = await supabase.rpc("webhook_event_seen", {
        p_source: "clerk",
        p_event_id: String(headers.get("svix-id") ?? ""),
      })
      if (primeraVez === false) {
        console.log(`↩️ Reintento de ${headers.get("svix-id")}: ya procesado`)
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
        })
      }
    } catch (e) {
      console.warn("[clerk-webhook] dedupe no disponible, se procesa:", e)
    }

    const userData = evt.data
    const clerkUserId = userData.id
    let email = (userData.email_addresses?.[0]?.email_address || "").toLowerCase().trim()
    let fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ")
    const avatarUrl = userData.image_url || ""

    /* SIWA a menudo manda user.updated con first/last vacíos y pisa un
       nombre que ya teníamos ("H B" → ""). Si Clerk no trae nombre o
       email, conservamos el de profiles. */
    const { data: existing } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle()
    if (!fullName && existing?.full_name) {
      fullName = String(existing.full_name)
      console.log(`🔒 Conservo full_name "${fullName}" (Clerk vino vacío)`)
    }
    if (!email && existing?.email) {
      email = String(existing.email).toLowerCase().trim()
      console.log(`🔒 Conservo email (Clerk vino vacío)`)
    }

    console.log(`📝 Intentando upsert: ${clerkUserId} | ${email} | Avatar: ${avatarUrl}`)

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(
        {
          clerk_user_id: clerkUserId,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_user_id" }
      )
      .select("id")
      .single()

    if (error) {
      console.error("❌ Error upsert:", error)
    } else {
      console.log(`✅ Perfil guardado/actualizado: ${profile?.id}`)
    }

    // Vincular compras guest
    if (profile && email) {
      const { data: linked } = await supabase.rpc("link_guest_purchases", {
        p_user_id: profile.id,
        p_email: email,
      })
      if (linked && linked > 0) console.log(`🔗 ${linked} compras vinculadas`)
    }

    /* AUDITORÍA PARTE 4 — el correo de bienvenida sale desde acá, firmado, y
       SOLO cuando la cuenta se acaba de crear (user.updated no lo dispara).
       El dedupe por svix-id de más arriba ya evita que un reintento de Clerk
       mande el correo dos veces. */
    if (evt.type === "user.created" && email) {
      await dispararBienvenida(
        email,
        fullName,
        clerkUserId,
        !!userData.unsafe_metadata?.nodoConsent
      )
    }
  } catch (err) {
    console.error("💥 Error de verificación:", err)
    return new Response("Invalid signature", { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})