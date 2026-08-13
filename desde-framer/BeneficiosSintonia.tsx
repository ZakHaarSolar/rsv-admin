// BeneficiosSintonia.tsx v1.5 — + beneficio "Afirmaciones diarias personalizadas" (Ritual Diario; catálogo curado + las tuyas) con su SVG de estrella; highlight kind="afirmaciones". v1.4 — + beneficio "Navegante de la Red completo" (20 Membranas; primer nivel libre) con su SVG de red de nodos; highlight kind="navegantes". v1.3 — Cada beneficio con su SVG propio (radar · biblioteca
// · lente · cristal facetado); copy del Decodificador sin "dictamen crudo" ni em-dash;
// Cristales sin la cláusula de no-acumulables. Panel como CARRUSEL HORIZONTAL:
// una tarjeta de presentación a la vez, se DESLIZA de lado (no scroll vertical),
// con puntos indicadores que se pueden tocar. Se abre desde el muro
// (botón "Conocer todos los beneficios") o standalone.
//
// Default export = componente. Otros archivos lo importan como:
//   import BeneficiosSintonia from "./BeneficiosSintonia.tsx"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"
import Shared from "./EV_Shared.tsx"
const { withCheckoutIdentity, SINTONIA_SOLAR_LINK } = Shared

const GOLD = "#D4AF37"
const CYAN = "#00E5FF"
const SOFT_CYAN = "#7DEFFF"

type Highlight =
    | "radar"
    | "decoder"
    | "calibraciones"
    | "navegantes"
    | "afirmaciones"
    | "cristales"
    | null

const BENEFICIOS: Array<{
    sigil: string
    titulo: string
    bajada: string
    keys: Highlight[]
}> = [
    {
        sigil: "◈",
        titulo: "Radar Vibracional ilimitado",
        bajada:
            "Re-escanea tu campo cada 7 días, ciclo evolutivo del Holograma, para medir transmutación real y no fluctuaciones estáticas. Tu trayectoria queda anclada en el archivo del Sol.",
        keys: ["radar"],
    },
    {
        sigil: "✦",
        titulo: "Biblioteca de Calibraciones desencriptada",
        bajada:
            "Acceso a cada Calibración cifrada de los seis pilares (Hardware, Procesador, Motor, Gravedad, Vector, Órbita). Rituales, eliminaciones e instalaciones quirúrgicas que solo se abren al firmar Sintonía.",
        keys: ["calibraciones"],
    },
    {
        sigil: "⬡",
        titulo: "Navegante de la Red completo",
        bajada:
            "El primer campo es libre para todos; con Sintonía se abren las 20 Membranas del simulador, cada una un código geométrico distinto que entrenas atravesando.",
        keys: ["navegantes"],
    },
    {
        sigil: "✷",
        titulo: "Afirmaciones diarias personalizadas",
        bajada:
            "En tu Ritual Diario eliges afirmaciones de un catálogo curado por categoría y escribes las tuyas; las lees y confirmas cada día para anclar tu frecuencia y sumar Fotones.",
        keys: ["afirmaciones"],
    },
    {
        sigil: "◉",
        titulo: "Decodificador de Materia y Sueños sin límite",
        bajada:
            "Escaneos ilimitados al lente: la vibración de tus alimentos, cosméticos y productos de limpieza, más el descifrado de tus sueños. Elimina el ruido de tu vida.",
        keys: ["decoder"],
    },
    {
        sigil: "✺",
        titulo: "Dos Cristales de Extracción mensuales",
        bajada:
            "Cada luna recibes dos cristales para canjear en la Holoteca: 1 para un Códice y 1 para una Meditación.",
        keys: ["cristales"],
    },
]

interface Props {
    onClose?: () => void
    /** Pilar/feature que originó la apertura — esa tarjeta se abre primero. */
    highlight?: Highlight
    /** Acción de activación inyectada por la compuerta padre. En iOS dispara
        la compra de StoreKit; en web navega al Payment Link. Cuando viene
        definida, el CTA la usa en lugar de abrir Stripe directo — así la app
        nativa nunca lanza un checkout web (App Store 3.1.1). */
    onActivate?: () => void
}

