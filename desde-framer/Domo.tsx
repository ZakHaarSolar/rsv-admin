// MotorDeIntervencion.tsx v4.6 — CORREOS · botón ACTUALIZAR propio (Zak 2026-08-10): pide el padrón fresco (load force, salta su memoria) sin recargar la página ni tocar lo que las otras pestañas ya cargaron; gira mientras trae. Y la fila del panel de IAs pasa a "Espejo · Matriz Sincrónica" (nombre nuevo del modo, decisión de Zak; ids internos siguen rafaga). | v4.5 — 🜂 EL PANEL DE IAs DICE POR QUÉ: cada tarjeta suma `criterio` (motivo real verificado contra el edge) + las filas que faltaban (Reflejo ilustrado flux-2-pro 2/día · Matriz Sincrónica flux/schnell 30/día · navegación por voz Groq 8b/70b con OpenRouter de respaldo). | v4.4 — memoria en las pestañas que faltaban (Crop Circles, App, pase de IAs, sesiones del Onboarding; badge de versión sin doble consulta); las escrituras piden load(true); vaciar embudo/marcar avisados/publicar versión olvidan sus memorias. Requiere MI_Shared v2.0.
// MotorDeIntervencion.tsx v4.3 — primera tanda de la memoria de pestañas (Navegación · Onboarding · Correos · Rachas, y vía MI_Editores el Espejo y el Buzón) + BORRAR TODO el embudo del Onboarding con confirmación en rojo. Requiere 20260807c + admin-action v1.50.
// MotorDeIntervencion.tsx v4.2 — PESTAÑA "Soporte" (MI_Soporte.tsx, archivo nuevo): bandeja de casos de Ajustes → "¿Necesitas ayuda?" (cada caso trae escrito QUÉ PEDIRLE y marca lo que falta) + TRANSFERIR SUSCRIPCIÓN en un clic con el CRUCE contra el cobro real (últimos 4 vía la edge soporte-stripe; factura/monto/fecha de payments_log) y guardas (destino con cuenta creada; no duplicar activa del mismo tipo) + BITÁCORA. Requiere 20260807_soporte + admin-action v1.49 + edge soporte-stripe.
// MotorDeIntervencion.tsx v4.1 — IAs · PASE DE IMÁGENES DEL ARQUITECTO (Zak): tarjeta bajo Límites que otorga imágenes EXTRA del día sobre el tope de 2/día del Reflejo ilustrado. El destinatario NO se elige: la RPC admin_grant_image_pass lo fija a cuerpodeluz555@gmail.com, así que ni manipulando el cliente se le da a otra cuenta; el pase vence solo al terminar el día. Requiere migración 20260806_pase_imagen_arquitecto + admin-action v1.48.
// | ARQUEOLOGÍA COMPRIMIDA (v3.38–v4.0 · el detalle vive en git log): el header se mantiene bajo 300.000 bytes A PROPÓSITO — pasado ese peso el watcher marca skipped_large y el archivo hay que pegarlo a mano en Framer. Pestañas nacidas en ese tramo: Rituales · Wallpapers (+Atelier) · Avatares (+Campo Solar) · Cristalización · Comunidad · Mensajes · Medallas · Moderación · Stickers · Buzón · Navegación v2 · Espejo · Rachas · App · Onboarding (embudo + sesiones + 6 ramas) · Crop Circles · Correos · IAs · Frecuencias. Además: badge de versión a dos líneas + una versión POR TIENDA; bloqueo de emergencia por versión mínima (20260730_app_lockdown + admin-action v1.44); correos en tres listas (20260804_correos_tres_listas); toggles Cámara Solar y Sesiones; auditoría 2026-07-24 (el editor de Sondas/Calibraciones pasa por el gateway admin-action); Espejo con contexto vivo, memoria destilada y los dos interruptores de la voz; la tabla de Límites como MATRIZ con su moneda y su Techo DURO.
// v3.38 — REFACTOR · split en sello MI_. El shell delgado mantiene la
// composición tabs/grid + handler global de teclado y delega:
//   · MI_Shared       → CSS, hooks, helpers, constantes, TripulanteHex
//   · MI_Editores     → SondasEditor + ProtocolosEditor (admin del Escáner)
//   · MI_Cards        → TripulanteCard (card del grid de Nodos)
//   · MI_Cristales    → CristalRitualOverlay + GrantCristalButton
//   · MI_Detail       → TripulanteDetail (modal del nodo, con vista
//                       expandible de Códices Adquiridos)
//   · MI_Tripulantes  → TripulantesView (grid + filtros + fetch)
//
// Feature nuevo en MI_Detail: Códices Adquiridos muestra hasta 3 rows;
// si hay más, un botón "Expandir N más" abre una vista interna del
// panel del nodo (siguiendo el patrón canónico del Holograma de
// Expansión: position absolute inset:0 sobre el modal, header con
// título + botón Volver, body scrollable, ESC cierra primero la vista
// expandida y luego el modal).
//
// Para iterar partes específicas del Motor, editar el archivo MI_X
// correspondiente. Property controls SIEMPRE en Domo (ver CLAUDE.md
// regla "Domo es el HUB ÚNICO de configuración").

import React, { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import NavRevealPin from "./NavRevealPin.tsx"
import Shared from "./MI_Shared.tsx"
import Editores from "./MI_Editores.tsx"
import TripulantesView from "./MI_Tripulantes.tsx"
import SoporteMod from "./MI_Soporte.tsx"

const { SoporteHub } = SoporteMod

const {
    useAdminAuth,
    useIsMobile,
    useScrollHideHeader,
    rpc,
    adminAction,
    /* 🜂 MEMORIA DEL MOTOR (MI_Shared v1.9): las lecturas de cada pestaña se
       guardan mientras la página esté abierta, así ir y volver entre pestañas
       ya no vuelve a decir "Cargando…" por lo mismo. Cada "Recargar" pide
       `{force:true}`; recargar la página entera limpia todo. */
    adminActionCached,
    rpcCached,
    motorCacheClear,
    PILARES,
    CSS,
} = Shared
const {
    SondasEditor,
    ProtocolosEditor,
    RitualesHub,
    WallpapersHub,
    BiosferaEditor,
    AvataresHub,
    CristalizacionEditor,
    ComunidadInteresesEditor,
    MensajeAdminEditor,
    MedallasEditor,
    ModeracionPanel,
    StickersHub,
    BuzonEditor,
    VersionesEditor,
    EspejoEditor,
} = Editores

interface PanelProps {
    supabaseUrl?: string
    supabaseAnonKey?: string
}
type Pilar =
    | "FISICO"
    | "MENTAL"
    | "EMOCIONAL"
    | "FINANCIERO"
    | "VECTOR"
    | "ORBITA"
type Section =
    | "home"
    | "sondas"
    | "protocolos"
    | "tripulantes"
    | "navegacion"
    | "onboarding"
    | "rituales"
    | "wallpapers"
    | "biosfera"
    | "cropcircles"
    | "correos"
    | "avatares"
    | "cristalizacion"
    | "comunidad"
    | "mensajes"
    | "medallas"
    | "moderacion"
    | "stickers"
    | "buzones"
    | "soporte"
    | "rachas"
    | "espejo"
    | "app"
    | "ias"

interface SondaRow {
    id: string
    pilar: string
    step_order: number
    question_text: string
    options_json: { label: string; value: number }[]
    is_active: boolean
}
interface ProtoRow {
    id: string
    pilar: string
    fase: number
    titulo: string
    descripcion_corta: string
    alerta_text: string
    sugerencia_text: string
    tareas_json: { id: string; desc: string }[]
    is_active: boolean
    score_min: number
    score_max: number
}

/* ═══ Telemetría de Navegación — qué capas y sub-capas usan los
   Tripulantes. Vista general (todos en conjunto) + listado de nodos con
   datos (al picar uno, sus stats). Selector de día (últimos 7), toggle
   "Sin Repetición" (1 por usuario/capa), toggle "Excluir mis cuentas" y
   botón de recarga. Lee el agregado server-side por el gateway verificado
   admin-action; las aperturas se registran desde la app (escaner-app:
   iOS + escaner.redsolarviva.com) con dedupe por sesión + retención 7 días. ═══ */
function NavTelemetryView({
    url,
    apiKey,
    adminClerkId,
}: {
    url: string
    apiKey: string
    adminClerkId: string
}) {
    const [day, setDay] = useState<string | null>(null)
    const [distinct, setDistinct] = useState(false)
    const [exclude, setExclude] = useState(true)
    const [reloadKey, setReloadKey] = useState(0)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [selectedNode, setSelectedNode] = useState<any>(null)
    const [nodeData, setNodeData] = useState<any>(null)
    const [nodeLoading, setNodeLoading] = useState(false)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setErr("")
            try {
                /* 🜂 v4.4 — "Recargar" OLVIDA la familia y sube reloadKey. El
                   `force: reloadKey > 0` anterior quedaba en true para siempre
                   tras el primer Recargar: la memoria dejaba de servir. */
                const r = await adminActionCached(
                    url,
                    apiKey,
                    "get_nav_telemetry",
                    {
                        p_day: day,
                        p_distinct: distinct,
                        p_exclude: exclude,
                    }
                )
                if (cancelled) return
                const d = Array.isArray(r) ? r[0] : r
                setData(d && typeof d === "object" ? d : null)
            } catch {
                if (!cancelled) setErr("No se pudo leer la telemetría.")
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [url, apiKey, adminClerkId, day, distinct, exclude, reloadKey])

    useEffect(() => {
        if (!selectedNode) {
            setNodeData(null)
            return
        }
        let cancelled = false
        ;(async () => {
            setNodeLoading(true)
            try {
                /* 🜂 El drill-down también recuerda (llave = nodo + día +
                   filtro): ir y volver entre dos nodos no repite consultas. */
                const r = await adminActionCached(
                    url,
                    apiKey,
                    "get_nav_telemetry_node",
                    {
                        p_target_clerk_id: selectedNode.clerk_user_id,
                        p_day: day,
                        p_distinct: distinct,
                    }
                )
                if (cancelled) return
                const d = Array.isArray(r) ? r[0] : r
                setNodeData(d && typeof d === "object" ? d : null)
            } catch {
                if (!cancelled) setNodeData(null)
            } finally {
                if (!cancelled) setNodeLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [selectedNode, url, apiKey, day, distinct, reloadKey])

    const LAYER_LABEL: Record<string, string> = {
        radar: "Radar",
        calibracion: "Calibración",
        holoteca: "Holoteca",
        decodificador: "Decodificador",
        nucleo: "Núcleo",
        sendero: "Sendero de Luz",
        comunidad: "Comunidad",
        espejo: "Espejo",
        simuladores: "Simuladores",
    }
    const SUB_LABEL: Record<string, string> = {
        codices: "Códices",
        meditaciones: "Meditaciones",
        codigos: "Códigos Fuente",
        fragmentos: "Fragmentos",
        materia: "Materia",
        suenos: "Sueños",
        trayectoria: "Trayectoria",
        rachas: "Rachas",
        firma: "Mi Firma de Luz",
        ritual: "Sendero de Luz",
        nova: "Avatar",
        comunidad: "Comunidad",
        mensajes: "Mensajes",
        ajustes: "Ajustes",
        explorar: "Explorar",
        simuladores: "Simuladores",
        navegante: "Navegante de la Red",
        orbitas: "Sincronizador de Órbitas",
        reactor: "Reactor",
        "ciudad-luz": "Ciudad de Luz",
        "boveda-materia": "Bóveda · Materia",
        "boveda-suenos": "Bóveda · Sueños",
        fisico: "Cuerpo",
        mental: "Mente",
        emocional: "Emociones",
        financiero: "Abundancia",
        vector: "Propósito",
        orbita: "Vínculos",
        dia: "Mi día",
        avatar: "Avatar",
        medallas: "Medallas",
    }
    const WD = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const weekdayLabel = (dateStr: string) => {
        try {
            const [y, m, dd] = dateStr.split("-").map(Number)
            const dt = new Date(y, (m || 1) - 1, dd || 1)
            return WD[dt.getDay()] || ""
        } catch {
            return ""
        }
    }
    const fmtAgo = (ts: any) => {
        if (!ts) return ""
        const t = new Date(ts).getTime()
        if (isNaN(t)) return ""
        const diff = Date.now() - t
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return "ahora"
        if (mins < 60) return `hace ${mins}m`
        const h = Math.floor(mins / 60)
        if (h < 24) return `hace ${h}h`
        return `hace ${Math.floor(h / 24)}d`
    }

    const pill = (active: boolean): React.CSSProperties => ({
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        cursor: "pointer",
        border: `1px solid ${active ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.1)"}`,
        background: active ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.02)",
        color: active ? "rgba(140,225,255,0.95)" : "rgba(255,255,255,0.55)",
        outline: "none",
        whiteSpace: "nowrap",
    })

    const days: any[] = Array.isArray(data?.days) ? data.days : []

    const Controls = ({ showExclude }: { showExclude: boolean }) => (
        <div style={{ marginBottom: 18 }}>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                <button
                    onClick={() => {
                        /* Olvida las dos lecturas de la pestaña (vista general
                           y drill-down) en TODAS sus combinaciones, y relee. */
                        motorCacheClear("get_nav_telemetry")
                        setReloadKey((k) => k + 1)
                    }}
                    style={{
                        ...pill(false),
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "rgba(140,225,255,0.9)",
                        border: "1px solid rgba(0,229,255,0.4)",
                    }}
                    title="Actualizar datos"
                >
                    <span
                        style={{
                            display: "inline-block",
                            animation: loading
                                ? "esc-mon-spin 0.9s linear infinite"
                                : undefined,
                        }}
                    >
                        ↻
                    </span>
                    Recargar
                </button>
                <button
                    onClick={() => setDistinct((v) => !v)}
                    style={pill(distinct)}
                    title="Cuenta una vez por usuario y capa"
                >
                    {distinct ? "✓ " : ""}Sin Repetición
                </button>
                {showExclude && (
                    <button
                        onClick={() => setExclude((v) => !v)}
                        style={pill(exclude)}
                        title="Excluye tus cuentas internas (Diego / Aqua)"
                    >
                        {exclude ? "✓ " : ""}Excluir mis cuentas
                    </button>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <button onClick={() => setDay(null)} style={pill(day === null)}>
                    Todos · 7 días
                </button>
                {days.map((d: any) => (
                    <button
                        key={d.date}
                        onClick={() =>
                            setDay((cur) => (cur === d.date ? null : d.date))
                        }
                        style={{
                            ...pill(day === d.date),
                            display: "inline-flex",
                            flexDirection: "column",
                            alignItems: "center",
                            lineHeight: 1.2,
                            padding: "5px 10px",
                        }}
                    >
                        <span>{weekdayLabel(d.date)}</span>
                        <span
                            style={{
                                fontSize: 9,
                                opacity: 0.7,
                                fontFamily: "'JetBrains Mono',monospace",
                            }}
                        >
                            {Number(d.events) || 0}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )

    const barRow = (
        labelTop: string,
        labelSub: string | null,
        ev: number,
        us: number | null,
        max: number,
        accent: string,
        keyId: string
    ) => {
        const pct = max > 0 ? Math.round((ev / max) * 100) : 0
        return (
            <div key={keyId} style={{ marginBottom: 12 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 5,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.85)",
                        }}
                    >
                        {labelSub ? (
                            <>
                                <span
                                    style={{ color: "rgba(212,168,67,0.85)" }}
                                >
                                    {labelTop}
                                </span>{" "}
                                · {labelSub}
                            </>
                        ) : (
                            <span style={{ fontWeight: 600 }}>{labelTop}</span>
                        )}
                    </span>
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 11,
                            color: accent,
                        }}
                    >
                        {ev}
                        {us != null ? ` · ${us}` : ""}
                    </span>
                </div>
                <div
                    style={{
                        height: 7,
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.05)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: 99,
                            background: `linear-gradient(90deg, ${accent.replace("0.95", "0.5")}, ${accent})`,
                        }}
                    />
                </div>
            </div>
        )
    }

    const sectionTitle = (txt: string) => (
        <p
            style={{
                margin: "0 0 14px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
            }}
        >
            {txt}
        </p>
    )

    /* ── Drill-down de un nodo ── */
    if (selectedNode) {
        const nLayers: any[] = Array.isArray(nodeData?.layers)
            ? nodeData.layers
            : []
        const nSubs: any[] = Array.isArray(nodeData?.sublayers)
            ? nodeData.sublayers
            : []
        const maxNL = nLayers.reduce(
            (m, l) => Math.max(m, Number(l?.events) || 0),
            0
        )
        const maxNS = nSubs.reduce(
            (m, s) => Math.max(m, Number(s?.events) || 0),
            0
        )
        const nodeName =
            selectedNode.full_name ||
            selectedNode.email ||
            selectedNode.clerk_user_id
        return (
            <div
                style={{
                    padding: "8px 4px 60px",
                    maxWidth: 720,
                    margin: "0 auto",
                }}
            >
                <button
                    onClick={() => setSelectedNode(null)}
                    style={{
                        ...pill(false),
                        marginBottom: 16,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    ← Volver a todos
                </button>
                <p
                    style={{
                        margin: "0 0 2px",
                        fontSize: 16,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.92)",
                    }}
                >
                    {nodeName}
                </p>
                {selectedNode.email && (
                    <p
                        style={{
                            margin: "0 0 18px",
                            fontSize: 11.5,
                            color: "rgba(0,229,255,0.7)",
                            fontFamily: "'JetBrains Mono',monospace",
                        }}
                    >
                        {selectedNode.email}
                    </p>
                )}
                <Controls showExclude={false} />
                {nodeLoading ? (
                    <p
                        style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            padding: "30px 0",
                            textAlign: "center",
                        }}
                    >
                        Leyendo…
                    </p>
                ) : (
                    <>
                        {sectionTitle("Capas que abrió")}
                        {nLayers.length > 0 ? (
                            nLayers.map((l: any) =>
                                barRow(
                                    LAYER_LABEL[l.layer] || l.layer,
                                    null,
                                    Number(l?.events) || 0,
                                    null,
                                    maxNL,
                                    "rgba(0,229,255,0.95)",
                                    `nl-${l.layer}`
                                )
                            )
                        ) : (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.4)",
                                }}
                            >
                                Sin aperturas en este rango.
                            </p>
                        )}
                        <div style={{ height: 24 }} />
                        {sectionTitle("Sub-capas que abrió")}
                        {nSubs.length > 0 ? (
                            nSubs.map((s: any, i: number) =>
                                barRow(
                                    LAYER_LABEL[s.layer] || s.layer,
                                    SUB_LABEL[s.sublayer] || s.sublayer,
                                    Number(s?.events) || 0,
                                    null,
                                    maxNS,
                                    "rgba(212,168,67,0.95)",
                                    `ns-${s.layer}-${s.sublayer}-${i}`
                                )
                            )
                        ) : (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.4)",
                                }}
                            >
                                Sin sub-capas en este rango.
                            </p>
                        )}
                    </>
                )}
            </div>
        )
    }

    /* ── Vista general (todos en conjunto) ── */
    if (loading && !data)
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 13, fontWeight: 300, color: "#fff" }}>
                    Leyendo telemetría de navegación…
                </p>
            </div>
        )
    if (err)
        return (
            <div
                style={{
                    padding: "8px 4px 60px",
                    maxWidth: 720,
                    margin: "0 auto",
                }}
            >
                <Controls showExclude={true} />
                <p
                    style={{
                        fontSize: 13,
                        color: "rgba(255,120,120,0.8)",
                        textAlign: "center",
                        padding: "30px 0",
                    }}
                >
                    {err}
                </p>
            </div>
        )

    const layers: any[] = Array.isArray(data?.layers) ? data.layers : []
    const sublayers: any[] = Array.isArray(data?.sublayers)
        ? data.sublayers
        : []
    const nodes: any[] = Array.isArray(data?.nodes) ? data.nodes : []
    const maxLayer = layers.reduce(
        (m, l) => Math.max(m, Number(l?.events) || 0),
        0
    )
    const maxSub = sublayers.reduce(
        (m, s) => Math.max(m, Number(s?.events) || 0),
        0
    )
    const totalEvents = Number(data?.total_events) || 0

    return (
        <div
            style={{ padding: "8px 4px 60px", maxWidth: 720, margin: "0 auto" }}
        >
            <Controls showExclude={true} />
            {totalEvents === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.55)",
                        maxWidth: 440,
                        margin: "20px auto",
                        textAlign: "center",
                    }}
                >
                    Sin registros de navegación en este rango. Aparecerán a
                    medida que los Tripulantes recorran la app con la versión
                    que incluye esta telemetría.
                </p>
            ) : (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            marginBottom: 24,
                            flexWrap: "wrap",
                        }}
                    >
                        {[
                            { k: "Aperturas", v: totalEvents },
                            {
                                k: "Tripulantes",
                                v: Number(data?.total_users) || 0,
                            },
                            { k: "Nodos con datos", v: nodes.length },
                        ].map((m) => (
                            <div
                                key={m.k}
                                style={{
                                    flex: "1 1 110px",
                                    padding: "14px 16px",
                                    borderRadius: 12,
                                    background: "rgba(16,22,40,0.92)",
                                    border: "1px solid rgba(255,255,255,0.14)",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 4px",
                                        fontSize: 9,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.4)",
                                    }}
                                >
                                    {m.k}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 24,
                                        fontWeight: 200,
                                        fontFamily:
                                            "'JetBrains Mono',monospace",
                                        color: "rgba(0,229,255,0.95)",
                                    }}
                                >
                                    {m.v}
                                </p>
                            </div>
                        ))}
                    </div>

                    {sectionTitle("Capas principales")}
                    {layers.length > 0 ? (
                        layers.map((l: any) =>
                            barRow(
                                LAYER_LABEL[l.layer] || l.layer,
                                null,
                                Number(l?.events) || 0,
                                Number(l?.users) || 0,
                                maxLayer,
                                "rgba(0,229,255,0.95)",
                                `gl-${l.layer}`
                            )
                        )
                    ) : (
                        <p
                            style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.4)",
                            }}
                        >
                            Sin datos.
                        </p>
                    )}

                    <div style={{ height: 26 }} />
                    {sectionTitle("Sub-capas · aperturas · tripulantes")}
                    {sublayers.length > 0 ? (
                        sublayers.map((s: any, i: number) =>
                            barRow(
                                LAYER_LABEL[s.layer] || s.layer,
                                SUB_LABEL[s.sublayer] || s.sublayer,
                                Number(s?.events) || 0,
                                Number(s?.users) || 0,
                                maxSub,
                                "rgba(212,168,67,0.95)",
                                `gs-${s.layer}-${s.sublayer}-${i}`
                            )
                        )
                    ) : (
                        <p
                            style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.4)",
                            }}
                        >
                            Sin sub-capas registradas todavía.
                        </p>
                    )}

                    <div style={{ height: 26 }} />
                    {sectionTitle("Nodos con datos · toca para ver sus stats")}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {nodes.map((n: any) => (
                            <button
                                key={n.clerk_user_id}
                                onClick={() => setSelectedNode(n)}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 14px",
                                    borderRadius: 12,
                                    background: "rgba(16,22,40,0.92)",
                                    border: "1px solid rgba(255,255,255,0.14)",
                                    cursor: "pointer",
                                    outline: "none",
                                    textAlign: "left",
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <p
                                        style={{
                                            margin: "0 0 2px",
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.9)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {n.full_name ||
                                            n.email ||
                                            n.clerk_user_id}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 10.5,
                                            color: "rgba(255,255,255,0.4)",
                                            fontFamily:
                                                "'JetBrains Mono',monospace",
                                        }}
                                    >
                                        {Number(n.screens) || 0} pantallas ·{" "}
                                        {Number(n.opens) || 0} aperturas
                                        {n.last_seen
                                            ? ` · ${fmtAgo(n.last_seen)}`
                                            : ""}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        color: "rgba(0,229,255,0.7)",
                                        fontSize: 16,
                                        flexShrink: 0,
                                    }}
                                >
                                    ›
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

/* Blindaje: un fallo del badge de versión (telemetría, opcional) JAMÁS debe
   tumbar el panel del Motor. Si su render lanza, este boundary lo aísla y
   renderiza nada, dejando el resto del Motor intacto. */
