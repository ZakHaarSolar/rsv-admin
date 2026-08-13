// EV_DreamDecoder.tsx v1.28 — Copy sin "carta" (sonaba a adivinanza): título "Decodificación Anclada", sección "Decodificación de tu sueño", la 2ª beat de la revelación dice "Decodificación lista"; hub Sueños = "Telemetría de tus sueños" + em-dashes fuera de ambas tarjetas del hub. Estatus de carga PROGRESIVO (DECODING_STEPS ciclan ≈2.6s/paso) para que no parezca congelado. | v1.27 — Carta final: baja un poco (la lente despeja el notch) + content-sized; el botón "Decodificar otro sueño" respira con gap fijo. | v1.25 — Afinación inmersiva: header pegado al notch + idle compacto + tarjeta final pegada al pie (botón sobre la nav) + durante la revelación (carga + constelación + lectura + calibración) se desvanecen el header y la barra inferior y la constelación sube + háptico real. | v1.23 — RESULTADO inmersivo "Revelación de la Carta": el sueño YA NO es una tarjeta — se revela a pantalla completa como un dispositivo mágico al despertar. 1) la constelación se dibuja sola, épica, en el centro y se desvanece · 2) la Lectura se materializa carácter a carácter con háptico por frase (tap acelera, tap avanza) · 3) el Rumbo de Calibración igual · 4) la tarjeta-astrolabio final en reposo con ambos textos (botón anclado justo sobre la nav). Háptico real iOS vía @capacitor/haptics (registro global, fallback navigator.vibrate). Header pegado al notch; tarjeta sin hueco superior. Continuo = CSS/SMIL.
// EV_DreamDecoder.tsx v1.22 — RESULTADO rediseñado: "Carta Estelar del Sueño" — astrolabio de niebla violeta (terminal mágica nocturna, opuesta a la Cámara de Lectura diurna de Materia). Mismos datos: la banda = estrella regente teñida que respira; el dictamen vibral cristaliza desde la niebla (nebulosa-dictamen); la calibración = rumbo sellado. Constelación que se DIBUJA SOLA (SMIL freeze) + cometa de telemetría (SMIL, sobrevive preview headless) + polvo bioluminiscente (CSS) + niebla a la deriva + aro de declinación contrarrotando. Humor del campo por banda (aurora/onda/tensión). Keyframes esc-dream-* autoinyectadas (ensureDreamCss). Continuo = CSS/SMIL (10K); framer SOLO entradas.
// EV_DreamDecoder.tsx v1.21 — Bóveda renombrar SIN congelarse (iOS): foco diferido (doble rAF) + content-visibility por tarjeta + capas pesadas ocultas mientras se edita · v1.20 resultado: el botón "Decodificar otro sueño" abraza la tarjeta de Calibración (marginTop 28, sin estirarse al pie) + paddingBottom 88px solo libera la nav · rename inline: header = div role=button (typing ya no togglea), edit box abre VACÍO + crece con el texto (width en ch) · v1.19 loader VaultOpeningAnim · Banda Frecuencial nodo que respira · SwipeToDelete useAnimationControls
// v1.13 — #4 Telemetría viva: el panel Banda Frecuencial usa un micro-ecualizador CSS (esc-eq-bar) en vez del punto pulsante
// viven en UNA sola AnimatePresence mode="wait" con keys → el hub termina su salida ANTES de montar
// el decodificador elegido (sin solapamiento ni capa empujada al fondo). [re-sync]
// v1.11 — El contador de lunas baja al centro del hueco entre el botón
// Decodificar Sueño y la nav (minHeight + marginTop/Bottom auto) + copy "decodificación(es)";
// el Materia recibe onBack para su botón de regreso al hub.
// v1.10 — Contador épico de lecturas (DreamShotsMeter): 3 lunas
// crecientes que se gastan (encendidas = restantes, la última late en lavanda al quedar 1),
// gemelo del de Materia con el símbolo de Sueños, al pie de la pantalla de estasis.
// v1.9 — Borrador persistente: el texto del sueño se guarda en
// localStorage al escribir y se restaura al volver (no se pierde por cierre/batería) +
// swipe SOLO izq con revelado en vivo (tap borra) + lavanda (#B59CFF) +
// "Bóveda de Sueños" (no Estasis) + textura premium en sellos y tarjetas.
// (prev v1.8) swipe revela papelera (tap borra, sin bleed rojo)
// (prev v1.7) animación de carga subida + swipe-para-borrar en la Bóveda +
// (prev v1.5) contador por gateway user-action (cierre IDOR crítico) +
// (prev v1.4) cuadro del sueño a la mitad (no llena la pantalla) +
// botón despegado de la barra · sin botón flotante "Decodificadores" en Materia
// (se regresa por el tab) · subtítulos de banda en palabras llanas.
// v1.3 — Hub "Decodificadores" (plural, sin subtítulo, los
// dos sellos juntos y centrados) · loading centrado en el eje Y · input a
// pantalla completa (textarea crece + botón al fondo) · invitación suave del
// paywall tras el 1er/2do sueño (espejo de Materia) · BÓVEDA DE ESTASIS: galería
// mágica con todos los sueños decodificados (texto + dictamen) vía
// get_my_dream_records. Hub + Sueños con freemium (3 lecturas de por vida para
// no-miembros) + regreso al selector al re-tocar la pestaña.
// Al entrar a DECODIFICADOR el Tripulante ve dos sellos de arte cósmico:
//   ▸ DECODIFICADOR DE MATERIA  → la cámara/lente actual (EV_Decoder)
//   ▸ DECODIFICADOR DE SUEÑOS   → nueva interfaz de estasis (esta)
// El de Sueños toma el texto del sueño, lo manda a la edge `decode-dream`
// (Gemini · oráculo de Sexta Densidad) y devuelve 3 paneles glassmorphism:
// Banda Frecuencial · Dictamen Vibral · Calibración Quirúrgica (con anclaje
// binario). Gated a Sintonía Solar — invitado prueba la UI y al decodificar
// se levanta el muro de Sintonía. Default export: DecoderModule.
import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import Shared from "./EV_Shared.tsx"
import DecodificadorView from "./EV_Decoder.tsx"

const {
    hx, GOLD, CYAN, userAction, fireMaterialize, fireFieldWave,
    fireAuroraBloom, fireFieldTension, MaterializeIn,
} = Shared

/* Paleta del Decodificador de Sueños — astral / estasis (Sia Stelle vibe):
   periwinkle-índigo + plata + cian de acento. */
const DREAM = "#B59CFF" // lavanda luminoso (antes #9B8CFF, muy apagado/grisáceo)
const DREAM_DEEP = "#6E5BE0"
const SILVER = "#D8E0F2"
const STARDUST = "#9DE8FF" // cian-hielo bioluminiscente del polvo estelar (acento)

/* Las tres bandas frecuenciales con su color dinámico. */
const BANDAS: Record<
    string,
    { key: string; label: string; sub: string; color: string; soft: string }
> = {
    purga: {
        key: "purga",
        label: "Purga de Entropía",
        sub: "Limpieza nocturna",
        color: "#E08A93",
        soft: "rgba(224,138,147,0.14)",
    },
    simulador: {
        key: "simulador",
        label: "Simulador de Gravedad",
        sub: "Prueba interior",
        color: CYAN,
        soft: "rgba(0,229,255,0.12)",
    },
    descarga: {
        key: "descarga",
        label: "Descarga de Código",
        sub: "Transmisión Directa",
        color: GOLD,
        soft: "rgba(212,168,67,0.15)",
    },
}

function bandaMeta(d: any) {
    const k = (d?.banda_key || "").toString().toLowerCase().trim()
    if (BANDAS[k]) return BANDAS[k]
    const t = (d?.banda_frecuencial || "").toString().toLowerCase()
    if (t.includes("purga") || t.includes("entrop")) return BANDAS.purga
    if (t.includes("simulador") || t.includes("gravedad")) return BANDAS.simulador
    if (t.includes("descarga") || t.includes("código") || t.includes("codigo"))
        return BANDAS.descarga
    return BANDAS.simulador
}

/* ════════════════════════════════════════════════════════════════
   ARTE — Sellos cósmicos para el Hub. SVG puro + animación viva.
   ════════════════════════════════════════════════════════════════ */

/* Cristal prismático de Materia — facetas + anillos de fotones + chispas. */
function MateriaSigil({ size = 132 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            style={{ overflow: "visible", display: "block" }}
        >
            <defs>
                <linearGradient id="evm-crys" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FBE6A8" />
                    <stop offset="45%" stopColor={GOLD} />
                    <stop offset="100%" stopColor={CYAN} />
                </linearGradient>
                <radialGradient id="evm-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={GOLD} stopOpacity="0.55" />
                    <stop offset="60%" stopColor={GOLD} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* halo respirante */}
            <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="url(#evm-glow)"
                animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />

            {/* anillo orbital exterior */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
                <ellipse
                    cx="50"
                    cy="50"
                    rx="42"
                    ry="16"
                    stroke={hx(CYAN, 0.45)}
                    strokeWidth="0.8"
                    fill="none"
                />
                <circle cx="92" cy="50" r="2.2" fill={CYAN} />
                <circle cx="8" cy="50" r="1.6" fill={hx(CYAN, 0.7)} />
            </motion.g>

            {/* anillo orbital interior (contra-rota) */}
            <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
                <ellipse
                    cx="50"
                    cy="50"
                    rx="16"
                    ry="40"
                    stroke={hx(GOLD, 0.4)}
                    strokeWidth="0.8"
                    fill="none"
                />
                <circle cx="50" cy="10" r="2" fill={GOLD} />
            </motion.g>

            {/* cristal hexagonal facetado */}
            <motion.g
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
                <polygon
                    points="50,24 70,38 70,62 50,76 30,62 30,38"
                    fill="url(#evm-crys)"
                    fillOpacity="0.9"
                    stroke="#FFFFFF"
                    strokeOpacity="0.55"
                    strokeWidth="0.7"
                />
                <polygon
                    points="50,24 50,76 30,62 30,38"
                    fill="#FFFFFF"
                    fillOpacity="0.14"
                />
                <line
                    x1="50"
                    y1="24"
                    x2="50"
                    y2="76"
                    stroke="#FFFFFF"
                    strokeOpacity="0.5"
                    strokeWidth="0.5"
                />
                <line
                    x1="30"
                    y1="38"
                    x2="70"
                    y2="62"
                    stroke="#FFFFFF"
                    strokeOpacity="0.3"
                    strokeWidth="0.4"
                />
                <line
                    x1="70"
                    y1="38"
                    x2="30"
                    y2="62"
                    stroke="#FFFFFF"
                    strokeOpacity="0.3"
                    strokeWidth="0.4"
                />
            </motion.g>

            {/* chispas */}
            {[
                [20, 28, 1.4],
                [82, 30, 1.1],
                [78, 74, 1.5],
                [22, 72, 1],
            ].map(([cx, cy, r], i) => (
                <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#FFFFFF"
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                    }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
            ))}
        </svg>
    )
}

