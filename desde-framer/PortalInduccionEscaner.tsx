// Red Solar Viva — PortalInduccionEscaner.tsx v2.14
// v2.11 — Fase 6a (2026-05-12). `navigateTo` intercepta las rutas
// /escaner y /radar y las manda al subdomain canónico
// `https://escaner.redsolarviva.com${ruta}`. Los CTAs "Iniciar
// diagnóstico" y "Activar el Escáner" llevan al Tripulante directo
// a la app real (escaner-app/Vercel). Las rutas internas /escaner/*
// del Framer siguen vivas para validación manual de Zak'Haar pero
// ya no se acceden desde la landing pública. Sintonía Solar
// (`/sesiones`) sigue navegando in-app porque vive en el nodo
// madre.
// v2.10 — Botón "Explorar" del hero ya no oculta el hexágono.
// Antes hacía scrollTo("que-es") que saltaba a la siguiente
// sección y el radar quedaba fuera del viewport. Ahora apunta
// a "hero-stats" (la fila 6 PILARES · CICLO · ESCALA dentro
// del propio hero) — el scroll deja los chips al top del
// viewport y el hexágono I.S. 72 visible debajo, con la
// sección QUÉ ES apenas asomada al fondo. La sensación: bajar
// para ver el radar en contexto, no para abandonarlo.
// v2.9 — Introducción formal del nombre "Radar" como la pantalla
// principal del Escáner Vibracional. La app entera se llama Escáner
// (vive en /escaner); el Radar es esa pantalla específica con el
// hexágono de seis vértices que devuelve el Índice de Luz.
// Tres puntos del copy ahora capitalizan "Radar" como sustantivo
// propio para que el tripulante absorba la distinción semántica:
//   · Qué Es → "el Radar — un hexágono de seis vértices —"
//   · Cómo se vive → "El Radar destila tu Índice de Luz"
//   · Beneficios → "El Radar hexagonal reemplaza las listas de
//     chequeo"
// El nombre "Escáner Vibracional" se mantiene en su rol de marca
// del producto; "Radar" sólo aplica cuando hablamos de la pantalla.
// v2.8 — Sección
// Decodificador de Materia ampliada: ahora menciona productos
// (no solo alimentos), escaneo de etiquetas y entrada por texto
// como las tres vías reales que acepta el componente. FAQ
// "¿Cómo funciona técnicamente?" actualizada con la opción
// texto. Fix de "Fotografiás" → "Fotografías" y "recibís" →
// "recibes" — argentinismos residuales que escaparon de v2.7.)
// PortalInduccionEscaner.tsx v2.7 (Argentinismos
// erradicados — español neutro/mexicano. "Decodificás" → "Decodificas",
// "Comandás" → "Comandas", "cancelás" → "cancelas", "Iniciá" → "Inicia",
// "Podés" → "Puedes", "te movés" → "te mueves", "activás" → "activas".
// Quitada la frase "Tapeá la tarjeta o deslizá hacia los lados para
// avanzar." del bloque de flujo — el carrusel ya se entiende sin
// instrucción explícita.)
// PortalInduccionEscaner.tsx v2.6 (Layout desktop ocupa todo el ancho + cards Sintonia mas vivos + trazos del MiniRadar reforzados. (1) Carruseles de "Los seis pilares del Avatar" y "Lo que cambia en tu dia" en desktop ahora son grid 3x2 que llena toda la seccion sin recortar cards laterales. Mobile sigue con HorizontalCarousel. (2) Card 1 de Sintonia Solar (precio): background con triple radial gradient — cyan glow desde top + dorado tenue desde bottom-right + base profunda azul oscuro. boxShadow exterior 30px cyan + interior glow. (3) Card 2 (Que incluye): background degradado con cyan glow desde top-left + cyan ligero desde bottom-right. (4) MiniRadarHexagonal del hero (I.S. 72): rings outer 0.16 -> 0.55 + glow 6px + strokeWidth 0.8 -> 1.6, intermedios subidos a 0.22-0.34. Ejes 0.12 -> 0.32 con glow 2px. Polygon del Indice fill 0.12 -> 0.2 + stroke 1.5 -> 2.2 + glow 8px. Vertex circles r 4 -> 5 + glow 6 -> 9px. Centro IS72 fontWeight 300 -> 350 + glow 6 -> 10px. (5) Texto del Portal de Induccion empieza ahora directo en "El Escaner Vibracional es una terminal de diagnostico..." sin el preambulo "no es una app de habitos".)
// v2.4 — Pulido fino.
// (1) ScrollToTopButton fixed bottom-right que se fade-in cuando el
// usuario se alejó > 320px del tope; click vuelve al top con smooth
// scroll. Mismo patrón que el Observatorio / Códices / Sesiones.
// (2) CtaFinalSection con alineación a la izquierda para consistencia
// con el resto de secciones (antes estaba centrado). El hexágono +
// título + párrafo + botón pasan al flow izquierdo.
// (3) Pipeline técnico del Decodificador en mobile ahora es carousel
// horizontal (flechas + dots) en vez de 4 filas apiladas. En desktop
// sigue grid de 4 columnas. Se extrajo PIPELINE_PASOS + PipelinePasoCard
// para reutilizar el mismo layout en ambas vistas.
// (4) HorizontalCarousel: padding interno generoso (24/32 arriba/abajo
// + 4 laterales) para que los box-shadow de las cards no se corten
// contra el borde del contenedor. Se removió el juego de margin
// negativo + padding que generaba el corte visual en Beneficios.
//
// v2.3 — Cambios grandes de copy + estructura.
// (1) Copys de Hero/Qué es/Quote actualizados: "biológica y energética"
// (no espiritual), "estado de fricción cero", "la energética" (no "de
// expansión") como 5a dimensión, "con cuánta coherencia estás viviendo",
// "Al realizar tu escaneo el sistema activa..." (no "Si caes por debajo
// del punto neutro"), y la quote corta "Medimos resonancia. Y la
// resonancia se puede reingeniar.".
// (2) Pilares: ahora carousel horizontal deslizable con flechas + dots
// (antes grid 3×2 que ocupaba mucha altura). Componente HorizontalCarousel
// reutilizable.
// (3) Cómo funciona: single-card con tap-to-advance + swipe + loop. El
// tripulante tapea la tarjeta (o desliza) para pasar 01 → 02 → 03 → 01.
// (4) Decodificador: foco solo en INGREDIENTES (no fruta entera / etiqueta
// / plato). Se removió "cruza con la base cuántica de Zak'Haar". Se
// agregó "El Decodificador de Materia mide resonancia." Se eliminó el
// mock de dictamen. Fricción Energética sin guión. Pipeline técnico:
// "Fotografiás los ingredientes", "Escaneo cuántico", "Traducción
// vibracional — el Decodificador traduce la energía", "Dictamen".
// (5) Orden: Protocolos ahora va ANTES de Decodificador (es parte del
// radar principal, no mezcla conceptos).
// (6) Protocolos quirúrgicos: sin las 3 tarjetas (Hardware/Procesador/
// Motor). Un único bloque cinemático centrado con ondas concéntricas
// pulsantes (<PulsoOndas/>) + copy directo en 2 frases + sello final
// "El sistema comanda.".
// (7) Beneficios: ahora carousel horizontal en una sola fila. Quitamos
// "No vendemos promesas". Mismas 6 cards pero deslizables.
// (8) Sintonía Solar: 2 tarjetas separadas. Card 1 = precio ($777 MXN)
// + CTA "Activar Sintonía Solar" centrados. Card 2 = "Qué incluye" con
// la lista de privilegios.
// (9) FAQ título: "Antes de escanear" → "Antes de iniciar".
//
// v2.2 — Cards con vida: Pilares, Pasos del flujo, Protocolos
// Quirúrgicos y Beneficios reciben gradientes radiales tintados con
// el color de su elemento + boxShadow interno + aura en esquina. Copy:
// "168 h" → "7 D". Sintonía sin Canal de Emisión Directa; Mi Núcleo
// renombrado a Trayectoria del Avatar. Footer compacto.
//
// v2.1 — Fix crítico de scroll. El Domo envuelve con overflow:hidden,
// así que la landing no podía scrollear. Ahora .rsv-portal-root tiene
// height:100vh + overflow-y:auto. minHeight del Hero en mobile a auto.
// v2.2 — (1) Cards con vida: Pilares, Pasos del flujo, Protocolos
// Quirúrgicos y Beneficios reciben gradientes radiales tintados con
// el color de su elemento + boxShadow interno sutil + aura en una
// esquina. Los números 01/02/03 del flujo usan gradient-text. (2) Los
// beneficios alternan tinta cyan/dorada para romper monotonía. (3)
// Copy: "168 h" / "168 horas" → "7 D" / "7 días" en todas partes — más
// legible para el tripulante. (4) Sintonía Solar: se quita "Canal de
// Emisión Directa" del pricing; "Mi Núcleo — historial" se renombra
// a "Trayectoria del Avatar — historial completo de tu evolución"
// (Mi Núcleo es el perfil personal del tripulante, no un beneficio
// diferenciado). (5) Footer con padding bottom 80→24 para cerrar la
// página cerca del borde inferior sin franja vacía.
//
// v2.1 — Fix crítico de scroll. El Domo envuelve todas las capas con
// overflow:hidden, así que la landing no podía scrollear: el Hero era
// la única vista visible. Ahora .rsv-portal-root tiene height:100vh +
// overflow-y:auto (mismo patrón del Observatorio) y el scrollTo del
// botón Explorar scrollea el propio root. El minHeight del Hero en
// mobile baja a auto — antes se tragaba toda la pantalla y el radar
// quedaba cortado abajo sin forma de pasar a las secciones siguientes.
//
// v2.0 — Portal de Inducción del Escáner Vibracional (capa /radar).
// Reescrito desde cero. Tipo fachada pública / landing page App-Store-grade.
// Explica qué es el Escáner, los 6 Pilares, el Índice de Luz, los
// Protocolos Quirúrgicos, el Decodificador de Materia y la Sintonía Solar.
// Single codebase — transmuta mobile ↔ Centro de Mando sin dividirse.

import * as React from "react"
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ════════════════════════════════════════════════════════════════
   Utilidades / detección móvil
   ════════════════════════════════════════════════════════════════ */
