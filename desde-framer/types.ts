// types.ts
// Shared types + helpers + DEFAULT_UPGRADES

export type Upgrade = {
    id: string // ej: "telekinesis"
    title: string // "Telekinesis"
    color: string // hex o rgba
    icon?: string // emoji o nombre de ícono
    pulse: string // markdown corto
    practices?: string[] // bullets
}

export type HoloState = {
    activeUpgrades: string[]
}

export type RenderMode = "hybrid" | "three" | "svg"

export interface HolographicHumanUpgradesProps {
    upgrades?: Upgrade[]
    upgradesUrl?: string

    allowMultiple?: boolean // default true
    maxActive?: number // default 5

    storageKey?: string // default "holo_upgrades_v1"

    // callbacks
    onApplyUpgrade?: (id: string) => void
    onRemoveUpgrade?: (id: string) => void
    onReset?: (state: HoloState) => void
    onStateChange?: (state: HoloState) => void

    // visuals / controls
    accentColor?: string // primary neon blue
    bgColor?: string // background color
    glow?: number // 0..3
    scanlineDensity?: number // 0..3 lines/mm metaphor
    particleAmount?: number // 0..2000
    pulseIntensity?: number // 0..3
    renderMode?: RenderMode // default "hybrid"
    topMarginPx?: number // default 24
    panelWidthPx?: number // default 420
    modelUrl?: string // optional GLTF/GLB

    // timings (ms)
    glitchMs?: number // default 200
    pulseMs?: number // default 700
    stabilizeMs?: number // default 400
}

export type HolographicHumanUpgradesRef = {
    reset: () => void
    apply: (id: string) => void
    remove: (id: string) => void
    getState: () => { activeUpgrades: string[] }
}

// ---- Helpers ----

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

export function isWebGLAvailable(): boolean {
    try {
        const canvas = document.createElement("canvas")
        const gl = (canvas.getContext("webgl") ||
            canvas.getContext(
                "experimental-webgl"
            )) as WebGLRenderingContext | null
        return !!gl && gl instanceof WebGLRenderingContext
    } catch {
        return false
    }
}

// ---- Default dataset ----

export const DEFAULT_UPGRADES: Upgrade[] = [
    {
        id: "economy",
        title: "Economic Upgrade",
        color: "#64D2FF",
        pulse: "**Reconoce abundancia como estado de eje.**\n- Observa gastos automáticos\n- Diseña 1 intercambio de alto valor sin fricción",
        practices: ["Mapa de flujos en 15 min", "Eliminar 1 fuga hoy"],
    },
    {
        id: "health",
        title: "Health Upgrade",
        color: "#7CFFB2",
        pulse: "**Homeostasis consciente.**\nRespiración 4-6, hidratación, ritmo circadiano.",
        practices: ["Walk 20’ al sol", "2L agua + electrolitos"],
    },
    {
        id: "beliefs",
        title: "Belief Systems",
        color: "#C8A6FF",
        pulse: "**Reescritura de guiones.**\nDetecta ‘no puedo’ → reemplazo vibral.",
        practices: ["Diario 5’ gatillos", "Reframing en voz alta"],
    },
    {
        id: "empathy",
        title: "Empathy",
        color: "#FFD166",
        pulse: "**Sintonía sin absorción.**\nEscucha 3:1, refleja sin consejos.",
        practices: ["Parafrasea + valida", "Cierra con ‘¿necesitas algo?’"],
    },
    {
        id: "solar_alignment",
        title: "Solar Alignment",
        color: "#FFE66D",
        pulse: "**Eje luminoso.**\nCoherencia de intención-acción-ritmo.",
        practices: ["Micro-ritual AM 3’", "Compromiso 1 cosa/día"],
    },
    {
        id: "telekinesis",
        title: "Telekinesis",
        color: "#4AA8FF",
        pulse: "**Interfaz campo-forma.**\nAtención sostenida + micro-tensión/relajación.",
        practices: [
            "Barómetro de micro-movimiento",
            "Ensayo con pluma/psi-wheel",
        ],
    },
    {
        id: "quantum_perception",
        title: "Quantum Perception",
        color: "#78F3FF",
        pulse: "**Reconocimiento de patrones no-lineales.**",
        practices: ["Diagrama de sincronicidades", "Silencio 7’ sin estímulos"],
    },
]
