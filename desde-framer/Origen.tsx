// Red Solar Viva — Origen.tsx v5.21 — La escritura del manifiesto va a la MITAD
// de velocidad en el [CENTRO DE MANDO] (Zak: "para que sea más ritualístico
// aún"): letras, ventana del frente y respiro entre renglones se doblan juntos;
// el [LENTE] conserva su ritmo. La red de seguridad de 12s pasa a 22s en
// escritorio para no adelantarse a la ceremonia lenta.
//
// Origen.tsx v5.20 — EL MANIFIESTO SE ESCRIBE SOLO (Zak): el
// texto se materializa con la técnica del Modo Presencia del Espejo Vibracional
// —un frente recorre las letras, glifos de señal en cian y dorado, y al pasar
// se asientan— pero RENGLÓN A RENGLÓN, así el bloque crece y el botón de LEER
// MÁS se desliza con él; al pedirlo, la pantalla BAJA primero y solo entonces
// arranca el párrafo siguiente. Además: la firma bajo cada avatar vive en UNA
// sola línea (la ficha ensancha y por debajo de ~940px las dos se apilan), y al
// cruzar el portal hacia el Escáner la casa se apaga entera (el botón ⬡ ESCÁNER
// VIBRACIONAL ya no se queda flotando congelado sobre el campo que se abre).
//
// Origen.tsx v5.19 — Afinación de Zak (2026-08-04): la ficha
// corta de Zak´Haar deja de nombrar la Cámara Solar (ya no está activa) y pasa
// a lo que sí sostiene hoy: arquitecto de la casa y autor de los Códices.
//
// Red Solar Viva — Origen.tsx v5.18 — 🜂 LA FICHA DEL PLANETA NUNCA SE SALE DE
// PANTALLA + ENTRAN LOS DOS ARQUITECTOS (Zak 2026-08-04). Tres movimientos:
// (1) FloatingCard medía su alto con un número fijo escrito a mano (340), así que
// una ficha larga —Códices tiene tres párrafos— se pasaba del borde inferior y el
// texto quedaba cortado; ahora se MIDE el alto real ya montada (offsetHeight, que
// ignora el transform de la animación de entrada) y se recoloca, con la ficha
// acotada y desplazable por dentro si la ventana es muy baja. (2) La sección de
// GUÍA pasa a ser un carril de DOS personas: nace <GuiaPersona> para que Zak'Haar
// y Aqua'Riia compartan la misma forma sin duplicar markup, y .guia-duo los
// reparte (con una sola persona el bloque se comporta igual que antes; en pantalla
// angosta se apilan por flex-wrap). (3) Con una ficha abierta el sistema no solo se
// detiene: los planetas que no estás mirando se ATENÚAN, para que la pausa se lea
// como foco y no como que algo se trabó.
//
// Red Solar Viva — Origen.tsx v5.17 — 🜂 EL PLANETA DEL ESCÁNER ATERRIZA EN SU
// LANDING, NO EN LA APLICACIÓN (Zak 2026-08-03: "van a decir ¿qué rayos es
// esto?"). Los dos accesos del planeta —la tarjeta del sistema solar y el
// planeta en órbita— dejan de entrar a app.escanervibracional.com y llevan a
// escanervibracional.com, que presenta el producto y ofrece las tres puertas:
// App Store, Android y versión de escritorio. El PORTAL DE TRÁNSITO se
// conserva: sigue siendo el salto entre las dos casas. El celular ya iba ahí.
//
// Red Solar Viva — Origen.tsx v5.16 — 🜂 MEDITACIONES SALE DEL SISTEMA SOLAR
// (Zak 2026-08-03: "Red Solar Viva deja de ser tienda"). El planeta y su
// tarjeta del Lente se retiran en CÓDIGO —no por interruptor— porque Framer
// conserva el valor guardado del canvas aunque se quite el control. Las
// Meditaciones viven en la Holoteca del Escáner; la ruta /meditaciones queda
// viva y lleva a la descarga de la app. El resto del sistema solar intacto.
// v5.15 — 🜂 LA PORTADA VUELVE A VERSE (Zak
// 2026-08-03: "redsolarviva.com se ve negra"). La lectura del interruptor de
// Sesiones que entró en v5.14 quedó DEBAJO del return temprano de `mounted`:
// el primer render la saltaba y el segundo la ejecutaba, así que React contaba
// hooks distintos entre un render y otro (error #310) y tumbaba el sistema
// solar completo — la página quedaba en negro. La lectura sube junto a los
// demás hooks; el comportamiento del planeta no cambia. Regla dura: ningún
// hook después de un return condicional.
// v5.14 — EL SISTEMA SOLAR OBEDECE AL MOTOR + EL
// ESCÁNER ENTRA COMO APP (Zak 2026-08-03). (1) El planeta "Sesiones" se retira
// cuando el interruptor del Motor apaga la oferta (app_flags.hide_sesiones,
// leído con recuerdo local para que nazca sin él y sin parpadeo; fail-open si
// la lectura falla). La pestaña de la barra ya estaba apagada a mano desde el
// 2026-07-27, pero el planeta seguía orbitando y llevaba a la pantalla de
// cortesía. (2) El planeta "Escáner" deja el dominio viejo
// (escaner.redsolarviva.com, hoy solo backend de las apps nativas) y se
// ramifica por dispositivo: en la COMPUTADORA entra a app.escanervibracional.com
// a través del PORTAL DE TRÁNSITO (el campo se abre desde el punto tocado,
// anillos de instrumento, el sello se materializa y recién entonces entra); en
// el CELULAR el botón dorado del hero lleva a escanervibracional.com, la página
// de descarga, porque ahí el Escáner es una app que se instala, no una web.
// v5.13 — Slogan del hero: "DEL CARBONO AL SILICIO, DEL SILICIO A LA LUZ."
// → "DE LA ENTROPÍA A LA LUZ." (mismo giro ya aplicado al slogan del auth
// el 2026-07-09; entropía=decadencia es más directo que base-de-carbono).
// Cambia el default de `heroTagline` de SolarSystemMobile (a 2 líneas con
// "\n", como el original). El default de SolarSystemDesktop y el de
// Origen.defaultProps/addPropertyControls ya traían un placeholder
// DISTINTO ("Biblioteca de la Nueva Tierra", no el slogan viejo) y quedan
// sin tocar — Domo.tsx manda el literal real en producción de todos modos.
// v5.12 — Fase 6a (2026-05-12). El planeta "Escáner" del sistema
// solar (id "escaner") sale del nodo madre Framer al subdomain
// canónico https://escaner.redsolarviva.com/escaner. Aplica a las
// dos superficies clickeables: el `<a>` orbital del planeta y el
// botón "Ir al nodo →" del panel hover. Los demás planetas
// (Códices, Sesiones, Meditaciones, Fragmentos, Simuladores) siguen
// con su `link` editable desde Framer. Las rutas /escaner del
// Framer permanecen vivas para validación manual de Zak'Haar pero
// ya nadie las descubre desde la landing.
// v5.11 — (línea anterior)
// v5.10 — Cards Fragmentos del Sol y Simuladores ahora apuntan a las
// rutas raíz públicas (`/fragmentos` y `/simuladores`) en lugar del
// prop p3_Link y la sub-ruta de Holoteca. Ambas montan piezas
// standalone (FragmentosDelSol con título "FRAGMENTOS DEL SOL" grande
// y SimuladoresPublicMobile con título "SIMULADORES" grande) sin
// chrome del Escáner ni prefijo "HOLOTECA · ...". Coherencia con el
// resto del Lente — Códices, Meditaciones, Sesiones también caen
// directo a su capa pública.
// v5.9 — Lente: dos tarjetas nuevas en el grid mobile. Fragmentos
// del Sol pasa a default-on (antes off por defecto) y aparece como
// cuarta entrada en la grilla 2x2. Simuladores se suma como sexta
// entrada en doble barra (`wide=true` ocupa la fila completa) con
// ícono vectorial concéntrico de retícula y nodos pulsantes; apunta
// a `/simuladores` que en mobile el shell de Domo redirige al
// SelectorSimuladores AAA con cards Navegante + Domo Cero
// admin-only. Props nuevos: `mobileShowSimuladores` (default true),
// `mobileShowFragmentos` (default true desde v5.9).
// v5.8 — Input de "ÚNETE AL NODO CENTRAL" acepta CMD+Enter / Ctrl+Enter para enviar el email aunque el cursor esté dentro del input.
// Desktop: Orbital system with planets, toroide, floating cards
// Mobile: Hero + nav cards + scrollable sections
// Shared: Manifesto, Guía, Newsletter, Socials, Afinaciones

import * as React from "react"
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
    useCallback,
    memo,
} from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══════════════════════════════════════════
   TRY import viewport — works inside Domo,
   falls back to local detection otherwise
   ═══════════════════════════════════════════ */

function useViewportLocal(): {
    isMobile: boolean
    isTablet: boolean
    width: number
    height: number
} {
    const getVp = () => {
        if (typeof window === "undefined")
            return {
                isMobile: false,
                isTablet: false,
                width: 1440,
                height: 900,
            }

        /* ── LAYER 1: User-Agent (nuclear option for real phones) ──
           If the browser says "I am an iPhone/Android phone", that's final.
           No viewport, matchMedia, or innerWidth bug can override this.
           This is the ONLY 100% reliable way to detect a real phone. */
        const ua =
            typeof navigator !== "undefined" ? navigator.userAgent || "" : ""
        const isPhone = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)

        if (isPhone) {
            return {
                isMobile: true,
                isTablet: false,
                width: window.innerWidth,
                height: window.innerHeight,
            }
        }

        /* ── LAYER 2: CSS matchMedia (tablets + desktop responsive) ──
           Only used when UA doesn't match a phone.
           Works for: iPads, Android tablets, desktop narrow windows. */
        const mq = typeof window.matchMedia === "function"
        const isMobile = mq
            ? window.matchMedia("(max-width: 768px)").matches
            : window.innerWidth <= 768
        const isTablet = mq
            ? window.matchMedia("(max-width: 1024px)").matches
            : window.innerWidth <= 1024

        return {
            isMobile,
            isTablet,
            width: window.innerWidth,
            height: window.innerHeight,
        }
    }
    const [vp, setVp] = useState(getVp)
    useEffect(() => {
        if (typeof window === "undefined") return
        setVp(getVp())

        /* If we're on a phone (UA-detected), isMobile is locked to true.
           No resize listener needed — phones don't change device type. */
        const ua =
            typeof navigator !== "undefined" ? navigator.userAgent || "" : ""
        if (/iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)) return

        /* For tablets and desktop: listen for resize/matchMedia changes */
        const mq = typeof window.matchMedia === "function"
        const mqlMobile = mq ? window.matchMedia("(max-width: 768px)") : null
        const mqlTablet = mq ? window.matchMedia("(max-width: 1024px)") : null
        let raf: number
        const update = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                setVp((prev) => {
                    const next = getVp()
                    if (
                        prev.isMobile === next.isMobile &&
                        prev.isTablet === next.isTablet &&
                        prev.width === next.width
                    )
                        return prev
                    return next
                })
            })
        }
        window.addEventListener("resize", update)
        mqlMobile?.addEventListener?.("change", update)
        mqlTablet?.addEventListener?.("change", update)
        return () => {
            window.removeEventListener("resize", update)
            mqlMobile?.removeEventListener?.("change", update)
            mqlTablet?.removeEventListener?.("change", update)
            cancelAnimationFrame(raf)
        }
    }, [])
    return vp
}

function useViewport() {
    return useViewportLocal()
}

/* 🜂 v5.13 — INTERRUPTOR GLOBAL DE SESIONES (Motor → app_flags.hide_sesiones).
   Mismo mecanismo que /sesiones (Sesiones.tsx): se siembra del recuerdo local
   `rsv-hide-sesiones` para que el sistema solar nazca ya sin el planeta en
   visitas repetidas (cero parpadeo de "aparece y se va"), y se confirma con
   la lectura pública. Sin llaves (o si la lectura falla) el planeta se queda:
   fail-open, nunca esconder por un error de red. */
function useHideSesionesFlag(url?: string, key?: string): boolean {
    const cached = (() => {
        try {
            return typeof localStorage !== "undefined"
                ? localStorage.getItem("rsv-hide-sesiones")
                : null
        } catch {
            return null
        }
    })()
    const [hide, setHide] = useState(cached === "1")

    useEffect(() => {
        if (!url || !key) return
        let cancel = false
        fetch(`${url}/rest/v1/rpc/get_app_flag`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ p_key: "hide_sesiones" }),
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => {
                if (cancel || v === null) return
                const on = v === true
                setHide(on)
                try {
                    localStorage.setItem("rsv-hide-sesiones", on ? "1" : "0")
                } catch {}
            })
            .catch(() => {})
        return () => {
            cancel = true
        }
    }, [url, key])

    return hide
}

/* ═══════════════════════════════════════
   PORTAL DE TRÁNSITO AL ESCÁNER (v5.13)
   ═══════════════════════════════════════
   🜂 Zak 2026-08-03: "que se sienta que estás entrando a la aplicación, no
   un salto seco de página". Al picar el planeta del Escáner (o su botón
   "Ir al nodo") el campo se ABRE desde el punto tocado — un disco de luz
   que crece, tres anillos de instrumento que se expanden y el sello de la
   app que se materializa al centro — y recién entonces se entra.
   Imperativo y portaleado a <body> (patrón fireTouchRipple del Escáner):
   sobrevive cualquier re-render y no necesita estado de React.
   Con "reducir movimiento" activo entra directo, sin ceremonia. */
/* 🜂 v5.17 — la casa NUNCA manda directo a la aplicación (Zak 2026-08-03:
   "van a decir ¿qué rayos es esto?"). TODO acceso al Escáner desde Red Solar
   Viva aterriza en su LANDING (escanervibracional.com), que presenta el
   producto y ofrece las tres puertas: App Store, Android y la versión de
   escritorio. La app de escritorio (app.escanervibracional.com) se alcanza
   DESDE ahí, ya con contexto. Se conserva la constante por si algún día se
   necesita el enlace directo. */
const ESCANER_APP_URL = "https://app.escanervibracional.com"
void ESCANER_APP_URL
const ESCANER_LANDING_URL = "https://escanervibracional.com"

function abrirPortalEscaner(x: number, y: number, destino: string) {
    const irYa = () => {
        try {
            window.location.href = destino
        } catch {}
    }
    let reduce = false
    try {
        reduce =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } catch {}
    if (reduce || typeof document === "undefined") {
        irYa()
        return
    }

    const CY = "#00C2FF"
    const GO = "#D4A843"
    const w = window.innerWidth
    const h = window.innerHeight
    const R = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) * 1.06

    const host = document.createElement("div")
    host.setAttribute("data-rsv-portal", "escaner")
    host.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:2147483000",
        "overflow:hidden",
        "pointer-events:all",
        "background:transparent",
    ].join(";")

    const css = document.createElement("style")
    css.textContent = `
@keyframes rsvPortalCore{0%{transform:translate(-50%,-50%) scale(0);opacity:0}12%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes rsvPortalRing{0%{transform:translate(-50%,-50%) scale(0);opacity:0.85}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
@keyframes rsvPortalGlow{0%{transform:translate(-50%,-50%) scale(0);opacity:0}22%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:0.25}}
@keyframes rsvPortalMark{0%{opacity:0;letter-spacing:22px;filter:blur(9px)}100%{opacity:1;letter-spacing:9px;filter:blur(0)}}
@keyframes rsvPortalSub{0%{opacity:0}100%{opacity:0.72}}
/* 🜂 v5.20 — LA CASA SE APAGA AL CRUZAR EL UMBRAL. El botón ⬡ ESCÁNER
   VIBRACIONAL (Domo) vive en el z-index máximo posible, por encima de
   este telón, y se quedaba flotando congelado sobre el campo que se
   abre — anunciando el Escáner justo cuando ya se está entrando en él.
   Todo lo que Domo marca como chrome de la casa se desvanece con el
   portal. No se restaura: la página se va en 1.18s. */
html.rsv-portal-abierto [data-rsv-chrome-casa]{opacity:0!important;pointer-events:none!important;transition:opacity 0.3s ease!important}`
    host.appendChild(css)
    try {
        document.documentElement.classList.add("rsv-portal-abierto")
    } catch {}

    /* Disco de campo que se abre desde el punto tocado. OPACO: es el telón
       que cierra antes de entrar a la app — si el centro fuera translúcido
       se seguiría viendo el planeta debajo. El brillo va en una capa
       aparte, encima. */
    const core = document.createElement("div")
    core.style.cssText = [
        "position:absolute",
        `left:${x}px`,
        `top:${y}px`,
        `width:${R * 2}px`,
        `height:${R * 2}px`,
        "border-radius:50%",
        "background:radial-gradient(circle, rgb(6,20,38) 0%, rgb(2,7,17) 48%, rgb(0,0,0) 100%)",
        "transform:translate(-50%,-50%) scale(0)",
        "animation:rsvPortalCore 0.62s cubic-bezier(0.22,1,0.36,1) forwards",
    ].join(";")
    host.appendChild(core)

    /* Resplandor del umbral (encima del telón, se desvanece). */
    const glow = document.createElement("div")
    glow.style.cssText = [
        "position:absolute",
        `left:${x}px`,
        `top:${y}px`,
        `width:${R * 1.5}px`,
        `height:${R * 1.5}px`,
        "border-radius:50%",
        `background:radial-gradient(circle, ${hexToRgba(CY, 0.34)} 0%, ${hexToRgba(CY, 0.08)} 42%, transparent 70%)`,
        "transform:translate(-50%,-50%) scale(0)",
        "animation:rsvPortalGlow 1.1s cubic-bezier(0.22,1,0.36,1) forwards",
    ].join(";")
    host.appendChild(glow)

    /* Anillos de instrumento. */
    ;[0, 1, 2].forEach((i) => {
        const ring = document.createElement("div")
        const d = R * 2
        ring.style.cssText = [
            "position:absolute",
            `left:${x}px`,
            `top:${y}px`,
            `width:${d}px`,
            `height:${d}px`,
            "border-radius:50%",
            `border:1.5px solid ${hexToRgba(i === 1 ? GO : CY, 0.5)}`,
            "transform:translate(-50%,-50%) scale(0)",
            `animation:rsvPortalRing 0.95s cubic-bezier(0.22,1,0.36,1) ${0.06 + i * 0.13}s forwards`,
        ].join(";")
        host.appendChild(ring)
    })

    /* Sello de la app que se materializa. */
    const mark = document.createElement("div")
    mark.style.cssText = [
        "position:absolute",
        "left:0",
        "right:0",
        "top:50%",
        "transform:translateY(-50%)",
        "text-align:center",
        "padding:0 24px",
        "font-family:'JetBrains Mono',ui-monospace,monospace",
        "font-size:clamp(15px,2.1vw,25px)",
        "font-weight:300",
        `color:${hexToRgba(CY, 0.95)}`,
        `text-shadow:0 0 26px ${hexToRgba(CY, 0.5)}`,
        "opacity:0",
        "animation:rsvPortalMark 0.72s cubic-bezier(0.22,1,0.36,1) 0.42s forwards",
    ].join(";")
    mark.textContent = "ESCÁNER VIBRACIONAL"
    host.appendChild(mark)

    const sub = document.createElement("div")
    sub.style.cssText = [
        "position:absolute",
        "left:0",
        "right:0",
        "top:calc(50% + 34px)",
        "text-align:center",
        "padding:0 24px",
        "font-size:11px",
        "letter-spacing:3.4px",
        "text-transform:uppercase",
        `color:${hexToRgba(GO, 0.85)}`,
        "opacity:0",
        "animation:rsvPortalSub 0.5s ease 0.78s forwards",
    ].join(";")
    sub.textContent = "Entrando al campo"
    host.appendChild(sub)

    document.body.appendChild(host)
    /* Volver con el botón "atrás" del navegador puede restaurar la página
       desde su caché tal cual quedó: con el telón puesto y la casa
       apagada. Al reaparecer, se limpian los dos. */
    const limpiar = () => {
        try {
            document.documentElement.classList.remove("rsv-portal-abierto")
            host.remove()
        } catch {}
        window.removeEventListener("pageshow", limpiar)
    }
    window.addEventListener("pageshow", limpiar)
    window.setTimeout(irYa, 1180)
}

