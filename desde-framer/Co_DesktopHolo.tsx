// Red Solar Viva — Co_DesktopHolo.tsx v1.0
// v1.0 — Visuales pesados del escritorio de Códices: ojo holográfico,
// hero book card 3D con shimmer, marquee infinito con momentum,
// tiles + cápsulas de acción, flare de transición, modales de
// trailer / FAQ / ficha técnica, y wrapper de portada con overlay
// "Abrir Consola". Parte del split de Codices.tsx (sello Co_).
//
// Default export: ghost component + Object.assign con todos los
// componentes hero (patrón canónico para archivos utility-only en
// Framer).
//
// Consumidores: Co_Desktop.tsx (CodicesDesktop usa todo esto).

import * as React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useAnimationFrame,
    wrap,
} from "framer-motion"
import CoShared from "./Co_Shared.tsx"
import CoIcons from "./Co_Icons.tsx"

const {
    hexToRgba,
    withAccentVar,
    alphaMix,
    playHoloHover,
    makeFallbackDataUrl,
} = CoShared

const { IconLock, IconSmLock, IconPlay } = CoIcons

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  Mini-S — styles del subset hero (extracto del S desktop)       ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const HOLO_S = {
    holoBookWrap: (wVW?: number, hVH = 36) => ({
        width: wVW ? `${wVW}vw` : "min(28vw,420px)",
        minWidth: "160px",
        height: `${hVH}vh`,
        minHeight: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        perspective: "1000px",
        position: "relative",
    }),
    fichaTecnica: (ac: string) => ({
        display: "flex",
        flexWrap: "wrap" as const,
        gap: "16px",
        justifyContent: "center",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hexToRgba(ac, 0.15)}`,
        marginTop: "4px",
        marginBottom: "8px",
        width: "100%",
    }),
    fichaTecnicaItem: () => ({
        fontFamily: "'Inter',sans-serif",
        fontSize: "0.8rem",
        fontWeight: 300,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.06em",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    }),
    fichaTecnicaVal: (ac: string) => ({
        color: hexToRgba(ac, 0.7),
        fontWeight: 400,
    }),
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  HoloEyeIcon — ojo animado con pulso radial                     ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const HoloEyeIcon = ({
    color,
    size = 48,
}: {
    color: string
    size?: number
}) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}88)`,
        }}
        animate={{
            filter: [
                `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}88)`,
                `drop-shadow(0 0 14px ${color}) drop-shadow(0 0 28px ${color}AA)`,
                `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}88)`,
            ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" fill={`${color}33`} />
        <motion.circle
            cx="12"
            cy="12"
            r="5"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            opacity={0.6}
            animate={{ r: [4, 6, 4], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
            d="M5 12a7 7 0 0 1 14 0"
            stroke={color}
            strokeWidth="0.4"
            fill="none"
            opacity={0.4}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
    </motion.svg>
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  FragmentOpenFlare — flash radial al abrir un Códice           ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const FragmentOpenFlare = ({
    flareColor,
    onDone,
}: {
    flareColor: string
    onDone: () => void
}) => (
    <motion.div
        style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            pointerEvents: "none",
            background: `radial-gradient(circle, ${flareColor}44, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 2] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onAnimationComplete={onDone}
    />
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  SunMark / DropMark — íconos hero del autor (interno)           ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const SunMark: React.FC<{ color: string; size?: number }> = ({
    color,
    size = 40,
}) => {
    const ACC = withAccentVar(color)
    const A = (x: number) => alphaMix(ACC, x)
    const rays = Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
            <line
                key={i}
                x1={32 + Math.cos(a) * 15}
                y1={32 + Math.sin(a) * 15}
                x2={32 + Math.cos(a) * 26}
                y2={32 + Math.sin(a) * 26}
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

const DropMark: React.FC<{ color: string; size?: number }> = ({
    color,
    size = 40,
}) => {
    const ACC = withAccentVar(color)
    const A = (x: number) => alphaMix(ACC, x)
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

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DFichaTecnica — chip "Año / Páginas" del escritorio            ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const DFichaTecnica = ({
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
        <div style={HOLO_S.fichaTecnica(accentColor)}>
            {hy && (
                <div style={HOLO_S.fichaTecnicaItem()}>
                    <span>Año:</span>
                    <span style={HOLO_S.fichaTecnicaVal(accentColor)}>
                        {year}
                    </span>
                </div>
            )}
            {hp && (
                <div style={HOLO_S.fichaTecnicaItem()}>
                    <span>Extensión:</span>
                    <span style={HOLO_S.fichaTecnicaVal(accentColor)}>
                        {pageCount} Páginas
                    </span>
                </div>
            )}
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  HoloBookCard — hero book card 3D con shimmer y glints          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const HoloBookCard: React.FC<{
    accent: string
    widthVW: number
    heightVH: number
    titleText: string
    icon: "sun" | "drop"
    shimmerDurationSec: number
    titleSizePx: number
    onSelect: () => void
    hoverDelaySec: number
    guard?: () => boolean
}> = ({
    accent,
    widthVW,
    heightVH,
    titleText,
    icon,
    shimmerDurationSec,
    titleSizePx,
    onSelect,
}) => {
    const glints = useMemo(
        () =>
            Array.from({ length: 10 }).map((_, i) => ({
                id: i,
                x: Math.random() * 88 + 6,
                y: Math.random() * 88 + 6,
                size: Math.random() * 3 + 1.2,
                delay: Math.random() * 3,
                duration: 3 + Math.random() * 3,
            })),
        []
    )
    const ACC = withAccentVar(accent)
    const A = (x: number) => alphaMix(ACC, x)
    const t = 14
    return (
        <motion.div
            role="button"
            aria-label={`${titleText ?? ""}`.replace(/\n/g, " ")}
            style={HOLO_S.holoBookWrap(widthVW, heightVH)}
            onClick={(e) => {
                e.stopPropagation()
                onSelect()
            }}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "-6%",
                    borderRadius: 20,
                    background: `radial-gradient(60% 80% at 50% 50%, ${A(0.18)}, transparent 70%)`,
                    filter: "blur(16px)",
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
            <motion.div
                style={{
                    height: "82%",
                    aspectRatio: "2 / 3",
                    transformStyle: "preserve-3d",
                    position: "relative",
                    borderRadius: 14,
                    boxShadow: `0 18px 40px ${A(0.2)}, 0 0 60px ${A(0.13)}`,
                    overflow: "visible",
                }}
                initial={{ rotateY: 14, rotateX: -2, y: 0 }}
                animate={{
                    rotateY: [14, 16, 14],
                    rotateX: [-2, 2, -2],
                    y: [-4, 3, -4],
                }}
                transition={{
                    duration: 6.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: `-${t}px`,
                        top: "1.5%",
                        bottom: "1.5%",
                        width: `${t}px`,
                        borderRadius: "10px 0 0 10px",
                        background: `linear-gradient(90deg, ${A(0.33)}, ${A(0.6)} 30%, ${A(0.27)} 60%, ${A(0.4)}),repeating-linear-gradient(0deg, ${A(0.13)} 0 3px, ${A(0.07)} 3px 6px)`,
                        boxShadow: `inset -2px 0 6px ${A(0.67)}, inset 2px 0 8px ${A(0.33)}`,
                        transform: `rotateY(-90deg) translateX(${t / 2}px)`,
                        transformOrigin: "right center",
                        backfaceVisibility: "hidden",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: `-${Math.floor(t / 2)}px`,
                        top: "2%",
                        bottom: "2%",
                        width: `${Math.floor(t / 2)}px`,
                        borderRadius: "0 10px 10px 0",
                        background:
                            "repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 2px, rgba(255,255,255,.1) 2px 4px)",
                        opacity: 0.6,
                        transform: `rotateY(90deg) translateX(${Math.floor(t / 4)}px)`,
                        transformOrigin: "left center",
                        backfaceVisibility: "hidden",
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(100% 140% at 50% 15%, ${A(0.17)}, transparent 60%),linear-gradient(135deg, ${A(0.1)}, transparent 40%, ${A(0.18)}, transparent 70%),repeating-linear-gradient(0deg, transparent 0 2px, ${A(0.08)} 2px 3px)`,
                        border: `1px solid ${A(0.53)}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        backfaceVisibility: "hidden",
                        transform: `translateZ(${t / 2}px)`,
                    }}
                    animate={{
                        backgroundPosition: ["0% 0%", "160% 100%", "0% 0%"],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "8%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    >
                        {icon === "sun" ? (
                            <SunMark color={ACC} />
                        ) : (
                            <DropMark color={ACC} />
                        )}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            top: "28%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                            zIndex: 2,
                            textAlign: "center",
                            lineHeight: 1.2,
                            color: ACC,
                            textShadow: `0 0 10px ${A(0.8)}, 0 0 18px ${A(0.4)}`,
                            fontWeight: 600,
                            letterSpacing: ".02em",
                            fontSize: `${titleSizePx}px`,
                            whiteSpace: "nowrap",
                            userSelect: "none",
                        }}
                    >
                        {titleText}
                    </div>
                    <motion.div
                        style={{
                            position: "absolute",
                            top: "-15%",
                            height: "30%",
                            left: "-40%",
                            width: "80%",
                            background: `linear-gradient(115deg, transparent, ${A(0.5)}, transparent)`,
                            filter: "blur(8px)",
                            transform: "rotate(8deg)",
                        }}
                        animate={{ left: ["-40%", "120%"], rotate: [8, 12, 8] }}
                        transition={{
                            duration: Math.max(0.5, shimmerDurationSec),
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 6,
                            borderRadius: 10,
                            border: `1px solid ${A(0.4)}`,
                            boxShadow: `0 0 14px ${A(0.27)} inset, 0 0 24px ${A(0.2)}`,
                            mixBlendMode: "screen",
                            pointerEvents: "none",
                        }}
                        animate={{ opacity: [0.35, 0.9, 0.35] }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        style={{
                            position: "absolute",
                            left: 6,
                            right: 6,
                            height: 2,
                            background: ACC,
                            opacity: 0.22,
                            boxShadow: `0 0 5px ${ACC}`,
                        }}
                        initial={{ top: "-8%" }}
                        animate={{ top: "108%" }}
                        transition={{
                            duration: 4.2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    {glints.map((g) => (
                        <motion.div
                            key={g.id}
                            style={{
                                position: "absolute",
                                left: `${g.x}%`,
                                top: `${g.y}%`,
                                width: `${g.size}px`,
                                height: `${g.size}px`,
                                borderRadius: "50%",
                                background: A(0.9),
                                boxShadow: `0 0 8px ${A(0.8)}, 0 0 14px ${A(0.5)}`,
                                opacity: 0.9,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0.7, 1.4, 0.7],
                            }}
                            transition={{
                                duration: g.duration,
                                repeat: Infinity,
                                delay: g.delay,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  InfiniteMarquee — fila de portadas con momentum                ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const InfiniteMarquee = ({
    books,
    accentColor,
    scrollRef,
    speed = 0.05,
    onBookClick,
    registerBookRef,
    isPaused = false,
}: any) => {
    const sorted = useMemo(() => {
        const z = books.filter((b: any) => b.author.includes("Zak"))
        const a = books.filter((b: any) => !b.author.includes("Zak"))
        return [...z, ...a]
    }, [books])
    const display = useMemo(() => [...sorted, ...sorted], [sorted])
    const bv = -Math.abs(speed)
    const { scrollY } = useScroll({ container: scrollRef })
    const sv = useSpring(scrollY, { stiffness: 400, damping: 90 })
    const vf = useTransform(sv, [0, 1000], [0, 5], { clamp: false })
    const bx = useMotionValue(0)
    const df = useRef<number>(1)
    const userScrolling = useRef(false)
    const userScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useAnimationFrame((_, delta) => {
        if (isPaused || userScrolling.current) return
        let m = df.current * bv * (delta / 16)
        if (vf.get() < 0) df.current = -1
        else if (vf.get() > 0) df.current = 1
        m += df.current * m * vf.get()
        bx.set(bx.get() + m)
    })
    const x = useTransform(bx, (v) => `${wrap(0, -50, v)}%`)
    const marqueeRef = useRef<HTMLDivElement>(null)
    const handleMarqueeWheel = useCallback(
        (e: WheelEvent) => {
            const absX = Math.abs(e.deltaX)
            const absY = Math.abs(e.deltaY)
            if (absX < 4 || absY > absX * 0.5) return
            e.preventDefault()
            e.stopPropagation()
            const clamped = Math.max(-20, Math.min(20, e.deltaX))
            bx.set(bx.get() - clamped * 0.12)
            userScrolling.current = true
            if (userScrollTimer.current) clearTimeout(userScrollTimer.current)
            userScrollTimer.current = setTimeout(() => {
                userScrolling.current = false
            }, 500)
        },
        [bx]
    )
    useEffect(() => {
        const el = marqueeRef.current
        if (!el) return
        el.addEventListener("wheel", handleMarqueeWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", handleMarqueeWheel)
            if (userScrollTimer.current) clearTimeout(userScrollTimer.current)
        }
    }, [handleMarqueeWheel])
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                margin: "10vh 0 15vh 0",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            }}
        >
            <div
                ref={marqueeRef}
                style={{
                    position: "relative",
                    width: "100%",
                    padding: "20px 0",
                    borderTop: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                    borderBottom: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                    background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.05)}, transparent)`,
                    boxShadow: `inset 0 0 20px ${hexToRgba(accentColor, 0.1)}`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "150px",
                        background:
                            "linear-gradient(90deg, rgba(0,0,0,1), transparent)",
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: "150px",
                        background:
                            "linear-gradient(-90deg, rgba(0,0,0,1), transparent)",
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />
                <motion.div
                    style={{
                        display: "flex",
                        gap: "6vw",
                        width: "max-content",
                        x,
                        alignItems: "center",
                    }}
                >
                    {display.map((book: any, i: number) => (
                        <motion.div
                            key={`${book.id}-${i}`}
                            style={{
                                width: "300px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                            }}
                            whileHover={{ scale: 1.1, zIndex: 10 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => onBookClick(book)}
                            ref={(el: any) => {
                                if (el && i < sorted.length)
                                    registerBookRef(book.id, el)
                            }}
                        >
                            <img
                                src={
                                    book.coverUrl ||
                                    makeFallbackDataUrl(
                                        book.title,
                                        book.colorHex
                                    )
                                }
                                alt={book.title}
                                style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                    aspectRatio: "2/3",
                                    pointerEvents: "none",
                                    boxShadow: "0 10px 20px rgba(0,0,0,.5)",
                                }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  HoloActionTile — tile cuadrado de acción (CONSOLA, AMAZON…)    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const HoloActionTile = React.forwardRef(
    (
        {
            icon: Icon,
            label,
            subLabel,
            badge,
            onClick,
            href,
            accentColor,
            textColor,
            colorOverride,
            isDisabled = false,
            sameTab = false,
            onBeforeNavigate,
            onIntercept,
            onKeyDown,
            onFocus,
            onBlur,
            style,
            ...rest
        }: any,
        ref: any
    ) => {
        const ac = colorOverride || accentColor
        const dc = isDisabled ? "#555" : ac
        const runIntercept = (e: any): boolean => {
            if (!onIntercept) return false
            const cancel = onIntercept()
            if (cancel) {
                e.preventDefault()
                return true
            }
            return false
        }
        const handleSameTabNav = (e: any) => {
            if (sameTab && href) {
                e.preventDefault()
                if (runIntercept(e)) return
                if (onBeforeNavigate) onBeforeNavigate()
                window.location.href = href
            }
        }
        const handleNewTabClick = (e: any) => {
            if (runIntercept(e)) return
        }
        const Tag = isDisabled ? "div" : href ? "a" : "button"
        const lp: any = isDisabled
            ? {}
            : href
              ? sameTab
                  ? { href, onClick: handleSameTabNav }
                  : {
                        href,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        onClick: handleNewTabClick,
                    }
              : {
                    onClick: (e: any) => {
                        if (runIntercept(e)) return
                        if (onClick) onClick(e)
                    },
                }
        return (
            <Tag
                ref={ref}
                {...lp}
                {...rest}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={isDisabled ? undefined : onKeyDown}
                className={`holo-tile${isDisabled ? " holo-tile-disabled" : ""}`}
                tabIndex={isDisabled ? -1 : 0}
                style={
                    {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isDisabled ? "4px" : "8px",
                        background: isDisabled
                            ? "linear-gradient(145deg,rgba(30,30,30,.4),rgba(20,20,20,.3))"
                            : `linear-gradient(145deg,${hexToRgba(dc, 0.14)},${hexToRgba(dc, 0.05)})`,
                        border: `1.5px solid ${isDisabled ? "rgba(80,80,80,.3)" : hexToRgba(dc, 0.5)}`,
                        borderRadius: "16px",
                        padding: "14px",
                        cursor: isDisabled ? "default" : "pointer",
                        width: "134px",
                        height: "158px",
                        position: "relative",
                        overflow: "hidden",
                        color: isDisabled ? "rgba(255,255,255,.3)" : textColor,
                        textDecoration: "none",
                        fontSize: "1rem",
                        boxShadow: isDisabled
                            ? "0 4px 16px rgba(0,0,0,.15)"
                            : `0 8px 32px rgba(0,0,0,.2), 0 0 12px ${hexToRgba(dc, 0.12)}, inset 0 0 20px ${hexToRgba(dc, 0.08)}`,
                        backdropFilter: "blur(4px)",
                        outline: "none",
                        opacity: isDisabled ? 0.55 : 1,
                        transform: "scale(1)",
                        ["--tile-glow-hover" as any]: `0 0 24px ${hexToRgba(dc, 0.5)}, 0 0 48px ${hexToRgba(dc, 0.25)}, inset 0 0 12px ${hexToRgba(dc, 0.2)}`,
                        ["--tile-glow-rest" as any]: isDisabled
                            ? "0 4px 16px rgba(0,0,0,.15)"
                            : `0 8px 32px rgba(0,0,0,.2), 0 0 12px ${hexToRgba(dc, 0.12)}, inset 0 0 20px ${hexToRgba(dc, 0.08)}`,
                        ["--tile-border-hover" as any]: hexToRgba(dc, 0.9),
                        ["--tile-border-rest" as any]: isDisabled
                            ? "rgba(80,80,80,.3)"
                            : hexToRgba(dc, 0.5),
                        ["--tile-bg-hover" as any]: `linear-gradient(145deg,${hexToRgba(dc, 0.25)},${hexToRgba(dc, 0.1)})`,
                        ["--tile-bg-rest" as any]: isDisabled
                            ? "linear-gradient(145deg,rgba(30,30,30,.4),rgba(20,20,20,.3))"
                            : `linear-gradient(145deg,${hexToRgba(dc, 0.14)},${hexToRgba(dc, 0.05)})`,
                        ...style,
                    } as React.CSSProperties
                }
            >
                {badge && (
                    <span
                        style={{
                            position: "absolute",
                            top: "6px",
                            right: "50%",
                            transform: "translateX(50%)",
                            fontSize: ".5rem",
                            fontWeight: 600,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "#FFB800",
                            background: "rgba(255,184,0,0.1)",
                            border: "1px solid rgba(255,184,0,0.3)",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            whiteSpace: "nowrap",
                            zIndex: 2,
                        }}
                    >
                        {badge}
                    </span>
                )}
                <div
                    style={{
                        color: dc,
                        opacity: isDisabled ? 0.4 : 1,
                        filter: isDisabled
                            ? "grayscale(1)"
                            : `drop-shadow(0 0 8px ${dc}AA)`,
                        marginBottom: "4px",
                    }}
                >
                    {isDisabled ? <IconLock /> : <Icon />}
                </div>
                <span
                    style={{
                        fontSize: ".75rem",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        opacity: isDisabled ? 0.5 : 0.8,
                        textAlign: "center",
                    }}
                >
                    {isDisabled ? "Próximamente" : label}
                </span>
                {subLabel && (
                    <span
                        style={{
                            fontSize: isDisabled ? ".7rem" : ".85rem",
                            fontWeight: isDisabled ? 400 : 600,
                            color: isDisabled
                                ? "rgba(255,255,255,.25)"
                                : textColor,
                            textAlign: "center",
                            lineHeight: 1.1,
                        }}
                    >
                        {subLabel}
                    </span>
                )}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "1px",
                        background: isDisabled
                            ? "linear-gradient(90deg,transparent,rgba(100,100,100,.3),transparent)"
                            : `linear-gradient(90deg,transparent,${dc}AA,transparent)`,
                    }}
                />
            </Tag>
        )
    }
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  HoloCapsuleButton — pill horizontal de acción                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const HoloCapsuleButton = React.forwardRef(
    (
        {
            icon: Icon,
            label,
            subLabel,
            badge,
            onClick,
            href,
            accentColor,
            textColor,
            colorOverride,
            isDisabled = false,
            sameTab = false,
            onBeforeNavigate,
            onKeyDown,
            onFocus,
            onBlur,
            style,
            ...rest
        }: any,
        ref: any
    ) => {
        const ac = colorOverride || accentColor
        const dc = isDisabled ? "#555" : ac
        const handleSameTabNav = (e: any) => {
            if (sameTab && href) {
                e.preventDefault()
                if (onBeforeNavigate) onBeforeNavigate()
                window.location.href = href
            }
        }
        const Tag = isDisabled ? "div" : href ? "a" : "button"
        const lp: any = isDisabled
            ? {}
            : href
              ? sameTab
                  ? { href, onClick: handleSameTabNav }
                  : { href, target: "_blank", rel: "noopener noreferrer" }
              : { onClick }
        return (
            <Tag
                ref={ref}
                {...lp}
                {...rest}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={isDisabled ? undefined : onKeyDown}
                className={`holo-tile${isDisabled ? " holo-tile-disabled" : ""}`}
                style={
                    {
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "12px",
                        background: isDisabled
                            ? "linear-gradient(145deg,rgba(30,30,30,.35),rgba(20,20,20,.25))"
                            : `linear-gradient(145deg,${hexToRgba(dc, 0.08)},${hexToRgba(dc, 0.02)})`,
                        border: `1px solid ${isDisabled ? "rgba(80,80,80,.25)" : hexToRgba(dc, 0.3)}`,
                        borderRadius: "12px",
                        padding: "10px 20px",
                        cursor: isDisabled ? "default" : "pointer",
                        minWidth: "160px",
                        minHeight: "54px",
                        position: "relative",
                        overflow: "hidden",
                        color: isDisabled ? "rgba(255,255,255,.3)" : textColor,
                        textDecoration: "none",
                        fontSize: ".85rem",
                        boxShadow: isDisabled
                            ? "0 2px 8px rgba(0,0,0,.1)"
                            : `0 4px 16px rgba(0,0,0,.15), inset 0 0 12px ${hexToRgba(dc, 0.04)}`,
                        backdropFilter: "blur(4px)",
                        outline: "none",
                        opacity: isDisabled ? 0.5 : 1,
                        transform: "scale(1)",
                        ["--tile-glow-hover" as any]: `0 0 14px ${hexToRgba(dc, 0.4)}, inset 0 0 6px ${hexToRgba(dc, 0.15)}`,
                        ["--tile-glow-rest" as any]: isDisabled
                            ? "0 2px 8px rgba(0,0,0,.1)"
                            : `0 4px 16px rgba(0,0,0,.15), inset 0 0 12px ${hexToRgba(dc, 0.04)}`,
                        ["--tile-border-hover" as any]: hexToRgba(dc, 0.8),
                        ["--tile-border-rest" as any]: isDisabled
                            ? "rgba(80,80,80,.25)"
                            : hexToRgba(dc, 0.3),
                        ["--tile-bg-hover" as any]: `linear-gradient(145deg,${hexToRgba(dc, 0.18)},${hexToRgba(dc, 0.06)})`,
                        ["--tile-bg-rest" as any]: isDisabled
                            ? "linear-gradient(145deg,rgba(30,30,30,.35),rgba(20,20,20,.25))"
                            : `linear-gradient(145deg,${hexToRgba(dc, 0.08)},${hexToRgba(dc, 0.02)})`,
                        ...style,
                    } as React.CSSProperties
                }
            >
                {badge && (
                    <span
                        style={{
                            position: "absolute",
                            top: "4px",
                            right: "8px",
                            fontSize: ".5rem",
                            fontWeight: 600,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "#FFB800",
                            background: "rgba(255,184,0,0.1)",
                            border: "1px solid rgba(255,184,0,0.3)",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            whiteSpace: "nowrap",
                            zIndex: 2,
                        }}
                    >
                        {badge}
                    </span>
                )}
                <div
                    style={{
                        color: dc,
                        opacity: isDisabled ? 0.4 : 1,
                        filter: isDisabled
                            ? "grayscale(1)"
                            : `drop-shadow(0 0 6px ${dc}88)`,
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    {isDisabled ? <IconSmLock /> : <Icon />}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1px",
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: ".75rem",
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                            opacity: isDisabled ? 0.5 : 0.6,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isDisabled ? "Próximamente" : label}
                    </span>
                    {subLabel && (
                        <span
                            style={{
                                fontSize: "1rem",
                                fontWeight: isDisabled ? 400 : 600,
                                color: isDisabled
                                    ? "rgba(255,255,255,.2)"
                                    : textColor,
                                whiteSpace: "nowrap",
                                lineHeight: 1.1,
                            }}
                        >
                            {subLabel}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "1px",
                        background: isDisabled
                            ? "linear-gradient(90deg,transparent,rgba(100,100,100,.2),transparent)"
                            : `linear-gradient(90deg,transparent,${dc}66,transparent)`,
                    }}
                />
            </Tag>
        )
    }
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  TrailerModal — overlay con video del trailer                   ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const TrailerModal = ({
    videoUrl,
    accentColor,
    textColor,
    title,
    onClose,
}: {
    videoUrl: string
    accentColor: string
    textColor: string
    title: string
    onClose: () => void
}) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    return (
        <motion.div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                zIndex: 100001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "default",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: "80vh",
                    aspectRatio: "9 / 16",
                    maxWidth: "90vw",
                    background: "rgba(5,10,20,.92)",
                    border: `2px solid ${accentColor}`,
                    borderRadius: "20px",
                    boxShadow: `0 0 30px ${hexToRgba(accentColor, 0.4)}, 0 0 60px ${hexToRgba(accentColor, 0.2)}, 0 20px 40px rgba(0,0,0,.7)`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: "10px 14px",
                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                        background: "rgba(0,0,0,.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: accentColor,
                            fontSize: ".8rem",
                            fontFamily: "'Inter',sans-serif",
                            fontWeight: 400,
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            opacity: 0.8,
                        }}
                    >
                        <IconPlay />
                        <span>Trailer</span>
                        <span
                            style={{
                                color: textColor,
                                opacity: 0.5,
                                fontWeight: 300,
                                textTransform: "none",
                                letterSpacing: ".02em",
                            }}
                        >
                            — {title}
                        </span>
                    </div>
                    <motion.button
                        onClick={onClose}
                        style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                            background: "transparent",
                            color: accentColor,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 0 6px ${hexToRgba(accentColor, 0.3)}`,
                        }}
                        whileHover={{
                            scale: 1.1,
                            rotate: 90,
                            background: `${accentColor}22`,
                        }}
                    >
                        &times;
                    </motion.button>
                </div>
                <div
                    style={{
                        flex: 1,
                        background: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderRadius: "0 0 18px 18px",
                    }}
                >
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        autoPlay
                        controls
                        playsInline
                        onEnded={onClose}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            background: "#000",
                        }}
                    />
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        background: `linear-gradient(180deg, transparent, ${accentColor}44, transparent)`,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        background: `linear-gradient(180deg, transparent, ${accentColor}44, transparent)`,
                        pointerEvents: "none",
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DFaqModal — overlay con FAQ acordeón                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const DFaqModal = ({
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
    if (!faqs || faqs.length === 0) return null
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
                zIndex: 99999,
                background: "rgba(0,0,0,.7)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "5vh 5vw",
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "750px",
                    maxHeight: "80vh",
                    background:
                        "linear-gradient(145deg,rgba(8,14,28,.95),rgba(5,10,20,.98))",
                    border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                    borderRadius: "20px",
                    boxShadow: `0 0 40px ${hexToRgba(accentColor, 0.15)}, 0 20px 60px rgba(0,0,0,.6)`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "24px 32px 16px 32px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.15)}`,
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.3rem",
                            fontWeight: 200,
                            margin: 0,
                            background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            filter: `drop-shadow(0 0 8px ${accentColor}44)`,
                        }}
                    >
                        Preguntas Frecuentes
                    </h2>
                    <button
                        className="faq-modal-close"
                        onClick={onClose}
                        style={
                            {
                                position: "absolute",
                                right: "32px",
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                                background: "rgba(255,255,255,.03)",
                                color: hexToRgba(accentColor, 0.5),
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                outline: "none",
                                transform: "rotate(0deg) scale(1)",
                                boxShadow: "none",
                                padding: 0,
                                lineHeight: 1,
                                ["--close-glow" as any]: `0 0 12px ${hexToRgba(accentColor, 0.4)}, 0 0 24px ${hexToRgba(accentColor, 0.15)}`,
                                ["--close-bg-hover" as any]: hexToRgba(
                                    accentColor,
                                    0.12
                                ),
                                ["--bt-color" as any]: accentColor,
                            } as React.CSSProperties
                        }
                    >
                        <svg
                            width="11"
                            height="11"
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
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px 32px 32px 32px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        scrollbarWidth: "thin",
                        scrollbarColor: `${accentColor}44 transparent`,
                    }}
                >
                    {faqs.map((faq, i) => {
                        const isOpen = exp === i
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isOpen
                                        ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.06)}, ${hexToRgba(accentColor, 0.02)})`
                                        : "linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.01) 100%)",
                                    border: `1px solid ${isOpen ? hexToRgba(accentColor, 0.5) : hexToRgba(accentColor, 0.1)}`,
                                    borderRadius: "14px",
                                    cursor: "pointer",
                                    transition:
                                        "border-color .15s ease-out, background .15s ease-out",
                                }}
                                onClick={() => setExp(isOpen ? null : i)}
                            >
                                <div
                                    style={{
                                        padding: "18px 24px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: "1rem",
                                            fontWeight: 400,
                                            color: isOpen ? "#FFF" : textColor,
                                            opacity: isOpen ? 1 : 0.8,
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {faq.q}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "1.3rem",
                                            color: accentColor,
                                            opacity: 0.9,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition:
                                                "transform .2s ease-out",
                                            flexShrink: 0,
                                            marginLeft: "12px",
                                        }}
                                    >
                                        +
                                    </span>
                                </div>
                                <div
                                    className={`faq-answer-grid${isOpen ? " faq-open" : ""}`}
                                >
                                    <div className="faq-answer-inner">
                                        <div
                                            style={{
                                                padding: "4px 24px 28px 24px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                    fontSize: ".95rem",
                                                    lineHeight: 1.7,
                                                    color: textColor,
                                                    opacity: 0.7,
                                                    whiteSpace: "pre-line",
                                                    display: "block",
                                                }}
                                            >
                                                {faq.a}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  CoverWithHoverOverlay — portada con overlay "Abrir Consola"    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const CoverWithHoverOverlay = ({
    src,
    alt,
    accentColor,
    onClick,
    style,
}: {
    src: string
    alt: string
    accentColor: string
    onClick: () => void
    style?: React.CSSProperties
}) => (
    <div className="cover-hover-wrap" onClick={onClick} style={{ ...style }}>
        <img src={src} alt={alt} className="cover-main-img" />
        <div className="cover-overlay">
            <motion.div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                <HoloEyeIcon color={accentColor} size={52} />
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: ".7rem",
                        fontWeight: 400,
                        textTransform: "uppercase",
                        letterSpacing: ".12em",
                        color: accentColor,
                        textShadow: `0 0 8px ${accentColor}88`,
                        opacity: 0.85,
                    }}
                >
                    Abrir Consola
                </span>
            </motion.div>
        </div>
    </div>
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DEFAULT EXPORT — ghost + Object.assign con todos los hero       ║
   ╚══════════════════════════════════════════════════════════════════╝ */

function CoDesktopHoloRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
CoDesktopHoloRoot.displayName = "RSV_Co_DesktopHolo"

const CoDesktopHolo = Object.assign(CoDesktopHoloRoot, {
    HoloEyeIcon,
    FragmentOpenFlare,
    DFichaTecnica,
    HoloBookCard,
    InfiniteMarquee,
    HoloActionTile,
    HoloCapsuleButton,
    TrailerModal,
    DFaqModal,
    CoverWithHoverOverlay,
})

export default CoDesktopHolo
