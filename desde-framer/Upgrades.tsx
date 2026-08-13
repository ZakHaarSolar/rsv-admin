// HolographicHumanUpgrades.tsx
// Single-file Framer component — 100% SVG hologram + upgrades panel with drag-and-drop.
// No external deps (only React + Framer addPropertyControls). Desktop-only layout.
//
// Key features implemented:
// - SVG hologram with silhouette, grid/reticle, particles (drift + flicker), nebula/stars.
// - Glow (feGaussianBlur + feMerge), micro-glitch (feTurbulence + feDisplacementMap ~180ms).
// - Radial pulse from chest on apply; color interpolation to upgrade color.
// - Drag-and-drop upgrades onto hologram; accessible Apply button & keyboard DnD.
// - Undo / Redo / Remove / Reset; history reducer; optional localStorage persistence.
// - Mini-markdown parser (**bold**, - lists) with HTML escape.
// - Property Controls for Framer.
// ------------------------------------------------------------------------------

import * as React from "react"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
// @framerIntrinsicWidth 1200
// @framerIntrinsicHeight 900

// ------------------------------- Types ----------------------------------------

export type Upgrade = {
    id: string // "telekinesis"
    title: string // "Telekinesis"
    color: string // hex (if missing, accentColor is used)
    icon?: string // emoji or char
    pulse: string // simple text; supports **bold** and '- ' lists
    practices?: string[] // bullets
}

export type Props = {
    upgrades?: Upgrade[]
    // Framer sizing (necesario para poder arrastrar al canvas)
    width?: number
    height?: number
    accentColor?: string // default "#00D1FF"
    bgColor?: string // default "#0A0F14"
    particleAmount?: number // default 140
    glowStrength?: number // px, default 10
    glitchScale?: number // default 12
    pulseDurationMs?: number // default 900
    panelWidthPx?: number // default 420
    topMarginPx?: number // default 32
    allowMultiple?: boolean // default true
    maxActive?: number // default 5
    storageKey?: string // if present, persist active state + pulse overrides
    onApplyUpgrade?: (id: string) => void
    onRemoveUpgrade?: (id: string) => void
    onStateChange?: (state: { activeUpgrades: string[] }) => void
}

// ------------------------ Defaults / Example Upgrades -------------------------

const DEFAULT_UPGRADES: Upgrade[] = [
    {
        id: "economy",
        title: "Economy",
        icon: "💠",
        color: "#64D2FF",
        pulse: "**Pulso breve** sobre abundancia/eje.\n- Observa entradas y salidas\n- Micro-agradecimientos",
        practices: [
            "Mapa de flujos",
            "Regla del 1% diario",
            "Cierre con gratitud",
        ],
    },
    {
        id: "health",
        title: "Health",
        icon: "🫀",
        color: "#7CFFB2",
        pulse: "Homeostasis consciente.\n- Respiración lenta 4-7-8\n- Escaneo corporal neutro",
        practices: [
            "Resets de postura",
            "Hidratación rítmica",
            "Dormir a la misma hora",
        ],
    },
    {
        id: "beliefs",
        title: "Beliefs",
        icon: "🧠",
        color: "#C8A6FF",
        pulse: "Reescritura de guiones.\n- Detecta frases absolutas\n- Reformula en *posibilidades*",
        practices: [
            "Diario de evidencias",
            "Lenguaje probabilístico",
            "Anclas cognitivas",
        ],
    },
    {
        id: "empathy",
        title: "Empathy",
        icon: "🤝",
        color: "#FFD166",
        pulse: "Sintonía sin absorción.\n- Reflejo breve\n- Límites porosos inteligentes",
        practices: ["Escucha 2:1", "Parafraseo", "Cierre emocional ligero"],
    },
    {
        id: "solar_alignment",
        title: "Solar Alignment",
        icon: "☀️",
        color: "#FFE66D",
        pulse: "Coherencia eje.\n- Caderas, diafragma, lengua\n- Mirada al horizonte",
        practices: ["Saludo al sol corto", "Marca de intención AM/PM"],
    },
    {
        id: "telekinesis",
        title: "Telekinesis",
        icon: "🌀",
        color: "#4AA8FF",
        pulse: "Interfaz campo-forma.\n- **Psi-wheel**\n- Alinea intención + exhalación",
        practices: ["Psi-wheel", "Suspensión de juicio", "Ensayo kinestésico"],
    },
    {
        id: "quantum_perception",
        title: "Quantum Perception",
        icon: "🔷",
        color: "#78F3FF",
        pulse: "Patrones no-lineales.\n- Mirada blanda\n- Micro-saltos de atención",
        practices: ["Micro-saparé", "Lectura de ruido", "Desenfoque activo"],
    },
]

