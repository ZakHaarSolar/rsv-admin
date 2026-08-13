// CeremoniaIndiceLuz.tsx v1.2 — Quitado el nombre del pilar más bajo ("HARDWARE"
// etc.) que aparecía sobre la geometría y confundía (el pulso de alarma se
// conserva). v1.1 — Centrado vertical (sin padding safe-area que la empujaba
// abajo) + quitado "Toca para continuar" (auto-completa a ~5.2s, no espera tap).
//
// Se dispara UNA vez cuando el tripulante sella su ciclo (6º pilar del
// Radar). El mundo se apaga y su campo se reconstruye con su propia luz:
// el núcleo inhala, los 6 vértices se encienden en cascada ACELERANTE
// trazando las aristas del POLÍGONO REAL de sus 6 scores (su firma
// asimétrica) en oro hasta cerrar con un snap, y de ese cierre NACE el
// Índice en el centro con un solo latido (count-up + overshoot de escala).
// Tras el sello respiratorio, el vértice del pilar MÁS BAJO sigue latiendo
// en su color de alarma con su nombre: te celebra y te señala dónde calibrar.
//
// Diseño: panel multi-agente "El Latido del Sello" + injertos (polígono de
// datos real + pilar más bajo de "El Polígono que Respira", count-up por
// useMotionValue+ref imperativo + atmósfera de "El Estallido del Hexágono",
// un solo filtro de glow compartido de "Sello Toroidal", reuso del patrón
// de resonancia + SMIL fill=freeze de "Estructura Mínima").
//
// Arquitectura: portaleado a document.body, position:fixed inset:0. REDIBUJA
// su propio hexágono centrado (no depende del z-index/posición del radar
// real, que queda atenuado debajo). ~4.6s, skippeable con tap. Self-exit
// (fade del root + onDone) — NO depende de AnimatePresence para el unmount.
//
// Perf 10K: un solo <svg>, un solo <filter> blur compartido, count-up por
// useMotionValue (cero re-render por frame), solo transform/opacity/scale/
// pathLength/r animados, will-change muere al desmontar, una única animación
// infinita (halo del pilar más bajo), cleanup estricto de timers/controls.

import React, { useEffect, useRef } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import { createPortal } from "react-dom"
import Shared, { Scores } from "./EV_Shared.tsx"

const { hx, GOLD } = Shared

/* Geometría — espejo EXACTO del Radar (EV_Radar.tsx). */
const VB = 620
const CX = VB / 2
const CY = VB / 2
const N = 6
const AS = (Math.PI * 2) / N
const SA = -Math.PI / 2
/* Orden de pilares idéntico a PILLARS en EV_Radar (no se exporta, se
   replica para mapear scores → posiciones del hexágono). */
const PILLAR_IDS = [
    "fisico",
    "mental",
    "emocional",
    "financiero",
    "vector",
    "orbita",
] as const

/* Stagger ACELERANTE: el gap entre ignición de vértices se acorta
   (0.150 → 0.106s) para que el 6º lado cierre con snap. */
function buildVertexDelays(): number[] {
    const out: number[] = [0.8]
    for (let k = 1; k < N; k++) {
        out.push(out[k - 1] + (0.15 - (k - 1) * 0.011))
    }
    return out
}

function haptic(ms: number) {
    try {
        if (typeof navigator !== "undefined" && (navigator as any).vibrate)
            (navigator as any).vibrate(ms)
    } catch {}
}

