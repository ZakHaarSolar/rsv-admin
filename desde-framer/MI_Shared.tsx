// MI_Shared.tsx v2.2 — 🜂 Y ADEMÁS SE DISUELVE (Zak 2026-08-09, misma queja atacada por el otro lado): quitado el marco, el contenido seguía entrando y saliendo cortado a filo contra el borde del cuerpo, justo bajo los controles flotantes. Nacen .mi-trip-bodywrap + dos franjas (.mi-trip-fade-t/-b) con su variante por tema, ancladas al cuerpo y no al modal, así que sobreviven a cualquier cambio de su relleno. NO se usó mask-image A PROPÓSITO: convierte al cuerpo en bloque contenedor de sus descendientes position:fixed, y las TRES tarjetas de confirmación viven ahí dentro; habrían quedado encerradas y atenuadas.
// MI_Shared.tsx v2.1 — 🜂 LA FICHA DEL NODO DEJA DE VIVIR EN UNA CAJA (Zak 2026-08-09): el modal tenía marco redondeado con borde y un colchón de 64px contra la pantalla, y adentro un cuerpo que scrollea; el contenido entraba y salía cortado justo sobre una línea dibujada, así que se leía como piezas mutiladas en vez de una página que sigue. Fuera el borde, fuera las esquinas y fuera el colchón: alto completo y contenido hasta los bordes. Se conserva el respiro lateral y el fondo. | v2.0 — `rpcCached`: la misma memoria del Motor para las lecturas que NO pasan por el gateway (RPC pública directa). La llave lleva prefijo `rpc:` para no chocar jamás con una acción del gateway que se llame igual, y se olvida con `motorCacheClear("rpc:<fn>")`. Beneficio inmediato: el badge de versión del encabezado, el editor de la versión y el panel de bloqueo leen los tres `get_app_release` y ahora hacen UNA consulta entre los tres.
// MI_Shared.tsx v1.9 — MEMORIA DEL MOTOR (la usan Navegación, Onboarding, Correos, Rachas, Espejo, Buzón y Soporte): `adminActionCached` guarda el resultado de cada consulta mientras la página esté abierta, así entrar a una pestaña, salir y volver ya no dispara "Cargando…" otra vez (Zak 2026-08-07: Soporte ↔ Bitácora recargaba en cada ida y vuelta). El botón "Recargar" de cada panel pide `{force:true}`; recargar la página entera limpia todo. Los FALLOS no se guardan (un tropiezo de red no se queda pegado como estado real). + `motorCacheClear(prefix?)` para olvidar una familia tras escribir.
// MI_Shared.tsx v1.8 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// MI_Shared.tsx v1.6 — tema del Motor homogeneizado y más legible (a partir del look de la Cámara de Cristalización): tarjetas .mi-card sólidas (fondo rgba(16,22,40,.92) + borde claro), .mi-input con fondo visible + borde + peso 400, labels y placeholders con mejor contraste, .mi-btn más sólido. Aplica a TODAS las pestañas editoras (Sondas/Calibraciones/Rituales/Wallpapers/Avatares/Cristalización); Nodos Activos NO se toca (usa clases .mi-trip-*).
// v1.5 — .mi-trip-modal capeado a la pantalla (display:flex column + max-height:calc(100vh - 64px)) + nueva clase .mi-trip-scrollbody (cuerpo scrolleable interno, scrollbar oculto) → el modal del nodo no se sale del borde y la vista expandida scrollea adentro sin crecer más que la pantalla.
// MI_Shared.tsx v1.4
// Utilidades, hooks, constantes, tipos y CSS compartidos del split del
// Motor de Intervención (sello MI_). Default export = ghost component
// con Object.assign de todos los exports (patrón canónico utility-only
// para Framer Code Files).
//
// Consumidores: MI_Editores, MI_Cards, MI_Cristales, MI_Detail,
// MI_Tripulantes, MotorDeIntervencion (shell).
// Patrón de import:
//   import Shared from "./MI_Shared.tsx"
//   const { useAdminAuth, useIsMobile, useScrollHideHeader, rpc, hx,
//           PILARES, AC, GOLD, CSS, TripulanteHex } = Shared

import * as React from "react"
import { useState, useEffect, useCallback } from "react"

/* ═══ TIPOS ═══ */
export interface PanelProps {
    supabaseUrl?: string
    supabaseAnonKey?: string
}
export interface SondaRow {
    id: string
    pilar: string
    step_order: number
    question_text: string
    options_json: { label: string; value: number }[]
    is_active: boolean
}
export interface ProtoRow {
    id: string
    pilar: string
    fase: number
    titulo: string
    descripcion_corta: string
    alerta_text: string
    sugerencia_text: string
    tareas_json: { id: string; desc: string }[]
    is_active: boolean
    score_min: number
    score_max: number
}
export type Pilar =
    | "FISICO"
    | "MENTAL"
    | "EMOCIONAL"
    | "FINANCIERO"
    | "VECTOR"
    | "ORBITA"
export type Section = "sondas" | "protocolos" | "tripulantes"

export interface TripulanteRow {
    clerk_user_id: string
    full_name: string
    scan_count: number
    complete_cycles: number
    last_scan_ts: string | null
    history: Array<{
        ts: string
        indice: number | null
        fisico: number | null
        mental: number | null
        emocional: number | null
        financiero: number | null
        vector: number | null
        orbita: number | null
        cycle: string | any[] | null
    }>
    in_flight_pilars: string[] | null
}

export interface TripulanteExtras {
    is_subscriber: boolean
    tier: string | null
    decoder_scans_used: number
    last_complete_cycle_ts: string | null
    email?: string | null
    purchases?:
        | {
              book_id: string
              title: string
              device: string | null
              formats: string[] | null
              purchased_at: string
              amount_cents: number | null
          }[]
        | null
    subscription_started_at?: string | null
    subscription_current_period_end?: string | null
    subscription_cancel_at_period_end?: boolean | null
    subscription_is_gift?: boolean | null
    app_version?: string | null
    app_version_updated_at?: string | null
}

export interface EmailSubscriptionStatus {
    email: string | null
    in_nodo: boolean
    subscribed_at: string | null
    nodo_source: string | null
    nodo_source_from?: string | null
    has_opt_out: boolean
    opted_out_at: string | null
    opt_out_reason: string | null
    opt_out_category: string | null
    opt_out_source: string | null
}

/* ═══ CONSTANTES ═══ */
/* 🜂 v1.8 — LENGUAJE EXPERIENCIAL TAMBIÉN EN EL MOTOR (Zak): la app dejó el
   vocabulario de computadora en 2026-07-13 (Cuerpo · Mente · Emociones ·
   Abundancia · Propósito · Vínculos) pero el panel de administración seguía
   diciendo Hardware, Procesador, Gravedad y Órbita. Los IDENTIFICADORES
   internos (FISICO, MENTAL, …) NO cambian: solo lo que se lee. */
export const PILARES: { id: Pilar; label: string; short: string }[] = [
    { id: "FISICO", label: "Cuerpo Físico", short: "CU" },
    { id: "MENTAL", label: "Mente", short: "MN" },
    { id: "EMOCIONAL", label: "Emociones", short: "EM" },
    { id: "FINANCIERO", label: "Abundancia", short: "AB" },
    { id: "VECTOR", label: "Propósito", short: "PR" },
    { id: "ORBITA", label: "Vínculos", short: "VI" },
]
export const SCORE_VALUES = [0, 25, 50, 75, 100]
export const AC = "#00e5ff"
export const GOLD = "#D4A843"

export const PILAR_LABELS: Record<string, string> = {
    fisico: "Cuerpo",
    mental: "Mente",
    emocional: "Emociones",
    financiero: "Abundancia",
    vector: "Propósito",
    orbita: "Vínculos",
}
export const PILAR_ORDER = [
    "fisico",
    "mental",
    "emocional",
    "financiero",
    "vector",
    "orbita",
]

