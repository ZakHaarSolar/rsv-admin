import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* -------------------------------------------------
   Utilidad: fallback SVG si falla la portada
------------------------------------------------- */
const makeFallbackDataUrl = (
    title: string,
    color = "#00C2FF",
    w = 150,
    h = 210
) => {
    const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${color}' stop-opacity='0.35'/>
        <stop offset='100%' stop-color='${color}' stop-opacity='0.1'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='12' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='Inter, system-ui' font-size='14' fill='${color}' opacity='0.85'>
      ${title}
    </text>
  </svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/* -------------------------------------------------
   Utilidad: HEX → rgba
------------------------------------------------- */
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
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

/* -------------------------------------------------
   Normaliza "\n" escrito en Framer a saltos reales
------------------------------------------------- */
const normalizeMultiline = (str: string) => {
    if (!str || typeof str !== "string") return ""
    return str.replace(/\\n/g, "\n")
}

/* -------------------------------------------------
   Estilos centrales
------------------------------------------------- */
const styles = {
    container: (bgColor) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100svh",
        width: "100%",
        background: bgColor,
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        color: "#F0F0F0",
        overflowX: "hidden",
        overflowY: "visible",
        margin: 0,
        willChange: "transform",
    }),

    /* Estrellas */
    starsContainer: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
    },
    star: (size, top, left, delay) => ({
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        background: "white",
        borderRadius: "50%",
        opacity: 0,
        animation: `twinkle ${
            2 + Math.random() * 3
        }s infinite ${delay}s alternate ease-in-out`,
        top: `${top}%`,
        left: `${left}%`,
        boxShadow: `0 0 ${size * 1.5}px ${size * 0.3}px rgba(255, 255, 255, 0.3)`,
    }),
    keyframesTwinkle: `@keyframes twinkle { 0% { opacity: 0.1; } 50% { opacity: 0.6; } 100% { opacity: 0.1; } }`,

    /* NAV */
    navigation: (textColor, accentColor) => ({
        width: "100%",
        padding: "10px 5%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px 25px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 10, 30, 0.6)",
        backdropFilter: "blur(15px)",
        borderBottom: `1px solid ${accentColor}44`,
    }),
    navLink: (textColor) => ({
        color: textColor,
        textDecoration: "none",
        fontSize: "15px",
        padding: "6px 10px",
        borderRadius: "4px",
        transition: "color 0.3s ease, text-shadow 0.3s ease",
        opacity: 0.85,
        cursor: "pointer",
    }),
    navLinkHover: (accentColor) => ({
        color: accentColor,
        opacity: 1,
        textShadow: `0 0 8px ${accentColor}99, 0 0 15px ${accentColor}55`,
    }),
    navLinkActive: (accentColor) => ({
        color: accentColor,
        opacity: 1,
        textShadow: `0 0 8px ${accentColor}99, 0 0 15px ${accentColor}55`,
        border: `1px solid ${accentColor}AA`,
        boxShadow: `0 0 10px ${accentColor}77, 0 0 20px ${accentColor}44`,
    }),

    /* HEADER */
    pageHeaderWrap: {
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 2,
        marginTop: "4vh",
    },
    pageTitleImageWrapper: (heightPx) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        height: `${heightPx}px`,
        minHeight: `${heightPx}px`,
        maxHeight: `${heightPx}px`,
    }),
    pageTitleImageEl: {
        maxWidth: "90vw",
        maxHeight: "100%",
        objectFit: "contain",
        filter: "drop-shadow(0 0 6px rgba(0,194,255,0.6)) drop-shadow(0 0 18px rgba(0,194,255,0.3))",
    },
    pageSubtitleText: (textColor) => ({
        color: textColor,
        fontSize: "1rem",
        fontWeight: 300,
        lineHeight: 1.5,
        textAlign: "center",
        whiteSpace: "pre-line",
        opacity: 0.9,
        maxWidth: "800px",
        margin: "12px auto 0 auto",
    }),

    /* AUTORES */
    authorSelectorContainer: (gapValue, offsetVH = 0) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: gapValue || "6vw",
        padding: "2vh 4vw",
        marginTop: `${offsetVH}vh`,
        minHeight: "30vh",
        width: "100%",
        zIndex: 2,
        position: "relative",
    }),
    authorPanel: (
        accentColor,
        isActive,
        widthPx,
        widthVW,
        maxPx,
        minPx = 160,
        heightVH = 40
    ) => ({
        width: widthPx ? `${widthPx}px` : `${widthVW}vw`,
        maxWidth: maxPx ? `${maxPx}px` : "none",
        minWidth: `${minPx}px`,
        height: `${heightVH}vh`,
        minHeight: 320,
        background: `rgba(5, 10, 20, 0.8)`,
        border: `2px solid ${accentColor}`,
        borderRadius: "16px",
        boxShadow: `0 0 15px ${accentColor}77, 0 0 30px ${accentColor}44, 0 10px 20px rgba(0,0,0,0.5)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition:
            "background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
        transform: isActive ? "scale(1.05)" : "scale(1)",
        backdropFilter: "blur(8px)",
        position: "relative",
        overflow: "hidden",
    }),
    authorText: (accentColor) => ({
        fontSize: "2rem",
        color: accentColor,
        textAlign: "center",
        whiteSpace: "pre-line",
        overflowWrap: "normal",
        wordBreak: "keep-all",
        zIndex: 2,
        textShadow: `0 0 8px ${accentColor}99, 0 0 12px ${accentColor}CC`,
    }),
    authorPanelGlow: (accentColor) => ({
        position: "absolute",
        inset: 0,
        borderRadius: "16px",
        boxShadow: `0 0 20px ${accentColor}AA, 0 0 40px ${accentColor}66`,
        zIndex: 1,
    }),
    authorParticle: (accentColor, size) => ({
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        background: accentColor,
        borderRadius: "50%",
        boxShadow: `0 0 ${size * 2}px ${accentColor}CC`,
        zIndex: 1,
    }),

    /* CAPA ACTIVA (paneles + cápsulas) */
    activeAuthorLayer: {
        position: "relative",
        width: "100%",
        minHeight: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 3,
        marginTop: "2vh",
        cursor: "default",
        paddingBottom: "10vh",
    },

    twoPanelWrap: (gapVW = 3, offsetVH = 0) => ({
        position: "relative",
        top: `${offsetVH}vh`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: `${gapVW}vw`,
        flexWrap: "nowrap",
        width: "100%",
        zIndex: 4,
    }),

    /* Panel izquierda (portada + botón fragmento) */
    previewPanel: (
        accentColor,
        widthVW = 35,
        heightVH = 75,
        corner = 20,
        opacity = 0.8,
        blur = 8
    ) => ({
        width: `${widthVW}vw`,
        height: `${heightVH}vh`,
        maxHeight: "120vh",
        background: `rgba(5,10,20,${opacity})`,
        border: `2px solid ${accentColor}`,
        borderRadius: `${corner}px`,
        boxShadow: `0 0 15px ${accentColor}77, 0 0 30px ${accentColor}44, 0 10px 20px rgba(0,0,0,0.5)`,
        backdropFilter: `blur(${blur}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        gap: "16px",
        overflow: "hidden",
        position: "relative",
    }),
    previewImage: {
        width: "90%",
        height: "90%",
        maxHeight: "60vh",
        objectFit: "contain",
        borderRadius: "12px",
    },

    openFragmentButtonBase: (accentColor) => ({
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${accentColor}`,
        borderRadius: "10px",
        padding: "10px 16px",
        fontSize: "0.95rem",
        minWidth: "150px",
        textAlign: "center",
        boxShadow: `0 0 10px ${accentColor}55, 0 0 20px ${accentColor}22`,
        transition: "all 0.2s ease",
    }),
    openFragmentButtonEnabled: (accentColor) => ({
        color: accentColor,
        cursor: "pointer",
    }),
    openFragmentButtonDisabled: (accentColor) => ({
        color: `${accentColor}55`,
        borderColor: `${accentColor}55`,
        boxShadow: "none",
        opacity: 0.35,
        cursor: "not-allowed",
    }),
    openFragmentButtonHover: (accentColor) => ({
        background: `${accentColor}22`,
        boxShadow: `0 0 12px ${accentColor}99, 0 0 24px ${accentColor}55`,
        color: accentColor,
    }),

    /* Panel derecha (sinopsis / compra) */
    infoPanel: (
        accentColor,
        widthVW = 45,
        heightVH = 75,
        corner = 20,
        opacity = 0.8,
        blur = 8
    ) => ({
        width: `${widthVW}vw`,
        height: `${heightVH}vh`,
        maxHeight: "120vh",
        background: `rgba(5,10,20,${opacity})`,
        border: `2px solid ${accentColor}`,
        borderRadius: `${corner}px`,
        boxShadow: `0 0 15px ${accentColor}77, 0 0 30px ${accentColor}44, 0 10px 20px rgba(0,0,0,0.5)`,
        backdropFilter: `blur(${blur}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        transition: "opacity 0.3s ease",
    }),

    consoleCloseButton: (accentColor) => ({
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "30px",
        height: "30px",
        background: "transparent",
        border: `1px solid ${accentColor}`,
        borderRadius: "50%",
        color: accentColor,
        fontSize: "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
    }),

    consoleDecorationLine: (accentColor, position) => ({
        position: "absolute",
        [position]: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "2px",
        height: "80%",
        background: accentColor,
        borderRadius: "1px",
        boxShadow: `0 0 5px ${accentColor}AA`,
        opacity: 0.7,
        zIndex: 0,
    }),

    consoleContent: (accentColor) => ({
        width: "90%",
        height: "90%",
        minHeight: 0,
        background: "rgba(10, 25, 45, 0.85)",
        borderRadius: "16px",
        padding: "30px",
        position: "relative",
        zIndex: 1,
        border: `1px solid ${accentColor}33`,
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.6)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "left",
        overflowY: "auto",
        scrollbarWidth: "none",
    }),
    consoleIdle: (textColor) => ({
        fontSize: "1.5rem",
        color: textColor,
        opacity: 0.7,
        textAlign: "center",
    }),

    /* glitch / portada idle */
    glitchWrap: (accent = "#00C2FF", intensity = 1) => ({
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 16,
        filter: `saturate(${0.9 + 0.2 * intensity})`,
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
    }),
    glitchBase: () => ({
        position: "absolute",
        inset: 0,
        background: "#050A14",
        zIndex: 1,
    }),
    glitchNoise: (accent = "#00C2FF", intensity = 1, speed = 1) => ({
        position: "absolute",
        inset: 0,
        mixBlendMode: "screen",
        background: `repeating-linear-gradient(0deg, transparent 0 1px, rgba(0,0,0,.1) 1px 2px)`,
        opacity: 0.1 * intensity,
        zIndex: 2,
    }),
    innerBorder: (accent = "#00C2FF", thickness = 2) => ({
        position: "absolute",
        inset: `${thickness}px`,
        border: `${thickness}px solid ${accent}`,
        borderRadius: "inherit",
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 3,
    }),
    scanline: (accent = "#00C2FF", intensity = 1) => ({
        position: "absolute",
        left: 0,
        right: 0,
        height: "2px",
        background: accent,
        opacity: 0.15 * intensity,
        boxShadow: `0 0 4px ${accent}AA`,
        pointerEvents: "none",
        zIndex: 4,
    }),
    glitchParticle: (accent = "#00C2FF", size = 2) => ({
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: accent,
        boxShadow: `0 0 3px ${accent}`,
        zIndex: 5,
    }),

    /* Cápsulas */
    pulseCarousel: (offsetVH) => ({
        position: "relative",
        width: "100%",
        overflowX: "auto",
        padding: "20px 0",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        marginTop: `${offsetVH}vh`,
        display: "flex",
        justifyContent: "center",
        zIndex: 4,
        transition: "opacity 0.25s ease",
    }),
    pulseContainer: {
        display: "flex",
        gap: "15px",
        padding: "0 20px",
        position: "relative",
        justifyContent: "center",
    },
    pulseNode: (size, colorHex, glowStrength, isActive) => ({
        width: `${size}px`,
        height: `${size * 1.5}px`,
        background: `radial-gradient(circle at 50% 50%, ${
            colorHex || "#00C2FF"
        }${isActive ? "66" : "33"} 0%, transparent 70%)`,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: `0 0 ${glowStrength * (isActive ? 10 : 5)}px ${
            colorHex || "#00C2FF"
        }${isActive ? "AA" : "44"}`,
        willChange: "transform",
        position: "relative",
        outline: "none",
    }),
    pulseImage: (size) => ({
        width: `${size * 0.7}px`,
        height: `${size * 1.05}px`,
        borderRadius: "8px",
        objectFit: "cover",
    }),

    /* CTA compra */
    ctaContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "center",
        width: "100%",
        marginTop: "20px",
    },
    ctaButton: (color, isSubtle = false, textColor = "#FFFFFF") => ({
        background: `linear-gradient(180deg, rgba(5, 10, 20, 0.7) 0%, rgba(10, 20, 35, 0.8) 100%)`,
        border: "none",
        color: isSubtle ? `${textColor}BB` : color,
        borderRadius: "10px",
        padding: "10px 18px",
        fontSize: "1rem",
        cursor: "pointer",
        textDecoration: "none",
        textAlign: "center",
        transition: "all 0.3s ease",
        minWidth: "120px",
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.4), 0 0 0px ${color}00`,
        opacity: isSubtle ? 0.9 : 1,
    }),
    ctaButtonHover: (color, isSubtle = false, textColor = "#FFFFFF") => ({
        background: `linear-gradient(180deg, rgba(10, 20, 35, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%)`,
        boxShadow: `inset 0 1px 1px rgba(0,0,0,0.3), 0 0 12px ${isSubtle ? textColor : color}99`,
        opacity: 1,
        color: isSubtle ? textColor : color,
    }),
    priceChip: {
        display: "inline-block",
        marginLeft: 8,
        padding: "4px 8px",
        borderRadius: 8,
        fontSize: "0.85rem",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.15)",
    },
    ctaNote: (textColor) => ({
        width: "100%",
        textAlign: "center",
        marginTop: 8,
        fontSize: "0.85rem",
        color: textColor,
        opacity: 0.7,
    }),

    /* Modal PDF */
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4vh 4vw",
        cursor: "default",
    },
    modalPanel: (accentColor) => ({
        width: "80vw",
        height: "80vh",
        maxWidth: "1200px",
        maxHeight: "90vh",
        background: "rgba(5,10,20,0.85)",
        border: `2px solid ${accentColor}`,
        borderRadius: "20px",
        boxShadow: `0 0 20px ${accentColor}77, 0 0 40px ${accentColor}44, 0 20px 30px rgba(0,0,0,0.8)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
    }),
    modalHeader: (accentColor, textColor) => ({
        flexShrink: 0,
        padding: "12px 16px",
        borderBottom: `1px solid ${accentColor}55`,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: textColor,
        fontSize: "0.9rem",
        lineHeight: 1.4,
    }),
    modalCloseButton: (accentColor) => ({
        width: "28px",
        height: "28px",
        minWidth: "28px",
        minHeight: "28px",
        borderRadius: "50%",
        border: `1px solid ${accentColor}`,
        background: "transparent",
        color: accentColor,
        fontSize: "16px",
        lineHeight: "16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 8px ${accentColor}66`,
    }),
    modalBody: {
        flexGrow: 1,
        position: "relative",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "0.9rem",
        lineHeight: 1.4,
        textAlign: "center",
        padding: "16px",
    },
    pdfFrame: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        background: "#000",
    },

    /* micro-flare dorado al abrir fragmento */
    fragmentFlare: (flareColor) => ({
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10000,
        background: `radial-gradient(circle,
            ${hexToRgba(flareColor, 0.5)} 0%,
            ${hexToRgba(flareColor, 0.2)} 40%,
            transparent 70%
        )`,
    }),
}

