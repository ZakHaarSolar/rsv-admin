// NavegadorEstacion.tsx v4.24
// v4.24 (2026-08-03) — 🜂 "Meditaciones" sale de la barra del modo Madre: la
// capa pública se retiró (viven en la Holoteca del Escáner) y la ruta lleva a
// la descarga de la app. El submenú de Holoteca del modo Escáner NO se toca.
// v4.23 (2026-07-27) — "Sesiones" sale de la barra del Centro de Mando (por ahora
// no se ofrecen grupales ni 1:1). La ruta /sesiones sigue viva: el interruptor
// del Motor decide si muestra la pantalla de cortesía o la oferta.
// v4.22.2 — Hot fix: el listener leía el tab activo desde un ref
// que no siempre se actualizaba tras la primera navegación, así que
// las rotaciones sucesivas arrancaban desde el tab viejo (pasaba de
// Radar a Calibración bien, pero la siguiente flecha usaba Radar
// como ancla → ← te llevaba a Núcleo aunque estuvieras en Calibración).
// Ahora la resolución del tab activo se hace desde
// window.location.pathname en vivo dentro del handler, garantizando
// que cada rotación parte de la pestaña visualmente activa.
// v4.22.1 — Restricción del listener al modo Escáner SOLAMENTE
// (pedido de Zak). En el modo Madre (rutas /, /codices, /sesiones,
// etc.) las flechas del teclado NO rotan pestañas. Además se
// refuerza el fallback de `currentId` cuando `active` no se resuelve
// al primer render: usa el primer tab del modo actual como ancla.
// Eso destraba el listener cuando el hash inicial no coincide con
// ninguna ruta conocida.
// v4.22 — Navegación con flechas del teclado en la barra superior.
// Arrow Left / Arrow Right rotan entre las pestañas del modo activo
// (Madre o Escáner). Si el tripulante está en una sub-capa (ej.
// pilar de Calibración con libros sagrados abiertos), Arrow Left
// dispara el botón "Volver" que ya existe (busca
// [data-rsv-back-button] en el DOM y simula click) en lugar de
// rotar pestañas. Arrow Right en sub-capa NO actúa. Ignora el
// evento si el foco está en input/textarea/contenteditable.
// v4.21 — Fix del flow correcto del press-and-drag (replica fiel del
// BottomNav mobile v2.21+). El comportamiento que Zak siempre quiso:
//   • pointerdown sobre un tab → navegamos a esa capa AL INSTANTE,
//     sin esperar pointerup. Idéntico a mobile.dragActivate().
//   • mientras sigue presionado, si el cursor cruza a otro tab →
//     navegamos a ese tab al instante (cross-tab live).
//   • al soltar (pointerup), si el cursor está sobre un elemento
//     clickable del contenido (button/anchor/role=button) →
//     ejecutamos target.click() programático.
// Las versiones v4.11-v4.20 esperaban a pointerup para navegar, lo
// que dejaba el press largo "muerto" durante los segundos de hold.
// v4.20 — Fix del "press largo no navega". v4.19 dejaba el caso
// "moved=true + cursor sobre el startTab" sin acción: el sameAnchor
// guard saltaba el target.click() (correcto, evita doble fire) pero
// el click natural del <a> tampoco siempre dispara cuando hay drag
// real (aunque sea por vibración mínima del mouse). Resultado: press
// largo con cursor casi inmóvil → no abre la capa. Fix: si moved=true
// y el cursor terminó sobre el startTab (o fuera de cualquier tab y
// sin target), navegamos manualmente al startTab. Garantía: el
// press-and-drag SIEMPRE termina en alguna navegación (target del
// contenido, otro tab, o el startTab original).
// v4.19 — Re-scope del press-and-drag tras conversación con Zak. El
// objetivo NO era abrir el submenú educativo de Holoteca al press
// (eso era una sobre-interpretación mía). El objetivo correcto:
//   • Click puro en cualquier tab (Radar/Calibración/Holoteca/Núcleo)
//     navega a esa capa, idéntico al comportamiento original.
//   • Press + drag hacia un elemento clickable del CONTENIDO de la
//     página debajo (cualquier <button>, <a> o role="button"), suelta
//     → ese elemento se activa. Igual que mobile BottomNav.
//   • El submenú educativo de Holoteca queda EXCLUSIVO del hover puro
//     (comportamiento original de v4.10). Press no lo dispara.
// Cambios concretos vs v4.18:
//   1. Removido todos los console.log de diagnóstico (v4.14-v4.18).
//   2. Removido setDragHoveredTabId(tabId) instantáneo del pointerdown
//      (era el causante de abrir el submenú al press, no deseado).
//   3. dragHoveredTabId ahora solo se setea durante drag activo
//      (moved > 6px) cuando el cursor está sobre OTRO tab — sirve
//      como feedback visual leve (forceLit) sin abrir submenu alguno.
//   4. sameAnchor logic se queda solo para evitar doble-fire del
//      mismo <a> principal del startTab. data-submenu-item permite
//      que un drag a un item del submenú (si está abierto por hover)
//      siga ejecutando target.click() sin bloqueo.
// v4.17 — Reverso del setPointerCapture de v4.16: rompía el click
// natural del <a> (al capturar el pointer en el motion.div, el evento
// click no se dispara en el <a> → la navegación normal a Calibración/
// Núcleo dejaba de funcionar). La hipótesis de drag nativo del link
// quedó descartada por los logs de v4.16: pointercancel nunca se
// dispara — el cleanup solo corre tras pointerup natural. Por lo
// tanto el submenú SÍ se abre en press; el malentendido es que Zak
// estaba probando Calibración (sin submenú) en lugar de Holoteca
// (único tab con submenú declarado). v4.17 deja los logs vivos para
// confirmar el caso real con Holoteca.
// v4.16 — Fix de raíz + diagnóstico capa 3. Los logs de v4.14/v4.15
// confirman que el pointerdown llega completo (al <a>, al motion.div
// delegation, a handleTabPointerDown, y setDragHoveredTabId corre).
// Pero el submenú no abre. La única explicación: cleanup se ejecuta
// inmediatamente porque el browser dispara pointercancel al
// interpretar el press sobre <a href> como inicio de drag nativo
// del link. Fix: setPointerCapture(pointerId) sobre el motion.div en
// pointerdown — fuerza al browser a entregar todos los eventos
// siguientes al motion.div (no al <a>), eliminando la posibilidad
// de drag nativo. Sumamos logs en cleanup/onUp/onCancel para
// confirmar la hipótesis si el fix no fuese suficiente.
// v4.15 — Diagnóstico capa 2: log al render del componente (confirma
// versión cargada) + log directo dentro del onPointerDown de CADA
// <a> de tab (no solo del motion.div padre). Resultado:
//   • Si Zak no ve "v4.15 mounted"  → bundle viejo cacheado.
//   • Si ve "v4.15 mounted" pero ningún pointerdown → algún elemento
//     intermedio captura el evento antes de llegar al <a>.
//   • Si ve pointerdown del <a> pero NO el del motion.div → bubbling
//     roto, hay que mover el handler al <a> directamente (no
//     delegation).
//   • Si ve ambos → el state machine no está propagando el setState.
// REMOVER todos los logs en v4.16 una vez localizado el bug.
// v4.14 — Logs temporales de diagnóstico (console.log con prefijo
// [NavEst]) en el delegation handler del motion.div y en
// handleTabPointerDown. Permite a Zak capturar el flow exacto del
// pointerdown via snippet rsvDump y compartir el output sin tener
// que mirar la consola entera. Zero cambio funcional vs v4.13.
// v4.13 — Press-and-drag verdaderamente al instante (replica BottomNav
// mobile). Tres correcciones del v4.12 que impedían el cross-tab
// drag desde Calibración/Radar/Núcleo hacia un item del submenú de
// Holoteca:
//   (1) En pointerdown sobre cualquier tab seteamos dragHoveredTabId
//       = tabId AL INSTANTE (sin esperar 6px). Si el tab tiene submenú
//       (Holoteca), el panel aparece al pico — el tripulante puede
//       deslizar el cursor hacia abajo sin "ir a ciegas". Si suelta
//       sin moverse, el cleanup cierra el submenú y el onClick del <a>
//       navega normal a /escaner/holoteca.
//   (2) onMove ahora actualiza dragHoveredTabId con findTabIdAt en
//       cada movimiento, sin gatear por el flag `moved`. El threshold
//       de 6px sigue vivo solo para distinguir click puro de drag en
//       el onUp (idem mobile). Resultado: arrancar en Calibración,
//       cruzar a Holoteca, abre su submenú apenas el cursor entra al
//       rect del tab, no después de N pixeles extra.
//   (3) sameAnchor en onUp diferencia entre el <a> principal del tab
//       y los <a> del submenú vía atributo data-submenu-item. Antes el
//       guard agrupaba ambos bajo el mismo data-nav-tab="holoteca" →
//       cualquier drag a Códices/Meditaciones desde Holoteca era
//       silenciosamente bloqueado y la navegación nunca disparaba.
//       Ahora los items del submenú siempre ejecutan target.click() y
//       la navegación corre.
// v4.12 — Fix del press-and-drag de v4.11: cuando el tripulante
// picaba un tab y arrastraba, el browser arrancaba un drag nativo
// del <a href="..."> (con el ghost icono del link) y eso intercepta
// los pointermove globales — mi listener no recibía nada y el
// dragHoveredTabId nunca cambiaba. Fix: draggable={false} + onDragStart
// con preventDefault tanto en los <a> de los tabs como en los items
// del submenú. Sumamos userSelect:none / WebkitUserSelect:none /
// WebkitUserDrag:none al style para sellar el comportamiento en
// Safari + Chrome + Firefox por igual.
// v4.11 — Press-and-drag estilo BottomNav del [LENTE] llevado al
// [CENTRO DE MANDO]. El tripulante puede picar Holoteca, mantener
// el botón apretado, deslizar el cursor al item Meditaciones del
// submenú, soltar y aterriza directo en /escaner/holoteca/meditaciones
// — sin tener que liberar el click ni recorrer el dropdown manualmente.
// Implementación: overlay invisible sobre los tabs captura
// pointerdown, listeners globales en window track el move/up,
// findTabIdAt usa getBoundingClientRect contra data-nav-tab,
// findContentTargetAt salta a buttons/anchors fuera de la nav. El
// submenú se fuerza abierto durante el drag mediante prop
// forceSubmenuOpen pasado al TabButton bajo el cursor.
// v4.10 — Submenú didáctico en HOLOTECA (modo Escáner desktop). Al
// hover sobre el tab Holoteca se despliega un panel glassmorphism
// con la lista interna del Tesseracto: Códices de Luz, Meditaciones,
// Fragmentos del Sol, Códigos Fuente. Cada item navega a la
// sub-ruta canónica /escaner/holoteca/<sub>. Hover-bridge de 120ms
// permite cruzar del tab al panel sin que se cierre. Resultado: el
// tripulante venido del Ecosistema Madre (donde el botón se llama
// "Códices de Luz") no se desorienta cuando el shell del Escáner
// usa "Holoteca" — el panel le revela el mapa interno sin obligarlo
// a re-aprender vocabulario.
// v4.9 — Doble set de tabs según contexto (mismo patrón que el HUD
// del SolarNav móvil):
//   • modo Madre (cualquier ruta NO /escaner/*): tabs ORIGEN ·
//     CÓDICES · MEDITACIONES · SESIONES · FRAGMENTOS · SIMULADORES
//     (una palabra cada una, sin íconos para diferenciar visualmente
//     del Escáner). El tab activo se determina por path.
//   • modo Escáner (/escaner/*): tabs RADAR · CALIBRACIÓN ·
//     HOLOTECA · NÚCLEO con íconos como antes. Tab activo por
//     currentTabId + hash igual que en v4.8.
// La barra detecta el path actual via window.location.pathname y
// listener "rsv-navigate" — Domo no necesita pasar prop nuevo.
// v4.8 — El botón "Radar" ahora apunta a /escaner/radar (path
// canónico del Radar tras Domo v4.56). Para invitados sigue
// apuntando a /radar (Portal de Inducción público). El alias
// /escaner sigue funcionando (el shell lo reescribe a
// /escaner/radar via replaceState).
// v4.7 — Rename del primer tab: "Escáner" → "Radar". El botón sigue
// apuntando a /escaner (ruta sin cambio — la app entera se llama
// Escáner Vibracional, esa pantalla específica con el hexágono es
// el Radar). Para invitados sigue apuntando a /radar (Portal de
// Inducción público, fachada educativa). Hrefs de Calibración,
// Holoteca y Núcleo migrados a las rutas canónicas anidadas bajo
// /escaner: /escaner/calibracion, /escaner/holoteca, /escaner/nucleo.
// v4.6 — TabButton siempre clickeable. Antes el botón activo tenía
// `pointerEvents: "none"` y `cursor: "default"` para indicar
// visualmente que ya estabas en esa capa. Pero como las sub-rutas
// de Holoteca reportan "holoteca" como tab activa, picar Holoteca
// estando en /holoteca/meditaciones quedaba bloqueado por el
// pointer-events:none → no se podía volver al grid de Holoteca.
// Ahora todos los tabs aceptan click siempre; el indicador visual
// de "activo" queda en el accent color/glow, no en el cursor.
// rsvNavigate ya hace short-circuit si target === current.
// v4.5 — Calibración pasa a tener URL propia. href cambia de
// /escaner#protocolos → /calibracion. La capa de Calibración deja
// de vivir como sub-vista del Escáner; ahora es un módulo de
// primera clase de la barra de mando, igual que Holoteca o Núcleo.
// PATH_TO_TAB de Domo mapea /calibracion → "modulos" para que la
// barra siga iluminando el botón correcto.
// v4.4 — Rename: tab "Protocolos" → "Calibración" (label visible y
// optionTitles del property control).
// NavegadorEstacion.tsx v4.3
// v4.3 — Toda la navegación pasa por rsvNavigate (SPA con pushState +
// dispatch rsv-navigate). Antes intentábamos cambiar el hash con
// replaceState + dispatch HashChangeEvent sintético cuando ya estábamos
// en /escaner, pero el evento sintético no siempre llegaba al listener
// → el switch entre Radar y Protocolos quedaba intermitente. Ahora un
// solo camino, predecible.
// Barra del [CENTRO DE MANDO] (desktop) reescrita con la geometría
// sagrada del Dock interno del Escáner: gradiente azul-noche + cyan,
// shimmer fantasma, blur + glow neón, pill 999. 4 tabs unificadas con
// la app del [LENTE]: Escáner · Protocolos · Holoteca · Núcleo.
//
// Layout horizontal por botón: SVG izquierda + texto derecha — el
// sistema nervioso reconoce el símbolo antes que la palabra. Al activo
// se le enciende el cyan (drop-shadow + text-shadow + color accent);
// el resto queda gris-estelar a 0.62 (mismo white-tone que el Dock).
//
// Doble estado del botón ESCÁNER (v4.1):
//   Si Clerk.user está hidratado  → href = /escaner (la herramienta)
//   Si invitado / sin sesión       → href = /radar (Portal de Inducción)
// La fricción cero: que el explorador toque ESCÁNER y caiga en la
// fachada educativa antes de pedirle credenciales; el tripulante
// anclado entra directo al Radar.
//
// El estado activo se computa por pathname + hash:
//   /radar                   → tab "escaner" activo (cuando invitado)
//   /escaner                 → tab "escaner" activo
//   /escaner#protocolos      → tab "modulos" activo
//   /escaner#decodificador   → tab "decodificador" activo (mobile-only)
//   /holoteca                → tab "holoteca" activo
//   /nucleo                  → tab "nucleo" activo
//   resto                    → ninguno (pill sin glow)
//
// Click PROTOCOLOS estando en /escaner cambia hash sin recarga; el
// Escáner escucha hashchange y conmuta mainView. Click PROTOCOLOS
// estando fuera de /escaner navega a /escaner#protocolos.
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import Shared from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"

