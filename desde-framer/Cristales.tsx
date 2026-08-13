// Cristales.tsx v1.20 — UN CRISTAL = EL CÓDICE COMPLETO (decisión de Zak 2026-08-01): el muro y el modal explicativo dejan de decir "en el formato que elijas" y dicen que el Cristal entrega el Códice entero (ebook, PDF y su audiolibro cuando exista); la compra suelta pasa de "(PDF + Ebook · pago único)" a "(El Códice completo · pago único)". | Red Solar Viva — Cristales.tsx v1.14 — CodiceCristalGate: quitados los textos "llave mensual de la Holoteca" y "Sintonía ya incluye 333 MXN de valor" (a pedido de Zak) · v1.13 muro de pago de Códices: no-miembros ven "Activar Sintonía Solar" (→ PlanSelector) + compra suelta 333 MXN solo web (!isNative); miembros sin cristales ven copy "próxima luna" + 333 MXN.
// v1.11 — #4 Telemetría viva: un paquete de luz CIRCULA el [re-sync]
//   cristal hexagonal (dato en circuito) vía SMIL animateMotion sobre el perímetro, en la
//   pastilla-contador (CristalGlyph) y en el cristal grande del modal (renderRow). Anti-flash "0 → N"
//   de Luz: el contador se siembra del cache leyendo window.Clerk.user cuando el
//   prop clerkUserId aún llega "" (primer render), y el effect no llama refresh()
//   con id vacío (evita el 0).
// v1.7 — Ola C #8: el canje de cristales (canjear/redeem códice/redeem
// meditación) va por el gateway user-action con el token de Clerk verificado.
// El clerk_user_id ya no viaja forjable desde el cliente (cerraba griefing).
// v1.6.1 — Fix del flicker 0→1 en mobile cuando el clerkUserId
// aún no estaba disponible al primer render. Antes la initial
// state useState evaluaba el cache una sola vez con clerkUserId=null
// → arrancaba en 0, y aunque el useEffect detectara el cambio del
// clerk, no rehidrataba el cache antes de la fetch. Ahora cuando
// clerkUserId pasa de null/undefined a su valor real, releemos el
// cache y seteamos los counts antes de disparar el refresh, así
// el indicador entra con el último valor visto en mobile también.
// v1.6 — Tres pulidos pedidos por Zak:
//   • Cache localStorage del último contador conocido por
//     clerkUserId. Al re-entrar al Escáner el indicador arranca con
//     el valor de la sesión anterior en lugar de 0; evita el flash
//     "0 → 1" cuando el RPC tarda 200-500ms en resolver.
//   • CristalesIndicator acepta prop opcional `size: "sm" | "md" | "lg"`.
//     Default queda igual; "lg" agranda el glyph (svg 28, font 16) +
//     padding más grande para el indicador del desktop, donde el
//     elemento queda muy chico arriba a la izquierda.
//   • Modal informativo: copy del row de Códice ahora dice "Canjéalo
//     por un Códice a tu elección." (sin "(PDF + Ebook)") y el de
//     Meditación queda análogo. Más limpio visualmente.
// v1.5 — Admin testing override:
//   • Hook nuevo `useIsAdmin(clerkUserId, supabaseUrl, supabaseAnonKey)`
//     llama la RPC `is_admin_caller` y devuelve boolean.
//   • `useCristales` detecta admin internamente. Si admin y los counts
//     son 0 al cargar, dispara `admin_regenerate_cristal` (codice +
//     meditacion) — el admin siempre arranca con 1 de cada para
//     testing.
//   • Después de un `canjear` exitoso, si el caller es admin, queda
//     programada una regeneración a los 30 segundos (RPC
//     `admin_regenerate_cristal` + refresh) — efecto "cristales
//     infinitos con cooldown corto" para flujo de pruebas.
//   • Helper `adminResetMyCodices(clerkUserId, sb)` para que botones
//     admin (ej. en Mi Núcleo > Mis Códices) borren purchases del
//     propio admin con un click.
// v1.4 — CristalesIndicator es ahora interactivo: picarlo abre un
// modal explicativo que cuenta qué son los Cristales de Extracción,
// cuántos vienen por mes con la Sintonía Solar, y para qué sirve cada
// uno. Diseño glass-aurora con un hexágono dorado y otro cyan
// emparejados. El modal se llama CristalesInfoModal y se exporta
// individualmente para que cualquier capa pueda invocarlo manual si
// lo necesita.
// v1.3.1 — Re-trigger por timeout de Framer API.
// v1.3 — ConfirmarCristalModal muestra el contador ANTES del canje
// ("1 cristal disponible" cuando hay 1, no "0 restantes"). El
// indicador global se actualiza al cerrar el modal cuando la RPC
// confirma.
// v1.2 — Nuevo helper `registerMeditacionInmersionLibre` para
// anclar el acceso de Inmersión Solar a una meditación en el perfil
// del Tripulante. Idempotente. Si el Tripulante se desuscribe, las
// meditaciones registradas con `acquired_via='inmersion_libre'`
// quedan abiertas para siempre. Llama la RPC homónima.
// v1.1 — Nuevos exports para integrar el flow de canje desde
// catálogos:
//   • useMembershipTier(clerkUserId, supabaseUrl, supabaseAnonKey)
//       Hook que devuelve {tier: "explorer"|"sintonia"|"inmersion",
//       loading}. Lo usa Meditaciones.tsx para hacer bypass de canje
//       cuando tier === "inmersion" (acceso libre a meditaciones).
//   • redeemCodiceWithCristal(clerkUserId, bookId, formats, sb)
//       Helper async que llama la RPC redeem_codice_with_cristal.
//       Devuelve {success, alreadyOwned, error}.
//   • redeemMeditacionWithCristal(clerkUserId, meditacionId, sb)
//       Idem para meditaciones (RPC redeem_meditacion_with_cristal).
//   • getMyMeditacionesOwned(clerkUserId, sb)
//       Helper async para hidratar la lista de IDs de meditaciones
//       desbloqueadas + el flag inmersion_unlocks_all.
//
// Sistema de Cristales de Extracción.
// Cada Tripulante con suscripción activa (Sintonía Solar o Inmersión
// Solar) recibe 2 cristales por mes lunar: uno DORADO para Códices,
// uno CYAN para Meditaciones. Acumulables (no expiran). El motor
// de emisión vive en stripe-webhook (cada invoice paid llama la RPC
// emit_cristales_for_subscription). El motor de canje vive en la
// RPC canjear_cristal.
//
// Este módulo expone:
//   • useCristales(clerkUserId, supabaseUrl, supabaseAnonKey)
//       Hook que devuelve {codiceCount, meditacionCount, loading,
//       refresh, canjear}. Polling automático cada 60s para
//       reflejar canjes desde otra pestaña.
//   • CristalesIndicator
//       Widget arriba-a-la-derecha con dos hexágonos (dorado +
//       cyan) y los contadores. Lo embebes en Códices y
//       Meditaciones.
//   • ConfirmarCristalModal
//       Modal portaled a document.body que pregunta "¿Quieres
//       usar tu cristal?" con animación. Devuelve onConfirm /
//       onCancel.
//
// El default export es un componente fantasma + utilities (mismo
// patrón que MN_Shared) para satisfacer el componentLoader de Framer.

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

