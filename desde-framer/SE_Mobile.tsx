// SE_Mobile.tsx v1.11 — hideCamara: oculta la sección Cámara Solar + la tarjeta grupal del hero cuando el flag está ON (deja solo el 1:1). | v1.10 — "Lugares Disponibles" sin número (sin límite de cupo)
// v1.7 — Inmersión ya no lista "Grupo WhatsApp" en sus beneficios (filtro
// hardcode-over-Framer en el array de features + fallback limpio). La
// transmisión en vivo es la Cámara Solar semanal, no acompañamiento por chat.
// Componentes y shell del [LENTE] del split de Sesiones (sello SE_).
// Default export = SesionesMobile directo (no ghost — el componente principal
// ya cumple el contrato del componentLoader de Framer con body JSX renderable).
//
// Consumidor: Sesiones.tsx (shell) cuando isMobile === true.
//
// v1.6 (2026-05-22): espejo de SE_Desktop v1.7 — el .map de features
// fuerza el feature de Sesiones 1:1 al 33% OFF, normalizando cualquier
// saved viejo ("11% OFF en Sesiones 1:1" / "15% OFF en Sesiones
// Privadas") al copy canónico.
//
// v1.5 (2026-05-20): espejo de SE_Desktop.tsx v1.5 — el handler de
// ACTIVAR INMERSIÓN pre-rellena el email del Tripulante en Stripe
// Checkout (vía `withCheckoutIdentity` de SE_Shared). Cubre ambos
// paths del MobPassCard (`pass.link` + fallback `linkStripeMembSolar`).
//
// v1.4 (2026-05-20): espejo de SE_Desktop.tsx v1.4 — el
// feature "33% OFF en todos los Códices" de Inmersión Solar pasa a
// "Incluye 1 Códice gratuito por mes (a elección) + 33% OFF en todos
// los Códices" via regla hardcode-over-Framer-saved.
//
// v1.3 (2026-05-19): mini-leyenda dorada debajo del precio de la card
// holográfica — refuerza el dato del primer mes 1,555 MXN además del
// panel completo que ya vive debajo del botón ACTIVAR INMERSIÓN.
//
// v1.2 (2026-05-19): espejo de SE_Desktop.tsx v1.2 — la leyenda del
// Ciclo de Inducción se mueve de bajo el precio a un panel destacado
// DEBAJO del botón ACTIVAR INMERSIÓN, con tipografía mayor y el dato
// del primer mes en oro para que el tripulante no lo pase por alto.
//
// v1.1 (2026-05-19): protocolo de Inducción del Mes 1 para Inmersión
// Solar (espejo del cambio de SE_Desktop.tsx v1.1). Leyenda gris sutil
// bajo el precio en la card dorada + cupón `PRIMERMES` auto-aplicado en
// el handler de "ACTIVAR INMERSIÓN" (cubre tanto el path `pass.link`
// como el fallback `linkStripeMembSolar`).

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from "framer-motion"
import { createPortal } from "react-dom"
import CalendarioReservas from "./CalendarioReservas.tsx"
import type { SlotType } from "./useSolarBooking.tsx"
import Shared from "./SE_Shared.tsx"
import Icons from "./SE_Icons.tsx"

const {
    hexToRgba,
    formatText,
    GoldenButton,
    LugaresDisponibles,
    CalendlyEmbed,
    ScheduleInfo,
    NextSessionCountdown,
    MobileStarsBackground,
    useMembershipStatus,
    urlToSlotType,
    withCheckoutIdentity,
} = Shared

const {
    TimelineIcon,
    IconToroid,
    IconMerkabah,
    BENEFIT_ICON_MAP,
    VIP_ICONS,
} = Icons

/* ── Mobile Modal Overlay (NO body.overflow, via createPortal) ── */
const MobModalOverlay = ({ onClose, children }: any) => (
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
            padding: "20px 6px",
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

/* ── Mobile CalendarHeader (legacy fallback Calendly) ── */
const MobCalendarHeader = ({ onClose, rawUrl, accent }: any) => {
    const hA = (x: number) => hexToRgba(accent || "#00C2FF", x)
    return (
        <div
            style={{
                position: "relative",
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 25px",
                background:
                    "linear-gradient(180deg, rgba(10,18,32,0.98), rgba(8,12,20,0.95))",
                flexShrink: 0,
                zIndex: 20,
                borderBottom: `1px solid ${hA(0.12)}`,
            }}
        >
            <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                    if (rawUrl) window.location.href = rawUrl
                }}
                style={{
                    background: `linear-gradient(135deg, ${hA(0.08)}, ${hA(0.03)})`,
                    border: `1px solid ${hA(0.2)}`,
                    color: accent || "#00C2FF",
                    padding: "8px 16px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.85,
                    textShadow: `0 0 8px ${hA(0.3)}`,
                }}
            >
                Abrir en Calendly
            </motion.button>
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    right: 25,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `1px solid ${hA(0.2)}`,
                    background: "rgba(255,255,255,.05)",
                    color: "rgba(255,255,255,0.85)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    padding: 0,
                }}
            >
                <svg
                    width="10"
                    height="10"
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
    )
}

/* ── Mobile FAQ Modal (bottom sheet, NO body.overflow) ── */
const MobFAQModal = ({ onClose, items, accent }: any) => {
    const [exp, setExp] = useState<number | null>(null)
    if (!items || items.length === 0) return null
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxHeight: "85vh",
                    background:
                        "linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,10,20,.99))",
                    borderRadius: "20px 20px 0 0",
                    border: `1px solid ${hexToRgba(accent, 0.25)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "18px 20px 14px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexShrink: 0,
                        borderBottom: `1px solid ${hexToRgba(accent, 0.12)}`,
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "3px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.5)",
                            position: "absolute",
                            top: "8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.05rem",
                            fontWeight: 200,
                            margin: 0,
                            color: accent,
                            textTransform: "uppercase",
                            letterSpacing: ".1em",
                        }}
                    >
                        Preguntas Frecuentes
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accent, 0.2)}`,
                            background: "rgba(255,255,255,.05)",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
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
                    className="m-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px 16px 60px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    {items.map((item: any, i: number) => {
                        const isOpen = exp === i
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isOpen
                                        ? `linear-gradient(135deg, ${hexToRgba(accent, 0.06)}, transparent)`
                                        : "linear-gradient(135deg, rgba(255,255,255,.02), transparent)",
                                    border: `1px solid ${isOpen ? hexToRgba(accent, 0.4) : hexToRgba(accent, 0.08)}`,
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "border-color .15s",
                                }}
                                onClick={() => setExp(isOpen ? null : i)}
                            >
                                <div
                                    style={{
                                        padding: "14px 16px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: ".9rem",
                                            fontWeight: 400,
                                            color: isOpen ? "#FFF" : "#E6F7EF",
                                            opacity: isOpen ? 1 : 0.8,
                                            flex: 1,
                                            paddingRight: "8px",
                                        }}
                                    >
                                        {formatText(item.q)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "1.1rem",
                                            color: accent,
                                            opacity: 0.8,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition: "transform .2s",
                                            flexShrink: 0,
                                        }}
                                    >
                                        +
                                    </span>
                                </div>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div
                                                style={{
                                                    padding: "0 16px 16px 16px",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                    fontSize: ".85rem",
                                                    lineHeight: 1.7,
                                                    color: "#E6F7EF",
                                                    opacity: 0.65,
                                                }}
                                            >
                                                {formatText(item.a)}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ── Mobile Portal Card ── */
