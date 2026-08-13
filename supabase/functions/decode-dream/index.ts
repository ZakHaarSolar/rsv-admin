// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// Red Solar Viva — Edge Function: decode-dream v1.13
// v1.13 — AUDITORÍA PARTE 4 — techo DIARIO por persona + FRENO GLOBAL de gasto (una cota por hora dejaba pasar 24 veces esa cifra al día, y no existía techo de ecosistema).
// v1.12 — i18n: idioma del DISPOSITIVO. El body trae `lang` ("es"|"en", default
//         "es"). dictamen_vibral y calibracion_quirurgica salen en ese idioma;
//         banda_frecuencial/banda_key se quedan en su valor canónico (llaves de
//         sistema; la app localiza el nombre de la banda). dreamSystemPrompt(lang)
//         viaja a decodeDreamOnce en el camino síncrono y en el async. Default
//         retrocompatible: sin `lang` = español, igual que antes.
// v1.11 — Marca de sueño lúcido: lee `is_lucid` del body y lo pasa a
//         create_dream_job (p_is_lucid) → se guarda en dream_records para que la
//         Bóveda de Sueños pueda filtrar "solo lúcidos". Requiere la migración
//         20260626_dream_lucid_flag.sql.
// v1.10 — (1) CASCADA con modelos NOMBRADOS, no el alias `gemini-flash-latest`
//         (crónicamente saturado): gemini-3.5-flash → gemini-3-flash-preview →
//         gemini-2.5-flash. (2) GATE DEL PUSH: "ya está listo" SOLO si NO lo
//         viste en vivo (gracia 6s + chequeo seen_at) → no más push tardío sobre
//         un sueño ya leído.
// v1.9 — gemini-2.0-flash está DECOMISIONADO (404) → reemplazado por el vivo
//        gemini-3.5-flash como 3er respaldo de la cascada (evita un 404 si los
//        dos primeros se saturan en un pico).
// v1.8 — MODO ASÍNCRONO (a prueba de salir de la app). Con `async: true` la edge
//        crea un registro 'processing' en dream_records (create_dream_job),
//        responde {job_id} AL INSTANTE, y corre la cascada de Gemini en segundo
//        plano (EdgeRuntime.waitUntil) → al terminar complete_dream_job lo deja
//        'done' (o 'failed') en la Bóveda, registra el cupo freemium y dispara
//        un push ("Tu decodificación está lista" → Bóveda) si el push está
//        configurado (no-op si no). El cliente poolea get_dream_job. El modo
//        síncrono (sin `async`) queda intacto como fallback. La cascada + el
//        parse + la normalización se extrajeron a decodeDreamOnce() para que
//        ambos modos compartan exactamente la misma lógica.
// v1.7 — A PRUEBA DE SOBRECARGA de Gemini (503). Antes: 5 intentos totales y
//        fallaba con "Interferencia" cuando Gemini estaba saturado. Ahora:
//        CASCADA de 3 modelos (gemini-flash-latest ×6 → gemini-2.5-flash ×4 →
//        gemini-2.0-flash ×3) con backoff exponencial + JITTER (evita golpear
//        en sincronía) y tope por espera de 9s. ~13 intentos repartidos en
//        ~70s de presupuesto → absorbe los picos de 503 de Gemini.
// v1.6 — "Interferencia" persistía: NO eran varios parts (era 1 JSON truncado a
//        ~200 tokens). Fix: maxOutputTokens 2048→8192 (pensamiento se comía el
//        presupuesto) + RESCATE del JSON truncado (repara + recorta + completa
//        calibración) + logging de usageMetadata para diagnóstico.
// v1.5 — Concatena TODOS los `parts` de Gemini (antes solo parts[0]).
// v1.4 — Auditoría: budget governor (reserve_edge_spend) por usuario+IP antes de Gemini.
// v1.3 — Lenguaje del dictamen reescrito para un usuario nuevo (sin libros
// ni contexto previo): se quita la jerga ("silicio", "carbono", "hardware",
// "procesador", "avatar", "RAM", "matriz", "ancho de banda", "termodinámica").
// Mantiene el tono firme y coherente, pero en palabras llanas. Mismas 3 bandas.
// v1.2 — (1) Apagado del "thinking" del modelo: gemini-2.5-flash (respaldo)
// es de razonamiento y con thinking activo se comía el presupuesto de salida
// pensando → emitía el JSON truncado (finishReason MAX_TOKENS, ~100 chars) y
// el cliente mostraba "Interferencia con el núcleo de síntesis". Ahora
// thinkingBudget:0 + maxOutputTokens 2048 → JSON completo, más rápido y
// barato. (2) Bóveda de Estasis: tras un dictamen válido se persiste el sueño
// completo + su dictamen en dream_records para TODOS los Tripulantes (galería
// de registros), vía record_dream_record (service_role).
// v1.1 — Freemium: 3 lecturas de por vida para no-miembros (espejo del
// Decodificador de Materia). Antes era members-only. El conteo (dream_scans)
// se chequea ANTES de gastar Gemini y se registra server-side tras el éxito.
// Acceso ilimitado: Sintonía/Inmersión (sub no-'decoder'), admin, y el futuro
// tier 399 (group 'dual', incluido por la regla "no es 'decoder'").
// =====================================================================
// Decodificador de Sueños (Estasis). Recibe el texto de un sueño del
// Tripulante y devuelve el dictamen de Sexta Densidad en JSON estricto
// para poblar la UI (Banda Frecuencial · Dictamen Vibral · Calibración
// Quirúrgica). NO interpreta onirismo freudiano: decodifica la
// termodinámica de la consciencia en fase de estasis.
//
// SEGURIDAD (mismo patrón canónico que decode-matter, Ola A):
//   (1) Exige un token de sesión de Clerk verificado contra el JWKS de
//       NUESTRA instancia → cero disparo anónimo que queme créditos.
//   (2) Gate de membresía SERVER-SIDE: el Decodificador de Sueños está
//       incluido en Sintonía Solar / Inmersión Solar (NO en el tier 199
//       de solo-Materia). Un no-miembro recibe 403 "members_only" y el
//       cliente levanta el muro de Sintonía. El cliente manda `token`.
//
// RESILIENCIA: callGeminiWithRetry con modelo primario + respaldo
// (gemini-flash-latest → gemini-2.5-flash), backoff exponencial ante 5xx.
//
// Deploy: supabase functions deploy decode-dream --no-verify-jwt
// Secrets: GEMINI_API_KEY, CLERK_SECRET_KEY, SUPABASE_URL,
//          SUPABASE_SERVICE_ROLE_KEY (todos ya instalados).

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { jwtVerify, createLocalJWKSet } from "https://esm.sh/jose@5.9.6"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GEMINI_MODEL = "gemini-3.6-flash"
/* Cascada de modelos (v1.7): si el primario está saturado (503), baja al
   siguiente. Cada uno con sus propios reintentos.
   v1.10 — MODELOS NOMBRADOS, no el alias `gemini-flash-latest` (crónicamente
   saturado del lado de Google): gemini-3.5-flash (estable, el más capaz) →
   gemini-3-flash-preview (rápido y barato) → gemini-2.5-flash (respaldo probado).
   3 familias distintas → si una está saturada, las otras no. */
