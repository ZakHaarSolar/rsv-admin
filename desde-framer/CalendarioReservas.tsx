// Red Solar Viva — CalendarioReservas.tsx v1.13 (Header del modal en 2 filas: "✦ Calendario" en la primera fila, "Cámara de Resonancia" o "Cámara Solar" en la segunda (según slot_type). Antes venía todo en línea con un punto medio. Aplica a desktop y mobile. v1.12 wizard mobile sin cambios.)
// Calendario nativo de reservas. Reemplaza el iframe de Calendly.
//
// v1.4 —
//   · UX 2-step para sesiones individuales: primero elige día (martes),
//     después elige hora dentro de ese día. Antes se mostraban los 20+
//     slots mezclados como tianguis. Grupales siguen con lista plana (1
//     slot por día) — sin cambios.
//   · Precio sin "$": "555 MXN", "2,222 MXN" (pref. Diego 2026-04-22).
//   · Hint "⌘+Enter para enviar" REMOVIDO del UI (usable pero invisible).
//
// v1.3 — Rediseño UX (título centrado, 1 col, inputs compactos, Cmd+Enter,
//        slot error flash, member badge).
// v1.2 — weeksAhead + minHeight slots + grid 2 cols fijo.
// v1.1 — sin addPropertyControls.
//
// Props vienen vía Domo → Sesiones → CalendarioReservas.

import * as React from "react"
import { useSolarBooking, type SlotType, type Slot } from "./useSolarBooking.tsx"

const CYAN = "#00E5FF"
const GOLD = "#D4A843"

/* ═══ Catálogo UI ═══ — mirror del PRODUCT_CATALOG de la edge function.
   El server re-calcula y valida para evitar manipulación. */
type PriceEntry = { label: string; regular: number; member: number }
const PRICE_DISPLAY: Record<SlotType, PriceEntry> = {
    grupal_pulsar: { label: "60 minutos", regular: 555, member: 555 },
    grupal_cuasar: { label: "60 minutos", regular: 555, member: 555 },
    individual_30: { label: "30 minutos", regular: 1333, member: 888 },
    individual_45: { label: "45 minutos", regular: 1777, member: 1111 },
    individual_60: { label: "60 minutos", regular: 2222, member: 1444 },
}

/* Formatea un número a string con coma como separador de miles.
   "1330" → "1,330". Uso: mostrar "1,330 MXN" sin signo de dólar. */
function fmtMXN(n: number): string {
    return `${n.toLocaleString("es-MX")} MXN`
}

interface Props {
    supabaseUrl: string
    supabaseAnonKey: string
    procesarIgnicionPagoUrl: string
    slotType: SlotType
    successUrl: string
    cancelUrl: string
    prefillName?: string
    prefillEmail?: string
    clerkUserId?: string
    isActiveMember?: boolean
    accentColor?: string
    weeksAhead?: number
    /* v1.11 — true cuando el modal se renderea en el Lente (mobile).
       Reduce paddings, alturas y oculta la columna de Horario hasta
       que el tripulante elige día (ahorra espacio vertical). */
    compact?: boolean
}

