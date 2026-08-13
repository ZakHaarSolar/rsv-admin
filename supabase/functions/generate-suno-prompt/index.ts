// admin/supabase/functions/generate-suno-prompt/index.ts v1.7
// =====================================================================
// v1.7 — SELECTOR DE SIMILITUD para álbum-desde-track (seed_album/expand_album/
//        album): "similarity" low|medium|high controla qué tan cerca de la pieza
//        original salen las nuevas — inyecta una directriz explícita, baja la
//        temperatura del modelo y ACOTA weirdness/style_influence a un rango
//        estrecho alrededor de la original (high = ±2, gemelas; medium = ±6;
//        low = ±12, primas). "high" reusa textualmente la instrumentación/
//        producción de la original.
// v1.6 — modo "seed_album": recibe un PROMPT de Suno YA HECHO (style_prompt +
//        excludes + weirdness + style_influence que el humano pegó, creado fuera
//        del panel) y construye un ÁLBUM alrededor de él: la pieza pegada queda
//        como pieza 1 (anchor — su prompt EXACTO; con link opcional a Suno queda
//        marcada como producida) + N piezas complementarias que se sienten
//        hermanas (mismo pulso/tempo/paleta, distinto ángulo) + portada. Reusa la
//        maquinaria de expand_album.
// v1.5 — AFINADOR DE LETRA con instrucción libre (modo lyrics acepta refine_note:
//        "más geométrica", "más agua", "menos épica" → manda sobre todo) +
//        PORTADA DE ÁLBUM: album/expand_album generan también cover_prompt
//        (prompt de arte 1:1 para Nano Banana, con el título renderizado) y lo
//        guardan en set_cover_prompt; modo nuevo "album_cover" genera/regenera
//        la portada de un set existente. Inserts RESILIENTES: si la migración
//        20260710 no está pegada aún, reintenta sin la columna nueva (grácil).
// v1.4 — VOZ DE LETRAS anti-new-age (directriz de Zak): LYRICS_RULES reescritas —
//        prohibido "silicio" + clichés espirituales/naturaleza de postal; fusión
//        orgánico-tecnológico elegante (bioma cuántico, vectores de fuerza,
//        geometría cristalina, agua estructurada, calibración, coherencia, firma
//        cuántica, Avatar de Luz); naturaleza como TECNOLOGÍA VIVA; sujeto
//        soberano y activo. Identidad del letrista reforzada en los 4 modos.
// v1.3 — modo "expand_album": convierte UNA pieza suelta en un ÁLBUM generando N
//        piezas MÁS (ángulos del mismo pulso/estilo) y agrupándolas con ella. La
//        original pasa a ser la pieza 1. Requiere migración 20260709e.
// v1.2 — robustez del cerebro: SIN response_format json_object (algunas rutas de
//        OpenRouter lo rechazan con 400 → 0 output; el patrón probado del Espejo
//        no lo usa). Logs por intento (HTTP status + parse) para diagnosticar en
//        el registro de Supabase. Lectura de direcciones tolerante a la forma.
// -----------------------------------------------------------------------------
// Panel "Frecuencias Sonoras" — cerebro del generador de prompts para Suno.
// Traduce una semilla (texto / referencia / álbumes-tracks del catálogo / imagen
// REAL subida) al lenguaje de Suno, con el ADN musical de Red Solar Viva.
//
// Cerebro: DeepSeek Chat vía OpenRouter (texto). Visión: modelo multimodal de
// OpenRouter NO-Google (independiente del billing de Google → CERO tokens Gemini).
// Salida SIEMPRE JSON estructurado (response_format json_object + isolateJsonObject).
//
// MODOS:
//   · "describe_image" — imagen REAL (base64) → descripción de vibe sonoro (texto).
//   · "directions" (CAPA 1) — 3-4 direcciones candidatas de los 7 arquetipos.
//   · "refine"     (CAPA 2) — afina UNA dirección con las perillas.
//   · "finalize"   (CAPA 3) — arma el PROMPT COMPLETO de UNA pieza y la GUARDA.
//   · "album"      — arma un ÁLBUM: un PULSO CORE + N piezas, cada una un ángulo
//     distinto del core con el MISMO estilo (diferentes pero matchean). Guarda las
//     N filas agrupadas por set_id. Las letras (si con voz) no se repiten entre sí.
//   · "lyrics"     — regenera SOLO la letra de una creación (anti-repetición).
//
// v1.1 — modo álbum + modo imagen real + seedBlock simplificado (la fusión se
//        deriva de la selección; sin "modo de Norte" visible). Requiere migración
//        20260709d_suno_album_output (columnas set_id/set_title/track_no/angle).
//
// Deploy: supabase functions deploy generate-suno-prompt --no-verify-jwt
// Secrets: OPENROUTER_API_KEY · CLERK_SECRET_KEY · SUPABASE_URL ·
//          SUPABASE_SERVICE_ROLE_KEY   (NINGÚN secret de Google)

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

// Texto: DeepSeek (fallback Llama). Ambos sin barandas, casi gratis.
const MODEL_CASCADE = [
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.3-70b-instruct",
]
// Visión: multimodales NO-Google (independientes del billing de Google).
const VISION_CASCADE = [
    "qwen/qwen-2.5-vl-72b-instruct",
    "meta-llama/llama-3.2-90b-vision-instruct",
    "mistralai/pixtral-12b",
]

const ALBUM_DEADLINE_MS = 115_000 // presupuesto para la generación de un álbum

/* ═══════════════════════════════════════════════════════════════
   1. ADN SONORO + 7 ARQUETIPOS (destilado de los 7 álbumes reales)
   ═══════════════════════════════════════════════════════════════ */

const ADN_SONORO = `EL ADN SONORO DE RED SOLAR VIVA (denominador común de todo el catálogo):
- Géneros firma: Ethereal Ambient · Solarwave · Lucidwave · Psybient · Deep Soulful / Solar Ascending House · Cinematic Organic World · Ambient Minimalism.
- Instrumentación firma: arpa y glass harmonica · coros etéreos (angelical, mixto, wordless, susurrado) · arpegios y texturas cristalinas · strings cálidos que se elevan · flautas de madera/pan/"alien" · percusión suave de mano y frame drums (NUNCA batería dura) · Rhodes (en la cara house) · pads sumergidos/bioluminiscentes · texturas de agua.
- Frecuencias sagradas (marca distintiva, muy presente): 963 Hz (pineal) · 528 Hz (sanación/ADN) · 639 Hz (relaciones) · 432 Hz (afinación natural) · 111/222/285/333/396/852/888 Hz · Schumann 7.83 Hz · sub-ondas binaurales (13 Hz, 2 Hz).
- Moods: sereno · sanador · elevador · celestial · cristalino · pacífico · euforia espiritual · quietud/presencia · aventura pacífica · unidad. SIEMPRE alta frecuencia.
- Imaginería: agua/ríos de luz · bioluminiscencia · sol interior · amanecer · aurora · civilizaciones antiguas (Atlantis/Lemuria) · naturaleza viva · cosmos · cristal · geometría sagrada · raíces/memoria planetaria.
- Voz: cuando hay, es angelical/coral/LENGUAJE LUMÍNICO (idioma vocal propio de fonemas solares) o wordless. NUNCA pop vocals.
- Excludes universales (aparecen en casi todo el catálogo): dark, heavy, aggressive, fast, drums duros, rock, metal, trap, hip-hop, pop vocals, chaotic, tense, melancholic, industrial, distorted, EDM festival duro, reggaeton, dubstep.

PARÁMETROS DE SUNO (los recomiendas TÚ en el output, no los elige el humano):
- Weirdness (1º %): rango 8–80, mediana ~40.
- Style Influence (2º %): rango 15–88, mediana ~70.
- Correlación observada: lo ORGÁNICO/ACÚSTICO → style influence alto (85) + weirdness bajo (18–20); lo AMBIENT/DISOLUCIÓN → style influence bajo (15–35) + weirdness medio-alto; lo CORAL/FONÉTICO → ambos medios-altos (40–75).`