/* ═════════════════════════════════════════════════════════════
   COLORS / TOKENS
   ═════════════════════════════════════════════════════════════ */

const CRISTAL_COLORS = {
    codice: {
        primary: "#D4A843",          // dorado solar
        glow: "rgba(212,168,67,0.55)",
        soft: "rgba(212,168,67,0.16)",
        dim: "rgba(212,168,67,0.08)",
        label: "Códices",
    },
    meditacion: {
        primary: "#00C2FF",          // cyan vibracional
        glow: "rgba(0,194,255,0.55)",
        soft: "rgba(0,194,255,0.16)",
        dim: "rgba(0,194,255,0.08)",
        label: "Meditaciones",
    },
} as const

export type CristalKind = "codice" | "meditacion"

/* ═════════════════════════════════════════════════════════════
   HOOK — useCristales
   ═════════════════════════════════════════════════════════════ */

export interface CristalesState {
    codiceCount: number
    meditacionCount: number
    loading: boolean
    refresh: () => Promise<void>
    canjear: (
        tipo: CristalKind,
        itemId: string
    ) => Promise<{ success: boolean; alreadyRedeemed?: boolean; error?: string }>
}

/* v1.6 — Cache localStorage del último contador por clerkUserId.
   Evita el flicker visual "0 → real" en cada mount: si el último
   valor conocido fue 1, el indicador arranca en 1 mientras la RPC
   refresca. Al fetch nuevo se actualiza state + cache. */
const COUNT_CACHE_PREFIX = "rsv-cristales-count-"
function readCountCache(
    clerkUserId: string | null | undefined
): { codice: number; meditacion: number } | null {
    if (!clerkUserId || typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(COUNT_CACHE_PREFIX + clerkUserId)
        if (!raw) return null
        const j = JSON.parse(raw)
        if (
            typeof j?.codice === "number" &&
            typeof j?.meditacion === "number"
        ) {
            return { codice: j.codice, meditacion: j.meditacion }
        }
    } catch {}
    return null
}
function writeCountCache(
    clerkUserId: string | null | undefined,
    codice: number,
    meditacion: number
) {
    if (!clerkUserId || typeof window === "undefined") return
    try {
        localStorage.setItem(
            COUNT_CACHE_PREFIX + clerkUserId,
            JSON.stringify({ codice, meditacion })
        )
    } catch {}
}