/* ═══════════════════════════════════════
   SHARED UTILITIES
   ═══════════════════════════════════════ */
const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    if (hex.includes("var(") || hex.includes("rgb") || hex.includes("hsl"))
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    if (isNaN(n)) return `rgba(0,194,255,${a})`
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const nl = (s: string) => (s || "").replace(/\\n/g, "\n")
const A = (accent: string, x: number) => hexToRgba(accent, x)

function computeColorVars(ac: string) {
    const ok =
        typeof CSS !== "undefined" &&
        CSS.supports?.("color", "color-mix(in srgb, red, blue)")
    if (ok)
        return {
            secondary: `color-mix(in srgb,${ac},white 35%)`,
            glow: `color-mix(in srgb,${ac},transparent 75%)`,
            orbitStroke: `color-mix(in srgb,${ac},transparent 55%)`,
        }
    if (ac === "#00C2FF")
        return {
            secondary: "#4dd6ff",
            glow: "rgba(0,194,255,0.25)",
            orbitStroke: "rgba(0,194,255,0.45)",
        }
    return { secondary: ac, glow: ac, orbitStroke: ac }
}

/* ═══════════════════════════════════════
   CSS — DESKTOP (orbital system)
   ═══════════════════════════════════════ */
const DESKTOP_CSS = String.raw`
:root{--bg-space:#000;--text-color:#E6F7EF;--holo-primary:#00C2FF;--holo-secondary:#4dd6ff;--holo-glow:rgba(0,194,255,0.25);--orbit-stroke:rgba(0,194,255,0.45)}
html::-webkit-scrollbar,body::-webkit-scrollbar,.qr::-webkit-scrollbar{display:none!important;width:0!important}
html,body,.qr{scrollbar-width:none!important;-ms-overflow-style:none!important}
.qr{position:relative;width:100%;height:100vh;overflow-y:auto;overflow-x:hidden;background:transparent;color:var(--text-color);scroll-behavior:smooth;font-family:'Inter',sans-serif}
.sf-wrap{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;perspective:400px;background:transparent}
.sf-s{position:absolute;left:50%;top:50%;width:var(--sz);height:var(--sz);border-radius:50%;background:#fff;box-shadow:0 0 3px 1px rgba(255,255,255,0.5);animation:sf-fly var(--dur) linear infinite;animation-delay:var(--dl);opacity:0;will-change:transform,opacity}
@keyframes sf-fly{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
.comet{--x:0px;--y:0px;--dx:0px;--dy:0px;--rot:0deg;position:absolute;left:0;top:0;width:3px;height:3px;border-radius:50%;background:#fff;visibility:hidden;opacity:0;will-change:transform,opacity;filter:drop-shadow(0 0 8px #fff) drop-shadow(0 0 16px var(--holo-primary));animation:none}
.comet::after{content:"";position:absolute;left:-160px;top:50%;height:2px;width:160px;transform:translateY(-50%);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.25) 60%,rgba(255,255,255,.9) 95%,rgba(255,255,255,0) 100%);filter:blur(.8px)}
.comet::before{content:"";position:absolute;right:-2px;top:-2px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,1),rgba(255,255,255,.35) 60%,rgba(255,255,255,0) 70%)}
@keyframes comet-move{0%{opacity:0;visibility:hidden;transform:translate(var(--x),var(--y)) rotate(var(--rot))}4%{visibility:visible}8%{opacity:1}100%{opacity:0;visibility:hidden;transform:translate(calc(var(--x)+var(--dx)),calc(var(--y)+var(--dy))) rotate(var(--rot))}}
.qr-stage{position:relative;width:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:0 20px;margin-top:calc(var(--navbar-offset) + var(--title-offset));z-index:2}
.qr-title{margin:0;font-family:'Inter',sans-serif;font-weight:100;font-size:clamp(32px,5vw,var(--title-size-px));text-transform:uppercase;letter-spacing:0.4em;margin-right:-0.4em;line-height:1;text-align:center;background:linear-gradient(180deg,var(--holo-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 12px var(--holo-glow));-webkit-font-smoothing:antialiased}
.qr-sub{font-family:'Inter',sans-serif;font-size:1.05rem;font-weight:300;margin:12px 0 0;text-transform:uppercase;letter-spacing:0.3em;background:linear-gradient(180deg,var(--holo-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 10px var(--holo-glow));text-align:center}
.qr-tag{font-family:'Inter',sans-serif;font-size:clamp(0.85rem,1.8vw,1.1rem);font-weight:300;opacity:0.55;max-width:600px;text-align:center;margin:10px auto 0;color:#fff;letter-spacing:0.12em;line-height:1.6;white-space:pre-line}
.tor-wrap{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3}
.tor-img{width:var(--tor-size,280px);height:auto;object-fit:contain;animation:tor-pulse 5s ease-in-out infinite alternate;filter:drop-shadow(0 0 25px var(--holo-glow)) drop-shadow(0 0 60px rgba(212,168,67,0.25)) drop-shadow(0 0 100px var(--holo-glow));will-change:transform,filter}
@keyframes tor-pulse{0%{transform:scale(0.97);filter:drop-shadow(0 0 25px var(--holo-glow)) drop-shadow(0 0 60px rgba(212,168,67,0.2))}100%{transform:scale(1.03);filter:drop-shadow(0 0 35px var(--holo-glow)) drop-shadow(0 0 80px rgba(212,168,67,0.35)) drop-shadow(0 0 120px var(--holo-glow))}}
.qr-orbits{position:relative;width:100%;max-width:1400px;min-height:800px;aspect-ratio:1/1;overflow:visible;pointer-events:none}
.qr-orbits-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:visible}
.orb-back{fill:none;vector-effect:non-scaling-stroke;stroke:var(--holo-primary);stroke-width:0.5px;opacity:0.08}
.orb-front{fill:none;vector-effect:non-scaling-stroke;stroke:var(--holo-primary);stroke-width:0.8px;opacity:0.2;filter:drop-shadow(0 0 3px rgba(0,229,255,0.15));transition:all 0.6s ease}
.orb-front.is-active{stroke-width:1.2px;opacity:0.55;filter:drop-shadow(0 0 6px rgba(0,229,255,0.35)) drop-shadow(0 0 12px rgba(0,229,255,0.15))}
@keyframes orbit-move{to{offset-distance:100%}}
.onpath{position:absolute;offset-distance:0%;offset-rotate:0deg;will-change:offset-distance;z-index:4;offset-anchor:50% 50%;-webkit-offset-anchor:50% 50%;pointer-events:auto}
.qr-orbits.is-paused .onpath,.qr-orbits.is-paused .onpath .lbl{animation-play-state:paused!important}
/* 🜂 v5.18 — con una ficha abierta el sistema no solo se detiene: se
   ATENÚA todo menos el planeta que estás mirando. Así la pausa se lee
   como foco y no como que algo se trabó. */
.onpath{transition:opacity .45s ease,filter .45s ease}
.qr-orbits.is-paused .onpath{opacity:.3;filter:saturate(.5)}
.qr-orbits.is-paused .onpath.is-focus{opacity:1;filter:none}
.sh-wrap{position:absolute;inset:6%;pointer-events:none;filter:drop-shadow(0 0 5px var(--holo-primary)) drop-shadow(0 0 15px var(--holo-glow))}
.sh{width:100%;height:100%;transform-origin:50% 50%}
.lc{stroke:color-mix(in srgb,var(--holo-primary) 88%,white 6%);stroke-width:1.5;fill:none;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.ld{opacity:0.4}
@keyframes spin-s{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@keyframes spin-r{0%{transform:rotate(360deg)}100%{transform:rotate(0)}}
@keyframes flt-y{0%,100%{transform:translateY(-3%)}50%{transform:translateY(3%)}}
@keyframes pls-s{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes sw-t{0%{transform:rotate(-12deg) scale(0.95)}100%{transform:rotate(12deg) scale(1.05)}}
.pl-box{position:absolute;inset:0;background:transparent;overflow:visible;transition:transform 0.3s ease}
.pl-box.hov{transform:scale(1.15);filter:brightness(1.2)}
.ret{position:absolute;width:var(--ret-sz);height:var(--ret-sz);left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);opacity:0;transition:opacity .16s ease,transform .16s ease;pointer-events:none}
.ret.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.ret::before,.ret::after{content:"";position:absolute;inset:0;border-radius:3px;border:1px solid color-mix(in srgb,var(--holo-primary) 70%,transparent);box-shadow:0 0 calc(12px * var(--ret-glow)) var(--holo-primary);mask:linear-gradient(#000 0 0) center/66% .5px no-repeat,linear-gradient(#000 0 0) center/.5px 66% no-repeat;opacity:.6}
.ret .cn{position:absolute;width:16px;height:16px;border:1px solid var(--holo-secondary);box-shadow:0 0 8px var(--holo-primary)}
.cn.tl{top:-2px;left:-2px;border-right:0;border-bottom:0}.cn.tr{top:-2px;right:-2px;border-left:0;border-bottom:0}.cn.bl{bottom:-2px;left:-2px;border-right:0;border-top:0}.cn.br{bottom:-2px;right:-2px;border-left:0;border-top:0}
.ret .scn{position:absolute;left:2px;right:2px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:ret-scn 2.2s linear infinite;filter:drop-shadow(0 0 6px var(--holo-primary))}
@keyframes ret-scn{from{top:12%}to{top:88%}}
.lbl{position:absolute;left:50%;top:calc(100% + var(--lbl-off,6px));transform:translateX(-50%);font-size:11px;font-weight:400;color:#fff!important;letter-spacing:0.12em;text-transform:uppercase;opacity:0.75;text-shadow:0 2px 4px rgba(0,0,0,0.8),0 0 8px rgba(0,0,0,0.5);white-space:nowrap;pointer-events:none}
@keyframes lbl-flip{0%{top:calc(100% + var(--lbl-off,6px))}64.9%{top:calc(100% + var(--lbl-off,6px))}65%{top:calc(0px - var(--lbl-off,6px) - 18px)}84.9%{top:calc(0px - var(--lbl-off,6px) - 18px)}85%{top:calc(100% + var(--lbl-off,6px))}100%{top:calc(100% + var(--lbl-off,6px))}}
.holo-float-card{position:fixed;z-index:50;width:380px;background:radial-gradient(ellipse at 50% 0%,rgba(0,194,255,0.06),transparent 60%),rgba(8,14,28,0.88);backdrop-filter:blur(24px) saturate(1.3);border:1px solid rgba(0,194,255,0.2);border-top:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:36px 32px 32px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(0,194,255,0.08),inset 0 0 30px rgba(0,194,255,0.03);pointer-events:auto;scrollbar-width:none;-ms-overflow-style:none}
.holo-float-card::-webkit-scrollbar{width:0;height:0;display:none}
.hfc-icon{width:52px;height:52px;color:var(--holo-primary);filter:drop-shadow(0 0 8px rgba(0,194,255,0.5))}
.hfc-title{font-family:'Inter',sans-serif;font-weight:600;font-size:1.25rem;color:#fff;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 4px rgba(0,0,0,0.6);margin:0}
.hfc-desc{font-family:'Inter',sans-serif;font-weight:300;font-size:0.95rem;color:rgba(200,225,240,0.85);line-height:1.6;margin:0}
.hfc-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 30px;border-radius:50px;font-family:'Inter',sans-serif;font-size:0.85rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;color:var(--holo-primary);background:transparent;border:1px solid rgba(0,194,255,0.4);box-shadow:0 0 12px rgba(0,194,255,0.1);transition:all 0.25s ease;margin-top:4px}
.hfc-btn:hover{background:var(--holo-primary);color:#000;box-shadow:0 0 20px rgba(0,194,255,0.5)}
.qr-start{position:absolute;top:0;left:0;width:100%;height:100vh;pointer-events:none;z-index:15}
.scroll-dots-wrap{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:12px;z-index:10;pointer-events:none;mix-blend-mode:screen}
.scroll-dot{width:6px;height:6px;background-color:var(--holo-primary);border-radius:50%;box-shadow:0 0 10px var(--holo-primary),0 0 20px var(--holo-primary);opacity:0}
.qr-earth{position:relative;z-index:20;width:100%;max-width:1200px;margin:-70vh auto 0;padding:80px 48px 120px;display:flex;flex-direction:column;gap:0}
.sep{width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,194,255,0.4),transparent);opacity:0.3;margin:20px 0}
.sep-sm{width:80px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,194,255,0.4),transparent);opacity:0.3}
.man-block{text-align:center;max-width:900px;margin:0 auto 60px;display:flex;flex-direction:column;align-items:center}
.man-text{font-family:'Inter',sans-serif;font-weight:200;font-size:clamp(1.3rem,2.5vw,1.8rem);line-height:1.6;color:#fff;margin:0;white-space:pre-line;text-align:center}
/* Materialización de señal (misma técnica del Modo Presencia del Espejo).
   La palabra es un bloque sin quiebre: el salto de línea cae donde debe y
   el ancho no baila mientras el frente avanza. El glifo se pinta ENCIMA
   del carácter real, en posición absoluta, para no mover nada. */
.mx-w{display:inline-block;white-space:nowrap}
.mx-c{position:relative}
.mx-g{position:absolute;inset:0;text-align:center;pointer-events:none;text-shadow:0 0 9px currentColor}
.gt{font-family:'Inter',sans-serif;font-weight:300;margin:0;background:linear-gradient(180deg,var(--holo-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:0.22em;text-align:center}
.guia-sec{display:flex;flex-direction:column;align-items:center;gap:24px;padding:90px 40px 100px}
/* Dos arquitectos, lado a lado. Con una sola persona el carril se
   comporta igual que antes (una columna centrada); con dos, se reparten
   y en pantallas angostas se apilan solos por el flex-wrap. */
.guia-duo{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:64px 48px;width:100%;max-width:1040px}
/* 🜂 v5.20 — La ficha pide más ancho (430 de base en vez de 330) para que
   la firma de una línea quepa entera. Consecuencia buscada: por debajo de
   ~940px las dos fichas se APILAN en vez de convivir estrechas, y cada
   una recibe el ancho completo. */
.guia-p{flex:1 1 430px;max-width:520px;display:flex;flex-direction:column;align-items:center;gap:22px}
.guia-img{width:220px;height:220px;border-radius:50%;overflow:hidden;border:2px solid rgba(0,194,255,0.4);box-shadow:0 0 40px rgba(0,194,255,0.2),0 0 80px rgba(0,194,255,0.08)}
.guia-img img{width:100%;height:100%;object-fit:cover}
.guia-desc{font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:300;color:#fff;opacity:0.6;margin:0;text-align:center;line-height:1.7;max-width:600px;white-space:pre-line}
/* 🜂 v5.20 — LA FIRMA VIVE EN UNA SOLA LÍNEA. Es una firma, no un
   párrafo: partida en dos renglones las dos fichas dejan de tener la
   misma altura y el carril se ve desparejo. Va sin quiebre posible y con
   un cuerpo que se encoge con la pantalla en lugar de quebrarse — al
   llegar al tope (1.02rem) deja de crecer, así en pantalla grande no se
   dispara. Solo la corta; la extendida sigue fluyendo normal. */
.guia-desc-1l{white-space:nowrap!important;max-width:none!important;font-size:clamp(0.58rem,3.05vw,1.02rem)!important;letter-spacing:0.004em}
@keyframes gshim{0%{left:-100%}50%{left:140%}100%{left:140%}}
.gold-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:18px 44px;border-radius:16px;border:1px solid rgba(212,168,67,0.6);background:linear-gradient(135deg,rgba(212,168,67,0.15),transparent,rgba(212,168,67,0.1));color:#D4A843;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;outline:none;text-decoration:none;overflow:hidden;backdrop-filter:blur(4px);box-shadow:0 0 20px rgba(212,168,67,0.2),0 0 40px rgba(212,168,67,0.08),inset 0 1px 0 rgba(212,168,67,0.25);transition:all 0.3s ease}
.gold-btn:hover{border-color:rgba(212,168,67,0.9);box-shadow:0 0 30px rgba(212,168,67,0.35),0 0 60px rgba(212,168,67,0.15);transform:translateY(-2px)}
.gold-btn .shim{position:absolute;inset:0;border-radius:16px;overflow:hidden;pointer-events:none}
.gold-btn .shim::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(212,168,67,0.25),transparent);animation:gshim 3.5s ease-in-out infinite}
.hide-btn{padding:12px 28px;border-radius:50px;border:1px solid rgba(0,194,255,0.2);background:transparent;color:rgba(0,194,255,0.5);font-family:'Inter',sans-serif;font-size:0.8rem;font-weight:400;letter-spacing:0.08em;cursor:pointer;outline:none;text-transform:uppercase;transition:all 0.3s}
.hide-btn:hover{border-color:rgba(0,194,255,0.5);color:rgba(0,194,255,0.8)}
.rm-btn{margin-top:28px;display:inline-flex;align-items:center;gap:10px;padding:14px 30px;border-radius:50px;border:1px solid rgba(0,194,255,0.25);background:transparent;color:rgba(0,194,255,0.6);font-family:'Inter',sans-serif;font-size:0.82rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;outline:none;transition:all 0.3s}
.rm-btn:hover{border-color:rgba(0,194,255,0.5);color:rgba(0,194,255,0.9)}
.sig-block{width:100%;display:flex;flex-direction:column;align-items:center;gap:40px;margin:70px 0}
.sig-content{text-align:center;max-width:700px}
.sig-title{font-family:'Inter',sans-serif;font-weight:300;font-size:1.1rem;letter-spacing:0.22em;text-transform:uppercase;background:linear-gradient(180deg,var(--holo-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;filter:drop-shadow(0 0 8px var(--holo-glow))}
.sig-desc{font-family:'Inter',sans-serif;font-weight:300;font-size:1.05rem;color:rgba(255,255,255,0.6);margin-bottom:36px;line-height:1.7}
.sig-form{display:flex;gap:14px;width:100%;max-width:560px;margin:0 auto}
.sig-input{flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px 20px;color:#fff;font-family:'Inter',sans-serif;font-size:1rem;outline:none;transition:border-color 0.3s,box-shadow 0.3s}
.sig-input:focus{border-color:var(--holo-primary);box-shadow:0 0 15px rgba(0,194,255,0.2)}
.sig-sub{background:rgba(0,194,255,0.1);border:1px solid rgba(0,194,255,0.35);color:var(--holo-primary);padding:0 28px;border-radius:10px;font-family:'Inter',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;text-transform:uppercase;letter-spacing:0.05em;transition:all 0.3s}
.sig-sub:hover{background:var(--holo-primary);color:#000;border-color:var(--holo-primary);box-shadow:0 0 15px rgba(0,194,255,0.4)}
.sig-sub:disabled{opacity:0.5;cursor:not-allowed}
.ff{margin-top:14px;font-size:0.95rem;font-family:'Inter',sans-serif;color:var(--holo-primary);animation:fi 0.5s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.sat-block{display:flex;gap:100px;justify-content:center;align-items:center;margin:60px auto}
.sat-link{color:rgba(255,255,255,0.4);transition:all 0.3s cubic-bezier(0.25,0.8,0.25,1);display:flex}
.sat-link:hover{color:var(--holo-primary);transform:scale(1.15) translateY(-2px);filter:drop-shadow(0 0 8px var(--holo-primary))}
.sat-icon{width:48px;height:48px;stroke-width:1.5}
.foot-block{margin-top:60px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:28px;opacity:0.8}
.foot-text{font-family:'Inter',sans-serif;font-weight:300;font-size:1rem;letter-spacing:0.05em;color:rgba(255,255,255,0.6);margin:0}
.foot-btn{display:flex;align-items:center;gap:14px;padding:14px 32px;border:1px solid rgba(0,194,255,0.3);border-radius:50px;background:rgba(0,0,0,0.3);color:var(--holo-primary);text-decoration:none;transition:all 0.3s ease;text-transform:uppercase;font-family:'Inter',sans-serif;font-size:0.9rem;letter-spacing:0.1em;font-weight:600;cursor:pointer;outline:none}
.foot-btn:hover{border-color:var(--holo-primary);box-shadow:0 0 20px rgba(0,194,255,0.4);background:rgba(0,194,255,0.05);color:#fff}
.afin-ov{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:5vh 5vw}
.afin-sh{width:100%;max-width:780px;max-height:85vh;background:radial-gradient(ellipse 80% 40% at 50% -5%,rgba(0,194,255,0.1),transparent 60%),linear-gradient(145deg,rgba(8,14,28,0.95),rgba(5,10,20,0.98));border-radius:20px;border:1px solid rgba(0,194,255,0.3);border-top:1px solid rgba(0,194,255,0.45);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 0 40px rgba(0,194,255,0.15),0 0 80px rgba(0,194,255,0.06),0 20px 60px rgba(0,0,0,0.6);position:relative}
.afin-hd{flex-shrink:0;padding:24px 32px 16px;display:flex;justify-content:center;align-items:center;position:relative;border-bottom:1px solid rgba(0,194,255,0.15)}
.afin-ti{font-family:'Inter',sans-serif;font-size:1.3rem;font-weight:200;margin:0;text-transform:uppercase;letter-spacing:0.12em;background:linear-gradient(180deg,var(--holo-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 8px rgba(0,194,255,0.3))}
.afin-x{position:absolute;right:32px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,194,255,0.2);background:rgba(255,255,255,0.03);color:rgba(0,194,255,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;padding:0;transition:transform 0.2s ease-out,box-shadow 0.2s ease-out,background 0.15s ease-out,color 0.15s ease-out,border-color 0.15s ease-out}
.afin-x:hover{transform:rotate(90deg) scale(1.15);box-shadow:0 0 12px rgba(0,194,255,0.4),0 0 24px rgba(0,194,255,0.15);background:rgba(0,194,255,0.12);color:var(--holo-primary);border-color:currentColor}
.afin-bd{flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:20px;padding:16px 32px 32px;scrollbar-width:thin;scrollbar-color:rgba(0,194,255,0.25) transparent}
.afin-bd::-webkit-scrollbar{display:none}
.afin-desc{font-family:'Inter',sans-serif;font-size:1.05rem;font-weight:300;color:#fff;opacity:0.6;text-align:center;line-height:1.8;margin:0;white-space:pre-line;width:100%;max-width:600px}
.afin-ta{width:100%;min-height:180px;padding:22px 24px;border-radius:18px;border:1px solid rgba(0,194,255,0.12);background:rgba(5,10,20,0.5);color:#fff;outline:none;font-family:'Inter',sans-serif;font-size:1rem;line-height:1.7;resize:vertical;transition:border-color 0.3s,box-shadow 0.3s}
.afin-ta::placeholder{color:rgba(255,255,255,0.25)}
.afin-ta:focus{border-color:rgba(0,194,255,0.5);box-shadow:0 0 25px rgba(0,194,255,0.2),inset 0 0 10px rgba(0,194,255,0.05)}
.afin-sub{width:100%;padding:18px;border-radius:16px;border:1px solid rgba(0,194,255,0.1);background:transparent;color:rgba(0,194,255,0.25);font-family:'Inter',sans-serif;font-size:0.95rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:default;outline:none;transition:all 0.3s}
.afin-sub.hm{border-color:rgba(0,194,255,0.5);color:var(--holo-primary);background:linear-gradient(135deg,rgba(0,194,255,0.1),transparent);cursor:pointer;box-shadow:0 0 20px rgba(0,194,255,0.15),inset 0 1px 0 rgba(255,255,255,0.05)}
.afin-sub.hm:hover{background:var(--holo-primary);color:#000;box-shadow:0 0 30px rgba(0,194,255,0.4)}
.afin-sub.ok{border-color:rgba(100,255,150,0.4);background:rgba(100,255,150,0.08);color:rgba(100,255,150,0.9);cursor:default}
`