const ARQUETIPOS = `LOS 7 ARQUETIPOS DE DIRECCIÓN (base de las candidatas):
1. Etéreo Acuático (Lumeria) — agua · arpa · coro angelical · sanación · atlante. Ethereal Ambient.
2. Orgánico Cinemático de Vuelo (Donde Viven los Cielos) — acústico · strings + flautas + percusión de mano · aventura · world · style influence alto (85).
3. House Solar Ascendente (Prisma) — deep soulful house 4/4 · Rhodes · 963/528 Hz · danza-meditación · euforia espiritual · weirdness bajo (8) style influence 75.
4. Ambient de Disolución / Solarwave puro (Punto de No Retorno) — minimalista · frecuencias puras · no-dualidad · quietud · "el silencio es el lienzo". style influence bajo (15–35).
5. Ancestral Lucidwave Planetario (Donde la Tierra Aún Canta) — tribal-etéreo · agua consciente · pineal drones · raíces · 64–72 BPM.
6. Solarwave Luminoso (Sintonías de Sol Navegante) — ríos de luz · amanecer · sol interior · ligero/ascendente · psybient.
7. Coral de Lenguaje Solar (Códigos Aurora) — fonética lumínica cantada · aurora · del susurro (Silentis) al fuego solar (Ignis/Flamma/Sorah). weirdness 40–70.`

const BRAND_SAFE_EXCLUDES = [
    "dark",
    "aggressive",
    "distorted",
    "chaotic",
    "pop vocals",
]

const LEXICO_LUMINICO = `Raé, Lumina, Lumi, Luminae, Solae, Solara, Solurae, Lioraé, Kaii, Kaiirae, Sohar, Soharii, Oriah, Mirabilis, Mirraé, Eshira, Esharae, Seraphis, Aurorae, Visionis, Veyah, Ignis, Tora, Torah, Shantaa, Naa, Ohna. Vocales largas sostenidas: -ae, -ii, -oo.`

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

function parseJson(raw: string): any {
    let cleaned = (raw || "").trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
    }
    const objStr =
        isolateJsonObject(cleaned) ??
        cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)
    return JSON.parse(objStr)
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

/* ═══════════════════════════════════════════════════════════════
   3. OpenRouter — texto (JSON forzado) + visión
   ═══════════════════════════════════════════════════════════════ */

async function callDeepSeek(
    orKey: string,
    system: string,
    user: string,
    temperature: number,
    maxTokens = 2400
): Promise<any> {
    let lastErr: any = null
    for (const model of MODEL_CASCADE) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const resp = await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${orKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://escaner.redsolarviva.com",
                            "X-Title": "Frecuencias Sonoras · Red Solar Viva",
                        },
                        // NOTA: sin response_format. Algunas rutas de OpenRouter
                        // rechazan json_object con 400; el patrón probado del
                        // Espejo (oraculo-chat) NO lo usa — pide "solo JSON" en el
                        // prompt y extrae el objeto con isolateJsonObject.
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: "system", content: system },
                                { role: "user", content: user },
                            ],
                            temperature,
                            max_tokens: maxTokens,
                        }),
                    }
                )
                if (!resp.ok) {
                    const errText = await resp.text().catch(() => "")
                    console.warn(
                        `[suno] ${model} intento ${attempt}: HTTP ${resp.status} — ${errText.slice(0, 200)}`
                    )
                    lastErr = new Error(
                        `OpenRouter ${resp.status} (${model}): ${errText.slice(0, 200)}`
                    )
                    if (resp.status !== 429 && resp.status < 500) break
                    await sleep(
                        Math.min(8000, 700 * 2 ** (attempt - 1)) +
                            Math.floor(Math.random() * 400)
                    )
                    continue
                }
                const oj = await resp.json()
                const text = (
                    oj?.choices?.[0]?.message?.content || ""
                ).toString()
                if (!text.trim()) throw new Error("respuesta vacía")
                return parseJson(text)
            } catch (e) {
                console.warn(
                    `[suno] ${model} intento ${attempt} falló: ${String((e as Error)?.message || e).slice(0, 200)}`
                )
                lastErr = e
                await sleep(
                    Math.min(8000, 700 * 2 ** (attempt - 1)) +
                        Math.floor(Math.random() * 400)
                )
            }
        }
    }
    throw lastErr ?? new Error("generación agotada")
}

async function callVision(
    orKey: string,
    imageDataUrl: string,
    prompt: string
): Promise<string> {
    let lastErr: any = null
    for (const model of VISION_CASCADE) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const resp = await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${orKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://escaner.redsolarviva.com",
                            "X-Title": "Frecuencias Sonoras · Red Solar Viva",
                        },
                        body: JSON.stringify({
                            model,
                            temperature: 0.6,
                            max_tokens: 500,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: prompt },
                                        {
                                            type: "image_url",
                                            image_url: { url: imageDataUrl },
                                        },
                                    ],
                                },
                            ],
                        }),
                    }
                )
                if (!resp.ok) {
                    const errText = await resp.text().catch(() => "")
                    lastErr = new Error(
                        `Vision ${resp.status} (${model}): ${errText.slice(0, 160)}`
                    )
                    if (resp.status !== 429 && resp.status < 500) break
                    await sleep(700 * attempt)
                    continue
                }
                const oj = await resp.json()
                const text = (oj?.choices?.[0]?.message?.content || "")
                    .toString()
                    .trim()
                if (text) return text
                throw new Error("vision vacía")
            } catch (e) {
                lastErr = e
                await sleep(700 * attempt)
            }
        }
    }
    throw lastErr ?? new Error("vision agotada")
}

/* ═══════════════════════════════════════════════════════════════
   4. Utilidades
   ═══════════════════════════════════════════════════════════════ */

function clampPct(n: any, fallback: number): number {
    const v = Math.round(Number(n))
    if (!Number.isFinite(v)) return fallback
    return Math.max(1, Math.min(99, v))
}

function inspirationHint(insp: string): string {
    if (insp === "low")
        return "Inspiración BAJA: lo elegido pesa poco, hay libertad creativa. Style Influence sugerido ~40 (35–50)."
    if (insp === "high")
        return "Inspiración ALTA: cíñete fuerte a lo elegido y al ADN. Style Influence sugerido ~85 (78–88)."
    return "Inspiración MEDIA: equilibrio. Style Influence sugerido ~65 (55–72)."
}

function mergeExcludes(modelExcludes: any): string[] {
    const out: string[] = []
    const seen = new Set<string>()
    const push = (x: any) => {
        const s = String(x || "").trim().replace(/^-+/, "").trim()
        if (!s) return
        const k = s.toLowerCase()
        if (seen.has(k)) return
        seen.add(k)
        out.push(s)
    }
    if (Array.isArray(modelExcludes)) modelExcludes.forEach(push)
    BRAND_SAFE_EXCLUDES.forEach(push)
    return out
}

// Excludes EXACTOS de un prompt pegado por el humano (sin añadir los brand-safe):
// limpia el prefijo "Exclude styles:" y los guiones de todo tipo (incl. ‑ U+2011).
function parseExcludesRaw(v: any): string[] {
    const arr = Array.isArray(v) ? v : String(v || "").split(/[,\n;]/)
    const out: string[] = []
    const seen = new Set<string>()
    for (const x of arr) {
        const s = String(x)
            .replace(/^\s*exclude\s*styles?\s*:?/i, "")
            .trim()
            .replace(/^[-‐‑‒–—―·•\s]+/, "")
            .trim()
        if (!s) continue
        const k = s.toLowerCase()
        if (seen.has(k)) continue
        seen.add(k)
        out.push(s)
    }
    return out.slice(0, 24)
}

