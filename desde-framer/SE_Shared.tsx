// SE_Shared.tsx v1.5 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v1.2 — Seguridad Ola B: el chequeo de membresía de Sesiones ya no lee
// `subscriptions` directo; usa la vía segura `get_my_membership`.
// v1.1 — Expone `withCheckoutIdentity(url)`: inyecta `prefilled_email` +
// `client_reference_id` al Payment Link de Stripe leyendo `window.Clerk.user`.
// Reduce typos del Tripulante (no escribe su correo a mano) y le da al
// webhook un Clerk user id para enlazar la suscripción al perfil aunque
// pague con un correo distinto al de su cuenta.
//
// Utilities, hooks y componentes UI compartidos del split de Sesiones (sello SE_).
// Default export = ghost component con Object.assign de todos los exports
// (patrón canónico utility-only para Framer Code Files — el componentLoader
// requiere un default export con body JSX renderable).
//
// Consumidores: SE_Mobile, SE_Desktop, SE_DesktopModals y Sesiones (shell).
// Patrón de import en consumidores:
//   import Shared from "./SE_Shared.tsx"
//   const { hexToRgba, formatText, GoldenButton, useMembershipStatus, withCheckoutIdentity } = Shared

import * as React from "react"
import {
    useMemo,
    useState,
    memo,
    useEffect,
    useRef,
    useLayoutEffect,
} from "react"
import { motion } from "framer-motion"
import type { SlotType } from "./useSolarBooking.tsx"

/* ═══ TYPES ═══ */
type CSSWithVars = React.CSSProperties & {
    [key: `--${string}`]: string | number
}

/* ═══ UTILITIES ═══ */

/* v2.2 Booking Engine — helper para mapear las URLs legacy de Calendly al
   slot_type del motor de reservas nativo. Lógica:
     1. "camara-solar" en la URL → grupal_pulsar.
     2. Match exacto contra calUrl30/45/60 → individual_30/45/60.
     3. Fallback por slug en path "/15min"/"/30min"/"/60min".
     4. Default final → individual_60 (no grupal) para evitar el bug de
        "abrir Cámara Solar desde un botón 1:1". */
function urlToSlotType(
    url: string | null | undefined,
    calUrl30: string,
    calUrl45: string,
    calUrl60: string,
    calUrlGroup: string
): SlotType {
    if (!url) return "individual_60"
    const u = String(url).toLowerCase().trim()
    const norm = (s: string) => String(s || "").toLowerCase().trim()

    if (u === norm(calUrlGroup) || u.includes("camara-solar"))
        return "grupal_pulsar"

    if (u === norm(calUrl30)) return "individual_30"
    if (u === norm(calUrl45)) return "individual_45"
    if (u === norm(calUrl60)) return "individual_60"

    if (/\/15min\b/.test(u)) return "individual_30"
    if (/\/30min\b/.test(u)) return "individual_45"
    if (/\/60min\b/.test(u)) return "individual_60"

    return "individual_60"
}

const formatText = (text: string) => {
    if (!text) return null
    return text.split("\\n").map((str, i, arr) => (
        <React.Fragment key={i}>
            {str.split("\n").map((innerStr, j, innerArr) => (
                <React.Fragment key={`${i}-${j}`}>
                    {innerStr}
                    {j < innerArr.length - 1 && <br />}
                </React.Fragment>
            ))}
            {i < arr.length - 1 && <br />}
        </React.Fragment>
    ))
}

const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    if (isNaN(num)) return `rgba(0,194,255,${a})`
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}

