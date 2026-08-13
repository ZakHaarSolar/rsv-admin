// admin/supabase/functions/crop-circles-scan/index.ts v1.2
// v1.2 — (a) BÚSQUEDA WEB fresca: 3ª fuente scanWeb() con Gemini + Google Search
//        grounding (candidatos de MENOR confianza → borrador; sin foto → la app
//        muestra la reconstrucción). Corre en LIVE por default (body.web:false la
//        apaga); en DRY solo con body.web:true. (b) DEDUP POR CERCANÍA: el
//        geocode ahora barre TODA la ubicación (no solo la 1ª coma) y marca
//        `precise`; el dedup (memoria + isKnown + scan_insert) usa proximidad
//        ~2 km + fecha cuando el geocode es preciso ("Stone Circle" = Avebury),
//        con el nombre de respaldo. Requiere la migración 20260723b (scan_insert
//        +p_geo_precise, scan_crop_context +lat/lng).
// v1.1 — La corrida LIVE responde al INSTANTE y hace el trabajo pesado (foto HD +
//        Gemini + insert + push) en SEGUNDO PLANO (EdgeRuntime.waitUntil) → ya no
//        se pasa del límite de tiempo de la edge (la causa del error de Zak al
//        correrlo en vivo). El cron http_post también vuelve rápido. DRY sigue
//        sincrónico (devuelve los candidatos). v1.0 — versión inicial.
// Detección automática diaria de Crop Circles.
//
// Barre la web por formaciones NUEVAS y deja BORRADORES (is_published=false)
// para que Zak revise y publique con un toque desde el Motor (NO auto-publica).
//
//   Fuentes:
//     1) cropcircleconnector.com  — PRIMARIO (la fuente rápida: ~2 días de
//        retraso). Index del año → sub-páginas → formaciones; la foto HD vive
//        en la página de detalle.
//     2) temporarytemples.co.uk   — SECUNDARIO (limpio pero ~10 días atrás; sirve
//        de respaldo si el HTML de CCC cambia). Foto full-res derivable del
//        listado (se quita el sufijo -400x284).
//
//   Por cada formación NUEVA (no vista antes ni ya en la siembra/panel):
//     · geocodifica (tabla de sitios frecuentes + centroide de condado),
//     · clasifica el arquetipo y escribe el decode ES/EN con Gemini VISIÓN
//       (voz del Escáner), con respaldo de plantilla si Gemini falla,
//     · INSERTA un borrador (scan_insert_crop_circle_draft, dedupe autoritativo),
//     · al final, push SOLO a los admins (_notify_admins_new_crops).
//
//   Auth: header `x-cron-secret` == CROP_SCAN_SECRET (el cron) O `body.token`
//         admin de Clerk (para probar a mano). `body.dry === true` = barre y
//         devuelve candidatos SIN insertar ni notificar (probar el parseo).
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy crop-circles-scan --no-verify-jwt
//
// Secrets: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · GEMINI_API_KEY ·
//   CROP_SCAN_SECRET (nuevo) · CLERK_SECRET_KEY (para el token admin de prueba)

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"

declare const Deno: any

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const UA = "Mozilla/5.0 (RSV crop scan; +redsolarviva.com)"
// Cota anti-runaway + límite de reloj de la edge. Un backlog mayor se drena
// solo en corridas siguientes (source_slug evita re-procesar lo ya insertado).
const MAX_NEW_PER_RUN = 8

