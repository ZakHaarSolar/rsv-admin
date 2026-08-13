import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ========================= UTILS ========================= */

const makeFallbackDataUrl = (
    title: string,
    color = "#00C2FF",
    w = 150,
    h = 210
) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='${color}' stop-opacity='0.35'/><stop offset='100%' stop-color='${color}' stop-opacity='0.1'/></linearGradient></defs><rect width='100%' height='100%' rx='12' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,sans-serif' font-size='14' fill='${color}' opacity='0.85'>${title}</text></svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`

    if (hex.includes("var(") || hex.includes("rgb") || hex.includes("hsl")) {
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    }

    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)

    if (isNaN(num)) {
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    }

    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}

const normalizeMultiline = (str?: string) => (str || "").replace(/\\n/g, "\n")
const withAccentVar = (fallback: string) =>
    `var(--accent, ${(fallback || "#00C2FF").trim() || "#00C2FF"})`
const alphaMix = (color: string, a: number) => {
    const pct = Math.round(Math.max(0, Math.min(1, a)) * 100)
    return `color-mix(in oklab, ${color} ${pct}%, transparent)`
}

const useLockBodyScroll = () => {
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = originalStyle
        }
    }, [])
}

/* ========================= ICONS ========================= */

const IconSm = (d: string, sz = 18) => (
    <svg
        width={sz}
        height={sz}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: d }}
    />
)
const IconTablet = () =>
    IconSm(
        '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>'
    )
const IconHeadphones = () =>
    IconSm(
        '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'
    )
const IconBox = () =>
    IconSm(
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
    )
const IconEye = () =>
    IconSm(
        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        16
    )
const IconChevronUp = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
)
const IconChevronDown = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
)

