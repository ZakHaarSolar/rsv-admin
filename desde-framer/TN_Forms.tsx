// TN_Forms.tsx v1.2
// v1.2 (2026-07-27) — AUDITORÍA PARTE 4: el correo del Pase de Exploración deja
// de dispararse pegándole directo al webhook de Pipedream desde el navegador
// (su dirección salía del bundle publicado) y pasa por la función
// `dispatch-pase-exploracion`, que verifica admin contra Clerk y firma el
// despacho server-side. La prop `emailWebhookUrl` queda ignorada.
// Formularios y paneles del split de TelemetriaDelNucleo (sello TN_).
// Default export = ghost component con Object.assign de todos los exports
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidor: TN_Dashboard. Patrón de import:
//   import Forms from "./TN_Forms.tsx"
//   const { AddExplorationPassForm, HistoryPanel } = Forms

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Shared from "./TN_Shared.tsx"
import UI from "./TN_UI.tsx"

const {
    GOLD,
    CYAN,
    GREEN,
    fmt,
    slideUp,
    getUpcomingTuesdays,
    useMonthlyHistory,
    adminAction,
} = Shared

const { MultiToggle, ExpandArrowBtn } = UI

/* ═══ Add Exploration Pass Form — v10.0 ═══
   Formulario inline dentro del panel expandido de Cámara Solar. */
