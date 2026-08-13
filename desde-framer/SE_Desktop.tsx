// SE_Desktop.tsx v1.12 — hideCamara: oculta la sección Cámara Solar + la tarjeta grupal del hero (1:1 centrado) + la nav lateral cuando el flag está ON. | v1.11 — Tarjeta grupal landing: badge "Lugares Disponibles" + botón pulsante · sin número · Inmersión: "(NUESTRA SUSCRIPCIÓN MÁS COMPLETA)"
// v1.8 — Inmersión ya no lista "Grupo WhatsApp" en sus beneficios (filtro
// hardcode-over-Framer en el array de features). La transmisión en vivo es la
// Cámara Solar semanal, no acompañamiento por chat.
// Componentes y shell del [CENTRO DE MANDO] del split de Sesiones (sello SE_).
// Default export = SesionesDesktop directo (no ghost — el componente principal
// ya cumple el contrato del componentLoader de Framer con body JSX renderable).
//
// Consumidor: Sesiones.tsx (shell) cuando isMobile === false.
//
// v1.7 (2026-05-22): el .map de features ahora también normaliza el
// feature de Sesiones 1:1 al 33% OFF (regla hardcode-over-Framer-saved).
// Cualquier variante saved en el canvas con "11% OFF en Sesiones 1:1"
// o "15% OFF en Sesiones Privadas" pasa al copy canónico
// "33% OFF en Sesiones 1:1", que coincide con el descuento real
// para miembros (888/1,111/1,444 ≈ 33% off de 1,333/1,777/2,222).
//
// v1.6 (2026-05-20): el botón INMERSIÓN ACTIVA en la card dorada
// ahora rutea según contexto. Desde `/sesiones` (modo Madre) va a
// `/nucleo#mifirma/orbital` (Estado Orbital). Desde `/escaner/*`
// preserva la ruta del modo Escáner → `/escaner/nucleo#mifirma/orbital`.
// Antes siempre iba a `/escaner/nucleo#sesiones` (que ya no existe
// en modo Escáner desde v6.27) y dejaba al Tripulante fuera de su
// contexto de origen.
//
// v1.5 (2026-05-20): el handler de ACTIVAR INMERSIÓN ahora pre-rellena
// el email del Tripulante (vía `withCheckoutIdentity` de SE_Shared) en
// Stripe Checkout — reduce typos y permite que el webhook enlace la
// suscripción al perfil correcto vía `client_reference_id`. Aplica a
// los dos paths: `p2.link` del DeskHolographicPassCard +
// `linkStripeMembSolar` del DeskSectionCamaraSolar.
//
// v1.4 (2026-05-20): hardcode del feature "33% OFF en todos los Códices"
// de la card de Inmersión Solar para que diga "Incluye 1 Códice gratuito
// por mes (a elección) + 33% OFF en todos los Códices" — regla
// hardcode-over-Framer-saved aplicada en el split del array de features
// (intercepta cualquier variante con regex sin tocar las otras filas).
//
// v1.3 (2026-05-19): fix del bug del cupón en desktop — el handler del
// DeskHolographicPassCard navegaba directo a `p2.link` SIN aplicar el
// promo (v1.1 sólo había cubierto el path `onActivateMembership` del
// DeskSectionCamaraSolar). Ahora ambos paths suman `prefilled_promo_code`.
// + mini-leyenda dorada debajo del precio de la card holográfica con el
// dato esencial del primer mes (refuerza el panel completo que vive
// debajo del botón).
//
// v1.2 (2026-05-19): la leyenda del Ciclo de Inducción sale de debajo
// del precio y baja a un panel destacado DEBAJO del botón ACTIVAR
// INMERSIÓN — tipografía mayor, borde dorado tenue y el dato del
// primer mes en oro para que el tripulante no pase por alto los
// 1,555 MXN. Solo en la card dorada.
//
// v1.1 (2026-05-19): protocolo de Inducción del Mes 1 para Inmersión
// Solar. Leyenda gris translúcida bajo el precio que comunica el ciclo
// promocional (1,555 mes 1 → 1,999 desde la renovación). El handler de
// activación suma `?prefilled_promo_code=PRIMERMES` al Payment Link de
// Stripe (con `&` si la URL ya traía parámetros).

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
import DesktopModals from "./SE_DesktopModals.tsx"

const {
    hexToRgba,
    formatText,
    playHoloHover,
    SHARED_CSS,
    GoldenButton,
    LugaresDisponibles,
    ScheduleInfo,
    PassScheduleInfo,
    NextSessionCountdown,
    DesktopStarsBackground,
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

const {
    DeskModalOverlay,
    DeskCalendlyModalView,
    DeskFAQModal,
    HoloCard,
} = DesktopModals

/* ── Desktop PortalCard ── */
const DeskPortalCard = ({
    accent,
    icon,
    title,
    subHeader,
    btnText,
    onClick,
    delay,
    anchorLink,
    scrollRef: sRef,
    lugaresDisponibles,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8 }}
        >
            <HoloCard accent={accent} onClick={onClick}>
                <div style={{ width: 110, height: 110, marginBottom: 20 }}>
                    {icon}
                </div>
                <h2
                    style={{
                        fontSize: 28,
                        fontWeight: 300,
                        margin: "0 0 8px 0",
                        letterSpacing: "0.15em",
                        color: "#E6F7EF",
                        textShadow: `0 0 20px ${A(0.27)}`,
                    }}
                >
                    {title}
                </h2>
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 500,
                        letterSpacing: "0.25em",
                        color: accent,
                        textShadow: `0 0 12px ${A(0.53)}, 0 0 30px ${A(0.27)}`,
                        marginBottom: 0,
                        textTransform: "uppercase",
                    }}
                >
                    {subHeader}
                </div>
                <div style={{ width: "100%", maxWidth: 300, paddingTop: 24 }}>
                    <GoldenButton
                        text={btnText}
                        onClick={onClick}
                        pulse={lugaresDisponibles > 0}
                    />
                </div>
                {lugaresDisponibles > 0 && (
                    <LugaresDisponibles
                        count={lugaresDisponibles}
                        accent={accent}
                    />
                )}
                {anchorLink && (
                    <motion.a
                        href={anchorLink.href}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        onClick={(e: any) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const container = sRef?.current
                            if (!container) return
                            const target = container.querySelector(
                                anchorLink.href
                            ) as HTMLElement | null
                            if (!target) return
                            let top = 0
                            let el: HTMLElement | null = target
                            while (el && el !== container) {
                                top += el.offsetTop
                                el = el.offsetParent as HTMLElement | null
                            }
                            container.scrollTo({
                                top: top - 270,
                                behavior: "smooth",
                            })
                        }}
                        style={{
                            marginTop: 14,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.18em",
                            color: accent,
                            textDecoration: "none",
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            textShadow: `0 0 8px ${A(0.4)}`,
                            opacity: 0.6,
                            textTransform: "uppercase",
                            transition:
                                "text-shadow 0.1s ease, transform 0.1s ease, opacity 0.1s ease",
                        }}
                        onMouseEnter={(e: any) => {
                            e.currentTarget.style.textShadow = `0 0 16px ${accent}`
                            e.currentTarget.style.transform = "scale(1.05)"
                            e.currentTarget.style.opacity = "0.9"
                        }}
                        onMouseLeave={(e: any) => {
                            e.currentTarget.style.textShadow = `0 0 8px ${A(0.4)}`
                            e.currentTarget.style.transform = "scale(1)"
                            e.currentTarget.style.opacity = "0.6"
                        }}
                    >
                        VER PASES DE ACCESO ↓
                    </motion.a>
                )}
            </HoloCard>
        </motion.div>
    )
}

