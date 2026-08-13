// PulsoOrbital.tsx
// Juego de sincronización rítmica para Red Solar Viva
// Compatible con RSV_SolarSimuladoresShell

import * as React from "react"
import {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
    useLayoutEffect,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══════════════════════════════════════════════════════════════════════════
   TIPOS Y CONSTANTES
   ═══════════════════════════════════════════════════════════════════════════ */

type GameState = "menu" | "playing" | "levelComplete" | "gameOver"
type PulseColor = 1 | 2 | 3 | 4 // Mapea a los 4 colores del sistema

interface Pulse {
    id: number
    color: PulseColor
    angle: number // Ángulo donde debe ser capturado
    speed: number // Velocidad de expansión
    radius: number // Radio actual
    maxRadius: number // Radio donde desaparece
    captureWindow: number // Ventana de tiempo para capturar (en radio)
}

interface Level {
    id: number
    name: string
    bpm: number // Beats per minute base
    pulsePattern: PulseColor[] // Secuencia de colores
    requiredHits: number // Hits necesarios para completar
    orbitalSpeed: number // Velocidad de rotación del jugador
    difficulty: number // 1-5 estrellas
}

interface LevelProgress {
    unlocked: boolean
    stars: number // 0-5
    bestScore: number
}

/* ═══════════════════════════════════════════════════════════════════════════
   NIVELES DEL JUEGO
   ═══════════════════════════════════════════════════════════════════════════ */

const LEVELS: Level[] = [
    {
        id: 1,
        name: "Primer Latido",
        bpm: 60,
        pulsePattern: [1, 1, 1, 1],
        requiredHits: 8,
        orbitalSpeed: 1,
        difficulty: 1,
    },
    {
        id: 2,
        name: "Dualidad",
        bpm: 70,
        pulsePattern: [1, 2, 1, 2],
        requiredHits: 12,
        orbitalSpeed: 1.1,
        difficulty: 1,
    },
    {
        id: 3,
        name: "Triada",
        bpm: 75,
        pulsePattern: [1, 2, 3, 1, 2, 3],
        requiredHits: 15,
        orbitalSpeed: 1.2,
        difficulty: 2,
    },
    {
        id: 4,
        name: "Cuadratura",
        bpm: 80,
        pulsePattern: [1, 2, 3, 4, 1, 2, 3, 4],
        requiredHits: 20,
        orbitalSpeed: 1.3,
        difficulty: 2,
    },
    {
        id: 5,
        name: "Flujo Alterno",
        bpm: 85,
        pulsePattern: [1, 3, 2, 4, 1, 3, 2, 4],
        requiredHits: 24,
        orbitalSpeed: 1.4,
        difficulty: 3,
    },
    {
        id: 6,
        name: "Espiral",
        bpm: 90,
        pulsePattern: [1, 2, 3, 4, 4, 3, 2, 1],
        requiredHits: 28,
        orbitalSpeed: 1.5,
        difficulty: 3,
    },
    {
        id: 7,
        name: "Sincronía",
        bpm: 95,
        pulsePattern: [1, 1, 2, 2, 3, 3, 4, 4],
        requiredHits: 32,
        orbitalSpeed: 1.6,
        difficulty: 4,
    },
    {
        id: 8,
        name: "Resonancia",
        bpm: 100,
        pulsePattern: [1, 2, 1, 3, 2, 4, 3, 1],
        requiredHits: 36,
        orbitalSpeed: 1.7,
        difficulty: 4,
    },
    {
        id: 9,
        name: "Vórtice",
        bpm: 110,
        pulsePattern: [4, 3, 2, 1, 4, 3, 2, 1],
        requiredHits: 40,
        orbitalSpeed: 1.8,
        difficulty: 5,
    },
    {
        id: 10,
        name: "Pulso Solar",
        bpm: 120,
        pulsePattern: [1, 2, 3, 4, 2, 3, 4, 1, 3, 4, 1, 2],
        requiredHits: 48,
        orbitalSpeed: 2.0,
        difficulty: 5,
    },
]

/* ═══════════════════════════════════════════════════════════════════════════
   COLORES DEL SISTEMA (igual que Navegantes)
   ═══════════════════════════════════════════════════════════════════════════ */

const COLORS: Record<PulseColor, { main: string; glow: string; name: string }> =
    {
        1: { main: "#00C2FF", glow: "rgba(0, 194, 255, 0.6)", name: "Cyan" },
        2: { main: "#FFD700", glow: "rgba(255, 215, 0, 0.6)", name: "Oro" },
        3: { main: "#3CFF7B", glow: "rgba(60, 255, 123, 0.6)", name: "Verde" },
        4: { main: "#FF6B9D", glow: "rgba(255, 107, 157, 0.6)", name: "Rosa" },
    }

/* ═══════════════════════════════════════════════════════════════════════════
   CSS EMBEBIDO
   ═══════════════════════════════════════════════════════════════════════════ */

const GAME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@100;200;300;400;500&display=swap');

.pulso-orbital-root {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, #0a1628 0%, #050a14 60%, #020408 100%);
    overflow: hidden;
    font-family: 'Exo 2', sans-serif;
    color: #E6F7EF;
    user-select: none;
}

/* Fondo de estrellas sutiles */
.pulso-stars {
    position: absolute;
    inset: 0;
    background-image: 
        radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent),
        radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.3), transparent),
        radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.3), transparent),
        radial-gradient(1.5px 1.5px at 160px 120px, rgba(255,255,255,0.4), transparent);
    background-size: 200px 200px;
    animation: twinkle 8s ease-in-out infinite;
}

