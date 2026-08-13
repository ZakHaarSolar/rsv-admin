import * as React from "react"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* 🌞 Sistema global de tema */
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
    page: (bg: string, ready: boolean) => ({
        position: "relative" as const,
        width: "100%",
        minHeight: "100svh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: "hidden" as const,
        opacity: ready ? 1 : 0, // evita parpadeo
        transition: "opacity .15s ease",
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

    /* Menú */
    menuBtnFixed: {
        position: "fixed" as const,
        top: 12,
        right: 12,
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        border: "none",
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

    /* Layout contenido */
    contentWrap: {
        position: "relative" as const,
        zIndex: 2,
        padding: "10px 16px 24px 16px",
        display: "flex",
        flexDirection: "column" as const,
        gap: 16,
    },

    titleWrap: (topOffset: number) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: `calc(env(safe-area-inset-top, 0px) + ${topOffset}px)`,
    }),
    titleImg: (accent: string) => ({
        width: "auto",
        objectFit: "contain" as const,
        filter: `drop-shadow(0 0 8px ${withAlpha(accent, 0.6)}) drop-shadow(0 0 18px ${withAlpha(accent, 0.35)})`,
    }),

    card: (accent: string) => ({
        borderRadius: 18,
        border: `1px solid ${withAlpha(accent, 0.33)}`,
        background:
            "linear-gradient(180deg, rgba(5,10,20,.65) 0%, rgba(5,10,20,.92) 100%)",
        boxShadow: `0 0 16px ${withAlpha(accent, 0.2)}, inset 0 0 12px rgba(255,255,255,.04)`,
        padding: 14,
    }),

    h1: (accent: string, fs: number) => ({
        fontSize: fs,
        textAlign: "center" as const,
        color: accent,
        textShadow: `0 0 12px ${withAlpha(accent, 0.47)}`,
        margin: "6px 0 2px 0",
        lineHeight: 1.3,
    }),
    sectionTitle: (accent: string, fs: number) => ({
        fontSize: fs,
        letterSpacing: ".12em",
        textTransform: "uppercase" as const,
        color: accent,
        textAlign: "center" as const,
        margin: "6px 0 8px 0",
        opacity: 0.95,
    }),

    p: (color: string, fs: number) => ({
        color,
        opacity: 0.94,
        lineHeight: 1.65,
        whiteSpace: "pre-line" as const,
        textAlign: "center" as const,
        fontSize: fs,
    }),

    bullet: {
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "start",
        gap: 10,
        margin: "6px 0",
    },
    dot: (accent: string) => ({
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: accent,
        boxShadow: `0 0 10px ${withAlpha(accent, 0.66)}`,
        marginTop: 7,
    }),
    bulletText: (color: string, fs: number) => ({
        color,
        opacity: 0.94,
        lineHeight: 1.6,
        fontSize: fs,
    }),

    /* Stepper */
    step: (active: boolean, accent: string) => ({
        borderRadius: 14,
        border: `1px solid ${active ? accent : "rgba(255,255,255,.18)"}`,
        background: active
            ? `linear-gradient(180deg, ${withAlpha(accent, 0.12)} 0%, rgba(5,10,20,.92) 100%)`
            : "linear-gradient(180deg, rgba(5,10,20,.5) 0%, rgba(5,10,20,.9) 100%)",
        boxShadow: active ? `0 0 14px ${withAlpha(accent, 0.2)}` : "none",
        padding: "6px 10px",
        marginBottom: 8,
    }),
    stepHead: {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 10,
        minHeight: 56,
        padding: "4px 0",
    },
    stepNum: (accent: string, active: boolean) => ({
        width: 26,
        height: 26,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        border: `1px solid ${accent}`,
        color: active ? "#000" : accent,
        background: active ? accent : "transparent",
        fontSize: 13,
        fontWeight: 700,
        boxShadow: active ? `0 0 10px ${withAlpha(accent, 0.66)}` : "none",
    }),
    stepDetailWrap: {
        overflow: "hidden",
        willChange: "height, opacity, margin",
    },
    stepDetailInner: (color: string) => ({
        opacity: 0.95,
        lineHeight: 1.55,
        whiteSpace: "pre-line" as const,
        color,
        paddingRight: 4,
    }),
    stepBody: (color: string, fs: number) => ({
        color,
        opacity: 0.94,
        lineHeight: 1.6,
        marginTop: 8,
        fontSize: fs,
        textAlign: "left" as const,
    }),

    /* Session Cards */
    sessionCard: (accent: string, active: boolean) => ({
        borderRadius: 16,
        border: `1px solid ${withAlpha(accent, 0.33)}`,
        background:
            "linear-gradient(180deg, rgba(5,10,20,.65) 0%, rgba(5,10,20,.95) 100%)",
        boxShadow: active
            ? `0 0 18px ${withAlpha(accent, 0.33)}`
            : `0 0 12px ${withAlpha(accent, 0.13)}`,
        padding: 14,
        marginBottom: 12,
    }),
    sessionRow: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 8,
    },
    sessionTitle: (color: string) => ({
        color,
        fontWeight: 700,
        fontSize: 16,
    }),
    sessionMeta: (color: string) => ({
        color,
        opacity: 0.9,
        fontSize: 14,
        textAlign: "right" as const,
    }),
    bookBtn: (accent: string) => ({
        width: "100%",
        marginTop: 10,
        padding: "12px 16px",
        borderRadius: 12,
        background: "#000",
        border: `1px solid ${accent}`,
        color: "#fff",
        textTransform: "uppercase" as const,
        letterSpacing: ".08em",
        textAlign: "center" as const,
        cursor: "pointer",
        textDecoration: "none",
        display: "block",
        boxShadow: `0 0 10px ${withAlpha(accent, 0.33)}`,
    }),
} as const

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
export function ServiciosMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",

        // Título PNG
        pageTitleImage,
        pageTitleImageHeightMobile = 120,
        titleTopOffsetPx = 86,

        // Tipografías unificadas
        contentBodyFontSize = 16,
        contentHeadingFontSize = 18,

        // Spacings finos
        experiencesTitleGapPx = 12,
        stepsTitleGapPx = 12,
        introHeadingGapPx = 12,

        // Intro
        introHeading = "1–1 con Zak´Haar",
        introText = `Encuentros personalizados vía online.
Sintoniza con tu Sol interior.
Estos encuentros más que para aprender son para recordar.
La guía viene de ti reflejada desde otra capa.
Cada encuentro se ajusta al campo y lo que pulsa en ese instante.

Puedes traer preguntas, visiones, sueños, dudas.`,

        // Experiencias
        experiencesTitle = "Qué puedes experimentar",
        experiencesText = `Claridad vibral.
Alineación con tu Sol Central.
Reflejo de patrones que están por disolverse.
Confirmaciones profundas.
Redirección energética.
Expansión sin esfuerzo.
Comunicación consciente con tu Higher Self.
Apertura de comunicación interdimensional.
Disolución de malestares.
Desarrollo de habilidades cuánticas como visión extra ocular o telekinesis.`,

        // Dinámica
        stepsTitle = "Cómo funciona la dinámica",
        step1 = "Elige la duración de la sesión en la sección inferior.",
        step2 = "Haz clic en “Reservar” para iniciar el proceso.",
        step3 = "Ingresa tu correo electrónico al realizar el pago (es necesario para contactarte).",
        step4 = "(Opcional) Agrega tu número de WhatsApp si prefieres que la coordinación sea por ahí.",
        step5 = "¡Listo! Te contactaremos por correo o WhatsApp (si lo proporcionaste) para acordar el horario que mejor se adapte a ti.",

        // Stripe links
        link30 = "https://buy.stripe.com/5kQ3cobTv8EW3Sx4f20RG02",
        link45 = "https://buy.stripe.com/fZu4gs4r3bR81Kp6na0RG01",
        link60 = "https://buy.stripe.com/4gM14ge1D4oG0GleTG0RG00",

        // Detalles opcionales
        step1Detail = "",
        step2Detail = "",
        step3Detail = "",
        step4Detail = "",
        step5Detail = "",

        // Menú links
        numStars = 60,
        inicioLink = "https://www.redsolarviva.com",
        fragmentosLink = "/fragmentos",
        librosLink = "/libros",
        musicaLink = "https://open.spotify.com",
        serviciosLink = "/servicios",
        afinacionesLink = "https://www.redsolarviva.com/afinaciones",
    } = props

    /* 🎨 Hook global del tema */
    const { synced, accent } = useSolarTheme({ neonAccent: accentColor })

    const [menuOpen, setMenuOpen] = useState(false)
    const [openStep, setOpenStep] = useState<number>(1)

    return (
        <div style={styles.page(bgColor, synced) as React.CSSProperties}>
            <StarsBackground num={numStars} />

            {/* Menú fixed */}
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

            {/* Contenido */}
            <div style={styles.contentWrap as React.CSSProperties}>
                {/* Título PNG */}
                <div
                    style={
                        styles.titleWrap(
                            titleTopOffsetPx
                        ) as React.CSSProperties
                    }
                >
                    {pageTitleImage && (
                        <motion.img
                            src={pageTitleImage}
                            alt="Servicios"
                            style={{
                                ...(styles.titleImg(
                                    accent
                                ) as React.CSSProperties),
                                height: pageTitleImageHeightMobile,
                            }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                        />
                    )}
                </div>

                {/* Intro */}
                <motion.div
                    style={styles.card(accent)}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <div
                        style={{
                            ...(styles.h1(
                                accent,
                                contentHeadingFontSize
                            ) as React.CSSProperties),
                            marginBottom: introHeadingGapPx,
                        }}
                    >
                        {introHeading}
                    </div>

                    <div style={styles.p(textColor, contentBodyFontSize)}>
                        {normalizeMultiline(introText)}
                    </div>
                </motion.div>

                {/* Experiencias */}
                <motion.div
                    style={styles.card(accent)}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                >
                    <div
                        style={styles.sectionTitle(
                            accent,
                            contentHeadingFontSize
                        )}
                    >
                        {experiencesTitle}
                    </div>

                    <div style={{ marginTop: experiencesTitleGapPx }}>
                        {normalizeMultiline(experiencesText)
                            .split("\n")
                            .filter(Boolean)
                            .map((line, idx) => (
                                <div
                                    key={idx}
                                    style={styles.bullet as React.CSSProperties}
                                >
                                    <span style={styles.dot(accent)} />
                                    <span
                                        style={styles.bulletText(
                                            textColor,
                                            contentBodyFontSize
                                        )}
                                    >
                                        {line}
                                    </span>
                                </div>
                            ))}
                    </div>
                </motion.div>

                {/* Dinámica */}
                <motion.div style={styles.card(accent)}>
                    <motion.div
                        style={styles.sectionTitle(
                            accent,
                            contentHeadingFontSize
                        )}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {stepsTitle}
                    </motion.div>

                    <div style={{ marginTop: stepsTitleGapPx }}>
                        {[
                            { n: 1, title: step1, detail: step1Detail },
                            { n: 2, title: step2, detail: step2Detail },
                            { n: 3, title: step3, detail: step3Detail },
                            { n: 4, title: step4, detail: step4Detail },
                            { n: 5, title: step5, detail: step5Detail },
                        ].map((s) => {
                            const active = openStep === s.n
                            return (
                                <div key={s.n}>
                                    <motion.div
                                        style={
                                            styles.step(
                                                active,
                                                accent
                                            ) as React.CSSProperties
                                        }
                                        onClick={() =>
                                            setOpenStep(active ? 0 : s.n)
                                        }
                                        initial={{ opacity: 0, x: 24 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={
                                            s.n === 1
                                                ? {
                                                      once: true,
                                                      amount: 0.3,
                                                      margin: "-10% 0px -10% 0px",
                                                  }
                                                : { once: true, amount: 0.35 }
                                        }
                                        transition={{
                                            duration: 0.28,
                                            ease: "easeOut",
                                        }}
                                    >
                                        {/* Cabecera del paso */}
                                        <div
                                            style={
                                                styles.stepHead as React.CSSProperties
                                            }
                                        >
                                            <div
                                                style={styles.stepNum(
                                                    accent,
                                                    active
                                                )}
                                            >
                                                {s.n}
                                            </div>
                                            <div style={{ fontWeight: 600 }}>
                                                {s.title}
                                            </div>
                                            <motion.div
                                                initial={{ rotate: 0 }}
                                                animate={{
                                                    rotate: active ? 90 : 0,
                                                }}
                                                transition={{ duration: 0.2 }}
                                                style={{ opacity: 0.9 }}
                                            >
                                                ▸
                                            </motion.div>
                                        </div>

                                        {/* Detalle opcional */}
                                        <AnimatePresence initial={false}>
                                            {s.detail && (
                                                <motion.div
                                                    key="detail"
                                                    style={
                                                        styles.stepDetailWrap as React.CSSProperties
                                                    }
                                                    initial={
                                                        active
                                                            ? {
                                                                  height: "auto",
                                                                  opacity: 1,
                                                                  marginTop: 8,
                                                              }
                                                            : {
                                                                  height: 0,
                                                                  opacity: 0,
                                                                  marginTop: 0,
                                                              }
                                                    }
                                                    animate={
                                                        active
                                                            ? {
                                                                  height: "auto",
                                                                  opacity: 1,
                                                                  marginTop: 8,
                                                              }
                                                            : {
                                                                  height: 0,
                                                                  opacity: 0,
                                                                  marginTop: 0,
                                                              }
                                                    }
                                                    exit={{
                                                        height: 0,
                                                        opacity: 0,
                                                        marginTop: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.24,
                                                        ease: "easeOut",
                                                    }}
                                                >
                                                    <div
                                                        style={
                                                            styles.stepDetailInner(
                                                                textColor
                                                            ) as React.CSSProperties
                                                        }
                                                    >
                                                        {normalizeMultiline(
                                                            s.detail
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Reservas */}
                <motion.div
                    style={styles.card(accent)}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* 30 min */}
                    <div style={styles.sessionCard(accent, false)}>
                        <div style={styles.sessionRow as React.CSSProperties}>
                            <div style={styles.sessionTitle(textColor)}>
                                ⏳ 30 min
                            </div>
                            <div style={styles.sessionMeta(textColor)}>
                                Aporte vibral:
                                <br />
                                <strong>1,111 MXN</strong>
                            </div>
                        </div>
                        <a href={link30} style={styles.bookBtn(accent)}>
                            Reservar
                        </a>
                    </div>

                    {/* 45 min */}
                    <div style={styles.sessionCard(accent, true)}>
                        <div style={styles.sessionRow as React.CSSProperties}>
                            <div style={styles.sessionTitle(textColor)}>
                                ⏳ 45 min
                            </div>
                            <div style={styles.sessionMeta(textColor)}>
                                Aporte vibral:
                                <br />
                                <strong>1,555 MXN</strong>
                            </div>
                        </div>
                        <a href={link45} style={styles.bookBtn(accent)}>
                            Reservar
                        </a>
                    </div>

                    {/* 60 min */}
                    <div style={styles.sessionCard(accent, false)}>
                        <div style={styles.sessionRow as React.CSSProperties}>
                            <div style={styles.sessionTitle(textColor)}>
                                ⏳ 60 min
                            </div>
                            <div style={styles.sessionMeta(textColor)}>
                                Aporte vibral:
                                <br />
                                <strong>1,888 MXN</strong>
                            </div>
                        </div>
                        <a href={link60} style={styles.bookBtn(accent)}>
                            Reservar
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Overlay del menú — incluye toggle global */}
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
                                <div style={styles.menuItem(true, accent)}>
                                    Servicios
                                </div>
                                <a
                                    href={afinacionesLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Afinaciones
                                </a>
                                <a
                                    href={musicaLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Música
                                </a>

                                {/* Toggle global */}
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
  Property Controls
--------------------------------------------- */
addPropertyControls(ServiciosMobile, {
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
        title: "Acento",
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

    contentBodyFontSize: {
        type: ControlType.Number,
        title: "Cuerpo (intro + bullets)",
        defaultValue: 16,
        min: 12,
        max: 22,
        step: 1,
    },
    contentHeadingFontSize: {
        type: ControlType.Number,
        title: "Títulos (3)",
        defaultValue: 18,
        min: 14,
        max: 28,
        step: 1,
    },

    introHeadingGapPx: {
        type: ControlType.Number,
        title: "Gap título→intro (px)",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
    },
    experiencesTitleGapPx: {
        type: ControlType.Number,
        title: "Gap Título→Bullets (px)",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
    },
    stepsTitleGapPx: {
        type: ControlType.Number,
        title: "Gap Título→Pasos (px)",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
    },

    fragmentosLink: {
        type: ControlType.String,
        title: "Link: Fragmentos",
        defaultValue: "/fragmentos",
    },

    introHeading: {
        type: ControlType.String,
        title: "Encabezado intro",
        defaultValue: "1–1 con Zak´Haar",
    },
    introText: {
        type: ControlType.String,
        title: "Texto intro",
        rows: 8,
        defaultValue:
            "Encuentros personalizados vía online./nSintoniza con tu Sol interior./nNo vienes a aprender, vienes a recordar./nLa guía no viene de Zak´Haar: viene de ti reflejada desde otra capa./nCada encuentro se ajusta al campo y lo que pulsa en ese instante./n/nPuedes traer preguntas, visiones, sueños, confusiones.",
    },

    experiencesTitle: {
        type: ControlType.String,
        title: "Título experiencias",
        defaultValue: "Qué puedes experimentar",
    },
    experiencesText: {
        type: ControlType.String,
        title: "Bullets experiencias",
        rows: 12,
        defaultValue:
            "Claridad vibral./nAlineación con tu Sol Central./nReflejo de patrones que están por disolverse./nConfirmaciones profundas./nRedirección energética./nExpansión sin esfuerzo./nComunicación consciente con tu Higher Self./nApertura de comunicación interdimensional./nDisolución de malestares./nDesarrollo de habilidades cuánticas como visión extra ocular o telekinesis.",
    },

    stepsTitle: {
        type: ControlType.String,
        title: "Título dinámica",
        defaultValue: "Cómo funciona la dinámica",
    },
    step1: {
        type: ControlType.String,
        title: "Paso 1",
        defaultValue: "Elige la duración de la sesión en la sección inferior.",
    },
    step2: {
        type: ControlType.String,
        title: "Paso 2",
        defaultValue: "Haz clic en “Reservar” para iniciar el proceso.",
    },
    step3: {
        type: ControlType.String,
        title: "Paso 3",
        defaultValue:
            "Ingresa tu correo electrónico al realizar el pago (es necesario para contactarte).",
    },
    step4: {
        type: ControlType.String,
        title: "Paso 4",
        defaultValue:
            "(Opcional) Agrega tu número de WhatsApp si prefieres que la coordinación sea por ahí.",
    },
    step5: {
        type: ControlType.String,
        title: "Paso 5",
        defaultValue:
            "¡Listo! Te contactaremos por correo o WhatsApp (si lo proporcionaste) para acordar el horario que mejor se adapte a ti.",
    },

    step1Detail: {
        type: ControlType.String,
        title: "Paso 1 – Detalle",
        rows: 4,
        defaultValue: "",
    },
    step2Detail: {
        type: ControlType.String,
        title: "Paso 2 – Detalle",
        rows: 4,
        defaultValue: "",
    },
    step3Detail: {
        type: ControlType.String,
        title: "Paso 3 – Detalle",
        rows: 4,
        defaultValue: "",
    },
    step4Detail: {
        type: ControlType.String,
        title: "Paso 4 – Detalle",
        rows: 4,
        defaultValue: "",
    },
    step5Detail: {
        type: ControlType.String,
        title: "Paso 5 – Detalle",
        rows: 4,
        defaultValue: "",
    },

    link30: {
        type: ControlType.String,
        title: "Stripe 30 min",
        defaultValue: "https://buy.stripe.com/5kQ3cobTv8EW3Sx4f20RG02",
    },
    link45: {
        type: ControlType.String,
        title: "Stripe 45 min",
        defaultValue: "https://buy.stripe.com/fZu4gs4r3bR81Kp6na0RG01",
    },
    link60: {
        type: ControlType.String,
        title: "Stripe 60 min",
        defaultValue: "https://buy.stripe.com/4gM14ge1D4oG0GleTG0RG00",
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
        defaultValue: "/servicios",
    },
    afinacionesLink: {
        type: ControlType.String,
        title: "Link: Afinaciones",
        defaultValue: "https://www.redsolarviva.com/afinaciones",
    },
})