/* Sello de Sueños — luna creciente + nebulosa + constelación + orbe estásico. */
function SuenosSigil({ size = 132 }: { size?: number }) {
    const stars = [
        [18, 22, 1.3],
        [30, 14, 0.9],
        [80, 20, 1.2],
        [88, 40, 0.8],
        [16, 60, 1],
        [84, 72, 1.1],
        [40, 84, 0.9],
    ]
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            style={{ overflow: "visible", display: "block" }}
        >
            <defs>
                <radialGradient id="evs-neb" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={DREAM} stopOpacity="0.6" />
                    <stop offset="55%" stopColor={DREAM_DEEP} stopOpacity="0.16" />
                    <stop offset="100%" stopColor={DREAM_DEEP} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="evs-moon" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor={SILVER} />
                    <stop offset="100%" stopColor={DREAM} />
                </linearGradient>
                <radialGradient id="evs-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor={DREAM} />
                    <stop offset="100%" stopColor={DREAM_DEEP} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* nebulosa respirante */}
            <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="url(#evs-neb)"
                animate={{ scale: [1, 1.14, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />

            {/* anillo de constelación girando lento */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={hx(DREAM, 0.32)}
                    strokeWidth="0.6"
                    strokeDasharray="2 6"
                    fill="none"
                />
                <line
                    x1="18"
                    y1="22"
                    x2="30"
                    y2="14"
                    stroke={hx(SILVER, 0.4)}
                    strokeWidth="0.5"
                />
                <line
                    x1="80"
                    y1="20"
                    x2="88"
                    y2="40"
                    stroke={hx(SILVER, 0.4)}
                    strokeWidth="0.5"
                />
            </motion.g>

            {/* luna creciente */}
            <motion.g
                animate={{ rotate: [-6, 6, -6] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
                <path
                    d="M62 26 A26 26 0 1 0 62 74 A20 20 0 1 1 62 26 Z"
                    fill="url(#evs-moon)"
                    stroke="#FFFFFF"
                    strokeOpacity="0.4"
                    strokeWidth="0.5"
                />
            </motion.g>

            {/* orbe estásico central */}
            <motion.circle
                cx="50"
                cy="50"
                r="9"
                fill="url(#evs-core)"
                animate={{ opacity: [0.55, 1, 0.55], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />

            {/* estrellas titilando */}
            {stars.map(([cx, cy, r], i) => (
                <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={i % 2 ? SILVER : "#FFFFFF"}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                        duration: 2 + (i % 3) * 0.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.35,
                    }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
            ))}
        </svg>
    )
}

/* ════════════════════════════════════════════════════════════════
   HUB — dos sellos para elegir el decodificador.
   ════════════════════════════════════════════════════════════════ */
let _rsvDreamCssDone = false
function ensureDreamCss() {
    if (typeof document === "undefined" || _rsvDreamCssDone) return
    _rsvDreamCssDone = true
    if (document.getElementById("rsv-dream-css")) return
    const el = document.createElement("style")
    el.id = "rsv-dream-css"
    el.textContent =
        "@keyframes esc-dream-nebula{0%{transform:translate(-2%,1%) scale(1.04)}50%{transform:translate(2%,-1%) scale(1.1)}100%{transform:translate(-2%,1%) scale(1.04)}}" +
        "@keyframes esc-dream-twinkle{0%,100%{opacity:.42}50%{opacity:1}}" +
        "@keyframes esc-dream-regent-breath{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}" +
        "@keyframes esc-dream-dust{0%{transform:translateY(10px);opacity:0}18%{opacity:.9}100%{transform:translateY(-52px);opacity:0}}" +
        "@keyframes esc-dream-ring-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}" +
        "@keyframes esc-dream-ring-cspin{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}" +
        "@keyframes esc-dream-meridian{0%,100%{opacity:.4}50%{opacity:.78}}" +
        "@keyframes esc-dream-caret{0%,49%{opacity:1}50%,100%{opacity:0}}" +
        "@keyframes esc-dream-hint{0%,100%{opacity:.42}50%{opacity:1}}"
    document.head.appendChild(el)
}

/* ════════════════════════════════════════════════════════════════
   CARTA ESTELAR — helpers del resultado del Decodificador de Sueños.
   Astrolabio de niebla violeta: la LENTE celeste (constelación que se
   dibuja sola por SMIL + cometa de telemetría SMIL = señal viva en
   preview headless) y el POLVO bioluminiscente ascendente (CSS, NO los
   44 timelines SMIL de la dirección Abismo → injerto D3 implementado en
   compositor). Defaults defensivos en TODA prop (Framer instancia
   standalone). meta.color SIEMPRE hex; meta.soft (rgba) jamás va a hx().
   Continuo = SMIL/CSS-compositor; framer SOLO entradas one-shot.
   ════════════════════════════════════════════════════════════════ */

/* Geometría fija de la constelación (estrellas + hilos). Estática =
   misma figura cada lectura (la magia es el TRAZADO, no el azar).
   Coords en viewBox 0..200. La regente es la #0 (la más alta/grande). */
const DREAM_STARS: { x: number; y: number; r: number }[] = [
    { x: 100, y: 52, r: 4.4 }, // 0 — estrella regente (banda)
    { x: 62, y: 84, r: 2.2 },
    { x: 138, y: 90, r: 2.4 },
    { x: 48, y: 132, r: 1.9 },
    { x: 96, y: 122, r: 2.6 },
    { x: 150, y: 138, r: 2.0 },
    { x: 78, y: 160, r: 1.8 },
    { x: 124, y: 158, r: 1.9 },
]
/* Hilos = pares de índices a unir. Cada uno se traza solo, escalonado. */
const DREAM_LINKS: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 4],
    [2, 4],
    [4, 6],
    [4, 7],
    [1, 3],
    [2, 5],
]

/* LA LENTE — bóveda circular: niebla + aro de declinación contrarrotando
   + constelación que se dibuja sola (SMIL stroke-dashoffset, fill=freeze:
   corre 1 vez y PARA → magia verificable en preview, cero costo continuo)
   + estrella regente teñida de la banda + cometa de telemetría (SMIL
   animateMotion, señal viva permanente). */
function DreamLens({
    size = 260,
    color = "#00E5FF",
    soft = "rgba(0,229,255,0.12)",
}: {
    size?: number
    color?: string
    soft?: string
}) {
    const safeColor =
        typeof color === "string" && color.startsWith("#") ? color : "#00E5FF"
    const safeSoft =
        typeof soft === "string" && soft.length > 0 ? soft : "rgba(0,229,255,0.12)"
    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                margin: "0 auto",
            }}
        >
            {/* Niebla interior — 2 capas radiales en deriva (CSS-compositor).
                La capa teñida usa meta.soft DIRECTO (rgba), nunca hx(). */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: "8%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: `radial-gradient(circle at 40% 34%, ${hx(
                        DREAM,
                        0.42
                    )} 0%, ${hx(DREAM_DEEP, 0.4)} 42%, rgba(8,6,26,0.92) 80%)`,
                    boxShadow: `inset 0 0 50px ${hx(DREAM_DEEP, 0.45)}`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: "-18%",
                        background: `radial-gradient(circle at 62% 64%, ${safeSoft}, transparent 60%)`,
                        animation: "esc-dream-nebula 28s linear infinite",
                    }}
                />
                {/* highlight especular lunar → la lente lee esférica (injerto D4). */}
                <div
                    style={{
                        position: "absolute",
                        top: "13%",
                        left: "20%",
                        width: "32%",
                        height: "20%",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${hx(
                            SILVER,
                            0.4
                        )}, transparent 70%)`,
                        filter: "blur(5px)",
                    }}
                />
            </div>

            <svg
                width={size}
                height={size}
                viewBox="0 0 200 200"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                }}
            >
                {/* Aro de declinación grabado (contrarrota lentísimo) — instrumento. */}
                <g
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        animation: "esc-dream-ring-spin 60s linear infinite",
                    }}
                >
                    <circle
                        cx="100"
                        cy="100"
                        r="92"
                        fill="none"
                        stroke={hx(SILVER, 0.28)}
                        strokeWidth="0.6"
                        strokeDasharray="2 7"
                    />
                </g>
                <g
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        animation: "esc-dream-ring-cspin 78s linear infinite",
                    }}
                >
                    <circle
                        cx="100"
                        cy="100"
                        r="84"
                        fill="none"
                        stroke={hx(DREAM, 0.18)}
                        strokeWidth="0.5"
                    />
                </g>

                {/* HILOS de la constelación — se TRAZAN solos (SMIL freeze).
                    Escalonados por begin → la figura nace ante los ojos.
                    fill="freeze": corre una vez y para = cero costo continuo. */}
                {DREAM_LINKS.map(([a, b], i) => {
                    const A = DREAM_STARS[a]
                    const B = DREAM_STARS[b]
                    const len = Math.hypot(B.x - A.x, B.y - A.y) + 1
                    return (
                        <line
                            key={i}
                            x1={A.x}
                            y1={A.y}
                            x2={B.x}
                            y2={B.y}
                            stroke={hx(SILVER, 0.55)}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            strokeDasharray={len}
                            strokeDashoffset={len}
                            style={{
                                filter: `drop-shadow(0 0 3px ${hx(SILVER, 0.6)})`,
                            }}
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from={len}
                                to="0"
                                dur="1s"
                                begin={`${0.25 + i * 0.22}s`}
                                fill="freeze"
                            />
                        </line>
                    )
                })}

                {/* Estrellas — titilan (CSS via inline animation + delay). */}
                {DREAM_STARS.map((s, i) => {
                    if (i === 0) return null
                    return (
                        <circle
                            key={i}
                            cx={s.x}
                            cy={s.y}
                            r={s.r}
                            fill={i % 2 ? SILVER : DREAM}
                            style={{
                                filter: `drop-shadow(0 0 5px ${hx(
                                    i % 2 ? SILVER : DREAM,
                                    0.85
                                )})`,
                                animation: `esc-dream-twinkle ${
                                    3 + (i % 4)
                                }s ease-in-out ${i * 0.35}s infinite`,
                            }}
                        />
                    )
                })}

                {/* ESTRELLA REGENTE = la banda. Teñida de meta.color, halo
                    respirante, anillo propio. (Inter del nombre va FUERA, en
                    el JSX del layout, junto a la lente.) */}
                <circle
                    cx={DREAM_STARS[0].x}
                    cy={DREAM_STARS[0].y}
                    r="13"
                    fill="none"
                    stroke={hx(safeColor, 0.4)}
                    strokeWidth="0.7"
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        animation: "esc-dream-meridian 4.4s ease-in-out infinite",
                    }}
                />
                <circle
                    cx={DREAM_STARS[0].x}
                    cy={DREAM_STARS[0].y}
                    r={DREAM_STARS[0].r}
                    fill={safeColor}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        filter: `drop-shadow(0 0 11px ${hx(safeColor, 0.9)})`,
                        animation:
                            "esc-dream-regent-breath 4.4s ease-in-out infinite",
                    }}
                />

                {/* COMETA DE TELEMETRÍA — SMIL animateMotion: señal viva que
                    sobrevive el preview headless (document.hidden congela
                    CSS/framer; SMIL sigue). Orbita el aro, teñido de la banda. */}
                <g>
                    <circle
                        r="2.4"
                        fill={safeColor}
                        style={{
                            filter: `drop-shadow(0 0 8px ${hx(safeColor, 0.85)})`,
                        }}
                    >
                        <animateMotion
                            dur="9s"
                            repeatCount="indefinite"
                            rotate="auto"
                            path="M100,8 A92,92 0 1,1 99.9,8"
                        />
                    </circle>
                </g>
            </svg>
        </div>
    )
}
DreamLens.displayName = "DreamLens"

/* POLVO BIOLUMINISCENTE ascendente — injerto del "sentir abisal" de la
   dirección Abismo, pero en CSS-keyframes (translateY+opacity sobre spans),
   NO los 44 timelines SMIL que la descalificaron a 10K. Deriva lenta,
   densidad baja, plata/cian-hielo. Capa de fondo del astrolabio. */