/* ═══════════════════════════════════════
   CSS — MOBILE ADDITIONS
   ═══════════════════════════════════════ */
const MOBILE_CSS = String.raw`
.or-scroll::-webkit-scrollbar{width:0;background:transparent}
.or-scroll{scrollbar-width:none;-ms-overflow-style:none}
.or-nav-card{transition:transform .12s ease-out,box-shadow .12s ease-out}
.or-nav-card:active{transform:scale(0.96)!important}
.or-cta-btn{transition:transform .12s ease-out,box-shadow .12s ease-out}
.or-cta-btn:active{transform:scale(0.95)!important}
.or-fab{transition:transform .1s ease-out,box-shadow .1s ease-out}
.or-fab:active{transform:scale(0.9)}
@keyframes exploreShimmer{0%{left:-100%}50%{left:140%}100%{left:140%}}
@keyframes consolaOverlayIn{from{opacity:0}to{opacity:1}}
@keyframes consolaSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}

/* ── Mobile Afinaciones bottom sheet ── */
@media(max-width:768px){
  .afin-ov{align-items:flex-end;padding:0}
  .afin-sh{max-width:100%;max-height:88vh;border-radius:22px 22px 0 0;border-bottom:none}
  .afin-hd{padding:20px 20px 14px}
  .afin-hd::before{content:"";width:40px;height:3px;border-radius:2px;background:rgba(255,255,255,0.5);position:absolute;top:8px;left:50%;transform:translateX(-50%)}
  .afin-ti{font-size:1rem}
  .afin-x{right:20px;width:28px;height:28px}
  .afin-bd{padding:10px 24px 30px}
  .afin-desc{font-size:0.85rem}
  .afin-ta{min-height:130px;padding:16px;font-size:16px}
  .afin-sub{font-size:0.85rem;padding:16px;border-radius:14px}

  /* Mobile earth overrides */
  .qr-earth{margin:0 auto;padding:60px 28px 80px}
  .guia-sec{padding:70px 24px 80px}
  .guia-duo{gap:56px 24px}
  .guia-img{width:160px;height:160px}
  .guia-desc{font-size:0.88rem;max-width:340px}
  /* La firma de una línea se re-afirma con la especificidad del bloque
     móvil: si no, el max-width de 340px la volvería a quebrar. */
  .guia-desc-1l{font-size:clamp(0.58rem,3.05vw,0.92rem)!important;max-width:none!important;white-space:nowrap!important}
  .man-text{font-size:1.15rem}
  .sig-desc{font-size:0.88rem}
  .sat-block{gap:40px}
  .sat-icon{width:28px;height:28px}
  .gold-btn{padding:16px 36px;font-size:0.8rem}
  .rm-btn{font-size:0.72rem;padding:12px 24px}
  .hide-btn{font-size:0.7rem;padding:10px 20px}
}

/* ── JS-driven mobile class ──
   On iOS Safari the CSS viewport can be ~980px even on phones,
   causing @media(max-width:768px) to NOT match.
   JS detects phone via UA and adds .rsv-is-mobile to <html>.
   These rules mirror the @media block above as a failsafe. */
html.rsv-is-mobile .qr-earth{margin:0 auto!important;padding:60px 28px 80px!important}
html.rsv-is-mobile .guia-sec{padding:70px 24px 80px!important}
html.rsv-is-mobile .guia-duo{gap:56px 24px!important}
html.rsv-is-mobile .guia-img{width:160px!important;height:160px!important}
html.rsv-is-mobile .guia-desc{font-size:0.88rem!important;max-width:340px!important}
html.rsv-is-mobile .guia-desc-1l{font-size:clamp(0.58rem,3.05vw,0.92rem)!important;max-width:none!important;white-space:nowrap!important}
html.rsv-is-mobile .man-text{font-size:1.15rem!important}
html.rsv-is-mobile .sig-desc{font-size:0.88rem!important}
html.rsv-is-mobile .sat-block{gap:40px!important}
html.rsv-is-mobile .sat-icon{width:28px!important;height:28px!important}
html.rsv-is-mobile .gold-btn{padding:16px 36px!important;font-size:0.8rem!important}
html.rsv-is-mobile .rm-btn{font-size:0.72rem!important;padding:12px 24px!important}
html.rsv-is-mobile .hide-btn{font-size:0.7rem!important;padding:10px 20px!important}
html.rsv-is-mobile .afin-ov{align-items:flex-end!important;padding:0!important}
html.rsv-is-mobile .afin-sh{max-width:100%!important;max-height:88vh!important;border-radius:22px 22px 0 0!important;border-bottom:none!important}
html.rsv-is-mobile .afin-hd{padding:20px 20px 14px!important}
html.rsv-is-mobile .afin-ti{font-size:1rem!important}
html.rsv-is-mobile .afin-x{right:20px!important;width:28px!important;height:28px!important}
html.rsv-is-mobile .afin-bd{padding:10px 24px 30px!important}
html.rsv-is-mobile .afin-desc{font-size:0.85rem!important}
html.rsv-is-mobile .afin-ta{min-height:130px!important;padding:16px!important;font-size:16px!important}
html.rsv-is-mobile .afin-sub{font-size:0.85rem!important;padding:16px!important;border-radius:14px!important}
`

const COMBINED_CSS = DESKTOP_CSS + "\n" + MOBILE_CSS

function useInjectSolarCss(onReady?: () => void) {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const fId = "q-font"
        if (!document.getElementById(fId)) {
            const lnk = document.createElement("link")
            lnk.id = fId
            lnk.rel = "stylesheet"
            lnk.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap"
            document.head.appendChild(lnk)
        }
        const cId = "q-css-v5"
        let el = document.getElementById(cId) as HTMLStyleElement | null
        if (!el) {
            el = document.createElement("style")
            el.id = cId
            el.textContent = COMBINED_CSS
            document.head.appendChild(el)
        } else if (el.dataset.h !== String(COMBINED_CSS.length))
            el.textContent = COMBINED_CSS
        el.dataset.h = String(COMBINED_CSS.length)
        onReady?.()
    }, [])
}

/* ═══════════════════════════════════════
   SHARED SOCIAL ICONS
   ═══════════════════════════════════════ */
const IconSpotify = ({ mobile }: { mobile?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className={mobile ? undefined : "sat-icon"}
        width={mobile ? 28 : undefined}
        height={mobile ? 28 : undefined}
        strokeWidth="1.5"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12c2.5-1.5 6.5-1.5 9 0" strokeLinecap="round" />
        <path d="M7 15c3-2 8-2 11 0" strokeLinecap="round" opacity="0.8" />
        <path d="M9 9c2-1 5-1 7 0" strokeLinecap="round" opacity="0.6" />
    </svg>
)
const IconInstagram = ({ mobile }: { mobile?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className={mobile ? undefined : "sat-icon"}
        width={mobile ? 28 : undefined}
        height={mobile ? 28 : undefined}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
)
const IconXTwitter = ({ mobile }: { mobile?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className={mobile ? undefined : "sat-icon"}
        width={mobile ? 28 : undefined}
        height={mobile ? 28 : undefined}
        strokeWidth="1.5"
        strokeLinejoin="round"
    >
        <path d="M19.9962 4H17.1761L12.5361 9.352L8.49413 4H2.68213L9.62612 13.126L3.05412 20.636H5.87612L10.9641 14.824L15.4081 20.636H21.0821L13.8321 11.048L19.9962 4Z" />
        <path d="M6.5 5.5 L17.5 19" strokeWidth="1.2" strokeLinecap="butt" />
    </svg>
)
const IconAntenna = ({ size = 20 }: { size?: number }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width={size}
        height={size}
        strokeWidth="1.5"
        strokeLinecap="round"
    >
        <path d="M12 22V12" />
        <path d="M12 12L8 8" />
        <path d="M12 12L16 8" />
        <path d="M4 10C4 10 7 14 12 14C17 14 20 10 20 10" />
        <circle cx="12" cy="5" r="2" />
    </svg>
)

/* ═══════════════════════════════════════
   DESKTOP: SHAPE SVGs (Planet Icons)
   ═══════════════════════════════════════ */
const TesseractSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "sw-t 6s ease-in-out infinite alternate" }}
    >
        <path d="M22,36 L62,36 L62,76 L22,76 Z" className="lc" />
        <path d="M34,26 L74,26 L74,66 L34,66 Z" className="lc ld" />
        <path
            d="M33,47 L51,47 L51,65 L33,65 Z"
            className="lc"
            style={{ strokeWidth: 2 }}
        />
        <path
            d="M22,36 L33,47 M62,36 L51,47 M22,76 L33,65 M62,76 L51,65"
            className="lc"
        />
    </svg>
)
const MerkabaSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "spin-s 12s linear infinite" }}
    >
        <g
            style={{
                transformOrigin: "50% 50%",
                animation: "flt-y 4s ease-in-out infinite",
            }}
        >
            <path d="M20,30 L80,30 L50,82 Z" className="lc" />
            <path
                d="M20,30 L50,55 M80,30 L50,55 M50,82 L50,55"
                className="lc ld"
            />
            <path d="M20,70 L80,70 L50,18 Z" className="lc" />
            <path
                d="M20,70 L50,45 M80,70 L50,45 M50,18 L50,45"
                className="lc ld"
            />
            <circle
                cx="50"
                cy="50"
                r="4"
                fill="var(--holo-primary)"
                style={{ filter: "blur(2px)" }}
            />
        </g>
    </svg>
)
const GyroscopeSVG = () => (
    <svg className="sh" viewBox="0 0 100 100">
        <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="45"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-s 8s linear infinite",
            }}
            strokeDasharray="4 4"
        />
        <ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="12"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-r 6s linear infinite",
            }}
        />
        <ellipse
            cx="50"
            cy="50"
            rx="12"
            ry="25"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-s 5s linear infinite",
            }}
        />
        <circle
            cx="50"
            cy="50"
            r="6"
            fill="var(--holo-primary)"
            style={{ animation: "pls-s 2s ease-in-out infinite" }}
        />
    </svg>
)
const TorusSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "spin-s 20s linear infinite" }}
    >
        <g style={{ opacity: 0.8 }}>
            {[0, 30, 60, 90, 120, 150].map((d) => (
                <ellipse
                    key={d}
                    cx="50"
                    cy="50"
                    rx="40"
                    ry="12"
                    className="lc"
                    style={{
                        transformOrigin: "50% 50%",
                        transform: `rotate(${d}deg)`,
                    }}
                />
            ))}
        </g>
        <circle
            cx="50"
            cy="50"
            r="8"
            stroke="var(--holo-primary)"
            strokeWidth="1"
            fill="none"
        />
    </svg>
)
const CrystalSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "flt-y 6s ease-in-out infinite" }}
    >
        <g
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-r 15s linear infinite",
            }}
        >
            <path
                d="M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z"
                className="lc"
                strokeWidth="1.8"
            />
            <path
                d="M50,10 L50,50 M85,30 L50,50 M85,70 L50,50 M50,90 L50,50 M15,70 L50,50 M15,30 L50,50"
                className="lc ld"
            />
        </g>
    </svg>
)
const HexRadarSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "flt-y 6s ease-in-out infinite" }}
    >
        {/* Marco hexagonal + rayos: rota lento */}
        <g
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-s 22s linear infinite",
            }}
        >
            <polygon
                points="50,6 88,28 88,72 50,94 12,72 12,28"
                className="lc"
                strokeWidth="1.8"
            />
            <polygon
                points="50,20 73,33 73,67 50,80 27,67 27,33"
                className="lc ld"
            />
            <path
                d="M50,50 L50,6 M50,50 L88,28 M50,50 L88,72 M50,50 L50,94 M50,50 L12,72 M50,50 L12,28"
                className="lc ld"
                strokeWidth="0.8"
            />
            <circle cx="50" cy="6" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
            <circle cx="88" cy="28" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
            <circle cx="88" cy="72" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
            <circle cx="50" cy="94" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
            <circle cx="12" cy="72" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
            <circle cx="12" cy="28" r="2.4" fill="var(--holo-primary)" opacity="0.85" />
        </g>
        {/* Hex interno pulsante */}
        <polygon
            points="50,34 63,42 63,58 50,66 37,58 37,42"
            className="lc"
            strokeWidth="1.2"
            style={{
                transformOrigin: "50% 50%",
                animation: "pls-s 2.4s ease-in-out infinite",
            }}
        />
        {/* Índice de Silicio — núcleo */}
        <circle
            cx="50"
            cy="50"
            r="4"
            fill="var(--holo-primary)"
            style={{
                transformOrigin: "50% 50%",
                animation: "pls-s 2s ease-in-out infinite",
            }}
        />
        <circle cx="50" cy="50" r="1.8" fill="#fff" opacity="0.95" />
    </svg>
)
const CardIcon: React.FC<{ id: string }> = ({ id }) => {
    switch (id) {
        case "simuladores":
            return <TesseractSVG />
        case "codices":
            return <MerkabaSVG />
        case "sesiones":
            return <GyroscopeSVG />
        case "meditaciones":
            return <TorusSVG />
        case "fragmentos":
            return <CrystalSVG />
        case "escaner":
            return <HexRadarSVG />
        default:
            return <div />
    }
}

/* ═══════════════════════════════════════
   MOBILE: NAV CARD ICONS
   ═══════════════════════════════════════ */
