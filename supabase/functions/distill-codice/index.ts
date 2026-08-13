// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/distill-codice/index.ts v1.0
// Atelier · Códices de Luz — DESTILADOR. Recibe el TEXTO COMPLETO de un libro de
// Zak y lo destila UNA vez en un concentrado (digest jsonb) reutilizable para
// generar carruseles fieles al libro: { esencia, voz, ensenanzas[], frases[],
// conceptos[] }. Guarda la fila en codices_luz y la devuelve.
//
//   POST { token, title, author?, full_text }  →  { id, title, author,
//          ensenanzas_count, generated_at }
//
// Modelo: gemini-flash-latest (cascada con 3.5/2.5, thinking apagado). Input
// grande (~50k tokens) pero es UNA sola vez por libro. Después cada carrusel
// solo lee el digest (~5k), no el libro entero.
//
// Deploy: supabase functions deploy distill-codice --no-verify-jwt
// Secrets: GEMINI_API_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
import { gateAdmin } from "../_shared/clerkAuth.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Cascada de modelos vivos (gemini-2.0-flash quedó decomisionado, 404).
const GEMINI_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 3 },
    { model: "gemini-3.5-flash", attempts: 3 },
    { model: "gemini-2.5-flash", attempts: 2 },
]
const geminiUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
const ATTEMPT_TIMEOUT_MS = 70_000
const TOTAL_DEADLINE_MS = 150_000

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

/* ═══════════════════════════════════════════════════════════════
   1. SYSTEM PROMPT del destilador
   ═══════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `Eres el "Destilador de Códices" de Red Solar Viva. Recibes el TEXTO COMPLETO de un libro de Zak'Haar Solar y lo destilas en un CONCENTRADO reutilizable para generar, después, carruseles de Instagram FIELES al libro.

Devuelves ÚNICAMENTE un objeto JSON (sin markdown, sin texto fuera del objeto) con EXACTAMENTE estas claves:
{
  "esencia": "el alma del libro en 1-2 frases, lenguaje llano",
  "voz": "cómo HABLA el libro (tono, estilo, actitud) en lenguaje llano, para que los carruseles suenen como él",
  "ensenanzas": [
    {
      "titulo": "nombre corto y evocador de la enseñanza",
      "idea": "la verdad NÚCLEO de esta enseñanza en 1-3 frases, en lenguaje LLANO (un lector nuevo la entiende), sin jerga densa",
      "metafora": "una imagen, analogía o ejemplo VÍVIDO del libro (o totalmente afín a él) que haga SENTIR la idea",
      "aplicacion": "cómo se aplica HOY, en la vida diaria, en 1 frase concreta y accionable"
    }
  ],
  "frases": ["8 a 15 líneas memorables del libro: citas potentes o destilados que den piel de gallina, exactas o casi exactas"],
  "conceptos": [
    { "termino": "término o concepto clave del libro", "explicacion": "qué significa, en lenguaje llano" }
  ]
}

REGLAS:
- "ensenanzas": de 18 a 30. Cada una debe poder convertirse en UN carrusel completo por sí sola. Cubre TODAS las grandes ideas del libro (capítulo por capítulo si hace falta), sin repetir ni solapar. Son la materia prima de los carruseles: que sean ricas, distintas entre sí y completas.
- FIDELIDAD ABSOLUTA: NO inventes ideas, conceptos ni ejemplos que el libro no contenga. Destilas lo que YA está; no agregas filosofía ajena.
- LENGUAJE LLANO y español neutro (tú, nunca voseo). Traduce la jerga del libro a algo que cualquiera entienda, pero conserva los nombres propios de sus conceptos (en "conceptos").
- "conceptos": de 6 a 12 términos que el libro acuña o usa de forma especial.
- Devuelve SOLO el JSON. Nada antes, nada después.`

function buildUser(title: string, author: string, fullText: string): string {
    return `Destila este libro en el concentrado del contrato.

TÍTULO: ${title}
AUTOR: ${author || "Zak'Haar Solar"}

TEXTO COMPLETO DEL LIBRO:
"""
${fullText}
"""

Devuelve SOLO el objeto JSON del contrato (esencia, voz, ensenanzas, frases, conceptos), fiel al libro y en lenguaje llano.`
}

/* ═══════════════════════════════════════════════════════════════
   2. JSON parse robusto (objeto balanceado)
   ═══════════════════════════════════════════════════════════════ */

function isolateJsonObject(s: string): string | null {
    const start = s.indexOf("{")
    if (start === -1) return null
    let depth = 0
    let inStr = false
    let esc = false
    for (let i = start; i < s.length; i++) {
        const ch = s[i]
        if (esc) {
            esc = false
            continue
        }
        if (ch === "\\") {
            esc = true
            continue
        }
        if (ch === '"') {
            inStr = !inStr
            continue
        }
        if (inStr) continue
        if (ch === "{") depth++
        else if (ch === "}") {
            depth--
            if (depth === 0) return s.slice(start, i + 1)
        }
    }
    return null
}

interface Digest {
    esencia: string
    voz: string
    ensenanzas: {
        titulo: string
        idea: string
        metafora: string
        aplicacion: string
    }[]
    frases: string[]
    conceptos: { termino: string; explicacion: string }[]
}

