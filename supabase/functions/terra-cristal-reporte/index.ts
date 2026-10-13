// Red Solar Viva · terra-cristal-reporte v1.0 — 🜂 LOS REPORTES DE TERRA CRISTAL (Sala 39 de Terra Cristal, 2026-10-13)
// =====================================================================
// En el juego (play.redsolarviva.com/terra-cristal-pixel3/), la R (o REPORTAR en OPCIONES) abre una ventana: quien juega escribe qué pasó
// (si quiere) y el juego manda aquí el momento exacto (el lugar, la batalla, la ronda, de quién era el turno, el letrero en pantalla), lo
// esencial de su partida, su bitácora del viaje y una foto de la pantalla. Aquí se revisa todo, la foto sube a R2 y el reporte se guarda
// en terra_cristal_reportes (migración 20261013_terra_cristal_reportes). Se lee en el Motor → Terra Cristal → Reportes (admin-action v1.62).
//
// Se puede jugar SIN cuenta, así que aquí se puede reportar sin ella: con el token de Clerk (si hay sesión) el reporte va con la cuenta
// verificada (el id sale del token, nunca del cuerpo); sin token, o con uno que no valida, va con el id del aparato. Contra el abuso, el
// gobernador de gasto de siempre (reserve_edge_spend): 20 al día por cuenta o aparato, 60 por IP y 3000 en total.
//
// El juego guarda en el aparato lo que no sale y lo vuelve a mandar solo, con el MISMO id: si un reporte ya está, se contesta que llegó
// (nunca se guarda dos veces). Mientras la tabla no exista, contesta 503 «falta_migracion» SIN cobrar el cupo: el juego lo guarda y lo
// manda cuando exista.
//
//   POST { token?: string, aparato: string, reporte: PaqueteReporte (v1, terra-cristal-pixel3/src/juego/reporte.ts), foto?: "data:image/png;base64,…" }
//   →    200 { ok: true, id } · 200 { ok: true, id, ya: true } · 400 { error } (no tiene la forma) · 413 (muy grande) · 429 { error: "limite" }
//        · 503 { error: "falta_migracion", migracion } · 500 { error }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy terra-cristal-reporte --no-verify-jwt
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY ·
//   R2_BUCKET · R2_PUBLIC_BASE_URL (los de siempre; sin los de R2 el reporte llega sin foto)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"
import { verifyUpload } from "../_shared/upload.ts"


const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

const TABLA = "terra_cristal_reportes"
const MIGRACION = "20261013_terra_cristal_reportes"
/** Lo más que puede medir lo que llega (la foto de la pantalla del juego en PNG pesa de 30 a 300 KB). */
const MAX_CUERPO = 4 * 1024 * 1024
const MAX_FOTO = 2_500_000
/** La bitácora mide como mucho 40 KB en el juego; aquí, con holgura. */
const MAX_BITACORA = 64_000
/** El cupo: por cuenta o aparato, por IP y en total, en 24 horas. */
const CUPO = { porQuien: 20, porIp: 60, total: 3000, ventana: 86400 }

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

const FALTA = new Set(["42P01", "PGRST205", "PGRST202", "42883"])

