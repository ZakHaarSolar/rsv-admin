// Red Solar Viva — HologramaDeExpansion.tsx v8.13 (Ola C #4: la escritura de nodos va por el edge admin-node-upsert con token de Clerk verificado + service_role; node_details ya no se escribe con la anon key, la lectura sigue pública. v8.12: Cuando se selecciona un nodo (selectedNode || commandNode) se setea body[data-rsv-holo-node-open] y un CSS global oculta [data-rsv-mobile-nav="bar"] del NavegadorLente — antes la hamburguesa del nav competía visualmente con el botón × del panel del nodo. Cleanup automático al cerrar el panel y al desmontar. v8.11 fix TDZ de toggleExpand/Bird/Select/Command sin cambios.)
// v8: Reactor Central branch, node navigation, sprint checklist,
//     E/ESC/CMD shortcuts, no BackButton, no status tags, no gravedad economica

import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useCallback,
    useMemo,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import NavRevealPin from "./NavRevealPin.tsx"

const MX = {
    cyan: "#00C2FF",
    gold: "#C8A44E",
    red: "#FF4060",
    cyanLine: "rgba(0,194,255,0.12)",
    nodeBg: "rgba(4,10,20,0.65)",
    nodeBorder: "rgba(0,194,255,0.2)",
    textDim: "rgba(180,210,230,0.45)",
}
const AC = MX.cyan

const PANEL_THEMES: Record<
    string,
    {
        bg: string
        border: string
        glow: string
        inputBg: string
        inputBorder: string
    }
> = {
    [MX.cyan]: {
        bg: "linear-gradient(165deg,rgba(0,20,45,0.97) 0%,rgba(0,10,25,0.99) 100%)",
        border: `rgba(0,194,255,0.22)`,
        glow: `0 0 120px rgba(0,194,255,0.06)`,
        inputBg: "rgba(0,194,255,0.05)",
        inputBorder: "rgba(0,194,255,0.15)",
    },
    [MX.gold]: {
        bg: "linear-gradient(165deg,rgba(32,26,12,0.97) 0%,rgba(20,16,6,0.99) 50%,rgba(28,22,10,0.97) 100%)",
        border: `rgba(200,164,78,0.35)`,
        glow: `0 0 80px rgba(200,164,78,0.08),inset 0 0 30px rgba(200,164,78,0.03)`,
        inputBg: "rgba(200,164,78,0.06)",
        inputBorder: "rgba(200,164,78,0.18)",
    },
    [MX.red]: {
        bg: "linear-gradient(165deg,rgba(32,12,18,0.97) 0%,rgba(20,6,10,0.99) 50%,rgba(28,10,14,0.97) 100%)",
        border: `rgba(255,64,96,0.3)`,
        glow: `0 0 80px rgba(255,64,96,0.06),inset 0 0 30px rgba(255,64,96,0.03)`,
        inputBg: "rgba(255,64,96,0.05)",
        inputBorder: "rgba(255,64,96,0.15)",
    },
}
function getPanelTheme(accent: string) {
    return PANEL_THEMES[accent] || PANEL_THEMES[MX.cyan]
}

interface MapNode {
    id: string
    label: string
    subtitle?: string
    x: number
    y: number
    type: "root" | "branch" | "leaf" | "latent"
    parent?: string
    accent?: string
    icon: string
    children?: string[]
    desc?: string
}
interface NodeDetail {
    id: string
    title: string
    subtitle: string
    status: "active" | "developing" | "incubating"
    pulse_text: string
    mrr: number
    price: string
    active_nodes: number
    trajectory: string
    source_code: string
    sprints: { id: string; text: string }[]
}

async function sbFetchNode(
    url: string,
    key: string,
    nodeId: string
): Promise<NodeDetail | null> {
    if (!url || !key) return null
    try {
        const r = await fetch(
            `${url}/rest/v1/node_details?id=eq.${nodeId}&select=*`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` } }
        )
        if (!r.ok) return null
        const rows = await r.json()
        return rows?.[0] || null
    } catch {
        return null
    }
}
async function sbUpsertNode(
    url: string,
    key: string,
    data: NodeDetail
): Promise<boolean> {
    if (!url || !key) return false
    try {
        // Ola C #4: la escritura va por el edge admin-node-upsert, que verifica
        // el token de Clerk del admin y escribe con service_role. node_details
        // ya no acepta escritura con la anon key (RLS lo bloquea). La lectura
        // (sbFetchNode) sigue pública.
        const token = await (window as any).Clerk?.session?.getToken?.()
        const node = {
            ...data,
            sprints: JSON.stringify(data.sprints || []),
            updated_at: new Date().toISOString(),
        }
        const r = await fetch(`${url}/functions/v1/admin-node-upsert`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token, node }),
        })
        return r.ok
    } catch {
        return false
    }
}

const NODE_R: Record<string, number> = {
    root: 100,
    branch: 60,
    leaf: 50,
    latent: 50,
}

const NODES: MapNode[] = [
    {
        id: "centro",
        label: "Sala de Comando",
        subtitle: "Centro de Gravedad",
        x: 0,
        y: 0,
        type: "root",
        icon: "reactor",
        children: [
            "camaras",
            "simuladores",
            "biblioteca",
            "fragmentos",
            "orbitas",
            "escaner",
            "reactor-central",
            "estacion-mando",
            "lente",
        ],
        desc: "Núcleo operativo de Red Solar Viva.",
    },
    /* ═══ VECTORES DEL ARQUITECTO ═══
       Los dos canales primarios a través de los cuales Diego
       interactúa con el holograma. Flanquean el centro en la
       línea equatorial — máxima prioridad visual. */
    {
        id: "estacion-mando",
        label: "Estación de Mando",
        subtitle: "Reactor de Creación Profunda",
        x: -380,
        y: 0,
        type: "branch",
        parent: "centro",
        accent: MX.cyan,
        icon: "command-station",
        desc: "MacBook del Arquitecto. Donde se forja el silicio línea por línea.",
    },
    {
        id: "lente",
        label: "El Lente",
        subtitle: "Sensor Táctico de Campo",
        x: 380,
        y: 0,
        type: "branch",
        parent: "centro",
        accent: MX.cyan,
        icon: "lens-sensor",
        desc: "iPhone/Android del Arquitecto. Ojo en movimiento sobre el campo en vivo.",
    },
    {
        id: "camaras",
        label: "Cámaras de Sintonización",
        subtitle: "Transformación y Voltaje",
        x: -750,
        y: -480,
        type: "branch",
        parent: "centro",
        icon: "chambers",
        children: ["camara-solar", "camara-resonancia", "camara-meditacion"],
        desc: "Espacios de transmutación directa.",
    },
    {
        id: "simuladores",
        label: "Simuladores",
        subtitle: "Inmersión y Calibración",
        x: 760,
        y: -460,
        type: "branch",
        parent: "centro",
        icon: "sim-gate",
        children: ["navegante", "academia"],
        desc: "Entornos de inmersión.",
    },
    {
        id: "biblioteca",
        label: "Códices de Luz",
        subtitle: "Archivo de Memoria Solar",
        x: -180,
        y: -580,
        type: "branch",
        parent: "centro",
        icon: "codex-temple",
        accent: MX.gold,
        children: ["codices-zakhaar", "codices-aquariia"],
        desc: "Lees para desbloquear lo que ya sabes.",
    },
    {
        id: "fragmentos",
        label: "Fragmentos del Sol",
        subtitle: "Serie Audiovisual",
        x: 320,
        y: -460,
        type: "branch",
        parent: "centro",
        icon: "film-temple",
        desc: "Episodios audiovisuales de activación.",
    },
    {
        id: "orbitas",
        label: "Órbitas de Frecuencia",
        subtitle: "Membresías y Expansión",
        x: 0,
        y: 560,
        type: "branch",
        parent: "centro",
        icon: "orbit-gate",
        children: ["inmersion", "sintonia"],
        desc: "Los niveles de compromiso con la Red.",
    },
    {
        id: "escaner",
        label: "Escáner Vibracional",
        subtitle: "Diagnóstico de Campo",
        x: -500,
        y: 200,
        type: "branch",
        parent: "centro",
        icon: "scanner-pillar",
        accent: MX.red,
        children: ["decodificador-materia"],
        desc: "Diagnóstico de tu campo energético en tiempo real.",
    },
    {
        id: "decodificador-materia",
        label: "Decodificador de Materia",
        subtitle: "Análisis de Código Molecular",
        x: -800,
        y: 480,
        type: "latent",
        parent: "escaner",
        icon: "decoder-matter",
        accent: MX.red,
        desc: "Decodifica el voltaje real de la materia que ingresa al sistema biológico.",
    },
    /* ═══ DIMENSIÓN DE CREADORES ═══ */
    {
        id: "reactor-central",
        label: "El Reactor Central",
        subtitle: "Cuarto de Máquinas",
        x: 700,
        y: 280,
        type: "branch",
        parent: "centro",
        icon: "reactor-core",
        accent: MX.red,
        children: ["telemetria-nodo", "motor-intervencion", "holograma-nodo"],
        desc: "Donde se modifican las leyes de la física del ecosistema.",
    },
    {
        id: "telemetria-nodo",
        label: "Telemetría del Núcleo",
        subtitle: "Flujo Económico y Retención",
        x: 500,
        y: 560,
        type: "leaf",
        parent: "reactor-central",
        /* Azul: el nodo mide el flujo económico pero NO deja ingresos
           en sí mismo. El oro se reserva para nodos monetizables. */
        accent: MX.cyan,
        icon: "telemetria-core",
        desc: "Panel de control financiero y métricas de retención de la Red.",
    },
    {
        id: "motor-intervencion",
        label: "Motor de Intervención",
        subtitle: "Forja de Herramientas de Avatar",
        x: 900,
        y: 560,
        type: "leaf",
        parent: "reactor-central",
        /* Azul: ya funciona al 100%. El rojo se reserva para nodos en
           desarrollo activo. */
        accent: MX.cyan,
        icon: "motor-forge",
        desc: "Donde se forjan las sondas y herramientas para intervenir en el campo del Avatar.",
    },
    {
        id: "holograma-nodo",
        label: "Holograma de Expansión",
        subtitle: "El Mapa Fractal",
        x: 700,
        y: 700,
        type: "leaf",
        parent: "reactor-central",
        accent: MX.cyan,
        icon: "holograma-fractal",
        desc: "Mapa neuronal recursivo de la Red Solar Viva. Estás aquí.",
    },
    /* ═══ END DIMENSIÓN DE CREADORES ═══ */
    {
        id: "camara-solar",
        label: "Cámara Solar",
        subtitle: "Sesiones Grupales",
        x: -1250,
        y: -800,
        type: "leaf",
        parent: "camaras",
        accent: MX.gold,
        icon: "solar-chamber",
        desc: "Encuentros semanales en vivo.",
    },
    {
        id: "camara-resonancia",
        label: "Cámara de Resonancia",
        subtitle: "Sesiones 1:1",
        x: -580,
        y: -880,
        type: "leaf",
        parent: "camaras",
        accent: MX.gold,
        icon: "prism-temple",
        desc: "Precisión láser para tu geometría personal.",
    },
    {
        id: "camara-meditacion",
        label: "Cámara de Meditación",
        subtitle: "Sintonías Guiadas",
        x: -1180,
        y: -350,
        type: "leaf",
        parent: "camaras",
        accent: MX.gold,
        icon: "meditation-temple",
        desc: "Sintonías y guías meditativas.",
    },
    {
        id: "navegante",
        label: "Navegante de la Red",
        subtitle: "Simulador Activo",
        x: 1200,
        y: -460,
        type: "leaf",
        parent: "simuladores",
        icon: "game-temple",
        desc: "Juego interactivo de navegación frecuencial.",
    },
    {
        id: "academia",
        label: "Universo Interactivo",
        subtitle: "Centro de Exploración",
        x: 1250,
        y: -220,
        type: "latent",
        parent: "simuladores",
        icon: "universe-temple",
        accent: MX.red,
        desc: "Simulador multijugador masivo.",
    },
    {
        id: "inmersion",
        label: "Inmersión Solar",
        subtitle: "44 Nodos Sellados",
        x: -460,
        y: 900,
        type: "leaf",
        parent: "orbitas",
        accent: MX.gold,
        icon: "seal-gate",
        desc: "El núcleo sellado.",
    },
    {
        id: "sintonia",
        label: "Sintonía Solar",
        subtitle: "Órbita de Escala Infinita",
        x: 460,
        y: 900,
        type: "leaf",
        parent: "orbitas",
        accent: MX.red,
        icon: "infinity-gate",
        children: ["panel-armonizacion", "destilados"],
        desc: "La órbita que escala sin límites.",
    },
    {
        id: "panel-armonizacion",
        label: "Panel de Armonización",
        subtitle: "Vibracional",
        x: 280,
        y: 1240,
        type: "leaf",
        parent: "sintonia",
        icon: "scanner-pillar",
        desc: "Rastrea tu densidad y alineación.",
    },
    {
        id: "destilados",
        label: "Destilados de la Cámara",
        subtitle: "Transmisiones con IA",
        x: 700,
        y: 1240,
        type: "leaf",
        parent: "sintonia",
        icon: "distill-temple",
        desc: "Pulso destilado de cada sesión grupal.",
    },
    /* ═══ RAMAS DE CÓDICES — ZAK & AQUA ═══
       Los dos Arquitectos de la biblioteca solar. Zak'Haar (Diego) canaliza
       la rama solar/dorada; Aqua'Riia (su pareja) canaliza la rama
       acuática/cyan. Cada uno tiene sus propios códices como hijos. */
    {
        id: "codices-zakhaar",
        label: "Zak'Haar",
        subtitle: "Rama Solar · Arquitecto",
        x: -320,
        y: -880,
        type: "branch",
        parent: "biblioteca",
        accent: MX.gold,
        icon: "zakhaar-sun",
        children: [
            "codice-zak-1",
            "codice-zak-2",
            "codice-zak-3",
            "codice-zak-4",
            "codice-zak-5",
            "codice-zak-6",
            "codice-zak-7",
            "codice-zak-8",
            "codice-zak-9",
        ],
        desc: "Los códices canalizados por Zak'Haar — transmisiones directas del Sol Central.",
    },
    {
        id: "codices-aquariia",
        label: "Aqua'Riia",
        subtitle: "Rama Acuática · Arquitecta",
        x: 320,
        y: -880,
        type: "branch",
        parent: "biblioteca",
        accent: MX.cyan,
        icon: "aquariia-water",
        children: ["codice-aqua-1", "codice-aqua-2"],
        desc: "Los códices canalizados por Aqua'Riia — transmisiones del Acuífero de Luz.",
    },
    /* ─── 9 códices de Zak'Haar (arco sobre su nodo) ─── */
    {
        id: "codice-zak-1",
        label: "Códice 1",
        subtitle: "Zak'Haar",
        x: -565,
        y: -1020,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 1 de la rama solar.",
    },
    {
        id: "codice-zak-2",
        label: "Códice 2",
        subtitle: "Zak'Haar",
        x: -520,
        y: -1080,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 2 de la rama solar.",
    },
    {
        id: "codice-zak-3",
        label: "Códice 3",
        subtitle: "Zak'Haar",
        x: -460,
        y: -1125,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 3 de la rama solar.",
    },
    {
        id: "codice-zak-4",
        label: "Códice 4",
        subtitle: "Zak'Haar",
        x: -390,
        y: -1150,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 4 de la rama solar.",
    },
    {
        id: "codice-zak-5",
        label: "Códice 5",
        subtitle: "Zak'Haar",
        x: -320,
        y: -1160,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 5 de la rama solar.",
    },
    {
        id: "codice-zak-6",
        label: "Códice 6",
        subtitle: "Zak'Haar",
        x: -250,
        y: -1150,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 6 de la rama solar.",
    },
    {
        id: "codice-zak-7",
        label: "Códice 7",
        subtitle: "Zak'Haar",
        x: -180,
        y: -1125,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 7 de la rama solar.",
    },
    {
        id: "codice-zak-8",
        label: "Códice 8",
        subtitle: "Zak'Haar",
        x: -120,
        y: -1080,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 8 de la rama solar.",
    },
    {
        id: "codice-zak-9",
        label: "Códice 9",
        subtitle: "Zak'Haar",
        x: -75,
        y: -1020,
        type: "leaf",
        parent: "codices-zakhaar",
        accent: MX.gold,
        icon: "codice-fractal",
        desc: "Códice 9 de la rama solar.",
    },
    /* ─── 2 códices de Aqua'Riia (flanqueando su nodo) ─── */
    {
        id: "codice-aqua-1",
        label: "Códice 1",
        subtitle: "Aqua'Riia",
        x: 165,
        y: -1035,
        type: "leaf",
        parent: "codices-aquariia",
        accent: MX.cyan,
        icon: "codice-fractal",
        desc: "Códice 1 de la rama acuática.",
    },
    {
        id: "codice-aqua-2",
        label: "Códice 2",
        subtitle: "Aqua'Riia",
        x: 475,
        y: -1035,
        type: "leaf",
        parent: "codices-aquariia",
        accent: MX.cyan,
        icon: "codice-fractal",
        desc: "Códice 2 de la rama acuática.",
    },
]

const CSS = String.raw`
@keyframes mde-pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.04)}}
@keyframes mde-glow{0%,100%{filter:drop-shadow(0 0 10px rgba(0,194,255,0.3))}50%{filter:drop-shadow(0 0 25px rgba(0,194,255,0.55))}}
@keyframes mde-rain{0%{transform:translateY(-30px);opacity:0}10%{opacity:0.7}90%{opacity:0.7}100%{transform:translateY(calc(100vh + 30px));opacity:0}}
@keyframes mde-latent{0%,100%{opacity:0.5;transform:scale(0.97)}50%{opacity:0.75;transform:scale(1.01)}}
@keyframes mde-breathe{0%,100%{filter:brightness(1) drop-shadow(0 0 18px rgba(0,194,255,0.35))}50%{filter:brightness(1.25) drop-shadow(0 0 40px rgba(0,194,255,0.6))}}
@keyframes mde-gold-breathe{0%,100%{filter:brightness(1) drop-shadow(0 0 18px rgba(200,164,78,0.35))}50%{filter:brightness(1.25) drop-shadow(0 0 40px rgba(200,164,78,0.6))}}
@keyframes mde-red-breathe{0%,100%{filter:brightness(1) drop-shadow(0 0 18px rgba(255,64,96,0.35))}50%{filter:brightness(1.25) drop-shadow(0 0 40px rgba(255,64,96,0.6))}}
@keyframes mde-hud-scan{0%{top:-2px;opacity:0}10%{opacity:0.3}90%{opacity:0.3}100%{top:100%;opacity:0}}
.mde-canvas{cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}.mde-canvas:active{cursor:grabbing}.mde-canvas *{font-family:'Inter',sans-serif}
.mde-node{position:absolute;cursor:pointer;transition:filter 0.4s ease}.mde-node:hover{filter:brightness(1.3) !important}
.mde-root{scrollbar-width:none;-ms-overflow-style:none;overflow:hidden}.mde-root::-webkit-scrollbar{display:none}
html:has(.mde-root),html:has(.mde-root) body{scrollbar-width:none;-ms-overflow-style:none;overflow:hidden}
html:has(.mde-root)::-webkit-scrollbar,html:has(.mde-root) body::-webkit-scrollbar{display:none}
.mde-root textarea{scrollbar-width:none;-ms-overflow-style:none}.mde-root textarea::-webkit-scrollbar{display:none}
/* v8.12 — cuando hay un nodo seleccionado en el Holograma, escondemos el
   NavegadorLente para que la hamburguesa no compita visualmente con el
   botón × del panel del nodo. El attr lo setea/quita un useEffect dentro
   del componente. */
