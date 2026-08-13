// Red Solar Viva — Meditaciones.tsx v10.10
// v10.9 — Frecuencias acepta `mobileTitleMode` ("compact" default vs
// "centered"). En el modo "centered" (que usa el Domo en la ruta raíz
// /meditaciones) suprime el prefijo "HOLOTECA · MEDITACIONES" y muestra
// el título centrado tipo hero — el mismo lenguaje que Co_Mobile usa
// para la ruta /codices. Además, el indicador de Cristales se mueve a
// top-LEFT en mobile cuando el modo es "centered", porque en la raíz
// el SolarNav ocupa la esquina superior derecha y antes tapaba el
// chip. Dentro del shell de Holoteca el indicador sigue a la derecha
// como hoy.
// v10.8 — Indicador del Cristal cyan movido al top-right en mobile
// (desktop sigue en top-left donde no choca con el cluster de auth).
// En mobile la barra superior del shell del Escáner ya no muestra
// avatar ni el botón ⬡ Escáner — la esquina derecha quedó libre y
// es donde el ojo de Zak espera ver el contador.
// v10.7 — Tres afinaciones tras v10.6:
//   1. Pantalla negra al entrar a /meditaciones standalone (Domo
//      directo, no shell del Escáner) — fix: removido el gate
//      `animate={isReady ? "visible" : "hidden"}` del motion.div
//      principal. En montajes outside-shell el flag isReady no
//      llegaba a true (probable race con los hooks nuevos de
//      Cristales) y el árbol quedaba en cV.hidden con opacity 0.
//      Ahora animamos directo desde mount; el stagger interno del
//      cV.visible mantiene el fade escalonado.
//   2. Indicador cyan SOLO para Sintonía Solar (siempre visible,
//      con 0 si gastó). Inmersión Solar no lo ve porque las
//      meditaciones son libres para ellos. Anclado a la izquierda
//      (top-left) en lugar de la derecha para no chocar con la
//      pildora de auth + el botón ⬡ Escáner.
//   3. paddingTop mobile del medList sube de 0 → 32 para que la
//      primera meditación no choque con el indicador de cristal
//      ni con el título "MEDITACIONES" del shell.
//   + Console.log de mount para diagnosticar futuros problemas
//     de montaje silencioso (`[Frecuencias] mounted ...`).
// v10.6 — Integración del flow Cristales de Extracción (cyan).
//   • Importa Cristales.tsx (useCristales, useMembershipTier,
//     CristalesIndicator, ConfirmarCristalModal,
//     redeemMeditacionWithCristal, getMyMeditacionesOwned).
//   • Hook root en Frecuencias: detecta clerkUserId via window.Clerk
//     polling, llama get_my_meditaciones_owned + get_my_membership_tier.
//   • Inmersión Solar = bypass total: TODAS las meditaciones se tratan
//     como `unlocked` (audio se reproduce directo sin canje, sin
//     gastar cristal cyan).
//   • Sintonía Solar / Explorer:
//     · Si la meditación ya fue canjeada → unlocked (registrada en
//       meditaciones_owned).
//     · Si tiene cristal cyan disponible → al picar el card abre
//       modal de canje. Confirmar canjea (descuenta cristal +
//       inserta en meditaciones_owned) y desbloquea inmediato.
//     · Si no tiene cristal y no es Inmersión → flow legacy
//       (modal con info del Stripe Payment Link).
//   • Indicador cyan fixed top-right cuando meditacionCount > 0
//     (oculto para Inmersión Solar — no aplica).
//   • Context `MeditacionUnlockContext` para que MeditationCard
//     consuma sin propagar props por niveles.
// Red Solar Viva — Meditaciones.tsx v10.5
// v10.5 — Animación de entrada del título dividida por viewport:
// mobile usa la rápida (0.45s, sin blur, sin delay) idéntica a
// Códices/Holoteca/Códigos/Fragmentos. Desktop conserva la entrada
// hero con blur 8px + duration 1.2s + delay 0.2s. Antes mobile y
// desktop compartían la animación lenta — el título tardaba ~1.7s
// en llegar a su lugar y se sentía perezoso comparado con el resto
// de las sub-capas del Lente.
// Meditaciones.tsx v10.4
// v10.4 — Mobile título refactorizado al patrón Holoteca:
// "HOLOTECA · MEDITACIONES" con fontSize 14, fontWeight 200,
// letterSpacing 0.22em, gradient 180deg accent→white, drop-shadow,
// breath animation, textAlign:left + paddingLeft:16. El título
// grande original se conserva intacto en desktop. Aprovecha el
// keyframe nuc-breath inyectado globalmente por AppNavegacionMobile.
// Meditaciones.tsx v10.3
// v10.3 — Embed mode: nuevo prop bottomReservePx. Cuando > 0, el
// wrapper externo pasa a height auto + overflow visible para que el
// scroll lo maneje el shell de AppNavegacionMobile. Mobile titleWrap
// marginTop baja a 4 (antes 70) — el título MEDITACIONES alinea con
// MI NÚCLEO mobile.
// Meditaciones.tsx v10.2 (Solo una meditación se reproduce a la vez:
// cuando una arranca, dispara un evento global que pausa todas las
// demás. Sin múltiples audios solapados)
import * as React from "react"
import * as ReactDOM from "react-dom"
import {
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
    useCallback,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"
import Cristales from "./Cristales.tsx"
const {
    useCristales,
    useMembershipTier,
    CristalesIndicator,
    ConfirmarCristalModal,
    redeemMeditacionWithCristal,
    registerMeditacionInmersionLibre,
    getMyMeditacionesOwned,
} = Cristales

/* v10.6 — Context para el flow de canje de Meditaciones con
   Cristal (cyan). Lo provee Frecuencias en su root y lo consume
   MeditationCard para decidir si una meditación pagada se trata
   como `unlocked` (Inmersión libre o ya canjeada) o si al picar
   el card se abre el modal de canje. Si no hay cristal disponible
   y no es Inmersión, MeditationCard sigue su flow legacy (modal
   de info con botón de pago a Stripe). */
type MeditacionUnlockState = {
    isUnlocked: (item: any) => boolean
    tryRedeem: (item: any) => boolean
}
const MeditacionUnlockContext = React.createContext<MeditacionUnlockState>({
    isUnlocked: (i: any) => i?.type === "free",
    tryRedeem: () => false,
})

/* v8 — Detección móvil UA-first (mismo patrón que EscanerVibracional,
   Codices y Sesiones). Necesario porque este componente se renderiza
   dentro del SPA del Domo y el viewport inicial puede ser engañoso. */
function useIsMobile() {
    const get = () => {
        if (typeof window === "undefined") return false
        const ua = navigator.userAgent
        if (/iPhone|iPod|Android[\s\S]*?Mobile/i.test(ua)) return true
        return window.innerWidth < 768
    }
    const [m, setM] = useState(get)
    useEffect(() => {
        const h = () => setM(get())
        window.addEventListener("resize", h)
        return () => window.removeEventListener("resize", h)
    }, [])
    return m
}

const CSS_STYLES = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap');
.frecuencias-scroll-container::-webkit-scrollbar{display:none!important;width:0!important}
.frecuencias-scroll-container{-ms-overflow-style:none!important;scrollbar-width:none!important}
.frecuencias-med-list::-webkit-scrollbar{display:none!important;width:0!important}
.frecuencias-med-list{-ms-overflow-style:none!important;scrollbar-width:none!important}
html:has(.frecuencias-scroll-container)::-webkit-scrollbar,html:has(.frecuencias-scroll-container) body::-webkit-scrollbar{display:none!important}
html:has(.frecuencias-scroll-container),html:has(.frecuencias-scroll-container) body{scrollbar-width:none!important;-ms-overflow-style:none!important}
.stars-warp-container{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;perspective:400px;background:transparent}
.star-warp{position:absolute;left:50%;top:50%;width:var(--size);height:var(--size);border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.6);animation:space-flight var(--dur) linear infinite;animation-delay:var(--delay);opacity:0;will-change:transform,opacity}
@keyframes space-flight{0%{transform:translate3d(var(--x),var(--y),-1000px);opacity:0}10%{opacity:1}100%{transform:translate3d(var(--x),var(--y),200px);opacity:0}}
@keyframes frec-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
`

const hexToRgba = (hex: string, a = 1) => {
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function mixWhiteAccent(accentHex: string, whitePct = 0.8): string {
    const c = accentHex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    const ar = (n >> 16) & 255,
        ag = (n >> 8) & 255,
        ab = n & 255
    return `rgb(${Math.round(255 * whitePct + ar * (1 - whitePct))},${Math.round(255 * whitePct + ag * (1 - whitePct))},${Math.round(255 * whitePct + ab * (1 - whitePct))})`
}

/* v10 — CATÁLOGO DE MEDITACIONES (single source of truth en código).
   Un solo edit acá actualiza TODOS los canvases del site (antes había
   que modificar el property control de cada instancia de Framer, una
   por una). Audio hosteado en Cloudflare R2 — barato, rápido, egress
   gratis. Para agregar una meditación nueva: subí el .mp3 al bucket R2
   bajo `Meditaciones/<nombre>.mp3` y pegá un nuevo objeto acá. */
const MEDITATIONS_LIBRARY: {
    id: string
    title: string
    desc: string
    duration: string
    type: "free" | "paid"
    audio?: string
    price?: string
    link?: string
}[] = [
    {
        id: "amanecer-del-eje",
        title: "Amanecer del Eje",
        desc: "Sintoniza tu eje al amanecer en 12 min.",
        duration: "12 min",
        type: "free",
        audio: "https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/Amanecer%20del%20Eje.mp3",
    },
    {
        id: "anochecer-del-eje",
        title: "Anochecer del Eje",
        desc: "Transición hacia la sala de colapso de reflejos (sueños).",
        duration: "16 min",
        type: "free",
        audio: "https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/Anochecer%20del%20Eje.mp3",
    },
]

function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "holo-frecuencias-zen-v7"
        const p = document.getElementById(id) as HTMLStyleElement | null
        if (p) {
            p.textContent = CSS_STYLES
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = CSS_STYLES
        document.head.appendChild(s)
    }, [])
}

const StarsBackground = React.memo(
    ({ num = 80, speed = 1 }: { num?: number; speed?: number }) => {
        const [stars, setStars] = useState<any[]>([])
        useEffect(() => {
            const a = []
            for (let i = 0; i < Math.floor(num * 1.5); i++)
                a.push({
                    id: i,
                    size:
                        Math.random() > 0.8
                            ? Math.random() * 2 + 1
                            : Math.random() * 1.5 + 0.5,
                    x: (Math.random() - 0.5) * 250,
                    y: (Math.random() - 0.5) * 250,
                    baseDuration: 1.5 + Math.random() * 4,
                    delay: Math.random() * 5,
                })
            setStars(a)
        }, [num])
        return (
            <div className="stars-warp-container">
                {stars.map((s) => (
                    <div
                        key={s.id}
                        className="star-warp"
                        style={
                            {
                                "--size": `${s.size}px`,
                                "--x": `${s.x}vw`,
                                "--y": `${s.y}vh`,
                                "--dur": `${s.baseDuration / speed}s`,
                                "--delay": `${s.delay}s`,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
        )
    }
)

const AudioWave = ({ color }: { color: string }) => (
    <motion.svg
        viewBox="0 0 1440 320"
        style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            bottom: 0,
            opacity: 0.15,
            pointerEvents: "none",
        }}
        preserveAspectRatio="none"
    >
        <motion.path
            fill={color}
            animate={{
                d: [
                    "M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                    "M0,96L48,122.7C96,149,192,203,288,202.7C384,203,480,149,576,133.3C672,117,768,139,864,160C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                    "M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
    </motion.svg>
)

/* v8 — sty factory ahora acepta `isMobile` para devolver paddings / gaps
   más compactos en viewport móvil sin romper el look desktop. */
const sty = {
    page: (bg: string, isEmbedded: boolean = false) => ({
        position: "relative" as const,
        width: "100%",
        /* v10 — En embed mode (montado dentro del shell del Lente
           con bottomReservePx>0), height auto + overflow visible para
           que el scroll lo maneje el wrapper externo. */
        height: isEmbedded ? "auto" : "100vh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter',sans-serif",
        overflow: isEmbedded ? ("visible" as const) : ("hidden" as const),
    }),
    titleWrap: (mt: number, isMobile: boolean) => ({
        width: "100%",
        display: "flex",
        justifyContent: "center",
        /* v9 — Lente: offset fijo a 70px para matchear la altura del título
           "CÓDICES DE LUZ" (topPaddingPx en Codices.tsx). Centro de Mando
           respeta el prop del property control.
           v10 — Lente: offset baja a 4px para alinear el título de
           MEDITACIONES a la altura del título MI NÚCLEO mobile (todos
           arrancan a 32+4 = 36 px del top del viewport). */
        marginTop: isMobile ? 4 : mt,
        marginBottom: isMobile ? 48 : 40,
        position: "relative" as const,
        zIndex: 50,
        pointerEvents: "none" as const,
    }),
    medList: (mw: number, isMobile: boolean) => ({
        width: "100%",
        maxWidth: mw,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column" as const,
        gap: isMobile ? "14px" : "20px",
        /* v10.7 — paddingTop mobile sube de 0 → 32 para que la
           primera meditación no quede chocando con el indicador
           de cristal cyan (top: 14, height ~30) ni con el título
           "MEDITACIONES" del shell. */
        padding: isMobile
            ? "32px 16px 140px 16px"
            : "0 20px 120px 20px",
        position: "relative" as const,
        zIndex: 5,
        overflowY: "auto" as const,
        /* Mobile: aprovechar casi todo el viewport (menos hamburguesa + dock
           visual del site). Desktop conserva los 75vh originales. */
        maxHeight: isMobile ? "calc(100vh - 160px)" : "75vh",
        pointerEvents: "auto" as const,
        WebkitOverflowScrolling: "touch" as const,
    }),
}
const cV = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
}
const tV = {
    hidden: { opacity: 0, filter: "blur(12px)", pointerEvents: "none" },
    visible: {
        opacity: 1,
        filter: "blur(0px)",
        pointerEvents: "auto",
        transition: { duration: 2.5, ease: "easeOut" },
    },
}
const iV = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 50, damping: 20 },
    },
}

const KeyAccessModal = ({
    item,
    accent,
    isOpen,
    onClose,
}: {
    item: any
    accent: string
    isOpen: boolean
    onClose: () => void
}) => {
    useEffect(() => {
        if (!isOpen) return
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                onClose()
            }
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [isOpen, onClose])
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden"
        else document.body.style.overflow = ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])
    if (!isOpen) return null
    const mc = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.9)",
                backdropFilter: "blur(20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: 20,
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    maxWidth: 480,
                    width: "100%",
                    background:
                        "linear-gradient(180deg,rgba(15,25,35,0.98) 0%,rgba(8,12,20,0.99) 100%)",
                    borderRadius: 24,
                    border: `1px solid ${hexToRgba("#FFD700", 0.4)}`,
                    padding: "48px 32px 40px",
                    boxShadow: `0 0 80px ${hexToRgba("#FFD700", 0.2)},0 30px 60px rgba(0,0,0,0.6)`,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "80%",
                        height: 2,
                        background:
                            "linear-gradient(90deg,transparent,#FFD700,transparent)",
                    }}
                />
                <motion.button
                    whileHover={{
                        scale: 1.1,
                        background: "rgba(255,215,0,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${hexToRgba("#FFD700", 0.4)}`,
                        background: "rgba(255,215,0,0.1)",
                        color: "#FFD700",
                        fontSize: 20,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.8,
                    }}
                >
                    ✕
                </motion.button>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 24,
                    }}
                >
                    <motion.div
                        animate={{
                            boxShadow: [
                                `0 0 20px ${hexToRgba("#FFD700", 0.3)}`,
                                `0 0 40px ${hexToRgba("#FFD700", 0.5)}`,
                                `0 0 20px ${hexToRgba("#FFD700", 0.3)}`,
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            width: 70,
                            height: 70,
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 30% 30%,${hexToRgba("#FFD700", 0.3)},${hexToRgba("#FFD700", 0.1)})`,
                            border: `2px solid ${hexToRgba("#FFD700", 0.5)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                        }}
                    >
                        🔑
                    </motion.div>
                </div>
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: 22,
                        fontWeight: 600,
                        color: "#FFD700",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        margin: "0 0 16px",
                        textShadow: `0 0 20px ${hexToRgba("#FFD700", 0.5)}`,
                    }}
                >
                    {item.title}
                </h2>
                <p
                    style={{
                        textAlign: "center",
                        fontSize: 15,
                        color: "rgba(255,255,255,0.7)",
                        margin: "0 0 28px",
                        lineHeight: 1.6,
                    }}
                >
                    Esta frecuencia requiere una{" "}
                    <span style={{ color: "#FFD700" }}>Llave de Acceso</span>.
                </p>
                <div
                    style={{
                        background: "rgba(255,215,0,0.05)",
                        borderRadius: 16,
                        padding: "20px 24px",
                        marginBottom: 28,
                        border: `1px solid ${hexToRgba("#FFD700", 0.15)}`,
                    }}
                >
                    <p
                        style={{
                            fontSize: 11,
                            color: "rgba(255,215,0,0.7)",
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            margin: "0 0 12px",
                        }}
                    >
                        Incluye:
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <span style={{ fontSize: 18 }}>✨</span>
                            <span style={{ color: "#fff", fontSize: 14 }}>
                                Audio de Alta Fidelidad{" "}
                                <span
                                    style={{ color: "rgba(255,255,255,0.5)" }}
                                >
                                    ({item.duration})
                                </span>
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <span style={{ fontSize: 18 }}>📜</span>
                            <span style={{ color: "#fff", fontSize: 14 }}>
                                PDF de Integración
                            </span>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileHover={{
                        scale: 1.02,
                        boxShadow: `0 0 30px ${hexToRgba("#FFD700", 0.5)}`,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (item.link)
                            window.open(
                                item.link,
                                item.newTab ? "_blank" : "_self"
                            )
                    }}
                    style={{
                        width: "100%",
                        padding: "16px 24px",
                        borderRadius: 50,
                        border: "none",
                        background:
                            "linear-gradient(135deg,#FFD700 0%,#FFA500 100%)",
                        color: "#000",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: `0 0 20px ${hexToRgba("#FFD700", 0.3)}`,
                    }}
                >
                    Adquirir Llave — {item.price || "$222 MXN"}
                </motion.button>
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        height: 1,
                        background: `linear-gradient(90deg,transparent,${hexToRgba("#FFD700", 0.3)},transparent)`,
                    }}
                />
            </motion.div>
        </motion.div>
    )
    if (typeof document !== "undefined")
        return ReactDOM.createPortal(mc, document.body)
    return mc
}

