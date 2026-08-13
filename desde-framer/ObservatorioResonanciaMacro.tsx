// Red Solar Viva — ObservatorioResonanciaMacro.tsx v1.9 — RPC admin por gateway admin-action (Batch 3 seguridad, barrido 2026-06-13)
// v1.8.1 — Ola C #3: las llamadas a sprint/nodo mandan el token de Clerk verificado.
// v1.8 — Panel del Nodo (TRAYECTORIA DEL NODO): se eliminan las dos
// scrollbars que aparecían al abrirlo. (1) Backdrop del modal con
// overflow:hidden (antes overflowY:auto duplicaba la scrollbar
// nativa del viewport). (2) Modal interno mantiene su scroll
// (necesario para Destilación + Interferencias) pero con scrollbar
// cosmético invisible (scrollbarWidth:none + ::-webkit-scrollbar).
// El scroll del modal sigue funcionando con rueda y gestos táctiles.
// v1.7.3 — Timeout del fetch de destilación sube a 145s para darle margen al Gemini 3.1 Pro preview + retries con backoff. v1.7.2 mensaje específico para 503. v1.7.1 AbortController + manejo 504. v1.7 SeccionDestilacionNodo con 3 pilares + persistencia.
// Sub-componente del Observatorio de Resonancia · estado MACRO (Cámara Solar).
//
// Renderiza tres lóbulos de telemetría grupal:
//   1. Mapa Térmico — Pulso Central · Altas Resonancias · Fricciones detectadas,
//      parseados desde el sello_text destilado por Gemini.
//   2. Trayectoria de Nodos — speakers agregados por sesión (palabras / turnos /
//      segundos de transmisión). Click en un Nodo abre un panel lateral con su
//      evolución en las últimas 5 sesiones.
//   3. Proyección del Sprint — comando del próximo ciclo, derivado del
//      Protocolo de Sintonía del sello actual.
//
// Default export por la regla Framer de named-export-roto.

import * as React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

/* ════════════════════════════════════════════════════════════════
   Tipos
   ════════════════════════════════════════════════════════════════ */
interface Utterance {
    speaker: string
    start: number
    end: number
    text: string
}
interface SpeakerSummary {
    turns: number
    words: number
    seconds: number
}
interface Sesion {
    id: string
    id_sesion: string
    fecha: string
    pdf_url: string | null
    sello_text: string | null
    speakers_summary: Record<string, SpeakerSummary> | null
    duracion_minutos: number | null
    total_palabras: number | null
    transcript_json: { utterances?: Utterance[]; text?: string } | null
    created_at: string
}
interface ParsedSello {
    pulso: string | null
    codigos: { title: string; body: string }[]
    correcciones: { distorsion: string; correccion: string }[]
    protocolo: { titulo: string; instruccion: string } | null
}

interface AliasNodo {
    id_sesion: string
    speaker_id: string
    perfil_nodo_id: string | null
    eliminado: boolean
    nombre_ancla: string | null
    slug: string | null
    avatar_color: string | null
    es_host?: boolean | null
}
interface PerfilNodo {
    id: string
    nombre_ancla: string
    slug: string
    notas_admin: string | null
    avatar_color: string | null
    es_host?: boolean
    created_at: string
    updated_at: string
}

/* ════════════════════════════════════════════════════════════════
   sbRpc local (patrón admin consistente)
   ════════════════════════════════════════════════════════════════ */
async function sbRpc(url: string, key: string, fn: string, params: any) {
    if (!url || !key) return null
    try {
        // Familia admin Observatorio por gateway admin-action (token verificado;
        // el server inyecta el id admin, descarta el del body). Fallback
        // transitorio a la directa hasta el REVOKE.
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/admin-action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ token, action: fn, params }),
            })
            if (g.ok) {
                const d = await g.json()
                if (d != null) return d
            }
        }
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        if (!r.ok) return null
        return await r.json()
    } catch {
        return null
    }
}

/* adminCall — enruta una RPC admin por el gateway VERIFICADO admin-action
   (inyecta el id admin del token, descarta el del body). Cierra la escalada
   anon→admin. `gwParams` van SIN el id admin; `directParams` lo incluyen para
   el fallback transitorio a la lectura directa hasta que se aplique el REVOKE. */
async function adminCall(
    url: string,
    key: string,
    action: string,
    gwParams: any,
    directParams: any
) {
    if (url && key) {
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            if (token) {
                const r = await fetch(`${url}/functions/v1/admin-action`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: key,
                        Authorization: `Bearer ${key}`,
                    },
                    body: JSON.stringify({ token, action, params: gwParams }),
                })
                if (r.ok) {
                    const d = await r.json()
                    if (d != null) return d
                }
            }
        } catch {}
    }
    // Fallback transitorio (gateway aún no desplegado): lectura directa.
    return await sbRpc(url, key, action, directParams)
}

/* ════════════════════════════════════════════════════════════════
   Parser del sello destilado — extrae bloques canónicos
   ════════════════════════════════════════════════════════════════ */
function parseSello(txt: string | null): ParsedSello {
    const out: ParsedSello = {
        pulso: null,
        codigos: [],
        correcciones: [],
        protocolo: null,
    }
    if (!txt) return out
    const lines = txt.split("\n").map((l) => l.trim())

    const sectionPatterns = {
        pulso: /^EL\s+PULSO\s+CENTRAL/i,
        codigos: /^C[ÓO]DIGOS\s+DESPLEGADOS/i,
        correccion: /^CORRECCI[ÓO]N\s+VIBRAL/i,
        protocolo: /^PROTOCOLO\s+DE\s+SINTON[ÍI]A/i,
    }

    let current: "pulso" | "codigos" | "correccion" | "protocolo" | null = null
    let buffer: string[] = []
    const flushBuffer = () => {
        if (current === "pulso") {
            const body = buffer.join(" ").replace(/\s+/g, " ").trim()
            if (body) out.pulso = body
        }
        buffer = []
    }

    for (const raw of lines) {
        const l = raw
        if (!l) continue

        if (sectionPatterns.pulso.test(l)) {
            flushBuffer()
            current = "pulso"
            continue
        }
        if (sectionPatterns.codigos.test(l)) {
            flushBuffer()
            current = "codigos"
            continue
        }
        if (sectionPatterns.correccion.test(l)) {
            flushBuffer()
            current = "correccion"
            continue
        }
        if (sectionPatterns.protocolo.test(l)) {
            flushBuffer()
            current = "protocolo"
            continue
        }

        // Subtítulos entre paréntesis — omitir
        if (/^\(.+\)$/.test(l)) continue
        // Main title — omitir
        if (/^SELLO\s+DE\s+INTEGRACI[ÓO]N/i.test(l)) continue

        if (current === "pulso") {
            buffer.push(l)
        } else if (current === "codigos") {
            // Líneas tipo "✧ Título: Descripción"
            const m = l.match(/^[✧✦☉△◇○●◆▽]\s*(.+)$/)
            if (m) {
                const rest = m[1]
                const idx = rest.indexOf(":")
                if (idx > 0) {
                    out.codigos.push({
                        title: rest.slice(0, idx).trim(),
                        body: rest.slice(idx + 1).trim(),
                    })
                } else {
                    out.codigos.push({ title: "", body: rest.trim() })
                }
            } else if (out.codigos.length > 0 && l.length > 0) {
                // Continuación del último código
                out.codigos[out.codigos.length - 1].body += " " + l
            }
        } else if (current === "correccion") {
            if (/^Distorsi[óo]n/i.test(l)) {
                const body = l.split(":").slice(1).join(":").trim()
                out.correcciones.push({ distorsion: body, correccion: "" })
            } else if (/^Correcci[óo]n/i.test(l)) {
                const body = l.split(":").slice(1).join(":").trim()
                if (out.correcciones.length === 0) {
                    out.correcciones.push({ distorsion: "", correccion: body })
                } else {
                    out.correcciones[out.correcciones.length - 1].correccion =
                        body
                }
            } else if (out.correcciones.length > 0) {
                const last = out.correcciones[out.correcciones.length - 1]
                if (last.correccion) {
                    last.correccion += " " + l
                } else {
                    last.distorsion += " " + l
                }
            }
        } else if (current === "protocolo") {
            if (/^El\s+Comando/i.test(l) || /^El\s+Protocolo/i.test(l) || /^La\s+Ejecuci[óo]n/i.test(l)) {
                const idx = l.indexOf(":")
                if (idx > 0) {
                    out.protocolo = {
                        titulo: l.slice(0, idx).trim(),
                        instruccion: l.slice(idx + 1).trim(),
                    }
                } else {
                    out.protocolo = { titulo: l.trim(), instruccion: "" }
                }
            } else if (out.protocolo) {
                out.protocolo.instruccion = (
                    out.protocolo.instruccion +
                    " " +
                    l
                ).trim()
            }
        }
    }
    flushBuffer()
    return out
}

/* ════════════════════════════════════════════════════════════════
   Parser de transcripción manual · plain text → utterances
   Reconoce líneas tipo:
     Speaker 0: hola ...
     Speaker 1. hola ...
     SPEAKER 2 - hola ...
     Hablante 0: hola ...
     Zak'Haar: hola ...          (mapea a speaker_0 por default)
     [00:02:14] Speaker 0: ...   (timestamps ignorados)
   Si no detecta ningún header de hablante, devuelve UN turno único
   etiquetado "speaker_0" con todo el texto.
   ════════════════════════════════════════════════════════════════ */
function parseTranscriptManual(raw: string): {
    utterances: Utterance[]
    speakersSummary: Record<string, SpeakerSummary>
    totalPalabras: number
} {
    const text = (raw || "").trim()
    if (!text) {
        return { utterances: [], speakersSummary: {}, totalPalabras: 0 }
    }

    const speakerHeader =
        /^\s*(?:\[[^\]]*\]\s*)?(?:speaker|hablante|sp\.?|s)\s*(\d+)\s*[:.\-—]\s*/i
    const namedHeader = /^\s*(zak'?haar|zakhaar|arquitecto)\s*[:.\-—]\s*/i

    const lines = text.split(/\r?\n/)
    const turns: { speaker: string; text: string }[] = []

    for (const line of lines) {
        if (!line.trim()) continue

        let match = line.match(speakerHeader)
        if (match) {
            const spNum = parseInt(match[1], 10) || 0
            const body = line.replace(speakerHeader, "").trim()
            if (body) {
                turns.push({ speaker: `speaker_${spNum}`, text: body })
            }
            continue
        }

        match = line.match(namedHeader)
        if (match) {
            const body = line.replace(namedHeader, "").trim()
            if (body) turns.push({ speaker: "speaker_0", text: body })
            continue
        }

        if (turns.length > 0) {
            turns[turns.length - 1].text += " " + line.trim()
        } else {
            turns.push({ speaker: "speaker_0", text: line.trim() })
        }
    }

    const utterances: Utterance[] = turns.map((t) => ({
        speaker: t.speaker,
        start: 0,
        end: 0,
        text: t.text.replace(/\s+/g, " ").trim(),
    }))

    const speakersSummary: Record<string, SpeakerSummary> = {}
    let totalPalabras = 0
    for (const u of utterances) {
        const words = u.text.split(/\s+/).filter(Boolean).length
        totalPalabras += words
        const entry = speakersSummary[u.speaker] || {
            turns: 0,
            words: 0,
            seconds: 0,
        }
        entry.turns += 1
        entry.words += words
        speakersSummary[u.speaker] = entry
    }

    return { utterances, speakersSummary, totalPalabras }
}

