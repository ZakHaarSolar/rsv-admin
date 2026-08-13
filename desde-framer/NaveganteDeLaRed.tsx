// NaveganteDeLaRed.tsx v2.29 — Fix del token-mint race (espejo del de iOS): los 4 guardados al gateway user-action (migración anon→cuenta, save por-nivel, reset, hidratación) usan gatewayUserAction, que ESPERA el token recién minteado (en login fresco Clerk.user.id resuelve ANTES que el token → el fetch viejo mandaba null → missing_token → el progreso quedaba SOLO local y no aparecía en la cuenta). + anti-flash: el estado del nivel se SIEMBRA desde localStorage en el primer render (readProgressFromStorage en ambas consolas). v2.27 — Fix base: la migración va por el gateway user-action (el REST directo a save_navegante_level está REVOKE'd a anon). + copy del modal "Guarda tu trayectoria".
// v2.26 — Progreso del juego por gateway user-action.
// v2.25 — Fix de la pista de rotación pasiva (PortraitRotationHint): el
// motion.div hijo aplica su propio transform por la animación de y, lo
// que sobrescribía el translateX(-50%) del style y dejaba el pill
// anclado a left:50% sin compensación → el texto "Gira para experiencia
// inmersiva" se cortaba contra el borde derecho. Solución: wrapper no-
// motion con flex centering (left:0/right:0/justify:center) que
// posiciona, y el motion.div hijo solo anima opacity + y. Texto
// completo visible siempre, padding 16 px en el wrapper como guarda
// extra. fontSize 10.5 → 10 y letterSpacing 0.16em → 0.12em para
// dejar más respiro lateral en pantallas estrechas (iPhone SE).
// v2.24 — Pista de rotación + consola horizontal optimizada.
// v2.24 — Tres ajustes mobile reportados por Zak el 2026-05-07:
//   (a) Pista de rotación pasiva (PortraitRotationHint): banda
//       glassmorphism con icono de celular girando + "Gira para
//       experiencia inmersiva". Aparece automáticamente cuando el
//       Tripulante entra a una membrana en portrait y se desvanece
//       sola a los 4.5 s. pointer-events:none para no pisar el canvas.
//       Anclada justo debajo del HUD top (top calc(safe-area-inset-top
//       + 142px)) — ni tapa el botón ←/Reload ni se mete en el campo de
//       juego. Reaparece cada vez que cambia levelKey o que la
//       orientación vuelve a portrait. Sin botón OK ni X: la decisión
//       de Zak v2.19 (RotateHintOverlay quita más de lo que aporta) se
//       respeta — el aviso es discreto y solo sugiere.
//   (b) MobileLevelConsole en LANDSCAPE compacta el header (título
//       reducido, sin descripción larga, sin leyenda de estrellas, sin
//       reset · admin debajo) y la grilla pasa de 2 columnas cuadradas
//       a 5 columnas con cards más anchas que altas (aspectRatio 1.4:1).
//       Las 10 membranas de cada página caben completas en 2 filas sin
//       scroll en cualquier iPhone landscape (web mobile + PWA). El
//       botón Reset · admin se mueve al header inline, junto al
//       TUTORIAL. El botón ← y el TUTORIAL bajan a 36px (vs 42 portrait)
//       para ganar más alto al grid. Texto de cada card pasa de
//       "Membrana N" a "MN" (compacto pero legible). Portrait queda
//       exactamente igual que antes.
//   (c) Pista de rotación es un componente independiente con su propio
//       useEffect; sale del scope del MobileTopHUD para no acoplarlo al
//       state del HUD ni rerender innecesario.
// v2.23 — Tutorial solo en nivel 0 + HUD reorganizado.
// v2.22 — Dos correcciones para landscape mobile reportadas por Zak
// (PWA + web mobile horizontal):
//   (a) MobileSuperButton recibe la prop `orientation`. En landscape
//       deja la columna fire+SUPER (donde chocaba con el botón de
//       disparo) y se monta en el TOP-RIGHT, alineado verticalmente
//       con el botón de reiniciar membrana del HUD top. Posición:
//       top:calc(5px + env(safe-area-inset-top, 0px)) — el centro Y
//       queda alineado con el centro Y del row de buttons (12+env+21);
//       right:calc(env(safe-area-inset-right, 0px) + 124px) — flota a
//       la izquierda del par restart+tutorial, sin overlap. En
//       portrait sigue arriba del fuego como antes.
//   (b) MobileFreqPalette landscape pierde el centrado vertical
//       (top:50% + translateY(-50%)) y se ancla cerca del techo:
//       top:calc(env(safe-area-inset-top, 0px) + 50px). La columna
//       1·2·3·4 sube al tercio superior y el chip 4 (último, abajo)
//       deja de quedar a 23px del botón de disparo.
// (1) Barra de energía pegada al borde superior cuando landscape:
//     se separa del flex-column del HUD top y se monta como banda
//     full-width anclada a env(safe-area-inset-top, 0px). Antes
//     cruzaba a media altura del canvas (después de la fila de
//     botones) y robaba campo visual. Ahora queda como cintilla
//     telemétrica clavada al borde superior. En portrait sigue
//     dentro del flex-column como hasta v2.19.
// (2) Chips de frecuencia 1·2·3·4 en LANDSCAPE viven entre canvas
//     y botón de fuego. Cambia el ancla de
//     `right: env(safe-area-inset-right, 0px) + 14px` (pegado al
//     notch — chocaba con el SUPER y el cuarto chip quedaba
//     debajo del disparador) a
//     `right: env(safe-area-inset-right, 0px) + 132px` (zona libre
//     a la izquierda del fuego de 96px). Pulgar derecho los
//     alcanza sin estirar y sin tapar el cuarto chip.
// (3) Fuego, SUPER y la columna de chips respetan
//     env(safe-area-inset-right, 0px) cuando el iPhone está
//     landscape con la cámara a la derecha (notch lateral). Antes
//     el SUPER quedaba parcialmente debajo de la cámara; ahora
//     desplaza con el inset y nunca toca el notch.
// (4) MobileSeqsColumn (Racha · Código · F3 · F4) sube al tercio
//     superior del campo. Cambia `top: 50%; translateY(-50%)`
//     (centrada y casi tocaba el joystick) por
//     `top: env(safe-area-inset-top, 0px) + 70px` (apenas debajo
//     del HUD top, cae lejos del joystick). Crece hacia abajo
//     desde el ancla.
// NaveganteDeLaRed.tsx v2.19 — Layout landscape AAA + tutorial cabe en notch.
// (1) RotateHintOverlay removido. Decisión de Zak: el portrait se
//     experimenta cómodo, insistir con un aviso flotante quita más
//     de lo que aporta. El juego se adapta al landscape automático
//     vía listeners orientationchange ya existentes.
// (2) MobileFreqPalette en LANDSCAPE: los 4 chips de frecuencia se
//     reposicionan a la derecha en columna vertical, centrados al
//     50% del alto, con offset env(safe-area-inset-right, 0px) + 14px
//     para no chocar con la cámara/notch del iPhone. En portrait
//     conservan su posición horizontal arriba del fuego.
// (3) MobileSeqsColumn (nuevo): en LANDSCAPE las pills "Racha · Código
//     · F4" salen del HUD top y se montan como columna vertical
//     pegada al borde izquierdo con offset
//     env(safe-area-inset-left, 0px) + 14px. MobileTopHUD las oculta
//     condicionalmente cuando orientation === "landscape".
// (4) Modal MobileTutorial: ancho cap a 360px + width calc() restando
//     safe-area-inset-left/right. En LANDSCAPE iPhone la card no se
//     corta por la cámara y queda como modal flotante centrado.
//     Centrado vía left:50% + transform translateX(-50%) — más
//     robusto que left/right + margin auto que no funciona con
//     position:absolute.
// NaveganteDeLaRed.tsx v2.18 — Tres arreglos del flow landscape mobile:
// (1) Bug "fondo de estrellas en horizontal" — al rotar el celular el
//     ResizeObserver no siempre disparaba en iOS Safari (la address
//     bar colapsa al rotar y eso cambia el viewport sin tocar el
//     clientWidth del root inmediatamente). Solución: listener directo
//     a window.orientationchange + screen.orientation.change con dos
//     llamadas escalonadas (raf inmediato + setTimeout 240ms post-
//     rotación) para que iOS termine de acomodar las barras del
//     sistema antes de que recalculemos box.
// (2) Bug "botón Rotar pantalla no hace nada" en iOS Safari —
//     screen.orientation.lock no existe ahí, así que el botón llamaba
//     a una función que retornaba en la primera línea sin señal
//     visual. Ahora detectamos `supportsLock` y mostramos copy
//     adaptado: "Rotar pantalla" donde el lock automático funciona
//     (Android Chrome) y "Entendido" + tip explícito sobre el bloqueo
//     de orientación del Centro de Control en iOS Safari.
// (3) Botón TUTORIAL del HUD y de la consola se ocultan cuando el
//     Tripulante completó el tutorial gestual (localStorage flag
//     `ndr_mobile_tutorial_v1`). Como el flag vive por dispositivo,
//     entrar en otro celular vuelve a mostrar el botón naturalmente.
//     Consola portrait también extiende el grid hasta el bottom
//     respetando safe-area-inset.
// NaveganteDeLaRed.tsx v2.16 — Plan A+B landscape gameplay para el
// [LENTE]. Cuando el Tripulante pica una membrana en mobile,
// intentamos meterlo en immersive landscape: requestFullscreen() +
// screen.orientation.lock("landscape"). Funciona transparente en
// Android Chrome; en Safari iOS el lock no existe y caemos al overlay
// de sugerencia. RotateHintOverlay aparece sobre el canvas si seguimos
// en portrait con membrana activa: ícono de celular girando + copy
// "Rota tu celular para vista AAA". No bloquea — el Tripulante puede
// dismissar y seguir jugando portrait. Hook useScreenOrientation()
// observa cambios y rerenderiza al rotar manualmente. Al salir del
// nivel intentamos exitFullscreen + orientation.unlock para devolver
// el navegador a su estado natural.
// v2.15 — purgeLocalProgress incluye MOBILE_TUTORIAL_KEY (próxima
// entrada después de "Borrar progreso" arranca desde cero, incluido
// tutorial). Botón ← de la consola SIEMPRE sale a Holoteca (onExit),
// sin condicional canClose; antes confundía al volver al juego.
// v2.14 — Tag de dueño del progreso local (STORAGE_OWNER_KEY).
// Mount cold-start verifica que el dueño coincida con la sesión actual;
// si no, purga. Cierra el caso "cerré sesión, abrí el simulador y vi
// progreso ajeno". Copy del modal sin promesa de persistencia tras
// cerrar cookies; "Seguir sin guardar" purga el progreso. CTA secundaria
// "Ya tengo cuenta / Iniciar sesión" en dos líneas.
// v2.13 — GuardaTuTrayectoriaModal con CTAs duales (crear cuenta /
// iniciar sesión) que abren Auth2Modal vía CustomEvent
// rsv-open-auth-modal con view en detail. Hook reactivo de identidad
// detecta cambios en Clerk.user.id; logout y switch limpian
// STORAGE_KEY + disparan ndr-progress-hydrated. Login anónimo migra
// progreso local al perfil nuevo via save_navegante_level.
// v2.12 — Modal "Guarda tu trayectoria" tras primera Membrana sin
// sesión. Footer del LevelConsole movido al header (RESET solo
// admin). saveRunResults dispatchea ndr-level-completed para que el
// padre decida si abrir el modal de auth.
// v2.11 — Persistencia del progreso en Supabase: get/save/clear
// _navegante_progress RPCs. Mount hidrata desde nube + merge local.
// v2.10 — Gate Sintonía chequea por displayIndex (orden custom). Tutorial
// y Membrana 1 libres; Membrana 2+ requiere membresía. Kind "navegantes"
// en FreemiumGateModal con copy específico.
// v2.6-2.9 — Layout AAA mobile: chips de frecuencia en HUD top, joystick
// 118px / fuego 96px / super 56px sobre fuego. Canvas en "contain". HUD
// muestra 3 pills (Código · F3 · F4) sincronizadas via polling 60ms.
// Botón ≡ abre consola de selección, ↻ reinicia membrana actual.
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import Shared from "./SE_Shared.tsx"
import FreemiumGateModal from "./EV_Freemium.tsx"
import { useAdminAuth } from "./MI_Shared.tsx"
const { useMembershipStatus } = Shared

/* =========================================================
   Tipos / Props públicas
========================================================= */

type Freq = 1 | 2 | 3 | 4
type OscType = "sine" | "square" | "sawtooth" | "triangle"

export type GameProps = {
    onExit?: () => void
    sfxEnabled?: boolean
    gameMenuOpen?: boolean
    onMenuStateChange?: (open: boolean) => void
    freePlayAll?: boolean
    levelOrder?: string
    levelOrderProp?: string
    uiSfxHover?: string
    uiSfxSelect?: string
    consoleTitleImage?: string
    consoleTitleImageHeight?: number
    consoleTitleTopOffset?: number
    /* v2.0 — fuerza la rama móvil con controles táctiles. Si no se pasa,
       se autodetecta vía viewport ≤ 768 + UA iPhone/Android Mobile. */
    forceMobile?: boolean
    /* v2.9 — Credenciales Supabase para detectar Sintonía Solar activa.
       Si no llegan, todos los niveles quedan abiertos (fallback graceful). */
    supabaseUrl?: string
    supabaseAnonKey?: string
}

/* =========================================================
   v2.0 — Detección [LENTE] (mobile viewport)
========================================================= */
function useIsMobileViewport(forced?: boolean): boolean {
    const [isMobile, setIsMobile] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false
        const ua =
            (typeof navigator !== "undefined" && navigator.userAgent) || ""
        const uaMatch = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
        const small =
            (window.innerWidth || 1024) <= 768 ||
            (window.innerHeight || 1024) <= 600
        return !!forced || uaMatch || small
    })
    React.useEffect(() => {
        const recompute = () => {
            if (forced !== undefined) {
                setIsMobile(!!forced)
                return
            }
            const ua =
                (typeof navigator !== "undefined" && navigator.userAgent) || ""
            const uaMatch = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
            const small =
                (window.innerWidth || 1024) <= 768 ||
                (window.innerHeight || 1024) <= 600
            setIsMobile(uaMatch || small)
        }
        recompute()
        window.addEventListener("resize", recompute)
        window.addEventListener("orientationchange", recompute)
        return () => {
            window.removeEventListener("resize", recompute)
            window.removeEventListener("orientationchange", recompute)
        }
    }, [forced])
    return isMobile
}

/* v2.16 — Hook de orientación de la pantalla. Devuelve "portrait" o
   "landscape" y actualiza on-the-fly cuando el Tripulante rota el
   celular. Combina ScreenOrientation API (donde existe) con un
   matchMedia de fallback. */
function useScreenOrientation(): "portrait" | "landscape" {
    const compute = (): "portrait" | "landscape" => {
        if (typeof window === "undefined") return "portrait"
        try {
            const t = (window.screen as any)?.orientation?.type as
                | string
                | undefined
            if (typeof t === "string") {
                if (t.startsWith("landscape")) return "landscape"
                if (t.startsWith("portrait")) return "portrait"
            }
        } catch {}
        try {
            if (window.matchMedia("(orientation: landscape)").matches)
                return "landscape"
        } catch {}
        const w = window.innerWidth || 0
        const h = window.innerHeight || 0
        return w > h ? "landscape" : "portrait"
    }
    const [orient, setOrient] = React.useState<"portrait" | "landscape">(() =>
        compute()
    )
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const update = () => setOrient(compute())
        window.addEventListener("resize", update)
        window.addEventListener("orientationchange", update)
        let mq: MediaQueryList | null = null
        try {
            mq = window.matchMedia("(orientation: landscape)")
            mq.addEventListener("change", update)
        } catch {}
        try {
            ;(window.screen as any)?.orientation?.addEventListener?.(
                "change",
                update
            )
        } catch {}
        return () => {
            window.removeEventListener("resize", update)
            window.removeEventListener("orientationchange", update)
            try {
                mq?.removeEventListener?.("change", update)
            } catch {}
            try {
                ;(window.screen as any)?.orientation?.removeEventListener?.(
                    "change",
                    update
                )
            } catch {}
        }
    }, [])
    return orient
}

/* v2.16/v2.17/v2.18 — Best-effort: pedir fullscreen al elemento root
   y luego lock orientation a landscape. Cualquier rama puede fallar
   sin romper nada. El gesture del tap del Tripulante es lo que hace
   que funcione en Android.
   v2.17 — Si la API de orientation.lock NO existe (Safari iOS), NO
   pedimos fullscreen tampoco. El fullscreen sin rotación deja el
   canvas en un estado roto (viewport cambiado, juego sin redibujar).
   En iOS solo mostramos el overlay sugiriendo rotar manualmente.
   v2.18 — Devolvemos un boolean para que el overlay sepa si pudo
   ejecutar el lock o si el browser lo rechazó. Si devuelve false,
   el RotateHintOverlay muestra una pista explícita sobre el bloqueo
   de orientación del Centro de Control de iOS. */
function supportsOrientationLock(): boolean {
    if (typeof window === "undefined") return false
    const orient: any = (window.screen as any)?.orientation
    return typeof orient?.lock === "function"
}

async function enterImmersiveLandscape(): Promise<boolean> {
    if (typeof document === "undefined") return false
    const orient: any = (window.screen as any)?.orientation
    const supportsLock = typeof orient?.lock === "function"
    if (!supportsLock) return false
    const el: any =
        (document.fullscreenElement && document.documentElement) ||
        document.documentElement
    try {
        const reqFs =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullscreen
        if (reqFs && !document.fullscreenElement) {
            await reqFs.call(el)
        }
    } catch {}
    try {
        await orient.lock("landscape")
        return true
    } catch {
        return false
    }
}

/* v2.16 — Liberar fullscreen + orientation lock al salir del nivel.
   Mismo principio: cualquier rama puede fallar. */
async function exitImmersiveLandscape() {
    try {
        const orient: any = (window.screen as any)?.orientation
        orient?.unlock?.()
    } catch {}
    try {
        const exit: any =
            (document as any).exitFullscreen ||
            (document as any).webkitExitFullscreen ||
            (document as any).mozCancelFullScreen ||
            (document as any).msExitFullscreen
        if (exit && document.fullscreenElement) {
            await exit.call(document)
        }
    } catch {}
}

/* v2.0 — API imperativa expuesta por el bucle del juego al overlay táctil. */
type GameApi = {
    setAimAngle: (angle: number) => void
    setMouse: (x: number, y: number) => void
    fire: () => void
    setFreq: (f: Freq) => void
    armSuper: () => void
    cancelSuper: () => void
    reload: () => void
}

/* v2.0 — Snapshot reactivo del estado para alimentar el HUD móvil.
   v2.7 — Sumamos las secuencias de DESBLOQUEO de F3 y F4 + sus cursores
   + flags de visibilidad (showCode/showF3/showF4) para que el HUD
   móvil pueda mostrar el código vigente igual que el desktop. */
type GameSnapshot = {
    energy: number
    streakCount: number
    streakColor: Freq | null
    superReady: boolean
    superArmed: boolean
    selected: Freq
    available: Record<Freq, boolean>
    harmonic: boolean
    codeSeq: Freq[]
    codeCursor: number
    codeFull: boolean
    duoSeq: Freq[]
    duoCursor: number
    tripleSeq: Freq[]
    tripleCursor: number
    showCode: boolean
    showF3: boolean
    showF4: boolean
    levelTitle: string
    nodesLeft: number
    nodesTotal: number
    finished: boolean
    isTutorial: boolean
    tutorialStep: number
}

/* =========================================================
   Constantes de lienzo y juego
========================================================= */

const LOGICAL_W = 1024
const LOGICAL_H = 576
const CANVAS_PAD = 64
const NODE_PADDING = 56
const MAX_PULSES = 10
const AUTO_MENU_MS = 3000

const HUD_LEFT_X = 112
const HUD_TOP_Y = 26

const STREAK_NEEDED = 3
const BASE_PULSE_GROW = 270
const SUPER_PULSE_GROW = 560
const ENERGY_DEPLETED_MULT = 0.35
const ENERGY_GAIN = 0.25
const ENERGY_COST = 0.25
const SUPER_COST = 0.75
const FAIL_CONE_FACTOR = 0.9
const MIN_CONE_SCALE = 0.55
const SUPER_CONE_FACTOR = 0.4
const PORTAL_SEED = 0xa11ce
const PORTAL_BAND = 40
const PORTAL_FADE_SECS = 1.0
const PORTAL_LIFETIME_MS = 10_000
const STORAGE_KEY = "ndr_progress_v21"
/* v2.14 — Tag de dueño del progreso local. Almacena el clerk_user_id
   del Tripulante al que pertenece STORAGE_KEY, o "anon" si proviene
   de un freebie que no tiene cuenta. Sirve para detectar mismatch
   al montar el simulador después de un logout — si el dueño
   guardado ya no coincide con la sesión actual, purgamos. */
const STORAGE_OWNER_KEY = "ndr_progress_owner_v1"
const STORAGE_OWNER_ANON = "anon"

const FS_TOP_MARGIN = 16
const FS_SIDE_MARGIN = 16

/* =========================================================
   Colores / Tonos por frecuencia
========================================================= */

const FREQS = {
    1: { color: "#4FD0FF", tone: 220 },
    2: { color: "#FFD700", tone: 330 },
    3: { color: "#00FF88", tone: 440 },
    4: { color: "#FF6BFF", tone: 523 },
} as const

/* =========================================================
   Dificultad por membrana (cone/slack)
========================================================= */

const DIFF: Record<number, { cone: number; slack: number }> = {
    0: { cone: Math.PI / 5.2, slack: 22 },
    1: { cone: Math.PI / 6.0, slack: 15 },
    2: { cone: Math.PI / 6.2, slack: 14 },
    3: { cone: Math.PI / 6.8, slack: 12 },
    4: { cone: Math.PI / 7.6, slack: 11 },
    5: { cone: Math.PI / 8.8, slack: 10 },
    6: { cone: Math.PI / 5.5, slack: 18 },
    7: { cone: Math.PI / 6.5, slack: 16 },
    8: { cone: Math.PI / 7.5, slack: 14 },
    9: { cone: Math.PI / 9.0, slack: 12 },
    10: { cone: Math.PI / 11.5, slack: 10 },
    11: { cone: Math.PI / 11.8, slack: 9 },
    12: { cone: Math.PI / 12.2, slack: 9 },
    13: { cone: Math.PI / 12.8, slack: 9 },
    14: { cone: Math.PI / 13.4, slack: 9 },
    15: { cone: Math.PI / 14.0, slack: 8 },
    16: { cone: Math.PI / 14.8, slack: 8 },
    17: { cone: Math.PI / 15.6, slack: 8 },
    18: { cone: Math.PI / 16.4, slack: 8 },
    19: { cone: Math.PI / 17.2, slack: 8 },
    20: { cone: Math.PI / 18.0, slack: 8 },
}

/* =========================================================
   Secuencias de Código + Llaves F3/F4
========================================================= */

const CODE_BY_LEVEL: Record<number, Freq[]> = {
    0: [2, 3, 1],
    1: [1, 3, 4],
    2: [2, 4, 1],
    3: [1, 2, 3],
    4: [4, 2, 3],
    5: [2, 1, 4],
    6: [2, 1, 3],
    7: [1, 3, 2],
    8: [4, 1, 3],
    9: [1, 4, 2],
    10: [3, 2, 1],
    11: [2, 3, 1],
    12: [3, 1, 2],
    13: [4, 1, 3],
    14: [3, 4, 2],
    15: [1, 4, 2],
    16: [2, 1, 4],
    17: [4, 3, 1],
    18: [1, 2, 4],
    19: [3, 2, 4],
    20: [4, 2, 1],
}

const DUO_PATTERN_BY_LEVEL: Record<number, [Freq, Freq]> = {
    0: [2, 1],
    1: [2, 1],
    2: [1, 2],
    3: [2, 1],
    4: [1, 2],
    5: [2, 1],
    6: [1, 2],
    7: [2, 1],
    8: [1, 2],
    9: [2, 1],
    10: [1, 2],
    11: [2, 1],
    12: [1, 2],
    13: [2, 1],
    14: [1, 2],
    15: [2, 1],
    16: [1, 2],
    17: [2, 1],
    18: [1, 2],
    19: [2, 1],
    20: [1, 2],
}

const TRIPLE_PATTERN_BY_LEVEL: Record<number, [Freq, Freq, Freq]> = {
    0: [1, 2, 3],
    1: [1, 2, 3],
    2: [2, 1, 3],
    3: [1, 3, 2],
    4: [3, 1, 2],
    5: [2, 3, 1],
    6: [1, 2, 3],
    7: [2, 3, 1],
    8: [3, 2, 1],
    9: [1, 3, 2],
    10: [2, 1, 3],
    11: [1, 3, 2],
    12: [3, 1, 2],
    13: [2, 3, 1],
    14: [3, 2, 1],
    15: [1, 2, 3],
    16: [2, 1, 3],
    17: [1, 3, 2],
    18: [3, 1, 2],
    19: [2, 1, 3],
    20: [3, 2, 1],
}

/* =========================================================
   Utils
========================================================= */

const EPS = 1e-6
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function mulberry32(seed: number) {
    let t = seed >>> 0
    return () => {
        t += 0x6d2b79f5
        let x = Math.imul(t ^ (t >>> 15), 1 | t)
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296
    }
}

function hexToRGBA(hex: string, a: number) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!m) return `rgba(255,255,255,${a})`
    const r = parseInt(m[1], 16),
        g = parseInt(m[2], 16),
        b = parseInt(m[3], 16)
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!m) return { r: 255, g: 255, b: 255 }
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
    }
}

function segHitsCircle(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    r: number
) {
    const abx = bx - ax,
        aby = by - ay,
        ab2 = abx * abx + aby * aby || 1
    const t = clamp(((cx - ax) * abx + (cy - ay) * aby) / ab2, 0, 1)
    const px = ax + abx * t,
        py = ay + aby * t
    return Math.hypot(px - cx, py - cy) <= r
}

/* =========================================================
   Layouts (20 membranas) + Tutorial
========================================================= */

type SolarNodeBase = {
    x: number
    y: number
    freq: Freq
    locked?: boolean
    tRole?: "superTarget" | "codeY" | "codeG" | "codeB" | "final"
    _tutoDuo?: boolean
    _tutoTri?: boolean
    _tutoFinal?: boolean
}

function buildLevel1() {
    const cx = LOGICAL_W / 2,
        cy = LOGICAL_H / 2
    const rxO = Math.min(LOGICAL_W / 2 - NODE_PADDING, 340),
        ryO = Math.min(LOGICAL_H / 2 - NODE_PADDING, 200)
    const rxI = rxO * 0.55,
        ryI = ryO * 0.55
    const out = 12,
        inn = 6
    const L: SolarNodeBase[] = []
    for (let i = 0; i < out; i++) {
        const a = (i / out) * Math.PI * 2
        L.push({
            x: cx + rxO * Math.cos(a),
            y: cy + ryO * Math.sin(a),
            freq: ((i % 4) + 1) as Freq,
        })
    }
    for (let i = 0; i < inn; i++) {
        const a = (i / inn) * Math.PI * 2 + Math.PI / 6
        L.push({
            x: cx + rxI * Math.cos(a),
            y: cy + ryI * Math.sin(a),
            freq: (((i + 1) % 4) + 1) as Freq,
        })
    }
    return L
}

const buildLevel2 = () => blueNoiseLayout(20, 0xc0ffee, 92)

function buildLevel3() {
    const cx = LOGICAL_W / 2,
        cy = LOGICAL_H / 2,
        n = 18,
        golden = Math.PI * (3 - Math.sqrt(5))
    const rx = LOGICAL_W / 2 - NODE_PADDING,
        ry = LOGICAL_H / 2 - NODE_PADDING
    const L: SolarNodeBase[] = []
    for (let i = 0; i < n; i++) {
        const r = 0.22 + 0.72 * (i / (n - 1)),
            a = i * golden
        L.push({
            x: cx + Math.cos(a) * r * rx,
            y: cy + Math.sin(a) * r * ry,
            freq: ((i % 4) + 1) as Freq,
        })
    }
    return L
}

const buildLevel4 = () => blueNoiseLayout(18, 0xbeefab, 100)

function buildLevel5() {
    const cx = LOGICAL_W / 2,
        cy = LOGICAL_H / 2
    const rxO = Math.min(LOGICAL_W / 2 - NODE_PADDING, 400),
        ryO = Math.min(LOGICAL_H / 2 - NODE_PADDING, 230)
    const rxM = rxO * 0.76,
        ryM = ryO * 0.78
    const rxI = rxO * 0.48,
        ryI = ryO * 0.52
    const pat: Freq[] = [1, 3, 2, 4]
    const L: SolarNodeBase[] = []
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + Math.PI / 12
        L.push({
            x: cx + rxO * Math.cos(a),
            y: cy + ryO * Math.sin(a),
            freq: pat[i % 4],
        })
    }
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 5
        L.push({
            x: cx + rxM * Math.cos(a),
            y: cy + ryM * Math.sin(a),
            freq: pat[(i + 1) % 4],
        })
    }
    for (let i = 0; i < 2; i++) {
        const a = (i / 2) * Math.PI + Math.PI / 8
        L.push({
            x: cx + rxI * Math.cos(a),
            y: cy + ryI * Math.sin(a),
            freq: pat[(i + 2) % 4],
        })
    }
    L.push({ x: NODE_PADDING + 96, y: cy - ryI * 0.9, freq: 2 })
    L.push({ x: LOGICAL_W - NODE_PADDING - 96, y: cy + ryI * 0.7, freq: 3 })
    return L
}

const buildLevel6 = () => blueNoiseLayout(18, 0x600006, 100, 4)
const buildLevel7 = () => blueNoiseLayout(18, 0x700007, 96, 4)
const buildLevel8 = () => blueNoiseLayout(20, 0x800008, 92, 4)
const buildLevel9 = () => blueNoiseLayout(20, 0x900009, 88, 4)
const buildLevel10 = () => blueNoiseLayout(22, 0xa0000a, 86, 4)
const buildLevel11 = () => blueNoiseLayout(20, 0xb0000b, 84, 4)
const buildLevel12 = () => blueNoiseLayout(22, 0xbad00d, 82, 4)
const buildLevel13 = () => blueNoiseLayout(20, 0xcafee1, 80, 4)
const buildLevel14 = () => blueNoiseLayout(19, 0xdec0de, 82, 4)
const buildLevel15 = () => blueNoiseLayout(21, 0xd15ea5, 80, 4)
const buildLevel16 = () => blueNoiseLayout(22, 0xfeed01, 78, 4)
const buildLevel17 = () => blueNoiseLayout(20, 0x1eadb0, 80, 4)
const buildLevel18 = () => blueNoiseLayout(18, 0xa11ce0, 82, 4)
const buildLevel19 = () => blueNoiseLayout(21, 0x0ddba11, 80, 4)
const buildLevel20 = () => blueNoiseLayout(22, 0xf1a7f1, 78, 4)

function blueNoiseLayout(
    count: number,
    seed: number,
    minD = 86,
    maxFreq: 3 | 4 = 4
) {
    const rand = mulberry32(seed)
    let fails = 0
    const pad = NODE_PADDING
    const L: SolarNodeBase[] = []
    while (L.length < count && fails < 12000) {
        const x = pad + rand() * (LOGICAL_W - 2 * pad),
            y = pad + rand() * (LOGICAL_H - 2 * pad)
        let ok = true
        for (const p of L) {
            if (Math.hypot(p.x - x, p.y - y) < minD) {
                ok = false
                break
            }
        }
        if (ok) L.push({ x, y, freq: ((L.length % maxFreq) + 1) as Freq })
        else {
            fails++
            if (fails % 2000 === 0) minD *= 0.95
        }
    }
    return L
}