body[data-rsv-holo-node-open="1"] [data-rsv-mobile-nav="bar"]{display:none !important}
`
function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "mde-css-v81"
        ;["mde-css-v80"].forEach((o) => {
            const el = document.getElementById(o)
            if (el) el.remove()
        })
        let el = document.getElementById(id) as HTMLStyleElement | null
        if (el) {
            el.textContent = CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = CSS
        document.head.appendChild(s)
    }, [])
}

/* ═══ MATRIX INTRO ═══ */
function MatrixIntro({ onComplete }: { onComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>(0)
    const [phase, setPhase] = useState<"rain" | "title" | "done">("rain")
    useEffect(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext("2d")
        if (!ctx) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const resize = () => {
            c.width = Math.floor(c.clientWidth * dpr)
            c.height = Math.floor(c.clientHeight * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        const glyphs = "アイウエオカキクケコ01∞◇△▽⬡✦◈".split("")
        const fs = 16
        const cols = Math.max(1, Math.floor(c.clientWidth / fs))
        const drops = Array.from({ length: cols }, () =>
            Math.floor(Math.random() * 20)
        )
        const step = () => {
            const w = c.clientWidth,
                h = c.clientHeight
            ctx.fillStyle = "rgba(0,0,0,0.08)"
            ctx.fillRect(0, 0, w, h)
            ctx.font = `${fs}px monospace`
            ctx.textBaseline = "top"
            for (let i = 0; i < cols; i++) {
                if (Math.random() > 0.92) continue
                const x = i * fs,
                    y = drops[i] * fs
                ctx.fillStyle = `hsl(195,100%,${40 + Math.random() * 20}%)`
                ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], x, y)
                if (y > h && Math.random() > 0.975) drops[i] = 0
                else drops[i] += 1.2
            }
            rafRef.current = requestAnimationFrame(step)
        }
        rafRef.current = requestAnimationFrame(step)
        const t1 = setTimeout(() => setPhase("title"), 600)
        const t2 = setTimeout(() => setPhase("done"), 1400)
        const t3 = setTimeout(onComplete, 1600)
        return () => {
            cancelAnimationFrame(rafRef.current)
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [onComplete])
    return (
        <motion.div
            animate={{ opacity: phase === "done" ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#000",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
            <AnimatePresence>
                {phase === "title" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 2,
                        }}
                    >
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{
                                fontFamily: "monospace",
                                fontSize: 38,
                                fontWeight: 200,
                                letterSpacing: "0.3em",
                                textTransform: "uppercase",
                                color: AC,
                                textShadow: `0 0 30px ${AC}60`,
                                margin: 0,
                            }}
                        >
                            ACCESS GRANTED
                        </motion.h1>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ═══ SVG PORTALS ═══ */
function PortalSVG({
    icon,
    size,
    color,
}: {
    icon: string
    size: number
    color: string
}) {
    const gc = color
    switch (icon) {
        case "reactor":
            return (
                <svg
                    viewBox="0 0 200 200"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <circle
                        cx="100"
                        cy="100"
                        r="96"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="88"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.18"
                        strokeDasharray="6 4"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 100 100"
                            to="360 100 100"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <polygon
                        points="100,22 168,56 168,144 100,178 32,144 32,56"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                    />
                    <polygon
                        points="100,55 135,75 135,125 100,145 65,125 65,75"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="28"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <circle cx="100" cy="100" r="10" fill={gc} opacity="0.2" />
                    <circle cx="100" cy="100" r="5" fill={gc} opacity="0.6" />
                    <circle
                        cx="100"
                        cy="100"
                        r="2.5"
                        fill="#fff"
                        opacity="0.9"
                    />
                </svg>
            )
        case "solar-chamber":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {[60, 50, 40, 30].map((r, i) => (
                        <circle
                            key={r}
                            cx="80"
                            cy="80"
                            r={r}
                            stroke={gc}
                            strokeWidth={i === 0 ? "0.8" : "1"}
                            opacity={0.15 + i * 0.08}
                        />
                    ))}
                    <circle
                        cx="80"
                        cy="80"
                        r="20"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.08"
                    />
                    <circle cx="80" cy="80" r="10" fill={gc} opacity="0.3" />
                    <circle cx="80" cy="80" r="4" fill={gc} opacity="0.7" />
                    {Array.from({ length: 12 }).map((_, i) => {
                        const a = (i * 30 * Math.PI) / 180
                        return (
                            <line
                                key={i}
                                x1={80 + Math.cos(a) * 24}
                                y1={80 + Math.sin(a) * 24}
                                x2={80 + Math.cos(a) * (38 + (i % 3) * 4)}
                                y2={80 + Math.sin(a) * (38 + (i % 3) * 4)}
                                stroke={gc}
                                strokeWidth={i % 3 === 0 ? "2" : "1"}
                                opacity={i % 3 === 0 ? 0.45 : 0.25}
                                strokeLinecap="round"
                            />
                        )
                    })}
                </svg>
            )
        case "chambers":
            return (
                <svg
                    viewBox="0 0 160 180"
                    style={{ width: size * 0.8, height: size * 0.9 }}
                    fill="none"
                >
                    {/* Marco hex con pulso sutil */}
                    <polygon
                        points="80,8 150,50 150,140 80,170 10,140 10,50"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.03"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.55;0.4"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* Aura dashed rotando — respira la cámara */}
                    <polygon
                        points="80,18 140,55 140,135 80,160 20,135 20,55"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.15"
                        strokeDasharray="3 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 90"
                            to="360 80 90"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* 3 cámaras con pulso desfasado */}
                    <rect
                        x="30"
                        y="80"
                        width="24"
                        height="40"
                        rx="12"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.06"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.35;0.55;0.35"
                            dur="3.2s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    <rect
                        x="68"
                        y="75"
                        width="24"
                        height="48"
                        rx="12"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.08"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.45;0.7;0.45"
                            dur="3.2s"
                            begin="0.5s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    <rect
                        x="106"
                        y="80"
                        width="24"
                        height="40"
                        rx="12"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.06"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.35;0.55;0.35"
                            dur="3.2s"
                            begin="1s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    {/* Sol arriba pulsante */}
                    <circle
                        cx="80"
                        cy="38"
                        r="8"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <circle cx="80" cy="38" r="3" fill={gc} opacity="0.5">
                        <animate
                            attributeName="r"
                            values="3;4.2;3"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            )
        case "prism-temple":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <polygon
                        points="80,15 140,110 20,110"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    <polygon
                        points="80,100 55,55 105,55"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle
                        cx="80"
                        cy="72"
                        r="8"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <circle cx="80" cy="72" r="3" fill={gc} opacity="0.45" />
                </svg>
            )
        case "meditation-temple":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <path
                        d="M40,100 Q40,30 80,25 Q120,30 120,100"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    <line
                        x1="40"
                        y1="100"
                        x2="40"
                        y2="135"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    <line
                        x1="120"
                        y1="100"
                        x2="120"
                        y2="135"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    {[15, 25, 35, 45].map((r) => (
                        <circle
                            key={r}
                            cx="80"
                            cy="75"
                            r={r}
                            stroke={gc}
                            strokeWidth="0.5"
                            opacity={0.22 - r * 0.003}
                            fill="none"
                            strokeDasharray="2 5"
                        />
                    ))}
                    <circle cx="80" cy="55" r="3" fill={gc} opacity="0.45" />
                </svg>
            )
        case "sim-gate":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Aura dashed rotando */}
                    <circle
                        cx="80"
                        cy="80"
                        r="74"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.15"
                        strokeDasharray="2 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="50s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="80"
                        cy="80"
                        r="65"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    {/* Elipse horizontal rotando */}
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="65"
                        ry="25"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.28"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="18s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    {/* Elipse vertical rotando en sentido contrario */}
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="25"
                        ry="65"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.28"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 80 80"
                            to="0 80 80"
                            dur="22s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    <circle
                        cx="80"
                        cy="80"
                        r="22"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle cx="80" cy="80" r="5" fill={gc} opacity="0.35">
                        <animate
                            attributeName="r"
                            values="5;7;5"
                            dur="2.6s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="80" cy="80" r="2" fill={gc} opacity="0.7" />
                </svg>
            )
        case "codex-temple":
            return (
                <svg
                    viewBox="0 0 180 150"
                    style={{ width: size * 1.1, height: size * 0.92 }}
                    fill="none"
                >
                    {/* Aura dashed rotando sobre el tomo */}
                    <ellipse
                        cx="90"
                        cy="78"
                        rx="88"
                        ry="68"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="3 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 78"
                            to="360 90 78"
                            dur="55s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    {/* Página izquierda con pulso */}
                    <path
                        d="M90,30 L14,18 L14,128 L90,135Z"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.04"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.35;0.55;0.35"
                            dur="3.6s"
                            repeatCount="indefinite"
                        />
                    </path>
                    {/* Página derecha con pulso desfasado */}
                    <path
                        d="M90,30 L166,18 L166,128 L90,135Z"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.04"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.35;0.55;0.35"
                            dur="3.6s"
                            begin="1.8s"
                            repeatCount="indefinite"
                        />
                    </path>
                    {/* Lomo — brillante y pulsante */}
                    <line
                        x1="90"
                        y1="26"
                        x2="90"
                        y2="138"
                        stroke={gc}
                        strokeWidth="2.5"
                        opacity="0.35"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.35;0.7;0.35"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </line>
                    {/* Lumen central del lomo */}
                    <circle cx="90" cy="80" r="4" fill={gc} opacity="0.5">
                        <animate
                            attributeName="r"
                            values="4;6;4"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="90" cy="80" r="1.8" fill="#fff" opacity="0.9" />
                </svg>
            )
        case "film-temple":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Aura rotando */}
                    <circle
                        cx="80"
                        cy="80"
                        r="74"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="2 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="55s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Rollo de film con pulso */}
                    <rect
                        x="30"
                        y="25"
                        width="100"
                        height="70"
                        rx="4"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.03"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.55;0.4"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    {/* Perforaciones del film */}
                    {[35, 50, 65, 80].map((y) => (
                        <React.Fragment key={y}>
                            <circle
                                cx="36"
                                cy={y}
                                r="2.5"
                                stroke={gc}
                                strokeWidth="1"
                                opacity="0.3"
                            />
                            <circle
                                cx="124"
                                cy={y}
                                r="2.5"
                                stroke={gc}
                                strokeWidth="1"
                                opacity="0.3"
                            />
                        </React.Fragment>
                    ))}
                    {/* Play triangle con pulso */}
                    <polygon
                        points="70,40 70,75 95,57"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.55"
                        fill={gc}
                        fillOpacity="0.12"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.55;0.85;0.55"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* Barras de audio — oscilan */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
                        const h = 8 + Math.sin(i * 0.8) * 12
                        return (
                            <line
                                key={i}
                                x1={45 + i * 6}
                                y1={115 - h / 2}
                                x2={45 + i * 6}
                                y2={115 + h / 2}
                                stroke={gc}
                                strokeWidth="2"
                                opacity={0.2 + Math.sin(i * 0.6) * 0.12}
                                strokeLinecap="round"
                            >
                                <animate
                                    attributeName="opacity"
                                    values={`${(0.2 + Math.sin(i * 0.6) * 0.12).toFixed(2)};${(0.45 + Math.sin(i * 0.6) * 0.2).toFixed(2)};${(0.2 + Math.sin(i * 0.6) * 0.12).toFixed(2)}`}
                                    dur={`${1.8 + (i % 3) * 0.4}s`}
                                    begin={`${(i * 0.12).toFixed(2)}s`}
                                    repeatCount="indefinite"
                                />
                            </line>
                        )
                    })}
                </svg>
            )
        case "game-temple":
            return (
                <svg
                    viewBox="0 0 160 140"
                    style={{ width: size, height: size * 0.875 }}
                    fill="none"
                >
                    <rect
                        x="20"
                        y="15"
                        width="120"
                        height="85"
                        rx="6"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    <path
                        d="M26,25 L32,25 M26,25 L26,31"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <path
                        d="M134,25 L128,25 M134,25 L134,31"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <path
                        d="M26,90 L32,90 M26,90 L26,84"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <path
                        d="M134,90 L128,90 M134,90 L134,84"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <path
                        d="M75,40 L75,65 M68,50 L82,50"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        strokeLinecap="round"
                    />
                </svg>
            )
        case "universe-temple":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="65"
                        ry="25"
                        stroke={gc}
                        strokeWidth="1.2"
                        opacity="0.3"
                        transform="rotate(-25 80 80)"
                    />
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="65"
                        ry="25"
                        stroke={gc}
                        strokeWidth="1.2"
                        opacity="0.3"
                        transform="rotate(25 80 80)"
                    />
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="65"
                        ry="25"
                        stroke={gc}
                        strokeWidth="1.2"
                        opacity="0.3"
                        transform="rotate(90 80 80)"
                    />
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.15"
                    />
                    {Array.from({ length: 24 }).map((_, i) => {
                        const a = (i / 24) * Math.PI * 2
                        const r = 20 + ((i * 17) % 45)
                        return (
                            <circle
                                key={i}
                                cx={80 + Math.cos(a) * r}
                                cy={80 + Math.sin(a) * r * 0.6}
                                r={1 + (i % 3) * 0.5}
                                fill={gc}
                                opacity={0.15 + (i % 5) * 0.05}
                            />
                        )
                    })}
                    <circle
                        cx="80"
                        cy="80"
                        r="12"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle cx="80" cy="80" r="5" fill={gc} opacity="0.35" />
                    <circle cx="80" cy="80" r="2" fill={gc} opacity="0.6" />
                </svg>
            )
        case "orbit-gate":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Aura rotando */}
                    <circle
                        cx="80"
                        cy="80"
                        r="74"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="2 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 80 80"
                            to="0 80 80"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* 3 órbitas — cada una rota lento alrededor del eje Z
                       para dar sensación 3D de sistema vivo */}
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="70"
                        ry="30"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="45s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="70"
                        ry="30"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.22"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="60 80 80"
                            to="420 80 80"
                            dur="38s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    <ellipse
                        cx="80"
                        cy="80"
                        rx="70"
                        ry="30"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.22"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="120 80 80"
                            to="480 80 80"
                            dur="52s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                    {/* Planeta orbitando en 360° — patrón radial */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="14s"
                            repeatCount="indefinite"
                        />
                        <circle
                            cx="80"
                            cy="42"
                            r="6"
                            stroke={gc}
                            strokeWidth="1.5"
                            opacity="0.4"
                            fill={gc}
                            fillOpacity="0.08"
                        />
                        <circle
                            cx="80"
                            cy="42"
                            r="2.5"
                            fill={gc}
                            opacity="0.55"
                        />
                    </g>
                    {/* Sol central pulsante */}
                    <circle cx="80" cy="80" r="4" fill={gc} opacity="0.45">
                        <animate
                            attributeName="r"
                            values="4;5.5;4"
                            dur="2.6s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="80" cy="80" r="1.8" fill="#fff" opacity="0.9" />
                </svg>
            )
        case "seal-gate":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <polygon
                        points="80,8 95,55 145,55 105,85 118,135 80,108 42,135 55,85 15,55 65,55"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    <circle
                        cx="80"
                        cy="82"
                        r="35"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    <circle cx="80" cy="82" r="3" fill={gc} opacity="0.5" />
                </svg>
            )
        case "infinity-gate":
            return (
                <svg
                    viewBox="0 0 160 140"
                    style={{ width: size, height: size * 0.875 }}
                    fill="none"
                >
                    <path
                        d="M50,70 C50,48 80,48 80,70 C80,92 110,92 110,70 C110,48 80,48 80,70 C80,92 50,92 50,70Z"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.4"
                        fill="none"
                    />
                    <circle cx="80" cy="70" r="6" fill={gc} opacity="0.18" />
                    <circle cx="80" cy="70" r="2" fill={gc} opacity="0.5" />
                </svg>
            )
        case "scanner-pillar":
            return (
                <svg
                    viewBox="0 0 160 140"
                    style={{ width: size, height: size * 0.875 }}
                    fill="none"
                >
                    {/* Aura hexagonal exterior rotando */}
                    <polygon
                        points="80,4 152,36 152,104 80,136 8,104 8,36"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="2 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 70"
                            to="360 80 70"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    <polygon
                        points="80,8 148,38 148,102 80,132 12,102 12,38"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    {/* Barras oscilando — heartbeat del radar */}
                    {[35, 60, 85, 110].map((x, i) => {
                        const h = [50, 65, 45, 58][i]
                        const l = ["F", "M", "E", "₿"][i]
                        const amp = 12
                        return (
                            <g key={x}>
                                <rect
                                    x={x}
                                    y={110 - h}
                                    width="14"
                                    height={h}
                                    rx="2"
                                    stroke={gc}
                                    strokeWidth="1"
                                    opacity="0.35"
                                    fill={gc}
                                    fillOpacity={0.06 + i * 0.02}
                                >
                                    <animate
                                        attributeName="height"
                                        values={`${h};${h + amp};${h - amp * 0.4};${h}`}
                                        dur={`${2.8 + i * 0.3}s`}
                                        begin={`${(i * 0.2).toFixed(2)}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="y"
                                        values={`${110 - h};${110 - h - amp};${110 - h + amp * 0.4};${110 - h}`}
                                        dur={`${2.8 + i * 0.3}s`}
                                        begin={`${(i * 0.2).toFixed(2)}s`}
                                        repeatCount="indefinite"
                                    />
                                </rect>
                                <text
                                    x={x + 7}
                                    y={120}
                                    textAnchor="middle"
                                    fontSize="7"
                                    fill={gc}
                                    opacity="0.4"
                                    fontFamily="Inter,sans-serif"
                                >
                                    {l}
                                </text>
                            </g>
                        )
                    })}
                    {/* Antena superior pulsante */}
                    <circle
                        cx="80"
                        cy="30"
                        r="5"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.35"
                    />
                    <circle cx="80" cy="30" r="2" fill={gc} opacity="0.6">
                        <animate
                            attributeName="r"
                            values="2;3;2"
                            dur="1.8s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            )
        case "distill-temple":
            return (
                <svg
                    viewBox="0 0 140 160"
                    style={{ width: size * 0.875, height: size }}
                    fill="none"
                >
                    <path
                        d="M55,15 L55,55 L25,130 L115,130 L85,55 L85,15Z"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    <line
                        x1="50"
                        y1="15"
                        x2="90"
                        y2="15"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                    />
                    <circle cx="70" cy="80" r="4" fill={gc} opacity="0.2" />
                    <circle cx="70" cy="80" r="1.5" fill={gc} opacity="0.5" />
                </svg>
            )
        /* ═══ NEW: Reactor Central ═══ */
        case "reactor-core":
            return (
                <svg
                    viewBox="0 0 200 200"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <circle
                        cx="100"
                        cy="100"
                        r="96"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.15"
                        strokeDasharray="3 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 100 100"
                            to="360 100 100"
                            dur="90s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.2"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 100 100"
                            to="0 100 100"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <polygon
                        points="100,12 176,50 176,150 100,188 24,150 24,50"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.02"
                    />
                    <polygon
                        points="100,32 158,58 158,142 100,168 42,142 42,58"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="4 3"
                    />
                    <polygon
                        points="100,50 140,72 140,128 100,150 60,128 60,72"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.5"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="38"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        strokeDasharray="6 3"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 100 100"
                            to="360 100 100"
                            dur="12s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="100"
                        cy="100"
                        r="28"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.04"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 100 100"
                            to="0 100 100"
                            dur="8s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="100" cy="100" r="16" fill={gc} opacity="0.15" />
                    <circle cx="100" cy="100" r="10" fill={gc} opacity="0.3" />
                    <circle cx="100" cy="100" r="5" fill={gc} opacity="0.7" />
                    <circle
                        cx="100"
                        cy="100"
                        r="2.5"
                        fill="#fff"
                        opacity="0.95"
                    />
                    {Array.from({ length: 6 }).map((_, i) => {
                        const a = (i * 60 * Math.PI) / 180
                        return (
                            <line
                                key={i}
                                x1={100 + Math.cos(a) * 18}
                                y1={100 + Math.sin(a) * 18}
                                x2={100 + Math.cos(a) * 48}
                                y2={100 + Math.sin(a) * 48}
                                stroke={gc}
                                strokeWidth="1.5"
                                opacity="0.3"
                                strokeLinecap="round"
                            />
                        )
                    })}
                    {Array.from({ length: 6 }).map((_, i) => {
                        const a = ((i * 60 + 30) * Math.PI) / 180
                        return (
                            <circle
                                key={`m${i}`}
                                cx={100 + Math.cos(a) * 70}
                                cy={100 + Math.sin(a) * 70}
                                r="3"
                                stroke={gc}
                                strokeWidth="1"
                                opacity="0.25"
                                fill={gc}
                                fillOpacity="0.1"
                            />
                        )
                    })}
                </svg>
            )
        case "telemetria-core":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <circle
                        cx="80"
                        cy="80"
                        r="72"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.15"
                        strokeDasharray="2 4"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="40s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <polygon
                        points="80,10 145,38 145,122 80,150 15,122 15,38"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.02"
                    />
                    {[30, 50, 65, 45, 70].map((h, i) => (
                        <React.Fragment key={i}>
                            <rect
                                x={38 + i * 18}
                                y={120 - h}
                                width="12"
                                height={h}
                                rx="2"
                                stroke={gc}
                                strokeWidth="1"
                                opacity={0.2 + i * 0.06}
                                fill={gc}
                                fillOpacity={0.03 + i * 0.015}
                            />
                            <circle
                                cx={44 + i * 18}
                                cy={120 - h - 4}
                                r="1.5"
                                fill={gc}
                                opacity={0.3 + i * 0.08}
                            />
                        </React.Fragment>
                    ))}
                    <polyline
                        points="44,86 62,66 80,51 98,71 116,46"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill="none"
                        strokeLinejoin="round"
                    />
                    <circle
                        cx="80"
                        cy="30"
                        r="8"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle cx="80" cy="30" r="3" fill={gc} opacity="0.5" />
                    <line
                        x1="80"
                        y1="38"
                        x2="80"
                        y2="50"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                        strokeDasharray="2 2"
                    />
                </svg>
            )
        case "motor-forge":
            return (
                <svg
                    viewBox="0 0 180 180"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <polygon
                        points="90,8 152,30 172,90 152,150 90,172 28,150 8,90 28,30"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.2"
                    />
                    <polygon
                        points="90,35 135,90 90,145 45,90"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    <line
                        x1="60"
                        y1="90"
                        x2="120"
                        y2="90"
                        stroke={gc}
                        strokeWidth="2.5"
                        opacity="0.35"
                        strokeLinecap="round"
                    />
                    <line
                        x1="90"
                        y1="60"
                        x2="90"
                        y2="120"
                        stroke={gc}
                        strokeWidth="2.5"
                        opacity="0.35"
                        strokeLinecap="round"
                    />
                    {Array.from({ length: 8 }).map((_, i) => {
                        const a = (i * 45 * Math.PI) / 180
                        return (
                            <line
                                key={i}
                                x1={90 + Math.cos(a) * 22}
                                y1={90 + Math.sin(a) * 22}
                                x2={90 + Math.cos(a) * 32}
                                y2={90 + Math.sin(a) * 32}
                                stroke={gc}
                                strokeWidth="1.5"
                                opacity={0.25 + (i % 2) * 0.15}
                                strokeLinecap="round"
                            />
                        )
                    })}
                    <circle
                        cx="90"
                        cy="90"
                        r="14"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.5"
                        fill={gc}
                        fillOpacity="0.08"
                    />
                    <circle cx="90" cy="90" r="7" fill={gc} opacity="0.25" />
                    <circle cx="90" cy="90" r="3" fill={gc} opacity="0.65" />
                    <circle
                        cx="90"
                        cy="90"
                        r="50"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.12"
                        strokeDasharray="4 8"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 90"
                            to="360 90 90"
                            dur="20s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {[0, 120, 240].map((deg, i) => {
                        const a = (deg * Math.PI) / 180
                        return (
                            <circle
                                key={i}
                                cx={90 + Math.cos(a) * 50}
                                cy={90 + Math.sin(a) * 50}
                                r="4"
                                stroke={gc}
                                strokeWidth="1"
                                opacity="0.3"
                                fill={gc}
                                fillOpacity="0.15"
                            />
                        )
                    })}
                    {[0, 120, 240].map((deg, i) => {
                        const a = (deg * Math.PI) / 180
                        return (
                            <line
                                key={`b${i}`}
                                x1={90 + Math.cos(a) * 50}
                                y1={90 + Math.sin(a) * 50}
                                x2={90 + Math.cos(a) * 16}
                                y2={90 + Math.sin(a) * 16}
                                stroke={gc}
                                strokeWidth="0.5"
                                opacity="0.15"
                                strokeDasharray="2 4"
                            />
                        )
                    })}
                </svg>
            )
        case "holograma-fractal":
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <polygon
                        points="80,6 142,34 142,126 80,154 18,126 18,34"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.15"
                    />
                    <polygon
                        points="80,22 126,42 126,118 80,138 34,118 34,42"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="3 4"
                    />
                    <polygon
                        points="80,38 112,52 112,108 80,122 48,108 48,52"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    <polygon
                        points="80,52 98,62 98,98 80,108 62,98 62,62"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <polygon
                        points="80,65 88,70 88,90 80,95 72,90 72,70"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.08"
                    />
                    <circle cx="80" cy="80" r="6" fill={gc} opacity="0.2" />
                    <circle cx="80" cy="80" r="3" fill={gc} opacity="0.5" />
                    <circle cx="80" cy="80" r="1.5" fill="#fff" opacity="0.9" />
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                        const a = ((deg - 90) * Math.PI) / 180
                        return (
                            <line
                                key={i}
                                x1={80 + Math.cos(a) * 8}
                                y1={80 + Math.sin(a) * 8}
                                x2={80 + Math.cos(a) * 30}
                                y2={80 + Math.sin(a) * 30}
                                stroke={gc}
                                strokeWidth="0.8"
                                opacity="0.2"
                                strokeDasharray="1 3"
                            />
                        )
                    })}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                        const a = ((deg - 90) * Math.PI) / 180
                        return (
                            <circle
                                key={`v${i}`}
                                cx={80 + Math.cos(a) * 32}
                                cy={80 + Math.sin(a) * 32}
                                r="2"
                                fill={gc}
                                opacity={0.2 + (i % 3) * 0.1}
                            />
                        )
                    })}
                    <circle
                        cx="80"
                        cy="80"
                        r="44"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.1"
                        strokeDasharray="1 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="30s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            )
        case "decoder-matter":
            return (
                <svg
                    viewBox="0 0 180 180"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Outer warning hexagon */}
                    <polygon
                        points="90,6 162,34 162,146 90,174 18,146 18,34"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="4 3"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 90"
                            to="360 90 90"
                            dur="50s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* Middle hexagon */}
                    <polygon
                        points="90,28 142,50 142,130 90,152 38,130 38,50"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.02"
                    />
                    {/* Inner analysis diamond */}
                    <polygon
                        points="90,45 130,90 90,135 50,90"
                        stroke={gc}
                        strokeWidth="2"
                        opacity="0.45"
                        fill={gc}
                        fillOpacity="0.05"
                    />
                    {/* Molecular bonds - hexagonal lattice */}
                    <line
                        x1="90"
                        y1="55"
                        x2="115"
                        y2="70"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    <line
                        x1="115"
                        y1="70"
                        x2="115"
                        y2="95"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    <line
                        x1="115"
                        y1="95"
                        x2="90"
                        y2="110"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    <line
                        x1="90"
                        y1="110"
                        x2="65"
                        y2="95"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    <line
                        x1="65"
                        y1="95"
                        x2="65"
                        y2="70"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    <line
                        x1="65"
                        y1="70"
                        x2="90"
                        y2="55"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                    />
                    {/* Molecular nodes */}
                    {[
                        [90, 55],
                        [115, 70],
                        [115, 95],
                        [90, 110],
                        [65, 95],
                        [65, 70],
                    ].map(([cx, cy], i) => (
                        <React.Fragment key={i}>
                            <circle
                                cx={cx}
                                cy={cy}
                                r="4"
                                stroke={gc}
                                strokeWidth="1.5"
                                opacity={0.35 + (i % 2) * 0.15}
                                fill={gc}
                                fillOpacity="0.08"
                            />
                            <circle
                                cx={cx}
                                cy={cy}
                                r="1.5"
                                fill={gc}
                                opacity={0.4 + (i % 3) * 0.1}
                            />
                        </React.Fragment>
                    ))}
                    {/* Center core - analysis point */}
                    <circle
                        cx="90"
                        cy="82"
                        r="12"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.06"
                    />
                    <circle cx="90" cy="82" r="6" fill={gc} opacity="0.2" />
                    <circle cx="90" cy="82" r="3" fill={gc} opacity="0.55" />
                    <circle
                        cx="90"
                        cy="82"
                        r="1.5"
                        fill="#fff"
                        opacity="0.85"
                    />
                    {/* Horizontal scan line */}
                    <line
                        x1="38"
                        y1="82"
                        x2="50"
                        y2="82"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        strokeLinecap="round"
                    />
                    <line
                        x1="130"
                        y1="82"
                        x2="142"
                        y2="82"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        strokeLinecap="round"
                    />
                    {/* Crosshair ticks */}
                    <line
                        x1="90"
                        y1="38"
                        x2="90"
                        y2="48"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                        strokeLinecap="round"
                    />
                    <line
                        x1="90"
                        y1="116"
                        x2="90"
                        y2="126"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                        strokeLinecap="round"
                    />
                    {/* Warning triangles at corners */}
                    <polygon
                        points="90,18 95,26 85,26"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.1"
                    />
                    <polygon
                        points="90,162 95,154 85,154"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.1"
                    />
                    {/* Spinning analysis ring */}
                    <circle
                        cx="90"
                        cy="82"
                        r="42"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.15"
                        strokeDasharray="3 8"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 82"
                            to="360 90 82"
                            dur="15s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            )
        case "command-station":
            return (
                <svg
                    viewBox="0 0 200 160"
                    style={{ width: size * 1.05, height: size * 0.84 }}
                    fill="none"
                >
                    {/* Halo exterior rotante — aura del reactor de creación */}
                    <circle
                        cx="100"
                        cy="80"
                        r="76"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.14"
                        strokeDasharray="3 8"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 100 80"
                            to="360 100 80"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="100"
                        cy="80"
                        r="62"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.1"
                        strokeDasharray="1 5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 100 80"
                            to="0 100 80"
                            dur="40s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Marco del monitor */}
                    <rect
                        x="36"
                        y="22"
                        width="128"
                        height="82"
                        rx="5"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    {/* Bisel de pantalla */}
                    <rect
                        x="42"
                        y="28"
                        width="116"
                        height="72"
                        rx="3"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.25"
                    />
                    {/* Hex exterior del reactor en pantalla */}
                    <polygon
                        points="100,38 128,50 128,78 100,90 72,78 72,50"
                        stroke={gc}
                        strokeWidth="1.2"
                        opacity="0.35"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    {/* Hex intermedio */}
                    <polygon
                        points="100,46 120,56 120,72 100,82 80,72 80,56"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.5"
                    />
                    {/* Hex interno pulsante */}
                    <polygon
                        points="100,54 113,60 113,68 100,74 87,68 87,60"
                        stroke={gc}
                        strokeWidth="1.2"
                        opacity="0.6"
                        fill={gc}
                        fillOpacity="0.1"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.6;0.9;0.6"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* Núcleo del reactor — punto de creación */}
                    <circle cx="100" cy="64" r="5" fill={gc} opacity="0.22" />
                    <circle cx="100" cy="64" r="2.8" fill={gc} opacity="0.65">
                        <animate
                            attributeName="r"
                            values="2.8;3.6;2.8"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="100"
                        cy="64"
                        r="1.2"
                        fill="#fff"
                        opacity="0.95"
                    />
                    {/* Líneas de código en pantalla */}
                    <line
                        x1="50"
                        y1="84"
                        x2="70"
                        y2="84"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.3"
                    />
                    <line
                        x1="50"
                        y1="90"
                        x2="74"
                        y2="90"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.25"
                    />
                    <line
                        x1="130"
                        y1="84"
                        x2="150"
                        y2="84"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.3"
                    />
                    <line
                        x1="126"
                        y1="90"
                        x2="150"
                        y2="90"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.25"
                    />
                    {/* Base / teclado — trapezoide */}
                    <path
                        d="M28,104 L172,104 L180,120 L184,132 L16,132 L20,120 Z"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    {/* Teclado — filas de teclas */}
                    {Array.from({ length: 9 }).map((_, i) => (
                        <rect
                            key={`k1-${i}`}
                            x={38 + i * 14}
                            y="112"
                            width="10"
                            height="4"
                            rx="1"
                            stroke={gc}
                            strokeWidth="0.5"
                            opacity="0.3"
                            fill={gc}
                            fillOpacity="0.06"
                        />
                    ))}
                    {Array.from({ length: 9 }).map((_, i) => (
                        <rect
                            key={`k2-${i}`}
                            x={40 + i * 14}
                            y="120"
                            width="10"
                            height="4"
                            rx="1"
                            stroke={gc}
                            strokeWidth="0.5"
                            opacity="0.25"
                            fill={gc}
                            fillOpacity="0.04"
                        />
                    ))}
                    {/* Trackpad — indicador en base */}
                    <rect
                        x="82"
                        y="127"
                        width="36"
                        height="2"
                        rx="1"
                        fill={gc}
                        opacity="0.3"
                    />
                    {/* Haz de creación — beam ascendente */}
                    <line
                        x1="100"
                        y1="22"
                        x2="100"
                        y2="8"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.45"
                        strokeDasharray="2 2"
                    />
                    <circle cx="100" cy="6" r="2.2" fill={gc} opacity="0.5">
                        <animate
                            attributeName="opacity"
                            values="0.5;0.85;0.5"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Señales laterales (data in / data out) */}
                    {[0, 1, 2].map((i) => (
                        <line
                            key={`sr-${i}`}
                            x1={168 + i * 6}
                            y1="64"
                            x2={178 + i * 6}
                            y2="64"
                            stroke={gc}
                            strokeWidth="0.8"
                            opacity={0.35 - i * 0.08}
                        />
                    ))}
                    {[0, 1, 2].map((i) => (
                        <line
                            key={`sl-${i}`}
                            x1={32 - i * 6}
                            y1="64"
                            x2={22 - i * 6}
                            y2="64"
                            stroke={gc}
                            strokeWidth="0.8"
                            opacity={0.35 - i * 0.08}
                        />
                    ))}
                </svg>
            )
        case "lens-sensor":
            return (
                <svg
                    viewBox="0 0 140 200"
                    style={{ width: size * 0.72, height: size * 1.03 }}
                    fill="none"
                >
                    {/* Aura rotante exterior — rango del sensor */}
                    <circle
                        cx="70"
                        cy="100"
                        r="92"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.12"
                        strokeDasharray="3 7"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 70 100"
                            to="360 70 100"
                            dur="50s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="70"
                        cy="100"
                        r="78"
                        stroke={gc}
                        strokeWidth="0.4"
                        opacity="0.1"
                        strokeDasharray="1 4"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 70 100"
                            to="0 70 100"
                            dur="35s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Chasis del teléfono */}
                    <rect
                        x="22"
                        y="12"
                        width="96"
                        height="176"
                        rx="20"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.03"
                    />
                    {/* Pantalla */}
                    <rect
                        x="28"
                        y="20"
                        width="84"
                        height="160"
                        rx="14"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.25"
                    />
                    {/* Isla de cámara / notch */}
                    <rect
                        x="56"
                        y="16"
                        width="28"
                        height="7"
                        rx="3.5"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.3"
                        fill={gc}
                        fillOpacity="0.1"
                    />
                    <circle cx="78" cy="19.5" r="1.4" fill={gc} opacity="0.5" />
                    {/* Radar en pantalla — círculos concéntricos */}
                    <circle
                        cx="70"
                        cy="100"
                        r="44"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.15"
                    />
                    <circle
                        cx="70"
                        cy="100"
                        r="34"
                        stroke={gc}
                        strokeWidth="0.7"
                        opacity="0.22"
                    />
                    <circle
                        cx="70"
                        cy="100"
                        r="22"
                        stroke={gc}
                        strokeWidth="0.9"
                        opacity="0.3"
                    />
                    <circle
                        cx="70"
                        cy="100"
                        r="12"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.4"
                    />
                    {/* Crosshair */}
                    <line
                        x1="24"
                        y1="100"
                        x2="116"
                        y2="100"
                        stroke={gc}
                        strokeWidth="0.4"
                        opacity="0.15"
                    />
                    <line
                        x1="70"
                        y1="54"
                        x2="70"
                        y2="146"
                        stroke={gc}
                        strokeWidth="0.4"
                        opacity="0.15"
                    />
                    {/* Sweep rotando — cono de escaneo */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 70 100"
                            to="360 70 100"
                            dur="4.2s"
                            repeatCount="indefinite"
                        />
                        <path
                            d="M70,100 L70,56 A44,44 0 0 1 101,70 Z"
                            fill={gc}
                            fillOpacity="0.12"
                            stroke={gc}
                            strokeWidth="0.8"
                            opacity="0.45"
                        />
                    </g>
                    {/* Marcadores en el radar — blips */}
                    {[
                        [52, 78],
                        [88, 82],
                        [60, 120],
                        [94, 118],
                    ].map(([bx, by], i) => (
                        <circle
                            key={`b${i}`}
                            cx={bx}
                            cy={by}
                            r="1.8"
                            fill={gc}
                            opacity={0.35 + (i % 2) * 0.2}
                        />
                    ))}
                    {/* Ojo central — pupila del sensor */}
                    <circle cx="70" cy="100" r="6" fill={gc} opacity="0.22" />
                    <circle cx="70" cy="100" r="3" fill={gc} opacity="0.7">
                        <animate
                            attributeName="r"
                            values="3;3.8;3"
                            dur="2.2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="70"
                        cy="100"
                        r="1.3"
                        fill="#fff"
                        opacity="0.95"
                    />
                    {/* Barras de frecuencia abajo */}
                    {[22, 36, 50, 38, 26].map((h, i) => (
                        <rect
                            key={`fb-${i}`}
                            x={44 + i * 11}
                            y={166 - h * 0.2}
                            width="7"
                            height={h * 0.2}
                            rx="1.2"
                            stroke={gc}
                            strokeWidth="0.5"
                            opacity={0.25 + i * 0.06}
                            fill={gc}
                            fillOpacity={0.05 + i * 0.025}
                        />
                    ))}
                    {/* Indicador home */}
                    <rect
                        x="56"
                        y="180"
                        width="28"
                        height="2"
                        rx="1"
                        fill={gc}
                        opacity="0.35"
                    />
                    {/* Ondas emanando lateralmente — señal al campo */}
                    <path
                        d="M10,88 Q2,100 10,112"
                        stroke={gc}
                        strokeWidth="0.9"
                        opacity="0.35"
                        fill="none"
                    />
                    <path
                        d="M5,78 Q-5,100 5,122"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.22"
                        fill="none"
                    />
                    <path
                        d="M130,88 Q138,100 130,112"
                        stroke={gc}
                        strokeWidth="0.9"
                        opacity="0.35"
                        fill="none"
                    />
                    <path
                        d="M135,78 Q145,100 135,122"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.22"
                        fill="none"
                    />
                </svg>
            )
        case "zakhaar-sun":
            /* Zak'Haar — Sol solar. Mandala de 24+12 rayos rotando
               en direcciones opuestas + corona exterior + hex core
               (6 pilares) + núcleo pulsante blanco. Dorado o cyan
               según el accent del nodo. */
            return (
                <svg
                    viewBox="0 0 180 180"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Aura exterior dashed rotando */}
                    <circle
                        cx="90"
                        cy="90"
                        r="85"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.14"
                        strokeDasharray="2 6"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 90"
                            to="360 90 90"
                            dur="50s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="90"
                        cy="90"
                        r="74"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="1 5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 90 90"
                            to="0 90 90"
                            dur="38s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* 24 rayos mayores — rotación lenta */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 90 90"
                            to="360 90 90"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                        {Array.from({ length: 24 }).map((_, i) => {
                            const a = (i * 15 * Math.PI) / 180
                            const r1 = 48
                            const r2 = 65 + (i % 3) * 2
                            return (
                                <line
                                    key={`sr-${i}`}
                                    x1={90 + Math.cos(a) * r1}
                                    y1={90 + Math.sin(a) * r1}
                                    x2={90 + Math.cos(a) * r2}
                                    y2={90 + Math.sin(a) * r2}
                                    stroke={gc}
                                    strokeWidth={i % 2 === 0 ? "1.5" : "0.8"}
                                    opacity={0.28 + (i % 3) * 0.1}
                                    strokeLinecap="round"
                                />
                            )
                        })}
                    </g>
                    {/* 12 rayos menores — rotación contraria */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 90 90"
                            to="0 90 90"
                            dur="75s"
                            repeatCount="indefinite"
                        />
                        {Array.from({ length: 12 }).map((_, i) => {
                            const a = ((i * 30 + 15) * Math.PI) / 180
                            return (
                                <line
                                    key={`sr2-${i}`}
                                    x1={90 + Math.cos(a) * 38}
                                    y1={90 + Math.sin(a) * 38}
                                    x2={90 + Math.cos(a) * 55}
                                    y2={90 + Math.sin(a) * 55}
                                    stroke={gc}
                                    strokeWidth="1"
                                    opacity="0.35"
                                    strokeLinecap="round"
                                />
                            )
                        })}
                    </g>
                    {/* 3 anillos concéntricos internos */}
                    <circle
                        cx="90"
                        cy="90"
                        r="38"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.25"
                    />
                    <circle
                        cx="90"
                        cy="90"
                        r="28"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.05"
                    />
                    <circle
                        cx="90"
                        cy="90"
                        r="18"
                        stroke={gc}
                        strokeWidth="1.8"
                        opacity="0.55"
                        fill={gc}
                        fillOpacity="0.1"
                    />
                    {/* Hex core — 6 pilares dominados */}
                    <polygon
                        points="90,74 104,82 104,98 90,106 76,98 76,82"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.7"
                        fill={gc}
                        fillOpacity="0.15"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.7;0.95;0.7"
                            dur="2.8s"
                            repeatCount="indefinite"
                        />
                    </polygon>
                    {/* Núcleo pulsante — el Sol Central */}
                    <circle cx="90" cy="90" r="5" fill={gc} opacity="0.35">
                        <animate
                            attributeName="r"
                            values="5;7;5"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="90" cy="90" r="3" fill={gc} opacity="0.75" />
                    <circle
                        cx="90"
                        cy="90"
                        r="1.5"
                        fill="#fff"
                        opacity="0.95"
                    />
                </svg>
            )
        case "aquariia-water":
            /* Aqua'Riia — Gota de agua con ondas concéntricas. Ripples
               rotando en capas opuestas + gota central + olas debajo +
               reflejo + núcleo pulsante. */
            return (
                <svg
                    viewBox="0 0 160 180"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Ondas exteriores rotando */}
                    <circle
                        cx="80"
                        cy="95"
                        r="78"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.14"
                        strokeDasharray="1 5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 95"
                            to="360 80 95"
                            dur="55s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle
                        cx="80"
                        cy="95"
                        r="66"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.12"
                        strokeDasharray="1 4"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 80 95"
                            to="0 80 95"
                            dur="40s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Ripple expandiéndose — ciclo 1 */}
                    <circle
                        cx="80"
                        cy="95"
                        r="40"
                        stroke={gc}
                        strokeWidth="0.9"
                        opacity="0.2"
                    >
                        <animate
                            attributeName="r"
                            values="40;58;40"
                            dur="3.6s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.2;0.04;0.2"
                            dur="3.6s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Ripple expandiéndose — ciclo 2 (desfasado) */}
                    <circle
                        cx="80"
                        cy="95"
                        r="30"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.25"
                    >
                        <animate
                            attributeName="r"
                            values="30;48;30"
                            dur="3.6s"
                            begin="1.2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.25;0.04;0.25"
                            dur="3.6s"
                            begin="1.2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Gota de agua — teardrop */}
                    <path
                        d="M 80,25 C 80,25 54,55 54,86 C 54,112 67,126 80,126 C 93,126 106,112 106,86 C 106,55 80,25 80,25 Z"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.5"
                        fill={gc}
                        fillOpacity="0.08"
                    />
                    {/* Gota interna / reflejo */}
                    <path
                        d="M 80,42 C 80,42 68,62 68,86 C 68,102 74,113 80,113 C 86,113 92,102 92,86 C 92,62 80,42 80,42 Z"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.32"
                        strokeDasharray="2 3"
                    />
                    {/* Highlight del reflejo (arriba-izquierda de la gota) */}
                    <ellipse
                        cx="72"
                        cy="65"
                        rx="4"
                        ry="10"
                        fill={gc}
                        opacity="0.2"
                        transform="rotate(-20 72 65)"
                    />
                    {/* Núcleo pulsante de la gota */}
                    <circle cx="80" cy="95" r="6" fill={gc} opacity="0.35">
                        <animate
                            attributeName="r"
                            values="6;7.5;6"
                            dur="2.4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="80" cy="95" r="3" fill={gc} opacity="0.75" />
                    <circle
                        cx="80"
                        cy="95"
                        r="1.5"
                        fill="#fff"
                        opacity="0.95"
                    />
                    {/* Olas base (debajo de la gota) */}
                    <path
                        d="M 20,158 Q 40,148 60,158 T 100,158 T 140,158"
                        stroke={gc}
                        strokeWidth="1"
                        opacity="0.3"
                        fill="none"
                    />
                    <path
                        d="M 12,168 Q 34,160 56,168 T 100,168 T 148,168"
                        stroke={gc}
                        strokeWidth="0.6"
                        opacity="0.2"
                        fill="none"
                    />
                </svg>
            )
        case "codice-fractal":
            /* Códice — tomo hexagonal con flor de la vida interna. Se
               comparte entre los 11 hijos de Zak y Aqua; el color lo
               da el accent heredado del padre (gold o cyan). */
            return (
                <svg
                    viewBox="0 0 160 160"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    {/* Marco hexagonal — el tomo */}
                    <polygon
                        points="80,16 130,42 130,118 80,144 30,118 30,42"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.4"
                        fill={gc}
                        fillOpacity="0.04"
                    />
                    {/* Marco interno — las páginas */}
                    <polygon
                        points="80,28 118,48 118,112 80,132 42,112 42,48"
                        stroke={gc}
                        strokeWidth="0.8"
                        opacity="0.22"
                        strokeDasharray="3 3"
                    />
                    {/* Flor de la vida — rotación lenta */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 80 80"
                            to="360 80 80"
                            dur="40s"
                            repeatCount="indefinite"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="12"
                            stroke={gc}
                            strokeWidth="1"
                            opacity="0.45"
                        />
                        {[0, 60, 120, 180, 240, 300].map((deg) => {
                            const a = (deg * Math.PI) / 180
                            return (
                                <circle
                                    key={deg}
                                    cx={80 + Math.cos(a) * 12}
                                    cy={80 + Math.sin(a) * 12}
                                    r="12"
                                    stroke={gc}
                                    strokeWidth="0.7"
                                    opacity="0.3"
                                />
                            )
                        })}
                    </g>
                    {/* Lumen central pulsante */}
                    <circle cx="80" cy="80" r="3.5" fill={gc} opacity="0.4">
                        <animate
                            attributeName="r"
                            values="3.5;4.8;3.5"
                            dur="2.6s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="80" cy="80" r="2" fill={gc} opacity="0.7" />
                    <circle cx="80" cy="80" r="1" fill="#fff" opacity="0.95" />
                    {/* Lomo del tomo — línea vertical dashed */}
                    <line
                        x1="80"
                        y1="16"
                        x2="80"
                        y2="144"
                        stroke={gc}
                        strokeWidth="0.5"
                        opacity="0.15"
                        strokeDasharray="2 4"
                    />
                </svg>
            )
        default:
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{ width: size, height: size }}
                    fill="none"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={gc}
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                </svg>
            )
    }
}