// ----------------------------- Utilities --------------------------------------

// Hex ⇄ RGB helpers
function clamp01(x: number) {
    return Math.min(1, Math.max(0, x))
}
function hexToRgb(hex: string) {
    const h = hex.replace("#", "")
    const v =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const num = parseInt(v, 16)
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
function rgbToHex(r: number, g: number, b: number) {
    const toHex = (n: number) => {
        const s = Math.round(Math.min(255, Math.max(0, n))).toString(16)
        return s.length === 1 ? "0" + s : s
    }
    return "#" + toHex(r) + toHex(g) + toHex(b)
}
function interpolateColor(a: string, b: string, t: number) {
    const ca = hexToRgb(a || "#000000")
    const cb = hexToRgb(b || "#000000")
    return rgbToHex(
        ca.r + (cb.r - ca.r) * t,
        ca.g + (cb.g - ca.g) * t,
        ca.b + (cb.b - ca.b) * t
    )
}

// HTML escape + tiny markdown (bold + '- ' lists)
function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
function parseMiniMarkdown(src: string) {
    const safe = escapeHtml(src || "")
    // **bold**
    const bolded = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Split lines and collect lists
    const lines = bolded.split(/\r?\n/)
    const out: string[] = []
    let inList = false
    for (const line of lines) {
        const m = line.match(/^\s*-\s+(.*)/)
        if (m) {
            if (!inList) {
                out.push("<ul>")
                inList = true
            }
            out.push("<li>" + m[1] + "</li>")
        } else {
            if (inList) {
                out.push("</ul>")
                inList = false
            }
            if (line.trim().length > 0) out.push("<p>" + line + "</p>")
            else out.push("<br/>")
        }
    }
    if (inList) out.push("</ul>")
    return out.join("")
}

// Local storage helpers
function loadStorage<T>(key?: string): T | undefined {
    if (!key) return undefined
    try {
        const raw = window.localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : undefined
    } catch {
        return undefined
    }
}
function saveStorage<T>(key: string | undefined, value: T) {
    if (!key) return
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
}

// ------------------------------- Reducer --------------------------------------

type HoloAction =
    | { type: "APPLY"; id: string; allowMultiple: boolean; maxActive: number }
    | { type: "REMOVE"; id: string }
    | { type: "RESET" }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "LOAD"; active: string[] }

type HoloState = {
    active: string[]
    past: string[][]
    future: string[][]
}

function reducer(state: HoloState, action: HoloAction): HoloState {
    switch (action.type) {
        case "LOAD": {
            return { active: [...action.active], past: [], future: [] }
        }
        case "APPLY": {
            const { id, allowMultiple, maxActive } = action
            let next = state.active.slice()
            const exists = next.includes(id)
            if (exists) {
                // Move to the end to mark "most recent"
                next = next.filter((x) => x !== id).concat(id)
            } else {
                if (!allowMultiple) {
                    next = [id]
                } else {
                    // enforce maxActive
                    if (next.length >= Math.max(1, maxActive)) {
                        next = next.slice(
                            next.length - (Math.max(1, maxActive) - 1)
                        )
                    }
                    next.push(id)
                }
            }
            return {
                active: next,
                past: [...state.past, state.active],
                future: [],
            }
        }
        case "REMOVE": {
            const next = state.active.filter((x) => x !== action.id)
            return {
                active: next,
                past: [...state.past, state.active],
                future: [],
            }
        }
        case "RESET": {
            if (state.active.length === 0) return state
            return {
                active: [],
                past: [...state.past, state.active],
                future: [],
            }
        }
        case "UNDO": {
            const prev = state.past[state.past.length - 1]
            if (!prev) return state
            return {
                active: prev,
                past: state.past.slice(0, -1),
                future: [state.active, ...state.future],
            }
        }
        case "REDO": {
            const next = state.future[0]
            if (!next) return state
            return {
                active: next,
                past: [...state.past, state.active],
                future: state.future.slice(1),
            }
        }
        default:
            return state
    }
}

// --------------------------- Component ----------------------------------------

const VIEW_SIZE = 900 // square canvas
const CHEST = { x: 450, y: 360 } // radial pulse origin inside silhouette