async function resolveNorte(seed: any): Promise<{ ctx: string; count: number }> {
    const albumIds: string[] = Array.isArray(seed?.album_ids) ? seed.album_ids : []
    const trackIds: string[] = Array.isArray(seed?.track_ids) ? seed.track_ids : []
    const creationIds: string[] = Array.isArray(seed?.creation_ids)
        ? seed.creation_ids
        : []
    const chunks: string[] = []

    if (albumIds.length) {
        const { data } = await sb
            .from("suno_albums")
            .select("name, vibe_tag, archetype, genre")
            .in("id", albumIds)
        for (const a of data || []) {
            chunks.push(
                `ÁLBUM "${a.name}" [${a.archetype}] — ${a.genre}. Vibe: ${a.vibe_tag}`
            )
        }
    }
    if (trackIds.length) {
        const { data } = await sb
            .from("suno_tracks")
            .select("title, style_prompt, excludes, weirdness, style_influence")
            .in("id", trackIds)
        for (const t of data || []) {
            const ex = Array.isArray(t.excludes) ? t.excludes.join(", ") : ""
            const pct = [
                t.weirdness != null ? `weirdness ${t.weirdness}` : "",
                t.style_influence != null ? `style influence ${t.style_influence}` : "",
            ]
                .filter(Boolean)
                .join(" · ")
            chunks.push(
                `TRACK "${t.title}" — ${t.style_prompt}` +
                    (ex ? ` | excludes: ${ex}` : "") +
                    (pct ? ` | ${pct}` : "")
            )
        }
    }
    if (creationIds.length) {
        const { data } = await sb
            .from("suno_creations")
            .select("title, direction_name, style_prompt")
            .in("id", creationIds)
        for (const c of data || []) {
            chunks.push(
                `CREACIÓN PREVIA "${c.title}" [${c.direction_name}] — ${c.style_prompt}`
            )
        }
    }
    return {
        ctx: chunks.join("\n"),
        count: albumIds.length + trackIds.length + creationIds.length,
    }
}

async function priorLyrics(norteKey: string, excludeId?: string): Promise<string[]> {
    if (!norteKey) return []
    const { data } = await sb
        .from("suno_creations")
        .select("id, title, lyrics")
        .eq("norte_key", norteKey)
        .eq("status", "ready")
        .not("lyrics", "is", null)
        .order("generated_at", { ascending: false })
        .limit(16)
    return (data || [])
        .filter((r: any) => r.id !== excludeId && (r.lyrics || "").trim())
        .map((r: any) => `«${r.title}»:\n${r.lyrics}`)
}

function computeNorteKey(seed: any): string {
    const project = String(seed?.project || "").trim()
    if (project) return `proj:${project.toLowerCase()}`
    const albums: string[] = Array.isArray(seed?.album_ids)
        ? [...seed.album_ids].sort()
        : []
    if (albums.length) return `alb:${albums.join("+")}`
    return "libre"
}

/* ═══════════════════════════════════════════════════════════════
   5. Bloques de prompt reusables
   ═══════════════════════════════════════════════════════════════ */

function seedBlock(seed: any, norte: { ctx: string; count: number }): string {
    const parts: string[] = []
    if (seed?.text?.trim()) parts.push(`Texto libre: ${seed.text.trim()}`)
    if (seed?.reference?.trim())
        parts.push(
            `Referencia de estilo "tipo…": ${seed.reference.trim()} — DESCRIBE ese estilo con tus palabras; NUNCA nombres al artista ni la canción (Suno bloquea nombres reales).`
        )
    if (seed?.image_vibe?.trim())
        parts.push(`Imagen leída (vibe sonoro que evoca): ${seed.image_vibe.trim()}`)
    // La fusión se DERIVA de la selección (sin control visible en el panel).
    if (norte.count > 1)
        parts.push("Hay varios elementos elegidos: FUSIONA sus vibes en una dirección híbrida coherente.")
    else if (norte.count === 1)
        parts.push("Hay un elemento elegido: quédate fiel a su vibe.")
    else parts.push("Sin elementos elegidos: parte del ADN puro de Red Solar Viva.")
    parts.push(inspirationHint(String(seed?.inspiration || "med")))
    if (norte.ctx) parts.push(`ELEMENTOS ELEGIDOS:\n${norte.ctx}`)
    return parts.join("\n")
}

function directionBlock(direction: any): string {
    if (!direction) return ""
    return [
        `Dirección: ${direction.name || ""}`,
        direction.essence ? `Esencia: ${direction.essence}` : "",
        direction.genres ? `Géneros: ${direction.genres}` : "",
        direction.instrumentation ? `Instrumentación: ${direction.instrumentation}` : "",
        direction.mood ? `Mood: ${direction.mood}` : "",
        direction.tempo_feel ? `Tempo/feel: ${direction.tempo_feel}` : "",
        direction.production ? `Producción: ${direction.production}` : "",
        direction.notes ? `Notas: ${direction.notes}` : "",
    ]
        .filter(Boolean)
        .join("\n")
}

function knobsBlock(knobs: any): string {
    if (!knobs || typeof knobs !== "object") return ""
    const L: string[] = []
    const axis = (key: string, lo: string, hi: string, label: string) => {
        const v = Number(knobs[key])
        if (!Number.isFinite(v)) return
        let pos = "equilibrio"
        if (v <= 20) pos = `muy ${lo}`
        else if (v <= 40) pos = lo
        else if (v >= 80) pos = `muy ${hi}`
        else if (v >= 60) pos = hi
        L.push(`- ${label}: ${pos}`)
    }
    axis("epicidad", "íntimo/emocional", "épico/expansivo", "Escala")
    axis("terrenalidad", "etéreo/celestial", "terrenal/orgánico", "Materia")
    axis("ritmo", "meditativo/lento", "rítmico/activo", "Tempo")
    axis("densidad", "minimal/ambient", "denso/orquestal", "Densidad")
    axis("estructura", "frecuencial (drone/Hz sagrados)", "melódico/estructurado", "Forma")
    axis("produccion", "cristalino/digital", "análogo/cálido", "Producción")
    return L.length ? `PERILLAS (aplícalas de verdad):\n${L.join("\n")}` : ""
}

function lyricsLangInstruction(lang: string): string {
    if (lang === "en")
        return "Letra en INGLÉS, de alta frecuencia (unidad, luz, elevación, gratitud, no-dualidad)."
    if (lang === "luminico")
        return `Letra en LENGUAJE LUMÍNICO (idioma vocal propio de fonemas solares, NO palabras reales). Combina fonemas de este léxico semilla, inventando en el mismo espíritu: ${LEXICO_LUMINICO} Vocales largas sostenidas, sílabas radiantes, sensación de coro que invoca luz.`
    if (lang === "mantra")
        return "Letra como MANTRA / VOCALIZACIONES: sílabas semilla repetidas (om, ah, sol, lu…), sostenidas, hipnóticas, de alta frecuencia. Poca o ninguna palabra literal."
    return "Letra en ESPAÑOL, de alta frecuencia (unidad, luz, elevación, gratitud, no-dualidad; nunca miedo/escasez/oscuridad)."
}

const LYRICS_RULES = `REGLAS DE LETRA (INQUEBRANTABLES):
- ALTA FRECUENCIA SIEMPRE: unidad, soberanía, luz, elevación, gratitud, presencia, no-dualidad, sol interior. JAMÁS miedo, escasez, oscuridad, violencia, tristeza densa.
- VOZ DE LA MARCA — sofisticación geométrica y profundidad filosófica, NO "new age" genérico:
  · PROHIBIDA la palabra "silicio".
  · PROHIBIDO el cliché espiritual / naturaleza de postal: "hojas que cantan", "susurros de luz", "abrazo eterno", "bosque místico", "el viento lleva tu nombre", "la tierra respira", "madre tierra", ángeles, hadas y equivalentes blandos.
  · Fusiona lo ORGÁNICO con lo TECNOLÓGICO-CRISTALINO de forma elegante y quirúrgica. Vocabulario guía (elige 3-5 conceptos por letra y desarróllalos — no los enlistes mecánicamente): bioma cuántico, red viva de información, vectores de fuerza, geometría cristalina, agua estructurada, calibración de la materia, coherencia, resonancia, firma cuántica, campo, corriente, circuito, señal, plasma, fractal, y el despertar del Avatar de Luz.
  · La naturaleza SÍ puede aparecer, pero como TECNOLOGÍA VIVA (el bosque = red que transmite información; el agua = memoria estructurada; el sol = fuente que calibra; las raíces = fibra de memoria), nunca como postal romántica.
  · Precisión sobre sentimentalismo: cada imagen con filo geométrico/físico. La persona que canta es SOBERANA y activa (recuerda, calibra, transmite), no un espectador que contempla.
- CANTABLE: frases cortas con peso, casi mantra cuando convenga; no un ensayo.
- Meta-tags de estructura entre corchetes: [Intro] [Verso] [Coro] [Puente] [Outro] [Instrumental] según convenga.`