/* ========================= CSS ========================= */

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.m-scroll::-webkit-scrollbar{width:0;background:transparent}
.m-scroll{scrollbar-width:none;-ms-overflow-style:none}
.m-pill{transition:transform .1s ease-out,box-shadow .1s ease-out,border-color .1s ease-out,background .1s ease-out}
.m-pill:active{transform:scale(0.96) !important;box-shadow:var(--pill-glow) !important}
.m-faq-btn{transition:transform .1s ease-out,box-shadow .1s ease-out}
.m-faq-btn:active{transform:scale(0.9)}
.m-amazon-pill{transition:transform .1s ease-out}
.m-amazon-pill:active{transform:scale(0.95)}
.m-author-card{transition:transform .1s ease-out}
.m-author-card:active{transform:scale(0.97) !important}
.m-preview-btn{transition:transform .1s ease-out,box-shadow .1s ease-out}
.m-preview-btn:active{transform:scale(0.96)}
.m-explore-btn{transition:transform .12s ease-out,border-color .15s ease-out,box-shadow .15s ease-out}
.m-explore-btn:active{transform:scale(0.95) !important}
@keyframes exploreShimmer{0%{left:-100%}50%{left:140%}100%{left:140%}}
@keyframes consolaOverlayIn{from{opacity:0}to{opacity:1}}
@keyframes consolaSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
`

/* ========================= STARS (WARP) ========================= */

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

const StarsBackground = memo(
    ({
        num = 90,
        speed = 1,
        bgColor = "#0B0C13",
    }: {
        num?: number
        speed?: number
        bgColor?: string
    }) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [activated, setActivated] = useState(false)

        const stars = useMemo(() => {
            const count = Math.floor(num * 1.5)
            const arr: any[] = []
            for (let i = 0; i < count; i++) {
                const sz =
                    pseudoRandom(i) > 0.8
                        ? pseudoRandom(i + 1000) * 2 + 1
                        : pseudoRandom(i + 1000) * 1.5 + 0.5
                const tx = (pseudoRandom(i + 2000) - 0.5) * 250
                const ty = (pseudoRandom(i + 3000) - 0.5) * 250
                const dur = (1.5 + pseudoRandom(i + 4000) * 4) / speed
                const del = pseudoRandom(i + 5000) * 5
                arr.push({
                    id: i,
                    sz: sz,
                    tx: `${tx.toFixed(0)}vw`,
                    ty: `${ty.toFixed(0)}vh`,
                    d: `${dur.toFixed(2)}s`,
                    dl: `${del.toFixed(2)}s`,
                })
            }
            return arr
        }, [num, speed])

        useEffect(() => {
            let done = false
            const activate = () => {
                if (done) return
                done = true
                const el = containerRef.current
                if (el) void el.offsetHeight
                setActivated(true)
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    activate()
                })
            })
            const fallback = setTimeout(activate, 250)
            return () => {
                done = true
                clearTimeout(fallback)
            }
        }, [])

        return (
            <>
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        backgroundColor: bgColor,
                        minHeight: "100vh",
                    }}
                />
                <div className="sf-stars-container" ref={containerRef}>
                    {stars.map((s) => (
                        <div
                            key={s.id}
                            className={`sf-star${activated ? " sf-active" : ""}`}
                            style={{
                                width: s.sz,
                                height: s.sz,
                                ["--tx" as any]: s.tx,
                                ["--ty" as any]: s.ty,
                                ["--d" as any]: s.d,
                                ["--dl" as any]: s.dl,
                            }}
                        />
                    ))}
                </div>
            </>
        )
    }
)

/* ========================= AUTHOR CARDS ========================= */

const SunIcon = ({ color, size = 36 }: { color: string; size?: number }) => {
    const ACC = color
    const A = (x: number) => hexToRgba(ACC, x)
    const rays = Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
            <line
                key={i}
                x1={32 + Math.cos(a) * 15}
                y1={32 + Math.sin(a) * 15}
                x2={32 + Math.cos(a) * 24}
                y2={32 + Math.sin(a) * 24}
                stroke={ACC}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.9}
            />
        )
    })
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            style={{
                overflow: "visible",
                filter: `drop-shadow(0 0 6px ${A(0.8)})`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="32"
                cy="32"
                r="10"
                fill={A(0.25)}
                stroke={ACC}
                strokeWidth="2"
            />
            {rays}
        </motion.svg>
    )
}

const DropIcon = ({ color, size = 36 }: { color: string; size?: number }) => {
    const ACC = color
    const A = (x: number) => hexToRgba(ACC, x)
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            style={{
                overflow: "visible",
                filter: `drop-shadow(0 0 6px ${A(0.8)})`,
            }}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
            <path
                d="M32 6 C24 18 14 28 14 40 c0 10 8 18 18 18s18-8 18-18c0-12-10-22-18-34z"
                fill={A(0.22)}
                stroke={ACC}
                strokeWidth="2"
            />
        </motion.svg>
    )
}

const AuthorCard = ({
    name,
    icon,
    accentColor,
    onSelect,
    delay = 0,
}: {
    name: string
    icon: "sun" | "drop"
    accentColor: string
    onSelect: () => void
    delay?: number
}) => {
    const ACC = accentColor
    const A = (x: number) => hexToRgba(ACC, x)
    return (
        <motion.div
            className="m-author-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            onClick={onSelect}
            style={{
                width: "90%",
                maxWidth: "400px",
                height: "140px",
                borderRadius: "18px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${A(0.4)}`,
                background: `linear-gradient(135deg, ${A(0.1)}, ${A(0.04)}, ${A(0.08)})`,
                boxShadow: `0 12px 30px ${A(0.15)}, inset 0 0 30px ${A(0.08)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                transform: "scale(1)",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: "-20%",
                    height: "40%",
                    left: "-50%",
                    width: "60%",
                    background: `linear-gradient(115deg, transparent, ${A(0.4)}, transparent)`,
                    filter: "blur(6px)",
                    transform: "rotate(8deg)",
                }}
                animate={{ left: ["-50%", "130%"] }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: 14,
                    border: `1px solid ${A(0.3)}`,
                    pointerEvents: "none",
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                }}
            >
                {icon === "sun" ? (
                    <SunIcon color={accentColor} />
                ) : (
                    <DropIcon color={accentColor} />
                )}
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "1.3rem",
                        fontWeight: 600,
                        color: ACC,
                        textShadow: `0 0 10px ${A(0.6)}, 0 0 20px ${A(0.3)}`,
                        letterSpacing: ".02em",
                    }}
                >
                    {name}
                </span>
            </div>
        </motion.div>
    )
}

/* ========================= FICHA TÉCNICA ========================= */

const FichaTecnica = ({
    pageCount,
    year,
    accentColor,
}: {
    pageCount?: string | number
    year?: string | number
    accentColor: string
}) => {
    const hp = pageCount && String(pageCount).trim() !== ""
    const hy = year && String(year).trim() !== ""
    if (!hp && !hy) return null
    return (
        <div
            style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                padding: "6px 0",
                fontSize: ".75rem",
                color: "rgba(255,255,255,.4)",
                fontFamily: "'Inter',sans-serif",
                letterSpacing: ".03em",
            }}
        >
            {hy && (
                <span>
                    Año:{" "}
                    <span style={{ color: accentColor, fontWeight: 500 }}>
                        {year}
                    </span>
                </span>
            )}
            {hp && (
                <span>
                    {pageCount}{" "}
                    <span style={{ color: accentColor, fontWeight: 500 }}>
                        Páginas
                    </span>
                </span>
            )}
        </div>
    )
}

/* ========================= PURCHASE PILL ========================= */

const PurchasePill = ({
    icon: Icon,
    label,
    subLabel,
    href,
    onClick,
    accentColor,
    textColor,
}: any) => {
    const Tag: any = href ? "a" : "button"
    const lp: any = href ? { href, target: "_self" } : { onClick }
    return (
        <Tag
            {...lp}
            className="m-pill"
            style={
                {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    padding: "16px 20px",
                    background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.25)})`,
                    border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                    borderRadius: "16px",
                    color: textColor,
                    textDecoration: "none",
                    outline: "none",
                    cursor: "pointer",
                    minHeight: "60px",
                    width: "100%",
                    boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}, inset 0 0 6px ${hexToRgba(accentColor, 0.05)}`,
                    ["--pill-glow" as any]: `0 0 24px ${hexToRgba(accentColor, 0.4)}`,
                    transform: "scale(1)",
                    fontSize: "1rem",
                    backdropFilter: "blur(6px)",
                } as React.CSSProperties
            }
        >
            <div
                style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%) scale(1.1)",
                    color: accentColor,
                    filter: `drop-shadow(0 0 8px ${accentColor})`,
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <Icon />
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    textAlign: "center",
                    width: "100%",
                }}
            >
                <span
                    style={{
                        fontSize: ".7rem",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        opacity: 0.8,
                        color: "#fff",
                    }}
                >
                    {label}
                </span>
                {subLabel && (
                    <span
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: textColor,
                            lineHeight: 1.1,
                            letterSpacing: ".02em",
                        }}
                    >
                        {subLabel}
                    </span>
                )}
            </div>
        </Tag>
    )
}

/* ========================= AMAZON SHEET ========================= */

const AmazonSheet = ({
    links,
    accentColor,
    textColor,
    onClose,
}: {
    links: any[]
    accentColor: string
    textColor: string
    onClose: () => void
}) => {
    useLockBodyScroll()

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                background: "rgba(0,0,0,.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "500px",
                    background:
                        "linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,10,20,.99))",
                    borderRadius: "20px 20px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                    borderBottom: "none",
                    padding: "20px 20px 32px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <div
                    style={{
                        width: "40px",
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.5)",
                        alignSelf: "center",
                        marginBottom: "8px",
                    }}
                />
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: ".85rem",
                        fontWeight: 600,
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        textAlign: "center",
                        marginBottom: "4px",
                        textShadow: "0 0 10px rgba(0,0,0,0.5)",
                    }}
                >
                    COMPRAR LIBRO IMPRESO
                </span>
                {links.map((l: any, i: number) => (
                    <a
                        key={i}
                        href={l.href}
                        target="_self"
                        className="m-amazon-pill"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "14px 18px",
                            borderRadius: "16px",
                            border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                            background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                            textDecoration: "none",
                            color: textColor,
                            transform: "scale(1)",
                            boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                        }}
                    >
                        <div style={{ color: accentColor, display: "flex" }}>
                            <IconBox />
                        </div>
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: ".95rem",
                                fontWeight: 500,
                            }}
                        >
                            {l.label}
                        </span>
                    </a>
                ))}
                <button
                    onClick={onClose}
                    style={{
                        marginTop: "4px",
                        padding: "12px",
                        borderRadius: "12px",
                        border: `1px solid ${hexToRgba(accentColor, 0.15)}`,
                        background: "transparent",
                        color: hexToRgba(accentColor, 0.6),
                        fontFamily: "'Inter',sans-serif",
                        fontSize: ".85rem",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    Cerrar
                </button>
            </motion.div>
        </motion.div>
    )
}

/* ========================= FAQ MODAL ========================= */

const FaqModal = ({
    faqs,
    accentColor,
    textColor,
    onClose,
}: {
    faqs: any[]
    accentColor: string
    textColor: string
    onClose: () => void
}) => {
    const [exp, setExp] = useState<number | null>(null)
    useLockBodyScroll()

    if (!faqs || faqs.length === 0) return null
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxHeight: "85vh",
                    background:
                        "linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,10,20,.99))",
                    borderRadius: "20px 20px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.25)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "18px 20px 14px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexShrink: 0,
                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.12)}`,
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "3px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.5)",
                            position: "absolute",
                            top: "8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.05rem",
                            fontWeight: 200,
                            margin: 0,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".1em",
                        }}
                    >
                        Preguntas Frecuentes
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                            background: "rgba(255,255,255,.05)",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>

                <div
                    className="m-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px 16px 60px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    {faqs.map((faq, i) => {
                        const isOpen = exp === i
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isOpen
                                        ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.06)}, transparent)`
                                        : "linear-gradient(135deg, rgba(255,255,255,.02), transparent)",
                                    border: `1px solid ${isOpen ? hexToRgba(accentColor, 0.4) : hexToRgba(accentColor, 0.08)}`,
                                    borderRadius: "12px",
                                    overflow: "visible",
                                    cursor: "pointer",
                                    transition: "border-color .15s ease-out",
                                }}
                                onClick={() => setExp(isOpen ? null : i)}
                            >
                                <div
                                    style={{
                                        padding: "14px 16px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: ".9rem",
                                            fontWeight: 400,
                                            color: isOpen ? "#FFF" : textColor,
                                            opacity: isOpen ? 1 : 0.8,
                                            flex: 1,
                                            paddingRight: "8px",
                                        }}
                                    >
                                        {faq.q}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "1.1rem",
                                            color: accentColor,
                                            opacity: 0.8,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition:
                                                "transform .2s ease-out",
                                            flexShrink: 0,
                                        }}
                                    >
                                        +
                                    </span>
                                </div>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                duration: 0.25,
                                                ease: "easeInOut",
                                            }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div
                                                style={{
                                                    padding: "0 16px 16px 16px",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                    fontSize: ".85rem",
                                                    lineHeight: 1.7,
                                                    color: textColor,
                                                    opacity: 0.65,
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ========================= VIDEO MODAL ========================= */

const VideoModal = ({
    videoUrl,
    accentColor,
    onClose,
}: {
    videoUrl: string
    accentColor: string
    onClose: () => void
}) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    useLockBodyScroll()

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        v.play().catch(() => {})
        const handleEnded = () => onClose()
        v.addEventListener("ended", handleEnded)
        return () => v.removeEventListener("ended", handleEnded)
    }, [onClose])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100002,
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    playsInline
                    controls
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#000",
                    }}
                />
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: `1.5px solid ${hexToRgba(accentColor, 0.5)}`,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: "none",
                        zIndex: 1,
                        fontSize: "1.2rem",
                    }}
                >
                    ×
                </button>
            </motion.div>
        </motion.div>
    )
}

/* ========================= CONSOLA DE ACCESO ========================= */

const ConsolaDeAcceso = ({
    book,
    accentColor,
    textColor,
    longDescSize,
    onClose,
    onPreview,
    onPhysicalLinks,
    onTrailer,
}: any) => {
    const hasDig = !!(book.digitalLink && book.digitalLink.trim())
    const hasAud = !!(book.audiobookLink && book.audiobookLink.trim())
    const hasPhy = book.physicalLinks && book.physicalLinks.length > 0
    const hasPreview = !!book.pdfUrl
    const hasTrailer = !!(book.trailerUrl && book.trailerUrl.trim())
    const anyButton = hasDig || hasAud || hasPhy

    useLockBodyScroll()

    // Unified pull-to-close system
    const scrollRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef(0)
    const dragOffset = useRef(0)
    const isDragging = useRef(false)
    const wasScrolling = useRef(false)
    const [dismissed, setDismissed] = useState(false)

    // Threshold & physics
    const DISMISS_THRESHOLD = 140
    const VELOCITY_THRESHOLD = 800

    // Track velocity
    const lastTouchY = useRef(0)
    const lastTouchTime = useRef(0)
    const velocity = useRef(0)

    const applyTransform = useCallback((offset: number) => {
        if (!sheetRef.current || !overlayRef.current) return
        const clamped = Math.max(0, offset)
        // Rubber-band resistance when pulling far
        const transformed =
            clamped < 200 ? clamped : 200 + (clamped - 200) * 0.3
        sheetRef.current.style.transform = `translateY(${transformed}px)`
        // Fade overlay as sheet moves down
        const progress = Math.min(transformed / 400, 1)
        overlayRef.current.style.background = `rgba(0,0,0,${0.7 * (1 - progress * 0.6)})`
    }, [])

    const snapBack = useCallback(() => {
        if (!sheetRef.current || !overlayRef.current) return
        sheetRef.current.style.transition =
            "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)"
        sheetRef.current.style.transform = "translateY(0)"
        overlayRef.current.style.transition = "background 0.35s ease"
        overlayRef.current.style.background = "rgba(0,0,0,0.7)"
        isDragging.current = false
        dragOffset.current = 0
    }, [])

    // Guard to ensure onClose fires exactly once
    const closedRef = useRef(false)
    const safeClose = useCallback(() => {
        if (closedRef.current) return
        closedRef.current = true
        onClose()
    }, [onClose])

    const dismiss = useCallback(() => {
        if (dismissed || closedRef.current) return
        setDismissed(true)
        isDragging.current = false
        dragOffset.current = 0

        const sheet = sheetRef.current
        const overlay = overlayRef.current
        if (!sheet || !overlay) {
            safeClose()
            return
        }

        // Get current position from manual drag
        const matrix = new DOMMatrixReadOnly(getComputedStyle(sheet).transform)
        const currentY = matrix.m42 || 0

        // Animate sheet from current position to off-screen
        sheet.style.transition = "none"
        sheet.style.transform = `translateY(${currentY}px)`
        void sheet.offsetHeight
        sheet.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.7, 1)"
        sheet.style.transform = "translateY(105vh)"

        // Fade overlay
        overlay.style.transition = "opacity 0.35s ease"
        overlay.style.opacity = "0"

        // Single cleanup — transitionend with property filter + safety timeout
        const cleanup = (e?: TransitionEvent) => {
            // Only react to transform ending on the sheet itself
            if (e && (e.propertyName !== "transform" || e.target !== sheet))
                return
            sheet.removeEventListener("transitionend", cleanup)
            safeClose()
        }
        sheet.addEventListener("transitionend", cleanup)
        // Safety timeout (safeClose guards against double-call)
        setTimeout(safeClose, 500)
    }, [dismissed, safeClose])

    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0]
            touchStartY.current = t.clientY
            lastTouchY.current = t.clientY
            lastTouchTime.current = Date.now()
            velocity.current = 0
            wasScrolling.current = false

            // Remove transitions so drag feels instant
            if (sheetRef.current) sheetRef.current.style.transition = "none"
            if (overlayRef.current) overlayRef.current.style.transition = "none"
        },
        [dismissed]
    )

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0]
            const scrollEl = scrollRef.current
            if (!scrollEl) return

            const deltaFromStart = t.clientY - touchStartY.current
            const atTop = scrollEl.scrollTop <= 1

            // Calculate velocity
            const now = Date.now()
            const dt = now - lastTouchTime.current
            if (dt > 0) {
                velocity.current =
                    ((t.clientY - lastTouchY.current) / dt) * 1000
            }
            lastTouchY.current = t.clientY
            lastTouchTime.current = now

            // If we were scrolling content upward, don't hijack into sheet drag
            if (!isDragging.current && !atTop) {
                wasScrolling.current = true
                return
            }

            // If at top and pulling down: start dragging the sheet
            if (atTop && deltaFromStart > 0) {
                // If we were mid-scroll, wait for a fresh gesture
                if (wasScrolling.current && !isDragging.current) {
                    // Reset start point for clean drag
                    touchStartY.current = t.clientY
                    wasScrolling.current = false
                    return
                }

                isDragging.current = true
                dragOffset.current = deltaFromStart

                // Prevent scroll while dragging sheet
                e.preventDefault()
                applyTransform(deltaFromStart)
            } else if (isDragging.current && deltaFromStart <= 0) {
                // User reversed direction back up — snap back and let scroll take over
                isDragging.current = false
                dragOffset.current = 0
                snapBack()
            }
        },
        [dismissed, applyTransform, snapBack]
    )

    const handleTouchEnd = useCallback(() => {
        if (dismissed) return
        if (!isDragging.current) return

        const offset = dragOffset.current
        const vel = velocity.current

        // Dismiss if: dragged past threshold OR fast flick downward
        if (offset > DISMISS_THRESHOLD || vel > VELOCITY_THRESHOLD) {
            dismiss()
        } else {
            snapBack()
        }
    }, [dismissed, dismiss, snapBack])

    // Attach touch listeners to the entire sheet (not just scroll)
    useEffect(() => {
        const sheet = sheetRef.current
        if (!sheet) return

        const opts: AddEventListenerOptions = { passive: false }
        sheet.addEventListener("touchstart", handleTouchStart, opts)
        sheet.addEventListener("touchmove", handleTouchMove, opts)
        sheet.addEventListener("touchend", handleTouchEnd)
        sheet.addEventListener("touchcancel", handleTouchEnd)

        return () => {
            sheet.removeEventListener("touchstart", handleTouchStart)
            sheet.removeEventListener("touchmove", handleTouchMove)
            sheet.removeEventListener("touchend", handleTouchEnd)
            sheet.removeEventListener("touchcancel", handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    // After entry animation completes, clear it so manual transforms work
    useEffect(() => {
        const sheet = sheetRef.current
        const overlay = overlayRef.current
        if (!sheet || !overlay) return

        const onSheetAnimEnd = (e: AnimationEvent) => {
            if (e.animationName === "consolaSheetIn") {
                sheet.style.animation = "none"
                sheet.style.transform = "translateY(0)"
            }
        }
        const onOverlayAnimEnd = (e: AnimationEvent) => {
            if (e.animationName === "consolaOverlayIn") {
                overlay.style.animation = "none"
                overlay.style.opacity = "1"
            }
        }

        sheet.addEventListener("animationend", onSheetAnimEnd)
        overlay.addEventListener("animationend", onOverlayAnimEnd)

        return () => {
            sheet.removeEventListener("animationend", onSheetAnimEnd)
            overlay.removeEventListener("animationend", onOverlayAnimEnd)
        }
    }, [])

    return (
        <div
            ref={overlayRef}
            onClick={dismissed ? undefined : dismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99998,
                background: "rgba(0,0,0,.7)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pointerEvents: dismissed ? "none" : "auto",
                animation: "consolaOverlayIn 0.2s ease forwards",
            }}
        >
            <div
                ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    height: "92vh",
                    background:
                        "linear-gradient(180deg,rgba(8,14,28,.98),rgba(5,10,20,.99))",
                    borderRadius: "22px 22px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    willChange: "transform",
                    animation:
                        "consolaSheetIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
            >
                {/* Header Fixed */}
                <div
                    style={{
                        flexShrink: 0,
                        padding: "14px 20px 12px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "3px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.5)",
                            position: "absolute",
                            top: "8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <span
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: ".7rem",
                            fontWeight: 300,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".15em",
                            opacity: 0.7,
                        }}
                    >
                        Consola de Acceso
                    </span>
                    <button
                        onClick={dismiss}
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                            background: "rgba(255,255,255,.05)",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    className="m-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "18px",
                        padding: "0 20px 20px 20px",
                    }}
                >
                    {/* Cover + Title + Buttons Row */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: "16px",
                            width: "100%",
                        }}
                    >
                        <img
                            src={
                                book.coverUrl ||
                                makeFallbackDataUrl(book.title, accentColor)
                            }
                            alt={book.title}
                            style={{
                                width: "110px",
                                borderRadius: "12px",
                                boxShadow: `0 8px 24px rgba(0,0,0,.5), 0 0 15px ${hexToRgba(accentColor, 0.08)}`,
                                flexShrink: 0,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                paddingTop: "4px",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: "1.25rem",
                                    fontWeight: 300,
                                    color: "#FFF",
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                {book.title}
                            </h2>
                            <span
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: ".8rem",
                                    color: accentColor,
                                    fontWeight: 400,
                                    opacity: 0.8,
                                }}
                            >
                                {book.author}
                            </span>
                            <FichaTecnica
                                pageCount={book.pageCount}
                                year={book.year}
                                accentColor={accentColor}
                            />

                            {(hasPreview || hasTrailer) && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginTop: "8px",
                                        width: "100%",
                                        flex: 1,
                                        minHeight: 0,
                                    }}
                                >
                                    {hasPreview && (
                                        <button
                                            className="m-preview-btn"
                                            onClick={onPreview}
                                            style={{
                                                flex: 1,
                                                padding: "10px 6px",
                                                borderRadius: "12px",
                                                border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                                                background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                                                color: "#FFF",
                                                cursor: "pointer",
                                                outline: "none",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                fontSize: ".68rem",
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                                textAlign: "center",
                                                boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                                            }}
                                        >
                                            <IconEye />
                                            <span>
                                                Leer Primeras
                                                <br />
                                                Páginas
                                            </span>
                                        </button>
                                    )}
                                    {hasTrailer && (
                                        <button
                                            className="m-preview-btn"
                                            onClick={onTrailer}
                                            style={{
                                                flex: 1,
                                                padding: "10px 6px",
                                                borderRadius: "12px",
                                                border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                                                background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                                                color: "#FFF",
                                                cursor: "pointer",
                                                outline: "none",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                fontSize: ".68rem",
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                                textAlign: "center",
                                                boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                                            }}
                                        >
                                            <span
                                                style={{ fontSize: "1.1rem" }}
                                            >
                                                🎬
                                            </span>
                                            <span>
                                                Ver
                                                <br />
                                                Trailer
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div
                        style={{
                            width: "50px",
                            height: "1px",
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                            opacity: 0.3,
                            flexShrink: 0,
                        }}
                    />

                    {/* Long synopsis */}
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: `${longDescSize}px`,
                            lineHeight: 1.75,
                            color: textColor,
                            opacity: 0.8,
                            textAlign: "left",
                            margin: 0,
                            whiteSpace: "pre-line",
                            width: "100%",
                            paddingBottom: "10px",
                        }}
                    >
                        {book.synopsis || book.shortSynopsis}
                    </p>
                </div>

                {/* Sticky Purchase Footer */}
                {anyButton && (
                    <div
                        style={{
                            flexShrink: 0,
                            width: "100%",
                            padding: "20px 20px 30px 20px",
                            background: `linear-gradient(0deg, #050A14 40%, rgba(5,10,20,0.8) 80%, transparent)`,
                            borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            zIndex: 10,
                        }}
                    >
                        {hasDig && (
                            <PurchasePill
                                icon={IconTablet}
                                label="DESBLOQUEAR"
                                subLabel="PDF + Ebook"
                                href={book.digitalLink}
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                        {hasAud && (
                            <PurchasePill
                                icon={IconHeadphones}
                                label="DESBLOQUEAR"
                                subLabel="Audiolibro"
                                href={book.audiobookLink}
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                        {hasPhy && (
                            <PurchasePill
                                icon={IconBox}
                                label="MATERIALIZAR"
                                subLabel="Libro Impreso"
                                onClick={() =>
                                    onPhysicalLinks(book.physicalLinks)
                                }
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ========================= PDF VIEWER ========================= */

const PdfViewer = ({
    pdfUrl,
    title,
    accentColor,
    onClose,
}: {
    pdfUrl: string
    title: string
    accentColor: string
    onClose: () => void
}) => {
    useLockBodyScroll()
    const styles = {
        modalOverlay: {
            position: "fixed" as const,
            inset: 0,
            background: "rgba(0,0,0,.7)",
            backdropFilter: "blur(10px)",
            zIndex: 100001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6vh 4vw",
        },
        modalCard: {
            width: "96vw",
            height: "88vh",
            borderRadius: 18,
            border: `2px solid ${accentColor}`,
            boxShadow: `0 0 18px ${hexToRgba(accentColor, 0.6)}, 0 0 36px ${hexToRgba(accentColor, 0.33)}`,
            overflow: "hidden",
            background: "rgba(5,10,20,.95)",
            display: "flex",
            flexDirection: "column" as const,
        },
        modalHead: {
            padding: "10px 12px",
            borderBottom: `1px solid ${hexToRgba(accentColor, 0.35)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#fff",
            fontSize: 14,
        },
        modalBody: {
            flex: 1,
            background: "#000",
            overflow: "auto",
            WebkitOverflowScrolling: "touch" as const,
        },
    }

    return (
        <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                style={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.98, opacity: 0.95 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0.9 }}
            >
                <div style={styles.modalHead}>
                    <div style={{ maxWidth: "80%" }}>{title}</div>
                    <button
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: `1px solid ${accentColor}`,
                            color: accentColor,
                            background: "transparent",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                        }}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <div style={styles.modalBody}>
                    <embed
                        src={`${pdfUrl}#page=1&zoom=page-fit`}
                        type="application/pdf"
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ========================= BOOK THUMB (scroll card) ========================= */

const BookThumb = ({
    book,
    accentColor,
    textColor,
    shortDescSize,
    exploreLabel,
    onOpen,
    onPhysicalLinks,
    anchorId,
}: any) => {
    const hasDig = !!(book.digitalLink && book.digitalLink.trim())
    const hasAud = !!(book.audiobookLink && book.audiobookLink.trim())
    const hasPhy = book.physicalLinks && book.physicalLinks.length > 0
    const anyButton = hasDig || hasAud || hasPhy

    return (
        <motion.div
            id={anchorId}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                padding: "0 0 24px 0",
                scrollMarginTop: "90px",
            }}
        >
            <div style={{ width: "65vw", maxWidth: "260px" }} onClick={onOpen}>
                <img
                    src={
                        book.coverUrl ||
                        makeFallbackDataUrl(book.title, accentColor)
                    }
                    alt={book.title}
                    style={{
                        width: "100%",
                        borderRadius: "16px",
                        boxShadow: `0 15px 40px rgba(0,0,0,.5), 0 0 25px ${hexToRgba(accentColor, 0.08)}`,
                        display: "block",
                        cursor: "pointer",
                    }}
                />
            </div>
            <h2
                onClick={onOpen}
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 100,
                    color: "#FFF",
                    margin: 0,
                    textAlign: "center",
                    lineHeight: 1.25,
                    padding: "0 20px",
                    cursor: "pointer",
                    letterSpacing: ".08em",
                    textShadow: `0 0 18px ${hexToRgba(accentColor, 0.2)}`,
                }}
            >
                {book.title}
            </h2>
            <p
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: `${shortDescSize}px`,
                    lineHeight: 1.65,
                    color: textColor,
                    opacity: 0.6,
                    textAlign: "center",
                    padding: "0 28px",
                    margin: 0,
                    overflow: "visible",
                }}
            >
                {book.shortSynopsis || book.synopsis}
            </p>

            {/* Botón explícito "Explorar Códice" */}
            <button
                className="m-explore-btn"
                onClick={onOpen}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "14px 32px",
                    borderRadius: "16px",
                    border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                    background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.12)}, transparent, ${hexToRgba(accentColor, 0.08)})`,
                    color: accentColor,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: ".78rem",
                    fontWeight: 500,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    outline: "none",
                    marginTop: "6px",
                    boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.15)}, 0 0 40px ${hexToRgba(accentColor, 0.05)}, inset 0 1px 0 ${hexToRgba(accentColor, 0.2)}`,
                    transform: "scale(1)",
                    overflow: "hidden",
                    backdropFilter: "blur(4px)",
                }}
            >
                {/* Shimmer line */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "16px",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "60%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.2)}, transparent)`,
                            animation: "exploreShimmer 3s ease-in-out infinite",
                        }}
                    />
                </div>
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: "relative", zIndex: 1 }}
                >
                    {/* Portal / diamond icon */}
                    <path d="M12 2L22 12L12 22L2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ position: "relative", zIndex: 1 }}>
                    {exploreLabel}
                </span>
            </button>

            {anyButton && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: "320px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "12px 20px 0 20px",
                    }}
                >
                    {hasDig && (
                        <PurchasePill
                            icon={IconTablet}
                            label="DESBLOQUEAR"
                            subLabel="PDF + Ebook"
                            href={book.digitalLink}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    )}
                    {hasAud && (
                        <PurchasePill
                            icon={IconHeadphones}
                            label="DESBLOQUEAR"
                            subLabel="Audiolibro"
                            href={book.audiobookLink}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    )}
                    {hasPhy && (
                        <PurchasePill
                            icon={IconBox}
                            label="MATERIALIZAR"
                            subLabel="Libro Impreso"
                            onClick={() => onPhysicalLinks(book.physicalLinks)}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    )}
                </div>
            )}
        </motion.div>
    )
}

