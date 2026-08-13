// EV_Icons.tsx v2.11
// v2.11 — IMod (Sintonizador) usa <path> en vez de <line> para
// las dos líneas de referencia. La hipótesis: el TS interno de
// Framer puede estar tratando <line> como elemento desconocido en
// algunos contextos y eso disparaba waitForComponentLoader timeout.
// Todas las primitivas SVG ahora son <path>, <circle>, <ellipse>,
// <polygon>, <rect> — coincide con los demás iconos del archivo.
// EV_Icons.tsx v2.10
// v2.10 — Removemos IModRingsAlt completamente para descartar si
// era la causa del waitForComponentLoader timeout. Si Diego decide
// volver a "Anillos de Ajuste", se rescata desde git history
// (commits 3e9000e o anteriores).
// EV_Icons.tsx v2.9
// v2.9 — IMod (Sintonizador) reemplaza strokeOpacity inline por
// <g opacity>. El TS de Framer parecía rechazar strokeOpacity
// como atributo válido en SVG primitives y disparaba
// waitForComponentLoader timeout en cada deploy.
// EV_Icons.tsx v2.7
// v2.7 — Probamos el "Sintonizador de Frecuencia" (Frequency
// Aligner) en IMod: línea horizontal sutil (estado base), onda
// sinoidal centrada (peak arriba + valley abajo) y línea vertical
// fina cruzando el centro (la marca de alineación precisa). Muy
// Cyber-Zen, juega con el minimalismo de la barra inferior. El
// glyph anterior "Anillos de Ajuste" queda guardado como
// IModRingsAlt (no se usa pero se preserva para A/B futuro).
// EV_Icons.tsx v2.6
// v2.6 — Intercambio + nuevo glyph para Calibración:
//  · IDecoder ahora usa el "Bisturí de Foco" (los 4 corchetes
//    apuntando al punto central) — más fino y preciso, encaja mejor
//    con la metáfora de descomponer materia.
//  · IMod estrena "Anillos de Ajuste" (Adjustment Rings): tres
//    elipses concéntricas isométricas: las dos exteriores
//    fragmentadas (dasharray), la central sólida con dot. Comunica
//    alineación de cuerpos densos exteriores con el núcleo solar
//    central. Más sofisticado, hermana visual de Códices/Holoteca.
// EV_Icons.tsx v2.5
// v2.5 — IMod rediseñado como "Bisturí de Foco": cuatro corchetes
// angulares apuntando al punto central + dot central. Reemplaza la
// cuadrícula de 4 cuadros. Comunica precisión quirúrgica.
// EV_Icons.tsx v2.4
// v2.4 — IHoloteca rediseñado como Tesseracto: tres rombos isométricos
// apilados con opacidad creciente (top etéreo → base definida). El
// glyph evoca la estructura multidimensional de la Holoteca y el
// patrón visual de "capas holográficas" Cyber-Zen.
// Glifos del Escáner Vibracional + íconos de la nueva nav unificada
// (IEscaner, IHoloteca, INucleo). Default export es función-componente
// (devuelve null) con todos los iconos y helpers adjuntos como
// propiedades — Framer espera componente React, no objeto plano.
import React from "react"
import Shared from "./EV_Shared.tsx"
const { hx } = Shared

/* ═══ UI ICONS ═══ */
const IBack = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
)
const IHw = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
    </svg>
)
const IMn = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
)
const IEm = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
)
const IFi = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
        <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" />
    </svg>
)
const IVec = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v10l7 4" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)
const IOrb = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" opacity="0.3" />
        <circle cx="19" cy="8" r="2" />
        <circle cx="5" cy="16" r="2" />
        <circle cx="18" cy="18" r="1.5" />
    </svg>
)
const IRadar = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
    >
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
)
/* IMod v4 — Sintonizador de Frecuencia (Frequency Aligner): línea
   horizontal sutil de base + onda sinoidal centrada (peak arriba +
   valley abajo, una curva perfecta) + línea vertical muy fina
   cruzando el centro como marca de alineación. Comunica
   sintonización precisa al estilo Cyber-Zen. Las líneas de
   referencia van envueltas en <g opacity> para evitar
   strokeOpacity inline (Framer TS lo trataba como inválido). */