function buildTutorial(): SolarNodeBase[] {
    const cluster = [
        { x: 220, y: 280, freq: 1 as Freq },
        { x: 260, y: 260, freq: 1 as Freq },
        { x: 260, y: 300, freq: 1 as Freq },
    ]
    const superTarget = {
        x: 740,
        y: 140,
        freq: 1 as Freq,
        tRole: "superTarget" as const,
    }
    return [...cluster, superTarget]
}

const LEVELS_BASE = [
    { id: 0, title: "Tutorial", builder: buildTutorial },
    { id: 1, title: "Membrana 1", builder: buildLevel1 },
    { id: 2, title: "Membrana 2", builder: buildLevel3 },
    { id: 3, title: "Membrana 3", builder: buildLevel5 },
    { id: 4, title: "Membrana 4", builder: buildLevel4 },
    { id: 5, title: "Membrana 5", builder: buildLevel2 },
    { id: 6, title: "Membrana 6", builder: buildLevel6 },
    { id: 7, title: "Membrana 7", builder: buildLevel7 },
    { id: 8, title: "Membrana 8", builder: buildLevel8 },
    { id: 9, title: "Membrana 9", builder: buildLevel9 },
    { id: 10, title: "Membrana 10", builder: buildLevel10 },
    { id: 11, title: "Membrana 11", builder: buildLevel11 },
    { id: 12, title: "Membrana 12", builder: buildLevel12 },
    { id: 13, title: "Membrana 13", builder: buildLevel13 },
    { id: 14, title: "Membrana 14", builder: buildLevel14 },
    { id: 15, title: "Membrana 15", builder: buildLevel15 },
    { id: 16, title: "Membrana 16", builder: buildLevel16 },
    { id: 17, title: "Membrana 17", builder: buildLevel17 },
    { id: 18, title: "Membrana 18", builder: buildLevel18 },
    { id: 19, title: "Membrana 19", builder: buildLevel19 },
    { id: 20, title: "Membrana 20", builder: buildLevel20 },
] as const

/* =========================================================
   Tipos runtime
========================================================= */

interface SolarNode extends SolarNodeBase {
    id: number
    sx: number
    sy: number
    px: number
    py: number
    amp: number
    spd: number
    locked?: boolean
}

interface Pulse {
    x: number
    y: number
    radius: number
    prevR: number
    life: number
    color: string
    freq: Freq
    angle: number
    super?: boolean
    hit?: boolean
}

interface AbsorbFX {
    x: number
    y: number
    life: number
}
interface Spark {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
    color: string
}
interface TrailPoint {
    x: number
    y: number
    color: string
}
interface Portal {
    x: number
    y: number
    r: number
    pair: number
}

/* ===== NEW: Trail Particle type ===== */
interface TrailParticle {
    x: number
    y: number
    color: string
    life: number
    vx: number
    vy: number
    size: number
    alpha: number
}

/* ===== NEW: Super Spark type ===== */
interface SuperSpark {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
}

/* v2.29 — Acción al gateway user-action ESPERANDO el token recién minteado.
   En "login fresco" Clerk.user.id resuelve ANTES de que el token de sesión
   esté minteado; el fetch viejo llamaba getToken() una sola vez → recibía
   null → mandaba token:null → el gateway respondía missing_token (400) → el
   .catch lo tragaba → el progreso del invitado NUNCA migraba a la cuenta
   (quedaba SOLO local). Igual que el userAction canónico del radar. */
