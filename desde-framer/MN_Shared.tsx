// Red Solar Viva — MN_Shared.tsx v1.4 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v1.3 (2026-06-07) — perfil propio vía edge `me` (token verificado); fallback transitorio al oráculo.
// v1.2 (2026-05-20) — `useHashTab` ahora lee SOLO el primer segmento
// del hash (antes del `/`), permitiendo deep-links con sub-path como
// `#mifirma/orbital` → tab "firma" + sub-tab leído por MiNucleo.
// Antes `mifirma/orbital` no matcheaba ningún case y caía al
// default "dashboard", dejando el botón de Estado Orbital en
// MN_Camara apuntando al vacío. Ahora el deep-link funciona.
// v1.1.1 — Re-trigger por waitForComponentLoader timeout del watcher.
// v1.1 — `useNucleoData` ahora escucha los custom events
// `rsv-purchases-changed` y `rsv-cristales-changed` y dispara un
// re-fetch automático cuando algún flujo (canjes, reset admin,
// stripe webhook) toca purchases. Antes el dashboard solo cargaba
// al mount o al cambiar clerkUserId, así que tras un reset admin
// los Códices borrados seguían visibles hasta refresh manual de la
// página. La función de carga se extrajo a un useCallback estable
// para reusarla en ambos effects (initial + listener).
// v1.0 — Utilities, hooks, types, motion variants y helpers compartidos del Mi Núcleo.
// Parte del split de MiNucleo.tsx (336KB → 10 siblings al mismo nivel).
//
// Default export: Object.assign(componente fantasma, { ...utilities }).
// Cumple la regla 🜂 de Framer (Code Files DEBEN default-exportar un componente
// React renderable con body JSX). Las utilities cuelgan como propiedades.
//
// Consumir en otros archivos:
//   import MNShared from "./MN_Shared.tsx"
//   const { useIsMobile, hexToRgba, fU, sR, useHashTab } = MNShared
import * as React from "react"
import {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from "react"

const CLERK_KEY = "pk_live_Y2xlcmsucmVkc29sYXJ2aXZhLmNvbSQ"

const NUC_CACHE_KEY = "nuc_user_cache"
const NUC_SIGNOUT_KEY = "nuc_signout"

function cacheUser(user: any) {
    try {
        localStorage.setItem(
            NUC_CACHE_KEY,
            JSON.stringify({
                id: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                fullName: user.fullName || user.firstName || "",
                imageUrl: user.imageUrl || "",
                primaryEmailAddress: {
                    emailAddress: user.primaryEmailAddress?.emailAddress || "",
                },
            })
        )
        /* Notificar a listeners en la MISMA pestaña (storage events solo cruzan pestañas) */
        window.dispatchEvent(new CustomEvent("nuc-cache-updated"))
    } catch {}
}
function getCachedUser(): any | null {
    try {
        const r = localStorage.getItem(NUC_CACHE_KEY)
        return r ? JSON.parse(r) : null
    } catch {
        return null
    }
}
function clearCachedUser() {
    try {
        localStorage.removeItem(NUC_CACHE_KEY)
        window.dispatchEvent(new CustomEvent("nuc-cache-updated"))
    } catch {}
}
function markSignout() {
    try {
        sessionStorage.setItem(NUC_SIGNOUT_KEY, "1")
    } catch {}
    clearCachedUser()
}
function consumeSignout(): boolean {
    try {
        if (sessionStorage.getItem(NUC_SIGNOUT_KEY) === "1") {
            sessionStorage.removeItem(NUC_SIGNOUT_KEY)
            return true
        }
    } catch {}
    return false
}
function getRealClerkUser(): any | null {
    try {
        return (window as any).Clerk?.user || null
    } catch {
        return null
    }
}

/*
   Limpieza nuclear de TODO el storage local de Clerk.
   signOut() destruye la sesión en el servidor, pero deja tokens
   residuales en localStorage/sessionStorage/cookies que permiten
   a Clerk reconstruir la sesión al cargar en otra página.
*/
function nukeClerkStorage() {
    /* localStorage: claves que empiezan con clerk, __clerk, __client */
    try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk"))
            ) {
                keysToRemove.push(k)
            }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {}

    /* sessionStorage: lo mismo */
    try {
        const keysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk"))
            ) {
                keysToRemove.push(k)
            }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k))
    } catch {}

    /* Cookies: __clerk*, __session*, __client* en todas las variantes de path/domain */
    try {
        const hostname = window.location.hostname
        const domains = [hostname, `.${hostname}`]
        /* Para subdominios tipo redsolarviva.com desde www.redsolarviva.com */
        const parts = hostname.split(".")
        if (parts.length > 2) {
            domains.push(`.${parts.slice(-2).join(".")}`)
        }

        document.cookie.split(";").forEach((c) => {
            const name = c.trim().split("=")[0]
            if (
                name &&
                (name.startsWith("__clerk") ||
                    name.startsWith("__session") ||
                    name.startsWith("__client"))
            ) {
                /* Borrar para cada combinación de domain y path */
                domains.forEach((domain) => {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`
                })
                /* También sin domain explícito */
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            }
        })
    } catch {}
}

/* Esperar a que window.Clerk.user esté disponible (con métodos) */
function waitForRealUser(maxMs = 5000): Promise<any | null> {
    return new Promise((resolve) => {
        const start = Date.now()
        const check = () => {
            const u = getRealClerkUser()
            if (u?.setProfileImage) {
                resolve(u)
                return
            }
            if (Date.now() - start > maxMs) {
                resolve(null)
                return
            }
            setTimeout(check, 200)
        }
        check()
    })
}

export type CSSWithVars = React.CSSProperties & {
    [key: `--${string}`]: string | number
}

/* v1.2 — Detección UA-first del Lente (mobile). Mismo patrón que
   EscanerVibracional, Codices, Meditaciones. Decide el layout
   principal (títulos, padding, tabbar fixed) del dashboard de
   MiNucleo. */
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

const hexToRgba = (hex: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,0,0,${a})`
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

async function sbRpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any>
) {
    if (!url || !key) return null
    try {
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
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

function useNucleoData(
    clerkUserId: string | undefined,
    userEmail: string | undefined,
    sbUrl: string,
    sbKey: string
) {
    const [books, setBooks] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [sub, setSub] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    /* v1.1 — load() extraído a useCallback estable. Lo reusan dos
       effects: el inicial al montar y el listener de eventos
       `rsv-purchases-changed` / `rsv-cristales-changed` para refresh
       en tiempo real tras canjes o admin resets. */
    const cancelledRef = useRef(false)
    const load = useCallback(async () => {
        if (!clerkUserId || !sbUrl || !sbKey) {
            setLoading(false)
            return
        }
        try {
            // Perfil propio verificado por el edge `me` (id del token firmado).
            // El respaldo al oráculo murió con su REVOKE (Lote F, 20260727e).
            const profile = await fetchMe(sbUrl, sbKey)
            if (!profile?.id) {
                setLoading(false)
                return
            }
            if (!cancelledRef.current && profile.is_admin)
                setIsAdmin(true)
            const [bk, ss, py, subData] = await Promise.all([
                sbRpc(sbUrl, sbKey, "get_user_books", {
                    p_user_id: profile.id,
                }),
                sbRpc(sbUrl, sbKey, "get_accessible_sessions", {
                    p_user_id: profile.id,
                }),
                sbRpc(sbUrl, sbKey, "get_user_payments", {
                    p_user_id: profile.id,
                }),
                sbRpc(sbUrl, sbKey, "get_user_subscription", {
                    p_user_id: profile.id,
                    p_email: userEmail || "",
                }),
            ])
            if (!cancelledRef.current) {
                setBooks(Array.isArray(bk) ? bk : [])
                setSessions(Array.isArray(ss) ? ss : [])
                setPayments(Array.isArray(py) ? py : [])
                setSub(
                    Array.isArray(subData) && subData.length > 0
                        ? subData[0]
                        : subData && !Array.isArray(subData)
                          ? subData
                          : null
                )
            }
        } catch (e) {
            console.error("Nucleo fetch error:", e)
        } finally {
            if (!cancelledRef.current) setLoading(false)
        }
    }, [clerkUserId, userEmail, sbUrl, sbKey])
    useEffect(() => {
        cancelledRef.current = false
        load()
        return () => {
            cancelledRef.current = true
        }
    }, [load])
    /* v1.1 — Listener de eventos para refresh en tiempo real. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onChange = () => load()
        window.addEventListener("rsv-purchases-changed", onChange)
        window.addEventListener("rsv-cristales-changed", onChange)
        return () => {
            window.removeEventListener("rsv-purchases-changed", onChange)
            window.removeEventListener("rsv-cristales-changed", onChange)
        }
    }, [load])
    return { books, sessions, payments, sub, isAdmin, loading }
}

function parseLocalDate(dateStr: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        return new Date(dateStr + "T12:00:00")
    return new Date(dateStr)
}

const Stars = React.memo(
    ({ num = 60, speed = 0.6 }: { num?: number; speed?: number }) => {
        const stars = useMemo(() => {
            const a: Array<{
                id: number
                sz: number
                tx: number
                ty: number
                du: number
                dl: number
            }> = []
            for (let i = 0; i < Math.floor(num * 1.5); i++) {
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
            }
            return a
        }, [num, speed])
        return (
            <div className="nucleo-stars-container">
                {stars.map((s) => {
                    const st: CSSWithVars = {
                        "--sz": `${s.sz}px`,
                        "--tx": `${s.tx}vw`,
                        "--ty": `${s.ty}vh`,
                        "--du": `${s.du}s`,
                        "--dl": `${s.dl}s`,
                    }
                    return <div key={s.id} className="nucleo-star" style={st} />
                })}
            </div>
        )
    }
)

/* v4.0 — Mi Núcleo refactorizado a Dashboard Vertical (móvil) +
   Split-View (desktop). El TabKey ahora incluye "dashboard" como
   estado raíz. activeTab === "dashboard" pinta el índice central
   con tarjetas; las otras claves siguen pintando sus secciones
   históricas pero envueltas en un push/sub-pantalla en móvil
   (con back arrow) o en el visor del split-view en desktop. */
export type TabKey =
    | "dashboard"
    | "codices"
    | "escaner"
    | "sesiones"
    | "trayectoria"
    | "firma"

function useHashTab(def: TabKey): [TabKey, (t: TabKey) => void] {
    const read = (): TabKey => {
        if (typeof window === "undefined") return def
        /* v1.2 — Soporte de sub-path: `#mifirma/orbital` → leer solo
           "mifirma" para resolver el tab; "orbital" lo lee MiNucleo
           y setea su `firmaSub` correspondiente. */
        const raw = window.location.hash.replace("#", "").toLowerCase()
        const h = raw.split("/")[0]
        if (h === "codices") return "codices"
        if (h === "escaner" || h === "scanner") return "escaner"
        if (h === "sesiones" || h === "camara-solar" || h === "camara")
            return "sesiones"
        if (h === "trayectoria" || h === "trayecto" || h === "trajectory")
            return "trayectoria"
        if (h === "mifirma" || h === "firma" || h === "ajustes")
            return "firma"
        if (h === "dashboard" || h === "" || h === "nucleo") return "dashboard"
        return def
    }
    const [tab, set] = useState<TabKey>(read)
    useEffect(() => {
        const fn = () => set(read())
        window.addEventListener("hashchange", fn)
        return () => window.removeEventListener("hashchange", fn)
    }, [])
    const setTab = useCallback((t: TabKey) => {
        set(t)
        if (typeof window !== "undefined") {
            const map: Record<TabKey, string> = {
                dashboard: "",
                codices: "#codices",
                escaner: "#escaner",
                sesiones: "#sesiones",
                trayectoria: "#trayectoria",
                firma: "#mifirma",
            }
            const target = map[t]
            const url =
                target === ""
                    ? window.location.pathname + window.location.search
                    : window.location.pathname + window.location.search + target
            window.history.replaceState(null, "", url)
        }
    }, [])
    return [tab, setTab]
}

const cV = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
}
const tV = {
    hidden: { opacity: 0, y: -20, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    },
}
const fU = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" },
    },
}
const sL = {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}
const sR = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}
function isSubActive(sub: any): boolean {
    if (!sub) return false
    const s = (sub.status || "").toLowerCase()
    return s === "active" || s === "trialing"
}

/*
   ══════════════════════════════════════════════════
   PORTAL DE SINTONIZACIÓN — helpers de estado
   ══════════════════════════════════════════════════

   🔧 TESTING: Cambia esta variable para forzar un estado:
      null    = automático (producción)
      "idle"  = Estado 1: Cuenta regresiva
      "live"  = Estado 2: Botón ENTRAR A LA CÁMARA

   Ejemplo: const FORCE_CAMARA_STATE = "live"
*/
const FORCE_CAMARA_STATE: "idle" | "live" | null = null
const ZOOM_URL = "https://us06web.zoom.us/j/87033621223"

export type CamaraState = "idle" | "live"

function getCamaraState(): CamaraState {
    if (FORCE_CAMARA_STATE) return FORCE_CAMARA_STATE
    const now = new Date()
    const utcDay = now.getUTCDay() // 0=Dom, 2=Mar
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
    /* Ignición (botón): Martes 12:20 PM UTC-5 = 17:20 UTC = minuto 1040 */
    /* Fin:              Martes  2:00 PM UTC-5 = 19:00 UTC = minuto 1140 */
    if (utcDay === 2 && utcMinutes >= 1040 && utcMinutes < 1140) return "live"
    return "idle"
}

function getNextSessionStart(): Date {
    const now = new Date()
    const target = new Date(now)
    /* Cuenta regresiva apunta a 12:30 PM UTC-5 = 17:30 UTC (inicio de sesión) */
    target.setUTCHours(17, 30, 0, 0)
    const dow = now.getUTCDay()
    let d = (2 - dow + 7) % 7
    if (d === 0 && now.getTime() >= target.getTime()) d = 7
    target.setUTCDate(target.getUTCDate() + d)
    return target
}

/* Default export: componente fantasma + utilities como propiedades.
   Cumple regla 🜂 — Code Files DEBEN default-exportar componente con
   body JSX. El componente raíz es invisible (display:none); las
   utilities se consumen vía destructuring. */
function MNSharedRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MNSharedRoot.displayName = "MN_Shared"

const Helpers = Object.assign(MNSharedRoot, {
    CLERK_KEY,
    NUC_CACHE_KEY,
    NUC_SIGNOUT_KEY,
    cacheUser,
    getCachedUser,
    clearCachedUser,
    markSignout,
    consumeSignout,
    getRealClerkUser,
    nukeClerkStorage,
    waitForRealUser,
    useIsMobile,
    hexToRgba,
    sbRpc,
    useNucleoData,
    parseLocalDate,
    Stars,
    useHashTab,
    cV,
    tV,
    fU,
    sL,
    sR,
    isSubActive,
    FORCE_CAMARA_STATE,
    ZOOM_URL,
    getCamaraState,
    getNextSessionStart,
})

export default Helpers
