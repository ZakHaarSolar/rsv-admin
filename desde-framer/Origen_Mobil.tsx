import * as React from "react"
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* ========================= UTILS ========================= */
const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    if (hex.includes("var(") || hex.includes("rgb") || hex.includes("hsl"))
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    if (isNaN(num))
        return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}
const useLockBodyScroll = () => {
    useEffect(() => {
        const o = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = o
        }
    }, [])
}
const nl = (s: string) => (s || "").replace(/\\n/g, "\n")

/* ========================= CSS ========================= */
const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
.or-scroll::-webkit-scrollbar{width:0;background:transparent}
.or-scroll{scrollbar-width:none;-ms-overflow-style:none}
.or-nav-card{transition:transform .12s ease-out,box-shadow .12s ease-out}
.or-nav-card:active{transform:scale(0.96) !important}
.or-cta-btn{transition:transform .12s ease-out,box-shadow .12s ease-out}
.or-cta-btn:active{transform:scale(0.95) !important}
.or-fab{transition:transform .1s ease-out,box-shadow .1s ease-out}
.or-fab:active{transform:scale(0.9)}
@keyframes exploreShimmer{0%{left:-100%}50%{left:140%}100%{left:140%}}
@keyframes consolaOverlayIn{from{opacity:0}to{opacity:1}}
@keyframes consolaSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sf-stars-container{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;perspective:400px}
.sf-star{position:absolute;left:50%;top:50%;border-radius:50%;background:#FFF;box-shadow:0 0 4px 1px rgba(255,255,255,0.8);will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0}
.sf-star.sf-active{animation:sf-flight var(--d) linear var(--dl) infinite}
@keyframes sf-flight{0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}}
`
const INPUT_STYLE: React.CSSProperties = {
    fontSize: "16px",
    fontFamily: "'Inter',sans-serif",
    fontWeight: 300,
    color: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
    WebkitAppearance: "none",
}

/* ========================= STARS ========================= */
const pr = (s: number) => {
    const x = Math.sin(s) * 10000
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
        const ref = useRef<HTMLDivElement>(null)
        const [on, setOn] = useState(false)
        const stars = useMemo(() => {
            const c = Math.floor(num * 1.5),
                a: any[] = []
            for (let i = 0; i < c; i++) {
                const sz =
                    pr(i) > 0.8
                        ? pr(i + 1000) * 2 + 1
                        : pr(i + 1000) * 1.5 + 0.5
                a.push({
                    id: i,
                    sz,
                    tx: `${((pr(i + 2000) - 0.5) * 250).toFixed(0)}vw`,
                    ty: `${((pr(i + 3000) - 0.5) * 250).toFixed(0)}vh`,
                    d: `${((1.5 + pr(i + 4000) * 4) / speed).toFixed(2)}s`,
                    dl: `${(pr(i + 5000) * 5).toFixed(2)}s`,
                })
            }
            return a
        }, [num, speed])
        useEffect(() => {
            let d = false
            const a = () => {
                if (d) return
                d = true
                setOn(true)
            }
            requestAnimationFrame(() => requestAnimationFrame(a))
            const t = setTimeout(a, 250)
            return () => {
                d = true
                clearTimeout(t)
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
                <div className="sf-stars-container" ref={ref}>
                    {stars.map((s) => (
                        <div
                            key={s.id}
                            className={`sf-star${on ? " sf-active" : ""}`}
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

/* ========================= ICONS ========================= */
const IconBook = ({ color, size = 32 }: { color: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
    >
        <path d="M8 8 C8 8 18 6 32 12 C46 6 56 8 56 8 L56 50 C56 50 46 48 32 54 C18 48 8 50 8 50 Z" />
        <line x1="32" y1="12" x2="32" y2="54" />
    </svg>
)
const IconSunRays = ({
    color,
    size = 32,
}: {
    color: string
    size?: number
}) => {
    const rays = Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
            <line
                key={i}
                x1={32 + Math.cos(a) * 15}
                y1={32 + Math.sin(a) * 15}
                x2={32 + Math.cos(a) * 24}
                y2={32 + Math.sin(a) * 24}
                stroke={color}
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
            fill="none"
            style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="32"
                cy="32"
                r="10"
                fill={hexToRgba(color, 0.2)}
                stroke={color}
                strokeWidth="2"
            />
            {rays}
        </motion.svg>
    )
}
const IconClapper = ({
    color,
    size = 32,
}: {
    color: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
    >
        <rect x="8" y="22" width="48" height="34" rx="3" />
        <path d="M8 22 L14 8 L56 8 L56 22 Z" />
        <line x1="22" y1="8" x2="28" y2="22" />
        <line x1="38" y1="8" x2="44" y2="22" />
        <line x1="52" y1="4" x2="54" y2="2" strokeWidth="1.5" opacity="0.7" />
        <line x1="58" y1="10" x2="62" y2="8" strokeWidth="1.5" opacity="0.5" />
    </svg>
)
const IconLotus = ({ color, size = 32 }: { color: string; size?: number }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(color, 0.7)})` }}
        animate={{ y: [-1, 1, -1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
        <path
            d="M32 12 C26 22 22 32 26 42 C28 46 36 46 38 42 C42 32 38 22 32 12 Z"
            fill={hexToRgba(color, 0.15)}
        />
        <path
            d="M20 20 C14 28 10 38 18 44 C22 46 28 44 28 40 C30 34 26 26 20 20 Z"
            fill={hexToRgba(color, 0.08)}
        />
        <path
            d="M44 20 C50 28 54 38 46 44 C42 46 36 44 36 40 C34 34 38 26 44 20 Z"
            fill={hexToRgba(color, 0.08)}
        />
        <path d="M18 48 C24 50 32 52 32 52 C32 52 40 50 46 48" />
    </motion.svg>
)
const IconSpotify = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="28"
        height="28"
        strokeWidth="1.5"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12c2.5-1.5 6.5-1.5 9 0" strokeLinecap="round" />
        <path d="M7 15c3-2 8-2 11 0" strokeLinecap="round" opacity="0.8" />
        <path d="M9 9c2-1 5-1 7 0" strokeLinecap="round" opacity="0.6" />
    </svg>
)
const IconX = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="28"
        height="28"
        strokeWidth="1.5"
        strokeLinejoin="round"
    >
        <path d="M19.9962 4H17.1761L12.5361 9.352L8.49413 4H2.68213L9.62612 13.126L3.05412 20.636H5.87612L10.9641 14.824L15.4081 20.636H21.0821L13.8321 11.048L19.9962 4Z" />
        <path d="M6.5 5.5 L17.5 19" strokeWidth="1.2" strokeLinecap="butt" />
    </svg>
)
const IconInstagram = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="28"
        height="28"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
)
const IconAntenna = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="18"
        height="18"
        strokeWidth="1.5"
        strokeLinecap="round"
    >
        <path d="M12 22V12" />
        <path d="M12 12L8 8" />
        <path d="M12 12L16 8" />
        <path d="M4 10C4 10 7 14 12 14C17 14 20 10 20 10" />
        <circle cx="12" cy="5" r="2" />
    </svg>
)