async function gatewayUserAction(
    url: string,
    key: string,
    action: string,
    params: Record<string, any>
): Promise<any> {
    if (!url || !key) return null
    try {
        const clerk = (window as any).Clerk
        let token = await clerk?.session?.getToken?.()
        if (!token && clerk?.user) {
            for (let i = 0; i < 3 && !token; i++) {
                await new Promise((res) => setTimeout(res, 250))
                token = await clerk?.session?.getToken?.()
            }
        }
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/user-action`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token, action, params }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

/* v2.29 — Lectura síncrona del progreso para SEMBRAR el estado del nivel en
   el primer render (anti-flash: sin esto el grid aparece "sin completar" y
   de golpe se completa cuando el effect lee localStorage tras el paint). */
type ProgressMap = Record<
    number,
    { completed?: boolean; preview?: string; chord?: boolean; timeMs?: number }
>
function readProgressFromStorage(): ProgressMap {
    if (typeof window === "undefined") return {}
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    } catch {
        return {}
    }
}

/* =========================================================
   Componente principal
========================================================= */

export default function NaveganteDeLaRed({
    onExit,
    sfxEnabled = true,
    gameMenuOpen = false,
    onMenuStateChange,
    freePlayAll = false,
    levelOrder,
    levelOrderProp,
    uiSfxHover,
    uiSfxSelect,
    consoleTitleImage,
    consoleTitleImageHeight,
    consoleTitleTopOffset,
    forceMobile,
    supabaseUrl,
    supabaseAnonKey,
}: GameProps) {
    /* v2.9 — Detección Sintonía Solar + estado del gate modal.
       Tutorial (id 0) y Membrana 1 (id 1) son libres siempre; cualquier
       otro nivel sin membresía dispara el FreemiumGateModal. */
    const hasMembresia = useMembershipStatus(supabaseUrl, supabaseAnonKey)
    const [gateOpen, setGateOpen] = React.useState(false)

    /* v2.12 — Detección admin para mostrar el botón RESET solo a admins. */
    const { isAdmin } = useAdminAuth(supabaseUrl || "", supabaseAnonKey || "")

    /* v2.12 — Modal "Guarda tu trayectoria" — invitación a crear cuenta
       cuando un freebie cumple la primera Membrana sin estar logueado.
       Suave, no bloqueante: puede seguir explorando sin guardar. */
    const [authPromptOpen, setAuthPromptOpen] = React.useState(false)
    React.useEffect(() => {
        const onLevelCompleted = (e: Event) => {
            const detail = (e as CustomEvent).detail as
                | { id: number; displayIndex: number }
                | undefined
            if (!detail) return
            const hasUser = !!(window as any).Clerk?.user
            /* v2.14 — Si el freebie acaba de completar un nivel sin
               sesión, tageamos el progreso como "anon" para que el
               mount cold-start del simulador lo reconozca como
               legítimo (sin sesión + dueño anon = válido) y no lo
               purgue. Aplica a CUALQUIER nivel completado, no solo
               la Membrana 1. */
            if (!hasUser) {
                try {
                    localStorage.setItem(STORAGE_OWNER_KEY, STORAGE_OWNER_ANON)
                } catch {}
            }
            // Solo Membrana 1 (displayIndex 1). Tutorial no dispara modal.
            if (detail.displayIndex !== 1) return
            if (hasUser) return
            setAuthPromptOpen(true)
        }
        window.addEventListener("ndr-level-completed", onLevelCompleted)
        return () =>
            window.removeEventListener("ndr-level-completed", onLevelCompleted)
    }, [])

    /* v2.11 — Refs de Supabase + clerkId accesibles desde dentro del
       game loop (que vive en useEffect aislado). saveRunResults usa
       estas refs para hacer upsert remoto fire-and-forget. También se
       exponen como window globals __ndrSbUrl/__ndrSbKey para que el
       reset de avances (que vive en otro componente hermano) pueda
       llamar al RPC clear_navegante_progress sin pasar props extra. */
    const sbRef = React.useRef({
        url: supabaseUrl || "",
        key: supabaseAnonKey || "",
    })
    React.useEffect(() => {
        sbRef.current = {
            url: supabaseUrl || "",
            key: supabaseAnonKey || "",
        }
        ;(window as any).__ndrSbUrl = supabaseUrl || ""
        ;(window as any).__ndrSbKey = supabaseAnonKey || ""
    }, [supabaseUrl, supabaseAnonKey])

    /* v2.13 — Tracking reactivo del Clerk user id. Polling 1.5s + escucha
       a rsv-auth-changed (dispatch que emite Auth2Modal/Auth2Header tras
       cambio de sesión). Necesitamos el id como state, no como lectura
       puntual de window.Clerk, porque la hidratación remota y el reset
       on-logout reaccionan a transiciones (login, logout, switch). */
    const [clerkUserId, setClerkUserId] = React.useState<string | null>(() => {
        if (typeof window === "undefined") return null
        try {
            return (window as any).Clerk?.user?.id || null
        } catch {
            return null
        }
    })
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => {
            try {
                const next = (window as any).Clerk?.user?.id || null
                setClerkUserId((prev) => (prev === next ? prev : next))
            } catch {}
        }
        tick()
        window.addEventListener("rsv-auth-changed", tick)
        const intId = window.setInterval(tick, 1500)
        return () => {
            window.removeEventListener("rsv-auth-changed", tick)
            window.clearInterval(intId)
        }
    }, [])

    /* v2.14 — Helpers de ownership del progreso local. */
    const readOwner = React.useCallback((): string | null => {
        try {
            return localStorage.getItem(STORAGE_OWNER_KEY)
        } catch {
            return null
        }
    }, [])
    const writeOwner = React.useCallback((id: string | null) => {
        try {
            if (id) localStorage.setItem(STORAGE_OWNER_KEY, id)
            else localStorage.removeItem(STORAGE_OWNER_KEY)
        } catch {}
    }, [])
    const purgeLocalProgress = React.useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
        try {
            localStorage.removeItem(STORAGE_OWNER_KEY)
        } catch {}
        /* v2.15 — Borrar también el flag de tutorial visto. Sin esto,
           el Tripulante que elegía "Borrar progreso" volvía a entrar
           y caía directo en la consola sin ver el tutorial — sentía
           que el simulador no se "reseteó del todo". Ahora un purge
           equivale a estado de primera visita. */
        try {
            localStorage.removeItem(MOBILE_TUTORIAL_KEY)
        } catch {}
        try {
            window.dispatchEvent(new Event("ndr-progress-hydrated"))
        } catch {}
    }, [])

    /* v2.14 — Mount cold-start ownership check. Si el simulador se
       monta y el dueño guardado en localStorage NO coincide con la
       identidad actual, purgamos. Cubre el caso "el Tripulante cerró
       sesión en otra capa, navegó al simulador y vio progreso ajeno"
       — el efecto de transición de identidad no dispara porque el
       cambio ocurrió antes de que el componente se montara. */
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const owner = readOwner()
        const currentId = (window as any).Clerk?.user?.id || null
        /* Tres casos válidos para conservar el progreso:
           (1) Sin dueño guardado y sin sesión → freebie en curso.
           (2) Dueño = "anon" y sin sesión → freebie en curso (tag explícito).
           (3) Dueño = currentId → progreso del Tripulante actual.
           Cualquier otro caso es ownership stale → purgar. */
        const ownerMissing = !owner
        const ownerIsAnon = owner === STORAGE_OWNER_ANON
        const ownerIsCurrent = !!owner && owner === currentId
        const valid =
            (ownerMissing && !currentId) ||
            (ownerIsAnon && !currentId) ||
            ownerIsCurrent
        if (valid) return
        purgeLocalProgress()
    }, [readOwner, purgeLocalProgress])

    /* v2.13/v2.14 — Tracking de transición de identidad EN VIVO.
       Cubre los cambios que ocurren mientras el simulador está
       montado. Tres casos:
       (a) anónimo → logueado (null → X): migrar progreso local al
           perfil nuevo y tagear como dueño. La hidratación remota
           (effect aparte) suma la nube si ya tenía progreso.
       (b) logueado → anónimo (X → null): logout. Purgar local.
       (c) switch de cuenta (A → B): purgar local; el effect de
           hidratación trae el progreso de B desde la nube. */
    const prevClerkIdRef = React.useRef<string | null>(clerkUserId)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const prev = prevClerkIdRef.current
        if (prev === clerkUserId) return
        prevClerkIdRef.current = clerkUserId

        const isAnonymousToSignedIn = !prev && !!clerkUserId
        if (isAnonymousToSignedIn && supabaseUrl && supabaseAnonKey) {
            /* (a) Migrar progreso local al perfil del Tripulante.
               Solo si el dueño actual del local no es ya otra cuenta
               (defensa adicional contra estado inconsistente). */
            const owner = readOwner()
            const localBelongsToFreebie = !owner || owner === STORAGE_OWNER_ANON
            if (localBelongsToFreebie) {
                try {
                    const local = JSON.parse(
                        localStorage.getItem(STORAGE_KEY) || "{}"
                    )
                    if (local && typeof local === "object") {
                        const completedIds = Object.keys(local)
                            .map((k) => Number(k))
                            .filter((id) => {
                                if (!Number.isFinite(id)) return false
                                const e = (local as any)[String(id)] || {}
                                return (
                                    e?.completed === true ||
                                    typeof e?.timeMs === "number"
                                )
                            })
                        if (completedIds.length) {
                            /* v2.29 — Subir vía gatewayUserAction (espera el token
                               recién minteado: en login fresco Clerk.user.id
                               resuelve ANTES que el token → el fetch viejo mandaba
                               null y el gateway lo rechazaba con missing_token →
                               el progreso NUNCA migraba). */
                            void (async () => {
                                for (const lvlId of completedIds) {
                                    const entry =
                                        (local as any)[String(lvlId)] || {}
                                    await gatewayUserAction(
                                        supabaseUrl,
                                        supabaseAnonKey,
                                        "save_navegante_level",
                                        {
                                            p_level_id: lvlId,
                                            p_completed: true,
                                            p_preview: entry?.preview || null,
                                            p_chord: !!entry?.chord,
                                        }
                                    )
                                }
                            })()
                        }
                    }
                } catch {}
                writeOwner(clerkUserId)
                return
            }
            /* Local pertenecía a otra cuenta: purgar antes de hidratar
               la nueva. */
            purgeLocalProgress()
            writeOwner(clerkUserId)
            return
        }

        /* (b) y (c): logout o switch de cuenta. Purgar y reanclar
           el dueño (o quitarlo si quedó anónimo). */
        purgeLocalProgress()
        if (clerkUserId) writeOwner(clerkUserId)
    }, [
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
        readOwner,
        writeOwner,
        purgeLocalProgress,
    ])

    /* v2.11/v2.13 — Hidratación: al montar Y cada vez que el Tripulante
       cambia de identidad, trae el progreso remoto y mergea con
       localStorage. La nube es source of truth para conflictos.
       Dispatcha "ndr-progress-hydrated" para que los consoles recarguen. */
    React.useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        if (!clerkUserId) return
        let cancelled = false
        /* v2.29 — Hidratación por gatewayUserAction (espera el token: la 1ª
           hidratación tras login recibía token=null → 401 → no mergeaba la
           nube → el progreso de la cuenta no aparecía). */
        gatewayUserAction(
            supabaseUrl,
            supabaseAnonKey,
            "get_navegante_progress",
            {}
        )
            .then((remote: any) => {
                if (cancelled || !remote || typeof remote !== "object") return
                try {
                    const localRaw = localStorage.getItem(STORAGE_KEY) || "{}"
                    const local = JSON.parse(localRaw)
                    /* La nube gana en conflictos (es source of truth). */
                    const merged = { ...local, ...remote }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
                    /* v2.14 — Re-anclar el dueño después de hidratar.
                       Garantiza que la siguiente mount cold-start
                       reconozca este progreso como del Tripulante
                       actual y no lo purgue por mismatch. */
                    try {
                        localStorage.setItem(STORAGE_OWNER_KEY, clerkUserId)
                    } catch {}
                    window.dispatchEvent(new Event("ndr-progress-hydrated"))
                } catch {}
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [supabaseUrl, supabaseAnonKey, clerkUserId])
    /* v2.0 — Detección móvil + refs imperativos hacia el bucle del juego */
    const isMobile = useIsMobileViewport(forceMobile)
    /* v2.16 — Orientación de pantalla en vivo. Se usa para decidir si
       mostrar el RotateHintOverlay y para que el render layout
       reaccione al rotar el celular. */
    const orientation = useScreenOrientation()
    /* v2.16 — Estado del overlay de sugerencia: true cuando hay
       membrana activa en mobile + portrait Y el Tripulante no
       descartó la sugerencia explícitamente. Se reinicia al cambiar
       de membrana para que cada nuevo nivel reciba la pista. */
    const [rotateHintDismissed, setRotateHintDismissed] = React.useState(false)
    /* v2.16 — Cuando salimos de la membrana (levelIndex null) o
       cuando vuelve a abrirse el menú, devolvemos el browser a su
       estado natural: salir de fullscreen + unlock orientation.
       Cuando rotamos a landscape la pista deja de aplicar; reset el
       dismiss para que la próxima vez en portrait vuelva a aparecer. */
    React.useEffect(() => {
        if (orientation === "landscape" && rotateHintDismissed) {
            setRotateHintDismissed(false)
        }
    }, [orientation, rotateHintDismissed])
    /* v2.5 — Ref del flag para que el bucle del juego (que vive dentro
       de un useEffect con su closure local) pueda decidir qué texto del
       tutorial mostrar (mouse/teclado en desktop vs joystick/fuego en
       [LENTE]) sin necesidad de re-suscribirse al state. */
    const isMobileRef = React.useRef(isMobile)
    React.useEffect(() => {
        isMobileRef.current = isMobile
    }, [isMobile])
    const gameApiRef = React.useRef<GameApi | null>(null)
    const [showMobileTutorial, setShowMobileTutorial] = React.useState(false)
    const initialSnapshot: GameSnapshot = {
        energy: 1,
        streakCount: 0,
        streakColor: null,
        superReady: false,
        superArmed: false,
        selected: 1,
        available: { 1: true, 2: true, 3: false, 4: false },
        harmonic: false,
        codeSeq: [1, 3, 4],
        codeCursor: 0,
        codeFull: false,
        duoSeq: [2, 1],
        duoCursor: 0,
        tripleSeq: [1, 2, 3],
        tripleCursor: 0,
        showCode: true,
        showF3: false,
        showF4: false,
        levelTitle: "Tutorial",
        nodesLeft: 0,
        nodesTotal: 0,
        finished: false,
        isTutorial: true,
        tutorialStep: 1,
    }
    const [snapshot, setSnapshot] =
        React.useState<GameSnapshot>(initialSnapshot)
    const liveSnapshotRef = React.useRef<GameSnapshot>(initialSnapshot)
    /* v2.0 — Polling del snapshot vivo → state React → HUD móvil.
       v2.8 — Pasamos a 60ms y SIEMPRE creamos un objeto nuevo. La
       comparación previa con `every` sobre `codeSeq/duoSeq/tripleSeq`
       (referencias estables al mismo array de CODE_BY_LEVEL) más el
       fan-out de primitives bloqueaba updates legítimos en algunos
       casos (p. ej. la racha capped a STREAK_NEEDED + cambio de
       streakColor en el mismo frame). Con re-render forzado cada
       60ms el HUD nunca se queda atrás del game loop, y el costo es
       trivial: el HUD es DOM puro, no canvas. */
    React.useEffect(() => {
        if (!isMobile) return
        const id = window.setInterval(() => {
            const live = liveSnapshotRef.current
            setSnapshot({
                ...live,
                available: { ...live.available },
            })
        }, 60)
        return () => window.clearInterval(id)
    }, [isMobile])

    const travelSpeedBase = 1.8
    const superTravelMultiplier = 1.9
    const chordSeconds = 10
    const rewardText = "🎁 Código de descuento: SOLAR-10"
    const rewardFontSize = 14
    const progressionLocked = !freePlayAll
    const tutorialPostSuperTitle =
        "Sigue la secuencia del código que aparece arriba."
    /* v2.5 — En [LENTE] cambiamos la línea de tip a referencias táctiles. */
    const tutorialPostSuperBody = isMobile
        ? "Cada activación correcta ordena tu campo,\nabre un portal dimensional\ny sirve para activar el siguiente nivel.\nTip: arrastra el joystick para apuntar y toca el fuego para integrar."
        : "Cada activación correcta ordena tu campo,\nabre un portal dimensional\ny sirve para activar el siguiente nivel.\nTip: A + ↑ ↓ ← → ajusta tu campo de visión a la dirección deseada."
    const menuTitle = "Navegante de la Red"
    const menuDescription = "Selecciona la membrana que deseas sintonizar"
    const sfxVolume = 1.0

    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [box, setBox] = React.useState({
        w: LOGICAL_W,
        h: LOGICAL_H,
        left: 0,
        top: 0,
    })

    React.useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const resize = () => {
            const W = el.clientWidth || 1,
                H = el.clientHeight || 1
            /* v2.6 — Mobile portrait: usamos el ANCHO completo del
               viewport como referencia (`W / LOGICAL_W`) en lugar del
               min con la altura. Garantiza que todos los nodos del
               campo (los 16:9 originales) sean visibles dentro del
               viewport portrait. La banda negra superior alberga el
               HUD y la inferior los controles (joystick · fuego ·
               super), por lo que no se siente desperdiciada. Desktop
               sigue con contain estándar. */
            const portrait = H > W
            const s =
                isMobile && portrait
                    ? (W / LOGICAL_W) * 1.0
                    : Math.min(W / LOGICAL_W, H / LOGICAL_H) || 1
            const w = Math.round(LOGICAL_W * s),
                h = Math.round(LOGICAL_H * s)
            setBox({
                w,
                h,
                left: Math.floor((W - w) / 2),
                top: Math.floor((H - h) / 2),
            })
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(el)
        /* v2.18 — Listener escalonado para orientationchange. iOS
           Safari colapsa la address bar al rotar; el ResizeObserver
           a veces dispara con dimensiones intermedias o no dispara
           del todo si el root mantiene width:100%/height:100% pero
           el viewport cambió. Forzamos tres mediciones: una
           inmediata (rAF), otra a 240ms (post acomodo de barras
           de iOS), y otra a 600ms (defensa para devices más lentos).
           Sin esto, rotar a horizontal dejaba el canvas con sus
           dimensiones portrait → CSS box.h gigante → el canvas
           quedaba fuera del viewport visible y solo se veía el
           radial-gradient del root del Navegante (que el Tripulante
           lee como "fondo de estrellas"). */
        let raf: number | null = null
        let t1: any = null
        let t2: any = null
        const onOrient = () => {
            if (raf) cancelAnimationFrame(raf)
            if (t1) clearTimeout(t1)
            if (t2) clearTimeout(t2)
            raf = requestAnimationFrame(() => {
                resize()
                raf = null
            })
            t1 = setTimeout(resize, 240)
            t2 = setTimeout(resize, 600)
        }
        window.addEventListener("orientationchange", onOrient)
        window.addEventListener("resize", onOrient)
        let scrOrient: any = null
        try {
            scrOrient = (window.screen as any)?.orientation
            scrOrient?.addEventListener?.("change", onOrient)
        } catch {}
        return () => {
            ro.disconnect()
            window.removeEventListener("orientationchange", onOrient)
            window.removeEventListener("resize", onOrient)
            try {
                scrOrient?.removeEventListener?.("change", onOrient)
            } catch {}
            if (raf) cancelAnimationFrame(raf)
            if (t1) clearTimeout(t1)
            if (t2) clearTimeout(t2)
        }
    }, [isMobile])

    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const isFullscreenRef = React.useRef(false)
    React.useEffect(() => {
        isFullscreenRef.current = isFullscreen
    }, [isFullscreen])
    React.useEffect(() => {
        const checkFS = () => {
            const fsEl = (document as any).fullscreenElement
            const nearAvail =
                Math.abs(
                    window.innerWidth - (screen.availWidth || screen.width)
                ) < 2 &&
                Math.abs(
                    window.innerHeight - (screen.availHeight || screen.height)
                ) < 2
            setIsFullscreen(!!fsEl || nearAvail)
        }
        document.addEventListener("fullscreenchange", checkFS)
        window.addEventListener("resize", checkFS)
        checkFS()
        return () => {
            document.removeEventListener("fullscreenchange", checkFS)
            window.removeEventListener("resize", checkFS)
        }
    }, [])

    const ordered = React.useMemo(() => {
        const rawSource =
            typeof levelOrder === "string" && levelOrder.trim().length
                ? levelOrder
                : typeof levelOrderProp === "string" &&
                    levelOrderProp.trim().length
                  ? levelOrderProp
                  : "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20"

        const wanted = rawSource
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= 20)

        const seen = new Set<number>()
        const listIds: number[] = []

        for (const id of wanted) {
            if (!seen.has(id)) {
                seen.add(id)
                listIds.push(id)
            }
        }
        for (let id = 1; id <= 20; id++) if (!seen.has(id)) listIds.push(id)

        const rest = listIds.map((id, idx) => ({
            ...LEVELS_BASE.find((L) => L.id === id)!,
            displayIndex: idx + 1,
            displayTitle: `Membrana ${idx + 1}`,
        }))

        const tutorial = {
            ...LEVELS_BASE[0],
            displayIndex: 0,
            displayTitle: "Tutorial" as const,
        }
        const arr = [tutorial, ...rest]

        const idByDisp = new Map<number, number>()
        const dispById = new Map<number, number>()
        for (const L of arr) {
            idByDisp.set(L.displayIndex, L.id)
            dispById.set(L.id, L.displayIndex)
        }

        return { list: arr, idByDisp, dispById }
    }, [levelOrder, levelOrderProp])

    const sfxOnRef = React.useRef(true)
    const sfxVolRef = React.useRef(sfxVolume)
    React.useEffect(() => {
        sfxOnRef.current = !!sfxEnabled
    }, [sfxEnabled])
    React.useEffect(() => {
        sfxVolRef.current = sfxVolume
    }, [sfxVolume])

    const [uiAvailable, setUiAvailable] = React.useState<Record<Freq, boolean>>(
        {
            1: true,
            2: true,
            3: false,
            4: false,
        }
    )
    const [uiHarmonic, setUiHarmonic] = React.useState(false)

    const [levelIndex, setLevelIndex] = React.useState<number | null>(null)
    const [menuOpen, setMenuOpen] = React.useState(!!gameMenuOpen)
    const [menuNonce, setMenuNonce] = React.useState(0)
    React.useEffect(() => {
        setMenuOpen(!!gameMenuOpen)
    }, [gameMenuOpen])
    /* v2.0 — En [LENTE] abrimos la consola por defecto si no hay nivel
       activo: el Tripulante aterriza en la consola y elige membrana. El
       tutorial táctil aparece solo cuando entra en juego por primera vez. */
    React.useEffect(() => {
        if (isMobile && levelIndex === null) {
            setMenuOpen(true)
        }
    }, [isMobile, levelIndex])
    React.useEffect(() => {
        if (!isMobile) return
        if (levelIndex === null) return
        if (menuOpen) return
        /* v2.23 — El tutorial gestual SOLO se muestra automáticamente
           al entrar al PRIMER nivel (Membrana 1, levelIndex === 0).
           En niveles superiores nunca dispara automático aunque el
           flag esté vacío: el Tripulante ya conoce joystick + fuego +
           frecuencia y volver a ver el mini-tutorial cada nivel rompe
           el ritmo. Si quiere repasar, presiona el botón "Tutorial"
           del HUD (que limpia el flag y reabre el overlay). */
        if (levelIndex !== 0) return
        try {
            const seen = localStorage.getItem(MOBILE_TUTORIAL_KEY) === "1"
            if (!seen) setShowMobileTutorial(true)
        } catch {}
    }, [isMobile, levelIndex, menuOpen])
    /* v2.5 — Cuando el juego está activo en [LENTE] notificamos al shell
       padre (AppNavegacionMobile + SimuladoresShellMobile) para que
       oculten BottomNav y título "HOLOTECA · SIMULADORES". El campo de
       acción queda libre, sin chrome competiendo con el canvas. */
    const naveganteFullscreen =
        isMobile && levelIndex !== null && !menuOpen && !showMobileTutorial
    React.useEffect(() => {
        if (typeof window === "undefined") return
        try {
            window.dispatchEvent(
                new CustomEvent("rsv-navegante-fullscreen", {
                    detail: { active: naveganteFullscreen },
                })
            )
        } catch {}
        /* v2.16 — Cuando dejamos de estar en fullscreen del simulador
           (volvió la consola, salió a Holoteca, abrió el tutorial),
           soltamos el lock de orientación + fullscreen del browser.
           Inocuo si nunca entramos. */
        if (!naveganteFullscreen) {
            exitImmersiveLandscape().catch(() => {})
        }
        return () => {
            try {
                window.dispatchEvent(
                    new CustomEvent("rsv-navegante-fullscreen", {
                        detail: { active: false },
                    })
                )
            } catch {}
            /* v2.16 — Defensa: cuando el componente se desmonta
               liberamos también, por si el Tripulante navega afuera
               con el juego activo. */
            exitImmersiveLandscape().catch(() => {})
        }
    }, [naveganteFullscreen])

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "m" || e.key === "M") {
                e.preventDefault()
                setMenuOpen((prev) => {
                    const next = !prev
                    try {
                        if (sfxEnabled && uiSfxSelect) {
                            const a = new Audio(uiSfxSelect)
                            a.volume = 0.85
                            a.play().catch(() => {})
                        }
                    } catch {}
                    try {
                        onMenuStateChange?.(next)
                    } catch {}
                    return next
                })
            }
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [sfxEnabled, uiSfxSelect, onMenuStateChange])

    React.useEffect(() => {
        const onS = (e: KeyboardEvent) => {
            if (e.key === "s" || e.key === "S") {
                const racha = document.getElementById("hud-rachabar")
                if (racha?.getAttribute("data-state") === "ready") {
                    requestAnimationFrame(() =>
                        racha.setAttribute("data-state", "ready")
                    )
                }
            }
        }
        document.addEventListener("keydown", onS)
        return () => document.removeEventListener("keydown", onS)
    }, [])

    const closeMenuFromSelection = React.useCallback(() => {
        setMenuOpen(false)
        try {
            onMenuStateChange?.(false)
        } catch {}
    }, [onMenuStateChange])

    /* =========================================================
     Bucle de juego / carga de nivel
  ========================================================= */
    React.useEffect(() => {
        if (levelIndex === null) {
            gameApiRef.current = null
            return
        }

        const LVL = ordered.list[levelIndex]
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d", { alpha: false })!

        canvas.width = LOGICAL_W
        canvas.height = LOGICAL_H

        let audioCtx: AudioContext | null = null
        const ensureAC = () => {
            if (!audioCtx) {
                const AC: any =
                    (window as any).AudioContext ||
                    (window as any).webkitAudioContext
                if (!AC) return null
                audioCtx = new AC()
            }
            return audioCtx
        }
        const blip = (f: number, d = 0.22, v = 0.18, t: OscType = "sine") => {
            if (!sfxOnRef.current) return
            const ac = ensureAC()
            if (!ac) return
            const o = ac.createOscillator(),
                g = ac.createGain()
            o.type = t
            o.frequency.value = f
            g.gain.value = v * clamp(sfxVolRef.current, 0, 1)
            o.connect(g)
            g.connect(ac.destination)
            o.start()
            o.stop(ac.currentTime + d)
        }

        const conf = DIFF[LVL.id] || DIFF[1]
        const isTutorial = LVL.id === 0

        const levelMaxFreq: 1 | 2 | 3 | 4 = 4

        let coneScale = 1
        const baseFreqEnabled: Record<Freq, boolean> = isTutorial
            ? { 1: true, 2: false, 3: false, 4: false }
            : { 1: true, 2: true, 3: false, 4: false }
        let freqEnabled: Record<Freq, boolean> = { ...baseFreqEnabled }
        setUiAvailable({ ...baseFreqEnabled })
        setUiHarmonic(false)

        const duoSeq = DUO_PATTERN_BY_LEVEL[LVL.id]
        const tripleSeq = TRIPLE_PATTERN_BY_LEVEL[LVL.id]
        let duoCursor = 0,
            f4Progress = 0

        let selected: Freq = 1
        let nodes: SolarNode[] = []
        let avatar = { x: LOGICAL_W / 2, y: LOGICAL_H / 2 }
        let mouse = { x: LOGICAL_W / 2, y: LOGICAL_H / 2 }
        const pulses: Pulse[] = []
        const absorbs: AbsorbFX[] = []
        const sparks: Spark[] = []
        const trail: TrailPoint[] = []

        /* ===== MEJORA 1: Trail Particles ===== */
        const trailParticles: TrailParticle[] = []
        const MAX_TRAIL_PARTICLES = 300

        /* ===== MEJORA 2: Finish Animation ===== */
        let finishPhase = 0

        /* ===== MEJORA 3: Dynamic Background ===== */
        let gridPulseIntensity = 0
        let dominantHue = { r: 0, g: 194, b: 255 }
        let lastAbsorbPos: { x: number; y: number; time: number } | null = null

        /* ===== MEJORA 4: Avatar Color Morph + Super Sparks ===== */
        let avatarColorTransition = 0
        let avatarPrevColor = FREQS[1].color
        let prevSelected: Freq = 1
        const superSparks: SuperSpark[] = []
        const MAX_SUPER_SPARKS = 50

        /* ===== MEJORA 5: Combo Wave ===== */
        let comboWave: { startTime: number; duration: number } | null = null
        let comboFlash: { startTime: number; duration: number } | null = null

        // Viaje
        let traveling = false
        let targetNode: SolarNode | null = null
        let travelingToPortal = false
        let portalIndex = -1
        let portalEntry: { x: number; y: number } | null = null
        let travelT = 0
        const BASE_TRAVEL = travelSpeedBase
        const SUPER_TRAVEL = travelSpeedBase * superTravelMultiplier
        let travelSpeed = BASE_TRAVEL
        let travelingSuper = false

        // Energía / racha
        let energy = 1
        let streakColor: Freq | null = null
        let streakCount = 0
        let superReady = false
        let superArmed = false

        // Fin
        let finished = false
        let finishStamp: number | null = null
        let backTimer: number | null = null
        let needCodeHintMs = 0

        // Código / portales
        const codeSeq = CODE_BY_LEVEL[LVL.id] || [1, 3, 4]
        let codeCursor = 0
        let codeThisRun = false
        let harmonicLeft = 0
        let portals: Portal[] = []
        let portalCooldown = 0
        let portalsEnabled = false
        let portalFade = 0
        let portalExpireAt: number | null = null

        // Tutorial
        let tutorialStep = isTutorial ? 1 : -1
        let tutorialBlueCount = 0
        let tutorialDuoSpawned = false
        let tutorialTriSpawned = false
        let tutorialFinalPending = false
        let duoAnchor: { x: number; y: number } | null = null

        // Puntería
        let aimAngle = 0
        const AIM_RADIUS = 220
        const AIM_SPEED = 1.8

        const postSuperTitleLines = (tutorialPostSuperTitle || "")
            .replace(/\\n/g, "\n")
            .split("\n")
        const postSuperBodyLines = (tutorialPostSuperBody || "")
            .replace(/\\n/g, "\n")
            .split("\n")

        function toDyn(
            p: SolarNodeBase,
            id: number,
            r: () => number
        ): SolarNode {
            const amp = 1.6 + r() * 1.2,
                spd = 0.6 + r() * 0.7
            return {
                id,
                sx: p.x,
                sy: p.y,
                x: p.x,
                y: p.y,
                freq: p.freq,
                amp,
                spd,
                px: r() * Math.PI * 2,
                py: r() * Math.PI * 2,
                locked: p.locked,
                tRole: p.tRole,
                _tutoDuo: p._tutoDuo,
                _tutoTri: p._tutoTri,
                _tutoFinal: p._tutoFinal,
            }
        }

        function seedPortals(seed: number): Portal[] {
            if (LVL.id === 0)
                return [
                    { x: 880, y: 200, r: 26, pair: 1 },
                    { x: 140, y: LOGICAL_H - 100, r: 26, pair: 0 },
                ]
            const r = mulberry32(seed),
                pad = NODE_PADDING
            const ok = (x: number, y: number) => {
                if (
                    x < pad ||
                    y < pad ||
                    x > LOGICAL_W - pad ||
                    y > LOGICAL_H - pad
                )
                    return false
                for (const n of nodes)
                    if (Math.hypot(n.x - x, n.y - y) < 110) return false
                return true
            }
            let A: null | { x: number; y: number } = null,
                B: null | { x: number; y: number } = null
            const MIN_LEN = Math.min(LOGICAL_W, LOGICAL_H) * 0.6
            for (let tries = 0; tries < 4000 && !(A && B); tries++) {
                const ax = pad + r() * (LOGICAL_W - 2 * pad),
                    ay = pad + r() * (LOGICAL_H - 2 * pad)
                if (!ok(ax, ay)) continue
                for (let j = 0; j < 2000; j++) {
                    const bx = pad + r() * (LOGICAL_W - 2 * pad),
                        by = pad + r() * (LOGICAL_H - 2 * pad)
                    if (!ok(bx, by)) continue
                    if (Math.hypot(bx - ax, by - ay) >= MIN_LEN) {
                        A = { x: ax, y: ay }
                        B = { x: bx, y: by }
                        break
                    }
                }
            }
            if (!A || !B) {
                A = { x: pad + 80, y: LOGICAL_H / 2 }
                B = { x: LOGICAL_W - pad - 80, y: LOGICAL_H / 2 }
            }
            return [
                { x: A.x, y: A.y, r: 24, pair: 1 },
                { x: B.x, y: B.y, r: 24, pair: 0 },
            ]
        }

        function saveRunResults() {
            const w = 160,
                h = 160
            const off = document.createElement("canvas")
            off.width = w
            off.height = h
            const c = off.getContext("2d")!
            c.fillStyle = "#0c1220"
            c.fillRect(0, 0, w, h)
            c.setTransform(w / LOGICAL_W, 0, 0, h / LOGICAL_H, 0, 0)
            c.globalCompositeOperation = "lighter"
            c.lineWidth = 1.2
            for (let i = 1; i < trail.length; i++) {
                const a = trail[i - 1],
                    b = trail[i]
                c.strokeStyle = hexToRGBA(b.color, 0.22)
                c.beginPath()
                c.moveTo(a.x, a.y)
                c.lineTo(b.x, b.y)
                c.stroke()
            }
            c.setTransform(1, 0, 0, 1, 0, 0)
            const url = off.toDataURL("image/png")
            try {
                const raw = localStorage.getItem(STORAGE_KEY) || "{}"
                const obj = JSON.parse(raw)
                const prev = obj[LVL.id] || {}
                obj[LVL.id] = {
                    completed: true,
                    preview: url,
                    chord: prev.chord || (codeThisRun ? true : undefined),
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
            } catch {}
            /* v2.11 — Persistir a Supabase (fire-and-forget). Si falla,
               localStorage queda como respaldo y se sincroniza en el
               próximo mount. */
            try {
                const sb = sbRef.current
                const cid = (window as any).Clerk?.user?.id
                if (sb.url && sb.key && cid) {
                    void gatewayUserAction(
                        sb.url,
                        sb.key,
                        "save_navegante_level",
                        {
                            p_level_id: LVL.id,
                            p_completed: true,
                            p_preview: url,
                            p_chord: !!codeThisRun,
                        }
                    )
                }
            } catch {}
            /* v2.12 — Notificar al padre para que decida si abrir el modal
               "Guarda tu trayectoria" (cuando es Membrana 1 + sin login). */
            try {
                window.dispatchEvent(
                    new CustomEvent("ndr-level-completed", {
                        detail: {
                            id: LVL.id,
                            displayIndex: LVL.displayIndex ?? -1,
                        },
                    })
                )
            } catch {}
            setMenuNonce((n) => n + 1)
        }

        function finishNow() {
            if (finished) return
            finished = true
            finishStamp = performance.now()
            finishPhase = 0
            saveRunResults()
        }

        /* ===== MEJORA 1 helper: emit trail particles ===== */
        function emitTrailParticle(
            x: number,
            y: number,
            color: string,
            count: number = 1,
            fast: boolean = false
        ) {
            for (let i = 0; i < count; i++) {
                if (trailParticles.length >= MAX_TRAIL_PARTICLES)
                    trailParticles.shift()
                if (fast) {
                    // Absorb particles: radial burst away from center, short life
                    const angle = Math.random() * Math.PI * 2
                    const speed = 70 + Math.random() * 60
                    trailParticles.push({
                        x,
                        y,
                        color,
                        life: 0.4,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 1.2 + Math.random() * 1.2,
                        alpha: 0.5,
                    })
                } else {
                    // Travel particles: slow float, shorter life
                    const speedRange = 8
                    const speedMin = 3
                    trailParticles.push({
                        x,
                        y,
                        color,
                        life: 0.55,
                        vx:
                            (Math.random() - 0.5) * 2 * speedRange +
                            (Math.random() < 0.5 ? -speedMin : speedMin) *
                                (Math.random() - 0.5),
                        vy:
                            (Math.random() - 0.5) * 2 * speedRange +
                            (Math.random() < 0.5 ? -speedMin : speedMin) *
                                (Math.random() - 0.5),
                        size: 1.5 + Math.random() * 1.5,
                        alpha: 0.45,
                    })
                }
            }
        }

        function loadLevel(idx: number) {
            ;(window as any)["__ndr_super_hold"] = false
            const layout = ordered.list[idx].builder()
            const rnd = mulberry32(0x5eed + ordered.list[idx].id)
            let nodesInit = layout.map((p: any, i: number) =>
                toDyn(p, i + 1, rnd)
            )
            if (ordered.list[idx].id === 0) {
                nodesInit = nodesInit.filter(
                    (n) =>
                        !(
                            n.tRole === "codeY" ||
                            n.tRole === "codeG" ||
                            n.tRole === "codeB"
                        )
                )
            }
            nodes = nodesInit
            pulses.length = 0
            absorbs.length = 0
            sparks.length = 0
            trail.length = 0
            trailParticles.length = 0
            superSparks.length = 0
            traveling = false
            targetNode = null
            travelingToPortal = false
            portalIndex = -1
            portalEntry = null
            travelT = 0
            travelSpeed = BASE_TRAVEL
            travelingSuper = false
            energy = 1
            streakColor = null
            streakCount = 0
            superReady = false
            superArmed = false
            finished = false
            finishStamp = null
            finishPhase = 0
            backTimer && clearTimeout(backTimer)
            codeCursor = 0
            codeThisRun = false
            harmonicLeft = 0
            portals = seedPortals(
                (PORTAL_SEED ^ (ordered.list[idx].id * 0x9e3779)) >>> 0
            )
            portalCooldown = 0
            portalsEnabled = false
            portalFade = 0
            portalExpireAt = null
            setUiHarmonic(false)
            needCodeHintMs = 0
            coneScale = 1
            tutorialFinalPending = false

            // Reset mejora 3
            gridPulseIntensity = 0
            dominantHue = { r: 0, g: 194, b: 255 }
            lastAbsorbPos = null

            // Reset mejora 4
            avatarColorTransition = 0
            avatarPrevColor = FREQS[1].color
            prevSelected = 1

            // Reset mejora 5
            comboWave = null
            comboFlash = null

            if (isTutorial) {
                avatar.x = 200
                avatar.y = 290
            } else {
                avatar.x = LOGICAL_W / 2
                avatar.y = LOGICAL_H / 2
            }
            if (isTutorial) {
                tutorialStep = 1
                tutorialBlueCount = 0
                tutorialDuoSpawned = false
                tutorialTriSpawned = false
                tutorialFinalPending = false
                harmonicLeft = 0
                portalsEnabled = false
                portalExpireAt = null
            }
            mouse = { x: avatar.x, y: avatar.y }
            aimAngle = Math.atan2(mouse.y - avatar.y, mouse.x - avatar.x)
            freqEnabled = isTutorial
                ? { 1: true, 2: false, 3: false, 4: false }
                : { 1: true, 2: true, 3: false, 4: false }
            setUiAvailable({ ...freqEnabled })
            duoCursor = 0
            f4Progress = 0
            selected = 1
            prevSelected = 1
            tutorialStep = isTutorial ? 1 : -1
            tutorialBlueCount = 0
            tutorialDuoSpawned = false
            tutorialTriSpawned = false
            duoAnchor = null
        }

        loadLevel(levelIndex)

        function spawnSparks(x: number, y: number, color: string) {
            for (let i = 0; i < 22; i++) {
                const a = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.6,
                    sp = 60 + Math.random() * 110
                sparks.push({
                    x,
                    y,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp,
                    life: 1,
                    size: 1 + Math.random() * 2,
                    color,
                })
            }
        }

        function advanceCursor(hit: Freq, seq: Freq[], cursor: number) {
            if (hit === seq[cursor]) return cursor + 1
            if (hit === seq[0]) return 1
            return 0
        }

        function unlockCodePack() {
            freqEnabled[1] = true
            freqEnabled[2] = true
            freqEnabled[3] = true
            setUiAvailable({ ...freqEnabled })
        }

        function respawnStartCluster() {
            if (!isTutorial || tutorialStep !== 1) return
            const base = [
                { x: 220, y: 280 },
                { x: 260, y: 260 },
                { x: 260, y: 300 },
            ]
            nodes = nodes.filter(
                (n) =>
                    !(
                        n.freq === 1 &&
                        n.x >= 200 &&
                        n.x <= 280 &&
                        n.y >= 250 &&
                        n.y <= 310
                    )
            )
            let nextId = nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
            for (const p of base) {
                nodes.push({
                    id: nextId++,
                    sx: p.x,
                    sy: p.y,
                    x: p.x,
                    y: p.y,
                    freq: 1,
                    amp: 1.6,
                    spd: 0.6,
                    px: 0,
                    py: 0,
                } as SolarNode)
            }
            tutorialBlueCount = 0
            streakColor = null
            streakCount = 0
            superReady = false
            superArmed = false
            avatar.x = 200
            avatar.y = 290
            blip(300, 0.08, 0.12, "sine")
        }

        function spawnTutorialDuoAtAnchor(atTop: boolean = false) {
            nodes = nodes.filter((n: any) => !(n as any)._tutoDuo)
            const cx = clamp(
                avatar.x,
                NODE_PADDING + 120,
                LOGICAL_W - NODE_PADDING - 120
            )
            const cyBase = NODE_PADDING + 220
            const cy = atTop ? Math.max(NODE_PADDING + 160, cyBase) : cyBase
            const gap = 44
            const list = [
                { x: cx - gap * 0.5, y: cy, freq: 2 as Freq },
                { x: cx + gap * 0.5, y: cy, freq: 1 as Freq },
            ]
            let nextId = nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
            for (const p of list) {
                nodes.push({
                    id: nextId++,
                    sx: p.x,
                    sy: p.y,
                    x: p.x,
                    y: p.y,
                    freq: p.freq,
                    amp: 1.6,
                    spd: 0.6,
                    px: 0,
                    py: 0,
                    _tutoDuo: true,
                } as any)
            }
            avatar.x = cx
            avatar.y = Math.max(NODE_PADDING + 60, cy - 120)
            freqEnabled[2] = true
            setUiAvailable({ ...freqEnabled })
            superArmed = false
            superReady = false
            streakColor = null
            streakCount = 0
            blip(520, 0.1, 0.14, "sine")
        }

        function spawnTutorialTripleForF4(atTop: boolean = false) {
            nodes = nodes.filter((n: any) => !(n as any)._tutoTri)
            const cx = clamp(
                avatar.x,
                NODE_PADDING + 140,
                LOGICAL_W - NODE_PADDING - 140
            )
            const cyBase = NODE_PADDING + 240
            const cy = atTop ? Math.max(NODE_PADDING + 170, cyBase) : cyBase
            const gap = 22
            const list = [
                { x: cx - gap, y: cy, freq: 1 as Freq },
                { x: cx, y: cy, freq: 2 as Freq },
                { x: cx + gap, y: cy, freq: 3 as Freq },
            ]
            let nextId = nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
            for (const p of list) {
                nodes.push({
                    id: nextId++,
                    sx: p.x,
                    sy: p.y,
                    x: p.x,
                    y: p.y,
                    freq: p.freq,
                    amp: 1.6,
                    spd: 0.6,
                    px: 0,
                    py: 0,
                    _tutoTri: true,
                } as any)
            }
            avatar.x = cx
            avatar.y = Math.max(NODE_PADDING + 70, cy - 130)
            superArmed = false
            superReady = false
            blip(660, 0.1, 0.14, "sine")
        }

        function respawnCodePackAtTop() {
            nodes = nodes.filter(
                (n) =>
                    !(
                        n.tRole === "codeY" ||
                        n.tRole === "codeG" ||
                        n.tRole === "codeB"
                    )
            )
            let nextId = nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
            const trio = [
                { x: 760, y: 310, freq: 2 as Freq, tRole: "codeY" as const },
                { x: 820, y: 350, freq: 3 as Freq, tRole: "codeG" as const },
                { x: 880, y: 330, freq: 1 as Freq, tRole: "codeB" as const },
            ]
            const cx = (trio[0].x + trio[1].x + trio[2].x) / 3
            avatar.x = clamp(
                cx,
                NODE_PADDING + 80,
                LOGICAL_W - NODE_PADDING - 80
            )
            avatar.y = NODE_PADDING + 110
            for (const p of trio) {
                nodes.push({
                    id: nextId++,
                    sx: p.x,
                    sy: p.y,
                    x: p.x,
                    y: p.y,
                    freq: p.freq,
                    amp: 1.6,
                    spd: 0.6,
                    px: 0,
                    py: 0,
                    locked: false,
                    tRole: p.tRole,
                } as SolarNode)
            }
            codeCursor = 0
            blip(420, 0.1, 0.14, "sine")
        }

        function spawnTutorialFinalNode() {
            nodes = nodes.filter((n: any) => !(n as any)._tutoFinal)
            const fx = clamp(
                avatar.x + 140,
                NODE_PADDING + 80,
                LOGICAL_W - NODE_PADDING - 80
            )
            const fy = clamp(
                avatar.y,
                NODE_PADDING + 120,
                LOGICAL_H - NODE_PADDING - 120
            )
            let nextId = nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
            nodes.push({
                id: nextId++,
                sx: fx,
                sy: fy,
                x: fx,
                y: fy,
                freq: 4,
                amp: 1.6,
                spd: 0.6,
                px: 0,
                py: 0,
                tRole: "final",
                _tutoFinal: true,
            } as SolarNode)
            tutorialFinalPending = true
            freqEnabled[4] = true
            setUiAvailable({ ...freqEnabled })
        }

        function absorbNode(n: SolarNode) {
            let unlockedF3Now = false
            if (isTutorial && tutorialStep === 1 && n.freq === 1)
                tutorialBlueCount++
            if (n.locked) return

            const col = FREQS[n.freq].color
            absorbs.push({ x: n.x, y: n.y, life: 1 })
            trail.push({ x: n.x, y: n.y, color: col })
            spawnSparks(n.x, n.y, col)
            nodes = nodes.filter((x) => x.id !== n.id)

            /* MEJORA 1: emit trail particles on absorb */
            emitTrailParticle(n.x, n.y, col, 3, true)

            /* MEJORA 3: grid pulse + last absorb pos */
            gridPulseIntensity = 1
            lastAbsorbPos = { x: n.x, y: n.y, time: performance.now() }

            if (streakColor === n.freq) streakCount++
            else {
                streakColor = n.freq
                streakCount = 1
            }
            if (streakCount >= STREAK_NEEDED) {
                superReady = true
                streakCount = STREAK_NEEDED

                /* MEJORA 5: combo wave on streak complete */
                comboWave = { startTime: performance.now(), duration: 800 }
                comboFlash = { startTime: performance.now(), duration: 400 }
            }

            // ===== Llave F3 (DUO) =====
            if ((!isTutorial || tutorialStep === 3) && !freqEnabled[3]) {
                if (isTutorial && tutorialStep === 3 && (n as any)._tutoDuo) {
                    const expectedNow = DUO_PATTERN_BY_LEVEL[LVL.id][duoCursor]
                    if (n.freq !== expectedNow) {
                        spawnTutorialDuoAtAnchor(true)
                        duoCursor = 0
                    }
                }
                duoCursor = advanceCursor(
                    n.freq,
                    DUO_PATTERN_BY_LEVEL[LVL.id],
                    duoCursor
                )
                const completedDuo =
                    duoCursor === DUO_PATTERN_BY_LEVEL[LVL.id].length
                if (completedDuo) {
                    unlockedF3Now = true
                    freqEnabled[3] = true
                    setUiAvailable({ ...freqEnabled })
                    blip(980, 0.1, 0.16, "triangle")
                    duoCursor = 0
                    f4Progress = 0
                    if (isTutorial && tutorialStep === 3) {
                        spawnTutorialTripleForF4(true)
                        tutorialTriSpawned = true
                        tutorialStep = 4
                        selected = 1
                    }
                }
            }

            // ===== F4 (TRIPLE) =====
            if (freqEnabled[3] && !freqEnabled[4] && !unlockedF3Now) {
                if (isTutorial) {
                    if ((n as any)._tutoTri) {
                        const expected =
                            TRIPLE_PATTERN_BY_LEVEL[LVL.id][f4Progress]
                        if (n.freq !== expected) {
                            spawnTutorialTripleForF4(true)
                            f4Progress = 0
                        } else {
                            f4Progress += 1
                            if (
                                f4Progress >=
                                TRIPLE_PATTERN_BY_LEVEL[LVL.id].length
                            ) {
                                freqEnabled[4] = true
                                setUiAvailable({ ...freqEnabled })
                                blip(1220, 0.1, 0.16, "triangle")
                                f4Progress = 0
                                nodes = nodes.filter(
                                    (m: any) => !(m as any)._tutoTri
                                )
                                if (tutorialStep === 4) {
                                    unlockCodePack()
                                    respawnCodePackAtTop()
                                    selected = 2
                                    tutorialStep = 5
                                }
                            }
                        }
                    }
                } else {
                    const expected = TRIPLE_PATTERN_BY_LEVEL[LVL.id][f4Progress]
                    if (n.freq === expected) f4Progress += 1
                    else if (n.freq === TRIPLE_PATTERN_BY_LEVEL[LVL.id][0])
                        f4Progress = 1
                    else f4Progress = 0
                    if (f4Progress >= TRIPLE_PATTERN_BY_LEVEL[LVL.id].length) {
                        freqEnabled[4] = true
                        setUiAvailable({ ...freqEnabled })
                        blip(1220, 0.1, 0.16, "triangle")
                        f4Progress = 0
                    }
                }
            }

            // ===== Código / Portales =====
            if (!codeThisRun) {
                codeCursor = advanceCursor(n.freq, codeSeq, codeCursor)
                if (codeCursor === codeSeq.length) {
                    codeThisRun = true
                    harmonicLeft = Math.max(
                        harmonicLeft,
                        Math.max(2000, chordSeconds * 1000)
                    )
                    portalsEnabled = true
                    if (!isTutorial)
                        portalExpireAt = performance.now() + PORTAL_LIFETIME_MS
                    blip(880, 0.08, 0.14, "triangle")
                    blip(660, 0.08, 0.12, "sine")
                    setUiHarmonic(true)
                    codeCursor = 0
                    if (isTutorial && tutorialStep === 5) tutorialStep = 6
                    if (isTutorial) {
                        nodes = nodes.filter(
                            (x: any) =>
                                !(
                                    x.tRole === "codeY" ||
                                    x.tRole === "codeG" ||
                                    x.tRole === "codeB" ||
                                    (x as any)._tutoDuo ||
                                    (x as any)._tutoTri
                                )
                        )
                    }
                } else {
                    if (!isTutorial && nodes.length <= 1 && !codeThisRun) {
                        needCodeHintMs = 1600
                        blip(220, 0.08, 0.12, "sine")
                    }
                }
            }

            if (n.freq === selected) energy = clamp(energy + ENERGY_GAIN, 0, 1)

            // ===== Tutorial: lógica especial =====
            if (isTutorial) {
                if (tutorialStep === 1 && tutorialBlueCount >= 3) {
                    if (superReady) tutorialStep = 2
                    else respawnStartCluster()
                }
                if (tutorialStep === 5) {
                    const remaining = nodes.filter(
                        (x) =>
                            x.tRole === "codeY" ||
                            x.tRole === "codeG" ||
                            x.tRole === "codeB"
                    ).length
                    if (remaining === 0 && !codeThisRun) respawnCodePackAtTop()
                }
                if ((n as any)._tutoFinal) {
                    tutorialFinalPending = false
                    finishNow()
                }
            }

            if (!isTutorial) {
                if (nodes.length === 0 && codeThisRun) finishNow()
                if (nodes.length === 0 && !codeThisRun) needCodeHintMs = 1600
            }
        }

        const canUseFreq = (f: Freq) =>
            f <= levelMaxFreq && (harmonicLeft > 0 || !!freqEnabled[f])

        const pickFirstEnabled = (): Freq =>
            ((freqEnabled[1] && 1) ||
                (freqEnabled[2] && 2) ||
                (freqEnabled[3] && 3) ||
                4) as Freq

        const keyAim = { l: false, r: false, u: false, d: false }
        let aHeld = false

        function updateAimFromKeys(dt: number) {
            const dx = (keyAim.r ? 1 : 0) - (keyAim.l ? 1 : 0)
            const dy = (keyAim.d ? 1 : 0) - (keyAim.u ? 1 : 0)
            if (dx === 0 && dy === 0) return

            if (!aHeld) {
                const target = Math.atan2(dy, dx)
                let diff = target - aimAngle
                if (diff < -Math.PI) diff += Math.PI * 2
                if (diff > Math.PI) diff -= Math.PI * 2
                const step = AIM_SPEED * dt
                if (Math.abs(diff) <= step) {
                    aimAngle = target
                } else {
                    aimAngle += Math.sign(diff) * step
                }
                mouse.x = avatar.x + Math.cos(aimAngle) * AIM_RADIUS
                mouse.y = avatar.y + Math.sin(aimAngle) * AIM_RADIUS
            }
        }

        function snapAimToDirection(dx: number, dy: number) {
            if (dx === 0 && dy === 0) return
            aimAngle = Math.atan2(dy, dx)
            mouse.x = avatar.x + Math.cos(aimAngle) * AIM_RADIUS
            mouse.y = avatar.y + Math.sin(aimAngle) * AIM_RADIUS
        }

        function onMove(e: MouseEvent) {
            const r = canvas.getBoundingClientRect()
            mouse.x = (e.clientX - r.left) * (LOGICAL_W / Math.max(1, r.width))
            mouse.y = (e.clientY - r.top) * (LOGICAL_H / Math.max(1, r.height))
            aimAngle = Math.atan2(mouse.y - avatar.y, mouse.x - avatar.x)
            showOnMouse()
        }

        function firePulse() {
            if (finished) return
            const ang = Math.atan2(mouse.y - avatar.y, mouse.x - avatar.x)
            if (pulses.length >= MAX_PULSES) pulses.shift()
            const wantSuper = superArmed && superReady
            let useSuper = false
            if (wantSuper) {
                if (isTutorial && tutorialStep === 2) {
                    useSuper = true
                    superArmed = false
                    superReady = true
                    streakColor = null
                    streakCount = 0
                } else if (energy + EPS >= SUPER_COST) {
                    energy = clamp(energy - SUPER_COST, 0, 1)
                    useSuper = true
                    superArmed = false
                    superReady = false
                    streakColor = null
                    streakCount = 0
                } else {
                    superArmed = false
                }
            }
            if (useSuper) {
                const holdKey = "__ndr_super_hold"
                ;(window as any)[holdKey] = false
            }

            pulses.push({
                x: avatar.x,
                y: avatar.y,
                radius: 0,
                prevR: 0,
                life: 1,
                color: FREQS[selected].color,
                freq: selected,
                angle: ang,
                super: useSuper,
                hit: false,
            })
            blip(
                FREQS[selected].tone * (useSuper ? 1.4 : 1.0),
                0.24,
                useSuper ? 0.22 : 0.18,
                "triangle"
            )
        }

        function onClick() {
            firePulse()
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault()
                return
            }

            if (e.key === "a" || e.key === "A") {
                aHeld = true
                return
            }

            if (
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown"
            ) {
                if (aHeld) {
                    const dx =
                        e.key === "ArrowLeft"
                            ? -1
                            : e.key === "ArrowRight"
                              ? 1
                              : 0
                    const dy =
                        e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0
                    snapAimToDirection(dx, dy)
                    e.preventDefault()
                    return
                }

                if (e.key === "ArrowLeft") keyAim.l = true
                if (e.key === "ArrowRight") keyAim.r = true
                if (e.key === "ArrowUp") keyAim.u = true
                if (e.key === "ArrowDown") keyAim.d = true
                e.preventDefault()
                return
            }

            if (e.key === "r" || e.key === "R") {
                loadLevel(levelIndex)
                return
            }

            if (e.key >= "1" && e.key <= "4") {
                const f = parseInt(e.key, 10) as Freq
                if (canUseFreq(f)) {
                    /* MEJORA 4: track color transition */
                    if (f !== selected) {
                        avatarPrevColor = FREQS[selected].color
                        avatarColorTransition = 1
                        prevSelected = selected
                    }
                    selected = f
                    pulses.length = 0
                    blip(FREQS[f].tone, 0.08, 0.12, "sine")
                } else {
                    blip(200, 0.06, 0.1, "sine")
                }
                return
            }

            if (e.key === "s" || e.key === "S") {
                if (superArmed) {
                    superArmed = false
                    blip(200, 0.08, 0.1, "sine")
                } else if (superReady) {
                    superArmed = true
                    blip(1200, 0.08, 0.12, "sine")
                }
                e.preventDefault()
                return
            }

            if (e.code === "Space") {
                firePulse()
                e.preventDefault()
                return
            }
        }

        function onKeyUp(e: KeyboardEvent) {
            if (e.key === "ArrowLeft") keyAim.l = false
            if (e.key === "ArrowRight") keyAim.r = false
            if (e.key === "ArrowUp") keyAim.u = false
            if (e.key === "ArrowDown") keyAim.d = false

            if (e.key === "a" || e.key === "A") {
                aHeld = false
            }
        }

        document.addEventListener("mousemove", onMove)
        canvas.addEventListener("click", onClick)
        document.addEventListener("keydown", onKeyDown)
        document.addEventListener("keyup", onKeyUp)

        /* ═══════════════════════════════════════════════════════
           v2.0 — API imperativa para el overlay táctil [LENTE].
           Las closures mutan el estado local del bucle de juego.
        ═══════════════════════════════════════════════════════ */
        gameApiRef.current = {
            setAimAngle: (angle: number) => {
                aimAngle = angle
                mouse.x = avatar.x + Math.cos(angle) * AIM_RADIUS
                mouse.y = avatar.y + Math.sin(angle) * AIM_RADIUS
            },
            setMouse: (x: number, y: number) => {
                mouse.x = x
                mouse.y = y
                aimAngle = Math.atan2(y - avatar.y, x - avatar.x)
            },
            fire: () => {
                firePulse()
            },
            setFreq: (f: Freq) => {
                if (canUseFreq(f)) {
                    if (f !== selected) {
                        avatarPrevColor = FREQS[selected].color
                        avatarColorTransition = 1
                        prevSelected = selected
                    }
                    selected = f
                    pulses.length = 0
                    blip(FREQS[f].tone, 0.08, 0.12, "sine")
                } else {
                    blip(200, 0.06, 0.1, "sine")
                }
            },
            armSuper: () => {
                if (superArmed) return
                if (superReady) {
                    superArmed = true
                    blip(1200, 0.08, 0.12, "sine")
                }
            },
            cancelSuper: () => {
                if (!superArmed) return
                superArmed = false
                blip(200, 0.08, 0.1, "sine")
            },
            reload: () => {
                loadLevel(levelIndex)
            },
        }

        let t: any = null
        const showOnMouse = () => {
            canvas.style.cursor = "default"
            if (t) clearTimeout(t)
            t = setTimeout(() => {
                canvas.style.cursor = "none"
            }, 1200)
        }
        const schedule = () => {
            if (t) clearTimeout(t)
            t = setTimeout(() => {
                canvas.style.cursor = "none"
            }, 800)
        }
        schedule()
        document.addEventListener("mousemove", showOnMouse)
        document.addEventListener("mousedown", showOnMouse)
        document.addEventListener("keydown", () => {
            /* no-op */
        })

        /* --- Animación --- */
        let last = 0,
            raf = 0
        function tick(time: number) {
            const dt = Math.max(0, (time - last) / 1000)
            last = time

            updateAimFromKeys(dt)

            /* MEJORA 4: update avatar color transition */
            if (avatarColorTransition > 0) {
                avatarColorTransition = Math.max(
                    0,
                    avatarColorTransition - dt / 0.3
                )
            }

            /* MEJORA 3: decay grid pulse and interpolate dominant hue */
            gridPulseIntensity = Math.max(0, gridPulseIntensity - dt * 0.8)
            {
                const targetRGB = hexToRGB(FREQS[selected].color)
                dominantHue.r += (targetRGB.r - dominantHue.r) * dt * 0.5
                dominantHue.g += (targetRGB.g - dominantHue.g) * dt * 0.5
                dominantHue.b += (targetRGB.b - dominantHue.b) * dt * 0.5
            }

            const wasOn = harmonicLeft > 0
            harmonicLeft = Math.max(0, harmonicLeft - dt * 1000)
            if (harmonicLeft > 0 !== wasOn) {
                setUiHarmonic(harmonicLeft > 0)
                if (!(harmonicLeft > 0) && !canUseFreq(selected))
                    selected = pickFirstEnabled()
            }
            if (needCodeHintMs > 0)
                needCodeHintMs = Math.max(0, needCodeHintMs - dt * 1000)
            portalCooldown = Math.max(0, portalCooldown - dt)
            if (portalFade > 0)
                portalFade = Math.max(0, portalFade - dt / PORTAL_FADE_SECS)
            if (!isTutorial && portalsEnabled && portalExpireAt !== null) {
                if (performance.now() >= portalExpireAt) {
                    portalsEnabled = false
                    portalExpireAt = null
                    harmonicLeft = 0
                    portalFade = 1
                }
            }

            // FONDO holográfico
            ctx.fillStyle = "#040810"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // ★ MEJORA 3: Grid sutil de fondo REACTIVO
            ctx.save()
            ctx.translate(CANVAS_PAD, CANVAS_PAD)
            const gridBaseOpacity = 0.035 + gridPulseIntensity * 0.04
            const gridSize = 80
            const absorbNearbyExtra = (gx: number, gy: number): number => {
                if (!lastAbsorbPos) return 0
                const elapsed = performance.now() - lastAbsorbPos.time
                if (elapsed > 500) return 0
                const dist = Math.hypot(
                    gx - lastAbsorbPos.x + CANVAS_PAD,
                    gy - lastAbsorbPos.y + CANVAS_PAD
                )
                if (dist < 200) {
                    return 0.03 * (1 - elapsed / 500) * (1 - dist / 200)
                }
                return 0
            }

            ctx.lineWidth = 0.5
            for (let gx = 0; gx < LOGICAL_W; gx += gridSize) {
                const extra = absorbNearbyExtra(gx, LOGICAL_H / 2)
                const op = clamp(gridBaseOpacity + extra, 0, 0.15)
                ctx.globalAlpha = op
                ctx.strokeStyle = `rgb(${Math.round(dominantHue.r)},${Math.round(dominantHue.g)},${Math.round(dominantHue.b)})`
                ctx.beginPath()
                ctx.moveTo(gx, 0)
                ctx.lineTo(gx, LOGICAL_H)
                ctx.stroke()
            }
            for (let gy = 0; gy < LOGICAL_H; gy += gridSize) {
                const extra = absorbNearbyExtra(LOGICAL_W / 2, gy)
                const op = clamp(gridBaseOpacity + extra, 0, 0.15)
                ctx.globalAlpha = op
                ctx.strokeStyle = `rgb(${Math.round(dominantHue.r)},${Math.round(dominantHue.g)},${Math.round(dominantHue.b)})`
                ctx.beginPath()
                ctx.moveTo(0, gy)
                ctx.lineTo(LOGICAL_W, gy)
                ctx.stroke()
            }
            ctx.restore()

            for (const n of nodes) {
                n.x = n.sx + Math.sin(time * 0.0015 * n.spd + n.px) * n.amp
                n.y = n.sy + Math.cos(time * 0.0013 * n.spd + n.py) * n.amp
            }

            /* ===== MEJORA 1: Render Trail Particles (BEFORE nodes) ===== */
            {
                const isFinishGravity = finished && finishPhase < 0.3
                for (let i = trailParticles.length - 1; i >= 0; i--) {
                    const tp = trailParticles[i]
                    tp.life -= dt * 0.25
                    if (tp.life <= 0) {
                        trailParticles.splice(i, 1)
                        continue
                    }
                    // MEJORA 2: during finish phase 0-0.3, gravitate toward center
                    if (isFinishGravity) {
                        tp.vx += (LOGICAL_W / 2 - tp.x) * 0.5 * dt
                        tp.vy += (LOGICAL_H / 2 - tp.y) * 0.5 * dt
                    }
                    // MEJORA 2: during finish phase 0.5+, freeze as stars
                    if (finished && finishPhase >= 0.5) {
                        tp.vx = 0
                        tp.vy = 0
                        const pulse =
                            0.4 + 0.4 * Math.sin(time * 0.005 + i * 0.3)
                        const drawAlpha = tp.alpha * pulse
                        ctx.fillStyle = hexToRGBA(tp.color, drawAlpha)
                        ctx.shadowColor = tp.color
                        ctx.shadowBlur = 4
                        ctx.beginPath()
                        ctx.arc(tp.x, tp.y, tp.size * 0.8, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.shadowBlur = 0
                    } else {
                        tp.x += tp.vx * dt
                        tp.y += tp.vy * dt
                        const drawAlpha = tp.alpha * tp.life
                        const drawSize = tp.size * (0.5 + 0.5 * tp.life)
                        ctx.fillStyle = hexToRGBA(tp.color, drawAlpha)
                        ctx.shadowColor = tp.color
                        ctx.shadowBlur = 4 * tp.life
                        ctx.beginPath()
                        ctx.arc(tp.x, tp.y, drawSize, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.shadowBlur = 0
                    }
                }
            }

            /* ===== MEJORA 5: Combo Wave render ===== */
            if (comboWave !== null) {
                const progress =
                    (performance.now() - comboWave.startTime) /
                    comboWave.duration
                if (progress >= 1) {
                    comboWave = null
                } else if (trailParticles.length > 0) {
                    const tpLen = trailParticles.length
                    for (let i = 0; i < tpLen; i++) {
                        const tp = trailParticles[i]
                        const normIdx = i / tpLen
                        const dist = Math.abs(normIdx - progress)
                        if (dist < 0.15) {
                            const intensity = 1 - dist / 0.15
                            const boostedAlpha = Math.min(
                                1,
                                tp.alpha * tp.life + intensity * 0.5
                            )
                            const boostedSize = tp.size * (1 + intensity * 1.5)
                            ctx.fillStyle = hexToRGBA(tp.color, boostedAlpha)
                            ctx.shadowColor = tp.color
                            ctx.shadowBlur = 20 * intensity
                            ctx.beginPath()
                            ctx.arc(tp.x, tp.y, boostedSize, 0, Math.PI * 2)
                            ctx.fill()
                            ctx.shadowBlur = 0
                        }
                    }
                    // Connect wavefront particles with bright lines
                    const waveFront: TrailParticle[] = []
                    for (let i = 0; i < tpLen; i++) {
                        const normIdx = i / tpLen
                        if (Math.abs(normIdx - progress) < 0.05) {
                            waveFront.push(trailParticles[i])
                        }
                    }
                    if (waveFront.length >= 2) {
                        ctx.strokeStyle = "rgba(255,255,255,0.5)"
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.moveTo(waveFront[0].x, waveFront[0].y)
                        for (let i = 1; i < waveFront.length; i++) {
                            ctx.lineTo(waveFront[i].x, waveFront[i].y)
                        }
                        ctx.stroke()
                    }
                }
            }

            /* MEJORA 5: Combo flash circle from avatar */
            if (comboFlash !== null) {
                const fp =
                    (performance.now() - comboFlash.startTime) /
                    comboFlash.duration
                if (fp >= 1) {
                    comboFlash = null
                } else {
                    const flashR = fp * 80
                    const flashA = 0.4 * (1 - fp)
                    ctx.strokeStyle = `rgba(255,255,255,${flashA})`
                    ctx.lineWidth = 2.5 * (1 - fp)
                    ctx.shadowColor = "rgba(255,255,255,0.5)"
                    ctx.shadowBlur = 12 * (1 - fp)
                    ctx.beginPath()
                    ctx.arc(avatar.x, avatar.y, flashR, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.shadowBlur = 0
                }
            }

            for (const n of nodes) {
                const enabledFreq = harmonicLeft > 0 || !!freqEnabled[n.freq]
                const enabledNode = enabledFreq && !n.locked
                if (enabledNode) {
                    const col = FREQS[n.freq].color
                    const pul =
                        (Math.sin(time * 0.003 + n.sx * 0.02) * 0.5 + 0.5) *
                            0.6 +
                        0.4

                    ctx.save()
                    ctx.globalAlpha = 0.12 + 0.08 * pul
                    ctx.strokeStyle = col
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, 20 + 6 * pul, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.restore()

                    ctx.save()
                    ctx.globalAlpha = 0.2 + 0.15 * pul
                    ctx.strokeStyle = col
                    ctx.lineWidth = 0.8
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.arc(
                        n.x,
                        n.y,
                        15 + 4 * pul,
                        time * 0.002,
                        time * 0.002 + Math.PI * 1.5
                    )
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.restore()

                    ctx.shadowColor = col
                    ctx.shadowBlur = 14 + 20 * pul
                    ctx.fillStyle = hexToRGBA(col, 0.95)
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, 6 + 2.5 * pul, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.shadowBlur = 0

                    ctx.strokeStyle = hexToRGBA(col, 0.45)
                    ctx.lineWidth = 1.2
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, 11 + 3 * pul, 0, Math.PI * 2)
                    ctx.stroke()
                } else {
                    ctx.save()
                    ctx.globalAlpha = 0.18
                    ctx.strokeStyle = "rgba(180,200,220,0.3)"
                    ctx.lineWidth = 0.6
                    ctx.setLineDash([3, 5])
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.restore()

                    ctx.fillStyle = "rgba(180,200,220,0.15)"
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            // Portales
            const portalsActive = portalsEnabled
            const portalAlpha = portalsActive ? 1 : portalFade
            if (portalAlpha > 0 && portals.length === 2) {
                const [A, B] = portals
                ctx.save()
                ctx.globalAlpha = portalAlpha
                const phi = time * 0.003
                for (const P of [A, B]) {
                    ctx.strokeStyle = "rgba(255,215,0,0.9)"
                    ctx.lineWidth = 2
                    ctx.shadowColor = "#FFD700"
                    ctx.shadowBlur = 12
                    ctx.beginPath()
                    ctx.arc(P.x, P.y, P.r, phi, phi + Math.PI * 1.6)
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.arc(P.x, P.y, P.r - 6, -phi, -phi + Math.PI * 1.2)
                    ctx.stroke()
                    ctx.shadowBlur = 0
                }
                ctx.strokeStyle = "rgba(255,215,0,0.25)"
                ctx.setLineDash([6, 6])
                ctx.beginPath()
                ctx.moveTo(A.x, A.y)
                ctx.lineTo(B.x, B.y)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.restore()
            }

            // Pulsos
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i]
                p.prevR = p.radius
                const mult = energy > 0 || isTutorial ? 1 : ENERGY_DEPLETED_MULT
                p.radius +=
                    (p.super ? SUPER_PULSE_GROW : BASE_PULSE_GROW) * mult * dt
                p.life -= 1.05 * dt
                if (p.life <= 0) {
                    if (!p.hit) {
                        if (!isTutorial)
                            energy = clamp(energy - ENERGY_COST, 0, 1)
                        streakCount = 0
                        streakColor = null
                        coneScale = Math.max(
                            MIN_CONE_SCALE,
                            coneScale * FAIL_CONE_FACTOR
                        )
                        if (isTutorial && tutorialStep === 2 && p.super) {
                            superReady = true
                            superArmed = false
                        }
                    }
                    pulses.splice(i, 1)
                    continue
                }
                ctx.strokeStyle = hexToRGBA(
                    p.color,
                    Math.max(0, Math.min(1, p.life * 0.65))
                )
                ctx.lineWidth = p.super ? 2.6 : 1.8
                ctx.shadowColor = p.color
                ctx.shadowBlur = (p.super ? 22 : 14) * p.life
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.stroke()
                ctx.shadowBlur = 0

                // detección
                if (!traveling && !finished) {
                    const baseCone =
                        conf.cone *
                        (p.super ? SUPER_CONE_FACTOR : 1) *
                        coneScale
                    const slack = conf.slack

                    let best: SolarNode | null = null
                    let bestAngleDiff = Infinity

                    for (const n of nodes) {
                        if (n.freq !== p.freq || n.locked) continue
                        const dx = n.x - p.x,
                            dy = n.y - p.y
                        const dist = Math.hypot(dx, dy)

                        const na = Math.atan2(dy, dx)
                        let diff = na - p.angle
                        if (diff < -Math.PI) diff += Math.PI * 2
                        if (diff > Math.PI) diff -= Math.PI * 2
                        if (Math.abs(diff) > baseCone) continue

                        const inRange = p.super
                            ? true
                            : dist <= p.radius + slack && dist >= 20

                        if (!inRange) continue

                        const absDiff = Math.abs(diff)
                        if (absDiff < bestAngleDiff) {
                            bestAngleDiff = absDiff
                            best = n
                        }
                    }

                    if (best) {
                        const wouldCompleteCode =
                            !codeThisRun &&
                            best.freq === codeSeq[codeCursor] &&
                            codeCursor + 1 === codeSeq.length
                        if (
                            !isTutorial &&
                            !codeThisRun &&
                            nodes.length <= 1 &&
                            !wouldCompleteCode
                        ) {
                            needCodeHintMs = 1600
                            blip(220, 0.08, 0.12, "sine")
                        } else {
                            traveling = true
                            travelingToPortal = false
                            portalIndex = -1
                            portalEntry = null
                            targetNode = best
                            travelT = 0
                            travelSpeed = p.super ? SUPER_TRAVEL : BASE_TRAVEL
                            travelingSuper = p.super === true
                            p.hit = true
                            pulses.splice(i, 1)
                            blip(
                                FREQS[p.freq].tone * 1.5,
                                0.3,
                                0.16,
                                "triangle"
                            )
                            continue
                        }
                    }

                    let chosen = -1
                    let entry: null | { x: number; y: number } = null
                    if (portalsActive && portals.length === 2) {
                        for (let k = 0; k < 2; k++) {
                            const P = portals[k]
                            const d = Math.hypot(P.x - p.x, P.y - p.y)
                            const gap = Math.abs(d - p.radius)
                            let diff =
                                Math.atan2(P.y - p.y, P.x - p.x) - p.angle
                            if (diff < -Math.PI) diff += Math.PI * 2
                            if (diff > Math.PI) diff -= Math.PI * 2
                            const okByAngle = Math.abs(diff) <= baseCone
                            const okByRadius = gap <= PORTAL_BAND
                            if (okByAngle && (p.super || okByRadius)) {
                                entry = {
                                    x:
                                        P.x -
                                        Math.cos(
                                            Math.atan2(P.y - p.y, P.x - p.x)
                                        ) *
                                            P.r,
                                    y:
                                        P.y -
                                        Math.sin(
                                            Math.atan2(P.y - p.y, P.x - p.x)
                                        ) *
                                            P.r,
                                }
                                chosen = k
                                break
                            }
                        }
                    }
                    if (chosen >= 0) {
                        traveling = true
                        travelingToPortal = true
                        portalIndex = chosen
                        portalEntry = entry
                        travelT = 0
                        travelSpeed = p.super ? SUPER_TRAVEL : BASE_TRAVEL
                        travelingSuper = !!p.super
                        p.hit = true
                        pulses.splice(i, 1)
                        blip(1100, 0.14, 0.16, "triangle")
                        continue
                    }
                }
            }

            if (traveling && !finished) {
                const prevX = avatar.x,
                    prevY = avatar.y
                let tx = avatar.x,
                    ty = avatar.y,
                    col = "#FFFFFF"
                if (travelingToPortal && portalEntry) {
                    tx = portalEntry.x
                    ty = portalEntry.y
                    col = "#FFD700"
                } else if (targetNode) {
                    tx = targetNode.x
                    ty = targetNode.y
                    col = FREQS[targetNode.freq].color
                }
                travelT += dt * travelSpeed
                const nx = avatar.x + (tx - avatar.x) * travelT,
                    ny = avatar.y + (ty - avatar.y) * travelT

                /* MEJORA 1: emit trail particles while traveling */
                /* Throttled: ~1 particle every 3 frames, stop at 70% of travel */
                if (travelT < 0.7 && Math.random() < 0.33) {
                    const travelCol = FREQS[selected].color
                    emitTrailParticle(avatar.x, avatar.y, travelCol, 1, false)
                }

                if (
                    !travelingToPortal &&
                    portalsEnabled &&
                    portalCooldown === 0 &&
                    portals.length === 2
                ) {
                    for (const P of portals) {
                        if (
                            segHitsCircle(
                                prevX,
                                prevY,
                                nx,
                                ny,
                                P.x,
                                P.y,
                                P.r + 10
                            )
                        ) {
                            const Q = portals[P.pair]
                            if (Q) {
                                avatar.x = Q.x
                                avatar.y = Q.y
                                portalCooldown = 0.35
                                blip(1200, 0.06, 0.14, "sine")
                            }
                        }
                    }
                }

                const grad = ctx.createLinearGradient(
                    avatar.x,
                    avatar.y,
                    nx,
                    ny
                )
                grad.addColorStop(0, hexToRGBA(col, 1))
                grad.addColorStop(1, hexToRGBA(col, 0))
                ctx.strokeStyle = grad
                ctx.lineWidth = travelSpeed > BASE_TRAVEL ? 3.8 : 3.2
                ctx.shadowColor = col
                ctx.shadowBlur = 16
                ctx.lineCap = "round"
                ctx.beginPath()
                ctx.moveTo(avatar.x, avatar.y)
                ctx.lineTo(nx, ny)
                ctx.stroke()
                ctx.shadowBlur = 0

                avatar.x = nx
                avatar.y = ny

                if (travelT >= 1) {
                    if (travelingToPortal) {
                        const P = portals[portalIndex],
                            Q = portals[P.pair]
                        avatar.x = Q.x
                        avatar.y = Q.y
                        portalCooldown = 0.35
                        blip(1400, 0.07, 0.16, "sine")
                        portalsEnabled = false
                        harmonicLeft = 0
                        portalFade = 1
                        traveling = false
                        travelingToPortal = false
                        portalIndex = -1
                        portalEntry = null
                        travelT = 0
                        travelSpeed = BASE_TRAVEL
                        if (isTutorial && tutorialStep === 6) {
                            spawnTutorialFinalNode()
                            tutorialStep = 7
                        }
                    } else if (targetNode) {
                        absorbNode(targetNode)
                        if (
                            isTutorial &&
                            tutorialStep === 2 &&
                            travelingSuper
                        ) {
                            if (!tutorialDuoSpawned) {
                                const ax = clamp(
                                    avatar.x,
                                    NODE_PADDING + 60,
                                    LOGICAL_W - NODE_PADDING - 60
                                )
                                const ay = clamp(
                                    avatar.y + 120,
                                    NODE_PADDING + 60,
                                    LOGICAL_H - NODE_PADDING - 60
                                )
                                duoAnchor = { x: ax, y: ay }
                                spawnTutorialDuoAtAnchor()
                                tutorialDuoSpawned = true
                                selected = 2
                            }
                            tutorialStep = 3
                        }
                        traveling = false
                        targetNode = null
                        travelT = 0
                        travelSpeed = BASE_TRAVEL
                        travelingSuper = false
                    }
                }
            }

            // FX absorb/sparks
            for (let i = absorbs.length - 1; i >= 0; i--) {
                const fx = absorbs[i]
                fx.life -= dt * 1.5
                if (fx.life <= 0) {
                    absorbs.splice(i, 1)
                    continue
                }
                const r = (1 - fx.life) * 26 + 10
                ctx.strokeStyle = hexToRGBA("#FFFFFF", 0.15 * fx.life)
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2)
                ctx.stroke()
            }
            for (let i = sparks.length - 1; i >= 0; i--) {
                const sp = sparks[i]
                sp.life -= dt * 1.4
                if (sp.life <= 0) {
                    sparks.splice(i, 1)
                    continue
                }
                sp.x += sp.vx * dt
                sp.y += sp.vy * dt
                sp.vx *= 0.98
                sp.vy *= 0.98
                ctx.fillStyle = hexToRGBA(sp.color, 0.65 * sp.life)
                ctx.beginPath()
                ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2)
                ctx.fill()
            }

            /* ===== MEJORA 4: Super Sparks (emit + render) ===== */
            if (superArmed) {
                for (let si = 0; si < 3; si++) {
                    if (superSparks.length >= MAX_SUPER_SPARKS)
                        superSparks.shift()
                    const angle = Math.random() * Math.PI * 2
                    const speed = 30 + Math.random() * 30
                    superSparks.push({
                        x: avatar.x + (Math.random() - 0.5) * 30,
                        y: avatar.y + (Math.random() - 0.5) * 30,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.5,
                        size: 1 + Math.random(),
                    })
                }
            }
            for (let i = superSparks.length - 1; i >= 0; i--) {
                const ss = superSparks[i]
                ss.life -= dt * 2
                if (ss.life <= 0) {
                    superSparks.splice(i, 1)
                    continue
                }
                ss.x += ss.vx * dt
                ss.y += ss.vy * dt
                ctx.fillStyle = `rgba(255,255,255,${0.6 * ss.life})`
                ctx.shadowColor = "rgba(255,255,255,0.8)"
                ctx.shadowBlur = 6 * ss.life
                ctx.beginPath()
                ctx.arc(ss.x, ss.y, ss.size, 0, Math.PI * 2)
                ctx.fill()
                ctx.shadowBlur = 0
            }

            // ★ MEJORA 4: Avatar holográfico con color morph
            let avatarCol = FREQS[selected].color
            if (avatarColorTransition > 0) {
                const prevRGB = hexToRGB(avatarPrevColor)
                const curRGB = hexToRGB(FREQS[selected].color)
                const t4 = 1 - avatarColorTransition
                const mr = Math.round(prevRGB.r + (curRGB.r - prevRGB.r) * t4)
                const mg = Math.round(prevRGB.g + (curRGB.g - prevRGB.g) * t4)
                const mb = Math.round(prevRGB.b + (curRGB.b - prevRGB.b) * t4)
                avatarCol = `rgb(${mr},${mg},${mb})`
            }

            const aglow = 0.7 + Math.sin(time * 0.012) * 0.25
            const aPhase = (Math.sin(time * 0.006) + 1) / 2

            // MEJORA 4: Anillo exterior rotatorio — velocidad acelerada con superArmed
            const outerRotSpeed = superArmed ? 0.012 : 0.003
            ctx.save()
            ctx.globalAlpha = 0.15 + 0.1 * aPhase
            ctx.strokeStyle = avatarCol
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.arc(
                avatar.x,
                avatar.y,
                22 + 4 * aPhase,
                time * outerRotSpeed,
                time * outerRotSpeed + Math.PI * 1.4
            )
            ctx.stroke()
            ctx.restore()

            // MEJORA 4: Anillo medio — opacity aumentada con superArmed
            ctx.save()
            ctx.globalAlpha = (superArmed ? 0.5 : 0.25) + 0.15 * aPhase
            ctx.strokeStyle = hexToRGBA(avatarCol, 0.5)
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(avatar.x, avatar.y, 16, 0, Math.PI * 2)
            ctx.stroke()
            ctx.restore()

            // Núcleo luminoso — usa avatarCol (morphed)
            ctx.shadowColor = avatarCol
            ctx.shadowBlur = 16 + 8 * aPhase
            ctx.fillStyle = hexToRGBA(avatarCol, 1)
            ctx.beginPath()
            ctx.arc(avatar.x, avatar.y, 8 * aglow, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0

            // Punto central blanco
            ctx.fillStyle = "rgba(255,255,255,0.85)"
            ctx.beginPath()
            ctx.arc(avatar.x, avatar.y, 2.5, 0, Math.PI * 2)
            ctx.fill()

            if (superArmed) {
                ctx.strokeStyle = "rgba(255,255,255,0.9)"
                ctx.lineWidth = 1.5
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.arc(
                    avatar.x,
                    avatar.y,
                    18,
                    time * -0.005,
                    time * -0.005 + Math.PI * 2
                )
                ctx.stroke()
                ctx.setLineDash([])
            }
            if (harmonicLeft > 0) {
                ctx.save()
                ctx.globalAlpha = 0.1
                const g = ctx.createRadialGradient(
                    avatar.x,
                    avatar.y,
                    0,
                    avatar.x,
                    avatar.y,
                    100
                )
                g.addColorStop(0, "rgba(255,215,0,0.6)")
                g.addColorStop(1, "rgba(255,215,0,0)")
                ctx.fillStyle = g
                ctx.beginPath()
                ctx.arc(avatar.x, avatar.y, 100, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }

            // mira
            if (!traveling && !finished) {
                const aim = Math.atan2(mouse.y - avatar.y, mouse.x - avatar.x)
                const cone = conf.cone * coneScale
                const speedApprox =
                    BASE_PULSE_GROW *
                    (energy > 0 || isTutorial
                        ? 0.7 + 0.3 * energy
                        : ENERGY_DEPLETED_MULT)
                const reach = clamp(speedApprox * 0.8 * coneScale, 48, 300)
                ctx.strokeStyle = hexToRGBA(avatarCol, 0.52)
                ctx.lineWidth = 1
                for (let s = -1; s <= 1; s += 2) {
                    const a = aim + s * cone
                    ctx.beginPath()
                    ctx.moveTo(avatar.x, avatar.y)
                    ctx.lineTo(
                        avatar.x + Math.cos(a) * reach,
                        avatar.y + Math.sin(a) * reach
                    )
                    ctx.stroke()
                }
            }

            // ===== HUD Superior (siempre via DOM) =====
            {
                const total = ordered.list[levelIndex].builder().length
                const displayTitle = ordered.list[levelIndex]
                    .displayTitle as string
                const leftHeader = isTutorial
                    ? ""
                    : `${displayTitle} · nodos ${nodes.length}/${total}`

                const topLeft = document.getElementById(
                    "ndr-top-left-t"
                ) as HTMLDivElement | null
                if (topLeft) topLeft.textContent = leftHeader

                const seqWrap = document.getElementById(
                    "ndr-top-seqs"
                ) as HTMLDivElement | null
                if (seqWrap) {
                    const showCode =
                        (!isTutorial || tutorialStep >= 5) &&
                        !(codeThisRun && harmonicLeft <= 0)
                    const showF3 =
                        !freqEnabled[3] && (!isTutorial || tutorialStep >= 3)
                    const showF4 = !freqEnabled[4] && freqEnabled[3]

                    const makeSeq = (
                        label: string,
                        seq: Freq[],
                        prog: number,
                        full: boolean
                    ) => {
                        const wrap = document.createElement("div")
                        wrap.style.display = "flex"
                        wrap.style.alignItems = "center"
                        wrap.style.fontFamily = "'Inter', system-ui, monospace"
                        wrap.style.fontSize = "13px"
                        wrap.style.fontWeight = "500"
                        wrap.style.color = "rgba(200,230,255,0.92)"

                        const lab = document.createElement("span")
                        lab.textContent = label
                        lab.style.marginRight = "8px"
                        wrap.appendChild(lab)

                        const row = document.createElement("div")
                        row.style.display = "flex"
                        row.style.gap = "7px"
                        for (let i = 0; i < seq.length; i++) {
                            const f = seq[i]
                            const col = FREQS[f].color
                            const active = full || i < prog
                            const dot = document.createElement("span")
                            dot.style.width = "16px"
                            dot.style.height = "16px"
                            dot.style.borderRadius = "50%"
                            dot.style.display = "inline-block"
                            dot.style.background = col
                            dot.style.opacity = active ? "1" : "0.25"
                            if (active)
                                dot.style.boxShadow = `0 0 10px ${hexToRGBA(col, 0.8)}`
                            row.appendChild(dot)
                        }
                        wrap.appendChild(row)
                        return wrap
                    }

                    seqWrap.innerHTML = ""
                    if (showCode)
                        seqWrap.appendChild(
                            makeSeq(
                                "Código:",
                                codeSeq,
                                codeCursor,
                                codeThisRun || harmonicLeft > 0
                            )
                        )
                    if (showF3)
                        seqWrap.appendChild(
                            makeSeq("F3:", duoSeq, duoCursor, false)
                        )
                    if (showF4)
                        seqWrap.appendChild(
                            makeSeq("F4:", tripleSeq, f4Progress, false)
                        )
                }
            }

            // Mensajes (pistas)
            if (needCodeHintMs > 0 && !isTutorial) {
                ctx.font = "12px monospace"
                ctx.fillStyle = "#FFD700"
                ctx.textAlign = "center"
                ctx.fillText(
                    "Activa el código para finalizar",
                    LOGICAL_W / 2,
                    64
                )
            }

            // === Mensajes del Tutorial (Holográfico) ===
            if (isTutorial) {
                ctx.save()

                const fullscreenActive = !!document.fullscreenElement
                const nodesCenterY =
                    nodes.length > 0
                        ? nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length
                        : LOGICAL_H / 2

                const baseY =
                    nodesCenterY < LOGICAL_H / 2
                        ? Math.max(LOGICAL_H * 0.55, LOGICAL_H - 200)
                        : Math.min(LOGICAL_H * 0.12, 80)
                const lineHeight = 28

                const drawHoloText = (
                    lines: string[],
                    startY: number,
                    opts?: {
                        fontSize?: number
                        centered?: boolean
                        maxWidth?: number
                    }
                ) => {
                    const fontSize = opts?.fontSize ?? 17
                    const centered = opts?.centered !== false
                    ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`
                    ctx.textAlign = centered ? "center" : "left"
                    const cx = centered ? LOGICAL_W / 2 : 80

                    let maxW = 0
                    for (const line of lines) {
                        const w = ctx.measureText(line).width
                        if (w > maxW) maxW = w
                    }
                    maxW = Math.min(maxW, opts?.maxWidth ?? LOGICAL_W - 120)

                    const padX = 28,
                        padY = 18
                    const boxW = maxW + padX * 2
                    const boxH = lines.length * lineHeight + padY * 2
                    const boxX = centered ? (LOGICAL_W - boxW) / 2 : cx - padX
                    const boxY = startY - padY - 4

                    ctx.save()
                    ctx.globalAlpha = 0.55
                    ctx.fillStyle = "rgba(4, 12, 24, 0.75)"
                    ctx.beginPath()
                    const r = 16
                    ctx.moveTo(boxX + r, boxY)
                    ctx.lineTo(boxX + boxW - r, boxY)
                    ctx.quadraticCurveTo(
                        boxX + boxW,
                        boxY,
                        boxX + boxW,
                        boxY + r
                    )
                    ctx.lineTo(boxX + boxW, boxY + boxH - r)
                    ctx.quadraticCurveTo(
                        boxX + boxW,
                        boxY + boxH,
                        boxX + boxW - r,
                        boxY + boxH
                    )
                    ctx.lineTo(boxX + r, boxY + boxH)
                    ctx.quadraticCurveTo(
                        boxX,
                        boxY + boxH,
                        boxX,
                        boxY + boxH - r
                    )
                    ctx.lineTo(boxX, boxY + r)
                    ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
                    ctx.closePath()
                    ctx.fill()

                    ctx.globalAlpha = 0.35
                    ctx.strokeStyle = "#00C2FF"
                    ctx.lineWidth = 1
                    ctx.stroke()

                    ctx.globalAlpha = 0.5
                    ctx.strokeStyle = "#00C2FF"
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(boxX + 20, boxY)
                    ctx.lineTo(boxX + boxW - 20, boxY)
                    ctx.stroke()

                    ctx.restore()

                    ctx.shadowColor = "rgba(0,194,255,0.3)"
                    ctx.shadowBlur = 6
                    ctx.fillStyle = "rgba(230,247,239,0.95)"
                    for (let i = 0; i < lines.length; i++) {
                        ctx.fillText(lines[i], cx, startY + i * lineHeight)
                    }
                    ctx.shadowBlur = 0
                }

                /* v2.5 — Copy del tutorial adaptado al [LENTE]: en mobile
                   referenciamos joystick / botón de fuego / chips de
                   frecuencia / botón SUPER en lugar de mouse / SPACE / S /
                   teclas numéricas. La rama desktop queda intacta. */
                const _mob = isMobileRef.current
                if (tutorialStep === 1) {
                    drawHoloText(
                        _mob
                            ? [
                                  "Arrastra el joystick para mover tu campo de visión.",
                                  "Integra los 3 nodos AZULES para cargar el SUPER JUMP.",
                                  "Observa tu barra de racha: se carga con aciertos, baja si fallas.",
                              ]
                            : [
                                  "Usa el mouse o flechas ↑↓←→ para cambiar tu campo de visión.",
                                  "Integra los 3 nodos AZULES para cargar el SUPER JUMP.",
                                  "Observa tu barra de racha: se carga con aciertos, baja si fallas.",
                              ],
                        baseY
                    )
                } else if (tutorialStep === 2) {
                    drawHoloText(
                        _mob
                            ? [
                                  "Toca el botón SUPER (arriba del fuego) para armar el SUPER JUMP.",
                                  "Apunta al nodo lejano AZUL y toca el botón de fuego para integrar.",
                              ]
                            : [
                                  "Presiona S para armar el SUPER JUMP.",
                                  "Apunta al nodo lejano AZUL → clic o SPACE para integrar.",
                              ],
                        baseY
                    )
                } else if (tutorialStep === 3) {
                    drawHoloText(
                        _mob
                            ? [
                                  "Desbloquea F3 (Verde): integra en orden 2→1",
                                  "(AMARILLO → AZUL)",
                                  "",
                                  "Tip: los chips 1–4 abajo cambian de frecuencia.",
                              ]
                            : [
                                  "Desbloquea F3 (Verde): integra en orden 2→1",
                                  "(AMARILLO → AZUL)",
                                  "",
                                  "Tip: los números 1–4 cambian de frecuencia.",
                              ],
                        baseY
                    )
                } else if (tutorialStep === 4) {
                    drawHoloText(["Desbloquea F4 (Rosa): integra 1→2→3"], baseY)
                } else if (tutorialStep === 5) {
                    drawHoloText(
                        _mob
                            ? [
                                  "Sigue la secuencia del código que aparece arriba.",
                                  "",
                                  "Cada activación correcta ordena tu campo,",
                                  "abre un portal dimensional y permite pasar al siguiente nivel.",
                                  "",
                                  "Tip: arrastra el joystick para mover tu campo y toca el fuego para integrar.",
                              ]
                            : [
                                  "Sigue la secuencia del código que aparece arriba.",
                                  "",
                                  "Cada activación correcta ordena tu campo,",
                                  "abre un portal dimensional y permite pasar al siguiente nivel.",
                                  "",
                                  "Tip: A + ↑↓←→ ajusta tu campo de visión instantáneamente.",
                              ],
                        baseY,
                        { fontSize: 16 }
                    )
                } else if (tutorialStep === 6) {
                    drawHoloText(
                        [
                            "¡Portales activos!",
                            "Lanza un pulso dentro del aro para teletransportarte.",
                        ],
                        baseY
                    )
                } else if (tutorialStep === 7) {
                    drawHoloText(["Integra el NODO FINAL (Rosa)."], baseY)
                }

                ctx.restore()
            }

            // ======= Barras de estado (inf. derecha) =======
            {
                const sBar = document.getElementById(
                    "ndr-bar-streak"
                ) as HTMLDivElement | null
                const sTxt = document.getElementById(
                    "ndr-bar-streak-t"
                ) as HTMLDivElement | null
                const sTrack = document.getElementById(
                    "ndr-bar-streak-track"
                ) as HTMLDivElement | null

                const pRow = document.getElementById("ndr-portal-row")
                const pBar = document.getElementById("ndr-bar-portal")
                const pTxt = document.getElementById("ndr-bar-portal-t")
                const portalLeft =
                    portalsEnabled && portalExpireAt
                        ? Math.max(0, portalExpireAt - performance.now())
                        : 0
                if (pRow && pBar && pTxt) {
                    if (portalLeft > 0) {
                        pRow.style.display = "grid"
                        pBar.style.width =
                            (portalLeft / PORTAL_LIFETIME_MS) * 100 + "%"
                        pTxt.textContent = Math.ceil(portalLeft / 1000) + "s"
                    } else {
                        pRow.style.display = "none"
                    }
                }

                if (sBar && sTxt) {
                    const need = STREAK_NEEDED
                    const val = Math.min(need, streakCount || 0)
                    const selectedColor = FREQS[selected].color
                    const streakBaseColor =
                        streakColor != null ? FREQS[streakColor].color : null
                    const holdKey = "__ndr_super_hold"
                    ;(window as any)[holdKey] ??= false
                    if (val >= need && superReady) {
                        ;(window as any)[holdKey] = true
                    }
                    const ready = !!(window as any)[holdKey]

                    sBar.style.borderRadius = "999px"
                    sBar.style.height = "100%"
                    sBar.style.overflow = "hidden"
                    sBar.style.willChange =
                        "background-position, background-image, box-shadow, filter, transform, width"

                    if (sTrack) {
                        sTrack.style.borderRadius = "999px"
                        sTrack.style.overflow = "hidden"
                        sTrack.style.boxShadow = "0 0 10px rgba(0,0,0,0.9)"
                    }

                    if (ready) {
                        sTxt.textContent = "SUPER JUMP"
                        sBar.style.width = "100%"
                        if (sTrack) {
                            sTrack.style.backgroundColor = hexToRGBA(
                                selectedColor,
                                0.24
                            )
                            sTrack.style.outline = `1px solid ${hexToRGBA(selectedColor, 0.9)}`
                        }
                        const plasmaColor = streakBaseColor ?? selectedColor
                        const now = performance.now()
                        const phase = (Math.sin(now * 0.012) + 1) / 2
                        const pos = (now * 0.18) % 200
                        const core = hexToRGBA(plasmaColor, 0.95)
                        const soft = hexToRGBA(plasmaColor, 0.45)
                        sBar.style.backgroundImage = [
                            `linear-gradient(90deg, ${hexToRGBA("#0A1D24", 1)} 0%, ${hexToRGBA("#05151B", 1)} 40%, ${hexToRGBA("#041017", 1)} 100%)`,
                            `linear-gradient(90deg, ${hexToRGBA(plasmaColor, 0.0)} 0%, ${core} 50%, ${hexToRGBA(plasmaColor, 0.0)} 100%)`,
                            `radial-gradient(circle at 0% 50%, ${soft} 0%, transparent 60%)`,
                            `radial-gradient(circle at 100% 50%, ${soft} 0%, transparent 60%)`,
                        ].join(",")
                        sBar.style.backgroundSize =
                            "180% 100%, 220% 100%, 100% 200%, 100% 200%"
                        sBar.style.backgroundPosition = `0 0, ${pos}% 0, 0 0, 0 0`
                        const blur = 10 + 20 * phase
                        const outerAlpha = 0.35 + 0.4 * phase
                        const innerAlpha = 0.55 + 0.35 * phase
                        sBar.style.boxShadow = [
                            `0 0 ${blur}px rgba(80,255,210,${outerAlpha})`,
                            `0 0 ${Math.round(blur * 0.6)}px rgba(0,255,255,${outerAlpha * 0.5})`,
                        ].join(", ")
                        ;(sBar.style as any).webkitFilter =
                            `drop-shadow(0 0 ${blur}px rgba(80,255,210,${innerAlpha}))`
                        sBar.style.filter = `drop-shadow(0 0 ${blur}px rgba(80,255,210,${innerAlpha}))`
                        const scaleY = 1 + phase * 0.08
                        sBar.style.transform = `scaleY(${scaleY})`
                    } else {
                        const pct = need > 0 ? (val / need) * 100 : 0
                        sTxt.textContent = `Racha ${val}/${need}`
                        sBar.style.width = `${pct}%`
                        if (val <= 0 || !streakBaseColor) {
                            sBar.style.backgroundImage = "none"
                            sBar.style.backgroundColor =
                                "rgba(120,130,150,0.25)"
                            if (sTrack) {
                                sTrack.style.backgroundColor =
                                    "rgba(30,35,45,0.9)"
                                sTrack.style.outline =
                                    "1px solid rgba(140,150,170,0.6)"
                            }
                        } else {
                            sBar.style.backgroundImage = "none"
                            sBar.style.backgroundColor = streakBaseColor
                            if (sTrack) {
                                sTrack.style.backgroundColor = hexToRGBA(
                                    streakBaseColor,
                                    0.2
                                )
                                sTrack.style.outline = `1px solid ${hexToRGBA(streakBaseColor, 0.6)}`
                            }
                        }
                        sBar.style.boxShadow = "none"
                        ;(sBar.style as any).webkitFilter = ""
                        sBar.style.filter = ""
                        sBar.style.transform = "scaleY(1)"
                    }
                }
            }

            /* ===== MEJORA 2: Animated finish sequence ===== */
            if (finished) {
                ctx.save()

                finishPhase = clamp(
                    (performance.now() - (finishStamp || performance.now())) /
                        AUTO_MENU_MS,
                    0,
                    1
                )

                // Phase 0.3-0.5: golden flash
                if (finishPhase >= 0.3 && finishPhase < 0.5) {
                    const flashProgress = (finishPhase - 0.3) / 0.2
                    const flashRadius =
                        flashProgress * Math.max(LOGICAL_W, LOGICAL_H)
                    const flashAlpha = 0.3 * (1 - flashProgress)
                    ctx.fillStyle = `rgba(255,215,0,${flashAlpha})`
                    ctx.beginPath()
                    ctx.arc(
                        LOGICAL_W / 2,
                        LOGICAL_H / 2,
                        flashRadius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }

                // Phase 0.5+: overlay fade-in
                if (finishPhase >= 0.5) {
                    const overlayAlpha = Math.min(1, (finishPhase - 0.5) / 0.2)

                    // Viñeta dorada sutil
                    ctx.globalAlpha = overlayAlpha
                    const vg = ctx.createRadialGradient(
                        LOGICAL_W / 2,
                        LOGICAL_H / 2,
                        0,
                        LOGICAL_W / 2,
                        LOGICAL_H / 2,
                        Math.max(LOGICAL_W, LOGICAL_H) / 1.2
                    )
                    vg.addColorStop(0, "rgba(255,215,0,0.18)")
                    vg.addColorStop(0.6, "rgba(255,215,0,0.05)")
                    vg.addColorStop(1, "rgba(255,215,0,0)")
                    ctx.fillStyle = vg
                    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

                    const left = Math.max(
                        0,
                        AUTO_MENU_MS -
                            (performance.now() -
                                (finishStamp || performance.now()))
                    )
                    const secs = Math.max(0, Math.ceil(left / 1000))
                    const isT = LVL.id === 0
                    const title = isT ? "TUTORIAL INTEGRADO" : "RED INTEGRADA"
                    const sub = `Volviendo al menú en ${secs}…`

                    const bw = 480,
                        bh = 140
                    const bx = (LOGICAL_W - bw) / 2
                    const by = (LOGICAL_H - bh) / 2

                    ctx.globalAlpha = overlayAlpha
                    ctx.fillStyle = "rgba(4, 10, 22, 0.82)"
                    ctx.beginPath()
                    const rr = 20
                    ctx.moveTo(bx + rr, by)
                    ctx.lineTo(bx + bw - rr, by)
                    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + rr)
                    ctx.lineTo(bx + bw, by + bh - rr)
                    ctx.quadraticCurveTo(
                        bx + bw,
                        by + bh,
                        bx + bw - rr,
                        by + bh
                    )
                    ctx.lineTo(bx + rr, by + bh)
                    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - rr)
                    ctx.lineTo(bx, by + rr)
                    ctx.quadraticCurveTo(bx, by, bx + rr, by)
                    ctx.closePath()
                    ctx.fill()

                    ctx.strokeStyle = "rgba(255,215,0,0.55)"
                    ctx.lineWidth = 1.5
                    ctx.stroke()

                    ctx.strokeStyle = "rgba(255,215,0,0.8)"
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(bx + 40, by)
                    ctx.lineTo(bx + bw - 40, by)
                    ctx.stroke()

                    ctx.textAlign = "center"
                    ctx.textBaseline = "middle"
                    ctx.font = "700 28px 'Inter', system-ui, sans-serif"
                    ctx.shadowColor = "rgba(255,215,0,0.5)"
                    ctx.shadowBlur = 16
                    ctx.fillStyle = "#FFD700"
                    ctx.fillText(
                        "✦  " + title + "  ✦",
                        LOGICAL_W / 2,
                        by + bh / 2 - 16
                    )
                    ctx.shadowBlur = 0

                    ctx.font = "400 16px 'Inter', system-ui, sans-serif"
                    ctx.fillStyle = "rgba(230,247,239,0.8)"
                    ctx.fillText(sub, LOGICAL_W / 2, by + bh / 2 + 22)
                    ctx.textBaseline = "alphabetic"
                }

                ctx.restore()

                if (!backTimer) {
                    backTimer = window.setTimeout(() => {
                        setMenuOpen(true)
                        /* v2.12 — NO reseteamos levelIndex. Si lo hacemos,
                           canClose pasa a false y el botón ← de la consola
                           saca a Holoteca en lugar de cerrar la consola y
                           volver al juego. Mantener levelIndex preserva el
                           contexto de "vengo de jugar tal membrana". */
                    }, AUTO_MENU_MS)
                }
            }

            ctx.restore()

            /* v2.0 — Snapshot live al ref. El setInterval externo decide si
               propagar a React state. Mutación in-place: cero allocs.
               v2.7 — F3 / F4 sequences + flags showCode/showF3/showF4
               espejo del HUD desktop. */
            const live = liveSnapshotRef.current
            live.energy = energy
            live.streakCount = streakCount
            live.streakColor = streakColor
            live.superReady = superReady
            live.superArmed = superArmed
            live.selected = selected
            live.harmonic = harmonicLeft > 0
            live.codeSeq = codeSeq
            live.codeCursor = codeCursor
            live.codeFull = codeThisRun
            live.duoSeq = duoSeq as unknown as Freq[]
            live.duoCursor = duoCursor
            live.tripleSeq = tripleSeq as unknown as Freq[]
            live.tripleCursor = f4Progress
            live.showCode =
                (!isTutorial || tutorialStep >= 5) &&
                !(codeThisRun && harmonicLeft <= 0)
            live.showF3 = !freqEnabled[3] && (!isTutorial || tutorialStep >= 3)
            live.showF4 = !freqEnabled[4] && freqEnabled[3]
            live.finished = finished
            live.isTutorial = isTutorial
            live.tutorialStep = tutorialStep
            live.nodesLeft = nodes.length
            live.nodesTotal = ordered.list[levelIndex]?.builder().length || 0
            live.levelTitle =
                (ordered.list[levelIndex]?.displayTitle as string) || ""
            live.available[1] = freqEnabled[1]
            live.available[2] = freqEnabled[2]
            live.available[3] = freqEnabled[3]
            live.available[4] = freqEnabled[4]

            raf = requestAnimationFrame(tick)
        }

        const rafId = requestAnimationFrame(tick)
        ;(raf as any) = rafId

        return () => {
            cancelAnimationFrame(raf)
            document.removeEventListener("mousemove", onMove)
            canvas.removeEventListener("click", onClick)
            document.removeEventListener("keydown", onKeyDown)
            backTimer && clearTimeout(backTimer)
            document.removeEventListener("mousemove", showOnMouse)
            document.removeEventListener("mousedown", showOnMouse)
            gameApiRef.current = null
        }
    }, [
        levelIndex,
        travelSpeedBase,
        superTravelMultiplier,
        chordSeconds,
        ordered.list,
        tutorialPostSuperTitle,
        tutorialPostSuperBody,
    ])

    const stars = React.useMemo(
        () => [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
        []
    )

    const hudOverlayStyle: React.CSSProperties = isFullscreen
        ? {
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
          }
        : {
              position: "absolute",
              left: box.left,
              top: box.top,
              width: box.w,
              height: box.h,
              pointerEvents: "none",
          }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background:
                    "radial-gradient(circle at center,#0a001f 0%,#000415 70%,#000 100%)",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    left: box.left,
                    top: box.top,
                    width: box.w,
                    height: box.h,
                    display: "block",
                    pointerEvents: isMobile ? "none" : "auto",
                    touchAction: isMobile ? "none" : "auto",
                }}
            />

            <div
                style={{
                    ...hudOverlayStyle,
                    visibility: isMobile ? "hidden" : "visible",
                }}
            >
                <div
                    id="ndr-top-hud"
                    style={{
                        position: "absolute",
                        left: 16,
                        right: 16,
                        top: 18,
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        gap: 12,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,.8))",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        id="ndr-top-left-t"
                        style={{
                            textAlign: "left",
                            color: "rgba(200,230,255,0.96)",
                            fontFamily: "'Inter', system-ui, monospace",
                            fontSize: 15,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            marginLeft: 140,
                            paddingLeft: 4,
                            textShadow: "0 0 10px rgba(0,0,0,0.9)",
                            letterSpacing: 0.5,
                        }}
                    />
                    <div
                        id="ndr-top-seqs"
                        style={{
                            justifySelf: "center",
                            display: "flex",
                            gap: 20,
                            alignItems: "center",
                        }}
                    />
                    <div />
                </div>

                <div
                    id="ndr-hud-bars"
                    style={{
                        position: "absolute",
                        right: 26,
                        bottom: 12,
                        width: Math.max(
                            260,
                            Math.min(420, Math.floor(box.w * 0.32))
                        ),
                        display: "grid",
                        gap: 10,
                        alignItems: "center",
                        filter: "drop-shadow(0 1px 0 rgba(0,0,0,.6))",
                    }}
                >
                    <div
                        id="ndr-portal-row"
                        style={{
                            display: "none",
                            gridTemplateColumns: "1fr auto",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                height: 10,
                                background: "rgba(255,215,0,0.18)",
                                borderRadius: 6,
                                overflow: "hidden",
                                outline: "1px solid rgba(255,215,0,0.4)",
                            }}
                        >
                            <div
                                id="ndr-bar-portal"
                                style={{
                                    height: "100%",
                                    width: "0%",
                                    background: "#FFD700",
                                    transition: "width 120ms linear",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                color: "#dcdcdc",
                                fontFamily: "monospace",
                                fontSize: 14,
                                letterSpacing: 0.3,
                            }}
                        >
                            <span style={{ opacity: 0.9 }}>Portal</span>{" "}
                            <span
                                id="ndr-bar-portal-t"
                                style={{ color: "#FFD700" }}
                            >
                                0s
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <div
                            id="ndr-bar-streak-track"
                            style={{
                                height: 14,
                                background: "rgba(12, 20, 24, 0.88)",
                                borderRadius: 999,
                                overflow: "hidden",
                                outline: "1px solid rgba(0,194,255,0.45)",
                                boxShadow: "0 0 10px rgba(0,0,0,0.8)",
                            }}
                        >
                            <div
                                id="ndr-bar-streak"
                                style={{
                                    height: "100%",
                                    width: "0%",
                                    background: "#00C2FF",
                                    borderRadius: 999,
                                    transition: "width 140ms ease-out",
                                }}
                            />
                        </div>
                        <div
                            id="ndr-bar-streak-t"
                            style={{
                                color: "#D7FFF0",
                                fontFamily: "monospace",
                                fontSize: 14,
                                letterSpacing: 0.3,
                            }}
                        >
                            Racha 0/3
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <div
                            id="ndr-bar-energy-p"
                            style={{
                                color: "#cfe8ff",
                                width: 42,
                                textAlign: "right",
                                fontFamily: "monospace",
                                fontSize: 14,
                            }}
                        >
                            100%
                        </div>
                        <div
                            style={{
                                height: 12,
                                background: "rgba(120,200,255,0.18)",
                                borderRadius: 6,
                                overflow: "hidden",
                                outline: "1px solid rgba(120,200,255,0.38)",
                            }}
                        >
                            <div
                                id="ndr-bar-energy"
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    background: "#7EC8FF",
                                    transition: "width 120ms ease",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {!isMobile && (
                <LegendBar uiAvailable={uiAvailable} uiHarmonic={uiHarmonic} />
            )}

            <style>
                {`
        body.nd-hide-cursor-in-console { cursor: none !important; }
        @keyframes sjPulse {
          0% { box-shadow: 0 0 0 0 rgba(80, 255, 210, 0.0); }
          50% { box-shadow: 0 0 18px 0 rgba(80, 255, 210, 0.7); }
          100% { box-shadow: 0 0 0 0 rgba(80, 255, 210, 0.0); }
        }
        `}
            </style>

            {!isMobile && (
                <div style={controlsStyle}>
                    1–4 frecuencia · SPACE integra · S Super Jump · R reinicia ·
                    M menú · A + Arrows ajusta
                </div>
            )}

            {isMobile && levelIndex !== null && !menuOpen && (
                <MobileTouchControls
                    api={gameApiRef.current}
                    snapshot={snapshot}
                    orientation={orientation}
                    /* v2.23 — Re-disparar la pista de rotación cada
                       vez que el Tripulante entra en una membrana
                       distinta. levelIndex sirve como key estable. */
                    levelKey={levelIndex}
                    onBack={() => {
                        /* v2.5 — VOLVER abre la consola del simulador para
                           que el Tripulante elija otra membrana. Volver al
                           grid de la Holoteca se hace cerrando la consola
                           (X arriba a la derecha) — flujo análogo a Ajustes
                           de iOS: cada toque sube un nivel. */
                        setMenuOpen(true)
                        try {
                            onMenuStateChange?.(true)
                        } catch {}
                    }}
                    onTutorial={() => {
                        try {
                            localStorage.removeItem(MOBILE_TUTORIAL_KEY)
                        } catch {}
                        setShowMobileTutorial(true)
                    }}
                />
            )}

            {isMobile && showMobileTutorial && (
                <MobileTutorial onDone={() => setShowMobileTutorial(false)} />
            )}

            {/* v2.19 — RotateHintOverlay removido por decisión de Zak:
                el portrait se experimenta cómodo y "se ve muy bien"
                — insistir con un overlay flotante quita más de lo que
                aporta. El Tripulante puede rotar el celular cuando
                quiera y el juego se adapta automáticamente al
                landscape (todos los listeners de orientationchange
                siguen activos para reacomodar el layout). */}

            {menuOpen &&
                (isMobile ? (
                    <MobileLevelConsole
                        key={menuNonce}
                        title={menuTitle}
                        description={menuDescription}
                        stars={stars}
                        ordered={ordered}
                        progressionLocked={progressionLocked}
                        sfxEnabled={sfxEnabled}
                        titleImage={consoleTitleImage}
                        onPick={(idx) => {
                            /* v2.10 — Gate Sintonía: libres = Tutorial (id 0) +
                               primera membrana visible (displayIndex 1). */
                            const lvl = ordered.list[idx]
                            const isTutorial = lvl?.id === 0
                            const isFirstMembrane = lvl?.displayIndex === 1
                            if (
                                !isTutorial &&
                                !isFirstMembrane &&
                                !hasMembresia
                            ) {
                                setGateOpen(true)
                                return
                            }
                            /* v2.16 — Gesture-driven immersive landscape.
                               Fire-and-forget; no bloqueamos el setState
                               por si el browser tarda en resolver fs. */
                            enterImmersiveLandscape().catch(() => {})
                            setRotateHintDismissed(false)
                            setLevelIndex(idx)
                            closeMenuFromSelection()
                        }}
                        onPickTutorial={() => {
                            const idx = ordered.list.findIndex(
                                (L) => L.id === 0
                            )
                            enterImmersiveLandscape().catch(() => {})
                            setRotateHintDismissed(false)
                            setLevelIndex(idx >= 0 ? idx : 0)
                            closeMenuFromSelection()
                        }}
                        canClose={levelIndex !== null}
                        /* v2.8 — onClose cierra la consola (vuelve al
                           juego activo). onExit sale a la Holoteca. La
                           consola decide cuál usar según canClose. */
                        onClose={() => {
                            setMenuOpen(false)
                            try {
                                onMenuStateChange?.(false)
                            } catch {}
                        }}
                        onExit={() => {
                            if (onExit) onExit()
                            else setMenuOpen(false)
                        }}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <LevelConsole
                        key={menuNonce}
                        titleImage={consoleTitleImage}
                        titleImageHeight={consoleTitleImageHeight}
                        titleImageTopOffset={consoleTitleTopOffset}
                        title={menuTitle}
                        description={menuDescription}
                        rewardText={rewardText}
                        rewardFontSize={rewardFontSize}
                        stars={stars}
                        starsLegend={
                            "Las estrellas representan la presencia requerida por membrana."
                        }
                        ordered={ordered}
                        progressionLocked={progressionLocked}
                        sfxEnabled={sfxEnabled}
                        onPick={(idx) => {
                            /* v2.10 — Gate Sintonía: libres = Tutorial (id 0) +
                               primera membrana visible (displayIndex 1). */
                            const lvl = ordered.list[idx]
                            const isTutorial = lvl?.id === 0
                            const isFirstMembrane = lvl?.displayIndex === 1
                            if (
                                !isTutorial &&
                                !isFirstMembrane &&
                                !hasMembresia
                            ) {
                                setGateOpen(true)
                                return
                            }
                            setLevelIndex(idx)
                            closeMenuFromSelection()
                        }}
                        onPickTutorial={() => {
                            const idx = ordered.list.findIndex(
                                (L) => L.id === 0
                            )
                            setLevelIndex(idx >= 0 ? idx : 0)
                            closeMenuFromSelection()
                        }}
                        canClose={levelIndex !== null}
                        onClose={() => {
                            if (onExit) onExit()
                            else setMenuOpen(false)
                        }}
                        isAdmin={isAdmin}
                    />
                ))}
            {/* v2.10 — Compuerta Sintonía Solar para Membrana 2+ con copy
                específico de Navegantes (kind="navegantes"). */}
            {gateOpen && (
                <FreemiumGateModal
                    kind="navegantes"
                    onClose={() => setGateOpen(false)}
                />
            )}
            {/* v2.12 — Invitación suave a crear cuenta tras Membrana 1
                cumplida (solo si no hay sesión activa). */}
            {authPromptOpen && (
                <GuardaTuTrayectoriaModal
                    onClose={() => setAuthPromptOpen(false)}
                />
            )}
        </div>
    )
}