/* ── Desktop Floating Buttons ── */
const DeskFloatingButtons = ({
    onFaqClick,
    onScrollTop,
    show,
    accent,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [hasEverShown, setHasEverShown] = useState(false)
    useEffect(() => {
        if (show && !hasEverShown) setHasEverShown(true)
    }, [show])
    const FloatBtn = ({
        onClick,
        children,
        label,
    }: {
        onClick: () => void
        children: React.ReactNode
        label: string
    }) => {
        const [hovered, setHovered] = useState(false)
        return (
            <motion.button
                onClick={onClick}
                onMouseEnter={() => {
                    setHovered(true)
                    playHoloHover()
                }}
                onMouseLeave={() => setHovered(false)}
                whileTap={{ scale: 0.92 }}
                style={{
                    height: 50,
                    borderRadius: "16px 0 0 16px",
                    border: `1px solid ${hovered ? A(0.5) : A(0.18)}`,
                    borderRight: `3px solid ${hovered ? accent : A(0.35)}`,
                    background: hovered
                        ? `linear-gradient(135deg, ${A(0.18)}, ${A(0.06)})`
                        : `linear-gradient(135deg, rgba(8,12,20,0.85), rgba(15,20,30,0.7))`,
                    backdropFilter: "blur(20px)",
                    color: hovered ? "#fff" : accent,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: hovered ? 10 : 0,
                    padding: hovered ? "0 14px 0 18px" : "0 14px",
                    boxShadow: hovered
                        ? `0 0 24px ${A(0.3)}, -6px 0 20px rgba(0,0,0,0.4)`
                        : `-4px 0 14px rgba(0,0,0,0.4)`,
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.25s ease",
                    overflow: "hidden",
                    whiteSpace: "nowrap" as const,
                    position: "relative" as const,
                    minWidth: 50,
                }}
            >
                {hovered && (
                    <motion.div
                        initial={{ x: "200%" }}
                        animate={{ x: "-100%" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, transparent, ${A(0.12)}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                {hovered && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        {label}
                    </motion.span>
                )}
                <span
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {children}
                </span>
            </motion.button>
        )
    }
    if (!hasEverShown) return null
    return (
        <div
            style={{
                position: "fixed",
                bottom: 30,
                right: 0,
                zIndex: 99998,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
                opacity: show ? 1 : 0,
                transform: show ? "translateX(0)" : "translateX(50px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: show ? "auto" : "none",
            }}
        >
            <FloatBtn onClick={onFaqClick} label="FAQ">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </FloatBtn>
            <FloatBtn onClick={onScrollTop} label="Inicio">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </FloatBtn>
        </div>
    )
}

/* ── Desktop StickySideNav ── */
const DeskStickySideNav = ({
    show,
    onGoGrupales,
    onGoPrivadas,
    accent,
    activeSection,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const NavItem = ({
        onClick,
        label,
        sublabel,
        iconContent,
        isActive,
    }: any) => {
        const [hovered, setHovered] = useState(false)
        const lit = hovered || isActive
        return (
            <div
                onMouseEnter={() => {
                    setHovered(true)
                    playHoloHover()
                }}
                onMouseLeave={() => setHovered(false)}
                onClick={onClick}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    padding: "14px 20px 14px 16px",
                    borderRadius: "0 18px 18px 0",
                    background: lit
                        ? `linear-gradient(135deg, ${A(0.18)}, ${A(0.06)})`
                        : `linear-gradient(135deg, rgba(8,12,20,0.85), rgba(15,20,30,0.7))`,
                    border: `1px solid ${lit ? A(0.5) : A(0.18)}`,
                    borderLeft: `3px solid ${lit ? accent : A(0.35)}`,
                    boxShadow: hovered
                        ? `0 0 28px ${A(0.3)}, 8px 0 24px rgba(0,0,0,0.4)`
                        : isActive
                          ? `0 0 18px ${A(0.2)}`
                          : `4px 0 16px rgba(0,0,0,0.4)`,
                    backdropFilter: "blur(20px)",
                    transition: "all 0.25s ease",
                    minWidth: 64,
                    position: "relative" as const,
                    overflow: "hidden",
                }}
            >
                {hovered && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, transparent, ${A(0.15)}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `linear-gradient(145deg, ${A(0.12)}, ${A(0.04)})`,
                        border: `1px solid ${lit ? A(0.5) : A(0.2)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: lit
                            ? `0 0 16px ${A(0.3)}`
                            : `0 0 6px ${A(0.1)}`,
                        transition: "all 0.25s",
                    }}
                >
                    {iconContent}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: hovered ? "#fff" : "rgba(230,247,239,0.85)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textShadow: lit ? `0 0 10px ${A(0.4)}` : "none",
                        }}
                    >
                        {label}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 400,
                            color: lit ? accent : A(0.7),
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                        }}
                    >
                        {sublabel}
                    </span>
                </div>
            </div>
        )
    }
    const [hasEverShown, setHasEverShown] = useState(false)
    useEffect(() => {
        if (show && !hasEverShown) setHasEverShown(true)
    }, [show])
    if (!hasEverShown) return null
    return (
        <div
            style={{
                position: "fixed",
                left: 0,
                top: "50%",
                transform: show
                    ? "translateY(-50%) translateX(0)"
                    : "translateY(-50%) translateX(-80px)",
                zIndex: 90,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                opacity: show ? 1 : 0,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: show ? "auto" : "none",
            }}
        >
            <NavItem
                onClick={onGoGrupales}
                label="Grupal"
                sublabel="Cámara Solar"
                isActive={activeSection === "solar"}
                iconContent={
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="M4.93 4.93l1.41 1.41" />
                        <path d="M17.66 17.66l1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="M4.93 19.07l1.41-1.41" />
                        <path d="M17.66 6.34l1.41-1.41" />
                    </svg>
                }
            />
            <NavItem
                onClick={onGoPrivadas}
                label="1:1"
                sublabel="Resonancia"
                isActive={activeSection === "resonancia"}
                iconContent={
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                }
            />
        </div>
    )
}

/* ── Desktop Session Timeline ── */
const DeskSessionTimeline = ({ items, accent, scrollRoot }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (activeIndex === null) return
            if (e.key === "ArrowRight")
                setActiveIndex((p) =>
                    (p as number) === items.length - 1 ? 0 : (p as number) + 1
                )
            else if (e.key === "ArrowLeft")
                setActiveIndex((p) =>
                    (p as number) === 0 ? items.length - 1 : (p as number) - 1
                )
            else if (e.key === "Escape") setActiveIndex(null)
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [activeIndex, items.length])
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, root: scrollRoot }}
            transition={{ duration: 0.8 }}
            style={{ width: "100%", marginBottom: 70 }}
        >
            <div
                style={{ width: "100%", overflowX: "auto", paddingBottom: 20 }}
            >
                <div
                    style={{
                        minWidth: 800,
                        position: "relative",
                        margin: "30px auto 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <motion.div
                        animate={{ opacity: activeIndex !== null ? 0.05 : 0.8 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            position: "absolute",
                            top: 38,
                            left: 20,
                            right: 20,
                            height: 2,
                            background: accent,
                            boxShadow: `0 0 10px ${accent}`,
                            zIndex: 0,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: accent,
                                position: "absolute",
                                left: -4,
                            }}
                        />
                        <svg
                            style={{ position: "absolute", right: -12 }}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={accent}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.div>
                    {(items || []).map((item: any, i: number) => {
                        const isActive = activeIndex === i
                        const isDimmed =
                            activeIndex !== null && activeIndex !== i
                        return (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    zIndex: 1,
                                    padding: "0 10px",
                                    opacity: isDimmed ? 0.35 : 1,
                                    transition: "opacity 0.4s ease",
                                }}
                            >
                                <motion.div
                                    onMouseEnter={playHoloHover}
                                    onClick={() => {
                                        playHoloHover()
                                        setActiveIndex(isActive ? null : i)
                                    }}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        boxShadow: isActive
                                            ? `0 0 25px ${A(0.8)}, inset 0 0 20px ${A(0.5)}`
                                            : `0 0 15px ${A(0.3)}, inset 0 0 15px ${A(0.3)}`,
                                        borderColor: isActive ? accent : A(0.6),
                                    }}
                                    whileHover={{
                                        scale: 1.15,
                                        boxShadow: `0 0 35px ${A(0.7)}`,
                                        borderColor: accent,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25,
                                    }}
                                    style={{
                                        width: 76,
                                        height: 76,
                                        borderRadius: "50%",
                                        background: "#080C14",
                                        border: "2px solid",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 20,
                                        cursor: "pointer",
                                        position: "relative",
                                    }}
                                >
                                    {!isActive && (
                                        <motion.div
                                            animate={{
                                                opacity: [0.1, 0.5, 0.1],
                                                scale: [1, 1.08, 1],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: i * 0.4,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: -4,
                                                borderRadius: "50%",
                                                border: `1px solid ${A(0.5)}`,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 4,
                                            borderRadius: "50%",
                                            border: `1px solid ${A(0.2)}`,
                                        }}
                                    />
                                    <TimelineIcon
                                        type={item.icon}
                                        color={accent}
                                    />
                                </motion.div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: "#E6F7EF",
                                        marginBottom: 6,
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {formatText(item.time)}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: accent,
                                        textTransform: "uppercase",
                                        marginBottom: 10,
                                        letterSpacing: "0.1em",
                                        textShadow: `0 0 8px ${A(0.4)}`,
                                    }}
                                >
                                    {formatText(item.title)}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#aaa",
                                        lineHeight: 1.6,
                                        maxWidth: 220,
                                    }}
                                >
                                    {formatText(item.desc)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {activeIndex !== null && (
                    <motion.div
                        key="expanded-panel"
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 30 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        style={{ overflow: "hidden", width: "100%" }}
                    >
                        <div
                            style={{
                                border: `1px solid ${A(0.4)}`,
                                background: `linear-gradient(135deg, rgba(8,12,20,0.9), rgba(15,20,30,0.9))`,
                                borderRadius: 24,
                                display: "flex",
                                alignItems: "stretch",
                                position: "relative",
                                boxShadow: `0 0 30px ${A(0.15)}`,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    padding: "40px 30px",
                                    alignItems: "center",
                                    gap: 30,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        minWidth: 120,
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0.8, rotate: -15 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        style={{
                                            transform: "scale(1.8)",
                                            marginBottom: 24,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <TimelineIcon
                                            type={items[activeIndex].icon}
                                            color={accent}
                                        />
                                    </motion.div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: accent,
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            textAlign: "center",
                                        }}
                                    >
                                        {formatText(items[activeIndex].title)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        borderLeft: `1px solid ${A(0.2)}`,
                                        paddingLeft: 30,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 15,
                                            color: "#aaa",
                                            lineHeight: 1.8,
                                            fontWeight: 300,
                                        }}
                                    >
                                        {formatText(
                                            items[activeIndex].descLarga
                                        )}
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                onClick={() => setActiveIndex(null)}
                                whileHover={{ backgroundColor: A(0.08) }}
                                style={{
                                    width: 80,
                                    flexShrink: 0,
                                    border: "none",
                                    borderLeft: `1px solid ${A(0.2)}`,
                                    background: "rgba(255,255,255,0.01)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#fff",
                                }}
                            >
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ── Desktop Benefit Cards ── */
const DeskBenefitCards = ({
    items,
    accent,
    scrollRoot,
}: {
    items: any[]
    accent: string
    scrollRoot: React.RefObject<HTMLDivElement>
}) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [openBenefits, setOpenBenefits] = useState<Set<number>>(new Set())
    const toggle = (i: number) =>
        setOpenBenefits((prev) => {
            const n = new Set(prev)
            if (n.has(i)) n.delete(i)
            else n.add(i)
            return n
        })
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, root: scrollRoot }}
            transition={{ duration: 0.7 }}
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 60,
                width: "100%",
                alignItems: "start",
            }}
        >
            {(items || []).slice(0, 4).map((item, i) => {
                const Icon =
                    BENEFIT_ICON_MAP[item.icon] || BENEFIT_ICON_MAP["spiral"]
                const isOpen = openBenefits.has(i)
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1, root: scrollRoot }}
                        transition={{ delay: i * 0.12, duration: 0.6 }}
                        onClick={() => toggle(i)}
                        style={{
                            position: "relative",
                            borderRadius: 14,
                            padding: "26px 22px 22px",
                            textAlign: "center",
                            overflow: "hidden",
                            background: isOpen
                                ? `radial-gradient(100% 140% at 50% 15%, ${A(0.15)}, transparent 60%)`
                                : `radial-gradient(100% 140% at 50% 15%, ${A(0.1)}, transparent 60%)`,
                            border: `1.5px solid ${isOpen ? A(0.45) : A(0.35)}`,
                            boxShadow: isOpen
                                ? `0 0 25px ${A(0.3)}`
                                : `0 0 10px ${A(0.15)}, 0 8px 20px rgba(0,0,0,0.4)`,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <div
                            style={{
                                width: 50,
                                height: 50,
                                margin: "0 auto 14px",
                                position: "relative",
                                zIndex: 2,
                                filter: `drop-shadow(0 0 12px ${hexToRgba(accent, 0.53)})`,
                            }}
                        >
                            <Icon color={accent} />
                        </div>
                        <h5
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#E6F7EF",
                                margin: "0 0 4px",
                                letterSpacing: "0.04em",
                                position: "relative",
                                zIndex: 2,
                            }}
                        >
                            {formatText(item.title)}
                        </h5>
                        <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            style={{
                                fontSize: 18,
                                fontWeight: 200,
                                color: accent,
                                opacity: 0.5,
                                display: "block",
                                marginBottom: 4,
                            }}
                        >
                            +
                        </motion.span>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <p
                                        style={{
                                            fontSize: 12.5,
                                            color: "#999",
                                            lineHeight: 1.55,
                                            margin: "8px 0 0",
                                            position: "relative",
                                            zIndex: 2,
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
        </motion.div>
    )
}

/* ── Desktop CamaraSolarExplainer ── */
const DeskCamaraSolarExplainer = ({
    accent,
    videoUrl,
    videoWidth,
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
                      title: "Calibrar tu Sistema Nervioso",
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
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, root: scrollRoot }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: 70, position: "relative" }}
        >
            <div
                style={{
                    height: 1,
                    maxWidth: 400,
                    margin: "0 auto 30px",
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    boxShadow: `0 0 12px ${A(0.3)}`,
                }}
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 35,
                }}
            >
                {!!videoUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, root: scrollRoot }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            position: "relative",
                            width: videoWidth || 480,
                            maxWidth: "100%",
                            borderRadius: 20,
                            overflow: "hidden",
                            border: `1px solid ${A(0.2)}`,
                            boxShadow: `0 0 30px ${A(0.12)}`,
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
                                aspectRatio: "784 / 728",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </motion.div>
                )}
                <div style={{ width: "100%", maxWidth: 900 }}>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, root: scrollRoot }}
                        style={{
                            fontSize: 20,
                            color: "#E6F7EF",
                            textAlign: "center",
                            margin: "0 0 18px",
                            lineHeight: 1.6,
                            fontWeight: 300,
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        La Cámara Solar es un espacio de sesiones grupales en
                        vivo guiadas por{" "}
                        <span style={{ color: "#D4A843", fontWeight: 400 }}>
                            Zak'Haar
                        </span>
                        .
                    </motion.p>
                    {(subtitle || "")
                        .split(/\\n|\n/)
                        .map((line: string, i: number) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, root: scrollRoot }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                style={{
                                    fontSize: 20,
                                    color: "#E6F7EF",
                                    textAlign: "center",
                                    margin: "0 0 18px",
                                    lineHeight: 1.6,
                                    fontWeight: 300,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                {line.trim() === ""
                                    ? "\u00A0"
                                    : formatText(line)}
                            </motion.p>
                        ))}
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.min(pillars.length, 3)}, 1fr)`,
                        gap: 16,
                        width: "100%",
                        alignItems: "start",
                    }}
                >
                    {pillars.map((p: any, i: number) => {
                        const isOpen = openPillars.has(i)
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{
                                    once: true,
                                    amount: 0.1,
                                    root: scrollRoot,
                                }}
                                whileHover={{
                                    backgroundColor: A(0.08),
                                    borderColor: A(0.3),
                                    boxShadow: `0 0 20px ${A(0.2)}`,
                                }}
                                transition={{
                                    default: {
                                        delay: 0.8 + i * 0.12,
                                        duration: 0.5,
                                    },
                                    boxShadow: { duration: 0.2 },
                                }}
                                onClick={() => toggleP(i)}
                                style={{
                                    padding: "20px 18px",
                                    borderRadius: 14,
                                    border: `1px solid ${isOpen ? A(0.3) : A(0.15)}`,
                                    background: isOpen
                                        ? `linear-gradient(145deg, ${A(0.08)}, ${A(0.02)})`
                                        : `linear-gradient(145deg, ${A(0.04)}, transparent)`,
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 22,
                                        color: accent,
                                        width: 42,
                                        height: 42,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 12,
                                        border: `1px solid ${A(0.25)}`,
                                        background: A(0.06),
                                        textShadow: `0 0 10px ${A(0.6)}`,
                                        marginBottom: 12,
                                    }}
                                >
                                    {p.icon}
                                </div>
                                <h6
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#E6F7EF",
                                        margin: "0 0 6px",
                                    }}
                                >
                                    {formatText(p.title)}
                                </h6>
                                <motion.span
                                    animate={{ rotate: isOpen ? 45 : 0 }}
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 200,
                                        color: accent,
                                        opacity: 0.5,
                                        marginBottom: 4,
                                    }}
                                >
                                    +
                                </motion.span>
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
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    color: "#999",
                                                    lineHeight: 1.65,
                                                    margin: "8px 0 0",
                                                }}
                                            >
                                                {formatText(p.desc)}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

/* ── Desktop Holographic Pass Card ── */
const DeskHolographicPassCard = ({
    pass,
    accent,
    isGold,
    onClick,
    scrollRoot,
    delay: dl,
    lugaresDisponibles,
    anchorId,
    isActiveMember,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const glowColor = isGold ? "#D4A843" : accent
    const GC = (x: number) => hexToRgba(glowColor, x)
    /* v1.4 — Forzar el feature del 33% en Códices para Inmersión Solar
       (regla hardcode-over-Framer-saved). Cualquier variante con "33%" +
       Códices se reemplaza por el copy nuevo que suma 1 Códice gratuito
       mensual a elección.
       v1.6 (2026-05-22) — Forzar también el feature canónico de Sesiones
       1:1 al 33% OFF (antes Framer tenía saved "11%" o "15% OFF en
       Sesiones Privadas", obsoletos respecto al descuento real para
       miembros). Captura cualquier item que mencione sesiones 1:1 o
       privadas con porcentaje. */
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
            id={anchorId}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08, root: scrollRoot }}
            transition={{ delay: dl, duration: 0.8 }}
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 380px) 1fr",
                gap: 50,
                minHeight: "65vh",
                alignItems: "center",
                padding: "20px 0",
            }}
        >
            {/* Pass Card (Left) */}
            <motion.div
                onClick={onClick}
                whileHover={{ scale: 1.03, rotateY: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                    position: "relative",
                    borderRadius: 24,
                    overflow: "hidden",
                    aspectRatio: "3/4.2",
                    background: isGold
                        ? "linear-gradient(165deg, rgba(30,25,15,0.95) 0%, rgba(20,18,10,0.9) 40%, rgba(40,32,15,0.85) 100%)"
                        : `linear-gradient(165deg, rgba(8,12,20,0.95) 0%, rgba(15,20,30,0.9) 40%, ${A(0.08)} 100%)`,
                    border: `2px solid ${isGold ? "rgba(212,168,67,0.5)" : A(0.35)}`,
                    boxShadow: `0 0 40px ${GC(0.2)}, 0 20px 60px rgba(0,0,0,0.6)`,
                    cursor: "pointer",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 3,
                        pointerEvents: "none",
                        background: `linear-gradient(115deg, transparent 20%, ${GC(0.08)} 30%, rgba(255,255,255,0.06) 40%, ${GC(0.12)} 50%, transparent 60%)`,
                        backgroundSize: "400% 100%",
                        animation: "holo-shimmer 6s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: "20%",
                        zIndex: 4,
                        pointerEvents: "none",
                        background: `linear-gradient(180deg, transparent, ${GC(0.08)}, transparent)`,
                        animation: "holo-scan 4s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 12,
                        borderRadius: 16,
                        border: `1px solid ${GC(0.2)}`,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        zIndex: 6,
                        padding: "40px 30px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        {isGold && (
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #D4A843, #F5D98C)",
                                    color: "#000",
                                    fontSize: 9,
                                    padding: "4px 12px",
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    display: "inline-block",
                                    marginBottom: 16,
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {isActiveMember && isGold
                                    ? "Inmersión Activa ✦"
                                    : "Recomendado"}
                            </div>
                        )}
                        <div
                            style={{
                                fontSize: 10,
                                color: GC(0.7),
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.2em",
                                marginBottom: 8,
                                textAlign: "center",
                            }}
                        >
                            {pass.tag ||
                                (isGold
                                    ? "Compromiso Total"
                                    : "Opción Flexible")}
                        </div>
                        <h3
                            style={{
                                fontSize: 26,
                                fontWeight: 300,
                                color: "#E6F7EF",
                                margin: "0 0 16px",
                                letterSpacing: "0.08em",
                                lineHeight: 1.3,
                                textAlign: "center",
                            }}
                        >
                            {formatText(pass.name)}
                        </h3>
                        <div
                            style={{
                                fontSize: 36,
                                fontWeight: 600,
                                color: glowColor,
                                textShadow: `0 0 20px ${GC(0.4)}`,
                                marginBottom: 0,
                                textAlign: "center",
                            }}
                        >
                            {/* v2.5 — hardcode del precio por isGold (regla
                               hardcode-over-Framer-saved del CLAUDE.md). */}
                            {isGold ? "1,111 MXN / mes" : "555 MXN"}
                        </div>
                        {/* Mini-leyenda de primer mes removida — Inmersión es 1,111 MXN/mes flat. */}
                        <PassScheduleInfo accent={glowColor} />
                        <p
                            style={{
                                fontSize: 14,
                                color: "#999",
                                lineHeight: 1.7,
                                margin: 0,
                                fontWeight: 300,
                                textAlign: "left",
                            }}
                        >
                            {formatText((pass.desc || "").replace(/todos los martes/gi, "Martes"))}
                        </p>
                    </div>
                    <div>
                        <div
                            style={{
                                height: 1,
                                margin: "24px 0",
                                background: `linear-gradient(90deg, transparent, ${GC(0.3)}, transparent)`,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                opacity: 0.6,
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={glowColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: "#999",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                }}
                            >
                                ACCESO VERIFICADO
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
            {/* Features (Right) */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, root: scrollRoot }}
                transition={{ delay: (dl || 0) + 0.2, duration: 0.6 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    paddingRight: 20,
                }}
            >
                <h4
                    style={{
                        fontSize: 20,
                        fontWeight: 300,
                        color: "#E6F7EF",
                        margin: "0 0 8px",
                        letterSpacing: "0.06em",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    {formatText(pass.nameRight || pass.name)}
                </h4>
                <div
                    style={{
                        fontSize: 13,
                        color: GC(0.8),
                        fontWeight: 500,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: isGold ? 20 : 30,
                        textShadow: `0 0 10px ${GC(0.3)}`,
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    {pass.tag ||
                        (isGold ? "Compromiso Total" : "Opción Flexible")}
                </div>
                {isGold && (
                    <div
                        style={{
                            fontSize: 10,
                            color: GC(0.5),
                            fontWeight: 500,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            marginBottom: 16,
                            paddingBottom: 10,
                            borderBottom: `1px solid ${GC(0.15)}`,
                            textAlign: "center",
                            width: "100%",
                        }}
                    >
                        TU INMERSIÓN INCLUYE:
                    </div>
                )}
                {isGold ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                            marginBottom: 30,
                        }}
                    >
                        {features.map((f: string, i: number) => {
                            const Icon = VIP_ICONS[i % VIP_ICONS.length]
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, root: scrollRoot }}
                                    transition={{
                                        default: {
                                            delay: (dl || 0) + 0.25 + i * 0.07,
                                        },
                                        scale: { duration: 0.15 },
                                    }}
                                    whileHover={{
                                        scale: 1.03,
                                        borderColor: GC(0.5),
                                        boxShadow: `0 0 20px ${GC(0.15)}`,
                                    }}
                                    style={{
                                        borderRadius: 16,
                                        padding: "18px 14px 14px",
                                        background: `linear-gradient(155deg, ${GC(0.06)}, rgba(10,12,20,0.6))`,
                                        border: `1px solid ${GC(0.2)}`,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        gap: 10,
                                        cursor: "default",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: "1px",
                                            background: `linear-gradient(90deg, transparent, ${GC(0.3)}, transparent)`,
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: 42,
                                            height: 42,
                                            flexShrink: 0,
                                            filter: `drop-shadow(0 0 8px ${GC(0.4)})`,
                                        }}
                                    >
                                        <Icon color={glowColor} />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "#ccc",
                                            lineHeight: 1.45,
                                            fontWeight: 300,
                                        }}
                                    >
                                        {f}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            marginBottom: 40,
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {features.map((f: string, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, root: scrollRoot }}
                                transition={{
                                    delay: (dl || 0) + 0.3 + i * 0.08,
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: `linear-gradient(145deg, ${GC(0.15)}, ${GC(0.05)})`,
                                        border: `1px solid ${GC(0.25)}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: glowColor,
                                            fontSize: 13,
                                        }}
                                    >
                                        ✦
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 15,
                                        color: "#ccc",
                                        lineHeight: 1.6,
                                        fontWeight: 300,
                                    }}
                                >
                                    {f}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
                {lugaresDisponibles > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, root: scrollRoot }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            marginBottom: 16,
                            padding: "10px 26px",
                            borderRadius: 50,
                            width: "100%",
                            border: isGold
                                ? "1px solid rgba(212,168,67,0.4)"
                                : `1px solid ${hexToRgba(accent, 0.35)}`,
                            background: isGold
                                ? "linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.03))"
                                : `linear-gradient(135deg, ${hexToRgba(accent, 0.08)}, transparent)`,
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: isGold ? "#D4A843" : accent,
                                boxShadow: `0 0 8px ${isGold ? "#D4A843" : accent}`,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                letterSpacing: "0.12em",
                                color: isGold ? "#D4A843" : accent,
                                textTransform: "uppercase",
                            }}
                        >
                            Lugares Disponibles
                        </span>
                    </motion.div>
                )}
                {isActiveMember && isGold ? (
                    <motion.button
                        onClick={onClick}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))",
                            border: "1.5px solid rgba(212,168,67,0.5)",
                            borderRadius: 14,
                            padding: "16px 36px",
                            cursor: "pointer",
                            width: "100%",
                            fontFamily: "'Inter', sans-serif",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 0 20px rgba(212,168,67,0.15)",
                        }}
                        onMouseEnter={(e: any) => {
                            e.currentTarget.style.boxShadow =
                                "0 0 30px rgba(212,168,67,0.3)"
                            e.currentTarget.style.borderColor =
                                "rgba(212,168,67,0.7)"
                        }}
                        onMouseLeave={(e: any) => {
                            e.currentTarget.style.boxShadow =
                                "0 0 20px rgba(212,168,67,0.15)"
                            e.currentTarget.style.borderColor =
                                "rgba(212,168,67,0.5)"
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "#D4A843",
                                textShadow: "0 0 10px rgba(212,168,67,0.3)",
                            }}
                        >
                            INMERSIÓN ACTIVA
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                color: "rgba(212,168,67,0.6)",
                            }}
                        >
                            IR A MI NÚCLEO →
                        </span>
                    </motion.button>
                ) : (
                    <GoldenButton
                        /* v2.7 — hardcode del btnText por isGold (regla
                           hardcode-over-Framer-saved). */
                        text={formatText(
                            isGold ? "ACTIVAR INMERSIÓN" : "RESERVAR MI LUGAR"
                        )}
                        onClick={onClick}
                        style={{
                            borderRadius: 14,
                            pointerEvents: "auto",
                            width: isGold ? "100%" : "75%",
                        }}
                    />
                )}
                {/* v1.2 — Leyenda visible DEBAJO del botón ACTIVAR INMERSIÓN.
                   Panel con borde dorado tenue + dato del primer mes en oro
                   para que el tripulante no pase por alto el ciclo del
                   cupón PRIMERMES. Sólo en la card dorada. */}
                {isGold && (
                    <div
                        style={{
                            marginTop: 14,
                            padding: "11px 16px",
                            borderRadius: 12,
                            border: "1px solid rgba(212,168,67,0.28)",
                            background:
                                "linear-gradient(135deg, rgba(212,168,67,0.07), rgba(212,168,67,0.02))",
                            fontSize: 13,
                            color: "rgba(255,235,200,0.88)",
                            fontWeight: 400,
                            lineHeight: 1.55,
                            letterSpacing: "0.01em",
                            textAlign: "center",
                        }}
                    >
                        <strong
                            style={{ color: "#D4A843", fontWeight: 700 }}
                        >
                            1,111 MXN
                        </strong>{" "}
                        al mes. Cancela en cualquier momento.
                    </div>
                )}
                {!isGold && <NextSessionCountdown accent={accent} />}
            </motion.div>
        </motion.div>
    )
}

/* ── Desktop Section: Cámara Solar ── */
const DeskSectionCamaraSolar = React.forwardRef<HTMLDivElement, any>(
    (props, ref) => {
        const {
            accent,
            texts,
            benefits,
            timelineItems,
            onOpenCalendly,
            onActivateMembership,
            sectionTitleSize,
            sectionSubSize,
            videoUrl,
            videoWidth,
            scrollRoot,
            solarPasses,
            lugaresDisponibles,
            elementosClave,
            isActiveMember,
        } = props
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, root: scrollRoot }}
                transition={{ duration: 0.8 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    paddingTop: 40,
                    paddingBottom: 80,
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h3
                        className="exact-holo-title"
                        style={{
                            fontSize: sectionTitleSize || 42,
                            fontWeight: 200,
                            margin: "0 0 10px",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            color: "transparent",
                            textShadow: "none",
                            marginBottom: 10,
                            lineHeight: 1.25,
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                background: `linear-gradient(180deg, ${accent}, #fff)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                filter: `drop-shadow(0 0 12px ${hexToRgba(accent, 0.25)})`,
                            }}
                        >
                            CÁMARA SOLAR
                        </span>
                    </h3>
                    <div
                        style={{
                            fontSize: sectionSubSize || 15,
                            letterSpacing: "0.2em",
                            fontWeight: 300,
                            textTransform: "uppercase",
                            lineHeight: 1.5,
                        }}
                    >
                        <motion.span
                            animate={{
                                textShadow: [
                                    `0 0 8px ${hexToRgba(accent, 0.4)}`,
                                    `0 0 18px ${hexToRgba(accent, 0.8)}`,
                                    `0 0 8px ${hexToRgba(accent, 0.4)}`,
                                ],
                                color: [accent, "#FFF", accent],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            style={{
                                fontWeight: 600,
                                display: "inline-block",
                                marginBottom: 4,
                            }}
                        >
                            SESIONES GRUPALES ONLINE
                        </motion.span>
                        <br />
                        <span
                            style={{
                                color: "rgba(230,247,239,0.7)",
                                display: "inline-block",
                            }}
                        >
                            MARTES VIA ZOOM
                        </span>
                    </div>
                    <ScheduleInfo accent={accent} />
                </div>
                <DeskCamaraSolarExplainer
                    accent={accent}
                    videoUrl={videoUrl}
                    videoWidth={videoWidth}
                    scrollRoot={scrollRoot}
                    subtitle={texts.camaraSolarSubtitle}
                    elementosClave={elementosClave}
                />
                <div style={{ height: "15vh", minHeight: 120 }} />
                <motion.h4
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, root: scrollRoot }}
                    style={{
                        textAlign: "center",
                        fontSize: texts.durationTitleSize || 22,
                        fontWeight: 300,
                        color: "#E6F7EF",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: 20,
                        lineHeight: 1.4,
                    }}
                >
                    {formatText(texts.durationTitle)}
                    <br />
                    <span
                        style={{
                            fontSize: texts.durationSubSize || 16,
                            color: "rgba(230,247,239,0.7)",
                            opacity: 0.7,
                            display: "inline-block",
                            marginTop: "4px",
                        }}
                    >
                        {formatText(texts.durationSub)}
                    </span>
                </motion.h4>
                <DeskSessionTimeline
                    items={timelineItems}
                    accent={accent}
                    scrollRoot={scrollRoot}
                />
                <motion.h4
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, root: scrollRoot }}
                    style={{
                        textAlign: "center",
                        fontSize: texts.experienceTitleSize || 22,
                        fontWeight: 300,
                        color: "#E6F7EF",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: 40,
                    }}
                >
                    {formatText(texts.experienceTitle)}
                </motion.h4>
                <DeskBenefitCards
                    items={benefits}
                    accent={accent}
                    scrollRoot={scrollRoot}
                />
                <div style={{ height: "15vh", minHeight: 120 }} />
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, root: scrollRoot }}
                    style={{ textAlign: "center", marginBottom: 5 }}
                >
                    <h3
                        style={{
                            fontSize: texts.entranceTitleSize || 28,
                            fontWeight: 200,
                            color: "#E6F7EF",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            lineHeight: 1.4,
                        }}
                    >
                        {isActiveMember ? (
                            <>
                                {formatText("TU INMERSIÓN SOLAR")}
                                <br />
                                <span
                                    style={{
                                        fontSize: texts.entranceSubSize || 18,
                                        fontWeight: 300,
                                        opacity: 0.7,
                                    }}
                                >
                                    {formatText(
                                        "(NUESTRA SUSCRIPCIÓN MÁS COMPLETA)"
                                    )}
                                </span>
                            </>
                        ) : (
                            <>
                                {formatText(texts.entranceTitle)}
                                <br />
                                <span
                                    style={{
                                        fontSize: texts.entranceSubSize || 18,
                                        fontWeight: 300,
                                        opacity: 0.7,
                                    }}
                                >
                                    {formatText(texts.entranceSub)}
                                </span>
                            </>
                        )}
                    </h3>
                    <div
                        style={{
                            height: 1,
                            maxWidth: 300,
                            margin: "15px auto 0",
                            background: `linear-gradient(90deg, transparent, ${isActiveMember ? "#D4A843" : accent}, transparent)`,
                        }}
                    />
                </motion.div>
                {!isActiveMember && (
                    <>
                        <DeskHolographicPassCard
                            anchorId="pase-grupal"
                            pass={
                                (solarPasses || [])[0] || {
                                    name: "PASE DE\nEXPLORACIÓN",
                                    nameRight: "PASE DE EXPLORACIÓN",
                                    price: "555 MXN",
                                    tag: "Opción Flexible",
                                    desc: "",
                                    features: "",
                                    btnText: "RESERVAR MI LUGAR",
                                }
                            }
                            accent={accent}
                            isGold={false}
                            onClick={() =>
                                onOpenCalendly(
                                    ((solarPasses || [])[0] || {})
                                        .calendlyUrl || texts.calUrlGroup,
                                    "grupal_pulsar"
                                )
                            }
                            scrollRoot={scrollRoot}
                            delay={0.1}
                        />
                        <div style={{ height: "15vh", minHeight: 100 }} />
                    </>
                )}
                <DeskHolographicPassCard
                    anchorId="inmersion"
                    pass={
                        (solarPasses || [])[1] || {
                            name: "INMERSIÓN SOLAR",
                            nameRight: "INMERSIÓN SOLAR",
                            price: "1,111 MXN / mes",
                            tag: "Acceso a Todas las Sesiones del Mes",
                            desc: "",
                            features: "",
                            btnText: "ACTIVAR INMERSIÓN",
                        }
                    }
                    accent={accent}
                    isGold={true}
                    isActiveMember={isActiveMember}
                    onClick={() => {
                        if (isActiveMember) {
                            window.history.replaceState(
                                null,
                                "",
                                "/sesiones#inmersion"
                            )
                            /* v1.6 — Rutea según contexto: si el
                               Tripulante está bajo `/escaner/*` mantiene
                               modo Escáner; si está en `/sesiones`
                               (modo Madre) lo lleva al Núcleo Madre.
                               Aterriza directo en el Estado Orbital
                               (Mi Firma → Orbital), que es donde vive
                               la gestión de Inmersión Solar. */
                            const inEscaner =
                                typeof window !== "undefined" &&
                                window.location.pathname.startsWith(
                                    "/escaner"
                                )
                            const nucleoTarget = inEscaner
                                ? "/escaner/nucleo#mifirma/orbital"
                                : "/nucleo#mifirma/orbital"
                            if (
                                typeof (window as any).rsvNavigate ===
                                "function"
                            )
                                (window as any).rsvNavigate(nucleoTarget)
                            else window.location.href = nucleoTarget
                            return
                        }
                        const p2 = (solarPasses || [])[1] || {}
                        const link = "https://buy.stripe.com/00wcMY1eRcVc4WBh1O0RG0D"
                        if (link && link !== "#" && link !== "") {
                            window.history.replaceState(
                                null,
                                "",
                                "/sesiones#inmersion"
                            )
                            /* v1.5 — withCheckoutIdentity pre-rellena el
                               email del Tripulante + manda el client_reference_id
                               (Clerk user id) para que el webhook enlace la
                               suscripción al perfil correcto.
                               v1.3 — Cupón PRIMERMES auto-aplicado también
                               en el path directo del DeskHolographicPassCard. */
                            const linkWithIdentity = withCheckoutIdentity(link)
                            window.location.href = linkWithIdentity
                        } else onActivateMembership()
                    }}
                    scrollRoot={scrollRoot}
                    delay={0.15}
                    lugaresDisponibles={isActiveMember ? 0 : lugaresDisponibles}
                />
            </motion.div>
        )
    }
)