class BadgeBoundary extends React.Component<
    { children: React.ReactNode },
    { failed: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { failed: false }
    }
    static getDerivedStateFromError() {
        return { failed: true }
    }
    componentDidCatch() {}
    render() {
        return this.state.failed ? null : this.props.children
    }
}

/* Badge de versión (dos líneas), debajo del título del Motor:
   · "Versión en circulación" = la que está VIVA en la App Store. Es el valor
     editable de la pestaña "App" (get_app_release → latest_version); tú la subes
     cuando un build queda publicado. También es la que dispara el aviso de
     actualizar a quien corra una versión anterior.
   · "Versión en proceso" = el build más nuevo que se está probando (telemetría
     get_app_version_summary = la app_version MÁS ALTA que reportan los nodos).
     Es la que se va a lanzar; se marca en el código (APP_VERSION). */
/* v3.64 — "Versión en proceso" AUTOMÁTICA: la telemetría solo reporta builds
   que YA corren en un device; el piso es la SIGUIENTE de la versión en
   circulación (bumpPatch) → al publicar desde la pestaña App, el badge avanza
   solo. Ya NO hay constante que bumpear a mano por ciclo. */
function bumpPatch(v: string | null): string {
    const p = String(v || "")
        .split(".")
        .map((n) => parseInt(n, 10) || 0)
    while (p.length < 3) p.push(0)
    p[p.length - 1] += 1
    return p.join(".")
}
function semverMax(a: string | null, b: string): string {
    if (!a) return b
    try {
        const pa = a.split(".").map(Number)
        const pb = b.split(".").map(Number)
        for (let i = 0; i < 3; i++) {
            const d = (pb[i] || 0) - (pa[i] || 0)
            if (d > 0) return b
            if (d < 0) return a
        }
    } catch {}
    return a
}

function AppVersionBadge({ url, apiKey }: { url: string; apiKey: string }) {
    const [enProceso, setEnProceso] = useState<string | null>(null)
    const [enCirculacion, setEnCirculacion] = useState<string | null>(null)
    /* Número propio de Google Play (vacío = va con el de la App Store). */
    const [enCircAndroid, setEnCircAndroid] = useState<string>("")
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                /* 🜂 El badge vive en el encabezado y se remonta cada vez que
                   se cambia de pestaña: sin memoria, eran dos consultas por
                   cada clic de navegación. */
                const [sum, rel] = await Promise.all([
                    adminActionCached(
                        url,
                        apiKey,
                        "get_app_version_summary",
                        {}
                    ),
                    rpcCached(url, apiKey, "get_app_release", {}),
                ])
                if (!cancelled) {
                    if (sum && typeof sum.top === "string")
                        setEnProceso(sum.top)
                    const d = Array.isArray(rel) ? rel[0] : rel
                    if (d && typeof d === "object" && d.latest_version) {
                        setEnCirculacion(String(d.latest_version))
                        setEnCircAndroid(
                            String(d.latest_version_android || "").trim()
                        )
                    }
                }
            } catch {}
            if (!cancelled) setLoaded(true)
        })()
        return () => {
            cancelled = true
        }
    }, [url, apiKey])
    if (!loaded) return null
    const line: any = {
        textAlign: "center",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
    }
    return (
        <div style={{ marginTop: -2, marginBottom: 8 }}>
            <div style={{ ...line, color: "rgba(125,239,255,0.6)" }}>
                {enCircAndroid
                    ? "Circulación · iPhone: "
                    : "Versión en circulación: "}
                <b style={{ color: "#7DEFFF", letterSpacing: "0.08em" }}>
                    {enCirculacion || "sin definir"}
                </b>
                {enCircAndroid ? (
                    <>
                        {"  ·  Android: "}
                        <b
                            style={{
                                color: "#7DEFFF",
                                letterSpacing: "0.08em",
                            }}
                        >
                            {enCircAndroid}
                        </b>
                    </>
                ) : null}
            </div>
            <div
                style={{
                    ...line,
                    marginTop: 3,
                    color: "rgba(214,168,67,0.62)",
                }}
            >
                Versión en proceso:{" "}
                <b style={{ color: "#E8C56B", letterSpacing: "0.08em" }}>
                    {enCirculacion || enProceso
                        ? semverMax(enProceso, bumpPatch(enCirculacion))
                        : "sin datos aún"}
                </b>
            </div>
        </div>
    )
}

/* 🜂 Primera versión de la app que TRAE el freno de emergencia en su código
   (UpdatePrompt v2.2, construido el 2026-07-30; la 1.1.3 se archivó antes y
   no lo lleva). Un teléfono con una versión anterior no puede obedecerlo:
   ni siquiera sabe que existe. Subir a mano si algún día se rehace. */
const LOCK_DESDE = "1.1.4"

/* ═══ BITÁCORA DE AVISOS (Motor → "App") ══════════════════════════════════
   Qué se publicó y cuándo. Antes el panel solo mostraba el estado actual y no
   había manera de saber si un aviso ya se había mandado (Zak: "se me olvida
   si ya mandamos ese broadcast o no"). Requiere migración
   20260805b_bitacora_avisos_app + admin-action v1.45. */
function BitacoraAvisosPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const CY = "#7DEFFF"
    const [filas, setFilas] = useState<any[] | null>(null)
    const [err, setErr] = useState("")
    /* 🜂 Una vez por visita. Solo lectura: quien escribe la bitácora es el
       editor de versiones, que olvida esta familia al publicar. */
    const cargar = async (force = false) => {
        try {
            const r = await adminActionCached(
                url,
                apiKey,
                "admin_get_app_release_log",
                { p_limit: 30 },
                { force }
            )
            if (Array.isArray(r)) {
                setFilas(r)
                setErr("")
            } else {
                setFilas([])
                setErr(
                    `Sin bitácora todavía (${String((r as any)?.error || "sin_respuesta")}). Si dice unknown_action falta desplegar admin-action v1.45; si la tabla no existe, falta pegar 20260805b_bitacora_avisos_app.`
                )
            }
        } catch (e: any) {
            setFilas([])
            setErr(`No se pudo leer (${String(e?.message || e).slice(0, 80)})`)
        }
    }
    useEffect(() => {
        void cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])
    const fecha = (s: string) => {
        try {
            return new Date(s).toLocaleString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return String(s || "")
        }
    }
    /* Cada fila se lee como una frase completa: qué pasó, en qué tienda y de
       qué número a cuál. (Zak: "Mensaje actualizado · sigue en 1.1.3" no se
       entendía — no decía que ESO era guardar el texto del aviso.) */
    const TIENDA: Record<string, string> = {
        ios: "iPhone",
        android: "Android",
    }
    const linea = (f: any) => {
        if (f.kind === "lock_on")
            return {
                c: "#FF7A6B",
                t: `⛔ Se ACTIVÓ el bloqueo de emergencia · frena a quien corra menos de ${f.min_version || "?"}`,
            }
        if (f.kind === "lock_off")
            return {
                c: "#8FE3FF",
                t: "⛔ Se desactivó el bloqueo de emergencia",
            }
        if (f.kind === "mensaje")
            return {
                c: "rgba(255,255,255,0.55)",
                t: "Se guardó el texto del aviso · sin publicar versión nueva",
            }
        const tienda = TIENDA[String(f.store || "")] || ""
        const dondeTxt = tienda ? `${tienda} · ` : ""
        const desde = String(f.version_prev || "").trim()
        const cambio = desde && desde !== f.version
        /* Filas viejas (antes de separar por tienda) no traen `store`; si
           tampoco cambió el número, era un guardado de mensaje. */
        return {
            c: cambio ? "#E8C56B" : "rgba(255,255,255,0.55)",
            t: cambio
                ? `✦ ${dondeTxt}se publicó la ${f.version} · antes estaba la ${desde}`
                : desde
                  ? `Se guardó el texto del aviso · la versión siguió en ${f.version}`
                  : `✦ ${dondeTxt}versión en circulación: ${f.version}`,
        }
    }
    return (
        <div
            style={{
                marginTop: 26,
                padding: "18px 16px",
                borderRadius: 16,
                border: "1px solid rgba(125,239,255,0.22)",
                background:
                    "linear-gradient(180deg, rgba(8,18,34,0.5), rgba(4,8,18,0.6))",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: CY,
                        fontWeight: 600,
                    }}
                >
                    ◈ Bitácora de avisos
                </div>
                <button
                    onClick={() => void cargar(true)}
                    style={{
                        padding: "5px 11px",
                        borderRadius: 999,
                        border: "1px solid rgba(125,239,255,0.3)",
                        background: "transparent",
                        color: "rgba(125,239,255,0.8)",
                        fontSize: 11,
                        cursor: "pointer",
                    }}
                >
                    Refrescar
                </button>
            </div>
            <div
                style={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: 14,
                }}
            >
                Cada vez que publicas una versión o mueves el freno de
                emergencia queda anotado aquí, con la fecha y qué había antes.
            </div>
            {err ? (
                <div
                    style={{
                        marginBottom: 12,
                        padding: "9px 12px",
                        borderRadius: 10,
                        fontSize: 12,
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.7)",
                        background: "rgba(125,239,255,0.06)",
                        border: "1px solid rgba(125,239,255,0.22)",
                    }}
                >
                    {err}
                </div>
            ) : null}
            {filas === null ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    Cargando…
                </div>
            ) : filas.length === 0 && !err ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    Todavía no hay movimientos anotados.
                </div>
            ) : (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    {filas.map((f: any) => {
                        const l = linea(f)
                        return (
                            <div
                                key={f.id}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: l.c,
                                        marginBottom: 3,
                                    }}
                                >
                                    {l.t}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        color: "rgba(255,255,255,0.35)",
                                    }}
                                >
                                    {fecha(f.created_at)}
                                    {f.admin_email ? ` · ${f.admin_email}` : ""}
                                </div>
                                {f.message ? (
                                    <div
                                        style={{
                                            fontSize: 11.5,
                                            lineHeight: 1.5,
                                            color: "rgba(255,255,255,0.45)",
                                            marginTop: 5,
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {String(f.message).slice(0, 220)}
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ═══ BLOQUEO DE EMERGENCIA (Motor → "App") ═══════════════════════════════
   El freno de mano: pantalla SIN SALIDA (mensaje + botón a la App Store) para
   quien corre una versión ANTERIOR a la mínima marcada. Para un gasto
   desbocado o una fuga que no puede esperar la revisión de Apple.
   · POR VERSIÓN MÍNIMA: publicado el arreglo, quien actualiza queda libre; las
     versiones con el problema siguen frenadas. Para frenar TODO lo publicado
     se pone una mínima más alta que cualquier build vivo (p. ej. 9.9.9).
   · FAIL-OPEN (en la app): si el teléfono no puede leer este estado, ABRE
     normal — el freno solo actúa cuando de verdad lee "bloqueo activo".
   · La app lo re-consulta al volver a primer plano (~1×/min): no hace falta
     que cierren y abran la app para que llegue.
   Requiere migración 20260730_app_lockdown + admin-action v1.44. */
function BloqueoEmergenciaPanel({
    url,
    apiKey,
}: {
    url: string
    apiKey: string
}) {
    const CY = "#7DEFFF"
    const RO = "#FF7A6B"
    const [estado, setEstado] = useState<any>(null)
    const [minVer, setMinVer] = useState("")
    const [msg, setMsg] = useState("")
    const [confirmando, setConfirmando] = useState(false)
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState("")
    /* 🜂 Comparte la lectura con el editor de versiones y con el badge: los
       tres leen `get_app_release`, así que entre los tres hacen UNA consulta. */
    const cargar = async (force = false) => {
        try {
            const rel = await rpcCached(
                url,
                apiKey,
                "get_app_release",
                {},
                { force }
            )
            const d = Array.isArray(rel) ? rel[0] : rel
            if (d && typeof d === "object") {
                setEstado(d)
                setMinVer((prev) =>
                    prev
                        ? prev
                        : String(d.lock_min_version || d.latest_version || "")
                )
                setMsg((prev) => (prev ? prev : String(d.lock_message || "")))
            }
        } catch {}
    }
    useEffect(() => {
        void cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])
    const activo = estado?.lock_active === true
    const guardar = async (nuevoActivo: boolean) => {
        setBusy(true)
        setErr("")
        try {
            const r = await adminAction(url, apiKey, "admin_set_app_lockdown", {
                p_active: nuevoActivo,
                p_min_version: minVer.trim(),
                p_message: msg.trim(),
            })
            /* Mover el freno cambia `get_app_release` y agrega una fila a la
               bitácora: se olvidan las dos familias. */
            motorCacheClear("rpc:get_app_release")
            motorCacheClear("admin_get_app_release_log")
            if (r && typeof r === "object" && !(r as any).error) {
                setEstado(r)
                setConfirmando(false)
            } else {
                const motivo = String((r as any)?.error || "sin_respuesta")
                setErr(
                    motivo === "missing_min_version"
                        ? "Falta la versión mínima: sin ella el bloqueo no sabe a quién frenar."
                        : `No se pudo guardar (${motivo}). Si dice unknown_action: falta desplegar admin-action v1.44; si la columna no existe: falta pegar la migración 20260730_app_lockdown.`
                )
            }
        } catch (e: any) {
            setErr(
                `No se pudo guardar (${String(e?.message || e).slice(0, 80)})`
            )
        }
        setBusy(false)
    }
    const inputStyle: any = {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(125,239,255,0.25)",
        background: "rgba(4,10,22,0.7)",
        color: "#fff",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        outline: "none",
    }
    return (
        <div
            style={{
                marginTop: 26,
                padding: "18px 16px",
                borderRadius: 16,
                border: `1px solid ${activo ? "rgba(255,122,107,0.5)" : "rgba(255,122,107,0.22)"}`,
                background: activo
                    ? "linear-gradient(180deg, rgba(64,14,10,0.5), rgba(20,6,8,0.72))"
                    : "linear-gradient(180deg, rgba(24,10,10,0.35), rgba(10,6,10,0.55))",
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: RO,
                    marginBottom: 6,
                    fontWeight: 600,
                }}
            >
                ⛔ Bloqueo de emergencia
            </div>
            <div
                style={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.66)",
                    marginBottom: 14,
                }}
            >
                Frena las versiones ANTERIORES a la mínima con una pantalla sin
                salida (tu mensaje + botón a la tienda). Publicada la versión
                arreglada, quien actualice queda libre solo. Si el teléfono no
                puede leer este interruptor, la app abre normal (el freno jamás
                se dispara por una caída de red).
            </div>
            {/* 🜂 A PARTIR DE QUÉ VERSIÓN OBEDECE (Zak, 2026-08-05). El freno
                vive en el código de la app: un teléfono con una versión
                anterior a la que lo trae simplemente no sabe que existe y
                abre normal, por más que aquí diga ACTIVO. Sin este dato a la
                vista, activarlo da una sensación de cobertura que no es
                real. LOCK_DESDE se sube a mano cuando cambie el mínimo. */}
            <div
                style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "rgba(255,214,120,0.85)",
                    background: "rgba(232,197,107,0.08)",
                    border: "1px solid rgba(232,197,107,0.28)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    marginBottom: 14,
                }}
            >
                Obedecen el freno las versiones <b>{LOCK_DESDE} en adelante</b>.
                Quien corre una anterior no lo trae en el código y abre normal,
                esté activo o no. En Android abre Google Play; en iPhone, la App
                Store.
            </div>
            <div
                style={{
                    display: "inline-block",
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: 14,
                    color: activo ? "#FFD9D3" : "rgba(125,239,255,0.8)",
                    background: activo
                        ? "rgba(255,122,107,0.2)"
                        : "rgba(125,239,255,0.08)",
                    border: `1px solid ${activo ? "rgba(255,122,107,0.55)" : "rgba(125,239,255,0.25)"}`,
                }}
            >
                {activo
                    ? `BLOQUEO ACTIVO · frena versiones < ${estado?.lock_min_version || "?"}`
                    : "Inactivo"}
            </div>
            <div style={{ marginBottom: 10 }}>
                <div
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                        marginBottom: 5,
                    }}
                >
                    Versión mínima permitida
                </div>
                <input
                    value={minVer}
                    onChange={(e) => setMinVer(e.target.value)}
                    placeholder="1.1.3"
                    style={inputStyle}
                />
                <div
                    style={{
                        fontSize: 11,
                        lineHeight: 1.5,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 4,
                    }}
                >
                    Se frena a quien corre una versión MENOR a esta. Para frenar
                    todo lo publicado: 9.9.9.
                </div>
            </div>
            <div style={{ marginBottom: 14 }}>
                <div
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                        marginBottom: 5,
                    }}
                >
                    Mensaje en la pantalla
                </div>
                <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    rows={3}
                    placeholder="Esta versión de la app se pausó por mantenimiento. Actualiza a la versión más reciente para continuar."
                    style={{
                        ...inputStyle,
                        resize: "vertical",
                        fontFamily: "'Inter', sans-serif",
                    }}
                />
            </div>
            {err ? (
                <div
                    style={{
                        marginBottom: 12,
                        padding: "9px 12px",
                        borderRadius: 10,
                        fontSize: 12,
                        lineHeight: 1.55,
                        color: "#FFD9D3",
                        background: "rgba(255,122,107,0.12)",
                        border: "1px solid rgba(255,122,107,0.4)",
                    }}
                >
                    {err}
                </div>
            ) : null}
            {activo ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                        onClick={() => guardar(false)}
                        disabled={busy}
                        style={{
                            flex: "1 1 200px",
                            padding: "12px",
                            borderRadius: 12,
                            border: `1px solid rgba(125,239,255,0.4)`,
                            background: "rgba(125,239,255,0.1)",
                            color: CY,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            cursor: "pointer",
                        }}
                    >
                        {busy ? "Guardando…" : "DESACTIVAR BLOQUEO"}
                    </button>
                    <button
                        onClick={() => guardar(true)}
                        disabled={busy}
                        style={{
                            flex: "1 1 200px",
                            padding: "12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,122,107,0.45)",
                            background: "rgba(255,122,107,0.1)",
                            color: RO,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            cursor: "pointer",
                        }}
                    >
                        Actualizar versión/mensaje
                    </button>
                </div>
            ) : confirmando ? (
                <div>
                    <div
                        style={{
                            fontSize: 12.5,
                            lineHeight: 1.6,
                            color: "#FFD9D3",
                            marginBottom: 10,
                        }}
                    >
                        Vas a frenar a TODO nodo con versión menor a{" "}
                        <b>{minVer.trim() || "?"}</b>: verán tu mensaje y un
                        botón a la App Store, sin poder usar la app. ¿Activar?
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                            onClick={() => guardar(true)}
                            disabled={busy || !minVer.trim()}
                            style={{
                                flex: "1 1 180px",
                                padding: "12px",
                                borderRadius: 12,
                                border: "none",
                                background:
                                    "linear-gradient(135deg, #FF7A6B, #E8543F)",
                                color: "#2A0A06",
                                fontSize: 13,
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                                cursor: "pointer",
                                opacity: !minVer.trim() ? 0.5 : 1,
                            }}
                        >
                            {busy ? "Activando…" : "SÍ, ACTIVAR BLOQUEO"}
                        </button>
                        <button
                            onClick={() => setConfirmando(false)}
                            disabled={busy}
                            style={{
                                flex: "1 1 120px",
                                padding: "12px",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setConfirmando(true)}
                    disabled={busy}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,122,107,0.45)",
                        background: "rgba(255,122,107,0.1)",
                        color: RO,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                    }}
                >
                    ACTIVAR BLOQUEO…
                </button>
            )}
        </div>
    )
}

/* Pestaña "Rachas" — lectura ANÓNIMA del Contador de Rachas: títulos + días,
   SIN identidad (ni id, ni correo, ni alias). Espejo ético del panel del
   Espejo: sirve para entender PARA QUÉ usan la capa, no QUIÉN. El detalle
   por nodo (números sin títulos) vive en el Padrón → detalle (MI_Detail). */
function RachasAnonPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(false)
    const load = async (force = false) => {
        setLoading(true)
        setErr(false)
        try {
            const r = await adminActionCached(
                url,
                apiKey,
                "admin_get_rachas_anon",
                {},
                { force }
            )
            if (r && Array.isArray((r as any).rachas)) setData(r)
            else setErr(true)
        } catch {
            setErr(true)
        }
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const CY = "#7DEFFF"
    const GO = "#E8C56B"
    /* v3.64 — filtro Todas · Sintonía · Libres sobre la lista anónima. */
    const [filtro, setFiltro] = useState<"todas" | "sintonia" | "libres">(
        "todas"
    )
    const rachas: any[] = Array.isArray(data?.rachas) ? data.rachas : []
    const rachasFiltradas =
        filtro === "todas"
            ? rachas
            : rachas.filter((r: any) =>
                  filtro === "sintonia" ? !!r.is_member : !r.is_member
              )
    const nSintonia = rachas.filter((r: any) => !!r.is_member).length
    const filtroPill = (
        key: "todas" | "sintonia" | "libres",
        label: string
    ) => (
        <button
            type="button"
            onClick={() => setFiltro(key)}
            style={{
                padding: "6px 13px",
                borderRadius: 999,
                border: `1px solid ${
                    filtro === key
                        ? "rgba(125,239,255,0.55)"
                        : "rgba(125,239,255,0.16)"
                }`,
                background:
                    filtro === key ? "rgba(125,239,255,0.12)" : "transparent",
                color: filtro === key ? CY : "rgba(255,255,255,0.45)",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    )
    const stat = (label: string, value: string, accent: string) => (
        <div
            style={{
                flex: 1,
                borderRadius: 12,
                border: `1px solid ${accent}33`,
                background: "rgba(6,12,26,0.55)",
                padding: "12px 10px",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: accent,
                    marginTop: 4,
                }}
            >
                {value}
            </div>
        </div>
    )
    return (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                        letterSpacing: "0.06em",
                    }}
                >
                    ◷ Rachas · uso de la capa
                </h3>
                <button
                    type="button"
                    onClick={() => void load(true)}
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: CY,
                        background: "rgba(125,239,255,0.08)",
                        border: "1px solid rgba(125,239,255,0.3)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        cursor: "pointer",
                    }}
                >
                    Recargar
                </button>
            </div>
            <p
                style={{
                    margin: "0 0 14px",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.45)",
                }}
            >
                Lectura anónima: títulos y días sin identidad, para entender
                para qué usan los contadores. Lo por-nodo (sin títulos) vive en
                Nodos Activos → detalle.
            </p>
            {loading ? (
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                    Cargando…
                </p>
            ) : err || !data ? (
                <p style={{ color: "rgba(255,140,140,0.8)", fontSize: 13 }}>
                    No se pudo leer (¿migración 20260706b + admin-action v1.29
                    desplegados?).
                </p>
            ) : (
                <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        {stat("Contadores", String(data.total ?? 0), GO)}
                        {stat("Nodos con rachas", String(data.nodos ?? 0), CY)}
                        {stat(
                            "De miembros",
                            String(data.members ?? 0),
                            "#B59CFF"
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 14,
                        }}
                    >
                        {filtroPill("todas", `Todas · ${rachas.length}`)}
                        {filtroPill("sintonia", `Sintonía · ${nSintonia}`)}
                        {filtroPill(
                            "libres",
                            `Libres · ${rachas.length - nSintonia}`
                        )}
                    </div>
                    {rachasFiltradas.length === 0 ? (
                        <p
                            style={{
                                color: "rgba(255,255,255,0.5)",
                                fontSize: 12.5,
                            }}
                        >
                            Aún no hay contadores sellados.
                        </p>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {rachasFiltradas.map((r: any, i: number) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        borderRadius: 12,
                                        border: "1px solid rgba(125,239,255,0.14)",
                                        background: "rgba(8,14,30,0.55)",
                                        padding: "10px 14px",
                                    }}
                                >
                                    <span
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: "rgba(255,255,255,0.88)",
                                            overflowWrap: "break-word",
                                        }}
                                    >
                                        {String(r.title || "")}
                                    </span>
                                    {r.is_member ? (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: CY,
                                                border: `1px solid ${CY}44`,
                                                background: `${CY}14`,
                                                borderRadius: 999,
                                                padding: "3px 9px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            Sintonía
                                        </span>
                                    ) : null}
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: GO,
                                            flexShrink: 0,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {Number(r.days ?? 0)} d
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

/* Toggle ON/OFF de la Cámara Solar (sesiones grupales). Cuando está OCULTA, la
   web quita la sección de Cámara Solar de /sesiones (deja solo el 1:1) y esconde
   la pestaña de Sesiones en Mi Núcleo para quien no tiene sesiones. Flag global
   en app_flags:hide_camara_solar (lectura pública get_app_flag, escritura admin
   por admin_set_app_flag). Vive en la fila del título del Motor. */
function CamaraSolarToggle({ url, apiKey }: { url: string; apiKey: string }) {
    const [hidden, setHidden] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)
    useEffect(() => {
        let cancel = false
        ;(async () => {
            try {
                const v = await rpc(url, apiKey, "get_app_flag", {
                    p_key: "hide_camara_solar",
                })
                if (!cancel) setHidden(v === true)
            } catch {
                if (!cancel) setHidden(false)
            }
        })()
        return () => {
            cancel = true
        }
    }, [url, apiKey])
    const toggle = async () => {
        if (hidden === null || saving) return
        const next = !hidden
        setSaving(true)
        try {
            const r = await adminAction(url, apiKey, "admin_set_app_flag", {
                p_key: "hide_camara_solar",
                p_value: next,
            })
            if (r !== null && r !== undefined) setHidden(next)
        } catch {}
        setSaving(false)
    }
    const on = hidden === true
    return (
        <div style={{ textAlign: "center" }}>
            <button
                onClick={toggle}
                disabled={hidden === null || saving}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 16px",
                    borderRadius: 999,
                    cursor: hidden === null || saving ? "default" : "pointer",
                    border: `1px solid ${on ? "rgba(255,180,90,0.55)" : "rgba(125,239,255,0.3)"}`,
                    background: on
                        ? "rgba(255,170,70,0.12)"
                        : "rgba(10,16,34,0.5)",
                    color: on ? "#FFC37D" : "rgba(180,230,255,0.72)",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: hidden === null ? 0.5 : 1,
                }}
            >
                <span
                    style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: on ? "#FFB347" : "#3a4a66",
                        boxShadow: on ? "0 0 9px #FFB347" : "none",
                        flexShrink: 0,
                    }}
                />
                {hidden === null
                    ? "Cámara Solar · cargando…"
                    : on
                      ? "Cámara Solar OCULTA · tocar para mostrar"
                      : "Cámara Solar VISIBLE · tocar para ocultar"}
            </button>
        </div>
    )
}