function useIsMobile() {
    const get = () => {
        if (typeof window === "undefined") return false
        const ua = navigator.userAgent
        if (/iPhone|iPod|Android[\s\S]*?Mobile/i.test(ua)) return true
        return window.innerWidth < 820
    }
    const [m, setM] = useState(get)
    useEffect(() => {
        const onResize = () => setM(get())
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])
    return m
}

function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

/* ════════════════════════════════════════════════════════════════
   Paleta
   ════════════════════════════════════════════════════════════════ */
const GOLD = "#D4A843"
const GOLD_SOFT = "#E8C65A"
const GOLD_DEEP = "#9A7828"
const CYAN = "#00C2FF"
const CYAN_SOFT = "#7FDCFF"
const WHITE = "#E8EEF7"
const MUTED = "rgba(220,230,245,0.55)"
const BORDER_SOFT = "rgba(0,194,255,0.16)"
const BG_GLASS =
    "linear-gradient(160deg, rgba(8,18,36,0.72) 0%, rgba(4,10,22,0.82) 100%)"

/* Colores por Pilar — misma paleta que usa el Escáner. */
interface PilarDef {
    id: string
    nombre: string
    subtitulo: string
    descripcion: string
    color: string
    colorRgb: string
    glyph: string // símbolo hex sutil (unicode)
}
const PILARES: PilarDef[] = [
    {
        id: "hardware",
        nombre: "HARDWARE",
        subtitulo: "Físico",
        descripcion:
            "Termodinámica del contenedor biológico — ayuno, movimiento, ignición al despertar.",
        color: "#D4A843",
        colorRgb: "212,168,67",
        glyph: "☀",
    },
    {
        id: "procesador",
        nombre: "PROCESADOR",
        subtitulo: "Mental",
        descripcion:
            "Ancho de banda y pureza del enfoque — dopamina, ansiedad, calidad de decisión.",
        color: "#00C2FF",
        colorRgb: "0,194,255",
        glyph: "◈",
    },
    {
        id: "motor",
        nombre: "MOTOR",
        subtitulo: "Emocional",
        descripcion:
            "Soberanía y contención — reactividad, validación externa, alquimia del dolor.",
        color: "#FF6B8A",
        colorRgb: "255,107,138",
        glyph: "❂",
    },
    {
        id: "gravedad",
        nombre: "GRAVEDAD",
        subtitulo: "Financiera",
        descripcion:
            "Flujo de materialización — miedo al pago, magnetismo de ingreso, patrones de escasez.",
        color: "#7AD27A",
        colorRgb: "122,210,122",
        glyph: "✦",
    },
    {
        id: "vector",
        nombre: "VECTOR",
        subtitulo: "De Expansión",
        descripcion:
            "Impulso vital — ¿estás viviendo tus sueños o los de otros? Dirección que tomaste vs la que elegirías.",
        color: "#9A6CE6",
        colorRgb: "154,108,230",
        glyph: "▲",
    },
    {
        id: "orbita",
        nombre: "ÓRBITA",
        subtitulo: "Relacional",
        descripcion:
            "Campo relacional — calidad de vínculos, quién te drena, quién te expande, soberanía.",
        color: "#00D4C8",
        colorRgb: "0,212,200",
        glyph: "◉",
    },
]

/* ════════════════════════════════════════════════════════════════
   CSS inline — injection
   ════════════════════════════════════════════════════════════════ */
const PORTAL_CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');

.rsv-portal-root {
    /* v2.1 — el Domo envuelve todas las capas con overflow:hidden, así
       que el scroll de la landing tiene que vivir acá adentro. Fijamos
       height:100vh + overflow-y:auto con overscroll contenido. Las
       estrellas del Domo se ven igual porque el background es
       transparente. Mismo patrón que .obs-root del Observatorio. */
    position: relative;
    height: 100vh;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    background: transparent;
    font-family: 'Inter', sans-serif;
    color: #E8EEF7;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.rsv-portal-root::-webkit-scrollbar { display: none; }

/* Shimmer sutil para cards doradas */
@keyframes rsv-shimmer {
    0% { background-position: 200% 50%; }
    100% { background-position: -200% 50%; }
}
.rsv-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    border-radius: inherit;
    overflow: hidden;
    background: linear-gradient(115deg, transparent 30%, rgba(200,164,78,0.06) 44%, rgba(255,255,255,0.04) 50%, rgba(200,164,78,0.07) 56%, transparent 70%);
    background-size: 300% 100%;
    animation: rsv-shimmer 14s ease-in-out infinite;
}
.rsv-shimmer-cyan {
    background: linear-gradient(115deg, transparent 30%, rgba(0,194,255,0.06) 44%, rgba(255,255,255,0.04) 50%, rgba(0,194,255,0.07) 56%, transparent 70%);
    background-size: 300% 100%;
    animation: rsv-shimmer 14s ease-in-out infinite;
}

/* Hexágono pulsante del Hero */
@keyframes rsv-hex-pulse {
    0%, 100% { filter: drop-shadow(0 0 22px rgba(200,164,78,0.35)); }
    50% { filter: drop-shadow(0 0 42px rgba(200,164,78,0.65)); }
}
.rsv-hex-pulse { animation: rsv-hex-pulse 5s ease-in-out infinite; }

/* Glow base de CTAs doradas */
.rsv-cta-gold {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: 14px;
    background: linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%);
    color: #0B0C13;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    outline: none;
    text-decoration: none;
    box-shadow: 0 8px 28px rgba(200,164,78,0.28), 0 0 48px rgba(200,164,78,0.10);
    transition: transform 0.25s cubic-bezier(.2,.9,.3,1.3), box-shadow 0.25s ease;
    font-family: inherit;
}
.rsv-cta-gold:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 34px rgba(200,164,78,0.36), 0 0 68px rgba(200,164,78,0.14);
}
.rsv-cta-ghost {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 28px;
    border-radius: 14px;
    background: rgba(0,194,255,0.05);
    border: 1px solid rgba(0,194,255,0.28);
    color: #7FDCFF;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    cursor: pointer;
    outline: none;
    text-decoration: none;
    transition: background 0.25s, border-color 0.25s, transform 0.25s;
    font-family: inherit;
}
.rsv-cta-ghost:hover {
    background: rgba(0,194,255,0.10);
    border-color: rgba(0,194,255,0.48);
    transform: translateY(-2px);
}

/* Card base */
.rsv-card {
    position: relative;
    border-radius: 22px;
    background: linear-gradient(160deg, rgba(8,18,36,0.72) 0%, rgba(4,10,22,0.82) 100%);
    border: 1px solid rgba(0,194,255,0.14);
    backdrop-filter: blur(16px) saturate(1.3);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    transition: border-color 0.35s, box-shadow 0.35s, transform 0.35s;
}
.rsv-card-hoverable:hover {
    border-color: rgba(0,194,255,0.32);
    transform: translateY(-3px);
    box-shadow: 0 24px 60px rgba(0,194,255,0.08);
}

/* Heading hairlines */
.rsv-kicker {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: rgba(0,194,255,0.72);
    padding-bottom: 2px;
    border-bottom: 1px solid rgba(0,194,255,0.24);
}
.rsv-kicker-gold {
    color: rgba(200,164,78,0.82);
    border-bottom-color: rgba(200,164,78,0.30);
}

/* Brand word */
.rsv-brand {
    font-size: 10.5px;
    font-weight: 400;
    letter-spacing: 0.48em;
    text-transform: uppercase;
    color: rgba(232,238,247,0.55);
    margin-bottom: 24px;
}

