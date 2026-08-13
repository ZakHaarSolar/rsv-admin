import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* =========================================================================
   Archivo Holográfico — Libros
   - Fullscreen dark bg + subtle stars
   - Horizontal “data capsule” stream (drag + inertia)
   - Click capsule -> expands to centered holographic panel (shared layoutId)
   - Framer controls for theming & behavior
   ======================================================================= */

/* ----------------------------- Stars layer ----------------------------- */
const StarsBackground = ({ density = 120 }) => {
    const [stars, setStars] = useState<
        { id: number; x: number; y: number; s: number; o: number }[]
    >([])
    useEffect(() => {
        const arr = Array.from({ length: density }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            s: Math.random() * 1.6 + 0.4,
            o: Math.random() * 0.7 + 0.2,
        }))
        setStars(arr)
    }, [density])
    return (
        <div style={S.stars}>
            <style>{K.twinkle}</style>
            {stars.map((star) => (
                <div
                    key={star.id}
                    style={{
                        position: "absolute",
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.s,
                        height: star.s,
                        borderRadius: "50%",
                        background: "#FFF",
                        opacity: star.o,
                        animation: `twinkle ${2 + Math.random() * 3}s infinite alternate ease-in-out`,
                        boxShadow: `0 0 ${star.s * 3}px ${star.s * 0.6}px rgba(255,255,255,0.35)`,
                    }}
                />
            ))}
        </div>
    )
}

/* ------------------------------ Utilities ----------------------------- */
type CTA = { label: string; href: string; targetBlank?: boolean }
type Book = {
    id: string
    title: string
    subtitle?: string
    coverUrl: string
    colorHex?: string
    synopsis: string
    ctas: CTA[]
}

function safeParseBooks(json?: string, fallback: Book[] = []): Book[] {
    if (!json) return fallback
    try {
        const data = JSON.parse(json)
        if (Array.isArray(data)) return data as Book[]
        return fallback
    } catch {
        return fallback
    }
}