function DreamStardust({ count = 14 }: { count?: number }) {
    const n = Math.max(0, Math.min(22, count || 14))
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            {Array.from({ length: n }).map((_, i) => {
                const left = (i * 53) % 100
                const top = 30 + ((i * 37) % 60)
                const sz = i % 4 ? 1.6 : 2.4
                const dur = 14 + (i % 7) * 1.6
                const delay = -(i * 1.3)
                const c = i % 3 ? SILVER : STARDUST
                return (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${left}%`,
                            top: `${top}%`,
                            width: sz,
                            height: sz,
                            borderRadius: "50%",
                            background: c,
                            boxShadow: `0 0 6px ${hx(c, 0.85)}`,
                            opacity: 0,
                            animation: `esc-dream-dust ${dur}s ease-in-out ${delay}s infinite`,
                        }}
                    />
                )
            })}
        </div>
    )
}
DreamStardust.displayName = "DreamStardust"


function DreamCartaCard({
    dictamen,
    meta,
    isMobile = false,
    onReset,
}: {
    dictamen?: any
    meta?: any
    isMobile?: boolean
    onReset?: () => void
}) {
    const m = meta || BANDAS.simulador
    return (
        <>
        <div
            style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                padding: isMobile
                    ? "20px 16px 22px"
                    : "26px 24px 28px",
                background:
                    "radial-gradient(120% 80% at 50% 0%, rgba(20,14,46,0.92), rgba(8,7,24,0.96) 60%, rgba(5,5,18,0.98) 100%)",
                border: `1px solid ${hx(SILVER, 0.26)}`,
                boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 52px ${hx(
                    DREAM_DEEP,
                    0.22
                )}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            {/* Polvo bioluminiscente ascendente (CSS, no SMIL) — fondo. */}
            <DreamStardust count={isMobile ? 12 : 16} />

            {/* Vignette de nebulosa nocturna (estática, 0/frame). */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 0,
                    background: `radial-gradient(70% 50% at 50% 18%, ${hx(
                        DREAM,
                        0.08
                    )}, transparent 70%), radial-gradient(80% 60% at 50% 110%, ${
                        m.soft
                    }, transparent 72%)`,
                }}
            />

            {/* (A) CABECERA RITUAL — "CARTA TRAZADA · <sub>" con punto vivo.
                Léxico lunar (injerto D2), no "ACTIVO/instrumento". */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    color: hx(SILVER, 0.55),
                    marginBottom: 6,
                }}
            >
                <span style={{ textTransform: "uppercase" }}>
                    ⟡ Decodificación Anclada · {m.sub}
                </span>
                <span
                    aria-hidden
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 99,
                        background: m.color,
                        boxShadow: `0 0 8px ${hx(m.color, 0.85)}`,
                        animation:
                            "esc-dream-regent-breath 3.6s ease-in-out infinite",
                    }}
                />
            </div>

            {/* (B) LA LENTE — la pieza heroica: niebla + constelación que se
                dibuja sola + cometa SMIL + estrella regente teñida. */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    justifyContent: "center",
                    margin: isMobile ? "2px 0 6px" : "4px 0 10px",
                }}
            >
                <DreamLens
                    size={isMobile ? 244 : 270}
                    color={m.color}
                    soft={m.soft}
                />
            </div>

            {/* Nombre de la banda — flota bajo la regente, no en pastilla. */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    textAlign: "center",
                    marginBottom: isMobile ? 16 : 20,
                }}
            >
                <div
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isMobile ? 19 : 22,
                        fontWeight: 500,
                        letterSpacing: "0.03em",
                        color: m.color,
                        textShadow: `0 0 18px ${hx(m.color, 0.45)}`,
                    }}
                >
                    {dictamen.banda_frecuencial || m.label}
                </div>
                <div
                    style={{
                        marginTop: 4,
                        fontSize: 9.5,
                        fontWeight: 600,
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        color: hx(SILVER, 0.42),
                    }}
                >
                    Estrella Regente
                </div>
            </div>

            {/* (C) NEBULOSA-DICTAMEN — el párrafo fluye sobre la niebla, sin
                caja dura; velo de vidrio violeta + meridiano de luz a la izq.
                Cristaliza desde la bruma (MaterializeIn, injerto D4 de
                legibilidad: emerge condensándose). */}
            <MaterializeIn
                duration={620}
                delay={160}
                style={{ position: "relative", zIndex: 1 }}
            >
                <div
                    style={{
                        position: "relative",
                        padding: isMobile ? "16px 16px 16px 20px" : "20px 22px 20px 26px",
                        borderRadius: 14,
                        background: `linear-gradient(165deg, ${hx(
                            DREAM_DEEP,
                            0.16
                        )}, rgba(6,8,22,0.5))`,
                        border: `1px solid ${hx(DREAM, 0.16)}`,
                    }}
                >
                    {/* meridiano de luz lavanda (filete vertical izq). */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 14,
                            bottom: 14,
                            width: 2,
                            borderRadius: 2,
                            background: `linear-gradient(180deg, transparent, ${hx(
                                DREAM,
                                0.7
                            )}, ${hx(SILVER, 0.4)}, transparent)`,
                            boxShadow: `0 0 8px ${hx(DREAM, 0.5)}`,
                        }}
                    />
                    <div
                        style={{
                            fontSize: 9.5,
                            fontWeight: 600,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: hx(DREAM, 0.62),
                            marginBottom: 11,
                        }}
                    >
                        ◈ Decodificación de tu sueño
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: isMobile ? 14.5 : 15.5,
                            fontWeight: 300,
                            lineHeight: 1.74,
                            color: "#E9EEFB",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {dictamen.dictamen_vibral ||
                            "Tu decodificación aún se condensa de la niebla."}
                    </p>
                </div>
            </MaterializeIn>

            {/* (D) LÍNEA DE DECLINACIÓN — eje de plata con tick-marks que
                "mide" la directiva. Separa el dictamen del rumbo. */}
            <div
                aria-hidden
                style={{
                    position: "relative",
                    zIndex: 1,
                    height: 14,
                    margin: isMobile ? "18px 0 4px" : "22px 0 6px",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${hx(
                            SILVER,
                            0.45
                        )} 30%, ${hx(SILVER, 0.45)} 70%, transparent)`,
                    }}
                />
                <span
                    style={{
                        margin: "0 10px",
                        fontSize: 11,
                        color: hx(SILVER, 0.6),
                        textShadow: `0 0 8px ${hx(DREAM, 0.5)}`,
                    }}
                >
                    ⟡
                </span>
                <div
                    style={{
                        flex: 1,
                        height: 1,
                        backgroundImage: `repeating-linear-gradient(90deg, ${hx(
                            SILVER,
                            0.35
                        )} 0 1px, transparent 1px 7px)`,
                    }}
                />
            </div>

            {/* (E) RUMBO SELLADO — la calibración como directiva-comando.
                Glifo de rumbo + label mono; la franja se tiñe de la banda
                SOLO en "descarga" (donde el oro es natural), plata-lavanda
                neutra en las otras → integrado a la noche, sin parche dorado. */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    padding: isMobile ? "16px 16px" : "18px 20px",
                    borderRadius: 14,
                    border: `1px solid ${
                        m.key === "descarga"
                            ? hx(m.color, 0.4)
                            : hx(SILVER, 0.2)
                    }`,
                    background:
                        m.key === "descarga"
                            ? `linear-gradient(135deg, ${m.soft}, rgba(8,8,16,0.6))`
                            : `linear-gradient(135deg, ${hx(
                                  DREAM_DEEP,
                                  0.14
                              )}, rgba(6,7,20,0.62))`,
                    boxShadow:
                        m.key === "descarga"
                            ? `0 0 22px ${hx(m.color, 0.12)}`
                            : `0 0 22px ${hx(DREAM_DEEP, 0.14)}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 11,
                    }}
                >
                    <span
                        style={{
                            color:
                                m.key === "descarga" ? m.color : SILVER,
                            fontSize: 13,
                            textShadow: `0 0 10px ${hx(
                                m.key === "descarga" ? m.color : DREAM,
                                0.6
                            )}`,
                        }}
                    >
                        ⟡
                    </span>
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color:
                                m.key === "descarga"
                                    ? m.color
                                    : hx(SILVER, 0.8),
                        }}
                    >
                        Rumbo de Calibración
                    </span>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: isMobile ? 13 : 13.5,
                        fontWeight: 400,
                        lineHeight: 1.64,
                        color: m.key === "descarga" ? "#F5E9CC" : "#EAF0FF",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {dictamen.calibracion_quirurgica ||
                        "El cielo aún no marca el rumbo."}
                </p>
            </div>
        </div>

        {/* Cerrar el oráculo — "Decodificar otro sueño". v1.27 — gap fijo bajo
            la tarjeta (antes marginTop:auto lo pegaba a la tarjeta). */}
        <button
            type="button"
            onClick={onReset}
            style={{
                marginTop: isMobile ? 30 : 24,
                alignSelf: "center",
                padding: "10px 22px",
                borderRadius: 999,
                border: `1px solid ${hx(DREAM, 0.3)}`,
                background: "transparent",
                color: hx(SILVER, 0.7),
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
            }}
        >
            Decodificar otro sueño
        </button>
        </>
    )
}
DreamCartaCard.displayName = "DreamCartaCard"

/* ════════════════════════════════════════════════════════════════
   REVELACIÓN DE LA CARTA — secuencia inmersiva del resultado.
   El sueño NO llega como tarjeta dentro del celular: se REVELA a pantalla
   completa, como un dispositivo mágico despertando en las manos.
     1) CONSTELACIÓN — se dibuja sola, épica, en el centro; se desvanece.
     2) LECTURA — el dictamen se materializa carácter a carácter (háptico
        por frase); un toque acelera, otro (ya completo) avanza.
     3) CALIBRACIÓN — el rumbo se revela igual; un toque avanza.
     4) CARTA — la tarjeta-astrolabio en reposo, con ambos textos + botón.
   Continuo = CSS/SMIL; framer SOLO entradas/salidas one-shot. Háptico real
   en iOS vía @capacitor/haptics (registro global); fallback navigator.vibrate.
   ════════════════════════════════════════════════════════════════ */

/* Háptico seguro — usa @capacitor/haptics (impact) en iOS nativo vía el
   registro global de Capacitor; cae a navigator.vibrate en web. No-op si
   ninguno existe. */
function haptic(ms: number) {
    try {
        const H = (window as any)?.Capacitor?.Plugins?.Haptics
        if (H && typeof H.impact === "function") {
            H.impact({ style: ms >= 22 ? "MEDIUM" : "LIGHT" })
            return
        }
    } catch {}
    try {
        if (typeof navigator !== "undefined" && (navigator as any).vibrate)
            (navigator as any).vibrate(ms)
    } catch {}
}

/* RevealText — máquina de escribir onírica: el texto se materializa carácter
   a carácter (lento, "recién despierto") con un pulso háptico en cada frase.
   Un toque acelera (revela todo); con el texto completo, otro toque avanza.
   El timer TERMINA (no es ambiental) → perf 10K. */
function RevealText({
    text = "",
    isMobile = false,
    accent = "#B59CFF",
    label = "",
    mono = false,
    onAdvance,
    hint = "Toca para continuar",
}: {
    text?: string
    isMobile?: boolean
    accent?: string
    label?: string
    mono?: boolean
    onAdvance?: () => void
    hint?: string
}) {
    const safe = typeof text === "string" && text.length ? text : ""
    const accentHex =
        typeof accent === "string" && accent.startsWith("#") ? accent : "#B59CFF"
    const [n, setN] = useState(0)
    const [done, setDone] = useState(false)
    const nRef = useRef(0)
    const lastB = useRef(-99)
    useEffect(() => {
        setN(0)
        setDone(false)
        nRef.current = 0
        lastB.current = -99
        if (!safe) {
            setDone(true)
            return
        }
        const id = window.setInterval(() => {
            nRef.current = Math.min(safe.length, nRef.current + 1)
            setN(nRef.current)
            const ch = safe[nRef.current - 1]
            if (ch && /[.!?…\n]/.test(ch) && nRef.current > lastB.current + 10) {
                lastB.current = nRef.current
                haptic(9)
            }
            if (nRef.current >= safe.length) {
                window.clearInterval(id)
                setDone(true)
                haptic(15)
            }
        }, 26)
        return () => window.clearInterval(id)
    }, [safe])
    const tap = () => {
        if (!done) {
            nRef.current = safe.length
            setN(safe.length)
            setDone(true)
            haptic(12)
        } else {
            haptic(18)
            onAdvance?.()
        }
    }
    return (
        <div
            onClick={tap}
            role="button"
            tabIndex={0}
            style={{
                position: "relative",
                zIndex: 1,
                flex: 1,
                width: "100%",
                maxWidth: 560,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? "0 22px" : "0 28px",
                cursor: "pointer",
                textAlign: "center",
            }}
        >
            {label ? (
                <div
                    style={{
                        fontFamily: mono
                            ? "'JetBrains Mono', monospace"
                            : "'Inter', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: hx(accentHex, 0.85),
                        textShadow: `0 0 14px ${hx(accentHex, 0.5)}`,
                        marginBottom: isMobile ? 22 : 26,
                    }}
                >
                    {label}
                </div>
            ) : null}
            <p
                style={{
                    margin: 0,
                    fontFamily: mono
                        ? "'JetBrains Mono', monospace"
                        : "'Inter', sans-serif",
                    fontSize: mono
                        ? isMobile
                            ? 15
                            : 16
                        : isMobile
                          ? 18
                          : 20,
                    fontWeight: mono ? 400 : 300,
                    lineHeight: mono ? 1.72 : 1.8,
                    letterSpacing: "0.01em",
                    color: mono ? "#F2ECDA" : "#EAF0FF",
                    whiteSpace: "pre-wrap",
                    textShadow: `0 0 24px ${hx(accentHex, 0.2)}`,
                }}
            >
                {safe.slice(0, n)}
                {!done ? (
                    <span
                        aria-hidden
                        style={{
                            display: "inline-block",
                            width: mono ? 8 : 9,
                            height: mono ? 16 : 19,
                            marginLeft: 2,
                            verticalAlign: "text-bottom",
                            borderRadius: 2,
                            background: accentHex,
                            boxShadow: `0 0 10px ${hx(accentHex, 0.9)}`,
                            animation: "esc-dream-caret 1s steps(1) infinite",
                        }}
                    />
                ) : null}
            </p>
            <div
                style={{
                    height: 22,
                    marginTop: isMobile ? 30 : 36,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: hx(SILVER, 0.6),
                    opacity: done ? 1 : 0,
                    animation: done
                        ? "esc-dream-hint 2.4s ease-in-out infinite"
                        : undefined,
                }}
            >
                {hint}
            </div>
        </div>
    )
}
RevealText.displayName = "RevealText"

/* DreamRevelation — la máquina de etapas de la revelación. Llena el alto bajo
   el header; las etapas inmersivas se centran y la CARTA final se ancla al pie
   (botón justo por encima de la barra de navegación, sin tocar el espacio
   entre la tarjeta y el botón). Dispara el motor del campo (onda/aurora/tensión)
   y hápticos en cada transición. */
function DreamRevelation({
    dictamen,
    meta,
    isMobile = false,
    onReset,
    onImmersiveChange,
}: {
    dictamen?: any
    meta?: any
    isMobile?: boolean
    onReset?: () => void
    onImmersiveChange?: (immersive: boolean) => void
}) {
    const m = meta || BANDAS.simulador
    const color =
        typeof m?.color === "string" && m.color.startsWith("#") ? m.color : CYAN
    const [stage, setStage] = useState<
        "constellation" | "lectura" | "calibracion" | "card"
    >("constellation")
    const rootRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        ensureDreamCss()
    }, [])

    /* La revelación (constelación + lectura + calibración) es INMERSIVA:
       el header y la barra inferior se desvanecen; la CARTA final restaura
       todo. La fase de carga la cubre DreamDecoderView. */
    useEffect(() => {
        onImmersiveChange?.(stage !== "card")
    }, [stage])

    /* CONSTELACIÓN — háptico + onda al entrar; auto-avanza tras el trazado. */
    useEffect(() => {
        if (stage !== "constellation") return
        haptic(16)
        const el = rootRef.current
        if (el) {
            const r = el.getBoundingClientRect()
            requestAnimationFrame(() => {
                fireFieldWave(r.left + r.width / 2, r.top + r.height * 0.42, {
                    color,
                })
            })
        }
        const t = window.setTimeout(() => {
            haptic(10)
            setStage("lectura")
        }, 3600)
        return () => window.clearTimeout(t)
    }, [stage, color])

    /* CARTA final — materialización + humor del campo según la banda. */
    useEffect(() => {
        if (stage !== "card") return
        const el = rootRef.current
        if (!el) return
        haptic(22)
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + Math.min(r.height * 0.3, 240)
            fireMaterialize(cx, cy, { color, count: 18, radius: 150 })
            fireFieldWave(cx, cy, { color })
            const key = (m?.key || "simulador").toString()
            if (key === "descarga") fireAuroraBloom({ duration: 2200 })
            else if (key === "purga")
                fireFieldTension({
                    color: "rgba(224,138,147,0.32)",
                    duration: 1400,
                })
        })
    }, [stage, color])

    /* Transición lectura→calibracion / calibracion→card: onda del campo. */
    const advanceFrom = (to: "calibracion" | "card") => {
        const el = rootRef.current
        if (el) {
            const r = el.getBoundingClientRect()
            fireFieldWave(r.left + r.width / 2, r.top + r.height * 0.45, {
                color,
            })
        }
        setStage(to)
    }

    /* Alto inmersivo (header colapsado + nav oculta) → cada etapa de la
       revelación llena la pantalla; la constelación queda un toque arriba
       del centro óptico. */
    const immersiveFill = isMobile ? "calc(100dvh - 72px)" : 520

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <AnimatePresence mode="wait">
                {stage === "constellation" && (
                    <motion.div
                        key="r-constellation"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.35, filter: "blur(9px)" }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                            haptic(10)
                            setStage("lectura")
                        }}
                        style={{
                            minHeight: immersiveFill,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingBottom: isMobile ? "12vh" : 60,
                            cursor: "pointer",
                        }}
                    >
                        <DreamLens
                            size={isMobile ? 316 : 348}
                            color={color}
                            soft={m?.soft}
                        />
                        <div
                            style={{
                                marginTop: isMobile ? 28 : 34,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.3em",
                                textTransform: "uppercase",
                                color: hx(SILVER, 0.6),
                                animation: "esc-dream-hint 2.6s ease-in-out infinite",
                            }}
                        >
                            Decodificación lista
                        </div>
                    </motion.div>
                )}

                {stage === "lectura" && (
                    <motion.div
                        key="r-lectura"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            minHeight: immersiveFill,
                            display: "flex",
                            flexDirection: "column",
                            paddingBottom: isMobile ? "6vh" : 40,
                        }}
                    >
                        <RevealText
                            text={dictamen?.dictamen_vibral || ""}
                            isMobile={isMobile}
                            accent={DREAM}
                            label="◈ Decodificación de tu sueño"
                            onAdvance={() => advanceFrom("calibracion")}
                            hint="Toca para tu calibración"
                        />
                    </motion.div>
                )}

                {stage === "calibracion" && (
                    <motion.div
                        key="r-calibracion"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            minHeight: immersiveFill,
                            display: "flex",
                            flexDirection: "column",
                            paddingBottom: isMobile ? "6vh" : 40,
                        }}
                    >
                        <RevealText
                            text={dictamen?.calibracion_quirurgica || ""}
                            isMobile={isMobile}
                            accent={m?.key === "descarga" ? color : "#D8E0F2"}
                            label="⟡ Rumbo de Calibración"
                            mono
                            onAdvance={() => advanceFrom("card")}
                            hint="Toca para ver tu decodificación completa"
                        />
                    </motion.div>
                )}

                {stage === "card" && (
                    <motion.div
                        key="r-card"
                        initial={{ opacity: 0, y: 18, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            maxWidth: 520,
                            marginLeft: "auto",
                            marginRight: "auto",
                            boxSizing: "border-box",
                            // v1.27 — La tarjeta baja un poco (la lente despeja el
                            // notch) y queda en reposo content-sized (sin alto
                            // forzado): el botón "Decodificar otro sueño" deja de
                            // anclarse al pie y respira bajo la tarjeta.
                            paddingTop: isMobile ? 36 : 0,
                            paddingBottom: isMobile
                                ? "calc(env(safe-area-inset-bottom, 0px) + 80px)"
                                : 40,
                        }}
                    >
                        <DreamCartaCard
                            dictamen={dictamen}
                            meta={m}
                            isMobile={isMobile}
                            onReset={onReset}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
DreamRevelation.displayName = "DreamRevelation"


function HubCard({
    sigil,
    title,
    subtitle,
    accent,
    onClick,
    delay,
    isMobile,
}: {
    sigil: React.ReactNode
    title: string
    subtitle: string
    accent: string
    onClick: () => void
    delay: number
    isMobile: boolean
}) {
    const [hover, setHover] = useState(false)
    return (
        <motion.button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.985 }}
            style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 16 : 26,
                padding: isMobile ? "18px 18px" : "26px 30px",
                borderRadius: 22,
                cursor: "pointer",
                textAlign: "left",
                border: `1px solid ${hx(accent, hover ? 0.55 : 0.28)}`,
                background: `linear-gradient(135deg, ${hx(accent, 0.12)}, rgba(6,12,26,0.6) 60%)`,
                boxShadow: hover
                    ? `0 18px 50px rgba(0,0,0,0.45), 0 0 40px ${hx(accent, 0.28)}, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : `0 12px 32px rgba(0,0,0,0.4), 0 0 18px ${hx(accent, 0.12)}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                transition: "border 0.25s ease, box-shadow 0.25s ease",
                overflow: "hidden",
            }}
        >
            {/* grano fino — tacto sólido, premium */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    backgroundImage: DREAM_GRAIN,
                    backgroundSize: "120px 120px",
                    opacity: 0.13,
                    mixBlendMode: "soft-light",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
            {/* sheen superior — brillo de cristal */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: "48%",
                    borderRadius: "inherit",
                    background: `linear-gradient(180deg, ${hx("#FFFFFF", 0.09)}, transparent)`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    flexShrink: 0,
                    width: isMobile ? 92 : 120,
                    height: isMobile ? 92 : 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {sigil}
            </div>
            <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isMobile ? 16 : 21,
                        fontWeight: 400,
                        letterSpacing: "0.08em",
                        color: "#F3F7FF",
                        textTransform: "uppercase",
                        lineHeight: 1.25,
                        textShadow: `0 0 18px ${hx(accent, 0.4)}`,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        marginTop: 7,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isMobile ? 12 : 13.5,
                        fontWeight: 300,
                        letterSpacing: "0.02em",
                        color: hx(SILVER, 0.62),
                        lineHeight: 1.5,
                    }}
                >
                    {subtitle}
                </div>
            </div>
            <motion.div
                animate={{ x: hover ? 4 : 0, opacity: hover ? 1 : 0.5 }}
                style={{
                    position: "relative",
                    zIndex: 1,
                    flexShrink: 0,
                    color: accent,
                    fontSize: 22,
                    fontWeight: 300,
                }}
            >
                ›
            </motion.div>
        </motion.button>
    )
}

function DecoderHub({
    isMobile,
    onPick,
}: {
    isMobile: boolean
    onPick: (k: "materia" | "suenos") => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: 560,
                margin: "0 auto",
                paddingTop: isMobile
                    ? "calc(env(safe-area-inset-top, 0px) + 8px)"
                    : 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? 16 : 22,
                minHeight: isMobile ? "calc(100dvh - 110px)" : undefined,
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: "center", marginBottom: isMobile ? 4 : 8 }}
            >
                <div
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isMobile ? 22 : 30,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "transparent",
                        background: `linear-gradient(180deg, ${CYAN}, #fff)`,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: `drop-shadow(0 0 14px ${hx(CYAN, 0.3)})`,
                    }}
                >
                    Decodificadores
                </div>
            </motion.div>

            {/* Los dos sellos, como un par. Más aire entre ambos + el par sube
                un poco (paddingBottom) → Materia queda más arriba y Sueños
                cerca de su lugar. */}
            <div
                style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: isMobile ? 26 : 32,
                    paddingBottom: isMobile ? 48 : 24,
                }}
            >
                <HubCard
                    sigil={<MateriaSigil size={isMobile ? 88 : 116} />}
                    title="Decodificador de Materia"
                    subtitle="Termodinámica de lo que ingresa a tu hardware. Escanea etiquetas, alimentos y sustancias."
                    accent={GOLD}
                    onClick={() => onPick("materia")}
                    delay={0.1}
                    isMobile={isMobile}
                />
                <HubCard
                    sigil={<SuenosSigil size={isMobile ? 88 : 116} />}
                    title="Decodificador de Sueños"
                    subtitle="Telemetría de tus sueños. Decodifica la termodinámica de tu consciencia en fase de sueño."
                    accent={DREAM}
                    onClick={() => onPick("suenos")}
                    delay={0.22}
                    isMobile={isMobile}
                />
            </div>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   MEDIDOR DE LECTURAS — contador freemium épico del Decodificador de Sueños.
   Gemelo del DecoderShotsMeter del de Materia, pero con el SÍMBOLO de Sueños
   (luna creciente del SuenosSigil) en vez del hexágono cristalino. 3 lunas:
   encendidas = lecturas restantes, apagadas = gastadas. Al quedar 1, la última
   luna late (urgencia) y el copy pasa a "Te queda 1 lectura".
   ════════════════════════════════════════════════════════════════ */
function DreamShotGem({
    lit,
    pulse,
    idx,
}: {
    lit: boolean
    pulse: boolean
    idx: number
}) {
    const gid = `ev-dream-gem-${idx}`
    return (
        <motion.svg
            width={27}
            height={27}
            viewBox="0 0 24 24"
            fill="none"
            animate={
                pulse
                    ? { scale: [1, 1.16, 1], opacity: [0.85, 1, 0.85] }
                    : lit
                      ? { scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }
                      : { scale: 1, opacity: 1 }
            }
            transition={
                pulse
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : lit
                      ? {
                            duration: 3.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: idx * 0.3,
                        }
                      : { duration: 0.3 }
            }
            style={{
                overflow: "visible",
                filter: lit
                    ? `drop-shadow(0 0 ${pulse ? 10 : 6}px ${hx(DREAM, pulse ? 0.85 : 0.55)})`
                    : "none",
                transformBox: "fill-box",
                transformOrigin: "center",
            }}
        >
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="55%" stopColor={SILVER} />
                    <stop offset="100%" stopColor={DREAM} />
                </linearGradient>
            </defs>
            {/* luna creciente — eco del SuenosSigil */}
            <path
                d="M15 4.5 A7.8 7.8 0 1 0 15 19.5 A6 6 0 1 1 15 4.5 Z"
                fill={lit ? `url(#${gid})` : "transparent"}
                fillOpacity={lit ? 0.95 : 0}
                stroke={lit ? "#FFFFFF" : "rgba(216,224,242,0.22)"}
                strokeOpacity={lit ? 0.5 : 1}
                strokeWidth={lit ? 0.7 : 1.1}
                strokeLinejoin="round"
            />
            {/* estrellitas en el hueco de la luna (solo encendida) */}
            {lit && (
                <>
                    <circle cx="8.6" cy="7.4" r="0.8" fill="#FFFFFF" opacity="0.85" />
                    <circle cx="7.4" cy="12.2" r="0.6" fill={SILVER} opacity="0.7" />
                </>
            )}
        </motion.svg>
    )
}

function DreamShotsMeter({
    used,
    onTap,
    isMobile,
}: {
    used: number
    onTap: () => void
    isMobile: boolean
}) {
    const remaining = Math.max(0, 3 - used)
    const exhausted = remaining === 0
    const last = remaining === 1
    const label = exhausted
        ? "Sin decodificaciones · activa Sintonía"
        : last
          ? "Te queda 1 decodificación"
          : `Te quedan ${remaining} decodificaciones`
    return (
        <motion.button
            type="button"
            onClick={onTap}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            whileTap={{ scale: 0.97 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
                padding: "2px 10px",
                marginTop: "auto",
                marginBottom: "auto",
                alignSelf: "center",
                fontFamily: "'Inter',sans-serif",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    gap: 13,
                    alignItems: "center",
                }}
            >
                {[0, 1, 2].map((i) => (
                    <DreamShotGem
                        key={i}
                        idx={i}
                        lit={i < remaining}
                        pulse={last && i === 0}
                    />
                ))}
            </div>
            <motion.span
                animate={
                    exhausted || last
                        ? { opacity: [0.72, 1, 0.72] }
                        : { opacity: 1 }
                }
                transition={
                    exhausted || last
                        ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                }
                style={{
                    fontSize: isMobile ? 11 : 11.5,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: exhausted || last ? DREAM : hx(SILVER, 0.78),
                    textShadow:
                        exhausted || last
                            ? `0 0 12px ${hx(DREAM, 0.55)}`
                            : `0 0 10px ${hx(DREAM, 0.25)}`,
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </motion.span>
        </motion.button>
    )
}

/* v1.28 — Estatus progresivo de la decodificación. Un solo texto fijo, tras
   varios segundos, parece congelado; estos mensajes avanzan en el tiempo y
   dan sensación de progreso (el último se sostiene hasta que llega el
   resultado). Lenguaje llano, sin jerga. */
const DECODING_STEPS = [
    "Decodificando tu sueño…",
    "Leyendo los símbolos…",
    "Interpretando el mensaje…",
    "Afinando tu decodificación…",
    "Casi listo…",
]

/* ════════════════════════════════════════════════════════════════
   DECODIFICADOR DE SUEÑOS — interfaz de estasis.
   ════════════════════════════════════════════════════════════════ */
function DreamDecoderView({
    isMobile,
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    hasDreamAccess = false,
    isAuthed = true,
    onUnauthedAttempt,
    onDreamPaywall,
    onSoftInvite,
    onBack,
}: {
    isMobile: boolean
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    hasDreamAccess?: boolean
    isAuthed?: boolean
    onUnauthedAttempt?: () => void
    onDreamPaywall?: () => void
    onSoftInvite?: (remaining: number) => void
    onBack?: () => void
}) {
    /* Borrador persistente del sueño: el texto se guarda en localStorage a
       medida que se escribe y se restaura al volver, para no perder un sueño
       largo si la app se cierra o se acaba la batería antes de decodificar. */
    const draftKey = () => {
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        return `rsv_dream_draft_${uid || "anon"}`
    }
    const [text, setText] = useState<string>(() => {
        try {
            if (typeof window !== "undefined")
                return localStorage.getItem(draftKey()) || ""
        } catch {}
        return ""
    })
    useEffect(() => {
        try {
            const k = draftKey()
            if (text.trim()) localStorage.setItem(k, text)
            else localStorage.removeItem(k)
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, clerkUserId])
    const [focused, setFocused] = useState(false)
    const [vaultOpen, setVaultOpen] = useState(false)
    const [phase, setPhase] = useState<"idle" | "decoding" | "result" | "error">(
        "idle"
    )
    const [dictamen, setDictamen] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState("")
    /* v1.28 — Avanza el mensaje de estatus mientras decodifica (≈2.6s/paso,
       se sostiene en el último). Se reinicia al salir de "decoding". */
    const [decodingStep, setDecodingStep] = useState(0)
    useEffect(() => {
        if (phase !== "decoding") {
            setDecodingStep(0)
            return
        }
        const id = window.setInterval(() => {
            setDecodingStep((s) => Math.min(s + 1, DECODING_STEPS.length - 1))
        }, 2600)
        return () => window.clearInterval(id)
    }, [phase])
    const [immersive, setImmersive] = useState(false)
    /* Modo inmersivo: durante "decodificando" y la revelación se desvanecen
       el header y la barra inferior (rsv-immersive-on/off → AppShell/nav);
       la CARTA final los restaura. La revelación lo controla por
       onImmersiveChange; acá cubrimos la carga y la limpieza al salir. */
    useEffect(() => {
        if (phase === "decoding") setImmersive(true)
        else if (phase === "idle" || phase === "error") setImmersive(false)
    }, [phase])
    useEffect(() => {
        if (typeof window === "undefined") return
        window.dispatchEvent(
            new Event(immersive ? "rsv-immersive-on" : "rsv-immersive-off")
        )
    }, [immersive])
    useEffect(
        () => () => {
            if (typeof window !== "undefined")
                window.dispatchEvent(new Event("rsv-immersive-off"))
        },
        []
    )
    const taRef = useRef<HTMLTextAreaElement | null>(null)
    /* Inyecta las keyframes esc-dream-* sin depender de useInjectCss → la
       Carta Estelar respira aunque el Code File se instancie standalone. */
    useEffect(() => {
        ensureDreamCss()
    }, [])
    /* Freemium: 3 lecturas de por vida para quien no tiene acceso (Sintonía
       o el futuro tier 399). El límite lo aplica la edge server-side; acá
       leemos el conteo para el badge y para no gastar una llamada agotada. */
    const [freeShotsUsed, setFreeShotsUsed] = useState<number | null>(null)
    useEffect(() => {
        if (hasDreamAccess) {
            setFreeShotsUsed(null)
            return
        }
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        if (!uid || !supabaseUrl || !supabaseAnonKey) return
        let cancelled = false
        ;(async () => {
            try {
                // Gateway user-action: inyecta el clerk_user_id verificado del
                // token (ignora cualquier id forjado). Cierra el IDOR del contador.
                const n = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_dream_scan_count",
                    {}
                )
                if (!cancelled) setFreeShotsUsed(typeof n === "number" ? n : 0)
            } catch {
                if (!cancelled) setFreeShotsUsed(0)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [hasDreamAccess, clerkUserId, supabaseUrl, supabaseAnonKey])

    const handleDecode = async () => {
        if (phase === "decoding") return
        const clean = text.trim()
        if (clean.length < 12) {
            setErrorMsg(
                "Describe la telemetría de tus sueños con un poco más de detalle."
            )
            taRef.current?.focus()
            return
        }
        /* Fricción cero: el invitado escribe libre. El muro se levanta al
           ejecutar. Sin sesión → identificación; sin Sintonía → muro. */
        if (!isAuthed) {
            onUnauthedAttempt?.()
            return
        }
        if (
            !hasDreamAccess &&
            freeShotsUsed !== null &&
            freeShotsUsed >= 3
        ) {
            onDreamPaywall?.()
            return
        }
        setErrorMsg("")
        setDictamen(null)
        setPhase("decoding")
        let token: string | null = null
        try {
            token = (await (window as any).Clerk?.session?.getToken?.()) || null
        } catch {}
        try {
            const r = await fetch(`${supabaseUrl}/functions/v1/decode-dream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    apikey: supabaseAnonKey,
                },
                body: JSON.stringify({ token, dream_text: clean }),
            })
            if (!r.ok) {
                let code = ""
                try {
                    code = JSON.parse(await r.text())?.error || ""
                } catch {}
                console.error("[DREAM] edge fn error:", r.status, code)
                if (
                    r.status === 403 &&
                    (code === "free_limit_reached" || code === "members_only")
                ) {
                    setPhase("idle")
                    onDreamPaywall?.()
                    return
                }
                if (r.status === 401) {
                    setErrorMsg("Inicia sesión para decodificar tu estasis.")
                    setPhase("error")
                    return
                }
                setErrorMsg(
                    "Interferencia con el núcleo de síntesis. Reintenta."
                )
                setPhase("error")
                return
            }
            const json = await r.json()
            if (
                !json ||
                typeof json.dictamen_vibral !== "string" ||
                typeof json.calibracion_quirurgica !== "string"
            ) {
                setErrorMsg("Señal corrupta en la decodificación. Reintenta.")
                setPhase("error")
                return
            }
            setDictamen(json)
            setPhase("result")
            /* Decodificado: el borrador ya no hace falta. */
            try {
                localStorage.removeItem(draftKey())
            } catch {}
            if (!hasDreamAccess) {
                /* preUsed = conteo ANTES de este sueño (valor del closure). */
                const preUsed = freeShotsUsed
                setFreeShotsUsed((n) => (n === null ? 1 : n + 1))
                /* Invitación suave (no bloqueante): tras el 1er/2do sueño, si
                   aún quedan lecturas, nudge gentil con delay para que el
                   Tripulante vea su dictamen primero. Espejo de Materia. */
                if (onSoftInvite) {
                    const remaining = 3 - ((preUsed === null ? 0 : preUsed) + 1)
                    if (remaining > 0 && typeof window !== "undefined")
                        window.setTimeout(
                            () => onSoftInvite(remaining),
                            1100
                        )
                }
            }
        } catch (e: any) {
            console.error("[DREAM] fetch error:", e)
            setErrorMsg("Pérdida de señal con la bóveda. Reintenta.")
            setPhase("error")
        }
    }

    const reset = () => {
        setPhase("idle")
        setDictamen(null)
        setErrorMsg("")
    }

    const meta = dictamen ? bandaMeta(dictamen) : BANDAS.simulador

    if (vaultOpen)
        return (
            <DreamVault
                isMobile={isMobile}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                clerkUserId={clerkUserId}
                isAuthed={isAuthed}
                onUnauthedAttempt={onUnauthedAttempt}
                onBack={() => setVaultOpen(false)}
            />
        )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: 600,
                margin: "0 auto",
                paddingTop: isMobile
                    ? "calc(env(safe-area-inset-top, 0px) + 6px)"
                    : 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
            }}
        >
            {/* Header con back + título — se colapsa/desvanece durante la
                revelación inmersiva (constelación/lectura/calibración). */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: immersive ? 0 : isMobile ? 12 : 22,
                    maxHeight: immersive ? 0 : 80,
                    opacity: immersive ? 0 : 1,
                    overflow: "hidden",
                    pointerEvents: immersive ? "none" : "auto",
                    transition:
                        "opacity 0.4s ease, max-height 0.45s ease, margin-bottom 0.45s ease",
                }}
            >
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Volver a los decodificadores"
                    style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: `1px solid ${hx(DREAM, 0.35)}`,
                        background: hx(DREAM, 0.08),
                        color: SILVER,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 300,
                        lineHeight: 1,
                    }}
                >
                    ‹
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: isMobile ? 14 : 19,
                            fontWeight: 300,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "transparent",
                            background: `linear-gradient(180deg, ${DREAM}, #fff)`,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            lineHeight: 1.2,
                        }}
                    >
                        Decodificador de Sueños
                    </div>
                </div>
                {/* Acceso a la Bóveda de Estasis (galería de sueños). */}
                <button
                    type="button"
                    onClick={() => setVaultOpen(true)}
                    aria-label="Abrir la Bóveda de Sueños"
                    style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "9px 13px",
                        borderRadius: 999,
                        border: `1px solid ${hx(DREAM, 0.4)}`,
                        background: `linear-gradient(135deg, ${hx(DREAM, 0.16)}, rgba(6,12,26,0.6))`,
                        color: SILVER,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                    }}
                >
                    <VaultGlyph size={15} />
                    {isMobile ? "Bóveda" : "Bóveda de Sueños"}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* ── IDLE: input ── */}
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            /* minHeight para que el medidor de lunas (marginTop/
                               Bottom auto) caiga centrado en el hueco entre el
                               botón Decodificar y la barra de navegación. */
                            minHeight: isMobile
                                ? "calc(100dvh - 150px)"
                                : undefined,
                            paddingBottom: isMobile
                                ? "calc(env(safe-area-inset-bottom, 0px) + 104px)"
                                : 0,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                // Un respiro más entre el título y el recuadro.
                                marginTop: isMobile ? 14 : 8,
                                borderRadius: 18,
                                padding: 1.5,
                                background: focused
                                    ? `linear-gradient(135deg, ${hx(DREAM, 0.7)}, ${hx(CYAN, 0.5)})`
                                    : hx(DREAM, 0.25),
                                boxShadow: focused
                                    ? `0 0 28px ${hx(DREAM, 0.3)}`
                                    : "none",
                                transition: "all 0.3s ease",
                            }}
                        >
                            <textarea
                                ref={taRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                maxLength={2200}
                                placeholder="Describe la telemetría de tus sueños..."
                                style={{
                                    width: "100%",
                                    minHeight: isMobile ? "28dvh" : 160,
                                    maxHeight: isMobile ? "38dvh" : 380,
                                    resize: "none",
                                    boxSizing: "border-box",
                                    padding: "18px 18px",
                                    borderRadius: 17,
                                    border: "none",
                                    outline: "none",
                                    background:
                                        "linear-gradient(165deg, rgba(8,12,28,0.96), rgba(4,8,20,0.98))",
                                    color: "#EAF0FF",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 300,
                                    lineHeight: 1.65,
                                    letterSpacing: "0.01em",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 8,
                                padding: "0 4px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    color: hx(SILVER, 0.4),
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {`${text.trim().length} caracteres`}
                            </span>
                            {errorMsg && (
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        color: "#E08A93",
                                        letterSpacing: "0.02em",
                                        textAlign: "right",
                                    }}
                                >
                                    {errorMsg}
                                </span>
                            )}
                        </div>

                        <motion.button
                            type="button"
                            onClick={handleDecode}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: 18,
                                width: "100%",
                                padding: "16px 24px",
                                borderRadius: 14,
                                border: `1px solid ${hx(DREAM, 0.55)}`,
                                background: `linear-gradient(135deg, ${DREAM_DEEP} 0%, ${DREAM} 45%, ${CYAN} 120%)`,
                                color: "#0B0C18",
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                boxShadow: `0 0 22px ${hx(DREAM, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                            }}
                        >
                            Decodificar Sueño
                        </motion.button>
                        {/* Medidor de lecturas épico (lunas) — al pie, solo para
                            invitados (con Sintonía / tier de Sueños es ilimitado). */}
                        {!hasDreamAccess && freeShotsUsed !== null && (
                            <DreamShotsMeter
                                used={freeShotsUsed}
                                isMobile={isMobile}
                                onTap={() => onDreamPaywall?.()}
                            />
                        )}
                    </motion.div>
                )}

                {/* ── DECODING ── */}
                {phase === "decoding" && (
                    <motion.div
                        key="decoding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: isMobile
                                ? "calc(100dvh - 150px)"
                                : 440,
                            // Con el header colapsado y la nav oculta, el loader
                            // se centra más abajo en la pantalla inmersiva.
                            padding: "0 0 24px",
                            gap: 22,
                        }}
                    >
                        <VaultOpeningAnim
                            size={isMobile ? 116 : 128}
                            caption={DECODING_STEPS[decodingStep]}
                        />
                    </motion.div>
                )}

                {/* ── RESULT · Revelación de la Carta (secuencia inmersiva) ── */}
                {phase === "result" && dictamen && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ width: "100%" }}
                    >
                        <DreamRevelation
                            dictamen={dictamen}
                            meta={meta}
                            isMobile={isMobile}
                            onReset={reset}
                            onImmersiveChange={setImmersive}
                        />
                    </motion.div>
                )}

                {/* ── ERROR ── */}
                {phase === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 18,
                            padding: "44px 0",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13.5,
                                fontWeight: 300,
                                lineHeight: 1.6,
                                color: "#E08A93",
                                maxWidth: 320,
                            }}
                        >
                            {errorMsg ||
                                "Interferencia con el núcleo de síntesis."}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPhase("idle")}
                            style={{
                                padding: "12px 26px",
                                borderRadius: 12,
                                border: `1px solid ${hx(DREAM, 0.45)}`,
                                background: hx(DREAM, 0.1),
                                color: SILVER,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Reintentar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   BÓVEDA DE ESTASIS — galería de sueños decodificados.
   ════════════════════════════════════════════════════════════════ */

/* Glifo de la Bóveda — constelación archivada (estrellas + líneas). */
function VaultGlyph({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
                d="M4.5 8.5 L12 4 L19.5 8.5"
                stroke={DREAM}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
            />
            <line
                x1="6"
                y1="14"
                x2="12"
                y2="11"
                stroke={hx(DREAM, 0.5)}
                strokeWidth="0.8"
            />
            <line
                x1="12"
                y1="11"
                x2="18"
                y2="15"
                stroke={hx(DREAM, 0.5)}
                strokeWidth="0.8"
            />
            <line
                x1="12"
                y1="11"
                x2="10"
                y2="18.5"
                stroke={hx(DREAM, 0.4)}
                strokeWidth="0.7"
            />
            <circle cx="6" cy="14" r="1.5" fill={SILVER} />
            <circle cx="12" cy="11" r="1.8" fill="#FFFFFF" />
            <circle cx="18" cy="15" r="1.4" fill={DREAM} />
            <circle cx="10" cy="18.5" r="1.1" fill={hx(SILVER, 0.75)} />
        </svg>
    )
}

/* Apertura de la Bóveda — animación premium: una constelación que se enciende.
   Las estrellas aparecen escalonadas y las líneas se trazan (stroke-dashoffset)
   como si la bóveda se abriera; un halo lavanda respira detrás. Técnica
   canónica: SMIL (animate) + CSS keyframes (compositor/GPU), NO framer-motion
   para lo continuo — y SMIL sigue corriendo en el preview headless. */
function VaultOpeningAnim({
    size = 128,
    caption,
}: {
    size?: number
    caption?: string
}) {
    // Halo respirante por CSS (inyectado idempotente por id).
    useEffect(() => {
        const id = "ev-vault-open-kf"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = `
@keyframes ev-vault-breathe {
  0%, 100% { transform: scale(0.9); opacity: 0.35; }
  50%      { transform: scale(1.12); opacity: 0.7; }
}
@keyframes ev-vault-ring {
  0%   { transform: scale(0.7); opacity: 0; }
  35%  { opacity: 0.55; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes ev-vault-caption {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}`
        document.head.appendChild(el)
    }, [])

    // Nodos de la constelación (coords en viewBox 0..100).
    const stars: [number, number, number][] = [
        [22, 30, 2.0], // 0
        [50, 18, 2.6], // 1 (vértice superior)
        [78, 30, 2.0], // 2
        [33, 56, 2.8], // 3 (centro)
        [67, 56, 2.4], // 4
        [50, 80, 2.2], // 5
    ]
    // Aristas de la constelación (índices a `stars`).
    const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [0, 3],
        [3, 4],
        [4, 2],
        [3, 5],
        [5, 4],
    ]
    const DASH = 70 // largo de trazo suficiente para cualquier arista
    const CYCLE = 4.2 // duración del ciclo completo (s)

    return (
        <div
            aria-hidden
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
            }}
        >
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Halo lavanda que respira detrás */}
            <div
                style={{
                    position: "absolute",
                    width: "78%",
                    height: "78%",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${hx(DREAM, 0.4)} 0%, ${hx(
                        DREAM_DEEP,
                        0.12
                    )} 45%, transparent 72%)`,
                    filter: "blur(2px)",
                    animation: "ev-vault-breathe 3.6s ease-in-out infinite",
                    transformOrigin: "center",
                }}
            />
            {/* Anillo que se expande, como compuerta que se abre */}
            <div
                style={{
                    position: "absolute",
                    width: "62%",
                    height: "62%",
                    borderRadius: "50%",
                    border: `1px solid ${hx(DREAM, 0.5)}`,
                    animation: "ev-vault-ring 3.6s ease-out infinite",
                    transformOrigin: "center",
                }}
            />
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                style={{ position: "relative", overflow: "visible" }}
            >
                <defs>
                    <radialGradient id="ev-vault-star" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="60%" stopColor={DREAM} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={DREAM} stopOpacity="0" />
                    </radialGradient>
                    <filter
                        id="ev-vault-soft"
                        x="-60%"
                        y="-60%"
                        width="220%"
                        height="220%"
                    >
                        <feGaussianBlur stdDeviation="1.1" />
                    </filter>
                </defs>

                {/* Líneas que se trazan (stroke-dashoffset vía SMIL) */}
                <g
                    stroke={hx(DREAM, 0.7)}
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    filter="url(#ev-vault-soft)"
                >
                    {edges.map(([a, b], i) => {
                        const [x1, y1] = stars[a]
                        const [x2, y2] = stars[b]
                        const begin = (0.45 + i * 0.18).toFixed(2)
                        return (
                            <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                strokeDasharray={DASH}
                                strokeDashoffset={DASH}
                                opacity="0"
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0;0.85;0.85;0"
                                    keyTimes="0;0.18;0.82;1"
                                    dur={`${CYCLE}s`}
                                    begin={`${begin}s`}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="stroke-dashoffset"
                                    values={`${DASH};0;0;${DASH}`}
                                    keyTimes="0;0.3;0.85;1"
                                    dur={`${CYCLE}s`}
                                    begin={`${begin}s`}
                                    repeatCount="indefinite"
                                    calcMode="spline"
                                    keySplines="0.16 1 0.3 1;0 0 1 1;0.4 0 0.6 1"
                                />
                            </line>
                        )
                    })}
                </g>

                {/* Estrellas que se encienden escalonadas (SMIL) */}
                {stars.map(([x, y, r], i) => {
                    const begin = (i * 0.16).toFixed(2)
                    return (
                        <g key={i}>
                            {/* halo del nodo */}
                            <circle
                                cx={x}
                                cy={y}
                                r={r * 2.6}
                                fill="url(#ev-vault-star)"
                                opacity="0"
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0;0.55;0.2;0.55;0"
                                    keyTimes="0;0.22;0.5;0.8;1"
                                    dur={`${CYCLE}s`}
                                    begin={`${begin}s`}
                                    repeatCount="indefinite"
                                />
                            </circle>
                            {/* núcleo del nodo */}
                            <circle cx={x} cy={y} r={r} fill="#FFFFFF" opacity="0">
                                <animate
                                    attributeName="opacity"
                                    values="0;1;0.7;1;0"
                                    keyTimes="0;0.2;0.5;0.82;1"
                                    dur={`${CYCLE}s`}
                                    begin={`${begin}s`}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="r"
                                    values={`0;${r * 1.25};${r};${r * 1.25};0`}
                                    keyTimes="0;0.2;0.5;0.82;1"
                                    dur={`${CYCLE}s`}
                                    begin={`${begin}s`}
                                    repeatCount="indefinite"
                                    calcMode="spline"
                                    keySplines="0.16 1 0.3 1;0.4 0 0.6 1;0.16 1 0.3 1;0.4 0 0.6 1"
                                />
                            </circle>
                        </g>
                    )
                })}
            </svg>
        </div>
        {caption ? (
            <div
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12.5,
                    letterSpacing: "0.08em",
                    color: DREAM,
                    textAlign: "center",
                    animation: "ev-vault-caption 1.8s ease-in-out infinite",
                }}
            >
                {caption}
            </div>
        ) : null}
        </div>
    )
}

/* Fecha humana del registro (ej. "10 jun 2026 · 03:14"). */
function fmtDreamDate(iso: string): string {
    try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return ""
        const fecha = d.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        const hora = d.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
        })
        return `${fecha} · ${hora}`
    } catch {
        return ""
    }
}