/* ========================= MAIN COMPONENT ========================= */

export default function ArchivoHolograficoLibrosMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        textColor = "#FFFFFF",
        accentColor: accentProp,
        pageTitleImage,
        pageTitleImageHeight = 60,
        pageTitleFallback = "ARCHIVOS",
        titleFallbackSize = 28,
        shortDescSize = 13,
        longDescSize = 14,
        pageSubtitle = "Explora el conocimiento estelar",
        exploreButtonLabel = "EXPLORAR CÓDICE",
        booksList = [],
        faqList = [],
        numStars = 35,
        warpSpeed = 1,
        topPaddingPx = 70,
        cardGapPx = 44,
    } = props

    const [accentColor, setAccentColor] = useState(accentProp || "#00C2FF")
    const containerRef = useRef<HTMLDivElement>(null)
    const zakRef = useRef<HTMLDivElement>(null)
    const aquaRef = useRef<HTMLDivElement>(null)

    const [consolaBook, setConsolaBook] = useState<any | null>(null)
    const [showFaq, setShowFaq] = useState(false)
    const [showAmazon, setShowAmazon] = useState<any[] | null>(null)
    const [pdfState, setPdfState] = useState<{
        url: string
        title: string
    } | null>(null)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [videoState, setVideoState] = useState<{ url: string } | null>(null)
    const [showDock, setShowDock] = useState(false)

    useEffect(() => {
        if (accentProp) {
            setAccentColor(accentProp)
            return
        }
        const t = setTimeout(() => {
            try {
                const v = getComputedStyle(document.documentElement)
                    .getPropertyValue("--accent")
                    .trim()
                if (v) setAccentColor(v)
            } catch {}
        }, 200)
        return () => clearTimeout(t)
    }, [accentProp])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const fn = () => setShowDock(el.scrollTop > window.innerHeight * 0.5)
        el.addEventListener("scroll", fn, { passive: true })
        return () => el.removeEventListener("scroll", fn)
    }, [])

    /* ---- FIX #1: Anchor link scroll on load ---- */
    const books = useMemo(
        () =>
            (booksList || []).map((b: any, i: number) => ({
                id: String(i),
                title: b.title || "Sin título",
                author: b.authorOption || "Zak´Haar",
                coverUrl: b.cover,
                synopsis: b.longDesc,
                shortSynopsis: b.shortDesc,
                digitalLink: b.linkDigital,
                audiobookLink: b.linkAudio,
                pdfUrl: b.pdfFile,
                trailerUrl: b.trailerFile || b.trailerUrl || "",
                pageCount: b.pageCount || "",
                year: b.year || "",
                physicalLinks: [
                    b.linkAmazonES && {
                        label: "Amazon ES",
                        href: b.linkAmazonES,
                    },
                    b.linkAmazonMX && {
                        label: "Amazon MX",
                        href: b.linkAmazonMX,
                    },
                    b.linkAmazonUS && {
                        label: "Amazon US",
                        href: b.linkAmazonUS,
                    },
                    b.linkAmazonDE && {
                        label: "Amazon DE",
                        href: b.linkAmazonDE,
                    },
                ].filter(Boolean),
            })),
        [booksList]
    )

    const zakBooks = useMemo(
        () => books.filter((b: any) => b.author.includes("Zak")),
        [books]
    )
    const aquaBooks = useMemo(
        () => books.filter((b: any) => !b.author.includes("Zak")),
        [books]
    )

    // Ordered list: Zak first, then Aqua — for anchor numbering
    const orderedBooks = useMemo(
        () => [...zakBooks, ...aquaBooks],
        [zakBooks, aquaBooks]
    )

    // Map from book.id → anchor number (1-based)
    const bookAnchorMap = useMemo(() => {
        const map: Record<string, number> = {}
        orderedBooks.forEach((b: any, i: number) => {
            map[b.id] = i + 1
        })
        return map
    }, [orderedBooks])

    // Scroll to hash anchor on initial load
    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return
        const anchorNum = hash.replace("#", "")
        if (!anchorNum || isNaN(Number(anchorNum))) return

        // Small delay to let the DOM render
        const timer = setTimeout(() => {
            const el = document.getElementById(`book-anchor-${anchorNum}`)
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [orderedBooks])

    const resolvedSub = useMemo(
        () => normalizeMultiline(pageSubtitle),
        [pageSubtitle]
    )

    const handleAuthorScroll = useCallback((author: string) => {
        const ref = author === "Zak" ? zakRef : aquaRef
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [])

    const handlePreview = useCallback(() => {
        if (consolaBook?.pdfUrl)
            setPdfState({ url: consolaBook.pdfUrl, title: consolaBook.title })
    }, [consolaBook])

    const handleTrailer = useCallback(() => {
        if (consolaBook?.trailerUrl)
            setVideoState({ url: consolaBook.trailerUrl })
    }, [consolaBook])

    /* PDF Blob logic */
    useEffect(() => {
        if (!pdfState) {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
            setPdfBlobUrl(null)
            return
        }
        let cancel = false
        let rev: string | null = null
        ;(async () => {
            try {
                const r = await fetch(pdfState.url)
                if (!r.ok) throw new Error()
                const b = await r.blob()
                const u = URL.createObjectURL(
                    b.type === "application/pdf"
                        ? b
                        : new Blob([b], { type: "application/pdf" })
                )
                if (!cancel) {
                    setPdfBlobUrl(u)
                    rev = u
                }
            } catch {
                if (!cancel) setPdfBlobUrl(null)
            }
        })()
        return () => {
            cancel = true
            if (rev) URL.revokeObjectURL(rev)
        }
    }, [pdfState])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                background: bgColor,
                fontFamily: "'Inter',sans-serif",
                color: textColor,
            }}
        >
            <style>{MOBILE_CSS}</style>
            <StarsBackground
                num={numStars}
                speed={warpSpeed}
                bgColor={bgColor}
            />

            {/* Dock */}
            <AnimatePresence>
                {showDock &&
                    !consolaBook &&
                    !showFaq &&
                    !showAmazon &&
                    !pdfState &&
                    !videoState && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: "fixed",
                                bottom: 40,
                                right: 0,
                                zIndex: 99997,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            {faqList && faqList.length > 0 && (
                                <button
                                    className="m-faq-btn"
                                    onClick={() => setShowFaq(true)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "14px 0 0 14px",
                                        borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderLeft: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderRight: `2px solid ${hexToRgba(accentColor, 0.5)}`,
                                        background: "rgba(8,12,20,0.95)",
                                        backdropFilter: "blur(12px)",
                                        color: hexToRgba(accentColor, 0.65),
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        outline: "none",
                                        boxShadow: `-4px 0 15px ${hexToRgba(accentColor, 0.05)}`,
                                        paddingRight: 4,
                                    }}
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <path d="M12 17h.01" strokeWidth="2" />
                                    </svg>
                                </button>
                            )}
                            <button
                                className="m-faq-btn"
                                onClick={() =>
                                    containerRef.current?.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    })
                                }
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "14px 0 0 14px",
                                    borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderBottom: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderLeft: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderRight: `2px solid ${hexToRgba(accentColor, 0.5)}`,
                                    background: "rgba(8,12,20,0.95)",
                                    backdropFilter: "blur(12px)",
                                    color: hexToRgba(accentColor, 0.65),
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    outline: "none",
                                    boxShadow: `-4px 0 15px ${hexToRgba(accentColor, 0.05)}`,
                                    paddingRight: 4,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="18 15 12 9 6 15" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showFaq && (
                    <FaqModal
                        faqs={faqList}
                        accentColor={accentColor}
                        textColor={textColor}
                        onClose={() => setShowFaq(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showAmazon && (
                    <AmazonSheet
                        links={showAmazon}
                        accentColor={accentColor}
                        textColor={textColor}
                        onClose={() => setShowAmazon(null)}
                    />
                )}
            </AnimatePresence>
            {consolaBook && (
                <ConsolaDeAcceso
                    book={consolaBook}
                    accentColor={accentColor}
                    textColor={textColor}
                    longDescSize={longDescSize}
                    onClose={() => setConsolaBook(null)}
                    onPreview={handlePreview}
                    onTrailer={handleTrailer}
                    onPhysicalLinks={(links: any[]) => setShowAmazon(links)}
                />
            )}

            {/* PDF Viewer */}
            <AnimatePresence>
                {pdfState && pdfBlobUrl && (
                    <PdfViewer
                        pdfUrl={pdfBlobUrl}
                        title={`Vista Previa: ${pdfState.title}`}
                        accentColor={accentColor}
                        onClose={() => setPdfState(null)}
                    />
                )}
            </AnimatePresence>

            {/* Video Modal */}
            <AnimatePresence>
                {videoState && (
                    <VideoModal
                        videoUrl={videoState.url}
                        accentColor={accentColor}
                        onClose={() => setVideoState(null)}
                    />
                )}
            </AnimatePresence>

            {/* Main Scroll */}
            <div
                ref={containerRef}
                className="m-scroll"
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    height: "100vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    style={{
                        textAlign: "center",
                        paddingTop: `${topPaddingPx}px`,
                        paddingBottom: "10px",
                    }}
                >
                    {pageTitleImage ? (
                        <img
                            src={pageTitleImage}
                            alt="Título"
                            style={{
                                height: `${pageTitleImageHeight}px`,
                                objectFit: "contain",
                                maxWidth: "80vw",
                            }}
                        />
                    ) : (
                        <h1
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: `${titleFallbackSize}px`,
                                fontWeight: 100,
                                margin: 0,
                                background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                textTransform: "uppercase",
                                letterSpacing: ".15em",
                                filter: `drop-shadow(0 0 12px ${accentColor}44)`,
                            }}
                        >
                            {pageTitleFallback}
                        </h1>
                    )}
                    {resolvedSub && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "1rem",
                                fontWeight: 300,
                                color: textColor,
                                margin: "12px 0 0 0",
                                letterSpacing: ".12em",
                                textTransform: "uppercase",
                                whiteSpace: "pre-line",
                            }}
                        >
                            {resolvedSub}
                        </motion.p>
                    )}
                </motion.div>

                {/* Author Cards */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "18px",
                        padding: "30px 0 120px 0",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            paddingBottom: "10px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: ".7rem",
                                color: textColor,
                                opacity: 0.5,
                                letterSpacing: ".1em",
                                textTransform: "uppercase",
                            }}
                        >
                            Explorar autores
                        </span>
                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <IconChevronDown />
                        </motion.div>
                    </motion.div>
                    <AuthorCard
                        name="Zak'Haar"
                        icon="sun"
                        accentColor="#00C2FF"
                        onSelect={() => handleAuthorScroll("Zak")}
                        delay={0.3}
                    />
                    <AuthorCard
                        name="Aqua'Riia"
                        icon="drop"
                        accentColor="#00C2FF"
                        onSelect={() => handleAuthorScroll("Aqua")}
                        delay={0.5}
                    />
                </div>

                {/* All Books List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ paddingBottom: "100px" }}
                >
                    {/* ZAK SECTION */}
                    {zakBooks.length > 0 && (
                        <div
                            ref={zakRef}
                            style={{
                                paddingTop: "40px",
                                scrollMarginTop: "20px",
                            }}
                        >
                            <div
                                style={{
                                    padding: "0 20px 38px 20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: ".65rem",
                                        fontWeight: 300,
                                        color: accentColor,
                                        textTransform: "uppercase",
                                        letterSpacing: ".2em",
                                        opacity: 0.45,
                                    }}
                                >
                                    Códices de
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        width: "100%",
                                        maxWidth: "380px",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.5)})`,
                                        }}
                                    />
                                    <h3
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: "1.1rem",
                                            fontWeight: 200,
                                            color: "#FFF",
                                            margin: 0,
                                            letterSpacing: ".22em",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                            textShadow: `0 0 20px ${hexToRgba(accentColor, 0.2)}`,
                                        }}
                                    >
                                        Zak'Haar
                                    </h3>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: `linear-gradient(90deg, ${hexToRgba(accentColor, 0.5)}, transparent)`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: `${cardGapPx}px`,
                                }}
                            >
                                {zakBooks.map((book: any) => (
                                    <BookThumb
                                        key={book.id}
                                        book={book}
                                        accentColor={accentColor}
                                        textColor={textColor}
                                        shortDescSize={shortDescSize}
                                        exploreLabel={exploreButtonLabel}
                                        onOpen={() => setConsolaBook(book)}
                                        onPhysicalLinks={(links: any[]) =>
                                            setShowAmazon(links)
                                        }
                                        anchorId={`book-anchor-${bookAnchorMap[book.id]}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AQUA SECTION */}
                    {aquaBooks.length > 0 && (
                        <div ref={aquaRef} style={{ paddingTop: "60px" }}>
                            <div
                                style={{
                                    padding: "0 20px 38px 20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: ".65rem",
                                        fontWeight: 300,
                                        color: accentColor,
                                        textTransform: "uppercase",
                                        letterSpacing: ".2em",
                                        opacity: 0.45,
                                    }}
                                >
                                    Códices de
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        width: "100%",
                                        maxWidth: "380px",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.5)})`,
                                        }}
                                    />
                                    <h3
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: "1.1rem",
                                            fontWeight: 200,
                                            color: "#FFF",
                                            margin: 0,
                                            letterSpacing: ".22em",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                            textShadow: `0 0 20px ${hexToRgba(accentColor, 0.2)}`,
                                        }}
                                    >
                                        Aqua'Riia
                                    </h3>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: `linear-gradient(90deg, ${hexToRgba(accentColor, 0.5)}, transparent)`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: `${cardGapPx}px`,
                                }}
                            >
                                {aquaBooks.map((book: any) => (
                                    <BookThumb
                                        key={book.id}
                                        book={book}
                                        accentColor={accentColor}
                                        textColor={textColor}
                                        shortDescSize={shortDescSize}
                                        exploreLabel={exploreButtonLabel}
                                        onOpen={() => setConsolaBook(book)}
                                        onPhysicalLinks={(links: any[]) =>
                                            setShowAmazon(links)
                                        }
                                        anchorId={`book-anchor-${bookAnchorMap[book.id]}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

