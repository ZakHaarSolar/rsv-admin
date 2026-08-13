import * as React from "react"
import {
    useState,
    useMemo,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
} from "react"
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ---------------------------------------------
   Utils
--------------------------------------------- */
const normalizeMultiline = (str?: string): string =>
    (str || "").replace(/\\n|\/n/g, "\n")
const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v))

/* color helpers (hex/rgb → rgba con alpha) */
const withAlpha = (color: string, a: number) => {
    if (!color) return `rgba(0,0,0,${a})`
    const c = color.trim()
    if (c.startsWith("#")) {
        const h = c.slice(1)
        const H =
            h.length === 3
                ? h
                      .split("")
                      .map((ch) => ch + ch)
                      .join("")
                : h
        const int = parseInt(H, 16)
        const r = (int >> 16) & 255,
            g = (int >> 8) & 255,
            b = int & 255
        return `rgba(${r},${g},${b},${a})`
    }
    const m = c.match(/rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/i)
    return m ? `rgba(${m[1]},${m[2]},${m[3]},${a})` : color
}

const readDomTheme = (): "matrix" | "neon" => {
    try {
        const el = document.documentElement
        const t =
            el.getAttribute("data-theme") ||
            localStorage.getItem("holo-theme") ||
            "matrix"
        return t === "neon" ? "neon" : "matrix"
    } catch {
        return "matrix"
    }
}
const readAccentVar = (): string => {
    try {
        const cs = getComputedStyle(document.documentElement)
        return (cs.getPropertyValue("--accent") || "#00FF41").trim()
    } catch {
        return "#00FF41"
    }
}

