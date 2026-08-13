// SolarThemeToggle.tsx
import * as React from "react"
import { useSolarTheme, withAlpha } from "./useSolarTheme.ts"

type Props = {
    showLabel?: boolean
    width?: number
    height?: number
    style?: React.CSSProperties
    className?: string
}

/** Export por DEFECTO: SolarThemeToggle */
export default function SolarThemeToggle({
    showLabel = true,
    width = 78,
    height = 36,
    style,
    className,
}: Props) {
    const { isNeon, accent, toggleTheme } = useSolarTheme()

    const outer: React.CSSProperties = {
        width,
        height,
        padding: 3,
        opacity: 0.75,
        borderRadius: 999,
        background:
            "linear-gradient(180deg, rgba(10,15,25,.9), rgba(10,15,25,.96))",
        border: `1.2px solid ${accent}`,
        // 🔧 En el objeto "outer"
        boxShadow: `inset 0 0 4px rgba(0,0,0,.6), 0 0 4px ${withAlpha(accent, 0.1)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: isNeon ? "flex-end" : "flex-start",
        transition: "all .22s ease",
        WebkitTapHighlightColor: "transparent",
        ...style,
    }

    const knob: React.CSSProperties = {
        opacity: 0.75,
        width: height - 6,
        height: height - 6,
        borderRadius: "50%",
        background: `radial-gradient(60% 60% at 50% 50%, ${isNeon ? "#B5E9FF" : "#D7FFDF"} 0%, ${accent} 70%)`,
        boxShadow: `0 0 4px ${withAlpha(accent, 0.15)}`,
    }

    return (
        <div
            style={{
                position: "relative", // contenedor relativo
                width: "100%",
                display: "flex",
                justifyContent: "center",
            }}
            className={className}
        >
            <div
                style={{
                    position: "absolute", // 🔧 ahora es absoluto
                    bottom: -180, // 🔽 cambia este valor para bajarlo más o menos
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <button
                    aria-label="Cambiar tema"
                    role="switch"
                    aria-checked={isNeon}
                    onClick={toggleTheme}
                    style={outer}
                >
                    <div style={knob} />
                </button>
                {showLabel && (
                    <div
                        style={{
                            marginTop: 10,
                            fontSize: 12,
                            opacity: 0.5,
                            color: "#fff",
                            textShadow: `0 0 8px ${withAlpha(accent, 0.33)}`,
                        }}
                    ></div>
                )}
            </div>
        </div>
    )
}
