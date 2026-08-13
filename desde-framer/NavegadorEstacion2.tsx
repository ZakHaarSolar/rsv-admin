// Red Solar Viva — NavegadorEstacion.tsx v3.0
// Renombrado desde MenuSolarD.tsx — semántica solar coherente: este es el
// Navegador de la Estación de Mando (desktop). Su gemelo en mobile es
// NavegadorLente.tsx. Contenido funcional idéntico al MenuSolarD v2.2.
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ───────── Tipos y enlaces ───────── */
type NavItem = {
    id:
        | "origen"
        | "fragmentos"
        | "simuladores"
        | "codices"
        | "meditaciones"
        | "sesiones"
        | "escaner"
        | "ninguna"
        | "membrana"
    label: string
    href: string
    allowHoverNavigate?: boolean
    openInNewTabOnClick?: boolean
}

const navItems: NavItem[] = [
    { id: "origen", label: "Origen", href: "/", allowHoverNavigate: true },
    {
        id: "fragmentos",
        label: "Fragmentos", // 👈 AQUÍ CAMBIAMOS EL TEXTO VISIBLE
        href: "/fragmentosdelsol",
        allowHoverNavigate: true,
    },
    {
        id: "simuladores",
        label: "Simuladores",
        href: "/simuladores",
        allowHoverNavigate: true,
    },
    {
        id: "codices",
        label: "Códices",
        href: "/codices",
        allowHoverNavigate: true,
    },
    {
        id: "meditaciones",
        label: "Meditaciones",
        href: "/meditaciones",
        allowHoverNavigate: true,
    },
    {
        id: "sesiones",
        label: "Sesiones",
        href: "/sesiones",
        allowHoverNavigate: true,
    },
    /* v4.9 — Escáner como entrada propia de la barra del Centro de
       Mando, a la derecha de Sesiones. Apunta a /radar (Escáner
       Vibracional). Antes vivía como tab interno de Mi Núcleo. */
    {
        id: "escaner",
        label: "Escáner",
        href: "/radar",
        allowHoverNavigate: true,
    },
]

/* ───────── Tema global ───────── */
type HoloTheme = "neon"

function useGlobalTheme() {
    const theme: HoloTheme = "neon"

    React.useEffect(() => {
        try {
            const root = document.documentElement
            const accent = "#00C2FF"

            root.style.setProperty("--accent", accent)
            root.setAttribute("data-theme", "neon")
            localStorage.setItem("holo-theme", "neon")
        } catch {}
    }, [])

    return { theme }
}

/* ───────── Estilos Base ───────── */

const styles = {
    navOuter: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        width: "100%",
        padding: "10px 0",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
    } as React.CSSProperties,

    navInner: (
        mode: "light" | "dark",
        textColor: string,
        barOpacity: number
    ) => {
        const o = Math.max(0, Math.min(1, barOpacity ?? 1))
        const lightBg = `linear-gradient(180deg, rgba(255,255,255,${0.85 * o}), rgba(226,238,248,${0.6 * o}))`
        const darkBg = `linear-gradient(145deg, rgba(7,24,38,${0.95 * o}), rgba(3,35,58,${0.95 * o}))`
        const lightBorder = `1px solid rgba(255,255,255,${0.7 * o})`
        const darkBorder = `1px solid rgba(255,255,255,${0.16 * o})`
        const lightShadow = `0 14px 30px rgba(15,23,42,${0.26 * o}), 0 0 0 1px rgba(255,255,255,${0.2 * o})`
        const darkShadow = `0 18px 38px rgba(0,0,0,${0.82 * o}), 0 0 0 1px rgba(0,0,0,${0.55 * o})`

        return {
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "8px 20px",
            borderRadius: 999,
            background: mode === "light" ? lightBg : darkBg,
            backdropFilter: "blur(26px) saturate(165%)",
            border: mode === "light" ? lightBorder : darkBorder,
            boxShadow: mode === "light" ? lightShadow : darkShadow,
            color: textColor,
            pointerEvents: "auto",
            maxWidth: "min(100% - 24px, 1180px)",
        } as React.CSSProperties
    },

    linksWrap: {
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: 0,
        flex: 1,
    } as React.CSSProperties,

    navSeparator: {
        marginLeft: 10,
        marginRight: 10,
        color: "rgba(255,255,255,0.28)",
        fontWeight: 400,
        pointerEvents: "none",
        userSelect: "none",
    } as React.CSSProperties,

    navLink: (textColor: string, baseOpacity: number) =>
        ({
            color: textColor,
            textDecoration: "none",
            fontSize: "15px",
            padding: "6px 8px",
            borderRadius: "4px",
            transition:
                "color .18s ease, text-shadow .18s ease, box-shadow .18s ease, opacity .18s ease",
            cursor: "pointer",
            opacity: baseOpacity,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }) as React.CSSProperties,

    navLinkHover: (mode: "light" | "dark", highlightTextOpacity: number) => ({
        color: "var(--accent, #00C2FF)",
        opacity: highlightTextOpacity,
        textShadow:
            mode === "light"
                ? "0 0 6px color-mix(in oklab, var(--accent, #00C2FF) 55%, transparent)"
                : "0 0 10px color-mix(in oklab, var(--accent, #00C2FF) 75%, transparent)",
    }),

    navLinkActive: (
        mode: "light" | "dark",
        glowOpacity: number,
        highlightTextOpacity: number
    ) => {
        const clampedGlow = Math.max(0, Math.min(1, glowOpacity ?? 1))
        const mixPct =
            mode === "light" ? 35 + 45 * clampedGlow : 55 + 35 * clampedGlow
        const blur =
            mode === "light" ? 4 + 6 * clampedGlow : 6 + 10 * clampedGlow

        return {
            color: "var(--accent, #00C2FF)",
            opacity: highlightTextOpacity,
            textShadow: `0 0 ${blur}px color-mix(in oklab, var(--accent, #00C2FF) ${mixPct}%, transparent)`,
            cursor: "default",
            pointerEvents: "none",
        }
    },
}

