// EV_Codex.tsx v1.3
// v1.3 — Numeración romana extendida hasta X. Antes la tabla de
// conversión cubría sólo 1-6 (cuando la librería tenía pocas fases),
// y al saltar al cambio de "10 fases por pilar" del 2026-05-07 los
// tomos 7, 8, 9 y 10 cayeron al fallback `String(fase)` mostrando
// "7", "8", "9", "10" en lugar del romano correspondiente. Ahora la
// tabla cubre 1-10 (I a X) y el helper queda centralizado.
// v1.2 — Defaults defensivos en SacredCodex y CodexCarousel para que
// Framer no crashee al instanciar standalone con props undefined
// ("Cannot read properties of undefined (reading 'length')").
// EV_Codex.tsx v1.1
// v1.1 — CodexCarousel mobile rompe el padding lateral del esc-scroll
// (12px) usando width: 100vw + marginInline: calc(50% - 50vw). Antes
// los tomos vecinos quedaban cortados por la franja negra del padding
// lateral del Escáner; ahora llegan hasta la orilla del viewport.
// Códices Sagrados del Escáner Vibracional. SacredCodex pinta el tomo
// holográfico individual; CodexCarousel orquesta la galería (desktop:
// flex row sin scroll con barra de progreso por tomo, mobile: snap
// horizontal + dots indicators). Default export es CodexCarousel —
// SacredCodex queda interno porque el resto del proyecto solo consume
// el carousel.
import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Shared, { DBProtocol } from "./EV_Shared.tsx"
const { hx, GOLD } = Shared

function SacredCodex({
    fase = 1,
    accent = "#00C2FF",
    onClick = () => {},
    isMobile = false,
    hovered,
    size = "default",
}: {
    fase?: number
    accent?: string
    onClick?: () => void
    isMobile?: boolean
    hovered?: boolean
    size?: "default" | "big"
}) {
    /* size: "big" = libro grande protagonista; "default" = card chiquito. */
    const W = size === "big" ? (isMobile ? 220 : 280) : isMobile ? 96 : 118
    const H = size === "big" ? (isMobile ? 300 : 378) : isMobile ? 132 : 164
    /* v1.3 — Tabla extendida 1-10 para soportar las 10 fases por
       pilar configuradas en libreria_protocolos desde 2026-05-07. */
    const roman =
        ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][
            fase
        ] || String(fase)
    return (
        <motion.button
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            onClick={onClick}
            style={{
                position: "relative",
                width: W,
                height: H,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                outline: "none",
                flexShrink: 0,
            }}
        >
            <svg
                width={W}
                height={H}
                viewBox="0 0 100 140"
                style={{
                    filter: `drop-shadow(0 0 14px ${hx(accent, 0.25)}) drop-shadow(0 0 6px ${hx(GOLD, 0.2)})`,
                }}
            >
                <defs>
                    <linearGradient
                        id={`codex-body-${fase}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <stop offset="0%" stopColor="rgba(15,28,48,0.95)" />
                        <stop offset="50%" stopColor="rgba(8,16,30,0.95)" />
                        <stop offset="100%" stopColor="rgba(2,8,20,1)" />
                    </linearGradient>
                    <linearGradient
                        id={`codex-spine-${fase}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                    >
                        <stop offset="0%" stopColor={GOLD} stopOpacity="0.6" />
                        <stop
                            offset="100%"
                            stopColor={GOLD}
                            stopOpacity="0.15"
                        />
                    </linearGradient>
                    <radialGradient
                        id={`codex-sigil-${fase}`}
                        cx="0.5"
                        cy="0.5"
                        r="0.6"
                    >
                        <stop offset="0%" stopColor={GOLD} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect
                    x="10"
                    y="10"
                    width="84"
                    height="124"
                    rx="4"
                    fill="rgba(0,0,0,0.5)"
                />
                <rect
                    x="8"
                    y="6"
                    width="84"
                    height="126"
                    rx="4"
                    fill={`url(#codex-body-${fase})`}
                    stroke={hx(accent, 0.45)}
                    strokeWidth="1.2"
                />
                <rect
                    x="8"
                    y="6"
                    width="6"
                    height="126"
                    fill={`url(#codex-spine-${fase})`}
                />
                <line
                    x1="14"
                    y1="6"
                    x2="14"
                    y2="132"
                    stroke={GOLD}
                    strokeWidth="0.4"
                    opacity="0.5"
                />
                <rect
                    x="13"
                    y="12"
                    width="74"
                    height="114"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="0.4"
                    opacity="0.55"
                />
                <rect
                    x="16"
                    y="15"
                    width="68"
                    height="108"
                    fill="none"
                    stroke={hx(accent, 0.35)}
                    strokeWidth="0.3"
                    strokeDasharray="2 2"
                />
                {[
                    [18, 18],
                    [82, 18],
                    [18, 120],
                    [82, 120],
                ].map(([x, y], i) => (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="1.2"
                        fill={GOLD}
                        opacity="0.7"
                    />
                ))}
                <circle
                    cx="50"
                    cy="62"
                    r="22"
                    fill={`url(#codex-sigil-${fase})`}
                />
                <polygon
                    points="50,46 62,53 62,71 50,78 38,71 38,53"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="0.8"
                    opacity="0.8"
                />
                <polygon
                    points="50,50 58,55 58,69 50,74 42,69 42,55"
                    fill={hx(GOLD, 0.08)}
                    stroke={hx(accent, 0.6)}
                    strokeWidth="0.4"
                />
                <circle cx="50" cy="62" r="1.8" fill={GOLD} opacity="0.9" />
                <text
                    x="50"
                    y="100"
                    textAnchor="middle"
                    fill={GOLD}
                    fontSize="14"
                    fontWeight="300"
                    fontFamily="'Inter',serif"
                    letterSpacing="0.15em"
                    opacity="0.95"
                    style={{
                        filter: `drop-shadow(0 0 4px ${hx(GOLD, 0.6)})`,
                    }}
                >
                    {roman}
                </text>
                <text
                    x="50"
                    y="116"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="5"
                    fontWeight="600"
                    fontFamily="Inter,sans-serif"
                    letterSpacing="0.25em"
                >
                    FASE
                </text>
                <circle
                    cx="50"
                    cy="62"
                    r="14"
                    fill="none"
                    stroke={hx(accent, 0.5)}
                    strokeWidth="0.4"
                    opacity="0.7"
                >
                    <animate
                        attributeName="r"
                        values="14;17;14"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.7;0.2;0.7"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
        </motion.button>
    )
}