/* -------------------------------------------------
   Estrellas (memo)
------------------------------------------------- */
const StarsBackground = memo(({ numStars }) => {
    const stars = useMemo(() => generateStars(numStars), [numStars])
    return (
        <div style={styles.starsContainer}>
            <style>{styles.keyframesTwinkle}</style>
            {stars.map((star) => (
                <div
                    key={star.id}
                    style={styles.star(
                        star.size,
                        star.top,
                        star.left,
                        star.delay
                    )}
                />
            ))}
        </div>
    )
})

const generateStars = (numStars) => {
    const starsArray = []
    for (let i = 0; i < numStars; i++) {
        starsArray.push({
            id: i,
            size: Math.random() * 1.5 + 0.5,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 5,
        })
    }
    return starsArray
}

/* -------------------------------------------------
   Parse de libros (ahora también pdfUrl y previewPages)
------------------------------------------------- */
const parseBooks = (json, useSample, covers) => {
    if (useSample) {
        return [
            {
                id: "1",
                title: "Manual Solar: Despierta tus Habilidades Cuánticas",
                author: "Zak´Haar",
                coverUrl:
                    covers.coverNucleo || "https://placehold.co/200x300/png",
                colorHex: "#00FFCC",
                synopsis: `
Primer libro canalizado por Zak´Haar.
En sus páginas descubrirás que las llamadas “habilidades cuánticas” no son algo extraño ni lejano, sino parte natural de tu ser...

Este libro no se lee. Se activa.
172 páginas.
`,
                digitalLink: "https://buy.stripe.com/4gM00caPr4oGbkZeTG0RG06",
                physicalLinks: [
                    {
                        label: "Amazon ES",
                        href: "https://www.amazon.es/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G",
                    },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/-/es/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G",
                    },
                    {
                        label: "Amazon DE",
                        href: "https://www.amazon.de/-/en/Manual-Solar-Despierta-Habilidades-activaci%C3%B3n/dp/B0F7DYVF3G",
                    },
                ],
                pdfUrl: "",
                previewPages: 3,
            },
            {
                id: "2",
                title: "Manual del Nodo Solar Encarnado",
                author: "Zak´Haar",
                coverUrl: covers.coverEco || "https://placehold.co/200x300/png",
                colorHex: "#FF00CC",
                synopsis: `
El segundo libro de Zak´Haar.
Es irradiación viva. Es un campo que despierta algo que ya vive en ti...

Este libro no se lee. Se activa.
342 páginas.
`,
                digitalLink: "https://buy.stripe.com/fZubIUg9L1cu1KpbHu0RG07",
                physicalLinks: [
                    {
                        label: "Amazon ES",
                        href: "https://www.amazon.es/dp/B0F9L1JKNB",
                    },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/Manual-Nodo-Solar-Encarnado-Spanish/dp/B0F9L1JKNB",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/-/es/Manual-Nodo-Solar-Encarnado-Spanish/dp/B0F9L1JKNB",
                    },
                    {
                        label: "Amazon DE",
                        href: "https://www.amazon.de/-/en/Zak%C2%B4Haar-Solar/dp/B0F9L1JKNB",
                    },
                ],
                pdfUrl: "",
                previewPages: 3,
            },
            {
                id: "3",
                title: "El Agua que Recuerda",
                author: "Aqua´Riia",
                coverUrl:
                    covers.coverViaje || "https://placehold.co/200x300/png",
                colorHex: "#CC00FF",
                synopsis: `
El primer libro de Aqua´Riia.
No es un libro para leer. Es una frecuencia para sentir...

Este libro no se lee. Se activa.
84 páginas.
`,
                digitalLink: "https://buy.stripe.com/eVq00c6zbg7o88NbHu0RG09",
                physicalLinks: [
                    { label: "Amazon ES", href: "https://amzn.eu/d/hnPd1bI" },
                    {
                        label: "Amazon MX",
                        href: "https://www.amazon.com.mx/El-Agua-que-Recuerda-Spanish/dp/B0F9XHY535",
                    },
                    {
                        label: "Amazon US",
                        href: "https://www.amazon.com/El-Agua-que-Recuerda-Spanish/dp/B0F9XHY535",
                    },
                    { label: "Amazon DE", href: "https://amzn.eu/d/4HfD2lZ" },
                ],
                pdfUrl: "",
                previewPages: 2,
            },
            {
                id: "5",
                title: "Tecnología del Espíritu",
                author: "Zak´Haar",
                coverUrl:
                    covers.coverNacido || "https://placehold.co/200x300/png",
                colorHex: "#FFCC00",
                synopsis: `
Tecnología del Espíritu es el tercer libro canalizado por Zak´Haar...

Este libro no se lee. Se activa.
188 páginas.
`,
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
                pdfUrl: "",
                previewPages: 4,
            },
        ]
    }

    try {
        const parsed = JSON.parse(json) || []
        return parsed.map((book) => ({
            ...book,
            digitalLink: book.digitalLink || "#",
            physicalLinks: book.physicalLinks || [],
            pdfUrl: book.pdfUrl || "",
            previewPages:
                typeof book.previewPages === "number" ? book.previewPages : 3,
        }))
    } catch {
        return []
    }
}