const playHoloHover = () => {
    if (typeof window === "undefined") return
    try {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        if (!AC) return
        const ctx = new AC(),
            osc = ctx.createOscillator(),
            g = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
        g.gain.setValueAtTime(0.015, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    } catch (e) {}
}

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

/* withCheckoutIdentity — Inyecta `prefilled_email` + `client_reference_id`
   al Payment Link de Stripe leyendo `window.Clerk.user`. Esto:
   1. Pre-rellena el campo Email del checkout para que el Tripulante no lo
      escriba a mano (reduce typos y abandono).
   2. Manda el Clerk user id como `client_reference_id`, que viaja al
      webhook `checkout.session.completed` → el webhook puede enlazar la
      nueva suscripción al perfil correcto aunque el Tripulante pague con
      un correo distinto al de su cuenta.
   Stripe Payment Link soporta solo estos 4 params: `prefilled_email`,
   `prefilled_promo_code`, `client_reference_id`, `locale`. */
function withCheckoutIdentity(baseUrl: string): string {
    if (!baseUrl) return ""
    if (typeof window === "undefined") return baseUrl
    try {
        const u = (window as any).Clerk?.user
        if (!u) return baseUrl
        const email =
            u?.primaryEmailAddress?.emailAddress ||
            u?.emailAddresses?.[0]?.emailAddress ||
            ""
        const clerkId = u?.id || ""
        if (!email && !clerkId) return baseUrl
        const sep = baseUrl.includes("?") ? "&" : "?"
        const parts: string[] = []
        if (email) parts.push(`prefilled_email=${encodeURIComponent(email)}`)
        if (clerkId)
            parts.push(`client_reference_id=${encodeURIComponent(clerkId)}`)
        return `${baseUrl}${sep}${parts.join("&")}`
    } catch {
        return baseUrl
    }
}

/* ═══ HOOKS ═══ */

/* Viewport Detection — UA-first */
function useViewportLocal() {
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
        if (/iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua))
            return {
                isMobile: true,
                isTablet: false,
                width: window.innerWidth,
                height: window.innerHeight,
            }
        const mq = typeof window.matchMedia === "function"
        return {
            isMobile: mq
                ? window.matchMedia("(max-width: 768px)").matches
                : window.innerWidth <= 768,
            isTablet: mq
                ? window.matchMedia("(max-width: 1024px)").matches
                : window.innerWidth <= 1024,
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
        const mqlM =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(max-width: 768px)")
                : null
        let raf: number
        const up = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() =>
                setVp((p) => {
                    const n = getVp()
                    return p.isMobile === n.isMobile && p.width === n.width
                        ? p
                        : n
                })
            )
        }
        window.addEventListener("resize", up)
        mqlM?.addEventListener?.("change", up)
        return () => {
            window.removeEventListener("resize", up)
            mqlM?.removeEventListener?.("change", up)
            cancelAnimationFrame(raf)
        }
    }, [])
    return vp
}

