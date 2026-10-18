// Prueba 20261018f_freno_web_huella con una bóveda simulada (nada de producción).
// Genera un secreto de prueba, pone SU huella en el texto de la migración y revisa que:
// el secreto viejo deja de valer, el nuevo pasa, una dirección vacía no escribe nada,
// los límites siguen igual, correrla dos veces no cambia nada y, sin la entrada en la
// bóveda, la crea con la huella.
import { PGlite } from "@electric-sql/pglite"
import { readFileSync } from "node:fs"
import { createHash, randomBytes } from "node:crypto"

const MIGRACION = process.argv[2]
let fallas = 0
const ok = (c, m) => { if (!c) { fallas++; console.log("✗", m) } else console.log("✓", m) }
const VIEJO = "secreto-viejo-de-prueba"
const NUEVO = randomBytes(32).toString("hex")
const huella = createHash("sha256").update(NUEVO, "utf8").digest("hex")
const texto = readFileSync(MIGRACION, "utf8").replace(/v_huella constant text := '[0-9a-f]{64}'/, `v_huella constant text := '${huella}'`)
ok(texto.includes(huella), "la huella de prueba entró al texto de la migración")

const base = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA vault; CREATE SCHEMA extensions;
CREATE TABLE vault.secrets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE, description text, secret text, updated_at timestamptz DEFAULT now());
CREATE VIEW vault.decrypted_secrets AS SELECT id, name, description, secret AS decrypted_secret, updated_at FROM vault.secrets;
CREATE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL, new_name text DEFAULT NULL, new_description text DEFAULT NULL, new_key_id uuid DEFAULT NULL)
RETURNS void LANGUAGE sql AS $$ UPDATE vault.secrets SET secret = coalesce(new_secret, secret), name = coalesce(new_name, name),
    description = coalesce(new_description, description), updated_at = now() WHERE id = secret_id $$;
CREATE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL, new_description text DEFAULT '', new_key_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE sql AS $$ INSERT INTO vault.secrets (name, description, secret) VALUES (new_name, new_description, new_secret) RETURNING id $$;
CREATE TABLE public.web_auth_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_key text NOT NULL, accion text NOT NULL, pais text, created_at timestamptz NOT NULL DEFAULT now());
`
const produccion = readFileSync(new URL("./registrar_intento_web-antes.sql", import.meta.url), "utf8")

const db = new PGlite()
await db.exec(base)
await db.exec(produccion)
await db.exec(`REVOKE ALL ON FUNCTION public.registrar_intento_web(text,text,text,text,int,int,int) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_intento_web(text,text,text,text,int,int,int) TO anon;
INSERT INTO vault.secrets (name, description, secret) VALUES ('web_auth_freno_key', 'vieja', '${VIEJO}');`)
const llamar = async (s, ip, accion = "registro", hora = 0) =>
    (await db.query(`select public.registrar_intento_web($1, $2, $3, 'MX', $4, 0, 0) x`, [s, ip, accion, hora])).rows[0].x.motivo
const filas = async () => (await db.query(`select count(*)::int n from public.web_auth_attempts`)).rows[0].n

ok(await llamar(VIEJO, "201.1.2.3") === "registrado", "antes: el secreto viejo registra")
await db.exec(texto)
await db.exec(texto)
ok(true, "la migración corre dos veces sin error")
const antes = await filas()
ok(await llamar(VIEJO, "201.1.2.3") === "sin_credencial", "el secreto viejo ya no vale (deja pasar sin registrar)")
ok(await llamar(huella, "201.1.2.3") === "sin_credencial", "la huella misma tampoco sirve como secreto")
ok(await llamar(NUEVO, "") === "sin_origen" && await filas() === antes, "el nuevo pasa la credencial; sin dirección no escribe nada")
ok(await llamar(NUEVO, "201.1.2.3", "registro", 2) === "registrado" && await filas() === antes + 1, "el nuevo registra el intento")
await llamar(NUEVO, "201.1.2.3", "registro", 2)
ok(await llamar(NUEVO, "201.1.2.3", "registro", 2) === "limite_hora", "los límites siguen igual (tercer alta en la hora, frenada)")
const v = (await db.query(`select secret, description from vault.secrets where name = 'web_auth_freno_key'`)).rows[0]
ok(v.secret === huella && v.description.startsWith("Huella sha256"), "la bóveda guarda la huella, no el secreto")
const p = (await db.query(`select has_function_privilege('anon','public.registrar_intento_web(text,text,text,text,integer,integer,integer)','EXECUTE') a,
    has_function_privilege('authenticated','public.registrar_intento_web(text,text,text,text,integer,integer,integer)','EXECUTE') b`)).rows[0]
ok(p.a === true && p.b === false, "permisos como antes (la llave pública sí, la sesión no)")

const db2 = new PGlite()
await db2.exec(base)
await db2.exec(produccion)
await db2.exec(texto)
const v2 = (await db2.query(`select secret from vault.secrets where name = 'web_auth_freno_key'`)).rows[0]
ok(v2 && v2.secret === huella, "sin la entrada en la bóveda, la crea con la huella")
await db2.close()

console.log(fallas ? `FALLAS: ${fallas}` : "TODO BIEN")
await db.close()
