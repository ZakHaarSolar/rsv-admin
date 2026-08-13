// Red Solar Viva · send-push v1.2 — RAMA FCM (Android): los push_tokens se parten
// por plataforma; los iOS van a APNs (igual que siempre) y los Android a FCM
// HTTP v1 (service account de Firebase → access token OAuth2 cacheado ~50 min →
// POST a fcm.googleapis.com). Cada rama es independiente: si FCM no está
// configurado, iOS sigue saliendo (y viceversa). Poda FCM: UNREGISTERED /
// NOT_FOUND / SENDER_ID_MISMATCH.
// v1.1 — las claves de data (type/conversation_id) van al TOP-LEVEL del payload
// (no anidadas bajo "data") → al tocar el push, Capacitor las da en
// notification.data.type y la app navega bien (DM → Mensajes, no al Radar).
// v1.0 — entrega notificaciones push a APNs (iOS).
// =====================================================================
// La llaman SOLO desde el servidor (la helper SQL _push_dispatch vía pg_net, en
// el trigger de DM y en el cron del Radar). Se protege con un secreto compartido
// (header x-dispatch-secret == env PUSH_DISPATCH_SECRET) — NO usa el JWT de
// Supabase, por eso se despliega con --no-verify-jwt.
//
// Flujo: { clerk_user_id, title, body, data?, badge? } → busca los push_tokens
// del Tripulante → iOS: JWT ES256 con la .p8 de APNs → POST por token → poda
// muertos. Android: access token del service account → POST FCM v1 por token →
// poda muertos.
//
// Secrets (supabase secrets set ...):
//   PUSH_DISPATCH_SECRET  — el mismo valor que el vault `push_dispatch_secret`.
//   APNS_KEY_ID           — Key ID de la APNs Auth Key (.p8).
//   APNS_TEAM_ID          — Apple Team ID.
//   APNS_P8               — contenido de la .p8 (PEM PKCS8). \n literales o reales.
//   APNS_BUNDLE_ID        — opcional, default com.redsolarviva.escaner.
//   APNS_HOST             — opcional, default api.sandbox.push.apple.com
//                           (PRODUCCIÓN/TestFlight/App Store: api.push.apple.com).
//   FCM_SERVICE_ACCOUNT   — JSON COMPLETO del service account de Firebase
//                           (Consola Firebase → Configuración del proyecto →
//                           Cuentas de servicio → Generar nueva clave privada).
//                           Setear: supabase secrets set FCM_SERVICE_ACCOUNT="$(cat archivo.json)"
//   SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY — leer/podar push_tokens.
// Despliegue: supabase functions deploy send-push --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.9.6"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const DISPATCH_SECRET = Deno.env.get("PUSH_DISPATCH_SECRET") || ""
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID") || ""
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID") || ""
const APNS_P8_RAW = Deno.env.get("APNS_P8") || ""
const APNS_BUNDLE_ID =
    Deno.env.get("APNS_BUNDLE_ID") || "com.redsolarviva.escaner"
const APNS_HOST = Deno.env.get("APNS_HOST") || "api.sandbox.push.apple.com"
const FCM_SERVICE_ACCOUNT_RAW = Deno.env.get("FCM_SERVICE_ACCOUNT") || ""

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-dispatch-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

// Comparación en tiempo (cuasi) constante para el secreto.
function safeEqual(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) return false
    let out = 0
    for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return out === 0
}

// ── JWT de APNs (cacheado: Apple rechaza tokens con iat > 1h y limita la tasa
//    de generación de tokens nuevos). Re-firmamos cada ~50 min. ──
let cachedJwt = ""
let cachedAt = 0
let cachedKey: CryptoKey | null = null

async function apnsJwt(): Promise<string> {
    const nowMs = Date.now()
    if (cachedJwt && nowMs - cachedAt < 50 * 60 * 1000) return cachedJwt
    if (!cachedKey) {
        const pem = APNS_P8_RAW.replace(/\\n/g, "\n").trim()
        cachedKey = (await importPKCS8(pem, "ES256")) as CryptoKey
    }
    cachedJwt = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: APNS_KEY_ID })
        .setIssuer(APNS_TEAM_ID)
        .setIssuedAt()
        .sign(cachedKey)
    cachedAt = nowMs
    return cachedJwt
}