// Minimal, stylized human silhouette path (single closed path)
const SILHOUETTE_PATH = [
    // Head (circle-ish) -> neck -> shoulders -> arms -> torso -> legs (Y stance) -> close
    "M450,120",
    "c-44,0 -78,34 -78,76 s34,76 78,76 s78,-34 78,-76 s-34,-76 -78,-76 z",
    "M410,272 L410,300",
    "C360,325 330,370 325,420",
    "L325,520 C325,540 345,550 360,545",
    "C375,541 382,526 384,512 L392,452",
    "C395,436 400,428 410,420",
    "L410,530",
    "C410,565 420,600 450,610",
    "C480,600 490,565 490,530 L490,420",
    "C500,428 505,436 508,452 L516,512",
    "C518,526 525,541 540,545 C555,550 575,540 575,520 L575,420",
    "C570,370 540,325 490,300 L490,272",
    // Hips
    "C490,320 470,340 450,340 C430,340 410,320 410,272 z",
    // Legs
    "M430,610",
    "C400,660 385,720 370,780 C365,800 380,820 400,820",
    "C420,820 430,805 440,785",
    "C450,760 460,740 470,720",
    "M470,610",
    "C500,660 515,720 530,780 C535,800 520,820 500,820",
    "C480,820 470,805 460,785",
    "C450,760 440,740 430,720 z",
].join(" ")

const STAR_COUNT = 120

// Particle model (drift + flicker)
type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    o: number // opacity
}

