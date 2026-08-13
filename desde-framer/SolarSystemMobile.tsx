import * as React from "react"
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
    useImperativeHandle,
    forwardRef,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

import { useSolarTheme, withAlpha } from "./useSolarTheme.ts"
import SolarThemeToggle from "./SolarThemeToggle.tsx"

/* ───────────────── CSS EMBEBIDO ───────────────── */
const CSS = String.raw`
:root{
  --holo-primary:#00FF41;
  --holo-secondary:#39FF88;
  --holo-glow: rgba(0,255,65,.25);
  --orbit-stroke: rgba(0,255,65,.45);

  --gold-1:#FFE59A; --gold-2:#FFD46B; --gold-3:#F4C24F;
  --bg-space:#000000; --text-color:#E6F7EF;

  --system-offset-y: 0px;
  --title-top-offset: 64px;

  --orbit-tilt:.66;
  --planet-glow:.85;

  --info-offset-y: 0px;
  --info-min-h: 220px;

  --cta-bottom: 16px;   /* distancia al borde inferior */
  --cta-offset-y: 0px;  /* ajuste fino eje Y */

  --safe-top:env(safe-area-inset-top, 0px);
  --safe-bottom:env(safe-area-inset-bottom, 0px);
}

:root[data-theme="neon"]{
  --holo-primary:#0099FF;
  --holo-secondary:#66CCFF;
  --holo-glow: rgba(0,153,255,.25);
  --orbit-stroke: rgba(0,153,255,.45);
}

.m-root{position:relative;width:100%;min-height:100svh;background:var(--bg-space);color:var(--text-color);overflow-x:hidden}
/* Evita desplazamiento lateral del documento */
.m-root{
  overscroll-behavior-x: none; /* bloquea chaining horizontal */
}

/* En el área orbital: permite solo pan vertical (para scroll) */
.m-orbit{
  touch-action: pan-y;        /* desactiva pan-x y pinch-zoom en el área */
  -ms-touch-action: pan-y;    /* compatibilidad */
  overscroll-behavior: contain;
}

/* El “botón planeta” no inicia gestos del navegador */
.m-planet{
  touch-action: none;         /* el tap/drag es nuestro, no del navegador */
}
.m-root[data-ready="0"]{opacity:0;transition:opacity .12s ease}
.m-root[data-ready="1"]{opacity:1;transition:opacity .12s ease}


/* estrellas */
.m-stars{position:absolute;inset:0;pointer-events:none;z-index:0}
@keyframes tw{0%{opacity:.08}50%{opacity:.85}100%{opacity:.08}}

/* header */
.m-header{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;padding:0 16px 10px;margin-top:calc(var(--safe-top) + var(--title-top-offset))}
.m-title{
  font-family:"Josefin Sans",Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  font-weight:500;letter-spacing:.02em;line-height:1.05;margin:0;
  font-size:clamp(2.6rem,10vw,4.6rem);
  background:linear-gradient(115deg,var(--gold-1),var(--gold-2) 40%,var(--gold-3) 60%,var(--gold-1));
  background-size:200% 200%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:0 0 10px rgba(255,231,150,.35),0 0 22px rgba(255,210,120,.25),0 0 36px rgba(255,180,90,.2);
  animation:title-glow 7s ease-in-out infinite;
}
@keyframes title-glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
.m-sub{opacity:.92;text-align:center;max-width:720px;font-size:clamp(.95rem,3.4vw,1.08rem);margin-top:8px}

/* escena */
.m-scene{position:relative;z-index:1;display:grid;grid-template-rows:auto auto 1fr auto;align-items:start;gap:12px;min-height:calc(100svh - 0px);padding:2vh 0 calc(10vh + var(--safe-bottom))}

/* órbita */
.m-orbit{position:relative;width:min(92vw,560px);height:min(92vw,560px);margin:0 auto;transform:translateY(var(--system-offset-y))}
.m-sun{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:4}
.m-sun-core{width:140px;height:140px;border-radius:50%;background:radial-gradient(circle at 55% 45%,#fff 8%,#ffd06b 30%,#ff9a2e 57%,#ff7a00 75%,#0000 76%);
  box-shadow:0 0 22px rgba(255,169,64,.95),0 0 70px rgba(255,136,0,.65),0 0 120px color-mix(in oklab,var(--holo-primary) 60%, transparent);
  animation:sun-breathe 5.6s ease-in-out infinite alternate}
@keyframes sun-breathe{from{transform:scale(.985)}to{transform:scale(1.015)}}
.m-sun-halo{position:absolute;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,64,.35),rgba(255,170,64,.12) 40%,transparent 70%);filter:blur(12px);opacity:.9}
.m-sun-corona{position:absolute;width:360px;height:360px;border-radius:50%;
  background:conic-gradient(from 0deg,rgba(255,255,255,.06),rgba(255,255,255,.02) 10%,rgba(255,255,255,.08) 18%,rgba(255,255,255,.02) 28%,rgba(255,255,255,.06) 36%,rgba(255,255,255,.02) 48%,rgba(255,255,255,.08) 58%,rgba(255,255,255,.02) 70%,rgba(255,255,255,.06) 82%,rgba(255,255,255,.02) 94%,rgba(255,255,255,.06) 100%);
  mask-image:radial-gradient(circle,transparent 0%,transparent 35%,rgba(0,0,0,.85) 55%,rgba(0,0,0,1) 85%);filter:blur(2px);opacity:.45;animation:corona-spin 28s linear infinite}
@keyframes corona-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.m-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.m-ellipse{fill:none;stroke-linecap:round;vector-effect:non-scaling-stroke;stroke-width:1.35;stroke-dasharray:var(--dash,6 10)}
.m-ellipse.back{stroke:color-mix(in oklab,var(--orbit-stroke) 85%, transparent);opacity:.28;filter:drop-shadow(0 0 2px var(--holo-primary)) drop-shadow(0 0 6px var(--holo-glow))}
.m-ellipse.front{stroke:color-mix(in oklab,var(--holo-primary) 86%, white 10%);opacity:.95;filter:drop-shadow(0 0 6px var(--holo-primary)) drop-shadow(0 0 14px var(--holo-glow))}

/* planetas (sin animation: controlados por JS con offset-distance) */
.m-onpath{position:absolute;offset-distance:0%;offset-rotate:0deg;offset-anchor:50% 50%;-webkit-offset-anchor:50% 50%}
.m-planet{
  position:absolute;inset:0;border-radius:50%;isolation:isolate;overflow:hidden;
  box-shadow:0 0 calc(24px * var(--planet-glow)) var(--holo-primary),0 0 calc(64px * var(--planet-glow)) var(--holo-glow),inset 0 0 18px rgba(0,0,0,.45);
  background:
    radial-gradient(circle at 35% 30%,rgba(255,255,255,.65) 0%,rgba(255,255,255,.12) 16%,transparent 34%),
    radial-gradient(circle at 50% 55%,rgba(255,255,255,.15),rgba(255,255,255,.02) 60%,rgba(255,255,255,0) 70%),
    radial-gradient(circle at 50% 50%,rgba(255,255,255,.06),rgba(255,255,255,0) 70%),
    repeating-linear-gradient(to bottom,rgba(255,255,255,.08) 0px,rgba(255,255,255,.08) 1px,rgba(255,255,255,0) 2px,rgba(255,255,255,0) 4px);
  filter:drop-shadow(0 0 10px var(--holo-primary));
  border:none;padding:0;background-clip:padding-box;
  will-change:transform; transform:translateZ(0);
}
.m-onpath.sel .m-planet{           /* planeta seleccionado */
  box-shadow:
    0 0 calc(32px * var(--planet-glow)) var(--holo-primary),
    0 0 calc(90px * var(--planet-glow)) var(--holo-glow),
    inset 0 0 22px rgba(0,0,0,.55);
  transform: translateZ(0) scale(1.06);
}

/* retícula selección */
.reticle{position:absolute;inset:0;pointer-events:none}
.reticle .corner{position:absolute;width:16px;height:16px;border:1px solid var(--holo-secondary);box-shadow:0 0 8px var(--holo-primary)}
.corner.tl{top:-3px;left:-3px;border-right:0;border-bottom:0}
.corner.tr{top:-3px;right:-3px;border-left:0;border-bottom:0}
.corner.bl{bottom:-3px;left:-3px;border-right:0;border-top:0}
.corner.br{bottom:-3px;right:-3px;border-left:0;border-top:0}
.reticle .scan{position:absolute;left:2px;right:2px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:ret-scan 2.2s linear infinite;filter:drop-shadow(0 0 6px var(--holo-primary))}
@keyframes ret-scan{from{top:12%}to{top:88%}}

/* info */
.infoWrap{ padding:0 16px; transform: translateY(var(--info-offset-y)); }
.info{ min-height: var(--info-min-h); display:flex; flex-direction:column; align-items:center; text-align:center }
.info h3{ margin:0;color:var(--holo-primary);text-shadow:0 0 12px var(--holo-primary);font-size:1.35rem }
.info p{ margin:8px 0 0;opacity:.96;line-height:1.55 }

/* DOCK CTA FIJO */
.ctaDock{
  position: fixed;
  left: 0; right: 0;
  bottom: calc(var(--safe-bottom) + var(--cta-bottom));
  transform: translateY(var(--cta-offset-y));
  display: grid;
  grid-template-columns: auto minmax(180px, 56vw) auto;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  z-index: 7;
}
.navBtn{
  display:grid; place-items:center; width:42px; height:42px; border-radius:12px;
  background:transparent; border:1px solid color-mix(in oklab,var(--holo-primary) 70%,transparent);
  color:var(--holo-primary); box-shadow:0 0 10px var(--holo-glow);
}
.m-cta{
  display:block;width:100%; padding:12px 20px;border-radius:16px;text-decoration:none;color:#061018;font-weight:700; text-align:center;
  background:linear-gradient(180deg,color-mix(in oklab,var(--holo-primary) 65%,white 5%),color-mix(in oklab,var(--holo-primary) 40%,transparent));
  border:1px solid color-mix(in oklab,var(--holo-primary) 70%,transparent);
  box-shadow:0 0 12px var(--holo-primary),0 0 26px var(--holo-glow),inset 0 -8px 18px rgba(0,0,0,.15);
}
`