// Nivel de similitud entre las piezas nuevas y la original (álbum-desde-track):
// directriz + temperatura del modelo + jitter máx de weirdness/style_influence.
function similarityProfile(sim: string): { block: string; temp: number; jitter: number } {
    if (sim === "high")
        return {
            block: `NIVEL DE SIMILITUD: MÁXIMO (GEMELAS). Las piezas nuevas deben sonar INEQUÍVOCAMENTE como parte de la MISMA sesión de grabación que la original: MISMO BPM exacto, MISMA tonalidad/escala, los MISMOS instrumentos centrales NOMBRADOS IGUAL (reusa TEXTUALMENTE las palabras clave de instrumentación y producción de la original), la MISMA densidad y el MISMO carácter de mezcla. Lo ÚNICO que cambia de una pieza a otra es la energía/momento emocional y una variación melódica o de arreglo SUTIL. PROHIBIDO introducir géneros, instrumentos o texturas que la original NO tenga. Cada "style_prompt" debe compartir el 80-90% de sus descriptores con el de la original.`,
            temp: 0.5,
            jitter: 2,
        }
    if (sim === "low")
        return {
            block: `NIVEL DE SIMILITUD: LIBRE (PRIMAS). Comparten el mundo/género y el espíritu de la original, pero cada pieza explora con libertad su propio ángulo — puede variar la instrumentación secundaria, la densidad y la energía. Son familia, no gemelas.`,
            temp: 0.92,
            jitter: 12,
        }
    return {
        block: `NIVEL DE SIMILITUD: MEDIO (HERMANAS). Claramente del MISMO álbum: conserva el BPM, la familia de instrumentos y el carácter de producción de la original, y reusa varios de sus descriptores clave; cada pieza es un ángulo distinto del viaje pero se reconoce AL INSTANTE como parte de la misma obra.`,
        temp: 0.72,
        jitter: 6,
    }
}
// Acota un valor a un rango estrecho [base±jitter], clamp a 1..99.
function clampNear(v: any, base: number, jitter: number): number {
    const n = Number.isFinite(Number(v)) ? Math.round(Number(v)) : base
    return Math.max(1, Math.min(99, Math.max(base - jitter, Math.min(base + jitter, n))))
}

// Reglas de la PORTADA de álbum (prompt de arte para Nano Banana).
function coverRules(albumTitle: string): string {
    return `REGLAS DE "cover_prompt" (portada del álbum, para un generador de imagen):
- TODO en INGLÉS. Abre con "Aspect Ratio: 1:1." y cierra con "Aspect Ratio: 1:1." (la etiqueta manda).
- Fotorrealismo cinematográfico premium y etéreo (NUNCA ilustración plana ni 3D plástico): luz volumétrica, cristal, agua estructurada, bioluminiscencia, geometría sagrada sutil, atmósfera de amanecer/cosmos según el pulso del álbum.
- Composición de PORTADA: UN motivo central icónico y limpio que traduzca el pulso del álbum, aire alrededor, legible en miniatura (como portada de Spotify).
- Incluye el título del álbum «${albumTitle}» renderizado en una sola línea de tipografía minimalista elegante y luminosa, discreta, integrada a la escena.
- PROHIBIDO: personas famosas, logos, texto adicional, marcas de agua, kitsch new age (hadas, unicornios, ángeles de postal), lens flare barato.`
}

// Insert resiliente: si la migración 20260710 (set_cover_prompt) no está pegada
// aún, PostgREST rechaza la columna desconocida → reintenta sin ella para que
// el álbum NUNCA se pierda por el orden de los deploys.
async function insertCreations(rows: Record<string, any>[]) {
    let { data, error } = await sb.from("suno_creations").insert(rows).select("*")
    if (error && /set_cover_prompt|produced_/i.test(error.message || "")) {
        const stripped = rows.map((r) => {
            const { set_cover_prompt: _c, produced_at: _p, produced_url: _u, ...rest } = r
            return rest
        })
        ;({ data, error } = await sb.from("suno_creations").insert(stripped).select("*"))
    }
    return { data, error }
}

/* ═══════════════════════════════════════════════════════════════
   6. HANDLERS
   ═══════════════════════════════════════════════════════════════ */

async function handleDescribeImage(orKey: string, body: any) {
    const dataUrl = String(body?.image_base64 || "")
    if (!dataUrl.startsWith("data:")) throw new Error("image_required")
    const prompt = `Eres director musical de Red Solar Viva (ambient etéreo, solarwave, coros de luz, agua, cristal, alta frecuencia). Mira esta imagen y descríbela como un VIBE SONORO: qué música evoca (géneros, instrumentación, mood, textura, tempo), en 2-4 frases, en español. Solo el vibe, sin describir literalmente la imagen ni mencionar que es una imagen.`
    const vibe = await callVision(orKey, dataUrl, prompt)
    return { ok: true, image_vibe: vibe }
}

async function handleDirections(orKey: string, seed: any) {
    const norte = await resolveNorte(seed)
    const voice =
        seed?.instrumental === true
            ? "Será INSTRUMENTAL (sin voz)."
            : seed?.instrumental === false
              ? "Llevará VOZ (coro/lenguaje lumínico, nunca pop)."
              : ""
    const system = `Eres el director sonoro de Red Solar Viva. Propones DIRECCIONES musicales para generar en Suno, siempre dentro del ADN de la marca. Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}

${ARQUETIPOS}`
    const user = `A partir de esta semilla, propón 3 o 4 DIRECCIONES candidatas DISTINTAS de verdad entre sí (tomadas de los 7 arquetipos + la semilla; no repitas la misma con otro nombre).

SEMILLA:
${seedBlock(seed, norte)}
${voice}

Devuelve SOLO este JSON:
{
  "directions": [
    { "key": "slug-corto", "name": "nombre evocador (ej. Etéreo Acuático, House Solar, Coral Lumínico)", "essence": "1 frase: el alma", "genres": "géneros Suno por coma", "instrumentation": "instrumentación firma", "mood": "3-5 moods", "why": "por qué encaja con la semilla, 1 frase" }
  ]
}`
    const out = await callDeepSeek(orKey, system, user, 0.9)
    const dirs = Array.isArray(out?.directions)
        ? out.directions
        : Array.isArray(out)
          ? out
          : Array.isArray(out?.candidates)
            ? out.candidates
            : []
    if (!dirs.length)
        console.warn("[suno] directions vacías. Respuesta cruda:", JSON.stringify(out).slice(0, 400))
    return { ok: true, directions: dirs }
}

async function handleRefine(orKey: string, body: any) {
    const seed = body?.seed || {}
    const norte = await resolveNorte(seed)
    const system = `Eres el director sonoro de Red Solar Viva. Afinas UNA dirección musical con las perillas del arquitecto, sin salirte del ADN. Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}`
    const user = `Afina esta dirección aplicando las perillas. Mantén el ADN.

${directionBlock(body?.direction)}

${knobsBlock(body?.knobs)}

Contexto de la semilla:
${seedBlock(seed, norte)}

Devuelve SOLO este JSON (una dirección refinada):
{ "direction": { "name": "nombre", "essence": "1 frase", "genres": "géneros por coma", "instrumentation": "instrumentación", "mood": "moods", "tempo_feel": "tempo/BPM aprox", "production": "carácter de producción", "notes": "1-2 notas que reflejen las perillas" } }`
    const out = await callDeepSeek(orKey, system, user, 0.8)
    return { ok: true, direction: out?.direction || out }
}