/* CSS — inyectado una sola vez al document.head */
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.membrana-scroll-container::-webkit-scrollbar{display:none}
.membrana-scroll-container{scrollbar-width:none;overflow-y:auto;overflow-x:hidden;height:100vh;width:100%;position:relative;z-index:2;scroll-behavior:smooth;overscroll-behavior:none;-ms-overflow-style:none}
html:has(.membrana-scroll-container),html:has(.membrana-scroll-container) body{scrollbar-width:none;-ms-overflow-style:none;overflow:hidden}
html:has(.membrana-scroll-container)::-webkit-scrollbar,html:has(.membrana-scroll-container) body::-webkit-scrollbar{display:none}
.m-scroll::-webkit-scrollbar{display:none}
.m-scroll{scrollbar-width:none;overflow-y:auto;overflow-x:hidden;height:100vh;height:100dvh;width:100%;position:relative;z-index:2;scroll-behavior:smooth;overscroll-behavior:none}
.exact-holo-title{font-family:'Inter',sans-serif;font-weight:100;letter-spacing:0.4em;margin-right:-0.4em;line-height:1;margin:0;text-transform:uppercase;text-align:center;width:100%;display:block;user-select:none;margin-bottom:80px;color:var(--holo-title-color);text-shadow:0 0 10px var(--holo-primary),0 0 25px var(--holo-glow);animation:sf-breath 7s ease-in-out infinite}
@keyframes sf-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
@keyframes holo-shimmer{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
@keyframes holo-scan{0%{top:-30%}100%{top:130%}}
.nucleo-stars-container{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;perspective:400px;background:radial-gradient(circle at center,rgba(0,0,0,0) 0%,rgba(0,0,0,0.6) 100%);transform:translateZ(0);contain:layout style paint}
.nucleo-star{position:absolute;left:50%;top:50%;width:var(--sz);height:var(--sz);border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.6);animation:nuc-fly var(--du) linear infinite;animation-delay:var(--dl);opacity:0;will-change:transform,opacity;transform:translateZ(0);backface-visibility:hidden}
@keyframes nuc-fly{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
.faq-modal-close{transition:transform .2s ease-out,box-shadow .2s ease-out,background .15s ease-out,color .15s ease-out,border-color .15s ease-out}
.faq-modal-close:hover{transform:rotate(90deg) scale(1.15)!important;box-shadow:var(--close-glow)!important;background:var(--close-bg-hover)!important;border-color:currentColor!important;color:var(--bt-color,#00C2FF)!important}
.faq-modal-close:active{transform:rotate(90deg) scale(0.95)!important}
.faq-answer-grid{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .35s ease-out,opacity .25s ease-out}
.faq-answer-grid.faq-open{grid-template-rows:1fr;opacity:1}
.faq-answer-inner{overflow:hidden;min-height:0}
.calendly-inline-widget,.calendly-inline-widget iframe{width:100%!important;height:100%!important;min-height:100%!important}
`

function useInjectCSS() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-servicios-css"
        if (document.getElementById(id)) return
        const s = document.createElement("style")
        s.id = id
        s.textContent = SHARED_CSS
        document.head.appendChild(s)
    }, [])
}

function useCalendlyScript() {
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "calendly-widget-js"
        if (document.getElementById(id)) return
        const s = document.createElement("script")
        s.id = id
        s.src = "https://assets.calendly.com/assets/external/widget.js"
        s.async = true
        document.body.appendChild(s)
    }, [])
}

const buildCalendlyUrl = (input: string, accent: string) => {
    const cleanUrl = (raw: string) => {
        if (!raw) return ""
        const t = raw.trim()
        if (t.startsWith("http")) return t
        const m = t.match(/data-url="([^"]+)"/)
        if (m?.[1]) return m[1]
        return t
    }
    const base = cleanUrl(input)
    if (!base) return ""
    const sa = (accent || "#00C2FF").replace("#", "")
    const sep = base.includes("?") ? "&" : "?"
    return `${base}${sep}background_color=080C14&text_color=ffffff&primary_color=${sa}`
}

/* ── Membership Status Hook ── */
/* LOTE F (auditoría 2026-07-27) — la membresía se pide por el gateway
   `user-action`: el clerk id sale del claim `sub` del token firmado y el
   correo se resuelve server-side contra profiles. La vía vieja
   get_my_membership(p_email) era anon-ejecutable → dejaba enumerar si un
   correo cualquiera tenía membresía activa.
   El respaldo por correo es TRANSITORIO hasta el REVOKE (20260727f), que
   viaja cuando 1.1.3 esté LIVE: la app publicada 1.1.2 aún usa la vía vieja
   y quedarse sin membresía le cerraría los muros a quien sí pagó. */
async function seMembershipOf(
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

const useMembershipStatus = (
    supabaseUrl?: string,
    supabaseAnonKey?: string
): boolean => {
    const [isActive, setIsActive] = useState(false)
    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        let cancelled = false
        let attempts = 0
        const check = async (email: string) => {
            try {
                const data = await seMembershipOf(
                    supabaseUrl,
                    supabaseAnonKey,
                    email
                )
                if (!data) return
                if (!cancelled && data?.active) setIsActive(true)
            } catch {}
        }
        const poll = () => {
            const user = (window as any).Clerk?.user
            if (user) {
                const email =
                    user.primaryEmailAddress?.emailAddress ||
                    user.emailAddresses?.[0]?.emailAddress
                if (email) check(email)
            } else if (attempts < 40) {
                attempts++
                setTimeout(poll, 400)
            }
        }
        poll()
        return () => {
            cancelled = true
        }
    }, [supabaseUrl, supabaseAnonKey])
    useEffect(() => {
        if (!isActive) return
        const iv = setInterval(() => {
            const user = (window as any).Clerk?.user
            if (!user) setIsActive(false)
        }, 1500)
        return () => clearInterval(iv)
    }, [isActive])
    return isActive
}

/* ═══ SHARED COMPONENTS ═══ */

const CloseButton = ({
    onClick,
    style,
}: {
    onClick: () => void
    style?: any
}) => (
    <motion.button
        onClick={onClick}
        initial={{ rotate: 0 }}
        whileHover={{
            rotate: 90,
            scale: 1.15,
            backgroundColor: "rgba(255,255,255,0.2)",
            boxShadow: "0 0 20px rgba(0,194,255,0.5)",
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 50,
            backdropFilter: "blur(4px)",
            ...style,
        }}
    >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    </motion.button>
)

const GoldenButton = ({
    text,
    onClick,
    style,
    subtle,
    pulse,
}: {
    text: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
    subtle?: boolean
    pulse?: boolean
}) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        animate={
            pulse
                ? {
                      boxShadow: [
                          "0 0 10px rgba(212,168,67,0.22), inset 0 1px 0 rgba(255,255,255,0.3)",
                          "0 0 26px rgba(212,168,67,0.7), 0 0 54px rgba(212,168,67,0.32), inset 0 1px 0 rgba(255,255,255,0.45)",
                          "0 0 10px rgba(212,168,67,0.22), inset 0 1px 0 rgba(255,255,255,0.3)",
                      ],
                  }
                : undefined
        }
        transition={
            pulse
                ? { duration: 1.7, repeat: Infinity, ease: "easeInOut" }
                : undefined
        }
        style={{
            background:
                "linear-gradient(135deg, #B8902F 0%, #D4A843 30%, #F5D98C 50%, #D4A843 70%, #B8902F 100%)",
            border: subtle
                ? "1px solid rgba(212,168,67,0.4)"
                : "1px solid rgba(212,168,67,0.6)",
            borderRadius: 50,
            padding: "16px 36px",
            color: "#0B0C13",
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            boxShadow: subtle
                ? "0 0 8px rgba(212,168,67,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                : "0 0 10px rgba(212,168,67,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
            whiteSpace: "nowrap" as const,
            width: "100%",
            transition:
                "box-shadow 0.12s ease, filter 0.12s ease, transform 0.12s ease",
            ...style,
        }}
        onMouseEnter={
            pulse
                ? undefined
                : (e: any) => {
                      e.currentTarget.style.boxShadow =
                          "0 0 18px rgba(212,168,67,0.4), 0 0 35px rgba(212,168,67,0.15), inset 0 1px 0 rgba(255,255,255,0.3)"
                      e.currentTarget.style.filter = "brightness(1.1)"
                      e.currentTarget.style.transform = "scale(1.03)"
                  }
        }
        onMouseLeave={
            pulse
                ? undefined
                : (e: any) => {
                      e.currentTarget.style.boxShadow =
                          "0 0 10px rgba(212,168,67,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
                      e.currentTarget.style.filter = "brightness(1)"
                      e.currentTarget.style.transform = "scale(1)"
                  }
        }
    >
        {text}
    </motion.button>
)

const LugaresDisponibles = ({
    count,
    accent,
    compact,
}: {
    count: number
    accent: string
    compact?: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: compact ? 8 : 10,
            marginTop: compact ? 8 : 14,
            padding: compact ? "6px 16px" : "8px 22px",
            borderRadius: 50,
            border: `1px solid ${hexToRgba(accent, 0.35)}`,
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.08)}, transparent)`,
            boxShadow: `0 0 12px ${hexToRgba(accent, 0.15)}`,
        }}
    >
        <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 8px ${accent}`,
            }}
        />
        <span
            style={{
                fontSize: compact ? 11 : 13,
                fontWeight: 500,
                letterSpacing: "0.12em",
                color: accent,
                textTransform: "uppercase",
                textShadow: `0 0 8px ${hexToRgba(accent, 0.4)}`,
            }}
        >
            Lugares Disponibles
        </span>
    </motion.div>
)

/* ── CalendlyEmbed (compartido desktop + mobile fallback legacy) ── */
const CalendlyEmbed = ({
    url,
    accent,
    maskBottomPx,
    hideLoading,
}: {
    url: string
    accent: string
    maskBottomPx: number
    hideLoading?: boolean
}) => {
    useCalendlyScript()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [loading, setLoading] = useState(true)
    const finalUrl = useMemo(() => buildCalendlyUrl(url, accent), [url, accent])
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        el.innerHTML = ""
        setLoading(true)
        let c = false
        const tryInit = (a: number) => {
            if (c) return
            const C = (window as any)?.Calendly
            if (finalUrl && C?.initInlineWidget) {
                try {
                    el.innerHTML = ""
                    C.initInlineWidget({ url: finalUrl, parentElement: el })
                    setTimeout(() => setLoading(false), 1500)
                    return
                } catch {}
            }
            if (a < 24) {
                setTimeout(() => tryInit(a + 1), 150)
                return
            }
            if (!finalUrl) return
            const f = document.createElement("iframe")
            f.src = finalUrl
            f.width = "100%"
            f.height = "100%"
            f.style.border = "0"
            f.onload = () => setTimeout(() => setLoading(false), 800)
            el.appendChild(f)
        }
        tryInit(0)
        return () => {
            c = true
            if (el) el.innerHTML = ""
        }
    }, [finalUrl])
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {!hideLoading && loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        background: "rgba(8,14,28,0.95)",
                    }}
                >
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{ width: 48, height: 48, opacity: 0.7 }}
                    >
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            fill="none"
                        >
                            <circle
                                cx="24"
                                cy="8"
                                r="3"
                                fill={accent}
                                opacity="0.3"
                            />
                            <circle
                                cx="24"
                                cy="40"
                                r="3"
                                fill={accent}
                                opacity="0.3"
                            />
                            <circle
                                cx="8"
                                cy="24"
                                r="3"
                                fill={accent}
                                opacity="0.3"
                            />
                            <circle
                                cx="40"
                                cy="24"
                                r="3"
                                fill={accent}
                                opacity="0.3"
                            />
                            <path
                                d="M24 4 A20 20 0 0 1 44 24"
                                stroke={accent}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </motion.div>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            fontSize: 14,
                            fontWeight: 300,
                            color: accent,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                        }}
                    >
                        Sintonizando...
                    </motion.span>
                </div>
            )}
            <div
                ref={containerRef}
                style={{ width: "100%", height: "100%", minHeight: 650 }}
            />
            {maskBottomPx > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: maskBottomPx,
                        background:
                            "linear-gradient(180deg, rgba(8,12,20,0) 0%, rgba(8,14,28,1) 100%)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

/* ── Schedule Info ── */
const ScheduleInfo = ({ accent }: { accent: string }) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [localTime, setLocalTime] = useState("")
    useEffect(() => {
        try {
            const d = new Date()
            d.setUTCHours(17, 30, 0, 0)
            const f = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            setLocalTime(
                f
                    .formatToParts(d)
                    .filter((p) =>
                        ["hour", "minute", "literal", "dayPeriod"].includes(
                            p.type
                        )
                    )
                    .map((p) => p.value)
                    .join("")
            )
        } catch {
            setLocalTime("")
        }
    }, [])
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontSize: 13,
                        color: "rgba(230,247,239,0.6)",
                        letterSpacing: "0.1em",
                        fontWeight: 300,
                    }}
                >
                    12:30 pm (UTC-5)
                </span>
                {localTime && (
                    <>
                        <span style={{ color: A(0.3), fontSize: 11 }}>|</span>
                        <span
                            style={{
                                fontSize: 13,
                                color: accent,
                                letterSpacing: "0.06em",
                                fontWeight: 400,
                                opacity: 0.8,
                            }}
                        >
                            Tu hora local: {localTime}
                        </span>
                    </>
                )}
            </div>
        </motion.div>
    )
}

const PassScheduleInfo = ({ accent }: { accent: string }) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [localTime, setLocalTime] = useState("")
    useEffect(() => {
        try {
            const d = new Date()
            d.setUTCHours(17, 30, 0, 0)
            const f = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            setLocalTime(
                f
                    .formatToParts(d)
                    .filter((p) =>
                        ["hour", "minute", "literal", "dayPeriod"].includes(
                            p.type
                        )
                    )
                    .map((p) => p.value)
                    .join("")
            )
        } catch {
            setLocalTime("")
        }
    }, [])
    return (
        <div
            style={{
                marginTop: 16,
                marginBottom: 16,
                padding: "12px 18px",
                borderRadius: 12,
                border: `1px solid ${A(0.2)}`,
                background: `linear-gradient(135deg, ${A(0.06)}, ${A(0.02)})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
            }}
        >
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    color: "rgba(230,247,239,0.6)",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                }}
            >
                MARTES 12:30PM (UTC-5)
            </span>
            {localTime && (
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: accent,
                        letterSpacing: "0.06em",
                        textShadow: `0 0 8px ${A(0.4)}`,
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                        textAlign: "center",
                    }}
                >
                    TU HORA LOCAL: {localTime.toUpperCase()}
                </span>
            )}
        </div>
    )
}