/* Campo de estrellas tenue detrás de la bóveda. */
function VaultStars() {
    const pts: [number, number, number][] = [
        [8, 9, 1],
        [24, 26, 0.7],
        [80, 14, 1.1],
        [92, 40, 0.8],
        [13, 58, 0.9],
        [88, 70, 1],
        [44, 84, 0.8],
        [66, 6, 0.7],
        [33, 38, 0.6],
        [70, 52, 0.9],
    ]
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: 0,
            }}
        >
            {pts.map(([x, y, r], i) => (
                <motion.span
                    key={i}
                    style={{
                        position: "absolute",
                        left: `${x}%`,
                        top: `${y}%`,
                        width: r * 2,
                        height: r * 2,
                        borderRadius: "50%",
                        background: i % 2 ? SILVER : "#FFFFFF",
                    }}
                    animate={{ opacity: [0.12, 0.7, 0.12] }}
                    transition={{
                        duration: 2.4 + (i % 3) * 0.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                    }}
                />
            ))}
        </div>
    )
}

/* Tarjeta de un sueño en la bóveda — colapsada muestra banda + fecha +
   extracto; expandida revela el sueño completo + dictamen + calibración. */
/* Grano fino (fractalNoise) — textura premium para las tarjetas de la Bóveda. */
const DREAM_GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='dn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23dn)'/%3E%3C/svg%3E\")"

