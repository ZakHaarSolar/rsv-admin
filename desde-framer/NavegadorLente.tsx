// Red Solar Viva — NavegadorLente.tsx v13.13 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v13.10
// v13.10 (2026-06-07) — admin self-check vía edge `me` (token verificado); fallback transitorio al oráculo.
// v13.9 — Nav calls + checks de auth migrados al path canónico
// /escaner/nucleo (Domo v4.55). El check "url === /nucleo" en
// press-and-drag acepta también el canónico para no romper el flow
// de login al aterrizar en Mi Núcleo. Defaults del property control
// ajustados a los nuevos paths anidados bajo /escaner.
// v13.8 — data-rsv-mobile-nav="bar" sobre el wrapper del bar superior para que otras capas puedan ocultarlo via CSS global. Hooks específicos: HologramaDeExpansion setea body[data-rsv-holo-node-open] cuando hay un nodo seleccionado y esconde el bar para que la hamburguesa no compita visualmente con el botón × del panel del nodo. v13.7 minimal en motor-intervencion + holograma. v13.6 /radar fuera del minimal.
// Renombrado desde MobileNavigation.tsx — semántica solar coherente: este es
// el Navegador del Lente (mobile). Su gemelo en desktop es NavegadorEstacion.tsx.
// Contenido funcional idéntico al MobileNavigation v12.19.
import * as React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"
import { useAuthModalState } from "./AuthOverrides.tsx"

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
const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

const OverlayParticles = ({ accent }: { accent: string }) => {
    const A = (x: number) => hexToRgba(accent, x)
    const stars = useMemo(
        () =>
            Array.from({ length: 18 }).map((_, i) => ({
                x: pseudoRandom(i * 11 + 1) * 100,
                y: pseudoRandom(i * 11 + 2) * 100,
                size: 2 + pseudoRandom(i * 11 + 3) * 2,
                dur: 6 + pseudoRandom(i * 11 + 4) * 8,
                delay: pseudoRandom(i * 11 + 5) * 5,
            })),
        []
    )
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            {stars.map((s, i) => {
                const g = s.size * 5
                return (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0, 0.6, 0] }}
                        transition={{
                            duration: s.dur,
                            delay: s.delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            width: g,
                            height: g,
                            marginLeft: -g / 2,
                            marginTop: -g / 2,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) ${Math.round((s.size / g) * 50)}%, ${A(0.3)} ${Math.round((s.size / g) * 120)}%, transparent 70%)`,
                        }}
                    />
                )
            })}
        </div>
    )
}
const CornerBracket = ({ position, accent, delay }: any) => {
    const A = (x: number) => hexToRgba(accent, x)
    const b: React.CSSProperties = {
        position: "absolute",
        width: 20,
        height: 20,
        pointerEvents: "none",
    }
    const c: Record<string, React.CSSProperties> = {
        tl: {
            top: 14,
            left: 14,
            borderTop: `1px solid ${A(0.2)}`,
            borderLeft: `1px solid ${A(0.2)}`,
        },
        tr: {
            top: 14,
            right: 14,
            borderTop: `1px solid ${A(0.2)}`,
            borderRight: `1px solid ${A(0.2)}`,
        },
        bl: {
            bottom: 14,
            left: 14,
            borderBottom: `1px solid ${A(0.2)}`,
            borderLeft: `1px solid ${A(0.2)}`,
        },
        br: {
            bottom: 14,
            right: 14,
            borderBottom: `1px solid ${A(0.2)}`,
            borderRight: `1px solid ${A(0.2)}`,
        },
    }
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.25, 0.55, 0.25], scale: 1 }}
            transition={{
                opacity: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay + 0.3,
                },
                scale: { duration: 0.5, delay },
            }}
            style={{ ...b, ...c[position] }}
        />
    )
}

/* ICONS */
const IconLogin = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
)
const IconCodices = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" opacity="0.5" />
    </svg>
)
const IconSessions = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
)
const IconLogout = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
)
/* Admin panel icons (used in the icon row) */
const AIconEscaner = () => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" opacity="0.5" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
)
const AIconMotor = () => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)
const AIconTelemetria = () => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
    </svg>
)
const AIconHolograma = () => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <line x1="12" y1="22" x2="12" y2="15.5" />
        <polyline points="22 8.5 12 15.5 2 8.5" />
        <polyline points="2 15.5 12 8.5 22 15.5" opacity="0.4" />
        <line x1="12" y1="2" x2="12" y2="8.5" />
    </svg>
)
const AIconObservatorio = () => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="3" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="21" />
        <line x1="3" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
)

const ULink = ({
    icon,
    label,
    color = "#fff",
    glow,
    active,
    onClick,
    variants,
}: any) => (
    <motion.div
        variants={variants}
        onClick={(e: any) => {
            e.stopPropagation()
            if (!active) onClick?.()
        }}
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "14px 0",
            cursor: active ? "default" : "pointer",
            whiteSpace: "nowrap",
        }}
    >
        {/* v12.1 — icon ahora vive INLINE con gap para que el centrado
           considere el bloque completo (icono + texto), no solo el texto.
           El bullet de "active" sigue siendo absolute para no empujar nada. */}
        <span
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: icon ? 10 : 0,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: active ? "#D4A843" : color,
                textShadow: active
                    ? "0 0 16px rgba(212,168,67,0.5), 0 0 32px rgba(212,168,67,0.2)"
                    : glow
                      ? `0 0 12px ${glow}`
                      : "none",
            }}
        >
            {active && (
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                        boxShadow: [
                            "0 0 4px #D4A843",
                            "0 0 12px #D4A843",
                            "0 0 4px #D4A843",
                        ],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        right: "calc(100% + 10px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#D4A843",
                    }}
                />
            )}
            {icon && (
                <span
                    style={{
                        opacity: 0.85,
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </span>
            )}
            <span>{label}</span>
        </span>
    </motion.div>
)
const ThinSep = ({ color = "rgba(0,194,255,0.12)" }: { color?: string }) => (
    <div
        style={{
            width: "45%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            margin: "4px 0",
            alignSelf: "center",
        }}
    />
)

/* CLERK */
function nukeClerkLocal() {
    try {
        const ks: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk") ||
                    k === "nuc_user_cache")
            )
                ks.push(k)
        }
        ks.forEach((k) => localStorage.removeItem(k))
    } catch {}
    try {
        const ks: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk") ||
                    k === "nuc_signout")
            )
                ks.push(k)
        }
        ks.forEach((k) => sessionStorage.removeItem(k))
    } catch {}
    try {
        const h = window.location.hostname
        const ds = [h, `.${h}`]
        const p = h.split(".")
        if (p.length > 2) ds.push(`.${p.slice(-2).join(".")}`)
        document.cookie.split(";").forEach((c) => {
            const n = c.trim().split("=")[0]
            if (
                n &&
                (n.startsWith("__clerk") ||
                    n.startsWith("__session") ||
                    n.startsWith("__client"))
            ) {
                ds.forEach((d) => {
                    document.cookie = `${n}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${d}`
                })
                document.cookie = `${n}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            }
        })
    } catch {}
    try {
        const g = (window as any).Clerk
        if (g) {
            g.user = null
            g.session = null
        }
    } catch {}
}
// Perfil propio verificado vía edge `me` (clerk_user_id del token firmado).
async function fetchMe(url: string, key: string) {
    if (!url || !key) return null
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}
function useIsAdmin(url: string, key: string, uid: string | null): boolean {
    const [a, sA] = useState(false)
    const r = useRef<string | null>(null)
    useEffect(() => {
        if (!url || !key || !uid) {
            sA(false)
            r.current = null
            return
        }
        if (r.current === uid) return
        r.current = uid
        ;(async () => {
            try {
                // Perfil propio verificado por el edge `me` (id del token
                // firmado). El respaldo al oráculo get_profile_by_clerk_id
                // murió con su REVOKE (auditoría Lote F, 20260727e).
                const p = await fetchMe(url, key)
                sA(p?.is_admin === true)
            } catch {
                sA(false)
            }
        })()
    }, [url, key, uid])
    return a
}
function useClerkUser() {
    const [u, sU] = useState<any>(null)
    const [so, sSO] = useState(false)
    useEffect(() => {
        const p = () => {
            if (so) return
            const x = (window as any).Clerk?.user ?? null
            sU((prev: any) => (prev?.id === x?.id ? prev : x))
        }
        p()
        const id = setInterval(p, 1200)
        const h = () => {
            sSO(false)
            p()
        }
        window.addEventListener("rsv-auth-changed", h)
        return () => {
            clearInterval(id)
            window.removeEventListener("rsv-auth-changed", h)
        }
    }, [so])
    const signOut = useCallback(async () => {
        sSO(true)
        sU(null)
        try {
            const g = (window as any).Clerk
            if (g?.session?.end) await g.session.end()
            else if (g?.session?.remove) await g.session.remove()
        } catch {}
        nukeClerkLocal()
        sSO(false)
        window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
    }, [])
    return { user: u, signOut, signingOut: so }
}

