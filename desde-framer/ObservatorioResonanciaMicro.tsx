// Red Solar Viva — ObservatorioResonanciaMicro.tsx v1.4 — RPC admin por gateway admin-action (Batch 3 seguridad, barrido 2026-06-13). (Gestor de Preguntas ahora hace su propio fetch al montarse — llama get_preguntas_1a1_activas directo y construye los drafts con la respuesta, eliminando el race condition con el padre. Quitados los textos de atajo en el encabezado. El atajo ⌘/Ctrl+↵ sigue funcional pero invisible. Loader mientras carga. El upsert RPC devuelve la lista actualizada y seteamos el state directo sin re-fetch.)
// Sub-componente del Observatorio de Resonancia · estado MICRO (Ignición 1:1).
//
// Renderiza:
//   1. Agenda Cronológica — lista de próximas Cámaras de Resonancia 1:1 con
//      nombre del Nodo, coordenada temporal, estado de Zoom, monto pagado.
//   2. Lectura de Intención — despliega el Escaneo Relámpago (respuestas +
//      intención sellada) del Nodo seleccionado.
//   3. Gestor de Preguntas — panel colapsable para editar las 3 preguntas
//      dinámicas que alimentan el Escaneo (upsert a config_preguntas_1a1).
//
// Default export por la regla Framer de named-export-roto.

import * as React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

/* ════════════════════════════════════════════════════════════════
   Tipos
   ════════════════════════════════════════════════════════════════ */
interface Cita {
    reserva_id: string
    name: string
    email: string
    clerk_user_id: string | null
    status: string
    confirmed_at: string | null
    amount_mxn_cents: number | null
    zoom_join_url: string | null
    zoom_meeting_id: string | null
    zoom_used_fallback: boolean | null
    escaneo_resultado: Record<string, any> | null
    intencion_texto: string | null
    escaneo_completado_at: string | null
    slot_type: string
    start_time: string
    end_time: string
}
interface Pregunta {
    id?: string
    orden: number
    pregunta_texto: string
    opciones: string[]
    plano_label?: string | null
    activa?: boolean
}

/* ════════════════════════════════════════════════════════════════
   RPC helper local
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

/* ════════════════════════════════════════════════════════════════
   Formateadores
   ════════════════════════════════════════════════════════════════ */
function formatFechaHora(iso: string): { fecha: string; hora: string } {
    try {
        const d = new Date(iso)
        return {
            fecha: d.toLocaleDateString("es-MX", {
                weekday: "short",
                day: "numeric",
                month: "short",
            }),
            hora: d.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        }
    } catch {
        return { fecha: iso, hora: "" }
    }
}

function formatSlotType(t: string): string {
    if (t === "individual_30") return "30 min"
    if (t === "individual_45") return "45 min"
    if (t === "individual_60") return "60 min"
    return t
}

function formatPesos(cents: number | null): string {
    if (!cents || cents < 1) return "—"
    return `$${(cents / 100).toLocaleString("es-MX", {
        maximumFractionDigits: 0,
    })} MXN`
}