/* =========================================================
   HUD inferior (leyenda de frecuencias)
========================================================= */

function LegendBar({
    uiAvailable,
    uiHarmonic,
}: {
    uiAvailable: Record<Freq, boolean>
    uiHarmonic: boolean
}) {
    return (
        <div
            style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 14,
                alignItems: "center",
                pointerEvents: "none",
            }}
        >
            {[1, 2, 3, 4].map((ff) => {
                const f = ff as Freq
                const enabled = uiHarmonic || uiAvailable[f]
                const color = FREQS[f].color
                return (
                    <div
                        key={f}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            opacity: enabled ? 1 : 0.35,
                            filter: enabled ? "none" : "grayscale(0.6)",
                        }}
                    >
                        <span
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: color,
                                boxShadow: enabled
                                    ? `0 0 10px ${hexToRGBA(color, 0.8)}`
                                    : "none",
                            }}
                        />
                        <span
                            style={{
                                color: "#fff",
                                fontFamily: "monospace",
                                fontSize: 12,
                            }}
                        >
                            {f}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

/* =========================================================
   Estilos reutilizados
========================================================= */

const topBtnStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 12,
    cursor: "pointer",
}

const controlsStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 12,
    left: 12,
    color: "#fff",
    fontFamily: "'Inter', system-ui, monospace",
    fontWeight: 300,
    letterSpacing: "0.04em",
    fontSize: 12,
    opacity: 0.85,
    pointerEvents: "none",
}

