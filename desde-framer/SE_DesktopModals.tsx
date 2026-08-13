// SE_DesktopModals.tsx v1.0
// Modales y componentes auxiliares del [CENTRO DE MANDO] del Escáner de
// Sesiones (sello SE_). Default export = ghost component con Object.assign
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidor: SE_Desktop. Patrón de import:
//   import DesktopModals from "./SE_DesktopModals.tsx"
//   const { DeskModalOverlay, DeskFAQModal, HoloCard } = DesktopModals

import * as React from "react"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Shared from "./SE_Shared.tsx"

const { hexToRgba, formatText, CalendlyEmbed } = Shared

/* ── Desktop Modal Overlay (NO body.overflow manipulation) ── */
const DeskModalOverlay = ({ onClose, children }: any) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(14px)",
            overflowY: "auto",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
        }}
    >
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                pointerEvents: "none",
            }}
        >
            <div
                onClick={(e: any) => e.stopPropagation()}
                style={{
                    position: "relative",
                    cursor: "default",
                    pointerEvents: "auto",
                }}
            >
                {children}
            </div>
        </div>
    </motion.div>
)

/* ── Desktop CalendarHeader (legacy fallback Calendly) ── */
const DeskCalendarHeader = ({ onClose, rawUrl, accent }: any) => (
    <div
        style={{
            height: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 25px",
            background:
                "linear-gradient(145deg, rgba(8,14,28,0.98), rgba(5,10,20,0.98))",
            flexShrink: 0,
            zIndex: 20,
            borderBottom: `1px solid ${hexToRgba(accent, 0.15)}`,
        }}
    >
        <div style={{ flex: 1 }} />
        <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => {
                if (rawUrl) window.open(rawUrl, "_blank")
            }}
            style={{
                background: `linear-gradient(135deg, ${hexToRgba(accent, 0.08)}, ${hexToRgba(accent, 0.02)})`,
                border: `1px solid ${hexToRgba(accent, 0.25)}`,
                color: "#E6F7EF",
                padding: "8px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.75,
            }}
        >
            Abrir en Calendly
        </motion.button>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <button
                className="faq-modal-close"
                onClick={onClose}
                style={
                    {
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `1px solid ${hexToRgba(accent, 0.2)}`,
                        background: "rgba(255,255,255,0.03)",
                        color: hexToRgba(accent, 0.5),
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: "none",
                        transform: "rotate(0deg) scale(1)",
                        boxShadow: "none",
                        padding: 0,
                        lineHeight: 1,
                        ["--close-glow" as any]: `0 0 12px ${hexToRgba(accent, 0.4)}, 0 0 24px ${hexToRgba(accent, 0.15)}`,
                        ["--close-bg-hover" as any]: hexToRgba(accent, 0.12),
                        ["--bt-color" as any]: accent,
                    } as React.CSSProperties
                }
            >
                <svg
                    width="11"
                    height="11"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <line x1="1" y1="1" x2="13" y2="13" />
                    <line x1="13" y1="1" x2="1" y2="13" />
                </svg>
            </button>
        </div>
    </div>
)

/* ── Desktop CalendlyModalView (legacy fallback) ── */
const DeskCalendlyModalView = ({
    onClose,
    url,
    accent,
    maskBottomPx,
    cropTop,
    modalWidth,
    height,
}: any) => (
    <div
        style={
            {
                background:
                    "linear-gradient(145deg, rgba(8,14,28,0.95), rgba(5,10,20,0.98))",
                border: `1px solid ${hexToRgba(accent, 0.3)}`,
                boxShadow: `0 0 40px ${hexToRgba(accent, 0.15)}, 0 20px 60px rgba(0,0,0,0.6)`,
                borderRadius: 24,
                position: "relative",
                width: modalWidth || 1060,
                maxWidth: "calc(100vw - 40px)",
                display: "flex",
                flexDirection: "column",
                padding: 0,
                minHeight: 700,
                height,
                overflow: "hidden",
                marginTop: 50,
            } as any
        }
    >
        <DeskCalendarHeader
            onClose={onClose}
            rawUrl={String(url).trim()}
            accent={accent}
        />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                flex: 1,
                width: "100%",
                background: "rgba(8,14,28,0.95)",
                marginTop: `${cropTop}px`,
            }}
        >
            <CalendlyEmbed
                url={url}
                accent={accent}
                maskBottomPx={maskBottomPx}
            />
        </motion.div>
    </div>
)

