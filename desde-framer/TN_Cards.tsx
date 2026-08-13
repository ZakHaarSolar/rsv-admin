// TN_Cards.tsx v1.5 — LA TECLA E EDITA LA FILA BAJO EL PUNTERO (Zak 2026-08-10): con el panel abierto, posar el puntero sobre un gasto y picar E abre su edición. La fila se tiñe apenas y muestra una pastilla "E" mientras el puntero está encima, porque un atajo que no se anuncia no existe. El atajo se calla si el foco está escribiendo (campo, área de texto, lista o bloque editable) o si la tecla viaja con Command, Control o Alt, y nunca se arma sobre la fila automática de IA, que no se edita. | v1.4 — GASTOS OPERACIONALES ABRE EN LO QUE ZAK USA (2026-08-10): los tres interruptores arrancan en la vista que él deja puesta y esa opción pasa a ser la PRIMERA de su fila — Este Mes (antes Promedio), Todos (sin cambio) y Por Día (antes Mayor $). Los índices de viewMode y sortMode se reordenaron junto con las etiquetas, así que el filtro de cronograma y el resaltado del próximo pago siguen colgando de "Por Día". Además: el lápiz y la equis de cada fila nacen del mismo ámbar, se encienden al pasar el puntero y laten al presionarse; y tocar el lápiz VIAJA hasta el formulario con un destello de anillo, que antes quedaba fuera de cuadro al editar una fila de arriba. | v1.3 — GASTO VIVO DE IA en Gastos Operacionales: fila automática "⚡ IA · uso real de la app" (USD 30d del libro mayor × 18, vía prop iaUsd30 desde Telemetría) que se suma a totales y listado pero no se edita/borra ni entra al cronograma de próximos pagos. | v1.2
// v1.2 (2026-06-07) — RPC de gastos (upsert/delete_expense) vía gateway admin-action (token verificado).
// v1.1 — Panel expandido de Gastos Operacionales gana un toggle de
// frecuencia (Todos / Mensuales / Anuales, default Todos) junto al
// toggle de orden existente. En modo "Por Día" la lista filtra los
// gastos anuales que NO sean del mes actual, así el panel se
// comporta como cronograma de pagos para este mes. Decisión Zak
// 2026-05-08.
// v1.0 — Cards expandibles del split de TelemetriaDelNucleo (sello TN_).
// Default export = ghost component con Object.assign de todos los exports
// (patrón canónico utility-only para Framer Code Files).
//
// Consumidor: TN_Dashboard. Patrón de import:
//   import Cards from "./TN_Cards.tsx"
//   const { DetailPanel, ExpCard } = Cards

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Shared from "./TN_Shared.tsx"
import UI from "./TN_UI.tsx"

const {
    GOLD,
    GL,
    CYAN,
    GREEN,
    AMBER,
    AMBER_C,
    fmt,
    slideUp,
    sbRpc,
    adminAction,
    CATS,
    FREQ_L,
    MONTHS,
} = Shared

const { MultiToggle, ExpandArrowBtn } = UI