function CodexCarousel({
    /* v1.1 — Defaults defensivos contra Framer instanciando standalone
       con props undefined (".length" sobre undefined). */
    protos = [],
    accent = "#00C2FF",
    isMobile = false,
    onOpen = () => {},
}: {
    protos?: DBProtocol[]
    accent?: string
    isMobile?: boolean
    onOpen?: (id: string) => void
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeIdx, setActiveIdx] = useState(0)
    const itemW = isMobile ? 260 : 320
    /* Desktop: todos los tomos visibles a la vez en una fila horizontal sin
       scroll. Mobile: carousel con snap como antes. */
    const isDesktopGrid = !isMobile
    useEffect(() => {
        if (isDesktopGrid) return
        const el = scrollRef.current
        if (!el) return
        const onScroll = () => {
            const idx = Math.round(el.scrollLeft / itemW)
            setActiveIdx(Math.min(protos.length - 1, Math.max(0, idx)))
        }
        el.addEventListener("scroll", onScroll, { passive: true })
        return () => el.removeEventListener("scroll", onScroll)
    }, [itemW, protos.length, isDesktopGrid])
    const active = protos[activeIdx]
    const tareas = Array.isArray(active?.tareas_json) ? active.tareas_json : []
    const completadas = Array.isArray(active?.tareas_completadas)
        ? active.tareas_completadas
        : []
    const total = tareas.length
    const done = completadas.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const scrollTo = (i: number) => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ left: i * itemW, behavior: "smooth" })
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                width: "100%",
                /* Desktop expand a 1100 para que entren todos los tomos sin
                   recortes. Mobile sigue en 560. */
                maxWidth: isDesktopGrid ? 1100 : 560,
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Inter',sans-serif",
                    textAlign: "center",
                }}
            >
                Códices Activos · {protos.length} tomo
                {protos.length !== 1 ? "s" : ""}
            </p>
            {isDesktopGrid ? (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 32,
                        justifyContent: "center",
                        width: "100%",
                        padding: "8px 0 4px",
                    }}
                >
                    {protos.map((pr) => {
                        const prTareas = Array.isArray(pr.tareas_json)
                            ? pr.tareas_json
                            : []
                        const prComp = Array.isArray(pr.tareas_completadas)
                            ? pr.tareas_completadas
                            : []
                        const prTotal = prTareas.length
                        const prDone = prComp.length
                        const prPct =
                            prTotal > 0
                                ? Math.round((prDone / prTotal) * 100)
                                : 0
                        return (
                            <div
                                key={pr.id}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 14,
                                    width: itemW,
                                }}
                            >
                                <SacredCodex
                                    fase={pr.fase}
                                    accent={accent}
                                    isMobile={isMobile}
                                    size="big"
                                    onClick={() => onOpen(pr.id)}
                                />
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        fontWeight: 500,
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.85)",
                                        fontFamily: "'Inter',sans-serif",
                                        textAlign: "center",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {pr.titulo}
                                </p>
                                <div
                                    style={{
                                        width: "100%",
                                        height: 4,
                                        borderRadius: 2,
                                        background: "rgba(255,255,255,0.06)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prPct}%` }}
                                        transition={{
                                            duration: 0.6,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${hx(GOLD, 0.7)}, ${hx(GOLD, 0.95)})`,
                                            boxShadow: `0 0 10px ${hx(GOLD, 0.5)}`,
                                        }}
                                    />
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.4)",
                                        fontFamily: "'Inter',sans-serif",
                                    }}
                                >
                                    {prDone}/{prTotal} TAREAS · {prPct}%
                                </p>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    style={{
                        display: "flex",
                        gap: 0,
                        overflowX: "auto",
                        overflowY: "hidden",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        /* v3.6 — En mobile el carousel rompe el padding
                           lateral del esc-scroll (12px) extendiéndose
                           a 100vw. Sin esto los tomos vecinos quedaban
                           cortados por una franja negra a los lados. */
                        width: isMobile ? "100vw" : "100%",
                        marginLeft: isMobile ? "calc(50% - 50vw)" : 0,
                        marginRight: isMobile ? "calc(50% - 50vw)" : 0,
                        padding: "8px 0 4px",
                        scrollPaddingInline: `calc(50% - ${itemW / 2}px)`,
                        scrollbarWidth: "none",
                        WebkitOverflowScrolling: "touch",
                        justifyContent: "flex-start",
                    }}
                    className="esc-codex-scroll"
                >
                    <div
                        aria-hidden
                        style={{
                            flex: `0 0 calc((100% - ${itemW}px) / 2)`,
                            minWidth: 0,
                        }}
                    />
                    {protos.map((pr) => (
                        <div
                            key={pr.id}
                            style={{
                                flex: `0 0 ${itemW}px`,
                                scrollSnapAlign: "center",
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <SacredCodex
                                fase={pr.fase}
                                accent={accent}
                                isMobile={isMobile}
                                size="big"
                                onClick={() => onOpen(pr.id)}
                            />
                        </div>
                    ))}
                    <div
                        aria-hidden
                        style={{
                            flex: `0 0 calc((100% - ${itemW}px) / 2)`,
                            minWidth: 0,
                        }}
                    />
                </div>
            )}
            {!isDesktopGrid && active && (
                <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        maxWidth: 320,
                        padding: "0 16px",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            color: "rgba(255,255,255,0.85)",
                            fontFamily: "'Inter',sans-serif",
                            textAlign: "center",
                            lineHeight: 1.4,
                        }}
                    >
                        {active.titulo}
                    </p>
                    <div
                        style={{
                            width: "100%",
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                            marginTop: 4,
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{
                                height: "100%",
                                background: `linear-gradient(90deg, ${hx(GOLD, 0.7)}, ${hx(GOLD, 0.95)})`,
                                boxShadow: `0 0 10px ${hx(GOLD, 0.5)}`,
                            }}
                        />
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 10,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {done}/{total} TAREAS · {pct}%
                    </p>
                </motion.div>
            )}
            {!isDesktopGrid && protos.length > 1 && (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                        marginTop: 4,
                    }}
                >
                    {protos.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            aria-label={`Ir al tomo ${i + 1}`}
                            style={{
                                width: i === activeIdx ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                background:
                                    i === activeIdx
                                        ? hx(accent, 0.85)
                                        : "rgba(255,255,255,0.18)",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                outline: "none",
                                transition:
                                    "width 0.3s ease, background 0.3s ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}

export default CodexCarousel