/* Título cinemático (gradient) */
.rsv-title-cine {
    font-size: clamp(44px, 7.4vw, 96px);
    font-weight: 200;
    letter-spacing: -0.02em;
    line-height: 1.02;
    margin: 0;
    background: linear-gradient(135deg, #F2E5B8 0%, #E8EEF7 40%, #7FDCFF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
}
.rsv-title-soft {
    font-size: clamp(30px, 4.4vw, 54px);
    font-weight: 200;
    letter-spacing: -0.01em;
    line-height: 1.08;
    color: #E8EEF7;
    margin: 0;
}
.rsv-para {
    font-size: clamp(14px, 1.25vw, 17px);
    font-weight: 300;
    line-height: 1.7;
    color: rgba(220,230,245,0.75);
    margin: 0;
    letter-spacing: 0.005em;
}
.rsv-para-muted { color: rgba(220,230,245,0.55); }
.rsv-quote {
    font-size: clamp(19px, 2.2vw, 28px);
    font-weight: 200;
    line-height: 1.38;
    color: #F2E5B8;
    letter-spacing: -0.004em;
    margin: 0;
    font-style: italic;
}

/* Divider */
.rsv-divider {
    width: 70px;
    height: 1px;
    background: linear-gradient(90deg, rgba(0,194,255,0.4) 0%, transparent 100%);
    border: none;
    margin: 0;
}
.rsv-divider-gold {
    background: linear-gradient(90deg, rgba(200,164,78,0.5) 0%, transparent 100%);
}

/* Scroll reveal wrapper */
@keyframes rsv-section-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

/* FAQ item */
.rsv-faq-item {
    border-top: 1px solid rgba(0,194,255,0.10);
    cursor: pointer;
    transition: background 0.3s;
}
.rsv-faq-item:hover { background: rgba(0,194,255,0.03); }
.rsv-faq-item:last-child { border-bottom: 1px solid rgba(0,194,255,0.10); }

/* Mock dictamen bar */
@keyframes rsv-bar-fill {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
}

/* Hide on mobile utility */
@media (max-width: 819px) {
    .rsv-hide-mobile { display: none !important; }
}
@media (min-width: 820px) {
    .rsv-hide-desktop { display: none !important; }
}
`

function useInjectPortalCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-portal-css-v2"
        const old = document.getElementById("rsv-portal-css-v1")
        if (old) old.remove()
        const existing = document.getElementById(id) as HTMLStyleElement | null
        if (existing) {
            existing.textContent = PORTAL_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = PORTAL_CSS
        document.head.appendChild(s)
    }, [])
}

/* ════════════════════════════════════════════════════════════════
   Iconos SVG
   ════════════════════════════════════════════════════════════════ */
function HexagonIcon({
    size = 44,
    color = GOLD,
    glyph,
    filled = false,
}: {
    size?: number
    color?: string
    glyph?: string
    filled?: boolean
}) {
    const r = size / 2 - 2
    const cx = size / 2
    const cy = size / 2
    const points = Array.from({ length: 6 })
        .map((_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 2
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        })
        .join(" ")
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ display: "block" }}
        >
            <polygon
                points={points}
                fill={filled ? hexToRgba(color, 0.08) : "none"}
                stroke={color}
                strokeWidth="1.4"
            />
            {glyph && (
                <text
                    x="50%"
                    y="54%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={size * 0.42}
                    fontWeight="300"
                    fontFamily="'Inter',sans-serif"
                >
                    {glyph}
                </text>
            )}
        </svg>
    )
}

function ArrowDownIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M7 2v10M3 8l4 4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ArrowRightIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M2 7h10M8 3l4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function PlusIcon({
    size = 14,
    rotate = 0,
}: {
    size?: number
    rotate?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
                transform: `rotate(${rotate}deg)`,
                transition: "transform 0.3s",
            }}
        >
            <path d="M7 2v10M2 7h10" strokeLinecap="round" />
        </svg>
    )
}

function CameraIcon({
    size = 22,
    color = GOLD,
}: {
    size?: number
    color?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
        >
            <path
                d="M5 8h2l2-3h6l2 3h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.5" />
        </svg>
    )
}

/* ════════════════════════════════════════════════════════════════
   Radar hexagonal (preview visual)
   ════════════════════════════════════════════════════════════════ */
function MiniRadarHexagonal({
    size = 280,
    values = [0.78, 0.62, 0.81, 0.52, 0.72, 0.68], // 6 pilares
    center = "I.S. 72",
}: {
    size?: number
    values?: number[]
    center?: string
}) {
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 22
    const ringsCount = 4
    const points = values.map((v, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        const rv = r * Math.max(0.1, Math.min(1, v))
        return [cx + rv * Math.cos(a), cy + rv * Math.sin(a)] as const
    })
    const polyPoints = points.map(([x, y]) => `${x},${y}`).join(" ")

    const hexPoints = (radius: number) =>
        Array.from({ length: 6 })
            .map((_, i) => {
                const a = (Math.PI / 3) * i - Math.PI / 2
                return `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`
            })
            .join(" ")

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ display: "block" }}
        >
            {/* v2.6 - Trazos reforzados como en el Radar nuevo: stroke
                opacities subidas, drop-shadow glow en el principal y en
                el polygon del Indice. */}
            {/* Rings concéntricos */}
            {Array.from({ length: ringsCount }).map((_, i) => {
                const rr = (r * (i + 1)) / ringsCount
                const isOuter = i === ringsCount - 1
                return (
                    <polygon
                        key={i}
                        points={hexPoints(rr)}
                        fill="none"
                        stroke={hexToRgba(
                            GOLD,
                            isOuter ? 0.55 : 0.22 + i * 0.06
                        )}
                        strokeWidth={isOuter ? 1.6 : 0.9}
                        style={
                            isOuter
                                ? {
                                      filter: `drop-shadow(0 0 6px ${hexToRgba(GOLD, 0.45)})`,
                                  }
                                : undefined
                        }
                    />
                )
            })}
            {/* Ejes desde centro */}
            {Array.from({ length: 6 }).map((_, i) => {
                const a = (Math.PI / 3) * i - Math.PI / 2
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + r * Math.cos(a)}
                        y2={cy + r * Math.sin(a)}
                        stroke={hexToRgba(GOLD, 0.32)}
                        strokeWidth="1"
                        style={{
                            filter: `drop-shadow(0 0 2px ${hexToRgba(GOLD, 0.25)})`,
                        }}
                    />
                )
            })}
            {/* Área del Índice */}
            <motion.polygon
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.2, 1, 0.3, 1] }}
                points={polyPoints}
                fill={hexToRgba(GOLD, 0.2)}
                stroke={GOLD}
                strokeWidth="2.2"
                style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: `drop-shadow(0 0 8px ${hexToRgba(GOLD, 0.55)})`,
                }}
            />
            {/* Puntos en los vértices */}
            {points.map(([x, y], i) => (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    fill={GOLD}
                    stroke="#0B0C13"
                    strokeWidth="1.5"
                    filter={`drop-shadow(0 0 9px ${hexToRgba(GOLD, 0.85)})`}
                />
            ))}
            {/* Centro — Índice de Luz */}
            <text
                x="50%"
                y="52%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={GOLD}
                fontSize={size * 0.09}
                fontWeight="350"
                letterSpacing="2"
                fontFamily="'Inter',sans-serif"
                style={{
                    filter: `drop-shadow(0 0 10px ${hexToRgba(GOLD, 0.7)})`,
                }}
            >
                {center}
            </text>
        </svg>
    )
}

/* ════════════════════════════════════════════════════════════════
   Section wrapper con reveal
   ════════════════════════════════════════════════════════════════ */
function Section({
    id,
    children,
    maxWidth = 1120,
    paddingY,
    style,
}: {
    id?: string
    children: React.ReactNode
    maxWidth?: number
    paddingY?: string
    style?: React.CSSProperties
}) {
    return (
        <section
            id={id}
            style={{
                position: "relative",
                zIndex: 2,
                padding:
                    paddingY ||
                    "clamp(64px, 10vw, 120px) clamp(18px, 4vw, 40px)",
                ...style,
            }}
        >
            <div
                style={{
                    maxWidth,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {children}
            </div>
        </section>
    )
}

function RevealOnScroll({
    children,
    delay = 0,
    y = 24,
}: {
    children: React.ReactNode
    delay?: number
    y?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: "-80px" })
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay, ease: [0.2, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Carousel horizontal reutilizable — scroll-snap + flechas + dots
   ════════════════════════════════════════════════════════════════ */
function HorizontalCarousel<T>({
    items,
    renderItem,
    itemWidth,
    gap = 16,
    accent = CYAN,
    accentRgb = "0,194,255",
}: {
    items: T[]
    renderItem: (item: T, i: number) => React.ReactNode
    itemWidth: string | number
    gap?: number
    accent?: string
    accentRgb?: string
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeIdx, setActiveIdx] = useState(0)
    const [canPrev, setCanPrev] = useState(false)
    const [canNext, setCanNext] = useState(true)

    const recomputeEdges = () => {
        const c = scrollRef.current
        if (!c) return
        const maxScroll = c.scrollWidth - c.clientWidth
        setCanPrev(c.scrollLeft > 4)
        setCanNext(c.scrollLeft < maxScroll - 4)
    }

    const recomputeActive = () => {
        const c = scrollRef.current
        if (!c) return
        const children = Array.from(c.children) as HTMLElement[]
        const viewCenter = c.scrollLeft + c.clientWidth / 2
        let bestIdx = 0
        let bestDist = Infinity
        children.forEach((ch, i) => {
            const chCenter = ch.offsetLeft + ch.clientWidth / 2
            const dist = Math.abs(chCenter - viewCenter)
            if (dist < bestDist) {
                bestDist = dist
                bestIdx = i
            }
        })
        setActiveIdx(bestIdx)
        recomputeEdges()
    }

    useEffect(() => {
        recomputeActive()
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [])

    const scrollToIdx = (idx: number) => {
        const c = scrollRef.current
        if (!c) return
        const clamped = Math.max(0, Math.min(items.length - 1, idx))
        const children = Array.from(c.children) as HTMLElement[]
        const target = children[clamped]
        if (!target) return
        c.scrollTo({
            left:
                target.offsetLeft - c.clientWidth / 2 + target.clientWidth / 2,
            behavior: "smooth",
        })
    }

    return (
        <div style={{ position: "relative" }}>
            <div
                ref={scrollRef}
                onScroll={recomputeActive}
                style={{
                    display: "flex",
                    gap,
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    /* v2.4 — padding generoso arriba/abajo (24/32) para
                       que los box-shadow de las cards no se corten. En
                       los laterales 4px de respiración para que la
                       primera y última card no queden pegadas al borde
                       del Section. */
                    padding: "24px 4px 32px",
                }}
            >
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            flexShrink: 0,
                            scrollSnapAlign: "center",
                            width: itemWidth,
                        }}
                    >
                        {renderItem(item, i)}
                    </div>
                ))}
            </div>

            {/* Controles */}
            <div
                style={{
                    marginTop: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                }}
            >
                <CarouselArrow
                    dir="prev"
                    disabled={!canPrev}
                    onClick={() => scrollToIdx(activeIdx - 1)}
                    color={accent}
                    colorRgb={accentRgb}
                />
                <CarouselDots
                    count={items.length}
                    active={activeIdx}
                    color={accent}
                    onDot={(i) => scrollToIdx(i)}
                />
                <CarouselArrow
                    dir="next"
                    disabled={!canNext}
                    onClick={() => scrollToIdx(activeIdx + 1)}
                    color={accent}
                    colorRgb={accentRgb}
                />
            </div>
        </div>
    )
}

function CarouselArrow({
    dir,
    disabled,
    onClick,
    color,
    colorRgb,
}: {
    dir: "prev" | "next"
    disabled?: boolean
    onClick: () => void
    color: string
    colorRgb: string
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-label={dir === "prev" ? "Anterior" : "Siguiente"}
            style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: disabled ? "transparent" : `rgba(${colorRgb},0.06)`,
                border: `1px solid rgba(${colorRgb},${disabled ? 0.1 : 0.28})`,
                color: disabled ? `rgba(${colorRgb},0.3)` : color,
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                transition: "all 0.2s ease",
                padding: 0,
            }}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{
                    transform: dir === "prev" ? "rotate(180deg)" : "none",
                }}
            >
                <path
                    d="M2 7h10M8 3l4 4-4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

function CarouselDots({
    count,
    active,
    color,
    onDot,
}: {
    count: number
    active: number
    color: string
    onDot: (i: number) => void
}) {
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: count }).map((_, i) => {
                const isActive = i === active
                return (
                    <button
                        type="button"
                        key={i}
                        onClick={() => onDot(i)}
                        aria-label={`Ir a ${i + 1}`}
                        style={{
                            width: isActive ? 26 : 8,
                            height: 6,
                            borderRadius: 3,
                            border: "none",
                            background: isActive
                                ? color
                                : hexToRgba(color, 0.22),
                            boxShadow: isActive
                                ? `0 0 10px ${hexToRgba(color, 0.55)}`
                                : "none",
                            cursor: "pointer",
                            padding: 0,
                            outline: "none",
                            transition: "all 0.28s ease",
                        }}
                    />
                )
            })}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección HERO
   ════════════════════════════════════════════════════════════════ */
function HeroSection({
    isMobile,
    onCta,
    onScrollDown,
}: {
    isMobile: boolean
    onCta: () => void
    onScrollDown: () => void
}) {
    return (
        <Section
            paddingY={
                isMobile
                    ? "72px 18px 48px"
                    : "clamp(100px, 12vh, 160px) 40px 80px"
            }
            style={{
                /* v2.1 — en el Lente dejamos fluir la altura; el Hero ya no
                   se traga toda la pantalla para que el scroll revele el
                   resto de secciones sin fricción. En desktop mantiene la
                   sensación cinemática de viewport lleno. */
                minHeight: isMobile ? "auto" : "calc(100vh - 40px)",
                display: "flex",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
                    gap: isMobile ? 40 : 60,
                    alignItems: "center",
                    width: "100%",
                }}
            >
                {/* Texto */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.2, 1, 0.3, 1] }}
                    >
                        <div className="rsv-brand">✦ Red Solar Viva</div>
                    </motion.div>
                    <motion.h1
                        className="rsv-title-cine"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1.1,
                            delay: 0.1,
                            ease: [0.2, 1, 0.3, 1],
                        }}
                    >
                        Escáner
                        <br />
                        Vibracional
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.35 }}
                        style={{
                            marginTop: 24,
                            fontSize: isMobile ? 18 : 22,
                            fontWeight: 200,
                            lineHeight: 1.35,
                            color: WHITE,
                            maxWidth: 520,
                            letterSpacing: "0.005em",
                        }}
                    >
                        Telemetría biológica y energética en tiempo real.
                    </motion.div>
                    <motion.p
                        className="rsv-para"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ marginTop: 18, maxWidth: 520 }}
                    >
                        Una terminal que mide la resonancia de tu avatar en seis
                        pilares críticos. Te muestra dónde estás perdiendo
                        coherencia y te comanda calibraciones para volver a tu
                        estado de fricción cero.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.7 }}
                        style={{
                            marginTop: 36,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 14,
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="button"
                            className="rsv-cta-gold"
                            onClick={onCta}
                        >
                            <span>Iniciar diagnóstico</span>
                            <ArrowRightIcon size={14} />
                        </button>
                        <button
                            type="button"
                            className="rsv-cta-ghost"
                            onClick={onScrollDown}
                        >
                            <span>Explorar</span>
                            <ArrowDownIcon size={12} />
                        </button>
                    </motion.div>
                    <motion.div
                        id="hero-stats"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 1.1 }}
                        style={{
                            marginTop: 44,
                            display: "flex",
                            alignItems: "center",
                            gap: 18,
                            flexWrap: "wrap",
                        }}
                    >
                        <MiniStatChip label="6 Pilares" value="36 sondas" />
                        <MiniStatChip label="Ciclo" value="7 Días" />
                        <MiniStatChip label="Escala" value="0 → 100%" />
                    </motion.div>
                </div>

                {/* Visual — Radar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 1.3,
                        delay: 0.3,
                        ease: [0.2, 1, 0.3, 1],
                    }}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                    }}
                >
                    <div
                        className="rsv-hex-pulse"
                        style={{ position: "relative" }}
                    >
                        <MiniRadarHexagonal
                            size={isMobile ? 280 : 420}
                            values={[0.82, 0.68, 0.77, 0.54, 0.72, 0.66]}
                            center="I.S. 72"
                        />
                    </div>
                    {/* anillos decorativos */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            pointerEvents: "none",
                        }}
                    />
                </motion.div>
            </div>
        </Section>
    )
}

function MiniStatChip({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 14px",
                borderLeft: `1px solid ${hexToRgba(CYAN, 0.22)}`,
            }}
        >
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(0,194,255,0.7)",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    marginTop: 4,
                    fontSize: 14,
                    fontWeight: 300,
                    color: WHITE,
                    letterSpacing: "0.02em",
                }}
            >
                {value}
            </span>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección QUÉ ES
   ════════════════════════════════════════════════════════════════ */
function QueEsSection({ isMobile }: { isMobile: boolean }) {
    return (
        <Section id="que-es" maxWidth={920}>
            <RevealOnScroll>
                <div className="rsv-kicker">◈ Qué es</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 28 }}
                >
                    Un escáner que revela la arquitectura
                    <br />
                    oculta de tu coherencia.
                </h2>
                <hr className="rsv-divider" />
            </RevealOnScroll>
            <RevealOnScroll delay={0.15}>
                <p
                    className="rsv-para"
                    style={{ marginTop: 28, maxWidth: 780 }}
                >
                    El Escáner Vibracional es una terminal de diagnóstico que
                    mide{" "}
                    <b style={{ color: WHITE }}>
                        la frecuencia real con la que tu avatar está operando
                    </b>{" "}
                    en seis dimensiones: la biológica, la mental, la emocional,
                    la financiera, la energética y la relacional.
                </p>
                <p
                    className="rsv-para"
                    style={{ marginTop: 18, maxWidth: 780 }}
                >
                    En minutos te devuelve el{" "}
                    <b style={{ color: WHITE }}>Radar</b> — un hexágono de seis
                    vértices con tu{" "}
                    <b style={{ color: WHITE }}>Índice de Luz</b>: un número
                    entre 0 y 100 que captura con cuánta coherencia estás
                    viviendo ahora mismo. Al realizar tu escaneo el sistema
                    activa automáticamente{" "}
                    <b style={{ color: WHITE }}>Calibraciones</b>: instrucciones
                    específicas, no consejos genéricos, para realinear tu
                    frecuencia.
                </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.3}>
                <div
                    style={{
                        marginTop: 56,
                        padding: isMobile ? "28px 24px" : "40px 48px",
                        borderRadius: 20,
                        borderLeft: `2px solid ${GOLD}`,
                        background: BG_GLASS,
                    }}
                >
                    <p className="rsv-quote">
                        “Medimos resonancia. Y la resonancia se puede
                        reingeniar.”
                    </p>
                    <div
                        style={{
                            marginTop: 20,
                            fontSize: 10.5,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "rgba(200,164,78,0.7)",
                            fontWeight: 500,
                        }}
                    >
                        — Zak'Haar · Arquitecto del sistema
                    </div>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección PILARES
   ════════════════════════════════════════════════════════════════ */
function PilaresSection({ isMobile }: { isMobile: boolean }) {
    /* v2.3 — Carousel horizontal en lugar de grid 3x2. Compacta la
       altura total de la landing y vuelve la exploración más kinestésica:
       el tripulante desliza o tapea las flechas. En desktop cada card
       ocupa ~320px; en mobile ~270px para que siempre se vea ~1.15
       cards (hint visual de que hay más a la derecha). */
    return (
        <Section id="pilares">
            <RevealOnScroll>
                <div className="rsv-kicker">✦ Arquitectura</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Los seis pilares del Avatar.
                </h2>
                <p
                    className="rsv-para"
                    style={{ maxWidth: 680, marginBottom: 48 }}
                >
                    Cada pilar tiene seis sondas específicas — 36 señales en
                    total. Cada escaneo se calibra por ciclo de 7 días para que
                    la trayectoria sea legible y no ruidosa.
                </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
                {/* v2.6 - Desktop: grid 3x2 que ocupa todo el ancho de la
                    seccion sin recortar cards. Mobile: carousel deslizable. */}
                {isMobile ? (
                    <HorizontalCarousel
                        items={PILARES}
                        itemWidth={270}
                        gap={14}
                        renderItem={(p) => <PilarCard pilar={p} />}
                    />
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 20,
                            paddingTop: 24,
                            paddingBottom: 32,
                        }}
                    >
                        {PILARES.map((p, i) => (
                            <PilarCard key={i} pilar={p} />
                        ))}
                    </div>
                )}
            </RevealOnScroll>
        </Section>
    )
}

function PilarCard({ pilar }: { pilar: PilarDef }) {
    /* v2.2 — cada card se tinta con el color del pilar (gradient radial
       sutil desde la esquina superior derecha + borde más pronunciado +
       glow exterior al hover). Se siente más viva sin ser ruidosa. */
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="rsv-card rsv-card-hoverable"
            style={{
                padding: "26px 24px 24px",
                borderColor: hexToRgba(pilar.color, 0.32),
                minHeight: 210,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: `
                    radial-gradient(ellipse at top right, ${hexToRgba(
                        pilar.color,
                        0.12
                    )} 0%, transparent 55%),
                    linear-gradient(160deg, rgba(10,22,42,0.82) 0%, rgba(4,10,22,0.88) 100%)
                `,
                boxShadow: `inset 0 1px 0 ${hexToRgba(pilar.color, 0.14)}`,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Acento diagonal en esquina inferior derecha */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    right: -40,
                    bottom: -40,
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${hexToRgba(
                        pilar.color,
                        0.14
                    )} 0%, transparent 65%)`,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 52,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 14,
                        background: hexToRgba(pilar.color, 0.08),
                        border: `1px solid ${hexToRgba(pilar.color, 0.28)}`,
                    }}
                >
                    <HexagonIcon
                        size={36}
                        color={pilar.color}
                        glyph={pilar.glyph}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            letterSpacing: "0.22em",
                            color: pilar.color,
                        }}
                    >
                        {pilar.nombre}
                    </div>
                    <div
                        style={{
                            marginTop: 2,
                            fontSize: 10.5,
                            fontWeight: 400,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: hexToRgba(pilar.color, 0.55),
                        }}
                    >
                        {pilar.subtitulo}
                    </div>
                </div>
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: 13.5,
                    fontWeight: 300,
                    lineHeight: 1.6,
                    color: "rgba(220,230,245,0.72)",
                }}
            >
                {pilar.descripcion}
            </p>
            <div
                style={{
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: `1px dashed ${hexToRgba(pilar.color, 0.18)}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: hexToRgba(pilar.color, 0.65),
                    }}
                >
                    6 sondas
                </span>
                <span
                    style={{
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(220,230,245,0.32)",
                    }}
                >
                    Ciclo 7 D
                </span>
            </div>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección CÓMO FUNCIONA
   ════════════════════════════════════════════════════════════════ */
function ComoFuncionaSection({ isMobile }: { isMobile: boolean }) {
    /* v2.3 — Single-card con tap-to-advance + swipe lateral + loop.
       El tripulante tapea (o desliza) para avanzar al siguiente paso;
       del último vuelve al primero. Ahorra altura vs grid 3 columnas. */
    const pasos = [
        {
            n: "01",
            titulo: "Escaneás",
            desc: "Respondés seis sondas por pilar. Son respuestas espectrales de 0 a 100%, no un sí/no. El sistema captura el matiz.",
            color: CYAN,
            colorRgb: "0,194,255",
        },
        {
            n: "02",
            titulo: "Decodificas",
            desc: "El Radar destila tu Índice de Luz — un número entre 0 y 100 con el mapa de dónde estás entero y dónde estás fugando.",
            color: GOLD,
            colorRgb: "212,168,67",
        },
        {
            n: "03",
            titulo: "Comandas",
            desc: "Al completar tu escaneo el Enrutador activa Calibraciones específicas. No sugiere — comanda.",
            color: "#9A6CE6",
            colorRgb: "154,108,230",
        },
    ]
    const [idx, setIdx] = useState(0)
    const [dir, setDir] = useState(1)
    const next = () => {
        setDir(1)
        setIdx((i) => (i + 1) % pasos.length)
    }
    const prev = () => {
        setDir(-1)
        setIdx((i) => (i - 1 + pasos.length) % pasos.length)
    }
    const p = pasos[idx]
    return (
        <Section id="como" maxWidth={860}>
            <RevealOnScroll>
                <div className="rsv-kicker">◈ Flujo</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Cómo se vive el escaneo.
                </h2>
                <p
                    className="rsv-para"
                    style={{ maxWidth: 640, marginBottom: 38 }}
                >
                    Tres fases, sin vueltas, sin fricción superflua.
                </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
                <div
                    style={{
                        position: "relative",
                        minHeight: isMobile ? 280 : 300,
                    }}
                >
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: dir * 28 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -dir * 28 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.3, 1] }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.3}
                        onDragEnd={(_e, info) => {
                            if (info.offset.x < -70) next()
                            else if (info.offset.x > 70) prev()
                        }}
                        onClick={next}
                        style={{ cursor: "pointer", touchAction: "pan-y" }}
                    >
                        <div
                            className="rsv-card"
                            style={{
                                padding: isMobile
                                    ? "38px 28px 36px"
                                    : "52px 56px 46px",
                                borderColor: hexToRgba(p.color, 0.34),
                                minHeight: isMobile ? 260 : 280,
                                display: "flex",
                                flexDirection: "column",
                                position: "relative",
                                overflow: "hidden",
                                background: `
                                    radial-gradient(ellipse at top left, ${hexToRgba(
                                        p.color,
                                        0.16
                                    )} 0%, transparent 55%),
                                    linear-gradient(165deg, rgba(12,24,46,0.82) 0%, rgba(4,10,22,0.88) 100%)
                                `,
                                boxShadow: `inset 0 1px 0 ${hexToRgba(
                                    p.color,
                                    0.22
                                )}, 0 20px 60px rgba(${p.colorRgb},0.08)`,
                            }}
                        >
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    top: -40,
                                    left: -40,
                                    width: 240,
                                    height: 240,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle, ${hexToRgba(
                                        p.color,
                                        0.18
                                    )} 0%, transparent 60%)`,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "relative",
                                    fontSize: isMobile ? 68 : 88,
                                    fontWeight: 100,
                                    letterSpacing: "-0.02em",
                                    background: `linear-gradient(135deg, ${p.color} 0%, ${hexToRgba(
                                        p.color,
                                        0.42
                                    )} 100%)`,
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    color: "transparent",
                                    lineHeight: 1,
                                    marginBottom: 16,
                                }}
                            >
                                {p.n}
                            </div>
                            <div
                                style={{
                                    position: "relative",
                                    fontSize: isMobile ? 26 : 34,
                                    fontWeight: 300,
                                    letterSpacing: "-0.01em",
                                    color: WHITE,
                                    marginBottom: 16,
                                }}
                            >
                                {p.titulo}
                            </div>
                            <hr
                                className="rsv-divider"
                                style={{
                                    margin: "0 0 16px 0",
                                    position: "relative",
                                    background: `linear-gradient(90deg, ${hexToRgba(
                                        p.color,
                                        0.55
                                    )}, transparent)`,
                                }}
                            />
                            <p
                                className="rsv-para"
                                style={{
                                    position: "relative",
                                    fontSize: isMobile ? 14 : 15.5,
                                    maxWidth: 580,
                                }}
                            >
                                {p.desc}
                            </p>
                        </div>
                    </motion.div>
                </div>
                <div
                    style={{
                        marginTop: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 18,
                    }}
                >
                    <CarouselArrow
                        dir="prev"
                        onClick={prev}
                        color={p.color}
                        colorRgb={p.colorRgb}
                    />
                    <CarouselDots
                        count={pasos.length}
                        active={idx}
                        color={p.color}
                        onDot={(i) => {
                            setDir(i > idx ? 1 : -1)
                            setIdx(i)
                        }}
                    />
                    <CarouselArrow
                        dir="next"
                        onClick={next}
                        color={p.color}
                        colorRgb={p.colorRgb}
                    />
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección ESPECTRO DE FRECUENCIA
   ════════════════════════════════════════════════════════════════ */