export default function HolographicHumanUpgrades({
    // Framer lee width/height para crear el frame al soltar desde Insert
    width = 1200,
    height = 900,
    upgrades = DEFAULT_UPGRADES,
    accentColor = "#00D1FF",
    bgColor = "#0A0F14",
    particleAmount = 140,
    glowStrength = 10,
    glitchScale = 12,
    pulseDurationMs = 900,
    panelWidthPx = 420,
    topMarginPx = 32,
    allowMultiple = true,
    maxActive = 5,
    storageKey,
    onApplyUpgrade,
    onRemoveUpgrade,
    onStateChange,
}: Props) {
    // --------------------- State: reducer + persistence -------------------------
    const [state, dispatch] = useReducer(reducer, {
        active: [],
        past: [],
        future: [],
    })

    // pulse text overrides per-upgrade (editable)
    const [pulseOverrides, setPulseOverrides] = useState<
        Record<string, string>
    >({})

    // selected upgrade for keyboard DnD (press Enter on hologram to apply)
    const [selectedForApply, setSelectedForApply] = useState<string | null>(
        null
    )

    // ARIA live announcements
    const liveRef = useRef<HTMLDivElement>(null)
    const announce = (s: string) => {
        if (!liveRef.current) return
        liveRef.current.textContent = s
    }

    // load persisted
    useEffect(() => {
        const loaded = loadStorage<{
            active: string[]
            pulseOverrides?: Record<string, string>
        }>(storageKey)
        if (loaded?.active) dispatch({ type: "LOAD", active: loaded.active })
        if (loaded?.pulseOverrides) setPulseOverrides(loaded.pulseOverrides)
    }, [storageKey])

    // persist on change
    useEffect(() => {
        if (onStateChange) onStateChange({ activeUpgrades: state.active })
        saveStorage(storageKey, { active: state.active, pulseOverrides })
    }, [state.active, pulseOverrides, storageKey])

    // --------------------- Derived: current active / color target ---------------
    const byId = useMemo(() => {
        const map: Record<string, Upgrade> = {}
        for (const u of upgrades) map[u.id] = u
        return map
    }, [upgrades])

    const lastActiveId = state.active[state.active.length - 1]
    const lastActive = lastActiveId ? byId[lastActiveId] : undefined

    // UI color interpolated from current -> target
    const [uiColor, setUiColor] = useState<string>(accentColor)
    const colorFromRef = useRef<string>(accentColor)
    const colorAnimRef = useRef<number | null>(null)

    function animateColorTo(target: string, duration = 600) {
        if (!target) target = accentColor
        const from = colorFromRef.current || accentColor
        const start = performance.now()
        if (colorAnimRef.current) cancelAnimationFrame(colorAnimRef.current)
        const loop = (t: number) => {
            const k = clamp01((t - start) / duration)
            const c = interpolateColor(from, target, k)
            setUiColor(c)
            if (k < 1) colorAnimRef.current = requestAnimationFrame(loop)
            else {
                colorFromRef.current = target
                colorAnimRef.current = null
            }
        }
        colorAnimRef.current = requestAnimationFrame(loop)
    }

    // whenever active changes, glide to last's color else accent
    useEffect(() => {
        const target = lastActive?.color || accentColor
        animateColorTo(target, 600)
    }, [lastActiveId, accentColor])

    // --------------------- Glitch (feTurbulence / feDisplacementMap) ------------
    const turbRef = useRef<SVGFETurbulenceElement | null>(null)
    const dispRef = useRef<SVGFEDisplacementMapElement | null>(null)

    function microGlitch(duration = 180) {
        const start = performance.now()
        const animate = (t: number) => {
            const k = clamp01((t - start) / duration)
            const jitter = 0.02 + Math.sin(k * Math.PI * 4) * 0.12 // baseFrequency
            const seed = Math.floor(Math.random() * 999)
            if (turbRef.current) {
                turbRef.current.setAttribute("baseFrequency", String(jitter))
                turbRef.current.setAttribute("seed", String(seed))
            }
            if (dispRef.current) {
                const scale = glitchScale * (0.5 + Math.sin(k * Math.PI * 2))
                dispRef.current.setAttribute("scale", String(scale))
            }
            if (k < 1) requestAnimationFrame(animate)
            else {
                // reset
                if (turbRef.current)
                    turbRef.current.setAttribute("baseFrequency", "0.003")
                if (dispRef.current) dispRef.current.setAttribute("scale", "0")
            }
        }
        requestAnimationFrame(animate)
    }

    // --------------------- Pulse (radial ring) ----------------------------------
    const pulseCircleRef = useRef<SVGCircleElement>(null)
    function triggerPulse(durationMs = pulseDurationMs) {
        const start = performance.now()
        const maxR = 420
        const loop = (t: number) => {
            const k = clamp01((t - start) / durationMs)
            const r = 5 + maxR * k
            const o = 0.6 * (1 - k)
            if (pulseCircleRef.current) {
                pulseCircleRef.current.setAttribute("r", String(r))
                pulseCircleRef.current.setAttribute("opacity", String(o))
                pulseCircleRef.current.setAttribute("stroke", uiColor)
            }
            if (k < 1) requestAnimationFrame(loop)
            else if (pulseCircleRef.current) {
                pulseCircleRef.current.setAttribute("r", "0")
                pulseCircleRef.current.setAttribute("opacity", "0")
            }
        }
        requestAnimationFrame(loop)
    }

    // --------------------- Particles (drift + flicker) --------------------------
    const particleCountRef = useRef<number>(
        Math.max(20, Math.min(300, particleAmount))
    )
    const [particleCount, setParticleCount] = useState<number>(
        Math.max(20, Math.min(300, particleAmount))
    )
    const particlesRef = useRef<Particle[]>([])
    const particleElsRef = useRef<(SVGCircleElement | null)[]>([])
    const fpsRef = useRef<{ t0: number; frames: number }>({
        t0: performance.now(),
        frames: 0,
    })

    useEffect(() => {
        const desired = Math.max(20, Math.min(300, particleAmount | 0))
        particleCountRef.current = desired
        setParticleCount(desired)
    }, [particleAmount])

    // init particles when count changes
    useEffect(() => {
        const arr: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            arr.push({
                x: Math.random() * VIEW_SIZE,
                y: Math.random() * VIEW_SIZE,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: 0.8 + Math.random() * 1.8,
                o: 0.35 + Math.random() * 0.55,
            })
        }
        particlesRef.current = arr
    }, [particleCount])

    // raf loop for drift + flicker with light throttling
    const runParticlesRef = useRef(true)
    useEffect(() => {
        runParticlesRef.current = true
        const loop = () => {
            if (!runParticlesRef.current) return
            const arr = particlesRef.current
            const els = particleElsRef.current
            for (let i = 0; i < arr.length; i++) {
                const p = arr[i]
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0) p.x += VIEW_SIZE
                if (p.y < 0) p.y += VIEW_SIZE
                if (p.x > VIEW_SIZE) p.x -= VIEW_SIZE
                if (p.y > VIEW_SIZE) p.y -= VIEW_SIZE
                // slow wandering
                p.vx += (Math.random() - 0.5) * 0.01
                p.vy += (Math.random() - 0.5) * 0.01
                p.vx = Math.max(-0.35, Math.min(0.35, p.vx))
                p.vy = Math.max(-0.35, Math.min(0.35, p.vy))
                // flicker
                p.o += (Math.random() - 0.5) * 0.02
                p.o = Math.max(0.2, Math.min(0.9, p.o))
                const el = els[i]
                if (el) {
                    el.setAttribute("cx", p.x.toFixed(1))
                    el.setAttribute("cy", p.y.toFixed(1))
                    el.setAttribute("r", p.r.toFixed(2))
                    el.setAttribute("opacity", p.o.toFixed(2))
                }
            }
            // FPS monitor to auto-reduce particle count if <45
            const now = performance.now()
            fpsRef.current.frames++
            if (now - fpsRef.current.t0 >= 1000) {
                const fps =
                    (fpsRef.current.frames * 1000) / (now - fpsRef.current.t0)
                fpsRef.current.t0 = now
                fpsRef.current.frames = 0
                if (fps < 45 && particlesRef.current.length > 80) {
                    const next = Math.floor(particlesRef.current.length * 0.85)
                    particlesRef.current = particlesRef.current.slice(0, next)
                    setParticleCount(next)
                }
            }
            requestAnimationFrame(loop)
        }
        const id = requestAnimationFrame(loop)
        return () => {
            runParticlesRef.current = false
            cancelAnimationFrame(id)
        }
    }, [])

    // --------------------- Apply / Remove / Undo / Redo -------------------------
    const applyUpgrade = (id: string) => {
        dispatch({ type: "APPLY", id, allowMultiple, maxActive })
        window.dispatchEvent(
            new CustomEvent("holo:upgrade", { detail: { id, action: "apply" } })
        )
        onApplyUpgrade && onApplyUpgrade(id)
        // feedback
        triggerPulse()
        microGlitch()
        announce(`${byId[id]?.title || id} fused`)
    }
    const removeUpgrade = (id: string) => {
        dispatch({ type: "REMOVE", id })
        onRemoveUpgrade && onRemoveUpgrade(id)
        announce(`${byId[id]?.title || id} removed`)
    }
    const resetAll = () => {
        dispatch({ type: "RESET" })
        announce("All upgrades reset")
    }

    // --------------------- Drag-and-drop handlers --------------------------------
    const holoDropZoneRef = useRef<HTMLDivElement>(null)
    const onDragStartCard = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("text/plain", id)
        e.dataTransfer.effectAllowed = "copyMove"
        setSelectedForApply(id)
    }
    const onDragOverHolo = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }
    const onDropHolo = (e: React.DragEvent) => {
        e.preventDefault()
        const id = e.dataTransfer.getData("text/plain")
        if (id) applyUpgrade(id)
        setSelectedForApply(null)
    }

    // Keyboard DnD alternative: Enter on card selects; Enter on hologram applies.
    const onKeyDownHolo = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && selectedForApply) {
            applyUpgrade(selectedForApply)
            setSelectedForApply(null)
        }
        if (e.key === "Backspace" && lastActiveId) {
            removeUpgrade(lastActiveId)
        }
    }

    // --------------------- Stars / Nebula (background) --------------------------
    const stars = useMemo(() => {
        const s: { x: number; y: number; r: number; o: number }[] = []
        for (let i = 0; i < STAR_COUNT; i++) {
            s.push({
                x: Math.random() * VIEW_SIZE,
                y: Math.random() * VIEW_SIZE,
                r: Math.random() * 1.2 + 0.2,
                o: Math.random() * 0.4 + 0.15,
            })
        }
        return s
    }, []) // once

    // --------------------- UI Helpers -------------------------------------------
    const isActive = (id: string) => state.active.includes(id)

    const activePulseText =
        (lastActive && (pulseOverrides[lastActive.id] ?? lastActive.pulse)) ||
        ""

    const setActivePulseText = (v: string) => {
        if (!lastActive) return
        setPulseOverrides((prev) => {
            const next = { ...prev, [lastActive.id]: v }
            saveStorage(storageKey, {
                active: state.active,
                pulseOverrides: next,
            })
            return next
        })
    }

    // ------------------------------ Render --------------------------------------

    return (
        <div
            style={{
                width, // ← Framer necesita números aquí
                height, // ← para calcular el frame al insertar
                maxWidth: 1440,
                margin: "0 auto",
                paddingTop: topMarginPx,

                color: "white",
                fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }}
        >
            {/* Accessible live region */}
            <div
                ref={liveRef}
                aria-live="polite"
                style={{
                    position: "absolute",
                    left: -9999,
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                }}
            />

            {/* Local styles (focus rings, buttons) */}
            <style>{`
        .holo-grid{ display:grid; grid-template-columns: 1fr ${panelWidthPx}px; gap:24px; align-items:start;}
        .panel{ background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; position:sticky; top:${topMarginPx}px;}
        .card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border:1px solid rgba(255,255,255,0.08); border-radius:10px; background: rgba(255,255,255,0.02); cursor:grab; user-select:none; }
        .card:hover{ background: rgba(255,255,255,0.06); }
        .card[aria-pressed="true"]{ outline:2px solid ${uiColor}; }
        .card:focus{ outline:2px solid #fff; outline-offset:2px; }
        .btn{ border:1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color:#fff; border-radius:8px; padding:8px 12px; cursor:pointer; }
        .btn:hover{ background: rgba(255,255,255,0.1); }
        .btn:focus{ outline:2px solid #fff; outline-offset:2px; }
        .btn.bad{ border-color: rgba(255,80,80,0.5); }
        .title{ font-weight:600; letter-spacing:0.2px; }
        .subtitle{ opacity:0.7; font-size:12px; }
        .kbd{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.12); }
        .applyBadge{ font-size:12px; opacity:0.8; }
        .toolbar{ display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 12px 0; }
        .panelSection{ margin-top:14px; }
        .pulseBox{ width:100%; min-height:86px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; color:#dfefff; }
        .pulsePreview{ border:1px dashed rgba(255,255,255,0.18); padding:10px; border-radius:8px; background:rgba(0,0,0,0.2); }
        .badge{ font-size:11px; opacity:0.75; }
      `}</style>

            <div className="holo-grid">
                {/* Left: Hologram + Drop Zone */}
                <div
                    ref={holoDropZoneRef}
                    onDragOver={onDragOverHolo}
                    onDrop={onDropHolo}
                    tabIndex={0}
                    onKeyDown={onKeyDownHolo}
                    role="region"
                    aria-label="Hologram upgrade drop zone"
                    style={{
                        background: bgColor,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <svg
                        width="100%"
                        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
                        style={{ display: "block" }}
                        role="img"
                        aria-label="Holographic human"
                    >
                        <defs>
                            {/* Glow filter */}
                            <filter
                                id="holoGlow"
                                x="-50%"
                                y="-50%"
                                width="200%"
                                height="200%"
                            >
                                <feGaussianBlur
                                    stdDeviation={glowStrength}
                                    result="blur"
                                />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Micro-glitch filter */}
                            <filter
                                id="holoGlitch"
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                            >
                                <feTurbulence
                                    ref={turbRef}
                                    type="fractalNoise"
                                    baseFrequency="0.003"
                                    numOctaves="1"
                                    seed="5"
                                    result="noise"
                                />
                                <feDisplacementMap
                                    ref={dispRef}
                                    in="SourceGraphic"
                                    in2="noise"
                                    scale="0"
                                    xChannelSelector="R"
                                    yChannelSelector="G"
                                />
                            </filter>

                            {/* Scan dot pattern */}
                            <pattern
                                id="scanDots"
                                x="0"
                                y="0"
                                width="8"
                                height="8"
                                patternUnits="userSpaceOnUse"
                            >
                                <circle
                                    cx="1"
                                    cy="1"
                                    r="0.7"
                                    fill="rgba(255,255,255,0.12)"
                                />
                            </pattern>

                            {/* Silhouette clipPath */}
                            <clipPath id="silClip">
                                <path d={SILHOUETTE_PATH} />
                            </clipPath>

                            {/* HUD reticle rings as reusable path */}
                            <g id="reticle">
                                <circle
                                    cx={CHEST.x}
                                    cy={CHEST.y}
                                    r="64"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    opacity="0.8"
                                />
                                <circle
                                    cx={CHEST.x}
                                    cy={CHEST.y}
                                    r="92"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="0.8"
                                    opacity="0.5"
                                />
                                <circle
                                    cx={CHEST.x}
                                    cy={CHEST.y}
                                    r="128"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="0.6"
                                    opacity="0.35"
                                />
                                <line
                                    x1={CHEST.x - 140}
                                    x2={CHEST.x + 140}
                                    y1={CHEST.y}
                                    y2={CHEST.y}
                                    stroke="currentColor"
                                    strokeWidth="0.6"
                                    opacity="0.4"
                                />
                                <line
                                    x1={CHEST.x}
                                    x2={CHEST.x}
                                    y1={CHEST.y - 140}
                                    y2={CHEST.y + 140}
                                    stroke="currentColor"
                                    strokeWidth="0.6"
                                    opacity="0.4"
                                />
                            </g>
                        </defs>

                        {/* Starry / nebula back */}
                        <g>
                            <rect width="100%" height="100%" fill={bgColor} />
                            <g opacity="0.9">
                                {stars.map((s, i) => (
                                    <circle
                                        key={i}
                                        cx={s.x}
                                        cy={s.y}
                                        r={s.r}
                                        fill="#ffffff"
                                        opacity={s.o}
                                    />
                                ))}
                            </g>
                            {/* Soft radial fog */}
                            <radialGradient id="fog" cx="50%" cy="50%">
                                <stop
                                    offset="0%"
                                    stopColor={uiColor}
                                    stopOpacity="0.08"
                                />
                                <stop
                                    offset="100%"
                                    stopColor={bgColor}
                                    stopOpacity="0"
                                />
                            </radialGradient>
                            <circle
                                cx={VIEW_SIZE / 2}
                                cy={VIEW_SIZE / 2}
                                r={VIEW_SIZE * 0.48}
                                fill="url(#fog)"
                            />
                        </g>

                        {/* Hologram group (glitch filter applies here) */}
                        <g filter="url(#holoGlitch)" style={{ color: uiColor }}>
                            {/* Outer silhouette glow */}
                            <path
                                d={SILHOUETTE_PATH}
                                fill="none"
                                stroke={uiColor}
                                strokeWidth={2}
                                opacity={0.95}
                                filter="url(#holoGlow)"
                            />

                            {/* Inner fill with scan dots + faint tint */}
                            <g clipPath="url(#silClip)">
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="url(#scanDots)"
                                />
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill={uiColor}
                                    opacity="0.05"
                                />
                            </g>

                            {/* Reticle rings around chest */}
                            <use href="#reticle" style={{ color: uiColor }} />

                            {/* Grid lines clipped inside silhouette */}
                            <g
                                clipPath="url(#silClip)"
                                opacity="0.35"
                                stroke={uiColor}
                            >
                                {/* horizontal scan lines */}
                                {Array.from({ length: 16 }).map((_, i) => {
                                    const y = 240 + i * 28
                                    return (
                                        <line
                                            key={"h" + i}
                                            x1={280}
                                            x2={620}
                                            y1={y}
                                            y2={y}
                                            strokeWidth={0.5}
                                        />
                                    )
                                })}
                                {/* vertical lines */}
                                {Array.from({ length: 10 }).map((_, i) => {
                                    const x = 340 + i * 24
                                    return (
                                        <line
                                            key={"v" + i}
                                            x1={x}
                                            x2={x}
                                            y1={240}
                                            y2={700}
                                            strokeWidth={0.4}
                                            opacity={0.3}
                                        />
                                    )
                                })}
                            </g>

                            {/* Particles (clipped) */}
                            <g clipPath="url(#silClip)" fill={uiColor}>
                                {particlesRef.current.map((p, i) => (
                                    <circle
                                        key={i}
                                        ref={(el) =>
                                            (particleElsRef.current[i] = el)
                                        }
                                        cx={p.x}
                                        cy={p.y}
                                        r={p.r}
                                        opacity={p.o}
                                    />
                                ))}
                            </g>

                            {/* Pulse ring (animated on apply) */}
                            <circle
                                ref={pulseCircleRef}
                                cx={CHEST.x}
                                cy={CHEST.y}
                                r={0}
                                fill="none"
                                stroke={uiColor}
                                strokeWidth={2}
                                opacity={0}
                            />
                        </g>
                    </svg>

                    {/* Overlay Hint */}
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            fontSize: 12,
                            opacity: 0.8,
                        }}
                    >
                        <span className="badge">
                            Arrastra una tarjeta aquí o selecciona con{" "}
                            <span className="kbd">Enter</span> y aplica con{" "}
                            <span className="kbd">Enter</span>.
                        </span>
                    </div>
                </div>

                {/* Right: Panel */}
                <div
                    className="panel"
                    role="complementary"
                    aria-label="Upgrades Panel"
                >
                    <div
                        className="title"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>Upgrades</span>
                        <span className="applyBadge" style={{ color: uiColor }}>
                            Activos: {state.active.length}
                        </span>
                    </div>

                    <div className="toolbar">
                        <button
                            className="btn"
                            onClick={() => dispatch({ type: "UNDO" })}
                            title="Undo (Ctrl+Z)"
                        >
                            ⟲ Undo
                        </button>
                        <button
                            className="btn"
                            onClick={() => dispatch({ type: "REDO" })}
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            ⟳ Redo
                        </button>
                        <button
                            className="btn bad"
                            onClick={resetAll}
                            title="Reset all"
                        >
                            ✖ Reset
                        </button>
                    </div>

                    {/* Cards */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {upgrades.map((u) => {
                            const active = isActive(u.id)
                            const selected = selectedForApply === u.id
                            return (
                                <div
                                    key={u.id}
                                    className="card"
                                    draggable
                                    onDragStart={(e) =>
                                        onDragStartCard(e, u.id)
                                    }
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={selected ? "true" : "false"}
                                    aria-label={`${u.title} upgrade`}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            // select for keyboard DnD or apply directly if hologram not focused
                                            setSelectedForApply(u.id)
                                        }
                                        if (e.key === "Backspace" && active)
                                            removeUpgrade(u.id)
                                    }}
                                    style={{
                                        borderColor: active
                                            ? uiColor
                                            : undefined,
                                        boxShadow: active
                                            ? `0 0 0 1px ${uiColor} inset`
                                            : undefined,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                background:
                                                    "rgba(255,255,255,0.08)",
                                                display: "grid",
                                                placeItems: "center",
                                                fontSize: 18,
                                            }}
                                        >
                                            {u.icon || "⬡"}
                                        </div>
                                        <div>
                                            <div className="title">
                                                {u.title}
                                            </div>
                                            <div
                                                className="subtitle"
                                                style={{
                                                    color:
                                                        u.color || accentColor,
                                                }}
                                            >
                                                {u.color || accentColor}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            className="btn"
                                            onClick={() => applyUpgrade(u.id)}
                                            title="Apply"
                                        >
                                            Apply
                                        </button>
                                        {active ? (
                                            <button
                                                className="btn bad"
                                                onClick={() =>
                                                    removeUpgrade(u.id)
                                                }
                                                title="Remove"
                                            >
                                                Remove
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Active details */}
                    <div className="panelSection">
                        <div className="title" style={{ marginBottom: 6 }}>
                            {lastActive
                                ? `${lastActive.icon || "⬡"} ${lastActive.title}`
                                : "Ningún upgrade activo"}
                        </div>
                        {lastActive && (
                            <>
                                <div
                                    className="subtitle"
                                    style={{ marginBottom: 8 }}
                                >
                                    Pulso (editable)
                                </div>
                                <textarea
                                    className="pulseBox"
                                    value={activePulseText}
                                    onChange={(e) =>
                                        setActivePulseText(e.target.value)
                                    }
                                    placeholder="Escribe aquí el pulso..."
                                />
                                <div
                                    className="subtitle"
                                    style={{ marginTop: 10 }}
                                >
                                    Vista previa:
                                </div>
                                <div
                                    className="pulsePreview"
                                    style={{ marginTop: 6 }}
                                    dangerouslySetInnerHTML={{
                                        __html: parseMiniMarkdown(
                                            activePulseText
                                        ),
                                    }}
                                />
                                {lastActive.practices &&
                                    lastActive.practices.length > 0 && (
                                        <>
                                            <div
                                                className="subtitle"
                                                style={{ marginTop: 10 }}
                                            >
                                                Prácticas sugeridas
                                            </div>
                                            <ul style={{ marginTop: 6 }}>
                                                {lastActive.practices.map(
                                                    (p, i) => (
                                                        <li
                                                            key={i}
                                                            style={{
                                                                opacity: 0.9,
                                                            }}
                                                        >
                                                            {p}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ------------------------- Framer Property Controls ---------------------------

HolographicHumanUpgrades.defaultProps = {
    width: 1200,
    height: 900,
    accentColor: "#00D1FF",
    bgColor: "#0A0F14",
    particleAmount: 140,
    glowStrength: 10,
    glitchScale: 12,
    pulseDurationMs: 900,
    panelWidthPx: 420,
    topMarginPx: 32,
    allowMultiple: true,
    maxActive: 5,
}

addPropertyControls(HolographicHumanUpgrades, {
    accentColor: { type: ControlType.Color, title: "Accent" },
    bgColor: { type: ControlType.Color, title: "BG Color" },
    particleAmount: {
        type: ControlType.Number,
        title: "Particles",
        min: 20,
        max: 300,
        step: 1,
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 25,
        step: 1,
    },
    glitchScale: {
        type: ControlType.Number,
        title: "Glitch",
        min: 0,
        max: 30,
        step: 1,
    },
    pulseDurationMs: {
        type: ControlType.Number,
        title: "Pulse ms",
        min: 300,
        max: 1600,
        step: 50,
    },
    panelWidthPx: {
        type: ControlType.Number,
        title: "Panel W",
        min: 260,
        max: 640,
        step: 10,
    },
    topMarginPx: {
        type: ControlType.Number,
        title: "Top Margin",
        min: 0,
        max: 120,
        step: 2,
    },
    allowMultiple: { type: ControlType.Boolean, title: "Multiple" },
    maxActive: {
        type: ControlType.Number,
        title: "Max Active",
        min: 1,
        max: 12,
        step: 1,
    },
    storageKey: { type: ControlType.String, title: "Storage Key" },
})

// ------------------------------- Export ---------------------------------------
HolographicHumanUpgrades.displayName = "HolographicHumanUpgrades"
