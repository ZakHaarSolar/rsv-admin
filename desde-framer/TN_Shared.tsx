// TN_Shared.tsx v1.6 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v1.5 (2026-07-24) — AUDITORÍA · PARTE 2: useRevenueHistory pasa por el
//   gateway admin-action. get_revenue_history se pedía con la anon key y NO
//   recibe ningún parámetro de identidad, así que la RPC no puede gatear sola:
//   verificado en vivo, devolvía la facturación mensual real del negocio a
//   cualquiera con la llave pública. Requiere admin-action v1.42 + 20260724g.
// v1.4 (2026-06-08) — conteo de pases (useExplorationPasses) por gateway
//   admin-action (RPC admin_exploration_pass_counts); exploration_passes ya
//   no se lee directo con la anon key — cerró la fuga de PII en bloque.
// v1.3 (2026-06-07) — adminAction vía gateway `admin-action` (RPC de gastos).
// v1.2 (2026-06-07) — perfil propio vía edge `me` (token verificado); fallback transitorio al oráculo.
// v1.1 (2026-05-20) — DD interface sumá cuatro campos nuevos
// `inmersion_rev_cents_this/_prev` + `sintonia_rev_cents_this/_prev`
// que vienen del RPC `get_admin_dashboard` y traen el SUM exacto de
// `payments_log.amount_cents` por mes. Telemetría ahora muestra el
// dinero que realmente entró (refleja PRIMERMES, admin promos,
// refunds), en vez de multiplicar count × precio lleno.
//
// Utilidades, hooks, constantes y tipos compartidos del split de
// TelemetriaDelNucleo (sello TN_).
// Default export = ghost component con Object.assign de todos los exports
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidores: TN_UI, TN_Forms, TN_Cards, TN_Dashboard, TelemetriaDelNucleo (shell).
// Patrón de import:
//   import Shared from "./TN_Shared.tsx"
//   const { useDash, GOLD, PLATINUM, fmt, sbRpc } = Shared

import * as React from "react"
import { useState, useEffect, useLayoutEffect, useCallback } from "react"