function EspectroSection({ isMobile }: { isMobile: boolean }) {
    const puntos = [
        {
            pct: 0,
            label: "Entropía Absoluta",
            sub: "Colapso",
            color: "#E6635B",
        },
        {
            pct: 25,
            label: "Resistencia",
            sub: "Alta fricción",
            color: "#E8A74E",
        },
        {
            pct: 50,
            label: "Punto Neutro",
            sub: "Estado mecánico",
            color: "#A8A8A8",
        },
        {
            pct: 75,
            label: "Ligereza",
            sub: "Flujo consciente",
            color: "#7FDCFF",
        },
        {
            pct: 100,
            label: "Fricción Cero",
            sub: "Superconductividad",
            color: "#F2E5B8",
        },
    ]
    return (
        <Section id="espectro" maxWidth={1040}>
            <RevealOnScroll>
                <div className="rsv-kicker">✦ Escala</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Espectro de frecuencia.
                </h2>
                <p
                    className="rsv-para"
                    style={{ maxWidth: 700, marginBottom: 52 }}
                >
                    Cada respuesta se ubica en uno de cinco tramos. No hay
                    binarios. Todo el sistema opera en gradientes.
                </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.15}>
                <div
                    className="rsv-card"
                    style={{
                        padding: isMobile ? "28px 22px" : "40px 44px",
                        overflow: "hidden",
                    }}
                >
                    {/* Barra horizontal */}
                    <div
                        style={{
                            position: "relative",
                            height: 12,
                            borderRadius: 8,
                            background:
                                "linear-gradient(90deg, #E6635B 0%, #E8A74E 25%, #A8A8A8 50%, #7FDCFF 75%, #F2E5B8 100%)",
                            boxShadow:
                                "0 0 30px rgba(0,194,255,0.1), inset 0 0 12px rgba(0,0,0,0.2)",
                        }}
                    />
                    {/* Marcadores */}
                    <div
                        style={{
                            marginTop: 18,
                            display: "grid",
                            gridTemplateColumns: isMobile
                                ? "1fr"
                                : "repeat(5, 1fr)",
                            gap: isMobile ? 14 : 8,
                        }}
                    >
                        {puntos.map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    textAlign: isMobile ? "left" : "center",
                                    position: "relative",
                                    padding: isMobile
                                        ? "10px 0 0 14px"
                                        : "4px 8px 0",
                                    borderLeft: isMobile
                                        ? `2px solid ${p.color}`
                                        : "none",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 200,
                                        color: p.color,
                                        lineHeight: 1,
                                    }}
                                >
                                    {p.pct}%
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: WHITE,
                                    }}
                                >
                                    {p.label}
                                </div>
                                <div
                                    style={{
                                        marginTop: 2,
                                        fontSize: 10.5,
                                        fontWeight: 300,
                                        color: "rgba(220,230,245,0.5)",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {p.sub}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección DECODIFICADOR DE MATERIA (destacada)
   ════════════════════════════════════════════════════════════════ */
function DecodificadorSection({ isMobile }: { isMobile: boolean }) {
    return (
        <Section id="decodificador" maxWidth={1160}>
            <RevealOnScroll>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <CameraIcon size={18} color={GOLD} />
                    <div className="rsv-kicker rsv-kicker-gold">
                        Extensión del Pilar Hardware
                    </div>
                </div>
                <h2
                    className="rsv-title-soft"
                    style={{
                        marginTop: 18,
                        marginBottom: 18,
                        background:
                            "linear-gradient(135deg, #F2E5B8 0%, #D4A843 60%, #9A7828 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                    }}
                >
                    Decodificador de Materia.
                </h2>
                <p className="rsv-para" style={{ maxWidth: 760 }}>
                    Fotografías los{" "}
                    <b style={{ color: GOLD_SOFT }}>ingredientes</b> de
                    cualquier alimento o producto, escaneas la{" "}
                    <b style={{ color: GOLD_SOFT }}>etiqueta</b> empaquetada, o
                    ingresas el nombre por{" "}
                    <b style={{ color: GOLD_SOFT }}>texto</b>. El sistema extrae
                    la firma, cruza la huella vibracional y te devuelve un
                    dictamen tri-axial en segundos.
                </p>
                <p
                    className="rsv-para"
                    style={{
                        marginTop: 14,
                        maxWidth: 760,
                        color: "rgba(232,238,247,0.72)",
                        fontWeight: 400,
                    }}
                >
                    El Decodificador de Materia mide{" "}
                    <b style={{ color: GOLD_SOFT }}>resonancia</b>.
                </p>
            </RevealOnScroll>

            {/* v2.3 — se removió el mock de dictamen: la demo se va a
               reemplazar con capturas reales de la app. Los tres ejes
               quedan en una sola columna ancha, sin competir con un
               visual placeholder. */}
            <div
                style={{
                    marginTop: 60,
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                }}
            >
                <RevealOnScroll delay={0.05}>
                    <EjeCard
                        titulo="Fricción Biológica"
                        desc="Cuánto tu organismo físico tiene que esforzarse para procesar esto. Inflamación, carga hepática, glicación, demanda enzimática."
                        color="#FF9B6B"
                        colorRgb="255,155,107"
                        nivel="Alto"
                        pct={72}
                    />
                </RevealOnScroll>
                <RevealOnScroll delay={0.12}>
                    <EjeCard
                        titulo="Fricción Energética"
                        desc="Cuánto tu campo sutil se contrae o se expande al ingerirlo. La comida no solo alimenta el cuerpo; deja un eco en tu campo energético."
                        color="#7FDCFF"
                        colorRgb="127,220,255"
                        nivel="Medio"
                        pct={48}
                    />
                </RevealOnScroll>
                <RevealOnScroll delay={0.19}>
                    <EjeCard
                        titulo="Impacto Matriz"
                        desc="Cuánto este producto te ata a la cadena industrial de la vieja matriz. Su huella social y sistémica."
                        color="#9A6CE6"
                        colorRgb="154,108,230"
                        nivel="Alto"
                        pct={81}
                    />
                </RevealOnScroll>
            </div>

            {/* Pipeline */}
            <RevealOnScroll delay={0.3}>
                <div
                    style={{
                        marginTop: 64,
                        padding: isMobile ? "28px 22px" : "40px 48px",
                        borderRadius: 22,
                        border: `1px solid ${hexToRgba(GOLD, 0.22)}`,
                        background:
                            "linear-gradient(160deg, rgba(28,22,10,0.7) 0%, rgba(16,12,6,0.82) 100%)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div className="rsv-shimmer" />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div className="rsv-kicker rsv-kicker-gold">
                            Cómo funciona · técnicamente
                        </div>
                        {/* v2.4 — en mobile pasa a carousel horizontal para
                            que los 4 pasos vivan en una sola fila deslizable
                            en vez de 4 filas apiladas. En Centro de Mando
                            sigue siendo grid de 4 columnas. */}
                        {isMobile ? (
                            <div style={{ marginTop: 20 }}>
                                <HorizontalCarousel
                                    items={PIPELINE_PASOS}
                                    itemWidth={240}
                                    gap={14}
                                    accent={GOLD}
                                    accentRgb="212,168,67"
                                    renderItem={(s) => (
                                        <PipelinePasoCard paso={s} />
                                    )}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 28,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: 20,
                                }}
                            >
                                {PIPELINE_PASOS.map((s, i) => (
                                    <PipelinePasoCard key={i} paso={s} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

function EjeCard({
    titulo,
    desc,
    color,
    colorRgb,
    nivel,
    pct,
}: {
    titulo: string
    desc: string
    color: string
    colorRgb: string
    nivel: string
    pct: number
}) {
    return (
        <div
            className="rsv-card"
            style={{
                padding: "22px 24px",
                borderColor: `rgba(${colorRgb},0.22)`,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color,
                    }}
                >
                    {titulo}
                </div>
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: `rgba(${colorRgb},0.7)`,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: `rgba(${colorRgb},0.1)`,
                        border: `1px solid rgba(${colorRgb},0.28)`,
                    }}
                >
                    {nivel} · {pct}%
                </div>
            </div>
            <div
                style={{
                    height: 4,
                    borderRadius: 3,
                    background: `rgba(${colorRgb},0.08)`,
                    overflow: "hidden",
                    marginBottom: 14,
                }}
            >
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: pct / 100 }}
                    transition={{ duration: 1.2, ease: [0.2, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    style={{
                        height: "100%",
                        background: `linear-gradient(90deg, ${color} 0%, ${hexToRgba(
                            color,
                            0.4
                        )} 100%)`,
                        transformOrigin: "left",
                        boxShadow: `0 0 12px rgba(${colorRgb},0.45)`,
                    }}
                />
            </div>
            <p
                className="rsv-para"
                style={{ fontSize: 13, color: "rgba(232,238,247,0.68)" }}
            >
                {desc}
            </p>
        </div>
    )
}

/* v2.3 — MockDictamen removido. La demo se reemplazará con capturas
   reales de la app cuando estén listas. */

/* v2.4 — Pipeline técnico del Decodificador.
   Datos extraídos como const para reutilizar el mismo layout en grid
   (desktop) y en carousel (mobile). */
const PIPELINE_PASOS = [
    {
        n: "01",
        t: "Fotografiás los ingredientes",
        d: "Apuntás tu cámara a la lista de ingredientes del producto empaquetado.",
    },
    {
        n: "02",
        t: "Escaneo cuántico",
        d: "El sistema lee la firma del producto con precisión y descarta la imagen al instante.",
    },
    {
        n: "03",
        t: "Traducción vibracional",
        d: "El Decodificador traduce la energía del alimento en tres ejes de resonancia.",
    },
    {
        n: "04",
        t: "Dictamen",
        d: "Recibís el fallo en segundos. Ingerir o no ingerir deja de ser una adivinanza.",
    },
]

function PipelinePasoCard({
    paso,
}: {
    paso: { n: string; t: string; d: string }
}) {
    return (
        <div
            style={{
                padding: "22px 20px",
                borderRadius: 16,
                border: `1px solid ${hexToRgba(GOLD, 0.2)}`,
                background:
                    "linear-gradient(160deg, rgba(30,24,12,0.5) 0%, rgba(18,14,6,0.72) 100%)",
                boxShadow: `inset 0 1px 0 ${hexToRgba(GOLD, 0.14)}`,
                height: "100%",
            }}
        >
            <div
                style={{
                    fontSize: 36,
                    fontWeight: 100,
                    color: hexToRgba(GOLD, 0.45),
                    lineHeight: 1,
                }}
            >
                {paso.n}
            </div>
            <div
                style={{
                    marginTop: 10,
                    fontSize: 15,
                    fontWeight: 400,
                    color: GOLD_SOFT,
                    letterSpacing: "0.02em",
                }}
            >
                {paso.t}
            </div>
            <p
                className="rsv-para"
                style={{
                    marginTop: 8,
                    fontSize: 12.5,
                    color: "rgba(232,238,247,0.64)",
                }}
            >
                {paso.d}
            </p>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección PROTOCOLOS QUIRÚRGICOS
   ════════════════════════════════════════════════════════════════ */
function ProtocolosSection({ isMobile }: { isMobile: boolean }) {
    /* v2.3 — Sin las 3 tarjetas de ejemplo. Un único bloque cinemático
       con pulso visual (tres ondas concéntricas animadas) que transmite
       la sensación de activación automática del protocolo. Copy simplificado
       y directo en dos frases. */
    return (
        <Section id="protocolos" maxWidth={960}>
            <RevealOnScroll>
                <div className="rsv-kicker">✦ Respuesta automática</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Calibraciones.
                </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.12}>
                <div
                    style={{
                        position: "relative",
                        padding: isMobile ? "48px 24px 44px" : "64px 56px",
                        borderRadius: 26,
                        border: `1px solid ${hexToRgba("#9A6CE6", 0.32)}`,
                        background: `
                            radial-gradient(ellipse at 70% 20%, rgba(154,108,230,0.16) 0%, transparent 58%),
                            radial-gradient(ellipse at 20% 90%, rgba(0,194,255,0.10) 0%, transparent 58%),
                            linear-gradient(165deg, rgba(14,20,40,0.84) 0%, rgba(6,10,22,0.90) 100%)
                        `,
                        boxShadow: `inset 0 1px 0 rgba(154,108,230,0.24), 0 32px 80px rgba(154,108,230,0.10)`,
                        overflow: "hidden",
                        textAlign: "center",
                    }}
                >
                    {/* Ondas concéntricas animadas */}
                    <PulsoOndas isMobile={isMobile} />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <p
                            className="rsv-para"
                            style={{
                                maxWidth: 680,
                                margin: "0 auto 20px",
                                fontSize: isMobile ? 15 : 17,
                                color: "rgba(232,238,247,0.82)",
                                textAlign: "center",
                            }}
                        >
                            Al realizar tu escaneo, el Escáner Vibracional te
                            asigna una intervención específica, ejecutable y
                            cronometrada para alinear tu energía y erradicar las
                            fugas.
                        </p>
                        <div
                            style={{
                                marginTop: 22,
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                aria-hidden
                                style={{
                                    width: 44,
                                    height: 1,
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(232,198,90,0.6), transparent)",
                                }}
                            />
                            <div
                                style={{
                                    fontSize: isMobile ? 15 : 18,
                                    fontWeight: 300,
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: GOLD_SOFT,
                                    textShadow: `0 0 12px rgba(232,198,90,0.4)`,
                                }}
                            >
                                El sistema comanda.
                            </div>
                            <div
                                aria-hidden
                                style={{
                                    width: 44,
                                    height: 1,
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(232,198,90,0.6), transparent)",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* Ondas concéntricas pulsantes — evoca "protocolo activándose" */
function PulsoOndas({ isMobile }: { isMobile: boolean }) {
    const base = isMobile ? 120 : 180
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: base * 3,
                height: base * 3,
                pointerEvents: "none",
                opacity: 0.45,
            }}
        >
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.3], opacity: [0.7, 0] }}
                    transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 1.4,
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginLeft: -base / 2,
                        marginTop: -base / 2,
                        width: base,
                        height: base,
                        borderRadius: "50%",
                        border: "1px solid rgba(154,108,230,0.45)",
                        boxShadow: "0 0 30px rgba(154,108,230,0.18)",
                    }}
                />
            ))}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección BENEFICIOS
   ════════════════════════════════════════════════════════════════ */
function BeneficiosSection({ isMobile }: { isMobile: boolean }) {
    const b = [
        {
            t: "Dejás de adivinar",
            d: "Qué comida te drena y qué te expande deja de ser una teoría. Es un dictamen medible en tres ejes.",
        },
        {
            t: "Ves tu progreso en mapa",
            d: "El Radar — hexagonal — reemplaza las listas de chequeo. Tu evolución se ve geométricamente, no como una sumatoria de hábitos.",
        },
        {
            t: "Instrucciones quirúrgicas",
            d: "El sistema te da pasos específicos cronometrados cuando caés bajo el punto neutro. No consejos genéricos.",
        },
        {
            t: "Ritual de 7 días",
            d: "El ciclo semanal te ancla en un ritmo predecible. No es una app que te persigue todo el día — es un ritual sagrado por pilar.",
        },
        {
            t: "Historial anclado",
            d: "Tu evolución queda guardada ciclo a ciclo en tu núcleo personal. Puedes ver cómo te mueves en el espectro a lo largo de meses.",
        },
        {
            t: "Decodificador de Materia",
            d: "Un escáner de resonancia alimentaria que cabe en tu bolsillo. Dejá de buscar en Google si un producto te cae bien — preguntale a la IA.",
        },
    ]
    return (
        <Section id="beneficios">
            <RevealOnScroll>
                <div className="rsv-kicker">✦ Transformación</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Lo que cambia en tu día cuando escaneás.
                </h2>
                <p
                    className="rsv-para"
                    style={{ maxWidth: 680, marginBottom: 44 }}
                >
                    Estos son los cambios operacionales que reportan los
                    tripulantes después del primer ciclo.
                </p>
            </RevealOnScroll>
            {/* v2.6 - Desktop: grid 3x2 ocupando todo el ancho de la
                seccion sin recortar cards. Mobile: carousel deslizable. */}
            <RevealOnScroll delay={0.1}>
                {(() => {
                    const renderCard = (x: (typeof b)[number], i: number) => {
                        const esDorado = i % 2 === 1
                        const color = esDorado ? GOLD_SOFT : CYAN_SOFT
                        const colorRgb = esDorado ? "232,198,90" : "127,220,255"
                        return (
                            <div
                                key={i}
                                className="rsv-card rsv-card-hoverable"
                                style={{
                                    padding: "28px 26px 26px",
                                    minHeight: 200,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    position: "relative",
                                    overflow: "hidden",
                                    borderColor: `rgba(${colorRgb},0.28)`,
                                    background: `
                                        radial-gradient(ellipse at top right, rgba(${colorRgb},0.12) 0%, transparent 58%),
                                        linear-gradient(160deg, rgba(10,22,42,0.80) 0%, rgba(4,10,22,0.88) 100%)
                                    `,
                                    boxShadow: `inset 0 1px 0 rgba(${colorRgb},0.18)`,
                                }}
                            >
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        right: -30,
                                        top: -30,
                                        width: 100,
                                        height: 100,
                                        borderRadius: "50%",
                                        background: `radial-gradient(circle, rgba(${colorRgb},0.10) 0%, transparent 65%)`,
                                        pointerEvents: "none",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "relative",
                                        fontSize: 18,
                                        fontWeight: 400,
                                        color,
                                        letterSpacing: "-0.004em",
                                    }}
                                >
                                    {x.t}
                                </div>
                                <p
                                    className="rsv-para"
                                    style={{
                                        position: "relative",
                                        fontSize: 13.5,
                                    }}
                                >
                                    {x.d}
                                </p>
                            </div>
                        )
                    }
                    if (isMobile) {
                        return (
                            <HorizontalCarousel
                                items={b}
                                itemWidth={290}
                                gap={16}
                                renderItem={renderCard}
                            />
                        )
                    }
                    return (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 18,
                                paddingTop: 24,
                                paddingBottom: 32,
                            }}
                        >
                            {b.map((x, i) => renderCard(x, i))}
                        </div>
                    )
                })()}
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección SINTONÍA SOLAR (pricing)
   ════════════════════════════════════════════════════════════════ */
function SintoniaSolarSection({
    isMobile,
    onCta,
}: {
    isMobile: boolean
    onCta: () => void
}) {
    const beneficios = [
        "Escáner Vibracional sin límite — los 6 pilares cada 7 días",
        "Decodificador de Materia ilimitado — todos los escaneos que necesites",
        "Calibraciones activas cuando caés bajo punto neutro",
        "Trayectoria del Avatar — historial completo de tu evolución",
        "Nuevas funciones exclusivas conforme se despliegan",
    ]
    return (
        <Section id="sintonia" maxWidth={960}>
            <RevealOnScroll>
                <div className="rsv-kicker">✦ Acceso</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 18 }}
                >
                    Sintonía Solar.
                </h2>
                <p
                    className="rsv-para"
                    style={{ maxWidth: 640, marginBottom: 52 }}
                >
                    Una sola tarifa mensual. Todo el sistema abierto. Sin tiers
                    ni extras sorpresa. Futuras funciones se suman al mismo
                    acceso sin costo adicional.
                </p>
            </RevealOnScroll>
            {/* v2.3 — Dos tarjetas: (1) precio + botón de compra, (2) qué incluye.
               Cada una queda más nítida y el CTA no compite con la lista. */}
            <RevealOnScroll delay={0.15}>
                <div
                    className="rsv-card"
                    style={{
                        position: "relative",
                        padding: isMobile ? "36px 24px 32px" : "48px 56px 42px",
                        borderColor: hexToRgba(CYAN, 0.45),
                        overflow: "hidden",
                        /* v2.6 - Background mas vivo (Diego pidio que no se
                           viera "sin chiste"). Glow radial cyan desde top
                           + radial dorado tenue desde bottom-right + base
                           profunda azul oscuro. */
                        background: `
                            radial-gradient(ellipse at 50% 0%, rgba(0,194,255,0.18) 0%, transparent 55%),
                            radial-gradient(ellipse at 100% 100%, rgba(232,198,90,0.08) 0%, transparent 50%),
                            linear-gradient(160deg, rgba(8,22,46,0.88) 0%, rgba(2,8,20,0.94) 100%)
                        `,
                        boxShadow: `0 30px 80px rgba(0,194,255,0.18), 0 0 60px rgba(0,194,255,0.06), inset 0 1px 0 rgba(0,194,255,0.2)`,
                        marginBottom: 18,
                        textAlign: "center",
                    }}
                >
                    <div className="rsv-shimmer-cyan" />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: "0.3em",
                                textTransform: "uppercase",
                                color: CYAN,
                            }}
                        >
                            ◈ Sintonía Solar
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: isMobile ? 26 : 32,
                                fontWeight: 200,
                                color: WHITE,
                                letterSpacing: "-0.01em",
                                lineHeight: 1.1,
                            }}
                        >
                            Acceso total al sistema.
                        </div>
                        <div
                            style={{
                                marginTop: 28,
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 16,
                                    color: MUTED,
                                    fontWeight: 300,
                                }}
                            >
                                $
                            </span>
                            <span
                                style={{
                                    fontSize: isMobile ? 64 : 84,
                                    fontWeight: 100,
                                    color: WHITE,
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1,
                                }}
                            >
                                777
                            </span>
                            <span
                                style={{
                                    fontSize: 15,
                                    color: MUTED,
                                    fontWeight: 400,
                                    letterSpacing: "0.1em",
                                    marginLeft: 4,
                                }}
                            >
                                MXN
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "rgba(0,194,255,0.62)",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                marginTop: 6,
                            }}
                        >
                            al mes · cancelas cuando quieras
                        </div>
                        <div style={{ marginTop: 32 }}>
                            <button
                                type="button"
                                className="rsv-cta-gold"
                                onClick={onCta}
                            >
                                <span>Activar Sintonía Solar</span>
                                <ArrowRightIcon size={14} />
                            </button>
                        </div>
                        <div
                            style={{
                                marginTop: 14,
                                fontSize: 11,
                                color: "rgba(220,230,245,0.48)",
                                letterSpacing: "0.08em",
                            }}
                        >
                            Pago mensual · Cancela desde tu Núcleo.
                        </div>
                    </div>
                </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.25}>
                <div
                    className="rsv-card"
                    style={{
                        padding: isMobile ? "28px 24px" : "36px 44px",
                        borderColor: hexToRgba(CYAN, 0.32),
                        position: "relative",
                        overflow: "hidden",
                        /* v2.6 - Background degradado vivo: glow cyan suave
                           desde top-left + base azul profundo. Mas vivo que
                           el plano original. */
                        background: `
                            radial-gradient(ellipse at 0% 0%, rgba(0,194,255,0.12) 0%, transparent 60%),
                            radial-gradient(ellipse at 100% 100%, rgba(127,220,255,0.06) 0%, transparent 60%),
                            linear-gradient(160deg, rgba(8,20,42,0.85) 0%, rgba(4,10,22,0.92) 100%)
                        `,
                        boxShadow: `0 18px 50px rgba(0,194,255,0.1), inset 0 1px 0 rgba(0,194,255,0.14)`,
                    }}
                >
                    <div className="rsv-kicker" style={{ marginBottom: 22 }}>
                        ✦ Qué incluye
                    </div>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                            gap: 14,
                        }}
                    >
                        {beneficios.map((b, i) => (
                            <li
                                key={i}
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    fontSize: 13.5,
                                    fontWeight: 300,
                                    color: "rgba(232,238,247,0.8)",
                                    lineHeight: 1.5,
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        flexShrink: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 22,
                                        height: 22,
                                        borderRadius: 7,
                                        background: "rgba(0,194,255,0.08)",
                                        border: "1px solid rgba(0,194,255,0.3)",
                                        color: CYAN,
                                        fontSize: 12,
                                        marginTop: 1,
                                    }}
                                >
                                    ✓
                                </span>
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección FAQ
   ════════════════════════════════════════════════════════════════ */
function FaqSection() {
    const faqs = [
        {
            q: "¿Es una app de bienestar o de hábitos?",
            a: "No. Es una terminal de diagnóstico vibracional. Las apps de hábitos te muestran checklists; el Escáner te devuelve un índice cuantificado de coherencia en seis pilares y te activa intervenciones cuando hay fricción.",
        },
        {
            q: "¿Necesito conocimientos previos para usarlo?",
            a: "Ninguno. Respondés en un espectro de 0 a 100% en cada sonda. El sistema hace el cálculo y destila el índice. El lenguaje es específico pero accesible desde el primer escaneo.",
        },
        {
            q: "¿Qué pasa con mi información?",
            a: "Tu telemetría vive exclusivamente en tu núcleo personal, encriptada y bajo tu cuenta. Nunca se comparte con terceros ni se usa para entrenar modelos.",
        },
        {
            q: "¿Puedo usarlo sin la Sintonía Solar?",
            a: "Puedes hacer un escaneo de prueba limitado. Para acceso pleno al radar de 6 pilares, al Decodificador de Materia sin cupo y a las Calibraciones, activas la Sintonía Solar.",
        },
        {
            q: "¿Cómo funciona el Decodificador de Materia técnicamente?",
            a: "Fotografías el alimento, producto o su etiqueta — también puedes ingresar el nombre por texto. El sistema extrae el contenido con visión artificial, descarta la imagen y envía solo el texto a un análisis de IA entrenado en resonancia vibracional. En segundos recibes el dictamen tri-axial.",
        },
        {
            q: "¿Cuándo va a estar en la App Store?",
            a: "Próximamente. El mismo núcleo se está empaquetando como aplicación nativa. Mientras tanto, la versión actual funciona como aplicación instalable desde tu celular.",
        },
    ]
    const [openIdx, setOpenIdx] = useState<number | null>(0)
    return (
        <Section id="faq" maxWidth={860}>
            <RevealOnScroll>
                <div className="rsv-kicker">◈ Preguntas</div>
                <h2
                    className="rsv-title-soft"
                    style={{ marginTop: 16, marginBottom: 44 }}
                >
                    Antes de iniciar.
                </h2>
            </RevealOnScroll>
            <div>
                {faqs.map((f, i) => {
                    const open = openIdx === i
                    return (
                        <RevealOnScroll key={i} delay={i * 0.04}>
                            <div
                                className="rsv-faq-item"
                                onClick={() => setOpenIdx(open ? null : i)}
                                role="button"
                                tabIndex={0}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "22px 0",
                                        gap: 20,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: open
                                                ? WHITE
                                                : "rgba(232,238,247,0.82)",
                                            letterSpacing: "-0.002em",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {f.q}
                                    </div>
                                    <div
                                        style={{
                                            flexShrink: 0,
                                            color: open
                                                ? CYAN
                                                : "rgba(0,194,255,0.5)",
                                            width: 30,
                                            height: 30,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 8,
                                            border: `1px solid ${
                                                open
                                                    ? hexToRgba(CYAN, 0.5)
                                                    : hexToRgba(CYAN, 0.18)
                                            }`,
                                            background: open
                                                ? hexToRgba(CYAN, 0.08)
                                                : "transparent",
                                            transition:
                                                "border-color 0.3s, background 0.3s, color 0.3s",
                                        }}
                                    >
                                        <PlusIcon
                                            size={12}
                                            rotate={open ? 45 : 0}
                                        />
                                    </div>
                                </div>
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: open ? "auto" : 0,
                                        opacity: open ? 1 : 0,
                                    }}
                                    transition={{
                                        duration: 0.35,
                                        ease: [0.2, 1, 0.3, 1],
                                    }}
                                    style={{
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            paddingBottom: 24,
                                            paddingRight: 50,
                                            fontSize: 14,
                                            fontWeight: 300,
                                            lineHeight: 1.65,
                                            color: "rgba(220,230,245,0.72)",
                                        }}
                                    >
                                        {f.a}
                                    </div>
                                </motion.div>
                            </div>
                        </RevealOnScroll>
                    )
                })}
            </div>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Sección CTA FINAL
   ════════════════════════════════════════════════════════════════ */
function CtaFinalSection({
    isMobile,
    onCta,
}: {
    isMobile: boolean
    onCta: () => void
}) {
    return (
        <Section id="cta" maxWidth={860}>
            <RevealOnScroll>
                <div
                    style={{
                        /* v2.4 — alineación izquierda para ser consistente
                           con el resto de secciones. El hexágono pasa
                           arriba como un glyph chico y el layout queda
                           más tipo app nativa. */
                        textAlign: "left",
                        padding: isMobile ? "42px 24px" : "60px 54px",
                        position: "relative",
                        borderRadius: 28,
                        border: `1px solid ${hexToRgba(GOLD, 0.22)}`,
                        background:
                            "radial-gradient(ellipse at 100% 0%, rgba(200,164,78,0.16) 0%, transparent 55%), radial-gradient(ellipse at center, rgba(28,22,10,0.72) 0%, rgba(8,14,26,0.72) 60%)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(circle at 100% 100%, rgba(200,164,78,0.14) 0%, transparent 50%)",
                            pointerEvents: "none",
                        }}
                    />
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div
                            className="rsv-hex-pulse"
                            style={{ display: "inline-block" }}
                        >
                            <HexagonIcon
                                size={52}
                                color={GOLD}
                                glyph="✦"
                                filled
                            />
                        </div>
                        <h2
                            className="rsv-title-soft"
                            style={{
                                marginTop: 22,
                                marginBottom: 14,
                            }}
                        >
                            Inicia tu primer diagnóstico.
                        </h2>
                        <p
                            className="rsv-para"
                            style={{
                                maxWidth: 600,
                                margin: "0 0 32px",
                            }}
                        >
                            Seis pilares. Treinta y seis sondas. El Índice de
                            Luz te espera al final.
                        </p>
                        <button
                            type="button"
                            className="rsv-cta-gold"
                            onClick={onCta}
                        >
                            <span>Activar el Escáner</span>
                            <ArrowRightIcon size={14} />
                        </button>
                    </div>
                </div>
            </RevealOnScroll>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Footer
   ════════════════════════════════════════════════════════════════ */
function FooterSection() {
    /* v2.2 — padding bottom reducido (80 → 24) para que la página termine
       cerca del borde inferior del viewport, sin la franja vacía que
       quedaba antes. */
    return (
        <Section paddingY="40px 20px 24px" maxWidth={1120}>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                    paddingTop: 22,
                    borderTop: `1px solid ${BORDER_SOFT}`,
                }}
            >
                <div
                    style={{
                        fontSize: 10.5,
                        fontWeight: 400,
                        letterSpacing: "0.48em",
                        textTransform: "uppercase",
                        color: "rgba(232,238,247,0.55)",
                    }}
                >
                    ✦ Red Solar Viva
                </div>
                <div
                    style={{
                        fontSize: 10.5,
                        color: "rgba(220,230,245,0.38)",
                        letterSpacing: "0.14em",
                    }}
                >
                    Telemetría vibracional · Arquitectura Zak'Haar
                </div>
            </div>
        </Section>
    )
}

/* ════════════════════════════════════════════════════════════════
   Botón "volver arriba" — aparece cuando el user se alejó del tope
   ════════════════════════════════════════════════════════════════ */
function ScrollToTopButton({
    scrollerRef,
}: {
    scrollerRef: React.RefObject<HTMLDivElement>
}) {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return
        const onScroll = () => setVisible(el.scrollTop > 320)
        onScroll()
        el.addEventListener("scroll", onScroll, { passive: true })
        return () => el.removeEventListener("scroll", onScroll)
    }, [scrollerRef])
    const goTop = () => {
        scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
    return (
        <motion.button
            type="button"
            onClick={goTop}
            aria-label="Volver arriba"
            initial={false}
            animate={{
                opacity: visible ? 1 : 0,
                y: visible ? 0 : 16,
                pointerEvents: visible ? "auto" : "none",
            }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.3, 1] }}
            style={{
                position: "fixed",
                bottom: 24,
                right: 20,
                zIndex: 120,
                width: 46,
                height: 46,
                borderRadius: 14,
                border: `1px solid ${hexToRgba(CYAN, 0.42)}`,
                background:
                    "linear-gradient(160deg, rgba(8,20,38,0.88) 0%, rgba(4,10,22,0.92) 100%)",
                backdropFilter: "blur(18px) saturate(1.3)",
                WebkitBackdropFilter: "blur(18px) saturate(1.3)",
                color: CYAN,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                boxShadow: `0 12px 32px rgba(0,194,255,0.18), 0 0 0 1px rgba(0,194,255,0.06)`,
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
            >
                <path
                    d="M8 13V3M3 8l5-5 5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.button>
    )
}

