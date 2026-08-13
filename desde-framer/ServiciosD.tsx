import * as React from "react"
import {
    useMemo,
    useState,
    memo,
    useLayoutEffect,
    useEffect,
    useRef,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* -------------------------------------------------------------------------- */
/*                                  UTILS                                     */
/* -------------------------------------------------------------------------- */

const formatText = (text: string) => {
    if (!text) return null
    return text.split("\\n").map((str, i, arr) => (
        <React.Fragment key={i}>
            {str}
            {i < arr.length - 1 && <br />}
        </React.Fragment>
    ))
}

/* -------------------------------------------------------------------------- */
/*                                  ICONS                                     */
/* -------------------------------------------------------------------------- */

const IconSol = ({ color }: { color: string }) => (
    <motion.div
        style={{
            width: "100%",
            height: "100%",
            filter: `drop-shadow(0 0 12px ${color})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" />
            <path
                d="M12 2V6"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M12 18V22"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M4.92993 4.92999L7.75993 7.75999"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M16.24 16.24L19.07 19.07"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M2 12H6"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M18 12H22"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M4.92993 19.07L7.75993 16.24"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M16.24 7.75999L19.07 4.92999"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    </motion.div>
)

const IconPulse = ({ color }: { color: string }) => (
    <motion.div
        style={{
            width: "100%",
            height: "100%",
            filter: `drop-shadow(0 0 8px ${color})`,
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
            <path
                d="M2 12H5.5L8 5L12 19L15.5 12H22"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </motion.div>
)

const CloseButton = ({
    onClick,
    style,
}: {
    onClick: () => void
    style?: any
}) => (
    <motion.button
        onClick={onClick}
        initial={{ rotate: 0 }}
        whileHover={{
            rotate: 90,
            scale: 1.1,
            backgroundColor: "rgba(255,255,255,0.2)",
        }}
        whileTap={{ scale: 0.9 }}
        style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 50,
            backdropFilter: "blur(4px)",
            ...style,
        }}
    >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    </motion.button>
)

/* -------------------------------------------------------------------------- */
/*                                  CSS EFFECTS                               */
/* -------------------------------------------------------------------------- */

const SHARED_CSS = String.raw`
/* Importamos Inter Thin 100 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap');

/* Stars Warp */
.stars-warp-container {
    position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0;
    pointer-events: none; overflow: hidden; perspective: 400px; 
    background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
}
.star-warp {
    position: absolute; left: 50%; top: 50%; width: var(--size); height: var(--size);
    border-radius: 50%; background: #FFFFFF;
    box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.8);
    animation: space-flight var(--dur) linear infinite;
    animation-delay: var(--delay);
    opacity: 0; will-change: transform, opacity;
}
@keyframes space-flight {
    0% { transform: translate3d(var(--x), var(--y), -1000px); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translate3d(var(--x), var(--y), 200px); opacity: 0; }
}

/* Scroll Container */
html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; }
.membrana-scroll-container::-webkit-scrollbar { display: none; width: 0px; background: transparent; }
.membrana-scroll-container { 
    scrollbar-width: none; -ms-overflow-style: none; 
    overflow-y: auto; overflow-x: hidden;
    height: 100vh; width: 100%; position: relative; z-index: 2;
}

/* --- CLASE DE TÍTULO UNIFICADA CON GLOW Y ANIMACIÓN --- */
.exact-holo-title {
  font-family: 'Inter', sans-serif;
  font-weight: 100; /* Thin exacto */
  letter-spacing: 0.4em;
  margin-right: -0.4em;
  line-height: 1;
  margin: 0;
  text-transform: uppercase;
  text-align: center;
  width: 100%;
  display: block;
  user-select: none;
  
  /* Márgen inferior integrado en la clase */
  margin-bottom: 80px;

  /* Color Mix exacto usando variables inyectadas */
  color: color-mix(in srgb, #FFFFFF 80%, var(--holo-primary));
  
  /* Shadows exactos usando variables inyectadas */
  text-shadow: 0 0 10px var(--holo-primary), 0 0 25px var(--holo-glow);
  
  /* Renderizado nítido */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Animación Breath exacta */
  animation: breath 7s ease-in-out infinite;
}

@keyframes breath {
    0%,100% { filter: brightness(1); }
    50% { filter: brightness(1.12); }
}

/* --- COMING SOON PULSE --- */
@keyframes comingSoonPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}
.coming-soon-badge {
    animation: comingSoonPulse 3s ease-in-out infinite;
}
`

function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "holo-bifurcacion-styles-v24-final"
        if (!document.getElementById(id)) {
            const s = document.createElement("style")
            s.id = id
            s.textContent = SHARED_CSS
            document.head.appendChild(s)
        }
    }, [])
}

/* -------------------------------------------------------------------------- */
/*                            CALENDLY WIDGET LOADER                          */
/* -------------------------------------------------------------------------- */

function useCalendlyScript() {
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "calendly-widget-js"
        if (document.getElementById(id)) return

        const s = document.createElement("script")
        s.id = id
        s.src = "https://assets.calendly.com/assets/external/widget.js"
        s.async = true
        document.body.appendChild(s)
    }, [])
}

const buildCalendlyUrl = (input: string, accent: string) => {
    const cleanUrl = (raw: string) => {
        if (!raw) return ""
        const t = raw.trim()
        if (t.startsWith("http")) return t
        const match = t.match(/data-url="([^"]+)"/)
        if (match && match[1]) return match[1]
        return t
    }

    const base = cleanUrl(input)
    if (!base) return ""

    const safeAccent = (accent || "#00C2FF").replace("#", "")
    const separator = base.includes("?") ? "&" : "?"
    return `${base}${separator}background_color=080C14&text_color=ffffff&primary_color=${safeAccent}`
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTS                                */
/* -------------------------------------------------------------------------- */

const StarsBackground = memo(
    ({ num = 90, speed = 1, bgColor = "#0B0C13" }: any) => {
        const [stars, setStars] = useState<any[]>([])
        useEffect(() => {
            const arr = []
            const total = Math.floor(num * 1.5)
            for (let i = 0; i < total; i++) {
                arr.push({
                    id: i,
                    size:
                        Math.random() > 0.8
                            ? Math.random() * 2 + 1
                            : Math.random() * 1.5 + 0.5,
                    x: (Math.random() - 0.5) * 250,
                    y: (Math.random() - 0.5) * 250,
                    baseDuration: 1.5 + Math.random() * 4,
                    delay: Math.random() * 5,
                })
            }
            setStars(arr)
        }, [num])
        return (
            <div
                className="stars-warp-container"
                style={{ backgroundColor: bgColor }}
            >
                {stars.map((s) => (
                    <div
                        key={s.id}
                        className="star-warp"
                        style={{
                            ["--size" as any]: `${s.size}px`,
                            ["--x" as any]: `${s.x}vw`,
                            ["--y" as any]: `${s.y}vh`,
                            ["--dur" as any]: `${s.baseDuration / speed}s`,
                            ["--delay" as any]: `${s.delay}s`,
                        }}
                    />
                ))}
            </div>
        )
    }
)

/* -------------------------------------------------------------------------- */
/*                                  MAIN LOGIC                                */
/* -------------------------------------------------------------------------- */

export function ServiciosBifurcacion(props: any) {
    useInjectCss()
    const {
        bgColor,
        accentColor,
        textColor,
        numStars,
        warpSpeed,
        topMarginPx,
        contentMaxWidthPx,
        cardLeftTitle,
        cardLeftSub,
        cardLeftPrice,
        cardLeftBtn,
        cardRightTitle,
        cardRightSub,
        cardRightPrice,
        cardRightBtn,
        modalGroupTitle,
        modalGroupDesc,
        passTitle,
        passPrice,
        passBenefit,
        passBtn,
        membTitle,
        membPrice,
        membBenefit,
        membBtn,
        membFeatures,
        modalIndivTitle,
        modalIndivDesc,
        linkStripeMembresia,
        calUrlGroup,
        calUrl30,
        calUrl45,
        calUrl60,
        modalTopOffset,
        calendarCropTop,
        calendarModalWidth,
        calendarHeight,
        calendarMaskBottomPx,
        faqTitle,
        faqs,
        // Controles de posición
        verticalGroupOffset,
        cardsGap,
        titleSize,
        // ✦ NUEVO: Toggle Coming Soon
        comingSoon,
    } = props

    const [modalMode, setModalMode] = useState<"group" | "individual" | null>(
        null
    )
    const [showProtocol, setShowProtocol] = useState(false)

    // Estado para animación de entrada
    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showProtocol) setShowProtocol(false)
                else if (modalMode) setModalMode(null)
            }
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [modalMode, showProtocol])

    const glassStyle = {
        background:
            "linear-gradient(145deg, rgba(20, 25, 35, 0.95) 0%, rgba(10, 15, 20, 0.9) 100%)",
        border: `1px solid ${accentColor}44`,
        boxShadow: `0 20px 50px -10px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(255,255,255,0.03)`,
    }

    const rootStyle: React.CSSProperties = {
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: bgColor,
        /* Inyectamos las variables CSS para que la clase .exact-holo-title las encuentre */
        ["--holo-primary" as any]: accentColor,
        ["--holo-glow" as any]: `color-mix(in srgb, ${accentColor} 28%, transparent)`,
    }

    return (
        <div style={rootStyle}>
            <StarsBackground
                num={numStars}
                speed={warpSpeed}
                bgColor={bgColor}
            />

            <div
                className="membrana-scroll-container"
                style={{ color: textColor, fontFamily: "'Inter', sans-serif" }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        maxWidth: contentMaxWidthPx,
                        margin: "0 auto",
                        padding: `${topMarginPx}px 20px 100px`,
                    }}
                >
                    {/* WRAPPER PRINCIPAL: Controla entrada y offset */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{
                            opacity: isReady ? 1 : 0,
                            y: isReady
                                ? verticalGroupOffset
                                : verticalGroupOffset - 20,
                        }}
                        transition={{
                            duration: 1.2,
                            delay: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        {/* TÍTULO EXACTO CON GLOW (Usando la clase CSS) */}
                        <h1
                            className="exact-holo-title"
                            style={{ fontSize: titleSize }}
                        >
                            SESIONES
                        </h1>

                        {/* Bifurcación (Grid de Tarjetas) */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(320px, 1fr))",
                                gap: cardsGap,
                                marginBottom: comingSoon ? 0 : 100,
                            }}
                        >
                            <PortalCard
                                accent={accentColor}
                                glass={glassStyle}
                                icon={<IconSol color={accentColor} />}
                                title={
                                    comingSoon
                                        ? "SESIONES GRUPALES"
                                        : formatText(cardLeftTitle)
                                }
                                sub={
                                    comingSoon ? null : formatText(cardLeftSub)
                                }
                                price={
                                    comingSoon
                                        ? null
                                        : formatText(cardLeftPrice)
                                }
                                btnText={
                                    comingSoon ? null : formatText(cardLeftBtn)
                                }
                                onClick={
                                    comingSoon
                                        ? undefined
                                        : () => setModalMode("group")
                                }
                                delay={0.1}
                                comingSoon={comingSoon}
                            />
                            <PortalCard
                                accent={accentColor}
                                glass={glassStyle}
                                icon={<IconPulse color={accentColor} />}
                                title={
                                    comingSoon
                                        ? "SESIONES 1-1"
                                        : formatText(cardRightTitle)
                                }
                                sub={
                                    comingSoon ? null : formatText(cardRightSub)
                                }
                                price={
                                    comingSoon
                                        ? null
                                        : formatText(cardRightPrice)
                                }
                                btnText={
                                    comingSoon ? null : formatText(cardRightBtn)
                                }
                                onClick={
                                    comingSoon
                                        ? undefined
                                        : () => setModalMode("individual")
                                }
                                delay={0.3}
                                comingSoon={comingSoon}
                            />
                        </div>
                    </motion.div>

                    {/* ✦ Todo lo de abajo se oculta cuando comingSoon está ON */}
                    {!comingSoon && (
                        <>
                            {/* Protocol Link */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                whileHover={{ opacity: 1, scale: 1.05 }}
                                style={{
                                    textAlign: "center",
                                    marginBottom: 120,
                                    fontSize: 18,
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    letterSpacing: "0.05em",
                                    color: "#E6F7EF",
                                }}
                                onClick={() => setShowProtocol(true)}
                            >
                                ¿Cómo funciona el protocolo de conexión?
                            </motion.div>

                            {/* FAQ Section */}
                            <FAQSection
                                title={faqTitle}
                                items={faqs}
                                accent={accentColor}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* ✦ Modales solo se renderizan si comingSoon está OFF */}
            {!comingSoon && (
                <AnimatePresence>
                    {modalMode && (
                        <ModalOverlay
                            onClose={() => setModalMode(null)}
                            topOffset={modalTopOffset}
                        >
                            {modalMode === "group" ? (
                                <GroupContent
                                    onClose={() => setModalMode(null)}
                                    accent={accentColor}
                                    texts={{
                                        modalGroupTitle,
                                        modalGroupDesc,
                                        passTitle,
                                        passPrice,
                                        passBenefit,
                                        passBtn,
                                        membTitle,
                                        membPrice,
                                        membBenefit,
                                        membBtn,
                                        membFeatures,
                                    }}
                                    linkStripeMembresia={linkStripeMembresia}
                                    calUrlGroup={calUrlGroup}
                                    calendarConfig={{
                                        calendarCropTop,
                                        calendarModalWidth,
                                        calendarHeight,
                                        calendarMaskBottomPx,
                                    }}
                                />
                            ) : (
                                <IndividualContent
                                    onClose={() => setModalMode(null)}
                                    accent={accentColor}
                                    texts={{ modalIndivTitle, modalIndivDesc }}
                                    calUrls={{ calUrl30, calUrl45, calUrl60 }}
                                    calendarCropTop={calendarCropTop}
                                    calendarModalWidth={calendarModalWidth}
                                    calendarHeight={calendarHeight}
                                    calendarMaskBottomPx={calendarMaskBottomPx}
                                />
                            )}
                        </ModalOverlay>
                    )}

                    {showProtocol && (
                        <ProtocolModal
                            onClose={() => setShowProtocol(false)}
                            accent={accentColor}
                            topOffset={modalTopOffset}
                        />
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

const PortalCard = ({
    accent,
    glass,
    icon,
    title,
    sub,
    price,
    btnText,
    onClick,
    delay,
    comingSoon,
}: any) => {
    const [hover, setHover] = useState(false)
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8, ease: "easeOut" }}
            onHoverStart={() => !comingSoon && setHover(true)}
            onHoverEnd={() => setHover(false)}
            onClick={onClick}
            style={{
                ...glass,
                borderRadius: 24,
                padding: "60px 40px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: comingSoon ? "default" : "pointer",
                position: "relative",
                overflow: "hidden",
                height: "100%",
                minHeight: comingSoon ? 380 : 480,
            }}
        >
            <motion.div
                animate={{ opacity: hover ? 0.15 : 0, scale: hover ? 1.4 : 1 }}
                style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    x: "-50%",
                    width: 250,
                    height: 250,
                    background: accent,
                    filter: "blur(90px)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    width: 80,
                    height: 80,
                    marginBottom: 32,
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {icon}
            </div>
            <h2
                style={{
                    fontSize: 32,
                    fontWeight: 300,
                    margin: "0 0 12px 0",
                    letterSpacing: "0.15em",
                    color: "#E6F7EF",
                    textShadow: `0 0 20px ${accent}44`,
                }}
            >
                {title}
            </h2>

            {/* ✦ COMING SOON: Mostrar badge en lugar del contenido normal */}
            {comingSoon ? (
                <div
                    style={{
                        marginTop: "auto",
                        marginBottom: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 20,
                    }}
                >
                    <div
                        className="coming-soon-badge"
                        style={{
                            fontSize: 16,
                            fontWeight: 400,
                            letterSpacing: "0.35em",
                            color: accent,
                            textTransform: "uppercase",
                            textShadow: `0 0 20px ${accent}66`,
                        }}
                    >
                        PRÓXIMAMENTE
                    </div>
                    <div
                        style={{
                            width: 60,
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
                        }}
                    />
                </div>
            ) : (
                <>
                    <p
                        style={{
                            fontSize: 16,
                            opacity: 0.7,
                            margin: "0 0 40px 0",
                            lineHeight: 1.6,
                            maxWidth: "280px",
                            color: "#E6F7EF",
                        }}
                    >
                        {sub}
                    </p>
                    <div style={{ marginTop: "auto", width: "100%" }}>
                        <div
                            style={{
                                fontSize: 20,
                                color: accent,
                                marginBottom: 20,
                                fontWeight: 500,
                            }}
                        >
                            {price}
                        </div>
                        <div
                            style={{
                                border: `1px solid ${accent}66`,
                                borderRadius: 50,
                                padding: "16px 0",
                                fontSize: 14,
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                                background: hover
                                    ? `${accent}11`
                                    : "transparent",
                                transition: "all 0.3s",
                                boxShadow: hover
                                    ? `0 0 20px ${accent}22`
                                    : "none",
                                color: "#E6F7EF",
                            }}
                        >
                            {btnText}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    )
}

const ModalOverlay = ({ onClose, children, topOffset }: any) => {
    // Bloquea scroll del body SOLO mientras el modal está abierto
    useEffect(() => {
        if (typeof document === "undefined") return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 20,
                background: "rgba(0,0,0,0.9)",
                backdropFilter: "blur(14px)",
                overscrollBehavior: "contain",
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: "98vh",
                    overflowY: "auto",
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    margin: "0 auto",
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

const GroupContent = ({
    onClose,
    accent,
    texts,
    linkStripeMembresia,
    calUrlGroup,
    calendarConfig,
}: any) => {
    const [activeEmbed, setActiveEmbed] = useState<string | null>(null)

    const {
        calendarCropTop,
        calendarModalWidth,
        calendarHeight,
        calendarMaskBottomPx,
    } = calendarConfig || {}

    const modalStyle = {
        background: "#080C14",
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 0 60px rgba(0,0,0,0.9)`,
        borderRadius: 24,
        padding: activeEmbed ? "0" : "50px 40px",
        position: "relative" as const,
        minHeight: activeEmbed ? 700 : 0,
        height: activeEmbed ? calendarHeight : "auto",
        overflow: activeEmbed ? "hidden" : "visible",
        maxWidth: activeEmbed ? calendarModalWidth : 960,
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        transition: "max-width 0.4s ease-in-out, height 0.4s ease-in-out",
        margin: "0 auto",
    }

    if (activeEmbed) {
        const rawUrl = String(activeEmbed || "").trim()

        return (
            <div style={modalStyle}>
                <div
                    style={{
                        height: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 25px",
                        background: "#080C14",
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 20,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <button
                        onClick={() => setActiveEmbed(null)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#E6F7EF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            opacity: 0.6,
                            letterSpacing: "0.5px",
                        }}
                    >
                        ← VOLVER A OPCIONES
                    </button>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.03, opacity: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (rawUrl)
                                    window.open(
                                        rawUrl,
                                        "_blank",
                                        "noopener,noreferrer"
                                    )
                            }}
                            style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.14)",
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

                        <CloseButton
                            onClick={onClose}
                            style={{ width: 32, height: 32 }}
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        background: "#080C14",
                        marginTop: `${calendarCropTop}px`,
                    }}
                >
                    <CalendlyEmbed
                        url={activeEmbed}
                        accent={accent}
                        maskBottomPx={calendarMaskBottomPx}
                    />
                </motion.div>
            </div>
        )
    }

    return (
        <div style={modalStyle}>
            <CloseButton
                onClick={onClose}
                style={{ position: "absolute", top: 24, right: 24 }}
            />
            <div style={{ textAlign: "center", marginBottom: 50 }}>
                <h3
                    style={{
                        fontSize: 26,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        margin: "0 0 10px 0",
                        color: "#E6F7EF",
                        textShadow: `0 0 20px ${accent}66`,
                    }}
                >
                    {formatText(texts.modalGroupTitle)}
                </h3>
                <p style={{ color: "#aaa", fontSize: 15, fontWeight: 300 }}>
                    {formatText(texts.modalGroupDesc)}
                </p>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 30,
                }}
            >
                {/* Pase */}
                <div
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20,
                        padding: 30,
                        display: "flex",
                        flexDirection: "column",
                        background: "rgba(255,255,255,0.02)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            color: accent,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: 12,
                        }}
                    >
                        Opción Flexible
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 500,
                            color: "#E6F7EF",
                            marginBottom: 4,
                        }}
                    >
                        {formatText(texts.passTitle)}
                    </div>
                    <div
                        style={{
                            fontSize: 28,
                            color: "#fff",
                            marginBottom: 16,
                        }}
                    >
                        {formatText(texts.passPrice)}
                    </div>
                    <p
                        style={{
                            fontSize: 15,
                            color: "#ccc",
                            marginBottom: 32,
                            lineHeight: 1.6,
                            flex: 1,
                        }}
                    >
                        {formatText(texts.passBenefit)}
                    </p>
                    <motion.button
                        whileHover={{
                            scale: 1.02,
                            backgroundColor: "rgba(255,255,255,0.08)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveEmbed(calUrlGroup)}
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid rgba(255,255,255,0.2)`,
                            color: "#E6F7EF",
                            padding: "16px",
                            borderRadius: 12,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "1px",
                            width: "100%",
                        }}
                    >
                        {formatText(texts.passBtn)}
                    </motion.button>
                </div>
                {/* Membresía */}
                <div
                    style={{
                        border: `1px solid ${accent}66`,
                        borderRadius: 20,
                        padding: 30,
                        background: `linear-gradient(180deg, rgba(0,194,255,0.08) 0%, rgba(0,0,0,0) 100%)`,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            background: accent,
                            color: "#000",
                            fontSize: 10,
                            padding: "6px 10px",
                            borderRadius: 4,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}
                    >
                        Recomendado
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 500,
                            color: "#E6F7EF",
                            marginBottom: 4,
                        }}
                    >
                        {formatText(texts.membTitle)}
                    </div>
                    <div
                        style={{
                            fontSize: 28,
                            color: "#FFD700",
                            marginBottom: 16,
                        }}
                    >
                        {formatText(texts.membPrice)}
                    </div>
                    <p
                        style={{
                            fontSize: 15,
                            color: "#ccc",
                            marginBottom: 24,
                        }}
                    >
                        {formatText(texts.membBenefit)}
                    </p>
                    <ul
                        style={{
                            paddingLeft: 0,
                            listStyle: "none",
                            margin: "0 0 32px 0",
                        }}
                    >
                        {(texts.membFeatures || "")
                            .split("\n")
                            .map((f: string, i: number) => (
                                <li
                                    key={i}
                                    style={{
                                        marginBottom: 12,
                                        fontSize: 14,
                                        color: "#ddd",
                                        display: "flex",
                                        gap: 10,
                                    }}
                                >
                                    <span style={{ color: accent }}>•</span> {f}
                                </li>
                            ))}
                    </ul>
                    <motion.a
                        href={linkStripeMembresia}
                        target="_blank"
                        whileHover={{
                            scale: 1.02,
                            boxShadow: `0 0 25px ${accent}66`,
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            background: accent,
                            border: "none",
                            color: "#000",
                            padding: "16px",
                            borderRadius: 12,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            fontSize: 13,
                            letterSpacing: "1px",
                            fontWeight: 700,
                            textDecoration: "none",
                            textAlign: "center",
                            width: "100%",
                            boxShadow: `0 0 15px ${accent}33`,
                        }}
                    >
                        {formatText(texts.membBtn)}
                    </motion.a>
                </div>
            </div>
        </div>
    )
}

const IndividualContent = ({
    onClose,
    accent,
    texts,
    calUrls,
    calendarCropTop,
    calendarModalWidth,
    calendarHeight,
    calendarMaskBottomPx,
}: any) => {
    const [activeEmbed, setActiveEmbed] = useState<string | null>(null)

    const plans = [
        {
            time: "30 min",
            name: "Afinación Rápida",
            price: "$66 USD",
            url: calUrls.calUrl30,
        },
        {
            time: "45 min",
            name: "Recalibración",
            price: "$88 USD",
            url: calUrls.calUrl45,
        },
        {
            time: "60 min",
            name: "Reconfiguración",
            price: "$111 USD",
            url: calUrls.calUrl60,
        },
    ]

    const modalStyle = {
        background: "#080C14",
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 0 60px rgba(0,0,0,0.9)`,
        borderRadius: 24,
        padding: activeEmbed ? "0" : "50px 40px",
        position: "relative" as const,
        minHeight: 700,
        height: activeEmbed ? calendarHeight : "auto",
        overflow: activeEmbed ? "hidden" : "visible",
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        maxWidth: activeEmbed ? calendarModalWidth : 960,
        transition: "max-width 0.4s ease-in-out",
        margin: "0 auto",
    }

    if (activeEmbed) {
        const rawUrl = String(activeEmbed || "").trim()

        return (
            <div style={modalStyle}>
                <div
                    style={{
                        height: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 25px",
                        background: "#080C14",
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 20,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <button
                        onClick={() => setActiveEmbed(null)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#E6F7EF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            opacity: 0.6,
                            letterSpacing: "0.5px",
                        }}
                    >
                        ← VOLVER A OPCIONES
                    </button>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.03, opacity: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (rawUrl)
                                    window.open(
                                        rawUrl,
                                        "_blank",
                                        "noopener,noreferrer"
                                    )
                            }}
                            style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.14)",
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

                        <CloseButton
                            onClick={onClose}
                            style={{ width: 32, height: 32 }}
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        background: "#080C14",
                        marginTop: `${calendarCropTop}px`,
                    }}
                >
                    <CalendlyEmbed
                        url={activeEmbed}
                        accent={accent}
                        maskBottomPx={calendarMaskBottomPx}
                    />
                </motion.div>
            </div>
        )
    }

    return (
        <div style={modalStyle}>
            <CloseButton
                onClick={onClose}
                style={{ position: "absolute", top: 24, right: 24 }}
            />
            <div style={{ textAlign: "center", marginBottom: 50 }}>
                <h3
                    style={{
                        fontSize: 26,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        margin: "0 0 10px 0",
                        color: "#E6F7EF",
                        textShadow: `0 0 20px ${accent}66`,
                    }}
                >
                    {formatText(texts.modalIndivTitle)}
                </h3>
                <p style={{ color: "#aaa", fontSize: 15, fontWeight: 300 }}>
                    {formatText(texts.modalIndivDesc)}
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 20,
                }}
            >
                {plans.map((p, i) => (
                    <motion.div
                        key={i}
                        onClick={() => setActiveEmbed(p.url)}
                        whileHover={{
                            y: -4,
                            backgroundColor: "rgba(255,255,255,0.04)",
                            borderColor: accent,
                        }}
                        style={{
                            background: "rgba(255,255,255,0.015)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 20,
                            padding: 32,
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: 260,
                            cursor: "pointer",
                            transition: "border-color 0.3s",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 24,
                                    color: "#E6F7EF",
                                    fontWeight: 600,
                                    marginBottom: 8,
                                }}
                            >
                                {formatText(p.time)}
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    color: "#aaa",
                                    fontWeight: 400,
                                    marginBottom: 20,
                                }}
                            >
                                {formatText(p.name)}
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    color: accent,
                                    fontWeight: 500,
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {formatText(p.price)}
                            </div>
                        </div>
                        <div
                            style={{
                                marginTop: 24,
                                padding: "14px 0",
                                borderRadius: 12,
                                border: `1px solid rgba(255,255,255,0.2)`,
                                color: "#E6F7EF",
                                fontSize: 12,
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                                background: "transparent",
                            }}
                        >
                            Reservar
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

const CalendlyEmbed = ({
    url,
    accent,
    maskBottomPx,
}: {
    url: string
    accent: string
    maskBottomPx: number
}) => {
    useCalendlyScript()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const finalUrl = useMemo(() => buildCalendlyUrl(url, accent), [url, accent])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        el.innerHTML = ""

        let cancelled = false

        const tryInit = (attempt: number) => {
            if (cancelled) return
            const Calendly = (window as any)?.Calendly

            if (
                finalUrl &&
                Calendly &&
                typeof Calendly.initInlineWidget === "function"
            ) {
                try {
                    el.innerHTML = ""
                    Calendly.initInlineWidget({
                        url: finalUrl,
                        parentElement: el,
                    })
                    return
                } catch (e) {
                    // sigue a fallback si falla
                }
            }

            if (attempt < 24) {
                window.setTimeout(() => tryInit(attempt + 1), 150)
                return
            }

            if (!finalUrl) return
            const iframe = document.createElement("iframe")
            iframe.src = finalUrl
            iframe.width = "100%"
            iframe.height = "100%"
            iframe.style.border = "0"
            iframe.setAttribute("title", "Calendly Scheduling Page")
            iframe.setAttribute("loading", "eager")
            el.appendChild(iframe)
        }

        tryInit(0)

        return () => {
            cancelled = true
            if (el) el.innerHTML = ""
        }
    }, [finalUrl])

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 650,
                }}
            />
            {maskBottomPx > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: maskBottomPx,
                        background:
                            "linear-gradient(180deg, rgba(8,12,20,0) 0%, rgba(8,12,20,0.92) 35%, rgba(8,12,20,1) 100%)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

/* --- FAQ SECTION --- */
const FAQSection = ({ title, items, accent }: any) => {
    return (
        <div
            style={{
                marginTop: 60,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 60,
            }}
        >
            <h4
                style={{
                    fontSize: 16,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: accent,
                    marginBottom: 40,
                    textAlign: "center",
                }}
            >
                {formatText(title)}
            </h4>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    maxWidth: 800,
                    margin: "0 auto",
                }}
            >
                {items.map((item: any, i: number) => (
                    <FAQItem key={i} q={item.q} a={item.a} accent={accent} />
                ))}
            </div>
        </div>
    )
}

