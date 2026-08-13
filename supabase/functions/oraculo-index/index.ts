// Red Solar Viva — Edge Function: oraculo-index v1.3
// =====================================================================
// v1.3 — modelo de embeddings text-embedding-004 (RETIRADO, daba 404) →
//         gemini-embedding-001 con outputDimensionality:768 + taskType
//         RETRIEVAL_DOCUMENT. ⚠ oraculo-chat DEBE usar el MISMO modelo/dims.
// v1.2 — surface `embed_error` en la respuesta cuando inserted<chunks (el
//         primer error de Gemini embeddings), para diagnóstico sin logs.
// v1.1 — auth dual: secreto de servidor ORACULO_INDEX_SECRET (sin TTL, para
//         el indexador batch) O token de admin (gateAdmin). El token de Clerk
//         vive ~60s → no alcanza para indexar 25 archivos en un solo lote.
// Indexador ADMIN del Oráculo. Recibe el texto plano de un Códice, lo parte
// en chunks con overlap, obtiene un embedding de 768 dims por chunk con Gemini
// text-embedding-004, y los inserta en oraculo_docs (service role). Re-indexar
// la misma `source` BORRA primero las filas anteriores (reemplazo idempotente).
//
// POST body: { token, title, source, text }
//   · token  — sesión de Clerk; debe ser ADMIN (gateAdmin).
//   · title  — título legible del libro ("La Física de la Voluntad").
//   · source — clave estable de la fuente ("fisica-de-la-voluntad"); re-index
//              con la misma source reemplaza.
//   · text   — el texto plano completo del libro.
//
// Devuelve: { ok:true, inserted:N, chunks:N, source } o { error }.
//
// Deploy: supabase functions deploy oraculo-index --no-verify-jwt
// Secrets: GEMINI_API_KEY, CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const sb = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
)

