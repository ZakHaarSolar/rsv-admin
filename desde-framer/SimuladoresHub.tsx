// Red Solar Viva — SimuladoresHub.tsx v1.1
// v1.1 — Card especial para Domo Cero. Cuando el item del hub trae
// `art: "domo"`, se renderea con la className extra `.domo` (estilo
// dorado-cyan) y un componente DomoPortalArt 100% vectorial:
// halo radiante de fondo + 12 líneas radiales sutiles + anillo
// exterior en perspectiva (elipse dorada) + anillo medio cyan +
// anillo interno dorado + núcleo radiante pulsante + cinco
// partículas orbitando con duraciones distintas para que el
// movimiento se sienta orgánico. Animaciones por CSS keyframes,
// sin Framer Motion, para no sumar peso al render.
import * as React from "react"
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    useLayoutEffect,
} from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

const ACCENT = "#00C2FF"

const HUB_CSS = String.raw`
:root{
  --holo-primary:${ACCENT};
  --holo-secondary:color-mix(in oklab,${ACCENT} 68%,white 18%);
  --holo-glow:color-mix(in oklab,${ACCENT} 28%,transparent);
  --text-color:#E6F7EF;
}
.hub-root{position:relative;width:100%;min-height:100vh;color:var(--text-color);overflow:hidden;background:transparent}
.hub-root *{scrollbar-width:none}.hub-root *::-webkit-scrollbar{display:none}
.hub-stage{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:64px 28px 100px;}
.header{position:relative;display:flex;flex-direction:column;align-items:center;}
.header-row{display:flex;align-items:center;justify-content:center;width:100%;position:relative;z-index:10;}
.cube-layout-wrapper{width:72px;height:72px;flex-shrink:0;position:relative;}
.cube-interactive{width:100%;height:100%;cursor:grab;touch-action:none;filter:drop-shadow(0 0 8px var(--holo-primary)) drop-shadow(0 0 22px var(--holo-glow));outline:none!important;-webkit-tap-highlight-color:transparent;}
.cube-interactive:focus,.cube-interactive:focus-visible{outline:none!important;}.cube-interactive:active{cursor:grabbing;}
.cube-svg{width:100%;height:100%;animation:spin 42s linear infinite,breath 6.2s ease-in-out infinite;transform-origin:50% 50%}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
.title-fallback{font-family:'Inter',sans-serif;font-weight:100;letter-spacing:0.4em;margin-right:-0.4em;line-height:1;margin:0;text-transform:uppercase;font-size:var(--hub-title-size,72px);color:color-mix(in srgb,#FFFFFF 80%,var(--holo-primary));text-shadow:0 0 10px var(--holo-primary),0 0 25px var(--holo-glow);-webkit-font-smoothing:antialiased;animation:breath 7s ease-in-out infinite;}
.subtitle{max-width:900px;text-align:center;color:color-mix(in oklab,var(--text-color) 82%,black);opacity:.9;line-height:1.82;font-size:var(--hub-subtitle-size,1rem);white-space:pre-line;margin:0;}

/* ★ Flexbox grid — centra 1, 2 o 3 items */
.hub-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:28px;align-items:start;}
.portal{position:relative;width:340px;aspect-ratio:3/4;border-radius:18px;flex-shrink:0;background:radial-gradient(120% 120% at -10% -10%,color-mix(in oklab,var(--holo-primary) 22%,transparent),transparent 60%),rgba(6,14,24,.68);border:1px solid color-mix(in oklab,var(--holo-primary) 38%,transparent);box-shadow:0 0 10px var(--holo-primary),0 0 26px var(--holo-glow);overflow:hidden;isolation:isolate;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease;}
.portal:hover{transform:translateY(-4px);box-shadow:0 0 16px var(--holo-primary),0 0 42px var(--holo-glow)}
.portal .cover{position:absolute;inset:0;display:grid;place-items:center;background:rgba(255,255,255,.02)}
.portal .cover img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 10px color-mix(in oklab,var(--holo-primary) 30%,transparent));}
.portal::after{content:"";position:absolute;inset:0;border-radius:18px;border:1px solid color-mix(in oklab,var(--holo-secondary) 68%,transparent);box-shadow:0 0 8px var(--holo-primary),inset 0 0 3px var(--holo-primary);opacity:.55;pointer-events:none;}
.reticle{position:absolute;inset:10px;opacity:0;transition:opacity .12s ease}.reticle.show{opacity:1}
.reticle .k{position:absolute;width:18px;height:18px;border:1px solid var(--holo-secondary);box-shadow:0 0 7px var(--holo-primary)}
.k.tl{left:-2px;top:-2px;border-right:0;border-bottom:0}.k.tr{right:-2px;top:-2px;border-left:0;border-bottom:0}
.k.bl{left:-2px;bottom:-2px;border-right:0;border-top:0}.k.br{right:-2px;bottom:-2px;border-left:0;border-top:0}
.reticle .scan{position:absolute;left:12px;right:12px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);filter:drop-shadow(0 0 6px var(--holo-primary));animation:scan 2.4s linear infinite}
@keyframes scan{from{top:14%}to{top:86%}}
.title-top{opacity:15%;position:absolute;left:14px;right:14px;top:12px;display:flex;align-items:center;justify-content:center;text-align:center;letter-spacing:.02em;font-weight:600;}
.cta{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;padding:10px 16px;border-radius:10px;font-weight:700;color:#061018;background:linear-gradient(180deg,color-mix(in oklab,var(--holo-primary) 65%,white 5%),color-mix(in oklab,var(--holo-primary) 40%,transparent));border:1px solid color-mix(in oklab,var(--holo-primary) 70%,transparent);box-shadow:0 0 12px var(--holo-primary),0 0 26px var(--holo-glow),inset 0 -8px 18px rgba(0,0,0,.15);text-decoration:none;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease,box-shadow .16s ease;}
.portal:hover .cta,.portal.selected .cta{opacity:1;pointer-events:auto;}
.portal:hover .cta:hover,.portal.selected .cta:hover{transform:translateX(-50%) translateY(-2px) scale(1.04);box-shadow:0 0 18px var(--holo-primary),0 0 40px var(--holo-glow),inset 0 -10px 24px rgba(0,0,0,.25);}

/* Card especial Domo Cero — portal interdimensional ───────────── */
.portal.domo{background:radial-gradient(120% 120% at 50% 35%,rgba(255,215,0,0.18),transparent 55%),radial-gradient(80% 60% at 50% 80%,rgba(0,194,255,0.12),transparent 70%),rgba(4,8,20,.92);border-color:color-mix(in oklab,#FFD700 55%,transparent);box-shadow:0 0 14px rgba(255,215,0,0.35),0 0 32px rgba(255,215,0,0.18),0 0 60px rgba(0,194,255,0.12);}
.portal.domo:hover{box-shadow:0 0 22px rgba(255,215,0,0.55),0 0 50px rgba(255,215,0,0.28),0 0 80px rgba(0,194,255,0.18);}
.portal.domo::after{border-color:color-mix(in oklab,#FFD700 70%,transparent);box-shadow:0 0 10px rgba(255,215,0,0.35),inset 0 0 4px rgba(255,215,0,0.4);}
.domo-art{position:absolute;inset:0;display:grid;place-items:center;}
.domo-art-svg{width:88%;height:88%;filter:drop-shadow(0 0 14px rgba(255,215,0,0.35));}
.domo-art-glow{transform-origin:50% 50%;animation:domo-glow-breath 5.4s ease-in-out infinite;}
.domo-art-ring-outer{transform-origin:100px 100px;animation:domo-ring-cw 36s linear infinite;}
.domo-art-ring-mid{transform-origin:100px 100px;animation:domo-ring-ccw 24s linear infinite;}
.domo-art-ring-inner{transform-origin:100px 100px;animation:domo-ring-cw 14s linear infinite;}
.domo-art-core{transform-origin:100px 100px;animation:domo-core-pulse 3.6s ease-in-out infinite;}
.domo-art-radials{transform-origin:100px 100px;animation:domo-ring-ccw 60s linear infinite;}
.domo-art-particle{transform-origin:100px 100px;}
.domo-art-particle.p1{animation:domo-orbit-cw 18s linear infinite;}
.domo-art-particle.p2{animation:domo-orbit-ccw 24s linear infinite;}
.domo-art-particle.p3{animation:domo-orbit-cw 30s linear infinite;}
.domo-art-particle.p4{animation:domo-orbit-ccw 16s linear infinite;}
.domo-art-particle.p5{animation:domo-orbit-cw 22s linear infinite;}
@keyframes domo-ring-cw{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes domo-ring-ccw{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes domo-orbit-cw{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes domo-orbit-ccw{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes domo-core-pulse{0%,100%{opacity:.78;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes domo-glow-breath{0%,100%{opacity:.4}50%{opacity:.95}}
.portal.domo .title-top{opacity:.82;color:color-mix(in srgb,#FFFFFF 88%,#FFD700);text-shadow:0 0 8px rgba(255,215,0,0.4),0 0 18px rgba(255,215,0,0.2);letter-spacing:.18em;}
.portal.domo .cta{background:linear-gradient(180deg,color-mix(in oklab,#FFD700 75%,white 5%),color-mix(in oklab,#FFD700 45%,transparent));border-color:color-mix(in oklab,#FFD700 80%,transparent);box-shadow:0 0 14px rgba(255,215,0,0.4),0 0 30px rgba(255,215,0,0.22),inset 0 -8px 18px rgba(0,0,0,.18);color:#1a0e00;}
`

