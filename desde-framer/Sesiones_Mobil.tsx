import * as React from "react"
import { useMemo, useState, memo, useEffect, useRef, useCallback } from "react"
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

const formatText = (text: string) => {
    if (!text) return null
    return text.split("\\n").map((str, i, arr) => (
        <React.Fragment key={i}>
            {str.split("\n").map((innerStr, j, innerArr) => (
                <React.Fragment key={`${i}-${j}`}>
                    {innerStr}
                    {j < innerArr.length - 1 && <br />}
                </React.Fragment>
            ))}
            {i < arr.length - 1 && <br />}
        </React.Fragment>
    ))
}

const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    if (isNaN(num)) return `rgba(0,194,255,${a})`
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}

/* ── SFX Generador: Sonido Holográfico ── */
const playHoloHover = () => {
    if (typeof window === "undefined") return
    try {
        const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) return
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.015, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
        // Silencio en navegadores estrictos
    }
}

/* ── Timeline SVG Icons ── */
const TimelineIcon = ({ type, color }: { type: string; color: string }) => {
    const sProps = {
        stroke: color,
        strokeWidth: 1.5,
        fill: "none",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    switch (type) {
        case "anchor":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" {...sProps}>
                    <circle cx="12" cy="5" r="3" />
                    <line x1="12" y1="22" x2="12" y2="8" />
                    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                </svg>
            )
        case "transmission":
            return (
                <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M8 2 C14 5, 14 9, 8 12 C2 15, 2 19, 8 22" />
                    <path d="M16 2 C10 5, 10 9, 16 12 C22 15, 22 19, 16 22" />
                    <line
                        x1="8"
                        y1="2"
                        x2="16"
                        y2="2"
                        strokeWidth={1}
                        opacity="0.35"
                    />
                    <line
                        x1="9.5"
                        y1="7"
                        x2="14.5"
                        y2="7"
                        strokeWidth={1}
                        opacity="0.5"
                    />
                    <line
                        x1="8"
                        y1="12"
                        x2="16"
                        y2="12"
                        strokeWidth={1}
                        opacity="0.6"
                    />
                    <line
                        x1="9.5"
                        y1="17"
                        x2="14.5"
                        y2="17"
                        strokeWidth={1}
                        opacity="0.5"
                    />
                    <line
                        x1="8"
                        y1="22"
                        x2="16"
                        y2="22"
                        strokeWidth={1}
                        opacity="0.35"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1.8"
                        fill={color}
                        stroke="none"
                        opacity="0.65"
                    />
                </svg>
            )
        case "resonance":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" {...sProps}>
                    <circle cx="12" cy="12" r="10" />
                    <ellipse
                        cx="12"
                        cy="12"
                        rx="10"
                        ry="4"
                        transform="rotate(90 12 12)"
                    />
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                </svg>
            )
        case "seal":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" {...sProps}>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        default:
            return null
    }
}

/* ── Toroide ── */
const IconToroid = ({
    color = "#D4A843",
    size = 120,
}: {
    color?: string
    size?: number
}) => {
    const rings = [
        { r: 40, opacity: 0.7, width: 1.2 },
        { r: 33, opacity: 0.5, width: 0.9 },
        { r: 26, opacity: 0.35, width: 0.7 },
        { r: 19, opacity: 0.25, width: 0.5 },
    ]
    return (
        <motion.div
            style={{
                width: size,
                height: size,
                filter: `drop-shadow(0 0 18px ${color}88) drop-shadow(0 0 40px ${color}44)`,
            }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
            <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
                <defs>
                    <radialGradient id="tGl" cx="50%" cy="40%" r="55%">
                        <stop
                            offset="0%"
                            stopColor={color}
                            stopOpacity="0.35"
                        />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                    <linearGradient
                        id="tEdge"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={color} />
                        <stop offset="50%" stopColor="#FFFACD" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="url(#tGl)"
                    opacity="0.15"
                />
                <ellipse
                    cx="60"
                    cy="60"
                    rx="42"
                    ry="22"
                    stroke="url(#tEdge)"
                    strokeWidth="1.4"
                    opacity="0.8"
                />
                <ellipse
                    cx="60"
                    cy="60"
                    rx="42"
                    ry="22"
                    stroke={color}
                    strokeWidth="0.3"
                    opacity="0.3"
                    transform="rotate(90 60 60)"
                />
                {rings.map((ring, i) => (
                    <ellipse
                        key={i}
                        cx="60"
                        cy="60"
                        rx={ring.r}
                        ry={ring.r * 0.52}
                        stroke={color}
                        strokeWidth={ring.width}
                        opacity={ring.opacity}
                    />
                ))}
                {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI
                    const rx = 18,
                        ry = 40
                    const cos = Math.cos(angle),
                        sin = Math.sin(angle)
                    const pts: string[] = []
                    for (let t = 0; t <= 24; t++) {
                        const a = (t / 24) * Math.PI * 2
                        const px = rx * Math.cos(a)
                        const py = ry * Math.sin(a)
                        pts.push(
                            `${t === 0 ? "M" : "L"}${(60 + px * cos).toFixed(1)},${(60 + py * 0.52 * sin + px * sin * 0.15).toFixed(1)}`
                        )
                    }
                    return (
                        <path
                            key={`m-${i}`}
                            d={pts.join(" ")}
                            stroke={color}
                            strokeWidth="0.5"
                            opacity={0.2 + (i % 2) * 0.1}
                            fill="none"
                        />
                    )
                })}
                <circle cx="60" cy="60" r="3" fill={color} opacity="0.6" />
                <circle
                    cx="60"
                    cy="60"
                    r="6"
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.25"
                />
                <path
                    d="M 25 55 Q 40 35 60 38 Q 80 35 95 55"
                    stroke={color}
                    strokeWidth="0.4"
                    opacity="0.15"
                    fill="none"
                />
                <path
                    d="M 25 65 Q 40 85 60 82 Q 80 85 95 65"
                    stroke={color}
                    strokeWidth="0.4"
                    opacity="0.15"
                    fill="none"
                />
            </svg>
        </motion.div>
    )
}