const GEMINI_CASCADE = [
    { model: "gemini-3.6-flash", attempts: 1 },
    { model: "gemini-flash-latest", attempts: 1 },
]
const geminiUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`

/* ── Geocoding: sitios frecuentes (de la siembra) + centroide de condado ── */

const SITE_GEO: Record<string, [number, number]> = {
    roundway: [51.377, -1.975], mardencopse: [51.318, -1.9], marden: [51.318, -1.9],
    chirton: [51.316, -1.905], uffington: [51.578, -1.674], patney: [51.312, -1.905],
    scratchbury: [51.19, -2.083], potterne: [51.335, -2.007], yarnbury: [51.163, -1.918],
    etchilhampton: [51.339, -1.929], hackpen: [51.47, -1.83], bishopssutton: [51.093, -1.113],
    danebury: [51.137, -1.538], stonehenge: [51.179, -1.826], eastonroyal: [51.32, -1.76],
    longwoodwarren: [51.04, -1.257], ogbourne: [51.47, -1.7], stantonstbernard: [51.37, -1.898],
    berwickbassett: [51.46, -1.86], wilton: [51.355, -1.63], burderop: [51.485, -1.78],
    diltonmarsh: [51.26, -2.23], sixpennyhandley: [50.958, -2.01], cleyhill: [51.2, -2.25],
    watershipdown: [51.29, -1.29], marten: [51.33, -1.605], westmeon: [51.01, -1.085],
    swarraton: [51.15, -1.23], tufton: [51.24, -1.36], upham: [50.985, -1.23],
    avebury: [51.428, -1.854], tidcombe: [51.32, -1.56], fulleywood: [51.1, -1.15],
    ludgershall: [51.26, -1.62], woottonrivers: [51.36, -1.72], southwonston: [51.13, -1.32],
    altonpriors: [51.355, -1.843], tawsmead: [51.352, -1.815], barbury: [51.485, -1.78],
    littlehorton: [51.36, -1.96], chilcomb: [51.04, -1.27], froxfield: [51.41, -1.56],
    micheldever: [51.15, -1.27], hippenscombe: [51.32, -1.52], crabwood: [51.065, -1.36],
    waylandssmithy: [51.567, -1.596], prestoncandover: [51.17, -1.1], westbury: [51.26, -2.19],
    charlton: [51.225, -1.49], bartonstacey: [51.15, -1.4], laneend: [51.05, -1.23],
    nortonbavant: [51.185, -2.12], owslebury: [51.02, -1.27], bishopstrow: [51.19, -2.15],
    winterbournebassett: [51.45, -1.87], broadhinton: [51.47, -1.85], stokecharity: [51.15, -1.33],
    badbury: [50.815, -2.058], normantondown: [51.17, -1.83], wiltonwindmill: [51.36, -1.615],
    ludwell: [51.01, -2.1], cerneabbas: [50.81, -2.475], castleyhill: [51.055, -2.74],
    ware: [50.73, -2.96], kingsdon: [51.03, -2.7], suttonveny: [51.17, -2.15],
    wimborne: [50.8, -1.985], milkhill: [51.372, -1.853], zeals: [51.09, -2.27], mere: [51.09, -2.27],
    alfredscastle: [51.56, -1.59], bishopstone: [51.56, -1.59], kingweston: [51.07, -2.68],
    greatwishford: [51.12, -1.93], grovely: [51.12, -1.93], ditcheat: [51.1, -2.52],
    whitesheethill: [51.1, -2.23], jacksplantation: [51.11, -2.32], alfredstower: [51.11, -2.32],
    wadenhill: [51.42, -1.85], ilchester: [51.005, -2.68], wanborough: [51.555, -1.68],
    liddington: [51.545, -1.688], morestead: [51.04, -1.27], yatesbury: [51.42, -1.9],
    windmillhill: [51.43, -1.89], barburycastle: [51.488, -1.771],
}
const COUNTY_GEO: Record<string, [number, number]> = {
    wiltshire: [51.35, -1.99], wilts: [51.35, -1.99],
    hampshire: [51.1, -1.3], hants: [51.1, -1.3],
    oxfordshire: [51.65, -1.4], oxon: [51.65, -1.4],
    dorset: [50.8, -2.1], somerset: [51.05, -2.9], devon: [50.75, -3.5],
}

/* ── Utilidades ── */

function norm(s: string): string {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "")
}
function stripTags(s: string): string {
    return (s || "").replace(/<[^>]*>/g, " ")
}
function decodeEntities(s: string): string {
    return (s || "")
        .replace(/&#8217;|&#x2019;|&#39;|&rsquo;/gi, "'")
        .replace(/&#8211;|&#8212;|&ndash;|&mdash;/gi, "-")
        .replace(/&amp;/gi, "&")
        .replace(/&nbsp;/gi, " ")
        .replace(/&quot;/gi, '"')
        .replace(/&#8230;|&hellip;/gi, "...")
}
function collapseWs(s: string): string {
    return (s || "").replace(/\s+/g, " ").trim()
}

const MONTHS: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
    september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}
/* "21st July" / "12th July 2026" → YYYY-MM-DD (usa el año del texto o el fallback). */
function extractDate(text: string, fallbackYear: number): string | null {
    const m = (text || "").match(
        /(\d{1,2})\s*(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?(?:\s+(\d{4}))?/i
    )
    if (!m) return null
    const day = parseInt(m[1], 10)
    const mo = MONTHS[m[2].toLowerCase()]
    const yr = m[3] ? parseInt(m[3], 10) : fallbackYear
    if (!day || !mo || day < 1 || day > 31) return null
    return `${yr}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function detectCountry(location: string): string {
    const n = (location || "").toLowerCase()
    if (/z[uü]rcher|switzerland|suiza|\bch\b/.test(n)) return "Suiza"
    if (/italy|italia|piemonte|piamonte/.test(n)) return "Italia"
    if (/germany|alemania|bayern|bavaria|baviera/.test(n)) return "Alemania"
    if (/france|francia/.test(n)) return "Francia"
    return "Reino Unido"
}
interface Geo {
    lat: number
    lng: number
    precise: boolean // acertó un sitio real (true) o cayó a centroide/default (false)
}
function geocode(location: string, country: string): Geo {
    // Paso 1 (primario): el nombre del sitio (parte antes de la 1ª coma),
    // bidireccional (etchilhamptonhill contiene etchilhampton).
    const firstN = norm((location || "").split(",")[0])
    let best: [number, number] | null = null
    let bestLen = 0
    for (const key of Object.keys(SITE_GEO)) {
        if (key.length < 4) continue
        if (firstN.indexOf(key) >= 0 || key.indexOf(firstN) >= 0) {
            if (key.length > bestLen) {
                best = SITE_GEO[key]
                bestLen = key.length
            }
        }
    }
    // Paso 2 (respaldo): barrer TODA la ubicación por el "nr Town" cuando el
    // nombre del sitio es genérico (ej. "Stone Circle, nr Avebury, Wiltshire"
    // → acierta avebury). Solo hacia adelante y con claves ≥5 para no atrapar
    // tokens cortos dentro de un texto largo.
    if (!best) {
        const wholeN = norm(location)
        let bl = 0
        for (const key of Object.keys(SITE_GEO)) {
            if (key.length < 5) continue
            if (wholeN.indexOf(key) >= 0 && key.length > bl) {
                best = SITE_GEO[key]
                bl = key.length
            }
        }
    }
    if (best) return { lat: best[0], lng: best[1], precise: true }
    // Centroide de condado (coarse → precise:false, no se usa para proximidad).
    const locN = norm(location)
    for (const key of Object.keys(COUNTY_GEO)) {
        if (locN.indexOf(key) >= 0) return { lat: COUNTY_GEO[key][0], lng: COUNTY_GEO[key][1], precise: false }
    }
    if (country === "Suiza") return { lat: 47.6, lng: 8.75, precise: false }
    if (country === "Italia") return { lat: 44.92, lng: 7.84, precise: false }
    if (country === "Alemania") return { lat: 47.9, lng: 11.11, precise: false }
    return { lat: 51.4, lng: -1.8, precise: false } // default (Wiltshire-ish)
}