function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "origin-mobile-orbit-v6"
        if (!document.getElementById(id)) {
            const s = document.createElement("style")
            s.id = id
            s.textContent = CSS
            document.head.appendChild(s)
        }
    }, [])
}

/* estrellas */
type Star = {
    id: number
    size: number
    top: number
    left: number
    delay: number
    speed: number
}
const Stars: React.FC<{ count: number }> = React.memo(({ count }) => {
    const [stars, setStars] = useState<Star[]>([])
    useEffect(() => {
        const a: Star[] = []
        for (let i = 0; i < count; i++)
            a.push({
                id: i,
                size: Math.random() * 1.4 + 0.6,
                top: Math.random() * 100,
                left: Math.random() * 100,
                delay: Math.random() * 5,
                speed: 2 + Math.random() * 3,
            })
        setStars(a)
    }, [count])
    return (
        <div className="m-stars" aria-hidden>
            {stars.map((s) => (
                <div
                    key={s.id}
                    style={{
                        position: "absolute",
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        background: "white",
                        borderRadius: "50%",
                        opacity: 0.1,
                        animation: `tw ${s.speed}s infinite ${s.delay}s alternate ease-in-out`,
                        top: `${s.top}%`,
                        left: `${s.left}%`,
                        boxShadow: `0 0 ${s.size * 2}px ${s.size * 0.5}px rgba(255,255,255,0.4)`,
                    }}
                />
            ))}
        </div>
    )
})
Stars.displayName = "Stars"

