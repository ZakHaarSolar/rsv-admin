// Red Solar Viva · council-gate v1.8 — 🜂 LA MÚSICA DEL TEMPLO: { quiero: "musica-subir", nombre, audio_base64 } verifica el audio por sus bytes (mp3, m4a, wav, ogg, hasta 25 MB), lo deja en R2 (Council/musica/…) y devuelve su dirección; { quiero: "musica-borrar", url } lo quita del bucket. Secrets R2_* (los mismos de upload-wallpaper).
// Red Solar Viva · council-gate v1.7 — 🜂 LA PRODUCCIÓN DE FOTÓN CERO (sello, serie, personaje, episodio, album, cancion) viaja como documentos de council_registros en su PROPIA llamada (si falta la migración 20260817 se reporta `produccion: produccion_sin_tipos` sin tumbar el resto)
// v1.6 — 🜂 LOS REGISTROS DEL ARQUITECTO viajan al servidor: { quiero: "registros-guardar" | "registros-leer" } guarda y devuelve el pergamino (oro y plata), el bote, el cofre, el arsenal, el ábaco, las leyes, la bitácora y dónde quedó cada reliquia. Escritura CONDICIONAL por fecha (lo viejo no pisa lo nuevo) y lápidas al borrar (migración 20260816_council_registros.sql).
// Red Solar Viva · council-gate v1.5 — 🜂 EL MENSAJERO: puente con Telegram para que el Council le escriba al iPhone del Arquitecto (avisos al cerrar una tanda de ciclos) y él le conteste desde el teléfono. { quiero: "mensajero-estado" | "mensajero-envia" | "mensajero-lee" }. La llave del bot vive aquí, nunca en el navegador.
// Red Solar Viva · council-gate v1.4 — la Forja entra a las cámaras válidas; { quiero: "boveda-versiones", clave, limite } devuelve las evoluciones anteriores de un playbook (con su propuesta y fricción por ciclo)
// Red Solar Viva · council-gate v1.3 — el Observatorio entra a la lista de cámaras válidas (sus turnos con el Cronista también se guardan)
// Red Solar Viva · council-gate v1.2 — 🜂 EL PORTÓN DEL COUNCIL SOLAR
// (redsolarviva.com/council, el Centro de Mando).
// v1.2 — LA BÓVEDA: { quiero: "boveda-guardar" } recibe en un solo lote los
// outputs del Council (playbooks vivos por cámara/nodo, cada etapa del bucle
// de deliberación autónoma y cada turno con su respuesta) y los escribe con
// service role en council_playbooks / council_deliberaciones / council_turnos
// (migración 20260815_council_boveda.sql). { quiero: "boveda-leer" } devuelve
// los playbooks del Arquitecto y sus últimos turnos por cámara para fundirlos
// con lo local al abrir. Si las tablas no existen todavía responde
// { error: "sin_tabla" } y el cliente lo dice en pantalla (Paso 0-quater).
// v1.1 — LA VOZ DE SALIDA: { quiero: "voz-salida" } acuña una llave temporal
// de Soniox con usage_type "tts_rt" (TTS en tiempo real por WebSocket) y
// devuelve el CATÁLOGO de voces (las cuatro de la Matriz Sincrónica, con la
// velocidad que Zak eligió en espejo-voz v3.0). El nombre del proveedor y la
// velocidad viven aquí, no en el cliente; el navegador solo elige un id.
//
// Cinco servicios, un solo portón:
//   { token, quiero: "acceso" } → verifica que el token de Clerk sea de un
//     Arquitecto (gateAdmin: JWKS de nuestra instancia + profiles.is_admin) y
//     responde { ok: true }. El cliente expulsa a la portada si no.
//   { token, quiero: "voz" }    → mismo portón, y además ACUÑA una llave
//     TEMPORAL de Soniox (usage_type transcribe_websocket) para que el SDK web
//     abra la sesión de dictado. La llave maestra SONIOX_API_KEY nunca sale
//     de aquí. Se ata al Arquitecto con client_reference_id.
//   { token, quiero: "voz-salida" } → llave temporal usage_type tts_rt +
//     catálogo de voces, para que el navegador abra el WebSocket de TTS
//     directo (sin relevo: menor latencia).
//   { token, quiero: "boveda-guardar", playbooks?, deliberaciones?, turnos? }
//   { token, quiero: "boveda-leer" }
//   { token, quiero: "registros-guardar", documentos?, entradas? } → lo que el
//     ARQUITECTO escribe con su mano (no el Council): cofre, arsenal, ábaco,
//     leyes, bitácora, juicios del pergamino y del bote, y dónde dejó cada
//     reliquia. Escribe por las funciones council_guardar_* , que solo pisan
//     una fila si la que llega es MÁS NUEVA.
//   { token, quiero: "registros-leer" } → todo eso para fundirlo al abrir.
//
// La inferencia del Council NO pasa por aquí: corre en la Mac del Arquitecto
// (Ollama, localhost) y el navegador le habla directo.
//
//   { token, quiero: "mensajero-estado" }              → ¿hay bot? ¿cómo se llama?
//   { token, quiero: "mensajero-envia", chatId, texto } → le escribe al iPhone
//   { token, quiero: "mensajero-lee", chatId, offset }  → lo que él contestó
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY ·
//          SONIOX_API_KEY (ya existe para espejo-voz) · SONIOX_STT_MODEL (opcional) ·
//          TELEGRAM_BOT_TOKEN (el Mensajero; sin él responde "sin_llave" y la
//          pantalla lo explica) · TELEGRAM_CHAT_ID (opcional: si está, manda
//          sobre el chat que elija el navegador)
// Despliegue: supabase functions deploy council-gate --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"
import { verifyUpload, type UploadKind } from "../_shared/upload.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