/* Toggle ON/OFF de TODA la oferta de Sesiones (grupales + 1:1 juntas). A
   diferencia de CamaraSolarToggle (que solo apaga lo grupal y deja vivo el
   1:1), este flag apaga /sesiones POR COMPLETO — la web muestra ahí una
   pantalla de cortesía ("POR AHORA NO HAY SESIONES ABIERTAS") y Mi Núcleo
   esconde SIEMPRE la pestaña de Sesiones, sin importar si el Tripulante
   tiene sesiones compradas o membresía. Flag global INDEPENDIENTE en
   app_flags:hide_sesiones (lectura pública get_app_flag, escritura admin
   por admin_set_app_flag). Paleta carmín/rosa (distinta del naranja de
   Cámara Solar) para que sea obvio a simple vista cuál de los dos apaga
   solo lo grupal y cuál apaga TODO. Vive junto a CamaraSolarToggle en la
   fila del título del Motor. */
function SesionesToggle({ url, apiKey }: { url: string; apiKey: string }) {
    const [hidden, setHidden] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)
    useEffect(() => {
        let cancel = false
        ;(async () => {
            try {
                const v = await rpc(url, apiKey, "get_app_flag", {
                    p_key: "hide_sesiones",
                })
                if (!cancel) setHidden(v === true)
            } catch {
                if (!cancel) setHidden(false)
            }
        })()
        return () => {
            cancel = true
        }
    }, [url, apiKey])
    const toggle = async () => {
        if (hidden === null || saving) return
        const next = !hidden
        setSaving(true)
        try {
            const r = await adminAction(url, apiKey, "admin_set_app_flag", {
                p_key: "hide_sesiones",
                p_value: next,
            })
            if (r !== null && r !== undefined) setHidden(next)
        } catch {}
        setSaving(false)
    }
    const on = hidden === true
    return (
        <div style={{ textAlign: "center" }}>
            <button
                onClick={toggle}
                disabled={hidden === null || saving}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 16px",
                    borderRadius: 999,
                    cursor: hidden === null || saving ? "default" : "pointer",
                    border: `1px solid ${on ? "rgba(255,107,129,0.55)" : "rgba(125,239,255,0.3)"}`,
                    background: on
                        ? "rgba(255,90,110,0.12)"
                        : "rgba(10,16,34,0.5)",
                    color: on ? "#FF8FA3" : "rgba(180,230,255,0.72)",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: hidden === null ? 0.5 : 1,
                }}
            >
                <span
                    style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: on ? "#FF6B81" : "#3a4a66",
                        boxShadow: on ? "0 0 9px #FF6B81" : "none",
                        flexShrink: 0,
                    }}
                />
                {hidden === null
                    ? "Sesiones (todo) · cargando…"
                    : on
                      ? "Sesiones (todo) OCULTAS · tocar para mostrar"
                      : "Sesiones (todo) VISIBLES · tocar para ocultar"}
            </button>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────
   PRUEBAS A/B (Growth) — flip del Onboarding y del Paywall del Escáner
   sin rebuild. Escribe app_flags:growth_onboarding_legacy /
   growth_paywall_legacy (true = versión vieja V1; ausente/false = V2, la
   de alta conversión). La app iOS los lee en el arranque (lib/growthFlags)
   → el cambio aplica en la próxima apertura. Reusa get_app_flag /
   admin_set_app_flag (la misma infra del toggle de Cámara Solar).
   ───────────────────────────────────────────────────────────────── */
function ABRow({
    titulo,
    v2Name,
    v2Desc,
    v1Name,
    v1Desc,
    legacy,
    busy,
    onPick,
}: {
    titulo: string
    v2Name: string
    v2Desc: string
    v1Name: string
    v1Desc: string
    legacy: boolean | null
    busy: boolean
    onPick: (useLegacy: boolean) => void
}) {
    const opt = (useLegacy: boolean, name: string, desc: string) => {
        const active = legacy !== null && legacy === useLegacy
        const acc = useLegacy ? "#7DEFFF" : "#FFC37D"
        return (
            <button
                onClick={() => !busy && legacy !== null && onPick(useLegacy)}
                disabled={busy || legacy === null}
                style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: busy || legacy === null ? "default" : "pointer",
                    border: `1.5px solid ${active ? acc : "rgba(255,255,255,0.10)"}`,
                    background: active
                        ? useLegacy
                            ? "rgba(125,239,255,0.10)"
                            : "rgba(255,180,90,0.10)"
                        : "rgba(10,16,34,0.5)",
                    opacity: legacy === null ? 0.5 : 1,
                    transition: "border-color .15s, background .15s",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: active ? acc : "#3a4a66",
                            boxShadow: active ? `0 0 8px ${acc}` : "none",
                            flexShrink: 0,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: active ? acc : "rgba(220,235,255,0.85)",
                        }}
                    >
                        {name}
                    </span>
                    {active && (
                        <span
                            style={{
                                marginLeft: "auto",
                                fontSize: 9,
                                letterSpacing: "0.1em",
                                color: acc,
                            }}
                        >
                            ACTIVO
                        </span>
                    )}
                </div>
                <div
                    style={{
                        fontSize: 11,
                        lineHeight: 1.35,
                        color: "rgba(180,205,235,0.6)",
                        paddingLeft: 18,
                    }}
                >
                    {desc}
                </div>
            </button>
        )
    }
    return (
        <div style={{ marginBottom: 16 }}>
            <p
                style={{
                    margin: "0 0 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(180,205,235,0.7)",
                }}
            >
                {titulo}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
                {opt(false, v2Name, v2Desc)}
                {opt(true, v1Name, v1Desc)}
            </div>
        </div>
    )
}

/* ── EMBUDO DEL ONBOARDING ────────────────────────────────────────────
   Hasta qué pantalla llegan los usuarios NUEVOS (anónimo por instalación,
   sin correo). Barras por pantalla + % que alcanza el paywall. */
const ONB_STEP_LABELS: string[] = [
    "1 · Portal de origen (¿qué te trajo aquí?)",
    "2 · Demo de la rama elegida · Síntomas (energía)",
    "3 · Puente a tu energía · Los 6 pilares",
    "4 · Pregunta 1 (cómo despiertas)",
    "5 · Pregunta 2 (área más pesada)",
    "6 · Pregunta 3 (reactividad)",
    "7 · Pregunta 4 (qué transformar)",
    "8 · Leyendo tu campo (análisis)",
    "9 · Tu lectura inicial (score)",
    "10 · El Radar (instrumento)",
    "11 · Herramientas para cada día",
    "12 · Línea de tiempo",
    "13 · PAYWALL (completó)",
]

/* Rama elegida en el Portal de Origen (answers.origin del embudo). */
const ONB_ORIGIN_META: Record<string, { label: string; color: string }> = {
    food: { label: "🍎 Comida", color: "#D4A843" },
    vision: { label: "👁 Visión", color: "#F0A6FF" },
    dream: { label: "🌙 Sueño", color: "#B59CFF" },
    espejo: { label: "🪞 Espejo", color: "#D8E0F2" },
    codice: { label: "📖 Códices", color: "#F8E7B8" },
    energy: { label: "⚡ Energía", color: "#00E5FF" },
}

/* Mapa de las 4 preguntas del quiz del OnboardingV2 (hardcode: los textos
   viven en el i18n de escaner-app, este panel es web) → para mostrar las
   respuestas legibles en la vista de Sesiones. */
const ONB_QUESTIONS: Array<{
    key: string
    titulo: string
    opciones: Record<string, string>
}> = [
    {
        key: "origin",
        titulo: "Portal de origen · ¿Qué te trajo aquí?",
        opciones: {
            food: "🍎 Escanear mi comida",
            vision: "👁 Decodificar mi realidad",
            dream: "🌙 Descifrar un sueño",
            espejo: "🪞 Hablar con el Espejo",
            codice: "📖 Vengo por los Códices",
            energy: "⚡ Medir mi energía",
        },
    },
    /* 🜂 2026-07-31 · II — la pregunta "¿qué Códice te trajo?" MURIÓ: quien
       llega por un reel no recuerda el título y elegir uno lo hacía pensar
       de más (riesgo de perderlo en la 2ª pantalla). La rama sigue midiéndose
       por answers.origin="codice"; el libro ya no se pregunta. */
    {
        key: "q1",
        titulo: "¿Cómo despiertas la mayoría de tus días?",
        opciones: {
            a: "Con energía y claridad",
            b: "Bien, pero me cuesta arrancar",
            c: "Cansado, necesito café para funcionar",
            d: "Drenado desde antes de empezar",
        },
    },
    {
        key: "q2",
        titulo: "¿Qué área se siente más pesada hoy?",
        opciones: {
            fisico: "Mi cuerpo y mi energía",
            mental: "Mi mente y mi enfoque",
            emocional: "Mis emociones",
            financiero: "Mi dinero",
            vector: "Mi propósito",
            orbita: "Mis relaciones",
        },
    },
    {
        key: "q3",
        titulo: "¿Qué tan seguido reaccionas en automático?",
        opciones: {
            a: "Casi nunca, suelo estar en calma",
            b: "Algunas veces por semana",
            c: "Casi todos los días",
            d: "Vivo en ese estado",
        },
    },
    {
        key: "q4",
        titulo: "¿Qué quieres transformar primero?",
        opciones: {
            a: "Mi energía física",
            b: "Mi paz mental",
            c: "Mi abundancia",
            d: "Mis vínculos",
            e: "Mi propósito",
            f: "Todo mi campo",
        },
    },
]

/* Vista de SESIONES individuales del onboarding (Usuario 1, 2…): anónima
   por instalación (sin correo ni nombre), con hasta dónde llegó cada uno y
   qué contestó en las 4 preguntas. Lee get_onb_sessions por el gateway. */