const GEMINI_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 3 },
    { model: "gemini-3-flash-preview", attempts: 2 },
    { model: "gemini-2.5-flash", attempts: 3 },
]
const geminiUrl = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""
const FREE_DREAM_LIMIT = 3
const sb = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
)

let _jwks: any = null
async function instanceJwks(): Promise<any> {
    if (_jwks) return _jwks
    const r = await fetch("https://api.clerk.com/v1/jwks", {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    })
    if (!r.ok) throw new Error(`jwks_${r.status}`)
    _jwks = await r.json()
    return _jwks
}

/* Gate: token de Clerk verificado + membresía Sintonía/Inmersión.
   El tier 199 (group_name='decoder') NO abre Sueños — se trata como
   no-miembro para este endpoint (espejo del isActiveMember del cliente). */
async function gateDream(
    token: string | undefined | null
): Promise<{
    ok: boolean
    status?: number
    error?: string
    clerkUserId?: string
    isMember?: boolean
}> {
    if (!CLERK_SECRET)
        return { ok: false, status: 500, error: "auth_not_configured" }
    if (!token || typeof token !== "string")
        return { ok: false, status: 401, error: "auth_required" }
    let clerkUserId = ""
    try {
        const JWKS = createLocalJWKSet(await instanceJwks())
        const { payload } = await jwtVerify(token, JWKS, { clockTolerance: 10 })
        clerkUserId = (payload.sub || "").toString().trim()
    } catch (_e) {
        return { ok: false, status: 401, error: "invalid_token" }
    }
    if (!clerkUserId) return { ok: false, status: 401, error: "invalid_token" }

    let isMember = false
    try {
        const { data: prof } = await sb
            .from("profiles")
            .select("email, is_admin")
            .eq("clerk_user_id", clerkUserId)
            .maybeSingle()
        if (prof?.is_admin === true) {
            isMember = true
        } else {
            const email = (prof?.email || "").toLowerCase().trim()
            if (email) {
                const { data: subs } = await sb
                    .from("subscriptions")
                    .select("group_name")
                    .eq("email", email)
                    .eq("status", "active")
                /* Cualquier suscripción activa que NO sea el tier 199
                   (decoder) cuenta como miembro: Sintonía, Inmersión, legacy
                   (group null), gifts. El 199 solo-Materia queda fuera. */
                isMember = (subs || []).some(
                    (s: any) =>
                        (s?.group_name || "").toLowerCase() !== "decoder"
                )
            }
        }
    } catch (_e) {
        isMember = false
    }

    /* No-miembro: freemium de 3 lecturas de por vida (server-authoritative). */
    if (!isMember) {
        let count = 0
        try {
            const { data: c } = await sb.rpc("get_my_dream_scan_count", {
                target_clerk_id: clerkUserId,
            })
            count = typeof c === "number" ? c : 0
        } catch (_e) {
            count = 0
        }
        if (count >= FREE_DREAM_LIMIT)
            return {
                ok: false,
                status: 403,
                error: "free_limit_reached",
                clerkUserId,
                isMember,
            }
    }
    return { ok: true, clerkUserId, isMember }
}