const IMod = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <g opacity="0.4">
            <path d="M2 12 L22 12" strokeWidth="1" />
        </g>
        <path d="M7 12 Q9.5 6 12 12 T17 12" strokeWidth="1.5" />
        <g opacity="0.65">
            <path d="M12 4 L12 20" strokeWidth="0.8" />
        </g>
    </svg>
)
const IRecIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 20L7 12L12 15L17 6L21 10" />
        <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
)
const ICamera = () => (
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
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
)
/* IDecoder v2 — Bisturí de Foco (heredado del IMod v2): cuatro
   corchetes angulares apuntando al punto central + dot central.
   Comunica precisión: "este es el punto exacto de intervención"
   — encaja con la metáfora del Decodificador de Materia
   (focalizar y descomponer un envase). */
const IDecoder = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* Corchetes TL, TR, BL, BR */}
        <path d="M4 9 L4 4 L9 4" />
        <path d="M15 4 L20 4 L20 9" />
        <path d="M4 15 L4 20 L9 20" />
        <path d="M15 20 L20 20 L20 15" />
        {/* Punto central — el blanco de la mira */}
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
)
const CSvg = ({ color = "rgba(0,229,255,0.5)" }: { color?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M2 8 L2 2 L8 2" />
    </svg>
)
const IEscaner = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="6" opacity="0.7" />
        <circle cx="12" cy="12" r="10" opacity="0.4" />
        <path d="M12 2 L12 4" opacity="0.85" />
        <path d="M12 20 L12 22" opacity="0.85" />
    </svg>
)
/* IHoloteca v2 — Tesseracto: tres rombos isométricos apilados.
   La Holoteca es una estructura multidimensional que contiene 4
   dimensiones (Códices, Meditaciones, Códigos Fuente, Fragmentos).
   El glyph evoca capas de un holograma, con profundidad creciente
   hacia atrás (top más etéreo, base más definida). */
const IHoloteca = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* Capa superior — más etérea (la dimensión más lejana) */}
        <path d="M12 4 L20 8 L12 12 L4 8 Z" opacity="0.45" />
        {/* Capa media — núcleo del tesseracto */}
        <path d="M12 10 L20 14 L12 18 L4 14 Z" opacity="0.7" />
        {/* Capa base — la más definida y densa */}
        <path d="M12 14 L20 18 L12 22 L4 18 Z" opacity="1" />
    </svg>
)
const INucleo = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" />
    </svg>
)

/* ═══ PILLAR HELPERS ═══ */
function getPillarIcon(pilar: string) {
    const m: Record<string, React.ReactNode> = {
        FISICO: <IHw />,
        MENTAL: <IMn />,
        EMOCIONAL: <IEm />,
        FINANCIERO: <IFi />,
        VECTOR: <IVec />,
        ORBITA: <IOrb />,
    }
    return m[pilar] || <IRadar />
}
function getPillarShort(pilar: string) {
    const m: Record<string, string> = {
        FISICO: "HARDWARE",
        MENTAL: "PROCESADOR",
        EMOCIONAL: "MOTOR",
        FINANCIERO: "GRAVEDAD",
        VECTOR: "VECTOR",
        ORBITA: "ÓRBITA",
    }
    return m[pilar] || pilar
}
function getPillarLabel(pilar: string) {
    const m: Record<string, string> = {
        FISICO: "Hardware Físico",
        MENTAL: "Procesador Mental",
        EMOCIONAL: "Motor Emocional",
        FINANCIERO: "Gravedad Financiera",
        VECTOR: "Vector de Expansión",
        ORBITA: "Órbita Relacional",
    }
    return m[pilar] || pilar
}

