// EV_Recal.tsx v2.32 — #4 Telemetría viva: un cometa de luz recorre la línea temporal del
// Índice de Luz (SMIL animateMotion sobre el path de la curva; los datos corren por el circuito).
// v2.31 — El bloque de un solo ciclo ("Punto de Ignición Anclado")
// se centra un poco más arriba en la vista (minHeight 60vh).
// v2.2 — Con un solo ciclo se muestra la fecha de la última lectura
// ("Tu última lectura · 28 de mayo de 2026") junto al mensaje de "segundo ciclo".
// v2.0 — Línea de tiempo del Avatar AAA. Tres mejoras grandes:
//   (1) Selector de pilar debajo del SVG: chips horizontales con
//       scroll-snap (Índice · Hardware · Procesador · Motor · Gravedad
//       · Vector · Órbita). Picando un chip la línea se redibuja con
//       el puntaje de ESE pilar en cada ciclo. Cada pilar tiene su
//       color único (rojo, cyan, naranja, dorado, verde, morado).
//   (2) Click en nodo expande un panel con los 6 pilares + valor
//       individual del ciclo. Cada row del panel es picable y
//       cambia el filtro de la línea a ese pilar (cierra el panel).
//       Permite responder "cuánto saqué en cada pilar hace 3
//       semanas" sin abrir el ciclo manualmente.
//   (3) UX premium: animaciones suaves, color por pilar, valor
//       grande en el header del panel, hit area amplio para que el
//       dedo acierte fácil aunque el nodo sea chico, transitions
//       cubic-bezier en el dot expandido. Sello "experiencia juego
//       AAA" pedido por Zak — la trayectoria deja de ser un gráfico
//       y se convierte en un terminal de telemetría profundo.
// v1.4 — Removidos los dos h2 "Trayectoria del Avatar" (empty state
// + main render). El header de Mi Núcleo ya pinta ese título
// (sectionLabelMap.trayectoria), así que tenerlo aquí abajo
// duplicaba la palabra y empujaba el gráfico unos cm más abajo
// sin razón. La animación esc-titan-breathe ya no aplica — el
// header del Mi Núcleo respira por su cuenta.
// v1.3 — Título "Trayectoria del Avatar" con gradient cyan→white
// igual que el hero "MI NÚCLEO" / "MIS CÓDICES" / "CÁLIBRACIÓN".
// Antes el h2 usaba color flat rgba(255,255,255,0.92) heredado del
// className `.esc-titan-title`; ahora overrideamos color a transparent
// y aplicamos `background: linear-gradient(180deg, accent, #fff)` con
// `WebkitBackgroundClip: text`. La animación esc-titan-breathe
// (text-shadow respiratorio) se mantiene encima del gradient. Aplica
// a las dos instancias del h2 (empty state y main render).
// EV_Recal.tsx v1.2
// v1.2 — Quitado el countdown "Próxima Sintonización dd hh mm" que
// aparecía debajo del TimelineChart. El contador único del cooldown
// vive ahora arriba del Radar — es donde se conecta narrativamente
// con el ritual de escaneo. En cuentas que recién cerraban su primer
// ciclo, el countdown de Trayectoria mostraba 00:00 durante la
// transición y duplicaba información del Escáner.
// Removidos también el setInterval de "now" y cálculos de gDays/
// gHours/gMins (sin uso después del cleanup).
// EV_Recal.tsx v1.1
// v1.1 — Defaults defensivos en RecalView (scores={}, accent, history=[],
// cycleScanned=new Set()) para que Framer no crashee al instanciar
// standalone con props undefined ("Cannot convert undefined or null
// to object" sobre Object.values(scores)).
// EV_Recal.tsx v1.0
// Trayectoria del Avatar — la capa de Recalibración del Escáner. RecalView
// pinta el header dorado y delega en TimelineChart la visualización del
// histórico (3 estados: 0 ciclos sistema en reposo, 1 ciclo punto de
// ignición anclado con futuro proyectado, 2+ ciclos línea temporal con
// dots por ciclo). Default export: RecalView.
import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Shared, {
    PillarId,
    ScanEntry,
    Scores,
} from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
const { hx, GOLD, COOLDOWN_SEC } = Shared
const { CSvg } = Icons