/* ═══ HELPERS ═══ */
export const hx = (hex: string, a = 1) => {
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

export async function rpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any> = {}
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

// Perfil propio verificado vía edge `me` (clerk_user_id del token firmado de
// Clerk). Reemplaza el self-lookup al oráculo get_profile_by_clerk_id.
//
// 🜂 v1.7 — DEVUELVE EL MOTIVO, NO SOLO EL RESULTADO. `fetchMe` colapsaba
// TODO a `null`: sin token todavía, red caída, edge sin desplegar y "el
// servidor contestó y no sos admin" eran indistinguibles. Quien la consumía
// leía ese null como "no tiene permiso" y se rendía. Esta versión separa las
// dos cosas que nunca debieron mezclarse: hubo respuesta del servidor, o no
// la hubo. `fetchMe` se conserva idéntica para todo lo que ya la usa.
export type MeResultado = {
    /** true SOLO si el servidor contestó de verdad. */
    respondio: boolean
    perfil: any | null
    motivo: "" | "sin_token" | "sin_red" | "servidor"
}

export async function fetchMeDetallado(
    url: string,
    key: string
): Promise<MeResultado> {
    if (!url || !key)
        return { respondio: false, perfil: null, motivo: "sin_token" }
    let token: string | null = null
    try {
        token = await (window as any).Clerk?.session?.getToken?.()
    } catch {
        token = null
    }
    /* Sin token no hay pregunta que hacer: Clerk todavía está despertando
       (o no hay sesión). NO es una negativa. */
    if (!token) return { respondio: false, perfil: null, motivo: "sin_token" }
    try {
        const r = await fetch(`${url}/functions/v1/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token }),
        })
        if (!r.ok)
            return { respondio: false, perfil: null, motivo: "servidor" }
        return { respondio: true, perfil: await r.json(), motivo: "" }
    } catch {
        return { respondio: false, perfil: null, motivo: "sin_red" }
    }
}

export async function fetchMe(url: string, key: string) {
    const r = await fetchMeDetallado(url, key)
    return r.respondio ? r.perfil : null
}

// Acción admin verificada vía gateway `admin-action` (token de Clerk → el
// servidor inyecta el p_admin_clerk_id verificado, ignora el del cliente).
// Reemplaza las llamadas directas a las RPC admin_* con p_admin_clerk_id.
export async function adminAction(
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

/* ════════════════════════════════════════════════════════════════════
   MEMORIA DEL MOTOR — una pestaña se carga UNA vez por visita.
   ════════════════════════════════════════════════════════════════════
   🜂 Cambiar de pestaña y volver disparaba de nuevo cada consulta: entrar a
   Soporte, pasar a Bitácora y regresar mostraba "Cargando…" tres veces por lo
   mismo. Con decenas de nodos eso es ruido; con miles es una cuenta.

   Ahora el resultado vive en memoria mientras la página esté abierta y la
   pestaña vuelve a pintar al instante con lo que ya tenía. El botón
   "Recargar" de cada panel pide `{ force: true }` y trae datos frescos; y
   recargar la página entera limpia todo, que es el gesto que ya existe para
   "quiero ver todo de nuevo".

   Los FALLOS no se guardan: un tropiezo de red no puede quedarse pegado como
   si fuera el estado real (mismo principio que "un transitorio no es una
   negativa").

   El objeto se devuelve por referencia — quien lo consuma no debe mutarlo. */
const _motorCache = new Map<string, any>()

export async function adminActionCached(
    url: string,
    key: string,
    action: string,
    params: Record<string, any> = {},
    opts: { force?: boolean } = {}
) {
    const k = `${action}::${JSON.stringify(params ?? {})}`
    if (!opts.force && _motorCache.has(k)) return _motorCache.get(k)
    const r = await adminAction(url, key, action, params)
    if (r !== null && r !== undefined && !(r as any)?.error) {
        _motorCache.set(k, r)
    } else {
        _motorCache.delete(k)
    }
    return r
}

/* Misma memoria para las lecturas que NO pasan por el gateway (RPC pública
   directa, como `get_app_release` o `get_app_flag`). La llave lleva el prefijo
   `rpc:` para que jamás choque con una acción del gateway que se llame igual;
   quien quiera olvidarla pide `motorCacheClear("rpc:get_app_release")`.

   Beneficio extra: dos paneles distintos que leen lo MISMO (el editor de la
   versión y el panel de bloqueo, ambos sobre `get_app_release`) hacen una sola
   consulta entre los dos. */
export async function rpcCached(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any> = {},
    opts: { force?: boolean } = {}
) {
    const k = `rpc:${fn}::${JSON.stringify(params ?? {})}`
    if (!opts.force && _motorCache.has(k)) return _motorCache.get(k)
    const r = await rpc(url, key, fn, params)
    if (r !== null && r !== undefined && !(r as any)?.error) {
        _motorCache.set(k, r)
    } else {
        _motorCache.delete(k)
    }
    return r
}

/* Olvida lo guardado. Sin argumento borra todo; con `prefix` solo lo de esa
   familia (ej. tras responder un caso, `motorCacheClear("admin_get_support")`
   obliga a releer la bandeja sin tocar el resto del Motor). */
export function motorCacheClear(prefix?: string) {
    if (!prefix) {
        _motorCache.clear()
        return
    }
    for (const k of Array.from(_motorCache.keys())) {
        if (k.startsWith(prefix)) _motorCache.delete(k)
    }
}

export function norm(v: any): any {
    if (!v) return v
    if (typeof v === "string") {
        try {
            return JSON.parse(v)
        } catch {
            return v
        }
    }
    return v
}

/* ═══ HOOKS ═══ */
export function useIsMobile() {
    const [m, setM] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const check = () => {
            const ua =
                typeof navigator !== "undefined" ? navigator.userAgent : ""
            const uaMobile = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
            setM(uaMobile || window.innerWidth < 768)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])
    return m
}

export function useScrollHideHeader(enabled: boolean) {
    useEffect(() => {
        if (!enabled || typeof document === "undefined") return
        let root: HTMLElement | null = null
        let cancelled = false
        const onScroll = () => {
            if (!root) return
            if (root.scrollTop > 60)
                document.body.setAttribute("data-rsv-mi-scrolled", "1")
            else document.body.removeAttribute("data-rsv-mi-scrolled")
        }
        const tryAttach = (tries = 0) => {
            if (cancelled) return
            const el = document.querySelector(".mi-wrap") as HTMLElement | null
            if (!el) {
                if (tries < 20) setTimeout(() => tryAttach(tries + 1), 80)
                return
            }
            root = el
            onScroll()
            el.addEventListener("scroll", onScroll, { passive: true })
        }
        tryAttach()
        return () => {
            cancelled = true
            if (root) root.removeEventListener("scroll", onScroll)
            document.body.removeAttribute("data-rsv-mi-scrolled")
        }
    }, [enabled])
}

/* ═══════════════════════════════════════════════════════════════════
   🜂 v1.7 — EL PORTÓN DE ARQUITECTO DEJA DE FALLAR (Zak 2026-08-04: "me
   meto al Motor y dice que solo los administradores; tengo que recargar
   una y otra vez hasta que entra").

   La versión anterior hacía UN SOLO intento a los 300ms del montaje y
   cualquier tropiezo lo leía como "no tenés permiso", para siempre. Tres
   carreras distintas caían en el mismo mensaje falso:

     1. `window.Clerk.user.id` todavía no existía a los 300ms (Clerk
        arranca por su cuenta) → se rendía sin haber preguntado nada.
     2. `Clerk.session.getToken()` aún no daba token (la sesión se estaba
        hidratando) → `fetchMe` devolvía null → "no sos admin".
     3. Un tropiezo de red o del edge → null → "no sos admin".

   Ninguna de las tres es una negativa: son un "todavía no sé". Ahora se
   INSISTE con esperas crecientes hasta tener una respuesta REAL del
   servidor, y solo el servidor puede decir que no. Mientras tanto la
   pantalla sigue diciendo "Verificando acceso", nunca "Acceso denegado".

   Y si de plano no se pudo verificar, se dice ESO y con un botón para
   reintentar — un fallo que no se puede leer obliga a recargar a ciegas,
   que es exactamente lo que Zak venía haciendo.
   ═══════════════════════════════════════════════════════════════════ */

/** Esperas crecientes, ~14s en total. Cubre de sobra el arranque de Clerk
    (normalmente <2s) sin dejar la pantalla colgada para siempre. */
const REINTENTOS_ADMIN = [
    0, 180, 320, 500, 750, 1100, 1500, 2000, 2600, 3200, 4000,
]

export type MotivoAdmin = "" | "sin_sesion" | "no_admin" | "sin_respuesta"

export function useAdminAuth(url: string, key: string) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState("")
    const [motivo, setMotivo] = useState<MotivoAdmin>("")
    /* Sube de número para forzar una verificación nueva (botón reintentar,
       cambio de sesión, volver a la pestaña). */
    const [intentoManual, setIntentoManual] = useState(0)

    const reintentar = useCallback(() => setIntentoManual((n) => n + 1), [])

    useEffect(() => {
        let cancelado = false
        let timer: any = null
        setLoading(true)
        setMotivo("")

        const verificar = async (paso: number) => {
            if (cancelado) return

            const clerk = (window as any).Clerk
            const clerkId = clerk?.user?.id

            /* SESIÓN CERRADA DE VERDAD: Clerk ya terminó de cargar y no hay
               nadie dentro. Eso sí es definitivo, no se insiste. */
            if (clerk?.loaded === true && !clerkId) {
                setIsAdmin(false)
                setMotivo("sin_sesion")
                setLoading(false)
                return
            }

            if (clerkId && !cancelado) setUserId(clerkId)

            /* Con id y llaves, se pregunta. Sin ellos todavía, se espera:
               no hay pregunta que hacer aún. */
            if (clerkId && url && key) {
                const r = await fetchMeDetallado(url, key)
                if (cancelado) return
                if (r.respondio) {
                    /* Única fuente de verdad: el servidor habló. */
                    setIsAdmin(r.perfil?.is_admin === true)
                    setMotivo(r.perfil?.is_admin === true ? "" : "no_admin")
                    setLoading(false)
                    return
                }
            }

            /* Todavía no sabemos. Se insiste hasta agotar las esperas. */
            const siguiente = paso + 1
            if (siguiente < REINTENTOS_ADMIN.length) {
                timer = setTimeout(
                    () => verificar(siguiente),
                    REINTENTOS_ADMIN[siguiente]
                )
                return
            }
            /* Se acabaron los intentos SIN una respuesta del servidor. Eso
               no es "no tenés permiso": es "no pudimos preguntar". */
            setIsAdmin(false)
            setMotivo("sin_respuesta")
            setLoading(false)
        }

        timer = setTimeout(() => verificar(0), REINTENTOS_ADMIN[0])
        return () => {
            cancelado = true
            if (timer) clearTimeout(timer)
        }
    }, [url, key, intentoManual])

    /* Si la sesión cambia (entrar, salir, refrescar el pase) o se vuelve a
       la pestaña sin haber podido verificar, se pregunta de nuevo. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const alCambiar = () => setIntentoManual((n) => n + 1)
        const alVolver = () => {
            if (!document.hidden && !isAdmin) setIntentoManual((n) => n + 1)
        }
        window.addEventListener("rsv-auth-changed", alCambiar)
        document.addEventListener("visibilitychange", alVolver)
        return () => {
            window.removeEventListener("rsv-auth-changed", alCambiar)
            document.removeEventListener("visibilitychange", alVolver)
        }
    }, [isAdmin])

    return { isAdmin, loading, userId, motivo, reintentar }
}

/* ═══ COMPONENTE COMPARTIDO — TripulanteHex ═══
   Nodo hexagonal del tripulante — idéntico para todos los usuarios,
   la individualidad vive en el nombre + el detalle al pickar. */
export function TripulanteHex() {
    return (
        <svg
            className="mi-trip-hex-svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Marco exterior rotante con 6 vértices de pilar */}
            <g className="mi-trip-hex-outer">
                <polygon
                    points="50,6 88,28 88,72 50,94 12,72 12,28"
                    fill="none"
                    stroke={AC}
                    strokeWidth="1.6"
                    opacity="0.85"
                />
                {[
                    [50, 6],
                    [88, 28],
                    [88, 72],
                    [50, 94],
                    [12, 72],
                    [12, 28],
                ].map(([x, y], i) => (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2.2"
                        fill={AC}
                        opacity="0.9"
                    />
                ))}
                <path
                    d="M50,50 L50,6 M50,50 L88,28 M50,50 L88,72 M50,50 L50,94 M50,50 L12,72 M50,50 L12,28"
                    stroke={AC}
                    strokeWidth="0.6"
                    opacity="0.25"
                />
            </g>
            {/* Hex interno contra-rotante */}
            <g className="mi-trip-hex-inner">
                <polygon
                    points="50,28 69,39 69,61 50,72 31,61 31,39"
                    fill={hx(AC, 0.03)}
                    stroke={AC}
                    strokeWidth="0.9"
                    opacity="0.55"
                />
            </g>
            {/* Núcleo pulsante */}
            <g className="mi-trip-hex-core">
                <circle cx="50" cy="50" r="8" fill={hx(AC, 0.15)} />
                <circle cx="50" cy="50" r="4" fill={AC} opacity="0.85" />
                <circle cx="50" cy="50" r="1.8" fill="#fff" opacity="0.95" />
            </g>
        </svg>
    )
}

/* ═══ CSS GLOBAL DEL MOTOR DE INTERVENCIÓN ═══ */
export const CSS = `
.mi-wrap{font-family:'Inter',sans-serif;color:#fff;position:fixed;inset:0;z-index:40;padding:110px 40px 120px;overflow-y:auto;overflow-x:hidden;background:transparent;scrollbar-width:none;-ms-overflow-style:none}
.mi-wrap::-webkit-scrollbar{display:none}
.mi-wrap *{box-sizing:border-box;scrollbar-width:none;-ms-overflow-style:none}
.mi-wrap *::-webkit-scrollbar{display:none}
.mi-title{position:fixed;top:14px;left:0;right:0;z-index:55;font-size:15px;font-weight:200;letter-spacing:0.35em;text-transform:uppercase;text-align:center;margin:0;color:${AC};text-shadow:0 0 12px rgba(0,194,255,0.3);pointer-events:none}
.mi-title-sub{position:fixed;top:36px;left:0;right:0;z-index:55;font-size:8px;font-weight:400;letter-spacing:0.2em;text-transform:uppercase;text-align:center;color:#fff;margin:0;pointer-events:none}
.mi-grid{display:flex;gap:24px;max-width:1400px;margin:0 auto}
.mi-rail{display:flex;flex-direction:column;gap:6px;width:180px;flex-shrink:0}
.mi-rail-btn{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#fff;font-family:inherit;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none;text-align:left}
.mi-rail-btn:hover{border-color:${hx(AC, 0.4)};color:#fff}
.mi-rail-btn.active{border-color:${hx(AC, 0.5)};background:${hx(AC, 0.06)};color:${AC}}
.mi-main{flex:1;min-width:0}
.mi-tabs{display:flex;gap:6px;margin:0 auto 28px;justify-content:center;flex-wrap:wrap;max-width:1400px}
.mi-tab{padding:11px 32px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none}
.mi-tab:hover{border-color:${hx(AC, 0.4)};color:#fff}
.mi-tab.active{border-color:${hx(AC, 0.5)};background:${hx(AC, 0.06)};color:${AC}}
.mi-card{padding:20px 24px;border-radius:16px;background:rgba(16,22,40,0.92);border:1px solid rgba(255,255,255,0.14);margin-bottom:16px;position:relative}
.mi-card:hover{border-color:rgba(255,255,255,0.22)}
.mi-label{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin:0 0 6px}
.mi-input{width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.08);color:#fff;font-family:inherit;font-size:13px;font-weight:400;outline:none;transition:border-color 0.3s;resize:vertical}
.mi-input:focus{border-color:${hx(AC, 0.45)}}
.mi-input::placeholder{color:rgba(255,255,255,0.4)}
.mi-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:1px solid ${hx(AC, 0.35)};background:${hx(AC, 0.1)};color:${AC};font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none}
.mi-btn:hover{background:${hx(AC, 0.1)};border-color:${hx(AC, 0.4)}}
.mi-btn-gold{border-color:rgba(200,164,78,0.2);background:rgba(200,164,78,0.04);color:${GOLD}}
.mi-btn-gold:hover{background:rgba(200,164,78,0.1);border-color:rgba(200,164,78,0.4)}
.mi-btn-red{border-color:rgba(255,100,100,0.2);background:rgba(255,100,100,0.04);color:rgba(255,120,120,0.7)}
.mi-btn-red:hover{background:rgba(255,100,100,0.1);border-color:rgba(255,100,100,0.4)}
.mi-badge{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;border-radius:8px;background:${hx(AC, 0.08)};border:1px solid ${hx(AC, 0.15)};color:${AC};font-size:11px;font-weight:600;letter-spacing:0.05em}
.mi-opt{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.03);margin-bottom:6px}
.mi-opt-val{min-width:36px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:${AC};background:${hx(AC, 0.06)};border:1px solid ${hx(AC, 0.12)};flex-shrink:0;margin-top:2px}
.mi-save-bar{position:fixed;bottom:0;left:0;right:0;padding:16px 40px;background:linear-gradient(0deg,rgba(0,0,0,0.9),rgba(0,0,0,0.6),transparent);display:flex;justify-content:center;gap:12px;z-index:100}
.mi-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:12px 28px;border-radius:10px;background:rgba(0,20,40,0.95);border:1px solid ${hx(AC, 0.3)};color:${AC};font-size:12px;letter-spacing:0.1em;z-index:200;pointer-events:none}

.mi-title,.mi-title-sub{transition:opacity 0.28s ease,transform 0.28s ease}
body[data-rsv-mi-scrolled="1"] .mi-title,
body[data-rsv-mi-scrolled="1"] .mi-title-sub{opacity:0;transform:translateY(-14px);pointer-events:none}
@media(max-width:767px){
  .mi-wrap{padding:18px 14px 100px !important}
  .mi-title{position:relative !important;top:auto !important;left:auto !important;right:auto !important;font-size:13px !important;letter-spacing:0.22em !important;text-align:left !important;padding-right:56px !important;margin:0 0 4px 0 !important;pointer-events:auto !important;opacity:1 !important;transform:none !important}
  .mi-title-sub{position:relative !important;top:auto !important;left:auto !important;right:auto !important;font-size:8px !important;letter-spacing:0.16em !important;text-align:left !important;padding-right:56px !important;margin:0 0 22px 0 !important;pointer-events:auto !important;opacity:1 !important;transform:none !important}
  .mi-grid{flex-direction:column !important;gap:14px !important}
  .mi-rail{flex-direction:row !important;width:100% !important;overflow-x:auto !important;overflow-y:hidden !important;padding:4px 2px 10px !important;gap:8px !important;scroll-snap-type:x mandatory !important}
  .mi-rail-btn{flex-shrink:0 !important;min-width:170px !important;scroll-snap-align:start !important;padding:12px 14px !important}
  .mi-stats-panel{display:none !important}
  .mi-main{width:100% !important}
  .mi-tabs{flex-wrap:wrap !important;gap:6px !important;justify-content:flex-start !important;margin-bottom:18px !important}
  .mi-tab{padding:8px 14px !important;font-size:10px !important;letter-spacing:0.12em !important}
  .mi-save-bar{padding:12px 14px !important;flex-wrap:wrap !important}
  .mi-trip-pilares{grid-template-columns:1fr !important}
  .mi-trip-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr)) !important;gap:12px !important}
  .mi-trip-hero-count{font-size:32px !important}
}

/* ═══ TRIPULANTES ACTIVOS ═══ */
.mi-trip-hero{display:flex;align-items:baseline;justify-content:space-between;margin:0 0 18px;padding:0 2px}
.mi-trip-filters{display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin:0 0 22px;padding:14px 18px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
.mi-trip-filter-group{display:flex;align-items:center;gap:8px}
.mi-trip-filter-label{font-size:9px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#fff;opacity:0.55;margin-right:2px}
.mi-trip-filter-pill{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);background:transparent;color:#fff;font-family:inherit;font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.22s;outline:none}
.mi-trip-filter-pill:hover{border-color:${hx(AC, 0.4)};color:${AC}}
.mi-trip-filter-pill.active{border-color:${hx(AC, 0.55)};background:${hx(AC, 0.08)};color:${AC};box-shadow:0 0 10px ${hx(AC, 0.18)}}
.mi-trip-filter-pill.gold.active{border-color:rgba(232,198,90,0.65);background:rgba(232,198,90,0.1);color:${GOLD};box-shadow:0 0 10px rgba(232,198,90,0.22)}
.mi-trip-filter-clear{margin-left:auto;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#fff;opacity:0.55;background:transparent;border:none;cursor:pointer;padding:6px 4px}
.mi-trip-filter-clear:hover{opacity:1;color:${AC}}
@media(max-width:767px){
  .mi-trip-filters{padding:10px 12px;gap:10px}
  .mi-trip-filter-group{flex-wrap:wrap}
  .mi-trip-filter-clear{margin-left:0;width:100%;text-align:right}
}
.mi-trip-hero-count{font-size:40px;font-weight:100;color:${AC};line-height:1;letter-spacing:-0.02em;text-shadow:0 0 20px rgba(0,194,255,0.3)}
.mi-trip-hero-label{font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#fff;margin-left:10px}
.mi-trip-hero-sub{font-size:10px;font-weight:400;letter-spacing:0.18em;text-transform:uppercase;color:#fff}
.mi-trip-hero-refresh{width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.22s;flex-shrink:0;align-self:center;padding:0}
.mi-trip-hero-refresh:hover:not(:disabled){border-color:${hx(AC, 0.5)};color:${AC};box-shadow:0 0 14px ${hx(AC, 0.25)}}
.mi-trip-hero-refresh:disabled{cursor:wait;opacity:0.6}
.mi-trip-hero-refresh.spinning svg{animation:mi-spin 0.85s linear infinite}
.mi-trip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:18px;padding:2px}
.mi-trip-card{position:relative;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 10px;border-radius:16px;border:1px solid ${hx(AC, 0.1)};background:linear-gradient(160deg,rgba(3,11,22,0.85),rgba(1,6,16,0.95));cursor:pointer;transition:transform 0.28s cubic-bezier(0.16,1,0.3,1),border-color 0.28s,box-shadow 0.28s;overflow:hidden;outline:none;-webkit-tap-highlight-color:transparent}
.mi-trip-card:focus,.mi-trip-card:focus-visible,.mi-trip-card:active{outline:none;box-shadow:none}
.mi-trip-card:focus-visible{box-shadow:0 0 0 1px ${hx(AC, 0.4)}}
.mi-trip-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,${hx(AC, 0.07)},transparent 62%);opacity:0;transition:opacity 0.35s}
.mi-trip-card::after{content:"";position:absolute;top:-60%;left:-20%;right:-20%;height:60%;background:linear-gradient(180deg,transparent,${hx(AC, 0.18)},transparent);transform:translateY(0);opacity:0;pointer-events:none}
.mi-trip-card:hover{transform:translateY(-3px);border-color:${hx(AC, 0.38)};box-shadow:0 12px 36px rgba(0,194,255,0.18),0 0 0 1px ${hx(AC, 0.15)}}
.mi-trip-card:hover::before{opacity:1}
.mi-trip-card:hover::after{animation:mi-trip-scan 1.1s ease-in-out forwards}
@keyframes mi-trip-scan{0%{transform:translateY(0);opacity:0}18%{opacity:1}100%{transform:translateY(320%);opacity:0}}
.mi-trip-card.golden{
    border:1.5px solid rgba(232,198,90,0.7);
    background:linear-gradient(160deg,rgba(80,58,20,0.92) 0%,rgba(58,42,16,0.95) 45%,rgba(95,68,24,0.92) 100%);
    box-shadow:0 0 30px rgba(232,198,90,0.32),0 12px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,220,140,0.22)
}
.mi-trip-card.golden::before{
    background:radial-gradient(circle at 50% 30%,rgba(255,220,140,0.22),transparent 65%);
    opacity:1
}
.mi-trip-card.golden::after{
    content:"";
    position:absolute;
    top:0;left:-110%;right:auto;
    width:90%;height:100%;
    background:linear-gradient(115deg,transparent 30%,rgba(255,220,140,0.18) 48%,rgba(255,255,255,0.22) 50%,rgba(255,220,140,0.18) 52%,transparent 70%);
    transform:translateX(0);
    opacity:1;
    animation:mi-trip-gold-shimmer 4.6s ease-in-out infinite;
    pointer-events:none
}
@keyframes mi-trip-gold-shimmer{
    0%{transform:translateX(0)}
    50%{transform:translateX(220%)}
    100%{transform:translateX(220%)}
}
.mi-trip-card.golden:hover{
    transform:translateY(-3px);
    border-color:rgba(255,220,140,0.85);
    box-shadow:0 0 48px rgba(232,198,90,0.5),0 18px 50px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,220,140,0.32)
}
.mi-trip-card.golden:hover::before{opacity:1}
.mi-trip-card.golden:hover::after{
    animation:mi-trip-gold-shimmer 3s ease-in-out infinite
}
.mi-trip-card.golden .mi-trip-hex-wrap::before{
    background:radial-gradient(circle,rgba(232,198,90,0.4),transparent 65%)
}
.mi-trip-card.golden .mi-trip-name{
    color:#FFE9A8;
    text-shadow:0 0 10px rgba(232,198,90,0.5)
}
.mi-trip-card.golden .mi-trip-meta{color:rgba(255,233,168,0.85)}
.mi-trip-card.golden .mi-trip-meta-dot{background:#F5D98C;box-shadow:0 0 10px rgba(245,217,140,0.7)}
.mi-trip-card.golden .mi-trip-meta-dot.idle{background:rgba(245,217,140,0.7);box-shadow:0 0 8px rgba(245,217,140,0.5)}
.mi-trip-card.golden .mi-trip-meta-dot.cold{background:rgba(245,217,140,0.55);box-shadow:none}
.mi-trip-card.cyan{
    border:1.5px solid rgba(0,194,255,0.6);
    background:linear-gradient(160deg,rgba(8,42,72,0.92) 0%,rgba(6,30,54,0.95) 45%,rgba(10,48,82,0.92) 100%);
    box-shadow:0 0 30px rgba(0,194,255,0.32),0 12px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(140,220,255,0.22)
}
.mi-trip-card.cyan::before{
    background:radial-gradient(circle at 50% 30%,rgba(140,220,255,0.22),transparent 65%);
    opacity:1
}
.mi-trip-card.cyan::after{
    content:"";
    position:absolute;
    top:0;left:-110%;right:auto;
    width:90%;height:100%;
    background:linear-gradient(115deg,transparent 30%,rgba(140,220,255,0.18) 48%,rgba(255,255,255,0.22) 50%,rgba(140,220,255,0.18) 52%,transparent 70%);
    transform:translateX(0);
    opacity:1;
    animation:mi-trip-cyan-shimmer 4.6s ease-in-out infinite;
    pointer-events:none
}
@keyframes mi-trip-cyan-shimmer{
    0%{transform:translateX(0)}
    50%{transform:translateX(220%)}
    100%{transform:translateX(220%)}
}
.mi-trip-card.cyan:hover{
    transform:translateY(-3px);
    border-color:rgba(140,220,255,0.85);
    box-shadow:0 0 48px rgba(0,194,255,0.5),0 18px 50px rgba(0,0,0,0.65),inset 0 1px 0 rgba(140,220,255,0.32)
}
.mi-trip-card.cyan:hover::before{opacity:1}
.mi-trip-card.cyan:hover::after{
    animation:mi-trip-cyan-shimmer 3s ease-in-out infinite
}
.mi-trip-card.cyan .mi-trip-hex-wrap::before{
    background:radial-gradient(circle,rgba(0,194,255,0.4),transparent 65%)
}
.mi-trip-card.cyan .mi-trip-name{
    color:#D6F5FF;
    text-shadow:0 0 10px rgba(0,194,255,0.5)
}
.mi-trip-card.cyan .mi-trip-meta{color:rgba(214,245,255,0.85)}
.mi-trip-card.cyan .mi-trip-meta-dot{background:#8CDCFF;box-shadow:0 0 10px rgba(140,220,255,0.7)}
.mi-trip-card.cyan .mi-trip-meta-dot.idle{background:rgba(140,220,255,0.7);box-shadow:0 0 8px rgba(140,220,255,0.5)}
.mi-trip-card.cyan .mi-trip-meta-dot.cold{background:rgba(140,220,255,0.55);box-shadow:none}
.mi-trip-hex-wrap{position:relative;width:74px;height:74px;display:flex;align-items:center;justify-content:center}
.mi-trip-hex-wrap::before{content:"";position:absolute;inset:-10%;border-radius:50%;background:radial-gradient(circle,${hx(AC, 0.25)},transparent 65%);opacity:0.7;filter:blur(8px)}
.mi-trip-hex-svg{width:100%;height:100%;position:relative;z-index:1}
.mi-trip-hex-outer{transform-origin:50% 50%;animation:mi-trip-rot-cw 22s linear infinite}
.mi-trip-hex-inner{transform-origin:50% 50%;animation:mi-trip-rot-ccw 14s linear infinite}
.mi-trip-hex-core{transform-origin:50% 50%;animation:mi-trip-pulse 2.4s ease-in-out infinite}
@keyframes mi-trip-rot-cw{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes mi-trip-rot-ccw{from{transform:rotate(360deg)}to{transform:rotate(0)}}
@keyframes mi-trip-pulse{0%,100%{transform:scale(1);opacity:0.85}50%{transform:scale(1.15);opacity:1}}
.mi-trip-name{font-size:11px;font-weight:500;letter-spacing:0.08em;color:#fff;text-align:center;line-height:1.3;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mi-trip-meta{display:flex;align-items:center;gap:6px;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#fff;font-weight:500}
.mi-trip-meta-dot{width:5px;height:5px;border-radius:50%;background:${AC};box-shadow:0 0 8px ${AC}}
.mi-trip-meta-dot.idle{background:rgba(200,164,78,0.55);box-shadow:0 0 6px rgba(200,164,78,0.4)}
.mi-trip-meta-dot.cold{background:rgba(255,120,120,0.45);box-shadow:none}

/* ── DETAIL MODAL ── */
.mi-trip-backdrop{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(ellipse at center,rgba(2,10,22,0.92),rgba(0,0,0,0.98));backdrop-filter:blur(30px) saturate(140%);-webkit-backdrop-filter:blur(30px) saturate(140%);display:flex;align-items:stretch;justify-content:center;padding:0;overflow-y:auto;overflow-x:hidden;animation:mi-trip-fadein 0.3s ease-out;scrollbar-width:none;-ms-overflow-style:none}
.mi-trip-backdrop::-webkit-scrollbar{display:none;width:0;height:0}
@keyframes mi-trip-fadein{from{opacity:0}to{opacity:1}}
/* 🜂 v2.1 — LA FICHA DEJA DE VIVIR EN UNA CAJA (Zak 2026-08-09, con captura:
   "hay un corte en el borde superior e inferior donde se cortan los elementos;
   hay un marco y hay que quitarlo"). El marco redondeado con su borde encerraba
   un cuerpo que SCROLLEA, así que el contenido entraba y salía cortado justo
   sobre una línea dibujada: el ojo lo leía como piezas mutiladas, no como una
   página que sigue. Fuera el borde, fuera las esquinas redondeadas y fuera el
   colchón de 64px contra la pantalla: la ficha ocupa el alto completo y el
   contenido corre hasta los bordes, como cualquier página. Se conserva el
   respiro lateral (donde no hay corte que disimular) y el fondo, que es lo que
   la separa del Motor por detrás. */
.mi-trip-modal{position:relative;display:flex;flex-direction:column;width:100%;max-width:1400px;max-height:100vh;height:100vh;padding:26px 48px 0;border-radius:0;background:linear-gradient(165deg,rgba(4,14,28,0.98),rgba(1,8,18,0.99));border:none;box-shadow:0 0 90px rgba(0,194,255,0.10);animation:mi-trip-rise 0.45s cubic-bezier(0.16,1,0.3,1)}
.mi-trip-scrollbody{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-ms-overflow-style:none;scroll-behavior:smooth}
/* 🜂 v2.1 — EL CONTENIDO SE DISUELVE, NO SE GUILLOTINA. El cuerpo cortaba las
   tarjetas a filo contra su borde superior, justo donde flotan los controles
   del modal: media tarjeta cortada ahí se lee como un error de render, no como
   scroll.

   Se hace con DOS FRANJAS superpuestas, no con mask-image. Una máscara habría
   sido más corta de escribir, pero convierte al cuerpo en bloque contenedor de
   sus descendientes position:fixed, y las TRES tarjetas de confirmación
   (.mi-trip-confirm-overlay, fixed inset:0) viven dentro del cuerpo: habrían
   quedado encerradas y atenuadas. Las franjas no tocan el posicionamiento.

   Van sobre el contenido (z-index 2) pero por debajo de la vista expandida
   (10) y de las confirmaciones (30), y MI_Detail las monta solo cuando queda
   algo fuera de vista de ese lado: en reposo no se ve nada. */
.mi-trip-bodywrap{position:relative;flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.mi-trip-fade{position:absolute;left:0;right:0;height:38px;pointer-events:none;z-index:2}
.mi-trip-fade-t{top:0;background:linear-gradient(to bottom,rgba(4,14,28,0.99) 0%,rgba(4,14,28,0.82) 45%,rgba(4,14,28,0) 100%)}
.mi-trip-fade-b{bottom:0;background:linear-gradient(to top,rgba(1,8,18,0.99) 0%,rgba(1,8,18,0.82) 45%,rgba(1,8,18,0) 100%)}
.mi-trip-modal.golden .mi-trip-fade-t{background:linear-gradient(to bottom,rgba(34,25,9,0.99) 0%,rgba(34,25,9,0.82) 45%,rgba(34,25,9,0) 100%)}
.mi-trip-modal.golden .mi-trip-fade-b{background:linear-gradient(to top,rgba(38,27,10,0.99) 0%,rgba(38,27,10,0.82) 45%,rgba(38,27,10,0) 100%)}
.mi-trip-modal.cyan .mi-trip-fade-t{background:linear-gradient(to bottom,rgba(7,26,49,0.99) 0%,rgba(7,26,49,0.82) 45%,rgba(7,26,49,0) 100%)}
.mi-trip-modal.cyan .mi-trip-fade-b{background:linear-gradient(to top,rgba(6,24,46,0.99) 0%,rgba(6,24,46,0.82) 45%,rgba(6,24,46,0) 100%)}
.mi-trip-scrollbody::-webkit-scrollbar{display:none;width:0;height:0}
.mi-trip-cols{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start;margin-top:30px}
.mi-trip-col{min-width:0;display:flex;flex-direction:column}
@media(max-width:980px){.mi-trip-cols{grid-template-columns:1fr;gap:32px}}
@keyframes mi-trip-rise{from{opacity:0;transform:translateY(28px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.mi-trip-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all 0.2s;z-index:2}
.mi-trip-close:hover{border-color:${hx(AC, 0.5)};color:${AC};transform:rotate(90deg)}
.mi-trip-refresh{position:absolute;top:16px;right:56px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all 0.22s;z-index:2}
.mi-trip-refresh:hover:not(:disabled){border-color:${hx(AC, 0.5)};color:${AC}}
.mi-trip-refresh:disabled{cursor:wait;opacity:0.6}
.mi-trip-refresh.spinning svg{animation:mi-spin 0.85s linear infinite}
@keyframes mi-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.mi-trip-delete{position:absolute;top:16px;right:96px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,100,100,0.22);background:transparent;color:rgba(255,120,120,0.7);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:all 0.22s;z-index:2}
.mi-trip-delete:hover:not(:disabled){border-color:rgba(255,100,100,0.6);background:rgba(255,100,100,0.08);color:#ff7878;box-shadow:0 0 14px rgba(255,100,100,0.22)}
.mi-trip-delete:disabled{cursor:wait;opacity:0.5}
.mi-trip-confirm-overlay{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(20,4,4,0.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);animation:mi-trip-fadein 0.22s ease-out}
.mi-trip-confirm-card{width:min(440px,calc(100% - 48px));padding:28px 30px 24px;border-radius:18px;border:1.5px solid rgba(255,100,100,0.45);background:radial-gradient(ellipse at top,rgba(60,8,8,0.92),rgba(22,4,4,0.96));box-shadow:0 24px 80px rgba(0,0,0,0.6),0 0 50px rgba(255,100,100,0.18),inset 0 0 30px rgba(255,100,100,0.06);text-align:center}
.mi-trip-confirm-icon{display:flex;align-items:center;justify-content:center;width:64px;height:64px;margin:0 auto 14px;border-radius:50%;background:rgba(255,100,100,0.10);border:1px solid rgba(255,100,100,0.35);color:#ff7878;box-shadow:0 0 24px rgba(255,100,100,0.18)}
.mi-trip-confirm-title{font-size:17px;font-weight:500;letter-spacing:0.02em;color:#ffe5e5;margin-bottom:10px}
.mi-trip-confirm-body{font-size:13px;line-height:1.58;color:rgba(255,220,220,0.82);margin-bottom:20px;font-weight:300}
.mi-trip-confirm-body strong{color:#ffd0d0;font-weight:500}
.mi-trip-confirm-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.mi-trip-confirm-cancel{all:unset;cursor:pointer;padding:10px 20px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);color:#fff;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-family:'Inter',sans-serif;transition:all 0.22s}
.mi-trip-confirm-cancel:hover:not(:disabled){border-color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.08)}
.mi-trip-confirm-cancel:disabled{opacity:0.5;cursor:wait}
.mi-trip-confirm-ok{all:unset;cursor:pointer;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#ff5757 0%,#ff7a7a 50%,#ff5454 100%);color:#1a0404;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;font-family:'Inter',sans-serif;box-shadow:0 6px 22px rgba(255,80,80,0.35);transition:all 0.22s}
.mi-trip-confirm-ok:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 30px rgba(255,80,80,0.55)}
.mi-trip-confirm-ok:disabled{opacity:0.6;cursor:wait;transform:none}
.mi-trip-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:56px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);background:rgba(0,15,30,0.4);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:28px;font-weight:200;line-height:1;transition:all 0.25s;z-index:2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.mi-trip-nav:hover{border-color:${hx(AC, 0.5)};background:${hx(AC, 0.1)};color:${AC};box-shadow:0 0 18px ${hx(AC, 0.3)}}
.mi-trip-nav.prev{left:-22px}
.mi-trip-nav.next{right:-22px}
.mi-trip-pos{position:absolute;top:22px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#fff;pointer-events:none;z-index:2}
@media(max-width:640px){.mi-trip-nav.prev{left:8px}.mi-trip-nav.next{right:8px}}
.mi-trip-scan{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.04)}
.mi-trip-scan-hex{position:relative;width:140px;height:140px}
.mi-trip-scan-hex::before{content:"";position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(circle,${hx(AC, 0.18)},transparent 60%);filter:blur(18px)}
.mi-trip-scan-ring{position:absolute;inset:0;border-radius:50%;border:1px dashed ${hx(AC, 0.2)};animation:mi-trip-rot-cw 28s linear infinite}
.mi-trip-scan-name{font-size:22px;font-weight:200;letter-spacing:0.12em;color:#fff;text-align:center;text-shadow:0 0 18px rgba(0,194,255,0.35);margin:0}
.mi-trip-scan-sub{font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${AC};opacity:0.65}
.mi-trip-scan-meta{display:flex;gap:28px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#fff;margin-top:4px}
.mi-trip-scan-meta-val{color:${AC};font-weight:500;margin-left:6px}

/* ── TIMELINE ── */
.mi-trip-section-label{font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#fff;margin:0 0 12px;display:flex;align-items:center;gap:10px}
.mi-trip-section-label::before{content:"✦";color:${AC};opacity:0.8;font-size:11px}
.mi-trip-timeline{display:flex;align-items:flex-end;gap:7px;margin:0 0 14px;padding:22px 2px 2px;height:128px;position:relative;overflow-x:auto}
.mi-trip-timeline::before{content:"";position:absolute;left:0;right:0;bottom:18px;height:1px;background:linear-gradient(90deg,transparent,${hx(AC, 0.18)},transparent)}
.mi-trip-tl-bar{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:22px;flex:1;max-width:34px}
.mi-trip-tl-val{font-size:9px;font-weight:500;color:${AC};opacity:0.85;letter-spacing:0.04em}
.mi-trip-tl-fill{width:100%;border-radius:3px 3px 0 0;background:linear-gradient(180deg,${AC},${hx(AC, 0.25)});box-shadow:0 0 8px ${hx(AC, 0.35)};transition:height 0.6s cubic-bezier(0.16,1,0.3,1);min-height:3px}
.mi-trip-tl-fill.partial{background:linear-gradient(180deg,${GOLD},rgba(200,164,78,0.25));box-shadow:0 0 8px rgba(200,164,78,0.3)}
.mi-trip-tl-dot{width:6px;height:6px;border-radius:50%;background:${AC};box-shadow:0 0 6px ${AC};margin-top:2px}
.mi-trip-tl-dot.partial{background:${GOLD};box-shadow:0 0 6px rgba(200,164,78,0.6)}
.mi-trip-tl-empty{font-size:10px;font-weight:400;color:#fff;letter-spacing:0.1em;padding:18px 0;text-align:center}

/* ── PILLAR PROGRESS ── */
.mi-trip-pilares{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:0}
.mi-trip-pilar{display:flex;flex-direction:column;gap:7px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.3);transition:border-color 0.25s,background 0.25s}
.mi-trip-pilar.sealed{border-color:rgba(200,164,78,0.4);background:rgba(200,164,78,0.04)}
.mi-trip-pilar.open{border-color:rgba(200,164,78,0.22);background:rgba(200,164,78,0.015);border-style:dashed}
.mi-trip-pilar.available{border-color:rgba(0,229,255,0.22);background:rgba(0,229,255,0.03)}
.mi-trip-pilar-head{display:flex;justify-content:space-between;align-items:baseline;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#fff}
.mi-trip-pilar-val{font-size:13px;font-weight:300;letter-spacing:0.05em;color:${AC}}
.mi-trip-pilar-val.sealed{color:${GOLD}}
.mi-trip-pilar-val.open{color:${GOLD};opacity:0.7}
.mi-trip-pilar-val.available{color:${AC}}
.mi-trip-pilar-val.empty{color:#fff}
.mi-trip-pilar-bar{position:relative;height:4px;border-radius:3px;background:rgba(255,255,255,0.04);overflow:hidden}
.mi-trip-pilar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width 0.7s cubic-bezier(0.16,1,0.3,1)}
.mi-trip-pilar-fill.tier-low{background:linear-gradient(90deg,#FF6B6B,rgba(255,107,107,0.35));box-shadow:0 0 8px rgba(255,107,107,0.4)}
.mi-trip-pilar-fill.tier-mid{background:linear-gradient(90deg,#E8B94E,rgba(232,185,78,0.35));box-shadow:0 0 8px rgba(232,185,78,0.4)}
.mi-trip-pilar-fill.tier-high{background:linear-gradient(90deg,#22C55E,rgba(34,197,94,0.35));box-shadow:0 0 8px rgba(34,197,94,0.4)}
.mi-trip-pilar-fill.tier-empty{background:rgba(255,255,255,0.08);box-shadow:none}
.mi-trip-pilar-sub{font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#fff}
.mi-trip-pilar-sub.sealed{color:${GOLD};opacity:0.85}
.mi-trip-pilar-sub.open{color:${GOLD};opacity:0.65;font-style:italic}
.mi-trip-pilar-sub.available{color:${AC};opacity:0.7}
.mi-trip-pilar-sub.empty{color:#fff}

/* ── EMPTY / LOADING ── */
.mi-trip-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;padding:40px 20px;gap:16px;text-align:center}
.mi-trip-empty-orb{width:64px;height:64px;border-radius:50%;background:radial-gradient(circle,${hx(AC, 0.15)},transparent 60%);position:relative;animation:mi-trip-pulse 2.6s ease-in-out infinite}
.mi-trip-empty-orb::after{content:"";position:absolute;inset:30%;border-radius:50%;background:${AC};box-shadow:0 0 22px ${AC};opacity:0.6}
.mi-trip-empty-msg{font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#fff;max-width:300px;line-height:1.6}

/* ═══ DECODIFICADOR · STAT ROW ═══ */
.mi-trip-deco{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;border-radius:12px;background:rgba(0,229,255,0.04);border:1px solid rgba(0,229,255,0.18);margin:0 0 14px}
.mi-trip-deco-label{display:flex;flex-direction:column;gap:4px}
.mi-trip-deco-label-top{font-size:9.5px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${AC}}
.mi-trip-deco-label-sub{font-size:10px;font-weight:400;letter-spacing:0.06em;color:#fff;opacity:0.75}
.mi-trip-deco-val{font-size:18px;font-weight:300;letter-spacing:0.04em;color:${AC};text-align:right;line-height:1.1}
.mi-trip-deco-val-mini{font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:#fff;opacity:0.5;margin-top:3px}
.mi-trip-deco.golden{background:rgba(200,164,78,0.06);border-color:rgba(200,164,78,0.32);box-shadow:0 0 28px rgba(200,164,78,0.06)}
.mi-trip-deco.golden .mi-trip-deco-label-top{color:${GOLD}}
.mi-trip-deco.golden .mi-trip-deco-val{color:${GOLD};text-shadow:0 0 12px rgba(200,164,78,0.35)}

/* ═══ CARD DE EMAIL · CICLO SELLADO ═══ */
.mi-trip-mail{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;border-radius:12px;margin:0 0 14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
.mi-trip-mail-label{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
.mi-trip-mail-label-top{font-size:9.5px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#fff}
.mi-trip-mail-label-sub{font-size:10px;font-weight:400;letter-spacing:0.04em;color:#fff;opacity:0.6;line-height:1.45;word-break:break-word}
.mi-trip-mail-icon{font-size:22px;font-weight:300;line-height:1;flex-shrink:0;color:rgba(255,255,255,0.4)}
.mi-trip-mail.mail-sent{background:rgba(34,197,94,0.05);border-color:rgba(34,197,94,0.32)}
.mi-trip-mail.mail-sent .mi-trip-mail-label-top{color:#22C55E}
.mi-trip-mail.mail-sent .mi-trip-mail-icon{color:#22C55E;text-shadow:0 0 10px rgba(34,197,94,0.5)}
.mi-trip-mail.mail-failed{background:rgba(255,80,100,0.05);border-color:rgba(255,80,100,0.32)}
.mi-trip-mail.mail-failed .mi-trip-mail-label-top{color:#FF5364}
.mi-trip-mail.mail-failed .mi-trip-mail-icon{color:#FF5364;text-shadow:0 0 10px rgba(255,80,100,0.5)}
.mi-trip-mail.mail-skipped{background:rgba(200,164,78,0.05);border-color:rgba(200,164,78,0.3)}
.mi-trip-mail.mail-skipped .mi-trip-mail-label-top{color:${GOLD}}
.mi-trip-mail.mail-skipped .mi-trip-mail-icon{color:${GOLD};text-shadow:0 0 10px rgba(200,164,78,0.5)}

/* ═══ CARD DE LISTA DE CORREOS — NODO CENTRAL ═══ */
.mi-trip-list{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;border-radius:12px;margin:0 0 14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
.mi-trip-list-label{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
.mi-trip-list-label-top{font-size:9.5px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#fff}
.mi-trip-list-label-sub{font-size:10px;font-weight:400;letter-spacing:0.04em;color:#fff;opacity:0.6;line-height:1.45;word-break:break-word}
.mi-trip-list-icon{font-size:22px;font-weight:300;line-height:1;flex-shrink:0;color:rgba(255,255,255,0.4)}
.mi-trip-list.list-in{background:rgba(34,197,94,0.05);border-color:rgba(34,197,94,0.32)}
.mi-trip-list.list-in .mi-trip-list-label-top{color:#22C55E}
.mi-trip-list.list-in .mi-trip-list-icon{color:#22C55E;text-shadow:0 0 10px rgba(34,197,94,0.5)}
.mi-trip-list.list-out{background:rgba(255,80,100,0.05);border-color:rgba(255,80,100,0.32)}
.mi-trip-list.list-out .mi-trip-list-label-top{color:#FF5364}
.mi-trip-list.list-out .mi-trip-list-icon{color:#FF5364;text-shadow:0 0 10px rgba(255,80,100,0.5)}

/* ═══ MODAL TEMA DORADO (Inmersión Solar) ═══ */
.mi-trip-modal.golden{
    border:1.5px solid rgba(232,198,90,0.65);
    background:linear-gradient(165deg,rgba(38,28,10,0.97) 0%,rgba(22,16,6,0.99) 50%,rgba(45,32,12,0.97) 100%);
    box-shadow:0 40px 120px rgba(0,0,0,0.7),0 0 0 1px rgba(232,198,90,0.3),0 0 110px rgba(232,198,90,0.32),inset 0 1px 0 rgba(255,220,140,0.22)
}
.mi-trip-modal.golden .mi-trip-scan-hex::before{background:radial-gradient(circle,rgba(232,198,90,0.36),transparent 60%)}
.mi-trip-modal.golden .mi-trip-scan-ring{border-color:rgba(232,198,90,0.48)}
.mi-trip-modal.golden .mi-trip-scan-name{text-shadow:0 0 18px rgba(232,198,90,0.55)}
.mi-trip-modal.golden .mi-trip-scan-sub{color:${GOLD}}
.mi-trip-modal.golden .mi-trip-scan-meta-val{color:${GOLD}}
.mi-trip-modal.golden .mi-trip-section-label::before{color:${GOLD}}

/* ═══ MODAL TEMA CYAN (Sintonía Solar) ═══ */
.mi-trip-modal.cyan{
    border:1.5px solid rgba(0,194,255,0.6);
    background:linear-gradient(165deg,rgba(8,30,55,0.97) 0%,rgba(4,18,38,0.99) 50%,rgba(10,38,68,0.97) 100%);
    box-shadow:0 40px 120px rgba(0,0,0,0.7),0 0 0 1px rgba(0,194,255,0.3),0 0 110px rgba(0,194,255,0.32),inset 0 1px 0 rgba(140,220,255,0.22)
}
.mi-trip-modal.cyan .mi-trip-scan-hex::before{background:radial-gradient(circle,rgba(0,194,255,0.36),transparent 60%)}
.mi-trip-modal.cyan .mi-trip-scan-ring{border-color:rgba(0,194,255,0.55)}
.mi-trip-modal.cyan .mi-trip-scan-name{text-shadow:0 0 18px rgba(0,194,255,0.55)}
.mi-trip-modal.cyan .mi-trip-scan-sub{color:#00C2FF}
.mi-trip-modal.cyan .mi-trip-scan-meta-val{color:#00C2FF}
.mi-trip-modal.cyan .mi-trip-section-label::before{color:#00C2FF}

.mi-trip-deco.cyan-tier{background:rgba(0,194,255,0.06);border-color:rgba(0,194,255,0.42);box-shadow:0 0 28px rgba(0,194,255,0.06)}
.mi-trip-deco.cyan-tier .mi-trip-deco-label-top{color:#00C2FF}
.mi-trip-deco.cyan-tier .mi-trip-deco-val{color:#00C2FF;text-shadow:0 0 12px rgba(0,194,255,0.35)}

.mi-trip-sintonia-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,rgba(232,198,90,0.18),rgba(200,164,78,0.14));border:1px solid rgba(200,164,78,0.4);font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${GOLD};text-shadow:0 0 10px rgba(200,164,78,0.4);box-shadow:0 0 18px rgba(200,164,78,0.18);margin-bottom:6px}
.mi-trip-sintonia-pill::before{content:"✦";font-size:11px}
.mi-trip-sintonia-pill.cyan-tier{background:linear-gradient(135deg,rgba(0,194,255,0.22),rgba(0,194,255,0.12));border-color:rgba(0,194,255,0.5);color:#00C2FF;text-shadow:0 0 10px rgba(0,194,255,0.45);box-shadow:0 0 18px rgba(0,194,255,0.22)}

/* ═══ EXPANDIBLE DEL PANEL DEL NODO (v3.38) ═══
   Vista interna del panel del nodo que cubre el contenido del modal
   cuando se expande una sección (Códices, etc). Sigue el patrón canónico
   del Holograma de Expansión: position absolute inset:0 sobre el modal,
   header con título + ESC + botón Volver, contenido scrollable. */
.mi-trip-expand-overlay{position:absolute;inset:0;z-index:10;border-radius:22px;background:radial-gradient(ellipse at top,rgba(4,14,28,0.985),rgba(1,8,18,0.995));display:flex;flex-direction:column;padding:28px 36px;animation:mi-trip-fadein 0.28s ease-out}
.mi-trip-modal.golden .mi-trip-expand-overlay{background:radial-gradient(ellipse at top,rgba(38,28,10,0.985),rgba(22,16,6,0.995))}
.mi-trip-modal.cyan .mi-trip-expand-overlay{background:radial-gradient(ellipse at top,rgba(8,30,55,0.985),rgba(4,18,38,0.995))}
.mi-trip-expand-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08)}
.mi-trip-expand-title{font-size:13px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${AC};text-shadow:0 0 10px rgba(0,194,255,0.3)}
.mi-trip-modal.golden .mi-trip-expand-title{color:${GOLD};text-shadow:0 0 10px rgba(200,164,78,0.3)}
.mi-trip-modal.cyan .mi-trip-expand-title{color:#00C2FF;text-shadow:0 0 10px rgba(0,194,255,0.4)}
.mi-trip-expand-actions{display:flex;align-items:center;gap:10px}
.mi-trip-expand-hint{font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35)}
.mi-trip-expand-back{padding:8px 18px;border-radius:8px;border:1px solid ${hx(AC, 0.35)};background:${hx(AC, 0.06)};color:${AC};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;outline:none;font-family:'Inter',sans-serif;transition:all 0.22s}
.mi-trip-expand-back:hover{background:${hx(AC, 0.12)};border-color:${hx(AC, 0.55)};box-shadow:0 0 12px ${hx(AC, 0.2)}}
.mi-trip-modal.golden .mi-trip-expand-back{border-color:rgba(200,164,78,0.45);background:rgba(200,164,78,0.08);color:${GOLD}}
.mi-trip-modal.golden .mi-trip-expand-back:hover{background:rgba(200,164,78,0.16);border-color:rgba(200,164,78,0.65);box-shadow:0 0 12px rgba(200,164,78,0.25)}
.mi-trip-modal.cyan .mi-trip-expand-back{border-color:rgba(0,194,255,0.5);background:rgba(0,194,255,0.08);color:#00C2FF}
.mi-trip-modal.cyan .mi-trip-expand-back:hover{background:rgba(0,194,255,0.14);border-color:rgba(0,194,255,0.7);box-shadow:0 0 14px rgba(0,194,255,0.28)}
.mi-trip-expand-body{flex:1;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-width:none;-ms-overflow-style:none}
.mi-trip-expand-body::-webkit-scrollbar{display:none;width:0}

/* Botón "Expandir" inline al lado del header de Códices */
.mi-trip-expand-trigger{padding:4px 12px;border-radius:6px;border:1px solid ${hx(AC, 0.25)};background:transparent;color:${AC};font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;outline:none;font-family:'Inter',sans-serif;transition:all 0.22s;margin-left:auto}
.mi-trip-expand-trigger:hover{background:${hx(AC, 0.1)};border-color:${hx(AC, 0.45)}}
.mi-trip-modal.golden .mi-trip-expand-trigger{border-color:rgba(200,164,78,0.35);color:${GOLD}}
.mi-trip-modal.golden .mi-trip-expand-trigger:hover{background:rgba(200,164,78,0.1);border-color:rgba(200,164,78,0.55)}
.mi-trip-modal.cyan .mi-trip-expand-trigger{border-color:rgba(0,194,255,0.4);color:#00C2FF}
.mi-trip-modal.cyan .mi-trip-expand-trigger:hover{background:rgba(0,194,255,0.1);border-color:rgba(0,194,255,0.6)}
@media(max-width:767px){
  .mi-trip-expand-overlay{padding:22px 18px}
  .mi-trip-expand-title{font-size:11px;letter-spacing:0.16em}
  .mi-trip-expand-hint{display:none}
  .mi-trip-expand-back{padding:6px 14px;font-size:9px}
}
`

/* ═══ GHOST WRAPPER PARA FRAMER ═══
   Framer requiere que cada Code File default-exporte un componente con
   body JSX. Wrap function + Object.assign con todos los exports para que
   los consumidores puedan destructurar como objeto. */
function MISharedShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MISharedShell.displayName = "MI_Shared"

const Shared = Object.assign(MISharedShell, {
    /* Constantes */
    PILARES,
    SCORE_VALUES,
    AC,
    GOLD,
    PILAR_LABELS,
    PILAR_ORDER,
    /* Helpers */
    hx,
    rpc,
    rpcCached,
    adminAction,
    adminActionCached,
    motorCacheClear,
    norm,
    /* Hooks */
    useIsMobile,
    useScrollHideHeader,
    useAdminAuth,
    /* Componente compartido */
    TripulanteHex,
    /* CSS global */
    CSS,
})

export default Shared