// Construye un objeto de fila de suno_creations a partir de un paquete Suno.
function buildRow(pkg: any, ctx: {
    seed: any
    direction: any
    knobs: any
    instrumental: boolean
    lyricsLang: string
    norteKey: string
    adminId: string
    set_id?: string | null
    set_title?: string
    track_no?: number | null
    total_tracks?: number | null
    angle?: string
    set_cover_prompt?: string
}): Record<string, any> {
    const seed = ctx.seed || {}
    return {
        title: String(pkg?.title || "Sin título").slice(0, 200),
        direction_name: String(ctx.direction?.name || "").slice(0, 160),
        direction: ctx.direction || null,
        seed_text: String(seed?.text || "").slice(0, 4000),
        reference_text: String(seed?.reference || "").slice(0, 1000),
        project: String(seed?.project || "").slice(0, 200),
        norte_key: ctx.norteKey,
        norte_album_ids: Array.isArray(seed?.album_ids) ? seed.album_ids : [],
        norte_track_ids: Array.isArray(seed?.track_ids) ? seed.track_ids : [],
        norte_creation_ids: Array.isArray(seed?.creation_ids) ? seed.creation_ids : [],
        inspiration: String(seed?.inspiration || "med"),
        norte_mode: ctx.set_id ? "album" : "single",
        knobs: ctx.knobs || null,
        instrumental: ctx.instrumental,
        lyrics_lang: ctx.instrumental ? null : ctx.lyricsLang,
        style_prompt: String(pkg?.style_prompt || "").slice(0, 4000),
        excludes: mergeExcludes(pkg?.excludes),
        weirdness: clampPct(pkg?.weirdness, 40),
        style_influence: clampPct(pkg?.style_influence, 70),
        lyrics: ctx.instrumental ? null : String(pkg?.lyrics || ""),
        config_notes: String(pkg?.config_notes || "Suno v4.5").slice(0, 500),
        status: "ready",
        generated_by_clerk_id: ctx.adminId,
        set_id: ctx.set_id ?? null,
        set_title: ctx.set_title || "",
        track_no: ctx.track_no ?? null,
        total_tracks: ctx.total_tracks ?? null,
        angle: ctx.angle || "",
        // Solo viaja cuando el modo la genera (álbum): así el insert de una
        // pieza suelta no depende de la migración 20260710.
        ...(ctx.set_cover_prompt !== undefined
            ? { set_cover_prompt: ctx.set_cover_prompt }
            : {}),
    }
}

async function handleFinalize(orKey: string, body: any, adminId: string) {
    const seed = body?.seed || {}
    const norte = await resolveNorte(seed)
    const instrumental = !!body?.instrumental
    const lyricsLang = String(body?.lyrics_lang || "es")
    const norteKey = computeNorteKey(seed)

    let antiRep = ""
    if (!instrumental) {
        const prior = await priorLyrics(norteKey)
        if (prior.length)
            antiRep = `\n\nLETRAS YA CREADAS DE ESTE MISMO HILO (NO las repitas — nueva letra, mismo espíritu, distinta expresión):\n${prior.join("\n---\n")}`
    }

    const voiceInstruction = instrumental
        ? 'INSTRUMENTAL: sin voz. La clave "lyrics" DEBE ser cadena vacía "".'
        : `CON VOZ. ${lyricsLangInstruction(lyricsLang)}\n${LYRICS_RULES}${antiRep}`

    const system = `Eres el ingeniero de prompts de Suno de Red Solar Viva. Conviertes una dirección afinada en el PROMPT COMPLETO listo para pegar en Suno, dentro del ADN. Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}

REGLAS DEL OUTPUT:
- "style_prompt" = el campo "Styles" de Suno: género + mood + instrumentación + voz + tempo + producción, en INGLÉS descriptivo y rico. PROHIBIDO nombrar artistas o canciones reales.
- "excludes" = estilos a excluir coherentes con la dirección + los universales que apliquen.
- "weirdness" y "style_influence" = enteros (0–99). Respeta la correlación del ADN y la inspiración.`

    const user = `Arma el prompt final de Suno para esta dirección.

${directionBlock(body?.direction)}

${knobsBlock(body?.knobs)}

Semilla:
${seedBlock(seed, norte)}

VOZ: ${voiceInstruction}

Devuelve SOLO este JSON:
{ "title": "título evocador (español, corto)", "style_prompt": "campo Styles de Suno, en inglés, rico", "excludes": ["estilo","..."], "weirdness": 40, "style_influence": 70, "lyrics": "letra con meta-tags [Intro][Verso]... o \"\" si instrumental", "config_notes": "1 línea de notas de config" }`

    const out = await callDeepSeek(orKey, system, user, 0.75)
    const row = buildRow(out, { seed, direction: body?.direction, knobs: body?.knobs, instrumental, lyricsLang, norteKey, adminId })

    const { data: saved, error } = await sb
        .from("suno_creations")
        .insert(row)
        .select("*")
        .single()
    if (error) throw new Error(`insert ${error.message}`)
    return { ok: true, creation: saved }
}

