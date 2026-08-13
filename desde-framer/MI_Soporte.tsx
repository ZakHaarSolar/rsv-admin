// MI_Soporte.tsx v1.1 — EL CASO ES UNA CONVERSACIÓN: cada caso muestra el hilo
// (tripulante ↔ casa) y gana "✉ Responder", que le llega DENTRO de su reporte y
// le suena la notificación. El aviso de una transferencia deja de ser un mensaje
// directo suelto y entra a ese mismo hilo. Suma "Probar el aviso": manda la
// notificación real al correo que elijas, en sus dos variantes (con nota y sin
// ella), sin tocar ninguna suscripción. La ficha del caso dice en qué aparato y
// con qué versión del sistema pasó. Y las listas se cargan UNA vez por visita
// (adminActionCached de MI_Shared v1.9): cambiar de pestaña y volver ya no dice
// "Cargando…" otra vez; el botón Recargar sigue trayendo datos frescos.
// Requiere migración 20260807c_soporte_conversacion + admin-action v1.50.
//
// MI_Soporte.tsx v1.0 — PANEL DE SOPORTE del Motor de Intervención.
// =====================================================================
// EL PROBLEMA QUE RESUELVE. El acceso comprado en la WEB se ata al CORREO
// CON EL QUE SE PAGA. Si alguien paga con un correo distinto al de su
// cuenta, queda cobrado y sin acceso. Hasta hoy no había herramienta para
// arreglarlo: había que entrar a la base a mano.
//
// TRES SUB-PESTAÑAS:
//   · Casos      — la bandeja de lo que llega desde Ajustes → "¿Necesitas
//                  ayuda?". Cada caso trae escrito QUÉ PEDIRLE a la
//                  persona, así al abrirlo se sabe qué falta sin pensarlo.
//   · Transferir — la herramienta: buscar un correo, CRUZAR lo que la
//                  persona dijo contra el cobro real (últimos 4 de la
//                  tarjeta vía Stripe + id de factura, monto y fecha de
//                  nuestra base) y mover la suscripción en un clic.
//   · Bitácora   — el libro mayor: quién hizo qué, cuándo y sobre qué.
//
// GENÉRICO A PROPÓSITO. CASOS_ADMIN es la fuente única del panel: sumar un
// caso a la familia (reembolsos, cuentas repetidas, cambio de correo) es
// una entrada más ahí. La app tiene su gemelo en MN_Firma (CASOS_SOPORTE).
//
// Backend: migración 20260807_soporte + admin-action v1.49 (bandeja, cruce,
// transferencia, bitácora) + edge soporte-stripe (los últimos 4, que no
// viven en nuestra base y se le preguntan a Stripe en el momento).

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import Shared from "./MI_Shared.tsx"

const { hx, AC, GOLD, adminAction, adminActionCached, motorCacheClear } = Shared

const PLATINUM = "#E8EEF7"
const VERDE = "#3DDC84"
const ROJO = "#FF6B6B"

/* ════════════════════════════════════════════════════════════════════
   CATÁLOGO DE CASOS — la fuente única del panel.
   `pedir` es lo que hay que preguntarle a la persona si no lo mandó.
   `campos` traduce las claves crudas del reporte a etiquetas legibles.
   `herramienta` marca los casos que ya tienen acción de un clic.
   ════════════════════════════════════════════════════════════════════ */
type CasoAdmin = {
    kind: string
    label: string
    color: string
    glyph: string
    campos: Record<string, string>
    pedir: string[]
    herramienta?: "transferir"
}

export const CASOS_ADMIN: CasoAdmin[] = [
    {
        kind: "acceso_pago",
        label: "Pagó y no tiene acceso",
        color: GOLD,
        glyph: "🔑",
        campos: {
            correo_pago: "Correo con el que pagó",
            ultimos4: "Últimos 4 de la tarjeta",
            recibo: "Número de recibo",
        },
        pedir: [
            "El correo con el que pagó (dice DÓNDE está el cobro).",
            "Los últimos 4 de su tarjeta o el número de su recibo. Este es el filtro FUERTE: se cruza contra el cobro real y nadie de fuera lo conoce.",
            "El correo destino es la cuenta desde la que escribió, y ya debe existir. No hace falta pedirlo.",
        ],
        herramienta: "transferir",
    },
    {
        kind: "cobro",
        label: "Cobro que no reconoce",
        color: "#FFB347",
        glyph: "💳",
        campos: {
            ultimos4: "Últimos 4 de la tarjeta",
            monto_fecha: "Monto y fecha del cobro",
        },
        pedir: [
            "Los últimos 4 de su tarjeta.",
            "El monto y la fecha aproximada del cargo.",
            "Buscar su correo abajo: la lista de pagos dice si el cobro existe, cuánto fue y con qué factura.",
        ],
    },
    {
        kind: "tecnico",
        label: "Algo no funciona",
        color: AC,
        glyph: "🛠",
        campos: {},
        pedir: [
            "En qué pantalla pasó y qué estaba haciendo.",
            "El aparato y la versión ya vienen en el reporte.",
        ],
    },
    {
        kind: "cuenta",
        label: "Cuenta o correo",
        color: "#B59CFF",
        glyph: "👤",
        campos: { otro_correo: "El otro correo involucrado" },
        pedir: [
            "El otro correo involucrado.",
            "Cuál de las dos cuentas quiere conservar.",
        ],
    },
    {
        kind: "otro",
        label: "Otra cosa",
        color: PLATINUM,
        glyph: "✦",
        campos: {},
        pedir: ["Leer el mensaje y decidir a qué familia pertenece."],
    },
]

const casoDe = (kind: string): CasoAdmin =>
    CASOS_ADMIN.find((c) => c.kind === kind) ||
    CASOS_ADMIN[CASOS_ADMIN.length - 1]

const ESTADOS: { id: string; label: string; color: string }[] = [
    { id: "nuevo", label: "Nuevos", color: GOLD },
    { id: "en_curso", label: "En curso", color: AC },
    { id: "resuelto", label: "Resueltos", color: VERDE },
    { id: "", label: "Todos", color: PLATINUM },
]

function fmtFecha(s: string | null | undefined): string {
    if (!s) return "—"
    try {
        return new Date(s).toLocaleString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    } catch {
        return "—"
    }
}

function fmtDinero(cents: number | null | undefined, moneda?: string): string {
    if (typeof cents !== "number") return "—"
    return `${(cents / 100).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${(moneda || "MXN").toUpperCase()}`
}

/* Etiqueta de aparato legible. */
function fmtAparato(p?: string | null): string {
    const v = (p || "").toLowerCase()
    if (v === "ios") return "iPhone"
    if (v === "android") return "Android"
    if (v === "web") return "Navegador"
    return "—"
}

/* ════════════════════════════════════════════════════════════════════
   PILL — pastilla de filtro reusada por las dos listas.
   ════════════════════════════════════════════════════════════════════ */