/* Glifo de eliminar — papelera (se revela al deslizar la tarjeta). */
function TrashGlyph({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"
                stroke="#FFE2E6"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* Swipe-to-delete (SOLO hacia la izquierda, revelado EN VIVO): deslizar la
   tarjeta a la izquierda la mueve siguiendo el dedo y va destapando la papelera
   roja fija a la derecha (la tarjeta es OPACA → solo se ve el rojo que destapás).
   Deslizar a la DERECHA no hace nada (clamp duro en 0). Borrar ocurre SOLO al
   TOCAR el bote, nunca al soltar el deslizamiento. Tarjeta abierta → no arrastra. */
function SwipeToDelete({
    children,
    onDelete,
    disabled,
}: {
    children: any
    onDelete: () => void
    disabled?: boolean
}) {
    const [removing, setRemoving] = useState(false)
    const [open, setOpen] = useState(false)
    const REVEAL = 84
    const controls = useAnimationControls()
    const SPRING = { type: "spring" as const, stiffness: 520, damping: 46 }
    const snapTo = (isOpen: boolean) => {
        setOpen(isOpen)
        controls.start({ x: isOpen ? -REVEAL : 0, transition: SPRING })
    }
    useEffect(() => {
        controls.start({ x: open ? -REVEAL : 0, transition: SPRING })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])
    const doDelete = () => {
        setRemoving(true)
        setTimeout(() => onDelete(), 240)
    }
    return (
        <motion.div
            animate={
                removing
                    ? { opacity: 0, height: 0, marginBottom: 0, scale: 0.94 }
                    : { opacity: 1 }
            }
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: "relative",
                borderRadius: 16,
                // Las tarjetas fuera de pantalla no se re-rasterizan en el
                // reflow del teclado iOS — corta el freeze de 5-8s al editar.
                contentVisibility: "auto",
                containIntrinsicSize: "0 120px",
            }}
        >
            {/* Papelera fija a la DERECHA, siempre presente detrás de la tarjeta.
                Se revela en vivo a medida que la tarjeta se desliza a la izquierda. */}
            <button
                type="button"
                aria-label="Eliminar sueño"
                onClick={doDelete}
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: REVEAL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 16,
                    background:
                        "linear-gradient(180deg, rgba(224,52,78,0.97), rgba(158,28,52,0.97))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                    zIndex: 0,
                }}
            >
                <TrashGlyph />
            </button>
            {/* Tarjeta deslizable: drag solo izquierda (right:0 + dragElastic 0 la
                fijan a la derecha → mover el dedo a la derecha no la mueve). Base
                OPACA que tapa la papelera cuando está cerrada. */}
            <motion.div
                drag={disabled ? false : "x"}
                dragConstraints={{ left: -REVEAL, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                animate={controls}
                onDragEnd={(_e: any, info: any) => {
                    if (disabled) return
                    snapTo(info.offset.x < -REVEAL / 2 || info.velocity.x < -380)
                }}
                style={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: 16,
                    background: "#070C1A",
                    touchAction: "pan-y",
                }}
            >
                {children}
                {/* Con la papelera revelada, un tap en la tarjeta la cierra. */}
                {open && (
                    <div
                        onClick={() => snapTo(false)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 5,
                            borderRadius: 16,
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

function DreamRecordCard({
    rec,
    open,
    onToggle,
    onRename,
    delay,
}: {
    rec: any
    open: boolean
    onToggle: () => void
    onRename?: (title: string) => void
    delay: number
}) {
    const m = bandaMeta(rec)
    const date = fmtDreamDate(rec?.created_at || "")
    const A = (x: number) => hx(DREAM, x)
    const title = rec?.custom_title || rec?.banda_frecuencial || m.label
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<string>("")
    const inputRef = useRef<HTMLInputElement>(null)
    const startEdit = (e?: any) => {
        e?.stopPropagation?.()
        setDraft("")
        setEditing(true)
        // Enfoque diferido: dos rAF para que el teclado de iOS suba DESPUÉS
        // del montaje, sin colisionar con el reflow del viewport.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => inputRef.current?.focus())
        )
    }
    const commitEdit = () => {
        onRename?.(draft)
        setEditing(false)
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: "relative",
                borderRadius: 18,
                overflow: "hidden",
                // Holográfico lavanda — eco de los botones cyan de la Holoteca
                // (frame translúcido + glow + barrido + doble borde latente),
                // pero en la frecuencia morada del Decodificador de Sueños.
                border: `1px solid ${A(open ? 0.6 : 0.4)}`,
                background: `linear-gradient(135deg, ${A(0.14)}, ${hx(DREAM_DEEP, 0.05)} 55%, ${A(0.11)})`,
                boxShadow: open
                    ? `0 16px 40px rgba(0,0,0,0.5), 0 0 34px ${A(0.32)}, inset 0 0 32px ${A(0.1)}`
                    : `0 12px 30px rgba(0,0,0,0.45), 0 0 18px ${A(0.16)}, inset 0 0 26px ${A(0.07)}`,
                transition: "box-shadow 0.35s ease, border 0.35s ease",
            }}
        >
            {/* Capas ambientales pesadas (haz · borde latente · grano): se
                ocultan mientras se EDITA el título → el relayout por cada tecla
                es barato y el tecleo ya no se traba. */}
            {!editing && (
                <>
            {/* barrido holográfico — un haz de luz cruza la tarjeta */}
            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    top: "-35%",
                    height: "70%",
                    left: "-55%",
                    width: "55%",
                    background: `linear-gradient(115deg, transparent, ${A(0.4)}, transparent)`,
                    filter: "blur(9px)",
                    transform: "rotate(9deg)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
                animate={{ left: ["-55%", "140%"] }}
                transition={{
                    duration: 6.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (delay || 0) * 3,
                }}
            />
            {/* doble borde latente — respira en lavanda */}
            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: 14,
                    border: `1px solid ${A(0.28)}`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
                animate={{ opacity: [0.25, 0.65, 0.25] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* grano fino — densidad y tacto a la tarjeta */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    backgroundImage: DREAM_GRAIN,
                    backgroundSize: "120px 120px",
                    opacity: 0.1,
                    mixBlendMode: "soft-light",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
                </>
            )}
            {/* sheen — brillo sutil arriba para sensación de cristal sólido */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: "46%",
                    borderRadius: "inherit",
                    background: `linear-gradient(180deg, ${hx("#FFFFFF", 0.08)}, transparent)`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (
                        (e.key === "Enter" || e.key === " ") &&
                        e.target === e.currentTarget
                    ) {
                        e.preventDefault()
                        onToggle()
                    }
                }}
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "14px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                }}
            >
                {/* orbe holográfico — anillo lavanda girando + núcleo de la
                    banda (conserva la identidad de la frecuencia dentro del
                    chroma morado). */}
                <span
                    style={{
                        flexShrink: 0,
                        position: "relative",
                        width: 38,
                        height: 38,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg
                        width={38}
                        height={38}
                        viewBox="0 0 38 38"
                        style={{ position: "absolute", inset: 0 }}
                    >
                        <circle
                            cx="19"
                            cy="19"
                            r="17"
                            fill="none"
                            stroke={A(0.5)}
                            strokeWidth="1"
                            strokeDasharray="3 5"
                            style={{
                                transformOrigin: "19px 19px",
                                animation: "esc-ring1-rotate 14s linear infinite",
                            }}
                        />
                        <circle
                            cx="19"
                            cy="19"
                            r="12.5"
                            fill="none"
                            stroke={A(0.28)}
                            strokeWidth="0.8"
                        />
                    </svg>
                    <motion.span
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            width: 17,
                            height: 17,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${hx(m.color, 0.85)}, ${A(0.25)})`,
                            boxShadow: `0 0 14px ${A(0.7)}, 0 0 8px ${hx(m.color, 0.55)}`,
                            border: `1px solid ${A(0.6)}`,
                        }}
                    />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 9,
                            flexWrap: "wrap",
                        }}
                    >
                        {editing ? (
                            <span
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    maxWidth: "100%",
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            commitEdit()
                                        } else if (e.key === "Escape") {
                                            e.preventDefault()
                                            setEditing(false)
                                        }
                                    }}
                                    placeholder="Título"
                                    style={{
                                        width: `${Math.min(Math.max(draft.length, 9) + 1, 28)}ch`,
                                        maxWidth: "100%",
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        letterSpacing: "0.02em",
                                        color: "#FFFFFF",
                                        background: hx(DREAM, 0.1),
                                        border: `1px solid ${A(0.45)}`,
                                        borderRadius: 8,
                                        outline: "none",
                                        padding: "4px 8px",
                                    }}
                                />
                                <button
                                    type="button"
                                    aria-label="Guardar nombre"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        commitEdit()
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 24,
                                        height: 24,
                                        borderRadius: 7,
                                        border: `1px solid ${A(0.5)}`,
                                        background: hx(DREAM, 0.16),
                                        color: DREAM,
                                        cursor: "pointer",
                                        fontSize: 13,
                                        lineHeight: 1,
                                    }}
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    aria-label="Cancelar"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditing(false)
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 24,
                                        height: 24,
                                        borderRadius: 7,
                                        border: `1px solid ${hx(SILVER, 0.3)}`,
                                        background: "transparent",
                                        color: hx(SILVER, 0.6),
                                        cursor: "pointer",
                                        fontSize: 13,
                                        lineHeight: 1,
                                    }}
                                >
                                    ✕
                                </button>
                            </span>
                        ) : (
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        letterSpacing: "0.02em",
                                        color: "transparent",
                                        background: `linear-gradient(180deg, #FFFFFF, ${DREAM})`,
                                        WebkitBackgroundClip: "text",
                                        backgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        filter: `drop-shadow(0 0 12px ${A(0.4)})`,
                                    }}
                                >
                                    {title}
                                </span>
                                {onRename ? (
                                    <button
                                        type="button"
                                        aria-label="Renombrar sueño"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            startEdit()
                                        }}
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 22,
                                            height: 22,
                                            borderRadius: 7,
                                            border: "none",
                                            background: "transparent",
                                            color: A(0.7),
                                            cursor: "pointer",
                                            padding: 0,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                        </svg>
                                    </button>
                                ) : null}
                            </span>
                        )}
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <span
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    background: m.color,
                                    boxShadow: `0 0 6px ${m.color}`,
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 9.5,
                                    color: hx(SILVER, 0.5),
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {date}
                            </span>
                        </span>
                    </div>
                    {!open && (
                        <div
                            style={{
                                marginTop: 5,
                                fontSize: 12.5,
                                fontWeight: 300,
                                lineHeight: 1.5,
                                color: hx(SILVER, 0.62),
                                fontStyle: "italic",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {rec?.dream_text}
                        </div>
                    )}
                </div>
                <motion.span
                    animate={{ rotate: open ? 90 : 0 }}
                    style={{
                        flexShrink: 0,
                        color: A(0.85),
                        fontSize: 18,
                        fontWeight: 300,
                        lineHeight: 1,
                        filter: `drop-shadow(0 0 8px ${A(0.5)})`,
                    }}
                >
                    ›
                </motion.span>
            </div>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "0 16px 16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {/* El sueño tal cual se escribió */}
                            <div
                                style={{
                                    padding: "13px 15px",
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.03)",
                                    border: `1px solid ${hx(DREAM, 0.16)}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: hx(SILVER, 0.4),
                                        marginBottom: 7,
                                    }}
                                >
                                    El sueño
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 13.5,
                                        fontWeight: 300,
                                        lineHeight: 1.65,
                                        color: hx(SILVER, 0.82),
                                        fontStyle: "italic",
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {rec?.dream_text}
                                </p>
                            </div>
                            {/* Dictamen Vibral */}
                            <div
                                style={{
                                    padding: "14px 15px",
                                    borderRadius: 12,
                                    background:
                                        "linear-gradient(165deg, rgba(10,16,34,0.6), rgba(5,9,22,0.72))",
                                    border: `1px solid ${hx(DREAM, 0.2)}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: hx(DREAM, 0.6),
                                        marginBottom: 8,
                                    }}
                                >
                                    ◈ Dictamen Vibral
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 13.5,
                                        fontWeight: 300,
                                        lineHeight: 1.7,
                                        color: "#E9EEFB",
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {rec?.dictamen_vibral}
                                </p>
                            </div>
                            {/* Calibración Quirúrgica (lectura) */}
                            {rec?.calibracion_quirurgica && (
                                <div
                                    style={{
                                        padding: "13px 15px",
                                        borderRadius: 12,
                                        background:
                                            "linear-gradient(135deg, rgba(20,16,6,0.6), rgba(8,8,14,0.72))",
                                        border: `1px solid ${hx(GOLD, 0.3)}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 7,
                                            marginBottom: 7,
                                        }}
                                    >
                                        <span
                                            style={{ color: GOLD, fontSize: 12 }}
                                        >
                                            ⌖
                                        </span>
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.18em",
                                                textTransform: "uppercase",
                                                color: GOLD,
                                            }}
                                        >
                                            Calibración Quirúrgica
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            fontSize: 12.5,
                                            fontWeight: 400,
                                            lineHeight: 1.6,
                                            color: "#F5E9CC",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {rec.calibracion_quirurgica}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* La Bóveda: trae los registros del Tripulante y los pinta como una
   constelación de tarjetas expandibles. */
function DreamVault({
    isMobile,
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    onBack,
}: {
    isMobile: boolean
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    isAuthed?: boolean
    onUnauthedAttempt?: () => void
    onBack?: () => void
}) {
    const [records, setRecords] = useState<any[] | null>(null)
    const [openId, setOpenId] = useState<string | null>(null)

    useEffect(() => {
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        if (!uid || !supabaseUrl || !supabaseAnonKey) {
            setRecords([])
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                // Gateway user-action: la galería se lee con el id verificado
                // del token, NO con un target_clerk_id forjable. Cierre del IDOR
                // crítico que exponía el texto íntegro de los sueños ajenos.
                const data = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_dream_records",
                    { p_limit: 200 }
                )
                if (!cancelled) setRecords(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setRecords([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    const count = records?.length || 0

    /* Borra un sueño de la Bóveda. Optimista: lo quita de la lista al instante
       y dispara el borrado por el gateway (id verificado del token → solo
       borra el sueño propio). Si fallara, reaparece en la próxima carga. */
    const handleDeleteRecord = async (rec: any) => {
        const id = rec?.id
        if (!id) return
        setRecords((prev) => (prev || []).filter((r: any) => r?.id !== id))
        if (openId === id) setOpenId(null)
        try {
            await userAction(
                supabaseUrl,
                supabaseAnonKey,
                "delete_my_dream_record",
                { p_record_id: id }
            )
        } catch {}
    }

    /* Renombra un sueño de la Bóveda. Optimista: actualiza el título en la
       lista al instante y persiste por el gateway (id verificado del token →
       solo renombra el sueño propio). */
    const handleRenameRecord = async (rec: any, newTitle: string) => {
        const id = rec?.id
        if (!id) return
        const title = (newTitle || "").trim()
        setRecords((prev) =>
            (prev || []).map((r: any) =>
                r?.id === id ? { ...r, custom_title: title } : r
            )
        )
        try {
            await userAction(
                supabaseUrl,
                supabaseAnonKey,
                "rename_my_dream_record",
                { p_record_id: id, p_new_title: title }
            )
        } catch {}
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "relative",
                width: "100%",
                maxWidth: 600,
                margin: "0 auto",
                paddingTop: isMobile
                    ? "calc(env(safe-area-inset-top, 0px) + 44px)"
                    : 0,
                minHeight:
                    isMobile && (records === null || count === 0)
                        ? "calc(100dvh - 150px)"
                        : undefined,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <VaultStars />
            {/* Header: regreso al decodificador + título */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: isMobile ? 18 : 24,
                }}
            >
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Volver al Decodificador de Sueños"
                    style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: `1px solid ${hx(DREAM, 0.35)}`,
                        background: hx(DREAM, 0.08),
                        color: SILVER,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 300,
                        lineHeight: 1,
                    }}
                >
                    ‹
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: isMobile ? 16 : 21,
                            fontWeight: 300,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "transparent",
                            background: `linear-gradient(180deg, ${DREAM}, #fff)`,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            lineHeight: 1.2,
                        }}
                    >
                        Bóveda de Sueños
                    </div>
                    <div
                        style={{
                            marginTop: 3,
                            fontSize: 11.5,
                            fontWeight: 300,
                            letterSpacing: "0.03em",
                            color: hx(SILVER, 0.5),
                        }}
                    >
                        {count === 0
                            ? "Tu archivo de sueños decodificados"
                            : `${count} sueño${count === 1 ? "" : "s"} anclado${count === 1 ? "" : "s"} en tu constelación`}
                    </div>
                </div>
            </div>

            {/* Cargando */}
            {records === null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 18,
                        minHeight: 280,
                    }}
                >
                    <VaultOpeningAnim size={128} caption="Abriendo la bóveda…" />
                </motion.div>
            )}

            {/* Vacía */}
            {records !== null && count === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: 18,
                        minHeight: 320,
                        padding: "0 20px",
                    }}
                >
                    <SuenosSigil size={108} />
                    <div
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 16,
                            fontWeight: 300,
                            letterSpacing: "0.04em",
                            color: "#EAF0FF",
                        }}
                    >
                        Tu bóveda está en silencio
                    </div>
                    <p
                        style={{
                            margin: 0,
                            maxWidth: 340,
                            fontSize: 13,
                            fontWeight: 300,
                            lineHeight: 1.65,
                            color: hx(SILVER, 0.6),
                        }}
                    >
                        Cada sueño que decodifiques quedará anclado aquí como una
                        estrella, con su dictamen y su calibración.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            marginTop: 4,
                            padding: "12px 26px",
                            borderRadius: 999,
                            border: `1px solid ${hx(DREAM, 0.5)}`,
                            background: `linear-gradient(135deg, ${hx(DREAM, 0.18)}, rgba(6,12,26,0.6))`,
                            color: SILVER,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12.5,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                        }}
                    >
                        Decodificar un sueño
                    </button>
                </motion.div>
            )}

            {/* Lista de registros */}
            {records !== null && count > 0 && (
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        paddingBottom: isMobile
                            ? "calc(env(safe-area-inset-bottom, 0px) + 70px)"
                            : 40,
                    }}
                >
                    {records.map((rec, i) => {
                        const rid = rec?.id || String(i)
                        return (
                            <SwipeToDelete
                                key={rid}
                                disabled={openId === rid}
                                onDelete={() => handleDeleteRecord(rec)}
                            >
                                <DreamRecordCard
                                    rec={rec}
                                    open={openId === rid}
                                    onToggle={() =>
                                        setOpenId((prev) =>
                                            prev === rid ? null : rid
                                        )
                                    }
                                    onRename={(t: string) =>
                                        handleRenameRecord(rec, t)
                                    }
                                    delay={Math.min(i * 0.05, 0.4)}
                                />
                            </SwipeToDelete>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   MÓDULO — hub + ruteo a Materia / Sueños. Default export.
   Reemplaza el render directo de DecodificadorView en el shell.
   ════════════════════════════════════════════════════════════════ */
function DecoderModule(props: any) {
    const [sub, setSub] = useState<"hub" | "materia" | "suenos">("hub")
    const {
        accent = CYAN,
        isMobile = false,
        hasDreamAccess = false,
        onDreamPaywall,
        onDreamSoftInvite,
        hideForOverlay = false,
        // resto de props del Decodificador de Materia (passthrough,
        // incluye isActiveMember — DecodificadorView lo ignora)
        ...matter
    } = props

    /* Re-tap del tab DECODIFICADOR (o reset explícito) → vuelve al hub,
       igual que las otras pestañas regresan a su raíz. iOS dispara
       `rsv-tab-tapped {tab}`; la web (AppNavegacionMobile) dispara
       `rsv-decoder-reset`. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const toHub = (e?: Event) => {
            const tab = (e as CustomEvent)?.detail?.tab
            if (!tab || tab === "decodificador") setSub("hub")
        }
        window.addEventListener("rsv-tab-tapped", toHub)
        window.addEventListener("rsv-decoder-reset", toHub)
        return () => {
            window.removeEventListener("rsv-tab-tapped", toHub)
            window.removeEventListener("rsv-decoder-reset", toHub)
        }
    }, [])

    return (
        <div style={{ width: "100%" }}>
            {/* v1.12 — Los tres sub-views (hub · materia · sueños) ahora viven
                en UNA sola AnimatePresence mode="wait": al elegir un
                decodificador, el hub termina su salida ANTES de montar la capa
                elegida. Antes el hub (motion con exit + minHeight de pantalla
                completa) y la capa elegida coexistían unos milisegundos →
                la capa quedaba empujada hacia abajo (su título aparecía hasta
                el fondo) y el selector flotante "Lente Óptico / Texto" se
                colaba suelto sobre el hub saliente. */}
            <AnimatePresence mode="wait">
                {sub === "hub" && (
                    <DecoderHub
                        key="hub"
                        isMobile={isMobile}
                        onPick={setSub}
                    />
                )}
                {sub === "materia" && (
                    <div key="materia" style={{ width: "100%" }}>
                        <DecodificadorView
                            accent={accent}
                            isMobile={isMobile}
                            hideForOverlay={hideForOverlay}
                            onBack={() => setSub("hub")}
                            {...matter}
                        />
                    </div>
                )}
                {sub === "suenos" && (
                    <div key="suenos" style={{ width: "100%" }}>
                        <DreamDecoderView
                            isMobile={isMobile}
                            supabaseUrl={matter.supabaseUrl}
                            supabaseAnonKey={matter.supabaseAnonKey}
                            clerkUserId={matter.clerkUserId}
                            hasDreamAccess={hasDreamAccess}
                            isAuthed={matter.isAuthed}
                            onUnauthedAttempt={matter.onUnauthedAttempt}
                            onDreamPaywall={onDreamPaywall}
                            onSoftInvite={onDreamSoftInvite}
                            onBack={() => setSub("hub")}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
DecoderModule.displayName = "DecoderModule"

export default DecoderModule
