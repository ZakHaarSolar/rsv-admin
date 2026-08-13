// TimbreSpaceGraphVisualizer.tsx
// Code Component para Framer – Visualizador “Timbre-Space Graph”
// Canvas 2D + Web Audio (AudioContext + AnalyserNode)

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

type Status = "idle" | "loading" | "ready" | "error"

interface NodeData {
    id: number
    time: number // segundos desde inicio del audio
    pitchHz: number
    energy: number // RMS absoluto
    energyNorm: number // 0–1
    centroidHz: number
    centroidNorm: number // 0–1
    spreadNorm: number // 0–1
    fluxNorm: number // 0–1
    yNorm: number // 0–1 (0 = arriba)
    jitterSeed: number
}

interface TimbreSpaceGraphVisualizerProps {
    backgroundColor?: string
    accentColor?: string
    glowIntensity?: number
    nodeLimit?: number
    showBreathGuide?: boolean
}

// ──────────────────────────────────────────────
// Utilidades
// ──────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0")
    return `${m}:${s}`
}

const computeRMS = (buffer: Float32Array): number => {
    let sum = 0
    const n = buffer.length
    for (let i = 0; i < n; i++) {
        const v = buffer[i]
        sum += v * v
    }
    return n > 0 ? Math.sqrt(sum / n) : 0
}

/**
 * Estimación sencilla de pitch via autocorrelación.
 */
const estimatePitch = (
    buffer: Float32Array,
    sampleRate: number
): number | null => {
    const n = buffer.length
    if (!n) return null

    // quitar DC y normalizar
    let mean = 0
    for (let i = 0; i < n; i++) mean += buffer[i]
    mean /= n
    let max = 0
    for (let i = 0; i < n; i++) {
        const v = buffer[i] - mean
        buffer[i] = v
        max = Math.max(max, Math.abs(v))
    }
    if (max < 1e-6) return null
    for (let i = 0; i < n; i++) buffer[i] /= max

    const minFreq = 150
    const maxFreq = 8000
    const minLag = Math.floor(sampleRate / maxFreq)
    const maxLag = Math.floor(sampleRate / minFreq)
    if (maxLag >= n) return null

    let bestLag = -1
    let bestCorr = 0

    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0
        for (let i = 0; i < n - lag; i++) {
            corr += buffer[i] * buffer[i + lag]
        }
        if (corr > bestCorr) {
            bestCorr = corr
            bestLag = lag
        }
    }

    if (bestLag === -1 || bestCorr < 0.1) return null
    const freq = sampleRate / bestLag
    if (!isFinite(freq) || freq <= 0) return null
    return freq
}

interface SpectralFeatures {
    centroidHz: number
    spreadNorm: number
    fluxNorm: number
    magnitudes: Float32Array
}

/**
 * dB → centroid, spreadNorm, fluxNorm
 */
const computeSpectralFeatures = (
    freqDb: Float32Array,
    sampleRate: number,
    prevMagnitudes: Float32Array | null
): SpectralFeatures => {
    const n = freqDb.length
    const nyquist = sampleRate / 2
    const mags = new Float32Array(n)

    let sumMag = 0
    let centroidNum = 0
    let fluxSum = 0

    for (let i = 0; i < n; i++) {
        const db = freqDb[i]
        const mag = db <= -100 || !isFinite(db) ? 0 : Math.pow(10, db / 20)
        mags[i] = mag
        sumMag += mag
        const freq = (i / n) * nyquist
        centroidNum += mag * freq

        if (prevMagnitudes && prevMagnitudes.length === n) {
            const diff = mag - prevMagnitudes[i]
            if (diff > 0) fluxSum += diff * diff
        }
    }

    const centroidHz = sumMag > 0 ? centroidNum / sumMag : 0

    // spread normalizado heurístico
    let spreadNum = 0
    if (sumMag > 0 && centroidHz > 0) {
        for (let i = 0; i < n; i++) {
            const freq = (i / n) * nyquist
            const diff = freq - centroidHz
            spreadNum += mags[i] * diff * diff
        }
    }
    const spread = sumMag > 0 ? Math.sqrt(spreadNum / sumMag) : 0
    const maxSpread = nyquist
    const spreadNorm = clamp(spread / maxSpread, 0, 1)

    const flux = Math.sqrt(fluxSum / Math.max(n, 1))
    const fluxNorm = clamp(flux * 10, 0, 1)

    return { centroidHz, spreadNorm, fluxNorm, magnitudes: mags }
}

/**
 * Pitch → Y normalizado (0 arriba, 1 abajo)
 */
const pitchToYNorm = (pitchHz: number, fallbackCentroidHz: number = 2000) => {
    const p = pitchHz > 0 ? pitchHz : fallbackCentroidHz || 1000
    const minHz = 200
    const maxHz = 8000
    const clamped = clamp(p, minHz, maxHz)
    const logMin = Math.log(minHz)
    const logMax = Math.log(maxHz)
    const logP = Math.log(clamped)
    const norm = (logP - logMin) / (logMax - logMin)
    return clamp(1 - norm, 0, 1)
}