export function useCristales(
    clerkUserId: string | null | undefined,
    supabaseUrl: string,
    supabaseAnonKey: string
): CristalesState {
    /* v1.10 — clerkUserId puede llegar "" en el primer render (useClerkIdentity
       arranca vacío y resuelve un tick después). Para que Códices de Luz NO
       muestre "0" y recargue a N, sembramos el contador desde el cache leyendo
       el id real directo de window.Clerk.user cuando el prop aún viene vacío. */
    const seedClerkId =
        clerkUserId ||
        (typeof window !== "undefined"
            ? ((window as any).Clerk?.user?.id as string | undefined)
            : undefined) ||
        ""
    const [codiceCount, setCodiceCount] = useState(
        () => readCountCache(seedClerkId)?.codice ?? 0
    )
    const [meditacionCount, setMeditacionCount] = useState(
        () => readCountCache(seedClerkId)?.meditacion ?? 0
    )
    const [loading, setLoading] = useState(false)
    const lastClerkRef = useRef<string | null | undefined>(null)
    /* v1.5 — Detección admin para regeneración auto-30s post-canje. */
    const isAdmin = useIsAdmin(clerkUserId, supabaseUrl, supabaseAnonKey)
    const isAdminRef = useRef(isAdmin)
    isAdminRef.current = isAdmin
    const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const refresh = useCallback(async () => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setCodiceCount(0)
            setMeditacionCount(0)
            return
        }
        setLoading(true)
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            const r = await fetch(
                `${supabaseUrl}/functions/v1/user-action`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        action: "get_my_cristales",
                        params: {},
                    }),
                }
            )
            if (!r.ok) {
                console.warn("[cristales] get_my_cristales http error:", r.status)
                return
            }
            const j = await r.json()
            const nextCodice = Number(j?.codice_count) || 0
            const nextMedi = Number(j?.meditacion_count) || 0
            setCodiceCount(nextCodice)
            setMeditacionCount(nextMedi)
            /* v1.6 — Persistir en localStorage para hydration en
               próximas montas. */
            writeCountCache(clerkUserId, nextCodice, nextMedi)
        } catch (e) {
            console.warn("[cristales] get_my_cristales throw:", (e as Error).message)
        } finally {
            setLoading(false)
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        /* v1.10 — Mientras Clerk no resuelva el id (clerkUserId ""), NO
           llamamos refresh(): pondría los contadores en 0 (su guarda de
           "sin usuario") y reintroduciría el flash. El seed del cache ya
           pintó el valor real; esperamos al id verdadero para confirmar. */
        if (!clerkUserId) {
            /* v1.11 — Cierre de sesión: si ANTES había un Tripulante y ahora el
               id quedó vacío, reseteamos a 0 para que el contador no siga
               mostrando los cristales del usuario anterior. En la hidratación
               inicial lastClerk es null → no reseteamos (el seed del cache se
               conserva, sin flash). */
            if (lastClerkRef.current) {
                lastClerkRef.current = null
                setCodiceCount(0)
                setMeditacionCount(0)
            }
            return
        }
        if (lastClerkRef.current !== clerkUserId) {
            lastClerkRef.current = clerkUserId
            const cached = readCountCache(clerkUserId)
            if (cached) {
                setCodiceCount(cached.codice)
                setMeditacionCount(cached.meditacion)
            }
            refresh()
        }
    }, [clerkUserId, refresh])

    /* v1.5 — Admin priming: si el caller es admin y no tiene cristales
       disponibles, dispara la RPC `admin_regenerate_cristal` para
       semilla inicial. Idempotente: si ya hay cristales, la RPC
       devuelve {already_available: true} sin emitir duplicados. */
    useEffect(() => {
        if (!isAdmin || !clerkUserId) return
        let cancelled = false
        const prime = async () => {
            const promises: Promise<any>[] = []
            if (codiceCount === 0) {
                promises.push(
                    adminRegenerateCristal(
                        clerkUserId,
                        "codice",
                        supabaseUrl,
                        supabaseAnonKey
                    )
                )
            }
            if (meditacionCount === 0) {
                promises.push(
                    adminRegenerateCristal(
                        clerkUserId,
                        "meditacion",
                        supabaseUrl,
                        supabaseAnonKey
                    )
                )
            }
            if (promises.length === 0) return
            await Promise.all(promises)
            if (!cancelled) refresh()
        }
        prime()
        return () => {
            cancelled = true
        }
    }, [
        isAdmin,
        clerkUserId,
        codiceCount,
        meditacionCount,
        supabaseUrl,
        supabaseAnonKey,
        refresh,
    ])

    /* Polling cada 60s para reflejar canjes desde otra pestaña.
       También escuchamos un evento custom para refresh inmediato
       después de un canje en la misma pestaña. */
    useEffect(() => {
        if (!clerkUserId) return
        const interval = setInterval(refresh, 60000)
        const onLocal = () => refresh()
        window.addEventListener("rsv-cristales-changed", onLocal)
        return () => {
            clearInterval(interval)
            window.removeEventListener("rsv-cristales-changed", onLocal)
        }
    }, [clerkUserId, refresh])

    const canjear = useCallback(
        async (tipo: CristalKind, itemId: string) => {
            if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
                return { success: false, error: "no_session" }
            }
            try {
                const token = await (
                    window as any
                ).Clerk?.session?.getToken?.()
                const r = await fetch(
                    `${supabaseUrl}/functions/v1/user-action`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({
                            token,
                            action: "canjear_cristal",
                            params: { p_tipo: tipo, p_item_id: itemId },
                        }),
                    }
                )
                if (!r.ok) {
                    return {
                        success: false,
                        error: `http_${r.status}`,
                    }
                }
                const j = await r.json()
                if (j?.success) {
                    /* Optimistic local decrement antes del refresh. */
                    if (!j.already_redeemed) {
                        if (tipo === "codice") {
                            setCodiceCount((n) => Math.max(0, n - 1))
                        } else {
                            setMeditacionCount((n) => Math.max(0, n - 1))
                        }
                    }
                    refresh()
                    try {
                        window.dispatchEvent(
                            new CustomEvent("rsv-cristales-changed")
                        )
                    } catch {}
                    /* v1.5 — Admin testing: schedule regeneración del
                       cristal canjeado a los 30s. Permite que el admin
                       pruebe el flujo de canje repetidamente sin
                       quedarse sin cristales. */
                    if (
                        isAdminRef.current &&
                        clerkUserId &&
                        !j.already_redeemed
                    ) {
                        if (regenTimerRef.current) {
                            clearTimeout(regenTimerRef.current)
                        }
                        regenTimerRef.current = setTimeout(async () => {
                            await adminRegenerateCristal(
                                clerkUserId,
                                tipo,
                                supabaseUrl,
                                supabaseAnonKey
                            )
                            refresh()
                            regenTimerRef.current = null
                        }, 30000)
                    }
                    return {
                        success: true,
                        alreadyRedeemed: !!j.already_redeemed,
                    }
                }
                return {
                    success: false,
                    error: j?.error || "unknown",
                }
            } catch (e) {
                return {
                    success: false,
                    error: (e as Error).message || "throw",
                }
            }
        },
        [clerkUserId, supabaseUrl, supabaseAnonKey, refresh]
    )

    return {
        codiceCount,
        meditacionCount,
        loading,
        refresh,
        canjear,
    }
}

/* ═════════════════════════════════════════════════════════════
   HOOK — useMembershipTier
   ═════════════════════════════════════════════════════════════ */

export type MembershipTier = "explorer" | "sintonia" | "inmersion"

export function useMembershipTier(
    clerkUserId: string | null | undefined,
    supabaseUrl: string,
    supabaseAnonKey: string
): { tier: MembershipTier; loading: boolean; refresh: () => Promise<void> } {
    const [tier, setTier] = useState<MembershipTier>("explorer")
    const [loading, setLoading] = useState(false)

    const refresh = useCallback(async () => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setTier("explorer")
            return
        }
        setLoading(true)
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            const r = await fetch(
                `${supabaseUrl}/functions/v1/user-action`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        action: "get_my_membership_tier",
                        params: {},
                    }),
                }
            )
            if (!r.ok) {
                console.warn("[tier] http error:", r.status)
                return
            }
            const j = await r.json()
            const t = j?.tier
            if (t === "sintonia" || t === "inmersion" || t === "explorer") {
                setTier(t)
            }
        } catch (e) {
            console.warn("[tier] throw:", (e as Error).message)
        } finally {
            setLoading(false)
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        refresh()
    }, [refresh])

    /* Refresh on auth changes. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onChange = () => refresh()
        window.addEventListener("rsv-auth-changed", onChange)
        return () => window.removeEventListener("rsv-auth-changed", onChange)
    }, [refresh])

    return { tier, loading, refresh }
}

/* ═════════════════════════════════════════════════════════════
   ASYNC HELPERS — redeem_codice / redeem_meditacion
   ═════════════════════════════════════════════════════════════ */

export async function redeemCodiceWithCristal(
    clerkUserId: string,
    bookId: string,
    formats: string[],
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{
    success: boolean
    alreadyOwned?: boolean
    error?: string
}> {
    if (!clerkUserId || !bookId) {
        return { success: false, error: "missing_args" }
    }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        const r = await fetch(
            `${supabaseUrl}/functions/v1/user-action`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    token,
                    action: "redeem_codice_with_cristal",
                    params: {
                        p_book_id: bookId,
                        p_formats:
                            formats && formats.length > 0 ? formats : ["pdf"],
                    },
                }),
            }
        )
        if (!r.ok) return { success: false, error: `http_${r.status}` }
        const j = await r.json()
        if (j?.success) {
            try {
                window.dispatchEvent(new CustomEvent("rsv-cristales-changed"))
                window.dispatchEvent(new CustomEvent("rsv-purchases-changed"))
            } catch {}
            return {
                success: true,
                alreadyOwned: !!j.already_owned,
            }
        }
        return { success: false, error: j?.error || "unknown" }
    } catch (e) {
        return { success: false, error: (e as Error).message || "throw" }
    }
}