const SONIOX_KEY = Deno.env.get("SONIOX_API_KEY") || ""
const STT_MODEL = Deno.env.get("SONIOX_STT_MODEL") || "stt-rt-v5"
const TTS_MODEL = Deno.env.get("SONIOX_MODEL") || "tts-rt-v2"
/* Vida de la llave temporal: solo se usa para ABRIR el socket; una vez
   abierta, la sesión sigue aunque la llave venza. */
const EXPIRA_S = 600

/* Catálogo de la voz de salida: espejo del de espejo-voz v3.0 (solo Soniox;
   Goku es de Fish y no entra). Las velocidades las eligió Zak escuchándolas. */
const VOCES: Record<string, { voice: string; speed: number }> = {
    bennett: { voice: "Bennett", speed: 1.1 },
    owen: { voice: "Owen", speed: 1.1 },
    cordelia: { voice: "Cordelia", speed: 1.3 },
    margo: { voice: "Margo", speed: 1.2 },
}

/* ── Bóveda ─────────────────────────────────────────────────────────── */

const SALAS = new Set(["central", "escaner", "foton", "zakcero", "forja", "observatorio"])
const ETAPAS = new Set(["propuesta", "friccion", "evolucion"])
/* Topes de defensa: un lote no puede ser infinito */
const MAX_PLAYBOOKS = 40
const MAX_DELIBERACIONES = 400
const MAX_TURNOS = 200
const MAX_TEXTO = 60000
const TURNOS_AL_LEER = 20

let _sb: ReturnType<typeof createClient> | null = null
function sb() {
    if (_sb) return _sb
    _sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } }
    )
    return _sb
}

const texto = (v: unknown, tope = MAX_TEXTO): string =>
    typeof v === "string" ? v.slice(0, tope) : ""
const entero = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
const nodoDe = (v: unknown): string | null =>
    typeof v === "string" && /^[a-z]{1,24}$/.test(v) ? v : null

/* Un error de Postgres por tabla inexistente (42P01) se traduce a un motivo
   que el cliente sabe explicar: "pega la migración". Lo mismo la FUNCIÓN que
   no existe (42883 en Postgres, PGRST202 cuando PostgREST no la encuentra en
   su caché de esquema): el arreglo es idéntico, así que el motivo también. */
function motivoDb(e: { code?: string; message?: string } | null): string {
    if (!e) return "db"
    if (
        e.code === "42P01" ||
        e.code === "42883" ||
        e.code === "PGRST202" ||
        /does not exist|schema cache|could not find the function/i.test(e.message || "")
    )
        return "sin_tabla"
    return `db_${e.code || "error"}`
}

interface PlaybookIn {
    clave?: unknown
    sala?: unknown
    nodo?: unknown
    titulo?: unknown
    contenido?: unknown
    ciclo?: unknown
    propuesta?: unknown
    friccion?: unknown
    actualizadoTs?: unknown
}
interface EtapaIn {
    clave?: unknown
    sala?: unknown
    nodo?: unknown
    ciclo?: unknown
    etapa?: unknown
    texto?: unknown
    ts?: unknown
}
interface TurnoIn {
    id?: unknown
    sala?: unknown
    nodo?: unknown
    pregunta?: unknown
    respuesta?: unknown
    ts?: unknown
    interrumpido?: unknown
    fallo?: unknown
}

