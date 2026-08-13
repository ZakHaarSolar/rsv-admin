import * as React from "react"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* 👇 agrega estos imports universales */
import { useSolarTheme, withAlpha } from "./useSolarTheme.ts"
import SolarThemeToggle from "./SolarThemeToggle.tsx"

/* ---------------------------------------------
   Utils
--------------------------------------------- */
const normalizeMultiline = (str?: string): string =>
    (str || "").replace(/\\n|\/n/g, "\n")

/* ---------------------------------------------
   Styles
--------------------------------------------- */
const styles = {
    container: (bg: string, ready: boolean) => ({
        position: "relative" as const,
        width: "100%",
        minHeight: "100svh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: "hidden" as const,
        /* 👇 evita parpadeo sin cambiar orden de hooks */
        opacity: ready ? 1 : 0,
        transition: "opacity .12s ease",
    }),

    /* Stars */
    stars: {
        position: "absolute" as const,
        inset: 0,
        zIndex: 0,
        pointerEvents: "none" as const,
    },
    star: (size: number, top: number, left: number, delay: number) => ({
        position: "absolute" as const,
        width: `${size}px`,
        height: `${size}px`,
        background: "#fff",
        borderRadius: "50%",
        opacity: 0,
        boxShadow: `0 0 ${size * 1.6}px rgba(255,255,255,.35)`,
        top: `${top}%`,
        left: `${left}%`,
        animation: `twinkle ${2 + Math.random() * 3}s infinite ${delay}s alternate ease-in-out`,
    }),
    keyframesTwinkle: `@keyframes twinkle{0%{opacity:.15}50%{opacity:.6}100%{opacity:.15}}`,

    /* Botón menú FIXED */
    menuBtnFixed: {
        position: "fixed" as const,
        top: 12,
        right: 12,
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        border: "none",
        boxShadow: "none",
        background: "transparent",
        zIndex: 10010,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
    },
    menuIconLine: (w: number) => ({
        width: w,
        height: 2,
        background: "#fff",
        borderRadius: 2,
    }),

    /* Overlay menú */
    menuOverlay: (accent: string) => ({
        position: "fixed" as const,
        inset: 0,
        background: "rgba(5,10,20,.88)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 20px ${withAlpha(accent, 0.6)}, 0 0 40px ${withAlpha(accent, 0.33)}`,
        overflow: "hidden",
    }),
    menuCloseBtnTR: {
        position: "absolute" as const,
        top: "calc(env(safe-area-inset-top, 0px) + 8px)",
        right: 10,
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        background: "transparent",
        border: "none",
        color: "#fff",
        fontSize: 28,
        lineHeight: 1,
        fontWeight: 600,
        textShadow: "0 0 8px rgba(255,255,255,.35)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        zIndex: 10001,
    },
    menuList: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 18,
        textAlign: "center" as const,
    },
    menuItem: (isActive: boolean, accent: string) => ({
        fontSize: 20,
        letterSpacing: ".02em",
        color: isActive ? accent : "#fff",
        textDecoration: "none",
        textShadow: isActive ? `0 0 10px ${withAlpha(accent, 0.45)}` : "none",
    }),

    /* Título PNG */
    titleWrap: {
        position: "relative" as const,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
    },
    /* 👇 usa el accent de tema, no azul fijo */
    titleImg: (accent: string) => ({
        width: "auto",
        objectFit: "contain" as const,
        filter: `drop-shadow(0 0 8px ${withAlpha(accent, 0.6)}) drop-shadow(0 0 18px ${withAlpha(accent, 0.35)})`,
    }),

    /* Texto de invitación */
    inviteWrap: (color: string, fontSize: number) => ({
        position: "relative" as const,
        zIndex: 2,
        padding: "0 16px",
        color,
        textAlign: "center" as const,
        lineHeight: 1.6,
        whiteSpace: "pre-line" as const,
        fontSize,
    }),

    /* Formulario */
    formWrap: {
        position: "relative" as const,
        zIndex: 2,
        padding: "12px 16px 24px 16px",
        display: "flex",
        flexDirection: "column" as const,
        gap: 12,
    },
    textarea: (accent: string) => ({
        width: "100%",
        minHeight: 120,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${withAlpha(accent, 0.6)}`,
        background:
            "linear-gradient(180deg, rgba(5,10,20,.7) 0%, rgba(5,10,20,.9) 100%)",
        color: "#fff",
        outline: "none",
        boxShadow: `0 0 12px ${withAlpha(accent, 0.33)} inset, 0 0 12px ${withAlpha(accent, 0.22)}`,
        resize: "vertical" as const,
    }),
    sendBtn: (accent: string, disabled: boolean) => ({
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        background: disabled ? "rgba(0,0,0,.6)" : "#000",
        border: `1px solid ${accent}`,
        color: disabled ? "#999" : "#fff",
        textAlign: "center" as const,
        textTransform: "uppercase" as const,
        letterSpacing: ".08em",
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : `0 0 10px ${withAlpha(accent, 0.33)}`,
    }),
    status: (accent: string, ok: boolean) => ({
        textAlign: "center" as const,
        color: ok ? accent : "#ff6b6b",
        fontSize: 14,
        opacity: 0.95,
    }),
}

/* Stars BG */
const StarsBackground = React.memo(({ num = 60 }: { num?: number }) => {
    const stars = useMemo(() => {
        const a: {
            id: number
            size: number
            top: number
            left: number
            delay: number
        }[] = []
        for (let i = 0; i < num; i++) {
            a.push({
                id: i,
                size: Math.random() * 1.5 + 0.5,
                top: Math.random() * 100,
                left: Math.random() * 100,
                delay: Math.random() * 5,
            })
        }
        return a
    }, [num])

    return (
        <div style={styles.stars as React.CSSProperties}>
            <style>{styles.keyframesTwinkle}</style>
            {stars.map((s) => (
                <div
                    key={s.id}
                    style={styles.star(s.size, s.top, s.left, s.delay)}
                />
            ))}
        </div>
    )
})

/* ---------------------------------------------
   Component
--------------------------------------------- */
export function AfinacionesMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF", // (se ignora en runtime: usaremos accent del tema)

        // Título PNG
        pageTitleImage,
        pageTitleImageHeightMobile = 120, // Alto Título (px)
        titleTopOffsetPx = 86, // Offset superior Título (px)

        // Texto de invitación
        inviteText = "¿Te gustaría sugerir una afinación o mejora para esta página?\n\nEscribe tu propuesta aquí abajo y la revisaremos. ¡Gracias por cocrear! ☼",
        inviteFontSize = 16,
        inviteTopGapPx = 12, // gap entre el título y el texto

        // Stars + menú
        numStars = 60,
        inicioLink = "https://www.redsolarviva.com",
        fragmentosLink = "https://www.youtube.com/@Fragmentosdelsol",
        librosLink = "/libros",
        musicaLink = "https://open.spotify.com",
        serviciosLink = "/sesiones1-1",
        afinacionesLink = "https://www.redsolarviva.com/afinaciones",

        // Webhook
        webhookUrl = "https://eogv50fqm57qx8v.m.pipedream.net",
        placeholderText = "Escribe aquí tu propuesta de afinación…",
        maxLength = 800,
    } = props

    /* 👇 HOOK universal de tema (siempre antes de otros hooks) */
    const { synced, accent } = useSolarTheme({ neonAccent: accentColor })

    const [menuOpen, setMenuOpen] = useState(false)
    const [mensaje, setMensaje] = useState("")
    const [sending, setSending] = useState(false)
    const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
        null
    )

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
        <div style={styles.container(bgColor, synced) as React.CSSProperties}>
            <StarsBackground num={numStars} />

            {/* Menú fijo arriba-derecha */}
            {!menuOpen && (
                <button
                    aria-label="Abrir menú"
                    style={styles.menuBtnFixed}
                    onClick={() => setMenuOpen(true)}
                >
                    <div style={{ display: "grid", gap: 5 }}>
                        <div style={styles.menuIconLine(18)} />
                        <div style={styles.menuIconLine(18)} />
                        <div style={styles.menuIconLine(18)} />
                    </div>
                </button>
            )}

            {/* Título PNG */}
            <div
                style={{
                    ...styles.titleWrap,
                    marginTop: `calc(env(safe-area-inset-top, 0px) + ${titleTopOffsetPx}px)`,
                }}
            >
                {pageTitleImage && (
                    <img
                        src={pageTitleImage}
                        alt="Afinaciones"
                        style={{
                            ...(styles.titleImg(accent) as React.CSSProperties),
                            height: pageTitleImageHeightMobile,
                        }}
                    />
                )}
            </div>

            {/* Texto de invitación */}
            <div
                style={{
                    ...(styles.inviteWrap(
                        textColor,
                        inviteFontSize
                    ) as React.CSSProperties),
                    marginTop: inviteTopGapPx,
                }}
            >
                {normalizeMultiline(inviteText)}
            </div>

            {/* Formulario */}
            <div style={styles.formWrap as React.CSSProperties}>
                <textarea
                    style={styles.textarea(accent) as React.CSSProperties}
                    maxLength={maxLength}
                    placeholder={placeholderText}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                />
                <button
                    style={
                        styles.sendBtn(
                            accent,
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
                                    accent,
                                    status.ok
                                ) as React.CSSProperties
                            }
                        >
                            {status.text}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Overlay del menú */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        style={styles.menuOverlay(accent)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        onClick={() => setMenuOpen(false)}
                        onWheel={(e) => e.preventDefault()}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* X arriba-derecha */}
                        <button
                            aria-label="Cerrar menú"
                            style={styles.menuCloseBtnTR as React.CSSProperties}
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpen(false)
                            }}
                        >
                            ×
                        </button>

                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.98, opacity: 0.95 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0.92 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                        >
                            <div style={styles.menuList as React.CSSProperties}>
                                <a
                                    href={inicioLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Origen
                                </a>
                                <a
                                    href={fragmentosLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Fragmentos del Sol
                                </a>
                                <a
                                    href={librosLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Libros
                                </a>
                                <a
                                    href={serviciosLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Sesiones 1-1
                                </a>
                                {/* Pestaña actual marcada */}
                                <div style={styles.menuItem(true, accent)}>
                                    Afinaciones
                                </div>
                                <a
                                    href={musicaLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.menuItem(false, accent)}
                                >
                                    Música
                                </a>

                                {/* 👇 Toggle universal al fondo del menú */}
                                <SolarThemeToggle
                                    showLabel={true}
                                    width={78}
                                    height={36}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ---------------------------------------------
   Property Controls (Framer)
--------------------------------------------- */
addPropertyControls(AfinacionesMobile, {
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
    accentColor: {
        type: ControlType.Color,
        title: "Acento (Neón default)",
        defaultValue: "#00C2FF",
    },

    pageTitleImage: { type: ControlType.Image, title: "Título PNG" },
    pageTitleImageHeightMobile: {
        type: ControlType.Number,
        title: "Alto Título (px)",
        defaultValue: 120,
        min: 40,
        max: 280,
        step: 2,
    },
    titleTopOffsetPx: {
        type: ControlType.Number,
        title: "Offset superior Título (px)",
        defaultValue: 86,
        min: 0,
        max: 200,
        step: 2,
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
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
    },
    inviteTopGapPx: {
        type: ControlType.Number,
        title: "Gap Título→Texto (px)",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
    },

    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 60,
        min: 0,
        max: 250,
        step: 5,
    },

    inicioLink: {
        type: ControlType.String,
        title: "Link: Origen",
        defaultValue: "https://www.redsolarviva.com",
    },
    fragmentosLink: {
        type: ControlType.String,
        title: "Link: Fragmentos",
        defaultValue: "https://www.youtube.com/@Fragmentosdelsol",
    },
    librosLink: {
        type: ControlType.String,
        title: "Link: Libros",
        defaultValue: "/libros",
    },
    musicaLink: {
        type: ControlType.String,
        title: "Link: Música",
        defaultValue: "https://open.spotify.com",
    },
    serviciosLink: {
        type: ControlType.String,
        title: "Link: Servicios",
        defaultValue: "/Sesiones1-1",
    },
    afinacionesLink: {
        type: ControlType.String,
        title: "Link: Afinaciones",
        defaultValue: "https://www.redsolarviva.com/afinaciones",
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
        defaultValue: 800,
        min: 80,
        max: 2000,
        step: 10,
    },
})