/* util */
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
    `M ${cx - rx}, ${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0`

type PlanetCfg = {
    id: string
    size: number
    title: string
    desc: string
    link: string
    targetBlank: boolean
    orbitDuration: number
    active: boolean
}

/* API de órbita para vecino CCW/CW */
type OrbitApi = {
    getNeighbor: (currentIndex: number | null, dir: 1 | -1) => number | null
}

type Props = {
    bgColor?: string
    textColor?: string
    accentColor?: string
    numStars?: number

    heroTitleImage?: string
    heroTitleImageHeight?: number
    heroTitleText?: string
    heroSubtitleText?: string
    titleTopOffsetPx?: number

    orbitDash?: string
    orbitTilt?: number
    autoplaySpeed?: number // s (mantiene el loop automático)
    systemOffsetYPx?: number

    infoOffsetYPx?: number
    infoMinHeightPx?: number

    /* Dock CTA */
    ctaBottomPx?: number
    ctaOffsetYPx?: number

    inicioLink?: string
    fragmentosLink?: string
    librosLink?: string
    serviciosLink?: string
    afinacionesLink?: string
    musicaLink?: string

    p1_Size: number
    p1_Title: string
    p1_Desc: string
    p1_Link: string
    p1_TargetBlank: boolean
    p1_OrbitDuration: number
    p1_Active: boolean
    p2_Size: number
    p2_Title: string
    p2_Desc: string
    p2_Link: string
    p2_TargetBlank: boolean
    p2_OrbitDuration: number
    p2_Active: boolean
    p3_Size: number
    p3_Title: string
    p3_Desc: string
    p3_Link: string
    p3_TargetBlank: boolean
    p3_OrbitDuration: number
    p3_Active: boolean
    p4_Size: number
    p4_Title: string
    p4_Desc: string
    p4_Link: string
    p4_TargetBlank: boolean
    p4_OrbitDuration: number
    p4_Active: boolean
}