/* ═══ DetailPanel — lista de suscriptores filtrable (Inmersión / Sintonía) ═══ */
function DetailPanel({
    subscribers,
    filter,
    onClose,
}: {
    subscribers: any[]
    filter: "inmersion" | "sintonia"
    onClose: () => void
}) {
    const [grpFilter, setGrpFilter] = useState("all")
    let filtered =
        filter === "inmersion"
            ? subscribers.filter(
                  (s: any) => s.grp === "pulsar" || s.grp === "cuasar"
              )
            : subscribers.filter((s: any) => s.grp === "sintonia")
    if (grpFilter !== "all")
        filtered = filtered.filter((s: any) => s.grp === grpFilter)
    const renewing = filtered.filter((s: any) => !s.cancel),
        canceling = filtered.filter((s: any) => s.cancel)
    const title = filter === "inmersion" ? "Inmersión Solar" : "Sintonía Solar",
        color = filter === "inmersion" ? GOLD : CYAN
    const fd = (d: string) => {
        try {
            return new Date(d).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "2-digit",
            })
        } catch {
            return "—"
        }
    }
    return (
        <div className="adm-detail-panel">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        rowGap: 10,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: `${color}99`,
                        }}
                    >
                        {title}
                    </p>
                    <span
                        style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.15)",
                        }}
                    >
                        {filtered.length} nodos
                    </span>
                    {filter === "inmersion" && (
                        <MultiToggle
                            options={["Todos", "Púlsar", "Cuásar"]}
                            value={
                                grpFilter === "all"
                                    ? 0
                                    : grpFilter === "pulsar"
                                      ? 1
                                      : 2
                            }
                            onChange={(v) =>
                                setGrpFilter(["all", "pulsar", "cuasar"][v])
                            }
                            color={GOLD}
                        />
                    )}
                </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div
                    style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(76,175,80,0.05)",
                        border: "1px solid rgba(76,175,80,0.14)",
                    }}
                >
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(76,175,80,0.5)",
                        }}
                    >
                        Renovando
                    </span>
                    <p
                        style={{
                            margin: 0,
                            marginTop: 4,
                            fontSize: 22,
                            fontWeight: 200,
                            color: GREEN,
                        }}
                    >
                        {renewing.length}
                    </p>
                </div>
                <div
                    style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(255,100,100,0.04)",
                        border: "1px solid rgba(255,100,100,0.12)",
                    }}
                >
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,100,100,0.5)",
                        }}
                    >
                        No Renuevan
                    </span>
                    <p
                        style={{
                            margin: 0,
                            marginTop: 4,
                            fontSize: 22,
                            fontWeight: 200,
                            color: "rgba(255,100,100,0.7)",
                        }}
                    >
                        {canceling.length}
                    </p>
                </div>
            </div>
            <div
                className="adm-grid-2"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                }}
            >
                {filtered.map((s: any, i: number) => (
                    <div
                        key={i}
                        className="adm-row"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: s.cancel
                                    ? "rgba(255,100,100,0.6)"
                                    : GREEN,
                                boxShadow: s.cancel
                                    ? "none"
                                    : `0 0 8px ${GREEN}`,
                            }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    fontWeight: 400,
                                    color: "rgba(255,255,255,0.7)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {s.name}
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.2)",
                                    marginTop: 2,
                                }}
                            >
                                {s.email}
                            </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 10,
                                    fontWeight: 500,
                                    color:
                                        s.grp === "pulsar"
                                            ? `${GOLD}88`
                                            : s.grp === "cuasar"
                                              ? `${GL}88`
                                              : `${CYAN}88`,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {s.grp === "pulsar"
                                    ? "Púlsar"
                                    : s.grp === "cuasar"
                                      ? "Cuásar"
                                      : "Sintonía"}
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 9,
                                    color: "rgba(255,255,255,0.15)",
                                    marginTop: 2,
                                }}
                            >
                                {s.months} {s.months === 1 ? "mes" : "meses"} ·{" "}
                                {fd(s.p_start)} → {fd(s.p_end)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && (
                <p
                    style={{
                        textAlign: "center",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.12)",
                        marginTop: 20,
                    }}
                >
                    Sin nodos activos
                </p>
            )}
        </div>
    )
}