async function fetchText(url: string, ms = 20000): Promise<string> {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), ms)
    try {
        const r = await fetch(url, {
            headers: { "User-Agent": UA },
            signal: ctrl.signal,
        })
        if (!r.ok) return ""
        return await r.text()
    } catch {
        return ""
    } finally {
        clearTimeout(to)
    }
}
async function fetchImageB64(
    url: string,
    ms = 25000
): Promise<{ b64: string; mime: string } | null> {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), ms)
    try {
        const r = await fetch(url, {
            headers: { "User-Agent": UA },
            signal: ctrl.signal,
        })
        if (!r.ok) return null
        const mime = r.headers.get("Content-Type") || "image/jpeg"
        if (!mime.startsWith("image/")) return null
        const buf = new Uint8Array(await r.arrayBuffer())
        if (buf.length < 500 || buf.length > 8_000_000) return null // vacío o gigante
        let s = ""
        const chunk = 0x8000
        for (let i = 0; i < buf.length; i += chunk) {
            s += String.fromCharCode(...buf.subarray(i, i + chunk))
        }
        return { b64: btoa(s), mime }
    } catch {
        return null
    } finally {
        clearTimeout(to)
    }
}

/* ── Candidato ── */
interface Cand {
    source: "ccc" | "tt" | "web"
    sourceSlug: string
    title: string
    location: string
    country: string
    date: string // YYYY-MM-DD
    imageUrl?: string // TT: derivada; CCC: se resuelve del detalle; web: ninguna
    detailPath?: string // CCC: <slug>/<slug>2026a.html (para la foto HD)
    siteN: string
    // Geocode resuelto una vez, up front (para el dedup por cercanía).
    lat?: number
    lng?: number
    precise?: boolean // true = acertó un sitio real; false = centroide de condado
}

/* Distancia equirectangular en km (barata, exacta a escala de kilómetros). */
function distKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const dLat = aLat - bLat
    const dLng = (aLng - bLng) * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180)
    return 111.195 * Math.sqrt(dLat * dLat + dLng * dLng)
}