/* ── Merkabah ── */
const IconMerkabah = ({
    color = "#D4A843",
    size = 120,
}: {
    color?: string
    size?: number
}) => {
    const cx = 60,
        cy = 60,
        R = 42
    const upTri = [0, 1, 2].map((i) => {
        const a = ((i * 120 - 90) * Math.PI) / 180
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
    })
    const downTri = [0, 1, 2].map((i) => {
        const a = ((i * 120 + 90) * Math.PI) / 180
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
    })
    const Ri = R * 0.52
    const innerUp = [0, 1, 2].map((i) => {
        const a = ((i * 120 - 90) * Math.PI) / 180
        return { x: cx + Ri * Math.cos(a), y: cy + Ri * Math.sin(a) }
    })
    const innerDown = [0, 1, 2].map((i) => {
        const a = ((i * 120 + 90) * Math.PI) / 180
        return { x: cx + Ri * Math.cos(a), y: cy + Ri * Math.sin(a) }
    })
    const tp = (pts: { x: number; y: number }[]) =>
        `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)} L${pts[2].x.toFixed(1)},${pts[2].y.toFixed(1)}Z`
    return (
        <motion.div
            style={{
                width: size,
                height: size,
                filter: `drop-shadow(0 0 16px ${color}88) drop-shadow(0 0 35px ${color}44)`,
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
            <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
                <defs>
                    <radialGradient id="merkGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                    <linearGradient
                        id="merkEdge"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={color} />
                        <stop offset="50%" stopColor="#FFFACD" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="url(#merkGlow)"
                    opacity="0.12"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={R + 2}
                    stroke={color}
                    strokeWidth="0.4"
                    opacity="0.2"
                    strokeDasharray="3 5"
                />
                <path
                    d={tp(innerUp)}
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.25"
                />
                <path
                    d={tp(innerDown)}
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.25"
                />
                {upTri.map((p, i) => (
                    <line
                        key={`du-${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={innerDown[i].x}
                        y2={innerDown[i].y}
                        stroke={color}
                        strokeWidth="0.6"
                        opacity="0.35"
                    />
                ))}
                {downTri.map((p, i) => (
                    <line
                        key={`dd-${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={innerUp[i].x}
                        y2={innerUp[i].y}
                        stroke={color}
                        strokeWidth="0.6"
                        opacity="0.35"
                    />
                ))}
                <path
                    d={tp(upTri)}
                    stroke="url(#merkEdge)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <path
                    d={tp(downTri)}
                    stroke="url(#merkEdge)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <circle cx="60" cy="60" r="2.5" fill={color} opacity="0.9" />
                <circle
                    cx="60"
                    cy="60"
                    r="5"
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.4"
                />
                {[...upTri, ...downTri].map((p, i) => (
                    <circle
                        key={`v-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r="1.5"
                        fill={color}
                        opacity="0.7"
                    />
                ))}
            </svg>
        </motion.div>
    )
}

/* ── Benefit SVG Icons ── */
const BIconSpiral = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
        <defs>
            <filter id="bGlS">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#bGlS)">
            <path
                d="M32 10 C42 10 50 18 50 28 C50 36 44 42 36 42 C30 42 26 38 26 33 C26 29 29 26 32 26 C35 26 37 28 37 31"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="32" cy="31" r="2" fill={color} opacity="0.8" />
            <path
                d="M20 48 Q26 54 32 48 Q38 42 44 48"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
            />
        </g>
    </svg>
)
const BIconPrism = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
        <defs>
            <filter id="bGlP">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#bGlP)">
            <path
                d="M32 8 L52 28 L32 56 L12 28 Z"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                fill="none"
            />
            <line
                x1="32"
                y1="8"
                x2="32"
                y2="56"
                stroke={color}
                strokeWidth="1"
                opacity="0.4"
            />
            <line
                x1="12"
                y1="28"
                x2="52"
                y2="28"
                stroke={color}
                strokeWidth="1"
                opacity="0.4"
            />
            <circle cx="32" cy="28" r="3" fill={color} opacity="0.5" />
        </g>
    </svg>
)
const BIconAntenna = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
        <defs>
            <filter id="bGlA">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#bGlA)">
            <line
                x1="32"
                y1="54"
                x2="32"
                y2="24"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle
                cx="32"
                cy="20"
                r="4"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
            <path
                d="M22 16 A14 14 0 0 1 42 16"
                stroke={color}
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
            />
            <path
                d="M16 12 A20 20 0 0 1 48 12"
                stroke={color}
                strokeWidth="1.2"
                fill="none"
                opacity="0.4"
            />
            <line
                x1="24"
                y1="54"
                x2="40"
                y2="54"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
            />
        </g>
    </svg>
)
const BIconMirror = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
        <defs>
            <filter id="bGlM">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#bGlM)">
            <path
                d="M6 32 Q20 14 32 14 Q44 14 58 32 Q44 50 32 50 Q20 50 6 32Z"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                fill="none"
            />
            <circle
                cx="32"
                cy="32"
                r="8"
                stroke={color}
                strokeWidth="1.8"
                fill="none"
            />
            <circle cx="32" cy="32" r="3" fill={color} opacity="0.7" />
        </g>
    </svg>
)

const BENEFIT_ICON_MAP: Record<string, React.FC<{ color: string }>> = {
    spiral: BIconSpiral,
    prism: BIconPrism,
    antenna: BIconAntenna,
    mirror: BIconMirror,
}

/* ── Shared Components ── */
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
            scale: 1.15,
            backgroundColor: "rgba(255,255,255,0.2)",
            boxShadow: "0 0 20px rgba(0,194,255,0.5)",
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
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

const GoldenButton = ({
    text,
    onClick,
    style,
    subtle,
}: {
    text: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
    subtle?: boolean
}) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
            background:
                "linear-gradient(135deg, #B8902F 0%, #D4A843 30%, #F5D98C 50%, #D4A843 70%, #B8902F 100%)",
            border: subtle
                ? "1px solid rgba(212,168,67,0.4)"
                : "1px solid rgba(212,168,67,0.6)",
            borderRadius: 50,
            padding: "16px 36px",
            color: "#0B0C13",
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            boxShadow: subtle
                ? "0 0 8px rgba(212,168,67,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                : "0 0 15px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
            whiteSpace: "nowrap" as const,
            width: "100%",
            ...style,
        }}
    >
        {text}
    </motion.button>
)

const INLINE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
.m-scroll::-webkit-scrollbar{display:none}
.m-scroll{scrollbar-width:none;overflow-y:auto;overflow-x:hidden;height:100vh;height:100dvh;width:100%;position:relative;z-index:2;scroll-behavior:smooth;overscroll-behavior:none;-webkit-overflow-scrolling:touch}
@keyframes sf-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
@keyframes holo-shimmer{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
@keyframes holo-scan{0%{top:-30%}100%{top:130%}}
`

/* ── Calendly ── */
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
        const m = t.match(/data-url="([^"]+)"/)
        if (m?.[1]) return m[1]
        return t
    }
    const base = cleanUrl(input)
    if (!base) return ""
    const sa = (accent || "#00C2FF").replace("#", "")
    const sep = base.includes("?") ? "&" : "?"
    return `${base}${sep}background_color=080C14&text_color=ffffff&primary_color=${sa}`
}

/* ── Generador Pseudo-Random para Estrellas ── */
const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

/* ── Stars Background ── */
const StarsBackground = memo(
    ({ num = 90, speed = 1, bgColor = "#0B0C13" }: any) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [activated, setActivated] = useState(false)

        const stars = useMemo(() => {
            const count = Math.floor(num * 1.5)
            const arr: any[] = []
            for (let i = 0; i < count; i++) {
                const sz =
                    pseudoRandom(i) > 0.8
                        ? pseudoRandom(i + 1000) * 2 + 1
                        : pseudoRandom(i + 1000) * 1.5 + 0.5
                const tx = (pseudoRandom(i + 2000) - 0.5) * 250
                const ty = (pseudoRandom(i + 3000) - 0.5) * 250
                const dur = (1.5 + pseudoRandom(i + 4000) * 4) / speed
                const del = pseudoRandom(i + 5000) * 5
                arr.push({
                    id: i,
                    sz: sz,
                    tx: `${tx.toFixed(0)}vw`,
                    ty: `${ty.toFixed(0)}vh`,
                    d: `${dur.toFixed(2)}s`,
                    dl: `${del.toFixed(2)}s`,
                })
            }
            return arr
        }, [num, speed])

        useEffect(() => {
            let done = false
            const activate = () => {
                if (done) return
                done = true
                const el = containerRef.current
                if (el) void el.offsetHeight
                setActivated(true)
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    activate()
                })
            })
            const fallback = setTimeout(activate, 250)
            return () => {
                done = true
                clearTimeout(fallback)
            }
        }, [])

        return (
            <>
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        backgroundColor: bgColor,
                        minHeight: "100vh",
                    }}
                />
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: "none",
                        background: "transparent",
                    }}
                />
                <div className="sf-stars-container" ref={containerRef}>
                    {stars.map((s) => (
                        <div
                            key={s.id}
                            className={`sf-star${activated ? " sf-active" : ""}`}
                            style={{
                                width: s.sz,
                                height: s.sz,
                                ["--tx" as any]: s.tx,
                                ["--ty" as any]: s.ty,
                                ["--d" as any]: s.d,
                                ["--dl" as any]: s.dl,
                            }}
                        />
                    ))}
                </div>
            </>
        )
    }
)