/* ═══ BACKGROUND ═══ */
function HoloGrid({ scale }: { scale: number }) {
    const gs = 80 * scale
    return (
        <svg
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            <defs>
                <pattern
                    id="mg80"
                    width={gs}
                    height={gs}
                    patternUnits="userSpaceOnUse"
                >
                    <line
                        x1="0"
                        y1="0"
                        x2={gs}
                        y2="0"
                        stroke={MX.cyanLine}
                        strokeWidth="0.4"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2={gs}
                        stroke={MX.cyanLine}
                        strokeWidth="0.4"
                    />
                </pattern>
                <radialGradient id="mf80">
                    <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                    <stop offset="65%" stopColor="white" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
                <mask id="mm80">
                    <rect width="100%" height="100%" fill="url(#mf80)" />
                </mask>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill="url(#mg80)"
                mask="url(#mm80)"
            />
        </svg>
    )
}
const MatrixRain = React.memo(() => {
    const ch = useMemo(() => {
        const a: any[] = []
        const g = "アイウエオカキクケコ01∞◇△▽⬡✦◈"
        for (let i = 0; i < 35; i++)
            a.push({
                id: i,
                x: Math.random() * 100,
                dur: 5 + Math.random() * 10,
                dl: Math.random() * 12,
                char: g[Math.floor(Math.random() * g.length)],
                sz: 10 + Math.random() * 5,
            })
        return a
    }, [])
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
                opacity: 0.15,
            }}
        >
            {ch.map((c) => (
                <span
                    key={c.id}
                    style={{
                        position: "absolute",
                        left: `${c.x}%`,
                        top: -30,
                        fontSize: c.sz,
                        color: AC,
                        fontFamily: "monospace",
                        opacity: 0,
                        animation: `mde-rain ${c.dur}s linear ${c.dl}s infinite`,
                        textShadow: `0 0 6px ${AC}`,
                        willChange: "transform,opacity",
                    }}
                >
                    {c.char}
                </span>
            ))}
        </div>
    )
})
MatrixRain.displayName = "MatrixRain"

