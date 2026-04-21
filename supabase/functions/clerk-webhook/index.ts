import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Webhook } from "https://esm.sh/svix@1.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET")!

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

    const userData = evt.data
    const clerkUserId = userData.id
    const email = (userData.email_addresses?.[0]?.email_address || "").toLowerCase().trim()
    const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ")
    const avatarUrl = userData.image_url || ""

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
  } catch (err) {
    console.error("💥 Error de verificación:", err)
    return new Response("Invalid signature", { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})