/* ═══ MONUMENTAL SVGs — 6 frescos cyan-gold por pilar ═══ */
function MonHardware({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.95),
        c2 = hx(ac, 0.65),
        c3 = hx(ac, 0.4)
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 5s ease-in-out infinite",
            }}
        >
            <defs>
                <filter id="mhg">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
                <linearGradient id="mhGr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ac} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={ac} stopOpacity="0" />
                </linearGradient>
            </defs>
            <ellipse
                cx="100"
                cy="100"
                rx="90"
                ry="95"
                fill="none"
                stroke={c3}
                strokeWidth="1.6"
                style={{
                    animation: "esc-mon-pulse-ring 4s ease-in-out infinite",
                }}
            />
            <ellipse
                cx="100"
                cy="100"
                rx="80"
                ry="88"
                fill="none"
                stroke={c2}
                strokeWidth="1.2"
            />
            <line
                x1="100"
                y1="15"
                x2="100"
                y2="185"
                stroke={c}
                strokeWidth="3"
                filter="url(#mhg)"
                opacity="0.7"
            />
            <line
                x1="100"
                y1="15"
                x2="100"
                y2="185"
                stroke={c}
                strokeWidth="1.8"
            />
            <path
                d="M100,20 C130,40 70,60 100,80 C130,100 70,120 100,140 C130,160 70,180 100,190"
                fill="none"
                stroke={c}
                strokeWidth="1.6"
                opacity="0.7"
            />
            <path
                d="M100,20 C70,40 130,60 100,80 C70,100 130,120 100,140 C70,160 130,180 100,190"
                fill="none"
                stroke={c}
                strokeWidth="1.6"
                opacity="0.7"
            />
            {[35, 55, 75, 100, 125, 145, 165].map((y, i) => {
                const w = 25 + Math.sin(i * 0.9) * 15
                return (
                    <g key={i}>
                        <line
                            x1={100 - w}
                            y1={y}
                            x2={100 + w}
                            y2={y}
                            stroke={c2}
                            strokeWidth="1.4"
                        />
                        <circle
                            cx={100 - w}
                            cy={y}
                            r="2.6"
                            fill={ac}
                            opacity="0.7"
                        />
                        <circle
                            cx={100 + w}
                            cy={y}
                            r="2.6"
                            fill={ac}
                            opacity="0.7"
                        />
                    </g>
                )
            })}
            <path
                d="M60,35 L45,50 L45,80 L55,95"
                fill="none"
                stroke={c3}
                strokeWidth="1.2"
                strokeDasharray="5 4"
            />
            <path
                d="M140,35 L155,50 L155,80 L145,95"
                fill="none"
                stroke={c3}
                strokeWidth="1.2"
                strokeDasharray="5 4"
            />
            <path
                d="M55,105 L40,120 L40,155 L60,165"
                fill="none"
                stroke={c3}
                strokeWidth="1.2"
                strokeDasharray="5 4"
            />
            <path
                d="M145,105 L160,120 L160,155 L140,165"
                fill="none"
                stroke={c3}
                strokeWidth="1.2"
                strokeDasharray="5 4"
            />
            {[35, 75, 125, 165].map((y, i) => (
                <circle
                    key={`en${i}`}
                    cx="100"
                    cy={y}
                    r="4.5"
                    fill="rgba(0,0,0,0.6)"
                    stroke={ac}
                    strokeWidth="1.8"
                    style={{
                        animation: `esc-vertex-pulse ${2.5 + i * 0.3}s ease-in-out infinite`,
                    }}
                />
            ))}
            <polygon
                points="100,8 108,18 92,18"
                fill="none"
                stroke={c}
                strokeWidth="1.6"
            />
            <polygon
                points="100,192 108,182 92,182"
                fill="none"
                stroke={c}
                strokeWidth="1.6"
            />
            <ellipse
                cx="100"
                cy="100"
                rx="12"
                ry="20"
                fill={ac}
                opacity="0.06"
                filter="url(#mhg)"
            />
        </svg>
    )
}
function MonMental({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.95),
        c2 = hx(ac, 0.65),
        c3 = hx(ac, 0.4)
    const hexPts = (cx: number, cy: number, r: number) =>
        Array.from({ length: 6 }, (_, i) => {
            const a = Math.PI / 6 + (i * Math.PI) / 3
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        }).join(" ")
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 5.5s ease-in-out infinite",
            }}
        >
            <defs>
                <filter id="mmg">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
            </defs>
            <polygon
                points={hexPts(100, 100, 88)}
                fill="none"
                stroke={c3}
                strokeWidth="1.6"
                style={{
                    animation: "esc-mon-pulse-ring 5s ease-in-out infinite",
                }}
            />
            <g
                style={{
                    animation: "esc-mon-spin 60s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <polygon
                    points={hexPts(100, 100, 70)}
                    fill="none"
                    stroke={c2}
                    strokeWidth="1.4"
                />
            </g>
            <g
                style={{
                    animation: "esc-mon-counterspin 45s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <polygon
                    points={hexPts(100, 100, 52)}
                    fill="none"
                    stroke={c}
                    strokeWidth="1.2"
                    opacity="0.75"
                />
            </g>
            <g
                style={{
                    animation: "esc-mon-spin 30s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <polygon
                    points={hexPts(100, 100, 34)}
                    fill="none"
                    stroke={c}
                    strokeWidth="1.6"
                    opacity="0.85"
                />
            </g>
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180
                return (
                    <line
                        key={i}
                        x1="100"
                        y1="100"
                        x2={100 + 85 * Math.cos(a)}
                        y2={100 + 85 * Math.sin(a)}
                        stroke={c3}
                        strokeWidth="1"
                        strokeDasharray="3 5"
                    />
                )
            })}
            {Array.from({ length: 6 }, (_, i) => {
                const a = Math.PI / 6 + (i * Math.PI) / 3
                return [52, 70, 88].map((r, ri) => {
                    const x = 100 + r * Math.cos(a),
                        y = 100 + r * Math.sin(a)
                    return (
                        <circle
                            key={`n${i}${ri}`}
                            cx={x}
                            cy={y}
                            r={ri === 0 ? "3" : "2"}
                            fill={ri === 0 ? ac : "none"}
                            stroke={ac}
                            strokeWidth="1.2"
                            opacity={0.55 + ri * 0.12}
                        />
                    )
                })
            }).flat()}
            <g
                style={{
                    animation: "esc-mon-counterspin 20s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <polygon
                    points="100,80 117,110 83,110"
                    fill="none"
                    stroke={c}
                    strokeWidth="1.8"
                    opacity="0.75"
                />
            </g>
            <circle
                cx="100"
                cy="100"
                r="14"
                fill="rgba(0,0,0,0.5)"
                stroke={c}
                strokeWidth="2"
            />
            <circle
                cx="100"
                cy="100"
                r="8"
                fill="none"
                stroke={ac}
                strokeWidth="1.2"
                opacity="0.85"
            />
            <circle
                cx="100"
                cy="100"
                r="4"
                fill={ac}
                opacity="0.75"
                style={{
                    animation: "esc-vertex-pulse 2s ease-in-out infinite",
                }}
            />
            {Array.from({ length: 24 }, (_, i) => {
                const a = (i * 15 * Math.PI) / 180
                return (
                    <line
                        key={`t${i}`}
                        x1={100 + 88 * Math.cos(a)}
                        y1={100 + 88 * Math.sin(a)}
                        x2={100 + 93 * Math.cos(a)}
                        y2={100 + 93 * Math.sin(a)}
                        stroke={c2}
                        strokeWidth={i % 6 === 0 ? "1.8" : "0.7"}
                    />
                )
            })}
        </svg>
    )
}
function MonEmocional({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.95),
        c2 = hx(ac, 0.65),
        c3 = hx(ac, 0.4)
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 4.5s ease-in-out infinite",
            }}
        >
            <defs>
                <filter id="meg">
                    <feGaussianBlur stdDeviation="4" />
                </filter>
                <radialGradient id="mehg">
                    <stop offset="0%" stopColor={ac} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={ac} stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="100" cy="95" r="80" fill="url(#mehg)" />
            <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke={c3}
                strokeWidth="1.4"
                strokeDasharray="5 9"
            />
            <path
                d="M100,145 C70,118 30,90 30,65 A35,35 0 0,1 100,55 A35,35 0 0,1 170,65 C170,90 130,118 100,145Z"
                fill="none"
                stroke={c}
                strokeWidth="2.4"
                opacity="0.85"
            />
            <path
                d="M100,130 C78,110 48,88 48,70 A26,26 0 0,1 100,64 A26,26 0 0,1 152,70 C152,88 122,110 100,130Z"
                fill="none"
                stroke={c}
                strokeWidth="1.6"
                opacity="0.6"
            />
            <circle
                cx="100"
                cy="85"
                r="20"
                fill="none"
                stroke={c2}
                strokeWidth="1.2"
                opacity="0.7"
                style={{
                    animation: "esc-mon-pulse-ring 3s ease-in-out infinite",
                }}
            />
            <circle
                cx="100"
                cy="85"
                r="35"
                fill="none"
                stroke={c2}
                strokeWidth="0.9"
                opacity="0.5"
                style={{
                    animation: "esc-mon-pulse-ring 3.5s ease-in-out infinite",
                }}
            />
            <circle
                cx="100"
                cy="85"
                r="52"
                fill="none"
                stroke={c3}
                strokeWidth="0.8"
                opacity="0.35"
                style={{
                    animation: "esc-mon-pulse-ring 4s ease-in-out infinite",
                }}
            />
            <circle
                cx="100"
                cy="85"
                r="12"
                fill="rgba(0,0,0,0.4)"
                stroke={c}
                strokeWidth="1.8"
            />
            <circle
                cx="100"
                cy="85"
                r="6"
                fill={ac}
                opacity="0.25"
                filter="url(#meg)"
            />
            <circle
                cx="100"
                cy="85"
                r="3.5"
                fill={ac}
                opacity="0.75"
                style={{
                    animation: "esc-vertex-pulse 2.5s ease-in-out infinite",
                }}
            />
            <line
                x1="100"
                y1="55"
                x2="100"
                y2="145"
                stroke={c2}
                strokeWidth="1"
                strokeDasharray="3 5"
            />
            <path
                d="M75,68 Q100,40 125,68"
                fill="none"
                stroke={c2}
                strokeWidth="1.2"
                opacity="0.55"
            />
            <path
                d="M60,85 Q100,155 140,85"
                fill="none"
                stroke={c2}
                strokeWidth="1"
                opacity="0.4"
            />
        </svg>
    )
}
function MonFinanciero({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.8),
        c2 = hx(ac, 0.45),
        c3 = hx(ac, 0.2),
        g = "rgba(200,164,78,"
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 5s ease-in-out infinite",
            }}
        >
            <defs>
                <filter id="mfg">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
            </defs>
            <ellipse
                cx="100"
                cy="140"
                rx="80"
                ry="20"
                fill="none"
                stroke={c3}
                strokeWidth="0.8"
                style={{
                    animation: "esc-mon-pulse-ring 3.5s ease-in-out infinite",
                }}
            />
            <ellipse
                cx="100"
                cy="148"
                rx="70"
                ry="16"
                fill="none"
                stroke={c3}
                strokeWidth="0.5"
            />
            <ellipse
                cx="100"
                cy="155"
                rx="55"
                ry="12"
                fill="none"
                stroke={c3}
                strokeWidth="0.5"
            />
            <polygon
                points="100,15 160,75 100,155 40,75"
                fill="none"
                stroke={c}
                strokeWidth="1.2"
            />
            <polygon
                points="100,15 160,75 100,155 40,75"
                fill={ac}
                opacity="0.03"
            />
            <line
                x1="100"
                y1="15"
                x2="100"
                y2="155"
                stroke={c2}
                strokeWidth="0.5"
            />
            <line
                x1="40"
                y1="75"
                x2="160"
                y2="75"
                stroke={c2}
                strokeWidth="0.5"
            />
            <line
                x1="100"
                y1="15"
                x2="70"
                y2="115"
                stroke={c3}
                strokeWidth="0.4"
            />
            <line
                x1="100"
                y1="15"
                x2="130"
                y2="115"
                stroke={c3}
                strokeWidth="0.4"
            />
            <line
                x1="40"
                y1="75"
                x2="130"
                y2="115"
                stroke={c3}
                strokeWidth="0.3"
            />
            <line
                x1="160"
                y1="75"
                x2="70"
                y2="115"
                stroke={c3}
                strokeWidth="0.3"
            />
            <g
                style={{
                    animation: "esc-mon-counterspin 40s linear infinite",
                    transformOrigin: "100px 85px",
                }}
            >
                <polygon
                    points="100,45 135,75 100,120 65,75"
                    fill="none"
                    stroke={`${g}0.4)`}
                    strokeWidth="0.8"
                />
            </g>
            <polygon
                points="100,60 118,80 100,105 82,80"
                fill="none"
                stroke={`${g}0.5)`}
                strokeWidth="0.6"
            />
            <polygon points="100,60 118,80 100,105 82,80" fill={`${g}0.04)`} />
            {[0, 1, 2].map((i) => (
                <line
                    key={`ec${i}`}
                    x1={95 + i * 5}
                    y1={8 - i * 2}
                    x2={100}
                    y2={15}
                    stroke={c2}
                    strokeWidth="0.4"
                    strokeDasharray="2 3"
                />
            ))}
            <circle
                cx="100"
                cy="80"
                r="6"
                fill="rgba(0,0,0,0.5)"
                stroke={`${g}0.5)`}
                strokeWidth="0.8"
            />
            <circle
                cx="100"
                cy="80"
                r="3"
                fill={`${g}0.4)`}
                style={{
                    animation: "esc-vertex-pulse 2.5s ease-in-out infinite",
                }}
            />
            <g
                style={{
                    animation: "esc-mon-spin 25s linear infinite",
                    transformOrigin: "100px 80px",
                }}
            >
                <ellipse
                    cx="100"
                    cy="80"
                    rx="30"
                    ry="8"
                    fill="none"
                    stroke={c2}
                    strokeWidth="0.4"
                />
            </g>
        </svg>
    )
}
function MonVector({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.95),
        c2 = hx(ac, 0.65),
        c3 = hx(ac, 0.4)
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 5s ease-in-out infinite",
            }}
        >
            <defs>
                <marker
                    id="mvArrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
                </marker>
            </defs>
            <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke={c3}
                strokeWidth="2"
                strokeDasharray="6 8"
            />
            <circle
                cx="100"
                cy="100"
                r="50"
                fill="none"
                stroke={c3}
                strokeWidth="1.4"
            />
            <line
                x1="100"
                y1="100"
                x2="100"
                y2="25"
                stroke={c}
                strokeWidth="3"
                markerEnd="url(#mvArrow)"
            />
            <line
                x1="100"
                y1="100"
                x2="155"
                y2="60"
                stroke={c2}
                strokeWidth="1.6"
                strokeDasharray="4 5"
            />
            <line
                x1="100"
                y1="100"
                x2="45"
                y2="140"
                stroke={c2}
                strokeWidth="1.6"
                strokeDasharray="4 5"
            />
            <circle
                cx="100"
                cy="100"
                r="8"
                fill="rgba(0,0,0,0.5)"
                stroke={c}
                strokeWidth="1.8"
            />
            <circle
                cx="100"
                cy="100"
                r="3"
                fill={ac}
                opacity="0.4"
                style={{
                    animation: "esc-vertex-pulse 2s ease-in-out infinite",
                }}
            />
            <circle
                cx="100"
                cy="25"
                r="5"
                fill={ac}
                opacity="0.3"
                style={{
                    animation: "esc-vertex-pulse 2.5s ease-in-out infinite",
                }}
            />
            <g
                style={{
                    animation: "esc-mon-spin 20s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <circle cx="135" cy="42" r="3" fill={c2} />
                <circle cx="65" cy="158" r="2" fill={c3} />
            </g>
        </svg>
    )
}
function MonOrbita({ s, ac }: { s: number; ac: string }) {
    const c = hx(ac, 0.95),
        c2 = hx(ac, 0.65),
        c3 = hx(ac, 0.4)
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 200 200"
            style={{
                overflow: "visible",
                animation: "esc-mon-breathe 5s ease-in-out infinite",
            }}
        >
            <circle
                cx="100"
                cy="100"
                r="8"
                fill="rgba(0,0,0,0.5)"
                stroke={c}
                strokeWidth="2"
            />
            <circle
                cx="100"
                cy="100"
                r="3"
                fill={ac}
                opacity="0.7"
                style={{
                    animation: "esc-vertex-pulse 2s ease-in-out infinite",
                }}
            />
            <ellipse
                cx="100"
                cy="100"
                rx="60"
                ry="25"
                fill="none"
                stroke={c2}
                strokeWidth="1.8"
                transform="rotate(-20 100 100)"
            />
            <ellipse
                cx="100"
                cy="100"
                rx="70"
                ry="30"
                fill="none"
                stroke={c3}
                strokeWidth="1.8"
                transform="rotate(35 100 100)"
            />
            <ellipse
                cx="100"
                cy="100"
                rx="80"
                ry="20"
                fill="none"
                stroke={c3}
                strokeWidth="1.6"
                transform="rotate(-55 100 100)"
            />
            <g
                style={{
                    animation: "esc-mon-spin 12s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <circle cx="158" cy="90" r="6" fill={c2} opacity="0.95" />
            </g>
            <g
                style={{
                    animation: "esc-mon-spin 18s linear reverse infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <circle cx="38" cy="108" r="5" fill={c2} opacity="0.7" />
            </g>
            <g
                style={{
                    animation: "esc-mon-spin 25s linear infinite",
                    transformOrigin: "100px 100px",
                }}
            >
                <circle cx="170" cy="120" r="4" fill={c3} opacity="0.85" />
            </g>
            <circle
                cx="100"
                cy="100"
                r="45"
                fill="none"
                stroke={c3}
                strokeWidth="1.4"
                strokeDasharray="3 6"
            />
        </svg>
    )
}

function EVIcons(_props: any) {
    return (
        <div
            style={{ display: "none" }}
            data-rsv-icons="EV_Icons"
            aria-hidden="true"
        />
    )
}
const Icons = Object.assign(EVIcons, {
    IBack,
    IHw,
    IMn,
    IEm,
    IFi,
    IVec,
    IOrb,
    IRadar,
    IMod,
    IRecIcon,
    ICamera,
    IDecoder,
    IEscaner,
    IHoloteca,
    INucleo,
    CSvg,
    MonHardware,
    MonMental,
    MonEmocional,
    MonFinanciero,
    MonVector,
    MonOrbita,
    getPillarIcon,
    getPillarShort,
    getPillarLabel,
})
export default Icons