/* ───────── Efecto Hover Cósmico Líquido ───────── */

function CosmicHoverEffect({ mode }: { mode: "light" | "dark" }) {
    const baseColor = "rgba(0, 194, 255,"

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: "-4px -14px",
                zIndex: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
            <motion.div
                initial={{ opacity: 0.8, scale: 0.4 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "20px",
                    background:
                        mode === "light"
                            ? `${baseColor} 0.3)`
                            : `${baseColor} 0.5)`,
                    filter: "blur(6px)",
                }}
            />

            <motion.div
                animate={{
                    scale: [0.9, 1.05, 0.9],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "16px",
                    background:
                        mode === "light"
                            ? `${baseColor} 0.15)`
                            : `${baseColor} 0.2)`,
                    filter: "blur(8px)",
                }}
            />

            <motion.div
                animate={{
                    scale: [0.8, 1.15, 0.8],
                    opacity: [0.1, 0.4, 0.1],
                }}
                transition={{
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: 0.4,
                }}
                style={{
                    position: "absolute",
                    width: "60%",
                    height: "60%",
                    borderRadius: "50%",
                    background: `${baseColor} 0.4)`,
                    filter: "blur(10px)",
                }}
            />
        </motion.div>
    )
}

/* ───────── Item de link ───────── */

function NavLinkItem({
    item,
    textColor,
    isActive,
    mode,
    baseTextOpacity,
    highlightTextOpacity,
    activeHighlightGlowOpacity,
}: {
    item: NavItem
    textColor: string
    isActive: boolean
    mode: "light" | "dark"
    baseTextOpacity: number
    highlightTextOpacity: number
    activeHighlightGlowOpacity: number
}) {
    const { label, href, openInNewTabOnClick } = item
    const isExternal = /^https?:\/\//i.test(href)
    const [isHovered, setIsHovered] = React.useState(false)

    const baseStyle = styles.navLink(textColor, baseTextOpacity)

    const animateStyle = isActive
        ? styles.navLinkActive(
              mode,
              activeHighlightGlowOpacity,
              highlightTextOpacity
          )
        : isHovered
          ? styles.navLinkHover(mode, highlightTextOpacity)
          : {}

    return (
        <motion.a
            className="solar-nav-link"
            data-active={isActive ? "true" : "false"}
            href={href}
            target={!isActive && openInNewTabOnClick ? "_blank" : undefined}
            rel={
                !isActive && openInNewTabOnClick
                    ? "noopener noreferrer"
                    : undefined
            }
            aria-current={isActive ? "page" : undefined}
            style={baseStyle as any}
            animate={animateStyle as any}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => {
                if (isActive) return
                setIsHovered(true)
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                if (isExternal) setIsHovered(false)
            }}
        >
            <AnimatePresence>
                {isHovered && !isActive && <CosmicHoverEffect mode={mode} />}
            </AnimatePresence>

            <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
        </motion.a>
    )
}

/* ───────── Props ───────── */

type Props = {
    currentTabId?: NavItem["id"]
    textColor?: string
    barOpacity?: number
    membraneBarOpacity?: number
    textOpacity?: number
    highlightTextOpacity?: number
    activeHighlightOpacity?: number
}

/* ───────── Componente principal ───────── */