async function handleAlbum(orKey: string, body: any, adminId: string) {
    const startedAt = Date.now()
    const seed = body?.seed || {}
    const norte = await resolveNorte(seed)
    const instrumental = !!body?.instrumental
    const lyricsLang = String(body?.lyrics_lang || "es")
    const count = Math.max(3, Math.min(12, Math.round(Number(body?.count) || 6)))
    const albumTitle = String(body?.album_title || seed?.project || "Álbum Solar").slice(0, 200)
    const sim = similarityProfile(String(body?.similarity || "medium"))
    // El álbum es su propio hilo (sus tracks no repiten letras entre sí).
    seed.project = albumTitle
    const norteKey = `proj:${albumTitle.toLowerCase()}`

    // ── Paso 1: PULSO CORE + N esqueletos de track (compacto, fiable). ──
    const skelSystem = `Eres el productor de álbumes de Red Solar Viva. Diseñas un ÁLBUM cohesivo: un PULSO CORE (la vibración madre) y N piezas, cada una un ÁNGULO distinto del core con el MISMO estilo (diferentes pero matchean). Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}`
    const skelUser = `Diseña un álbum de ${count} piezas sobre esta dirección.

${directionBlock(body?.direction)}

${knobsBlock(body?.knobs)}

Semilla:
${seedBlock(seed, norte)}

El álbum se llama "${albumTitle}". ${instrumental ? "Será INSTRUMENTAL." : `Llevará VOZ. ${lyricsLangInstruction(lyricsLang)}`}

${sim.block}

${coverRules(albumTitle)}

Devuelve SOLO este JSON:
{
  "core": { "pulse": "el pulso core del álbum en 1-2 frases (la vibración compartida)", "excludes": ["estilo","..."], "weirdness": 40, "style_influence": 75 },
  "cover_prompt": "prompt de PORTADA del álbum para el generador de imagen, según las reglas de portada",
  "tracks": [
    { "title": "título de la pieza (español, corto)", "angle": "el ángulo único de esta pieza sobre el core, 1 frase", "style_prompt": "campo Styles de Suno para ESTA pieza (core + este ángulo), en inglés rico", "weirdness": 40, "style_influence": 75 }
  ]
}
Las ${count} piezas comparten el core (mismo estilo) pero cada una es un ángulo/estado distinto, RESPETANDO el nivel de similitud indicado. Ordénalas como un viaje. PROHIBIDO nombrar artistas reales.`

    const skel = await callDeepSeek(orKey, skelSystem, skelUser, sim.temp, 4400)
    const core = skel?.core || {}
    const coverPrompt = String(skel?.cover_prompt || "")
    let tracks: any[] = Array.isArray(skel?.tracks) ? skel.tracks.slice(0, count) : []
    if (!tracks.length) throw new Error("album_skeleton_empty")
    const coreW = clampPct(core.weirdness, 40)
    const coreSI = clampPct(core.style_influence, 75)
    for (const t of tracks) {
        t.weirdness = clampNear(t.weirdness ?? coreW, coreW, sim.jitter)
        t.style_influence = clampNear(t.style_influence ?? coreSI, coreSI, sim.jitter)
    }

    // ── Paso 2: letras por track (si con voz), con anti-repetición acumulada. ──
    const set_id = crypto.randomUUID()
    const priorFromDb = instrumental ? [] : await priorLyrics(norteKey)
    const generatedLyrics: string[] = []

    if (!instrumental) {
        for (let i = 0; i < tracks.length; i++) {
            if (Date.now() - startedAt > ALBUM_DEADLINE_MS) break // deadline: el resto queda regenerable
            const t = tracks[i]
            const already = [...priorFromDb, ...generatedLyrics]
            const antiRep = already.length
                ? `\n\nLETRAS YA ESCRITAS (NO las repitas — cada pieza es única):\n${already.slice(-10).join("\n---\n")}`
                : ""
            const lSys = `Eres el letrista de Red Solar Viva: compositor de vanguardia y director de branding sonoro. Escribes letras de ALTA FRECUENCIA con sofisticación geométrica (jamás "new age" genérico) para Suno. Devuelves ÚNICAMENTE un objeto JSON válido con la clave "lyrics".`
            const lUser = `Escribe la letra de la pieza «${t.title}» del álbum "${albumTitle}".
Pulso core del álbum: ${core.pulse || ""}
Ángulo de esta pieza: ${t.angle || ""}
Estilo: ${t.style_prompt || ""}

${lyricsLangInstruction(lyricsLang)}
${LYRICS_RULES}${antiRep}

Devuelve SOLO: { "lyrics": "letra con meta-tags [Intro][Verso]..." }`
            try {
                const lo = await callDeepSeek(orKey, lSys, lUser, 0.95, 1400)
                const lyr = String(lo?.lyrics || "")
                t.__lyrics = lyr
                if (lyr.trim()) generatedLyrics.push(`«${t.title}»:\n${lyr}`)
            } catch {
                t.__lyrics = ""
            }
        }
    }

    // ── Paso 3: insertar las N filas del álbum. ──
    const rows = tracks.map((t, i) =>
        buildRow(
            {
                title: t.title,
                style_prompt: t.style_prompt,
                excludes: t.excludes || core.excludes,
                weirdness: t.weirdness ?? core.weirdness,
                style_influence: t.style_influence ?? core.style_influence,
                lyrics: instrumental ? "" : t.__lyrics || "",
                config_notes: `Álbum "${albumTitle}" · pieza ${i + 1}/${tracks.length} · Suno v4.5`,
            },
            {
                seed,
                direction: body?.direction,
                knobs: body?.knobs,
                instrumental,
                lyricsLang,
                norteKey,
                adminId,
                set_id,
                set_title: albumTitle,
                track_no: i + 1,
                total_tracks: tracks.length,
                angle: String(t.angle || ""),
                set_cover_prompt: coverPrompt,
            }
        )
    )

    const { data: saved, error } = await insertCreations(rows)
    if (error) throw new Error(`insert ${error.message}`)

    const ordered = (saved || []).sort(
        (a: any, b: any) => (a.track_no || 0) - (b.track_no || 0)
    )
    return {
        ok: true,
        album: {
            set_id,
            set_title: albumTitle,
            core: { pulse: core.pulse || "", weirdness: clampPct(core.weirdness, 40), style_influence: clampPct(core.style_influence, 70) },
            cover_prompt: coverPrompt,
            tracks: ordered,
        },
    }
}

// Convierte UNA pieza suelta en un ÁLBUM: genera N piezas MÁS (ángulos del mismo
// pulso/estilo de la original) y las agrupa con ella en un set.
async function handleExpandAlbum(orKey: string, body: any, adminId: string) {
    const startedAt = Date.now()
    const seedId = String(body?.creation_id || "")
    if (!seedId) throw new Error("creation_id_required")
    const more = Math.max(1, Math.min(11, Math.round(Number(body?.count) || 5)))

    const { data: cr, error } = await sb
        .from("suno_creations")
        .select("*")
        .eq("id", seedId)
        .single()
    if (error || !cr) throw new Error("creation_not_found")
    if (cr.set_id) throw new Error("already_in_album")

    const instrumental = !!cr.instrumental
    const lyricsLang = String(cr.lyrics_lang || "es")
    const albumTitle = String(body?.album_title || cr.title || "Álbum Solar").slice(0, 200)
    const sim = similarityProfile(String(body?.similarity || "medium"))
    const set_id = crypto.randomUUID()
    const norteKey = `proj:${albumTitle.toLowerCase()}`
    const total = more + 1

    const skelSystem = `Eres el productor de álbumes de Red Solar Viva. Amplías una pieza a un ÁLBUM: generas piezas MÁS que son ángulos distintos del MISMO pulso/estilo de la pieza original (diferentes pero matchean). Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}`
    const skelUser = `Pieza original del álbum "${albumTitle}":
Título: ${cr.title}
Estilo: ${cr.style_prompt}
${Array.isArray(cr.excludes) && cr.excludes.length ? `Excludes: ${cr.excludes.join(", ")}` : ""}
Weirdness ${cr.weirdness}, Style Influence ${cr.style_influence}. ${instrumental ? "Será instrumental." : `Llevará voz. ${lyricsLangInstruction(lyricsLang)}`}

${sim.block}

Genera ${more} piezas MÁS (para un álbum de ${total} en total), cada una un ÁNGULO distinto del mismo pulso y estilo de la original, RESPETANDO el nivel de similitud indicado arriba. NO repitas el ángulo de la original.

${coverRules(albumTitle)}

Devuelve SOLO este JSON:
{ "cover_prompt": "prompt de PORTADA del álbum para el generador de imagen, según las reglas de portada", "tracks": [ { "title": "título (español, corto)", "angle": "ángulo único, 1 frase", "style_prompt": "campo Styles de Suno en inglés (mismo estilo, otro ángulo)", "weirdness": ${cr.weirdness ?? 40}, "style_influence": ${cr.style_influence ?? 70} } ] }`

    const skel = await callDeepSeek(orKey, skelSystem, skelUser, sim.temp, 3900)
    const coverPrompt = String(skel?.cover_prompt || "")
    const tracks: any[] = Array.isArray(skel?.tracks) ? skel.tracks.slice(0, more) : []
    if (!tracks.length) throw new Error("expand_skeleton_empty")
    const baseW = clampPct(cr.weirdness, 40)
    const baseSI = clampPct(cr.style_influence, 70)
    for (const t of tracks) {
        t.weirdness = clampNear(t.weirdness, baseW, sim.jitter)
        t.style_influence = clampNear(t.style_influence, baseSI, sim.jitter)
    }

    if (!instrumental) {
        const base = await priorLyrics(norteKey, seedId)
        if ((cr.lyrics || "").trim()) base.push(`«${cr.title}»:\n${cr.lyrics}`)
        const generated: string[] = []
        for (let i = 0; i < tracks.length; i++) {
            if (Date.now() - startedAt > ALBUM_DEADLINE_MS) break
            const t = tracks[i]
            const already = [...base, ...generated]
            const antiRep = already.length
                ? `\n\nLETRAS YA ESCRITAS (NO las repitas):\n${already.slice(-10).join("\n---\n")}`
                : ""
            const lSys = `Eres el letrista de Red Solar Viva: compositor de vanguardia y director de branding sonoro. Escribes letras de ALTA FRECUENCIA con sofisticación geométrica (jamás "new age" genérico) para Suno. Devuelves ÚNICAMENTE un objeto JSON válido con la clave "lyrics".`
            const lUser = `Letra de «${t.title}» del álbum "${albumTitle}". Ángulo: ${t.angle || ""}. Estilo: ${t.style_prompt || ""}
${lyricsLangInstruction(lyricsLang)}
${LYRICS_RULES}${antiRep}
Devuelve SOLO: { "lyrics": "letra con meta-tags [Intro][Verso]..." }`
            try {
                const lo = await callDeepSeek(orKey, lSys, lUser, 0.95, 1400)
                const lyr = String(lo?.lyrics || "")
                t.__lyrics = lyr
                if (lyr.trim()) generated.push(`«${t.title}»:\n${lyr}`)
            } catch {
                t.__lyrics = ""
            }
        }
    }

    // La original pasa a ser la pieza 1 del álbum.
    await sb
        .from("suno_creations")
        .update({ set_id, set_title: albumTitle, track_no: 1, total_tracks: total, angle: cr.angle || "Pieza original", norte_key: norteKey })
        .eq("id", seedId)
    // Portada en un update aparte: si la migración 20260710 falta, este falla
    // solo (sin tumbar la conversión).
    if (coverPrompt)
        await sb.from("suno_creations").update({ set_cover_prompt: coverPrompt }).eq("id", seedId)

    const rows = tracks.map((t, i) =>
        buildRow(
            {
                title: t.title,
                style_prompt: t.style_prompt,
                excludes: t.excludes || cr.excludes,
                weirdness: t.weirdness ?? cr.weirdness,
                style_influence: t.style_influence ?? cr.style_influence,
                lyrics: instrumental ? "" : t.__lyrics || "",
                config_notes: `Álbum "${albumTitle}" · pieza ${i + 2}/${total} · Suno v4.5`,
            },
            {
                seed: { text: cr.seed_text, reference: cr.reference_text, project: albumTitle },
                direction: cr.direction,
                knobs: cr.knobs,
                instrumental,
                lyricsLang,
                norteKey,
                adminId,
                set_id,
                set_title: albumTitle,
                track_no: i + 2,
                total_tracks: total,
                angle: String(t.angle || ""),
                set_cover_prompt: coverPrompt,
            }
        )
    )
    const { error: insErr } = await insertCreations(rows)
    if (insErr) throw new Error(`insert ${insErr.message}`)

    const { data: all } = await sb
        .from("suno_creations")
        .select("*")
        .eq("set_id", set_id)
        .eq("status", "ready")
        .order("track_no", { ascending: true })
    return { ok: true, album: { set_id, set_title: albumTitle, core: { pulse: "" }, cover_prompt: coverPrompt, tracks: all || [] } }
}

