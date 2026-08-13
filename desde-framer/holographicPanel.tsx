import * as React from "react"
import { useState, useEffect, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ─────────────────────────────
   Estilos
   ───────────────────────────── */
const styles = {
    // Contenedor Principal (ya NO fixed; permite scroll y elimina franjas)
    portalContainer: (bgColor) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100svh",
        width: "100%",
        background: bgColor,
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        color: "#E0E0E0",
        overflowX: "hidden",
        overflowY: "visible",
        margin: 0,
    }),

    // Estilos StarsBackground (cubre el contenedor completo)
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
        animation: `twinkle ${2 + Math.random() * 3}s infinite ${delay}s alternate ease-in-out`,
        top: `${top}%`,
        left: `${left}%`,
        boxShadow: `0 0 ${size * 2}px ${size * 0.5}px rgba(255, 255, 255, 0.4)`,
    }),
    keyframesTwinkle: `@keyframes twinkle { 0% { opacity: 0.1; } 50% { opacity: 0.8; } 100% { opacity: 0.1; } }`,

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

    // Contenedor Central - Sistema Solar
    solarSystemContainer: {
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        padding: "1vh 20px 4vh 20px",
        position: "relative",
        zIndex: 1,
        paddingBottom: "22vh",
    },

    // Pulso Central
    centralPulse: (textColor, accentColor, titleYOffset) => ({
        textAlign: "center",
        marginBottom: "1vh",
        zIndex: 10,
        width: "100%",
        padding: "0 20px",
        marginTop: `${titleYOffset}px`,
    }),

    // heroTitle como texto fallback
    heroTitle: (textColor, accentColor) => ({
        fontSize: "clamp(3rem, 7vw, 9rem)",
        fontWeight: 400,
        fontFamily: "Josefin Sans",
        color: textColor,
        marginBottom: "10px",
        lineHeight: 1.1,
        textShadow: `0 0 15px ${accentColor}55, 0 0 30px ${accentColor}33, 0 0 50px ${accentColor}11`,
    }),

    // ⬇️ NUEVO: imagen título estilo Fragmentos del Sol
    heroImageStyle: {
        width: "auto",
        height: "100px",
        margin: "18px 0 10px 0",
        objectFit: "contain",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
        filter: "drop-shadow(0 0 8px rgba(0,194,255,0.4))",
    },

    // heroSubtitle
    heroSubtitle: (textColor) => ({
        fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
        fontWeight: 300,
        color: textColor,
        maxWidth: "700px",
        margin: "0 auto",
        lineHeight: 1.6,
        opacity: 0.85,
        whiteSpace: "pre-line",
    }),

    // orbitalContainer
    orbitalContainer: {
        position: "relative",
        width: "clamp(350px, 50vw, 700px)",
        height: "clamp(350px, 50vw, 700px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "0",
        flexShrink: 0,
    },

    // Sol wrapper y capas
    sunWrapper: {
        position: "absolute",
        width: "130px",
        height: "130px",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 20,
    },

    sunCore: (sunColor, accentColor) => ({
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle at 55% 55%, #ffffff 8%, ${sunColor} 55%, #ff9a2e 90%)`,
        boxShadow: `
            0 0 22px ${sunColor}F0,
            0 0 60px ${sunColor}CC,
            0 0 110px ${accentColor}88
        `,
        animation: `sunPulse 4s infinite alternate ease-in-out`,
    }),

    sunHalo: (sunColor, haloSize, haloOpacity, haloBlurPx) => ({
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${haloSize}px`,
        height: `${haloSize}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `
            radial-gradient(
                circle,
                ${sunColor}33 0%,
                ${sunColor}22 35%,
                ${sunColor}10 55%,
                transparent 70%
            )
        `,
        filter: `blur(${haloBlurPx}px)`,
        opacity: haloOpacity,
        zIndex: 18,
        pointerEvents: "none",
        animation: "haloPulse 6s ease-in-out infinite",
    }),

    sunCorona: (
        sunColor,
        coronaSize,
        coronaOpacity,
        coronaBlurPx,
        coronaSpeedSec
    ) => ({
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${coronaSize}px`,
        height: `${coronaSize}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.02), rgba(255,255,255,0.09) 8%, rgba(255,255,255,0.02) 16%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.09) 40%, rgba(255,255,255,0.02) 48%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0.02) 66%, rgba(255,255,255,0.09) 74%, rgba(255,255,255,0.02) 84%, rgba(255,255,255,0.06) 92%, rgba(255,255,255,0.02) 100%)",
        maskImage:
            "radial-gradient(circle, transparent 0%, transparent 45%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,1) 85%)",
        WebkitMaskImage:
            "radial-gradient(circle, transparent 0%, transparent 45%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,1) 85%)",
        opacity: coronaOpacity,
        filter: `blur(${coronaBlurPx}px)`,
        zIndex: 19,
        pointerEvents: "none",
        animation: `coronaSpin ${coronaSpeedSec}s linear infinite`,
    }),

    keyframesSunPulse: (sunColor, accentColor) => `
        @keyframes sunPulse {
            0% {
                transform: scale(1);
                box-shadow:
                    0 0 20px ${sunColor}FF,
                    0 0 40px ${sunColor}CC,
                    0 0 80px ${accentColor}AA,
                    0 0 120px ${accentColor}77,
                    0 0 200px ${accentColor}55;
            }
            100% {
                transform: scale(1.08);
                box-shadow:
                    0 0 30px ${sunColor}FF,
                    0 0 60px ${sunColor}EE,
                    0 0 100px ${accentColor}CC,
                    0 0 150px ${accentColor}99,
                    0 0 250px ${accentColor}77;
            }
        }
    `,
    keyframesHalo: `
        @keyframes haloPulse {
            0%   { transform: translate(-50%, -50%) scale(0.98); opacity: 0.85; }
            50%  { transform: translate(-50%, -50%) scale(1.02); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0.85; }
        }
    `,
    keyframesCorona: `
        @keyframes coronaSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `,

    planetNodeWrapper: {
        position: "absolute",
        left: "50%",
        top: "50%",
        zIndex: 50,
        transformOrigin: "0 0",
    },

    planetNodeVisual: (size, planetBgColor, shadowColor) => ({
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, #FFFFFF44, ${planetBgColor} 80%)`,
        boxShadow: `inset 0 0 ${size * 0.1}px rgba(0,0,0,0.5), 0 0 ${size * 0.2}px ${shadowColor}55`,
        cursor: "pointer",
        transition: "transform 0.4s ease, box-shadow 0.4s ease",
        transformOrigin: "center center",
        position: "relative",
        display: "block",
    }),

    hoverStyle: (shadowColor, size) => ({
        scale: 1.15,
        boxShadow: `inset 0 0 ${size * 0.15}px rgba(0,0,0,0.7),
                    0 0 ${size * 0.3}px ${shadowColor}AA,
                    0 0 ${size * 0.5}px ${shadowColor}66`,
    }),

    planetLabelFixed: (textColor, size) => ({
        position: "absolute",
        bottom: `-${size * 0.4 + 15}px`,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        pointerEvents: "none",
        fontSize: "13px",
        fontWeight: 500,
        color: textColor,
        textShadow: "0 0 5px rgba(0,0,0,0.7)",
        opacity: 0.8,
        transition: "opacity 0.3s ease",
        whiteSpace: "nowrap",
    }),
    labelHoverStyle: { opacity: 1 },

    // Panel holográfico lateral
    holographicPanel: (accentColor) => ({
        position: "fixed",
        right: "40px",
        top: "18vh",
        width: "360px",
        height: "auto",
        background: "rgba(5, 10, 20, 0.9)",
        border: `1px solid ${accentColor}88`,
        borderRadius: "24px",
        backdropFilter: "blur(10px)",
        boxShadow: `
            0 0 6px ${accentColor}AA,
            0 0 18px ${accentColor}77,
            0 0 40px ${accentColor}44,
            0 5px 15px rgba(0,0,0,0.3)
        `,
        padding: "18px",
        zIndex: 400,
        color: "#E8E8E8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        overflow: "hidden",
    }),

    panelCloseButton: (accentColor) => ({
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: `2px solid ${accentColor}`,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
        boxShadow: `0 0 6px rgba(0,0,0,0.35), 0 0 8px ${accentColor}33`,
        transformOrigin: "center",
        willChange: "transform, box-shadow, background-color, opacity",
        opacity: 0.49,
    }),
    panelCloseHitbox: {
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "36px",
        height: "36px",
        zIndex: 1000,
        pointerEvents: "auto",
    },

    panelContentWrapper: (accentColor) => ({
        width: "100%",
        height: "100%",
        background: "rgba(10, 25, 45, 0.85)",
        borderRadius: "16px",
        padding: "60px 30px 30px 30px",
        marginTop: "-40px",
        position: "relative",
        zIndex: 1,
        border: `1px solid ${accentColor}33`,
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.6)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    }),

    panelPlanetIcon: (size, bgColor, shadowColor) => ({
        width: `${size * 0.9}px`,
        height: `${size * 0.9}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, #FFFFFF77, ${bgColor} 80%)`,
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.6), 0 0 25px ${shadowColor}BB`,
        position: "relative",
        zIndex: 5,
        marginTop: "-12px",
        marginBottom: "0px",
        border: `1.5px solid ${shadowColor}77`,
    }),
    panelTitle: (accentColor) => ({
        fontSize: "1.6rem",
        fontWeight: 600,
        color: accentColor,
        marginBottom: "10px",
        lineHeight: 1.25,
        textShadow: `0 0 12px ${accentColor}99`,
    }),
    panelDesc: (textColor) => ({
        fontSize: "0.9rem",
        fontWeight: 300,
        color: textColor,
        lineHeight: 1.6,
        opacity: 0.85,
        marginBottom: "30px",
        flexGrow: 1,
    }),
    panelButton: (accentColor) => ({
        display: "inline-block",
        padding: "9px 20px",
        background: "transparent",
        color: accentColor,
        border: `1px solid ${accentColor}CC`,
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: 500,
        transition:
            "background-color 0.25s ease-in, color 0.25s ease-in, transform 0.2s ease-in, box-shadow 0.25s ease-in",
        cursor: "pointer",
        fontSize: "0.9rem",
        zIndex: 1,
        boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.55)},
                    0 0 25px ${hexToRgba(accentColor, 0.33)}`,
        transform: "scale(1)",
    }),
}