function TimelineChart({
    history,
    accent,
    isMobile = false,
}: {
    history: ScanEntry[]
    accent: string
    isMobile?: boolean
}) {
    /* Estado 0 ciclos: SISTEMA EN REPOSO (invitación, no error). */
    if (history.length === 0)
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 22,
                    padding: isMobile ? "50px 28px" : "70px 40px",
                    maxWidth: 460,
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: isMobile ? 72 : 92,
                        height: isMobile ? 72 : 92,
                        borderRadius: "50%",
                        border: `1px dashed ${hx(accent, 0.28)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 40px ${hx(accent, 0.06)}`,
                        animation: "esc-vertex-pulse 3.5s ease-in-out infinite",
                    }}
                >
                    <div
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: hx(accent, 0.35),
                            boxShadow: `0 0 12px ${hx(accent, 0.35)}`,
                        }}
                    />
                </div>
                <h3
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 13 : 15,
                        fontWeight: 400,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: hx(accent, 0.75),
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Sistema en Reposo
                </h3>
                <p
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.55)",
                        letterSpacing: "0.04em",
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.7,
                    }}
                >
                    Ejecuta tu primer ciclo de diagnóstico para establecer la
                    coordenada de origen de tu Avatar.
                </p>
            </motion.div>
        )
    /* Estado 1 ciclo: PUNTO DE IGNICIÓN ANCLADO. Vértice único + línea
       difuminada hacia el futuro. */
    if (history.length === 1) {
        const indice = history[0]?.indice_silicio ?? 50
        const firstScanStr = history[0]?.created_at
            ? new Date(history[0].created_at).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : ""
        const w = isMobile ? 320 : 520
        const h = 120
        const vx = 48
        const vy = h - 20 - (indice / 100) * (h - 40)
        const endX = w - 20
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 22,
                    padding: isMobile ? "24px 16px" : "30px 20px",
                    width: "100%",
                    maxWidth: 560,
                    minHeight: "60vh",
                    margin: "0 auto",
                    boxSizing: "border-box",
                    textAlign: "center",
                }}
            >
                <svg
                    width={w}
                    height={h}
                    viewBox={`0 0 ${w} ${h}`}
                    style={{ overflow: "visible" }}
                >
                    <defs>
                        <linearGradient
                            id="trayecto-fade"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                        >
                            <stop
                                offset="0%"
                                stopColor={accent}
                                stopOpacity="0.9"
                            />
                            <stop
                                offset="70%"
                                stopColor={accent}
                                stopOpacity="0.35"
                            />
                            <stop
                                offset="100%"
                                stopColor={accent}
                                stopOpacity="0.05"
                            />
                        </linearGradient>
                        <filter
                            id="trayecto-glow"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                        >
                            <feGaussianBlur stdDeviation="4" />
                        </filter>
                        <filter
                            id="trayecto-line-glow"
                            x="-20%"
                            y="-200%"
                            width="140%"
                            height="500%"
                        >
                            <feGaussianBlur stdDeviation="2" />
                        </filter>
                    </defs>
                    <line
                        x1={vx}
                        y1={h - 20}
                        x2={endX}
                        y2={h - 20}
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth="0.6"
                    />
                    <line
                        x1={vx}
                        y1={h - 20 - 0.5 * (h - 40)}
                        x2={endX}
                        y2={h - 20 - 0.5 * (h - 40)}
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="0.5"
                        strokeDasharray="2 4"
                    />
                    <line
                        x1={vx}
                        y1={vy}
                        x2={endX}
                        y2={vy}
                        stroke="url(#trayecto-fade)"
                        strokeWidth="3.5"
                        filter="url(#trayecto-line-glow)"
                        opacity="0.7"
                    />
                    <line
                        x1={vx}
                        y1={vy}
                        x2={endX}
                        y2={vy}
                        stroke="url(#trayecto-fade)"
                        strokeWidth="1.8"
                        strokeDasharray="4 6"
                        strokeLinecap="round"
                    />
                    {[0.33, 0.58, 0.82].map((t, i) => {
                        const tx = vx + (endX - vx) * t
                        const ticksOpacity = 0.6 - i * 0.18
                        return (
                            <circle
                                key={`tick${i}`}
                                cx={tx}
                                cy={vy}
                                r={3.5}
                                fill="none"
                                stroke={accent}
                                strokeWidth="1"
                                opacity={ticksOpacity}
                            />
                        )
                    })}
                    <circle
                        cx={vx}
                        cy={vy}
                        r={16}
                        fill={hx(accent, 0.12)}
                        filter="url(#trayecto-glow)"
                    />
                    <circle
                        cx={vx}
                        cy={vy}
                        r={10}
                        fill="none"
                        stroke={hx(accent, 0.45)}
                        strokeWidth="1"
                    />
                    <circle
                        cx={vx}
                        cy={vy}
                        r={6}
                        fill={accent}
                        style={{
                            filter: `drop-shadow(0 0 14px ${hx(accent, 0.95)})`,
                        }}
                    />
                    <text
                        x={vx}
                        y={vy - 22}
                        textAnchor="middle"
                        fill={hx(accent, 0.95)}
                        fontSize="12"
                        fontWeight="600"
                        letterSpacing="0.14em"
                        fontFamily="'Inter',sans-serif"
                    >
                        {indice}%
                    </text>
                    <text
                        x={endX}
                        y={vy - 10}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.3)"
                        fontSize="9"
                        fontWeight="400"
                        letterSpacing="0.22em"
                        fontFamily="'Inter',sans-serif"
                    >
                        FUTURO
                    </text>
                </svg>
                <h3
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 13 : 15,
                        fontWeight: 400,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: hx(accent, 0.85),
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Punto de Ignición Anclado
                </h3>
                <p
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.55)",
                        letterSpacing: "0.04em",
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.7,
                    }}
                >
                    El motor requiere la calibración de un segundo ciclo para
                    trazar la trayectoria de expansión.
                </p>
                {firstScanStr && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 11 : 12,
                            fontWeight: 500,
                            color: "rgba(212,168,67,0.85)",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter',sans-serif",
                            textShadow: "0 0 18px rgba(212,168,67,0.3)",
                        }}
                    >
                        Tu última lectura · {firstScanStr}
                    </p>
                )}
            </motion.div>
        )
    }
    /* ═══ v2.0 — Línea de tiempo AAA: selector de pilar + nodo
       expandible. El gráfico arranca en modo "global" (Índice de
       Silicio total). Picando un chip de pilar abajo, la línea se
       redibuja con los puntajes de ESE pilar específico (color del
       pilar, scores de la columna correspondiente del scan). Picando
       un nodo del chart se abre un panel con los 6 pilares de ese
       ciclo y sus puntajes — el Tripulante ve cómo van cambiando
       todas las dimensiones a través del tiempo, no solo el promedio.
       Inmersión tipo videojuego AAA: cards glowing, transitions
       suaves, color por pilar, valor en grande arriba del chart. */

    const PILLAR_OPTIONS: Array<{
        id: PillarId | "global"
        label: string
        short: string
        column?: keyof ScanEntry
        color: string
    }> = [
        {
            id: "global",
            label: "Índice de Luz",
            short: "ÍNDICE",
            color: accent,
        },
        {
            id: "fisico",
            label: "Hardware Físico",
            short: "HARDWARE",
            column: "hardware_fisico",
            color: "#FF6B6B",
        },
        {
            id: "mental",
            label: "Procesador Mental",
            short: "PROCESADOR",
            column: "procesador_mental",
            color: "#4ECDC4",
        },
        {
            id: "emocional",
            label: "Motor Emocional",
            short: "MOTOR",
            column: "motor_emocional",
            color: "#FF9F43",
        },
        {
            id: "financiero",
            label: "Gravedad Financiera",
            short: "GRAVEDAD",
            column: "gravedad_financiera",
            color: "#FFD93D",
        },
        {
            id: "vector",
            label: "Vector de Expansión",
            short: "VECTOR",
            column: "vector_expansion",
            color: "#95E1D3",
        },
        {
            id: "orbita",
            label: "Órbita Relacional",
            short: "ÓRBITA",
            column: "orbita_relacional",
            color: "#C77DFF",
        },
    ]

    const [selectedPillar, setSelectedPillar] = React.useState<
        PillarId | "global"
    >("global")
    const [expandedNode, setExpandedNode] = React.useState<number | null>(
        null
    )

    const activePillar =
        PILLAR_OPTIONS.find((p) => p.id === selectedPillar) ||
        PILLAR_OPTIONS[0]
    const lineColor = activePillar.color

    /* Resolver el valor del nodo según el pilar activo. Si el scan
       no tiene la columna específica (ej. data antigua), cae al
       indice_silicio como fallback graceful. */
    const valueForEntry = (e: ScanEntry): number => {
        if (selectedPillar === "global") return e.indice_silicio || 0
        const col = activePillar.column
        if (!col) return e.indice_silicio || 0
        const raw = (e as any)[col]
        if (typeof raw === "number" && Number.isFinite(raw)) return raw
        return e.indice_silicio || 0
    }

    const w = isMobile ? 380 : 700,
        h = isMobile ? 240 : 340
    const pad = { t: 44, r: isMobile ? 28 : 40, b: 44, l: isMobile ? 38 : 52 }
    const iw = w - pad.l - pad.r,
        ih = h - pad.t - pad.b
    const pts = history.map((e, i) => {
        const v = valueForEntry(e)
        return {
            x: pad.l + (i / (history.length - 1)) * iw,
            y: pad.t + ih - (v / 100) * ih,
            v,
            d: new Date(e.created_at),
            entry: e,
        }
    })
    const pathD = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ")
    const areaD =
        pathD +
        ` L${pts[pts.length - 1].x},${h - pad.b} L${pts[0].x},${h - pad.b} Z`
    const dotR = isMobile ? 4 : 6,
        valFs = isMobile ? 10 : 13

    /* Click en nodo: toggle del panel expandido. Picar el mismo nodo
       lo cierra. Picar otro lo cambia. */
    const handleNodeClick = (idx: number) => {
        setExpandedNode((curr) => (curr === idx ? null : idx))
    }
    /* Cuando cambia el pilar seleccionado, cerramos el nodo expandido
       (porque el panel ya no aplica a esa selección visual). */
    React.useEffect(() => {
        setExpandedNode(null)
    }, [selectedPillar])

    return (
        <div
            style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : 740,
                padding: isMobile ? "16px 10px" : "28px 32px",
                borderRadius: isMobile ? 14 : 20,
                background:
                    "linear-gradient(165deg,rgba(5,15,30,0.6),rgba(2,8,20,0.8))",
                border: `1px solid ${hx(accent, 0.15)}`,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div className="esc-corner esc-corner-tl">
                <CSvg color={hx(accent, 0.3)} />
            </div>
            <div className="esc-corner esc-corner-tr">
                <CSvg color={hx(accent, 0.3)} />
            </div>
            <div className="esc-corner esc-corner-bl">
                <CSvg color={hx(accent, 0.3)} />
            </div>
            <div className="esc-corner esc-corner-br">
                <CSvg color={hx(accent, 0.3)} />
            </div>
            {/* Header dinámico — el título cambia con el pilar
                seleccionado. Sub-línea con el valor más reciente del
                pilar para que el Tripulante lea el número actual sin
                tener que mirar el último nodo. */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    margin: "0 0 16px",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Línea Temporal —{" "}
                    <span
                        style={{
                            color: lineColor,
                            transition: "color 280ms ease",
                            textShadow: `0 0 12px ${hx(lineColor, 0.5)}`,
                        }}
                    >
                        {activePillar.label}
                    </span>
                </p>
            </div>
            <svg
                width="100%"
                viewBox={`0 0 ${w} ${h}`}
                style={{ overflow: "visible" }}
            >
                <defs>
                    <linearGradient id="tlG10" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor={lineColor}
                            stopOpacity="0.3"
                        />
                        <stop
                            offset="100%"
                            stopColor={lineColor}
                            stopOpacity="0"
                        />
                    </linearGradient>
                    <filter id="tlGl10">
                        <feGaussianBlur stdDeviation="5" />
                    </filter>
                    {/* #4 Telemetría viva — estela del cometa de trayectoria (cola transparente → cabeza). */}
                    <linearGradient id="tl-comet-tail" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0.85" />
                    </linearGradient>
                </defs>
                {[0, 25, 50, 75, 100].map((v) => {
                    const y = pad.t + ih - (v / 100) * ih
                    return (
                        <g key={v}>
                            <line
                                x1={pad.l}
                                y1={y}
                                x2={w - pad.r}
                                y2={y}
                                stroke={
                                    v === 50
                                        ? "rgba(255,255,255,0.08)"
                                        : "rgba(255,255,255,0.03)"
                                }
                                strokeWidth={v === 50 ? "1" : "0.5"}
                            />
                            <text
                                x={pad.l - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill="rgba(255,255,255,0.25)"
                                fontSize={isMobile ? "9" : "11"}
                                fontFamily="Inter,sans-serif"
                            >
                                {v}
                            </text>
                        </g>
                    )
                })}
                <path d={areaD} fill="url(#tlG10)" opacity="0.25" />
                <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="4"
                    filter="url(#tlGl10)"
                    opacity="0.25"
                    strokeLinejoin="round"
                    style={{
                        transition: "stroke 320ms ease",
                    }}
                />
                <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{
                        filter: `drop-shadow(0 0 4px ${hx(lineColor, 0.4)})`,
                        transition: "stroke 320ms ease",
                    }}
                />
                {/* #4 Telemetría viva — un cometa recorre la línea temporal (SMIL sobre el path de la curva; nativo, perf 10K). */}
                {pts.length >= 2 && (
                    <g opacity={0.92}>
                        <rect
                            x={-13}
                            y={-1.1}
                            width={13}
                            height={2.2}
                            rx={1.1}
                            fill="url(#tl-comet-tail)"
                        />
                        <circle
                            r={2.7}
                            fill={lineColor}
                            style={{
                                filter: `drop-shadow(0 0 6px ${hx(lineColor, 0.95)})`,
                            }}
                        />
                        <animateMotion
                            dur="6s"
                            repeatCount="indefinite"
                            rotate="auto"
                            path={pathD}
                        />
                    </g>
                )}
                {pts.map((p, i) => {
                    /* Color del nodo: en modo "global" usa la heurística
                       histórica (gold/accent/rojo). En modo pilar usa el
                       color del pilar para mantener coherencia visual. */
                    const dc =
                        selectedPillar === "global"
                            ? p.v >= 90
                                ? GOLD
                                : p.v >= 50
                                  ? accent
                                  : "rgba(255,120,120,0.85)"
                            : lineColor
                    const isExpanded = expandedNode === i
                    return (
                        <g
                            key={i}
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleNodeClick(i)
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            {/* Hit area amplio para que el dedo
                                acierte fácil aunque el nodo sea chico. */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={Math.max(dotR + 12, 16)}
                                fill="rgba(0,0,0,0)"
                            />
                            {isExpanded && (
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={dotR + 8}
                                    fill="none"
                                    stroke={dc}
                                    strokeWidth="1"
                                    opacity="0.5"
                                    style={{
                                        animation:
                                            "esc-vertex-pulse 1.6s ease-in-out infinite",
                                    }}
                                />
                            )}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={dotR + 2}
                                fill="none"
                                stroke={dc}
                                strokeWidth="1"
                                opacity={isExpanded ? 0.4 : 0.15}
                                style={{ transition: "opacity 220ms ease" }}
                            />
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isExpanded ? dotR + 2 : dotR}
                                fill={
                                    isExpanded
                                        ? hx(dc, 0.18)
                                        : "rgba(0,0,0,0.7)"
                                }
                                stroke={dc}
                                strokeWidth={isExpanded ? "2" : "1.5"}
                                style={{
                                    filter: `drop-shadow(0 0 ${isExpanded ? "10" : "4"}px ${dc})`,
                                    transition:
                                        "all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                                }}
                            />
                            <text
                                x={p.x}
                                y={p.y - dotR - 6}
                                textAnchor="middle"
                                fill={
                                    isExpanded
                                        ? dc
                                        : "rgba(255,255,255,0.85)"
                                }
                                fontSize={valFs}
                                fontWeight="600"
                                fontFamily="Inter,sans-serif"
                                style={{
                                    transition: "fill 220ms ease",
                                    pointerEvents: "none",
                                }}
                            >
                                {p.v}
                            </text>
                        </g>
                    )
                })}
                {pts
                    .filter(
                        (_, i) =>
                            i === 0 ||
                            i === pts.length - 1 ||
                            i % Math.max(1, Math.floor(pts.length / 5)) === 0
                    )
                    .map((p, i) => (
                        <text
                            key={`d${i}`}
                            x={p.x}
                            y={h - pad.b + 16}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.2)"
                            fontSize={isMobile ? "8" : "10"}
                            fontFamily="Inter,sans-serif"
                        >
                            {p.d.getDate()}/{p.d.getMonth() + 1}
                        </text>
                    ))}
            </svg>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: isMobile ? 4 : 10,
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    {history.length} Ciclo{history.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ═══ Selector de pilar — debajo de la línea temporal ═══
                Chips horizontales scroll-snap. Picando uno la línea se
                redibuja con esa columna del scan, manteniendo todos los
                nodos pero con el valor del pilar seleccionado. */}
            <div
                style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <p
                    style={{
                        margin: "0 0 10px",
                        fontSize: 9.5,
                        fontWeight: 600,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.32)",
                        fontFamily: "'Inter',sans-serif",
                        textAlign: "center",
                    }}
                >
                    Filtra por pilar
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: 6,
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        padding: "2px 4px 8px",
                        margin: "0 -4px",
                        scrollSnapType: "x proximity",
                    }}
                >
                    {PILLAR_OPTIONS.map((p) => {
                        const active = p.id === selectedPillar
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPillar(p.id)}
                                style={{
                                    flexShrink: 0,
                                    scrollSnapAlign: "start",
                                    padding: isMobile
                                        ? "7px 12px"
                                        : "8px 14px",
                                    borderRadius: 999,
                                    border: active
                                        ? `1px solid ${hx(p.color, 0.7)}`
                                        : "1px solid rgba(255,255,255,0.12)",
                                    background: active
                                        ? `linear-gradient(180deg, ${hx(p.color, 0.22)}, ${hx(p.color, 0.08)})`
                                        : "rgba(20,30,55,0.4)",
                                    color: active
                                        ? p.color
                                        : "rgba(220,238,252,0.55)",
                                    fontFamily:
                                        "'Inter', sans-serif, monospace",
                                    fontSize: isMobile ? 10 : 10.5,
                                    fontWeight: 600,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    boxShadow: active
                                        ? `0 0 14px ${hx(p.color, 0.32)}`
                                        : "none",
                                    transition:
                                        "all 220ms ease",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                {p.short}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ═══ Panel expandido del nodo seleccionado ═══
                Cuando el Tripulante pica un nodo de la línea, abrimos
                un panel debajo con los 6 pilares de ese ciclo y sus
                puntajes individuales. Permite ver "cuánto saqué en
                cada pilar hace 3 semanas" sin tener que abrir cada
                ciclo manualmente. */}
            <AnimatePresence>
                {expandedNode !== null && pts[expandedNode] && (
                    <ExpandedNodePanel
                        key={`exp-${expandedNode}`}
                        entry={pts[expandedNode].entry}
                        accent={accent}
                        isMobile={isMobile}
                        pillarOptions={PILLAR_OPTIONS}
                        onPickPillar={(id) => setSelectedPillar(id)}
                        onClose={() => setExpandedNode(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══ ExpandedNodePanel ═══
   Panel desplegable con los 6 pilares + valor del nodo seleccionado.
   Cada pilar es una row clickeable: picarla cambia el filtro de la
   línea temporal a ese pilar (cierra el panel implícitamente al
   ejecutar el effect que limpia expandedNode al cambiar selectedPillar).
   Cabecera: fecha del ciclo + Índice de Luz en grande.
   Estilo: glassmorphism cyan/dorado consistente con el lenguaje del
   Escáner. Animación de entrada smooth. */
function ExpandedNodePanel({
    /* v2.0 — Defaults defensivos. Framer instancia componentes
       standalone al cargar el module — sin defaults, accent/entry
       undefined crashean en hx(accent, ...) o new Date(entry.created_at).
       Defensa documented en CLAUDE.md (feedback_framer_props_defaults). */
    entry = { created_at: new Date().toISOString() } as ScanEntry,
    accent = "#00C2FF",
    isMobile = false,
    pillarOptions = [],
    onPickPillar = () => {},
    onClose = () => {},
}: {
    entry?: ScanEntry
    accent?: string
    isMobile?: boolean
    pillarOptions?: Array<{
        id: PillarId | "global"
        label: string
        short: string
        column?: keyof ScanEntry
        color: string
    }>
    onPickPillar?: (id: PillarId | "global") => void
    onClose?: () => void
}) {
    const date = new Date(entry.created_at)
    const dateStr = date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
    const timeStr = date.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
    const indice = entry.indice_silicio || 0
    const indiceColor =
        indice >= 90 ? GOLD : indice >= 50 ? accent : "#FF6B6B"
    const pillars = pillarOptions.filter((p) => p.id !== "global")

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
            transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
            }}
            style={{
                marginTop: 16,
                padding: isMobile ? "16px 14px" : "20px 22px",
                borderRadius: 14,
                background:
                    "linear-gradient(165deg, rgba(8,18,34,0.85), rgba(2,6,16,0.95))",
                border: `1px solid ${hx(accent, 0.22)}`,
                boxShadow: `0 14px 36px rgba(0,0,0,0.55), 0 0 22px ${hx(accent, 0.12)}`,
                transformOrigin: "top center",
            }}
        >
            {/* Cabecera: fecha + índice global del ciclo + cerrar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    gap: 10,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 9.5,
                            letterSpacing: "0.32em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "'Inter',sans-serif",
                            marginBottom: 4,
                        }}
                    >
                        Ciclo del {dateStr}
                    </div>
                    <div
                        style={{
                            fontSize: 10,
                            color: "rgba(180,200,220,0.55)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {timeStr}
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 9,
                                letterSpacing: "0.28em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.35)",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Índice
                        </div>
                        <div
                            style={{
                                fontSize: isMobile ? 24 : 30,
                                fontWeight: 200,
                                lineHeight: 1,
                                color: indiceColor,
                                textShadow: `0 0 16px ${hx(indiceColor, 0.6)}`,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            {indice}
                            <span
                                style={{
                                    fontSize: 10,
                                    opacity: 0.5,
                                    marginLeft: 2,
                                }}
                            >
                                /100
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            cursor: "pointer",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Grid de pilares: cada row con label + barra horizontal +
                valor numérico. Picarlo filtra la línea temporal. */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                {pillars.map((p) => {
                    const raw =
                        p.column != null
                            ? (entry as any)[p.column]
                            : null
                    const v: number =
                        typeof raw === "number" && Number.isFinite(raw)
                            ? raw
                            : 0
                    const has = typeof raw === "number"
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onPickPillar(p.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: `1px solid ${hx(p.color, 0.2)}`,
                                background: hx(p.color, 0.06),
                                cursor: "pointer",
                                fontFamily: "'Inter',sans-serif",
                                textAlign: "left",
                                width: "100%",
                                WebkitTapHighlightColor: "transparent",
                                transition: "all 220ms ease",
                            }}
                        >
                            {/* Label + dot */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minWidth: isMobile ? 110 : 140,
                                    flexShrink: 0,
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: p.color,
                                        boxShadow: `0 0 8px ${hx(p.color, 0.7)}`,
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: isMobile ? 10.5 : 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: p.color,
                                    }}
                                >
                                    {p.short}
                                </span>
                            </div>

                            {/* Barra horizontal */}
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    height: 6,
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.06)",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                {has && (
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${v}%` }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.22, 1, 0.36, 1],
                                            delay: 0.05,
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            bottom: 0,
                                            left: 0,
                                            background: `linear-gradient(90deg, ${hx(p.color, 0.45)}, ${p.color})`,
                                            boxShadow: `0 0 8px ${hx(p.color, 0.6)}`,
                                            borderRadius: 4,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Valor numérico */}
                            <div
                                style={{
                                    flexShrink: 0,
                                    minWidth: 36,
                                    textAlign: "right",
                                    fontSize: isMobile ? 12 : 13,
                                    fontWeight: 600,
                                    color: has
                                        ? p.color
                                        : "rgba(255,255,255,0.3)",
                                    fontFamily:
                                        "'Inter', sans-serif, monospace",
                                    textShadow: has
                                        ? `0 0 8px ${hx(p.color, 0.4)}`
                                        : "none",
                                }}
                            >
                                {has ? v : "—"}
                            </div>
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}

function RecalView({
    /* v2.5 — Defaults defensivos contra Framer instanciando el
       componente standalone al cargar el module. Sin estos defaults
       cualquier acceso (.length, Object.values, etc) crashea con
       "Cannot convert undefined or null to object". */
    scores = {} as Scores,
    accent = "#00C2FF",
    history = [],
    lastCycleTs = null,
    cycleScanned = new Set<PillarId>(),
    isMobile = false,
}: {
    scores?: Scores
    accent?: string
    history?: ScanEntry[]
    lastCycleTs?: number | null
    cycleScanned?: Set<PillarId>
    isMobile?: boolean
}) {
    /* v1.2 — El setInterval de "now" + cálculo de gDays/gHours/gMins
       vivía aquí solo para alimentar el countdown "Próxima Sintonización"
       que se removió. Se retiraron también los cálculos para evitar
       re-renders cada segundo sin uso. */
    const hasScan = Object.values(scores).some((v) => v !== null)
    if (!hasScan)
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    flex: 1,
                    minHeight: 400,
                    textAlign: "center",
                    padding: "0 20px",
                }}
            >
                {/* v1.4 — Removido el h2 duplicado "Trayectoria del
                    Avatar". El header ya viene del shell de Mi Núcleo
                    (sectionLabelMap.trayectoria == "Trayectoria del
                    Avatar"); duplicarlo dentro del empty state hacía
                    que la pantalla se viera con dos títulos pegados. */}
                <p
                    style={{
                        fontSize: 15,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.92)",
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.8,
                    }}
                >
                    Aún no has completado ningún ciclo.
                    <br />
                    Ve al Radar y sondea tus 6 pilares.
                </p>
            </div>
        )
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? 36 : 44,
                padding: isMobile ? "28px 0 80px" : "80px 0 80px",
                width: "100%",
            }}
        >
            {/* v1.4 — Removido el h2 duplicado "Trayectoria del
                Avatar" que vivía arriba del TimelineChart. El header
                de Mi Núcleo ya pinta ese título; tenerlo dos veces
                hacía la vista redundante. */}
            <TimelineChart
                history={history}
                accent={accent}
                isMobile={isMobile}
            />
            {/* v1.2 — Countdown "Próxima Sintonización" removido de la
               Trayectoria. Diego pidió que solo se muestre arriba del
               Radar (donde sí tiene sentido visual: el cooldown forma
               parte del ritual de escaneo). En cuentas frescas que
               recién cerraban un ciclo, el contador aparecía con valores
               raros (00:00) durante la transición, y la información
               se duplicaba con la que vive en /escaner. */}
        </div>
    )
}

export default RecalView