function OnbSessionsPanel({
    url,
    apiKey,
    onBack,
}: {
    url: string
    apiKey: string
    onBack: () => void
}) {
    const [days, setDays] = useState(30)
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    /* 🜂 Una vez por visita y por ventana de días: la llave incluye `p_days`,
       así que ir y volver entre 7 y 30 días no repite la consulta. */
    const load = async (d: number, force = false) => {
        setLoading(true)
        setErr("")
        try {
            const r = await adminActionCached(
                url,
                apiKey,
                "get_onb_sessions",
                { p_days: d },
                { force }
            )
            if (Array.isArray(r)) setSessions(r)
            else
                setErr(
                    "No se pudo leer las sesiones (¿migración 20260715 + admin-action v1.37 desplegados?)"
                )
        } catch (e: any) {
            setErr(String(e?.message || e))
        }
        setLoading(false)
    }
    useEffect(() => {
        void load(days)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days])
    return (
        <div style={{ padding: "4px 0 40px", maxWidth: 720 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 12,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                        onClick={onBack}
                        className="mi-tab"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                    >
                        ← Embudo
                    </button>
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#fff",
                            }}
                        >
                            👤 Sesiones del Onboarding
                        </p>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 11,
                                lineHeight: 1.5,
                                color: "rgba(180,205,235,0.6)",
                                maxWidth: 460,
                            }}
                        >
                            Cada instalación nueva (anónima, sin correo ni
                            nombre): hasta dónde llegó y qué contestó. Más
                            recientes primero.
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`mi-tab ${days === d ? "active" : ""}`}
                            style={{ padding: "6px 12px", fontSize: 11 }}
                        >
                            {d} días
                        </button>
                    ))}
                    <button
                        onClick={() => void load(days, true)}
                        className="mi-tab"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                        disabled={loading}
                    >
                        ↻ Recargar
                    </button>
                </div>
            </div>
            {err ? (
                <p style={{ color: "rgba(255,160,140,0.9)", fontSize: 12 }}>
                    {err}
                </p>
            ) : loading ? (
                <p style={{ color: "rgba(180,205,235,0.6)", fontSize: 12 }}>
                    Cargando sesiones…
                </p>
            ) : sessions.length === 0 ? (
                <p style={{ color: "rgba(180,205,235,0.6)", fontSize: 12 }}>
                    Aún no hay sesiones en esta ventana. La data empieza a
                    llegar con el próximo build de la app (más este backend
                    desplegado).
                </p>
            ) : (
                <>
                    <p
                        style={{
                            fontSize: 11.5,
                            color: "rgba(180,205,235,0.55)",
                            margin: "0 0 10px",
                        }}
                    >
                        {sessions.length} sesion
                        {sessions.length === 1 ? "" : "es"}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        {sessions.map((s, i) => {
                            const maxStep = Number(s.max_step) || 0
                            const reached =
                                ONB_STEP_LABELS[
                                    Math.min(
                                        Math.max(maxStep, 1),
                                        ONB_STEP_LABELS.length
                                    ) - 1
                                ] || `Paso ${maxStep}`
                            const answers =
                                s.answers && typeof s.answers === "object"
                                    ? s.answers
                                    : {}
                            const answered = ONB_QUESTIONS.filter(
                                (q) => answers[q.key]
                            )
                            return (
                                <div
                                    key={s.anon_id || i}
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: 12,
                                        background: "rgba(20,32,54,0.5)",
                                        border: "1px solid rgba(125,180,235,0.14)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13.5,
                                                fontWeight: 700,
                                                color: "#fff",
                                            }}
                                        >
                                            Usuario {i + 1}
                                        </span>
                                        {ONB_ORIGIN_META[answers.origin] ? (
                                            <span
                                                style={{
                                                    fontSize: 10.5,
                                                    padding: "3px 9px",
                                                    borderRadius: 999,
                                                    fontWeight: 700,
                                                    color: ONB_ORIGIN_META[
                                                        answers.origin
                                                    ].color,
                                                    border: `1px solid ${ONB_ORIGIN_META[answers.origin].color}55`,
                                                    background: `${ONB_ORIGIN_META[answers.origin].color}1f`,
                                                }}
                                            >
                                                {
                                                    ONB_ORIGIN_META[
                                                        answers.origin
                                                    ].label
                                                }
                                            </span>
                                        ) : null}
                                        <span
                                            style={{
                                                fontSize: 10.5,
                                                padding: "3px 9px",
                                                borderRadius: 999,
                                                background: s.completed
                                                    ? "rgba(60,200,140,0.16)"
                                                    : "rgba(125,180,235,0.12)",
                                                color: s.completed
                                                    ? "#7EE7B4"
                                                    : "rgba(180,215,245,0.9)",
                                                border: `1px solid ${
                                                    s.completed
                                                        ? "rgba(60,200,140,0.4)"
                                                        : "rgba(125,180,235,0.28)"
                                                }`,
                                            }}
                                        >
                                            {s.completed
                                                ? "Llegó al paywall"
                                                : `Llegó a: ${reached}`}
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            margin: "0 0 10px",
                                            fontSize: 10.5,
                                            color: "rgba(180,205,235,0.5)",
                                        }}
                                    >
                                        {reached} · {s.platform || "—"}
                                    </p>
                                    {answered.length > 0 ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 7,
                                            }}
                                        >
                                            {answered.map((q) => (
                                                <div
                                                    key={q.key}
                                                    style={{
                                                        fontSize: 11.5,
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: "rgba(150,185,225,0.7)",
                                                        }}
                                                    >
                                                        {q.titulo}
                                                    </span>
                                                    <br />
                                                    <span
                                                        style={{
                                                            color: "#DCE8F7",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        →{" "}
                                                        {q.opciones[
                                                            answers[q.key]
                                                        ] || answers[q.key]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 11,
                                                color: "rgba(180,205,235,0.4)",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            No alcanzó a contestar preguntas.
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

function OnbFunnelPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [tab, setTab] = useState<"funnel" | "sesiones">("funnel")
    const [days, setDays] = useState(30)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [purging, setPurging] = useState<number | null>(null)
    const [purgeMsg, setPurgeMsg] = useState("")
    /* Borrar TODO pide confirmación: es el único botón de acá que no perdona. */
    const [confirmarTodo, setConfirmarTodo] = useState(false)
    const [purgingAll, setPurgingAll] = useState(false)
    const [origins, setOrigins] = useState<Record<string, number> | null>(null)
    const load = async (d: number, force = false) => {
        setLoading(true)
        setErr("")
        try {
            const r = await adminActionCached(
                url,
                apiKey,
                "get_onb_funnel",
                { p_days: d },
                { force }
            )
            if (r) setData(r)
            else
                setErr(
                    "No se pudo leer el embudo (¿migración 20260713 + admin-action v1.35 desplegados?)"
                )
        } catch (e: any) {
            setErr(String(e?.message || e))
        }
        setLoading(false)
        /* Desglose por RAMA (Portal de origen): cuenta answers.origin de las
           sesiones de la misma ventana. Best-effort: si get_onb_sessions no
           está desplegada, el desglose simplemente no se muestra. */
        try {
            const s = await adminActionCached(
                url,
                apiKey,
                "get_onb_sessions",
                { p_days: d, p_limit: 1000 },
                { force }
            )
            if (Array.isArray(s)) {
                const counts: Record<string, number> = {}
                for (const row of s) {
                    const o = row?.answers?.origin
                    if (typeof o === "string" && ONB_ORIGIN_META[o]) {
                        counts[o] = (counts[o] || 0) + 1
                    }
                }
                setOrigins(counts)
            } else setOrigins(null)
        } catch {
            setOrigins(null)
        }
    }
    /* Borra la data de pruebas propias de las últimas N horas (para limpiar
       lo que uno mismo genera al recorrer el onboarding). */
    const purge = async (hours: number) => {
        if (purging != null) return
        setPurging(hours)
        setPurgeMsg("")
        try {
            const r = await adminAction(
                url,
                apiKey,
                "delete_onb_funnel_recent",
                { p_hours: hours }
            )
            if (r && typeof r.deleted !== "undefined") {
                /* El server manda las horas que REALMENTE aplicó (su tope):
                   si la migración de días no está pegada, el mensaje lo
                   delata en vez de mentir. */
                const hh = Number(r.hours) || 0
                const ventana =
                    hh >= 24 && hh % 24 === 0
                        ? `${hh / 24} ${hh / 24 === 1 ? "día" : "días"}`
                        : `${hh}h`
                setPurgeMsg(
                    `Borrados ${r.deleted} registros de las últimas ${ventana}.`
                )
                /* 🜂 Borrar invalida TODAS las ventanas (7/30/90) y también la
                   lista de sesiones, que se guarda con otra llave. Recargar
                   solo la ventana visible dejaría a las demás mintiendo. */
                motorCacheClear("get_onb_")
                await load(days, true)
            } else {
                setPurgeMsg(
                    "No se pudo borrar (¿migración 20260713c + admin-action v1.36 desplegados?)"
                )
            }
        } catch (e: any) {
            setPurgeMsg(String(e?.message || e))
        }
        setPurging(null)
    }
    /* 🜂 BORRAR TODO. Mientras los únicos que recorren el onboarding somos
       nosotros, cualquier ventana de 30 o 90 días cuenta testers y el número
       no dice nada. Esperar tres meses para tener una medición limpia no es
       opción: se borra entero y el conteo arranca de cero cuando la puerta se
       abra de verdad. Requiere migración 20260807c + admin-action v1.50. */
    const purgeAll = async () => {
        if (purgingAll) return
        setPurgingAll(true)
        setPurgeMsg("")
        try {
            const r = await adminAction(
                url,
                apiKey,
                "delete_onb_funnel_all",
                {}
            )
            if (r && typeof r.deleted !== "undefined") {
                setPurgeMsg(
                    `Embudo vaciado: ${r.deleted} registros. El conteo arranca de cero.`
                )
                setConfirmarTodo(false)
                motorCacheClear("get_onb_")
                await load(days, true)
            } else {
                setPurgeMsg(
                    "No se pudo borrar (¿migración 20260807c + admin-action v1.50 desplegados?)"
                )
            }
        } catch (e: any) {
            setPurgeMsg(String(e?.message || e))
        }
        setPurgingAll(false)
    }
    useEffect(() => {
        void load(days)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days])
    const total = Number(data?.total || 0)
    const completed = Number(data?.completed || 0)
    const steps: Array<{ step: number; reached: number }> = Array.isArray(
        data?.steps
    )
        ? data.steps
        : []
    if (tab === "sesiones")
        return (
            <OnbSessionsPanel
                url={url}
                apiKey={apiKey}
                onBack={() => setTab("funnel")}
            />
        )
    return (
        <div style={{ padding: "4px 0 40px", maxWidth: 720 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 6,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#fff",
                        }}
                    >
                        🚀 Embudo del Onboarding
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            lineHeight: 1.5,
                            color: "rgba(180,205,235,0.6)",
                            maxWidth: 460,
                        }}
                    >
                        Hasta qué pantalla llegan los usuarios nuevos (anónimo
                        por instalación, sin correo). Solo cuenta builds de
                        producción con el Onboarding B.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`mi-tab ${days === d ? "active" : ""}`}
                            style={{ padding: "6px 12px", fontSize: 11 }}
                        >
                            {d} días
                        </button>
                    ))}
                    <button
                        onClick={() => setTab("sesiones")}
                        className="mi-tab"
                        style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            marginLeft: 4,
                        }}
                    >
                        👤 Ver sesiones
                    </button>
                </div>
            </div>
            {/* Borrar mis pruebas: limpia la data que uno mismo genera al
                recorrer el onboarding, por ventana de tiempo. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    margin: "10px 0 4px",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(60,20,20,0.18)",
                    border: "1px solid rgba(255,150,120,0.22)",
                }}
            >
                <span
                    style={{
                        fontSize: 11.5,
                        color: "rgba(255,190,170,0.85)",
                        marginRight: 4,
                    }}
                >
                    🧹 Borrar mis pruebas (últimas):
                </span>
                {/* v3.85 — se suman las ventanas por DÍA (1/2/3): recorrer el
                    onboarding varias veces deja pruebas de días anteriores y
                    solo se podía limpiar hasta 12h atrás. Requiere la migración
                    20260728_onb_funnel_delete_dias (sube el tope de la RPC de
                    24h a 72h); sin ella, el server capea a 24h y el mensaje lo
                    dice con el número real que borró. */}
                {[
                    { h: 1, label: "1h" },
                    { h: 3, label: "3h" },
                    { h: 6, label: "6h" },
                    { h: 12, label: "12h" },
                    { h: 24, label: "1 día" },
                    { h: 48, label: "2 días" },
                    { h: 72, label: "3 días" },
                ].map(({ h, label }) => (
                    <button
                        key={h}
                        onClick={() => void purge(h)}
                        disabled={purging != null}
                        style={{
                            padding: "5px 11px",
                            fontSize: 11,
                            borderRadius: 8,
                            cursor: purging != null ? "default" : "pointer",
                            border: "1px solid rgba(255,150,120,0.4)",
                            background:
                                purging === h
                                    ? "rgba(255,150,120,0.25)"
                                    : "rgba(255,150,120,0.08)",
                            color: "#FFC9B4",
                            opacity: purging != null && purging !== h ? 0.5 : 1,
                        }}
                    >
                        {purging === h ? "…" : label}
                    </button>
                ))}
                {/* Borrar TODO — con confirmación en rojo, como cualquier
                    acción que no se puede deshacer. */}
                {confirmarTodo ? (
                    <>
                        <button
                            onClick={() => void purgeAll()}
                            disabled={purgingAll}
                            style={{
                                padding: "5px 12px",
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 8,
                                cursor: purgingAll ? "default" : "pointer",
                                border: "1px solid rgba(255,90,90,0.7)",
                                background: "rgba(255,80,80,0.28)",
                                color: "#fff",
                            }}
                        >
                            {purgingAll ? "Borrando…" : "Sí, borrar TODO"}
                        </button>
                        <button
                            onClick={() => setConfirmarTodo(false)}
                            style={{
                                padding: "5px 11px",
                                fontSize: 11,
                                borderRadius: 8,
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.65)",
                            }}
                        >
                            Cancelar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setConfirmarTodo(true)}
                        disabled={purging != null}
                        style={{
                            padding: "5px 11px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 8,
                            cursor: "pointer",
                            border: "1px solid rgba(255,120,120,0.55)",
                            background: "rgba(255,120,120,0.14)",
                            color: "#FFB3B3",
                            marginLeft: 4,
                        }}
                    >
                        Todo
                    </button>
                )}
                {purgeMsg ? (
                    <span
                        style={{
                            fontSize: 11,
                            color: "rgba(180,225,190,0.9)",
                            marginLeft: 4,
                        }}
                    >
                        {purgeMsg}
                    </span>
                ) : null}
            </div>
            {err ? (
                <div
                    style={{
                        margin: "14px 0",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid rgba(255,120,120,0.4)",
                        background: "rgba(80,20,20,0.25)",
                        color: "#FFB4B4",
                        fontSize: 12,
                    }}
                >
                    {err}
                </div>
            ) : null}
            {loading ? (
                <p style={{ color: "rgba(180,205,235,0.6)", fontSize: 12 }}>
                    Leyendo el embudo…
                </p>
            ) : (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            margin: "14px 0 18px",
                        }}
                    >
                        {[
                            ["Instalaciones", String(total)],
                            [
                                "Llegaron al paywall",
                                total
                                    ? `${completed} (${Math.round((completed / total) * 100)}%)`
                                    : "0",
                            ],
                            [
                                "iOS · Android · Web",
                                `${Number(data?.ios || 0)} · ${Number(data?.android || 0)} · ${Number(data?.web || 0)}`,
                            ],
                        ].map(([k, v]) => (
                            <div
                                key={k}
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 12,
                                    background: "rgba(8,14,30,0.6)",
                                    border: "1px solid rgba(125,239,255,0.18)",
                                    minWidth: 150,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "rgba(180,205,235,0.55)",
                                        marginBottom: 4,
                                    }}
                                >
                                    {k}
                                </div>
                                <div
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 750,
                                        color: "#7DEFFF",
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {v}
                                </div>
                            </div>
                        ))}
                        {origins && Object.keys(origins).length ? (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 12,
                                    background: "rgba(8,14,30,0.6)",
                                    border: "1px solid rgba(125,239,255,0.18)",
                                    minWidth: 210,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "rgba(180,205,235,0.55)",
                                        marginBottom: 6,
                                    }}
                                >
                                    Rama elegida (Portal de origen)
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {Object.entries(ONB_ORIGIN_META).map(
                                        ([k, m]) => (
                                            <span
                                                key={k}
                                                style={{
                                                    fontSize: 12.5,
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                    color: m.color,
                                                }}
                                            >
                                                {m.label}: {origins[k] || 0}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 7,
                        }}
                    >
                        {steps
                            .map((st, i) => {
                                const reached = Number(st.reached || 0)
                                const pct = total
                                    ? Math.round((reached / total) * 100)
                                    : 0
                                const prev =
                                    i === 0
                                        ? total
                                        : Number(steps[i - 1]?.reached || 0)
                                const drop = prev > 0 ? prev - reached : 0
                                const isPaywall = st.step === 13
                                return (
                                    <div key={st.step}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: 11,
                                                color: isPaywall
                                                    ? "#F5D98C"
                                                    : "rgba(220,235,250,0.85)",
                                                marginBottom: 3,
                                            }}
                                        >
                                            <span>
                                                {ONB_STEP_LABELS[st.step - 1] ||
                                                    `Paso ${st.step}`}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                }}
                                            >
                                                {reached} · {pct}%
                                                {drop > 0 ? (
                                                    <span
                                                        style={{
                                                            color: "rgba(255,140,130,0.8)",
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        −{drop}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                height: 9,
                                                borderRadius: 5,
                                                background:
                                                    "rgba(255,255,255,0.07)",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${pct}%`,
                                                    borderRadius: 5,
                                                    background: isPaywall
                                                        ? "linear-gradient(90deg, #D4A843, #F5D98C)"
                                                        : "linear-gradient(90deg, #1C8FB0, #7DEFFF)",
                                                    transition:
                                                        "width 0.5s ease",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                            .reverse()}
                        {!steps.length ? (
                            <p
                                style={{
                                    color: "rgba(180,205,235,0.6)",
                                    fontSize: 12,
                                }}
                            >
                                Aún no hay registros en este rango. La data
                                empieza a llegar con el próximo build (los
                                usuarios nuevos reportan cada pantalla que ven).
                            </p>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    )
}

function GrowthABPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [pwLegacy, setPwLegacy] = useState<boolean | null>(null)
    const [onbLegacy, setOnbLegacy] = useState<boolean | null>(null)
    const [originLegacy, setOriginLegacy] = useState<boolean | null>(null)
    const [espejoCtxOff, setEspejoCtxOff] = useState<boolean | null>(null)
    const [espejoMemOff, setEspejoMemOff] = useState<boolean | null>(null)
    const [vozSwap, setVozSwap] = useState<boolean | null>(null)
    const [vozPlana, setVozPlana] = useState<boolean | null>(null)
    const [saving, setSaving] = useState<string | null>(null)
    useEffect(() => {
        let cancel = false
        ;(async () => {
            try {
                const [pw, onb, origin, ctxOff, memOff, vSwap, vPlana] =
                    await Promise.all(
                        [
                            "growth_paywall_legacy",
                            "growth_onboarding_legacy",
                            "growth_onb_origin_legacy",
                            "espejo_contexto_off",
                            "espejo_memoria_off",
                            "espejo_voz_swap",
                            "espejo_voz_plana",
                        ].map((k) =>
                            rpc(url, apiKey, "get_app_flag", { p_key: k })
                        )
                    )
                if (!cancel) {
                    setPwLegacy(pw === true)
                    setOnbLegacy(onb === true)
                    setOriginLegacy(origin === true)
                    setEspejoCtxOff(ctxOff === true)
                    setEspejoMemOff(memOff === true)
                    setVozSwap(vSwap === true)
                    setVozPlana(vPlana === true)
                }
            } catch {
                if (!cancel) {
                    setPwLegacy(false)
                    setOnbLegacy(false)
                    setOriginLegacy(false)
                    setEspejoCtxOff(false)
                    setEspejoMemOff(false)
                    setVozSwap(false)
                    setVozPlana(false)
                }
            }
        })()
        return () => {
            cancel = true
        }
    }, [url, apiKey])
    const pick = async (
        key: string,
        useLegacy: boolean,
        setter: (v: boolean) => void
    ) => {
        setSaving(key)
        try {
            const r = await adminAction(url, apiKey, "admin_set_app_flag", {
                p_key: key,
                p_value: useLegacy,
            })
            if (r !== null && r !== undefined) setter(useLegacy)
        } catch {}
        setSaving(null)
    }
    return (
        <div
            style={{
                margin: "0 0 26px",
                padding: 18,
                borderRadius: 16,
                background: "rgba(8,14,30,0.6)",
                border: "1px solid rgba(125,239,255,0.18)",
            }}
        >
            <p
                style={{
                    margin: "0 0 4px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                }}
            >
                ⚗️ Pruebas A/B del Escáner
            </p>
            <p
                style={{
                    margin: "0 0 16px",
                    fontSize: 11,
                    lineHeight: 1.45,
                    color: "rgba(180,205,235,0.6)",
                }}
            >
                Elige qué versión ve el Tripulante. El cambio aplica en la
                próxima apertura de la app (no requiere volver a publicar).
            </p>
            <ABRow
                titulo="Onboarding (primer arranque)"
                v2Name="B · Quiz de conversión"
                v2Desc="12 pantallas: problema, quiz, resultado, transformación → paywall."
                v1Name="A · Tour El Reflector"
                v1Desc="Génesis cinematográfico + recorrido de las 5 salas."
                legacy={onbLegacy}
                busy={saving === "growth_onboarding_legacy"}
                onPick={(u) =>
                    pick("growth_onboarding_legacy", u, setOnbLegacy)
                }
            />
            <ABRow
                titulo="Onboarding · Portal de origen (ramas)"
                v2Name="B · Ramificado"
                v2Desc="Abre con '¿Qué te trajo aquí?': comida, realidad, sueños, Espejo, Códices o energía, cada puerta con su demo. La rama se mide en el embudo."
                v1Name="A · Lineal"
                v1Desc="Sin portal: hook de energía directo (flujo previo al 2026-07-15)."
                legacy={originLegacy}
                busy={saving === "growth_onb_origin_legacy"}
                onPick={(u) =>
                    pick("growth_onb_origin_legacy", u, setOriginLegacy)
                }
            />
            <ABRow
                titulo="Paywall (muro de pago)"
                v2Name="B · Alta conversión"
                v2Desc="Título de impacto + resultados + precios + CTA anclado."
                v1Name="A · Campo de Estrellas"
                v1Desc="Muro inmersivo con cielos reales y beneficios inline."
                legacy={pwLegacy}
                busy={saving === "growth_paywall_legacy"}
                onPick={(u) => pick("growth_paywall_legacy", u, setPwLegacy)}
            />
            <ABRow
                titulo="Espejo Vibracional · Contexto vivo"
                v2Name="B · Con contexto"
                v2Desc="El Espejo lee el campo del Tripulante al responder: pilares, rachas, Sendero, Plan de Vuelo y Realidad Elegida (sueños solo con su interruptor propio). Efímero: se arma por mensaje y no se guarda en ningún lado."
                v1Name="A · Sin contexto"
                v1Desc="El Espejo previo: solo la conversación y su conocimiento. Apagado de emergencia: al elegirlo, el servidor ni siquiera consulta la ficha."
                legacy={espejoCtxOff}
                busy={saving === "espejo_contexto_off"}
                onPick={(u) => pick("espejo_contexto_off", u, setEspejoCtxOff)}
            />
            <ABRow
                titulo="Espejo Vibracional · Memoria"
                v2Name="B · Con memoria"
                v2Desc="El Espejo aprende de cada Tripulante: al cerrar una charla, un destilador reescribe su ficha de largo plazo (temas recurrentes, compromisos, lo que le funciona) y la recibe al responder. El Tripulante la ve, la borra o la apaga desde Ajustes."
                v1Name="A · Sin memoria"
                v1Desc="Memoria congelada: el destilador no corre y el Espejo no recibe ficha de largo plazo (el contexto vivo sigue aparte). Apagado de emergencia del aprendizaje."
                legacy={espejoMemOff}
                busy={saving === "espejo_memoria_off"}
                onPick={(u) => pick("espejo_memoria_off", u, setEspejoMemOff)}
            />
            <ABRow
                titulo="Espejo Vibracional · Voz"
                v2Name="Goku al frente"
                v2Desc="La voz de Mario Castañeda es la principal; la alterna queda de respaldo si la primera falla."
                v1Name="Alterna al frente"
                v1Desc="Se invierten: la segunda voz pasa a principal y Goku queda de respaldo. Sirve para comparar las dos con el oído sin tocar nada más."
                legacy={vozSwap}
                busy={saving === "espejo_voz_swap"}
                onPick={(u) => pick("espejo_voz_swap", u, setVozSwap)}
            />
            <ABRow
                titulo="Espejo Vibracional · Matiz de la voz"
                v2Name="Con actuación"
                v2Desc="La voz recibe direcciones de interpretación (registro base + acentos en los remates y en lo que lleva emoción). El Tripulante nunca las ve: se arman al vuelo, solo para el audio."
                v1Name="Plana"
                v1Desc="Lectura neutra, sin direcciones, exactamente como sonaba antes. Apagado de emergencia: si en el teléfono se oyera una dirección leída en voz alta, esto lo corta al instante."
                legacy={vozPlana}
                busy={saving === "espejo_voz_plana"}
                onPick={(u) => pick("espejo_voz_plana", u, setVozPlana)}
            />
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   CORREOS — padrón de correos del ecosistema para avisos masivos
   (lanzamiento de Android, novedades). Une en una sola lista SOLO
   fuentes contactables, repartidas en TRES listas seleccionables:
     · ANDROID  → la lista de espera (landing "quiero el Escáner en
                  Android").
     · ESCÁNER  → Nodo Central con source clerk_* / email_one_click:
                  creó cuenta en el ecosistema del Escáner y dio
                  consentimiento explícito.
     · RED SOLAR VIVA → Nodo Central con cualquier otro source (el
                  formulario de la portada, alta manual, importación)
                  MÁS los pases de Cámara Solar.
   Un correo puede estar en VARIAS listas: aparece en cada filtro y
   lleva un chip por cada una. Las CUENTAS de la app (profiles) NO
   participan (tener cuenta no es opt-in a correos; ahí viven las
   cuentas de prueba *+clerk_test@example.com) y el cliente filtra
   por defensa cualquier @example.com / clerk_test. Excluye las
   cuentas internas y a quien pidió no recibir correos. Selector de
   lista + buscador + copiar al portapapeles + descargar CSV +
   sellar "ya se les avisó". Requiere migración
   20260804_correos_tres_listas (2026-08-04) + admin-action v1.39.
   ═══════════════════════════════════════════════════════════════════ */

const ORIGEN_LABEL: Record<string, { label: string; color: string }> = {
    android: { label: "Android", color: "#3DDC84" },
    escaner: { label: "Escáner Vibracional", color: "#7FE7FF" },
    rsv: { label: "Red Solar Viva", color: "#D4A843" },
    /* Retrocompatibilidad: etiquetas de la RPC previa (pre-20260804),
       por si respondiera la versión vieja mientras se pega la migración. */
    nodo: { label: "Newsletter", color: "#B59CFF" },
    camara: { label: "Cámara Solar", color: "#D4A843" },
}

type ListaCorreos = "todos" | "android" | "escaner" | "rsv"

const LISTAS_CORREOS: { id: ListaCorreos; label: string; color: string }[] = [
    { id: "todos", label: "Todos", color: "#00C2FF" },
    { id: "android", label: "Android", color: "#3DDC84" },
    { id: "escaner", label: "Escáner Vibracional", color: "#7FE7FF" },
    { id: "rsv", label: "Red Solar Viva", color: "#D4A843" },
]

/* Los chips de una fila: uno por cada lista a la que pertenece. Si la
   RPC vieja respondiera (sin en_escaner/en_rsv), cae a su etiqueta única. */
function chipsDeCorreo(r: any): { label: string; color: string }[] {
    const out: { label: string; color: string }[] = []
    if (r?.en_android) out.push(ORIGEN_LABEL.android)
    if (r?.en_escaner) out.push(ORIGEN_LABEL.escaner)
    if (r?.en_rsv) out.push(ORIGEN_LABEL.rsv)
    if (!out.length) {
        out.push(
            ORIGEN_LABEL[r?.origen] || {
                label: String(r?.origen || "Sin lista"),
                color: "#8899AA",
            }
        )
    }
    return out
}

/* Defensa en el cliente: cuentas de la app y correos de prueba FUERA aunque
   la RPC vieja (pre-20260720b) siga respondiendo con ellos. */
function esCorreoContactable(r: any): boolean {
    const em = String(r?.email || "").toLowerCase()
    if (!em) return false
    if (r?.origen === "app") return false
    if (em.endsWith("@example.com")) return false
    if (em.includes("clerk_test")) return false
    return true
}

function CorreosPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [rows, setRows] = useState<any[]>([])
    const [stats, setStats] = useState<{
        total: number
        android: number
        escaner: number
        rsv: number
    }>({ total: 0, android: 0, escaner: 0, rsv: 0 })
    const [lista, setLista] = useState<ListaCorreos>("todos")
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [notice, setNotice] = useState("")
    const [q, setQ] = useState("")
    const [confirmMark, setConfirmMark] = useState(false)

    const load = useCallback(
        async (l: ListaCorreos, force = false) => {
            setLoading(true)
            setErr("")
            const res = await adminActionCached(
                url,
                apiKey,
                "admin_get_subscribers",
                { p_lista: l },
                { force }
            )
            setLoading(false)
            if (res && Array.isArray(res.rows)) {
                const clean = res.rows.filter(esCorreoContactable)
                setRows(clean)
                /* Contadores recalculados de las filas VISIBLES: así los
                   números siempre cuadran con la lista que se está viendo. */
                setStats({
                    total: clean.length,
                    android: clean.filter((r: any) => r.en_android).length,
                    escaner: clean.filter((r: any) => r.en_escaner).length,
                    rsv: clean.filter((r: any) => r.en_rsv).length,
                })
            } else {
                setRows([])
                setErr(
                    "No se pudo leer el padrón. Verifica: migración 20260804_correos_tres_listas pegada en SQL Editor + supabase functions deploy admin-action --no-verify-jwt (v1.39)."
                )
            }
        },
        [url, apiKey]
    )

    useEffect(() => {
        load(lista)
    }, [load, lista])

    const flash = (msg: string) => {
        setNotice(msg)
        window.setTimeout(() => setNotice(""), 4200)
    }

    const filtered = q.trim()
        ? rows.filter((r) =>
              String(r.email || "")
                  .toLowerCase()
                  .includes(q.trim().toLowerCase())
          )
        : rows

    const copiar = async () => {
        const txt = filtered.map((r) => r.email).join(", ")
        try {
            await navigator.clipboard.writeText(txt)
            flash(`${filtered.length} correos copiados.`)
        } catch {
            try {
                const ta = document.createElement("textarea")
                ta.value = txt
                document.body.appendChild(ta)
                ta.select()
                document.execCommand("copy")
                document.body.removeChild(ta)
                flash(`${filtered.length} correos copiados.`)
            } catch {
                flash("No se pudo copiar.")
            }
        }
    }

    const descargarCsv = () => {
        /* Una columna por lista (sí/no): el CSV es coma-separado, así que
           no se meten varias etiquetas en un mismo campo. */
        const head = "correo,android,escaner,red_solar_viva,fecha,avisado\n"
        const si = (v: any) => (v ? "si" : "no")
        const body = filtered
            .map((r) =>
                [
                    r.email,
                    si(r.en_android),
                    si(r.en_escaner),
                    si(r.en_rsv),
                    String(r.fecha || "").slice(0, 10),
                    r.avisado ? String(r.avisado).slice(0, 10) : "",
                ].join(",")
            )
            .join("\n")
        const blob = new Blob([head + body], {
            type: "text/csv;charset=utf-8",
        })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download =
            lista === "android"
                ? "correos-android.csv"
                : lista === "escaner"
                  ? "correos-escaner-vibracional.csv"
                  : lista === "rsv"
                    ? "correos-red-solar-viva.csv"
                    : "correos-todos.csv"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.setTimeout(() => URL.revokeObjectURL(a.href), 2000)
        flash(`CSV descargado (${filtered.length} correos).`)
    }

    const marcarAvisados = async () => {
        setConfirmMark(false)
        const res = await adminAction(
            url,
            apiKey,
            "admin_mark_android_notified",
            {}
        )
        if (res && res.success) {
            flash(`${res.marcados || 0} correos marcados como avisados.`)
            /* Marcar cambia las CUATRO listas, no solo la visible. */
            motorCacheClear("admin_get_subscribers")
            void load(lista, true)
        } else {
            flash("No se pudo marcar.")
        }
    }

    const stat = (n: number, label: string, color: string) => (
        <div
            style={{
                flex: 1,
                minWidth: 120,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${color}33`,
                background: `${color}0D`,
            }}
        >
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{n}</div>
            <div
                style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 2,
                }}
            >
                {label}
            </div>
        </div>
    )

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#00C2FF",
                    }}
                >
                    ✉️ Correos
                </h2>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    Padrón para avisos masivos
                </span>
            </div>

            {notice && (
                <div
                    style={{
                        marginBottom: 14,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,194,255,0.4)",
                        background: "rgba(0,194,255,0.08)",
                        color: "#CDEEFF",
                        fontSize: 13,
                    }}
                >
                    {notice}
                </div>
            )}
            {err && (
                <div
                    style={{
                        marginBottom: 14,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,90,90,0.5)",
                        background: "rgba(120,20,20,0.25)",
                        color: "#FFC9C9",
                        fontSize: 13,
                    }}
                >
                    {err}
                </div>
            )}

            {/* Contadores */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 18,
                }}
            >
                {stat(stats.total, "correos únicos", "#00C2FF")}
                {stat(stats.android, "esperan Android", "#3DDC84")}
                {stat(stats.escaner, "Escáner Vibracional", "#7FE7FF")}
                {stat(stats.rsv, "Red Solar Viva", "#D4A843")}
            </div>

            {/* Selector de lista */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 14,
                }}
            >
                <span
                    style={{
                        fontSize: 10.5,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        marginRight: 2,
                    }}
                >
                    Lista
                </span>
                {LISTAS_CORREOS.map((L) => {
                    const on = lista === L.id
                    return (
                        <button
                            key={L.id}
                            type="button"
                            onClick={() => setLista(L.id)}
                            aria-pressed={on}
                            style={{
                                padding: "6px 13px",
                                borderRadius: 999,
                                border: `1px solid ${
                                    on
                                        ? `${L.color}8C`
                                        : "rgba(255,255,255,0.16)"
                                }`,
                                background: on ? `${L.color}1F` : "transparent",
                                color: on ? L.color : "rgba(255,255,255,0.45)",
                                fontSize: 10.5,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            {L.label}
                        </button>
                    )
                })}
                {/* Actualizar SOLO el padrón: pide datos frescos de esta
                    pestaña (force salta su memoria) sin recargar la página
                    ni tocar lo que las demás ya cargaron. */}
                <button
                    type="button"
                    onClick={() => load(lista, true)}
                    disabled={loading}
                    title="Traer el padrón fresco"
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 13px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,194,255,0.35)",
                        background: "rgba(0,194,255,0.08)",
                        color: "#7FE7FF",
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: loading ? "default" : "pointer",
                        opacity: loading ? 0.55 : 1,
                    }}
                >
                    <span
                        style={{
                            display: "inline-block",
                            animation: loading
                                ? "mi-spin 0.9s linear infinite"
                                : "none",
                        }}
                    >
                        ⟳
                    </span>
                    {loading ? "Actualizando…" : "Actualizar"}
                </button>
            </div>

            {/* Controles */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar correo…"
                    style={{
                        flex: 1,
                        minWidth: 180,
                        padding: "10px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#EAF6FF",
                        fontSize: 13,
                        outline: "none",
                    }}
                />

                <button
                    type="button"
                    onClick={copiar}
                    disabled={!filtered.length}
                    style={{
                        padding: "10px 15px",
                        borderRadius: 9,
                        border: "1px solid rgba(0,194,255,0.45)",
                        background: "rgba(0,194,255,0.1)",
                        color: "#CDEEFF",
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    Copiar correos
                </button>
                <button
                    type="button"
                    onClick={descargarCsv}
                    disabled={!filtered.length}
                    style={{
                        padding: "10px 15px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "transparent",
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    Descargar CSV
                </button>
                {/* Sellar "ya se les avisó" solo tiene sentido con la lista
                    de Android a la vista: la RPC marca TODA esa waitlist. */}
                {lista === "android" &&
                    (confirmMark ? (
                        <>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "#FFE9A8",
                                    alignSelf: "center",
                                }}
                            >
                                ¿Marcar toda la lista como avisada?
                            </span>
                            <button
                                type="button"
                                onClick={marcarAvisados}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: 9,
                                    border: "none",
                                    background: "#3DDC84",
                                    color: "#04240F",
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                Sí, marcar
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmMark(false)}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 9,
                                    border: "1px solid rgba(255,255,255,0.22)",
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmMark(true)}
                            style={{
                                padding: "10px 15px",
                                borderRadius: 9,
                                border: "1px solid rgba(61,220,132,0.45)",
                                background: "transparent",
                                color: "#9BF3C4",
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            Marcar como avisados
                        </button>
                    ))}
            </div>

            {/* Lista */}
            {loading ? (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    Leyendo el padrón…
                </div>
            ) : !filtered.length ? (
                <div
                    style={{
                        padding: "26px 18px",
                        borderRadius: 10,
                        border: "1px dashed rgba(255,255,255,0.18)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 13,
                        textAlign: "center",
                    }}
                >
                    {lista === "android"
                        ? "Todavía nadie se ha apuntado a la lista de Android."
                        : lista === "escaner"
                          ? "Sin correos del Escáner Vibracional todavía."
                          : lista === "rsv"
                            ? "Sin correos de Red Solar Viva todavía."
                            : "Sin correos que mostrar."}
                </div>
            ) : (
                <div
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
                    {filtered.map((r, i) => {
                        /* Un chip por cada lista: si el correo está en dos,
                           se pintan los dos. */
                        const chips = chipsDeCorreo(r)
                        return (
                            <div
                                key={r.email}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    padding: "10px 14px",
                                    background:
                                        i % 2
                                            ? "rgba(255,255,255,0.02)"
                                            : "transparent",
                                    borderTop: i
                                        ? "1px solid rgba(255,255,255,0.06)"
                                        : "none",
                                }}
                            >
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 200,
                                        fontSize: 13.5,
                                        color: "#EAF6FF",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {r.email}
                                </span>
                                <span
                                    style={{
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                        flexShrink: 0,
                                    }}
                                >
                                    {chips.map((c) => (
                                        <span
                                            key={c.label}
                                            style={{
                                                fontSize: 10.5,
                                                letterSpacing: "0.08em",
                                                padding: "3px 9px",
                                                borderRadius: 6,
                                                border: `1px solid ${c.color}55`,
                                                color: c.color,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {c.label}
                                        </span>
                                    ))}
                                </span>
                                {r.avisado && (
                                    <span
                                        style={{
                                            fontSize: 10.5,
                                            letterSpacing: "0.08em",
                                            padding: "3px 9px",
                                            borderRadius: 6,
                                            border: "1px solid rgba(160,180,200,0.35)",
                                            color: "rgba(190,205,220,0.8)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        AVISADO
                                    </span>
                                )}
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        color: "rgba(255,255,255,0.4)",
                                        flexShrink: 0,
                                        minWidth: 82,
                                        textAlign: "right",
                                    }}
                                >
                                    {String(r.fecha || "").slice(0, 10)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   CROP CIRCLES — panel del Decodificador de Crop Circles (registro
   planetario). Alta/edición de cada crop circle (título, sitio con
   selector de lugares frecuentes, coordenadas, fecha, arquetipo del
   patrón, decodificación ES/EN, imagen a R2 vía upload-crop-circle) +
   publicar y NOTIFICAR (push broadcast a todos los nodos, respetando
   las preferencias de notificación; confirmación en dos pasos).
   Requiere migración 20260719_crop_circles + admin-action v1.38.
   ═══════════════════════════════════════════════════════════════════ */

const CROP_GREEN = "#3CFF9E"

const CROP_SITES: {
    label: string
    location: string
    country: string
    lat: number
    lng: number
}[] = [
    {
        label: "Avebury, Wiltshire (RU)",
        location: "Avebury, Wiltshire",
        country: "Reino Unido",
        lat: 51.4284,
        lng: -1.8542,
    },
    {
        label: "Silbury Hill, Wiltshire (RU)",
        location: "Silbury Hill, Wiltshire",
        country: "Reino Unido",
        lat: 51.4157,
        lng: -1.8574,
    },
    {
        label: "Milk Hill / Alton Barnes (RU)",
        location: "Milk Hill, Wiltshire",
        country: "Reino Unido",
        lat: 51.3722,
        lng: -1.8531,
    },
    {
        label: "Stonehenge, Wiltshire (RU)",
        location: "Stonehenge, Wiltshire",
        country: "Reino Unido",
        lat: 51.1789,
        lng: -1.8262,
    },
    {
        label: "Barbury Castle, Wiltshire (RU)",
        location: "Barbury Castle, Wiltshire",
        country: "Reino Unido",
        lat: 51.488,
        lng: -1.7712,
    },
    {
        label: "Hackpen Hill, Wiltshire (RU)",
        location: "Hackpen Hill, Wiltshire",
        country: "Reino Unido",
        lat: 51.4704,
        lng: -1.8296,
    },
    {
        label: "West Kennett, Wiltshire (RU)",
        location: "West Kennett, Wiltshire",
        country: "Reino Unido",
        lat: 51.4088,
        lng: -1.8461,
    },
    {
        label: "Chilbolton, Hampshire (RU)",
        location: "Chilbolton, Hampshire",
        country: "Reino Unido",
        lat: 51.1449,
        lng: -1.437,
    },
]

const CROP_KINDS: { key: string; label: string }[] = [
    { key: "mandala", label: "Mandala" },
    { key: "spiral", label: "Espiral" },
    { key: "grid", label: "Código / Retícula" },
    { key: "orbits", label: "Órbitas" },
    { key: "web", label: "Red hexagonal" },
    { key: "tri", label: "Trinidad" },
]

const CROP_EMPTY_FORM = {
    id: "",
    title: "",
    location_name: "",
    country: "",
    lat: "",
    lng: "",
    event_date: "",
    pattern_kind: "mandala",
    decoded_es: "",
    decoded_en: "",
    image_url: "",
    preview_crop: null as null | { x: number; y: number; w: number; h: number },
}

function cropResizeToBase64(
    file: File,
    maxSide = 1600
): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("read_failed"))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () => reject(new Error("img_failed"))
            img.onload = () => {
                let w = img.width
                let h = img.height
                const m = Math.max(w, h)
                if (m > maxSide) {
                    w = Math.round((w * maxSide) / m)
                    h = Math.round((h * maxSide) / m)
                }
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) return reject(new Error("canvas_failed"))
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
                resolve({
                    base64: dataUrl.split(",")[1] || "",
                    mime: "image/jpeg",
                })
            }
            img.src = String(reader.result || "")
        }
        reader.readAsDataURL(file)
    })
}

/* Mini-preview del recorte (mismo mapeo que la app: recuadro cuadrado → sin
   distorsión). Con crop pinta ese rect; sin crop, recorte central por defecto. */
function CropThumb({
    url,
    crop,
    width,
}: {
    url: string
    crop?: any
    width: number
}) {
    const hasCrop =
        crop &&
        Number.isFinite(crop.w) &&
        Number.isFinite(crop.h) &&
        crop.w > 0 &&
        crop.h > 0
    // Aspecto (ancho/alto). Cuadrado (ar=1) → caja cuadrada; horizontal (ar>1)
    // → caja más baja, mismo ANCHO (los nombres de la lista no se desplazan).
    const ar = hasCrop && Number.isFinite(crop.ar) && crop.ar > 0 ? crop.ar : 1
    const height = Math.max(1, Math.round(width / ar))
    return (
        <div
            style={{
                position: "relative",
                width,
                height,
                overflow: "hidden",
                borderRadius: 8,
                border: "1px solid rgba(60,255,158,0.3)",
                background: "rgba(3,16,9,0.7)",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            {hasCrop ? (
                <img
                    src={url}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                        position: "absolute",
                        width: `${100 / crop.w}%`,
                        height: `${100 / crop.h}%`,
                        left: `${(-100 * crop.x) / crop.w}%`,
                        top: `${(-100 * crop.y) / crop.h}%`,
                        maxWidth: "none",
                        display: "block",
                    }}
                />
            ) : (
                <img
                    src={url}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        transform: "scale(1.5)",
                        maxWidth: "none",
                        display: "block",
                    }}
                />
            )}
        </div>
    )
}

/* Ver la foto guardada EN GRANDE (Zak): tap en la miniatura → overlay a pantalla
   completa (portal a body para no quedar atrapado por transforms del panel). */
function CropLightbox({ url, onClose }: { url: string; onClose: () => void }) {
    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                background: "rgba(2,8,5,0.93)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                cursor: "zoom-out",
            }}
        >
            <img
                src={url}
                alt=""
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "96vw",
                    maxHeight: "92vh",
                    objectFit: "contain",
                    borderRadius: 10,
                    border: "1px solid rgba(60,255,158,0.4)",
                    boxShadow: "0 0 44px rgba(60,255,158,0.22)",
                    cursor: "default",
                }}
            />
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                    position: "fixed",
                    top: 18,
                    right: 20,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: "1px solid rgba(60,255,158,0.4)",
                    background: "rgba(6,24,15,0.85)",
                    color: "#C9FFE2",
                    fontSize: 18,
                    cursor: "pointer",
                }}
            >
                ✕
            </button>
        </div>,
        document.body
    )
}

