// Prueba 20261020_luzy_lista en un Postgres real (PGlite 0.2.17, sin Docker) y nada de producción.
// Pega la migración dos veces y revisa: el correo mal escrito y la lista que no existe; apuntarse al boletín y al libro
// con el mismo correo (un solo renglón, las dos listas, en minúsculas); el idioma; el dominio de prueba (pasa y no se
// guarda); el freno por hora, por día y el general; la limpieza de lo viejo; dos envíos juntos de la misma conexión; y
// los permisos (la llave pública y las sesiones no ven nada; service_role sí puede apuntar).
import { PGlite } from "@electric-sql/pglite"
import { readFileSync } from "node:fs"

const MIGRACION = process.argv[2]
let fallas = 0
const ok = (c, m) => { if (!c) { fallas++; console.log("✗", m) } else console.log("✓", m) }
const texto = readFileSync(MIGRACION, "utf8")

const db = new PGlite()
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;`)
await db.exec(texto)
await db.exec(texto)
ok(true, "la migración corre dos veces sin error")

const apuntar = async (correo, lista = "boletin", idioma = "es", huella = "h1", lim = [20, 60, 600]) =>
    (await db.query(`select public.luzy_apuntar($1, $2, $3, $4, $5, $6, $7, $8) r`, [correo, lista, idioma, `${idioma}-2026-10-20`, huella, ...lim])).rows[0].r
const fila = async (correo) => (await db.query(`select * from public.luzy_lista where correo = $1`, [correo])).rows[0]
const cuantas = async () => (await db.query(`select count(*)::int n from public.luzy_lista`)).rows[0].n
const frenos = async (h) => (await db.query(`select count(*)::int n from public.luzy_freno ${h ? "where huella = $1" : ""}`, h ? [h] : [])).rows[0].n

// lo que no pasa
ok((await apuntar("mama@correo")).motivo === "correo", "correo sin dominio: motivo correo")
ok((await apuntar("mamá correo@x.com")).motivo === "correo", "correo con espacio: motivo correo")
ok((await apuntar("a".repeat(250) + "@x.com")).motivo === "correo", "correo de más de 254: motivo correo")
ok((await apuntar("mama@correo.com", "club")).motivo === "lista", "una lista que no existe: motivo lista")
ok(await cuantas() === 0 && await frenos() === 0, "lo que no pasa no escribe nada (ni en la lista ni en el freno)")

// apuntarse
const r1 = await apuntar("  MaMa@Correo.com ", "boletin", "es", "h1")
ok(r1.ok === true && !r1.prueba, "boletín: ok")
let f = await fila("mama@correo.com")
ok(f && f.boletin === true && f.libro === false && f.idioma === "es" && f.aviso === "es-2026-10-20" && f.mayor_edad, "un renglón en minúsculas, con su lista, idioma, aviso y la fecha de mayor de edad")
await apuntar("mama@correo.com", "libro", "en", "h1")
f = await fila("mama@correo.com")
ok(await cuantas() === 1 && f.boletin === true && f.libro === true && f.idioma === "en" && f.aviso === "en-2026-10-20", "el mismo correo suma la otra lista sin duplicarse; toma el idioma y el aviso nuevos")
await apuntar("papa@correo.com", "libro", "fr", "h2")
f = await fila("papa@correo.com")
ok(f.idioma === "es" && f.libro === true && f.boletin === false, "un idioma que no es es ni en queda en es")

// el dominio de prueba: pasa por todo y no se guarda
const antes = await frenos("hp")
const rp = await apuntar("hola@prueba.holaluzy.com", "boletin", "es", "hp")
ok(rp.ok === true && rp.prueba === true && !(await fila("hola@prueba.holaluzy.com")) && await frenos("hp") === antes + 1, "@prueba.holaluzy.com: ok, no se guarda y sí cuenta en el freno")

// el freno por hora (con un tope chico para probar)
for (let i = 0; i < 3; i++) await apuntar(`f${i}@correo.com`, "boletin", "es", "hf", [3, 60, 600])
ok((await apuntar("f9@correo.com", "boletin", "es", "hf", [3, 60, 600])).motivo === "freno", "la cuarta en la hora desde la misma conexión: freno")
ok(!(await fila("f9@correo.com")), "lo frenado no se guarda")
ok((await apuntar("otra@correo.com", "boletin", "es", "hg", [3, 60, 600])).ok === true, "otra conexión sí pasa")
// el freno por día (registros de hace dos horas: no cuentan en la hora, sí en el día)
await db.exec(`insert into public.luzy_freno (huella, creado) select 'hd', now() - interval '2 hours' from generate_series(1, 5)`)
ok((await apuntar("d@correo.com", "boletin", "es", "hd", [3, 5, 600])).motivo === "freno", "el freno del día cuenta lo de horas antes")
// el cortacircuitos general
const enLaHora = (await db.query(`select count(*)::int n from public.luzy_freno where creado > now() - interval '1 hour'`)).rows[0].n
ok((await apuntar("g@correo.com", "boletin", "es", "hz", [20, 60, enLaHora])).motivo === "freno_general", "el cortacircuitos general frena aunque la conexión sea nueva")
ok((await apuntar("g@correo.com", "boletin", "es", "hz", [20, 60, enLaHora + 1])).ok === true, "y con un registro de holgura, pasa")

// la limpieza: lo de hace más de dos días se barre (1 de cada 20 llamadas; con 250 llamadas es casi seguro)
await db.exec(`insert into public.luzy_freno (huella, creado) select 'vieja', now() - interval '3 days' from generate_series(1, 40)`)
for (let i = 0; i < 250; i++) await apuntar(`l${i}@prueba.holaluzy.com`, "boletin", "es", `hl${i}`, [20, 60, 0])
ok(await frenos("vieja") === 0, "la limpieza barre lo de hace más de dos días")
ok(await frenos("hl5") === 1, "y deja lo reciente")

// dos envíos de la misma conexión con tope 1: solo uno pasa (PGlite tiene una sola conexión, así que aquí van en fila;
// el candado pg_advisory_xact_lock es el que los forma en fila en producción)
const db2 = new PGlite()
await db2.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;`)
await db2.exec(texto)
const [a, b] = await Promise.all(["x1@correo.com", "x2@correo.com"].map((c) =>
    db2.query(`select public.luzy_apuntar($1, 'boletin', 'es', 'es-2026-10-20', 'hj', 1, 60, 600) r`, [c]).then((x) => x.rows[0].r)))