/* ── Next Session Countdown ── */
const NextSessionCountdown = ({
    accent,
    compact,
}: {
    accent: string
    compact?: boolean
}) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [timeLeft, setTimeLeft] = useState<{
        d: number
        h: number
        m: number
    } | null>(null)
    useEffect(() => {
        const getNext = () => {
            const now = new Date(),
                utcDay = now.getUTCDay(),
                utcH = now.getUTCHours(),
                utcM = now.getUTCMinutes()
            let daysUntil = (2 - utcDay + 7) % 7
            if (daysUntil === 0 && (utcH > 17 || (utcH === 17 && utcM >= 30)))
                daysUntil = 7
            const target = new Date(now)
            target.setUTCDate(now.getUTCDate() + daysUntil)
            target.setUTCHours(17, 30, 0, 0)
            const diff = target.getTime() - now.getTime()
            if (diff <= 0) return null
            const totalMin = Math.floor(diff / 60000)
            return {
                d: Math.floor(totalMin / 1440),
                h: Math.floor((totalMin % 1440) / 60),
                m: totalMin % 60,
            }
        }
        setTimeLeft(getNext())
        const iv = setInterval(() => setTimeLeft(getNext()), 30000)
        return () => clearInterval(iv)
    }, [])
    if (!timeLeft) return null
    const pad = (n: number) => String(n).padStart(2, "0")
    const { d, h, m } = timeLeft
    const fontSize = compact ? 22 : 28
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: compact ? 6 : 8,
                marginTop: 20,
                width: "100%",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                    }}
                />
                <span
                    style={{
                        fontSize: compact ? 11 : 10,
                        fontWeight: 500,
                        letterSpacing: "0.2em",
                        color: A(0.6),
                        textTransform: "uppercase",
                    }}
                >
                    PRÓXIMA SINTONIZACIÓN
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                {d > 0 && (
                    <>
                        <span
                            style={{
                                fontSize,
                                fontWeight: 300,
                                color: accent,
                                letterSpacing: "0.05em",
                                textShadow: `0 0 12px ${A(0.3)}`,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {pad(d)}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                color: A(0.5),
                                fontWeight: 400,
                                letterSpacing: "0.05em",
                                marginRight: 6,
                            }}
                        >
                            d
                        </span>
                        <span
                            style={{
                                fontSize: fontSize - 6,
                                color: A(0.3),
                                fontWeight: 200,
                            }}
                        >
                            :
                        </span>
                    </>
                )}
                {(d > 0 || h > 0) && (
                    <>
                        <span
                            style={{
                                fontSize,
                                fontWeight: 300,
                                color: accent,
                                letterSpacing: "0.05em",
                                textShadow: `0 0 12px ${A(0.3)}`,
                                fontFamily: "'Inter', sans-serif",
                                marginLeft: d > 0 ? 6 : 0,
                            }}
                        >
                            {pad(h)}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                color: A(0.5),
                                fontWeight: 400,
                                letterSpacing: "0.05em",
                                marginRight: 6,
                            }}
                        >
                            h
                        </span>
                        <span
                            style={{
                                fontSize: fontSize - 6,
                                color: A(0.3),
                                fontWeight: 200,
                            }}
                        >
                            :
                        </span>
                    </>
                )}
                <span
                    style={{
                        fontSize,
                        fontWeight: 300,
                        color: accent,
                        letterSpacing: "0.05em",
                        textShadow: `0 0 12px ${A(0.3)}`,
                        fontFamily: "'Inter', sans-serif",
                        marginLeft: d > 0 || h > 0 ? 6 : 0,
                    }}
                >
                    {pad(m)}
                </span>
                <span
                    style={{
                        fontSize: 11,
                        color: A(0.5),
                        fontWeight: 400,
                        letterSpacing: "0.05em",
                    }}
                >
                    m
                </span>
            </div>
        </motion.div>
    )
}