/* Selector del ENCUADRE del mini-preview: recuadro arrastrable + redimensionable
   sobre la MISMA foto → recorte normalizado {x,y,w,h,ar}. Modo CUADRADO
   (formaciones redondas, formato de siempre) o LIBRE (formación horizontal: el
   recuadro puede ser más ancho que alto → la mini-preview de la lista sale
   rectangular, MISMO ancho, menos alto, así los nombres no se desplazan). No
   re-sube imagen; solo guarda las coordenadas. */
function CropFramer({
    url,
    value,
    onChange,
}: {
    url: string
    value: any
    onChange: (c: any) => void
}) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [disp, setDisp] = useState<{ w: number; h: number } | null>(null)
    // Modo inicial: si el recorte guardado es claramente no cuadrado → Libre.
    const [squareMode, setSquareMode] = useState(() => {
        const ar = value?.ar
        return !(Number.isFinite(ar) && Math.abs(ar - 1) > 0.02)
    })
    const dragRef = useRef<any>(null)

    const measure = useCallback(() => {
        const el = wrapRef.current
        if (!el) return
        const img = el.querySelector("img") as HTMLImageElement | null
        if (!img || !img.naturalWidth) return
        const w = el.clientWidth
        const h = Math.round((w * img.naturalHeight) / img.naturalWidth)
        setDisp({ w, h })
    }, [])

    useEffect(() => {
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [measure])

    const clamp = (min: number, v: number, max: number) =>
        Math.max(min, Math.min(v, max))

    const crop =
        value && Number.isFinite(value.w) && value.w > 0
            ? value
            : disp
              ? (() => {
                    const sidePx = Math.min(disp.w, disp.h) * 0.62
                    const w = sidePx / disp.w
                    const h = sidePx / disp.h
                    return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
                })()
              : { x: 0.19, y: 0.19, w: 0.62, h: 0.62 }

    const box = disp
        ? {
              left: crop.x * disp.w,
              top: crop.y * disp.h,
              w: crop.w * disp.w,
              h: crop.h * disp.h,
          }
        : null

    const emit = (leftPx: number, topPx: number, wPx: number, hPx: number) => {
        if (!disp) return
        onChange({
            x: +(leftPx / disp.w).toFixed(4),
            y: +(topPx / disp.h).toFixed(4),
            w: +(wPx / disp.w).toFixed(4),
            h: +(hPx / disp.h).toFixed(4),
            ar: +(wPx / Math.max(1, hPx)).toFixed(4),
        })
    }

    const onDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
        if (!disp || !box) return
        e.preventDefault()
        e.stopPropagation()
        const start = {
            x: e.clientX,
            y: e.clientY,
            left: box.left,
            top: box.top,
            w: box.w,
            h: box.h,
        }
        dragRef.current = start
        const move = (ev: PointerEvent) => {
            if (!disp) return
            const dx = ev.clientX - start.x
            const dy = ev.clientY - start.y
            if (mode === "move") {
                const left = clamp(0, start.left + dx, disp.w - start.w)
                const top = clamp(0, start.top + dy, disp.h - start.h)
                emit(left, top, start.w, start.h)
            } else if (squareMode) {
                const maxSide = Math.min(
                    disp.w - start.left,
                    disp.h - start.top
                )
                const side = clamp(30, start.w + Math.max(dx, dy), maxSide)
                emit(start.left, start.top, side, side)
            } else {
                const w = clamp(30, start.w + dx, disp.w - start.left)
                const h = clamp(30, start.h + dy, disp.h - start.top)
                emit(start.left, start.top, w, h)
            }
        }
        const up = () => {
            dragRef.current = null
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
    }

    // Al volver a Cuadrado, iguala los lados (toma el menor) dentro de la foto.
    const setMode = (sq: boolean) => {
        setSquareMode(sq)
        if (sq && disp && box) {
            const maxSide = Math.min(disp.w - box.left, disp.h - box.top)
            const side = clamp(30, Math.min(box.w, box.h), maxSide)
            emit(box.left, box.top, side, side)
        }
    }

    const modeBtn = (sq: boolean, label: string) => (
        <button
            type="button"
            onClick={() => setMode(sq)}
            style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${squareMode === sq ? "rgba(60,255,158,0.7)" : "rgba(60,255,158,0.25)"}`,
                background:
                    squareMode === sq ? "rgba(60,255,158,0.14)" : "transparent",
                color: squareMode === sq ? "#EAFFF3" : "rgba(140,255,201,0.6)",
                fontSize: 11.5,
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    )

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {modeBtn(true, "◻ Cuadrado")}
                {modeBtn(false, "▭ Libre")}
                <span
                    style={{ fontSize: 10.5, color: "rgba(140,255,201,0.45)" }}
                >
                    {squareMode
                        ? "Recuadro cuadrado (formaciones redondas)."
                        : "Ancho y alto independientes (formación horizontal)."}
                </span>
            </div>
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                <div
                    ref={wrapRef}
                    style={{
                        position: "relative",
                        width: "min(340px, 100%)",
                        userSelect: "none",
                        touchAction: "none",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid rgba(60,255,158,0.25)",
                        lineHeight: 0,
                    }}
                >
                    <img
                        src={url}
                        alt="crop"
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onLoad={measure}
                        style={{
                            width: "100%",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                    {box && (
                        <div
                            onPointerDown={onDown("move")}
                            style={{
                                position: "absolute",
                                left: box.left,
                                top: box.top,
                                width: box.w,
                                height: box.h,
                                border: "2px solid rgba(60,255,158,0.95)",
                                boxShadow: "0 0 0 9999px rgba(2,8,5,0.5)",
                                boxSizing: "border-box",
                                cursor: "move",
                            }}
                        >
                            <div
                                onPointerDown={onDown("resize")}
                                style={{
                                    position: "absolute",
                                    right: -9,
                                    bottom: -9,
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    background: "rgba(60,255,158,0.95)",
                                    border: "2px solid #04180D",
                                    cursor: "nwse-resize",
                                }}
                            />
                        </div>
                    )}
                </div>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    <span
                        style={{
                            fontSize: 10.5,
                            color: "rgba(140,255,201,0.6)",
                        }}
                    >
                        Vista en la lista:
                    </span>
                    <CropThumb url={url} crop={value} width={64} />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 7,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.65)",
                                fontSize: 11,
                                cursor: "pointer",
                            }}
                        >
                            Quitar recorte
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function CropCirclesPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [notice, setNotice] = useState("")
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({ ...CROP_EMPTY_FORM })
    const [confirmDeleteId, setConfirmDeleteId] = useState("")
    const [confirmNotifyId, setConfirmNotifyId] = useState("")
    const [lightbox, setLightbox] = useState("")
    const fileRef = useRef<HTMLInputElement>(null)

    /* 🜂 Una vez por visita. Este panel NO es optimista: guardar, publicar,
       ocultar y borrar releen la lista entera, así que TODAS esas relecturas
       piden `load(true)`; con `load()` volverían a pintar el estado anterior. */
    const load = useCallback(
        async (force = false) => {
            setErr("")
            const res = await adminActionCached(
                url,
                apiKey,
                "admin_get_crop_circles",
                {},
                { force }
            )
            setLoading(false)
            if (Array.isArray(res)) setItems(res)
            else
                setErr(
                    "No se pudo leer el registro. Verifica: migración 20260719_crop_circles pegada + supabase functions deploy admin-action --no-verify-jwt (v1.38)."
                )
        },
        [url, apiKey]
    )

    useEffect(() => {
        void load()
    }, [load])

    const flash = (msg: string) => {
        setNotice(msg)
        window.setTimeout(() => setNotice(""), 5200)
    }

    const setF = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

    const onSite = (idx: number) => {
        const s = CROP_SITES[idx]
        if (!s) return
        setForm((p: any) => ({
            ...p,
            location_name: s.location,
            country: s.country,
            lat: String(s.lat),
            lng: String(s.lng),
        }))
    }

    const onPickFile = async (f: File | null) => {
        if (!f) return
        setUploading(true)
        try {
            const { base64, mime } = await cropResizeToBase64(f, 1600)
            const token = await (window as any).Clerk?.session?.getToken?.()
            const r = await fetch(`${url}/functions/v1/upload-crop-circle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: apiKey,
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    token,
                    image_base64: base64,
                    image_mime: mime,
                }),
            })
            const out = r.ok ? await r.json() : null
            if (out && out.success && out.image_url) {
                setF("image_url", out.image_url)
                flash("Imagen subida al campo.")
            } else {
                flash(
                    "La imagen no subió. ¿Está desplegado upload-crop-circle? (supabase functions deploy upload-crop-circle --no-verify-jwt)"
                )
            }
        } catch {
            flash("La imagen no pudo procesarse.")
        }
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ""
    }

    const save = async () => {
        const title = form.title.trim()
        if (!title) {
            flash("Falta el título del crop circle.")
            return
        }
        const lat = parseFloat(form.lat)
        const lng = parseFloat(form.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            flash(
                "Faltan coordenadas (elige un sitio frecuente o escribe lat/lng)."
            )
            return
        }
        setSaving(true)
        const params: any = {
            p_title: title,
            p_location_name: form.location_name.trim(),
            p_country: form.country.trim(),
            p_lat: lat,
            p_lng: lng,
            p_pattern_kind: form.pattern_kind,
            p_decoded_es: form.decoded_es,
            p_decoded_en: form.decoded_en,
        }
        if (form.event_date) params.p_event_date = form.event_date
        if (form.image_url) {
            params.p_image_url = form.image_url
            // Con foto: el recorte del mini-preview (objeto) o {} para limpiar a
            // recorte central por defecto. Sin foto no se envía (queda/insert NULL).
            params.p_preview_crop =
                form.preview_crop && Number.isFinite(form.preview_crop.w)
                    ? form.preview_crop
                    : {}
        }
        if (form.id) params.p_id = form.id
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_crop_circle",
            params
        )
        setSaving(false)
        if (res && res.success) {
            flash(
                form.id
                    ? "Registro actualizado."
                    : "Crop circle guardado como borrador."
            )
            setForm({ ...CROP_EMPTY_FORM })
            void load(true)
        } else {
            flash(
                "No se pudo guardar. Revisa migración + deploy de admin-action."
            )
        }
    }

    const publish = async (id: string, notify: boolean) => {
        const res = await adminAction(
            url,
            apiKey,
            "admin_publish_crop_circle",
            {
                p_id: id,
                p_notify: notify,
            }
        )
        setConfirmNotifyId("")
        if (res && res.success) {
            if (notify && res.already_notified)
                flash(
                    "Publicado. Este registro ya había sido notificado antes (no se re-envía)."
                )
            else if (notify)
                flash(`Publicado. Señal enviada a ${res.notified || 0} nodos.`)
            else flash("Publicado. Ya es visible en la app.")
            void load(true)
        } else {
            flash("No se pudo publicar.")
        }
    }

    const hide = async (id: string) => {
        const res = await adminAction(url, apiKey, "admin_upsert_crop_circle", {
            p_id: id,
            p_is_published: false,
        })
        if (res && res.success) {
            flash("Registro oculto (deja de verse en la app).")
            void load(true)
        }
    }

    const del = async (id: string) => {
        setConfirmDeleteId("")
        const res = await adminAction(url, apiKey, "admin_delete_crop_circle", {
            p_id: id,
        })
        if (res && res.success) {
            flash("Registro eliminado.")
            void load(true)
        }
    }

    const edit = (it: any) => {
        setForm({
            id: it.id,
            title: it.title || "",
            location_name: it.location_name || "",
            country: it.country || "",
            lat: String(it.lat ?? ""),
            lng: String(it.lng ?? ""),
            event_date: it.event_date || "",
            pattern_kind: it.pattern_kind || "mandala",
            decoded_es: it.decoded_es || "",
            decoded_en: it.decoded_en || "",
            image_url: it.image_url || "",
            preview_crop:
                it.preview_crop && Number.isFinite(it.preview_crop.w)
                    ? it.preview_crop
                    : null,
        })
        try {
            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch {
            /* noop */
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid rgba(60,255,158,0.25)`,
        background: "rgba(8,26,18,0.55)",
        color: "#EAFFF3",
        fontSize: 13,
        outline: "none",
    }
    const labStyle: React.CSSProperties = {
        fontSize: 10.5,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(140,255,201,0.6)",
        marginBottom: 6,
        display: "block",
    }
    const field = (lab: string, el: React.ReactNode) => (
        <div style={{ flex: 1, minWidth: 180 }}>
            <span style={labStyle}>{lab}</span>
            {el}
        </div>
    )

    return (
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 14,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: CROP_GREEN,
                    }}
                >
                    🛸 Crop Circles
                </h2>
                <span style={{ fontSize: 12, color: "rgba(140,255,201,0.55)" }}>
                    Registro planetario · {items.length} registros
                </span>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => void load(true)}
                    style={{
                        padding: "5px 11px",
                        borderRadius: 999,
                        border: `1px solid rgba(60,255,158,0.35)`,
                        background: "transparent",
                        color: "rgba(140,255,201,0.85)",
                        fontSize: 11,
                        cursor: "pointer",
                    }}
                >
                    ↻ Recargar
                </button>
            </div>

            {notice && (
                <div
                    style={{
                        marginBottom: 14,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid rgba(60,255,158,0.4)`,
                        background: "rgba(60,255,158,0.08)",
                        color: "#C9FFE2",
                        fontSize: 13,
                    }}
                >
                    {notice}
                </div>
            )}
            {err && (
                <div
                    style={{
                        marginBottom: 14,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,90,90,0.5)",
                        background: "rgba(120,20,20,0.25)",
                        color: "#FFC9C9",
                        fontSize: 13,
                    }}
                >
                    {err}
                </div>
            )}

            {/* ── Formulario ── */}
            <div
                style={{
                    padding: 18,
                    borderRadius: 12,
                    border: `1px solid rgba(60,255,158,0.28)`,
                    background:
                        "linear-gradient(170deg, rgba(10,40,26,0.5), rgba(4,14,9,0.6))",
                    marginBottom: 24,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        letterSpacing: "0.16em",
                        color: CROP_GREEN,
                        marginBottom: 14,
                    }}
                >
                    {form.id ? "◈ EDITANDO REGISTRO" : "◈ NUEVO CROP CIRCLE"}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    {field(
                        "Título",
                        <input
                            style={inputStyle}
                            value={form.title}
                            onChange={(e) => setF("title", e.target.value)}
                            placeholder="El Mandala de..."
                        />
                    )}
                    {field(
                        "Sitio frecuente (auto-llena)",
                        <select
                            style={{ ...inputStyle, appearance: "auto" } as any}
                            value=""
                            onChange={(e) => {
                                const idx = parseInt(e.target.value, 10)
                                if (Number.isFinite(idx)) onSite(idx)
                            }}
                        >
                            <option value="">Elegir sitio…</option>
                            {CROP_SITES.map((s, i) => (
                                <option key={s.label} value={i}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    {field(
                        "Ubicación",
                        <input
                            style={inputStyle}
                            value={form.location_name}
                            onChange={(e) =>
                                setF("location_name", e.target.value)
                            }
                            placeholder="Avebury, Wiltshire"
                        />
                    )}
                    {field(
                        "País",
                        <input
                            style={inputStyle}
                            value={form.country}
                            onChange={(e) => setF("country", e.target.value)}
                            placeholder="Reino Unido"
                        />
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    {field(
                        "Latitud",
                        <input
                            style={inputStyle}
                            value={form.lat}
                            onChange={(e) => setF("lat", e.target.value)}
                            placeholder="51.4284"
                            inputMode="decimal"
                        />
                    )}
                    {field(
                        "Longitud",
                        <input
                            style={inputStyle}
                            value={form.lng}
                            onChange={(e) => setF("lng", e.target.value)}
                            placeholder="-1.8542"
                            inputMode="decimal"
                        />
                    )}
                    {field(
                        "Fecha del evento",
                        <input
                            type="date"
                            style={inputStyle}
                            value={form.event_date}
                            onChange={(e) => setF("event_date", e.target.value)}
                        />
                    )}
                    {field(
                        "Arquetipo del patrón",
                        <select
                            style={{ ...inputStyle, appearance: "auto" } as any}
                            value={form.pattern_kind}
                            onChange={(e) =>
                                setF("pattern_kind", e.target.value)
                            }
                        >
                            {CROP_KINDS.map((k) => (
                                <option key={k.key} value={k.key}>
                                    {k.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div style={{ marginBottom: 12 }}>
                    <span style={labStyle}>Decodificación (español)</span>
                    <textarea
                        style={{
                            ...inputStyle,
                            minHeight: 96,
                            resize: "vertical",
                        }}
                        value={form.decoded_es}
                        onChange={(e) => setF("decoded_es", e.target.value)}
                        placeholder="Qué dice este patrón, en la voz del Escáner..."
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <span style={labStyle}>Decoding (inglés, opcional)</span>
                    <textarea
                        style={{
                            ...inputStyle,
                            minHeight: 64,
                            resize: "vertical",
                        }}
                        value={form.decoded_en}
                        onChange={(e) => setF("decoded_en", e.target.value)}
                        placeholder="Optional english reading..."
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: `1px dashed rgba(60,255,158,0.5)`,
                            background: "transparent",
                            color: "#C9FFE2",
                            fontSize: 12.5,
                            cursor: "pointer",
                        }}
                    >
                        {uploading
                            ? "Subiendo…"
                            : "▚ Subir imagen del crop circle"}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                            onPickFile(e.target.files?.[0] || null)
                        }
                    />
                    {form.image_url && (
                        <img
                            src={form.image_url}
                            alt="crop"
                            referrerPolicy="no-referrer"
                            title="Ver en grande"
                            onClick={() => setLightbox(form.image_url)}
                            style={{
                                height: 54,
                                borderRadius: 8,
                                border: `1px solid rgba(60,255,158,0.4)`,
                                cursor: "zoom-in",
                            }}
                        />
                    )}
                    <span
                        style={{
                            fontSize: 11,
                            color: "rgba(140,255,201,0.45)",
                        }}
                    >
                        Sin imagen, la app muestra la reconstrucción vectorial
                        del patrón.
                    </span>
                </div>
                {form.image_url && (
                    <div style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                fontSize: 11.5,
                                color: "rgba(140,255,201,0.75)",
                                marginBottom: 8,
                            }}
                        >
                            ◱ Encuadre del mini-preview: arrastra el recuadro y
                            ajusta su tamaño desde la esquina para elegir el
                            área del patrón. La ficha sigue mostrando la foto
                            entera.
                        </div>
                        <CropFramer
                            key={form.image_url}
                            url={form.image_url}
                            value={form.preview_crop}
                            onChange={(c) => setF("preview_crop", c)}
                        />
                    </div>
                )}
                {lightbox && (
                    <CropLightbox
                        url={lightbox}
                        onClose={() => setLightbox("")}
                    />
                )}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        style={{
                            padding: "11px 22px",
                            borderRadius: 8,
                            border: "none",
                            background: `linear-gradient(180deg, ${CROP_GREEN}, #1FBF72)`,
                            color: "#04180D",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                        }}
                    >
                        {saving
                            ? "Guardando…"
                            : form.id
                              ? "Guardar cambios"
                              : "Guardar borrador"}
                    </button>
                    {form.id && (
                        <button
                            type="button"
                            onClick={() => setForm({ ...CROP_EMPTY_FORM })}
                            style={{
                                padding: "11px 18px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.7)",
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>
            </div>

            {/* ── Lista ── */}
            {loading ? (
                <div style={{ color: "rgba(140,255,201,0.6)", fontSize: 13 }}>
                    Sintonizando el registro…
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {items.map((it) => {
                        const pub = !!it.is_published
                        const notified = !!it.notified_at
                        return (
                            <div
                                key={it.id}
                                style={{
                                    display: "flex",
                                    gap: 14,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    border: `1px solid rgba(60,255,158,${pub ? 0.35 : 0.16})`,
                                    background: "rgba(6,20,13,0.55)",
                                }}
                            >
                                {it.image_url ? (
                                    <div
                                        onClick={() =>
                                            setLightbox(it.image_url)
                                        }
                                        title="Ver en grande"
                                        style={{
                                            cursor: "zoom-in",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CropThumb
                                            url={it.image_url}
                                            crop={it.preview_crop}
                                            width={52}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 8,
                                            border: "1px solid rgba(60,255,158,0.3)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: CROP_GREEN,
                                            fontSize: 20,
                                        }}
                                    >
                                        ◈
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div
                                        style={{
                                            color: "#EAFFF3",
                                            fontSize: 14.5,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {it.title}
                                    </div>
                                    <div
                                        style={{
                                            color: "rgba(140,255,201,0.55)",
                                            fontSize: 11.5,
                                            marginTop: 2,
                                        }}
                                    >
                                        {it.location_name}
                                        {it.country
                                            ? ` · ${it.country}`
                                            : ""} · {it.event_date}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            marginTop: 6,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 10,
                                                letterSpacing: "0.1em",
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                border: `1px solid ${pub ? "rgba(60,255,158,0.55)" : "rgba(255,255,255,0.25)"}`,
                                                color: pub
                                                    ? CROP_GREEN
                                                    : "rgba(255,255,255,0.55)",
                                            }}
                                        >
                                            {pub ? "PUBLICADO" : "BORRADOR"}
                                        </span>
                                        {notified && (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    letterSpacing: "0.1em",
                                                    padding: "3px 8px",
                                                    borderRadius: 6,
                                                    border: "1px solid rgba(120,200,255,0.4)",
                                                    color: "rgba(150,215,255,0.85)",
                                                }}
                                            >
                                                NOTIFICADO{" "}
                                                {String(it.notified_at).slice(
                                                    0,
                                                    10
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {confirmNotifyId === it.id ? (
                                        <>
                                            <span
                                                style={{
                                                    fontSize: 11.5,
                                                    color: "#FFE9A8",
                                                    alignSelf: "center",
                                                }}
                                            >
                                                ¿Enviar push a TODOS los nodos?
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    publish(it.id, true)
                                                }
                                                style={{
                                                    padding: "8px 14px",
                                                    borderRadius: 7,
                                                    border: "none",
                                                    background: CROP_GREEN,
                                                    color: "#04180D",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Sí, notificar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmNotifyId("")
                                                }
                                                style={{
                                                    padding: "8px 12px",
                                                    borderRadius: 7,
                                                    border: "1px solid rgba(255,255,255,0.25)",
                                                    background: "transparent",
                                                    color: "rgba(255,255,255,0.7)",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : confirmDeleteId === it.id ? (
                                        <>
                                            <span
                                                style={{
                                                    fontSize: 11.5,
                                                    color: "#FFB4B4",
                                                    alignSelf: "center",
                                                }}
                                            >
                                                ¿Eliminar para siempre?
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => del(it.id)}
                                                style={{
                                                    padding: "8px 14px",
                                                    borderRadius: 7,
                                                    border: "none",
                                                    background: "#E5484D",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Sí, eliminar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmDeleteId("")
                                                }
                                                style={{
                                                    padding: "8px 12px",
                                                    borderRadius: 7,
                                                    border: "1px solid rgba(255,255,255,0.25)",
                                                    background: "transparent",
                                                    color: "rgba(255,255,255,0.7)",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => edit(it)}
                                                style={{
                                                    padding: "8px 13px",
                                                    borderRadius: 7,
                                                    border: "1px solid rgba(60,255,158,0.4)",
                                                    background: "transparent",
                                                    color: "#C9FFE2",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Editar
                                            </button>
                                            {!pub && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        publish(it.id, false)
                                                    }
                                                    style={{
                                                        padding: "8px 13px",
                                                        borderRadius: 7,
                                                        border: `1px solid ${CROP_GREEN}`,
                                                        background:
                                                            "rgba(60,255,158,0.12)",
                                                        color: CROP_GREEN,
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Publicar
                                                </button>
                                            )}
                                            {!notified && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConfirmNotifyId(
                                                            it.id
                                                        )
                                                    }
                                                    style={{
                                                        padding: "8px 13px",
                                                        borderRadius: 7,
                                                        border: "none",
                                                        background: `linear-gradient(180deg, ${CROP_GREEN}, #1FBF72)`,
                                                        color: "#04180D",
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {pub
                                                        ? "Notificar"
                                                        : "Publicar + Notificar"}
                                                </button>
                                            )}
                                            {pub && (
                                                <button
                                                    type="button"
                                                    onClick={() => hide(it.id)}
                                                    style={{
                                                        padding: "8px 13px",
                                                        borderRadius: 7,
                                                        border: "1px solid rgba(255,255,255,0.2)",
                                                        background:
                                                            "transparent",
                                                        color: "rgba(255,255,255,0.65)",
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Ocultar
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmDeleteId(it.id)
                                                }
                                                style={{
                                                    padding: "8px 13px",
                                                    borderRadius: 7,
                                                    border: "1px solid rgba(229,72,77,0.5)",
                                                    background: "transparent",
                                                    color: "#FF9B9B",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* HOME del Motor — tarjetas grandes de acceso a cada sección. Es el landing
   por default (antes caía en Nodos Activos, que dispara requests al entrar). */
/* ═══════════════════ Panel de IAs — mapa de modelos + costos ═══════════════════
   Referencia viva de TODAS las inteligencias artificiales del ecosistema: dónde
   vive cada una, qué modelo/versión corre y cuánto cuesta por 1M de tokens en
   MXN. Panel de solo lectura (los datos viven aquí, hardcoded — es una tabla de
   referencia, no configuración). Precios de LISTA (sin caché), tipo de cambio
   ~18 MXN/USD (spot ≈17.5, jul 2026). Actualizar a mano cuando cambien tarifas. */

const IA_C = {
    gem: "#7FB4F5",
    or: "#B59CFF",
    eleven: "#E8C65A",
    fal: "#FF7EB0",
    vision: "#5FD68A",
    apple: "#8CFFC9",
    deepgram: "#4CE0C8",
    fish: "#FF9E5A",
}

type IaUse = {
    feature: string
    sub: string
    where: string
    provider: keyof typeof IA_C
    providerName: string
    model: string
    cascade?: string
    cost: string
    /* 🜂 POR QUÉ ESTE MODELO Y NO OTRO. Cada elección de arriba se tomó por una
       razón concreta —velocidad, precio o calidad— y esa razón vivía dispersa
       en comentarios de edges y en la memoria de salas viejas: quien abría el
       panel veía el QUÉ y nunca el PORQUÉ. Se escribe el motivo REAL que aplicó
       en cada caso, verificado contra el código del edge; nunca uno genérico. */
    criterio?: string
    tipo: "texto" | "embed" | "imagen" | "ocr" | "voz" | "video" | "gratis"
}

/* Lo que toca el Tripulante en la app. */
const IA_APP: IaUse[] = [
    {
        feature: "Espejo Vibracional",
        sub: "Chat con la IA propia (sin candados)",
        where: "oraculo-chat",
        provider: "or",
        providerName: "OpenRouter",
        model: "deepseek/deepseek-v4-flash-0731 (DeepSeek V4-Flash, build oficial)",
        cost: "$0.09 entrada · $0.18 salida",
        criterio:
            "VELOCIDAD. Al mismo modelo lo sirven varios proveedores y se pide el MÁS RÁPIDO disponible (sort: throughput), no el más barato. El pensamiento va APAGADO a propósito: V4 es híbrido y razonar costaría segundos y movería la voz del Espejo.",
        tipo: "texto",
    },
    {
        feature: "Espejo Vibracional · LA VOZ",
        sub: "Lee el reflejo en voz alta (y sostiene la conversación)",
        where: "espejo-voz",
        provider: "fish",
        providerName: "Fish Audio",
        model: "s2.1-pro",
        cascade: "→ voz de respaldo (id alterno)",
        cost: "$15 / 1M bytes ≈ $0.0156 por 1.000 caracteres",
        criterio:
            "CALIDAD. La voz on-device de iOS sonaba robótica y no respetaba la puntuación; ElevenLabs costaba 5 a 10 veces lo mismo. El reflejo se parte en trozos de ~1.400 caracteres y cada parte deja pedida la siguiente, para que la primera empiece a sonar rápido.",
        tipo: "voz",
    },
    {
        feature: "Memoria del Espejo",
        sub: "RAG · busca el pasaje del corpus que responde",
        where: "oraculo-chat · oraculo-index",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-embedding-001 (768 dim)",
        cost: "$0.15 entrada · sin salida",
        tipo: "embed",
    },
    {
        feature: "El Espejo ve imágenes",
        sub: "Contempla la foto que subes al chat y la lee",
        where: "oraculo-chat",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-2.5-flash",
        cost: "≈ $1.50 entrada · $7.50 salida",
        tipo: "imagen",
    },
    {
        feature: "Decodificador de Alimentos · dictamen",
        sub: "Lee el texto de la etiqueta y emite el veredicto",
        where: "decode-matter",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3-flash-preview → gemini-2.5-flash",
        cost: "$1.50 entrada · $7.50 salida",
        criterio:
            "COSTO. Flash es barato y rápido a la vez, que es lo que pide un dictamen corto sobre un texto ya extraído. Se nombra el modelo EXACTO y no el alias rotativo, porque el alias apuntaba a uno crónicamente saturado; la cascada cubre la caída del primero.",
        tipo: "texto",
    },
    {
        feature: "Decodificador de Alimentos · leer etiqueta",
        sub: "OCR de la foto (saca el texto de la etiqueta)",
        where: "extract-text",
        provider: "vision",
        providerName: "Google Cloud Vision",
        model: "DOCUMENT_TEXT_DETECTION",
        cost: "$1.50 por cada 1.000 fotos",
        tipo: "ocr",
    },
    {
        feature: "Decodificador de Alimentos · nombre",
        sub: "Lee el nombre del producto del frente del empaque",
        where: "upload-matter-photo",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.5-flash-lite",
        cost: "$0.30 entrada · $2.50 salida (Flash-Lite)",
        tipo: "imagen",
    },
    {
        feature: "Decodificador de Sueños",
        sub: "Interpreta el sueño escrito",
        where: "decode-dream",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3-flash-preview → gemini-2.5-flash",
        cost: "$1.50 entrada · $7.50 salida",
        tipo: "texto",
    },
    {
        feature: "Notas de voz · en el iPhone",
        sub: "Dictado del Espejo / Sueños / Bitácora (offline)",
        where: "SpeechTranscribePlugin (iOS)",
        provider: "apple",
        providerName: "Apple · en el dispositivo",
        model: "SFSpeechRecognizer (on-device)",
        cost: "GRATIS · nada sale del teléfono",
        tipo: "gratis",
    },
    {
        feature: "Notas de voz · respaldo",
        sub: "Cuando no hay dictado nativo (web / sin permiso)",
        where: "transcribe-voice",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3-flash-preview → gemini-2.5-flash",
        cost: "$1.50 entrada · $7.50 salida",
        tipo: "voz",
    },
    /* 🜂 LAS DOS QUE FALTABAN. Ni el Reflejo ilustrado ni la navegación por voz
       aparecían en el panel, aunque las dos son cosas que el Tripulante toca a
       diario y las dos cuestan dinero. El Pase de Imágenes del Arquitecto ya
       tenía su tarjeta abajo sin que la IA madre estuviera listada arriba. */
    {
        feature: "Espejo · Reflejo ilustrado",
        sub: "La imagen que acompaña al reflejo, embonada en el texto",
        where: "espejo-imagen",
        provider: "fal",
        providerName: "fal.ai",
        model: "fal-ai/flux-2-pro",
        cost: "$0.03 por imagen · tope 2 al día por persona",
        criterio:
            "CALIDAD, contra el precio. Cuesta 10 veces más que Schnell y aun así se eligió: Schnell se veía caricatura queriendo ser realista. Acá la imagen es UNA por reflejo y acompaña a un texto íntimo, así que el acabado importa más que el volumen.",
        tipo: "imagen",
    },
    {
        feature: "Espejo · Matriz Sincrónica",
        sub: "Varias imágenes por envío, para explorar rápido",
        where: "espejo-imagen",
        provider: "fal",
        providerName: "fal.ai",
        model: "fal-ai/flux/schnell",
        cost: "≈ $0.003 por imagen · tope 30 al día",
        criterio:
            "VOLUMEN. La misma decisión al revés: acá se piden 2 o 3 imágenes por envío y lo que importa es ver muchas opciones pronto, así que la calidad cede ante el precio y la velocidad.",
        tipo: "imagen",
    },
    {
        feature: "Navegación y comandos por voz",
        sub: "Entiende la frase hablada y abre la capa o ejecuta la acción",
        where: "voz-intent",
        provider: "or",
        providerName: "Groq · respaldo OpenRouter",
        model: "llama-3.1-8b-instant (navegar) · llama-3.3-70b-versatile (actuar)",
        cascade:
            "→ sin GROQ_API_KEY: meta-llama/llama-3.1-8b-instruct · llama-3.3-70b-instruct",
        cost: "≈ $0.20 USD / 1.000 comandos de navegación · ≈ $2.39 los de acción",
        criterio:
            "VELOCIDAD. Groq primero porque es lo más rápido que hay para un modelo así, y sin su llave se cae a OpenRouter pidiendo también el proveedor más veloz. Una frase de seis palabras no necesita un modelo grande: el 8b navega. El 70b entra solo cuando hay que ACTUAR, donde equivocarse cuesta.",
        tipo: "texto",
    },
]

/* Frecuencias Sonoras (panel admin /frecuencias). */
const IA_FREQ: IaUse[] = [
    {
        feature: "Prompts para Suno · texto",
        sub: "Escribe los prompts y letras de las piezas",
        where: "generate-suno-prompt",
        provider: "or",
        providerName: "OpenRouter",
        model: "deepseek/deepseek-chat",
        cascade: "→ meta-llama/llama-3.3-70b-instruct",
        cost: "$0.20 entrada · $0.78 salida",
        tipo: "texto",
    },
    {
        feature: "Prompts para Suno · visión",
        sub: "Lee una imagen de referencia para el vibe",
        where: "generate-suno-prompt",
        provider: "or",
        providerName: "OpenRouter",
        model: "qwen/qwen-2.5-vl-72b-instruct",
        cascade: "→ meta-llama/llama-3.2-90b-vision-instruct",
        cost: "según proveedor de OpenRouter",
        tipo: "imagen",
    },
]

/* Atelier de Marketing (admin, redes). */
const IA_ATELIER: IaUse[] = [
    {
        feature: "Copy de posts · VTLI / Soma / banners",
        sub: "Texto de cada publicación de Instagram",
        where: "generate-vtli-posts · generate-soma-posts · generate-vtli-banners",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cost: "$1.50 entrada · $7.50 salida",
        tipo: "texto",
    },
    {
        feature: "Carruseles Zak'Haar",
        sub: "Láminas + descripción del carrusel",
        where: "generate-zakhaar-carousel",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3.5-flash → gemini-2.5-flash",
        cost: "≈ $1.50 entrada · $7.50 salida (según el alias)",
        tipo: "texto",
    },
    {
        feature: "Wallpapers · prompts",
        sub: "Prompts 4K para Nano Banana",
        where: "generate-wallpaper-prompt",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3.5-flash → gemini-2.5-flash",
        cost: "≈ $1.50 entrada · $7.50 salida",
        tipo: "texto",
    },
    {
        feature: "Destilar Códices de Luz",
        sub: "Extrae la esencia de un libro para carruseles/videos",
        where: "distill-codice",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-3.5-flash → gemini-2.5-flash",
        cost: "≈ $1.50 entrada · $7.50 salida",
        tipo: "texto",
    },
    {
        feature: "Storyboards + video · copy",
        sub: "Narración y guion de los Reels",
        where: "generate-vtli-storyboard · generate-vtli-video",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cost: "$1.50 entrada · $7.50 salida",
        tipo: "texto",
    },
    {
        feature: "Describir colectivos / ambientes",
        sub: "Visión: describe una imagen subida",
        where: "describe-vtli-colectivo",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.6-flash",
        cascade: "→ gemini-2.5-flash",
        cost: "$1.50 entrada · $7.50 salida",
        tipo: "imagen",
    },
    {
        feature: "Imágenes (Nano Banana 2)",
        sub: "Genera las imágenes de posts, banners y storyboards",
        where: "generate-vtli-posts · soma · banners · storyboard",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.1-flash-image-preview",
        cost: "≈ $0.067 por imagen 1080p (no por token)",
        tipo: "imagen",
    },
    {
        feature: "Video Zak'Haar (texto → video)",
        sub: "Reels cinematográficos de 10s",
        where: "generate-vtli-video",
        provider: "fal",
        providerName: "fal.ai",
        model: "bytedance/seedance-2.0/text-to-video",
        cost: "≈ $3.03 por video de 10s",
        tipo: "video",
    },
    {
        feature: "Animar keyframe (imagen → video)",
        sub: "Da movimiento a un cuadro fijo",
        where: "animate-vtli-keyframe",
        provider: "fal",
        providerName: "fal.ai",
        model: "fal-ai/ltx-2/image-to-video/fast",
        cost: "por generación (fal.ai)",
        tipo: "video",
    },
    {
        feature: "Narración de voz",
        sub: "Voz en off de los Reels",
        where: "generar-narracion-voz",
        provider: "eleven",
        providerName: "ElevenLabs",
        model: "eleven_multilingual_v2",
        cost: "por carácter (1 crédito = 1 carácter)",
        tipo: "voz",
    },
]

/* Cámara Solar (sesiones) + Observatorio (admin). */
const IA_SESIONES: IaUse[] = [
    {
        feature: "Cámara Solar · transcribir la sesión",
        sub: "Audio de Zoom → texto con quién habla",
        where: "pipeline_solar.py (admin)",
        provider: "deepgram",
        providerName: "Deepgram",
        model: "nova-3",
        cost: "≈ $0.0043 por minuto (~$0.26 la hora)",
        tipo: "voz",
    },
    {
        feature: "Cámara Solar · Sello de Integración",
        sub: "Destila la transcripción en el PDF post-sesión",
        where: "pipeline_solar.py (admin)",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.1-pro-preview",
        cascade: "→ gemini-2.5-pro",
        cost: "≈ $1.25 entrada · $10.00 salida (tarifa Pro)",
        tipo: "texto",
    },
    {
        feature: "Observatorio · destilar nodo",
        sub: "Síntesis de las sesiones de un Tripulante",
        where: "destilar-nodo · analisis-profundo-sprint",
        provider: "gem",
        providerName: "Google Gemini",
        model: "gemini-3.1-pro-preview",
        cascade: "→ gemini-2.5-pro",
        cost: "≈ $1.25 entrada · $10.00 salida (tarifa Pro)",
        tipo: "texto",
    },
]

/* Tabla de referencia de precios por 1M de tokens (MXN, FX 18). */
const IA_PRICES: {
    model: string
    inp: string
    out: string
    hot?: "new" | "use" | "old"
    note?: string
}[] = [
    {
        model: "DeepSeek V4-Flash-0731 (build oficial)",
        inp: "$0.09",
        out: "$0.18",
        hot: "new",
        note: "Espejo · el cerebro. Salió 31-jul-2026: MISMO tamaño y MISMO precio que el preview (solo lo re-entrenaron) → misma velocidad, sube la inteligencia",
    },
    {
        model: "DeepSeek V4-Flash (preview, anterior)",
        inp: "$0.09",
        out: "$0.18",
        note: "Queda en el selector admin del Espejo para comparar la VOZ (los benchmarks que mejoraron son de agente/código, no de calidez)",
    },
    {
        model: "Fish Audio S2.1-pro (voz)",
        inp: "$15 / 1M bytes",
        out: "—",
        hot: "use",
        note: "Espejo · la voz. ≈ $0.0156 por cada 1.000 caracteres leídos",
    },
    {
        model: "DeepSeek V3 (deepseek-chat)",
        inp: "$0.20",
        out: "$0.78",
        hot: "use",
        note: "Frecuencias Sonoras (reversa del Espejo si V4 suaviza la voz)",
    },
    {
        model: "gemini-embedding-001",
        inp: "$0.15",
        out: "—",
        hot: "use",
        note: "memoria del Espejo (RAG)",
    },
    {
        model: "Gemini 3.6 Flash",
        inp: "$1.50",
        out: "$7.50",
        hot: "use",
        note: "✓ primario de todo el ecosistema",
    },
    {
        model: "Gemini 3.5 Flash",
        inp: "$1.50",
        out: "$9.00",
        hot: "old",
        note: "respaldo de las cascadas",
    },
    {
        model: "Gemini 3.5 Flash-Lite",
        inp: "$0.30",
        out: "$2.50",
        hot: "use",
        note: "nombre de alimentos",
    },
    {
        model: "Gemini 2.5 Flash",
        inp: "$0.30",
        out: "$2.50",
        hot: "old",
        note: "respaldo de las cascadas",
    },
    {
        model: "Gemini 2.0 Flash",
        inp: "$0.10",
        out: "$0.40",
        hot: "old",
        note: "DECOMISIONADO (404)",
    },
    {
        model: "Gemini 3.1 Flash-Lite (viejo)",
        inp: "$0.25",
        out: "$1.50",
        hot: "old",
        note: "reemplazado por 3.5 Lite",
    },
    {
        model: "Gemini 3.1 Pro / 2.5 Pro",
        inp: "≈$1.25",
        out: "≈$10.00",
        hot: "use",
        note: "Cámara Solar + Observatorio",
    },
    {
        model: "Deepgram Nova-3 (voz→texto)",
        inp: "≈$0.0043 / min",
        out: "—",
        hot: "use",
        note: "transcribe la Cámara Solar",
    },
]

/* ══════════════ LÍMITES POR USUARIO (cuánto puede gastar UN nodo) ══════════════
   Zak, 2026-07-30: "quiero ver los límites, ya me los has dicho y se me olvida".
   Los números viven en el CÓDIGO DE LAS EDGES (constantes, con su costo al lado);
   esta tabla los ESPEJA para poder sintonizarlos de un vistazo. Si se cambia una
   perilla allá, actualizar acá.
     · Reflejos (texto)  → oraculo-chat: reserve_edge_spend p_user_limit
     · Voz               → espejo-voz: MEMBER_LIMIT_DAY / FREE_UNITS_LIFETIME /
                           GLOBAL_LIMIT_DAY (1 unidad = CHARS_POR_UNIDAD = 1.000)
   Costos unitarios: reflejo ≈ $0.0025 USD · unidad de voz ≈ $0.0156 USD. */
const USD_MXN = 18

/* v3.97 — MATRIZ: filas = quién · columnas = superficie. Cada celda dice el
   tope por día Y cuánto cuesta al mes si lo agota (el servidor corta ahí). */
type IaCelda = {
    tope: string
    det?: string
    /* USD/mes si agota ese tope TODOS los días. Tope DURO: el servidor corta. */
    max: number
    /* USD/mes con el uso que se espera de alguien real. */
    real: number
}

type IaFila = {
    quien: string
    sub?: string
    esMiembro: boolean
    celdas: Partial<Record<"texto" | "vision" | "voz" | "imagen", IaCelda>>
}

const IA_MATRIZ: IaFila[] = [
    {
        quien: "Explorador (sin membresía)",
        sub: "el muro de Sintonía cae en el 4º reflejo",
        esMiembro: false,
        celdas: {
            texto: {
                tope: "3 · de por vida",
                max: 0.01,
                real: 0.01,
            },
            voz: {
                tope: "~8 minutos · de por vida",
                det: "NO son reflejos extra: le alcanza para ESCUCHAR sus 3 reflejos. Internamente 80 unidades de 100 caracteres",
                max: 0.13,
                real: 0.13,
            },
        },
    },
    {
        quien: "Miembro · Sintonía Solar",
        sub: "499 MXN/mes · semanal 150",
        esMiembro: true,
        celdas: {
            texto: {
                tope: "150 al día",
                det: "freno anti-ráfaga: 60 por hora · uso real ≈ 8 al día",
                max: 11.25,
                real: 0.6,
            },
            vision: {
                tope: "30 lecturas al día",
                det: "leer una imagen adjunta cuesta ~4x un reflejo",
                max: 9,
                real: 0.1,
            },
            voz: {
                tope: "1 HORA al día · 8 HORAS al mes",
                det: "v2.0 · unidad fina de 100 caracteres (~6 s): el cobro es por MINUTOS reales, ya no redondea cada lectura corta a una unidad entera. Manda el mensual. Internamente: 600 u/día · 5.000 u/mes",
                max: 7.8,
                real: 1.85,
            },
            imagen: {
                tope: "2 al día · 1 por reflejo",
                det: "FLUX.2 Pro $0.03 USD/imagen · arte libre (sin estilo impuesto) · el pase del Arquitecto suma extras solo por hoy",
                max: 1.8,
                real: 0.3,
            },
        },
    },
    {
        quien: "Admin (tu carril)",
        sub: "fuera de la aritmética de miembros",
        esMiembro: false,
        celdas: {
            voz: {
                tope: "10 horas al día",
                det: "el device-QA es intensivo por definición · internamente 6.000 unidades",
                max: 281,
                real: 0,
            },
        },
    },
]

const IA_COLS: {
    key: "texto" | "vision" | "voz" | "imagen"
    label: string
    c: string
}[] = [
    { key: "texto", label: "✦ Texto (reflejos)", c: "#B59CFF" },
    { key: "vision", label: "👁 Visión (leer imagen)", c: "#7ED0FF" },
    { key: "voz", label: "🔊 Voz", c: "#FF9E5A" },
    { key: "imagen", label: "🖼 Imagen (nuevo)", c: "#FFD84D" },
]

/* Frenos globales: el techo de la app entera, no de una persona. */
const IA_GLOBAL = [
    { que: "Reflejos (texto)", tope: "20.000 / día", costo: "≈ $50 USD/día" },
    { que: "Lecturas con imagen", tope: "1.500 / día", costo: "≈ $15 USD/día" },
    { que: "Voz", tope: "1.800 unidades / día", costo: "≈ $28 USD/día" },
]

function LimitesPanel() {
    /* La aritmética de la suscripción, explícita (Apple Small Business = 15%). */
    const precioMxn = 499
    const neto = (precioMxn * 0.85) / USD_MXN // USD que entran por miembro/mes
    const techoSano = neto * 0.2 // 20% del neto para IA
    const sumaMiembro = (k: "max" | "real") =>
        IA_MATRIZ.filter((f) => f.esMiembro)
            .flatMap((f) => Object.values(f.celdas))
            .reduce((a, cd) => a + (cd ? cd[k] : 0), 0)
    const peorCaso = sumaMiembro("max")
    const realista = sumaMiembro("real")
    const cell: React.CSSProperties = {
        padding: "9px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
    }
    const mono = "'SF Mono','JetBrains Mono',monospace"
    return (
        <div style={{ marginBottom: 30 }}>
            <h3
                style={{
                    margin: "10px 0 6px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#00E5FF",
                    letterSpacing: "0.05em",
                }}
            >
                💰 Límites · lo que UN solo nodo puede gastar
            </h3>
            <p
                style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    margin: "0 0 14px",
                    lineHeight: 1.5,
                }}
            >
                Un reflejo de texto cuesta ≈ $0.0025 USD. Una unidad de voz
                (1.000 caracteres leídos, ~1 minuto) cuesta ≈ $0.0156 USD, seis
                veces más que un reflejo entero: la voz es el gasto real del
                Espejo.
            </p>

            {/* Aritmética de la suscripción */}
            <div
                style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    marginBottom: 16,
                }}
            >
                {[
                    {
                        t: "Entra por miembro",
                        v: `$${neto.toFixed(2)} USD`,
                        s: `${precioMxn} MXN menos el 15% de Apple`,
                        c: "#5FD68A",
                    },
                    {
                        t: "Uso real esperado",
                        v: `≈ $${realista.toFixed(2)} USD`,
                        s: `≈ ${Math.round(realista * USD_MXN)} MXN al mes · holgado`,
                        c: "#5FD68A",
                    },
                    {
                        t: "Techo sano (meta interna)",
                        v: `$${techoSano.toFixed(2)} USD`,
                        s: "20% de lo que entra · el uso real cabe casi 2 veces",
                        c: "#00E5FF",
                    },
                    {
                        t: "Techo DURO (topes del servidor)",
                        v: `$${peorCaso.toFixed(2)} USD`,
                        s: `máximo absoluto: UN miembro agotando TODOS sus topes los 30 días. El servidor corta ahí; por encima no existe gasto. ≈ ${Math.round(peorCaso * USD_MXN)} MXN`,
                        c: "#FF7EB0",
                    },
                ].map((k) => (
                    <div
                        key={k.t}
                        style={{
                            border: `1px solid ${k.c}44`,
                            borderLeft: `3px solid ${k.c}`,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.02)",
                            padding: "12px 14px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.5)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            {k.t}
                        </div>
                        <div
                            style={{
                                fontSize: 21,
                                fontWeight: 700,
                                color: k.c,
                                fontFamily: mono,
                                margin: "4px 0 3px",
                            }}
                        >
                            {k.v}
                        </div>
                        <div
                            style={{
                                fontSize: 11.5,
                                color: "rgba(255,255,255,0.45)",
                                lineHeight: 1.4,
                            }}
                        >
                            {k.s}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla de topes por persona */}
            <div
                style={{
                    overflowX: "auto",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12.5,
                        minWidth: 640,
                    }}
                >
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "9px 12px",
                                    color: "rgba(255,255,255,0.6)",
                                    fontWeight: 500,
                                }}
                            >
                                Quién
                            </th>
                            {IA_COLS.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        textAlign: "left",
                                        padding: "9px 12px",
                                        color: col.c,
                                        fontWeight: 600,
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {IA_MATRIZ.map((f) => (
                            <tr key={f.quien}>
                                <td
                                    style={{
                                        ...cell,
                                        color: "#fff",
                                        minWidth: 150,
                                        verticalAlign: "top",
                                    }}
                                >
                                    {f.quien}
                                    {f.sub && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "rgba(255,255,255,0.4)",
                                                marginTop: 2,
                                            }}
                                        >
                                            {f.sub}
                                        </div>
                                    )}
                                </td>
                                {IA_COLS.map((col) => {
                                    const cd = f.celdas[col.key]
                                    if (!cd)
                                        return (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cell,
                                                    fontSize: 10.5,
                                                    color: "rgba(255,255,255,0.22)",
                                                }}
                                            >
                                                no aplica
                                            </td>
                                        )
                                    return (
                                        <td
                                            key={col.key}
                                            style={{
                                                ...cell,
                                                verticalAlign: "top",
                                                minWidth: 165,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "#C9FFE2",
                                                    fontFamily: mono,
                                                }}
                                            >
                                                {cd.tope}
                                            </div>
                                            {cd.det && (
                                                <div
                                                    style={{
                                                        fontSize: 10.5,
                                                        color: "rgba(255,255,255,0.4)",
                                                        lineHeight: 1.45,
                                                        marginTop: 3,
                                                        maxWidth: 230,
                                                    }}
                                                >
                                                    {cd.det}
                                                </div>
                                            )}
                                            {cd.max > 0 && (
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        fontFamily: mono,
                                                        marginTop: 4,
                                                        color:
                                                            cd.max > techoSano
                                                                ? "#FF7EB0"
                                                                : "rgba(255,255,255,0.5)",
                                                    }}
                                                >
                                                    si lo agota: $
                                                    {cd.max.toFixed(2)} USD ≈{" "}
                                                    {Math.round(
                                                        cd.max * USD_MXN
                                                    )}{" "}
                                                    MXN
                                                    {cd.real > 0 && (
                                                        <span
                                                            style={{
                                                                color: "#5FD68A",
                                                            }}
                                                        >
                                                            {" "}
                                                            · real $
                                                            {cd.real.toFixed(
                                                                2
                                                            )}{" "}
                                                            USD
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* La suma del miembro: el renglón que responde "¿cuál es el techo?" */}
            <div
                style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,126,176,0.35)",
                    fontSize: 12.5,
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: 1.6,
                }}
            >
                <b style={{ color: "#FF7EB0" }}>
                    Techo DURO de un miembro: ${peorCaso.toFixed(2)} USD/mes
                </b>{" "}
                (≈ {Math.round(peorCaso * USD_MXN)} MXN) si agota texto, visión
                y voz TODOS los días. El servidor corta ahí: por encima de esa
                cifra no existe gasto. Uso real ≈ ${realista.toFixed(2)} USD.
                Palancas que lo bajan (USD/mes): texto/día $11.25 ≈ 203 MXN ·
                visión/día $9.00 ≈ 162 MXN · voz/mes $7.80 ≈ 140 MXN.
            </div>

            {/* Frenos globales */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 12,
                }}
            >
                {IA_GLOBAL.map((g) => (
                    <div
                        key={g.que}
                        style={{
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.6)",
                        }}
                    >
                        <b style={{ color: "#fff" }}>Freno global · {g.que}:</b>{" "}
                        <span style={{ fontFamily: mono, color: "#C9FFE2" }}>
                            {g.tope}
                        </span>{" "}
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>
                            ({g.costo})
                        </span>
                    </div>
                ))}
            </div>
            <p
                style={{
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.38)",
                    margin: "12px 0 0",
                    lineHeight: 1.55,
                }}
            >
                Los frenos globales son el techo de la app ENTERA en un día, la
                red que evita una factura sorpresa si algo se dispara. Los topes
                por persona viven en el código del servidor y se cambian ahí:
                los reflejos en <b style={{ color: "#fff" }}>oraculo-chat</b> y
                la voz en <b style={{ color: "#fff" }}>espejo-voz</b>{" "}
                (constantes con su costo anotado al lado). El tope de voz de un
                miembro es el número que más mueve la aguja, y desde el 30 de
                julio son DOS ventanas: 60 unidades al día (el pico) y 500 al
                mes (el costo). El uso real ronda 120 al mes, así que casi nadie
                los siente.
            </p>
        </div>
    )
}

function IaCard({ u }: { u: IaUse }) {
    const c = IA_C[u.provider]
    return (
        <div
            style={{
                border: `1px solid ${c}44`,
                borderLeft: `3px solid ${c}`,
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                padding: "13px 15px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {u.feature}
                </span>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: c,
                        letterSpacing: "0.04em",
                    }}
                >
                    {u.providerName}
                </span>
            </div>
            <span
                style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.4,
                }}
            >
                {u.sub}
            </span>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "center",
                    marginTop: 2,
                }}
            >
                <span
                    style={{
                        fontFamily: "'SF Mono','JetBrains Mono',monospace",
                        fontSize: 11.5,
                        color: c,
                        background: `${c}18`,
                        border: `1px solid ${c}33`,
                        borderRadius: 6,
                        padding: "3px 8px",
                    }}
                >
                    {u.model}
                </span>
                {u.cascade && (
                    <span
                        style={{
                            fontFamily: "'SF Mono',monospace",
                            fontSize: 10.5,
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        {u.cascade}
                    </span>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 3,
                    alignItems: "baseline",
                }}
            >
                <span
                    style={{
                        fontSize: 12.5,
                        color: "#C9FFE2",
                        fontWeight: 500,
                    }}
                >
                    💰 {u.cost}
                </span>
                <span
                    style={{
                        fontSize: 10.5,
                        color: "rgba(255,255,255,0.32)",
                        fontFamily: "'SF Mono',monospace",
                    }}
                >
                    {u.where}
                </span>
            </div>
            {u.criterio && (
                <span
                    style={{
                        fontSize: 11.5,
                        lineHeight: 1.45,
                        color: "rgba(255,255,255,0.42)",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 7,
                        marginTop: 2,
                    }}
                >
                    ◈ {u.criterio}
                </span>
            )}
        </div>
    )
}

function IaGroup({
    title,
    glyph,
    rows,
}: {
    title: string
    glyph: string
    rows: IaUse[]
}) {
    return (
        <div style={{ marginBottom: 26 }}>
            <h3
                style={{
                    margin: "0 0 12px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#00E5FF",
                    letterSpacing: "0.05em",
                }}
            >
                {glyph} {title}
            </h3>
            <div
                style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                }}
            >
                {rows.map((u) => (
                    <IaCard key={u.feature} u={u} />
                ))}
            </div>
        </div>
    )
}

/* ═══ PASE DE IMÁGENES DEL ARQUITECTO (v4.1 — Zak 2026-08-06) ═══
   El Reflejo ilustrado tope a 2 imágenes/día por persona. Este botón otorga
   EXTRAS solo para el día en curso y SOLO a cuerpodeluz555@gmail.com: la RPC
   admin_grant_image_pass NO recibe destinatario (lo fija ella misma), así que
   ni manipulando el cliente se le puede dar a otra cuenta. Al día siguiente
   el pase caduca solo. */
function PaseImagenPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [extra, setExtra] = useState<number | null>(null)
    const [n, setN] = useState("20")
    const [msg, setMsg] = useState("")
    const [busy, setBusy] = useState(false)
    /* 🜂 Una vez por visita; otorgar el pase devuelve el valor nuevo en la
       misma respuesta, así que basta con olvidar. */
    const leer = useCallback(
        async (force = false) => {
            const r = await adminActionCached(
                url,
                apiKey,
                "admin_get_image_pass",
                {},
                { force }
            )
            const d = Array.isArray(r) ? r[0] : r
            setExtra(d && typeof d.extra === "number" ? d.extra : 0)
        },
        [url, apiKey]
    )
    useEffect(() => {
        void leer()
    }, [leer])
    const otorgar = async (valor: number) => {
        setBusy(true)
        setMsg("")
        const r = await adminAction(url, apiKey, "admin_grant_image_pass", {
            p_n: valor,
        })
        const d = Array.isArray(r) ? r[0] : r
        setBusy(false)
        motorCacheClear("admin_get_image_pass")
        if (d && d.ok === false) {
            setMsg(
                d.reason === "cuenta_no_encontrada"
                    ? "No encuentro la cuenta cuerpodeluz555@gmail.com en el padrón."
                    : "No se pudo otorgar el pase."
            )
            return
        }
        if (!d) {
            setMsg(
                "La acción no llegó. Pega 20260806_pase_imagen_arquitecto.sql y despliega admin-action v1.48."
            )
            return
        }
        setExtra(valor)
        setMsg(
            valor === 0
                ? "Pase retirado. Vuelves al tope normal de 2 al día."
                : `Pase verde: ${valor} imágenes extra hoy (${valor + 2} en total).`
        )
        window.setTimeout(() => setMsg(""), 6000)
    }
    return (
        <div
            style={{
                border: "1px solid rgba(255,216,77,0.35)",
                borderLeft: "3px solid #FFD84D",
                borderRadius: 10,
                background: "rgba(255,216,77,0.04)",
                padding: "14px 16px",
                marginBottom: 18,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#FFD84D",
                        textTransform: "uppercase",
                    }}
                >
                    🎟 Pase de imágenes · Arquitecto
                </span>
                <span
                    style={{
                        fontSize: 11.5,
                        color: "rgba(255,255,255,0.5)",
                    }}
                >
                    hoy:{" "}
                    <b style={{ color: "#fff" }}>
                        {extra === null ? "…" : 2 + extra}
                    </b>{" "}
                    imágenes
                    {extra ? ` (2 + ${extra} de pase)` : " (tope normal)"}
                </span>
            </div>
            <p
                style={{
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.4)",
                    margin: "6px 0 10px",
                    lineHeight: 1.5,
                }}
            >
                Solo para cuerpodeluz555@gmail.com · vence al terminar el día ·
                cada imagen extra cuesta $0.03 USD.
            </p>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <input
                    value={n}
                    onChange={(e) =>
                        setN(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
                    }
                    inputMode="numeric"
                    style={{
                        width: 70,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        fontFamily: "'SF Mono',monospace",
                    }}
                />
                <button
                    disabled={busy}
                    onClick={() => otorgar(Math.max(0, Number(n) || 0))}
                    style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "1px solid rgba(95,214,138,0.5)",
                        background: "rgba(95,214,138,0.14)",
                        color: "#5FD68A",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        cursor: busy ? "wait" : "pointer",
                        outline: "none",
                        textTransform: "uppercase",
                    }}
                >
                    {busy ? "…" : "Darme el pase"}
                </button>
                {!!extra && (
                    <button
                        disabled={busy}
                        onClick={() => otorgar(0)}
                        style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 12,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        Retirar
                    </button>
                )}
            </div>
            {msg && (
                <div
                    style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: msg.startsWith("Pase verde")
                            ? "#5FD68A"
                            : "#FF9E5A",
                    }}
                >
                    {msg}
                </div>
            )}
        </div>
    )
}

function IAsPanel({
    url = "",
    apiKey = "",
}: {
    url?: string
    apiKey?: string
}) {
    const pillColor = (h?: "new" | "use" | "old") =>
        h === "new"
            ? "#5FD68A"
            : h === "use"
              ? "#00E5FF"
              : "rgba(255,255,255,0.35)"
    return (
        <div style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 40 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 6,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#fff",
                    }}
                >
                    🧠 IAs
                </h2>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Modelos de inteligencia artificial del ecosistema · costo
                    por 1M de tokens en USD
                </span>
            </div>
            <p
                style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    margin: "0 0 20px",
                    lineHeight: 1.5,
                }}
            >
                Precios de lista en dólares (sin descuento por caché), como los
                cobra cada proveedor · para pesos, multiplica por ≈ 18 ·
                actualizado a mano.
            </p>

            {/* Los límites primero: es el número que se necesita a la mano. */}
            <LimitesPanel />
            {url && apiKey && <PaseImagenPanel url={url} apiKey={apiKey} />}

            {/* Banner de novedad — los nuevos Gemini */}
            <div
                style={{
                    border: "1px solid rgba(95,214,138,0.4)",
                    borderRadius: 12,
                    background:
                        "linear-gradient(180deg, rgba(95,214,138,0.1), rgba(95,214,138,0.03))",
                    padding: "16px 18px",
                    marginBottom: 26,
                }}
            >
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#5FD68A",
                        marginBottom: 8,
                    }}
                >
                    🆕 Modelos nuevos de Gemini (21 jul 2026)
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.8)",
                        lineHeight: 1.6,
                    }}
                >
                    <b style={{ color: "#fff" }}>✓ MIGRADO (21 jul):</b> todo el
                    ecosistema pasó de gemini-3.5-flash a
                    <b style={{ color: "#fff" }}> gemini-3.6-flash</b> (misma
                    entrada, salida más barata 135 vs 162 y ~17% menos texto →
                    más rápido). Los respaldos de cascada quedaron intactos. El
                    cambio vive en el servidor: aplica a TODOS los usuarios sin
                    build de Apple.
                    <br />
                    El <b style={{ color: "#fff" }}>nombre del producto</b> del
                    Decodificador de Alimentos bajó a
                    <b style={{ color: "#fff" }}> gemini-3.5-flash-lite</b>{" "}
                    (5.4/45 MXN, ~5× más barato): leer un nombre no necesita el
                    músculo de Flash.
                    <br />
                    <b style={{ color: "#fff" }}>Gemini 3.5 Flash Cyber</b>: NO
                    aplica (acceso restringido a gobiernos/socios, seguridad de
                    código). Los análisis profundos (Cámara Solar, Observatorio)
                    siguen en Gemini Pro.
                </div>
            </div>

            <IaGroup
                title="La app · lo que toca el Tripulante"
                glyph="✦"
                rows={IA_APP}
            />
            <IaGroup
                title="Cámara Solar y Observatorio · sesiones (admin)"
                glyph="☀️"
                rows={IA_SESIONES}
            />
            <IaGroup title="Frecuencias Sonoras" glyph="♫" rows={IA_FREQ} />
            <IaGroup
                title="Atelier de Marketing · redes (admin)"
                glyph="🎬"
                rows={IA_ATELIER}
            />

            {/* Tabla de precios de referencia */}
            <h3
                style={{
                    margin: "10px 0 12px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#00E5FF",
                    letterSpacing: "0.05em",
                }}
            >
                📊 Precios de referencia · por 1M de tokens (USD)
            </h3>
            <div
                style={{
                    overflowX: "auto",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12.5,
                        minWidth: 520,
                    }}
                >
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "9px 12px",
                                    color: "rgba(255,255,255,0.6)",
                                    fontWeight: 500,
                                }}
                            >
                                Modelo
                            </th>
                            <th
                                style={{
                                    textAlign: "right",
                                    padding: "9px 12px",
                                    color: "rgba(255,255,255,0.6)",
                                    fontWeight: 500,
                                }}
                            >
                                Entrada
                            </th>
                            <th
                                style={{
                                    textAlign: "right",
                                    padding: "9px 12px",
                                    color: "rgba(255,255,255,0.6)",
                                    fontWeight: 500,
                                }}
                            >
                                Salida
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "9px 12px",
                                    color: "rgba(255,255,255,0.6)",
                                    fontWeight: 500,
                                }}
                            >
                                Nota
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {IA_PRICES.map((p) => (
                            <tr
                                key={p.model}
                                style={{
                                    borderTop:
                                        "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <td
                                    style={{
                                        padding: "9px 12px",
                                        color: "#fff",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: 7,
                                            height: 7,
                                            borderRadius: "50%",
                                            background: pillColor(p.hot),
                                            marginRight: 8,
                                            verticalAlign: "middle",
                                        }}
                                    />
                                    {p.model}
                                </td>
                                <td
                                    style={{
                                        padding: "9px 12px",
                                        textAlign: "right",
                                        color: "#C9FFE2",
                                        fontFamily: "'SF Mono',monospace",
                                    }}
                                >
                                    {p.inp}
                                </td>
                                <td
                                    style={{
                                        padding: "9px 12px",
                                        textAlign: "right",
                                        color: "#C9FFE2",
                                        fontFamily: "'SF Mono',monospace",
                                    }}
                                >
                                    {p.out}
                                </td>
                                <td
                                    style={{
                                        padding: "9px 12px",
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    {p.note}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p
                style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    margin: "12px 0 0",
                    lineHeight: 1.5,
                }}
            >
                🟢 nuevo · 🔵 en uso hoy · ⚪ viejo/respaldo · Imagen (Nano
                Banana): $0.044 a $0.15 por imagen según resolución (0.5K→4K) ·
                Cloud Vision (OCR): $1.50 / 1000 fotos · ElevenLabs: por
                carácter · fal.ai (video Seedance): ≈ $3.03 por Reel · Deepgram
                (voz→texto): $0.0043 / minuto · Fish Audio (la voz del Espejo):
                $15 / 1M bytes ≈ $0.0156 por 1.000 caracteres · dictado en el
                iPhone: gratis · el campo de estrellas del muro de pago es un
                asset ya generado con FLUX 1.1 Pro (fal.ai), no corre en vivo.
            </p>
        </div>
    )
}

const HOME_CARDS: { id: Section; label: string; sub: string; glyph: string }[] =
    [
        {
            id: "tripulantes",
            label: "Nodos Activos",
            sub: "Padrón de Tripulantes",
            glyph: "🛰️",
        },
        {
            id: "navegacion",
            label: "Navegación",
            sub: "Telemetría de uso",
            glyph: "🧭",
        },
        {
            id: "onboarding",
            label: "Onboarding",
            sub: "Embudo de nuevos",
            glyph: "🚀",
        },
        {
            id: "sondas",
            label: "Sondas",
            sub: "Preguntas del Radar",
            glyph: "📡",
        },
        {
            id: "protocolos",
            label: "Calibraciones",
            sub: "Tomos por pilar",
            glyph: "✦",
        },
        {
            id: "rituales",
            label: "Rituales",
            sub: "Sendero + afirmaciones",
            glyph: "🌅",
        },
        {
            id: "wallpapers",
            label: "Wallpapers",
            sub: "Anclajes fotónicos",
            glyph: "🖼️",
        },
        {
            id: "biosfera",
            label: "Biósfera",
            sub: "Pistas de los nodos",
            glyph: "🌿",
        },
        {
            id: "cropcircles",
            label: "Crop Circles",
            sub: "Registro planetario",
            glyph: "🛸",
        },
        {
            id: "correos",
            label: "Correos",
            sub: "Padrón + lista Android",
            glyph: "✉️",
        },
        {
            id: "avatares",
            label: "Avatares",
            sub: "Avatar + Campo Solar",
            glyph: "☀️",
        },
        {
            id: "cristalizacion",
            label: "Cristalización",
            sub: "Tienda de Fotones",
            glyph: "💎",
        },
        {
            id: "comunidad",
            label: "Comunidad",
            sub: "Intereses y vínculos",
            glyph: "🔗",
        },
        {
            id: "mensajes",
            label: "Mensajes",
            sub: "DM desde el admin",
            glyph: "✉️",
        },
        {
            id: "medallas",
            label: "Medallas",
            sub: "Constelaciones",
            glyph: "🏅",
        },
        {
            id: "moderacion",
            label: "Moderación",
            sub: "Reportes y bloqueos",
            glyph: "🛡️",
        },
        {
            id: "stickers",
            label: "Stickers",
            sub: "Paquetes del chat",
            glyph: "🎨",
        },
        {
            id: "buzones",
            label: "Buzón",
            sub: "Ideas de los nodos",
            glyph: "📥",
        },
        {
            id: "soporte",
            label: "Soporte",
            sub: "Casos + transferencias",
            glyph: "🛟",
        },
        {
            id: "rachas",
            label: "Rachas",
            sub: "Hábitos (anónimo)",
            glyph: "🔥",
        },
        { id: "ias", label: "IAs", sub: "Modelos + costos", glyph: "🧠" },
        {
            id: "espejo",
            label: "Espejo",
            sub: "Conversaciones (anónimo)",
            glyph: "🪞",
        },
        { id: "app", label: "App", sub: "Versión y regalos", glyph: "📱" },
    ]

function HomeView({
    onGo,
    url,
    apiKey,
}: {
    onGo: (s: Section) => void
    url: string
    apiKey: string
}) {
    return (
        <div style={{ padding: "4px 0 40px" }}>
            <GrowthABPanel url={url} apiKey={apiKey} />
            <p
                style={{
                    margin: "0 0 14px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,205,235,0.7)",
                }}
            >
                Todas las secciones
            </p>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 12,
                }}
            >
                {HOME_CARDS.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => onGo(c.id)}
                        style={{
                            textAlign: "left",
                            padding: "16px 15px",
                            borderRadius: 14,
                            cursor: "pointer",
                            background: "rgba(10,16,34,0.55)",
                            border: "1px solid rgba(125,239,255,0.14)",
                            transition:
                                "transform .12s, border-color .15s, background .15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                                "rgba(125,239,255,0.5)"
                            e.currentTarget.style.transform = "translateY(-2px)"
                            e.currentTarget.style.background =
                                "rgba(14,24,46,0.75)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                                "rgba(125,239,255,0.14)"
                            e.currentTarget.style.transform = "none"
                            e.currentTarget.style.background =
                                "rgba(10,16,34,0.55)"
                        }}
                    >
                        <div style={{ fontSize: 26, marginBottom: 8 }}>
                            {c.glyph}
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#fff",
                                marginBottom: 3,
                            }}
                        >
                            {c.label}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "rgba(180,205,235,0.6)",
                            }}
                        >
                            {c.sub}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export function MotorDeIntervencion({
    supabaseUrl = "",
    supabaseAnonKey = "",
}: PanelProps) {
    const { isAdmin, loading, userId, motivo, reintentar } = useAdminAuth(
        supabaseUrl,
        supabaseAnonKey
    )
    const isMobile = useIsMobile()
    useScrollHideHeader(isMobile)
    const [pilar, setPilar] = useState<Pilar>("FISICO")
    const [section, setSection] = useState<Section>("home")
    const [sondas, setSondas] = useState<SondaRow[]>([])
    const [protos, setProtos] = useState<ProtoRow[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)
    const addActionRef = useRef<(() => void) | null>(null)
    const cancelActionRef = useRef<(() => void) | null>(null)
    const isEditingRef = useRef(false)
    const tripModalOpenRef = useRef(false)

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            const inInput = tag === "TEXTAREA" || tag === "INPUT"

            if (e.key === "Escape") {
                e.preventDefault()
                if (cancelActionRef.current) cancelActionRef.current()
                return
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                if (isEditingRef.current) {
                    /* saveRef handled by child */
                } else if (addActionRef.current) addActionRef.current()
                return
            }

            if (inInput) return
            if (tripModalOpenRef.current) return
            const pList = PILARES.map((p: any) => p.id)
            const pIdx = pList.indexOf(pilar)
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setPilar(pList[(pIdx - 1 + pList.length) % pList.length])
            }
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setPilar(pList[(pIdx + 1) % pList.length])
            }
            const sOrder: Section[] = [
                "home",
                "tripulantes",
                "sondas",
                "protocolos",
                "navegacion",
                "onboarding",
                "rituales",
                "wallpapers",
                "biosfera",
                "cropcircles",
                "correos",
                "avatares",
                "cristalizacion",
                "comunidad",
                "mensajes",
                "medallas",
                "moderacion",
                "stickers",
                "buzones",
                "soporte",
                "rachas",
                "espejo",
                "app",
            ]
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                setSection((s) => {
                    const i = sOrder.indexOf(s)
                    return sOrder[(i - 1 + sOrder.length) % sOrder.length]
                })
            }
            if (e.key === "ArrowRight") {
                e.preventDefault()
                setSection((s) => {
                    const i = sOrder.indexOf(s)
                    return sOrder[(i + 1) % sOrder.length]
                })
            }
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [pilar])

    const loadAll = useCallback(async () => {
        if (!supabaseUrl || !supabaseAnonKey) return
        const [s, p] = await Promise.all([
            adminAction(supabaseUrl, supabaseAnonKey, "get_all_sondas"),
            adminAction(
                supabaseUrl,
                supabaseAnonKey,
                "get_all_protocolos_admin"
            ),
        ])
        if (s && Array.isArray(s)) setSondas(s)
        if (p && Array.isArray(p)) setProtos(p)
        setDataLoaded(true)
    }, [supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        // Carga perezosa: las sondas/calibraciones solo se piden al entrar a
        // esas pestañas → el Home (default) no dispara requests al abrir.
        if (
            isAdmin &&
            !dataLoaded &&
            (section === "sondas" || section === "protocolos")
        )
            loadAll()
    }, [isAdmin, section, dataLoaded, loadAll])

    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "mi-css"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])

    if (loading)
        return (
            <div
                className="mi-wrap"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <p
                    style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: "#fff",
                        letterSpacing: "0.1em",
                    }}
                >
                    Verificando acceso...
                </p>
            </div>
        )
    if (!isAdmin)
        return (
            <div
                className="mi-wrap"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    minHeight: "60vh",
                    textAlign: "center",
                    padding: "0 24px",
                }}
            >
                {/* 🜂 v3.99 — LA PANTALLA DICE LA VERDAD. Antes cualquier
                    tropiezo (Clerk todavía despertando, un token frío, un
                    tropiezo de red) se pintaba como "Acceso denegado" y la
                    única salida era recargar a ciegas hasta acertar. Ahora
                    el portón insiste solo (MI_Shared v1.7) y, si de plano
                    no pudo preguntar, lo DICE y ofrece reintentar sin
                    recargar. Un fallo que no se puede leer es un viaje
                    perdido. */}
                <p
                    style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color:
                            motivo === "no_admin"
                                ? "rgba(255,100,100,0.5)"
                                : "rgba(255,255,255,0.6)",
                        letterSpacing: "0.1em",
                        margin: 0,
                    }}
                >
                    {motivo === "no_admin"
                        ? "Acceso denegado. Solo Arquitectos."
                        : motivo === "sin_sesion"
                          ? "Necesitas iniciar sesión para entrar aquí."
                          : "No pudimos verificar tu acceso."}
                </p>
                {motivo !== "no_admin" && motivo !== "sin_sesion" ? (
                    <>
                        <p
                            style={{
                                fontSize: 12,
                                fontWeight: 300,
                                color: "rgba(255,255,255,0.35)",
                                letterSpacing: "0.06em",
                                margin: 0,
                                maxWidth: 380,
                                lineHeight: 1.6,
                            }}
                        >
                            Tu sesión está activa, pero la verificación no
                            respondió. No es un rechazo.
                        </p>
                        <button
                            type="button"
                            onClick={reintentar}
                            style={{
                                padding: "11px 26px",
                                borderRadius: 999,
                                border: "1px solid rgba(0,194,255,0.35)",
                                background: "rgba(0,194,255,0.08)",
                                color: "#00C2FF",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Reintentar
                        </button>
                    </>
                ) : null}
            </div>
        )

    const pillarCounts = (id: Pilar) => ({
        s: sondas.filter((s) => s.pilar === id).length,
        p: protos.filter((p) => p.pilar === id).length,
    })

    if (typeof document === "undefined") return null
    return createPortal(
        <div className="mi-wrap">
            {!isMobile && <NavRevealPin />}
            <h1 className="mi-title rsv-admin-title">
                ✦ Motor de Intervención
            </h1>
            <p className="mi-title-sub rsv-admin-title">
                Cirugía Quirúrgica de Sondas y Protocolos
            </p>
            <BadgeBoundary>
                <AppVersionBadge url={supabaseUrl} apiKey={supabaseAnonKey} />
            </BadgeBoundary>
            <BadgeBoundary>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 10,
                        marginBottom: 14,
                    }}
                >
                    <CamaraSolarToggle
                        url={supabaseUrl}
                        apiKey={supabaseAnonKey}
                    />
                    <SesionesToggle
                        url={supabaseUrl}
                        apiKey={supabaseAnonKey}
                    />
                </div>
            </BadgeBoundary>

            <div className="mi-tabs">
                <button
                    className={`mi-tab ${section === "home" ? "active" : ""}`}
                    onClick={() => setSection("home")}
                >
                    ⌂ Inicio
                </button>
                <button
                    className={`mi-tab ${section === "tripulantes" ? "active" : ""}`}
                    onClick={() => setSection("tripulantes")}
                >
                    Nodos Activos
                </button>
                <button
                    className={`mi-tab ${section === "sondas" ? "active" : ""}`}
                    onClick={() => setSection("sondas")}
                >
                    Sondas de Interrogación
                </button>
                <button
                    className={`mi-tab ${section === "protocolos" ? "active" : ""}`}
                    onClick={() => setSection("protocolos")}
                >
                    Calibraciones
                </button>
                <button
                    className={`mi-tab ${section === "navegacion" ? "active" : ""}`}
                    onClick={() => setSection("navegacion")}
                >
                    Navegación
                </button>
                <button
                    className={`mi-tab ${section === "onboarding" ? "active" : ""}`}
                    onClick={() => setSection("onboarding")}
                >
                    Onboarding
                </button>
                <button
                    className={`mi-tab ${section === "rituales" ? "active" : ""}`}
                    onClick={() => setSection("rituales")}
                >
                    Rituales
                </button>
                <button
                    className={`mi-tab ${section === "wallpapers" ? "active" : ""}`}
                    onClick={() => setSection("wallpapers")}
                >
                    Wallpapers
                </button>
                <button
                    className={`mi-tab ${section === "cropcircles" ? "active" : ""}`}
                    onClick={() => setSection("cropcircles")}
                >
                    Crop Circles
                </button>
                <button
                    className={`mi-tab ${section === "correos" ? "active" : ""}`}
                    onClick={() => setSection("correos")}
                >
                    Correos
                </button>
                <button
                    className={`mi-tab ${section === "biosfera" ? "active" : ""}`}
                    onClick={() => setSection("biosfera")}
                >
                    Biósfera
                </button>
                <button
                    className={`mi-tab ${section === "avatares" ? "active" : ""}`}
                    onClick={() => setSection("avatares")}
                >
                    Avatares
                </button>
                <button
                    className={`mi-tab ${section === "cristalizacion" ? "active" : ""}`}
                    onClick={() => setSection("cristalizacion")}
                >
                    Cristalización
                </button>
                <button
                    className={`mi-tab ${section === "comunidad" ? "active" : ""}`}
                    onClick={() => setSection("comunidad")}
                >
                    Comunidad
                </button>
                <button
                    className={`mi-tab ${section === "mensajes" ? "active" : ""}`}
                    onClick={() => setSection("mensajes")}
                >
                    Mensajes
                </button>
                <button
                    className={`mi-tab ${section === "medallas" ? "active" : ""}`}
                    onClick={() => setSection("medallas")}
                >
                    Medallas
                </button>
                <button
                    className={`mi-tab ${section === "moderacion" ? "active" : ""}`}
                    onClick={() => setSection("moderacion")}
                >
                    Moderación
                </button>
                <button
                    className={`mi-tab ${section === "stickers" ? "active" : ""}`}
                    onClick={() => setSection("stickers")}
                >
                    Stickers
                </button>
                <button
                    className={`mi-tab ${section === "buzones" ? "active" : ""}`}
                    onClick={() => setSection("buzones")}
                >
                    Buzón
                </button>
                <button
                    className={`mi-tab ${section === "soporte" ? "active" : ""}`}
                    onClick={() => setSection("soporte")}
                >
                    Soporte
                </button>
                <button
                    className={`mi-tab ${section === "rachas" ? "active" : ""}`}
                    onClick={() => setSection("rachas")}
                >
                    Rachas
                </button>
                <button
                    className={`mi-tab ${section === "espejo" ? "active" : ""}`}
                    onClick={() => setSection("espejo")}
                >
                    Espejo
                </button>
                <button
                    className={`mi-tab ${section === "app" ? "active" : ""}`}
                    onClick={() => setSection("app")}
                >
                    App
                </button>
                <button
                    className={`mi-tab ${section === "ias" ? "active" : ""}`}
                    onClick={() => setSection("ias")}
                >
                    IAs
                </button>
            </div>

            <div className="mi-grid">
                {(section === "sondas" || section === "protocolos") && (
                    <div className="mi-rail">
                        {PILARES.map((pl: any) => {
                            const c = pillarCounts(pl.id)
                            return (
                                <button
                                    key={pl.id}
                                    className={`mi-rail-btn ${pilar === pl.id ? "active" : ""}`}
                                    onClick={() => setPilar(pl.id)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 11,
                                            }}
                                        >
                                            {pl.label}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 9,
                                                marginTop: 2,
                                                color: "#fff",
                                            }}
                                        >
                                            {c.s} sondas · {c.p} fases
                                        </span>
                                    </div>
                                </button>
                            )
                        })}

                        <div
                            className="mi-stats-panel"
                            style={{
                                marginTop: 16,
                                padding: 16,
                                borderRadius: 12,
                                background: "rgba(0,0,0,0.2)",
                                border: "1px solid rgba(255,255,255,0.03)",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "#fff",
                                }}
                            >
                                Resumen Global
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    color: "#fff",
                                    lineHeight: 1.8,
                                }}
                            >
                                Sondas: {sondas.length}
                                <br />
                                Protocolos: {protos.length}
                                <br />
                                Activos:{" "}
                                {protos.filter((p) => p.is_active).length}
                            </p>
                        </div>
                    </div>
                )}

                <div className="mi-main" style={{ position: "relative" }}>
                    {/* Botón Home flotante — siempre visible fuera del Inicio
                        (incluida la vista alta de Wallpapers). */}
                    {section !== "home" && (
                        <div
                            style={{
                                position: "sticky",
                                top: 4,
                                zIndex: 40,
                                marginBottom: 12,
                            }}
                        >
                            <button
                                onClick={() => setSection("home")}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 14px",
                                    borderRadius: 999,
                                    cursor: "pointer",
                                    border: "1px solid rgba(125,239,255,0.35)",
                                    background: "rgba(8,14,30,0.9)",
                                    backdropFilter: "blur(6px)",
                                    color: "rgba(180,230,255,0.9)",
                                    fontSize: 12,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                ⌂ Inicio
                            </button>
                        </div>
                    )}
                    {section === "home" ? (
                        <HomeView
                            onGo={setSection}
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "navegacion" ? (
                        <NavTelemetryView
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                            adminClerkId={userId}
                        />
                    ) : section === "rituales" ? (
                        <RitualesHub
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "wallpapers" ? (
                        <WallpapersHub
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "biosfera" ? (
                        <BiosferaEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "cropcircles" ? (
                        <CropCirclesPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "correos" ? (
                        <CorreosPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "avatares" ? (
                        <AvataresHub
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "cristalizacion" ? (
                        <CristalizacionEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "comunidad" ? (
                        <ComunidadInteresesEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "mensajes" ? (
                        <MensajeAdminEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "medallas" ? (
                        <MedallasEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "moderacion" ? (
                        <ModeracionPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "stickers" ? (
                        <StickersHub
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "buzones" ? (
                        <BuzonEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "soporte" ? (
                        <SoporteHub
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "onboarding" ? (
                        <OnbFunnelPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "rachas" ? (
                        <RachasAnonPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "espejo" ? (
                        <EspejoEditor
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
                    ) : section === "app" ? (
                        <>
                            <VersionesEditor
                                url={supabaseUrl}
                                apiKey={supabaseAnonKey}
                            />
                            <BloqueoEmergenciaPanel
                                url={supabaseUrl}
                                apiKey={supabaseAnonKey}
                            />
                            <BitacoraAvisosPanel
                                url={supabaseUrl}
                                apiKey={supabaseAnonKey}
                            />
                        </>
                    ) : section === "ias" ? (
                        <IAsPanel url={supabaseUrl} apiKey={supabaseAnonKey} />
                    ) : (section === "sondas" || section === "protocolos") &&
                      !dataLoaded ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 300,
                                    color: "#fff",
                                }}
                            >
                                Cargando datos...
                            </p>
                        </div>
                    ) : section === "sondas" ? (
                        <SondasEditor
                            pilar={pilar}
                            sondas={sondas}
                            onRefresh={loadAll}
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                            addActionRef={addActionRef}
                            cancelActionRef={cancelActionRef}
                            isEditingRef={isEditingRef}
                        />
                    ) : section === "protocolos" ? (
                        <ProtocolosEditor
                            pilar={pilar}
                            protos={protos}
                            onRefresh={loadAll}
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                            addActionRef={addActionRef}
                            cancelActionRef={cancelActionRef}
                            isEditingRef={isEditingRef}
                        />
                    ) : (
                        <TripulantesView
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                            adminClerkId={userId}
                            modalOpenRef={tripModalOpenRef}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

export default MotorDeIntervencion