/* ---------------------------------------------
   Styles  (glows iguales en ambos temas).
   * ÚNICA EXCEPCIÓN: “Fragmento n” sin glow *
--------------------------------------------- */
const styles = {
    container: (bg: string) => ({
        position: "relative" as const,
        width: "100%",
        height: "100svh",
        background: bg,
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden" as const,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        touchAction: "pan-y",
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

    /* Botón menú fijo */
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

    /* Título PNG — glow suave (igual en ambos temas) */
    titleWrap: (offset: number) => ({
        position: "absolute" as const,
        top: `calc(env(safe-area-inset-top, 0px) + ${offset}px)`,
        left: 0,
        right: 0,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 16px",
    }),
    titleImg: (accent: string) => ({
        width: "auto",
        objectFit: "contain" as const,
        filter: `drop-shadow(0 0 10px rgba(255,215,0,.45)) drop-shadow(0 0 18px ${withAlpha(accent, 0.35)})`,
    }),

    /* Controles */
    controlsRow: (y: number) => ({
        position: "absolute" as const,
        top: y,
        left: 0,
        right: 0,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 16px",
    }),
    /* Botón TEMPORADA — mismo glow que matrix */
    pill: (accent: string, active: boolean) => ({
        padding: "9px 12px",
        borderRadius: 999,
        border: `1px solid ${accent}`,
        color: "#fff",
        fontSize: 12,
        letterSpacing: ".04em",
        textTransform: "uppercase" as const,
        background: active
            ? `linear-gradient(180deg, ${withAlpha(accent, 0.18)}, ${withAlpha(accent, 0.06)})`
            : "rgba(0,0,0,.35)",
        boxShadow: active ? `0 0 10px ${withAlpha(accent, 0.28)}` : "none",
        cursor: "pointer",
        userSelect: "none" as const,
        WebkitTapHighlightColor: "transparent",
    }),

    /* “Fragmento n” — SIN glow SIEMPRE */
    fragNeon: (accent: string, y: number, size: number) => ({
        position: "absolute" as const,
        top: y,
        left: 0,
        right: 0,
        textAlign: "center" as const,
        fontWeight: 700,
        letterSpacing: ".02em",
        color: accent,
        textShadow: "none",
        fontSize: size,
        pointerEvents: "none" as const,
        zIndex: 2,
    }),
    epTitleTop: (y: number) => ({
        position: "absolute" as const,
        top: y,
        left: 16,
        right: 16,
        textAlign: "center" as const,
        zIndex: 2,
        fontSize: 18,
        fontWeight: 700,
        color: "#FFFFFF",
        textShadow: "0 0 10px rgba(255,255,255,.25)",
    }),

    /* Cápsula centrada + órbita */
    wheelWrap: (top: number) => ({
        position: "absolute" as const,
        zIndex: 1,
        top,
        left: 0,
        right: 0,
        height: "48svh",
        minHeight: 320,
        display: "grid",
        placeItems: "center",
        overflow: "hidden" as const,
    }),
    orbitLineWrap: {
        position: "absolute" as const,
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: "160%",
        height: 120,
        pointerEvents: "none" as const,
        zIndex: 0,
    },
    sun: (yellow: string) => ({
        position: "absolute" as const,
        width: 16,
        height: 16,
        background: yellow,
        borderRadius: "50%",
        boxShadow: `0 0 16px ${withAlpha(yellow, 0.66)}, 0 0 32px ${withAlpha(yellow, 0.47)}`,
        opacity: 0.9,
        zIndex: 0,
    }),
    /* Cápsula — mismo glow que matrix */
    planet: (accent: string, size: number) => ({
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(60% 60% at 50% 45%, rgba(255,255,255,.18) 0%, ${withAlpha(accent, 0.18)} 55%, ${withAlpha(accent, 0.08)} 100%)`,
        border: `2px solid ${accent}`,
        boxShadow: `0 0 0 3px ${withAlpha(accent, 0.12)}, 0 0 28px ${withAlpha(accent, 0.5)}, inset 0 0 24px ${withAlpha(accent, 0.27)}`,
        display: "grid",
        placeItems: "center",
        position: "relative" as const,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        zIndex: 1,
    }),

    /* Descripción corta */
    descBottom: (bottomGap: number) => ({
        position: "absolute" as const,
        left: 16,
        right: 16,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomGap}px)`,
        textAlign: "center" as const,
        zIndex: 2,
        fontSize: 14,
        lineHeight: 1.55,
        color: "#E8F7FF",
        opacity: 0.92,
    }),

    /* Flechas — mismo glow que matrix */
    arrowsWrap: (bottomPx: number) => ({
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomPx}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        zIndex: 3,
    }),
    arrowBtnBase: (accent: string) => ({
        width: 48,
        height: 48,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "rgba(0,0,0,.4)",
        border: `1px solid ${accent}`,
        boxShadow: `0 0 16px ${withAlpha(accent, 0.53)}`,
        color: "#fff",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none" as const,
        transition: "opacity .18s ease, box-shadow .18s ease, filter .18s ease",
    }),
    arrowBtnDisabled: {
        opacity: 0.45,
        boxShadow: "none",
        filter: "grayscale(0.25) brightness(.85)",
        cursor: "default",
    } as React.CSSProperties,
    arrowIcon: (accent: string, left = false) => ({
        width: 0,
        height: 0,
        borderTop: "8px solid transparent",
        borderBottom: "8px solid transparent",
        [left ? "borderRight" : "borderLeft"]: `12px solid ${accent}`,
        filter: `drop-shadow(0 0 6px ${withAlpha(accent, 0.9)}) drop-shadow(0 0 14px ${withAlpha(accent, 0.45)})`,
    }),
    doubleIconRow: {
        display: "grid",
        gridAutoFlow: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    } as React.CSSProperties,

    /* Modal */
    modalOverlay: (accent: string) => ({
        position: "fixed" as const,
        inset: 0,
        background: "rgba(0,0,0,.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 10020,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "20px 14px",
    }),
    modalCard: (accent: string) => ({
        width: "100%",
        maxWidth: 520,
        borderRadius: 16,
        border: `1.5px solid ${accent}`,
        background:
            "linear-gradient(180deg, rgba(5,10,20,.9), rgba(5,10,20,.96))",
        boxShadow: `0 0 20px ${withAlpha(accent, 0.6)}, 0 0 40px ${withAlpha(accent, 0.33)}`,
        overflow: "hidden" as const,
        color: "#fff",
    }),
    modalThumb: { width: "100%", height: "auto", display: "block" },
    modalBody: { padding: 14 },
    modalTitle: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 8,
        textAlign: "center" as const,
    },
    modalDesc: {
        fontSize: 14,
        lineHeight: 1.55,
        opacity: 0.95,
        whiteSpace: "pre-line" as const,
    },
    modalCTA: (accent: string) => ({
        marginTop: 14,
        padding: "12px 14px",
        width: "100%",
        borderRadius: 10,
        border: `1.5px solid ${accent}`,
        background: "rgba(0,0,0,.5)",
        color: "#fff",
        textAlign: "center" as const,
        textDecoration: "none" as const,
        boxShadow: `0 0 14px ${withAlpha(accent, 0.45)}, inset 0 0 10px ${withAlpha(accent, 0.2)}`,
        display: "block",
    }),
    modalCloseBtn: (accent: string) => ({
        background: "transparent",
        border: "none",
        color: accent,
        fontSize: 28,
        lineHeight: 1,
        fontWeight: 600,
        textShadow: `0 0 8px ${withAlpha(accent, 0.45)}`,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
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

/* Órbita SVG */
const OrbitLine = ({ accent = "#00C2FF" }: { accent?: string }) => (
    <svg
        style={styles.orbitLineWrap as React.CSSProperties}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
    >
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.8" result="b" />
                <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path
            d="M -2 50 Q 50 20 102 50"
            stroke={accent}
            strokeWidth={2}
            fill="none"
            opacity="0.85"
            filter="url(#glow)"
        />
    </svg>
)

/* ---------------------------------------------
   Tipos
--------------------------------------------- */
type Episode = {
    number: number
    title: string
    shortDesc: string
    longDesc: string
    youtubeUrl: string
    previewThumb?: string
    heroThumb?: string
    active: boolean
}

/* Defaults demo */
const defaultSeason1: Episode[] = Array.from({ length: 25 }).map((_, i) => {
    const n = i + 1
    const isActive = n <= 4
    return {
        number: n,
        title: isActive ? `Ritmos del Sol` : `Fragmento ${n}`,
        shortDesc: isActive
            ? "Exploración del pulso solar y su reflejo en nuestra respiración planetaria."
            : "Próximamente.",
        longDesc: isActive
            ? "En este fragmento nos sumergimos en los ciclos de irradiación.\n\nCómo sincronizar el latido interno con el Sol para abrir ventanas de lucidez."
            : "Este fragmento aún no ha sido activado. Permanece atento ☼",
        youtubeUrl: isActive
            ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            : "https://www.youtube.com/@Fragmentosdelsol",
        previewThumb: "",
        heroThumb: "",
        active: isActive,
    }
})

/* ---------------------------------------------
   Componente
--------------------------------------------- */
export function FragmentosDelSolMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor = "#00C2FF",
        yellowColor = "#FFD700",

        pageTitleImage,
        pageTitleImageHeightMobile = 110,
        titleTopOffsetPx = 72,

        controlsGapBelowTitle = 14,
        fragmentTagGapBelowControls = 16,
        epTitleGapBelowTag = 18,
        fragmentBlockOffsetY = 0,

        planetSize = 170,
        capsuleOffsetYPx = 0,

        descGapAboveArrows = 84,

        numStars = 80,
        inicioLink = "https://www.redsolarviva.com",
        fragmentosLink = "/fragmentos",
        librosLink = "/libros",
        musicaLink = "https://open.spotify.com",
        serviciosLink = "/servicios",
        afinacionesLink = "/afinaciones",

        season1 = defaultSeason1,
        allowSeason2 = false,
        season2 = defaultSeason1.map((e) => ({
            ...e,
            title: e.active ? "Alineaciones Solares" : e.title,
        })),
    } = props

    /* ====== SINCRONIZACIÓN DURA ANTES DE PINTAR ====== */
    const [synced, setSynced] = useState(false)
    const [accent, setAccent] = useState<string>("#00FF41") // valor seguro
    const [theme, setTheme] = useState<"matrix" | "neon">("matrix")

    useLayoutEffect(() => {
        const sync = () => {
            const t = readDomTheme()
            const a =
                readAccentVar() || (t === "neon" ? accentColor : "#00FF41")
            setTheme(t)
            setAccent(a)
            setSynced(true)
        }
        sync()

        const el = document.documentElement
        const mo = new MutationObserver(sync)
        mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] })
        const onStorage = (e: StorageEvent) => {
            if (e.key === "holo-theme") sync()
        }
        window.addEventListener("storage", onStorage)

        return () => {
            mo.disconnect()
            window.removeEventListener("storage", onStorage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const toggleTheme = () => {
        try {
            const next = theme === "neon" ? "matrix" : "neon"
            localStorage.setItem("holo-theme", next)
            document.documentElement.setAttribute("data-theme", next)
            // sync inmediato
            const a =
                readAccentVar() || (next === "neon" ? accentColor : "#00FF41")
            setTheme(next)
            setAccent(a)
        } catch {}
    }

    /* ⚠️ No pintar hasta sincronizar para evitar “frame” verde */
    if (!synced) return null

    /* Datos de temporada */
    const [menuOpen, setMenuOpen] = useState(false)
    const [season, setSeason] = useState<1 | 2>(1)

    const currentSeasonData: Episode[] = useMemo(() => {
        const arr = (season === 1 ? season1 : season2) || []
        return [...arr].sort((a, b) => a.number - b.number)
    }, [season, season1, season2])

    const activeEpisodes = useMemo(
        () => currentSeasonData.filter((e) => e.active),
        [currentSeasonData]
    )

    /* Modal */
    const [openEp, setOpenEp] = useState<Episode | null>(null)

    /* Layout */
    const titleTop = titleTopOffsetPx
    const controlsTop =
        titleTop + pageTitleImageHeightMobile + controlsGapBelowTitle
    const fragTagTop =
        controlsTop + 34 + fragmentTagGapBelowControls + fragmentBlockOffsetY
    const epTitleTop =
        fragTagTop + 24 + epTitleGapBelowTag + fragmentBlockOffsetY

    const ORBIT_ALIGN_Y = -12
    const wheelTop = epTitleTop + 8 + capsuleOffsetYPx + ORBIT_ALIGN_Y
    const ARROWS_BOTTOM = 18

    /* Carrusel */
    const [index, setIndex] = useState(0)
    const indexRef = useRef(0)
    useEffect(() => {
        indexRef.current = index
    }, [index])

    const wrapRef = useRef<HTMLDivElement | null>(null)
    const slideWRef = useRef<number>(0)
    const x = useMotionValue(0)
    const [slidePx, setSlidePx] = useState(0)
    const [trackPx, setTrackPx] = useState<number | null>(null)

    const getWrapperWidth = useCallback(() => {
        const el = wrapRef.current
        if (!el)
            return (
                (typeof window !== "undefined" ? window.innerWidth : 320) || 320
            )
        const rect = el.getBoundingClientRect?.()
        const w = rect?.width ?? el.clientWidth ?? 320
        return w
    }, [])

    const recalcMetrics = useCallback((w: number, n: number) => {
        slideWRef.current = w
        setSlidePx(w)
        setTrackPx(w * n)
    }, [])

    const dragConstraints = useMemo(() => {
        const n = activeEpisodes.length || 1
        const max = Math.max(0, n - 1)
        const w = slideWRef.current || getWrapperWidth()
        return { left: -(max * w), right: 0 }
    }, [activeEpisodes.length, getWrapperWidth])

    const centerTo = useCallback(
        (i: number, animateIt = false) => {
            const w = slideWRef.current || getWrapperWidth()
            const n = activeEpisodes.length || 1
            const max = Math.max(0, n - 1)
            const target = clamp(i, 0, max)
            setIndex(target)
            indexRef.current = target
            const to = -(target * w)
            if (animateIt)
                animate(x, to, { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] })
            else x.set(to)
        },
        [activeEpisodes.length, getWrapperWidth, x]
    )

    const measureAndCenter = useCallback(
        (i: number, animateIt = false) => {
            const w = getWrapperWidth()
            const n = activeEpisodes.length || 1
            recalcMetrics(w, n)
            centerTo(i, animateIt)
        },
        [activeEpisodes.length, centerTo, getWrapperWidth, recalcMetrics]
    )

    useLayoutEffect(() => {
        measureAndCenter(0, false)
        requestAnimationFrame(() => measureAndCenter(0, false))
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined" && wrapRef.current) {
            ro = new ResizeObserver(() =>
                measureAndCenter(indexRef.current, false)
            )
            ro.observe(wrapRef.current)
        }
        const reflow = () => {
            measureAndCenter(indexRef.current, false)
            requestAnimationFrame(() =>
                measureAndCenter(indexRef.current, false)
            )
            setTimeout(() => measureAndCenter(indexRef.current, false), 160)
        }
        window.addEventListener("resize", reflow)
        window.addEventListener("orientationchange", reflow)
        ;(window as any).visualViewport?.addEventListener?.("resize", reflow)
        return () => {
            window.removeEventListener("resize", reflow)
            window.removeEventListener("orientationchange", reflow)
            ;(window as any).visualViewport?.removeEventListener?.(
                "resize",
                reflow
            )
            ro?.disconnect()
        }
    }, [])

    useEffect(() => {
        setIndex(0)
        indexRef.current = 0
        measureAndCenter(0, false)
    }, [season, activeEpisodes.length])
    useEffect(() => {
        measureAndCenter(indexRef.current, false)
        requestAnimationFrame(() => measureAndCenter(indexRef.current, false))
    }, [planetSize])

    const goTo = useCallback(
        (i: number, animateIt = true) => {
            const w = slideWRef.current || getWrapperWidth()
            const n = activeEpisodes.length || 1
            const max = Math.max(0, n - 1)
            const target = clamp(i, 0, max)
            recalcMetrics(w, n)
            setIndex(target)
            indexRef.current = target
            const to = -(target * w)
            if (animateIt)
                animate(x, to, { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] })
            else x.set(to)
        },
        [activeEpisodes.length, getWrapperWidth, recalcMetrics, x]
    )

    const jumpFirst = useCallback(() => goTo(0), [goTo])
    const jumpLast = useCallback(
        () => goTo(Math.max(0, (activeEpisodes.length || 1) - 1)),
        [goTo, activeEpisodes.length]
    )
    const prev = useCallback(() => goTo(index - 1), [goTo, index])
    const next = useCallback(() => goTo(index + 1), [goTo, index])

    const INTENT_THRESHOLD_PX = 12
    const VELOCITY_THRESHOLD = 180
    const onDragEnd = useCallback(
        (
            _: MouseEvent | TouchEvent | PointerEvent,
            info: {
                offset: { x: number; y: number }
                velocity: { x: number; y: number }
            }
        ) => {
            const { offset, velocity } = info
            const w = slideWRef.current || getWrapperWidth()
            const n = activeEpisodes.length || 1
            const max = Math.max(0, n - 1)
            if (
                offset.x <= -INTENT_THRESHOLD_PX ||
                velocity.x <= -VELOCITY_THRESHOLD
            )
                return goTo(indexRef.current + 1)
            if (
                offset.x >= INTENT_THRESHOLD_PX ||
                velocity.x >= VELOCITY_THRESHOLD
            )
                return goTo(indexRef.current - 1)
            const raw = -x.get() / w
            const snapped = clamp(Math.round(raw), 0, max)
            goTo(snapped)
        },
        [activeEpisodes.length, getWrapperWidth, goTo, x]
    )

    const currentEp =
        activeEpisodes[clamp(index, 0, Math.max(0, activeEpisodes.length - 1))]
    const N = Math.max(0, activeEpisodes.length)
    const atStart = index === 0
    const atEnd = index === Math.max(0, N - 1)
    const leftDisabled = atStart
    const rightDisabled = atEnd
    const jumpLeftDisabled = atStart
    const jumpRightDisabled = atEnd

    const arrowBtnStyle = (disabled: boolean): React.CSSProperties => ({
        ...(styles.arrowBtnBase(accent) as React.CSSProperties),
        ...(disabled ? styles.arrowBtnDisabled : {}),
    })

    return (
        <div style={styles.container(bgColor) as React.CSSProperties}>
            <StarsBackground num={numStars} />

            {/* Menú fijo */}
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

            {/* Título PNG (glow suave) */}
            <div style={styles.titleWrap(titleTop) as React.CSSProperties}>
                {pageTitleImage && (
                    <img
                        src={pageTitleImage}
                        alt="Fragmentos del Sol"
                        style={{
                            ...(styles.titleImg(accent) as React.CSSProperties),
                            height: pageTitleImageHeightMobile,
                        }}
                    />
                )}
            </div>

            {/* Controles */}
            <div style={styles.controlsRow(controlsTop) as React.CSSProperties}>
                <button
                    style={styles.pill(accent, true) as React.CSSProperties}
                    onClick={() =>
                        allowSeason2 && setSeason((s) => (s === 1 ? 2 : 1))
                    }
                >
                    {allowSeason2 ? `Temporada ${season}` : "Temporada 1"}
                </button>
            </div>

            {/* “Fragmento n” (sin glow SIEMPRE) */}
            {currentEp && (
                <div
                    style={
                        styles.fragNeon(
                            accent,
                            fragTagTop,
                            28
                        ) as React.CSSProperties
                    }
                >
                    {`Fragmento ${currentEp.number}`}
                </div>
            )}

            {/* Título episodio */}
            {currentEp && (
                <div
                    style={styles.epTitleTop(epTitleTop) as React.CSSProperties}
                >
                    {currentEp.title || `Fragmento ${currentEp.number}`}
                </div>
            )}

            {/* Cápsula + carrusel */}
            <div
                ref={wrapRef}
                style={styles.wheelWrap(wheelTop) as React.CSSProperties}
            >
                <OrbitLine accent={accent} />
                <div style={styles.sun(yellowColor) as React.CSSProperties} />

                <motion.div
                    drag="x"
                    dragElastic={0.06}
                    dragMomentum={false}
                    dragConstraints={dragConstraints}
                    onDragEnd={onDragEnd}
                    style={{
                        display: "flex",
                        width: trackPx ? `${trackPx}px` : "auto",
                        height: "100%",
                        x,
                        willChange: "transform",
                        touchAction: "pan-x",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    {activeEpisodes.map((ep) => (
                        <div
                            key={ep.number}
                            style={{
                                flex: `0 0 ${slidePx}px`,
                                width: slidePx,
                                minWidth: slidePx,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setOpenEp(ep)}
                                style={
                                    styles.planet(
                                        accent,
                                        planetSize
                                    ) as React.CSSProperties
                                }
                            >
                                {ep.previewThumb ? (
                                    <img
                                        src={ep.previewThumb}
                                        alt={ep.title}
                                        style={{
                                            width: "88%",
                                            height: "88%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                            boxShadow: `0 0 24px ${withAlpha(accent, 0.5)}, inset 0 0 20px ${withAlpha(accent, 0.27)}`,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "60%",
                                            height: "60%",
                                            borderRadius: "50%",
                                            background: "rgba(255,255,255,.1)",
                                            boxShadow: `0 0 24px ${withAlpha(accent, 0.5)} inset, 0 0 24px ${withAlpha(accent, 0.4)}`,
                                        }}
                                    />
                                )}
                            </motion.div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Descripción */}
            {currentEp && (
                <div
                    style={
                        styles.descBottom(
                            ARROWS_BOTTOM + descGapAboveArrows
                        ) as React.CSSProperties
                    }
                >
                    {normalizeMultiline(currentEp.shortDesc)}
                </div>
            )}

            {/* Flechas (glow suave) */}
            <div
                style={styles.arrowsWrap(ARROWS_BOTTOM) as React.CSSProperties}
            >
                <button
                    aria-label="Ir al primero"
                    style={arrowBtnStyle(jumpLeftDisabled)}
                    onClick={() => !jumpLeftDisabled && jumpFirst()}
                    disabled={jumpLeftDisabled}
                >
                    <div style={styles.doubleIconRow}>
                        <div
                            style={
                                styles.arrowIcon(
                                    accent,
                                    true
                                ) as React.CSSProperties
                            }
                        />
                        <div
                            style={
                                styles.arrowIcon(
                                    accent,
                                    true
                                ) as React.CSSProperties
                            }
                        />
                    </div>
                </button>

                <button
                    aria-label="Anterior"
                    style={arrowBtnStyle(leftDisabled)}
                    onClick={() => !leftDisabled && prev()}
                    disabled={leftDisabled}
                >
                    <div
                        style={
                            styles.arrowIcon(
                                accent,
                                true
                            ) as React.CSSProperties
                        }
                    />
                </button>

                <button
                    aria-label="Siguiente"
                    style={arrowBtnStyle(rightDisabled)}
                    onClick={() => !rightDisabled && next()}
                    disabled={rightDisabled}
                >
                    <div
                        style={
                            styles.arrowIcon(
                                accent,
                                false
                            ) as React.CSSProperties
                        }
                    />
                </button>

                <button
                    aria-label="Ir al último"
                    style={arrowBtnStyle(jumpRightDisabled)}
                    onClick={() => !jumpRightDisabled && jumpLast()}
                    disabled={jumpRightDisabled}
                >
                    <div style={styles.doubleIconRow}>
                        <div
                            style={
                                styles.arrowIcon(
                                    accent,
                                    false
                                ) as React.CSSProperties
                            }
                        />
                        <div
                            style={
                                styles.arrowIcon(
                                    accent,
                                    false
                                ) as React.CSSProperties
                            }
                        />
                    </div>
                </button>
            </div>

            {/* Menú + switch */}
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
                                <div style={styles.menuItem(true, accent)}>
                                    Fragmentos del Sol
                                </div>
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
                                    Servicios
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

                                <div
                                    style={{
                                        marginTop: 22,
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    <button
                                        aria-label="Cambiar tema"
                                        role="switch"
                                        aria-checked={theme === "neon"}
                                        onClick={toggleTheme}
                                        style={{
                                            width: 78,
                                            height: 36,
                                            padding: 3,
                                            borderRadius: 999,
                                            background:
                                                "linear-gradient(180deg, rgba(10,15,25,.9), rgba(10,15,25,.96))",
                                            border: `1.2px solid ${accent}`,
                                            boxShadow: `inset 0 0 8px rgba(0,0,0,.6), 0 0 18px ${withAlpha(accent, 0.47)}, 0 0 28px ${withAlpha(accent, 0.33)}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent:
                                                theme === "neon"
                                                    ? "flex-end"
                                                    : "flex-start",
                                            transition: "all .22s ease",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: "50%",
                                                background: `radial-gradient(60% 60% at 50% 50%, ${theme === "neon" ? "#B5E9FF" : "#D7FFDF"} 0%, ${accent} 70%)`,
                                                boxShadow: `0 0 12px ${accent}, 0 0 26px ${withAlpha(accent, 0.55)}`,
                                            }}
                                        />
                                    </button>
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 12,
                                            opacity: 0.85,
                                            color: "#fff",
                                            textShadow: `0 0 8px ${withAlpha(accent, 0.33)}`,
                                        }}
                                    >
                                        {theme === "neon"
                                            ? "Azul neón"
                                            : "Verde matrix"}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {openEp && (
                    <motion.div
                        style={
                            styles.modalOverlay(accent) as React.CSSProperties
                        }
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpenEp(null)}
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            style={
                                styles.modalCard(accent) as React.CSSProperties
                            }
                            initial={{ y: 18, opacity: 0.98 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 18, opacity: 0.98 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {openEp.heroThumb || openEp.previewThumb ? (
                                <img
                                    src={
                                        (openEp.heroThumb ||
                                            openEp.previewThumb) as string
                                    }
                                    alt={openEp.title}
                                    style={
                                        styles.modalThumb as React.CSSProperties
                                    }
                                />
                            ) : (
                                <div
                                    style={{
                                        height: 200,
                                        background: `radial-gradient(circle at 50% 40%, ${withAlpha(accent, 0.3)}, ${withAlpha(accent, 0.07)})`,
                                    }}
                                />
                            )}
                            <div
                                style={styles.modalBody as React.CSSProperties}
                            >
                                <div
                                    style={
                                        styles.modalTitle as React.CSSProperties
                                    }
                                >
                                    {openEp.title}
                                </div>
                                <div
                                    style={
                                        styles.modalDesc as React.CSSProperties
                                    }
                                >
                                    {normalizeMultiline(
                                        openEp.longDesc || openEp.shortDesc
                                    )}
                                </div>
                                <a
                                    href={openEp.youtubeUrl}
                                    target="_self"
                                    rel="noopener noreferrer"
                                    style={
                                        styles.modalCTA(
                                            accent
                                        ) as React.CSSProperties
                                    }
                                >
                                    VISUALIZAR AHORA
                                </a>
                            </div>
                        </motion.div>
                        <button
                            aria-label="Cerrar"
                            style={
                                styles.modalCloseBtn(
                                    accent
                                ) as React.CSSProperties
                            }
                            onClick={(e) => {
                                e.stopPropagation()
                                setOpenEp(null)
                            }}
                        >
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ---------------------------------------------
   Property Controls (Framer)
--------------------------------------------- */
addPropertyControls(FragmentosDelSolMobile, {
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
    yellowColor: {
        type: ControlType.Color,
        title: "Amarillo",
        defaultValue: "#FFD700",
    },

    pageTitleImage: { type: ControlType.Image, title: "Título PNG" },
    pageTitleImageHeightMobile: {
        type: ControlType.Number,
        title: "Alto Título (px)",
        defaultValue: 110,
        min: 40,
        max: 280,
        step: 2,
    },
    titleTopOffsetPx: {
        type: ControlType.Number,
        title: "Offset sup. (px)",
        defaultValue: 72,
        min: 0,
        max: 200,
        step: 2,
    },

    controlsGapBelowTitle: {
        type: ControlType.Number,
        title: "Gap Título→Controles",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
    },
    fragmentTagGapBelowControls: {
        type: ControlType.Number,
        title: "Gap Controles→‘Fragmento’",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
    },
    epTitleGapBelowTag: {
        type: ControlType.Number,
        title: "Gap ‘Fragmento’→Título",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
    },
    fragmentBlockOffsetY: {
        type: ControlType.Number,
        title: "Offset bloque título Y",
        defaultValue: 0,
        min: -60,
        max: 160,
        step: 2,
    },

    planetSize: {
        type: ControlType.Number,
        title: "Tamaño Cápsula",
        defaultValue: 170,
        min: 120,
        max: 240,
        step: 2,
    },
    capsuleOffsetYPx: {
        type: ControlType.Number,
        title: "Offset cápsula Y",
        defaultValue: 0,
        min: -80,
        max: 180,
        step: 2,
    },

    descGapAboveArrows: {
        type: ControlType.Number,
        title: "Gap Desc. ↑ Flechas",
        defaultValue: 84,
        min: -40,
        max: 180,
        step: 2,
    },

    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 80,
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
        defaultValue: "/fragmentos",
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
        defaultValue: "/afinaciones",
    },

    allowSeason2: {
        type: ControlType.Boolean,
        title: "Habilitar Temp. 2",
        defaultValue: false,
    },

    season1: {
        type: ControlType.Array,
        title: "Temporada 1 (25)",
        defaultValue: defaultSeason1 as any,
        propertyControl: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.Number,
                    title: "#",
                    min: 1,
                    max: 25,
                    defaultValue: 1,
                },
                title: {
                    type: ControlType.String,
                    title: "Título",
                    defaultValue: "",
                },
                shortDesc: {
                    type: ControlType.String,
                    title: "Desc. corta",
                    defaultValue: "",
                    rows: 3,
                },
                longDesc: {
                    type: ControlType.String,
                    title: "Desc. larga",
                    defaultValue: "",
                    rows: 6,
                },
                youtubeUrl: {
                    type: ControlType.String,
                    title: "YouTube URL",
                    defaultValue: "",
                },
                previewThumb: {
                    type: ControlType.Image,
                    title: "Thumb PREVIEW (cápsula)",
                },
                heroThumb: {
                    type: ControlType.Image,
                    title: "Thumb HIGHLIGHT (modal)",
                },
                active: {
                    type: ControlType.Boolean,
                    title: "Activo",
                    defaultValue: false,
                },
            },
        },
    },
    season2: {
        type: ControlType.Array,
        title: "Temporada 2",
        hidden: (p) => !p.allowSeason2,
        defaultValue: defaultSeason1 as any,
        propertyControl: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.Number,
                    title: "#",
                    min: 1,
                    max: 25,
                    defaultValue: 1,
                },
                title: {
                    type: ControlType.String,
                    title: "Título",
                    defaultValue: "",
                },
                shortDesc: {
                    type: ControlType.String,
                    title: "Desc. corta",
                    defaultValue: "",
                    rows: 3,
                },
                longDesc: {
                    type: ControlType.String,
                    title: "Desc. larga",
                    defaultValue: "",
                    rows: 6,
                },
                youtubeUrl: {
                    type: ControlType.String,
                    title: "YouTube URL",
                    defaultValue: "",
                },
                previewThumb: {
                    type: ControlType.Image,
                    title: "Thumb PREVIEW (cápsula)",
                },
                heroThumb: {
                    type: ControlType.Image,
                    title: "Thumb HIGHLIGHT (modal)",
                },
                active: {
                    type: ControlType.Boolean,
                    title: "Activo",
                    defaultValue: false,
                },
            },
        },
    },
})
