// MI_Cristales.tsx v1.1.1
// v1.1.1 — Re-publish trigger para invalidar CDN tras reporte 2026-05-07.
// v1.1 — Suma RevokeCristalButton (botón circular "−" rojizo) para
// que el admin pueda restar cristales individuales desde el panel del
// nodo. Espejo del GrantCristalButton: misma geometría, mismo spring
// transition, color y glyph distintos. La RPC asociada es
// admin_revoke_cristal — LIFO sobre cristales no canjeados.
// Cristales del Motor de Intervención: overlay ritual fullscreen + dos
// botones circulares (regalar / restar) individuales. Default export =
// ghost component con Object.assign de los componentes (patrón canónico).
//
// Consumidor: MI_Detail (modal del nodo).
// Patrón de import:
//   import Cristales from "./MI_Cristales.tsx"
//   const { CristalRitualOverlay, GrantCristalButton, RevokeCristalButton } = Cristales

import * as React from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"

/* ═══ OVERLAY RITUAL ═══
   Cuatro capas sincronizadas tipo videojuego:
   1. Velo radial cyan/dorado de fondo.
   2. Orb central que pulsa scale 0 → 1.4 → 1.1 → 0 con gradient radial.
   3. Tres anillos concéntricos con stagger (0s / 0.15s / 0.3s).
   4. Doce partículas radiando 360° + glyph rotante + texto sellado.
   Duración total: 1.6s. pointerEvents:none para no bloquear. */
