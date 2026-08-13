// Red Solar Viva — Co_Shared.tsx v1.8 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v1.6 — sin promo_code de Códices (descuento eliminado)
// v1.5 — Seguridad Ola B: membresía y compras de Códices ya no leen
// `subscriptions`/`purchases` directo; usan vías seguras `get_my_membership`
// y `get_my_purchases` (no exponen correos ni el padrón completo).
// v1.4 — `withCheckoutIdentity` agrega sufijo `__m` (LENTE) o `__d`
// (CENTRO DE MANDO) al client_reference_id basado en user-agent. El
// webhook Compras.js parsea el sufijo para registrar desde dónde se
// hizo la compra del Códice. Cero efecto sobre otros consumidores
// que ignoren el sufijo (stripe-webhook ya enlaza por email).
// v1.0.1 — Re-trigger para confirmar status en Framer.
// v1.0 — Utilities, hooks, contextos, constantes y helpers que
// comparten el ecosistema móvil y escritorio de Códices. Parte del
// split de Codices.tsx (sello Co_, paralelo a MN_ / EV_).
//
// Default export: componente fantasma + Object.assign con todos los
// utilities (patrón canónico de RSV para satisfacer el componentLoader
// de Framer en archivos utility-only).
//
// Consumidores esperados: Codices.tsx (shell), Co_Mobile.tsx,
// Co_Desktop.tsx, Co_DesktopHolo.tsx, Co_Icons.tsx.

import * as React from "react"
import { useState, useEffect, useLayoutEffect } from "react"

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  TYPES                                                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export type ClerkIdentity = { email: string; clerkId: string }

export type CristalInterceptFn = (book: any, formats: string[]) => boolean

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  CONTEXTS                                                       ║
   ╚══════════════════════════════════════════════════════════════════╝ */

/* Cuando el Tripulante tiene cristal dorado disponible, picar
   "DESBLOQUEAR PDF + Ebook" llama a esta función — si retorna true,
   la navegación al Stripe Payment Link se cancela y aparece el modal
   de confirmación de canje. CodicesMobile y CodicesDesktop inyectan
   su propio handler vía Provider. */
export const CristalInterceptContext =
    React.createContext<CristalInterceptFn>(() => false)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  SHARED UTILITIES                                               ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const makeFallbackDataUrl = (
    title: string,
    color = "#00C2FF",
    w = 150,
    h = 210
) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='${color}' stop-opacity='0.35'/><stop offset='100%' stop-color='${color}' stop-opacity='0.1'/></linearGradient></defs><rect width='100%' height='100%' rx='12' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,sans-serif' font-size='14' fill='${color}' opacity='0.85'>${title}</text></svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    if (hex.includes("var(") || hex.includes("rgb") || hex.includes("hsl")) {
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    }
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    if (isNaN(num)) {
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    }
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}

export const normalizeMultiline = (str?: string) =>
    (str || "").replace(/\\n/g, "\n")

export const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

/* Desktop-only utilities */
export const withAccentVar = (fallback: string) =>
    `var(--accent, ${(fallback || "#00C2FF").trim() || "#00C2FF"})`

export const alphaMix = (color: string, a: number) => {
    const pct = Math.round(Math.max(0, Math.min(1, a)) * 100)
    const base = (color || "#00C2FF").trim() || "#00C2FF"
    return `color-mix(in oklab, ${base} ${pct}%, transparent)`
}

export const readAccentFromCSS = (): string | null => {
    try {
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim()
        if (v) return v
    } catch {}
    try {
        const v = document.body
            ? getComputedStyle(document.body)
                  .getPropertyValue("--accent")
                  .trim()
            : ""
        if (v) return v
    } catch {}
    return null
}

export const readAccentNearest = (start: Element | null): string | null => {
    let el: Element | null = start
    while (el) {
        try {
            const v = getComputedStyle(el).getPropertyValue("--accent").trim()
            if (v) return v
        } catch {}
        el = el.parentElement
    }
    return readAccentFromCSS()
}

export const playHoloHover = () => {
    if (typeof window === "undefined") return
    try {
        const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) return
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.015, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    } catch (e) {}
}

