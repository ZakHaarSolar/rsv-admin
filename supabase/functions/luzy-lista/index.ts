// Red Solar Viva · luzy-lista v1.0 · LA LISTA DE LUZY: EL BOLETÍN DE PAPÁS Y EL AVISO DEL LIBRO (holaluzy.com, 2026-10-20)
// =====================================================================
// La página de Luzy (una producción de Fotón Cero) manda aquí el correo de mamá, papá o quien cuida, para el boletín de
// papás o para el aviso del primer libro. Sin sesión y sin llaves en la página: esta función corre con la llave de
// servicio y guarda con luzy_apuntar (migración 20261020_luzy_lista). Contra el spam: un campo trampa (si llega lleno se
// contesta «listo» y no se guarda nada) y un freno por conexión (20 por hora, 60 al día y 600 por hora en total) con una
// huella de la IP que se saca aquí, con el secreto de la función y el día: la base nunca ve la IP. El correo no se escribe
// en los registros de la función.
//
//   POST (text/plain o application/json) { correo, lista: "boletin" | "libro", idioma: "es" | "en", mayor: true, pagina_web: "" }
//   → 200 { ok: true } · 400 { error: "correo" | "lista" | "mayor" | "cuerpo" } · 403 { error: "origen" } · 405 · 413
//     · 429 { error: "freno" | "freno_general" } · 503 { error: "falta_migracion", migracion } · 500 { error: "servidor" }
//
// La página manda text/plain a propósito: así el navegador no pregunta antes (un viaje menos en el celular).
// Los correos @prueba.holaluzy.com pasan por todo y no se guardan (para probar la página publicada).
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy luzy-lista --no-verify-jwt
//
// Secrets: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY (los de siempre)

// deno-lint-ignore-file no-explicit-any
const ORIGENES = [/^https:\/\/(www\.)?holaluzy\.com$/, /^https:\/\/holaluzy(-[a-z0-9-]+)?\.vercel\.app$/, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/]
const MIGRACION = "20261020_luzy_lista"
/** La versión del aviso de privacidad que acepta quien se apunta (holaluzy.com/privacidad y /en/privacy). */
const AVISO = "2026-10-20"
const FRENO = { hora: 20, dia: 60, globalHora: 600 }
const MAX_CUERPO = 4096
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const FALTA = new Set(["PGRST202", "42883", "42P01", "PGRST205"])

const permitido = (origen: string | null) => !!origen && ORIGENES.some((r) => r.test(origen))
function cabezas(origen: string | null): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" }
    if (permitido(origen)) {
        h["Access-Control-Allow-Origin"] = origen!
        h["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        h["Access-Control-Allow-Headers"] = "content-type"
        h["Access-Control-Max-Age"] = "86400"
    }
    return h
}

/** La huella de la conexión: HMAC de la IP con el secreto de la función y el día (cambia cada día; no se vuelve IP). */
async function huella(ip: string): Promise<string> {
    const dia = new Date().toISOString().slice(0, 10)
    const enc = new TextEncoder()
    const llave = await crypto.subtle.importKey("raw", enc.encode("luzy-freno|" + (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const firma = new Uint8Array(await crypto.subtle.sign("HMAC", llave, enc.encode(dia + "|" + ip)))
    return Array.from(firma.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req: Request) => {
    const origen = req.headers.get("origin")
    const H = cabezas(origen)
    const json = (status: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status, headers: H })
    if (req.method === "OPTIONS") return new Response(null, { status: permitido(origen) ? 204 : 403, headers: H })
    if (req.method !== "POST") return json(405, { error: "metodo" })
    // Un navegador desde otra página no pasa. Lo que llega sin Origin (un programa) lo frenan la trampa y el freno.
    if (origen && !permitido(origen)) return json(403, { error: "origen" })
    if (Number(req.headers.get("content-length") || 0) > MAX_CUERPO) return json(413, { error: "cuerpo" })
    const texto = await req.text()
    if (texto.length > MAX_CUERPO) return json(413, { error: "cuerpo" })
    let b: any
    try {
        b = JSON.parse(texto)
    } catch {
        return json(400, { error: "cuerpo" })
    }
    if (!b || typeof b !== "object" || Array.isArray(b)) return json(400, { error: "cuerpo" })

    // La trampa: un campo que la persona no ve. Si llega lleno, se contesta «listo» y no se guarda nada.
    if (typeof b.pagina_web === "string" && b.pagina_web.trim() !== "") {
        console.log("[luzy-lista] trampa")
        return json(200, { ok: true })
    }
    const correo = typeof b.correo === "string" ? b.correo.trim().toLowerCase() : ""
    if (!correo || correo.length > 254 || !CORREO.test(correo)) return json(400, { error: "correo" })
    const lista = b.lista === "boletin" || b.lista === "libro" ? b.lista : null
    if (!lista) return json(400, { error: "lista" })
    if (b.mayor !== true) return json(400, { error: "mayor" })
    const idioma = b.idioma === "en" ? "en" : "es"

    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim()
    const llave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    let r: Response
    try {
        r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/luzy_apuntar`, {
            method: "POST",
            headers: { apikey: llave, Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                p_correo: correo, p_lista: lista, p_idioma: idioma, p_aviso: `${idioma}-${AVISO}`, p_huella: await huella(ip || "sin-ip"),
                p_limite_hora: FRENO.hora, p_limite_dia: FRENO.dia, p_limite_global_hora: FRENO.globalHora,
            }),
        })
    } catch (e) {
        console.error("[luzy-lista] la base no contestó:", String((e as Error)?.message || e).slice(0, 200))
        return json(500, { error: "servidor" })
    }
    const d: any = await r.json().catch(() => null)
    if (!r.ok) {
        const code = String(d?.code || "")
        console.error("[luzy-lista] luzy_apuntar:", r.status, code, String(d?.message || "").slice(0, 200))
        if (FALTA.has(code) || r.status === 404) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        return json(500, { error: "servidor" })
    }
    if (d?.ok === true) {
        console.log(`[luzy-lista] ${lista} · ${idioma}${d.prueba ? " · prueba" : ""}`)
        return json(200, { ok: true })
    }
    const motivo = String(d?.motivo || "")
    if (motivo === "freno" || motivo === "freno_general") {
        console.log(`[luzy-lista] ${motivo}`)
        return json(429, { error: motivo })
    }
    if (motivo === "correo" || motivo === "lista") return json(400, { error: motivo })
    console.error("[luzy-lista] respuesta rara de luzy_apuntar:", JSON.stringify(d).slice(0, 200))
    return json(500, { error: "servidor" })
})