/* ═══ ENERGY CONNECTION ═══ */
function EnergyConnection({
    x1,
    y1,
    x2,
    y2,
    r1,
    r2,
    color = AC,
}: {
    x1: number
    y1: number
    x2: number
    y2: number
    r1: number
    r2: number
    color?: string
}) {
    const dx = x2 - x1,
        dy = y2 - y1,
        dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 10) return null
    const cr1 = Math.min(r1, dist * 0.38),
        cr2 = Math.min(r2, dist * 0.38),
        ux = dx / dist,
        uy = dy / dist
    const sx = x1 + ux * cr1,
        sy = y1 + uy * cr1,
        ex = x2 - ux * cr2,
        ey = y2 - uy * cr2
    const ddx = ex - sx,
        ddy = ey - sy,
        px = -ddy * 0.08,
        py = ddx * 0.08
    const d = `M${sx},${sy} C${sx + ddx * 0.33 + px},${sy + ddy * 0.33 + py} ${sx + ddx * 0.67 - px},${sy + ddy * 0.67 - py} ${ex},${ey}`
    return (
        <g>
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity="0.12"
            />
            <motion.path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.5"
                strokeDasharray="6 30"
                initial={{ strokeDashoffset: 36 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
        </g>
    )
}

/* ═══ NODE ═══ */
function MapNodeComponent({
    node,
    isVisible,
    onToggle,
    onSelect,
    onCommand,
    onBirdEye,
    onHoverChange,
    isSelected,
}: {
    node: MapNode
    isExpanded?: boolean
    isVisible: boolean
    onToggle: (id: string) => void
    onSelect: (id: string) => void
    onCommand: (id: string) => void
    onBirdEye: (id: string) => void
    onHoverChange?: (id: string | null) => void
    isSelected: boolean
}) {
    if (!isVisible) return null
    const accent = node.accent || AC
    const isGold = accent === MX.gold,
        isRed = accent === MX.red,
        isRoot = node.type === "root",
        isLatent = node.type === "latent",
        isBranch = node.type === "branch"
    const hasChildren = !!node.children?.length
    const svgSize = isRoot ? 260 : isBranch ? 170 : 135
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (e.metaKey || e.ctrlKey) {
                onCommand(node.id)
                return
            }
            if (e.altKey || (window as any).__mde_aKeyDown) {
                onSelect(node.id)
                return
            }
            if ((window as any).__mde_sKeyDown && hasChildren) {
                onToggle(node.id)
                return
            }
            if ((window as any).__mde_eKeyDown && hasChildren) {
                onBirdEye(node.id)
                return
            }
        },
        [node.id, hasChildren, onToggle, onSelect, onCommand, onBirdEye]
    )
    const breathe = isGold
        ? "mde-gold-breathe 6s ease-in-out infinite"
        : isRed
          ? "mde-red-breathe 5s ease-in-out infinite"
          : isRoot
            ? "mde-breathe 5s ease-in-out infinite"
            : "mde-glow 7s ease-in-out infinite"
    return (
        <motion.div
            className="mde-node"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: isLatent ? 0.65 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.7 }}
            style={{
                left: node.x,
                top: node.y,
                x: "-50%",
                y: "-50%",
                zIndex: isSelected ? 20 : isRoot ? 10 : 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
            }}
            onClick={handleClick}
            onMouseEnter={() => onHoverChange?.(node.id)}
            onMouseLeave={() => onHoverChange?.(null)}
        >
            {isRoot && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: -30,
                            borderRadius: "50%",
                            border: `1px solid ${accent}`,
                            opacity: 0.08,
                            animation: "mde-pulse 5s ease-in-out infinite",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: -50,
                            borderRadius: "50%",
                            border: `1px solid ${accent}`,
                            opacity: 0.04,
                            animation: "mde-pulse 7s ease-in-out 1s infinite",
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}
            {isSelected && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: "absolute",
                        inset: -12,
                        borderRadius: 20,
                        border: `1px solid ${accent}50`,
                        boxShadow: `0 0 30px ${accent}18`,
                        pointerEvents: "none",
                    }}
                />
            )}
            <div style={{ animation: breathe }}>
                <PortalSVG icon={node.icon} size={svgSize} color={accent} />
            </div>
            <div style={{ textAlign: "center", maxWidth: svgSize + 40 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: isRoot ? 14 : isBranch ? 12 : 11,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: accent,
                        textShadow: `0 0 12px ${accent}50`,
                        lineHeight: 1.3,
                    }}
                >
                    {node.label}
                </p>
                {node.subtitle && (
                    <p
                        style={{
                            margin: 0,
                            marginTop: 2,
                            fontSize: 9,
                            fontWeight: 400,
                            letterSpacing: "0.08em",
                            color: MX.textDim,
                            textTransform: "uppercase",
                        }}
                    >
                        {node.subtitle}
                    </p>
                )}
            </div>
            {isLatent && (
                <span
                    style={{
                        fontSize: 7,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: isRed ? MX.red : AC,
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: `1px solid ${isRed ? MX.red : AC}30`,
                        opacity: 0.7,
                    }}
                >
                    En Desarrollo
                </span>
            )}
        </motion.div>
    )
}