/* ════════════════════════════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════════════════════════════ */
function PortalInduccionEscaner({
    targetRoute = "/escaner",
    sintoniaTargetRoute = "/sesiones",
}: {
    targetRoute?: string
    sintoniaTargetRoute?: string
}) {
    useInjectPortalCss()
    const isMobile = useIsMobile()
    const rootRef = useRef<HTMLDivElement>(null)

    const navigateTo = (ruta: string) => {
        if (typeof window === "undefined") return
        /* Fase 6a (2026-05-12) — toda ruta que apunte al Escáner
           Vibracional sale de redsolarviva.com hacia
           escaner.redsolarviva.com (subdomain Vercel + escaner-app).
           Las rutas /sesiones y demás del nodo madre siguen
           navegando in-app vía rsvNavigate. */
        if (
            ruta === "/escaner" ||
            ruta === "/radar" ||
            ruta.startsWith("/escaner/")
        ) {
            window.location.href = "https://escaner.redsolarviva.com" + ruta
            return
        }
        const rsvNavigate = (window as any).rsvNavigate
        if (typeof rsvNavigate === "function") rsvNavigate(ruta)
        else window.location.href = ruta
    }

    const scrollTo = (sectionId: string) => {
        if (typeof document === "undefined") return
        const el = document.getElementById(sectionId)
        const root = rootRef.current
        if (!el || !root) return
        /* v2.1 — el rootRef ahora es el contenedor scrollable (height:100vh
           + overflow-y:auto). offsetTop del target es relativo al root,
           así que scrolleamos ahí directo. */
        const rootRect = root.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const top = root.scrollTop + (elRect.top - rootRect.top) - 20
        root.scrollTo({ top, behavior: "smooth" })
    }

    return (
        <div ref={rootRef} className="rsv-portal-root">
            <HeroSection
                isMobile={isMobile}
                onCta={() => navigateTo(targetRoute)}
                /* v2.7 — Target del botón "Explorar" cambia de
                   "que-es" a "hero-stats" (la fila 6 PILARES ·
                   CICLO · ESCALA del propio hero). Antes el
                   scroll dejaba el hexágono fuera del viewport
                   porque saltaba a la siguiente sección. Ahora
                   el viewport queda con los chips al top y el
                   hexágono visible debajo, mostrando el QUÉ ES
                   apenas asomado al fondo. */
                onScrollDown={() => scrollTo("hero-stats")}
            />
            <QueEsSection isMobile={isMobile} />
            <PilaresSection isMobile={isMobile} />
            <ComoFuncionaSection isMobile={isMobile} />
            <EspectroSection isMobile={isMobile} />
            <ProtocolosSection isMobile={isMobile} />
            <DecodificadorSection isMobile={isMobile} />
            <BeneficiosSection isMobile={isMobile} />
            <SintoniaSolarSection
                isMobile={isMobile}
                onCta={() => navigateTo(sintoniaTargetRoute)}
            />
            <FaqSection />
            <CtaFinalSection
                isMobile={isMobile}
                onCta={() => navigateTo(targetRoute)}
            />
            <FooterSection />
            <ScrollToTopButton scrollerRef={rootRef} />
        </div>
    )
}

export default PortalInduccionEscaner

addPropertyControls(PortalInduccionEscaner, {
    targetRoute: {
        type: ControlType.String,
        title: "Ruta CTA Principal",
        defaultValue: "/escaner",
        description:
            "Ruta a la que llevan los botones 'Iniciar diagnóstico' y 'Activar el Escáner'.",
    },
    sintoniaTargetRoute: {
        type: ControlType.String,
        title: "Ruta Sintonía Solar",
        defaultValue: "/sesiones",
        description:
            "Ruta a la que lleva el botón 'Activar Sintonía Solar'. Apuntala al checkout cuando esté listo.",
    },
})