function AddExplorationPassForm({
    sbUrl,
    sbKey,
    clerkId,
    onCreated,
    emailWebhookUrl,
}: {
    sbUrl: string
    sbKey: string
    clerkId: string
    onCreated: () => void
    emailWebhookUrl?: string
}) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [dateStr, setDateStr] = useState("")
    const [group, setGroup] = useState<"pulsar" | "cuasar">("pulsar")
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState<{
        ok: boolean
        msg: string
    } | null>(null)

    const tuesdayOptions = React.useMemo(() => getUpcomingTuesdays(12), [])

    const reset = () => {
        setName("")
        setEmail("")
        setDateStr("")
        setGroup("pulsar")
    }

    const canSubmit =
        !submitting &&
        name.trim().length > 1 &&
        /@/.test(email) &&
        !!dateStr

    const submit = async () => {
        if (!canSubmit) return
        if (!sbUrl || !sbKey) {
            setToast({ ok: false, msg: "Supabase no configurado" })
            return
        }
        setSubmitting(true)
        try {
            /* Cancún = UTC-5 sin DST. Púlsar = 12:30 PM Cancún = 17:30 UTC;
               Cuásar = 4:30 PM Cancún = 21:30 UTC. */
            const utcHour = group === "pulsar" ? 17 : 21
            const iso = `${dateStr}T${String(utcHour).padStart(2, "0")}:30:00.000Z`

            if (!clerkId) {
                throw new Error("sesión no detectada (recarga la página)")
            }
            // Gateway verificado admin-action: el servidor inyecta el id admin
            // del token de Clerk en p_clerk_user_id (no se manda desde acá).
            const created = await adminAction(
                sbUrl,
                sbKey,
                "admin_create_exploration_pass",
                {
                    p_name: name.trim(),
                    p_email: email.trim(),
                    p_event_date: dateStr,
                    p_event_start_time: iso,
                    p_group_name: group,
                }
            )
            if (!created) {
                throw new Error(
                    "no se pudo registrar el pase (sesión admin o red)"
                )
            }
            /* AUDITORÍA PARTE 4 — el correo ya NO se dispara pegándole directo
               al webhook de Pipedream desde el navegador. Esa dirección vivía
               en un property control de Framer, así que salía del bundle
               publicado con solo mirar la red: cualquiera mandaba un correo con
               nuestra marca anunciando una sesión inventada.

               Ahora pasa por la función `dispatch-pase-exploracion`, que
               verifica contra Clerk que quien pide es admin de verdad y recién
               entonces FIRMA el despacho. El secreto de la firma nunca baja al
               navegador. La prop `emailWebhookUrl` queda ignorada a propósito
               (no hay que quitarla del canvas de Framer). */
            let emailSent = false
            let emailDebug = ""
            try {
                const token = await (
                    window as any
                ).Clerk?.session?.getToken?.()
                if (!token) {
                    emailDebug = "sesión admin"
                } else {
                    const er = await fetch(
                        `${sbUrl}/functions/v1/dispatch-pase-exploracion`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: sbKey,
                                Authorization: `Bearer ${sbKey}`,
                            },
                            body: JSON.stringify({
                                token,
                                name: name.trim(),
                                email: email.trim(),
                                event_date: dateStr,
                                event_start_time: iso,
                                group_name: group,
                                timezone: "America/Cancun",
                            }),
                        }
                    )
                    const respText = await er.text().catch(() => "")
                    console.log(
                        "[ExplorationPass] dispatch →",
                        er.status,
                        er.ok,
                        respText.slice(0, 200)
                    )
                    emailSent = er.ok
                    if (!er.ok) emailDebug = `${er.status}`
                }
            } catch (err: any) {
                console.error("[ExplorationPass] dispatch error:", err)
                emailSent = false
                emailDebug = err?.message || "network"
            }
            setToast({
                ok: emailSent,
                msg: emailSent
                    ? "Pase agregado · Email enviado ✦"
                    : `Pase agregado · Email falló${emailDebug ? " (" + emailDebug + ")" : ""}`,
            })
            reset()
            setOpen(false)
            onCreated()
            setTimeout(() => setToast(null), 4000)
        } catch (e: any) {
            setToast({
                ok: false,
                msg: `Error: ${e?.message || "desconocido"}`,
            })
            setTimeout(() => setToast(null), 5000)
        } finally {
            setSubmitting(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "9px 12px",
        borderRadius: 8,
        border: "1px solid rgba(200,164,78,0.15)",
        background: "rgba(200,164,78,0.04)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 300,
        outline: "none",
        transition: "border-color 0.25s",
    }

    return (
        <div style={{ marginTop: 14 }}>
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1px dashed rgba(200,164,78,0.3)",
                        background: "rgba(200,164,78,0.03)",
                        color: "rgba(200,164,78,0.75)",
                        fontFamily: "inherit",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(200,164,78,0.55)"
                        ;(e.currentTarget as HTMLElement).style.color = GOLD
                        ;(e.currentTarget as HTMLElement).style.background =
                            "rgba(200,164,78,0.08)"
                    }}
                    onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(200,164,78,0.3)"
                        ;(e.currentTarget as HTMLElement).style.color =
                            "rgba(200,164,78,0.75)"
                        ;(e.currentTarget as HTMLElement).style.background =
                            "rgba(200,164,78,0.03)"
                    }}
                >
                    + Registrar Pase Exploración
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid rgba(200,164,78,0.2)",
                        background: "rgba(200,164,78,0.03)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: GOLD,
                            }}
                        >
                            ⚡ Nuevo Pase de Exploración
                        </span>
                        <button
                            onClick={() => {
                                setOpen(false)
                                reset()
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "rgba(200,164,78,0.5)",
                                cursor: "pointer",
                                fontSize: 14,
                                padding: "0 4px",
                            }}
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                        }}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return
                            if (e.metaKey || e.ctrlKey) {
                                e.preventDefault()
                                submit()
                            } else {
                                e.preventDefault()
                            }
                        }}
                    >
                        <div
                            className="adm-grid-2"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 10,
                            }}
                        >
                            <input
                                placeholder="Nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={inputStyle}
                                autoFocus
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={inputStyle}
                            />
                            <select
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    cursor: "pointer",
                                    appearance: "none",
                                    backgroundImage: `linear-gradient(45deg, transparent 50%, rgba(200,164,78,0.55) 50%), linear-gradient(135deg, rgba(200,164,78,0.55) 50%, transparent 50%)`,
                                    backgroundPosition: `calc(100% - 18px) 52%, calc(100% - 13px) 52%`,
                                    backgroundSize: `5px 5px, 5px 5px`,
                                    backgroundRepeat: "no-repeat",
                                    paddingRight: 28,
                                }}
                                title="Fecha de la sesión — sólo martes (Cámara Solar)"
                            >
                                <option
                                    value=""
                                    style={{
                                        background: "#0a1a28",
                                        color: "#fff",
                                    }}
                                >
                                    — Elige martes —
                                </option>
                                {tuesdayOptions.map((opt) => (
                                    <option
                                        key={opt.value}
                                        value={opt.value}
                                        style={{
                                            background: "#0a1a28",
                                            color: "#fff",
                                        }}
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 4,
                                    padding: 3,
                                    borderRadius: 8,
                                    border: "1px solid rgba(200,164,78,0.15)",
                                    background: "rgba(200,164,78,0.04)",
                                }}
                            >
                                {(
                                    [
                                        ["pulsar", "☀ Púlsar", "12:30 PM"],
                                        ["cuasar", "◐ Cuásar", "4:30 PM"],
                                    ] as const
                                ).map(([val, label, time]) => {
                                    const on = group === val
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setGroup(val)}
                                            style={{
                                                padding: "6px 8px",
                                                borderRadius: 6,
                                                border: "none",
                                                background: on
                                                    ? "rgba(200,164,78,0.2)"
                                                    : "transparent",
                                                color: on
                                                    ? GOLD
                                                    : "rgba(200,164,78,0.55)",
                                                fontFamily: "inherit",
                                                fontSize: 11,
                                                fontWeight: on ? 600 : 400,
                                                cursor: "pointer",
                                                transition: "all 0.18s",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 1,
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            <span>{label}</span>
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    opacity: 0.7,
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {time}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 12,
                                gap: 10,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 9,
                                    color: "rgba(200,164,78,0.4)",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                +555 MXN al mes en curso · ⌘+Enter para
                                enviar
                            </span>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: 8,
                                    border: `1px solid ${canSubmit ? "rgba(200,164,78,0.45)" : "rgba(200,164,78,0.12)"}`,
                                    background: canSubmit
                                        ? "rgba(200,164,78,0.12)"
                                        : "rgba(200,164,78,0.03)",
                                    color: canSubmit
                                        ? GOLD
                                        : "rgba(200,164,78,0.35)",
                                    fontFamily: "inherit",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    cursor: canSubmit
                                        ? "pointer"
                                        : "not-allowed",
                                    transition: "all 0.2s",
                                }}
                            >
                                {submitting ? "Registrando…" : "Registrar"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: 10,
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        textAlign: "center",
                        border: `1px solid ${toast.ok ? "rgba(34,197,94,0.35)" : "rgba(255,107,107,0.35)"}`,
                        background: toast.ok
                            ? "rgba(34,197,94,0.08)"
                            : "rgba(255,107,107,0.08)",
                        color: toast.ok ? GREEN : "#FF6B6B",
                    }}
                >
                    {toast.msg}
                </motion.div>
            )}
        </div>
    )
}