/* ═══ HUD CORNERS ═══ */
function HudCorners({ color }: { color: string }) {
    const cs = [
        { t: 12, l: 12 },
        { t: 12, r: 12 },
        { b: 12, l: 12 },
        { b: 12, r: 12 },
    ]
    return (
        <>
            {cs.map((p, i) => {
                const s: any = {
                    position: "absolute",
                    width: 22,
                    height: 22,
                    zIndex: 3,
                    pointerEvents: "none",
                }
                if (p.t !== undefined) s.top = p.t
                if (p.b !== undefined) s.bottom = p.b
                if (p.l !== undefined) s.left = p.l
                if (p.r !== undefined) s.right = p.r
                const bH = p.t !== undefined ? "top" : "bottom"
                const bV = p.l !== undefined ? "left" : "right"
                return (
                    <div key={i} style={s}>
                        <div
                            style={{
                                position: "absolute",
                                [bH]: 0,
                                [bV]: 0,
                                width: 22,
                                height: 1,
                                background: color,
                                opacity: 0.4,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                [bH]: 0,
                                [bV]: 0,
                                width: 1,
                                height: 22,
                                background: color,
                                opacity: 0.4,
                            }}
                        />
                    </div>
                )
            })}
        </>
    )
}

/* ═══ STATUS ═══ */
const STATUS_COLORS: Record<string, string> = {
    active: MX.gold,
    developing: MX.red,
    incubating: AC,
}

/* ═══ NODE NAV PILL ═══ */
function NodeNavPill({
    node,
    role,
    accent,
    onClick,
}: {
    node: MapNode
    role: "parent" | "sibling" | "child"
    accent: string
    onClick: () => void
}) {
    const roleIcon = role === "parent" ? "↑" : role === "child" ? "↓" : "→"
    const roleLabel =
        role === "parent" ? "Padre" : role === "child" ? "Hijo" : "Hermano"
    const c = node.accent || accent
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 10,
                width: "100%",
                background: `${c}08`,
                border: `1px solid ${c}20`,
                cursor: "pointer",
                outline: "none",
                transition: "all 0.25s",
                fontFamily: "'Inter',sans-serif",
                textAlign: "left" as const,
            }}
            onMouseEnter={(e: any) => {
                e.currentTarget.style.background = `${c}18`
                e.currentTarget.style.borderColor = `${c}45`
                e.currentTarget.style.boxShadow = `0 0 15px ${c}15`
            }}
            onMouseLeave={(e: any) => {
                e.currentTarget.style.background = `${c}08`
                e.currentTarget.style.borderColor = `${c}20`
                e.currentTarget.style.boxShadow = "none"
            }}
        >
            <span
                style={{
                    fontSize: 10,
                    color: `${c}60`,
                    flexShrink: 0,
                    width: 14,
                    textAlign: "center" as const,
                }}
            >
                {roleIcon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        color: c,
                        opacity: 0.8,
                        whiteSpace: "nowrap" as const,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {node.label}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontSize: 8,
                        color: `${c}40`,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        marginTop: 1,
                    }}
                >
                    {roleLabel}
                </p>
            </div>
        </button>
    )
}