const IconBook = ({ color, size = 30 }: { color: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
    >
        <path d="M8 8 C8 8 18 6 32 12 C46 6 56 8 56 8 L56 50 C56 50 46 48 32 54 C18 48 8 50 8 50 Z" />
        <line x1="32" y1="12" x2="32" y2="54" />
    </svg>
)
const IconSunRays = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => {
    const rays = Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
            <line
                key={i}
                x1={32 + Math.cos(a) * 15}
                y1={32 + Math.sin(a) * 15}
                x2={32 + Math.cos(a) * 24}
                y2={32 + Math.sin(a) * 24}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.9}
            />
        )
    })
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="32"
                cy="32"
                r="10"
                fill={hexToRgba(color, 0.2)}
                stroke={color}
                strokeWidth="2"
            />
            {rays}
        </motion.svg>
    )
}
const IconClapper = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
    >
        <rect x="8" y="22" width="48" height="34" rx="3" />
        <path d="M8 22 L14 8 L56 8 L56 22 Z" />
        <line x1="22" y1="8" x2="28" y2="22" />
        <line x1="38" y1="8" x2="44" y2="22" />
    </svg>
)
const IconLotus = ({ color, size = 30 }: { color: string; size?: number }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
        animate={{ y: [-1, 1, -1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
        <path
            d="M32 12 C26 22 22 32 26 42 C28 46 36 46 38 42 C42 32 38 22 32 12 Z"
            fill={hexToRgba(color, 0.15)}
        />
        <path
            d="M20 20 C14 28 10 38 18 44 C22 46 28 44 28 40 C30 34 26 26 20 20 Z"
            fill={hexToRgba(color, 0.08)}
        />
        <path
            d="M44 20 C50 28 54 38 46 44 C42 46 36 44 36 40 C34 34 38 26 44 20 Z"
            fill={hexToRgba(color, 0.08)}
        />
        <path d="M18 48 C24 50 32 52 32 52 C32 52 40 50 46 48" />
    </motion.svg>
)

/* v5.X — Glifo Simuladores: retícula concéntrica + 4 nodos
   orbitales pulsantes. Mismo lenguaje que la card de Holoteca para
   coherencia visual entre el Lente y el Escáner. */
const IconSimuladoresOrigen = ({
    color = "#00C2FF",
    size = 30,
}: {
    color?: string
    size?: number
}) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
    >
        <motion.circle
            cx="32"
            cy="32"
            r="26"
            opacity={0.45}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
        <circle cx="32" cy="32" r="18" opacity={0.55} />
        <circle cx="32" cy="32" r="10" opacity={0.7} />
        <line x1="32" y1="2" x2="32" y2="14" opacity={0.55} />
        <line x1="32" y1="50" x2="32" y2="62" opacity={0.55} />
        <line x1="2" y1="32" x2="14" y2="32" opacity={0.55} />
        <line x1="50" y1="32" x2="62" y2="32" opacity={0.55} />
        <circle cx="32" cy="32" r="3.4" fill={hexToRgba(color, 0.95)} />
        {[0, 1, 2, 3].map((i) => {
            const a = (Math.PI / 2) * i - Math.PI / 2
            const r = 18
            const cx = 32 + Math.cos(a) * r
            const cy = 32 + Math.sin(a) * r
            return (
                <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="2.6"
                    fill={hexToRgba(color, 0.85)}
                    stroke="none"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.55,
                    }}
                />
            )
        })}
    </motion.svg>
)

/* ═══════════════════════════════════════
   DESKTOP: STARS + COMETS
   ═══════════════════════════════════════ */
type Star = {
    id: number
    sz: number
    tx: number
    ty: number
    dur: number
    dl: number
}
const StarsBackground: React.FC<{
    count: number
    comets: number
    speed: number
}> = memo(({ count, comets, speed }) => {
    const stars = useMemo(() => {
        const a: Star[] = []
        const t = Math.floor(count * 1.5)
        for (let i = 0; i < t; i++)
            a.push({
                id: i,
                sz:
                    Math.random() > 0.8
                        ? Math.random() * 2 + 1
                        : Math.random() * 1.5 + 0.5,
                tx: (Math.random() - 0.5) * 250,
                ty: (Math.random() - 0.5) * 250,
                dur: 1.5 + Math.random() * 4,
                dl: Math.random() * 5,
            })
        return a
    }, [count])
    const cRefs = useRef<HTMLDivElement[]>([])
    const setupC = (el: HTMLDivElement | null) => {
        if (!el) return
        const w = window?.innerWidth ?? 1440,
            h = window?.innerHeight ?? 900
        const edge = Math.floor(Math.random() * 4)
        let x = 0,
            y = 0,
            ang = 0
        if (edge === 0) {
            x = Math.random() * w
            y = -40
            ang = 90 + (Math.random() * 60 - 30)
        } else if (edge === 1) {
            x = w + 40
            y = Math.random() * h
            ang = 180 + (Math.random() * 60 - 30)
        } else if (edge === 2) {
            x = Math.random() * w
            y = h + 40
            ang = -90 + (Math.random() * 60 - 30)
        } else {
            x = -40
            y = Math.random() * h
            ang = Math.random() * 60 - 30
        }
        const rad = (ang * Math.PI) / 180,
            travel = Math.sqrt(w * w + h * h) * 1.2
        el.style.setProperty("--x", `${x}px`)
        el.style.setProperty("--y", `${y}px`)
        el.style.setProperty("--dx", `${Math.cos(rad) * travel}px`)
        el.style.setProperty("--dy", `${Math.sin(rad) * travel}px`)
        el.style.setProperty("--rot", `${ang}deg`)
        el.style.setProperty("--dur", `${6 + Math.random() * 8}s`)
        el.style.setProperty("--delay", `${Math.random() * 6}s`)
        el.style.animation = "none"
        void el.offsetWidth
        el.style.animation = `comet-move var(--dur) linear var(--delay) 1 both`
    }
    useEffect(() => {
        cRefs.current = cRefs.current.slice(0, comets)
    }, [comets])
    useEffect(() => {
        cRefs.current.forEach((el) => el && setupC(el))
    }, [comets])
    return (
        <div className="sf-wrap">
            {stars.map((s) => (
                <div
                    key={s.id}
                    className="sf-s"
                    style={
                        {
                            "--sz": `${s.sz}px`,
                            "--tx": `${s.tx}vw`,
                            "--ty": `${s.ty}vh`,
                            "--dur": `${s.dur / speed}s`,
                            "--dl": `${s.dl}s`,
                        } as React.CSSProperties
                    }
                />
            ))}
            {Array.from({ length: comets }).map((_, i) => (
                <div
                    key={`c${i}`}
                    className="comet"
                    ref={(el) => {
                        if (el) cRefs.current[i] = el
                    }}
                    onAnimationEnd={(e) =>
                        setupC(e.currentTarget as HTMLDivElement)
                    }
                />
            ))}
        </div>
    )
})
StarsBackground.displayName = "StarsBackground"

/* ═══════════════════════════════════════
   MOBILE: STARS (lighter weight)
   ═══════════════════════════════════════ */
const pr = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
}
const MobileStars = memo(
    ({
        num = 90,
        speed = 1,
        bgColor = "#000",
    }: {
        num?: number
        speed?: number
        bgColor?: string
    }) => {
        const ref = useRef<HTMLDivElement>(null)
        const [on, setOn] = useState(false)
        const stars = useMemo(() => {
            const c = Math.floor(num * 1.5),
                a: any[] = []
            for (let i = 0; i < c; i++) {
                const sz =
                    pr(i) > 0.8
                        ? pr(i + 1000) * 2 + 1
                        : pr(i + 1000) * 1.5 + 0.5
                a.push({
                    id: i,
                    sz,
                    tx: `${((pr(i + 2000) - 0.5) * 250).toFixed(0)}vw`,
                    ty: `${((pr(i + 3000) - 0.5) * 250).toFixed(0)}vh`,
                    d: `${((1.5 + pr(i + 4000) * 4) / speed).toFixed(2)}s`,
                    dl: `${(pr(i + 5000) * 5).toFixed(2)}s`,
                })
            }
            return a
        }, [num, speed])
        useEffect(() => {
            let d = false
            const a = () => {
                if (d) return
                d = true
                setOn(true)
            }
            requestAnimationFrame(() => requestAnimationFrame(a))
            const t = setTimeout(a, 250)
            return () => {
                d = true
                clearTimeout(t)
            }
        }, [])
        return (
            <>
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        backgroundColor: bgColor,
                        minHeight: "100vh",
                    }}
                />
                <div className="sf-stars-container" ref={ref}>
                    {stars.map((s) => (
                        <div
                            key={s.id}
                            className={`sf-star${on ? " sf-active" : ""}`}
                            style={{
                                width: s.sz,
                                height: s.sz,
                                ["--tx" as any]: s.tx,
                                ["--ty" as any]: s.ty,
                                ["--d" as any]: s.d,
                                ["--dl" as any]: s.dl,
                            }}
                        />
                    ))}
                </div>
            </>
        )
    }
)
MobileStars.displayName = "MobileStars"

/* ═══════════════════════════════════════
   AFINACIONES MODAL (responsive)
   ═══════════════════════════════════════ */
const AfinacionesModal: React.FC<{
    title: string
    text: string
    webhookUrl: string
    onClose: () => void
}> = ({ title, text, webhookUrl, onClose }) => {
    const [msg, setMsg] = useState("")
    const [st, setSt] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    )
    const hm = msg.trim().length > 0
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", f)
        return () => window.removeEventListener("keydown", f)
    }, [onClose])
    const sub = async () => {
        if (!msg.trim() || !webhookUrl) {
            if (!webhookUrl) setSt("error")
            return
        }
        setSt("loading")
        try {
            const r = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: msg,
                    source: "redsolarviva_afinaciones",
                    fecha: new Date().toISOString(),
                }),
            })
            if (r.ok) {
                setSt("success")
                setMsg("")
            } else setSt("error")
        } catch {
            setSt("error")
        }
    }
    /* Portal to document.body so the modal escapes the scroll
       container's stacking context (zIndex:2). Without this,
       the FAB (zIndex:99997) renders above the modal, and iOS
       Safari clips the modal when scrolling inside it. */
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            className="afin-ov"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="afin-sh"
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="afin-hd">
                    <span className="afin-ti">{title}</span>
                    <button className="afin-x" onClick={onClose}>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>
                <div className="afin-bd">
                    <p className="afin-desc">{nl(text)}</p>
                    <div className="sep-sm" />
                    <textarea
                        className="afin-ta"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        disabled={st === "loading" || st === "success"}
                        placeholder="Escribe aquí tu propuesta de afinación…"
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault()
                                sub()
                            }
                        }}
                    />
                    <button
                        className={`afin-sub ${hm ? "hm" : ""} ${st === "success" ? "ok" : ""}`}
                        onClick={sub}
                        disabled={st === "loading" || st === "success" || !hm}
                    >
                        {st === "loading"
                            ? "..."
                            : st === "success"
                              ? "✓ ENVIADO"
                              : "ENVIAR"}
                    </button>
                    {st === "success" && (
                        <p className="ff">
                            Señal recibida. Gracias por co-crear.
                        </p>
                    )}
                    {st === "error" && (
                        <p className="ff" style={{ color: "#ff4d4d" }}>
                            Error en la señal. Intenta de nuevo.
                        </p>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
const containerV = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { delayChildren: 0.4, staggerChildren: 0.2 },
    },
}
const titleV = {
    hidden: { opacity: 0, y: -30, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.2, delay: 0.2, ease: "easeOut" },
    },
}
const sysV = {
    hidden: { opacity: 0, scale: 0.85, filter: "blur(5px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 1.5, ease: "easeOut" },
    },
}
const epicR = {
    hidden: { opacity: 0, y: 60, filter: "blur(20px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
    },
}
const cardV = {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        filter: "blur(6px)",
        transition: { duration: 0.25, ease: "easeIn" },
    },
}

/* ═══════════════════════════════════════
   DESKTOP: FLOATING CARD
   ═══════════════════════════════════════ */
const FloatingCard: React.FC<{
    planet: PlanetConfig
    x: number
    y: number
    onClose: () => void
}> = ({ planet, x, y, onClose }) => {
    /* 🜂 v5.18 — LA FICHA NUNCA SE SALE DE LA PANTALLA.
       Antes el alto era un número fijo (340) escrito a mano, así que una
       ficha larga —Códices tiene tres párrafos— se pasaba del borde de
       abajo y el texto quedaba cortado. Ahora se MIDE el alto real ya
       montada y se recoloca; si aun así no cabe (ventana muy baja), la
       ficha se acota y desplaza por dentro. */
    const ref = useRef<HTMLDivElement | null>(null)
    const CARD_W = 380
    const SAFE_T = 80,
        SAFE_B = 20

    const calc = useCallback(
        (h: number) => {
            const vw = typeof window !== "undefined" ? window.innerWidth : 1440
            const vh = typeof window !== "undefined" ? window.innerHeight : 900
            const centerX = vw / 2
            const nodeIsLeft = x < centerX
            let left: number
            if (nodeIsLeft) left = Math.max(20, x - CARD_W - 40)
            else left = Math.min(vw - CARD_W - 20, x + 40)
            const cardCenterX = left + CARD_W / 2
            const deadZoneL = centerX - 180,
                deadZoneR = centerX + 180
            if (cardCenterX > deadZoneL && cardCenterX < deadZoneR) {
                if (nodeIsLeft) left = deadZoneL - CARD_W - 10
                else left = deadZoneR + 10
            }
            left = Math.max(20, Math.min(left, vw - CARD_W - 20))

            const libre = Math.max(200, vh - SAFE_T - SAFE_B)
            const alto = Math.min(h, libre)
            let top = y - alto / 2
            top = Math.max(SAFE_T, Math.min(top, vh - alto - SAFE_B))
            return { left, top, maxH: libre }
        },
        [x, y]
    )

    const [pos, setPos] = useState(() => calc(340))
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        /* offsetHeight ignora el transform de la animación de entrada,
           así que mide el alto verdadero aunque la ficha esté escalando. */
        const medir = () => setPos(calc(el.offsetHeight))
        medir()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(medir)
                : null
        if (ro) ro.observe(el)
        window.addEventListener("resize", medir)
        return () => {
            if (ro) ro.disconnect()
            window.removeEventListener("resize", medir)
        }
    }, [calc])

    return (
        <motion.div
            ref={ref}
            className="holo-float-card"
            variants={cardV}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
                left: pos.left,
                top: pos.top,
                maxHeight: pos.maxH,
                overflowY: "auto",
                position: "fixed",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={onClose}
        >
            <div className="hfc-icon">
                <div
                    className="sh-wrap"
                    style={{ position: "relative", width: 52, height: 52 }}
                >
                    <CardIcon id={planet.id} />
                </div>
            </div>
            <h4 className="hfc-title">{planet.panelTitle}</h4>
            <p
                className="hfc-desc"
                dangerouslySetInnerHTML={{
                    __html: planet.desc
                        .replace(/\\n/g, "\n")
                        .replace(/\n/g, "<br/>"),
                }}
            />
            <a
                className="hfc-btn"
                /* 🜂 v5.13 — el Escáner Vibracional ya no va al dominio
                   viejo (escaner.redsolarviva.com, hoy solo backend de las
                   apps nativas) sino a su propia casa de escritorio,
                   app.escanervibracional.com, y con el PORTAL DE TRÁNSITO
                   (Zak: "que se sienta que estás entrando a la aplicación").
                   Los demás planetas conservan su enlace editable. */
                href={
                    planet.id === "escaner"
                        ? ESCANER_LANDING_URL
                        : planet.link
                }
                target={planet.targetBlank ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (planet.id !== "escaner" || planet.targetBlank) return
                    e.preventDefault()
                    abrirPortalEscaner(
                        e.clientX,
                        e.clientY,
                        ESCANER_LANDING_URL
                    )
                }}
            >
                Ir al nodo →
            </a>
        </motion.div>
    )
}

/* ═══════════════════════════════════════
   DESKTOP: SCROLL DOTS
   ═══════════════════════════════════════ */
const ScrollDots = () => (
    <motion.div
        className="scroll-dots-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        transition={{ duration: 1, delay: 1.0 }}
    >
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="scroll-dot"
                custom={i}
                animate={(idx: number) => ({
                    opacity: [0.1, 1, 0.1],
                    transition: {
                        delay: idx * 0.4,
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                    },
                })}
            />
        ))}
    </motion.div>
)

/* ═══════════════════════════════════════
   🜂 v5.20 — MATERIALIZACIÓN DE SEÑAL (el manifiesto se escribe solo)

   La MISMA técnica del Modo Presencia del Espejo Vibracional: un frente
   recorre el texto, los caracteres que quedan dentro de la ventana del
   frente muestran glifos de señal encendidos en cian y dorado, y al
   pasar el frente se ASIENTAN en su letra real.

   Una diferencia deliberada con el Espejo: allá el bloque entero nace
   con su altura final y el texto se revela dentro; aquí el manifiesto
   nace RENGLÓN A RENGLÓN, así el bloque crece y lo que vive debajo —el
   botón de LEER MÁS— se va deslizando con él hasta que el párrafo está
   completo. Al pedir LEER MÁS la pantalla BAJA primero y solo entonces
   arranca la materialización del párrafo siguiente.

   El arranque de la materialización NO depende de que el desplazamiento
   suave termine (un reloj propio lo dispara igual): así funciona también
   donde el navegador congela las animaciones.
   ═══════════════════════════════════════ */

/* Glifos de señal. Sin katakana (el Espejo corre sobre la tipografía del
   sistema en iOS; aquí es web abierta y esos signos pueden no existir):
   geometría, matemáticos y dígitos, presentes en toda plataforma. */
const MX_GLYPHS = "◇◆◈○●△▽✦✧∴∷≋∾⋄⋆01"