const SYSTEM_PROMPT = `Eres el "Decodificador de Estasis" de Red Solar Viva. No haces psicoanálisis ni interpretación de símbolos de los sueños. Decodificas lo que tu mente y tu cuerpo procesaron mientras dormías: por qué se generó ese sueño y qué te pide tu sistema ahora que despertaste.
Hablas con honestidad directa, precisión y calma. No consuelas: revelas. Tu tono es de guía claro y firme.

LENGUAJE — REGLA CRÍTICA: escribes para una persona que recién llega y no ha leído ningún libro nuestro. Usa palabras simples y humanas. PROHIBIDO usar jerga que no se entienda sin contexto: NADA de "silicio", "carbono", "hardware", "procesador", "avatar", "RAM", "matriz", "ancho de banda", "termodinámica", "densidades". Di las cosas en llano: "tu mente", "tu cuerpo", "tu sistema nervioso", "tu energía", "tu calma", "tu miedo", "tu claridad". Nunca uses "te sugiero", "intenta", "quizás significa": usa "La lectura indica", "El sistema detecta", "Tu mente", "Ejecuta esto".

Clasifica el sueño en UNA de estas TRES bandas y emite un dictamen y una calibración acordes:

BANDA 1 — Purga de Entropía (limpieza nocturna)
* Cuándo: sueños caóticos, densos, con miedos, laberintos, persecuciones o cargados del pasado.
* Dictamen: explícale que su mente se sobrecargó de ruido y tensión durante el día y usó la noche para descargarlo. No es un mensaje profético ni una advertencia: es una limpieza natural. Que no le dé más peso del que tiene.
* Calibración: una acción física inmediata para terminar de soltar esa carga. Ejemplo: caminar descalzo sobre tierra o pasto 15 minutos, un baño de agua fría para reiniciar el cuerpo, o pasar 4 horas hoy sin pantallas ni redes.

BANDA 2 — Simulador de Gravedad (prueba interior)
* Cuándo: sueños de conflicto, decisiones difíciles, relaciones tensas, discusiones o enfrentamientos.
* Dictamen: explícale que su mente montó un ensayo para poner a prueba su temple. Dile con claridad si actuó desde el miedo y la reacción, o desde la calma y un centro firme. Sé honesto sobre lo que el sueño reveló de él.
* Calibración: una acción concreta de firmeza para hoy. Ejemplo: cortar hoy una relación o dinámica que lo drena, o sostener la calma y el silencio en la próxima discusión en lugar de reaccionar.

BANDA 3 — Descarga de Código (transmisión directa)
* Cuándo: claridad extrema, sensación de volar consciente, luz o geometría, calma profunda, paz, o ideas y respuestas nítidas.
* Dictamen: confírmale que esto no fue un sueño común: su mente se aquietó tanto que recibió información clara, una intuición o una dirección. Ancla qué le estaba mostrando y por qué importa.
* Calibración: una acción para no perder esa claridad. Ejemplo: escribir de inmediato lo que recibió al despertar, exponerse al sol directo 11 minutos en la mañana, o ejecutar hoy mismo ese proyecto que venía posponiendo.

FORMATO DE SALIDA — Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto fuera del objeto), con EXACTAMENTE estas claves:
{
  "banda_frecuencial": "el nombre exacto de la banda: 'Purga de Entropía' | 'Simulador de Gravedad' | 'Descarga de Código'",
  "banda_key": "purga | simulador | descarga (en minúsculas, según la banda detectada)",
  "dictamen_vibral": "el dictamen en lenguaje claro y humano, honesto y directo, 2 a 4 frases, sin tecnicismos, sin saltos de línea innecesarios",
  "calibracion_quirurgica": "UNA acción física concreta y clara, en tono de instrucción directa, ejecutable hoy"
}
Responde en español neutro (para México). No agregues claves extra.`