/* ── Stars Backgrounds ── */
const DesktopStarsBackground = React.memo(
    ({
        num = 90,
        speed = 1,
        bgColor = "#0B0C13",
    }: {
        num?: number
        speed?: number
        starSize?: number
        bgColor?: string
    }) => {
        const stars = useMemo(() => {
            const a: any[] = []
            for (let i = 0; i < Math.floor(num * 1.5); i++)
                a.push({
                    id: i,
                    sz:
                        Math.random() > 0.8
                            ? Math.random() * 2 + 1
                            : Math.random() * 1.5 + 0.5,
                    tx: (Math.random() - 0.5) * 250,
                    ty: (Math.random() - 0.5) * 250,
                    du: (1.5 + Math.random() * 4) / speed,
                    dl: Math.random() * 5,
                })
            return a
        }, [num, speed])
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
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: "none",
                        background:
                            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.75) 100%)",
                    }}
                />
                <div
                    className="nucleo-stars-container"
                    style={{ position: "fixed", zIndex: 1 }}
                >
                    {stars.map((s) => {
                        const st: CSSWithVars = {
                            "--sz": `${s.sz}px`,
                            "--tx": `${s.tx}vw`,
                            "--ty": `${s.ty}vh`,
                            "--du": `${s.du}s`,
                            "--dl": `${s.dl}s`,
                        }
                        return (
                            <div
                                key={s.id}
                                className="nucleo-star"
                                style={st}
                            />
                        )
                    })}
                </div>
            </>
        )
    }
)