const menosMovimiento = () => {
    try {
        return (
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    } catch {
        return false
    }
}

/* Un renglón que se materializa. Las palabras van envueltas en un
   inline-block sin quiebre para que el salto de línea ocurra donde
   corresponde y el ancho no baile mientras el frente avanza. */
const MxRenglon: React.FC<{
    text: string
    onDone: () => void
    cyan: string
    gold: string
    /** 🜂 v5.21 — En el [CENTRO DE MANDO] la escritura va a la MITAD de
        velocidad (Zak: "para que sea más ritualístico aún"). Ahí la pantalla
        es grande, se lee de lejos y hay tiempo para contemplar; en el
        teléfono el ritmo de siempre, que ya se siente ceremonia por el
        tamaño del texto. */
    lento?: boolean
}> = ({ text, onDone, cyan, gold, lento = false }) => {
    const contRef = useRef<HTMLSpanElement | null>(null)
    const [settled, setSettled] = useState(false)
    const doneRef = useRef(false)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    const palabras = useMemo(() => {
        /* Se conservan los espacios como piezas propias para no perder el
           ritmo del texto original. */
        const out: { tipo: "w" | "s"; txt: string }[] = []
        let buf = ""
        for (const ch of text || "") {
            if (ch === " ") {
                if (buf) {
                    out.push({ tipo: "w", txt: buf })
                    buf = ""
                }
                const prev = out[out.length - 1]
                if (prev && prev.tipo === "s") prev.txt += ch
                else out.push({ tipo: "s", txt: ch })
            } else buf += ch
        }
        if (buf) out.push({ tipo: "w", txt: buf })
        return out
    }, [text])

    useEffect(() => {
        if (settled) return
        const cont = contRef.current
        if (!cont) return
        const nodes = Array.from(
            cont.querySelectorAll<HTMLElement>("[data-mx]")
        )
        const total = nodes.length
        const finish = () => {
            setSettled(true)
            if (!doneRef.current) {
                doneRef.current = true
                onDoneRef.current()
            }
        }
        if (!total || menosMovimiento()) {
            finish()
            return
        }
        /* Ritmo del manifiesto: más ágil que el del Espejo (allá el texto
           es largo y se lee con calma; aquí son siete renglones y la
           página entera espera). ~13ms por carácter, acotado — y el DOBLE
           de lento en pantalla grande. La ventana del frente se estira
           igual, para que el rastro de glifos siga cubriendo la misma
           cantidad de letras y no se vea una escritura lenta con un frente
           corto pegado detrás. */
        const F = lento ? 2 : 1
        const dur = Math.max(300 * F, Math.min(760 * F, total * 13 * F))
        const per = dur / total
        const WIN = 150 * F
        const start =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        let first = 0
        let lastG = 0
        let raf = 0
        const tick = (now: number) => {
            const t = now - start
            const doGl = now - lastG > 46
            if (doGl) lastG = now
            for (let i = first; i < total; i++) {
                const rt = i * per
                const el = nodes[i]
                const real = el.children[0] as HTMLElement
                const g = el.children[1] as HTMLElement
                if (t >= rt) {
                    real.style.opacity = "1"
                    if (g.textContent) g.textContent = ""
                    if (i === first) first = i + 1
                } else if (t >= rt - WIN) {
                    if (doGl) {
                        g.textContent =
                            MX_GLYPHS[(Math.random() * MX_GLYPHS.length) | 0]
                        g.style.color = i % 3 === 0 ? cyan : gold
                        g.style.opacity = String(0.5 + Math.random() * 0.5)
                    }
                } else break
            }
            if (first >= total) {
                finish()
                return
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settled])

    if (settled) return <span>{text}</span>

    return (
        <span ref={contRef}>
            {palabras.map((p, i) =>
                p.tipo === "s" ? (
                    <span key={i}>{p.txt}</span>
                ) : (
                    <span key={i} className="mx-w">
                        {Array.from(p.txt).map((ch, j) => (
                            <span key={j} data-mx="" className="mx-c">
                                <span style={{ opacity: 0 }}>{ch}</span>
                                <span className="mx-g" />
                            </span>
                        ))}
                    </span>
                )
            )}
        </span>
    )
}

/* El bloque completo: entrega los renglones de uno en uno. Cada renglón
   que se asienta llama al siguiente, así el bloque CRECE y arrastra
   hacia abajo lo que tenga debajo. */
const TextoMaterializado: React.FC<{
    text: string
    activo: boolean
    className?: string
    style?: React.CSSProperties
    cyan?: string
    gold?: string
    /** Escritura a la mitad de velocidad (pantalla grande). */
    lento?: boolean
    onFin?: () => void
}> = ({
    text,
    activo,
    className,
    style,
    cyan = "#00C2FF",
    gold = "#D4A843",
    lento = false,
    onFin,
}) => {
    const renglones = useMemo(() => (text || "").split("\n"), [text])
    const [listos, setListos] = useState(0)
    const finRef = useRef(false)
    const onFinRef = useRef(onFin)
    onFinRef.current = onFin

    /* Sin movimiento pedido → el texto entero, de una. */
    const directo = menosMovimiento()

    useEffect(() => {
        if (!activo) return
        if (directo) {
            setListos(renglones.length)
            return
        }
        setListos((n) => (n === 0 ? 1 : n))
    }, [activo, directo, renglones.length])

    /* 🜂 RED DE SEGURIDAD — EL MANIFIESTO NUNCA QUEDA EN BLANCO.
       La ceremonia depende de una señal (el bloque entrando en cuadro, o
       el viaje de LEER MÁS). Una señal que no llega es un adorno perdido;
       un manifiesto vacío en la portada de la casa es la capa rota. A los
       12 segundos sin haber arrancado, el texto aparece entero y ya. El
       plazo es largo a propósito: quien se desplaza a ritmo normal llega
       mucho antes y sí ve la escritura; a quien nunca bajó hasta aquí, el
       texto ya escrito le da exactamente igual, porque no lo estaba
       mirando. */
    useEffect(() => {
        const id = window.setTimeout(
            () => {
                /* Solo actúa si la cascada NUNCA arrancó: una que ya va a
                   la mitad se deja terminar en paz. */
                setListos((n) => (n === 0 ? renglones.length : n))
            },
            lento ? 22000 : 12000
        )
        return () => window.clearTimeout(id)
    }, [renglones.length, lento])

    useEffect(() => {
        if (listos >= renglones.length && listos > 0 && !finRef.current) {
            finRef.current = true
            onFinRef.current?.()
        }
    }, [listos, renglones.length])

    /* Un renglón EN BLANCO (la separación entre párrafos) no materializa
       nada, así que nadie llamaría al siguiente: la cascada se quedaría
       clavada ahí para siempre. Este reloj lo empuja. */
    useEffect(() => {
        if (directo || !activo) return
        if (listos <= 0 || listos > renglones.length) return
        if (renglones[listos - 1]?.trim()) return
        const id = window.setTimeout(() => setListos((n) => n + 1), 220)
        return () => window.clearTimeout(id)
    }, [listos, renglones, directo, activo])

    const siguiente = useCallback(() => {
        /* Un respiro entre renglones: sin él la cascada se siente
           mecánica, con él el texto respira como quien dicta. En
           pantalla grande el respiro también se dobla, para que el
           ritmo entero sea la mitad de rápido y no solo las letras. */
        window.setTimeout(() => setListos((n) => n + 1), lento ? 150 : 70)
    }, [lento])

    /* Se pinta por lo que HAY PINTADO, no por la señal: así la red de
       seguridad de arriba puede revelar el texto aunque la señal nunca
       haya llegado. */
    if (listos <= 0) return <p className={className} style={style} />

    return (
        <p className={className} style={style}>
            {renglones.slice(0, listos).map((ln, i) => {
                /* Renglón en blanco = separación de párrafo. */
                if (!ln.trim())
                    return (
                        <span
                            key={i}
                            style={{ display: "block", height: "0.8em" }}
                        />
                    )
                const esUltimoPintado = i === listos - 1
                return (
                    <span key={i} style={{ display: "block" }}>
                        {esUltimoPintado && !directo ? (
                            <MxRenglon
                                text={ln}
                                onDone={siguiente}
                                cyan={cyan}
                                gold={gold}
                                lento={lento}
                            />
                        ) : (
                            ln
                        )}
                    </span>
                )
            })}
        </p>
    )
}

/* ═══════════════════════════════════════
   SHARED: ARQUITECTO (ficha de persona)
   🜂 v5.18 — la ficha del guía se vuelve un componente propio para que
   Zak´Haar y Aqua´Riia compartan exactamente la misma forma sin duplicar
   markup. Con una sola persona el bloque se comporta igual que antes.
   ═══════════════════════════════════════ */
const GuiaPersona: React.FC<{
    img?: string
    nombre: string
    descShort: string
    descLong: string
    ctaText: string
    abierto: boolean
    onToggle: (v: boolean) => void
}> = ({ img, nombre, descShort, descLong, ctaText, abierto, onToggle }) => (
    <div className="guia-p">
        {img && (
            <div className="guia-img">
                <img src={img} alt={nombre} />
            </div>
        )}
        <span className="gt" style={{ fontSize: "1.5rem" }}>
            {nombre}
        </span>
        {/* La firma corta no se parte nunca (clase guia-desc-1l). */}
        <p className="guia-desc guia-desc-1l">{descShort}</p>
        <AnimatePresence>
            {abierto && (
                <motion.p
                    className="guia-desc"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                >
                    {nl(descLong)}
                </motion.p>
            )}
        </AnimatePresence>
        {!abierto ? (
            <button className="gold-btn" onClick={() => onToggle(true)}>
                <span className="shim" />
                <span style={{ position: "relative", zIndex: 1 }}>
                    {ctaText}
                </span>
            </button>
        ) : (
            <button className="hide-btn" onClick={() => onToggle(false)}>
                OCULTAR
            </button>
        )}
    </div>
)

/* ═══════════════════════════════════════
   SHARED: EARTH SECTION (responsive)
   ═══════════════════════════════════════ */
const EarthSection: React.FC<{
    webhookUrl?: string
    manifestoShort: string
    manifestoLong: string
    guiaImage?: string
    guiaNombre: string
    guiaDescShort: string
    guiaDescLong: string
    guiaCtaText: string
    aquaImage?: string
    aquaNombre?: string
    aquaDescShort?: string
    aquaDescLong?: string
    aquaCtaText?: string
    afinacionesTitle: string
    afinacionesText: string
    afinacionesWebhookUrl: string
    spotifyUrl?: string
    twitterUrl?: string
    instagramUrl?: string
    nodoTitle?: string
    nodoSubtitle?: string
    organismoText?: string
    ajusteButtonText?: string
}> = ({
    webhookUrl,
    manifestoShort,
    manifestoLong,
    guiaImage,
    guiaNombre,
    guiaDescShort,
    guiaDescLong,
    guiaCtaText,
    aquaImage,
    aquaNombre,
    aquaDescShort,
    aquaDescLong,
    aquaCtaText,
    afinacionesTitle,
    afinacionesText,
    afinacionesWebhookUrl,
    spotifyUrl = "https://open.spotify.com/artist/6BSsXgmAnoie8tUgLtIbqb?si=Yal8ZrynSxeT4lRLJd1mwA",
    twitterUrl = "https://x.com/ZakHaarSol",
    instagramUrl = "https://www.instagram.com/zakhaarsol/#",
    nodoTitle = "ÚNETE AL NODO CENTRAL",
    nodoSubtitle = "Recibe las transmisiones de Red Solar Viva, avisos de nuevos lanzamientos y actualizaciones significativas.",
    organismoText = "Red Solar Viva es un organismo vivo que evoluciona contigo:",
    ajusteButtonText = "Enviar Señal de Ajuste",
}) => {
    const [email, setEmail] = useState("")
    const [es, setEs] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    )
    const [me, setMe] = useState(false)
    const [ge, setGe] = useState(false)
    const [ae, setAe] = useState(false) /* ficha de Aqua´Riia, abre aparte */
    const [sa, setSa] = useState(false)
    /* 🜂 v5.20 — MANIFIESTO QUE SE ESCRIBE SOLO.
       `manEnCuadro`: el primer párrafo arranca cuando el bloque entra en
       pantalla, no antes (si arrancara al montar, para cuando alguien
       llegue ahí ya se habría escrito solo, sin nadie mirando).
       `largoActivo`: el segundo párrafo NO arranca al pedir LEER MÁS —
       arranca cuando la pantalla ya BAJÓ. Primero el viaje, después la
       escritura. */
    const [manEnCuadro, setManEnCuadro] = useState(false)
    const [largoActivo, setLargoActivo] = useState(false)
    /* 🜂 v5.21 — En el [CENTRO DE MANDO] la escritura va a la MITAD de
       velocidad (Zak: "para que sea más ritualístico aún"). Se pregunta
       aquí adentro y no se hereda por prop porque a EarthSection lo montan
       las dos vistas, la del Lente y la del Centro de Mando. */
    const vpManifiesto = useViewportLocal()
    const escrituraLenta = !vpManifiesto.isMobile && vpManifiesto.width >= 900
    const manSentinelRef = useRef<HTMLDivElement | null>(null)
    const abrirManifiestoLargo = useCallback(() => {
        setMe(true)
        /* EL VIAJE. Primero se intenta el desplazamiento suave; si a los
           600ms el contenedor no se movió (hay navegadores y entornos que
           congelan el desplazamiento animado), se salta al destino de una
           vez. Un viaje que no ocurre dejaría el párrafo nuevo naciendo
           fuera de la pantalla — el gesto se sentiría muerto. */
        try {
            const nodo = manSentinelRef.current
            if (nodo) {
                /* El contenedor que REALMENTE se desplaza puede ser el
                   documento o un panel interno de la ruta: se busca hacia
                   arriba en vez de suponerlo. */
                let sc: HTMLElement | null = nodo.parentElement
                while (sc) {
                    const ov = getComputedStyle(sc).overflowY
                    if (
                        (ov === "auto" || ov === "scroll") &&
                        sc.scrollHeight > sc.clientHeight + 20
                    )
                        break
                    sc = sc.parentElement
                }
                const suave = !menosMovimiento()
                if (sc) {
                    const antes = sc.scrollTop
                    const destino =
                        antes +
                        (nodo.getBoundingClientRect().top -
                            sc.getBoundingClientRect().top) -
                        sc.clientHeight / 2
                    sc.scrollTo({
                        top: destino,
                        behavior: suave ? "smooth" : "auto",
                    })
                    if (suave)
                        window.setTimeout(() => {
                            if (Math.abs(sc!.scrollTop - antes) < 8)
                                sc!.scrollTop = destino
                        }, 600)
                } else {
                    const antes = window.scrollY
                    const destino =
                        antes +
                        nodo.getBoundingClientRect().top -
                        window.innerHeight / 2
                    window.scrollTo({
                        top: destino,
                        behavior: suave ? "smooth" : "auto",
                    })
                    if (suave)
                        window.setTimeout(() => {
                            if (Math.abs(window.scrollY - antes) < 8)
                                window.scrollTo(0, destino)
                        }, 600)
                }
            }
        } catch {}
        /* Reloj PROPIO: la escritura arranca a los 520ms pase lo que pase
           con el viaje. Un desplazamiento que se congele no puede dejar el
           párrafo en blanco para siempre. */
        window.setTimeout(() => setLargoActivo(true), 520)
    }, [])
    const subEmail = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!email.trim() || !email.includes("@")) return
        if (!webhookUrl) {
            setEs("error")
            return
        }
        setEs("loading")
        try {
            const r = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "redsolarviva_landing" }),
            })
            if (r.ok) {
                setEs("success")
                setEmail("")
            } else setEs("error")
        } catch {
            setEs("error")
        }
    }
    return (
        <div className="qr-earth">
            <AnimatePresence>
                {sa && (
                    <AfinacionesModal
                        title={afinacionesTitle}
                        text={afinacionesText}
                        webhookUrl={afinacionesWebhookUrl}
                        onClose={() => setSa(false)}
                    />
                )}
            </AnimatePresence>
            {/* MANIFESTO — se materializa renglón a renglón, con la técnica
                del Modo Presencia del Espejo Vibracional. El bloque CRECE
                mientras se escribe, así el botón de abajo se desliza con
                él; al pedir LEER MÁS la pantalla baja primero y solo
                entonces arranca el párrafo siguiente. */}
            <motion.div
                className="man-block"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                onViewportEnter={() => setManEnCuadro(true)}
            >
                <motion.div
                    variants={epicR}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div className="sep-sm" style={{ marginBottom: 30 }} />
                    <TextoMaterializado
                        text={nl(manifestoShort)}
                        activo={manEnCuadro}
                        className="man-text"
                        lento={escrituraLenta}
                    />
                    {me && (
                        <TextoMaterializado
                            text={nl(manifestoLong)}
                            activo={largoActivo}
                            className="man-text"
                            style={{ marginTop: 16 }}
                            lento={escrituraLenta}
                        />
                    )}
                    {!me ? (
                        <button
                            className="rm-btn"
                            onClick={abrirManifiestoLargo}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            LEER MÁS
                        </button>
                    ) : (
                        <button
                            className="hide-btn"
                            style={{ marginTop: 20 }}
                            onClick={() => {
                                setMe(false)
                                setLargoActivo(false)
                            }}
                        >
                            OCULTAR
                        </button>
                    )}
                    {/* Punto de aterrizaje del viaje al pedir LEER MÁS: al
                        centrarlo, el botón queda a media pantalla y la
                        mitad de abajo espera al párrafo que viene. */}
                    <div
                        ref={manSentinelRef}
                        aria-hidden="true"
                        style={{ width: 1, height: 1 }}
                    />
                </motion.div>
            </motion.div>
            <div className="sep" />
            {/* GUÍA */}
            <motion.div
                className="guia-sec"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="sep-sm" style={{ marginBottom: 10 }} />
                <div className="guia-duo">
                    <GuiaPersona
                        img={guiaImage}
                        nombre={guiaNombre}
                        descShort={guiaDescShort}
                        descLong={guiaDescLong}
                        ctaText={guiaCtaText}
                        abierto={ge}
                        onToggle={setGe}
                    />
                    {/* La segunda ficha solo existe si hay alguien que
                        mostrar: sin nombre ni foto, el bloque queda igual
                        que cuando había una sola persona. */}
                    {(aquaNombre || aquaImage) && (
                        <GuiaPersona
                            img={aquaImage}
                            nombre={aquaNombre || ""}
                            descShort={aquaDescShort || ""}
                            descLong={aquaDescLong || ""}
                            ctaText={aquaCtaText || "Pulso de Aqua"}
                            abierto={ae}
                            onToggle={setAe}
                        />
                    )}
                </div>
            </motion.div>
            <div className="sep" />
            {/* NEWSLETTER */}
            <motion.div
                className="sig-block"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={epicR}
            >
                <div className="sig-content">
                    <h4 className="sig-title">{nodoTitle}</h4>
                    <p className="sig-desc">{nodoSubtitle}</p>
                    <form className="sig-form" onSubmit={subEmail}>
                        <input
                            type="email"
                            placeholder="Tu frecuencia (email)..."
                            className="sig-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                /* CMD+Enter (mac) o Ctrl+Enter (otro)
                                   dispara el submit aunque el cursor
                                   esté en el input. Enter solo ya lo
                                   maneja el form nativo. */
                                if (
                                    e.key === "Enter" &&
                                    (e.metaKey || e.ctrlKey)
                                ) {
                                    e.preventDefault()
                                    subEmail()
                                }
                            }}
                            disabled={es === "loading" || es === "success"}
                        />
                        <button
                            type="submit"
                            className="sig-sub"
                            disabled={es === "loading" || es === "success"}
                        >
                            {es === "loading"
                                ? "..."
                                : es === "success"
                                  ? "✓"
                                  : "CONECTAR"}
                        </button>
                    </form>
                    {es === "success" && (
                        <div className="ff">
                            Enlace establecido. Bienvenido al nodo.
                        </div>
                    )}
                    {es === "error" && (
                        <div className="ff" style={{ color: "#ff4d4d" }}>
                            Error en la señal. Intenta de nuevo.
                        </div>
                    )}
                </div>
            </motion.div>
            <div className="sep" />
            {/* SOCIAL */}
            <motion.div
                className="sat-block"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                {spotifyUrl && (
                    <a
                        href={spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sat-link"
                    >
                        <IconSpotify />
                    </a>
                )}
                {twitterUrl && (
                    <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sat-link"
                    >
                        <IconXTwitter />
                    </a>
                )}
                {instagramUrl && (
                    <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sat-link"
                    >
                        <IconInstagram />
                    </a>
                )}
            </motion.div>
            <div className="sep" />
            {/* FOOTER */}
            <motion.div
                className="foot-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <p className="foot-text">{organismoText}</p>
                <button className="foot-btn" onClick={() => setSa(true)}>
                    <IconAntenna />
                    {ajusteButtonText}
                </button>
            </motion.div>
        </div>
    )
}

