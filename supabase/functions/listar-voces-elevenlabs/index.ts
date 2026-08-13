// admin/supabase/functions/listar-voces-elevenlabs/index.ts v1.1
// v1.1 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// ---------------------------------------------------------------
// Atelier · Estudio Manual — lista las voces disponibles en la cuenta de
// ElevenLabs (predefinidas + clonadas) para el selector del panel.
//
//   POST { admin_clerk_id }  →  { voices: [{ voice_id, name, labels }] }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy listar-voces-elevenlabs --no-verify-jwt
//
// Secrets: ELEVENLABS_API_KEY (NUEVO) · SUPABASE_URL · SUPABASE_ANON_KEY

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function checkAdmin(
    url: string,
    anonKey: string,
    clerkUserId: string
): Promise<boolean> {
    const res = await fetch(`${url}/rest/v1/rpc/get_profile_by_clerk_id`, {
        method: "POST",
        headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
            Prefer: "params=single-object",
        },
        body: JSON.stringify({ p_clerk_id: clerkUserId }),
    })
    if (!res.ok) return false
    const profile: any = await res.json()
    return Boolean(profile?.is_admin)
}

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")

    const missing: string[] = []
    if (!ELEVENLABS_API_KEY) missing.push("ELEVENLABS_API_KEY")
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY")
    if (missing.length) {
        return jsonResponse(500, { error: "missing_secrets", missing })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }
    let adminClerkId = ""

    // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    try {
        const r = await fetch("https://api.elevenlabs.io/v1/voices", {
            headers: { "xi-api-key": ELEVENLABS_API_KEY! },
        })
        if (!r.ok) {
            const txt = await r.text()
            return jsonResponse(502, {
                error: "elevenlabs_voices_failed",
                status: r.status,
                detail: txt.slice(0, 300),
            })
        }
        const data: any = await r.json()
        const voices = (Array.isArray(data?.voices) ? data.voices : []).map(
            (v: any) => ({
                voice_id: v?.voice_id,
                name: v?.name,
                category: v?.category ?? null,
                labels: v?.labels ?? {},
                preview_url: v?.preview_url ?? null,
            })
        )
        return jsonResponse(200, { voices })
    } catch (err: any) {
        return jsonResponse(502, {
            error: "elevenlabs_unreachable",
            detail: String(err?.message ?? err),
        })
    }
})
