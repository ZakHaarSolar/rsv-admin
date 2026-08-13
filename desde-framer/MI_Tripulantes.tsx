// MI_Tripulantes.tsx v1.7 — EL PADRÓN NO SE VUELVE A PEDIR AL CAMBIAR DE PESTAÑA
// (Zak): el Motor desmonta esta vista al salir y la remontaba en frío al volver,
// así que ir a otra pestaña y regresar costaba media docena de consultas y otra
// espera completa. Lo cargado vive ahora en un cofre de módulo: al montar se
// hidrata de ahí sin pedir nada, y las únicas dos cosas que traen datos nuevos
// son el botón de recargar y la primera visita de esta carga de la página
// (recargar la página vacía el cofre). Junto al botón se muestra de qué hora es
// lo que está en pantalla.
//
// MI_Tripulantes.tsx v1.6 — PADRÓN PAGINADO de 20 en 20 (Zak): el grid montaba los 44+ nodos de golpe; ahora pinta los 20 primeros del orden vigente (más recientes / más antiguos / sesión reciente) y un botón "+ Ver N más" al pie suma otros 20, con el contador "X de Y nodos". El total del encabezado sigue siendo el real; el contador vuelve a 20 al cambiar filtros u orden, y la navegación ‹ › del detalle recorre solo lo que está en pantalla.
// MI_Tripulantes.tsx v1.5 — orden "Sesión reciente": ordena el padrón por última sesión (last_active de Clerk, vía lastSignInMap) para ver al frente quién se conectó más recientemente. Grupo de orden renombrado "Orden". | v1.4 — filtros de membresía nuevos: Materia (Decodificador 199 · group 'decoder') y Sueños (Dual 399 · group 'dream'), con sus sets de hidratación + chips
// v1.3 — padrón/correo por gateway admin-action (cierra cadena anon→PII, barrido 2026-06-13)
// Vista del padrón de Nodos del Motor de Intervención.
// v1.2 — Ola C #3 Fase 3: la actividad de Clerk del padrón manda el token
// de sesión verificado a get-clerk-user-activity (ya no solo admin_clerk_id).
// v1.1 — Defaults defensivos en todas las props. Framer instancia
// componentes standalone al cargar el Code File; sin defaults el
// modalOpenRef era undefined y crasheaba el effect de tracking.
// Fetch del padrón completo (con + sin scan), hidratación de membership,
// gift, signup_dates, last_active y email flags. Filtros de membresía,
// suscripciones, tipo de nodo y antigüedad. Grid de cards + integración
// con el modal de detalle.
//
// Consumidor: MotorDeIntervencion (shell).

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import Shared from "./MI_Shared.tsx"
import TripulanteCard from "./MI_Cards.tsx"
import TripulanteDetail from "./MI_Detail.tsx"

const { rpc, adminAction } = Shared