/* ========================= HIDE BUTTON (reusable) ========================= */
const HideButton = ({
    onClick,
    accentColor,
}: {
    onClick: () => void
    accentColor: string
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    return (
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClick}
            style={{
                padding: "10px 20px",
                borderRadius: "50px",
                border: `1px solid ${A(0.2)}`,
                background: "transparent",
                color: A(0.5),
                fontFamily: "'Inter',sans-serif",
                fontSize: ".7rem",
                fontWeight: 400,
                letterSpacing: ".08em",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s",
                textTransform: "uppercase",
            }}
        >
            OCULTAR
        </motion.button>
    )
}

/* ========================= GRADIENT TITLE (reusable for FIX #5) ========================= */
const GradientTitle = ({
    children,
    accentColor,
    fontSize = "0.85rem",
}: {
    children: React.ReactNode
    accentColor: string
    fontSize?: string
}) => (
    <span
        style={{
            fontFamily: "'Inter',sans-serif",
            fontSize,
            fontWeight: 300,
            margin: 0,
            background: `linear-gradient(180deg, ${accentColor}, #fff)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: ".22em",
            filter: `drop-shadow(0 0 8px ${hexToRgba(accentColor, 0.3)})`,
            whiteSpace: "pre-line",
            textAlign: "center",
            display: "block",
        }}
    >
        {children}
    </span>
)

/* ========================= SECTION LINE ========================= */
const SectionLine = ({ accentColor }: { accentColor: string }) => (
    <div
        style={{
            width: "100%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.5)}, transparent)`,
            opacity: 0.4,
        }}
    />
)