/* ── Lugares Disponibles ── */
const LugaresDisponibles = ({
    count,
    accent,
}: {
    count: number
    accent: string
}) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            padding: "6px 16px",
            borderRadius: 50,
            border: `1px solid ${hexToRgba(accent, 0.35)}`,
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.08)}, transparent)`,
            boxShadow: `0 0 12px ${hexToRgba(accent, 0.15)}`,
        }}
    >
        <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 8px ${accent}`,
            }}
        />
        <span
            style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                color: accent,
                textTransform: "uppercase",
                textShadow: `0 0 8px ${hexToRgba(accent, 0.4)}`,
            }}
        >
            {count} Lugares Disponibles
        </span>
    </motion.div>
)

/* ── Modals & Calendly ── */
const ModalOverlay = ({ onClose, children }: any) => {
    useEffect(() => {
        if (typeof document === "undefined") return
        return () => {
            window.scrollTo(0, window.scrollY)
            requestAnimationFrame(() => {
                document.documentElement.style.height = ""
            })
        }
    }, [])
    return (
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
    const [loading, setLoading] = useState(true)
    const finalUrl = useMemo(() => buildCalendlyUrl(url, accent), [url, accent])
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        el.innerHTML = ""
        setLoading(true)
        let c = false
        const tryInit = (a: number) => {
            if (c) return
            const C = (window as any)?.Calendly
            if (finalUrl && C?.initInlineWidget) {
                try {
                    el.innerHTML = ""
                    C.initInlineWidget({ url: finalUrl, parentElement: el })
                    setTimeout(() => setLoading(false), 1500)
                    return
                } catch {}
            }
            if (a < 24) {
                setTimeout(() => tryInit(a + 1), 150)
                return
            }
            if (!finalUrl) return
            const f = document.createElement("iframe")
            f.src = finalUrl
            f.width = "100%"
            f.height = "100%"
            f.style.border = "0"
            f.onload = () => setTimeout(() => setLoading(false), 800)
            el.appendChild(f)
        }
        tryInit(0)
        return () => {
            c = true
            if (el) el.innerHTML = ""
        }
    }, [finalUrl])
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        background: "#080C14",
                    }}
                >
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{ width: 48, height: 48, opacity: 0.7 }}
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
                                stroke={accent}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </motion.div>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            fontSize: 14,
                            fontWeight: 300,
                            color: accent,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                        }}
                    >
                        Sintonizando...
                    </motion.span>
                </div>
            )}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            {maskBottomPx > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: maskBottomPx,
                        background:
                            "linear-gradient(180deg, rgba(8,12,20,0) 0%, rgba(8,12,20,1) 100%)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

const CalendarHeader = ({ onClose, rawUrl, accent }: any) => {
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

const FAQModal = ({ onClose, items, accent }: any) => {
    const [exp, setExp] = useState<number | null>(null)

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = originalStyle
        }
    }, [])

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
                        WebkitOverflowScrolling: "touch",
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
                                    overflow: "visible",
                                    cursor: "pointer",
                                    transition: "border-color .15s ease-out",
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
                                            transition:
                                                "transform .2s ease-out",
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
                                            transition={{
                                                duration: 0.25,
                                                ease: "easeInOut",
                                            }}
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

/* ── Schedule Info (Local time conversion + Cupo) ── */
const ScheduleInfo = ({ accent }: { accent: string }) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [localTime, setLocalTime] = useState("")
    useEffect(() => {
        try {
            const utcDate = new Date()
            utcDate.setUTCHours(17, 30, 0, 0)
            const formatter = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            const parts = formatter.formatToParts(utcDate)
            const timeParts = parts
                .filter((p) =>
                    ["hour", "minute", "literal", "dayPeriod"].includes(p.type)
                )
                .map((p) => p.value)
                .join("")
            setLocalTime(timeParts)
        } catch {
            setLocalTime("")
        }
    }, [])
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontSize: 13,
                        color: "rgba(230,247,239,0.6)",
                        letterSpacing: "0.1em",
                        fontWeight: 300,
                    }}
                >
                    12:30 pm (UTC-5)
                </span>
                {localTime && (
                    <>
                        <span style={{ color: A(0.3), fontSize: 11 }}>|</span>
                        <span
                            style={{
                                fontSize: 13,
                                color: accent,
                                letterSpacing: "0.06em",
                                fontWeight: 400,
                                opacity: 0.8,
                            }}
                        >
                            Tu hora local: {localTime}
                        </span>
                    </>
                )}
            </div>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 16px",
                    borderRadius: 50,
                    border: `1px solid ${A(0.15)}`,
                    background: `linear-gradient(135deg, ${A(0.04)}, transparent)`,
                    fontSize: 12,
                    color: "rgba(230,247,239,0.55)",
                    fontWeight: 400,
                    letterSpacing: "0.08em",
                }}
            >
                <span style={{ fontSize: 10, opacity: 0.7 }}>◈</span>
                Capacidad del Domo: 22 Tripulantes
            </div>
        </motion.div>
    )
}