async function guardarBoveda(
    userId: string,
    body: { playbooks?: unknown; deliberaciones?: unknown; turnos?: unknown; modelo?: unknown }
): Promise<Response> {
    const modelo = texto(body.modelo, 80) || null
    const guardados = { playbooks: 0, deliberaciones: 0, turnos: 0 }
    const db = sb()

    const playbooks = (Array.isArray(body.playbooks) ? (body.playbooks as PlaybookIn[]) : [])
        .slice(0, MAX_PLAYBOOKS)
        .filter((p) => p && typeof p.clave === "string" && SALAS.has(String(p.sala)))
        .map((p) => ({
            clerk_user_id: userId,
            clave: texto(p.clave, 80),
            sala: String(p.sala),
            nodo: nodoDe(p.nodo),
            titulo: texto(p.titulo, 200),
            contenido: texto(p.contenido),
            ciclo: entero(p.ciclo),
            propuesta: texto(p.propuesta),
            friccion: texto(p.friccion),
            modelo,
            actualizado_ts: entero(p.actualizadoTs),
            updated_at: new Date().toISOString(),
        }))
    if (playbooks.length) {
        const { error } = await db
            .from("council_playbooks")
            .upsert(playbooks, { onConflict: "clerk_user_id,clave" })
        if (error) {
            console.error("[council-gate] playbooks", error.code, error.message)
            return json({ ok: false, error: motivoDb(error), guardados }, 500)
        }
        guardados.playbooks = playbooks.length
    }

    const deliberaciones = (Array.isArray(body.deliberaciones) ? (body.deliberaciones as EtapaIn[]) : [])
        .slice(0, MAX_DELIBERACIONES)
        .filter(
            (d) =>
                d && typeof d.clave === "string" && SALAS.has(String(d.sala)) && ETAPAS.has(String(d.etapa)) && typeof d.texto === "string" && d.texto
        )
        .map((d) => ({
            clerk_user_id: userId,
            clave: texto(d.clave, 80),
            sala: String(d.sala),
            nodo: nodoDe(d.nodo),
            ciclo: entero(d.ciclo),
            etapa: String(d.etapa),
            texto: texto(d.texto),
            modelo,
            ts: entero(d.ts),
        }))
    if (deliberaciones.length) {
        const { error } = await db.from("council_deliberaciones").insert(deliberaciones)
        if (error) {
            console.error("[council-gate] deliberaciones", error.code, error.message)
            return json({ ok: false, error: motivoDb(error), guardados }, 500)
        }
        guardados.deliberaciones = deliberaciones.length
    }

    const turnos = (Array.isArray(body.turnos) ? (body.turnos as TurnoIn[]) : [])
        .slice(0, MAX_TURNOS)
        .filter((t) => t && typeof t.id === "string" && t.id && SALAS.has(String(t.sala)) && typeof t.pregunta === "string" && t.pregunta)
        .map((t) => ({
            id: texto(t.id, 64),
            clerk_user_id: userId,
            sala: String(t.sala),
            nodo: nodoDe(t.nodo),
            pregunta: texto(t.pregunta),
            respuesta: texto(t.respuesta),
            interrumpido: t.interrumpido === true,
            fallo: typeof t.fallo === "string" && t.fallo ? texto(t.fallo, 2000) : null,
            modelo,
            ts: entero(t.ts),
            updated_at: new Date().toISOString(),
        }))
    if (turnos.length) {
        const { error } = await db.from("council_turnos").upsert(turnos, { onConflict: "id" })
        if (error) {
            console.error("[council-gate] turnos", error.code, error.message)
            return json({ ok: false, error: motivoDb(error), guardados }, 500)
        }
        guardados.turnos = turnos.length
    }

    return json({ ok: true, guardados })
}

async function leerBoveda(userId: string): Promise<Response> {
    const db = sb()
    const { data: pbs, error: e1 } = await db
        .from("council_playbooks")
        .select("clave, sala, nodo, titulo, contenido, ciclo, propuesta, friccion, actualizado_ts")
        .eq("clerk_user_id", userId)
    if (e1) {
        console.error("[council-gate] leer playbooks", e1.code, e1.message)
        return json({ ok: false, error: motivoDb(e1) }, 500)
    }
    const playbooks = (pbs ?? []).map((p) => ({
        clave: p.clave,
        sala: p.sala,
        nodo: p.nodo,
        titulo: p.titulo,
        contenido: p.contenido,
        ciclo: p.ciclo,
        propuesta: p.propuesta,
        friccion: p.friccion,
        actualizadoTs: Number(p.actualizado_ts) || 0,
    }))

    /* Últimos N turnos POR cámara (cuatro consultas chicas; el volumen es de
       un solo Arquitecto) */
    const turnos: unknown[] = []
    for (const sala of SALAS) {
        const { data, error } = await db
            .from("council_turnos")
            .select("id, sala, nodo, pregunta, respuesta, interrumpido, fallo, ts")
            .eq("clerk_user_id", userId)
            .eq("sala", sala)
            .order("ts", { ascending: false })
            .limit(TURNOS_AL_LEER)
        if (error) {
            console.error("[council-gate] leer turnos", error.code, error.message)
            return json({ ok: false, error: motivoDb(error) }, 500)
        }
        for (const t of data ?? [])
            turnos.push({
                id: t.id,
                sala: t.sala,
                nodo: t.nodo,
                pregunta: t.pregunta,
                respuesta: t.respuesta,
                interrumpido: t.interrumpido || undefined,
                fallo: t.fallo || undefined,
                ts: Number(t.ts) || 0,
            })
    }
    return json({ ok: true, playbooks, turnos })
}