/* ═══ COMMAND PANEL ═══ */
function CommandPanel({
    nodeId,
    onClose,
    onNavigate,
    sbUrl,
    sbKey,
}: {
    nodeId: string
    onClose: () => void
    onNavigate: (id: string) => void
    sbUrl: string
    sbKey: string
}) {
    const node = NODES.find((n) => n.id === nodeId)
    if (!node) return null
    const accent = node.accent || AC
    const theme = getPanelTheme(accent)
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveOk, setSaveOk] = useState(false)
    const [expandedSection, setExpandedSection] = useState<string | null>(null)
    const [showSourceCode, setShowSourceCode] = useState(false)
    const [newSprintText, setNewSprintText] = useState("")
    const [deletingSprint, setDeletingSprint] = useState<string | null>(null)
    const [data, setData] = useState<NodeDetail>({
        id: nodeId,
        title: node.label,
        subtitle: node.subtitle || "",
        status: node.type === "latent" ? "developing" : "active",
        pulse_text: node.desc || "",
        mrr: 0,
        price: "",
        active_nodes: 0,
        trajectory: "",
        source_code: "",
        sprints: [],
    })

    useEffect(() => {
        setEditMode(false)
        setExpandedSection(null)
        setShowSourceCode(false)
        setNewSprintText("")
        setSaveOk(false)
        setData({
            id: nodeId,
            title: node?.label || "",
            subtitle: node?.subtitle || "",
            status: node?.type === "latent" ? "developing" : "active",
            pulse_text: node?.desc || "",
            mrr: 0,
            price: "",
            active_nodes: 0,
            trajectory: "",
            source_code: "",
            sprints: [],
        })
        let c = false
        sbFetchNode(sbUrl, sbKey, nodeId).then((row) => {
            if (c) return
            if (row) {
                let ps: { id: string; text: string }[] = []
                try {
                    const raw = (row as any).sprints
                    if (typeof raw === "string") ps = JSON.parse(raw)
                    else if (Array.isArray(raw)) ps = raw
                } catch {}
                setData({
                    ...row,
                    sprints: ps,
                    source_code: (row as any).source_code || "",
                })
            }
        })
        return () => {
            c = true
        }
    }, [nodeId, sbUrl, sbKey])

    const handleSave = useCallback(async () => {
        setSaving(true)
        setSaveOk(false)
        const ok = await sbUpsertNode(sbUrl, sbKey, data)
        setSaving(false)
        if (ok) {
            setSaveOk(true)
            setEditMode(false)
            setTimeout(() => setSaveOk(false), 3000)
        }
    }, [sbUrl, sbKey, data])

    const handleCancel = useCallback(() => {
        setEditMode(false)
        sbFetchNode(sbUrl, sbKey, nodeId).then((row) => {
            if (row) {
                let ps: { id: string; text: string }[] = []
                try {
                    const raw = (row as any).sprints
                    if (typeof raw === "string") ps = JSON.parse(raw)
                    else if (Array.isArray(raw)) ps = raw
                } catch {}
                setData({
                    ...row,
                    sprints: ps,
                    source_code: (row as any).source_code || "",
                })
            }
        })
    }, [sbUrl, sbKey, nodeId])

    const update = (field: keyof NodeDetail, value: any) =>
        setData((prev) => ({ ...prev, [field]: value }))
    const addSprint = () => {
        if (!newSprintText.trim()) return
        update("sprints", [
            ...data.sprints,
            { id: `s_${Date.now()}`, text: newSprintText.trim() },
        ])
        setNewSprintText("")
    }
    const completeSprint = (sid: string) => {
        setDeletingSprint(sid)
        setTimeout(() => {
            update(
                "sprints",
                data.sprints.filter((s) => s.id !== sid)
            )
            setDeletingSprint(null)
        }, 600)
    }

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            const isInput =
                tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
            if (e.key === "Escape") {
                if (expandedSection) {
                    e.stopPropagation()
                    setExpandedSection(null)
                    return
                }
                if (editMode) {
                    e.stopPropagation()
                    handleCancel()
                    return
                }
                onClose()
                return
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && editMode) {
                e.preventDefault()
                handleSave()
                return
            }
            if ((e.key === "e" || e.key === "E") && !isInput && !editMode) {
                e.preventDefault()
                setEditMode(true)
            }
        }
        window.addEventListener("keydown", h, true)
        return () => window.removeEventListener("keydown", h, true)
    }, [editMode, expandedSection, handleSave, handleCancel, onClose])

    const parentNode = node.parent
        ? NODES.find((n) => n.id === node.parent)
        : null
    const childNodes = node.children
        ? NODES.filter((n) => node.children!.includes(n.id))
        : []

    const inputStyle = {
        background: theme.inputBg,
        border: `1px solid ${theme.inputBorder}`,
        color: "rgba(220,240,255,0.9)",
        fontFamily: "'Inter',sans-serif",
        fontSize: "15px",
        padding: "14px 16px",
        borderRadius: "10px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box" as const,
        transition: "all 0.3s",
    }
    const sectionLabel = (text: string, extraRight?: React.ReactNode) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 30,
                marginBottom: 16,
            }}
        >
            <div
                style={{
                    width: 12,
                    height: 1,
                    background: accent,
                    opacity: 0.5,
                }}
            />
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: accent,
                    opacity: 0.65,
                }}
            >
                {text}
            </span>
            <div
                style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(90deg,${accent}30,transparent)`,
                }}
            />
            {extraRight}
        </div>
    )
    const expandBtn = (sectionKey: string) => (
        <button
            onClick={() =>
                setExpandedSection(
                    expandedSection === sectionKey ? null : sectionKey
                )
            }
            style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: `1px solid ${accent}25`,
                background:
                    expandedSection === sectionKey
                        ? `${accent}12`
                        : "transparent",
                color: accent,
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                outline: "none",
                fontFamily: "'Inter',sans-serif",
                transition: "all 0.2s",
            }}
        >
            {expandedSection === sectionKey ? "Colapsar" : "Expandir"}
        </button>
    )

    const fullscreenSection = expandedSection && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 100,
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                padding: "32px 44px",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 20,
                    background: "#020810",
                    zIndex: -1,
                }}
            />
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: accent,
                    }}
                >
                    {expandedSection === "pulse"
                        ? "El Pulso — La Esencia"
                        : expandedSection === "trajectory"
                          ? "Trayectoria"
                          : "Código Fuente"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}
                    >
                        ESC para volver
                    </span>
                    <button
                        onClick={() => setExpandedSection(null)}
                        style={{
                            padding: "8px 20px",
                            borderRadius: 8,
                            border: `1px solid ${accent}30`,
                            background: `${accent}08`,
                            color: accent,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase" as const,
                            cursor: "pointer",
                            outline: "none",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        ← Volver
                    </button>
                </div>
            </div>
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    scrollbarWidth: "none" as const,
                }}
            >
                {editMode ? (
                    <textarea
                        style={{
                            ...inputStyle,
                            resize: "vertical" as const,
                            minHeight: "100%",
                            lineHeight: "1.9",
                            fontSize: "16px",
                        }}
                        value={
                            expandedSection === "pulse"
                                ? data.pulse_text
                                : expandedSection === "trajectory"
                                  ? data.trajectory
                                  : data.source_code
                        }
                        onChange={(e) =>
                            update(
                                expandedSection === "pulse"
                                    ? "pulse_text"
                                    : expandedSection === "trajectory"
                                      ? "trajectory"
                                      : "source_code",
                                e.target.value
                            )
                        }
                    />
                ) : (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 300,
                            lineHeight: 2.2,
                            color: "rgba(200,230,255,0.6)",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {(expandedSection === "pulse"
                            ? data.pulse_text
                            : expandedSection === "trajectory"
                              ? data.trajectory
                              : data.source_code) || "—"}
                    </p>
                )}
            </div>
        </motion.div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,2,8,0.9)",
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                    zIndex: 0,
                }}
            />
            {/* Node Nav Strip */}
            {/* Nav: Children LEFT */}
            {childNodes.length > 0 && !expandedSection && (
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    style={{
                        position: "absolute",
                        left: "calc(15vw - 180px)",
                        top: "7.5vh",
                        zIndex: 2,
                        width: 170,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    {childNodes.map((child) => (
                        <NodeNavPill
                            key={child.id}
                            node={child}
                            role="child"
                            accent={accent}
                            onClick={() => onNavigate(child.id)}
                        />
                    ))}
                </motion.div>
            )}
            {/* Nav: Parent RIGHT */}
            {parentNode && !expandedSection && (
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    style={{
                        position: "absolute",
                        right: "calc(15vw - 180px)",
                        top: "7.5vh",
                        zIndex: 2,
                        width: 170,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    <NodeNavPill
                        node={parentNode}
                        role="parent"
                        accent={accent}
                        onClick={() => onNavigate(parentNode.id)}
                    />
                </motion.div>
            )}
            {/* Main Panel */}
            <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "70vw",
                    maxWidth: 1100,
                    height: "85vh",
                    background: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: 20,
                    boxShadow: theme.glow,
                    fontFamily: "'Inter',sans-serif",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    zIndex: 1,
                }}
            >
                <HudCorners color={accent} />
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: 1,
                        background: `linear-gradient(90deg,transparent,${accent}30,transparent)`,
                        pointerEvents: "none",
                        zIndex: 1,
                        animation: "mde-hud-scan 6s linear infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 20,
                        background:
                            "linear-gradient(rgba(0,20,40,0) 50%, rgba(0,0,0,0.04) 50%)",
                        backgroundSize: "100% 3px",
                        pointerEvents: "none",
                        zIndex: 1,
                        opacity: 0.25,
                    }}
                />
                <AnimatePresence>{fullscreenSection}</AnimatePresence>
                {/* Header */}
                <div
                    style={{
                        padding: "32px 44px 24px",
                        borderBottom: `1px solid ${accent}15`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        position: "relative",
                        zIndex: 20,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 20,
                        }}
                    >
                        <div
                            style={{
                                width: 68,
                                height: 68,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                animation: "mde-glow 4s ease-in-out infinite",
                            }}
                        >
                            <PortalSVG
                                icon={node.icon}
                                size={68}
                                color={accent}
                            />
                        </div>
                        <div>
                            {editMode ? (
                                <input
                                    style={{
                                        ...inputStyle,
                                        fontSize: "24px",
                                        fontWeight: 600,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase" as const,
                                        maxWidth: 500,
                                    }}
                                    value={data.title}
                                    onChange={(e) =>
                                        update("title", e.target.value)
                                    }
                                />
                            ) : (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 24,
                                        fontWeight: 600,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: accent,
                                        textShadow: `0 0 18px ${accent}40`,
                                    }}
                                >
                                    {data.title}
                                </h2>
                            )}
                            {node.subtitle && (
                                <p
                                    style={{
                                        margin: 0,
                                        marginTop: 6,
                                        fontSize: 11,
                                        fontWeight: 400,
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.25)",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {data.subtitle || node.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        {saveOk && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    fontSize: 13,
                                    color: "#4CAF50",
                                    fontWeight: 500,
                                }}
                            >
                                ✓ Sincronizado
                            </motion.span>
                        )}
                        {editMode ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        padding: "12px 20px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        background: "transparent",
                                        color: "rgba(255,255,255,0.35)",
                                        fontSize: 11,
                                        fontWeight: 500,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase" as const,
                                        cursor: "pointer",
                                        fontFamily: "'Inter',sans-serif",
                                        outline: "none",
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: "12px 24px",
                                        borderRadius: 12,
                                        border: `1px solid ${MX.gold}50`,
                                        background: "rgba(212,168,67,0.08)",
                                        color: MX.gold,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase" as const,
                                        cursor: "pointer",
                                        fontFamily: "'Inter',sans-serif",
                                        outline: "none",
                                    }}
                                >
                                    {saving
                                        ? "⟳ TRANSMITIENDO..."
                                        : "✦ SINCRONIZAR"}{" "}
                                    <span
                                        style={{
                                            fontSize: 9,
                                            opacity: 0.4,
                                            marginLeft: 4,
                                        }}
                                    >
                                        ⌘↵
                                    </span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setEditMode(true)}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: 12,
                                    border: `1px solid ${accent}30`,
                                    background: theme.inputBg,
                                    color: accent,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase" as const,
                                    cursor: "pointer",
                                    fontFamily: "'Inter',sans-serif",
                                    outline: "none",
                                }}
                            >
                                ✦ EDITAR CÓDIGO
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                border: `1px solid ${accent}25`,
                                background: theme.inputBg,
                                color: accent,
                                fontSize: 16,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                outline: "none",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "0 44px 36px",
                        scrollbarWidth: "none" as const,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 44,
                        position: "relative",
                        zIndex: 20,
                    }}
                >
                    <div>
                        {sectionLabel(
                            "El Pulso — La Esencia",
                            expandBtn("pulse")
                        )}
                        {editMode ? (
                            <textarea
                                style={{
                                    ...inputStyle,
                                    resize: "vertical" as const,
                                    minHeight: "140px",
                                    lineHeight: "1.8",
                                    fontSize: "16px",
                                }}
                                value={data.pulse_text}
                                onChange={(e) =>
                                    update("pulse_text", e.target.value)
                                }
                                placeholder="Define la esencia de este nodo..."
                            />
                        ) : (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 300,
                                    lineHeight: 2,
                                    color: "rgba(200,230,255,0.6)",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 6,
                                    WebkitBoxOrient: "vertical" as const,
                                    overflow: "hidden",
                                }}
                            >
                                {data.pulse_text || "—"}
                            </p>
                        )}
                        {/* Código Fuente */}
                        {editMode ? (
                            <div style={{ marginTop: 30 }}>
                                {sectionLabel(
                                    "✦ Código Fuente",
                                    expandBtn("source_code")
                                )}
                                <textarea
                                    style={{
                                        ...inputStyle,
                                        resize: "vertical" as const,
                                        minHeight: "160px",
                                        lineHeight: "1.8",
                                        fontSize: "14px",
                                        fontFamily: "monospace",
                                    }}
                                    value={data.source_code}
                                    onChange={(e) =>
                                        update("source_code", e.target.value)
                                    }
                                    placeholder="Documentación técnica, código, notas de arquitectura..."
                                />
                            </div>
                        ) : (
                            <div style={{ marginTop: 30 }}>
                                <button
                                    onClick={() =>
                                        setShowSourceCode(!showSourceCode)
                                    }
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        width: "100%",
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        cursor: "pointer",
                                        outline: "none",
                                        background: showSourceCode
                                            ? `${accent}08`
                                            : "transparent",
                                        border: `1px solid ${showSourceCode ? accent + "30" : accent + "12"}`,
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={accent}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        style={{
                                            transition: "transform 0.3s",
                                            transform: showSourceCode
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                            opacity: 0.5,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: accent,
                                            opacity: 0.65,
                                        }}
                                    >
                                        ✦ Código Fuente
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 1,
                                            background: `linear-gradient(90deg,${accent}20,transparent)`,
                                        }}
                                    />
                                    {expandBtn("source_code")}
                                </button>
                                <AnimatePresence>
                                    {showSourceCode && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.35 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div style={{ padding: "16px 0" }}>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 14,
                                                        fontWeight: 300,
                                                        lineHeight: 1.8,
                                                        color: "rgba(200,230,255,0.5)",
                                                        whiteSpace: "pre-wrap",
                                                        fontFamily: "monospace",
                                                    }}
                                                >
                                                    {data.source_code ||
                                                        "Sin código fuente documentado."}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                    <div>
                        {sectionLabel("Trayectoria", expandBtn("trajectory"))}
                        {editMode ? (
                            <textarea
                                style={{
                                    ...inputStyle,
                                    resize: "vertical" as const,
                                    minHeight: "140px",
                                    lineHeight: "1.8",
                                    fontSize: "16px",
                                }}
                                value={data.trajectory}
                                onChange={(e) =>
                                    update("trajectory", e.target.value)
                                }
                                placeholder="Visión estratégica y dirección del nodo..."
                            />
                        ) : (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 300,
                                    lineHeight: 2,
                                    color: "rgba(200,230,255,0.6)",
                                    whiteSpace: "pre-wrap",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 6,
                                    WebkitBoxOrient: "vertical" as const,
                                    overflow: "hidden",
                                }}
                            >
                                {data.trajectory || "Sin trayectoria definida."}
                            </p>
                        )}
                        {sectionLabel(
                            "Sprints Activos",
                            <span
                                style={{
                                    fontSize: 10,
                                    color: `${accent}50`,
                                    fontWeight: 500,
                                }}
                            >
                                {data.sprints.length} pendientes
                            </span>
                        )}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <AnimatePresence>
                                {data.sprints.map((sprint) => (
                                    <motion.div
                                        key={sprint.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{
                                            opacity:
                                                deletingSprint === sprint.id
                                                    ? 0
                                                    : 1,
                                            x:
                                                deletingSprint === sprint.id
                                                    ? 100
                                                    : 0,
                                            height:
                                                deletingSprint === sprint.id
                                                    ? 0
                                                    : "auto",
                                            scale:
                                                deletingSprint === sprint.id
                                                    ? 0.8
                                                    : 1,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: 100,
                                            height: 0,
                                            scale: 0.8,
                                        }}
                                        transition={{
                                            duration:
                                                deletingSprint === sprint.id
                                                    ? 0.5
                                                    : 0.3,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 16px",
                                            borderRadius: 10,
                                            background: theme.inputBg,
                                            border: `1px solid ${accent}10`,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                completeSprint(sprint.id)
                                            }
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 7,
                                                flexShrink: 0,
                                                border: `1.5px solid ${accent}40`,
                                                background: "transparent",
                                                cursor: "pointer",
                                                outline: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                transition: "all 0.25s ease",
                                            }}
                                            onMouseEnter={(e: any) => {
                                                e.currentTarget.style.background = `${accent}15`
                                                e.currentTarget.style.borderColor =
                                                    accent
                                                e.currentTarget.style.boxShadow = `0 0 12px ${accent}25`
                                            }}
                                            onMouseLeave={(e: any) => {
                                                e.currentTarget.style.background =
                                                    "transparent"
                                                e.currentTarget.style.borderColor = `${accent}40`
                                                e.currentTarget.style.boxShadow =
                                                    "none"
                                            }}
                                        >
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke={accent}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity="0.5"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </button>
                                        {editMode ? (
                                            <input
                                                style={{
                                                    ...inputStyle,
                                                    flex: 1,
                                                    fontSize: "14px",
                                                    padding: "6px 10px",
                                                }}
                                                value={sprint.text}
                                                onChange={(e) => {
                                                    const u = data.sprints.map(
                                                        (s) =>
                                                            s.id === sprint.id
                                                                ? {
                                                                      ...s,
                                                                      text: e
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : s
                                                    )
                                                    update("sprints", u)
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    flex: 1,
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    color: "rgba(200,230,255,0.7)",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {sprint.text}
                                            </span>
                                        )}
                                        {editMode && (
                                            <button
                                                onClick={() =>
                                                    update(
                                                        "sprints",
                                                        data.sprints.filter(
                                                            (s) =>
                                                                s.id !==
                                                                sprint.id
                                                        )
                                                    )
                                                }
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 5,
                                                    border: "1px solid rgba(255,100,100,0.15)",
                                                    background: "transparent",
                                                    color: "rgba(255,100,100,0.4)",
                                                    fontSize: 10,
                                                    cursor: "pointer",
                                                    outline: "none",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {data.sprints.length === 0 && (
                                <p
                                    style={{
                                        textAlign: "center",
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.12)",
                                        padding: "20px 0",
                                    }}
                                >
                                    Sin sprints activos
                                </p>
                            )}
                        </div>
                        {editMode && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 10,
                                }}
                            >
                                <input
                                    style={{
                                        ...inputStyle,
                                        flex: 1,
                                        fontSize: "13px",
                                        padding: "10px 14px",
                                    }}
                                    value={newSprintText}
                                    onChange={(e) =>
                                        setNewSprintText(e.target.value)
                                    }
                                    placeholder="Nuevo sprint..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addSprint()
                                    }}
                                />
                                <button
                                    onClick={addSprint}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: `1px solid ${accent}30`,
                                        background: `${accent}08`,
                                        color: accent,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase" as const,
                                        cursor: "pointer",
                                        outline: "none",
                                        fontFamily: "'Inter',sans-serif",
                                        whiteSpace: "nowrap" as const,
                                    }}
                                >
                                    + Sprint
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer hints */}
                <div
                    style={{
                        padding: "12px 44px",
                        borderTop: `1px solid ${accent}08`,
                        display: "flex",
                        justifyContent: "center",
                        gap: 24,
                        position: "relative",
                        zIndex: 20,
                    }}
                >
                    <span
                        style={{ fontSize: 9, color: "rgba(255,255,255,0.12)" }}
                    >
                        E — Editar
                    </span>
                    <span
                        style={{ fontSize: 9, color: "rgba(255,255,255,0.12)" }}
                    >
                        ESC — {editMode ? "Cancelar" : "Cerrar"}
                    </span>
                    {editMode && (
                        <span
                            style={{
                                fontSize: 9,
                                color: "rgba(255,255,255,0.12)",
                            }}
                        >
                            ⌘↵ — Sincronizar
                        </span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ═══ INFO PANEL ═══ */
function InfoPanel({
    node,
    onClose,
}: {
    node: MapNode | null
    onClose: () => void
}) {
    if (!node) return null
    const accent = node.accent || AC
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.35 }}
            style={{
                position: "fixed",
                top: 80,
                right: 24,
                width: 300,
                zIndex: 100,
                padding: "24px 20px",
                borderRadius: 16,
                background:
                    "linear-gradient(165deg,rgba(0,16,32,0.92) 0%,rgba(0,8,20,0.96) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${accent}25`,
                fontFamily: "'Inter',sans-serif",
            }}
        >
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `1px solid ${accent}25`,
                    background: "transparent",
                    color: accent,
                    fontSize: 9,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                }}
            >
                ✕
            </button>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 14,
                    animation: "mde-glow 4s ease-in-out infinite",
                }}
            >
                <PortalSVG icon={node.icon} size={80} color={accent} />
            </div>
            <h3
                style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: accent,
                    textAlign: "center",
                }}
            >
                {node.label}
            </h3>
            {node.subtitle && (
                <p
                    style={{
                        margin: 0,
                        marginTop: 3,
                        fontSize: 9,
                        color: MX.textDim,
                        textAlign: "center",
                        textTransform: "uppercase",
                    }}
                >
                    {node.subtitle}
                </p>
            )}
            <div
                style={{
                    width: 36,
                    height: 1,
                    background: `linear-gradient(90deg,transparent,${accent}35,transparent)`,
                    margin: "14px auto",
                }}
            />
            {node.desc && (
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 300,
                        lineHeight: 1.7,
                        color: "rgba(200,230,255,0.55)",
                        textAlign: "center",
                    }}
                >
                    {node.desc}
                </p>
            )}
        </motion.div>
    )
}

