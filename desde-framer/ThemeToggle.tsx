import * as React from "react"
import { motion } from "framer-motion"
import { HoloTheme } from "./useTheme.ts"

type Props = {
    theme: HoloTheme
    onChange?: (t: HoloTheme) => void
    label?: string
}

export function ThemeToggle({ theme, onChange, label = "Holograma" }: Props) {
    const isNeon = theme === "neon"
    return (
        <div
            className="theme-toggle"
            data-theme={theme}
            role="group"
            aria-label={label}
        >
            <span>Matrix</span>
            <button
                type="button"
                aria-pressed={isNeon}
                className="knob"
                onClick={() => onChange?.(isNeon ? "matrix" : "neon")}
                style={{ position: "relative" }}
            >
                <motion.span
                    className="dot"
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            </button>
            <span>Neón</span>
        </div>
    )
}