// Gemini gemini-embedding-001 truncado a 768 dims (la tabla es vector(768);
// text-embedding-004 fue retirado de la API → 404). Cosine en match_oraculo_docs
// es invariante a la magnitud, así que no hace falta normalizar el vector MRL.
const EMBED_MODEL = "gemini-embedding-001"
const EMBED_DIMS = 768
const embedUrl = (key: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`

// Chunking: ~800–1200 chars con ~150 de overlap, cortando en límites de
// párrafo/oración para no partir ideas a la mitad.
const CHUNK_TARGET = 1100
const CHUNK_MIN = 500
const CHUNK_OVERLAP = 150

function chunkText(raw: string): string[] {
    const text = (raw || "").replace(/\r\n/g, "\n").trim()
    if (!text) return []

    // Trozos "naturales" por párrafo (doble salto de línea); los párrafos
    // gigantes se sub-parten por oración.
    const paras = text
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, " ").trim())
        .filter((p) => p.length > 0)

    const units: string[] = []
    for (const p of paras) {
        if (p.length <= CHUNK_TARGET * 1.4) {
            units.push(p)
        } else {
            // Sub-partir por oración (., !, ?, …) conservando el delimitador.
            const sentences = p.match(/[^.!?…]+[.!?…]+|\S[^.!?…]*$/g) || [p]
            let buf = ""
            for (const s of sentences) {
                const piece = s.trim()
                if (!piece) continue
                if ((buf + " " + piece).trim().length > CHUNK_TARGET && buf) {
                    units.push(buf.trim())
                    buf = piece
                } else {
                    buf = (buf + " " + piece).trim()
                }
            }
            if (buf.trim()) units.push(buf.trim())
        }
    }

    // Agrupar unidades en chunks cercanos al target; añadir overlap (cola del
    // chunk previo) para preservar contexto entre fragmentos.
    const chunks: string[] = []
    let cur = ""
    for (const u of units) {
        if (!cur) {
            cur = u
        } else if ((cur + "\n\n" + u).length <= CHUNK_TARGET) {
            cur = cur + "\n\n" + u
        } else {
            chunks.push(cur)
            const tail = cur.slice(-CHUNK_OVERLAP)
            cur = (tail + "\n\n" + u).trim()
        }
    }
    if (cur.trim()) chunks.push(cur.trim())

    // Fusionar un último chunk demasiado corto con el anterior.
    if (
        chunks.length >= 2 &&
        chunks[chunks.length - 1].length < CHUNK_MIN
    ) {
        const last = chunks.pop() as string
        chunks[chunks.length - 1] =
            chunks[chunks.length - 1] + "\n\n" + last
    }
    return chunks
}

// Un embedding (768d) de Gemini con reintento corto ante 429/5xx.
async function embedOne(text: string, key: string): Promise<number[]> {
    const payload = {
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBED_DIMS,
    }
    let lastErr = ""
    for (let attempt = 1; attempt <= 4; attempt++) {
        let r: Response
        try {
            r = await fetch(embedUrl(key), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        } catch (e) {
            lastErr = `net_${e}`
            await new Promise((res) =>
                setTimeout(res, Math.min(8000, 600 * 2 ** (attempt - 1)))
            )
            continue
        }
        if (r.ok) {
            const j = await r.json()
            const vals = j?.embedding?.values
            if (Array.isArray(vals) && vals.length === 768) return vals
            throw new Error(
                `bad_embedding_shape len=${Array.isArray(vals) ? vals.length : "n/a"}`
            )
        }
        lastErr = `http_${r.status}`
        // 4xx (salvo 429) no se arregla reintentando.
        if (r.status !== 429 && (r.status < 500 || r.status >= 600)) {
            const body = await r.text().catch(() => "")
            throw new Error(`gemini_${r.status}: ${body.slice(0, 200)}`)
        }
        await new Promise((res) =>
            setTimeout(
                res,
                Math.min(8000, 700 * 2 ** (attempt - 1)) +
                    Math.floor(Math.random() * 300)
            )
        )
    }
    throw new Error(`embed_failed_after_retries ${lastErr}`)
}

// Embebe N chunks con concurrencia pequeña (no saturar la API ni la edge).
async function embedAll(
    chunks: string[],
    key: string
): Promise<{ out: (number[] | null)[]; firstErr: string }> {
    const out: (number[] | null)[] = new Array(chunks.length).fill(null)
    let firstErr = ""
    const CONC = 4
    let idx = 0
    async function worker() {
        while (idx < chunks.length) {
            const i = idx++
            try {
                out[i] = await embedOne(chunks[i], key)
            } catch (e) {
                if (!firstErr) firstErr = String(e)
                console.error(`[oraculo-index] embed chunk ${i} falló: ${e}`)
                out[i] = null
            }
        }
    }
    await Promise.all(
        Array.from({ length: Math.min(CONC, chunks.length) }, () => worker())
    )
    return { out, firstErr }
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS")
        return new Response("ok", { headers: CORS_HEADERS })
    if (req.method !== "POST")
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })

    const json = (obj: any, status = 200) =>
        new Response(JSON.stringify(obj), {
            status,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY")
        if (!apiKey) return json({ error: "GEMINI_API_KEY not set" }, 500)

        const body = await req.json().catch(() => ({}))
        const { token, title, source, text } = body || {}

        // Auth: el indexador batch corre 25 archivos (~5-15 min de embeddings),
        // muy por encima del TTL ~60s del token de sesión de Clerk → un token
        // jamás alcanza para todo el lote. Por eso se acepta TAMBIÉN un secreto
        // de servidor (ORACULO_INDEX_SECRET, set vía `supabase secrets`), que no
        // caduca. Sin ese secreto en el entorno, el bypass nunca aplica y se
        // exige token de admin verificado (gateAdmin) como siempre.
        const indexSecret = (Deno.env.get("ORACULO_INDEX_SECRET") || "").trim()
        const providedSecret =
            typeof body?.index_secret === "string"
                ? body.index_secret.trim()
                : ""
        const secretOk =
            indexSecret.length >= 16 &&
            providedSecret.length > 0 &&
            providedSecret === indexSecret
        if (!secretOk) {
            const gate = await gateAdmin(token)
            if (!gate.ok)
                return json({ error: gate.error }, gate.status || 401)
        }

        const cleanText = typeof text === "string" ? text : ""
        const cleanSource =
            typeof source === "string" && source.trim()
                ? source.trim().slice(0, 200)
                : ""
        const cleanTitle =
            typeof title === "string" && title.trim()
                ? title.trim().slice(0, 300)
                : cleanSource || "Códice"
        if (cleanText.trim().length < 50)
            return json({ error: "text_too_short" }, 400)
        if (!cleanSource) return json({ error: "source_required" }, 400)

        const chunks = chunkText(cleanText)
        if (chunks.length === 0) return json({ error: "no_chunks" }, 400)

        const { out: vectors, firstErr: embedErr } = await embedAll(
            chunks,
            apiKey
        )

        // Reemplazo idempotente: borrar lo previo de esta source.
        try {
            await sb.from("oraculo_docs").delete().eq("source", cleanSource)
        } catch (e) {
            console.warn(`[oraculo-index] delete previo falló: ${e}`)
        }

        // Insertar solo los chunks que sí obtuvieron embedding.
        const rows = chunks
            .map((content, i) =>
                vectors[i]
                    ? {
                          title: cleanTitle,
                          source: cleanSource,
                          chunk_index: i,
                          content,
                          embedding: vectors[i],
                      }
                    : null
            )
            .filter((r): r is NonNullable<typeof r> => r !== null)

        let inserted = 0
        // Insertar por lotes para no mandar un payload gigante.
        const BATCH = 50
        for (let i = 0; i < rows.length; i += BATCH) {
            const slice = rows.slice(i, i + BATCH)
            const { error } = await sb.from("oraculo_docs").insert(slice)
            if (error) {
                console.error("[oraculo-index] insert error:", error.message)
                return json(
                    { error: "insert_failed", detail: error.message, inserted },
                    500
                )
            }
            inserted += slice.length
        }

        return json({
            ok: true,
            inserted,
            chunks: chunks.length,
            source: cleanSource,
            title: cleanTitle,
            // Si no se insertó todo, surface el primer error de embedding
            // (Gemini) para diagnóstico — sin tener que abrir los logs.
            ...(inserted < chunks.length && embedErr
                ? { embed_error: embedErr.slice(0, 300) }
                : {}),
        })
    } catch (e: any) {
        console.error("[oraculo-index] fatal:", e)
        return json({ error: "internal", detail: String(e) }, 500)
    }
})