/* Versiones anteriores de un playbook: las evoluciones (y la propuesta y
   fricción de cada ciclo) desde el archivo append-only. */
async function versionesBoveda(
    userId: string,
    body: { clave?: unknown; limite?: unknown }
): Promise<Response> {
    const clave = texto(body.clave, 80)
    if (!clave) return json({ ok: false, error: "sin_clave" }, 400)
    const limite = Math.min(60, Math.max(1, entero(body.limite) || 30))
    const db = sb()
    const { data, error } = await db
        .from("council_deliberaciones")
        .select("ciclo, etapa, texto, ts")
        .eq("clerk_user_id", userId)
        .eq("clave", clave)
        .order("ts", { ascending: false })
        .limit(limite * 3)
    if (error) {
        console.error("[council-gate] versiones", error.code, error.message)
        return json({ ok: false, error: motivoDb(error) }, 500)
    }
    /* Se agrupa por ciclo: la evolución manda; propuesta y fricción del
       mismo ciclo la acompañan. */
    const porCiclo = new Map<number, { ciclo: number; contenido: string; propuesta: string; friccion: string; ts: number }>()
    for (const f of data ?? []) {
        const c = Number(f.ciclo) || 0
        const v = porCiclo.get(c) ?? { ciclo: c, contenido: "", propuesta: "", friccion: "", ts: 0 }
        if (f.etapa === "evolucion") {
            v.contenido = f.texto
            v.ts = Number(f.ts) || 0
        } else if (f.etapa === "propuesta") v.propuesta = f.texto
        else if (f.etapa === "friccion") v.friccion = f.texto
        porCiclo.set(c, v)
    }
    const versiones = Array.from(porCiclo.values())
        .filter((v) => v.contenido)
        .sort((a, b) => b.ciclo - a.ciclo)
        .slice(0, limite)
    return json({ ok: true, versiones })
}

/* ── Los REGISTROS del Arquitecto ────────────────────────────────────── */
/* Lo que escribe SU mano: el pergamino (oro y plata), el bote, el cofre, el
   arsenal, el ábaco, la ley y el registro de cada nodo, y dónde dejó cada
   reliquia en la sala. Viaja en dos formas porque son dos naturalezas:
   DOCUMENTOS (se reescriben enteros, gana el más reciente) y ENTRADAS (una
   fila cada una, con lápida al borrar). La escritura la hacen las funciones
   council_guardar_*: solo pisan una fila si la que llega es más nueva, así
   dos computadoras a la vez no se destruyen. */

const TIPOS_DOC = new Set(["cofre", "ley", "bitacora", "posicion"])
/* 🜂 LA PRODUCCIÓN DE FOTÓN CERO (2026-08-17 · II): seis tipos más, con JSON
   en el contenido. Van en su PROPIA llamada a la base: si la migración
   20260817_council_produccion.sql todavía no se pegó, la restricción de tipos
   los rechaza y ese rechazo no debe tumbar el guardado del pergamino y los
   cofres que viajan en el mismo lote. */
const TIPOS_PRODUCCION = new Set(["sello", "serie", "personaje", "episodio", "album", "cancion"])
const MAX_DOC_PRODUCCION_CHARS = 60000
const TIPOS_ENTRADA = new Set(["juicio", "tarea"])
const MAX_DOCUMENTOS = 300
const MAX_ENTRADAS = 800
const MAX_DOC_CHARS = 8000
const ENTRADAS_AL_LEER = 3000

interface DocIn {
    tipo?: unknown
    clave?: unknown
    contenido?: unknown
    ts?: unknown
}
interface EntradaIn {
    tipo?: unknown
    id?: unknown
    clave?: unknown
    datos?: unknown
    borrada?: unknown
    ts?: unknown
}