function CristalRitualOverlay(props: { tipo: "codice" | "meditacion" }) {
    const { tipo } = props
    const accentBase = tipo === "codice" ? "#00E5FF" : "#7DDCFF"
    const accentGold = "#F5D98C"
    const accent = accentBase
    const accentSoft = `${accent}b3`
    const accentGlow = `${accent}66`
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
                duration: 1.6,
                times: [0, 0.15, 0.75, 1],
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483647,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `radial-gradient(circle at center, ${accent}22 0%, ${accent}0a 30%, transparent 60%)`,
            }}
        >
            {/* Anillos concéntricos */}
            {[0, 0.15, 0.3].map((delay) => (
                <motion.div
                    key={`ring-${delay}`}
                    initial={{ scale: 0.2, opacity: 0.85 }}
                    animate={{ scale: 4.2, opacity: 0 }}
                    transition={{
                        duration: 1.4,
                        delay,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                        position: "absolute",
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        border: `2px solid ${accentSoft}`,
                        boxShadow: `0 0 30px ${accentGlow}, inset 0 0 30px ${accentGlow}`,
                    }}
                />
            ))}
            {/* Partículas radiales */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2
                const dist = 280
                const dx = Math.cos(angle) * dist
                const dy = Math.sin(angle) * dist
                return (
                    <motion.div
                        key={`particle-${i}`}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                            x: dx,
                            y: dy,
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 1.2,
                            delay: 0.2,
                            ease: [0.16, 1, 0.3, 1],
                            times: [0, 0.2, 0.6, 1],
                        }}
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: accent,
                            boxShadow: `0 0 12px ${accent}, 0 0 22px ${accentSoft}`,
                        }}
                    />
                )
            })}
            {/* Orb central */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.4, 1.1, 1.6, 0],
                    opacity: [0, 1, 1, 0.7, 0],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.18, 0.5, 0.8, 1],
                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    position: "relative",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${accent} 28%, ${accentGold}99 60%, transparent 80%)`,
                    boxShadow: `0 0 80px ${accent}, 0 0 160px ${accentSoft}, inset 0 0 60px ${accentGlow}`,
                    filter: "blur(0.5px)",
                }}
            />
            {/* Glyph cristal flotante en el centro del orb */}
            <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                animate={{
                    scale: [0, 1.5, 1.2, 0.4],
                    opacity: [0, 1, 1, 0],
                    rotate: [-45, 0, 12, 35],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.25, 0.7, 1],
                    ease: "easeOut",
                }}
                style={{
                    position: "absolute",
                    fontSize: 64,
                    color: "#FFFFFF",
                    textShadow: `0 0 24px ${accent}, 0 0 48px ${accentSoft}`,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 200,
                    lineHeight: 1,
                }}
            >
                ✦
            </motion.div>
            {/* Texto sellado */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    y: [50, 10, 0, -30],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.25, 0.75, 1],
                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    position: "absolute",
                    top: "62%",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.5em",
                    textTransform: "uppercase",
                    marginRight: "-0.5em",
                    color: accent,
                    textShadow: `0 0 16px ${accent}, 0 0 32px ${accentSoft}`,
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                }}
            >
                ✦ Cristal Proyectado ✦
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0] }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.3, 0.75, 1],
                }}
                style={{
                    position: "absolute",
                    top: "70%",
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                }}
            >
                {tipo === "codice"
                    ? "Códice de Luz"
                    : "Meditación de la Holoteca"}
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ═══ BOTÓN CIRCULAR DE REGALO INDIVIDUAL ═══
   Visualmente sutil pero ritualístico: fondo glass tenue, borde dorado,
   "+" delicado, hover con glow más intenso, click con scale-down + spring.
   `pulsing` intensifica el glow para coincidir con el pulse del contador.
   `disabled` baja a 40% opacity. */
function GrantCristalButton(props: {
    onClick: () => void
    disabled?: boolean
    pulsing?: boolean
    color?: string
}) {
    const { onClick, disabled = false, pulsing = false, color = "#F5D98C" } =
        props
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={
                disabled
                    ? undefined
                    : {
                          scale: 1.12,
                          boxShadow: `0 0 16px ${color}88, 0 0 8px ${color}66`,
                      }
            }
            whileTap={disabled ? undefined : { scale: 0.85 }}
            animate={
                pulsing
                    ? {
                          boxShadow: `0 0 22px ${color}cc, 0 0 10px ${color}88`,
                      }
                    : {
                          boxShadow: `0 0 6px ${color}55, inset 0 0 6px ${color}33`,
                      }
            }
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: `1px solid ${color}88`,
                background: `linear-gradient(135deg, ${color}1f, ${color}0a)`,
                color,
                cursor: disabled ? "not-allowed" : "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                opacity: disabled ? 0.4 : 1,
                fontSize: 14,
                fontWeight: 300,
                lineHeight: 1,
                fontFamily: "'Inter', sans-serif",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Regalar un cristal"
            title="Regalar un cristal"
        >
            +
        </motion.button>
    )
}

/* ═══ BOTÓN CIRCULAR DE RESTA INDIVIDUAL ═══
   Espejo del GrantCristalButton: misma geometría, mismo spring, glyph
   "−" en lugar de "+". El color por defecto es rojizo (#FF8C8C) para
   diferenciarlo visualmente del regalo. Click revoca un cristal en el
   admin RPC (LIFO sobre cristales no canjeados). */
function RevokeCristalButton(props: {
    onClick: () => void
    disabled?: boolean
    pulsing?: boolean
    color?: string
}) {
    const { onClick, disabled = false, pulsing = false, color = "#FF8C8C" } =
        props
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={
                disabled
                    ? undefined
                    : {
                          scale: 1.12,
                          boxShadow: `0 0 16px ${color}88, 0 0 8px ${color}66`,
                      }
            }
            whileTap={disabled ? undefined : { scale: 0.85 }}
            animate={
                pulsing
                    ? {
                          boxShadow: `0 0 22px ${color}cc, 0 0 10px ${color}88`,
                      }
                    : {
                          boxShadow: `0 0 6px ${color}55, inset 0 0 6px ${color}33`,
                      }
            }
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: `1px solid ${color}88`,
                background: `linear-gradient(135deg, ${color}1f, ${color}0a)`,
                color,
                cursor: disabled ? "not-allowed" : "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                opacity: disabled ? 0.4 : 1,
                fontSize: 16,
                fontWeight: 300,
                lineHeight: 1,
                fontFamily: "'Inter', sans-serif",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Restar un cristal"
            title="Restar un cristal"
        >
            −
        </motion.button>
    )
}

/* ═══ GHOST WRAPPER ═══ */
function MICristalesShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MICristalesShell.displayName = "MI_Cristales"

const Cristales = Object.assign(MICristalesShell, {
    CristalRitualOverlay,
    GrantCristalButton,
    RevokeCristalButton,
})

export default Cristales