/* ── VIP Benefit SVG Icons (for Membership) ── */
const VIPIconCalendar = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <rect
            x="6"
            y="10"
            width="36"
            height="32"
            rx="4"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="6"
            y1="20"
            x2="42"
            y2="20"
            stroke={color}
            strokeWidth="1.5"
            opacity="0.6"
        />
        <line
            x1="16"
            y1="6"
            x2="16"
            y2="14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
        <line
            x1="32"
            y1="6"
            x2="32"
            y2="14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
        <text
            x="24"
            y="35"
            textAnchor="middle"
            fill={color}
            fontSize="14"
            fontWeight="600"
            fontFamily="Inter,sans-serif"
        >
            5
        </text>
        <circle
            cx="37"
            cy="37"
            r="8"
            fill="rgba(0,0,0,0.8)"
            stroke={color}
            strokeWidth="1.2"
        />
        <text
            x="37"
            y="40.5"
            textAnchor="middle"
            fill={color}
            fontSize="8"
            fontWeight="700"
            fontFamily="Inter,sans-serif"
        >
            ∞
        </text>
    </svg>
)
const VIPIconBook = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <path
            d="M8 8 Q8 6 10 6 L34 6 Q36 6 36 8 L36 38 Q36 40 34 40 L10 40 Q8 40 8 38Z"
            stroke={color}
            strokeWidth="1.5"
        />
        <path
            d="M12 40 L12 42 Q12 44 14 44 L38 44 Q40 44 40 42 L40 12 Q40 10 38 10 L36 10"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="14"
            y1="14"
            x2="30"
            y2="14"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
        />
        <line
            x1="14"
            y1="20"
            x2="26"
            y2="20"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
        />
        <text
            x="32"
            y="34"
            textAnchor="middle"
            fill={color}
            fontSize="12"
            fontWeight="700"
            fontFamily="Inter,sans-serif"
            opacity="0.8"
        >
            %
        </text>
    </svg>
)
const VIPIconSession = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="18" r="8" stroke={color} strokeWidth="1.5" />
        <path
            d="M10 40 Q10 30 24 30 Q38 30 38 40"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <circle
            cx="36"
            cy="14"
            r="6"
            fill="rgba(0,0,0,0.8)"
            stroke={color}
            strokeWidth="1.2"
        />
        <text
            x="36"
            y="17"
            textAnchor="middle"
            fill={color}
            fontSize="7"
            fontWeight="700"
            fontFamily="Inter,sans-serif"
        >
            1:1
        </text>
    </svg>
)
const VIPIconWhatsApp = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <rect
            x="8"
            y="4"
            width="32"
            height="36"
            rx="6"
            stroke={color}
            strokeWidth="1.5"
        />
        <circle
            cx="24"
            cy="18"
            r="6"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.6"
        />
        <circle
            cx="16"
            cy="28"
            r="3.5"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
        />
        <circle
            cx="32"
            cy="28"
            r="3.5"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
        />
        <path
            d="M13 44 L24 38 L35 44"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <line
            x1="16"
            y1="28"
            x2="24"
            y2="22"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.3"
        />
        <line
            x1="32"
            y1="28"
            x2="24"
            y2="22"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.3"
        />
    </svg>
)
const VIPIconPDF = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <path
            d="M12 4 L30 4 L38 12 L38 44 L12 44 Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <path
            d="M30 4 L30 12 L38 12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <line
            x1="18"
            y1="22"
            x2="32"
            y2="22"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
        />
        <line
            x1="18"
            y1="28"
            x2="30"
            y2="28"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
        />
        <line
            x1="18"
            y1="34"
            x2="28"
            y2="34"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
        />
        <circle
            cx="36"
            cy="38"
            r="7"
            fill="rgba(0,0,0,0.8)"
            stroke={color}
            strokeWidth="1.2"
        />
        <path
            d="M33 38 L36 41 L40 35"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
const VIPIconRecording = ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
        <rect
            x="6"
            y="10"
            width="36"
            height="24"
            rx="3"
            stroke={color}
            strokeWidth="1.5"
        />
        <polygon
            points="20,17 20,29 32,23"
            stroke={color}
            strokeWidth="1.5"
            fill={color}
            fillOpacity="0.15"
            strokeLinejoin="round"
        />
        <circle
            cx="38"
            cy="38"
            r="7"
            fill="rgba(0,0,0,0.8)"
            stroke={color}
            strokeWidth="1.2"
        />
        <circle
            cx="38"
            cy="38"
            r="3"
            fill={color}
            fillOpacity="0.3"
            stroke={color}
            strokeWidth="1"
        />
        <circle cx="38" cy="38" r="1.2" fill={color} />
    </svg>
)

