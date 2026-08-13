import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// --- TIPOS ---
type TweetStatus = "pending" | "sending" | "sent" | "error"

interface QueueItem {
    id: string
    text: string
    image: File | null
    previewUrl?: string
    scheduledTime: number // Timestamp
    status: TweetStatus
    errorMsg?: string
}

type Props = {
    // Visual
    speed: number
    fontSize: number
    rainIntensity: number
    headGlow: number
    matrixHue: number
    bg: string

    // Panel
    showPanel: boolean
    apiEndpoint: string
    charLimit: number
    autoClear: boolean
    showCounter: number | boolean
    textAreaMinHeight: number
    panelBottom: number

    // Overlay
    showAccessOverlay: boolean
    overlayMessage: string
    overlaySub: string
    overlayDuration: number
    overlayOncePerSession: boolean
}

// Constante: 1 hora 30 minutos en milisegundos
// 1h = 3600s, 30m = 1800s -> Total 5400s * 1000
const INTERVAL_MS = 90 * 60 * 1000

export default function MatrixTerminalTweet({
    speed,
    fontSize,
    rainIntensity,
    headGlow,
    matrixHue,
    bg,
    textAreaMinHeight,
    panelBottom,
    showPanel,
    apiEndpoint,
    charLimit,
    autoClear,
    showCounter,
    showAccessOverlay,
    overlayMessage,
    overlaySub,
    overlayDuration,
    overlayOncePerSession,
}: Props) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rafRef = React.useRef<number | null>(null)

    // ---- STATE ----
    const [mode, setMode] = React.useState<"direct" | "queue">("direct")

    // Inputs actuales
    const [text, setText] = React.useState("")
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(
        undefined
    )

    // Estado de envío DIRECTO
    const [directSending, setDirectSending] = React.useState(false)
    const [status, setStatus] = React.useState<null | {
        ok: boolean
        msg: string
    }>(null)

    // LA COLA (QUEUE)
    const [queue, setQueue] = React.useState<QueueItem[]>([])

    const inputRef = React.useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = React.useState(false)

    // ---- HELPER: Manejo de Archivos ----
    const acceptFile = (f: File | null) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setImageFile(f)
        setPreviewUrl(f ? URL.createObjectURL(f) : undefined)
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null
        if (f && f.type && !f.type.startsWith("image/")) return
        acceptFile(f)
    }

    const onDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0] || null
        if (f && f.type && !f.type.startsWith("image/")) return
        acceptFile(f)
    }

    // ---- FUNCIÓN DE ENVÍO CORE (Refactorizada) ----
    // Ahora acepta parámetros opcionales. Si no se pasan, usa el estado actual (modo directo).
    async function performEmit(
        tweetText: string,
        tweetImg: File | null
    ): Promise<{ ok: boolean; id?: string; error?: string }> {
        const base = (apiEndpoint || "/api/tweet")
            .trim()
            .replace(/\/?(?:tweet|tweet-with-image)$/, "")
        const urlText = `${base}/tweet`
        const urlImg = `${base}/tweet-with-image`

        try {
            if (tweetImg) {
                const fd = new FormData()
                fd.append("text", tweetText)
                fd.append("image", tweetImg, tweetImg.name)

                const r = await fetch(urlImg, { method: "POST", body: fd })
                const data = await r.json()
                if (!r.ok)
                    throw new Error(
                        typeof data?.error === "string"
                            ? data.error
                            : JSON.stringify(data)
                    )
                return { ok: true, id: data?.tweet?.id || "ok" }
            } else {
                const r = await fetch(urlText, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: tweetText }),
                })
                const data = await r.json()
                if (!r.ok)
                    throw new Error(
                        typeof data?.error === "string"
                            ? data.error
                            : JSON.stringify(data)
                    )
                return { ok: true, id: data?.tweet?.id || "ok" }
            }
        } catch (e: any) {
            return { ok: false, error: e.message || "Unknown error" }
        }
    }

    // ---- ENVÍO DIRECTO (Botón "EMIT") ----
    async function handleDirectEmit() {
        setDirectSending(true)
        setStatus(null)
        const res = await performEmit(text, imageFile)
        setDirectSending(false)

        if (res.ok) {
            setStatus({ ok: true, msg: `ACCESS GRANTED · ID ${res.id}` })
            if (autoClear) {
                setText("")
                setImageFile(null)
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(undefined)
                }
            }
        } else {
            setStatus({ ok: false, msg: `ACCESS DENIED · ${res.error}` })
        }
    }

    // ---- LOGICA DE COLA (QUEUE) ----

    // 1. Agregar a la cola
    const addToQueue = () => {
        if (!text.trim()) return

        // Calcular cuándo debe salir este tweet
        // Buscamos el último tweet pendiente o enviándose en la cola
        const pendingItems = queue.filter(
            (i) => i.status === "pending" || i.status === "sending"
        )
        const lastItem = pendingItems[pendingItems.length - 1]

        let scheduleTime = Date.now() // Por defecto: Ahora

        if (lastItem) {
            // Si hay uno anterior, programamos 1h 30m DESPUÉS de ese
            scheduleTime = lastItem.scheduledTime + INTERVAL_MS
        }
        // Nota: Si la cola está vacía, scheduleTime se queda en Date.now(),
        // así que el primero saldrá inmediatamente en el siguiente "tick".

        const newItem: QueueItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: text,
            image: imageFile,
            previewUrl: previewUrl, // Guardamos referencia visual (cuidado: blobs pueden expirar si recargas)
            scheduledTime: scheduleTime,
            status: "pending",
        }

        setQueue((prev) => [...prev, newItem])

        // Limpiar inputs para el siguiente
        setText("")
        setImageFile(null)
        setPreviewUrl(undefined) // No revocamos URL aun porque la usa la lista
    }

    // 2. Procesador de Cola (El Reloj)
    React.useEffect(() => {
        // Revisamos cada 5 segundos
        const timer = setInterval(async () => {
            const now = Date.now()

            // Buscar elementos que deban enviarse (status pending y hora pasada)
            // Procesamos UNO a la vez para evitar colisiones
            const itemToProcess = queue.find(
                (item) => item.status === "pending" && item.scheduledTime <= now
            )

            if (itemToProcess) {
                // Marcar como enviando
                setQueue((prev) =>
                    prev.map((i) =>
                        i.id === itemToProcess.id
                            ? { ...i, status: "sending" }
                            : i
                    )
                )

                // Ejecutar envío
                const res = await performEmit(
                    itemToProcess.text,
                    itemToProcess.image
                )

                // Actualizar estado final
                setQueue((prev) =>
                    prev.map((i) => {
                        if (i.id === itemToProcess.id) {
                            return {
                                ...i,
                                status: res.ok ? "sent" : "error",
                                errorMsg: res.error,
                            }
                        }
                        return i
                    })
                )
            }
        }, 5000)

        return () => clearInterval(timer)
    }, [queue, apiEndpoint]) // Dependencias: queue para leer la última versión

    // ---- MATRIX RAIN EFFECT (Visuals) ----
    React.useEffect(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext("2d")
        if (!ctx) return
        // ... (Tu código de lluvia Matrix original va aquí, lo mantengo igual para brevedad)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const resize = () => {
            const w = c.clientWidth
            const h = c.clientHeight
            c.width = Math.floor(w * dpr)
            c.height = Math.floor(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(c)
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        const glyphs = letters.split("")
        const state = { columns: 0, drops: [] as number[] }
        const initCols = () => {
            const w = c.clientWidth
            const cols = Math.max(1, Math.floor(w / Math.max(8, fontSize)))
            state.columns = cols
            state.drops = Array.from({ length: cols }, () =>
                Math.floor(Math.random() * 20)
            )
        }
        initCols()
        const col = (l: number) => `hsl(${matrixHue}, 100%, ${l}%)`
        const step = () => {
            const w = c.clientWidth
            const h = c.clientHeight
            ctx.fillStyle = "rgba(0,0,0,0.10)"
            ctx.fillRect(0, 0, w, h)
            ctx.font = `${fontSize}px monospace`
            ctx.textBaseline = "top"
            if (
                Math.max(1, Math.floor(w / Math.max(8, fontSize))) !==
                state.columns
            )
                initCols()
            for (let i = 0; i < state.columns; i++) {
                if (rainIntensity < 1 && Math.random() > Number(rainIntensity))
                    continue
                const x = i * fontSize
                const y = state.drops[i] * fontSize
                const ch = glyphs[(Math.random() * glyphs.length) | 0]
                ctx.fillStyle = col(55)
                ctx.fillText(ch, x, y)
                if (y > h && Math.random() > 0.975) state.drops[i] = 0
                else state.drops[i] += Math.max(0.5, Number(speed))
            }
            rafRef.current = requestAnimationFrame(step)
        }
        rafRef.current = requestAnimationFrame(step)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            ro.disconnect()
        }
    }, [speed, fontSize, rainIntensity, headGlow, matrixHue])

    // ---- OVERLAY LOGIC ----
    const [overlayVisible, setOverlayVisible] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false
        if (!showAccessOverlay) return false
        if (
            overlayOncePerSession &&
            typeof window !== "undefined" &&
            sessionStorage.getItem("matrix_access_overlay_shown") === "1"
        )
            return false
        return true
    })
    React.useEffect(() => {
        if (!overlayVisible) return
        const t = setTimeout(() => {
            setOverlayVisible(false)
            if (overlayOncePerSession)
                sessionStorage.setItem("matrix_access_overlay_shown", "1")
        }, overlayDuration)
        return () => clearTimeout(t)
    }, [overlayVisible])

    // ---- RENDER HELPERS ----
    const remaining =
        (typeof charLimit === "number" ? charLimit : 1000) - text.length
    const isInputDisabled =
        mode === "direct" ? directSending || !text.trim() : !text.trim() // En Queue no bloqueamos por sending

    // Función para formatear fecha de envío
    const formatTime = (ts: number) => {
        const d = new Date(ts)
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                background: bg,
                overflow: "hidden",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />

            {/* Scanline Overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                    backgroundSize: "100% 2px, 3px 100%",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {showPanel && (
                <motion.div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: panelBottom,
                        transform: "translateX(-50%)",
                        width: "min(900px, 92%)",
                        background: "rgba(0, 20, 0, 0.85)",
                        border: `1px solid hsla(${matrixHue}, 100%, 50%, 0.3)`,
                        boxShadow: `0 0 20px hsla(${matrixHue},100%,50%,0.15)`,
                        borderRadius: 8,
                        padding: 16,
                        zIndex: 10,
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {/* HEADER / MODE SWITCHER */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: `1px solid hsla(${matrixHue}, 100%, 50%, 0.2)`,
                            paddingBottom: 8,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                letterSpacing: 1.5,
                                color: `hsl(${matrixHue}, 100%, 70%)`,
                            }}
                        >
                            TERMINAL //{" "}
                            {mode === "direct"
                                ? "DIRECT_UPLINK"
                                : "AUTO_SCHEDULER"}
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                            {(["direct", "queue"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={{
                                        background:
                                            mode === m
                                                ? `hsla(${matrixHue}, 100%, 30%, 0.4)`
                                                : "transparent",
                                        border: `1px solid hsla(${matrixHue}, 100%, 50%, ${mode === m ? 0.6 : 0.1})`,
                                        color: `hsl(${matrixHue}, 100%, ${mode === m ? 90 : 50}%)`,
                                        padding: "4px 12px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {m === "direct"
                                        ? "INSTANT"
                                        : "QUEUE (1h30m)"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* INPUT AREA */}
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexDirection: "column",
                        }}
                    >
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                            placeholder={
                                mode === "queue"
                                    ? "> Añadir tweet a la secuencia..."
                                    : "> Escribir emisión directa..."
                            }
                            style={{
                                width: "100%",
                                minHeight: textAreaMinHeight,
                                padding: 12,
                                background: "rgba(0, 0, 0, 0.3)",
                                border: `1px solid hsla(${matrixHue}, 100%, 50%, 0.3)`,
                                color: `hsl(${matrixHue}, 100%, 80%)`,
                                fontFamily: "monospace",
                                fontSize: 16,
                                outline: "none",
                            }}
                        />

                        {/* FILE & ACTIONS */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                            }}
                        >
                            {/* File Input */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                <div
                                    onClick={() => inputRef.current?.click()}
                                    onDrop={onDropZoneDrop}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        setDragOver(true)
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    style={{
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        border: `1px dashed hsla(${matrixHue}, 100%, 50%, ${dragOver ? 0.8 : 0.3})`,
                                        color: `hsl(${matrixHue}, 100%, 70%)`,
                                        background: dragOver
                                            ? `hsla(${matrixHue}, 100%, 20%, 0.2)`
                                            : "transparent",
                                    }}
                                >
                                    {imageFile
                                        ? `[IMG: ${imageFile.name}]`
                                        : "[ + ADJUNTAR IMAGEN ]"}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    style={{ display: "none" }}
                                />

                                {previewUrl && (
                                    <div
                                        style={{
                                            position: "relative",
                                            width: 80,
                                        }}
                                    >
                                        <img
                                            src={previewUrl}
                                            style={{
                                                width: "100%",
                                                borderRadius: 4,
                                                border: `1px solid hsla(${matrixHue}, 100%, 50%, 0.3)`,
                                            }}
                                        />
                                        <div
                                            onClick={() => {
                                                setImageFile(null)
                                                setPreviewUrl(undefined)
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: -5,
                                                right: -5,
                                                background: "red",
                                                color: "white",
                                                width: 16,
                                                height: 16,
                                                borderRadius: "50%",
                                                fontSize: 10,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                            }}
                                        >
                                            x
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main Button */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    gap: 4,
                                }}
                            >
                                <button
                                    onClick={
                                        mode === "direct"
                                            ? handleDirectEmit
                                            : addToQueue
                                    }
                                    disabled={
                                        mode === "direct" && directSending
                                    }
                                    style={{
                                        padding: "10px 24px",
                                        background: `hsla(${matrixHue}, 100%, 25%, 0.6)`,
                                        border: `1px solid hsla(${matrixHue}, 100%, 60%, 0.5)`,
                                        color: "white",
                                        cursor: "pointer",
                                        fontFamily: "monospace",
                                        fontSize: 14,
                                        textTransform: "uppercase",
                                        boxShadow: `0 0 10px hsla(${matrixHue}, 100%, 50%, 0.2)`,
                                    }}
                                >
                                    {mode === "direct"
                                        ? directSending
                                            ? "TRANSMITTING..."
                                            : "EMITIR AHORA"
                                        : "AÑADIR A COLA (+1h30m)"}
                                </button>
                                {mode === "direct" && status && (
                                    <span
                                        style={{
                                            fontSize: 10,
                                            color: status.ok ? "#0f0" : "#f00",
                                        }}
                                    >
                                        {status.msg}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* QUEUE VISUALIZER (Solo visible si hay items en cola o modo queue) */}
                    {(mode === "queue" || queue.length > 0) && (
                        <div
                            style={{
                                marginTop: 12,
                                borderTop: `1px solid hsla(${matrixHue}, 100%, 50%, 0.2)`,
                                paddingTop: 12,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    marginBottom: 8,
                                    color: `hsl(${matrixHue}, 100%, 60%)`,
                                    textTransform: "uppercase",
                                }}
                            >
                                SECUENCIA DE COLA (
                                {
                                    queue.filter((i) => i.status === "pending")
                                        .length
                                }{" "}
                                Pendientes)
                            </div>
                            <div
                                style={{
                                    maxHeight: 150,
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    paddingRight: 4,
                                }}
                            >
                                <AnimatePresence initial={false}>
                                    {queue.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "6px 10px",
                                                background: "rgba(0,0,0,0.4)",
                                                borderLeft: `2px solid ${getStatusColor(item.status, matrixHue)}`,
                                                fontSize: 12,
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    flex: 1,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: getStatusColor(
                                                            item.status,
                                                            matrixHue
                                                        ),
                                                        minWidth: 60,
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    [{item.status.toUpperCase()}
                                                    ]
                                                </span>
                                                <span
                                                    style={{
                                                        color: `hsl(${matrixHue}, 100%, 80%)`,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {item.text}
                                                </span>
                                                {item.image && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            color: "#aaa",
                                                        }}
                                                    >
                                                        📷
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: `hsl(${matrixHue}, 100%, 50%)`,
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    T-
                                                    {formatTime(
                                                        item.scheduledTime
                                                    )}
                                                </span>
                                                {item.status === "pending" && (
                                                    <button
                                                        onClick={() =>
                                                            setQueue((q) =>
                                                                q.filter(
                                                                    (i) =>
                                                                        i.id !==
                                                                        item.id
                                                                )
                                                            )
                                                        }
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#666",
                                                            cursor: "pointer",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {queue.length === 0 && (
                                        <div
                                            style={{
                                                color: `hsla(${matrixHue}, 100%, 50%, 0.4)`,
                                                fontStyle: "italic",
                                                fontSize: 11,
                                            }}
                                        >
                                            [ COLA VACÍA - SISTEMA EN ESPERA ]
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* OVERLAY RENDER (Igual que antes) */}
            {overlayVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "black",
                        zIndex: 99,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <h1
                        style={{
                            color: `hsl(${matrixHue},100%,60%)`,
                            fontFamily: "monospace",
                            fontSize: 40,
                            letterSpacing: 4,
                        }}
                    >
                        {overlayMessage}
                    </h1>
                    <p
                        style={{
                            color: `hsl(${matrixHue},100%,40%)`,
                            fontFamily: "monospace",
                        }}
                    >
                        {overlaySub}
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}

function getStatusColor(s: TweetStatus, hue: number) {
    if (s === "pending") return `hsl(${hue}, 100%, 50%)`
    if (s === "sending") return "orange"
    if (s === "sent") return "#0f0"
    if (s === "error") return "#f00"
    return "#fff"
}

addPropertyControls(MatrixTerminalTweet, {
    // ... (Tus controles originales aquí)
    textAreaMinHeight: {
        type: ControlType.Number,
        defaultValue: 120,
        title: "Height",
    },
    panelBottom: {
        type: ControlType.Number,
        defaultValue: 40,
        title: "Bottom",
    },
    speed: { type: ControlType.Number, defaultValue: 1.2, title: "Rain Speed" },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 16,
        title: "Font Size",
    },
    rainIntensity: {
        type: ControlType.Number,
        defaultValue: 0.9,
        title: "Rain",
    },
    headGlow: { type: ControlType.Number, defaultValue: 1, title: "Glow" },
    matrixHue: {
        type: ControlType.Number,
        defaultValue: 120,
        min: 0,
        max: 360,
        title: "Hue",
    },
    bg: { type: ControlType.Color, defaultValue: "#000000", title: "BG" },
    showPanel: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show Panel",
    },
    apiEndpoint: {
        type: ControlType.String,
        defaultValue: "http://localhost:8787/tweet",
        title: "API",
    },
    charLimit: { type: ControlType.Number, defaultValue: 280, title: "Limit" },
    autoClear: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Auto Clear",
    },
    showCounter: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Counter",
    },
    showAccessOverlay: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Overlay",
    },
    overlayMessage: {
        type: ControlType.String,
        defaultValue: "ACCESS GRANTED",
    },
    overlaySub: { type: ControlType.String, defaultValue: "CHANNEL OPEN" },
    overlayDuration: { type: ControlType.Number, defaultValue: 2000 },
    overlayOncePerSession: { type: ControlType.Boolean, defaultValue: true },
})