function CircleChip({ f, size = 10 }: { f: Freq; size?: number }) {
    return (
        <span
            style={{
                display: "inline-block",
                width: size,
                height: size,
                borderRadius: "50%",
                background: FREQS[f].color,
                boxShadow: `0 0 8px ${hexToRGBA(FREQS[f].color, 0.8)}`,
                verticalAlign: "-2px",
            }}
        />
    )
}

function StarRow({
    count,
    max = 5,
    size = 14,
}: {
    count: number
    max?: number
    size?: number
}) {
    const stars = Array.from({ length: max }, (_, i) => i < count)
    return (
        <div style={{ display: "flex", gap: 4, pointerEvents: "none" }}>
            {stars.map((on, i) => (
                <span
                    key={i}
                    style={{
                        color: on ? "#FFD700" : "rgba(255,255,255,0.22)",
                        textShadow: on
                            ? "0 0 8px rgba(255,215,0,0.55)"
                            : "none",
                        fontSize: size,
                        lineHeight: 1,
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    )
}

/* =========================================================
   Completion Badge SVG — premium level completion emblem
========================================================= */

function CompletionBadge({
    golden = false,
    size = 42,
}: {
    golden?: boolean
    size?: number
}) {
    const mainColor = golden ? "#FFD700" : "#4FD0FF"
    const glowColor = golden ? "rgba(255,215,0,0.6)" : "rgba(79,208,255,0.5)"
    const innerColor = golden ? "rgba(255,215,0,0.2)" : "rgba(79,208,255,0.15)"
    const id = golden ? "cb-gold" : "cb-cyan"

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
        >
            <defs>
                <radialGradient id={`${id}-bg`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={innerColor} />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>
            {/* Outer hexagonal ring */}
            <polygon
                points="24,3 42.5,13.5 42.5,34.5 24,45 5.5,34.5 5.5,13.5"
                stroke={mainColor}
                strokeWidth="1.2"
                fill="none"
                opacity="0.5"
            />
            {/* Inner hexagonal ring */}
            <polygon
                points="24,8 38,16 38,32 24,40 10,32 10,16"
                stroke={mainColor}
                strokeWidth="0.8"
                fill={`url(#${id}-bg)`}
                opacity="0.7"
            />
            {/* Diamond accent top */}
            <polygon
                points="24,11 28,18 24,25 20,18"
                fill={mainColor}
                opacity="0.35"
            />
            {/* Central circle */}
            <circle
                cx="24"
                cy="22"
                r="5.5"
                stroke={mainColor}
                strokeWidth="1.4"
                fill="none"
                opacity="0.9"
            />
            {/* Inner dot */}
            <circle cx="24" cy="22" r="2" fill={mainColor} opacity="0.95" />
            {/* Check / completion stroke */}
            <polyline
                points="19.5,22 22.5,25 28.5,19"
                stroke={mainColor}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.95"
            />
            {/* Bottom accent lines */}
            <line
                x1="17"
                y1="33"
                x2="31"
                y2="33"
                stroke={mainColor}
                strokeWidth="0.7"
                opacity="0.4"
            />
            <line
                x1="20"
                y1="35.5"
                x2="28"
                y2="35.5"
                stroke={mainColor}
                strokeWidth="0.5"
                opacity="0.3"
            />
        </svg>
    )
}

/* =========================================================
   Consola (menú)
========================================================= */

function LevelConsole({
    title,
    description,
    rewardText,
    rewardFontSize,
    stars,
    starsLegend,
    ordered,
    progressionLocked,
    onPick,
    onPickTutorial,
    canClose,
    onClose,
    sfxEnabled,
    titleImage,
    titleImageHeight,
    titleImageTopOffset,
    isAdmin,
}: {
    title: string
    description: string
    rewardText: string
    rewardFontSize: number
    stars: number[]
    starsLegend: string
    ordered: {
        list: any[]
        idByDisp: Map<number, number>
        dispById: Map<number, number>
    }
    progressionLocked: boolean
    onPick: (index: number) => void
    onPickTutorial: () => void
    canClose: boolean
    onClose: () => void
    sfxEnabled?: boolean
    titleImage?: string
    titleImageHeight?: number
    titleImageTopOffset?: number
    isAdmin?: boolean
}) {
    const [data, setData] = React.useState<
        Record<
            number,
            {
                completed?: boolean
                preview?: string
                chord?: boolean
                timeMs?: number
            }
        >
    >(readProgressFromStorage)

    React.useEffect(() => {
        const reload = () => {
            try {
                setData(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"))
            } catch {}
        }
        reload()
        /* v2.11 — Recargar al hidratar desde Supabase. */
        window.addEventListener("ndr-progress-hydrated", reload)
        return () => window.removeEventListener("ndr-progress-hydrated", reload)
    }, [])

    const [page, setPage] = React.useState<1 | 2>(1)

    const acRef = React.useRef<AudioContext | null>(null)
    const ensureAC = React.useCallback(() => {
        if (!sfxEnabled) return null
        if (!acRef.current) {
            const AC: any =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (!AC) return null
            acRef.current = new AC()
        }
        return acRef.current
    }, [sfxEnabled])

    const sfxHover = React.useCallback(() => {
        if (!sfxEnabled) return
        const ac = ensureAC()
        if (!ac) return
        const o = ac.createOscillator(),
            g = ac.createGain()
        o.type = "sine"
        o.frequency.value = 640
        g.gain.value = 0.06
        o.connect(g)
        g.connect(ac.destination)
        o.start()
        o.stop(ac.currentTime + 0.05)
    }, [ensureAC, sfxEnabled])

    const sfxSelect = React.useCallback(() => {
        if (!sfxEnabled) return
        const ac = ensureAC()
        if (!ac) return
        const o = ac.createOscillator(),
            g = ac.createGain()
        o.type = "triangle"
        o.frequency.value = 880
        g.gain.value = 0.11
        o.connect(g)
        g.connect(ac.destination)
        o.start()
        o.stop(ac.currentTime + 0.08)
    }, [ensureAC, sfxEnabled])

    const hoverTimerRef = React.useRef<number | null>(null)
    const playUi = React.useCallback(
        (which: "hover" | "select") => {
            if (!sfxEnabled) return
            if (which === "hover") sfxHover()
            else sfxSelect()
        },
        [sfxEnabled, sfxHover, sfxSelect]
    )

    const tutorialCompleted =
        data[0]?.completed === true || typeof data[0]?.timeMs === "number"

    const TutorialButton: React.FC<{
        onClick: () => void
        playUi: (w: "hover" | "select") => void
    }> = ({ onClick, playUi }) => {
        return (
            <>
                <button
                    type="button"
                    className="lc-tutorial"
                    style={
                        {
                            top: 18,
                            left: 22,
                            opacity: tutorialCompleted ? 0.3 : 1,
                        } as React.CSSProperties
                    }
                    onMouseEnter={() => playUi("hover")}
                    onFocus={() => playUi("hover")}
                    onClick={() => {
                        playUi("select")
                        onClick()
                    }}
                >
                    ▸ TUTORIAL
                </button>
                <style jsx>{`
          .lc-tutorial {
            position: absolute; z-index: 3; padding: 10px 16px;
            border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.22);
            color: #d8f6ff; font-family: monospace; letter-spacing: 0.6px;
            font-size: 14px; cursor: pointer;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01)),
                        radial-gradient(120% 100% at 50% 0%, rgba(84, 255, 248, 0.08), rgba(16, 32, 64, 0));
            backdrop-filter: blur(2px);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset, 0 4px 18px rgba(50, 255, 190, 0.12);
            outline: none;
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-position 240ms ease, opacity 200ms ease;
          }
          .lc-tutorial::before {
            content: ""; position: absolute; inset: 0; border-radius: inherit;
            background-image: linear-gradient(120deg, rgba(255, 255, 255, 0.18), transparent 40%, transparent 60%, rgba(255, 255, 255, 0.12)),
                              url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"><path d="M0 30 L60 30"/><path d="M30 0 L30 60"/></g></svg>');
            opacity: 0; transition: opacity 180ms ease; pointer-events: none;
          }
          .lc-tutorial:hover, .lc-tutorial:focus-visible {
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.45);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset, 0 10px 28px rgba(50, 255, 210, 0.22), 0 0 24px rgba(37, 255, 180, 0.18);
            opacity: 1;
          }
          .lc-tutorial:hover::before, .lc-tutorial:focus-visible::before { opacity: 0.6; }
          .lc-tutorial:active { transform: translateY(0); }
        `}</style>
            </>
        )
    }

    const allCleared = ordered.list.every(
        (L) =>
            data[L.id]?.completed === true ||
            typeof data[L.id]?.timeMs === "number"
    )
    const allCodes = ordered.list
        .filter((L) => L.id !== 0)
        .every((L) => !!data[L.id]?.chord)
    const showReward = allCleared && allCodes

    const rewardDisplay = (rewardText || "").replace(/\\n/g, "\n")
    const legendDisplay = (starsLegend || "").replace(/\\n/g, "\n")

    const handleReset = React.useCallback(() => {
        const ok = window.confirm(
            "¿Seguro que quieres borrar todos los avances y logros? Esta acción no se puede deshacer."
        )
        if (!ok) return
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
        /* v2.11 — Reset también en Supabase (fire-and-forget). */
        try {
            const url = (window as any).__ndrSbUrl as string | undefined
            const key = (window as any).__ndrSbKey as string | undefined
            const cid = (window as any).Clerk?.user?.id
            if (url && key && cid) {
                void gatewayUserAction(url, key, "clear_navegante_progress", {})
            }
        } catch {}
        setData({})
    }, [])

    const isUnlockedByDisplay = (disp: number) => {
        if (!progressionLocked || disp === 0) return true
        if (disp === 1) return true
        const prevId = ordered.idByDisp.get(disp - 1)!
        return (
            data[prevId]?.completed === true ||
            typeof data[prevId]?.timeMs === "number"
        )
    }

    const visible = React.useMemo(
        () =>
            ordered.list
                .filter((L) => L.id !== 0)
                .filter((L) =>
                    page === 1
                        ? L.displayIndex >= 1 && L.displayIndex <= 10
                        : L.displayIndex >= 11 && L.displayIndex <= 20
                )
                .map((L) => ({
                    L,
                    disp: L.displayIndex,
                    rec: data[L.id] || {},
                    codeSeq: CODE_BY_LEVEL[L.id] || [1, 3, 4],
                    completed:
                        (data[L.id]?.completed === true ||
                            typeof data[L.id]?.timeMs === "number") ??
                        false,
                    unlocked: isUnlockedByDisplay(L.displayIndex),
                    starCount: stars[L.displayIndex] ?? 3,
                })),
        [ordered.list, page, data, stars]
    )

    const [sel, setSel] = React.useState(0)
    React.useEffect(() => {
        const first = Math.max(
            0,
            visible.findIndex((v) => v.unlocked) !== -1
                ? visible.findIndex((v) => v.unlocked)
                : 0
        )
        setSel(first)
    }, [page, visible.length])

    const scheduleHover = React.useCallback(
        (index: number, unlocked: boolean) => {
            if (!unlocked) return
            if (hoverTimerRef.current !== null) {
                window.clearTimeout(hoverTimerRef.current)
                hoverTimerRef.current = null
            }
            hoverTimerRef.current = window.setTimeout(() => {
                setSel(index)
                sfxHover()
                hoverTimerRef.current = null
            }, 100)
        },
        [sfxHover, setSel]
    )

    const cancelHover = React.useCallback(() => {
        if (hoverTimerRef.current !== null) {
            window.clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = null
        }
    }, [])

    const gridRef = React.useRef<HTMLDivElement>(null)
    const [cols, setCols] = React.useState(5)
    React.useLayoutEffect(() => {
        const recompute = () => {
            const el = gridRef.current
            if (!el) return
            const w = el.clientWidth || 1,
                min = 180,
                gap = 18
            const c = Math.max(1, Math.floor((w + gap) / (min + gap)))
            setCols(c)
        }
        recompute()
        const ro = new ResizeObserver(recompute)
        if (gridRef.current) ro.observe(gridRef.current)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => {
        const rootClass = "nd-hide-cursor-in-console"
        const hide = () => document.body.classList.add(rootClass)
        const show = () => document.body.classList.remove(rootClass)
        let timer: number | undefined
        const onKey = (e: KeyboardEvent) => {
            if (
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown" ||
                e.key === "Enter"
            ) {
                hide()
            }
        }
        const onPointer = () => {
            show()
            clearTimeout(timer)
            timer = window.setTimeout(hide, 1600)
        }
        hide()
        document.addEventListener("keydown", onKey)
        document.addEventListener("mousemove", onPointer, {
            passive: true,
        } as any)
        document.addEventListener("mousedown", onPointer)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("mousemove", onPointer as any)
            document.removeEventListener("mousedown", onPointer)
            show()
        }
    }, [])

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === "INPUT" || tag === "TEXTAREA" || (e as any).isComposing)
                return
            if (
                e.key === "ArrowRight" ||
                e.key === "ArrowLeft" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown"
            ) {
                e.preventDefault()
                let next = sel
                if (e.key === "ArrowRight")
                    next = Math.min(sel + 1, visible.length - 1)
                if (e.key === "ArrowLeft") next = Math.max(sel - 1, 0)
                if (e.key === "ArrowUp") next = Math.max(sel - cols, 0)
                if (e.key === "ArrowDown")
                    next = Math.min(sel + cols, visible.length - 1)
                if (
                    e.key === "ArrowRight" &&
                    sel === visible.length - 1 &&
                    page === 1
                ) {
                    setPage(2)
                    setSel(0)
                    sfxHover()
                    return
                }
                if (e.key === "ArrowLeft" && sel === 0 && page === 2) {
                    setPage(1)
                    setSel(0)
                    sfxHover()
                    return
                }
                if (next !== sel) {
                    setSel(next)
                    sfxHover()
                }
            } else if (e.key === "Enter") {
                e.preventDefault()
                const v = visible[sel]
                if (v?.unlocked) {
                    sfxSelect()
                    const idx = ordered.list.findIndex((x) => x.id === v.L.id)
                    onPick(idx)
                }
            }
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [sel, visible, cols, page, ordered.list, onPick, sfxHover, sfxSelect])

    const wheelGuard = React.useRef(0)
    const onWheel = React.useCallback(
        (e: React.WheelEvent) => {
            const now = performance.now()
            if (now - wheelGuard.current < 400) return
            const dx = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : 0
            if (dx > 30 && page === 1) {
                setPage(2)
                setSel(0)
                wheelGuard.current = now
                sfxHover()
            } else if (dx < -30 && page === 2) {
                setPage(1)
                setSel(0)
                wheelGuard.current = now
                sfxHover()
            }
        },
        [page, sfxHover]
    )

    const pageLabel = page === 1 ? "Membranas 1–10" : "Membranas 11–20"

    return (
        <div
            onWheel={onWheel}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                zIndex: 5,
            }}
        >
            <div
                style={{
                    width: "60vw",
                    height: "72vh",
                    maxWidth: 1100,
                    maxHeight: 820,
                    borderRadius: 20,
                    padding: 24,
                    background: "#0c1220",
                    border: "2px solid #3CFF7B55",
                    boxShadow:
                        "0 0 40px rgba(0,194,255,0.35), 0 0 120px rgba(0,194,255,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                {/* v2.12 — RESET solo visible para admins. */}
                {isAdmin && (
                    <button
                        onClick={handleReset}
                        style={{
                            position: "absolute",
                            right: 20,
                            top: 20,
                            zIndex: 1,
                            padding: "6px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,120,120,0.6)",
                            background:
                                "linear-gradient(180deg, rgba(60,0,0,0.55), rgba(60,0,0,0.35))",
                            color: "#FFD8D8",
                            fontFamily: "monospace",
                            fontSize: 11,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: "0 0 10px rgba(255,80,80,0.25)",
                        }}
                        title="Borrar todos los avances y logros (admin)"
                    >
                        Reset · admin
                    </button>
                )}

                <div
                    style={{
                        display: "grid",
                        justifyItems: "center",
                        gap: 10,
                        paddingTop: titleImageTopOffset ?? 24,
                    }}
                >
                    {titleImage ? (
                        <img
                            src={titleImage}
                            alt="Navegante de la Red"
                            style={{
                                height: titleImageHeight ?? 72,
                                width: "auto",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#DFFFF0",
                                fontWeight: 800,
                                fontSize: 34,
                            }}
                        >
                            {title}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        marginTop: 6,
                        marginBottom: 14,
                        gap: 12,
                    }}
                >
                    <div />
                    <TutorialButton onClick={onPickTutorial} playUi={playUi} />
                    <div
                        style={{
                            gridColumn: "3 / 4",
                            justifySelf: "end",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                color: "#9fe9c5",
                                fontFamily: "monospace",
                                fontSize: 12,
                            }}
                        >
                            {pageLabel}
                        </span>
                        <button
                            onClick={() => {
                                setPage(1)
                                setSel(0)
                                sfxHover()
                            }}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border:
                                    page === 1
                                        ? "1px solid rgba(120,200,255,0.8)"
                                        : "1px solid rgba(255,255,255,0.25)",
                                background:
                                    page === 1
                                        ? "linear-gradient(180deg, rgba(25,45,80,0.6), rgba(20,35,65,0.5))"
                                        : "linear-gradient(180deg, rgba(15,25,40,0.4), rgba(10,20,30,0.3))",
                                color: "#CFEAFF",
                                fontFamily: "monospace",
                                fontSize: 12,
                                cursor: "pointer",
                                transition:
                                    "transform 180ms ease, box-shadow 180ms ease",
                            }}
                        >
                            1–10
                        </button>
                        <button
                            onClick={() => {
                                setPage(2)
                                setSel(0)
                                sfxHover()
                            }}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border:
                                    page === 2
                                        ? "1px solid rgba(255,215,0,0.8)"
                                        : "1px solid rgba(255,255,255,0.25)",
                                background:
                                    page === 2
                                        ? "linear-gradient(180deg, rgba(65,45,10,0.9), rgba(40,28,8,0.85))"
                                        : "linear-gradient(180deg, rgba(15,25,40,0.4), rgba(10,20,30,0.3))",
                                color: "#FFE9A6",
                                fontFamily: "monospace",
                                fontSize: 12,
                                cursor: "pointer",
                                transition:
                                    "transform 180ms ease, box-shadow 180ms ease",
                            }}
                        >
                            11–20
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        color: "#A8DEC5",
                        fontSize: 14,
                        marginTop: 2,
                        marginBottom: 14,
                    }}
                >
                    {description}
                </div>

                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        ref={gridRef}
                        style={{
                            width: "100%",
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 18,
                        }}
                    >
                        {visible.map((v, idx) => {
                            const {
                                L,
                                disp,
                                rec,
                                completed,
                                unlocked,
                                starCount,
                            } = v
                            const isYellowTheme = disp > 10
                            const baseBorder = unlocked
                                ? completed
                                    ? "2px solid rgba(255,215,0,0.8)"
                                    : isYellowTheme
                                      ? "1px solid rgba(255,215,0,0.5)"
                                      : "1px solid rgba(0,194,255,0.35)"
                                : "1px solid rgba(180,190,205,0.25)"
                            const baseGlow = unlocked
                                ? completed
                                    ? "inset 0 0 40px rgba(255,215,0,0.20), 0 0 24px rgba(255,215,0,0.35)"
                                    : isYellowTheme
                                      ? "inset 0 0 40px rgba(255,215,0,0.10), 0 0 16px rgba(255,215,0,0.25)"
                                      : "inset 0 0 40px rgba(0,194,255,0.10), 0 0 16px rgba(0,194,255,0.25)"
                                : "inset 0 0 30px rgba(180,190,205,0.08)"
                            const baseBg = isYellowTheme
                                ? "linear-gradient(135deg,#262006,#3a3009)"
                                : "linear-gradient(135deg,#0f1d33,#13223d)"
                            const selected = idx === sel
                            const styleLocked: React.CSSProperties = unlocked
                                ? {}
                                : {
                                      opacity: 0.5,
                                      filter: "grayscale(0.6) saturate(0.6)",
                                      cursor: "not-allowed",
                                  }

                            return (
                                <button
                                    key={`${L.id}-${disp}`}
                                    onClick={() => {
                                        if (!unlocked) return
                                        sfxSelect()
                                        const index = ordered.list.findIndex(
                                            (x) => x.id === L.id
                                        )
                                        onPick(index)
                                    }}
                                    disabled={!unlocked}
                                    onMouseEnter={() =>
                                        scheduleHover(idx, unlocked)
                                    }
                                    onMouseLeave={cancelHover}
                                    style={{
                                        aspectRatio: "1 / 1",
                                        borderRadius: 18,
                                        position: "relative",
                                        border: baseBorder,
                                        background: baseBg,
                                        boxShadow: baseGlow,
                                        color: "#CFFFEA",
                                        cursor: unlocked
                                            ? "pointer"
                                            : "not-allowed",
                                        overflow: "hidden",
                                        display: "grid",
                                        gridTemplateRows: "auto 1fr auto",
                                        placeItems: "center",
                                        paddingBottom: 8,
                                        transform:
                                            selected && unlocked
                                                ? "scale(1.08)"
                                                : "scale(1)",
                                        transition:
                                            "transform 240ms ease, box-shadow 160ms ease, border 160ms ease",
                                        ...(unlocked ? {} : styleLocked),
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            left: 0,
                                            right: 0,
                                            display: "flex",
                                            justifyContent: "center",
                                            pointerEvents: "none",
                                            filter: unlocked
                                                ? "none"
                                                : "grayscale(1) brightness(0.8)",
                                        }}
                                    >
                                        <StarRow
                                            count={Math.max(
                                                1,
                                                Math.min(
                                                    5,
                                                    Math.round(starCount)
                                                )
                                            )}
                                            size={14}
                                        />
                                    </div>

                                    {rec.preview && (
                                        <img
                                            src={rec.preview}
                                            alt=""
                                            style={{
                                                position: "absolute",
                                                inset: 12,
                                                width: "calc(100% - 24px)",
                                                height: "calc(100% - 24px)",
                                                objectFit: "contain",
                                                opacity: unlocked ? 0.95 : 0.5,
                                                mixBlendMode: "screen",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}

                                    <div
                                        style={{
                                            zIndex: 1,
                                            fontWeight: 800,
                                            fontSize: 18,
                                            marginTop: 28,
                                            filter: unlocked
                                                ? "none"
                                                : "blur(1.8px)",
                                            color: isYellowTheme
                                                ? "#FFE57A"
                                                : undefined,
                                        }}
                                    >
                                        {`Membrana ${disp}`}
                                    </div>

                                    <div style={{ zIndex: 1 }} />

                                    {/* Completion badge SVG */}
                                    {completed && unlocked && (
                                        <div
                                            style={{
                                                zIndex: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginBottom: 10,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <CompletionBadge
                                                golden={!!rec.chord}
                                                size={42}
                                            />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: 12,
                        color: "#9fe9c5",
                        fontSize: 12,
                        whiteSpace: "pre-line",
                    }}
                >
                    {legendDisplay ||
                        "Las estrellas representan la presencia requerida por membrana."}
                </div>
                <div
                    style={{
                        textAlign: "center",
                        marginTop: 12,
                        color: "#8ad9b1",
                        fontSize: 12,
                    }}
                >
                    Reinicia con <b>R</b>.
                </div>
            </div>
        </div>
    )
}

/* =========================================================
   v2.0 — Stack móvil completo del [LENTE]
   Joystick virtual · Botón de fuego thumb-friendly · Paleta
   de frecuencia · Super pulse · HUD superior · Tutorial
   gestual · Consola portrait.
========================================================= */

const MOBILE_TUTORIAL_KEY = "ndr_mobile_tutorial_v1"

function vibrate(ms: number) {
    try {
        if (typeof navigator !== "undefined" && navigator.vibrate)
            navigator.vibrate(ms)
    } catch {}
}

/* ── Joystick virtual ─────────────────────────────────── */

function MobileVirtualJoystick({
    onAim,
    onAimEnd,
    accent = "#00C2FF",
}: {
    onAim: (angle: number, magnitude: number) => void
    onAimEnd?: () => void
    accent?: string
}) {
    const baseRef = React.useRef<HTMLDivElement>(null)
    const [stickPos, setStickPos] = React.useState({ x: 0, y: 0 })
    const [active, setActive] = React.useState(false)
    const dragRef = React.useRef<{ id: number | null }>({ id: null })

    const RADIUS = 56

    const handleMove = React.useCallback(
        (clientX: number, clientY: number) => {
            const el = baseRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            let dx = clientX - cx
            let dy = clientY - cy
            const dist = Math.hypot(dx, dy)
            if (dist > RADIUS) {
                dx = (dx / dist) * RADIUS
                dy = (dy / dist) * RADIUS
            }
            setStickPos({ x: dx, y: dy })
            if (dist > 6) {
                onAim(Math.atan2(dy, dx), Math.min(1, dist / RADIUS))
            }
        },
        [onAim]
    )

    const onPointerDown = (e: React.PointerEvent) => {
        if (dragRef.current.id !== null) return
        e.preventDefault()
        dragRef.current.id = e.pointerId
        try {
            ;(e.target as Element).setPointerCapture(e.pointerId)
        } catch {}
        setActive(true)
        vibrate(8)
        handleMove(e.clientX, e.clientY)
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (dragRef.current.id !== e.pointerId) return
        handleMove(e.clientX, e.clientY)
    }
    const onPointerUp = (e: React.PointerEvent) => {
        if (dragRef.current.id !== e.pointerId) return
        dragRef.current.id = null
        setActive(false)
        setStickPos({ x: 0, y: 0 })
        try {
            ;(e.target as Element).releasePointerCapture(e.pointerId)
        } catch {}
        if (onAimEnd) onAimEnd()
    }

    /* v2.6 — Joystick más compacto (118 vs 140) para que no compita con
       los controles de la derecha. Stick interno proporcional. */
    const BASE = 118
    const STICK = 50
    const PAD = BASE / 2 - 6
    return (
        <div
            ref={baseRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
                position: "absolute",
                left: 18,
                bottom: 22,
                width: BASE,
                height: BASE,
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${hexToRGBA(accent, 0.16)} 0%, ${hexToRGBA(accent, 0.06)} 60%, ${hexToRGBA(accent, 0.02)} 100%)`,
                border: `1px solid ${hexToRGBA(accent, active ? 0.7 : 0.35)}`,
                boxShadow: active
                    ? `0 0 28px ${hexToRGBA(accent, 0.5)}, inset 0 0 24px ${hexToRGBA(accent, 0.25)}`
                    : `inset 0 0 18px ${hexToRGBA(accent, 0.1)}`,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "auto",
                zIndex: 12,
                transition: "box-shadow 180ms ease",
            }}
        >
            {/* Cardinal hint dots */}
            {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: `calc(50% + ${Math.cos(a) * PAD}px - 2px)`,
                        top: `calc(50% + ${Math.sin(a) * PAD}px - 2px)`,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: hexToRGBA(accent, 0.4),
                        pointerEvents: "none",
                    }}
                />
            ))}
            {/* Inner stick */}
            <div
                style={{
                    position: "absolute",
                    left: `calc(50% + ${stickPos.x}px - ${STICK / 2}px)`,
                    top: `calc(50% + ${stickPos.y}px - ${STICK / 2}px)`,
                    width: STICK,
                    height: STICK,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, ${hexToRGBA(accent, active ? 0.95 : 0.7)} 0%, ${hexToRGBA(accent, active ? 0.4 : 0.25)} 60%, ${hexToRGBA(accent, 0.05)} 100%)`,
                    border: `1.5px solid ${hexToRGBA(accent, 0.85)}`,
                    boxShadow: active
                        ? `0 4px 18px ${hexToRGBA(accent, 0.7)}`
                        : `0 2px 10px ${hexToRGBA(accent, 0.35)}`,
                    transition: active
                        ? "none"
                        : "left 220ms cubic-bezier(0.34,1.56,0.64,1), top 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

/* ── Botón de fuego ───────────────────────────────────── */

function MobileFireButton({
    onFire,
    superArmed,
    accent = "#00C2FF",
    selectedColor,
}: {
    onFire: () => void
    superArmed: boolean
    accent?: string
    selectedColor: string
}) {
    const [pressed, setPressed] = React.useState(false)
    const [ripple, setRipple] = React.useState(0)
    const onPointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        setPressed(true)
        setRipple((r) => r + 1)
        vibrate(superArmed ? 18 : 8)
        onFire()
        try {
            ;(e.target as Element).setPointerCapture(e.pointerId)
        } catch {}
    }
    const onPointerUp = () => setPressed(false)
    const ringColor = superArmed ? "#FFD700" : selectedColor || accent
    return (
        <div
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
                /* v2.20 — Respeta env(safe-area-inset-right) para
                   evitar que la cámara del iPhone landscape (notch
                   lateral) tape el botón. En portrait inset = 0 → se
                   comporta igual que antes. */
                position: "absolute",
                right: "calc(env(safe-area-inset-right, 0px) + 18px)",
                bottom: 22,
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${hexToRGBA(ringColor, 0.55)} 0%, ${hexToRGBA(ringColor, 0.25)} 50%, ${hexToRGBA(ringColor, 0.08)} 100%)`,
                border: `2px solid ${hexToRGBA(ringColor, superArmed ? 0.95 : 0.7)}`,
                boxShadow: superArmed
                    ? `0 0 38px ${hexToRGBA(ringColor, 0.7)}, inset 0 0 24px ${hexToRGBA(ringColor, 0.35)}`
                    : pressed
                      ? `0 0 24px ${hexToRGBA(ringColor, 0.6)}, inset 0 0 18px ${hexToRGBA(ringColor, 0.3)}`
                      : `0 4px 22px ${hexToRGBA(ringColor, 0.35)}, inset 0 0 18px ${hexToRGBA(ringColor, 0.15)}`,
                touchAction: "none",
                userSelect: "none",
                pointerEvents: "auto",
                cursor: "pointer",
                transform: pressed ? "scale(0.92)" : "scale(1)",
                transition: "transform 110ms ease, box-shadow 220ms ease",
                zIndex: 12,
            }}
        >
            {/* Inner glyph */}
            <div
                style={{
                    position: "absolute",
                    inset: 18,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 50% 50%, ${hexToRGBA(ringColor, 0.85)} 0%, ${hexToRGBA(ringColor, 0.25)} 70%, transparent 100%)`,
                    pointerEvents: "none",
                    animation: superArmed
                        ? "ndr-mobile-fire-pulse 1.2s ease-in-out infinite"
                        : "none",
                }}
            />
            {/* Concentric rings */}
            <div
                style={{
                    position: "absolute",
                    inset: 6,
                    borderRadius: "50%",
                    border: `1px solid ${hexToRGBA(ringColor, 0.45)}`,
                    pointerEvents: "none",
                }}
            />
            {/* Ripple on press */}
            <div
                key={ripple}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `2px solid ${hexToRGBA(ringColor, 0.6)}`,
                    pointerEvents: "none",
                    animation: "ndr-mobile-fire-ripple 600ms ease-out forwards",
                }}
            />
            <style>{`
                @keyframes ndr-mobile-fire-pulse {
                  0%, 100% { transform: scale(1); opacity: 0.85; }
                  50% { transform: scale(1.08); opacity: 1; }
                }
                @keyframes ndr-mobile-fire-ripple {
                  0% { transform: scale(1); opacity: 0.9; }
                  100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

/* ── Paleta de frecuencias ────────────────────────────── */

function MobileFreqPalette({
    selected,
    available,
    harmonic,
    onPick,
    inline = false,
    orientation = "portrait",
}: {
    selected: Freq
    available: Record<Freq, boolean>
    harmonic: boolean
    onPick: (f: Freq) => void
    /* v2.6 — Cuando vive dentro del HUD top, layout inline (sin
       absolute positioning). El HUD se encarga de la ubicación. */
    inline?: boolean
    /* v2.19 — En landscape la paleta se reposiciona a la derecha en
       columna vertical con offset del notch. Permite tocar las
       frecuencias con el pulgar derecho sin tapar el centro del
       campo. */
    orientation?: "portrait" | "landscape"
}) {
    const wrapperStyle: React.CSSProperties = inline
        ? {
              display: "flex",
              gap: 8,
              pointerEvents: "auto",
              touchAction: "manipulation",
              alignItems: "center",
          }
        : orientation === "landscape"
          ? {
                /* v2.23 — Chips 1·2·3·4 en el EXTREMO derecho (right:
                   safe + 18), alineados verticalmente con el centro
                   X del botón de fuego que vive abajo en la misma
                   columna. Antes la columna estaba en right=132 y
                   los chips chocaban contra los nodos del juego que
                   ocupan el centro del canvas. Trasladados al borde
                   liberan toda la franja central para el campo. El
                   top=env+78 los baja debajo del HUD top (que termina
                   ~54+env) para no chocar con el reload. SUPER
                   queda en otra columna a la izquierda (right=88) —
                   ya no comparte X con los chips. */
                position: "absolute",
                right: "calc(env(safe-area-inset-right, 0px) + 18px)",
                top: "calc(env(safe-area-inset-top, 0px) + 78px)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                pointerEvents: "auto",
                touchAction: "manipulation",
                zIndex: 11,
            }
          : {
                /* v2.8 — Posición fija: ENTRE el canvas y los controles
                   inferiores (joystick a 22+118 = 140 px del piso, fuego
                   a 22+96 = 118 px del piso). Bottom 156 deja un gap
                   cómodo y ubica los chips justo debajo de la zona de
                   acción del canvas. */
                position: "absolute",
                left: "50%",
                bottom: 156,
                transform: "translateX(-50%)",
                display: "flex",
                gap: 10,
                pointerEvents: "auto",
                touchAction: "manipulation",
                zIndex: 11,
            }
    const sActive = inline ? 38 : 44
    const sIdle = inline ? 32 : 38
    const fontActive = inline ? 14 : 16
    const fontIdle = inline ? 12 : 14
    return (
        <div style={wrapperStyle}>
            {([1, 2, 3, 4] as Freq[]).map((f) => {
                const active = selected === f
                const enabled = harmonic || available[f]
                const color = FREQS[f].color
                return (
                    <button
                        key={f}
                        type="button"
                        disabled={!enabled}
                        onPointerDown={(e) => {
                            e.preventDefault()
                            if (!enabled) {
                                vibrate(15)
                                return
                            }
                            vibrate(6)
                            onPick(f)
                        }}
                        style={{
                            width: active ? sActive : sIdle,
                            height: active ? sActive : sIdle,
                            borderRadius: "50%",
                            border: `2px solid ${enabled ? hexToRGBA(color, active ? 1 : 0.55) : "rgba(255,255,255,0.18)"}`,
                            background: enabled
                                ? `radial-gradient(circle at 35% 35%, ${hexToRGBA(color, active ? 0.95 : 0.45)} 0%, ${hexToRGBA(color, 0.15)} 70%, ${hexToRGBA(color, 0.02)} 100%)`
                                : "rgba(20,20,30,0.5)",
                            color: enabled ? "#fff" : "rgba(255,255,255,0.3)",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 700,
                            fontSize: active ? fontActive : fontIdle,
                            opacity: enabled ? 1 : 0.45,
                            cursor: enabled ? "pointer" : "not-allowed",
                            boxShadow: active
                                ? `0 0 20px ${hexToRGBA(color, 0.6)}, inset 0 0 14px ${hexToRGBA(color, 0.4)}`
                                : enabled
                                  ? `0 2px 10px ${hexToRGBA(color, 0.25)}`
                                  : "none",
                            transition:
                                "width 180ms ease, height 180ms ease, font-size 180ms ease, box-shadow 220ms ease, border-color 180ms ease",
                            touchAction: "manipulation",
                            padding: 0,
                        }}
                    >
                        {f}
                    </button>
                )
            })}
        </div>
    )
}

/* ── Super pulse ──────────────────────────────────────── */

function MobileSuperButton({
    superReady,
    superArmed,
    streakCount,
    onArm,
    onCancel,
    orientation = "portrait",
}: {
    superReady: boolean
    superArmed: boolean
    streakCount: number
    onArm: () => void
    onCancel: () => void
    orientation?: "portrait" | "landscape"
}) {
    if (!superReady && streakCount === 0) return null
    const ratio = Math.min(1, streakCount / STREAK_NEEDED)
    const ready = superReady
    /* v2.6 — SUPER ahora vive arriba del fire (mismo eje vertical) en
       lugar de a la izquierda — la izquierda es del joystick. La altura
       lo despeja del area del fire y respeta la zona del pulgar.
       v2.22 — En landscape SUPER deja la columna fire+SUPER (chocaba
       con el botón de disparo) y se monta en el TOP-RIGHT alineado
       con el centro Y del row de buttons del HUD top (donde vive el
       reiniciar membrana). Right env+124 lo coloca a la izquierda
       del par restart+tutorial sin overlaps.
       v2.23 — Los chips 1·2·3·4 se mudaron al extremo derecho (right
       env+18) para liberar el centro del canvas. SUPER se queda en
       una columna distinta a la izquierda de los chips (right env+88)
       para que cumplan la directriz de "diferentes columnas en X".
       Top sigue en 5+env, alineado con el inicio del HUD top row. */
    const positionStyles: React.CSSProperties =
        orientation === "landscape"
            ? {
                  top: "calc(5px + env(safe-area-inset-top, 0px))",
                  right: "calc(env(safe-area-inset-right, 0px) + 88px)",
              }
            : {
                  /* v2.20 portrait — Respeta env(safe-area-inset-right)
                     + 32px para no quedar bajo la cámara del iPhone
                     landscape con notch a la derecha. */
                  right: "calc(env(safe-area-inset-right, 0px) + 32px)",
                  bottom: 130,
              }
    return (
        <div
            style={{
                position: "absolute",
                ...positionStyles,
                width: 56,
                height: 56,
                borderRadius: "50%",
                pointerEvents: ready ? "auto" : "none",
                touchAction: "none",
                opacity: ready ? 1 : 0.55,
                zIndex: 12,
            }}
        >
            <button
                type="button"
                onPointerDown={(e) => {
                    e.preventDefault()
                    if (!ready) return
                    vibrate(superArmed ? 8 : 18)
                    if (superArmed) onCancel()
                    else onArm()
                }}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `2px solid ${superArmed ? "#FFD700" : hexToRGBA("#FFD700", ready ? 0.85 : 0.45)}`,
                    background: superArmed
                        ? `radial-gradient(circle at 35% 35%, rgba(255,215,0,0.85) 0%, rgba(255,160,0,0.4) 60%, rgba(255,140,0,0.15) 100%)`
                        : ready
                          ? `radial-gradient(circle at 35% 35%, rgba(255,215,0,0.55) 0%, rgba(255,180,0,0.18) 60%, rgba(0,0,0,0) 100%)`
                          : "rgba(20,15,5,0.55)",
                    color: ready ? "#fff" : "rgba(255,200,80,0.5)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    cursor: ready ? "pointer" : "not-allowed",
                    boxShadow: superArmed
                        ? "0 0 30px rgba(255,215,0,0.65), inset 0 0 18px rgba(255,200,0,0.4)"
                        : ready
                          ? "0 0 18px rgba(255,215,0,0.35), inset 0 0 12px rgba(255,200,0,0.2)"
                          : "none",
                    animation: ready
                        ? "ndr-super-ready 1.6s ease-in-out infinite"
                        : "none",
                    transition:
                        "border-color 180ms ease, box-shadow 220ms ease",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textShadow: "0 0 6px rgba(255,200,80,0.7)",
                    }}
                >
                    SUPER
                </div>
                {/* Charge ring */}
                {!ready && (
                    <svg
                        viewBox="0 0 64 64"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                        }}
                    >
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="rgba(255,215,0,0.85)"
                            strokeWidth="3"
                            strokeDasharray={`${ratio * 175.929} 175.929`}
                            transform="rotate(-90 32 32)"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </button>
            <style>{`
                @keyframes ndr-super-ready {
                  0%, 100% { box-shadow: 0 0 18px rgba(255,215,0,0.35), inset 0 0 12px rgba(255,200,0,0.2); }
                  50% { box-shadow: 0 0 32px rgba(255,215,0,0.7), inset 0 0 20px rgba(255,200,0,0.4); }
                }
            `}</style>
        </div>
    )
}

/* ── HUD superior ─────────────────────────────────────── */

/* v2.18 — Hook compartido: lee el flag localStorage del tutorial
   gestual (3 pasos joystick · fuego · frecuencia) y se actualiza
   automáticamente cuando el MobileTutorial.close() dispara el evento
   `rsv-ndr-tutorial-done`. Permite que MobileTopHUD y MobileLevelConsole
   oculten su botón TUTORIAL sin necesidad de prop drilling desde el
   componente raíz. Si el Tripulante entra en otro dispositivo, el
   localStorage está vacío en esa device → el botón vuelve a aparecer
   por sí solo, lo que cumple el requisito de Zak ("cada vez que ingrese
   sesión en otro dispositivo debería aparecer el botón de tutorial"). */
function useGesturalTutorialDone(): boolean {
    const [done, setDone] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false
        try {
            return localStorage.getItem(MOBILE_TUTORIAL_KEY) === "1"
        } catch {
            return false
        }
    })
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const onDone = () => setDone(true)
        const onStorage = (e: StorageEvent) => {
            if (e.key !== MOBILE_TUTORIAL_KEY) return
            setDone(e.newValue === "1")
        }
        window.addEventListener("rsv-ndr-tutorial-done", onDone)
        window.addEventListener("storage", onStorage)
        return () => {
            window.removeEventListener("rsv-ndr-tutorial-done", onDone)
            window.removeEventListener("storage", onStorage)
        }
    }, [])
    return done
}

function MobileTopHUD({
    energy,
    streakCount,
    selected,
    codeSeq,
    codeCursor,
    codeFull,
    duoSeq,
    duoCursor,
    tripleSeq,
    tripleCursor,
    showCode,
    showF3,
    showF4,
    superReady,
    levelTitle,
    nodesLeft,
    nodesTotal,
    isTutorial,
    tutorialStep,
    onBack,
    onReload,
    onTutorial,
    /* v2.6 — Chips de frecuencia inline en el HUD top para que no choquen
       con el joystick. */
    available,
    harmonic,
    onPickFreq,
    /* v2.19 — En landscape las pills (Racha · Código · F4) se mueven
       a una columna lateral izquierda; el HUD top deja de pintarlas
       para no ocupar la fila completa con los notches. */
    orientation = "portrait",
}: {
    energy: number
    streakCount: number
    selected: Freq
    codeSeq: Freq[]
    codeCursor: number
    codeFull: boolean
    duoSeq: Freq[]
    duoCursor: number
    tripleSeq: Freq[]
    tripleCursor: number
    showCode: boolean
    showF3: boolean
    showF4: boolean
    superReady: boolean
    levelTitle: string
    nodesLeft: number
    nodesTotal: number
    isTutorial: boolean
    tutorialStep: number
    onBack: () => void
    onReload: () => void
    onTutorial: () => void
    available: Record<Freq, boolean>
    harmonic: boolean
    onPickFreq: (f: Freq) => void
    orientation?: "portrait" | "landscape"
}) {
    /* v2.7 — Display de racha: si SUPER está listo mostramos los 3
       dots dorados (carga completa) en lugar de quedarnos en el reset
       a 0 que hace el motor cuando arma. Elimina el "no se actualiza"
       que reportaba el Tripulante. */
    const displayStreakCount = superReady
        ? STREAK_NEEDED
        : Math.min(STREAK_NEEDED, streakCount)
    const streakColor = superReady ? "#FFD700" : FREQS[selected].color
    /* v2.18 — Tutorial gestual completado en este dispositivo → el
       botón "?" no aparece más en el HUD. Si el Tripulante entra
       desde otro celular, el flag está vacío y el botón reaparece. */
    const tutorialDone = useGesturalTutorialDone()
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                /* env(safe-area-inset-top) baja el HUD top por la
                   altura del notch en PWA standalone. Web normal:
                   env() = 0, queda como antes. */
                padding: "calc(12px + env(safe-area-inset-top, 0px)) 16px 0",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                pointerEvents: "none",
                zIndex: 10,
            }}
        >
            {/* v2.5 — Top row: VOLVER (izq) · título · TUTORIAL (der). Sin
                botón de pausa ni de reload. La consola de niveles se abre
                con VOLVER cuando el juego está activo (re-tap = salir a
                Holoteca). El tutorial se redispara desde el botón derecho. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    pointerEvents: "auto",
                }}
            >
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.preventDefault()
                        vibrate(8)
                        onBack()
                    }}
                    aria-label="Selección de membranas"
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "1px solid rgba(0,194,255,0.45)",
                        background:
                            "radial-gradient(circle at 35% 35%, rgba(0,50,100,0.78) 0%, rgba(0,16,32,0.92) 100%)",
                        color: "#dffeff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                            "0 2px 14px rgba(0,194,255,0.3), inset 0 0 12px rgba(0,194,255,0.12)",
                        touchAction: "manipulation",
                        padding: 0,
                    }}
                >
                    {/* v2.7 — Icono ≡ (lista) en lugar de flecha. La
                        flecha sugería "atrás" y el Tripulante perdía la
                        consola; el menú comunica abrir lista. */}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path
                            d="M3 5h12M3 9h12M3 13h12"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 2,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            color: "#cfeeff",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textShadow: "0 0 8px rgba(0,0,0,0.9)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                        }}
                    >
                        {levelTitle}
                    </div>
                    {!isTutorial && nodesTotal > 0 && (
                        <div
                            style={{
                                color: "rgba(180,220,255,0.6)",
                                fontFamily: "'Inter', system-ui, monospace",
                                fontSize: 11,
                                letterSpacing: "0.04em",
                            }}
                        >
                            nodos {nodesLeft}/{nodesTotal}
                        </div>
                    )}
                </div>
                {/* v2.7 — RESET: reinicia la membrana actual sin pasar
                    por la consola. Siempre visible cuando hay nivel
                    activo. */}
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.preventDefault()
                        vibrate(10)
                        onReload()
                    }}
                    aria-label="Reiniciar membrana"
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "1px solid rgba(180,220,255,0.32)",
                        background:
                            "radial-gradient(circle at 35% 35%, rgba(20,30,55,0.7) 0%, rgba(8,14,28,0.9) 100%)",
                        color: "#dffeff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                        touchAction: "manipulation",
                        padding: 0,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M13 8a5 5 0 1 1-1.46-3.54M13 2.5v3.2H9.8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                {/* v2.18 — Botón "?" del tutorial gestual: solo
                    aparece si este dispositivo todavía no completó
                    los 3 pasos. Una vez completado, desaparece para
                    no ensuciar el HUD. Reaparece automáticamente al
                    entrar desde otro celular (localStorage por
                    dispositivo). */}
                {!tutorialDone && (
                    <button
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            vibrate(8)
                            onTutorial()
                        }}
                        aria-label="Ver tutorial"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            border: "1px solid rgba(0,194,255,0.45)",
                            background:
                                "radial-gradient(circle at 35% 35%, rgba(0,50,100,0.78) 0%, rgba(0,16,32,0.92) 100%)",
                            color: "#dffeff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                                "0 2px 14px rgba(0,194,255,0.3), inset 0 0 12px rgba(0,194,255,0.12)",
                            touchAction: "manipulation",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            padding: 0,
                        }}
                    >
                        ?
                    </button>
                )}
            </div>
            {/* Energy bar — v2.20: en landscape se renderiza aparte
                (MobileEnergyTopBar) clavada al borde superior; acá la
                ocultamos para no duplicar. En portrait queda dentro
                del flex-column del HUD como siempre. */}
            {orientation === "portrait" && (
                <div
                    style={{
                        position: "relative",
                        height: 6,
                        borderRadius: 4,
                        background: "rgba(0,30,60,0.55)",
                        border: "1px solid rgba(120,200,255,0.25)",
                        overflow: "hidden",
                        boxShadow: "inset 0 0 6px rgba(0,194,255,0.12)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            right: `${(1 - clamp(energy, 0, 1)) * 100}%`,
                            background:
                                "linear-gradient(90deg, rgba(126,200,255,0.85), #00C2FF)",
                            boxShadow: "0 0 8px rgba(0,194,255,0.5)",
                            transition: "right 160ms ease",
                        }}
                    />
                </div>
            )}
            {/* v2.7 — Fila Racha + secuencias. Mostramos hasta 3 pills:
                Código (final) · F3 (desbloquear verde) · F4 (desbloquear
                rosa). Mismo set que el HUD desktop (`ndr-top-seqs`).
                v2.19 — En landscape NO renderizamos esta fila acá; las
                pills viven aparte como columna lateral izquierda
                (MobileSeqsColumn) para no usar la fila completa con
                los notches del iPhone. */}
            {orientation === "portrait" && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(0,18,40,0.6)",
                            border: `1px solid ${superReady ? hexToRGBA("#FFD700", 0.55) : "rgba(0,194,255,0.25)"}`,
                            color: "#dffeff",
                            fontFamily: "'Inter', system-ui, monospace",
                            fontSize: 11,
                            letterSpacing: "0.04em",
                            transition: "border-color 220ms ease",
                        }}
                    >
                        <span style={{ opacity: 0.7 }}>Racha</span>
                        {Array.from({ length: STREAK_NEEDED }).map((_, i) => (
                            <span
                                key={i}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background:
                                        i < displayStreakCount
                                            ? streakColor
                                            : "rgba(255,255,255,0.18)",
                                    boxShadow:
                                        i < displayStreakCount
                                            ? `0 0 6px ${hexToRGBA(streakColor, 0.7)}`
                                            : "none",
                                    transition:
                                        "background 200ms ease, box-shadow 200ms ease",
                                }}
                            />
                        ))}
                    </div>
                    {showCode && codeSeq.length > 0 && (
                        <SeqPill
                            label="Código"
                            seq={codeSeq}
                            cursor={codeCursor}
                            full={codeFull}
                            accent="#FFD700"
                        />
                    )}
                    {showF3 && duoSeq.length > 0 && (
                        <SeqPill
                            label="F3"
                            seq={duoSeq}
                            cursor={duoCursor}
                            full={false}
                            accent="#00FF88"
                        />
                    )}
                    {showF4 && tripleSeq.length > 0 && (
                        <SeqPill
                            label="F4"
                            seq={tripleSeq}
                            cursor={tripleCursor}
                            full={false}
                            accent="#FF6BFF"
                        />
                    )}
                </div>
            )}
        </div>
    )
}

/* ═══ v2.20 — MobileEnergyTopBar ═══
   Banda full-width clavada al borde superior del viewport con offset
   env(safe-area-inset-top, 0px). Sustituye a la barra de energía
   embebida dentro del HUD top cuando orientation === "landscape": en
   esa orientación la barra dentro del flex-column quedaba a media
   altura del canvas y robaba campo visual. Ahora viaja como cintilla
   telemétrica fina pegada al techo de la pantalla, sin border-radius
   y sin paddings horizontales para que toque el borde lateral a lateral. */
function MobileEnergyTopBar({ energy }: { energy: number }) {
    return (
        <div
            style={{
                position: "absolute",
                top: "env(safe-area-inset-top, 0px)",
                left: 0,
                right: 0,
                height: 4,
                background: "rgba(0,16,32,0.75)",
                borderBottom: "1px solid rgba(120,200,255,0.18)",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 11,
                boxShadow: "inset 0 0 6px rgba(0,194,255,0.1)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    right: `${(1 - clamp(energy, 0, 1)) * 100}%`,
                    background:
                        "linear-gradient(90deg, rgba(126,200,255,0.9), #00C2FF)",
                    boxShadow: "0 0 10px rgba(0,194,255,0.55)",
                    transition: "right 160ms ease",
                }}
            />
        </div>
    )
}

/* ═══ v2.19 — MobileSeqsColumn ═══
   Versión columna vertical de la fila Racha + Código + F3 + F4 que se
   monta en LANDSCAPE como ancla a la izquierda con offset del notch.
   Reusa SeqPill internamente para mantener el mismo lenguaje visual. */
function MobileSeqsColumn({
    streakCount,
    selected,
    superReady,
    codeSeq,
    codeCursor,
    codeFull,
    duoSeq,
    duoCursor,
    tripleSeq,
    tripleCursor,
    showCode,
    showF3,
    showF4,
}: {
    streakCount: number
    selected: Freq
    superReady: boolean
    codeSeq: Freq[]
    codeCursor: number
    codeFull: boolean
    duoSeq: Freq[]
    duoCursor: number
    tripleSeq: Freq[]
    tripleCursor: number
    showCode: boolean
    showF3: boolean
    showF4: boolean
}) {
    const displayStreakCount = superReady
        ? STREAK_NEEDED
        : Math.min(STREAK_NEEDED, streakCount)
    const streakColor = superReady ? "#FFD700" : FREQS[selected].color
    return (
        <div
            style={{
                /* v2.20 — Anclada al borde izquierdo con offset del
                   notch + 14px. Subida al tercio superior del campo
                   (top = safe-area-inset-top + 70px) para no chocar
                   con el joystick que vive en la zona inferior
                   izquierda. Antes estaba centrada al 50% y la
                   pill F4 se solapaba con el joystick. Crece hacia
                   abajo desde el ancla. */
                position: "absolute",
                left: "calc(env(safe-area-inset-left, 0px) + 14px)",
                top: "calc(env(safe-area-inset-top, 0px) + 70px)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                pointerEvents: "auto",
                zIndex: 10,
                /* Filtros visuales: drop-shadow para destacar sobre
                   el fondo del canvas. */
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.85))",
            }}
        >
            {/* Pill Racha (siempre visible) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(0,18,40,0.6)",
                    border: `1px solid ${superReady ? hexToRGBA("#FFD700", 0.55) : "rgba(0,194,255,0.25)"}`,
                    color: "#dffeff",
                    fontFamily: "'Inter', system-ui, monospace",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    transition: "border-color 220ms ease",
                }}
            >
                <span style={{ opacity: 0.7 }}>Racha</span>
                {Array.from({ length: STREAK_NEEDED }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                                i < displayStreakCount
                                    ? streakColor
                                    : "rgba(255,255,255,0.18)",
                            boxShadow:
                                i < displayStreakCount
                                    ? `0 0 6px ${hexToRGBA(streakColor, 0.7)}`
                                    : "none",
                            transition:
                                "background 200ms ease, box-shadow 200ms ease",
                        }}
                    />
                ))}
            </div>
            {showCode && codeSeq.length > 0 && (
                <SeqPill
                    label="Código"
                    seq={codeSeq}
                    cursor={codeCursor}
                    full={codeFull}
                    accent="#FFD700"
                />
            )}
            {showF3 && duoSeq.length > 0 && (
                <SeqPill
                    label="F3"
                    seq={duoSeq}
                    cursor={duoCursor}
                    full={false}
                    accent="#00FF88"
                />
            )}
            {showF4 && tripleSeq.length > 0 && (
                <SeqPill
                    label="F4"
                    seq={tripleSeq}
                    cursor={tripleCursor}
                    full={false}
                    accent="#FF6BFF"
                />
            )}
        </div>
    )
}

/* v2.7 — Pill de secuencia reutilizable (Código · F3 · F4). */
function SeqPill({
    label,
    seq,
    cursor,
    full,
    accent,
}: {
    label: string
    seq: Freq[]
    cursor: number
    full: boolean
    accent: string
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(0,18,40,0.6)",
                border: `1px solid ${hexToRGBA(accent, 0.32)}`,
                color: hexToRGBA(accent, 0.9),
                fontFamily: "'Inter', system-ui, monospace",
                fontSize: 11,
                letterSpacing: "0.04em",
            }}
        >
            <span style={{ opacity: 0.7 }}>{label}</span>
            {seq.map((f, i) => {
                const active = full || i < cursor
                return (
                    <span
                        key={i}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: FREQS[f].color,
                            opacity: active ? 1 : 0.28,
                            boxShadow: active
                                ? `0 0 8px ${hexToRGBA(FREQS[f].color, 0.85)}`
                                : "none",
                            transition: "opacity 200ms ease",
                        }}
                    />
                )
            })}
        </div>
    )
}

/* ── Tutorial gestual ─────────────────────────────────── */

function MobileTutorial({ onDone }: { onDone: () => void }) {
    const [step, setStep] = React.useState<0 | 1 | 2 | 3>(0)
    const STEPS = [
        {
            anchor: "joystick" as const,
            title: "Apunta",
            body: "Arrastra el círculo cyan inferior izquierdo para girar tu campo de visión.",
        },
        {
            anchor: "fire" as const,
            title: "Integra",
            body: "Toca el círculo derecho para emitir un pulso. El cono dorado muestra tu apertura.",
        },
        {
            anchor: "freq" as const,
            title: "Cambia frecuencia",
            body: "Selecciona la frecuencia que coincide con cada nodo. Una racha de tres carga tu Super Jump.",
        },
    ]
    const close = () => {
        try {
            localStorage.setItem(MOBILE_TUTORIAL_KEY, "1")
        } catch {}
        /* v2.18 — Notificamos a HUD y consola para que oculten el
           botón "TUTORIAL" sin necesidad de re-mountar. La key
           sigue por dispositivo (localStorage), así que entrar en
           otro celular vuelve a mostrar el botón naturalmente. */
        try {
            window.dispatchEvent(new Event("rsv-ndr-tutorial-done"))
        } catch {}
        onDone()
    }
    if (step >= STEPS.length) {
        close()
        return null
    }
    const s = STEPS[step]
    const ringStyle: React.CSSProperties = {
        position: "absolute",
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.85)",
        boxShadow:
            "0 0 0 4px rgba(255,255,255,0.18), 0 0 30px rgba(0,194,255,0.6)",
        pointerEvents: "none",
        animation: "ndr-tut-pulse 1.4s ease-in-out infinite",
    }
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,4,12,0.62)",
                backdropFilter: "blur(4px)",
                zIndex: 80,
                pointerEvents: "auto",
            }}
        >
            <style>{`
                @keyframes ndr-tut-pulse {
                  0%, 100% { transform: scale(1); opacity: 0.95; }
                  50% { transform: scale(1.08); opacity: 0.6; }
                }
            `}</style>
            {/* Highlight ring */}
            {s.anchor === "joystick" && (
                <div
                    style={{
                        ...ringStyle,
                        left: 22 - 6,
                        bottom: 26 - 6,
                        width: 152,
                        height: 152,
                    }}
                />
            )}
            {s.anchor === "fire" && (
                <div
                    style={{
                        ...ringStyle,
                        right: 22 - 6,
                        bottom: 26 - 6,
                        width: 122,
                        height: 122,
                    }}
                />
            )}
            {s.anchor === "freq" && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 22,
                        transform: "translateX(-50%)",
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "2px solid rgba(255,255,255,0.85)",
                        boxShadow:
                            "0 0 0 4px rgba(255,255,255,0.15), 0 0 30px rgba(0,194,255,0.55)",
                        animation: "ndr-tut-pulse 1.4s ease-in-out infinite",
                        pointerEvents: "none",
                    }}
                >
                    &nbsp;
                </div>
            )}
            {/* Card — v2.19 centrada horizontal con maxWidth 360 +
                offset del notch via calc(). En LANDSCAPE iPhone la
                card no se corta por la cámara ni se estira al ancho
                completo del viewport (queda como modal flotante). En
                portrait, el ancho calculado da prácticamente el ancho
                completo restando 32px (16px de cada lado). */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: 70,
                    transform: "translateX(-50%)",
                    width: "calc(100% - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 32px)",
                    maxWidth: 360,
                    padding: "18px 18px 16px",
                    borderRadius: 18,
                    background:
                        "linear-gradient(180deg, rgba(8,18,38,0.96), rgba(4,10,22,0.98))",
                    border: "1px solid rgba(0,194,255,0.32)",
                    boxShadow:
                        "0 12px 36px rgba(0,0,0,0.55), 0 0 22px rgba(0,194,255,0.18)",
                    color: "#dffeff",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    pointerEvents: "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                        color: "#7ee0ff",
                        fontFamily: "monospace",
                        fontSize: 11,
                        letterSpacing: "0.18em",
                    }}
                >
                    PASO {step + 1} / {STEPS.length}
                </div>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 800,
                        marginBottom: 8,
                        color: "#ffffff",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {s.title}
                </div>
                <div
                    style={{
                        fontSize: 14,
                        lineHeight: 1.45,
                        color: "rgba(220,240,255,0.86)",
                        marginBottom: 14,
                    }}
                >
                    {s.body}
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                    }}
                >
                    <button
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            close()
                        }}
                        style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(220,240,255,0.7)",
                            fontFamily: "monospace",
                            fontSize: 13,
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            touchAction: "manipulation",
                        }}
                    >
                        Saltar
                    </button>
                    <button
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            vibrate(6)
                            if (step === STEPS.length - 1) close()
                            else setStep((step + 1) as 0 | 1 | 2 | 3)
                        }}
                        style={{
                            flex: 1.4,
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: "1px solid rgba(0,194,255,0.45)",
                            background:
                                "linear-gradient(180deg, rgba(0,80,140,0.85), rgba(0,40,80,0.95))",
                            color: "#dffeff",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            boxShadow: "0 0 18px rgba(0,194,255,0.35)",
                            touchAction: "manipulation",
                        }}
                    >
                        {step === STEPS.length - 1 ? "Comenzar" : "Siguiente"}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── Consola portrait ─────────────────────────────────── */

function MobileLevelConsole({
    title,
    description,
    stars,
    ordered,
    progressionLocked,
    onPick,
    onPickTutorial,
    canClose,
    onClose,
    onExit,
    sfxEnabled,
    titleImage,
    isAdmin,
}: {
    title: string
    description: string
    stars: number[]
    ordered: {
        list: any[]
        idByDisp: Map<number, number>
        dispById: Map<number, number>
    }
    progressionLocked: boolean
    onPick: (index: number) => void
    onPickTutorial: () => void
    canClose: boolean
    /* v2.8 — onClose: cierra la consola y regresa al juego activo
       (válido solo si canClose=true). onExit: sale a la Holoteca. */
    onClose: () => void
    onExit: () => void
    sfxEnabled?: boolean
    titleImage?: string
    isAdmin?: boolean
}) {
    const [data, setData] = React.useState<
        Record<
            number,
            {
                completed?: boolean
                preview?: string
                chord?: boolean
                timeMs?: number
            }
        >
    >(readProgressFromStorage)
    const [page, setPage] = React.useState<1 | 2>(1)
    /* v2.23 — Orientación leída con el hook compartido del módulo. En
       landscape la consola compacta el header (título sin subtítulo
       largo, sin leyenda de estrellas, sin reset · admin) y el grid
       pasa de 2 columnas (cuadradas, tap-friendly portrait) a 5
       columnas — las 10 membranas de cada página se ven completas en
       2 filas sin scroll en cualquier iPhone landscape. */
    const orientation = useScreenOrientation()
    const isLandscape = orientation === "landscape"
    React.useEffect(() => {
        const reload = () => {
            try {
                setData(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"))
            } catch {}
        }
        reload()
        /* v2.11 — Recargar al hidratar desde Supabase. */
        window.addEventListener("ndr-progress-hydrated", reload)
        return () => window.removeEventListener("ndr-progress-hydrated", reload)
    }, [])

    const tutorialCompleted =
        data[0]?.completed === true || typeof data[0]?.timeMs === "number"
    /* v2.18 — Tutorial gestual completado: si el dispositivo ya
       guardó el flag, el botón TUTORIAL del header desaparece
       de la consola. No usamos `tutorialCompleted` (que track
       la membrana 0) porque puede haber jugado la membrana de
       prueba antes de cerrar los 3 pasos gestuales — son flags
       independientes. */
    const gesturalTutorialDone = useGesturalTutorialDone()
    const isUnlocked = (disp: number) => {
        if (!progressionLocked || disp === 0) return true
        if (disp === 1) return true
        const prevId = ordered.idByDisp.get(disp - 1)!
        return (
            data[prevId]?.completed === true ||
            typeof data[prevId]?.timeMs === "number"
        )
    }
    const visible = ordered.list
        .filter((L) => L.id !== 0)
        .filter((L) =>
            page === 1
                ? L.displayIndex >= 1 && L.displayIndex <= 10
                : L.displayIndex >= 11 && L.displayIndex <= 20
        )

    const handleReset = () => {
        const ok = window.confirm(
            "¿Borrar todos los avances de Navegante? No se puede deshacer."
        )
        if (!ok) return
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
        setData({})
    }

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background:
                    "radial-gradient(circle at center, rgba(0,8,28,0.92), rgba(0,2,12,0.96))",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                /* env(safe-area-inset-top) baja la consola bajo el notch
                   en PWA standalone. Web normal: env() = 0, queda en 18. */
                paddingTop: "calc(18px + env(safe-area-inset-top, 0px))",
                /* v2.18 — paddingBottom 0 (antes 16). El grid hijo
                   ahora absorbe el safe-area-inset-bottom directamente
                   en su propio padding, así las cards llegan visualmente
                   al borde inferior y solo dejan respiro para la home
                   bar de iOS. Sin esto, había una banda muerta de ~16px
                   entre la última fila y el bottom. */
                paddingBottom: 0,
            }}
        >
            {/* v2.6 — Top bar: VOLVER (izq, flecha) + título centrado +
                TUTORIAL (der). Convención mobile estándar: el back vive
                arriba a la izquierda, las acciones secundarias a la
                derecha. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 16px",
                    marginBottom: isLandscape ? 4 : 10,
                }}
            >
                <button
                    type="button"
                    aria-label="Volver a la Holoteca"
                    onPointerDown={(e) => {
                        e.preventDefault()
                        vibrate(6)
                        /* v2.15 — ← SIEMPRE sale a la Holoteca, sin
                           importar si hay membrana activa. La lógica
                           anterior (cerrar consola y volver al juego
                           cuando canClose=true) confundía: el
                           Tripulante apretaba "regresar" esperando
                           salir y caía de nuevo en el nivel. Para
                           volver al juego activo el flujo correcto
                           es re-pickear la membrana en la grilla
                           que ya está debajo del header. */
                        onExit()
                    }}
                    style={{
                        width: isLandscape ? 36 : 42,
                        height: isLandscape ? 36 : 42,
                        borderRadius: "50%",
                        border: "1px solid rgba(0,194,255,0.45)",
                        background:
                            "radial-gradient(circle at 35% 35%, rgba(0,50,100,0.78) 0%, rgba(0,16,32,0.92) 100%)",
                        color: "#dffeff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                            "0 2px 14px rgba(0,194,255,0.3), inset 0 0 12px rgba(0,194,255,0.12)",
                        touchAction: "manipulation",
                        padding: 0,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M10.5 3 5 8l5.5 5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <div style={{ flex: 1 }} />
                {/* v2.23 — En landscape mostramos RESET·ADMIN inline en
                    el header (a la izquierda del TUTORIAL) en lugar de
                    debajo del título. La única forma de que ambos
                    botones del header convivan sin desbordar el ancho
                    es achicar el padding y la fontSize. */}
                {isAdmin && isLandscape && (
                    <button
                        type="button"
                        aria-label="Reset · admin"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            handleReset()
                        }}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,120,120,0.4)",
                            background: "rgba(60,0,0,0.35)",
                            color: "#ffd8d8",
                            fontFamily: "monospace",
                            fontSize: 9,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            touchAction: "manipulation",
                        }}
                    >
                        Reset
                    </button>
                )}
                {/* v2.18 — Botón TUTORIAL solo si el tutorial gestual
                    no se completó en este dispositivo. Una vez que el
                    Tripulante terminó los 3 pasos (joystick, fuego,
                    frecuencia), desaparece del header. Reaparece en
                    otro celular porque el flag vive en localStorage. */}
                {!gesturalTutorialDone && (
                    <button
                        type="button"
                        aria-label="Tutorial"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            vibrate(6)
                            onPickTutorial()
                        }}
                        style={{
                            padding: "8px 14px",
                            borderRadius: 999,
                            border: tutorialCompleted
                                ? "1px solid rgba(255,255,255,0.18)"
                                : "1px solid rgba(126,224,255,0.6)",
                            background: tutorialCompleted
                                ? "rgba(20,30,55,0.55)"
                                : "linear-gradient(180deg, rgba(0,80,140,0.7), rgba(0,40,80,0.85))",
                            color: tutorialCompleted ? "#9bbac8" : "#dffeff",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: 12,
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            boxShadow: tutorialCompleted
                                ? "none"
                                : "0 0 14px rgba(0,194,255,0.35)",
                            touchAction: "manipulation",
                        }}
                    >
                        TUTORIAL
                    </button>
                )}
            </div>
            {/* Title — en landscape compactamos a una sola fila con
                título reducido + leyenda inline (sin description larga
                ni reset · admin). El espacio ganado se reasigna a la
                grilla de membranas, que pasa de 2 columnas a 5 y
                muestra todas las cards visibles sin scroll. */}
            <div
                style={{
                    padding: "0 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: isLandscape ? 4 : 8,
                    marginBottom: isLandscape ? 6 : 12,
                }}
            >
                {titleImage ? (
                    <img
                        src={titleImage}
                        alt={title}
                        style={{
                            height: isLandscape ? 36 : 56,
                            width: "auto",
                            objectFit: "contain",
                            filter: "drop-shadow(0 0 12px rgba(0,194,255,0.4))",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            color: "#dffeff",
                            fontWeight: 800,
                            fontSize: isLandscape ? 18 : 24,
                            letterSpacing: "-0.01em",
                            textAlign: "center",
                            textShadow: "0 0 12px rgba(0,194,255,0.5)",
                        }}
                    >
                        {title}
                    </div>
                )}
                {!isLandscape && (
                    <div
                        style={{
                            color: "rgba(180,220,235,0.7)",
                            fontSize: 12,
                            textAlign: "center",
                            maxWidth: 320,
                            letterSpacing: "0.03em",
                        }}
                    >
                        {description}
                    </div>
                )}
                {/* v2.12 — Leyenda de estrellas movida del footer al header
                    para que la vista inferior quede libre para el grid.
                    En landscape se omite — la pantalla ya muestra los
                    iconos de estrellas en cada card. */}
                {!isLandscape && (
                    <div
                        style={{
                            color: "rgba(155,210,235,0.55)",
                            fontFamily: "monospace",
                            fontSize: 10.5,
                            textAlign: "center",
                            letterSpacing: "0.04em",
                            maxWidth: 360,
                            marginTop: 4,
                        }}
                    >
                        Las estrellas indican la presencia requerida por
                        membrana.
                    </div>
                )}
                {/* v2.12 — RESET solo para admins, debajo del subtítulo.
                    En landscape se mueve al header arriba — ver bloque
                    aparte para no robar altura al grid. */}
                {isAdmin && !isLandscape && (
                    <button
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            handleReset()
                        }}
                        style={{
                            marginTop: 8,
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,120,120,0.4)",
                            background: "rgba(60,0,0,0.35)",
                            color: "#ffd8d8",
                            fontFamily: "monospace",
                            fontSize: 9.5,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            touchAction: "manipulation",
                        }}
                    >
                        Reset · admin
                    </button>
                )}
            </div>
            {/* Page tabs */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                    padding: "0 16px",
                    marginBottom: isLandscape ? 6 : 10,
                }}
            >
                {[1, 2].map((p) => {
                    const active = page === p
                    const isYellow = p === 2
                    const accent = isYellow ? "#FFD700" : "#00C2FF"
                    return (
                        <button
                            key={p}
                            type="button"
                            onPointerDown={(e) => {
                                e.preventDefault()
                                vibrate(4)
                                setPage(p as 1 | 2)
                            }}
                            style={{
                                padding: "7px 16px",
                                borderRadius: 999,
                                border: active
                                    ? `1px solid ${hexToRGBA(accent, 0.85)}`
                                    : "1px solid rgba(255,255,255,0.18)",
                                background: active
                                    ? `linear-gradient(180deg, ${hexToRGBA(accent, 0.22)}, ${hexToRGBA(accent, 0.05)})`
                                    : "rgba(20,30,55,0.4)",
                                color: active
                                    ? isYellow
                                        ? "#FFE9A6"
                                        : "#dffeff"
                                    : "rgba(180,220,235,0.6)",
                                fontFamily: "monospace",
                                fontSize: 12,
                                letterSpacing: "0.06em",
                                cursor: "pointer",
                                boxShadow: active
                                    ? `0 0 14px ${hexToRGBA(accent, 0.32)}`
                                    : "none",
                                touchAction: "manipulation",
                            }}
                        >
                            {p === 1 ? "1—10" : "11—20"}
                        </button>
                    )
                })}
            </div>
            {/* Grid */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    WebkitOverflowScrolling: "touch",
                    /* v2.18 — paddingBottom usa safe-area-inset-bottom +
                       12px de respiro, en lugar del 16px fijo previo.
                       En iPhones con notch/home bar la banda inferior
                       deja exactamente lo necesario para no chocar con
                       la home bar; en devices sin safe-area cae a 12px
                       liso. Las tarjetas de membrana ahora llenan toda
                       la altura disponible sin aire muerto al fondo. */
                    padding:
                        "4px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        /* v2.23 — Landscape mobile usa 5 columnas: las
                           10 membranas de cada página caben en 2 filas
                           sin scroll. Portrait sigue con 2 columnas
                           cuadradas tap-friendly (cards más grandes
                           cómodas para el dedo). */
                        gridTemplateColumns: isLandscape
                            ? "repeat(5, 1fr)"
                            : "1fr 1fr",
                        gap: isLandscape ? 8 : 12,
                    }}
                >
                    {visible.map((L: any) => {
                        const disp = L.displayIndex
                        const rec = data[L.id] || {}
                        const completed =
                            rec.completed === true ||
                            typeof rec.timeMs === "number"
                        const unlocked = isUnlocked(disp)
                        const isYellowTheme = disp > 10
                        const accent = isYellowTheme ? "#FFD700" : "#00C2FF"
                        const starCount = stars[disp] ?? 3
                        return (
                            <button
                                key={L.id}
                                type="button"
                                disabled={!unlocked}
                                onPointerDown={(e) => {
                                    e.preventDefault()
                                    if (!unlocked) {
                                        vibrate(15)
                                        return
                                    }
                                    vibrate(8)
                                    const idx = ordered.list.findIndex(
                                        (x: any) => x.id === L.id
                                    )
                                    onPick(idx)
                                }}
                                style={{
                                    /* v2.23 — En landscape el aspect-ratio
                                       cae a 1.4:1 (más anchas que altas)
                                       para que las dos filas de 5 cards
                                       quepan completas sin scroll en
                                       iPhone landscape. Portrait sigue
                                       cuadrado. */
                                    aspectRatio: isLandscape
                                        ? "1.4 / 1"
                                        : "1 / 1",
                                    borderRadius: isLandscape ? 12 : 16,
                                    position: "relative",
                                    border: unlocked
                                        ? completed
                                            ? `2px solid ${hexToRGBA(accent, 0.85)}`
                                            : `1px solid ${hexToRGBA(accent, 0.4)}`
                                        : "1px solid rgba(180,190,205,0.18)",
                                    background: isYellowTheme
                                        ? "linear-gradient(135deg, #2a2207, #3d2f0a)"
                                        : "linear-gradient(135deg, #0e1d34, #142342)",
                                    boxShadow: unlocked
                                        ? completed
                                            ? `inset 0 0 30px ${hexToRGBA(accent, 0.22)}, 0 0 18px ${hexToRGBA(accent, 0.4)}`
                                            : `inset 0 0 28px ${hexToRGBA(accent, 0.1)}, 0 0 12px ${hexToRGBA(accent, 0.2)}`
                                        : "inset 0 0 22px rgba(180,190,205,0.06)",
                                    color: "#dffeff",
                                    cursor: unlocked
                                        ? "pointer"
                                        : "not-allowed",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: isLandscape
                                        ? "6px 4px 5px"
                                        : "10px 6px 8px",
                                    opacity: unlocked ? 1 : 0.45,
                                    filter: unlocked
                                        ? "none"
                                        : "grayscale(0.6) saturate(0.6)",
                                    transition: "transform 200ms ease",
                                    touchAction: "manipulation",
                                }}
                            >
                                <StarRow
                                    count={Math.max(
                                        1,
                                        Math.min(5, Math.round(starCount))
                                    )}
                                    size={isLandscape ? 9 : 11}
                                />
                                {rec.preview && (
                                    <img
                                        src={rec.preview}
                                        alt=""
                                        style={{
                                            position: "absolute",
                                            inset: 22,
                                            width: "calc(100% - 44px)",
                                            height: "calc(100% - 44px)",
                                            objectFit: "contain",
                                            opacity: unlocked ? 0.85 : 0.4,
                                            mixBlendMode: "screen",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        fontWeight: 800,
                                        fontSize: isLandscape ? 11 : 14,
                                        letterSpacing: "0.02em",
                                        color: isYellowTheme
                                            ? "#FFE57A"
                                            : "#dffeff",
                                        textShadow: `0 0 8px ${hexToRGBA(accent, 0.6)}`,
                                    }}
                                >
                                    {isLandscape
                                        ? `M${disp}`
                                        : `Membrana ${disp}`}
                                </div>
                                {completed && unlocked && (
                                    <div
                                        style={{
                                            zIndex: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <CompletionBadge
                                            golden={!!rec.chord}
                                            size={28}
                                        />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            {/* v2.12 — Footer eliminado. SALIR vive en el botón ← del header
                (canClose=false → onExit, canClose=true → onClose). RESET
                solo para admins, ya movido al header debajo del subtítulo.
                Vista inferior libre para que el grid llegue hasta el bottom. */}
        </div>
    )
}

/* ── Pista de rotación pasiva (v2.23) ────────────────────────────
   Banda glassmorphism con icono de celular girando + "Gira para
   experiencia inmersiva". Se monta entre el HUD top y el canvas;
   pointer-events:none para no bloquear el juego. Aparece al entrar
   en portrait (cada transición landscape → portrait la re-dispara),
   se mantiene 4.5 s y se desvanece sola. No tiene botón de OK ni
   bloquea el canvas — sugerencia y se va. */
function PortraitRotationHint({
    orientation,
    levelKey,
}: {
    orientation: "portrait" | "landscape"
    levelKey: number | string | null
}) {
    const [visible, setVisible] = React.useState(false)
    React.useEffect(() => {
        if (orientation !== "portrait") {
            setVisible(false)
            return
        }
        setVisible(true)
        const t = window.setTimeout(() => setVisible(false), 4500)
        return () => window.clearTimeout(t)
    }, [orientation, levelKey])
    if (orientation !== "portrait") return null
    return (
        <AnimatePresence>
            {visible && (
                /* v2.25 — Wrapper centrador no-motion. El motion.div hijo
                   anima opacity + y; si pongo translateX(-50%) en su
                   style, framer-motion lo sobreescribe con su propio
                   transform (combinación de y/x props), así que el pill
                   quedaba anclado a left:50% sin compensación y se
                   recortaba por la derecha del viewport. Separar el
                   centrador (CSS estático) del componente animado
                   (motion) preserva ambos comportamientos. */
                <div
                    style={{
                        position: "absolute",
                        top: "calc(env(safe-area-inset-top, 0px) + 142px)",
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 25,
                        padding: "0 16px",
                    }}
                >
                    <motion.div
                        key="rotate-hint"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{
                            duration: 0.55,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "7px 13px 7px 11px",
                            borderRadius: 999,
                            border: "1px solid rgba(126,224,255,0.45)",
                            background:
                                "linear-gradient(135deg, rgba(8,24,48,0.72), rgba(0,16,32,0.88))",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            boxShadow:
                                "0 0 28px rgba(0,194,255,0.32), inset 0 0 14px rgba(126,224,255,0.18)",
                            color: "#dffeff",
                            pointerEvents: "none",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            maxWidth: "100%",
                        }}
                    >
                        <motion.svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            animate={{ rotate: [0, -90, -90, 0, 0] }}
                            transition={{
                                duration: 2.4,
                                times: [0, 0.35, 0.55, 0.9, 1],
                                repeat: Infinity,
                                ease: [0.45, 0.05, 0.55, 0.95],
                            }}
                            style={{ display: "block", flexShrink: 0 }}
                        >
                            <rect
                                x="8"
                                y="2.5"
                                width="8"
                                height="19"
                                rx="1.8"
                                stroke="#dffeff"
                                strokeWidth="1.5"
                                fill="none"
                            />
                            <line
                                x1="10.5"
                                y1="5"
                                x2="13.5"
                                y2="5"
                                stroke="#dffeff"
                                strokeWidth="1.1"
                                strokeLinecap="round"
                            />
                            <circle cx="12" cy="19" r="0.8" fill="#dffeff" />
                        </motion.svg>
                        <span>Gira para experiencia inmersiva</span>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

/* ── Composite: monta todos los controles cuando hay nivel activo ─ */

function MobileTouchControls({
    api,
    snapshot,
    onBack,
    onTutorial,
    /* v2.19 — orientation reorganiza el HUD en landscape. */
    orientation = "portrait",
    /* v2.23 — levelKey se usa para re-disparar la pista de rotación
       cada vez que el Tripulante entra a una membrana nueva. */
    levelKey = null,
}: {
    api: GameApi | null
    snapshot: GameSnapshot
    onBack: () => void
    onTutorial: () => void
    orientation?: "portrait" | "landscape"
    levelKey?: number | string | null
}) {
    const fire = React.useCallback(() => api?.fire(), [api])
    const reload = React.useCallback(() => api?.reload(), [api])
    const setFreq = React.useCallback((f: Freq) => api?.setFreq(f), [api])
    const onAim = React.useCallback(
        (angle: number, mag: number) => {
            if (!api) return
            api.setAimAngle(angle)
        },
        [api]
    )
    const armSuper = React.useCallback(() => api?.armSuper(), [api])
    const cancelSuper = React.useCallback(() => api?.cancelSuper(), [api])
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 9,
            }}
        >
            {/* v2.20 — En landscape, banda de energía clavada al
                borde superior fuera del flex-column del HUD top. En
                portrait sigue viviendo dentro del HUD. */}
            {orientation === "landscape" && (
                <MobileEnergyTopBar energy={snapshot.energy} />
            )}
            <MobileTopHUD
                energy={snapshot.energy}
                streakCount={snapshot.streakCount}
                selected={snapshot.selected}
                codeSeq={snapshot.codeSeq}
                codeCursor={snapshot.codeCursor}
                codeFull={snapshot.codeFull}
                duoSeq={snapshot.duoSeq}
                duoCursor={snapshot.duoCursor}
                tripleSeq={snapshot.tripleSeq}
                tripleCursor={snapshot.tripleCursor}
                showCode={snapshot.showCode}
                showF3={snapshot.showF3}
                showF4={snapshot.showF4}
                superReady={snapshot.superReady}
                levelTitle={snapshot.levelTitle}
                nodesLeft={snapshot.nodesLeft}
                nodesTotal={snapshot.nodesTotal}
                isTutorial={snapshot.isTutorial}
                tutorialStep={snapshot.tutorialStep}
                onBack={onBack}
                onReload={reload}
                onTutorial={onTutorial}
                available={snapshot.available}
                harmonic={snapshot.harmonic}
                onPickFreq={setFreq}
                orientation={orientation}
            />
            {/* v2.23 — Pista de rotación se monta como sibling absoluto
                del HUD; queda visualmente entre la fila de pills (Código /
                F3 / F4) y el inicio del campo, sin pisar el canvas. */}
            <PortraitRotationHint
                orientation={orientation}
                levelKey={levelKey}
            />
            <MobileVirtualJoystick onAim={onAim} />
            {/* v2.8 — La paleta vuelve al área inferior pero ENCIMA del
                joystick + fuego (bottom 162) y centrada horizontalmente.
                Vive entre el canvas y los controles de acción, no choca
                con el área de los pulgares.
                v2.19 — En landscape, MobileFreqPalette se reposiciona a
                la derecha en columna apilada con offset del notch
                (safe-area-inset-right). El layout interno lo decide
                el propio componente vía orientation prop. */}
            <MobileFreqPalette
                selected={snapshot.selected}
                available={snapshot.available}
                harmonic={snapshot.harmonic}
                onPick={setFreq}
                orientation={orientation}
            />
            {/* v2.19 — En landscape mostramos las pills (Racha · Código
                · F4) como columna lateral izquierda con offset del
                notch del iPhone, en lugar de fila debajo del título.
                Permite que el campo central use toda la altura útil
                sin chocar con la cámara. */}
            {orientation === "landscape" && (
                <MobileSeqsColumn
                    streakCount={snapshot.streakCount}
                    selected={snapshot.selected}
                    superReady={snapshot.superReady}
                    codeSeq={snapshot.codeSeq}
                    codeCursor={snapshot.codeCursor}
                    codeFull={snapshot.codeFull}
                    duoSeq={snapshot.duoSeq}
                    duoCursor={snapshot.duoCursor}
                    tripleSeq={snapshot.tripleSeq}
                    tripleCursor={snapshot.tripleCursor}
                    showCode={snapshot.showCode}
                    showF3={snapshot.showF3}
                    showF4={snapshot.showF4}
                />
            )}
            <MobileFireButton
                onFire={fire}
                superArmed={snapshot.superArmed}
                selectedColor={FREQS[snapshot.selected].color}
            />
            <MobileSuperButton
                superReady={snapshot.superReady}
                superArmed={snapshot.superArmed}
                streakCount={snapshot.streakCount}
                onArm={armSuper}
                onCancel={cancelSuper}
                orientation={orientation}
            />
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   v2.16 — RotateHintOverlay
   Sugerencia visual ligera para que el Tripulante rote el celular a
   landscape. Aparece sobre el canvas (sin bloquear toques al joystick
   ni al fuego) cuando el simulador está activo en mobile + portrait.
   El botón "Rotar pantalla" intenta de nuevo el lock automático (Plan
   B: funciona en Android Chrome). El botón "Seguir así" descarta y
   sigue jugando portrait. Si el Tripulante rota manualmente, el
   overlay se desvanece solo (matchMedia detecta el cambio).
   ════════════════════════════════════════════════════════════════════ */
function RotateHintOverlay({
    onDismiss,
    onTryRotate,
}: {
    onDismiss: () => void
    onTryRotate: () => void
}) {
    const CYAN = "#00E5FF"
    /* v2.18 — Detectamos si el navegador soporta lock de orientación
       automático. Si SÍ (Android Chrome): botón "Rotar pantalla"
       intenta el flow + dismiss optimista. Si NO (Safari iOS, otros):
       botón cambia a "Entendido, rotaré" y agregamos un sub-tip que
       explica el bloqueo de orientación del Centro de Control —
       Zak ya tropezó con esto: el botón anterior llamaba a una
       función inerte y daba sensación de roto. */
    const [canLock] = React.useState<boolean>(() => supportsOrientationLock())
    const [showIosTip, setShowIosTip] = React.useState(false)
    return createPortal(
        <div
            style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
                zIndex: 1240,
                display: "flex",
                justifyContent: "center",
                padding: "0 16px",
                pointerEvents: "none",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: "100%",
                    maxWidth: 360,
                    padding: "16px 18px",
                    borderRadius: 18,
                    background:
                        "linear-gradient(180deg, rgba(8,18,34,0.94), rgba(2,6,16,0.98))",
                    border: `1px solid ${CYAN}55`,
                    boxShadow: `0 18px 40px rgba(0,0,0,0.55), 0 0 30px ${CYAN}33`,
                    color: "#E8F7FF",
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    pointerEvents: "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <motion.div
                        animate={{ rotate: [0, 90, 90, 0] }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.4, 0.7, 1],
                        }}
                        style={{
                            flexShrink: 0,
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={CYAN}
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect
                                x="6"
                                y="2.5"
                                width="12"
                                height="19"
                                rx="2.5"
                            />
                            <line x1="11" y1="19" x2="13" y2="19" />
                        </svg>
                    </motion.div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 9.5,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: CYAN,
                                opacity: 0.85,
                                marginBottom: 4,
                            }}
                        >
                            ◈ Vista AAA
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                lineHeight: 1.35,
                                color: "#FFFFFF",
                            }}
                        >
                            Rota tu celular para ocupar toda la pantalla.
                        </div>
                    </div>
                </div>
                {showIosTip && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "rgba(0,40,80,0.4)",
                            border: `1px solid ${CYAN}33`,
                            color: "rgba(220,238,252,0.92)",
                            fontSize: 11.5,
                            lineHeight: 1.4,
                            letterSpacing: "0.01em",
                        }}
                    >
                        Si no rota al girar el celular, abre el Centro de
                        Control y desactiva el bloqueo de orientación (candado
                        con flecha).
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 14,
                    }}
                >
                    <button
                        type="button"
                        onClick={onDismiss}
                        style={{
                            flex: 1,
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.16)",
                            background: "transparent",
                            color: "rgba(220,238,252,0.85)",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        Seguir así
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (canLock) {
                                /* Android Chrome: el browser sí soporta el
                               flow automático. Disparamos y cerramos
                               optimista — si falla por permisos, el
                               overlay reaparece al detectar portrait
                               de nuevo. */
                                onTryRotate()
                                onDismiss()
                            } else if (showIosTip) {
                                /* Segunda pulsada en iOS: ya leyó el tip,
                               cierra y deja jugar portrait sin hostigar.
                               Si después rota manualmente, el game se
                               adapta. */
                                onDismiss()
                            } else {
                                /* Primera pulsada en iOS Safari (sin
                               orientation.lock): mostramos el tip
                               explicativo del Centro de Control. */
                                setShowIosTip(true)
                            }
                        }}
                        style={{
                            flex: 1.2,
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "none",
                            background: `linear-gradient(180deg, ${CYAN}, #008fb5)`,
                            color: "#021018",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: `0 0 18px ${CYAN}55`,
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {canLock
                            ? "Rotar pantalla"
                            : showIosTip
                              ? "Entendido"
                              : "Cómo girar"}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}
RotateHintOverlay.displayName = "RotateHintOverlay"

/* ════════════════════════════════════════════════════════════════════
   v2.12 — GuardaTuTrayectoriaModal
   Invitación suave a crear cuenta gratis cuando un freebie cumple la
   primera Membrana sin sesión activa. Se muestra UNA sola vez por
   sesión del navegador (no acosa). El tripulante puede:
   - Crear cuenta (Clerk.openSignUp si está disponible)
   - Cerrar y seguir explorando (su progreso vive en localStorage hasta
     que el navegador lo limpie)
   ════════════════════════════════════════════════════════════════════ */
function GuardaTuTrayectoriaModal({ onClose }: { onClose: () => void }) {
    const GOLD = "#D4AF37"
    const CYAN = "#00E5FF"
    const SOFT = "#7DEFFF"

    /* v2.14 — handleDismiss purga el progreso local y cierra. Lo usan
       el botón X, el clic en el backdrop, ESC y la CTA explícita
       "No, gracias · Borrar progreso". Cualquier dismiss equivale a
       "no quiero anclar mi trayectoria" — coherente con el nuevo
       copy del cuerpo del modal. Las CTAs de registro/login NO usan
       handleDismiss; ellas preservan el progreso para migrarlo al
       perfil nuevo. */
    const handleDismiss = React.useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
        try {
            localStorage.removeItem(STORAGE_OWNER_KEY)
        } catch {}
        /* v2.15 — Borrar el flag de tutorial junto con el progreso
           para que el siguiente arranque del simulador empiece
           realmente desde cero (incluido el on-boarding). */
        try {
            localStorage.removeItem(MOBILE_TUTORIAL_KEY)
        } catch {}
        try {
            window.dispatchEvent(new Event("ndr-progress-hydrated"))
        } catch {}
        onClose()
    }, [onClose])

    React.useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleDismiss()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [handleDismiss])

    /* v2.13 — CTAs unificadas hacia Auth2Modal del Domo. Disparamos
       el evento rsv-open-auth-modal con view explícito ("register" |
       "login"); Auth2Modal v17.24+ lo lee del detail y abre el panel
       correcto. Cerramos la modal local antes para evitar dos overlays
       al mismo tiempo. Si Auth2Modal no respondiera al evento (caso
       teórico), confirmamos abriendo el modal igual desde Clerk.openSignIn/Up
       como triple-seguridad — patrón ya validado en SolarNav. */
    const openAuthPanel = (view: "register" | "login") => {
        onClose()
        try {
            window.dispatchEvent(
                new CustomEvent("rsv-open-auth-modal", {
                    detail: { view },
                })
            )
        } catch {}
        try {
            const stamp = (window as any).__rsvAuthModalStamp || 0
            if (Date.now() - stamp > 200) {
                const Clerk = (window as any).Clerk
                if (view === "register" && Clerk?.openSignUp) {
                    Clerk.openSignUp({
                        redirectUrl: window.location.href,
                        afterSignUpUrl: window.location.href,
                    })
                } else if (view === "login" && Clerk?.openSignIn) {
                    Clerk.openSignIn({
                        redirectUrl: window.location.href,
                        afterSignInUrl: window.location.href,
                    })
                }
            }
        } catch {}
    }
    const handleCreateAccount = () => openAuthPanel("register")
    const handleSignIn = () => openAuthPanel("login")

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={handleDismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1250,
                background: "rgba(2,5,12,0.78)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 18px",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 26, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "min(460px, 100%)",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    padding: "48px 28px 28px",
                    borderRadius: 22,
                    background:
                        "radial-gradient(120% 100% at 50% -10%, rgba(0,229,255,0.14), transparent 55%), rgba(8,12,22,0.95)",
                    border: `1px solid ${CYAN}44`,
                    boxShadow: `0 0 60px rgba(0,229,255,0.18), inset 0 0 50px rgba(0,0,0,0.5)`,
                    color: "#E8F7FF",
                    textAlign: "center",
                }}
            >
                <button
                    onClick={handleDismiss}
                    aria-label="Cerrar y borrar progreso"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 14,
                        background: "transparent",
                        border: "none",
                        color: "#E8F7FF",
                        fontSize: 22,
                        fontWeight: 200,
                        cursor: "pointer",
                        opacity: 0.65,
                        padding: "6px 10px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.65")
                    }
                >
                    ×
                </button>

                <div
                    style={{
                        fontSize: 10,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: SOFT,
                        opacity: 0.8,
                        marginBottom: 8,
                        fontWeight: 600,
                    }}
                >
                    ◈ Membrana 1 cumplida
                </div>

                <h2
                    style={{
                        margin: "0 0 14px",
                        fontSize: 26,
                        fontWeight: 200,
                        letterSpacing: "0.04em",
                        lineHeight: 1.2,
                        color: "#FFFFFF",
                        textShadow: `0 0 18px ${CYAN}55`,
                    }}
                >
                    Guarda tu trayectoria
                </h2>

                <p
                    style={{
                        margin: "0 auto 26px",
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        color: "rgba(232,247,255,0.82)",
                        maxWidth: 380,
                        whiteSpace: "pre-line",
                    }}
                >
                    Crea tu cuenta gratis para que el Sol ancle tu trayectoria.
                    Sin cuenta no podemos guardar tu avance.
                    {"\n"}Si cierras este aviso tu progreso se borra.
                </p>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleCreateAccount()
                    }}
                    style={{
                        display: "block",
                        width: "100%",
                        maxWidth: 360,
                        margin: "0 auto 12px",
                        padding: "14px 22px",
                        borderRadius: 14,
                        border: "none",
                        background: `linear-gradient(180deg, ${CYAN}, #008fb5)`,
                        color: "#021018",
                        fontWeight: 700,
                        fontSize: 13.5,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: `0 0 26px ${CYAN}55`,
                        transition:
                            "transform 0.18s ease, box-shadow 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = `0 0 38px ${CYAN}88`
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = `0 0 26px ${CYAN}55`
                    }}
                >
                    Crear mi cuenta gratis
                </button>

                {/* v2.13 — CTA secundaria: si el tripulante ya tenía
                    cuenta y olvidó iniciar sesión, este botón lo lleva
                    al panel de inicio de sesión de la Auth2Modal.
                    v2.14 — Dos líneas: jerarquía visual primario =
                    "Ya tengo cuenta", secundario = "Iniciar sesión". */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSignIn()
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        width: "100%",
                        maxWidth: 360,
                        margin: "0 auto 14px",
                        padding: "12px 22px",
                        borderRadius: 14,
                        border: `1px solid ${CYAN}55`,
                        background: "transparent",
                        color: SOFT,
                        cursor: "pointer",
                        transition:
                            "background 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${CYAN}14`
                        e.currentTarget.style.borderColor = `${CYAN}aa`
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.borderColor = `${CYAN}55`
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "#FFFFFF",
                        }}
                    >
                        Ya tengo cuenta
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: SOFT,
                            opacity: 0.85,
                        }}
                    >
                        Iniciar sesión
                    </span>
                </button>

                {/* v2.14 — Seguir sin guardar = handleDismiss
                    (borra progreso + cierra). Mismo flujo que la X y
                    el clic en backdrop. Coherente con el copy: si el
                    Tripulante elige no anclarse, su trayectoria
                    desaparece. */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss()
                    }}
                    style={{
                        display: "block",
                        margin: "0 auto",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        color: "rgba(180,225,240,0.6)",
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#7DEFFF")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(180,225,240,0.6)")
                    }
                >
                    No, gracias · Borrar progreso
                </button>
            </motion.div>
        </motion.div>,
        document.body
    )
}
GuardaTuTrayectoriaModal.displayName = "GuardaTuTrayectoriaModal"