const { hx } = Shared
const { IMod, IHoloteca, IEscaner, INucleo } = Icons

/* ───────── Tabs spec ───────── */

type TabId =
    | "radar"
    | "modulos"
    | "holoteca"
    | "escaner"
    | "nucleo"
    | "decodificador"
    /* v4.9 — IDs del modo Madre. Un id por tab pública. */
    | "origen"
    | "codices"
    | "meditaciones"
    | "sesiones"
    | "fragmentos"
    | "simuladores"
    | "ninguna"

type SubItem = { label: string; href: string }
type TabSpec = {
    id: TabId
    label: string
    href: string
    icon: React.ReactNode
    /* v4.10 — Submenú didáctico para HOLOTECA desktop. Cuando el
       tripulante hace hover sobre el botón se despliega un panel
       glassmorphism con la lista interna del Tesseracto (Códices,
       Meditaciones, Fragmentos, Códigos Fuente). Resultado: el usuario
       venido del Ecosistema Madre ("Códices de Luz") encuentra su
       activo aunque la nav del Escáner use otro vocabulario
       ("Holoteca"). En móvil este submenú no aplica — la BottomNav
       del shell ya navega por sub-tabs explícitos. */
    submenu?: SubItem[]
}

/* v4.7 — Tabs canónicos. Primer botón se llama "Radar" (label
   visible) y apunta a /escaner para tripulantes / /radar para
   invitados (Portal de Inducción público). La app entera sigue
   llamándose Escáner Vibracional; "Radar" es la pantalla del
   hexágono — distinción semántica importante en la nav. Calibración,
   Holoteca y Núcleo cuelgan bajo /escaner/<sub>. */