async function guardarRegistros(
    userId: string,
    body: { documentos?: unknown; entradas?: unknown }
): Promise<Response> {
    const db = sb()
    const guardados = { documentos: 0, entradas: 0 }

    const crudos = (Array.isArray(body.documentos) ? (body.documentos as DocIn[]) : []).slice(0, MAX_DOCUMENTOS)
    const documentos = crudos
        .filter((d) => d && TIPOS_DOC.has(String(d.tipo)) && typeof d.clave === "string" && d.clave)
        .map((d) => ({
            tipo: String(d.tipo),
            clave: texto(d.clave, 120),
            contenido: texto(d.contenido, MAX_DOC_CHARS),
            ts: entero(d.ts),
        }))
    const produccion = crudos
        .filter((d) => d && TIPOS_PRODUCCION.has(String(d.tipo)) && typeof d.clave === "string" && d.clave)
        .map((d) => ({
            tipo: String(d.tipo),
            clave: texto(d.clave, 120),
            contenido: texto(d.contenido, MAX_DOC_PRODUCCION_CHARS),
            ts: entero(d.ts),
        }))
    /* la producción, en su propia llamada: su fallo se reporta aparte */
    let produccionError: string | null = null
    if (produccion.length) {
        const { data, error } = await db.rpc("council_guardar_registros", {
            p_user: userId,
            p_items: produccion,
        })
        if (error) {
            console.error("[council-gate] registros produccion", error.code, error.message)
            produccionError = /check constraint|violates/i.test(error.message) ? "produccion_sin_tipos" : motivoDb(error)
        } else guardados.documentos += Number(data) || 0
    }
    if (documentos.length) {
        const { data, error } = await db.rpc("council_guardar_registros", {
            p_user: userId,
            p_items: documentos,
        })
        if (error) {
            console.error("[council-gate] registros doc", error.code, error.message)
            return json({ ok: false, error: motivoDb(error), guardados }, 500)
        }
        guardados.documentos += Number(data) || 0
    }

    const entradas = (Array.isArray(body.entradas) ? (body.entradas as EntradaIn[]) : [])
        .slice(0, MAX_ENTRADAS)
        .filter((e) => e && TIPOS_ENTRADA.has(String(e.tipo)) && typeof e.id === "string" && e.id)
        .map((e) => ({
            tipo: String(e.tipo),
            id: texto(e.id, 64),
            clave: texto(e.clave, 120),
            /* el objeto entero, tal cual lo usa la app */
            datos: e.datos && typeof e.datos === "object" ? e.datos : {},
            borrada: e.borrada === true,
            ts: entero(e.ts),
        }))
    if (entradas.length) {
        const { data, error } = await db.rpc("council_guardar_entradas", {
            p_user: userId,
            p_items: entradas,
        })
        if (error) {
            console.error("[council-gate] registros entradas", error.code, error.message)
            return json({ ok: false, error: motivoDb(error), guardados }, 500)
        }
        guardados.entradas = Number(data) || 0
    }

    /* ok para todo lo demás; la producción dice aparte si le falta su lugar */
    return json(produccionError ? { ok: true, guardados, produccion: produccionError } : { ok: true, guardados })
}

async function leerRegistros(userId: string): Promise<Response> {
    const db = sb()
    const { data: docs, error: e1 } = await db
        .from("council_registros")
        .select("tipo, clave, contenido, actualizado_ts")
        .eq("clerk_user_id", userId)
    if (e1) {
        console.error("[council-gate] leer registros", e1.code, e1.message)
        return json({ ok: false, error: motivoDb(e1) }, 500)
    }
    const { data: ents, error: e2 } = await db
        .from("council_entradas")
        .select("tipo, id, clave, datos, borrada, actualizado_ts")
        .eq("clerk_user_id", userId)
        .order("actualizado_ts", { ascending: false })
        .limit(ENTRADAS_AL_LEER)
    if (e2) {
        console.error("[council-gate] leer entradas", e2.code, e2.message)
        return json({ ok: false, error: motivoDb(e2) }, 500)
    }
    return json({
        ok: true,
        documentos: (docs ?? []).map((d) => ({
            tipo: d.tipo,
            clave: d.clave,
            contenido: d.contenido,
            ts: Number(d.actualizado_ts) || 0,
        })),
        entradas: (ents ?? []).map((e) => ({
            tipo: e.tipo,
            id: e.id,
            clave: e.clave,
            datos: e.datos,
            borrada: e.borrada === true,
            ts: Number(e.actualizado_ts) || 0,
        })),
    })
}

/* ── 🜂 La MÚSICA del templo (R2) ────────────────────────────────────── */
/* El Arquitecto sube pistas desde la biblioteca del Council; viven en R2 bajo
   Council/musica/ y el catálogo viaja como registro (cofre:musica). Aquí solo
   se sube y se borra: el archivo se verifica por sus BYTES (no por lo que diga
   el cliente) y nunca pasa de 25 MB. */

const MUSICA_MAX_BYTES = 25 * 1024 * 1024
const MUSICA_KINDS: UploadKind[] = ["mp3", "m4a", "wav", "ogg", "mp4"]
const MUSICA_PREFIJO = "Council/musica/"

interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

function r2Config(): R2Config | { faltan: string[] } {
    const accountId = Deno.env.get("R2_ACCOUNT_ID") || ""
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") || ""
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") || ""
    const bucket = Deno.env.get("R2_BUCKET") || ""
    const publicBaseUrl = Deno.env.get("R2_PUBLIC_BASE_URL") || ""
    const faltan: string[] = []
    if (!accountId) faltan.push("R2_ACCOUNT_ID")
    if (!accessKeyId) faltan.push("R2_ACCESS_KEY_ID")
    if (!secretAccessKey) faltan.push("R2_SECRET_ACCESS_KEY")
    if (!bucket) faltan.push("R2_BUCKET")
    if (!publicBaseUrl) faltan.push("R2_PUBLIC_BASE_URL")
    if (faltan.length) return { faltan }
    return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl }
}