export const appendPromo = (url?: string, code?: string | null): string => {
    if (!url) return ""
    if (!code) return url
    const sep = url.includes("?") ? "&" : "?"
    return `${url}${sep}prefilled_promo_code=${encodeURIComponent(code)}`
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  IDENTIDAD DEL TRIPULANTE PARA STRIPE CHECKOUT                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

/* Store module-level + polling 1 s + listeners. Componentes que
   construyen checkout hrefs llaman useClerkIdentity() al render; el
   hook se suscribe al store y fuerza re-render cuando cambia el user.
   El resultado se pasa como arg explícito a withCheckoutIdentity para
   evitar condiciones de carrera (los hrefs se construyen en render y
   Clerk puede cargarse después del primer render). */

let __clerkIdentityCache: ClerkIdentity = { email: "", clerkId: "" }
const __clerkIdentityListeners = new Set<() => void>()
let __clerkIdentityPollingStarted = false

const __pollClerkIdentity = () => {
    try {
        const u = (window as any).Clerk?.user
        const email =
            u?.primaryEmailAddress?.emailAddress ||
            u?.emailAddresses?.[0]?.emailAddress ||
            ""
        const clerkId = u?.id || ""
        if (
            __clerkIdentityCache.email !== email ||
            __clerkIdentityCache.clerkId !== clerkId
        ) {
            __clerkIdentityCache = { email, clerkId }
            __clerkIdentityListeners.forEach((l) => l())
        }
    } catch {}
}

const __ensureClerkPolling = () => {
    if (__clerkIdentityPollingStarted) return
    if (typeof window === "undefined") return
    __clerkIdentityPollingStarted = true
    __pollClerkIdentity()
    setInterval(__pollClerkIdentity, 1000)
}

export function useClerkIdentity(): ClerkIdentity {
    const [, force] = useState(0)
    useEffect(() => {
        __ensureClerkPolling()
        const listener = () => force((n) => n + 1)
        __clerkIdentityListeners.add(listener)
        /* snapshot inicial por si ya está listo al montar */
        __pollClerkIdentity()
        return () => {
            __clerkIdentityListeners.delete(listener)
        }
    }, [])
    return __clerkIdentityCache
}

/* withCheckoutIdentity: función pura que recibe la identidad como arg.
   Toma el URL base (Stripe Payment Link) y le agrega prefilled_email +
   client_reference_id. Si la identidad está vacía devuelve el url sin
   tocar. Requiere que el Payment Link tenga "Collect customer's email"
   habilitado en el Dashboard de Stripe, de lo contrario prefilled_email
   se ignora (client_reference_id sí viaja al webhook sin importar).

   v1.4 — Device tracking en compras de Códices: sufijo `__m` (LENTE)
   o `__d` (CENTRO DE MANDO) al client_reference_id detectado por
   user-agent. El webhook Compras.js parsea el sufijo y lo pinta en
   el email/log. La identidad real (clerkId base) se preserva sin
   mutar otros consumidores que ignoren el sufijo. */
const detectDeviceSuffix = (): "__m" | "__d" => {
    if (typeof navigator === "undefined") return "__d"
    const ua = navigator.userAgent || ""
    if (/iPhone|iPod|Android[\s\S]*?Mobile/i.test(ua)) return "__m"
    return "__d"
}
export const withCheckoutIdentity = (
    url?: string,
    identity?: ClerkIdentity
): string => {
    if (!url) return ""
    const { email = "", clerkId = "" } = identity || {}
    if (!email && !clerkId) return url
    const sep = url.includes("?") ? "&" : "?"
    const parts: string[] = []
    if (email) parts.push(`prefilled_email=${encodeURIComponent(email)}`)
    if (clerkId) {
        const refWithDevice = `${clerkId}${detectDeviceSuffix()}`
        parts.push(
            `client_reference_id=${encodeURIComponent(refWithDevice)}`
        )
    }
    return `${url}${sep}${parts.join("&")}`
}

/* checkoutHref: helper unificado. Aplica promo code si corresponde,
   luego inyecta identidad. Llamado desde los componentes que construyen
   los hrefs — siempre acompañado de useClerkIdentity() en el mismo
   scope para que el re-render ocurra cuando Clerk cambia. */
export const checkoutHref = (
    url?: string,
    promoCode?: string | null,
    identity?: ClerkIdentity
): string => {
    if (!url) return ""
    const withPromo = promoCode ? appendPromo(url, promoCode) : url
    return withCheckoutIdentity(withPromo, identity)
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  VIEWPORT DETECTION (UA-first, 3 layers)                        ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export function useViewportLocal() {
    const getVp = () => {
        if (typeof window === "undefined")
            return {
                isMobile: false,
                isTablet: false,
                width: 1440,
                height: 900,
            }
        const ua =
            typeof navigator !== "undefined" ? navigator.userAgent || "" : ""
        const isPhone = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
        if (isPhone)
            return {
                isMobile: true,
                isTablet: false,
                width: window.innerWidth,
                height: window.innerHeight,
            }
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
        const ua =
            typeof navigator !== "undefined" ? navigator.userAgent || "" : ""
        if (/iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)) return
        const mq = typeof window.matchMedia === "function"
        const mqlMobile = mq ? window.matchMedia("(max-width: 768px)") : null
        let raf: number
        const update = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                setVp((prev) => {
                    const next = getVp()
                    if (
                        prev.isMobile === next.isMobile &&
                        prev.width === next.width
                    )
                        return prev
                    return next
                })
            })
        }
        window.addEventListener("resize", update)
        mqlMobile?.addEventListener?.("change", update)
        return () => {
            window.removeEventListener("resize", update)
            mqlMobile?.removeEventListener?.("change", update)
            cancelAnimationFrame(raf)
        }
    }, [])
    return vp
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  COMBINED CSS (mobile + desktop)                                ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const COMBINED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');