const VIP_ICONS = [
    VIPIconCalendar,
    VIPIconBook,
    VIPIconWhatsApp,
    VIPIconPDF,
    VIPIconRecording,
    VIPIconSession,
]

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
.m-scroll::-webkit-scrollbar{display:none}
.m-scroll{scrollbar-width:none;overflow-y:auto;overflow-x:hidden;height:100vh;height:100dvh;width:100%;position:relative;z-index:2;scroll-behavior:smooth;overscroll-behavior:none;-webkit-overflow-scrolling:touch}
@keyframes sf-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
@keyframes holo-shimmer{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
@keyframes holo-scan{0%{top:-30%}100%{top:130%}}
.calendly-inline-widget,.calendly-inline-widget iframe{width:100%!important;height:100%!important;min-height:100%!important}
`

/* ── MOBILE: Portal Card ── */
const MobilePortalCard = ({
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
                    subtle={true}
                    text={btnText}
                    onClick={undefined}
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

/* ── MOBILE: Vertical Timeline ── */
const MobileTimeline = ({ items, accent, scrollRoot }: any) => {
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
                                            ? `0 0 16px ${A(0.4)}, inset 0 0 8px ${A(0.1)}`
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

/* ── MOBILE: Benefit Cards (single column, collapsible) ── */
const MobileBenefitCards = ({ items, accent, scrollRoot }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [openSet, setOpenSet] = useState<Set<number>>(new Set())
    const toggle = (i: number) => {
        setOpenSet((prev) => {
            const n = new Set(prev)
            if (n.has(i)) n.delete(i)
            else n.add(i)
            return n
        })
    }
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

/* ── MOBILE: Compact Schedule Strip for Pass Cards ── */
const PassScheduleStrip = ({
    accent,
    isGold,
}: {
    accent: string
    isGold?: boolean
}) => {
    const goldColor = "#D4A843"
    const stripColor = isGold ? goldColor : accent
    const A = (x: number) => hexToRgba(stripColor, x)
    const [localTime, setLocalTime] = useState("")
    useEffect(() => {
        try {
            const utcDate = new Date()
            utcDate.setUTCHours(17, 30, 0, 0)
            const formatter = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            const parts = formatter.formatToParts(utcDate)
            const timeParts = parts
                .filter((p) =>
                    ["hour", "minute", "literal", "dayPeriod"].includes(p.type)
                )
                .map((p) => p.value)
                .join("")
            setLocalTime(timeParts)
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
                Todos los Martes 12:30 pm (UTC-5)
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

/* ── MOBILE: Next Session Countdown ── */
const NextSessionCountdown = ({ accent }: { accent: string }) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const getNextTuesday1230 = () => {
            const now = new Date()
            const targetHourUTC = 17
            const targetMinUTC = 30
            const nowDay = now.getUTCDay()
            let daysUntilTue = (2 - nowDay + 7) % 7

            const candidate = new Date(now)
            candidate.setUTCDate(now.getUTCDate() + daysUntilTue)
            candidate.setUTCHours(targetHourUTC, targetMinUTC, 0, 0)

            if (candidate.getTime() <= now.getTime()) {
                candidate.setUTCDate(candidate.getUTCDate() + 7)
            }
            return candidate
        }

        const update = () => {
            const now = new Date()
            const target = getNextTuesday1230()
            const diff = target.getTime() - now.getTime()
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 })
            } else {
                const totalMin = Math.floor(diff / 60000)
                const days = Math.floor(totalMin / 1440)
                const hours = Math.floor((totalMin % 1440) / 60)
                const minutes = totalMin % 60
                setTimeLeft({ days, hours, minutes })
            }
            setMounted(true)
        }

        update()
        const interval = setInterval(update, 30000)
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    const pad = (n: number) => String(n).padStart(2, "0")
    const { days, hours, minutes } = timeLeft
    const showDays = days > 0
    const showHours = days > 0 || hours > 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "16px 20px",
                marginTop: 20,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                        flexShrink: 0,
                    }}
                />
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        color: "rgba(230,247,239,0.55)",
                        textTransform: "uppercase" as const,
                    }}
                >
                    PRÓXIMA SINTONIZACIÓN
                </span>
            </div>
            <span
                style={{
                    fontSize: 22,
                    fontWeight: 200,
                    letterSpacing: "0.1em",
                    color: accent,
                    textShadow: `0 0 14px ${A(0.4)}`,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {showDays && (
                    <>
                        {pad(days)}{" "}
                        <span
                            style={{
                                opacity: 0.45,
                                fontSize: 12,
                                fontWeight: 300,
                            }}
                        >
                            d
                        </span>
                        {"  :  "}
                    </>
                )}
                {showHours && (
                    <>
                        {pad(hours)}{" "}
                        <span
                            style={{
                                opacity: 0.45,
                                fontSize: 12,
                                fontWeight: 300,
                            }}
                        >
                            h
                        </span>
                        {"  :  "}
                    </>
                )}
                {pad(minutes)}{" "}
                <span style={{ opacity: 0.45, fontSize: 12, fontWeight: 300 }}>
                    m
                </span>
            </span>
        </motion.div>
    )
}

/* ── MOBILE: Holographic Pass Card (stacked) ── */
const MobilePassCard = ({
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
    const features = (pass.features || "").split("\n").filter(Boolean)
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
                        {formatText(pass.price)}
                    </div>
                    <PassScheduleStrip accent={accent} isGold={isGold} />
                    <p
                        style={{
                            fontSize: 13,
                            color: "#999",
                            lineHeight: 1.5,
                            margin: "0 0 20px 0",
                            textAlign: isGold ? "left" : "center",
                        }}
                    >
                        {formatText(pass.desc)}
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
                                border: `1px solid rgba(212,168,67,0.3)`,
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
                                {lugaresDisponibles} Lugares Disponibles
                            </span>
                        </div>
                    )}
                    <GoldenButton
                        text={formatText(pass.btnText)}
                        onClick={onClick}
                        style={{ borderRadius: 12 }}
                    />
                </div>
            </div>
        </motion.div>
    )
}

/* ── MOBILE: Explainer (Video top, text below) ── */
const MobileExplainer = ({
    accent,
    videoUrl,
    videoHeight,
    scrollRoot,
    subtitle,
    elementosClave,
}: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [openPillars, setOpenPillars] = useState<Set<number>>(new Set())
    const toggleP = (i: number) => {
        setOpenPillars((prev) => {
            const n = new Set(prev)
            if (n.has(i)) n.delete(i)
            else n.add(i)
            return n
        })
    }

    const defaultIcons = ["◈", "◎", "🪞"]

    const pillars =
        elementosClave && elementosClave.length > 0
            ? elementosClave.map((item: any, i: number) => ({
                  icon: item.icon || defaultIcons[i] || "◈",
                  title: item.title || "",
                  desc: item.desc || "",
              }))
            : [
                  {
                      icon: "◈",
                      title: "RECALIBRACIÓN DE FRECUENCIA",
                      desc: "Pasamos de la alerta de supervivencia a la regeneración parasimpática.\nSilenciamos el ruido externo para escuchar tu propia voz.",
                  },
                  {
                      icon: "◎",
                      title: "Sintonizar el Poder del Toroide",
                      desc: "No estás solo. La coherencia de un grupo enfocado amplifica tu capacidad de manifestación.\nLo que te toma meses integrar solo, aquí puede suceder en minutos por resonancia.",
                  },
                  {
                      icon: "🪞",
                      title: "Presenciar el Espejo Fractal",
                      desc: "En el segmento de preguntas, la duda de uno es la medicina de todos.\nDesbloqueamos patrones colectivos en tiempo real.",
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

/* ── MOBILE: Floating buttons (bottom right) ── */
const MobileFloating = ({
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
            <button
                onClick={onFaqClick}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px 0 0 14px",
                    borderTop: `1px solid ${A(0.1)}`,
                    borderBottom: `1px solid ${A(0.1)}`,
                    borderLeft: `1px solid ${A(0.1)}`,
                    borderRight: `2px solid ${A(0.5)}`,
                    background: "rgba(8,12,20,0.95)",
                    backdropFilter: "blur(12px)",
                    color: A(0.65),
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    boxShadow: `-4px 0 15px ${A(0.05)}`,
                    paddingRight: 4,
                }}
            >
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
            <button
                onClick={onScrollTop}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px 0 0 14px",
                    borderTop: `1px solid ${A(0.1)}`,
                    borderBottom: `1px solid ${A(0.1)}`,
                    borderLeft: `1px solid ${A(0.1)}`,
                    borderRight: `2px solid ${A(0.5)}`,
                    background: "rgba(8,12,20,0.95)",
                    backdropFilter: "blur(12px)",
                    color: A(0.65),
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    boxShadow: `-4px 0 15px ${A(0.05)}`,
                    paddingRight: 4,
                }}
            >
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

/* ══════════════════════════════════════════════════════════════════
   ★ MAIN MOBILE EXPORT
   ══════════════════════════════════════════════════════════════════ */
export function ServiciosBifurcacionMobile(props: any) {
    const {
        bgColor,
        accentColor,
        textColor,
        numStars,
        warpSpeed,
        videoHeight,
        solarTitleSize,
        durationTitleSize,
        benefitsTitleSize,
        eligeTitleSize,
        resonanciaTitleSize,
        cardLeftTitle,
        cardLeftSubHeader,
        cardLeftBtn,
        cardRightTitle,
        cardRightSubHeader,
        cardRightBtn,
        calUrl30,
        calUrl45,
        calUrl60,
        calUrlGroup,
        calendarCropTop,
        calendarHeight,
        calendarMaskBottomPx,
        faqs,
        solarPasses,
        linkStripeMembSolar,
        timelineItems,
        benefitsGrupal,
        resSectionDesc,
        res30Name,
        res30Price,
        res45Name,
        res45Price,
        res60Name,
        res60Price,
        lugaresDisponibles,
        camaraSolarVideo,
        camaraSolarSubtitle,
        elementosClave,
    } = props
    const accent = accentColor || "#00C2FF"
    const A = (x: number) => hexToRgba(accent, x)
    const [modalMode, setModalMode] = useState<"calendly" | null>(null)
    const [activeCalendlyUrl, setActiveCalendlyUrl] = useState<string | null>(
        null
    )
    const [showFaq, setShowFaq] = useState(false)
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
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ top: 0, behavior: "smooth" })
        setTimeout(() => {
            if (el.scrollTop > 0) el.scrollTop = 0
        }, 600)
    }, [])

    const scrollToSection = useCallback(
        (ref: React.RefObject<HTMLDivElement | null>) => {
            const el = ref.current
            const c = scrollRef.current
            if (!el || !c) return
            c.scrollTo({ top: el.offsetTop - 90, behavior: "smooth" })
        },
        []
    )

    const openCalendly = (url: string) => {
        setActiveCalendlyUrl(url)
        setModalMode("calendly")
    }

    const plans = [
        {
            time: "30 min",
            name: res30Name || "Afinación Rápida",
            price: res30Price || "$66 USD",
            url: calUrl30,
        },
        {
            time: "45 min",
            name: res45Name || "Recalibración",
            price: res45Price || "$88 USD",
            url: calUrl45,
        },
        {
            time: "60 min",
            name: res60Name || "Reconfiguración Profunda",
            price: res60Price || "$111 USD",
            url: calUrl60,
        },
    ]

    return (
        <div
            style={{
                width: "100%",
                height: "100dvh",
                position: "relative",
                overflow: "hidden",
                background: bgColor || "#0B0C13",
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: MOBILE_CSS }} />
            <StarsBackground
                num={Math.floor((numStars || 90) * 0.6)}
                speed={warpSpeed}
                bgColor={bgColor}
            />
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
                    {/* ══ VISTA 1: PORTADA ══ */}
                    <motion.div
                        style={{
                            minHeight: "auto",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            paddingTop: 60,
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
                            <MobilePortalCard
                                accent={accent}
                                icon={<IconToroid color="#D4A843" size={56} />}
                                title={formatText(cardLeftTitle)}
                                subHeader={formatText(cardLeftSubHeader)}
                                btnText={formatText(cardLeftBtn)}
                                onClick={() => scrollToSection(section2Ref)}
                                lugaresDisponibles={lugaresDisponibles}
                                showLugares={true}
                                onPassesClick={() => scrollToSection(passesRef)}
                            />
                            <MobilePortalCard
                                accent={accent}
                                icon={
                                    <IconMerkabah color="#D4A843" size={56} />
                                }
                                title={formatText(cardRightTitle)}
                                subHeader={formatText(cardRightSubHeader)}
                                btnText={formatText(cardRightBtn)}
                                onClick={() => scrollToSection(section3Ref)}
                                showLugares={false}
                            />
                        </div>
                    </motion.div>
                    <div style={{ height: "12vh", minHeight: 60 }} />
                    {/* ══ VISTA 2: CÁMARA SOLAR ══ */}
                    <div ref={section2Ref}>
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                            <h2
                                style={{
                                    fontSize: solarTitleSize || 50,
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
                                    TODOS LOS MARTES VIA ZOOM
                                </div>
                            </div>
                            <ScheduleInfo accent={accent} />
                        </div>
                        <MobileExplainer
                            accent={accent}
                            videoUrl={camaraSolarVideo}
                            videoHeight={videoHeight}
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
                                fontSize: durationTitleSize || 18,
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
                        <MobileTimeline
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
                                fontSize: benefitsTitleSize || 16,
                                fontWeight: 300,
                                color: "#E6F7EF",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginBottom: 20,
                            }}
                        >
                            LO QUE VAS A EXPERIMENTAR
                        </motion.h4>
                        <MobileBenefitCards
                            items={benefitsGrupal}
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
                                    fontSize: eligeTitleSize || 20,
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
                        <MobilePassCard
                            pass={
                                (solarPasses || [])[0] || {
                                    name: "PASE POR SESIÓN",
                                    price: "$555 MXN",
                                    tag: "Opción Flexible",
                                    desc: "",
                                    features: "",
                                    btnText: "RESERVAR",
                                }
                            }
                            accent={accent}
                            isGold={false}
                            scrollRoot={scrollRef}
                            onClick={() =>
                                openCalendly(
                                    ((solarPasses || [])[0] || {})
                                        .calendlyUrl || calUrlGroup
                                )
                            }
                            lugaresDisponibles={lugaresDisponibles}
                        />
                        <NextSessionCountdown accent={accent} />
                        <div style={{ height: "20vh", minHeight: 140 }} />
                        <MobilePassCard
                            pass={
                                (solarPasses || [])[1] || {
                                    name: "MEMBRESÍA MENSUAL",
                                    price: "$2,000 MXN",
                                    tag: "Compromiso Total",
                                    desc: "",
                                    features:
                                        "Todas las Sesiones\n15% OFF en Códices (Libros) y Sesiones Privadas 1:1\nGrupo WhatsApp\nPDFs post-sesión\nGrabaciones",
                                    btnText: "ACTIVAR MEMBRESÍA",
                                }
                            }
                            accent={accent}
                            isGold={true}
                            scrollRoot={scrollRef}
                            onClick={() => {
                                const p2 = (solarPasses || [])[1] || {}
                                const link = p2.link
                                if (link && link !== "#" && link !== "")
                                    window.location.href = link
                                else if (
                                    linkStripeMembSolar &&
                                    linkStripeMembSolar !== "#"
                                )
                                    window.location.href = linkStripeMembSolar
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

                    {/* ══ VISTA 3: CÁMARA DE RESONANCIA ══ */}
                    <div ref={section3Ref}>
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                            <h2
                                style={{
                                    fontSize: resonanciaTitleSize || 24,
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
                                    SESIONES PRIVADAS ONLINE 1:1
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
                            {plans.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, root: scrollRef }}
                                    transition={{ delay: i * 0.08 }}
                                    onClick={() => openCalendly(p.url)}
                                    style={{
                                        background:
                                            "linear-gradient(145deg, rgba(20,25,35,0.95), rgba(10,15,20,0.9))",
                                        border: `1px solid ${i === 2 ? "rgba(212,168,67,0.35)" : "rgba(255,255,255,0.07)"}`,
                                        borderRadius: 14,
                                        padding: "24px 20px",
                                        textAlign: "center",
                                        position: "relative",
                                        cursor: "pointer",
                                        boxShadow:
                                            i === 2
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
                                    <GoldenButton
                                        text="AGENDAR MI SINTONÍA"
                                        subtle={true}
                                        style={{
                                            borderRadius: 10,
                                            padding: "13px 0",
                                            pointerEvents: "none",
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <MobileFloating
                onFaqClick={() => setShowFaq(true)}
                onScrollTop={scrollToTop}
                show={showFloating}
                accent={accent}
                showFaq={showFaq}
                modalOpen={!!modalMode}
            />
            <AnimatePresence>
                {modalMode && (
                    <ModalOverlay onClose={() => setModalMode(null)}>
                        {modalMode === "calendly" && activeCalendlyUrl && (
                            <div
                                style={{
                                    background:
                                        "linear-gradient(180deg, rgba(10,18,32,0.98), rgba(5,10,20,0.99))",
                                    border: `1px solid ${hexToRgba(accent, 0.25)}`,
                                    borderRadius: 20,
                                    width: "calc(100vw - 12px)",
                                    maxWidth: 420,
                                    height: "calc(100dvh - 80px)",
                                    maxHeight: calendarHeight || 780,
                                    marginTop: 24,
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    boxShadow: `0 0 30px ${hexToRgba(accent, 0.1)}, 0 20px 60px rgba(0,0,0,0.5)`,
                                }}
                            >
                                <CalendarHeader
                                    onClose={() => setModalMode(null)}
                                    rawUrl={String(activeCalendlyUrl).trim()}
                                    accent={accent}
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: calendarCropTop || -50,
                                            left: 0,
                                            right: 0,
                                            height: `calc(100% + ${Math.abs(calendarCropTop || -50)}px)`,
                                        }}
                                    >
                                        <CalendlyEmbed
                                            url={activeCalendlyUrl}
                                            accent={accent}
                                            maskBottomPx={0}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalOverlay>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showFaq && (
                    <FAQModal
                        onClose={() => setShowFaq(false)}
                        items={faqs}
                        accent={accent}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(ServiciosBifurcacionMobile, {
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
        defaultValue: 60,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        step: 0.1,
    },
    lugaresDisponibles: {
        type: ControlType.Number,
        title: "🔢 Lugares Disponibles",
        defaultValue: 12,
        min: 1,
        max: 22,
        step: 1,
    },
    videoHeight: {
        type: ControlType.Number,
        title: "🎥 Alto Video (px)",
        defaultValue: 0,
        min: 0,
        max: 1200,
        step: 10,
    },
    solarTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Cámara Solar",
        defaultValue: 30,
        min: 18,
        max: 50,
        step: 1,
    },
    durationTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Duración",
        defaultValue: 18,
        min: 12,
        max: 36,
        step: 1,
    },
    benefitsTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Beneficios",
        defaultValue: 16,
        min: 12,
        max: 30,
        step: 1,
    },
    eligeTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Elige",
        defaultValue: 20,
        min: 14,
        max: 36,
        step: 1,
    },
    resonanciaTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Resonancia",
        defaultValue: 24,
        min: 16,
        max: 40,
        step: 1,
    },
    camaraSolarVideo: {
        type: ControlType.String,
        title: "🎥 Video URL (Cloudflare R2)",
        defaultValue: "",
    },
    calendarCropTop: {
        type: ControlType.Number,
        title: "Corte Superior Calendario",
        defaultValue: -50,
        min: -200,
        max: 0,
    },
    calendarHeight: {
        type: ControlType.Number,
        title: "Altura Calendario",
        defaultValue: 700,
        min: 500,
        max: 1200,
    },
    calendarMaskBottomPx: {
        type: ControlType.Number,
        title: "Mask Inferior",
        defaultValue: 56,
        min: 0,
        max: 140,
        step: 1,
    },
    cardLeftTitle: {
        type: ControlType.String,
        title: "🟢 Grupal / Título",
        defaultValue: "SESIONES GRUPALES",
    },
    cardLeftSubHeader: {
        type: ControlType.String,
        title: "🟢 Grupal / Sub-header",
        defaultValue: "CÁMARA SOLAR",
    },
    cardLeftBtn: {
        type: ControlType.String,
        title: "🟢 Grupal / Botón",
        defaultValue: "Explorar Cámara Solar",
    },
    cardRightTitle: {
        type: ControlType.String,
        title: "🔵 Privada / Título",
        defaultValue: "SINTONÍA DE ARQUITECTO",
    },
    cardRightSubHeader: {
        type: ControlType.String,
        title: "🔵 Privada / Sub-header",
        defaultValue: "",
    },
    cardRightBtn: {
        type: ControlType.String,
        title: "🔵 Privada / Botón",
        defaultValue: "Explorar Sesión 1-1",
    },
    timelineItems: {
        type: ControlType.Array,
        title: "⏱️ Arquitectura (Timeline)",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                time: { type: ControlType.String, title: "Tiempo" },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
                descLarga: {
                    type: ControlType.String,
                    title: "Desc Larga",
                    displayTextArea: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icono",
                    options: ["anchor", "transmission", "resonance", "seal"],
                    optionTitles: [
                        "Anclaje",
                        "Transmisión",
                        "Resonancia",
                        "Sello",
                    ],
                },
            },
        },
        defaultValue: [
            {
                time: "Min 00-10",
                title: "ANCLAJE",
                desc: "Activación del campo energético.",
                descLarga: "Entramos en fase de coherencia.",
                icon: "anchor",
            },
            {
                time: "Min 10-30",
                title: "TRANSMISIÓN",
                desc: "Emisión del código de la semana.",
                descLarga: "Protocolos físicos reales.",
                icon: "transmission",
            },
            {
                time: "Min 30-50",
                title: "RESONANCIA",
                desc: "Hot Seats. Preguntas y respuestas.",
                descLarga: "La duda de uno es la medicina de todos.",
                icon: "resonance",
            },
            {
                time: "Min 50-60",
                title: "SELLO",
                desc: "Protocolo de acción semanal.",
                descLarga: "Indicación electro-energética precisa.",
                icon: "seal",
            },
        ],
    },
    benefitsGrupal: {
        type: ControlType.Array,
        title: "✦ Beneficios Grupales",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.Enum,
                    title: "Icono",
                    options: ["spiral", "prism", "antenna", "mirror"],
                    optionTitles: ["Espiral", "Prisma", "Antena", "Ojo/Espejo"],
                },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                icon: "spiral",
                title: "Resonancia Colectiva",
                desc: "Tu campo se sincroniza con el grupo.",
            },
            {
                icon: "antenna",
                title: "Acompañamiento Sostenido",
                desc: "Sostenido en una red que te impulsa.",
            },
            {
                icon: "prism",
                title: "Calibración en Tiempo Real",
                desc: "Reestructuramos desafíos en vivo.",
            },
            { icon: "mirror", title: "Enfoque Láser", desc: "" },
        ],
    },
    camaraSolarSubtitle: {
        type: ControlType.String,
        title: "☀ Solar / Subtítulo",
        displayTextArea: true,
        defaultValue:
            "Es tu estación de recarga. Todos los Martes, abrimos el portal para:",
    },
    elementosClave: {
        type: ControlType.Array,
        title: "🔑 Elementos Clave",
        maxCount: 5,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.String,
                    title: "Icono (emoji)",
                    defaultValue: "◈",
                },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                icon: "◈",
                title: "RECALIBRACIÓN DE FRECUENCIA",
                desc: "Pasamos de la alerta de supervivencia a la regeneración parasimpática.\nSilenciamos el ruido externo para escuchar tu propia voz.",
            },
            {
                icon: "◎",
                title: "Sintonizar el Poder del Toroide",
                desc: "No estás solo. La coherencia de un grupo enfocado amplifica tu capacidad de manifestación.\nLo que te toma meses integrar solo, aquí puede suceder en minutos por resonancia.",
            },
            {
                icon: "🪞",
                title: "Presenciar el Espejo Fractal",
                desc: "En el segmento de preguntas, la duda de uno es la medicina de todos.\nDesbloqueamos patrones colectivos en tiempo real.",
            },
        ],
    },
    solarPasses: {
        type: ControlType.Array,
        title: "🎫 Pases Cámara Solar",
        maxCount: 2,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Nombre" },
                price: { type: ControlType.String, title: "Precio" },
                tag: { type: ControlType.String, title: "Etiqueta" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
                features: {
                    type: ControlType.String,
                    title: "Características (1 por línea)",
                    displayTextArea: true,
                },
                btnText: { type: ControlType.String, title: "Texto Botón" },
                calendlyUrl: {
                    type: ControlType.String,
                    title: "Calendly URL",
                },
                link: {
                    type: ControlType.String,
                    title: "Link externo (Stripe)",
                },
            },
        },
        defaultValue: [
            {
                name: "PASE POR SESIÓN",
                price: "$555 MXN",
                tag: "Opción Flexible",
                desc: "Flexibilidad total.",
                features:
                    "1 sesión grupal en vivo\nGrabación incluida\nFlexibilidad total\nReserva cuando lo sientas",
                btnText: "RESERVAR MI LUGAR",
                calendlyUrl: "",
                link: "",
            },
            {
                name: "MEMBRESÍA MENSUAL",
                price: "$2,000 MXN / mes",
                tag: "Compromiso Total",
                desc: "Tu lugar asegurado siempre.",
                features:
                    "Todas las Sesiones del mes\n15% OFF en Códices (Libros) y Sesiones Privadas 1:1\nGrupo Privado WhatsApp\nPDFs post-sesión\nGrabación de sesiones",
                btnText: "ACTIVAR MEMBRESÍA",
                calendlyUrl: "",
                link: "#",
            },
        ],
    },
    linkStripeMembSolar: {
        type: ControlType.String,
        title: "☀ Solar / Link Stripe",
        defaultValue: "#",
    },
    resSectionDesc: {
        type: ControlType.String,
        title: "🔮 Resonancia / Descripción",
        defaultValue: "Precisión Láser para tu Geometría Personal.",
    },
    res30Name: {
        type: ControlType.String,
        title: "🔮 30min / Nombre",
        defaultValue: "Afinación Rápida",
    },
    res30Price: {
        type: ControlType.String,
        title: "🔮 30min / Precio",
        defaultValue: "$66 USD",
    },
    res45Name: {
        type: ControlType.String,
        title: "🔮 45min / Nombre",
        defaultValue: "Recalibración",
    },
    res45Price: {
        type: ControlType.String,
        title: "🔮 45min / Precio",
        defaultValue: "$88 USD",
    },
    res60Name: {
        type: ControlType.String,
        title: "🔮 60min / Nombre",
        defaultValue: "Reconfiguración Profunda",
    },
    res60Price: {
        type: ControlType.String,
        title: "🔮 60min / Precio",
        defaultValue: "$111 USD",
    },
    calUrlGroup: {
        type: ControlType.String,
        title: "Embeds / Pase Grupal",
        defaultValue: "https://calendly.com/zakhaar/camara-solar-60-minutos",
    },
    calUrl30: {
        type: ControlType.String,
        title: "Embeds / 30 min",
        defaultValue: "https://calendly.com/zakhaar/15min",
    },
    calUrl45: {
        type: ControlType.String,
        title: "Embeds / 45 min",
        defaultValue: "https://calendly.com/zakhaar/30min",
    },
    calUrl60: {
        type: ControlType.String,
        title: "Embeds / 60 min",
        defaultValue: "https://calendly.com/zakhaar/60min",
    },
    faqs: {
        type: ControlType.Array,
        title: "❓ FAQs",
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
                q: "¿Cómo aprovecho al máximo mi sesión?",
                a: "Espacio silencioso, buena conexión y audífonos.",
            },
            {
                q: "¿Quedan grabadas las sesiones?",
                a: "Las Cámaras Solares sí se graban. Las 1:1 NO.",
            },
            {
                q: "¿Diferencia entre Solar y Resonancia?",
                a: "Solar es afinación colectiva. Resonancia es personalizada.",
            },
            {
                q: "¿Qué pasa si no puedo asistir?",
                a: "Reagenda 1:1 hasta 24h antes. Grupales incluyen grabación.",
            },
        ],
    },
})