/* ═══ CSS GLOBAL ═══ */
const ADMIN_CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.adm-root{scrollbar-width:none;-ms-overflow-style:none}.adm-root::-webkit-scrollbar{display:none}
.adm-glass{background:linear-gradient(165deg,rgba(12,28,55,0.82) 0%,rgba(8,20,42,0.88) 100%);backdrop-filter:blur(24px) saturate(1.5);border:1px solid rgba(0,194,255,0.14);border-radius:20px;transition:border-color 0.4s,box-shadow 0.4s}
.adm-glass:hover{border-color:rgba(0,194,255,0.22);box-shadow:0 0 30px rgba(0,194,255,0.06)}
.adm-glass-gold{position:relative;overflow:hidden;background:linear-gradient(165deg,rgba(32,26,12,0.88) 0%,rgba(20,16,6,0.92) 50%,rgba(28,22,10,0.85) 100%);backdrop-filter:blur(24px) saturate(1.5);border:1.5px solid rgba(200,164,78,0.35);border-radius:20px;box-shadow:0 0 35px rgba(200,164,78,0.1),0 0 80px rgba(200,164,78,0.04),inset 0 0 25px rgba(200,164,78,0.04)}
.adm-glass-cyan{position:relative;overflow:hidden;background:linear-gradient(165deg,rgba(8,22,45,0.88) 0%,rgba(5,15,35,0.92) 50%,rgba(10,20,40,0.85) 100%);backdrop-filter:blur(24px) saturate(1.5);border:1.5px solid rgba(0,194,255,0.3);border-radius:20px;box-shadow:0 0 35px rgba(0,194,255,0.08),0 0 80px rgba(0,194,255,0.03),inset 0 0 25px rgba(0,194,255,0.03)}
.adm-glass-platinum{position:relative;overflow:hidden;background:linear-gradient(165deg,rgba(30,36,52,0.88) 0%,rgba(18,24,40,0.92) 50%,rgba(28,34,48,0.85) 100%);backdrop-filter:blur(24px) saturate(1.5);border:1.5px solid rgba(232,238,247,0.22);border-radius:20px;box-shadow:0 0 35px rgba(232,238,247,0.06),0 0 80px rgba(232,238,247,0.025),inset 0 0 25px rgba(232,238,247,0.03)}
.adm-subtle-platinum{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:20px;overflow:hidden;background:linear-gradient(115deg,transparent 30%,rgba(232,238,247,0.05) 44%,rgba(255,255,255,0.03) 50%,rgba(232,238,247,0.06) 56%,transparent 70%);background-size:300% 100%;animation:adm-shimmer-slow 16s ease-in-out infinite}
@keyframes adm-glow-platinum{0%,100%{text-shadow:0 0 6px rgba(232,238,247,0.2)}50%{text-shadow:0 0 16px rgba(232,238,247,0.45)}}
@keyframes adm-ring-pulse{0%,100%{filter:drop-shadow(0 0 4px rgba(200,164,78,0.15))}50%{filter:drop-shadow(0 0 10px rgba(200,164,78,0.3))}}
@keyframes adm-glow-cyan{0%,100%{text-shadow:0 0 6px rgba(0,194,255,0.2)}50%{text-shadow:0 0 16px rgba(0,194,255,0.35)}}
@keyframes adm-glow-gold{0%,100%{text-shadow:0 0 6px rgba(200,164,78,0.2)}50%{text-shadow:0 0 16px rgba(200,164,78,0.35)}}
@keyframes adm-scan{0%{left:-30%;opacity:0}10%{opacity:0.4}90%{opacity:0.4}100%{left:130%;opacity:0}}
@keyframes adm-live-dot{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
@keyframes adm-shimmer-slow{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
.adm-num-input{width:52px;text-align:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:300;padding:6px 4px;outline:none}
.adm-num-input::-webkit-inner-spin-button,.adm-num-input::-webkit-outer-spin-button{-webkit-appearance:none}
.adm-num-input{-moz-appearance:textfield}
.adm-row:hover{background:rgba(255,255,255,0.025)!important}
.adm-subtle-gold{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:20px;overflow:hidden;background:linear-gradient(115deg,transparent 30%,rgba(200,164,78,0.05) 44%,rgba(255,255,255,0.025) 50%,rgba(200,164,78,0.06) 56%,transparent 70%);background-size:300% 100%;animation:adm-shimmer-slow 14s ease-in-out infinite}
.adm-subtle-cyan{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:20px;overflow:hidden;background:linear-gradient(115deg,transparent 30%,rgba(0,194,255,0.05) 44%,rgba(255,255,255,0.025) 50%,rgba(0,194,255,0.06) 56%,transparent 70%);background-size:300% 100%;animation:adm-shimmer-slow 14s ease-in-out infinite}
.adm-float-sidebar{position:fixed;width:310px;z-index:50}
@media(max-width:1500px){.adm-float-sidebar{display:none}}
body[data-rsv-tel-scrolled="1"] .rsv-admin-title{opacity:0;transform:translateY(-14px);pointer-events:none}
.rsv-admin-title{transition:opacity 0.28s ease,transform 0.28s ease}
.adm-detail-panel{padding:24px 28px}
.adm-history-panel{padding:28px 32px}
.adm-expenses-panel{padding:28px 32px}
@media(max-width:767px){
  .rsv-admin-title h1{font-size:12px !important;letter-spacing:0.22em !important}
  .rsv-admin-title p{font-size:7px !important;letter-spacing:0.16em !important}
  .rsv-admin-toggle{right:12px !important;top:10px !important;gap:6px !important}
  .rsv-admin-toggle .adm-live{display:none !important}
  .adm-grid-2{grid-template-columns:1fr !important;gap:14px !important}
  .adm-grid-3{grid-template-columns:1fr 1fr !important}
  .adm-detail-panel{padding:18px 16px !important}
  .adm-history-panel{padding:20px 14px !important}
  .adm-expenses-panel{padding:20px 14px !important}
}
`

function useInjectAdminCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "admin-css-v10"
        ;[
            "admin-css-v9",
            "admin-css-v8",
            "admin-css-v7",
            "admin-css-v6",
            "admin-css-v5",
            "admin-css-v4",
            "admin-css-v3",
        ].forEach((o) => {
            const el = document.getElementById(o)
            if (el) el.remove()
        })
        const p = document.getElementById(id) as HTMLStyleElement | null
        if (p) {
            p.textContent = ADMIN_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = ADMIN_CSS
        document.head.appendChild(s)
    }, [])
}

/* v10.4 — detección mobile (UA-first + ancho <768 como fallback). */
function useIsMobile() {
    const [mobile, setMobile] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const check = () => {
            const ua =
                typeof navigator !== "undefined" ? navigator.userAgent : ""
            const uaMobile = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
            const narrow = window.innerWidth < 768
            setMobile(uaMobile || narrow)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])
    return mobile
}

/* v10.4 — scroll-hide del título/subtítulo portado al body.
   v10.8 — Listener siempre activo (mobile + desktop). */
function useScrollHideHeader() {
    useEffect(() => {
        if (typeof document === "undefined") return
        let detach: (() => void) | null = null
        const attach = (root: HTMLElement) => {
            const onScroll = () => {
                const y = root.scrollTop
                if (y > 60)
                    document.body.setAttribute(
                        "data-rsv-tel-scrolled",
                        "1"
                    )
                else
                    document.body.removeAttribute(
                        "data-rsv-tel-scrolled"
                    )
            }
            onScroll()
            root.addEventListener("scroll", onScroll, { passive: true })
            detach = () => root.removeEventListener("scroll", onScroll)
        }
        const initial = document.querySelector(
            ".adm-root"
        ) as HTMLElement | null
        if (initial) {
            attach(initial)
        } else {
            const obs = new MutationObserver(() => {
                const r = document.querySelector(
                    ".adm-root"
                ) as HTMLElement | null
                if (r) {
                    obs.disconnect()
                    attach(r)
                }
            })
            obs.observe(document.body, { childList: true, subtree: true })
            const t = setTimeout(() => obs.disconnect(), 5000)
            const cleanup = () => {
                obs.disconnect()
                clearTimeout(t)
                if (detach) detach()
                document.body.removeAttribute("data-rsv-tel-scrolled")
            }
            return cleanup
        }
        return () => {
            if (detach) detach()
            document.body.removeAttribute("data-rsv-tel-scrolled")
        }
    }, [])
}

/* ═══ Supabase RPC helper (compartido con todas las llamadas) ═══ */
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
        if (!r.ok) return null
        return await r.json()
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

// Acción admin verificada vía gateway `admin-action` (token de Clerk → el
// servidor inyecta el id admin verificado). Reemplaza llamadas directas a las
// RPC admin_* con el id del cliente.
async function adminAction(
    url: string,
    key: string,
    action: string,
    params: Record<string, any> = {}
) {
    if (!url || !key) return null
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/admin-action`, {
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

function useAdminAuth(sbUrl: string, sbKey: string) {
    const [state, setState] = useState<"loading" | "admin" | "denied">(
        "loading"
    )
    const [userName, setUserName] = useState("")
    const [clerkId, setClerkId] = useState<string | null>(null)
    useEffect(() => {
        let c = false
        const go = async () => {
            let i = 0
            while (i < 25) {
                if ((window as any).Clerk?.user) break
                await new Promise((r) => setTimeout(r, 200))
                i++
            }
            const u = (window as any).Clerk?.user
            if (!u) {
                if (!c) setState("denied")
                return
            }
            // Perfil propio verificado por el edge `me` (id del token firmado).
            // El respaldo al oráculo murió con su REVOKE (Lote F, 20260727e).
            const p = await fetchMe(sbUrl, sbKey)
            if (!c) {
                if (p?.is_admin) {
                    setState("admin")
                    setUserName(p.full_name || u.fullName || "Admin")
                    setClerkId(u.id)
                } else setState("denied")
            }
        }
        go()
        return () => {
            c = true
        }
    }, [sbUrl, sbKey])
    return { state, userName, clerkId }
}

/* ═══ TYPES ═══ */
interface DD {
    pulsar_active: number
    cuasar_active: number
    sintonia_active: number
    pulsar_rev_this: number
    cuasar_rev_this: number
    sintonia_rev_this: number
    pulsar_rev_prev: number
    cuasar_rev_prev: number
    sintonia_rev_prev: number
    pulsar_renewing: number
    cuasar_renewing: number
    sintonia_renewing: number
    /* v1.1 (2026-05-20) — revenue real en cents desde payments_log,
       refleja descuentos PRIMERMES, admin promos, refunds parciales. */
    inmersion_rev_cents_this: number
    inmersion_rev_cents_prev: number
    sintonia_rev_cents_this: number
    sintonia_rev_cents_prev: number
    subscribers: any[]
    books_this: any[]
    books_prev: any[]
    books_this_count: number
    books_prev_count: number
    books_this_revenue: number
    books_prev_revenue: number
    expenses: any[]
    current_month: number
}

const Z: DD = {
    pulsar_active: 0,
    cuasar_active: 0,
    sintonia_active: 0,
    pulsar_rev_this: 0,
    cuasar_rev_this: 0,
    sintonia_rev_this: 0,
    pulsar_rev_prev: 0,
    cuasar_rev_prev: 0,
    sintonia_rev_prev: 0,
    pulsar_renewing: 0,
    cuasar_renewing: 0,
    sintonia_renewing: 0,
    inmersion_rev_cents_this: 0,
    inmersion_rev_cents_prev: 0,
    sintonia_rev_cents_this: 0,
    sintonia_rev_cents_prev: 0,
    subscribers: [],
    books_this: [],
    books_prev: [],
    books_this_count: 0,
    books_prev_count: 0,
    books_this_revenue: 0,
    books_prev_revenue: 0,
    expenses: [],
    current_month: 1,
}

function useDash(u: string, k: string, cid: string | null) {
    const [data, setData] = useState<DD>(Z)
    const [loading, setLoading] = useState(true)
    const f = useCallback(async () => {
        if (!cid) return
        // Gateway admin-action (financiero) + fallback transitorio hasta el REVOKE.
        let r = await adminAction(u, k, "get_admin_dashboard", {})
        if (r == null) r = await sbRpc(u, k, "get_admin_dashboard", { p_clerk_id: cid })
        if (r && !r.error)
            setData({
                pulsar_active: +r.pulsar_active || 0,
                cuasar_active: +r.cuasar_active || 0,
                sintonia_active: +r.sintonia_active || 0,
                pulsar_rev_this: +r.pulsar_rev_this || 0,
                cuasar_rev_this: +r.cuasar_rev_this || 0,
                sintonia_rev_this: +r.sintonia_rev_this || 0,
                pulsar_rev_prev: +r.pulsar_rev_prev || 0,
                cuasar_rev_prev: +r.cuasar_rev_prev || 0,
                sintonia_rev_prev: +r.sintonia_rev_prev || 0,
                pulsar_renewing: +r.pulsar_renewing || 0,
                cuasar_renewing: +r.cuasar_renewing || 0,
                sintonia_renewing: +r.sintonia_renewing || 0,
                inmersion_rev_cents_this: +r.inmersion_rev_cents_this || 0,
                inmersion_rev_cents_prev: +r.inmersion_rev_cents_prev || 0,
                sintonia_rev_cents_this: +r.sintonia_rev_cents_this || 0,
                sintonia_rev_cents_prev: +r.sintonia_rev_cents_prev || 0,
                subscribers: r.subscribers || [],
                books_this: r.books_this || [],
                books_prev: r.books_prev || [],
                books_this_count: +r.books_this_count || 0,
                books_prev_count: +r.books_prev_count || 0,
                books_this_revenue: +r.books_this_revenue || 0,
                books_prev_revenue: +r.books_prev_revenue || 0,
                expenses: r.expenses || [],
                current_month: +r.current_month || 1,
            })
        setLoading(false)
    }, [u, k, cid])
    useEffect(() => {
        f()
        const t = setInterval(f, 30000)
        return () => clearInterval(t)
    }, [f])
    return { data, loading, refetch: f }
}

/* ═══ FORMATTERS + ANIMATION VARIANTS ═══ */
const fmt = (n: number) =>
    n.toLocaleString("es-MX", { maximumFractionDigits: 0 })

const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
}

const slideUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
}

/* ═══ COLOR PALETTES ═══ */
const GOLD = "#C8A44E",
    GG = "rgba(200,164,78,0.4)",
    GL = "#E8C65A",
    CYAN = "#00C2FF",
    CG = "rgba(0,194,255,0.4)",
    GREEN = "#4CAF50"

const AMBER = "#D4943A",
    AMBER_C = "rgba(212,148,58,0.7)"

/* v10.2 — Transmisión 1:1: platino / luz pura. */
const PLATINUM = "#E8EEF7",
    PLATINUM_RGB = "232,238,247",
    PG = "rgba(232,238,247,0.4)"

/* ═══ BUSINESS CONSTANTS ═══ */
const MG = 22,
    P_INM = 1111,
    P_SINT = 599,
    P_PASS = 555,
    ML = ["Anterior", "Este Mes", "Próximo"]

const CATS: Record<string, string> = {
    herramientas: "Herramientas",
    operacion: "Operación",
    marketing: "Marketing",
    contenido: "Contenido",
    otro: "Otro",
}

const FREQ_L: Record<string, string> = {
    monthly: "/mes",
    annual: "/año",
    one_time: "único",
}

const MONTHS = [
    "",
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
]

/* ═══ EXPLORATION PASSES — consulta directa a Supabase ═══ */
function useExplorationPasses(sbUrl: string, sbKey: string, refreshKey = 0) {
    const [thisMonth, setThisMonth] = useState(0)
    const [prevMonth, setPrevMonth] = useState(0)
    useEffect(() => {
        if (!sbUrl || !sbKey) return
        let c = false
        const go = async () => {
            try {
                /* Conteo por gateway admin-action (token de Clerk verificado).
                   La RPC calcula los rangos del mes / mes previo server-side
                   y devuelve solo los dos números — exploration_passes ya no
                   se lee directo con la anon key (cerró la fuga de PII en
                   bloque: email + nombre de todos los clientes grupales). */
                const d = await adminAction(
                    sbUrl,
                    sbKey,
                    "admin_exploration_pass_counts",
                    {}
                )
                if (c || !d) return
                setThisMonth(Number(d.this_month) || 0)
                setPrevMonth(Number(d.prev_month) || 0)
            } catch {}
        }
        go()
        const t = setInterval(go, 30000)
        return () => {
            c = true
            clearInterval(t)
        }
    }, [sbUrl, sbKey, refreshKey])
    return { passesThisMonth: thisMonth, passesPrevMonth: prevMonth }
}

/* ═══ Transmisión 1:1 — RPC get_1to1_revenue_summary ═══ */
type OneToOneBucket = { count: number; revenueCents: number }
type OneToOneMonth = {
    total_30: OneToOneBucket
    total_45: OneToOneBucket
    total_60: OneToOneBucket
    totalCount: number
    totalRevenueCents: number
}

const EMPTY_1TO1: OneToOneMonth = {
    total_30: { count: 0, revenueCents: 0 },
    total_45: { count: 0, revenueCents: 0 },
    total_60: { count: 0, revenueCents: 0 },
    totalCount: 0,
    totalRevenueCents: 0,
}

function normalize1to1Month(m: any): OneToOneMonth {
    if (!m || typeof m !== "object") return EMPTY_1TO1
    const b = (x: any): OneToOneBucket => ({
        count: Number(x?.count) || 0,
        revenueCents: Number(x?.revenueCents) || 0,
    })
    return {
        total_30: b(m.total_30),
        total_45: b(m.total_45),
        total_60: b(m.total_60),
        totalCount: Number(m.totalCount) || 0,
        totalRevenueCents: Number(m.totalRevenueCents) || 0,
    }
}

function useOneToOneSessions(
    sbUrl: string,
    sbKey: string,
    clerkId: string | null,
    refreshKey = 0
) {
    const [thisMonth, setThisMonth] = useState<OneToOneMonth>(EMPTY_1TO1)
    const [prevMonth, setPrevMonth] = useState<OneToOneMonth>(EMPTY_1TO1)
    useEffect(() => {
        if (!sbUrl || !sbKey || !clerkId) return
        let c = false
        const go = async () => {
            // Gateway admin-action (financiero) + fallback transitorio hasta el REVOKE.
            let data = await adminAction(sbUrl, sbKey, "get_1to1_revenue_summary", {})
            if (data == null)
                data = await sbRpc(
                    sbUrl,
                    sbKey,
                    "get_1to1_revenue_summary",
                    { p_clerk_id: clerkId }
                )
            if (c || !data) return
            setThisMonth(normalize1to1Month((data as any).this_month))
            setPrevMonth(normalize1to1Month((data as any).prev_month))
        }
        go()
        const t = setInterval(go, 30000)
        return () => {
            c = true
            clearInterval(t)
        }
    }, [sbUrl, sbKey, clerkId, refreshKey])
    return { oneOneThisMonth: thisMonth, oneOnePrevMonth: prevMonth }
}

/* ═══ Tuesday picker (12 próximos martes para form de Cámara Solar) ═══ */
const TUESDAY_MONTH_ES = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
]