function parseDigest(raw: string): Digest {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
    }
    const objStr =
        isolateJsonObject(cleaned) ??
        cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)
    const p = JSON.parse(objStr)
    const ens = Array.isArray(p?.ensenanzas) ? p.ensenanzas : []
    return {
        esencia: String(p?.esencia ?? "").trim(),
        voz: String(p?.voz ?? "").trim(),
        ensenanzas: ens.map((e: any) => ({
            titulo: String(e?.titulo ?? "").trim(),
            idea: String(e?.idea ?? "").trim(),
            metafora: String(e?.metafora ?? "").trim(),
            aplicacion: String(e?.aplicacion ?? "").trim(),
        })),
        frases: Array.isArray(p?.frases)
            ? p.frases.map((x: any) => String(x ?? "").trim()).filter(Boolean)
            : [],
        conceptos: Array.isArray(p?.conceptos)
            ? p.conceptos.map((c: any) => ({
                  termino: String(c?.termino ?? "").trim(),
                  explicacion: String(c?.explicacion ?? "").trim(),
              }))
            : [],
    }
}

/* ═══════════════════════════════════════════════════════════════
   3. GEMINI (cascada + backoff + jitter, thinking apagado)
   ═══════════════════════════════════════════════════════════════ */

async function callGemini(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<Digest> {
    const startedAt = Date.now()
    const body = JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 0.6,
            topP: 0.95,
            maxOutputTokens: 12000,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
        },
    })

    let lastErr: any = null
    for (const { model, attempts } of GEMINI_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            const remaining = TOTAL_DEADLINE_MS - (Date.now() - startedAt)
            if (remaining < 8000) {
                throw lastErr ?? new Error("destilado: presupuesto agotado")
            }
            const controller = new AbortController()
            const t = setTimeout(
                () => controller.abort(),
                Math.min(ATTEMPT_TIMEOUT_MS, remaining)
            )
            try {
                const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                    signal: controller.signal,
                })
                if (!res.ok) {
                    const errBody = await res.text()
                    lastErr = new Error(
                        `Gemini ${res.status} (${model}): ${errBody.slice(0, 300)}`
                    )
                    if (res.status < 500 || res.status >= 600) break // 4xx → siguiente modelo
                    await sleep(
                        Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                            Math.floor(Math.random() * 400)
                    )
                    continue
                }
                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                if (!text) throw new Error("respuesta vacía")
                const digest = parseDigest(text)
                if (!digest.ensenanzas.length) {
                    throw new Error("digest sin enseñanzas")
                }
                return digest
            } catch (err: any) {
                lastErr = err
                await sleep(
                    Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                        Math.floor(Math.random() * 400)
                )
                continue
            } finally {
                clearTimeout(t)
            }
        }
    }
    throw lastErr ?? new Error("destilado: agotado")
}

/* ═══════════════════════════════════════════════════════════════
   4. SUPABASE insert (service role)
   ═══════════════════════════════════════════════════════════════ */

async function insertCodice(
    url: string,
    serviceKey: string,
    row: Record<string, any>
): Promise<any> {
    const r = await fetch(`${url}/rest/v1/codices_luz`, {
        method: "POST",
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(row),
    })
    if (!r.ok)
        throw new Error(`insert ${r.status}: ${(await r.text()).slice(0, 200)}`)
    const out = await r.json()
    return Array.isArray(out) ? out[0] : out
}

/* ═══════════════════════════════════════════════════════════════
   5. HANDLER
   ═══════════════════════════════════════════════════════════════ */

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const missing: string[] = []
    if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    if (missing.length) return jsonResponse(500, { error: "missing_secrets", missing })

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    const adminClerkId = _g.userId!

    const title = String(body?.title ?? "").trim()
    const author = String(body?.author ?? "").trim()
    const fullText = String(body?.full_text ?? "").trim()
    if (!title) return jsonResponse(400, { error: "title_required" })
    if (fullText.length < 500)
        return jsonResponse(400, { error: "text_too_short" })

    let digest: Digest
    try {
        digest = await callGemini(
            GEMINI_API_KEY!,
            SYSTEM_PROMPT,
            buildUser(title, author, fullText)
        )
    } catch (e: any) {
        console.error("[distill-codice] gen failed", e)
        return jsonResponse(502, {
            error: "distill_failed",
            detail: String(e?.message ?? e),
        })
    }

    let saved: any
    try {
        saved = await insertCodice(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
            title,
            author: author || "Zak'Haar Solar",
            full_text: fullText,
            digest,
            status: "ready",
            generated_by_clerk_id: adminClerkId,
        })
    } catch (e: any) {
        console.error("[distill-codice] insert failed", e)
        return jsonResponse(500, {
            error: "db_insert_failed",
            detail: String(e?.message ?? e),
        })
    }

    console.log(
        `[distill-codice] "${title}" destilado · ${digest.ensenanzas.length} enseñanzas`
    )
    return jsonResponse(200, {
        id: saved.id,
        title: saved.title,
        author: saved.author,
        ensenanzas_count: digest.ensenanzas.length,
        generated_at: saved.generated_at,
    })
})