const buildTabs = (escanerHref: string): TabSpec[] => [
    { id: "escaner", label: "Radar", href: escanerHref, icon: <IEscaner /> },
    {
        id: "modulos",
        label: "Calibración",
        href: "/escaner/calibracion",
        icon: <IMod />,
    },
    {
        id: "holoteca",
        label: "Holoteca",
        href: "/escaner/holoteca",
        icon: <IHoloteca />,
        submenu: [
            { label: "Códices de Luz", href: "/escaner/holoteca/codices" },
            { label: "Meditaciones", href: "/escaner/holoteca/meditaciones" },
            { label: "Fragmentos del Sol", href: "/escaner/holoteca/fragmentos" },
            { label: "Códigos Fuente", href: "/escaner/holoteca/codigos" },
            /* v4.X — Simuladores en Holoteca desktop. Apunta a la
               misma ruta que el sub-tab mobile; el shell del Escáner
               lo levanta correctamente y abre Navegantes de la Red
               con su consola de selección. Si en el futuro hay más
               simuladores (Domo Cero ya vive en su propia card del
               hub mobile), este item sigue siendo el ingreso al hub
               de simulación. */
            { label: "Simuladores", href: "/escaner/holoteca/simuladores" },
        ],
    },
    {
        id: "nucleo",
        label: "Núcleo",
        href: "/escaner/nucleo",
        icon: <INucleo />,
    },
]