/* ═══════════════════════════════════════════════════════════════
   DomoPortalArt — visual SVG vectorial para la card del Domo Cero.
   Portal interdimensional con anillo dorado en perspectiva, dos
   anillos concéntricos (cyan + dorado) girando en sentidos opuestos,
   núcleo radiante pulsante, partículas orbitando y halo respirante.
   100% vectorial, animado con CSS keyframes (sin Framer Motion).
   ═══════════════════════════════════════════════════════════════ */
function DomoPortalArt() {
    return (
        <div className="domo-art" aria-hidden="true">
            <svg
                className="domo-art-svg"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="domo-bg-grad" cx="50%" cy="50%" r="55%">
                        <stop
                            offset="0%"
                            stopColor="#FFD700"
                            stopOpacity="0.32"
                        />
                        <stop
                            offset="40%"
                            stopColor="#00C2FF"
                            stopOpacity="0.14"
                        />
                        <stop
                            offset="100%"
                            stopColor="#000000"
                            stopOpacity="0"
                        />
                    </radialGradient>
                    <radialGradient
                        id="domo-core-grad"
                        cx="40%"
                        cy="38%"
                        r="60%"
                    >
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="22%" stopColor="#FFF3B8" />
                        <stop offset="55%" stopColor="#FFC83A" />
                        <stop
                            offset="100%"
                            stopColor="#7A4500"
                            stopOpacity="0.28"
                        />
                    </radialGradient>
                    <linearGradient
                        id="domo-arc-cyan"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#00E5FF"
                            stopOpacity="0"
                        />
                        <stop
                            offset="50%"
                            stopColor="#00E5FF"
                            stopOpacity="1"
                        />
                        <stop
                            offset="100%"
                            stopColor="#00E5FF"
                            stopOpacity="0"
                        />
                    </linearGradient>
                    <linearGradient
                        id="domo-arc-gold"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#FFD700"
                            stopOpacity="0"
                        />
                        <stop
                            offset="50%"
                            stopColor="#FFE680"
                            stopOpacity="1"
                        />
                        <stop
                            offset="100%"
                            stopColor="#FFD700"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {/* Halo radiante de fondo */}
                <circle
                    className="domo-art-glow"
                    cx="100"
                    cy="100"
                    r="94"
                    fill="url(#domo-bg-grad)"
                />

                {/* Líneas radiales sutilmente girando */}
                <g className="domo-art-radials" opacity="0.32">
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                        (angle) => {
                            const rad = (angle * Math.PI) / 180
                            const x2 = 100 + 78 * Math.cos(rad)
                            const y2 = 100 + 78 * Math.sin(rad)
                            return (
                                <line
                                    key={angle}
                                    x1="100"
                                    y1="100"
                                    x2={x2}
                                    y2={y2}
                                    stroke={
                                        angle % 60 === 0
                                            ? "#FFD700"
                                            : "#00E5FF"
                                    }
                                    strokeWidth="0.5"
                                    strokeLinecap="round"
                                />
                            )
                        }
                    )}
                </g>

                {/* Anillo exterior en perspectiva (elipse dorada) */}
                <g className="domo-art-ring-outer">
                    <ellipse
                        cx="100"
                        cy="100"
                        rx="86"
                        ry="30"
                        fill="none"
                        stroke="url(#domo-arc-gold)"
                        strokeWidth="2.4"
                        opacity="0.92"
                    />
                    <ellipse
                        cx="100"
                        cy="100"
                        rx="86"
                        ry="30"
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="0.6"
                        opacity="0.5"
                    />
                </g>

                {/* Anillo medio cyan */}
                <g className="domo-art-ring-mid">
                    <circle
                        cx="100"
                        cy="100"
                        r="62"
                        fill="none"
                        stroke="url(#domo-arc-cyan)"
                        strokeWidth="1.6"
                        opacity="0.8"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="62"
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="0.4"
                        opacity="0.45"
                        strokeDasharray="2 5"
                    />
                </g>

                {/* Anillo interno dorado */}
                <g className="domo-art-ring-inner">
                    <circle
                        cx="100"
                        cy="100"
                        r="40"
                        fill="none"
                        stroke="url(#domo-arc-gold)"
                        strokeWidth="1.4"
                        opacity="0.95"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="40"
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="0.4"
                        opacity="0.4"
                        strokeDasharray="1 3"
                    />
                </g>

                {/* Núcleo radiante */}
                <g className="domo-art-core">
                    <circle
                        cx="100"
                        cy="100"
                        r="24"
                        fill="url(#domo-core-grad)"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="0.6"
                        opacity="0.4"
                    />
                </g>

                {/* Partículas orbitando con duraciones distintas */}
                <g className="domo-art-particle p1">
                    <circle cx="100" cy="34" r="2.6" fill="#FFD700" />
                </g>
                <g className="domo-art-particle p2">
                    <circle cx="170" cy="100" r="2.2" fill="#00E5FF" />
                </g>
                <g className="domo-art-particle p3">
                    <circle cx="100" cy="166" r="1.8" fill="#FFE680" />
                </g>
                <g className="domo-art-particle p4">
                    <circle cx="32" cy="100" r="2" fill="#00E5FF" />
                </g>
                <g className="domo-art-particle p5">
                    <circle cx="148" cy="48" r="1.6" fill="#FFD700" />
                </g>
            </svg>
        </div>
    )
}
DomoPortalArt.displayName = "DomoPortalArt"

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: "easeOut", delay: 0.6 },
    },
}
const cubeEntryVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -90 },
    visible: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { type: "spring", stiffness: 60, damping: 15 },
    },
}
const normalizeMultiline = (s?: string) => (s || "").replace(/\\n|\/n/g, "\n")

