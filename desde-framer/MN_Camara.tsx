// Red Solar Viva — MN_Camara.tsx v2.1 — sin botón de WhatsApp
// v2.0 — Limpieza tras la migración de "Estado de la Inmersión Solar"
// a EstadoOrbitalSection (vive ahora en MN_Firma). El bloque de
// status + chip Privilegios + botón Gestionar dejaron de tener
// sentido semántico dentro de Cámara Solar (la membresía gobierna
// TODO el ecosistema, no sólo sesiones grupales).
//
// CamaraSection ahora se enfoca en lo propio de Cámara Solar:
//   · Header (Cámara Solar / Sesiones Grupales)
//   · WhatsApp button (sólo si membresía activa)
//   · SintonizacionPortal (cuenta regresiva o botón ENTRAR A LA
//     CÁMARA según día y hora UTC)
//   · Grid de sesiones grabadas (videos Wistia + Sellos PDF R2)
//   · HoloCinePlayer + HoloPDFViewer (modales)
//
// Para guests sin membresía, sigue apareciendo el mensaje
// "Activa tu inmersión para acceder a las grabaciones" — la
// activación la maneja Estado Orbital en Ajustes de Firma.
//
// SintonizacionPortal queda acá (no en MN_Sesiones) porque sólo
// CamaraSection lo consume y moverlo a Sesiones generaba dep
// circular.
//
// Cumple regla 🜂: default export es Object.assign sobre componente
// fantasma + { CamaraSection, SintonizacionPortal }.
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

import MNShared from "./MN_Shared.tsx"
import MNIcons from "./MN_Icons.tsx"
import MNHoloPlayers from "./MN_HoloPlayers.tsx"

const {
    hexToRgba,
    parseLocalDate,
    isSubActive,
    cV,
    fU,
    ZOOM_URL,
    getCamaraState,
    getNextSessionStart,
} = MNShared
const {
    ISun,
    IPlay,
    ICal,
    IClk,
    ISello,
} = MNIcons
const { HoloCinePlayer, HoloPDFViewer } = MNHoloPlayers

type CamaraState = "idle" | "live"

