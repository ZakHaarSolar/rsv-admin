/*
 * ══════════════════════════════════════════════════════════════
 *  Supabase Edge Function: dictado-fidelidad  v1.0
 *  ¿Cuánto de lo que leíste llegó intacto a la transcripción?
 *
 *  El VELOCÍMETRO de la Matriz Sincrónica mide palabras por minuto, y sin
 *  esta segunda mitad ese número premiaría a quien se salta renglones. Acá
 *  se compara lo que la persona LEYÓ contra lo que su herramienta de dictado
 *  ESCRIBIÓ, y sale un porcentaje.
 *
 *  Por qué un modelo y no una distancia de edición: el dictado escribe
 *  "veintitrés" donde el texto dice "23", se come una coma, elige un
 *  sinónimo. Un diff de caracteres castiga todo eso como si fuera un error,
 *  cuando en realidad el sentido llegó completo. Se le pide al modelo que
 *  juzgue CONTENIDO, no ortografía. Es una sola pregunta con respuesta de un
 *  número: el modelo más barato alcanza y de sobra.
 *
 *  Deploy: supabase functions deploy dictado-fidelidad --no-verify-jwt
 *  Secrets: OPENROUTER_API_KEY (ya instalado) · CLERK_SECRET_KEY (gateUser)
 * ══════════════════════════════════════════════════════════════
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { gateUser } from "../_shared/clerkAuth.ts"

const OR_KEY = Deno.env.get("OPENROUTER_API_KEY") || ""
/* Un juez de un solo número no necesita talento: necesita ser barato y no
   inventar. Se puede mover por env sin tocar el código. */
const MODELO =
    Deno.env.get("DICTADO_FIDELIDAD_MODEL") || "meta-llama/llama-3.1-8b-instruct"

/* Techos de cordura: un texto de lectura ronda los 1.200 caracteres y un
   dictado suyo otro tanto. Cortar acá evita que alguien mande un libro. */
const MAX_CHARS = 6000

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

const SYSTEM = `Eres un evaluador de transcripciones. Recibes un TEXTO ORIGINAL y una TRANSCRIPCIÓN hecha por una herramienta de dictado por voz mientras alguien leía ese original en voz alta.

Devuelve UN SOLO NÚMERO ENTERO del 0 al 100: qué porcentaje del CONTENIDO del original llegó a la transcripción.

Reglas de juicio:
- Juzga SENTIDO, no ortografía. "veintitrés" por "23", una tilde ausente, una coma de menos o un sinónimo cercano NO son pérdidas.
- Sí son pérdidas: frases enteras que faltan, ideas cambiadas, palabras clave sustituidas por otras que dicen otra cosa, o texto que la transcripción inventó y no estaba.
- Si la transcripción cubre el original entero con errores menores de forma, eso es 95 a 100.
- Si falta la mitad del original, eso es cerca de 50.
- Si la transcripción no tiene nada que ver con el original, eso es 0.

Responde SOLO el número. Sin explicación, sin símbolo de porcentaje, sin puntuación.`

serve(async (req) => {
    if (req.method === "OPTIONS")
        return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    try {
        if (!OR_KEY) return json({ error: "sin_proveedor" }, 503)

        const body = await req.json().catch(() => ({}))
        const gate = await gateUser(body?.token)
        if (!gate.ok) return json({ error: gate.error }, gate.status || 401)

        const original = String(body?.original ?? "").slice(0, MAX_CHARS).trim()
        const dictado = String(body?.dictado ?? "").slice(0, MAX_CHARS).trim()
        if (!original || !dictado) return json({ error: "faltan_textos" }, 400)

        const r = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${OR_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://escanervibracional.com",
                    "X-Title": "Red Solar Viva",
                },
                body: JSON.stringify({
                    model: MODELO,
                    temperature: 0,
                    max_tokens: 6,
                    messages: [
                        { role: "system", content: SYSTEM },
                        {
                            role: "user",
                            content: `TEXTO ORIGINAL:\n${original}\n\n---\n\nTRANSCRIPCIÓN:\n${dictado}`,
                        },
                    ],
                }),
            }
        )

        if (!r.ok) {
            console.error("[dictado-fidelidad] proveedor", r.status, await r.text())
            return json({ error: "proveedor_falló" }, 502)
        }

        const j = await r.json().catch(() => null)
        const crudo = String(j?.choices?.[0]?.message?.content ?? "")
        /* El modelo puede contestar "94", "94%" o "El resultado es 94".
           Se toma el primer entero que aparezca y se acota al rango. */
        const m = crudo.match(/\d{1,3}/)
        if (!m) return json({ error: "sin_numero" }, 502)
        const fidelidad = Math.max(0, Math.min(100, parseInt(m[0], 10)))

        return json({ ok: true, fidelidad })
    } catch (e) {
        console.error("[dictado-fidelidad]", String(e))
        return json({ error: (e as Error).message }, 500)
    }
})
