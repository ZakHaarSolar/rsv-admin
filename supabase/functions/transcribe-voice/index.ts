// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/transcribe-voice/index.ts v1.0
// v1.0 — TRANSCRIPCIÓN de notas de voz del chat (para Sintonía/Inmersión).
//        El cliente manda { token, message_id }. Flujo:
//        1. gateUser → clerk id verificado.
//        2. RPC transcribe_voice_check (service_role): participante + miembro +
//           media_url descifrado + transcript existente + cap mensual restante.
//           · si ya hay transcript → se devuelve (sin gastar, sin tocar el cap).
//           · si cap_left <= 0 → { error: 'cap_reached' }.
//        3. baja el audio de R2 → base64 → Gemini (cascada de modelos nombrados,
//           thinkingBudget 0) lo transcribe verbatim.
//        4. RPC set_voice_transcript → lo guarda CIFRADO + suma 1 al cap.
//
//   POST { token, message_id }  →  { transcript }  |  { error }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy transcribe-voice --no-verify-jwt
//
// Secrets: GEMINI_API_KEY · CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"

declare const Deno: any

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

/* Cascada de modelos NOMBRADOS (el alias gemini-flash-latest está saturado). */
const GEMINI_MODEL = "gemini-3.6-flash"
const GEMINI_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 2 },
    { model: "gemini-3-flash-preview", attempts: 2 },
    { model: "gemini-2.5-flash", attempts: 2 },
]
const geminiUrl = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

async function callGeminiWithRetry(
    payload: any,
    apiKey: string
): Promise<Response> {
    let lastResp: Response | null = null
    for (const { model, attempts } of GEMINI_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            let r: Response | null = null
            try {
                r = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            } catch (e) {
                console.warn(`[transcribe-voice] red caída ${model} ${attempt}/${attempts}: ${e}`)
                await new Promise((res) =>
                    setTimeout(res, Math.min(8000, 700 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 300))
                )
                continue
            }
            if (r.ok) {
                if (model !== GEMINI_MODEL)
                    console.warn(`[transcribe-voice] respondió respaldo ${model}`)
                return r
            }
            lastResp = r
            if (r.status < 500 || r.status >= 600) {
                console.warn(`[transcribe-voice] Gemini ${r.status} en ${model} — no-5xx, cambio de modelo`)
                break
            }
            await new Promise((res) =>
                setTimeout(res, Math.min(8000, 700 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 300))
            )
        }
    }
    return lastResp!
}

function audioMimeFromUrl(url: string): string {
    const u = url.toLowerCase().split("?")[0]
    if (u.endsWith(".m4a") || u.endsWith(".mp4")) return "audio/mp4"
    if (u.endsWith(".webm")) return "audio/webm"
    if (u.endsWith(".mp3") || u.endsWith(".mpeg")) return "audio/mpeg"
    if (u.endsWith(".wav")) return "audio/wav"
    if (u.endsWith(".aac")) return "audio/aac"
    if (u.endsWith(".ogg")) return "audio/ogg"
    return "audio/mp4"
}

function bytesToBase64(bytes: Uint8Array): string {
    let bin = ""
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(bin)
}

const PROMPT =
    "Transcribe este audio palabra por palabra, en su idioma original. " +
    "Devuelve ÚNICAMENTE el texto transcrito, sin comillas, sin etiquetas y sin " +
    "comentarios. Si no hay habla audible, devuelve una cadena vacía."

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) return json({ error: "gemini_not_configured" }, 500)

    const body = await req.json().catch(() => ({}))

    const gate = await gateUser(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status || 401)

    const messageId = Number(body?.message_id)
    if (!Number.isFinite(messageId)) return json({ error: "bad_message_id" }, 400)

    // 1. Gate + datos (participante + miembro + cap + media_url descifrado).
    const { data: chk, error: chkErr } = await supabase.rpc(
        "transcribe_voice_check",
        { p_clerk_user_id: gate.userId, p_message_id: messageId }
    )
    if (chkErr) return json({ error: chkErr.message }, 400)
    if (!chk || chk.error) return json({ error: chk?.error || "denied" }, 403)

    // Ya transcrita → devolver cacheado (sin costo, sin tocar el cap).
    if (chk.transcript && String(chk.transcript).trim())
        return json({ transcript: String(chk.transcript).trim() })

    if (Number(chk.cap_left) <= 0) return json({ error: "cap_reached" }, 429)

    const mediaUrl = String(chk.media_url || "")
    if (!mediaUrl) return json({ error: "no_audio" }, 400)

    // 2. Baja el audio de R2.
    let audioB64 = ""
    try {
        const ar = await fetch(mediaUrl)
        if (!ar.ok) throw new Error(`audio ${ar.status}`)
        const buf = new Uint8Array(await ar.arrayBuffer())
        if (buf.length === 0) throw new Error("audio vacío")
        audioB64 = bytesToBase64(buf)
    } catch (e) {
        console.error("[transcribe-voice] fetch audio:", e)
        return json({ error: "audio_fetch_failed" }, 502)
    }

    // 3. Gemini transcribe.
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: audioMimeFromUrl(mediaUrl),
                            data: audioB64,
                        },
                    },
                    { text: PROMPT },
                ],
            },
        ],
        generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
        },
    }

    const gr = await callGeminiWithRetry(payload, apiKey)
    if (!gr || !gr.ok) {
        const t = gr ? await gr.text().catch(() => "") : ""
        console.error("[transcribe-voice] Gemini error:", gr?.status, t.slice(0, 300))
        return json({ error: "transcribe_failed" }, 502)
    }
    let text = ""
    try {
        const data: any = await gr.json()
        text = (data?.candidates?.[0]?.content?.parts || [])
            .map((p: any) => p?.text || "")
            .join(" ")
            .trim()
    } catch {
        return json({ error: "transcribe_failed" }, 502)
    }
    if (!text) return json({ error: "no_speech" }, 200)

    // 4. Guarda cifrado + suma al cap.
    const { data: saved, error: saveErr } = await supabase.rpc(
        "set_voice_transcript",
        { p_clerk_user_id: gate.userId, p_message_id: messageId, p_text: text }
    )
    if (saveErr || (saved && saved.error)) {
        // El transcript salió bien; solo no se pudo guardar → devolverlo igual.
        console.warn("[transcribe-voice] set fail:", saveErr?.message || saved?.error)
        return json({ transcript: text })
    }

    return json({ transcript: text })
})