/**
 * Centroid → color bioluminiscente verde→amarillo→naranja→rojo
 */
const centroidToColor = (
    centroidHz: number,
    sampleRate: number,
    energyNorm: number
): string => {
    const nyquist = sampleRate / 2 || 1
    const norm = clamp(centroidHz / nyquist, 0, 1)

    const stops: [number, number, number][] = [
        [80, 255, 180], // verde
        [235, 255, 135], // amarillo
        [255, 190, 80], // naranja
        [255, 80, 80], // rojo
    ]

    let base: [number, number, number]
    if (norm < 1 / 3) {
        const t = norm / (1 / 3)
        base = [
            lerp(stops[0][0], stops[1][0], t),
            lerp(stops[0][1], stops[1][1], t),
            lerp(stops[0][2], stops[1][2], t),
        ]
    } else if (norm < 2 / 3) {
        const t = (norm - 1 / 3) / (1 / 3)
        base = [
            lerp(stops[1][0], stops[2][0], t),
            lerp(stops[1][1], stops[2][1], t),
            lerp(stops[1][2], stops[2][2], t),
        ]
    } else {
        const t = (norm - 2 / 3) / (1 / 3)
        base = [
            lerp(stops[2][0], stops[3][0], t),
            lerp(stops[2][1], stops[3][1], t),
            lerp(stops[2][2], stops[3][2], t),
        ]
    }

    const boost = energyNorm * 0.18
    const r = Math.round(lerp(base[0], 255, boost))
    const g = Math.round(lerp(base[1], 255, boost))
    const b = Math.round(lerp(base[2], 255, boost))
    return `rgb(${r}, ${g}, ${b})`
}

// ──────────────────────────────────────────────
// UI: Receptor Cimático + Respiración
// ──────────────────────────────────────────────

interface CymaticDropProps {
    status: Status
    onFileSelected: (file: File) => void
}

const CymaticDrop: React.FC<CymaticDropProps> = ({
    status,
    onFileSelected,
}) => {
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onFileSelected(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) onFileSelected(file)
    }

    const handleClick = () => inputRef.current?.click()

    return (
        <motion.div
            onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragActive(true)
            }}
            onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragActive(false)
            }}
            onDrop={handleDrop}
            onClick={handleClick}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: dragActive ? 1.05 : [0.98, 1.02, 0.98],
                opacity: 1,
            }}
            transition={{
                scale: dragActive
                    ? { type: "spring", stiffness: 260, damping: 24 }
                    : {
                          repeat: Infinity,
                          repeatType: "mirror",
                          duration: 4.5,
                          ease: "easeInOut",
                      },
                opacity: { duration: 0.5 },
            }}
            style={{
                width: "42vh",
                height: "42vh",
                maxWidth: "60%",
                maxHeight: "70%",
                borderRadius: 999,
                position: "relative",
                cursor: "pointer",
                border: dragActive
                    ? "1.5px solid rgba(92,255,154,0.9)"
                    : "1px solid rgba(92,255,154,0.6)",
                background:
                    "radial-gradient(circle at 30% 20%, rgba(92,255,154,0.4), transparent 60%), radial-gradient(circle at 70% 80%, rgba(61,228,209,0.6), transparent 65%), radial-gradient(circle at 50% 50%, rgba(13,26,22,1), rgba(5,6,8,1) 70%)",
                boxShadow:
                    "0 0 40px rgba(92,255,154,0.45), 0 0 120px rgba(61,228,209,0.35)",
                overflow: "hidden",
                backdropFilter: "blur(18px)",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: "-40%",
                    borderRadius: 999,
                    background:
                        "radial-gradient(circle, rgba(92,255,154,0.14), transparent 65%)",
                }}
                animate={{
                    scale: dragActive ? [1, 1.08, 1] : [1, 1.06, 1],
                    opacity: dragActive ? [0.7, 0.95, 0.7] : [0.35, 0.6, 0.35],
                }}
                transition={{
                    duration: dragActive ? 0.8 : 6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                }}
            />
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        fontSize: 14,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "rgba(163,255,210,0.85)",
                        marginBottom: 8,
                    }}
                >
                    Receptor Cimático
                </div>
                <div
                    style={{
                        fontSize: 18,
                        lineHeight: 1.4,
                        color: "rgba(240,255,248,0.95)",
                        maxWidth: 360,
                    }}
                >
                    Arrastra aquí el canto del pájaro.
                    <br />
                    <span
                        style={{
                            color: "rgba(140,255,200,0.95)",
                        }}
                    >
                        Lo convertiremos en un mapa del timbre.
                    </span>
                </div>
                <div
                    style={{
                        marginTop: 16,
                        fontSize: 12,
                        color: "rgba(185,255,226,0.85)",
                    }}
                >
                    {status === "loading"
                        ? "Activando el espacio del timbre…"
                        : "Acepta .wav / .mp3 y otros audios estándar."}
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
        </motion.div>
    )
}