export default function CeremoniaIndiceLuz({
    /* 🜂 Defaults defensivos OBLIGATORIOS: Framer instancia el Code File
       standalone SIN props al cargar (componentLoader). Sin el default de
       scores, `scores[id]` sobre undefined crashea con "Cannot read
       properties of undefined (reading 'fisico')" → "Publishing blocked by
       N blocking errors" a nivel proyecto. Los demás defaults blindan hx()/
       animate() por las dudas. */
    scores = {} as Scores,
    indice = 0,
    accent = "#00C2FF",
    levelColor = "#D4A843",
    isMobile = false,
    onDone = () => {},
}: {
    scores: Scores
    indice: number
    accent: string
    /* HEX (no rgba) — hx() lo necesita: #FF7878 (rojo) / accent (cyan) /
       GOLD. Color del número + halos por nivel del índice. */
    levelColor: string
    lowPillarLabel: string
    isMobile: boolean
    onDone: () => void
}) {
    /* Leído UNA vez en init (no listener). */
    const reduceRef = useRef<boolean>(
        typeof window !== "undefined" &&
            typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    )
    const numRef = useRef<HTMLSpanElement>(null)
    const doneGuardRef = useRef(false)
    const timersRef = useRef<number[]>([])
    const onDoneRef = useRef(onDone)
    useEffect(() => {
        onDoneRef.current = onDone
    }, [onDone])
    const mv = useMotionValue(0)
    const rootOpacity = useMotionValue(1)

    /* maxR del radar real: mobile usa 0.38, desktop 0.34. */
    const maxR = VB * (isMobile ? 0.38 : 0.34)
    const pt = (i: number, v: number): [number, number] => {
        const a = SA + i * AS
        const r = (v / 100) * maxR
        return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
    }
    /* dps = polígono REAL de los 6 scores (la firma asimétrica). */
    const dps = PILLAR_IDS.map((id, i) => {
        const v = scores[id]
        return pt(i, typeof v === "number" ? v : 0)
    })
    const outerPts = Array.from({ length: N }, (_, i) => pt(i, 100))
    const dpsStr = dps.map((p) => `${p[0]},${p[1]}`).join(" ")

    /* Pilar más bajo (índice + posición) para el latido de alarma. */
    let lowIdx = 0
    let lowVal = Infinity
    PILLAR_IDS.forEach((id, i) => {
        const v = scores[id]
        const s = typeof v === "number" ? v : 100
        if (s < lowVal) {
            lowVal = s
            lowIdx = i
        }
    })
    const alarmColor = lowVal < 40 ? "#FF7878" : GOLD

    const reduce = reduceRef.current
    const vDelays = buildVertexDelays()

    /* ── Lifecycle maestro — un único useEffect, cleanup estricto ── */
    useEffect(() => {
        const reduced = reduceRef.current
        if (numRef.current) numRef.current.textContent = "0"

        const finish = () => {
            if (doneGuardRef.current) return
            doneGuardRef.current = true
            // fade del root y onDone tras 360ms
            animate(rootOpacity, 0, { duration: 0.35, ease: [0.4, 0, 1, 1] })
            const t = window.setTimeout(() => onDoneRef.current(), 360)
            timersRef.current.push(t)
        }

        // Count-up del número (cero re-render por frame).
        const controls = animate(mv, indice, {
            duration: reduced ? 0.7 : 1.0,
            delay: reduced ? 0.15 : 2.2,
            ease: [0.16, 1, 0.3, 1],
        })
        const unsub = mv.on("change", (v) => {
            if (numRef.current)
                numRef.current.textContent = String(
                    Math.min(indice, Math.round(v))
                )
        })

        if (reduced) {
            haptic(20)
            timersRef.current.push(window.setTimeout(finish, 1200))
            timersRef.current.push(window.setTimeout(finish, 1500))
        } else {
            haptic(8)
            vDelays.forEach((d, i) => {
                timersRef.current.push(
                    window.setTimeout(() => haptic(i === 5 ? 20 : 12), d * 1000)
                )
            })
            timersRef.current.push(window.setTimeout(() => haptic(28), 2200))
            /* Cierre primario 5200ms (deja respirar el tableau final: sello +
               pilar bajo latiendo) + failsafe 5600ms por si un frame-drop se
               comió el primario. doneGuardRef garantiza que solo el primero
               ejecuta onDone (el segundo hace early return). */
            timersRef.current.push(window.setTimeout(finish, 5200))
            timersRef.current.push(window.setTimeout(finish, 5600))
        }

        return () => {
            timersRef.current.forEach((t) => clearTimeout(t))
            timersRef.current = []
            controls.stop()
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const skip = () => {
        if (doneGuardRef.current) return
        doneGuardRef.current = true
        timersRef.current.forEach((t) => clearTimeout(t))
        timersRef.current = []
        animate(rootOpacity, 0, { duration: 0.3, ease: [0.4, 0, 1, 1] })
        const t = window.setTimeout(() => onDoneRef.current(), 310)
        timersRef.current.push(t)
    }

    const svgSize = isMobile ? "min(92vw, 560px)" : "min(560px, 86vh)"

    const content = (
        <motion.div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483600,
                opacity: rootOpacity,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {/* A. VELO DE ATENUACIÓN — apagón casi total (0.86→0.98) a
                propósito: "el mundo se apaga". El radar real queda oculto y
                la ceremonia REDIBUJA su propio hexágono encima; al terminar
                (~5.2s) se revela el radar al 100%. No es un bug de contraste. */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: reduce ? 0.3 : 0.55,
                    ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 50% 46%, rgba(2,8,18,0.975) 0%, rgba(0,0,2,1) 100%)",
                    pointerEvents: "none",
                }}
            />
            {/* B. VIGNETTE — enfoca al centro (opacidad fija, no anima). */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    boxShadow: "inset 0 0 240px 90px rgba(0,0,0,0.85)",
                    pointerEvents: "none",
                }}
            />

            {/* D. CONTENEDOR SVG — hexágono redibujado, centrado. */}
            <div
                style={{
                    position: "relative",
                    width: svgSize,
                    maxWidth: "94vw",
                    aspectRatio: "1 / 1",
                    /* Sin padding safe-area: el contenedor está flex-centrado
                       en el viewport, no anclado a un borde. El paddingTop del
                       notch lo empujaba ~12-60px hacia abajo (quedaba "algo
                       abajo" en pantalla). Sin él, el hexágono queda centrado. */
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${VB} ${VB}`}
                    style={{ overflow: "visible" }}
                >
                    <defs>
                        <radialGradient id="cer-erg">
                            <stop
                                offset="0%"
                                stopColor={levelColor}
                                stopOpacity="0.9"
                            />
                            <stop
                                offset="60%"
                                stopColor={levelColor}
                                stopOpacity="0"
                            />
                        </radialGradient>
                        <radialGradient id="cer-core">
                            <stop
                                offset="0%"
                                stopColor={accent}
                                stopOpacity="0.95"
                            />
                            <stop
                                offset="100%"
                                stopColor={accent}
                                stopOpacity="0"
                            />
                        </radialGradient>
                        {/* ÚNICO blur del SVG (lo caro en iOS). */}
                        <filter id="cer-glow">
                            <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation="2.6"
                            />
                        </filter>
                    </defs>

                    {/* g-wrapper: compresión (beat1) + respiración (beat4). */}
                    <motion.g
                        style={{
                            transformBox: "fill-box",
                            transformOrigin: "center",
                            willChange: "transform",
                        }}
                        initial={{ scale: 1 }}
                        animate={
                            reduce
                                ? { scale: 1 }
                                : { scale: [1, 0.965, 0.965, 1.025, 1] }
                        }
                        transition={
                            reduce
                                ? { duration: 0 }
                                : {
                                      duration: 5.0,
                                      times: [0, 0.16, 0.7, 0.78, 0.9],
                                      ease: [0.45, 0, 0.55, 1],
                                  }
                        }
                    >
                        {/* 1. WARP — líneas que succionan al centro (beat1). */}
                        {!reduce && (
                            <g>
                                {Array.from({
                                    length: isMobile ? 8 : 12,
                                }).map((_, i) => {
                                    const ang = (i / (isMobile ? 8 : 12)) *
                                        Math.PI *
                                        2
                                    const rr = 150 + (i % 4) * 26
                                    const x1 = CX + rr * Math.cos(ang)
                                    const y1 = CY + rr * Math.sin(ang)
                                    return (
                                        <motion.line
                                            key={`w${i}`}
                                            x1={x1}
                                            y1={y1}
                                            stroke={hx(accent, 0.5)}
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                            initial={{
                                                x2: x1,
                                                y2: y1,
                                                opacity: 0.5,
                                            }}
                                            animate={{
                                                x2: CX + (x1 - CX) * 0.14,
                                                y2: CY + (y1 - CY) * 0.14,
                                                opacity: 0,
                                            }}
                                            transition={{
                                                duration: 0.7,
                                                delay: i * 0.012,
                                                ease: [0.7, 0, 0.84, 0],
                                            }}
                                        />
                                    )
                                })}
                            </g>
                        )}

                        {/* 2. ANILLOS BASE. */}
                        {[25, 50, 75, 100].map((lv) => {
                            const ps = Array.from({ length: N }, (_, i) =>
                                pt(i, lv)
                            )
                            return (
                                <motion.path
                                    key={`ring${lv}`}
                                    d={
                                        ps
                                            .map(
                                                (p, i) =>
                                                    `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`
                                            )
                                            .join(" ") + " Z"
                                    }
                                    fill="none"
                                    stroke={hx(accent, lv === 100 ? 0.18 : 0.1)}
                                    strokeWidth={lv === 100 ? 1.2 : 0.7}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: reduce ? 0.3 : 0.6,
                                        delay: reduce ? 0 : 0.1,
                                    }}
                                />
                            )
                        })}

                        {/* 3. SPOKES fantasma. */}
                        {!reduce &&
                            outerPts.map(([ex, ey], i) => (
                                <motion.line
                                    key={`sp${i}`}
                                    x1={CX}
                                    y1={CY}
                                    x2={ex}
                                    y2={ey}
                                    stroke={hx(accent, 0.08)}
                                    strokeWidth="0.7"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.15 }}
                                />
                            ))}

                        {/* 4. POLÍGONO DE DATOS (fill, beat3→4). */}
                        <motion.polygon
                            points={dpsStr}
                            fill={hx(levelColor, 0.12)}
                            stroke={levelColor}
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: reduce ? 0.4 : 0.6,
                                delay: reduce ? 0.1 : 2.3,
                            }}
                        />

                        {/* 5. ARISTAS DE IGNICIÓN — trazado en oro (beat2). */}
                        {dps.map((p, i) => {
                            const q = dps[(i + 1) % N]
                            return (
                                <motion.path
                                    key={`edge${i}`}
                                    d={`M${p[0]},${p[1]} L${q[0]},${q[1]}`}
                                    fill="none"
                                    stroke={GOLD}
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    filter={
                                        reduce ? undefined : "url(#cer-glow)"
                                    }
                                    initial={{
                                        pathLength: reduce ? 1 : 0,
                                        opacity: reduce ? 0 : 1,
                                    }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                        duration: reduce ? 0.4 : 0.22,
                                        delay: reduce ? 0.1 : vDelays[i] + 0.05,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                />
                            )
                        })}

                        {/* 6. FLASH DE PERÍMETRO (cierre beat2). */}
                        {!reduce && (
                            <motion.polygon
                                points={dpsStr}
                                fill="none"
                                stroke={GOLD}
                                strokeLinejoin="round"
                                initial={{ opacity: 0, strokeWidth: 2 }}
                                animate={{
                                    opacity: [0, 0.9, 0],
                                    strokeWidth: [2, 5, 2],
                                }}
                                transition={{
                                    /* 1.75: arranca al CERRAR la 6ª arista
                                       (vDelays[5]+0.05+0.22≈1.71), no antes,
                                       para que el cierre se vea nítido. */
                                    duration: 0.45,
                                    delay: 1.75,
                                    ease: "easeOut",
                                }}
                            />
                        )}

                        {/* 7. ANILLOS DE RESONANCIA (beat3) — SMIL fill=freeze
                            (reuso del patrón resonancePulseKey del Radar). */}
                        {!reduce &&
                            [0, 1, 2].map((k) => (
                                <circle
                                    key={`res${k}`}
                                    cx={CX}
                                    cy={CY}
                                    r="0"
                                    fill="none"
                                    stroke={levelColor}
                                    strokeWidth="2.4"
                                    opacity="0"
                                >
                                    <animate
                                        attributeName="r"
                                        from="0"
                                        to={String(
                                            maxR * [1.6, 1.9, 2.2][k]
                                        )}
                                        begin={`${2.2 + k * 0.13}s`}
                                        dur="1.4s"
                                        calcMode="spline"
                                        keySplines="0.22 1 0.36 1"
                                        fill="freeze"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.85;0.5;0"
                                        keyTimes="0;0.4;1"
                                        begin={`${2.2 + k * 0.13}s`}
                                        dur="1.4s"
                                        fill="freeze"
                                    />
                                    <animate
                                        attributeName="stroke-width"
                                        values="2.5;3;0.4"
                                        keyTimes="0;0.5;1"
                                        begin={`${2.2 + k * 0.13}s`}
                                        dur="1.4s"
                                        fill="freeze"
                                    />
                                </circle>
                            ))}

                        {/* 8. DESTELLO RADIAL SVG (beat3). */}
                        {!reduce && (
                            <motion.circle
                                cx={CX}
                                cy={CY}
                                r={maxR * 1.15}
                                fill="url(#cer-erg)"
                                style={{
                                    transformBox: "fill-box",
                                    transformOrigin: "center",
                                }}
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{
                                    scale: [0.4, 1.15],
                                    opacity: [0, 0.85, 0],
                                }}
                                transition={{
                                    /* 0.8s para que reverbere junto a los
                                       anillos de resonancia (1.4s), no antes. */
                                    duration: 0.8,
                                    delay: 2.2,
                                    ease: "easeOut",
                                }}
                            />
                        )}

                        {/* 9. NÚCLEO — inhala (beat1) y se funde en el destello. */}
                        <motion.circle
                            cx={CX}
                            cy={CY}
                            fill="url(#cer-core)"
                            filter={reduce ? undefined : "url(#cer-glow)"}
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            initial={{ scale: 1, opacity: reduce ? 0 : 0.9 }}
                            animate={
                                reduce
                                    ? { opacity: 0 }
                                    : {
                                          scale: [0.2, 0.8, 0.5, 2.4],
                                          opacity: [0.4, 1, 0.9, 0],
                                      }
                            }
                            transition={
                                reduce
                                    ? { duration: 0.2 }
                                    : {
                                          duration: 2.6,
                                          times: [0, 0.25, 0.5, 0.92],
                                          ease: [0.45, 0, 0.55, 1],
                                      }
                            }
                            r={isMobile ? 9 : 11}
                        />

                        {/* 10. CHISPAS orbitales (beat3). */}
                        {!reduce &&
                            (() => {
                                const Ns = isMobile ? 10 : 14
                                return (
                                    <g style={{ willChange: "transform" }}>
                                        {Array.from({ length: Ns }).map(
                                            (_, i) => {
                                                const th =
                                                    (i / Ns) * Math.PI * 2
                                                const R =
                                                    maxR *
                                                    (0.6 + (i % 3) * 0.08)
                                                const tx =
                                                    CX + R * Math.cos(th)
                                                const ty =
                                                    CY + R * Math.sin(th)
                                                return (
                                                    /* cx/cy FIJOS en el destino
                                                       + transform x/y (GPU) desde
                                                       el centro → evita el layout
                                                       thrash de animar atributos. */
                                                    <motion.circle
                                                        key={`sk${i}`}
                                                        cx={tx}
                                                        cy={ty}
                                                        r="1.6"
                                                        fill={levelColor}
                                                        style={{
                                                            transformBox:
                                                                "fill-box",
                                                            transformOrigin:
                                                                "center",
                                                        }}
                                                        initial={{
                                                            x: CX - tx,
                                                            y: CY - ty,
                                                            opacity: 0,
                                                            scale: 0,
                                                        }}
                                                        animate={{
                                                            x: 0,
                                                            y: 0,
                                                            opacity: [0, 1, 0],
                                                            scale: [0, 1, 0.4],
                                                        }}
                                                        transition={{
                                                            duration: 0.6,
                                                            delay:
                                                                2.25 + i * 0.018,
                                                            ease: [
                                                                0.16, 1, 0.3, 1,
                                                            ],
                                                        }}
                                                    />
                                                )
                                            }
                                        )}
                                    </g>
                                )
                            })()}

                        {/* 11. VÉRTICES — discos de ignición + halos (beat2);
                            el del pilar más bajo late en alarma (beat4). */}
                        {dps.map((p, i) => {
                            const isLow = i === lowIdx
                            return (
                                <g key={`vtx${i}`}>
                                    {/* halo efímero */}
                                    {!reduce && (
                                        <motion.circle
                                            cx={p[0]}
                                            cy={p[1]}
                                            r={isMobile ? 5.5 : 6.5}
                                            fill="none"
                                            stroke={GOLD}
                                            strokeWidth="1.4"
                                            style={{
                                                transformBox: "fill-box",
                                                transformOrigin: "center",
                                            }}
                                            initial={{ scale: 0.4, opacity: 0 }}
                                            animate={{
                                                scale: 2.2,
                                                opacity: [0.7, 0],
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: vDelays[i],
                                            }}
                                        />
                                    )}
                                    {/* disco de ignición — one-shot para TODOS
                                        los vértices (incluido el más bajo). */}
                                    <motion.circle
                                        cx={p[0]}
                                        cy={p[1]}
                                        r={isMobile ? 5.5 : 6.5}
                                        fill={isLow ? alarmColor : GOLD}
                                        filter={
                                        reduce ? undefined : "url(#cer-glow)"
                                    }
                                        style={{
                                            transformBox: "fill-box",
                                            transformOrigin: "center",
                                        }}
                                        initial={{
                                            scale: reduce ? 1 : 0,
                                            opacity: reduce ? 0 : 1,
                                        }}
                                        animate={{
                                            scale: reduce ? 1 : [0, 1.5, 1],
                                            opacity: 1,
                                        }}
                                        transition={{
                                            duration: reduce ? 0.3 : 0.34,
                                            delay: reduce ? 0.1 : vDelays[i],
                                            times: reduce
                                                ? undefined
                                                : [0, 0.6, 1],
                                            ease: [0.34, 1.56, 0.64, 1],
                                        }}
                                    />
                                    {/* anillo de alarma latiendo (beat4) — SOLO
                                        el pilar más bajo. ÚNICA animación
                                        infinita; muere al desmontar. Loop
                                        seamless [1,1.35,1] (no re-ignita). */}
                                    {isLow && !reduce && (
                                        <motion.circle
                                            cx={p[0]}
                                            cy={p[1]}
                                            r={isMobile ? 9 : 11}
                                            fill="none"
                                            stroke={alarmColor}
                                            strokeWidth="1.6"
                                            style={{
                                                transformBox: "fill-box",
                                                transformOrigin: "center",
                                            }}
                                            initial={{ scale: 1, opacity: 0 }}
                                            animate={{
                                                scale: [1, 1.35, 1],
                                                opacity: [0.9, 0.4, 0.9],
                                            }}
                                            transition={{
                                                duration: 1.6,
                                                delay: 4.1,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    )}
                                </g>
                            )
                        })}

                        {/* 12. TEXTO PILAR BAJO — QUITADO (Zak 2026-06-14): el
                            nombre del pilar más bajo ("HARDWARE", etc.) aparecía
                            sobre la geometría y confundía. El pulso de alarma en
                            ese vértice se conserva; solo se quita la etiqueta. */}
                    </motion.g>
                </svg>

                {/* E. NÚMERO + SELLO — mismo offset/fuente que el badge real
                    (handoff). En coords del contenedor SVG (centrado). */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: isMobile ? "42%" : "50%",
                        transform: "translate(-50%,-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        pointerEvents: "none",
                    }}
                >
                    <motion.span
                        ref={numRef}
                        initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            scale: reduce
                                ? { duration: 0.4, delay: 0.15 }
                                : {
                                      type: "spring",
                                      stiffness: 170,
                                      damping: 12,
                                      mass: 0.9,
                                      delay: 2.2,
                                  },
                            opacity: {
                                duration: reduce ? 0.4 : 0.3,
                                delay: reduce ? 0.15 : 2.2,
                            },
                        }}
                        style={{
                            fontSize: isMobile ? 46 : 58,
                            fontWeight: 100,
                            lineHeight: 1,
                            color: levelColor,
                            fontFamily: "'Inter',sans-serif",
                            letterSpacing: "0.02em",
                            animation: "esc-number-glow 3s ease-in-out infinite",
                            willChange: "transform",
                        }}
                    >
                        0
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.4,
                            delay: reduce ? 0.3 : 2.6,
                        }}
                        style={{
                            fontSize: 8,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.32)",
                            fontFamily: "'Inter',sans-serif",
                            marginTop: 4,
                        }}
                    >
                        Índice de Luz
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            /* 3.85: deja que el número se asiente solo (count
                               termina ~3.2, spring ~3.4) antes del sello. */
                            duration: 0.5,
                            delay: reduce ? 0.5 : 3.85,
                        }}
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: hx(levelColor, 0.85),
                            fontFamily: "'Inter',sans-serif",
                            marginTop: 10,
                            textShadow: `0 0 14px ${hx(levelColor, 0.45)}`,
                        }}
                    >
                        Ciclo Sellado
                    </motion.span>
                    <motion.div
                        initial={{ scaleX: reduce ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: reduce ? 0.5 : 4.0,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            height: 1.5,
                            width: "min(220px, 52vw)",
                            marginTop: 8,
                            transformOrigin: "center",
                            background: `linear-gradient(90deg,transparent,${levelColor},transparent)`,
                        }}
                    />
                </div>
            </div>

            {/* C. DESTELLO SCREEN (beat3) — el mixBlendMode vive en HTML. */}
            {!reduce && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ duration: 0.55, delay: 2.25 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 50% 46%, ${hx(levelColor, 0.5)} 0%, transparent 60%)`,
                        /* 'lighten' (no 'screen'): ~equivalente sobre fondo
                           oscuro pero sin el multi-pass per-pixel caro de
                           'screen' en WKWebView iOS de gama baja. */
                        mixBlendMode: "lighten",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* F. SKIP-CATCHER — tap en cualquier lado salta. */}
            <div
                role="button"
                aria-label="Saltar ceremonia"
                onPointerDown={skip}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "transparent",
                    touchAction: "manipulation",
                    cursor: "pointer",
                }}
            >
                {/* "Toca para continuar" eliminado: la ceremonia auto-completa
                    a ~5.2s (no espera tap). El tap-para-saltar sigue activo,
                    sin texto que sugiera una espera que no existe. */}
            </div>
        </motion.div>
    )

    if (typeof document === "undefined") return null
    return createPortal(content, document.body)
}
