import * as React from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Zak'Haar Bot Dashboard v2
 * Con Live Feed y Visualización de Potencia.
 */

type BotStatus = {
    mode: string
    uptime: number
    watchlistSize?: number
}

type BotMetrics = {
    oppsFound?: number
    simPassed?: number // Actualizado para coincidir con tu nuevo backend
    avgProfitSol?: string // Actualizado
    amountInLamports?: string
}

type Candidate = {
    tokenMint: string
    buyDex: string
    sellDex: string
    profitSol: string
    ts: number
}

export function BotDashboard(props: any) {
    const [online, setOnline] = useState(false)
    const [status, setStatus] = useState<BotStatus | null>(null)
    const [metrics, setMetrics] = useState<BotMetrics | null>(null)
    const [lastItem, setLastItem] = useState<Candidate | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function fetchJSON(path: string) {
        const res = await fetch(`${props.apiBase}${path}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
    }

    useEffect(() => {
        let alive = true

        async function poll() {
            try {
                // 1. Llamamos a los 3 endpoints vitales
                const s = await fetchJSON("/status")
                const m = await fetchJSON("/metrics")
                const l = await fetchJSON("/last") // El endpoint que agregamos en el backend

                if (!alive) return
                setStatus(s)
                setMetrics(m)

                // Obtenemos el candidato más reciente para mostrarlo
                if (l.items && l.items.length > 0) {
                    setLastItem(l.items[0])
                }

                setOnline(true)
                setError(null)
            } catch (e: any) {
                setOnline(false)
                setError("Bot offline...")
            }
        }

        poll()
        const i = setInterval(poll, props.refreshMs)
        return () => {
            alive = false
            clearInterval(i)
        }
    }, [props.apiBase, props.refreshMs])

    // Helper para formatear SOL (de string lamports a visual)
    const formatAmount = (lamportsStr?: string) => {
        if (!lamportsStr) return "-"
        const sol = Number(BigInt(lamportsStr)) / 1e9
        return `${sol.toFixed(2)} SOL`
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                padding: 16,
                fontFamily: "Inter, monospace", // Monospace para datos numéricos
                background: "#0b0f14",
                color: "#dbe7ff",
                borderRadius: 12,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                border: "1px solid rgba(255,255,255,0.05)",
            }}
        >
            <Header online={online} mode={status?.mode} />

            {!online && (
                <Panel>
                    <div style={{ color: "#ff6b6b", fontSize: 12 }}>
                        {error ?? "Connecting to Neural Link..."}
                    </div>
                </Panel>
            )}

            {online && metrics && (
                <>
                    {/* Panel de Potencia */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <MetricCard
                            label="Flash Power"
                            value={formatAmount(metrics.amountInLamports)}
                            highlight
                        />
                        <MetricCard
                            label="Watchlist"
                            value={status?.watchlistSize ?? 0}
                        />
                    </div>

                    {/* Panel de Resultados */}
                    <Panel>
                        <Row
                            label="Opps Found"
                            value={metrics.oppsFound ?? 0}
                            color={
                                metrics.oppsFound && metrics.oppsFound > 0
                                    ? "#3cff6b"
                                    : undefined
                            }
                        />
                        <Row
                            label="Sim Passed"
                            value={metrics.simPassed ?? 0}
                        />
                        <Row
                            label="Avg Profit"
                            value={
                                metrics.avgProfitSol
                                    ? `${metrics.avgProfitSol} SOL`
                                    : "-"
                            }
                        />
                    </Panel>

                    {/* LIVE SCAN FEED: Lo más importante para sentir el pulso */}
                    {lastItem && (
                        <Panel title="LIVE SCANNER">
                            <div
                                style={{
                                    fontSize: 10,
                                    opacity: 0.5,
                                    marginBottom: 4,
                                }}
                            >
                                {lastItem.buyDex} ➝ {lastItem.sellDex}
                            </div>
                            <Row
                                label={lastItem.tokenMint.slice(0, 4) + "..."}
                                value={lastItem.profitSol + " SOL"}
                                // Si es negativo rojo, si es positivo verde neón
                                color={
                                    lastItem.profitSol.startsWith("-")
                                        ? "#ff6b6b"
                                        : "#3cff6b"
                                }
                            />
                        </Panel>
                    )}
                </>
            )}
        </div>
    )
}

/* ---------------- UI Helpers ---------------- */

function Header({ online, mode }: { online: boolean; mode?: string }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Dot online={online} />
                <strong style={{ fontSize: 14 }}>Zak’Haar Bot</strong>
            </div>
            {mode && (
                <span
                    style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        opacity: 0.5,
                        letterSpacing: 1,
                        border: "1px solid rgba(255,255,255,0.2)",
                        padding: "2px 6px",
                        borderRadius: 4,
                    }}
                >
                    {mode}
                </span>
            )}
        </div>
    )
}

function Dot({ online }: { online: boolean }) {
    return (
        <div
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: online ? "#3cff6b" : "#ff3c3c",
                boxShadow: online ? "0 0 10px rgba(60,255,107, 0.6)" : "none",
                transition: "all 0.3s ease",
            }}
        />
    )
}

function Panel({
    children,
    title,
}: {
    children: React.ReactNode
    title?: string
}) {
    return (
        <div
            style={{
                background: "rgba(255,255,255,0.03)",
                padding: 12,
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            {title && (
                <div
                    style={{
                        fontSize: 9,
                        textTransform: "uppercase",
                        opacity: 0.4,
                        marginBottom: 2,
                    }}
                >
                    {title}
                </div>
            )}
            {children}
        </div>
    )
}

function MetricCard({
    label,
    value,
    highlight,
}: {
    label: string
    value: any
    highlight?: boolean
}) {
    return (
        <div
            style={{
                flex: 1,
                background: highlight
                    ? "rgba(60, 255, 107, 0.05)"
                    : "rgba(255,255,255,0.03)",
                padding: "10px",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                border: highlight
                    ? "1px solid rgba(60, 255, 107, 0.2)"
                    : "none",
            }}
        >
            <span style={{ fontSize: 10, opacity: 0.6 }}>{label}</span>
            <span
                style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: highlight ? "#3cff6b" : "#fff",
                }}
            >
                {value}
            </span>
        </div>
    )
}

function Row({
    label,
    value,
    color,
}: {
    label: string
    value: any
    color?: string
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                fontFamily: "Menlo, monospace", // Look más hacker
            }}
        >
            <span style={{ opacity: 0.6 }}>{label}</span>
            <span style={{ color: color || "#dbe7ff" }}>{value}</span>
        </div>
    )
}

addPropertyControls(BotDashboard, {
    apiBase: {
        type: ControlType.String,
        title: "API Base",
        defaultValue: "http://localhost:3001",
    },
    refreshMs: {
        type: ControlType.Number,
        title: "Refresh (ms)",
        defaultValue: 1000, // Más rápido para sentir el pulso
        min: 200,
        max: 5000,
        step: 100,
    },
})