const MeditationCard = ({ item, accent, isMobile = false }: any) => {
    /* v10.6 — Si el Tripulante tiene Inmersión Solar activa, o ya
       canjeó esta meditación con cristal, el card se trata como
       unlocked (igual que type:"free"). Si tiene cristal cyan
       disponible, picar abre el modal de canje. Si nada de lo
       anterior, flow legacy (modal con botón de compra). */
    const unlock = React.useContext(MeditacionUnlockContext)
    const isUnlockedByContext = unlock.isUnlocked(item)
    const isPaidEffective = item.type === "paid" && !isUnlockedByContext
    const isPaid = isPaidEffective
    const tc = isPaid ? "#FFD700" : accent
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const waveData = useRef<number[]>(
        Array(50)
            .fill(0)
            .map(() => Math.random() * 0.3 + 0.1)
    )
    const handleClick = () => {
        if (isPaidEffective) {
            /* v10.6 — Si hay cristal disponible, el context abre
               el modal de canje y retorna true (canceló el flow
               legacy). Si retorna false, mostramos el modal de
               compra como antes. */
            const intercepted = unlock.tryRedeem(item)
            if (!intercepted) {
                setIsModalOpen(true)
            }
        } else {
            setIsExpanded(!isExpanded)
            if (!isExpanded && item.audio)
                setTimeout(() => {
                    audioRef.current?.play().catch(() => {})
                }, 300)
            else if (isExpanded && audioRef.current) {
                audioRef.current.pause()
                setIsPlaying(false)
            }
        }
    }
    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            /* v10.1 — play() retorna Promise. Si la rechaza (por ejemplo
               NotAllowedError de la política de autoplay, o NetworkError
               por CORS/404), capturamos y logueamos. setIsPlaying(true)
               lo manejará el listener 'play' del propio audio cuando
               efectivamente arranque. */
            audioRef.current
                .play()
                .catch((err) =>
                    console.warn(
                        "[Meditaciones] play() rechazado:",
                        err?.name,
                        err?.message
                    )
                )
        }
    }
    const fmt = (t: number) =>
        `${Math.floor(t / 60)}:${Math.floor(t % 60)
            .toString()
            .padStart(2, "0")}`
    useEffect(() => {
        if (!item.audio || isPaid) return
        const a = new Audio(item.audio)
        /* v10.1 — NO setear crossOrigin="anonymous" para reproducción
           básica. Lo necesitábamos solo si quisiéramos leer el audio
           con Web Audio API (visualizador de waveform real). El canvas
           actual genera la visualización a partir de Math.random + el
           progreso, NO usa AudioContext, así que no requiere CORS. Con
           crossOrigin activo el browser rechaza el audio si el bucket
           R2 no devuelve Access-Control-Allow-Origin → reproductor no
           cargaba en el Lente. Sin él, el <audio> funciona como un
           media element común. */
        audioRef.current = a
        a.addEventListener("loadedmetadata", () => setDuration(a.duration))
        a.addEventListener("timeupdate", () => setCurrentTime(a.currentTime))
        /* v10.2 — Cuando ESTE audio arranca, broadcast a todas las
           cards: "soy yo el que está sonando, ustedes paren". Cada
           card escucha el evento y si el id no es el suyo, pausa su
           propio audio. Garantiza que nunca haya 2 reproducciones
           simultáneas dentro del componente Meditaciones. */
        a.addEventListener("play", () => {
            setIsPlaying(true)
            try {
                window.dispatchEvent(
                    new CustomEvent("rsv-meditation-play", {
                        detail: { id: item.id },
                    })
                )
            } catch {}
        })
        a.addEventListener("pause", () => setIsPlaying(false))
        a.addEventListener("ended", () => {
            setIsPlaying(false)
            setCurrentTime(0)
        })
        a.addEventListener("error", (e) => {
            console.warn(
                "[Meditaciones] Audio load error:",
                a.error?.code,
                a.error?.message,
                "url:",
                item.audio
            )
        })
        const onOtherPlay = (e: Event) => {
            const ev = e as CustomEvent<{ id: string }>
            if (ev.detail?.id !== item.id && !a.paused) {
                a.pause()
            }
        }
        window.addEventListener(
            "rsv-meditation-play",
            onOtherPlay as EventListener
        )
        return () => {
            a.pause()
            a.src = ""
            window.removeEventListener(
                "rsv-meditation-play",
                onOtherPlay as EventListener
            )
        }
    }, [item.audio, isPaid, item.id])
    useEffect(() => {
        const cv = canvasRef.current
        if (!cv || !isExpanded) return
        const ctx = cv.getContext("2d")
        if (!ctx) return
        let aid: number
        const anim = () => {
            aid = requestAnimationFrame(anim)
            const r = cv.getBoundingClientRect()
            const d = window.devicePixelRatio || 1
            if (cv.width !== r.width * d || cv.height !== r.height * d) {
                cv.width = r.width * d
                cv.height = r.height * d
                ctx.scale(d, d)
            }
            const w = r.width,
                h = r.height
            ctx.clearRect(0, 0, w, h)
            const bc = 50,
                bw = (w / bc) * 0.6,
                gp = (w / bc) * 0.4,
                pr = duration > 0 ? currentTime / duration : 0
            waveData.current = waveData.current.map((v) => {
                const tg = isPlaying
                    ? Math.random() * 0.5 + 0.3
                    : Math.random() * 0.2 + 0.2
                return v + (tg - v) * 0.03
            })
            for (let i = 0; i < bc; i++) {
                const x = i * (bw + gp),
                    hm = waveData.current[i],
                    bh = h * hm,
                    y = (h - bh) / 2
                if (i / bc <= pr) {
                    const g = ctx.createLinearGradient(x, y, x, y + bh)
                    g.addColorStop(0, hexToRgba(accent, 0.9))
                    g.addColorStop(0.5, hexToRgba(accent, 1))
                    g.addColorStop(1, hexToRgba(accent, 0.9))
                    ctx.fillStyle = g
                    ctx.shadowColor = accent
                    ctx.shadowBlur = 6
                } else {
                    ctx.fillStyle = hexToRgba(accent, 0.15)
                    ctx.shadowBlur = 0
                }
                ctx.beginPath()
                ctx.roundRect(x, y, bw, bh, 2)
                ctx.fill()
                ctx.shadowBlur = 0
            }
            if (pr > 0 && pr < 1) {
                const px = pr * w
                ctx.beginPath()
                ctx.moveTo(px, h * 0.15)
                ctx.lineTo(px, h * 0.85)
                ctx.strokeStyle = hexToRgba(accent, 0.8)
                ctx.lineWidth = 2
                ctx.shadowColor = accent
                ctx.shadowBlur = 8
                ctx.stroke()
                ctx.shadowBlur = 0
            }
        }
        anim()
        return () => {
            if (aid) cancelAnimationFrame(aid)
        }
    }, [isExpanded, isPlaying, currentTime, duration, accent])
    const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!audioRef.current || !duration) return
        const r = e.currentTarget.getBoundingClientRect()
        audioRef.current.currentTime =
            ((e.clientX - r.left) / r.width) * duration
    }
    return (
        <>
            <motion.div
                variants={iV}
                layout
                style={{
                    position: "relative",
                    width: "100%",
                    /* v8 — borderRadius reducido en mobile para look más app. */
                    borderRadius: isMobile ? 18 : 24,
                    background:
                        "linear-gradient(90deg,rgba(10,15,25,0.8) 0%,rgba(20,30,45,0.5) 100%)",
                    border: `1px solid ${hexToRgba(tc, isExpanded ? 0.5 : 0.3)}`,
                    overflow: "hidden",
                    boxShadow: isExpanded
                        ? `0 0 30px ${hexToRgba(tc, 0.2)}`
                        : "none",
                }}
            >
                <div
                    onClick={handleClick}
                    style={{
                        display: "grid",
                        /* v8 — layout compacto en mobile: icon 56, gap reducido,
                           padding más chico para que la card quepa y respire. */
                        gridTemplateColumns: isMobile
                            ? "56px 1fr auto"
                            : "80px 1fr auto",
                        alignItems: "center",
                        padding: isMobile ? 14 : 20,
                        gap: isMobile ? 14 : 24,
                        cursor: "pointer",
                    }}
                >
                    <div
                        style={{
                            width: isMobile ? 56 : 80,
                            height: isMobile ? 56 : 80,
                            borderRadius: isMobile ? 14 : 20,
                            background: `radial-gradient(circle at 50% 50%,${hexToRgba(tc, 0.2)},transparent)`,
                            border: `1px solid ${hexToRgba(tc, 0.2)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            boxShadow: `0 0 25px ${hexToRgba(tc, 0.15)}`,
                        }}
                    >
                        <motion.div
                            animate={
                                isPlaying && !isPaid
                                    ? {
                                          scale: [1, 1.2, 1],
                                          opacity: [0.8, 1, 0.8],
                                      }
                                    : {}
                            }
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                border: `2px solid ${tc}`,
                                boxShadow: `0 0 ${isPlaying && !isPaid ? 15 : 8}px ${tc}`,
                                background:
                                    isPlaying && !isPaid ? tc : "transparent",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    padding: "3px 9px",
                                    borderRadius: 8,
                                    background: hexToRgba(tc, 0.15),
                                    color: tc,
                                    border: `1px solid ${hexToRgba(tc, 0.3)}`,
                                }}
                            >
                                {isPaid ? "ACCESO LLAVE" : "ABIERTA"}
                            </span>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "#888",
                                    fontWeight: 500,
                                }}
                            >
                                {item.duration}
                            </span>
                        </div>
                        <h3
                            style={{
                                fontSize: isMobile ? 15 : 19,
                                fontWeight: 600,
                                color: "#fff",
                                margin: "0 0 4px",
                                lineHeight: 1.25,
                            }}
                        >
                            {item.title}
                        </h3>
                        <p
                            style={{
                                fontSize: isMobile ? 12 : 14,
                                color: "#AAA",
                                margin: 0,
                                lineHeight: 1.4,
                                /* v8 — en mobile la descripción puede truncar
                                   a 2 líneas; al expandir se ve completa. */
                                display: isMobile && !isExpanded ? "-webkit-box" : undefined,
                                WebkitLineClamp: isMobile && !isExpanded ? 2 : undefined,
                                WebkitBoxOrient: isMobile && !isExpanded ? "vertical" : undefined,
                                overflow: isMobile && !isExpanded ? "hidden" : undefined,
                            }}
                        >
                            {item.desc}
                        </p>
                    </div>
                    <div
                        style={{
                            color: tc,
                            opacity: 0.7,
                            fontSize: isMobile ? 22 : 28,
                            paddingRight: isMobile ? 4 : 10,
                        }}
                    >
                        {isPaid ? (
                            "🔑"
                        ) : (
                            <motion.span
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: "inline-block" }}
                            >
                                →
                            </motion.span>
                        )}
                    </div>
                </div>
                {!isPaid && (
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeInOut",
                                }}
                                style={{ overflow: "hidden" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div
                                    style={{
                                        padding: "0 20px 20px",
                                        borderTop: `1px solid ${hexToRgba(tc, 0.2)}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 16,
                                            paddingTop: 16,
                                        }}
                                    >
                                        <motion.button
                                            whileHover={{
                                                scale: 1.1,
                                                boxShadow: `0 0 20px ${hexToRgba(tc, 0.5)}`,
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={togglePlay}
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                border: `2px solid ${tc}`,
                                                background: isPlaying
                                                    ? tc
                                                    : "transparent",
                                                color: isPlaying ? "#000" : tc,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: `0 0 15px ${hexToRgba(tc, 0.3)}`,
                                                flexShrink: 0,
                                                padding: 0,
                                            }}
                                        >
                                            {/* v10.1 — SVG vector en lugar
                                               de emoji ▶/❚❚. Iconos solar:
                                               triángulo de play con el vértice
                                               ligeramente desplazado para
                                               peso óptico balanceado, y
                                               dos barras de pause con
                                               border-radius. Ambos heredan
                                               currentColor del button. */}
                                            {isPlaying ? (
                                                <svg
                                                    width="16"
                                                    height="18"
                                                    viewBox="0 0 16 18"
                                                    fill="currentColor"
                                                    aria-hidden
                                                >
                                                    <rect
                                                        x="1"
                                                        y="1"
                                                        width="4.5"
                                                        height="16"
                                                        rx="1.2"
                                                    />
                                                    <rect
                                                        x="10.5"
                                                        y="1"
                                                        width="4.5"
                                                        height="16"
                                                        rx="1.2"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    width="16"
                                                    height="18"
                                                    viewBox="0 0 16 18"
                                                    fill="currentColor"
                                                    aria-hidden
                                                    style={{ marginLeft: 2 }}
                                                >
                                                    <path d="M2.4 1.6 A1 1 0 0 0 1 2.5 V15.5 A1 1 0 0 0 2.4 16.4 L14.5 9.85 A1 1 0 0 0 14.5 8.15 Z" />
                                                </svg>
                                            )}
                                        </motion.button>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 50,
                                                position: "relative",
                                            }}
                                        >
                                            <canvas
                                                ref={canvasRef}
                                                onClick={handleSeek}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    cursor: "pointer",
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: tc,
                                                fontFamily: "monospace",
                                                letterSpacing: "0.05em",
                                                flexShrink: 0,
                                                minWidth: 90,
                                                textAlign: "right" as const,
                                            }}
                                        >
                                            {fmt(currentTime)} /{" "}
                                            {fmt(duration || 0)}
                                        </div>
                                    </div>
                                    {!item.audio && (
                                        <div
                                            style={{
                                                textAlign: "center",
                                                padding: "20px 0 10px",
                                                color: hexToRgba(tc, 0.6),
                                                fontSize: 13,
                                            }}
                                        >
                                            Audio no configurado
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
            <AnimatePresence>
                {isModalOpen && (
                    <KeyAccessModal
                        item={item}
                        accent={accent}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export function Frecuencias(props: any) {
    /* v10 — `meditations` prop también eliminado del destructuring: el
       catálogo vive hardcoded en MEDITATIONS_LIBRARY (arriba de este
       archivo). La UI de Framer ya no expone el array de meditaciones.
       Para editar, se modifica el array en código. */
    const {
        bgColor = "#0B0C13",
        accentColor = "#00C2FF",
        numStars = 80,
        warpSpeed = 1,
        pageTitleText = "MEDITACIONES",
        pageTitleHeight = 72,
        pageTitleTopOffset = 80,
        /* v10 — bottomReservePx > 0 indica que estamos embebidos en
           el shell de AppNavegacionMobile; cambia el wrapper a height
           auto + overflow visible para que el scroll lo maneje el shell. */
        bottomReservePx = 0,
        /* v10.6 — Supabase para flow Cristales. Se inyectan vía Domo
           o el shell. Sin estos, el flow se desactiva silenciosamente
           y todo se comporta como antes. */
        supabaseUrl = "",
        supabaseAnonKey = "",
        /* v10.9 — "compact" (default) → prefijo "HOLOTECA · MEDITACIONES"
           top-left + indicador de Cristales top-right (el shell del
           Escáner deja la esquina derecha libre).
           "centered" → título hero centrado sin prefijo + indicador
           top-left. Lo usa Domo cuando el componente vive en la ruta
           raíz /meditaciones, donde el SolarNav ocupa la derecha. */
        mobileTitleMode = "compact",
    } = props
    const useCenteredTitle = mobileTitleMode === "centered"
    /* v10.7 — Log al mount para diagnosticar pantalla negra cuando
       Frecuencias se monta fuera del shell del Escáner. Si Diego
       reporta que entra negro, el log nos dice si el componente
       siquiera empezó a renderizar. */
    useEffect(() => {
        console.log("[Frecuencias] mounted", {
            isEmbedded: bottomReservePx > 0,
            hasSupabase: !!(supabaseUrl && supabaseAnonKey),
            supabaseUrlLen: (supabaseUrl || "").length,
        })
    }, [])
    const meditations = MEDITATIONS_LIBRARY
    useInjectCss()
    const isMobile = useIsMobile()
    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(t)
    }, [])

    /* v10.6 — Cristales de Extracción (cyan).
       1. Detectamos clerkUserId del Tripulante (polling window.Clerk).
       2. useCristales para conteos en tiempo real.
       3. useMembershipTier para bypass de Inmersión.
       4. getMyMeditacionesOwned para hidratar las que ya canjeó. */
    const [clerkUserId, setClerkUserId] = useState<string>("")
    useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => {
            const id = (window as any).Clerk?.user?.id || ""
            setClerkUserId((prev) => (prev !== id ? id : prev))
        }
        tick()
        const interval = setInterval(tick, 1500)
        const onAuth = () => tick()
        window.addEventListener("rsv-auth-changed", onAuth)
        return () => {
            clearInterval(interval)
            window.removeEventListener("rsv-auth-changed", onAuth)
        }
    }, [])
    const cristalesF = useCristales(
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey
    )
    const tierState = useMembershipTier(
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey
    )
    const [meditacionesOwnedIds, setMeditacionesOwnedIds] = useState<
        Set<string>
    >(new Set())
    const refreshOwned = useCallback(async () => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setMeditacionesOwnedIds(new Set())
            return
        }
        const r = await getMyMeditacionesOwned(
            clerkUserId,
            supabaseUrl,
            supabaseAnonKey
        )
        setMeditacionesOwnedIds(new Set(r.ids))
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])
    useEffect(() => {
        refreshOwned()
    }, [refreshOwned])
    useEffect(() => {
        if (typeof window === "undefined") return
        const onChange = () => refreshOwned()
        window.addEventListener("rsv-meditaciones-changed", onChange)
        return () => {
            window.removeEventListener("rsv-meditaciones-changed", onChange)
        }
    }, [refreshOwned])

    /* Modal state — controla qué meditación está pendiente de canje. */
    const [cristalModalMed, setCristalModalMed] = useState<{
        open: boolean
        item: any | null
    }>({ open: false, item: null })

    const isInmersion = tierState.tier === "inmersion"

    /* v10.7 — Auto-registrar todas las meditaciones paid del catálogo
       como `inmersion_libre` para Tripulantes con Inmersión activa.
       Si más adelante se desuscriben, mantienen el acceso a todas
       las meditaciones que estaban en su catálogo durante su
       Inmersión — el privilegio se ancla a la suscripción que ya
       pagaron. Idempotente vía la RPC (UNIQUE clerk + meditacion).
       Disparamos solo cuando tenemos clerkUserId + Inmersión activa
       + creds de Supabase listas. */
    useEffect(() => {
        if (!clerkUserId) return
        if (!isInmersion) return
        if (!supabaseUrl || !supabaseAnonKey) return
        const paidMeditations = MEDITATIONS_LIBRARY.filter(
            (m) => m.type === "paid"
        )
        if (paidMeditations.length === 0) return
        let cancelled = false
        ;(async () => {
            for (const m of paidMeditations) {
                if (cancelled) return
                if (meditacionesOwnedIds.has(m.id)) continue
                await registerMeditacionInmersionLibre(
                    clerkUserId,
                    m.id,
                    supabaseUrl,
                    supabaseAnonKey
                )
            }
            if (!cancelled) refreshOwned()
        })()
        return () => {
            cancelled = true
        }
    }, [
        clerkUserId,
        isInmersion,
        supabaseUrl,
        supabaseAnonKey,
        meditacionesOwnedIds,
        refreshOwned,
    ])

    const isUnlocked = useCallback(
        (item: any) => {
            if (!item) return false
            if (item.type === "free") return true
            if (isInmersion) return true
            if (meditacionesOwnedIds.has(item.id)) return true
            return false
        },
        [isInmersion, meditacionesOwnedIds]
    )
    const tryRedeem = useCallback(
        (item: any): boolean => {
            if (!item || item.type !== "paid") return false
            if (!clerkUserId) return false
            if (cristalesF.meditacionCount <= 0) return false
            setCristalModalMed({ open: true, item })
            return true
        },
        [clerkUserId, cristalesF.meditacionCount]
    )
    const handleConfirmRedeemMed = useCallback(async () => {
        const item = cristalModalMed.item
        if (!item || !clerkUserId) return
        const r = await redeemMeditacionWithCristal(
            clerkUserId,
            item.id,
            supabaseUrl,
            supabaseAnonKey
        )
        if (!r.success) {
            console.warn("[meditacion-cristal] error:", r.error)
            throw new Error(r.error || "redeem_failed")
        }
        /* Actualizar local set para que la UI refleje unlock
           inmediato (evita esperar el RPC GET). */
        setMeditacionesOwnedIds((prev) => {
            const next = new Set(prev)
            next.add(item.id)
            return next
        })
    }, [
        cristalModalMed.item,
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
    ])

    const unlockContextValue: MeditacionUnlockState = React.useMemo(
        () => ({ isUnlocked, tryRedeem }),
        [isUnlocked, tryRedeem]
    )
    /* v9 — Título del Lente matchea Códices (titleFallbackSize = 28px,
       letterSpacing 0.15em). El Centro de Mando respeta pageTitleHeight
       del property control como siempre. */
    const effectiveTitleSize = isMobile ? 28 : pageTitleHeight

    return (
        <MeditacionUnlockContext.Provider value={unlockContextValue}>
        <div
            className="frecuencias-scroll-container"
            style={sty.page(bgColor, bottomReservePx > 0)}
        >
            {/* v10.8 — Indicador de cristal cyan: en mobile va a la
                derecha (la esquina superior derecha del shell del
                Escáner queda libre, ahí es donde Zak espera ver el
                contador). En desktop conservamos top-left para no
                chocar con la pill del avatar / botón ⬡ Escáner.
                v10.9 — Mobile en modo "centered" (raíz /meditaciones)
                el SolarNav ocupa la derecha → el indicador se mueve
                a top-left. Sintonía Solar siempre lo ve (con 0 si
                gastó); Inmersión Solar no lo ve porque las
                meditaciones son libres y el contador no aplica. */}
            {tierState.tier === "sintonia" && (
                <div
                    style={{
                        position: "fixed",
                        top: isMobile ? 14 : 18,
                        right:
                            isMobile && !useCenteredTitle ? 14 : undefined,
                        left:
                            !isMobile
                                ? 24
                                : useCenteredTitle
                                  ? 14
                                  : undefined,
                        zIndex: 9990,
                        pointerEvents: "auto",
                    }}
                >
                    <CristalesIndicator
                        codiceCount={cristalesF.codiceCount}
                        meditacionCount={cristalesF.meditacionCount}
                        onlyKind="meditacion"
                    />
                </div>
            )}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            >
                <AudioWave color={accentColor} />
            </motion.div>
            <motion.div
                /* v10.7 — Removido el gate `isReady ? "visible" : "hidden"`.
                   En montajes outside-shell (Domo standalone en
                   /meditaciones, /holoteca/meditaciones,
                   /escaner/holoteca/meditaciones standalone) el flag
                   isReady se quedaba en false y todo el árbol quedaba
                   en cV.hidden (opacity:0) → pantalla negra. Ahora
                   animamos directo a "visible" desde el mount; el
                   stagger interno (delayChildren) sigue dando la
                   sensación de fade-in escalonado. */
                variants={cV}
                initial="hidden"
                animate="visible"
                style={{
                    position: "relative",
                    zIndex: 2,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    /* v10.4 — Animación de entrada del título dividida
                       por viewport para que el Lente sienta el mismo
                       ritmo que Códices/Holoteca/Códigos/Fragmentos.
                       Mobile: 0.45s sin blur + sin delay → idéntica a
                       las otras sub-capas. Desktop conserva la entrada
                       larga con blur (1.2s, delay 0.2s) que es parte
                       de su estética hero. */
                    initial={
                        isMobile
                            ? { opacity: 0, y: -6 }
                            : { opacity: 0, y: -30, filter: "blur(8px)" }
                    }
                    animate={
                        isMobile
                            ? { opacity: 1, y: 0 }
                            : { opacity: 1, y: 0, filter: "blur(0px)" }
                    }
                    transition={
                        isMobile
                            ? { duration: 0.45, ease: "easeOut" }
                            : { duration: 1.2, delay: 0.2, ease: "easeOut" }
                    }
                    style={
                        isMobile
                            ? useCenteredTitle
                                ? {
                                      width: "100%",
                                      textAlign: "center" as const,
                                      paddingLeft: 16,
                                      paddingRight: 16,
                                      /* env(safe-area-inset-top) suma el
                                         notch SOLO en PWA standalone iOS.
                                         Web normal: env() = 0. */
                                      paddingTop:
                                          "calc(60px + env(safe-area-inset-top, 0px))",
                                      marginBottom: 24,
                                      position: "relative" as const,
                                      zIndex: 50,
                                      pointerEvents: "none" as const,
                                  }
                                : {
                                      width: "100%",
                                      textAlign: "left" as const,
                                      paddingLeft: 16,
                                      marginTop:
                                          "calc(4px + env(safe-area-inset-top, 0px))",
                                      marginBottom: 24,
                                      position: "relative" as const,
                                      zIndex: 50,
                                      pointerEvents: "none" as const,
                                  }
                            : sty.titleWrap(pageTitleTopOffset, isMobile)
                    }
                >
                    {/* v10.4 — Mobile título estilo HOLOTECA con
                        prefijo "HOLOTECA · MEDITACIONES" para anclar
                        al tripulante en el sub-tab. Desktop conserva
                        su título grande original.
                        v10.9 — Mobile en modo "centered" (raíz
                        /meditaciones) usa el hero centrado sin
                        prefijo, idéntico al de Códices en raíz. */}
                    <h1
                        style={
                            isMobile
                                ? useCenteredTitle
                                    ? {
                                          fontFamily: "'Inter',sans-serif",
                                          fontSize: 32,
                                          fontWeight: 200,
                                          letterSpacing: "0.2em",
                                          textTransform: "uppercase",
                                          margin: 0,
                                          lineHeight: 1.1,
                                          userSelect: "none",
                                          color: "transparent",
                                          filter: `drop-shadow(0 0 14px ${hexToRgba(accentColor, 0.35)})`,
                                          WebkitFontSmoothing:
                                              "antialiased",
                                          animation:
                                              "nuc-breath 7s ease-in-out infinite",
                                      }
                                    : {
                                          fontFamily: "'Inter',sans-serif",
                                          fontSize: 14,
                                          fontWeight: 200,
                                          letterSpacing: "0.22em",
                                          marginRight: "-0.22em",
                                          textTransform: "uppercase",
                                          margin: 0,
                                          lineHeight: 1,
                                          userSelect: "none",
                                          color: "transparent",
                                          filter: `drop-shadow(0 0 10px ${hexToRgba(accentColor, 0.3)})`,
                                          WebkitFontSmoothing:
                                              "antialiased",
                                          animation:
                                              "nuc-breath 7s ease-in-out infinite",
                                          whiteSpace: "nowrap",
                                      }
                                : {
                                      fontFamily: "'Inter',sans-serif",
                                      fontSize: effectiveTitleSize,
                                      fontWeight: 100,
                                      letterSpacing: "0.4em",
                                      marginRight: "-0.4em",
                                      lineHeight: 1,
                                      margin: 0,
                                      textTransform:
                                          "uppercase" as const,
                                      textAlign: "center" as const,
                                      width: "100%",
                                      display: "block",
                                      userSelect: "none" as const,
                                      background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                      WebkitBackgroundClip:
                                          "text" as const,
                                      WebkitTextFillColor:
                                          "transparent" as const,
                                      filter: `drop-shadow(0 0 12px ${hexToRgba(accentColor, 0.25)})`,
                                      WebkitFontSmoothing:
                                          "antialiased" as const,
                                      animation:
                                          "frec-breath 7s ease-in-out infinite",
                                  }
                        }
                    >
                        {isMobile ? (
                            <span
                                style={{
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {useCenteredTitle
                                    ? pageTitleText
                                    : "HOLOTECA · MEDITACIONES"}
                            </span>
                        ) : (
                            pageTitleText
                        )}
                    </h1>
                </motion.div>
                <div
                    style={{
                        pointerEvents: "none",
                        flexGrow: 1,
                        position: "relative",
                    }}
                >
                    {/* v9 — Sin AnimatePresence/conditional: la lista de
                       meditaciones siempre se renderiza. La rama
                       "PRÓXIMAMENTE" fue eliminada del componente. */}
                    <motion.div
                        key="meditations"
                        className="frecuencias-med-list"
                        variants={cV}
                        initial="hidden"
                        animate="visible"
                        style={sty.medList(isMobile ? 560 : 800, isMobile)}
                    >
                        {meditations.map((m: any, i: number) => (
                            <MeditationCard
                                key={`med-${i}`}
                                item={m}
                                accent={accentColor}
                                isMobile={isMobile}
                            />
                        ))}
                    </motion.div>
                </div>
            </motion.div>
        </div>
        {/* v10.6 — Modal de canje del Cristal cyan. */}
        <ConfirmarCristalModal
            open={cristalModalMed.open}
            kind="meditacion"
            itemTitle={cristalModalMed.item?.title || ""}
            itemSubtitle={
                cristalModalMed.item?.duration
                    ? `Meditación · ${cristalModalMed.item.duration}`
                    : "Meditación"
            }
            countBefore={cristalesF.meditacionCount}
            onConfirm={handleConfirmRedeemMed}
            onCancel={() =>
                setCristalModalMed({ open: false, item: null })
            }
        />
        </MeditacionUnlockContext.Provider>
    )
}

addPropertyControls(Frecuencias, {
    pageTitleText: {
        type: ControlType.String,
        title: "Título",
        defaultValue: "MEDITACIONES",
    },
    pageTitleHeight: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
        min: 24,
        max: 140,
    },
    pageTitleTopOffset: {
        type: ControlType.Number,
        title: "Offset Título",
        defaultValue: 80,
        min: 0,
        max: 300,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento",
        defaultValue: "#00C2FF",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    numStars: {
        type: ControlType.Number,
        title: "Cant. Estrellas",
        defaultValue: 80,
        min: 0,
        max: 300,
        step: 5,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Vel. Warp",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    /* v10 — property control `meditations` eliminado. El catálogo vive
       hardcoded en MEDITATIONS_LIBRARY al tope de este archivo; edición
       desde la terminal, no desde Framer. */
})