/* ── Fuente 1: cropcircleconnector.com ── */

async function scanCCC(year: number): Promise<Cand[]> {
    const base = `https://www.cropcircleconnector.com/${year}/`
    const index = await fetchText(`${base}${year}.html`)
    if (!index) return []
    // Sub-páginas: href="Xxxx<year>.html" (relativas). Dedup.
    const pages = new Set<string>()
    const re = new RegExp(`href="([A-Za-z]+${year}\\.html)"`, "gi")
    let mm: RegExpExecArray | null
    while ((mm = re.exec(index))) pages.add(mm[1])
    if (pages.size === 0) return []

    const out: Cand[] = []
    const seen = new Set<string>()
    for (const page of pages) {
        const html = await fetchText(`${base}${page}`)
        if (!html) continue
        // Ancla de texto de cada formación (la de imagen se cae al filtrar "Reported").
        const aRe = new RegExp(
            `<a\\s+href="([A-Za-z0-9_\\-]+\\/[A-Za-z0-9_\\-]+${year}[a-z]?\\.html)"[^>]*>([\\s\\S]*?)<\\/a>`,
            "gi"
        )
        let a: RegExpExecArray | null
        while ((a = aRe.exec(html))) {
            const href = a[1]
            const inner = collapseWs(decodeEntities(stripTags(a[2])))
            if (!/reported/i.test(inner)) continue // descarta la ancla de <img>
            const slug = `ccc:${href}`
            if (seen.has(slug)) continue
            const parts = inner.split(/reported/i)
            const titlePart = collapseWs(parts[0]).replace(/[.,;\s]+$/, "")
            const dateText = collapseWs(parts[1] || "")
            const date = extractDate(dateText, year)
            if (!titlePart || !date) continue
            seen.add(slug)
            const country = detectCountry(titlePart)
            out.push({
                source: "ccc",
                sourceSlug: slug,
                title: collapseWs(titlePart.split(",")[0]),
                location: titlePart,
                country,
                date,
                detailPath: href,
                siteN: norm(titlePart.split(",")[0]),
            })
        }
    }
    return out
}
/* Foto HD del detalle CCC: primer <img width="800"> con src RELATIVA. */
async function cccHero(year: number, detailPath: string): Promise<string | undefined> {
    const dir = detailPath.split("/")[0]
    const url = `https://www.cropcircleconnector.com/${year}/${detailPath}`
    const html = await fetchText(url)
    if (!html) return undefined
    const imgs = html.match(/<img\b[^>]*>/gi) || []
    for (const tag of imgs) {
        if (!/\bwidth="800"/i.test(tag)) continue
        const sm = tag.match(/\bsrc="([^"]+)"/i)
        if (!sm) continue
        const src = sm[1]
        if (/^https?:\/\//i.test(src)) continue
        if (src.indexOf("../") >= 0) continue
        if (/\/images\/|banner|logo|spacer|button/i.test(src)) continue
        return `https://www.cropcircleconnector.com/${year}/${dir}/${src}`
    }
    return undefined
}

/* ── Fuente 2: temporarytemples.co.uk ── */

async function scanTT(year: number): Promise<Cand[]> {
    const html = await fetchText(
        `https://temporarytemples.co.uk/crop-circles/${year}-crop-circles`
    )
    if (!html) return []
    const out: Cand[] = []
    const seen = new Set<string>()
    const re =
        /<a\s+href="https:\/\/temporarytemples\.co\.uk\/project\/([^"]+?)"\s+title="([^"]*)"[^>]*>[\s\S]{0,500}?<img[^>]*\bsrc="([^"]+?-\d+x\d+\.\w+)"/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
        const slugRaw = m[1]
        if (/season|info|overview/i.test(slugRaw)) continue
        const slug = `tt:${slugRaw}`
        if (seen.has(slug)) continue
        const title = decodeEntities(m[2])
        const thumb = m[3]
        const bar = title.split("|")
        const locPart = collapseWs(bar[0])
        const dateText = collapseWs(bar[1] || "")
        const date = extractDate(dateText, year)
        if (!locPart || !date) continue
        seen.add(slug)
        const country = detectCountry(locPart)
        out.push({
            source: "tt",
            sourceSlug: slug,
            title: collapseWs(locPart.split(",")[0]),
            location: locPart,
            country,
            date,
            imageUrl: thumb.replace(/-\d+x\d+(\.\w+)$/, "$1"),
            siteN: norm(locPart.split(",")[0]),
        })
    }
    return out
}