/* ═══ MINI MAP ═══ */
function MiniMap({
    nodes,
    visibleNodes,
    panX,
    panY,
    scale,
    viewW,
    viewH,
}: {
    nodes: MapNode[]
    visibleNodes: Set<string>
    panX: number
    panY: number
    scale: number
    viewW: number
    viewH: number
}) {
    const mmW = 150,
        mmH = 90
    const bounds = useMemo(() => {
        let a = Infinity,
            b = -Infinity,
            c = Infinity,
            d = -Infinity
        nodes.forEach((n) => {
            if (n.x < a) a = n.x
            if (n.x > b) b = n.x
            if (n.y < c) c = n.y
            if (n.y > d) d = n.y
        })
        const p = 250
        return { x: a - p, y: c - p, w: b - a + p * 2, h: d - c + p * 2 }
    }, [nodes])
    const t = (wx: number, wy: number) => ({
        x: ((wx - bounds.x) / bounds.w) * mmW,
        y: ((wy - bounds.y) / bounds.h) * mmH,
    })
    const vpX = -panX / scale,
        vpY = -panY / scale
    const vp = t(vpX, vpY),
        ve = t(vpX + viewW / scale, vpY + viewH / scale)
    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                left: 20,
                width: mmW,
                height: mmH,
                borderRadius: 8,
                background: "rgba(0,8,20,0.75)",
                border: `1px solid ${MX.cyanLine}`,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                overflow: "hidden",
                zIndex: 50,
            }}
        >
            <svg width={mmW} height={mmH}>
                {nodes.map((n) => {
                    const p = t(n.x, n.y)
                    return (
                        <circle
                            key={n.id}
                            cx={p.x}
                            cy={p.y}
                            r={n.type === "root" ? 3 : 1.5}
                            fill={
                                visibleNodes.has(n.id)
                                    ? n.accent || AC
                                    : "#1a3a5a"
                            }
                            opacity={visibleNodes.has(n.id) ? 0.7 : 0.15}
                        />
                    )
                })}
                <rect
                    x={vp.x}
                    y={vp.y}
                    width={Math.max(ve.x - vp.x, 8)}
                    height={Math.max(ve.y - vp.y, 6)}
                    fill="none"
                    stroke={AC}
                    strokeWidth="0.8"
                    opacity="0.35"
                    rx="1"
                />
            </svg>
        </div>
    )
}

/* ═══ ZOOM + COMMANDS ═══ */
function ZoomBadge({ scale }: { scale: number }) {
    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 50,
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px solid ${MX.nodeBorder}`,
                background: MX.nodeBg,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
            }}
        >
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: AC,
                    fontFamily: "monospace",
                }}
            >
                {Math.round(scale * 100)}%
            </span>
        </div>
    )
}
function CommandsLegend() {
    const [open, setOpen] = useState(false)
    const cmds = [
        { keys: "W", desc: "Vista aérea (centrar todo)" },
        { keys: "S + Click", desc: "Expandir hijos (zoom)" },
        { keys: "E + Click", desc: "Expandir hijos (vista aérea)" },
        { keys: "A + Click", desc: "Panel de info rápida" },
        { keys: "⌘ + Click", desc: "Abrir centro de comando" },
        { keys: "E", desc: "Editar nodo (en panel)" },
        { keys: "⌘ + Enter", desc: "Sincronizar datos" },
        { keys: "Esc", desc: "Cerrar / Cancelar" },
    ]
    return (
        <div style={{ position: "fixed", bottom: 20, right: 80, zIndex: 50 }}>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "absolute",
                            bottom: 44,
                            right: 0,
                            width: 240,
                            padding: "16px 18px",
                            borderRadius: 14,
                            background: "rgba(0,10,25,0.92)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: `1px solid ${AC}20`,
                            boxShadow: `0 0 40px rgba(0,194,255,0.05)`,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                marginBottom: 12,
                                fontSize: 9,
                                fontWeight: 600,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: AC,
                                opacity: 0.5,
                            }}
                        >
                            Comandos de Navegación
                        </p>
                        {cmds.map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "5px 0",
                                    borderBottom:
                                        i < cmds.length - 1
                                            ? `1px solid rgba(0,194,255,0.06)`
                                            : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: AC,
                                        opacity: 0.7,
                                        fontFamily: "monospace",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {c.keys}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: "rgba(200,230,255,0.4)",
                                    }}
                                >
                                    {c.desc}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${open ? AC + "40" : MX.nodeBorder}`,
                    background: open ? "rgba(0,194,255,0.08)" : MX.nodeBg,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: AC,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    transition: "all 0.25s",
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" opacity="0.4" />
                    <path
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                        opacity="0.8"
                    />
                    <line x1="12" y1="17" x2="12.01" y2="17" opacity="0.8" />
                </svg>
            </button>
        </div>
    )
}
function TitleOverlay() {
    return (
        <motion.div
            className="rsv-admin-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
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
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 15,
                    fontWeight: 200,
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: AC,
                    margin: 0,
                    textShadow: `0 0 12px rgba(0,194,255,0.3)`,
                }}
            >
                ✦ Holograma de Expansión
            </h1>
            <p
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 8,
                    fontWeight: 400,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: MX.textDim,
                    margin: 0,
                    marginTop: 3,
                }}
            >
                Mapa Neuronal de la Red Solar Viva
            </p>
        </motion.div>
    )
}

function getVisibleBounds(vis: Set<string>) {
    let minX = 0,
        maxX = 0,
        minY = 0,
        maxY = 0,
        first = true
    NODES.forEach((n) => {
        if (!vis.has(n.id)) return
        const r = NODE_R[n.type] || 70
        if (first) {
            minX = n.x - r
            maxX = n.x + r
            minY = n.y - r
            maxY = n.y + r
            first = false
        } else {
            if (n.x - r < minX) minX = n.x - r
            if (n.x + r > maxX) maxX = n.x + r
            if (n.y - r < minY) minY = n.y - r
            if (n.y + r > maxY) maxY = n.y + r
        }
    })
    return {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        minX,
        maxX,
        minY,
        maxY,
    }
}
function getAllBounds() {
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity
    NODES.forEach((n) => {
        if (n.x < minX) minX = n.x
        if (n.x > maxX) maxX = n.x
        if (n.y < minY) minY = n.y
        if (n.y > maxY) maxY = n.y
    })
    const pad = 400
    return {
        minX: minX - pad,
        maxX: maxX + pad,
        minY: minY - pad,
        maxY: maxY + pad,
    }
}
const ALL_BOUNDS = getAllBounds()
function clampPan(
    px: number,
    py: number,
    scale: number,
    vw: number,
    vh: number
): { x: number; y: number } {
    const maxPX = vw / 2 - ALL_BOUNDS.minX * scale,
        minPX = vw / 2 - ALL_BOUNDS.maxX * scale
    const maxPY = vh / 2 - ALL_BOUNDS.minY * scale,
        minPY = vh / 2 - ALL_BOUNDS.maxY * scale
    return {
        x: Math.max(Math.min(px, maxPX), minPX),
        y: Math.max(Math.min(py, maxPY), minPY),
    }
}