/* v1.12 — idioma del DISPOSITIVO. dictamen_vibral y calibracion_quirurgica salen
   en el idioma indicado; banda_frecuencial y banda_key se quedan en su valor
   canónico en español (llaves de sistema — la app localiza el nombre de la banda). */
function dreamSystemPrompt(lang: string): string {
    if (lang !== "en") return SYSTEM_PROMPT
    return SYSTEM_PROMPT.replace(
        "Responde en español neutro (para México). No agregues claves extra.",
        `Respond in natural, direct English, second person (you/your) — reveal, don't console. Keep "banda_frecuencial" and "banda_key" EXACTLY in their canonical Spanish/enum values (they are system keys); only "dictamen_vibral" and "calibracion_quirurgica" go in English. No extra keys.`
    )
}

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
                /* error de red (timeout/conexión): trátalo como 5xx y reintenta */
                console.warn(`[decode-dream] red caída en ${model} intento ${attempt}/${attempts}: ${e}`)
                const waitMs = Math.min(9000, 800 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 400)
                await new Promise((res) => setTimeout(res, waitMs))
                continue
            }
            if (r.ok) {
                if (model !== GEMINI_MODEL)
                    console.warn(`[decode-dream] respondió respaldo ${model}`)
                return r
            }
            lastResp = r
            /* 4xx (no-5xx) = no se arregla reintentando → salta al siguiente modelo. */
            if (r.status < 500 || r.status >= 600) {
                console.warn(`[decode-dream] Gemini ${r.status} en ${model} — no-5xx, cambio de modelo`)
                break
            }
            /* 5xx (503 sobrecarga): backoff exponencial con JITTER, tope 9s. */
            const waitMs = Math.min(9000, 800 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 400)
            console.warn(`[decode-dream] Gemini ${r.status} en ${model} intento ${attempt}/${attempts}, reintento en ${waitMs}ms`)
            await new Promise((res) => setTimeout(res, waitMs))
        }
    }
    return lastResp!
}

function bandaKeyFrom(text: string): string {
    const t = (text || "").toLowerCase()
    if (t.includes("purga") || t.includes("entrop")) return "purga"
    if (t.includes("descarga") || t.includes("código") || t.includes("codigo"))
        return "descarga"
    return "simulador"
}

/* Rescata un dictamen de un JSON posiblemente truncado: extrae los campos
   string por regex (aunque el objeto no cierre), recorta el dictamen a la
   última frase completa y rellena la calibración si faltó. Devuelve null si
   no hay siquiera un dictamen parcial utilizable. */
