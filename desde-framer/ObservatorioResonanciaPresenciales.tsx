// Red Solar Viva — ObservatorioResonanciaPresenciales.tsx v1.2 — reservas VTLI por gateway admin-action (Batch 3 seguridad, barrido 2026-06-13)
// Lóbulo del Observatorio dedicado a las sesiones PRESENCIALES de Veo Tu Luz
// Interna (Cancún). Vive como tercera pestaña del Observatorio de Resonancia
// junto a "Macro · Cámara Solar" y "Micro · Ignición 1:1".
//
// v1.1 — Fix del monto inflado x3 (cada fila ya guarda el total del ciclo,
// NO multiplicar por sessions_count). Botón papelera en cada card para
// eliminar/cancelar el ciclo desde admin — llama al RPC
// vtli_admin_cancel_booking que libera los slots automáticamente vía
// trigger.
//
// Fuente de verdad: RPC `vtli_admin_list_bookings(p_admin_clerk_id, p_status, p_limit)`
// con admin gate vía profiles.is_admin. Lee `vtli_reservas` + `vtli_slots`.
//
// Visual premium · glassmorphism · agrupado por ciclo_group_id. Cada CICLO
// (no cada slot individual) es una card. Filtros por pilar y por status,
// chevron expandible para ver fechas detalladas + Stripe session ID +
// link de WhatsApp pre-rellenado para coordinar con el Tutor.
//
// Default export porque Framer no resuelve named exports cuando otro archivo
// hace `import X from "./Y.tsx"`.

import * as React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ════════════════════════════════════════════════════════════════
// Constantes
// ════════════════════════════════════════════════════════════════
const PILARES: Record<
    string,
    { label: string; accent: string; shadow: string }
> = {
    vision: {
        label: "Visión Extra Ocular",
        accent: "#B79CD8",
        shadow: "rgba(183,156,216,0.45)",
    },
    telekinesis: {
        label: "Telekinesis",
        accent: "#7CC4FF",
        shadow: "rgba(124,196,255,0.45)",
    },
    calibracion: {
        label: "Calibración Biológica",
        accent: "#6FCF97",
        shadow: "rgba(111,207,151,0.45)",
    },
    sintonia: {
        label: "Sintonía de Núcleo",
        accent: "#C8A44E",
        shadow: "rgba(200,164,78,0.55)",
    },
}

const SPANISH_DAY = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
]
const SPANISH_MONTH = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]

function formatLongDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number)
    if (!y || !m || !d) return iso
    const dt = new Date(y, m - 1, d)
    return `${SPANISH_DAY[dt.getDay()]} ${d} de ${SPANISH_MONTH[m - 1]}`
}
function formatTime(t: string): string {
    const [hh, mm] = t.split(":").map(Number)
    const period = hh >= 12 ? "pm" : "am"
    const hour12 = hh % 12 || 12
    return `${hour12}:${String(mm ?? 0).padStart(2, "0")} ${period}`
}
function formatMxn(cents: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(cents / 100)
}

type Booking = {
    reserva_id: string
    ciclo_group_id: string
    sequence_in_ciclo: number
    sessions_count: number
    pilar_id: string
    nombre: string
    email: string
    telefono: string | null
    is_for_child: boolean
    child_name: string | null
    child_age: number | null
    slot_date: string
    slot_time: string
    status: string
    amount_mxn_cents: number
    confirmed_at: string | null
    created_at: string
    stripe_session_id: string | null
}

type CicloAgrupado = {
    ciclo_group_id: string
    pilar_id: string
    nombre: string
    email: string
    telefono: string | null
    is_for_child: boolean
    child_name: string | null
    child_age: number | null
    sessions_count: number
    amount_mxn_cents: number
    confirmed_at: string | null
    stripe_session_id: string | null
    slots: { date: string; time: string; reserva_id: string }[]
    first_slot_iso: string
}