function countdown(iso: string): string {
    try {
        const diff = new Date(iso).getTime() - Date.now()
        if (diff < 0) {
            const passed = Math.abs(diff)
            if (passed < 3600 * 1000) return "En curso"
            return "Concluida"
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const mins = Math.floor((diff / (1000 * 60)) % 60)
        if (days > 0) return `En ${days}d ${hours}h`
        if (hours > 0) return `En ${hours}h ${mins}m`
        return `En ${mins}m`
    } catch {
        return ""
    }
}

/* ════════════════════════════════════════════════════════════════
   Tarjeta de cita
   ════════════════════════════════════════════════════════════════ */
function TarjetaCita({
    cita,
    expandida,
    onToggle,
    preguntas,
}: {
    cita: Cita
    expandida: boolean
    onToggle: () => void
    preguntas: Pregunta[]
}) {
    const { fecha, hora } = formatFechaHora(cita.start_time)
    const tieneEscaneo = !!cita.escaneo_completado_at
    const tieneIntencion = !!cita.intencion_texto
    const escaneo = (cita.escaneo_resultado || {}) as Record<string, any>
    const cuenta = countdown(cita.start_time)
    const inFuture = new Date(cita.start_time).getTime() > Date.now()

    return (
        <motion.div
            layout
            className="obs-glass"
            style={{
                overflow: "hidden",
                borderColor: tieneEscaneo
                    ? "rgba(200,164,78,0.30)"
                    : "rgba(0,194,255,0.20)",
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 22,
                    padding: "22px 26px",
                    width: "100%",
                    alignItems: "center",
                }}
            >
                {/* Columna fecha + hora */}
                <div style={{ textAlign: "center", minWidth: 92 }}>
                    <div
                        style={{
                            fontSize: 10.5,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(0,194,255,0.72)",
                        }}
                    >
                        {fecha}
                    </div>
                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 26,
                            fontWeight: 300,
                            color: "#E8EEF7",
                            letterSpacing: "0.02em",
                            fontFeatureSettings: '"tnum"',
                        }}
                    >
                        {hora}
                    </div>
                    {inFuture && (
                        <div
                            style={{
                                marginTop: 2,
                                fontSize: 9.5,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: "rgba(212,168,67,0.72)",
                            }}
                        >
                            {cuenta}
                        </div>
                    )}
                </div>

                {/* Columna nombre + chips */}
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: "#ECD8A8",
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {cita.name || cita.email}
                    </div>
                    <div
                        style={{
                            marginTop: 6,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <span className="obs-chip">
                            {formatSlotType(cita.slot_type)}
                        </span>
                        {cita.amount_mxn_cents != null && (
                            <span
                                className="obs-chip"
                                style={{
                                    background: "rgba(200,164,78,0.06)",
                                    borderColor: "rgba(200,164,78,0.25)",
                                    color: "rgba(212,168,67,0.88)",
                                }}
                            >
                                {formatPesos(cita.amount_mxn_cents)}
                            </span>
                        )}
                        {cita.zoom_join_url ? (
                            <span
                                className="obs-chip"
                                style={{
                                    background: cita.zoom_used_fallback
                                        ? "rgba(232,238,247,0.06)"
                                        : "rgba(0,194,255,0.08)",
                                    borderColor: cita.zoom_used_fallback
                                        ? "rgba(232,238,247,0.24)"
                                        : "rgba(0,194,255,0.30)",
                                    color: cita.zoom_used_fallback
                                        ? "rgba(232,238,247,0.78)"
                                        : "rgba(0,194,255,0.90)",
                                }}
                            >
                                {cita.zoom_used_fallback
                                    ? "Zoom fallback"
                                    : "Zoom ancla"}
                            </span>
                        ) : (
                            <span
                                className="obs-chip"
                                style={{
                                    background: "rgba(232,238,247,0.04)",
                                    borderColor: "rgba(232,238,247,0.18)",
                                    color: "rgba(232,238,247,0.55)",
                                }}
                            >
                                Sin sala
                            </span>
                        )}
                        <span
                            className="obs-chip"
                            style={{
                                background: tieneEscaneo
                                    ? "rgba(200,164,78,0.08)"
                                    : "rgba(232,238,247,0.04)",
                                borderColor: tieneEscaneo
                                    ? "rgba(200,164,78,0.35)"
                                    : "rgba(232,238,247,0.20)",
                                color: tieneEscaneo
                                    ? "rgba(212,168,67,0.95)"
                                    : "rgba(200,215,235,0.52)",
                            }}
                        >
                            {tieneEscaneo
                                ? "Intención sellada"
                                : "Pendiente de escaneo"}
                        </span>
                    </div>
                </div>

                {/* Columna chevron */}
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        border: "1px solid rgba(0,194,255,0.25)",
                        background: "rgba(0,194,255,0.04)",
                        color: "#00C2FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        transform: expandida ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                    }}
                >
                    ▾
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expandida && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.32,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            style={{
                                padding: "4px 26px 24px 26px",
                                display: "grid",
                                gridTemplateColumns:
                                    "minmax(0, 1fr) minmax(0, 1fr)",
                                gap: 20,
                            }}
                            className="obs-macro-grid"
                        >
                            {/* Contacto + Zoom + Email */}
                            <div
                                className="obs-glass"
                                style={{
                                    padding: 18,
                                    borderRadius: 14,
                                    border: "1px solid rgba(0,194,255,0.16)",
                                }}
                            >
                                <div className="obs-h-section">
                                    Contacto del Nodo
                                </div>
                                <div
                                    style={{
                                        marginTop: 10,
                                        fontSize: 12.5,
                                        color: "rgba(232,238,247,0.78)",
                                        lineHeight: 1.72,
                                    }}
                                >
                                    <div>
                                        <strong
                                            style={{
                                                color: "rgba(180,200,220,0.55)",
                                                fontWeight: 400,
                                                marginRight: 6,
                                            }}
                                        >
                                            Email ·
                                        </strong>
                                        <a
                                            href={`mailto:${cita.email}`}
                                            style={{
                                                color: "#00C2FF",
                                                textDecoration: "none",
                                            }}
                                        >
                                            {cita.email}
                                        </a>
                                    </div>
                                    {cita.zoom_join_url && (
                                        <div style={{ marginTop: 4 }}>
                                            <strong
                                                style={{
                                                    color: "rgba(180,200,220,0.55)",
                                                    fontWeight: 400,
                                                    marginRight: 6,
                                                }}
                                            >
                                                Zoom ·
                                            </strong>
                                            <a
                                                href={cita.zoom_join_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "#00C2FF",
                                                    textDecoration: "none",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                abrir sala →
                                            </a>
                                        </div>
                                    )}
                                    {cita.confirmed_at && (
                                        <div
                                            style={{
                                                marginTop: 4,
                                                color: "rgba(180,200,220,0.55)",
                                                fontSize: 11.5,
                                            }}
                                        >
                                            Confirmada {formatFechaHora(cita.confirmed_at).fecha}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Escaneo relámpago */}
                            <div
                                className="obs-glass-gold"
                                style={{
                                    padding: 18,
                                    borderRadius: 14,
                                }}
                            >
                                <div className="obs-shimmer" />
                                <div style={{ position: "relative", zIndex: 2 }}>
                                    <div className="obs-h-section-gold">
                                        Escaneo Relámpago
                                    </div>
                                    {!tieneEscaneo && !tieneIntencion && (
                                        <div
                                            className="obs-text-muted"
                                            style={{ marginTop: 10 }}
                                        >
                                            El Nodo aún no ha sellado su
                                            intención. El widget aparecerá en
                                            su Núcleo tras el pago.
                                        </div>
                                    )}
                                    {preguntas.map((q) => {
                                        const respuesta =
                                            escaneo[
                                                `q${q.orden}`
                                            ] ||
                                            escaneo[`pregunta_${q.orden}`] ||
                                            null
                                        if (!respuesta) return null
                                        return (
                                            <div
                                                key={q.orden}
                                                style={{ marginTop: 12 }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        letterSpacing: "0.22em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: "rgba(212,168,67,0.75)",
                                                    }}
                                                >
                                                    {q.plano_label ||
                                                        `Pregunta ${q.orden}`}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11.5,
                                                        marginTop: 4,
                                                        color: "rgba(200,215,235,0.58)",
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {q.pregunta_texto}
                                                </div>
                                                <div
                                                    style={{
                                                        marginTop: 6,
                                                        fontSize: 13.5,
                                                        fontWeight: 500,
                                                        color: "#ECD8A8",
                                                        letterSpacing: "0.01em",
                                                    }}
                                                >
                                                    {respuesta}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {tieneIntencion && (
                                        <div
                                            style={{
                                                marginTop: 16,
                                                padding: "12px 14px",
                                                borderRadius: 10,
                                                background:
                                                    "linear-gradient(135deg, rgba(200,164,78,0.08) 0%, rgba(200,164,78,0.02) 100%)",
                                                border: "1px solid rgba(200,164,78,0.28)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    letterSpacing: "0.22em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(212,168,67,0.82)",
                                                }}
                                            >
                                                Intención sellada
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 13,
                                                    fontStyle: "italic",
                                                    fontWeight: 300,
                                                    lineHeight: 1.58,
                                                    color: "#F5E5C4",
                                                }}
                                            >
                                                «{cita.intencion_texto}»
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Gestor de Preguntas — modal lateral
   ════════════════════════════════════════════════════════════════ */
const MAX_PREGUNTAS = 5

function buildDraftsFromPreguntas(preguntas: Pregunta[], minSlots = 3): Pregunta[] {
    /* Si hay más preguntas que minSlots en DB, respetamos todas; si hay menos,
       pad hasta minSlots. Cada slot garantiza 3 opciones mínimo (pad con ""). */
    const count = Math.max(minSlots, preguntas.length)
    return Array.from({ length: count }, (_, i) => {
        const orden = i + 1
        const existing = preguntas.find((p) => p.orden === orden)
        const opciones = existing ? [...existing.opciones] : ["", "", ""]
        while (opciones.length < 3) opciones.push("")
        return {
            id: existing?.id || "",
            orden,
            pregunta_texto: existing?.pregunta_texto || "",
            opciones,
            plano_label: existing?.plano_label || "",
            activa: existing?.activa !== false,
        }
    })
}

function GestorPreguntas({
    preguntas,
    supabaseUrl,
    supabaseAnonKey,
    onGuardar,
    onCerrar,
    guardando,
}: {
    preguntas: Pregunta[]
    supabaseUrl: string
    supabaseAnonKey: string
    onGuardar: (p: Pregunta[]) => Promise<void>
    onCerrar: () => void
    guardando: boolean
}) {
    /* Fetch propio al montarse — evita cualquier race condition con el padre.
       Si el padre ya tiene preguntas, las usamos como seed inmediato mientras
       el fetch termina (UX sin flash). */
    const [drafts, setDrafts] = useState<Pregunta[]>(() =>
        buildDraftsFromPreguntas(preguntas)
    )
    const [pristine, setPristine] = useState(true)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setFetching(true)
            const r = await sbRpc(
                supabaseUrl,
                supabaseAnonKey,
                "get_preguntas_1a1_activas",
                {}
            )
            if (cancelled) return
            if (Array.isArray(r)) {
                /* Solo pisamos drafts si el usuario aún no editó */
                setDrafts((prev) => {
                    if (!pristine) return prev
                    return buildDraftsFromPreguntas(r as Pregunta[])
                })
            }
            setFetching(false)
        })()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabaseUrl, supabaseAnonKey])

    /* Además, si el padre actualiza `preguntas` después (por upsert success),
       re-sincronizamos los drafts mientras pristine=true. */
    useEffect(() => {
        if (!pristine) return
        if (preguntas && preguntas.length > 0) {
            setDrafts(buildDraftsFromPreguntas(preguntas))
        }
    }, [preguntas, pristine])

    const actualizar = (idx: number, patch: Partial<Pregunta>) => {
        setPristine(false)
        setDrafts((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))
        )
    }
    const actualizarOpcion = (idx: number, optIdx: number, val: string) => {
        setPristine(false)
        setDrafts((prev) =>
            prev.map((p, i) => {
                if (i !== idx) return p
                const nuevas = [...p.opciones]
                nuevas[optIdx] = val
                return { ...p, opciones: nuevas }
            })
        )
    }
    const agregarPregunta = () => {
        setPristine(false)
        setDrafts((prev) => {
            if (prev.length >= MAX_PREGUNTAS) return prev
            return [
                ...prev,
                {
                    id: "",
                    orden: prev.length + 1,
                    pregunta_texto: "",
                    opciones: ["", "", ""],
                    plano_label: "",
                    activa: true,
                },
            ]
        })
    }
    const removerPregunta = (idx: number) => {
        setPristine(false)
        setDrafts((prev) => {
            const next = prev.filter((_, i) => i !== idx)
            /* Re-ordenar para que queden 1..N contiguo */
            return next.map((p, i) => ({ ...p, orden: i + 1 }))
        })
    }

    /* Atajo Cmd+Enter / Ctrl+Enter para anclar */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !guardando) {
                e.preventDefault()
                onGuardar(drafts)
            }
            if (e.key === "Escape" && !guardando) {
                onCerrar()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [drafts, guardando, onGuardar, onCerrar])

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
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
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
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="obs-glass"
                style={{
                    width: "min(720px, 94vw)",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    padding: "36px 36px 28px 36px",
                    borderRadius: 22,
                    border: "1.5px solid rgba(0,194,255,0.34)",
                    boxShadow:
                        "0 20px 60px rgba(0,194,255,0.10), 0 0 120px rgba(0,194,255,0.05), inset 0 0 30px rgba(0,194,255,0.02)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <div className="obs-h-section">
                            Gestor de Preguntas
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
                            Escaneo Relámpago · 1:1
                        </div>
                        <div
                            className="obs-text-muted"
                            style={{ marginTop: 4, fontSize: 11 }}
                        >
                            {drafts.length} de {MAX_PREGUNTAS} sondas
                            {fetching ? " · sincronizando..." : ""}
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
                        }}
                    >
                        ×
                    </button>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {drafts.map((q, idx) => (
                        <div
                            key={idx}
                            className="obs-glass"
                            style={{
                                padding: "18px 20px",
                                borderRadius: 14,
                                position: "relative",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div className="obs-h-section-gold">
                                    Pregunta {q.orden}
                                </div>
                                {drafts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removerPregunta(idx)}
                                        disabled={guardando}
                                        title="Remover esta pregunta"
                                        style={{
                                            all: "unset",
                                            cursor: guardando
                                                ? "not-allowed"
                                                : "pointer",
                                            fontSize: 10,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "rgba(232,238,247,0.42)",
                                            padding: "4px 8px",
                                            borderRadius: 6,
                                            border: "1px solid rgba(232,238,247,0.14)",
                                        }}
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={q.plano_label || ""}
                                onChange={(e) =>
                                    actualizar(idx, {
                                        plano_label: e.target.value,
                                    })
                                }
                                placeholder="Plano / etiqueta (opcional, ej. Plano Físico · Hardware)"
                                disabled={guardando}
                                style={{
                                    width: "100%",
                                    marginTop: 10,
                                    padding: "8px 12px",
                                    fontSize: 12,
                                    background: "rgba(0,0,0,0.25)",
                                    border: "1px solid rgba(232,238,247,0.16)",
                                    borderRadius: 8,
                                    color: "rgba(232,238,247,0.9)",
                                    fontFamily: "Inter, sans-serif",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <textarea
                                value={q.pregunta_texto}
                                onChange={(e) =>
                                    actualizar(idx, {
                                        pregunta_texto: e.target.value,
                                    })
                                }
                                rows={2}
                                placeholder="Texto de la pregunta"
                                disabled={guardando}
                                style={{
                                    width: "100%",
                                    marginTop: 10,
                                    padding: "10px 12px",
                                    fontSize: 14,
                                    background: "rgba(0,0,0,0.25)",
                                    border: "1px solid rgba(0,194,255,0.24)",
                                    borderRadius: 10,
                                    color: "#E8EEF7",
                                    fontFamily: "Inter, sans-serif",
                                    resize: "vertical",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <div
                                style={{
                                    marginTop: 14,
                                    fontSize: 10.5,
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase",
                                    color: "rgba(212,168,67,0.72)",
                                }}
                            >
                                Opciones · 3 respuestas
                            </div>
                            {q.opciones.map((op, optIdx) => (
                                <input
                                    key={optIdx}
                                    type="text"
                                    value={op}
                                    onChange={(e) =>
                                        actualizarOpcion(
                                            idx,
                                            optIdx,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Opción ${optIdx + 1}`}
                                    disabled={guardando}
                                    style={{
                                        width: "100%",
                                        marginTop: 8,
                                        padding: "10px 14px",
                                        fontSize: 13,
                                        background:
                                            "linear-gradient(135deg, rgba(200,164,78,0.06) 0%, rgba(200,164,78,0.02) 100%)",
                                        border: "1px solid rgba(200,164,78,0.22)",
                                        borderRadius: 10,
                                        color: "#ECD8A8",
                                        fontFamily: "Inter, sans-serif",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            ))}
                        </div>
                    ))}

                    {drafts.length < MAX_PREGUNTAS && (
                        <button
                            type="button"
                            onClick={agregarPregunta}
                            disabled={guardando}
                            style={{
                                all: "unset",
                                cursor: guardando ? "not-allowed" : "pointer",
                                padding: "14px 18px",
                                borderRadius: 14,
                                background: "transparent",
                                border: "1px dashed rgba(0,194,255,0.30)",
                                color: "rgba(0,194,255,0.82)",
                                fontSize: 11.5,
                                letterSpacing: "0.20em",
                                textTransform: "uppercase",
                                fontWeight: 500,
                                textAlign: "center",
                                fontFamily: "'Inter', sans-serif",
                                transition: "all 0.25s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(0,194,255,0.05)"
                                e.currentTarget.style.borderColor =
                                    "rgba(0,194,255,0.55)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent"
                                e.currentTarget.style.borderColor =
                                    "rgba(0,194,255,0.30)"
                            }}
                        >
                            + Agregar pregunta ({drafts.length}/{MAX_PREGUNTAS})
                        </button>
                    )}
                </div>

                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        gap: 12,
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={guardando}
                        style={{
                            all: "unset",
                            cursor: guardando ? "not-allowed" : "pointer",
                            padding: "11px 22px",
                            borderRadius: 10,
                            border: "1px solid rgba(232,238,247,0.22)",
                            background: "rgba(232,238,247,0.04)",
                            color: "rgba(232,238,247,0.72)",
                            fontSize: 12,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            opacity: guardando ? 0.5 : 1,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onGuardar(drafts)}
                        disabled={guardando}
                        style={{
                            all: "unset",
                            cursor: guardando ? "not-allowed" : "pointer",
                            padding: "11px 28px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%)",
                            color: "#0B0C13",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            boxShadow: "0 4px 20px rgba(200,164,78,0.28)",
                            fontFamily: "'Inter', sans-serif",
                            opacity: guardando ? 0.5 : 1,
                        }}
                    >
                        {guardando ? "Anclando..." : "Anclar cambios"}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ════════════════════════════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════════════════════════════ */
function ObservatorioResonanciaMicro({
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
}) {
    const [citas, setCitas] = useState<Cita[] | null>(null)
    const [preguntas, setPreguntas] = useState<Pregunta[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [gestorAbierto, setGestorAbierto] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [filtro, setFiltro] = useState<"todas" | "selladas" | "pendientes">(
        "todas"
    )

    const cargar = useCallback(async () => {
        if (!clerkId) return
        setLoading(true)
        const r = await sbRpc(supabaseUrl, supabaseAnonKey, "get_observatorio_1to1_admin", {
            p_clerk_id: clerkId,
        })
        if (r && !r.error) {
            setCitas(Array.isArray(r.citas) ? r.citas : [])
            setPreguntas(Array.isArray(r.preguntas) ? r.preguntas : [])
        } else {
            setCitas([])
        }
        setLoading(false)
    }, [supabaseUrl, supabaseAnonKey, clerkId])

    useEffect(() => {
        cargar()
    }, [cargar])

    const citasFiltradas = useMemo(() => {
        if (!citas) return []
        if (filtro === "todas") return citas
        if (filtro === "selladas")
            return citas.filter((c) => !!c.escaneo_completado_at)
        return citas.filter((c) => !c.escaneo_completado_at)
    }, [citas, filtro])

    const guardarPreguntas = useCallback(
        async (drafts: Pregunta[]) => {
            if (!clerkId) return
            setGuardando(true)
            /* Filtrar slots con opciones vacías — mantener las 3 opciones
               obligatorias. Si el Arquitecto dejó alguna vacía, no mandamos
               ese slot y dejamos el anterior intacto. */
            const payload = drafts
                .filter((d) => (d.pregunta_texto || "").trim().length > 0)
                .map((d, i) => ({
                    orden: i + 1, // re-compact: 1..N contiguo
                    pregunta_texto: d.pregunta_texto.trim(),
                    opciones: (d.opciones || [])
                        .map((o) => (o || "").trim())
                        .filter((o) => o.length > 0)
                        .slice(0, 3),
                    plano_label: (d.plano_label || "").trim() || null,
                    activa: d.activa !== false,
                }))
                .filter((d) => d.opciones.length >= 1)

            if (payload.length === 0) {
                setGuardando(false)
                return
            }

            const r = await sbRpc(
                supabaseUrl,
                supabaseAnonKey,
                "upsert_preguntas_1to1_admin",
                { p_clerk_id: clerkId, p_preguntas: payload }
            )
            setGuardando(false)
            if (r?.success) {
                /* El RPC ahora devuelve las preguntas actualizadas en la
                   misma respuesta — seteamos el state directo en vez de
                   esperar al refetch (evita race condition al reabrir). */
                if (Array.isArray(r.preguntas)) {
                    setPreguntas(r.preguntas as Pregunta[])
                } else {
                    await cargar()
                }
                setGestorAbierto(false)
            }
        },
        [clerkId, supabaseUrl, supabaseAnonKey, cargar]
    )

    if (loading || !citas) {
        return (
            <div className="obs-glass" style={{ padding: 40, textAlign: "center" }}>
                <div className="obs-h-section-gold">
                    Sincronizando ignición individual
                </div>
                <div className="obs-text-muted" style={{ marginTop: 12 }}>
                    Trayendo próximas Cámaras de Resonancia y escaneos...
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @media (max-width: 900px) {
                    .obs-macro-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Encabezado + controles */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 14,
                    marginBottom: 22,
                }}
            >
                <div>
                    <div className="obs-h-section-gold">
                        Agenda cronológica
                    </div>
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 22,
                            fontWeight: 300,
                            color: "#ECD8A8",
                            letterSpacing: "0.01em",
                        }}
                    >
                        Cámaras de Resonancia activas
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            gap: 2,
                            padding: 3,
                            background: "rgba(8,22,45,0.6)",
                            border: "1px solid rgba(0,194,255,0.18)",
                            borderRadius: 12,
                        }}
                    >
                        {(
                            [
                                { k: "todas", l: "Todas" },
                                { k: "pendientes", l: "Pendientes" },
                                { k: "selladas", l: "Selladas" },
                            ] as { k: typeof filtro; l: string }[]
                        ).map((f) => {
                            const on = filtro === f.k
                            return (
                                <button
                                    key={f.k}
                                    type="button"
                                    onClick={() => setFiltro(f.k)}
                                    style={{
                                        all: "unset",
                                        cursor: "pointer",
                                        padding: "7px 14px",
                                        borderRadius: 9,
                                        fontSize: 10.5,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: on ? "#00C2FF" : "rgba(220,235,250,0.55)",
                                        background: on
                                            ? "rgba(0,194,255,0.10)"
                                            : "transparent",
                                        border: on
                                            ? "1px solid rgba(0,194,255,0.28)"
                                            : "1px solid transparent",
                                    }}
                                >
                                    {f.l}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => setGestorAbierto(true)}
                        style={{
                            all: "unset",
                            cursor: "pointer",
                            padding: "9px 20px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, rgba(200,164,78,0.14) 0%, rgba(140,100,40,0.18) 100%)",
                            border: "1px solid rgba(200,164,78,0.35)",
                            color: "#D4A843",
                            fontSize: 11,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontWeight: 500,
                            textShadow: "0 0 8px rgba(200,164,78,0.35)",
                        }}
                    >
                        ⚙ Gestor de preguntas
                    </button>
                </div>
            </div>

            {/* Lista de citas */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                }}
            >
                {citasFiltradas.length === 0 && (
                    <div
                        className="obs-glass"
                        style={{ padding: 32, textAlign: "center" }}
                    >
                        <div className="obs-h-section">
                            {filtro === "todas"
                                ? "Sin citas agendadas"
                                : filtro === "selladas"
                                ? "Ningún Nodo ha sellado escaneo aún"
                                : "Todos los Nodos activos tienen su intención sellada"}
                        </div>
                        <div className="obs-text-muted" style={{ marginTop: 10 }}>
                            {filtro === "todas"
                                ? "El Puente de Transmisión despertará en cuanto se confirme la primera reserva 1:1."
                                : "Cambiá el filtro para ver el resto de la agenda."}
                        </div>
                    </div>
                )}

                {citasFiltradas.map((c) => (
                    <TarjetaCita
                        key={c.reserva_id}
                        cita={c}
                        preguntas={preguntas}
                        expandida={expandedId === c.reserva_id}
                        onToggle={() =>
                            setExpandedId((prev) =>
                                prev === c.reserva_id ? null : c.reserva_id
                            )
                        }
                    />
                ))}
            </div>

            <AnimatePresence>
                {gestorAbierto && (
                    <GestorPreguntas
                        preguntas={preguntas}
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        onGuardar={guardarPreguntas}
                        onCerrar={() => !guardando && setGestorAbierto(false)}
                        guardando={guardando}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default ObservatorioResonanciaMicro