function Pill({
    activo,
    color,
    onClick,
    children,
}: {
    activo: boolean
    color: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: "6px 14px",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                border: `1px solid ${hx(color, activo ? 0.65 : 0.22)}`,
                background: activo ? hx(color, 0.16) : "transparent",
                color: activo ? color : hx("#ffffff", 0.55),
            }}
        >
            {children}
        </button>
    )
}

/* ════════════════════════════════════════════════════════════════════
   CasosView — la bandeja.
   ════════════════════════════════════════════════════════════════════ */
type MensajeCaso = {
    id: string
    autor: "tripulante" | "casa"
    body: string
    created_at: string | null
    read_at?: string | null
}
type Ticket = {
    id: string
    kind: string
    message: string
    fields: Record<string, string> | null
    status: string
    admin_note: string | null
    platform: string | null
    app_version: string | null
    device_model: string | null
    os_version: string | null
    lang: string | null
    email: string | null
    clerk_user_id: string | null
    full_name: string | null
    created_at: string | null
    resolved_at: string | null
    acciones: number
    mensajes: MensajeCaso[] | null
    sin_leer: number
}

function CasosView({
    url,
    apiKey,
    onTransferir,
}: {
    url: string
    apiKey: string
    onTransferir: (t: Ticket) => void
}) {
    const [estado, setEstado] = useState<string>("nuevo")
    const [rows, setRows] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")
    const [nota, setNota] = useState<Record<string, string>>({})
    const [busy, setBusy] = useState<string>("")
    /* Responder al Tripulante desde el caso mismo, junto a sus datos. */
    const [respuesta, setRespuesta] = useState<Record<string, string>>({})
    const [abierto, setAbierto] = useState<string>("")

    const load = useCallback(async (force = false) => {
        setLoading(true)
        setErr("")
        try {
            const res: any = await adminActionCached(
                url,
                apiKey,
                "admin_get_support_tickets",
                { p_status: estado || null, p_limit: 300 },
                { force }
            )
            if (Array.isArray(res)) setRows(res as Ticket[])
            else {
                setRows([])
                /* 🜂 El motivo se DICE. Sin esto, "no hay casos" y "la RPC no
                   está pegada todavía" se ven exactamente igual. */
                setErr(
                    res && res.error
                        ? `El servidor respondió: ${res.error}`
                        : "No se pudo leer la bandeja. ¿Está pegada la migración 20260807_soporte y desplegado admin-action v1.49?"
                )
            }
        } catch {
            setRows([])
            setErr("No se pudo leer la bandeja.")
        } finally {
            setLoading(false)
        }
    }, [url, apiKey, estado])

    useEffect(() => {
        void load()
    }, [load])

    const mover = async (t: Ticket, status: string) => {
        setBusy(t.id)
        try {
            await adminAction(
                url,
                apiKey,
                "admin_set_support_ticket_status",
                {
                    p_ticket_id: t.id,
                    p_status: status,
                    p_note: (nota[t.id] || "").trim() || null,
                }
            )
            /* Acabamos de escribir: lo guardado quedó viejo. */
            motorCacheClear("admin_get_support_tickets")
            await load(true)
        } catch {}
        setBusy("")
    }

    /* Responder ES la puerta de vuelta: le llega el mensaje dentro de su
       reporte y su notificación. El caso pasa solo de "nuevo" a "en curso". */
    const responder = async (t: Ticket) => {
        const body = (respuesta[t.id] || "").trim()
        if (!body) return
        setBusy(t.id)
        try {
            const res: any = await adminAction(
                url,
                apiKey,
                "admin_soporte_mensaje",
                { p_ticket_id: t.id, p_body: body }
            )
            if (res && res.ok) {
                setRespuesta((p) => ({ ...p, [t.id]: "" }))
                motorCacheClear("admin_get_support_tickets")
                await load(true)
            } else {
                setErr(
                    `No se pudo responder: ${res?.error || "sin respuesta"}. ¿Está pegada la migración 20260807c y desplegado admin-action v1.50?`
                )
            }
        } catch {
            setErr("No se pudo responder.")
        }
        setBusy("")
    }

    return (
        <div>
            <div
                className="mi-card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    padding: 14,
                    marginBottom: 16,
                }}
            >
                {ESTADOS.map((e) => (
                    <Pill
                        key={e.id || "todos"}
                        activo={estado === e.id}
                        color={e.color}
                        onClick={() => setEstado(e.id)}
                    >
                        {e.label}
                    </Pill>
                ))}
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        fontSize: 12,
                        color: hx("#ffffff", 0.45),
                        marginRight: 8,
                    }}
                >
                    {rows.length} caso{rows.length === 1 ? "" : "s"}
                </div>
                <button className="mi-btn" onClick={() => void load(true)}>
                    ↻ Recargar
                </button>
            </div>

            {err && (
                <p
                    style={{
                        color: hx(ROJO, 0.9),
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        marginBottom: 14,
                    }}
                >
                    {err}
                </p>
            )}

            {loading ? (
                <p className="mi-muted" style={{ color: hx("#ffffff", 0.45) }}>
                    Cargando casos…
                </p>
            ) : rows.length === 0 && !err ? (
                <p
                    style={{
                        color: hx("#ffffff", 0.45),
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}
                >
                    Nada por aquí. Los casos entran cuando un Tripulante escribe
                    desde Mi Núcleo → Ajustes → “¿Necesitas ayuda?”.
                </p>
            ) : (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                    {rows.map((t) => {
                        const c = casoDe(t.kind)
                        const f = t.fields || {}
                        const claves = Object.keys(c.campos)
                        const faltantes = claves.filter((k) => !f[k])
                        return (
                            <div
                                key={t.id}
                                className="mi-card"
                                style={{
                                    padding: 16,
                                    borderLeft: `3px solid ${hx(c.color, 0.7)}`,
                                }}
                            >
                                {/* Encabezado del caso */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 10,
                                        marginBottom: 10,
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>
                                        {c.glyph}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                            color: c.color,
                                        }}
                                    >
                                        {c.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            padding: "3px 9px",
                                            borderRadius: 999,
                                            border: `1px solid ${hx("#ffffff", 0.14)}`,
                                            color: hx("#ffffff", 0.55),
                                        }}
                                    >
                                        {t.status}
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: hx("#ffffff", 0.35),
                                        }}
                                    >
                                        {fmtFecha(t.created_at)}
                                    </span>
                                </div>

                                {/* Quién + aparato */}
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: hx("#ffffff", 0.62),
                                        marginBottom: 10,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <strong style={{ color: "#fff" }}>
                                        {t.full_name || "Tripulante"}
                                    </strong>
                                    {t.email ? ` · ${t.email}` : ""}
                                    {" · "}
                                    {/* El modelo exacto Apple lo esconde; el
                                        tamaño de pantalla identifica la
                                        familia y la versión del sistema es
                                        exacta. Con eso se tría un fallo sin
                                        preguntarle nada a nadie. */}
                                    {t.device_model || fmtAparato(t.platform)}
                                    {t.os_version ? ` · ${t.os_version}` : ""}
                                    {t.app_version ? ` · app ${t.app_version}` : ""}
                                    {t.lang ? ` · ${t.lang}` : ""}
                                </div>

                                {/* Lo que escribió */}
                                {t.message && (
                                    <div
                                        style={{
                                            fontSize: 14,
                                            lineHeight: 1.55,
                                            color: "#fff",
                                            whiteSpace: "pre-wrap",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {t.message}
                                    </div>
                                )}

                                {/* Los datos del caso */}
                                {claves.length > 0 && (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fill, minmax(200px, 1fr))",
                                            gap: 8,
                                            marginBottom: 12,
                                        }}
                                    >
                                        {claves.map((k) => (
                                            <div
                                                key={k}
                                                style={{
                                                    padding: "8px 11px",
                                                    borderRadius: 10,
                                                    background: f[k]
                                                        ? hx(c.color, 0.07)
                                                        : "transparent",
                                                    border: `1px solid ${hx(
                                                        f[k] ? c.color : "#ffffff",
                                                        f[k] ? 0.22 : 0.08
                                                    )}`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        letterSpacing: "0.08em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: hx(
                                                            "#ffffff",
                                                            0.4
                                                        ),
                                                    }}
                                                >
                                                    {c.campos[k]}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 13.5,
                                                        fontWeight: 600,
                                                        marginTop: 2,
                                                        color: f[k]
                                                            ? "#fff"
                                                            : hx(
                                                                  "#ffffff",
                                                                  0.28
                                                              ),
                                                    }}
                                                >
                                                    {f[k] || "sin dato"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* QUÉ PEDIRLE — la lista escrita del caso.
                                    Al abrirlo se sabe qué falta sin pensarlo. */}
                                <details style={{ marginBottom: 12 }}>
                                    <summary
                                        style={{
                                            cursor: "pointer",
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            letterSpacing: "0.06em",
                                            textTransform: "uppercase",
                                            color: hx(
                                                faltantes.length ? GOLD : "#ffffff",
                                                faltantes.length ? 0.85 : 0.4
                                            ),
                                        }}
                                    >
                                        Qué pedirle
                                        {faltantes.length
                                            ? ` · faltan ${faltantes.length}`
                                            : ""}
                                    </summary>
                                    <ul
                                        style={{
                                            margin: "8px 0 0",
                                            paddingLeft: 18,
                                            fontSize: 12.5,
                                            lineHeight: 1.7,
                                            color: hx("#ffffff", 0.6),
                                        }}
                                    >
                                        {c.pedir.map((p, i) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                    </ul>
                                </details>

                                {t.admin_note && (
                                    <div
                                        style={{
                                            fontSize: 12,
                                            lineHeight: 1.5,
                                            padding: "8px 11px",
                                            borderRadius: 10,
                                            marginBottom: 12,
                                            background: hx("#ffffff", 0.04),
                                            color: hx("#ffffff", 0.6),
                                        }}
                                    >
                                        Nota: {t.admin_note}
                                    </div>
                                )}

                                {/* ── EL HILO: lo que ya se dijo de los dos
                                    lados. Vive en el caso, junto a sus datos y
                                    sus pagos, no en la bandeja de Comunidad. */}
                                {(t.mensajes || []).length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            marginBottom: 12,
                                            paddingLeft: 10,
                                            borderLeft: `1px solid ${hx("#ffffff", 0.1)}`,
                                        }}
                                    >
                                        {(t.mensajes || []).map((m) => (
                                            <div key={m.id}>
                                                <div
                                                    style={{
                                                        fontSize: 10.5,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.06em",
                                                        textTransform: "uppercase",
                                                        marginBottom: 3,
                                                        color:
                                                            m.autor === "casa"
                                                                ? hx(GOLD, 0.85)
                                                                : hx(AC, 0.85),
                                                    }}
                                                >
                                                    {m.autor === "casa"
                                                        ? "Zak'Haar"
                                                        : t.full_name || "Tripulante"}
                                                    <span
                                                        style={{
                                                            marginLeft: 8,
                                                            fontWeight: 400,
                                                            textTransform: "none",
                                                            letterSpacing: 0,
                                                            color: hx("#ffffff", 0.3),
                                                        }}
                                                    >
                                                        {fmtFecha(m.created_at)}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        lineHeight: 1.55,
                                                        whiteSpace: "pre-wrap",
                                                        color: hx("#ffffff", 0.82),
                                                    }}
                                                >
                                                    {m.body}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Responder. Se abre al tocar, para no llenar
                                    la bandeja de campos de texto. */}
                                {abierto === t.id ? (
                                    <div style={{ marginBottom: 12 }}>
                                        <textarea
                                            className="mi-input"
                                            value={respuesta[t.id] || ""}
                                            onChange={(e) =>
                                                setRespuesta((p) => ({
                                                    ...p,
                                                    [t.id]: e.target.value,
                                                }))
                                            }
                                            placeholder="Tu respuesta. Le llega dentro de su reporte y le suena la notificación."
                                            rows={3}
                                            style={{ width: "100%", fontSize: 13 }}
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <button
                                                className="mi-btn"
                                                disabled={
                                                    busy === t.id ||
                                                    !(respuesta[t.id] || "").trim()
                                                }
                                                onClick={() => void responder(t)}
                                                style={{
                                                    borderColor: hx(GOLD, 0.5),
                                                    color: GOLD,
                                                }}
                                            >
                                                {busy === t.id
                                                    ? "Enviando…"
                                                    : "✉ Enviar respuesta"}
                                            </button>
                                            <button
                                                className="mi-btn"
                                                onClick={() => setAbierto("")}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Acciones */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    <input
                                        className="mi-input"
                                        value={nota[t.id] || ""}
                                        onChange={(e) =>
                                            setNota((p) => ({
                                                ...p,
                                                [t.id]: e.target.value,
                                            }))
                                        }
                                        placeholder="Nota interna (opcional)"
                                        style={{
                                            flex: "1 1 200px",
                                            minWidth: 160,
                                            fontSize: 12.5,
                                        }}
                                    />
                                    <button
                                        className="mi-btn"
                                        onClick={() =>
                                            setAbierto(
                                                abierto === t.id ? "" : t.id
                                            )
                                        }
                                        style={{
                                            borderColor: hx(AC, 0.5),
                                            color: AC,
                                        }}
                                    >
                                        ✉ Responder
                                    </button>
                                    {c.herramienta === "transferir" && (
                                        <button
                                            className="mi-btn"
                                            onClick={() => onTransferir(t)}
                                            style={{
                                                borderColor: hx(GOLD, 0.5),
                                                color: GOLD,
                                            }}
                                        >
                                            ⇄ Transferir suscripción
                                        </button>
                                    )}
                                    <button
                                        className="mi-btn"
                                        disabled={busy === t.id}
                                        onClick={() => mover(t, "en_curso")}
                                    >
                                        En curso
                                    </button>
                                    <button
                                        className="mi-btn"
                                        disabled={busy === t.id}
                                        onClick={() => mover(t, "resuelto")}
                                        style={{
                                            borderColor: hx(VERDE, 0.45),
                                            color: VERDE,
                                        }}
                                    >
                                        ✓ Resuelto
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   TransferirView — el CRUCE y la transferencia.

   Buscar un correo devuelve su perfil, sus suscripciones y sus pagos
   reales. Encima, la edge `soporte-stripe` le pregunta a Stripe por los
   últimos 4 de la tarjeta con la que se cobró — el dato que la persona
   sí recuerda y que nadie de fuera conoce. Si la persona declaró unos
   últimos 4, el panel los compara solo y lo dice: coincide o no.
   ════════════════════════════════════════════════════════════════════ */
function TransferirView({
    url,
    apiKey,
    inicial,
}: {
    url: string
    apiKey: string
    inicial: {
        origen?: string
        destino?: string
        ultimos4?: string
        recibo?: string
        ticketId?: string
    } | null
}) {
    const [origen, setOrigen] = useState(inicial?.origen || "")
    const [destino, setDestino] = useState(inicial?.destino || "")
    const [declarado4, setDeclarado4] = useState(inicial?.ultimos4 || "")
    const [declaradoRecibo, setDeclaradoRecibo] = useState(
        inicial?.recibo || ""
    )
    const [ticketId] = useState(inicial?.ticketId || "")
    const [motivo, setMotivo] = useState("")

    const [buscando, setBuscando] = useState(false)
    const [datosOrigen, setDatosOrigen] = useState<any>(null)
    const [datosDestino, setDatosDestino] = useState<any>(null)
    const [stripe, setStripe] = useState<any>(null)
    const [stripeErr, setStripeErr] = useState("")
    const [msg, setMsg] = useState("")
    const [msgTipo, setMsgTipo] = useState<"ok" | "err" | "">("")
    const [confirmar, setConfirmar] = useState<string>("")
    const [moviendo, setMoviendo] = useState(false)
    /* Avisarle al Tripulante que ya quedó. El texto se puede editar antes de
       mandarlo; sale como DM de Zak'Haar y dispara su push (admin_send_dm, el
       mismo camino de Motor → Mensajes). Se muestra SOLO tras una
       transferencia exitosa. */
    const [aviso, setAviso] = useState("")
    const [avisoAbierto, setAvisoAbierto] = useState(false)
    const [avisando, setAvisando] = useState(false)
    const [avisado, setAvisado] = useState(false)
    /* Probar el aviso sin mover ninguna suscripción. */
    const [pruebaEmail, setPruebaEmail] = useState("cuerpodeluz555@gmail.com")
    const [pruebaNota, setPruebaNota] = useState(
        "Cualquier cosa, respóndeme por aquí mismo."
    )
    const [probando, setProbando] = useState<string>("")
    const [pruebaMsg, setPruebaMsg] = useState("")

    /* Un ticket recién abierto siembra los campos y busca solo. */
    useEffect(() => {
        if (inicial?.origen) {
            setOrigen(inicial.origen)
            setDestino(inicial.destino || "")
            setDeclarado4(inicial.ultimos4 || "")
            setDeclaradoRecibo(inicial.recibo || "")
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inicial?.ticketId])

    const buscar = async () => {
        const o = origen.trim().toLowerCase()
        if (o.length < 3) return
        setBuscando(true)
        setMsg("")
        setMsgTipo("")
        setStripe(null)
        setStripeErr("")
        try {
            const [ro, rd]: any[] = await Promise.all([
                adminAction(url, apiKey, "admin_soporte_buscar_cuenta", {
                    p_email: o,
                }),
                destino.trim().length > 2
                    ? adminAction(url, apiKey, "admin_soporte_buscar_cuenta", {
                          p_email: destino.trim().toLowerCase(),
                      })
                    : Promise.resolve(null),
            ])
            setDatosOrigen(ro && !ro.error ? ro : null)
            setDatosDestino(rd && !rd.error ? rd : null)
            if (ro && ro.error) {
                setMsg(`El servidor respondió: ${ro.error}`)
                setMsgTipo("err")
            }

            /* Los últimos 4 no viven en nuestra base: se los preguntamos a
               Stripe por el mismo cliente del cobro. */
            const cids: string[] = Array.from(
                new Set(
                    ((ro?.subs || []) as any[])
                        .map((s) => String(s?.stripe_customer_id || ""))
                        .filter((x) => x.startsWith("cus_"))
                )
            )
            if (cids.length) {
                try {
                    const token = await (
                        window as any
                    ).Clerk?.session?.getToken?.()
                    const r = await fetch(
                        `${url}/functions/v1/soporte-stripe`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: apiKey,
                                Authorization: `Bearer ${apiKey}`,
                            },
                            body: JSON.stringify({
                                token,
                                customer_ids: cids,
                            }),
                        }
                    )
                    const js = await r.json().catch(() => null)
                    if (js && js.ok) setStripe(js)
                    else
                        setStripeErr(
                            js?.error === "sin_llave_stripe"
                                ? "Stripe no está configurado en el servidor: no se pueden leer los últimos 4. El cruce por factura, monto y fecha sigue sirviendo."
                                : `No se pudo preguntar a Stripe (${js?.error || r.status}). El cruce por factura, monto y fecha sigue sirviendo.`
                        )
                } catch {
                    setStripeErr(
                        "No se pudo preguntar a Stripe. ¿Está desplegada la función soporte-stripe?"
                    )
                }
            }
        } catch {
            setMsg("No se pudo buscar.")
            setMsgTipo("err")
        }
        setBuscando(false)
    }

    const transferir = async (subId: string) => {
        setMoviendo(true)
        setMsg("")
        setMsgTipo("")
        try {
            const res: any = await adminAction(
                url,
                apiKey,
                "admin_soporte_transferir_suscripcion",
                {
                    p_subscription_id: subId,
                    p_to_email: destino.trim().toLowerCase(),
                    p_ticket_id: ticketId || null,
                    p_motivo: motivo.trim() || null,
                }
            )
            if (res && res.ok) {
                setMsg(
                    `Listo. El acceso pasó de ${res.de} a ${res.a}${
                        res.group_name ? ` (${res.group_name})` : ""
                    }.`
                )
                setMsgTipo("ok")
                setConfirmar("")
                setAvisado(false)
                /* El aviso base lo compone el servidor y va SIEMPRE (sin él la
                   persona no se entera de lo único que no se puede omitir).
                   Acá solo se agrega tu nota, si querés poner una. */
                setAviso("")
                setAvisoAbierto(true)
                await buscar()
            } else {
                const e = res?.error || "sin respuesta"
                const humano: Record<string, string> = {
                    destino_sin_cuenta:
                        "El correo destino no tiene cuenta creada. Pídele que entre a la app y cree su cuenta con ESE correo antes de mover nada.",
                    destino_ya_tiene_activa:
                        "El destino ya tiene una suscripción activa del mismo tipo. Mover ésta duplicaría el acceso y escondería un cobro doble.",
                    mismo_correo: "Origen y destino son el mismo correo.",
                    suscripcion_no_existe: "Esa suscripción ya no existe.",
                    correo_destino_invalido: "El correo destino no es válido.",
                    unauthorized: "Tu sesión no tiene permiso de Arquitecto.",
                }
                setMsg(humano[e] || `No se pudo transferir: ${e}`)
                setMsgTipo("err")
            }
        } catch {
            setMsg("No se pudo transferir.")
            setMsgTipo("err")
        }
        setMoviendo(false)
    }

    /* El aviso ya NO sale como mensaje directo suelto: entra al HILO del caso
       (o abre uno, si la transferencia se hizo sin caso previo). Así la
       persona puede responder ahí mismo y todo queda en un solo lugar. */
    const avisar = async () => {
        if (avisando) return
        setAvisando(true)
        try {
            const res: any = await adminAction(
                url,
                apiKey,
                "admin_soporte_mensaje",
                {
                    p_ticket_id: ticketId || null,
                    p_target_email: ticketId ? null : destino.trim().toLowerCase(),
                    p_body: aviso.trim() || null,
                    p_plantilla: "transferencia",
                }
            )
            if (res && res.ok) setAvisado(true)
            else {
                setMsg(
                    `No se pudo avisar (${res?.error || "sin respuesta"}). La transferencia SÍ quedó hecha.`
                )
                setMsgTipo("err")
            }
        } catch {
            setMsg("No se pudo avisar. La transferencia SÍ quedó hecha.")
            setMsgTipo("err")
        }
        setAvisando(false)
    }

    /* ── PROBAR EL AVISO ────────────────────────────────────────────────
       Manda EXACTAMENTE la notificación que recibiría el Tripulante, sin
       tocar ninguna suscripción. Dos variantes, porque son dos experiencias
       distintas: con nota agregada y sin ella. Marcado como prueba, así no
       mueve el estado de ningún caso. */
    const probar = async (conNota: boolean) => {
        const correo = pruebaEmail.trim().toLowerCase()
        if (!correo || probando) return
        setProbando(conNota ? "con" : "sin")
        setPruebaMsg("")
        try {
            const res: any = await adminAction(
                url,
                apiKey,
                "admin_soporte_mensaje",
                {
                    p_target_email: correo,
                    p_body: conNota ? pruebaNota.trim() || null : null,
                    p_plantilla: "transferencia",
                    p_prueba: true,
                }
            )
            if (res && res.ok) {
                setPruebaMsg(
                    `Enviado a ${correo}${conNota ? " con tu nota" : " sin nota"}. Míralo en tu teléfono y dentro de la app, en Ajustes.`
                )
            } else {
                const e = res?.error || "sin respuesta"
                setPruebaMsg(
                    e === "destino_sin_cuenta"
                        ? "Ese correo no tiene cuenta creada."
                        : `No se pudo enviar: ${e}`
                )
            }
        } catch {
            setPruebaMsg("No se pudo enviar.")
        }
        setProbando("")
    }

    /* ── El cruce: ¿los últimos 4 declarados aparecen en algún cobro? ── */
    const todosLos4: string[] = []
    if (stripe) {
        for (const k of Object.keys(stripe.tarjetas || {}))
            for (const t of stripe.tarjetas[k] || [])
                if (t?.last4) todosLos4.push(String(t.last4))
        for (const k of Object.keys(stripe.cargos || {}))
            for (const c of stripe.cargos[k] || [])
                if (c?.last4) todosLos4.push(String(c.last4))
    }
    const d4 = declarado4.replace(/\D/g, "").slice(-4)
    const coincide4 =
        d4.length === 4 && todosLos4.length > 0
            ? todosLos4.includes(d4)
            : null

    /* Los recibos que SÍ existen para este correo. Se comparan en minúsculas
       y con un mínimo de 8 caracteres: un fragmento más corto puede coincidir
       por azar entre ids de Stripe, y un veredicto falso es peor que ninguno.
       Se acepta que la persona pegue la liga completa del recibo (entonces el
       id vive DENTRO de lo que escribió) o solo un pedazo del id. */
    const recibos: string[] = ((datosOrigen?.pagos || []) as any[])
        .flatMap((p) => [p?.stripe_invoice_id, p?.stripe_subscription_id])
        .filter(Boolean)
        .map((x: any) => String(x).toLowerCase())
    const dRec = declaradoRecibo.trim().toLowerCase()
    const coincideRecibo =
        dRec.length >= 8 && recibos.length > 0
            ? recibos.some((r) => r.includes(dRec) || dRec.includes(r))
            : null

    const veredicto = (ok: boolean | null) =>
        ok === null ? (
            <span style={{ color: hx("#ffffff", 0.35) }}>sin comparar</span>
        ) : ok ? (
            <span style={{ color: VERDE, fontWeight: 700 }}>✓ coincide</span>
        ) : (
            <span style={{ color: ROJO, fontWeight: 700 }}>✗ NO coincide</span>
        )

    const campo = (
        label: string,
        value: string,
        set: (v: string) => void,
        ph: string
    ) => (
        <div style={{ flex: "1 1 220px", minWidth: 180 }}>
            <div
                style={{
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: hx("#ffffff", 0.42),
                    marginBottom: 5,
                }}
            >
                {label}
            </div>
            <input
                className="mi-input"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                style={{ width: "100%", fontSize: 13 }}
            />
        </div>
    )

    return (
        <div>
            {/* ── Los datos que se piden ── */}
            <div className="mi-card" style={{ padding: 16, marginBottom: 16 }}>
                <div
                    style={{
                        fontSize: 12,
                        lineHeight: 1.65,
                        color: hx("#ffffff", 0.55),
                        marginBottom: 14,
                    }}
                >
                    Con el correo que pagó y <strong>los últimos 4 de su
                    tarjeta</strong> (o el número de su recibo) el cruce es
                    total: eso solo lo conoce quien pagó. El correo destino ya
                    debe tener cuenta creada.
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    {campo(
                        "Correo con el que pagó",
                        origen,
                        setOrigen,
                        "correo@ejemplo.com"
                    )}
                    {campo(
                        "Correo destino (su cuenta)",
                        destino,
                        setDestino,
                        "correo@ejemplo.com"
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 14,
                    }}
                >
                    {campo(
                        "Últimos 4 que declaró",
                        declarado4,
                        setDeclarado4,
                        "1234"
                    )}
                    {campo(
                        "Número de recibo que declaró",
                        declaradoRecibo,
                        setDeclaradoRecibo,
                        "in_1A2b3C…"
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                        className="mi-btn"
                        onClick={buscar}
                        disabled={buscando || origen.trim().length < 3}
                        style={{ borderColor: hx(AC, 0.5), color: AC }}
                    >
                        {buscando ? "Buscando…" : "🔎 Buscar y cruzar"}
                    </button>
                    {ticketId ? (
                        <span
                            style={{
                                fontSize: 11.5,
                                color: hx(GOLD, 0.85),
                            }}
                        >
                            Ligado al caso · al transferir queda resuelto
                        </span>
                    ) : null}
                </div>
            </div>

            {/* ── PROBAR EL AVISO ── Manda la MISMA notificación que recibiría
                el Tripulante, sin tocar ninguna suscripción. Dos botones
                porque son dos experiencias distintas. */}
            <div
                className="mi-card"
                style={{
                    padding: 16,
                    marginBottom: 16,
                    borderLeft: `3px solid ${hx(PLATINUM, 0.4)}`,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: hx(PLATINUM, 0.75),
                        marginBottom: 8,
                    }}
                >
                    Probar el aviso
                </div>
                <div
                    style={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: hx("#ffffff", 0.5),
                        marginBottom: 12,
                    }}
                >
                    Manda la misma notificación que recibiría el Tripulante al
                    moverle el acceso, <strong>sin tocar ninguna
                    suscripción</strong>. El aviso base va siempre; la nota se
                    suma abajo. Así se ve cómo llega con nota y sin ella.
                </div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 10,
                    }}
                >
                    {campo(
                        "A qué correo",
                        pruebaEmail,
                        setPruebaEmail,
                        "correo@ejemplo.com"
                    )}
                    {campo(
                        "Nota opcional (solo la variante CON nota)",
                        pruebaNota,
                        setPruebaNota,
                        "Cualquier cosa, respóndeme por aquí mismo."
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                    }}
                >
                    <button
                        className="mi-btn"
                        onClick={() => void probar(false)}
                        disabled={!!probando || !pruebaEmail.trim()}
                    >
                        {probando === "sin" ? "Enviando…" : "▶ Sin nota"}
                    </button>
                    <button
                        className="mi-btn"
                        onClick={() => void probar(true)}
                        disabled={
                            !!probando ||
                            !pruebaEmail.trim() ||
                            !pruebaNota.trim()
                        }
                        style={{ borderColor: hx(GOLD, 0.5), color: GOLD }}
                    >
                        {probando === "con" ? "Enviando…" : "▶ Con nota"}
                    </button>
                    {pruebaMsg ? (
                        <span
                            style={{
                                fontSize: 12,
                                lineHeight: 1.5,
                                color: /No se pudo|no tiene cuenta/.test(pruebaMsg)
                                    ? hx(ROJO, 0.95)
                                    : VERDE,
                            }}
                        >
                            {pruebaMsg}
                        </span>
                    ) : null}
                </div>
            </div>

            {msg && (
                <div
                    className="mi-card"
                    style={{
                        padding: 14,
                        marginBottom: 16,
                        borderLeft: `3px solid ${msgTipo === "ok" ? VERDE : ROJO}`,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: msgTipo === "ok" ? VERDE : hx(ROJO, 0.95),
                    }}
                >
                    {msg}
                </div>
            )}

            {/* ── Avisarle que ya quedó ── */}
            {avisoAbierto && (
                <div className="mi-card" style={{ padding: 16, marginBottom: 16 }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx(AC, 0.8),
                            marginBottom: 10,
                        }}
                    >
                        Avisarle al Tripulante
                    </div>
                    {avisado ? (
                        <div style={{ fontSize: 13, color: VERDE }}>
                            ✓ Aviso enviado a {destino.trim().toLowerCase()}. Le
                            llegó dentro de su reporte, con su notificación.
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    fontSize: 12.5,
                                    lineHeight: 1.6,
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    marginBottom: 10,
                                    background: hx(GOLD, 0.07),
                                    border: `1px solid ${hx(GOLD, 0.22)}`,
                                    color: hx("#ffffff", 0.75),
                                }}
                            >
                                Va siempre esto: “Tu acceso ya quedó activo en
                                esta cuenta. El pago que hiciste con otro correo
                                lo movimos aquí, así que puedes entrar normal.”
                            </div>
                            <textarea
                                className="mi-input"
                                value={aviso}
                                onChange={(e) => setAviso(e.target.value)}
                                rows={2}
                                placeholder="Nota tuya, opcional. Se suma abajo del aviso."
                                style={{ width: "100%", fontSize: 13 }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    marginTop: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    className="mi-btn"
                                    onClick={avisar}
                                    disabled={avisando}
                                    style={{
                                        borderColor: hx(VERDE, 0.45),
                                        color: VERDE,
                                    }}
                                >
                                    {avisando ? "Enviando…" : "✉ Enviar aviso"}
                                </button>
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        color: hx("#ffffff", 0.4),
                                    }}
                                >
                                    Entra a su reporte, donde puede
                                    responderte, y le suena la notificación.
                                </span>
                                <div style={{ flex: 1 }} />
                                <button
                                    className="mi-btn"
                                    onClick={() => setAvisoAbierto(false)}
                                >
                                    Ahora no
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {datosOrigen && (
                <>
                    {/* ── El veredicto del cruce ── */}
                    <div
                        className="mi-card"
                        style={{ padding: 16, marginBottom: 16 }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: hx("#ffffff", 0.45),
                                marginBottom: 10,
                            }}
                        >
                            El cruce
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                lineHeight: 1.9,
                                color: hx("#ffffff", 0.75),
                            }}
                        >
                            <div>
                                Últimos 4 declarados{" "}
                                <strong style={{ color: "#fff" }}>
                                    {d4 || "—"}
                                </strong>{" "}
                                · en Stripe{" "}
                                <strong style={{ color: "#fff" }}>
                                    {todosLos4.length
                                        ? Array.from(new Set(todosLos4)).join(
                                              ", "
                                          )
                                        : "—"}
                                </strong>{" "}
                                · {veredicto(coincide4)}
                            </div>
                            <div>
                                Recibo declarado{" "}
                                <strong style={{ color: "#fff" }}>
                                    {dRec || "—"}
                                </strong>{" "}
                                · {veredicto(coincideRecibo)}
                            </div>
                        </div>
                        {stripeErr && (
                            <div
                                style={{
                                    marginTop: 10,
                                    fontSize: 12,
                                    lineHeight: 1.55,
                                    color: hx("#FFB347", 0.9),
                                }}
                            >
                                {stripeErr}
                            </div>
                        )}
                    </div>

                    {/* ── Origen ── */}
                    <div
                        className="mi-card"
                        style={{ padding: 16, marginBottom: 16 }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: hx(GOLD, 0.8),
                                marginBottom: 10,
                            }}
                        >
                            Origen · {datosOrigen.email}
                        </div>
                        <div
                            style={{
                                fontSize: 12.5,
                                color: hx("#ffffff", 0.6),
                                marginBottom: 12,
                            }}
                        >
                            {datosOrigen.perfil
                                ? `${datosOrigen.perfil.full_name || "Sin nombre"} · cuenta creada`
                                : "Sin cuenta en la app (solo pagó)"}
                            {" · "}
                            {datosOrigen.compras || 0} compra
                            {(datosOrigen.compras || 0) === 1 ? "" : "s"}
                        </div>

                        {(datosOrigen.subs || []).length === 0 ? (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: hx("#ffffff", 0.4),
                                }}
                            >
                                Este correo no tiene ninguna suscripción.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                {(datosOrigen.subs as any[]).map((s) => {
                                    const activa =
                                        s.status === "active" ||
                                        s.status === "trialing"
                                    return (
                                        <div
                                            key={s.id}
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                border: `1px solid ${hx(
                                                    activa ? VERDE : "#ffffff",
                                                    activa ? 0.3 : 0.1
                                                )}`,
                                                background: hx("#ffffff", 0.03),
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: 10,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13.5,
                                                        fontWeight: 700,
                                                        color: activa
                                                            ? VERDE
                                                            : hx(
                                                                  "#ffffff",
                                                                  0.5
                                                              ),
                                                    }}
                                                >
                                                    {s.group_name || "—"} ·{" "}
                                                    {s.status}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 11.5,
                                                        color: hx(
                                                            "#ffffff",
                                                            0.45
                                                        ),
                                                    }}
                                                >
                                                    hasta{" "}
                                                    {fmtFecha(
                                                        s.current_period_end
                                                    )}
                                                </span>
                                                <div style={{ flex: 1 }} />
                                                {confirmar === s.id ? (
                                                    <>
                                                        <button
                                                            className="mi-btn"
                                                            disabled={moviendo}
                                                            onClick={() =>
                                                                transferir(s.id)
                                                            }
                                                            style={{
                                                                borderColor:
                                                                    hx(
                                                                        ROJO,
                                                                        0.6
                                                                    ),
                                                                color: "#fff",
                                                                background: hx(
                                                                    ROJO,
                                                                    0.22
                                                                ),
                                                            }}
                                                        >
                                                            {moviendo
                                                                ? "Moviendo…"
                                                                : `Sí, mover a ${destino.trim()}`}
                                                        </button>
                                                        <button
                                                            className="mi-btn"
                                                            onClick={() =>
                                                                setConfirmar("")
                                                            }
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="mi-btn"
                                                        disabled={
                                                            destino.trim()
                                                                .length < 3
                                                        }
                                                        onClick={() =>
                                                            setConfirmar(s.id)
                                                        }
                                                        style={{
                                                            borderColor: hx(
                                                                GOLD,
                                                                0.5
                                                            ),
                                                            color: GOLD,
                                                        }}
                                                    >
                                                        ⇄ Transferir ésta
                                                    </button>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    marginTop: 6,
                                                    color: hx("#ffffff", 0.33),
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {s.stripe_subscription_id} ·{" "}
                                                {s.stripe_customer_id}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Motivo — queda en el libro mayor */}
                        <div style={{ marginTop: 12 }}>
                            <input
                                className="mi-input"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Motivo (queda en la bitácora)"
                                style={{ width: "100%", fontSize: 12.5 }}
                            />
                        </div>
                    </div>

                    {/* ── Pagos reales del origen ── */}
                    <div
                        className="mi-card"
                        style={{ padding: 16, marginBottom: 16 }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: hx("#ffffff", 0.45),
                                marginBottom: 10,
                            }}
                        >
                            Pagos reales de este correo
                        </div>
                        {(datosOrigen.pagos || []).length === 0 ? (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: hx("#ffffff", 0.4),
                                }}
                            >
                                Sin pagos registrados.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {(datosOrigen.pagos as any[]).map((p) => (
                                    <div
                                        key={p.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: 10,
                                            fontSize: 12.5,
                                            padding: "8px 11px",
                                            borderRadius: 10,
                                            background: hx("#ffffff", 0.03),
                                            color: hx("#ffffff", 0.7),
                                        }}
                                    >
                                        <strong style={{ color: "#fff" }}>
                                            {fmtDinero(
                                                p.amount_cents,
                                                p.currency
                                            )}
                                        </strong>
                                        <span>{p.description || "—"}</span>
                                        <span
                                            style={{
                                                color: hx("#ffffff", 0.42),
                                            }}
                                        >
                                            {fmtFecha(p.paid_at)}
                                        </span>
                                        <div style={{ flex: 1 }} />
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: hx("#ffffff", 0.33),
                                                wordBreak: "break-all",
                                            }}
                                        >
                                            {p.stripe_invoice_id || "—"}
                                        </span>
                                        {p.stripe_hosted_invoice_url && (
                                            <a
                                                href={
                                                    p.stripe_hosted_invoice_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    fontSize: 11.5,
                                                    color: AC,
                                                }}
                                            >
                                                recibo ↗
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cargos de Stripe con su tarjeta */}
                        {stripe &&
                            Object.keys(stripe.cargos || {}).map((cid) => (
                                <div key={cid} style={{ marginTop: 12 }}>
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            color: hx("#ffffff", 0.35),
                                            marginBottom: 6,
                                        }}
                                    >
                                        Stripe · {cid}
                                    </div>
                                    {(stripe.cargos[cid] || []).map(
                                        (c: any) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: 10,
                                                    fontSize: 12.5,
                                                    padding: "7px 11px",
                                                    marginBottom: 5,
                                                    borderRadius: 10,
                                                    background:
                                                        d4 &&
                                                        c.last4 === d4
                                                            ? hx(VERDE, 0.1)
                                                            : hx(
                                                                  "#ffffff",
                                                                  0.03
                                                              ),
                                                    color: hx("#ffffff", 0.68),
                                                }}
                                            >
                                                <strong
                                                    style={{ color: "#fff" }}
                                                >
                                                    {fmtDinero(
                                                        c.monto,
                                                        c.moneda
                                                    )}
                                                </strong>
                                                <span>
                                                    {c.brand || "tarjeta"} ····{" "}
                                                    {c.last4 || "----"}
                                                </span>
                                                <span
                                                    style={{
                                                        color: hx(
                                                            "#ffffff",
                                                            0.42
                                                        ),
                                                    }}
                                                >
                                                    {fmtFecha(c.fecha)}
                                                </span>
                                                {c.reembolsado && (
                                                    <span
                                                        style={{ color: ROJO }}
                                                    >
                                                        reembolsado
                                                    </span>
                                                )}
                                                <div style={{ flex: 1 }} />
                                                {c.recibo_url && (
                                                    <a
                                                        href={c.recibo_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{
                                                            fontSize: 11.5,
                                                            color: AC,
                                                        }}
                                                    >
                                                        recibo ↗
                                                    </a>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                    </div>

                    {/* ── Destino ── */}
                    {destino.trim().length > 2 && (
                        <div
                            className="mi-card"
                            style={{ padding: 16, marginBottom: 16 }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: hx(AC, 0.8),
                                    marginBottom: 10,
                                }}
                            >
                                Destino · {destino.trim().toLowerCase()}
                            </div>
                            {!datosDestino ? (
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: hx("#ffffff", 0.4),
                                    }}
                                >
                                    Busca para verificarlo.
                                </p>
                            ) : datosDestino.perfil ? (
                                <div
                                    style={{
                                        fontSize: 13,
                                        lineHeight: 1.7,
                                        color: hx("#ffffff", 0.7),
                                    }}
                                >
                                    <span style={{ color: VERDE }}>
                                        ✓ Tiene cuenta creada
                                    </span>{" "}
                                    ·{" "}
                                    {datosDestino.perfil.full_name ||
                                        "Sin nombre"}
                                    <br />
                                    {(datosDestino.subs || []).length} suscripción
                                    {(datosDestino.subs || []).length === 1
                                        ? ""
                                        : "es"}{" "}
                                    ya en este correo
                                </div>
                            ) : (
                                <div
                                    style={{
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: hx(ROJO, 0.95),
                                    }}
                                >
                                    ✗ Este correo NO tiene cuenta creada. Pídele
                                    que entre a la app y la cree con ESE correo
                                    antes de mover nada, o el acceso se iría a
                                    la nada.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   BitacoraView — el libro mayor de lo que el panel hizo.
   ════════════════════════════════════════════════════════════════════ */
function BitacoraView({ url, apiKey }: { url: string; apiKey: string }) {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(
        async (force = false) => {
            setLoading(true)
            try {
                const res: any = await adminActionCached(
                    url,
                    apiKey,
                    "admin_soporte_bitacora",
                    { p_limit: 200 },
                    { force }
                )
                setRows(Array.isArray(res) ? res : [])
            } catch {
                setRows([])
            }
            setLoading(false)
        },
        [url, apiKey]
    )

    useEffect(() => {
        void load()
    }, [load])

    const ACCION_LABEL: Record<string, string> = {
        transferir_suscripcion: "⇄ Transferencia de suscripción",
        cambiar_estado: "· Cambio de estado",
    }

    return (
        <div>
            <div
                className="mi-card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    marginBottom: 16,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        color: hx("#ffffff", 0.5),
                        lineHeight: 1.6,
                    }}
                >
                    Todo lo que el panel hizo, con quién y cuándo. No se puede
                    borrar desde aquí.
                </div>
                <div style={{ flex: 1 }} />
                <button className="mi-btn" onClick={() => void load(true)}>
                    ↻ Recargar
                </button>
            </div>

            {loading ? (
                <p className="mi-muted" style={{ color: hx("#ffffff", 0.45) }}>
                    Cargando…
                </p>
            ) : rows.length === 0 ? (
                <p style={{ fontSize: 13, color: hx("#ffffff", 0.4) }}>
                    Todavía no hay movimientos.
                </p>
            ) : (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    {rows.map((r) => {
                        const d = r.detalle || {}
                        const esTransfer = r.action === "transferir_suscripcion"
                        return (
                            <div
                                key={r.id}
                                className="mi-card"
                                style={{
                                    padding: 13,
                                    borderLeft: `3px solid ${hx(
                                        esTransfer ? GOLD : "#ffffff",
                                        esTransfer ? 0.6 : 0.12
                                    )}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: esTransfer
                                                ? GOLD
                                                : hx("#ffffff", 0.7),
                                        }}
                                    >
                                        {ACCION_LABEL[r.action] || r.action}
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: hx("#ffffff", 0.35),
                                        }}
                                    >
                                        {r.admin_nombre || "Arquitecto"} ·{" "}
                                        {fmtFecha(r.created_at)}
                                    </span>
                                </div>
                                {esTransfer && (
                                    <div
                                        style={{
                                            fontSize: 12.5,
                                            marginTop: 6,
                                            lineHeight: 1.6,
                                            color: hx("#ffffff", 0.68),
                                        }}
                                    >
                                        {d.de} → {d.a}
                                        {d.group_name
                                            ? ` · ${d.group_name}`
                                            : ""}
                                        {d.motivo ? ` · ${d.motivo}` : ""}
                                    </div>
                                )}
                                {!esTransfer && d.status && (
                                    <div
                                        style={{
                                            fontSize: 12.5,
                                            marginTop: 6,
                                            color: hx("#ffffff", 0.6),
                                        }}
                                    >
                                        {d.status}
                                        {d.nota ? ` · ${d.nota}` : ""}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   SoporteHub — las tres sub-pestañas.
   ════════════════════════════════════════════════════════════════════ */
type SubTab = "casos" | "transferir" | "bitacora"

export function SoporteHub({
    url,
    apiKey,
}: {
    url: string
    apiKey: string
}) {
    const [tab, setTab] = useState<SubTab>("casos")
    const [semilla, setSemilla] = useState<any>(null)

    const abrirTransferencia = (t: Ticket) => {
        const f = t.fields || {}
        setSemilla({
            origen: f.correo_pago || "",
            destino: t.email || "",
            ultimos4: f.ultimos4 || "",
            recibo: f.recibo || "",
            ticketId: t.id,
        })
        setTab("transferir")
    }

    const TABS: { id: SubTab; label: string }[] = [
        { id: "casos", label: "Casos" },
        { id: "transferir", label: "Transferir suscripción" },
        { id: "bitacora", label: "Bitácora" },
    ]

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 18,
                }}
            >
                {TABS.map((x) => (
                    <Pill
                        key={x.id}
                        activo={tab === x.id}
                        color={x.id === "transferir" ? GOLD : AC}
                        onClick={() => {
                            if (x.id !== "transferir") setSemilla(null)
                            setTab(x.id)
                        }}
                    >
                        {x.label}
                    </Pill>
                ))}
            </div>

            {tab === "casos" ? (
                <CasosView
                    url={url}
                    apiKey={apiKey}
                    onTransferir={abrirTransferencia}
                />
            ) : tab === "transferir" ? (
                <TransferirView
                    url={url}
                    apiKey={apiKey}
                    inicial={semilla}
                />
            ) : (
                <BitacoraView url={url} apiKey={apiKey} />
            )}
        </div>
    )
}

/* 🜂 REGLA FRAMER — cada Code File default-exporta un componente React
   renderable con body JSX. El objeto de utilidades cuelga de él. */
function MISoporteShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MISoporteShell.displayName = "MI_Soporte"

const SoporteMod = Object.assign(MISoporteShell, {
    SoporteHub,
    CASOS_ADMIN,
})

export default SoporteMod