/* ── Desktop Section: Cámara de Resonancia ── */
const DeskSectionCamaraResonancia = React.forwardRef<HTMLDivElement, any>(
    (props, ref) => {
        const {
            accent,
            texts,
            calUrls,
            onSelect,
            sectionTitleSize,
            sectionSubSize,
            scrollRoot,
            isActiveMember,
        } = props
        const goldA = (x: number) => `rgba(212,168,67,${x})`
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
                name: texts.res30Name || "Afinación Rápida",
                price: "1,333 MXN",
                memberPrice: "888 MXN",
                url: calUrls.calUrl30,
                memberUrl: calUrls.memberCalUrl30 || "",
                slotType: "individual_30",
            },
            {
                time: "45 min",
                name: texts.res45Name || "Recalibración",
                price: "1,777 MXN",
                memberPrice: "1,111 MXN",
                url: calUrls.calUrl45,
                memberUrl: calUrls.memberCalUrl45 || "",
                slotType: "individual_45",
            },
            {
                time: "60 min",
                name: texts.res60Name || "Reconfiguración Profunda",
                price: "2,222 MXN",
                memberPrice: "1,444 MXN",
                url: calUrls.calUrl60,
                memberUrl: calUrls.memberCalUrl60 || "",
                slotType: "individual_60",
            },
        ]
        return (
            <motion.div
                ref={ref}
                id="resonancia"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, root: scrollRoot }}
                transition={{ duration: 0.8 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingTop: 80,
                    paddingBottom: 80,
                }}
            >
                <div
                    style={{
                        height: 1,
                        maxWidth: 600,
                        margin: "0 auto 60px",
                        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        boxShadow: `0 0 15px ${hexToRgba(accent, 0.27)}`,
                    }}
                />
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <h3
                        className="exact-holo-title"
                        style={{
                            fontSize: sectionTitleSize || 42,
                            fontWeight: 200,
                            margin: "0 0 12px",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            color: "transparent",
                            textShadow: "none",
                            lineHeight: 1.25,
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                background: `linear-gradient(180deg, ${accent}, #fff)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                filter: `drop-shadow(0 0 12px ${hexToRgba(accent, 0.25)})`,
                            }}
                        >
                            CÁMARA DE RESONANCIA
                        </span>
                    </h3>
                    <div
                        style={{
                            fontSize: sectionSubSize || 15,
                            letterSpacing: "0.2em",
                            color: "rgba(230,247,239,0.7)",
                            fontWeight: 300,
                            textTransform: "uppercase",
                            marginBottom: 10,
                            lineHeight: 1.5,
                        }}
                    >
                        <motion.span
                            animate={{
                                textShadow: [
                                    `0 0 8px ${hexToRgba(accent, 0.4)}`,
                                    `0 0 18px ${hexToRgba(accent, 0.8)}`,
                                    `0 0 8px ${hexToRgba(accent, 0.4)}`,
                                ],
                                color: [accent, "#FFF", accent],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            style={{ fontWeight: 600, display: "inline-block" }}
                        >
                            SESIONES 1:1 ONLINE
                        </motion.span>
                        <br />
                        <span
                            style={{
                                fontSize: "0.85em",
                                opacity: 0.8,
                                display: "inline-block",
                                marginTop: "4px",
                            }}
                        >
                            VIA ZOOM
                        </span>
                    </div>
                </div>
                
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, root: scrollRoot }}
                    transition={{ delay: 0.2 }}
                    style={{
                        textAlign: "center",
                        fontSize: 20,
                        color: "#E6F7EF",
                        maxWidth: 700,
                        margin: "0 auto 50px",
                        lineHeight: 1.6,
                        fontWeight: 300,
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    {formatText(texts.resSectionDesc)}
                </motion.p>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 24,
                        maxWidth: 920,
                        margin: "0 auto",
                        width: "100%",
                    }}
                >
                    {plans.map((p, i) => {
                        /* 33% OFF en Sesiones 1:1 eliminado (2026-06-09):
                           precio completo para todos, sin precio/link miembro. */
                        const hasMemberPrice = false
                        const activeUrl = p.url
                        return (
                            <motion.div
                                key={i}
                                whileHover={{
                                    y: -6,
                                    borderColor: hasMemberPrice
                                        ? "#D4A843"
                                        : i === 2
                                          ? "#D4A843"
                                          : "rgba(255,255,255,0.2)",
                                    boxShadow:
                                        hasMemberPrice || i === 2
                                            ? "0 0 40px rgba(212,168,67,0.3)"
                                            : `0 0 30px ${hexToRgba(accent, 0.2)}`,
                                }}
                                transition={{ duration: 0.15 }}
                                onClick={() => onSelect(activeUrl, p.slotType)}
                                style={{
                                    background: hasMemberPrice
                                        ? "linear-gradient(145deg, rgba(30,25,15,0.95), rgba(20,18,10,0.9))"
                                        : "linear-gradient(145deg, rgba(20,25,35,0.95), rgba(10,15,20,0.9))",
                                    border: `1px solid ${hasMemberPrice || i === 2 ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                                    borderRadius: 20,
                                    padding: "36px 28px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: 300,
                                    cursor: "pointer",
                                    position: "relative",
                                    boxShadow: hasMemberPrice
                                        ? `0 0 30px ${goldA(0.12)}`
                                        : i === 2
                                          ? "0 0 30px rgba(212,168,67,0.08)"
                                          : "none",
                                }}
                            >
                                {hasMemberPrice ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 14,
                                            right: 14,
                                            background:
                                                "linear-gradient(135deg, #D4A843, #F5D98C)",
                                            color: "#000",
                                            fontSize: 9,
                                            padding: "4px 10px",
                                            borderRadius: 4,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        Tripulante ✦
                                    </div>
                                ) : i === 2 ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 14,
                                            right: 14,
                                            background:
                                                "linear-gradient(135deg, #D4A843, #F5D98C)",
                                            color: "#000",
                                            fontSize: 9,
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Premium
                                    </div>
                                ) : null}
                                <div>
                                    <div
                                        style={{
                                            fontSize: 28,
                                            color: "#E6F7EF",
                                            fontWeight: 600,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {p.time}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            color: "#888",
                                            marginBottom: 20,
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
                                                gap: 6,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 16,
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
                                                        "0 0 8px rgba(212,168,67,0.3)",
                                                        "0 0 18px rgba(212,168,67,0.6)",
                                                        "0 0 8px rgba(212,168,67,0.3)",
                                                    ],
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                }}
                                                style={{
                                                    fontSize: 24,
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
                                                fontSize: 22,
                                                color: "#D4A843",
                                                fontWeight: 500,
                                                textShadow:
                                                    "0 0 12px rgba(212,168,67,0.3)",
                                            }}
                                        >
                                            {p.price}
                                        </div>
                                    )}
                                </div>
                                <GoldenButton
                                    text="AGENDAR MI SINTONÍA"
                                    style={{
                                        borderRadius: 12,
                                        padding: "14px 0",
                                        marginTop: 28,
                                        pointerEvents: "none",
                                    }}
                                />
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        )
    }
)