/* ── Fuente 3: BÚSQUEDA WEB (Gemini + Google Search grounding) ──
   Lo más fresco de internet (prensa/social), MENOR confianza → borrador para
   revisión. Sin imagen (la app pinta la reconstrucción; Zak sube la foto al
   verificar). Los duplicados de CCC/TT los quita el dedup por sitio/fecha. */
async function scanWeb(year: number, apiKey: string): Promise<Cand[]> {
    if (!apiKey) return []
    const prompt = `Busca en internet CROP CIRCLES (círculos de las cosechas) REPORTADOS en los ÚLTIMOS 21 DÍAS, año ${year}, en cualquier país (sobre todo Reino Unido). Usa la búsqueda web.
Devuelve SOLO un array JSON, sin texto alrededor ni fences:
[{"title":"nombre del sitio","location":"Sitio, Condado","country":"Reino Unido","date":"YYYY-MM-DD","source_url":"https://..."}]
Reglas ESTRICTAS:
- Solo formaciones con FECHA y LUGAR específicos citados en una fuente real (cropcircleconnector.com, temporarytemples.co.uk, cropcirclewisdom, prensa local). NO inventes.
- Si dudas de una, OMÍTELA. Si no encuentras ninguna nueva, devuelve exactamente [].
- Máximo 6. Fecha SIEMPRE en formato ISO YYYY-MM-DD.`
    const models = ["gemini-flash-latest", "gemini-3.6-flash"]
    for (const model of models) {
        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 22000)
        try {
            const r = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    tools: [{ google_search: {} }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 1400 },
                }),
                signal: ctrl.signal,
            })
            clearTimeout(to)
            if (!r.ok) {
                console.log(`[crop-scan] web ${r.status} (${model})`)
                continue
            }
            const j = await r.json()
            const txt =
                j?.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p?.text || "")
                    .join("") || ""
            const s = txt.indexOf("[")
            const e = txt.lastIndexOf("]")
            if (s < 0 || e <= s) continue
            let arr: any[] = []
            try {
                arr = JSON.parse(txt.slice(s, e + 1))
            } catch {
                continue
            }
            if (!Array.isArray(arr)) continue
            const out: Cand[] = []
            const seen = new Set<string>()
            for (const it of arr) {
                const loc = collapseWs(String(it?.location || it?.title || ""))
                const rawDate = String(it?.date || "")
                const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                    ? rawDate
                    : extractDate(rawDate, year)
                if (!loc || !date) continue
                const siteN = norm(loc.split(",")[0])
                if (siteN.length < 3) continue
                const slug = `web:${siteN}-${date}`
                if (seen.has(slug)) continue
                seen.add(slug)
                const country = collapseWs(String(it?.country || "")) || detectCountry(loc)
                out.push({
                    source: "web",
                    sourceSlug: slug,
                    title: collapseWs(String(it?.title || loc.split(",")[0])),
                    location: loc,
                    country,
                    date,
                    siteN,
                })
            }
            if (out.length) return out.slice(0, MAX_NEW_PER_RUN)
        } catch (err) {
            clearTimeout(to)
            console.log(`[crop-scan] web error (${model}):`, String(err))
        }
    }
    return []
}

/* ── Decode: Gemini VISIÓN (voz del Escáner) con respaldo de plantilla ── */

const VOICE_PROMPT = `Eres la voz del "Escáner Vibracional" decodificando un crop circle real a partir de su foto aérea y su contexto (sitio, fecha, país).
Devuelve SOLO JSON: {"archetype": "...", "decoded_es": "...", "decoded_en": "..."}.
- "archetype": exactamente UNO de: mandala, spiral, grid, orbits, web, tri (según la geometría dominante que ves en la foto).
- "decoded_es" y "decoded_en": 2 a 3 frases en la voz del Escáner. Tono: sereno, evocador, grounded (energía/geometría/campo), NUNCA new age cursi ni pseudo-científico. Describe la geometría que se ve y lo que evoca como estado, no como mensaje literal. Cierra ubicando la formación (sitio + fecha).
- PROHIBIDO: em dashes (usa coma o punto), signos de exclamación, listas, viñetas.
Ejemplo de voz (es): "Anillos concéntricos que se tejen hacia adentro alrededor de un centro encendido. No entrega un mensaje para leer: entrega un estado para sentir. Registrado en Milk Hill, Wiltshire, el 12 de julio de 2026."`

const ARCH = ["mandala", "spiral", "grid", "orbits", "web", "tri"]

