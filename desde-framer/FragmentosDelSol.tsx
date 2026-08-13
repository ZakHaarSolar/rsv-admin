// FragmentosDelSol.tsx v2.0
// v2.0 — Título "FRAGMENTOS DEL SOL" en desktop ahora usa el mismo
// degradado que MI NÚCLEO: cada palabra envuelta en su propio span
// con linear-gradient(180deg, accent, #fff) + WebkitBackgroundClip
// text. h1 wrapper trae color transparent + drop-shadow accent +
// animation nuc-breath 7s. Reemplaza el color-mix() (banned en
// Framer) y el textShadow por el patrón canónico del Lente.
import * as React from "react"
import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    useLayoutEffect,
} from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    animate,
} from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ─────────────────────────────────────────────────────────────────────────────
   1. CSS WARP EFFECT & GLOBAL STYLES
   ───────────────────────────────────────────────────────────────────────────── */
const WARP_CSS = String.raw`
.stars-warp-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    perspective: 400px; 
    background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%);
}

.star-warp {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
    animation: space-flight var(--dur) linear infinite;
    animation-delay: var(--delay);
    opacity: 0;
    will-change: transform, opacity;
}

@keyframes space-flight {
    0% { transform: translate3d(var(--x), var(--y), -1000px); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translate3d(var(--x), var(--y), 200px); opacity: 0; }
}

/* FIX: Ocultar scrollbar globalmente */

@keyframes nuc-breath {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.15); }
}
`

function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "holo-warp-effect-css-v50"
        const prev = document.getElementById(id) as HTMLStyleElement | null
        if (prev) {
            prev.textContent = WARP_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = WARP_CSS
        document.head.appendChild(s)
    }, [])
}

/* ───────── Utilidades ───────── */

const normalizeMultiline = (str?: string) => (str || "").replace(/\\n/g, "\n")

const makeFallbackDataUrl = (
    title: string,
    color = "#00C2FF",
    w = 150,
    h = 210
) => {
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
<stop offset='0%' stop-color='${color}' stop-opacity='0.35'/>
<stop offset='100%' stop-color='${color}' stop-opacity='0.1'/>
</linearGradient>
</defs>
<rect width='100%' height='100%' rx='12' fill='url(#g)'/>
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
font-family='Inter, system-ui' font-size='14' fill='${color}' opacity='0.85'>
${title}
</text>
</svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const hexToRgba = (color: string, a = 1) => {
    if (!color || typeof color !== "string") return `rgba(0,0,0,${a})`
    const trimmed = color.trim()
    if (!trimmed.startsWith("#")) return trimmed
    const clean = trimmed.slice(1)
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

/* ───────── Datos ───────── */

interface FragmentData {
    id: string
    fragmentLabel: string
    episodeTitle: string
    shortTitle: string
    synopsis: string
    youtubeLink: string
    coverUrl: string
    embedCode: string
    isActive: boolean
    ring: number
    angle: number
}

const mapFragmentsToRings = (items: any[]): FragmentData[] => {
    const perRing = [6, 10, 9]
    const fragments: FragmentData[] = []

    let currentGlobalIndex = 0

    for (let ringIndex = 0; ringIndex < perRing.length; ringIndex++) {
        const countInThisRing = perRing[ringIndex]
        let currentAngle = ringIndex === 1 ? Math.PI / countInThisRing : 0
        const angleStep = (2 * Math.PI) / Math.max(1, countInThisRing)

        for (let i = 0; i < countInThisRing; i++) {
            const item = items[currentGlobalIndex]
            const isActive = !!item

            const simpleNum = currentGlobalIndex + 1
            const id = `F${String(simpleNum).padStart(2, "0")}`

            fragments.push({
                id: id,
                fragmentLabel: `FRAGMENTO ${simpleNum}`,
                episodeTitle: isActive
                    ? item.title || "Sin Título"
                    : "Inactivo",
                shortTitle: `F${simpleNum}`,
                synopsis: isActive ? item.synopsis || "" : "",
                youtubeLink: isActive ? item.youtubeLink || "#" : "",
                coverUrl: isActive ? item.cover || "" : "",
                embedCode: isActive ? item.embedCode || "" : "",
                isActive: isActive,
                ring: ringIndex,
                angle: currentAngle,
            })

            currentAngle += angleStep
            currentGlobalIndex++
        }
    }

    return fragments
}

/* ───────── Componente de Video Embed ───────── */
const EmbedPlayer = ({ code }: { code: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current || !code) return

        let finalCode = code
        // Auto-fix autoplay para Wistia
        if (
            finalCode.includes("wistia-player") &&
            !finalCode.includes("autoplay")
        ) {
            finalCode = finalCode.replace(
                "<wistia-player",
                "<wistia-player autoplay"
            )
        }

        try {
            const range = document.createRange()
            range.selectNode(containerRef.current)
            const documentFragment = range.createContextualFragment(finalCode)
            containerRef.current.innerHTML = ""
            containerRef.current.appendChild(documentFragment)
        } catch (e) {
            console.error("Error injectando embed:", e)
            containerRef.current.innerHTML = finalCode
        }
    }, [code])

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", border: "none" }}
        />
    )
}

/* ───────── HOLO-COMPONENTS ───────── */

const HoloBackground = () => (
    <div
        style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.4,
            pointerEvents: "none",
        }}
    >
        <div
            style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(rgba(0, 194, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 194, 255, 0.15) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
                maskImage:
                    "radial-gradient(circle, black 40%, transparent 90%)",
                opacity: 0.5,
            }}
        />
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                background:
                    "linear-gradient(to bottom, transparent 0%, rgba(0, 194, 255, 0.1) 50%, transparent 100%)",
                backgroundSize: "100% 200%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "0% 200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
    </div>
)