// ════════════════════════════════════════════════════════════════
// Componente raíz
// ════════════════════════════════════════════════════════════════
function ObservatorioResonanciaPresencialesInner({
    supabaseUrl,
    supabaseAnonKey,
    clerkId,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkId: string | null
}) {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pilarFilter, setPilarFilter] = useState<string>("todos")
    const [windowFilter, setWindowFilter] = useState<
        "proximas" | "pasadas" | "todas"
    >("proximas")
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    // Modal de confirmación admin para eliminar ciclos
    const [pendingDelete, setPendingDelete] =
        useState<CicloAgrupado | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!clerkId) {
            setError("Cargando identidad…")
            return
        }
        setLoading(true)
        setError(null)
        try {
            // Gateway admin-action (token verificado) + fallback transitorio hasta el REVOKE.
            const token = await (window as any).Clerk?.session?.getToken?.()
            const gwRes =
                token &&
                (await fetch(`${supabaseUrl}/functions/v1/admin-action`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        action: "vtli_admin_list_bookings",
                        params: { p_status: "confirmada", p_limit: 500 },
                    }),
                }))
            const res =
                gwRes && gwRes.ok
                    ? gwRes
                    : await fetch(
                          `${supabaseUrl}/rest/v1/rpc/vtli_admin_list_bookings`,
                          {
                              method: "POST",
                              headers: {
                                  "Content-Type": "application/json",
                                  apikey: supabaseAnonKey,
                                  Authorization: `Bearer ${supabaseAnonKey}`,
                              },
                              body: JSON.stringify({
                                  p_admin_clerk_id: clerkId,
                                  p_status: "confirmada",
                                  p_limit: 500,
                              }),
                          }
                      )
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt.slice(0, 200))
            }
            const rows: Booking[] = await res.json()
            setBookings(rows || [])
        } catch (e) {
            console.error("[obs-presenciales] load", e)
            setError(
                e instanceof Error
                    ? e.message
                    : "No pudimos cargar las reservas."
            )
        } finally {
            setLoading(false)
        }
    }, [supabaseUrl, supabaseAnonKey, clerkId])

    useEffect(() => {
        load()
    }, [load])

    const handleAdminCancel = useCallback(async () => {
        if (!pendingDelete || !clerkId) return
        setDeleting(true)
        setDeleteError(null)
        try {
            // Gateway admin-action (token verificado) + fallback transitorio hasta el REVOKE.
            const token = await (window as any).Clerk?.session?.getToken?.()
            const gwRes =
                token &&
                (await fetch(`${supabaseUrl}/functions/v1/admin-action`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        action: "vtli_admin_cancel_booking",
                        params: {
                            p_ciclo_group_id: pendingDelete.ciclo_group_id,
                        },
                    }),
                }))
            const res =
                gwRes && gwRes.ok
                    ? gwRes
                    : await fetch(
                          `${supabaseUrl}/rest/v1/rpc/vtli_admin_cancel_booking`,
                          {
                              method: "POST",
                              headers: {
                                  "Content-Type": "application/json",
                                  apikey: supabaseAnonKey,
                                  Authorization: `Bearer ${supabaseAnonKey}`,
                              },
                              body: JSON.stringify({
                                  p_admin_clerk_id: clerkId,
                                  p_ciclo_group_id:
                                      pendingDelete.ciclo_group_id,
                              }),
                          }
                      )
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt.slice(0, 200))
            }
            await res.json()
            setPendingDelete(null)
            await load()
        } catch (e) {
            setDeleteError(
                e instanceof Error
                    ? e.message
                    : "No pudimos eliminar el ciclo."
            )
        } finally {
            setDeleting(false)
        }
    }, [pendingDelete, clerkId, supabaseUrl, supabaseAnonKey, load])

    // Agrupar por ciclo_group_id
    const ciclos: CicloAgrupado[] = useMemo(() => {
        const map = new Map<string, CicloAgrupado>()
        for (const b of bookings) {
            const existing = map.get(b.ciclo_group_id)
            const slotEntry = {
                date: b.slot_date,
                time: b.slot_time,
                reserva_id: b.reserva_id,
            }
            if (existing) {
                existing.slots.push(slotEntry)
                if (b.slot_date < existing.first_slot_iso) {
                    existing.first_slot_iso = b.slot_date
                }
            } else {
                map.set(b.ciclo_group_id, {
                    ciclo_group_id: b.ciclo_group_id,
                    pilar_id: b.pilar_id,
                    nombre: b.nombre,
                    email: b.email,
                    telefono: b.telefono,
                    is_for_child: b.is_for_child,
                    child_name: b.child_name,
                    child_age: b.child_age,
                    sessions_count: b.sessions_count,
                    // Cada fila ya guarda el total del ciclo en amount_mxn_cents.
                    // NO multiplicar por sessions_count (eso infla el monto x3).
                    amount_mxn_cents: b.amount_mxn_cents,
                    confirmed_at: b.confirmed_at,
                    stripe_session_id: b.stripe_session_id,
                    slots: [slotEntry],
                    first_slot_iso: b.slot_date,
                })
            }
        }
        // Ordenar slots dentro de cada ciclo + ciclos por primer slot ascendente
        const arr = Array.from(map.values())
        arr.forEach((c) => {
            c.slots.sort((a, b) =>
                a.date === b.date
                    ? a.time.localeCompare(b.time)
                    : a.date.localeCompare(b.date)
            )
        })
        arr.sort((a, b) => a.first_slot_iso.localeCompare(b.first_slot_iso))
        return arr
    }, [bookings])

    // Filtros
    const filteredCiclos = useMemo(() => {
        const todayIso = new Date().toISOString().slice(0, 10)
        return ciclos.filter((c) => {
            if (pilarFilter !== "todos" && c.pilar_id !== pilarFilter)
                return false
            const last = c.slots[c.slots.length - 1]?.date || c.first_slot_iso
            if (windowFilter === "proximas" && last < todayIso) return false
            if (windowFilter === "pasadas" && c.first_slot_iso >= todayIso)
                return false
            return true
        })
    }, [ciclos, pilarFilter, windowFilter])

    const totalRevenue = useMemo(
        () => filteredCiclos.reduce((s, c) => s + c.amount_mxn_cents, 0),
        [filteredCiclos]
    )

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div
            style={{
                padding: "120px 32px 120px",
                minHeight: "100vh",
                color: "#E8EEF7",
                fontFamily: "Inter, sans-serif",
                maxWidth: 1280,
                margin: "0 auto",
            }}
        >
            {/* Header — eyebrow + titular + KPI row */}
            <header style={{ marginBottom: 36 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: 10.5,
                        letterSpacing: 4,
                        textTransform: "uppercase",
                        color: "rgba(232,238,247,0.55)",
                        fontWeight: 500,
                    }}
                >
                    Veo Tu Luz Interna · Cancún
                </p>
                <h1
                    style={{
                        margin: "10px 0 0",
                        fontSize: 34,
                        fontWeight: 200,
                        letterSpacing: 0.3,
                        color: "#E8EEF7",
                    }}
                >
                    Bitácora de Sesiones Presenciales
                </h1>
                <p
                    style={{
                        margin: "10px 0 0",
                        fontSize: 13.5,
                        color: "rgba(232,238,247,0.55)",
                        fontWeight: 300,
                        maxWidth: 620,
                        lineHeight: 1.65,
                    }}
                >
                    Lectura viva de cada lugar reservado en la matriz de 8
                    espacios semanales. Picá un ciclo para abrir sus fechas y
                    datos de contacto.
                </p>

                {/* KPI line */}
                <div
                    style={{
                        marginTop: 26,
                        display: "flex",
                        gap: 14,
                        flexWrap: "wrap",
                    }}
                >
                    <KPI
                        label="Ciclos activos"
                        value={String(filteredCiclos.length)}
                        accent="#7CC4FF"
                    />
                    <KPI
                        label="Sesiones totales"
                        value={String(
                            filteredCiclos.reduce(
                                (s, c) => s + c.slots.length,
                                0
                            )
                        )}
                        accent="#B79CD8"
                    />
                    <KPI
                        label="Ingreso filtrado"
                        value={formatMxn(totalRevenue)}
                        accent="#C8A44E"
                    />
                </div>
            </header>

            {/* Filtros */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 24,
                    marginBottom: 28,
                    alignItems: "center",
                }}
            >
                <FilterStrip
                    title="Pilar"
                    value={pilarFilter}
                    onChange={setPilarFilter}
                    options={[
                        { id: "todos", label: "Todos", accent: "#E8EEF7" },
                        ...Object.entries(PILARES).map(([k, p]) => ({
                            id: k,
                            label: p.label.split(" ")[0],
                            accent: p.accent,
                        })),
                    ]}
                />
                <FilterStrip
                    title="Ventana"
                    value={windowFilter}
                    onChange={(v) => setWindowFilter(v as any)}
                    options={[
                        { id: "proximas", label: "Próximas", accent: "#7CC4FF" },
                        { id: "pasadas", label: "Pasadas", accent: "#9AA8C2" },
                        { id: "todas", label: "Todas", accent: "#E8EEF7" },
                    ]}
                />
                <button
                    onClick={load}
                    disabled={loading}
                    style={{
                        marginLeft: "auto",
                        appearance: "none",
                        background: "rgba(124,196,255,0.08)",
                        border: "1px solid rgba(124,196,255,0.28)",
                        color: "#7CC4FF",
                        borderRadius: 999,
                        padding: "8px 18px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        letterSpacing: 2.4,
                        textTransform: "uppercase",
                        fontWeight: 600,
                        cursor: loading ? "wait" : "pointer",
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? "Sintonizando…" : "Refrescar"}
                </button>
            </div>

            {/* Error */}
            {error ? (
                <div
                    style={{
                        padding: "16px 20px",
                        background: "rgba(255,80,80,0.08)",
                        border: "1px solid rgba(255,80,80,0.32)",
                        borderRadius: 14,
                        color: "#FFB4B4",
                        fontSize: 13,
                        marginBottom: 22,
                    }}
                >
                    {error}
                </div>
            ) : null}

            {/* Empty */}
            {!loading && !error && filteredCiclos.length === 0 ? (
                <div
                    style={{
                        padding: "60px 24px",
                        textAlign: "center",
                        color: "rgba(232,238,247,0.45)",
                        fontSize: 14,
                        fontWeight: 300,
                        border: "1px dashed rgba(232,238,247,0.18)",
                        borderRadius: 18,
                    }}
                >
                    No hay ciclos para el filtro elegido.
                </div>
            ) : null}

            {/* Lista de ciclos */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                {filteredCiclos.map((c) => (
                    <CicloCard
                        key={c.ciclo_group_id}
                        ciclo={c}
                        expanded={expanded.has(c.ciclo_group_id)}
                        onToggle={() => toggleExpand(c.ciclo_group_id)}
                        onAskDelete={() => setPendingDelete(c)}
                    />
                ))}
            </div>

            {/* Modal admin: confirmar eliminación del ciclo */}
            <AnimatePresence>
                {pendingDelete ? (
                    <AdminDeleteModal
                        ciclo={pendingDelete}
                        deleting={deleting}
                        error={deleteError}
                        onClose={() => {
                            if (!deleting) {
                                setPendingDelete(null)
                                setDeleteError(null)
                            }
                        }}
                        onConfirm={handleAdminCancel}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════
// Subcomponentes
// ════════════════════════════════════════════════════════════════
function KPI({
    label,
    value,
    accent,
}: {
    label: string
    value: string
    accent: string
}) {
    return (
        <div
            style={{
                padding: "14px 22px",
                borderRadius: 16,
                background: `linear-gradient(165deg, ${accent}15 0%, rgba(8,22,45,0.55) 100%)`,
                border: `1px solid ${accent}38`,
                boxShadow: `0 0 24px ${accent}11`,
                minWidth: 160,
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    letterSpacing: 2.4,
                    textTransform: "uppercase",
                    color: accent,
                    fontWeight: 600,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    marginTop: 4,
                    fontSize: 24,
                    fontWeight: 200,
                    color: "#E8EEF7",
                    letterSpacing: 0.2,
                }}
            >
                {value}
            </div>
        </div>
    )
}

function FilterStrip({
    title,
    value,
    onChange,
    options,
}: {
    title: string
    value: string
    onChange: (v: string) => void
    options: { id: string; label: string; accent: string }[]
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
                style={{
                    fontSize: 10,
                    letterSpacing: 2.4,
                    textTransform: "uppercase",
                    color: "rgba(232,238,247,0.45)",
                    fontWeight: 600,
                }}
            >
                {title}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {options.map((o) => {
                    const active = o.id === value
                    return (
                        <button
                            key={o.id}
                            onClick={() => onChange(o.id)}
                            style={{
                                appearance: "none",
                                background: active
                                    ? `${o.accent}1f`
                                    : "rgba(232,238,247,0.04)",
                                border: `1px solid ${active ? o.accent + "88" : "rgba(232,238,247,0.12)"}`,
                                color: active ? o.accent : "rgba(232,238,247,0.7)",
                                borderRadius: 999,
                                padding: "6px 14px",
                                fontFamily: "Inter, sans-serif",
                                fontSize: 11,
                                letterSpacing: 1.4,
                                fontWeight: active ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: active
                                    ? `0 0 18px ${o.accent}33`
                                    : "none",
                            }}
                        >
                            {o.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function CicloCard({
    ciclo,
    expanded,
    onToggle,
    onAskDelete,
}: {
    ciclo: CicloAgrupado
    expanded: boolean
    onToggle: () => void
    onAskDelete: () => void
}) {
    const pilar = PILARES[ciclo.pilar_id] || {
        label: ciclo.pilar_id,
        accent: "#9AA8C2",
        shadow: "rgba(154,168,194,0.45)",
    }
    const firstSlot = ciclo.slots[0]
    const lastSlot = ciclo.slots[ciclo.slots.length - 1]
    const today = new Date().toISOString().slice(0, 10)
    const isPast = lastSlot && lastSlot.date < today
    const phoneClean = (ciclo.telefono || "").replace(/[^\d+]/g, "")
    const waText = encodeURIComponent(
        `Hola ${ciclo.nombre.split(" ")[0]}, soy de Veo Tu Luz Interna. Te escribo para confirmar tu ${pilar.label} del ${firstSlot ? formatLongDate(firstSlot.date) : ""}.`
    )

    return (
        <motion.div
            layout
            transition={{ layout: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } }}
            style={{
                position: "relative",
                padding: "22px 26px",
                borderRadius: 20,
                background:
                    "linear-gradient(165deg, rgba(12,28,52,0.78) 0%, rgba(8,18,38,0.85) 100%)",
                backdropFilter: "blur(18px) saturate(1.3)",
                WebkitBackdropFilter: "blur(18px) saturate(1.3)",
                border: `1px solid ${pilar.accent}28`,
                boxShadow: `0 4px 30px rgba(0,0,0,0.16), 0 0 36px ${pilar.accent}0E`,
                overflow: "hidden",
            }}
        >
            {/* Halo lateral del pilar */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 3,
                    background: `linear-gradient(180deg, ${pilar.accent} 0%, transparent 100%)`,
                    boxShadow: `0 0 18px ${pilar.shadow}`,
                }}
            />

            {/* Header del ciclo */}
            <div
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    cursor: "pointer",
                    flexWrap: "wrap",
                }}
            >
                {/* Pilar badge */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 14px",
                        background: `${pilar.accent}15`,
                        border: `1px solid ${pilar.accent}40`,
                        borderRadius: 999,
                    }}
                >
                    <span
                        style={{
                            width: 7,
                            height: 7,
                            borderRadius: 999,
                            background: pilar.accent,
                            boxShadow: `0 0 10px ${pilar.shadow}`,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 10.5,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                            color: pilar.accent,
                            fontWeight: 600,
                        }}
                    >
                        {pilar.label}
                    </span>
                </div>

                {/* Sessions count */}
                <span
                    style={{
                        fontSize: 11,
                        letterSpacing: 1.4,
                        color: "rgba(232,238,247,0.55)",
                        fontWeight: 500,
                    }}
                >
                    {ciclo.sessions_count}{" "}
                    {ciclo.sessions_count === 1 ? "sesión" : "sesiones"}
                </span>

                {/* Tutor name */}
                <h3
                    style={{
                        margin: 0,
                        flex: 1,
                        minWidth: 200,
                        fontSize: 18,
                        fontWeight: 400,
                        color: "#E8EEF7",
                        letterSpacing: 0.2,
                    }}
                >
                    {ciclo.nombre}
                </h3>

                {/* First date */}
                {firstSlot ? (
                    <div style={{ textAlign: "right", marginRight: 6 }}>
                        <div
                            style={{
                                fontSize: 10,
                                letterSpacing: 1.8,
                                textTransform: "uppercase",
                                color: "rgba(232,238,247,0.4)",
                                fontWeight: 600,
                            }}
                        >
                            {isPast ? "Última sesión" : "Próxima sesión"}
                        </div>
                        <div
                            style={{
                                fontSize: 13.5,
                                color: pilar.accent,
                                fontWeight: 500,
                                letterSpacing: 0.3,
                                marginTop: 2,
                            }}
                        >
                            {formatLongDate(
                                isPast ? lastSlot.date : firstSlot.date
                            )}{" "}
                            ·{" "}
                            {formatTime(isPast ? lastSlot.time : firstSlot.time)}
                        </div>
                    </div>
                ) : null}

                {/* Botón admin: eliminar el ciclo (libera slots).
                    Convive con el chevron en la misma fila; stopPropagation
                    evita que el click expanda/contraiga el card. */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAskDelete()
                    }}
                    title="Eliminar ciclo y liberar slots"
                    aria-label="Eliminar ciclo"
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        background: "rgba(217,83,79,0.06)",
                        border: "1px solid rgba(217,83,79,0.28)",
                        color: "#FF9189",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        transition: "all 0.22s ease",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "rgba(217,83,79,0.16)"
                        e.currentTarget.style.borderColor =
                            "rgba(217,83,79,0.6)"
                        e.currentTarget.style.color = "#FFD0CB"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "rgba(217,83,79,0.06)"
                        e.currentTarget.style.borderColor =
                            "rgba(217,83,79,0.28)"
                        e.currentTarget.style.color = "#FF9189"
                    }}
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>

                {/* Chevron */}
                <motion.svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        color: "rgba(232,238,247,0.55)",
                        flexShrink: 0,
                    }}
                >
                    <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </motion.svg>
            </div>

            {/* Compact info line */}
            <div
                style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 18,
                    flexWrap: "wrap",
                    alignItems: "center",
                    fontSize: 12,
                    color: "rgba(232,238,247,0.55)",
                }}
            >
                <Stat icon="✉" value={ciclo.email} />
                {ciclo.telefono ? <Stat icon="✆" value={ciclo.telefono} /> : null}
                {ciclo.is_for_child && ciclo.child_name ? (
                    <Stat
                        icon="◈"
                        value={`Para ${ciclo.child_name}${ciclo.child_age ? `, ${ciclo.child_age} años` : ""}`}
                        accent="#C8A44E"
                    />
                ) : null}
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: 13,
                        color: pilar.accent,
                        fontWeight: 500,
                    }}
                >
                    {formatMxn(ciclo.amount_mxn_cents)}
                </span>
            </div>

            {/* Expanded panel */}
            <AnimatePresence initial={false}>
                {expanded ? (
                    <motion.div
                        key="exp"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            style={{
                                marginTop: 20,
                                paddingTop: 18,
                                borderTop: `1px solid ${pilar.accent}22`,
                                display: "grid",
                                gridTemplateColumns: "minmax(220px, 1.4fr) minmax(180px, 1fr)",
                                gap: 28,
                            }}
                        >
                            {/* Lista de fechas */}
                            <div>
                                <p
                                    style={{
                                        margin: "0 0 10px",
                                        fontSize: 10,
                                        letterSpacing: 2.4,
                                        textTransform: "uppercase",
                                        color: "rgba(232,238,247,0.45)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Fechas del ciclo
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 7,
                                    }}
                                >
                                    {ciclo.slots.map((s, i) => (
                                        <div
                                            key={s.reserva_id}
                                            style={{
                                                display: "flex",
                                                gap: 12,
                                                alignItems: "center",
                                                padding: "8px 14px",
                                                background:
                                                    "rgba(232,238,247,0.03)",
                                                border: "1px solid rgba(232,238,247,0.08)",
                                                borderRadius: 10,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: pilar.accent,
                                                    fontWeight: 700,
                                                    letterSpacing: 1.4,
                                                    minWidth: 22,
                                                }}
                                            >
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "rgba(232,238,247,0.85)",
                                                    flex: 1,
                                                }}
                                            >
                                                {formatLongDate(s.date)}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: pilar.accent,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {formatTime(s.time)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contactos + Stripe */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 4px",
                                        fontSize: 10,
                                        letterSpacing: 2.4,
                                        textTransform: "uppercase",
                                        color: "rgba(232,238,247,0.45)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Contacto
                                </p>
                                {phoneClean ? (
                                    <a
                                        href={`https://wa.me/${phoneClean.replace(/[^\d]/g, "")}?text=${waText}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "block",
                                            padding: "10px 14px",
                                            background:
                                                "linear-gradient(135deg, rgba(37,211,102,0.18) 0%, rgba(37,211,102,0.06) 100%)",
                                            border: "1px solid rgba(37,211,102,0.45)",
                                            borderRadius: 12,
                                            color: "#7DD89A",
                                            textDecoration: "none",
                                            fontSize: 12,
                                            fontWeight: 500,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        ✆ Abrir WhatsApp
                                    </a>
                                ) : null}
                                <a
                                    href={`mailto:${ciclo.email}`}
                                    style={{
                                        display: "block",
                                        padding: "10px 14px",
                                        background:
                                            "rgba(124,196,255,0.06)",
                                        border: "1px solid rgba(124,196,255,0.28)",
                                        borderRadius: 12,
                                        color: "#7CC4FF",
                                        textDecoration: "none",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        letterSpacing: 0.3,
                                        wordBreak: "break-all",
                                    }}
                                >
                                    ✉ {ciclo.email}
                                </a>

                                <p
                                    style={{
                                        margin: "8px 0 0",
                                        fontSize: 10,
                                        letterSpacing: 2.4,
                                        textTransform: "uppercase",
                                        color: "rgba(232,238,247,0.45)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Pago
                                </p>
                                <div
                                    style={{
                                        padding: "10px 14px",
                                        background: "rgba(200,164,78,0.06)",
                                        border: "1px solid rgba(200,164,78,0.22)",
                                        borderRadius: 12,
                                        fontSize: 12,
                                        color: "rgba(232,238,247,0.7)",
                                        fontFamily: "monospace",
                                        letterSpacing: 0.4,
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {ciclo.stripe_session_id
                                        ? `cs · …${ciclo.stripe_session_id.slice(-14)}`
                                        : "—"}
                                </div>
                                {ciclo.confirmed_at ? (
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            color: "rgba(232,238,247,0.4)",
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        Confirmado:{" "}
                                        {new Date(
                                            ciclo.confirmed_at
                                        ).toLocaleString("es-MX", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    )
}

function Stat({
    icon,
    value,
    accent,
}: {
    icon: string
    value: string
    accent?: string
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: accent || "rgba(232,238,247,0.55)",
            }}
        >
            <span style={{ fontSize: 12, opacity: 0.7 }}>{icon}</span>
            <span style={{ wordBreak: "break-all" }}>{value}</span>
        </span>
    )
}

function AdminDeleteModal({
    ciclo,
    deleting,
    error,
    onClose,
    onConfirm,
}: {
    ciclo: CicloAgrupado
    deleting: boolean
    error: string | null
    onClose: () => void
    onConfirm: () => void
}) {
    const pilar = PILARES[ciclo.pilar_id] || {
        label: ciclo.pilar_id,
        accent: "#9AA8C2",
        shadow: "rgba(154,168,194,0.4)",
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(2,5,12,0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                zIndex: 2147483647,
                display: "grid",
                placeItems: "center",
                padding: 20,
                fontFamily: "Inter, sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 480,
                    padding: "32px 28px",
                    borderRadius: 22,
                    background:
                        "linear-gradient(165deg, rgba(20,32,52,0.95) 0%, rgba(10,18,32,0.98) 100%)",
                    border: "1px solid rgba(217,83,79,0.42)",
                    boxShadow:
                        "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 60px rgba(217,83,79,0.18)",
                    color: "#E8EEF7",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: 56,
                        height: 56,
                        margin: "0 auto 18px",
                        borderRadius: 999,
                        background: "rgba(217,83,79,0.14)",
                        border: "1.5px solid rgba(217,83,79,0.55)",
                        display: "grid",
                        placeItems: "center",
                        boxShadow: "0 0 36px rgba(217,83,79,0.32)",
                    }}
                >
                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FF9189"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                    </svg>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 10.5,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: "#FF9189",
                        fontWeight: 600,
                    }}
                >
                    Eliminar ciclo
                </p>
                <h3
                    style={{
                        margin: "10px 0 6px",
                        fontWeight: 300,
                        fontSize: 22,
                        color: "#E8EEF7",
                        letterSpacing: 0.3,
                    }}
                >
                    ¿Liberar este horario?
                </h3>
                <div
                    style={{
                        margin: "18px auto 0",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: `${pilar.accent}10`,
                        border: `1px solid ${pilar.accent}33`,
                        textAlign: "left",
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: "rgba(232,238,247,0.85)",
                    }}
                >
                    <strong style={{ color: pilar.accent }}>
                        {pilar.label}
                    </strong>{" "}
                    ·{" "}
                    {ciclo.sessions_count === 1
                        ? "1 sesión"
                        : `${ciclo.sessions_count} sesiones`}
                    <br />
                    Tutor: <strong>{ciclo.nombre}</strong>
                    <br />
                    {ciclo.is_for_child && ciclo.child_name ? (
                        <>
                            Para: {ciclo.child_name}
                            {ciclo.child_age ? `, ${ciclo.child_age} años` : ""}
                            <br />
                        </>
                    ) : null}
                    {ciclo.slots.length} {ciclo.slots.length === 1 ? "espacio" : "espacios"} se liberarán del calendario.
                </div>
                {error ? (
                    <div
                        style={{
                            marginTop: 16,
                            padding: "10px 14px",
                            background: "rgba(217,83,79,0.10)",
                            border: "1px solid rgba(217,83,79,0.45)",
                            borderRadius: 10,
                            fontSize: 12.5,
                            color: "#FFB4B4",
                            textAlign: "left",
                        }}
                    >
                        {error}
                    </div>
                ) : null}
                <div
                    style={{
                        marginTop: 26,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        style={{
                            flex: "1 1 140px",
                            padding: "13px 18px",
                            background: "transparent",
                            color: "rgba(232,238,247,0.7)",
                            border: "1px solid rgba(232,238,247,0.22)",
                            borderRadius: 999,
                            fontSize: 11.5,
                            letterSpacing: 2.2,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                            cursor: deleting ? "wait" : "pointer",
                            opacity: deleting ? 0.5 : 1,
                        }}
                    >
                        Volver
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        style={{
                            flex: "1 1 140px",
                            padding: "13px 18px",
                            background: deleting
                                ? "rgba(217,83,79,0.6)"
                                : "linear-gradient(135deg, #D9534F 0%, #B23B37 100%)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 999,
                            fontSize: 11.5,
                            letterSpacing: 2.2,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                            cursor: deleting ? "wait" : "pointer",
                            boxShadow: "0 12px 32px -12px rgba(217,83,79,0.7)",
                        }}
                    >
                        {deleting ? "Liberando…" : "Sí, eliminar"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ════════════════════════════════════════════════════════════════
// Wrapper + default export
// ════════════════════════════════════════════════════════════════
function ObservatorioResonanciaPresenciales(props: {
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkId?: string | null
}) {
    return (
        <ObservatorioResonanciaPresencialesInner
            supabaseUrl={props.supabaseUrl || ""}
            supabaseAnonKey={props.supabaseAnonKey || ""}
            clerkId={props.clerkId || null}
        />
    )
}

export default ObservatorioResonanciaPresenciales
