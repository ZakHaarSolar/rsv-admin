// Red Solar Viva — EscaneoRelampago.tsx v1.1 (La intención sellada ahora es opcional — se puede anclar el escaneo sin texto (label marcado "opcional", textarea sin validación mínima). Atajo Cmd/Ctrl+Enter en el step de intención dispara el anclaje directo.)
// Widget de Ignición 1:1 que vive dentro de MiNúcleo (tab SESIONES).
//
// Flujo quirúrgico (Lightning Bolt):
//   1. Recibe las citas 1:1 del tripulante desde el padre.
//   2. Para cada cita confirmada, renderiza una card con:
//        · fecha/hora del encuentro
//        · enlace Zoom
//        · Si no tiene escaneo → 3 preguntas dinámicas + campo de intención.
//        · Si ya tiene escaneo → estado "Sintonización Completada" con recap.
//   3. Las preguntas vienen del RPC `get_preguntas_1a1_activas`.
//   4. El sellado llama a `upsert_escaneo_relampago` (valida ownership vs clerk_user_id).
//
// Default export por la regla Framer de named-export-roto.

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/* ════════════════════════════════════════════════════════════════
   Tipos
   ════════════════════════════════════════════════════════════════ */
interface Pregunta {
    id: string
    orden: number
    pregunta_texto: string
    opciones: string[]
    plano_label?: string | null
}
interface Cita {
    reserva_id: string
    status: string
    confirmed_at?: string | null
    name?: string | null
    email?: string | null
    zoom_join_url: string | null
    zoom_meeting_id: string | null
    zoom_password: string | null
    escaneo_resultado: Record<string, any> | null
    intencion_texto: string | null
    escaneo_completado_at: string | null
    slot_id: string
    slot_type: string
    start_time: string
    end_time: string
}

/* ════════════════════════════════════════════════════════════════
   RPC helper
   ════════════════════════════════════════════════════════════════ */
async function sbRpc(url: string, key: string, fn: string, params: any) {
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

/* ════════════════════════════════════════════════════════════════
   Formato / utilidades
   ════════════════════════════════════════════════════════════════ */
function formatCoord(iso: string): { fecha: string; hora: string } {
    try {
        const d = new Date(iso)
        return {
            fecha: d.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
            }),
            hora: d.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        }
    } catch {
        return { fecha: iso, hora: "" }
    }
}
function slotLabel(t: string): string {
    if (t === "individual_30") return "30 minutos"
    if (t === "individual_45") return "45 minutos"
    if (t === "individual_60") return "60 minutos"
    return t
}

/* ════════════════════════════════════════════════════════════════
   CSS — glass minimal, coherente con MiNucleo (.nuc-*)
   ════════════════════════════════════════════════════════════════ */