/* ─────────────────────────────
   Utils
   ───────────────────────────── */
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

const StarsBackground = memo(({ numStars }) => {
    const [stars, setStars] = useState([])
    useEffect(() => {
        setStars(generateStars(numStars))
    }, [numStars])
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

const calculateOrbitalPosition = (radius, angle) => ({
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
})

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
            initial={{
                opacity: 0,
                scale: 0,
            }}
            animate={{
                opacity: [0, 1, 0],
                scale: 2,
            }}
            transition={{
                duration: durationSec,
                ease: "easeOut",
            }}
            onAnimationComplete={onComplete}
        />
    )
}

/* ─────────────────────────────
   Componente principal
   ───────────────────────────── */
export function PortalEstelarHolografico(props) {
    const {
        // flare
        flareEnabled,
        flareDurationSec,
        flareColor,

        // look & content
        bgColor,
        textColor,
        accentColor,
        heroTitleText,
        heroSubtitleText,
        heroImage,
        sunColor,
        numStars,

        // planetas...
        p1_BgColor,
        p1_Size,
        p1_Title,
        p1_Desc,
        p1_Link,
        p1_TargetBlank,
        p1_OrbitRadius,
        p1_OrbitDuration,
        p1_StartAngle,

        p2_BgColor,
        p2_Size,
        p2_Title,
        p2_Desc,
        p2_Link,
        p2_TargetBlank,
        p2_OrbitRadius,
        p2_OrbitDuration,
        p2_StartAngle,

        p3_BgColor,
        p3_Size,
        p3_Title,
        p3_Desc,
        p3_Link,
        p3_TargetBlank,
        p3_OrbitRadius,
        p3_OrbitDuration,
        p3_StartAngle,

        p4_BgColor,
        p4_Size,
        p4_Title,
        p4_Desc,
        p4_Link,
        p4_TargetBlank,
        p4_OrbitRadius,
        p4_OrbitDuration,
        p4_StartAngle,

        p5_BgColor,
        p5_Size,
        p5_Title,
        p5_Desc,
        p5_Link,
        p5_TargetBlank,
        p5_OrbitRadius,
        p5_OrbitDuration,
        p5_StartAngle,

        navLibrosText,
        navInicioText,
        navServiciosText,

        // halo / corona props
        haloEnabled,
        haloSize,
        haloOpacity,
        haloBlurPx,

        coronaEnabled,
        coronaSize,
        coronaOpacity,
        coronaBlurPx,
        coronaSpeedSec,

        // 👇 nuevo
        autoSelectDelaySec = 2,

        // 👇 nuevo: control para bajar el título y subtítulo en el eje Y
        titleYOffset = 0,
    } = props

    const [activePlanetInfo, setActivePlanetInfo] = useState(null)
    const [hoveredPlanetId, setHoveredPlanetId] = useState(null)

    // inicia completo si no hay flare
    const [isIntroComplete, setIsIntroComplete] = useState(!flareEnabled)

    // pathname seguro
    const safePathname = React.useMemo(() => "", [])
    const [pathname, setPathname] = useState(safePathname)
    useEffect(() => {
        if (typeof window !== "undefined" && window.location) {
            setPathname(window.location.pathname || "")
        }
    }, [])

    // seteo de background del body/html
    useEffect(() => {
        const html = document.documentElement
        const prevHtmlBg = html.style.backgroundColor
        const prevBodyBg = document.body.style.backgroundColor
        const prevBodyMargin = document.body.style.margin
        const prevOverflowY = document.body.style.overflowY

        html.style.backgroundColor = bgColor || "#01010A"
        document.body.style.backgroundColor = bgColor || "#01010A"
        document.body.style.margin = "0"
        document.body.style.overflowY = "auto"

        return () => {
            html.style.backgroundColor = prevHtmlBg
            document.body.style.backgroundColor = prevBodyBg
            document.body.style.margin = prevBodyMargin
            document.body.style.overflowY = prevOverflowY
        }
    }, [bgColor])

    const planetData = [
        {
            id: "libros",
            bgColor: p1_BgColor,
            size: p1_Size,
            title: p1_Title,
            desc: p1_Desc,
            link: p1_Link,
            targetBlank: p1_TargetBlank,
            orbitRadius: p1_OrbitRadius,
            orbitDuration: p1_OrbitDuration,
            startAngle: p1_StartAngle,
        },
        {
            id: "servicios",
            bgColor: p2_BgColor,
            size: p2_Size,
            title: p2_Title,
            desc: p2_Desc,
            link: p2_Link,
            targetBlank: p2_TargetBlank,
            orbitRadius: p2_OrbitRadius,
            orbitDuration: p2_OrbitDuration,
            startAngle: p2_StartAngle,
        },
        {
            id: "fragmentos",
            bgColor: p3_BgColor,
            size: p3_Size,
            title: p3_Title,
            desc: p3_Desc,
            link: p3_Link,
            targetBlank: p3_TargetBlank,
            orbitRadius: p3_OrbitRadius,
            orbitDuration: p3_OrbitDuration,
            startAngle: p3_StartAngle,
        },
        {
            id: "musica",
            bgColor: p4_BgColor,
            size: p4_Size,
            title: p4_Title,
            desc: p4_Desc,
            link: p4_Link,
            targetBlank: p4_TargetBlank,
            orbitRadius: p4_OrbitRadius,
            orbitDuration: p4_OrbitDuration,
            startAngle: p4_StartAngle,
        },
        {
            id: "patreon",
            bgColor: p5_BgColor,
            size: p5_Size,
            title: p5_Title,
            desc: p5_Desc,
            link: p5_Link,
            targetBlank: p5_TargetBlank,
            orbitRadius: p5_OrbitRadius,
            orbitDuration: p5_OrbitDuration,
            startAngle: p5_StartAngle,
        },
    ]

    const panelVariants = {
        hidden: { opacity: 0, x: 50, scale: 0.9 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        },
        exit: {
            opacity: 0,
            x: 30,
            scale: 0.95,
            transition: { duration: 0.2, ease: "easeOut" },
        },
    }

    const dynamicSunKeyframes = styles.keyframesSunPulse(sunColor, accentColor)

    const closeBtnVariants = {
        rest: {
            scale: 1,
            rotate: 0,
            y: 0,
            backgroundColor: "transparent",
            boxShadow: `0 0 6px rgba(0,0,0,0.35),
                        0 0 8px ${hexToRgba(accentColor, 0.33)}`,
            opacity: 0.49,
            transition: { duration: 0.3, ease: "easeOut" },
        },
        hover: {
            scale: 1.1,
            rotate: 45,
            y: -2,
            backgroundColor: hexToRgba(accentColor, 0.15),
            boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.7)},
                        0 0 20px ${hexToRgba(accentColor, 0.5)},
                        0 0 30px ${hexToRgba(accentColor, 0.3)}`,
            opacity: 1,
            transition: {
                scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                rotate: { duration: 0.4, ease: "easeInOut" },
                boxShadow: { duration: 0.3, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut" },
                backgroundColor: { duration: 0.3, ease: "easeOut" },
            },
        },
        tap: {
            scale: 0.95,
            rotate: 45,
            y: 0,
            backgroundColor: hexToRgba(accentColor, 0.25),
            boxShadow: `0 0 8px ${hexToRgba(accentColor, 0.5)},
                        0 0 15px ${hexToRgba(accentColor, 0.3)}`,
            opacity: 1,
            transition: { duration: 0.15, ease: "easeIn" },
        },
    }

    return (
        <motion.div style={styles.portalContainer(bgColor)}>
            {/* keyframes dinámicos */}
            <style>{dynamicSunKeyframes}</style>
            <style>{styles.keyframesHalo}</style>
            <style>{styles.keyframesCorona}</style>

            {/* Intro flare */}
            <AnimatePresence>
                {!isIntroComplete && (
                    <GoldenFlareAnimation
                        onComplete={() => setIsIntroComplete(true)}
                        durationSec={flareDurationSec}
                        flareColor={flareColor}
                    />
                )}
            </AnimatePresence>

            {/* Fondo de estrellas */}
            <StarsBackground numStars={numStars} />

            {/* Contenido */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isIntroComplete ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "linear", delay: 0.05 }}
                style={{ width: "100%", position: "relative", zIndex: 1 }}
            >
                {/* CONTENIDO CENTRAL */}
                <div style={styles.solarSystemContainer}>
                    <motion.div
                        style={styles.centralPulse(
                            textColor,
                            accentColor,
                            titleYOffset
                        )}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.5,
                            ease: "easeOut",
                        }}
                    >
                        {/* ⬇️ Mostramos PNG si hay heroImage cargado.
                               Si no, caemos al <h1> original de texto */}
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt="Titulo Origen"
                                style={styles.heroImageStyle}
                            />
                        ) : (
                            <h1
                                style={styles.heroTitle(textColor, accentColor)}
                            >
                                {heroTitleText}
                            </h1>
                        )}

                        <p
                            style={styles.heroSubtitle(textColor)}
                            dangerouslySetInnerHTML={{
                                __html: heroSubtitleText.replace(
                                    /\n/g,
                                    "<br />"
                                ),
                            }}
                        />
                    </motion.div>

                    <div style={styles.orbitalContainer}>
                        {/* Sol central */}
                        <div style={styles.sunWrapper}>
                            {haloEnabled && (
                                <div
                                    style={styles.sunHalo(
                                        sunColor,
                                        haloSize,
                                        haloOpacity,
                                        haloBlurPx
                                    )}
                                />
                            )}

                            {coronaEnabled && (
                                <div
                                    style={styles.sunCorona(
                                        sunColor,
                                        coronaSize,
                                        coronaOpacity,
                                        coronaBlurPx,
                                        coronaSpeedSec
                                    )}
                                />
                            )}

                            <div
                                style={styles.sunCore(sunColor, accentColor)}
                            />
                        </div>

                        {/* Planetas orbitando */}
                        {planetData.map((planet, index) => {
                            const orbitPoints = 24
                            const xKeyframes = []
                            const yKeyframes = []
                            const keyframeTimes = []
                            for (let i = 0; i <= orbitPoints; i++) {
                                const angle =
                                    planet.startAngle +
                                    (i / orbitPoints) * 2 * Math.PI
                                const { x, y } = calculateOrbitalPosition(
                                    planet.orbitRadius,
                                    angle
                                )
                                xKeyframes.push(x)
                                yKeyframes.push(y)
                                keyframeTimes.push(i / orbitPoints)
                            }

                            const isHovered = hoveredPlanetId === planet.id
                            const adjustedDuration = planet.orbitDuration * 1.5

                            return (
                                <React.Fragment key={planet.id}>
                                    <motion.div
                                        style={{
                                            ...styles.planetNodeWrapper,
                                            width: planet.size,
                                            height: planet.size,
                                            zIndex: 50 + index,
                                        }}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.5,
                                            x: xKeyframes[0],
                                            y: yKeyframes[0],
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            x: xKeyframes,
                                            y: yKeyframes,
                                        }}
                                        transition={{
                                            opacity: {
                                                duration: 0.8,
                                                delay: 0.8 + index * 0.15,
                                            },
                                            scale: {
                                                duration: 0.5,
                                                delay: 0.8 + index * 0.15,
                                            },
                                            x: {
                                                duration: adjustedDuration,
                                                repeat: Infinity,
                                                ease: "linear",
                                                times: keyframeTimes,
                                            },
                                            y: {
                                                duration: adjustedDuration,
                                                repeat: Infinity,
                                                ease: "linear",
                                                times: keyframeTimes,
                                            },
                                        }}
                                        onMouseEnter={() => {
                                            setActivePlanetInfo(planet)
                                            setHoveredPlanetId(planet.id)
                                        }}
                                    >
                                        <motion.a
                                            href={planet.link}
                                            target={
                                                planet.targetBlank
                                                    ? "_blank"
                                                    : "_self"
                                            }
                                            rel="noopener noreferrer"
                                            style={{
                                                ...styles.planetNodeVisual(
                                                    planet.size,
                                                    planet.bgColor,
                                                    accentColor
                                                ),
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                            }}
                                            animate={
                                                isHovered
                                                    ? styles.hoverStyle(
                                                          accentColor,
                                                          planet.size
                                                      )
                                                    : {
                                                          scale: 1,
                                                          boxShadow:
                                                              styles.planetNodeVisual(
                                                                  planet.size,
                                                                  planet.bgColor,
                                                                  accentColor
                                                              ).boxShadow,
                                                      }
                                            }
                                            transition={{
                                                duration: 0.4,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <motion.div
                                                style={styles.planetLabelFixed(
                                                    textColor,
                                                    planet.size
                                                )}
                                                initial={{ opacity: 0.8 }}
                                                animate={
                                                    isHovered
                                                        ? { opacity: 1 }
                                                        : { opacity: 0.8 }
                                                }
                                                transition={{ duration: 0.3 }}
                                            >
                                                {planet.title}
                                            </motion.div>
                                        </motion.a>
                                    </motion.div>
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>

                {/* PANEL LATERAL flotante al hover de planeta */}
                <AnimatePresence>
                    {activePlanetInfo && (
                        <motion.div
                            style={{
                                ...styles.holographicPanel(accentColor),
                                position: "fixed",
                            }}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={panelVariants}
                            key="holographic-panel"
                        >
                            {/* Botón cerrar */}
                            <div style={styles.panelCloseHitbox}>
                                <motion.button
                                    type="button"
                                    aria-label="Cerrar panel"
                                    style={styles.panelCloseButton(accentColor)}
                                    variants={closeBtnVariants}
                                    initial="rest"
                                    animate="rest"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => {
                                        setActivePlanetInfo(null)
                                        setHoveredPlanetId(null)
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <line
                                            x1="6"
                                            y1="6"
                                            x2="18"
                                            y2="18"
                                            stroke={accentColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                        <line
                                            x1="18"
                                            y1="6"
                                            x2="6"
                                            y2="18"
                                            stroke={accentColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Icono planeta en mini */}
                            <div
                                style={styles.panelPlanetIcon(
                                    activePlanetInfo.size,
                                    activePlanetInfo.bgColor,
                                    accentColor
                                )}
                            />

                            <div
                                style={styles.panelContentWrapper(accentColor)}
                            >
                                <h3 style={styles.panelTitle(accentColor)}>
                                    {activePlanetInfo.title}
                                </h3>

                                <p style={styles.panelDesc(textColor)}>
                                    {activePlanetInfo.desc}
                                </p>

                                <motion.a
                                    href={activePlanetInfo.link}
                                    target={
                                        activePlanetInfo.targetBlank
                                            ? "_blank"
                                            : "_self"
                                    }
                                    rel="noopener noreferrer"
                                    style={styles.panelButton(accentColor)}
                                    whileHover={{
                                        scale: 1.05,
                                        backgroundColor: hexToRgba(
                                            accentColor,
                                            0.16
                                        ),
                                        color: "#FFFFFF",
                                        boxShadow: `0 0 12px ${hexToRgba(
                                            accentColor,
                                            0.55
                                        )}, 0 0 25px ${hexToRgba(
                                            accentColor,
                                            0.33
                                        )}`,
                                    }}
                                >
                                    Ir al nodo →
                                </motion.a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}

/* ─────────────────────────────
   Defaults
   ───────────────────────────── */
PortalEstelarHolografico.defaultProps = {
    flareEnabled: true,
    flareDurationSec: 1.0,
    flareColor: "#FFD700",

    haloEnabled: true,
    haloSize: 460,
    haloOpacity: 0.9,
    haloBlurPx: 18,

    coronaEnabled: true,
    coronaSize: 360,
    coronaOpacity: 0.5,
    coronaBlurPx: 1,
    coronaSpeedSec: 28,

    width: 1200,
    height: 900,

    bgColor: "#01010A",
    textColor: "#F0F0F0",
    accentColor: "#00C2FF",
    sunColor: "#FF8C00",

    numStars: 150,
    autoSelectDelaySec: 2,
    navInicioText: "Origen",

    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText:
        "Irradiamos desde el eje. Campo de activación y resonancia para nodos solares.",
    heroImage: undefined, // ⬅️ por defecto no hay imagen

    p1_BgColor: "#FFAB40",
    p1_Size: 70,
    p1_Title: "Libros",
    p1_Desc:
        "Geometrías vivas en forma de palabra. Pulsos de la conciencia encarnados.",
    p1_Link: "#",
    p1_TargetBlank: false,
    p1_OrbitRadius: 100,
    p1_OrbitDuration: 30,
    p1_StartAngle: 0,

    p2_BgColor: "#B1D8FF",
    p2_Size: 60,
    p2_Title: "Servicios",
    p2_Desc: "Acompañamiento y recalibración vibral para nodos en activación.",
    p2_Link: "#",
    p2_TargetBlank: false,
    p2_OrbitRadius: 160,
    p2_OrbitDuration: 37.5,
    p2_StartAngle: Math.PI / 2,

    p3_BgColor: "#F78A54",
    p3_Size: 55,
    p3_Title: "Fragmentos",
    p3_Desc:
        "Episodios de pulsos visuales y sonoros para la activación del campo.",
    p3_Link: "https://www.redsolarviva.com/fragmentosdelsol",
    p3_TargetBlank: true,
    p3_OrbitRadius: 220,
    p3_OrbitDuration: 45,
    p3_StartAngle: Math.PI,

    p4_BgColor: "#9AE5D4",
    p4_Size: 65,
    p4_Title: "Música",
    p4_Desc:
        "Pineal Scores. Frecuencias armónicas y resonantes para el campo interno.",
    p4_Link: "https://open.spotify.com/artist/tu_artista",
    p4_TargetBlank: true,
    p4_OrbitRadius: 280,
    p4_OrbitDuration: 52.5,
    p4_StartAngle: (3 * Math.PI) / 2,

    p5_BgColor: "#E0E0E0",
    p5_Size: 50,
    p5_Title: "Patreon",
    p5_Desc: "Sostén el pulso. Campo de co-creación e intercambio energético.",
    p5_Link: "https://www.patreon.com/tu_usuario",
    p5_TargetBlank: true,
    p5_OrbitRadius: 100,
    p5_OrbitDuration: 60,
    p5_StartAngle: Math.PI / 4,

    navLibrosText: "Libros",
    navServiciosText: "Servicios",

    // 👇 nuevo: default para el offset Y del título
    titleYOffset: 0,
}

/* ─────────────────────────────
   Controles Framer
   ───────────────────────────── */
addPropertyControls(PortalEstelarHolografico, {
    // flare
    flareEnabled: {
        type: ControlType.Boolean,
        title: "Activar Flare Inicial",
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
        hidden: (props) => props.flareEnabled === false,
    },

    autoSelectDelaySec: {
        type: ControlType.Number,
        title: "Delay Hover→Abrir (s)",
        defaultValue: 2,
        min: 0.2,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    navInicioText: {
        type: ControlType.String,
        title: "Texto Nav Origen",
    },

    // halo / corona
    haloEnabled: { type: ControlType.Boolean, title: "Halo activo" },
    haloSize: {
        type: ControlType.Number,
        title: "Halo tamaño",
        min: 100,
        max: 900,
        step: 10,
    },
    haloOpacity: {
        type: ControlType.Number,
        title: "Halo opacidad",
        min: 0,
        max: 1,
        step: 0.05,
    },
    haloBlurPx: {
        type: ControlType.Number,
        title: "Halo blur (px)",
        min: 0,
        max: 60,
        step: 1,
    },

    coronaEnabled: { type: ControlType.Boolean, title: "Corona activa" },
    coronaSize: {
        type: ControlType.Number,
        title: "Corona tamaño",
        min: 120,
        max: 900,
        step: 10,
    },
    coronaOpacity: {
        type: ControlType.Number,
        title: "Corona opacidad",
        min: 0,
        max: 1,
        step: 0.05,
    },
    coronaBlurPx: {
        type: ControlType.Number,
        title: "Corona blur (px)",
        min: 0,
        max: 30,
        step: 1,
    },
    coronaSpeedSec: {
        type: ControlType.Number,
        title: "Corona velocidad (s)",
        min: 4,
        max: 120,
        step: 1,
    },

    // fondo / tipografía / título
    bgColor: { type: ControlType.Color, title: "Fondo Estelar" },
    textColor: { type: ControlType.Color, title: "Texto General" },
    accentColor: { type: ControlType.Color, title: "Acento Neón/Solar" },
    sunColor: { type: ControlType.Color, title: "Color del Sol" },

    numStars: {
        type: ControlType.Number,
        title: "Num Estrellas",
        min: 0,
        max: 500,
        step: 10,
    },

    // ⬇️ NUEVO: subir PNG del título
    heroImage: {
        type: ControlType.Image,
        title: "Título PNG",
    },

    heroTitleText: {
        type: ControlType.String,
        title: "Título Central (fallback)",
        /** este se usa solo si no hay heroImage */
    },

    heroSubtitleText: {
        type: ControlType.String,
        title: "Subtítulo Central",
        rows: 3,
        defaultValue: PortalEstelarHolografico.defaultProps.heroSubtitleText,
    },

    // 👇 nuevo: control para bajar el título y subtítulo en el eje Y (positivo = más abajo)
    titleYOffset: {
        type: ControlType.Number,
        title: "Título Y Offset (px)",
        defaultValue: 0,
        min: -200,
        max: 500,
        step: 10,
        displayStepper: true,
    },

    // Planeta 1
    p1_BgColor: { type: ControlType.Color, title: "P1 Color" },
    p1_Size: {
        type: ControlType.Number,
        title: "P1 Tamaño",
        min: 30,
        max: 150,
        step: 5,
    },
    p1_Title: { type: ControlType.String, title: "P1 Título" },
    p1_Desc: { type: ControlType.String, title: "P1 Descripción", rows: 3 },
    p1_Link: { type: ControlType.String, title: "P1 Link" },
    p1_TargetBlank: { type: ControlType.Boolean, title: "P1 Nuevo Tab" },
    p1_OrbitRadius: {
        type: ControlType.Number,
        title: "P1 Radio Órbita",
        min: 50,
        max: 500,
        step: 10,
    },
    p1_OrbitDuration: {
        type: ControlType.Number,
        title: "P1 Duración Órbita (s)",
        min: 10,
        max: 180,
        step: 5,
    },
    p1_StartAngle: {
        type: ControlType.Number,
        title: "P1 Ángulo Inicio (rad)",
        min: 0,
        max: 6.28,
        step: 0.1,
    },

    // Planeta 2
    p2_BgColor: { type: ControlType.Color, title: "P2 Color" },
    p2_Size: {
        type: ControlType.Number,
        title: "P2 Tamaño",
        min: 30,
        max: 150,
        step: 5,
    },
    p2_Title: { type: ControlType.String, title: "P2 Título" },
    p2_Desc: { type: ControlType.String, title: "P2 Descripción", rows: 3 },
    p2_Link: { type: ControlType.String, title: "P2 Link" },
    p2_TargetBlank: { type: ControlType.Boolean, title: "P2 Nuevo Tab" },
    p2_OrbitRadius: {
        type: ControlType.Number,
        title: "P2 Radio Órbita",
        min: 50,
        max: 500,
        step: 10,
    },
    p2_OrbitDuration: {
        type: ControlType.Number,
        title: "P2 Duración Órbita (s)",
        min: 10,
        max: 180,
        step: 5,
    },
    p2_StartAngle: {
        type: ControlType.Number,
        title: "P2 Ángulo Inicio (rad)",
        min: 0,
        max: 6.28,
        step: 0.1,
    },

    // Planeta 3
    p3_BgColor: { type: ControlType.Color, title: "P3 Color" },
    p3_Size: {
        type: ControlType.Number,
        title: "P3 Tamaño",
        min: 30,
        max: 150,
        step: 5,
    },
    p3_Title: { type: ControlType.String, title: "P3 Título" },
    p3_Desc: { type: ControlType.String, title: "P3 Descripción", rows: 3 },
    p3_Link: { type: ControlType.String, title: "P3 Link" },
    p3_TargetBlank: { type: ControlType.Boolean, title: "P3 Nuevo Tab" },
    p3_OrbitRadius: {
        type: ControlType.Number,
        title: "P3 Radio Órbita",
        min: 50,
        max: 500,
        step: 10,
    },
    p3_OrbitDuration: {
        type: ControlType.Number,
        title: "P3 Duración Órbita (s)",
        min: 10,
        max: 180,
        step: 5,
    },
    p3_StartAngle: {
        type: ControlType.Number,
        title: "P3 Ángulo Inicio (rad)",
        min: 0,
        max: 6.28,
        step: 0.1,
    },

    // Planeta 4
    p4_BgColor: { type: ControlType.Color, title: "P4 Color" },
    p4_Size: {
        type: ControlType.Number,
        title: "P4 Tamaño",
        min: 30,
        max: 150,
        step: 5,
    },
    p4_Title: { type: ControlType.String, title: "P4 Título" },
    p4_Desc: { type: ControlType.String, title: "P4 Descripción", rows: 3 },
    p4_Link: { type: ControlType.String, title: "P4 Link" },
    p4_TargetBlank: { type: ControlType.Boolean, title: "P4 Nuevo Tab" },
    p4_OrbitRadius: {
        type: ControlType.Number,
        title: "P4 Radio Órbita",
        min: 50,
        max: 500,
        step: 10,
    },
    p4_OrbitDuration: {
        type: ControlType.Number,
        title: "P4 Duración Órbita (s)",
        min: 10,
        max: 180,
        step: 5,
    },
    p4_StartAngle: {
        type: ControlType.Number,
        title: "P4 Ángulo Inicio (rad)",
        min: 0,
        max: 6.28,
        step: 0.1,
    },

    // Planeta 5
    p5_BgColor: { type: ControlType.Color, title: "P5 Color" },
    p5_Size: {
        type: ControlType.Number,
        title: "P5 Tamaño",
        min: 30,
        max: 150,
        step: 5,
    },
    p5_Title: { type: ControlType.String, title: "P5 Título" },
    p5_Desc: { type: ControlType.String, title: "P5 Descripción", rows: 3 },
    p5_Link: { type: ControlType.String, title: "P5 Link" },
    p5_TargetBlank: { type: ControlType.Boolean, title: "P5 Nuevo Tab" },
    p5_OrbitRadius: {
        type: ControlType.Number,
        title: "P5 Radio Órbita",
        min: 50,
        max: 500,
        step: 10,
    },
    p5_OrbitDuration: {
        type: ControlType.Number,
        title: "P5 Duración Órbita (s)",
        min: 10,
        max: 180,
        step: 5,
    },
    p5_StartAngle: {
        type: ControlType.Number,
        title: "P5 Ángulo Inicio (rad)",
        min: 0,
        max: 6.28,
        step: 0.1,
    },

    navLibrosText: { type: ControlType.String, title: "Texto Nav Libros" },
    navServiciosText: {
        type: ControlType.String,
        title: "Texto Nav Servicios",
    },
})