async function callGeminiJson(
    payload: any,
    apiKey: string
): Promise<any | null> {
    for (const { model, attempts } of GEMINI_CASCADE) {
        for (let i = 0; i < attempts; i++) {
            const ctrl = new AbortController()
            const to = setTimeout(() => ctrl.abort(), 13000)
            try {
                const r = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: ctrl.signal,
                })
                clearTimeout(to)
                if (!r.ok) {
                    if (r.status >= 400 && r.status < 500) break // no reintentar 4xx
                    await new Promise((res) => setTimeout(res, 700 * (i + 1)))
                    continue
                }
                const j = await r.json()
                const txt =
                    j?.candidates?.[0]?.content?.parts
                        ?.map((p: any) => p?.text || "")
                        .join("") || ""
                const s = txt.indexOf("{")
                const e = txt.lastIndexOf("}")
                if (s < 0 || e <= s) continue
                return JSON.parse(txt.slice(s, e + 1))
            } catch {
                clearTimeout(to)
                await new Promise((res) => setTimeout(res, 500 * (i + 1)))
            }
        }
    }
    return null
}

async function classifyDecode(
    cand: Cand,
    img: { b64: string; mime: string } | null,
    apiKey: string
): Promise<{ archetype: string; es: string; en: string } | null> {
    if (!apiKey || !img) return null
    const ctx = `Sitio: ${cand.location}. Fecha (ISO): ${cand.date}. País: ${cand.country}.`
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: `${VOICE_PROMPT}\n\n=== CONTEXTO ===\n${ctx}\n=== FIN ===` },
                    { inline_data: { mime_type: img.mime, data: img.b64 } },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
        },
    }
    const j = await callGeminiJson(payload, apiKey)
    if (!j) return null
    const arch = ARCH.includes(String(j.archetype)) ? String(j.archetype) : ""
    const es = collapseWs(String(j.decoded_es || "")).replace(/[—–]/g, ",")
    const en = collapseWs(String(j.decoded_en || "")).replace(/[—–]/g, ",")
    if (!es || !en) return null
    return { archetype: arch || templateArchetype(cand), es, en }
}

/* Plantilla de respaldo (misma voz que la siembra de los 117 registros). */
function djb2(s: string): number {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h * 33) + s.charCodeAt(i)) >>> 0
    return h
}
function templateArchetype(cand: Cand): string {
    return ARCH[djb2(cand.location + "|" + cand.date) % 6]
}
const OPEN_ES: Record<string, string> = {
    mandala: "Anillos concéntricos que se tejen hacia adentro, un mandala trazado en una sola pulsación.",
    spiral: "Un brazo en espiral que gira desde un núcleo brillante, la geometría del crecimiento hecha visible.",
    grid: "Una retícula de nodos y celdas, un campo de señal ordenado como un idioma.",
    orbits: "Órbitas anidadas alrededor de un centro encendido, un mapa de cuerpos en movimiento.",
    web: "Una malla hexagonal de varias capas, la estructura misma del espacio dibujada sobre el campo.",
    tri: "Tres brazos en simetría perfecta alrededor de un centro, la firma de lo ternario.",
}
const OPEN_EN: Record<string, string> = {
    mandala: "Concentric rings weaving inward, a mandala traced in a single pulse.",
    spiral: "A spiral arm turning out from a bright core, the geometry of growth made visible.",
    grid: "A lattice of nodes and cells, a signal field ordered like a language.",
    orbits: "Nested orbits around a lit center, a map of bodies in motion.",
    web: "A many-layered hexagonal mesh, the structure of space itself drawn onto the field.",
    tri: "Three arms in perfect symmetry around a center, the signature of the threefold.",
}
const CORE_ES = [
    "No entrega un mensaje para leer: entrega un estado para sentir.",
    "Apareció sin proceso visible, sobre un campo que horas antes estaba intacto.",
    "Su simetría es demasiado exacta para el azar y demasiado serena para el ruido.",
    "Es geometría que respira, no un dibujo que se queda quieto.",
    "Late como una señal que espera ser reconocida, no descifrada.",
]
const CORE_EN = [
    "It delivers no message to read: it delivers a state to feel.",
    "It appeared with no visible process, over a field that hours earlier was untouched.",
    "Its symmetry is too exact for chance and too calm for noise.",
    "It is geometry that breathes, not a drawing that stays still.",
    "It pulses like a signal waiting to be recognized, not decoded.",
]
const MES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const MON = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function templateDecode(cand: Cand): { archetype: string; es: string; en: string } {
    const arch = templateArchetype(cand)
    const [y, mo, d] = cand.date.split("-").map((x) => parseInt(x, 10))
    const i = djb2(cand.sourceSlug) % CORE_ES.length
    const dEs = `${d} de ${MES[mo] || ""} de ${y}`
    const dEn = `${d} ${MON[mo] || ""} ${y}`
    const es = `${OPEN_ES[arch]} ${CORE_ES[i]} Registrado en ${cand.location}, ${dEs}.`
    const en = `${OPEN_EN[arch]} ${CORE_EN[i]} Recorded at ${cand.location}, ${dEn}.`
    return { archetype: arch, es, en }
}