const TechFrameSVG = ({ color }: { color: string }) => (
    <svg
        style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
        }}
    >
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            filter="url(#glow)"
            opacity="0.8"
        >
            <path d="M 40 20 L 20 20 L 20 40" />
            <path d="M calc(100% - 40px) 20 L calc(100% - 20px) 20 L calc(100% - 20px) 40" />
            <path d="M 40 calc(100% - 20px) L 20 calc(100% - 20px) L 20 calc(100% - 40px)" />
            <path d="M calc(100% - 40px) calc(100% - 20px) L calc(100% - 20px) calc(100% - 20px) L calc(100% - 20px) calc(100% - 40px)" />
        </g>
    </svg>
)

const WireframePrism = ({
    style,
    delay,
}: {
    style: React.CSSProperties
    delay: number
}) => (
    <motion.div
        style={{
            ...style,
            position: "absolute",
            width: 60,
            height: 60,
            pointerEvents: "none",
            zIndex: 5,
        }}
        animate={{ rotateY: [0, 360], rotateX: [10, -10, 10], y: [0, -10, 0] }}
        transition={{
            rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
            },
        }}
    >
        <svg
            viewBox="0 0 100 100"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
            <g
                stroke="#00C2FF"
                strokeWidth="1"
                fill="rgba(0, 194, 255, 0.1)"
                strokeLinejoin="round"
            >
                <path d="M50 10 L90 40 L50 90 L10 40 Z" />
                <path d="M50 10 L50 90" opacity="0.6" />
                <path d="M10 40 L90 40" opacity="0.6" />
            </g>
        </svg>
    </motion.div>
)