/* v4.9 — Tabs del modo Madre. Una palabra cada uno, sin íconos
   (texto puro para diferenciar visualmente del modo Escáner que
   sí porta geometría sagrada). Iconos undefined → TabButton
   renderiza solo el span del label. */
const buildMadreTabs = (): TabSpec[] => [
    { id: "origen", label: "Origen", href: "/", icon: null },
    {
        id: "codices",
        label: "Códices",
        href: "/codices",
        icon: null,
    },
    /* 🜂 2026-08-03 — "Meditaciones" sale de la barra del Centro de Mando:
       la capa pública se retiró (viven en la Holoteca del Escáner). La ruta
       /meditaciones queda viva y lleva a la descarga de la app.
    {
        id: "meditaciones",
        label: "Meditaciones",
        href: "/meditaciones",
        icon: null,
    },
    */
    /* 2026-07-27 — "Sesiones" sale de la barra (pedido de Zak: por ahora no se
       ofrecen ni grupales ni 1:1). La RUTA sigue viva: quien llegue por un link
       viejo a /sesiones ve la pantalla de cortesía si el interruptor del Motor
       está encendido, o la oferta normal si se vuelve a abrir. Para reponer la
       pestaña, descomentar este bloque.
    {
        id: "sesiones",
        label: "Sesiones",
        href: "/sesiones",
        icon: null,
    },
    */
    {
        id: "fragmentos",
        label: "Fragmentos",
        href: "/fragmentos",
        icon: null,
    },
    {
        id: "simuladores",
        label: "Simuladores",
        href: "/simuladores",
        icon: null,
    },
]

/* v4.9 — Resolve del tab activo en modo Madre por pathname. */
function resolveMadreTab(path: string): TabId | null {
    const p = (path || "").toLowerCase()
    if (p === "/" || p === "/home") return "origen"
    if (p === "/codices") return "codices"
    if (p === "/meditaciones") return "meditaciones"
    if (p === "/sesiones") return "sesiones"
    if (p === "/fragmentos" || p === "/fragmentosdelsol")
        return "fragmentos"
    if (p === "/simuladores") return "simuladores"
    return null
}

/* v4.9 — Estamos en modo Escáner si el path es la app del Escáner.
   /nucleo SE QUEDA en modo Madre (es la ruta pública del Núcleo
   tras Domo v4.58). /calibracion y /holoteca/* legacy redirigen a
   /escaner/* via Domo, así que el render real cae en modo Escáner.
   /radar es Portal de Inducción público — entra a modo Escáner
   para que el visitante vea la barra del Escáner ya en la fachada. */
function isEscanerPath(path: string): boolean {
    const p = (path || "").toLowerCase()
    return (
        p === "/radar" ||
        p === "/escaner" ||
        p.startsWith("/escaner/") ||
        p === "/calibracion" ||
        p === "/holoteca" ||
        p.startsWith("/holoteca/")
    )
}

/* Resolve qué TabId corresponde al currentTabId crudo + hash en vivo.
   v4.1 — /radar (Portal de Inducción) ilumina el tab "escaner" porque
   ese mismo botón es el que lleva al invitado ahí. Mantener la unidad
   visual del recorrido — para el tripulante el link es uno solo, lo que
   cambia es la cara que ve según haya sesión o no. */