function SintonizacionPortal({ accent }: { accent: string }) {
    const [state, setState] = useState<CamaraState>(getCamaraState)
    const [countdown, setCountdown] = useState("")

    useEffect(() => {
        const update = () => {
            const newState = getCamaraState()
            setState(newState)
            if (newState === "idle") {
                const target = getNextSessionStart()
                const diff = target.getTime() - Date.now()
                if (diff <= 0) {
                    setCountdown("00 h : 00 m")
                    return
                }
                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor(
                    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                )
                const minutes = Math.floor(
                    (diff % (1000 * 60 * 60)) / (1000 * 60)
                )
                const p: string[] = []
                if (days > 0) p.push(`${days} d`)
                p.push(`${String(hours).padStart(2, "0")} h`)
                p.push(`${String(minutes).padStart(2, "0")} m`)
                setCountdown(p.join("  :  "))
            }
        }
        update()
        const i = setInterval(update, 10000)
        return () => clearInterval(i)
    }, [])

    const localTimeStr = useMemo(
        () =>
            getNextSessionStart().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
        []
    )

    /* ── Estado LIVE: Botón Portal ── */
    if (state === "live") {
        return (
            <motion.div
                variants={fU}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px 28px",
                    borderRadius: 14,
                    background:
                        "linear-gradient(135deg, rgba(30,25,10,0.12), rgba(50,40,15,0.08))",
                    border: "1px solid rgba(212,168,67,0.15)",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: -10,
                            borderRadius: 60,
                            border: "1px solid rgba(212,168,67,0.35)",
                            animation:
                                "nuc-portal-ring 4.2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: -10,
                            borderRadius: 60,
                            border: "1px solid rgba(212,168,67,0.2)",
                            animation:
                                "nuc-portal-ring 4.2s cubic-bezier(0.22, 1, 0.36, 1) 2s infinite",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: -6,
                            borderRadius: 56,
                            border: "1px solid rgba(212,168,67,0.12)",
                            animation:
                                "nuc-portal-ring 5.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s infinite",
                            pointerEvents: "none",
                        }}
                    />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                width: 3,
                                height: 3,
                                borderRadius: "50%",
                                background: "rgba(245,217,140,0.7)",
                                boxShadow: "0 0 6px rgba(212,168,67,0.5)",
                                bottom: 8,
                                left: `${20 + i * 15}%`,
                                animation: `nuc-portal-ember ${2.5 + i * 0.7}s ease-out ${i * 0.9}s infinite`,
                                pointerEvents: "none",
                            }}
                        />
                    ))}
                    <a
                        href={ZOOM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nuc-portal-btn"
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            padding: "16px 48px",
                            borderRadius: 50,
                            border: "1px solid rgba(212,168,67,0.6)",
                            background:
                                "linear-gradient(135deg, #B8902F 0%, #D4A843 30%, #F5D98C 50%, #D4A843 70%, #B8902F 100%)",
                            color: "#0B0C13",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase" as const,
                            textDecoration: "none",
                            cursor: "pointer",
                            fontFamily: "'Inter',sans-serif",
                            whiteSpace: "nowrap" as const,
                            animation:
                                "nuc-portal-glow 3.8s cubic-bezier(0.4, 0, 0.6, 1) infinite, nuc-portal-breathe 5.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            zIndex: 1,
                            transition:
                                "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), filter 0.4s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.animationPlayState = "paused"
                            e.currentTarget.style.transform =
                                "translateY(-2px) scale(1.05)"
                            e.currentTarget.style.filter =
                                "brightness(1.2) saturate(1.15)"
                            e.currentTarget.style.boxShadow =
                                "0 0 35px rgba(212,168,67,0.7), 0 0 70px rgba(212,168,67,0.3), 0 0 120px rgba(212,168,67,0.12)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.animationPlayState = "running"
                            e.currentTarget.style.transform = ""
                            e.currentTarget.style.filter = ""
                            e.currentTarget.style.boxShadow = ""
                        }}
                    >
                        ⚡️ Entrar a la Cámara
                    </a>
                </div>
            </motion.div>
        )
    }

    /* ── Estado IDLE: Cuenta regresiva ── */
    return (
        <motion.div
            variants={fU}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                padding: "16px 28px",
                borderRadius: 14,
                background:
                    "linear-gradient(135deg, rgba(0,194,255,0.04), rgba(0,40,80,0.08))",
                border: "1px solid rgba(0,194,255,0.12)",
                flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 10px ${accent}`,
                        animation: "nuc-pulse 2s ease-in-out infinite",
                        flexShrink: 0,
                    }}
                />
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                        fontFamily: "'Inter',sans-serif",
                        whiteSpace: "nowrap",
                    }}
                >
                    Próxima Sintonización:
                </span>
            </div>
            <div
                className="nuc-tunesync-divider"
                style={{
                    width: 1,
                    height: 20,
                    background: "rgba(0,194,255,0.15)",
                    flexShrink: 0,
                }}
            />
            <span
                style={{
                    fontSize: 22,
                    fontWeight: 300,
                    letterSpacing: "0.12em",
                    color: accent,
                    fontFamily: "'Inter',sans-serif",
                    textShadow: `0 0 8px ${hexToRgba(accent, 0.3)}`,
                }}
            >
                {countdown}
            </span>
            <div
                className="nuc-tunesync-divider"
                style={{
                    width: 1,
                    height: 20,
                    background: "rgba(0,194,255,0.15)",
                    flexShrink: 0,
                }}
            />
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Inter',sans-serif",
                    whiteSpace: "nowrap",
                }}
            >
                Tu hora local{" "}
                <span
                    style={{ color: "rgba(255,255,255,0.55)", fontWeight: 500 }}
                >
                    Martes {localTimeStr}
                </span>
            </span>
        </motion.div>
    )
}

function CamaraSection({
    sessions,
    sub,
    accent,
    loading = false,
}: {
    sessions: any[]
    sub: any
    accent: string
    loading?: boolean
    /* v2.0 — props stripePortalUrl/supabaseUrl/supabaseAnonKey ya no
       se usan acá (eran para handleManageSubscription que migró a
       EstadoOrbital). El shell sigue pasándolos por compat — los
       ignoramos. */
    stripePortalUrl?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    const on = isSubActive(sub)
    const [cineOpen, setCineOpen] = useState(false)
    const [cineVideoId, setCineVideoId] = useState("")
    const [pdfOpen, setPdfOpen] = useState(false)
    const [pdfUrl, setPdfUrl] = useState("")
    const [pdfTitle, setPdfTitle] = useState("")

    return (
        <motion.div
            variants={cV}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
            <motion.div
                variants={fU}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(0,194,255,0.08)",
                        border: "1px solid rgba(0,194,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accent,
                    }}
                >
                    <ISun />
                </div>
                <div style={{ textAlign: "left" }}>
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Cámara Solar
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.55)",
                            margin: 0,
                            marginTop: 2,
                            textAlign: "left",
                        }}
                    >
                        Sesiones Grupales
                    </p>
                </div>
            </motion.div>
            <SintonizacionPortal accent={accent} />
            {/* v2.0 — Para guests sin membresía: mensaje informativo
                apuntando a Estado Orbital (donde se activa la
                Inmersión). Antes había CTAs duplicados — ahora la
                activación vive en una sola cabina. */}
            {!on && !loading && (
                <motion.div
                    variants={fU}
                    className="nuc-glass"
                    style={{ padding: "32px 24px", textAlign: "center" }}
                >
                    <p
                        style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 13,
                            margin: 0,
                            lineHeight: 1.6,
                            maxWidth: 460,
                            margin: "0 auto",
                        }}
                    >
                        Activa tu Inmersión Solar para sumarte a la sesión en
                        vivo cada martes y acceder al archivo completo de
                        grabaciones.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            window.location.hash = "#mifirma/orbital"
                        }}
                        style={{
                            marginTop: 16,
                            padding: "9px 22px",
                            borderRadius: 999,
                            background: "transparent",
                            border: `1px solid ${hexToRgba(accent, 0.35)}`,
                            color: accent,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        Ir a Estado Orbital →
                    </button>
                </motion.div>
            )}
            <div
                className="nuc-sessions-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 16,
                    paddingBottom: 20,
                }}
            >
                {sessions.map((s: any) => {
                    const dObj = parseLocalDate(s.session_date)
                    return (
                        <motion.div key={s.id} variants={fU}>
                            <div
                                className="nuc-glass"
                                style={{
                                    padding: 0,
                                    overflow: "hidden",
                                    position: "relative",
                                }}
                            >
                                <div
                                    style={{
                                        cursor: s.wistia_video_id
                                            ? "pointer"
                                            : "default",
                                    }}
                                    onClick={() => {
                                        if (s.wistia_video_id) {
                                            setCineVideoId(s.wistia_video_id)
                                            setCineOpen(true)
                                        }
                                    }}
                                >
                                    <div
                                        className="nuc-thumb"
                                        style={{
                                            width: "100%",
                                            aspectRatio: "16/9",
                                            overflow: "hidden",
                                            background:
                                                "linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,40,60,0.7), rgba(0,15,35,0.95))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: "20px 20px 0 0",
                                            position: "relative",
                                        }}
                                    >
                                        {s.thumbnail_url && (
                                            <img
                                                src={s.thumbnail_url}
                                                alt={s.title}
                                                style={{
                                                    position: "absolute",
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    opacity: 0.5,
                                                    zIndex: 0,
                                                }}
                                            />
                                        )}
                                        <div
                                            style={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: "50%",
                                                border: "1px solid rgba(0,194,255,0.1)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background:
                                                    "radial-gradient(circle, rgba(0,194,255,0.06) 0%, transparent 70%)",
                                                position: "relative",
                                                zIndex: 2,
                                            }}
                                        >
                                            <div className="nuc-play">
                                                <IPlay />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: "16px 20px" }}>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            lineHeight: 1.4,
                                            color: "#fff",
                                        }}
                                    >
                                        {s.title}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            marginTop: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                fontSize: 11,
                                                color: "rgba(255,255,255,0.4)",
                                            }}
                                        >
                                            <ICal />{" "}
                                            {dObj.toLocaleDateString("es-MX", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                        {s.duration_minutes && (
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    fontSize: 11,
                                                    color: "rgba(255,255,255,0.4)",
                                                }}
                                            >
                                                <IClk /> {s.duration_minutes}{" "}
                                                min
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {s.sello_pdf_url && (
                                    <button
                                        className="nuc-sello-bar"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPdfUrl(s.sello_pdf_url)
                                            setPdfTitle(s.title)
                                            setPdfOpen(true)
                                        }}
                                    >
                                        <ISello />
                                        Visualizar Sello
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
            <HoloCinePlayer
                isOpen={cineOpen}
                onClose={() => {
                    setCineOpen(false)
                    setCineVideoId("")
                }}
                wistiaVideoId={cineVideoId}
                accentColor={accent}
            />
            <HoloPDFViewer
                isOpen={pdfOpen}
                onClose={() => {
                    setPdfOpen(false)
                    setPdfUrl("")
                    setPdfTitle("")
                }}
                pdfUrl={pdfUrl}
                sessionTitle={pdfTitle}
                accentColor={accent}
            />
        </motion.div>
    )
}

/* Default export: componente fantasma + componentes como propiedades. */
function MNCamaraRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MNCamaraRoot.displayName = "MN_Camara"

const Camara = Object.assign(MNCamaraRoot, {
    CamaraSection,
    SintonizacionPortal,
})

export default Camara
