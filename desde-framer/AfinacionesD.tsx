import * as React from "react"
import { useState, useMemo, useEffect, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ---------------------------------------------
   CSS WARP EFFECT (Estrellas en movimiento)
--------------------------------------------- */
const WARP_CSS = String.raw`
.stars-warp-container {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    perspective: 400px; 
    /* Viñeta sutil */
    background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%);
}

.star-warp {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
    animation: space-flight var(--dur) linear infinite;
    animation-delay: var(--delay);
    opacity: 0;
    will-change: transform, opacity;
}

@keyframes space-flight {
    0% {
        transform: translate3d(var(--x), var(--y), -1000px);
        opacity: 0;
    }
    10% {
        opacity: 1; 
    }
    100% {
        transform: translate3d(var(--x), var(--y), 200px);
        opacity: 0;
    }
}
`

/* ---------------------------------------------
   Utils
--------------------------------------------- */
function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "holo-warp-effect-css-afinaciones"
        const prev = document.getElementById(id) as HTMLStyleElement | null
        if (prev) {
            prev.textContent = WARP_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = WARP_CSS
        document.head.appendChild(s)
    }, [])
}

// HEX -> rgba(a)
const hexToRgba = (hex: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,0,0,${a})`
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    const r = (num >> 16) & 255,
        g = (num >> 8) & 255,
        b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

const normalizeMultiline = (str?: string): string =>
    (str || "").replace(/\\n|\/n/g, "\n")

/* ---------------------------------------------
   Styles
--------------------------------------------- */
const styles = {
    page: (bg: string) => ({
        position: "relative" as const,
        width: "100%",
        minHeight: "100svh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden" as const,
    }),

    /* Content wrapper */
    container: (maxW: number, sidePad: number, topPad: number) => ({
        position: "relative" as const,
        zIndex: 2,
        margin: "0 auto",
        maxWidth: maxW,
        padding: `${topPad}px ${sidePad}px 32px ${sidePad}px`,
        display: "flex",
        flexDirection: "column" as const,
        gap: 0,
    }),

    /* Title Wrapper */
    titleWrap: (offsetTop: number) => ({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: offsetTop,
        marginBottom: 0,
    }),

    /* Title Image */
    titleImg: {
        width: "auto",
        objectFit: "contain" as const,
    } as const,

    /* Title Fallback */
    pageTitleFallback: (accent: string, heightPx: number) => ({
        fontFamily: "'Inter', sans-serif",
        fontSize: `${heightPx}px`,
        fontWeight: 100,
        textTransform: "uppercase" as const,
        letterSpacing: "0.4em",
        marginRight: "-0.4em", // Compensación óptica
        color: `color-mix(in srgb, #FFFFFF 80%, ${accent})`,
        textAlign: "center" as const,
        lineHeight: 1,
        textShadow: `0 0 ${heightPx * 0.15}px ${accent}, 0 0 ${heightPx * 0.4}px ${accent}66`,
        margin: 0,
        maxWidth: "95vw",
        position: "relative" as const,
        zIndex: 2,
        pointerEvents: "none" as const,
        userSelect: "none" as const,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
    }),

    /* Invitation text */
    invite: (
        color: string,
        fontSize: number,
        gapTop: number,
        sectionGap: number
    ) => ({
        marginTop: gapTop,
        marginBottom: sectionGap,
        color,
        textAlign: "center" as const,
        lineHeight: 1.7,
        whiteSpace: "pre-line" as const,
        fontSize,
    }),

    /* Form block */
    formOuter: (formMaxW: number) => ({
        margin: "0 auto",
        width: "100%",
        maxWidth: formMaxW,
        display: "flex",
        flexDirection: "column" as const,
        gap: 24,
    }),

    textarea: (accent: string, focused: boolean) => ({
        width: "100%",
        minHeight: 160,
        padding: "16px 20px",
        borderRadius: 16,
        border: `1px solid ${focused ? accent : hexToRgba(accent, 0.4)}`,
        background:
            "linear-gradient(180deg, rgba(5,10,20,.6) 0%, rgba(5,10,20,.85) 100%)",
        color: "#fff",
        outline: "none",
        boxShadow: focused
            ? `0 0 20px ${hexToRgba(accent, 0.25)}, inset 0 0 10px ${hexToRgba(accent, 0.1)}`
            : `0 0 12px ${hexToRgba(accent, 0.1)}`,
        resize: "vertical" as const,
        fontSize: 16,
        lineHeight: 1.6,
        fontFamily: "inherit",
        transition: "all 0.3s ease",
    }),

    sendBtn: (accent: string, disabled: boolean) => ({
        width: "100%",
        padding: "14px 18px",
        borderRadius: 12,
        background: disabled ? "rgba(10,10,10,.6)" : "#000",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.1)" : accent}`,
        color: disabled ? "#666" : accent,
        textAlign: "center" as const,
        textTransform: "uppercase" as const,
        letterSpacing: ".1em",
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : `0 0 16px ${hexToRgba(accent, 0.25)}`,
        transition: "all 0.3s ease",
    }),

    status: (accent: string, ok: boolean) => ({
        textAlign: "center" as const,
        color: ok ? accent : "#ff6b6b",
        fontSize: 14,
        opacity: 0.95,
        marginTop: -10,
    }),
}