/* ═══════════════════════════════════════════════════════════════════════════
   SesionesDesktop — Main desktop component (default export)
   ═══════════════════════════════════════════════════════════════════════════ */
function SesionesDesktop(props: any) {
    const {
        domoMode,
        hideCamara = false,
        bgColor,
        accentColor = "#00C2FF",
        textColor = "#E6F7EF",
        numStars = 90,
        warpSpeed = 1,
        topMarginPx = 96,
        contentMaxWidthPx = 1120,
        cardLeftTitle,
        cardLeftSubHeader,
        cardLeftBtn,
        cardRightTitle,
        cardRightSubHeader,
        cardRightBtn,
        calUrl30 = "",
        calUrl45 = "",
        calUrl60 = "",
        calUrlGroup = "",
        calendarCropTop = -50,
        calendarModalWidth = 1060,
        calendarHeight = 750,
        calendarMaskBottomPx = 56,
        faqs = [],
        verticalGroupOffset = 0,
        cardsGap = 40,
        titleSize = 72,
        solarPasses = [],
        linkStripeMembSolar = "#",
        timelineItems = [],
        benefitsGrupal = [],
        resSectionDesc = "",
        res30Name,
        res45Name,
        res60Name,
        lugaresDisponibles = 0,
        sectionTitleSize = 42,
        sectionSubSize = 15,
        camaraSolarVideo = "",
        camaraSolarVideoWidth = 560,
        camaraSolarSubtitle = "",
        elementosClave = [],
        textsUI,
        supabaseUrl = "",
        supabaseAnonKey = "",
        memberCalUrl30 = "",
        memberCalUrl45 = "",
        memberCalUrl60 = "",
        procesarIgnicionPagoUrl = "",
    } = props
    const isActiveMember = useMembershipStatus(supabaseUrl, supabaseAnonKey)
    const {
        durationTitle = "DURACIÓN: 60 MINUTOS",
        durationTitleSize = 22,
        durationSub = "VIA ZOOM",
        durationSubSize = 16,
        experienceTitle = "LO QUE VAS A EXPERIMENTAR EN CADA SESIÓN",
        experienceTitleSize = 22,
        entranceTitle = "ELIGE TU ENTRADA A LA CÁMARA SOLAR",
        entranceTitleSize = 28,
        entranceSub = "(SESIONES GRUPALES)",
        entranceSubSize = 18,
    } = textsUI || {}
    const [modalMode, setModalMode] = useState<"calendly" | null>(null)
    const [activeCalendlyUrl, setActiveCalendlyUrl] = useState<string | null>(
        null
    )
    const [activeSlotType, setActiveSlotType] = useState<SlotType | null>(null)
    const [showFaq, setShowFaq] = useState(false)
    const [showFloating, setShowFloating] = useState(false)
    const [showSideNav, setShowSideNav] = useState(false)
    const [activeSection, setActiveSection] = useState<
        "solar" | "resonancia" | null
    >(null)
    const buttonsShownRef = useRef(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const section2Ref = useRef<HTMLDivElement>(null)
    const section3Ref = useRef<HTMLDivElement>(null)
    const [isReady, setIsReady] = useState(false)
    const { scrollY } = useScroll({ container: scrollRef })
    const heroX = useTransform(scrollY, [0, 800], [0, -150])
    const heroOpacity = useTransform(scrollY, [0, 700], [1, 0])
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 500) {
            if (!buttonsShownRef.current) buttonsShownRef.current = true
            setShowFloating(true)
            setShowSideNav(true)
        } else if (latest < 300) {
            buttonsShownRef.current = false
            setShowFloating(false)
            setShowSideNav(false)
        }
        const s2 = section2Ref.current,
            s3 = section3Ref.current,
            container = scrollRef.current
        if (!container) return
        const viewMid = container.clientHeight * 0.4
        if (s3 && latest + viewMid >= s3.offsetTop)
            setActiveSection("resonancia")
        else if (s2 && latest + viewMid >= s2.offsetTop)
            setActiveSection("solar")
        else setActiveSection(null)
    })

    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        if (typeof window === "undefined") return
        const hash = window.location.hash.replace("#", "")
        if (!hash) return
        const tryScroll = (attempt: number) => {
            const container = scrollRef.current
            if (!container) {
                if (attempt < 20) setTimeout(() => tryScroll(attempt + 1), 200)
                return
            }
            const target = container.querySelector(
                `#${hash}`
            ) as HTMLElement | null
            if (!target) {
                if (attempt < 20) setTimeout(() => tryScroll(attempt + 1), 200)
                return
            }
            let top = 0
            let el: HTMLElement | null = target
            while (el && el !== container) {
                top += el.offsetTop
                el = el.offsetParent as HTMLElement | null
            }
            const offset =
                hash === "inmersion"
                    ? 240
                    : hash === "pase-grupal"
                      ? 330
                      : hash === "resonancia"
                        ? 200
                        : 160
            container.scrollTo({
                top: Math.max(0, top - offset),
                behavior: "instant" as any,
            })
        }
        setTimeout(() => tryScroll(0), 600)
    }, [])
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showFaq) setShowFaq(false)
                else if (modalMode) setModalMode(null)
            }
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [modalMode, showFaq])
    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, [])
    const scrollToSection = useCallback(
        (ref: React.RefObject<HTMLDivElement | null>) => {
            const el = ref.current,
                c = scrollRef.current
            if (!el || !c) return
            c.scrollTo({ top: el.offsetTop - 50, behavior: "smooth" })
        },
        []
    )

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
                background: domoMode ? "transparent" : bgColor,
                overscrollBehavior: "none",
                ["--holo-primary" as any]: accentColor,
                ["--holo-glow" as any]: hexToRgba(accentColor, 0.28),
                ["--holo-title-color" as any]: "rgba(230,247,239,1)",
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: SHARED_CSS }} />
            {!domoMode && (
                <DesktopStarsBackground
                    num={numStars}
                    speed={warpSpeed}
                    bgColor={bgColor}
                />
            )}
            <div
                ref={scrollRef}
                className="membrana-scroll-container"
                style={{
                    color: textColor,
                    fontFamily: "'Inter', sans-serif",
                    overscrollBehavior: "none",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        maxWidth: contentMaxWidthPx,
                        margin: "0 auto",
                        padding: "0 20px 130px",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{
                            opacity: isReady ? 1 : 0,
                            y: isReady
                                ? verticalGroupOffset
                                : verticalGroupOffset - 20,
                        }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        style={{
                            minHeight: "calc(100vh - 200px)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            paddingTop: topMarginPx,
                        }}
                    >
                        <h1
                            className="exact-holo-title"
                            style={{
                                fontSize: titleSize,
                                lineHeight: 1.25,
                                color: "transparent",
                                textShadow: "none",
                            }}
                        >
                            <span
                                style={{
                                    display: "block",
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: `drop-shadow(0 0 12px ${hexToRgba(accentColor, 0.25)})`,
                                }}
                            >
                                SESIONES
                            </span>
                            <span
                                style={{
                                    display: "block",
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: `drop-shadow(0 0 12px ${hexToRgba(accentColor, 0.25)})`,
                                }}
                            >
                                DE CALIBRACIÓN
                            </span>
                        </h1>
                        <motion.div
                            style={{
                                display: "grid",
                                gridTemplateColumns: hideCamara
                                    ? "minmax(320px, 440px)"
                                    : "repeat(auto-fit, minmax(320px, 1fr))",
                                justifyContent: hideCamara
                                    ? "center"
                                    : undefined,
                                gap: cardsGap,
                                x: heroX,
                                opacity: heroOpacity,
                            }}
                        >
                            {!hideCamara && (
                                <DeskPortalCard
                                    accent={accentColor}
                                    icon={
                                        <IconToroid
                                            color="#D4A843"
                                            size={120}
                                        />
                                    }
                                    title={formatText(cardLeftTitle)}
                                    subHeader={formatText(cardLeftSubHeader)}
                                    btnText={formatText(cardLeftBtn)}
                                    onClick={() => scrollToSection(section2Ref)}
                                    delay={0.1}
                                    anchorLink={{
                                        href: isActiveMember
                                            ? "#inmersion"
                                            : "#pase-grupal",
                                    }}
                                    scrollRef={scrollRef}
                                    lugaresDisponibles={lugaresDisponibles}
                                />
                            )}
                            <DeskPortalCard
                                accent={accentColor}
                                icon={
                                    <IconMerkabah color="#D4A843" size={120} />
                                }
                                /* v2.13 — Hardcode para ignorar valores saved
                                   de Framer (regla hardcode-over-Framer-saved). */
                                title="SESIONES 1:1"
                                subHeader="(CÁMARA DE RESONANCIA)"
                                btnText="Explorar"
                                onClick={() => scrollToSection(section3Ref)}
                                delay={0.3}
                            />
                        </motion.div>
                    </motion.div>
                    {!hideCamara && (
                        <>
                    <div style={{ height: "30vh" }} />
                    <DeskSectionCamaraSolar
                        ref={section2Ref}
                        scrollRoot={scrollRef}
                        accent={accentColor}
                        timelineItems={timelineItems}
                        benefits={(benefitsGrupal || []).map((b: any) => ({ ...b, title: (b.title || "").replace(/\bED DE ANCLAJE\b/gi, "RED DE ANCLAJE") }))}
                        solarPasses={solarPasses}
                        lugaresDisponibles={lugaresDisponibles}
                        elementosClave={elementosClave}
                        texts={{
                            camaraSolarSubtitle,
                            calUrlGroup,
                            durationTitle,
                            durationTitleSize,
                            durationSub,
                            durationSubSize,
                            experienceTitle,
                            experienceTitleSize,
                            entranceTitle,
                            entranceTitleSize,
                            entranceSub,
                            entranceSubSize,
                        }}
                        onOpenCalendly={(
                            url: string,
                            slotType?: SlotType
                        ) => {
                            setActiveCalendlyUrl(url)
                            setActiveSlotType(slotType ?? null)
                            setModalMode("calendly")
                        }}
                        onActivateMembership={() => {
                            if (
                                linkStripeMembSolar &&
                                linkStripeMembSolar !== "#"
                            ) {
                                window.history.replaceState(
                                    null,
                                    "",
                                    "/sesiones#inmersion"
                                )
                                /* v1.5 — withCheckoutIdentity pre-rellena
                                   el email + manda client_reference_id.
                                   v1.1 — Cupón PRIMERMES auto-aplicado:
                                   primer mes 1,555 MXN, renovación 1,999. */
                                const linkWithIdentity =
                                    withCheckoutIdentity("https://buy.stripe.com/00wcMY1eRcVc4WBh1O0RG0D")
                                window.location.href = linkWithIdentity
                            }
                        }}
                        sectionTitleSize={sectionTitleSize}
                        sectionSubSize={sectionSubSize}
                        videoUrl={camaraSolarVideo}
                        videoWidth={camaraSolarVideoWidth}
                        isActiveMember={isActiveMember}
                    />
                        </>
                    )}
                    <DeskSectionCamaraResonancia
                        ref={section3Ref}
                        scrollRoot={scrollRef}
                        accent={accentColor}
                        calUrls={{
                            calUrl30,
                            calUrl45,
                            calUrl60,
                            memberCalUrl30,
                            memberCalUrl45,
                            memberCalUrl60,
                        }}
                        texts={{
                            resSectionDesc,
                            res30Name,
                            res45Name,
                            res60Name,
                        }}
                        onSelect={(url: string, slotType?: SlotType) => {
                            setActiveCalendlyUrl(url)
                            setActiveSlotType(slotType ?? null)
                            setModalMode("calendly")
                        }}
                        sectionTitleSize={sectionTitleSize}
                        sectionSubSize={sectionSubSize}
                        isActiveMember={isActiveMember}
                    />
                </div>
            </div>
            <DeskStickySideNav
                show={showSideNav && !hideCamara}
                accent={accentColor}
                activeSection={activeSection}
                onGoGrupales={() => scrollToSection(section2Ref)}
                onGoPrivadas={() => scrollToSection(section3Ref)}
            />
            <DeskFloatingButtons
                onFaqClick={() => setShowFaq(true)}
                onScrollTop={scrollToTop}
                show={showFloating && !showFaq}
                accent={accentColor}
            />
            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {modalMode && (
                            <DeskModalOverlay
                                onClose={() => setModalMode(null)}
                            >
                                {modalMode === "calendly" &&
                                    activeCalendlyUrl &&
                                    (procesarIgnicionPagoUrl ? (
                                        <div
                                            style={{
                                                background:
                                                    "linear-gradient(145deg, rgba(8,14,28,0.95), rgba(5,10,20,0.98))",
                                                border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                                                boxShadow: `0 0 40px ${hexToRgba(accentColor, 0.15)}, 0 20px 60px rgba(0,0,0,0.6)`,
                                                borderRadius: 24,
                                                position: "relative",
                                                width: 960,
                                                maxWidth:
                                                    "calc(100vw - 40px)",
                                                padding: 40,
                                                marginTop: 50,
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    setModalMode(null)
                                                }
                                                style={{
                                                    position: "absolute",
                                                    top: 14,
                                                    right: 14,
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: "50%",
                                                    border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                                                    background: "transparent",
                                                    color: accentColor,
                                                    fontSize: 16,
                                                    cursor: "pointer",
                                                    zIndex: 2,
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
                                                accentColor={accentColor}
                                                isActiveMember={
                                                    isActiveMember
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <DeskCalendlyModalView
                                            onClose={() =>
                                                setModalMode(null)
                                            }
                                            url={activeCalendlyUrl}
                                            accent={accentColor}
                                            maskBottomPx={
                                                calendarMaskBottomPx
                                            }
                                            cropTop={calendarCropTop}
                                            modalWidth={calendarModalWidth}
                                            height={calendarHeight}
                                        />
                                    ))}
                            </DeskModalOverlay>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {showFaq && (
                            <DeskFAQModal
                                onClose={() => setShowFaq(false)}
                                items={faqs}
                                accent={accentColor}
                            />
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

SesionesDesktop.displayName = "SesionesDesktop"

export default SesionesDesktop
