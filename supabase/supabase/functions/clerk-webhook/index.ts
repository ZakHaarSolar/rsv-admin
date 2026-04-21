import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req: Request) => {
  console.log("🔥 Clerk webhook recibido")

  if (req.method !== "POST") {
    console.log("❌ Método no permitido")
    return new Response("Method not allowed", { status: 405 })
  }

  const authHeader = req.headers.get("authorization")
  const expectedToken = Deno.env.get("CLERK_WEBHOOK_TOKEN")

  if (authHeader !== `Bearer ${expectedToken}`) {
    console.log("❌ Token inválido")
    return new Response("Unauthorized", { status: 401 })
  }

  const payload = await req.json()
  const eventType = payload.type
  console.log(`📨 Evento recibido: ${eventType}`)

  if (eventType !== "user.created" && eventType !== "user.updated") {
    console.log("⚠️ Evento ignorado (no es user.created ni user.updated)")
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  const userData = payload.data
  console.log("👤 Datos del usuario:", JSON.stringify({
    id: userData.id,
    email: userData.email_addresses?.[0]?.email_address,
    image_url: userData.image_url,
  }))

  const clerkUserId = userData.id
  const email = (userData.email_addresses?.[0]?.email_address || "").toLowerCase().trim()
  const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ")
  const avatarUrl = userData.image_url || ""

  console.log(`📝 Intentando upsert: ${clerkUserId} | ${email} | Avatar: ${avatarUrl}`)

  try {
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
      console.error("❌ Error en upsert:", error)
      throw error
    }

    console.log(`✅ Perfil upsert exitoso: ${profile?.id}`)

    if (profile && email) {
      const { data: linked, error: linkError } = await supabase.rpc("link_guest_purchases", {
        p_user_id: profile.id,
        p_email: email,
      })
      if (linkError) console.error("❌ Error en link_guest_purchases:", linkError)
      else if (linked && linked > 0) console.log(`🔗 ${linked} compras vinculadas`)
    }
  } catch (err) {
    console.error("💥 Error general en el webhook:", err)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})