const MobPortalCard = ({
    accent,
    icon,
    title,
    subHeader,
    btnText,
    onClick,
    lugaresDisponibles,
    showLugares,
    onPassesClick,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            onClick={onClick}
            style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                cursor: "pointer",
                background: `radial-gradient(100% 140% at 50% 15%, ${A(0.12)}, transparent 60%), linear-gradient(135deg, ${A(0.06)}, transparent 40%, ${A(0.1)}, transparent 70%)`,
                border: `1.5px solid ${A(0.4)}`,
                boxShadow: `0 0 12px ${A(0.2)}, 0 10px 20px rgba(0,0,0,0.5)`,
                padding: "20px 18px 18px",
                textAlign: "center",
            }}
        >
            <div style={{ width: 56, height: 56, margin: "0 auto 12px" }}>
                {icon}
            </div>
            <h3
                style={{
                    fontSize: 18,
                    fontWeight: 300,
                    margin: "0 0 4px",
                    letterSpacing: "0.12em",
                    color: "#E6F7EF",
                    textShadow: `0 0 16px ${A(0.25)}`,
                }}
            >
                {title}
            </h3>
            {subHeader && (
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.25em",
                        color: accent,
                        textShadow: `0 0 10px ${A(0.5)}`,
                        marginBottom: 2,
                        textTransform: "uppercase",
                    }}
                >
                    {subHeader}
                </div>
            )}
            <div style={{ marginTop: 14 }}>
                <GoldenButton
                    subtle
                    text={btnText}
                    style={{
                        pointerEvents: "none",
                        padding: "12px 24px",
                        fontSize: 12,
                    }}
                />
            </div>
            {showLugares && lugaresDisponibles > 0 && (
                <div style={{ marginTop: 10 }}>
                    <LugaresDisponibles
                        count={lugaresDisponibles}
                        accent={accent}
                        compact
                    />
                </div>
            )}
            {onPassesClick && (
                <div
                    onClick={(e: any) => {
                        e.stopPropagation()
                        onPassesClick()
                    }}
                    style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        color: accent,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase" as const,
                        opacity: 0.6,
                        cursor: "pointer",
                        padding: "6px 0 2px",
                    }}
                >
                    VER PASES DE ACCESO ↓
                </div>
            )}
        </motion.div>
    )
}

/* ── Mobile Vertical Timeline ── */
const MobTimeline = ({ items, accent, scrollRoot }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [expanded, setExpanded] = useState<number | null>(null)
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, root: scrollRoot }}
            style={{ marginBottom: 40 }}
        >
            <div style={{ position: "relative", paddingLeft: 62 }}>
                <div
                    style={{
                        position: "absolute",
                        left: 25,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: accent,
                        boxShadow: `0 0 8px ${accent}`,
                        opacity: 0.5,
                    }}
                />
                {(items || []).map((item: any, i: number) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, root: scrollRoot }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        style={{
                            marginBottom: 28,
                            cursor: "pointer",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: -62,
                                top: -2,
                                width: 52,
                                height: 52,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    border: `1.5px solid ${expanded === i ? A(0.6) : A(0.25)}`,
                                    boxShadow:
                                        expanded === i
                                            ? `0 0 16px ${A(0.4)}`
                                            : `0 0 6px ${A(0.1)}`,
                                    transition: "all 0.3s",
                                }}
                            />
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 50% 40%, ${A(0.12)}, #080C14 70%)`,
                                    border: `2px solid ${expanded === i ? accent : A(0.45)}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow:
                                        expanded === i
                                            ? `0 0 12px ${A(0.5)}`
                                            : `0 0 4px ${A(0.15)}`,
                                    transition: "all 0.3s",
                                }}
                            >
                                <div style={{ transform: "scale(0.55)" }}>
                                    <TimelineIcon
                                        type={item.icon}
                                        color={accent}
                                    />
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#E6F7EF",
                                marginBottom: 2,
                            }}
                        >
                            {formatText(item.time)}
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: accent,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: 4,
                            }}
                        >
                            {formatText(item.title)}
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                color: "#999",
                                lineHeight: 1.5,
                            }}
                        >
                            {formatText(item.desc)}
                        </div>
                        <AnimatePresence>
                            {expanded === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: "#bbb",
                                            lineHeight: 1.6,
                                            marginTop: 8,
                                        }}
                                    >
                                        {formatText(item.descLarga)}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
                <div
                    style={{
                        position: "absolute",
                        left: 20,
                        bottom: -12,
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `10px solid ${accent}`,
                        opacity: 0.5,
                        filter: `drop-shadow(0 0 4px ${accent})`,
                    }}
                />
            </div>
        </motion.div>
    )
}

/* ── Mobile Benefit Cards ── */
const MobBenefitCards = ({ items, accent, scrollRoot }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [openSet, setOpenSet] = useState<Set<number>>(new Set())
    const toggle = (i: number) =>
        setOpenSet((prev) => {
            const n = new Set(prev)
            if (n.has(i)) n.delete(i)
            else n.add(i)
            return n
        })
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 40,
            }}
        >
            {(items || []).slice(0, 4).map((item: any, i: number) => {
                const Icon =
                    BENEFIT_ICON_MAP[item.icon] || BENEFIT_ICON_MAP["spiral"]
                const isOpen = openSet.has(i)
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, root: scrollRoot }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => toggle(i)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            borderRadius: 14,
                            padding: "18px 16px",
                            cursor: "pointer",
                            overflow: "hidden",
                            background: isOpen
                                ? `linear-gradient(135deg, ${A(0.1)}, ${A(0.03)})`
                                : `linear-gradient(135deg, ${A(0.05)}, transparent)`,
                            border: `1.5px solid ${isOpen ? A(0.4) : A(0.2)}`,
                            transition: "all 0.2s",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                position: "relative",
                                minHeight: 36,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    flexShrink: 0,
                                    filter: `drop-shadow(0 0 8px ${A(0.4)})`,
                                    zIndex: 2,
                                }}
                            >
                                <Icon color={accent} />
                            </div>
                            <h5
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#E6F7EF",
                                    margin: 0,
                                    textAlign: "center",
                                    pointerEvents: "none",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {formatText(item.title)}
                            </h5>
                            <div style={{ flex: 1 }} />
                            <motion.span
                                animate={{ rotate: isOpen ? 45 : 0 }}
                                style={{
                                    fontSize: 16,
                                    color: accent,
                                    opacity: 0.5,
                                    fontWeight: 200,
                                    flexShrink: 0,
                                    zIndex: 2,
                                }}
                            >
                                +
                            </motion.span>
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: "#999",
                                            lineHeight: 1.55,
                                            margin: "10px 0 0 0",
                                            textAlign: "center",
                                        }}
                                    >
                                        {formatText(item.desc)}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
            })}
        </div>
    )
}

/* ── Mobile Pass Schedule Strip ── */
const MobPassScheduleStrip = ({
    accent,
    isGold,
}: {
    accent: string
    isGold?: boolean
}) => {
    const stripColor = isGold ? "#D4A843" : accent
    const A = (x: number) => hexToRgba(stripColor, x)
    const [localTime, setLocalTime] = useState("")
    useEffect(() => {
        try {
            const d = new Date()
            d.setUTCHours(17, 30, 0, 0)
            const f = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            setLocalTime(
                f
                    .formatToParts(d)
                    .filter((p) =>
                        ["hour", "minute", "literal", "dayPeriod"].includes(
                            p.type
                        )
                    )
                    .map((p) => p.value)
                    .join("")
            )
        } catch {
            setLocalTime("")
        }
    }, [])
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${A(0.12)}`,
                background: `linear-gradient(135deg, ${A(0.04)}, transparent)`,
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    color: "rgba(230,247,239,0.5)",
                    letterSpacing: "0.1em",
                    fontWeight: 400,
                    textTransform: "uppercase" as const,
                }}
            >
                Martes 12:30 pm (UTC-5)
            </span>
            {localTime && (
                <span
                    style={{
                        fontSize: 12,
                        color: stripColor,
                        letterSpacing: "0.06em",
                        fontWeight: 500,
                        opacity: 0.85,
                        textShadow: `0 0 10px ${A(0.35)}`,
                        textTransform: "uppercase" as const,
                    }}
                >
                    Tu hora local: {localTime}
                </span>
            )}
        </div>
    )
}

