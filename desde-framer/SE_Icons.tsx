// SE_Icons.tsx v1.0
// Todos los íconos SVG del split de Sesiones (sello SE_).
// Default export = ghost component con Object.assign de todos los íconos
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidores: SE_Mobile, SE_Desktop. Patrón de import:
//   import Icons from "./SE_Icons.tsx"
//   const { TimelineIcon, IconToroid, BENEFIT_ICON_MAP, VIP_ICONS } = Icons

import * as React from "react"
import { motion } from "framer-motion"

/* ═══ TIMELINE ICONS ═══ */
const TimelineIcon = ({
    type,
    color,
}: {
    type: string
    color: string
}) => {
    const sP = {
        stroke: color,
        strokeWidth: 1.5,
        fill: "none",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    switch (type) {
        case "anchor":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" {...sP}>
                    <circle cx="12" cy="5" r="3" />
                    <line x1="12" y1="22" x2="12" y2="8" />
                    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                </svg>
            )
        case "transmission":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M7 2 C7 2, 5 5.5, 7 8 C9 10.5, 15 10.5, 17 8 C19 5.5, 17 2, 17 2"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M7 8 C7 8, 5 11.5, 7 14 C9 16.5, 15 16.5, 17 14 C19 11.5, 17 8, 17 8"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M7 14 C7 14, 5 17.5, 7 20 C9 22.5, 15 22.5, 17 20 C19 17.5, 17 14, 17 14"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {[5, 8, 11, 14, 17, 20].map((y, i) => (
                        <line
                            key={i}
                            x1={i % 2 === 0 ? "8.5" : "7.2"}
                            y1={y}
                            x2={i % 2 === 0 ? "15.5" : "16.8"}
                            y2={y}
                            stroke={color}
                            strokeWidth="1"
                            opacity="0.5"
                            strokeLinecap="round"
                        />
                    ))}
                    {[5, 11, 17].map((y, i) => (
                        <circle
                            key={`c${i}`}
                            cx="12"
                            cy={y}
                            r="1"
                            fill={color}
                            opacity="0.4"
                        />
                    ))}
                </svg>
            )
        case "resonance":
            return (
                <svg width="34" height="34" viewBox="0 0 24 24" {...sP}>
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
                <svg width="34" height="34" viewBox="0 0 24 24" {...sP}>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        default:
            return null
    }
}

/* ═══ HERO ICONS (toroid + merkabah) ═══ */
const IconToroid = ({
    color = "#D4A843",
    size = 120,
}: {
    color?: string
    size?: number
}) => {
    const rings = [
        { r: 40, o: 0.7, w: 1.2 },
        { r: 33, o: 0.5, w: 0.9 },
        { r: 26, o: 0.35, w: 0.7 },
        { r: 19, o: 0.25, w: 0.5 },
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
                {rings.map((r, i) => (
                    <ellipse
                        key={i}
                        cx="60"
                        cy="60"
                        rx={r.r}
                        ry={r.r * 0.52}
                        stroke={color}
                        strokeWidth={r.w}
                        opacity={r.o}
                    />
                ))}
                {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI,
                        rx = 18,
                        ry = 40,
                        cos = Math.cos(angle),
                        sin = Math.sin(angle),
                        pts: string[] = []
                    for (let t = 0; t <= 24; t++) {
                        const a = (t / 24) * Math.PI * 2,
                            px = rx * Math.cos(a),
                            py = ry * Math.sin(a)
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

const IconMerkabah = ({
    color = "#D4A843",
    size = 120,
}: {
    color?: string
    size?: number
}) => {
    const cx2 = 60,
        cy2 = 60,
        R = 42
    const upTri = [0, 1, 2].map((i) => {
        const a = ((i * 120 - 90) * Math.PI) / 180
        return { x: cx2 + R * Math.cos(a), y: cy2 + R * Math.sin(a) }
    })
    const downTri = [0, 1, 2].map((i) => {
        const a = ((i * 120 + 90) * Math.PI) / 180
        return { x: cx2 + R * Math.cos(a), y: cy2 + R * Math.sin(a) }
    })
    const Ri = R * 0.52
    const innerUp = [0, 1, 2].map((i) => {
        const a = ((i * 120 - 90) * Math.PI) / 180
        return { x: cx2 + Ri * Math.cos(a), y: cy2 + Ri * Math.sin(a) }
    })
    const innerDown = [0, 1, 2].map((i) => {
        const a = ((i * 120 + 90) * Math.PI) / 180
        return { x: cx2 + Ri * Math.cos(a), y: cy2 + Ri * Math.sin(a) }
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

/* ═══ BENEFIT ICONS (4 micro-glyphs para los cards de "Lo que vas a experimentar") ═══ */
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

/* ═══ VIP ICONS (6 íconos de privilegios — Inmersión Solar) ═══ */
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
    VIPIconWhatsApp,
    VIPIconPDF,
    VIPIconRecording,
    VIPIconBook,
    VIPIconSession,
]

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function SE_IconsShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
SE_IconsShell.displayName = "SE_Icons"

const Icons = Object.assign(SE_IconsShell, {
    TimelineIcon,
    IconToroid,
    IconMerkabah,
    BIconSpiral,
    BIconPrism,
    BIconAntenna,
    BIconMirror,
    BENEFIT_ICON_MAP,
    VIPIconCalendar,
    VIPIconBook,
    VIPIconSession,
    VIPIconWhatsApp,
    VIPIconPDF,
    VIPIconRecording,
    VIP_ICONS,
})

export default Icons
