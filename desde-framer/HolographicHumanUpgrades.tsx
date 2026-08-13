// HolographicHumanUpgrades.tsx
// Versión auto-contenida (sin paquetes externos). Lista para Insert → Code → arrastrar.
// Incluye: tipos, dataset por defecto, SVG holograma, drag&drop, panel Pulse, undo/redo, localStorage.

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// ------------------ Tipos + dataset ------------------

type Upgrade = {
    id: string
    title: string
    color: string
    icon?: string
    pulse: string
    practices?: string[]
}

type HoloState = { activeUpgrades: string[] }

type Props = {
    upgrades?: Upgrade[]
    upgradesUrl?: string
    allowMultiple?: boolean
    maxActive?: number
    storageKey?: string
    onApplyUpgrade?: (id: string) => void
    onRemoveUpgrade?: (id: string) => void
    onReset?: (state: HoloState) => void
    onStateChange?: (state: HoloState) => void
    accentColor?: string
    bgColor?: string
    glow?: number
    scanlineDensity?: number
    topMarginPx?: number
    panelWidthPx?: number
    glitchMs?: number
    pulseMs?: number
    stabilizeMs?: number
}

const DEFAULT_UPGRADES: Upgrade[] = [
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

// ------------------ Helpers (sin paquetes) ------------------

function useLocalStorage<T>(
    key: string | undefined,
    initial: T
): [T, (v: T) => void] {
    const [state, setState] = React.useState<T>(() => {
        if (!key) return initial
        try {
            const raw = window.localStorage.getItem(key)
            return raw ? (JSON.parse(raw) as T) : initial
        } catch {
            return initial
        }
    })
    const set = (v: T) => {
        setState(v)
        if (key)
            try {
                window.localStorage.setItem(key, JSON.stringify(v))
            } catch {}
    }
    return [state, set]
}

function useFetchUpgrades(
    url?: string,
    fallback?: Upgrade[]
): [Upgrade[], boolean] {
    const [data, setData] = React.useState<Upgrade[]>(
        fallback && fallback.length ? fallback : DEFAULT_UPGRADES
    )
    const [loading, setLoading] = React.useState<boolean>(!!url)
    React.useEffect(() => {
        let alive = true
        if (!url) return
        ;(async () => {
            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error(`Fetch ${res.status}`)
                const json = (await res.json()) as Upgrade[]
                if (alive && Array.isArray(json) && json.length) setData(json)
            } catch (e) {
                console.warn(
                    "[Hologram] upgradesUrl failed, using fallback.",
                    e
                )
            } finally {
                if (alive) setLoading(false)
            }
        })()
        return () => {
            alive = false
        }
    }, [url])
    return [data, loading]
}

// Markdown muy básico → HTML seguro (sin enlaces/script)
function mdToHtml(src: string) {
    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    let s = esc(src)
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    s = s.replace(/^[\-\u2022]\s+/gm, "• ")
    s = s.replace(/\n/g, "<br/>")
    return s
}

// ------------------ HoloSVG (fallback visual) ------------------