const AC = "#C77DFF"
const AD = "rgba(199,125,255,"
const BC = "#F0A030"
const BD = "rgba(240,160,48,"

/* ═══ ADMIN ICON BUTTON ═══ */
/* v12.19 — Labels eliminados: sólo el icono vector vive ahora. Reduce
   ruido visual y deja respirar la fila admin (Escáner / Motor /
   Telemetría / Holograma). El `aria-label` mantiene accesibilidad. */
const AdminIconBtn = ({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    onClick: () => void
}) => (
    <button
        onClick={(e) => {
            e.stopPropagation()
            onClick()
        }}
        aria-label={label}
        title={label}
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            outline: "none",
            padding: 0,
        }}
    >
        <div
            style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                border: `1px solid ${AD}0.35)`,
                background: `linear-gradient(135deg, ${AD}0.08), transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: AC,
                boxShadow: `0 0 12px ${AD}0.1)`,
                transition: "all 0.2s ease",
            }}
        >
            {icon}
        </div>
    </button>
)

/* ════════════════════════════════════════════════════════════════════ */

export function NavegadorLente(props: any) {
    const {
        logoImage,
        logoHeight,
        splitTextLeft,
        splitTextRight,
        brandOffsetX,
        accentColor,
        links,
        activeLinkIndex,
        barHeight,
        supabaseUrl = "",
        supabaseAnonKey = "",
    } = props
    const accent = accentColor || "#00C2FF"
    const A = (x: number) => hexToRgba(accent, x)
    const G = (x: number) => hexToRgba("#D4A843", x)

    const [isOpen, setIsOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const forceClose = false
    /* v12.7 — Press-and-drag menu gesture.
       Flow:
       - Long press 300ms sobre la hamburguesa → abre menú + modo drag.
       - Con el dedo sin soltar, arrastra sobre opciones (ULink + INGRESAR).
         Cada opción se ilumina (scale 1.05 + glow cian) a medida que el
         dedo pasa sobre ella. Haptic feedback en cada highlight nuevo.
       - Al soltar sobre una opción: navega + cierra menú.
       - Al soltar fuera: cierra menú sin navegar.
       El tap corto (<300ms) mantiene el comportamiento clásico: abre el
       menú estándar sin modo drag. */
    const [longPressActive, setLongPressActive] = useState(false)
    const [highlightedUrl, setHighlightedUrl] = useState<string | null>(null)
    /* v12.15 — Estado de confirmación dorada para press-and-drag.
       Cuando el tripulante suelta el dedo sobre un link, ese link
       FLASHEA dorado por ~280ms como sensación de "destino confirmado",
       el highlight cyan se apaga, y luego se ejecuta nav/auth + cierre. */
    const [confirmingUrl, setConfirmingUrl] = useState<string | null>(null)
    const longPressTimerRef = useRef<number | null>(null)
    const suppressClickRef = useRef<number>(0)
    /* v12.0 — Minimal bar on /escaner, /origen, / and /home: hide
       brand block, keep only hamburger.
       v12.8 — regex ampliada: /escaner (donde ahora vive el Escáner
       Vibracional) triggerea el modo minimal.
       v13.5 — /radar (Portal de Inducción del Escáner Vibracional) ya
       NO aplica al modo minimal: ahora es una landing educativa y el
       tripulante necesita ver la barra completa con todos los accesos
       del Centro de Mando.
       v13.7 — /motor-intervencion y /holograma se SUMAN al modo
       minimal: son capas admin inmersivas que ya tienen su propio
       título/header dentro del componente — duplicar la marca "RED
       SOLAR VIVA" arriba se encimaba con el título del componente
       y robaba aire. La hamburguesa se mantiene para poder saltar
       a otras capas. La variable isRadarRoute se mantiene por
       compatibilidad histórica; semánticamente representa "ruta con
       bar minimalista". */
    const [isRadarRoute, setIsRadarRoute] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        let lastPath = ""
        const check = () => {
            const p = window.location.pathname + window.location.hash
            if (p === lastPath) return
            lastPath = p
            const pathOnly = window.location.pathname
            const match =
                /\/(escaner|origen|motor-intervencion|holograma|atelier|frecuencias)(\/|$|#)/i.test(p) ||
                pathOnly === "/" ||
                pathOnly === "/home"
            setIsRadarRoute(match)
        }
        check()
        window.addEventListener("popstate", check)
        window.addEventListener("hashchange", check)
        const origPush = window.history.pushState
        const origReplace = window.history.replaceState
        window.history.pushState = function (...args: any[]) {
            const r = origPush.apply(this, args as any)
            check()
            return r
        }
        window.history.replaceState = function (...args: any[]) {
            const r = origReplace.apply(this, args as any)
            check()
            return r
        }
        /* Polling fallback — 400ms is invisible to users, covers Framer custom routing */
        const id = setInterval(check, 400)
        return () => {
            clearInterval(id)
            window.removeEventListener("popstate", check)
            window.removeEventListener("hashchange", check)
            window.history.pushState = origPush
            window.history.replaceState = origReplace
        }
    }, [])
    const [adminOpen, setAdminOpen] = useState(false)
    const { user: cu, signOut, signingOut } = useClerkUser()
    const isLoggedIn = !!cu && !signingOut
    const isAdmin = useIsAdmin(supabaseUrl, supabaseAnonKey, cu?.id || null)
    const modalState = useAuthModalState()

    const dName = cu?.fullName || cu?.firstName || "Viajero Solar"
    const dEmail =
        cu?.primaryEmailAddress?.emailAddress ||
        cu?.emailAddresses?.[0]?.emailAddress ||
        ""
    const avUrl = cu?.imageUrl || ""
    const ini = (cu?.firstName || dName || "V").charAt(0).toUpperCase()

    /* ── Close handler: profile exits first, then overlay ── */
    const closeMenu = useCallback(() => {
        if (closing) return
        setClosing(true)
        setTimeout(() => {
            setIsOpen(false)
            setClosing(false)
            setAdminOpen(false)
        }, 150)
    }, [closing])

    const nav = useCallback(
        (url: string) => {
            closeMenu()
            setTimeout(() => {
                if (url.startsWith("/") && (window as any).rsvNavigate)
                    (window as any).rsvNavigate(url)
                else window.location.href = url
            }, 220)
        },
        [closeMenu]
    )
    const modalRef = useRef(modalState)
    modalRef.current = modalState
    const menuHidden = false
    const doLogin = useCallback(
        (v: "login" | "register" = "login") => {
            closeMenu()
            setTimeout(() => {
                modalRef.current.open(v)
            }, 550)
        },
        [closeMenu]
    )
    const doLogout = useCallback(() => {
        closeMenu()
        setTimeout(() => signOut(), 350)
    }, [signOut, closeMenu])

    /* v12.17 — Helper de estado visual para cada link del menú.
       Centraliza la lógica de "este link está siendo highlighted (cyan,
       durante drag) vs confirmed (dorado, post-soltar)". Cuando hay un
       confirmingUrl activo, los demás links quedan MUTED (blanco, sin
       active glow) — esto evita que el dorado del 'estás aquí' previo
       compita visualmente con el dorado del destino confirmado, que es
       el efecto que el usuario debe percibir. */
    const linkFx = (url: string) => {
        const isConfirmed = confirmingUrl === url
        const isHover = highlightedUrl === url && !isConfirmed
        const hasConfirming = confirmingUrl !== null
        const isMuted = hasConfirming && !isConfirmed
        return {
            isConfirmed,
            isHover,
            isMuted,
            isActive: isConfirmed || isHover,
            transform: isConfirmed
                ? "scale(1.1)"
                : isHover
                  ? "scale(1.05)"
                  : "scale(1)",
            filter: isConfirmed
                ? "brightness(1.55) drop-shadow(0 0 22px rgba(212,168,67,0.95)) drop-shadow(0 0 44px rgba(212,168,67,0.5))"
                : isHover
                  ? "brightness(1.25) drop-shadow(0 0 14px rgba(0,229,255,0.65))"
                  : "none",
            color: isConfirmed
                ? "#F5D98C"
                : isHover
                  ? "#00E5FF"
                  : "#fff",
        }
    }

    /* v12.7 — Handlers del press-and-drag menu.
       hamburgerTouchStart arranca un timer de 300ms. Si el user suelta
       antes del timer, no pasa nada (el onClick normal lo maneja). Si el
       timer dispara, entramos a modo drag: abrimos menú, marcamos
       longPressActive, vibrate(10) para haptic.
       hamburgerTouchMove lee elementFromPoint + camina el árbol DOM
       hacia arriba buscando `data-nav-url`; si encontramos uno distinto
       al actual, highlight + vibrate(5).
       hamburgerTouchEnd limpia el timer + navega o ejecuta la acción
       (login / logout) según la url recolectada. También suprime el
       onClick sintético post-touch durante 500ms para evitar re-open. */
    const vibrate = useCallback((ms: number) => {
        if (typeof navigator === "undefined") return
        if (typeof navigator.vibrate !== "function") return
        try {
            navigator.vibrate(ms)
        } catch {}
    }, [])
    const resolveDragTarget = (clientX: number, clientY: number) => {
        if (typeof document === "undefined") return null
        let node = document.elementFromPoint(
            clientX,
            clientY
        ) as HTMLElement | null
        while (node && !(node.dataset && node.dataset.navUrl)) {
            node = node.parentElement
        }
        return node?.dataset?.navUrl || null
    }
    const cancelLongPress = useCallback(() => {
        if (longPressTimerRef.current !== null) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
    }, [])
    const hamburgerTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (e.touches.length !== 1) return
            if (isOpen) return
            cancelLongPress()
            longPressTimerRef.current = window.setTimeout(() => {
                longPressTimerRef.current = null
                setLongPressActive(true)
                setIsOpen(true)
                vibrate(10)
            }, 300)
        },
        [isOpen, cancelLongPress, vibrate]
    )
    const hamburgerTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!longPressActive) return
            if (e.cancelable) e.preventDefault()
            const t = e.touches[0]
            if (!t) return
            const url = resolveDragTarget(t.clientX, t.clientY)
            setHighlightedUrl((prev) => {
                if (prev === url) return prev
                if (url) vibrate(5)
                return url
            })
        },
        [longPressActive, vibrate]
    )
    const hamburgerTouchEnd = useCallback(() => {
        cancelLongPress()
        if (!longPressActive) return
        suppressClickRef.current = Date.now() + 500
        const url = highlightedUrl
        setLongPressActive(false)
        /* v12.15 — Si soltó sin un destino válido, cerramos sin flash. */
        if (!url) {
            setHighlightedUrl(null)
            closeMenu()
            return
        }
        /* v13.5 — Release sobre el botón Admin: en vez de navegar o
           cerrar, expandimos la fila de iconos admin y MANTENEMOS el
           menú abierto. El tripulante puede continuar con otro
           press-and-drag para elegir uno de los iconos revelados, o
           tocarlos directamente. Sin flash dorado de confirmación
           (no hay destino navegable). */
        if (url === "__admin_toggle__") {
            setHighlightedUrl(null)
            setAdminOpen(true)
            return
        }
        /* v12.18 — Flash dorado PERMANENTE durante el cierre. Ahora:
           1. Apaga highlight cyan instantáneo.
           2. Enciende dorado en el destino (vía confirmingUrl) — esto
              además mutea el active state del "estás aquí" previo a
              blanco (vía isMuted en linkFx).
           3. Después de 420ms, NAVEGA — pero NO limpiamos confirmingUrl
              acá. El dorado del destino sigue encendido durante el
              cierre del menú (que toma ~350ms por la animación exit).
           4. Cuando el menú efectivamente se cierra (isOpen=false), un
              useEffect dedicado limpia confirmingUrl. Esto da la
              sensación de que "el cambio ya ocurrió" antes del cierre,
              en lugar del "flicker" del reset prematuro. */
        setHighlightedUrl(null)
        setConfirmingUrl(url)
        window.setTimeout(() => {
            if (url === "__auth_login__") {
                doLogin("login")
                return
            }
            if (url === "__auth_register__") {
                doLogin("register")
                return
            }
            if (url === "__auth_logout__") {
                doLogout()
                return
            }
            /* v12.16 — Mi Núcleo es siempre visible; si el press-and-drag
               aterriza ahí sin sesión, abrimos el modal de login en vez
               de navegar a una capa que requiere auth. */
            if (
                (url === "/nucleo" || url === "/escaner/nucleo") &&
                !isLoggedIn
            ) {
                doLogin("login")
                return
            }
            /* v13.4 — Escáner condicional también en press-and-drag: si
               el tripulante está logueado, el drop en "/radar" lo lleva
               a la herramienta (/escaner). Sin sesión, queda en el
               Portal de Inducción (/radar). */
            if (url === "/radar" && isLoggedIn) {
                nav("/escaner")
                return
            }
            nav(url)
        }, 280)
    }, [
        cancelLongPress,
        longPressActive,
        highlightedUrl,
        closeMenu,
        doLogin,
        doLogout,
        nav,
        isLoggedIn,
    ])
    const hamburgerTouchCancel = useCallback(() => {
        cancelLongPress()
        if (!longPressActive) return
        setLongPressActive(false)
        setHighlightedUrl(null)
    }, [cancelLongPress, longPressActive])

    /* ── Scroll lock ── */
    useEffect(() => {
        if (typeof document === "undefined") return
        if (isOpen) {
            document.body.style.overflow = "hidden"
            document.body.style.touchAction = "none"
        } else {
            document.body.style.overflow = ""
            document.body.style.touchAction = ""
        }
        return () => {
            document.body.style.overflow = ""
            document.body.style.touchAction = ""
        }
    }, [isOpen])

    // Reset admin panel when menu closes
    useEffect(() => {
        if (!isOpen) setAdminOpen(false)
    }, [isOpen])

    /* v12.18 — Cuando el menú se cierra completamente, limpiamos el
       confirmingUrl para que el próximo open arranque limpio (sin
       dorado residual). Si lo limpiáramos antes (justo después de
       nav), el dorado del destino "parpadearía" desapareciendo antes
       de que el menú termine su animación de exit. */
    useEffect(() => {
        if (!isOpen && confirmingUrl) {
            const t = window.setTimeout(() => setConfirmingUrl(null), 250)
            return () => window.clearTimeout(t)
        }
    }, [isOpen, confirmingUrl])

    const cV = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.15 },
        },
        exit: {
            opacity: 0,
            transition: { staggerChildren: 0.03, staggerDirection: -1 },
        },
    }
    const iV = {
        hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
        show: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 260, damping: 22 },
        },
        exit: {
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
            transition: { duration: 0.15 },
        },
    }

    const lH = logoHeight || 28
    const lW = (lH * 4) / 3
    const bts: React.CSSProperties = {
        fontFamily: "'Inter',sans-serif",
        fontWeight: 300,
        fontSize: 13,
        letterSpacing: "0.2em",
        color: "#E6F7EF",
        textTransform: "uppercase",
        textShadow: `0 0 10px ${A(0.4)}`,
        whiteSpace: "nowrap",
    }
    /* v12.6 — /meditaciones removido del HD: la pestaña Meditaciones ahora
       aparece en el menú móvil (entre Códices y Sesiones) con la versión
       mobile activa del componente Meditaciones.tsx. */
    const HD = new Set([
        "/fragmentosdelsol",
        "/escaner/holoteca/fragmentos",
        "/simuladores",
        "/nucleo",
        "/escaner/nucleo",
    ])
    const navLinks = (links || []).filter(
        (l: any) => l.enabled !== false && !HD.has(l.url) && l.disabled !== true
    )
    /* v12.5 — aliases de títulos para el menú: reemplaza el texto configurado
       en Framer por una versión más compacta/legible sin tener que editar
       cada property control. "Códices de Luz" → "Códices". */
    const TITLE_ALIASES: Record<string, string> = {
        "Códices de Luz": "Códices",
    }
    const aliasTitle = (t: string) => TITLE_ALIASES[t] || t

    return (
        <>
            {/* BAR — minimal on /radar (transparent + only hamburger).
               v13.8 — data-rsv-mobile-nav permite que otras capas
               (ej. Holograma con un nodo seleccionado) lo oculten
               via CSS global usando body[data-rsv-holo-node-open]. */}
            <div
                data-rsv-mobile-nav="bar"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: barHeight || 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    /* v12.13 — Background degradado azul cósmico (replicando
                       el feel del card "Estado de la Inmersión Solar" y del
                       dock inferior). Antes era rgba(8,10,16,0.55) — gris
                       casi negro plano. Ahora arriba arranca con un tinte
                       cian sutil y desciende a azul oscuro profundo, dando
                       sensación de campo vivo en vez de barra opaca. En
                       /radar y /origen se mantiene transparente (modo
                       inmersivo). */
                    background: isRadarRoute
                        ? "transparent"
                        : "linear-gradient(180deg, rgba(0,40,90,0.72) 0%, rgba(0,20,50,0.78) 50%, rgba(0,12,28,0.85) 100%)",
                    backdropFilter: isRadarRoute ? "none" : "blur(18px) saturate(1.3)",
                    WebkitBackdropFilter: isRadarRoute
                        ? "none"
                        : "blur(18px) saturate(1.3)",
                    borderBottom: isRadarRoute
                        ? "none"
                        : `1px solid ${A(0.18)}`,
                    boxShadow: isRadarRoute
                        ? "none"
                        : "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(0,194,255,0.06)",
                    zIndex: 99999,
                    pointerEvents: isRadarRoute ? "none" : "auto",
                }}
            >
                <div style={{ flex: 1 }} />
                {!isRadarRoute && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                pointerEvents: "auto",
                                cursor: "pointer",
                                transform: `translateX(${brandOffsetX || 0}px)`,
                            }}
                            onClick={() => {
                                if ((window as any).rsvNavigate)
                                    (window as any).rsvNavigate("/")
                                else window.location.href = "/"
                            }}
                        >
                            <div style={bts}>
                                {splitTextLeft || "RED SOLAR"}
                            </div>
                            {logoImage && (
                                <img
                                    src={logoImage}
                                    alt=""
                                    style={{
                                        height: lH,
                                        width: lW,
                                        objectFit: "contain",
                                        flexShrink: 0,
                                        pointerEvents: "none",
                                        margin: "0 10px",
                                    }}
                                />
                            )}
                            <div style={bts}>
                                {splitTextRight || "VIVA"}
                            </div>
                        </div>
                    </div>
                )}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        /* v12.7 — si acabamos de terminar un press-and-drag,
                           suprimimos el click sintético que iOS dispara
                           post-touch para no reabrir el menú. */
                        if (Date.now() < suppressClickRef.current) {
                            e.preventDefault()
                            e.stopPropagation()
                            return
                        }
                        setIsOpen(true)
                    }}
                    onTouchStart={hamburgerTouchStart}
                    onTouchMove={hamburgerTouchMove}
                    onTouchEnd={hamburgerTouchEnd}
                    onTouchCancel={hamburgerTouchCancel}
                    style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        width: 44,
                        height: 44,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 5,
                        padding: 0,
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 1,
                        pointerEvents: "auto",
                        /* v12.7 — touch-action:none sobre la hamburguesa para
                           que iOS no intercepte el long-press con su propio
                           menú contextual (callout). Permite el drag
                           continuo sobre el menú recién abierto. */
                        touchAction: "none",
                        WebkitTouchCallout: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    <motion.div
                        style={{
                            width: 24,
                            height: 2,
                            background: "#E6F7EF",
                            boxShadow: `0 0 8px ${A(0.6)}`,
                            borderRadius: 2,
                        }}
                    />
                    {/* v12.29 RSV — línea inferior: tono azul oscuro del INTERIOR
                       del dock (no el borde). Diego quería la sensación de "color
                       de navegación" que transmite el tono interno oscuro del
                       dock y del back button, no el cian brillante del borde.
                       Glow azul suave para que siga siendo visible sobre el
                       fondo negro espacial.
                       v12.3 MobileNav — en /radar subimos la luminancia (bg más
                       claro + glow cian brillante) para que la 2da línea no se vea
                       opaca al lado de la blanca. Mantenemos el tono azul oscuro
                       como identidad visual, pero le damos el mismo nivel de
                       "iluminación" que la línea superior. Fuera de /radar, tono
                       previo intacto. */}
                    <motion.div
                        style={{
                            width: 16,
                            height: 2,
                            background: isRadarRoute
                                ? "rgba(46,130,220,1)"
                                : "rgba(30,80,150,0.95)",
                            boxShadow: isRadarRoute
                                ? "0 0 10px rgba(70,180,245,0.85)"
                                : "0 0 6px rgba(30,80,150,0.55)",
                            borderRadius: 2,
                        }}
                    />
                    {/* v12.8 — Hit area extendida (invisible) para el
                       press-and-drag gesture. Cubre la esquina superior
                       derecha del viewport + algo arriba, izquierda y
                       abajo del botón de 44×44, reduciendo el margen de
                       error al iniciar el gesto con el pulgar. El div es
                       transparente; los touch events bubblean al motion.button
                       padre que tiene los handlers. */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: -20,
                            right: -24,
                            bottom: -16,
                            left: -20,
                            background: "transparent",
                        }}
                    />
                </motion.button>
            </div>

            {/* OVERLAY */}
            {!forceClose && (
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            onClick={(e: any) => {
                                if (e.target === e.currentTarget) closeMenu()
                            }}
                            initial={{
                                clipPath: "circle(0% at 0% 100%)",
                                opacity: 1,
                            }}
                            animate={{
                                clipPath: "circle(150% at 0% 100%)",
                                opacity: 1,
                            }}
                            exit={{
                                clipPath: "circle(0% at 100% 0%)",
                                opacity: 1,
                            }}
                            transition={{
                                duration: 0.35,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: menuHidden ? -1 : 100000,
                                opacity: menuHidden ? 0 : 1,
                                background: "rgba(4,6,12,0.92)",
                                backdropFilter: "blur(32px)",
                                WebkitBackdropFilter: "blur(32px)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                fontFamily: "'Inter',sans-serif",
                                cursor: "pointer",
                                overflowX: "hidden",
                                overflowY: "auto",
                                pointerEvents: menuHidden ? "none" : "auto",
                                transition: "opacity 0.05s ease",
                            }}
                        >
                            <OverlayParticles accent={accent} />
                            <CornerBracket
                                position="tl"
                                accent={accent}
                                delay={0.2}
                            />
                            <CornerBracket
                                position="tr"
                                accent={accent}
                                delay={0.3}
                            />
                            <CornerBracket
                                position="bl"
                                accent={accent}
                                delay={0.4}
                            />
                            <CornerBracket
                                position="br"
                                accent={accent}
                                delay={0.5}
                            />
                            <motion.div
                                animate={{
                                    opacity: [0.02, 0.06, 0.02],
                                    scale: [0.8, 1.1, 0.8],
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    position: "absolute",
                                    width: 400,
                                    height: 400,
                                    borderRadius: "50%",
                                    top: "30%",
                                    background: `radial-gradient(circle, ${A(0.08)} 0%, transparent 70%)`,
                                    pointerEvents: "none",
                                }}
                            />

                            {/* ═══ PROFILE — PINNED TOP ═══ */}
                            {isLoggedIn && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={
                                        closing
                                            ? {
                                                  opacity: 0,
                                                  y: -30,
                                                  scale: 0.95,
                                              }
                                            : { opacity: 1, y: 0, scale: 1 }
                                    }
                                    transition={
                                        closing
                                            ? { duration: 0.2, ease: "easeIn" }
                                            : {
                                                  delay: 0.1,
                                                  type: "spring",
                                                  stiffness: 200,
                                                  damping: 20,
                                              }
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (isAdmin)
                                            nav("/escaner/nucleo#mifirma")
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: 20,
                                        left: 24,
                                        right: 24,
                                        zIndex: 5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        padding: "12px 16px",
                                        background: `linear-gradient(135deg, ${A(0.06)}, transparent)`,
                                        border: `1px solid ${A(0.15)}`,
                                        borderRadius: 14,
                                        cursor: isAdmin ? "pointer" : "default",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {avUrl ? (
                                            <img
                                                src={avUrl}
                                                alt=""
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    border: `2px solid ${isAdmin ? `${AD}0.6)` : A(0.4)}`,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: isAdmin
                                                        ? AC
                                                        : accent,
                                                    background: isAdmin
                                                        ? `radial-gradient(circle at 30% 30%,${AD}0.18),${AD}0.05))`
                                                        : `radial-gradient(circle at 30% 30%,${A(0.18)},${A(0.05)})`,
                                                    border: `2px solid ${isAdmin ? `${AD}0.6)` : A(0.4)}`,
                                                }}
                                            >
                                                {ini}
                                            </div>
                                        )}
                                        <motion.div
                                            animate={{ opacity: [0.6, 1, 0.6] }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            style={{
                                                position: "absolute",
                                                bottom: 0,
                                                right: 0,
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: isAdmin
                                                    ? "#D4A843"
                                                    : "#4ADE80",
                                                border: "2px solid rgba(4,6,12,0.9)",
                                                boxShadow: `0 0 6px ${isAdmin ? "#D4A843" : "#4ADE80"}`,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: "#fff",
                                                    letterSpacing: "0.03em",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {dName}
                                            </span>
                                            {isAdmin && (
                                                <span
                                                    style={{
                                                        fontSize: 8,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.14em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: AC,
                                                        background: `${AD}0.1)`,
                                                        border: `1px solid ${AD}0.25)`,
                                                        borderRadius: 3,
                                                        padding: "1px 5px",
                                                        lineHeight: 1.4,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 300,
                                                color: A(0.5),
                                                letterSpacing: "0.04em",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {dEmail}
                                        </span>
                                    </div>
                                    {isAdmin && (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={A(0.3)}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        >
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    )}
                                </motion.div>
                            )}

                            {/* ═══ CENTERED NAV ═══ */}
                            <motion.div
                                variants={cV}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                /* v12.14 — Tap-to-close restaurado: si el
                                   usuario picotea dentro del bloque centrado
                                   pero FUERA de un link/botón interactivo
                                   (espacio vacío entre items), cerramos el
                                   menú. Antes este motion.div hacía
                                   stopPropagation total — bloqueaba el cierre
                                   en casi todo el viewport (320px del centro).
                                   Ahora sólo bloquea cuando el target es
                                   interactivo (cualquier botón/link/link-wrap
                                   con data-nav-url). El press-and-drag vive
                                   en touchHandlers de la hamburguesa, no acá,
                                   así que sigue funcionando intacto. */
                                onClick={(e) => {
                                    const t = e.target as HTMLElement
                                    if (
                                        t.closest(
                                            "button, a, [data-nav-url]"
                                        )
                                    )
                                        return
                                    closeMenu()
                                }}
                                onTouchEnd={(e) => e.stopPropagation()}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    width: "100%",
                                    maxWidth: 320,
                                    padding: "0 24px",
                                    zIndex: 2,
                                    /* v12.1 — m\u00e1s aire entre la barra del avatar
                                       y la primera entrada de la lista (Origen) */
                                    marginTop: "max(150px, 20vh)",
                                    marginBottom: "auto",
                                }}
                            >
                                {/* Nav links */}
                                {navLinks.map((link: any, i: number) => {
                                    const rI = (links || []).indexOf(link)
                                    const isA = rI === activeLinkIndex
                                    const isL = i === navLinks.length - 1
                                    /* v12.17 — wrapper con data-nav-url. linkFx()
                                       da el estado visual + isMuted para
                                       silenciar el active dorado del previo
                                       cuando hay otro confirmando. */
                                    const fx = linkFx(link.url)
                                    const showActive =
                                        !fx.isMuted && (isA || fx.isActive)
                                    return (
                                        <React.Fragment key={`n-${i}`}>
                                            <div
                                                data-nav-url={link.url}
                                                style={{
                                                    width: "100%",
                                                    transform: fx.transform,
                                                    filter: fx.filter,
                                                    transition:
                                                        "transform 0.18s ease, filter 0.2s ease",
                                                }}
                                            >
                                                <ULink
                                                    variants={iV}
                                                    label={aliasTitle(
                                                        link.title
                                                    )}
                                                    active={showActive}
                                                    color={
                                                        fx.isMuted
                                                            ? "#fff"
                                                            : fx.color
                                                    }
                                                    onClick={() => {
                                                        /* v13.3 — Escáner
                                                           condicional: logueado
                                                           va directo a la
                                                           herramienta (/escaner);
                                                           sin sesión cae al
                                                           Portal educativo
                                                           (/radar). */
                                                        if (
                                                            link.url === "/radar"
                                                        ) {
                                                            nav(
                                                                isLoggedIn
                                                                    ? "/escaner"
                                                                    : "/radar"
                                                            )
                                                        } else {
                                                            nav(link.url)
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {!isL && <ThinSep />}
                                        </React.Fragment>
                                    )
                                })}

                                {/* v12.4 — El bloque INGRESAR SALIÓ de acá; ahora
                                   vive como footer fijo abajo. Ver <motion.div>
                                   con position: absolute después del cierre de
                                   este container. Esto da aire a los nav links
                                   y no se ve apretado. */}

                                {/* v12.16 — "Mi Núcleo" SIEMPRE visible
                                   (logueado y no logueado). Razón:
                                   descubribilidad + funnel de conversión.
                                   Si el tripulante está logueado, navega
                                   directo a /nucleo. Si no tiene sesión, el
                                   tap dispara doLogin("login") que cierra
                                   el menú y abre el Auth2Modal — el menú
                                   nunca esconde destinos, sólo redirige el
                                   primer paso al funnel correcto. */}
                                <ThinSep />
                                {(() => {
                                    const fx = linkFx("/escaner/nucleo")
                                    /* v13.9 — Aceptamos ambos paths
                                       como activos (canónico
                                       /escaner/nucleo y legacy /nucleo
                                       por si Domo aún no aplicó el
                                       redirect). */
                                    const linkUrl =
                                        (links || [])[activeLinkIndex]?.url
                                    const isNucleoActive =
                                        linkUrl === "/escaner/nucleo" ||
                                        linkUrl === "/nucleo"
                                    const showActive =
                                        !fx.isMuted &&
                                        (isNucleoActive || fx.isActive)
                                    return (
                                        <div
                                            data-nav-url="/escaner/nucleo"
                                            style={{
                                                width: "100%",
                                                transform: fx.transform,
                                                filter: fx.filter,
                                                transition:
                                                    "transform 0.18s ease, filter 0.2s ease",
                                            }}
                                        >
                                            <ULink
                                                variants={iV}
                                                label="Mi Núcleo"
                                                active={showActive}
                                                color={
                                                    fx.isMuted
                                                        ? "#fff"
                                                        : fx.color
                                                }
                                                onClick={() => {
                                                    if (isLoggedIn) {
                                                        nav(
                                                            "/escaner/nucleo"
                                                        )
                                                    } else {
                                                        doLogin("login")
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                })()}

                                {/* Auth-gated (admin only) — sólo el toggle de
                                   iconos admin (Escáner / Motor / Telemetría
                                   / Holograma). Mi Núcleo ya no vive acá
                                   desde v12.12. */}
                                {isLoggedIn && isAdmin && (
                                    <>
                                        {/* ═══ ADMIN TOGGLE ═══ */}
                                        <ThinSep color={`${AD}0.25)`} />

                                        {/* v12.11 — Admin toggle TOMA-EL-LUGAR:
                                           cuando adminOpen=false, sólo se ve
                                           el botón "Admin" (engranaje + label).
                                           Al picarlo, el botón DESAPARECE y los
                                           4 iconos (Escáner / Motor / Telemetría
                                           / Holograma) ocupan exactamente esa
                                           misma fila — no se abren debajo, no
                                           se acumulan a la derecha. Para volver
                                           al estado cerrado, el tripulante
                                           cierra el menú hamburguesa (al
                                           cerrar resetea adminOpen a false) o
                                           navega a un destino del Admin
                                           tocando un icono. */}
                                        <motion.div
                                            variants={iV}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 10,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {/* ADMIN button — sólo visible cuando los iconos están cerrados.
                                               v13.5 — data-nav-url="__admin_toggle__" activa el
                                               press-and-drag: al soltar el dedo encima durante un
                                               drag, hamburgerTouchEnd intercepta el token y expande
                                               la fila de iconos admin (setAdminOpen) sin cerrar el
                                               menú. Visual hover cyan replica el lenguaje visual
                                               de los demás links del menú. */}
                                            {!adminOpen && (
                                                <button
                                                    data-nav-url="__admin_toggle__"
                                                    onClick={() =>
                                                        setAdminOpen(true)
                                                    }
                                                    style={(() => {
                                                        const fx = linkFx(
                                                            "__admin_toggle__"
                                                        )
                                                        return {
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 6,
                                                            padding:
                                                                "10px 18px",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            letterSpacing:
                                                                "0.16em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: fx.isHover
                                                                ? "#00E5FF"
                                                                : `${AD}0.65)`,
                                                            background:
                                                                fx.isHover
                                                                    ? "linear-gradient(135deg, rgba(0,229,255,0.14), rgba(0,229,255,0.04))"
                                                                    : `linear-gradient(135deg, ${AD}0.08), ${AD}0.03))`,
                                                            border: `1px solid ${fx.isHover ? "rgba(0,229,255,0.55)" : `${AD}0.28)`}`,
                                                            borderRadius: 10,
                                                            cursor: "pointer",
                                                            outline: "none",
                                                            boxShadow:
                                                                fx.isHover
                                                                    ? "0 0 18px rgba(0,229,255,0.4)"
                                                                    : `0 0 10px ${AD}0.05)`,
                                                            fontFamily:
                                                                "'Inter',sans-serif",
                                                            transform:
                                                                fx.isHover
                                                                    ? "scale(1.06)"
                                                                    : "scale(1)",
                                                            transition:
                                                                "transform 0.18s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease",
                                                            flexShrink: 0,
                                                        }
                                                    })()}
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={
                                                            linkFx(
                                                                "__admin_toggle__"
                                                            ).isHover
                                                                ? "#00E5FF"
                                                                : `${AD}0.8)`
                                                        }
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-1.18-2.82H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.82-1.18V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.18 2.82H21a2 2 0 0 1 0 4h-.09" />
                                                    </svg>
                                                    Admin
                                                </button>
                                            )}

                                            {/* Icon row TOMA EL LUGAR del botón
                                               Admin (mismo container, mismo
                                               flex row) cuando adminOpen=true */}
                                            <AnimatePresence>
                                                {adminOpen && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.92,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            scale: 0.92,
                                                        }}
                                                        transition={{
                                                            duration: 0.25,
                                                            ease: "easeOut",
                                                        }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <AdminIconBtn
                                                            icon={
                                                                <AIconEscaner />
                                                            }
                                                            label="Escáner"
                                                            onClick={() =>
                                                                nav("/escaner")
                                                            }
                                                        />
                                                        <AdminIconBtn
                                                            icon={
                                                                <AIconMotor />
                                                            }
                                                            label="Motor"
                                                            onClick={() =>
                                                                nav(
                                                                    "/motor-intervencion"
                                                                )
                                                            }
                                                        />
                                                        <AdminIconBtn
                                                            icon={
                                                                <AIconTelemetria />
                                                            }
                                                            label="Telemetría"
                                                            onClick={() =>
                                                                nav(
                                                                    "/telemetria"
                                                                )
                                                            }
                                                        />
                                                        <AdminIconBtn
                                                            icon={
                                                                <AIconHolograma />
                                                            }
                                                            label="Holograma"
                                                            onClick={() =>
                                                                nav(
                                                                    "/holograma"
                                                                )
                                                            }
                                                        />
                                                        <AdminIconBtn
                                                            icon={
                                                                <AIconObservatorio />
                                                            }
                                                            label="Observatorio"
                                                            onClick={() =>
                                                                nav(
                                                                    "/observatorio"
                                                                )
                                                            }
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </>
                                )}

                                {/* v12.5 — Cerrar sesión movido fuera del nav centrado.
                                   Ahora vive en el slot bottom (gemelo del INGRESAR)
                                   para no desplazarse cuando cambian las otras entradas
                                   del menú. Ver bloque absolute más abajo. */}
                            </motion.div>

                            {/* v12.4 — INGRESAR pinned al bottom (si no
                               logged in). Queda centrado horizontalmente y
                               ocupa max 340px. Encima del footer "Sistema
                               en línea". */}
                            {!isLoggedIn && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.45,
                                        duration: 0.55,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    style={{
                                        position: "absolute",
                                        bottom: 78,
                                        left: 0,
                                        right: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "0 24px",
                                        zIndex: 3,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 120,
                                            height: 1,
                                            background: `linear-gradient(90deg, transparent, ${A(0.22)}, transparent)`,
                                            marginBottom: 6,
                                        }}
                                    />
                                    <button
                                        data-nav-url="__auth_login__"
                                        onTouchEnd={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogin("login")
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogin("login")
                                        }}
                                        style={(() => {
                                            const fx = linkFx("__auth_login__")
                                            return {
                                                width: "100%",
                                                maxWidth: 340,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 10,
                                                padding: "16px 24px",
                                                fontSize: 14,
                                                fontWeight: 600,
                                                letterSpacing: "0.22em",
                                                textTransform: "uppercase",
                                                color: fx.isConfirmed
                                                    ? "#F5D98C"
                                                    : fx.isHover
                                                      ? "#00E5FF"
                                                      : accent,
                                                background: `linear-gradient(135deg, ${A(0.1)}, ${A(0.04)})`,
                                                border: `1px solid ${fx.isConfirmed ? "rgba(212,168,67,0.7)" : A(0.4)}`,
                                                borderRadius: 14,
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: fx.isConfirmed
                                                    ? "0 6px 26px rgba(212,168,67,0.45), 0 0 28px rgba(212,168,67,0.35), inset 0 1px 0 rgba(255,225,150,0.25)"
                                                    : fx.isHover
                                                      ? "0 6px 22px rgba(0,229,255,0.35), 0 0 20px rgba(0,229,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
                                                      : `0 6px 22px ${A(0.12)}, inset 0 1px 0 ${A(0.14)}`,
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                WebkitTapHighlightColor:
                                                    "transparent",
                                                transform: fx.isConfirmed
                                                    ? "scale(1.05)"
                                                    : fx.isHover
                                                      ? "scale(1.03)"
                                                      : "scale(1)",
                                                transition:
                                                    "transform 0.15s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                                            }
                                        })()}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                filter: `drop-shadow(0 0 6px ${accent})`,
                                            }}
                                        >
                                            <IconLogin />
                                        </span>
                                        <span>Ingresar</span>
                                    </button>
                                    <button
                                        onTouchEnd={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogin("register")
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogin("register")
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            outline: "none",
                                            fontSize: 11,
                                            fontWeight: 300,
                                            letterSpacing: "0.1em",
                                            color: A(0.45),
                                            fontFamily:
                                                "'Inter',sans-serif",
                                            padding: "4px 0",
                                            WebkitTapHighlightColor:
                                                "transparent",
                                        }}
                                    >
                                        ¿No tienes cuenta?{" "}
                                        <span
                                            style={{
                                                color: A(0.75),
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Crear una
                                        </span>
                                    </button>
                                </motion.div>
                            )}

                            {/* v12.5 — CERRAR SESIÓN pinned al bottom (gemelo del
                               INGRESAR pero para usuarios logged in). Mismo slot
                               físico, para que no se mueva cuando aparecen/
                               desaparecen links admin en el nav centrado. */}
                            {isLoggedIn && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.45,
                                        duration: 0.55,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    style={{
                                        position: "absolute",
                                        bottom: 78,
                                        left: 0,
                                        right: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "0 24px",
                                        zIndex: 3,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 120,
                                            height: 1,
                                            background: `linear-gradient(90deg, transparent, ${G(0.25)}, transparent)`,
                                            marginBottom: 4,
                                        }}
                                    />
                                    <button
                                        data-nav-url="__auth_logout__"
                                        onTouchEnd={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogout()
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            doLogout()
                                        }}
                                        style={(() => {
                                            const fx = linkFx("__auth_logout__")
                                            return {
                                                width: "100%",
                                                maxWidth: 340,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 10,
                                                padding: "14px 24px",
                                                fontSize: 13,
                                                fontWeight: 500,
                                                letterSpacing: "0.22em",
                                                textTransform: "uppercase",
                                                color: fx.isConfirmed
                                                    ? "#F5D98C"
                                                    : fx.isHover
                                                      ? "#00E5FF"
                                                      : G(0.85),
                                                background: `linear-gradient(135deg, ${G(0.08)}, ${G(0.03)})`,
                                                border: `1px solid ${fx.isConfirmed ? "rgba(212,168,67,0.7)" : G(0.32)}`,
                                                borderRadius: 14,
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: fx.isConfirmed
                                                    ? "0 6px 26px rgba(212,168,67,0.45), 0 0 26px rgba(212,168,67,0.32), inset 0 1px 0 rgba(255,225,150,0.25)"
                                                    : fx.isHover
                                                      ? "0 6px 22px rgba(0,229,255,0.3), 0 0 18px rgba(0,229,255,0.22), inset 0 1px 0 rgba(255,255,255,0.2)"
                                                      : `0 6px 22px ${G(0.1)}, inset 0 1px 0 ${G(0.12)}`,
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                WebkitTapHighlightColor:
                                                    "transparent",
                                                transform: fx.isConfirmed
                                                    ? "scale(1.05)"
                                                    : fx.isHover
                                                      ? "scale(1.03)"
                                                      : "scale(1)",
                                                transition:
                                                    "transform 0.15s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                                            }
                                        })()}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                filter: `drop-shadow(0 0 6px ${G(0.8)})`,
                                            }}
                                        >
                                            <IconLogout />
                                        </span>
                                        <span>Cerrar sesión</span>
                                    </button>
                                </motion.div>
                            )}

                            {/* Bottom */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                                style={{
                                    position: "absolute",
                                    bottom: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    pointerEvents: "none",
                                }}
                            >
                                <motion.div
                                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: "50%",
                                        background: accent,
                                        boxShadow: `0 0 6px ${accent}`,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 9,
                                        letterSpacing: "0.3em",
                                        color: A(0.25),
                                        textTransform: "uppercase",
                                        fontWeight: 300,
                                    }}
                                >
                                    SISTEMA EN LÍNEA
                                </span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </>
    )
}

addPropertyControls(NavegadorLente, {
    logoImage: { type: ControlType.Image, title: "🖼 Logo" },
    logoHeight: {
        type: ControlType.Number,
        title: "↕️ Alto Logo",
        defaultValue: 28,
        min: 16,
        max: 60,
        step: 1,
        displayStepper: true,
    },
    splitTextLeft: {
        type: ControlType.String,
        title: "Texto Izq",
        defaultValue: "RED SOLAR",
    },
    splitTextRight: {
        type: ControlType.String,
        title: "Texto Der",
        defaultValue: "VIVA",
    },
    brandOffsetX: {
        type: ControlType.Number,
        title: "↔️ Offset X",
        defaultValue: 0,
        min: -30,
        max: 30,
        step: 10,
        displayStepper: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento",
        defaultValue: "#00C2FF",
    },
    barHeight: {
        type: ControlType.Number,
        title: "↕️ Alto Barra",
        defaultValue: 52,
        min: 40,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    activeLinkIndex: {
        type: ControlType.Number,
        title: "Tab Activa",
        defaultValue: 0,
        min: -1,
        max: 10,
        displayStepper: true,
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
    links: {
        type: ControlType.Array,
        title: "Enlaces",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                enabled: {
                    type: ControlType.Boolean,
                    title: "On",
                    defaultValue: true,
                },
                disabled: {
                    type: ControlType.Boolean,
                    title: "🔒 Off",
                    defaultValue: false,
                },
                title: { type: ControlType.String, title: "Título" },
                url: { type: ControlType.String, title: "URL" },
            },
        },
        defaultValue: [
            { enabled: true, disabled: false, title: "Origen", url: "/" },
            {
                enabled: true,
                disabled: true,
                title: "Fragmentos del Sol",
                url: "/escaner/holoteca/fragmentos",
            },
            {
                enabled: true,
                disabled: true,
                title: "Simuladores",
                url: "/simuladores",
            },
            {
                enabled: true,
                disabled: false,
                title: "Códices de Luz",
                url: "/escaner/holoteca/codices",
            },
            {
                /* v12.6 — activada: el componente Meditaciones.tsx ahora
                   tiene render mobile y contenido real (no más "próximamente"). */
                enabled: true,
                disabled: false,
                title: "Meditaciones",
                url: "/escaner/holoteca/meditaciones",
            },
            /* 2026-07-27 — "Sesiones" sale del menú móvil (pedido de Zak: por
               ahora no se ofrecen ni grupales ni 1:1). La ruta sigue viva; para
               reponer la entrada, descomentar este bloque.
            {
                enabled: true,
                disabled: false,
                title: "Sesiones",
                url: "/sesiones",
            },
            */
        ],
    },
})
export default NavegadorLente