export async function redeemMeditacionWithCristal(
    clerkUserId: string,
    meditacionId: string,
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{
    success: boolean
    alreadyOwned?: boolean
    error?: string
}> {
    if (!clerkUserId || !meditacionId) {
        return { success: false, error: "missing_args" }
    }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        const r = await fetch(
            `${supabaseUrl}/functions/v1/user-action`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    token,
                    action: "redeem_meditacion_with_cristal",
                    params: { p_meditacion_id: meditacionId },
                }),
            }
        )
        if (!r.ok) return { success: false, error: `http_${r.status}` }
        const j = await r.json()
        if (j?.success) {
            try {
                window.dispatchEvent(new CustomEvent("rsv-cristales-changed"))
                window.dispatchEvent(
                    new CustomEvent("rsv-meditaciones-changed")
                )
            } catch {}
            return {
                success: true,
                alreadyOwned: !!j.already_owned,
            }
        }
        return { success: false, error: j?.error || "unknown" }
    } catch (e) {
        return { success: false, error: (e as Error).message || "throw" }
    }
}

/* Registra acceso libre de Inmersión a una meditación. Idempotente
   por (clerk_user_id, meditacion_id). Cuando un Tripulante de
   Inmersión escucha o desbloquea una meditación, llamamos esto para
   que el privilegio quede anclado a su perfil incluso si más
   adelante se desuscribe. */
export async function registerMeditacionInmersionLibre(
    clerkUserId: string,
    meditacionId: string,
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{ success: boolean; alreadyRegistered?: boolean; error?: string }> {
    if (!clerkUserId || !meditacionId) {
        return { success: false, error: "missing_args" }
    }
    try {
        const r = await fetch(
            `${supabaseUrl}/rest/v1/rpc/register_meditacion_inmersion_libre`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    p_clerk_user_id: clerkUserId,
                    p_meditacion_id: meditacionId,
                }),
            }
        )
        if (!r.ok) return { success: false, error: `http_${r.status}` }
        const j = await r.json()
        if (j?.success) {
            return {
                success: true,
                alreadyRegistered: !!j.already_registered,
            }
        }
        return { success: false, error: j?.error || "unknown" }
    } catch (e) {
        return { success: false, error: (e as Error).message || "throw" }
    }
}

export async function getMyMeditacionesOwned(
    clerkUserId: string,
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{ ids: string[]; inmersionUnlocksAll: boolean }> {
    if (!clerkUserId) {
        return { ids: [], inmersionUnlocksAll: false }
    }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        const r = await fetch(
            `${supabaseUrl}/functions/v1/user-action`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    token,
                    action: "get_my_meditaciones_owned",
                    params: {},
                }),
            }
        )
        if (!r.ok) return { ids: [], inmersionUnlocksAll: false }
        const j = await r.json()
        const idsRaw = j?.meditacion_ids
        const ids = Array.isArray(idsRaw)
            ? idsRaw.filter((x): x is string => typeof x === "string")
            : []
        return {
            ids,
            inmersionUnlocksAll: !!j?.inmersion_unlocks_all,
        }
    } catch {
        return { ids: [], inmersionUnlocksAll: false }
    }
}

/* ═════════════════════════════════════════════════════════════
   ADMIN HELPERS — detección + regen + reset codices
   ═════════════════════════════════════════════════════════════ */

/* Hook que devuelve si el clerkUserId actual corresponde a un perfil
   admin. Llama RPC `is_admin_caller` (SECURITY DEFINER, bypassa RLS).
   Cachea el resultado en sessionStorage para evitar re-fetch en
   remounts del mismo Tripulante durante la misma pestaña. */
