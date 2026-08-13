// NaveganteDeLaRed.tsx
import React, { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

type Freq = 1 | 2 | 3 | 4

interface SolarNode {
    x: number
    y: number
    freq: Freq
    active: boolean
    resonating: boolean
    holdProgress: number
    glow: number
}

interface Pulse {
    x: number
    y: number
    radius: number
    life: number
    color: string
    freq: Freq
    angle: number
}

type Props = {
    width?: number
    height?: number
    nodesCount?: number
    droneVolume?: number
}

const NaveganteDeLaRed: React.FC<Props> = ({
    width = 1200,
    height = 800,
    nodesCount = 25,
    droneVolume = 0.08,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationId = 0
        let lastTime = 0

        // Tamaño canvas
        canvas.width = width
        canvas.height = height

        // Audio
        let audioCtx: AudioContext | null = null
        let droneOsc: OscillatorNode | null = null
        let droneGain: GainNode | null = null

        const resumeAudio = () => {
            if (!audioCtx) {
                const AC: typeof AudioContext =
                    (window as any).AudioContext ||
                    (window as any).webkitAudioContext
                audioCtx = new AC()
                droneOsc = audioCtx.createOscillator()
                droneGain = audioCtx.createGain()
                droneOsc.connect(droneGain)
                droneGain.connect(audioCtx.destination)
                droneOsc.frequency.value = 55
                droneOsc.type = "sine"
                droneGain.gain.value = Math.max(0, Math.min(1, droneVolume))
                droneOsc.start()
            } else {
                audioCtx.resume()
            }
        }

        const frequencies = {
            1: { color: "#4FD0FF", tone: 220 },
            2: { color: "#FFD700", tone: 330 },
            3: { color: "#00FF88", tone: 440 },
            4: { color: "#FF6BFF", tone: 523 },
        } as const

        // Estado
        let selectedFreq: Freq = 1
        const nodes: SolarNode[] = []
        const numNodes = Math.max(5, Math.min(100, nodesCount))

        for (let i = 0; i < numNodes; i++) {
            let attempts = 0
            let x = 0,
                y = 0
            do {
                x = 100 + Math.random() * (width - 200)
                y = 100 + Math.random() * (height - 200)
                attempts++
            } while (
                nodes.some((n) => Math.hypot(n.x - x, n.y - y) < 100) &&
                attempts < 50
            )

            nodes.push({
                x,
                y,
                freq: (Math.floor(Math.random() * 4) + 1) as Freq,
                active: false,
                resonating: false,
                holdProgress: 0,
                glow: 0,
            })
        }

        let avatar = { x: width / 2, y: height / 2, glow: 0.5 }
        let mouse = { x: width / 2, y: height / 2 }
        const pulses: Pulse[] = []
        let traveling = false
        let targetNode: SolarNode | null = null
        let travelProgress = 0
        let currentTargetDist = Infinity
        const keys: Record<string, boolean> = {}

        // Handlers (¡no hooks aquí!)
        function handleKeyDown(e: KeyboardEvent) {
            keys[e.key] = true
            if (e.key >= "1" && e.key <= "4") {
                selectedFreq = parseInt(e.key, 10) as Freq
            }
        }
        function handleKeyUp(e: KeyboardEvent) {
            keys[e.key] = false
        }
        function handleMouseMove(e: MouseEvent) {
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            mouse.x = (e.clientX - rect.left) * scaleX
            mouse.y = (e.clientY - rect.top) * scaleY
        }
        function handleClick(e: MouseEvent) {
            resumeAudio()
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            const clickX = (e.clientX - rect.left) * scaleX
            const clickY = (e.clientY - rect.top) * scaleY
            const angle = Math.atan2(clickY - avatar.y, clickX - avatar.x)
            pulses.push({
                x: avatar.x,
                y: avatar.y,
                radius: 0,
                life: 1,
                color: frequencies[selectedFreq].color,
                freq: selectedFreq,
                angle,
            })
            playTone(frequencies[selectedFreq].tone, 0.3, 0.3)
        }

        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)
        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("click", handleClick)

        function playTone(
            freq: number,
            duration: number,
            volume: number = 0.2,
            type: OscillatorType = "sine"
        ) {
            if (!audioCtx) return
            const osc = audioCtx.createOscillator()
            const gain = audioCtx.createGain()
            osc.connect(gain)
            gain.connect(audioCtx.destination)
            osc.frequency.value = freq
            osc.type = type
            gain.gain.setValueAtTime(volume, audioCtx.currentTime)
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                audioCtx.currentTime + duration
            )
            osc.start(audioCtx.currentTime)
            osc.stop(audioCtx.currentTime + duration)
        }

        function animate(time: number) {
            const deltaTime = (time - lastTime) / 1000
            lastTime = time

            // Fondo
            const gradient = ctx.createRadialGradient(
                width / 2,
                height / 2,
                0,
                width / 2,
                height / 2,
                Math.max(width, height)
            )
            gradient.addColorStop(0, "rgba(10, 0, 30, 0.3)")
            gradient.addColorStop(0.5, "rgba(5, 0, 20, 0.2)")
            gradient.addColorStop(1, "rgba(0, 0, 5, 0.1)")
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)

            // Nodos latentes
            nodes.forEach((node) => {
                if (!node.active && !node.resonating) {
                    ctx.strokeStyle = "rgba(80, 80, 100, 0.4)"
                    ctx.lineWidth = 1.5
                    ctx.shadowBlur = 0
                    ctx.beginPath()
                    ctx.arc(
                        node.x,
                        node.y,
                        6 + Math.sin(time * 0.001 + node.x * 0.01) * 1,
                        0,
                        Math.PI * 2
                    )
                    ctx.stroke()
                }
            })

            // Pulsos
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i]
                p.radius += 300 * deltaTime
                p.life -= deltaTime * 1.2

                if (p.life <= 0) {
                    pulses.splice(i, 1)
                    continue
                }

                const alpha = p.life * 0.5
                const alphaHex = Math.floor(alpha * 255)
                    .toString(16)
                    .padStart(2, "0")
                ctx.strokeStyle = p.color + alphaHex
                ctx.lineWidth = 2 + Math.sin(time * 0.02) * 0.5
                ctx.shadowColor = p.color
                ctx.shadowBlur = 15 * p.life
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.stroke()

                if (!traveling) {
                    currentTargetDist = Infinity
                    nodes.forEach((node) => {
                        if (node.active || node.resonating) return
                        const dx = node.x - p.x
                        const dy = node.y - p.y
                        const dist = Math.hypot(dx, dy)
                        if (dist > p.radius + 15 || dist < 20) return

                        const nodeAngle = Math.atan2(dy, dx)
                        let diff = nodeAngle - p.angle
                        if (diff < -Math.PI) diff += Math.PI * 2
                        if (diff > Math.PI) diff -= Math.PI * 2
                        if (Math.abs(diff) > Math.PI / 6) return

                        if (node.freq === p.freq && dist < currentTargetDist) {
                            currentTargetDist = dist
                            targetNode = node
                            node.glow = 3
                            playTone(
                                frequencies[p.freq].tone * 1.5,
                                0.5,
                                0.15,
                                "triangle"
                            )
                        }
                    })
                }
            }

            // Viaje por filamento
            if (traveling && targetNode) {
                travelProgress += deltaTime * 1.2
                const px = avatar.x + (targetNode.x - avatar.x) * travelProgress
                const py = avatar.y + (targetNode.y - avatar.y) * travelProgress
                avatar.x = px
                avatar.y = py

                const col = frequencies[targetNode.freq].color
                const grad = ctx.createLinearGradient(
                    avatar.x,
                    avatar.y,
                    targetNode.x,
                    targetNode.y
                )
                grad.addColorStop(0, col + "FF")
                grad.addColorStop(1, col + "00")
                ctx.strokeStyle = grad
                ctx.lineWidth = 4 + Math.sin(time * 0.1) * 1
                ctx.shadowColor = col
                ctx.shadowBlur = 25
                ctx.lineCap = "round"
                ctx.beginPath()
                ctx.moveTo(
                    avatar.x - (targetNode.x - avatar.x) * 0.15,
                    avatar.y - (targetNode.y - avatar.y) * 0.15
                )
                ctx.lineTo(px, py)
                ctx.stroke()

                if (travelProgress >= 1) {
                    traveling = false
                    targetNode.resonating = true
                    targetNode.holdProgress = 0
                    travelProgress = 0
                    targetNode = null
                    currentTargetDist = Infinity
                    playTone(frequencies[selectedFreq].tone * 2, 1.5, 0.25)
                }
            }

            // Sostenimiento de frecuencia
            nodes.forEach((node) => {
                if (node.resonating) {
                    const near =
                        Math.hypot(avatar.x - node.x, avatar.y - node.y) < 40
                    const holding = keys[node.freq.toString()]
                    if (near && holding) {
                        node.holdProgress = Math.min(
                            node.holdProgress + deltaTime * 2,
                            2
                        )
                        node.glow = 2 + Math.sin(time * 0.02) * 0.5

                        const col = frequencies[node.freq].color
                        ctx.strokeStyle = col + "FF"
                        ctx.lineWidth = 4
                        ctx.shadowColor = col
                        ctx.shadowBlur = 10
                        ctx.beginPath()
                        ctx.arc(
                            node.x,
                            node.y,
                            18,
                            -Math.PI / 2,
                            -Math.PI / 2 + (node.holdProgress / 2) * Math.PI * 2
                        )
                        ctx.stroke()

                        if (node.holdProgress >= 2) {
                            node.active = true
                            node.resonating = false
                            playTone(
                                frequencies[node.freq].tone * 1.2,
                                2,
                                0.4,
                                "sine"
                            )
                        }
                    } else {
                        node.holdProgress *= 0.95
                        if (node.holdProgress < 0.01) {
                            node.resonating = false
                        }
                    }
                }
            })

            // Nodos activos
            nodes.forEach((node) => {
                if (node.active) {
                    const col = frequencies[node.freq].color
                    const pulse =
                        (Math.sin(time * 0.008 + node.x * 0.01) * 0.4 + 0.6) *
                        node.glow
                    ctx.shadowColor = col
                    ctx.shadowBlur = 30 + pulse * 20
                    ctx.fillStyle = col + "FF"
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, 14 + pulse * 8, 0, Math.PI * 2)
                    ctx.fill()
                    node.glow *= 0.98
                    if (node.glow < 0.1) node.glow = 0.1
                } else if (node.glow > 0) {
                    node.glow *= 0.92
                }
            })

            // Avatar
            const avatarCol = frequencies[selectedFreq].color + "FF"
            avatar.glow = 0.7 + Math.sin(time * 0.012) * 0.3
            ctx.shadowColor = avatarCol
            ctx.shadowBlur = 40 * avatar.glow
            ctx.fillStyle = avatarCol
            ctx.beginPath()
            ctx.arc(avatar.x, avatar.y, 12 * avatar.glow, 0, Math.PI * 2)
            ctx.fill()

            // Tejido
            ctx.shadowBlur = 8
            ctx.lineWidth = 1.5
            ctx.lineCap = "round"
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    if (nodes[i].active && nodes[j].active) {
                        const dist = Math.hypot(
                            nodes[i].x - nodes[j].x,
                            nodes[i].y - nodes[j].y
                        )
                        if (dist < 250) {
                            const mx = (nodes[i].x + nodes[j].x) / 2
                            const my = (nodes[i].y + nodes[j].y) / 2
                            const perpX =
                                (nodes[j].y - nodes[i].y) *
                                (Math.random() > 0.5 ? 0.15 : -0.15)
                            const perpY =
                                (nodes[i].x - nodes[j].x) *
                                (Math.random() > 0.5 ? 0.15 : -0.15)
                            const col1 = frequencies[nodes[i].freq].color + "55"
                            ctx.strokeStyle =
                                nodes[i].freq === nodes[j].freq
                                    ? col1
                                    : "#FFFFFF33"
                            ctx.shadowColor =
                                nodes[i].freq === nodes[j].freq
                                    ? col1
                                    : "#FFFFFF"
                            ctx.beginPath()
                            ctx.moveTo(nodes[i].x, nodes[i].y)
                            ctx.quadraticCurveTo(
                                mx + perpX,
                                my + perpY,
                                nodes[j].x,
                                nodes[j].y
                            )
                            ctx.stroke()
                        }
                    }
                }
            }

            // Vista previa de cono
            if (!traveling) {
                const aimAngle = Math.atan2(
                    mouse.y - avatar.y,
                    mouse.x - avatar.x
                )
                const coneWidth = Math.PI / 6
                const previewRadius = 150
                ctx.strokeStyle = frequencies[selectedFreq].color + "66"
                ctx.lineWidth = 1
                ctx.setLineDash([8, 8])
                ctx.shadowBlur = 5
                ctx.shadowColor = frequencies[selectedFreq].color
                for (let offset = -1; offset <= 1; offset += 2) {
                    const lineAngle = aimAngle + offset * coneWidth
                    ctx.beginPath()
                    ctx.moveTo(avatar.x, avatar.y)
                    ctx.lineTo(
                        avatar.x + Math.cos(lineAngle) * previewRadius,
                        avatar.y + Math.sin(lineAngle) * previewRadius
                    )
                    ctx.stroke()
                }
                ctx.setLineDash([])
            }

            // HUD
            ctx.shadowBlur = 0
            ctx.fillStyle = "rgba(255,255,255,0.9)"
            ctx.font = "bold 24px monospace"
            ctx.textAlign = "left"
            ctx.fillText(`Frecuencia Activa: F${selectedFreq}`, 30, 50)
            const activeCount = nodes.filter((n) => n.active).length
            ctx.fillText(`Nodos Resonantes: ${activeCount}/${numNodes}`, 30, 85)
            if (activeCount > 0) {
                const progress = (activeCount / numNodes) * 100
                ctx.fillStyle = frequencies[selectedFreq].color
                ctx.fillText(`${Math.floor(progress)}% Red Tejida`, 30, 120)
            }

            if (activeCount === numNodes) {
                ctx.save()
                ctx.translate(width / 2, height / 2)
                ctx.rotate(time * 0.0005)
                ctx.shadowColor = "#FFD700"
                ctx.shadowBlur = 50
                ctx.fillStyle = "#FFD700"
                ctx.font = "bold 48px serif"
                ctx.textAlign = "center"
                ctx.fillText("🌞 RED SOLAR VIVA 🌞", 0, 0)
                ctx.font = "bold 24px monospace"
                ctx.fillStyle = "rgba(255,255,255,0.8)"
                ctx.fillText(
                    "La resonancia es completa. Eres la dirección.",
                    0,
                    40
                )
                ctx.restore()
            }

            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)

        return () => {
            if (animationId) cancelAnimationFrame(animationId)
            if (droneOsc) {
                try {
                    droneOsc.stop()
                } catch {}
            }
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("click", handleClick)
        }
    }, [width, height, nodesCount, droneVolume])

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background:
                    "radial-gradient(circle at center, #0a001f 0%, #000415 70%, #000 100%)",
                overflow: "hidden",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%" }}
                tabIndex={0}
            />
            <motion.div
                style={{
                    position: "absolute",
                    bottom: 30,
                    left: 30,
                    color: "white",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    pointerEvents: "none",
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                Presiona 1–4 para frecuencias · Apunta con mouse · Click para
                pulsar · Sostén la freq al llegar
            </motion.div>
        </motion.div>
    )
}

export default NaveganteDeLaRed

// Controles opcionales en Framer
addPropertyControls(NaveganteDeLaRed, {
    nodesCount: {
        type: ControlType.Number,
        title: "Nodos",
        min: 5,
        max: 100,
        step: 1,
        defaultValue: 25,
    },
    droneVolume: {
        type: ControlType.Number,
        title: "Volumen",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.08,
    },
})
