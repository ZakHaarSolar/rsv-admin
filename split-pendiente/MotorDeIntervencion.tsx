// MotorDeIntervencion.tsx v4.7 — CORREOS · BAJA MANUAL POR FILA (Zak 2026-08-11): cada correo del padrón gana un bote de basura que lo saca de la suscripción, dejándolo EXACTAMENTE como si la persona hubiera picado "darme de baja" en el pie de un correo (misma RPC record_email_opt_out, misma categoría "all"). Cambia solo el `p_source` a "motor_admin", para que en la base se distinga después quién lo hizo. Pide confirmación en la misma fila ("¿Sacar del padrón?" + Sí/No), sin ventana aparte: sin ese paso un roce del puntero sacaría a alguien. Tras la baja relee con `force`, porque admin_get_subscribers ya excluye los opt-outs y la memoria de la pestaña seguiría mostrando un correo que ya no está. Va por rpc() con la llave pública y NO por el gateway admin a propósito: esa RPC es pública por diseño (la usa el enlace de baja de los correos, que debe funcionar sin cuenta), así que meterla al gateway no agregaría seguridad y sí rompería el enlace. | v4.6 — CORREOS · botón ACTUALIZAR propio (Zak 2026-08-10): pide el padrón fresco (load force, salta su memoria) sin recargar la página ni tocar lo que las otras pestañas ya cargaron; gira mientras trae. Y la fila del panel de IAs pasa a "Espejo · Matriz Sincrónica" (nombre nuevo del modo, decisión de Zak; ids internos siguen rafaga). | v4.5 — 🜂 EL PANEL DE IAs DICE POR QUÉ: cada tarjeta suma `criterio` (motivo real verificado contra el edge) + las filas que faltaban (Reflejo ilustrado flux-2-pro 2/día · Matriz Sincrónica flux/schnell 30/día · navegación por voz Groq 8b/70b con OpenRouter de respaldo). | v4.4 — memoria en las pestañas que faltaban (Crop Circles, App, pase de IAs, sesiones del Onboarding; badge de versión sin doble consulta); las escrituras piden load(true); vaciar embudo/marcar avisados/publicar versión olvidan sus memorias. Requiere MI_Shared v2.0.
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
import MI_App from "./MI_App.tsx"
import MI_Correos from "./MI_Correos.tsx"
import MI_CropCircles from "./MI_CropCircles.tsx"
import MI_Growth from "./MI_Growth.tsx"
import MI_IAs from "./MI_IAs.tsx"
import MI_Navegacion from "./MI_Navegacion.tsx"

const { AppVersionBadge, BadgeBoundary, BitacoraAvisosPanel, BloqueoEmergenciaPanel } = MI_App
const { CorreosPanel } = MI_Correos
const { CropCirclesPanel } = MI_CropCircles
const { CamaraSolarToggle, GrowthABPanel, OnbFunnelPanel, RachasAnonPanel, SesionesToggle } = MI_Growth
const { IAsPanel } = MI_IAs
const { NavTelemetryView } = MI_Navegacion

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

const HOME_CARDS: { id: Section; label: string; sub: string; glyph: string }[] =
    [
        { id: "tripulantes", label: "Nodos Activos", sub: "Padrón de Tripulantes", glyph: "🛰️" },
        { id: "navegacion", label: "Navegación", sub: "Telemetría de uso", glyph: "🧭" },
        { id: "onboarding", label: "Onboarding", sub: "Embudo de nuevos", glyph: "🚀" },
        { id: "sondas", label: "Sondas", sub: "Preguntas del Radar", glyph: "📡" },
        { id: "protocolos", label: "Calibraciones", sub: "Tomos por pilar", glyph: "✦" },
        { id: "rituales", label: "Rituales", sub: "Sendero + afirmaciones", glyph: "🌅" },
        { id: "wallpapers", label: "Wallpapers", sub: "Anclajes fotónicos", glyph: "🖼️" },
        { id: "biosfera", label: "Biósfera", sub: "Pistas de los nodos", glyph: "🌿" },
        { id: "cropcircles", label: "Crop Circles", sub: "Registro planetario", glyph: "🛸" },
        { id: "correos", label: "Correos", sub: "Padrón + lista Android", glyph: "✉️" },
        { id: "avatares", label: "Avatares", sub: "Avatar + Campo Solar", glyph: "☀️" },
        { id: "cristalizacion", label: "Cristalización", sub: "Tienda de Fotones", glyph: "💎" },
        { id: "comunidad", label: "Comunidad", sub: "Intereses y vínculos", glyph: "🔗" },
        { id: "mensajes", label: "Mensajes", sub: "DM desde el admin", glyph: "✉️" },
        { id: "medallas", label: "Medallas", sub: "Constelaciones", glyph: "🏅" },
        { id: "moderacion", label: "Moderación", sub: "Reportes y bloqueos", glyph: "🛡️" },
        { id: "stickers", label: "Stickers", sub: "Paquetes del chat", glyph: "🎨" },
        { id: "buzones", label: "Buzón", sub: "Ideas de los nodos", glyph: "📥" },
        { id: "soporte", label: "Soporte", sub: "Casos + transferencias", glyph: "🛟" },
        { id: "rachas", label: "Rachas", sub: "Hábitos (anónimo)", glyph: "🔥" },
        { id: "ias", label: "IAs", sub: "Modelos + costos", glyph: "🧠" },
        { id: "espejo", label: "Espejo", sub: "Conversaciones (anónimo)", glyph: "🪞" },
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
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
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
                            transition: "transform .12s, border-color .15s, background .15s",
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
            adminAction(supabaseUrl, supabaseAnonKey, "get_all_protocolos_admin"),
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
            <h1 className="mi-title rsv-admin-title">✦ Motor de Intervención</h1>
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
                        <IAsPanel
                            url={supabaseUrl}
                            apiKey={supabaseAnonKey}
                        />
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