@keyframes twinkle {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

/* Arena de juego */
.game-arena {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(80vw, 80vh, 600px);
    height: min(80vw, 80vh, 600px);
}

/* Anillos orbitales decorativos */
.orbital-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(0, 194, 255, 0.15);
    pointer-events: none;
}

.orbital-ring.ring-1 { width: 100%; height: 100%; }
.orbital-ring.ring-2 { width: 75%; height: 75%; border-color: rgba(0, 194, 255, 0.1); }
.orbital-ring.ring-3 { width: 50%; height: 50%; border-color: rgba(0, 194, 255, 0.08); }

/* Núcleo central */
.core {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #1a3a5c, #0a1628);
    border: 2px solid rgba(0, 194, 255, 0.5);
    box-shadow: 
        0 0 30px rgba(0, 194, 255, 0.3),
        0 0 60px rgba(0, 194, 255, 0.15),
        inset 0 0 20px rgba(0, 194, 255, 0.2);
    display: grid;
    place-items: center;
}

.core-inner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00C2FF;
    box-shadow: 0 0 20px #00C2FF, 0 0 40px rgba(0, 194, 255, 0.5);
    animation: core-pulse 2s ease-in-out infinite;
}

@keyframes core-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
}

/* Jugador orbital */
.player-orbit {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    transform-origin: center center;
    pointer-events: none;
}

.player {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translate(-50%, -50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffffff, #00C2FF);
    border: 2px solid #ffffff;
    box-shadow: 
        0 0 15px #00C2FF,
        0 0 30px rgba(0, 194, 255, 0.5),
        0 0 45px rgba(0, 194, 255, 0.3);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.player.capturing {
    transform: translate(-50%, -50%) scale(1.3);
    box-shadow: 
        0 0 25px #ffffff,
        0 0 50px #00C2FF,
        0 0 75px rgba(0, 194, 255, 0.5);
}

/* Pulsos */
.pulse {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 3px solid;
    pointer-events: none;
    opacity: 0.9;
}

.pulse.captured {
    animation: capture-flash 0.3s ease-out forwards;
}

@keyframes capture-flash {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; border-width: 8px; }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
}

/* Partículas de captura */
.capture-particles {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: particle-fly 0.6s ease-out forwards;
}

@keyframes particle-fly {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}

/* HUD */
.hud {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 10;
}

.hud-level {
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: rgba(230, 247, 239, 0.7);
    text-transform: uppercase;
}

.hud-score {
    font-family: 'Orbitron', monospace;
    font-size: 32px;
    font-weight: 700;
    color: #00C2FF;
    text-shadow: 0 0 20px rgba(0, 194, 255, 0.5);
}

.hud-combo {
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    font-weight: 600;
    color: #FFD700;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.hud-combo.active {
    opacity: 1;
    animation: combo-pop 0.3s ease-out;
}

@keyframes combo-pop {
    0% { transform: scale(1.5); }
    100% { transform: scale(1); }
}

/* Barra de progreso */
.progress-bar {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 8px;
    background: rgba(0, 194, 255, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(0, 194, 255, 0.3);
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00C2FF, #3CFF7B);
    box-shadow: 0 0 10px rgba(0, 194, 255, 0.5);
    transition: width 0.3s ease;
}

/* Indicador de siguiente color */
.next-color {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(6, 16, 24, 0.8);
    border: 1px solid rgba(0, 194, 255, 0.3);
    border-radius: 20px;
}

.next-label {
    font-size: 11px;
    letter-spacing: 0.1em;
    color: rgba(230, 247, 239, 0.5);
    text-transform: uppercase;
}

.next-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor;
}

/* Menú de selección de nivel */
.level-menu {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    z-index: 100;
}

.menu-title {
    font-family: 'Orbitron', monospace;
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 800;
    letter-spacing: 0.2em;
    margin-right: -0.2em;
    color: #E6F7EF;
    text-shadow: 0 0 30px rgba(0, 194, 255, 0.5);
    margin-bottom: 8px;
}

.menu-subtitle {
    font-size: 14px;
    letter-spacing: 0.15em;
    color: rgba(230, 247, 239, 0.6);
    margin-bottom: 40px;
}

.level-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    max-width: 600px;
}

