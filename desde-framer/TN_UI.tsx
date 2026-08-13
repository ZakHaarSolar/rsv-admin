// TN_UI.tsx v1.0
// Primitivos UI compartidos del split de TelemetriaDelNucleo (sello TN_).
// Default export = ghost component con Object.assign de todos los primitivos
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidores: TN_Forms, TN_Cards, TN_Dashboard. Patrón de import:
//   import UI from "./TN_UI.tsx"
//   const { EnergyRing, MultiToggle, StatMini, NodeInput, LiveBadge } = UI

import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Shared from "./TN_Shared.tsx"

const { CYAN, GREEN } = Shared

/* ── HoloCorners — adornos esquineros holográficos ── */
function HoloCorners({ color }: { color: string }) {
    const ps = [
        { top: 12, left: 12, bH: "top", bV: "left" },
        { top: 12, right: 12, bH: "top", bV: "right" },
        { bottom: 12, left: 12, bH: "bottom", bV: "left" },
        { bottom: 12, right: 12, bH: "bottom", bV: "right" },
    ]
    return (
        <>
            {ps.map((pos, i) => {
                const st: any = {
                    position: "absolute",
                    width: 16,
                    height: 16,
                    zIndex: 3,
                    pointerEvents: "none",
                }
                if (pos.top !== undefined) st.top = pos.top
                if (pos.bottom !== undefined) st.bottom = pos.bottom
                if (pos.left !== undefined) st.left = pos.left
                if (pos.right !== undefined) st.right = pos.right
                return (
                    <div key={i} style={st}>
                        <div
                            style={{
                                position: "absolute",
                                [pos.bH]: 0,
                                [pos.bV]: 0,
                                width: 16,
                                height: 1,
                                background: color,
                                opacity: 0.35,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                [pos.bH]: 0,
                                [pos.bV]: 0,
                                width: 1,
                                height: 16,
                                background: color,
                                opacity: 0.35,
                            }}
                        />
                    </div>
                )
            })}
        </>
    )
}

/* ── EnergyRing — anillo SVG con dots por nodo ── */
function EnergyRing({
    value,
    max,
    label,
    schedule,
    color,
    glowColor,
    delay = 0,
}: {
    value: number
    max: number
    label: string
    schedule?: string
    color: string
    glowColor: string
    delay?: number
}) {
    const R = 68,
        C = 2 * Math.PI * R,
        o = C * (1 - Math.min(value / max, 1))
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: 160,
                    height: 160,
                    animation: "adm-ring-pulse 4s ease-in-out infinite",
                }}
            >
                <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    style={{ transform: "rotate(-90deg)" }}
                >
                    <circle
                        cx="80"
                        cy="80"
                        r={R}
                        fill="none"
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="6"
                    />
                    {Array.from({ length: max }).map((_, i) => {
                        const a = (i / max) * 360 - 90,
                            rd = (a * Math.PI) / 180
                        return (
                            <line
                                key={i}
                                x1={80 + (R - 8) * Math.cos(rd)}
                                y1={80 + (R - 8) * Math.sin(rd)}
                                x2={80 + (R + 2) * Math.cos(rd)}
                                y2={80 + (R + 2) * Math.sin(rd)}
                                stroke={
                                    i < value ? color : "rgba(255,255,255,0.06)"
                                }
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                style={{
                                    transition: "stroke 0.5s ease",
                                    transitionDelay: `${i * 30}ms`,
                                }}
                            />
                        )
                    })}
                    <circle
                        cx="80"
                        cy="80"
                        r={R}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeDasharray={C}
                        strokeDashoffset={o}
                        strokeLinecap="round"
                        style={{
                            transition:
                                "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)",
                            filter: `drop-shadow(0 0 6px ${glowColor})`,
                        }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 36,
                            fontWeight: 200,
                            letterSpacing: "0.05em",
                            color,
                            fontFamily: "'Inter',sans-serif",
                            lineHeight: 1,
                        }}
                    >
                        {value}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            color: "rgba(255,255,255,0.25)",
                            textTransform: "uppercase",
                            marginTop: 4,
                        }}
                    >
                        / {max} nodos
                    </span>
                </div>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                    }}
                >
                    {label}
                </span>
                {schedule && (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 400,
                            color: "rgba(255,255,255,0.2)",
                        }}
                    >
                        {schedule}
                    </span>
                )}
            </div>
        </motion.div>
    )
}