/* ── Handler ── */

function json(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS })
    }
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

    let body: any = {}
    try {
        body = await req.json()
    } catch {
        body = {}
    }

    // Auth: secreto del cron O token admin de Clerk (prueba a mano).
    const cronSecret = Deno.env.get("CROP_SCAN_SECRET") || ""
    const headerSecret = req.headers.get("x-cron-secret") || ""
    let authorized = false
    if (cronSecret && headerSecret && headerSecret === cronSecret) {
        authorized = true
    } else if (body?.token) {
        const g = await gateAdmin(body.token)
        authorized = g.ok
    }
    if (!authorized) return json(401, { error: "unauthorized" })

    const dry = body?.dry === true
    const apiKey = Deno.env.get("GEMINI_API_KEY") || ""
    const sb = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )
    const year = new Date().getUTCFullYear()
    // Web: en LIVE por default (body.web:false lo apaga); en DRY solo con body.web:true.
    const wantWeb = dry ? body?.web === true : body?.web !== false

    // 1) Barrer las fuentes (cada una tolerante a fallo). CCC (fresco) → TT
    //    (respaldo) → web (fresco pero de menor confianza, si aplica).
    let ccc: Cand[] = []
    let tt: Cand[] = []
    let web: Cand[] = []
    try {
        ccc = await scanCCC(year)
    } catch (e) {
        console.log("[crop-scan] CCC error:", String(e))
    }
    try {
        tt = await scanTT(year)
    } catch (e) {
        console.log("[crop-scan] TT error:", String(e))
    }
    if (wantWeb) {
        try {
            web = await scanWeb(year, apiKey)
        } catch (e) {
            console.log("[crop-scan] web error:", String(e))
        }
    }

    // Geocode up front (barato, sin red): cada candidato lleva lat/lng/precise
    // → habilita el dedup por CERCANÍA en todos los pasos siguientes.
    const all = [...ccc, ...tt, ...web]
    for (const c of all) {
        const g = geocode(c.location, c.country)
        c.lat = g.lat
        c.lng = g.lng
        c.precise = g.precise
    }

    // 2) Dedup en memoria entre fuentes: misma fecha ±4d + (CERCANÍA ~2 km si
    //    AMBOS geocodes son precisos) O nombre contenido. Orden CCC→TT→web
    //    conserva el más fresco/fiable de un mismo sitio.
    const merged: Cand[] = []
    for (const c of all) {
        const dup = merged.find((m) => {
            if (
                Math.abs(
                    (new Date(m.date).getTime() - new Date(c.date).getTime()) /
                        86400000
                ) > 4
            )
                return false
            if (
                m.precise &&
                c.precise &&
                m.lat != null &&
                c.lat != null &&
                distKm(m.lat, m.lng as number, c.lat, c.lng as number) <= 2.0
            )
                return true
            return (
                m.siteN.length >= 4 &&
                (m.siteN.indexOf(c.siteN) >= 0 || c.siteN.indexOf(m.siteN) >= 0)
            )
        })
        if (!dup) merged.push(c)
    }

    // 3) Contexto para pre-filtrar lo ya visto (evita detail-fetch + Gemini de lo viejo).
    let ctx: any = { slugs: [], recent: [] }
    try {
        const { data } = await sb.rpc("scan_crop_context")
        if (data) ctx = data
    } catch (e) {
        console.log("[crop-scan] context error:", String(e))
    }
    const seenSlugs = new Set<string>((ctx.slugs || []).filter(Boolean))
    const recent: { s: string; d: string; lat?: number; lng?: number }[] =
        ctx.recent || []
    const isKnown = (c: Cand) => {
        if (seenSlugs.has(c.sourceSlug)) return true
        return recent.some((r) => {
            if (!r.d) return false
            if (
                Math.abs(
                    (new Date(r.d).getTime() - new Date(c.date).getTime()) /
                        86400000
                ) > 4
            )
                return false
            // (a) proximidad ~2 km si el geocode del candidato es preciso
            if (
                c.precise &&
                c.lat != null &&
                typeof r.lat === "number" &&
                typeof r.lng === "number" &&
                distKm(c.lat, c.lng as number, r.lat, r.lng) <= 2.0
            )
                return true
            // (b) nombre contenido
            return (
                !!r.s &&
                c.siteN.length >= 4 &&
                (r.s.indexOf(c.siteN) >= 0 || c.siteN.indexOf(r.s) >= 0)
            )
        })
    }
    let fresh = merged.filter((c) => !isKnown(c))
    // Orden: más recientes primero; cota anti-runaway.
    fresh.sort((a, b) => (a.date < b.date ? 1 : -1))
    const capped = fresh.length > MAX_NEW_PER_RUN
    fresh = fresh.slice(0, MAX_NEW_PER_RUN)

    // 4) DRY: preview rápido y SINCRÓNICO (hero + plantilla, sin Gemini ni
    //    descarga de imagen) → responde al instante. Zak confirma parseo/geocode/foto.
    if (dry) {
        const processed: any[] = []
        for (const c of fresh) {
            try {
                let imageUrl = c.imageUrl
                if (!imageUrl && c.detailPath) {
                    imageUrl = await cccHero(year, c.detailPath)
                }
                const lat = c.lat as number
                const lng = c.lng as number
                const dec = templateDecode(c)
                processed.push({
                    source: c.source,
                    title: c.title,
                    location: c.location,
                    country: c.country,
                    date: c.date,
                    archetype: dec.archetype,
                    lat,
                    lng,
                    precise: c.precise,
                    image_url: imageUrl || null,
                    preview_decode_es: dec.es,
                })
            } catch (e) {
                console.log("[crop-scan] dry error:", c.sourceSlug, String(e))
            }
        }
        return json(200, {
            ok: true,
            dry: true,
            year,
            scanned: { ccc: ccc.length, tt: tt.length, web: web.length, merged: merged.length },
            fresh: fresh.length,
            capped,
            drafts: processed,
        })
    }

    // 5) LIVE: el trabajo PESADO (foto HD + Gemini visión + insert + push) corre
    //    en SEGUNDO PLANO (EdgeRuntime.waitUntil). La respuesta vuelve al INSTANTE
    //    → no se pasa del límite de tiempo de la edge (la causa del "error" al
    //    correrlo en vivo). Los borradores aparecen en el Motor ~1 min después; si
    //    la instancia se recicla a media tanda, source_slug drena el resto mañana.
    const runInBackground = async () => {
        const inserted: string[] = []
        for (const c of fresh) {
            try {
                let imageUrl = c.imageUrl
                if (!imageUrl && c.detailPath) {
                    imageUrl = await cccHero(year, c.detailPath)
                }
                const lat = c.lat as number
                const lng = c.lng as number
                const img = imageUrl ? await fetchImageB64(imageUrl) : null
                const gdec = await classifyDecode(c, img, apiKey)
                const dec = gdec || templateDecode(c)
                const { data: ins } = await sb.rpc("scan_insert_crop_circle_draft", {
                    p_source_slug: c.sourceSlug,
                    p_title: c.title,
                    p_location_name: c.location,
                    p_country: c.country,
                    p_lat: lat,
                    p_lng: lng,
                    p_event_date: c.date,
                    p_pattern_kind: dec.archetype,
                    p_decoded_es: dec.es,
                    p_decoded_en: dec.en,
                    p_image_url: imageUrl || null,
                    p_geo_precise: c.precise === true,
                })
                if (ins?.inserted) inserted.push(c.title)
            } catch (e) {
                console.log("[crop-scan] process error:", c.sourceSlug, String(e))
            }
        }
        if (inserted.length > 0) {
            try {
                await sb.rpc("_notify_admins_new_crops", {
                    p_count: inserted.length,
                    p_sample: inserted.slice(0, 3).join(", "),
                })
            } catch (e) {
                console.log("[crop-scan] notify error:", String(e))
            }
        }
        console.log(
            "[crop-scan] background done, inserted:",
            inserted.length,
            inserted.join(" | ")
        )
    }

    const bg = runInBackground()
    try {
        // @ts-ignore — EdgeRuntime es global en Supabase
        ;(globalThis as any).EdgeRuntime?.waitUntil?.(bg)
    } catch {
        /* dev local sin EdgeRuntime: la promesa igual corre */
    }
    bg.catch((e) => console.log("[crop-scan] bg fatal:", String(e)))

    return json(200, {
        ok: true,
        dry: false,
        started: true,
        year,
        scanned: { ccc: ccc.length, tt: tt.length, merged: merged.length },
        fresh: fresh.length,
        capped,
        note: "Insertando en segundo plano; refresca el Motor en ~1 min.",
    })
})