/* Small centered line (like the one above Zak'Haar photo) */
const SmallLine = ({ accentColor }: { accentColor: string }) => (
    <div
        style={{
            width: "60px",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.5)}, transparent)`,
            opacity: 0.4,
        }}
    />
)

/* ========================= AFINACIONES MODAL ========================= */
const AfinacionesModal = ({
    accentColor,
    afinacionesTitle,
    afinacionesText,
    onClose,
    afinacionesWebhookUrl,
}: {
    accentColor: string
    afinacionesTitle: string
    afinacionesText: string
    onClose: () => void
    afinacionesWebhookUrl: string
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    const [msg, setMsg] = useState("")
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")
    const [focused, setFocused] = useState(false)
    const hasMsg = msg.trim().length > 0
    useLockBodyScroll()
    const scrollRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef(0)
    const dragOff = useRef(0)
    const isDrag = useRef(false)
    const wasScroll = useRef(false)
    const [dismissed, setDismissed] = useState(false)
    const lastTY = useRef(0)
    const lastTT = useRef(0)
    const vel = useRef(0)
    const closedRef = useRef(false)
    const applyT = useCallback((o: number) => {
        if (!sheetRef.current || !overlayRef.current) return
        const c = Math.max(0, o)
        const t = c < 200 ? c : 200 + (c - 200) * 0.3
        sheetRef.current.style.transform = `translateY(${t}px)`
        overlayRef.current.style.background = `rgba(0,0,0,${0.7 * (1 - Math.min(t / 400, 1) * 0.6)})`
    }, [])
    const snapB = useCallback(() => {
        if (!sheetRef.current || !overlayRef.current) return
        sheetRef.current.style.transition =
            "transform 0.35s cubic-bezier(0.25,1,0.5,1)"
        sheetRef.current.style.transform = "translateY(0)"
        overlayRef.current.style.transition = "background 0.35s ease"
        overlayRef.current.style.background = "rgba(0,0,0,0.7)"
        isDrag.current = false
        dragOff.current = 0
    }, [])
    const safeClose = useCallback(() => {
        if (closedRef.current) return
        closedRef.current = true
        onClose()
    }, [onClose])
    const dismiss = useCallback(() => {
        if (dismissed || closedRef.current) return
        setDismissed(true)
        isDrag.current = false
        dragOff.current = 0
        const s = sheetRef.current,
            o = overlayRef.current
        if (!s || !o) {
            safeClose()
            return
        }
        const m = new DOMMatrixReadOnly(getComputedStyle(s).transform)
        const cy = m.m42 || 0
        s.style.transition = "none"
        s.style.transform = `translateY(${cy}px)`
        void s.offsetHeight
        s.style.transition = "transform 0.4s cubic-bezier(0.4,0,0.7,1)"
        s.style.transform = "translateY(105vh)"
        o.style.transition = "opacity 0.35s ease"
        o.style.opacity = "0"
        const cl = (e?: TransitionEvent) => {
            if (e && (e.propertyName !== "transform" || e.target !== s)) return
            s.removeEventListener("transitionend", cl)
            safeClose()
        }
        s.addEventListener("transitionend", cl)
        setTimeout(safeClose, 500)
    }, [dismissed, safeClose])
    const hTS = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0]
            touchStartY.current = t.clientY
            lastTY.current = t.clientY
            lastTT.current = Date.now()
            vel.current = 0
            wasScroll.current = false
            if (sheetRef.current) sheetRef.current.style.transition = "none"
            if (overlayRef.current) overlayRef.current.style.transition = "none"
        },
        [dismissed]
    )
    const hTM = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0],
                sc = scrollRef.current
            if (!sc) return
            const d = t.clientY - touchStartY.current,
                at = sc.scrollTop <= 1,
                now = Date.now(),
                dt = now - lastTT.current
            if (dt > 0) vel.current = ((t.clientY - lastTY.current) / dt) * 1000
            lastTY.current = t.clientY
            lastTT.current = now
            if (!isDrag.current && !at) {
                wasScroll.current = true
                return
            }
            if (at && d > 0) {
                if (wasScroll.current && !isDrag.current) {
                    touchStartY.current = t.clientY
                    wasScroll.current = false
                    return
                }
                isDrag.current = true
                dragOff.current = d
                e.preventDefault()
                applyT(d)
            } else if (isDrag.current && d <= 0) {
                isDrag.current = false
                dragOff.current = 0
                snapB()
            }
        },
        [dismissed, applyT, snapB]
    )
    const hTE = useCallback(() => {
        if (dismissed || !isDrag.current) return
        if (dragOff.current > 140 || vel.current > 800) dismiss()
        else snapB()
    }, [dismissed, dismiss, snapB])
    useEffect(() => {
        const s = sheetRef.current
        if (!s) return
        const o: AddEventListenerOptions = { passive: false }
        s.addEventListener("touchstart", hTS, o)
        s.addEventListener("touchmove", hTM, o)
        s.addEventListener("touchend", hTE)
        s.addEventListener("touchcancel", hTE)
        return () => {
            s.removeEventListener("touchstart", hTS)
            s.removeEventListener("touchmove", hTM)
            s.removeEventListener("touchend", hTE)
            s.removeEventListener("touchcancel", hTE)
        }
    }, [hTS, hTM, hTE])
    useEffect(() => {
        const s = sheetRef.current,
            o = overlayRef.current
        if (!s || !o) return
        const a = (e: AnimationEvent) => {
            if (e.animationName === "consolaSheetIn") {
                s.style.animation = "none"
                s.style.transform = "translateY(0)"
            }
        }
        const b = (e: AnimationEvent) => {
            if (e.animationName === "consolaOverlayIn") {
                o.style.animation = "none"
                o.style.opacity = "1"
            }
        }
        s.addEventListener("animationend", a)
        o.addEventListener("animationend", b)
        return () => {
            s.removeEventListener("animationend", a)
            o.removeEventListener("animationend", b)
        }
    }, [])
    const submit = async () => {
        if (!msg.trim() || !afinacionesWebhookUrl) {
            if (!afinacionesWebhookUrl) setStatus("error")
            return
        }
        setStatus("loading")
        try {
            const r = await fetch(afinacionesWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: msg,
                    source: "redsolarviva_afinaciones",
                }),
            })
            if (r.ok) {
                setStatus("success")
                setMsg("")
            } else setStatus("error")
        } catch {
            setStatus("error")
        }
    }

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
                    maxHeight: "88vh",
                    background:
                        "linear-gradient(180deg,rgba(8,14,28,.98),rgba(5,10,20,.99))",
                    borderRadius: "22px 22px 0 0",
                    border: `1px solid ${A(0.2)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    willChange: "transform",
                    animation:
                        "consolaSheetIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: "20px 20px 14px 20px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
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
                            fontSize: "1rem",
                            fontWeight: 500,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".18em",
                            opacity: 0.9,
                            textShadow: `0 0 10px ${A(0.3)}`,
                        }}
                    >
                        {afinacionesTitle}
                    </span>
                    <button
                        onClick={dismiss}
                        style={{
                            position: "absolute",
                            right: "20px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${A(0.2)}`,
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
                    ref={scrollRef}
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                        padding: "10px 24px 30px 24px",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 300,
                            color: "#fff",
                            opacity: 0.65,
                            textAlign: "center",
                            lineHeight: 1.7,
                            margin: 0,
                            whiteSpace: "pre-line",
                            width: "100%",
                        }}
                    >
                        {afinacionesText}
                    </p>
                    <div
                        style={{
                            width: "50px",
                            height: "1px",
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                            opacity: 0.3,
                            flexShrink: 0,
                        }}
                    />
                    <textarea
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        disabled={status === "loading" || status === "success"}
                        style={{
                            ...INPUT_STYLE,
                            width: "100%",
                            minHeight: "130px",
                            padding: "16px",
                            borderRadius: "16px",
                            border: `1px solid ${focused ? A(0.6) : A(0.15)}`,
                            background: "rgba(5,10,20,0.6)",
                            lineHeight: 1.6,
                            resize: "vertical",
                            transition: "border-color 0.3s, box-shadow 0.3s",
                            boxShadow: focused ? `0 0 20px ${A(0.25)}` : "none",
                        }}
                    />
                    <button
                        onClick={submit}
                        disabled={
                            status === "loading" ||
                            status === "success" ||
                            !hasMsg
                        }
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "14px",
                            border: `1px solid ${status === "success" ? "rgba(100,255,150,0.4)" : hasMsg ? A(0.5) : A(0.12)}`,
                            background:
                                status === "success"
                                    ? "rgba(100,255,150,0.08)"
                                    : hasMsg
                                      ? `linear-gradient(135deg,${A(0.1)},transparent)`
                                      : "transparent",
                            color:
                                status === "success"
                                    ? "rgba(100,255,150,0.9)"
                                    : hasMsg
                                      ? accentColor
                                      : A(0.3),
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            cursor:
                                !hasMsg ||
                                status === "loading" ||
                                status === "success"
                                    ? "default"
                                    : "pointer",
                            outline: "none",
                            opacity: status === "loading" ? 0.5 : 1,
                            transition: "all 0.3s",
                            boxShadow:
                                hasMsg && status === "idle"
                                    ? `0 0 15px ${A(0.15)}`
                                    : "none",
                        }}
                    >
                        {status === "loading"
                            ? "..."
                            : status === "success"
                              ? "✓ ENVIADO"
                              : "ENVIAR"}
                    </button>
                    {status === "success" && (
                        <p
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.82rem",
                                color: accentColor,
                                textAlign: "center",
                                margin: 0,
                            }}
                        >
                            Señal recibida. Gracias por co-crear.
                        </p>
                    )}
                    {status === "error" && (
                        <p
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.82rem",
                                color: "#ff4d4d",
                                textAlign: "center",
                                margin: 0,
                            }}
                        >
                            Error en la señal. Intenta de nuevo.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ========================= NAV CARD ========================= */