function formatTimeCancun(iso: string): string {
    return new Date(iso).toLocaleTimeString("es-MX", {
        timeZone: "America/Cancun",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

function formatDateCancun(iso: string): string {
    return new Date(iso).toLocaleDateString("es-MX", {
        timeZone: "America/Cancun",
        weekday: "long",
        day: "numeric",
        month: "long",
    })
}

/* v1.5 — helpers para zona horaria LOCAL del tripulante. Usan el TZ
   detectado por el navegador. Si el browser no lo expone (raro), fallback
   a "America/Cancun" para no romper. */
function detectLocalTz(): string {
    try {
        return (
            Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Cancun"
        )
    } catch {
        return "America/Cancun"
    }
}
function formatTimeLocal(iso: string, tz: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}
function formatNowInTz(tz: string): string {
    return new Date().toLocaleTimeString(undefined, {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

/* Devuelve la fecha en formato "YYYY-MM-DD" en zona Cancún para agrupar
   slots por día independiente de horario. */
function cancunDateKey(iso: string): string {
    const d = new Date(iso)
    const y = d.toLocaleString("en-US", {
        timeZone: "America/Cancun",
        year: "numeric",
    })
    const m = d.toLocaleString("en-US", {
        timeZone: "America/Cancun",
        month: "2-digit",
    })
    const day = d.toLocaleString("en-US", {
        timeZone: "America/Cancun",
        day: "2-digit",
    })
    return `${y}-${m}-${day}`
}

function CalendarioReservas({
    supabaseUrl,
    supabaseAnonKey,
    procesarIgnicionPagoUrl,
    slotType,
    successUrl,
    cancelUrl,
    prefillName,
    prefillEmail,
    clerkUserId,
    isActiveMember = false,
    accentColor = CYAN,
    weeksAhead = 4,
    compact = false,
}: Props) {
    /* v1.9 — Framer previsualiza este Code File standalone en Assets sin
       props. Sin este guard, todas las referencias a `slotType` (startsWith,
       PRICE_DISPLAY[slotType], load effect) tiran "Cannot read properties
       of undefined". En uso real (dentro de Sesiones.tsx), slotType siempre
       se pasa y este branch NUNCA se toma. */
    if (!slotType) {
        return (
            <div
                style={{
                    fontFamily: "'Inter',sans-serif",
                    color: "rgba(255,255,255,0.6)",
                    padding: 28,
                    borderRadius: 18,
                    background:
                        "linear-gradient(180deg, rgba(7,24,38,0.55), rgba(3,15,28,0.85))",
                    border: `1px solid ${accentColor}33`,
                    textAlign: "center",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                }}
            >
                ✦ CalendarioReservas · preview
                <div style={{ fontSize: 11, marginTop: 8, opacity: 0.6 }}>
                    Se monta con prop <code>slotType</code> desde{" "}
                    <code>Sesiones.tsx</code> → no colocar standalone.
                </div>
            </div>
        )
    }
    const cfg = React.useMemo(
        () => ({ supabaseUrl, supabaseAnonKey, procesarIgnicionPagoUrl }),
        [supabaseUrl, supabaseAnonKey, procesarIgnicionPagoUrl]
    )
    const { slotsByType, loadingType, error, loadSlots, startBooking } =
        useSolarBooking(cfg)

    const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(
        null
    )
    /* v1.4 — para sesiones individuales: día elegido (step 1). */
    const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(
        null
    )
    const [name, setName] = React.useState(prefillName || "")
    const [email, setEmail] = React.useState(prefillEmail || "")
    const [submitting, setSubmitting] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [slotErrorFlash, setSlotErrorFlash] = React.useState(false)
    /* v1.7 — pre-llenado desde Clerk cuando el tripulante está logueado.
       Lee window.Clerk.user (la instancia global inyectada por Domo) y
       rellena name + email automáticamente. El tripulante puede editarlos
       si quiere (no son read-only). Si prefillName/prefillEmail se pasan
       por prop (caller responsable), gana la prop. Si no, probamos Clerk.
       Polling sutil (hasta 40 intentos × 400ms = 16s) por si Clerk no
       hidrata al instante. */
    React.useEffect(() => {
        if (prefillName && prefillEmail) return // caller ya tiene todo
        let attempts = 0
        let cancelled = false
        const poll = () => {
            if (cancelled) return
            const user = (window as any).Clerk?.user
            if (user) {
                const u = user
                const fullName =
                    u.fullName ||
                    [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
                const pEmail =
                    u.primaryEmailAddress?.emailAddress ||
                    u.emailAddresses?.[0]?.emailAddress ||
                    ""
                if (!prefillName && fullName && !name) setName(fullName)
                if (!prefillEmail && pEmail && !email) setEmail(pEmail)
                /* v1.7 — si el caller no pasó clerkUserId pero Clerk
                   lo expone, guardamos el id localmente para mandarlo
                   al edge function (vincula la reserva al perfil para
                   que aparezca en MiNúcleo sin query por email). */
                if (!clerkUserId && u.id) {
                    ;(window as any).__rsvClerkUserId = u.id
                }
                return
            }
            if (attempts < 40) {
                attempts++
                setTimeout(poll, 400)
            }
        }
        poll()
        return () => {
            cancelled = true
        }
        // intencional: corre una sola vez al mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        const toIso = new Date(
            Date.now() + weeksAhead * 7 * 24 * 60 * 60 * 1000
        ).toISOString()
        loadSlots(slotType, undefined, toIso)
    }, [supabaseUrl, supabaseAnonKey, slotType, weeksAhead, loadSlots])

    /* Limpia el flash al elegir slot. Limpia day cuando cambia slotType. */
    React.useEffect(() => {
        if (selectedSlotId) setSlotErrorFlash(false)
    }, [selectedSlotId])
    React.useEffect(() => {
        setSelectedDateKey(null)
        setSelectedSlotId(null)
    }, [slotType])

    const slots: Slot[] = slotsByType[slotType] || []
    const isGroupal = slotType.startsWith("grupal_")
    const price = PRICE_DISPLAY[slotType]
    const priceToShow = isActiveMember ? price.member : price.regular
    const showMemberBadge = isActiveMember && price.member < price.regular

    /* v1.5 — timezone local del tripulante detectado una vez al mount.
       Si resulta ser America/Cancun, ocultamos la segunda línea de hora
       porque sería idéntica. Actualizamos "ahora" cada 30s para que el
       chip de referencia no se quede desfasado si el modal queda abierto. */
    const [localTz] = React.useState(detectLocalTz)
    const [nowLocal, setNowLocal] = React.useState(() => formatNowInTz(localTz))
    React.useEffect(() => {
        const t = setInterval(() => setNowLocal(formatNowInTz(localTz)), 30000)
        return () => clearInterval(t)
    }, [localTz])
    const showLocalTime = localTz !== "America/Cancun"

    /* ═══ v1.4 — Agrupar slots por día (solo para individuales) ═══
       Cada entry: fecha key + label + slots del día. */
    const groupedByDay = React.useMemo(() => {
        const map = new Map<
            string,
            { key: string; sampleIso: string; slots: Slot[] }
        >()
        for (const s of slots) {
            const k = cancunDateKey(s.start_time)
            const entry = map.get(k) || {
                key: k,
                sampleIso: s.start_time,
                slots: [] as Slot[],
            }
            entry.slots.push(s)
            map.set(k, entry)
        }
        return Array.from(map.values()).sort((a, b) =>
            a.key < b.key ? -1 : 1
        )
    }, [slots])

    const handleReservar = async () => {
        setSubmitError(null)
        if (!selectedSlotId) {
            setSlotErrorFlash(true)
            setSubmitError("Selecciona tu horario")
            return
        }
        if (name.trim().length < 2 || !/@/.test(email)) {
            setSubmitError("Nombre y email válidos requeridos")
            return
        }
        setSubmitting(true)
        const result = await startBooking({
            slot_id: selectedSlotId,
            slot_type: slotType,
            name: name.trim(),
            email: email.trim(),
            clerk_user_id:
                clerkUserId || (window as any).__rsvClerkUserId || null,
            success_url: successUrl,
            cancel_url: cancelUrl,
            is_active_member: isActiveMember,
            /* v1.8 — pasamos el timezone detectado por el browser al
               edge function. Viaja por metadata de Stripe → webhook de
               Supabase → webhook de Pipedream → PaseExploracion.js, que
               lo usa para renderizar el email "en la hora LOCAL real
               del tripulante" en vez de mentir con Cancún disfrazado. */
            timezone: localTz,
        } as any)
        setSubmitting(false)
        if ("error" in result) {
            setSubmitError(result.error)
            return
        }
        window.location.href = result.checkout_url
    }

    const accent = accentColor

    /* ═══ Render helpers ═══ */
    const renderSlotButton = (s: Slot, showDate: boolean) => {
        const isSelected = s.id === selectedSlotId
        const isFull = s.available <= 0
        return (
            <button
                key={s.id}
                type="button"
                disabled={isFull}
                onClick={() => setSelectedSlotId(s.id)}
                style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: `1px solid ${
                        isSelected
                            ? accent
                            : isFull
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(255,255,255,0.14)"
                    }`,
                    background: isSelected
                        ? `${accent}1f`
                        : isFull
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(255,255,255,0.04)",
                    color: isFull
                        ? "rgba(255,255,255,0.25)"
                        : isSelected
                          ? accent
                          : "rgba(255,255,255,0.92)",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 400,
                    textAlign: "left",
                    cursor: isFull ? "not-allowed" : "pointer",
                    transition: "all 0.18s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <span style={{ flex: 1, textTransform: "capitalize" }}>
                    {showDate && (
                        <div style={{ fontSize: 15, fontWeight: 500 }}>
                            {formatDateCancun(s.start_time)}
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: showDate ? 12 : 15,
                            fontWeight: showDate ? 400 : 500,
                            opacity: showDate ? 0.6 : 1,
                            letterSpacing: "0.05em",
                            marginTop: showDate ? 3 : 0,
                            textTransform: "none",
                        }}
                    >
                        {formatTimeCancun(s.start_time)} —{" "}
                        {formatTimeCancun(s.end_time)}
                    </div>
                    {showLocalTime && (
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 400,
                                opacity: 0.55,
                                marginTop: 2,
                                textTransform: "none",
                                color: "rgba(255,255,255,0.75)",
                            }}
                        >
                            {formatTimeLocal(s.start_time, localTz)} —{" "}
                            {formatTimeLocal(s.end_time, localTz)}
                            <span
                                style={{
                                    marginLeft: 6,
                                    fontSize: 10,
                                    opacity: 0.7,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                tu hora local
                            </span>
                        </div>
                    )}
                </span>
                {isGroupal && (
                    <span
                        style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: isFull
                                ? "rgba(255,107,107,0.12)"
                                : `${GOLD}1a`,
                            color: isFull ? "#FF6B6B" : GOLD,
                            whiteSpace: "nowrap",
                            letterSpacing: "0.04em",
                        }}
                    >
                        {isFull ? "Lleno" : `${s.available} cupos`}
                    </span>
                )}
            </button>
        )
    }

    /* step 1: lista de días con # de horarios disponibles.
       v1.8 — día seleccionado se destaca visualmente (border accent +
       background tinted + texto accent) y los no-seleccionados se
       atenúan ligeramente (opacity 0.55). Así el tripulante SIEMPRE sabe
       qué día tiene activo aunque esté mirando la columna de horarios. */
    const renderDayList = () =>
        groupedByDay.map((g) => {
            const availCount = g.slots.filter((s) => s.available > 0).length
            const allFull = availCount === 0
            const isSelected = g.key === selectedDateKey
            const anySelected = selectedDateKey !== null
            return (
                <button
                    key={g.key}
                    type="button"
                    disabled={allFull}
                    onClick={() => setSelectedDateKey(g.key)}
                    style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        border: `1px solid ${
                            isSelected
                                ? accent
                                : allFull
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(255,255,255,0.14)"
                        }`,
                        background: isSelected
                            ? `${accent}1f`
                            : allFull
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(255,255,255,0.04)",
                        color: isSelected
                            ? accent
                            : allFull
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(255,255,255,0.92)",
                        fontFamily: "inherit",
                        fontSize: 15,
                        fontWeight: isSelected ? 600 : 500,
                        textAlign: "left",
                        cursor: allFull ? "not-allowed" : "pointer",
                        transition: "all 0.18s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        textTransform: "capitalize",
                        /* los días NO seleccionados se atenúan cuando hay
                           uno activo — refuerza el foco en el seleccionado. */
                        opacity: anySelected && !isSelected && !allFull ? 0.55 : 1,
                        boxShadow: isSelected
                            ? `0 0 16px ${accent}22`
                            : "none",
                    }}
                >
                    <span>{formatDateCancun(g.sampleIso)}</span>
                    <span
                        style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: isSelected
                                ? `${accent}2e`
                                : allFull
                                  ? "rgba(255,107,107,0.12)"
                                  : `${accent}22`,
                            color: allFull ? "#FF6B6B" : accent,
                            whiteSpace: "nowrap",
                            letterSpacing: "0.04em",
                            textTransform: "none",
                            fontWeight: isSelected ? 600 : 400,
                        }}
                    >
                        {allFull ? "Lleno" : `${availCount} horarios`}
                    </span>
                </button>
            )
        })

    /* v1.6 — render de los horarios del día seleccionado (columna derecha
       en el layout 2-col de 1:1). Sin botón "← volver" porque ahora la
       lista de días sigue visible a la izquierda; el tripulante cambia
       de día clickeando otro ítem de la izquierda. */
    const renderTimeSlotsForDay = () => {
        const group = groupedByDay.find((g) => g.key === selectedDateKey)
        if (!group)
            return (
                <p
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        textAlign: "center",
                        padding: "80px 10px",
                        margin: 0,
                        letterSpacing: "0.08em",
                    }}
                >
                    Elige un día a la izquierda para ver los horarios
                    disponibles
                </p>
            )
        return <>{group.slots.map((s) => renderSlotButton(s, false))}</>
    }

    return (
        <div
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    if (!submitting) handleReservar()
                }
            }}
            style={{
                fontFamily: "'Inter',sans-serif",
                color: "#fff",
                padding: compact ? 18 : 28,
                borderRadius: 18,
                background:
                    "linear-gradient(180deg, rgba(7,24,38,0.55), rgba(3,15,28,0.85))",
                border: `1px solid ${accent}33`,
                backdropFilter: "blur(16px) saturate(160%)",
                boxShadow: `0 18px 48px rgba(0,0,0,0.45), 0 0 0 1px ${accent}1a`,
                width: "100%",
            }}
        >
            {/* ═══ HEADER ═══ */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: compact ? 14 : 22,
                }}
            >
                {/* v1.13 — título en 2 filas: "✦ Calendario" arriba,
                    "Cámara de Resonancia" (o "Cámara Solar") abajo. */}
                <h3
                    style={{
                        margin: 0,
                        fontSize: compact ? 13 : 16,
                        fontWeight: 200,
                        letterSpacing: compact ? "0.22em" : "0.28em",
                        textTransform: "uppercase",
                        color: `${accent}cc`,
                    }}
                >
                    ✦ Calendario
                </h3>
                <div
                    style={{
                        marginTop: compact ? 4 : 6,
                        fontSize: compact ? 17 : 22,
                        fontWeight: 300,
                        letterSpacing: compact ? "0.12em" : "0.16em",
                        textTransform: "uppercase",
                        color: accent,
                    }}
                >
                    {isGroupal ? "Cámara Solar" : "Cámara de Resonancia"}
                </div>
                <p
                    style={{
                        margin: "8px 0 0",
                        fontSize: 13,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.65)",
                        letterSpacing: "0.16em",
                    }}
                >
                    {price.label} ·{" "}
                    {showMemberBadge ? (
                        <>
                            <span
                                style={{
                                    textDecoration: "line-through",
                                    opacity: 0.45,
                                    marginRight: 8,
                                }}
                            >
                                {fmtMXN(price.regular)}
                            </span>
                            <span style={{ color: GOLD, fontWeight: 500 }}>
                                {fmtMXN(price.member)}
                            </span>
                        </>
                    ) : (
                        <span style={{ color: "rgba(255,255,255,0.85)" }}>
                            {fmtMXN(priceToShow)}
                        </span>
                    )}
                </p>
                {/* v1.5 — chip de zona horaria del tripulante. Confirma que
                    el browser detectó bien su zona y su hora actual, para que
                    no haya duda al comparar con el horario de sesión. */}
                <p
                    style={{
                        margin: "10px 0 0",
                        fontSize: 11,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "0.1em",
                    }}
                >
                    Tu zona: <span style={{ color: accent }}>{localTz}</span> ·
                    ahora son las{" "}
                    <span style={{ color: accent }}>{nowLocal}</span>
                </p>
            </div>

            {error && (
                <p
                    style={{
                        fontSize: 12,
                        color: "#FF6B6B",
                        margin: "0 0 12px",
                        textAlign: "center",
                    }}
                >
                    {error}
                </p>
            )}

            {/* ═══ SLOTS ═══
                Grupales: 1 columna con la lista plana (cada martes = 1 slot).
                Individuales: 2 columnas (días | horarios). Ambas visibles
                siempre. En viewports angostos se apilan automático (auto-fit). */}
            {loadingType === slotType && slots.length === 0 && (
                <p
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "60px 0",
                        margin: "0 0 20px",
                    }}
                >
                    Sintonizando órbitas disponibles…
                </p>
            )}
            {!loadingType && slots.length === 0 && (
                <p
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "60px 0",
                        margin: "0 0 20px",
                    }}
                >
                    No hay horarios abiertos.
                </p>
            )}

            {slots.length > 0 && isGroupal && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 8,
                        marginBottom: compact ? 14 : 20,
                        minHeight: compact ? 160 : 220,
                        maxHeight: compact ? 260 : 340,
                        overflowY: "auto",
                        paddingRight: 4,
                        alignContent: "start",
                        maxWidth: 460,
                        marginLeft: "auto",
                        marginRight: "auto",
                        border: slotErrorFlash
                            ? "1px solid rgba(255,107,107,0.45)"
                            : "1px solid transparent",
                        borderRadius: 12,
                        transition: "border-color 0.25s",
                        padding: slotErrorFlash ? 4 : 0,
                    }}
                >
                    {slots.map((s) => renderSlotButton(s, true))}
                </div>
            )}

            {slots.length > 0 && !isGroupal && (
                <div
                    style={{
                        maxWidth: 760,
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginBottom: compact ? 14 : 20,
                        border: slotErrorFlash
                            ? "1px solid rgba(255,107,107,0.45)"
                            : "1px solid transparent",
                        borderRadius: 12,
                        transition: "border-color 0.25s",
                        padding: slotErrorFlash ? 4 : 0,
                    }}
                >
                    {/* v1.12 — Wizard mobile: al elegir un día, se oculta
                        todo el picker de días y aparece el botón de volver
                        + sólo los horarios de ese día. Ahorra altura y
                        genera una transición clara de "paso 1 → paso 2". */}
                    {compact && selectedDateKey && (() => {
                        const selectedGroup = groupedByDay.find(
                            (g) => g.key === selectedDateKey
                        )
                        const fechaCorta = selectedGroup
                            ? formatDateCancun(selectedGroup.sampleIso)
                            : "otro día"
                        return (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDateKey(null)
                                    setSelectedSlotId(null)
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    background: `${accent}0d`,
                                    border: `1px solid ${accent}40`,
                                    borderRadius: 10,
                                    padding: "10px 12px",
                                    color: accent,
                                    fontSize: 12,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    marginBottom: 12,
                                    fontFamily: "inherit",
                                    textAlign: "left",
                                    transition: "background 0.18s",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 16,
                                        lineHeight: 1,
                                    }}
                                >
                                    ←
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        textTransform: "capitalize",
                                        fontWeight: 500,
                                    }}
                                >
                                    {fechaCorta}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        opacity: 0.7,
                                        letterSpacing: "0.1em",
                                    }}
                                >
                                    Cambiar día
                                </span>
                            </button>
                        )
                    })()}
                    <div
                        style={{
                            display: "grid",
                            /* v1.12 — en compact, nunca 2 columnas; mostramos
                               día o horario según el paso del wizard. */
                            gridTemplateColumns: compact
                                ? "1fr"
                                : "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: compact ? 10 : 16,
                        }}
                    >
                        {/* Picker de días — en compact, sólo se muestra
                            cuando NO hay día elegido (paso 1 del wizard). */}
                        {(!compact || !selectedDateKey) && (
                            <div
                                style={{
                                    display: "grid",
                                    gap: 8,
                                    minHeight: compact ? 160 : 260,
                                    maxHeight: compact ? 260 : 360,
                                    overflowY: "auto",
                                    paddingRight: 4,
                                    alignContent: "start",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.45)",
                                        textAlign: "center",
                                        padding: "0 0 4px",
                                    }}
                                >
                                    Día
                                </div>
                                {renderDayList()}
                            </div>
                        )}
                        {/* Picker de horarios — en compact, sólo cuando HAY
                            día elegido (paso 2 del wizard). En desktop va
                            siempre al lado del de días. */}
                        {(!compact || selectedDateKey) && (
                            <div
                                style={{
                                    display: "grid",
                                    gap: 8,
                                    minHeight: compact ? 160 : 260,
                                    maxHeight: compact ? 280 : 360,
                                    overflowY: "auto",
                                    paddingRight: 4,
                                    alignContent: "start",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.45)",
                                        textAlign: "center",
                                        padding: "0 0 4px",
                                    }}
                                >
                                    Horario
                                </div>
                                {renderTimeSlotsForDay()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ FORM ═══ */}
            <div
                style={{
                    display: "grid",
                    gap: 10,
                    maxWidth: 380,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                {!prefillName && (
                    <input
                        placeholder="Tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            fontFamily: "inherit",
                            fontSize: 15,
                            outline: "none",
                            textAlign: "center",
                        }}
                    />
                )}
                {!prefillEmail && (
                    <input
                        type="email"
                        placeholder="Tu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            fontFamily: "inherit",
                            fontSize: 15,
                            outline: "none",
                            textAlign: "center",
                        }}
                    />
                )}

                {submitError && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: "#FF6B6B",
                            letterSpacing: "0.05em",
                            textAlign: "center",
                            fontWeight: 500,
                        }}
                    >
                        {submitError}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleReservar}
                    disabled={submitting}
                    style={{
                        marginTop: 4,
                        padding: "14px 20px",
                        borderRadius: 10,
                        border: `1px solid ${accent}66`,
                        background: submitting
                            ? "rgba(255,255,255,0.04)"
                            : `linear-gradient(90deg, ${accent}33, ${GOLD}22)`,
                        color: submitting ? "rgba(255,255,255,0.4)" : "#fff",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        cursor: submitting ? "not-allowed" : "pointer",
                        transition: "all 0.22s",
                    }}
                >
                    {submitting ? "Sintonizando…" : "Reservar y Pagar"}
                </button>
            </div>
        </div>
    )
}

export default CalendarioReservas