.level-card {
    aspect-ratio: 1;
    min-width: 80px;
    border-radius: 16px;
    background: rgba(6, 16, 24, 0.8);
    border: 1px solid rgba(0, 194, 255, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.level-card:hover:not(.locked) {
    transform: translateY(-4px);
    border-color: #00C2FF;
    box-shadow: 0 0 20px rgba(0, 194, 255, 0.3);
}

.level-card.locked {
    opacity: 0.4;
    cursor: not-allowed;
}

.level-card.locked:hover {
    transform: none;
}

.level-number {
    font-family: 'Orbitron', monospace;
    font-size: 24px;
    font-weight: 700;
    color: #00C2FF;
}

.level-stars {
    display: flex;
    gap: 2px;
}

.star {
    width: 10px;
    height: 10px;
    fill: rgba(255, 215, 0, 0.2);
}

.star.filled {
    fill: #FFD700;
    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.5));
}

/* Pantalla de nivel completado */
.level-complete {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(5, 10, 20, 0.95);
    z-index: 200;
}

.complete-title {
    font-family: 'Orbitron', monospace;
    font-size: 36px;
    font-weight: 800;
    color: #3CFF7B;
    text-shadow: 0 0 30px rgba(60, 255, 123, 0.5);
    margin-bottom: 20px;
}

.complete-stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;
}

.stat-row {
    font-family: 'Orbitron', monospace;
    font-size: 18px;
    color: rgba(230, 247, 239, 0.8);
}

.stat-value {
    color: #00C2FF;
    margin-left: 8px;
}

.complete-stars {
    display: flex;
    gap: 8px;
    margin-bottom: 30px;
}

.complete-stars .star {
    width: 32px;
    height: 32px;
}

.action-buttons {
    display: flex;
    gap: 16px;
}