/* -------------------------------------------------
   Flare inicial pantalla completa
------------------------------------------------- */
const GoldenFlareAnimation = ({
    onComplete,
    durationSec = 1.0,
    flareColor = "#FFD700",
}) => {
    return (
        <motion.div
            key="goldenFlare"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                background: `radial-gradient(circle, 
                    ${hexToRgba(flareColor, 0.5)} 0%, 
                    ${hexToRgba(flareColor, 0.2)} 40%, 
                    transparent 70%
                )`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 2 }}
            transition={{ duration: durationSec, ease: "easeOut" }}
            onAnimationComplete={onComplete}
        />
    )
}

/* -------------------------------------------------
   Micro flare al abrir fragmento
------------------------------------------------- */
const FragmentOpenFlare = ({ flareColor, onDone }) => {
    return (
        <motion.div
            style={styles.fragmentFlare(flareColor)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 2] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={onDone}
        />
    )
}

/* -------------------------------------------------
   Componente principal
------------------------------------------------- */
export function ArchivoHolograficoLibros(props) {
    const {
        // flare de entrada
        flareEnabled = true,
        flareDurationSec = 1.0,
        flareColor = "#FFD700",

        // flare fragmento
        fragmentFlareColor = "#FFD45F",

        // colores / layout base
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",

        // header
        pageTitleImage,
        pageTitleImageHeight = 100,
        pageSubtitle = "Explora el conocimiento estelar",

        // data libros
        booksJson = "",
        useSampleBooks = true,

        // PDFs subidos en Framer (para los 4 libros sample)
        book1Pdf,
        book1PreviewPages = 3,
        book2Pdf,
        book2PreviewPages = 3,
        book3Pdf,
        book3PreviewPages = 2,
        book4Pdf,
        book4PreviewPages = 4,

        // panel look
        screenOpacity = 0.8,
        screenBlurPx = 8,
        screenCornerRadius = 20,
        capsuleSize = 80,
        capsuleGlowStrength = 0.5,
        inertiaEnabled = true,

        // layout consolas
        twoPanelGapVW = 4,
        previewPanelVW = 25,
        infoPanelVW = 55,
        consoleOffsetVH = 0,

        // altura de paneles
        panelHeightVH = 75,

        // glitch / efectos
        glitchIntensity = 2,
        glitchSpeed = 2,
        innerBorderPulseSpeed = 2,
        innerBorderGlowStrength = 1.7,
        particleCount = 20,
        particleSize = 1.4,
        particleSpeed = 3.5,
        backgroundFlickerStrength = 0.18,
        backgroundFlickerSpeed = 2.7,

        // cápsulas
        capsulesOffsetVH = 5,

        // CTA
        digitalPriceLabel = "MXN $333",
        showPurchaseNote = true,

        // estrellas
        numStars = 50,

        // links nav
        patreonLink = "https://www.patreon.com/c/redsolarviva",
        inicioLink = "https://www.patreon.com",
        musicaLink = "#",
        serviciosLink = "#",
        fragmentosLink = "#",

        // autores
        authorPanelGap = "8vw",
        authorOffsetVH = 4,
        authorPanelWidthVW = 16,
        authorPanelHeightVH = 36,

        // covers sample
        coverNucleo,
        coverEco,
        coverViaje,
        coverSuenos,
        coverNacido,
    } = props

    /* ---------------------------------
       ESTADOS
    --------------------------------- */
    const [activeNode, setActiveNode] = useState<any | null>(null)
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
    const [hoveredLink, setHoveredLink] = useState<string | null>(null)
    const [scrollX, setScrollX] = useState(0)
    const [showPhysicalLinks, setShowPhysicalLinks] = useState(false)

    // visor fragmento PDF
    const [showFragmentModal, setShowFragmentModal] = useState(false)
    const [fragmentModalBook, setFragmentModalBook] = useState<any | null>(null)
    const [fragmentFlareActive, setFragmentFlareActive] = useState(false)

    // PDF FETCH >>> estado para el blob interno que sí se puede iframar
    const [pdfObjectUrl, setPdfObjectUrl] = useState<string>("")
    const [pdfLoading, setPdfLoading] = useState<boolean>(false)
    const [pdfError, setPdfError] = useState<string>("")
    const pdfObjectUrlRef = useRef<string>("")

    const streamRef = useRef<HTMLDivElement | null>(null)

    // flare inicial
    const [isIntroComplete, setIsIntroComplete] = useState(!flareEnabled)

    /* ---------------------------------
       LIBROS
    --------------------------------- */
    const rawBooks = useMemo(
        () =>
            parseBooks(booksJson, useSampleBooks, {
                coverNucleo,
                coverEco,
                coverViaje,
                coverSuenos,
                coverNacido,
            }),
        [
            booksJson,
            useSampleBooks,
            coverNucleo,
            coverEco,
            coverViaje,
            coverSuenos,
            coverNacido,
        ]
    )

    const books = useMemo(() => {
        if (!useSampleBooks) return rawBooks

        const cloned = [...rawBooks]

        if (cloned[0]) {
            cloned[0].pdfUrl = book1Pdf || cloned[0].pdfUrl
            cloned[0].previewPages =
                typeof book1PreviewPages === "number"
                    ? book1PreviewPages
                    : cloned[0].previewPages
        }
        if (cloned[1]) {
            cloned[1].pdfUrl = book2Pdf || cloned[1].pdfUrl
            cloned[1].previewPages =
                typeof book2PreviewPages === "number"
                    ? book2PreviewPages
                    : cloned[1].previewPages
        }
        if (cloned[2]) {
            cloned[2].pdfUrl = book3Pdf || cloned[2].pdfUrl
            cloned[2].previewPages =
                typeof book3PreviewPages === "number"
                    ? book3PreviewPages
                    : cloned[2].previewPages
        }
        if (cloned[3]) {
            cloned[3].pdfUrl = book4Pdf || cloned[3].pdfUrl
            cloned[3].previewPages =
                typeof book4PreviewPages === "number"
                    ? book4PreviewPages
                    : cloned[3].previewPages
        }

        return cloned
    }, [
        rawBooks,
        useSampleBooks,
        book1Pdf,
        book1PreviewPages,
        book2Pdf,
        book2PreviewPages,
        book3Pdf,
        book3PreviewPages,
        book4Pdf,
        book4PreviewPages,
    ])

    // libros filtrados por autor activo
    const filteredBooks = useMemo(
        () =>
            selectedAuthor
                ? books.filter((b) => b.author === selectedAuthor)
                : [],
        [selectedAuthor, books]
    )

    // subtítulo con saltos
    const resolvedSubtitle = useMemo(
        () => normalizeMultiline(pageSubtitle),
        [pageSubtitle]
    )

    /* ---------------------------------
       HANDLERS
    --------------------------------- */

    // cerrar vista autor (si no hay modal abierto)
    const closeAuthorView = useCallback(() => {
        if (showFragmentModal) return
        setSelectedAuthor(null)
        setActiveNode(null)
        setShowPhysicalLinks(false)
    }, [showFragmentModal])

    // abrir visor fragmento PDF
    const openFragmentViewer = useCallback(() => {
        if (!activeNode) return
        if (!activeNode.pdfUrl) return // sin PDF no abrimos
        setFragmentModalBook(activeNode)
        setShowFragmentModal(true)
        setFragmentFlareActive(true) // micro flare dorado
    }, [activeNode])

    // cerrar visor fragmento PDF
    const closeFragmentViewer = useCallback(() => {
        setShowFragmentModal(false)
    }, [])

    // scroll horizontal cápsulas
    const handleScroll = useCallback(
        (e: any) => {
            if (!streamRef.current) return
            const delta =
                e.deltaX ||
                e.deltaY ||
                (e.type === "touchmove"
                    ? e.touches[0].clientX - e.touches[0].clientX
                    : 0)
            const newScrollX =
                streamRef.current.scrollLeft +
                delta * (inertiaEnabled ? 0.9 : 1)
            streamRef.current.scrollLeft = newScrollX
            setScrollX(newScrollX)
        },
        [inertiaEnabled]
    )

    // teclado global
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // ESC
            if (e.key === "Escape") {
                if (showFragmentModal) {
                    e.preventDefault()
                    closeFragmentViewer()
                    return
                }
                if (selectedAuthor) {
                    e.preventDefault()
                    closeAuthorView()
                }
                return
            }

            // navegación flechas en cápsulas
            if (!selectedAuthor || filteredBooks.length === 0) return
            if (showFragmentModal) return

            const currentIndex = activeNode
                ? filteredBooks.findIndex((b) => b.id === activeNode.id)
                : -1

            if (e.key === "ArrowLeft") {
                e.preventDefault()
                let newIndex
                if (currentIndex <= 0) {
                    newIndex = filteredBooks.length - 1
                } else {
                    newIndex = currentIndex - 1
                }
                setActiveNode(filteredBooks[newIndex])
                setShowPhysicalLinks(false)
                return
            }

            if (e.key === "ArrowRight") {
                e.preventDefault()
                let newIndex
                if (
                    currentIndex === -1 ||
                    currentIndex >= filteredBooks.length - 1
                ) {
                    newIndex = 0
                } else {
                    newIndex = currentIndex + 1
                }
                setActiveNode(filteredBooks[newIndex])
                setShowPhysicalLinks(false)
                return
            }
        },
        [
            selectedAuthor,
            filteredBooks,
            activeNode,
            closeAuthorView,
            showFragmentModal,
            closeFragmentViewer,
        ]
    )

    /* ---------------------------------
       LISTENERS GLOBALES
    --------------------------------- */
    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => handleScroll(e)

        window.addEventListener("keydown", handleKeyDown)
        streamRef.current?.addEventListener("wheel", handleScroll, {
            passive: true,
        })
        streamRef.current?.addEventListener(
            "touchmove",
            handleTouchMove as any,
            { passive: true }
        )

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            streamRef.current?.removeEventListener("wheel", handleScroll)
            streamRef.current?.removeEventListener(
                "touchmove",
                handleTouchMove as any
            )
        }
    }, [handleScroll, handleKeyDown])

    /* ---------------------------------
       PARTÍCULAS
    --------------------------------- */
    // partículas orbitales en panel autor
    const authorParticles = useMemo(() => {
        const p = []
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI
            p.push({
                id: i,
                size: Math.random() * 2 + 1,
                orbitRadius: Math.random() * 20 + 80,
                angle,
                speed: Math.random() * 2 + 2,
            })
        }
        return p
    }, [])

    // partículas glitch panel portada
    const particles = useMemo(() => {
        const p = []
        for (let i = 0; i < particleCount; i++) {
            const leftKeyframes = [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
            ]
            const topKeyframes = [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
            ]
            p.push({
                id: i,
                delay: Math.random() * particleSpeed,
                duration: particleSpeed + Math.random() * 2,
                left: leftKeyframes,
                top: topKeyframes,
            })
        }
        return p
    }, [particleCount, particleSpeed])

    /* ---------------------------------
       PDF FETCH LOGIC
       (cuando abrimos el modal, traemos el PDF,
        construimos blob local y lo mostramos en iframe
        para evitar descarga forzada)
    --------------------------------- */
    useEffect(() => {
        const loadPdf = async () => {
            if (showFragmentModal && fragmentModalBook?.pdfUrl) {
                setPdfLoading(true)
                setPdfError("")
                setPdfObjectUrl("")
                // limpia anterior blob si había
                if (pdfObjectUrlRef.current) {
                    URL.revokeObjectURL(pdfObjectUrlRef.current)
                    pdfObjectUrlRef.current = ""
                }

                try {
                    const res = await fetch(fragmentModalBook.pdfUrl)
                    const blob = await res.blob()
                    const objectUrl = URL.createObjectURL(blob)
                    pdfObjectUrlRef.current = objectUrl
                    setPdfObjectUrl(objectUrl)
                } catch (err) {
                    setPdfError("No se pudo cargar el fragmento.")
                } finally {
                    setPdfLoading(false)
                }
            }
        }

        loadPdf()

        // cleanup cuando el modal se cierra o cambia el libro
        return () => {
            if (pdfObjectUrlRef.current) {
                URL.revokeObjectURL(pdfObjectUrlRef.current)
                pdfObjectUrlRef.current = ""
            }
            setPdfObjectUrl("")
            setPdfLoading(false)
        }
    }, [showFragmentModal, fragmentModalBook])

    /* ---------------------------------
       estilo botón "Abrir Fragmento"
    --------------------------------- */
    const fragmentBtnEnabled = !!(activeNode && activeNode.pdfUrl)
    const fragmentBtnStyle = {
        ...styles.openFragmentButtonBase(accentColor),
        ...(fragmentBtnEnabled
            ? styles.openFragmentButtonEnabled(accentColor)
            : styles.openFragmentButtonDisabled(accentColor)),
    }

    /* ---------------------------------
       RENDER
    --------------------------------- */
    return (
        <LayoutGroup>
            <motion.div style={styles.container(bgColor)}>
                {/* flare inicial pantalla completa */}
                <AnimatePresence>
                    {!isIntroComplete && (
                        <GoldenFlareAnimation
                            onComplete={() => setIsIntroComplete(true)}
                            durationSec={flareDurationSec}
                            flareColor={flareColor}
                        />
                    )}
                </AnimatePresence>

                {/* micro flare al abrir fragmento */}
                <AnimatePresence>
                    {fragmentFlareActive && (
                        <FragmentOpenFlare
                            flareColor={fragmentFlareColor}
                            onDone={() => setFragmentFlareActive(false)}
                        />
                    )}
                </AnimatePresence>

                {/* contenido principal */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isIntroComplete ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "linear", delay: 0.05 }}
                    style={{
                        width: "100%",
                        minHeight: "100svh",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    {/* fondo estrellas */}
                    <StarsBackground numStars={numStars} />
                    <style>{styles.keyframesTwinkle}</style>

                    {/* NAV */}
                    <motion.nav
                        style={styles.navigation(textColor, accentColor)}
                    >
                        <motion.a
                            href={inicioLink}
                            rel="noopener noreferrer"
                            style={styles.navLink(textColor)}
                            animate={
                                hoveredLink === "origen"
                                    ? styles.navLinkHover(accentColor)
                                    : {}
                            }
                            onHoverStart={() => setHoveredLink("origen")}
                            onHoverEnd={() => setHoveredLink(null)}
                            transition={{ duration: 0.2 }}
                        >
                            Origen
                        </motion.a>

                        <motion.a
                            href={fragmentosLink}
                            target="_self"
                            rel="noopener noreferrer"
                            style={styles.navLink(textColor)}
                            animate={
                                hoveredLink === "fragmentos"
                                    ? styles.navLinkHover(accentColor)
                                    : {}
                            }
                            onHoverStart={() => setHoveredLink("fragmentos")}
                            onHoverEnd={() => setHoveredLink(null)}
                            transition={{ duration: 0.2 }}
                        >
                            Fragmentos del Sol
                        </motion.a>

                        <motion.a
                            href="#"
                            style={styles.navLink(textColor)}
                            animate={styles.navLinkActive(accentColor)}
                            transition={{ duration: 0.2 }}
                        >
                            Libros
                        </motion.a>

                        <motion.a
                            href={musicaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.navLink(textColor)}
                            animate={
                                hoveredLink === "musica"
                                    ? styles.navLinkHover(accentColor)
                                    : {}
                            }
                            onHoverStart={() => setHoveredLink("musica")}
                            onHoverEnd={() => setHoveredLink(null)}
                            transition={{ duration: 0.2 }}
                        >
                            Música
                        </motion.a>

                        <motion.a
                            href={serviciosLink}
                            target="_self"
                            rel="noopener noreferrer"
                            style={styles.navLink(textColor)}
                            animate={
                                hoveredLink === "servicios"
                                    ? styles.navLinkHover(accentColor)
                                    : {}
                            }
                            onHoverStart={() => setHoveredLink("servicios")}
                            onHoverEnd={() => setHoveredLink(null)}
                            transition={{ duration: 0.2 }}
                        >
                            Servicios
                        </motion.a>

                        <motion.a
                            href={patreonLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.navLink(textColor)}
                            animate={
                                hoveredLink === "patreon"
                                    ? styles.navLinkHover(accentColor)
                                    : {}
                            }
                            onHoverStart={() => setHoveredLink("patreon")}
                            onHoverEnd={() => setHoveredLink(null)}
                            transition={{ duration: 0.2 }}
                        >
                            Patreon
                        </motion.a>
                    </motion.nav>

                    {/* HEADER (solo cuando no hay autor abierto) */}
                    {!selectedAuthor && (
                        <div style={styles.pageHeaderWrap}>
                            {pageTitleImage && (
                                <div
                                    style={styles.pageTitleImageWrapper(
                                        pageTitleImageHeight
                                    )}
                                >
                                    <img
                                        src={pageTitleImage}
                                        alt="Título sección libros"
                                        style={styles.pageTitleImageEl}
                                    />
                                </div>
                            )}

                            {resolvedSubtitle && (
                                <div style={styles.pageSubtitleText(textColor)}>
                                    {resolvedSubtitle}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ---------- SIN AUTOR SELECCIONADO ---------- */}
                    {!selectedAuthor && (
                        <motion.div
                            style={styles.authorSelectorContainer(
                                authorPanelGap,
                                authorOffsetVH
                            )}
                        >
                            {["Zak´Haar", "Aqua´Riia"].map((author) => (
                                <motion.div
                                    key={author}
                                    style={styles.authorPanel(
                                        accentColor,
                                        selectedAuthor === author,
                                        null,
                                        authorPanelWidthVW,
                                        undefined,
                                        160,
                                        authorPanelHeightVH
                                    )}
                                    animate={{
                                        scale: [1, 1.02, 1],
                                        boxShadow: [
                                            `0 0 15px ${accentColor}77, 0 0 30px ${accentColor}44, 0 10px 20px rgba(0,0,0,0.5)`,
                                            `0 0 25px ${accentColor}AA, 0 0 50px ${accentColor}66, 0 10px 20px rgba(0,0,0,0.5)`,
                                            `0 0 15px ${accentColor}77, 0 0 30px ${accentColor}44, 0 10px 20px rgba(0,0,0,0.5)`,
                                        ],
                                        opacity: [0.95, 1, 0.95],
                                    }}
                                    transition={{
                                        scale: {
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        },
                                        boxShadow: {
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        },
                                        opacity: {
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        },
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedAuthor(author)
                                        setActiveNode(null)
                                        setShowPhysicalLinks(false)
                                    }}
                                >
                                    <motion.div
                                        style={styles.authorPanelGlow(
                                            accentColor
                                        )}
                                        animate={{
                                            opacity: [0.3, 0.6, 0.3],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                    {authorParticles.map((p) => (
                                        <motion.div
                                            key={p.id}
                                            style={styles.authorParticle(
                                                accentColor,
                                                p.size
                                            )}
                                            animate={{
                                                x: [
                                                    Math.cos(p.angle) *
                                                        p.orbitRadius,
                                                    Math.cos(
                                                        p.angle + Math.PI
                                                    ) * p.orbitRadius,
                                                    Math.cos(
                                                        p.angle + 2 * Math.PI
                                                    ) * p.orbitRadius,
                                                ],
                                                y: [
                                                    Math.sin(p.angle) *
                                                        p.orbitRadius,
                                                    Math.sin(
                                                        p.angle + Math.PI
                                                    ) * p.orbitRadius,
                                                    Math.sin(
                                                        p.angle + 2 * Math.PI
                                                    ) * p.orbitRadius,
                                                ],
                                                opacity: [0.2, 0.8, 0.2],
                                            }}
                                            transition={{
                                                duration: p.speed,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: p.id * 0.2,
                                            }}
                                        />
                                    ))}
                                    <motion.div
                                        style={styles.authorText(accentColor)}
                                        animate={{
                                            textShadow: [
                                                `0 0 8px ${accentColor}99`,
                                                `0 0 12px ${accentColor}CC`,
                                                `0 0 8px ${accentColor}99`,
                                            ],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        {`Libros de\n${author}`}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ---------- AUTOR SELECCIONADO ---------- */}
                    {selectedAuthor && (
                        <div
                            style={styles.activeAuthorLayer}
                            onClick={() => {
                                // click en el fondo fuera de paneles => cerrar vista del autor
                                closeAuthorView()
                            }}
                        >
                            {/* Consolas (panel portada + panel info) */}
                            <motion.div
                                style={styles.twoPanelWrap(
                                    twoPanelGapVW,
                                    consoleOffsetVH
                                )}
                            >
                                {/* PANEL IZQUIERDO */}
                                <motion.div
                                    layoutId="previewPanelShell"
                                    style={styles.previewPanel(
                                        accentColor,
                                        previewPanelVW,
                                        panelHeightVH,
                                        screenCornerRadius,
                                        screenOpacity,
                                        screenBlurPx
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AnimatePresence mode="wait">
                                        {!activeNode ? (
                                            <motion.div
                                                key="glitch"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.35 }}
                                                style={styles.glitchWrap(
                                                    accentColor,
                                                    glitchIntensity
                                                )}
                                            >
                                                <motion.div
                                                    style={styles.glitchBase()}
                                                    animate={{
                                                        opacity: [
                                                            1,
                                                            1 -
                                                                backgroundFlickerStrength,
                                                            1,
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration:
                                                            backgroundFlickerSpeed *
                                                            0.5,
                                                        repeat: Infinity,
                                                        repeatType: "reverse",
                                                        ease: "easeOut",
                                                    }}
                                                />

                                                <motion.div
                                                    style={styles.glitchNoise(
                                                        accentColor,
                                                        glitchIntensity,
                                                        glitchSpeed
                                                    )}
                                                    animate={{
                                                        x: [0, 1, -1, 1, 0],
                                                        y: [0, -1, 1, 0, 0],
                                                    }}
                                                    transition={{
                                                        duration:
                                                            0.6 / glitchSpeed,
                                                        repeat: Infinity,
                                                        repeatType: "loop",
                                                        ease: "linear",
                                                    }}
                                                />

                                                {/* bordes pulsantes */}
                                                <motion.div
                                                    style={styles.innerBorder(
                                                        accentColor,
                                                        2
                                                    )}
                                                    animate={{
                                                        opacity: [
                                                            0.3,
                                                            innerBorderGlowStrength,
                                                            0.3,
                                                        ],
                                                        boxShadow: [
                                                            `0 0 0px ${accentColor}00`,
                                                            `0 0 ${
                                                                10 *
                                                                innerBorderGlowStrength
                                                            }px ${accentColor}AA`,
                                                            `0 0 0px ${accentColor}00`,
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration:
                                                            innerBorderPulseSpeed,
                                                        repeat: Infinity,
                                                        repeatType: "reverse",
                                                        ease: "easeInOut",
                                                        delay: 0,
                                                    }}
                                                />
                                                <motion.div
                                                    style={styles.innerBorder(
                                                        accentColor,
                                                        1
                                                    )}
                                                    animate={{
                                                        opacity: [
                                                            0.3,
                                                            innerBorderGlowStrength,
                                                            0.3,
                                                        ],
                                                        boxShadow: [
                                                            `0 0 0px ${accentColor}00`,
                                                            `0 0 ${
                                                                8 *
                                                                innerBorderGlowStrength
                                                            }px ${accentColor}AA`,
                                                            `0 0 0px ${accentColor}00`,
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration:
                                                            innerBorderPulseSpeed,
                                                        repeat: Infinity,
                                                        repeatType: "reverse",
                                                        ease: "easeInOut",
                                                        delay:
                                                            innerBorderPulseSpeed /
                                                            2,
                                                    }}
                                                />

                                                {/* scanlines */}
                                                <motion.div
                                                    style={styles.scanline(
                                                        accentColor,
                                                        glitchIntensity
                                                    )}
                                                    initial={{ top: "-10%" }}
                                                    animate={{ top: "110%" }}
                                                    transition={{
                                                        duration:
                                                            5 / glitchSpeed,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                        delay: 0,
                                                    }}
                                                />
                                                <motion.div
                                                    style={styles.scanline(
                                                        accentColor,
                                                        glitchIntensity
                                                    )}
                                                    initial={{ top: "-10%" }}
                                                    animate={{ top: "110%" }}
                                                    transition={{
                                                        duration:
                                                            4.5 / glitchSpeed,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                        delay: 1.2,
                                                    }}
                                                />
                                                <motion.div
                                                    style={styles.scanline(
                                                        accentColor,
                                                        glitchIntensity
                                                    )}
                                                    initial={{ top: "-10%" }}
                                                    animate={{ top: "110%" }}
                                                    transition={{
                                                        duration:
                                                            5.5 / glitchSpeed,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                        delay: 2.5,
                                                    }}
                                                />
                                                <motion.div
                                                    style={styles.scanline(
                                                        accentColor,
                                                        glitchIntensity
                                                    )}
                                                    initial={{ top: "-10%" }}
                                                    animate={{ top: "110%" }}
                                                    transition={{
                                                        duration:
                                                            4.0 / glitchSpeed,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                        delay: 3.1,
                                                    }}
                                                />

                                                {/* partículas flotantes */}
                                                {particles.map((p) => (
                                                    <motion.div
                                                        key={p.id}
                                                        style={styles.glitchParticle(
                                                            accentColor,
                                                            particleSize
                                                        )}
                                                        initial={{
                                                            left: p.left[0],
                                                            top: p.top[0],
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            left: p.left,
                                                            top: p.top,
                                                            opacity: [
                                                                0.2, 0.8, 0.2,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration:
                                                                p.duration,
                                                            repeat: Infinity,
                                                            repeatType:
                                                                "reverse",
                                                            ease: "linear",
                                                            delay: p.delay,
                                                        }}
                                                    />
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="cover"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.35 }}
                                                style={{
                                                    width: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "16px",
                                                }}
                                            >
                                                <motion.img
                                                    src={
                                                        activeNode.coverUrl ||
                                                        makeFallbackDataUrl(
                                                            activeNode.title,
                                                            activeNode.colorHex
                                                        )
                                                    }
                                                    alt={activeNode.title}
                                                    style={styles.previewImage}
                                                    loading="eager"
                                                    referrerPolicy="no-referrer"
                                                />

                                                {/* Botón Abrir Fragmento */}
                                                {activeNode && (
                                                    <motion.button
                                                        style={fragmentBtnStyle}
                                                        whileHover={
                                                            fragmentBtnEnabled
                                                                ? styles.openFragmentButtonHover(
                                                                      accentColor
                                                                  )
                                                                : {}
                                                        }
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openFragmentViewer()
                                                        }}
                                                    >
                                                        Abrir Fragmento
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* PANEL DERECHO */}
                                <motion.div
                                    style={{
                                        ...styles.infoPanel(
                                            accentColor,
                                            infoPanelVW,
                                            panelHeightVH,
                                            screenCornerRadius,
                                            screenOpacity,
                                            screenBlurPx
                                        ),
                                        pointerEvents: showFragmentModal
                                            ? "none"
                                            : "auto",
                                    }}
                                    animate={{
                                        opacity: showFragmentModal ? 0 : 1,
                                    }}
                                    transition={{
                                        duration: 0.25,
                                        ease: "easeOut",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Botón cerrar vista autor */}
                                    <motion.button
                                        style={styles.consoleCloseButton(
                                            accentColor
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            closeAuthorView()
                                        }}
                                        whileHover={{
                                            scale: 1.1,
                                            background: `${accentColor}22`,
                                        }}
                                    >
                                        &times;
                                    </motion.button>

                                    <div
                                        style={styles.consoleDecorationLine(
                                            accentColor,
                                            "left"
                                        )}
                                    />
                                    <div
                                        style={styles.consoleDecorationLine(
                                            accentColor,
                                            "right"
                                        )}
                                    />

                                    <div
                                        style={styles.consoleContent(
                                            accentColor
                                        )}
                                    >
                                        <AnimatePresence mode="wait">
                                            {!activeNode ? (
                                                <motion.div
                                                    key="idle"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={styles.consoleIdle(
                                                        textColor
                                                    )}
                                                >
                                                    Selecciona un libro del
                                                    archivo...
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key={activeNode.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: "15px",
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            flexGrow: 1,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            justifyContent:
                                                                "flex-start",
                                                            minHeight: 0,
                                                        }}
                                                    >
                                                        {/* Título */}
                                                        <h2
                                                            style={{
                                                                color: textColor,
                                                                margin: "0 0 14px 0",
                                                                textAlign:
                                                                    "center",
                                                                letterSpacing:
                                                                    "0.02em",
                                                            }}
                                                        >
                                                            {activeNode.title}
                                                        </h2>

                                                        {/* Sinopsis */}
                                                        <p
                                                            style={{
                                                                color: textColor,
                                                                margin: 0,
                                                                opacity: 0.9,
                                                                fontSize:
                                                                    "1rem",
                                                                lineHeight: 1.6,
                                                                whiteSpace:
                                                                    "pre-line",
                                                                textAlign:
                                                                    "left",
                                                                maxHeight:
                                                                    "48vh",
                                                                overflowY:
                                                                    "auto",
                                                                scrollbarWidth:
                                                                    "thin",
                                                                scrollbarColor: `${accentColor}55 transparent`,
                                                            }}
                                                        >
                                                            {
                                                                activeNode.synopsis
                                                            }
                                                        </p>
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.ctaContainer
                                                        }
                                                    >
                                                        <AnimatePresence mode="wait">
                                                            {!showPhysicalLinks ? (
                                                                <motion.div
                                                                    key="primary"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                    }}
                                                                    style={
                                                                        styles.ctaContainer
                                                                    }
                                                                >
                                                                    {/* Comprar Físico */}
                                                                    <motion.button
                                                                        style={styles.ctaButton(
                                                                            accentColor
                                                                        )}
                                                                        whileHover={styles.ctaButtonHover(
                                                                            accentColor
                                                                        )}
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                            setShowPhysicalLinks(
                                                                                true
                                                                            )
                                                                        }}
                                                                        title="Compra en tiendas externas (precio dinámico en Amazon)"
                                                                    >
                                                                        Comprar
                                                                        físico
                                                                    </motion.button>

                                                                    {/* Comprar Digital */}
                                                                    {activeNode.digitalLink && (
                                                                        <motion.a
                                                                            href={
                                                                                activeNode.digitalLink
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={styles.ctaButton(
                                                                                accentColor
                                                                            )}
                                                                            whileHover={styles.ctaButtonHover(
                                                                                accentColor
                                                                            )}
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                            title="Compra digital (entrega tras el pago)"
                                                                        >
                                                                            Comprar
                                                                            digital
                                                                            <span
                                                                                style={
                                                                                    styles.priceChip
                                                                                }
                                                                            >
                                                                                {
                                                                                    digitalPriceLabel
                                                                                }
                                                                            </span>
                                                                        </motion.a>
                                                                    )}
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    key="physical"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                    }}
                                                                    style={
                                                                        styles.ctaContainer
                                                                    }
                                                                >
                                                                    {(
                                                                        activeNode.physicalLinks ||
                                                                        []
                                                                    ).map(
                                                                        (
                                                                            link
                                                                        ) => (
                                                                            <motion.a
                                                                                key={
                                                                                    link.label
                                                                                }
                                                                                href={
                                                                                    link.href
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                style={styles.ctaButton(
                                                                                    accentColor
                                                                                )}
                                                                                whileHover={styles.ctaButtonHover(
                                                                                    accentColor
                                                                                )}
                                                                                onClick={(
                                                                                    e
                                                                                ) =>
                                                                                    e.stopPropagation()
                                                                                }
                                                                            >
                                                                                {
                                                                                    link.label
                                                                                }
                                                                            </motion.a>
                                                                        )
                                                                    )}

                                                                    <motion.button
                                                                        style={styles.ctaButton(
                                                                            textColor,
                                                                            true
                                                                        )}
                                                                        whileHover={styles.ctaButtonHover(
                                                                            textColor
                                                                        )}
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                            setShowPhysicalLinks(
                                                                                false
                                                                            )
                                                                        }}
                                                                    >
                                                                        &larr;
                                                                        Volver
                                                                    </motion.button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {showPurchaseNote && (
                                                            <div
                                                                style={styles.ctaNote(
                                                                    textColor
                                                                )}
                                                            >
                                                                En la compra
                                                                digital al
                                                                completar tu
                                                                contribución
                                                                recibirás un
                                                                correo con un
                                                                link de
                                                                descarga.
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* CÁPSULAS */}
                            <motion.div
                                style={{
                                    ...styles.pulseCarousel(capsulesOffsetVH),
                                    pointerEvents: showFragmentModal
                                        ? "none"
                                        : "auto",
                                }}
                                animate={{
                                    opacity: showFragmentModal ? 0 : 1,
                                }}
                                transition={{
                                    duration: 0.25,
                                    ease: "easeOut",
                                }}
                                ref={streamRef}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <motion.div
                                    style={styles.pulseContainer}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {filteredBooks.map((book) => (
                                        <motion.div
                                            key={book.id}
                                            style={styles.pulseNode(
                                                capsuleSize,
                                                book.colorHex || accentColor,
                                                capsuleGlowStrength,
                                                activeNode?.id === book.id
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (showFragmentModal) return
                                                setActiveNode(book)
                                                setShowPhysicalLinks(false)
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <motion.img
                                                src={
                                                    book.coverUrl ||
                                                    makeFallbackDataUrl(
                                                        book.title,
                                                        book.colorHex
                                                    )
                                                }
                                                alt={book.title}
                                                style={styles.pulseImage(
                                                    capsuleSize
                                                )}
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>
                    )}

                    {/* ---------- MODAL FRAGMENTO PDF ---------- */}
                    <AnimatePresence>
                        {showFragmentModal && fragmentModalBook && (
                            <motion.div
                                style={styles.modalOverlay}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => {
                                    // clic fuera => cerrar
                                    closeFragmentViewer()
                                }}
                            >
                                {/* animación suave reutilizando layoutId del panel izq */}
                                <motion.div
                                    layoutId="previewPanelShell"
                                    style={styles.modalPanel(accentColor)}
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{ opacity: 0.95, scale: 1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.9,
                                        transition: {
                                            duration: 0.2,
                                            ease: "easeInOut",
                                        },
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 20,
                                    }}
                                >
                                    {/* Header modal */}
                                    <div
                                        style={styles.modalHeader(
                                            accentColor,
                                            textColor
                                        )}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                maxWidth: "80%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {fragmentModalBook.title}
                                            </div>

                                            {typeof fragmentModalBook.previewPages ===
                                                "number" &&
                                                fragmentModalBook.previewPages >
                                                    0 && (
                                                    <div
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        Vista previa · primeras{" "}
                                                        {
                                                            fragmentModalBook.previewPages
                                                        }{" "}
                                                        páginas
                                                    </div>
                                                )}
                                        </div>

                                        <motion.button
                                            style={styles.modalCloseButton(
                                                accentColor
                                            )}
                                            whileHover={{
                                                scale: 1.1,
                                                background: `${accentColor}22`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                closeFragmentViewer()
                                            }}
                                        >
                                            &times;
                                        </motion.button>
                                    </div>

                                    {/* Cuerpo modal */}
                                    <div style={styles.modalBody}>
                                        {pdfLoading && (
                                            <div
                                                style={{
                                                    opacity: 0.8,
                                                    fontSize: "0.9rem",
                                                }}
                                            >
                                                Cargando fragmento…
                                            </div>
                                        )}

                                        {!pdfLoading && pdfError && (
                                            <div
                                                style={{
                                                    opacity: 0.8,
                                                    fontSize: "0.9rem",
                                                    color: "#ff8080",
                                                }}
                                            >
                                                {pdfError}
                                            </div>
                                        )}

                                        {!pdfLoading &&
                                            !pdfError &&
                                            pdfObjectUrl && (
                                                <iframe
                                                    title="fragmento-pdf"
                                                    src={pdfObjectUrl}
                                                    style={styles.pdfFrame}
                                                />
                                            )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </LayoutGroup>
    )
}

/* -------------------------------------------------
   Property Controls (Framer)
------------------------------------------------- */
addPropertyControls(ArchivoHolograficoLibros, {
    // flare inicial
    flareEnabled: {
        type: ControlType.Boolean,
        title: "▶︎ Flare Inicial",
        defaultValue: true,
    },
    flareDurationSec: {
        type: ControlType.Number,
        title: "Flare Duración (s)",
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
        hidden: (props) => props.flareEnabled === false,
    },
    flareColor: {
        type: ControlType.Color,
        title: "Flare Color",
        defaultValue: "#FFD700",
        hidden: (props) => props.flareEnabled === false,
    },

    // flare del visor fragmento
    fragmentFlareColor: {
        type: ControlType.Color,
        title: "Flare Fragmento",
        defaultValue: "#FFD45F",
    },

    // colores base
    bgColor: { type: ControlType.Color, title: "Fondo (BG)" },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#FFFFFF",
    },
    accentColor: { type: ControlType.Color, title: "Acento" },

    // header
    pageTitleImage: {
        type: ControlType.Image,
        title: "Título PNG",
    },
    pageTitleImageHeight: {
        type: ControlType.Number,
        title: "Alto Título (px)",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 2,
    },
    pageSubtitle: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Explora el conocimiento estelar",
        rows: 4,
    },

    // dataset
    useSampleBooks: {
        type: ControlType.Boolean,
        title: "Usar Samples",
        defaultValue: true,
    },
    booksJson: {
        type: ControlType.String,
        title: "Libros (JSON)",
        defaultValue: "[]",
        hidden: (props) => props.useSampleBooks,
    },

    // covers sample
    coverNucleo: {
        type: ControlType.Image,
        title: "Img: Núcleo",
        hidden: (props) => !props.useSampleBooks,
    },
    coverEco: {
        type: ControlType.Image,
        title: "Img: Eco",
        hidden: (props) => !props.useSampleBooks,
    },
    coverViaje: {
        type: ControlType.Image,
        title: "Img: Viaje",
        hidden: (props) => !props.useSampleBooks,
    },
    coverSuenos: {
        type: ControlType.Image,
        title: "Img: Sueños",
        hidden: (props) => !props.useSampleBooks,
    },
    coverNacido: {
        type: ControlType.Image,
        title: "Img: Nacido",
        hidden: (props) => !props.useSampleBooks,
    },

    // PDFs subidos en Framer por libro sample
    book1Pdf: {
        type: ControlType.File,
        title: "Libro 1 PDF (Manual Solar)",
        allowedFileTypes: ["pdf"],
        hidden: (props) => !props.useSampleBooks,
    },
    book1PreviewPages: {
        type: ControlType.Number,
        title: "Libro 1 Páginas Preview",
        defaultValue: 3,
        min: 1,
        max: 30,
        displayStepper: true,
        hidden: (props) => !props.useSampleBooks,
    },

    book2Pdf: {
        type: ControlType.File,
        title: "Libro 2 PDF (Nodo Solar)",
        allowedFileTypes: ["pdf"],
        hidden: (props) => !props.useSampleBooks,
    },
    book2PreviewPages: {
        type: ControlType.Number,
        title: "Libro 2 Páginas Preview",
        defaultValue: 3,
        min: 1,
        max: 30,
        displayStepper: true,
        hidden: (props) => !props.useSampleBooks,
    },

    book3Pdf: {
        type: ControlType.File,
        title: "Libro 3 PDF (Agua que Recuerda)",
        allowedFileTypes: ["pdf"],
        hidden: (props) => !props.useSampleBooks,
    },
    book3PreviewPages: {
        type: ControlType.Number,
        title: "Libro 3 Páginas Preview",
        defaultValue: 2,
        min: 1,
        max: 30,
        displayStepper: true,
        hidden: (props) => !props.useSampleBooks,
    },

    book4Pdf: {
        type: ControlType.File,
        title: "Libro 4 PDF (Tec. del Espíritu)",
        allowedFileTypes: ["pdf"],
        hidden: (props) => !props.useSampleBooks,
    },
    book4PreviewPages: {
        type: ControlType.Number,
        title: "Libro 4 Páginas Preview",
        defaultValue: 4,
        min: 1,
        max: 30,
        displayStepper: true,
        hidden: (props) => !props.useSampleBooks,
    },

    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 50,
        min: 0,
        max: 300,
        step: 5,
    },

    /* autores / selector */
    authorPanelGap: {
        type: ControlType.String,
        title: "Autor: Gap",
        defaultValue: "8vw",
    },
    authorOffsetVH: {
        type: ControlType.Number,
        title: "Autor: Offset (vh)",
        defaultValue: 4,
        min: -50,
        max: 50,
    },
    authorPanelWidthVW: {
        type: ControlType.Number,
        title: "Autor: Ancho (vw)",
        defaultValue: 16,
        min: 10,
        max: 45,
    },
    authorPanelHeightVH: {
        type: ControlType.Number,
        title: "Autor: Alto (vh)",
        defaultValue: 36,
        min: 20,
        max: 80,
    },

    /* consolas layout */
    twoPanelGapVW: {
        type: ControlType.Number,
        title: "Consola: Gap (vw)",
        defaultValue: 4,
        min: 0,
        max: 10,
    },
    previewPanelVW: {
        type: ControlType.Number,
        title: "Consola: Ancho Prev (vw)",
        defaultValue: 25,
        min: 10,
        max: 90,
    },
    infoPanelVW: {
        type: ControlType.Number,
        title: "Consola: Ancho Info (vw)",
        defaultValue: 55,
        min: 10,
        max: 90,
    },
    consoleOffsetVH: {
        type: ControlType.Number,
        title: "Consola: Offset (vh)",
        defaultValue: 0,
        min: -50,
        max: 50,
    },
    panelHeightVH: {
        type: ControlType.Number,
        title: "Consola: Alto Panel (vh)",
        defaultValue: 75,
        min: 20,
        max: 120,
        step: 1,
    },

    /* apariencia consolas */
    screenOpacity: {
        type: ControlType.Number,
        title: "Consola: Opacidad",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    screenBlurPx: {
        type: ControlType.Number,
        title: "Consola: Blur (px)",
        defaultValue: 8,
        min: 0,
        max: 40,
    },
    screenCornerRadius: {
        type: ControlType.Number,
        title: "Consola: Radio (px)",
        defaultValue: 20,
        min: 0,
        max: 50,
    },

    /* cápsulas */
    capsuleSize: {
        type: ControlType.Number,
        title: "Cápsula: Tamaño",
        defaultValue: 80,
        min: 40,
        max: 200,
    },
    capsuleGlowStrength: {
        type: ControlType.Number,
        title: "Cápsula: Glow",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
    },
    capsulesOffsetVH: {
        type: ControlType.Number,
        title: "Cápsula: Offset (vh)",
        defaultValue: 5,
        min: -20,
        max: 50,
    },
    inertiaEnabled: {
        type: ControlType.Boolean,
        title: "Scroll Inercial",
        defaultValue: true,
    },

    /* glitch tuning */
    glitchIntensity: {
        type: ControlType.Number,
        title: "Glitch: Intensidad",
        defaultValue: 2,
        min: 0,
        max: 2,
        step: 0.1,
    },
    glitchSpeed: {
        type: ControlType.Number,
        title: "Glitch: Ruido Vel.",
        defaultValue: 2,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    innerBorderPulseSpeed: {
        type: ControlType.Number,
        title: "Borde Pulso Vel.",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    innerBorderGlowStrength: {
        type: ControlType.Number,
        title: "Borde Pulso Glow",
        defaultValue: 1.7,
        min: 0,
        max: 2,
        step: 0.1,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Partículas Nº",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Partículas Tamaño",
        defaultValue: 1.4,
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    particleSpeed: {
        type: ControlType.Number,
        title: "Partículas Vel.",
        defaultValue: 3.5,
        min: 1,
        max: 10,
        step: 0.5,
    },
    backgroundFlickerStrength: {
        type: ControlType.Number,
        title: "Fondo Parpadeo",
        defaultValue: 0.18,
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    backgroundFlickerSpeed: {
        type: ControlType.Number,
        title: "Fondo Parpadeo Vel.",
        defaultValue: 2.7,
        min: 0.1,
        max: 3,
        step: 0.1,
    },

    /* CTA / compra */
    digitalPriceLabel: {
        type: ControlType.String,
        title: "Precio Digital",
        defaultValue: "MXN $333",
    },
    showPurchaseNote: {
        type: ControlType.Boolean,
        title: "Nota de compra",
        defaultValue: true,
    },

    /* links nav */
    inicioLink: { type: ControlType.String, title: "Link: Inicio" },
    fragmentosLink: { type: ControlType.String, title: "Link: Fragmentos" },
    musicaLink: { type: ControlType.String, title: "Link: Música" },
    serviciosLink: { type: ControlType.String, title: "Link: Servicios" },
    patreonLink: { type: ControlType.String, title: "Link: Patreon" },
})