/* ═══════════════════════════════════════
   MOBILE: NAV CARD
   ═══════════════════════════════════════ */
const MobileNavCard = ({
    label,
    icon,
    href,
    accentColor,
    delay = 0,
    wide = false,
}: {
    label: string
    icon: React.ReactNode
    href?: string
    accentColor: string
    delay?: number
    /* v5.X — `wide=true` hace que la card ocupe el 100% de su fila
       (en lugar de 50% por defecto). Útil para resaltar entradas
       que viven solas en su propia barra (ej. Simuladores). */
    wide?: boolean
}) => {
    const ac = accentColor
    const inner = (
        <motion.div
            className="or-nav-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: "120px",
                borderRadius: "18px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${hexToRgba(ac, 0.4)}`,
                background: `linear-gradient(135deg,${hexToRgba(ac, 0.1)},${hexToRgba(ac, 0.04)},${hexToRgba(ac, 0.08)})`,
                boxShadow: `0 12px 30px ${hexToRgba(ac, 0.15)}, inset 0 0 30px ${hexToRgba(ac, 0.08)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                transform: "scale(1)",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: "-20%",
                    height: "40%",
                    left: "-50%",
                    width: "60%",
                    background: `linear-gradient(115deg,transparent,${hexToRgba(ac, 0.4)},transparent)`,
                    filter: "blur(6px)",
                    transform: "rotate(8deg)",
                }}
                animate={{ left: ["-50%", "130%"] }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: 14,
                    border: `1px solid ${hexToRgba(ac, 0.3)}`,
                    pointerEvents: "none",
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                {icon}
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: ac,
                        textShadow: `0 0 10px ${hexToRgba(ac, 0.6)}, 0 0 20px ${hexToRgba(ac, 0.3)}`,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        textAlign: "center",
                        lineHeight: 1.3,
                        whiteSpace: "pre-line",
                    }}
                >
                    {label}
                </span>
            </div>
        </motion.div>
    )
    /* v5.X — wide=true → flex-basis 100% para ocupar la fila entera
       (doble barra). default → 50% del ancho disponible. */
    const flexBasis = wide ? "1 1 100%" : "1 1 calc(50% - 8px)"
    if (href)
        return (
            <a
                href={href}
                target="_self"
                style={{
                    textDecoration: "none",
                    flex: flexBasis,
                    minWidth: 0,
                }}
            >
                {inner}
            </a>
        )
    return (
        <div style={{ flex: flexBasis, minWidth: 0 }}>{inner}</div>
    )
}

/* ═══════════════════════════════════════
   MOBILE: GOLDEN CTA BUTTON
   ═══════════════════════════════════════ */
const MobileGoldenButton = ({
    text,
    href,
    onClick,
    delay = 0,
}: {
    text: string
    href?: string
    onClick?: () => void
    delay?: number
}) => {
    const g = "#D4A843",
        ga = (x: number) => hexToRgba(g, x)
    const Tag: any = href ? "a" : "button"
    const lp: any = href ? { href, target: "_self" } : { onClick }
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
        >
            <Tag
                {...lp}
                className="or-cta-btn"
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "16px 36px",
                    borderRadius: "16px",
                    border: `1px solid ${ga(0.6)}`,
                    background: `linear-gradient(135deg,${ga(0.15)},transparent,${ga(0.1)})`,
                    color: g,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: ".8rem",
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    outline: "none",
                    textDecoration: "none",
                    boxShadow: `0 0 20px ${ga(0.2)}, 0 0 40px ${ga(0.08)}, inset 0 1px 0 ${ga(0.25)}`,
                    overflow: "hidden",
                    backdropFilter: "blur(4px)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "16px",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "60%",
                            height: "100%",
                            background: `linear-gradient(90deg,transparent,${ga(0.25)},transparent)`,
                            animation:
                                "exploreShimmer 3.5s ease-in-out infinite",
                        }}
                    />
                </div>
                <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
            </Tag>
        </motion.div>
    )
}

/* ═══════════════════════════════════════
   TYPES
   ═══════════════════════════════════════ */
type PlanetConfig = {
    id: string
    size: number
    title: string
    panelTitle: string
    desc: string
    link: string
    targetBlank: boolean
    orbitDuration: number
    labelOffset: number
}

type Props = {
    /** ── FIX: Domo passes this to override local viewport detection ── */
    forceIsMobile?: boolean
    webhookUrl?: string
    navbarOffset?: number
    planetGlow?: number
    orbitSpeed?: number
    orbitPulseSpeed?: number
    orbitTilt?: number
    reticleSize?: number
    reticleGlow?: number
    warpSpeed?: number
    heroTitleText?: string
    heroSubtitleText?: string
    heroTagline?: string
    subtitleOffsetY?: number
    consoleWidth?: number
    titleSize?: number
    accentColor?: string
    bgColor?: string
    textColor?: string
    numStars?: number
    numComets?: number
    titleOffsetY?: number
    systemOffsetY?: number
    systemOffsetX?: number
    toroideImage?: string
    toroideSize?: number
    manifestoShort?: string
    manifestoLong?: string
    guiaImage?: string
    guiaNombre?: string
    guiaDescShort?: string
    guiaDescLong?: string
    guiaCtaText?: string
    aquaImage?: string
    aquaNombre?: string
    aquaDescShort?: string
    aquaDescLong?: string
    aquaCtaText?: string
    afinacionesTitle?: string
    afinacionesText?: string
    afinacionesWebhookUrl?: string
    /* Shared earth props */
    spotifyUrl?: string
    twitterUrl?: string
    instagramUrl?: string
    nodoTitle?: string
    nodoSubtitle?: string
    organismoText?: string
    ajusteButtonText?: string
    /* Mobile-specific */
    mobileCtaText?: string
    mobileCtaUrl?: string
    mobileGuiaCtaText?: string
    mobileShowCodex?: boolean
    mobileShowSesiones?: boolean
    /* v5.13 — llaves públicas para leer el interruptor global de Sesiones
       (get_app_flag). Vienen del Domo, que es el hub de configuración. */
    supabaseUrl?: string
    supabaseAnonKey?: string
    /* Derivada internamente del interruptor: retira el planeta "Sesiones"
       del sistema solar de escritorio. */
    hideSesiones?: boolean
    mobileShowFragmentos?: boolean
    mobileShowMeditaciones?: boolean
    /* v5.X — Sexta tarjeta del Lente: Simuladores. Va al final del
       grid en su propia fila a ancho completo (doble barra) para
       resaltar la entrada al campo de prácticas inmersivas. */
    mobileShowSimuladores?: boolean
    /* Planet configs */
    p1_Size: number
    p1_Title: string
    p1_PanelTitle: string
    p1_Desc: string
    p1_Link: string
    p1_TargetBlank: boolean
    p1_OrbitDuration: number
    p1_LabelOffset: number
    p2_Size: number
    p2_Title: string
    p2_PanelTitle: string
    p2_Desc: string
    p2_Link: string
    p2_TargetBlank: boolean
    p2_OrbitDuration: number
    p2_LabelOffset: number
    p3_Size: number
    p3_Title: string
    p3_PanelTitle: string
    p3_Desc: string
    p3_Link: string
    p3_TargetBlank: boolean
    p3_OrbitDuration: number
    p3_LabelOffset: number
    p4_Size: number
    p4_Title: string
    p4_PanelTitle: string
    p4_Desc: string
    p4_Link: string
    p4_TargetBlank: boolean
    p4_OrbitDuration: number
    p4_LabelOffset: number
    p5_Size: number
    p5_Title: string
    p5_PanelTitle: string
    p5_Desc: string
    p5_Link: string
    p5_TargetBlank: boolean
    p5_OrbitDuration: number
    p5_LabelOffset: number
    p6_Size: number
    p6_Title: string
    p6_PanelTitle: string
    p6_Desc: string
    p6_Link: string
    p6_TargetBlank: boolean
    p6_OrbitDuration: number
    p6_LabelOffset: number
}

/* ═══════════════════════════════════════════════════
   MOBILE RENDER PATH
   ═══════════════════════════════════════════════════ */
function SolarSystemMobile(props: Props) {
    const {
        accentColor = "00C2FF",
        bgColor = "#000000",
        numStars = 70,
        warpSpeed = 1,
        toroideImage,
        heroSubtitleText = "TEMPLO SOLAR 5D",
        heroTagline = "DE LA ENTROPÍA\nA LA LUZ.",
        /* v5.2 — botón dorado del Portal de Inducción apunta al futuro
           Portal de Inducción en /radar (ya no al catálogo de Códices).
           El Escáner Vibracional ya no vive en /radar; se mudó a /escaner. */
        mobileCtaText = "ESCÁNER VIBRACIONAL",
        mobileCtaUrl = "/radar",
        mobileShowCodex = true,
        mobileShowSesiones = true,
        mobileShowFragmentos = true,
        mobileShowMeditaciones = false,
        mobileShowSimuladores = true,
        manifestoShort = "",
        manifestoLong = "",
        guiaImage,
        guiaNombre = "Zak'Haar Solar",
        guiaDescShort = "",
        guiaDescLong = "",
        guiaCtaText = "Conocer al Guía",
        aquaImage,
        aquaNombre,
        aquaDescShort,
        aquaDescLong,
        aquaCtaText,
        mobileGuiaCtaText,
        webhookUrl,
        afinacionesTitle = "AFINACIONES",
        afinacionesText = "",
        afinacionesWebhookUrl = "",
        spotifyUrl,
        twitterUrl,
        instagramUrl,
        nodoTitle,
        nodoSubtitle,
        organismoText,
        ajusteButtonText,
        p1_Link = "codices",
        p2_Link = "sesiones",
        p3_Link = "fragmentosdelsol",
        p4_Link = "meditaciones",
    } = props
    const ac = accentColor.startsWith("#") ? accentColor : `#${accentColor}`
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showFab, setShowFab] = useState(false)
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const fn = () => setShowFab(el.scrollTop > window.innerHeight * 0.5)
        el.addEventListener("scroll", fn, { passive: true })
        return () => el.removeEventListener("scroll", fn)
    }, [])

    /* Orden en el Lente: Códices · Meditaciones · Sesiones · Fragmentos
       en grilla 2x2, y Simuladores como sexta entrada en doble barra
       abajo (fila completa). v5.X — Simuladores y Fragmentos sumados
       al lineup público del Lente. Simuladores apunta a /simuladores
       (que en mobile el shell de AppNavegacionMobile redirige al
       SelectorSimuladores AAA con cards Navegante + Domo Cero
       admin-only). */
    const navCards = useMemo(
        () =>
            [
                {
                    label: "Códices",
                    icon: <IconBook color={ac} />,
                    href: p1_Link,
                    show: mobileShowCodex,
                    wide: false,
                },
                /* 🜂 v5.16 — "Meditaciones" sale del Lente: la capa
                   pública se retiró (viven en la Holoteca del
                   Escáner). Se quita la tarjeta en código y no por
                   el interruptor, porque Framer conserva el valor
                   guardado del canvas — regla
                   hardcode-over-Framer-saved. */
                {
                    label: "Sesiones",
                    icon: <IconSunRays color={ac} />,
                    href: p2_Link,
                    show: mobileShowSesiones,
                    wide: false,
                },
                {
                    label: "Fragmentos\ndel Sol",
                    icon: <IconClapper color={ac} />,
                    /* v5.X — `/fragmentos` raíz pública (no
                       `/holoteca/fragmentos`). Cae al case del switch
                       de Domo que monta FragmentosDelSol standalone
                       con título grande "FRAGMENTOS DEL SOL" — no
                       hereda el chrome del Escáner ni el prefijo
                       "HOLOTECA · ...". El Tripulante mobile entra
                       desde Origen y aterriza en la pieza pública,
                       no en la sub-pantalla del Escáner. */
                    href: "/fragmentos",
                    show: mobileShowFragmentos,
                    wide: false,
                },
                {
                    label: "Simuladores",
                    icon: <IconSimuladoresOrigen color={ac} />,
                    /* v5.X — `/simuladores` raíz pública. Cae al case
                       mobile específico de Domo (SimuladoresPublicMobile)
                       que monta el SelectorSimuladores standalone sin
                       BottomNav del Escáner ni prefijo "HOLOTECA · ...".
                       El Tripulante ve un título grande "SIMULADORES"
                       arriba y abajo el selector limpio. */
                    href: "/simuladores",
                    show: mobileShowSimuladores,
                    wide: true,
                },
            ].filter((c) => c.show),
        [
            ac,
            mobileShowCodex,
            mobileShowSesiones,
            mobileShowFragmentos,
            mobileShowMeditaciones,
            mobileShowSimuladores,
            p1_Link,
            p2_Link,
            p3_Link,
            p4_Link,
        ]
    )
    const fewCards = navCards.length <= 2
    const effectiveGuiaCtaText = mobileGuiaCtaText || guiaCtaText

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                background: "transparent",
                fontFamily: "'Inter',sans-serif",
                color: "#FFFFFF",
            }}
        >
            {/* Scroll-to-top FAB */}
            <AnimatePresence>
                {showFab && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="or-fab"
                        onClick={() =>
                            scrollRef.current?.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        style={{
                            position: "fixed",
                            bottom: 40,
                            right: 0,
                            zIndex: 99997,
                            width: 44,
                            height: 44,
                            borderRadius: "14px 0 0 14px",
                            borderTop: `1px solid ${hexToRgba(ac, 0.1)}`,
                            borderBottom: `1px solid ${hexToRgba(ac, 0.1)}`,
                            borderLeft: `1px solid ${hexToRgba(ac, 0.1)}`,
                            borderRight: `2px solid ${hexToRgba(ac, 0.5)}`,
                            background: "rgba(8,12,20,0.95)",
                            backdropFilter: "blur(12px)",
                            color: hexToRgba(ac, 0.65),
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            boxShadow: `-4px 0 15px ${hexToRgba(ac, 0.05)}`,
                            paddingRight: 4,
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <div
                ref={scrollRef}
                className="or-scroll"
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    height: "100vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {/* HERO */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    style={{
                        textAlign: "center",
                        /* env(safe-area-inset-top) suma el notch SOLO en
                           PWA standalone iOS. Web normal queda igual. */
                        paddingTop: `calc(${fewCards ? "70px" : "40px"} + env(safe-area-inset-top, 0px))`,
                        paddingBottom: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    {toroideImage && (
                        <motion.img
                            src={toroideImage}
                            alt="RSV"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            style={{
                                height: "70px",
                                objectFit: "contain",
                                maxWidth: "80vw",
                                filter: `drop-shadow(0 0 20px ${hexToRgba(ac, 0.3)})`,
                            }}
                        />
                    )}
                    <h1
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.6rem",
                            fontWeight: 100,
                            margin: 0,
                            background: `linear-gradient(180deg,${ac},#fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: ".22em",
                            filter: `drop-shadow(0 0 12px ${hexToRgba(ac, 0.4)})`,
                        }}
                    >
                        RED SOLAR VIVA
                    </h1>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 300,
                            margin: 0,
                            background: `linear-gradient(180deg,${ac},#fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: ".28em",
                            filter: `drop-shadow(0 0 8px ${hexToRgba(ac, 0.3)})`,
                        }}
                    >
                        {heroSubtitleText}
                    </p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 300,
                            color: "#FFFFFF",
                            margin: "6px 0 0",
                            letterSpacing: ".12em",
                            padding: "0 30px",
                            lineHeight: 1.6,
                            whiteSpace: "pre-line",
                        }}
                    >
                        {/* v5.3 — Lente: forzar 2 filas partiendo por
                           coma O newline. Antes el tagline "DEL
                           CARBONO AL SILICIO, DEL SILICIO A LA LUZ"
                           se renderizaba en una sola línea cuando
                           Framer reemplazaba el \n por un espacio.
                           Ahora dividimos por [,\n] y cada parte va
                           en su propio fragment con <br/> entre
                           medias — siempre visible en 2 filas. */}
                        {nl(heroTagline!)
                            .split(/[,\n]/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((line, i, arr) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i < arr.length - 1 && <br />}
                                </React.Fragment>
                            ))}
                    </motion.p>
                    {mobileCtaText && (
                        <div style={{ marginTop: "6px" }}>
                            {/* 🜂 v5.13 — EN EL CELULAR EL ESCÁNER ES UNA APP
                                (Zak): el botón ya no abre la versión web
                                dentro del navegador, lleva a la página de
                                descarga (escanervibracional.com) para que se
                                instale de verdad. En la computadora, donde no
                                hay app que instalar, el planeta del sistema
                                solar entra directo a la versión de escritorio.
                                Destino forzado al render (hardcode-over-
                                Framer-saved): mobileCtaUrl tenía "/radar"
                                guardado en el canvas. */}
                            <MobileGoldenButton
                                text={mobileCtaText}
                                href={
                                    mobileCtaUrl && mobileCtaUrl !== "/radar"
                                        ? mobileCtaUrl
                                        : ESCANER_LANDING_URL
                                }
                                delay={0.8}
                            />
                        </div>
                    )}
                </motion.div>

                {/* NAV CARDS */}
                {navCards.length > 0 && (
                    <div
                        style={{
                            padding: `30px 20px ${fewCards ? "80px" : "16px"} 20px`,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "14px",
                            justifyContent: "center",
                            maxWidth: "440px",
                            margin: "0 auto",
                        }}
                    >
                        {navCards.map((c, i) => (
                            <MobileNavCard
                                key={c.label}
                                label={c.label}
                                icon={c.icon}
                                href={c.href || undefined}
                                accentColor={ac}
                                delay={0.3 + i * 0.15}
                                wide={!!c.wide}
                            />
                        ))}
                    </div>
                )}

                {/* EARTH SECTION (shared, responsive via CSS) */}
                <EarthSection
                    webhookUrl={webhookUrl}
                    manifestoShort={manifestoShort!}
                    manifestoLong={manifestoLong!}
                    guiaImage={guiaImage}
                    guiaNombre={guiaNombre!}
                    guiaDescShort={guiaDescShort!}
                    guiaDescLong={guiaDescLong!}
                    guiaCtaText={effectiveGuiaCtaText!}
                    aquaImage={aquaImage}
                    aquaNombre={aquaNombre}
                    aquaDescShort={aquaDescShort}
                    aquaDescLong={aquaDescLong}
                    aquaCtaText={aquaCtaText}
                    afinacionesTitle={afinacionesTitle!}
                    afinacionesText={afinacionesText!}
                    afinacionesWebhookUrl={afinacionesWebhookUrl!}
                    spotifyUrl={spotifyUrl}
                    twitterUrl={twitterUrl}
                    instagramUrl={instagramUrl}
                    nodoTitle={nodoTitle}
                    nodoSubtitle={nodoSubtitle}
                    organismoText={organismoText}
                    ajusteButtonText={ajusteButtonText}
                />
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   DESKTOP RENDER PATH
   ═══════════════════════════════════════════════════ */