.action-btn {
    padding: 12px 28px;
    border-radius: 12px;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.action-btn.primary {
    background: linear-gradient(180deg, #00C2FF, #0088cc);
    color: #061018;
    box-shadow: 0 0 20px rgba(0, 194, 255, 0.4);
}

.action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(0, 194, 255, 0.6);
}

.action-btn.secondary {
    background: rgba(6, 16, 24, 0.8);
    color: #E6F7EF;
    border: 1px solid rgba(0, 194, 255, 0.4);
}

.action-btn.secondary:hover {
    border-color: #00C2FF;
    box-shadow: 0 0 15px rgba(0, 194, 255, 0.3);
}

/* Tutorial overlay */
.tutorial-overlay {
    position: absolute;
    inset: 0;
    background: rgba(5, 10, 20, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 150;
    padding: 40px;
    text-align: center;
}

.tutorial-title {
    font-family: 'Orbitron', monospace;
    font-size: 24px;
    font-weight: 700;
    color: #00C2FF;
    margin-bottom: 24px;
}

.tutorial-text {
    font-size: 16px;
    line-height: 1.8;
    color: rgba(230, 247, 239, 0.8);
    max-width: 500px;
    margin-bottom: 30px;
}

.tutorial-hint {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(0, 194, 255, 0.1);
    border: 1px solid rgba(0, 194, 255, 0.3);
    border-radius: 12px;
    margin-bottom: 30px;
}

.key-icon {
    padding: 6px 12px;
    background: rgba(0, 194, 255, 0.2);
    border: 1px solid rgba(0, 194, 255, 0.4);
    border-radius: 6px;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    color: #00C2FF;
}

/* Feedback visual miss */
.miss-indicator {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Orbitron', monospace;
    font-size: 24px;
    font-weight: 700;
    color: #FF4444;
    text-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
    opacity: 0;
    pointer-events: none;
}

.miss-indicator.show {
    animation: miss-flash 0.5s ease-out;
}

@keyframes miss-flash {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}

/* Responsive */
@media (max-width: 600px) {
    .level-grid {
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
    }
    
    .level-card {
        min-width: 50px;
    }
    
    .level-number {
        font-size: 18px;
    }
    
    .hud-score {
        font-size: 24px;
    }
}
`

/* ═══════════════════════════════════════════════════════════════════════════
   HOOKS PERSONALIZADOS
   ═══════════════════════════════════════════════════════════════════════════ */

function useInjectCss() {
    const useEarly = (React as any).useInsertionEffect || useLayoutEffect
    useEarly(() => {
        if (typeof document === "undefined") return
        const id = "rsv-pulso-orbital-css"
        let s = document.getElementById(id) as HTMLStyleElement | null
        if (!s) {
            s = document.createElement("style")
            s.id = id
            document.head.appendChild(s)
        }
        if (s.textContent !== GAME_CSS) s.textContent = GAME_CSS
    }, [])
}

function useSfx(
    urls: { capture?: string; miss?: string; levelUp?: string },
    enabled: boolean,
    volume: number = 0.7
) {
    const audioCache = useRef<Record<string, HTMLAudioElement>>({})

    const play = useCallback(
        (key: keyof typeof urls) => {
            if (!enabled) return
            const url = urls[key]
            if (!url) return

            try {
                let audio = audioCache.current[key]
                if (!audio) {
                    audio = new Audio(url)
                    audioCache.current[key] = audio
                }
                audio.volume = Math.max(0, Math.min(1, volume))
                audio.currentTime = 0
                audio.play().catch(() => {})
            } catch {}
        },
        [urls, enabled, volume]
    )

    return play
}

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return initial
        try {
            const stored = localStorage.getItem(key)
            return stored ? JSON.parse(stored) : initial
        } catch {
            return initial
        }
    })

    const setAndStore = useCallback(
        (v: T) => {
            setValue(v)
            try {
                localStorage.setItem(key, JSON.stringify(v))
            } catch {}
        },
        [key]
    )

    return [value, setAndStore]
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTES AUXILIARES
   ═══════════════════════════════════════════════════════════════════════════ */

const StarIcon: React.FC<{ filled?: boolean; size?: number }> = ({
    filled = false,
    size = 10,
}) => (
    <svg
        className={`star ${filled ? "filled" : ""}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
    >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
)

const CaptureParticles: React.FC<{ color: string; x: number; y: number }> = ({
    color,
    x,
    y,
}) => {
    const particles = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const distance = 40 + Math.random() * 20
            return {
                id: i,
                tx: Math.cos(angle) * distance,
                ty: Math.sin(angle) * distance,
            }
        })
    }, [])

    return (
        <div
            className="capture-particles"
            style={{ left: x, top: y, transform: "none" }}
        >
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={
                        {
                            background: color,
                            boxShadow: `0 0 6px ${color}`,
                            ["--tx" as any]: `${p.tx}px`,
                            ["--ty" as any]: `${p.ty}px`,
                        } as React.CSSProperties
                    }
                />
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════════════════ */

type PulsoOrbitalProps = {
    onExit?: () => void
    sfxEnabled?: boolean
    gameMenuOpen?: boolean
    onMenuStateChange?: (open: boolean) => void

    // SFX URLs
    sfxCapture?: string
    sfxMiss?: string
    sfxLevelUp?: string
    sfxVolume?: number

    // Título consola (igual que Navegantes)
    consoleTitleImage?: string
    consoleTitleImageHeight?: number
    consoleTitleTopOffset?: number
}

export function PulsoOrbital(props: PulsoOrbitalProps) {
    useInjectCss()

    const {
        onExit,
        sfxEnabled = true,
        gameMenuOpen = false,
        onMenuStateChange,
        sfxCapture,
        sfxMiss,
        sfxLevelUp,
        sfxVolume = 0.7,
        consoleTitleImage,
        consoleTitleImageHeight = 84,
        consoleTitleTopOffset = 0,
    } = props

    // ═══════════════════════════════════════════════════════════════════════
    // ESTADO DEL JUEGO
    // ═══════════════════════════════════════════════════════════════════════

    const [gameState, setGameState] = useState<GameState>("menu")
    const [currentLevel, setCurrentLevel] = useState<number>(1)
    const [showTutorial, setShowTutorial] = useState(false)

    // Progreso persistente
    const [progress, setProgress] = useLocalStorage<
        Record<number, LevelProgress>
    >("pulso-orbital-progress", {
        1: { unlocked: true, stars: 0, bestScore: 0 },
    })

    // Estado de juego activo
    const [score, setScore] = useState(0)
    const [combo, setCombo] = useState(0)
    const [maxCombo, setMaxCombo] = useState(0)
    const [hits, setHits] = useState(0)
    const [misses, setMisses] = useState(0)
    const [pulses, setPulses] = useState<Pulse[]>([])
    const [playerAngle, setPlayerAngle] = useState(0)
    const [isCapturing, setIsCapturing] = useState(false)
    const [showMiss, setShowMiss] = useState(false)
    const [captureEffects, setCaptureEffects] = useState<
        { id: number; color: string; x: number; y: number }[]
    >([])

    // Refs para el game loop
    const gameLoopRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number>(0)
    const pulseTimerRef = useRef<number>(0)
    const pulseIndexRef = useRef<number>(0)
    const nextPulseIdRef = useRef<number>(0)
    const arenaRef = useRef<HTMLDivElement>(null)

    // SFX
    const playSfx = useSfx(
        { capture: sfxCapture, miss: sfxMiss, levelUp: sfxLevelUp },
        sfxEnabled,
        sfxVolume
    )

    // ═══════════════════════════════════════════════════════════════════════
    // LÓGICA DEL JUEGO
    // ═══════════════════════════════════════════════════════════════════════

    const level = useMemo(() => LEVELS[currentLevel - 1], [currentLevel])

    const startLevel = useCallback(
        (levelNum: number) => {
            const lvl = LEVELS[levelNum - 1]
            if (!lvl) return

            setCurrentLevel(levelNum)
            setScore(0)
            setCombo(0)
            setMaxCombo(0)
            setHits(0)
            setMisses(0)
            setPulses([])
            setPlayerAngle(0)
            pulseTimerRef.current = 0
            pulseIndexRef.current = 0
            nextPulseIdRef.current = 0
            lastTimeRef.current = performance.now()

            // Mostrar tutorial solo en nivel 1 y primera vez
            if (levelNum === 1 && !progress[1]?.stars) {
                setShowTutorial(true)
            } else {
                setGameState("playing")
            }
        },
        [progress]
    )

    const completeLevel = useCallback(() => {
        setGameState("levelComplete")
        playSfx("levelUp")

        // Calcular estrellas basado en precisión
        const accuracy = hits / (hits + misses)
        let stars = 1
        if (accuracy >= 0.6) stars = 2
        if (accuracy >= 0.75) stars = 3
        if (accuracy >= 0.85) stars = 4
        if (accuracy >= 0.95) stars = 5

        // Actualizar progreso
        const newProgress = { ...progress }
        const current = newProgress[currentLevel] || {
            unlocked: true,
            stars: 0,
            bestScore: 0,
        }

        newProgress[currentLevel] = {
            unlocked: true,
            stars: Math.max(current.stars, stars),
            bestScore: Math.max(current.bestScore, score),
        }

        // Desbloquear siguiente nivel
        if (currentLevel < LEVELS.length) {
            newProgress[currentLevel + 1] = newProgress[currentLevel + 1] || {
                unlocked: true,
                stars: 0,
                bestScore: 0,
            }
        }

        setProgress(newProgress)
    }, [hits, misses, score, currentLevel, progress, setProgress, playSfx])

    const handleCapture = useCallback(() => {
        if (gameState !== "playing") return

        setIsCapturing(true)
        setTimeout(() => setIsCapturing(false), 100)

        // Buscar pulso capturado
        const arenaSize = arenaRef.current?.offsetWidth || 600
        const playerRadius = arenaSize / 2
        const captureThreshold = 30 // Píxeles de tolerancia

        let captured = false

        setPulses((prev) => {
            const newPulses = [...prev]
            for (let i = 0; i < newPulses.length; i++) {
                const pulse = newPulses[i]
                const pulsePosOnOrbit = pulse.radius

                // Verificar si el jugador está cerca del pulso
                const radiusDiff = Math.abs(playerRadius - pulsePosOnOrbit)

                if (radiusDiff < captureThreshold) {
                    // ¡Captura exitosa!
                    captured = true
                    const color = COLORS[pulse.color]

                    // Efecto de partículas
                    const effectId = Date.now()
                    setCaptureEffects((prev) => [
                        ...prev,
                        {
                            id: effectId,
                            color: color.main,
                            x: arenaSize / 2,
                            y: arenaSize / 2,
                        },
                    ])
                    setTimeout(() => {
                        setCaptureEffects((prev) =>
                            prev.filter((e) => e.id !== effectId)
                        )
                    }, 600)

                    // Actualizar score
                    setHits((h) => {
                        const newHits = h + 1
                        if (newHits >= level.requiredHits) {
                            setTimeout(completeLevel, 100)
                        }
                        return newHits
                    })

                    setCombo((c) => {
                        const newCombo = c + 1
                        setMaxCombo((m) => Math.max(m, newCombo))
                        return newCombo
                    })

                    setScore((s) => s + 100 * (combo + 1))

                    playSfx("capture")

                    // Marcar pulso como capturado (lo removemos)
                    newPulses.splice(i, 1)
                    break
                }
            }
            return newPulses
        })

        if (!captured) {
            // Miss
            setMisses((m) => m + 1)
            setCombo(0)
            setShowMiss(true)
            setTimeout(() => setShowMiss(false), 500)
            playSfx("miss")
        }
    }, [gameState, combo, level, completeLevel, playSfx])

    // ═══════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (gameState !== "playing") {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
                gameLoopRef.current = null
            }
            return
        }

        const arenaSize = arenaRef.current?.offsetWidth || 600
        const beatInterval = 60000 / level.bpm // ms por beat

        const gameLoop = (timestamp: number) => {
            const delta = timestamp - lastTimeRef.current
            lastTimeRef.current = timestamp

            // Rotar jugador
            setPlayerAngle((prev) => {
                const speed = level.orbitalSpeed * 0.05
                return (prev + speed * delta) % 360
            })

            // Generar pulsos según el ritmo
            pulseTimerRef.current += delta
            if (pulseTimerRef.current >= beatInterval) {
                pulseTimerRef.current -= beatInterval

                const patternIndex =
                    pulseIndexRef.current % level.pulsePattern.length
                const color = level.pulsePattern[patternIndex]
                pulseIndexRef.current++

                const newPulse: Pulse = {
                    id: nextPulseIdRef.current++,
                    color,
                    angle: 0,
                    speed: 0.15 + level.difficulty * 0.02,
                    radius: 0,
                    maxRadius: arenaSize / 2 + 50,
                    captureWindow: 30,
                }

                setPulses((prev) => [...prev, newPulse])
            }

            // Actualizar pulsos
            setPulses((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        radius: p.radius + p.speed * delta * 0.1,
                    }))
                    .filter((p) => p.radius < p.maxRadius)
            )

            gameLoopRef.current = requestAnimationFrame(gameLoop)
        }

        lastTimeRef.current = performance.now()
        gameLoopRef.current = requestAnimationFrame(gameLoop)

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
            }
        }
    }, [gameState, level])

    // ═══════════════════════════════════════════════════════════════════════
    // CONTROLES
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault()

                if (showTutorial) {
                    setShowTutorial(false)
                    setGameState("playing")
                    return
                }

                if (gameState === "playing") {
                    handleCapture()
                }
            }

            if (e.code === "Escape") {
                if (gameState === "playing") {
                    setGameState("menu")
                    onMenuStateChange?.(true)
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [gameState, showTutorial, handleCapture, onMenuStateChange])

    // Click/tap para capturar
    const handleArenaClick = useCallback(() => {
        if (gameState === "playing") {
            handleCapture()
        }
    }, [gameState, handleCapture])

    // Sincronizar con menú del shell
    // Solo pausar si gameMenuOpen CAMBIA a true mientras estamos jugando
    const prevGameMenuOpen = useRef(gameMenuOpen)
    useEffect(() => {
        // Solo actuar si gameMenuOpen cambió de false a true
        if (
            gameMenuOpen &&
            !prevGameMenuOpen.current &&
            gameState === "playing"
        ) {
            setGameState("menu")
        }
        prevGameMenuOpen.current = gameMenuOpen
    }, [gameMenuOpen, gameState])

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    const nextColorInPattern = useMemo(() => {
        if (!level) return 1
        const idx = pulseIndexRef.current % level.pulsePattern.length
        return level.pulsePattern[idx]
    }, [level, pulseIndexRef.current])

    return (
        <div className="pulso-orbital-root">
            <div className="pulso-stars" />

            {/* ═══════════════════════════════════════════════════════════════
                MENÚ DE NIVELES
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {gameState === "menu" && (
                    <motion.div
                        className="level-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {consoleTitleImage ? (
                            <img
                                src={consoleTitleImage}
                                alt="Pulso Orbital"
                                style={{
                                    height: consoleTitleImageHeight,
                                    marginTop: consoleTitleTopOffset,
                                    marginBottom: 8,
                                }}
                            />
                        ) : (
                            <h1 className="menu-title">PULSO ORBITAL</h1>
                        )}
                        <p className="menu-subtitle">
                            Sintoniza. Sincroniza. Trasciende.
                        </p>

                        <div className="level-grid">
                            {LEVELS.map((lvl) => {
                                const prog = progress[lvl.id]
                                const unlocked = prog?.unlocked || lvl.id === 1

                                return (
                                    <motion.div
                                        key={lvl.id}
                                        className={`level-card ${!unlocked ? "locked" : ""}`}
                                        onClick={() =>
                                            unlocked && startLevel(lvl.id)
                                        }
                                        whileHover={
                                            unlocked ? { scale: 1.05 } : {}
                                        }
                                        whileTap={
                                            unlocked ? { scale: 0.95 } : {}
                                        }
                                    >
                                        <span className="level-number">
                                            {unlocked ? lvl.id : "🔒"}
                                        </span>
                                        <div className="level-stars">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <StarIcon
                                                    key={s}
                                                    filled={
                                                        (prog?.stars || 0) >= s
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                TUTORIAL
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showTutorial && (
                    <motion.div
                        className="tutorial-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h2 className="tutorial-title">Cómo Jugar</h2>
                        <p className="tutorial-text">
                            Orbitas alrededor del núcleo central. Pulsos de luz
                            se expanden desde el centro. Tu misión es{" "}
                            <strong>absorber</strong> cada pulso en el momento
                            exacto en que alcanza tu órbita.
                            <br />
                            <br />
                            No antes. No después. En el <strong>
                                momento
                            </strong>{" "}
                            preciso.
                        </p>
                        <div className="tutorial-hint">
                            <span className="key-icon">ESPACIO</span>
                            <span>o</span>
                            <span className="key-icon">CLICK</span>
                            <span>para absorber</span>
                        </div>
                        <button
                            className="action-btn primary"
                            onClick={() => {
                                setShowTutorial(false)
                                setGameState("playing")
                            }}
                        >
                            COMENZAR
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                ARENA DE JUEGO
            ═══════════════════════════════════════════════════════════════ */}
            {(gameState === "playing" || gameState === "levelComplete") && (
                <>
                    {/* HUD */}
                    <div className="hud">
                        <div className="hud-level">
                            {level?.name || `Nivel ${currentLevel}`}
                        </div>
                        <div className="hud-score">{score}</div>
                        <div
                            className={`hud-combo ${combo > 1 ? "active" : ""}`}
                        >
                            {combo > 1 && `×${combo} COMBO`}
                        </div>
                    </div>

                    {/* Arena */}
                    <div
                        className="game-arena"
                        ref={arenaRef}
                        onClick={handleArenaClick}
                    >
                        {/* Anillos decorativos */}
                        <div className="orbital-ring ring-1" />
                        <div className="orbital-ring ring-2" />
                        <div className="orbital-ring ring-3" />

                        {/* Núcleo central */}
                        <div className="core">
                            <div className="core-inner" />
                        </div>

                        {/* Pulsos */}
                        {pulses.map((pulse) => (
                            <div
                                key={pulse.id}
                                className="pulse"
                                style={{
                                    width: pulse.radius * 2,
                                    height: pulse.radius * 2,
                                    borderColor: COLORS[pulse.color].main,
                                    boxShadow: `0 0 15px ${COLORS[pulse.color].glow}, inset 0 0 10px ${COLORS[pulse.color].glow}`,
                                    opacity: Math.max(
                                        0,
                                        1 - pulse.radius / pulse.maxRadius
                                    ),
                                }}
                            />
                        ))}

                        {/* Efectos de captura */}
                        {captureEffects.map((effect) => (
                            <CaptureParticles
                                key={effect.id}
                                color={effect.color}
                                x={effect.x}
                                y={effect.y}
                            />
                        ))}

                        {/* Jugador orbital */}
                        <div
                            className="player-orbit"
                            style={{
                                transform: `translate(-50%, -50%) rotate(${playerAngle}deg)`,
                            }}
                        >
                            <div
                                className={`player ${isCapturing ? "capturing" : ""}`}
                            />
                        </div>

                        {/* Indicador de miss */}
                        <div
                            className={`miss-indicator ${showMiss ? "show" : ""}`}
                        >
                            MISS
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${(hits / (level?.requiredHits || 1)) * 100}%`,
                            }}
                        />
                    </div>

                    {/* Indicador de siguiente color */}
                    <div className="next-color">
                        <span className="next-label">Próximo</span>
                        <div
                            className="next-dot"
                            style={{
                                background: COLORS[nextColorInPattern].main,
                                color: COLORS[nextColorInPattern].main,
                            }}
                        />
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                PANTALLA DE NIVEL COMPLETADO
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {gameState === "levelComplete" && (
                    <motion.div
                        className="level-complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h2 className="complete-title">¡SINCRONIZADO!</h2>

                        <div className="complete-stats">
                            <div className="stat-row">
                                Puntuación
                                <span className="stat-value">{score}</span>
                            </div>
                            <div className="stat-row">
                                Combo máximo
                                <span className="stat-value">×{maxCombo}</span>
                            </div>
                            <div className="stat-row">
                                Precisión
                                <span className="stat-value">
                                    {Math.round((hits / (hits + misses)) * 100)}
                                    %
                                </span>
                            </div>
                        </div>

                        <div className="complete-stars">
                            {[1, 2, 3, 4, 5].map((s) => {
                                const accuracy = hits / (hits + misses)
                                let earned = 1
                                if (accuracy >= 0.6) earned = 2
                                if (accuracy >= 0.75) earned = 3
                                if (accuracy >= 0.85) earned = 4
                                if (accuracy >= 0.95) earned = 5

                                return (
                                    <StarIcon
                                        key={s}
                                        filled={earned >= s}
                                        size={32}
                                    />
                                )
                            })}
                        </div>

                        <div className="action-buttons">
                            <button
                                className="action-btn secondary"
                                onClick={() => setGameState("menu")}
                            >
                                NIVELES
                            </button>
                            <button
                                className="action-btn primary"
                                onClick={() => startLevel(currentLevel)}
                            >
                                REINTENTAR
                            </button>
                            {currentLevel < LEVELS.length && (
                                <button
                                    className="action-btn primary"
                                    onClick={() => startLevel(currentLevel + 1)}
                                >
                                    SIGUIENTE
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTY CONTROLS PARA FRAMER
   ═══════════════════════════════════════════════════════════════════════════ */

addPropertyControls(PulsoOrbital, {
    consoleTitleImage: {
        type: ControlType.Image,
        title: "PNG Título Consola",
    },
    consoleTitleImageHeight: {
        type: ControlType.Number,
        title: "Alto PNG Consola",
        defaultValue: 84,
        min: 40,
        max: 260,
        step: 1,
    },
    consoleTitleTopOffset: {
        type: ControlType.Number,
        title: "Offset Superior PNG",
        defaultValue: 0,
        min: -80,
        max: 160,
        step: 1,
    },
    sfxCapture: {
        type: ControlType.File,
        title: "SFX Captura",
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },
    sfxMiss: {
        type: ControlType.File,
        title: "SFX Miss",
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },
    sfxLevelUp: {
        type: ControlType.File,
        title: "SFX Nivel Completado",
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },
    sfxVolume: {
        type: ControlType.Number,
        title: "Volumen SFX",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.01,
    },
})

export default PulsoOrbital