const NavCard = ({
    label,
    icon,
    href,
    accentColor,
    delay = 0,
}: {
    label: string
    icon: React.ReactNode
    href?: string
    accentColor: string
    delay?: number
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    const inner = (
        <motion.div
            className="or-nav-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: "120px",
                borderRadius: "18px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${A(0.4)}`,
                background: `linear-gradient(135deg,${A(0.1)},${A(0.04)},${A(0.08)})`,
                boxShadow: `0 12px 30px ${A(0.15)}, inset 0 0 30px ${A(0.08)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
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
                    background: `linear-gradient(115deg,transparent,${A(0.4)},transparent)`,
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
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                {icon}
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: accentColor,
                        textShadow: `0 0 10px ${A(0.6)}, 0 0 20px ${A(0.3)}`,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        textAlign: "center",
                        lineHeight: 1.3,
                        whiteSpace: "pre-line",
                    }}
                >
                    {label}
                </span>
            </div>
        </motion.div>
    )
    if (href)
        return (
            <a
                href={href}
                target="_self"
                style={{
                    textDecoration: "none",
                    flex: "1 1 calc(50% - 8px)",
                    minWidth: 0,
                }}
            >
                {inner}
            </a>
        )
    return (
        <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: 0 }}>{inner}</div>
    )
}

/* ========================= GOLDEN BUTTON ========================= */
const GoldenButton = ({
    text,
    href,
    onClick,
    delay = 0,
}: {
    text: string
    href?: string
    onClick?: () => void
    delay?: number
}) => {
    const g = "#D4A843",
        A = (x: number) => hexToRgba(g, x)
    const Tag: any = href ? "a" : "button"
    const lp: any = href ? { href, target: "_self" } : { onClick }
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
        >
            <Tag
                {...lp}
                className="or-cta-btn"
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "16px 36px",
                    borderRadius: "16px",
                    border: `1px solid ${A(0.6)}`,
                    background: `linear-gradient(135deg,${A(0.15)},transparent,${A(0.1)})`,
                    color: g,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: ".8rem",
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    outline: "none",
                    textDecoration: "none",
                    boxShadow: `0 0 20px ${A(0.2)}, 0 0 40px ${A(0.08)}, inset 0 1px 0 ${A(0.25)}`,
                    transform: "scale(1)",
                    overflow: "hidden",
                    backdropFilter: "blur(4px)",
                }}
            >
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
                            background: `linear-gradient(90deg,transparent,${A(0.25)},transparent)`,
                            animation:
                                "exploreShimmer 3.5s ease-in-out infinite",
                        }}
                    />
                </div>
                <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
            </Tag>
        </motion.div>
    )
}

/* ========================= READ MORE BUTTON ========================= */
const ReadMoreButton = ({
    onClick,
    accentColor,
}: {
    onClick: () => void
    accentColor: string
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    return (
        <button
            onClick={onClick}
            className="or-cta-btn"
            style={{
                marginTop: "24px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "50px",
                border: `1px solid ${A(0.25)}`,
                background: "transparent",
                color: A(0.6),
                fontFamily: "'Inter',sans-serif",
                fontSize: ".72rem",
                fontWeight: 500,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s",
            }}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            LEER MÁS
        </button>
    )
}

/* ========================= MAIN ========================= */
export default function OrigenMobile(props: any) {
    const {
        bgColor = "#0B0C13",
        accentColor: accentProp,
        numStars = 40,
        warpSpeed = 1,
        logo,
        heroSubtitle = "TEMPLO SOLAR 5D",
        heroTagline = "Biblioteca de la Nueva Tierra",
        ctaText = "EXPLORAR CÓDICES",
        ctaUrl = "",
        showCodex = true,
        codexUrl = "",
        showSesiones = true,
        sesionesUrl = "",
        showFragmentos = true,
        fragmentosUrl = "",
        showMeditaciones = true,
        meditacionesUrl = "",
        manifestoShort = "La vieja estructura se disuelve.\nPara navegar el colapso y construir lo nuevo, no necesitas suerte; necesitas Instrucción.",
        manifestoLong = "Hemos abierto los Códices de Luz: la biblioteca con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.\n\nRed Solar Viva no es solo información. Es un campo vivo de activación.",
        guiaImage,
        guiaNombre = "Zak'Haar Solar",
        guiaDescShort = "Guía de la Cámara Solar y portador de los Códices de Luz.",
        guiaDescLong = "Zak'Haar canaliza instrucción directa desde el campo solar. Su trabajo integra biología, frecuencia y memoria estelar para devolverte al centro de tu diseño original.",
        guiaCtaText = "Conocer al Guía",
        nodoTitle = "ÚNETE AL NODO CENTRAL",
        nodoSubtitle = "Recibe las transmisiones de Red Solar Viva, avisos de nuevos lanzamientos y actualizaciones significativas.",
        webhookUrl = "",
        spotifyUrl = "",
        twitterUrl = "",
        instagramUrl = "",
        organismoText = "Red Solar Viva es un organismo vivo que evoluciona contigo:",
        ajusteButtonText = "ENVIAR SEÑAL DE AJUSTE",
        afinacionesTitle = "AFINACIONES",
        afinacionesText = "¿Hay algo que te gustaría que agregáramos o afináramos aquí? Tu mirada es parte del pulso solar.\n\nSi sientes una idea, una mejora o una nueva función que podría expandir el campo de Red Solar Viva, compártela: cada sugerencia ayuda a que Red Solar Viva siga evolucionando como un espacio vivo de co-creación.\n\nEscribe tu propuesta aquí abajo y la meditaremos.\n\n¡Gracias por co-crear este espacio solar!",
        afinacionesWebhookUrl = "",
    } = props

    const [accentColor, setAccentColor] = useState(accentProp || "#00C2FF")
    const [showAfin, setShowAfin] = useState(false)
    const [email, setEmail] = useState("")
    const [emailStatus, setEmailStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")
    const [emailFocused, setEmailFocused] = useState(false)
    const [emailError, setEmailError] = useState("")
    const hasEmail = email.trim().length > 0
    const [guiaExpanded, setGuiaExpanded] = useState(false)
    const [manifExpanded, setManifExpanded] = useState(false)
    const [showFab, setShowFab] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    const A = (x: number) => hexToRgba(accentColor, x)

    useEffect(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const fn = () => setShowFab(el.scrollTop > window.innerHeight * 0.5)
        el.addEventListener("scroll", fn, { passive: true })
        return () => el.removeEventListener("scroll", fn)
    }, [])

    const navCards = useMemo(
        () =>
            [
                {
                    label: "Códices",
                    icon: <IconBook color={accentColor} size={30} />,
                    href: codexUrl,
                    show: showCodex,
                },
                {
                    label: "Sesiones",
                    icon: <IconSunRays color={accentColor} size={30} />,
                    href: sesionesUrl,
                    show: showSesiones,
                },
                {
                    label: "Fragmentos\ndel Sol",
                    icon: <IconClapper color={accentColor} size={30} />,
                    href: fragmentosUrl,
                    show: showFragmentos,
                },
                {
                    label: "Meditaciones",
                    icon: <IconLotus color={accentColor} size={30} />,
                    href: meditacionesUrl,
                    show: showMeditaciones,
                },
            ].filter((c) => c.show),
        [
            accentColor,
            showCodex,
            showSesiones,
            showFragmentos,
            showMeditaciones,
            codexUrl,
            sesionesUrl,
            fragmentosUrl,
            meditacionesUrl,
        ]
    )
    /* If only 1 row of cards (≤2), push everything down to center on screen */
    const fewCards = navCards.length <= 2

    const handleEmailSubmit = async () => {
        setEmailError("")
        if (!email.trim()) return
        if (!email.includes("@")) {
            setEmailError("Incluye un '@' en la dirección de email.")
            return
        }
        if (!webhookUrl) {
            setEmailStatus("error")
            return
        }
        setEmailStatus("loading")
        try {
            const r = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "redsolarviva_landing" }),
            })
            if (r.ok) {
                setEmailStatus("success")
                setEmail("")
            } else setEmailStatus("error")
        } catch {
            setEmailStatus("error")
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                background: bgColor,
                fontFamily: "'Inter',sans-serif",
                color: "#FFFFFF",
            }}
        >
            <style>{MOBILE_CSS}</style>
            <StarsBackground
                num={numStars}
                speed={warpSpeed}
                bgColor={bgColor}
            />

            <AnimatePresence>
                {showAfin && (
                    <AfinacionesModal
                        accentColor={accentColor}
                        afinacionesTitle={afinacionesTitle}
                        afinacionesText={nl(afinacionesText)}
                        onClose={() => setShowAfin(false)}
                        afinacionesWebhookUrl={afinacionesWebhookUrl}
                    />
                )}
            </AnimatePresence>

            {/* Scroll-to-top FAB */}
            <AnimatePresence>
                {showFab && !showAfin && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="or-fab"
                        onClick={() =>
                            scrollContainerRef.current?.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        style={{
                            position: "fixed",
                            bottom: 40,
                            right: 0,
                            zIndex: 99997,
                            width: 44,
                            height: 44,
                            borderRadius: "14px 0 0 14px",
                            borderTop: `1px solid ${A(0.1)}`,
                            borderBottom: `1px solid ${A(0.1)}`,
                            borderLeft: `1px solid ${A(0.1)}`,
                            borderRight: `2px solid ${A(0.5)}`,
                            background: "rgba(8,12,20,0.95)",
                            backdropFilter: "blur(12px)",
                            color: A(0.65),
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            boxShadow: `-4px 0 15px ${A(0.05)}`,
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
                    </motion.button>
                )}
            </AnimatePresence>

            <div
                ref={scrollContainerRef}
                className="or-scroll"
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
                {/* ======= HERO (fewCards = extra top padding to center vertically) ======= */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    style={{
                        textAlign: "center",
                        paddingTop: fewCards ? "70px" : "40px",
                        paddingBottom: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    {logo && (
                        <motion.img
                            src={logo}
                            alt="RSV"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            style={{
                                height: "70px",
                                objectFit: "contain",
                                maxWidth: "80vw",
                                filter: `drop-shadow(0 0 20px ${A(0.3)})`,
                            }}
                        />
                    )}
                    <h1
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.6rem",
                            fontWeight: 100,
                            margin: 0,
                            background: `linear-gradient(180deg,${accentColor},#fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: ".22em",
                            filter: `drop-shadow(0 0 12px ${A(0.4)})`,
                        }}
                    >
                        RED SOLAR VIVA
                    </h1>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 300,
                            margin: 0,
                            background: `linear-gradient(180deg,${accentColor},#fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "uppercase",
                            letterSpacing: ".28em",
                            filter: `drop-shadow(0 0 8px ${A(0.3)})`,
                        }}
                    >
                        {heroSubtitle}
                    </p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 300,
                            color: "#FFFFFF",
                            margin: "6px 0 0 0",
                            letterSpacing: ".12em",
                            padding: "0 30px",
                            lineHeight: 1.6,
                            whiteSpace: "pre-line",
                        }}
                    >
                        {nl(heroTagline)}
                    </motion.p>
                    {ctaText && (
                        <div style={{ marginTop: "6px" }}>
                            <GoldenButton
                                text={ctaText}
                                href={ctaUrl || undefined}
                                delay={0.8}
                            />
                        </div>
                    )}
                </motion.div>

                {/* ======= NAV CARDS (OFF = hidden, ≤2 cards = extra bottom space to center) ======= */}
                {navCards.length > 0 && (
                    <div
                        style={{
                            padding: `30px 20px ${fewCards ? "80px" : "16px"} 20px`,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "14px",
                            justifyContent: "center",
                            maxWidth: "440px",
                            margin: "0 auto",
                        }}
                    >
                        {navCards.map((c, i) => (
                            <NavCard
                                key={c.label}
                                label={c.label}
                                icon={c.icon}
                                href={c.href || undefined}
                                accentColor={accentColor}
                                delay={0.3 + i * 0.15}
                            />
                        ))}
                    </div>
                )}

                {/* ======= MANIFIESTO (expandable + FIX #1: ocultar) ======= */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-5%" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        padding: "60px 28px 50px 28px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "50px",
                            height: "1px",
                            background: `linear-gradient(90deg,transparent,${accentColor},transparent)`,
                            opacity: 0.3,
                            marginBottom: "30px",
                        }}
                    />
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.15rem",
                            fontWeight: 200,
                            color: "#fff",
                            textAlign: "center",
                            lineHeight: 1.55,
                            margin: 0,
                            maxWidth: "380px",
                            whiteSpace: "pre-line",
                        }}
                    >
                        {nl(manifestoShort)}
                    </p>
                    <AnimatePresence>
                        {manifExpanded && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: "1.15rem",
                                    fontWeight: 200,
                                    color: "#fff",
                                    textAlign: "center",
                                    lineHeight: 1.55,
                                    margin: 0,
                                    maxWidth: "380px",
                                    whiteSpace: "pre-line",
                                    overflow: "hidden",
                                    marginTop: "16px",
                                }}
                            >
                                {nl(manifestoLong)}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {!manifExpanded ? (
                        <ReadMoreButton
                            onClick={() => setManifExpanded(true)}
                            accentColor={accentColor}
                        />
                    ) : (
                        <div style={{ marginTop: "20px" }}>
                            <HideButton
                                onClick={() => setManifExpanded(false)}
                                accentColor={accentColor}
                            />
                        </div>
                    )}
                </motion.div>

                {/* ======= GUÍA (expandable) ======= */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{
                        padding: "70px 24px 80px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            width: "60px",
                            height: "1px",
                            background: `linear-gradient(90deg,transparent,${accentColor},transparent)`,
                            opacity: 0.4,
                            marginBottom: "10px",
                        }}
                    />
                    {guiaImage && (
                        <div
                            style={{
                                width: "160px",
                                height: "160px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: `2px solid ${A(0.4)}`,
                                boxShadow: `0 0 30px ${A(0.2)}, 0 0 60px ${A(0.08)}`,
                            }}
                        >
                            <img
                                src={guiaImage}
                                alt={guiaNombre}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    )}
                    {/* FIX #5: Gradient title style */}
                    <GradientTitle accentColor={accentColor} fontSize="1.1rem">
                        {guiaNombre}
                    </GradientTitle>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.88rem",
                            fontWeight: 300,
                            color: "#FFFFFF",
                            opacity: 0.6,
                            margin: 0,
                            textAlign: "center",
                            lineHeight: 1.7,
                            maxWidth: "340px",
                        }}
                    >
                        {guiaDescShort}
                    </p>
                    <AnimatePresence>
                        {guiaExpanded && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: "0.88rem",
                                    fontWeight: 300,
                                    color: "#FFFFFF",
                                    opacity: 0.6,
                                    margin: 0,
                                    textAlign: "center",
                                    lineHeight: 1.7,
                                    maxWidth: "340px",
                                    overflow: "hidden",
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {nl(guiaDescLong)}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {!guiaExpanded ? (
                        <GoldenButton
                            text={guiaCtaText}
                            onClick={() => setGuiaExpanded(true)}
                            delay={0}
                        />
                    ) : (
                        <HideButton
                            onClick={() => setGuiaExpanded(false)}
                            accentColor={accentColor}
                        />
                    )}
                </motion.div>

                {/* ======= NODO CENTRAL BLOCK (email + socials) — FIX #2: more top spacing ======= */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-5%" }}
                    transition={{ duration: 0.8 }}
                    style={{
                        padding: "110px 24px 30px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "22px",
                    }}
                >
                    <SectionLine accentColor={accentColor} />
                    {/* FIX #5: Gradient title + FIX #4: accepts case/newlines */}
                    <GradientTitle accentColor={accentColor} fontSize="0.95rem">
                        {nl(nodoTitle)}
                    </GradientTitle>
                    {/* FIX #2: white non-opaque paragraph */}
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.88rem",
                            fontWeight: 300,
                            color: "#FFFFFF",
                            opacity: 0.6,
                            margin: 0,
                            textAlign: "center",
                            lineHeight: 1.7,
                            maxWidth: "340px",
                        }}
                    >
                        {nodoSubtitle}
                    </p>
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "360px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.75rem",
                                fontWeight: 300,
                                color: "#FFFFFF",
                                opacity: 0.45,
                                letterSpacing: ".05em",
                            }}
                        >
                            Ingresa tu email aquí:
                        </span>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "stretch",
                            }}
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setEmailError("")
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleEmailSubmit()
                                    }
                                }}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                disabled={
                                    emailStatus === "loading" ||
                                    emailStatus === "success"
                                }
                                style={{
                                    ...INPUT_STYLE,
                                    flex: 1,
                                    padding: "14px 18px",
                                    borderRadius: "14px",
                                    border: `1px solid ${emailFocused ? A(0.6) : A(0.15)}`,
                                    background: "rgba(5,10,20,0.5)",
                                    letterSpacing: ".04em",
                                    transition:
                                        "border-color 0.3s, box-shadow 0.3s",
                                    boxShadow: emailFocused
                                        ? `0 0 15px ${A(0.2)}`
                                        : "none",
                                }}
                            />
                            <button
                                onClick={handleEmailSubmit}
                                disabled={
                                    emailStatus === "loading" ||
                                    emailStatus === "success" ||
                                    !hasEmail
                                }
                                style={{
                                    padding: "14px 20px",
                                    borderRadius: "14px",
                                    border: `1px solid ${emailStatus === "success" ? "rgba(100,255,150,0.4)" : hasEmail ? A(0.5) : A(0.12)}`,
                                    background:
                                        emailStatus === "success"
                                            ? "rgba(100,255,150,0.08)"
                                            : hasEmail
                                              ? `linear-gradient(135deg,${A(0.1)},transparent)`
                                              : "transparent",
                                    color:
                                        emailStatus === "success"
                                            ? "rgba(100,255,150,0.9)"
                                            : hasEmail
                                              ? accentColor
                                              : A(0.3),
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: ".78rem",
                                    fontWeight: 600,
                                    letterSpacing: ".08em",
                                    textTransform: "uppercase",
                                    cursor:
                                        !hasEmail ||
                                        emailStatus === "loading" ||
                                        emailStatus === "success"
                                            ? "default"
                                            : "pointer",
                                    outline: "none",
                                    whiteSpace: "nowrap",
                                    opacity:
                                        emailStatus === "loading" ? 0.5 : 1,
                                    transition: "all 0.3s",
                                    boxShadow:
                                        hasEmail && emailStatus === "idle"
                                            ? `0 0 12px ${A(0.15)}`
                                            : "none",
                                }}
                            >
                                {emailStatus === "loading"
                                    ? "..."
                                    : emailStatus === "success"
                                      ? "✓"
                                      : "CONECTAR"}
                            </button>
                        </div>
                    </div>
                    {emailError && (
                        <p
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.78rem",
                                color: "#ffaa33",
                                textAlign: "center",
                                margin: "-8px 0 0 0",
                            }}
                        >
                            {emailError}
                        </p>
                    )}
                    {emailStatus === "success" && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.82rem",
                                color: accentColor,
                                textAlign: "center",
                                margin: 0,
                            }}
                        >
                            Enlace establecido. Bienvenido a Red Solar Viva.
                        </motion.p>
                    )}
                    {emailStatus === "error" && (
                        <p
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "0.82rem",
                                color: "#ff4d4d",
                                textAlign: "center",
                                margin: 0,
                            }}
                        >
                            Error en la señal. Intenta de nuevo.
                        </p>
                    )}

                    <SectionLine accentColor={accentColor} />
                    <div
                        style={{
                            display: "flex",
                            gap: "40px",
                            alignItems: "center",
                        }}
                    >
                        {spotifyUrl && (
                            <a
                                href={spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: "rgba(255,255,255,0.4)",
                                    display: "flex",
                                    transition: "color .3s",
                                }}
                            >
                                <IconSpotify />
                            </a>
                        )}
                        {twitterUrl && (
                            <a
                                href={twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: "rgba(255,255,255,0.4)",
                                    display: "flex",
                                    transition: "color .3s",
                                }}
                            >
                                <IconX />
                            </a>
                        )}
                        {instagramUrl && (
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: "rgba(255,255,255,0.4)",
                                    display: "flex",
                                    transition: "color .3s",
                                }}
                            >
                                <IconInstagram />
                            </a>
                        )}
                    </div>
                    {/* FIX #3: line below socials to close the block */}
                    <SectionLine accentColor={accentColor} />
                </motion.div>

                {/* ======= SEÑAL DE AJUSTE BLOCK (small lines, more separated) ======= */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-5%" }}
                    transition={{ duration: 0.8 }}
                    style={{
                        padding: "100px 24px 24px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <SmallLine accentColor={accentColor} />
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 300,
                            color: "#FFFFFF",
                            opacity: 0.35,
                            margin: 0,
                            textAlign: "center",
                            lineHeight: 1.6,
                            maxWidth: "300px",
                            letterSpacing: ".03em",
                            marginTop: "10px",
                        }}
                    >
                        {organismoText}
                    </p>
                    <button
                        onClick={() => setShowAfin(true)}
                        className="or-cta-btn"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "14px 28px",
                            borderRadius: "50px",
                            border: `1px solid ${A(0.3)}`,
                            background: "rgba(0,0,0,0.3)",
                            color: accentColor,
                            fontFamily: "'Inter',sans-serif",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            outline: "none",
                            transition: "all 0.3s",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <IconAntenna />
                        {ajusteButtonText}
                    </button>
                    <SmallLine accentColor={accentColor} />
                </motion.div>
            </div>
        </div>
    )
}

/* ========================= PROPERTY CONTROLS ========================= */
addPropertyControls(OrigenMobile, {
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    accentColor: { type: ControlType.Color, title: "Acento Cian" },
    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 40,
        min: 10,
        max: 150,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1,
        step: 0.1,
        min: 0.1,
        max: 5,
    },

    logo: { type: ControlType.Image, title: "Logo" },
    heroSubtitle: {
        type: ControlType.String,
        title: "Subtítulo (bajo título)",
        defaultValue: "TEMPLO SOLAR 5D",
    },
    heroTagline: {
        type: ControlType.String,
        title: "Tagline Hero",
        defaultValue: "Biblioteca de la Nueva Tierra",
        displayTextArea: true,
    },
    ctaText: {
        type: ControlType.String,
        title: "Texto CTA Hero",
        defaultValue: "EXPLORAR CÓDICES",
    },
    ctaUrl: {
        type: ControlType.String,
        title: "URL CTA Hero",
        defaultValue: "",
    },

    showCodex: {
        type: ControlType.Boolean,
        title: "Códices activo",
        defaultValue: true,
    },
    codexUrl: {
        type: ControlType.String,
        title: "URL Códices",
        defaultValue: "",
        hidden: (p: any) => !p.showCodex,
    },
    showSesiones: {
        type: ControlType.Boolean,
        title: "Sesiones activo",
        defaultValue: true,
    },
    sesionesUrl: {
        type: ControlType.String,
        title: "URL Sesiones",
        defaultValue: "",
        hidden: (p: any) => !p.showSesiones,
    },
    showFragmentos: {
        type: ControlType.Boolean,
        title: "Fragmentos activo",
        defaultValue: true,
    },
    fragmentosUrl: {
        type: ControlType.String,
        title: "URL Fragmentos",
        defaultValue: "",
        hidden: (p: any) => !p.showFragmentos,
    },
    showMeditaciones: {
        type: ControlType.Boolean,
        title: "Meditaciones activo",
        defaultValue: true,
    },
    meditacionesUrl: {
        type: ControlType.String,
        title: "URL Meditaciones",
        defaultValue: "",
        hidden: (p: any) => !p.showMeditaciones,
    },

    manifestoShort: {
        type: ControlType.String,
        title: "📜 Manifiesto (corto)",
        defaultValue:
            "La vieja estructura se disuelve.\\nPara navegar el colapso y construir lo nuevo, no necesitas suerte; necesitas Instrucción.",
        displayTextArea: true,
    },
    manifestoLong: {
        type: ControlType.String,
        title: "📜 Manifiesto (extendido)",
        defaultValue:
            "Hemos abierto los Códices de Luz: la biblioteca con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.\\n\\nRed Solar Viva no es solo información. Es un campo vivo de activación.",
        displayTextArea: true,
    },

    guiaImage: { type: ControlType.Image, title: "👤 Foto Guía" },
    guiaNombre: {
        type: ControlType.String,
        title: "👤 Nombre Guía",
        defaultValue: "Zak'Haar Solar",
    },
    guiaDescShort: {
        type: ControlType.String,
        title: "👤 Descripción corta",
        defaultValue:
            "Guía de la Cámara Solar y portador de los Códices de Luz.",
        displayTextArea: true,
    },
    guiaDescLong: {
        type: ControlType.String,
        title: "👤 Descripción extendida",
        defaultValue:
            "Zak'Haar canaliza instrucción directa desde el campo solar. Su trabajo integra biología, frecuencia y memoria estelar para devolverte al centro de tu diseño original.",
        displayTextArea: true,
    },
    guiaCtaText: {
        type: ControlType.String,
        title: "👤 Texto Botón Guía",
        defaultValue: "Conocer al Guía",
    },

    nodoTitle: {
        type: ControlType.String,
        title: "Título Nodo",
        defaultValue: "ÚNETE AL NODO CENTRAL",
        displayTextArea: true,
    },
    nodoSubtitle: {
        type: ControlType.String,
        title: "Subtítulo Nodo",
        defaultValue:
            "Recibe las transmisiones de Red Solar Viva, avisos de nuevos lanzamientos y actualizaciones significativas.",
        displayTextArea: true,
    },
    webhookUrl: {
        type: ControlType.String,
        title: "⚡ Webhook Email URL",
        defaultValue: "",
        description: "Pipedream/Zapier para emails.",
    },

    spotifyUrl: {
        type: ControlType.String,
        title: "🎵 Spotify URL",
        defaultValue: "",
    },
    twitterUrl: {
        type: ControlType.String,
        title: "𝕏 X (Twitter) URL",
        defaultValue: "",
    },
    instagramUrl: {
        type: ControlType.String,
        title: "📷 Instagram URL",
        defaultValue: "",
    },

    organismoText: {
        type: ControlType.String,
        title: "Texto Organismo",
        defaultValue:
            "Red Solar Viva es un organismo vivo que evoluciona contigo:",
        displayTextArea: true,
    },
    ajusteButtonText: {
        type: ControlType.String,
        title: "Texto Botón Ajuste",
        defaultValue: "ENVIAR SEÑAL DE AJUSTE",
    },

    afinacionesTitle: {
        type: ControlType.String,
        title: "🔧 Modal Título",
        defaultValue: "AFINACIONES",
    },
    afinacionesText: {
        type: ControlType.String,
        title: "🔧 Modal Texto",
        defaultValue:
            "¿Hay algo que te gustaría que agregáramos o afináramos aquí? Tu mirada es parte del pulso solar.\\n\\nSi sientes una idea, una mejora o una nueva función que podría expandir el campo de Red Solar Viva, compártela: cada sugerencia ayuda a que Red Solar Viva siga evolucionando como un espacio vivo de co-creación.\\n\\nEscribe tu propuesta aquí abajo y la meditaremos.\\n\\n¡Gracias por co-crear este espacio solar!",
        displayTextArea: true,
    },
    afinacionesWebhookUrl: {
        type: ControlType.String,
        title: "⚡ Webhook Mensajes URL",
        defaultValue: "",
        description: "Pipedream/Zapier para mensajes.",
    },
})