function SolarSystemDesktop(props: Props) {
    const {
        /* v5.13 — interruptor global de Sesiones (lo resuelve Origen). */
        hideSesiones = false,
        webhookUrl,
        navbarOffset = 72,
        planetGlow = 0.8,
        orbitSpeed = 12,
        orbitPulseSpeed = 1.0,
        orbitTilt = 0.35,
        reticleSize = 64,
        reticleGlow = 0.6,
        warpSpeed = 1.0,
        heroTitleText = "RED SOLAR VIVA",
        heroSubtitleText = "TEMPLO SOLAR 5D",
        heroTagline = "Biblioteca de la Nueva Tierra",
        subtitleOffsetY = 12,
        titleSize = 72,
        accentColor = "00C2FF",
        bgColor = "#000000",
        textColor = "#E6F7EF",
        numStars = 150,
        numComets = 2,
        titleOffsetY = 48,
        systemOffsetY = 48,
        systemOffsetX = 0,
        toroideImage,
        toroideSize = 280,
        manifestoShort = "",
        manifestoLong = "",
        guiaImage,
        guiaNombre = "Zak'Haar Solar",
        guiaDescShort = "",
        guiaDescLong = "",
        guiaCtaText = "Conocer al Guía",
        aquaImage,
        aquaNombre,
        aquaDescShort,
        aquaDescLong,
        aquaCtaText,
        afinacionesTitle = "AFINACIONES",
        afinacionesText = "",
        afinacionesWebhookUrl = "",
        webhookUrl: wh,
        spotifyUrl,
        twitterUrl,
        instagramUrl,
        nodoTitle,
        nodoSubtitle,
        organismoText,
        ajusteButtonText,
        p1_Size,
        p1_Title,
        p1_PanelTitle,
        p1_Desc,
        p1_Link,
        p1_TargetBlank,
        p1_OrbitDuration,
        p1_LabelOffset,
        p2_Size,
        p2_Title,
        p2_PanelTitle,
        p2_Desc,
        p2_Link,
        p2_TargetBlank,
        p2_OrbitDuration,
        p2_LabelOffset,
        p3_Size,
        p3_Title,
        p3_PanelTitle,
        p3_Desc,
        p3_Link,
        p3_TargetBlank,
        p3_OrbitDuration,
        p3_LabelOffset,
        p4_Size,
        p4_Title,
        p4_PanelTitle,
        p4_Desc,
        p4_Link,
        p4_TargetBlank,
        p4_OrbitDuration,
        p4_LabelOffset,
        p5_Size,
        p5_Title,
        p5_PanelTitle,
        p5_Desc,
        p5_Link,
        p5_TargetBlank,
        p5_OrbitDuration,
        p5_LabelOffset,
        p6_Size,
        p6_Title,
        p6_PanelTitle,
        p6_Desc,
        p6_Link,
        p6_TargetBlank,
        p6_OrbitDuration,
        p6_LabelOffset,
    } = props

    const ac = accentColor.startsWith("#") ? accentColor : `#${accentColor}`
    const cssReady = useRef(false)
    useInjectSolarCss(() => {
        cssReady.current = true
    })
    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        let c = false
        const chk = () => {
            if (c) return
            if (cssReady.current)
                requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                        requestAnimationFrame(() => {
                            if (!c) setIsReady(true)
                        })
                    )
                )
            else requestAnimationFrame(chk)
        }
        requestAnimationFrame(chk)
        return () => {
            c = true
        }
    }, [])

    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [activePlanet, setActivePlanet] = useState<PlanetConfig | null>(null)
    const [cardPos, setCardPos] = useState({ x: 0, y: 0 })
    const cooldown = useRef(0)
    const rootRef = useRef<HTMLDivElement>(null)
    const [section, setSection] = useState<"space" | "earth">("space")
    const scrolling = useRef(false)
    const scrollT = useRef<any>(null)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        scrolling.current = true
        if (scrollT.current) clearTimeout(scrollT.current)
        scrollT.current = setTimeout(() => {
            scrolling.current = false
        }, 150)
        const st = e.currentTarget.scrollTop
        if (activePlanet) closeCard()
        if (st > 400 && section !== "earth") {
            setSection("earth")
            setActivePlanet(null)
        } else if (st <= 400 && section !== "space") setSection("space")
    }
    function closeCard() {
        setHoveredId(null)
        setActivePlanet(null)
        cooldown.current = Date.now() + 400
    }

    const planetsAll: PlanetConfig[] = useMemo(
        () => [
            {
                id: "sesiones",
                size: p2_Size,
                title: p2_Title,
                panelTitle: p2_PanelTitle || p2_Title,
                desc: p2_Desc,
                link: p2_Link,
                targetBlank: p2_TargetBlank,
                orbitDuration: p2_OrbitDuration,
                labelOffset: p2_LabelOffset,
            },
            {
                id: "simuladores",
                size: p5_Size,
                title: p5_Title,
                panelTitle: p5_PanelTitle || p5_Title,
                desc: p5_Desc,
                link: p5_Link,
                targetBlank: p5_TargetBlank,
                orbitDuration: p5_OrbitDuration,
                labelOffset: p5_LabelOffset,
            },
            {
                id: "escaner",
                size: p6_Size,
                title: p6_Title,
                panelTitle: p6_PanelTitle || p6_Title,
                desc: p6_Desc,
                link: p6_Link,
                targetBlank: p6_TargetBlank,
                orbitDuration: p6_OrbitDuration,
                labelOffset: p6_LabelOffset,
            },
            {
                id: "codices",
                size: p1_Size,
                title: p1_Title,
                panelTitle: p1_PanelTitle || p1_Title,
                desc: p1_Desc,
                link: p1_Link,
                targetBlank: p1_TargetBlank,
                orbitDuration: p1_OrbitDuration,
                labelOffset: p1_LabelOffset,
            },
            {
                id: "fragmentos",
                size: p3_Size,
                title: p3_Title,
                panelTitle: p3_PanelTitle || p3_Title,
                desc: p3_Desc,
                link: p3_Link,
                targetBlank: p3_TargetBlank,
                orbitDuration: p3_OrbitDuration,
                labelOffset: p3_LabelOffset,
            },
            {
                id: "meditaciones",
                size: p4_Size,
                title: p4_Title,
                panelTitle: p4_PanelTitle || p4_Title,
                desc: p4_Desc,
                link: p4_Link,
                targetBlank: p4_TargetBlank,
                orbitDuration: p4_OrbitDuration,
                labelOffset: p4_LabelOffset,
            },
        ],
        [
            p1_Size,
            p1_Title,
            p1_PanelTitle,
            p1_Desc,
            p1_Link,
            p1_TargetBlank,
            p1_OrbitDuration,
            p1_LabelOffset,
            p2_Size,
            p2_Title,
            p2_PanelTitle,
            p2_Desc,
            p2_Link,
            p2_TargetBlank,
            p2_OrbitDuration,
            p2_LabelOffset,
            p3_Size,
            p3_Title,
            p3_PanelTitle,
            p3_Desc,
            p3_Link,
            p3_TargetBlank,
            p3_OrbitDuration,
            p3_LabelOffset,
            p4_Size,
            p4_Title,
            p4_PanelTitle,
            p4_Desc,
            p4_Link,
            p4_TargetBlank,
            p4_OrbitDuration,
            p4_LabelOffset,
            p5_Size,
            p5_Title,
            p5_PanelTitle,
            p5_Desc,
            p5_Link,
            p5_TargetBlank,
            p5_OrbitDuration,
            p5_LabelOffset,
            p6_Size,
            p6_Title,
            p6_PanelTitle,
            p6_Desc,
            p6_Link,
            p6_TargetBlank,
            p6_OrbitDuration,
            p6_LabelOffset,
        ]
    )

    /* 🜂 v5.13 — el planeta "Sesiones" se retira cuando el interruptor
       del Motor apaga la oferta (hide_sesiones). Lo demás intacto: el
       resto de los planetas siguen editables desde Framer.
       🜂 v5.16 — "Meditaciones" se retira SIEMPRE: la capa pública se
       fue (viven en la Holoteca del Escáner, Zak 2026-08-03). El
       filtro va acá en código y no por property control porque Framer
       conserva el valor guardado del canvas aunque se quite el control
       — regla hardcode-over-Framer-saved. */
    const planets: PlanetConfig[] = useMemo(() => {
        let out = planetsAll.filter((p) => p.id !== "meditaciones")
        if (hideSesiones) out = out.filter((p) => p.id !== "sesiones")
        return out
    }, [planetsAll, hideSesiones])

    const areaRef = useRef<HTMLDivElement>(null)
    const [vb, setVb] = useState({ w: 1400, h: 800 })
    useEffect(() => {
        const el = areaRef.current
        if (!el) return
        const u = () => setVb({ w: el.clientWidth, h: el.clientHeight })
        u()
        const ro = new ResizeObserver(u)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const svgW = vb.w,
        svgH = vb.h,
        cx = svgW / 2,
        cy = svgH / 2
    const ry = (r: number) => r * orbitTilt
    const TOR_R = toroideSize! / 2
    const innerR = TOR_R + 200
    const maxR = Math.min(svgW, svgH / orbitTilt) / 2 - 40
    const effectiveMax = Math.max(maxR, innerR + 400)
    const allSpacing = (effectiveMax - innerR) / Math.max(1, 4)
    const allRingR = Array.from(
        { length: 5 },
        (_, i) => innerR + i * allSpacing
    )
    const ringR = allRingR.slice(1)
    const ringCount = ringR.length
    const ringMap: Record<string, number> = {
        sesiones: 0,
        simuladores: 1,
        escaner: 1,
        codices: 2,
        fragmentos: 2,
        meditaciones: 3,
    }
    const phaseMap: Record<string, number> = {
        sesiones: 0.12,
        simuladores: 0.35,
        escaner: 0.85,
        codices: 0.08,
        fragmentos: 0.58,
        meditaciones: 0.75,
    }
    const ePath = (rx: number, ryv: number) =>
        `M ${cx - rx},${cy} a ${rx},${ryv} 0 1,0 ${rx * 2},0 a ${rx},${ryv} 0 1,0 ${-rx * 2},0`
    const colorVars = useMemo(() => computeColorVars(ac), [ac])

    const rootStyle: React.CSSProperties = {
        "--holo-primary": ac,
        "--holo-secondary": colorVars.secondary,
        "--holo-glow": colorVars.glow,
        "--orbit-stroke": colorVars.orbitStroke,
        "--planet-glow": String(planetGlow),
        "--ret-sz": `${reticleSize}px`,
        "--ret-glow": String(reticleGlow),
        "--navbar-offset": `${navbarOffset}px`,
        "--title-offset": `${titleOffsetY}px`,
        "--title-size-px": `${titleSize}px`,
        "--tor-size": `${toroideSize}px`,
        color: textColor,
    } as any

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeCard()
                return
            }
            if (
                section === "space" &&
                (e.key === "ArrowRight" || e.key === "ArrowLeft")
            ) {
                e.preventDefault()
                const ci = activePlanet
                    ? planets.findIndex((p) => p.id === activePlanet.id)
                    : -1
                let ni =
                    ci === -1
                        ? 0
                        : e.key === "ArrowRight"
                          ? (ci + 1) % planets.length
                          : (ci - 1 + planets.length) % planets.length
                setActivePlanet(planets[ni])
                setHoveredId(planets[ni].id)
                const vw = window.innerWidth,
                    vh = window.innerHeight
                setCardPos({ x: vw / 2 + 100, y: vh / 2 })
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [activePlanet, planets, section])

    const [pulseIdx, setPulseIdx] = useState(0)
    const activeId = hoveredId ?? activePlanet?.id ?? null
    const activeRing = activeId ? (ringMap[activeId] ?? -1) : -1
    useEffect(() => {
        if (activeId) {
            setPulseIdx(-1)
            return
        }
        if (pulseIdx === -1) setPulseIdx(0)
        const t = setInterval(
            () =>
                setPulseIdx((p) =>
                    p >= ringCount - 1 || p === -1 ? 0 : p + 1
                ),
            orbitPulseSpeed * 1000
        )
        return () => clearInterval(t)
    }, [activeId, orbitPulseSpeed])

    return (
        <div
            className="qr"
            style={rootStyle}
            ref={rootRef}
            onScroll={handleScroll}
            onClick={() => {
                if (activePlanet) closeCard()
            }}
        >
            <motion.div
                className="qr-stage"
                variants={containerV}
                initial="hidden"
                animate={isReady ? "visible" : "hidden"}
            >
                <motion.div
                    variants={titleV}
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
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
                        <h1 className="qr-title">{heroTitleText}</h1>
                        {heroSubtitleText && (
                            <p
                                className="qr-sub"
                                style={{ marginTop: subtitleOffsetY }}
                            >
                                {heroSubtitleText}
                            </p>
                        )}
                        {heroTagline && (
                            <p className="qr-tag">{nl(heroTagline)}</p>
                        )}
                    </div>
                </motion.div>
                <motion.div
                    ref={areaRef}
                    className={`qr-orbits ${activePlanet ? "is-paused" : ""}`}
                    variants={sysV}
                    style={{ x: systemOffsetX, y: systemOffsetY }}
                >
                    <div className="tor-wrap">
                        {toroideImage ? (
                            <img
                                src={toroideImage}
                                alt="RSV"
                                className="tor-img"
                            />
                        ) : (
                            <div
                                style={{
                                    width: toroideSize,
                                    height: toroideSize,
                                    borderRadius: "50%",
                                    background:
                                        "radial-gradient(circle at 55% 45%,#fff 8%,#ffd06b 30%,#ff9a2e 57%,#ff7a00 75%,transparent 76%)",
                                    boxShadow: `0 0 22px rgba(255,169,64,.95),0 0 70px rgba(255,136,0,.65),0 0 120px ${hexToRgba(ac, 0.4)}`,
                                    animation:
                                        "tor-pulse 5s ease-in-out infinite alternate",
                                }}
                            />
                        )}
                    </div>
                    <svg
                        className="qr-orbits-svg"
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {ringR.map((r, i) => (
                            <path
                                key={`b${i}`}
                                className="orb-back"
                                d={ePath(r, ry(r))}
                            />
                        ))}
                        {ringR.map((r, i) => {
                            const inter = activeRing !== -1
                            const pulse = !inter && i <= pulseIdx
                            const on = inter ? activeRing === i : pulse
                            return (
                                <path
                                    key={`f${i}`}
                                    className={`orb-front ${on ? "is-active" : ""}`}
                                    d={ePath(r, ry(r))}
                                />
                            )
                        })}
                    </svg>
                    {planets.map((p) => {
                        const ring = ringMap[p.id] ?? 0
                        const r = ringR[ring]
                        const d = ePath(r, ry(r))
                        const phase = phaseMap[p.id] ?? 0
                        const dur = p.orbitDuration
                        const baseMult = 1.5
                        const extraMult = p.id === "simuladores" ? 1.2 : 1
                        const pSize = Math.round(p.size * baseMult * extraMult)
                        return (
                            <div
                                key={p.id}
                                className={`onpath${activePlanet?.id === p.id ? " is-focus" : ""}`}
                                style={
                                    {
                                        offsetPath: `path('${d}')`,
                                        WebkitOffsetPath: `path('${d}')`,
                                        offsetRotate: "0deg",
                                        WebkitOffsetRotate: "0deg",
                                        animation: `orbit-move ${dur}s linear infinite`,
                                        animationDelay: `${-phase * dur}s`,
                                        width: pSize,
                                        height: pSize,
                                    } as React.CSSProperties
                                }
                            >
                                <a
                                    /* 🜂 v5.13 — el planeta del Escáner va a
                                       app.escanervibracional.com (su casa de
                                       escritorio) con el PORTAL DE TRÁNSITO;
                                       el dominio viejo quedó solo como
                                       backend de las apps nativas. */
                                    href={
                                        p.id === "escaner"
                                            ? ESCANER_LANDING_URL
                                            : p.link
                                    }
                                    target={p.targetBlank ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        if (
                                            p.id !== "escaner" ||
                                            p.targetBlank
                                        )
                                            return
                                        e.preventDefault()
                                        abrirPortalEscaner(
                                            e.clientX,
                                            e.clientY,
                                            ESCANER_LANDING_URL
                                        )
                                    }}
                                    onMouseEnter={(e) => {
                                        if (
                                            scrolling.current ||
                                            section === "earth"
                                        )
                                            return
                                        if (Date.now() < cooldown.current)
                                            return
                                        setHoveredId(p.id)
                                        setActivePlanet(p)
                                        const rect = (
                                            e.currentTarget as HTMLElement
                                        ).getBoundingClientRect()
                                        setCardPos({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top + rect.height / 2,
                                        })
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredId((prev) =>
                                            prev === p.id ? null : prev
                                        )
                                    }}
                                    style={{
                                        display: "block",
                                        position: "absolute",
                                        inset: 0,
                                    }}
                                >
                                    <div
                                        className={`pl-box ${hoveredId === p.id ? "hov" : ""}`}
                                    >
                                        <div className="sh-wrap">
                                            <CardIcon id={p.id} />
                                        </div>
                                    </div>
                                    <div
                                        className={`lbl ${p.id === "sesiones" ? "lbl-flip" : ""}`}
                                        style={
                                            {
                                                "--lbl-off": `${p.labelOffset}px`,
                                                ...(p.id === "sesiones"
                                                    ? {
                                                          animationName:
                                                              "lbl-flip",
                                                          animationDuration: `${dur}s`,
                                                          animationTimingFunction:
                                                              "linear",
                                                          animationDelay: `${-phase * dur}s`,
                                                          animationIterationCount:
                                                              "infinite",
                                                      }
                                                    : {}),
                                            } as any
                                        }
                                    >
                                        {p.title}
                                    </div>
                                    <div
                                        className={`ret ${hoveredId === p.id || activePlanet?.id === p.id ? "on" : ""}`}
                                        aria-hidden="true"
                                    >
                                        <span className="cn tl" />
                                        <span className="cn tr" />
                                        <span className="cn bl" />
                                        <span className="cn br" />
                                        <span className="scn" />
                                    </div>
                                </a>
                            </div>
                        )
                    })}
                </motion.div>
            </motion.div>
            <div className="qr-start">
                <AnimatePresence>
                    {section === "space" && !activePlanet && <ScrollDots />}
                </AnimatePresence>
            </div>
            <EarthSection
                webhookUrl={webhookUrl}
                manifestoShort={manifestoShort!}
                manifestoLong={manifestoLong!}
                guiaImage={guiaImage}
                guiaNombre={guiaNombre!}
                guiaDescShort={guiaDescShort!}
                guiaDescLong={guiaDescLong!}
                guiaCtaText={guiaCtaText!}
                aquaImage={aquaImage}
                aquaNombre={aquaNombre}
                aquaDescShort={aquaDescShort}
                aquaDescLong={aquaDescLong}
                aquaCtaText={aquaCtaText}
                afinacionesTitle={afinacionesTitle!}
                afinacionesText={afinacionesText!}
                afinacionesWebhookUrl={afinacionesWebhookUrl!}
                spotifyUrl={spotifyUrl}
                twitterUrl={twitterUrl}
                instagramUrl={instagramUrl}
                nodoTitle={nodoTitle}
                nodoSubtitle={nodoSubtitle}
                organismoText={organismoText}
                ajusteButtonText={ajusteButtonText}
            />
            <AnimatePresence>
                {activePlanet && section === "space" && (
                    <FloatingCard
                        key={activePlanet.id}
                        planet={activePlanet}
                        x={cardPos.x}
                        y={cardPos.y}
                        onClose={closeCard}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT — viewport switch
   ═══════════════════════════════════════════════════ */
export function Origen(props: Props) {
    const cssReady = useRef(false)
    useInjectSolarCss(() => {
        cssReady.current = true
    })

    /* ── FIX: mobile detection ──
       forceIsMobile={true} from Domo = guaranteed mobile (trust it)
       forceIsMobile={false|undefined} = Domo may not have detected yet,
       so ALWAYS fall back to local matchMedia/screen.width detection.
       This prevents Domo's default {isMobile:false} from overriding
       a correct local mobile detection on first render. */
    const localVp = useViewportLocal()
    const isMobile = props.forceIsMobile === true ? true : localVp.isMobile

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    /* ── Sync CSS class with JS mobile detection ──
       iOS Safari's CSS viewport can be ~980px even on phones,
       so @media(max-width:768px) fails. This class lets CSS
       rules target mobile regardless of the CSS viewport.
       useLayoutEffect ensures class is set BEFORE browser paint. */
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const cl = document.documentElement.classList
        if (isMobile) cl.add("rsv-is-mobile")
        else cl.remove("rsv-is-mobile")
        return () => {
            cl.remove("rsv-is-mobile")
        }
    }, [isMobile])

    /* 🜂 v5.15 — TODOS LOS HOOKS ARRIBA DEL RETURN CONDICIONAL.
       Esta lectura vivía DEBAJO del `if (!mounted)` de abajo: en el primer
       render (mounted=false) el return temprano la saltaba y en el segundo sí
       corría, así que React veía hooks de más entre un render y el siguiente y
       tumbaba el componente entero (error #310) — el sistema solar completo
       quedaba en negro. Regla dura: ningún hook después de un return. */
    const hideSesiones = useHideSesionesFlag(
        props.supabaseUrl,
        props.supabaseAnonKey
    )

    if (!mounted) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    background: props.bgColor || "#000",
                }}
            />
        )
    }

    /* 🜂 v5.13 — EL PLANETA "SESIONES" RESPETA EL INTERRUPTOR DEL MOTOR
       (Zak 2026-08-03: "la pestaña de sesiones está desactivada, pero en los
       planetas de la orilla sigue apareciendo"). La pestaña de la barra se
       había apagado a mano el 2026-07-27; el sistema solar seguía orbitando
       con Sesiones siempre, así que el planeta llevaba a la pantalla de
       cortesía. Ahora se lee el mismo interruptor que gobierna /sesiones
       (hide_sesiones) y el planeta se retira solo. La LECTURA del interruptor
       vive arriba, junto a los demás hooks (ver v5.15). */
    const p = hideSesiones
        ? { ...props, hideSesiones: true, mobileShowSesiones: false }
        : props

    if (isMobile) return <SolarSystemMobile {...p} />
    return <SolarSystemDesktop {...p} />
}