/* ── Revisar lo que llega: solo lo que tiene la forma, con su tope ─────── */
const esObj = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x)
/** Un texto limpio (sin caracteres de control) y con tope, o null. */
function txt(v: unknown, max: number): string | null {
    if (typeof v !== "string") return null
    const s = v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim()
    return s ? s.slice(0, max) : null
}
/** Un entero de cero para arriba con tope, o null. */
function ent(v: unknown, max = 1_000_000): number | null {
    return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : null
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function momentoLimpio(m: unknown) {
    const x = esObj(m) ? m : {}
    const pos = esObj(x.pos) ? { x: ent(x.pos.x, 999) ?? 0, y: ent(x.pos.y, 999) ?? 0 } : null
    return {
        escena: txt(x.escena, 40) ?? "escena",
        lugar: txt(x.lugar, 40),
        batalla: txt(x.batalla, 40),
        ronda: ent(x.ronda, 999),
        fase: txt(x.fase, 40),
        turno: txt(x.turno, 60),
        turnoNombre: txt(x.turnoNombre, 60),
        combate: x.combate === true,
        letrero: txt(x.letrero, 600),
        pos,
        prueba: x.prueba === true,
    }
}

function partidaLimpia(p: unknown) {
    const x = esObj(p) ? p : {}
    const niveles: Record<string, number> = {}
    if (esObj(x.niveles))
        for (const [k, v] of Object.entries(x.niveles).slice(0, 30)) {
            const n = ent(v, 999)
            const id = txt(k, 40)
            if (n !== null && id) niveles[id] = n
        }
    const ids = (v: unknown, n: number) => (Array.isArray(v) ? v.map((s) => txt(s, 40)).filter((s): s is string => !!s).slice(0, n) : [])
    return {
        avatar: txt(x.avatar, 40),
        nombre: txt(x.nombre, 40),
        dificultad: txt(x.dificultad, 20),
        aldea: txt(x.aldea, 40),
        fotones: ent(x.fotones),
        marcas: ids(x.marcas, 300),
        niveles,
        almas: ids(x.almas, 20),
        lejos: ids(x.lejos, 20),
    }
}

/** La bitácora, tal cual si tiene su forma (v: 1) y cabe; si no cabe, sin sus sucesos más viejos. */
function bitacoraLimpia(b: unknown): Record<string, unknown> | null {
    if (!esObj(b) || b.v !== 1) return null
    const copia: Record<string, any> = { ...b }
    let s = JSON.stringify(copia)
    while (s.length > MAX_BITACORA && Array.isArray(copia.sucesos) && copia.sucesos.length) {
        copia.sucesos = copia.sucesos.slice(Math.ceil(copia.sucesos.length / 4))
        s = JSON.stringify(copia)
    }
    return s.length > MAX_BITACORA ? null : (JSON.parse(s) as Record<string, unknown>)
}

/** Una fecha que se lee (ISO); si viene del futuro (un reloj adelantado), ahora. */
function fecha(v: unknown): string {
    const ahora = Date.now()
    const t = typeof v === "string" ? Date.parse(v) : NaN
    if (!Number.isFinite(t) || t > ahora + 5 * 60_000) return new Date(ahora).toISOString()
    return new Date(t).toISOString()
}

/* ── R2: firma V4, igual que upload-sticker ─────────────────────────── */
interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}
function bytesToHex(bytes: Uint8Array): string {
    let s = ""
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0")
    return s
}
async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf = typeof data === "string" ? new TextEncoder().encode(data) : data
    return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf as BufferSource)))
}
async function hmacSha256(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
    const keyData = typeof key === "string" ? new TextEncoder().encode(key) : key
    const k = await crypto.subtle.importKey("raw", keyData as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)))
}
async function uploadToR2(cfg: R2Config, bytes: Uint8Array, key: string, contentType: string): Promise<string> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto", service = "s3", method = "PUT"
    const canonicalUri = `/${encodeURIComponent(cfg.bucket)}/${key.split("/").map((s) => encodeURIComponent(s)).join("/")}`
    const payloadHash = await sha256Hex(bytes)
    const amzDate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"
    const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    const scope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`
    const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp)
    const kSigning = await hmacSha256(await hmacSha256(await hmacSha256(kDate, region), service), "aws4_request")
    const signature = bytesToHex(await hmacSha256(kSigning, stringToSign))
    const res = await fetch(`https://${host}${canonicalUri}`, {
        method,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
            Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        },
        body: bytes as unknown as BodyInit,
    })
    if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${(await res.text()).slice(0, 300)}`)
    return `${cfg.publicBaseUrl.replace(/\/+$/, "")}/${key.split("/").map((s) => encodeURIComponent(s)).join("/")}`
}
/** El mismo saneo del id que usan las subidas y delete-account (el borrado de la cuenta barre TerraCristal/Reportes/<este>/). */
const safeId = (id: string) => (id || "anon").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" })
    if (Number(req.headers.get("content-length") || 0) > MAX_CUERPO) return json(413, { error: "muy_grande" })

    let body: any
    try {
        body = await req.json()
    } catch {
        return json(400, { error: "invalid_json_body" })
    }
    const r = esObj(body?.reporte) ? body.reporte : null
    if (!r || r.v !== 1 || typeof r.id !== "string" || !UUID.test(r.id)) return json(400, { error: "reporte_invalido" })
    const id = r.id.toLowerCase()

    // ── de quién: la cuenta verificada (si el token valida) y el aparato
    let cuenta: string | null = null
    const token = typeof body?.token === "string" ? body.token : ""
    if (token) {
        const g = await gateUser(token)
        if (g.ok && g.userId) cuenta = g.userId
    }
    const aparato = typeof body?.aparato === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(body.aparato) ? body.aparato : "desconocido"

    // ── ¿existe la tabla? ¿ya llegó este? (sin cobrar el cupo: el juego vuelve a mandar lo que no salió)
    const ya = await supabase.from(TABLA).select("id").eq("id", id).maybeSingle()
    if (ya.error) {
        const code = String(ya.error.code || "")
        console.error("[terra-cristal-reporte] tabla:", code, ya.error.message)
        if (FALTA.has(code)) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        return json(500, { error: "lectura_fallo" })
    }
    if (ya.data) return json(200, { ok: true, id, ya: true })

    // ── el cupo (cuenta o aparato, IP, total)
    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim()
    const cupo = await supabase.rpc("reserve_edge_spend", {
        p_edge: "terra_reporte",
        p_user_key: cuenta ?? `ap:${aparato}`,
        p_ip: ip || null,
        p_cost: 1,
        p_user_limit: CUPO.porQuien,
        p_user_window_seconds: CUPO.ventana,
        p_ip_limit: CUPO.porIp,
        p_ip_window_seconds: CUPO.ventana,
        p_global_limit: CUPO.total,
        p_global_window_seconds: CUPO.ventana,
    })
    if (cupo.error) console.error("[terra-cristal-reporte] cupo:", cupo.error.message)
    else if (cupo.data && cupo.data.ok === false) return json(429, { error: "limite", razon: cupo.data.reason ?? null })

    // ── la foto: solo PNG de verdad (por sus primeros bytes), a R2; si algo falla, el reporte llega sin foto
    let fotoUrl: string | null = null
    const foto = typeof body?.foto === "string" ? body.foto : ""
    if (foto) {
        const v = verifyUpload(foto, { allow: ["png"], maxBytes: MAX_FOTO })
        const R2 = {
            accountId: Deno.env.get("R2_ACCOUNT_ID") ?? "",
            accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID") ?? "",
            secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "",
            bucket: Deno.env.get("R2_BUCKET") ?? "",
            publicBaseUrl: Deno.env.get("R2_PUBLIC_BASE_URL") ?? "",
        }
        if (!v.ok) console.error("[terra-cristal-reporte] foto:", v.error, v.detail ?? "")
        else if (Object.values(R2).some((x) => !x)) console.error("[terra-cristal-reporte] faltan los secretos de R2")
        else {
            try {
                fotoUrl = await uploadToR2(R2, v.bytes, `TerraCristal/Reportes/${safeId(cuenta ?? "anon")}/${id}.png`, v.mime)
            } catch (e) {
                console.error("[terra-cristal-reporte] R2:", String((e as Error)?.message || e).slice(0, 200))
            }
        }
    }

    // ── el reporte
    const momento = momentoLimpio(r.momento)
    const fila = {
        id,
        creado: fecha(r.creado),
        clerk_user_id: cuenta,
        aparato,
        nota: txt(r.nota, 300) ?? "",
        escena: momento.escena,
        lugar: momento.lugar,
        batalla: momento.batalla,
        ronda: momento.ronda,
        momento,
        partida: partidaLimpia(r.partida),
        bitacora: bitacoraLimpia(r.bitacora),
        pantalla: esObj(r.pantalla) ? { w: ent(r.pantalla.w, 8000) ?? 0, h: ent(r.pantalla.h, 8000) ?? 0 } : null,
        juego: txt(r.juego, 40),
        navegador: txt(r.navegador, 240),
        idioma: txt(r.idioma, 20),
        zona: txt(r.zona, 60),
        foto_url: fotoUrl,
    }
    const ins = await supabase.from(TABLA).insert(fila)
    if (ins.error) {
        const code = String(ins.error.code || "")
        if (code === "23505") return json(200, { ok: true, id, ya: true })
        console.error("[terra-cristal-reporte] guardar:", code, ins.error.message)
        if (FALTA.has(code)) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        return json(500, { error: "guardar_fallo" })
    }
    console.log(`[terra-cristal-reporte] llegó ${id} · ${momento.lugar ?? momento.escena}${momento.batalla ? " · " + momento.batalla + " r" + (momento.ronda ?? "?") : ""} · ${cuenta ? "con cuenta" : "sin cuenta"} · ${fotoUrl ? "con foto" : "sin foto"}`)
    return json(200, { ok: true, id })
})