function useInjectHubCss() {
    const useEarly = (React as any).useInsertionEffect || useLayoutEffect
    useEarly(() => {
        if (typeof document === "undefined") return
        const id = "rsv-simuladores-hub-v10"
        let s = document.getElementById(id) as HTMLStyleElement | null
        if (!s) {
            s = document.createElement("style")
            s.id = id
            document.head.appendChild(s)
        }
        if (s.textContent !== HUB_CSS) s.textContent = HUB_CSS
    }, [])
}

const HypercubeIcon: React.FC = () => {
    const mk = (x: number, y: number, s: number) =>
        [
            [x, y],
            [x + s, y],
            [x + s, y + s],
            [x, y + s],
        ] as [number, number][]
    const A = mk(14, 26, 44),
        B = mk(28, 12, 44)
    const edges = [
        ...[...Array(4)].map((_, i) => [A[i], A[(i + 1) % 4]]),
        ...[...Array(4)].map((_, i) => [B[i], B[(i + 1) % 4]]),
        ...[...Array(4)].map((_, i) => [A[i], B[i]]),
    ]
    return (
        <svg className="cube-svg" viewBox="0 0 72 72" aria-hidden>
            {edges.map(([[x1, y1], [x2, y2]], i) => (
                <g key={i}>
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="var(--holo-primary)"
                        strokeWidth="4.6"
                        opacity=".12"
                    />
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="color-mix(in oklab, var(--holo-primary) 86%, white 6%)"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                    />
                </g>
            ))}
        </svg>
    )
}

