// RSV_LiquidPlasmaPortal.tsx
import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

/* ────────────────────────────────────────────────────────────
   Utils
   ──────────────────────────────────────────────────────────── */

const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r},${g},${b},${alpha})`
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t

/* ────────────────────────────────────────────────────────────
   Props
   ──────────────────────────────────────────────────────────── */

type Props = {
    audioFile: string
    primaryColor: string
    glowColor: string
    sensitivity: number
    smoothing: number
    maxPulse: number
    backgroundColor: string
}

export function RSV_LiquidPlasmaPortal(props: Props) {
    const {
        audioFile,
        primaryColor,
        glowColor,
        sensitivity,
        smoothing,
        maxPulse,
        backgroundColor,
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)

    const animationFrameRef = useRef<number | null>(null)

    const [isPlaying, setIsPlaying] = useState(false)

    // Valores suavizados de energía por banda
    const bassSmoothRef = useRef(0)
    const midSmoothRef = useRef(0)
    const trebleSmoothRef = useRef(0)

    /* ────────────────────────────────────────────────────────
       Actualizar <audio> cuando cambia el archivo
       ──────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.src = audioFile || ""
        setIsPlaying(false)
    }, [audioFile])

    /* ────────────────────────────────────────────────────────
       Arrancar el loop de animación SIEMPRE al montar
       ──────────────────────────────────────────────────────── */
    useEffect(() => {
        if (animationFrameRef.current != null) return

        const loop = () => {
            drawFrame()
            animationFrameRef.current = requestAnimationFrame(loop)
        }
        loop()

        return () => {
            if (animationFrameRef.current != null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /* ────────────────────────────────────────────────────────
       Play / Pause al hacer click
       ──────────────────────────────────────────────────────── */
    const handleTogglePlay = async () => {
        const audioEl = audioRef.current
        if (!audioEl) return
        if (!audioFile) return

        // Intentar inicializar Web Audio, pero SIN bloquear el play si falla
        if (!audioContextRef.current) {
            try {
                const AC =
                    (window as any).AudioContext ||
                    (window as any).webkitAudioContext
                if (AC) {
                    const ctx = new AC()
                    const analyser = ctx.createAnalyser()
                    analyser.fftSize = 2048
                    analyser.smoothingTimeConstant = Math.min(
                        Math.max(smoothing, 0),
                        0.95
                    )

                    const source = ctx.createMediaElementSource(audioEl)
                    source.connect(analyser)
                    analyser.connect(ctx.destination)

                    const bufferLength = analyser.frequencyBinCount
                    const dataArray = new Uint8Array(bufferLength)

                    audioContextRef.current = ctx
                    analyserRef.current = analyser
                    dataArrayRef.current = dataArray
                }
            } catch (e) {
                console.warn(
                    "No se pudo inicializar AudioContext, se usará solo animación base:",
                    e
                )
            }
        }

        const ctx = audioContextRef.current

        try {
            if (ctx && ctx.state === "suspended") {
                await ctx.resume()
            }

            if (audioEl.paused) {
                await audioEl.play()
                setIsPlaying(true)
            } else {
                audioEl.pause()
                setIsPlaying(false)
            }
        } catch (e) {
            console.warn("Error al reproducir el audio:", e)
            setIsPlaying(false)
        }
    }

    /* ────────────────────────────────────────────────────────
       Dibujo de cada frame
       ──────────────────────────────────────────────────────── */
    const drawFrame = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const rect = canvas.getBoundingClientRect()

        if (
            canvas.width !== rect.width * dpr ||
            canvas.height !== rect.height * dpr
        ) {
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const width = rect.width
        const height = rect.height

        // Fondo
        ctx.clearRect(0, 0, width, height)
        if (backgroundColor && backgroundColor !== "transparent") {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width, height)
        }

        // ───── Leer audio si hay Analyser ─────
        const analyser = analyserRef.current
        const dataArray = dataArrayRef.current

        let bassNorm = 0
        let midNorm = 0
        let trebleNorm = 0

        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray)
            const len = dataArray.length

            if (len > 0) {
                const bassEnd = Math.floor(len * 0.08)
                const midEnd = Math.floor(len * 0.5)
                const highEnd = len - 1

                let bassSum = 0
                for (let i = 0; i < bassEnd; i++) bassSum += dataArray[i]
                const bassAvg = bassSum / Math.max(bassEnd, 1)

                let midSum = 0
                for (let i = bassEnd; i < midEnd; i++) midSum += dataArray[i]
                const midAvg = midSum / Math.max(midEnd - bassEnd, 1)

                let trebleSum = 0
                for (let i = midEnd; i <= highEnd; i++)
                    trebleSum += dataArray[i]
                const trebleAvg = trebleSum / Math.max(highEnd - midEnd + 1, 1)

                const sens = Math.max(sensitivity, 0.1)
                bassNorm = Math.min((bassAvg / 255) * sens, 1)
                midNorm = Math.min((midAvg / 255) * sens, 1)
                trebleNorm = Math.min((trebleAvg / 255) * sens, 1)
            }
        }

        // Suavizado + valores
        const s = Math.min(Math.max(smoothing, 0), 0.95)
        bassSmoothRef.current = lerp(bassSmoothRef.current, bassNorm, 1 - s)
        midSmoothRef.current = lerp(midSmoothRef.current, midNorm, 1 - s)
        trebleSmoothRef.current = lerp(
            trebleSmoothRef.current,
            trebleNorm,
            1 - s
        )

        const bass = bassSmoothRef.current
        const mid = midSmoothRef.current
        const treble = trebleSmoothRef.current

        const cx = width / 2
        const cy = height * 0.35

        const baseRadius = Math.min(width, height) * 0.11
        const pulseAmount = baseRadius * maxPulse * (0.2 + bass * 0.8)
        const liquidAmount = baseRadius * 0.25 * (0.4 + mid * 0.6)
        const rippleAmount = baseRadius * 0.12 * (0.2 + treble * 0.8)

        const now = performance.now() / 1000

        /* ───────── 1) Núcleo de plasma (glow) ───────── */
        const coreRadius = baseRadius * (0.9 + bass * 0.5)

        const gradient = ctx.createRadialGradient(
            cx,
            cy,
            coreRadius * 0.1,
            cx,
            cy,
            coreRadius * 1.7
        )
        gradient.addColorStop(0, hexToRgba(glowColor, 1))
        gradient.addColorStop(0.5, hexToRgba(glowColor, 0.4 + bass * 0.35))
        gradient.addColorStop(1, hexToRgba(glowColor, 0))

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, coreRadius * 1.5 + pulseAmount * 0.5, 0, Math.PI * 2)
        ctx.fill()

        /* ───────── 2) Anillo líquido ───────── */
        const points = 200

        ctx.beginPath()
        ctx.lineWidth = 2.2 + 2.3 * (0.3 + treble * 0.7)
        ctx.strokeStyle = hexToRgba(primaryColor, 0.95)
        ctx.shadowColor = hexToRgba(glowColor, 0.95)
        ctx.shadowBlur = 18 + treble * 45

        for (let i = 0; i <= points; i++) {
            const t = i / points
            const angle = t * Math.PI * 2

            const liquidWave =
                Math.sin(angle * 3 + now * 1.6) +
                0.8 * Math.sin(angle * 5 - now * 1.1)

            const rippleWave = Math.sin(angle * 11 - now * 7)

            const radius =
                baseRadius +
                pulseAmount +
                liquidWave * liquidAmount +
                rippleWave * rippleAmount

            const x = cx + Math.cos(angle) * radius
            const y = cy + Math.sin(angle) * radius

            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }

        ctx.closePath()
        ctx.stroke()

        /* ───────── 3) Chispas / destellos exteriores ───────── */
        const sparkCount = 24
        const sparkRadius = baseRadius * 1.5 + pulseAmount * 0.45

        ctx.lineWidth = 1.1
        ctx.shadowBlur = 20 + treble * 35
        ctx.strokeStyle = hexToRgba(primaryColor, 0.55 + treble * 0.45)

        for (let i = 0; i < sparkCount; i++) {
            const t = i / sparkCount
            const angle = t * Math.PI * 2 + now * (0.5 + treble * 2.0)

            const innerR = sparkRadius
            const outerR = sparkRadius + baseRadius * 0.2 * (0.3 + treble * 0.7)

            const x1 = cx + Math.cos(angle) * innerR
            const y1 = cy + Math.sin(angle) * innerR
            const x2 = cx + Math.cos(angle) * outerR
            const y2 = cy + Math.sin(angle) * outerR

            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }

        ctx.shadowBlur = 0
    }

    /* ────────────────────────────────────────────────────────
       Render
       ──────────────────────────────────────────────────────── */
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                cursor: audioFile ? "pointer" : "default",
            }}
            onClick={handleTogglePlay}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            <audio
                ref={audioRef}
                src={audioFile}
                loop
                style={{ display: "none" }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.55)",
                    pointerEvents: "none",
                }}
            >
                {audioFile
                    ? isPlaying
                        ? "Reproduciendo"
                        : "Click para reproducir"
                    : "Carga un track en la UI"}
            </div>
        </div>
    )
}

RSV_LiquidPlasmaPortal.defaultProps = {
    audioFile: "",
    primaryColor: "#00C2FF",
    glowColor: "#00C2FF",
    backgroundColor: "transparent",
    sensitivity: 1,
    smoothing: 0.6,
    maxPulse: 0.45,
}

addPropertyControls(RSV_LiquidPlasmaPortal, {
    audioFile: {
        type: ControlType.File,
        title: "Track",
        allowedFileTypes: ["audio/*"],
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Anillo",
        defaultValue: "#00C2FF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#00C2FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "transparent",
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Sens",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smooth",
        min: 0,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.6,
    },
    maxPulse: {
        type: ControlType.Number,
        title: "Pulso",
        min: 0.1,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.45,
    },
})