export function OrigenMobile(props: Props) {
    useInjectCss()
    const {
        bgColor = "#000",
        textColor = "#E6F7EF",
        accentColor = "#00C2FF",
        numStars = 120,

        heroTitleImage,
        heroTitleImageHeight = 110,
        heroTitleText = "RED SOLAR VIVA",
        heroSubtitleText = "Irradiamos desde el eje. Campo de activación y resonancia para nodos solares.",
        titleTopOffsetPx = 64,

        orbitDash = "6 10",
        orbitTilt = 0.66,
        autoplaySpeed = 22,
        systemOffsetYPx = -18,

        infoOffsetYPx = 0,
        infoMinHeightPx = 220,

        ctaBottomPx = 16,
        ctaOffsetYPx = 0,

        inicioLink = "https://www.redsolarviva.com",
        fragmentosLink = "/fragmentosdelsol",
        librosLink = "/archivos",
        serviciosLink = "/resonancia",
        afinacionesLink = "https://www.redsolarviva.com/afinaciones",
        musicaLink = "https://open.spotify.com",

        p1_Size,
        p1_Title,
        p1_Desc,
        p1_Link,
        p1_TargetBlank,
        p1_OrbitDuration,
        p1_Active,
        p2_Size,
        p2_Title,
        p2_Desc,
        p2_Link,
        p2_TargetBlank,
        p2_OrbitDuration,
        p2_Active,
        p3_Size,
        p3_Title,
        p3_Desc,
        p3_Link,
        p3_TargetBlank,
        p3_OrbitDuration,
        p3_Active,
        p4_Size,
        p4_Title,
        p4_Desc,
        p4_Link,
        p4_TargetBlank,
        p4_OrbitDuration,
        p4_Active,
    } = props

    const { synced, accent } = useSolarTheme({ neonAccent: accentColor })
    const [menuOpen, setMenuOpen] = useState(false)

    const planets: PlanetCfg[] = useMemo(
        () => [
            {
                id: "libros",
                size: p1_Size,
                title: p1_Title,
                desc: p1_Desc,
                link: p1_Link,
                targetBlank: p1_TargetBlank,
                orbitDuration: p1_OrbitDuration,
                active: p1_Active,
            },
            {
                id: "servicios",
                size: p2_Size,
                title: p2_Title,
                desc: p2_Desc,
                link: p2_Link,
                targetBlank: p2_TargetBlank,
                orbitDuration: p2_OrbitDuration,
                active: p2_Active,
            },
            {
                id: "fragmentos",
                size: p3_Size,
                title: p3_Title,
                desc: p3_Desc,
                link: p3_Link,
                targetBlank: p3_TargetBlank,
                orbitDuration: p3_OrbitDuration,
                active: p3_Active,
            },
            {
                id: "musica",
                size: p4_Size,
                title: p4_Title,
                desc: p4_Desc,
                link: p4_Link,
                targetBlank: p4_TargetBlank,
                orbitDuration: p4_OrbitDuration,
                active: p4_Active,
            },
        ],
        [
            p1_Size,
            p1_Title,
            p1_Desc,
            p1_Link,
            p1_TargetBlank,
            p1_OrbitDuration,
            p1_Active,
            p2_Size,
            p2_Title,
            p2_Desc,
            p2_Link,
            p2_TargetBlank,
            p2_OrbitDuration,
            p2_Active,
            p3_Size,
            p3_Title,
            p3_Desc,
            p3_Link,
            p3_TargetBlank,
            p3_OrbitDuration,
            p3_Active,
            p4_Size,
            p4_Title,
            p4_Desc,
            p4_Link,
            p4_TargetBlank,
            p4_OrbitDuration,
            p4_Active,
        ]
    )

    const activePlanets = planets.filter((p) => p.active)

    /* selección (info oculta hasta tap) */
    const [sel, setSel] = useState<number | null>(null)

    /* fases distintas; influyen en posiciones iniciales */
    const phaseById: Record<string, number> = {
        servicios: 0.05,
        libros: 0.35,
        fragmentos: 0.62,
        musica: 0.82,
    }

    /* vars CSS */
    const rootVars: React.CSSProperties = {
        background: bgColor,
        color: textColor,
        ["--holo-primary" as any]: accent,
        ["--holo-secondary" as any]: accent,
        ["--orbit-stroke" as any]: withAlpha(accent, 0.45),
        ["--orbit-tilt" as any]: String(orbitTilt),
        ["--system-offset-y" as any]: `${systemOffsetYPx}px`,
        ["--title-top-offset" as any]: `${titleTopOffsetPx}px`,
        ["--info-offset-y" as any]: `${infoOffsetYPx}px`,
        ["--info-min-h" as any]: `${infoMinHeightPx}px`,
        ["--cta-bottom" as any]: `${ctaBottomPx}px`,
        ["--cta-offset-y" as any]: `${ctaOffsetYPx}px`,
        ["--planet-glow" as any]: "0.85",
    }

    /* vecindad angular CCW/CW expuesta por la órbita */
    const orbitCompRef = useRef<OrbitApi | null>(null)
    const goPrev = () => {
        const next = orbitCompRef.current?.getNeighbor(sel, -1)
        if (next !== null && next !== undefined) setSel(next)
    }
    const goNext = () => {
        const next = orbitCompRef.current?.getNeighbor(sel, +1)
        if (next !== null && next !== undefined) setSel(next)
    }

    /* cerrar info al tocar fuera de la órbita y del dock */
    const onRootTap = (
        e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>
    ) => {
        const target = e.target as HTMLElement
        if (target.closest(".m-orbit") || target.closest(".ctaDock")) return
        if (sel !== null) setSel(null)
    }

    return (
        <div
            className="m-root"
            style={rootVars}
            data-ready={synced ? "1" : "0"}
            onClick={onRootTap}
        >
            <Stars count={numStars} />

            {/* Menú FIXED */}
            {!menuOpen && (
                <button
                    aria-label="Abrir menú"
                    style={{
                        position: "fixed",
                        top: 12,
                        right: 12,
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                        background: "transparent",
                        border: "none",
                        zIndex: 10010,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(true)
                    }}
                >
                    <div style={{ display: "grid", gap: 5 }}>
                        <div
                            style={{
                                width: 18,
                                height: 2,
                                background: "#fff",
                                borderRadius: 2,
                            }}
                        />
                        <div
                            style={{
                                width: 18,
                                height: 2,
                                background: "#fff",
                                borderRadius: 2,
                            }}
                        />
                        <div
                            style={{
                                width: 18,
                                height: 2,
                                background: "#fff",
                                borderRadius: 2,
                            }}
                        />
                    </div>
                </button>
            )}

            {/* Header */}
            <header className="m-header">
                {heroTitleImage ? (
                    <>
                        <img
                            src={heroTitleImage}
                            alt="Título Origen"
                            style={{
                                height: heroTitleImageHeight,
                                width: "auto",
                                maxWidth: "92vw",
                                objectFit: "contain",
                                filter:
                                    `drop-shadow(0 0 8px ${withAlpha(accent, 0.6)}) ` +
                                    `drop-shadow(0 0 18px ${withAlpha(accent, 0.35)})`,
                            }}
                        />
                        {heroSubtitleText && (
                            <p
                                className="m-sub"
                                dangerouslySetInnerHTML={{
                                    __html: heroSubtitleText.replace(
                                        /\n/g,
                                        "<br/>"
                                    ),
                                }}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <motion.h1
                            className="m-title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.1 }}
                        >
                            {heroTitleText}
                        </motion.h1>
                        {heroSubtitleText && (
                            <p
                                className="m-sub"
                                dangerouslySetInnerHTML={{
                                    __html: heroSubtitleText.replace(
                                        /\n/g,
                                        "<br/>"
                                    ),
                                }}
                            />
                        )}
                    </>
                )}
            </header>

            {/* ESCENA */}
            <section className="m-scene" aria-label="Sistema Estelar">
                <SceneOrbit
                    ref={orbitCompRef}
                    planets={activePlanets}
                    phases={phaseById}
                    orbitDash={orbitDash}
                    orbitTilt={orbitTilt}
                    autoplaySpeed={autoplaySpeed}
                    onTap={(i) => setSel(i)} /* tap = seleccionar */
                    selectedIndex={sel}
                />

                {/* INFO + CTA: solo si hay selección */}
                {sel !== null && activePlanets[sel] && (
                    <>
                        <div className="infoWrap">
                            <div className="info">
                                <h3>{activePlanets[sel].title}</h3>
                                <p>{activePlanets[sel].desc}</p>
                            </div>
                        </div>

                        {/* DOCK fijo con flechas */}
                        <div
                            className="ctaDock"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="navBtn"
                                aria-label="Anterior"
                                onClick={goPrev}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24">
                                    <path
                                        d="M15 6 L9 12 L15 18"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>

                            <a
                                className="m-cta"
                                href={activePlanets[sel].link}
                                target={
                                    activePlanets[sel].targetBlank
                                        ? "_blank"
                                        : "_self"
                                }
                                rel="noopener noreferrer"
                            >
                                Ir al nodo →
                            </a>

                            <button
                                className="navBtn"
                                aria-label="Siguiente"
                                onClick={goNext}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24">
                                    <path
                                        d="M9 6 L15 12 L9 18"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* Overlay menú */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        style={{
                            position: "fixed",
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
                        }}
                        onClick={() => setMenuOpen(false)}
                        onWheel={(e) => e.preventDefault()}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        <button
                            aria-label="Cerrar menú"
                            style={{
                                position: "absolute",
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
                            }}
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
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 18,
                                    textAlign: "center",
                                }}
                            >
                                {/* Origen ACTIVO */}
                                <div
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: accent,
                                        textDecoration: "none",
                                        textShadow: `0 0 10px ${withAlpha(accent, 0.45)}`,
                                    }}
                                >
                                    Origen
                                </div>
                                <a
                                    href={fragmentosLink}
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: "#fff",
                                        textDecoration: "none",
                                    }}
                                >
                                    Fragmentos del Sol
                                </a>
                                <a
                                    href={librosLink}
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: "#fff",
                                        textDecoration: "none",
                                    }}
                                >
                                    Archivos
                                </a>
                                <a
                                    href={serviciosLink}
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: "#fff",
                                        textDecoration: "none",
                                    }}
                                >
                                    Sesiones 1-1
                                </a>
                                <a
                                    href={afinacionesLink}
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: "#fff",
                                        textDecoration: "none",
                                    }}
                                >
                                    Afinaciones
                                </a>
                                <a
                                    href={musicaLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: 20,
                                        letterSpacing: ".02em",
                                        color: "#fff",
                                        textDecoration: "none",
                                    }}
                                >
                                    Música
                                </a>

                                <SolarThemeToggle
                                    showLabel={true}
                                    width={78}
                                    height={36}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ───────── órbita con z-sorting, swipe bidireccional y API de vecino angular ───────── */