ok([a, b].filter((x) => x.ok).length === 1, "dos envíos de la misma conexión con tope 1: pasa uno")
await db2.close()

// permisos
const p = (await db.query(`select
    has_function_privilege('anon', 'public.luzy_apuntar(text,text,text,text,text,integer,integer,integer)', 'EXECUTE') fa,
    has_function_privilege('authenticated', 'public.luzy_apuntar(text,text,text,text,text,integer,integer,integer)', 'EXECUTE') fu,
    has_function_privilege('service_role', 'public.luzy_apuntar(text,text,text,text,text,integer,integer,integer)', 'EXECUTE') fs,
    has_table_privilege('anon', 'public.luzy_lista', 'SELECT') la, has_table_privilege('authenticated', 'public.luzy_lista', 'SELECT') lu,
    has_table_privilege('anon', 'public.luzy_freno', 'INSERT') fra,
    (select relrowsecurity from pg_class where oid = 'public.luzy_lista'::regclass) rls1,
    (select relrowsecurity from pg_class where oid = 'public.luzy_freno'::regclass) rls2`)).rows[0]
ok(p.fa === false && p.fu === false && p.fs === true, "luzy_apuntar: solo service_role")
ok(p.la === false && p.lu === false && p.fra === false && p.rls1 && p.rls2, "las tablas, cerradas para la llave pública y las sesiones (y con RLS)")
await db.exec(`set role service_role`)
const rs = (await db.query(`select public.luzy_apuntar('rol@correo.com', 'libro', 'es', 'es-2026-10-20', 'hr') r`)).rows[0].r
await db.exec(`reset role`)
ok(rs.ok === true && (await fila("rol@correo.com")).libro === true, "como service_role (la función) sí apunta")
let negado = false
try { await db.exec(`set role anon; select public.luzy_apuntar('anon@correo.com', 'libro', 'es', 'x', 'ha');`) } catch { negado = true }
await db.exec(`reset role`)
ok(negado && !(await fila("anon@correo.com")), "como la llave pública no puede")

console.log(fallas ? `FALLAS: ${fallas}` : "TODO BIEN")
await db.close()