const ER_CSS = String.raw`
.er-card {
    position: relative;
    background: linear-gradient(165deg, rgba(5,15,30,0.72) 0%, rgba(2,8,20,0.86) 100%);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border: 1px solid rgba(0,194,255,0.22);
    border-radius: 22px;
    padding: 28px 30px;
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.er-card:hover { border-color: rgba(0,194,255,0.38); box-shadow: 0 0 30px rgba(0,194,255,0.07); }
.er-card-sealed {
    border-color: rgba(200,164,78,0.35);
    background: linear-gradient(165deg, rgba(24,18,8,0.72) 0%, rgba(12,10,5,0.86) 100%);
}
.er-card-sealed:hover { border-color: rgba(200,164,78,0.52); box-shadow: 0 0 30px rgba(200,164,78,0.10); }

.er-label {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(0,194,255,0.78);
}
.er-label-gold {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(212,168,67,0.88);
}
.er-title {
    font-size: 26px;
    font-weight: 300;
    letter-spacing: 0.01em;
    color: #ECD8A8;
    line-height: 1.15;
    margin-top: 6px;
}
.er-coord {
    font-size: 13px;
    font-weight: 400;
    color: rgba(232,238,247,0.78);
    letter-spacing: 0.02em;
    text-transform: capitalize;
}
.er-coord-hour {
    font-size: 16px;
    font-weight: 500;
    color: #E8EEF7;
    font-feature-settings: "tnum";
    letter-spacing: 0.04em;
}
.er-zoom-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid rgba(0,194,255,0.30);
    background: rgba(0,194,255,0.06);
    color: #00C2FF;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.25s ease;
}
.er-zoom-btn:hover { background: rgba(0,194,255,0.14); border-color: rgba(0,194,255,0.50); box-shadow: 0 0 12px rgba(0,194,255,0.15); }

.er-step-dots {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
}
.er-dot {
    width: 26px;
    height: 4px;
    border-radius: 3px;
    background: rgba(0,194,255,0.14);
    transition: all 0.35s ease;
}
.er-dot-on {
    background: linear-gradient(90deg, #00E5FF 0%, rgba(0,229,255,0.4) 100%);
    box-shadow: 0 0 10px rgba(0,229,255,0.45);
}
.er-dot-done {
    background: linear-gradient(90deg, #D4A843 0%, rgba(212,168,67,0.3) 100%);
    box-shadow: 0 0 8px rgba(212,168,67,0.35);
}

.er-q-plane {
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(212,168,67,0.82);
    text-align: center;
}
.er-q-text {
    text-align: center;
    font-size: 22px;
    font-weight: 300;
    line-height: 1.36;
    color: #E8EEF7;
    letter-spacing: 0.01em;
    margin-top: 10px;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
}
.er-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 28px;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
}
.er-opt {
    all: unset;
    cursor: pointer;
    display: block;
    padding: 16px 22px;
    text-align: center;
    border-radius: 14px;
    border: 1px solid rgba(0,194,255,0.22);
    background: linear-gradient(135deg, rgba(0,194,255,0.04) 0%, rgba(0,100,180,0.05) 100%);
    color: rgba(232,238,247,0.9);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.02em;
    transition: all 0.3s ease;
}
.er-opt:hover {
    border-color: rgba(0,194,255,0.52);
    background: linear-gradient(135deg, rgba(0,194,255,0.10) 0%, rgba(0,100,180,0.10) 100%);
    box-shadow: 0 0 18px rgba(0,194,255,0.12);
    transform: translateY(-1px);
}
.er-opt-on {
    border-color: rgba(200,164,78,0.52);
    background: linear-gradient(135deg, rgba(200,164,78,0.12) 0%, rgba(140,100,40,0.10) 100%);
    color: #ECD8A8;
    box-shadow: 0 0 18px rgba(200,164,78,0.20);
}

.er-textarea {
    width: 100%;
    min-height: 88px;
    max-height: 180px;
    padding: 14px 18px;
    border-radius: 14px;
    background: rgba(0,0,0,0.32);
    border: 1px solid rgba(0,194,255,0.22);
    color: #E8EEF7;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    font-weight: 300;
    line-height: 1.62;
    letter-spacing: 0.01em;
    resize: vertical;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.er-textarea:focus {
    border-color: rgba(0,194,255,0.55);
    box-shadow: 0 0 18px rgba(0,194,255,0.14);
}
.er-textarea::placeholder { color: rgba(180,200,220,0.32); font-style: italic; }

.er-cta {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 32px;
    border-radius: 12px;
    background: linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%);
    color: #0B0C13;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    box-shadow: 0 4px 22px rgba(200,164,78,0.30);
    transition: all 0.3s ease;
}
.er-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 30px rgba(200,164,78,0.45); }
.er-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.er-back {
    all: unset;
    cursor: pointer;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(180,200,220,0.55);
    transition: color 0.2s ease;
}
.er-back:hover { color: rgba(0,194,255,0.8); }

.er-recap-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(232,238,247,0.06);
}
.er-recap-row:last-child { border-bottom: none; }

.er-sparkle {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
    animation: er-sparkle 2.2s ease-in-out infinite;
}
@keyframes er-sparkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.72); }
}

@keyframes er-bolt {
    0%   { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
    48%  { clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%); opacity: 0.7; }
    52%  { clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%); opacity: 0.0; }
    100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
}

.er-bolt-flash {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0) 100%);
    animation: er-flash 0.45s ease-out;
    opacity: 0;
}
@keyframes er-flash {
    0% { opacity: 0; }
    40% { opacity: 1; }
    100% { opacity: 0; }
}
`