const HoloSVG: React.FC<{
    accentColor: string
    bgColor: string
    scanlineDensity: number
    glow: number
    pulseKey: number
    onDrop?: (e: React.DragEvent) => void
    onDragOver?: (e: React.DragEvent) => void
    style?: React.CSSProperties
}> = ({
    accentColor,
    bgColor,
    scanlineDensity,
    glow,
    pulseKey,
    onDrop,
    onDragOver,
    style,
}) => {
    const lines = Math.floor(120 * scanlineDensity + 40)
    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: bgColor,
                overflow: "hidden",
                borderRadius: 12,
                ...style,
            }}
            aria-label="Hologram SVG"
        >
            {/* scanlines */}
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0 }}
            >
                {Array.from({ length: lines }).map((_, i) => (
                    <line
                        key={i}
                        x1="0%"
                        x2="100%"
                        y1={`${(i / lines) * 100}%`}
                        y2={`${(i / lines) * 100}%`}
                        stroke={accentColor}
                        opacity={0.05}
                        strokeWidth={i % 5 === 0 ? 1 : 0.5}
                    />
                ))}
            </svg>

            {/* humanoide wireframe + órbita */}
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0 }}
            >
                <g
                    transform="translate(50%, 50%)"
                    style={{
                        filter: `drop-shadow(0 0 ${6 + glow * 6}px ${accentColor})`,
                    }}
                    stroke={accentColor}
                    strokeWidth={1.5}
                    fill="none"
                    opacity={0.9}
                >
                    <circle cx="0" cy="-140" r="28" />
                    <line x1="0" y1="-112" x2="0" y2="-60" />
                    <rect x="-24" y="-60" width="48" height="88" rx="10" />
                    <polyline points="-24,-46 -58,-12 -32,12" />
                    <polyline points="24,-46 58,-12 32,12" />
                    <line x1="0" y1="28" x2="-18" y2="64" />
                    <line x1="0" y1="28" x2="18" y2="64" />
                    <line x1="-18" y1="64" x2="-14" y2="120" />
                    <line x1="18" y1="64" x2="14" y2="120" />
                    {Array.from({ length: 36 }).map((_, i) => {
                        const a = (i / 36) * Math.PI * 2
                        const r = 150 + 10 * Math.sin(i * 1.7)
                        return (
                            <circle
                                key={i}
                                cx={Math.cos(a) * r}
                                cy={Math.sin(a) * r}
                                r={1.5}
                                opacity={0.4}
                            />
                        )
                    })}
                </g>
                <g
                    transform="translate(50%, 50%)"
                    stroke={accentColor}
                    opacity={0.35}
                >
                    {[90, 140, 190].map((r, i) => (
                        <circle
                            key={i}
                            cx={0}
                            cy={0}
                            r={r}
                            strokeDasharray="4 6"
                        />
                    ))}
                    <line x1="-220" y1="0" x2="220" y2="0" />
                    <line x1="0" y1="-220" x2="0" y2="220" />
                </g>
            </svg>

            {/* pulso radial */}
            <div
                key={pulseKey}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    transform: "translate(-50%, -30%)",
                    boxShadow: `0 0 ${18 + glow * 14}px ${accentColor}`,
                    animation: "holoPulse 900ms ease-out",
                    pointerEvents: "none",
                }}
            />
            <style>{`
        @keyframes holoPulse {
          0% { box-shadow: 0 0 ${8 + glow * 10}px ${accentColor}, 0 0 0 0 ${accentColor}; opacity: .9; }
          50% { box-shadow: 0 0 ${16 + glow * 14}px ${accentColor}, 0 0 0 120px ${accentColor}33; opacity: .8; }
          100% { box-shadow: 0 0 ${8 + glow * 8}px ${accentColor}, 0 0 0 280px ${accentColor}00; opacity: .6; }
        }
      `}</style>
        </div>
    )
}

// ------------------ Componente principal ------------------

type HistoryEntry = string[]