function bytesToHex(bytes: Uint8Array): string {
    let out = ""
    for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0")
    return out
}
async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf = typeof data === "string" ? new TextEncoder().encode(data) : data
    return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
}
async function hmacSha256(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
    const keyData = typeof key === "string" ? new TextEncoder().encode(key) : key
    const k = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)))
}
const s3Path = (bucket: string, key: string) =>
    `/${encodeURIComponent(bucket)}/${key.split("/").map((x) => encodeURIComponent(x)).join("/")}`

/* Una petición firmada (AWS Sig V4) a R2: PUT con cuerpo o DELETE sin él */
async function r2Peticion(cfg: R2Config, metodo: "PUT" | "DELETE", key: string, bytes?: Uint8Array, contentType?: string): Promise<Response> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto"
    const service = "s3"
    const canonicalUri = s3Path(cfg.bucket, key)
    const payloadHash = await sha256Hex(bytes ?? new Uint8Array())
    const amzDate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)
    const cabeceras: Array<[string, string]> = []
    if (contentType) cabeceras.push(["content-type", contentType])
    cabeceras.push(["host", host], ["x-amz-content-sha256", payloadHash], ["x-amz-date", amzDate])
    const canonicalHeaders = cabeceras.map(([k, v]) => `${k}:${v}\n`).join("")
    const signedHeaders = cabeceras.map(([k]) => k).join(";")
    const canonicalRequest = `${metodo}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    const scope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`
    const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp)
    const kRegion = await hmacSha256(kDate, region)
    const kService = await hmacSha256(kRegion, service)
    const kSigning = await hmacSha256(kService, "aws4_request")
    const firma = bytesToHex(await hmacSha256(kSigning, stringToSign))
    const headers: Record<string, string> = {
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${firma}`,
    }
    if (contentType) headers["Content-Type"] = contentType
    return fetch(`https://${host}${canonicalUri}`, { method: metodo, headers, body: bytes })
}

const fechaHoy = () => new Date().toISOString().slice(0, 10)

async function musicaSubir(body: { nombre?: unknown; audio_base64?: unknown }): Promise<Response> {
    const cfg = r2Config()
    if ("faltan" in cfg) return json({ ok: false, error: "missing_secrets", detail: cfg.faltan.join(", ") }, 500)
    const v = verifyUpload(String(body.audio_base64 ?? ""), { allow: MUSICA_KINDS, maxBytes: MUSICA_MAX_BYTES })
    if (!v.ok) return json({ ok: false, error: v.error, detail: v.detail }, v.status)
    /* el mp4 que pase el filtro es audio en contenedor ISO (un m4a sin marca) */
    const mime = v.ext === "mp4" ? "audio/mp4" : v.mime
    const id = crypto.randomUUID()
    const key = `${MUSICA_PREFIJO}${fechaHoy()}/${id}.${v.ext === "mp4" ? "m4a" : v.ext}`
    try {
        const r = await r2Peticion(cfg, "PUT", key, v.bytes, mime)
        if (!r.ok) {
            const t = await r.text().catch(() => "")
            console.error("[council-gate] r2 put", r.status, t.slice(0, 300))
            return json({ ok: false, error: "r2_upload_failed", detail: `R2 ${r.status}` }, 502)
        }
    } catch (e) {
        console.error("[council-gate] r2 put", String(e))
        return json({ ok: false, error: "r2_upload_failed", detail: String((e as Error)?.message || e) }, 502)
    }
    const url = `${cfg.publicBaseUrl.replace(/\/+$/, "")}/${key.split("/").map((x) => encodeURIComponent(x)).join("/")}`
    return json({ ok: true, id, url, bytes: v.bytes.length, ext: v.ext, nombre: texto(body.nombre, 120) })
}

async function musicaBorrar(body: { url?: unknown }): Promise<Response> {
    const cfg = r2Config()
    if ("faltan" in cfg) return json({ ok: false, error: "missing_secrets", detail: cfg.faltan.join(", ") }, 500)
    const url = texto(body.url, 800)
    const base = `${cfg.publicBaseUrl.replace(/\/+$/, "")}/`
    /* solo lo que vive bajo Council/musica/: ninguna otra llave del bucket */
    if (!url.startsWith(base)) return json({ ok: false, error: "url_ajena" }, 400)
    let key = ""
    try {
        key = url.slice(base.length).split("/").map((x) => decodeURIComponent(x)).join("/")
    } catch {
        return json({ ok: false, error: "url_ilegible" }, 400)
    }
    if (!key.startsWith(MUSICA_PREFIJO) || key.includes("..")) return json({ ok: false, error: "url_ajena" }, 400)
    try {
        const r = await r2Peticion(cfg, "DELETE", key)
        if (!r.ok && r.status !== 404) {
            const t = await r.text().catch(() => "")
            console.error("[council-gate] r2 delete", r.status, t.slice(0, 300))
            return json({ ok: false, error: "r2_delete_failed", detail: `R2 ${r.status}` }, 502)
        }
    } catch (e) {
        return json({ ok: false, error: "r2_delete_failed", detail: String((e as Error)?.message || e) }, 502)
    }
    return json({ ok: true })
}