/* Inyector CSS (one-off por mount del widget) */
function useInjectCss() {
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-escaneo-relampago-css-v1"
        if (document.getElementById(id)) return
        const s = document.createElement("style")
        s.id = id
        s.textContent = ER_CSS
        document.head.appendChild(s)
    }, [])
}

/* ════════════════════════════════════════════════════════════════
   Flujo de Escaneo — 3 preguntas + intención
   ════════════════════════════════════════════════════════════════ */
function FlujoEscaneo({
    cita,
    preguntas,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    onSellado,
}: {
    cita: Cita
    preguntas: Pregunta[]
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    onSellado: () => void
}) {
    const [step, setStep] = useState(0) // 0..N-1 preguntas, N intención
    const [respuestas, setRespuestas] = useState<Record<string, string>>({})
    const [intencion, setIntencion] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [flash, setFlash] = useState(0) // contador que fuerza rerender del flash

    const totalSteps = preguntas.length + 1

    const seleccionar = useCallback(
        (orden: number, opcion: string) => {
            setRespuestas((prev) => ({
                ...prev,
                [`q${orden}`]: opcion,
            }))
            setFlash((f) => f + 1)
            // transición lightning
            setTimeout(() => {
                setStep((prev) => Math.min(prev + 1, totalSteps - 1))
            }, 260)
        },
        [totalSteps]
    )

    const sellar = useCallback(async () => {
        if (!clerkUserId || !cita.reserva_id) return
        setEnviando(true)
        setError(null)
        const escaneo: Record<string, any> = {
            ...respuestas,
            preguntas_meta: preguntas.map((p) => ({
                orden: p.orden,
                pregunta: p.pregunta_texto,
                plano_label: p.plano_label || null,
                opcion: respuestas[`q${p.orden}`] || null,
            })),
        }
        const r = await sbRpc(supabaseUrl, supabaseAnonKey, "upsert_escaneo_relampago", {
            p_clerk_user_id: clerkUserId,
            p_reserva_id: cita.reserva_id,
            p_escaneo: escaneo,
            p_intencion: intencion,
        })
        setEnviando(false)
        if (r?.success) {
            setFlash((f) => f + 1)
            setTimeout(onSellado, 380)
        } else {
            setError(
                r?.detail ||
                    "No pude anclar tu intención. Intentá de nuevo en unos segundos."
            )
        }
    }, [
        clerkUserId,
        cita.reserva_id,
        respuestas,
        intencion,
        preguntas,
        supabaseUrl,
        supabaseAnonKey,
        onSellado,
    ])

    const preguntaActual = preguntas[step]
    const enIntencion = step === preguntas.length
    const opcionActual = preguntaActual
        ? respuestas[`q${preguntaActual.orden}`]
        : null

    /* Atajo Cmd/Ctrl+Enter en el step de intención dispara el anclaje.
       Solo activo cuando el flujo está en el paso final y no estamos
       ya enviando — evita dobles requests si el user spamea el shortcut. */
    useEffect(() => {
        if (!enIntencion) return
        const handler = (e: KeyboardEvent) => {
            if (
                e.key === "Enter" &&
                (e.metaKey || e.ctrlKey) &&
                !enviando
            ) {
                e.preventDefault()
                sellar()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [enIntencion, enviando, sellar])

    return (
        <div style={{ position: "relative" }}>
            {/* Step dots */}
            <div className="er-step-dots">
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const done = i < step
                    const on = i === step
                    return (
                        <div
                            key={i}
                            className={`er-dot ${
                                done
                                    ? "er-dot-done"
                                    : on
                                    ? "er-dot-on"
                                    : ""
                            }`}
                        />
                    )
                })}
            </div>

            <AnimatePresence mode="wait">
                {!enIntencion && preguntaActual && (
                    <motion.div
                        key={`q-${preguntaActual.orden}-${flash}`}
                        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                        transition={{
                            duration: 0.38,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {preguntaActual.plano_label && (
                            <div className="er-q-plane">
                                {preguntaActual.plano_label}
                            </div>
                        )}
                        <div className="er-q-text">
                            {preguntaActual.pregunta_texto}
                        </div>
                        <div className="er-options">
                            {preguntaActual.opciones.map((op, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`er-opt ${
                                        opcionActual === op
                                            ? "er-opt-on"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        seleccionar(
                                            preguntaActual.orden,
                                            op
                                        )
                                    }
                                >
                                    {op}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {enIntencion && (
                    <motion.div
                        key="intencion"
                        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                        transition={{
                            duration: 0.42,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <div className="er-q-plane">
                            Plano de Intención · Sella el Vector
                        </div>
                        <div className="er-q-text">
                            Sella tu intención en una frase{" "}
                            <span
                                style={{
                                    fontSize: 14,
                                    color: "rgba(180,200,220,0.55)",
                                    letterSpacing: "0.04em",
                                    fontWeight: 300,
                                }}
                            >
                                (opcional)
                            </span>
                        </div>
                        <div
                            style={{
                                maxWidth: 560,
                                margin: "24px auto 0",
                            }}
                        >
                            <textarea
                                className="er-textarea"
                                value={intencion}
                                onChange={(e) =>
                                    setIntencion(e.target.value)
                                }
                                placeholder="Ej. Vengo a recalibrar mi vector de expansión con precisión quirúrgica..."
                                maxLength={320}
                                disabled={enviando}
                            />
                            <div
                                style={{
                                    marginTop: 8,
                                    textAlign: "right",
                                    fontSize: 10,
                                    color: "rgba(180,200,220,0.4)",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {intencion.length} / 320
                            </div>

                            {error && (
                                <div
                                    style={{
                                        marginTop: 10,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        background: "rgba(255,180,120,0.06)",
                                        border: "1px solid rgba(255,180,120,0.22)",
                                        color: "rgba(255,200,140,0.88)",
                                        fontSize: 12,
                                        textAlign: "center",
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <div
                                style={{
                                    marginTop: 26,
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    className="er-back"
                                    onClick={() =>
                                        setStep(
                                            Math.max(0, preguntas.length - 1)
                                        )
                                    }
                                    disabled={enviando}
                                >
                                    ← Revisar respuestas
                                </button>
                                <button
                                    type="button"
                                    className="er-cta"
                                    onClick={sellar}
                                    disabled={enviando}
                                >
                                    {enviando
                                        ? "Anclando..."
                                        : "Anclar Intención"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {step > 0 && !enIntencion && (
                <div
                    style={{
                        marginTop: 22,
                        textAlign: "center",
                    }}
                >
                    <button
                        type="button"
                        className="er-back"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                    >
                        ← Sonda anterior
                    </button>
                </div>
            )}

            {flash > 0 && (
                <div
                    className="er-bolt-flash"
                    style={{ animationName: flash % 2 === 0 ? "er-flash" : "er-flash" }}
                    key={flash}
                />
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Vista de cita sellada (recap)
   ════════════════════════════════════════════════════════════════ */
function ReciboSellado({
    cita,
    preguntas,
}: {
    cita: Cita
    preguntas: Pregunta[]
}) {
    const escaneo = (cita.escaneo_resultado || {}) as Record<string, any>
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                    color: "#D4A843",
                    textShadow: "0 0 8px rgba(212,168,67,0.35)",
                }}
            >
                <span className="er-sparkle" />
                <span
                    style={{
                        fontSize: 11.5,
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                    }}
                >
                    Sintonización completada
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
                {preguntas.map((p) => {
                    const respuesta =
                        escaneo[`q${p.orden}`] ||
                        escaneo[`pregunta_${p.orden}`] ||
                        null
                    if (!respuesta) return null
                    return (
                        <div key={p.orden} className="er-recap-row">
                            <div
                                style={{
                                    fontSize: 10,
                                    letterSpacing: "0.24em",
                                    textTransform: "uppercase",
                                    color: "rgba(212,168,67,0.72)",
                                }}
                            >
                                {p.plano_label || `Pregunta ${p.orden}`}
                            </div>
                            <div
                                style={{
                                    marginTop: 2,
                                    fontSize: 11.5,
                                    color: "rgba(180,200,220,0.55)",
                                    lineHeight: 1.5,
                                }}
                            >
                                {p.pregunta_texto}
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#ECD8A8",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {respuesta}
                            </div>
                        </div>
                    )
                })}
            </div>

            {cita.intencion_texto && (
                <div
                    style={{
                        marginTop: 18,
                        padding: "14px 18px",
                        borderRadius: 12,
                        background:
                            "linear-gradient(135deg, rgba(200,164,78,0.10) 0%, rgba(200,164,78,0.02) 100%)",
                        border: "1px solid rgba(200,164,78,0.30)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(212,168,67,0.82)",
                        }}
                    >
                        Tu intención sellada
                    </div>
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 14.5,
                            fontStyle: "italic",
                            fontWeight: 300,
                            lineHeight: 1.6,
                            color: "#F5E5C4",
                        }}
                    >
                        «{cita.intencion_texto}»
                    </div>
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Card de cita 1:1 con flujo
   ════════════════════════════════════════════════════════════════ */
function CitaCard({
    cita,
    preguntas,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    onSellado,
}: {
    cita: Cita
    preguntas: Pregunta[]
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    onSellado: () => void
}) {
    const { fecha, hora } = formatCoord(cita.start_time)
    const sellado = !!cita.escaneo_completado_at

    return (
        <div
            className={`er-card ${sellado ? "er-card-sealed" : ""}`}
            style={{ overflow: "hidden" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 18,
                    flexWrap: "wrap",
                    marginBottom: 22,
                }}
            >
                <div>
                    <div className={sellado ? "er-label-gold" : "er-label"}>
                        {sellado
                            ? "Cámara de Resonancia · Sellada"
                            : "Cámara de Resonancia · Agendada"}
                    </div>
                    <div className="er-title" style={{ fontSize: 22 }}>
                        {slotLabel(cita.slot_type)} con Zak'Haar
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <div className="er-coord">{fecha}</div>
                        <div className="er-coord-hour" style={{ marginTop: 2 }}>
                            {hora} hrs
                        </div>
                    </div>
                </div>
                {cita.zoom_join_url && (
                    <a
                        href={cita.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="er-zoom-btn"
                    >
                        Abrir sala Zoom →
                    </a>
                )}
            </div>

            {sellado ? (
                <ReciboSellado cita={cita} preguntas={preguntas} />
            ) : (
                <>
                    <div
                        style={{
                            marginTop: 6,
                            marginBottom: 18,
                            fontSize: 12.5,
                            lineHeight: 1.6,
                            color: "rgba(200,215,235,0.68)",
                            textAlign: "center",
                            maxWidth: 520,
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        Antes de la sesión, sintonizá tu frecuencia. Tres sondas
                        + el sello de tu intención le permiten al Arquitecto
                        entrar directo al grano electromagnético de tu campo.
                    </div>
                    <FlujoEscaneo
                        cita={cita}
                        preguntas={preguntas}
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkUserId={clerkUserId}
                        onSellado={onSellado}
                    />
                </>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Componente raíz (default export)
   ════════════════════════════════════════════════════════════════ */
function EscaneoRelampago({
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    citas,
    onCitasActualizadas,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string | null
    citas: Cita[] | null
    onCitasActualizadas?: () => void
}) {
    useInjectCss()
    const [preguntas, setPreguntas] = useState<Pregunta[]>([])
    const [loadingQs, setLoadingQs] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const r = await sbRpc(
                supabaseUrl,
                supabaseAnonKey,
                "get_preguntas_1a1_activas",
                {}
            )
            if (!cancelled && Array.isArray(r)) {
                setPreguntas(r as Pregunta[])
            }
            if (!cancelled) setLoadingQs(false)
        })()
        return () => {
            cancelled = true
        }
    }, [supabaseUrl, supabaseAnonKey])

    if (!clerkUserId) return null

    if (citas === null || loadingQs) {
        return (
            <div className="er-card" style={{ textAlign: "center" }}>
                <div className="er-label">Sintonizando tus ciclos</div>
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(180,200,220,0.55)",
                    }}
                >
                    Cargando preguntas y coordenadas temporales...
                </div>
            </div>
        )
    }

    if (citas.length === 0) return null

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
            }}
        >
            {citas.map((c) => (
                <CitaCard
                    key={c.reserva_id}
                    cita={c}
                    preguntas={preguntas}
                    supabaseUrl={supabaseUrl}
                    supabaseAnonKey={supabaseAnonKey}
                    clerkUserId={clerkUserId}
                    onSellado={() => onCitasActualizadas?.()}
                />
            ))}
        </div>
    )
}

export default EscaneoRelampago