// ── Access token de FCM (HTTP v1) — JWT RS256 del service account
//    intercambiado en oauth2.googleapis.com; cacheado ~50 min (Google
//    lo emite con 1h de vida). ──
interface FcmServiceAccount {
    client_email: string
    private_key: string
    project_id: string
}
let fcmSA: FcmServiceAccount | null = null
let fcmKey: CryptoKey | null = null
let fcmAccessToken = ""
let fcmTokenAt = 0

function fcmServiceAccount(): FcmServiceAccount {
    if (!fcmSA) {
        fcmSA = JSON.parse(FCM_SERVICE_ACCOUNT_RAW) as FcmServiceAccount
        if (!fcmSA?.client_email || !fcmSA?.private_key || !fcmSA?.project_id) {
            throw new Error("FCM_SERVICE_ACCOUNT incompleto")
        }
    }
    return fcmSA
}

async function fcmToken(): Promise<string> {
    const nowMs = Date.now()
    if (fcmAccessToken && nowMs - fcmTokenAt < 50 * 60 * 1000) {
        return fcmAccessToken
    }
    const sa = fcmServiceAccount()
    if (!fcmKey) {
        const pem = sa.private_key.replace(/\\n/g, "\n").trim()
        fcmKey = (await importPKCS8(pem, "RS256")) as CryptoKey
    }
    const assertion = await new SignJWT({
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuer(sa.client_email)
        .setAudience("https://oauth2.googleapis.com/token")
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(fcmKey)
    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
        }).toString(),
    })
    const j = await resp.json().catch(() => null)
    if (!resp.ok || !j?.access_token) {
        throw new Error(`fcm_token_failed: ${JSON.stringify(j)}`)
    }
    fcmAccessToken = j.access_token as string
    fcmTokenAt = nowMs
    return fcmAccessToken
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    // Gate por secreto compartido.
    const provided = req.headers.get("x-dispatch-secret") || ""
    if (!DISPATCH_SECRET || !safeEqual(provided, DISPATCH_SECRET)) {
        return json({ error: "unauthorized" }, 401)
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return json({ error: "bad_json" }, 400)
    }

    const clerkUserId = String(body?.clerk_user_id || "").trim()
    const title = String(body?.title || "Red Solar Viva")
    const text = String(body?.body || "")
    const data =
        body?.data && typeof body.data === "object" ? body.data : {}
    if (!clerkUserId) return json({ error: "no_user" }, 400)

    // Tokens del Tripulante — TODAS las plataformas; cada rama filtra la suya.
    const { data: rows, error } = await supabase
        .from("push_tokens")
        .select("token, platform")
        .eq("clerk_user_id", clerkUserId)
    if (error) return json({ error: "db_error", detail: error.message }, 500)

    const iosTokens = (rows || [])
        .filter((r: any) => (r.platform || "ios") === "ios")
        .map((r: any) => r.token as string)
    const androidTokens = (rows || [])
        .filter((r: any) => r.platform === "android")
        .map((r: any) => r.token as string)
    if (iosTokens.length === 0 && androidTokens.length === 0) {
        return json({ ok: true, sent: 0 })
    }

    let sentIos = 0
    let sentAndroid = 0
    const stale: string[] = []
    // Ramas degradadas (sin secretos / firma fallida) — se reportan sin
    // tumbar a la otra plataforma.
    const skipped: string[] = []

    // ── iOS → APNs ────────────────────────────────────────────────────
    if (iosTokens.length > 0) {
        let jwt = ""
        if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_P8_RAW) {
            skipped.push("apns_not_configured")
        } else {
            try {
                jwt = await apnsJwt()
            } catch (e) {
                skipped.push(`apns_jwt_failed: ${String(e)}`)
            }
        }
        if (jwt) {
            // Las claves personalizadas (type, conversation_id) van al TOP-LEVEL
            // del payload, NO anidadas bajo "data": así Capacitor las expone en
            // notification.data directamente (notification.data.type) al tocar
            // el push.
            const payload = JSON.stringify({
                // data PRIMERO, aps DESPUÉS: la clave reservada "aps" siempre
                // gana, aunque un futuro caller incluyera por error un "aps".
                ...(data && typeof data === "object" ? data : {}),
                aps: {
                    alert: { title, body: text },
                    sound: "default",
                    ...(typeof body?.badge === "number"
                        ? { badge: body.badge }
                        : {}),
                },
            })
            await Promise.all(
                iosTokens.map(async (deviceToken) => {
                    try {
                        const resp = await fetch(
                            `https://${APNS_HOST}/3/device/${deviceToken}`,
                            {
                                method: "POST",
                                headers: {
                                    authorization: `bearer ${jwt}`,
                                    "apns-topic": APNS_BUNDLE_ID,
                                    "apns-push-type": "alert",
                                    "apns-priority": "10",
                                },
                                body: payload,
                            }
                        )
                        if (resp.status === 200) {
                            sentIos++
                            return
                        }
                        // 410 = token de un dispositivo que desinstaló; 400
                        // BadDeviceToken = token inválido para este entorno
                        // → podarlo.
                        let reason = ""
                        try {
                            reason = (await resp.json())?.reason || ""
                        } catch {
                            /* sin cuerpo */
                        }
                        if (
                            resp.status === 410 ||
                            reason === "BadDeviceToken" ||
                            reason === "Unregistered" ||
                            reason === "DeviceTokenNotForTopic"
                        ) {
                            stale.push(deviceToken)
                        }
                    } catch {
                        /* error de red puntual → reintenta el próximo disparo */
                    }
                })
            )
        }
    }

    // ── Android → FCM HTTP v1 ────────────────────────────────────────
    if (androidTokens.length > 0) {
        let accessToken = ""
        let projectId = ""
        if (!FCM_SERVICE_ACCOUNT_RAW) {
            skipped.push("fcm_not_configured")
        } else {
            try {
                accessToken = await fcmToken()
                projectId = fcmServiceAccount().project_id
            } catch (e) {
                skipped.push(`fcm_token_failed: ${String(e)}`)
            }
        }
        if (accessToken && projectId) {
            // FCM exige data plana con valores STRING. En Android el plugin
            // entrega esta data en notification.data al tocar el push —
            // mismo shape que iOS (type/conversation_id al top-level).
            const dataStr: Record<string, string> = {}
            for (const [k, v] of Object.entries(
                data as Record<string, unknown>
            )) {
                if (v === null || v === undefined) continue
                dataStr[k] = typeof v === "string" ? v : JSON.stringify(v)
            }
            await Promise.all(
                androidTokens.map(async (deviceToken) => {
                    try {
                        const resp = await fetch(
                            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
                            {
                                method: "POST",
                                headers: {
                                    authorization: `Bearer ${accessToken}`,
                                    "content-type": "application/json",
                                },
                                body: JSON.stringify({
                                    message: {
                                        token: deviceToken,
                                        notification: {
                                            title,
                                            body: text,
                                        },
                                        data: dataStr,
                                        android: {
                                            priority: "HIGH",
                                            notification: {
                                                // Canal que crea push.ts v1.2
                                                // (importancia alta, heads-up).
                                                channel_id: "rsv_push",
                                                sound: "default",
                                                // El contador del ícono (badge
                                                // de no-leídos, como en iOS).
                                                ...(typeof body?.badge ===
                                                "number"
                                                    ? {
                                                          notification_count:
                                                              body.badge,
                                                      }
                                                    : {}),
                                            },
                                        },
                                    },
                                }),
                            }
                        )
                        if (resp.ok) {
                            sentAndroid++
                            return
                        }
                        // UNREGISTERED / NOT_FOUND = desinstaló o token
                        // rotado; SENDER_ID_MISMATCH = token de otro proyecto
                        // Firebase → podar.
                        let status = ""
                        let errorCode = ""
                        try {
                            const ej = await resp.json()
                            status = ej?.error?.status || ""
                            errorCode =
                                (ej?.error?.details || []).find(
                                    (d: any) => d?.errorCode
                                )?.errorCode || ""
                        } catch {
                            /* sin cuerpo */
                        }
                        if (
                            resp.status === 404 ||
                            status === "NOT_FOUND" ||
                            errorCode === "UNREGISTERED" ||
                            errorCode === "SENDER_ID_MISMATCH"
                        ) {
                            stale.push(deviceToken)
                        }
                    } catch {
                        /* error de red puntual → reintenta el próximo disparo */
                    }
                })
            )
        }
    }

    if (stale.length > 0) {
        await supabase.from("push_tokens").delete().in("token", stale)
    }

    return json({
        ok: true,
        sent: sentIos + sentAndroid,
        ios: sentIos,
        android: sentAndroid,
        pruned: stale.length,
        ...(skipped.length > 0 ? { skipped } : {}),
    })
})