/* ── Soniox ─────────────────────────────────────────────────────────── */

async function llaveTemporal(
    usage_type: "transcribe_websocket" | "tts_rt",
    userId: string
): Promise<{ api_key: string; expires_in_seconds: number } | { error: string; status: number }> {
    try {
        const r = await fetch("https://api.soniox.com/v1/auth/temporary-api-key", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SONIOX_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usage_type,
                expires_in_seconds: EXPIRA_S,
                client_reference_id: `council:${userId}`,
            }),
        })
        if (!r.ok) {
            const detalle = await r.text().catch(() => "")
            console.error("[council-gate] soniox", usage_type, r.status, detalle.slice(0, 300))
            return { error: `soniox_${r.status}`, status: 502 }
        }
        const j = (await r.json()) as { api_key?: string; expires_in_seconds?: number }
        if (!j.api_key) return { error: "soniox_sin_llave", status: 502 }
        return { api_key: j.api_key, expires_in_seconds: j.expires_in_seconds ?? EXPIRA_S }
    } catch (e) {
        console.error("[council-gate] soniox fetch", usage_type, String(e))
        return { error: "soniox_unreachable", status: 502 }
    }
}

/* ── El Mensajero (Telegram) ─────────────────────────────────────────── */

const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
/* Si el chat viene fijado por secret, manda sobre lo que pida el navegador */
const TG_CHAT_FIJO = (Deno.env.get("TELEGRAM_CHAT_ID") || "").trim()
/* Telegram corta en 4096 caracteres; 3600 deja aire para el encabezado */
const TG_TOPE_MENSAJE = 3600
const TG_MAX_PARTES = 12

const chatValido = (v: unknown): string =>
    typeof v === "string" && /^-?\d{5,20}$/.test(v.trim()) ? v.trim() : ""

async function tg(metodo: string, cuerpo?: unknown): Promise<{ ok: boolean; datos?: any; error?: string }> {
    try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/${metodo}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cuerpo ?? {}),
        })
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; result?: unknown; description?: string }
        if (!r.ok || !j.ok) {
            const desc = j.description || `http_${r.status}`
            console.error("[council-gate] telegram", metodo, r.status, desc)
            return { ok: false, error: desc }
        }
        return { ok: true, datos: j.result }
    } catch (e) {
        console.error("[council-gate] telegram fetch", metodo, String(e))
        return { ok: false, error: "telegram_unreachable" }
    }
}

/* Parte un texto largo por líneas para que ningún mensaje pase el tope de
   Telegram; una línea más larga que el tope se corta a la fuerza. */
function partirMensaje(t: string): string[] {
    const partes: string[] = []
    let actual = ""
    for (const linea of t.split("\n")) {
        const trozos = linea.length > TG_TOPE_MENSAJE ? (linea.match(new RegExp(`[\\s\\S]{1,${TG_TOPE_MENSAJE}}`, "g")) ?? []) : [linea]
        for (const trozo of trozos) {
            if (actual && actual.length + trozo.length + 1 > TG_TOPE_MENSAJE) {
                partes.push(actual)
                actual = trozo
            } else {
                actual = actual ? `${actual}\n${trozo}` : trozo
            }
        }
    }
    if (actual.trim()) partes.push(actual)
    return partes.slice(0, TG_MAX_PARTES)
}

async function mensajeroEstado(): Promise<Response> {
    if (!TG_TOKEN) return json({ ok: true, listo: false, error: "sin_llave" })
    const r = await tg("getMe")
    if (!r.ok) return json({ ok: true, listo: false, error: r.error })
    return json({
        ok: true,
        listo: true,
        bot: { usuario: r.datos?.username || "", nombre: r.datos?.first_name || "" },
        chatFijo: TG_CHAT_FIJO || null,
    })
}

