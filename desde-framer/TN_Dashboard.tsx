// TN_Dashboard.tsx v1.8 — ENCABEZADOS QUE NO SE MALINTERPRETAN (Zak 2026-08-07): "h·7·30" se leía como HORAS cuando la primera ventana es HOY → pasa a "hoy·7d·30d". Y "Deco" no decía qué cuenta: pasa a "Decodificadores" con explicación al pasar el cursor (Alimentos suma DOS llamadas por escaneo —lectura del texto + dictamen— más Sueños; los Crop Circles no entran). Solo etiquetas: cero cambios de cálculo.
// TN_Dashboard.tsx v1.9 — EL TOTAL DE IA QUEDA COMPLETO (Zak 2026-08-10): entran 🧠 Memoria (destilador del Espejo, cron cada 4h, $0.0025 por destilación) y 🎙 Comandos (intérprete de la voz, $0.001 mezclado entre el modelo chico de navegar y el grande de actuar). Las dos ya escribían al libro mayor con la llave de la persona; solo faltaba leerlas. Van a 30 días nada más: son de fondo, no se miran por día. El aviso de SQL faltante ahora NOMBRA el archivo exacto, así distingue cuál de las dos migraciones quedó sin pegar. | v1.8 — 🜂 LAS IMÁGENES ENTRAN A LA TELEMETRÍA, EN DOS CARRILES (Zak 2026-08-10): "Gasto de IA por nodo" suma dos columnas nuevas, 🎨 Imagen Espejo (edge espejo-imagen, FLUX.2 Pro, $0.03) y 🌀 Imagen Ráfaga (edge espejo-imagen-rafaga, FLUX Schnell, $0.003), separadas por igualdad exacta de llave porque un LIKE mezclaría dos precios que difieren diez veces. Hasta hoy NADA de lo generado entraba al panel ni al USD 30d: la propia edge lo dejó anotado ("el costo es tan bajo que viaja fuera"), y con el Modo Ráfaga pidiendo 2 o 3 imágenes por envío con cupo de 30 al día eso dejó de ser cierto. 👁 Visión NO es generar: cuenta las fotos que el Espejo MIRA cuando alguien se las manda, y se queda intacta. Si la lectura llega sin las claves nuevas el panel lo DICE en vez de pintar ceros que se leerían como "nadie las usa". Requiere pegar 20260810_ia_gasto_imagenes.sql. | v1.7 — el gasto de IA ENTRA a Gastos Operacionales (Zak): GastoIaNodos sube su total 30d sin filtrar (onTotal) y ExpCard lo recibe como iaUsd30 → fila automática que se suma al total del mes. | v1.6 — GASTO DE IA POR NODO (Zak): sección nueva bajo Transmisión 1:1 con el libro mayor real (edge_spend_ledger vía RPC get_ia_gasto_por_nodo, gateway admin-action + respaldo directo): unidades por persona en tres ventanas (hoy · 7 días · 30 días) por superficie (Reflejos · Visión · Voz · Decodificadores), costo USD 30d con los precios unitarios del panel de IAs del Motor + equivalente MXN, buscador por nodo y totales al pie. Requiere pegar la migración 20260805_ia_gasto_por_nodo.sql. | Sintonía 777 → 599 en el desglose de Privilegios.
// v1.4 (2026-05-20) — `nav()` del Tripulante no admin ahora rutea
// según contexto: desde fuera de `/escaner/*` lleva a `/nucleo#mifirma`,
// dentro del Escáner mantiene `/escaner/nucleo#mifirma`. Consistencia
// con la regla "no enlaces a /escaner/* desde fuera de /escaner/*".
//
// v1.3 (2026-05-20) — "Cobrado" de Inmersión y Sintonía ahora lee
// `inmersion_rev_cents_this/_prev` + `sintonia_rev_cents_this/_prev`
// del RPC `get_admin_dashboard` (SUM exacto desde `payments_log`).
// Refleja PRIMERMES (-444 MXN primer mes), admin promos (0 MXN),
// refunds parciales y cualquier ajuste Stripe — antes multiplicaba
// count × precio lleno y daba ingresos ficticios. "Por Cobrar"
// sigue siendo count × precio (proyección de renovaciones que aún
// no pagaron). El modo Arquitecto sigue intacto (count × precio,
// es proyección por definición).
//
// v1.2 — Toggle Real/Arquitecto baja otros ~22px más (top:62 → top:84)
// para que respire respecto al cluster avatar + botón ⬡ Escáner que
// vive arriba a la derecha. Antes quedaba muy pegado al CTA del Escáner
// y se sentía como un solo bloque visual; ahora hay aire entre los dos.
// v1.1 — Toggle Real/Arquitecto bajado a top:62 right:24 para no chocar
// con el botón ⬡ ESCÁNER VIBRACIONAL + cluster Avatar.
// AdminDashboard + TelemetriaDelNucleoInner — el panel completo del split
// de TelemetriaDelNucleo (sello TN_).
// Default export = TelemetriaDelNucleoInner directo (no ghost — el componente
// principal cumple el contrato del componentLoader de Framer con body JSX).
//
// Consumidor: TelemetriaDelNucleo.tsx (shell). Patrón de import:
//   import TelemetriaDelNucleoInner from "./TN_Dashboard.tsx"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import NavRevealPin from "./NavRevealPin.tsx"
import Shared from "./TN_Shared.tsx"
import UI from "./TN_UI.tsx"
import Forms from "./TN_Forms.tsx"
import Cards from "./TN_Cards.tsx"
import type { OneToOneMonth } from "./TN_Shared.tsx"

const {
    GOLD,
    GG,
    GL,
    CYAN,
    CG,
    GREEN,
    AMBER_C,
    PLATINUM,
    PLATINUM_RGB,
    MG,
    P_INM,
    P_SINT,
    P_PASS,
    ML,
    fmt,
    fadeIn,
    slideUp,
    EMPTY_1TO1,
    useInjectAdminCss,
    useIsMobile,
    useScrollHideHeader,
    useAdminAuth,
    useDash,
    useExplorationPasses,
    useOneToOneSessions,
    sbRpc,
    adminAction,
} = Shared

const {
    HoloCorners,
    EnergyRing,
    MultiToggle,
    StatMini,
    NodeInput,
    LiveBadge,
    PrivCol,
    EyeToggle,
    ExpandArrowBtn,
} = UI

const { HistoryPanel, AddExplorationPassForm } = Forms
const { DetailPanel, ExpCard } = Cards

/* ═══ GASTO DE IA POR NODO (v1.6 — Zak 2026-08-05) ═══
   Lee el libro mayor real del gobernador (edge_spend_ledger) vía la RPC
   admin get_ia_gasto_por_nodo: unidades por superficie en tres ventanas
   (hoy · 7 días · 30 días) por usuario, con el costo USD 30d calculado
   con los MISMOS precios unitarios del panel de IAs del Motor. Gateway
   admin-action primero; RPC directa (gate is_admin interno) de respaldo. */
type GastoNodo = {
    user_key: string
    nombre: string
    refl_1: number
    refl_7: number
    refl_30: number
    /* 👁 Visión = imágenes que el Espejo MIRA cuando alguien le manda una foto.
       No es generar: eso son img_* y raf_*, que son otra cosa y otro precio. */
    vis_1: number
    vis_7: number
    vis_30: number
    /* 🎨 v1.8 — imágenes GENERADAS, separadas por carril porque cuestan diez
       veces distinto y responden a dos herramientas distintas. */
    img_1: number
    img_7: number
    img_30: number
    raf_1: number
    raf_7: number
    raf_30: number
    voz_1: number
    voz_7: number
    voz_30: number
    deco_30: number
    /* v1.9 — las dos superficies que cerraban el total: el destilador de
       memoria del Espejo (cron cada 4h) y el intérprete de los comandos por
       voz. Van solo a 30 días: son de fondo, no se miran por día. */
    mem_30: number
    cmd_30: number
    usd_30: number
}
const GASTO_USD_MXN = 18