function resolveActiveTab(currentTabId: string, hash: string): TabId | null {
    const norm = (currentTabId || "").toLowerCase() as TabId
    if (norm === "escaner" || norm === "radar") {
        const h = (hash || "").toLowerCase().replace(/^#/, "")
        if (h === "protocolos" || h === "modulos") return "modulos"
        if (h === "decodificador") return "decodificador"
        return "escaner"
    }
    if (
        norm === "modulos" ||
        norm === "holoteca" ||
        norm === "nucleo" ||
        norm === "decodificador"
    ) {
        return norm
    }
    return null
}

/* ───────── Tab button ───────── */

function TabButton({
    spec,
    active,
    accent,
    onClick,
    onSubmenuNavigate,
    forceSubmenuOpen = false,
    forceLit = false,
}: {
    spec: TabSpec
    active: boolean
    accent: string
    onClick: () => void
    onSubmenuNavigate?: (href: string) => void
    /* v4.11 — Cuando el press-and-drag global tiene el cursor sobre
       este tab, abrimos el submenú aunque el cursor no esté técnicamente
       sobre el wrapper del TabButton (el overlay del drag intercepta
       los mouse events). forceLit pinta el tab con el glow del accent
       igual que si estuviera activo. */
    forceSubmenuOpen?: boolean
    forceLit?: boolean
}) {
    const [hovered, setHovered] = React.useState(false)
    const [submenuHovered, setSubmenuHovered] = React.useState(false)
    const closeTimer = React.useRef<any>(null)
    const lit = active || hovered || submenuHovered || forceLit
    const inactive = "rgba(255,255,255,0.62)"
    const showSubmenu =
        !!spec.submenu &&
        spec.submenu.length > 0 &&
        (hovered || submenuHovered || forceSubmenuOpen)

    /* v4.10 — Hover-bridge: pequeña tolerancia al cruzar del tab al
       panel del submenú. Sin esta gracia, el panel se cierra cuando
       el cursor pasa por el gap entre el botón y el dropdown. */
    const handleMouseEnter = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
        setHovered(true)
    }
    const handleMouseLeave = () => {
        closeTimer.current = setTimeout(() => setHovered(false), 120)
    }
    const handleSubmenuEnter = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
        setSubmenuHovered(true)
    }
    const handleSubmenuLeave = () => {
        closeTimer.current = setTimeout(() => setSubmenuHovered(false), 120)
    }

    return (
        <div
            data-nav-tab={spec.id}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <a
                href={spec.href}
                onClick={(e) => {
                    e.preventDefault()
                    onClick()
                }}
                /* v4.12 — draggable={false} + onDragStart preventDefault
                   evita que el browser arranque un drag nativo del link
                   (con ghost icono y URL) cuando el tripulante hace
                   press-and-drag. Sin esto, el drag nativo intercepta
                   el pointermove y mi listener global nunca se entera
                   del movimiento — el submenú nunca se abre durante
                   el deslice. */
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                aria-current={active ? "page" : undefined}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 16px",
                    border: "none",
                    background: "transparent",
                    color: lit ? accent : inactive,
                    /* v4.6 — Siempre cursor:pointer y pointerEvents:auto,
                       incluso para el tab activo. Las sub-rutas de
                       Holoteca (/holoteca/codices, etc) iluminan
                       "Holoteca" pero el tripulante necesita poder
                       re-picar Holoteca para volver al grid principal.
                       rsvNavigate ya descarta navegación same-path. */
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "'Inter',sans-serif",
                    minHeight: 44,
                    textDecoration: "none",
                    pointerEvents: "auto",
                    zIndex: 1,
                    transition: "color 0.18s ease",
                    /* v4.12 — sella el contenido contra drag/select
                       nativo en Safari + Chrome + Firefox. */
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitUserDrag: "none" as any,
                }}
            >
                {spec.icon && (
                    <motion.div
                        animate={{ scale: active ? 1.08 : 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 22,
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            filter: lit
                                ? `drop-shadow(0 0 6px ${hx(accent, 0.85)}) drop-shadow(0 0 14px ${hx(accent, 0.45)})`
                                : "none",
                            transition: "filter 0.25s ease",
                        }}
                    >
                        {spec.icon}
                    </motion.div>
                )}
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: active ? 600 : 500,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        textShadow: lit
                            ? `0 0 8px ${hx(accent, 0.55)}, 0 0 16px ${hx(accent, 0.25)}`
                            : "none",
                        transition: "text-shadow 0.25s ease",
                    }}
                >
                    {spec.label}
                </span>
            </a>
            <AnimatePresence>
                {showSubmenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        onMouseEnter={handleSubmenuEnter}
                        onMouseLeave={handleSubmenuLeave}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 12px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            minWidth: 220,
                            padding: 6,
                            borderRadius: 14,
                            background: `linear-gradient(155deg, rgba(8,24,48,0.92) 0%, rgba(5,16,34,0.96) 60%, rgba(8,24,48,0.92) 100%), ${hx(accent, 0.05)}`,
                            border: `1px solid ${hx(accent, 0.32)}`,
                            backdropFilter:
                                "blur(22px) saturate(160%) brightness(1.06)",
                            WebkitBackdropFilter:
                                "blur(22px) saturate(160%) brightness(1.06)",
                            boxShadow: [
                                `0 12px 36px rgba(0,0,0,0.45)`,
                                `0 0 22px ${hx(accent, 0.16)}`,
                                `inset 0 1px 0 rgba(255,255,255,0.10)`,
                            ].join(", "),
                            zIndex: 1000,
                            pointerEvents: "auto",
                        }}
                    >
                        {/* tip suave */}
                        <span
                            style={{
                                position: "absolute",
                                top: -5,
                                left: "50%",
                                transform: "translateX(-50%) rotate(45deg)",
                                width: 10,
                                height: 10,
                                background: `linear-gradient(155deg, rgba(8,24,48,0.92), rgba(5,16,34,0.96))`,
                                borderTop: `1px solid ${hx(accent, 0.32)}`,
                                borderLeft: `1px solid ${hx(accent, 0.32)}`,
                            }}
                        />
                        {spec.submenu!.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                /* v4.13 — data-submenu-item permite al
                                   handler de press-and-drag distinguir
                                   este <a> del <a> principal del tab.
                                   Sin esta marca, sameAnchor lo agrupa
                                   bajo data-nav-tab="holoteca" y bloquea
                                   el target.click() por error. */
                                data-submenu-item="true"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (onSubmenuNavigate)
                                        onSubmenuNavigate(item.href)
                                    setHovered(false)
                                    setSubmenuHovered(false)
                                }}
                                /* v4.12 — mismo sello anti-drag-nativo
                                   que el <a> del tab principal. */
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                    display: "block",
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    color: "rgba(255,255,255,0.78)",
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    textDecoration: "none",
                                    transition: "all 0.18s ease",
                                    whiteSpace: "nowrap",
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    WebkitUserDrag: "none" as any,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = hx(
                                        accent,
                                        0.10
                                    )
                                    e.currentTarget.style.color = accent
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        "transparent"
                                    e.currentTarget.style.color =
                                        "rgba(255,255,255,0.78)"
                                }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ───────── Props ───────── */