// Construye un ÁLBUM alrededor de un PROMPT de Suno YA HECHO (pegado por el
// humano, creado fuera del panel). La pieza pegada = pieza 1 (anchor, su prompt
// EXACTO); genera N piezas complementarias que se sienten hermanas de la
// original al escucharse seguidas. Espejo de handleExpandAlbum, pero seeded desde
// texto pegado en vez de una fila de la DB.
async function handleSeedAlbum(orKey: string, body: any, adminId: string) {
    const startedAt = Date.now()
    const stylePrompt = String(body?.style_prompt || "").trim()
    if (!stylePrompt) throw new Error("style_prompt_required")

    const more = Math.max(1, Math.min(11, Math.round(Number(body?.count) || 5)))
    const instrumental = !!body?.instrumental
    const lyricsLang = String(body?.lyrics_lang || "es")
    const anchorTitle = String(body?.anchor_title || "Pieza original").slice(0, 200)
    const albumTitle = String(body?.album_title || anchorTitle || "Álbum Solar").slice(0, 200)
    const anchorExcludes = parseExcludesRaw(body?.excludes)
    const anchorW = clampPct(body?.weirdness, 40)
    const anchorSI = clampPct(body?.style_influence, 75)
    const producedUrl = String(body?.produced_url || "").trim()
    const sim = similarityProfile(String(body?.similarity || "medium"))
    const set_id = crypto.randomUUID()
    const norteKey = `proj:${albumTitle.toLowerCase()}`
    const total = more + 1

    // ── Pieza 1: el prompt pegado, EXACTO (no pasa por mergeExcludes brand). ──
    const anchorRow = buildRow(
        {
            title: anchorTitle,
            style_prompt: stylePrompt,
            excludes: anchorExcludes,
            weirdness: anchorW,
            style_influence: anchorSI,
            lyrics: "",
            config_notes: `Prompt original (creado en Suno) · pieza 1/${total}`,
        },
        {
            seed: { text: "", reference: "", project: albumTitle },
            direction: { name: "Prompt original" },
            knobs: null,
            instrumental,
            lyricsLang,
            norteKey,
            adminId,
            set_id,
            set_title: albumTitle,
            track_no: 1,
            total_tracks: total,
            angle: "Pieza original (creada en Suno)",
            set_cover_prompt: "",
        }
    )
    anchorRow.excludes = anchorExcludes // preserva sus excludes exactos
    if (producedUrl) {
        anchorRow.produced_at = new Date().toISOString()
        anchorRow.produced_url = producedUrl
    }

    // ── N piezas complementarias (mismo pulso, distinto ángulo) + portada. ──
    const skelSystem = `Eres el productor de álbumes de Red Solar Viva. Amplías una pieza EXISTENTE a un ÁLBUM: generas piezas MÁS que se sienten COMPLETAMENTE INTEGRADAS con la original (mismo tempo/BPM, misma familia de instrumentos y producción, mismo mundo emocional), cada una explorando un ÁNGULO o momento distinto del viaje. Deben sonar como hermanas de la original al escucharse seguidas. Devuelves ÚNICAMENTE un objeto JSON válido.

${ADN_SONORO}`
    const skelUser = `PIEZA ORIGINAL del álbum "${albumTitle}" (creada en Suno; este es su prompt EXACTO):
Estilo (campo Styles): ${stylePrompt}
${anchorExcludes.length ? `Exclude styles: ${anchorExcludes.join(", ")}` : ""}
Weirdness ${anchorW}%, Style Influence ${anchorSI}%. ${instrumental ? "Es instrumental." : `Lleva voz. ${lyricsLangInstruction(lyricsLang)}`}

${sim.block}

Genera ${more} piezas MÁS (álbum de ${total} en total) que suenen como parte del MISMO álbum que la original, RESPETANDO el nivel de similitud indicado arriba. Cada pieza explora otro ángulo o estado del viaje. Cada "style_prompt" en INGLÉS descriptivo y rico. PROHIBIDO nombrar artistas o canciones reales.

${coverRules(albumTitle)}

Devuelve SOLO este JSON:
{ "cover_prompt": "prompt de PORTADA del álbum para el generador de imagen, según las reglas de portada", "tracks": [ { "title": "título (español, corto)", "angle": "ángulo único de esta pieza, 1 frase", "style_prompt": "campo Styles de Suno en inglés (misma familia, otro ángulo)", "weirdness": ${anchorW}, "style_influence": ${anchorSI} } ] }`

    const skel = await callDeepSeek(orKey, skelSystem, skelUser, sim.temp, 3900)
    const coverPrompt = String(skel?.cover_prompt || "")
    const tracks: any[] = Array.isArray(skel?.tracks) ? skel.tracks.slice(0, more) : []
    if (!tracks.length) throw new Error("seed_skeleton_empty")
    // Acota los % de cada pieza al rango de similitud alrededor de la original.
    for (const t of tracks) {
        t.weirdness = clampNear(t.weirdness, anchorW, sim.jitter)
        t.style_influence = clampNear(t.style_influence, anchorSI, sim.jitter)
    }

    if (!instrumental) {
        const generated: string[] = []
        for (let i = 0; i < tracks.length; i++) {
            if (Date.now() - startedAt > ALBUM_DEADLINE_MS) break
            const t = tracks[i]
            const antiRep = generated.length
                ? `\n\nLETRAS YA ESCRITAS (NO las repitas):\n${generated.slice(-10).join("\n---\n")}`
                : ""
            const lSys = `Eres el letrista de Red Solar Viva: compositor de vanguardia y director de branding sonoro. Escribes letras de ALTA FRECUENCIA con sofisticación geométrica (jamás "new age" genérico) para Suno. Devuelves ÚNICAMENTE un objeto JSON válido con la clave "lyrics".`
            const lUser = `Letra de «${t.title}» del álbum "${albumTitle}". Ángulo: ${t.angle || ""}. Estilo: ${t.style_prompt || ""}
${lyricsLangInstruction(lyricsLang)}
${LYRICS_RULES}${antiRep}
Devuelve SOLO: { "lyrics": "letra con meta-tags [Intro][Verso]..." }`
            try {
                const lo = await callDeepSeek(orKey, lSys, lUser, 0.95, 1400)
                const lyr = String(lo?.lyrics || "")
                t.__lyrics = lyr
                if (lyr.trim()) generated.push(`«${t.title}»:\n${lyr}`)
            } catch {
                t.__lyrics = ""
            }
        }
    }

    if (coverPrompt) anchorRow.set_cover_prompt = coverPrompt

    const rows = [
        anchorRow,
        ...tracks.map((t, i) =>
            buildRow(
                {
                    title: t.title,
                    style_prompt: t.style_prompt,
                    excludes: t.excludes,
                    weirdness: t.weirdness ?? anchorW,
                    style_influence: t.style_influence ?? anchorSI,
                    lyrics: instrumental ? "" : t.__lyrics || "",
                    config_notes: `Álbum "${albumTitle}" · pieza ${i + 2}/${total} · Suno v4.5`,
                },
                {
                    seed: { text: "", reference: "", project: albumTitle },
                    direction: { name: "Complemento del álbum" },
                    knobs: null,
                    instrumental,
                    lyricsLang,
                    norteKey,
                    adminId,
                    set_id,
                    set_title: albumTitle,
                    track_no: i + 2,
                    total_tracks: total,
                    angle: String(t.angle || ""),
                    set_cover_prompt: coverPrompt,
                }
            )
        ),
    ]

    const { error } = await insertCreations(rows)
    if (error) throw new Error(`insert ${error.message}`)

    const { data: all } = await sb
        .from("suno_creations")
        .select("*")
        .eq("set_id", set_id)
        .eq("status", "ready")
        .order("track_no", { ascending: true })
    return {
        ok: true,
        album: { set_id, set_title: albumTitle, core: { pulse: "" }, cover_prompt: coverPrompt, tracks: all || [] },
    }
}