/* ── Mobile CSS ── */
.m-scroll::-webkit-scrollbar{width:0;background:transparent}
.m-scroll{scrollbar-width:none;-ms-overflow-style:none}
.m-pill{transition:transform .1s ease-out,box-shadow .1s ease-out,border-color .1s ease-out,background .1s ease-out}
.m-pill:active{transform:scale(0.96) !important;box-shadow:var(--pill-glow) !important}
.m-faq-btn{transition:transform .1s ease-out,box-shadow .1s ease-out}
.m-faq-btn:active{transform:scale(0.9)}
.m-amazon-pill{transition:transform .1s ease-out}
.m-amazon-pill:active{transform:scale(0.95)}
.m-author-card{transition:transform .1s ease-out}
.m-author-card:active{transform:scale(0.97) !important}
.m-preview-btn{transition:transform .1s ease-out,box-shadow .1s ease-out}
.m-preview-btn:active{transform:scale(0.96)}
.m-explore-btn{transition:transform .12s ease-out,border-color .15s ease-out,box-shadow .15s ease-out}
.m-explore-btn:active{transform:scale(0.95) !important}
@keyframes exploreShimmer{0%{left:-100%}50%{left:140%}100%{left:140%}}
@keyframes consolaOverlayIn{from{opacity:0}to{opacity:1}}
@keyframes consolaSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}

