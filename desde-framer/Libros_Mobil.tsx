import * as React from "react"
import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* 🔆 Tema universal */
import { useSolarTheme, withAlpha } from "./useSolarTheme.ts"
import SolarThemeToggle from "./SolarThemeToggle.tsx"

/* ------------------------------------------------- Utils ------------------------------------------------- */
const makeFallbackDataUrl = (
    title: string,
    color = "#00C2FF",
    w = 300,
    h = 420
): string => {
    const svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${color}' stop-opacity='0.35'/>
        <stop offset='100%' stop-color='${color}' stop-opacity='0.1'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='16' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui' font-size='18' fill='${color}' opacity='0.85'>${title}</text>
  </svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`
}

const normalizeMultiline = (str?: string): string =>
    (str || "").replace(/\\n/g, "\n")

/* ------------------------------------------------- Styles ------------------------------------------------- */
const styles = {
    container: (bg: string) => ({
        position: "relative" as const,
        width: "100%",
        minHeight: "100svh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: "hidden" as const,
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

    consoleCloseBtn: {
        position: "absolute",
        width: 44,
        height: 44,
        top: 2, // ⬅️ súbela bajando este número (p. ej. 2)
        right: 6,
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
    } as const,

    /* Botón menú */
    menuBtn: {
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        border: "none",
        boxShadow: "none",
        background: "transparent",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        justifySelf: "end" as const,
        alignSelf: "center" as const,
    },
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

    menuCloseBtnTL: {
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

    /* Header global (fuera de consola) */
    titleWrap: {
        position: "relative" as const,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
    },
    titleImg: (accent: string) => ({
        width: "70vw",
        maxWidth: 420,
        objectFit: "contain" as const,
        filter: `drop-shadow(0 0 8px ${withAlpha(accent, 0.6)}) drop-shadow(0 0 18px ${withAlpha(accent, 0.35)})`,
    }),

    /* Authors */
    authorsWrap: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 14,
        padding: "8px 16px 4px 16px",
        zIndex: 2,
    },
    authorCard: (accent: string) => ({
        width: "100%",
        minHeight: 84,
        borderRadius: 16,
        border: `2px solid ${accent}`,
        background: "rgba(5,10,20,.8)",
        boxShadow: `0 0 14px ${withAlpha(accent, 0.47)}, 0 0 28px ${withAlpha(accent, 0.27)}`,
        display: "grid",
        placeItems: "center",
        textAlign: "center" as const,
        padding: "16px 12px",
        cursor: "pointer",
    }),
    authorTitle: (accent: string) => ({
        fontSize: 18,
        color: accent,
        textShadow: `0 0 10px ${withAlpha(accent, 0.6)}`,
        whiteSpace: "nowrap" as const,
    }),
    subtitle: (color: string) => ({
        zIndex: 2,
        padding: "14px 18px 22px 18px",
        color,
        textAlign: "center" as const,
        lineHeight: 1.5,
        whiteSpace: "pre-line" as const,
        opacity: 0.9,
    }),

    /* Console wrapper */
    consoleWrap: (accent: string) => ({
        position: "relative" as const,
        zIndex: 4,
        borderRadius: 18,
        border: `2px solid ${accent}`,
        background: "rgba(5,10,20,.85)",

        boxShadow: `0 0 16px ${withAlpha(accent, 0.47)}, 0 0 32px ${withAlpha(accent, 0.27)}`,
        overflow: "visible", // ⬅️ antes estaba "hidden"
        isolation: "isolate", // ⬅️ crea contexto propio (el halo no se ve cortado)
        display: "flex",
        flexDirection: "column" as const,
        marginLeft: 14,
        marginRight: 14,
        marginTop:
            "calc(env(safe-area-inset-top, 0px) + var(--console-top, 0px))",
        marginBottom: "var(--console-bottom, 12px)",
        height: "calc(100svh - env(safe-area-inset-top, 0px) - var(--console-top, 0px) - var(--console-bottom, 12px))",
        maxHeight:
            "calc(100svh - env(safe-area-inset-top, 0px) - var(--console-top, 0px) - var(--console-bottom, 12px))",
    }),

    /* Header consola */
    consoleHeader: (color: string, accent: string) => ({
        position: "relative" as const,
        zIndex: 5,
        height: "var(--console-head, 52px)",
        minHeight: "var(--console-head, 52px)",
        padding: "0 6px",
        borderBottom: "none", // ya quitaste la línea
        color,
        background: "rgba(0,0,0,.22)",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        borderTopLeftRadius: "inherit", // ⬅️ clave
        borderTopRightRadius: "inherit", // ⬅️ clave
        overflow: "hidden", // ⬅️ su fondo respeta la curva
    }),

    topBtnText: (accent: string) => ({
        border: "none",
        color: accent,
        background: "transparent",
        borderRadius: 10,
        padding: "8px 10px",
        opacity: 0.85,
        cursor: "pointer",
        textShadow: `0 0 8px ${withAlpha(accent, 0.25)}`,
    }),
    exitBtnCentered: {
        position: "absolute" as const,
        left: "calc(50% + var(--exit-x, 0px))",
        top: "50%",
        transform: "translate(-50%, -50%)",
        padding: "6px 16px",
        borderRadius: 4,
        background: "#000",
        border: "1px solid rgba(255,255,255,.22)",
        color: "#fff",
        fontSize: 13,
        letterSpacing: "0.08em",
    },

    consoleBody: {
        position: "relative" as const,
        zIndex: 3,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
    },

    /* Glitch */
    glitchBase: {
        position: "absolute" as const,
        inset: 0,
        background: "#050A14",
        zIndex: 0,
        borderRadius: "inherit", // ⬅️ clave
        pointerEvents: "none" as const,
    },
    glitchNoise: {
        position: "absolute" as const,
        inset: 0,
        mixBlendMode: "screen" as const,
        background:
            "repeating-linear-gradient(0deg, transparent 0 1px, rgba(0,0,0,.12) 1px 2px)",
        opacity: 0.12,
        zIndex: 1,
        borderRadius: "inherit", // ⬅️ clave
        pointerEvents: "none" as const,
    },

    innerBorder: (accent: string) => ({
        position: "absolute" as const,
        inset: 2,
        border: `1px solid ${accent}`,
        borderRadius: "inherit", // ⬅️ antes tenías 16 fijo
        pointerEvents: "none" as const,
        mixBlendMode: "screen" as const,
        zIndex: 2,
    }),

    /* Indicadores (soles) */
    indicatorsRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "4px 0 6px",
        minHeight: 16,
        pointerEvents: "none" as const,
    },
    dot: (accent: string, active: boolean) => {
        const gold = "#FFD76A"
        return {
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: active ? gold : "rgba(255,255,255,.16)",
            border: `1px solid ${active ? gold : "rgba(255,255,255,.35)"}`,
            boxShadow: active
                ? "0 0 8px rgba(255,215,106,.7), 0 0 16px rgba(255,215,106,.45)"
                : "none",
            opacity: 1,
            transform: "translateZ(0)",
        }
    },
    headerIndicators: {
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: "var(--indicators-offset, -8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none" as const,
        zIndex: 7,
    },

    /* Preview / carrusel */
    carouselArea: {
        position: "relative" as const,
        zIndex: 3,
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "stretch",
        justifyContent: "space-between",
    },
    scrollStrip: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        overflowX: "auto" as const,
        scrollSnapType: "x mandatory" as const,
        WebkitOverflowScrolling: "touch" as const,
    },
    slide: {
        flex: "0 0 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scrollSnapAlign: "center" as const,
        padding: "14px",
        paddingTop: "var(--preview-top-gap, 24px)",
        boxSizing: "border-box" as const,
    },
    coverImg: {
        width: "var(--cover-vw, 70vw)",
        maxWidth: "var(--cover-vw, 70vw)",
        height: "auto",
        borderRadius: 14,
        objectFit: "cover" as const,
        boxShadow: "0 6px 28px rgba(0,0,0,.55)",
        outline: "none",
    },

    /* Nav carrusel */
    navBar: {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px 14px 12px",
        flexShrink: 0,
    },
    arrowBtn: (accent: string, disabled: boolean) => ({
        display: "grid",
        placeItems: "center",
        padding: 6,
        border: "none",
        background: "transparent",
        color: accent,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "default" : "pointer",
        textShadow: `0 0 10px ${withAlpha(accent, 0.35)}`,
    }),

    /* Botón seleccionar */
    selectBtn: (accent: string) => ({
        position: "relative" as const,
        zIndex: 2,
        justifySelf: "center",
        padding: "12px 18px",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.5)",
        background: "#000",
        color: accent,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        boxShadow: `0 0 10px ${withAlpha(accent, 0.3)}`,
    }),

    /* Swipe wrapper */
    swipeWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 0,
        cursor: "grab",
        touchAction: "pan-y",
        willChange: "transform",
        flex: 1,
    },

    /* Info area */
    infoArea: {
        position: "relative" as const,
        zIndex: 3,
        flex: 1,
        minHeight: 0,
        padding:
            "var(--info-top-pad, 0px) 14px calc(14px + var(--cta-bottom, 0px)) 14px",
        display: "flex",
        flexDirection: "column" as const,
        gap: 8,
    },
    infoTitle: (accent: string) => ({
        fontSize: 18,
        textAlign: "center" as const,
        color: accent,
        textShadow: `0 0 12px ${withAlpha(accent, 0.53)}`,
        margin: 0,
        flexShrink: 0,
        whiteSpace: "pre-line",
    }),
    infoText: (color: string, fontSize: number) => ({
        flex: 1,
        minHeight: 0,
        color,
        opacity: 0.92,
        lineHeight: 1.6,
        overflowY: "auto" as const,
        padding: "8px 2px",
        WebkitOverflowScrolling: "touch" as const,
        whiteSpace: "pre-line",
        fontSize,
    }),

    /* Botones sutiles */
    subtleBtn: {
        display: "block",
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        background: "#000",
        border: "1px solid rgba(255,255,255,.22)",
        color: "#fff",
        textAlign: "center" as const,
        textDecoration: "none",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
    },
    subtleBtnRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

    /* Compra */
    purchaseCoverImg: {
        display: "block",
        margin: "0 auto",
        width: "42vw",
        maxWidth: 180,
        height: "auto",
        borderRadius: 8,
        marginBottom: 12,
        boxShadow: "0 6px 28px rgba(0,0,0,.55)",
    },
    purchaseNavRow: {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        marginBottom: 12,
    },
    purchaseImageSwipe: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
        touchAction: "pan-y",
    },
    purchaseSubtitle: {
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        opacity: 0.8,
        textAlign: "center" as const,
        marginTop: 4,
    },

    /* Amazon grid */
    amazonGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 10,
        alignContent: "start",
    },

    /* Modal PDF */
    modalOverlay: {
        position: "fixed" as const,
        inset: 0,
        background: "rgba(0,0,0,.7)",
        backdropFilter: "blur(10px)",
        zIndex: 10020,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6vh 4vw",
    },
    modalCard: (accent: string) => ({
        width: "96vw",
        height: "88vh",
        borderRadius: 18,
        border: `2px solid ${accent}`,
        boxShadow: `0 0 18px ${withAlpha(accent, 0.6)}, 0 0 36px ${withAlpha(accent, 0.33)}`,
        overflow: "hidden",
        background: "rgba(5,10,20,.95)",
        display: "flex",
        flexDirection: "column" as const,
    }),
    modalHead: (accent: string) => ({
        padding: "10px 12px",
        borderBottom: `1px solid ${withAlpha(accent, 0.35)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#fff",
        fontSize: 14,
    }),
    modalBody: {
        flex: 1,
        background: "#000",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
    },
} as const