const ADMIN_CACHE_PREFIX = "rsv-is-admin-"
export function useIsAdmin(
    clerkUserId: string | null | undefined,
    supabaseUrl: string,
    supabaseAnonKey: string
): boolean {
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        if (typeof window === "undefined" || !clerkUserId) return false
        try {
            const cached = sessionStorage.getItem(
                ADMIN_CACHE_PREFIX + clerkUserId
            )
            return cached === "1"
        } catch {
            return false
        }
    })
    useEffect(() => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setIsAdmin(false)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const r = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/is_admin_caller`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({
                            p_clerk_user_id: clerkUserId,
                        }),
                    }
                )
                if (!r.ok) return
                const j = await r.json()
                const v = !!j?.is_admin
                if (cancelled) return
                setIsAdmin(v)
                try {
                    sessionStorage.setItem(
                        ADMIN_CACHE_PREFIX + clerkUserId,
                        v ? "1" : "0"
                    )
                } catch {}
            } catch {}
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])
    return isAdmin
}

/* Genera un cristal nuevo (origen='manual') si el admin no tiene
   ninguno disponible del tipo. La RPC verifica admin server-side. */
export async function adminRegenerateCristal(
    clerkUserId: string,
    tipo: CristalKind,
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{ success: boolean; regenerated?: boolean; error?: string }> {
    if (!clerkUserId) return { success: false, error: "no_clerk_id" }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        const r = await fetch(
            `${supabaseUrl}/functions/v1/admin-action`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    token,
                    action: "admin_regenerate_cristal",
                    params: { p_tipo: tipo },
                }),
            }
        )
        if (!r.ok) return { success: false, error: `http_${r.status}` }
        const j = await r.json()
        if (j?.error) return { success: false, error: j.error }
        return {
            success: true,
            regenerated: !!j?.regenerated,
        }
    } catch (e) {
        return { success: false, error: (e as Error).message || "throw" }
    }
}

/* Borra TODAS las purchases del admin caller (testing). RPC verifica
   admin server-side. Resuelve también los cristales canjeados de
   origen='manual' para repetir flujos. */
export async function adminResetMyCodices(
    clerkUserId: string,
    supabaseUrl: string,
    supabaseAnonKey: string
): Promise<{
    success: boolean
    deletedPurchases?: number
    resetCristales?: number
    error?: string
}> {
    if (!clerkUserId) return { success: false, error: "no_clerk_id" }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        const r = await fetch(
            `${supabaseUrl}/functions/v1/admin-action`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    token,
                    action: "admin_reset_my_codices",
                    params: {},
                }),
            }
        )
        if (!r.ok) return { success: false, error: `http_${r.status}` }
        const j = await r.json()
        if (j?.error) return { success: false, error: j.error }
        try {
            window.dispatchEvent(new CustomEvent("rsv-purchases-changed"))
            window.dispatchEvent(new CustomEvent("rsv-cristales-changed"))
        } catch {}
        return {
            success: true,
            deletedPurchases: Number(j?.deleted_purchases) || 0,
            resetCristales: Number(j?.reset_cristales) || 0,
        }
    } catch (e) {
        return { success: false, error: (e as Error).message || "throw" }
    }
}

/* ═════════════════════════════════════════════════════════════
   GLYPH — Cristal hexagonal con cuenta numérica
   ═════════════════════════════════════════════════════════════ */

type CristalGlyphSize = "sm" | "md" | "lg"
function CristalGlyph({
    kind,
    count,
    title,
    size = "sm",
}: {
    kind: CristalKind
    count: number
    title?: string
    size?: CristalGlyphSize
}) {
    const c = CRISTAL_COLORS[kind]
    const isAvailable = count > 0
    const dims =
        size === "lg"
            ? { svg: 28, font: 16, padding: "10px 16px 10px 14px", gap: 10 }
            : size === "md"
              ? { svg: 22, font: 14, padding: "8px 14px 8px 12px", gap: 8 }
              : { svg: 18, font: 13, padding: "6px 10px 6px 8px", gap: 6 }
    return (
        <div
            title={title || `${count} cristal${count === 1 ? "" : "es"} de ${c.label}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: dims.gap,
                padding: dims.padding,
                borderRadius: 999,
                background: isAvailable ? c.soft : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                    isAvailable ? c.dim : "rgba(255,255,255,0.08)"
                }`,
                fontFamily: "'Inter',sans-serif",
                fontSize: dims.font - 1,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: isAvailable ? c.primary : "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
            }}
        >
            <svg
                width={dims.svg}
                height={dims.svg}
                viewBox="0 0 24 24"
                style={{ flex: "0 0 auto", filter: isAvailable ? `drop-shadow(0 0 6px ${c.glow})` : "none" }}
            >
                <polygon
                    points="12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7"
                    fill={isAvailable ? c.soft : "transparent"}
                    stroke={isAvailable ? c.primary : "rgba(255,255,255,0.35)"}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                {isAvailable && (
                    <>
                        <line
                            x1="12"
                            y1="2"
                            x2="12"
                            y2="22"
                            stroke={c.primary}
                            strokeWidth="0.6"
                            opacity="0.55"
                        />
                        <line
                            x1="3.4"
                            y1="7"
                            x2="20.6"
                            y2="17"
                            stroke={c.primary}
                            strokeWidth="0.6"
                            opacity="0.45"
                        />
                        <line
                            x1="20.6"
                            y1="7"
                            x2="3.4"
                            y2="17"
                            stroke={c.primary}
                            strokeWidth="0.6"
                            opacity="0.45"
                        />
                    </>
                )}
                {isAvailable && (
                    <circle
                        r="1.4"
                        fill={c.primary}
                        opacity="0.95"
                        style={{ filter: `drop-shadow(0 0 4px ${c.glow})` }}
                    >
                        {/* #4 Telemetría viva — un paquete de luz circula el cristal (data en circuito). SMIL nativo (perf 10K). */}
                        <animateMotion
                            dur="3.8s"
                            repeatCount="indefinite"
                            path="M12,2 L20.6,7 L20.6,17 L12,22 L3.4,17 L3.4,7 Z"
                        />
                    </circle>
                )}
            </svg>
            <span
                style={{
                    fontVariantNumeric: "tabular-nums",
                    fontSize: dims.font,
                    fontWeight: 700,
                }}
            >
                {count}
            </span>
        </div>
    )
}

/* ═════════════════════════════════════════════════════════════
   CRISTALES INDICATOR
   ═════════════════════════════════════════════════════════════ */

export function CristalesIndicator({
    codiceCount,
    meditacionCount,
    onlyKind,
    style,
    size = "sm",
}: {
    codiceCount: number
    meditacionCount: number
    /* Si onlyKind se pasa, solo mostramos ese cristal (ej. en
       /codices solo el dorado, en /meditaciones solo el cyan). */
    onlyKind?: CristalKind
    style?: React.CSSProperties
    /* v1.6 — "lg" agranda el glyph en desktop. Mobile sigue "sm". */
    size?: CristalGlyphSize
}) {
    /* v1.4 — Picar el indicador abre un modal explicativo. State local
       — cualquier instancia del indicador maneja su propio modal sin
       necesidad de coordinar con el padre. */
    const [showInfo, setShowInfo] = useState(false)
    return (
        <>
            <button
                type="button"
                onClick={() => setShowInfo(true)}
                aria-label="Qué son los Cristales de Extracción"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                    color: "inherit",
                    /* v1.4 — Sello anti-drag-nativo / anti-selección
                       para que picar el indicador en desktop no arranque
                       un drag accidentalmente. */
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                    ...style,
                }}
            >
                {(onlyKind === undefined || onlyKind === "codice") && (
                    <CristalGlyph
                        kind="codice"
                        count={codiceCount}
                        size={size}
                    />
                )}
                {(onlyKind === undefined || onlyKind === "meditacion") && (
                    <CristalGlyph
                        kind="meditacion"
                        count={meditacionCount}
                        size={size}
                    />
                )}
            </button>
            <CristalesInfoModal
                open={showInfo}
                onClose={() => setShowInfo(false)}
                codiceCount={codiceCount}
                meditacionCount={meditacionCount}
                highlightKind={onlyKind}
            />
        </>
    )
}

/* ═════════════════════════════════════════════════════════════
   CRISTALES INFO MODAL — explica qué son los Cristales
   ═════════════════════════════════════════════════════════════ */

export function CristalesInfoModal({
    open,
    onClose,
    codiceCount,
    meditacionCount,
    highlightKind,
}: {
    open: boolean
    onClose: () => void
    codiceCount: number
    meditacionCount: number
    /* Cuando el indicador estaba mostrando solo un kind, lo
       resaltamos arriba para que el modal "responda" al gesto. */
    highlightKind?: CristalKind
}) {
    if (typeof document === "undefined") return null

    const codice = CRISTAL_COLORS.codice
    const medi = CRISTAL_COLORS.meditacion

    const renderRow = (
        kind: CristalKind,
        count: number,
        title: string,
        body: string
    ) => {
        const c = CRISTAL_COLORS[kind]
        const dim = highlightKind && highlightKind !== kind
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 16px",
                    borderRadius: 16,
                    background: dim
                        ? "rgba(255,255,255,0.02)"
                        : `linear-gradient(150deg, ${c.dim} 0%, transparent 80%)`,
                    border: `1px solid ${dim ? "rgba(255,255,255,0.06)" : c.dim}`,
                    opacity: dim ? 0.55 : 1,
                    transition: "all 0.3s ease",
                }}
            >
                <svg
                    width={36}
                    height={36}
                    viewBox="0 0 24 24"
                    style={{
                        flex: "0 0 auto",
                        filter: `drop-shadow(0 0 10px ${c.glow})`,
                        marginTop: 2,
                    }}
                >
                    <polygon
                        points="12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7"
                        fill={c.soft}
                        stroke={c.primary}
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                    />
                    <line x1="12" y1="2" x2="12" y2="22" stroke={c.primary} strokeWidth="0.6" opacity="0.55" />
                    <line x1="3.4" y1="7" x2="20.6" y2="17" stroke={c.primary} strokeWidth="0.6" opacity="0.45" />
                    <line x1="20.6" y1="7" x2="3.4" y2="17" stroke={c.primary} strokeWidth="0.6" opacity="0.45" />
                    {!dim && (
                        <circle
                            r="1.6"
                            fill={c.primary}
                            opacity="0.95"
                            style={{ filter: `drop-shadow(0 0 5px ${c.glow})` }}
                        >
                            {/* #4 Telemetría viva — paquete de luz circulando el cristal (data en circuito). SMIL nativo (perf 10K). */}
                            <animateMotion
                                dur="4.2s"
                                repeatCount="indefinite"
                                path="M12,2 L20.6,7 L20.6,17 L12,22 L3.4,17 L3.4,7 Z"
                            />
                        </circle>
                    )}
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: c.primary,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {title}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.55)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {count} disponible{count === 1 ? "" : "s"}
                        </span>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.78)",
                        }}
                    >
                        {body}
                    </p>
                </div>
            </div>
        )
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483647,
                        background: "rgba(2,5,12,0.78)",
                        backdropFilter: "blur(14px) saturate(140%)",
                        WebkitBackdropFilter: "blur(14px) saturate(140%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{
                            duration: 0.42,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 460,
                            background:
                                "linear-gradient(165deg, rgba(8,15,30,0.94) 0%, rgba(2,8,18,0.97) 100%)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 24,
                            padding: "32px 26px 26px",
                            boxShadow:
                                "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Aurora dorado/cyan al fondo */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: `radial-gradient(circle at 28% -10%, ${codice.soft} 0%, transparent 55%), radial-gradient(circle at 78% -10%, ${medi.soft} 0%, transparent 55%)`,
                            }}
                        />

                        {/* Botón cerrar */}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.7)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                lineHeight: 1,
                                padding: 0,
                                zIndex: 2,
                            }}
                        >
                            ×
                        </button>

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.32em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.45)",
                                    textAlign: "center",
                                }}
                            >
                                Cristales de Extracción
                            </h3>
                            <h2
                                style={{
                                    margin: "10px 0 18px",
                                    fontSize: 22,
                                    fontWeight: 200,
                                    letterSpacing: "0.05em",
                                    color: "#fff",
                                    textAlign: "center",
                                    lineHeight: 1.25,
                                }}
                            >
                                Tu llave mensual a la Holoteca
                            </h2>

                            <p
                                style={{
                                    margin: "0 0 22px",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    color: "rgba(255,255,255,0.78)",
                                    textAlign: "center",
                                }}
                            >
                                Tu Sintonía Solar te entrega{" "}
                                <strong style={{ color: "#fff", fontWeight: 600 }}>
                                    dos cristales cada mes
                                </strong>
                                : uno dorado y uno cyan. Cada cristal
                                desbloquea una pieza de la Holoteca a tu
                                elección.
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                {renderRow(
                                    "codice",
                                    codiceCount,
                                    "Cristal de Códice",
                                    "Canjéalo por el Códice que elijas, completo: ebook, PDF y su audiolibro cuando exista."
                                )}
                                {renderRow(
                                    "meditacion",
                                    meditacionCount,
                                    "Cristal de Meditación",
                                    "Canjéalo por una Meditación a tu elección."
                                )}
                            </div>

                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: 1.55,
                                    color: "rgba(255,255,255,0.5)",
                                    textAlign: "center",
                                    fontStyle: "italic",
                                }}
                            >
                                Si no canjeas en el ciclo, los cristales se
                                guardan para la próxima extracción —
                                acumulables sin caducar.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ═════════════════════════════════════════════════════════════
   CODICE CRISTAL GATE — muro de pago de Códices
   ─────────────────────────────────────────────────────────────
   Se abre cuando el Tripulante toca "DESBLOQUEAR / PDF + Ebook" en
   un Códice y NO puede canjear (sin Cristal de Códice). Mismo look
   que CristalesInfoModal.

   App Store 3.1.1: NO hay IAP de Códice individual. La compra suelta
   de 333 MXN por Stripe se muestra SOLO en web (!isNative). En iOS el
   muro ofrece ÚNICAMENTE el camino Sintonía (PlanSelector → StoreKit).
   En web (este repo) isNative llega por prop con default false → la
   pastilla de 333 MXN SÍ se muestra.
   ═════════════════════════════════════════════════════════════ */

export function CodiceCristalGate({
    open = false,
    onClose = () => {},
    bookTitle = "este Códice",
    isMember = false,
    isNative = false,
    onSubscribe,
    digitalStripeHref = "",
}: {
    open?: boolean
    onClose?: () => void
    bookTitle?: string
    isMember?: boolean
    isNative?: boolean
    onSubscribe?: () => void
    digitalStripeHref?: string
}) {
    if (typeof document === "undefined") return null

    const codice = CRISTAL_COLORS.codice
    const medi = CRISTAL_COLORS.meditacion

    // Miembro que ya gastó sus cristales esta luna vs invitado sin cristales.
    const title = isMember ? "Ya usaste tus Cristales" : "Aún no tienes Cristales"
    const lead = isMember
        ? `Tus Cristales se renuevan con tu próxima luna. Mientras tanto puedes adquirir «${bookTitle}» por separado.`
        : `Para desbloquear «${bookTitle}» necesitas un Cristal de Códice.`

    /* Fila explicativa del cristal — count 0 (atenuada). Reusa el
       mismo lenguaje visual que CristalesInfoModal. */
    const renderRow = (
        kind: CristalKind,
        title2: string,
        body: string
    ) => {
        const c = CRISTAL_COLORS[kind]
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 16px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    opacity: 0.55,
                }}
            >
                <svg
                    width={36}
                    height={36}
                    viewBox="0 0 24 24"
                    style={{
                        flex: "0 0 auto",
                        filter: `drop-shadow(0 0 8px ${c.glow})`,
                        marginTop: 2,
                    }}
                >
                    <polygon
                        points="12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7"
                        fill={c.soft}
                        stroke={c.primary}
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                    />
                    <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="22"
                        stroke={c.primary}
                        strokeWidth="0.6"
                        opacity="0.55"
                    />
                    <line
                        x1="3.4"
                        y1="7"
                        x2="20.6"
                        y2="17"
                        stroke={c.primary}
                        strokeWidth="0.6"
                        opacity="0.45"
                    />
                    <line
                        x1="20.6"
                        y1="7"
                        x2="3.4"
                        y2="17"
                        stroke={c.primary}
                        strokeWidth="0.6"
                        opacity="0.45"
                    />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: c.primary,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {title2}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.45)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            0 disponibles
                        </span>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.7)",
                        }}
                    >
                        {body}
                    </p>
                </div>
            </div>
        )
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483647,
                        background: "rgba(2,5,12,0.78)",
                        backdropFilter: "blur(14px) saturate(140%)",
                        WebkitBackdropFilter: "blur(14px) saturate(140%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={
                            {
                                duration: 0.42,
                                ease: [0.22, 1, 0.36, 1],
                            } as any
                        }
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 460,
                            background:
                                "linear-gradient(165deg, rgba(8,15,30,0.94) 0%, rgba(2,8,18,0.97) 100%)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 24,
                            padding: "32px 26px 26px",
                            boxShadow:
                                "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: `radial-gradient(circle at 28% -10%, ${codice.soft} 0%, transparent 55%), radial-gradient(circle at 78% -10%, ${medi.soft} 0%, transparent 55%)`,
                            }}
                        />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.7)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                lineHeight: 1,
                                padding: 0,
                                zIndex: 2,
                            }}
                        >
                            ×
                        </button>

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.32em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.45)",
                                    textAlign: "center",
                                }}
                            >
                                Cristales de Extracción
                            </h3>
                            <h2
                                style={{
                                    margin: "10px 0 16px",
                                    fontSize: 22,
                                    fontWeight: 200,
                                    letterSpacing: "0.05em",
                                    color: "#fff",
                                    textAlign: "center",
                                    lineHeight: 1.25,
                                }}
                            >
                                {title}
                            </h2>

                            <p
                                style={{
                                    margin: "0 0 22px",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    color: "rgba(255,255,255,0.78)",
                                    textAlign: "center",
                                }}
                            >
                                {lead}
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                    marginBottom: 14,
                                }}
                            >
                                {renderRow(
                                    "codice",
                                    "Cristal de Códice",
                                    "Canjea cualquier Códice de Luz, completo: todos sus formatos."
                                )}
                                {renderRow(
                                    "meditacion",
                                    "Cristal de Meditación",
                                    "Canjea cualquier Meditación de la Holoteca."
                                )}
                            </div>

                            {!isMember && (
                                <p
                                    style={{
                                        margin: "0 0 22px",
                                        fontSize: 13,
                                        lineHeight: 1.55,
                                        color: "rgba(255,255,255,0.6)",
                                        textAlign: "center",
                                    }}
                                >
                                    Con{" "}
                                    <strong
                                        style={{
                                            color: codice.primary,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Sintonía Solar
                                    </strong>{" "}
                                    recibes los dos cada mes.
                                </p>
                            )}

                            {/* CTA A — Activar Sintonía Solar (solo no-miembros).
                                Abre el PlanSelector (StoreKit en iOS / Stripe en
                                web), nunca un link directo. */}
                            {!isMember && onSubscribe && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose()
                                            setTimeout(() => onSubscribe(), 260)
                                        }}
                                        style={{
                                            width: "100%",
                                            marginBottom: 10,
                                            padding: "15px 20px",
                                            borderRadius: 14,
                                            border: "none",
                                            background: `linear-gradient(135deg, #F4D27A 0%, ${codice.primary} 55%, #C9962F 100%)`,
                                            color: "#1A1206",
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            letterSpacing: "0.04em",
                                            cursor: "pointer",
                                            boxShadow: `0 10px 28px rgba(212,168,67,0.32), inset 0 1px 0 rgba(255,255,255,0.35)`,
                                        }}
                                    >
                                        Activar Sintonía Solar
                                    </button>
                                </>
                            )}

                            {/* CTA C — Adquirir solo este Códice · 333 MXN.
                                SOLO web (!isNative): App Store 3.1.1 prohíbe
                                checkouts externos en iOS. NUNCA se renderiza en
                                iOS. */}
                            {!isNative && digitalStripeHref && (
                                <a
                                    href={digitalStripeHref}
                                    target="_self"
                                    onClick={onClose}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 2,
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "13px 20px",
                                        borderRadius: 14,
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        color: "rgba(255,255,255,0.86)",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        textAlign: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        Adquirir solo este Códice · 333 MXN
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "rgba(255,255,255,0.5)",
                                        }}
                                    >
                                        (El Códice completo · pago único)
                                    </span>
                                </a>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ═════════════════════════════════════════════════════════════
   CONFIRMAR CRISTAL MODAL
   ═════════════════════════════════════════════════════════════ */