type Game = {
    id: string
    title: string
    cover?: string
    onStartGame?: (id: string) => void
}
const clamp01 = (v: number) => (Number.isNaN(v) ? 0 : v < 0 ? 0 : v > 1 ? 1 : v)

type Props = {
    titleFallback?: string
    titleFallbackHeight?: number
    subtitleText?: string
    subtitleFontSizePx?: number
    gridColumns?: number
    cardGlow?: number
    enableSound?: boolean
    hoverUrl?: string
    hoverVolume?: number
    items?: any[]
    topOffsetPx?: number
    cardTitleFontSizePx?: number
    cubeToTitleGapPx?: number
    titleSubtitleGapPx?: number
    subtitleToGridGapPx?: number
    gridGapPx?: number
    onStartGame?: (gameId: string) => void
}

export function SimuladoresHub(props: Props) {
    useInjectHubCss()
    const {
        titleFallback = "SIMULADORES",
        titleFallbackHeight = 72,
        subtitleText = "Aquí interactúas y juegas para calibrar.",
        subtitleFontSizePx = 20,
        subtitleToGridGapPx = 60,
        cardGlow = 1,
        enableSound = false,
        hoverUrl = "",
        hoverVolume = 0.42,
        items = [],
        topOffsetPx = 51,
        cardTitleFontSizePx = 20,
        cubeToTitleGapPx = 32,
        titleSubtitleGapPx = 45,
        gridGapPx = 40,
        onStartGame,
    } = props

    const [isReady, setIsReady] = useState(false)
    useEffect(() => setIsReady(true), [])

    /* ★ Filtrar items vacíos: solo mostrar los que tengan al menos id Y title */
    const games: Game[] = useMemo(() => {
        const raw = items && items.length ? items : []
        return raw.filter((g: any) => {
            if (!g) return false
            const hasId = g.id && g.id.trim().length > 0
            const hasTitle = g.title && g.title.trim().length > 0
            const hasCover = g.cover && g.cover.length > 0
            return hasId || hasTitle || hasCover
        })
    }, [items])

    const [selectedId, setSelectedId] = useState<string | null>(null)
    useEffect(() => {
        if (games.length) setSelectedId(games[0].id)
    }, [games])

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const enableSoundRef = useRef(enableSound)
    useEffect(() => {
        enableSoundRef.current = enableSound
    }, [enableSound])
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        if (!enableSound || !hoverUrl) return
        const h = new Audio(hoverUrl)
        h.volume = clamp01(hoverVolume ?? 0.42)
        audioRef.current = h
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [enableSound, hoverUrl, hoverVolume])

    const playSfx = useCallback(() => {
        if (!enableSoundRef.current) return
        const h = audioRef.current
        if (!h) return
        try {
            h.currentTime = 0
            h.play().catch(() => {})
        } catch {}
    }, [])

    const openGame = useCallback(
        (g: Game | undefined) => {
            if (!g) return
            if (onStartGame) {
                onStartGame(g.id)
                return
            }
        },
        [onStartGame]
    )

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedId(null)
                return
            }
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                if (!games.length) return
                e.preventDefault()
                const ci = selectedId
                    ? games.findIndex((g) => g.id === selectedId)
                    : 0
                const si = ci < 0 ? 0 : ci
                const dir = e.key === "ArrowRight" ? 1 : -1
                const ni = (si + dir + games.length) % games.length
                setSelectedId(games[ni].id)
                requestAnimationFrame(() => playSfx())
            }
            if (e.key === "Enter") {
                if (!games.length) return
                const idx = selectedId
                    ? games.findIndex((g) => g.id === selectedId)
                    : 0
                openGame(games[idx >= 0 ? idx : 0])
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [games, selectedId, openGame, playSfx])

    const cubeRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const handleDragEnd = () => {
        playSfx()
        if (!cubeRef.current) return
        const rect = cubeRef.current.getBoundingClientRect()
        const winW = window.innerWidth
        let newX = x.get(),
            newY = y.get(),
            adj = false
        if (rect.top < 90) {
            newY += 90 - rect.top + 20
            adj = true
        }
        if (rect.right > winW - 100) {
            newX -= rect.right - (winW - 100) + 20
            adj = true
        }
        if (adj) {
            animate(x, newX, { type: "spring", stiffness: 200, damping: 20 })
            animate(y, newY, { type: "spring", stiffness: 200, damping: 20 })
        }
    }

    const rootStyle: React.CSSProperties = {
        ["--cardGlow" as any]: cardGlow,
        ["--hub-title-size" as any]: `${titleFallbackHeight}px`,
        ["--hub-subtitle-size" as any]: `${subtitleFontSizePx}px`,
    }

    return (
        <div className="hub-root" style={rootStyle}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap');`}</style>
            <motion.div
                className="hub-stage"
                style={{ marginTop: topOffsetPx }}
                initial="hidden"
                animate={isReady ? "visible" : "hidden"}
                variants={{
                    visible: { transition: { staggerChildren: 0.15 } },
                }}
            >
                <div
                    className="header"
                    style={{ marginBottom: subtitleToGridGapPx }}
                >
                    <div
                        className="header-row"
                        style={{ gap: cubeToTitleGapPx }}
                    >
                        <motion.div
                            variants={{
                                hidden: {
                                    opacity: 0,
                                    y: -30,
                                    filter: "blur(8px)",
                                },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                    transition: {
                                        duration: 1.2,
                                        delay: 0.2,
                                        ease: "easeOut",
                                    },
                                },
                            }}
                        >
                            <h1
                                className="title-fallback"
                                style={{
                                    background: `linear-gradient(180deg, ${ACCENT}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: `drop-shadow(0 0 12px rgba(0,194,255,0.25))`,
                                    color: "transparent",
                                    textShadow: "none",
                                }}
                            >
                                {titleFallback}
                            </h1>
                        </motion.div>
                        <motion.div
                            className="cube-layout-wrapper"
                            variants={cubeEntryVariants}
                        >
                            <motion.div
                                ref={cubeRef}
                                className="cube-interactive"
                                style={{ x, y }}
                                drag
                                dragMomentum={false}
                                onDragEnd={handleDragEnd}
                                whileHover={{
                                    scale: 1.15,
                                    rotate: 15,
                                    filter: "drop-shadow(0 0 15px var(--holo-primary)) hue-rotate(90deg)",
                                    transition: { duration: 0.3 },
                                }}
                                whileTap={{
                                    scale: 0.9,
                                    rotate: -15,
                                    filter: "hue-rotate(0deg)",
                                }}
                                onClick={() => playSfx()}
                            >
                                <HypercubeIcon />
                            </motion.div>
                        </motion.div>
                    </div>
                    <motion.p
                        className="subtitle"
                        style={{ marginTop: titleSubtitleGapPx }}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.7, delay: 0.35 },
                            },
                        }}
                    >
                        {normalizeMultiline(subtitleText)}
                    </motion.p>
                </div>

                {/* ★ Flexbox grid — centra automáticamente 1, 2 o 3 items */}
                <motion.div
                    className="hub-grid"
                    style={{ gap: gridGapPx }}
                    variants={{
                        visible: { transition: { staggerChildren: 0.1 } },
                    }}
                >
                    {games.map((g) => {
                        const isSelected = selectedId === g.id
                        const isDomo = g.art === "domo"
                        return (
                            <motion.div
                                key={g.id}
                                className={`portal${
                                    isSelected ? " selected" : ""
                                }${isDomo ? " domo" : ""}`}
                                onClick={() => {
                                    setSelectedId(g.id)
                                    playSfx()
                                    openGame(g)
                                }}
                                onMouseEnter={() => {
                                    if (selectedId !== g.id) {
                                        setSelectedId(g.id)
                                        playSfx()
                                    }
                                }}
                                variants={cardVariants}
                            >
                                <div className="cover">
                                    {isDomo ? (
                                        <DomoPortalArt />
                                    ) : g.cover ? (
                                        <img src={g.cover} alt="" />
                                    ) : (
                                        <svg
                                            width="80%"
                                            height="80%"
                                            viewBox="0 0 100 100"
                                            aria-hidden
                                        >
                                            <rect
                                                x="10"
                                                y="10"
                                                width="80"
                                                height="80"
                                                fill="none"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1.6"
                                                opacity=".6"
                                            />
                                            <rect
                                                x="22"
                                                y="22"
                                                width="56"
                                                height="56"
                                                fill="none"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1.2"
                                                opacity=".4"
                                            />
                                            <line
                                                x1="10"
                                                y1="10"
                                                x2="22"
                                                y2="22"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1"
                                                opacity=".4"
                                            />
                                            <line
                                                x1="90"
                                                y1="10"
                                                x2="78"
                                                y2="22"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1"
                                                opacity=".4"
                                            />
                                            <line
                                                x1="10"
                                                y1="90"
                                                x2="22"
                                                y2="78"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1"
                                                opacity=".4"
                                            />
                                            <line
                                                x1="90"
                                                y1="90"
                                                x2="78"
                                                y2="78"
                                                stroke="var(--holo-primary)"
                                                strokeWidth="1"
                                                opacity=".4"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div
                                    className="title-top"
                                    style={{ fontSize: cardTitleFontSizePx }}
                                >
                                    {g.title}
                                </div>
                                <div
                                    className={`reticle ${isSelected ? "show" : ""}`}
                                >
                                    <span className="k tl" />
                                    <span className="k tr" />
                                    <span className="k bl" />
                                    <span className="k br" />
                                    <span className="scan" />
                                </div>
                                <span className="cta">INICIAR SIMULACIÓN</span>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(SimuladoresHub, {
    titleFallback: { type: ControlType.String, defaultValue: "SIMULADORES" },
    subtitleText: { type: ControlType.String, title: "Subtítulo", rows: 4 },
    items: {
        type: ControlType.Array,
        title: "Portales",
        propertyControl: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String },
                title: { type: ControlType.String },
                cover: { type: ControlType.Image },
            },
        },
    },
})

export default SimuladoresHub