function NavegadorEstacion({
    currentTabId = "origen",
    textColor = "#FFFFFF",
    barOpacity = 0.9,
    membraneBarOpacity = 0.9,
    textOpacity = 0.7,
    highlightTextOpacity = 1,
    activeHighlightOpacity = 1,
}: Props) {
    useGlobalTheme()

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const safeBarOpacity = clamp01(barOpacity)
    const safeMembraneBarOpacity = clamp01(membraneBarOpacity)
    const safeBaseTextOpacity = clamp01(textOpacity)
    const safeHighlightTextOpacity = clamp01(highlightTextOpacity)
    const safeActiveHighlightGlowOpacity = clamp01(activeHighlightOpacity)

    const rawTabId = (currentTabId || "origen") as string
    const normalizedTabId = rawTabId.toLowerCase() as NavItem["id"]

    const [routeIsMembrana, setRouteIsMembrana] = React.useState(false)
    React.useEffect(() => {
        try {
            const path =
                typeof window !== "undefined"
                    ? window.location.pathname.toLowerCase()
                    : ""
            if (path.includes("/membrana")) setRouteIsMembrana(true)
        } catch {}
    }, [])

    const isMembrana = normalizedTabId === "membrana" || routeIsMembrana
    const mode: "light" | "dark" = isMembrana ? "light" : "dark"
    const effectiveTextColor = isMembrana ? "#111111" : textColor || "#FFFFFF"
    const effectiveBarOpacity = isMembrana
        ? safeMembraneBarOpacity
        : safeBarOpacity

    return (
        <>
            <style>{`
            :root{ --btn-accent: var(--accent, #00C2FF); }
            .solar-nav-link{
                position:relative;
                font-weight:500;
                letter-spacing:0.02em;
            }
            `}</style>

            <nav style={styles.navOuter}>
                <div
                    style={{
                        ...styles.navInner(
                            mode,
                            effectiveTextColor,
                            effectiveBarOpacity
                        ),
                        whiteSpace: "nowrap",
                        ...(isMembrana
                            ? ({
                                  "--accent": "#00C2FF",
                                  "--btn-accent": "#00C2FF",
                              } as React.CSSProperties)
                            : {}),
                    }}
                >
                    <div style={styles.linksWrap}>
                        {navItems.map((it, index) => (
                            <React.Fragment key={it.id}>
                                {index > 0 && (
                                    <span
                                        aria-hidden="true"
                                        style={
                                            isMembrana
                                                ? {
                                                      ...styles.navSeparator,
                                                      color: "rgba(17,17,17,0.32)",
                                                  }
                                                : styles.navSeparator
                                        }
                                    >
                                        ·
                                    </span>
                                )}
                                <NavLinkItem
                                    item={it}
                                    textColor={effectiveTextColor}
                                    isActive={it.id === normalizedTabId}
                                    mode={mode}
                                    baseTextOpacity={safeBaseTextOpacity}
                                    highlightTextOpacity={
                                        safeHighlightTextOpacity
                                    }
                                    activeHighlightGlowOpacity={
                                        safeActiveHighlightGlowOpacity
                                    }
                                />
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </nav>
        </>
    )
}

export default NavegadorEstacion

/* v2.2 — NavRevealPin movido a su propio archivo NavRevealPin.tsx.
   Framer no resuelve named exports cuando otro componente local
   importa de aquí (TS2614 en Telemetría/Holograma/Motor). Cada
   capa admin ahora hace `import NavRevealPin from "./NavRevealPin.tsx"`
   y resuelve limpio. */

/* ───────── Property Controls (Framer) ───────── */

addPropertyControls(NavegadorEstacion, {
    currentTabId: {
        type: ControlType.Enum,
        title: "Pestaña actual",
        options: [
            "origen",
            "fragmentos",
            "simuladores",
            "codices",
            "meditaciones",
            "sesiones",
            "escaner",
            "ninguna",
        ],
        optionTitles: [
            "Origen",
            "Fragmentos", // 👈 TAMBIÉN LO CAMBIÉ AQUÍ para tu menú de opciones en Framer
            "Simuladores",
            "Códices",
            "Meditaciones",
            "Sesiones",
            "Escáner",
            "Ninguna (Sin Glow)",
        ],
        defaultValue: "origen",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto (otras pestañas)",
        defaultValue: "#FFFFFF",
    },
    barOpacity: {
        type: ControlType.Number,
        title: "Opacidad barra oscura",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
    },
    membraneBarOpacity: {
        type: ControlType.Number,
        title: "Opacidad barra Membrana",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
    },
    textOpacity: {
        type: ControlType.Number,
        title: "Opacidad texto base",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    highlightTextOpacity: {
        type: ControlType.Number,
        title: "Opacidad texto destacado",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    activeHighlightOpacity: {
        type: ControlType.Number,
        title: "Glow pestaña actual",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