interface BreathToggleProps {
    active: boolean
    onToggle: () => void
}

const BreathToggle: React.FC<BreathToggleProps> = ({ active, onToggle }) => (
    <button
        onClick={onToggle}
        style={{
            minWidth: 54,
            height: 26,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            padding: 2,
            background: active
                ? "linear-gradient(135deg, rgba(92,255,154,0.9), rgba(61,228,209,0.7))"
                : "rgba(20,50,36,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: active ? "flex-end" : "flex-start",
            boxShadow: active
                ? "0 0 16px rgba(92,255,154,0.9)"
                : "0 0 8px rgba(0,0,0,0.6)",
            transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
    >
        <div
            style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                backgroundColor: active ? "#050608" : "#5CFF9A",
            }}
        />
    </button>
)

interface BreathCircleProps {
    active: boolean
}

const BreathCircle: React.FC<BreathCircleProps> = ({ active }) => (
    <motion.div
        initial={{ scale: 0.85, opacity: 0.4 }}
        animate={
            active
                ? { scale: [0.9, 1.1, 0.9], opacity: [0.5, 0.9, 0.5] }
                : { scale: 0.85, opacity: 0.25 }
        }
        transition={
            active
                ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
        }
        style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            border: "1px solid rgba(118,230,190,0.8)",
            boxShadow:
                "0 0 16px rgba(92,255,154,0.5), 0 0 44px rgba(61,228,209,0.4)",
            background:
                "radial-gradient(circle, rgba(92,255,154,0.3), rgba(5,6,8,0.85))",
        }}
    />
)

// ──────────────────────────────────────────────
// Canvas del grafo de timbre
// ──────────────────────────────────────────────

interface GraphCanvasProps {
    nodes: NodeData[]
    currentTime: number
    breathing: boolean
    accentColor: string
    glowIntensity: number
    onNodeSelected: (id: number | null) => void
    selectedNodeId: number | null
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
    nodes,
    currentTime,
    breathing,
    accentColor,
    glowIntensity,
    onNodeSelected,
    selectedNodeId,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationRef = useRef<number | null>(null)

    const nodesRef = useRef<NodeData[]>(nodes)
    const currentTimeRef = useRef(currentTime)
    const breathingRef = useRef(breathing)
    const accentColorRef = useRef(accentColor)
    const glowRef = useRef(glowIntensity)
    const selectedNodeIdRef = useRef<number | null>(selectedNodeId)
    const projectedRef = useRef<
        { id: number; x: number; y: number; radius: number }[]
    >([])

    useEffect(() => {
        nodesRef.current = nodes
    }, [nodes])

    useEffect(() => {
        currentTimeRef.current = currentTime
    }, [currentTime])

    useEffect(() => {
        breathingRef.current = breathing
    }, [breathing])

    useEffect(() => {
        accentColorRef.current = accentColor
    }, [accentColor])

    useEffect(() => {
        glowRef.current = glowIntensity
    }, [glowIntensity])

    useEffect(() => {
        selectedNodeIdRef.current = selectedNodeId
    }, [selectedNodeId])

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        let lastWidth = 0
        let lastHeight = 0