function slugify(txt: string): string {
    return (txt || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

/* ════════════════════════════════════════════════════════════════
   Helpers UI
   ════════════════════════════════════════════════════════════════ */
function formatSpeakerName(id: string): string {
    if (!id) return "Nodo"
    const match = id.match(/speaker[_\s]*(\d+)/i)
    if (!match) return id
    const n = parseInt(match[1], 10)
    if (n === 0) return "Zak'Haar"
    return `Nodo · ${n}`
}

/* Dado (id_sesion, speaker_id) devuelve el nombre resuelto contra la
   tabla perfiles_nodo, o el default ("Zak'Haar" / "Nodo · N") si no hay
   alias cargado. También indica si el Arquitecto marcó ese speaker como
   residual (eliminado). */
function resolveSpeaker(
    idSesion: string,
    speakerId: string,
    aliases: AliasNodo[],
    topSpeakerId?: string | null
): {
    displayName: string
    perfilId: string | null
    eliminado: boolean
    avatarColor: string | null
    esNamed: boolean
    esHost: boolean
} {
    const alias = aliases.find(
        (a) => a.id_sesion === idSesion && a.speaker_id === speakerId
    )
    const esTop = !!topSpeakerId && speakerId === topSpeakerId
    if (alias) {
        if (alias.nombre_ancla) {
            return {
                displayName: alias.nombre_ancla,
                perfilId: alias.perfil_nodo_id,
                eliminado: !!alias.eliminado,
                avatarColor: alias.avatar_color,
                esNamed: true,
                esHost: !!alias.es_host || esTop,
            }
        }
        return {
            displayName: formatSpeakerName(speakerId),
            perfilId: null,
            eliminado: !!alias.eliminado,
            avatarColor: null,
            esNamed: false,
            esHost: esTop,
        }
    }
    /* Default: el speaker con más palabras de la sesión se considera
       anfitrión (es el que habló más — casi siempre Zak'Haar). Fallback
       legacy: nombre que empieza con "Zak". */
    const fallback = formatSpeakerName(speakerId)
    return {
        displayName: fallback,
        perfilId: null,
        eliminado: false,
        avatarColor: null,
        esNamed: false,
        esHost: esTop || fallback.startsWith("Zak"),
    }
}

/* Devuelve el speaker_id con más palabras (entre los NO eliminados).
   Útil para el auto-host: el que más habló en la sesión = anfitrión. */
function getTopSpeakerId(
    sesion: Sesion,
    aliases: AliasNodo[]
): string | null {
    const summary = sesion.speakers_summary || {}
    let topId: string | null = null
    let topWords = -1
    for (const [id, s] of Object.entries(summary)) {
        const alias = aliases.find(
            (a) => a.id_sesion === sesion.id_sesion && a.speaker_id === id
        )
        if (alias?.eliminado) continue
        const words = (s as SpeakerSummary)?.words || 0
        if (words > topWords) {
            topWords = words
            topId = id
        }
    }
    return topId
}

function speakerInitial(id: string): string {
    const name = formatSpeakerName(id)
    if (name.startsWith("Zak")) return "Z"
    const m = name.match(/(\d+)/)
    return m ? m[1] : "?"
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso)
        return d.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    } catch {
        return iso
    }
}