/* ───────── Estilos Generales ───────── */
const styles = {
    container: (bgColor: string) => ({
        position: "relative" as const,
        width: "100%",
        minHeight: "100svh",
        background: "transparent",
        color: "#F0F0F0",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden" as const,
        margin: 0,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
    }),

    titleImage: {
        width: "auto",
        height: "150px",
        margin: "0",
        objectFit: "contain" as const,
        zIndex: 2,
        position: "relative" as const,
    },

    pageTitleFallback: (
        accent: string,
        heightPx: number,
        xOffsetPx: number
    ) => ({
        fontFamily: "'Inter', sans-serif",
        fontSize: `${heightPx}px`,
        fontWeight: 100,
        textTransform: "uppercase" as const,
        letterSpacing: "0.4em",
        paddingLeft: "0.4em",
        transform: `translateX(${xOffsetPx}px)`,
        display: "block",
        width: "100%",
        textAlign: "center" as const,
        /* v2.0 — color transparent + drop-shadow + animación
           nuc-breath para replicar el patrón de MI NÚCLEO. Las
           palabras se envuelven en spans con su propio gradient
           (ver render del h1 abajo). */
        color: "transparent",
        lineHeight: 1,
        filter: `drop-shadow(0 0 ${heightPx * 0.18}px ${hexToRgba(accent, 0.25)})`,
        WebkitFontSmoothing: "antialiased" as const,
        animation: "nuc-breath 7s ease-in-out infinite",
        margin: "0",
        maxWidth: "95vw",
        position: "relative" as const,
        zIndex: 2,
        pointerEvents: "none" as const,
        userSelect: "none" as const,
    }),

    constellationWrapper: {
        position: "relative" as const,
        flexGrow: 1,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        overflow: "visible" as const,
    },

    centralSun: (sunColor: string) => {
        const strong = hexToRgba(sunColor, 1)
        const mid = hexToRgba(sunColor, 0.8)
        const soft = hexToRgba(sunColor, 0.67)
        return {
            position: "relative" as const,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: sunColor,
            boxShadow: `0 0 20px ${strong}, 0 0 40px ${mid}, 0 0 60px ${soft}`,
            zIndex: 10,
            cursor: "pointer",
        }
    },

    starNode: (size: number, isActive: boolean, activeColor: string) => ({
        position: "relative" as const,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: isActive ? activeColor : "rgba(255, 255, 255, 0.25)",
        boxShadow: isActive
            ? `0 0 10px ${hexToRgba(activeColor, 0.4)}`
            : "none",
        zIndex: isActive ? 15 : 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.6}px`,
        color: "transparent",
        opacity: isActive ? 1 : 0.6,
        pointerEvents: isActive ? "auto" : "none",
    }),

    connectionRingStyle: (activeColor: string) => ({
        stroke: activeColor,
        strokeWidth: 1,
        fill: "none",
        opacity: 0.25,
        pointerEvents: "none" as const,
    }),

    /* ───────── CONSOLA ───────── */
    consoleOverlay: {
        position: "fixed" as const,
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
    },

    consolePanel: (
        accentColor: string,
        width: string,
        height: string,
        isExpanded: boolean,
        cineOffsetY: number
    ) => ({
        position: "relative" as const,
        width: width,
        height: height,

        transform: isExpanded ? `translateY(${cineOffsetY}px)` : "none",
        marginTop: isExpanded ? "var(--navbar-offset)" : "0",
        marginBottom: isExpanded ? "30px" : "0",

        background: `
            linear-gradient(180deg, rgba(0, 194, 255, 0.08) 0%, rgba(0, 20, 40, 0.85) 60%, rgba(0, 5, 10, 0.95) 100%)
        `,
        border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
        borderRadius: "20px",
        boxShadow: `
            0 0 30px ${hexToRgba(accentColor, 0.15)},
            inset 0 0 40px ${hexToRgba(accentColor, 0.1)},
            0 20px 60px rgba(0,0,0,0.9)
        `,
        backdropFilter: "blur(30px)",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        padding: isExpanded ? "0" : "15px 40px 0px 40px",
        color: "#EAF7FF",
        overflow: "visible" as const,
    }),

    scrollableContent: {
        flex: 1,
        width: "100%",
        overflowY: "auto" as const,
        scrollbarWidth: "none" as const,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        padding: "10px 20px 20px 20px",
        zIndex: 10,
    },

    footerContent: {
        flex: "0 0 auto",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "16px",
        paddingBottom: "30px",
        zIndex: 10,
    },

    consoleTitle: (textColor: string) => ({
        fontSize: "2rem",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 800,
        color: "transparent",
        textAlign: "center" as const,
        margin: "0 0 16px 0",
        letterSpacing: "0.02em",
        WebkitTextStroke: "1px rgba(0, 194, 255, 0.8)",
        textShadow: "0 0 20px rgba(0, 194, 255, 0.4)",
        backgroundImage: "linear-gradient(180deg, #E0F7FF 0%, #00C2FF 100%)",
        WebkitBackgroundClip: "text",
    }),

    consoleImage: {
        width: "auto",
        maxWidth: "100%",
        height: "215px",
        borderRadius: "8px",
        objectFit: "cover" as const,
        border: "2px solid rgba(0, 194, 255, 0.5)",
        boxShadow: "0 0 25px rgba(0, 194, 255, 0.2)",
    },

    textWrapper: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        gap: "10px",
        width: "90%",
    },

    consoleDescTitleGlowBase: (accentColor: string) => ({
        fontSize: "1.6rem",
        fontWeight: 700,
        color: "#FFFFFF",
        marginTop: "0px",
        marginBottom: "0px",
        textAlign: "center" as const,
        letterSpacing: "0.02em",
        textShadow: `0 0 15px ${hexToRgba(accentColor, 0.6)}`,
        textTransform: "uppercase" as const,
    }),

    consoleBody: {
        fontSize: "1.1rem",
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.6,
        textAlign: "center" as const,
        width: "100%",
        maxWidth: "100%",
        color: "rgba(200, 235, 255, 0.9)",
        whiteSpace: "pre-line" as const,
        margin: "0",
        textShadow: "0 0 5px rgba(0, 194, 255, 0.3)",
    },

    consoleButtonLayout: {
        position: "relative" as const,
        borderRadius: "6px",
        padding: "14px 40px",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#FFFFFF",
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        pointerEvents: "auto" as const,
        userSelect: "none" as const,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        border: "1px solid rgba(0, 194, 255, 0.8)",
        background: "rgba(0, 194, 255, 0.1)",
        boxShadow:
            "0 0 20px rgba(0, 194, 255, 0.2), inset 0 0 10px rgba(0, 194, 255, 0.1)",
        backdropFilter: "blur(4px)",
        outline: "none",
    },

    consoleCloseButton: (accentColor: string) => ({
        position: "absolute" as const,
        top: "20px",
        right: "20px",
        width: "32px",
        height: "32px",
        background: "rgba(0, 20, 40, 0.8)",
        borderRadius: "50%",
        border: "1px solid rgba(0, 194, 255, 0.6)",
        color: "#FFFFFF",
        fontSize: "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        boxShadow: "0 0 15px rgba(0, 194, 255, 0.4)",
        outline: "none",
        pointerEvents: "auto" as const,
    }),

    // FIX: Nav Arrow con padding configurable
    navArrowBase: (isLeft: boolean, padding: number) => ({
        position: "absolute" as const,
        top: "50%",
        width: "54px",
        height: "54px",
        borderRadius: "50%",
        fontSize: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 210,
        cursor: "pointer",
        // Usamos el padding. Al estar en la raíz del panel, 0 = borde.
        [isLeft ? "left" : "right"]: `${padding}px`,
        transform: "translateY(-50%)",
        pointerEvents: "auto" as const,
        border: "1px solid rgba(0, 194, 255, 0.3)",
        background: "rgba(0,0,0,0.6)",
        color: "#00C2FF",
        boxShadow: "0 0 15px rgba(0, 194, 255, 0.2)",
        outline: "none",
    }),
}

/* ───────── Fondo de estrellas ───────── */
const StarsBackground = React.memo(
    ({ numStars, speed }: { numStars: number; speed: number }) => {
        const [stars, setStars] = useState<any[]>([])
        useEffect(() => {
            const arr = []
            const total = Math.floor(numStars * 1.5)
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
        }, [numStars])
        return (
            <div className="stars-warp-container">
                {stars.map((s) => (
                    <div
                        key={s.id}
                        className="star-warp"
                        style={
                            {
                                ["--size" as any]: `${s.size}px`,
                                ["--x" as any]: `${s.x}vw`,
                                ["--y" as any]: `${s.y}vh`,
                                ["--dur" as any]: `${s.baseDuration / speed}s`,
                                ["--delay" as any]: `${s.delay}s`,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
        )
    }
)

/* ───────── Subcomponentes de órbita ───────── */

function OrbitNode({
    fragment,
    radius,
    rot,
    starNodeSize,
    activeStarColor,
    onSelect,
    reopenCooldownUntil,
}: any) {
    const angleDeg = (fragment.angle * 180) / Math.PI
    const labelGap = Math.max(10, Math.round(starNodeSize * 0.5))
    const gapPx = starNodeSize / 2 + labelGap
    const counter = useTransform(rot, (r: number) => -(r + angleDeg))

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 0,
                height: 0,
                transformOrigin: "0 0",
                rotate: rot,
                willChange: "transform",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    transformOrigin: "0 0",
                    transform: `rotate(${angleDeg}deg) translateX(${radius}px)`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        overflow: "visible",
                    }}
                >
                    <motion.div
                        initial="rest"
                        whileHover={fragment.isActive ? "hover" : "rest"}
                        animate={fragment.isActive ? "active" : "inactive"}
                        variants={{
                            inactive: { opacity: 1, scale: 1 },
                            active: { opacity: 1, scale: 1 },
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (Date.now() < reopenCooldownUntil.current) return
                            if (fragment.isActive) onSelect(fragment)
                        }}
                        style={{
                            position: "relative",
                            width: starNodeSize,
                            height: starNodeSize,
                            cursor: fragment.isActive ? "pointer" : "default",
                            pointerEvents: fragment.isActive ? "auto" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {fragment.isActive && (
                            <motion.div
                                variants={{
                                    rest: { opacity: 0, scale: 0.8, rotate: 0 },
                                    hover: {
                                        opacity: 1,
                                        scale: 1.8,
                                        rotate: 180,
                                        transition: {
                                            duration: 0.8,
                                            ease: "easeOut",
                                        },
                                    },
                                }}
                                style={{
                                    position: "absolute",
                                    inset: -4,
                                    borderRadius: "50%",
                                    border: `1px dashed ${hexToRgba(activeStarColor, 0.5)}`,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        <motion.div
                            style={{
                                ...styles.starNode(
                                    starNodeSize,
                                    fragment.isActive,
                                    activeStarColor
                                ),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                            }}
                            variants={{
                                rest: {
                                    scale: 1,
                                    backgroundColor: fragment.isActive
                                        ? activeStarColor
                                        : "rgba(255,255,255,0.25)",
                                    boxShadow: fragment.isActive
                                        ? `0 0 0px ${activeStarColor}`
                                        : "none",
                                },
                                hover: {
                                    scale: 1.2,
                                    backgroundColor: "#FFFFFF",
                                    boxShadow: `0 0 20px ${activeStarColor}, 0 0 40px ${activeStarColor}`,
                                    transition: { duration: 0.3 },
                                },
                            }}
                        />
                        {fragment.isActive && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    pointerEvents: "none",
                                    zIndex: 20,
                                }}
                            >
                                <motion.div
                                    style={{
                                        transformOrigin: "50% 50%",
                                        rotate: counter as any,
                                    }}
                                >
                                    <div
                                        style={{
                                            transform: `translateY(-${gapPx}px)`,
                                        }}
                                    >
                                        <motion.span
                                            variants={{
                                                rest: { y: 0, opacity: 0.8 },
                                                hover: {
                                                    y: -4,
                                                    opacity: 1,
                                                    color: "#FFFFFF",
                                                },
                                            }}
                                            style={{
                                                fontSize: "0.85rem",
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                                color: activeStarColor,
                                                textShadow: `0 0 5px rgba(0,0,0,0.8)`,
                                                display: "block",
                                            }}
                                        >
                                            {fragment.shortTitle}
                                        </motion.span>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

function OrbitRing({
    fragments,
    radius,
    duration,
    direction,
    starNodeSize,
    activeStarColor,
    onSelect,
    reopenCooldownUntil,
}: any) {
    const rot = useMotionValue(0)
    useEffect(() => {
        const dir = direction === "left" ? -1 : 1
        const controls = animate(rot, dir * 360, {
            duration: Math.max(1, Number(duration || 60)),
            repeat: Infinity,
            ease: "linear",
        })
        return () => controls.stop()
    }, [direction, duration, rot])
    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 0,
                height: 0,
                zIndex: 12,
                transformOrigin: "0 0",
            }}
        >
            {fragments.map((fragment: any) => (
                <OrbitNode
                    key={fragment.id}
                    fragment={fragment}
                    radius={radius}
                    rot={rot}
                    starNodeSize={starNodeSize}
                    activeStarColor={activeStarColor}
                    onSelect={onSelect}
                    reopenCooldownUntil={reopenCooldownUntil}
                />
            ))}
        </div>
    )
}

/* ───────── Componente principal ───────── */

export function FragmentosDelSol(props: any) {
    useInjectCss()

    const {
        flareEnabled = true,
        flareDurationSec = 1.0,
        flareColor = "#FFD700",
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",
        sunColor = "#FFD700",
        activeStarColor = "#00C2FF",
        starNodeSize = 25,
        numStars = 150,
        warpSpeed = 1.0,
        arrowPadding = 10,

        orbit1Duration = 100,
        orbit2Duration = 300,
        orbit3Duration = 180,
        orbit1Direction = "right",
        orbit2Direction = "left",
        orbit3Direction = "right",

        titleYOffset = 0,
        stellarYOffset = 0,

        cineOffsetY = 0,
        cineWidth = 1280,
        cineHeight = 800,
        idleTimeout = 3,

        pageTitleFallbackText = "FRAGMENTOS",
        pageTitleFallbackHeight = 72,
        pageTitleXOffsetPx = 0,
        consoleWidth = 800,
        consoleHeight = 600,
        contentSpacing = 24,

        fragments = [],
    } = props

    const liveActiveStarColor = activeStarColor || accentColor || "#00C2FF"
    const liveAccentForRings = liveActiveStarColor

    const [isIntroComplete, setIsIntroComplete] = useState(!flareEnabled)
    const [selectedFragment, setSelectedFragment] =
        useState<FragmentData | null>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [isClient, setIsClient] = useState(false)

    const [isExpanded, setIsExpanded] = useState(false)

    const [showControls, setShowControls] = useState(true)

    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(t)
    }, [])

    const reopenCooldownUntil = useRef(0)
    const baseRadius = 150
    const ringSpacing = 100
    const ringRadii = [0, 1, 2].map((i) => baseRadius + i * ringSpacing)

    const buttonVariants = useMemo(
        () => ({
            rest: {
                scale: 1,
                y: 0,
                background: "rgba(0, 194, 255, 0.1)",
                borderColor: "rgba(0, 194, 255, 0.8)",
                boxShadow: "0 0 15px rgba(0, 194, 255, 0.2)",
                color: "#FFFFFF",
            },
            hover: {
                scale: 1.05,
                y: -2,
                background: "rgba(0, 194, 255, 0.3)",
                borderColor: "#FFFFFF",
                boxShadow:
                    "0 0 35px rgba(0, 194, 255, 0.6), 0 0 10px rgba(0, 194, 255, 0.8)",
                color: "#FFFFFF",
            },
            tap: { scale: 0.98, background: "rgba(0, 194, 255, 0.4)" },
        }),
        []
    )

    const mappedFragments = useMemo(
        () => mapFragmentsToRings(fragments),
        [fragments]
    )
    const activeFragments = useMemo(
        () => mappedFragments.filter((f) => f.isActive),
        [mappedFragments]
    )

    /* --- DEEP LINKING: LECTURA DE URL AL CARGAR --- */
    useEffect(() => {
        if (typeof window === "undefined") return

        // Función que revisa si el hash actual (#f1) coincide con algún fragmento
        const handleDeepLink = () => {
            // Obtenemos el hash sin el '#', y en minúsculas (ej: 'f1')
            const hash = window.location.hash.replace("#", "").toLowerCase()
            if (!hash) return

            // Buscamos un fragmento donde su ShortTitle (F1) o ID (F01) coincida
            const found = activeFragments.find(
                (f) =>
                    f.shortTitle.toLowerCase() === hash ||
                    f.id.toLowerCase() === hash
            )

            if (found) {
                // Si existe, lo abrimos automáticamente
                setSelectedFragment(found)
                // Opcional: Si quisieras que empiece en modo cine directo:
                // setIsExpanded(true)
            }
        }

        // Ejecutar al montar el componente (y cuando cargan los fragmentos)
        handleDeepLink()
    }, [activeFragments])
    /* ---------------------------------------------------- */

    const handleFragmentClick = useCallback((fragment: FragmentData) => {
        setSelectedFragment(fragment)
        setIsExpanded(false)
        setShowControls(true)

        /* --- DEEP LINKING: ACTUALIZAR URL AL CLICAR --- */
        if (typeof window !== "undefined") {
            window.location.hash = fragment.shortTitle.toLowerCase()
        }
    }, [])

    const closeConsole = useCallback(() => {
        setSelectedFragment(null)
        setIsExpanded(false)
        reopenCooldownUntil.current = Date.now() + 400

        /* --- DEEP LINKING: LIMPIAR URL AL CERRAR --- */
        if (typeof window !== "undefined") {
            // Usamos replaceState para limpiar el hash sin recargar ni dejar rastro feo
            window.history.replaceState(null, "", " ")
        }
    }, [])

    const navigateFragments = useCallback(
        (direction: "prev" | "next", keepExpanded = false) => {
            if (!selectedFragment) return
            const currentIndex = activeFragments.findIndex(
                (f) => f.id === selectedFragment.id
            )

            let nextFrag = null

            // FIX: NO LOOPING
            if (direction === "next") {
                if (currentIndex < activeFragments.length - 1) {
                    nextFrag = activeFragments[currentIndex + 1]
                }
            } else {
                if (currentIndex > 0) {
                    nextFrag = activeFragments[currentIndex - 1]
                }
            }

            if (nextFrag) {
                setSelectedFragment(nextFrag)

                /* --- DEEP LINKING: ACTUALIZAR URL AL NAVEGAR --- */
                if (typeof window !== "undefined") {
                    window.location.hash = nextFrag.shortTitle.toLowerCase()
                }
            }

            // Si se pide mantener expandido (ej: botones dentro del video), no cerramos
            if (!keepExpanded) {
                setIsExpanded(false)
            }
            setShowControls(true)
        },
        [selectedFragment, activeFragments]
    )

    useEffect(() => {
        const handleResize = () =>
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        handleResize()
        setIsClient(true)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // TIMER INACTIVIDAD MOUSE
    useEffect(() => {
        if (!isExpanded) return
        let timeout: any

        const resetTimer = () => {
            setShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(
                () => setShowControls(false),
                idleTimeout * 1000
            )
        }

        window.addEventListener("mousemove", resetTimer)
        resetTimer()

        return () => {
            window.removeEventListener("mousemove", resetTimer)
            clearTimeout(timeout)
        }
    }, [isExpanded, idleTimeout])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedFragment) return

            // FIX: Prevent space scroll
            if (event.key === " ") {
                event.preventDefault()
            }

            // FIX: Disable arrows in Expanded/Video Mode
            if (isExpanded) {
                if (event.key === "Escape") {
                    setIsExpanded(false)
                }
                return
            }

            if (event.key === "ArrowRight") navigateFragments("next")
            else if (event.key === "ArrowLeft") navigateFragments("prev")
            else if (event.key === "Escape") closeConsole()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedFragment, navigateFragments, closeConsole, isExpanded])

    // --- Variables auxiliares para renderizar botones de video ---
    const currentIndex = selectedFragment
        ? activeFragments.findIndex((f) => f.id === selectedFragment.id)
        : -1
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < activeFragments.length - 1

    return (
        <motion.div style={styles.container(bgColor)}>
            {!isIntroComplete && setIsIntroComplete(true)}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isReady ? 1 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{
                    width: "100%",
                    minHeight: "100svh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: isReady ? 1 : 0, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                >
                    {props.titleImage ? (
                        <img
                            src={props.titleImage}
                            alt="Title"
                            style={{
                                ...styles.titleImage,
                                top: `${props.titleYOffset}px`,
                            }}
                        />
                    ) : (
                        <h1
                            style={{
                                ...styles.pageTitleFallback(
                                    liveActiveStarColor,
                                    props.pageTitleFallbackHeight,
                                    props.pageTitleXOffsetPx
                                ),
                                marginTop: `calc(${props.navbarOffset}px + ${props.titleYOffset}px)`,
                            }}
                        >
                            {normalizeMultiline(props.pageTitleFallbackText)
                                .split(/\s+/)
                                .filter(Boolean)
                                .map((word, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span
                                            style={{
                                                background: `linear-gradient(180deg, ${liveActiveStarColor}, #fff)`,
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor:
                                                    "transparent",
                                                backgroundClip: "text",
                                            }}
                                        >
                                            {word}
                                        </span>
                                        {i < arr.length - 1 && " "}
                                    </React.Fragment>
                                ))}
                        </h1>
                    )}
                </motion.div>

                {isClient && dimensions.width > 0 && (
                    <motion.div
                        style={{
                            ...styles.constellationWrapper,
                            top: `${props.stellarYOffset}px`,
                        }}
                        initial={{
                            opacity: 0,
                            scale: 0.9,
                            filter: "blur(4px)",
                        }}
                        animate={{
                            opacity: isReady ? 1 : 0,
                            scale: 1,
                            filter: "blur(0px)",
                        }}
                        transition={{
                            duration: 1.5,
                            delay: 0.4,
                            ease: "easeOut",
                        }}
                    >
                        <motion.div
                            style={styles.centralSun(sunColor)}
                            animate={{
                                scale: [1, 1.06, 1],
                                boxShadow: [
                                    `0 0 20px ${sunColor}FF`,
                                    `0 0 40px ${sunColor}AA`,
                                    `0 0 20px ${sunColor}FF`,
                                ],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (activeFragments.length > 0)
                                    handleFragmentClick(activeFragments[0])
                            }}
                        />
                        <svg
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                overflow: "visible",
                                pointerEvents: "none",
                                zIndex: 8,
                            }}
                        >
                            {ringRadii.map((r, i) => (
                                <motion.circle
                                    key={`ring-${i}`}
                                    cx="50%"
                                    cy="50%"
                                    r={r}
                                    style={styles.connectionRingStyle(
                                        liveAccentForRings
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.25 }}
                                    transition={{
                                        duration: 1.2,
                                        delay: i * 0.15 + 0.8,
                                    }}
                                />
                            ))}
                        </svg>
                        <OrbitRing
                            fragments={mappedFragments.filter(
                                (f) => f.ring === 0
                            )}
                            radius={ringRadii[0]}
                            duration={orbit1Duration}
                            direction={orbit1Direction}
                            starNodeSize={starNodeSize}
                            activeStarColor={liveActiveStarColor}
                            onSelect={handleFragmentClick}
                            reopenCooldownUntil={reopenCooldownUntil}
                        />
                        <OrbitRing
                            fragments={mappedFragments.filter(
                                (f) => f.ring === 1
                            )}
                            radius={ringRadii[1]}
                            duration={orbit2Duration}
                            direction={orbit2Direction}
                            starNodeSize={starNodeSize}
                            activeStarColor={liveActiveStarColor}
                            onSelect={handleFragmentClick}
                            reopenCooldownUntil={reopenCooldownUntil}
                        />
                        <OrbitRing
                            fragments={mappedFragments.filter(
                                (f) => f.ring === 2
                            )}
                            radius={ringRadii[2]}
                            duration={orbit3Duration}
                            direction={orbit3Direction}
                            starNodeSize={starNodeSize}
                            activeStarColor={liveActiveStarColor}
                            onSelect={handleFragmentClick}
                            reopenCooldownUntil={reopenCooldownUntil}
                        />
                    </motion.div>
                )}

                <AnimatePresence>
                    {selectedFragment && (
                        <motion.div
                            style={styles.consoleOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={closeConsole}
                        >
                            <motion.div
                                layoutId="console-panel"
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: isExpanded ? props.cineOffsetY : 0,
                                    filter: "blur(0px)",
                                }}
                                style={styles.consolePanel(
                                    liveActiveStarColor,
                                    isExpanded
                                        ? `min(95vw, ${props.cineWidth}px)`
                                        : `${props.consoleWidth}px`,
                                    isExpanded
                                        ? `min(85vh, ${props.cineHeight}px)`
                                        : `${props.consoleHeight}px`,
                                    isExpanded,
                                    props.cineOffsetY
                                )}
                                initial={{
                                    scale: 0.9,
                                    opacity: 0,
                                    y: 50,
                                    filter: "blur(8px)",
                                }}
                                exit={{
                                    scale: 0.9,
                                    opacity: 0,
                                    y: 50,
                                    filter: "blur(4px)",
                                }}
                                transition={{
                                    type: "spring",
                                    bounce: 0.3,
                                    duration: 0.6,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <HoloBackground />
                                <TechFrameSVG color={liveActiveStarColor} />
                                {!isExpanded && (
                                    <>
                                        <WireframePrism
                                            style={{
                                                left: "-30px",
                                                top: "20%",
                                            }}
                                            delay={0}
                                        />
                                        <WireframePrism
                                            style={{
                                                right: "-30px",
                                                bottom: "20%",
                                            }}
                                            delay={2}
                                        />
                                    </>
                                )}

                                {/* FIX: Animación botón cerrar corregida y robusta */}
                                <motion.button
                                    style={styles.consoleCloseButton(
                                        liveActiveStarColor
                                    )}
                                    initial="rest"
                                    whileHover="hover"
                                    whileTap="tap"
                                    variants={{
                                        rest: {
                                            scale: 1,
                                            rotate: 0,
                                            backgroundColor:
                                                "rgba(0, 20, 40, 0.8)",
                                            borderColor:
                                                "rgba(0, 194, 255, 0.6)",
                                        },
                                        hover: {
                                            scale: 1.1,
                                            rotate: 90,
                                            backgroundColor:
                                                "rgba(0, 194, 255, 0.2)",
                                            borderColor: "#FFFFFF",
                                        },
                                        tap: { scale: 0.95 },
                                    }}
                                    transition={{ duration: 0.2 }}
                                    onClick={closeConsole}
                                >
                                    <span
                                        style={{
                                            position: "relative",
                                            top: "-1.5px",
                                            display: "block",
                                            lineHeight: 1,
                                        }}
                                    >
                                        ×
                                    </span>
                                </motion.button>

                                {/* FIX: Flechas fuera del contenedor de Info para posición absoluta real */}
                                {!isExpanded &&
                                    activeFragments.findIndex(
                                        (f) => f.id === selectedFragment.id
                                    ) > 0 && (
                                        <motion.button
                                            style={{
                                                ...styles.navArrowBase(
                                                    true,
                                                    props.arrowPadding
                                                ),
                                                y: "-50%",
                                            }}
                                            whileHover={{
                                                scale: 1.1,
                                                boxShadow:
                                                    "0 0 25px rgba(0, 194, 255, 0.5)",
                                                borderColor: "#FFFFFF",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigateFragments("prev")
                                            }}
                                        >
                                            &larr;
                                        </motion.button>
                                    )}
                                {!isExpanded &&
                                    activeFragments.findIndex(
                                        (f) => f.id === selectedFragment.id
                                    ) <
                                        activeFragments.length - 1 && (
                                        <motion.button
                                            style={{
                                                ...styles.navArrowBase(
                                                    false,
                                                    props.arrowPadding
                                                ),
                                                y: "-50%",
                                            }}
                                            whileHover={{
                                                scale: 1.1,
                                                boxShadow:
                                                    "0 0 25px rgba(0, 194, 255, 0.5)",
                                                borderColor: "#FFFFFF",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigateFragments("next")
                                            }}
                                        >
                                            &rarr;
                                        </motion.button>
                                    )}

                                {isExpanded ? (
                                    // --- MODO CINE ---
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{
                                            opacity: 0,
                                            transition: { duration: 0.2 },
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.4, // FIX: Delay entrada video
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            position: "relative",
                                            zIndex: 20,
                                            padding: "30px 60px 0px 60px",
                                        }}
                                    >
                                        {/* FIX: Contenedor con fondo NEGRO para evitar parpadeos */}
                                        <div
                                            style={{
                                                flex: 1,
                                                width: "100%",
                                                position: "relative",
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                                background: "#000",
                                                boxShadow:
                                                    "0 0 30px rgba(0,194,255,0.1)",
                                                transform: "translate3d(0,0,0)",
                                                isolation: "isolate",
                                                border: "1px solid transparent",
                                            }}
                                        >
                                            {selectedFragment.embedCode ? (
                                                <EmbedPlayer
                                                    code={
                                                        selectedFragment.embedCode
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        color: "#666",
                                                    }}
                                                >
                                                    Embed Code no configurado
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                minHeight: "60px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                position: "relative",
                                            }}
                                        >
                                            <AnimatePresence>
                                                {showControls && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                        style={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                            position:
                                                                "relative",
                                                        }}
                                                    >
                                                        {/* CONTROLES DE NAVEGACION VIDEO */}
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "16px",
                                                            }}
                                                        >
                                                            <motion.button
                                                                variants={
                                                                    buttonVariants
                                                                }
                                                                initial="rest"
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                style={{
                                                                    ...styles.consoleButtonLayout,
                                                                    padding:
                                                                        "10px 24px",
                                                                    fontSize:
                                                                        "0.85rem",
                                                                    opacity:
                                                                        hasPrev
                                                                            ? 1
                                                                            : 0.5,
                                                                    pointerEvents:
                                                                        hasPrev
                                                                            ? "auto"
                                                                            : "none",
                                                                }}
                                                                onClick={() =>
                                                                    navigateFragments(
                                                                        "prev",
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                ANTERIOR
                                                            </motion.button>

                                                            <motion.button
                                                                variants={
                                                                    buttonVariants
                                                                }
                                                                initial="rest"
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                style={{
                                                                    ...styles.consoleButtonLayout,
                                                                    padding:
                                                                        "10px 24px",
                                                                    fontSize:
                                                                        "0.85rem",
                                                                }}
                                                                onClick={() =>
                                                                    setIsExpanded(
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                VOLVER
                                                            </motion.button>

                                                            <motion.button
                                                                variants={
                                                                    buttonVariants
                                                                }
                                                                initial="rest"
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                style={{
                                                                    ...styles.consoleButtonLayout,
                                                                    padding:
                                                                        "10px 24px",
                                                                    fontSize:
                                                                        "0.85rem",
                                                                    opacity:
                                                                        hasNext
                                                                            ? 1
                                                                            : 0.5,
                                                                    pointerEvents:
                                                                        hasNext
                                                                            ? "auto"
                                                                            : "none",
                                                                }}
                                                                onClick={() =>
                                                                    navigateFragments(
                                                                        "next",
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                SIGUIENTE
                                                            </motion.button>
                                                        </div>

                                                        <div
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                right: 0,
                                                            }}
                                                        >
                                                            <a
                                                                href={
                                                                    selectedFragment.youtubeLink
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "8px",
                                                                    color: "rgba(255,255,255,0.6)",
                                                                    textDecoration:
                                                                        "none",
                                                                    fontSize:
                                                                        "0.85rem",
                                                                    fontFamily:
                                                                        "'Inter', sans-serif",
                                                                    transition:
                                                                        "all 0.2s",
                                                                    opacity: 0.5,
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.color =
                                                                        "#FFF"
                                                                    e.currentTarget.style.opacity =
                                                                        "1"
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.color =
                                                                        "rgba(255,255,255,0.6)"
                                                                    e.currentTarget.style.opacity =
                                                                        "0.5"
                                                                }}
                                                            >
                                                                <span>
                                                                    Expandir en
                                                                    YouTube
                                                                </span>
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 24 24"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ) : (
                                    // --- MODO INFO ---
                                    // FIX: Animación Slow Motion al regresar
                                    <motion.div
                                        key="info-content"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{
                                            opacity: 0,
                                            transition: { duration: 0.1 },
                                        }}
                                        transition={{
                                            delay: 0.5, // Espera a que se encoja
                                            duration: 0.8, // Fade In lento y suave
                                            ease: "easeInOut",
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            className="hide-scrollbar"
                                            style={{
                                                ...styles.scrollableContent,
                                                gap: `${props.contentSpacing}px`,
                                            }}
                                        >
                                            <h2
                                                style={styles.consoleTitle(
                                                    liveActiveStarColor
                                                )}
                                            >
                                                {selectedFragment.fragmentLabel}
                                            </h2>

                                            <img
                                                src={
                                                    selectedFragment.coverUrl ||
                                                    makeFallbackDataUrl(
                                                        selectedFragment.title,
                                                        liveActiveStarColor,
                                                        150,
                                                        85
                                                    )
                                                }
                                                alt={selectedFragment.title}
                                                style={styles.consoleImage}
                                            />

                                            <div style={styles.textWrapper}>
                                                <motion.div
                                                    style={styles.consoleDescTitleGlowBase(
                                                        liveActiveStarColor
                                                    )}
                                                >
                                                    {
                                                        selectedFragment.episodeTitle
                                                    }
                                                </motion.div>
                                                <p style={styles.consoleBody}>
                                                    {selectedFragment.synopsis}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={styles.footerContent}>
                                            <motion.button
                                                variants={buttonVariants}
                                                initial="rest"
                                                whileHover="hover"
                                                whileTap="tap"
                                                style={
                                                    styles.consoleButtonLayout
                                                }
                                                onClick={() =>
                                                    setIsExpanded(true)
                                                }
                                            >
                                                VISUALIZAR AHORA
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(FragmentosDelSol, {
    fragments: {
        type: ControlType.Array,
        title: "Fragmentos",
        propertyControl: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Título" },
                synopsis: {
                    type: ControlType.String,
                    title: "Sinopsis",
                    displayTextArea: true, // Fix: Usa displayTextArea en lugar de rows
                },
                cover: { type: ControlType.Image, title: "Cover" },
                embedCode: {
                    type: ControlType.String,
                    title: "Embed Code (Vimeo/Wistia)",
                    displayTextArea: true, // Fix: Usa displayTextArea en lugar de rows
                },
                youtubeLink: {
                    type: ControlType.String,
                    title: "YouTube Link",
                },
            },
        },
    },
    pageTitleFallbackText: {
        type: ControlType.String,
        title: "Título Página",
        defaultValue: "FRAGMENTOS",
    },
    pageTitleFallbackHeight: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
    },
    pageTitleXOffsetPx: {
        type: ControlType.Number,
        title: "Título Offset X",
        defaultValue: 0,
    },
    navbarOffset: {
        type: ControlType.Number,
        title: "Navbar Offset (Top)",
        defaultValue: 72,
    },

    titleYOffset: {
        type: ControlType.Number,
        title: "Título Y Offset",
        defaultValue: 0,
        min: -1000,
        max: 2000,
        step: 10,
    },
    stellarYOffset: {
        type: ControlType.Number,
        title: "Sistema Y Offset",
        defaultValue: 0,
        min: -1000, // Fix: Permite valores negativos
        max: 2000,
        step: 10,
    },

    cineOffsetY: {
        type: ControlType.Number,
        title: "Cine Y Offset",
        defaultValue: 0,
        step: 10,
    },
    cineWidth: {
        type: ControlType.Number,
        title: "Cine Ancho Max",
        defaultValue: 1280,
        step: 10,
    },
    cineHeight: {
        type: ControlType.Number,
        title: "Cine Alto Max",
        defaultValue: 800,
        step: 10,
    },
    idleTimeout: {
        type: ControlType.Number,
        title: "Segundos Inactividad",
        defaultValue: 3,
        min: 1,
        max: 10,
    },

    consoleWidth: {
        type: ControlType.Number,
        title: "Ancho Consola",
        defaultValue: 800,
    },
    consoleHeight: {
        type: ControlType.Number,
        title: "Alto Consola",
        defaultValue: 600,
    },
    contentSpacing: {
        type: ControlType.Number,
        title: "Espaciado Texto",
        defaultValue: 24,
    },
    consoleBgOpacity: {
        type: ControlType.Number,
        title: "Opacidad Consola",
        defaultValue: 0.95,
        min: 0,
        max: 1,
        step: 0.05,
    },
    // FIX: Nuevo control sin límites negativos
    arrowPadding: {
        type: ControlType.Number,
        title: "Margen Flechas",
        defaultValue: 10,
        min: -50,
        max: 100,
    },

    accentColor: {
        type: ControlType.Color,
        title: "Color Primario",
        defaultValue: "#00C2FF",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 150,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Warp Speed",
        defaultValue: 1.0,
        step: 0.1,
    },

    orbit1Duration: {
        type: ControlType.Number,
        title: "Órbita 1 (s)",
        defaultValue: 100,
    },
    orbit2Duration: {
        type: ControlType.Number,
        title: "Órbita 2 (s)",
        defaultValue: 300,
    },
    orbit3Duration: {
        type: ControlType.Number,
        title: "Órbita 3 (s)",
        defaultValue: 180,
    },

    titleImage: { type: ControlType.Image, title: "Imagen Título (Opcional)" },
    planetGlow: {
        type: ControlType.Number,
        title: "Glow Planeta",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