const SceneOrbit = forwardRef<
    OrbitApi,
    {
        planets: PlanetCfg[]
        phases: Record<string, number>
        orbitDash: string
        orbitTilt: number
        autoplaySpeed: number
        onTap: (idx: number) => void
        selectedIndex: number | null
    }
>(function SceneOrbit(
    {
        planets,
        phases,
        orbitDash,
        orbitTilt,
        autoplaySpeed,
        onTap,
        selectedIndex,
    },
    ref
) {
    const areaRef = useRef<HTMLDivElement>(null)
    const planetRefs = useRef<HTMLDivElement[]>([])
    useEffect(() => {
        planetRefs.current = planetRefs.current.slice(0, planets.length)
    }, [planets.length])

    const [vb, setVb] = useState({ w: 360, h: 360 })
    useEffect(() => {
        const el = areaRef.current
        if (!el) return
        const update = () => setVb({ w: el.clientWidth, h: el.clientHeight })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const size = Math.max(vb.w, vb.h)
    const cx = size / 2,
        cy = size / 2
    const ry = (r: number) => r * (orbitTilt || 0.66)

    const SUN_R = 70
    const ringRMax = Math.min(vb.w, vb.h) / 2 - 36
    const minR =
        (SUN_R + maxSize(planets) / 2 + 18) / Math.max(orbitTilt || 0.66, 0.35)
    const rx = Math.min(ringRMax, Math.max(minR, ringRMax))
    const pathD = ellipsePath(cx, cy, rx, ry(rx))

    const baseOnPath = (p: PlanetCfg, i: number): React.CSSProperties => {
        const st: React.CSSProperties = {
            offsetPath: `path('${pathD}')`,
            width: p.size,
            height: p.size,
            willChange: "transform",
            transform: "translateZ(0)",
        }
        ;(st as any).WebkitOffsetPath = `path('${pathD}')`
        ;(st as any).offsetRotate = "0deg"
        ;(st as any).WebkitOffsetRotate = "0deg"
        ;(st as any).offsetDistance = "0%"
        ;(st as any).WebkitOffsetDistance = "0%"
        return st
    }

    /** ================== MOTOR JS (auto + swipe) ================== */
    // fases iniciales por planeta
    const phases0 = useMemo(
        () =>
            planets.map(
                (p, i) => phases[p.id] ?? i / Math.max(planets.length, 1)
            ),
        [planets, phases]
    )

    // velocidades (fracción de órbita por segundo)
    const speeds = useMemo(
        () => planets.map((p) => 1 / Math.max(0.01, p.orbitDuration || 30)),
        [planets]
    )

    // tiempo base y shift acumulado (por swipes anteriores)
    const t0Ref = useRef<number>(performance.now())
    const shiftRef = useRef<number>(0) // fracción [0,1)
    const dragRef = useRef<number>(0) // fracción temporal mientras se arrastra
    const animRaf = useRef<number>(0)

    // factor px -> fracción de órbita (aprox con circunferencia circular)
    const phasePerPx = 2 * Math.PI * rx > 0 ? 1 / (2 * Math.PI * rx) : 1 / 600

    // bucle de animación
    useEffect(() => {
        let last = performance.now()
        const tick = () => {
            const now = performance.now()
            const elapsed = (now - t0Ref.current) / 1000 // s
            // escribir offset-distance por planeta
            planets.forEach((p, i) => {
                const el = planetRefs.current[i]
                if (!el) return
                // progreso: fase inicial + t*speed + shift acumulado + drag en vivo
                let prog =
                    phases0[i] +
                    elapsed * speeds[i] +
                    shiftRef.current +
                    dragRef.current
                prog = prog - Math.floor(prog) // wrap [0,1)
                const pct = `${(prog * 100).toFixed(4)}%`
                el.style.setProperty("offset-distance", pct)
                el.style.setProperty("-webkit-offset-distance", pct)
            })
            // z-sorting continuo
            const area = areaRef.current
            if (area) {
                const rect = area.getBoundingClientRect()
                const midY = rect.top + rect.height / 2
                for (const el of planetRefs.current) {
                    if (!el) continue
                    const r = el.getBoundingClientRect()
                    const centerY = r.top + r.height / 2
                    el.style.zIndex = centerY > midY ? "6" : "2" // delante / detrás del Sol
                }
            }

            last = now
            animRaf.current = requestAnimationFrame(tick)
        }
        animRaf.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animRaf.current)
    }, [planets.length, phases0, speeds, rx])

    // --- Swipe orbital control mejorado ---
    const dragging = useRef(false)
    const startX = useRef(0)
    const moved = useRef(false)

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = e.currentTarget as HTMLElement
        if (!(e.target as HTMLElement).closest(".m-orbit")) return
        dragging.current = true
        moved.current = false
        startX.current = e.clientX
        e.preventDefault() // 🚫 bloquea scroll horizontal/navegación
        e.stopPropagation()
        el.setPointerCapture?.(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return
        e.preventDefault() // 🚫 mantiene bloqueado mientras arrastras
        const dx = e.clientX - startX.current
        dragRef.current = dx * phasePerPx
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return
        e.preventDefault()
        dragging.current = false
        shiftRef.current = (shiftRef.current + dragRef.current) % 1
        if (shiftRef.current < 0) shiftRef.current += 1
        dragRef.current = 0
    }

    /* 🔧 Fallback para dispositivos touch viejos (iOS pre-PointerEvents) */
    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        dragging.current = true
        startX.current = e.touches[0].clientX
        e.preventDefault()
        e.stopPropagation()
    }
    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragging.current) return
        e.preventDefault()
        const dx = e.touches[0].clientX - startX.current
        dragRef.current = dx * phasePerPx
    }
    const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragging.current) return
        e.preventDefault()
        dragging.current = false
        shiftRef.current = (shiftRef.current + dragRef.current) % 1
        if (shiftRef.current < 0) shiftRef.current += 1
        dragRef.current = 0
    }

    useEffect(() => {
        const el = areaRef.current
        if (!el) return
        const onCancel = () => {
            if (!dragging.current) return
            dragging.current = false
            shiftRef.current = (shiftRef.current + dragRef.current) % 1
            if (shiftRef.current < 0) shiftRef.current += 1
            dragRef.current = 0
        }
        el.addEventListener("pointercancel", onCancel)
        return () => el.removeEventListener("pointercancel", onCancel)
    }, [])

    /* API: vecino CCW/CW según ángulo actual */
    useImperativeHandle(
        ref,
        () => ({
            getNeighbor(currentIndex, dir) {
                const area = areaRef.current
                if (!area || planets.length === 0) return currentIndex ?? 0

                const r = area.getBoundingClientRect()
                const cx = r.left + r.width / 2
                const cy = r.top + r.height / 2

                const angles = planetRefs.current.map((el, i) => {
                    if (!el) return { i, ang: 0 }
                    const b = el.getBoundingClientRect()
                    const x = b.left + b.width / 2
                    const y = b.top + b.height / 2
                    const dx = x - cx
                    const dy = -(y - cy) // eje Y hacia arriba
                    const a = Math.atan2(dy, dx) // [-π, π]
                    const ang = (a + Math.PI * 2) % (Math.PI * 2) // [0, 2π)
                    return { i, ang }
                })

                const order = angles
                    .sort((p, q) => p.ang - q.ang)
                    .map((o) => o.i)
                if (order.length === 0) return currentIndex ?? 0

                if (currentIndex == null) return order[0]
                const pos = order.indexOf(currentIndex)
                if (pos === -1) return order[0]
                const nextPos =
                    (pos + (dir === 1 ? 1 : -1) + order.length) % order.length
                return order[nextPos]
            },
        }),
        [planets.length]
    )

    return (
        <div
            className="m-orbit"
            ref={areaRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) =>
                e.stopPropagation()
            } /* evita cerrar info al tocar dentro */
        >
            {/* órbita detrás */}
            <svg
                className="m-svg"
                style={{ zIndex: 1 }}
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
            >
                <path
                    className="m-ellipse back"
                    d={pathD}
                    pathLength={1000}
                    style={{ ["--dash" as any]: orbitDash }}
                />
            </svg>

            {/* Sol */}
            <div className="m-sun" style={{ zIndex: 4 }}>
                <div className="m-sun-corona" />
                <div className="m-sun-halo" />
                <div className="m-sun-core" />
            </div>

            {/* órbita delante */}
            <svg
                className="m-svg"
                style={{ zIndex: 5 }}
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
            >
                <path
                    className="m-ellipse front"
                    d={pathD}
                    pathLength={1000}
                    style={{ ["--dash" as any]: orbitDash }}
                />
            </svg>

            {/* planetas (tap para seleccionar) */}
            {planets.map((p, i) => (
                <div
                    key={p.id}
                    className={`m-onpath ${selectedIndex === i ? "sel" : ""}`}
                    ref={(el) => {
                        if (el) planetRefs.current[i] = el
                    }}
                    style={baseOnPath(p, i)}
                >
                    <button
                        className="m-planet"
                        aria-label={p.title}
                        onClick={(e) => {
                            e.stopPropagation()
                            onTap(i)
                        }}
                    />
                    {selectedIndex === i && (
                        <div className="reticle" aria-hidden="true">
                            <span className="corner tl" />
                            <span className="corner tr" />
                            <span className="corner bl" />
                            <span className="corner br" />
                            <span className="scan" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
})

function maxSize(planets: PlanetCfg[]) {
    return planets.reduce((m, p) => Math.max(m, p.size || 0), 0) || 0
}

/* defaults */
OrigenMobile.defaultProps = {
    bgColor: "#000000",
    textColor: "#E6F7EF",
    accentColor: "#00C2FF",
    numStars: 120,

    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText:
        "Irradiamos desde el eje. Campo de activación y resonancia para nodos solares.",
    heroTitleImage: undefined,
    heroTitleImageHeight: 110,
    titleTopOffsetPx: 64,

    orbitDash: "6 10",
    orbitTilt: 0.66,
    autoplaySpeed: 22,
    systemOffsetYPx: -18,

    infoOffsetYPx: 0,
    infoMinHeightPx: 220,

    ctaBottomPx: 16,
    ctaOffsetYPx: 0,

    inicioLink: "https://www.redsolarviva.com",
    fragmentosLink: "/fragmentosdelsol",
    librosLink: "/archivos",
    serviciosLink: "/resonancia",
    afinacionesLink: "https://www.redsolarviva.com/afinaciones",
    musicaLink: "https://open.spotify.com",

    /* 4 activos por defecto */
    p1_Size: 80,
    p1_Title: "Archivos",
    p1_Desc:
        "Geometrías vivas en forma de palabra. Pulsos de la conciencia encarnados.",
    p1_Link: "https://www.redsolarviva.com/archivos",
    p1_TargetBlank: false,
    p1_OrbitDuration: 30,
    p1_Active: true,

    p2_Size: 76,
    p2_Title: "Servicios",
    p2_Desc: "Acompañamiento y recalibración vibral para nodos en activación.",
    p2_Link: "https://www.redsolarviva.com/resonancia",
    p2_TargetBlank: false,
    p2_OrbitDuration: 37.5,
    p2_Active: true,

    p3_Size: 72,
    p3_Title: "Fragmentos del Sol",
    p3_Desc:
        "Episodios de pulsos visuales y sonoros para la activación del campo.",
    p3_Link: "https://www.redsolarviva.com/fragmentosdelsol",
    p3_TargetBlank: false,
    p3_OrbitDuration: 45,
    p3_Active: true,

    p4_Size: 88,
    p4_Title: "Música",
    p4_Desc:
        "Pineal Scores. Frecuencias armónicas y resonantes para el campo interno.",
    p4_Link:
        "https://open.spotify.com/artist/6BSsXgmAnoie8tUgLtIbqb?si=VJT309OiRvGk7N1hPdDXJg",
    p4_TargetBlank: true,
    p4_OrbitDuration: 52.5,
    p4_Active: true,
}

/* property controls */
addPropertyControls(OrigenMobile, {
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#E6F7EF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento Neón",
        defaultValue: "#00C2FF",
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 120,
        min: 0,
        max: 500,
        step: 10,
    },

    heroTitleImage: { type: ControlType.Image, title: "Título PNG" },
    heroTitleImageHeight: {
        type: ControlType.Number,
        title: "Título Alto (px)",
        defaultValue: 110,
        min: 40,
        max: 400,
        step: 2,
        hidden: (p) => !p.heroTitleImage,
    },
    heroTitleText: { type: ControlType.String, title: "Título" },
    heroSubtitleText: { type: ControlType.String, title: "Subtítulo", rows: 3 },
    titleTopOffsetPx: {
        type: ControlType.Number,
        title: "Título offset Y (px)",
        defaultValue: 64,
        min: -80,
        max: 240,
        step: 2,
    },

    orbitDash: {
        type: ControlType.String,
        title: "Orbit Dash",
        defaultValue: "6 10",
    },
    orbitTilt: {
        type: ControlType.Number,
        title: "Tilt 3D (0–1)",
        defaultValue: 0.66,
        min: 0.3,
        max: 1,
        step: 0.01,
    },
    autoplaySpeed: {
        type: ControlType.Number,
        title: "Autoplay (s)",
        defaultValue: 22,
        min: 6,
        max: 90,
        step: 1,
    },
    systemOffsetYPx: {
        type: ControlType.Number,
        title: "Sistema offset Y (px)",
        defaultValue: -18,
        min: -200,
        max: 200,
        step: 2,
    },

    infoOffsetYPx: {
        type: ControlType.Number,
        title: "Info offset Y (px)",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 2,
    },
    infoMinHeightPx: {
        type: ControlType.Number,
        title: "Info alto mínimo (px)",
        defaultValue: 220,
        min: 120,
        max: 420,
        step: 5,
    },

    ctaBottomPx: {
        type: ControlType.Number,
        title: "CTA bottom (px)",
        defaultValue: 16,
        min: 0,
        max: 120,
        step: 1,
    },
    ctaOffsetYPx: {
        type: ControlType.Number,
        title: "CTA offset Y (px)",
        defaultValue: 0,
        min: -160,
        max: 160,
        step: 1,
    },

    p1_Size: {
        type: ControlType.Number,
        title: "P1 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p1_Title: { type: ControlType.String, title: "P1 Título" },
    p1_Desc: { type: ControlType.String, title: "P1 Desc", rows: 3 },
    p1_Link: { type: ControlType.String, title: "P1 Link" },
    p1_TargetBlank: { type: ControlType.Boolean, title: "P1 Nuevo Tab" },
    p1_OrbitDuration: {
        type: ControlType.Number,
        title: "P1 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p1_Active: {
        type: ControlType.Boolean,
        title: "P1 Activo",
        defaultValue: true,
    },

    p2_Size: {
        type: ControlType.Number,
        title: "P2 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p2_Title: { type: ControlType.String, title: "P2 Título" },
    p2_Desc: { type: ControlType.String, title: "P2 Desc", rows: 3 },
    p2_Link: { type: ControlType.String, title: "P2 Link" },
    p2_TargetBlank: { type: ControlType.Boolean, title: "P2 Nuevo Tab" },
    p2_OrbitDuration: {
        type: ControlType.Number,
        title: "P2 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p2_Active: {
        type: ControlType.Boolean,
        title: "P2 Activo",
        defaultValue: true,
    },

    p3_Size: {
        type: ControlType.Number,
        title: "P3 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p3_Title: { type: ControlType.String, title: "P3 Título" },
    p3_Desc: { type: ControlType.String, title: "P3 Desc", rows: 3 },
    p3_Link: { type: ControlType.String, title: "P3 Link" },
    p3_TargetBlank: { type: ControlType.Boolean, title: "P3 Nuevo Tab" },
    p3_OrbitDuration: {
        type: ControlType.Number,
        title: "P3 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p3_Active: {
        type: ControlType.Boolean,
        title: "P3 Activo",
        defaultValue: true,
    },

    p4_Size: {
        type: ControlType.Number,
        title: "P4 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p4_Title: { type: ControlType.String, title: "P4 Título" },
    p4_Desc: { type: ControlType.String, title: "P4 Desc", rows: 3 },
    p4_Link: { type: ControlType.String, title: "P4 Link" },
    p4_TargetBlank: { type: ControlType.Boolean, title: "P4 Nuevo Tab" },
    p4_OrbitDuration: {
        type: ControlType.Number,
        title: "P4 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p4_Active: {
        type: ControlType.Boolean,
        title: "P4 Activo",
        defaultValue: true,
    },
})
