// Prueba la función luzy-lista de verdad (su index.ts corriendo en Deno) contra un PostgREST de mentira que ejecuta la
// migración 20261020_luzy_lista en PGlite, como service_role. Nada de producción.
// Revisa: CORS (holaluzy.com sí, otra página no), la trampa, la casilla, el correo, el cuerpo roto o grande, el dominio de
// prueba, que la base guarde una huella y no la IP, el freno (20 por hora por conexión), el inglés y el 503 sin migración.
// Uso: node prueba-funcion.mjs <migración.sql> <functions/luzy-lista/index.ts>   (con PGlite 0.2.17 y deno instalados)
import { PGlite } from "@electric-sql/pglite"
import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import { spawn } from "node:child_process"

const [MIGRACION, FUNCION, PORTUGUES] = process.argv.slice(2)   // PORTUGUES: 20261021_luzy_portugues.sql (opcional)
const LLAVE = "llave-de-servicio-de-prueba", PUERTO_BASE = 54399, FN = "http://127.0.0.1:8000/"
let fallas = 0
const ok = (c, m) => { if (!c) { fallas++; console.log("✗", m) } else console.log("✓", m) }
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

const db = new PGlite()
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; GRANT USAGE ON SCHEMA public TO service_role;`)
await db.exec(readFileSync(MIGRACION, "utf8"))
if (PORTUGUES) await db.exec(readFileSync(PORTUGUES, "utf8"))

// el PostgREST de mentira: /rest/v1/rpc/luzy_apuntar con argumentos por nombre, como service_role
const base = createServer(async (req, res) => {
    let cuerpo = ""
    for await (const c of req) cuerpo += c
    const responde = (s, j) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(j)) }
    if (req.headers.authorization !== `Bearer ${LLAVE}` || req.headers.apikey !== LLAVE) return responde(401, { message: "sin llave" })
    if (req.url !== "/rest/v1/rpc/luzy_apuntar") return responde(404, { code: "PGRST202", message: "no existe" })
    const args = JSON.parse(cuerpo)
    const nombres = Object.keys(args)
    try {
        await db.exec("set role service_role")
        const r = await db.query(`select public.luzy_apuntar(${nombres.map((n, i) => `${n} => $${i + 1}`).join(", ")}) r`, nombres.map((n) => args[n]))
        responde(200, r.rows[0].r)
    } catch (e) {
        const falta = /does not exist/.test(e.message)
        responde(falta ? 404 : 400, { code: falta ? "PGRST202" : "P0001", message: e.message })
    } finally {
        await db.exec("reset role")
    }
})
await new Promise((r) => base.listen(PUERTO_BASE, "127.0.0.1", r))

const deno = spawn("deno", ["run", "--quiet", "--allow-net", "--allow-env", FUNCION], {
    env: { ...process.env, SUPABASE_URL: `http://127.0.0.1:${PUERTO_BASE}`, SUPABASE_SERVICE_ROLE_KEY: LLAVE }, stdio: ["ignore", "pipe", "pipe"],
})
let registros = ""
deno.stdout.on("data", (d) => (registros += d)); deno.stderr.on("data", (d) => (registros += d))
for (let i = 0; i < 80; i++) { await espera(150); if (await fetch(FN, { method: "OPTIONS" }).then(() => true).catch(() => false)) break }

const manda = (cuerpo, { origen = "https://holaluzy.com", ip = "201.1.1.1", tipo = "text/plain;charset=UTF-8", metodo = "POST" } = {}) =>
    fetch(FN, { method: metodo, headers: { ...(origen ? { Origin: origen } : {}), "Content-Type": tipo, "x-forwarded-for": `${ip}, 10.0.0.1` },
        body: metodo === "POST" ? (typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)) : undefined })
        .then(async (r) => ({ s: r.status, j: await r.json().catch(() => null), h: r.headers }))
const fila = async (c) => (await db.query(`select * from public.luzy_lista where correo = $1`, [c])).rows[0]
const base0 = { lista: "boletin", idioma: "es", mayor: true, pagina_web: "" }