interface TripulanteRow {
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

/* Ref-like fallback module-level para que `modalOpenRef.current = ...`
   no crashee cuando Framer instancia el componente standalone sin
   pasar el ref. */
const NOOP_MODAL_REF: React.MutableRefObject<boolean> = { current: false }

/* ═══════════════════════════════════════════════════════════════════
   🜂 v1.7 — EL PADRÓN NO SE VUELVE A PEDIR AL CAMBIAR DE PESTAÑA (Zak)

   El Motor DESMONTA esta vista al ir a otra pestaña y la vuelve a montar
   en frío al regresar: cada ida y vuelta disparaba media docena de
   consultas (padrón, membresías, actividad de Clerk, fechas de alta,
   regalos, banderas de correo) y otra espera de "Escaneando órbitas
   activas...". Ir a Espejo y volver costaba lo mismo que entrar por
   primera vez.

   Ahora lo ya cargado vive en un cofre de MÓDULO: al montar, la vista se
   hidrata de ahí y NO pide nada. La consulta real la disparan solo dos
   cosas — el botón de recargar, y la primera visita de esta carga de la
   página. Recargar la página vacía el cofre (el módulo se evalúa de
   nuevo), que es exactamente lo que Zak pidió.

   Sin caducidad por reloj a propósito: un padrón que se refresca solo
   "cuando ya pasó un rato" vuelve a ser impredecible. Aquí el dato en
   pantalla es siempre el de la última vez que ALGUIEN lo pidió.
   ═══════════════════════════════════════════════════════════════════ */
type PadronCofre = {
    tripulantes: TripulanteRow[]
    goldIds: Set<string>
    sintoniaIds: Set<string>
    inmersionIds: Set<string>
    materiaIds: Set<string>
    dualIds: Set<string>
    emailsById: Record<string, string>
    nodoIds: Set<string>
    optOutIds: Set<string>
    signupDates: Map<string, number>
    lastSignInMap: Map<string, number>
    giftIds: Set<string>
    sellado: number
}
let PADRON_COFRE: PadronCofre | null = null

function TripulantesView({
    url = "",
    apiKey = "",
    adminClerkId = "",
    modalOpenRef = NOOP_MODAL_REF,
}: {
    url?: string
    apiKey?: string
    adminClerkId?: string
    modalOpenRef?: React.MutableRefObject<boolean>
}) {
    /* Todo el estado del padrón nace del cofre si ya hay algo dentro. */
    const cofre = PADRON_COFRE
    const [tripulantes, setTripulantes] = useState<TripulanteRow[]>(
        () => cofre?.tripulantes ?? []
    )
    const [loading, setLoading] = useState(() => !cofre)
    const [err, setErr] = useState<string>("")
    const [selected, setSelected] = useState<TripulanteRow | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [goldIds, setGoldIds] = useState<Set<string>>(
        () => cofre?.goldIds ?? new Set()
    )
    const [sintoniaIds, setSintoniaIds] = useState<Set<string>>(
        () => cofre?.sintoniaIds ?? new Set()
    )
    const [inmersionIds, setInmersionIds] = useState<Set<string>>(
        () => cofre?.inmersionIds ?? new Set()
    )
    /* Tiers del Decodificador (IAP de Apple): Materia 199 (group 'decoder')
       y Materia + Sueños 399 (group 'dream'). */
    const [materiaIds, setMateriaIds] = useState<Set<string>>(
        () => cofre?.materiaIds ?? new Set()
    )
    const [dualIds, setDualIds] = useState<Set<string>>(
        () => cofre?.dualIds ?? new Set()
    )
    const [emailsById, setEmailsById] = useState<Record<string, string>>(
        () => cofre?.emailsById ?? {}
    )
    const [nodoIds, setNodoIds] = useState<Set<string>>(
        () => cofre?.nodoIds ?? new Set()
    )
    const [optOutIds, setOptOutIds] = useState<Set<string>>(
        () => cofre?.optOutIds ?? new Set()
    )
    const [filters, setFilters] = useState<{
        sub: "any" | "sintonia" | "inmersion" | "materia" | "dual" | "free"
        nodo: "any" | "in" | "no" | "out"
        scan: "any" | "with" | "no"
        cycles: "any" | 1 | 2 | 3 | 4
        sort: "newest" | "oldest" | "recent"
    }>({
        sub: "any",
        nodo: "any",
        scan: "any",
        cycles: "any",
        sort: "newest",
    })

    /* v1.6 — El padrón se pinta de 20 en 20 (PAGE_SIZE). Con 44+ nodos el
       grid montaba TODAS las tarjetas de golpe; ahora se muestran los 20
       primeros del orden vigente y un botón "+" al pie suma otros 20. El
       contador vuelve a 20 cuando cambia cualquier filtro o el orden (si no,
       "los 20 más recientes" mostraría 40 tras haber expandido). */
    const PAGE_SIZE = 20
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const [signupDates, setSignupDates] = useState<Map<string, number>>(
        () => cofre?.signupDates ?? new Map()
    )
    const [lastSignInMap, setLastSignInMap] = useState<
        Map<string, number>
    >(() => cofre?.lastSignInMap ?? new Map())
    const [giftIds, setGiftIds] = useState<Set<string>>(
        () => cofre?.giftIds ?? new Set()
    )
    /* Momento en que se selló lo que está en pantalla — se muestra junto al
       botón de recargar para que el dato viejo nunca se lea como fresco. */
    const [sellado, setSellado] = useState<number>(() => cofre?.sellado ?? 0)

    const tripulantesConScan = useMemo(() => {
        return tripulantes.filter(
            (t) =>
                (t.scan_count || 0) > 0 ||
                (t.complete_cycles || 0) > 0 ||
                (t.in_flight_pilars?.length || 0) > 0
        )
    }, [tripulantes])
    const tripulantesActivos = useMemo(() => {
        if (filters.scan === "with") return tripulantesConScan
        if (filters.scan === "no")
            return tripulantes.filter(
                (t) =>
                    (t.scan_count || 0) === 0 &&
                    (t.complete_cycles || 0) === 0 &&
                    (t.in_flight_pilars?.length || 0) === 0
            )
        return tripulantes
    }, [tripulantes, tripulantesConScan, filters.scan])

    const tripulantesVisibles = useMemo(() => {
        return tripulantesActivos.filter((t) => {
            const id = t.clerk_user_id
            if (filters.sub === "sintonia" && !sintoniaIds.has(id))
                return false
            if (filters.sub === "inmersion" && !inmersionIds.has(id))
                return false
            if (filters.sub === "materia" && !materiaIds.has(id))
                return false
            if (filters.sub === "dual" && !dualIds.has(id)) return false
            if (filters.sub === "free" && goldIds.has(id)) return false
            if (filters.nodo === "in" && !nodoIds.has(id)) return false
            if (filters.nodo === "out" && !optOutIds.has(id)) return false
            if (
                filters.nodo === "no" &&
                (nodoIds.has(id) || optOutIds.has(id))
            )
                return false
            if (filters.cycles !== "any") {
                const target = filters.cycles
                const cc = t.complete_cycles || 0
                if (target === 4) {
                    if (cc < 4) return false
                } else {
                    if (cc !== target) return false
                }
            }
            return true
        })
    }, [
        tripulantesActivos,
        goldIds,
        sintoniaIds,
        inmersionIds,
        materiaIds,
        dualIds,
        nodoIds,
        optOutIds,
        filters,
    ])
    const tripulantesOrdenados = useMemo(() => {
        const copy = [...tripulantesVisibles]
        copy.sort((a, b) => {
            if (filters.sort === "recent") {
                // Última sesión (last_active de Clerk) — el más reciente al frente.
                const aa = lastSignInMap.get(a.clerk_user_id) ?? 0
                const ab = lastSignInMap.get(b.clerk_user_id) ?? 0
                return ab - aa
            }
            const ta = signupDates.get(a.clerk_user_id) ?? 0
            const tb = signupDates.get(b.clerk_user_id) ?? 0
            if (filters.sort === "newest") return tb - ta
            return ta - tb
        })
        return copy
    }, [tripulantesVisibles, signupDates, lastSignInMap, filters.sort])

    /* Al cambiar filtros u orden, el padrón vuelve a su primera página. */
    useEffect(() => {
        setVisibleCount(PAGE_SIZE)
    }, [filters])

    /* Lo que realmente se monta en el grid. La navegación ‹ › del detalle
       recorre esta misma lista, así el modal no salta a un nodo que no está
       en pantalla. */
    const tripulantesMostrados = useMemo(
        () => tripulantesOrdenados.slice(0, visibleCount),
        [tripulantesOrdenados, visibleCount]
    )
    const restantes = tripulantesOrdenados.length - tripulantesMostrados.length

    const filtersActive =
        filters.sub !== "any" ||
        filters.nodo !== "any" ||
        filters.scan !== "any" ||
        filters.cycles !== "any"

    useEffect(() => {
        modalOpenRef.current = !!selected
        return () => {
            modalOpenRef.current = false
        }
    }, [selected, modalOpenRef])

    const selectedIdx = selected
        ? tripulantesMostrados.findIndex(
              (x) => x.clerk_user_id === selected.clerk_user_id
          )
        : -1
    const goPrev = useCallback(() => {
        if (selectedIdx < 0 || tripulantesMostrados.length < 2) return
        const n = tripulantesMostrados.length
        setSelected(tripulantesMostrados[(selectedIdx - 1 + n) % n])
    }, [selectedIdx, tripulantesMostrados])
    const goNext = useCallback(() => {
        if (selectedIdx < 0 || tripulantesMostrados.length < 2) return
        const n = tripulantesMostrados.length
        setSelected(tripulantesMostrados[(selectedIdx + 1) % n])
    }, [selectedIdx, tripulantesMostrados])

    const fetchTripulantes = useCallback(
        async (silent: boolean = false) => {
            if (!url || !apiKey || !adminClerkId) {
                setLoading(false)
                return
            }
            if (silent) setRefreshing(true)
            else setLoading(true)
            setErr("")
            try {
                const fetchProfilesNoScanRaw = async (): Promise<
                    TripulanteRow[]
                > => {
                    try {
                        // Gateway admin-action (token verificado) + fallback transitorio hasta el REVOKE.
                        const viaGw = await adminAction(
                            url,
                            apiKey,
                            "get_profiles_no_scan",
                            {}
                        )
                        if (Array.isArray(viaGw))
                            return viaGw as TripulanteRow[]
                        const rawRes = await fetch(
                            `${url}/rest/v1/rpc/get_profiles_no_scan`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    apikey: apiKey,
                                    Authorization: `Bearer ${apiKey}`,
                                },
                                body: JSON.stringify({
                                    p_admin_clerk_id: adminClerkId,
                                }),
                            }
                        )
                        const rawText = await rawRes.text()
                        if (!rawRes.ok) {
                            console.error(
                                `[motor profiles_no_scan] HTTP ${rawRes.status} · body=${rawText.slice(0, 400)}`
                            )
                            return []
                        }
                        try {
                            const parsed = JSON.parse(rawText)
                            if (Array.isArray(parsed)) {
                                console.log(
                                    `[motor profiles_no_scan] OK · ${parsed.length} rows`,
                                    parsed.slice(0, 3)
                                )
                                return parsed as TripulanteRow[]
                            }
                            console.warn(
                                "[motor profiles_no_scan] respuesta no es array:",
                                parsed
                            )
                            return []
                        } catch (parseErr) {
                            console.error(
                                "[motor profiles_no_scan] parse fail:",
                                rawText.slice(0, 400)
                            )
                            return []
                        }
                    } catch (rawErr) {
                        console.error(
                            "[motor profiles_no_scan] fetch raw fail:",
                            rawErr
                        )
                        return []
                    }
                }
                const fetchClerkActivitySafe = async (): Promise<
                    Map<string, number>
                > => {
                    try {
                        const r = await fetch(
                            `${url}/functions/v1/get-clerk-user-activity`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    apikey: apiKey,
                                    Authorization: `Bearer ${apiKey}`,
                                },
                                body: JSON.stringify({
                                    admin_clerk_id: adminClerkId,
                                    token: await (
                                        window as any
                                    ).Clerk?.session?.getToken?.(),
                                }),
                            }
                        )
                        if (!r.ok) {
                            const text = await r.text()
                            console.warn(
                                `[motor clerk_activity] HTTP ${r.status}: ${text.slice(0, 300)}`
                            )
                            return new Map()
                        }
                        const data = await r.json()
                        const arr = Array.isArray(data?.users)
                            ? data.users
                            : []
                        const m = new Map<string, number>()
                        for (const row of arr) {
                            if (!row?.clerk_user_id) continue
                            const active =
                                typeof row.last_active_at === "number"
                                    ? row.last_active_at
                                    : 0
                            const signin =
                                typeof row.last_sign_in_at === "number"
                                    ? row.last_sign_in_at
                                    : 0
                            const ts = active > 0 ? active : signin
                            if (ts > 0) m.set(row.clerk_user_id, ts)
                        }
                        console.log(
                            `[motor clerk_activity] ${m.size} last_active hidratados`
                        )
                        return m
                    } catch (e) {
                        console.warn("[motor clerk_activity] fail:", e)
                        return new Map()
                    }
                }
                const fetchSignupDatesSafe = async (): Promise<
                    Map<string, number>
                > => {
                    try {
                        const r =
                            (await adminAction(
                                url,
                                apiKey,
                                "get_tripulantes_signup_dates",
                                {}
                            )) ??
                            (await rpc(
                                url,
                                apiKey,
                                "get_tripulantes_signup_dates",
                                { p_admin_clerk_id: adminClerkId }
                            ))
                        const arr = Array.isArray(r)
                            ? (r as Array<{
                                  clerk_user_id: string
                                  profile_created_at: string | null
                              }>)
                            : []
                        const m = new Map<string, number>()
                        for (const row of arr) {
                            if (!row?.clerk_user_id) continue
                            const ts = row.profile_created_at
                                ? Date.parse(row.profile_created_at)
                                : 0
                            if (!Number.isNaN(ts)) {
                                m.set(row.clerk_user_id, ts || 0)
                            }
                        }
                        console.log(
                            `[motor signup_dates] ${m.size} fechas hidratadas`
                        )
                        return m
                    } catch (e) {
                        console.warn(
                            "[motor signup_dates] fail (RPC desplegada?):",
                            e
                        )
                        return new Map()
                    }
                }
                const fetchGiftFlagsSafe = async (): Promise<Set<string>> => {
                    try {
                        const r =
                            (await adminAction(
                                url,
                                apiKey,
                                "get_tripulantes_gift_flags",
                                {}
                            )) ??
                            (await rpc(
                                url,
                                apiKey,
                                "get_tripulantes_gift_flags",
                                { p_admin_clerk_id: adminClerkId }
                            ))
                        const arr = Array.isArray(r) ? r : []
                        const s = new Set<string>()
                        for (const row of arr) {
                            if (row?.clerk_user_id) {
                                s.add(row.clerk_user_id)
                            }
                        }
                        console.log(
                            `[motor gift_flags] ${s.size} tripulantes con cortesía`
                        )
                        return s
                    } catch (e) {
                        console.warn(
                            "[motor gift_flags] fail (RPC desplegada?):",
                            e
                        )
                        return new Set()
                    }
                }
                const [
                    rWith,
                    rowsWithout,
                    signupMap,
                    clerkActivityMap,
                    giftSet,
                ] = await Promise.all([
                    (async () =>
                        (await adminAction(
                            url,
                            apiKey,
                            "get_tripulantes_scan_activity",
                            {}
                        )) ??
                        (await rpc(
                            url,
                            apiKey,
                            "get_tripulantes_scan_activity",
                            { p_admin_clerk_id: adminClerkId }
                        )))(),
                    fetchProfilesNoScanRaw(),
                    fetchSignupDatesSafe(),
                    fetchClerkActivitySafe(),
                    fetchGiftFlagsSafe(),
                ])
                setSignupDates(signupMap)
                setLastSignInMap(clerkActivityMap)
                setGiftIds(giftSet)
                const collectRows = (raw: any): TripulanteRow[] => {
                    if (Array.isArray(raw)) return raw as TripulanteRow[]
                    if (raw && Array.isArray((raw as any).data))
                        return (raw as any).data
                    return []
                }
                const rowsWith = collectRows(rWith)
                console.log(
                    `[motor padrón] scan_activity=${rowsWith.length} · no_scan=${rowsWithout.length}`
                )
                const seen = new Set<string>(
                    rowsWith.map((r) => r.clerk_user_id).filter(Boolean)
                )
                const rows: TripulanteRow[] = [
                    ...rowsWith,
                    ...rowsWithout.filter(
                        (r) => r.clerk_user_id && !seen.has(r.clerk_user_id)
                    ),
                ]
                setTripulantes(rows)