async function handleLyrics(orKey: string, body: any) {
    const creationId = String(body?.creation_id || "")
    if (!creationId) throw new Error("creation_id_required")

    const { data: cr, error } = await sb
        .from("suno_creations")
        .select("*")
        .eq("id", creationId)
        .single()
    if (error || !cr) throw new Error("creation_not_found")

    const lang = String(body?.lyrics_lang || cr.lyrics_lang || "es")
    const refineNote = String(body?.refine_note || "").trim().slice(0, 500)
    const prior = await priorLyrics(cr.norte_key, creationId)
    const antiRep = prior.length
        ? `\n\nLETRAS YA CREADAS DE ESTE MISMO HILO (NO las repitas):\n${prior.join("\n---\n")}`
        : ""
    const currentAntiRep = (cr.lyrics || "").trim()
        ? `\n\nLETRA ACTUAL (regenera una DISTINTA):\n${cr.lyrics}`
        : ""
    // El afinador: la instrucción libre del arquitecto MANDA sobre todo lo demás
    // (menos las reglas inquebrantables de alta frecuencia).
    const refineBlock = refineNote
        ? `\n\nAFINADOR — INSTRUCCIÓN DEL ARQUITECTO (máxima prioridad; dale ese rumbo a la letra nueva):\n«${refineNote}»`
        : ""

    const system = `Eres el letrista de Red Solar Viva: compositor de vanguardia y director de branding sonoro. Escribes letras de ALTA FRECUENCIA con sofisticación geométrica (jamás "new age" genérico) para Suno. Devuelves ÚNICAMENTE un objeto JSON válido con la clave "lyrics".`
    const user = `Escribe una NUEVA letra para esta canción, mismo espíritu, SIN repetir letras previas.

Canción: «${cr.title}» [${cr.direction_name}]${cr.angle ? ` · ángulo: ${cr.angle}` : ""}
Estilo: ${cr.style_prompt}

${lyricsLangInstruction(lang)}
${LYRICS_RULES}${antiRep}${currentAntiRep}${refineBlock}

Devuelve SOLO: { "lyrics": "letra con meta-tags [Intro][Verso]..." }`

    const out = await callDeepSeek(orKey, system, user, 0.95, 1400)
    const lyrics = String(out?.lyrics || "")
    await sb
        .from("suno_creations")
        .update({ lyrics, lyrics_lang: lang, instrumental: false })
        .eq("id", creationId)
    return { ok: true, lyrics }
}

// Genera (o regenera) el PROMPT DE PORTADA de un álbum ya existente en la
// Biblioteca (sets creados antes de v1.5, agrupados a mano, o re-tiradas).
async function handleAlbumCover(orKey: string, body: any) {
    const setId = String(body?.set_id || "")
    if (!setId) throw new Error("set_id_required")

    const { data: tracks, error } = await sb
        .from("suno_creations")
        .select("title, set_title, angle, style_prompt, direction_name")
        .eq("set_id", setId)
        .eq("status", "ready")
        .order("track_no", { ascending: true })
        .limit(14)
    if (error || !tracks?.length) throw new Error("set_not_found")

    const albumTitle = String(tracks[0].set_title || "Álbum Solar")
    const systemP = `Eres el director de arte de Red Solar Viva. Diseñas la PORTADA de un álbum musical traduciendo su pulso sonoro a UNA imagen icónica. Devuelves ÚNICAMENTE un objeto JSON válido con la clave "cover_prompt".`
    const userP = `Diseña la portada del álbum "${albumTitle}".

PIEZAS DEL ÁLBUM (título · ángulo):
${tracks.map((t: any) => `- «${t.title}»${t.angle ? ` · ${t.angle}` : ""}`).join("\n")}

Estilo sonoro global: ${tracks[0].style_prompt || tracks[0].direction_name || ""}

${coverRules(albumTitle)}

Devuelve SOLO: { "cover_prompt": "el prompt de portada, en inglés" }`

    const out = await callDeepSeek(orKey, systemP, userP, 0.85, 900)
    const coverPrompt = String(out?.cover_prompt || "")
    if (!coverPrompt.trim()) throw new Error("cover_empty")

    const { error: upErr } = await sb
        .from("suno_creations")
        .update({ set_cover_prompt: coverPrompt })
        .eq("set_id", setId)
    if (upErr) throw new Error(`cover_save ${upErr.message}`)
    return { ok: true, set_id: setId, cover_prompt: coverPrompt }
}

/* ═══════════════════════════════════════════════════════════════
   7. SERVER
   ═══════════════════════════════════════════════════════════════ */

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS")
        return new Response("ok", { headers: CORS_HEADERS })
    if (req.method !== "POST")
        return new Response(JSON.stringify({ error: "method_not_allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })

    const json = (obj: any, status = 200) =>
        new Response(JSON.stringify(obj), {
            status,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        })

    try {
        const orKey = Deno.env.get("OPENROUTER_API_KEY")
        if (!orKey) return json({ error: "OPENROUTER_API_KEY not set" }, 500)

        const body = await req.json().catch(() => ({}))
        const gate = await gateAdmin(body?.token)
        if (!gate.ok) return json({ error: gate.error }, gate.status || 401)
        const adminId = gate.userId || ""

        const mode = String(body?.mode || "directions")
        const seed = body?.seed || {}

        let result: any
        if (mode === "describe_image") result = await handleDescribeImage(orKey, body)
        else if (mode === "directions") result = await handleDirections(orKey, seed)
        else if (mode === "refine") result = await handleRefine(orKey, body)
        else if (mode === "finalize") result = await handleFinalize(orKey, body, adminId)
        else if (mode === "album") result = await handleAlbum(orKey, body, adminId)
        else if (mode === "expand_album") result = await handleExpandAlbum(orKey, body, adminId)
        else if (mode === "seed_album") result = await handleSeedAlbum(orKey, body, adminId)
        else if (mode === "lyrics") result = await handleLyrics(orKey, body)
        else if (mode === "album_cover") result = await handleAlbumCover(orKey, body)
        else return json({ error: "mode_not_allowed" }, 400)

        return json(result)
    } catch (e: any) {
        console.error("[generate-suno-prompt] fatal:", e)
        return json({ error: "generation_failed", detail: String(e?.message ?? e) }, 502)
    }
})