function BeneficiosSintonia({
    onClose = () => {},
    highlight = null,
    onActivate,
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState(0)

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [onClose])

    /* Abrir directo en la tarjeta del feature que originó el muro. */
    useEffect(() => {
        if (highlight == null) return
        const idx = BENEFICIOS.findIndex((b) => b.keys.includes(highlight))
        if (idx <= 0) return
        requestAnimationFrame(() => {
            const el = scrollRef.current
            if (!el) return
            el.scrollTo({ left: idx * el.clientWidth, behavior: "auto" })
            setActive(idx)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onScroll = () => {
        const el = scrollRef.current
        if (!el) return
        const w = el.clientWidth || 1
        setActive(Math.max(0, Math.round(el.scrollLeft / w)))
    }

    const goTo = (i: number) => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
    }

    const ctaUrl = withCheckoutIdentity(SINTONIA_SOLAR_LINK)

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                background: "rgba(2,5,12,0.92)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 16px",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "min(460px, 100%)",
                    maxHeight: "88vh",
                    overflow: "hidden",
                    padding: "44px 22px 24px",
                    borderRadius: 26,
                    background:
                        "radial-gradient(120% 100% at 50% -10%, rgba(212,175,55,0.16), transparent 55%), radial-gradient(120% 100% at 50% 110%, rgba(0,229,255,0.10), transparent 55%), rgba(8,12,22,0.94)",
                    border: `1px solid ${GOLD}55`,
                    boxShadow: `0 0 80px rgba(212,175,55,0.18), 0 0 200px rgba(0,229,255,0.10), inset 0 0 60px rgba(0,0,0,0.5)`,
                    color: "#E8F7FF",
                }}
            >
                <style>{`.benef-carousel::-webkit-scrollbar{display:none}`}</style>
                {/* Cierre flotante */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute",
                        top: 14,
                        right: 16,
                        background: "transparent",
                        border: "none",
                        color: "#E8F7FF",
                        fontSize: 22,
                        fontWeight: 200,
                        cursor: "pointer",
                        opacity: 0.7,
                        padding: "6px 10px",
                        zIndex: 2,
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.7")
                    }
                >
                    ×
                </button>

                {/* Encabezado */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.42em",
                            textTransform: "uppercase",
                            color: GOLD,
                            opacity: 0.85,
                            fontWeight: 600,
                            marginBottom: 4,
                        }}
                    >
                        ✦&nbsp;&nbsp;Beneficios&nbsp;&nbsp;✦
                    </div>
                    <h2
                        style={{
                            margin: "6px 0 6px",
                            fontSize: 28,
                            fontWeight: 200,
                            letterSpacing: "0.12em",
                            lineHeight: 1.1,
                            background: `linear-gradient(180deg, ${GOLD}, ${SOFT_CYAN})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            textTransform: "uppercase",
                        }}
                    >
                        Sintonía Solar
                    </h2>
                    <div
                        style={{
                            fontSize: 11.5,
                            opacity: 0.62,
                            maxWidth: 320,
                            margin: "0 auto",
                            lineHeight: 1.5,
                            color: "#C9DCE7",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Desliza para conocer todo lo que se desencripta.
                    </div>
                </div>

                {/* CARRUSEL horizontal — una tarjeta a la vez, swipe lateral. */}
                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    className="benef-carousel"
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        margin: "0 -22px",
                        touchAction: "pan-x",
                    }}
                >
                    {BENEFICIOS.map((b, i) => {
                        const isHi =
                            highlight !== null && b.keys.includes(highlight)
                        return (
                            <BeneficioCard
                                key={i}
                                {...b}
                                highlighted={isHi}
                            />
                        )
                    })}
                </div>

                {/* Puntos indicadores */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 14,
                        marginBottom: 18,
                    }}
                >
                    {BENEFICIOS.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Beneficio ${i + 1}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                goTo(i)
                            }}
                            style={{
                                width: i === active ? 22 : 7,
                                height: 7,
                                borderRadius: 999,
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                background:
                                    i === active
                                        ? GOLD
                                        : "rgba(255,255,255,0.22)",
                                boxShadow:
                                    i === active
                                        ? `0 0 12px ${GOLD}88`
                                        : "none",
                                transition: "all 0.3s ease",
                            }}
                        />
                    ))}
                </div>

                {/* CTA */}
                <a
                    href={onActivate ? undefined : ctaUrl}
                    onClick={(e) => {
                        e.preventDefault()
                        if (onActivate) {
                            onActivate()
                            return
                        }
                        window.location.assign(ctaUrl)
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: "15px 18px",
                        margin: "0 auto",
                        width: "100%",
                        maxWidth: 420,
                        borderRadius: 14,
                        background: `linear-gradient(180deg, ${GOLD}, #b58e2c)`,
                        color: "#1a1208",
                        fontWeight: 700,
                        fontSize: 13.5,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        boxShadow: `0 0 30px ${GOLD}55, inset 0 -3px 8px rgba(0,0,0,0.18)`,
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = `0 0 44px ${GOLD}88, inset 0 -3px 8px rgba(0,0,0,0.18)`
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = `0 0 30px ${GOLD}55, inset 0 -3px 8px rgba(0,0,0,0.18)`
                    }}
                >
                    <span style={{ whiteSpace: "nowrap" }}>
                        Activar Sintonía Solar
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 500,
                            opacity: 0.78,
                            letterSpacing: "0.12em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        599 MXN / mes
                    </span>
                </a>
                <div
                    style={{
                        textAlign: "center",
                        marginTop: 12,
                        fontSize: 10,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        opacity: 0.42,
                    }}
                >
                    Cancela cuando tu trayectoria lo dicte
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* Ícono SVG propio por beneficio (no un carácter unicode). El de cristales
   reusa la geometría del CristalGlyph de la Holoteca. */
function BenefitIcon({ kind, color }: { kind: Highlight; color: string }) {
    const common = {
        width: 30,
        height: 30,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: 1.5,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        style: { filter: `drop-shadow(0 0 6px ${color}66)` },
    }
    if (kind === "radar")
        return (
            <svg {...common}>
                <circle cx="12" cy="12" r="9" opacity="0.35" />
                <circle cx="12" cy="12" r="5" opacity="0.7" />
                <circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
                <line x1="12" y1="12" x2="20" y2="5.5" />
            </svg>
        )
    if (kind === "calibraciones")
        return (
            <svg {...common}>
                <path d="M12 3 L21 7.5 L12 12 L3 7.5 Z" />
                <path d="M3 12 L12 16.5 L21 12" opacity="0.7" />
                <path d="M3 16.5 L12 21 L21 16.5" opacity="0.45" />
            </svg>
        )
    if (kind === "decoder")
        return (
            <svg {...common}>
                <circle cx="10.5" cy="10.5" r="7" opacity="0.7" />
                <line x1="6" y1="10.5" x2="15" y2="10.5" opacity="0.55" />
                <line x1="15.7" y1="15.7" x2="20.5" y2="20.5" />
            </svg>
        )
    if (kind === "navegantes")
        return (
            <svg {...common}>
                <line x1="12" y1="12" x2="5" y2="5" opacity="0.55" />
                <line x1="12" y1="12" x2="19" y2="7.5" opacity="0.55" />
                <line x1="12" y1="12" x2="7" y2="19" opacity="0.55" />
                <circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
                <circle cx="5" cy="5" r="1.7" />
                <circle cx="19" cy="7.5" r="1.7" />
                <circle cx="7" cy="19" r="1.7" />
            </svg>
        )
    if (kind === "afirmaciones")
        return (
            <svg {...common}>
                <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                <path d="M18.5 15l.6 1.8L21 17.4l-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" opacity="0.7" />
            </svg>
        )
    /* cristales — hexágono facetado (eco del CristalGlyph) */
    return (
        <svg {...common}>
            <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
            <line
                x1="12"
                y1="2"
                x2="12"
                y2="22"
                strokeWidth="0.8"
                opacity="0.6"
            />
            <line
                x1="2"
                y1="7"
                x2="22"
                y2="17"
                strokeWidth="0.8"
                opacity="0.5"
            />
            <line
                x1="22"
                y1="7"
                x2="2"
                y2="17"
                strokeWidth="0.8"
                opacity="0.5"
            />
        </svg>
    )
}

/* Tarjeta de presentación de un beneficio. Ocupa el 100% del ancho del
   carrusel (snap centrado); alto fijo para que los puntos y el CTA no salten. */
function BeneficioCard({
    keys,
    titulo,
    bajada,
    highlighted,
}: {
    keys: Highlight[]
    titulo: string
    bajada: string
    highlighted?: boolean
    sigil?: string
}) {
    const acc = highlighted ? GOLD : CYAN
    return (
        <div
            style={{
                flex: "0 0 100%",
                scrollSnapAlign: "center",
                boxSizing: "border-box",
                padding: "8px 22px 4px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 14,
                    minHeight: 300,
                    padding: "22px 18px",
                    borderRadius: 18,
                    border: `1px solid ${highlighted ? GOLD + "66" : "rgba(255,255,255,0.08)"}`,
                    background: highlighted
                        ? `linear-gradient(180deg, ${GOLD}18, ${GOLD}05)`
                        : "rgba(255,255,255,0.025)",
                    boxShadow: highlighted
                        ? `0 0 26px ${GOLD}2E, inset 0 0 22px ${GOLD}10`
                        : "inset 0 0 30px rgba(0,0,0,0.3)",
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid ${acc}55`,
                        background: highlighted ? `${GOLD}1E` : `${CYAN}0E`,
                    }}
                >
                    <BenefitIcon
                        kind={keys[0] ?? null}
                        color={highlighted ? GOLD : SOFT_CYAN}
                    />
                </div>
                <div
                    style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: highlighted ? GOLD : "#FFFFFF",
                        letterSpacing: "0.01em",
                        lineHeight: 1.25,
                        maxWidth: 300,
                    }}
                >
                    {titulo}
                </div>
                <div
                    style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#B8CFDB",
                        opacity: highlighted ? 0.95 : 0.82,
                        maxWidth: 320,
                    }}
                >
                    {bajada}
                </div>
            </div>
        </div>
    )
}

BeneficiosSintonia.displayName = "BeneficiosSintonia"
export default BeneficiosSintonia