        const resize = () => {
            const rect = container.getBoundingClientRect()
            const w = rect.width || 1
            const h = rect.height || 1
            lastWidth = w
            lastHeight = h
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        resize()
        const handleResize = () => resize()
        window.addEventListener("resize", handleResize)

        const windowSeconds = 8

        const render = () => {
            const rect = container.getBoundingClientRect()
            const width = rect.width || 1
            const height = rect.height || 1
            if (width !== lastWidth || height !== lastHeight) {
                resize()
            }

            ctx.clearRect(0, 0, width, height)

            // fondo
            const bgGrad = ctx.createRadialGradient(
                width * 0.2,
                height * 0.1,
                0,
                width * 0.5,
                height * 0.55,
                Math.max(width, height) * 0.9
            )
            bgGrad.addColorStop(0, "rgba(20,60,40,0.65)")
            bgGrad.addColorStop(0.5, "rgba(5,8,10,0.95)")
            bgGrad.addColorStop(1, "rgba(2,4,6,1)")
            ctx.fillStyle = bgGrad
            ctx.fillRect(0, 0, width, height)

            const nodesLocal = nodesRef.current
            if (!nodesLocal.length) {
                animationRef.current = requestAnimationFrame(render)
                return
            }

            const now = performance.now() / 1000
            const tAudio = currentTimeRef.current || 0

            const windowEnd = tAudio
            const windowStart = Math.max(0, windowEnd - windowSeconds)
            const windowDur =
                windowEnd > 0
                    ? windowEnd - windowStart || windowSeconds
                    : windowSeconds

            const centerX = width / 2
            const centerY = height / 2
            const paddingX = width * 0.06
            const paddingY = height * 0.1

            const breathScale =
                breathingRef.current && isFinite(now)
                    ? 1 + Math.sin((now / 7) * Math.PI * 2 - Math.PI / 2) * 0.14
                    : 1

            const jitterBase = 22
            const glowFactor = glowRef.current || 1

            const projected: {
                id: number
                x: number
                y: number
                radius: number
                depth: number
                node: NodeData
            }[] = []

            for (const node of nodesLocal) {
                if (node.time < windowStart || node.time > windowEnd) continue

                const tNorm = (node.time - windowStart) / windowDur

                // Orbita ligera: mapeamos tNorm a una elipse base
                const orbitAngle = tNorm * Math.PI * 1.8
                const orbitRadius = 0.3 + node.centroidNorm * 0.7
                let xBase =
                    centerX +
                    Math.cos(orbitAngle) * (width * 0.25 * orbitRadius)
                let yBase =
                    centerY +
                    Math.sin(orbitAngle) * (height * 0.2 * orbitRadius)

                // Mezcla con timeline lineal para no perder la intuición de X = tiempo
                const xLinear = paddingX + tNorm * (width - paddingX * 2)
                let x = lerp(xLinear, xBase, 0.45)
                let y = paddingY + node.yNorm * (height - paddingY * 2)
                y = lerp(y, yBase, 0.35 + node.spreadNorm * 0.3)

                // respiración
                const dx = x - centerX
                const dy = y - centerY
                x = centerX + dx * breathScale
                y = centerY + dy * breathScale

                // jitter según flux
                const jitterAmp =
                    jitterBase * node.fluxNorm * (0.4 + 0.6 * node.spreadNorm)
                const jx = Math.sin(now * 2.3 + node.jitterSeed) * jitterAmp
                const jy =
                    Math.cos(now * 1.9 + node.jitterSeed * 1.37) *
                    jitterAmp *
                    0.6
                x += jx
                y += jy

                const depth =
                    0.3 + node.centroidNorm * 0.4 + node.spreadNorm * 0.3

                const radius =
                    (3 + 10 * node.energyNorm) *
                    (0.7 + depth * 0.7) *
                    (0.8 + node.fluxNorm * 0.4)

                projected.push({ id: node.id, x, y, radius, depth, node })
            }

            projectedRef.current = projected.map((p) => ({
                id: p.id,
                x: p.x,
                y: p.y,
                radius: p.radius,
            }))

            if (!projected.length) {
                animationRef.current = requestAnimationFrame(render)
                return
            }

            // ordenar por profundidad
            projected.sort((a, b) => a.depth - b.depth)

            ctx.save()
            ctx.globalCompositeOperation = "lighter"

            // conexiones
            ctx.lineCap = "round"

            // línea principal (orden temporal)
            ctx.strokeStyle = "rgba(140,255,210,0.45)"
            ctx.lineWidth = 1.1
            ctx.beginPath()
            for (let i = 0; i < projected.length; i++) {
                const p = projected[i]
                if (i === 0) ctx.moveTo(p.x, p.y)
                else ctx.lineTo(p.x, p.y)
            }
            ctx.stroke()

            // conexiones de constelación (tiempo+pitch cercanos)
            ctx.strokeStyle = "rgba(90,230,210,0.35)"
            ctx.lineWidth = 0.7
            for (let i = 0; i < projected.length; i++) {
                const a = projected[i]
                const aNode = a.node
                for (let j = i + 1; j < projected.length; j++) {
                    const b = projected[j]
                    const dt = Math.abs(b.node.time - aNode.time)
                    if (dt > 0.9) break
                    const dp = Math.abs(b.node.yNorm - aNode.yNorm)
                    if (dp < 0.2) {
                        const rel = 1 - dt / 0.9 - dp * 0.6
                        if (rel <= 0) continue
                        const alpha = 0.08 + 0.32 * rel
                        ctx.globalAlpha = alpha
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.stroke()
                    }
                }
            }

            // nodos
            for (const p of projected) {
                const n = p.node
                const baseColor = centroidToColor(
                    n.centroidHz,
                    44100,
                    n.energyNorm
                )
                const isSelected = p.id === selectedNodeIdRef.current

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.fillStyle = baseColor
                ctx.shadowColor = baseColor
                ctx.shadowBlur =
                    (14 + 14 * n.energyNorm) *
                    (0.6 + p.depth * 0.7) *
                    glowFactor *
                    (isSelected ? 1.4 : 1)
                ctx.globalAlpha =
                    0.55 + n.energyNorm * 0.35 + (isSelected ? 0.1 : 0)
                ctx.fill()
            }

            // cursor de luz
            const accent = accentColorRef.current || "#5CFF9A"
            let active: (typeof projected)[0] | null = null
            let minDt = Infinity
            for (const p of projected) {
                const dt = Math.abs(p.node.time - tAudio)
                if (dt < minDt) {
                    minDt = dt
                    active = p
                }
            }

            if (active) {
                const pulse =
                    1 +
                    Math.sin(now * 4 + active.node.energyNorm * 4) * 0.2 +
                    active.node.energyNorm * 0.4
                const cr = active.radius * (0.7 + 0.4 * pulse)

                // línea vertical
                const x = active.x
                const grad = ctx.createLinearGradient(
                    x,
                    paddingY * 0.4,
                    x,
                    height - paddingY * 0.4
                )
                grad.addColorStop(0, "rgba(150,255,220,0)")
                grad.addColorStop(0.3, "rgba(150,255,220,0.2)")
                grad.addColorStop(0.7, "rgba(150,255,220,0.2)")
                grad.addColorStop(1, "rgba(150,255,220,0)")
                ctx.globalAlpha = 0.8
                ctx.strokeStyle = grad
                ctx.lineWidth = 1.4
                ctx.beginPath()
                ctx.moveTo(x, paddingY * 0.4)
                ctx.lineTo(x, height - paddingY * 0.4)
                ctx.stroke()

                // halo
                ctx.beginPath()
                ctx.arc(active.x, active.y, cr, 0, Math.PI * 2)
                ctx.strokeStyle = accent
                ctx.shadowColor = accent
                ctx.shadowBlur = 24 * glowFactor
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.95
                ctx.stroke()

                // pequeños textos sobre cursor
                ctx.globalAlpha = 0.95
                ctx.shadowBlur = 0
                ctx.font =
                    "9px system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
                ctx.textBaseline = "bottom"
                ctx.textAlign = "left"
                ctx.fillStyle = "rgba(240,255,250,0.96)"
                const lines = [
                    `t ≈ ${active.node.time.toFixed(2)} s`,
                    `f₀ ${
                        active.node.pitchHz > 0
                            ? `${Math.round(active.node.pitchHz)} Hz`
                            : "—"
                    }`,
                    `centroid ${Math.round(active.node.centroidHz)} Hz`,
                ]
                let y = active.y - cr - 3
                const xText = active.x + cr + 6
                for (const line of lines) {
                    ctx.fillText(line, xText, y)
                    y -= 10
                }
            }

            ctx.restore()

            animationRef.current = requestAnimationFrame(render)
        }

        animationRef.current = requestAnimationFrame(render)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (animationRef.current != null) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    // selección de nodo por click
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const projected = projectedRef.current

            let closestId: number | null = null
            let minDist2 = Infinity

            for (const p of projected) {
                const dx = x - p.x
                const dy = y - p.y
                const d2 = dx * dx + dy * dy
                const r = p.radius * 1.6
                if (d2 < r * r && d2 < minDist2) {
                    minDist2 = d2
                    closestId = p.id
                }
            }

            onNodeSelected(closestId)
        }