/* ═══ HistoryPanel — gráfico de barras de ingresos mensuales ═══ */
function HistoryPanel({
    sbUrl,
    sbKey,
    onExpandedChange,
}: {
    sbUrl: string
    sbKey: string
    onExpandedChange?: (v: boolean) => void
}) {
    const [showHistory, setShowHistory] = useState(false)
    const [histMonths, setHistMonths] = useState(6)
    const { data: history, loading } = useMonthlyHistory(
        sbUrl,
        sbKey,
        showHistory ? histMonths : 0
    )
    const [hovIdx, setHovIdx] = useState<number | null>(null)
    const panelRef = React.useRef<HTMLDivElement>(null)
    useEffect(() => {
        onExpandedChange?.(showHistory)
    }, [showHistory, onExpandedChange])
    useEffect(() => {
        if (!showHistory) return
        const h = (e: MouseEvent | TouchEvent) => {
            const ref = panelRef.current
            if (!ref) return
            const t = e.target as Node | null
            if (t && !ref.contains(t)) setShowHistory(false)
        }
        const id = window.setTimeout(() => {
            document.addEventListener("mousedown", h)
            document.addEventListener("touchstart", h, { passive: true })
        }, 0)
        return () => {
            window.clearTimeout(id)
            document.removeEventListener("mousedown", h)
            document.removeEventListener("touchstart", h)
        }
    }, [showHistory])
    const maxTotal = Math.max(...history.map((m) => m.total), 1)
    const niceMax = (v: number) => {
        if (v <= 0) return 1000
        const mag = Math.pow(10, Math.floor(Math.log10(v)))
        const n = (Math.ceil((v / mag) * 2) / 2) * mag
        return Math.max(n, v * 1.15)
    }
    const yMax = niceMax(maxTotal)
    const gridLines = 4
    const BAR_H = 280
    const reversed = [...history].reverse()
    return (
        <motion.div
            ref={panelRef}
            variants={slideUp}
            className="adm-glass adm-history-panel"
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: showHistory ? 24 : 0,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(0,194,255,0.65)",
                    }}
                >
                    ◈ Historial de Ingresos
                </span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {showHistory && (
                        <MultiToggle
                            options={["3 Meses", "6 Meses", "12 Meses"]}
                            value={
                                histMonths === 3 ? 0 : histMonths === 6 ? 1 : 2
                            }
                            onChange={(v) => setHistMonths([3, 6, 12][v])}
                            color={CYAN}
                        />
                    )}
                    <ExpandArrowBtn
                        expanded={showHistory}
                        onClick={() => setShowHistory(!showHistory)}
                        color={CYAN}
                    />
                </div>
            </div>
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "visible" }}
                    >
                        {loading ? (
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.15)",
                                    padding: "60px 0",
                                }}
                            >
                                Cargando historial...
                            </p>
                        ) : (
                            <div
                                style={{
                                    maxWidth: 800,
                                    margin: "0 auto",
                                    paddingTop: 80,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 0,
                                        position: "relative",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 50,
                                            height: BAR_H,
                                            position: "relative",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {Array.from({
                                            length: gridLines + 1,
                                        }).map((_, i) => {
                                            const val =
                                                yMax * (1 - i / gridLines)
                                            return (
                                                <span
                                                    key={i}
                                                    style={{
                                                        position: "absolute",
                                                        right: 8,
                                                        top: `${(i / gridLines) * 100}%`,
                                                        transform:
                                                            "translateY(-50%)",
                                                        fontSize: 9,
                                                        color: "rgba(255,255,255,0.15)",
                                                        fontFamily:
                                                            "'Inter',sans-serif",
                                                    }}
                                                >
                                                    $
                                                    {val >= 1000
                                                        ? `${Math.round(val / 1000)}k`
                                                        : fmt(Math.round(val))}
                                                </span>
                                            )
                                        })}
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: BAR_H,
                                            position: "relative",
                                        }}
                                    >
                                        {Array.from({
                                            length: gridLines + 1,
                                        }).map((_, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    right: 0,
                                                    top: `${(i / gridLines) * 100}%`,
                                                    height: 1,
                                                    background:
                                                        i === gridLines
                                                            ? "rgba(255,255,255,0.08)"
                                                            : "rgba(255,255,255,0.04)",
                                                }}
                                            />
                                        ))}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-end",
                                                height: "100%",
                                                gap: 6,
                                                padding: "0 8px",
                                                position: "relative",
                                                zIndex: 2,
                                            }}
                                        >
                                            {reversed.map((m, i) => {
                                                const h =
                                                    m.total > 0
                                                        ? (m.total / yMax) *
                                                          BAR_H
                                                        : 0
                                                const inmH =
                                                    m.total > 0
                                                        ? (m.inmersion /
                                                              m.total) *
                                                          h
                                                        : 0
                                                const codH = h - inmH
                                                const isHov = hovIdx === i
                                                const edgeLeft = i <= 1
                                                const edgeRight =
                                                    i >= reversed.length - 2
                                                const tooltipAnchor = edgeRight
                                                    ? {
                                                          right: 0,
                                                          left: "auto" as const,
                                                          transform: "none",
                                                      }
                                                    : edgeLeft
                                                      ? {
                                                            left: 0,
                                                            right: "auto" as const,
                                                            transform: "none",
                                                        }
                                                      : {
                                                            left: "50%",
                                                            right: "auto" as const,
                                                            transform:
                                                                "translateX(-50%)",
                                                        }
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            flex: 1,
                                                            maxWidth: 60,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            justifyContent:
                                                                "flex-end",
                                                            height: "100%",
                                                            position:
                                                                "relative",
                                                        }}
                                                        onMouseEnter={() =>
                                                            setHovIdx(i)
                                                        }
                                                        onMouseLeave={() =>
                                                            setHovIdx(null)
                                                        }
                                                    >
                                                        {isHov &&
                                                            m.total > 0 && (
                                                                <motion.div
                                                                    initial={{
                                                                        opacity: 0,
                                                                        y: 4,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        y: 0,
                                                                    }}
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        bottom:
                                                                            h +
                                                                            12,
                                                                        ...tooltipAnchor,
                                                                        zIndex: 20,
                                                                        pointerEvents:
                                                                            "none",
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            background:
                                                                                "rgba(15,22,40,0.95)",
                                                                            border: "1px solid rgba(0,194,255,0.2)",
                                                                            borderRadius: 12,
                                                                            padding:
                                                                                "14px 18px",
                                                                            minWidth: 160,
                                                                            boxShadow:
                                                                                "0 8px 32px rgba(0,0,0,0.5)",
                                                                            backdropFilter:
                                                                                "blur(12px)",
                                                                        }}
                                                                    >
                                                                        <p
                                                                            style={{
                                                                                margin: 0,
                                                                                fontSize: 13,
                                                                                fontWeight: 500,
                                                                                color: "#fff",
                                                                                marginBottom: 10,
                                                                            }}
                                                                        >
                                                                            {
                                                                                m.label
                                                                            }
                                                                        </p>
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                flexDirection:
                                                                                    "column",
                                                                                gap: 6,
                                                                            }}
                                                                        >
                                                                            {m.inmersion >
                                                                                0 && (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "space-between",
                                                                                        gap: 16,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius:
                                                                                                    "50%",
                                                                                                background:
                                                                                                    GOLD,
                                                                                            }}
                                                                                        />
                                                                                        <span
                                                                                            style={{
                                                                                                fontSize: 11,
                                                                                                color: "rgba(255,255,255,0.5)",
                                                                                            }}
                                                                                        >
                                                                                            Inmersión
                                                                                        </span>
                                                                                    </div>
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            fontWeight: 500,
                                                                                            color: GOLD,
                                                                                        }}
                                                                                    >
                                                                                        $
                                                                                        {fmt(
                                                                                            m.inmersion
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {m.codices >
                                                                                0 && (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "space-between",
                                                                                        gap: 16,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius:
                                                                                                    "50%",
                                                                                                background:
                                                                                                    "#8B5CF6",
                                                                                            }}
                                                                                        />
                                                                                        <span
                                                                                            style={{
                                                                                                fontSize: 11,
                                                                                                color: "rgba(255,255,255,0.5)",
                                                                                            }}
                                                                                        >
                                                                                            Códices
                                                                                        </span>
                                                                                    </div>
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            fontWeight: 500,
                                                                                            color: "#8B5CF6",
                                                                                        }}
                                                                                    >
                                                                                        $
                                                                                        {fmt(
                                                                                            m.codices
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <div
                                                                                style={{
                                                                                    borderTop:
                                                                                        "1px solid rgba(255,255,255,0.08)",
                                                                                    paddingTop: 6,
                                                                                    marginTop: 2,
                                                                                    display:
                                                                                        "flex",
                                                                                    justifyContent:
                                                                                        "space-between",
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    style={{
                                                                                        fontSize: 11,
                                                                                        fontWeight: 600,
                                                                                        color: "rgba(255,255,255,0.4)",
                                                                                    }}
                                                                                >
                                                                                    Total
                                                                                </span>
                                                                                <span
                                                                                    style={{
                                                                                        fontSize: 13,
                                                                                        fontWeight: 600,
                                                                                        color: CYAN,
                                                                                    }}
                                                                                >
                                                                                    $
                                                                                    {fmt(
                                                                                        m.total
                                                                                    )}{" "}
                                                                                    MXN
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            width: 0,
                                                                            height: 0,
                                                                            borderLeft:
                                                                                "6px solid transparent",
                                                                            borderRight:
                                                                                "6px solid transparent",
                                                                            borderTop:
                                                                                "6px solid rgba(15,22,40,0.95)",
                                                                            margin: "0 auto",
                                                                        }}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                borderRadius:
                                                                    "4px 4px 0 0",
                                                                overflow:
                                                                    "hidden",
                                                                cursor: "pointer",
                                                                transition:
                                                                    "filter 0.2s",
                                                                filter: isHov
                                                                    ? "brightness(1.3)"
                                                                    : "brightness(1)",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "100%",
                                                                    height:
                                                                        inmH ||
                                                                        0,
                                                                    background: `linear-gradient(180deg, ${GOLD}, rgba(200,164,78,0.5))`,
                                                                    transition:
                                                                        "height 0.6s cubic-bezier(0.16,1,0.3,1)",
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    width: "100%",
                                                                    height:
                                                                        codH ||
                                                                        0,
                                                                    background: `linear-gradient(180deg, #8B5CF6, rgba(139,92,246,0.5))`,
                                                                    transition:
                                                                        "height 0.6s cubic-bezier(0.16,1,0.3,1)",
                                                                }}
                                                            />
                                                        </div>
                                                        {h === 0 && (
                                                            <div
                                                                style={{
                                                                    width: "100%",
                                                                    height: 2,
                                                                    borderRadius: 1,
                                                                    background:
                                                                        "rgba(255,255,255,0.06)",
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        marginLeft: 50,
                                        padding: "8px 8px 0",
                                        gap: 6,
                                    }}
                                >
                                    {reversed.map((m, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                maxWidth: 60,
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color:
                                                        hovIdx === i
                                                            ? "rgba(255,255,255,0.6)"
                                                            : "rgba(255,255,255,0.2)",
                                                    fontWeight:
                                                        hovIdx === i
                                                            ? 500
                                                            : 400,
                                                    transition: "color 0.2s",
                                                }}
                                            >
                                                {m.label.split(" ")[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: 24,
                                        marginTop: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 3,
                                                background: GOLD,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            Inmersión Solar
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 3,
                                                background: "#8B5CF6",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            Códices
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "rgba(255,255,255,0.15)",
                                            marginLeft: 8,
                                        }}
                                    >
                                        Total:{" "}
                                        <span
                                            style={{
                                                color: CYAN,
                                                fontWeight: 500,
                                            }}
                                        >
                                            $
                                            {fmt(
                                                history.reduce(
                                                    (s, m) => s + m.total,
                                                    0
                                                )
                                            )}{" "}
                                            MXN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function TN_FormsShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
TN_FormsShell.displayName = "TN_Forms"

const Forms = Object.assign(TN_FormsShell, {
    AddExplorationPassForm,
    HistoryPanel,
})

export default Forms