/* ═══ ExpCard — gastos operacionales (CRUD inline) ═══ */
function ExpCard({
    expenses,
    sbUrl,
    sbKey,
    clerkId,
    onMutate,
    currentMonth,
    onExpandedChange,
    iaUsd30 = 0,
}: {
    expenses: any[]
    sbUrl: string
    sbKey: string
    clerkId: string
    onMutate: () => void
    currentMonth: number
    onExpandedChange?: (v: boolean) => void
    iaUsd30?: number
}) {
    const [editing, setEditing] = useState<any | null>(null)
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState("")
    const [amount, setAmount] = useState("")
    const [freq, setFreq] = useState("monthly")
    const [cat, setCat] = useState("herramientas")
    const [notes, setNotes] = useState("")
    const [bDayStr, setBDayStr] = useState("1")
    const [bMonth, setBMonth] = useState(1)
    /* 🜂 v1.4 — LOS TRES INTERRUPTORES ARRANCAN EN LO QUE ZAK USA (2026-08-10).
       Las tres vistas que él deja puestas ahora son la posición 0 de su fila y
       el estado inicial al abrir la página: la opción viva queda SIEMPRE a la
       izquierda y no hay que tocar nada al entrar.
         · viewMode  0=Este Mes (default) · 1=Promedio
         · freqFilter 0=Todos (default)   · 1=Mensuales · 2=Anuales
         · sortMode  0=Por Día (default)  · 1=Mayor $   · 2=Menor $ */
    const [viewMode, setViewMode] = useState(0)
    const [expExpanded, setExpExpanded] = useState(false)
    const [sortMode, setSortMode] = useState(0)
    /* freqFilter junto con sortMode determina qué subset de la lista se
       renderea en el panel expandido. En modo "Por Día" (sortMode === 0) los
       gastos anuales que NO sean del mes actual se ocultan, así el panel
       funciona como cronograma de pagos del mes. */
    const [freqFilter, setFreqFilter] = useState(0)
    const panelRef = React.useRef<HTMLDivElement>(null)
    /* v1.4 — el formulario de alta/edición se ancla para poder viajar hasta él
       cuando se toca el lápiz de una fila (ver `editing` más abajo). */
    const formRef = React.useRef<HTMLDivElement>(null)
    /* v1.4 — qué fila tiene el puntero encima, para que la tecla E sepa a cuál
       le habla. Solo se arma con el panel abierto y nunca sobre la fila
       automática de IA, que no se edita. */
    const [hoverId, setHoverId] = useState<string | null>(null)
    useEffect(() => {
        onExpandedChange?.(expExpanded)
    }, [expExpanded, onExpandedChange])
    useEffect(() => {
        if (!expExpanded) return
        const h = (e: MouseEvent | TouchEvent) => {
            const ref = panelRef.current
            if (!ref) return
            const t = e.target as Node | null
            if (t && !ref.contains(t)) setExpExpanded(false)
        }
        const id = window.setTimeout(() => {
            document.addEventListener("mousedown", h)
            document.addEventListener("touchstart", h, { passive: true })
        }, 0)
        return () => {
            window.clearTimeout(id)
            document.removeEventListener("mousedown", h)
            document.removeEventListener("touchstart", h)
        }
    }, [expExpanded])
    /* v1.3 — GASTO VIVO DE IA (Zak): el uso real de los últimos 30 días
       (Telemetría → Gasto de IA por nodo) entra como fila AUTOMÁTICA: se suma
       a los totales y al listado, pero no se edita ni se borra — no vive en
       la tabla de gastos, vive en el libro mayor del gobernador. */
    const gastosVivos =
        iaUsd30 > 0
            ? [
                  {
                      id: "__ia_auto__",
                      title: "⚡ IA · uso real de la app",
                      amount: Math.round(iaUsd30 * 18),
                      frequency: "monthly",
                      category: "herramientas",
                      billing_day: 1,
                      notes: "automático · últimos 30 días del libro mayor",
                      auto: true,
                  },
                  ...expenses,
              ]
            : expenses
    const monthlyExps = gastosVivos.filter(
            (e: any) => e.frequency === "monthly"
        ),
        annualExps = gastosVivos.filter((e: any) => e.frequency === "annual")
    const thisMonthTotal =
        monthlyExps.reduce((s: number, e: any) => s + (+e.amount || 0), 0) +
        annualExps
            .filter((e: any) => (e.billing_month || 1) === currentMonth)
            .reduce((s: number, e: any) => s + (+e.amount || 0), 0)
    const avgMonthly =
        monthlyExps.reduce((s: number, e: any) => s + (+e.amount || 0), 0) +
        annualExps.reduce((s: number, e: any) => s + (+e.amount || 0) / 12, 0)
    const displayTotal = viewMode === 0 ? thisMonthTotal : avgMonthly
    /* v11.1 — Pipeline de visibilidad para el panel expandido:
       1. freqFilter aplica primero: Todos / Mensuales / Anuales.
       2. Si sortMode === 0 (Por Día), además se ocultan los anuales
          que NO sean del mes actual — el panel se vuelve un
          cronograma de pagos para este mes.
       3. Sort según sortMode: Por Día / Mayor $ / Menor $. */
    const sortedFiltered = (() => {
        let base = [...gastosVivos]
        if (freqFilter === 1) {
            base = base.filter((e: any) => e.frequency === "monthly")
        } else if (freqFilter === 2) {
            base = base.filter((e: any) => e.frequency === "annual")
        }
        if (sortMode === 0) {
            base = base.filter(
                (e: any) =>
                    e.frequency === "monthly" ||
                    (e.frequency === "annual" &&
                        (e.billing_month || 1) === currentMonth)
            )
        }
        return base.sort((a: any, b: any) => {
            if (sortMode === 1) return (+b.amount || 0) - (+a.amount || 0)
            if (sortMode === 2) return (+a.amount || 0) - (+b.amount || 0)
            return (a.billing_day || 1) - (b.billing_day || 1)
        })
    })()
    const sorted = sortedFiltered
    const today = new Date().getDate()
    const upcoming = [...gastosVivos].filter((e: any) => !e.auto)
        .filter(
            (e: any) =>
                e.frequency === "monthly" ||
                (e.frequency === "annual" &&
                    (e.billing_month || 1) === currentMonth)
        )
        .sort((a: any, b: any) => {
            const da = ((a.billing_day || 1) - today + 31) % 31,
                db = ((b.billing_day || 1) - today + 31) % 31
            return da - db
        })
        .slice(0, 3)
    const openNew = () => {
        setTitle("")
        setAmount("")
        setFreq("monthly")
        setCat("herramientas")
        setNotes("")
        setBDayStr("1")
        setBMonth(1)
        setEditing({})
    }
    /* 🜂 v1.4 — AL ABRIR EL FORMULARIO, LA VISTA VIAJA HASTA ÉL (Zak): tocar el
       lápiz de una fila que quedó arriba dejaba el formulario fuera de cuadro
       y parecía que el botón no había hecho nada. `center` lo deja a media
       pantalla en vez de pegado al borde. El pequeño retraso espera a que el
       formulario exista en pantalla; sin él no hay a dónde viajar. */
    useEffect(() => {
        if (!editing) return
        const id = window.setTimeout(() => {
            formRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
        }, 60)
        return () => window.clearTimeout(id)
    }, [editing])
    const openEdit = (e: any) => {
        setTitle(e.title)
        setAmount(String(e.amount))
        setFreq(e.frequency)
        setCat(e.category)
        setNotes(e.notes || "")
        setBDayStr(String(e.billing_day || 1))
        setBMonth(e.billing_month || 1)
        setEditing(e)
    }
    /* 🜂 v1.4 — LA TECLA E ABRE LA FILA QUE TIENE EL PUNTERO ENCIMA (Zak).
       Guardas, en este orden:
         · el panel tiene que estar abierto (con él cerrado no hay filas
           editables en pantalla);
         · la tecla viaja sola: con Command, Control o Alt encima es un atajo
           del navegador o del sistema, no nuestro;
         · si el foco está escribiendo (campo, área de texto, lista o bloque
           editable) la tecla es una letra más y el atajo se calla — si no, la
           "e" de "Netflix" abriría otra fila mientras se teclea;
         · la fila tiene que seguir existiendo y no ser la automática de IA. */
    useEffect(() => {
        if (!expExpanded) return
        const h = (ev: KeyboardEvent) => {
            if (ev.key !== "e" && ev.key !== "E") return
            if (ev.metaKey || ev.ctrlKey || ev.altKey) return
            const t = ev.target as HTMLElement | null
            const tag = (t?.tagName || "").toLowerCase()
            if (
                tag === "input" ||
                tag === "textarea" ||
                tag === "select" ||
                t?.isContentEditable
            )
                return
            if (!hoverId) return
            const fila = gastosVivos.find(
                (x: any) => x.id === hoverId && !x.auto
            )
            if (!fila) return
            ev.preventDefault()
            openEdit(fila)
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [expExpanded, hoverId, gastosVivos])
    const save = async () => {
        setSaving(true)
        await adminAction(sbUrl, sbKey, "admin_upsert_expense", {
            p_id: editing?.id || null,
            p_title: title,
            p_amount: parseFloat(amount) || 0,
            p_frequency: freq,
            p_category: cat,
            p_notes: notes,
            p_billing_day: parseInt(bDayStr) || 1,
            p_billing_month: bMonth,
        })
        setSaving(false)
        setEditing(null)
        onMutate()
    }
    const del = async (id: string) => {
        await adminAction(sbUrl, sbKey, "admin_delete_expense", {
            p_id: id,
        })
        onMutate()
    }
    const inp: React.CSSProperties = {
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        color: "#fff",
        fontSize: 13,
        fontFamily: "'Inter',sans-serif",
        outline: "none",
    }
    const lbl: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.2)",
        marginBottom: 4,
    }
    /* 🜂 v1.4 — LOS DOS GESTOS DE FILA SE ENCIENDEN IGUAL (Zak 2026-08-10).
       El lápiz vivía en gris y la equis en ámbar, así que solo una de las dos
       parecía viva. Ahora nacen del mismo ámbar tenue, se encienden al pasar
       el puntero y dan un latido al presionarlas. */
    const miniBtn: React.CSSProperties = {
        width: 24,
        height: 24,
        borderRadius: 6,
        background: "transparent",
        fontSize: 11,
        lineHeight: 1,
        cursor: "pointer",
        outline: "none",
        transition:
            "border-color 0.18s, color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.12s",
    }
    const miniBtnIdle: React.CSSProperties = {
        border: "1px solid rgba(212,148,58,0.12)",
        color: "rgba(212,148,58,0.4)",
    }
    const miniOn = (ev: any) => {
        const s = ev.currentTarget.style
        s.borderColor = "rgba(212,148,58,0.55)"
        s.color = AMBER
        s.background = "rgba(212,148,58,0.10)"
        s.boxShadow = "0 0 10px rgba(212,148,58,0.25)"
        s.transform = "scale(1)"
    }
    const miniOff = (ev: any) => {
        const s = ev.currentTarget.style
        s.borderColor = "rgba(212,148,58,0.12)"
        s.color = "rgba(212,148,58,0.4)"
        s.background = "transparent"
        s.boxShadow = "none"
        s.transform = "scale(1)"
    }
    const miniPress = (ev: any) => {
        const s = ev.currentTarget.style
        s.transform = "scale(0.88)"
        s.boxShadow = "0 0 14px rgba(212,148,58,0.45)"
    }
    const nextExpId = (() => {
        const monthly = gastosVivos
            .filter((e: any) => e.frequency === "monthly" && !e.auto)
            .sort((a: any, b: any) => {
                const da = ((a.billing_day || 1) - today + 31) % 31
                const db = ((b.billing_day || 1) - today + 31) % 31
                return da - db
            })
        return monthly.length > 0 ? monthly[0].id : null
    })()
    const renderRow = (e: any, highlight?: boolean) => {
        const isAnn =
            e.frequency === "annual" && (e.billing_month || 1) === currentMonth
        const isNext = highlight && e.id === nextExpId
        /* 🜂 v1.4 — la fila bajo el puntero es la que escucha la tecla E. */
        const armada = expExpanded && !e.auto
        const enfocada = armada && hoverId === e.id
        return (
            <div
                key={e.id}
                className="adm-row"
                onMouseEnter={armada ? () => setHoverId(e.id) : undefined}
                onMouseLeave={
                    armada
                        ? () => setHoverId((h) => (h === e.id ? null : h))
                        : undefined
                }
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: isNext
                        ? `1px solid ${AMBER}33`
                        : enfocada
                          ? `1px solid ${AMBER}2b`
                          : "1px solid transparent",
                    background: isNext
                        ? "rgba(212,148,58,0.06)"
                        : enfocada
                          ? "rgba(212,148,58,0.035)"
                          : "transparent",
                    transition: "background 0.15s, border-color 0.15s",
                }}
            >
                {isNext && (
                    <div
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: AMBER,
                            boxShadow: `0 0 8px ${AMBER}`,
                            animation: "adm-live-dot 2s ease-in-out infinite",
                        }}
                    />
                )}
                {!isNext && (
                    <div
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                                e.frequency === "annual"
                                    ? isAnn
                                        ? AMBER
                                        : "rgba(212,148,58,0.25)"
                                    : AMBER_C,
                        }}
                    />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: isNext ? 500 : 400,
                            color: isNext ? "#fff" : "rgba(255,255,255,0.6)",
                        }}
                    >
                        {e.title}
                    </p>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 9,
                            color: isNext
                                ? "rgba(212,148,58,0.5)"
                                : "rgba(255,255,255,0.15)",
                            marginTop: 2,
                        }}
                    >
                        {CATS[e.category] || e.category} · Día{" "}
                        {e.billing_day || 1}
                        {e.frequency === "annual"
                            ? ` · ${MONTHS[e.billing_month || 1]}`
                            : ""}
                        {e.notes ? ` · ${e.notes}` : ""}
                    </p>
                </div>
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: isNext ? AMBER : AMBER_C,
                        flexShrink: 0,
                    }}
                >
                    ${fmt(+e.amount)}{" "}
                    <span
                        style={{ fontSize: 9, color: "rgba(212,148,58,0.35)" }}
                    >
                        {FREQ_L[e.frequency] || ""}
                    </span>
                </span>
                {expExpanded && !e.auto && (
                    <div
                        style={{
                            display: "flex",
                            gap: 4,
                            flexShrink: 0,
                            alignItems: "center",
                        }}
                    >
                        {/* 🜂 v1.4 — el atajo se ANUNCIA solo. Un atajo que no
                            se ve no existe: la tecla aparece al posar el
                            puntero sobre la fila y desaparece al salir. */}
                        <span
                            aria-hidden="true"
                            style={{
                                fontSize: 8.5,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                lineHeight: 1,
                                padding: "3px 5px",
                                marginRight: 2,
                                borderRadius: 4,
                                border: `1px solid ${AMBER}33`,
                                color: "rgba(212,148,58,0.55)",
                                background: "rgba(212,148,58,0.06)",
                                opacity: enfocada ? 1 : 0,
                                transition: "opacity 0.15s",
                                pointerEvents: "none",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            E
                        </span>
                        <button
                            onClick={() => openEdit(e)}
                            style={{ ...miniBtn, ...miniBtnIdle }}
                            onMouseEnter={miniOn}
                            onMouseLeave={miniOff}
                            onMouseDown={miniPress}
                            onMouseUp={miniOn}
                            title="Editar este gasto"
                        >
                            ✎
                        </button>
                        <button
                            onClick={() => del(e.id)}
                            style={{ ...miniBtn, ...miniBtnIdle }}
                            onMouseEnter={miniOn}
                            onMouseLeave={miniOff}
                            onMouseDown={miniPress}
                            onMouseUp={miniOn}
                            title="Borrar este gasto"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        )
    }
    return (
        <motion.div
            ref={panelRef}
            variants={slideUp}
            className="adm-glass adm-expenses-panel"
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: expExpanded ? 10 : 16,
                    gap: 10,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: AMBER,
                    }}
                >
                    ⬡ Gastos Operacionales
                </span>
                <ExpandArrowBtn
                    expanded={expExpanded}
                    onClick={() => setExpExpanded(!expExpanded)}
                    color={AMBER}
                />
            </div>
            {expExpanded && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 16,
                    }}
                >
                    <MultiToggle
                        options={["Este Mes", "Promedio"]}
                        value={viewMode}
                        onChange={setViewMode}
                        color={AMBER}
                    />
                </div>
            )}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span
                    style={{
                        fontSize: 28,
                        fontWeight: 200,
                        color: AMBER,
                        letterSpacing: "0.02em",
                    }}
                >
                    ${fmt(Math.round(displayTotal))}
                </span>
                <span
                    style={{
                        fontSize: 11,
                        color: "rgba(212,148,58,0.4)",
                        marginLeft: 8,
                    }}
                >
                    {viewMode === 0 ? "este mes" : "/ mes avg"}
                </span>
            </div>
            {!expExpanded && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        alignItems: "center",
                    }}
                >
                    <div style={{ width: "100%" }}>
                        {upcoming.map((e, i) => renderRow(e, i === 0))}
                    </div>
                    {gastosVivos.length > 3 && (
                        <p
                            style={{
                                fontSize: 10,
                                color: "rgba(212,148,58,0.35)",
                                marginTop: 8,
                                cursor: "pointer",
                            }}
                            onClick={() => setExpExpanded(true)}
                        >
                            {gastosVivos.length - 3} gastos más...
                        </p>
                    )}
                    <button
                        onClick={openNew}
                        style={{
                            fontSize: 9,
                            padding: "6px 20px",
                            borderRadius: 6,
                            background: "rgba(212,148,58,0.06)",
                            border: `1px solid ${AMBER}22`,
                            color: "rgba(212,148,58,0.5)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            outline: "none",
                            fontFamily: "'Inter',sans-serif",
                            marginTop: 12,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e: any) => {
                            e.currentTarget.style.borderColor = AMBER + "44"
                            e.currentTarget.style.color = AMBER
                        }}
                        onMouseLeave={(e: any) => {
                            e.currentTarget.style.borderColor = AMBER + "22"
                            e.currentTarget.style.color = "rgba(212,148,58,0.5)"
                        }}
                    >
                        + Agregar Gasto
                    </button>
                </div>
            )}
            {expExpanded && (
                <>
                    {/* v11.1 — Toggles del panel expandido. Frecuencia
                        a la izquierda (Todos / Mensuales / Anuales,
                        default Todos) y Orden a la derecha (Por Día
                        / Mayor $ / Menor $, default Por Día). En modo
                        "Por Día" la lista filtra anuales fuera del
                        mes actual. */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <MultiToggle
                            options={["Todos", "Mensuales", "Anuales"]}
                            value={freqFilter}
                            onChange={setFreqFilter}
                            color={AMBER}
                        />
                        <MultiToggle
                            options={["Por Día", "Mayor $", "Menor $"]}
                            value={sortMode}
                            onChange={setSortMode}
                            color={AMBER}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            marginBottom: editing ? 16 : 0,
                        }}
                    >
                        {sorted.map((e) => renderRow(e, sortMode === 0))}
                        {expenses.length === 0 && !editing && (
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.1)",
                                    padding: "12px 0",
                                }}
                            >
                                Sin gastos registrados
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <button
                            onClick={openNew}
                            style={{
                                fontSize: 9,
                                padding: "6px 20px",
                                borderRadius: 6,
                                background: "rgba(212,148,58,0.06)",
                                border: `1px solid ${AMBER}22`,
                                color: "rgba(212,148,58,0.5)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                outline: "none",
                                fontFamily: "'Inter',sans-serif",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e: any) => {
                                e.currentTarget.style.borderColor = AMBER + "44"
                                e.currentTarget.style.color = AMBER
                            }}
                            onMouseLeave={(e: any) => {
                                e.currentTarget.style.borderColor = AMBER + "22"
                                e.currentTarget.style.color =
                                    "rgba(212,148,58,0.5)"
                            }}
                        >
                            + Agregar Gasto
                        </button>
                    </div>
                </>
            )}
            {editing && (
                <motion.div
                    ref={formRef}
                    /* La llave re-dispara la entrada al saltar de una fila a
                       otra: sin ella el formulario ya montado no acusa recibo
                       y el toque del lápiz se siente perdido. */
                    key={editing?.id || "__nuevo__"}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                        opacity: 1,
                        height: "auto",
                        boxShadow: [
                            "0 0 0 0 rgba(212,148,58,0)",
                            "0 0 0 2px rgba(212,148,58,0.38)",
                            "0 0 0 0 rgba(212,148,58,0)",
                        ],
                    }}
                    transition={{
                        boxShadow: { duration: 1.2, times: [0, 0.35, 1] },
                    }}
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        marginTop: 12,
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 100px 100px",
                            gap: 12,
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <p style={lbl}>Título</p>
                            <input
                                style={inp}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Supabase Pro"
                            />
                        </div>
                        <div>
                            <p style={lbl}>Monto MXN</p>
                            <input
                                style={inp}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <p style={lbl}>Frecuencia</p>
                            <select
                                style={{ ...inp, cursor: "pointer" }}
                                value={freq}
                                onChange={(e) => setFreq(e.target.value)}
                            >
                                <option value="monthly">Mensual</option>
                                <option value="annual">Anual</option>
                                <option value="one_time">Único</option>
                            </select>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 80px 80px",
                            gap: 12,
                            marginBottom: 14,
                        }}
                    >
                        <div>
                            <p style={lbl}>Categoría</p>
                            <select
                                style={{ ...inp, cursor: "pointer" }}
                                value={cat}
                                onChange={(e) => setCat(e.target.value)}
                            >
                                {Object.entries(CATS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p style={lbl}>Notas</p>
                            <input
                                style={inp}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <p style={lbl}>Día</p>
                            <input
                                style={inp}
                                value={bDayStr}
                                onChange={(e) => setBDayStr(e.target.value)}
                                placeholder="1"
                            />
                        </div>
                        {freq === "annual" && (
                            <div>
                                <p style={lbl}>Mes</p>
                                <select
                                    style={{ ...inp, cursor: "pointer" }}
                                    value={bMonth}
                                    onChange={(e) =>
                                        setBMonth(parseInt(e.target.value))
                                    }
                                >
                                    {MONTHS.slice(1).map((m, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            onClick={() => setEditing(null)}
                            style={{
                                padding: "7px 16px",
                                borderRadius: 7,
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.25)",
                                fontSize: 11,
                                cursor: "pointer",
                                outline: "none",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            disabled={saving || !title}
                            style={{
                                padding: "7px 16px",
                                borderRadius: 7,
                                border: "none",
                                background: saving
                                    ? "rgba(0,194,255,0.1)"
                                    : "rgba(0,194,255,0.15)",
                                color: saving ? "rgba(0,194,255,0.3)" : CYAN,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: saving ? "wait" : "pointer",
                                outline: "none",
                                fontFamily: "'Inter',sans-serif",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            {saving ? "..." : editing.id ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

/* ═══ DEFAULT EXPORT — patrón canónico utility-only para Framer ═══ */
function TN_CardsShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
TN_CardsShell.displayName = "TN_Cards"

const Cards = Object.assign(TN_CardsShell, {
    DetailPanel,
    ExpCard,
})

export default Cards
