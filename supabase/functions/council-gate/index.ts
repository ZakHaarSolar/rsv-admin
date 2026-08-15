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
//
// La inferencia del Council NO pasa por aquí: corre en la Mac del Arquitecto
// (Ollama, localhost) y el navegador le habla directo.
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY ·
//          SONIOX_API_KEY (ya existe para espejo-voz) · SONIOX_STT_MODEL (opcional)
// Despliegue: supabase functions deploy council-gate --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"

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
   que el cliente sabe explicar: "pega la migración". */
function motivoDb(e: { code?: string; message?: string } | null): string {
    if (!e) return "db"
    if (e.code === "42P01" || /does not exist|schema cache/i.test(e.message || "")) return "sin_tabla"
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