function GastoIaNodos({
    sbUrl,
    sbKey,
    clerkId,
    onTotal,
}: {
    sbUrl: string
    sbKey: string
    clerkId: string | null
    onTotal?: (usd: number) => void
}) {
    const [rows, setRows] = useState<GastoNodo[] | null>(null)
    const [fallo, setFallo] = useState(false)
    const [q, setQ] = useState("")
    /* 🜂 v1.8 — DISTINGUIR "CERO USO" DE "FALTA EL SQL". Las columnas nuevas
       leen claves que solo existen desde su migración. Sin ella llegarían en
       cero y en pantalla se vería igual que "nadie usó eso", que es justo lo
       contrario de lo que uno quiere saber. Si la respuesta no TRAE la clave,
       el panel lo dice y NOMBRA el archivo que falta, en vez de mentir con un
       cero. v1.9 — la sonda mira la clave MÁS NUEVA de cada migración, así el
       aviso distingue cuál de las dos quedó sin pegar. */
    const [faltaSql, setFaltaSql] = useState<string | null>(null)
    useEffect(() => {
        if (!sbUrl || !sbKey || !clerkId) return
        let c = false
        const go = async () => {
            let data: any = await adminAction(
                sbUrl,
                sbKey,
                "get_ia_gasto_por_nodo",
                {}
            )
            if (data == null)
                data = await sbRpc(sbUrl, sbKey, "get_ia_gasto_por_nodo", {
                    p_clerk_id: clerkId,
                })
            if (c) return
            const nodos = data && ((data as any).nodos ?? data)
            if (!Array.isArray(nodos)) {
                setFallo(true)
                setRows([])
                return
            }
            setFallo(false)
            const tiene = (k: string) =>
                nodos.length === 0 ||
                Object.prototype.hasOwnProperty.call(nodos[0], k)
            setFaltaSql(
                !tiene("img_30")
                    ? "20260810_ia_gasto_imagenes.sql"
                    : !tiene("cmd_30")
                      ? "20260810b_ia_gasto_memoria_comandos.sql"
                      : null
            )
            setRows(
                nodos.map((n: any) => ({
                    user_key: String(n.user_key || ""),
                    nombre: String(n.nombre || ""),
                    refl_1: Number(n.refl_1) || 0,
                    refl_7: Number(n.refl_7) || 0,
                    refl_30: Number(n.refl_30) || 0,
                    vis_1: Number(n.vis_1) || 0,
                    vis_7: Number(n.vis_7) || 0,
                    vis_30: Number(n.vis_30) || 0,
                    img_1: Number(n.img_1) || 0,
                    img_7: Number(n.img_7) || 0,
                    img_30: Number(n.img_30) || 0,
                    raf_1: Number(n.raf_1) || 0,
                    raf_7: Number(n.raf_7) || 0,
                    raf_30: Number(n.raf_30) || 0,
                    voz_1: Number(n.voz_1) || 0,
                    voz_7: Number(n.voz_7) || 0,
                    voz_30: Number(n.voz_30) || 0,
                    deco_30: Number(n.deco_30) || 0,
                    mem_30: Number(n.mem_30) || 0,
                    cmd_30: Number(n.cmd_30) || 0,
                    usd_30: Number(n.usd_30) || 0,
                }))
            )
        }
        go()
        const t = window.setInterval(go, 60000)
        return () => {
            c = true
            window.clearInterval(t)
        }
    }, [sbUrl, sbKey, clerkId])

    /* v1.7 — el total SIN filtrar sube al padre: alimenta la fila viva
       "IA · uso real" de Gastos Operacionales (ExpCard). */
    useEffect(() => {
        if (rows) onTotal?.(rows.reduce((s, r) => s + r.usd_30, 0))
    }, [rows, onTotal])

    const ql = q.trim().toLowerCase()
    const vis = (rows || []).filter(
        (r) =>
            !ql ||
            r.nombre.toLowerCase().includes(ql) ||
            r.user_key.toLowerCase().includes(ql)
    )
    const tot = vis.reduce(
        (a, r) => ({
            refl: a.refl + r.refl_30,
            vis: a.vis + r.vis_30,
            img: a.img + r.img_30,
            raf: a.raf + r.raf_30,
            voz: a.voz + r.voz_30,
            deco: a.deco + r.deco_30,
            mem: a.mem + r.mem_30,
            cmd: a.cmd + r.cmd_30,
            usd: a.usd + r.usd_30,
        }),
        { refl: 0, vis: 0, img: 0, raf: 0, voz: 0, deco: 0, mem: 0, cmd: 0, usd: 0 }
    )
    const mono = "'SF Mono','JetBrains Mono',monospace"
    const th: React.CSSProperties = {
        textAlign: "right",
        padding: "8px 10px",
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.45)",
        whiteSpace: "nowrap",
    }
    const td: React.CSSProperties = {
        textAlign: "right",
        padding: "7px 10px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontFamily: mono,
        fontSize: 11.5,
        color: "rgba(255,255,255,0.72)",
        whiteSpace: "nowrap",
    }
    return (
        <motion.div
            variants={slideUp}
            className="adm-glass-platinum"
            style={{ padding: 0, marginBottom: 20 }}
        >
            <div className="adm-subtle-platinum" />
            <HoloCorners color={CYAN} />
            <div style={{ position: "relative", zIndex: 2, padding: "28px 28px 22px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 6,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: CYAN,
                        }}
                    >
                        ⚡ Gasto de IA por nodo
                    </span>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar nodo…"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontSize: 12,
                            color: "#fff",
                            outline: "none",
                            width: 170,
                        }}
                    />
                </div>
                <p
                    style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.38)",
                        margin: "0 0 12px",
                        lineHeight: 1.5,
                    }}
                >
                    Unidades reales del libro mayor por persona · hoy / 7 días /
                    30 días. El costo es de los últimos 30 días (voz en
                    unidades de 1.000 caracteres). Visión es lo que el Espejo
                    MIRA; las dos columnas de imagen son lo que GENERA, en sus
                    dos carriles.
                </p>
                {faltaSql && (
                    <p
                        style={{
                            fontSize: 11,
                            color: "#FF9E5A",
                            margin: "0 0 12px",
                            lineHeight: 1.5,
                        }}
                    >
                        Hay columnas en blanco porque la lectura todavía no las
                        trae. Pega {faltaSql} en el SQL Editor y recarga.
                    </p>
                )}
                {rows === null ? (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        Leyendo el libro mayor…
                    </div>
                ) : fallo ? (
                    <div style={{ fontSize: 12, color: "#FF9E5A" }}>
                        La lectura no llegó. Pega la migración
                        20260805_ia_gasto_por_nodo.sql en el SQL Editor y
                        recarga.
                    </div>
                ) : vis.length === 0 ? (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        Sin gasto registrado en los últimos 30 días.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                /* v1.9 — cuatro columnas más que la versión
                                   original (Imagen Espejo · Imagen Ráfaga ·
                                   Memoria · Comandos) piden más ancho antes de
                                   que el scroll horizontal del contenedor
                                   entre. El contenedor ya tiene overflow-x, así
                                   que en pantalla angosta se desliza sola. */
                                minWidth: 1260,
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ ...th, textAlign: "left" }}>Nodo</th>
                                    {/* 🜂 "h" se leía como HORAS (Zak): es HOY.
                                        Y "Deco" no dice qué cuenta. Las tres
                                        ventanas son hoy · 7 días · 30 días, y
                                        Decodificadores suma las llamadas de
                                        Alimentos (lectura del texto + dictamen,
                                        que son DOS por escaneo) y Sueños. Los
                                        Crop Circles NO entran acá. */}
                                    <th style={th} title="Reflejos del Espejo · hoy · últimos 7 días · últimos 30 días. Incluye los del Modo Ráfaga: comparten el mismo cupo diario y el servidor los anota con la misma llave.">✦ Reflejos hoy·7d·30d</th>
                                    <th style={th} title="Imágenes que el Espejo MIRA cuando alguien le manda una foto. No es generar: eso son las dos columnas de al lado. $0.01 por lectura.">👁 Visión hoy·7d·30d</th>
                                    <th style={th} title="Imágenes GENERADAS por el Espejo original · Reflejo ilustrado · FLUX.2 Pro · $0.03 cada una · tope 2 al día por persona">🎨 Imagen Espejo hoy·7d·30d</th>
                                    <th style={th} title="Imágenes GENERADAS por el Modo Ráfaga · FLUX Schnell · $0.003 cada una · cupo propio de 30 al día por persona">🌀 Imagen Ráfaga hoy·7d·30d</th>
                                    <th style={th} title="Lecturas de voz del Espejo · hoy · 7 días · 30 días">🔊 Voz hoy·7d·30d</th>
                                    <th style={th} title="Llamadas a los Decodificadores (Alimentos: lectura del texto + dictamen = 2 por escaneo · Sueños) en 30 días. No incluye Crop Circles.">⬡ Decodificadores 30d</th>
                                    <th style={th} title="Destilaciones de memoria del Espejo en 30 días. Corre sola cada 4 horas sobre las conversaciones de cada persona. $0.0025 cada una.">🧠 Memoria 30d</th>
                                    <th style={th} title="Frases interpretadas por los comandos de voz en 30 días. Precio mezclado ($0.001): navegar corre un modelo chico y actuar uno grande, y el libro mayor no distingue cuál.">🎙 Comandos 30d</th>
                                    <th style={th}>USD 30d</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vis.slice(0, 80).map((r) => (
                                    <tr key={r.user_key}>
                                        <td
                                            style={{
                                                ...td,
                                                textAlign: "left",
                                                fontFamily: "inherit",
                                                color: "#fff",
                                                maxWidth: 190,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                            title={r.user_key}
                                        >
                                            {r.nombre || r.user_key.slice(0, 14) + "…"}
                                        </td>
                                        <td style={td}>
                                            {r.refl_1} · {r.refl_7} · {r.refl_30}
                                        </td>
                                        <td style={td}>
                                            {r.vis_1} · {r.vis_7} · {r.vis_30}
                                        </td>
                                        <td style={td}>
                                            {r.img_1} · {r.img_7} · {r.img_30}
                                        </td>
                                        <td style={td}>
                                            {r.raf_1} · {r.raf_7} · {r.raf_30}
                                        </td>
                                        <td style={td}>
                                            {r.voz_1} · {r.voz_7} · {r.voz_30}
                                        </td>
                                        <td style={td}>{r.deco_30}</td>
                                        <td style={td}>{r.mem_30}</td>
                                        <td style={td}>{r.cmd_30}</td>
                                        <td style={{ ...td, color: "#5FD68A" }}>
                                            ${r.usd_30.toFixed(2)}
                                            <span
                                                style={{
                                                    color: "rgba(255,255,255,0.35)",
                                                    marginLeft: 6,
                                                    fontSize: 10,
                                                }}
                                            >
                                                ≈{Math.round(r.usd_30 * GASTO_USD_MXN)} MXN
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td
                                        style={{
                                            ...td,
                                            textAlign: "left",
                                            fontFamily: "inherit",
                                            color: CYAN,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {vis.length} nodos
                                    </td>
                                    <td style={td}>{tot.refl}</td>
                                    <td style={td}>{tot.vis}</td>
                                    <td style={td}>{tot.img}</td>
                                    <td style={td}>{tot.raf}</td>
                                    <td style={td}>{tot.voz}</td>
                                    <td style={td}>{tot.deco}</td>
                                    <td style={td}>{tot.mem}</td>
                                    <td style={td}>{tot.cmd}</td>
                                    <td style={{ ...td, color: "#5FD68A", fontWeight: 700 }}>
                                        ${tot.usd.toFixed(2)}
                                        <span
                                            style={{
                                                color: "rgba(255,255,255,0.35)",
                                                marginLeft: 6,
                                                fontSize: 10,
                                            }}
                                        >
                                            ≈{Math.round(tot.usd * GASTO_USD_MXN)} MXN
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

/* ═══ MAIN — AdminDashboard ═══ */
function AdminDashboard({
    userName,
    sbUrl,
    sbKey,
    clerkId,
    explorationEmailWebhookUrl,
}: {
    userName: string
    sbUrl: string
    sbKey: string
    clerkId: string
    explorationEmailWebhookUrl?: string
}) {
    const [mode, setMode] = useState(0)
    const [monthIdx, setMonthIdx] = useState(1)
    const [isNeto, setIsNeto] = useState(0)
    const [expanded, setExpanded] = useState<"inmersion" | "sintonia" | null>(
        null
    )
    const [showMargen, setShowMargen] = useState(false)
    const [showPriv, setShowPriv] = useState(false)
    const isMobile = useIsMobile()
    useScrollHideHeader()
    const [histExpanded, setHistExpanded] = useState(false)
    const [gastosExpanded, setGastosExpanded] = useState(false)
    const anyPanelOpen = !!expanded || histExpanded || gastosExpanded
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape" && expanded) setExpanded(null)
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [expanded])
    useEffect(() => {
        if (!expanded) return
        const h = (e: MouseEvent | TouchEvent) => {
            const ref = expandedRef.current
            if (!ref) return
            const t = e.target as Node | null
            if (t && !ref.contains(t)) setExpanded(null)
        }
        const id = window.setTimeout(() => {
            document.addEventListener("mousedown", h)
            document.addEventListener("touchstart", h, { passive: true })
        }, 0)
        return () => {
            window.clearTimeout(id)
            document.removeEventListener("mousedown", h)
            document.removeEventListener("touchstart", h)
        }
    }, [expanded])
    const { data: db, loading, refetch } = useDash(sbUrl, sbKey, clerkId)
    const [passesRefreshKey, setPassesRefreshKey] = useState(0)
    const { passesThisMonth, passesPrevMonth } = useExplorationPasses(
        sbUrl,
        sbKey,
        passesRefreshKey
    )
    const { oneOneThisMonth, oneOnePrevMonth } = useOneToOneSessions(
        sbUrl,
        sbKey,
        clerkId,
        0
    )
    const [iaUsd30, setIaUsd30] = useState(0)
    const [aP, setAP] = useState(12)
    const [aC, setAC] = useState(8)
    const [aS, setAS] = useState(45)
    const [aB, setAB] = useState(10)
    const [aBP, setABP] = useState(333)
    const isReal = mode === 0
    const expandedRef = React.useRef<HTMLDivElement>(null)
    const [expandedTop, setExpandedTop] = useState(140)
    useEffect(() => {
        if (expanded && expandedRef.current) {
            const r = expandedRef.current.getBoundingClientRect()
            setExpandedTop(r.top + window.scrollY)
        }
    }, [expanded])

    /* ═══ RINGS: _active for Este Mes ═══ */
    let ringP: number, ringC: number, ringS: number
    if (!isReal) {
        ringP = aP
        ringC = aC
        ringS = aS
    } else if (monthIdx === 0) {
        ringP = db.pulsar_rev_prev
        ringC = db.cuasar_rev_prev
        ringS = db.sintonia_rev_prev
    } else if (monthIdx === 1) {
        ringP = db.pulsar_active
        ringC = db.cuasar_active
        ringS = db.sintonia_active
    } else {
        ringP = db.pulsar_renewing
        ringC = db.cuasar_renewing
        ringS = db.sintonia_renewing
    }

    /* ═══ REVENUE: Airbnb model ═══ */
    let booksCount: number,
        booksRev: number,
        passesCount: number,
        passesRev: number
    if (!isReal) {
        booksCount = aB
        booksRev = aB * aBP
        passesCount = 0
        passesRev = 0
    } else if (monthIdx === 0) {
        booksCount = db.books_prev_count
        booksRev = db.books_prev_revenue / 100
        passesCount = passesPrevMonth
        passesRev = passesPrevMonth * P_PASS
    } else if (monthIdx === 1) {
        booksCount = db.books_this_count
        booksRev = db.books_this_revenue / 100
        passesCount = passesThisMonth
        passesRev = passesThisMonth * P_PASS
    } else {
        booksCount = 0
        booksRev = 0
        passesCount = 0
        passesRev = 0
    }

    let inmCobrado: number,
        sintCobrado: number,
        inmPorCobrar: number,
        sintPorCobrar: number
    if (!isReal) {
        /* Arquitecto: proyección pura, count × precio lleno. */
        const rInm = (ringP + ringC) * P_INM,
            rSint = ringS * P_SINT
        inmCobrado = rInm
        sintCobrado = rSint
        inmPorCobrar = 0
        sintPorCobrar = 0
    } else if (monthIdx === 0) {
        /* v1.3 — Mes anterior: revenue real desde payments_log. */
        inmCobrado = db.inmersion_rev_cents_prev / 100
        sintCobrado = db.sintonia_rev_cents_prev / 100
        inmPorCobrar = 0
        sintPorCobrar = 0
    } else if (monthIdx === 1) {
        /* v1.3 — Este mes: cobrado real desde payments_log; por cobrar
           sigue siendo proyección count × precio (renovaciones futuras
           que aún no pagaron este mes). */
        inmCobrado = db.inmersion_rev_cents_this / 100
        sintCobrado = db.sintonia_rev_cents_this / 100
        inmPorCobrar =
            Math.max(
                0,
                db.pulsar_renewing +
                    db.cuasar_renewing -
                    (db.pulsar_rev_this + db.cuasar_rev_this)
            ) * P_INM
        sintPorCobrar =
            Math.max(0, db.sintonia_renewing - db.sintonia_rev_this) * P_SINT
    } else {
        /* Próximo mes: pura proyección (count × precio). */
        const rInm = (ringP + ringC) * P_INM,
            rSint = ringS * P_SINT
        inmCobrado = rInm
        sintCobrado = rSint
        inmPorCobrar = 0
        sintPorCobrar = 0
    }
    const cobrado = inmCobrado + sintCobrado + booksRev + passesRev
    const porCobrar = inmPorCobrar + sintPorCobrar
    const mrrBruto = cobrado + porCobrar
    const totalInm = ringP + ringC
    const neto = isNeto === 1
    const totalTxn = totalInm + ringS + booksCount + passesCount,
        stripeComm = mrrBruto * 0.036 + totalTxn * 3,
        mrrNeto = mrrBruto - stripeComm
    const mrr = neto ? mrrNeto : mrrBruto
    const inmRevTotal = inmCobrado + inmPorCobrar,
        sintRevTotal = sintCobrado + sintPorCobrar
    const mrrInmD = neto
        ? inmRevTotal - (inmRevTotal * 0.036 + totalInm * 3)
        : inmRevTotal
    const mrrSintD = neto
        ? sintRevTotal - (sintRevTotal * 0.036 + ringS * 3)
        : sintRevTotal
    const booksD = neto
        ? booksRev - (booksRev * 0.036 + booksCount * 3)
        : booksRev
    const passesD = neto
        ? passesRev - (passesRev * 0.036 + passesCount * 3)
        : passesRev
    const oneOneBucket: OneToOneMonth = !isReal
        ? EMPTY_1TO1
        : monthIdx === 0
          ? oneOnePrevMonth
          : monthIdx === 1
            ? oneOneThisMonth
            : EMPTY_1TO1
    const oneOneRev = oneOneBucket.totalRevenueCents / 100
    const oneOneCount = oneOneBucket.totalCount
    const oneOneD = neto
        ? oneOneRev - (oneOneRev * 0.036 + oneOneCount * 3)
        : oneOneRev
    const booksList = monthIdx === 0 ? db.books_prev : db.books_this
    const tc: Record<string, number> = {}
    ;(booksList || []).forEach((b: any) => {
        tc[b.title] = (tc[b.title] || 0) + 1
    })
    const monthlyExps = (db.expenses || [])
        .filter((e: any) => e.frequency === "monthly")
        .reduce((s: number, e: any) => s + (+e.amount || 0), 0)
    const annualThisMonth = (db.expenses || [])
        .filter(
            (e: any) =>
                e.frequency === "annual" &&
                (e.billing_month || 1) === db.current_month
        )
        .reduce((s: number, e: any) => s + (+e.amount || 0), 0)
    const annualAvg = (db.expenses || [])
        .filter((e: any) => e.frequency === "annual")
        .reduce((s: number, e: any) => s + (+e.amount || 0) / 12, 0)
    const gastosDelMes = monthlyExps + annualThisMonth,
        gastosAvg = monthlyExps + annualAvg
    const margen = neto ? mrrNeto - gastosDelMes : mrrBruto - gastosDelMes
    const margenAvg = neto ? mrrNeto - gastosAvg : mrrBruto - gastosAvg
    const margenColor = margen >= 0 ? GREEN : "#FF6B6B"
    const monthLabel = ML[isReal ? monthIdx : 1],
        netoLabel = neto ? "Neto" : "Bruto"
    const showAirbnb = isReal && monthIdx === 1

    /* Float sidebar — alineado con panel expandido */
    const floatSidebar = expanded && (
        <motion.div
            className="adm-float-sidebar"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: 0, top: expandedTop }}
        >
            <div
                className="adm-glass"
                style={{
                    padding: "20px 22px 20px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    borderRadius: "0 20px 20px 0",
                    borderLeft: "none",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(0,194,255,0.4)",
                    }}
                >
                    Ingreso ({monthLabel})<br />
                    {netoLabel}
                </p>
                <div>
                    <motion.span
                        key={Math.round(mrr)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            fontSize: 32,
                            fontWeight: 100,
                            color: "#fff",
                            lineHeight: 1,
                            animation: "adm-glow-cyan 6s ease-in-out infinite",
                        }}
                    >
                        ${fmt(Math.round(mrr))}
                    </motion.span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 300,
                            color: "rgba(255,255,255,0.25)",
                            marginLeft: 4,
                        }}
                    >
                        MXN
                    </span>
                </div>
                {showAirbnb && (
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            fontSize: 9,
                            color: "rgba(255,255,255,0.2)",
                        }}
                    >
                        <span>
                            Cobrado:{" "}
                            <span style={{ color: GREEN }}>
                                $
                                {fmt(
                                    Math.round(
                                        neto
                                            ? cobrado - cobrado * 0.036
                                            : cobrado
                                    )
                                )}
                            </span>
                        </span>
                        <span>
                            Por cobrar:{" "}
                            <span style={{ color: GOLD }}>
                                $
                                {fmt(
                                    Math.round(
                                        neto
                                            ? porCobrar - porCobrar * 0.036
                                            : porCobrar
                                    )
                                )}
                            </span>
                        </span>
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "stretch",
                    }}
                >
                    {isReal && (
                        <MultiToggle
                            options={["Ant.", "Este Mes", "Próx."]}
                            value={monthIdx}
                            onChange={setMonthIdx}
                            color={CYAN}
                        />
                    )}
                    <MultiToggle
                        options={["Bruto", "Neto"]}
                        value={isNeto}
                        onChange={setIsNeto}
                        color={CYAN}
                    />
                </div>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    <StatMini
                        label="Cámara Solar"
                        value={`$${fmt(Math.round(mrrInmD + passesD))}`}
                        color={GOLD}
                    />
                    <StatMini
                        label="Sintonía"
                        value={`$${fmt(Math.round(mrrSintD))}`}
                        color={CYAN}
                    />
                    <StatMini
                        label="Códices"
                        value={`$${fmt(Math.round(booksD))}`}
                        color="#8B5CF6"
                    />
                </div>
                {showMargen && (
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: `${margenColor}08`,
                            border: `1px solid ${margenColor}18`,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 4,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 8,
                                    fontWeight: 600,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: `${margenColor}55`,
                                }}
                            >
                                Margen
                            </span>
                            <EyeToggle
                                visible={true}
                                onClick={() => setShowMargen(false)}
                                color={margenColor}
                            />
                        </div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 24,
                                fontWeight: 100,
                                color: margenColor,
                            }}
                        >
                            {margen < 0 ? "−" : ""}$
                            {fmt(Math.abs(Math.round(margen)))}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )

    return (
        <div
            className="adm-root"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: "auto",
                overflowX: "hidden",
                fontFamily: "'Inter',sans-serif",
                color: "#fff",
            }}
        >
            {!isMobile && <NavRevealPin />}
            <AnimatePresence>{floatSidebar}</AnimatePresence>
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                style={{
                    margin: "0 auto",
                    maxWidth: 1100,
                    padding: isMobile ? "54px 14px 60px" : "70px 40px 80px",
                }}
            >
                <motion.div
                    variants={slideUp}
                    style={{ marginBottom: 60 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 0,
                            flexWrap: "wrap",
                            gap: 12,
                            position: "relative",
                        }}
                    >
                        {typeof document !== "undefined" &&
                            createPortal(
                                <div
                                    className="rsv-admin-title"
                                    style={{
                                        position: "fixed",
                                        top: 14,
                                        left: 0,
                                        right: 0,
                                        zIndex: 55,
                                        textAlign: "center",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <h1
                                        style={{
                                            fontFamily:
                                                "'Inter',sans-serif",
                                            fontSize: 15,
                                            fontWeight: 200,
                                            letterSpacing: "0.35em",
                                            textTransform: "uppercase",
                                            color: CYAN,
                                            margin: 0,
                                            textShadow: `0 0 12px rgba(0,194,255,0.3)`,
                                        }}
                                    >
                                        ✦ Telemetría del Núcleo
                                    </h1>
                                    <p
                                        style={{
                                            fontFamily:
                                                "'Inter',sans-serif",
                                            fontSize: 8,
                                            fontWeight: 400,
                                            letterSpacing: "0.2em",
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.35)",
                                            margin: 0,
                                            marginTop: 3,
                                        }}
                                    >
                                        {userName} · Economía Recurrente
                                    </p>
                                </div>,
                                document.body
                            )}
                        {typeof document !== "undefined" &&
                            !isMobile &&
                            !anyPanelOpen &&
                            createPortal(
                                /* v1.2 — Cluster baja a top:84 (antes 62)
                                   para abrir aire respecto al botón ⬡
                                   Escáner + cluster avatar (top:6-14
                                   right:0-60). top:62 quedaba muy
                                   pegado y los tres elementos se leían
                                   como un solo bloque. */
                                <div
                                    className="rsv-admin-toggle"
                                    style={{
                                        position: "fixed",
                                        top: 84,
                                        right: 24,
                                        zIndex: 55,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {isReal && (
                                        <div className="adm-live">
                                            <LiveBadge />
                                        </div>
                                    )}
                                    <MultiToggle
                                        options={["Real", "Arquitecto"]}
                                        value={mode}
                                        onChange={setMode}
                                        color={GREEN}
                                    />
                                </div>,
                                document.body
                            )}
                    </div>
                    {isMobile && !anyPanelOpen && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: 18,
                            }}
                        >
                            <MultiToggle
                                options={["Real", "Arquitecto"]}
                                value={mode}
                                onChange={setMode}
                                color={GREEN}
                            />
                        </div>
                    )}
                    {/* MRR HERO */}
                    {!expanded && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                gap: isMobile ? 14 : 20,
                                justifyContent: "center",
                            }}
                        >
                            <div
                                className="adm-glass"
                                style={{
                                    padding: isMobile
                                        ? "22px 18px"
                                        : "32px 36px",
                                    position: "relative",
                                    overflow: "hidden",
                                    flex: showMargen ? "1" : "none",
                                    width: showMargen ? "auto" : "100%",
                                    maxWidth: showMargen ? "none" : "700px",
                                    transition:
                                        "all 0.5s cubic-bezier(0.16,1,0.3,1)",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        width: "20%",
                                        height: "100%",
                                        background:
                                            "linear-gradient(90deg,transparent,rgba(0,194,255,0.03),transparent)",
                                        animation:
                                            "adm-scan 10s linear infinite",
                                        pointerEvents: "none",
                                    }}
                                />
                                <div
                                    style={{ position: "relative", zIndex: 1 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color: "rgba(0,194,255,0.4)",
                                            }}
                                        >
                                            Ingreso Total ({monthLabel}) —{" "}
                                            {netoLabel}
                                        </p>
                                        {!showMargen && (
                                            <EyeToggle
                                                visible={false}
                                                onClick={() =>
                                                    setShowMargen(true)
                                                }
                                                color={margenColor}
                                            />
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: 8,
                                        }}
                                    >
                                        <motion.span
                                            key={Math.round(mrr)}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                fontSize: isMobile ? 38 : 48,
                                                fontWeight: 100,
                                                color: "#fff",
                                                lineHeight: 1,
                                                animation:
                                                    "adm-glow-cyan 6s ease-in-out infinite",
                                            }}
                                        >
                                            ${fmt(Math.round(mrr))}
                                        </motion.span>
                                        <span
                                            style={{
                                                fontSize: isMobile ? 14 : 16,
                                                fontWeight: 300,
                                                color: "rgba(255,255,255,0.25)",
                                            }}
                                        >
                                            MXN
                                        </span>
                                    </div>
                                    {showAirbnb && (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 20,
                                                marginTop: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "rgba(255,255,255,0.3)",
                                                }}
                                            >
                                                Cobrado:{" "}
                                                <span
                                                    style={{
                                                        color: GREEN,
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    $
                                                    {fmt(
                                                        Math.round(
                                                            neto
                                                                ? cobrado -
                                                                      cobrado *
                                                                          0.036
                                                                : cobrado
                                                        )
                                                    )}
                                                </span>
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "rgba(255,255,255,0.3)",
                                                }}
                                            >
                                                Por cobrar:{" "}
                                                <span
                                                    style={{
                                                        color: GOLD,
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    $
                                                    {fmt(
                                                        Math.round(
                                                            neto
                                                                ? porCobrar -
                                                                      porCobrar *
                                                                          0.036
                                                                : porCobrar
                                                        )
                                                    )}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                    {neto && (
                                        <p
                                            style={{
                                                margin: 0,
                                                marginTop: 6,
                                                fontSize: 10,
                                                color: "rgba(255,255,255,0.15)",
                                            }}
                                        >
                                            Stripe: $
                                            {fmt(Math.round(stripeComm))} (
                                            {totalTxn} txns)
                                        </p>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            marginTop: 16,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {isReal && (
                                            <MultiToggle
                                                options={ML}
                                                value={monthIdx}
                                                onChange={setMonthIdx}
                                                color={CYAN}
                                            />
                                        )}
                                        <MultiToggle
                                            options={["Bruto", "Neto"]}
                                            value={isNeto}
                                            onChange={(v: number) =>
                                                setIsNeto(v)
                                            }
                                            color={CYAN}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 20,
                                            marginTop: 16,
                                        }}
                                    >
                                        <StatMini
                                            label="Cámara Solar"
                                            value={`$${fmt(Math.round(mrrInmD + passesD))}`}
                                            color={GOLD}
                                        />
                                        <StatMini
                                            label="Sintonía"
                                            value={`$${fmt(Math.round(mrrSintD))}`}
                                            color={CYAN}
                                        />
                                        <StatMini
                                            label="Códices"
                                            value={`$${fmt(Math.round(booksD))}`}
                                            color="#8B5CF6"
                                        />
                                    </div>
                                </div>
                            </div>
                            {showMargen && (
                                <motion.div
                                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="adm-glass"
                                    style={{
                                        padding: "32px 36px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        flex: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color: `${margenColor}66`,
                                            }}
                                        >
                                            {margen >= 0 ? "✦ " : "⚠ "}Margen
                                            Operativo — {netoLabel}
                                        </p>
                                        <EyeToggle
                                            visible={true}
                                            onClick={() => setShowMargen(false)}
                                            color={margenColor}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: 8,
                                        }}
                                    >
                                        <motion.span
                                            key={Math.round(margen)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            style={{
                                                fontSize: 48,
                                                fontWeight: 100,
                                                color: margenColor,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {margen < 0 ? "−" : ""}$
                                            {fmt(Math.abs(Math.round(margen)))}
                                        </motion.span>
                                        <span
                                            style={{
                                                fontSize: 16,
                                                fontWeight: 300,
                                                color: "rgba(255,255,255,0.25)",
                                            }}
                                        >
                                            MXN
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            marginTop: 10,
                                            fontSize: 11,
                                            color: "rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        Ingreso: $
                                        {fmt(
                                            Math.round(
                                                neto ? mrrNeto : mrrBruto
                                            )
                                        )}{" "}
                                        − Gastos: $
                                        {fmt(Math.round(gastosDelMes))}
                                    </p>
                                    <div
                                        style={{
                                            marginTop: 16,
                                            display: "flex",
                                            gap: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: "10px 14px",
                                                borderRadius: 10,
                                                background: `${margenColor}08`,
                                                border: `1px solid ${margenColor}18`,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.1em",
                                                    textTransform: "uppercase",
                                                    color: `${margenColor}55`,
                                                }}
                                            >
                                                Avg Mensual
                                            </span>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    marginTop: 4,
                                                    fontSize: 18,
                                                    fontWeight: 200,
                                                    color:
                                                        margenAvg >= 0
                                                            ? GREEN
                                                            : "#FF6B6B",
                                                }}
                                            >
                                                {margenAvg < 0 ? "−" : ""}$
                                                {fmt(
                                                    Math.abs(
                                                        Math.round(margenAvg)
                                                    )
                                                )}
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                padding: "10px 14px",
                                                borderRadius: 10,
                                                background:
                                                    "rgba(255,255,255,0.02)",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.1em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            >
                                                Gastos avg
                                            </span>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    marginTop: 4,
                                                    fontSize: 18,
                                                    fontWeight: 200,
                                                    color: AMBER_C,
                                                }}
                                            >
                                                ${fmt(Math.round(gastosAvg))}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* EXPANDED card */}
                {expanded && (
                    <motion.div
                        ref={expandedRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ marginBottom: 20 }}
                    >
                        <div
                            className={
                                expanded === "inmersion"
                                    ? "adm-glass-gold"
                                    : "adm-glass-cyan"
                            }
                            style={{ padding: 0 }}
                        >
                            <div
                                className={
                                    expanded === "inmersion"
                                        ? "adm-subtle-gold"
                                        : "adm-subtle-cyan"
                                }
                            />
                            <HoloCorners
                                color={expanded === "inmersion" ? GOLD : CYAN}
                            />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    padding: isMobile
                                        ? "20px 16px 0"
                                        : "28px 28px 0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 24,
                                        flexWrap: "wrap",
                                        gap: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color:
                                                    expanded === "inmersion"
                                                        ? "rgba(200,164,78,0.75)"
                                                        : "rgba(0,194,255,0.75)",
                                            }}
                                        >
                                            {expanded === "inmersion"
                                                ? "☀ Cámara Solar"
                                                : "◇ Sintonía Solar"}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                background:
                                                    expanded === "inmersion"
                                                        ? "rgba(200,164,78,0.08)"
                                                        : "rgba(0,194,255,0.05)",
                                                border: `1px solid ${expanded === "inmersion" ? "rgba(200,164,78,0.2)" : "rgba(0,194,255,0.15)"}`,
                                                color:
                                                    expanded === "inmersion"
                                                        ? "rgba(200,164,78,0.55)"
                                                        : "rgba(0,194,255,0.5)",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {expanded === "inmersion"
                                                ? "Límite 44"
                                                : "Sin límite"}
                                        </span>
                                    </div>
                                    <ExpandArrowBtn
                                        expanded={true}
                                        onClick={() => setExpanded(null)}
                                        color={
                                            expanded === "inmersion"
                                                ? GOLD
                                                : CYAN
                                        }
                                    />
                                </div>
                                {expanded === "inmersion" && (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-around",
                                                marginBottom: 24,
                                            }}
                                        >
                                            <EnergyRing
                                                value={ringP}
                                                max={MG}
                                                label="Púlsar"
                                                schedule="12:30 pm"
                                                color={GOLD}
                                                glowColor={GG}
                                                delay={0}
                                            />
                                            <EnergyRing
                                                value={ringC}
                                                max={MG}
                                                label="Cuásar"
                                                schedule="4:30 pm"
                                                color={GL}
                                                glowColor="rgba(232,198,90,0.4)"
                                                delay={0.1}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                borderRadius: 12,
                                                background:
                                                    "rgba(200,164,78,0.04)",
                                                border: "1px solid rgba(200,164,78,0.08)",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    padding: "14px 22px",
                                                }}
                                            >
                                                <div>
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 600,
                                                            letterSpacing:
                                                                "0.14em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "rgba(200,164,78,0.55)",
                                                            display: "block",
                                                        }}
                                                    >
                                                        ✦ Gravedad Base
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 500,
                                                            letterSpacing:
                                                                "0.08em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "rgba(200,164,78,0.35)",
                                                            marginTop: 3,
                                                            display: "block",
                                                        }}
                                                    >
                                                        MRR Inmersión ·
                                                        Recurrente
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "baseline",
                                                        gap: 18,
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 22,
                                                            fontWeight: 200,
                                                            color: GOLD,
                                                            animation:
                                                                "adm-glow-gold 5s ease-in-out infinite",
                                                        }}
                                                    >
                                                        $
                                                        {fmt(
                                                            Math.round(mrrInmD)
                                                        )}{" "}
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: "rgba(200,164,78,0.3)",
                                                            }}
                                                        >
                                                            MXN
                                                        </span>
                                                    </p>
                                                    <span
                                                        style={{
                                                            fontSize: 16,
                                                            fontWeight: 300,
                                                            color: GOLD,
                                                            opacity: 0.75,
                                                        }}
                                                    >
                                                        {totalInm}
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: "rgba(200,164,78,0.35)",
                                                            }}
                                                        >
                                                            /44
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    height: 1,
                                                    background:
                                                        "linear-gradient(90deg, transparent, rgba(200,164,78,0.18), transparent)",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    padding: "14px 22px",
                                                }}
                                            >
                                                <div>
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 600,
                                                            letterSpacing:
                                                                "0.14em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "rgba(200,164,78,0.55)",
                                                            display: "block",
                                                        }}
                                                    >
                                                        ⚡ Gravedad de Ignición
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 500,
                                                            letterSpacing:
                                                                "0.08em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "rgba(200,164,78,0.35)",
                                                            marginTop: 3,
                                                            display: "block",
                                                        }}
                                                    >
                                                        Exploración · Pase
                                                        Único
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "baseline",
                                                        gap: 18,
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 22,
                                                            fontWeight: 200,
                                                            color: GOLD,
                                                            animation:
                                                                "adm-glow-gold 5s ease-in-out infinite",
                                                        }}
                                                    >
                                                        $
                                                        {fmt(
                                                            Math.round(passesD)
                                                        )}{" "}
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: "rgba(200,164,78,0.3)",
                                                            }}
                                                        >
                                                            MXN
                                                        </span>
                                                    </p>
                                                    <span
                                                        style={{
                                                            fontSize: 16,
                                                            fontWeight: 300,
                                                            color: GOLD,
                                                            opacity: 0.75,
                                                        }}
                                                    >
                                                        {passesCount}
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: "rgba(200,164,78,0.35)",
                                                                marginLeft: 4,
                                                            }}
                                                        >
                                                            {passesCount === 1
                                                                ? "pase"
                                                                : "pases"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <AddExplorationPassForm
                                            sbUrl={sbUrl}
                                            sbKey={sbKey}
                                            clerkId={clerkId}
                                            onCreated={() =>
                                                setPassesRefreshKey(
                                                    (k) => k + 1
                                                )
                                            }
                                            emailWebhookUrl={
                                                explorationEmailWebhookUrl
                                            }
                                        />
                                    </>
                                )}
                                {expanded === "sintonia" && (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 6,
                                                marginBottom: 24,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 80,
                                                    fontWeight: 100,
                                                    color: CYAN,
                                                    lineHeight: 1,
                                                    animation:
                                                        "adm-glow-cyan 5s ease-in-out infinite",
                                                }}
                                            >
                                                {ringS}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    letterSpacing: "0.12em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(0,194,255,0.35)",
                                                }}
                                            >
                                                Nodos en Órbita
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "14px 18px",
                                                borderRadius: 12,
                                                background:
                                                    "rgba(0,194,255,0.03)",
                                                border: "1px solid rgba(0,194,255,0.07)",
                                            }}
                                        >
                                            <div>
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        letterSpacing: "0.1em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: "rgba(0,194,255,0.4)",
                                                    }}
                                                >
                                                    MRR Sintonía
                                                </span>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        marginTop: 4,
                                                        fontSize: 22,
                                                        fontWeight: 200,
                                                        color: CYAN,
                                                    }}
                                                >
                                                    ${fmt(Math.round(mrrSintD))}{" "}
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color: "rgba(0,194,255,0.3)",
                                                        }}
                                                    >
                                                        MXN
                                                    </span>
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        letterSpacing: "0.1em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: "rgba(0,194,255,0.4)",
                                                    }}
                                                >
                                                    Precio Unitario
                                                </span>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        marginTop: 4,
                                                        fontSize: 22,
                                                        fontWeight: 200,
                                                        color: CYAN,
                                                    }}
                                                >
                                                    $777{" "}
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color: "rgba(0,194,255,0.3)",
                                                        }}
                                                    >
                                                        MXN
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {isReal && (
                                <div
                                    style={{
                                        borderTop: `1px solid ${expanded === "inmersion" ? "rgba(200,164,78,0.1)" : "rgba(0,194,255,0.08)"}`,
                                    }}
                                >
                                    <DetailPanel
                                        subscribers={db.subscribers}
                                        filter={expanded}
                                        onClose={() => setExpanded(null)}
                                    />
                                </div>
                            )}
                            {expanded === "inmersion" && (
                                <div
                                    style={{
                                        padding: "0 28px 28px",
                                        borderTop:
                                            "1px solid rgba(200,164,78,0.08)",
                                    }}
                                >
                                    <button
                                        onClick={() => setShowPriv(!showPriv)}
                                        style={{
                                            width: "100%",
                                            padding: "16px 0",
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            outline: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color: "rgba(200,164,78,0.35)",
                                            }}
                                        >
                                            Arquitectura de Privilegios Activos
                                        </p>
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="rgba(200,164,78,0.35)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            style={{
                                                transition:
                                                    "transform 0.3s ease",
                                                transform: showPriv
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                            }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {showPriv && (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35 }}
                                                style={{ overflow: "hidden" }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 40,
                                                        paddingTop: 8,
                                                    }}
                                                >
                                                    <PrivCol
                                                        title="Inmersión Solar"
                                                        price="1,999 MXN"
                                                        color={GOLD}
                                                        items={[
                                                            "Cámara Solar en vivo (Púlsar 12:30 · Cuásar 4:30)",
                                                            "Hot Seats y participación directa",
                                                            "Comunidad 22 (WhatsApp)",
                                                            "Sello de Integración PDF",
                                                            "Acceso Total a Bóveda y Simuladores",
                                                        ]}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 1,
                                                            background:
                                                                "rgba(200,164,78,0.08)",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <PrivCol
                                                        title="Sintonía Solar"
                                                        price="599 MXN"
                                                        color={CYAN}
                                                        items={[
                                                            "Grabaciones diferidas 48h",
                                                            "Canal de Emisión Directa",
                                                            "Simuladores Ilimitados",
                                                            "Privilegio de 11% en Códices",
                                                        ]}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* TWO COLUMNS */}
                {!expanded && (
                    <div
                        className="adm-grid-2"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 20,
                            marginBottom: 20,
                        }}
                    >
                        <motion.div
                            variants={slideUp}
                            className="adm-glass-gold"
                            style={{ padding: 0 }}
                        >
                            <div className="adm-subtle-gold" />
                            <HoloCorners color={GOLD} />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    padding: isMobile
                                        ? "22px 18px"
                                        : "32px 28px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 28,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color: "rgba(200,164,78,0.75)",
                                            }}
                                        >
                                            ☀ Cámara Solar
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                background:
                                                    "rgba(200,164,78,0.08)",
                                                border: "1px solid rgba(200,164,78,0.2)",
                                                color: "rgba(200,164,78,0.55)",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Límite 44
                                        </span>
                                    </div>
                                    {isReal && (
                                        <ExpandArrowBtn
                                            expanded={false}
                                            onClick={() =>
                                                setExpanded("inmersion")
                                            }
                                            color={GOLD}
                                        />
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-around",
                                        marginBottom: 28,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <EnergyRing
                                            value={ringP}
                                            max={MG}
                                            label="Púlsar"
                                            schedule="12:30 pm"
                                            color={GOLD}
                                            glowColor={GG}
                                            delay={0.2}
                                        />
                                        {!isReal && (
                                            <NodeInput
                                                value={aP}
                                                onChange={setAP}
                                                max={MG}
                                                color={GOLD}
                                            />
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <EnergyRing
                                            value={ringC}
                                            max={MG}
                                            label="Cuásar"
                                            schedule="4:30 pm"
                                            color={GL}
                                            glowColor="rgba(232,198,90,0.4)"
                                            delay={0.4}
                                        />
                                        {!isReal && (
                                            <NodeInput
                                                value={aC}
                                                onChange={setAC}
                                                max={MG}
                                                color={GL}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: 12,
                                        background: "rgba(200,164,78,0.04)",
                                        border: "1px solid rgba(200,164,78,0.08)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "12px 18px",
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 8,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.14em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(200,164,78,0.5)",
                                                    display: "block",
                                                }}
                                            >
                                                ✦ Gravedad Base
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 500,
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(200,164,78,0.32)",
                                                    marginTop: 2,
                                                    display: "block",
                                                }}
                                            >
                                                MRR Inmersión · Recurrente
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                gap: 14,
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 18,
                                                    fontWeight: 200,
                                                    color: GOLD,
                                                    animation:
                                                        "adm-glow-gold 5s ease-in-out infinite",
                                                }}
                                            >
                                                ${fmt(Math.round(mrrInmD))}{" "}
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "rgba(200,164,78,0.3)",
                                                    }}
                                                >
                                                    MXN
                                                </span>
                                            </p>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 300,
                                                    color: GOLD,
                                                    opacity: 0.75,
                                                }}
                                            >
                                                {totalInm}
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "rgba(200,164,78,0.35)",
                                                    }}
                                                >
                                                    /44
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            height: 1,
                                            background:
                                                "linear-gradient(90deg, transparent, rgba(200,164,78,0.18), transparent)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "12px 18px",
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 8,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.14em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(200,164,78,0.5)",
                                                    display: "block",
                                                }}
                                            >
                                                ⚡ Gravedad de Ignición
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 500,
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                    color: "rgba(200,164,78,0.32)",
                                                    marginTop: 2,
                                                    display: "block",
                                                }}
                                            >
                                                Exploración · Pase Único
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                gap: 14,
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 18,
                                                    fontWeight: 200,
                                                    color: GOLD,
                                                    animation:
                                                        "adm-glow-gold 5s ease-in-out infinite",
                                                }}
                                            >
                                                ${fmt(Math.round(passesD))}{" "}
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "rgba(200,164,78,0.3)",
                                                    }}
                                                >
                                                    MXN
                                                </span>
                                            </p>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 300,
                                                    color: GOLD,
                                                    opacity: 0.75,
                                                }}
                                            >
                                                {passesCount}
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "rgba(200,164,78,0.35)",
                                                        marginLeft: 4,
                                                    }}
                                                >
                                                    {passesCount === 1
                                                        ? "pase"
                                                        : "pases"}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={slideUp}
                            className="adm-glass-cyan"
                            style={{ padding: 0 }}
                        >
                            <div className="adm-subtle-cyan" />
                            <HoloCorners color={CYAN} />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    padding: isMobile
                                        ? "22px 18px"
                                        : "32px 28px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 28,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                color: "rgba(0,194,255,0.75)",
                                            }}
                                        >
                                            ◇ Sintonía Solar
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                background:
                                                    "rgba(0,194,255,0.05)",
                                                border: "1px solid rgba(0,194,255,0.15)",
                                                color: "rgba(0,194,255,0.5)",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Sin límite
                                        </span>
                                    </div>
                                    {isReal && (
                                        <ExpandArrowBtn
                                            expanded={false}
                                            onClick={() =>
                                                setExpanded("sintonia")
                                            }
                                            color={CYAN}
                                        />
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 6,
                                        marginBottom: 28,
                                    }}
                                >
                                    <motion.span
                                        key={ringS}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            fontSize: 80,
                                            fontWeight: 100,
                                            color: CYAN,
                                            lineHeight: 1,
                                            animation:
                                                "adm-glow-cyan 5s ease-in-out infinite",
                                        }}
                                    >
                                        {ringS}
                                    </motion.span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 500,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: "rgba(0,194,255,0.35)",
                                        }}
                                    >
                                        Nodos en Órbita
                                    </span>
                                    {!isReal && (
                                        <div style={{ marginTop: 8 }}>
                                            <NodeInput
                                                value={aS}
                                                onChange={setAS}
                                                max={999}
                                                color={CYAN}
                                            />
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 4,
                                            borderRadius: 2,
                                            marginTop: 16,
                                            background: "rgba(0,194,255,0.07)",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${Math.min((ringS / 100) * 100, 100)}%`,
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                ease: [0.16, 1, 0.3, 1],
                                            }}
                                            style={{
                                                height: "100%",
                                                borderRadius: 2,
                                                background: `linear-gradient(90deg,${CYAN},rgba(0,194,255,0.4))`,
                                                boxShadow: `0 0 10px ${CG}`,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            marginTop: 4,
                                        }}
                                    >
                                        {[0, 50, 100].map((n) => (
                                            <span
                                                key={n}
                                                style={{
                                                    fontSize: 9,
                                                    color: "rgba(255,255,255,0.15)",
                                                }}
                                            >
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background: "rgba(0,194,255,0.03)",
                                        border: "1px solid rgba(0,194,255,0.07)",
                                    }}
                                >
                                    <div>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 600,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: "rgba(0,194,255,0.4)",
                                            }}
                                        >
                                            MRR Sintonía
                                        </span>
                                        <p
                                            style={{
                                                margin: 0,
                                                marginTop: 4,
                                                fontSize: 22,
                                                fontWeight: 200,
                                                color: CYAN,
                                                animation:
                                                    "adm-glow-cyan 5s ease-in-out infinite",
                                            }}
                                        >
                                            ${fmt(Math.round(mrrSintD))}{" "}
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "rgba(0,194,255,0.3)",
                                                }}
                                            >
                                                MXN
                                            </span>
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 600,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: "rgba(0,194,255,0.4)",
                                            }}
                                        >
                                            Precio Unitario
                                        </span>
                                        <p
                                            style={{
                                                margin: 0,
                                                marginTop: 4,
                                                fontSize: 22,
                                                fontWeight: 200,
                                                color: CYAN,
                                            }}
                                        >
                                            $777{" "}
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "rgba(0,194,255,0.3)",
                                                }}
                                            >
                                                MXN
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Transmisión 1:1 (Cámara de Resonancia) */}
                {!expanded && (
                    <motion.div
                        variants={slideUp}
                        className="adm-glass-platinum"
                        style={{ padding: 0, marginBottom: 20 }}
                    >
                        <div className="adm-subtle-platinum" />
                        <HoloCorners color={PLATINUM} />
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                padding: "32px 28px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 24,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: `rgba(${PLATINUM_RGB},0.78)`,
                                        }}
                                    >
                                        ◈ Transmisión 1:1
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            padding: "3px 8px",
                                            borderRadius: 6,
                                            background: `rgba(${PLATINUM_RGB},0.06)`,
                                            border: `1px solid rgba(${PLATINUM_RGB},0.18)`,
                                            color: `rgba(${PLATINUM_RGB},0.5)`,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Canal Privado
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 500,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: `rgba(${PLATINUM_RGB},0.35)`,
                                    }}
                                >
                                    {isReal ? monthLabel : "Arquitecto"}
                                </span>
                            </div>
                            <div
                                className="adm-grid-2"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 20,
                                    alignItems: "stretch",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background: `rgba(${PLATINUM_RGB},0.035)`,
                                        border: `1px solid rgba(${PLATINUM_RGB},0.1)`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 600,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: `rgba(${PLATINUM_RGB},0.45)`,
                                        }}
                                    >
                                        ✦ Gravedad Focal
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 500,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            color: `rgba(${PLATINUM_RGB},0.3)`,
                                            marginTop: 2,
                                            marginBottom: 10,
                                        }}
                                    >
                                        Ingresos 1:1 · Cobrado
                                    </span>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 28,
                                            fontWeight: 200,
                                            color: PLATINUM,
                                            animation:
                                                "adm-glow-platinum 5s ease-in-out infinite",
                                        }}
                                    >
                                        ${fmt(Math.round(oneOneD))}{" "}
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: `rgba(${PLATINUM_RGB},0.32)`,
                                            }}
                                        >
                                            MXN
                                        </span>
                                    </p>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 300,
                                            color: `rgba(${PLATINUM_RGB},0.4)`,
                                            marginTop: 8,
                                        }}
                                    >
                                        {oneOneCount}{" "}
                                        {oneOneCount === 1
                                            ? "transmisión"
                                            : "transmisiones"}{" "}
                                        del mes
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        background: `rgba(${PLATINUM_RGB},0.02)`,
                                        border: `1px solid rgba(${PLATINUM_RGB},0.08)`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 600,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: `rgba(${PLATINUM_RGB},0.45)`,
                                            marginBottom: 4,
                                        }}
                                    >
                                        ◇ Desglose por Duración
                                    </span>
                                    {(
                                        [
                                            {
                                                label: "30 min · Afinación",
                                                b: oneOneBucket.total_30,
                                            },
                                            {
                                                label: "45 min · Recalibración",
                                                b: oneOneBucket.total_45,
                                            },
                                            {
                                                label: "60 min · Reconfiguración",
                                                b: oneOneBucket.total_60,
                                            },
                                        ] as const
                                    ).map((row, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "5px 0",
                                                borderBottom:
                                                    i < 2
                                                        ? `1px solid rgba(${PLATINUM_RGB},0.06)`
                                                        : "none",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 400,
                                                    color: `rgba(${PLATINUM_RGB},0.65)`,
                                                    letterSpacing: "0.04em",
                                                }}
                                            >
                                                {row.label}
                                            </span>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    gap: 14,
                                                    alignItems: "baseline",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 300,
                                                        color: `rgba(${PLATINUM_RGB},0.45)`,
                                                    }}
                                                >
                                                    ×{row.b.count}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 500,
                                                        color: PLATINUM,
                                                        minWidth: 72,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    $
                                                    {fmt(
                                                        Math.round(
                                                            row.b.revenueCents /
                                                                100
                                                        )
                                                    )}{" "}
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            color: `rgba(${PLATINUM_RGB},0.3)`,
                                                        }}
                                                    >
                                                        MXN
                                                    </span>
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {!expanded && (
                    <GastoIaNodos
                        sbUrl={sbUrl}
                        sbKey={sbKey}
                        clerkId={clerkId}
                        onTotal={setIaUsd30}
                    />
                )}
                {!expanded && isReal && (
                    <ExpCard
                        expenses={db.expenses}
                        sbUrl={sbUrl}
                        sbKey={sbKey}
                        clerkId={clerkId}
                        onMutate={refetch}
                        currentMonth={db.current_month}
                        onExpandedChange={setGastosExpanded}
                        iaUsd30={iaUsd30}
                    />
                )}
                {!expanded && isReal && (
                    <div style={{ marginTop: 20 }}>
                        <HistoryPanel
                            sbUrl={sbUrl}
                            sbKey={sbKey}
                            onExpandedChange={setHistExpanded}
                        />
                    </div>
                )}
                {!expanded && (
                    <motion.div
                        variants={slideUp}
                        className="adm-glass"
                        style={{
                            padding: "28px 32px",
                            marginTop: 20,
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 20,
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: "rgba(139,92,246,0.65)",
                                    }}
                                >
                                    ◈ Códices Vendidos
                                </span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        background: "rgba(139,92,246,0.05)",
                                        border: "1px solid rgba(139,92,246,0.12)",
                                        color: "rgba(139,92,246,0.4)",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {isReal ? monthLabel : "Arquitecto"}
                                </span>
                            </div>
                            {!isReal && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: "rgba(255,255,255,0.2)",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Unidades
                                        </span>
                                        <NodeInput
                                            value={aB}
                                            onChange={setAB}
                                            max={999}
                                            color="#8B5CF6"
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: "rgba(255,255,255,0.2)",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            $/Unidad
                                        </span>
                                        <NodeInput
                                            value={aBP}
                                            onChange={setABP}
                                            max={9999}
                                            color="#8B5CF6"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 20,
                                alignItems: "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    minWidth: 140,
                                }}
                            >
                                <motion.span
                                    key={booksCount}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        fontSize: 48,
                                        fontWeight: 100,
                                        color: "#8B5CF6",
                                        lineHeight: 1,
                                    }}
                                >
                                    {booksCount}
                                </motion.span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: "rgba(139,92,246,0.35)",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Frecuencias Transmitidas
                                </span>
                                <p
                                    style={{
                                        margin: 0,
                                        marginTop: 8,
                                        fontSize: 14,
                                        fontWeight: 300,
                                        color: "rgba(255,255,255,0.3)",
                                    }}
                                >
                                    Ingreso:{" "}
                                    <span style={{ color: "#8B5CF6" }}>
                                        ${fmt(Math.round(booksD))}
                                    </span>{" "}
                                    MXN
                                </p>
                            </div>
                            {isReal && Object.keys(tc).length > 0 && (
                                <div
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                        paddingLeft: 20,
                                        borderLeft:
                                            "1px solid rgba(139,92,246,0.08)",
                                    }}
                                >
                                    {Object.entries(tc)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([t, c]) => (
                                            <div
                                                key={t}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 300,
                                                        color: "rgba(255,255,255,0.4)",
                                                    }}
                                                >
                                                    {t}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        color: "#8B5CF6",
                                                    }}
                                                >
                                                    ×{c}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                            {isReal &&
                                Object.keys(tc).length === 0 &&
                                monthIdx !== 2 && (
                                    <div
                                        style={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingLeft: 20,
                                            borderLeft:
                                                "1px solid rgba(139,92,246,0.08)",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "rgba(255,255,255,0.12)",
                                            }}
                                        >
                                            Sin ventas en este período
                                        </span>
                                    </div>
                                )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}

/* ═══ TelemetriaDelNucleoInner — gate de auth + render del Dashboard ═══ */
function TelemetriaDelNucleoInner({
    supabaseUrl,
    supabaseAnonKey,
    explorationEmailWebhookUrl,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    explorationEmailWebhookUrl?: string
}) {
    useInjectAdminCss()
    const { state, userName, clerkId } = useAdminAuth(
        supabaseUrl,
        supabaseAnonKey
    )
    /* v1.3 (2026-05-20) — Rutea según contexto: si Telemetría vive
       bajo `/escaner/*` mantiene modo Escáner; si está en la capa
       Madre va al Núcleo Madre. */
    const nav = () => {
        const inEscaner =
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/escaner")
        const target = inEscaner
            ? "/escaner/nucleo#mifirma"
            : "/nucleo#mifirma"
        if ((window as any).rsvNavigate) (window as any).rsvNavigate(target)
        else window.location.href = target
    }
    if (state === "loading")
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    fontFamily: "'Inter',sans-serif",
                    color: "#fff",
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "2px solid transparent",
                        borderTopColor: GREEN,
                        borderRightColor: "rgba(76,175,80,0.3)",
                    }}
                />
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        fontSize: 12,
                        fontWeight: 300,
                        letterSpacing: "0.2em",
                        color: "rgba(76,175,80,0.5)",
                        textTransform: "uppercase",
                    }}
                >
                    Verificando acceso...
                </motion.p>
            </div>
        )
    if (state === "denied")
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    fontFamily: "'Inter',sans-serif",
                    color: "#fff",
                }}
            >
                <p
                    style={{
                        fontSize: 14,
                        color: "rgba(255,100,100,0.7)",
                        letterSpacing: "0.1em",
                    }}
                >
                    Acceso restringido
                </p>
                <button
                    onClick={nav}
                    style={{
                        padding: "10px 24px",
                        borderRadius: 10,
                        border: "1px solid rgba(0,194,255,0.2)",
                        background: "transparent",
                        color: "rgba(0,194,255,0.7)",
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        fontFamily: "'Inter',sans-serif",
                        outline: "none",
                    }}
                >
                    ← Volver a Mi Núcleo
                </button>
            </div>
        )
    return (
        <AdminDashboard
            userName={userName}
            sbUrl={supabaseUrl}
            sbKey={supabaseAnonKey}
            clerkId={clerkId!}
            explorationEmailWebhookUrl={explorationEmailWebhookUrl}
        />
    )
}

TelemetriaDelNucleoInner.displayName = "TelemetriaDelNucleoInner"

export default TelemetriaDelNucleoInner