function HolographicHumanUpgrades(props: Props) {
    const {
        upgrades: upgradesProp,
        upgradesUrl,
        allowMultiple = true,
        maxActive = 5,
        storageKey = "holo_upgrades_v1",
        onApplyUpgrade,
        onRemoveUpgrade,
        onReset,
        onStateChange,
        accentColor = "#4AA8FF",
        bgColor = "#0B1020",
        glow = 1.15,
        scanlineDensity = 1.0,
        topMarginPx = 24,
        panelWidthPx = 420,
        glitchMs = 200,
        pulseMs = 700,
        stabilizeMs = 400,
    } = props

    const [upgradesData, loading] = useFetchUpgrades(upgradesUrl, upgradesProp)
    const [persisted, setPersisted] = useLocalStorage<{
        activeUpgrades: string[]
    }>(storageKey, { activeUpgrades: [] })
    const [activeUpgrades, setActiveUpgrades] = React.useState<string[]>(
        persisted.activeUpgrades || []
    )
    const [history, setHistory] = React.useState<HistoryEntry[]>([
        activeUpgrades,
    ])
    const [historyIdx, setHistoryIdx] = React.useState(0)
    const pushHistory = (next: string[]) => {
        const sliced = history.slice(0, historyIdx + 1)
        const updated = [...sliced, next]
        setHistory(updated)
        setHistoryIdx(updated.length - 1)
    }

    React.useEffect(() => {
        setPersisted({ activeUpgrades })
        onStateChange?.({ activeUpgrades })
    }, [activeUpgrades]) // eslint-disable-line

    const [selectedId, setSelectedId] = React.useState<string | null>(
        activeUpgrades[0] || null
    )
    React.useEffect(() => {
        if (selectedId && activeUpgrades.includes(selectedId)) return
        setSelectedId(activeUpgrades[activeUpgrades.length - 1] || null)
    }, [activeUpgrades]) // eslint-disable-line

    const [pulseEdits, setPulseEdits] = React.useState<Record<string, string>>(
        {}
    )
    const [liveMsg, setLiveMsg] = React.useState("")
    const [fusionTrigger, setFusionTrigger] = React.useState(0)

    const getUpgrade = (id: string) => upgradesData.find((u) => u.id === id)
    const selectedUpgrade = selectedId ? getUpgrade(selectedId) || null : null
    const selectedPulse = selectedId
        ? (pulseEdits[selectedId] ?? selectedUpgrade?.pulse ?? "")
        : ""

    function triggerFusion(color: string) {
        setFusionTrigger((v) => v + 1)
    }

    function applyUpgrade(id: string) {
        const up = getUpgrade(id)
        if (!up)
            return console.warn(`[Hologram] apply ignored: unknown id "${id}"`)
        if (activeUpgrades.includes(id)) {
            triggerFusion(up.color)
            setSelectedId(id)
            setLiveMsg(`${up.title} fused`)
            return
        }
        const next = allowMultiple
            ? [...activeUpgrades, id].slice(-maxActive)
            : [id]
        setActiveUpgrades(next)
        pushHistory(next)
        setSelectedId(id)
        triggerFusion(up.color)
        onApplyUpgrade?.(id)
        window.dispatchEvent(
            new CustomEvent("holo:upgrade", {
                detail: { id, action: "apply" },
            })
        )
        setLiveMsg(`${up.title} fused`)
    }

    function removeUpgrade(id: string) {
        if (!activeUpgrades.includes(id)) return
        const next = activeUpgrades.filter((x) => x !== id)
        setActiveUpgrades(next)
        pushHistory(next)
        if (selectedId === id) setSelectedId(next[next.length - 1] || null)
        onRemoveUpgrade?.(id)
        window.dispatchEvent(
            new CustomEvent("holo:upgrade", {
                detail: { id, action: "remove" },
            })
        )
        setLiveMsg(`${getUpgrade(id)?.title || id} removed`)
    }

    function handleReset() {
        setActiveUpgrades([])
        pushHistory([])
        setSelectedId(null)
        onReset?.({ activeUpgrades: [] })
        setLiveMsg("All upgrades reset")
    }

    function undo() {
        if (historyIdx <= 0) return
        const idx = historyIdx - 1
        setHistoryIdx(idx)
        const next = history[idx]
        setActiveUpgrades(next)
        setSelectedId(next[next.length - 1] || null)
    }
    function redo() {
        if (historyIdx >= history.length - 1) return
        const idx = historyIdx + 1
        setHistoryIdx(idx)
        const next = history[idx]
        setActiveUpgrades(next)
        setSelectedId(next[next.length - 1] || null)
    }

    const PANEL_W = Math.max(320, Math.min(560, Math.floor(panelWidthPx)))
    const TOP_M = Math.max(0, Math.floor(topMarginPx))

    const UpgradeCard: React.FC<{ u: Upgrade; active: boolean }> = ({
        u,
        active,
    }) => {
        const onKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter") applyUpgrade(u.id)
            if (e.key === "Backspace") removeUpgrade(u.id)
        }
        return (
            <div
                role="button"
                tabIndex={0}
                onKeyDown={onKeyDown}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", u.id)}
                onClick={() => setSelectedId(u.id)}
                style={{
                    userSelect: "none",
                    border: `1px solid ${u.color}55`,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    background: active ? `${u.color}1A` : "#0a0f1a",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 8,
                    cursor: "grab",
                }}
                aria-pressed={active}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            width: 8,
                            height: 32,
                            borderRadius: 3,
                            background: u.color,
                            boxShadow: `0 0 10px ${u.color}`,
                        }}
                    />
                    <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ color: "#E6F4FF", fontWeight: 600 }}>
                            {u.icon ? `${u.icon} ` : ""}
                            {u.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#9bb3c7" }}>
                            ID: {u.id}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            applyUpgrade(u.id)
                        }}
                        style={btnStyle(u.color)}
                    >
                        Apply
                    </button>
                    {active ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                removeUpgrade(u.id)
                            }}
                            style={btnGhostStyle()}
                        >
                            Remove
                        </button>
                    ) : null}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                maxWidth: 1440,
                margin: "0 auto",
                paddingTop: TOP_M,
                fontFamily:
                    "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
                color: "#cfe7ff",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `1fr ${PANEL_W}px`,
                    gap: 20,
                    alignItems: "stretch",
                    minHeight: 620,
                }}
            >
                {/* Izquierda: holograma SVG */}
                <div
                    onDrop={(e) => {
                        e.preventDefault()
                        const id = e.dataTransfer.getData("text/plain")
                        if (id) applyUpgrade(id)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                        position: "relative",
                        background: `radial-gradient(1200px 600px at 50% 100%, ${accentColor}0A, transparent 52%), ${bgColor}`,
                        borderRadius: 14,
                        border: `1px solid ${accentColor}22`,
                        overflow: "hidden",
                        minHeight: 620,
                    }}
                    aria-label="Drop upgrades to apply"
                >
                    <HoloSVG
                        style={{ height: "100%" }}
                        accentColor={accentColor}
                        bgColor={bgColor}
                        scanlineDensity={scanlineDensity}
                        glow={glow}
                        pulseKey={fusionTrigger}
                        onDrop={(e) => {
                            e.preventDefault()
                            const id = e.dataTransfer.getData("text/plain")
                            if (id) applyUpgrade(id)
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: 16,
                            top: 12,
                            fontSize: 12,
                            color: "#98b7d4",
                            letterSpacing: 0.4,
                        }}
                    >
                        Drag an upgrade here to <strong>Fuse</strong>
                    </div>
                </div>

                {/* Derecha: Upgrades + Pulse */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateRows: "auto 1fr",
                        gap: 16,
                    }}
                >
                    <div
                        style={{
                            background: "#08101d",
                            border: `1px solid ${accentColor}22`,
                            borderRadius: 12,
                            padding: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    color: "#e8f3ff",
                                }}
                            >
                                Upgrades
                            </div>
                            <div style={{ fontSize: 12, color: "#8ea8bf" }}>
                                Active: {activeUpgrades.length}
                                {allowMultiple ? ` / ${maxActive}` : " / 1"}
                            </div>
                        </div>
                        <div
                            style={{
                                maxHeight: 260,
                                overflow: "auto",
                                paddingRight: 6,
                            }}
                        >
                            {(upgradesData || []).map((u) => (
                                <UpgradeCard
                                    key={u.id}
                                    u={u}
                                    active={activeUpgrades.includes(u.id)}
                                />
                            ))}
                            {loading && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#8ea8bf",
                                    }}
                                >
                                    Loading dataset…
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 8,
                            }}
                        >
                            <button onClick={undo} style={btnGhostStyle()}>
                                Undo
                            </button>
                            <button onClick={redo} style={btnGhostStyle()}>
                                Redo
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                onClick={handleReset}
                                style={btnDangerStyle()}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#091523",
                            border: `1px solid ${accentColor}22`,
                            borderRadius: 12,
                            padding: 14,
                            display: "grid",
                            gridTemplateRows: "auto auto 1fr auto",
                            gap: 8,
                            minHeight: 280,
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
                                    width: 10,
                                    height: 10,
                                    borderRadius: 4,
                                    background:
                                        selectedUpgrade?.color || accentColor,
                                    boxShadow: `0 0 10px ${selectedUpgrade?.color || accentColor}`,
                                }}
                            />
                            <div
                                style={{
                                    fontWeight: 700,
                                    color: "#e8f3ff",
                                }}
                            >
                                Pulse{" "}
                                {selectedUpgrade
                                    ? `— ${selectedUpgrade.title}`
                                    : ""}
                            </div>
                        </div>

                        {selectedUpgrade ? (
                            <>
                                <div style={{ display: "grid", gap: 6 }}>
                                    <label
                                        style={{
                                            fontSize: 12,
                                            color: "#8aa8c4",
                                        }}
                                    >
                                        Pulse (markdown)
                                    </label>
                                    <textarea
                                        value={selectedPulse}
                                        onChange={(e) =>
                                            setPulseEdits((m) => ({
                                                ...m,
                                                [selectedUpgrade.id]:
                                                    e.target.value,
                                            }))
                                        }
                                        style={{
                                            width: "100%",
                                            minHeight: 90,
                                            borderRadius: 8,
                                            border: `1px solid ${selectedUpgrade.color}44`,
                                            background: "#0c1c2d",
                                            color: "#d7e9ff",
                                            padding: 8,
                                            fontFamily:
                                                "ui-monospace, SFMono-Regular, Menlo, monospace",
                                            fontSize: 13,
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#89a2b9",
                                        }}
                                    >
                                        Preview
                                    </div>
                                    <div
                                        style={{
                                            borderRadius: 8,
                                            border: `1px dashed ${selectedUpgrade.color}33`,
                                            padding: 10,
                                            background: "#081421",
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: mdToHtml(selectedPulse),
                                        }}
                                    />
                                </div>

                                {selectedUpgrade.practices?.length ? (
                                    <div>
                                        <div
                                            style={{
                                                marginTop: 8,
                                                marginBottom: 6,
                                                fontSize: 12,
                                                color: "#89a2b9",
                                            }}
                                        >
                                            Practices
                                        </div>
                                        <ul
                                            style={{
                                                margin: 0,
                                                paddingLeft: 18,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {selectedUpgrade.practices.map(
                                                (p, i) => (
                                                    <li key={i}>{p}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                ) : null}

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: 10,
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            applyUpgrade(selectedUpgrade.id)
                                        }
                                        style={btnStyle(selectedUpgrade.color)}
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={() =>
                                            removeUpgrade(selectedUpgrade.id)
                                        }
                                        style={btnGhostStyle()}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: "#8aa2b8" }}>
                                Selecciona un upgrade para ver su <em>Pulse</em>
                                , editar el texto y aplicar/retirar.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* a11y */}
            <div
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(1px,1px,1px,1px)",
                }}
            >
                {liveMsg}
            </div>
        </div>
    )
}