/* ── Desktop CSS ── */
.holo-scroll-container{height:100vh;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-ms-overflow-style:none}
.holo-scroll-container::-webkit-scrollbar{width:0;background:transparent}
.active-author-overlay{scrollbar-width:none;-ms-overflow-style:none}
.active-author-overlay::-webkit-scrollbar{width:0;height:0;background:transparent}
.capsule-node{border:2px solid transparent;background:rgba(0,0,0,0);box-shadow:none;opacity:0.85;transform:scale(1);transition:opacity .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.capsule-node img{opacity:0.85;transition:opacity .2s ease}
.capsule-node.capsule-active{border-color:var(--cap-color,#00C2FF);background:radial-gradient(circle at 50% 50%,var(--cap-bg,rgba(0,194,255,0.33)) 0%,transparent 70%);box-shadow:0 0 10px var(--cap-glow1,rgba(0,194,255,0.67)),0 0 22px var(--cap-glow2,rgba(0,194,255,0.27));opacity:1;transform:scale(1.08)}
.capsule-node.capsule-active img{opacity:1}
.holo-tile{transition:transform .12s ease-out,box-shadow .12s ease-out,border-color .12s ease-out,background .12s ease-out}
.holo-tile:hover{transform:scale(1.05);box-shadow:var(--tile-glow-hover) !important;border-color:var(--tile-border-hover) !important;background:var(--tile-bg-hover) !important}
.holo-tile:active{transform:scale(0.96)}
.holo-tile.holo-tile-disabled{pointer-events:auto;cursor:default}
.holo-tile.holo-tile-disabled:hover{transform:scale(1) !important;box-shadow:var(--tile-glow-rest) !important;border-color:var(--tile-border-rest) !important;background:var(--tile-bg-rest) !important}
.holo-tile.holo-tile-disabled:active{transform:scale(1) !important}
.holo-tile:focus-visible{box-shadow:var(--tile-glow-hover) !important;border-color:var(--tile-border-hover) !important;outline:2px solid var(--tile-border-hover);outline-offset:2px}
.holo-backtop{transition:border-color .12s ease-out,background .12s ease-out,box-shadow .12s ease-out,transform .12s ease-out}
.holo-backtop:hover{border-color:var(--bt-color) !important;background:var(--bt-bg-hover) !important;box-shadow:var(--bt-glow-hover) !important;transform:scale(1.08)}
.holo-backtop:active{transform:scale(0.94)}
.holo-faq-btn{transition:border-color .12s ease-out,background .12s ease-out,box-shadow .12s ease-out,transform .12s ease-out}
.holo-faq-btn:hover{border-color:var(--bt-color) !important;background:var(--bt-bg-hover) !important;box-shadow:var(--bt-glow-hover) !important;transform:scale(1.08)}
.holo-faq-btn:active{transform:scale(0.94)}
.faq-modal-close{transition:transform .2s ease-out,box-shadow .2s ease-out,background .15s ease-out,color .15s ease-out,border-color .15s ease-out}
.faq-modal-close:hover{transform:rotate(90deg) scale(1.15) !important;box-shadow:var(--close-glow) !important;background:var(--close-bg-hover) !important;border-color:currentColor !important;color:var(--bt-color,#00C2FF) !important}
.faq-modal-close:active{transform:rotate(90deg) scale(0.95) !important}
.faq-answer-grid{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .35s ease-out,opacity .25s ease-out}
.faq-answer-grid.faq-open{grid-template-rows:1fr;opacity:1}
.faq-answer-inner{overflow:hidden;min-height:0}
.cover-hover-wrap{position:relative;cursor:pointer;overflow:hidden;border-radius:16px;transition:transform 0.3s ease-out;transform:scale(1);z-index:1}
.cover-hover-wrap:hover{transform:scale(1.05);z-index:10}
.cover-hover-wrap .cover-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);opacity:0;transition:opacity .25s ease-out;z-index:2;border-radius:16px;pointer-events:none}
.cover-hover-wrap:hover .cover-overlay{opacity:1}
.cover-main-img{display:block;width:100%;border-radius:16px}
.console-twin-btn{display:flex;align-items:center;justify-content:center;gap:6px;flex:1;min-width:0;height:42px;border-radius:10px;cursor:pointer;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:500;letter-spacing:.03em;text-decoration:none;position:relative;overflow:hidden;outline:none;transition:transform .12s ease-out,box-shadow .12s ease-out,border-color .12s ease-out,background .12s ease-out}
.console-twin-btn:hover{transform:scale(1.04)}
.console-twin-btn:active{transform:scale(0.96)}
.explorar-codice-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 32px;border-radius:14px;cursor:pointer;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:400;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;position:relative;overflow:hidden;outline:none;transition:transform .12s ease-out;border:1.5px solid var(--ec-border);background:var(--ec-bg);box-shadow:var(--ec-shadow);color:var(--ec-color);backdrop-filter:blur(6px)}
.explorar-codice-btn:hover{transform:scale(1.04);border-color:var(--ec-border-hover) !important;box-shadow:var(--ec-shadow-hover) !important;background:var(--ec-bg-hover) !important}
.explorar-codice-btn:active{transform:scale(0.96)}
.float-btn{height:50px;border-radius:16px 0 0 16px;cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;font-family:'Inter',sans-serif;overflow:hidden;white-space:nowrap;position:relative;min-width:50;padding:0 14px;backdrop-filter:blur(20px);border:1px solid var(--fb-border);border-right:3px solid var(--fb-bl);background:var(--fb-bg);box-shadow:var(--fb-shadow);color:var(--fb-color);transition:padding .15s ease-out,gap .15s ease-out}
.float-btn:hover{border-color:var(--fb-border-h) !important;border-right-color:var(--fb-bl-h) !important;background:var(--fb-bg-h) !important;box-shadow:var(--fb-shadow-h) !important;color:var(--fb-color-h) !important}
.float-btn:active{transform:scale(0.92)}
.console-toggle-btn{width:56px;height:56px;border-radius:0 16px 16px 0;cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;backdrop-filter:blur(12px);position:relative;overflow:hidden;padding:0;border:1px solid var(--ct-border);border-left:3px solid var(--ct-bl);background:var(--ct-bg);box-shadow:var(--ct-shadow);color:var(--ct-color)}
.console-toggle-btn:hover{border-color:var(--ct-border-h) !important;border-left-color:var(--ct-bl-h) !important;background:var(--ct-bg-h) !important;box-shadow:var(--ct-shadow-h) !important}
.console-toggle-btn:active{transform:scale(0.9)}
.console-close-premium{position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:20;outline:none;padding:0;border:1.5px solid var(--cc-border);background:var(--cc-bg);box-shadow:var(--cc-shadow);color:var(--cc-color);backdrop-filter:blur(8px);transition:transform .15s ease-out}
.console-close-premium:hover{border-color:var(--cc-border-h) !important;background:var(--cc-bg-h) !important;box-shadow:var(--cc-shadow-h) !important;color:var(--cc-color-h) !important;transform:rotate(90deg) scale(1.1)}
.console-close-premium:active{transform:rotate(90deg) scale(0.92)}
.sidenav-item{display:flex;align-items:center;gap:14px;cursor:pointer;padding:14px 20px 14px 16px;border-radius:0 18px 18px 0;backdrop-filter:blur(20px);position:relative;overflow:hidden;min-width:64;background:var(--sn-bg);border:1px solid var(--sn-border);border-left:3px solid var(--sn-bl);box-shadow:var(--sn-shadow)}
.sidenav-item:hover{background:var(--sn-bg-h) !important;border-color:var(--sn-border-h) !important;border-left-color:var(--sn-bl-h) !important;box-shadow:var(--sn-shadow-h) !important}
.sidenav-item .sn-icon-box{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;background:var(--sn-icon-bg);border:1px solid var(--sn-icon-border);box-shadow:var(--sn-icon-shadow)}
.sidenav-item:hover .sn-icon-box{border-color:var(--sn-icon-border-h) !important;box-shadow:var(--sn-icon-shadow-h) !important}
.sidenav-item .sn-label{font-size:11px;font-weight:600;color:rgba(230,247,239,0.85);letter-spacing:0.1em;text-transform:uppercase}
.sidenav-item:hover .sn-label{color:#fff !important;text-shadow:var(--sn-text-glow) !important}
.sidenav-item .sn-sub{font-size:9px;font-weight:400;color:var(--sn-sub-color);letter-spacing:0.15em;text-transform:uppercase}
.sidenav-item:hover .sn-sub{color:var(--sn-accent) !important}
`

export function useInjectCSS() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-codices-combined-css-v1"
        const prev = document.getElementById(id) as HTMLStyleElement | null
        if (prev) {
            prev.textContent = COMBINED_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = COMBINED_CSS
        document.head.appendChild(s)
    }, [])
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  useNodeStatus — membership + purchases (escucha eventos        ║
   ║  rsv-purchases-changed para refrescar tras canjes con cristal)  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

/* Cache por-usuario de los formatos comprados (ownedFormats), para que
   un Tripulante que YA posee un Códice vea "ADQUIRIDO" al instante en la
   primera pintada, sin parpadear "DESBLOQUEAR" mientras resuelve el fetch.
   Mismo patrón anti-flash que el seed de tier de MiNucleo. */
const OWNED_FORMATS_CACHE = "rsv-owned-formats-"
const __currentClerkUserId = (): string => {
    if (typeof window === "undefined") return ""
    try {
        return ((window as any).Clerk?.user?.id as string) || ""
    } catch {
        return ""
    }
}
const readOwnedCache = (uid: string): Map<string, string[]> | null => {
    if (!uid || typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(OWNED_FORMATS_CACHE + uid)
        if (!raw) return null
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return null
        const m = new Map<string, string[]>()
        arr.forEach((pair: any) => {
            if (
                Array.isArray(pair) &&
                typeof pair[0] === "string" &&
                Array.isArray(pair[1])
            )
                m.set(pair[0], pair[1])
        })
        return m
    } catch {
        return null
    }
}
const writeOwnedCache = (uid: string, m: Map<string, string[]>) => {
    if (!uid || typeof window === "undefined") return
    try {
        localStorage.setItem(
            OWNED_FORMATS_CACHE + uid,
            JSON.stringify(Array.from(m.entries()))
        )
    } catch {}
}

/* LOTE F (auditoría 2026-07-27) — la membresía se pide por el gateway
   `user-action`: el clerk id sale del claim `sub` del token firmado y el
   correo se resuelve server-side contra profiles. La vía vieja
   get_my_membership(p_email) era anon-ejecutable → dejaba enumerar si un
   correo cualquiera tenía membresía activa.
   El respaldo por correo es TRANSITORIO hasta el REVOKE (20260727f), que
   viaja cuando 1.1.3 esté LIVE: la app publicada 1.1.2 aún usa la vía vieja
   y quedarse sin membresía le cerraría los muros a quien sí pagó. */
async function coMembershipOf(
    url: string,
    key: string,
    email: string
): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
    }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/user-action`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    token,
                    action: "get_my_membership_by_clerk",
                    params: {},
                }),
            })
            if (g.ok) return await g.json()
        }
    } catch {}
    try {
        const r = await fetch(`${url}/rest/v1/rpc/get_my_membership`, {
            method: "POST",
            headers,
            body: JSON.stringify({ p_email: email }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

export function useNodeStatus(
    supabaseUrl?: string,
    supabaseAnonKey?: string
) {
    const [clerkEmail, setClerkEmail] = useState<string | null>(null)
    const [isMember, setIsMember] = useState(false)
    const [promoCode, setPromoCode] = useState<string | null>(null)
    /* Seed síncrono desde el cache del usuario actual (si lo hay) → un dueño
       que regresa tiene su estado de posesión presente en el PRIMER render. */
    const [ownedFormats, setOwnedFormats] = useState<Map<string, string[]>>(
        () => readOwnedCache(__currentClerkUserId()) ?? new Map()
    )
    /* Había cache para este usuario al montar (sembramos arriba) → la UI puede
       confiar en ownedFormats desde el inicio para distinguir owner vs no-owner
       y nunca mostrar el placeholder de "resolviendo". */
    const [hadSeed] = useState(() => readOwnedCache(__currentClerkUserId()) != null)
    /* false hasta que CUALQUIER camino terminal del fetch resuelve (éxito,
       vacío, error o sin-clerk). Antes de eso, la UI muestra un placeholder
       neutro en vez de "DESBLOQUEAR" cuando no hay cache. */
    const [purchasesResolved, setPurchasesResolved] = useState(false)
    /* refreshTick incrementa al recibir rsv-purchases-changed (lo
       dispara Cristales.tsx tras un canje exitoso). Está en las deps
       del useEffect del fetch → refetch automático sin recarga. */
    const [refreshTick, setRefreshTick] = useState(0)
    useEffect(() => {
        if (typeof window === "undefined") return
        const onChange = () => setRefreshTick((t) => t + 1)
        window.addEventListener("rsv-purchases-changed", onChange)
        return () =>
            window.removeEventListener("rsv-purchases-changed", onChange)
    }, [])
    useEffect(() => {
        if (typeof window === "undefined") return
        const poll = () => {
            try {
                const user = (window as any).Clerk?.user
                const email =
                    user?.primaryEmailAddress?.emailAddress ||
                    user?.emailAddresses?.[0]?.emailAddress ||
                    null
                setClerkEmail((prev) => (prev !== email ? email : prev))
            } catch {
                setClerkEmail(null)
            }
        }
        poll()
        const id = setInterval(poll, 1500)
        return () => clearInterval(id)
    }, [])
    useEffect(() => {
        /* Sin clerk / sin creds = camino terminal: no hay nada que comprar
           pendiente de resolver → marcamos purchasesResolved para que la UI
           no quede atascada en el placeholder neutro. */
        if (!clerkEmail || !supabaseUrl || !supabaseAnonKey) {
            setIsMember(false)
            setPromoCode(null)
            setOwnedFormats(new Map())
            setPurchasesResolved(true)
            return
        }
        /* uid para el cache (las RPC van por email; el cache va por clerk id). */
        const uid = __currentClerkUserId()
        const headers: Record<string, string> = {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
        }
        coMembershipOf(supabaseUrl, supabaseAnonKey, clerkEmail)
            .then((d) => {
                const active = !!d?.active
                setIsMember(active)
                /* 33% OFF en Códices eliminado (2026-06-09): nunca aplicamos
                   promo_code al checkout de Códices (se pagan completos). */
                setPromoCode(null)
            })
            .catch(() => {
                setIsMember(false)
                setPromoCode(null)
            })
        /* commit: actualiza el estado, persiste al cache por-usuario y marca
           resuelto. Llamado en TODOS los caminos terminales del fetch. */
        const commitOwned = (m: Map<string, string[]>) => {
            setOwnedFormats(m)
            if (uid) writeOwnedCache(uid, m)
            setPurchasesResolved(true)
        }
        fetch(`${supabaseUrl}/rest/v1/rpc/get_my_purchases`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ p_email: clerkEmail }),
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(async (purchases) => {
                if (!Array.isArray(purchases) || purchases.length === 0) {
                    commitOwned(new Map())
                    return
                }
                const ids = purchases
                    .map((p: any) => p.book_id)
                    .filter(Boolean)
                if (ids.length === 0) {
                    commitOwned(new Map())
                    return
                }
                const booksRes = await fetch(
                    `${supabaseUrl}/rest/v1/books?id=in.(${ids.join(",")})&select=id,title`,
                    { headers }
                )
                const bks = await booksRes.json()
                const idToTitle = new Map<string, string>()
                if (Array.isArray(bks))
                    bks.forEach((b: any) => {
                        if (b.id && b.title) idToTitle.set(b.id, b.title)
                    })
                const fmtMap = new Map<string, string[]>()
                purchases.forEach((p: any) => {
                    const title = idToTitle.get(p.book_id)
                    if (title && Array.isArray(p.formats_purchased))
                        fmtMap.set(title, p.formats_purchased)
                })
                commitOwned(fmtMap)
            })
            .catch(() => commitOwned(new Map()))
    }, [clerkEmail, supabaseUrl, supabaseAnonKey, refreshTick])
    return {
        isMember,
        promoCode,
        ownedFormats,
        purchasesResolved,
        hasOwnedSeed: hadSeed,
        isLoggedIn: !!clerkEmail,
    }
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DEFAULT EXPORT — ghost component + utilities (Object.assign)   ║
   ╚══════════════════════════════════════════════════════════════════╝ */

function CoSharedRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
CoSharedRoot.displayName = "RSV_Co_Shared"

const CoShared = Object.assign(CoSharedRoot, {
    CristalInterceptContext,
    makeFallbackDataUrl,
    hexToRgba,
    normalizeMultiline,
    pseudoRandom,
    withAccentVar,
    alphaMix,
    readAccentFromCSS,
    readAccentNearest,
    playHoloHover,
    appendPromo,
    useClerkIdentity,
    withCheckoutIdentity,
    checkoutHref,
    useViewportLocal,
    useInjectCSS,
    useNodeStatus,
})

export default CoShared
