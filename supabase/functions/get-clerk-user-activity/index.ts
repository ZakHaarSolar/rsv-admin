// Red Solar Viva · get-clerk-user-activity v1.3
// v1.3 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// =====================================================================
// v1.2 — Cuando target_user_id está presente, además del fetch a
// /v1/users/{id} consultamos /v1/sessions?user_id=X (todas las
// sesiones del usuario) y tomamos el `last_active_at` máximo. La
// "última actividad" en Clerk Dashboard es la de la SESIÓN del
// dispositivo, NO la del user object — que se queda en el momento
// del signup hasta que Clerk decide refrescarlo (suele tardar
// horas/días). Tomar de sessions da el dato live como lo ve el
// admin.
//
// v1.1 — Soporte de fetch individual: si el body trae `target_user_id`,
// la función llama `GET /v1/users/{id}` (data fresca del user
// específico) en lugar del listado paginado. El Motor lo usa al abrir
// el panel del Tripulante para refrescar `last_active_at` (que en el
// listado puede venir cacheado o null para algunas cuentas).
//
// v1.0 — Edge function admin-only que llama a la API de Clerk
// (GET /v1/users) y devuelve el `last_sign_in_at` + `last_active_at`
// + `created_at` de cada Tripulante. El Motor de Intervención lo
// consume en paralelo a `fetchTripulantes` para mostrar la fecha del
// último ingreso de cada Tripulante en el panel de detalle.
//
// Secret requerido: `CLERK_SECRET_KEY` (debe agregarse en Supabase
// Dashboard → Edge Functions → Secrets). Sin este secret el endpoint
// devuelve 500 con el detalle del fail.
//
// Despliegue:
//   supabase functions deploy get-clerk-user-activity --no-verify-jwt
//
// Request body (JSON):
//   { "admin_clerk_id": "<clerk_user_id del admin>" }
//
// Response success (200):
//   {
//     "users": [
//       { "clerk_user_id": "user_...", "last_sign_in_at": <ms epoch>|null,
//         "last_active_at": <ms epoch>|null, "created_at": <ms epoch> }
//     ]
//   }
//
// Response error (4xx/5xx):
//   { "error": "<motivo>" }
//
// Paginación: Clerk API devuelve max 500 users por request. Si el
// padrón crece >500, este endpoint pagina automáticamente con
// `offset` hasta agotar el dataset.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    }

    try {
        if (!CLERK_SECRET) {
            return new Response(
                JSON.stringify({
                    error:
                        "CLERK_SECRET_KEY no está configurado. Configurar en Supabase Dashboard → Edge Functions → Secrets.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const body = await req.json().catch(() => ({}))
        // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
        const _g = await gateAdmin(body?.token)
        if (!_g.ok) {
            return new Response(JSON.stringify({ error: _g.error }), {
                status: _g.status ?? 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        }
        const adminClerkId = _g.userId!

        /* Admin gate via service role + profiles.is_admin. */
        const { data: prof, error: profErr } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("clerk_user_id", adminClerkId)
            .single()

        if (profErr) {
            return new Response(
                JSON.stringify({
                    error: `profile lookup fail: ${profErr.message}`,
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        if (!prof?.is_admin) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                {
                    status: 403,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        /* v1.1 — Fetch individual fresco si target_user_id está
           presente. v1.2: consulta también /v1/sessions del user
           para obtener el last_active_at REAL del dispositivo. */
        const targetUserId = body?.target_user_id
        if (
            targetUserId &&
            typeof targetUserId === "string" &&
            targetUserId.trim().length > 0
        ) {
            // 1. User object base
            const r = await fetch(
                `https://api.clerk.com/v1/users/${encodeURIComponent(targetUserId)}`,
                {
                    headers: {
                        Authorization: `Bearer ${CLERK_SECRET}`,
                        "Content-Type": "application/json",
                    },
                }
            )
            if (!r.ok) {
                const text = await r.text()
                return new Response(
                    JSON.stringify({
                        error: `Clerk API HTTP ${r.status}: ${text.slice(0, 200)}`,
                    }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }
            const u: any = await r.json()

            // 2. v1.2 — Sesiones del user (para last_active_at real
            //    como Clerk Dashboard lo muestra). Cualquier estado
            //    (active, ended, expired, removed) — tomamos el max
            //    last_active_at de todas. Si la API falla, caemos al
            //    last_active_at del user object.
            let sessionMaxActive = 0
            /* 🜂 v1.5 — DE DÓNDE ENTRA (Zak 2026-08-06). Clerk guarda, por
               sesión, la ciudad/país/IP y el navegador que vio. Se toma la
               sesión MÁS RECIENTE y se devuelve tal cual, sin interpretarla:
               el panel la muestra con la advertencia de que en el escritorio
               web lo que Clerk ve es NUESTRO servidor (Ashburn, Virginia),
               no a la persona. Decir "Ashburn" sin esa nota sería peor que
               no decir nada. */
            let ubic: Record<string, unknown> | null = null
            let ubicAt = 0
            try {
                const sr = await fetch(
                    `https://api.clerk.com/v1/sessions?user_id=${encodeURIComponent(targetUserId)}&limit=20`,
                    {
                        headers: {
                            Authorization: `Bearer ${CLERK_SECRET}`,
                            "Content-Type": "application/json",
                        },
                    }
                )
                if (sr.ok) {
                    const sessions: any = await sr.json()
                    const arr = Array.isArray(sessions) ? sessions : []
                    for (const s of arr) {
                        if (typeof s?.last_active_at === "number") {
                            if (s.last_active_at > sessionMaxActive) {
                                sessionMaxActive = s.last_active_at
                            }
                        }
                        const la = s?.latest_activity
                        const cuando =
                            typeof s?.last_active_at === "number"
                                ? s.last_active_at
                                : 0
                        if (la && cuando >= ubicAt) {
                            ubicAt = cuando
                            ubic = {
                                city: la.city ?? null,
                                country: la.country ?? null,
                                ip: la.ip_address ?? null,
                                browser: la.browser_name ?? null,
                                browser_version: la.browser_version ?? null,
                                device_type: la.device_type ?? null,
                                is_mobile: la.is_mobile ?? null,
                                at: cuando || null,
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn(
                    "[get-clerk-user-activity] sessions fetch fail:",
                    e
                )
            }

            const userActiveAt =
                typeof u?.last_active_at === "number"
                    ? u.last_active_at
                    : null
            // Tomamos el max: sesiones suelen ser más recientes; user
            // suele quedar atrás. Pero si por algún motivo user > sessions
            // (raro), respetamos el más alto.
            const finalActiveAt =
                Math.max(sessionMaxActive, userActiveAt || 0) || null

            return new Response(
                JSON.stringify({
                    users: [
                        {
                            clerk_user_id: u?.id || targetUserId,
                            last_sign_in_at:
                                typeof u?.last_sign_in_at === "number"
                                    ? u.last_sign_in_at
                                    : null,
                            last_active_at: finalActiveAt,
                            session_last_active_at:
                                sessionMaxActive || null,
                            user_last_active_at: userActiveAt,
                            created_at:
                                typeof u?.created_at === "number"
                                    ? u.created_at
                                    : null,
                            /* 🜂 v1.4 — Foto de perfil (la de Google al
                               identificarse, o la que el Tripulante cargó).
                               El Motor la muestra SOLO si el admin lo pide
                               con un botón; el panel nace con la geometría
                               de siempre. Clerk sirve una imagen genérica
                               cuando no hay foto real: `has_image` distingue
                               una de otra para no pintar un placeholder
                               como si fuera su cara. */
                            image_url:
                                typeof u?.image_url === "string"
                                    ? u.image_url
                                    : null,
                            has_image: u?.has_image === true,
                            /* v1.5 — Ciudad/país/IP/navegador de la sesión
                               más reciente, tal como Clerk los vio. */
                            ubicacion: ubic,
                        },
                    ],
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        /* Fetch paginado de todos los users de Clerk. */
        const allUsers: Array<{
            clerk_user_id: string
            last_sign_in_at: number | null
            last_active_at: number | null
            created_at: number | null
        }> = []
        let offset = 0
        const limit = 500
        const MAX_PAGES = 20 // safety: hasta 10k users

        for (let page = 0; page < MAX_PAGES; page++) {
            const r = await fetch(
                `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${CLERK_SECRET}`,
                        "Content-Type": "application/json",
                    },
                }
            )

            if (!r.ok) {
                const text = await r.text()
                console.error(
                    `[get-clerk-user-activity] Clerk API ${r.status}: ${text.slice(0, 300)}`
                )
                return new Response(
                    JSON.stringify({
                        error: `Clerk API HTTP ${r.status}: ${text.slice(0, 200)}`,
                    }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }

            const batch = await r.json()
            if (!Array.isArray(batch)) {
                console.error(
                    "[get-clerk-user-activity] respuesta no es array:",
                    batch
                )
                break
            }
            if (batch.length === 0) break

            for (const u of batch) {
                if (!u?.id) continue
                allUsers.push({
                    clerk_user_id: u.id,
                    last_sign_in_at:
                        typeof u.last_sign_in_at === "number"
                            ? u.last_sign_in_at
                            : null,
                    last_active_at:
                        typeof u.last_active_at === "number"
                            ? u.last_active_at
                            : null,
                    created_at:
                        typeof u.created_at === "number"
                            ? u.created_at
                            : null,
                })
            }

            if (batch.length < limit) break
            offset += limit
        }

        console.log(
            `[get-clerk-user-activity] ${allUsers.length} users devueltos`
        )

        return new Response(JSON.stringify({ users: allUsers }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        })
    } catch (e: any) {
        console.error("[get-clerk-user-activity] error:", e?.message || e)
        return new Response(
            JSON.stringify({ error: String(e?.message || e) }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        )
    }
})