// ------------------ Estilos botones ------------------

function btnStyle(color: string): React.CSSProperties {
    return {
        background: color,
        color: "#0d1320",
        border: "none",
        borderRadius: 8,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: `0 0 12px ${color}`,
    }
}
function btnGhostStyle(): React.CSSProperties {
    return {
        background: "#0c1624",
        color: "#d8ecff",
        border: "1px solid #2a3e56",
        borderRadius: 8,
        padding: "8px 12px",
        cursor: "pointer",
    }
}
function btnDangerStyle(): React.CSSProperties {
    return {
        background: "#1c0f12",
        color: "#ffb3b3",
        border: "1px solid #854a4a",
        borderRadius: 8,
        padding: "8px 12px",
        cursor: "pointer",
    }
}

// ------------------ Property Controls + defaults ------------------

addPropertyControls(HolographicHumanUpgrades, {
    upgradesUrl: { type: ControlType.String, title: "Upgrades URL" },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Allow Multiple",
        defaultValue: true,
    },
    maxActive: {
        type: ControlType.Number,
        title: "Max Active",
        min: 1,
        max: 12,
        defaultValue: 5,
        displayStepper: true,
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "holo_upgrades_v1",
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#4AA8FF",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B1020",
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 3,
        defaultValue: 1.15,
        step: 0.05,
    },
    scanlineDensity: {
        type: ControlType.Number,
        title: "Scanlines",
        min: 0,
        max: 3,
        defaultValue: 1.0,
        step: 0.05,
    },

    topMarginPx: {
        type: ControlType.Number,
        title: "Top Margin",
        min: 0,
        max: 160,
        defaultValue: 24,
        displayStepper: true,
    },
    panelWidthPx: {
        type: ControlType.Number,
        title: "Panel Width",
        min: 320,
        max: 560,
        defaultValue: 420,
        displayStepper: true,
    },

    glitchMs: {
        type: ControlType.Number,
        title: "Glitch (ms)",
        min: 60,
        max: 1000,
        defaultValue: 200,
        displayStepper: true,
    },
    pulseMs: {
        type: ControlType.Number,
        title: "Pulse (ms)",
        min: 200,
        max: 2000,
        defaultValue: 700,
        displayStepper: true,
    },
    stabilizeMs: {
        type: ControlType.Number,
        title: "Stabilize (ms)",
        min: 150,
        max: 2000,
        defaultValue: 400,
        displayStepper: true,
    },
})
;(HolographicHumanUpgrades as any).displayName = "HolographicHumanUpgrades"

HolographicHumanUpgrades.defaultProps = {
    width: 1200,
    height: 720,
    upgrades: DEFAULT_UPGRADES,
    allowMultiple: true,
    maxActive: 5,
    storageKey: "holo_upgrades_v1",
    accentColor: "#4AA8FF",
    bgColor: "#0B1020",
    glow: 1.15,
    scanlineDensity: 1.0,
    topMarginPx: 24,
    panelWidthPx: 420,
    glitchMs: 200,
    pulseMs: 700,
    stabilizeMs: 400,
} as Partial<Props>

export default HolographicHumanUpgrades