                const ids = rows
                    .map((x) => x.clerk_user_id)
                    .filter((x) => !!x)
                if (ids.length > 0) {
                    const flagsPromises = ids.map(async (id) => {
                        try {
                            // Gateway admin-action + fallback transitorio.
                            let r = await adminAction(
                                url,
                                apiKey,
                                "get_tripulante_extras",
                                { target_clerk_id: id }
                            )
                            if (r == null) {
                                r = await rpc(
                                    url,
                                    apiKey,
                                    "get_tripulante_extras",
                                    {
                                        target_clerk_id: id,
                                        admin_clerk_id: adminClerkId,
                                    }
                                )
                            }
                            const row = Array.isArray(r) ? r[0] : r
                            const r0 = row as any
                            const rawTier =
                                typeof r0?.tier === "string"
                                    ? r0.tier.toLowerCase()
                                    : ""
                            return {
                                id,
                                isGold: !!r0?.is_subscriber,
                                tier: rawTier,
                                email:
                                    typeof r0?.email === "string"
                                        ? r0.email
                                        : "",
                            }
                        } catch (e) {
                            console.warn(
                                "[motor gold] extras fail for",
                                id,
                                e
                            )
                            return { id, isGold: false, tier: "", email: "" }
                        }
                    })
                    const results = await Promise.all(flagsPromises)
                    const next = new Set<string>()
                    const nextSintonia = new Set<string>()
                    const nextInmersion = new Set<string>()
                    const nextMateria = new Set<string>()
                    const nextDual = new Set<string>()
                    const nextEmails: Record<string, string> = {}
                    for (const r of results) {
                        if (r.isGold) next.add(r.id)
                        if (r.tier === "sintonia") nextSintonia.add(r.id)
                        else if (
                            r.tier === "inmersion" ||
                            r.tier === "cuasar" ||
                            r.tier === "pulsar"
                        )
                            nextInmersion.add(r.id)
                        else if (r.tier === "decoder") nextMateria.add(r.id)
                        else if (r.tier === "dream") nextDual.add(r.id)
                        if (r.email && r.email.trim().length > 0) {
                            nextEmails[r.id] = r.email.trim()
                        }
                    }
                    if (adminClerkId) next.add(adminClerkId)
                    console.log(
                        "[motor gold] hydrated",
                        ids.length,
                        "tripulantes →",
                        next.size,
                        "doradas,",
                        nextSintonia.size,
                        "sintonia,",
                        nextInmersion.size,
                        "inmersion,",
                        Object.keys(nextEmails).length,
                        "emails"
                    )
                    setGoldIds(next)
                    setSintoniaIds(nextSintonia)
                    setInmersionIds(nextInmersion)
                    setMateriaIds(nextMateria)
                    setDualIds(nextDual)
                    setEmailsById(nextEmails)
                } else {
                    setGoldIds(new Set())
                    setSintoniaIds(new Set())
                    setInmersionIds(new Set())
                    setMateriaIds(new Set())
                    setDualIds(new Set())
                    setEmailsById({})
                }