try {
    const o1 = await fetch(FN, { method: "OPTIONS", headers: { Origin: "https://www.holaluzy.com", "Access-Control-Request-Method": "POST" } })
    ok(o1.status === 204 && o1.headers.get("access-control-allow-origin") === "https://www.holaluzy.com", "OPTIONS desde www.holaluzy.com: 204 con su origen")
    const o2 = await fetch(FN, { method: "OPTIONS", headers: { Origin: "https://otra-pagina.com" } })
    ok(o2.status === 403 && !o2.headers.get("access-control-allow-origin"), "OPTIONS desde otra página: 403 sin permiso")
    ok((await manda({ ...base0, correo: "a@correo.com" }, { origen: "https://otra-pagina.com" })).s === 403, "POST desde otra página: 403")
    ok((await manda(null, { metodo: "GET" })).s === 405, "GET: 405")

    const r1 = await manda({ ...base0, correo: "Mama@Correo.com" })
    ok(r1.s === 200 && r1.j?.ok === true && r1.h.get("access-control-allow-origin") === "https://holaluzy.com", "boletín desde holaluzy.com (text/plain): 200 ok, con permiso de origen")
    const f1 = await fila("mama@correo.com")
    ok(f1?.boletin === true && f1.aviso === "es-2026-10-20" && f1.idioma === "es", "quedó en la lista, en minúsculas, con el aviso es-2026-10-20")
    const h = (await db.query(`select huella from public.luzy_freno`)).rows.map((x) => x.huella)
    ok(h.length === 1 && /^[0-9a-f]{32}$/.test(h[0]) && !h.some((x) => x.includes("201.1.1.1")), "la base guarda una huella de 32 letras, no la IP")

    const t = await manda({ ...base0, correo: "bot@correo.com", pagina_web: "https://spam.example" })
    ok(t.s === 200 && t.j?.ok === true && !(await fila("bot@correo.com")), "la trampa llena: contesta ok y no guarda nada")
    ok((await manda({ ...base0, correo: "c@correo.com", mayor: false })).j?.error === "mayor", "sin la casilla de mayor de edad: 400 mayor")
    ok((await manda({ ...base0, correo: "c@correo" })).j?.error === "correo", "correo mal escrito: 400 correo")
    ok((await manda({ ...base0, correo: "c@correo.com", lista: "club" })).j?.error === "lista", "una lista que no existe: 400 lista")
    ok((await manda("{no es json")).j?.error === "cuerpo", "cuerpo roto: 400 cuerpo")
    ok((await manda({ ...base0, correo: "c@correo.com", relleno: "x".repeat(5000) })).s === 413, "cuerpo de más de 4 KB: 413")
    ok((await manda({ ...base0, correo: "d@correo.com" }, { tipo: "application/json" })).j?.ok === true, "también con application/json")

    const rp = await manda({ ...base0, correo: "hola@prueba.holaluzy.com" })
    ok(rp.j?.ok === true && !(await fila("hola@prueba.holaluzy.com")), "@prueba.holaluzy.com: ok y no se guarda")

    const en = await manda({ ...base0, lista: "libro", idioma: "en", correo: "dad@email.com" })
    const fe = await fila("dad@email.com")
    ok(en.j?.ok === true && fe?.libro === true && fe.idioma === "en" && fe.aviso === "en-2026-10-20", "en inglés: libro, idioma en, aviso en-2026-10-20")

    if (PORTUGUES) {
        const pt = await manda({ ...base0, idioma: "pt", correo: "mae@email.com.br" })
        const fp = await fila("mae@email.com.br")
        ok(pt.j?.ok === true && fp?.idioma === "pt" && fp.aviso === "pt-2026-10-21", "en portugués: idioma pt y el aviso pt-2026-10-21")
    }

    // el freno: 20 por hora desde la misma conexión
    const res = []
    for (let i = 0; i < 22; i++) res.push((await manda({ ...base0, correo: `f${i}@correo.com` }, { ip: "9.9.9.9" })).s)
    ok(res.slice(0, 20).every((s) => s === 200) && res[20] === 429 && res[21] === 429, "freno: 20 pasan desde la misma conexión y la 21 da 429")
    const fr = await manda({ ...base0, correo: "f99@correo.com" }, { ip: "9.9.9.9" })
    ok(fr.j?.error === "freno", "la respuesta del freno dice «freno» (la página lo explica)")
    ok((await manda({ ...base0, correo: "otra@correo.com" }, { ip: "8.8.4.4" })).s === 200, "otra conexión sí pasa")

    // sin la migración: 503 falta_migracion
    await db.exec(`drop function public.luzy_apuntar(text, text, text, text, text, int, int, int)`)
    const sm = await manda({ ...base0, correo: "e@correo.com" })
    ok(sm.s === 503 && sm.j?.error === "falta_migracion" && sm.j?.migracion === "20261020_luzy_lista", "sin la migración: 503 falta_migracion")

    ok(!/correo\.com/.test(registros), "los registros de la función no traen ningún correo")
} finally {
    deno.kill()
    base.close()
    await db.close()
}
console.log(fallas ? `FALLAS: ${fallas}` : "TODO BIEN")
