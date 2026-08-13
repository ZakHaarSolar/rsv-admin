// dispatch-ciclo-sellado v1.0 — el correo de cierre de ciclo, ahora firmado
// =============================================================================
// AUDITORÍA · PARTE 3. Decisión de Zak (2026-07-27): cerrar el endpoint.
//
// ── EL HUECO ────────────────────────────────────────────────────────────────
// Hasta hoy la app llamaba DIRECTO al webhook de Pipedream, y ese webhook no
// verificaba nada. Dos problemas encadenados:
//   1) la dirección del webhook viaja incrustada en el paquete de la app
//      (EV_Shared, y también en el JS compilado que va dentro del binario de
//      iOS y Android), así que se obtiene abriendo el bundle o mirando la red;
//   2) el correo, el nombre, el Índice de Luz y los seis puntajes salían del
//      cuerpo del request. Cualquiera podía mandar un correo con la marca Red
//      Solar Viva, a la dirección que quisiera, con el contenido que quisiera.
//
// ── POR QUÉ NO SE FIRMA DESDE LA APP ────────────────────────────────────────
// Poner el secreto en el cliente no arregla nada: se extrae del paquete igual
// de fácil que la dirección. La firma tiene que nacer en un servidor nuestro.
// Por eso la app pasa a llamar a ESTA función, que verifica la sesión de Clerk,
// resuelve los datos de la persona CONTRA LA BASE (no contra el cuerpo del
// request) y recién entonces firma y despacha.
//
// Resultado: el contenido del correo deja de ser dictado por quien llama.
// Aunque alguien descubra la dirección de esta función, sin una sesión válida
// no pasa del gate, y con una sesión válida solo puede provocar SU propio
// correo, con SUS propios datos.
//
// ── SECRETOS NUEVOS ─────────────────────────────────────────────────────────
//   PIPEDREAM_CICLO_SELLADO_URL  → la URL del workflow (sale del bundle)
//   RSV_DISPATCH_SECRET    → la firma compartida con el workflow
//
//   supabase secrets set PIPEDREAM_CICLO_SELLADO_URL="https://....m.pipedream.net"
//   supabase secrets set RSV_DISPATCH_SECRET="<cadena larga al azar>"
//   supabase functions deploy dispatch-ciclo-sellado --no-verify-jwt

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateUser } from "../_shared/clerkAuth.ts"

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

const PILARES = [
    "fisico",
    "mental",
    "emocional",
    "financiero",
    "vector",
    "orbita",
] as const

/** Solo números 0..100. Cualquier otra cosa se descarta. */
function saneScores(raw: unknown): Record<string, number> {
    const out: Record<string, number> = {}
    if (!raw || typeof raw !== "object") return out
    for (const p of PILARES) {
        const v = (raw as Record<string, unknown>)[p]
        const n = typeof v === "number" ? v : Number(v)
        if (Number.isFinite(n)) out[p] = Math.max(0, Math.min(100, Math.round(n)))
    }
    return out
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

/** Cota: el correo de cierre de ciclo es 1 por semana por persona. */
async function reserveSpend(userKey: string, ip: string): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return true
    try {
        const r = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: "ciclo-sellado",
                p_user_key: userKey,
                p_ip: ip,
                p_cost: 1,
                p_user_limit: 5,
                p_user_window_seconds: 86400,
                p_ip_limit: 20,
                p_ip_window_seconds: 86400,
            }),
        })
        if (!r.ok) return true
        const j = await r.json().catch(() => null)
        return j?.ok !== false
    } catch {
        return true
    }
}

/** Correo y nombre salen de la BASE, nunca del cuerpo del request. */
async function readProfile(
    clerkId: string
): Promise<{ email: string; full_name: string } | null> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return null
    try {
        const r = await fetch(
            `${supaUrl}/rest/v1/profiles?select=email,full_name&clerk_user_id=eq.${encodeURIComponent(
                clerkId
            )}&limit=1`,
            {
                headers: {
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                },
            }
        )
        if (!r.ok) return null
        const rows = await r.json().catch(() => null)
        const row = Array.isArray(rows) ? rows[0] : null
        if (!row?.email) return null
        return { email: String(row.email), full_name: String(row.full_name ?? "") }
    } catch {
        return null
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

    const HOOK = Deno.env.get("PIPEDREAM_CICLO_SELLADO_URL")
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

    // Sesión de Clerk verificada contra el JWKS. El id sale del token firmado.
    const g = await gateUser(body?.token as string)
    if (!g.ok) return json(g.status ?? 401, { error: g.error })
    const clerkUserId = g.userId!

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("cf-connecting-ip") ??
        ""
    if (!(await reserveSpend(clerkUserId, ip))) {
        return json(429, { error: "rate_limited" })
    }

    const prof = await readProfile(clerkUserId)
    if (!prof) return json(404, { error: "profile_not_found" })

    const cycleTs = Number(body?.cycle_ts)
    const scores = saneScores(body?.scores)
    let indice = Number(body?.indice)
    if (!Number.isFinite(indice)) {
        const vals = Object.values(scores)
        indice = vals.length
            ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            : 0
    }
    indice = Math.max(0, Math.min(100, Math.round(indice)))

    /* La firma va DENTRO del payload, no en un header, y cubre una cadena
       canónica de tres campos. Así el workflow la valida con el cuerpo ya
       parseado: no hace falta pasarlo a modo "Raw Request" ni pelear con el
       array aplanado de headers de Pipedream. `ts` le pone ventana: una firma
       capturada caduca en diez minutos. */
    const ts = Date.now()
    /* ⚠️ El correo se normaliza ANTES de firmar porque el workflow lo
       normaliza antes de verificar (`(body.email||"").trim().toLowerCase()`).
       Si acá firmáramos el valor crudo de la base y ese valor tuviera una sola
       mayúscula, las dos firmas nunca coincidirían y el correo legítimo sería
       rechazado con 401. Ambos lados tienen que firmar EXACTAMENTE la misma
       cadena. */
    const emailFirma = prof.email.trim().toLowerCase()
    const canonical = `${clerkUserId}|${emailFirma}|${ts}`
    const sig = await hmacHex(SECRET, canonical)

    const payload = {
        clerk_user_id: clerkUserId,
        email: emailFirma,
        full_name: prof.full_name,
        indice,
        scores,
        fecha: new Date(
            Number.isFinite(cycleTs) ? cycleTs : Date.now()
        ).toISOString(),
        ts,
        _sig: sig,
    }

    try {
        const r = await fetch(HOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        return json(r.ok ? 200 : 502, {
            success: r.ok,
            upstream: r.status,
        })
    } catch (e) {
        return json(502, {
            error: "dispatch_failed",
            detail: String((e as Error)?.message ?? e).slice(0, 120),
        })
    }
})