const FAQItem = ({ q, a, accent }: any) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: "24px 0",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#E6F7EF",
                }}
            >
                <span style={{ fontSize: 18, fontWeight: 300, opacity: 0.9 }}>
                    {formatText(q)}
                </span>
                <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    style={{ fontSize: 24, opacity: 0.5, fontWeight: 200 }}
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
                                paddingBottom: 24,
                                margin: 0,
                                color: "#aaa",
                                lineHeight: 1.6,
                                fontSize: 15,
                            }}
                        >
                            {formatText(a)}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const ProtocolModal = ({ onClose, accent, topOffset }: any) => {
    const steps = [
        "1. Elige tu tiempo de expansión.",
        "2. Haz clic en 'Reservar' (Stripe o Calendario).",
        "3. Ingresa tu correo (y WhatsApp opcional).",
        "4. Cristaliza el intercambio (Pago).",
        "5. El campo se abre (Recibes confirmación).",
    ]
    const modalStyle = {
        background: "#080C14",
        border: `1px solid ${accent}33`,
        boxShadow: `0 0 50px rgba(0,0,0,0.9)`,
        borderRadius: 24,
        padding: "50px 40px",
        maxWidth: 550,
        margin: "0 auto",
        position: "relative" as const,
    }
    return (
        <ModalOverlay onClose={onClose} topOffset={topOffset}>
            <div style={modalStyle}>
                <CloseButton
                    onClick={onClose}
                    style={{ position: "absolute", top: 24, right: 24 }}
                />
                <h4
                    style={{
                        color: accent,
                        marginTop: 0,
                        marginBottom: 30,
                        fontSize: 20,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        textAlign: "center",
                    }}
                >
                    Protocolo de Conexión
                </h4>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                padding: "16px 20px",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.05)",
                                color: "#ddd",
                                fontSize: 15,
                                lineHeight: 1.4,
                            }}
                        >
                            {s}
                        </motion.div>
                    ))}
                </div>
            </div>
        </ModalOverlay>
    )
}

