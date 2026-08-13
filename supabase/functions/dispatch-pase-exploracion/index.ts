// dispatch-pase-exploracion v1.0 — el correo del Pase de Exploración, firmado
// =============================================================================
// AUDITORÍA · PARTE 4. Cierra el hueco P0 del workflow PaseExploracion.
//
// ── EL HUECO ────────────────────────────────────────────────────────────────
// El workflow de Pipedream que manda el correo del Pase de Exploración (y el de
// Ignición 1:1) no verificaba absolutamente nada. Su dirección vive en un
// property control del panel del Motor, así que sale del bundle publicado de la
// web con solo mirar la red. Con esa dirección, cualquiera mandaba un correo
// con la marca Red Solar Viva, a la dirección que quisiera, anunciando una
// sesión con la fecha y la hora que quisiera.
//
// ── POR QUÉ HACE FALTA ESTA FUNCIÓN ─────────────────────────────────────────
// El workflow tiene dos clientes legítimos:
//
//   1) `stripe-webhook` (source: "individual" y "manual" tras un pago). Corre en
//      el servidor y ya tiene acceso a los secretos → firma él mismo, sin pasar
//      por acá.
//
//   2) El panel del Motor (TN_Forms), que corre en el NAVEGADOR de Zak cuando
//      registra un pase a mano. Ese no puede firmar: poner el secreto en el
//      cliente lo regala igual que la dirección del webhook. Para eso existe
//      esta función: verifica que quien pide es admin de verdad (token de Clerk
//      contra el JWKS, no un id que viaje en el cuerpo) y recién entonces firma
//      y despacha.
//
// A diferencia de dispatch-ciclo-sellado, acá el correo del destinatario SÍ
// viene del cuerpo: es el dato que el admin está capturando en el formulario, y
// puede ser de alguien que todavía no tiene cuenta. La protección no es "que el
// destinatario sea uno mismo" sino "que quien dispara sea admin verificado".
//
// ── SECRETOS ────────────────────────────────────────────────────────────────
//   PIPEDREAM_BOOKING_WEBHOOK_URL  → la URL del workflow PaseExploracion
//   RSV_DISPATCH_SECRET            → la MISMA firma que ya usa el Ciclo Sellado
//
//   supabase secrets set PIPEDREAM_BOOKING_WEBHOOK_URL="https://....m.pipedream.net"
//   supabase functions deploy dispatch-pase-exploracion --no-verify-jwt

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

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
    return [...new Uint8Array(sig)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

/** Solo los dos grupos que existen. Cualquier otra cosa cae al de la mañana. */
function saneGroup(raw: unknown): "pulsar" | "cuasar" {
    return String(raw ?? "") === "cuasar" ? "cuasar" : "pulsar"
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

    const HOOK = Deno.env.get("PIPEDREAM_BOOKING_WEBHOOK_URL")
    const SECRET = Deno.env.get("RSV_DISPATCH_SECRET")
    if (!HOOK || !SECRET) {
        return json(500, { error: "missing_secrets" })
    }

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return json(400, { error: "invalid_json_body" })
    }

    // Admin verificado contra el JWKS de Clerk. El id sale del token firmado.
    const g = await gateAdmin(body?.token as string)
    if (!g.ok) return json(g.status ?? 401, { error: g.error })

    /* El correo se normaliza ANTES de firmar porque el workflow lo normaliza
       antes de verificar. Si un lado firmara el valor crudo con una mayúscula,
       las dos firmas nunca coincidirían y el correo legítimo saldría rechazado
       con 401 (ese fue el fallo #3 de la Parte 3, no repetirlo). */
    const email = String(body?.email ?? "").trim().toLowerCase()
    const eventStartTime = String(body?.event_start_time ?? "")
    if (!email || !eventStartTime) {
        return json(400, { error: "missing_email_or_start_time" })
    }

    const ts = Date.now()
    const canonical = `${email}|${eventStartTime}|${ts}`
    const sig = await hmacHex(SECRET, canonical)

    const payload = {
        source: "manual",
        name: String(body?.name ?? "").trim() || "Explorador",
        email,
        event_date: String(body?.event_date ?? ""),
        event_start_time: eventStartTime,
        group_name: saneGroup(body?.group_name),
        timezone: String(body?.timezone ?? "") || "America/Cancun",
        ts,
        _sig: sig,
    }

    try {
        const r = await fetch(HOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        return json(r.ok ? 200 : 502, { success: r.ok, upstream: r.status })
    } catch (e) {
        return json(502, {
            error: "dispatch_failed",
            detail: String((e as Error)?.message ?? e).slice(0, 120),
        })
    }
})
