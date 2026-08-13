// HoloSVG.tsx
// SVG fallback + overlay UI (scanner rings, crosshair, subtle scanlines)

import * as React from "react"

export type HoloSVGProps = {
    accentColor: string
    bgColor: string
    scanlineDensity: number // 0..3
    glow: number // 0..3
    pulseKey: number // increment to retrigger CSS pulse animation
    onDrop?: (e: React.DragEvent) => void
    onDragOver?: (e: React.DragEvent) => void
    style?: React.CSSProperties
}

export const HoloSVG: React.FC<HoloSVGProps> = ({
    accentColor,
    bgColor,
    scanlineDensity,
    glow,
    pulseKey,
    onDrop,
    onDragOver,
    style,
}) => {
    const lines = Math.floor(120 * scanlineDensity + 40)

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: bgColor,
                overflow: "hidden",
                borderRadius: 12,
                ...style,
            }}
            aria-label="Hologram SVG fallback"
        >
            {/* Scanlines */}
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0 }}
            >
                {Array.from({ length: lines }).map((_, i) => (
                    <line
                        key={i}
                        x1="0%"
                        x2="100%"
                        y1={`${(i / lines) * 100}%`}
                        y2={`${(i / lines) * 100}%`}
                        stroke={accentColor}
                        opacity={0.05}
                        strokeWidth={i % 5 === 0 ? 1 : 0.5}
                    />
                ))}
            </svg>

            {/* Stylized wireframe humanoid (simple geometry strokes) */}
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0 }}
            >
                <g
                    transform="translate(50%, 50%)"
                    style={{
                        filter: `drop-shadow(0 0 ${6 + glow * 6}px ${accentColor})`,
                    }}
                    stroke={accentColor}
                    strokeWidth={1.5}
                    fill="none"
                    opacity={0.9}
                >
                    {/* Head */}
                    <circle cx="0" cy="-140" r="28" />
                    <line x1="0" y1="-112" x2="0" y2="-60" />
                    {/* Torso */}
                    <rect x="-24" y="-60" width="48" height="88" rx="10" />
                    {/* Arms */}
                    <polyline points="-24,-46 -58,-12 -32,12" />
                    <polyline points="24,-46 58,-12 32,12" />
                    {/* Pelvis + legs */}
                    <line x1="0" y1="28" x2="-18" y2="64" />
                    <line x1="0" y1="28" x2="18" y2="64" />
                    <line x1="-18" y1="64" x2="-14" y2="120" />
                    <line x1="18" y1="64" x2="14" y2="120" />
                    {/* Star points circling */}
                    {Array.from({ length: 36 }).map((_, i) => {
                        const a = (i / 36) * Math.PI * 2
                        const r = 150 + 10 * Math.sin(i * 1.7)
                        const x = Math.cos(a) * r
                        const y = Math.sin(a) * r
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={1.5}
                                opacity={0.4}
                            />
                        )
                    })}
                </g>

                {/* Scanner rings */}
                <g
                    transform="translate(50%, 50%)"
                    stroke={accentColor}
                    opacity={0.35}
                >
                    {[90, 140, 190].map((r, i) => (
                        <circle
                            key={i}
                            cx={0}
                            cy={0}
                            r={r}
                            strokeDasharray="4 6"
                        />
                    ))}
                    {/* Crosshair */}
                    <line x1="-220" y1="0" x2="220" y2="0" />
                    <line x1="0" y1="-220" x2="0" y2="220" />
                </g>
            </svg>

            {/* Pulse radial burst (keyed to pulseKey) */}
            <div
                key={pulseKey}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    transform: "translate(-50%, -30%)",
                    boxShadow: `0 0 ${18 + glow * 14}px ${accentColor}`,
                    animation: "holoPulse 900ms ease-out",
                    pointerEvents: "none",
                }}
            />

            <style>{`
        @keyframes holoPulse {
          0% { box-shadow: 0 0 ${8 + glow * 10}px ${accentColor}, 0 0 0 0 ${accentColor}; opacity: 0.9; }
          50% { box-shadow: 0 0 ${16 + glow * 14}px ${accentColor}, 0 0 0 120px ${accentColor}33; opacity: 0.8; }
          100% { box-shadow: 0 0 ${8 + glow * 8}px ${accentColor}, 0 0 0 280px ${accentColor}00; opacity: 0.6; }
        }
      `}</style>
        </div>
    )
}

export default HoloSVG