/* ── Mobile Explainer ── */
const MobExplainer = ({
    accent,
    videoUrl,
    videoHeight,
    scrollRoot,
    subtitle,
    elementosClave,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [openPillars, setOpenPillars] = useState<Set<number>>(new Set())
    const toggleP = (i: number) =>
        setOpenPillars((prev) => {
            const n = new Set(prev)
            if (n.has(i)) n.delete(i)
            else n.add(i)
            return n
        })
    const pillars =
        elementosClave && elementosClave.length > 0
            ? elementosClave
            : [
                  {
                      icon: "◈",
                      title: "RECALIBRACIÓN DE FRECUENCIA",
                      desc: "Pasamos de la alerta de supervivencia a la regeneración parasimpática.",
                  },
                  {
                      icon: "◎",
                      title: "Sintonizar el Poder del Toroide",
                      desc: "La coherencia de un grupo enfocado amplifica tu capacidad de manifestación.",
                  },
                  {
                      icon: "🪞",
                      title: "Presenciar el Espejo Fractal",
                      desc: "La duda de uno es la medicina de todos.",
                  },
              ]
    return (
        <div style={{ marginBottom: 40 }}>
            <div
                style={{
                    height: 1,
                    maxWidth: 200,
                    margin: "0 auto 24px",
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }}
            />
            {videoUrl && (
                <div
                    style={{
                        width: "100%",
                        borderRadius: 14,
                        overflow: "hidden",
                        border: `1px solid ${A(0.2)}`,
                        marginBottom: 20,
                        background: "#000",
                    }}
                >
                    <video
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                            width: "100%",
                            height: videoHeight || "auto",
                            aspectRatio: videoHeight ? undefined : "784/878",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                </div>
            )}
            <p
                style={{
                    fontSize: 16,
                    color: "#E6F7EF",
                    margin: "0 0 14px",
                    lineHeight: 1.6,
                    fontWeight: 300,
                    textAlign: "center",
                }}
            >
                La Cámara Solar es un espacio de sesiones grupales en vivo
                guiadas por{" "}
                <span style={{ color: "#D4A843", fontWeight: 400 }}>
                    Zak'Haar
                </span>
                .
            </p>
            {(subtitle || "").split(/\\n|\n/).map((line: string, i: number) => (
                <p
                    key={i}
                    style={{
                        fontSize: 16,
                        color: "#E6F7EF",
                        margin: "0 0 14px",
                        lineHeight: 1.6,
                        fontWeight: 300,
                        textAlign: "left",
                    }}
                >
                    {line.trim() === "" ? "\u00A0" : formatText(line)}
                </p>
            ))}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 16,
                }}
            >
                {pillars.map((p: any, i: number) => {
                    const isOpen = openPillars.has(i)
                    return (
                        <div
                            key={i}
                            onClick={() => toggleP(i)}
                            style={{
                                padding: "12px",
                                borderRadius: 10,
                                cursor: "pointer",
                                border: `1px solid ${isOpen ? A(0.3) : A(0.12)}`,
                                background: isOpen
                                    ? `linear-gradient(145deg, ${A(0.07)}, ${A(0.02)})`
                                    : `linear-gradient(145deg, ${A(0.03)}, transparent)`,
                                transition: "all 0.2s",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 14,
                                        color: accent,
                                        width: 26,
                                        height: 26,
                                        borderRadius: 5,
                                        border: `1px solid ${A(0.2)}`,
                                        background: A(0.05),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {p.icon}
                                </div>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#E6F7EF",
                                        flex: 1,
                                    }}
                                >
                                    {p.title}
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 45 : 0 }}
                                    style={{
                                        fontSize: 16,
                                        color: accent,
                                        opacity: 0.5,
                                        fontWeight: 200,
                                    }}
                                >
                                    +
                                </motion.span>
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#999",
                                                lineHeight: 1.6,
                                                margin: "8px 0 0 36px",
                                            }}
                                        >
                                            {formatText(p.desc)}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── Mobile Pass Card ── */
const MobPassCard = ({
    pass,
    accent,
    isGold,
    onClick,
    scrollRoot,
    lugaresDisponibles,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const glowColor = isGold ? "#D4A843" : accent
    const GC = (x: number) => hexToRgba(glowColor, x)
    /* v1.4 — Forzar el feature del 33% en Códices para Inmersión Solar
       (regla hardcode-over-Framer-saved).
       v1.6 (2026-05-22) — Espejo de SE_Desktop v1.7 — forzar el feature
       canónico de Sesiones 1:1 al 33% OFF. Captura cualquier saved con
       porcentaje + "Sesiones 1:1" o "Sesiones Privadas". */
    let feats = (pass.features || "")
        .split("\n")
        .filter(Boolean)
        /* Inmersión ya NO incluye "Grupo WhatsApp" — su valor en vivo es la
           transmisión semanal de Cámara Solar, no acompañamiento por chat. */
        .filter((f: string) => !/whats\s*app/i.test(f))
        /* El 33% OFF en Sesiones 1:1 ya no es un beneficio (2026-06-09):
           quitamos cualquier bullet de descuento en sesiones 1:1 / privadas. */
        .filter(
            (f: string) =>
                !(
                    (/sesion(es)?\s*1\s*[:a]\s*1/i.test(f) ||
                        /sesion(es)?\s+privad/i.test(f)) &&
                    /\d+\s*%/.test(f)
                )
        )
        .map((f: string) => {
            /* Códices: solo el Códice gratuito mensual, sin el 33% OFF. */
            if (/c[óo]dice/i.test(f) && /\d+\s*%/.test(f))
                return "Incluye 1 Códice gratuito por mes (a elección)"
            return f
        })
    if (isGold) {
        /* Orden pedido (2026-06-09): sesiones grupales → grabación → Códice →
           PDFs → resto; y "Incluye todos los beneficios de Sintonía Solar"
           SIEMPRE al final. */
        const rank = (f: string) => {
            if (/sesion(es)?\s+grupal|todas las sesiones/i.test(f)) return 1
            if (/grabaci/i.test(f)) return 2
            if (/c[óo]dice/i.test(f)) return 3
            if (/pdf|integraci/i.test(f)) return 4
            return 5
        }
        feats = feats
            .map((f: string, i: number): [string, number] => [f, i])
            .sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1])
            .map((x: [string, number]) => x[0])
        if (!feats.some((f: string) => /beneficios de sinton/i.test(f)))
            feats = [...feats, "Incluye todos los beneficios de Sintonía Solar"]
    }
    const features = feats
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, root: scrollRoot }}
        >
            <div
                style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    marginBottom: 20,
                    position: "relative",
                    background: isGold
                        ? "linear-gradient(165deg, rgba(30,25,15,0.95), rgba(40,32,15,0.85))"
                        : `linear-gradient(165deg, rgba(8,12,20,0.95), ${A(0.08)})`,
                    border: `2px solid ${isGold ? "rgba(212,168,67,0.45)" : A(0.3)}`,
                    boxShadow: `0 0 24px ${GC(0.12)}, 0 12px 30px rgba(0,0,0,0.5)`,
                    padding: "28px 20px",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                        background: `linear-gradient(115deg, transparent 20%, ${GC(0.06)} 35%, rgba(255,255,255,0.03) 45%, ${GC(0.07)} 55%, transparent 65%)`,
                        backgroundSize: "400% 100%",
                        animation: "holo-shimmer 6s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 8,
                        borderRadius: 12,
                        border: `1px solid ${GC(0.12)}`,
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        textAlign: "center",
                    }}
                >
                    {isGold && (
                        <div
                            style={{
                                background:
                                    "linear-gradient(135deg, #D4A843, #F5D98C)",
                                color: "#000",
                                fontSize: 8,
                                padding: "3px 10px",
                                borderRadius: 4,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                display: "inline-block",
                                marginBottom: 12,
                                letterSpacing: "0.1em",
                            }}
                        >
                            Recomendado
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: 9,
                            color: GC(0.55),
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.18em",
                            marginBottom: 5,
                        }}
                    >
                        {pass.tag}
                    </div>
                    <h3
                        style={{
                            fontSize: 22,
                            fontWeight: 300,
                            color: "#E6F7EF",
                            margin: "0 0 10px",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {formatText(pass.name)}
                    </h3>
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 600,
                            color: glowColor,
                            textShadow: `0 0 14px ${GC(0.35)}`,
                            marginBottom: 10,
                        }}
                    >
                        {/* v2.5 — hardcode por isGold (regla
                           hardcode-over-Framer-saved). */}
                        {isGold ? "1,111 MXN / mes" : "555 MXN"}
                    </div>
                    {/* Mini-leyenda de primer mes removida — Inmersión es 1,111 MXN/mes flat. */}
                    <MobPassScheduleStrip accent={accent} isGold={isGold} />
                    <p
                        style={{
                            fontSize: 13,
                            color: "#999",
                            lineHeight: 1.5,
                            margin: "0 0 20px 0",
                            textAlign: isGold ? "left" : "center",
                        }}
                    >
                        {formatText((pass.desc || "").replace(/todos los martes/gi, "Martes"))}
                    </p>
                </div>
                {isGold ? (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginBottom: 18,
                        }}
                    >
                        {features.map((f: string, i: number) => {
                            const Icon = VIP_ICONS[i % VIP_ICONS.length]
                            return (
                                <div
                                    key={i}
                                    style={{
                                        borderRadius: 12,
                                        padding: "14px 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        background: `linear-gradient(155deg, ${GC(0.04)}, rgba(10,12,20,0.5))`,
                                        border: `1px solid ${GC(0.15)}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            flexShrink: 0,
                                            filter: `drop-shadow(0 0 5px ${GC(0.25)})`,
                                        }}
                                    >
                                        <Icon color={glowColor} />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "#ccc",
                                            lineHeight: 1.4,
                                            fontWeight: 300,
                                        }}
                                    >
                                        {formatText(f)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            marginBottom: 18,
                        }}
                    >
                        {features.map((f: string, i: number) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 5,
                                        background: `linear-gradient(145deg, ${GC(0.1)}, ${GC(0.03)})`,
                                        border: `1px solid ${GC(0.18)}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: glowColor,
                                            fontSize: 10,
                                        }}
                                    >
                                        ✦
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#ccc",
                                        lineHeight: 1.4,
                                        fontWeight: 300,
                                    }}
                                >
                                    {f}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ position: "relative", zIndex: 2 }}>
                    {lugaresDisponibles > 0 && isGold && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                marginBottom: 12,
                                padding: "9px 18px",
                                borderRadius: 50,
                                border: "1px solid rgba(212,168,67,0.3)",
                                background:
                                    "linear-gradient(135deg, rgba(212,168,67,0.07), transparent)",
                            }}
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.6, 1, 0.6],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#D4A843",
                                    boxShadow: "0 0 6px #D4A843",
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    color: "#D4A843",
                                    textTransform: "uppercase",
                                }}
                            >
                                Lugares Disponibles
                            </span>
                        </div>
                    )}
                    <GoldenButton
                        text={formatText(
                            isGold ? "ACTIVAR INMERSIÓN" : "RESERVAR MI LUGAR"
                        )}
                        onClick={onClick}
                        style={{ borderRadius: 12 }}
                    />
                    {/* v1.2 — Leyenda visible DEBAJO del botón ACTIVAR
                       INMERSIÓN. Panel con borde dorado tenue + dato del
                       primer mes en oro para que el tripulante no pase
                       por alto el ciclo del cupón PRIMERMES. Sólo en la
                       card dorada. */}
                    {isGold && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: "10px 14px",
                                borderRadius: 11,
                                border: "1px solid rgba(212,168,67,0.28)",
                                background:
                                    "linear-gradient(135deg, rgba(212,168,67,0.07), rgba(212,168,67,0.02))",
                                fontSize: 12,
                                color: "rgba(255,235,200,0.88)",
                                fontWeight: 400,
                                lineHeight: 1.5,
                                letterSpacing: "0.01em",
                                textAlign: "center",
                            }}
                        >
                            <strong
                                style={{
                                    color: "#D4A843",
                                    fontWeight: 700,
                                }}
                            >
                                1,111 MXN
                            </strong>{" "}
                            al mes. Cancela en cualquier momento.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