/* ========================= PROPERTY CONTROLS ========================= */

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
    accentColor: { type: ControlType.Color, title: "Acento" },

    titleFallbackSize: {
        type: ControlType.Number,
        title: "Size Título (px)",
        defaultValue: 28,
        min: 16,
        max: 60,
    },
    shortDescSize: {
        type: ControlType.Number,
        title: "Size Desc Corta (px)",
        defaultValue: 13,
        min: 10,
        max: 24,
    },
    longDescSize: {
        type: ControlType.Number,
        title: "Size Desc Larga (px)",
        defaultValue: 14,
        min: 10,
        max: 24,
    },

    pageTitleImage: { type: ControlType.Image, title: "Título PNG" },
    pageTitleImageHeight: {
        type: ControlType.Number,
        title: "Alto Título PNG (px)",
        defaultValue: 60,
    },
    pageTitleFallback: {
        type: ControlType.String,
        title: "Título Fallback",
        defaultValue: "ARCHIVOS",
    },
    pageSubtitle: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Explora el conocimiento estelar",
        displayTextArea: true,
    },
    exploreButtonLabel: {
        type: ControlType.String,
        title: "Texto Botón Explorar",
        defaultValue: "EXPLORAR CÓDICE",
    },
    topPaddingPx: {
        type: ControlType.Number,
        title: "Padding Top (px)",
        defaultValue: 70,
    },
    cardGapPx: {
        type: ControlType.Number,
        title: "Gap entre libros (px)",
        defaultValue: 44,
    },
    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 35,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1,
        step: 0.1,
        min: 0.1,
        max: 5,
    },
    booksList: {
        type: ControlType.Array,
        title: "Lista de Libros",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Título" },
                authorOption: {
                    type: ControlType.Enum,
                    title: "Autor",
                    options: ["Zak´Haar", "Aqua´Riia"],
                    defaultValue: "Zak´Haar",
                },
                cover: { type: ControlType.Image, title: "Portada" },
                pdfFile: {
                    type: ControlType.File,
                    title: "PDF Preview",
                    allowedFileTypes: ["pdf"],
                },
                trailerFile: {
                    type: ControlType.File,
                    title: "🎬 Trailer (video)",
                    allowedFileTypes: ["mp4", "mov", "webm"],
                },
                pageCount: {
                    type: ControlType.String,
                    title: "Nº Páginas",
                    defaultValue: "",
                },
                year: {
                    type: ControlType.String,
                    title: "Año",
                    defaultValue: "",
                },
                shortDesc: {
                    type: ControlType.String,
                    title: "Desc. Corta",
                    displayTextArea: true,
                },
                longDesc: {
                    type: ControlType.String,
                    title: "Desc. Larga",
                    displayTextArea: true,
                },
                linkDigital: {
                    type: ControlType.String,
                    title: "Link Digital",
                },
                linkAudio: { type: ControlType.String, title: "Link Audio" },
                linkAmazonES: { type: ControlType.String, title: "Amazon ES" },
                linkAmazonMX: { type: ControlType.String, title: "Amazon MX" },
                linkAmazonUS: { type: ControlType.String, title: "Amazon US" },
                linkAmazonDE: { type: ControlType.String, title: "Amazon DE" },
            },
        },
    },
    faqList: {
        type: ControlType.Array,
        title: "FAQ List",
        control: {
            type: ControlType.Object,
            controls: {
                q: { type: ControlType.String, title: "Pregunta" },
                a: {
                    type: ControlType.String,
                    title: "Respuesta",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                q: "¿Qué es la Biblioteca Holográfica?",
                a: "Es un repositorio vibral de conocimiento estelar.",
            },
            {
                q: "¿Cómo accedo a los libros?",
                a: "Selecciona un formato y serás redirigido a la plataforma de compra.",
            },
        ],
    },
})