        canvas.addEventListener("click", handleClick)
        return () => {
            canvas.removeEventListener("click", handleClick)
        }
    }, [onNodeSelected])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

// ──────────────────────────────────────────────
// Panel de control
// ──────────────────────────────────────────────

interface ControlPanelProps {
    status: Status
    isPlaying: boolean
    progress: number
    duration: number
    breathing: boolean
    onToggleBreathing: () => void
    onTogglePlay: () => void
    onSeek: (value: number) => void
    showBreathGuide: boolean
    errorMessage: string | null
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    status,
    isPlaying,
    progress,
    duration,
    breathing,
    onToggleBreathing,
    onTogglePlay,
    onSeek,
    showBreathGuide,
    errorMessage,
}) => {
    const currentTime = progress * (duration || 1)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                padding: "22px 22px 26px 22px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid rgba(40,90,65,0.9)",
                background:
                    "radial-gradient(circle at 0% 0%, rgba(30,80,60,0.35), transparent 55%), radial-gradient(circle at 100% 100%, rgba(10,40,25,0.8), rgba(5,6,8,1) 60%)",
                backdropFilter: "blur(18px)",
            }}
        >
            <div style={{ marginBottom: 18 }}>
                <div
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "rgba(147,255,203,0.8)",
                        marginBottom: 4,
                    }}
                >
                    Timbre-Space Graph
                </div>
                <div
                    style={{
                        fontSize: 18,
                        lineHeight: 1.35,
                        color: "rgba(237,255,246,0.95)",
                    }}
                >
                    Mapa Constelación de Canto
                </div>
                <div
                    style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "rgba(177,235,210,0.8)",
                    }}
                >
                    Cada nodo es un frame: tiempo en X, pitch en Y, brillo en el
                    color y vibración en el jitter.
                </div>
            </div>

            <div
                style={{
                    borderRadius: 16,
                    padding: "10px 12px",
                    marginBottom: 14,
                    border: "1px solid rgba(90,150,120,0.9)",
                    background:
                        "radial-gradient(circle at 10% 0%, rgba(60,120,90,0.5), rgba(8,18,14,0.96))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "rgba(195,250,220,0.9)",
                        }}
                    >
                        Respirar con la Geometría
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "rgba(160,220,195,0.85)",
                            marginTop: 2,
                        }}
                    >
                        La constelación late contigo: expande al inhalar,
                        condensa al exhalar.
                    </div>
                </div>
                <BreathToggle active={breathing} onToggle={onToggleBreathing} />
            </div>

            {showBreathGuide && (
                <div
                    style={{
                        height: 80,
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <BreathCircle active={breathing} />
                </div>
            )}

            <div
                style={{
                    borderRadius: 16,
                    padding: "12px 14px",
                    border: "1px solid rgba(75,130,100,0.95)",
                    background:
                        "linear-gradient(135deg, rgba(6,16,12,0.97), rgba(10,24,18,0.97))",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <button
                        onClick={onTogglePlay}
                        disabled={status === "idle" || status === "error"}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            border: "none",
                            outline: "none",
                            background:
                                status === "idle" || status === "error"
                                    ? "rgba(24,40,32,0.9)"
                                    : "radial-gradient(circle at 30% 20%, rgba(92,255,154,0.9), rgba(32,80,56,1))",
                            boxShadow:
                                status === "idle" || status === "error"
                                    ? "0 0 10px rgba(0,0,0,0.7)"
                                    : "0 0 22px rgba(92,255,154,0.7), 0 0 60px rgba(61,228,209,0.5)",
                            cursor:
                                status === "idle" || status === "error"
                                    ? "default"
                                    : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#050608",
                            padding: 0,
                            opacity:
                                status === "idle" || status === "error"
                                    ? 0.6
                                    : 1,
                        }}
                    >
                        {isPlaying ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 4,
                                }}
                            >
                                <span
                                    style={{
                                        width: 3,
                                        height: 14,
                                        borderRadius: 6,
                                        backgroundColor: "#050608",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 14,
                                        borderRadius: 6,
                                        backgroundColor: "#050608",
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: "7px solid transparent",
                                    borderBottom: "7px solid transparent",
                                    borderLeft: "11px solid #050608",
                                    marginLeft: 2,
                                }}
                            />
                        )}
                    </button>

                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                        }}
                    >
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={Math.round(clamp(progress, 0, 1) * 1000)}
                            onChange={(e) =>
                                onSeek(Number(e.target.value) / 1000 || 0)
                            }
                            style={{
                                width: "100%",
                                appearance: "none",
                                height: 4,
                                borderRadius: 999,
                                background:
                                    "linear-gradient(to right, rgba(92,255,154,0.9), rgba(61,228,209,0.4))",
                                outline: "none",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 11,
                                color: "rgba(165,220,195,0.85)",
                            }}
                        >
                            <span>{formatTime(currentTime)}</span>
                            <span>
                                {duration ? formatTime(duration) : "0:00"}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 11,
                        color: "rgba(150,215,190,0.8)",
                    }}
                >
                    {status === "idle" &&
                        "Carga un canto para desplegar el mapa dinámico del timbre."}
                    {status === "loading" &&
                        "Preparando la señal… el grafo se sincronizará con el tiempo real."}
                    {status === "ready" &&
                        "Pulsa Play: el cursor de luz recorrerá la constelación en tiempo real."}
                    {status === "error" &&
                        "Algo en el archivo no resonó con el analizador. Prueba con otro audio."}
                </div>

                {errorMessage && (
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: "rgba(255,180,200,0.95)",
                            padding: "6px 8px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, rgba(60,10,22,0.85), rgba(20,3,10,0.95))",
                            border: "1px solid rgba(255,120,160,0.5)",
                        }}
                    >
                        {errorMessage}
                    </div>
                )}
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────