/* ── Mobile Floating Buttons ── */
const MobFloating = ({
    onFaqClick,
    onScrollTop,
    show,
    accent,
    showFaq,
    modalOpen,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        if (show && !mounted) setMounted(true)
    }, [show])
    if (!mounted) return null
    const visible = show && !showFaq && !modalOpen
    const btnStyle = (a: typeof A) => ({
        width: 44,
        height: 44,
        borderRadius: "14px 0 0 14px",
        borderTop: `1px solid ${a(0.1)}`,
        borderBottom: `1px solid ${a(0.1)}`,
        borderLeft: `1px solid ${a(0.1)}`,
        borderRight: `2px solid ${a(0.5)}`,
        background: "rgba(8,12,20,0.95)",
        backdropFilter: "blur(12px)",
        color: a(0.65),
        cursor: "pointer",
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        outline: "none",
        boxShadow: `-4px 0 15px ${a(0.05)}`,
        paddingRight: 4,
    })
    return (
        <div
            style={{
                position: "fixed",
                bottom: 40,
                right: 0,
                zIndex: 99998,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
                pointerEvents: visible ? "auto" : "none",
            }}
        >
            <button onClick={onFaqClick} style={btnStyle(A)}>
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" strokeWidth="2" />
                </svg>
            </button>
            <button onClick={onScrollTop} style={btnStyle(A)}>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SesionesMobile — Main mobile component (default export)
   ═══════════════════════════════════════════════════════════════════════════ */
function SesionesMobile(props: any) {
    const {
        domoMode,
        hideCamara = false,
        bgColor,
        accentColor = "#00C2FF",
        textColor = "#E6F7EF",
        numStars = 90,
        warpSpeed = 1,
        mobileVideoHeight = 310,
        mobileSolarTitleSize = 36,
        mobileDurationTitleSize = 26,
        mobileBenefitsTitleSize = 26,
        mobileEligeTitleSize = 26,
        mobileResonanciaTitleSize = 36,
        cardLeftTitle,
        cardLeftSubHeader,
        cardLeftBtn,
        cardRightTitle,
        cardRightSubHeader,
        cardRightBtn,
        calUrl30 = "",
        calUrl45 = "",
        calUrl60 = "",
        memberCalUrl30 = "",
        memberCalUrl45 = "",
        memberCalUrl60 = "",
        calUrlGroup = "",
        mobileCalendarCropTop,
        calendarCropTop,
        mobileCalendarHeight,
        calendarHeight: deskCalH,
        faqs = [],
        solarPasses = [],
        linkStripeMembSolar = "#",
        timelineItems = [],
        benefitsGrupal = [],
        resSectionDesc = "",
        res30Name,
        res45Name,
        res60Name,
        lugaresDisponibles = 0,
        camaraSolarVideo = "",
        camaraSolarSubtitle = "",
        elementosClave = [],
        supabaseUrl = "",
        supabaseAnonKey = "",
        procesarIgnicionPagoUrl = "",
    } = props
    const isActiveMember = useMembershipStatus(supabaseUrl, supabaseAnonKey)
    const accent = accentColor || "#00C2FF"
    const A = (x: number) => hexToRgba(accent, x)
    const mobCropTop = mobileCalendarCropTop ?? calendarCropTop ?? -10
    const mobCalH = mobileCalendarHeight ?? deskCalH ?? 570
    const [modalMode, setModalMode] = useState<"calendly" | null>(null)
    const [activeCalendlyUrl, setActiveCalendlyUrl] = useState<string | null>(
        null
    )
    const [activeSlotType, setActiveSlotType] = useState<SlotType | null>(null)
    const [showFaq, setShowFaq] = useState(false)
    const [mobCalLoading, setMobCalLoading] = useState(true)
    const [showFloating, setShowFloating] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const section2Ref = useRef<HTMLDivElement>(null)
    const section3Ref = useRef<HTMLDivElement>(null)
    const passesRef = useRef<HTMLDivElement>(null)
    const floatRef = useRef(false)
    const { scrollY } = useScroll({ container: scrollRef })
    const heroOpacity = useTransform(scrollY, [300, 600], [1, 0])
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 700) {
            if (!floatRef.current) floatRef.current = true
            setShowFloating(true)
        } else if (latest < 600) {
            floatRef.current = false
            setShowFloating(false)
        }
    })

    useEffect(() => {
        if (modalMode === "calendly" && activeCalendlyUrl) {
            setMobCalLoading(true)
            const t = setTimeout(() => setMobCalLoading(false), 2200)
            return () => clearTimeout(t)
        }
    }, [modalMode, activeCalendlyUrl])

    /* ── Force repaint after modal close (iOS lock/unlock fix) ── */
    const forceRepaint = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const pos = el.scrollTop
        el.style.display = "none"
        void el.offsetHeight
        el.style.display = ""
        el.scrollTop = pos
        requestAnimationFrame(() => {
            el.scrollTop = pos
        })
    }, [])
    const closeModal = useCallback(() => {
        setModalMode(null)
        setActiveCalendlyUrl(null)
        setActiveSlotType(null)
        setTimeout(forceRepaint, 50)
        setTimeout(forceRepaint, 300)
    }, [forceRepaint])
    const closeFaq = useCallback(() => {
        setShowFaq(false)
        setTimeout(forceRepaint, 50)
    }, [forceRepaint])
    /* ── iOS: force repaint when returning from lock screen ── */
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible") {
                setTimeout(forceRepaint, 100)
                setTimeout(forceRepaint, 500)
            }
        }
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [forceRepaint])

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showFaq) closeFaq()
                else if (modalMode) closeModal()
            }
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [modalMode, showFaq, closeModal, closeFaq])
    const scrollToTop = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ top: 0, behavior: "smooth" })
        setTimeout(() => {
            if (el.scrollTop > 0) el.scrollTop = 0
        }, 600)
    }, [])
    const scrollToSection = useCallback(
        (ref: React.RefObject<HTMLDivElement | null>) => {
            const el = ref.current,
                c = scrollRef.current
            if (!el || !c) return
            c.scrollTo({ top: el.offsetTop - 65, behavior: "smooth" })
        },
        []
    )
    const openCalendly = (url: string, slotType?: SlotType) => {
        setActiveCalendlyUrl(url)
        setActiveSlotType(slotType ?? null)
        setModalMode("calendly")
    }
    /* v2.12 — Cada plan 1:1 con memberPrice + memberUrl. Render del precio
       y onClick los usan cuando isActiveMember es true (888 / 1,111 / 1,444). */
    const plans: Array<{
        time: string
        name: string
        price: string
        memberPrice: string
        url: string
        memberUrl: string
        slotType: SlotType
    }> = [
        {
            time: "30 min",
            name: res30Name || "Afinación Rápida",
            price: "1,333 MXN",
            memberPrice: "888 MXN",
            url: calUrl30,
            memberUrl: memberCalUrl30 || "",
            slotType: "individual_30",
        },
        {
            time: "45 min",
            name: res45Name || "Recalibración",
            price: "1,777 MXN",
            memberPrice: "1,111 MXN",
            url: calUrl45,
            memberUrl: memberCalUrl45 || "",
            slotType: "individual_45",
        },
        {
            time: "60 min",
            name: res60Name || "Reconfiguración Profunda",
            price: "2,222 MXN",
            memberPrice: "1,444 MXN",
            url: calUrl60,
            memberUrl: memberCalUrl60 || "",
            slotType: "individual_60",
        },
    ]

    return (
        <div
            style={{
                width: "100%",
                height: "100dvh",
                position: "relative",
                overflow: "hidden",
                background: domoMode ? "transparent" : bgColor || "#0B0C13",
            }}
        >
            {!domoMode && (
                <MobileStarsBackground
                    num={Math.floor((numStars || 90) * 0.6)}
                    speed={warpSpeed}
                    bgColor={bgColor}
                />
            )}
            <div
                ref={scrollRef}
                className="m-scroll"
                style={{
                    color: textColor || "#E6F7EF",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        padding: "0 16px 120px",
                    }}
                >
                    {/* ── HERO ── */}
                    <motion.div
                        style={{
                            minHeight: "auto",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            paddingTop: 65,
                            opacity: heroOpacity,
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontWeight: 100,
                                fontSize: 34,
                                letterSpacing: "0.28em",
                                textAlign: "center",
                                margin: "0 0 24px",
                                textTransform: "uppercase",
                                lineHeight: 1.3,
                                animation: "sf-breath 7s ease-in-out infinite",
                                filter: `drop-shadow(0 0 12px ${A(0.4)})`,
                            }}
                        >
                            <span
                                style={{
                                    display: "block",
                                    background: `linear-gradient(180deg, ${accent}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                SESIONES DE
                            </span>
                            <span
                                style={{
                                    display: "block",
                                    background: `linear-gradient(180deg, ${accent}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                CALIBRACIÓN
                            </span>
                        </h1>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                            }}
                        >
                            {!hideCamara && (
                                <MobPortalCard
                                    accent={accent}
                                    icon={
                                        <IconToroid color="#D4A843" size={56} />
                                    }
                                    title={formatText(cardLeftTitle)}
                                    subHeader={formatText(cardLeftSubHeader)}
                                    btnText={formatText(cardLeftBtn)}
                                    onClick={() => scrollToSection(section2Ref)}
                                    lugaresDisponibles={lugaresDisponibles}
                                    showLugares
                                    onPassesClick={() =>
                                        scrollToSection(passesRef)
                                    }
                                />
                            )}
                            <MobPortalCard
                                accent={accent}
                                icon={
                                    <IconMerkabah color="#D4A843" size={56} />
                                }
                                /* v2.13 — subHeader: null en Lente. Con la card
                                   ya mostrando ícono + título + botón "Explorar",
                                   agregar subtítulo la hacía demasiado alta. */
                                title="SESIONES 1:1"
                                subHeader={null}
                                btnText="Explorar"
                                onClick={() => scrollToSection(section3Ref)}
                                showLugares={false}
                            />
                        </div>
                    </motion.div>
                    <div style={{ height: "12vh", minHeight: 60 }} />
                    {!hideCamara && (
                        <>
                    {/* ── CÁMARA SOLAR ── */}
                    <div ref={section2Ref}>
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                            <h2
                                style={{
                                    fontSize: mobileSolarTitleSize || 36,
                                    fontWeight: 200,
                                    margin: "0 0 8px",
                                    letterSpacing: "0.13em",
                                    textTransform: "uppercase",
                                    background: `linear-gradient(180deg, ${accent}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: `drop-shadow(0 0 14px ${A(0.4)})`,
                                }}
                            >
                                CÁMARA SOLAR
                            </h2>
                            <div
                                style={{
                                    fontSize: 13,
                                    letterSpacing: "0.14em",
                                    color: "rgba(230,247,239,0.65)",
                                    fontWeight: 300,
                                    textTransform: "uppercase",
                                    lineHeight: 1.2,
                                }}
                            >
                                <motion.div
                                    animate={{
                                        textShadow: [
                                            `0 0 5px ${A(0.3)}`,
                                            `0 0 12px ${A(0.7)}`,
                                            `0 0 5px ${A(0.3)}`,
                                        ],
                                        color: [accent, "#FFF", accent],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                    }}
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        margin: "0 0 6px",
                                    }}
                                >
                                    SESIONES GRUPALES ONLINE
                                </motion.div>
                                <div style={{ margin: "0 0 12px" }}>
                                    MARTES VIA ZOOM
                                </div>
                            </div>
                            <ScheduleInfo accent={accent} />
                        </div>
                        <MobExplainer
                            accent={accent}
                            videoUrl={camaraSolarVideo}
                            videoHeight={mobileVideoHeight}
                            scrollRoot={scrollRef}
                            subtitle={camaraSolarSubtitle}
                            elementosClave={elementosClave}
                        />
                        <motion.button
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, root: scrollRef }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => scrollToSection(passesRef)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                width: "100%",
                                padding: "16px 0",
                                border: "none",
                                background: "transparent",
                                color: accent,
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase" as const,
                                cursor: "pointer",
                                fontFamily: "'Inter', sans-serif",
                                marginTop: 8,
                                outline: "none",
                                opacity: 0.7,
                            }}
                        >
                            VER PASES DE ACCESO ↓
                        </motion.button>
                        <div style={{ height: "20vh", minHeight: 100 }} />
                        <motion.h4
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, root: scrollRef }}
                            style={{
                                textAlign: "center",
                                fontSize: mobileDurationTitleSize || 18,
                                fontWeight: 300,
                                color: "#E6F7EF",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                marginBottom: 16,
                                textShadow: `0 0 8px ${A(0.25)}`,
                            }}
                        >
                            DURACIÓN: 60 MINUTOS
                            <br />
                            <span
                                style={{
                                    fontSize: "0.85em",
                                    color: "rgba(230,247,239,0.55)",
                                }}
                            >
                                VIA ZOOM
                            </span>
                        </motion.h4>
                        <MobTimeline
                            items={timelineItems}
                            accent={accent}
                            scrollRoot={scrollRef}
                        />
                        <div style={{ height: "20vh", minHeight: 100 }} />
                        <motion.h4
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, root: scrollRef }}
                            style={{
                                textAlign: "center",
                                fontSize: mobileBenefitsTitleSize || 16,
                                fontWeight: 300,
                                color: "#E6F7EF",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginBottom: 20,
                            }}
                        >
                            LO QUE VAS A EXPERIMENTAR
                        </motion.h4>
                        <MobBenefitCards
                            items={(benefitsGrupal || []).map((b: any) => ({ ...b, title: (b.title || "").replace(/\bED DE ANCLAJE\b/gi, "RED DE ANCLAJE") }))}
                            accent={accent}
                            scrollRoot={scrollRef}
                        />
                        <div style={{ height: "20vh", minHeight: 100 }} />
                        <div ref={passesRef} />
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, root: scrollRef }}
                            style={{ textAlign: "center", marginBottom: 30 }}
                        >
                            <h3
                                style={{
                                    fontSize: mobileEligeTitleSize || 20,
                                    fontWeight: 200,
                                    color: "#E6F7EF",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    margin: "0 0 6px",
                                }}
                            >
                                ELIGE TU ENTRADA
                            </h3>
                            <div
                                style={{
                                    height: 1,
                                    maxWidth: 180,
                                    margin: "0 auto",
                                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                                }}
                            />
                        </motion.div>
                        <MobPassCard
                            pass={
                                (solarPasses || [])[0] || {
                                    name: "PASE DE\nEXPLORACIÓN",
                                    price: "555 MXN",
                                    tag: "Opción Flexible",
                                    desc: "",
                                    features:
                                        "Acceso a 1 sesión grupal en vivo",
                                    btnText: "RESERVAR MI LUGAR",
                                }
                            }
                            accent={accent}
                            isGold={false}
                            scrollRoot={scrollRef}
                            onClick={() =>
                                openCalendly(
                                    ((solarPasses || [])[0] || {})
                                        .calendlyUrl || calUrlGroup,
                                    "grupal_pulsar"
                                )
                            }
                            lugaresDisponibles={lugaresDisponibles}
                        />
                        <NextSessionCountdown accent={accent} compact />
                        <div style={{ height: "20vh", minHeight: 140 }} />
                        <MobPassCard
                            pass={
                                (solarPasses || [])[1] || {
                                    name: "INMERSIÓN SOLAR",
                                    price: "1,111 MXN / mes",
                                    tag: "Compromiso Total",
                                    desc: "",
                                    features:
                                        "Todas las Sesiones\n15% OFF en Códices y Sesiones 1:1\nPDFs post-sesión\nGrabaciones",
                                    btnText: "ACTIVAR INMERSIÓN",
                                }
                            }
                            accent={accent}
                            isGold
                            scrollRoot={scrollRef}
                            onClick={() => {
                                const p2 = (solarPasses || [])[1] || {}
                                const link = "https://buy.stripe.com/00wcMY1eRcVc4WBh1O0RG0D"
                                /* v1.5 — withCheckoutIdentity pre-rellena
                                   el email del Tripulante + manda el
                                   client_reference_id (Clerk user id) para
                                   que el webhook enlace la suscripción al
                                   perfil correcto.
                                   v1.1 — Cupón PRIMERMES auto-aplicado:
                                   primer mes 1,555 MXN, renovación 1,999. */
                                const applyPromo = (url: string) =>
                                    withCheckoutIdentity(url)
                                if (link && link !== "#" && link !== "")
                                    window.location.href = applyPromo(link)
                                else if (
                                    linkStripeMembSolar &&
                                    linkStripeMembSolar !== "#"
                                )
                                    window.location.href =
                                        applyPromo(linkStripeMembSolar)
                            }}
                            lugaresDisponibles={lugaresDisponibles}
                        />
                    </div>
                    <div style={{ height: "12vh", minHeight: 60 }} />
                    <div
                        style={{
                            height: 1,
                            maxWidth: 180,
                            margin: "0 auto",
                            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        }}
                    />
                    <div style={{ height: "12vh", minHeight: 60 }} />
                        </>
                    )}
                    {/* ── CÁMARA DE RESONANCIA ── */}
                    <div ref={section3Ref} id="resonancia">
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                            <h2
                                style={{
                                    fontSize: mobileResonanciaTitleSize || 24,
                                    fontWeight: 200,
                                    margin: "0 0 14px",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    filter: `drop-shadow(0 0 14px ${A(0.4)})`,
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        background: `linear-gradient(180deg, ${accent}, #fff)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    CÁMARA DE
                                </span>
                                <span
                                    style={{
                                        display: "block",
                                        background: `linear-gradient(180deg, ${accent}, #fff)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    RESONANCIA
                                </span>
                            </h2>
                            <div
                                style={{
                                    fontSize: 13,
                                    letterSpacing: "0.14em",
                                    color: "rgba(230,247,239,0.65)",
                                    fontWeight: 300,
                                    textTransform: "uppercase",
                                    lineHeight: 1.2,
                                }}
                            >
                                <motion.div
                                    animate={{
                                        textShadow: [
                                            `0 0 5px ${A(0.3)}`,
                                            `0 0 12px ${A(0.7)}`,
                                            `0 0 5px ${A(0.3)}`,
                                        ],
                                        color: [accent, "#FFF", accent],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                    }}
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        margin: "0 0 6px",
                                    }}
                                >
                                    SESIONES 1:1 ONLINE
                                </motion.div>
                                <div>VIA ZOOM</div>
                            </div>
                        </div>
                        <p
                            style={{
                                textAlign: "center",
                                fontSize: 16,
                                color: "#E6F7EF",
                                margin: "0 auto 24px",
                                lineHeight: 1.6,
                                fontWeight: 300,
                            }}
                        >
                            {formatText(resSectionDesc)}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 18,
                            }}
                        >
                            {plans.map((p, i) => {
                                /* 33% OFF en Sesiones 1:1 eliminado
                                   (2026-06-09): precio completo para todos,
                                   sin precio ni link de miembro. */
                                const hasMemberPrice = false
                                const activeUrl = p.url
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{
                                            once: true,
                                            root: scrollRef,
                                        }}
                                        transition={{ delay: i * 0.08 }}
                                        onClick={() =>
                                            openCalendly(activeUrl, p.slotType)
                                        }
                                        style={{
                                            background:
                                                "linear-gradient(145deg, rgba(20,25,35,0.95), rgba(10,15,20,0.9))",
                                            border: `1px solid ${hasMemberPrice ? "rgba(212,168,67,0.45)" : i === 2 ? "rgba(212,168,67,0.35)" : "rgba(255,255,255,0.07)"}`,
                                            borderRadius: 14,
                                            padding: "24px 20px",
                                            textAlign: "center",
                                            position: "relative",
                                            cursor: "pointer",
                                            boxShadow: hasMemberPrice
                                                ? "0 0 24px rgba(212,168,67,0.12)"
                                                : i === 2
                                                  ? "0 0 20px rgba(212,168,67,0.06)"
                                                  : "none",
                                        }}
                                    >
                                        {i === 2 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 10,
                                                    right: 10,
                                                    background:
                                                        "linear-gradient(135deg, #D4A843, #F5D98C)",
                                                    color: "#000",
                                                    fontSize: 7,
                                                    padding: "3px 7px",
                                                    borderRadius: 3,
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Premium
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                fontSize: 24,
                                                color: "#E6F7EF",
                                                fontWeight: 600,
                                                marginBottom: 3,
                                            }}
                                        >
                                            {p.time}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: "#888",
                                                marginBottom: 14,
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                        {hasMemberPrice ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: "#666",
                                                        fontWeight: 400,
                                                        textDecoration:
                                                            "line-through",
                                                        opacity: 0.6,
                                                    }}
                                                >
                                                    {p.price}
                                                </span>
                                                <motion.span
                                                    animate={{
                                                        textShadow: [
                                                            "0 0 6px rgba(212,168,67,0.3)",
                                                            "0 0 14px rgba(212,168,67,0.6)",
                                                            "0 0 6px rgba(212,168,67,0.3)",
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration: 2.5,
                                                        repeat: Infinity,
                                                    }}
                                                    style={{
                                                        fontSize: 20,
                                                        color: "#D4A843",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {p.memberPrice}
                                                </motion.span>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    color: "#D4A843",
                                                    fontWeight: 500,
                                                    marginBottom: 20,
                                                    textShadow:
                                                        "0 0 8px rgba(212,168,67,0.25)",
                                                }}
                                            >
                                                {p.price}
                                            </div>
                                        )}
                                        <GoldenButton
                                            text="AGENDAR MI SINTONÍA"
                                            subtle
                                            style={{
                                                borderRadius: 10,
                                                padding: "13px 0",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <MobFloating
                onFaqClick={() => setShowFaq(true)}
                onScrollTop={scrollToTop}
                show={showFloating}
                accent={accent}
                showFaq={showFaq}
                modalOpen={!!modalMode}
            />
            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {modalMode && (
                            <MobModalOverlay onClose={closeModal}>
                                {modalMode === "calendly" &&
                                    activeCalendlyUrl &&
                                    procesarIgnicionPagoUrl && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                width: "calc(100vw - 12px)",
                                                maxWidth: 420,
                                                marginTop: 24,
                                                position: "relative",
                                                cursor: "default",
                                            }}
                                        >
                                            <button
                                                onClick={closeModal}
                                                style={{
                                                    position: "absolute",
                                                    top: 10,
                                                    right: 10,
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    border: `1px solid ${hexToRgba(accent, 0.3)}`,
                                                    background: "rgba(0,0,0,0.4)",
                                                    color: accent,
                                                    fontSize: 15,
                                                    cursor: "pointer",
                                                    zIndex: 5,
                                                }}
                                                aria-label="Cerrar"
                                            >
                                                ×
                                            </button>
                                            <CalendarioReservas
                                                supabaseUrl={supabaseUrl}
                                                supabaseAnonKey={
                                                    supabaseAnonKey
                                                }
                                                procesarIgnicionPagoUrl={
                                                    procesarIgnicionPagoUrl
                                                }
                                                slotType={
                                                    activeSlotType ||
                                                    urlToSlotType(
                                                        activeCalendlyUrl,
                                                        calUrl30,
                                                        calUrl45,
                                                        calUrl60,
                                                        calUrlGroup
                                                    )
                                                }
                                                successUrl="https://www.redsolarviva.com/nucleo#sesiones"
                                                cancelUrl="https://www.redsolarviva.com/sesiones"
                                                accentColor={accent}
                                                isActiveMember={
                                                    isActiveMember
                                                }
                                                compact={true}
                                            />
                                        </div>
                                    )}
                                {modalMode === "calendly" &&
                                    activeCalendlyUrl &&
                                    !procesarIgnicionPagoUrl && (
                                        <div
                                            style={{
                                                background:
                                                    "linear-gradient(180deg, rgba(10,18,32,0.98), rgba(5,10,20,0.99))",
                                                border: `1px solid ${hexToRgba(accent, 0.25)}`,
                                                borderRadius: 20,
                                                width: "calc(100vw - 12px)",
                                                maxWidth: 420,
                                                height: `calc(100dvh - 80px)`,
                                                maxHeight: mobCalH,
                                                marginTop: 24,
                                                overflow: "hidden",
                                                display: "flex",
                                                flexDirection: "column",
                                                boxShadow: `0 0 30px ${hexToRgba(accent, 0.1)}`,
                                            }}
                                        >
                                            <MobCalendarHeader
                                                onClose={closeModal}
                                                rawUrl={String(
                                                    activeCalendlyUrl
                                                ).trim()}
                                                accent={accent}
                                            />
                                            <div
                                                style={{
                                                    flex: 1,
                                                    position: "relative",
                                                    minHeight: 0,
                                                }}
                                            >
                                                {mobCalLoading && (
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            inset: 0,
                                                            zIndex: 10,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 20,
                                                            background:
                                                                "rgba(8,14,28,0.95)",
                                                        }}
                                                    >
                                                        <motion.div
                                                            animate={{
                                                                rotate: [0, 360],
                                                            }}
                                                            transition={{
                                                                duration: 3,
                                                                repeat: Infinity,
                                                                ease: "linear",
                                                            }}
                                                            style={{
                                                                width: 48,
                                                                height: 48,
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            <svg
                                                                width="48"
                                                                height="48"
                                                                viewBox="0 0 48 48"
                                                                fill="none"
                                                            >
                                                                <circle
                                                                    cx="24"
                                                                    cy="8"
                                                                    r="3"
                                                                    fill={accent}
                                                                    opacity="0.3"
                                                                />
                                                                <circle
                                                                    cx="24"
                                                                    cy="40"
                                                                    r="3"
                                                                    fill={accent}
                                                                    opacity="0.3"
                                                                />
                                                                <circle
                                                                    cx="8"
                                                                    cy="24"
                                                                    r="3"
                                                                    fill={accent}
                                                                    opacity="0.3"
                                                                />
                                                                <circle
                                                                    cx="40"
                                                                    cy="24"
                                                                    r="3"
                                                                    fill={accent}
                                                                    opacity="0.3"
                                                                />
                                                                <path
                                                                    d="M24 4 A20 20 0 0 1 44 24"
                                                                    stroke={
                                                                        accent
                                                                    }
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                        </motion.div>
                                                        <motion.span
                                                            animate={{
                                                                opacity: [
                                                                    0.4, 1, 0.4,
                                                                ],
                                                            }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity,
                                                                ease: "easeInOut",
                                                            }}
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: 300,
                                                                color: accent,
                                                                letterSpacing:
                                                                    "0.2em",
                                                                textTransform:
                                                                    "uppercase",
                                                            }}
                                                        >
                                                            Sintonizando...
                                                        </motion.span>
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        overflowY: "auto",
                                                        overflowX: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                mobCropTop,
                                                            height: 1200,
                                                        }}
                                                    >
                                                        <CalendlyEmbed
                                                            url={
                                                                activeCalendlyUrl
                                                            }
                                                            accent={accent}
                                                            maskBottomPx={0}
                                                            hideLoading
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </MobModalOverlay>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {showFaq && (
                            <MobFAQModal
                                onClose={closeFaq}
                                items={faqs}
                                accent={accent}
                            />
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

SesionesMobile.displayName = "SesionesMobile"

export default SesionesMobile