/* ═══════════════════════════════════════
   DEFAULTS
   ═══════════════════════════════════════ */
Origen.defaultProps = {
    forceIsMobile: undefined,
    webhookUrl: "",
    navbarOffset: 72,
    planetGlow: 0.8,
    orbitSpeed: 12,
    orbitPulseSpeed: 1.0,
    orbitTilt: 0.35,
    reticleSize: 64,
    reticleGlow: 0.6,
    warpSpeed: 1.0,
    bgColor: "#000000",
    textColor: "#E6F7EF",
    subtitleOffsetY: 12,
    consoleWidth: 800,
    titleSize: 72,
    accentColor: "#00C2FF",
    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText: "TEMPLO SOLAR 5D",
    heroTagline: "Biblioteca de la Nueva Tierra",
    numStars: 150,
    numComets: 2,
    titleOffsetY: 48,
    systemOffsetY: 48,
    systemOffsetX: 0,
    toroideImage: undefined,
    toroideSize: 280,
    manifestoShort:
        "La vieja estructura se disuelve.\nPara navegar el colapso y construir lo nuevo, no necesitas suerte; necesitas Instrucción.",
    manifestoLong:
        "Hemos abierto los Códices de Luz: la biblioteca con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.\n\nRed Solar Viva no es solo información. Es un campo vivo de activación.",
    guiaImage: undefined,
    guiaNombre: "Zak'Haar Solar",
    guiaDescShort: "Arquitecto de Red Solar Viva y autor de los Códices de Luz.",
    guiaDescLong:
        "Zak'Haar canaliza instrucción directa desde el campo solar. Su trabajo integra biología, frecuencia y memoria estelar para devolverte al centro de tu diseño original.",
    guiaCtaText: "Conocer al Guía",
    aquaImage: undefined,
    aquaNombre: "Aqua'Riia",
    aquaDescShort: "Co-creadora y arquitecta de Red Solar Viva.",
    aquaDescLong:
        "Aqua'Riia sostiene la visión y la vuelve habitable. Donde llega el pulso, ella escucha el detalle: la sutileza que le da su lugar exacto a cada pieza.\\n\\nSu trabajo teje la sensibilidad con la estructura, para que lo que se crea aquí no solo se entienda, sino que se sienta.",
    aquaCtaText: "Pulso de Aqua",
    afinacionesTitle: "AFINACIONES",
    afinacionesText:
        "¿Hay algo que te gustaría que agregáramos o afináramos aquí? Tu mirada es parte del pulso solar.\\n\\nSi sientes una idea, una mejora o una nueva función que podría expandir el campo de Red Solar Viva, compártela.\\n\\nEscribe tu propuesta aquí abajo y la meditaremos.\\n\\n¡Gracias por co-crear este espacio solar!",
    afinacionesWebhookUrl: "",
    spotifyUrl:
        "https://open.spotify.com/artist/6BSsXgmAnoie8tUgLtIbqb?si=Yal8ZrynSxeT4lRLJd1mwA",
    twitterUrl: "https://x.com/ZakHaarSol",
    instagramUrl: "https://www.instagram.com/zakhaarsol/#",
    nodoTitle: "ÚNETE AL NODO CENTRAL",
    nodoSubtitle:
        "Recibe las transmisiones de Red Solar Viva, avisos de nuevos lanzamientos y actualizaciones significativas.",
    organismoText:
        "Red Solar Viva es un organismo vivo que evoluciona contigo:",
    ajusteButtonText: "Enviar Señal de Ajuste",
    mobileCtaText: "ESCÁNER VIBRACIONAL",
    mobileCtaUrl: "/radar",
    mobileGuiaCtaText: "Saber más sobre Zak",
    mobileShowCodex: true,
    mobileShowSesiones: true,
    mobileShowFragmentos: false,
    mobileShowMeditaciones: false,
    p1_Size: 70,
    p1_Title: "Códices",
    p1_PanelTitle: "Códices de Luz",
    p1_Desc:
        "La biblioteca técnica con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.",
    p1_Link: "codices",
    p1_TargetBlank: false,
    p1_OrbitDuration: 110,
    p1_LabelOffset: 4,
    p2_Size: 60,
    p2_Title: "Sesiones",
    p2_PanelTitle: "Sesiones",
    p2_Desc: "Acompañamiento y recalibración vibral para nodos en activación.",
    p2_Link: "sesiones",
    p2_TargetBlank: false,
    p2_OrbitDuration: 90,
    p2_LabelOffset: 4,
    p3_Size: 55,
    p3_Title: "Fragmentos",
    p3_PanelTitle: "Fragmentos del Sol",
    p3_Desc:
        "Episodios de pulsos visuales y sonoros para la activación del campo.",
    p3_Link: "fragmentosdelsol",
    p3_TargetBlank: false,
    p3_OrbitDuration: 110,
    p3_LabelOffset: 4,
    p4_Size: 65,
    p4_Title: "Meditaciones",
    p4_PanelTitle: "Meditaciones",
    p4_Desc: "Sintonías y guías meditativas para alinear tu campo.",
    p4_Link: "meditaciones",
    p4_TargetBlank: false,
    p4_OrbitDuration: 100,
    p4_LabelOffset: 4,
    p5_Size: 64,
    p5_Title: "Simuladores",
    p5_PanelTitle: "Simuladores",
    p5_Desc: "Capa lúdica de la Red: juegos y dinámicas para activar el campo.",
    p5_Link: "simuladores",
    p5_TargetBlank: false,
    p5_OrbitDuration: 110,
    p5_LabelOffset: 4,
    p6_Size: 58,
    p6_Title: "Escáner",
    p6_PanelTitle: "Escáner Vibracional",
    p6_Desc:
        "La app que mide tus seis corrientes de energía y te devuelve un Índice de Luz.\\nUna inteligencia te acompaña a elevarlo, todos los días.",
    p6_Link: "/radar",
    p6_TargetBlank: false,
    p6_OrbitDuration: 110,
    p6_LabelOffset: 4,
}

/* ═══════════════════════════════════════
   FRAMER PROPERTY CONTROLS
   ═══════════════════════════════════════ */
addPropertyControls(Origen, {
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        placeholder: "https://...",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color Primario",
        defaultValue: "#00C2FF",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#E6F7EF",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
        min: 24,
        max: 200,
        step: 2,
        displayStepper: true,
    },
    heroSubtitleText: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "TEMPLO SOLAR 5D",
    },
    heroTagline: {
        type: ControlType.String,
        title: "Tagline",
        defaultValue: "Biblioteca de la Nueva Tierra",
        displayTextArea: true,
    },
    toroideImage: { type: ControlType.Image, title: "🌀 Toroide PNG" },
    toroideSize: {
        type: ControlType.Number,
        title: "🌀 Toroide (px)",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
        displayStepper: true,
    },
    guiaImage: { type: ControlType.Image, title: "👤 Foto Guía" },
    guiaNombre: {
        type: ControlType.String,
        title: "👤 Nombre Guía",
        defaultValue: "Zak'Haar Solar",
    },
    guiaDescShort: {
        type: ControlType.String,
        title: "👤 Desc. corta",
        defaultValue:
            "Arquitecto de Red Solar Viva y autor de los Códices de Luz.",
        displayTextArea: true,
    },
    guiaDescLong: {
        type: ControlType.String,
        title: "👤 Desc. extendida",
        defaultValue:
            "Zak'Haar canaliza instrucción directa desde el campo solar.",
        displayTextArea: true,
    },
    guiaCtaText: {
        type: ControlType.String,
        title: "👤 Texto Botón Guía",
        defaultValue: "Conocer al Guía",
    },
    aquaImage: { type: ControlType.Image, title: "💧 Foto Aqua" },
    aquaNombre: {
        type: ControlType.String,
        title: "💧 Nombre Aqua",
        defaultValue: "Aqua'Riia",
    },
    aquaDescShort: {
        type: ControlType.String,
        title: "💧 Desc. corta",
        defaultValue: "Co-creadora y arquitecta de Red Solar Viva.",
        displayTextArea: true,
    },
    aquaDescLong: {
        type: ControlType.String,
        title: "💧 Desc. extendida",
        displayTextArea: true,
    },
    aquaCtaText: {
        type: ControlType.String,
        title: "💧 Texto Botón Aqua",
        defaultValue: "Pulso de Aqua",
    },
    manifestoShort: {
        type: ControlType.String,
        title: "📜 Manifiesto (corto)",
        displayTextArea: true,
    },
    manifestoLong: {
        type: ControlType.String,
        title: "📜 Manifiesto (extendido)",
        displayTextArea: true,
    },
    afinacionesTitle: {
        type: ControlType.String,
        title: "🔧 Modal Título",
        defaultValue: "AFINACIONES",
    },
    afinacionesText: {
        type: ControlType.String,
        title: "🔧 Modal Texto",
        displayTextArea: true,
    },
    afinacionesWebhookUrl: {
        type: ControlType.String,
        title: "⚡ Webhook Mensajes",
        defaultValue: "",
    },
    spotifyUrl: { type: ControlType.String, title: "🎵 Spotify URL" },
    twitterUrl: { type: ControlType.String, title: "𝕏 X URL" },
    instagramUrl: { type: ControlType.String, title: "📷 Instagram URL" },
    nodoTitle: {
        type: ControlType.String,
        title: "Título Nodo",
        defaultValue: "ÚNETE AL NODO CENTRAL",
        displayTextArea: true,
    },
    nodoSubtitle: {
        type: ControlType.String,
        title: "Subtítulo Nodo",
        displayTextArea: true,
    },
    organismoText: {
        type: ControlType.String,
        title: "Texto Organismo",
        displayTextArea: true,
    },
    ajusteButtonText: {
        type: ControlType.String,
        title: "Texto Botón Ajuste",
        defaultValue: "Enviar Señal de Ajuste",
    },
    mobileCtaText: {
        type: ControlType.String,
        title: "📱 CTA Hero Móvil",
        defaultValue: "ESCÁNER VIBRACIONAL",
    },
    mobileCtaUrl: {
        type: ControlType.String,
        title: "📱 CTA URL Móvil",
        defaultValue: "/radar",
    },
    mobileGuiaCtaText: {
        type: ControlType.String,
        title: "📱 Botón Guía Móvil",
        defaultValue: "Saber más sobre Zak",
    },
    mobileShowCodex: {
        type: ControlType.Boolean,
        title: "📱 Códices activo",
        defaultValue: true,
    },
    mobileShowSesiones: {
        type: ControlType.Boolean,
        title: "📱 Sesiones activo",
        defaultValue: true,
    },
    mobileShowFragmentos: {
        type: ControlType.Boolean,
        title: "📱 Fragmentos activo",
        defaultValue: false,
    },
    mobileShowMeditaciones: {
        type: ControlType.Boolean,
        title: "📱 Meditaciones activo",
        /* La capa de Meditaciones ya está viva en el Lente; card
           activa por default. Si se quiere ocultar puntualmente
           (ej. evento), toggle OFF desde Framer. */
        defaultValue: true,
    },
    navbarOffset: {
        type: ControlType.Number,
        title: "Navbar Offset",
        defaultValue: 72,
        min: 0,
        max: 240,
        step: 1,
        displayStepper: true,
    },
    subtitleOffsetY: {
        type: ControlType.Number,
        title: "Subtítulo Y",
        defaultValue: 12,
        min: -200,
        max: 160,
        step: 1,
        displayStepper: true,
    },
    planetGlow: {
        type: ControlType.Number,
        title: "Glow Planeta",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    orbitPulseSpeed: {
        type: ControlType.Number,
        title: "Veloc. Pulso (s)",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    orbitTilt: {
        type: ControlType.Number,
        title: "Tilt 3D",
        defaultValue: 0.35,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    reticleSize: {
        type: ControlType.Number,
        title: "Retícula (px)",
        defaultValue: 64,
        min: 32,
        max: 140,
        step: 2,
    },
    reticleGlow: {
        type: ControlType.Number,
        title: "Glow Retícula",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 150,
        min: 0,
        max: 500,
        step: 10,
    },
    numComets: {
        type: ControlType.Number,
        title: "Cometas",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
    },
    titleOffsetY: {
        type: ControlType.Number,
        title: "Título Y",
        defaultValue: 48,
        min: -80,
        max: 240,
        step: 2,
        displayStepper: true,
    },
    systemOffsetY: {
        type: ControlType.Number,
        title: "Sistema Y",
        defaultValue: 48,
        min: -800,
        max: 300,
        step: 2,
        displayStepper: true,
    },
    systemOffsetX: {
        type: ControlType.Number,
        title: "Sistema X",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 2,
        displayStepper: true,
    },
    p1_Size: {
        type: ControlType.Number,
        title: "P1 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p1_Title: { type: ControlType.String, title: "P1 Título" },
    p1_PanelTitle: { type: ControlType.String, title: "P1 Panel Title" },
    p1_Desc: {
        type: ControlType.String,
        title: "P1 Desc",
        displayTextArea: true,
    },
    p1_Link: { type: ControlType.String, title: "P1 Link" },
    p1_TargetBlank: { type: ControlType.Boolean, title: "P1 Nuevo Tab" },
    p1_OrbitDuration: {
        type: ControlType.Number,
        title: "P1 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p1_LabelOffset: {
        type: ControlType.Number,
        title: "P1 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p2_Size: {
        type: ControlType.Number,
        title: "P2 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p2_Title: { type: ControlType.String, title: "P2 Título" },
    p2_PanelTitle: { type: ControlType.String, title: "P2 Panel Title" },
    p2_Desc: {
        type: ControlType.String,
        title: "P2 Desc",
        displayTextArea: true,
    },
    p2_Link: { type: ControlType.String, title: "P2 Link" },
    p2_TargetBlank: { type: ControlType.Boolean, title: "P2 Nuevo Tab" },
    p2_OrbitDuration: {
        type: ControlType.Number,
        title: "P2 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p2_LabelOffset: {
        type: ControlType.Number,
        title: "P2 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p3_Size: {
        type: ControlType.Number,
        title: "P3 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p3_Title: { type: ControlType.String, title: "P3 Título" },
    p3_PanelTitle: { type: ControlType.String, title: "P3 Panel Title" },
    p3_Desc: {
        type: ControlType.String,
        title: "P3 Desc",
        displayTextArea: true,
    },
    p3_Link: { type: ControlType.String, title: "P3 Link" },
    p3_TargetBlank: { type: ControlType.Boolean, title: "P3 Nuevo Tab" },
    p3_OrbitDuration: {
        type: ControlType.Number,
        title: "P3 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p3_LabelOffset: {
        type: ControlType.Number,
        title: "P3 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p4_Size: {
        type: ControlType.Number,
        title: "P4 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p4_Title: { type: ControlType.String, title: "P4 Título" },
    p4_PanelTitle: { type: ControlType.String, title: "P4 Panel Title" },
    p4_Desc: {
        type: ControlType.String,
        title: "P4 Desc",
        displayTextArea: true,
    },
    p4_Link: { type: ControlType.String, title: "P4 Link" },
    p4_TargetBlank: { type: ControlType.Boolean, title: "P4 Nuevo Tab" },
    p4_OrbitDuration: {
        type: ControlType.Number,
        title: "P4 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p4_LabelOffset: {
        type: ControlType.Number,
        title: "P4 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p5_Size: {
        type: ControlType.Number,
        title: "P5 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p5_Title: { type: ControlType.String, title: "P5 Título" },
    p5_PanelTitle: { type: ControlType.String, title: "P5 Panel Title" },
    p5_Desc: {
        type: ControlType.String,
        title: "P5 Desc",
        displayTextArea: true,
    },
    p5_Link: { type: ControlType.String, title: "P5 Link" },
    p5_TargetBlank: { type: ControlType.Boolean, title: "P5 Nuevo Tab" },
    p5_OrbitDuration: {
        type: ControlType.Number,
        title: "P5 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p5_LabelOffset: {
        type: ControlType.Number,
        title: "P5 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p6_Size: {
        type: ControlType.Number,
        title: "P6 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p6_Title: { type: ControlType.String, title: "P6 Título" },
    p6_PanelTitle: { type: ControlType.String, title: "P6 Panel Title" },
    p6_Desc: {
        type: ControlType.String,
        title: "P6 Desc",
        displayTextArea: true,
    },
    p6_Link: { type: ControlType.String, title: "P6 Link" },
    p6_TargetBlank: { type: ControlType.Boolean, title: "P6 Nuevo Tab" },
    p6_OrbitDuration: {
        type: ControlType.Number,
        title: "P6 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p6_LabelOffset: {
        type: ControlType.Number,
        title: "P6 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
})