/* -------------------------------------------------------------------------- */
/*                                  CONTROLS                                  */
/* -------------------------------------------------------------------------- */

addPropertyControls(ServiciosBifurcacion, {
    /* ✦ NUEVO: Toggle Coming Soon — PRIMER CONTROL para fácil acceso */
    comingSoon: {
        type: ControlType.Boolean,
        title: "🚧 Coming Soon",
        defaultValue: true,
        enabledTitle: "ON",
        disabledTitle: "OFF",
    },

    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento",
        defaultValue: "#00C2FF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#E6F7EF",
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 90,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        step: 0.1,
    },
    topMarginPx: {
        type: ControlType.Number,
        title: "Margen Top",
        defaultValue: 96,
    },
    contentMaxWidthPx: {
        type: ControlType.Number,
        title: "Ancho Max",
        defaultValue: 1120,
    },
    /* CONTROLES DE POSICIONAMIENTO Y TAMAÑO */
    verticalGroupOffset: {
        type: ControlType.Number,
        title: "↕ Offset Grupo",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 10,
    },
    cardsGap: {
        type: ControlType.Number,
        title: "↔ Gap Tarjetas",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 5,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
        min: 32,
        max: 120,
        step: 2,
    },
    /* FIN CONTROLES */
    modalTopOffset: {
        type: ControlType.Number,
        title: "Bajada Modal (px)",
        defaultValue: 120,
        min: 0,
        max: 400,
    },
    calendarCropTop: {
        type: ControlType.Number,
        title: "Corte Superior Calendario (px)",
        defaultValue: -50,
        min: -200,
        max: 0,
    },
    calendarModalWidth: {
        type: ControlType.Number,
        title: "Ancho Modal (Calendario)",
        defaultValue: 650,
        min: 400,
        max: 1000,
    },
    calendarHeight: {
        type: ControlType.Number,
        title: "Altura Calendario (px)",
        defaultValue: 750,
        min: 500,
        max: 1200,
    },
    calendarMaskBottomPx: {
        type: ControlType.Number,
        title: "Mask Inferior (px)",
        defaultValue: 56,
        min: 0,
        max: 140,
        step: 1,
    },

    // Left Card — ✦ Hidden when comingSoon is ON
    cardLeftTitle: {
        type: ControlType.String,
        title: "Izquierda / Título",
        defaultValue: "CÁMARA SOLAR",
        hidden: (props: any) => props.comingSoon,
    },
    cardLeftSub: {
        type: ControlType.String,
        title: "Izquierda / Subtítulo",
        defaultValue: "Sintonización Grupal de los Martes.",
        hidden: (props: any) => props.comingSoon,
    },
    cardLeftPrice: {
        type: ControlType.String,
        title: "Izquierda / Precio",
        defaultValue: "$555 MXN",
        hidden: (props: any) => props.comingSoon,
    },
    cardLeftBtn: {
        type: ControlType.String,
        title: "Izquierda / Botón",
        defaultValue: "RESERVAR LUGAR",
        hidden: (props: any) => props.comingSoon,
    },

    // Right Card — ✦ Hidden when comingSoon is ON
    cardRightTitle: {
        type: ControlType.String,
        title: "Derecha / Título",
        defaultValue: "1:1 ESPEJOS",
        hidden: (props: any) => props.comingSoon,
    },
    cardRightSub: {
        type: ControlType.String,
        title: "Derecha / Subtítulo",
        defaultValue: "Navegación Personalizada.",
        hidden: (props: any) => props.comingSoon,
    },
    cardRightPrice: {
        type: ControlType.String,
        title: "Derecha / Precio",
        defaultValue: "Desde $1,111 MXN",
        hidden: (props: any) => props.comingSoon,
    },
    cardRightBtn: {
        type: ControlType.String,
        title: "Derecha / Botón",
        defaultValue: "SOLICITAR ESPACIO",
        hidden: (props: any) => props.comingSoon,
    },

    // Modal Group — ✦ Hidden when comingSoon is ON
    modalGroupTitle: {
        type: ControlType.String,
        title: "Modal G / Título",
        defaultValue: "CÁMARA SOLAR (GRUPAL)",
        hidden: (props: any) => props.comingSoon,
    },
    modalGroupDesc: {
        type: ControlType.String,
        title: "Modal G / Desc",
        defaultValue:
            "Todos los Martes, 7:00 PM (Hora Centro). Duración: 90 min.",
        hidden: (props: any) => props.comingSoon,
    },
    passTitle: {
        type: ControlType.String,
        title: "Pase / Título",
        defaultValue: "PASE DE ACCESO",
        hidden: (props: any) => props.comingSoon,
    },
    passPrice: {
        type: ControlType.String,
        title: "Pase / Precio",
        defaultValue: "$555 MXN / sesión",
        hidden: (props: any) => props.comingSoon,
    },
    passBenefit: {
        type: ControlType.String,
        title: "Pase / Texto",
        defaultValue: "Flexibilidad total. Reserva solo cuando lo sientas.",
        hidden: (props: any) => props.comingSoon,
    },
    passBtn: {
        type: ControlType.String,
        title: "Pase / Botón",
        defaultValue: "RESERVAR ESTE MARTES",
        hidden: (props: any) => props.comingSoon,
    },
    membTitle: {
        type: ControlType.String,
        title: "Membresía / Título",
        defaultValue: "MEMBRESÍA SOLAR",
        hidden: (props: any) => props.comingSoon,
    },
    membPrice: {
        type: ControlType.String,
        title: "Membresía / Precio",
        defaultValue: "$1,999 MXN / mes",
        hidden: (props: any) => props.comingSoon,
    },
    membBenefit: {
        type: ControlType.String,
        title: "Membresía / Texto",
        defaultValue: "Tu lugar asegurado siempre.",
        hidden: (props: any) => props.comingSoon,
    },
    membFeatures: {
        type: ControlType.String,
        title: "Membresía / Lista",
        displayTextArea: true,
        defaultValue:
            "Acceso a todos los Martes.\nMeses con 5 sesiones incluidos.\nAcceso a grabaciones.",
        hidden: (props: any) => props.comingSoon,
    },
    membBtn: {
        type: ControlType.String,
        title: "Membresía / Botón",
        defaultValue: "ACTIVAR SUSCRIPCIÓN",
        hidden: (props: any) => props.comingSoon,
    },

    // Modal Indiv — ✦ Hidden when comingSoon is ON
    modalIndivTitle: {
        type: ControlType.String,
        title: "Modal 1:1 / Título",
        defaultValue: "1:1 ESPEJOS",
        hidden: (props: any) => props.comingSoon,
    },
    modalIndivDesc: {
        type: ControlType.String,
        title: "Modal 1:1 / Desc",
        defaultValue: "Elige la profundidad de tu navegación.",
        hidden: (props: any) => props.comingSoon,
    },

    // Links & URLs — ✦ Hidden when comingSoon is ON
    linkStripeMembresia: {
        type: ControlType.String,
        title: "Links / Membresía",
        defaultValue: "#",
        hidden: (props: any) => props.comingSoon,
    },
    calUrlGroup: {
        type: ControlType.String,
        title: "Embeds / Pase Grupal (URL)",
        defaultValue: "https://calendly.com/zakhaar/camara-solar-60-minutos",
        hidden: (props: any) => props.comingSoon,
    },
    calUrl30: {
        type: ControlType.String,
        title: "Embeds / 30 min (URL)",
        defaultValue: "https://calendly.com/zakhaar/15min",
        hidden: (props: any) => props.comingSoon,
    },
    calUrl45: {
        type: ControlType.String,
        title: "Embeds / 45 min (URL)",
        defaultValue: "https://calendly.com/zakhaar/30min",
        hidden: (props: any) => props.comingSoon,
    },
    calUrl60: {
        type: ControlType.String,
        title: "Embeds / 60 min (URL)",
        defaultValue: "https://calendly.com/zakhaar/60min",
        hidden: (props: any) => props.comingSoon,
    },

    // FAQs — ✦ Hidden when comingSoon is ON
    faqTitle: {
        type: ControlType.String,
        title: "FAQs / Título Sección",
        defaultValue: "CLARIDAD OPERATIVA",
        hidden: (props: any) => props.comingSoon,
    },
    faqs: {
        type: ControlType.Array,
        title: "FAQs / Preguntas",
        hidden: (props: any) => props.comingSoon,
        control: {
            type: ControlType.Object,
            controls: {
                q: { type: ControlType.String, title: "Pregunta" },
                a: {
                    type: ControlType.String,
                    title: "Respuesta",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                q: "¿Cómo aprovecho al máximo mi sesión / Qué necesito tener listo?",
                a: "No requieres preparación mental previa. Solo asegura un espacio silencioso, buena conexión a internet y audífonos para captar la frecuencia binaural. Ten agua cerca para la hidratación post-recalibración.",
            },
            {
                q: "¿Quedan grabadas las sesiones?",
                a: "Las Cámaras Solares (Grupales) sí se graban y se envían a los miembros activos. Los Encuentros de Espejos (1:1) NO se graban por defecto para proteger la intimidad del proceso, pero puedes solicitar grabarla tú mismo si lo deseas.",
            },
            {
                q: "¿Cuál es la diferencia entre Cámara Solar y Encuentro de Espejos?",
                a: "La Cámara Solar es una afinación colectiva, ideal para mantenimiento y comunidad. El Encuentro de Espejos es una cirugía energética personalizada para temas específicos y profundidad individual.",
            },
            {
                q: "¿Qué pasa si no puedo asistir?",
                a: "Puedes reagendar tu sesión 1:1 hasta 24 horas antes desde tu correo de confirmación. Las sesiones grupales no son reembolsables, pero si eres miembro, recibirás la grabación.",
            },
        ],
    },
})
