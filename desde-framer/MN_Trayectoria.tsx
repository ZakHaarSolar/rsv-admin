// Red Solar Viva — MN_Trayectoria.tsx v1.3
// La animación de carga "Sintonizando trayectoria" se centra verticalmente
// (minHeight 70dvh + justifyContent center, padding reducido) en vez de
// pegarse al tope de la pantalla. La gráfica también se centra verticalmente
// (minHeight 70dvh + flexDirection column + alignItems center) para no quedar pegada arriba.
// TrayectoriaTabPanel — gráfica histórica del Índice de Silicio del
// tripulante (vista "Trayectoria" del Mi Núcleo). Usa RecalView del
// Escáner Vibracional (split en EV_Recal.tsx) con datos de
// scan_vibracional. Parte del split de MiNucleo.tsx.
//
// Cumple regla 🜂: default export es el componente principal + propiedad
// nominal. Consumir vía:
//   import MNTrayectoria from "./MN_Trayectoria.tsx"
//   const { TrayectoriaTabPanel } = MNTrayectoria
import * as React from "react"
import { useEffect, useState } from "react"

import RecalView from "./EV_Recal.tsx"
import Shared, { ScanEntry, Scores, PillarId } from "./EV_Shared.tsx"

import MNShared from "./MN_Shared.tsx"

const { useIsMobile } = MNShared

function TrayectoriaTabPanel({
    clerkUserId,
    accent,
    supabaseUrl,
    supabaseAnonKey,
}: {
    clerkUserId: string
    accent: string
    supabaseUrl: string
    supabaseAnonKey: string
}) {
    const isMobile = useIsMobile()
    /* v3.16 — Inyecta el CSS de EV_Shared (.esc-corner y demás clases
       del Escáner) cuando este tab se monta. Sin esto, las 4 decoraciones
       de esquina del card de la línea temporal renderizan el SVG L sin
       sus dimensiones (.esc-corner: 16×16) y el L queda gigante en la
       esquina superior izquierda. El bug solo se veía cuando el
       tripulante entraba a /nucleo sin pasar antes por /radar (porque
       el Escáner inyecta el mismo CSS upstream). useInjectCss es
       idempotente — si ya está inyectado, solo refresca el contenido. */
    Shared.useInjectCss()
    const [scores, setScores] = useState<Scores>({
        fisico: null,
        mental: null,
        emocional: null,
        financiero: null,
        vector: null,
        orbita: null,
    })
    const [history, setHistory] = useState<ScanEntry[]>([])
    const [lastCycleTs, setLastCycleTs] = useState<number | null>(null)
    const [cycleScanned, setCycleScanned] = useState<Set<PillarId>>(new Set())
    const [loading, setLoading] = useState(true)
    const { userAction } = Shared

    useEffect(() => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setLoading(false)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                /* Última fila de scan_vibracional para los scores actuales. */
                const latest = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_scan_history",
                    { p_limit: 1 }
                )
                if (!cancelled && latest && Array.isArray(latest) && latest.length > 0) {
                    const s = latest[0]
                    setScores({
                        fisico: s.hardware_fisico,
                        mental: s.procesador_mental,
                        emocional: s.motor_emocional,
                        financiero: s.gravedad_financiera,
                        vector: s.vector_expansion ?? null,
                        orbita: s.orbita_relacional ?? null,
                    })
                    /* Si el último scan tiene cycle_scanned_json size 6 y el
                       cooldown de 60s sigue activo, lo reflejamos. */
                    try {
                        const raw = s.cycle_scanned_json
                        if (raw) {
                            const cs =
                                typeof raw === "string"
                                    ? JSON.parse(raw)
                                    : raw
                            if (Array.isArray(cs)) {
                                setCycleScanned(new Set(cs))
                                if (cs.length === 6) {
                                    const ts = new Date(s.created_at).getTime()
                                    if ((Date.now() - ts) / 1000 < 60) {
                                        setLastCycleTs(ts)
                                    }
                                }
                            }
                        }
                    } catch {}
                }
                /* History de los últimos 120 scans, filtrando solo ciclos
                   completos (6/6) y limitando a 20 con orden cronológico
                   (más reciente a la derecha del chart). */
                const histArr = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_scan_history",
                    { p_limit: 120 }
                )
                if (!cancelled && histArr && Array.isArray(histArr)) {
                    const complete = histArr
                        .filter((e: ScanEntry) => {
                            if (!e.cycle_scanned_json) return true
                            try {
                                const cs =
                                    typeof e.cycle_scanned_json === "string"
                                        ? JSON.parse(e.cycle_scanned_json)
                                        : e.cycle_scanned_json
                                return Array.isArray(cs) && cs.length === 6
                            } catch {
                                return true
                            }
                        })
                        .slice(0, 20)
                        .reverse()
                    setHistory(complete)
                }
            } catch (e) {
                console.warn("[TrayectoriaTabPanel] fetch error:", e)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    /* La animación "Sintonizando trayectoria" estaba pegada
                       arriba (padding-top 60/80). Ahora se centra verticalmente
                       en ~70dvh → queda un poco arriba del centro de la
                       pantalla, no en el tope. */
                    minHeight: "70dvh",
                    padding: isMobile ? "20px 28px" : "20px 40px",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 18px ${accent}`,
                        animation: "esc-vertex-pulse 1.4s ease-in-out infinite",
                    }}
                />
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Sintonizando trayectoria…
                </p>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                minHeight: "70dvh",
            }}
        >
            <RecalView
                scores={scores}
                accent={accent}
                history={history}
                lastCycleTs={lastCycleTs}
                cycleScanned={cycleScanned}
                isMobile={isMobile}
            />
        </div>
    )
}

/* Default export: componente principal con propiedad nominal. */
const MNTrayectoria = Object.assign(TrayectoriaTabPanel, {
    TrayectoriaTabPanel,
})

export default MNTrayectoria