function formatMinutes(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}m ${s.toString().padStart(2, "0")}s`
}

/* ════════════════════════════════════════════════════════════════
   Destilación Profunda del Nodo — 3 pilares IA
   ════════════════════════════════════════════════════════════════
   Llama a la edge function `destilar-nodo` que cruza las últimas N
   sesiones donde aparece el perfil y devuelve interferencias,
   intenciones y logros. Resultado se persiste en `destilacion_nodo`
   (UNIQUE por perfil_nodo_id → cada nueva reemplaza la anterior). */

interface DestilacionItem {
    nombre?: string
    descripcion?: string
    cita?: string
}
interface DestilacionPayload {
    id?: string
    solicitado_en?: string
    n_sesiones?: number
    fechas?: string[]
    modelo?: string
    interferencias?: DestilacionItem[]
    intenciones?: DestilacionItem[]
    logros?: DestilacionItem[]
    sintesis?: string | null
}

function formatTimestampCorto(iso: string | undefined): string {
    if (!iso) return ""
    try {
        const d = new Date(iso)
        const dia = String(d.getDate()).padStart(2, "0")
        const mes = String(d.getMonth() + 1).padStart(2, "0")
        const yy = String(d.getFullYear()).slice(-2)
        const hh = String(d.getHours()).padStart(2, "0")
        const mm = String(d.getMinutes()).padStart(2, "0")
        return `${dia}/${mes}/${yy} · ${hh}:${mm}`
    } catch {
        return iso
    }
}

function SeccionDestilacionNodo({
    perfilId,
    displayName,
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
}: {
    perfilId: string
    displayName: string
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
}) {
    const [destilacion, setDestilacion] =
        useState<DestilacionPayload | null>(null)
    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [destilando, setDestilando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /* Carga la destilación existente al abrir el modal (si hay). */
    useEffect(() => {
        let cancelado = false
        setCargandoInicial(true)
        setError(null)
        ;(async () => {
            if (!clerkId) {
                if (!cancelado) {
                    setCargandoInicial(false)
                    setError("Sin sesión de Arquitecto.")
                }
                return
            }
            const r = await sbRpc(
                supabaseUrl,
                supabaseAnonKey,
                "get_destilacion_nodo_admin",
                { p_clerk_id: clerkId, p_perfil_nodo_id: perfilId }
            )
            if (cancelado) return
            if (r?.success) {
                setDestilacion(r.destilacion || null)
            } else {
                setError(
                    r?.error === "not_admin"
                        ? "Solo un Arquitecto puede ver la destilación."
                        : "No pude cargar la destilación previa."
                )
            }
            setCargandoInicial(false)
        })()
        return () => {
            cancelado = true
        }
    }, [perfilId, clerkId, supabaseUrl, supabaseAnonKey])

    const destilar = useCallback(async () => {
        if (!clerkId || destilando) return
        setDestilando(true)
        setError(null)
        /* v1.7.1 — AbortController con timeout de 145s. Supabase Edge
           Functions cortan a ~150s con 504; paramos antes para mostrar
           un mensaje claro en vez de que se quede "destilando..." para
           siempre. v1.7.3 — subimos a 145s para darle margen a Gemini
           3.1 Pro preview + los 3 retries internos con backoff (1s+2s). */
        const ctrl = new AbortController()
        const timeoutId = window.setTimeout(() => ctrl.abort(), 145_000)
        try {
            const url = `${supabaseUrl}/functions/v1/destilar-nodo`
            const r = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    apikey: supabaseAnonKey,
                },
                body: JSON.stringify({
                    clerk_user_id: clerkId,
                    token: await (window as any).Clerk?.session?.getToken?.(),
                    perfil_nodo_id: perfilId,
                    n: 4,
                }),
                signal: ctrl.signal,
            })
            if (r.status === 504) {
                setError(
                    "Gemini tardó demasiado en responder (504). Reintentá en unos segundos."
                )
                return
            }
            let j: any = null
            try {
                j = await r.json()
            } catch {
                setError(
                    `El servidor respondió ${r.status} sin JSON. Reintentá en unos segundos.`
                )
                return
            }
            if (!r.ok || !j.success) {
                /* v1.7.2 — si el detail viene con "503" o "UNAVAILABLE"
                   (Gemini saturado) mostramos un mensaje amable que
                   deja claro que el problema es del núcleo de IA, no
                   de la app. */
                const detailStr = String(j?.detail || "")
                const saturado =
                    /\b503\b/.test(detailStr) ||
                    /UNAVAILABLE/i.test(detailStr) ||
                    /high demand/i.test(detailStr)
                setError(
                    saturado
                        ? "El núcleo de destilación está saturado en este momento (alta demanda). Reintentá en unos minutos."
                        : j?.detail ||
                          (j?.error === "not_admin"
                              ? "Solo un Arquitecto puede destilar."
                              : j?.error === "no_transcripts"
                                ? "Este nodo aún no tiene turnos transcritos en ninguna sesión."
                                : j?.error === "no_aliases"
                                  ? "Este nodo no aparece en sesiones ancladas todavía."
                                  : j?.error ||
                                    "No pude destilar — revisá la consola.")
                )
            } else {
                setDestilacion({
                    id: j.destilacion_id,
                    solicitado_en: new Date().toISOString(),
                    n_sesiones: j.n_sesiones,
                    fechas: j.fechas,
                    modelo: j.destilacion?.modelo || undefined,
                    interferencias: j.destilacion.interferencias || [],
                    intenciones: j.destilacion.intenciones || [],
                    logros: j.destilacion.logros || [],
                    sintesis: j.destilacion.sintesis || null,
                })
            }
        } catch (e: any) {
            if (e?.name === "AbortError") {
                setError(
                    "La destilación se canceló por timeout (más de 2 minutos). Reintentá."
                )
            } else {
                setError(String(e?.message || e))
            }
        } finally {
            window.clearTimeout(timeoutId)
            setDestilando(false)
        }
    }, [clerkId, perfilId, supabaseUrl, supabaseAnonKey, destilando])

    const yaDestilado = !!destilacion
    const timestamp = yaDestilado
        ? formatTimestampCorto(destilacion?.solicitado_en)
        : null

    return (
        <div
            style={{
                marginBottom: 22,
                padding: "18px 20px 22px 20px",
                borderRadius: 14,
                background:
                    "linear-gradient(135deg, rgba(22,12,32,0.55) 0%, rgba(12,6,20,0.72) 100%)",
                border: "1px solid rgba(162,120,220,0.32)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 10.5,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(188,152,236,0.85)",
                            fontWeight: 500,
                        }}
                    >
                        ✦ Destilación profunda
                    </div>
                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "rgba(220,220,240,0.48)",
                        }}
                    >
                        Cruza las últimas 4 sesiones de {displayName}.
                        {timestamp ? ` · Destilado ${timestamp}` : ""}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={destilar}
                    disabled={destilando || cargandoInicial || !clerkId}
                    style={{
                        all: "unset",
                        cursor:
                            destilando || cargandoInicial
                                ? "not-allowed"
                                : "pointer",
                        padding: "10px 20px",
                        borderRadius: 10,
                        background:
                            "linear-gradient(135deg, #9A6CE6 0%, #C89BFF 50%, #8B59D4 100%)",
                        color: "#0B0C13",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        boxShadow: "0 3px 16px rgba(154,108,230,0.32)",
                        opacity: destilando || cargandoInicial ? 0.5 : 1,
                    }}
                >
                    {destilando
                        ? "Destilando…"
                        : yaDestilado
                          ? "Re-destilar"
                          : "Destilar"}
                </button>
            </div>

            {error && (
                <div
                    style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(220,90,90,0.08)",
                        border: "1px solid rgba(220,90,90,0.32)",
                        color: "rgba(240,180,180,0.85)",
                        fontSize: 11.5,
                        letterSpacing: "0.02em",
                    }}
                >
                    {error}
                </div>
            )}

            {cargandoInicial && !destilacion && (
                <div
                    style={{
                        marginTop: 14,
                        fontSize: 11.5,
                        color: "rgba(220,220,240,0.45)",
                        letterSpacing: "0.04em",
                    }}
                >
                    Consultando destilación previa…
                </div>
            )}

            {!cargandoInicial && !destilacion && !error && (
                <div
                    style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: "rgba(220,220,240,0.55)",
                        letterSpacing: "0.02em",
                        lineHeight: 1.5,
                    }}
                >
                    Todavía no hay una destilación para este nodo. Al destilar,
                    Zak'Haar analizará sus turnos de las últimas 4 sesiones y
                    devolverá tres pilares: <b>interferencias</b> (fricciones
                    que repite), <b>intenciones</b> (hacia dónde quiere llegar)
                    y <b>logros</b> (lo que ya está funcionando). La próxima
                    destilación reemplaza ésta.
                </div>
            )}

            {destilacion && !error && (
                <div style={{ marginTop: 16 }}>
                    {destilacion.sintesis && (
                        <div
                            style={{
                                padding: "12px 14px",
                                borderRadius: 10,
                                background: "rgba(0,0,0,0.22)",
                                border: "1px solid rgba(162,120,220,0.18)",
                                fontSize: 12.5,
                                lineHeight: 1.6,
                                color: "rgba(232,238,247,0.82)",
                                marginBottom: 14,
                            }}
                        >
                            {destilacion.sintesis}
                        </div>
                    )}
                    <BloqueDestilacion
                        titulo="Interferencias"
                        subtitulo="Fricciones recurrentes · lo que bloquea expansión"
                        items={destilacion.interferencias || []}
                        color="#E6635B"
                        colorRgb="230,99,91"
                    />
                    <BloqueDestilacion
                        titulo="Intenciones"
                        subtitulo="Hacia dónde quiere llegar · proyectos y visiones"
                        items={destilacion.intenciones || []}
                        color="#00C2FF"
                        colorRgb="0,194,255"
                    />
                    <BloqueDestilacion
                        titulo="Logros"
                        subtitulo="Avances reportados · lo que ya está funcionando"
                        items={destilacion.logros || []}
                        color="#7AD27A"
                        colorRgb="122,210,122"
                    />
                    {destilacion.fechas && destilacion.fechas.length > 0 && (
                        <div
                            style={{
                                marginTop: 12,
                                fontSize: 10,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "rgba(220,220,240,0.32)",
                            }}
                        >
                            Sesiones cruzadas:{" "}
                            {destilacion.fechas.join(" · ")}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function BloqueDestilacion({
    titulo,
    subtitulo,
    items,
    color,
    colorRgb,
}: {
    titulo: string
    subtitulo: string
    items: DestilacionItem[]
    color: string
    colorRgb: string
}) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 8,
                    flexWrap: "wrap",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color,
                    }}
                >
                    {titulo}
                </span>
                <span
                    style={{
                        fontSize: 10,
                        color: `rgba(${colorRgb},0.42)`,
                        letterSpacing: "0.05em",
                    }}
                >
                    {subtitulo}
                </span>
            </div>
            {items.length === 0 ? (
                <div
                    style={{
                        fontSize: 11.5,
                        color: `rgba(${colorRgb},0.38)`,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: `rgba(${colorRgb},0.04)`,
                        border: `1px dashed rgba(${colorRgb},0.18)`,
                        fontStyle: "italic",
                    }}
                >
                    Sin señales claras en esta ventana.
                </div>
            ) : (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                    {items.map((it, i) => (
                        <div
                            key={i}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: `rgba(${colorRgb},0.06)`,
                                border: `1px solid rgba(${colorRgb},0.22)`,
                            }}
                        >
                            {it.nombre && (
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: 500,
                                        color,
                                        marginBottom: it.descripcion ? 4 : 0,
                                    }}
                                >
                                    {it.nombre}
                                </div>
                            )}
                            {it.descripcion && (
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        color: "rgba(232,238,247,0.72)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {it.descripcion}
                                </div>
                            )}
                            {it.cita && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        fontSize: 11,
                                        fontStyle: "italic",
                                        color: `rgba(${colorRgb},0.6)`,
                                        paddingLeft: 10,
                                        borderLeft: `2px solid rgba(${colorRgb},0.4)`,
                                    }}
                                >
                                    “{it.cita}”
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Panel lateral — histórico de un speaker a través de sesiones
   ════════════════════════════════════════════════════════════════ */
function PanelHistoricoNodo({
    speaker,
    sesionActiva,
    sesiones,
    aliases,
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
    onClose,
    onRefresh,
}: {
    speaker: string
    sesionActiva: Sesion
    sesiones: Sesion[]
    aliases: AliasNodo[]
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
    onClose: () => void
    onRefresh: () => void
}) {
    const topSpeakerIdActivo = useMemo(
        () => getTopSpeakerId(sesionActiva, aliases),
        [sesionActiva, aliases]
    )
    const resolvedActivo = resolveSpeaker(
        sesionActiva.id_sesion,
        speaker,
        aliases,
        topSpeakerIdActivo
    )
    const [nombreDraft, setNombreDraft] = useState<string>(
        resolvedActivo.esNamed ? resolvedActivo.displayName : ""
    )
    const [esHostDraft, setEsHostDraft] = useState<boolean>(resolvedActivo.esHost)
    const [guardando, setGuardando] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    const guardarNombre = useCallback(async () => {
        if (!clerkId) return
        const nombreClean = nombreDraft.trim()
        setGuardando(true)
        setMsg(null)
        const r = await sbRpc(
            supabaseUrl,
            supabaseAnonKey,
            "upsert_perfil_nodo_y_alias_admin",
            {
                p_clerk_id: clerkId,
                p_id_sesion: sesionActiva.id_sesion,
                p_speaker_id: speaker,
                p_nombre: nombreClean || null,
                p_eliminar: false,
                p_es_host: esHostDraft,
            }
        )
        setGuardando(false)
        if (r?.success) {
            setMsg(nombreClean ? "Perfil anclado" : "Perfil desasociado")
            onRefresh()
        } else {
            /* Log estructurado para que Diego pueda ver el error exacto
               en DevTools (tag [nodo-rename]). Si el RPC devolvió
               { error: 'not_admin' / 'missing_params' / ... } o null,
               acá quedó registrado. */
            console.error("[nodo-rename] falló", {
                response: r,
                payload: {
                    id_sesion: sesionActiva.id_sesion,
                    speaker_id: speaker,
                    nombre: nombreClean,
                    es_host: esHostDraft,
                },
            })
            const detalle =
                (r && typeof r === "object" && (r.error || r.detail)) ||
                "respuesta vacía"
            setMsg(`No pude guardar — ${detalle}`)
        }
    }, [
        clerkId,
        nombreDraft,
        esHostDraft,
        sesionActiva.id_sesion,
        speaker,
        supabaseUrl,
        supabaseAnonKey,
        onRefresh,
    ])

    const eliminarNodo = useCallback(async () => {
        if (!clerkId) return
        setGuardando(true)
        setMsg(null)
        const r = await sbRpc(
            supabaseUrl,
            supabaseAnonKey,
            "upsert_perfil_nodo_y_alias_admin",
            {
                p_clerk_id: clerkId,
                p_id_sesion: sesionActiva.id_sesion,
                p_speaker_id: speaker,
                p_nombre: null,
                p_eliminar: true,
            }
        )
        setGuardando(false)
        if (r?.success) {
            onRefresh()
            onClose()
        } else {
            setMsg("No pude eliminar — reintentá")
        }
    }, [
        clerkId,
        sesionActiva.id_sesion,
        speaker,
        supabaseUrl,
        supabaseAnonKey,
        onRefresh,
        onClose,
    ])

    /* v1.5 — Historial resuelto por PERFIL (no por speaker_id), cuando hay
       perfil anclado. Antes mezclaba datos de personas distintas que
       compartían el mismo speaker_id entre sesiones (Laura y Alejandra
       con el mismo "speaker_1" en dos sesiones diferentes). */
    const historial = useMemo(() => {
        if (resolvedActivo.perfilId) {
            const aliasesDelPerfil = aliases.filter(
                (a) =>
                    a.perfil_nodo_id === resolvedActivo.perfilId &&
                    !a.eliminado
            )
            const rows = sesiones.flatMap((s) => {
                const alias = aliasesDelPerfil.find(
                    (a) => a.id_sesion === s.id_sesion
                )
                if (!alias) return []
                const summary = s.speakers_summary?.[alias.speaker_id]
                if (!summary) return []
                return [
                    {
                        fecha: s.fecha,
                        summary,
                        speakerId: alias.speaker_id,
                        totalWords: Object.values(
                            s.speakers_summary || {}
                        ).reduce((acc, b) => acc + (b?.words || 0), 0),
                    },
                ]
            })
            return rows.slice(0, 5)
        }
        /* Sin perfil: solo la sesión activa (un único punto de trayectoria) */
        const sumActivo = sesionActiva.speakers_summary?.[speaker]
        if (!sumActivo) return []
        return [
            {
                fecha: sesionActiva.fecha,
                summary: sumActivo,
                speakerId: speaker,
                totalWords: Object.values(
                    sesionActiva.speakers_summary || {}
                ).reduce((acc, b) => acc + (b?.words || 0), 0),
            },
        ]
    }, [speaker, sesiones, sesionActiva, aliases, resolvedActivo.perfilId])

    const maxWords = Math.max(
        1,
        ...historial.map((h) => h.summary?.words || 0)
    )

    /* Todos los turnos del speaker en la sesión activa. Por defecto se
       muestran los primeros 5; el botón "Ver más" desbloquea el resto. */
    const [mostrarTodos, setMostrarTodos] = useState(false)
    const turnosTodos = useMemo(() => {
        const utts = sesionActiva.transcript_json?.utterances || []
        return utts
            .filter((u) => u.speaker === speaker && (u.text || "").trim())
            .map((u) => ({
                texto:
                    u.text.length > 420 ? u.text.slice(0, 420) + "…" : u.text,
                inicio: u.start,
            }))
    }, [sesionActiva, speaker])
    const turnosVisibles = mostrarTodos
        ? turnosTodos
        : turnosTodos.slice(0, 5)

    /* Cmd/Ctrl+Enter ancla el nombre; Esc cierra. El listener respeta
       el foco en este panel (no se activa en otros inputs globales). */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (
                e.key === "Enter" &&
                (e.metaKey || e.ctrlKey) &&
                !guardando
            ) {
                e.preventDefault()
                guardarNombre()
            }
            if (e.key === "Escape" && !guardando) {
                onClose()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [guardarNombre, guardando, onClose])

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 950,
                background: "rgba(2,5,12,0.78)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8vh 16px 4vh 16px",
                /* v1.8 — overflow hidden en el backdrop. El modal interno
                   ya gestiona su propio scroll con maxHeight 90vh; tener
                   overflowY:auto en el backdrop dibujaba una scrollbar
                   nativa adicional a la derecha del viewport. */
                overflow: "hidden",
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="obs-glass obs-node-panel"
                style={{
                    /* v1.7 — expandido de 560px → 820px para albergar la sección
                       de Destilación Profunda del Nodo (3 pilares × Gemini). En
                       móvil sigue respetando 96vw. */
                    width: "min(820px, 96vw)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    /* v1.8 — Scrollbar oculto cosmético. El scroll funciona
                       (gestos táctiles, rueda) pero no se dibuja la barra.
                       scrollbarWidth para Firefox; pseudo ::-webkit-scrollbar
                       en CSS inyectado abajo para WebKit. */
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    padding: "34px 32px 28px 32px",
                    borderRadius: 22,
                    border: "1.5px solid rgba(0,194,255,0.34)",
                    boxShadow:
                        "0 24px 80px rgba(0,194,255,0.10), 0 0 120px rgba(0,194,255,0.05)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 28,
                    }}
                >
                    <div>
                        <div className="obs-h-section">Trayectoria del Nodo</div>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 22,
                                fontWeight: 300,
                                letterSpacing: "0.04em",
                                color: "#E8EEF7",
                            }}
                        >
                            {resolvedActivo.displayName}
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                fontSize: 10.5,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: "rgba(180,200,220,0.45)",
                            }}
                        >
                            {formatSpeakerName(speaker)}
                            {resolvedActivo.eliminado ? " · residual" : ""}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "rgba(0,194,255,0.06)",
                            border: "1px solid rgba(0,194,255,0.22)",
                            color: "#00C2FF",
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            cursor: "pointer",
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Renombrar nodo + marcar como residual */}
                <div
                    style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        background:
                            "linear-gradient(135deg, rgba(5,15,30,0.55) 0%, rgba(2,8,20,0.72) 100%)",
                        border: "1px solid rgba(0,194,255,0.18)",
                        marginBottom: 18,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10.5,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(0,194,255,0.78)",
                            fontWeight: 500,
                        }}
                    >
                        Anclar identidad
                    </div>
                    <input
                        type="text"
                        value={nombreDraft}
                        onChange={(e) => setNombreDraft(e.target.value)}
                        placeholder="Ej. Laura, Daniel, Aqua'Riia..."
                        disabled={guardando}
                        style={{
                            width: "100%",
                            marginTop: 8,
                            padding: "10px 14px",
                            fontSize: 14,
                            background: "rgba(0,0,0,0.32)",
                            border: "1px solid rgba(0,194,255,0.28)",
                            borderRadius: 10,
                            color: "#E8EEF7",
                            fontFamily: "'Inter', sans-serif",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    <div
                        className="obs-text-muted"
                        style={{ marginTop: 8, fontSize: 10.5 }}
                    >
                        Si el nombre ya existe en otra sesión, se consolida al
                        mismo perfil. Dejalo vacío para volver al nombre
                        genérico.
                    </div>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginTop: 14,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, rgba(200,164,78,0.06) 0%, rgba(140,100,40,0.08) 100%)",
                            border: "1px solid rgba(200,164,78,0.22)",
                            cursor: guardando ? "not-allowed" : "pointer",
                            opacity: guardando ? 0.5 : 1,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={esHostDraft}
                            onChange={(e) => setEsHostDraft(e.target.checked)}
                            disabled={guardando}
                            style={{
                                width: 16,
                                height: 16,
                                accentColor: "#D4A843",
                                cursor: "inherit",
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: "#D4A843",
                                }}
                            >
                                Es Zak'Haar · anfitrión
                            </div>
                            <div
                                className="obs-text-muted"
                                style={{ fontSize: 10.5, marginTop: 2 }}
                            >
                                Se pinta dorado en la Trayectoria aunque el
                                nombre anclado sea otro.
                            </div>
                        </div>
                    </label>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            onClick={guardarNombre}
                            disabled={guardando}
                            style={{
                                all: "unset",
                                cursor: guardando ? "not-allowed" : "pointer",
                                padding: "9px 18px",
                                borderRadius: 10,
                                background:
                                    "linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%)",
                                color: "#0B0C13",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                boxShadow: "0 3px 14px rgba(200,164,78,0.22)",
                                opacity: guardando ? 0.5 : 1,
                            }}
                        >
                            {guardando ? "Anclando..." : "Anclar"}
                        </button>
                        <button
                            type="button"
                            onClick={eliminarNodo}
                            disabled={guardando}
                            title="Marcar como residual (se esconde de la trayectoria)"
                            style={{
                                all: "unset",
                                cursor: guardando ? "not-allowed" : "pointer",
                                padding: "9px 18px",
                                borderRadius: 10,
                                background: "rgba(232,238,247,0.04)",
                                border: "1px solid rgba(232,238,247,0.22)",
                                color: "rgba(232,238,247,0.72)",
                                fontSize: 11,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                opacity: guardando ? 0.5 : 1,
                            }}
                        >
                            Eliminar residual
                        </button>
                    </div>
                    {msg && (
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 11,
                                color: "rgba(212,168,67,0.88)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            {msg}
                        </div>
                    )}
                </div>

                {/* v1.7 — Destilación Profunda del Nodo. Solo se muestra
                    cuando hay perfil anclado (no tiene sentido destilar un
                    speaker sin identidad consolidada). */}
                {resolvedActivo.perfilId && (
                    <SeccionDestilacionNodo
                        perfilId={resolvedActivo.perfilId}
                        displayName={resolvedActivo.displayName}
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkId={clerkId}
                    />
                )}

                {/* Turnos iniciales del speaker — útil para identificar quién
                    es antes de anclar el nombre. */}
                {turnosTodos.length > 0 && (
                    <div
                        style={{
                            marginBottom: 22,
                            padding: "14px 18px",
                            borderRadius: 14,
                            background: "rgba(0,0,0,0.28)",
                            border: "1px solid rgba(232,238,247,0.12)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 10.5,
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase",
                                    color: "rgba(200,215,235,0.72)",
                                    fontWeight: 500,
                                }}
                            >
                                Escuchá su voz ·{" "}
                                {mostrarTodos
                                    ? `${turnosTodos.length} turnos`
                                    : "primeros turnos"}
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    letterSpacing: "0.08em",
                                    color: "rgba(180,200,220,0.45)",
                                    fontFamily: "monospace",
                                }}
                            >
                                {mostrarTodos
                                    ? `${turnosTodos.length}/${turnosTodos.length}`
                                    : `${Math.min(5, turnosTodos.length)}/${turnosTodos.length}`}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                maxHeight: mostrarTodos ? 420 : 220,
                                overflowY: "auto",
                                transition: "max-height 0.3s ease",
                            }}
                        >
                            {turnosVisibles.map((t, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "9px 12px",
                                        borderRadius: 9,
                                        background: "rgba(0,194,255,0.04)",
                                        border: "1px solid rgba(0,194,255,0.10)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 9.5,
                                            letterSpacing: "0.14em",
                                            color: "rgba(0,194,255,0.65)",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        {formatMinutes(t.inicio)}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 4,
                                            fontSize: 12,
                                            lineHeight: 1.52,
                                            color: "rgba(232,238,247,0.82)",
                                        }}
                                    >
                                        «{t.texto}»
                                    </div>
                                </div>
                            ))}
                        </div>
                        {turnosTodos.length > 5 && (
                            <button
                                type="button"
                                onClick={() => setMostrarTodos((v) => !v)}
                                style={{
                                    all: "unset",
                                    cursor: "pointer",
                                    marginTop: 10,
                                    width: "100%",
                                    textAlign: "center",
                                    padding: "8px 0",
                                    borderRadius: 9,
                                    border: "1px dashed rgba(0,194,255,0.28)",
                                    color: "rgba(0,194,255,0.82)",
                                    fontSize: 10.5,
                                    letterSpacing: "0.20em",
                                    textTransform: "uppercase",
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    transition: "all 0.25s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        "rgba(0,194,255,0.05)"
                                    e.currentTarget.style.borderColor =
                                        "rgba(0,194,255,0.52)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        "transparent"
                                    e.currentTarget.style.borderColor =
                                        "rgba(0,194,255,0.28)"
                                }}
                            >
                                {mostrarTodos
                                    ? "Mostrar solo primeros 5"
                                    : `Ver los ${turnosTodos.length - 5} turnos restantes`}
                            </button>
                        )}
                    </div>
                )}

                {historial.length === 0 && (
                    <div className="obs-text-muted" style={{ marginTop: 20 }}>
                        Este nodo todavía no tiene trayectoria ancla en la
                        Cámara Solar.
                    </div>
                )}

                {historial.map((h, i) => {
                    const pct = ((h.summary.words || 0) / maxWords) * 100
                    const sharePct =
                        h.totalWords > 0
                            ? ((h.summary.words || 0) / h.totalWords) * 100
                            : 0
                    return (
                        <div
                            key={i}
                            className="obs-glass"
                            style={{
                                padding: "18px 20px",
                                marginBottom: 14,
                                borderRadius: 14,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "rgba(0,194,255,0.82)",
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {formatDate(h.fecha)}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(180,200,220,0.55)",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {sharePct.toFixed(1)}% del campo
                                </div>
                            </div>
                            <div
                                style={{
                                    height: 6,
                                    background: "rgba(0,194,255,0.08)",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    marginTop: 10,
                                }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    style={{
                                        height: "100%",
                                        background:
                                            "linear-gradient(90deg, #00C2FF 0%, rgba(0,194,255,0.4) 100%)",
                                        borderRadius: 4,
                                        boxShadow: "0 0 10px rgba(0,194,255,0.35)",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 18,
                                    marginTop: 12,
                                    fontSize: 11,
                                    color: "rgba(220,230,245,0.65)",
                                }}
                            >
                                <span>{h.summary.words.toLocaleString()} palabras</span>
                                <span>{h.summary.turns} turnos</span>
                                <span>{formatMinutes(h.summary.seconds || 0)}</span>
                            </div>
                        </div>
                    )
                })}
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ════════════════════════════════════════════════════════════════
   Panel de Upload Manual — Arquitecto pega transcript + sello + fecha
   ════════════════════════════════════════════════════════════════ */
function PanelUploadManual({
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
    onCerrar,
    onAnclado,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
    onCerrar: () => void
    onAnclado: () => void
}) {
    const [fecha, setFecha] = useState<string>(() => {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, "0")
        const d = String(now.getDate()).padStart(2, "0")
        return `${y}-${m}-${d}`
    })
    const [etiqueta, setEtiqueta] = useState("")
    const [transcript, setTranscript] = useState("")
    const [sello, setSello] = useState("")
    const [pdfUrl, setPdfUrl] = useState("")
    const [duracion, setDuracion] = useState("")
    const [subiendo, setSubiendo] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [ok, setOk] = useState(false)

    const preview = useMemo(() => {
        return parseTranscriptManual(transcript)
    }, [transcript])

    const sellar = useCallback(async () => {
        if (!clerkId) return
        if (!transcript.trim()) {
            setError("Pegá la transcripción antes de anclar.")
            return
        }
        setSubiendo(true)
        setError(null)

        const idSesionBase = fecha
        const idSesion = etiqueta.trim()
            ? `${idSesionBase}_${slugify(etiqueta)}`
            : idSesionBase

        const { utterances, speakersSummary, totalPalabras } = preview

        const payload = {
            p_clerk_id: clerkId,
            p_id_sesion: idSesion,
            p_fecha: fecha,
            p_transcript_json: {
                utterances,
                text: transcript.trim(),
            },
            p_pdf_url: pdfUrl.trim() || null,
            p_sello_text: sello.trim() || null,
            p_speakers_summary: speakersSummary,
            p_duracion_minutos: duracion.trim()
                ? parseInt(duracion, 10) || null
                : null,
            p_total_palabras: totalPalabras || null,
        }

        const r = await sbRpc(
            supabaseUrl,
            supabaseAnonKey,
            "upsert_telemetria_camara_admin",
            payload
        )

        setSubiendo(false)

        if (r?.success) {
            setOk(true)
            setTimeout(() => {
                onAnclado()
                onCerrar()
            }, 900)
        } else {
            setError(
                r?.error === "not_admin"
                    ? "Solo un Arquitecto puede anclar transcripciones."
                    : r?.error === "missing_params"
                    ? "Faltan datos obligatorios (fecha o transcripción)."
                    : "No pude anclar la transcripción. Revisá la conexión."
            )
        }
    }, [
        clerkId,
        fecha,
        etiqueta,
        transcript,
        sello,
        pdfUrl,
        duracion,
        preview,
        supabaseUrl,
        supabaseAnonKey,
        onAnclado,
        onCerrar,
    ])

    /* Atajo Cmd/Ctrl+Enter dispara el anclaje; Esc cierra.
       Los atajos quedan activos incluso con foco en un textarea. */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (
                e.key === "Enter" &&
                (e.metaKey || e.ctrlKey) &&
                !subiendo &&
                transcript.trim()
            ) {
                e.preventDefault()
                sellar()
            }
            if (e.key === "Escape" && !subiendo) {
                onCerrar()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [subiendo, transcript, sellar, onCerrar])

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 955,
                background: "rgba(2,5,12,0.74)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                justifyContent: "flex-end",
            }}
            onClick={onCerrar}
        >
            <motion.div
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="obs-glass"
                style={{
                    width: "min(680px, 96vw)",
                    height: "100vh",
                    overflowY: "auto",
                    /* v1.3 — padding top 74px para no chocar con el Auth Header. */
                    padding: "74px 36px 40px 36px",
                    borderRadius: 0,
                    borderLeft: "1.5px solid rgba(0,194,255,0.32)",
                    borderTop: "none",
                    borderRight: "none",
                    borderBottom: "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 26,
                    }}
                >
                    <div>
                        <div className="obs-h-section">
                            Anclar transcripción manual
                        </div>
                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 22,
                                fontWeight: 300,
                                color: "#E8EEF7",
                                letterSpacing: "0.01em",
                            }}
                        >
                            Cámara Solar · ingreso directo
                        </div>
                        <div
                            className="obs-text-muted"
                            style={{
                                marginTop: 8,
                                maxWidth: 520,
                                lineHeight: 1.56,
                            }}
                        >
                            Para sesiones pasadas sin pipeline. Pegá la
                            transcripción cruda; si trae encabezados tipo
                            "Speaker 0:" los detecto y ancla la diarización.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        style={{
                            background: "rgba(0,194,255,0.06)",
                            border: "1px solid rgba(0,194,255,0.22)",
                            color: "#00C2FF",
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            cursor: "pointer",
                            fontSize: 16,
                            flexShrink: 0,
                        }}
                    >
                        ×
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                        marginBottom: 18,
                    }}
                >
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(0,194,255,0.78)",
                                fontWeight: 500,
                            }}
                        >
                            Fecha de la sesión
                        </span>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            style={{
                                padding: "10px 14px",
                                fontSize: 14,
                                background: "rgba(0,0,0,0.28)",
                                border: "1px solid rgba(0,194,255,0.28)",
                                borderRadius: 10,
                                color: "#E8EEF7",
                                fontFamily: "'Inter', sans-serif",
                                outline: "none",
                                colorScheme: "dark",
                            }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(0,194,255,0.78)",
                                fontWeight: 500,
                            }}
                        >
                            Etiqueta (opcional)
                        </span>
                        <input
                            type="text"
                            value={etiqueta}
                            onChange={(e) => setEtiqueta(e.target.value)}
                            placeholder="Ej. sesion_ignicion"
                            style={{
                                padding: "10px 14px",
                                fontSize: 14,
                                background: "rgba(0,0,0,0.28)",
                                border: "1px solid rgba(232,238,247,0.18)",
                                borderRadius: 10,
                                color: "#E8EEF7",
                                fontFamily: "'Inter', sans-serif",
                                outline: "none",
                            }}
                        />
                    </label>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                        marginBottom: 18,
                    }}
                >
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(232,238,247,0.60)",
                                fontWeight: 500,
                            }}
                        >
                            Duración en minutos (opcional)
                        </span>
                        <input
                            type="number"
                            value={duracion}
                            onChange={(e) => setDuracion(e.target.value)}
                            placeholder="60"
                            style={{
                                padding: "10px 14px",
                                fontSize: 14,
                                background: "rgba(0,0,0,0.28)",
                                border: "1px solid rgba(232,238,247,0.18)",
                                borderRadius: 10,
                                color: "#E8EEF7",
                                fontFamily: "'Inter', sans-serif",
                                outline: "none",
                            }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(232,238,247,0.60)",
                                fontWeight: 500,
                            }}
                        >
                            URL del PDF sellado (opcional)
                        </span>
                        <input
                            type="url"
                            value={pdfUrl}
                            onChange={(e) => setPdfUrl(e.target.value)}
                            placeholder="https://pub-...r2.dev/Sello_..."
                            style={{
                                padding: "10px 14px",
                                fontSize: 14,
                                background: "rgba(0,0,0,0.28)",
                                border: "1px solid rgba(232,238,247,0.18)",
                                borderRadius: 10,
                                color: "#E8EEF7",
                                fontFamily: "'Inter', sans-serif",
                                outline: "none",
                            }}
                        />
                    </label>
                </div>

                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 18,
                    }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(0,194,255,0.78)",
                            fontWeight: 500,
                        }}
                    >
                        Transcripción · obligatorio
                    </span>
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        rows={10}
                        placeholder="Speaker 0: hola, comencemos la sesión...&#10;Speaker 1: gracias por recibirnos..."
                        style={{
                            padding: "14px 16px",
                            fontSize: 13.5,
                            lineHeight: 1.62,
                            background: "rgba(0,0,0,0.32)",
                            border: "1px solid rgba(0,194,255,0.28)",
                            borderRadius: 12,
                            color: "#E8EEF7",
                            fontFamily: "'Inter', sans-serif",
                            outline: "none",
                            resize: "none",
                            height: 260,
                            overflowY: "auto",
                            boxSizing: "border-box",
                        }}
                    />
                    {transcript.trim() && (
                        <div
                            style={{
                                marginTop: 4,
                                fontSize: 10.5,
                                letterSpacing: "0.14em",
                                color: "rgba(212,168,67,0.85)",
                            }}
                        >
                            {preview.utterances.length} turnos ·{" "}
                            {Object.keys(preview.speakersSummary).length} nodos ·{" "}
                            {preview.totalPalabras.toLocaleString()} palabras
                        </div>
                    )}
                </label>

                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 24,
                    }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(212,168,67,0.85)",
                            fontWeight: 500,
                        }}
                    >
                        Sello destilado · opcional
                    </span>
                    <textarea
                        value={sello}
                        onChange={(e) => setSello(e.target.value)}
                        rows={7}
                        placeholder={`SELLO DE INTEGRACIÓN SOLAR&#10;&#10;EL PULSO CENTRAL&#10;(La Frecuencia Maestra)&#10;Un párrafo...&#10;&#10;CÓDIGOS DESPLEGADOS&#10;...`}
                        style={{
                            padding: "14px 16px",
                            fontSize: 13.5,
                            lineHeight: 1.62,
                            background: "rgba(0,0,0,0.32)",
                            border: "1px solid rgba(200,164,78,0.28)",
                            borderRadius: 12,
                            color: "#ECD8A8",
                            fontFamily: "'Inter', sans-serif",
                            outline: "none",
                            resize: "none",
                            height: 200,
                            overflowY: "auto",
                            boxSizing: "border-box",
                        }}
                    />
                    <span
                        style={{
                            fontSize: 11,
                            color: "rgba(180,200,220,0.52)",
                            lineHeight: 1.5,
                        }}
                    >
                        Si pegás el sello, el Observatorio lo parsea y puebla el
                        Pulso Central, las Resonancias, las Fricciones y la
                        Proyección. Si lo dejás vacío, la sesión se ancla pero
                        sin bloques de lectura.
                    </span>
                </label>

                {error && (
                    <div
                        style={{
                            padding: "10px 14px",
                            marginBottom: 14,
                            borderRadius: 10,
                            background: "rgba(255,180,120,0.06)",
                            border: "1px solid rgba(255,180,120,0.26)",
                            color: "rgba(255,200,140,0.92)",
                            fontSize: 12.5,
                        }}
                    >
                        {error}
                    </div>
                )}

                {ok && (
                    <div
                        style={{
                            padding: "10px 14px",
                            marginBottom: 14,
                            borderRadius: 10,
                            background: "rgba(200,164,78,0.10)",
                            border: "1px solid rgba(200,164,78,0.32)",
                            color: "#ECD8A8",
                            fontSize: 12.5,
                            textAlign: "center",
                        }}
                    >
                        Transcripción anclada · el Observatorio se está
                        refrescando.
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={subiendo}
                        style={{
                            all: "unset",
                            cursor: subiendo ? "not-allowed" : "pointer",
                            padding: "11px 22px",
                            borderRadius: 10,
                            border: "1px solid rgba(232,238,247,0.22)",
                            background: "rgba(232,238,247,0.04)",
                            color: "rgba(232,238,247,0.72)",
                            fontSize: 12,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            opacity: subiendo ? 0.5 : 1,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={sellar}
                        disabled={subiendo || !transcript.trim()}
                        style={{
                            all: "unset",
                            cursor:
                                subiendo || !transcript.trim()
                                    ? "not-allowed"
                                    : "pointer",
                            padding: "11px 30px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%)",
                            color: "#0B0C13",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            boxShadow: "0 4px 20px rgba(200,164,78,0.28)",
                            opacity:
                                subiendo || !transcript.trim() ? 0.5 : 1,
                        }}
                    >
                        {subiendo ? "Anclando..." : "Anclar transcripción"}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ════════════════════════════════════════════════════════════════
   Mapa Térmico — Pulso · Resonancias · Fricciones
   ════════════════════════════════════════════════════════════════ */
function MapaTermico({ sello }: { sello: ParsedSello }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {sello.pulso && (
                <div className="obs-glass-gold" style={{ padding: 32 }}>
                    <div className="obs-shimmer" />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div className="obs-h-section-gold">El Pulso Central</div>
                        <div
                            style={{
                                marginTop: 16,
                                fontSize: 17,
                                fontWeight: 300,
                                lineHeight: 1.62,
                                color: "rgba(236,216,168,0.92)",
                                letterSpacing: "0.012em",
                            }}
                        >
                            {sello.pulso}
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 24,
                }}
                className="obs-macro-grid"
            >
                {/* Altas Resonancias */}
                <div
                    className="obs-glass-gold"
                    style={{ padding: 26, minHeight: 240 }}
                >
                    <div className="obs-shimmer" />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <div className="obs-h-section-gold">
                                Altas Resonancias
                            </div>
                            <span className="obs-chip obs-chip-gold">
                                {sello.codigos.length} códigos
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                            {sello.codigos.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background:
                                            "linear-gradient(135deg, rgba(200,164,78,0.06) 0%, rgba(200,164,78,0.02) 100%)",
                                        border: "1px solid rgba(200,164,78,0.22)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "#D4A843",
                                                fontSize: 14,
                                            }}
                                        >
                                            ✧
                                        </span>
                                        {c.title && (
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    color: "#ECD8A8",
                                                    fontWeight: 500,
                                                    letterSpacing: "0.02em",
                                                }}
                                            >
                                                {c.title}
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12.5,
                                            lineHeight: 1.58,
                                            color: "rgba(232,238,247,0.72)",
                                        }}
                                    >
                                        {c.body}
                                    </div>
                                </div>
                            ))}
                            {sello.codigos.length === 0 && (
                                <div className="obs-text-muted">
                                    Sin códigos ancla en esta sesión.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fricciones detectadas */}
                <div
                    className="obs-glass-platinum"
                    style={{ padding: 26, minHeight: 240 }}
                >
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <div
                                className="obs-h-section"
                                style={{ color: "rgba(232,238,247,0.72)" }}
                            >
                                Fricciones Detectadas
                            </div>
                            <span
                                className="obs-chip"
                                style={{
                                    background: "rgba(232,238,247,0.06)",
                                    borderColor: "rgba(232,238,247,0.24)",
                                    color: "rgba(232,238,247,0.78)",
                                }}
                            >
                                {sello.correcciones.length}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 18,
                            }}
                        >
                            {sello.correcciones.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background:
                                            "linear-gradient(135deg, rgba(232,238,247,0.04) 0%, rgba(180,200,220,0.02) 100%)",
                                        border: "1px solid rgba(232,238,247,0.14)",
                                    }}
                                >
                                    {c.distorsion && (
                                        <>
                                            <div
                                                style={{
                                                    fontSize: 10.5,
                                                    letterSpacing: "0.22em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(200,215,235,0.55)",
                                                }}
                                            >
                                                Distorsión en la malla
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 12.5,
                                                    lineHeight: 1.58,
                                                    color: "rgba(232,238,247,0.82)",
                                                }}
                                            >
                                                {c.distorsion}
                                            </div>
                                        </>
                                    )}
                                    {c.correccion && (
                                        <>
                                            <div
                                                style={{
                                                    marginTop: 12,
                                                    fontSize: 10.5,
                                                    letterSpacing: "0.22em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(0,194,255,0.68)",
                                                }}
                                            >
                                                Corrección ancla
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 12.5,
                                                    lineHeight: 1.58,
                                                    color: "rgba(200,230,255,0.88)",
                                                }}
                                            >
                                                {c.correccion}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {sello.correcciones.length === 0 && (
                                <div className="obs-text-muted">
                                    El campo grupal viajó sin distorsiones detectadas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Modal · Análisis Profundo (Gemini 3.1 Pro cross-session)
   ════════════════════════════════════════════════════════════════ */
interface ProyeccionIA {
    tema_sugerido?: string
    sintesis_corriente?: string
    fricciones_persistentes?: { nombre: string; descripcion: string }[]
    codigos_consolidados?: string[]
    comando_proxima_sesion?: { titulo: string; instruccion: string }
    advertencia_vibracional?: string | null
}
interface AnalisisResponse {
    success: boolean
    n_sesiones?: number
    fechas?: string[]
    proyeccion?: ProyeccionIA
    usage?: {
        prompt_tokens?: number | null
        completion_tokens?: number | null
        total_tokens?: number | null
    }
    error?: string
    detail?: string
}

function ModalAnalisisProfundo({
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
    n,
    preloaded,
    onCerrar,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
    n: number
    preloaded?: AnalisisResponse | null
    onCerrar: () => void
}) {
    /* Si viene preloaded (click en una tarjeta histórica), arrancamos
       con esa data y sin loader. Si no, hacemos fetch nuevo a la edge
       function. */
    const [loading, setLoading] = useState(!preloaded)
    const [data, setData] = useState<AnalisisResponse | null>(
        preloaded || null
    )
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (preloaded) return
        let cancelled = false
        ;(async () => {
            if (!clerkId) {
                setError("Sin sesión de Arquitecto.")
                setLoading(false)
                return
            }
            try {
                const url = `${supabaseUrl}/functions/v1/analisis-profundo-sprint`
                const r = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${supabaseAnonKey}`,
                        apikey: supabaseAnonKey,
                    },
                    body: JSON.stringify({
                        clerk_user_id: clerkId,
                        token: await (window as any).Clerk?.session?.getToken?.(),
                        n,
                    }),
                })
                const j = (await r.json()) as AnalisisResponse
                if (cancelled) return
                if (!r.ok || !j.success) {
                    setError(
                        j.detail ||
                            j.error ||
                            "No pude obtener el análisis — revisá la consola."
                    )
                } else {
                    setData(j)
                }
            } catch (e: any) {
                if (!cancelled) setError(String(e?.message || e))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkId, supabaseUrl, supabaseAnonKey, n, preloaded])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCerrar()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onCerrar])

    const p = data?.proyeccion || {}

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 960,
                background: "rgba(2,5,12,0.82)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4vh 16px",
                overflowY: "auto",
            }}
            onClick={onCerrar}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="obs-glass-gold"
                style={{
                    width: "min(820px, 95vw)",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    padding: "40px 40px 32px 40px",
                    borderRadius: 22,
                    boxShadow:
                        "0 28px 80px rgba(200,164,78,0.18), 0 0 140px rgba(200,164,78,0.06)",
                }}
            >
                <div className="obs-shimmer" />
                <div style={{ position: "relative", zIndex: 2 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 18,
                        }}
                    >
                        <div>
                            <div
                                className="obs-h-section-gold"
                                style={{ letterSpacing: "0.34em" }}
                            >
                                Síntesis autónoma · Sexta Densidad
                            </div>
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 24,
                                    fontWeight: 300,
                                    color: "#ECD8A8",
                                    letterSpacing: "0.01em",
                                    textShadow: "0 0 14px rgba(200,164,78,0.24)",
                                }}
                            >
                                Análisis Profundo del Sprint
                            </div>
                            {data?.fechas && data.fechas.length > 0 && (
                                <div
                                    className="obs-text-muted"
                                    style={{ marginTop: 6, fontSize: 11.5 }}
                                >
                                    {data.n_sesiones} sesiones cruzadas ·{" "}
                                    {data.fechas
                                        .map((f) => formatDate(f))
                                        .join(" · ")}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onCerrar}
                            style={{
                                background: "rgba(200,164,78,0.08)",
                                border: "1px solid rgba(200,164,78,0.32)",
                                color: "#D4A843",
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                cursor: "pointer",
                                fontSize: 16,
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {loading && (
                        <div
                            style={{
                                padding: "80px 20px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    border: "2px solid rgba(212,168,67,0.15)",
                                    borderTopColor: "rgba(212,168,67,0.85)",
                                    margin: "0 auto 18px",
                                    animation: "obs-spin 1.1s linear infinite",
                                }}
                            />
                            <div className="obs-h-section-gold">
                                Procesando geometría cross-session
                            </div>
                            <div
                                className="obs-text-muted"
                                style={{ marginTop: 10, maxWidth: 420, margin: "10px auto 0" }}
                            >
                                Gemini 3.1 Pro está cruzando los últimos sellos
                                + transcripciones. Suele tardar 30-90 segundos.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                padding: "18px 22px",
                                borderRadius: 12,
                                background: "rgba(255,180,120,0.08)",
                                border: "1px solid rgba(255,180,120,0.32)",
                                color: "rgba(255,200,140,0.92)",
                                fontSize: 13,
                                lineHeight: 1.6,
                            }}
                        >
                            <strong>No pude proyectar:</strong> {error}
                        </div>
                    )}

                    {!loading && !error && data?.success && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 20,
                                marginTop: 14,
                            }}
                        >
                            {p.tema_sugerido && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            letterSpacing: "0.28em",
                                            textTransform: "uppercase",
                                            color: "rgba(212,168,67,0.82)",
                                        }}
                                    >
                                        Tema sugerido · frecuencia ancla
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 24,
                                            fontWeight: 400,
                                            lineHeight: 1.36,
                                            color: "#F5E5C4",
                                            letterSpacing: "0.01em",
                                        }}
                                    >
                                        {p.tema_sugerido}
                                    </div>
                                </div>
                            )}

                            {p.sintesis_corriente && (
                                <div
                                    style={{
                                        padding: "18px 22px",
                                        borderRadius: 14,
                                        background:
                                            "linear-gradient(135deg, rgba(5,15,30,0.55) 0%, rgba(2,8,20,0.72) 100%)",
                                        border: "1px solid rgba(232,238,247,0.14)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            letterSpacing: "0.24em",
                                            textTransform: "uppercase",
                                            color: "rgba(0,194,255,0.78)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Síntesis de la corriente
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 14.5,
                                            fontWeight: 300,
                                            lineHeight: 1.68,
                                            color: "rgba(232,238,247,0.88)",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {p.sintesis_corriente}
                                    </div>
                                </div>
                            )}

                            {p.fricciones_persistentes &&
                                p.fricciones_persistentes.length > 0 && (
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10.5,
                                                letterSpacing: "0.24em",
                                                textTransform: "uppercase",
                                                color: "rgba(232,238,247,0.72)",
                                                fontWeight: 500,
                                                marginBottom: 10,
                                            }}
                                        >
                                            Fricciones persistentes en la malla
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                            }}
                                        >
                                            {p.fricciones_persistentes.map(
                                                (f, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            padding: "14px 18px",
                                                            borderRadius: 12,
                                                            background:
                                                                "linear-gradient(135deg, rgba(232,238,247,0.04) 0%, rgba(180,200,220,0.02) 100%)",
                                                            border: "1px solid rgba(232,238,247,0.14)",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 13,
                                                                fontWeight: 500,
                                                                color: "rgba(200,230,255,0.92)",
                                                                letterSpacing: "0.01em",
                                                            }}
                                                        >
                                                            ◇ {f.nombre}
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop: 4,
                                                                fontSize: 12.5,
                                                                lineHeight: 1.6,
                                                                color: "rgba(232,238,247,0.72)",
                                                            }}
                                                        >
                                                            {f.descripcion}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {p.codigos_consolidados &&
                                p.codigos_consolidados.length > 0 && (
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10.5,
                                                letterSpacing: "0.24em",
                                                textTransform: "uppercase",
                                                color: "rgba(212,168,67,0.82)",
                                                fontWeight: 500,
                                                marginBottom: 10,
                                            }}
                                        >
                                            Códigos consolidados
                                        </div>
                                        <ul
                                            style={{
                                                margin: 0,
                                                padding: 0,
                                                listStyle: "none",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                            }}
                                        >
                                            {p.codigos_consolidados.map(
                                                (c, i) => (
                                                    <li
                                                        key={i}
                                                        style={{
                                                            padding: "10px 14px",
                                                            borderRadius: 10,
                                                            background:
                                                                "linear-gradient(135deg, rgba(200,164,78,0.06) 0%, rgba(200,164,78,0.02) 100%)",
                                                            border: "1px solid rgba(200,164,78,0.22)",
                                                            fontSize: 13,
                                                            lineHeight: 1.56,
                                                            color: "#ECD8A8",
                                                            display: "flex",
                                                            gap: 10,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: "#D4A843",
                                                            }}
                                                        >
                                                            ✧
                                                        </span>
                                                        <span>{c}</span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}

                            {p.comando_proxima_sesion && (
                                <div
                                    style={{
                                        padding: "20px 24px",
                                        borderRadius: 14,
                                        background:
                                            "linear-gradient(135deg, rgba(200,164,78,0.14) 0%, rgba(140,100,40,0.12) 100%)",
                                        border: "1.5px solid rgba(200,164,78,0.42)",
                                        boxShadow:
                                            "0 0 30px rgba(200,164,78,0.10), inset 0 0 20px rgba(200,164,78,0.05)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            letterSpacing: "0.28em",
                                            textTransform: "uppercase",
                                            color: "rgba(212,168,67,0.95)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Comando de la próxima transmisión
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 17,
                                            fontWeight: 500,
                                            color: "#F5E5C4",
                                            letterSpacing: "0.01em",
                                        }}
                                    >
                                        {p.comando_proxima_sesion.titulo}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 14,
                                            lineHeight: 1.68,
                                            color: "rgba(232,238,247,0.90)",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {p.comando_proxima_sesion.instruccion}
                                    </div>
                                </div>
                            )}

                            {p.advertencia_vibracional && (
                                <div
                                    style={{
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background: "rgba(255,180,120,0.06)",
                                        border: "1px dashed rgba(255,180,120,0.36)",
                                        color: "rgba(255,214,166,0.94)",
                                        fontSize: 12.5,
                                        lineHeight: 1.56,
                                    }}
                                >
                                    <strong
                                        style={{
                                            letterSpacing: "0.2em",
                                            textTransform: "uppercase",
                                            fontSize: 10.5,
                                            color: "rgba(255,214,166,0.78)",
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Advertencia vibracional
                                    </strong>
                                    {p.advertencia_vibracional}
                                </div>
                            )}

                            {data.usage && (
                                <div
                                    className="obs-text-muted"
                                    style={{
                                        marginTop: 8,
                                        fontSize: 10.5,
                                        textAlign: "right",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Telemetría IA · in: {data.usage.prompt_tokens ?? "?"}
                                    {" · out: "}{data.usage.completion_tokens ?? "?"}
                                    {" · total: "}{data.usage.total_tokens ?? "?"} tokens
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ════════════════════════════════════════════════════════════════
   Histórico de Análisis Profundos · grid clickeable al pie del Macro.
   Cada tarjeta reabre el modal con la data ya guardada (sin gastar
   otra llamada a Gemini).
   ════════════════════════════════════════════════════════════════ */
function HistoricoAnalisisGrid({
    historicos,
    onAbrir,
}: {
    historicos: any[]
    onAbrir: (row: any) => void
}) {
    return (
        <div
            className="obs-glass"
            style={{ padding: 28, position: "relative", overflow: "hidden" }}
        >
            <div style={{ position: "relative", zIndex: 2 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div className="obs-h-section">
                        Análisis profundos anteriores
                    </div>
                    <span className="obs-chip">
                        {historicos.length}{" "}
                        {historicos.length === 1 ? "tirada" : "tiradas"}
                    </span>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(230px, 1fr))",
                        gap: 12,
                    }}
                >
                    {historicos.map((h) => {
                        const p = h.proyeccion || {}
                        const tema =
                            p.tema_sugerido ||
                            p.comando_proxima_sesion?.titulo ||
                            "Proyección sin tema"
                        const fechaLabel = (() => {
                            try {
                                return new Date(h.created_at).toLocaleDateString(
                                    "es-MX",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        year:
                                            new Date().getFullYear() !==
                                            new Date(h.created_at).getFullYear()
                                                ? "numeric"
                                                : undefined,
                                    }
                                )
                            } catch {
                                return h.created_at?.slice(0, 10) || "—"
                            }
                        })()
                        return (
                            <button
                                key={h.id}
                                type="button"
                                onClick={() => onAbrir(h)}
                                style={{
                                    all: "unset",
                                    cursor: "pointer",
                                    padding: "16px 18px",
                                    borderRadius: 14,
                                    background:
                                        "linear-gradient(135deg, rgba(200,164,78,0.04) 0%, rgba(140,100,40,0.06) 100%)",
                                    border: "1px solid rgba(200,164,78,0.26)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "rgba(200,164,78,0.55)"
                                    e.currentTarget.style.boxShadow =
                                        "0 0 22px rgba(200,164,78,0.14), inset 0 0 14px rgba(200,164,78,0.04)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "rgba(200,164,78,0.26)"
                                    e.currentTarget.style.boxShadow = "none"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "baseline",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 10,
                                            letterSpacing: "0.22em",
                                            textTransform: "uppercase",
                                            color: "rgba(212,168,67,0.82)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        ✦ {fechaLabel}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9.5,
                                            letterSpacing: "0.12em",
                                            color: "rgba(180,200,220,0.45)",
                                        }}
                                    >
                                        {h.n_sesiones || 0}×
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 400,
                                        lineHeight: 1.4,
                                        color: "#ECD8A8",
                                        letterSpacing: "0.01em",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {tema}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Proyección del Sprint
   ════════════════════════════════════════════════════════════════ */
function ProyeccionSprint({
    sello,
    onSolicitarAnalisis,
}: {
    sello: ParsedSello
    onSolicitarAnalisis?: () => void
}) {
    if (!sello.protocolo && sello.codigos.length === 0 && sello.correcciones.length === 0) {
        return (
            <div className="obs-glass" style={{ padding: 28 }}>
                <div className="obs-h-section">Proyección del Próximo Sprint</div>
                <div className="obs-text-muted" style={{ marginTop: 12 }}>
                    Aún no hay sello destilado de esta sesión para proyectar el
                    comando del siguiente ciclo.
                </div>
            </div>
        )
    }

    const temaSugerido = sello.codigos[0]?.title || sello.protocolo?.titulo || "Reafirmar la frecuencia ancla"
    const fricciones = sello.correcciones
        .map((c) => c.distorsion)
        .filter(Boolean)

    return (
        <div
            className="obs-glass-cyan obs-glass"
            style={{
                padding: 32,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div className="obs-shimmer" />
            <div style={{ position: "relative", zIndex: 2 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    <div className="obs-h-section">
                        Proyección del Próximo Sprint
                    </div>
                    <span className="obs-chip">Síntesis autónoma</span>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: 22,
                    }}
                    className="obs-macro-grid"
                >
                    <div>
                        <div
                            style={{
                                fontSize: 10.5,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(0,194,255,0.72)",
                            }}
                        >
                            Tema sugerido
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 18,
                                fontWeight: 400,
                                lineHeight: 1.5,
                                color: "#E8F5FF",
                            }}
                        >
                            {temaSugerido}
                        </div>

                        {fricciones.length > 0 && (
                            <>
                                <div
                                    style={{
                                        marginTop: 18,
                                        fontSize: 10.5,
                                        letterSpacing: "0.22em",
                                        textTransform: "uppercase",
                                        color: "rgba(232,238,247,0.55)",
                                    }}
                                >
                                    Esquema de fricción a resolver
                                </div>
                                <ul
                                    style={{
                                        margin: "10px 0 0 0",
                                        padding: 0,
                                        listStyle: "none",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                    }}
                                >
                                    {fricciones.map((f, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                fontSize: 12.5,
                                                lineHeight: 1.5,
                                                color: "rgba(232,238,247,0.8)",
                                                display: "flex",
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: "#00C2FF",
                                                    fontSize: 12,
                                                }}
                                            >
                                                ◇
                                            </span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 10.5,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(212,168,67,0.85)",
                            }}
                        >
                            Comando de anclaje recomendado
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                padding: "16px 18px",
                                borderRadius: 12,
                                background:
                                    "linear-gradient(135deg, rgba(200,164,78,0.08) 0%, rgba(200,164,78,0.02) 100%)",
                                border: "1px solid rgba(200,164,78,0.28)",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#ECD8A8",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {sello.protocolo?.titulo ||
                                    "Protocolo de Sintonía"}
                            </div>
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 12.5,
                                    lineHeight: 1.56,
                                    color: "rgba(232,238,247,0.78)",
                                }}
                            >
                                {sello.protocolo?.instruccion ||
                                    "El próximo ciclo repite la frecuencia ancla hasta que se absorba en el campo."}
                            </div>
                        </div>
                    </div>
                </div>

                {onSolicitarAnalisis && (
                    <div
                        style={{
                            marginTop: 22,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={onSolicitarAnalisis}
                            style={{
                                all: "unset",
                                cursor: "pointer",
                                padding: "13px 32px",
                                borderRadius: 12,
                                background:
                                    "linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%)",
                                color: "#0B0C13",
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                boxShadow:
                                    "0 6px 28px rgba(200,164,78,0.32), 0 0 60px rgba(200,164,78,0.08)",
                                transition: "all 0.3s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-1px)"
                                e.currentTarget.style.boxShadow =
                                    "0 10px 36px rgba(200,164,78,0.46), 0 0 80px rgba(200,164,78,0.14)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "none"
                                e.currentTarget.style.boxShadow =
                                    "0 6px 28px rgba(200,164,78,0.32), 0 0 60px rgba(200,164,78,0.08)"
                            }}
                        >
                            ✦ Solicitar Análisis Profundo
                        </button>
                        <div
                            className="obs-text-muted"
                            style={{ fontSize: 10.5, letterSpacing: "0.12em" }}
                        >
                            Gemini 3.1 Pro cruza las últimas 4 sesiones · ~$3 MXN por análisis
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Trayectoria de Nodos — lista de speakers con barras
   ════════════════════════════════════════════════════════════════ */
function TrayectoriaNodos({
    sesionActual,
    sesiones,
    aliases,
    onSelectNodo,
}: {
    sesionActual: Sesion
    sesiones: Sesion[]
    aliases: AliasNodo[]
    onSelectNodo: (speaker: string) => void
}) {
    const speakers = useMemo(() => {
        const sum = sesionActual.speakers_summary || {}
        const entries = Object.entries(sum).map(([id, s]) => ({
            id,
            ...s,
        }))
        /* Filtra residuales marcados por el Arquitecto. */
        const activos = entries.filter((e) => {
            const res = resolveSpeaker(sesionActual.id_sesion, e.id, aliases)
            return !res.eliminado
        })
        activos.sort((a, b) => (b.words || 0) - (a.words || 0))
        return activos
    }, [sesionActual, aliases])

    const topSpeakerId = useMemo(
        () => getTopSpeakerId(sesionActual, aliases),
        [sesionActual, aliases]
    )

    const maxWords = Math.max(1, ...speakers.map((s) => s.words || 0))

    return (
        <div className="obs-glass" style={{ padding: 28 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 20,
                }}
            >
                <div className="obs-h-section">Trayectoria de Nodos</div>
                <span className="obs-chip">{speakers.length} avatares</span>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 14,
                }}
            >
                {speakers.map((s) => {
                    const pct = ((s.words || 0) / maxWords) * 100
                    const resolved = resolveSpeaker(
                        sesionActual.id_sesion,
                        s.id,
                        aliases,
                        topSpeakerId
                    )
                    const displayName = resolved.displayName
                    /* Dorado si el Arquitecto marcó es_host (sin importar
                       el nombre anclado), o como fallback si empieza con "Zak". */
                    const isZak = resolved.esHost || displayName.startsWith("Zak")
                    const initial = resolved.esNamed
                        ? displayName.trim().charAt(0).toUpperCase()
                        : speakerInitial(s.id)
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onSelectNodo(s.id)}
                            style={{
                                all: "unset",
                                cursor: "pointer",
                                padding: "16px 18px",
                                borderRadius: 14,
                                background:
                                    "linear-gradient(135deg, rgba(8,22,45,0.55) 0%, rgba(5,15,35,0.70) 100%)",
                                border: isZak
                                    ? "1px solid rgba(200,164,78,0.30)"
                                    : "1px solid rgba(0,194,255,0.18)",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isZak
                                    ? "rgba(200,164,78,0.55)"
                                    : "rgba(0,194,255,0.40)"
                                e.currentTarget.style.boxShadow = isZak
                                    ? "0 0 22px rgba(200,164,78,0.15)"
                                    : "0 0 22px rgba(0,194,255,0.15)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isZak
                                    ? "rgba(200,164,78,0.30)"
                                    : "rgba(0,194,255,0.18)"
                                e.currentTarget.style.boxShadow = "none"
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    background: isZak
                                        ? "radial-gradient(circle, rgba(200,164,78,0.35) 0%, rgba(140,100,40,0.2) 100%)"
                                        : "radial-gradient(circle, rgba(0,194,255,0.28) 0%, rgba(0,100,180,0.12) 100%)",
                                    border: isZak
                                        ? "1px solid rgba(200,164,78,0.5)"
                                        : "1px solid rgba(0,194,255,0.4)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: isZak ? "#ECD8A8" : "#00C2FF",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    flexShrink: 0,
                                }}
                            >
                                {initial}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: "#E8EEF7",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {displayName}
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        height: 4,
                                        borderRadius: 3,
                                        background: "rgba(0,194,255,0.08)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{
                                            height: "100%",
                                            background: isZak
                                                ? "linear-gradient(90deg, #D4A843 0%, rgba(200,164,78,0.4) 100%)"
                                                : "linear-gradient(90deg, #00C2FF 0%, rgba(0,194,255,0.4) 100%)",
                                            borderRadius: 3,
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        fontSize: 10.5,
                                        color: "rgba(180,200,220,0.6)",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {s.words.toLocaleString()} palabras · {s.turns} turnos
                                </div>
                            </div>
                        </button>
                    )
                })}
                {speakers.length === 0 && (
                    <div className="obs-text-muted">
                        No hay diarización disponible en esta sesión.
                    </div>
                )}
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Selector de sesión (cronológico)
   ════════════════════════════════════════════════════════════════ */
function SelectorSesion({
    sesiones,
    selected,
    onSelect,
}: {
    sesiones: Sesion[]
    selected: string
    onSelect: (id: string) => void
}) {
    return (
        <div
            style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                padding: "4px 0 12px 0",
                scrollbarWidth: "none",
            }}
        >
            {sesiones.map((s) => {
                const isSel = selected === s.id
                return (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => onSelect(s.id)}
                        style={{
                            all: "unset",
                            cursor: "pointer",
                            padding: "9px 16px",
                            borderRadius: 12,
                            background: isSel
                                ? "linear-gradient(165deg, rgba(0,194,255,0.14) 0%, rgba(0,100,180,0.18) 100%)"
                                : "rgba(8,22,45,0.48)",
                            border: isSel
                                ? "1px solid rgba(0,194,255,0.42)"
                                : "1px solid rgba(0,194,255,0.14)",
                            color: isSel ? "#00C2FF" : "rgba(220,235,250,0.72)",
                            fontSize: 11.5,
                            fontWeight: 500,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            transition: "all 0.25s ease",
                        }}
                    >
                        {formatDate(s.fecha)}
                    </button>
                )
            })}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════════════════════════════ */
function ObservatorioResonanciaMacro({
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
}) {
    const [sesiones, setSesiones] = useState<Sesion[] | null>(null)
    const [selectedId, setSelectedId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [historicoNodo, setHistoricoNodo] = useState<string | null>(null)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [analisisOpen, setAnalisisOpen] = useState(false)
    const [aliases, setAliases] = useState<AliasNodo[]>([])
    const [perfiles, setPerfiles] = useState<PerfilNodo[]>([])
    const [analisisHistoricos, setAnalisisHistoricos] = useState<any[]>([])
    const [analisisPreloaded, setAnalisisPreloaded] = useState<any | null>(null)

    const cargar = useCallback(async () => {
        if (!clerkId) return
        setLoading(true)
        const [r, aliasR, histR] = await Promise.all([
            adminCall(
                supabaseUrl,
                supabaseAnonKey,
                "get_observatorio_camara_admin",
                { p_limit: 20 },
                { p_clerk_id: clerkId, p_limit: 20 }
            ),
            adminCall(
                supabaseUrl,
                supabaseAnonKey,
                "get_alias_nodos_sesion_admin",
                {},
                { p_clerk_id: clerkId }
            ),
            adminCall(
                supabaseUrl,
                supabaseAnonKey,
                "list_analisis_profundo_admin",
                { p_limit: 24 },
                { p_clerk_id: clerkId, p_limit: 24 }
            ),
        ])
        if (r && !r.error && Array.isArray(r.sesiones)) {
            setSesiones(r.sesiones)
            /* Preservar selección actual si todavía existe en la lista
               recargada. Solo caemos al más reciente si no hay nada
               seleccionado o si el id previo desapareció. */
            setSelectedId((prev) => {
                if (prev && r.sesiones.some((s: Sesion) => s.id === prev)) {
                    return prev
                }
                return r.sesiones.length > 0 ? r.sesiones[0].id : ""
            })
        } else {
            setSesiones([])
        }
        if (aliasR && !aliasR.error) {
            setAliases(Array.isArray(aliasR.aliases) ? aliasR.aliases : [])
            setPerfiles(Array.isArray(aliasR.perfiles) ? aliasR.perfiles : [])
        }
        if (Array.isArray(histR)) {
            setAnalisisHistoricos(histR)
        } else {
            setAnalisisHistoricos([])
        }
        setLoading(false)
    }, [supabaseUrl, supabaseAnonKey, clerkId])

    useEffect(() => {
        cargar()
    }, [cargar])

    /* Flechas ←→ rotan entre sesiones en loop cronológico. Se desactivan
       si el foco está en un input/textarea para no pelear con la edición
       del upload manual, renombrado de nodos, etc. */
    useEffect(() => {
        if (!sesiones || sesiones.length < 2) return
        const handler = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
            const target = e.target as HTMLElement | null
            const tag = target?.tagName
            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                target?.isContentEditable
            )
                return
            const idx = sesiones.findIndex((s) => s.id === selectedId)
            const dir = e.key === "ArrowRight" ? 1 : -1
            const next =
                (idx + dir + sesiones.length) % sesiones.length
            setSelectedId(sesiones[next].id)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [sesiones, selectedId])

    const sesionActual = useMemo(
        () => sesiones?.find((s) => s.id === selectedId) || null,
        [sesiones, selectedId]
    )
    const sello = useMemo(
        () => parseSello(sesionActual?.sello_text || null),
        [sesionActual]
    )

    if (loading || !sesiones) {
        return (
            <div className="obs-glass" style={{ padding: 40, textAlign: "center" }}>
                <div className="obs-h-section">Sincronizando telemetría grupal</div>
                <div className="obs-text-muted" style={{ marginTop: 12 }}>
                    Cargando últimas transmisiones de la Cámara Solar...
                </div>
            </div>
        )
    }

    const botonAnclarManual = (
        <button
            type="button"
            onClick={() => setUploadOpen(true)}
            style={{
                all: "unset",
                cursor: "pointer",
                padding: "9px 20px",
                borderRadius: 10,
                background:
                    "linear-gradient(135deg, rgba(200,164,78,0.14) 0%, rgba(140,100,40,0.18) 100%)",
                border: "1px solid rgba(200,164,78,0.35)",
                color: "#D4A843",
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 500,
                textShadow: "0 0 8px rgba(200,164,78,0.35)",
                fontFamily: "'Inter', sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
            }}
        >
            ⬆ Anclar transcripción manual
        </button>
    )

    if (sesiones.length === 0) {
        return (
            <>
                <div className="obs-glass" style={{ padding: 40, textAlign: "center" }}>
                    <div className="obs-h-section">Cámara Solar sin telemetría</div>
                    <div
                        className="obs-text-body"
                        style={{ marginTop: 14, maxWidth: 520, margin: "14px auto 0" }}
                    >
                        Cuando corras el pipeline de transcripción sobre una
                        grabación de Zoom, los bloques de telemetría aparecerán
                        acá: pulso central, resonancias, fricciones y la proyección
                        del próximo sprint.
                    </div>
                    <div
                        className="obs-text-muted"
                        style={{
                            marginTop: 18,
                            fontFamily: "monospace",
                            fontSize: 11.5,
                        }}
                    >
                        python3 pipeline_solar.py --auto
                    </div>
                    <div
                        style={{
                            marginTop: 26,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {botonAnclarManual}
                    </div>
                    <div
                        className="obs-text-muted"
                        style={{
                            marginTop: 12,
                            fontSize: 11,
                            maxWidth: 440,
                            margin: "12px auto 0",
                        }}
                    >
                        ¿Tenés sesiones pasadas sin anclar? Usá el panel lateral
                        para pegar transcripción + sello directo.
                    </div>
                </div>

                <AnimatePresence>
                    {uploadOpen && (
                        <PanelUploadManual
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                            clerkId={clerkId}
                            onCerrar={() => setUploadOpen(false)}
                            onAnclado={cargar}
                        />
                    )}
                </AnimatePresence>
            </>
        )
    }

    return (
        <>
            <style>{`
                @media (max-width: 900px) {
                    .obs-macro-grid { grid-template-columns: 1fr !important; }
                }
                /* v1.8 — Scrollbar oculto del panel del nodo (WebKit).
                   El scroll funciona normal con rueda y gestos táctiles. */
                .obs-node-panel::-webkit-scrollbar { width: 0; height: 0; background: transparent; }
                .obs-node-panel::-webkit-scrollbar-thumb { background: transparent; }
            `}</style>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 14,
                }}
            >
                {botonAnclarManual}
            </div>

            <SelectorSesion
                sesiones={sesiones}
                selected={selectedId}
                onSelect={setSelectedId}
            />

            {sesionActual && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                        marginTop: 20,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 18,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div className="obs-h-section-gold">
                                {formatDate(sesionActual.fecha)}
                            </div>
                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 24,
                                    fontWeight: 300,
                                    letterSpacing: "0.01em",
                                    color: "#ECD8A8",
                                }}
                            >
                                Sesión de Cámara Solar
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {sesionActual.duracion_minutos != null && (
                                <span className="obs-chip">
                                    {sesionActual.duracion_minutos} min
                                </span>
                            )}
                            {sesionActual.total_palabras != null && (
                                <span className="obs-chip">
                                    {sesionActual.total_palabras.toLocaleString()} palabras
                                </span>
                            )}
                            {sesionActual.pdf_url && (
                                <a
                                    href={sesionActual.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="obs-chip obs-chip-gold"
                                    style={{
                                        textDecoration: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Ver Sello PDF →
                                </a>
                            )}
                        </div>
                    </div>

                    <TrayectoriaNodos
                        sesionActual={sesionActual}
                        sesiones={sesiones}
                        aliases={aliases}
                        onSelectNodo={setHistoricoNodo}
                    />
                    <MapaTermico sello={sello} />
                    <ProyeccionSprint
                        sello={sello}
                        onSolicitarAnalisis={
                            sesiones.length >= 1
                                ? () => {
                                      setAnalisisPreloaded(null)
                                      setAnalisisOpen(true)
                                  }
                                : undefined
                        }
                    />
                    {analisisHistoricos.length > 0 && (
                        <HistoricoAnalisisGrid
                            historicos={analisisHistoricos}
                            onAbrir={(row) => {
                                setAnalisisPreloaded({
                                    success: true,
                                    n_sesiones: row.n_sesiones,
                                    fechas: row.fechas || [],
                                    proyeccion: row.proyeccion || {},
                                    usage: row.usage || {},
                                })
                                setAnalisisOpen(true)
                            }}
                        />
                    )}
                </div>
            )}

            <AnimatePresence>
                {historicoNodo && sesionActual && (
                    <PanelHistoricoNodo
                        speaker={historicoNodo}
                        sesionActiva={sesionActual}
                        sesiones={sesiones}
                        aliases={aliases}
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkId={clerkId}
                        onClose={() => setHistoricoNodo(null)}
                        onRefresh={cargar}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {uploadOpen && (
                    <PanelUploadManual
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkId={clerkId}
                        onCerrar={() => setUploadOpen(false)}
                        onAnclado={cargar}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {analisisOpen && (
                    <ModalAnalisisProfundo
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkId={clerkId}
                        n={Math.min(4, sesiones.length)}
                        preloaded={analisisPreloaded}
                        onCerrar={() => {
                            setAnalisisOpen(false)
                            setAnalisisPreloaded(null)
                            if (!analisisPreloaded) cargar()
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default ObservatorioResonanciaMacro