export interface ConfirmarCristalModalProps {
    open: boolean
    kind: CristalKind
    itemTitle: string
    itemSubtitle?: string
    /* Cuántos cristales quedan disponibles del kind dado. Cuando
       confirma, decrementa a count - 1. */
    countBefore: number
    onConfirm: () => Promise<void> | void
    onCancel: () => void
    /* Mensaje opcional debajo del título (ej. "1 cristal queda
       después de este canje"). */
    footnote?: string
}

export function ConfirmarCristalModal({
    open,
    kind,
    itemTitle,
    itemSubtitle,
    countBefore,
    onConfirm,
    onCancel,
    footnote,
}: ConfirmarCristalModalProps) {
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)
    const c = CRISTAL_COLORS[kind]

    useEffect(() => {
        if (!open) {
            setBusy(false)
            setDone(false)
        }
    }, [open])

    const handleConfirm = async () => {
        if (busy) return
        setBusy(true)
        try {
            await onConfirm()
            setDone(true)
            /* Pequeña pausa para que el usuario vea la animación
               de éxito antes de cerrar. */
            setTimeout(() => onCancel(), 1100)
        } catch (e) {
            console.warn("[cristal-modal] onConfirm error:", e)
            setBusy(false)
        }
    }

    if (typeof document === "undefined") return null

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483647,
                        background: "rgba(2,5,12,0.78)",
                        backdropFilter: "blur(14px) saturate(140%)",
                        WebkitBackdropFilter: "blur(14px) saturate(140%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        fontFamily: "'Inter',sans-serif",
                    }}
                    onClick={() => !busy && onCancel()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 12 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 460,
                            background:
                                "linear-gradient(165deg, rgba(8,15,30,0.92) 0%, rgba(2,8,18,0.95) 100%)",
                            border: `1px solid ${c.dim}`,
                            borderRadius: 24,
                            padding: "44px 32px 32px",
                            boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${c.dim}, inset 0 0 60px ${c.dim}`,
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Aurora background */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: `radial-gradient(circle at 50% 0%, ${c.soft} 0%, transparent 60%)`,
                            }}
                        />

                        {/* Cristal grande respirando */}
                        <motion.div
                            animate={
                                done
                                    ? {
                                          scale: [1, 1.4, 0.6],
                                          opacity: [1, 1, 0],
                                          rotate: [0, 12, 360],
                                      }
                                    : {
                                          scale: [1, 1.06, 1],
                                          opacity: [0.95, 1, 0.95],
                                      }
                            }
                            transition={
                                done
                                    ? { duration: 1.0, ease: [0.65, 0, 0.35, 1] }
                                    : {
                                          duration: 3.6,
                                          ease: "easeInOut",
                                          repeat: Infinity,
                                      }
                            }
                            style={{
                                width: 92,
                                height: 92,
                                margin: "0 auto 20px",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            <svg
                                width={92}
                                height={92}
                                viewBox="0 0 24 24"
                                style={{
                                    filter: `drop-shadow(0 0 22px ${c.glow})`,
                                }}
                            >
                                <polygon
                                    points="12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7"
                                    fill={c.soft}
                                    stroke={c.primary}
                                    strokeWidth="1.4"
                                    strokeLinejoin="round"
                                />
                                <line
                                    x1="12"
                                    y1="2"
                                    x2="12"
                                    y2="22"
                                    stroke={c.primary}
                                    strokeWidth="0.6"
                                    opacity="0.7"
                                />
                                <line
                                    x1="3.4"
                                    y1="7"
                                    x2="20.6"
                                    y2="17"
                                    stroke={c.primary}
                                    strokeWidth="0.6"
                                    opacity="0.55"
                                />
                                <line
                                    x1="20.6"
                                    y1="7"
                                    x2="3.4"
                                    y2="17"
                                    stroke={c.primary}
                                    strokeWidth="0.6"
                                    opacity="0.55"
                                />
                            </svg>
                        </motion.div>

                        {/* Título */}
                        <motion.div
                            animate={done ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                textAlign: "center",
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    letterSpacing: "0.32em",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    color: c.primary,
                                }}
                            >
                                Cristal de Extracción
                            </p>
                            <h3
                                style={{
                                    margin: "10px 0 6px",
                                    fontSize: 22,
                                    fontWeight: 300,
                                    letterSpacing: "0.04em",
                                    color: "#fff",
                                    lineHeight: 1.3,
                                }}
                            >
                                ¿Extraer este {kind === "codice" ? "Códice" : "Meditación"}?
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 400,
                                    color: "rgba(255,255,255,0.85)",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {itemTitle}
                            </p>
                            {itemSubtitle && (
                                <p
                                    style={{
                                        margin: "4px 0 0",
                                        fontSize: 12,
                                        fontWeight: 300,
                                        color: "rgba(255,255,255,0.5)",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {itemSubtitle}
                                </p>
                            )}
                            <p
                                style={{
                                    margin: "18px 0 0",
                                    fontSize: 11,
                                    fontWeight: 400,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.45)",
                                }}
                            >
                                {countBefore} cristal
                                {countBefore === 1 ? "" : "es"} disponible
                                {countBefore === 1 ? "" : "s"}
                                {footnote ? ` · ${footnote}` : ""}
                            </p>
                        </motion.div>

                        {/* Mensaje de éxito (overlay cuando done) */}
                        {done && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                    color: c.primary,
                                    fontWeight: 500,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    pointerEvents: "none",
                                }}
                            >
                                Extraído
                            </motion.div>
                        )}

                        {/* Botones */}
                        {!done && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    marginTop: 28,
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                <button
                                    onClick={() => !busy && onCancel()}
                                    disabled={busy}
                                    style={{
                                        flex: 1,
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(255,255,255,0.14)",
                                        background: "rgba(255,255,255,0.04)",
                                        color: "rgba(255,255,255,0.65)",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        cursor: busy ? "wait" : "pointer",
                                        opacity: busy ? 0.5 : 1,
                                        outline: "none",
                                        fontFamily: "'Inter',sans-serif",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={busy}
                                    style={{
                                        flex: 1.4,
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        border: `1px solid ${c.primary}`,
                                        background: `linear-gradient(135deg, ${c.soft} 0%, ${c.dim} 100%)`,
                                        color: c.primary,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        cursor: busy ? "wait" : "pointer",
                                        opacity: busy ? 0.7 : 1,
                                        outline: "none",
                                        fontFamily: "'Inter',sans-serif",
                                        boxShadow: busy
                                            ? "none"
                                            : `0 0 24px ${c.dim}, inset 0 0 18px ${c.dim}`,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {busy ? "Extrayendo…" : "Extraer"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ═════════════════════════════════════════════════════════════
   DEFAULT EXPORT — ghost component + utilities
   ═════════════════════════════════════════════════════════════ */

function CristalesRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
CristalesRoot.displayName = "RSV_Cristales"

const Cristales = Object.assign(CristalesRoot, {
    useCristales,
    useMembershipTier,
    useIsAdmin,
    CristalesIndicator,
    CristalesInfoModal,
    CodiceCristalGate,
    ConfirmarCristalModal,
    redeemCodiceWithCristal,
    redeemMeditacionWithCristal,
    registerMeditacionInmersionLibre,
    getMyMeditacionesOwned,
    adminRegenerateCristal,
    adminResetMyCodices,
    CRISTAL_COLORS,
})

export default Cristales