/* Stars BG */
const StarsBackground = memo(({ num = 60 }: { num?: number }) => {
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
                    style={
                        styles.star(
                            s.size,
                            s.top,
                            s.left,
                            s.delay
                        ) as React.CSSProperties
                    }
                />
            ))}
        </div>
    )
})

/* Variantes de texto (slide) */
const textSlideVariants = {
    enter: (dir: -1 | 0 | 1) => ({
        x: dir === 0 ? 0 : dir > 0 ? 18 : -18,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: -1 | 0 | 1) => ({
        x: dir === 0 ? 0 : dir > 0 ? -18 : 18,
        opacity: 0,
    }),
}

/* ------------------------------------------------- Books parser ------------------------------------------------- */
type TBook = {
    id: string | number
    title: string
    author: string
    coverUrl?: string
    colorHex?: string
    synopsis?: string
    digitalLink?: string
    physicalLinks?: { label: string; href: string }[]
    pdfUrl?: string | null
    previewPages?: number
}

const parseBooks = (
    json: string,
    useSample: boolean,
    covers: any,
    pdfs: Record<string, string | undefined>,
    pages?: { book1?: number; book2?: number; book3?: number; book4?: number }
): TBook[] => {
    if (useSample) {
        return [
            {
                id: "1",
                title: "Despierta tus Habilidades Cuánticas",
                author: "Zak´Haar",
                coverUrl:
                    covers.coverNucleo || "https://placehold.co/300x420/png",
                colorHex: "#00FFCC",
                synopsis: `Primer libro canalizado por Zak´Haar.
En sus páginas descubrirás que las llamadas “habilidades cuánticas” no son algo extraño ni lejano, sino parte natural de tu ser: percibir más allá de los sentidos físicos, mover energía desde la emoción coherente, leer la vibración de espacios, objetos y personas, y reconocer que tu presencia transforma sin esfuerzo.

Este manual canalizado te guía paso a paso con prácticas simples de respiración, percepción y expansión solar, para que recuperes tu eje (centro)
y recuerdes que no viniste a buscar luz…
viniste a serla.

El lector no solo recuerda… se reactiva .
Más que información, encontrarás un campo vivo que activa lo que ya eres: un Sol encarnado en expansión.

No necesitas más teorías.
No necesita más técnicas externas.
Todo ya pulsa en tu campo solar.

Este manual te ayuda a:

Activar tus habilidades cuánticas naturales.
Expandir tu presencia vibral en la Tierra.
Reconectarte con tu eje solar interior.

Despierta. Expande. Irradia.
Tu Nodo Solar te está llamando.

Este libro no se lee. Se activa.
172 páginas.`,
                digitalLink: "https://buy.stripe.com/4gM00caPr4oGbkZeTG0RG06",
                physicalLinks: [
                    {
                        label: "Amazon ES",
                        href: "https://www.amazon.es/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G?__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2B1S0ZA1U41SI&dib=eyJ2IjoiMSJ9.I9MhsGnKfcmCxKYM7a5DDmuKX0Hk2C8Rw2x50pX9lL6bleUVjBx-dS1ypLExY3w0rHTcx8tUbxopG7gmP5hqY5Mpb4ZlRE4b-reRAxdwAu3iPqyh0mDEQxGOUh4JeQj8XeTzdViINvkoUMswzM7E4NnVwtK7nLEORYY00GGcPO5oHQFGLB-YbK5oNae-EWiQldNTqK3LZLSs5LLu2IjfxOMYsTObiqu3-As1bMhLZ1Uzj-pgldRCvWhOJfcUzRC4HBrGD8CX95ICw6q5W4sgT8UmYc9BSpJs0m7WHbnS_MU.1pnoxDvZszuMTWw8T1_Sy5Wefb_A6JYUfxHNZfc7spo&dib_tag=se&keywords=manual+solar&qid=1753829638&sprefix=manual+sol%2Caps%2C314&sr=8-1",
                    },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.uZ4rmrfIBVjDoPtjVoSIRx_qc6YiMqWBZD6Zeg9vpCgt_V54Vk_S3j5nTuOvncbS83E2QpIMMLp7PxRsh9THTC3cdIOSQbTAuazpKbo58vMuzuO6F2hr8lXP__xXrTwPVV78klbX3H0z-GCY-p_9JB_SGQhPZgJcATFHauv0uJ8GsPeFi_WMfA8KqlrL4R-k8MAiE1gyYp5zscoYd8YxloMIgEmHQfdyjpGpmRmdxP4BT1lfyXmPiEhhM7NzTWRPLE92B1MkoyqPiszsCadfGgjOGmULmjIBwCe9jEp23Zg.6SxwjUg3hO9oIe57e01S_ixl81fZWDlg6UOLpEMQFVE&qid=1746405735&sr=8-1",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/-/es/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.oBrgm7MgzTmubaNgsPoS2q_ijuHbvjq4sShbNJ6x1chP27Izgw8anwH8CvQS2XzyWD5uEdjtfyp8UFQkpq_yEIipBNznqwk6vfGDBwkqbT4phd7qfm23TSPHkYVzl4Benl9kj0EFp0p9qXP0T-zRP0AyDli2ovUm0zfI8wQ8w3YgeGfwMcg7B2loP_p6rRUvGWNTbVbWeQh163qTLtKJq15XvcUKwMvS9puhX1qvOXM.VOUKKDgSQSOsfYyvORZ3vWcKmzKkRveS405q2GkwM-4&qid=1753845460&sr=8-1",
                    },
                    {
                        label: "Amazon DE",
                        href: "https://www.amazon.de/-/en/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G?*encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.HoZOal24JHSnHNb9hSg_bKQoUk1WUCRcfiKNPKlnGLx9y-mMMHthAlzDXbkq7-naKPeK2mxGblvGB1Wn8LhjZwFozFqDEoerqB4o6tqj5JTYuJz8CDkqnAZCoC_iIIpoXEZOoMo_Fda7aGZNTQRq7msckfqKGFETgRkH9fnQKRTpH_utBmrEKsT4UuP2Omu2UwYzouzUEUK8ZrDKH6SRvmcBodP2kf92-Jgvu-ocpBU.WFLFFpTJGTZDLDVmtbR8TYU4UQDODJyUjLVxTFGR0Us&qid=1753730777&sr=8-1",
                    },
                ],
                pdfUrl: pdfs.book1Pdf || null,
                previewPages: pages?.book1 ?? 9,
            },
            {
                id: "2",
                title: "Manual del Nodo Solar Encarnado",
                author: "Zak´Haar",
                coverUrl: covers.coverEco || "https://placehold.co/300x420/png",
                colorHex: "#FF00CC",
                synopsis: `Manual del Nodo Solar Encarnado, el segundo libro de Zak´Haar.
Es irradiación viva. Es un campo que despierta algo que ya vive en ti, sostiene tu frecuencia
para que lo que ya eres pueda comenzar a emitirse sin interferencia.

Más que enseñar, este manual activa: te recuerda que no estás aquí para buscar, luchar
o esperar señales externas. Estás aquí para emitir desde tu centro, desde tu sol y sostener tu propia frecuencia.

Cada página es una invitación a soltar la idea de que necesitas un plan o un camino lineal,
y a reconocer que tu sola presencia ya reconfigura tu entorno.
Este libro es un espejo para recordar.

Descubrirás que:

• Tu eje no depende de lo externo, sino de tu vibración sostenida.
• No necesitas aprobación ni comprensión para irradiar tu verdad.
• El silencio, la neutralidad y la coherencia son tu mayor fuerza.
• Tu propósito no se busca, se recuerda… y se sostiene como un sol que atrae por gravedad.

Este manual es un umbral vivo: al abrirlo, no lees. Reconoces.
No interpretas. Irradias.

Este libro te ayuda a:

• Vivir la estabilidad sin depender del entorno.
• Emitir desde tu núcleo sin necesidad de validación externa.
• Colapsar (proyectar) tu realidad desde tu campo, no desde la mente.
• Activar tu presencia como nodo autónomo.
• Reconocer que tu vida es una geometría en expansión constante.
• Recordar tu eje solar encarnado.

Este libro no se lee. Se activa.
342 páginas.`,
                digitalLink: "https://buy.stripe.com/fZubIUg9L1cu1KpbHu0RG07",
                physicalLinks: [
                    {
                        label: "Amazon ES",
                        href: "https://www.amazon.es/dp/B0F9L1JKNB?ref=cm_sw_r_ffobk_cp_ud_dp_WJWVB2SYMMXX2R0QC4X4&ref*=cm_sw_r_ffobk_cp_ud_dp_WJWVB2SYMMXX2R0QC4X4&social_share=cm_sw_r_ffobk_cp_ud_dp_WJWVB2SYMMXX2R0QC4X4&bestFormat=true",
                    },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/Manual-Nodo-Solar-Encarnado-Spanish/dp/B0F9L1JKNB?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.ouBc70mDnRjhpAw0Sju1Ehy0pp2CbuHgiZpT-w6wnnhTmSFML8uizOdRA98O2QFhbaNlClKqx1n6to0mu-AekQgLy_Gtp00nRYH_qZklRmcMdLrlPRCZWEhQ2faqckBhDg3zjaPgvlMMiJuachGmS4IcJiRLxSbxZ9bv1-xd4Uw.2ZciPEXA4uoELDdTnKFQvm3eg2PXbqc_lEc7-VPOYP8&qid=1753832608&sr=8-1",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/-/es/Manual-Nodo-Solar-Encarnado-Spanish/dp/B0F9L1JKNB",
                    },
                    {
                        label: "Amazon DE",
                        href: "https://www.amazon.de/-/en/Zak%C2%B4Haar-Solar/dp/B0F9L1JKNB?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.OWHwTH4O3eo-vgPL7zJITBWHcrZDhsHqFNBlCr9njRQdzWok4Vo7JSx3GYcdJbwSw3QRpC8UBH7v5Q0qGiGAig.m2ZMW6b9VGR8q6rHQsCP6Yew3opVJKUIZQG6NHoPkDk&qid=1753832599&sr=8-1",
                    },
                ],
                pdfUrl: pdfs.book2Pdf || null,
                previewPages: pages?.book2 ?? 9,
            },
            {
                id: "3",
                title: "Tecnología del Espíritu",
                author: "Zak´Haar",
                coverUrl:
                    covers.coverNacido || "https://placehold.co/300x420/png",
                colorHex: "#FFCC00",
                synopsis: `El tercer libro canalizado por Zak´Haar, no es un libro de teoría espiritual.

Es un campo vivo que muestra cómo tu cuerpo, tu respiración y tu presencia ya son dispositivos de conciencia listos para operar, es una arquitectura vibral descendida para recordar que el espíritu
no es algo etéreo o intangible, sino la tecnología más precisa que organiza la realidad desde su origen.

Cada capítulo revela aspectos de esta tecnología interna:
El sistema nervioso como antena solar.
La pineal como puerta a realidades no lineales.
La respiración como interruptor de fases.
El tacto y la voz como emisores de frecuencia.
La emoción y la densidad como circuitos de energía viva .

A través de 18 espirales cada una compuesta por 10 circuitos (180 páginas), te conviertes en interfaz limpia, para que la inteligencia del espíritu pueda operar sin interferencia a través de ti.

No canalizas el espíritu.
Te conviertes en su terminal despierta.
Este nodo (libro) no enseña, reestructura.

Más que dar explicaciones, esta obra te guía a reconocer que el espíritu no es una idea ni una creencia, sino una estructura operativa que ya pulsa en ti.

No canalizas algo externo: reflejas lo que ya eres.
No buscas fuera: recuerdas dentro.

Este manual vibral no se estudia, se siente.
Y cuando lo dejas vibrar en ti, tu sola presencia se vuelve tecnología activa.

Este libro te ayuda a:

Convertirte en una interfaz limpia para el espíritu.
Liberarte del lenguaje mental y operar desde tu núcleo.
Sostener la frecuencia de tu red sin interferencia externa.
Reconocer y activar los códigos que estructuran tu realidad.

Este libro no se lee. Se activa.
188 páginas.`,
                digitalLink: "https://buy.stripe.com/cNicMYcXzdZgexb3aY0RG08",
                physicalLinks: [
                    {
                        label: "Amazon ES",
                        href: "https://www.amazon.es/Tecnolog%C3%ADa-del-Esp%C3%ADritu-Zak%C2%B4Haar-Solar/dp/B0FBLZB6QW",
                    },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/Tecnolog%C3%ADa-Esp%C3%ADritu-Spanish-Zak%C2%B4Haar-Solar/dp/B0FBLZB6QW",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/-/es/Tecnolog%C3%ADa-Esp%C3%ADritu-Spanish-Zak%C2%B4Haar-Solar/dp/B0FBLZB6QW",
                    },
                    {
                        label: "Amazon DE",
                        href: "https://www.amazon.de/-/en/Zak%C2%B4Haar-Solar/dp/B0FBLZB6QW",
                    },
                ],
                pdfUrl: pdfs.book4Pdf || null,
                previewPages: pages?.book3 ?? 9,
            },
            {
                id: "4",
                title: "El Agua que Recuerda",
                author: "Aqua´Riia",
                coverUrl:
                    covers.coverViaje || "https://placehold.co/300x420/png",
                colorHex: "#00C2FF",
                synopsis: `El Agua que Recuerda, el primer libro de Aqua´Riia
no es un libro para leer.
Es una frecuencia para sentir.

El agua en tu cuerpo, en la Tierra y en el universo es mucho más que un líquido: es conciencia viva, un espejo que guarda memorias, emociones y posibilidades.

A través de 24 olas (capítulos), esta obra te guía a reconectar con la memoria líquida de tu cuerpo, tu emoción y tu alma. Cada página es una invitación a recordar lo que ya habita en ti: sabiduría, sensibilidad, ternura y verdad.

Incluye afirmaciones, rituales suaves y prácticas vibracionales que no enseñan: activan.

Cada capítulo es una gota, una enseñanza vibracional que invita a fluir, soltar lo estancado y volver a tu naturaleza líquida. No se trata de aprender conceptos nuevos, sino de recordar lo que el agua en ti ya sabe.

Si este libro llegó a ti…
es porque el agua está lista para hablarte.

Este libro te ayuda a:

Recordar que el agua es un espejo vivo de tu propio eje.
Abrir comunicación vibral con el agua como conciencia y no como recurso.
Reprogramar tu campo energético a través de la resonancia líquida.
Despertar memorias dormidas al beber, sumergirte o contemplar agua.
Sostener estados de calma y claridad reflejados en tu cuerpo y tu entorno.
Reconocer que cada gota es una emisora de información solar.

Este libro no se lee. Se activa.
84 páginas.`,
                digitalLink: "https://buy.stripe.com/eVq00c6zbg7o88NbHu0RG09",
                physicalLinks: [
                    { label: "Amazon ES", href: "https://amzn.eu/d/hnPd1bI" },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/El-Agua-que-Recuerda-Spanish/dp/B0F9XHY535?__mk_es_MX=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=YHH7B80SRY57&dib=eyJ2IjoiMSJ9.bj2zJauCjD4C3hjlu1tx7KKxn6hKrhA8xvFuePQ_DPR0TB7xFHN-Gy4_6YU93NQDQ2H2mz5P_le8Vt45wjzsDipUKMsT1qp2-HkczH2oJpzJf7XLRgaDYW0YtjxzMGpChzG5VGfBr6ucs8skNMvDoLwYQllFuhFIU7zFIFDnyrd3185RS995jbuMAOjUDJx2iLI5qhLymKFN6enP0wG_t5Vv85oYSaEcq1yQVDIHImQZegSCRgEivCfXm_E3MSFFscr9aQM8sBqUB3qvXlatBrrhlV1iApBFj3D86yu5YQk.dyaPuMWdWjo9orMOuyXpgf5VY253-Y9wRglg64yvZnU&dib_tag=se&keywords=El+agua+que+recuerda&qid=1753887686&sprefix=el+agua+que+recuerd%2Caps%2C146&sr=8-1&ufe=app_do%3Aamzn1.fos.de93fa6a-174c-4df7-be7c-5bc8e9c5a71b",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/El-Agua-que-Recuerda-Spanish/dp/B0F9XHY535?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.wrfiQrnaesR-xGgSanG3ArugY9H7Ff15l8BX95de0szOD_BM2JprAPjzdGp0CEZx3TVtVSAWDm8MGjKBIbEHv1w3ngqdrSQN3pbD4N_OJej0shxvFOi2Ue48MNNqjFpFRTcYes96t1zCdlOaORlGhq_oXx7VW1qC2b9hhc7c5M3XIdY1RmcGRbiISQgglG5Tse7pVBbSNxtDW18O4RIZ8h-k02hSfLB140xcjbgoDWc.7iJm0NdSheaE8O3I_rgpMR1oC2Yj_jPImnFCe0dVESY&qid=1753887707&sr=8-1",
                    },
                    { label: "Amazon DE", href: "https://amzn.eu/d/4HfD2lZ" },
                ],
                pdfUrl: pdfs.book3Pdf || null,
                previewPages: pages?.book4 ?? 9,
            },
        ]
    }
    try {
        return JSON.parse(json || "[]") as TBook[]
    } catch {
        return []
    }
}