/* ── Desktop FAQ Modal ── */
const DeskFAQModal = ({ onClose, items, accent }: any) => {
    const [exp, setExp] = useState<number | null>(null)
    if (!items || items.length === 0) return null
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "5vh 5vw",
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e: any) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 750,
                    maxHeight: "80vh",
                    background:
                        "linear-gradient(145deg, rgba(8,14,28,0.95), rgba(5,10,20,0.98))",
                    border: `1px solid ${hexToRgba(accent, 0.3)}`,
                    borderRadius: 20,
                    boxShadow: `0 0 40px ${hexToRgba(accent, 0.15)}, 0 20px 60px rgba(0,0,0,0.6)`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "24px 32px 16px 32px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        borderBottom: `1px solid ${hexToRgba(accent, 0.15)}`,
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "1.3rem",
                            fontWeight: 200,
                            margin: 0,
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            filter: `drop-shadow(0 0 8px ${hexToRgba(accent, 0.27)})`,
                        }}
                    >
                        Preguntas Frecuentes
                    </h2>
                    <button
                        className="faq-modal-close"
                        onClick={onClose}
                        style={
                            {
                                position: "absolute",
                                right: 32,
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                border: `1px solid ${hexToRgba(accent, 0.2)}`,
                                background: "rgba(255,255,255,0.03)",
                                color: hexToRgba(accent, 0.5),
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                outline: "none",
                                padding: 0,
                                ["--close-glow" as any]: `0 0 12px ${hexToRgba(accent, 0.4)}`,
                                ["--close-bg-hover" as any]: hexToRgba(
                                    accent,
                                    0.12
                                ),
                                ["--bt-color" as any]: accent,
                            } as React.CSSProperties
                        }
                    >
                        <svg
                            width="11"
                            height="11"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px 32px 32px 32px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        scrollbarWidth: "thin",
                        scrollbarColor: `${hexToRgba(accent, 0.27)} transparent`,
                    }}
                >
                    {(items || []).map((item: any, i: number) => {
                        const isOpen = exp === i
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isOpen
                                        ? `linear-gradient(135deg, ${hexToRgba(accent, 0.06)}, ${hexToRgba(accent, 0.02)})`
                                        : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                                    border: `1px solid ${isOpen ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.1)}`,
                                    borderRadius: 14,
                                    cursor: "pointer",
                                    transition:
                                        "border-color .15s ease-out, background .15s ease-out",
                                }}
                                onClick={() => setExp(isOpen ? null : i)}
                            >
                                <div
                                    style={{
                                        padding: "18px 24px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: "1rem",
                                            fontWeight: 400,
                                            color: isOpen ? "#FFF" : "#E6F7EF",
                                            opacity: isOpen ? 1 : 0.8,
                                            letterSpacing: "0.02em",
                                            paddingRight: 20,
                                        }}
                                    >
                                        {formatText(item.q)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "1.3rem",
                                            color: accent,
                                            opacity: 0.9,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition:
                                                "transform .2s ease-out",
                                            flexShrink: 0,
                                            marginLeft: 12,
                                        }}
                                    >
                                        +
                                    </span>
                                </div>
                                <div
                                    className={`faq-answer-grid${isOpen ? " faq-open" : ""}`}
                                >
                                    <div className="faq-answer-inner">
                                        <div
                                            style={{
                                                padding: "4px 24px 28px 24px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.7,
                                                    color: "#999",
                                                    whiteSpace: "pre-line",
                                                    display: "block",
                                                }}
                                            >
                                                {formatText(item.a)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ── Desktop HoloCard (wrapper holográfico para PortalCards) ── */
const HoloCard = ({ children, accent, onClick, style }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const glints = useMemo(
        () =>
            Array.from({ length: 8 }).map((_, i) => ({
                id: i,
                x: Math.random() * 88 + 6,
                y: Math.random() * 88 + 6,
                size: Math.random() * 3 + 1.2,
                delay: Math.random() * 3,
                duration: 3 + Math.random() * 3,
            })),
        []
    )
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            style={{
                position: "relative",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                overflow: "hidden",
                height: "100%",
                minHeight: 400,
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "-6%",
                    borderRadius: 20,
                    background: `radial-gradient(60% 80% at 50% 50%, ${A(0.12)}, transparent 70%)`,
                    filter: "blur(16px)",
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: `radial-gradient(100% 140% at 50% 15%, ${A(0.1)}, transparent 60%), linear-gradient(135deg, ${A(0.06)}, transparent 40%, ${A(0.1)}, transparent 70%)`,
                    border: `1.5px solid ${A(0.4)}`,
                    boxShadow: `0 0 12px ${A(0.25)}, 0 0 25px ${A(0.12)}, 0 10px 20px rgba(0,0,0,0.5)`,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        top: "-15%",
                        height: "30%",
                        left: "-40%",
                        width: "80%",
                        background: `linear-gradient(115deg, transparent, ${A(0.3)}, transparent)`,
                        filter: "blur(8px)",
                        transform: "rotate(8deg)",
                    }}
                    animate={{ left: ["-40%", "120%"], rotate: [8, 12, 8] }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 6,
                        borderRadius: 10,
                        border: `1px solid ${A(0.25)}`,
                        boxShadow: `0 0 10px ${A(0.15)} inset, 0 0 18px ${A(0.1)}`,
                        mixBlendMode: "screen",
                        pointerEvents: "none",
                    }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {glints.map((g) => (
                    <motion.div
                        key={g.id}
                        style={{
                            position: "absolute",
                            left: `${g.x}%`,
                            top: `${g.y}%`,
                            width: `${g.size}px`,
                            height: `${g.size}px`,
                            borderRadius: "50%",
                            background: A(0.7),
                            boxShadow: `0 0 6px ${A(0.5)}, 0 0 10px ${A(0.3)}`,
                        }}
                        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.4, 0.7] }}
                        transition={{
                            duration: g.duration,
                            repeat: Infinity,
                            delay: g.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    padding: "36px 36px 32px",
                }}
            >
                {children}
            </div>
        </motion.div>
    )
}

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function SE_DesktopModalsShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
SE_DesktopModalsShell.displayName = "SE_DesktopModals"

const DesktopModals = Object.assign(SE_DesktopModalsShell, {
    DeskModalOverlay,
    DeskCalendarHeader,
    DeskCalendlyModalView,
    DeskFAQModal,
    HoloCard,
})

export default DesktopModals