export function TimbreSpaceGraphVisualizer(
    props: TimbreSpaceGraphVisualizerProps
) {
    const {
        backgroundColor,
        accentColor,
        glowIntensity,
        nodeLimit,
        showBreathGuide,
    } = {
        ...TimbreSpaceGraphVisualizer.defaultProps,
        ...props,
    }

    const [status, setStatus] = useState<Status>("idle")
    const [nodes, setNodes] = useState<NodeData[]>([])
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [breathing, setBreathing] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
    const [analysisActive, setAnalysisActive] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

    const timeDataRef = useRef<Float32Array | null>(null)
    const freqDataRef = useRef<Float32Array | null>(null)
    const prevMagRef = useRef<Float32Array | null>(null)

    const nodesRef = useRef<NodeData[]>([])
    const nextNodeIdRef = useRef(0)

    const maxEnergyRef = useRef(0.001)
    const durationRef = useRef(0)

    const isPlayingRef = useRef(false)
    const nodeLimitRef = useRef(nodeLimit || 2000)

    useEffect(() => {
        durationRef.current = duration
    }, [duration])

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        nodeLimitRef.current = nodeLimit || 2000
    }, [nodeLimit])

    const ensureAudioContext = useCallback((): AudioContext | null => {
        if (typeof window === "undefined") return null
        if (!audioContextRef.current) {
            const AC =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (!AC) return null
            audioContextRef.current = new AC()
        }
        return audioContextRef.current
    }, [])

    const connectAnalyser = useCallback(() => {
        const audioEl = audioRef.current
        const ctx = audioContextRef.current
        if (!audioEl || !ctx) return

        if (!analyserRef.current) {
            const source = ctx.createMediaElementSource(audioEl)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 2048
            analyser.smoothingTimeConstant = 0.8
            source.connect(analyser)
            analyser.connect(ctx.destination)
            analyserRef.current = analyser
            sourceRef.current = source
            timeDataRef.current = new Float32Array(analyser.fftSize)
            freqDataRef.current = new Float32Array(analyser.frequencyBinCount)
            prevMagRef.current = null
        }
        setAnalysisActive(true)
    }, [])

    const handleFileSelected = (file: File) => {
        if (!file.type.startsWith("audio/")) {
            setErrorMessage("Solo acepto archivos de audio (wav, mp3, etc.).")
            setStatus("error")
            return
        }

        if (audioUrl) URL.revokeObjectURL(audioUrl)

        setStatus("loading")
        setErrorMessage(null)
        setProgress(0)
        setDuration(0)
        setIsPlaying(false)
        setSelectedNodeId(null)
        setNodes([])
        nodesRef.current = []
        nextNodeIdRef.current = 0
        maxEnergyRef.current = 0.001
        setAnalysisActive(false)

        const url = URL.createObjectURL(file)
        setAudioUrl(url)
    }

    // eventos del <audio>
    useEffect(() => {
        const audioEl = audioRef.current
        if (!audioEl) return

        const handleLoadedMetadata = () => {
            if (!isNaN(audioEl.duration)) {
                setDuration(audioEl.duration || 0)
                setStatus("ready")
            }
        }

        const handleTimeUpdate = () => {
            const dur = durationRef.current || audioEl.duration || 0
            if (!dur) return
            const t = audioEl.currentTime
            const p = t / dur
            setProgress(clamp(p, 0, 1))
        }

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleEnded = () => {
            setIsPlaying(false)
            setProgress(1)
        }

        audioEl.addEventListener("loadedmetadata", handleLoadedMetadata)
        audioEl.addEventListener("timeupdate", handleTimeUpdate)
        audioEl.addEventListener("play", handlePlay)
        audioEl.addEventListener("pause", handlePause)
        audioEl.addEventListener("ended", handleEnded)

        return () => {
            audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audioEl.removeEventListener("timeupdate", handleTimeUpdate)
            audioEl.removeEventListener("play", handlePlay)
            audioEl.removeEventListener("pause", handlePause)
            audioEl.removeEventListener("ended", handleEnded)
        }
    }, [audioUrl])

    // loop de análisis (nodos) — se activa al tener analyser
    useEffect(() => {
        if (!analysisActive) return
        const analyser = analyserRef.current
        const ctx = audioContextRef.current
        const audioEl = audioRef.current
        if (!analyser || !ctx || !audioEl) return

        let timeData = timeDataRef.current || new Float32Array(analyser.fftSize)
        let freqData =
            freqDataRef.current || new Float32Array(analyser.frequencyBinCount)
        let prevMag = prevMagRef.current

        let rafId: number

        const loop = () => {
            const analyser = analyserRef.current
            const ctxLocal = audioContextRef.current
            const audio = audioRef.current
            if (!analyser || !ctxLocal || !audio) {
                rafId = requestAnimationFrame(loop)
                return
            }

            if (!audio.paused && !audio.ended && audio.readyState >= 2) {
                if (!timeData || timeData.length !== analyser.fftSize) {
                    timeData = new Float32Array(analyser.fftSize)
                    timeDataRef.current = timeData
                }
                if (
                    !freqData ||
                    freqData.length !== analyser.frequencyBinCount
                ) {
                    freqData = new Float32Array(analyser.frequencyBinCount)
                    freqDataRef.current = freqData
                }

                analyser.getFloatTimeDomainData(timeData)
                analyser.getFloatFrequencyData(freqData)

                const rms = computeRMS(timeData)
                maxEnergyRef.current = Math.max(
                    maxEnergyRef.current,
                    rms || 1e-4
                )
                const energyNorm = clamp(
                    Math.sqrt(rms / maxEnergyRef.current),
                    0,
                    1
                )

                const pitch =
                    estimatePitch(timeData.slice(), ctxLocal.sampleRate) || 0

                const spec = computeSpectralFeatures(
                    freqData,
                    ctxLocal.sampleRate,
                    prevMag
                )
                prevMag = spec.magnitudes
                prevMagRef.current = prevMag

                const centroidHz = spec.centroidHz
                const centroidNorm = clamp(
                    centroidHz / (ctxLocal.sampleRate / 2 || 1),
                    0,
                    1
                )
                const spreadNorm = spec.spreadNorm
                const fluxNorm = spec.fluxNorm

                const yNorm = pitchToYNorm(pitch, centroidHz)
                const node: NodeData = {
                    id: nextNodeIdRef.current++,
                    time: audio.currentTime || 0,
                    pitchHz: pitch,
                    energy: rms,
                    energyNorm,
                    centroidHz,
                    centroidNorm,
                    spreadNorm,
                    fluxNorm,
                    yNorm,
                    jitterSeed: Math.random() * Math.PI * 2,
                }

                setStatus("ready")

                setNodes((prev) => {
                    const limit = nodeLimitRef.current || 2000
                    const arr = prev.length ? [...prev, node] : [node]
                    if (arr.length > limit) {
                        arr.splice(0, arr.length - limit)
                    }
                    nodesRef.current = arr
                    return arr
                })
            }

            rafId = requestAnimationFrame(loop)
        }

        rafId = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(rafId)
        }
    }, [analysisActive, nodeLimit])

    const handleTogglePlay = async () => {
        const audioEl = audioRef.current
        if (!audioEl || !audioUrl) return

        const ctx = ensureAudioContext()
        if (!ctx) {
            setErrorMessage("AudioContext no disponible en este navegador.")
            setStatus("error")
            return
        }

        if (ctx.state === "suspended") {
            try {
                await ctx.resume()
            } catch (err) {
                console.error(err)
            }
        }

        connectAnalyser()

        if (audioEl.paused || audioEl.ended) {
            try {
                await audioEl.play()
                setIsPlaying(true)
            } catch (err) {
                console.error(err)
                setErrorMessage(
                    "No pude iniciar la reproducción. Comprueba permisos de audio/autoplay."
                )
            }
        } else {
            audioEl.pause()
            setIsPlaying(false)
        }
    }

    const handleSeek = (value: number) => {
        const p = clamp(value, 0, 1)
        const audioEl = audioRef.current
        const dur = durationRef.current
        if (!audioEl || !dur) {
            setProgress(p)
            return
        }
        audioEl.currentTime = p * dur
        setProgress(p)
    }

    const handleToggleBreathing = () => {
        setBreathing((prev) => !prev)
    }

    const handleNodeSelected = (id: number | null) => {
        setSelectedNodeId(id)
    }

    // limpieza
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [audioUrl])

    const hasGraph = nodes.length > 0

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                color: "#F0FFF7",
                position: "relative",
                overflow: "hidden",
                fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}
        >
            {/* atmósfera global */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                        "radial-gradient(circle at 0% 0%, rgba(30,70,50,0.7), transparent 55%), radial-gradient(circle at 100% 100%, rgba(10,30,22,0.9), rgba(5,6,8,1) 60%)",
                    opacity: 0.9,
                }}
            />

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "row",
                    boxSizing: "border-box",
                    padding: 20,
                    gap: 16,
                }}
            >
                {/* zona gráfica */}
                <div
                    style={{
                        flex: "0 0 65%",
                        height: "100%",
                        borderRadius: 22,
                        border: "1px solid rgba(65,120,95,0.95)",
                        background:
                            "radial-gradient(circle at 15% 0%, rgba(40,100,72,0.5), rgba(5,6,8,1) 60%)",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <GraphCanvas
                        nodes={nodes}
                        currentTime={progress * (duration || 1)}
                        breathing={breathing}
                        accentColor={accentColor || "#5CFF9A"}
                        glowIntensity={glowIntensity || 1}
                        onNodeSelected={handleNodeSelected}
                        selectedNodeId={selectedNodeId}
                    />

                    {/* Receptor grande solo cuando aún no hay nodos */}
                    {!hasGraph && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CymaticDrop
                                status={status}
                                onFileSelected={handleFileSelected}
                            />
                        </div>
                    )}
                </div>

                {/* panel derecho */}
                <div
                    style={{
                        flex: "0 0 35%",
                        height: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <ControlPanel
                        status={status}
                        isPlaying={isPlaying}
                        progress={progress}
                        duration={duration}
                        breathing={breathing}
                        onToggleBreathing={handleToggleBreathing}
                        onTogglePlay={handleTogglePlay}
                        onSeek={handleSeek}
                        showBreathGuide={!!showBreathGuide}
                        errorMessage={errorMessage}
                    />
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl ?? undefined}
                style={{ display: "none" }}
            />
        </div>
    )
}

// ──────────────────────────────────────────────
// Default props + Property Controls
// ──────────────────────────────────────────────

TimbreSpaceGraphVisualizer.defaultProps = {
    width: 1200,
    height: 675,
    backgroundColor: "#050608",
    accentColor: "#5CFF9A",
    glowIntensity: 1,
    nodeLimit: 2000,
    showBreathGuide: true,
}

addPropertyControls(TimbreSpaceGraphVisualizer, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#050608",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento",
        defaultValue: "#5CFF9A",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        min: 0.4,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    nodeLimit: {
        type: ControlType.Number,
        title: "Nodos máx.",
        min: 200,
        max: 4000,
        step: 100,
        defaultValue: 2000,
    },
    showBreathGuide: {
        type: ControlType.Boolean,
        title: "Guía respiración",
        defaultValue: true,
    },
})