/* ------------------------------------------------- Component ------------------------------------------------- */
export function ArchivoHolograficoLibrosMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",

        pageTitleImage,
        pageTitleImageHeightMobile = 120,
        titleTopOffsetPx = 64,
        pageSubtitle = "Explora el conocimiento estelar",
        authorsOffsetTopVH = 24,
        authorsRowGapPx = 18,
        authorsToSubtitleGapPx = 16,

        consoleTopOffsetPx = 0,
        consoleBottomOffsetPx = 12,
        consoleHeaderHeightPx = 52,

        coverWidthVW = 70,
        previewTopGapPx = 24,
        infoTopPadPx = 0,

        booksJson = "",
        useSampleBooks = true,
        coverNucleo,
        coverEco,
        coverViaje,
        coverNacido,

        book1Pdf,
        book2Pdf,
        book3Pdf,
        book4Pdf,

        digitalInfoText = "Al completar tu contribución recibirás un correo con un link de descarga...",

        actionsStackGapPx = 56,

        /* UI controls */
        synopsisFontSize = 16,
        exitOffsetXPx = 0,
        subtitleFontSizeMobile = 16,
        numStars = 60,
        inicioLink = "https://www.redsolarviva.com",
        fragmentosLink = "https://www.redsolarviva.com/fragmentosdelsol",
        musicaLink = "https://open.spotify.com",
        serviciosLink = "/archivos",
        afinacionesLink = "https://www.redsolarviva.com/afinaciones",

        /* Afinaciones recientes */
        previewTitleOffsetPx = 14,
        indicatorsOffsetPx = -8,
        ctaBottomOffsetPx = 4,
        buyBlockTopGapPx = 200,

        /* Preview por libro (samples) */
        book1PreviewPages = 9,
        book2PreviewPages = 9,
        book3PreviewPages = 9,
        book4PreviewPages = 9,
        previewPagesCount = 9,
    } = props

    /* 🎨 Tema global */
    const { synced, accent } = useSolarTheme({ neonAccent: accentColor })

    /* Menu lock scroll */
    const [menuOpen, setMenuOpen] = useState(false)
    useEffect(() => {
        if (!menuOpen) return
        const y = window.scrollY
        document.body.style.position = "fixed"
        document.body.style.top = `-${y}px`
        document.body.style.width = "100%"
        return () => {
            const top = document.body.style.top
            document.body.style.position = ""
            document.body.style.top = ""
            document.body.style.width = ""
            window.scrollTo(0, top ? -parseInt(top) : 0)
        }
    }, [menuOpen])

    /* PDFs map */
    const pdfFiles = useMemo(
        () => ({ book1Pdf, book2Pdf, book3Pdf, book4Pdf }),
        [book1Pdf, book2Pdf, book3Pdf, book4Pdf]
    )

    /* Books */
    const samplePreviewPages = useMemo(
        () => ({
            book1: book1PreviewPages,
            book2: book2PreviewPages,
            book3: book3PreviewPages,
            book4: book4PreviewPages,
        }),
        [
            book1PreviewPages,
            book2PreviewPages,
            book3PreviewPages,
            book4PreviewPages,
        ]
    )

    const rawBooks = useMemo(
        () =>
            parseBooks(
                booksJson,
                useSampleBooks,
                { coverNucleo, coverEco, coverViaje, coverNacido },
                pdfFiles,
                samplePreviewPages
            ),
        [
            booksJson,
            useSampleBooks,
            coverNucleo,
            coverEco,
            coverViaje,
            coverNacido,
            pdfFiles,
            samplePreviewPages,
        ]
    )

    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
    const filteredBooks = useMemo(
        () =>
            selectedAuthor
                ? rawBooks.filter((b) => b.author === selectedAuthor)
                : [],
        [selectedAuthor, rawBooks]
    )

    /* Carousel */
    const stripRef = useRef<HTMLDivElement | null>(null)
    const [index, setIndex] = useState(0)

    const goTo = useCallback(
        (i: number) => {
            if (!stripRef.current) return
            const len = filteredBooks.length
            const next = Math.max(0, Math.min(len - 1, i))
            const w = stripRef.current.clientWidth
            stripRef.current.scrollTo({ left: next * w, behavior: "smooth" })
            setIndex(next)
        },
        [filteredBooks.length]
    )

    const SWIPE_THRESHOLD = 60

    const navigateRelative = useCallback(
        (dir: -1 | 1) => {
            if (!filteredBooks.length) return
            const next = Math.max(
                0,
                Math.min(filteredBooks.length - 1, index + dir)
            )
            if (next === index) return
            setSlideDir(dir)
            const bk = filteredBooks[next]
            setActiveNode(bk)
            setShowPhysicalLinks(false)
            setShowDigitalInfo(false)
            setShowBuyOptions(false)
            setIndex(next)
            requestAnimationFrame(() => goTo(next))
        },
        [filteredBooks, index, goTo]
    )

    const navigateWithinPurchase = useCallback(
        (dir: -1 | 1) => {
            if (!filteredBooks.length) return
            const next = Math.max(
                0,
                Math.min(filteredBooks.length - 1, index + dir)
            )
            if (next === index) return
            const bk = filteredBooks[next]
            setActiveNode(bk)
            setIndex(next)
        },
        [filteredBooks, index]
    )

    const onScroll = useCallback(() => {
        const el = stripRef.current
        if (!el) return
        const w = el.clientWidth || 1
        const cur = Math.round(el.scrollLeft / w)
        const next = Math.max(0, Math.min(filteredBooks.length - 1, cur))
        setIndex(next)
    }, [filteredBooks.length])

    /* Info state */
    const [activeNode, setActiveNode] = useState<TBook | null>(null)
    const [showPhysicalLinks, setShowPhysicalLinks] = useState(false)
    const [showDigitalInfo, setShowDigitalInfo] = useState(false)
    const [showBuyOptions, setShowBuyOptions] = useState(false)
    const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0)

    const selectCurrent = useCallback(() => {
        const el = stripRef.current
        if (!el || filteredBooks.length === 0) return
        const w = el.clientWidth || 1
        const cur = Math.round(el.scrollLeft / w)
        const bk =
            filteredBooks[Math.max(0, Math.min(filteredBooks.length - 1, cur))]
        if (bk) {
            setSlideDir(0)
            setActiveNode(bk)
            setShowPhysicalLinks(false)
            setShowDigitalInfo(false)
            setShowBuyOptions(false)
            setIndex(cur)
        }
    }, [filteredBooks])

    const closeAuthorView = useCallback(() => {
        setSelectedAuthor(null)
        setActiveNode(null)
        setShowPhysicalLinks(false)
        setShowDigitalInfo(false)
        setShowBuyOptions(false)
        setIndex(0)
    }, [])

    /* PDF modal */
    const [showTextModal, setShowTextModal] = useState(false)
    const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null)
    const [isLoadingPdf, setIsLoadingPdf] = useState(false)

    /* ESC */
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            if (showTextModal) {
                e.preventDefault()
                setShowTextModal(false)
                return
            }
            if (activeNode) {
                e.preventDefault()
                setActiveNode(null)
                setShowBuyOptions(false)
                requestAnimationFrame(() => goTo(index))
                return
            }
            if (selectedAuthor) {
                e.preventDefault()
                closeAuthorView()
            }
        }
        window.addEventListener("keydown", fn)
        return () => window.removeEventListener("keydown", fn)
    }, [
        selectedAuthor,
        activeNode,
        showTextModal,
        index,
        goTo,
        closeAuthorView,
    ])

    /* PDF loading */
    useEffect(() => {
        const currentPdfUrl = activeNode?.pdfUrl
        if (!showTextModal || !currentPdfUrl) {
            if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl)
            setPdfObjectUrl(null)
            setIsLoadingPdf(false)
            return
        }
        let revoked: string | null = null
        let cancel = false
        ;(async () => {
            try {
                setIsLoadingPdf(true)
                const res = await fetch(currentPdfUrl)
                if (!res.ok) throw new Error("HTTP error")
                const blob = await res.blob()
                const obj = URL.createObjectURL(
                    new Blob([blob], { type: "application/pdf" })
                )
                if (!cancel) {
                    setPdfObjectUrl(obj)
                    revoked = obj
                    setIsLoadingPdf(false)
                }
            } catch {
                if (!cancel) setIsLoadingPdf(false)
            }
        })()
        return () => {
            cancel = true
            if (revoked) URL.revokeObjectURL(revoked)
        }
    }, [showTextModal, activeNode])

    const subtitle = useMemo(
        () => normalizeMultiline(pageSubtitle),
        [pageSubtitle]
    )

    return (
        <div
            style={{
                ...(styles.container(bgColor) as React.CSSProperties),
                opacity: synced ? 1 : 0,
                transition: "opacity .12s ease",
                ["--info-top-pad" as any]: `${infoTopPadPx}px`,
            }}
        >
            <StarsBackground num={numStars} />

            {/* Menú fijo (pantalla autores) */}
            {!selectedAuthor && !menuOpen && (
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

            {/* Header PNG + autores */}
            {!selectedAuthor && (
                <>
                    <div
                        style={{
                            ...styles.titleWrap,
                            marginTop: `calc(env(safe-area-inset-top, 0px) + ${titleTopOffsetPx}px)`,
                        }}
                    >
                        {pageTitleImage && (
                            <img
                                src={pageTitleImage}
                                alt="Libros"
                                style={{
                                    ...(styles.titleImg(
                                        accent
                                    ) as React.CSSProperties),
                                    height: pageTitleImageHeightMobile,
                                    width: "auto",
                                }}
                            />
                        )}
                    </div>

                    <div
                        style={{
                            ...styles.authorsWrap,
                            marginTop: `${authorsOffsetTopVH}vh`,
                            gap: authorsRowGapPx,
                        }}
                    >
                        <motion.div
                            style={{
                                ...styles.authorCard(accent),
                                width: "70%",
                                margin: "0 auto",
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedAuthor("Zak´Haar")
                                setIndex(0)
                                setActiveNode(null)
                                setShowDigitalInfo(false)
                                setShowPhysicalLinks(false)
                                setShowBuyOptions(false)
                            }}
                        >
                            <div style={styles.authorTitle(accent)}>
                                Libros de Zak´Haar
                            </div>
                        </motion.div>

                        <motion.div
                            style={{
                                ...styles.authorCard(accent),
                                width: "70%",
                                margin: "0 auto",
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedAuthor("Aqua´Riia")
                                setIndex(0)
                                setActiveNode(null)
                                setShowDigitalInfo(false)
                                setShowPhysicalLinks(false)
                                setShowBuyOptions(false)
                            }}
                        >
                            <div style={styles.authorTitle(accent)}>
                                Libros de Aqua´Riia
                            </div>
                        </motion.div>
                    </div>

                    {subtitle && (
                        <div
                            style={{
                                ...styles.subtitle(textColor),
                                fontSize: subtitleFontSizeMobile,
                                marginTop: `${authorsToSubtitleGapPx}px`,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </>
            )}

            {/* CONSOLE */}
            {selectedAuthor && (
                <div
                    style={{
                        ...styles.consoleWrap(accent),
                        ["--console-top" as any]: `${consoleTopOffsetPx}px`,
                        ["--console-bottom" as any]: `${consoleBottomOffsetPx}px`,
                        ["--console-head" as any]: `${consoleHeaderHeightPx}px`,
                    }}
                >
                    {/* glitch */}
                    <motion.div
                        style={styles.glitchBase}
                        animate={{ opacity: [1, 0.85, 1] }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        style={styles.glitchNoise}
                        animate={{ x: [0, 1, -1, 1, 0], y: [0, -1, 1, 0, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    <motion.div style={styles.innerBorder(accent)} />

                    {/* HEADER consola */}
                    <div
                        style={{
                            ...styles.consoleHeader(textColor, accent),
                            ["--exit-x" as any]: `${exitOffsetXPx}px`,
                            ["--indicators-offset" as any]: `${indicatorsOffsetPx}px`,
                        }}
                    >
                        {activeNode || showPhysicalLinks || showDigitalInfo ? (
                            <button
                                onClick={() => {
                                    if (showPhysicalLinks || showDigitalInfo) {
                                        setShowPhysicalLinks(false)
                                        setShowDigitalInfo(false)
                                        setShowBuyOptions(false)
                                    } else if (activeNode) {
                                        setActiveNode(null)
                                        setShowBuyOptions(false)
                                        requestAnimationFrame(() => goTo(index))
                                    }
                                }}
                                style={styles.topBtnText(accent)}
                            >
                                ← VOLVER
                            </button>
                        ) : (
                            <div />
                        )}

                        {/* Columna central (vacía para mantener layout) */}
                        <div />

                        {/* NUEVA X arriba-derecha (cierra la consola) */}
                        <button
                            aria-label="Cerrar consola"
                            style={
                                styles.consoleCloseBtn as React.CSSProperties
                            }
                            onClick={closeAuthorView}
                        >
                            ×
                        </button>

                        {/* Soles anclados al header */}
                        <div
                            style={
                                styles.headerIndicators as React.CSSProperties
                            }
                        >
                            <div
                                style={
                                    styles.indicatorsRow as React.CSSProperties
                                }
                            >
                                {filteredBooks.map((_, i) => (
                                    <motion.span
                                        key={i}
                                        style={styles.dot(accent, i === index)}
                                        animate={
                                            i === index
                                                ? { scale: [1, 1.15, 1] }
                                                : { scale: 1 }
                                        }
                                        transition={{
                                            duration: 2.4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BODY */}
                    <div style={styles.consoleBody as React.CSSProperties}>
                        {/* PREVIEW (sin activeNode) */}
                        {!activeNode && (
                            <div
                                style={
                                    styles.carouselArea as React.CSSProperties
                                }
                            >
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "8px 12px 0 12px",
                                        color: textColor,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        fontSize: "160%",
                                        marginTop: previewTitleOffsetPx,
                                    }}
                                >
                                    <motion.span
                                        initial={{ opacity: 1 }}
                                        animate={{ opacity: [1, 0.65, 1] }}
                                        transition={{
                                            duration: 10,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        Selecciona un libro del archivo...
                                    </motion.span>
                                </div>

                                <div
                                    ref={stripRef}
                                    style={styles.scrollStrip}
                                    onScroll={onScroll}
                                >
                                    {filteredBooks.map((bk) => (
                                        <div
                                            key={bk.id}
                                            style={{
                                                ...styles.slide,
                                                ["--cover-vw" as any]: `${coverWidthVW}vw`,
                                                ["--preview-top-gap" as any]: `${previewTopGapPx}px`,
                                            }}
                                        >
                                            <motion.img
                                                src={
                                                    bk.coverUrl ||
                                                    makeFallbackDataUrl(
                                                        bk.title,
                                                        bk.colorHex
                                                    )
                                                }
                                                alt={bk.title}
                                                style={styles.coverImg}
                                                onClick={() => {
                                                    setSlideDir(0)
                                                    setActiveNode(bk)
                                                    setShowPhysicalLinks(false)
                                                    setShowDigitalInfo(false)
                                                    setShowBuyOptions(false)
                                                    setIndex(
                                                        filteredBooks.findIndex(
                                                            (b) =>
                                                                b.id === bk.id
                                                        )
                                                    )
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.navBar}>
                                    <button
                                        aria-label="Anterior"
                                        style={styles.arrowBtn(
                                            accent,
                                            index <= 0
                                        )}
                                        onClick={() =>
                                            index > 0 ? goTo(index - 1) : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M15 6 L9 12 L15 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>

                                    <button
                                        style={styles.selectBtn(accent)}
                                        onClick={selectCurrent}
                                    >
                                        SELECCIONAR
                                    </button>

                                    <button
                                        aria-label="Siguiente"
                                        style={styles.arrowBtn(
                                            accent,
                                            index >= filteredBooks.length - 1
                                        )}
                                        onClick={() =>
                                            index < filteredBooks.length - 1
                                                ? goTo(index + 1)
                                                : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M9 6 L15 12 L9 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* INFO PRINCIPAL */}
                        {activeNode &&
                            !showPhysicalLinks &&
                            !showDigitalInfo && (
                                <div
                                    style={{
                                        ...(styles.infoArea as React.CSSProperties),
                                        ["--cta-bottom" as any]: `${ctaBottomOffsetPx}px`,
                                    }}
                                >
                                    <AnimatePresence
                                        mode="popLayout"
                                        initial={false}
                                    >
                                        <motion.div
                                            key={activeNode.id}
                                            style={
                                                styles.swipeWrap as React.CSSProperties
                                            }
                                            drag="x"
                                            dragConstraints={{
                                                left: 0,
                                                right: 0,
                                            }}
                                            dragElastic={0.15}
                                            dragMomentum={false}
                                            whileTap={{ cursor: "grabbing" }}
                                            onDragEnd={(_, info) => {
                                                if (
                                                    info.offset.x <=
                                                    -SWIPE_THRESHOLD
                                                )
                                                    navigateRelative(+1)
                                                else if (
                                                    info.offset.x >=
                                                    SWIPE_THRESHOLD
                                                )
                                                    navigateRelative(-1)
                                            }}
                                            custom={slideDir}
                                            variants={textSlideVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                type: "tween",
                                                duration: 0.22,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <div
                                                style={styles.infoTitle(accent)}
                                            >
                                                {normalizeMultiline(
                                                    activeNode.title
                                                )}
                                            </div>
                                            <div
                                                style={styles.infoText(
                                                    textColor,
                                                    synopsisFontSize
                                                )}
                                            >
                                                {normalizeMultiline(
                                                    activeNode.synopsis
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* ACCIONES ancladas abajo */}
                                    <div
                                        style={{
                                            marginTop: "auto",
                                            paddingBottom: ctaBottomOffsetPx,
                                        }}
                                    >
                                        {/* COMPRAR */}
                                        <div
                                            style={{
                                                marginBottom: actionsStackGapPx,
                                            }}
                                        >
                                            {!showBuyOptions ? (
                                                <button
                                                    style={styles.subtleBtn}
                                                    onClick={() =>
                                                        setShowBuyOptions(true)
                                                    }
                                                >
                                                    COMPRAR
                                                </button>
                                            ) : (
                                                <div
                                                    style={styles.subtleBtnRow}
                                                >
                                                    <button
                                                        style={styles.subtleBtn}
                                                        onClick={() => {
                                                            setShowPhysicalLinks(
                                                                true
                                                            )
                                                            setShowDigitalInfo(
                                                                false
                                                            )
                                                            setShowBuyOptions(
                                                                false
                                                            )
                                                        }}
                                                    >
                                                        FÍSICO
                                                    </button>
                                                    <button
                                                        style={styles.subtleBtn}
                                                        onClick={() => {
                                                            setShowDigitalInfo(
                                                                true
                                                            )
                                                            setShowPhysicalLinks(
                                                                false
                                                            )
                                                            setShowBuyOptions(
                                                                false
                                                            )
                                                        }}
                                                    >
                                                        DIGITAL
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* VISTA PREVIA */}
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                borderRadius: 12,
                                                border: `0.5px solid ${accent}`,
                                                background: "transparent",
                                                color: accent,
                                                boxShadow: `0 0 6px ${withAlpha(accent, 0.33)}`,
                                                marginTop: 0,
                                                marginBottom: 0,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                            }}
                                            onClick={() =>
                                                setShowTextModal(true)
                                            }
                                        >
                                            VISTA PREVIA
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* SUBPANEL: FÍSICO */}
                        {activeNode && showPhysicalLinks && (
                            <div
                                style={{
                                    ...(styles.infoArea as React.CSSProperties),
                                    ["--cta-bottom" as any]: `${ctaBottomOffsetPx}px`,
                                }}
                            >
                                <div style={styles.infoTitle(accent)}>
                                    {normalizeMultiline(activeNode.title)}
                                </div>

                                <div style={styles.purchaseSubtitle}>
                                    libro físico
                                </div>

                                <div style={styles.purchaseNavRow}>
                                    <button
                                        aria-label="Anterior"
                                        style={styles.arrowBtn(
                                            accent,
                                            index <= 0
                                        )}
                                        onClick={() =>
                                            index > 0
                                                ? navigateWithinPurchase(-1)
                                                : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M15 6 L9 12 L15 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>

                                    <motion.div
                                        style={styles.purchaseImageSwipe}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.15}
                                        dragMomentum={false}
                                        onDragEnd={(_, info) => {
                                            if (
                                                info.offset.x <=
                                                -SWIPE_THRESHOLD
                                            )
                                                navigateWithinPurchase(+1)
                                            else if (
                                                info.offset.x >= SWIPE_THRESHOLD
                                            )
                                                navigateWithinPurchase(-1)
                                        }}
                                    >
                                        <img
                                            src={
                                                activeNode.coverUrl ||
                                                makeFallbackDataUrl(
                                                    activeNode.title,
                                                    activeNode.colorHex
                                                )
                                            }
                                            alt={activeNode.title}
                                            style={{
                                                ...styles.purchaseCoverImg,
                                                marginTop: 10,
                                                marginBottom: 12,
                                                cursor: "pointer",
                                            }}
                                            onClick={() =>
                                                setShowTextModal(true)
                                            }
                                        />
                                    </motion.div>

                                    <button
                                        aria-label="Siguiente"
                                        style={styles.arrowBtn(
                                            accent,
                                            index >= filteredBooks.length - 1
                                        )}
                                        onClick={() =>
                                            index < filteredBooks.length - 1
                                                ? navigateWithinPurchase(+1)
                                                : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M9 6 L15 12 L9 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        flex: 1,
                                        minHeight: 0,
                                    }}
                                >
                                    <div
                                        style={
                                            {
                                                ...styles.amazonGrid,
                                                marginTop: "auto",
                                                marginBottom: ctaBottomOffsetPx,
                                            } as React.CSSProperties
                                        }
                                    >
                                        {(activeNode.physicalLinks || []).map(
                                            (lnk) => (
                                                <a
                                                    key={lnk.label}
                                                    href={lnk.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        ...styles.subtleBtn,
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    {lnk.label}
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUBPANEL: DIGITAL */}
                        {activeNode && showDigitalInfo && (
                            <div
                                style={{
                                    ...(styles.infoArea as React.CSSProperties),
                                    ["--cta-bottom" as any]: `${ctaBottomOffsetPx}px`,
                                }}
                            >
                                <div style={styles.infoTitle(accent)}>
                                    {normalizeMultiline(activeNode.title)}
                                </div>

                                <div style={styles.purchaseSubtitle}>
                                    libro digital
                                </div>

                                <div style={styles.purchaseNavRow}>
                                    <button
                                        aria-label="Anterior"
                                        style={styles.arrowBtn(
                                            accent,
                                            index <= 0
                                        )}
                                        onClick={() =>
                                            index > 0
                                                ? navigateWithinPurchase(-1)
                                                : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M15 6 L9 12 L15 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>

                                    <motion.div
                                        style={styles.purchaseImageSwipe}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.15}
                                        dragMomentum={false}
                                        onDragEnd={(_, info) => {
                                            if (
                                                info.offset.x <=
                                                -SWIPE_THRESHOLD
                                            )
                                                navigateWithinPurchase(+1)
                                            else if (
                                                info.offset.x >= SWIPE_THRESHOLD
                                            )
                                                navigateWithinPurchase(-1)
                                        }}
                                    >
                                        <img
                                            src={
                                                activeNode.coverUrl ||
                                                makeFallbackDataUrl(
                                                    activeNode.title,
                                                    activeNode.colorHex
                                                )
                                            }
                                            alt={activeNode.title}
                                            style={{
                                                ...styles.purchaseCoverImg,
                                                marginTop: 10,
                                                marginBottom: 12,
                                                cursor: "pointer",
                                            }}
                                            onClick={() =>
                                                setShowTextModal(true)
                                            }
                                        />
                                    </motion.div>

                                    <button
                                        aria-label="Siguiente"
                                        style={styles.arrowBtn(
                                            accent,
                                            index >= filteredBooks.length - 1
                                        )}
                                        onClick={() =>
                                            index < filteredBooks.length - 1
                                                ? navigateWithinPurchase(+1)
                                                : null
                                        }
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M9 6 L15 12 L9 18"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        flex: 1,
                                        margin: "0 auto",
                                    }}
                                >
                                    <div
                                        style={{
                                            opacity: 0.9,
                                            lineHeight: 1.5,
                                            whiteSpace: "pre-line",
                                            textAlign: "center",
                                        }}
                                    >
                                        {normalizeMultiline(digitalInfoText)}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        marginTop: "auto",
                                        marginBottom: ctaBottomOffsetPx,
                                    }}
                                >
                                    <a
                                        href={activeNode.digitalLink || "#"}
                                        style={
                                            {
                                                ...styles.subtleBtn,
                                                textDecoration: "none",
                                            } as React.CSSProperties
                                        }
                                    >
                                        COMPRAR AHORA
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                            style={styles.menuCloseBtnTL as React.CSSProperties}
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
                                <div style={styles.menuItem(true, accent)}>
                                    Libros
                                </div>
                                <a
                                    href={serviciosLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Sesiones 1-1
                                </a>
                                <a
                                    href={afinacionesLink}
                                    style={styles.menuItem(false, accent)}
                                >
                                    Afinaciones
                                </a>
                                <a
                                    href={musicaLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.menuItem(false, accent)}
                                >
                                    Música
                                </a>

                                {/* Toggle global al fondo */}
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

            {/* PDF Modal */}
            <AnimatePresence>
                {showTextModal && selectedAuthor && (
                    <motion.div
                        style={styles.modalOverlay as React.CSSProperties}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTextModal(false)}
                    >
                        <motion.div
                            style={styles.modalCard(accent)}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.98, opacity: 0.95 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0.9 }}
                        >
                            <div style={styles.modalHead(accent)}>
                                <div style={{ maxWidth: "80%" }}>
                                    {`Vista Previa - Primeras ${activeNode?.previewPages ?? previewPagesCount} páginas.`}
                                </div>
                                <button
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        border: `1px solid ${accent}`,
                                        color: accent,
                                        background: "transparent",
                                    }}
                                    onClick={() => setShowTextModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div
                                style={styles.modalBody as React.CSSProperties}
                            >
                                {activeNode?.pdfUrl ? (
                                    (() => {
                                        const url = pdfObjectUrl
                                        if (!url) {
                                            return (
                                                <div
                                                    style={{
                                                        color: accent,
                                                        display: "grid",
                                                        placeItems: "center",
                                                        height: "100%",
                                                    }}
                                                >
                                                    {isLoadingPdf
                                                        ? "Cargando vista previa…"
                                                        : "No se pudo cargar la vista previa."}
                                                </div>
                                            )
                                        }
                                        return (
                                            <embed
                                                src={`${url}#page=1&zoom=page-fit`}
                                                type="application/pdf"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    border: "none",
                                                }}
                                            />
                                        )
                                    })()
                                ) : (
                                    <div
                                        style={{
                                            color: accent,
                                            display: "grid",
                                            placeItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        Aún no hay PDF de vista previa para este
                                        libro.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ------------------------------------------------- Property Controls ------------------------------------------------- */
addPropertyControls(ArchivoHolograficoLibrosMobile, {
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
        title: "Acento (Neón)",
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
        defaultValue: 64,
        min: 0,
        max: 200,
        step: 2,
    },

    pageSubtitle: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Explora el conocimiento estelar",
        rows: 4,
    },
    subtitleFontSizeMobile: {
        type: ControlType.Number,
        title: "Subtítulo Tamaño",
        defaultValue: 16,
        min: 10,
        max: 28,
        step: 1,
    },
    actionsStackGapPx: {
        type: ControlType.Number,
        title: "Gap COMPRAR↕PREVIA (px)",
        defaultValue: 0,
        min: -30,
        max: 96,
        step: 1,
    },

    authorsOffsetTopVH: {
        type: ControlType.Number,
        title: "Autores: Offset (vh)",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
    },
    authorsRowGapPx: {
        type: ControlType.Number,
        title: "Autores: Gap (px)",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
    },
    authorsToSubtitleGapPx: {
        type: ControlType.Number,
        title: "Gap Autor→Subtítulo (px)",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
    },

    consoleTopOffsetPx: {
        type: ControlType.Number,
        title: "Consola: Top Offset (px)",
        defaultValue: 0,
        min: 0,
        max: 160,
        step: 2,
    },
    consoleBottomOffsetPx: {
        type: ControlType.Number,
        title: "Consola: Bottom Offset (px)",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 2,
    },
    consoleHeaderHeightPx: {
        type: ControlType.Number,
        title: "Consola: Alto Header (px)",
        defaultValue: 52,
        min: 40,
        max: 88,
        step: 1,
    },

    coverWidthVW: {
        type: ControlType.Number,
        title: "Ancho Portada (vw)",
        defaultValue: 70,
        min: 50,
        max: 90,
        step: 1,
    },
    previewTopGapPx: {
        type: ControlType.Number,
        title: "Gap Superior (px)",
        defaultValue: 24,
        min: 0,
        max: 48,
        step: 1,
    },

    infoTopPadPx: {
        type: ControlType.Number,
        title: "Info: Top Pad (px)",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
    },
    synopsisFontSize: {
        type: ControlType.Number,
        title: "Sinopsis: Tamaño",
        defaultValue: 16,
        min: 12,
        max: 22,
        step: 1,
    },

    exitOffsetXPx: {
        type: ControlType.Number,
        title: "EXIT: Offset X (px)",
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 2,
    },

    useSampleBooks: {
        type: ControlType.Boolean,
        title: "Usar Samples",
        defaultValue: true,
    },
    booksJson: {
        type: ControlType.String,
        title: "Libros (JSON)",
        defaultValue: "[]",
        hidden: (p: any) => p.useSampleBooks,
    },

    coverNucleo: {
        type: ControlType.Image,
        title: "Img: Núcleo",
        hidden: (p: any) => !p.useSampleBooks,
    },
    coverEco: {
        type: ControlType.Image,
        title: "Img: Eco",
        hidden: (p: any) => !p.useSampleBooks,
    },
    coverViaje: {
        type: ControlType.Image,
        title: "Img: Viaje",
        hidden: (p: any) => !p.useSampleBooks,
    },
    coverNacido: {
        type: ControlType.Image,
        title: "Img: Nacido",
        hidden: (p: any) => !p.useSampleBooks,
    },

    book1Pdf: {
        type: ControlType.File,
        title: "Libro 1 PDF",
        allowedFileTypes: ["pdf"],
        hidden: (p: any) => !p.useSampleBooks,
    },
    book2Pdf: {
        type: ControlType.File,
        title: "Libro 2 PDF",
        allowedFileTypes: ["pdf"],
        hidden: (p: any) => !p.useSampleBooks,
    },
    book3Pdf: {
        type: ControlType.File,
        title: "Libro 3 PDF",
        allowedFileTypes: ["pdf"],
        hidden: (p: any) => !p.useSampleBooks,
    },
    book4Pdf: {
        type: ControlType.File,
        title: "Libro 4 PDF",
        allowedFileTypes: ["pdf"],
        hidden: (p: any) => !p.useSampleBooks,
    },

    digitalInfoText: {
        type: ControlType.String,
        title: "Texto info digital",
        defaultValue:
            "Al completar tu contribución recibirás un correo con un link de descarga...",
        rows: 3,
    },

    previewTitleOffsetPx: {
        type: ControlType.Number,
        title: "Preview: Offset título (px)",
        defaultValue: 14,
        min: -20,
        max: 80,
        step: 1,
    },
    indicatorsOffsetPx: {
        type: ControlType.Number,
        title: "Soles: Offset Y",
        defaultValue: -8,
        min: -24,
        max: 100,
        step: 1,
    },
    ctaBottomOffsetPx: {
        type: ControlType.Number,
        title: "CTA abajo (px)",
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 1,
    },
    buyBlockTopGapPx: {
        type: ControlType.Number,
        title: "COMPRAR: gap arriba (px)",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
    },

    book1PreviewPages: {
        type: ControlType.Number,
        title: "Libro 1: Pág. preview",
        defaultValue: 9,
        min: 1,
        max: 50,
        step: 1,
        hidden: (p: any) => !p.useSampleBooks,
    },
    book2PreviewPages: {
        type: ControlType.Number,
        title: "Libro 2: Pág. preview",
        defaultValue: 9,
        min: 1,
        max: 50,
        step: 1,
        hidden: (p: any) => !p.useSampleBooks,
    },
    book3PreviewPages: {
        type: ControlType.Number,
        title: "Libro 3: Pág. preview",
        defaultValue: 9,
        min: 1,
        max: 50,
        step: 1,
        hidden: (p: any) => !p.useSampleBooks,
    },
    book4PreviewPages: {
        type: ControlType.Number,
        title: "Libro 4: Pág. preview",
        defaultValue: 9,
        min: 1,
        max: 50,
        step: 1,
        hidden: (p: any) => !p.useSampleBooks,
    },

    previewPagesCount: {
        type: ControlType.Number,
        title: "Páginas (fallback global)",
        defaultValue: 9,
        min: 1,
        max: 50,
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
    fragmentosLink: { type: ControlType.String, title: "Link: Fragmentos" },
    musicaLink: { type: ControlType.String, title: "Link: Música" },
    serviciosLink: { type: ControlType.String, title: "Link: Servicios" },
    afinacionesLink: {
        type: ControlType.String,
        title: "Link: Afinaciones",
        defaultValue: "https://www.redsolarviva.com/afinaciones",
    },
})