type Props = {
    currentTabId?: string
    accentColor?: string
    barOpacity?: number
}

/* ───────── Componente principal ───────── */

function NavegadorEstacion({
    currentTabId = "ninguna",
    accentColor = "#00C2FF",
    barOpacity = 1,
}: Props) {
    const [hash, setHash] = React.useState<string>(() => {
        if (typeof window === "undefined") return ""
        return window.location.hash || ""
    })
    React.useEffect(() => {
        if (typeof window === "undefined") return
        /* v4.2 — Escuchamos hashchange (cambio dentro de misma ruta)
           y también rsv-navigate (pushState que cambia ruta + hash al
           mismo tiempo, ej. /origen → /escaner#protocolos). Sin el
           segundo listener, el badge "Protocolos" no se ilumina
           cuando se entra desde otra capa. */
        const tick = () => setHash(window.location.hash || "")
        window.addEventListener("hashchange", tick)
        window.addEventListener("rsv-navigate", tick)
        window.addEventListener("popstate", tick)
        return () => {
            window.removeEventListener("hashchange", tick)
            window.removeEventListener("rsv-navigate", tick)
            window.removeEventListener("popstate", tick)
        }
    }, [])

    /* v4.1 — Polling de window.Clerk.user para el doble estado del
       botón ESCÁNER. Sin sesión → el botón apunta a /radar (Portal de
       Inducción educativo). Con sesión → /escaner (la herramienta). */
    const [hasSession, setHasSession] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false
        return !!(window as any).Clerk?.user?.id
    })
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => {
            const next = !!(window as any).Clerk?.user?.id
            setHasSession((prev) => (prev === next ? prev : next))
        }
        const iv = setInterval(tick, 800)
        return () => clearInterval(iv)
    }, [])

    /* v4.8 — Tripulantes con sesión van al canónico /escaner/radar.
       Invitados van a /radar (Portal de Inducción público). */
    const escanerHref = hasSession ? "/escaner/radar" : "/radar"

    /* v4.9 — Live pathname para decidir modo Madre vs modo Escáner.
       Mismo listener que el hash (rsv-navigate + popstate cubren
       SPA navigations + back/forward del browser). */
    const [pathname, setPathname] = React.useState<string>(() => {
        if (typeof window === "undefined") return ""
        return window.location.pathname || ""
    })
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => setPathname(window.location.pathname || "")
        window.addEventListener("rsv-navigate", tick)
        window.addEventListener("popstate", tick)
        return () => {
            window.removeEventListener("rsv-navigate", tick)
            window.removeEventListener("popstate", tick)
        }
    }, [])

    const escanerMode = isEscanerPath(pathname)
    const tabs = React.useMemo(
        () =>
            escanerMode
                ? buildTabs(escanerHref)
                : buildMadreTabs(),
        [escanerMode, escanerHref]
    )
    const active = escanerMode
        ? resolveActiveTab(currentTabId, hash)
        : resolveMadreTab(pathname)

    const navigate = (_id: TabId, href: string) => {
        if (typeof window === "undefined") return
        /* v4.3 — Unificamos toda la navegación con rsvNavigate. El
           router de Domo ya maneja el caso same-path con hash distinto
           (pushState + dispatch rsv-navigate). El listener del Escáner
           escucha rsv-navigate además de hashchange para conmutar
           mainView de forma consistente. Antes hacíamos replaceState +
           dispatch HashChangeEvent manual, lo cual era frágil — algunos
           browsers no entregaban el evento sintético al listener. */
        const r = (window as any).rsvNavigate as
            | ((url: string) => void)
            | undefined
        if (r) r(href)
        else window.location.href = href
    }

    /* v4.22 — Navegación con flechas del teclado en el modo Escáner
       (Madre queda fuera por pedido de Zak v4.22.1).
       · Arrow Left / Arrow Right rotan entre Radar ↔ Calibración ↔
         Holoteca ↔ Núcleo.
       · Si hay un botón con data-rsv-back-button en el DOM (sub-capa
         abierta: pilar con libros sagrados, sub-tab del Núcleo en
         mobile), Arrow Left simula el click del botón Volver y
         Arrow Right NO actúa.
       · Ignora el evento cuando el foco está en input/textarea/
         contenteditable para no chocar con tipeo. */
    const tabsRef = React.useRef(tabs)
    tabsRef.current = tabs
    const escanerModeRef = React.useRef(escanerMode)
    escanerModeRef.current = escanerMode
    /* v4.22.2 — Resuelve el tab activo desde la URL en vivo. Se
       lee dentro del handler para que cada rotación arranque del
       pathname actual, sin depender de cuándo el shell propaga la
       prop currentTabId. */
    const resolveTabFromPath = (rawPath: string): TabId => {
        const p = (rawPath || "").toLowerCase()
        if (p.startsWith("/escaner/calibracion")) return "modulos"
        if (p.startsWith("/escaner/holoteca")) return "holoteca"
        if (p.startsWith("/escaner/nucleo")) return "nucleo"
        return "escaner"
    }
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight")
                return
            if (e.metaKey || e.ctrlKey || e.altKey) return
            /* v4.22.1 — Restricción al modo Escáner. */
            if (!escanerModeRef.current) return
            const target = e.target as HTMLElement | null
            if (
                target?.closest(
                    "input, textarea, select, [contenteditable=true]"
                )
            )
                return
            const backBtn = document.querySelector<HTMLElement>(
                "[data-rsv-back-button]"
            )
            if (backBtn) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    backBtn.click()
                }
                return
            }
            const list = tabsRef.current
            if (!list || list.length === 0) return
            /* v4.22.2 — Tab activo resuelto desde URL en vivo. */
            const currentId = resolveTabFromPath(
                window.location.pathname
            )
            const idx = list.findIndex((t) => t.id === currentId)
            const safeIdx = idx < 0 ? 0 : idx
            const dir = e.key === "ArrowRight" ? 1 : -1
            const next =
                list[(safeIdx + dir + list.length) % list.length]
            if (!next) return
            e.preventDefault()
            navigate(next.id, next.href)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    /* v4.11 — Press-and-drag: replica el patrón del BottomNav del
       [LENTE] (AppNavegacionMobile v2.21+). Pico Holoteca, mantengo
       el botón apretado, deslizo el cursor al item Meditaciones del
       submenú, suelto y aterriza directo en /escaner/holoteca/meditaciones.
       findTabIdAt → hit-test contra data-nav-tab usando
       getBoundingClientRect (no elementFromPoint, predecible aunque
       el cursor cruce capas con backdrop-filter o filter). Listeners
       en window — sobreviven aunque algún sub-componente se desmonte
       a media gesto. */
    const navInnerRef = React.useRef<HTMLDivElement>(null)
    const [dragHoveredTabId, setDragHoveredTabId] = React.useState<TabId | null>(null)
    const dragStateRef = React.useRef<{
        active: boolean
        startTabId: TabId
        startX: number
        startY: number
        moved: boolean
    } | null>(null)

    const findTabIdAt = (x: number, y: number): TabId | null => {
        const root = navInnerRef.current
        if (!root) return null
        const buttons = root.querySelectorAll<HTMLElement>("[data-nav-tab]")
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i]
            const r = btn.getBoundingClientRect()
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                return btn.getAttribute("data-nav-tab") as TabId | null
            }
        }
        return null
    }

    const findContentTargetAt = (
        x: number,
        y: number
    ): HTMLElement | null => {
        if (typeof document === "undefined") return null
        const el = document.elementFromPoint(x, y) as HTMLElement | null
        if (!el) return null
        let node: HTMLElement | null = el
        while (node && node !== document.body) {
            const tag = node.tagName
            if (tag === "BUTTON" || tag === "A") return node
            if (node.getAttribute("role") === "button") return node
            if (node.dataset && node.dataset.dragTarget !== undefined)
                return node
            node = node.parentElement
        }
        return null
    }

    /* v4.21 — Press-and-drag idéntico al BottomNav mobile. La
       navegación al tab presionado ocurre AL INSTANTE en pointerdown,
       no al pointerup. Mientras el tripulante mantiene apretado, si
       cruza a otro tab navegamos a ese tab al instante (cross-tab
       live). Al soltar, si el cursor terminó sobre un elemento
       clickable del contenido (button/anchor/role=button), ejecutamos
       target.click() — eso permite el flow "pico Calibración, deslizo
       a HARDWARE, suelto, se activa HARDWARE" en una sola acción. */
    const handleTabPointerDown = (clientX: number, clientY: number, tabId: TabId) => {
        if (typeof window === "undefined") return
        dragStateRef.current = {
            active: true,
            startTabId: tabId,
            startX: clientX,
            startY: clientY,
            moved: false,
        }

        /* v4.21 — Navegación instantánea al tab presionado. Equivale
           al dragActivate(x,y) del mobile en pointerdown. */
        const startSpec = tabs.find((t) => t.id === tabId)
        if (startSpec) navigate(tabId, startSpec.href)

        const cleanup = () => {
            dragStateRef.current = null
            setDragHoveredTabId(null)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onCancel)
        }

        const onMove = (ev: PointerEvent) => {
            const d = dragStateRef.current
            if (!d || !d.active) return
            if (!d.moved) {
                const dx = ev.clientX - d.startX
                const dy = ev.clientY - d.startY
                if (Math.hypot(dx, dy) > 6) {
                    d.moved = true
                }
            }
            /* Cross-tab live: si el cursor cruza a otro tab,
               navegamos a ese tab al instante. Actualizamos
               startTabId para que el siguiente cruce no re-dispare
               la misma navegación. */
            if (d.moved) {
                const navTab = findTabIdAt(ev.clientX, ev.clientY)
                if (navTab && navTab !== d.startTabId) {
                    const spec = tabs.find((t) => t.id === navTab)
                    if (spec) {
                        d.startTabId = navTab
                        setDragHoveredTabId(navTab)
                        navigate(navTab, spec.href)
                    }
                } else if (!navTab) {
                    setDragHoveredTabId(null)
                }
            }
        }

        const onUp = (ev: PointerEvent) => {
            const d = dragStateRef.current
            if (!d) {
                cleanup()
                return
            }
            const moved = d.moved
            cleanup()
            if (!moved) {
                /* Press sin drag: ya navegamos al tab en pointerdown.
                   Nada más que hacer. */
                return
            }
            /* Drag al soltar: si el cursor está sobre un elemento
               clickable del contenido, lo activamos. Si está sobre
               otro tab ya lo activamos en onMove (cross-tab live). */
            const target = findContentTargetAt(ev.clientX, ev.clientY)
            if (target) {
                /* Doble-fire-guard: si el target es un <a> dentro de
                   algún data-nav-tab, ya navegamos vía onMove o
                   pointerdown. No re-disparamos. */
                const targetTabId = target
                    .closest("[data-nav-tab]")
                    ?.getAttribute("data-nav-tab")
                if (target.tagName === "A" && targetTabId) {
                    /* Excepción: items del submenú de Holoteca
                       (data-submenu-item) sí ejecutan click — son
                       navegaciones a sub-rutas, no al tab principal. */
                    if (target.hasAttribute("data-submenu-item")) {
                        try {
                            target.click()
                        } catch (err) {
                            console.warn(
                                "[nav-estacion] submenu click() fail:",
                                err
                            )
                        }
                    }
                    return
                }
                try {
                    target.click()
                } catch (err) {
                    console.warn(
                        "[nav-estacion] target.click() fail:",
                        err
                    )
                }
            }
        }

        const onCancel = () => cleanup()
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onCancel)
    }

    const o = Math.max(0, Math.min(1, barOpacity))
    const accent = accentColor

    return (
        <>
            <style>{`
                .esc-shimmer-bar { position:absolute; inset:0; pointer-events:none; }
                .rsv-nav-pill a:focus-visible {
                    outline: 2px solid ${hx(accent, 0.8)};
                    outline-offset: 2px;
                    border-radius: 999px;
                }
            `}</style>
            <nav
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 900,
                    width: "100%",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    ref={navInnerRef}
                    className="rsv-nav-pill"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: o, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    /* v4.11 — Event delegation para press-and-drag.
                       Cuando el pointerdown cae sobre cualquier <a> de
                       un tab, arrancamos el tracking global. El click
                       puro sigue funcionando porque el onClick del <a>
                       se dispara como siempre — solo interceptamos si
                       hay drag real (>6px). */
                    onPointerDown={(e) => {
                        if (e.button !== 0) return
                        const tabEl = (e.target as HTMLElement).closest(
                            "[data-nav-tab]"
                        ) as HTMLElement | null
                        if (!tabEl) return
                        const tabId = tabEl.getAttribute(
                            "data-nav-tab"
                        ) as TabId | null
                        if (!tabId) return
                        handleTabPointerDown(e.clientX, e.clientY, tabId)
                    }}
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 18px",
                        borderRadius: 999,
                        overflow: "hidden",
                        isolation: "isolate",
                        background: `linear-gradient(135deg, rgba(8,24,48,${0.88 * o}) 0%, rgba(5,16,34,${0.94 * o}) 45%, rgba(4,14,30,${0.94 * o}) 55%, rgba(8,24,48,${0.88 * o}) 100%), ${hx(accent, 0.06)}`,
                        border: `1px solid ${hx(accent, 0.38)}`,
                        backdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                        WebkitBackdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                        boxShadow: [
                            `0 8px 26px ${hx(accent, 0.14)}`,
                            `0 2px 10px rgba(0,0,0,0.35)`,
                            `inset 0 0 22px ${hx(accent, 0.08)}`,
                            `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                            `0 0 0 0.5px ${hx(accent, 0.12)}`,
                        ].join(", "),
                        pointerEvents: "auto",
                        maxWidth: "min(100% - 24px, 1180px)",
                    }}
                >
                    <motion.div
                        animate={{ left: ["-70%", "160%"] }}
                        transition={{
                            duration: 11,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 2,
                        }}
                        style={{
                            position: "absolute",
                            top: "-80%",
                            height: "260%",
                            left: "-70%",
                            width: "55%",
                            background: `linear-gradient(110deg, transparent 0%, transparent 20%, ${hx("#FFFFFF", 0.025)} 38%, ${hx(accent, 0.09)} 50%, ${hx("#FFFFFF", 0.025)} 62%, transparent 80%, transparent 100%)`,
                            filter: "blur(22px)",
                            transform: "rotate(14deg)",
                            pointerEvents: "none",
                            zIndex: 0,
                            opacity: 0.85,
                        }}
                    />
                    {tabs.map((spec) => (
                        <TabButton
                            key={spec.id}
                            spec={spec}
                            active={active === spec.id}
                            accent={accent}
                            onClick={() => navigate(spec.id, spec.href)}
                            onSubmenuNavigate={(href) => {
                                if (typeof window === "undefined") return
                                const r = (window as any)
                                    .rsvNavigate as
                                    | ((url: string) => void)
                                    | undefined
                                if (r) r(href)
                                else window.location.href = href
                            }}
                            forceSubmenuOpen={dragHoveredTabId === spec.id}
                            forceLit={dragHoveredTabId === spec.id}
                        />
                    ))}
                </motion.div>
            </nav>
        </>
    )
}

export default NavegadorEstacion

/* ───────── Property Controls (Framer) ─────────
   Mantengo currentTabId como Enum para compat con Domo. La opción
   "modulos" la maneja la barra al detectar el hash; no necesita
   estar en este enum porque Domo solo conoce paths.            */

addPropertyControls(NavegadorEstacion, {
    currentTabId: {
        type: ControlType.Enum,
        title: "Pestaña actual",
        options: [
            "radar",
            "escaner",
            "holoteca",
            "nucleo",
            "modulos",
            "decodificador",
            "ninguna",
        ],
        optionTitles: [
            "Radar",
            "Escáner",
            "Holoteca",
            "Núcleo",
            "Calibración",
            "Decodificador",
            "Ninguna (sin glow)",
        ],
        defaultValue: "ninguna",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#00C2FF",
    },
    barOpacity: {
        type: ControlType.Number,
        title: "Opacidad barra",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