const MobileStarsBackground = memo(
    ({ num = 90, speed = 1, bgColor = "#0B0C13" }: any) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [activated, setActivated] = useState(false)
        const stars = useMemo(() => {
            const arr: any[] = []
            const count = Math.floor(num * 1.5)
            for (let i = 0; i < count; i++)
                arr.push({
                    id: i,
                    sz:
                        pseudoRandom(i) > 0.8
                            ? pseudoRandom(i + 1000) * 2 + 1
                            : pseudoRandom(i + 1000) * 1.5 + 0.5,
                    tx: `${((pseudoRandom(i + 2000) - 0.5) * 250).toFixed(0)}vw`,
                    ty: `${((pseudoRandom(i + 3000) - 0.5) * 250).toFixed(0)}vh`,
                    d: `${((1.5 + pseudoRandom(i + 4000) * 4) / speed).toFixed(2)}s`,
                    dl: `${(pseudoRandom(i + 5000) * 5).toFixed(2)}s`,
                })
            return arr
        }, [num, speed])
        useEffect(() => {
            let done = false
            const activate = () => {
                if (done) return
                done = true
                setActivated(true)
            }
            requestAnimationFrame(() => requestAnimationFrame(activate))
            const t = setTimeout(activate, 250)
            return () => {
                done = true
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
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: "none",
                        background: "transparent",
                    }}
                />
                <div className="sf-stars-container" ref={containerRef}>
                    {stars.map((s) => (
                        <div
                            key={s.id}
                            className={`sf-star${activated ? " sf-active" : ""}`}
                            style={
                                {
                                    width: s.sz,
                                    height: s.sz,
                                    ["--tx" as any]: s.tx,
                                    ["--ty" as any]: s.ty,
                                    ["--d" as any]: s.d,
                                    ["--dl" as any]: s.dl,
                                } as any
                            }
                        />
                    ))}
                </div>
            </>
        )
    }
)

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══
   Ghost component con body JSX + Object.assign de todos los exports. */
function SE_SharedShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
SE_SharedShell.displayName = "SE_Shared"

const Shared = Object.assign(SE_SharedShell, {
    // Utilities
    urlToSlotType,
    formatText,
    hexToRgba,
    playHoloHover,
    pseudoRandom,
    withCheckoutIdentity,
    SHARED_CSS,
    // Hooks
    useViewportLocal,
    useInjectCSS,
    useCalendlyScript,
    buildCalendlyUrl,
    useMembershipStatus,
    // Componentes UI
    CloseButton,
    GoldenButton,
    LugaresDisponibles,
    CalendlyEmbed,
    ScheduleInfo,
    PassScheduleInfo,
    NextSessionCountdown,
    DesktopStarsBackground,
    MobileStarsBackground,
})

export default Shared