function getUpcomingTuesdays(
    count: number
): { value: string; label: string }[] {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const currentDay = d.getDay()
    const addDays = currentDay <= 2 ? 2 - currentDay : 9 - currentDay
    d.setDate(d.getDate() + addDays)
    const out: { value: string; label: string }[] = []
    for (let i = 0; i < count; i++) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        out.push({
            value: `${y}-${m}-${dd}`,
            label: `Martes ${d.getDate()} ${TUESDAY_MONTH_ES[d.getMonth()]}`,
        })
        d.setDate(d.getDate() + 7)
    }
    return out
}

/* ═══ Monthly Revenue History via RPC ═══ */
function useMonthlyHistory(sbUrl: string, sbKey: string, months: number) {
    const [data, setData] = useState<
        { label: string; inmersion: number; codices: number; total: number }[]
    >([])
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (!sbUrl || !sbKey || months <= 0) {
            setData([])
            return
        }
        let c = false
        setLoading(true)
        const go = async () => {
            try {
                /* AUDITORÍA 2026-07-24 · Parte 2: el historial de INGRESOS se
                   pedía con la anon key y esta RPC no recibe ningún parámetro
                   de identidad, así que no puede gatear sola — verificado en
                   vivo, devolvía la facturación real a cualquiera. Ahora va por
                   el gateway admin-action (token de Clerk verificado). */
                {
                    const json = await adminAction(
                        sbUrl,
                        sbKey,
                        "get_revenue_history",
                        { p_months: months }
                    )
                    if (Array.isArray(json)) {
                        if (!c) {
                            setData(
                                json.map((m: any) => ({
                                    label: m.label || "",
                                    inmersion: +m.inmersion || 0,
                                    codices: +m.codices || 0,
                                    total: +m.total || 0,
                                }))
                            )
                            setLoading(false)
                        }
                    } else {
                        /* adminAction devuelve null si el gateway rechaza
                           (sin sesión admin) o si falla la red. */
                        console.log("[RSV History] sin datos del gateway")
                        if (!c) setLoading(false)
                    }
                }
            } catch (e) {
                console.log("[RSV History] err:", e)
                if (!c) setLoading(false)
            }
        }
        go()
        return () => {
            c = true
        }
    }, [sbUrl, sbKey, months])
    return { data, loading }
}

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function TN_SharedShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
TN_SharedShell.displayName = "TN_Shared"

const Shared = Object.assign(TN_SharedShell, {
    // CSS + hooks de mount
    ADMIN_CSS,
    useInjectAdminCss,
    useIsMobile,
    useScrollHideHeader,
    // Auth + datos
    sbRpc,
    adminAction,
    useAdminAuth,
    useDash,
    useExplorationPasses,
    useOneToOneSessions,
    useMonthlyHistory,
    Z,
    // Helpers
    fmt,
    fadeIn,
    slideUp,
    normalize1to1Month,
    getUpcomingTuesdays,
    TUESDAY_MONTH_ES,
    EMPTY_1TO1,
    // Colores
    GOLD,
    GG,
    GL,
    CYAN,
    CG,
    GREEN,
    AMBER,
    AMBER_C,
    PLATINUM,
    PLATINUM_RGB,
    PG,
    // Constantes de negocio
    MG,
    P_INM,
    P_SINT,
    P_PASS,
    ML,
    CATS,
    FREQ_L,
    MONTHS,
})

export default Shared
export type { DD, OneToOneBucket, OneToOneMonth }