async function mensajeroEnvia(body: { chatId?: unknown; texto?: unknown }): Promise<Response> {
    if (!TG_TOKEN) return json({ ok: false, error: "sin_llave" }, 400)
    const chat = TG_CHAT_FIJO || chatValido(body.chatId)
    if (!chat) return json({ ok: false, error: "sin_chat" }, 400)
    const cuerpo = texto(body.texto, 30000).trim()
    if (!cuerpo) return json({ ok: false, error: "sin_texto" }, 400)
    const partes = partirMensaje(cuerpo)
    let enviadas = 0
    for (const parte of partes) {
        /* sin parse_mode a propósito: los playbooks vienen llenos de
           asteriscos y almohadillas y Telegram rechazaría el markdown */
        const r = await tg("sendMessage", { chat_id: chat, text: parte, disable_web_page_preview: true })
        if (!r.ok) return json({ ok: false, error: r.error, enviadas }, 502)
        enviadas++
    }
    return json({ ok: true, enviadas, partes: partes.length })
}

async function mensajeroLee(body: { chatId?: unknown; offset?: unknown }): Promise<Response> {
    if (!TG_TOKEN) return json({ ok: false, error: "sin_llave" }, 400)
    const chat = TG_CHAT_FIJO || chatValido(body.chatId)
    const offset = entero(body.offset)
    const r = await tg("getUpdates", {
        ...(offset ? { offset } : {}),
        timeout: 0,
        limit: 20,
        allowed_updates: ["message"],
    })
    if (!r.ok) return json({ ok: false, error: r.error }, 502)
    const lista = Array.isArray(r.datos) ? r.datos : []
    const mensajes: Array<{ updateId: number; chatId: string; de: string; texto: string; ts: number }> = []
    /* Para el descubrimiento del chat: quién le ha escrito al bot */
    const vistos = new Map<string, string>()
    let ultimo = 0
    for (const u of lista) {
        const id = Number(u?.update_id) || 0
        if (id > ultimo) ultimo = id
        const m = u?.message
        if (!m || typeof m.text !== "string" || !m.text.trim()) continue
        const cid = String(m.chat?.id ?? "")
        const de = String(m.from?.first_name || m.chat?.title || "").slice(0, 60)
        if (cid) vistos.set(cid, de)
        /* con chat elegido, lo de cualquier otro se consume y se tira */
        if (chat && cid !== chat) continue
        mensajes.push({ updateId: id, chatId: cid, de, texto: m.text.slice(0, 4000), ts: (Number(m.date) || 0) * 1000 })
    }
    return json({
        ok: true,
        mensajes,
        siguienteOffset: ultimo ? ultimo + 1 : offset,
        chats: Array.from(vistos.entries()).map(([id, nombre]) => ({ id, nombre })),
    })
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    let body: {
        token?: string
        quiero?: string
        playbooks?: unknown
        deliberaciones?: unknown
        turnos?: unknown
        modelo?: unknown
        clave?: unknown
        limite?: unknown
        chatId?: unknown
        offset?: unknown
        texto?: unknown
        documentos?: unknown
        entradas?: unknown
        nombre?: unknown
        audio_base64?: unknown
        url?: unknown
    } = {}
    try {
        body = await req.json()
    } catch {
        return json({ error: "bad_json" }, 400)
    }

    const gate = await gateAdmin(body?.token)
    if (!gate.ok) return json({ error: gate.error }, gate.status ?? 401)
    const userId = gate.userId || "arquitecto"

    const quiero = body.quiero || "acceso"
    if (quiero === "acceso") return json({ ok: true, userId: gate.userId })
    if (quiero === "boveda-guardar") return guardarBoveda(userId, body)
    if (quiero === "boveda-leer") return leerBoveda(userId)
    if (quiero === "boveda-versiones") return versionesBoveda(userId, body)
    if (quiero === "registros-guardar") return guardarRegistros(userId, body)
    if (quiero === "registros-leer") return leerRegistros(userId)
    if (quiero === "mensajero-estado") return mensajeroEstado()
    if (quiero === "mensajero-envia") return mensajeroEnvia(body)
    if (quiero === "mensajero-lee") return mensajeroLee(body)
    if (quiero === "musica-subir") return musicaSubir(body)
    if (quiero === "musica-borrar") return musicaBorrar(body)

    if (quiero !== "voz" && quiero !== "voz-salida") return json({ error: "quiero_desconocido" }, 400)
    if (!SONIOX_KEY) return json({ ok: false, error: "soniox_key_missing" }, 500)

    if (quiero === "voz") {
        const l = await llaveTemporal("transcribe_websocket", userId)
        if ("error" in l) return json({ ok: false, error: l.error }, l.status)
        return json({
            ok: true,
            voz: { apiKey: l.api_key, model: STT_MODEL, expiresIn: l.expires_in_seconds },
        })
    }

    const l = await llaveTemporal("tts_rt", userId)
    if ("error" in l) return json({ ok: false, error: l.error }, l.status)
    return json({
        ok: true,
        salida: {
            apiKey: l.api_key,
            model: TTS_MODEL,
            expiresIn: l.expires_in_seconds,
            voces: VOCES,
        },
    })
})