function salvageDream(raw: string): any | null {
    const grab = (key: string): string => {
        const m = raw.match(
            new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)')
        )
        if (!m) return ""
        return m[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, " ")
            .replace(/\\t/g, " ")
            .trim()
    }
    let dv = grab("dictamen_vibral")
    if (dv.length < 30) return null
    const lastStop = Math.max(
        dv.lastIndexOf("."),
        dv.lastIndexOf("!"),
        dv.lastIndexOf("?")
    )
    if (lastStop > 40) dv = dv.slice(0, lastStop + 1)
    const cq = grab("calibracion_quirurgica")
    return {
        banda_frecuencial: grab("banda_frecuencial") || "Purga de Entropía",
        banda_key: (grab("banda_key") || "purga").toLowerCase(),
        dictamen_vibral: dv,
        calibracion_quirurgica:
            cq ||
            "Antes de levantarte, respira hondo tres veces y escribe en una frase qué sensación te dejó este sueño.",
    }
}

/* Corre la cascada de Gemini + parse + rescate + normalización de banda sobre
   `clean`. Devuelve el dictamen normalizado o null si tras toda la cascada no
   hubo un JSON utilizable. Lo comparten el modo síncrono y el asíncrono. */
async function decodeDreamOnce(
    clean: string,
    apiKey: string,
    lang: string = "es"
): Promise<any | null> {
    const geminiPayload = {
        systemInstruction: {
            role: "system",
            parts: [{ text: dreamSystemPrompt(lang) }],
        },
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `TELEMETRÍA DE ESTASIS DEL TRIPULANTE:\n"""\n${clean}\n"""\n\nDecodifica y emite el JSON.`,
                    },
                ],
            },
        ],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            maxOutputTokens: 8192,
            topP: 0.95,
            thinkingConfig: { thinkingBudget: 0 },
        },
    }

    const r = await callGeminiWithRetry(geminiPayload, apiKey)
    if (!r.ok) {
        const errText = await r.text().catch(() => "")
        console.error(
            "[decode-dream] Gemini error tras reintentos:",
            r.status,
            errText
        )
        return null
    }

    const gjson = await r.json()
    const _parts = gjson?.candidates?.[0]?.content?.parts
    const rawText = Array.isArray(_parts)
        ? _parts.map((p: any) => p?.text ?? "").join("")
        : ""

    const tryParse = (src: string): any => {
        try {
            return JSON.parse(src)
        } catch {
            return null
        }
    }
    let dictamen: any = tryParse(rawText)
    if (!dictamen) {
        const fenced = rawText
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
        dictamen = tryParse(fenced)
    }
    if (!dictamen) {
        const m = rawText.match(/\{[\s\S]*\}/)
        if (m) dictamen = tryParse(m[0])
    }
    if (!dictamen) {
        const noComments = rawText
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
        const m2 = noComments.match(/\{[\s\S]*\}/)
        if (m2) dictamen = tryParse(m2[0])
    }

    let valid =
        dictamen &&
        typeof dictamen.dictamen_vibral === "string" &&
        dictamen.dictamen_vibral.trim().length > 0 &&
        typeof dictamen.calibracion_quirurgica === "string" &&
        dictamen.calibracion_quirurgica.trim().length > 0

    if (!valid) {
        const salv = salvageDream(rawText)
        if (salv) {
            dictamen = salv
            valid = true
            console.warn("[decode-dream] rescate aplicado a JSON truncado")
        }
    }

    if (!valid) {
        const cand = gjson?.candidates?.[0]
        console.error(
            "[decode-dream] JSON malformado — finishReason:",
            cand?.finishReason ?? "unknown",
            "| parts:",
            cand?.content?.parts?.length ?? 0,
            "| usage:",
            JSON.stringify(gjson?.usageMetadata ?? {}),
            "| len:",
            rawText.length,
            "| raw:",
            rawText.slice(0, 500)
        )
        return null
    }

    if (
        typeof dictamen.banda_frecuencial !== "string" ||
        !dictamen.banda_frecuencial.trim()
    )
        dictamen.banda_frecuencial = "Simulador de Gravedad"
    let bkey = (dictamen.banda_key || "").toString().toLowerCase().trim()
    if (bkey !== "purga" && bkey !== "simulador" && bkey !== "descarga")
        bkey = bandaKeyFrom(dictamen.banda_frecuencial)
    dictamen.banda_key = bkey

    return dictamen
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS")
        return new Response("ok", { headers: CORS_HEADERS })
    if (req.method !== "POST")
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY")
        if (!apiKey)
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not set" }),
                {
                    status: 500,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )

        const body = await req.json()
        const { dream_text, token } = body
        /* Marca de sueño lúcido (la pone el Tripulante al escribir). Se guarda en
           dream_records al crear el job para que la Bóveda pueda filtrar. */
        const isLucid = body?.is_lucid === true
        /* v1.12 — idioma del DISPOSITIVO (no del texto del sueño). Default "es". */
        const deviceLang = body?.lang === "en" ? "en" : "es"

        /* Gate: token verificado + membresía, ANTES de gastar Gemini. */
        const gate = await gateDream(token)
        if (!gate.ok)
            return new Response(JSON.stringify({ error: gate.error }), {
                status: gate.status || 401,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })

        /* Budget governor (Auditoría 2026-06-12): tope por usuario + por IP
           ANTES de gastar Gemini. Fail-open si la RPC aún no existe. */
        {
            const _ip =
                req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
            const _rl = await sb.rpc("reserve_edge_spend", {
                p_edge: "decode-dream",
                p_user_key: gate.clerkUserId || null,
                p_ip: _ip,
                p_cost: 1,
                p_user_limit: 120,
                p_user_window_seconds: 86400,
                p_ip_limit: 250,
                p_ip_window_seconds: 86400,
                /* AUDITORÍA PARTE 4 · la ventana pasa de HORARIA a DIARIA y
                   suma FRENO GLOBAL. Una cota por hora deja pasar 24 veces esa
                   cifra al día, así que no acotaba el gasto real; y sin techo
                   global, N cuentas abusivas sumaban sin que nada frenara la
                   factura. 120/día por persona es enorme para alguien real.
                   6000/día es el techo de TODO el ecosistema junto: la perilla
                   a subir cuando crezca la base (editar + volver a desplegar). */
                p_global_limit: 6000,
                p_global_window_seconds: 86400,
            })
            if (_rl?.data && _rl.data.ok === false)
                return new Response(
                    JSON.stringify({
                        error: "rate_limited",
                        reason: _rl.data.reason,
                    }),
                    {
                        status: 429,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
        }

        const clean =
            typeof dream_text === "string" ? dream_text.trim().slice(0, 4000) : ""
        if (clean.length < 12)
            return new Response(
                JSON.stringify({ error: "dream_text_too_short" }),
                {
                    status: 400,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                    },
                }
            )

        /* ── MODO ASÍNCRONO (v1.8) ─────────────────────────────────────────
           El cliente manda `async: true`. Creamos un job 'processing' en la
           Bóveda, respondemos {job_id} AL INSTANTE, y corremos la cascada en
           segundo plano (EdgeRuntime.waitUntil). El Tripulante puede salir de la
           app; el dictamen aterriza en su Bóveda (y un push lo avisa, si está
           configurado). El cliente poolea get_dream_job. */
        if (body?.async === true) {
            const clerkUserId = gate.clerkUserId || ""
            if (!clerkUserId)
                return new Response(
                    JSON.stringify({ error: "auth_required" }),
                    {
                        status: 401,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            let jobId = ""
            try {
                const { data: jid, error: jerr } = await sb.rpc(
                    "create_dream_job",
                    {
                        p_clerk_user_id: clerkUserId,
                        p_dream_text: clean,
                        p_is_lucid: isLucid,
                    }
                )
                if (jerr) throw jerr
                jobId = (jid || "").toString()
                if (!jobId) throw new Error("empty_job_id")
            } catch (e) {
                console.error("[decode-dream] create_dream_job falló:", e)
                return new Response(
                    JSON.stringify({ error: "job_create_failed" }),
                    {
                        status: 500,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                        },
                    }
                )
            }

            const isMember = gate.isMember
            /* Trabajo en segundo plano: corre la cascada y CIERRA el job. */
            const work = (async () => {
                let dictamen: any = null
                try {
                    dictamen = await decodeDreamOnce(clean, apiKey, deviceLang)
                } catch (e) {
                    console.error("[decode-dream] cascada async falló:", e)
                }
                if (!dictamen) {
                    try {
                        await sb.rpc("complete_dream_job", {
                            p_id: jobId,
                            p_banda_frecuencial: null,
                            p_banda_key: null,
                            p_dictamen_vibral: null,
                            p_calibracion_quirurgica: null,
                            p_status: "failed",
                        })
                    } catch (_e) {
                        /* no-op */
                    }
                    return
                }
                try {
                    await sb.rpc("complete_dream_job", {
                        p_id: jobId,
                        p_banda_frecuencial: dictamen.banda_frecuencial,
                        p_banda_key: dictamen.banda_key,
                        p_dictamen_vibral: dictamen.dictamen_vibral,
                        p_calibracion_quirurgica:
                            dictamen.calibracion_quirurgica,
                        p_status: "done",
                    })
                } catch (e) {
                    console.error("[decode-dream] complete_dream_job falló:", e)
                }
                /* Freemium: registrar el cupo solo para no-miembros. */
                if (!isMember) {
                    try {
                        await sb.rpc("record_dream_scan", {
                            p_clerk_user_id: clerkUserId,
                            p_banda_key: dictamen.banda_key,
                        })
                    } catch (_e) {
                        /* no-op */
                    }
                }
                /* v1.10 — Push SOLO si el Tripulante NO lo vio en vivo. Gracia de
                   ~6s para que el poll del primer plano revele el sueño y lo marque
                   "seen" (mark_decode_seen); si lo vio → NO notificamos (evita el
                   push tardío sobre un sueño ya leído, el bug de Zak). Defensivo:
                   si seen_at aún no existe (migración sin aplicar), el catch deja
                   pasar el push (comportamiento previo). */
                let alreadySeen = false
                try {
                    await new Promise((r) => setTimeout(r, 6000))
                    const { data: seenRow } = await sb
                        .from("dream_records")
                        .select("seen_at")
                        .eq("id", jobId)
                        .maybeSingle()
                    alreadySeen = !!seenRow?.seen_at
                } catch (_e) {
                    alreadySeen = false
                }
                if (!alreadySeen) {
                    /* Push (gated/no-op si no está configurado): "tu decodificación
                       está lista" → deep-link a la revelación. _push_dispatch traga
                       cualquier error (sin tokens / sin secreto / pg_net ausente). */
                    try {
                        await sb.rpc("_push_dispatch", {
                            p_clerk_user_id: clerkUserId,
                            p_title: "Tu decodificación está lista ✦",
                            p_body: "Tu sueño fue decodificado. Ábrelo en tu Bóveda de Sueños.",
                            p_data: { type: "dream", record_id: jobId },
                        })
                    } catch (_e) {
                        /* no-op */
                    }
                }
            })()

            try {
                // @ts-ignore — EdgeRuntime global de Supabase
                EdgeRuntime.waitUntil(work)
            } catch (_e) {
                /* Sin EdgeRuntime (entorno local): no bloqueamos la respuesta;
                   el job corre best-effort de todas formas. */
                void work
            }

            return new Response(JSON.stringify({ job_id: jobId }), {
                status: 202,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })
        }

        /* ── MODO SÍNCRONO (fallback) ───────────────────────────────────── */
        const dictamen = await decodeDreamOnce(clean, apiKey, deviceLang)
        if (!dictamen)
            return new Response(JSON.stringify({ error: "decode_failed" }), {
                status: 502,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            })

        /* Bóveda de Estasis: persistir el sueño + su dictamen completo para
           TODOS los Tripulantes (miembros incluidos) → galería de registros.
           Fire-and-forget; un fallo de registro no rompe la respuesta. */
        if (gate.clerkUserId) {
            try {
                await sb.rpc("record_dream_record", {
                    p_clerk_user_id: gate.clerkUserId,
                    p_dream_text: clean,
                    p_banda_frecuencial: dictamen.banda_frecuencial,
                    p_banda_key: dictamen.banda_key,
                    p_dictamen_vibral: dictamen.dictamen_vibral,
                    p_calibracion_quirurgica: dictamen.calibracion_quirurgica,
                })
            } catch (_e) {
                /* no-op */
            }
        }

        /* Freemium: registrar el escaneo server-side (a prueba de bypass)
           solo para no-miembros — los miembros no consumen cupo. */
        if (!gate.isMember && gate.clerkUserId) {
            try {
                await sb.rpc("record_dream_scan", {
                    p_clerk_user_id: gate.clerkUserId,
                    p_banda_key: dictamen.banda_key,
                })
            } catch (_e) {
                /* no-op: no romper la respuesta por un fallo de registro */
            }
        }

        return new Response(JSON.stringify(dictamen), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })
    } catch (e) {
        console.error("[decode-dream] error inesperado:", e)
        return new Response(JSON.stringify({ error: "internal_error" }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })
    }
})