/* ------------------------------ Component ----------------------------- */
export function ArchivoHolograficoLibros(props: any) {
    const {
        // Theme
        bgColor,
        textColor,
        accentColor,

        // Title
        pageTitle,
        pageSubtitle,

        // Data
        useSampleBooks,
        booksJson,

        // Screen (holographic)
        screenOpacity,
        screenBlurPx,
        screenCornerRadius,
        scanlinesEnabled,
        scanlineIntensity,

        // Capsules
        capsuleSize,
        capsuleGlowStrength,
        capsuleFloatAmplitude,
        capsuleParallax,

        // Panel
        panelWidth,
        panelMaxWidth,
        panelBlurPx,
        panelCornerRadius,
        panelBackdropOpacity,

        // Motion
        openDurationMs,
        closeDurationMs,
        easingSelect,

        // Stars
        starsDensity,
    } = props

    const easing =
        easingSelect === "anticipate"
            ? [0.16, 1, 0.3, 1]
            : easingSelect === "springSoft"
              ? [0.17, 0.55, 0.55, 1]
              : easingSelect === "linear"
                ? "linear"
                : [0.2, 0.8, 0.2, 1]

    // Sample books
    const sampleBooks: Book[] = useMemo(
        () => [
            {
                id: "rs-geo-01",
                title: "Sol de Memoria",
                subtitle: "Archivo I · Secuencia Umbral",
                coverUrl:
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=640&fit=crop",
                colorHex: "#FFB84D",
                synopsis:
                    "Un compendio de símbolos y geometrías que reactivan la memoria solar del cuerpo. Mapas, notas y prácticas.",
                ctas: [
                    {
                        label: "Amazon",
                        href: "https://amazon.com",
                        targetBlank: true,
                    },
                    { label: "PDF", href: "#", targetBlank: false },
                    { label: "Preview", href: "#", targetBlank: false },
                ],
            },
            {
                id: "rs-geo-02",
                title: "Cánticos de Perigeo",
                subtitle: "Archivo II · Frecuencias",
                coverUrl:
                    "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=640&fit=crop",
                colorHex: "#4DD0E1",
                synopsis:
                    "Textos-canto y diagramas resonantes para navegación interior. Una bitácora viva.",
                ctas: [
                    { label: "Tienda", href: "#", targetBlank: false },
                    { label: "PDF", href: "#", targetBlank: false },
                ],
            },
            {
                id: "rs-geo-03",
                title: "Fragmentos de Sol",
                subtitle: "Archivo III · Lentes",
                coverUrl:
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=640&fit=crop",
                colorHex: "#FF6E6E",
                synopsis:
                    "Micro-ensayos y piezas visuales que polarizan la atención hacia el eje. Lectura no lineal.",
                ctas: [{ label: "Comprar", href: "#", targetBlank: false }],
            },
            {
                id: "rs-geo-04",
                title: "Anillos de Magneto",
                subtitle: "Archivo IV · Trayectorias",
                coverUrl:
                    "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=640&fit=crop",
                colorHex: "#A3F7B5",
                synopsis:
                    "Modelos orbitales y prácticas de orientación vibral. Diagramas con notas.",
                ctas: [
                    {
                        label: "Amazon",
                        href: "https://amazon.com",
                        targetBlank: true,
                    },
                ],
            },
            {
                id: "rs-geo-05",
                title: "Índice de Pulsos",
                subtitle: "Archivo V · Campos",
                coverUrl:
                    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=640&fit=crop",
                colorHex: "#E0E0E0",
                synopsis:
                    "Catálogo breve de frecuencias y sus efectos. Referencia para sesiones y estudio.",
                ctas: [{ label: "PDF", href: "#", targetBlank: false }],
            },
        ],
        []
    )

    const books: Book[] = useMemo(
        () =>
            useSampleBooks
                ? sampleBooks
                : safeParseBooks(booksJson, sampleBooks),
        [useSampleBooks, booksJson, sampleBooks]
    )

    const [activeId, setActiveId] = useState<string | null>(null)
    const active = books.find((b) => b.id === activeId) || null

    // Drag area
    const trackRef = useRef<HTMLDivElement>(null)

    // Prevent body overscroll when panel is open
    useEffect(() => {
        if (!active) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [active])

    // Body / html bg sync (evita franjas)
    useEffect(() => {
        const html = document.documentElement
        const prevHtmlBg = html.style.backgroundColor
        const prevBodyBg = document.body.style.backgroundColor
        html.style.backgroundColor = bgColor
        document.body.style.backgroundColor = bgColor
        return () => {
            html.style.backgroundColor = prevHtmlBg
            document.body.style.backgroundColor = prevBodyBg
        }
    }, [bgColor])

    return (
        <div style={S.wrap(bgColor)}>
            {/* Background layers */}
            <StarsBackground density={starsDensity} />
            <div style={S.noiseOverlay} />

            {/* Titles */}
            <div style={S.header}>
                {pageTitle ? (
                    <h1 style={S.h1(textColor, accentColor)}>{pageTitle}</h1>
                ) : null}
                {pageSubtitle ? (
                    <p style={S.sub(textColor)}>{pageSubtitle}</p>
                ) : null}
            </div>

            {/* Holographic screen frame (always visible) */}
            <div
                style={S.screen(
                    screenOpacity,
                    screenBlurPx,
                    screenCornerRadius,
                    accentColor,
                    scanlinesEnabled,
                    scanlineIntensity
                )}
            >
                {scanlinesEnabled && (
                    <div style={S.scanlines(scanlineIntensity)} />
                )}
            </div>

            {/* Capsules stream */}
            <div style={S.streamOuter}>
                <motion.div
                    ref={trackRef}
                    style={S.streamInner}
                    drag="x"
                    dragConstraints={{
                        left: -Math.max(
                            0,
                            books.length * (capsuleSize + 28) -
                                window.innerWidth +
                                80
                        ),
                        right: 0,
                    }}
                    dragElastic={0.08}
                    dragTransition={{ power: 0.25, timeConstant: 260 }}
                >
                    {books.map((b, idx) => {
                        const tint = b.colorHex || accentColor
                        const floatDelay = (idx % 5) * 0.35
                        return (
                            <motion.button
                                key={b.id}
                                layoutId={`cap-${b.id}`}
                                onClick={() => setActiveId(b.id)}
                                style={S.capsuleBtn}
                                initial={false}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div
                                    style={S.capsule(
                                        capsuleSize,
                                        capsuleGlowStrength,
                                        tint
                                    )}
                                    animate={{
                                        y: [
                                            0,
                                            -capsuleFloatAmplitude,
                                            0,
                                            capsuleFloatAmplitude,
                                            0,
                                        ],
                                    }}
                                    transition={{
                                        duration: 6 + (idx % 3),
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: floatDelay,
                                    }}
                                >
                                    {/* Glow ring */}
                                    <div
                                        style={S.capsuleRing(
                                            tint,
                                            capsuleGlowStrength
                                        )}
                                    />
                                    {/* Cover as texture */}
                                    <div
                                        style={{
                                            ...S.coverCircle(capsuleSize),
                                            backgroundImage: `url(${b.coverUrl})`,
                                        }}
                                    />
                                </motion.div>
                                <div style={S.capTitle(textColor)}>
                                    {b.title}
                                </div>
                            </motion.button>
                        )
                    })}
                </motion.div>
            </div>

            {/* Expanded panel */}
            <AnimatePresence>
                {active && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            onClick={() => setActiveId(null)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: panelBackdropOpacity }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: closeDurationMs / 1000,
                                ease: "linear",
                            }}
                            style={S.backdrop}
                        />
                        {/* Dialog */}
                        <motion.div
                            key={active.id}
                            layoutId={`cap-${active.id}`}
                            style={S.dialog(
                                panelWidth,
                                panelMaxWidth,
                                panelCornerRadius,
                                panelBlurPx,
                                screenOpacity
                            )}
                            initial={{ opacity: 0.001 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: openDurationMs / 1000,
                                ease: easing as any,
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Detalle del libro ${active.title}`}
                        >
                            <button
                                aria-label="Cerrar"
                                onClick={() => setActiveId(null)}
                                style={S.closeBtn(accentColor)}
                            >
                                &times;
                            </button>

                            <div style={S.dialogGrid}>
                                <div style={S.dialogCoverWrap}>
                                    <div
                                        style={{
                                            ...S.dialogCover,
                                            backgroundImage: `url(${active.coverUrl})`,
                                            boxShadow: `0 0 24px ${active.colorHex || accentColor}55`,
                                        }}
                                    />
                                </div>
                                <div style={S.dialogText}>
                                    <h2 style={S.dTitle(textColor)}>
                                        {active.title}
                                    </h2>
                                    {active.subtitle ? (
                                        <h3
                                            style={S.dSub(
                                                textColor,
                                                accentColor
                                            )}
                                        >
                                            {active.subtitle}
                                        </h3>
                                    ) : null}
                                    <p style={S.dSyn(textColor)}>
                                        {active.synopsis}
                                    </p>
                                    <div style={S.ctaRow}>
                                        {active.ctas?.map((c, i) => (
                                            <a
                                                key={i}
                                                href={c.href}
                                                target={
                                                    c.targetBlank
                                                        ? "_blank"
                                                        : "_self"
                                                }
                                                rel="noopener noreferrer"
                                                style={S.cta(accentColor)}
                                            >
                                                {c.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

/* -------------------------------- Styles ------------------------------- */
const S = {
    wrap: (bg: string) => ({
        position: "relative" as const,
        minHeight: "100svh",
        width: "100%",
        overflow: "hidden",
        background: bg,
        fontFamily:
            "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    }),
    stars: {
        position: "absolute" as const,
        inset: 0,
        zIndex: 0,
        pointerEvents: "none" as const,
    },
    noiseOverlay: {
        position: "absolute" as const,
        inset: 0,
        background:
            "radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)",
        opacity: 0.4,
        zIndex: 1,
        pointerEvents: "none" as const,
    },
    header: {
        position: "relative" as const,
        zIndex: 3,
        paddingTop: "7vh",
        textAlign: "center" as const,
    },
    h1: (color: string, accent: string) => ({
        fontFamily: "'Arizonia', cursive",
        fontWeight: 400,
        fontSize: "clamp(2.6rem, 6vw, 5.2rem)",
        margin: "0 0 .6rem 0",
        color,
        textShadow: `0 0 14px ${accent}33, 0 0 34px ${accent}22`,
    }),
    sub: (color: string) => ({
        margin: 0,
        opacity: 0.85,
        color,
        fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
    }),

    // Holographic screen
    screen: (
        opacity: number,
        blur: number,
        radius: number,
        accent: string,
        scan: boolean,
        intensity: number
    ) => ({
        position: "absolute" as const,
        left: "50%",
        top: "52%",
        transform: "translate(-50%, -50%)",
        width: "min(1200px, 90vw)",
        height: "min(64vh, 56rem)",
        background: `linear-gradient(180deg, rgba(8,16,30,${opacity}) 0%, rgba(8,16,30,${opacity * 0.92}) 100%)`,
        borderRadius: radius,
        border: `1px solid ${accent}66`,
        boxShadow: `
      0 0 10px ${accent}55,
      0 0 40px ${accent}33,
      inset 0 0 60px rgba(0,0,0,0.6)
    `,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        overflow: "hidden",
        zIndex: 2,
    }),
    scanlines: (intensity: number) => ({
        position: "absolute" as const,
        inset: 0,
        backgroundImage:
            "repeating-linear-gradient( to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 2px )",
        opacity: Math.max(0, Math.min(1, intensity)),
        pointerEvents: "none" as const,
    }),

    // Stream
    streamOuter: {
        position: "relative" as const,
        zIndex: 4,
        marginTop: "min(34vh, 22rem)",
        padding: "0 6vw",
        overflow: "visible",
    },
    streamInner: {
        display: "flex",
        alignItems: "flex-start",
        gap: 28,
        cursor: "grab",
        userSelect: "none" as const,
    },
    capsuleBtn: {
        appearance: "none" as const,
        background: "transparent",
        border: "none",
        padding: 0,
        outline: "none",
        textAlign: "center" as const,
        cursor: "pointer",
    },
    capsule: (size: number, glow: number, tint: string) => ({
        position: "relative" as const,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient( at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.1) 40%, ${tint} 120%)`,
        boxShadow: `inset 0 0 ${size * 0.12}px rgba(0,0,0,0.6)`,
        overflow: "visible",
        filter: `drop-shadow(0 0 ${Math.max(6, glow)}px ${tint}AA)`,
    }),
    capsuleRing: (tint: string, glow: number) => ({
        position: "absolute" as const,
        inset: "-10%",
        borderRadius: "50%",
        boxShadow: `0 0 ${Math.max(10, glow + 6)}px ${tint}AA, 0 0 ${Math.max(24, glow + 18)}px ${tint}66`,
        border: `1px solid ${tint}88`,
    }),
    coverCircle: (size: number) => ({
        position: "absolute" as const,
        inset: "8%",
        borderRadius: "50%",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "saturate(1.05) contrast(1.02)",
    }),
    capTitle: (color: string) => ({
        marginTop: 10,
        maxWidth: 220,
        color,
        opacity: 0.9,
        fontSize: "0.95rem",
    }),

    // Dialog
    backdrop: {
        position: "fixed" as const,
        inset: 0,
        background: "#000",
        zIndex: 8,
    },
    dialog: (
        w: number,
        maxW: number,
        radius: number,
        blur: number,
        opacity: number
    ) => ({
        position: "fixed" as const,
        left: "50%",
        top: "52%",
        transform: "translate(-50%, -50%)",
        width: w,
        maxWidth: maxW,
        background: `linear-gradient(180deg, rgba(8,16,30,${opacity}) 0%, rgba(8,16,30,${opacity * 0.96}) 100%)`,
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: radius,
        boxShadow: "0 10px 40px rgba(0,0,0,0.45), 0 0 60px rgba(0,0,0,0.35)",
        padding: "22px 22px 18px",
        zIndex: 9,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
    }),
    closeBtn: (accent: string) => ({
        position: "absolute" as const,
        right: 10,
        top: 6,
        fontSize: 28,
        lineHeight: 1,
        color: "#fff",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textShadow: `0 0 10px ${accent}AA`,
    }),
    dialogGrid: {
        display: "grid",
        gridTemplateColumns: "minmax(180px, 280px) 1fr",
        gap: 18,
    },
    dialogCoverWrap: { alignSelf: "start" },
    dialogCover: {
        width: "100%",
        aspectRatio: "3/4",
        borderRadius: 12,
        backgroundSize: "cover",
        backgroundPosition: "center",
    },
    dialogText: { alignSelf: "start" },
    dTitle: (c: string) => ({
        margin: "4px 0 2px 0",
        color: c,
        fontSize: "clamp(1.4rem, 3.6vw, 2rem)",
    }),
    dSub: (c: string, accent: string) => ({
        margin: "0 0 10px 0",
        color: c,
        opacity: 0.9,
        textShadow: `0 0 10px ${accent}33`,
        fontWeight: 500,
    }),
    dSyn: (c: string) => ({
        margin: "0 0 16px 0",
        color: c,
        opacity: 0.85,
        lineHeight: 1.65,
    }),
    ctaRow: { display: "flex", flexWrap: "wrap" as const, gap: 10 },
    cta: (accent: string) => ({
        display: "inline-block",
        border: `1px solid ${accent}AA`,
        color: "#fff",
        padding: "8px 14px",
        borderRadius: 10,
        textDecoration: "none",
        boxShadow: `0 0 10px ${accent}44`,
        transition: "transform .18s ease",
    }),
}

/* ------------------------------ Keyframes ------------------------------ */
const K = {
    twinkle: `@keyframes twinkle { 0% { opacity: .2 } 50% { opacity: .9 } 100% { opacity: .2 } }`,
}

/* ------------------------ Defaults & Controls -------------------------- */
ArchivoHolograficoLibros.defaultProps = {
    // Theme
    bgColor: "#0B0C13",
    textColor: "#F0F0F0",
    accentColor: "#00BFFF",

    // Titles
    pageTitle: "Archivo Holográfico — Libros",
    pageSubtitle: "Cápsulas de geometría en flujo vivo",

    // Data
    useSampleBooks: true,
    booksJson: "",

    // Screen
    screenOpacity: 0.82,
    screenBlurPx: 8,
    screenCornerRadius: 22,
    scanlinesEnabled: true,
    scanlineIntensity: 0.12,

    // Capsules
    capsuleSize: 110,
    capsuleGlowStrength: 16,
    capsuleFloatAmplitude: 6,
    capsuleParallax: 6,

    // Panel
    panelWidth: 980,
    panelMaxWidth: 1180,
    panelBlurPx: 10,
    panelCornerRadius: 20,
    panelBackdropOpacity: 0.6,

    // Motion
    openDurationMs: 380,
    closeDurationMs: 260,
    easingSelect: "easeOut",

    // Stars
    starsDensity: 120,
}

addPropertyControls(ArchivoHolograficoLibros, {
    // Theme
    bgColor: { type: ControlType.Color, title: "BG" },
    textColor: { type: ControlType.Color, title: "Text" },
    accentColor: { type: ControlType.Color, title: "Accent" },

    // Titles
    pageTitle: { type: ControlType.String, title: "Page Title" },
    pageSubtitle: { type: ControlType.String, title: "Page Subtitle" },

    // Data
    useSampleBooks: { type: ControlType.Boolean, title: "Use Sample Data" },
    booksJson: { type: ControlType.String, title: "Books JSON", rows: 10 },

    // Screen
    screenOpacity: {
        type: ControlType.Number,
        title: "Screen Opacity",
        min: 0.4,
        max: 0.98,
        step: 0.02,
    },
    screenBlurPx: {
        type: ControlType.Number,
        title: "Screen Blur",
        min: 0,
        max: 18,
        step: 1,
    },
    screenCornerRadius: {
        type: ControlType.Number,
        title: "Screen Radius",
        min: 10,
        max: 32,
        step: 1,
    },
    scanlinesEnabled: { type: ControlType.Boolean, title: "Scanlines" },
    scanlineIntensity: {
        type: ControlType.Number,
        title: "Scanline Intensity",
        min: 0,
        max: 0.5,
        step: 0.02,
    },

    // Capsules
    capsuleSize: {
        type: ControlType.Number,
        title: "Capsule Size",
        min: 80,
        max: 160,
        step: 2,
    },
    capsuleGlowStrength: {
        type: ControlType.Number,
        title: "Capsule Glow",
        min: 0,
        max: 36,
        step: 1,
    },
    capsuleFloatAmplitude: {
        type: ControlType.Number,
        title: "Float Amplitude",
        min: 0,
        max: 16,
        step: 1,
    },
    capsuleParallax: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 20,
        step: 1,
    },

    // Panel
    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        min: 600,
        max: 1200,
        step: 10,
    },
    panelMaxWidth: {
        type: ControlType.Number,
        title: "Panel Max",
        min: 800,
        max: 1400,
        step: 10,
    },
    panelBlurPx: {
        type: ControlType.Number,
        title: "Panel Blur",
        min: 0,
        max: 20,
        step: 1,
    },
    panelCornerRadius: {
        type: ControlType.Number,
        title: "Panel Radius",
        min: 10,
        max: 28,
        step: 1,
    },
    panelBackdropOpacity: {
        type: ControlType.Number,
        title: "Backdrop Op.",
        min: 0,
        max: 0.9,
        step: 0.05,
    },

    // Motion
    openDurationMs: {
        type: ControlType.Number,
        title: "Open (ms)",
        min: 120,
        max: 1200,
        step: 20,
    },
    closeDurationMs: {
        type: ControlType.Number,
        title: "Close (ms)",
        min: 120,
        max: 1200,
        step: 20,
    },
    easingSelect: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "anticipate", "springSoft", "linear"],
    },

    // Stars
    starsDensity: {
        type: ControlType.Number,
        title: "Stars",
        min: 0,
        max: 300,
        step: 10,
    },
})