const MAX_ZOOM = 2.0
export function HologramaDeExpansion({
    domoMode = false,
    supabaseUrl = "",
    supabaseAnonKey = "",
    authHeader,
}: {
    domoMode?: boolean
    supabaseUrl?: string
    supabaseAnonKey?: string
    authHeader?: React.ReactNode
}) {
    useInjectCss()
    const [introComplete, setIntroComplete] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [panX, setPanX] = useState(0)
    const [panY, setPanY] = useState(0)
    const [scale, setScale] = useState(0.6)
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
    const [viewSize, setViewSize] = useState({ w: 1440, h: 900 })
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        new Set(["centro"])
    )
    /* v8.8 — ref sincronizado con expandedNodes para que retractAll pueda
       leer el valor actual sin capturar cierres obsoletos. */
    const expandedNodesRef = useRef(expandedNodes)
    useEffect(() => {
        expandedNodesRef.current = expandedNodes
    }, [expandedNodes])
    /* v8.9 — ref del nodo bajo el cursor. Cada MapNodeComponent lo
       actualiza via onHoverChange. El handler de teclado lo lee para
       disparar acciones (S expand, E bird-eye, A select) sin requerir
       hold+click — basta con hover+press. */
    const hoveredNodeIdRef = useRef<string | null>(null)
    const setHoveredNodeId = useCallback((id: string | null) => {
        hoveredNodeIdRef.current = id
    }, [])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [commandNode, setCommandNode] = useState<string | null>(null)
    const panXRef = useRef(panX)
    panXRef.current = panX
    const panYRef = useRef(panY)
    panYRef.current = panY
    const scaleRef = useRef(scale)
    scaleRef.current = scale

    useEffect(() => {
        const w = window.innerWidth,
            h = window.innerHeight
        setViewSize({ w, h })
        setPanX(w / 2)
        setPanY(h / 2 - 40)
    }, [])
    useEffect(() => {
        const h = () =>
            setViewSize({ w: window.innerWidth, h: window.innerHeight })
        window.addEventListener("resize", h)
        return () => window.removeEventListener("resize", h)
    }, [])
    /* v8.12 — cuando un nodo está seleccionado, ponemos un attr en body
       para que el NavegadorLente del Lente se oculte vía CSS global. La
       hamburguesa del nav vivía arriba a la derecha y chocaba con el
       botón × del panel del nodo. Limpieza al desmontar y al cambiar
       selección. */
    useEffect(() => {
        if (typeof document === "undefined") return
        if (selectedNode || commandNode) {
            document.body.setAttribute("data-rsv-holo-node-open", "1")
        } else {
            document.body.removeAttribute("data-rsv-holo-node-open")
        }
        return () => {
            document.body.removeAttribute("data-rsv-holo-node-open")
        }
    }, [selectedNode, commandNode])
    /* v8.8 — R = Retract: colapsa todo en cascada inversa (los nodos más
       profundos se pliegan primero, 180ms entre capas), dejando sólo la
       Sala de Comando con sus hijos directos visibles. La vista se ajusta
       automáticamente al nuevo bounding box con cada colapso. */
    const retractAll = useCallback(() => {
        setSelectedNode(null)
        setCommandNode(null)
        lastExpandMode.current = "birdEye"
        lastExpandedId.current = "centro"

        /* Mapa de profundidad absoluta desde "centro" */
        const depthOf = new Map<string, number>()
        function walk(id: string, depth: number) {
            const node = NODES.find((n) => n.id === id)
            if (!node) return
            depthOf.set(id, depth)
            node.children?.forEach((c) => walk(c, depth + 1))
        }
        walk("centro", 0)

        /* Agrupar los expandedNodes actuales (excepto centro) por profundidad */
        const byDepth = new Map<number, string[]>()
        Array.from(expandedNodesRef.current).forEach((id) => {
            if (id === "centro") return
            const d = depthOf.get(id) ?? 0
            if (!byDepth.has(d)) byDepth.set(d, [])
            byDepth.get(d)!.push(id)
        })

        const depthsDesc = Array.from(byDepth.keys()).sort((a, b) => b - a)
        if (depthsDesc.length === 0) {
            /* Ya está retraído al mínimo — solo re-centrar */
            window.dispatchEvent(new CustomEvent("mde-fly-home"))
            return
        }

        depthsDesc.forEach((d, i) => {
            setTimeout(() => {
                const ids = byDepth.get(d) || []
                setExpandedNodes((prev) => {
                    const n = new Set(prev)
                    ids.forEach((id) => n.delete(id))
                    return n
                })
            }, i * 180)
        })
    }, [])

    /* v8.7 — D = Deploy: despliega TODO el holograma en cascadas de
       profundidad, cada 220ms una nueva ola de hijos florece. El
       camera fit-all existente (lastExpandMode = "birdEye") se dispara
       automáticamente con cada ola, así la vista se aleja con el pulso
       del despliegue. Efecto: un big bang fractal. */
    const deployAll = useCallback(() => {
        setSelectedNode(null)
        setCommandNode(null)
        lastExpandMode.current = "birdEye"
        lastExpandedId.current = "centro"
        /* Agrupamos los nodos expandibles por profundidad */
        const byDepth = new Map<number, string[]>()
        function walk(id: string, depth: number) {
            const node = NODES.find((n) => n.id === id)
            if (!node) return
            if (node.children?.length) {
                if (!byDepth.has(depth)) byDepth.set(depth, [])
                byDepth.get(depth)!.push(id)
                node.children.forEach((c) => walk(c, depth + 1))
            }
        }
        walk("centro", 0)
        const maxDepth = Math.max(0, ...Array.from(byDepth.keys()))
        for (let d = 0; d <= maxDepth; d++) {
            setTimeout(() => {
                const ids = byDepth.get(d) || []
                setExpandedNodes((prev) => {
                    const n = new Set(prev)
                    ids.forEach((id) => n.add(id))
                    return n
                })
            }, d * 220)
        }
    }, [])

    /* v8.11 — 4 toggles movidos acá (antes vivían ~300 líneas abajo). Los
       usa el useEffect de teclado inmediatamente después, y tenerlos
       declarados a posteriori causaba ReferenceError en TDZ:
       "Cannot access 'toggleExpand' before initialization" al evaluar
       el array de deps del useEffect. JS evalúa deps eagerly en el render,
       así que los identificadores tienen que estar ya en scope. Todos los
       callbacks usan refs para las 4 acciones → deps vacíos, sin re-crear. */
    const toggleExpand = useCallback((id: string) => {
        lastExpandedId.current = id
        lastExpandMode.current = "zoom"
        setExpandedNodes((p) => {
            const n = new Set(p)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    }, [])
    const toggleBirdEye = useCallback((id: string) => {
        lastExpandedId.current = id
        lastExpandMode.current = "birdEye"
        setExpandedNodes((p) => {
            const n = new Set(p)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    }, [])
    const toggleSelect = useCallback((id: string) => {
        setSelectedNode((prev) => (prev === id ? null : id))
    }, [])
    const toggleCommand = useCallback((id: string) => {
        setCommandNode((prev) => (prev === id ? null : id))
        setSelectedNode(null)
    }, [])

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
                return

            /* v8.9 — Hover-press: si el cursor está sobre un nodo cuando
               se pulsa S/E/A, disparamos la acción directo sobre ese nodo
               sin requerir el click posterior. Antes había que mantener la
               tecla Y además hacer clic — flujo doble, cansado.
               e.repeat filter evita auto-fire por tecla sostenida. */
            const hoveredId = hoveredNodeIdRef.current
            if (hoveredId && !e.repeat) {
                const hoveredNode = NODES.find((n) => n.id === hoveredId)
                if (hoveredNode) {
                    if (e.key === "s" || e.key === "S") {
                        if (hoveredNode.children?.length) {
                            e.preventDefault()
                            toggleExpand(hoveredId)
                            return
                        }
                    }
                    if (e.key === "e" || e.key === "E") {
                        if (hoveredNode.children?.length) {
                            e.preventDefault()
                            toggleBirdEye(hoveredId)
                            return
                        }
                    }
                    if (e.key === "a" || e.key === "A") {
                        e.preventDefault()
                        toggleSelect(hoveredId)
                        return
                    }
                }
            }

            /* Flags hold+click — siguen activas como fallback (por si el
               usuario viene del patrón viejo). Hover-press tiene prioridad. */
            if (e.key === "a" || e.key === "A")
                (window as any).__mde_aKeyDown = true
            if (e.key === "s" || e.key === "S")
                (window as any).__mde_sKeyDown = true
            if (e.key === "w" || e.key === "W") {
                ;(window as any).__mde_wUsed = false
            }
            if (e.key === "e" || e.key === "E")
                (window as any).__mde_eKeyDown = true
            /* v8.7 — D despliega todo el holograma en cascadas */
            if (e.key === "d" || e.key === "D") {
                e.preventDefault()
                deployAll()
            }
            /* v8.8 — R retrae todo: cascadas inversas hasta dejar sólo
               la Sala de Comando y sus hijos directos */
            if (e.key === "r" || e.key === "R") {
                e.preventDefault()
                retractAll()
            }
            if (e.key === "Escape") {
                setSelectedNode(null)
                if (!commandNode) setCommandNode(null)
            }
        }
        const up = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
                return
            if (e.key === "a" || e.key === "A")
                (window as any).__mde_aKeyDown = false
            if (e.key === "s" || e.key === "S")
                (window as any).__mde_sKeyDown = false
            if (e.key === "w" || e.key === "W") {
                if (!(window as any).__mde_wUsed)
                    window.dispatchEvent(new CustomEvent("mde-fly-home"))
            }
            if (e.key === "e" || e.key === "E")
                (window as any).__mde_eKeyDown = false
        }
        window.addEventListener("keydown", down)
        window.addEventListener("keyup", up)
        return () => {
            window.removeEventListener("keydown", down)
            window.removeEventListener("keyup", up)
            ;(window as any).__mde_aKeyDown = false
            ;(window as any).__mde_sKeyDown = false
            ;(window as any).__mde_eKeyDown = false
        }
    }, [
        commandNode,
        deployAll,
        retractAll,
        toggleExpand,
        toggleBirdEye,
        toggleSelect,
    ])

    const visibleNodes = useMemo(() => {
        const vis = new Set<string>()
        vis.add("centro")
        function sc(pid: string) {
            if (!vis.has(pid)) return
            const p = NODES.find((n) => n.id === pid)
            if (!p?.children) return
            p.children.forEach((c) => {
                vis.add(c)
                if (expandedNodes.has(c)) sc(c)
            })
        }
        expandedNodes.forEach((e) => sc(e))
        return vis
    }, [expandedNodes])
    const minZoom = useMemo(() => {
        const b = getVisibleBounds(visibleNodes)
        const cw = b.maxX - b.minX + 300
        const ch = b.maxY - b.minY + 300
        return Math.max(0.25, Math.min(viewSize.w / cw, viewSize.h / ch) * 0.85)
    }, [visibleNodes, viewSize])

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return
            setIsDragging(true)
            dragStart.current = { x: e.clientX, y: e.clientY, panX, panY }
        },
        [panX, panY]
    )
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return
            const c = clampPan(
                dragStart.current.panX + (e.clientX - dragStart.current.x),
                dragStart.current.panY + (e.clientY - dragStart.current.y),
                scaleRef.current,
                viewSize.w,
                viewSize.h
            )
            setPanX(c.x)
            setPanY(c.y)
        },
        [isDragging, viewSize]
    )
    const handleMouseUp = useCallback(() => setIsDragging(false), [])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            e.preventDefault()
            if (e.ctrlKey || e.metaKey) {
                const d = e.deltaY > 0 ? -0.04 : 0.04
                setScale((s) => Math.max(minZoom, Math.min(MAX_ZOOM, s + d)))
            } else {
                const c = clampPan(
                    panXRef.current - e.deltaX,
                    panYRef.current - e.deltaY,
                    scaleRef.current,
                    viewSize.w,
                    viewSize.h
                )
                setPanX(c.x)
                setPanY(c.y)
            }
        }
        el.addEventListener("wheel", handler, { passive: false })
        return () => el.removeEventListener("wheel", handler)
    }, [minZoom, viewSize])

    const animateTo = useCallback((tPX: number, tPY: number, tS: number) => {
        const sPX = panXRef.current,
            sPY = panYRef.current,
            sS = scaleRef.current
        let step = 0
        const steps = 30
        const anim = () => {
            step++
            const t = step / steps
            const e = 1 - Math.pow(1 - t, 3)
            const nPX = sPX + (tPX - sPX) * e
            const nPY = sPY + (tPY - sPY) * e
            const nS = sS + (tS - sS) * e
            setPanX(nPX)
            setPanY(nPY)
            setScale(nS)
            panXRef.current = nPX
            panYRef.current = nPY
            scaleRef.current = nS
            if (step < steps) requestAnimationFrame(anim)
        }
        requestAnimationFrame(anim)
    }, [])

    const visibleNodesRef = useRef(visibleNodes)
    visibleNodesRef.current = visibleNodes
    useEffect(() => {
        const h = () => {
            const vis = visibleNodesRef.current
            const b = getVisibleBounds(vis)
            const cw = b.maxX - b.minX + 300,
                ch = b.maxY - b.minY + 300
            const cs = Math.max(
                0.25,
                Math.min(
                    MAX_ZOOM,
                    Math.min(viewSize.w / cw, viewSize.h / ch) * 0.85
                )
            )
            animateTo(
                viewSize.w / 2 - b.cx * cs,
                viewSize.h / 2 - b.cy * cs,
                cs
            )
        }
        window.addEventListener("mde-fly-home", h)
        return () => window.removeEventListener("mde-fly-home", h)
    }, [viewSize, animateTo])

    const prevVisCount = useRef(visibleNodes.size)
    const lastExpandedId = useRef<string | null>(null)
    const lastExpandMode = useRef<"zoom" | "birdEye">("zoom")
    useEffect(() => {
        if (
            visibleNodes.size > prevVisCount.current &&
            lastExpandedId.current
        ) {
            if (lastExpandMode.current === "birdEye") {
                const b = getVisibleBounds(visibleNodes)
                const cw = b.maxX - b.minX + 300,
                    ch = b.maxY - b.minY + 300
                const cs = Math.max(
                    minZoom,
                    Math.min(
                        MAX_ZOOM,
                        Math.min(viewSize.w / cw, viewSize.h / ch) * 0.85
                    )
                )
                animateTo(
                    viewSize.w / 2 - b.cx * cs,
                    viewSize.h / 2 - b.cy * cs,
                    cs
                )
            } else {
                const pn = NODES.find((n) => n.id === lastExpandedId.current)
                if (pn?.children) {
                    const rIds = new Set([pn.id, ...pn.children])
                    const b = getVisibleBounds(rIds)
                    const cw = b.maxX - b.minX + 300,
                        ch = b.maxY - b.minY + 300
                    const cs = Math.max(
                        minZoom,
                        Math.min(
                            MAX_ZOOM,
                            Math.min(viewSize.w / cw, viewSize.h / ch) * 1.0
                        )
                    )
                    animateTo(
                        viewSize.w / 2 - b.cx * cs,
                        viewSize.h / 2 - b.cy * cs,
                        cs
                    )
                }
            }
        } else if (visibleNodes.size < prevVisCount.current) {
            const b = getVisibleBounds(visibleNodes)
            const cw = b.maxX - b.minX + 300,
                ch = b.maxY - b.minY + 300
            const cs = Math.max(
                minZoom,
                Math.min(
                    MAX_ZOOM,
                    Math.max(
                        0.6,
                        Math.min(viewSize.w / cw, viewSize.h / ch) * 0.7
                    )
                )
            )
            animateTo(
                viewSize.w / 2 - b.cx * cs,
                viewSize.h / 2 - b.cy * cs,
                cs
            )
        }
        prevVisCount.current = visibleNodes.size
    }, [visibleNodes, viewSize, minZoom, animateTo])

    const selectedNodeData = useMemo(
        () => NODES.find((n) => n.id === selectedNode) || null,
        [selectedNode]
    )
    const connections = useMemo(() => {
        const c: Array<{
            from: MapNode
            to: MapNode
            color: string
            r1: number
            r2: number
        }> = []
        NODES.forEach((n) => {
            if (
                !n.parent ||
                !visibleNodes.has(n.id) ||
                !visibleNodes.has(n.parent)
            )
                return
            const p = NODES.find((x) => x.id === n.parent)
            if (p)
                c.push({
                    from: p,
                    to: n,
                    color: n.accent || AC,
                    r1: NODE_R[p.type] || 70,
                    r2: NODE_R[n.type] || 70,
                })
        })
        return c
    }, [visibleNodes])
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest(".mde-node")) {
            setSelectedNode(null)
            setCommandNode(null)
        }
    }, [])
    const handleIntroComplete = useCallback(() => setIntroComplete(true), [])

    return (
        <div
            className="mde-root"
            style={{
                position: domoMode ? "fixed" : "relative",
                inset: domoMode ? 0 : undefined,
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                background: domoMode ? "transparent" : "#020810",
                fontFamily: "'Inter',sans-serif",
            }}
        >
            <AnimatePresence>
                {!introComplete && (
                    <MatrixIntro onComplete={handleIntroComplete} />
                )}
            </AnimatePresence>
            <MatrixRain />
            <NavRevealPin />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translate(${panX % (80 * scale)}px,${panY % (80 * scale)}px)`,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                <HoloGrid scale={scale} />
            </div>
            <div
                ref={containerRef}
                className="mde-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                style={{ position: "absolute", inset: 0, zIndex: 2 }}
            >
                <div
                    style={{
                        transform: `translate(${panX}px,${panY}px) scale(${scale})`,
                        transformOrigin: "0 0",
                        position: "absolute",
                        width: 0,
                        height: 0,
                    }}
                >
                    <svg
                        style={{
                            position: "absolute",
                            overflow: "visible",
                            width: 1,
                            height: 1,
                            left: 0,
                            top: 0,
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    >
                        <AnimatePresence>
                            {connections.map((c) => (
                                <EnergyConnection
                                    key={`${c.from.id}-${c.to.id}`}
                                    x1={c.from.x}
                                    y1={c.from.y}
                                    x2={c.to.x}
                                    y2={c.to.y}
                                    r1={c.r1}
                                    r2={c.r2}
                                    color={c.color}
                                />
                            ))}
                        </AnimatePresence>
                    </svg>
                    <AnimatePresence>
                        {NODES.map((node) => (
                            <MapNodeComponent
                                key={node.id}
                                node={node}
                                isExpanded={expandedNodes.has(node.id)}
                                isVisible={visibleNodes.has(node.id)}
                                onToggle={toggleExpand}
                                onSelect={toggleSelect}
                                onCommand={toggleCommand}
                                onBirdEye={toggleBirdEye}
                                onHoverChange={setHoveredNodeId}
                                isSelected={selectedNode === node.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            <TitleOverlay />
            {authHeader && (
                <div
                    style={{
                        position: "fixed",
                        top: 14,
                        right: 18,
                        zIndex: 60,
                    }}
                >
                    {authHeader}
                </div>
            )}
            <AnimatePresence>
                {selectedNodeData && !commandNode && (
                    <InfoPanel
                        node={selectedNodeData}
                        onClose={() => setSelectedNode(null)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {commandNode && (
                    <CommandPanel
                        nodeId={commandNode}
                        onClose={() => setCommandNode(null)}
                        onNavigate={(id) => setCommandNode(id)}
                        sbUrl={supabaseUrl}
                        sbKey={supabaseAnonKey}
                    />
                )}
            </AnimatePresence>
            <MiniMap
                nodes={NODES}
                visibleNodes={visibleNodes}
                panX={panX}
                panY={panY}
                scale={scale}
                viewW={viewSize.w}
                viewH={viewSize.h}
            />
            <ZoomBadge scale={scale} />
            <CommandsLegend />
        </div>
    )
}

export default HologramaDeExpansion
addPropertyControls(HologramaDeExpansion, {
    domoMode: {
        type: ControlType.Boolean,
        title: "Modo Domo",
        defaultValue: false,
    },
    supabaseUrl: {
        type: ControlType.String,
        title: "🔗 Supabase URL",
        defaultValue: "",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "🔑 Supabase Key",
        defaultValue: "",
    },
})