                try {
                    let flagsRows: Array<{
                        clerk_user_id: string
                        in_nodo: boolean
                        has_opt_out: boolean
                    }> = []
                    // Gateway admin-action (token verificado) + fallback transitorio hasta el REVOKE.
                    const gwFlags = await adminAction(
                        url,
                        apiKey,
                        "get_tripulantes_email_flags",
                        {}
                    )
                    if (Array.isArray(gwFlags)) {
                        flagsRows = gwFlags as any
                    } else try {
                        const rawRes = await fetch(
                            `${url}/rest/v1/rpc/get_tripulantes_email_flags`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    apikey: apiKey,
                                    Authorization: `Bearer ${apiKey}`,
                                },
                                body: JSON.stringify({
                                    p_admin_clerk_id: adminClerkId,
                                }),
                            }
                        )
                        const rawText = await rawRes.text()
                        if (!rawRes.ok) {
                            console.error(
                                `[motor email flags] HTTP ${rawRes.status} · body=${rawText}`
                            )
                        } else {
                            try {
                                const parsed = JSON.parse(rawText)
                                if (Array.isArray(parsed)) {
                                    flagsRows = parsed as any
                                } else {
                                    console.warn(
                                        "[motor email flags] respuesta no es array:",
                                        parsed
                                    )
                                }
                            } catch (parseErr) {
                                console.error(
                                    "[motor email flags] parse fail:",
                                    rawText
                                )
                            }
                        }
                    } catch (rawErr) {
                        console.error(
                            "[motor email flags] fetch raw fail:",
                            rawErr
                        )
                    }
                    const nodoSet = new Set<string>()
                    const outSet = new Set<string>()
                    for (const fr of flagsRows) {
                        if (fr.in_nodo) nodoSet.add(fr.clerk_user_id)
                        if (fr.has_opt_out) outSet.add(fr.clerk_user_id)
                    }
                    console.log(
                        `[motor email flags] RPC devolvió ${flagsRows.length} rows · in_nodo=${nodoSet.size} · opt_out=${outSet.size}`,
                        {
                            sample: flagsRows.slice(0, 3),
                            nodo_ids_sample: Array.from(nodoSet).slice(0, 3),
                            opt_out_ids_sample: Array.from(outSet).slice(0, 3),
                        }
                    )
                    setNodoIds(nodoSet)
                    setOptOutIds(outSet)
                } catch (e) {
                    console.warn(
                        "[motor email flags] fail — RPC get_tripulantes_email_flags no desplegado?",
                        e
                    )
                    setNodoIds(new Set())
                    setOptOutIds(new Set())
                }
            } catch (e: any) {
                setErr(e?.message || "Error cargando tripulantes")
            } finally {
                /* Sello del momento: lo que se ve en pantalla es de AHORA.
                   Va antes de bajar las banderas de carga para que el
                   guardado del cofre ya lo encuentre puesto. */
                setSellado(Date.now())
                if (silent) setRefreshing(false)
                else setLoading(false)
            }
        },
        [url, apiKey, adminClerkId]
    )

    /* 🜂 Con el cofre lleno, montar NO pide nada. Sin él (primera visita de
       esta carga de la página), se consulta una sola vez. `fetchTripulantes`
       cambia de identidad cuando llegan las credenciales, y por eso el
       guardián mira el cofre y no un "ya monté": si las llaves aparecen
       tarde en la primera visita, la consulta debe seguir disparándose. */
    useEffect(() => {
        if (PADRON_COFRE) return
        fetchTripulantes(false)
    }, [fetchTripulantes])

    /* El cofre se sella al terminar cada consulta REAL — nunca con un error
       en pantalla (guardar un padrón vacío por una caída dejaría la vista
       en blanco hasta recargar la página). */
    useEffect(() => {
        if (loading || refreshing || err) return
        PADRON_COFRE = {
            tripulantes,
            goldIds,
            sintoniaIds,
            inmersionIds,
            materiaIds,
            dualIds,
            emailsById,
            nodoIds,
            optOutIds,
            signupDates,
            lastSignInMap,
            giftIds,
            sellado,
        }
    }, [
        loading,
        refreshing,
        err,
        tripulantes,
        goldIds,
        sintoniaIds,
        inmersionIds,
        materiaIds,
        dualIds,
        emailsById,
        nodoIds,
        optOutIds,
        signupDates,
        lastSignInMap,
        giftIds,
        sellado,
    ])

    const eliminarTripulante = useCallback(async () => {
        if (!selected || !adminClerkId) return
        setEliminando(true)
        try {
            // Gateway admin-action (DESTRUCTIVA) + fallback transitorio hasta el REVOKE.
            let r = await adminAction(
                url,
                apiKey,
                "delete_user_scan_data_admin",
                { p_target_clerk_id: selected.clerk_user_id }
            )
            if (r == null) {
                r = await rpc(
                    url,
                    apiKey,
                    "delete_user_scan_data_admin",
                    {
                        p_clerk_id: adminClerkId,
                        p_target_clerk_id: selected.clerk_user_id,
                    }
                )
            }
            if ((r as any)?.success) {
                setSelected(null)
                await fetchTripulantes(true)
            } else {
                console.error(
                    "[motor-delete] RPC fail",
                    r,
                    selected.clerk_user_id
                )
            }
        } catch (e: any) {
            console.error("[motor-delete] throw", e)
        } finally {
            setEliminando(false)
        }
    }, [selected, adminClerkId, url, apiKey, fetchTripulantes])

    useEffect(() => {
        if (!selected) return
        const fresh = tripulantes.find(
            (x) => x.clerk_user_id === selected.clerk_user_id
        )
        if (fresh && fresh !== selected) setSelected(fresh)
        else if (!fresh) setSelected(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripulantes])

    if (loading) {
        return (
            <div className="mi-trip-empty">
                <div className="mi-trip-empty-orb" />
                <p className="mi-trip-empty-msg">
                    Escaneando órbitas activas...
                </p>
            </div>
        )
    }

    if (err) {
        return (
            <div className="mi-trip-empty">
                <div className="mi-trip-empty-orb" />
                <p className="mi-trip-empty-msg">
                    {err}
                    <br />
                    <br />
                    ¿Está el RPC get_tripulantes_scan_activity desplegado en
                    Supabase?
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="mi-trip-hero">
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 14,
                    }}
                >
                    <span className="mi-trip-hero-count">
                        {tripulantesOrdenados.length}
                    </span>
                    <span className="mi-trip-hero-label">
                        {filtersActive
                            ? `de ${tripulantesActivos.length} en filtro`
                            : `nodo${tripulantesOrdenados.length !== 1 ? "s" : ""} activos`}
                    </span>
                    <button
                        type="button"
                        className={`mi-trip-hero-refresh${
                            refreshing ? " spinning" : ""
                        }`}
                        onClick={() => fetchTripulantes(true)}
                        disabled={refreshing}
                        aria-label="Refrescar lista de nodos"
                        title="Refrescar lista"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </button>
                    {/* De cuándo es lo que se está viendo. Sin esto, un padrón
                        que ya no se vuelve a pedir solo puede leerse como
                        recién traído — y no siempre lo es. */}
                    {sellado > 0 ? (
                        <span
                            title="El padrón se conserva al cambiar de pestaña. Recarga para traerlo de nuevo."
                            style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9.5,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                opacity: 0.4,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {refreshing
                                ? "Actualizando…"
                                : `Datos de las ${new Date(sellado).toLocaleTimeString(
                                      "es-MX",
                                      {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      }
                                  )}`}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="mi-trip-filters">
                <div className="mi-trip-filter-group">
                    <span className="mi-trip-filter-label">Membresía</span>
                    <button
                        className={`mi-trip-filter-pill${filters.sub === "any" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, sub: "any" }))
                        }
                    >
                        Todos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sub === "sintonia" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                sub:
                                    f.sub === "sintonia"
                                        ? "any"
                                        : "sintonia",
                            }))
                        }
                    >
                        Sintonía Solar
                    </button>
                    <button
                        className={`mi-trip-filter-pill gold${filters.sub === "inmersion" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                sub:
                                    f.sub === "inmersion"
                                        ? "any"
                                        : "inmersion",
                            }))
                        }
                    >
                        Inmersión Solar
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sub === "materia" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                sub: f.sub === "materia" ? "any" : "materia",
                            }))
                        }
                    >
                        Materia
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sub === "dual" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                sub: f.sub === "dual" ? "any" : "dual",
                            }))
                        }
                    >
                        Sueños
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sub === "free" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                sub: f.sub === "free" ? "any" : "free",
                            }))
                        }
                    >
                        Sin membresía
                    </button>
                </div>
                <div className="mi-trip-filter-group">
                    <span className="mi-trip-filter-label">Suscripciones</span>
                    <button
                        className={`mi-trip-filter-pill${filters.nodo === "any" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, nodo: "any" }))
                        }
                    >
                        Todos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.nodo === "in" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                nodo: f.nodo === "in" ? "any" : "in",
                            }))
                        }
                    >
                        Suscritos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.nodo === "no" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                nodo: f.nodo === "no" ? "any" : "no",
                            }))
                        }
                    >
                        No suscritos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.nodo === "out" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                nodo: f.nodo === "out" ? "any" : "out",
                            }))
                        }
                    >
                        Dados de baja
                    </button>
                </div>
                <div className="mi-trip-filter-group">
                    <span className="mi-trip-filter-label">Nodos</span>
                    <button
                        className={`mi-trip-filter-pill${filters.scan === "any" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, scan: "any" }))
                        }
                    >
                        Todos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.scan === "with" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, scan: "with" }))
                        }
                    >
                        Escaneo
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.scan === "no" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, scan: "no" }))
                        }
                    >
                        Sin Escaneo
                    </button>
                </div>
                <div className="mi-trip-filter-group">
                    <span className="mi-trip-filter-label">Ciclos</span>
                    <button
                        className={`mi-trip-filter-pill${filters.cycles === "any" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, cycles: "any" }))
                        }
                    >
                        Todos
                    </button>
                    {[1, 2, 3].map((n) => (
                        <button
                            key={n}
                            className={`mi-trip-filter-pill${
                                filters.cycles === n ? " active" : ""
                            }`}
                            onClick={() =>
                                setFilters((f) => ({
                                    ...f,
                                    cycles:
                                        f.cycles === n
                                            ? "any"
                                            : (n as 1 | 2 | 3),
                                }))
                            }
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        className={`mi-trip-filter-pill${filters.cycles === 4 ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({
                                ...f,
                                cycles: f.cycles === 4 ? "any" : 4,
                            }))
                        }
                    >
                        4+
                    </button>
                </div>
                <div className="mi-trip-filter-group">
                    <span className="mi-trip-filter-label">Orden</span>
                    <button
                        className={`mi-trip-filter-pill${filters.sort === "recent" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, sort: "recent" }))
                        }
                        title="Quién se conectó más recientemente al frente"
                    >
                        Sesión reciente
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sort === "newest" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, sort: "newest" }))
                        }
                        title="Recién registrados al frente"
                    >
                        Más nuevos
                    </button>
                    <button
                        className={`mi-trip-filter-pill${filters.sort === "oldest" ? " active" : ""}`}
                        onClick={() =>
                            setFilters((f) => ({ ...f, sort: "oldest" }))
                        }
                        title="Más antiguos al frente"
                    >
                        Más antiguos
                    </button>
                </div>
                {filtersActive && (
                    <button
                        className="mi-trip-filter-clear"
                        onClick={() =>
                            setFilters({
                                sub: "any",
                                nodo: "any",
                                scan: "any",
                                cycles: "any",
                                sort: "newest",
                            })
                        }
                    >
                        Limpiar filtros ✕
                    </button>
                )}
            </div>
            {tripulantesOrdenados.length === 0 ? (
                <div className="mi-trip-empty">
                    <div className="mi-trip-empty-orb" />
                    <p className="mi-trip-empty-msg">
                        Ningún nodo coincide con los filtros aplicados.
                    </p>
                    <button
                        className="mi-trip-filter-pill active"
                        style={{ marginTop: 16 }}
                        onClick={() =>
                            setFilters({
                                sub: "any",
                                nodo: "any",
                                scan: "any",
                                cycles: "any",
                                sort: "newest",
                            })
                        }
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className="mi-trip-grid">
                        {tripulantesMostrados.map((t) => (
                            <TripulanteCard
                                key={t.clerk_user_id}
                                t={t}
                                onClick={() => setSelected(t)}
                                isGold={goldIds.has(t.clerk_user_id)}
                                isSintonia={sintoniaIds.has(t.clerk_user_id)}
                                isGift={giftIds.has(t.clerk_user_id)}
                                emailHint={emailsById[t.clerk_user_id] || ""}
                            />
                        ))}
                    </div>
                    {restantes > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 8,
                                marginTop: 22,
                            }}
                        >
                            <button
                                className="mi-trip-filter-pill"
                                style={{
                                    padding: "10px 26px",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    letterSpacing: "0.02em",
                                }}
                                onClick={() =>
                                    setVisibleCount((n) => n + PAGE_SIZE)
                                }
                            >
                                + Ver{" "}
                                {restantes < PAGE_SIZE ? restantes : PAGE_SIZE}{" "}
                                más
                            </button>
                            <span
                                style={{
                                    fontSize: 12,
                                    opacity: 0.5,
                                    letterSpacing: "0.03em",
                                }}
                            >
                                {tripulantesMostrados.length} de{" "}
                                {tripulantesOrdenados.length} nodos
                            </span>
                        </div>
                    )}
                </>
            )}
            {selected &&
                typeof document !== "undefined" &&
                createPortal(
                    <TripulanteDetail
                        t={selected}
                        onClose={() => setSelected(null)}
                        onPrev={goPrev}
                        onNext={goNext}
                        position={{
                            idx: selectedIdx,
                            total: tripulantesMostrados.length,
                        }}
                        onRefresh={() => fetchTripulantes(true)}
                        refreshing={refreshing}
                        onEliminar={eliminarTripulante}
                        eliminando={eliminando}
                        url={url}
                        apiKey={apiKey}
                        adminClerkId={adminClerkId}
                        isGoldInitial={goldIds.has(selected.clerk_user_id)}
                        isSintoniaInitial={sintoniaIds.has(
                            selected.clerk_user_id
                        )}
                        isGiftInitial={giftIds.has(selected.clerk_user_id)}
                        lastSignInAt={
                            lastSignInMap.get(selected.clerk_user_id) || null
                        }
                    />,
                    document.body
                )}
        </>
    )
}

TripulantesView.displayName = "MI_Tripulantes"
export default TripulantesView