/* ── MultiToggle — segmented control horizontal ── */
function MultiToggle({
    options,
    value,
    onChange,
    color = CYAN,
}: {
    options: string[]
    value: number
    onChange: (v: number) => void
    color?: string
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                padding: 3,
                borderRadius: 10,
                background: "rgba(0,10,20,0.7)",
                border: `1px solid ${color}22`,
                fontFamily: "'Inter',sans-serif",
                width: "100%",
            }}
        >
            {options.map((opt, i) => (
                <button
                    key={opt}
                    onClick={() => onChange(i)}
                    style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        transition: "all 0.3s ease",
                        background: value === i ? `${color}1A` : "transparent",
                        color: value === i ? color : "rgba(255,255,255,0.25)",
                        border: "none",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "inherit",
                        flex: 1,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                    }}
                >
                    {opt}
                </button>
            ))}
        </div>
    )
}

/* ── StatMini — label + valor en columna ── */
function StatMini({
    label,
    value,
    color = CYAN,
}: {
    label: string
    value: string
    color?: string
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: 20,
                    fontWeight: 300,
                    letterSpacing: "0.04em",
                    color,
                }}
            >
                {value}
            </span>
        </div>
    )
}

/* ── NodeInput — input numérico con stepper ── */
function NodeInput({
    value,
    onChange,
    min = 0,
    max = 999,
    color = CYAN,
}: {
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    color?: string
}) {
    const cl = (n: number) => Math.max(min, Math.min(max, n))
    const b: React.CSSProperties = {
        width: 28,
        height: 28,
        borderRadius: 7,
        border: `1px solid ${color}22`,
        background: "transparent",
        color: `${color}88`,
        fontSize: 16,
        fontWeight: 300,
        cursor: "pointer",
        outline: "none",
        fontFamily: "'Inter',sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={b} onClick={() => onChange(cl(value - 1))}>
                −
            </button>
            <input
                className="adm-num-input"
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(cl(parseInt(e.target.value) || 0))}
                style={{ borderColor: `${color}15` }}
            />
            <button style={b} onClick={() => onChange(cl(value + 1))}>
                +
            </button>
        </div>
    )
}

/* ── LiveBadge — pill verde con dot pulsante ── */
function LiveBadge() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(76,175,80,0.08)",
                border: "1px solid rgba(76,175,80,0.18)",
            }}
        >
            <div
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: GREEN,
                    animation: "adm-live-dot 2s ease-in-out infinite",
                }}
            />
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(76,175,80,0.6)",
                }}
            >
                En Vivo
            </span>
        </div>
    )
}

/* ── PrivCol — columna de privilegios (Inmersión / Sintonía) ── */
function PrivCol({
    title,
    price,
    color,
    items,
}: {
    title: string
    price: string
    color: string
    items: string[]
}) {
    return (
        <div style={{ flex: 1 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color,
                    }}
                >
                    {title}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                    {price}
                </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: color,
                                boxShadow: `0 0 6px ${color}`,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 300,
                                color: "rgba(255,255,255,0.45)",
                            }}
                        >
                            {item}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── EyeToggle — ojo abierto/cerrado para toggle de panel margen ── */
function EyeToggle({
    visible,
    onClick,
    color,
}: {
    visible: boolean
    onClick: () => void
    color: string
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${visible ? color + "44" : "rgba(255,255,255,0.06)"}`,
                background: visible ? `${color}0A` : "transparent",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
            }}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={visible ? color : "rgba(255,255,255,0.2)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {visible ? (
                    <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                ) : (
                    <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                )}
            </svg>
        </button>
    )
}

/* ── ExpandArrowBtn — botón expandir/minimizar de cards ── */
function ExpandArrowBtn({
    expanded,
    onClick,
    color,
}: {
    expanded: boolean
    onClick: () => void
    color: string
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: `1px solid ${expanded ? color + "55" : color + "18"}`,
                background: expanded ? `${color}12` : `${color}06`,
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
                flexShrink: 0,
            }}
            onMouseEnter={(e: any) => {
                e.currentTarget.style.borderColor = color + "55"
                e.currentTarget.style.background = `${color}15`
            }}
            onMouseLeave={(e: any) => {
                if (!expanded) {
                    e.currentTarget.style.borderColor = color + "18"
                    e.currentTarget.style.background = `${color}06`
                }
            }}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {expanded ? (
                    <line x1="5" y1="12" x2="19" y2="12" />
                ) : (
                    <>
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                    </>
                )}
            </svg>
        </button>
    )
}

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function TN_UIShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
TN_UIShell.displayName = "TN_UI"

const UI = Object.assign(TN_UIShell, {
    HoloCorners,
    EnergyRing,
    MultiToggle,
    StatMini,
    NodeInput,
    LiveBadge,
    PrivCol,
    EyeToggle,
    ExpandArrowBtn,
})

export default UI