/* ---------------------------------------------
   Animaciones (Variants)
--------------------------------------------- */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
}

const titleVariants = {
    hidden: { opacity: 0, y: -30, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
}

const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" },
    },
}

const formVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 50, damping: 20 },
    },
}

/* ---------------------------------------------
   Stars BG (WARP VERSION)
--------------------------------------------- */
const StarsBackground = React.memo(
    ({ num = 80, speed = 1 }: { num?: number; speed?: number }) => {
        const [stars, setStars] = useState<any[]>([])

        useEffect(() => {
            const arr = []
            // Aumentamos cantidad para llenar el efecto 3D
            const total = Math.floor(num * 1.5)
            for (let i = 0; i < total; i++) {
                arr.push({
                    id: i,
                    size:
                        Math.random() > 0.8
                            ? Math.random() * 2 + 1
                            : Math.random() * 1.5 + 0.5,
                    // Rango extendido
                    x: (Math.random() - 0.5) * 250,
                    y: (Math.random() - 0.5) * 250,
                    // Duración base
                    baseDuration: 1.5 + Math.random() * 4,
                    delay: Math.random() * 5,
                })
            }
            setStars(arr)
        }, [num])

        return (
            <div className="stars-warp-container">
                {stars.map((s) => (
                    <div
                        key={s.id}
                        className="star-warp"
                        style={
                            {
                                ["--size" as any]: `${s.size}px`,
                                ["--x" as any]: `${s.x}vw`,
                                ["--y" as any]: `${s.y}vh`,
                                ["--dur" as any]: `${s.baseDuration / speed}s`,
                                ["--delay" as any]: `${s.delay}s`,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
        )
    }
)

/* ---------------------------------------------
   Component (Desktop)
--------------------------------------------- */
export function AfinacionesDesktop(props: any) {
    // 1. INYECTAR CSS WARP
    useInjectCss()

    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",

        // Layout desktop
        contentMaxWidthPx = 1080,
        formMaxWidthPx = 720,
        sidePaddingPx = 32,
        topPaddingPx = 0,
        sectionGapPx = 20,

        // Title PNG
        pageTitleImage,
        pageTitleImageHeightPx = 160,
        titleTopOffsetPx = 100,

        // Title Fallback
        pageTitleFallbackText = "AFINACIONES",
        pageTitleFallbackHeight = 72,

        // Invitation text
        inviteText = "¿Te gustaría sugerir una afinación o mejora para esta página?\n\nEscribe tu propuesta aquí abajo y la revisaremos. ¡Gracias por cocrear! ☼",
        inviteFontSize = 18,
        inviteTopGapPx = 16,

        // Stars
        numStars = 80,
        warpSpeed = 1.0, // NUEVA PROP

        // Webhook
        webhookUrl = "https://eogv50fqm57qx8v.m.pipedream.net",
        placeholderText = "Escribe aquí tu propuesta de afinación…",
        maxLength = 1200,
    } = props

    const liveAccent = accentColor

    const [mensaje, setMensaje] = useState("")
    const [sending, setSending] = useState(false)
    const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
        null
    )

    // Estado para controlar el glow del input
    const [isFocused, setIsFocused] = useState(false)

    // Estado para FADE-IN SUAVE (Anti-FOUC)
    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(t)
    }, [])

    const send = async () => {
        const text = mensaje.trim()
        if (!text || sending) return
        setSending(true)
        setStatus(null)
        try {
            const res = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: text,
                    fecha: new Date().toISOString(),
                }),
            })
            if (!res.ok) throw new Error("HTTP")
            setMensaje("")
            setStatus({ ok: true, text: "Mensaje enviado 🌞" })
        } catch {
            setStatus({
                ok: false,
                text: "No se pudo enviar. Intenta de nuevo.",
            })
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={styles.page(bgColor) as React.CSSProperties}>
            {/* INYECCIÓN DE FUENTE INTER THIN (100) */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap');
            `}</style>

            {/* 2. FONDO: StarsBackground (Warp Version) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isReady ? 1 : 0 }}
                transition={{ duration: 3, ease: "easeInOut" }}
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            >
                <StarsBackground num={numStars} speed={warpSpeed} />
            </motion.div>

            {/* CONTENEDOR DE ELEMENTOS (ANIMACIÓN CASCADA) */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isReady ? "visible" : "hidden"}
                style={
                    styles.container(
                        contentMaxWidthPx,
                        sidePaddingPx,
                        topPaddingPx
                    ) as React.CSSProperties
                }
            >
                {/* 1. Título: Baja desde arriba */}
                <motion.div
                    variants={titleVariants}
                    style={
                        styles.titleWrap(
                            titleTopOffsetPx
                        ) as React.CSSProperties
                    }
                >
                    {pageTitleImage ? (
                        <img
                            src={pageTitleImage}
                            alt="Afinaciones"
                            style={{
                                ...styles.titleImg,
                                height: pageTitleImageHeightPx,
                                filter: `drop-shadow(0 0 8px ${hexToRgba(liveAccent, 0.6)}) drop-shadow(0 0 18px ${hexToRgba(liveAccent, 0.35)})`,
                            }}
                        />
                    ) : (
                        <h1
                            style={styles.pageTitleFallback(
                                liveAccent,
                                pageTitleFallbackHeight
                            )}
                        >
                            {normalizeMultiline(pageTitleFallbackText)}
                        </h1>
                    )}
                </motion.div>

                {/* 2. Texto de Invitación: Aparece suave */}
                <motion.div
                    variants={textVariants}
                    style={
                        styles.invite(
                            textColor,
                            inviteFontSize,
                            inviteTopGapPx,
                            sectionGapPx
                        ) as React.CSSProperties
                    }
                >
                    {normalizeMultiline(inviteText)}
                </motion.div>

                {/* 3. Formulario: Sube desde abajo */}
                <motion.div
                    variants={formVariants}
                    style={
                        styles.formOuter(formMaxWidthPx) as React.CSSProperties
                    }
                >
                    <textarea
                        style={
                            styles.textarea(
                                liveAccent,
                                isFocused
                            ) as React.CSSProperties
                        }
                        maxLength={maxLength}
                        placeholder={placeholderText}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        // Eventos para el glow
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        // NUEVO: Detectar Command + Enter
                        onKeyDown={(e) => {
                            // metaKey es Command en Mac, ctrlKey es Control en Windows
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault() // Evita el salto de línea
                                send()
                            }
                        }}
                    />

                    <button
                        style={
                            styles.sendBtn(
                                liveAccent,
                                sending || !mensaje.trim()
                            ) as React.CSSProperties
                        }
                        onClick={send}
                        disabled={sending || !mensaje.trim()}
                    >
                        {sending ? "Enviando..." : "Enviar"}
                    </button>

                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.2 }}
                                style={
                                    styles.status(
                                        liveAccent,
                                        status.ok
                                    ) as React.CSSProperties
                                }
                            >
                                {status.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    )
}

/* ---------------------------------------------
   Property Controls (Framer)
--------------------------------------------- */
addPropertyControls(AfinacionesDesktop, {
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#FFFFFF",
    },

    // Acento editable
    accentColor: {
        type: ControlType.Color,
        title: "Color Tema (HEX)",
        defaultValue: "#00C2FF",
    },

    contentMaxWidthPx: {
        type: ControlType.Number,
        title: "Ancho máx. contenido",
        defaultValue: 1080,
        min: 720,
        max: 1600,
        step: 10,
    },
    formMaxWidthPx: {
        type: ControlType.Number,
        title: "Ancho máx. formulario",
        defaultValue: 720,
        min: 420,
        max: 980,
        step: 10,
    },
    sidePaddingPx: {
        type: ControlType.Number,
        title: "Padding lateral (px)",
        defaultValue: 32,
        min: 0,
        max: 80,
        step: 2,
    },
    topPaddingPx: {
        type: ControlType.Number,
        title: "Padding superior (px)",
        defaultValue: 0,
        min: 0,
        max: 160,
        step: 2,
    },
    sectionGapPx: {
        type: ControlType.Number,
        title: "Gap secciones (px)",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
    },

    pageTitleImage: { type: ControlType.Image, title: "Título PNG" },
    pageTitleImageHeightPx: {
        type: ControlType.Number,
        title: "Alto Título (px)",
        defaultValue: 160,
        min: 40,
        max: 360,
        step: 2,
    },
    titleTopOffsetPx: {
        type: ControlType.Number,
        title: "Offset superior Título (px)",
        defaultValue: 100,
        min: 0,
        max: 240,
        step: 2,
    },

    /* Fallback Title Props */
    pageTitleFallbackText: {
        type: ControlType.String,
        title: "Título Fallback",
        defaultValue: "AFINACIONES",
    },
    pageTitleFallbackHeight: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
        min: 24,
        max: 120,
        step: 1,
    },

    inviteText: {
        type: ControlType.String,
        title: "Texto invitación",
        defaultValue:
            "¿Te gustaría sugerir una afinación o mejora para esta página?/n/nEscribe tu propuesta aquí abajo y la revisaremos. ¡Gracias por cocrear! ☼",
        rows: 6,
    },
    inviteFontSize: {
        type: ControlType.Number,
        title: "Tamaño texto",
        defaultValue: 18,
        min: 12,
        max: 28,
        step: 1,
    },
    inviteTopGapPx: {
        type: ControlType.Number,
        title: "Gap Título→Texto (px)",
        defaultValue: 16,
        min: 0,
        max: 120,
        step: 1,
    },

    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 80,
        min: 0,
        max: 300,
        step: 5,
    },
    warpSpeed: {
        // CONTROL NUEVO
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },

    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: "https://eogv50fqm57qx8v.m.pipedream.net",
    },
    placeholderText: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Escribe aquí tu propuesta de afinación…",
        rows: 2,
    },
    maxLength: {
        type: ControlType.Number,
        title: "Máx. caracteres",
        defaultValue: 1200,
        min: 80,
        max: 5000,
        step: 10,
    },
})
