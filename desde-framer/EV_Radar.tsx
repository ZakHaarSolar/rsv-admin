// EV_Radar.tsx v2.30 — (re-publicado a Framer: el fix v2.29 no había subido por el watcher trabado) · anti-flash REFORZADO: la señal global del Índice de Luz solo se publica con valor real (jamás se borra con el null transitorio de la hidratación → el campo no deja de respirar) + latch pegajoso hadPriorIndex (true en cuanto hay score, nunca vuelve a "usuario nuevo") + el hint "Toca un nodo" exige scanResolved (fetch de scan history resuelto) además de loaded → sin parpadeo con red lenta | #4 anillos exteriores VIVOS (aro de trazos 80s + ticks contra-rota 150s) | Tomo Desbloqueado separado del número | #5/#2/#1/#3 efectos vivos
// del nodo (dorado si escaneado, cyan si no) → el stream refleja el progreso real del ciclo.
// + un pulso de luz recorre el marco hexagonal sin parar (esc-frame-sweep) + un paquete de
// luz viaja de cada vértice al núcleo escalonado (SMIL animateMotion, estela con gradiente
// ev-pkt-tail) → el instrumento se siente vivo, leyendo el campo. Sin costo de JS por frame.
// v2.19 — Ritual por-pilar VIVO (paridad app v2.16): los 3 momentos
// reemplazados — HoldToTransmit (campo de fuerza + LOCK + burst, onComplete diferido
// ~540ms), ProcessingAnim (escáner de telemetría viva, núcleo de blur REDONDO vía
// región medBlur amplia), FrecuenciaAnclada (cristalización del número CENTRADO en su
// anillo vía faGlow, sin la línea cyan, count-up con useMotionValue). El TOMO sigue
// visible ~3.7s. Nuevo prop suppressIndice (oculta el badge del índice durante la
// ceremonia 6/6) + anti-flash showEmptyHint del hint "Toca un nodo".
// v2.18 — "TOMO DE CALIBRACIÓN DESBLOQUEADO" queda visible ~3.7s
// (paridad con la app). v2.17 — Sonda: textura de grano + sheen en las tarjetas; los
// botones Anterior/Siguiente ya no quedan atascados bajo el dock (más espacio
// de scroll). v2.14 — Cuestionario (Sonda) premium: barra de progreso con
// glow, tarjetas de respuesta con nodo de letra (A–E) que se llena al elegir,
// lead en negrita + entrada escalonada. Mismo número de preguntas.
// v2.13 — Pill "Próximo Escaneo" baja 38 px más (mobile -92,
// desktop -104) para darle aire entre el vértice ÓRBITA del
// hexágono y el contador. Antes quedaba muy pegada y se sentía
// apretada visualmente. Aplicado en gemelo a escaner-app/EV_Radar.
// v2.12.1 — Texto post-pilar consolidado a una sola línea
// "TOMO DE CALIBRACIÓN DESBLOQUEADO: <romano>" en dorado con glow
// (decisión Zak 2026-05-10). Reemplaza el bloque viejo de tres
// líneas (subtítulo cyan "Tu próximo tomo de Calibración" +
// romano grande aparte + "Fase X de 10"). Mismo cambio aplicado
// al escaner-app/EV_Radar.tsx para consistencia entre versiones.
// v2.12.1 — bump cosmético para re-disparar sync tras timeout 15s
// del watcher contra Framer API.
// v2.11 — FrecuenciaAnclada (la pantalla post-pilar con el % grande)
// suma un bloque nuevo entre el % y "Telemetría registrada": el tomo
// de Calibración en el que aterriza este pilar. Se muestra el romano
// grande en dorado (Sexta Densidad) + "Fase N de 10" + "Tu próximo
// tomo de Calibración". Aparece después de que el contador del %
// termina su barrido (cuando el Tripulante ya internalizó el número),
// para sumar dopamina secuencial sin competir.
// Fórmula: fase = clamp(1, 10, floor(score/10) + 1). Romanos en
// tabla local (1-10). El display total dura 3.2 s antes del callback
// onComplete (antes 4.4 s) para dar aire al bloque nuevo.
// v2.10 — Sonda mobile respeta env(safe-area-inset-top): el botón
// "Volver" portaleado pasa de top:14 a calc(14px + env(...)) y el
// wrapper del formulario suma env(safe-area-inset-top) al padding-top
// (12 → calc(12 + env)). Sin esto, con viewport-fit=cover en PWA
// standalone el ← y el ícono Sonda quedaban bajo el reloj iOS.
// v2.9.1 — Re-trigger por waitForComponentLoader timeout del watcher.
// v2.9 — Badge "Próximo Escaneo" pasa de top:-78/-86 (arriba del
// hexágono) a bottom:-54/-62 (abajo del hexágono). Pedido de Zak:
// el Radar es el primer elemento visual del Escáner y debe respirar
// solo en su mitad superior; el countdown del cooldown queda como
// info contextual debajo, no como pre-titular arriba.
// v2.8.2 — Re-trigger del watcher tras dos fallos
// "waitForComponentLoader timeout" en v2.8 / v2.8.1.
// EV_Radar.tsx v2.8
// v2.8 — Tres cambios:
// (1) CooldownView (timer del pilar bloqueado al picarlo durante
//     cooldown global) cambia de min:seg a días/horas/minutos. El
//     COOLDOWN es 7 días — ver segundos no aporta info útil.
// (2) Radar acepta nueva prop `isActiveMember`. El badge dorado
//     "Próximo Escaneo" arriba del hexágono ahora sólo se muestra
//     a tripulantes con Sintonía Solar activa. A invitados/no-
//     suscriptores se les oculta para no crear falsa expectativa
//     (ellos ven el gate sintonia al picar un pilar bloqueado).
// EV_Radar.tsx v2.7
// v2.7 — Fix de waitForComponentLoader timeout: EVRadar default
// function ahora retorna <div display:none/> en vez de null.
// CLAUDE.md regla de oro — Code Files con función null pueden
// fallar el componentLoader de Framer aunque tengan utilities
// adjuntos. v2.6 sumó cambios CSS al badge de cooldown que parecen
// haber tocado el threshold de detección.
// EV_Radar.tsx v2.6
// v2.6 — Badge de cooldown bajado: top -78 mobile / -86 desktop
// (antes -110 / -118). Diego pidió aire entre el chrome de arriba
// (menú superior en estación de mando, borde del viewport en
// mobile) y la pill — quedaba muy pegada.
// EV_Radar.tsx v2.5
// v2.5 — Badge de cooldown reformulado a UNA SOLA LÍNEA (label +
// valor en row, no column). Mobile y desktop comparten el mismo
// layout horizontal; sólo cambia el padding y fontSize. También
// subimos más alto (top -110 mobile / -118 desktop) para no rozar
// las etiquetas del hexágono (HARDWARE/PROCESADOR/etc).
// EV_Radar.tsx v2.4
// v2.4 — Badge de cooldown ahora flota como overlay absoluto encima
// del hexágono (top:-72 mobile / -88 desktop, centrado horizontal)
// en lugar de empujar el SVG hacia abajo con flexDirection:column.
// Diego pidió que el Radar conserve su posición original y el timer
// se vea "más arriba" — ambas cosas se cumplen con position:absolute.
// EV_Radar.tsx v2.3
// v2.3 — Badge de "Próximo Escaneo" arriba del hexágono cuando el
// ciclo está en cooldown (cycle_scanned size 6 + < 7 días desde
// el cierre). Formato: "Xd Yh" mientras falte ≥ 1h, "Mm" cuando
// quedan < 60 minutos. Lenguaje visual oro: gradient gold + border
// brillante + glow + pill rounded. Aprovecha el setInterval de "now"
// existente para refrescar el contador cada segundo.
// EV_Radar.tsx v2.2
// v2.2 — Sonda con guard de invitado: nuevos props isAuthed +
// onUnauthedAttempt. Si invitado intenta escribir su primera geometría
// (toque a una respuesta), ningún estado muta y se invoca
// onUnauthedAttempt para que el shell levante el bottom sheet de
// identificación de nodo. Sin estos props el Sonda mantiene
// comportamiento standalone (isAuthed default=true).
// Núcleo del Radar Hexagonal del Escáner Vibracional. Reúne PILLARS
// (config + sondas hardcoded de los 4 pilares activos), Radar (SVG
// hexagonal con anillos orbitales, ignition wave y resonance pulse),
// CooldownView (timer post-ciclo), Sonda (formulario de telemetría con
// HoldToTransmit + FrecuenciaAnclada), ProcessingAnim, y la ceremonia
// Nodo Cero. Default export: función-componente (devuelve null) con
// todo lo que el Shell y los demás Code Files necesitan adjunto como
// propiedades — Framer requiere componente React, no objeto plano.
import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
} from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    animate,
} from "framer-motion"
import { createPortal } from "react-dom"
import Shared, { PillarCfg, PillarId, Scores, Timestamps } from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
const {
    hx,
    GOLD,
    COOLDOWN_SEC,
    PROC_MSGS,
    sbRpc,
    fireTouchRipple,
    setLightIndex,
    getLightIndex,
    breathParams,
    fireMaterialize,
    fireFieldWave,
    fireFieldTension,
} = Shared
const { IBack, IHw, IMn, IEm, IFi, IVec, IOrb } = Icons

/* Haptic seguro — no-op silencioso en iOS WKWebView (navigator.vibrate no
   existe). Usado en los hitos del ritual por-pilar (hold / medición /
   revelación). try/catch porque algunos navegadores lanzan en contexto
   no-seguro. */
const haptic = (ms: number | number[]) => {
    try {
        if (typeof navigator !== "undefined" && (navigator as any).vibrate)
            (navigator as any).vibrate(ms)
    } catch {}
}
/* prefers-reduced-motion leído una vez (no listener) — para las ramas
   cortas/elegantes del ritual. */
const prefersReduced = () => {
    try {
        return (
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    } catch {
        return false
    }
}

/* Lectura HUD del escáner (ProcessingAnim). Módulo-level para NO remontar
   en cada render del padre (si fuera anidada, cada setMi crearía un span
   nuevo y el texto parpadearía a "—"). El valor lo escribe un
   MotionValue.on('change') sobre refEl.textContent (cero re-render). */
function ProcReadout({
    label,
    refEl,
    x,
    accent,
    locked = false,
}: {
    label: string
    refEl: React.RefObject<HTMLSpanElement | null>
    x: string
    accent: string
    locked?: boolean
}) {
    return (
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: x,
                transform: "translate(-50%, 56px)",
                textAlign: "center",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    fontSize: 7.5,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    /* Al LOCK la etiqueta vira a dorado (eco de los ticks). */
                    color: locked ? hx(GOLD, 0.85) : hx(accent, 0.4),
                    transition: "color 0.3s ease",
                    fontFamily: "'Inter',sans-serif",
                    textTransform: "uppercase",
                    marginBottom: 2,
                }}
            >
                {label}
            </div>
            <span
                ref={refEl}
                style={{
                    fontSize: 11,
                    fontWeight: locked ? 500 : 400,
                    color: locked ? "#FFFFFF" : hx(accent, 0.85),
                    fontFamily: "'JetBrains Mono',monospace",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: locked
                        ? `0 0 12px ${hx(accent, 0.7)}`
                        : `0 0 8px ${hx(accent, 0.4)}`,
                    transition:
                        "color 0.3s ease, text-shadow 0.3s ease, font-weight 0.3s ease",
                }}
            >
                —
            </span>
        </div>
    )
}

/* ═══ ProcessingAnim — escáner de telemetría viva (ritual por-pilar) ═══ */
function ProcessingAnim({
    accent,
    onComplete,
}: {
    accent: string
    onComplete: () => void
}) {
    /* LA MEDICIÓN — escáner de telemetría viva. Un instrumento de 2026
       leyendo tu campo: barrido + lecturas efímeras + anillo de calibración
       que GIRA buscando y se TRABA (el LOCK, motivo del ritual) + reticle +
       pulso que pasa de errático a regular → handoff de un punto de luz al
       reveal. Firma intacta {accent,onComplete} (NO isMobile → autoescala
       por viewBox). Total 3500ms (techo intacto). */
    const reduced = useMemo(prefersReduced, [])
    const [mi, setMi] = useState(0)
    const onCompleteRef = useRef(onComplete)
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])
    const ranRef = useRef(false)
    const lockedRef = useRef(false)
    const [locked, setLocked] = useState(false)
    const controlsRef = useRef<any[]>([])
    const freqRef = useRef<HTMLSpanElement>(null)
    const entrRef = useRef<HTMLSpanElement>(null)
    const condRef = useRef<HTMLSpanElement>(null)
    const freqMV = useMotionValue(412)
    const entrMV = useMotionValue(6.4)
    const condMV = useMotionValue(58)
    const jitterMV = useMotionValue(0)
    const progMV = useMotionValue(0)

    /* Lecturas ambientales (NUNCA derivadas del score real → no spoilea el
       reveal). Keyframes que titilan y convergen, sembrados levísimo por
       montaje para que cada medición se sienta distinta. */
    const reads = useMemo(() => {
        const s = Math.random()
        const wob = (base: number, amp: number) => {
            const ks: number[] = []
            for (let i = 0; i < 9; i++) {
                const settle = i / 8
                const n = Math.sin(i * 11.3 + s * 47) * Math.cos(i * 3.1 + s)
                ks.push(base + amp * (1 - settle) * n)
            }
            ks.push(base)
            return ks
        }
        return {
            freq: wob(428, 70),
            entr: wob(4.4, 5.5),
            cond: wob(74, 34),
        }
    }, [])

    useEffect(() => {
        if (ranRef.current) return
        ranRef.current = true
        const C = controlsRef.current
        const timers: number[] = []
        const unsubs: (() => void)[] = []

        /* Mensajes rotando (cross-fade, AnimatePresence). */
        const mInt = setInterval(
            () => setMi((p) => Math.min(p + 1, PROC_MSGS.length - 1)),
            3500 / PROC_MSGS.length
        )
        /* Barra de progreso → scaleX (no width). */
        C.push(animate(progMV, 1, { duration: 3.5, ease: "linear" }))
        /* onComplete al cierre — timing 3500ms intacto. */
        const done = window.setTimeout(() => onCompleteRef.current(), 3500)

        if (reduced) {
            /* Rama corta: 1 lectura que se estabiliza, sin scan/glitch/lock. */
            C.push(animate(freqMV, 440, { duration: 1.2, ease: "easeOut" }))
            unsubs.push(
                freqMV.on("change", (v) => {
                    if (freqRef.current)
                        freqRef.current.textContent = Math.round(v) + " Hz"
                })
            )
            return () => {
                clearInterval(mInt)
                clearTimeout(done)
                C.forEach((c) => c?.stop?.())
                unsubs.forEach((u) => u())
            }
        }

        haptic(8)
        /* Lecturas: titilan caóticas y convergen (~2.05s). */
        C.push(
            animate(freqMV, reads.freq, { duration: 2.05, ease: "easeOut" })
        )
        C.push(
            animate(entrMV, reads.entr, { duration: 2.05, ease: "easeOut" })
        )
        C.push(
            animate(condMV, reads.cond, { duration: 2.05, ease: "easeOut" })
        )
        unsubs.push(
            freqMV.on("change", (v) => {
                if (freqRef.current)
                    freqRef.current.textContent = Math.round(v) + " Hz"
            })
        )
        unsubs.push(
            entrMV.on("change", (v) => {
                if (entrRef.current) entrRef.current.textContent = v.toFixed(1)
            })
        )
        unsubs.push(
            condMV.on("change", (v) => {
                if (condRef.current)
                    condRef.current.textContent = Math.round(v) + "%"
            })
        )
        /* Glitch de señal: jitter que se aplica al transform del HUD y cesa. */
        C.push(
            animate(jitterMV, [0, 2, -3, 1, -2, 0.5, 0], {
                duration: 2.05,
                ease: "linear",
            })
        )
        /* Hitos hápticos: señal adquirida → LOCK → estabilizada. El LOCK se
           alinea a cuando el anillo ATERRIZA (rotación dur 2.05s con el
           segmento backOut al final), no antes — ticks + reticle + háptico
           caen en el mismo instante que el anillo frena en seco. */
        timers.push(window.setTimeout(() => haptic(8), 250))
        timers.push(
            window.setTimeout(() => {
                lockedRef.current = true
                setLocked(true)
                haptic([6, 40, 14])
            }, 2000)
        )
        timers.push(window.setTimeout(() => haptic(10), 3200))

        return () => {
            clearInterval(mInt)
            clearTimeout(done)
            timers.forEach((t) => clearTimeout(t))
            C.forEach((c) => c?.stop?.())
            unsubs.forEach((u) => u())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const VB = 240
    const CC = VB / 2
    const R = 84
    const dash = 2 * Math.PI * R
    /* Arco de progreso derivado del progreso (decorativo, no es el score). */
    const arcOffset = useTransform(progMV, (p) => dash * (1 - p))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 40,
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
                paddingTop: 60,
            }}
        >
            {/* Light-leaks de fondo (paleta compartida) */}
            {!reduced && (
                <>
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.12, 0.08] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            top: "18%",
                            left: "16%",
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${hx(GOLD, 0.5)} 0%, transparent 65%)`,
                            mixBlendMode: "lighten",
                            pointerEvents: "none",
                            filter: "blur(20px)",
                        }}
                    />
                    <motion.div
                        animate={{ scale: [1.06, 1, 1.06], opacity: [0.07, 0.11, 0.07] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            bottom: "22%",
                            right: "16%",
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${hx(accent, 0.5)} 0%, transparent 65%)`,
                            mixBlendMode: "lighten",
                            pointerEvents: "none",
                            filter: "blur(20px)",
                        }}
                    />
                </>
            )}

            {/* Instrumento — UN solo svg autoescalable */}
            <div
                style={{
                    position: "relative",
                    width: "clamp(200px, 62vw, 268px)",
                    aspectRatio: "1 / 1",
                }}
            >
                <motion.svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${VB} ${VB}`}
                    style={{ x: reduced ? 0 : jitterMV, overflow: "visible" }}
                >
                    <defs>
                        {/* Región amplia: sin x/y/width/height el blur del
                            núcleo central (círculo chico) se recortaba en
                            CUADRADO (la región default -10%/120% queda más
                            chica que el desenfoque). Con la región amplia el
                            glow se desvanece redondo. */}
                        <filter
                            id="medBlur"
                            x="-75%"
                            y="-75%"
                            width="250%"
                            height="250%"
                        >
                            <feGaussianBlur stdDeviation="2.5" />
                        </filter>
                    </defs>

                    {/* Grid tenue (pathLength) */}
                    {!reduced &&
                        [0.28, 0.5, 0.72].map((f, i) => (
                            <g key={`g${i}`}>
                                <motion.line
                                    x1={VB * f}
                                    y1={20}
                                    x2={VB * f}
                                    y2={VB - 20}
                                    stroke={hx(accent, 0.08)}
                                    strokeWidth="0.6"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                />
                                <motion.line
                                    x1={20}
                                    y1={VB * f}
                                    x2={VB - 20}
                                    y2={VB * f}
                                    stroke={hx(accent, 0.08)}
                                    strokeWidth="0.6"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                />
                            </g>
                        ))}

                    {/* Corner brackets viewfinder */}
                    {[
                        [28, 28, 1, 1],
                        [VB - 28, 28, -1, 1],
                        [28, VB - 28, 1, -1],
                        [VB - 28, VB - 28, -1, -1],
                    ].map(([bx, by, sx, sy], i) => (
                        <motion.path
                            key={`c${i}`}
                            d={`M${bx},${by + 14 * sy} L${bx},${by} L${bx + 14 * sx},${by}`}
                            fill="none"
                            stroke={hx(accent, 0.45)}
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                        />
                    ))}

                    {/* Anillo de calibración exterior — gira buscando y hace LOCK */}
                    <motion.g
                        style={{
                            transformBox: "fill-box",
                            transformOrigin: "center",
                            willChange: "transform",
                        }}
                        initial={{ rotate: 0 }}
                        animate={
                            reduced
                                ? { rotate: 0 }
                                : { rotate: [0, 140, 420, 512] }
                        }
                        transition={
                            reduced
                                ? { duration: 0 }
                                : {
                                      duration: 2.05,
                                      times: [0, 0.3, 0.78, 1],
                                      ease: [
                                          "easeIn",
                                          "easeIn",
                                          [0.34, 1.56, 0.64, 1],
                                      ],
                                  }
                        }
                    >
                        <circle
                            cx={CC}
                            cy={CC}
                            r={R}
                            fill="none"
                            stroke={hx(accent, 0.28)}
                            strokeWidth="1"
                            strokeDasharray="40 18 8 18"
                        />
                    </motion.g>
                    {/* Anillo base + arco de progreso */}
                    <circle
                        cx={CC}
                        cy={CC}
                        r={R}
                        fill="none"
                        stroke={hx(accent, 0.12)}
                        strokeWidth="1"
                    />
                    {!reduced && (
                        <g transform={`rotate(-90 ${CC} ${CC})`}>
                            <motion.circle
                                cx={CC}
                                cy={CC}
                                r={R}
                                fill="none"
                                stroke={hx(accent, 0.7)}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray={dash}
                                style={{ strokeDashoffset: arcOffset }}
                                filter="url(#medBlur)"
                            />
                        </g>
                    )}

                    {/* 12 tick-marks radiales — encienden en barrido al LOCK */}
                    {!reduced &&
                        Array.from({ length: 12 }).map((_, i) => {
                            const a = (i / 12) * Math.PI * 2 - Math.PI / 2
                            const r1 = R + 6
                            const r2 = R + 12
                            return (
                                <motion.line
                                    key={`tk${i}`}
                                    x1={CC + r1 * Math.cos(a)}
                                    y1={CC + r1 * Math.sin(a)}
                                    x2={CC + r2 * Math.cos(a)}
                                    y2={CC + r2 * Math.sin(a)}
                                    stroke={GOLD}
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    initial={{ opacity: 0.12 }}
                                    animate={{ opacity: locked ? 1 : 0.12 }}
                                    transition={{ duration: 0.25, delay: locked ? i * 0.018 : 0 }}
                                />
                            )
                        })}

                    {/* Scan-lines (barrido). Animan transform x/y (framer las
                        mapea a translate, GPU) y se DESMONTAN al LOCK → el
                        barrido cesa cuando la lectura "engancha". */}
                    {!reduced && !locked && (
                        <>
                            <motion.line
                                x1={CC}
                                y1={28}
                                x2={CC}
                                y2={VB - 28}
                                stroke={hx(accent, 0.55)}
                                strokeWidth="1.4"
                                filter="url(#medBlur)"
                                initial={{ x: -70, opacity: 0 }}
                                animate={{ x: [-70, 70, -70], opacity: [0, 0.7, 0] }}
                                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.line
                                x1={28}
                                y1={CC}
                                x2={VB - 28}
                                y2={CC}
                                stroke={hx(GOLD, 0.4)}
                                strokeWidth="1.2"
                                filter="url(#medBlur)"
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: [60, -60, 60], opacity: [0, 0.55, 0] }}
                                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                            />
                        </>
                    )}

                    {/* Reticle que converge al LOCK */}
                    {!reduced && (
                        <motion.g
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                            initial={{ scale: 1.8, opacity: 0 }}
                            animate={{ scale: locked ? 1 : 1.8, opacity: locked ? 0.9 : 0 }}
                            transition={{ type: "spring", stiffness: 220, damping: 16 }}
                        >
                            <circle cx={CC} cy={CC} r={10} fill="none" stroke={GOLD} strokeWidth="1.2" />
                            <line x1={CC - 16} y1={CC} x2={CC - 6} y2={CC} stroke={GOLD} strokeWidth="1.2" />
                            <line x1={CC + 6} y1={CC} x2={CC + 16} y2={CC} stroke={GOLD} strokeWidth="1.2" />
                            <line x1={CC} y1={CC - 16} x2={CC} y2={CC - 6} stroke={GOLD} strokeWidth="1.2" />
                            <line x1={CC} y1={CC + 6} x2={CC} y2={CC + 16} stroke={GOLD} strokeWidth="1.2" />
                        </motion.g>
                    )}

                    {/* Núcleo / pulso central — late, recoge el punto de luz */}
                    <motion.circle
                        cx={CC}
                        cy={CC}
                        r={5}
                        fill={accent}
                        filter="url(#medBlur)"
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        animate={{
                            scale: reduced ? [1, 1.15, 1] : [1, 1.25, 1, 1.25, 1],
                            opacity: [0.7, 1, 0.7],
                        }}
                        transition={{ duration: reduced ? 1.6 : 0.95, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Confirm-ring de handoff — se contrae al núcleo al cierre */}
                    {!reduced && locked && (
                        <motion.circle
                            cx={CC}
                            cy={CC}
                            r={R}
                            fill="none"
                            stroke={hx(accent, 0.8)}
                            strokeWidth="2"
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{ scale: [1, 0.1], opacity: [0, 0.8, 0] }}
                            transition={{ duration: 0.5, delay: 1.0, ease: "easeIn" }}
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                    )}
                </motion.svg>

                {/* Lecturas HUD (textContent vía MotionValue, tabular-nums) */}
                {reduced ? (
                    <ProcReadout
                        label="Frecuencia"
                        refEl={freqRef}
                        x="50%"
                        accent={accent}
                    />
                ) : (
                    <>
                        <ProcReadout label="Frec" refEl={freqRef} x="22%" accent={accent} locked={locked} />
                        <ProcReadout label="Entropía" refEl={entrRef} x="50%" accent={accent} locked={locked} />
                        <ProcReadout label="Cond" refEl={condRef} x="78%" accent={accent} locked={locked} />
                    </>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={mi}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 13,
                        fontWeight: 300,
                        letterSpacing: "0.1em",
                        color: hx(accent, 0.7),
                        textTransform: "uppercase",
                        margin: 0,
                        textAlign: "center",
                        padding: "0 24px",
                    }}
                >
                    {PROC_MSGS[mi]}
                </motion.p>
            </AnimatePresence>
            <div
                style={{
                    width: 240,
                    maxWidth: "70%",
                    height: 2,
                    borderRadius: 1,
                    background: "rgba(255,255,255,0.04)",
                    overflow: "hidden",
                }}
            >
                <motion.div
                    style={{
                        height: "100%",
                        width: "100%",
                        borderRadius: 1,
                        transformOrigin: "left",
                        scaleX: progMV,
                        background: `linear-gradient(90deg,${hx(accent, 0.3)},${accent})`,
                    }}
                />
            </div>
        </motion.div>
    )
}

/* ═══ HoldToTransmit — EL SELLO: cargar un campo de fuerza (ritual por-pilar) ═══
   El dedo que se mantiene CARGA energía: aura que se reúne + relleno (scaleX,
   no width) + telemetría efímera + scan-line. Al completar: LOCK háptico +
   BURST de sellado (shockwave + 12 chispas radiales + flash) y el campo se
   contrae a un punto de luz que alimenta la Medición (onComplete diferido
   ~450ms para que el burst se vea antes de desmontar). Firma intacta. */
function HoldToTransmit({
    accent,
    isMobile,
    onComplete,
}: {
    accent: string
    isMobile: boolean
    onComplete: () => void
}) {
    const HOLD_DURATION_MS = 2000
    const reduced = useMemo(prefersReduced, [])
    const [isHolding, setIsHolding] = useState(false)
    const [sealed, setSealed] = useState(false)
    const holdMV = useMotionValue(0)
    const startRef = useRef(0)
    const rafRef = useRef<number | null>(null)
    const releaseCtlRef = useRef<any>(null)
    const firedRef = useRef(false)
    const sealedRef = useRef(false)
    const handoffTimerRef = useRef<number | null>(null)
    const hit = useRef({ a: false, b: false, c: false })
    const onCompleteRef = useRef(onComplete)
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    /* Derivados del único driver holdMV. */
    const auraScale = useTransform(holdMV, [0, 1], [0.55, 1.3])
    const auraOpacity = useTransform(holdMV, [0, 1], [0, 0.7])
    const borderColor = useTransform(holdMV, (p) =>
        hx(accent, 0.42 + p * 0.53)
    )

    const cancelRaf = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }

    const seal = useCallback(() => {
        if (sealedRef.current) return
        sealedRef.current = true
        cancelRaf()
        holdMV.set(1)
        setIsHolding(false)
        setSealed(true)
        haptic(30) // el enganche magnético
        window.setTimeout(() => haptic([18, 40, 28]), 60) // golpe del burst
        /* onComplete diferido 540ms: el BURST completo (shockwave 0.42s,
           chispas ~0.5s, punto de luz 0.12+0.4=0.52s) se ve ENTERO antes de
           que finalizeSeal desmonte este componente y monte la Medición. */
        handoffTimerRef.current = window.setTimeout(() => {
            if (firedRef.current) return
            firedRef.current = true
            onCompleteRef.current()
        }, 540)
    }, [holdMV])

    const holdTick = useCallback(() => {
        const elapsed = Date.now() - startRef.current
        const p = Math.min(1, elapsed / HOLD_DURATION_MS)
        holdMV.set(p)
        if (p >= 0.25 && !hit.current.a) {
            hit.current.a = true
            haptic(8)
        }
        if (p >= 0.5 && !hit.current.b) {
            hit.current.b = true
            haptic(8)
        }
        if (p >= 0.75 && !hit.current.c) {
            hit.current.c = true
            haptic(8)
        }
        if (p >= 1) {
            rafRef.current = null
            seal()
            return
        }
        rafRef.current = requestAnimationFrame(holdTick)
    }, [holdMV, seal])

    const startHold = useCallback(
        (e: any) => {
            if (sealedRef.current) return
            if (e?.preventDefault) e.preventDefault()
            cancelRaf()
            releaseCtlRef.current?.stop?.()
            setIsHolding(true)
            startRef.current = Date.now() - holdMV.get() * HOLD_DURATION_MS
            haptic(12) // despertar del campo
            rafRef.current = requestAnimationFrame(holdTick)
        },
        [holdMV, holdTick]
    )

    const endHold = useCallback(() => {
        if (sealedRef.current || !isHolding) return
        cancelRaf()
        setIsHolding(false)
        hit.current = { a: false, b: false, c: false }
        /* Un solo valor gobierna la disipación → toda la gracia es gratis. */
        releaseCtlRef.current = animate(holdMV, 0, {
            duration: 0.42,
            ease: [0.22, 1, 0.36, 1],
        })
    }, [isHolding, holdMV])

    useEffect(() => {
        return () => {
            cancelRaf()
            releaseCtlRef.current?.stop?.()
            if (handoffTimerRef.current)
                clearTimeout(handoffTimerRef.current)
        }
    }, [])

    const labelNode = sealed ? (
        <>CÓDIGO SELLADO</>
    ) : isHolding ? (
        <>TRANSMITIENDO…</>
    ) : isMobile ? (
        <>
            MANTÉN PRESIONADO
            <br />
            PARA SELLAR CÓDIGO
        </>
    ) : (
        <>MANTÉN PRESIONADO PARA SELLAR CÓDIGO</>
    )

    /* 12 chispas del burst (deterministas por índice). */
    const sparks = useMemo(
        () =>
            Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2
                return { dx: Math.cos(a) * 70, dy: Math.sin(a) * 44 }
            }),
        []
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                width: "100%",
                marginTop: isMobile ? 14 : 20,
            }}
        >
            {/* Telemetría efímera de carga (Δφ / σ / LOCK) */}
            {!reduced && (
                <div
                    style={{
                        height: 12,
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {[
                        { k: "Δφ", v: "0.7" },
                        { k: "σ", v: "12%" },
                        { k: "LOCK", v: sealed ? "✓" : "…" },
                    ].map((t, i) => (
                        <motion.span
                            key={t.k}
                            animate={
                                isHolding && !sealed
                                    ? { opacity: [0.25, 0.85, 0.4] }
                                    : { opacity: sealed ? 0.8 : 0 }
                            }
                            transition={
                                isHolding && !sealed
                                    ? {
                                          duration: 0.7,
                                          repeat: Infinity,
                                          delay: i * 0.18,
                                      }
                                    : { duration: 0.3 }
                            }
                            style={{
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: "0.12em",
                                color:
                                    t.k === "LOCK" && sealed
                                        ? GOLD
                                        : hx(accent, 0.7),
                                fontFamily: "'JetBrains Mono',monospace",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {t.k} {t.v}
                        </motion.span>
                    ))}
                </div>
            )}

            {/* Contenedor relativo: aura + botón + campo del burst */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: isMobile ? 340 : 460,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                {/* Aura de carga (energía que se reúne) */}
                {!reduced && (
                    <motion.div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "70%",
                            height: 120,
                            translateX: "-50%",
                            translateY: "-50%",
                            scale: auraScale,
                            opacity: auraOpacity,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${hx(accent, 0.45)} 0%, transparent 65%)`,
                            mixBlendMode: "lighten",
                            filter: "blur(18px)",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}
                {reduced && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            scale: auraScale,
                            opacity: auraOpacity,
                            borderRadius: isMobile ? 14 : 18,
                            background: `radial-gradient(circle, ${hx(accent, 0.3)} 0%, transparent 70%)`,
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}

                <motion.button
                    type="button"
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    onTouchCancel={endHold}
                    animate={{
                        scale: sealed ? [1, 1.07, 1] : isHolding ? 1.015 : 1,
                    }}
                    transition={
                        sealed
                            ? { type: "spring", stiffness: 520, damping: 14 }
                            : { duration: 0.25 }
                    }
                    style={{
                        position: "relative",
                        width: "100%",
                        zIndex: 1,
                        padding: isMobile ? "16px 20px" : "20px 26px",
                        borderRadius: isMobile ? 14 : 18,
                        background: `linear-gradient(135deg, rgba(8,24,48,0.92), rgba(5,16,34,0.96), rgba(8,24,48,0.92)), ${hx(accent, 0.06)}`,
                        border: "1.5px solid",
                        borderColor: borderColor as any,
                        color: hx(accent, 0.95),
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 500,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        fontFamily: "'Inter',sans-serif",
                        cursor: sealed ? "default" : "pointer",
                        outline: "none",
                        overflow: "hidden",
                        userSelect: "none",
                        WebkitTapHighlightColor: "transparent",
                        WebkitUserSelect: "none",
                        touchAction: "manipulation",
                        boxShadow: isHolding
                            ? [
                                  `0 8px 32px ${hx(accent, 0.3)}`,
                                  `0 0 0 1px ${hx(accent, 0.32)}`,
                                  `inset 0 0 28px ${hx(accent, 0.18)}`,
                              ].join(", ")
                            : [
                                  `0 6px 20px ${hx(accent, 0.16)}`,
                                  `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                              ].join(", "),
                        backdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                        WebkitBackdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                    }}
                >
                    {/* Relleno de carga — scaleX (no width) */}
                    <motion.div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "100%",
                            transformOrigin: "left",
                            scaleX: holdMV,
                            background: `linear-gradient(90deg, ${hx(accent, 0.36)} 0%, ${hx(accent, 0.22)} 55%, ${hx(accent, 0.5)} 100%)`,
                            boxShadow: `0 0 24px ${hx(accent, 0.42)}`,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Scan-line de lectura durante la carga. El wrapper es
                        ancho-completo y traslada por transform x ("%"= su propio
                        ancho = ancho del botón) → GPU, sin animar `left`
                        (layout-thrash). La línea vive en su borde izquierdo. */}
                    {!reduced && isHolding && (
                        <motion.div
                            initial={{ x: "0%", opacity: 0 }}
                            animate={{
                                x: ["0%", "100%"],
                                opacity: [0, 0.7, 0],
                            }}
                            transition={{
                                duration: 0.9,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: "100%",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 2,
                                    background: hx("#FFFFFF", 0.6),
                                    boxShadow: `0 0 10px ${hx(accent, 0.8)}`,
                                }}
                            />
                        </motion.div>
                    )}
                    <motion.span
                        animate={
                            sealed
                                ? { x: [0, 2, -2, 1, 0] }
                                : { x: 0 }
                        }
                        transition={{ duration: 0.12 }}
                        style={{
                            position: "relative",
                            zIndex: 2,
                            display: "block",
                            textAlign: "center",
                            lineHeight:
                                isMobile && !sealed && !isHolding ? 1.5 : 1.2,
                        }}
                    >
                        {labelNode}
                    </motion.span>
                </motion.button>

                {/* BURST de sellado — campo que se cierra y detona */}
                {sealed && !reduced && (
                    <>
                        {/* Flash radial */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.85, 0] }}
                            transition={{ duration: 0.18 }}
                            style={{
                                position: "absolute",
                                inset: -20,
                                background: `radial-gradient(circle, ${hx(accent, 0.5)} 0%, transparent 60%)`,
                                mixBlendMode: "lighten",
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                        {/* Shockwave */}
                        <motion.div
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 3.2, opacity: [0.9, 0] }}
                            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: 90,
                                height: 90,
                                marginLeft: -45,
                                marginTop: -45,
                                borderRadius: "50%",
                                border: `2px solid ${hx(accent, 0.7)}`,
                                pointerEvents: "none",
                                zIndex: 2,
                            }}
                        />
                        {/* 12 chispas radiales */}
                        {sparks.map((s, i) => (
                            <motion.div
                                key={`sp${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: s.dx,
                                    y: s.dy,
                                    opacity: 0,
                                    scale: 0.3,
                                }}
                                transition={{
                                    duration: 0.4,
                                    delay: i * 0.008,
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: 3,
                                    height: 3,
                                    marginLeft: -1.5,
                                    marginTop: -1.5,
                                    borderRadius: "50%",
                                    background: GOLD,
                                    boxShadow: `0 0 6px ${hx(GOLD, 0.8)}`,
                                    pointerEvents: "none",
                                    zIndex: 3,
                                }}
                            />
                        ))}
                        {/* Punto de luz de handoff (alimenta la Medición) */}
                        <motion.div
                            initial={{ scale: 2.2, opacity: 0 }}
                            animate={{ scale: [2.2, 0.6], opacity: [0, 0.9, 0.5] }}
                            transition={{ duration: 0.4, delay: 0.12 }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: 14,
                                height: 14,
                                marginLeft: -7,
                                marginTop: -7,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                    </>
                )}
                {/* Sello en reduced-motion: flash breve */}
                {sealed && reduced && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: isMobile ? 14 : 18,
                            background: `radial-gradient(circle, ${hx(accent, 0.4)} 0%, transparent 70%)`,
                            pointerEvents: "none",
                            zIndex: 3,
                        }}
                    />
                )}
            </div>
        </motion.div>
    )
}

/* ═══ FrecuenciaAnclada — LA REVELACIÓN: cristalización de luz (ritual por-pilar) ═══
   El número no aparece: NACE de una semilla de luz (recoge el punto del
   handoff de la Medición), el dígito se materializa con overshoot mientras
   cuenta 0→score, detrás un anillo de calibración gira y CLAVA el ángulo ==
   score justo al terminar el conteo (el LOCK), y 8/12 chispas dispersas son
   ABSORBIDAS espiralando hacia adentro hasta condensarse en la cifra. Firma
   intacta. ~4.6s (baja de ~6s). Conserva el Tomo de Calibración + Telemetría. */
function FrecuenciaAnclada({
    score,
    accent,
    isMobile,
    onComplete,
}: {
    score: number
    accent: string
    isMobile: boolean
    onComplete: () => void
}) {
    const reduced = useMemo(prefersReduced, [])
    const [labelVisible, setLabelVisible] = useState(false)
    const [phaseVisible, setPhaseVisible] = useState(false)
    const [settled, setSettled] = useState(false)
    const [lockFlash, setLockFlash] = useState(false)
    /* Fase de Calibración derivada del score. 0-9% → I, ..., 90-100% → X. */
    const calibPhase = Math.min(10, Math.max(1, Math.floor(score / 10) + 1))
    const calibPhaseRoman =
        ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][
            calibPhase
        ] || String(calibPhase)
    /* Color por nivel SIEMPRE en HEX (hx() solo acepta hex). */
    const scoreColorHex = score < 40 ? "#FF6B6B" : score < 70 ? accent : GOLD

    const mv = useMotionValue(0)
    const numRef = useRef<HTMLSpanElement>(null)
    const onCompleteRef = useRef(onComplete)
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])
    const firedRef = useRef(false)
    const controlsRef = useRef<any[]>([])

    /* Chispas absorbidas: ángulos/radios deterministas por índice. */
    const N = isMobile ? 8 : 12
    const sparks = useMemo(
        () =>
            Array.from({ length: N }).map((_, i) => {
                const a = (i / N) * Math.PI * 2 + 0.4
                const r = 34 + (i % 3) * 6
                return { x: Math.cos(a) * r, y: Math.sin(a) * r }
            }),
        [N]
    )

    useEffect(() => {
        if (firedRef.current) return
        if (numRef.current) numRef.current.textContent = "0"
        const timers: number[] = []
        const C = controlsRef.current
        const dur = reduced ? 1200 : 1900
        const startDelay = reduced ? 150 : 500
        timers.push(window.setTimeout(() => setLabelVisible(true), 200))
        if (!reduced) timers.push(window.setTimeout(() => haptic(8), 200))

        const ctl = animate(mv, score, {
            duration: dur / 1000,
            delay: startDelay / 1000,
            ease: [0.16, 1, 0.3, 1],
            onComplete: () => {
                setSettled(true)
                if (!reduced) haptic(20)
            },
        })
        C.push(ctl)
        const unsub = mv.on("change", (v) => {
            if (numRef.current)
                numRef.current.textContent = String(Math.round(v))
        })

        /* LOCK del anillo ~ cuando termina el conteo. */
        if (!reduced)
            timers.push(
                window.setTimeout(
                    () => {
                        setLockFlash(true)
                        haptic(14)
                    },
                    startDelay + dur
                )
            )
        /* Tomo de Calibración después de asimilar el número. */
        timers.push(
            window.setTimeout(
                () => {
                    setPhaseVisible(true)
                    if (!reduced) haptic([6, 40, 6])
                    /* #5 Estados de ánimo — al desbloquear el Tomo, una onda
                       irradia por la pantalla teñida por el nivel (dorada si
                       fuerte, roja si crítico). Si es crítico, el campo además
                       se tensa (viñeta fría). */
                    let wx =
                        typeof window !== "undefined"
                            ? window.innerWidth / 2
                            : 0
                    let wy =
                        typeof window !== "undefined"
                            ? window.innerHeight / 2
                            : 0
                    const el = numRef.current
                    if (el) {
                        const r = el.getBoundingClientRect()
                        if (r.width || r.height) {
                            wx = r.left + r.width / 2
                            wy = r.top + r.height / 2
                        }
                    }
                    fireFieldWave(wx, wy, { color: scoreColorHex })
                    if (score < 40) fireFieldTension()
                },
                reduced ? 1600 : 3100
            )
        )
        timers.push(
            window.setTimeout(
                () => {
                    if (firedRef.current) return
                    firedRef.current = true
                    onCompleteRef.current()
                },
                /* +2.2s: el "TOMO DE CALIBRACIÓN DESBLOQUEADO" aparece a
                   3100ms; antes se iba a 4600 (1.5s) — muy rápido para leerlo.
                   Ahora queda visible ~3.7s antes de volver al radar. */
                reduced ? 4400 : 6800
            )
        )
        return () => {
            timers.forEach((t) => clearTimeout(t))
            C.forEach((c) => c?.stop?.())
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [score])

    const VB = 200
    const CC = VB / 2

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.4 : 0.5 }}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 26 : 38,
                width: "100%",
                height: "100%",
                minHeight: isMobile ? 380 : 500,
                padding: isMobile ? "40px 24px" : "60px 40px",
                textAlign: "center",
            }}
        >
            <motion.h3
                initial={{ opacity: 0, y: -8, letterSpacing: "0.5em" }}
                animate={{
                    opacity: labelVisible ? 1 : 0,
                    y: labelVisible ? 0 : -8,
                    letterSpacing: "0.28em",
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: "relative",
                    zIndex: 2,
                    margin: 0,
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 300,
                    textTransform: "uppercase",
                    color: hx(accent, 0.95),
                    fontFamily: "'Inter',sans-serif",
                    textShadow: `0 0 24px ${hx(accent, 0.4)}`,
                }}
            >
                Frecuencia Anclada
            </motion.h3>
            {/* Zona del número (v2.16): el halo + el anillo SVG se centran en
                el NÚMERO, no en toda la columna → el número queda centrado en
                el círculo. La zona no anima; el número conserva su propia
                entrada de escala adentro. */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                }}
            >
            {/* Halo radial de fondo (derivado del color de nivel). Solo anima
                OPACITY (no scale): un blur(30px) que se re-escala obliga a
                re-rasterizar por frame en WKWebView; estático se cachea y solo
                el alpha cambia (barato). */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: settled ? [0.25, 0.3, 0.25] : [0, 0.42, 0.28],
                }}
                transition={
                    settled
                        ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 3, ease: [0.22, 1, 0.36, 1] }
                }
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: isMobile ? 260 : 420,
                    height: isMobile ? 260 : 420,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${hx(scoreColorHex, 0.18)} 0%, ${hx(scoreColorHex, 0.05)} 45%, transparent 70%)`,
                    filter: "blur(30px)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* SVG de efectos centrado tras el número (semilla, lock-ring,
                resonancia, chispas absorbidas) */}
            {!reduced && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: isMobile ? 280 : 420,
                        height: isMobile ? 280 : 420,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${VB} ${VB}`}
                        style={{ overflow: "visible" }}
                    >
                        <defs>
                            <filter
                                id="faGlow"
                                x="-75%"
                                y="-75%"
                                width="250%"
                                height="250%"
                            >
                                <feGaussianBlur stdDeviation="1.6" />
                            </filter>
                        </defs>
                        {/* Semilla de luz que NACE y se desvanece (absorbida en
                            el dígito ~1.6s) → "el número nace de la luz". */}
                        <motion.circle
                            cx={CC}
                            cy={CC}
                            r={3}
                            fill={scoreColorHex}
                            filter="url(#faGlow)"
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.1, 0.5], opacity: [0, 1, 0] }}
                            transition={{
                                duration: 1.5,
                                delay: 0.1,
                                times: [0, 0.25, 1],
                                ease: "easeOut",
                            }}
                        />
                        {/* Anillo de calibración — arranca con la semilla (0.2s),
                            gira y CLAVA el ángulo EXACTO del score aterrizando a
                            ~2.4s, justo cuando el conteo termina (lockFlash). El
                            flash del LOCK vive en el strokeWidth del círculo (no
                            en el motion.g, para no reiniciar la rotación). */}
                        <motion.g
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{
                                rotate: 540 + (score / 100) * 360,
                                opacity: [0, 0.9, 0.9],
                            }}
                            transition={{ duration: 2.2, delay: 0.2, ease: [0.4, 0, 0.1, 1] }}
                        >
                            <motion.circle
                                cx={CC}
                                cy={CC}
                                r={72}
                                fill="none"
                                stroke={scoreColorHex}
                                strokeDasharray="46 360"
                                strokeLinecap="round"
                                filter="url(#faGlow)"
                                initial={{ strokeWidth: 1.6 }}
                                animate={{
                                    strokeWidth: lockFlash ? [1.6, 3.4, 2] : 1.6,
                                }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </motion.g>
                        {/* Anillos de resonancia que emanan */}
                        {[0, 1, 2].map((k) => (
                            <motion.circle
                                key={`res${k}`}
                                cx={CC}
                                cy={CC}
                                fill="none"
                                stroke={scoreColorHex}
                                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                                initial={{ r: 8, opacity: 0, strokeWidth: 1.4 }}
                                animate={{ r: 78, opacity: [0.5, 0], strokeWidth: 0.3 }}
                                transition={{
                                    duration: 1.6,
                                    delay: 0.7 + k * 0.4,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                        {/* Chispas ABSORBIDAS — luz dispersa que cristaliza */}
                        {sparks.map((s, i) => (
                            <motion.circle
                                key={`sk${i}`}
                                cx={CC}
                                cy={CC}
                                r={1.6}
                                fill={scoreColorHex}
                                filter="url(#faGlow)"
                                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                                initial={{ x: s.x, y: s.y, opacity: 0, scale: 1 }}
                                animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: 0.4 }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.55 + i * 0.045,
                                    ease: [0.5, 0, 0.4, 1],
                                }}
                            />
                        ))}
                    </svg>
                </div>
            )}

            {/* Número: nace con overshoot (wrapper externo) + latido al asentar
                (wrapper interno). El '%' es hermano del span con ref (el
                textContent del count-up no lo borra). */}
            <motion.div
                initial={{ scale: reduced ? 1 : 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    scale: reduced
                        ? { duration: 0.4, delay: 0.15 }
                        : { duration: 0.7, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                    opacity: { duration: 0.4, delay: reduced ? 0.15 : 0.5 },
                }}
                style={{ position: "relative", zIndex: 2 }}
            >
                <motion.div
                    animate={{ scale: settled && !reduced ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: isMobile ? 88 : 140,
                        fontWeight: 200,
                        color: scoreColorHex,
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                        textShadow: `0 0 40px ${hx(scoreColorHex, 0.95)}, 0 0 80px ${hx(scoreColorHex, 0.5)}`,
                    }}
                >
                    <span ref={numRef}>0</span>
                    <span
                        style={{
                            fontSize: "0.36em",
                            opacity: 0.62,
                            marginLeft: "0.14em",
                            letterSpacing: "0.04em",
                            textShadow: `0 0 16px ${hx(scoreColorHex, 0.6)}`,
                        }}
                    >
                        %
                    </span>
                </motion.div>
            </motion.div>
            </div>
            {/* Bloque de fase de Calibración. Aparece después de que el
                contador del % terminó su barrido, en cyan tenue al inicio +
                romano grande dorado. Comunica al Tripulante en qué tomo de
                la capa de Calibración aterriza este pilar. La fase
                definitiva y los demás tomos anteriores se desbloquean
                cuando el Tripulante cierre los 6 pilares. */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{
                    opacity: phaseVisible ? 1 : 0,
                    y: phaseVisible ? 0 : 8,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: "relative",
                    zIndex: 2,
                    marginTop: isMobile ? 28 : 40,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: isMobile ? 4 : 6,
                }}
            >
                {/* Texto único post-pilar — patrón Zak 2026-05-10:
                    "TOMO DE CALIBRACIÓN DESBLOQUEADO: <romano>" en
                    una sola línea dorada con glow. */}
                <span
                    style={{
                        fontSize: isMobile ? 11 : 13,
                        fontWeight: 400,
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        color: "rgba(212,168,67,0.95)",
                        textShadow:
                            "0 0 18px rgba(212,168,67,0.55), 0 0 36px rgba(212,168,67,0.25)",
                        fontFamily: "'Inter',sans-serif",
                        textAlign: "center",
                        lineHeight: 1.4,
                    }}
                >
                    Tomo de Calibración Desbloqueado:{" "}
                    <motion.span
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{
                            scale: phaseVisible ? 1 : 0.7,
                            opacity: phaseVisible ? 1 : 0,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                        style={{
                            display: "inline-block",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 600,
                            marginLeft: 2,
                        }}
                    >
                        {calibPhaseRoman}
                    </motion.span>
                </span>
            </motion.div>
            <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ duration: 0.7, delay: reduced ? 1.4 : 3.5 }}
                style={{
                    position: "relative",
                    zIndex: 2,
                    margin: 0,
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 300,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "'Inter',sans-serif",
                }}
            >
                Telemetría registrada
            </motion.p>
        </motion.div>
    )
}

/* ═══ PILLAR CONFIG — los 6 pilares con sus sondas hardcoded ═══ */
const PILLARS: PillarCfg[] = [
    {
        id: "fisico",
        label: "Hardware Físico",
        labelShort: "HARDWARE",
        icon: <IHw />,
        questions: [
            {
                text: "¿Cómo se siente tu cuerpo (tu Avatar) después de comer y durante el resto del día?",
                options: [
                    {
                        label: "Pesado y con niebla mental. Siento fatiga casi de inmediato; mi digestión me roba la energía en lugar de dármela.",
                        value: 0,
                    },
                    {
                        label: "Siento inflamación frecuente o pesadez. Suelo depender de estimulantes (azúcar/café) para no apagarme a media tarde.",
                        value: 25,
                    },
                    {
                        label: "Funcional. Mi energía es estable la mayor parte del tiempo, aunque a veces como por inercia o ansiedad, no por necesidad.",
                        value: 50,
                    },
                    {
                        label: "Ligero en su mayoría. Respeto mis ventanas de alimentación, elijo alimentos que me nutren y rara vez siento bajones de energía.",
                        value: 75,
                    },
                    {
                        label: "Energía limpia y sostenida. Mi cuerpo se siente eléctrico, vacío de densidad y operando como un superconductor.",
                        value: 100,
                    },
                ],
            },
            {
                text: "Al despertar por la mañana, ¿cuál es el nivel de energía con el que arranca tu sistema?",
                options: [
                    {
                        label: "Resistencia total. Me cuesta muchísimo salir de la cama, despierto exhausto, nublado y sin ganas de iniciar el día.",
                        value: 0,
                    },
                    {
                        label: 'Despierto con letargo. Necesito alarmas múltiples, tiempo para "procesar" que desperté y algo externo para arrancar.',
                        value: 25,
                    },
                    {
                        label: "Un despertar estándar. Me levanto porque tengo cosas que hacer; la energía es suficiente pero no es expansiva.",
                        value: 50,
                    },
                    {
                        label: "Despierto con facilidad y claridad casi inmediata. Mi mente se enciende rápido y mi cuerpo está listo.",
                        value: 75,
                    },
                    {
                        label: "Ignición eléctrica. Abro los ojos con nitidez absoluta, listo para materializar la visión del día.",
                        value: 100,
                    },
                ],
            },
            {
                text: "¿Cómo gestionas la energía acumulada en tu estructura física (ejercicio, movilidad, tensión)?",
                options: [
                    {
                        label: "Sedentarismo casi total. Mi cuerpo se siente rígido, estancado o con dolores constantes por inactividad.",
                        value: 0,
                    },
                    {
                        label: "Movimiento muy ocasional o ligero. Paso la mayor parte de mi día en inercia física.",
                        value: 25,
                    },
                    {
                        label: "Mantengo una rutina de ejercicio promedio. Cumplo con moverme, pero a veces se siente como obligación.",
                        value: 50,
                    },
                    {
                        label: "Entreno constantemente. Mi cuerpo tiene fuerza y flexibilidad, y utilizo el movimiento para liberar estrés.",
                        value: 75,
                    },
                    {
                        label: "Alto voltaje. Mi entrenamiento transfiere energía sin bloqueos. Mi estructura es un canal abierto y fuerte.",
                        value: 100,
                    },
                ],
            },
        ],
        protocol: {
            alert: "Se detecta alta entropía en el contenedor biológico.",
            suggestion: "Tu hardware necesita recalibración urgente.",
            tasks: [
                { id: "f1", text: "Ayuno intermitente de 16 horas" },
                { id: "f2", text: "Anclaje solar matutino: 11 min" },
                { id: "f3", text: "Eliminar estimulantes sintéticos 7 días" },
                { id: "f4", text: "Movimiento estructural: 30 min" },
                { id: "f5", text: "Hidratación: 3L antes de 6pm" },
            ],
        },
    },
    {
        id: "mental",
        label: "Procesador Mental",
        labelShort: "PROCESADOR",
        icon: <IMn />,
        questions: [
            {
                text: "Cuando necesitas sostener tu atención en silencio o en una tarea profunda, ¿cómo responde tu mente?",
                options: [
                    {
                        label: "Colapso por abstinencia. Necesito estímulos constantes. El silencio me genera incomodidad intolerable.",
                        value: 0,
                    },
                    {
                        label: "Atención fragmentada. Puedo concentrarme breves momentos, pero mi mente salta a buscar distracciones.",
                        value: 25,
                    },
                    {
                        label: "Funcional pero ruidoso. Logro hacer el trabajo, pero requiere mucho esfuerzo bloquear las distracciones.",
                        value: 50,
                    },
                    {
                        label: "Enfoque estable. Consumo información de forma consciente y puedo sumergirme en el silencio sin rebeldía.",
                        value: 75,
                    },
                    {
                        label: "Enfoque láser. Mi atención es un vector de un solo punto. El silencio es mi estado natural.",
                        value: 100,
                    },
                ],
            },
            {
                text: "¿Qué porcentaje de tu energía diaria se gasta proyectando el futuro o revisando el pasado?",
                options: [
                    {
                        label: "Parálisis por análisis. Mi mente está en un loop constante de escenarios catastróficos.",
                        value: 0,
                    },
                    {
                        label: "Rumiación frecuente. Pienso en exceso cada variable y me cuesta anclar mi atención.",
                        value: 25,
                    },
                    {
                        label: "Pensamiento operativo. Proyecto el futuro para planear, a veces genera estrés.",
                        value: 50,
                    },
                    {
                        label: "Presencia alta. La mayor parte de mi día mi mente está donde está mi cuerpo físico.",
                        value: 75,
                    },
                    {
                        label: "Anclaje Absoluto. Vivo en soberanía de la línea temporal presente.",
                        value: 100,
                    },
                ],
            },
            {
                text: "Cuando un problema o bloqueo se presenta en tu realidad, ¿cómo lo procesa tu arquitectura mental?",
                options: [
                    {
                        label: "Bloqueo total. Me abrumo instantáneamente, evito tomar la decisión.",
                        value: 0,
                    },
                    {
                        label: "Duda prolongada. Cuestiono repetidamente mis opciones, busco validación externa.",
                        value: 25,
                    },
                    {
                        label: "Resolución estándar. Evalúo pros y contras. Tomo la decisión con algo de duda.",
                        value: 50,
                    },
                    {
                        label: "Claridad rápida. Analizo la geometría del problema sin apego emocional.",
                        value: 75,
                    },
                    {
                        label: "Decisión intuitiva. La resolución surge del vacío sin estática posterior.",
                        value: 100,
                    },
                ],
            },
        ],
        protocol: {
            alert: "Ruido de fondo excesivo en el campo mental.",
            suggestion:
                "Tu procesador necesita vacío para operar en modo láser.",
            tasks: [
                { id: "m1", text: "Detox digital: 0 redes antes de 12pm por 7 días" },
                { id: "m2", text: "Meditación de vacío: 15 min en silencio absoluto" },
                { id: "m3", text: "Journaling nocturno: 3 decisiones del día" },
                { id: "m4", text: "Eliminar multitasking: una sola tarea a la vez" },
                { id: "m5", text: "Lectura profunda: 30 min sin interrupciones" },
            ],
        },
    },
    {
        id: "emocional",
        label: "Motor Emocional",
        labelShort: "MOTOR",
        icon: <IEm />,
        questions: [
            {
                text: "Cuando una situación externa sale mal, te critican o recibes un impacto inesperado, ¿cómo reacciona tu cuerpo y tu emoción?",
                options: [
                    {
                        label: "Explosión o parálisis. Pierdo el control, me consume el enojo o la tristeza por días.",
                        value: 0,
                    },
                    {
                        label: 'Reacción rápida y defensiva. Me "engancho" con la situación. La emoción me drena todo el día.',
                        value: 25,
                    },
                    {
                        label: 'Contención forzada. Siento el impacto pero logro "tragarme" la emoción para seguir funcional.',
                        value: 50,
                    },
                    {
                        label: "Observación consciente. Siento la emoción llegar, no la suprimo pero no dejo que tome el volante.",
                        value: 75,
                    },
                    {
                        label: "Contención absoluta. Observo sin identificarme y transmuto instantáneamente.",
                        value: 100,
                    },
                ],
            },
            {
                text: "¿Qué tanto depende tu paz interior de la validación de las personas que te rodean?",
                options: [
                    {
                        label: "Dependencia total. Si no me validan, mi mundo emocional colapsa.",
                        value: 0,
                    },
                    {
                        label: "Me afecta bastante. Busco constantemente agradar y modifico mi forma de ser.",
                        value: 25,
                    },
                    {
                        label: "Me importa la opinión cercana y a veces genera duda, pero tolero el desacuerdo.",
                        value: 50,
                    },
                    {
                        label: "Alta soberanía. Sé quién soy. El rechazo externo no altera mi centro.",
                        value: 75,
                    },
                    {
                        label: "Estado de Espejo. La validación externa es irrelevante para mi existencia.",
                        value: 100,
                    },
                ],
            },
            {
                text: "Cuando experimentas dolor emocional profundo, ¿cómo lo procesa tu arquitectura interna?",
                options: [
                    {
                        label: "Victimización y evasión. Busco anestesiar el dolor. El dolor me consume.",
                        value: 0,
                    },
                    {
                        label: "Lo sufro con resistencia. Trato de distraerme para no enfrentarlo.",
                        value: 25,
                    },
                    {
                        label: "Lo proceso mecánicamente. Me doy tiempo para sentirlo, permitiendo que pase.",
                        value: 50,
                    },
                    {
                        label: "Observación como maestro. Entiendo su origen, extraigo la lección y libero.",
                        value: 75,
                    },
                    {
                        label: "Alquimia pura. Utilizo la densidad como combustible para expandir mi consciencia.",
                        value: 100,
                    },
                ],
            },
        ],
        protocol: {
            alert: "Campo emocional en modo reactivo.",
            suggestion:
                "La contención emocional es el primer paso hacia la superconductividad.",
            tasks: [
                { id: "e1", text: "Protocolo de Espejo: 10 min diarios en silencio" },
                { id: "e2", text: "Documentar 3 triggers emocionales de la semana" },
                { id: "e3", text: "No-reacción: esperar 10 respiraciones" },
                { id: "e4", text: "Cortar 1 drenaje energético activo" },
                { id: "e5", text: "Escritura alquímica: 1 dolor → 1 lección" },
            ],
        },
    },
    {
        id: "financiero",
        label: "Gravedad Financiera",
        labelShort: "GRAVEDAD",
        icon: <IFi />,
        questions: [
            {
                text: "En el momento de hacer un pago importante o invertir, ¿qué sensación domina tu sistema nervioso?",
                options: [
                    { label: "Pánico y contracción. Siento que el dinero se acaba.", value: 0 },
                    { label: "Miedo y culpa. Pago porque debo, pero sufro el desprendimiento.", value: 25 },
                    { label: "Transacción mecánica. Ni me emociona ni me aterra.", value: 50 },
                    { label: "Flujo consciente. Agradezco tener la energía para pagar.", value: 75 },
                    { label: "Expansión absoluta. Cada salida está bendecida.", value: 100 },
                ],
            },
            {
                text: "¿Cómo percibes tu capacidad para generar ingresos?",
                options: [
                    { label: "Lucha de supervivencia. El dinero huye de mí.", value: 0 },
                    { label: "Esfuerzo extremo. Sacrifico toda mi energía vital.", value: 25 },
                    { label: "Estabilidad condicionada. Si paro el flujo colapsa.", value: 50 },
                    { label: "Atracción magnética. Ingresos constantes sin agotarme.", value: 75 },
                    { label: "Materialización instantánea. Yo soy la gravedad que lo atrae.", value: 100 },
                ],
            },
            {
                text: "Cuando piensas en tu situación financiera frente a lo que deseas materializar, ¿cuál es tu estado base?",
                options: [
                    { label: "Resentimiento. Odio mi situación, la estructura es injusta.", value: 0 },
                    { label: "Preocupación crónica. Siempre siento que me falta algo.", value: 25 },
                    { label: "Aceptación pasiva. Me gustaría estar mejor pero no arriesgo.", value: 50 },
                    { label: "Gratitud activa. Opero con confianza para expandir mi impacto.", value: 75 },
                    { label: "Soberanía dimensional. Mi consciencia moldea la materia a voluntad.", value: 100 },
                ],
            },
        ],
        protocol: {
            alert: "Patrón de contracción activo en el campo de abundancia.",
            suggestion:
                "La frecuencia de escasez bloquea la integración de tu luz.",
            tasks: [
                { id: "g1", text: "Auditoría de fugas: eliminar 3 gastos sin retorno" },
                { id: "g2", text: "1 gasto consciente de inversión en tu evolución" },
                { id: "g3", text: "Escribir tu relación ideal con el dinero en presente" },
                { id: "g4", text: "Generar 1 fuente de ingreso nueva" },
                { id: "g5", text: "Gratitud financiera: agradecer 3 intercambios del día" },
            ],
        },
    },
    {
        id: "vector",
        label: "Vector de Expansión",
        labelShort: "VECTOR",
        icon: <IVec />,
        questions: [],
        protocol: {
            alert: "Sin vector detectado.",
            suggestion:
                "Configura las sondas de este pilar desde el Motor de Intervención.",
            tasks: [],
        },
    },
    {
        id: "orbita",
        label: "Órbita Relacional",
        labelShort: "ÓRBITA",
        icon: <IOrb />,
        questions: [],
        protocol: {
            alert: "Campo relacional sin lectura.",
            suggestion:
                "Configura las sondas de este pilar desde el Motor de Intervención.",
            tasks: [],
        },
    },
]

/* ═══ Radar — hexágono cyan-gold con anillos orbitales y resonance ═══ */
function Radar({
    scores,
    accent,
    onNodeClick,
    pillarTimestamps,
    cycleScanned,
    isGlobalCooldown,
    isMobile,
    ignitionPulse,
    resonancePulseKey,
    loaded,
    scanResolved = true,
    lastCycleTs,
    isActiveMember = false,
    suppressIndice = false,
}: {
    scores: Scores
    accent: string
    onNodeClick: (id: PillarId) => void
    pillarTimestamps: Timestamps
    cycleScanned: Set<PillarId>
    isGlobalCooldown: boolean
    isMobile: boolean
    ignitionPulse?: { pillar: PillarId; ts: number } | null
    resonancePulseKey?: number
    loaded: boolean
    /* anti-flash: el hint "Toca un nodo" solo aparece cuando el fetch
       de scan history ya resolvió (scanResolved) — así no parpadea
       durante la hidratación con red lenta. Default true (defensivo:
       Framer instancia el componente standalone sin esta prop). */
    scanResolved?: boolean
    /* v3 — Timestamp del último ciclo cerrado (6/6 pilares). Cuando
       isGlobalCooldown=true se usa para renderizar un badge de
       countdown ARRIBA del hexágono con el tiempo restante hasta el
       próximo escaneo disponible. Días+horas mientras falte ≥ 1h;
       solo minutos cuando queda < 1h. */
    lastCycleTs?: number | null
    /* v2.7 — Badge "Próximo Escaneo" condicional. Sólo visible para
       tripulantes con Sintonía Solar activa: a invitados/no-suscriptores
       darles esa info crearía falsa expectativa de que el sistema les
       dará un nuevo escaneo gratis. Para no-miembros, en su lugar se
       muestra el modal Sintonía Solar al picar un pilar bloqueado. */
    isActiveMember?: boolean
    /* Cuando la ceremonia "Materialización del Índice de Luz" está corriendo
       (al sellar el ciclo 6/6), oculta el badge estático del índice para
       que el número de la ceremonia (count-up) sea el único en pantalla y
       el handoff al revelar el radar sea limpio. */
    suppressIndice?: boolean
}) {
    const VB = 620,
        cx = VB / 2,
        cy = VB / 2,
        maxR = VB * (isMobile ? 0.38 : 0.34),
        n = 6,
        as = (Math.PI * 2) / n,
        sa = -Math.PI / 2
    const pt = (i: number, v: number): [number, number] => {
        const a = sa + i * as,
            r = (v / 100) * maxR
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    }
    const cc = Object.values(scores).filter((v) => v !== null).length,
        allDone = cc === 6
    const indice = allDone
        ? Math.round(
              Object.values(scores).reduce((s, v) => s + (v || 0), 0) / 6
          )
        : null
    const dps = PILLARS.map((p, i) =>
        pt(i, scores[p.id] !== null ? scores[p.id]! : 0)
    )
    const has = Object.values(scores).some((v) => v !== null)
    /* #1 El campo respira — índice del campo (promedio de los pilares con
       dato) → alimenta el tempo + color del latido del halo, y se publica
       como señal global para que el cosmos / la Firma / la barra respiren
       en sintonía. */
    const fieldIndex =
        cc > 0
            ? Math.round(
                  Object.values(scores).reduce((s, v) => s + (v || 0), 0) / cc
              )
            : null
    const breath = breathParams(fieldIndex)
    /* Anti-flash del hint central: al abrir la app fresca, un Tripulante con
       historial recibe `scores` vacío 1-2s antes de hidratarse, y el centro
       parpadeaba "Toca un nodo para iniciar" — sobre todo cuando la red tarda
       (el timer de 1.2s alcanzaba a disparar antes de que llegaran los datos).
       Sembramos UNA vez en el montaje si ya había un Índice de Luz guardado
       (señal global leída de localStorage, SÍNCRONA — disponible antes que el
       fetch). Si lo hay, NUNCA mostramos el hint de "usuario nuevo": el
       Tripulante ya tiene puntaje, su baseline se pintará al hidratar. El
       estado en curso ("N/6 pilares") sí se muestra al instante. */
    /* Latch pegajoso: arranca true si ya había Índice de Luz guardado
       (señal global síncrona), y se queda en true en cuanto aparezca
       cualquier score (cc > 0) — una vez que el Tripulante tiene lectura,
       NUNCA volvemos a tratarlo como "usuario nuevo", aun si la señal se
       limpia transitoriamente. */
    const [hadPriorIndex, setHadPriorIndex] = useState(
        () => getLightIndex() != null
    )
    useEffect(() => {
        if (getLightIndex() != null || cc > 0) setHadPriorIndex(true)
    }, [cc])
    const [showEmptyHint, setShowEmptyHint] = useState(false)
    useEffect(() => {
        if (
            hadPriorIndex ||
            !(loaded && scanResolved && !allDone && cc === 0)
        ) {
            setShowEmptyHint(false)
            return
        }
        const t = setTimeout(() => setShowEmptyHint(true), 1200)
        return () => clearTimeout(t)
    }, [loaded, scanResolved, allDone, cc, hadPriorIndex])
    /* #1 Publica el índice del campo a la señal global (cosmos/Firma/barra).
       GUARDA: solo publicamos cuando hay un valor real (fieldIndex != null);
       jamás borramos la señal con el `null` transitorio de la hidratación
       (scores vacíos 1-2s antes de llegar los datos), que apagaría el campo
       respirando. Solo limpiamos a null cuando de verdad NO hay scores
       (loaded && cc === 0): usuario nuevo sin lectura alguna. */
    useEffect(() => {
        if (fieldIndex != null) setLightIndex(fieldIndex)
        else if (loaded && cc === 0) setLightIndex(null)
    }, [fieldIndex, loaded, cc])
    /* #2 Materialización — al revelarse el Índice de Luz (lectura directa o
       post-ceremonia), esquirlas de luz convergen al puntaje: el número
       cristaliza desde el campo. Una sola vez por ciclo (matFiredRef); no
       corre durante la ceremonia (suppressIndice oculta el número). */
    const indiceRef = useRef<HTMLDivElement>(null)
    const matFiredRef = useRef(false)
    useEffect(() => {
        if (allDone && indice !== null && !suppressIndice) {
            if (!matFiredRef.current) {
                matFiredRef.current = true
                const el = indiceRef.current
                if (el) {
                    const r = el.getBoundingClientRect()
                    fireMaterialize(
                        r.left + r.width / 2,
                        r.top + r.height / 2,
                        { color: breath.color, count: 16, radius: 120 }
                    )
                }
            }
        } else if (!allDone) {
            matFiredRef.current = false
        }
    }, [allDone, indice, suppressIndice])
    const poly =
        dps.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") +
        " Z"
    const fc = allDone
        ? indice! < 40
            ? "rgba(255,100,100,0.1)"
            : indice! < 70
              ? hx(accent, 0.08)
              : "rgba(200,164,78,0.1)"
        : hx(accent, 0.04)
    const sc = allDone
        ? indice! < 40
            ? "rgba(255,100,100,0.5)"
            : indice! < 70
              ? hx(accent, 0.5)
              : "rgba(200,164,78,0.5)"
        : hx(accent, 0.2)
    const [, setNow] = useState(Date.now())
    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(i)
    }, [])
    const [hoverNode, setHoverNode] = useState<PillarId | null>(null),
        [hoverProgress, setHoverProgress] = useState(0)
    const hRef = useRef<any>(null),
        hsRef = useRef(0)
    const startH = (id: PillarId) => {
        if (isMobile) return
        setHoverNode(id)
        setHoverProgress(0)
        hsRef.current = Date.now()
        const anim = () => {
            const p = Math.min((Date.now() - hsRef.current) / 900, 1)
            setHoverProgress(p)
            if (p >= 1) {
                onNodeClick(id)
                setHoverNode(null)
                setHoverProgress(0)
                return
            }
            hRef.current = requestAnimationFrame(anim)
        }
        hRef.current = requestAnimationFrame(anim)
    }
    const endH = () => {
        if (hRef.current) cancelAnimationFrame(hRef.current)
        setHoverNode(null)
        setHoverProgress(0)
    }
    const oP = Array.from({ length: 6 }, (_, i) => pt(i, 100))
    const oPoly =
        oP.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") +
        " Z"
    /* v3 — Badge de cooldown ABAJO del hexágono (movido en pedido
       de Zak: quería darle protagonismo al Radar como primer
       elemento, así el badge "Próximo Escaneo" cuelga debajo en
       lugar de competir con el hexágono arriba). Aparece sólo
       cuando ya cerró un ciclo 6/6 y el cooldown sigue vivo.
       Formato pedido por Diego: "Xd Yh" mientras falte ≥ 1h, "Mm"
       cuando quedan < 60 min. El cálculo se actualiza cada segundo
       gracias al setInterval de "now" arriba (ya re-renderiza el
       Radar — aprovechamos ese tick). */
    const cooldownLabel = (() => {
        if (!isGlobalCooldown || !lastCycleTs) return ""
        const remSec = Math.max(
            0,
            COOLDOWN_SEC - Math.floor((Date.now() - lastCycleTs) / 1000)
        )
        if (remSec <= 0) return ""
        const days = Math.floor(remSec / 86400)
        const hours = Math.floor((remSec % 86400) / 3600)
        const mins = Math.floor((remSec % 3600) / 60)
        if (remSec < 3600) return `${mins}m`
        if (days > 0) return `${days}d ${hours}h`
        return `${hours}h`
    })()
    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "100%" : "auto",
                maxWidth: isMobile ? 420 : "none",
                padding: isMobile ? "0 10px" : 0,
            }}
        >
            {/* v6 — Badge de cooldown bajado al BOTTOM del hexágono
               (Zak: dar protagonismo al Radar como primer elemento).
               bottom: -54 mobile / -62 desktop cuelga el pill justo
               debajo del SVG del radar dejando ~10-12px de aire.
               v5 — UNA SOLA LÍNEA: label + valor side-by-side.
               v2.7 — Sólo visible para miembros con Sintonía Solar
               activa. Invitados / no-suscriptores no ven el contador:
               para ellos el siguiente escaneo no está garantizado, y
               mostrar el countdown crearía falsa expectativa. */}
            {/* Offset bottom bumpeado 2026-05-13 (mobile -54→-92,
                desktop -62→-104) para darle aire entre el vértice
                ÓRBITA del hexágono y la pill del cooldown. Antes
                quedaba muy pegada al radar y se sentía apretada.
                Mismo cambio aplicado en escaner-app/EV_Radar. */}
            {cooldownLabel && isActiveMember && (
                <div
                    style={{
                        position: "absolute",
                        bottom: isMobile ? -92 : -104,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: isMobile ? "10px 20px" : "12px 26px",
                        borderRadius: 999,
                        background:
                            "linear-gradient(135deg,rgba(38,28,10,0.92) 0%,rgba(28,20,8,0.96) 100%)",
                        border: "1px solid rgba(232,198,90,0.5)",
                        boxShadow:
                            "0 0 24px rgba(232,198,90,0.28),inset 0 1px 0 rgba(255,220,140,0.2)",
                        zIndex: 5,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: 9.5,
                            fontWeight: 600,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            color: "rgba(255,233,168,0.85)",
                            fontFamily: "'Inter',sans-serif",
                            lineHeight: 1,
                        }}
                    >
                        Próximo Escaneo
                    </span>
                    <span
                        style={{
                            fontSize: isMobile ? 16 : 18,
                            fontWeight: 300,
                            letterSpacing: "0.06em",
                            color: GOLD,
                            fontFamily: "'Inter',sans-serif",
                            textShadow:
                                "0 0 14px rgba(232,198,90,0.45)",
                            lineHeight: 1,
                        }}
                    >
                        {cooldownLabel}
                    </span>
                </div>
            )}
            <svg
                width={isMobile ? "100%" : VB}
                height={isMobile ? "auto" : VB}
                viewBox={`0 0 ${VB} ${VB}`}
                style={{ overflow: "visible", aspectRatio: "1/1" }}
            >
                <defs>
                    <radialGradient id="erg">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.06" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </radialGradient>
                    <filter id="egl">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                    </filter>
                    {/* #4 — estela del paquete de telemetría (transparente
                        atrás → brillante en la cabeza). */}
                    <linearGradient
                        id="ev-pkt-tail"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                    >
                        <stop
                            offset="0%"
                            stopColor={accent}
                            stopOpacity="0"
                        />
                        <stop
                            offset="100%"
                            stopColor={accent}
                            stopOpacity="0.65"
                        />
                    </linearGradient>
                    {/* Estela dorada para los pilares ya escaneados (su
                        cometa de telemetría hereda el dorado del nodo). */}
                    <linearGradient
                        id="ev-pkt-tail-gold"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                    >
                        <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
                        <stop
                            offset="100%"
                            stopColor={GOLD}
                            stopOpacity="0.65"
                        />
                    </linearGradient>
                    {/* #1 El campo respira — gradiente del halo teñido por el
                        Índice de Luz (rojo / cyan / dorado). */}
                    <radialGradient id="breath-erg">
                        <stop
                            offset="0%"
                            stopColor={breath.color}
                            stopOpacity="0.5"
                        />
                        <stop
                            offset="55%"
                            stopColor={breath.color}
                            stopOpacity="0.12"
                        />
                        <stop
                            offset="100%"
                            stopColor={breath.color}
                            stopOpacity="0"
                        />
                    </radialGradient>
                </defs>
                <circle cx={cx} cy={cy} r={maxR * 1.15} fill="url(#erg)" />
                {/* #1 El campo respira contigo — halo del hexágono que LATE con
                    el tempo (lento si el Índice es alto) y el color del Índice
                    de Luz. CSS keyframe (compositor); el preview headless lo
                    congela → verificar en device. */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={maxR * 1.25}
                    fill="url(#breath-erg)"
                    style={{
                        transformOrigin: `${cx}px ${cy}px`,
                        animationName: "esc-breathe-aura",
                        animationDuration: `${breath.durSec.toFixed(2)}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        pointerEvents: "none",
                    }}
                />
                {/* Anillos orbitales con partículas rotando por CSS keyframes */}
                {(() => {
                    const r1 = maxR + (isMobile ? 16 : 18)
                    const r2 = maxR + (isMobile ? 30 : 36)
                    const TICKS = 36
                    const P1 = 4
                    const P2 = 2
                    return (
                        <g>
                            {/* #4 Telemetría viva — el anillo interior de
                                trazos GIRA lento (sus guiones reptan) y el
                                aro de ticks contra-rota más lento todavía:
                                el instrumento se siente vivo, escaneando, sin
                                marear (revoluciones de 80s y 150s). CSS
                                keyframes (compositor/GPU, perf 10K). */}
                            <g
                                style={{
                                    animation:
                                        "esc-ring2-rotate 80s linear infinite",
                                    transformOrigin: `${cx}px ${cy}px`,
                                }}
                            >
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={r1}
                                    fill="none"
                                    stroke={hx(accent, 0.4)}
                                    strokeWidth="0.9"
                                    strokeDasharray="4 7"
                                    style={{
                                        filter: `drop-shadow(0 0 4px ${hx(accent, 0.3)})`,
                                    }}
                                />
                            </g>
                            <circle
                                cx={cx}
                                cy={cy}
                                r={r2}
                                fill="none"
                                stroke={hx(accent, 0.25)}
                                strokeWidth="0.7"
                                style={{
                                    filter: `drop-shadow(0 0 3px ${hx(accent, 0.2)})`,
                                }}
                            />
                            <g
                                style={{
                                    animation:
                                        "esc-ring1-rotate 150s linear infinite",
                                    transformOrigin: `${cx}px ${cy}px`,
                                }}
                            >
                                {Array.from({ length: TICKS }).map((_, t) => {
                                    const ang = (t / TICKS) * Math.PI * 2
                                    const tickLen = t % 3 === 0 ? 4.5 : 2.2
                                    const r2a = r2 - tickLen / 2
                                    const r2b = r2 + tickLen / 2
                                    const x1 = cx + r2a * Math.cos(ang)
                                    const y1 = cy + r2a * Math.sin(ang)
                                    const x2 = cx + r2b * Math.cos(ang)
                                    const y2 = cy + r2b * Math.sin(ang)
                                    return (
                                        <line
                                            key={`tk${t}`}
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke={hx(accent, 0.22)}
                                            strokeWidth={t % 3 === 0 ? 0.7 : 0.4}
                                        />
                                    )
                                })}
                            </g>
                            <g
                                style={{
                                    animation:
                                        "esc-ring1-rotate 26s linear infinite",
                                    transformOrigin: `${cx}px ${cy}px`,
                                }}
                            >
                                {Array.from({ length: P1 }).map((_, p) => {
                                    const ang = (p / P1) * Math.PI * 2
                                    const px = cx + r1 * Math.cos(ang)
                                    const py = cy + r1 * Math.sin(ang)
                                    return (
                                        <circle
                                            key={`p1${p}`}
                                            cx={px}
                                            cy={py}
                                            r={1.8}
                                            fill={GOLD}
                                            opacity="0.85"
                                            style={{
                                                filter: `drop-shadow(0 0 3px ${hx(GOLD, 0.7)})`,
                                            }}
                                        />
                                    )
                                })}
                            </g>
                            <g
                                style={{
                                    animation:
                                        "esc-ring2-rotate 44s linear infinite",
                                    transformOrigin: `${cx}px ${cy}px`,
                                }}
                            >
                                {Array.from({ length: P2 }).map((_, p) => {
                                    const ang = (p / P2) * Math.PI * 2
                                    const px = cx + r2 * Math.cos(ang)
                                    const py = cy + r2 * Math.sin(ang)
                                    return (
                                        <circle
                                            key={`p2${p}`}
                                            cx={px}
                                            cy={py}
                                            r={1.4}
                                            fill={hx(accent, 0.9)}
                                            opacity="0.75"
                                            style={{
                                                filter: `drop-shadow(0 0 2.5px ${hx(accent, 0.8)})`,
                                            }}
                                        />
                                    )
                                })}
                            </g>
                        </g>
                    )
                })()}
                <path
                    d={oPoly}
                    fill="none"
                    stroke={hx(accent, 0.7)}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    style={{
                        animation:
                            "esc-diamond-breathe 4s ease-in-out infinite",
                        filter: `drop-shadow(0 0 8px ${hx(accent, 0.5)})`,
                    }}
                />
                {/* #4 Telemetría viva — un pulso de luz recorre el marco
                    hexagonal sin parar: el campo está energizado, no estático.
                    Copia del marco con un segmento corto (pathLength=1000) cuyo
                    dashoffset gira por CSS. */}
                <path
                    d={oPoly}
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1000}
                    strokeDasharray="24 976"
                    opacity={0.9}
                    style={{
                        filter: `drop-shadow(0 0 7px ${hx(accent, 0.95)})`,
                        animation: "esc-frame-sweep 5.5s linear infinite",
                    }}
                />
                {[25, 50, 75, 100].map((lv) => {
                    const ps = Array.from({ length: n }, (_, i) => pt(i, lv))
                    const isMainRing = lv === 100
                    const isMidRing = lv === 50
                    return (
                        <path
                            key={lv}
                            d={
                                ps
                                    .map(
                                        (p, i) =>
                                            `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`
                                    )
                                    .join(" ") + " Z"
                            }
                            fill="none"
                            stroke={
                                isMainRing
                                    ? hx(accent, 0.7)
                                    : isMidRing
                                      ? hx(accent, 0.32)
                                      : hx(accent, 0.18)
                            }
                            strokeWidth={isMainRing ? 2 : isMidRing ? 1.1 : 0.7}
                            strokeLinejoin="round"
                            style={{
                                filter: isMainRing
                                    ? `drop-shadow(0 0 6px ${hx(accent, 0.55)})`
                                    : isMidRing
                                      ? `drop-shadow(0 0 3px ${hx(accent, 0.3)})`
                                      : "none",
                            }}
                        />
                    )
                })}
                {PILLARS.map((_, i) => {
                    const [ex, ey] = pt(i, 100)
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={ex}
                            y2={ey}
                            stroke={hx(accent, 0.32)}
                            strokeWidth="1"
                            style={{
                                filter: `drop-shadow(0 0 2px ${hx(accent, 0.25)})`,
                            }}
                        />
                    )
                })}
                {/* #4 Telemetría viva — cada pilar transmite su señal al
                    núcleo: un paquete de luz viaja por cada radio del vértice
                    hacia el centro (Índice de Luz), escalonado. SMIL
                    animateMotion = nativo del navegador, sin costo de JS por
                    frame (clave para 10K tripulantes). */}
                {PILLARS.map((p, i) => {
                    const [ex, ey] = pt(i, 100)
                    const dur = 2.8
                    const begin = `${(-i * dur) / 6}s`
                    /* El cometa hereda el color del nodo: dorado si ese pilar
                       YA pasó a dorado (escaneado este ciclo), cyan si todavía
                       no. Así el stream refleja el progreso real en vivo. */
                    const isGold = cycleScanned.has(p.id)
                    const pc = isGold ? GOLD : accent
                    const tailRef = isGold
                        ? "url(#ev-pkt-tail-gold)"
                        : "url(#ev-pkt-tail)"
                    return (
                        <g key={`pkt${i}`} opacity={0}>
                            {/* estela: rect con gradiente que se orienta sola
                                por rotate="auto" del animateMotion (la cabeza
                                apunta al núcleo, la cola hacia el pilar). */}
                            <rect
                                x={-13}
                                y={-1}
                                width={13}
                                height={2}
                                rx={1}
                                fill={tailRef}
                            />
                            <circle
                                cx={0}
                                cy={0}
                                r={2.7}
                                fill={pc}
                                style={{
                                    filter: `drop-shadow(0 0 5px ${hx(pc, 0.95)})`,
                                }}
                            />
                            <animateMotion
                                dur={`${dur}s`}
                                begin={begin}
                                repeatCount="indefinite"
                                rotate="auto"
                                path={`M${ex},${ey} L${cx},${cy}`}
                            />
                            <animate
                                attributeName="opacity"
                                dur={`${dur}s`}
                                begin={begin}
                                repeatCount="indefinite"
                                values="0;0.9;0.9;0"
                                keyTimes="0;0.18;0.72;1"
                            />
                        </g>
                    )
                })}
                {oP.map(([vx, vy], i) => (
                    <circle
                        key={`vd${i}`}
                        cx={vx}
                        cy={vy}
                        r="3.5"
                        fill={hx(accent, 0.85)}
                        style={{
                            animation: `esc-vertex-pulse ${3 + i * 0.5}s ease-in-out infinite`,
                            filter: `drop-shadow(0 0 5px ${hx(accent, 0.7)})`,
                        }}
                    />
                ))}
                {has && (
                    <g>
                        <path
                            d={poly}
                            fill="none"
                            stroke={sc}
                            strokeWidth="2.5"
                            filter="url(#egl)"
                            opacity="0.4"
                        />
                        <path d={poly} fill={fc} />
                        <path
                            d={poly}
                            fill="none"
                            stroke={sc}
                            strokeWidth="2"
                            strokeLinejoin="round"
                        />
                    </g>
                )}
                {PILLARS.map((p, i) => {
                    const [nx, ny] = pt(i, 100),
                        val = scores[p.id],
                        done = val !== null
                    const scannable =
                            !isGlobalCooldown && !cycleScanned.has(p.id),
                        scannedNow = cycleScanned.has(p.id)
                    const nc = scannedNow
                        ? "rgba(212,168,67,0.95)"
                        : scannable
                          ? hx(accent, 0.9)
                          : done
                            ? hx(accent, 0.6)
                            : hx(accent, 0.7)
                    const ng = scannedNow
                        ? "esc-node-done"
                        : scannable
                          ? "esc-node-scannable"
                          : done
                            ? "esc-node-idle"
                            : "esc-node-idle"
                    const isH = hoverNode === p.id
                    const nodeR = isMobile
                        ? isH
                            ? 30
                            : scannedNow
                              ? 26
                              : 24
                        : isH
                          ? 24
                          : scannedNow
                            ? 20
                            : 18
                    const nodeFill = scannedNow
                        ? "rgba(212,168,67,0.1)"
                        : `rgba(0,229,255,0.12)`
                    const nodeSW = scannedNow ? 2.2 : isH ? 2.4 : 1.6
                    return (
                        <g
                            key={p.id}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => startH(p.id)}
                            onMouseLeave={endH}
                            onClick={(e) => {
                                /* #3 Resonancia táctil — onda desde el punto
                                   de contacto. Portaleada a body → sobrevive
                                   la transición a la Sonda. Dorada si el pilar
                                   ya está escaneado, cyan si es escaneable. */
                                fireTouchRipple(e.clientX, e.clientY, {
                                    color: scannedNow ? GOLD : accent,
                                    size: 180,
                                })
                                endH()
                                onNodeClick(p.id)
                            }}
                        >
                            <circle cx={nx} cy={ny} r="44" fill="transparent" />
                            {isH && hoverProgress > 0 && (
                                <circle
                                    cx={nx}
                                    cy={ny}
                                    r="26"
                                    fill="none"
                                    stroke={accent}
                                    strokeWidth="2"
                                    opacity="0.6"
                                    strokeDasharray={`${2 * Math.PI * 26}`}
                                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - hoverProgress)}`}
                                    transform={`rotate(-90 ${nx} ${ny})`}
                                    style={{
                                        filter: `drop-shadow(0 0 6px ${accent})`,
                                    }}
                                />
                            )}
                            <circle
                                cx={nx}
                                cy={ny}
                                r={nodeR}
                                fill={nodeFill}
                                stroke={nc}
                                strokeWidth={nodeSW}
                                style={{
                                    animation: `${ng} 3s ease-in-out infinite`,
                                    transition: "r 0.3s ease",
                                }}
                            />
                            <foreignObject
                                x={nx - 12}
                                y={ny - 12}
                                width="24"
                                height="24"
                                style={{
                                    pointerEvents: "none",
                                    color: nc,
                                    overflow: "visible",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 24,
                                        height: 24,
                                    }}
                                >
                                    {p.icon}
                                </div>
                            </foreignObject>
                        </g>
                    )
                })}
                {PILLARS.map((p, i) => {
                    const a = sa + i * as
                    const sinA = Math.sin(a)
                    const cosA = Math.cos(a)
                    const isTopBottom = Math.abs(sinA) > 0.9
                    let lx: number, ly: number
                    let anc: "start" | "middle" | "end"
                    if (isTopBottom) {
                        const lr = isMobile ? maxR + 72 : maxR + 70
                        lx = cx + lr * cosA
                        ly = cy + lr * sinA
                        anc = "middle"
                    } else {
                        const vx = cx + maxR * cosA
                        const vy = cy + maxR * sinA
                        const yPushTop = isMobile ? 64 : 68
                        const yPushBottom = isMobile ? 74 : 78
                        lx = vx
                        ly = sinA < 0 ? vy - yPushTop : vy + yPushBottom
                        anc = "middle"
                    }
                    const val = scores[p.id],
                        done = val !== null,
                        scNow = cycleScanned.has(p.id)
                    const mainColor = scNow
                        ? "rgba(212,168,67,0.9)"
                        : done
                          ? hx(accent, 0.85)
                          : "rgba(255,255,255,0.45)"
                    const subColor = scNow
                        ? "rgba(212,168,67,0.6)"
                        : done
                          ? hx(accent, 0.55)
                          : "rgba(255,255,255,0.2)"
                    return (
                        <g
                            key={`l${i}`}
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                                fireTouchRipple(e.clientX, e.clientY, {
                                    color: scNow ? GOLD : accent,
                                    size: 180,
                                })
                                onNodeClick(p.id)
                            }}
                        >
                            <text
                                x={lx}
                                y={ly + (isMobile ? 5 : 4)}
                                textAnchor={anc}
                                fontFamily="Inter,sans-serif"
                                letterSpacing={isMobile ? "0.04em" : "0.08em"}
                            >
                                <tspan
                                    fill={mainColor}
                                    fontSize={isMobile ? "18" : "14.4"}
                                    fontWeight="600"
                                >
                                    {p.labelShort}
                                </tspan>
                                {done ? (
                                    <tspan
                                        fill={subColor}
                                        fontSize={isMobile ? "15.6" : "13.2"}
                                        fontWeight="300"
                                        dx={isMobile ? "7" : "6"}
                                    >
                                        {val}%
                                    </tspan>
                                ) : (
                                    <tspan
                                        fill={subColor}
                                        fontSize={isMobile ? "15.6" : "13.2"}
                                        fontWeight="300"
                                        dx={isMobile ? "7" : "6"}
                                    >
                                        · · ·
                                    </tspan>
                                )}
                            </text>
                        </g>
                    )
                })}
                {ignitionPulse &&
                    (() => {
                        const pidx = PILLARS.findIndex(
                            (p) => p.id === ignitionPulse.pillar
                        )
                        if (pidx < 0) return null
                        const [tx, ty] = pt(pidx, 100)
                        return (
                            <g key={`ign-${ignitionPulse.ts}`}>
                                <line
                                    x1={cx}
                                    y1={cy}
                                    x2={cx}
                                    y2={cy}
                                    stroke={GOLD}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    style={{
                                        filter: `drop-shadow(0 0 8px ${hx(GOLD, 0.9)})`,
                                    }}
                                >
                                    <animate
                                        attributeName="x2"
                                        from={cx}
                                        to={tx}
                                        dur="0.55s"
                                        fill="freeze"
                                        calcMode="spline"
                                        keySplines="0.22 1 0.36 1"
                                    />
                                    <animate
                                        attributeName="y2"
                                        from={cy}
                                        to={ty}
                                        dur="0.55s"
                                        fill="freeze"
                                        calcMode="spline"
                                        keySplines="0.22 1 0.36 1"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="1;1;0"
                                        keyTimes="0;0.5;1"
                                        dur="1.1s"
                                        fill="freeze"
                                    />
                                </line>
                                <circle
                                    cx={tx}
                                    cy={ty}
                                    r="4"
                                    fill={GOLD}
                                    opacity="0"
                                    style={{
                                        filter: `drop-shadow(0 0 14px ${hx(GOLD, 0.9)})`,
                                    }}
                                >
                                    <animate
                                        attributeName="r"
                                        values="4;24;4"
                                        keyTimes="0;0.5;1"
                                        dur="0.9s"
                                        begin="0.55s"
                                        fill="freeze"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0;1;0"
                                        keyTimes="0;0.3;1"
                                        dur="0.9s"
                                        begin="0.55s"
                                        fill="freeze"
                                    />
                                </circle>
                            </g>
                        )
                    })()}
                {resonancePulseKey && resonancePulseKey > 0 && (
                    <g key={`res-${resonancePulseKey}`}>
                        <circle
                            cx={cx}
                            cy={cy}
                            r="0"
                            fill="none"
                            stroke={GOLD}
                            strokeWidth="2"
                            opacity="0.9"
                            style={{
                                filter: `drop-shadow(0 0 14px ${hx(GOLD, 0.8)})`,
                            }}
                        >
                            <animate
                                attributeName="r"
                                from="0"
                                to={maxR * 1.6}
                                dur="1.6s"
                                fill="freeze"
                                calcMode="spline"
                                keySplines="0.22 1 0.36 1"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.95;0.6;0"
                                keyTimes="0;0.4;1"
                                dur="1.6s"
                                fill="freeze"
                            />
                            <animate
                                attributeName="stroke-width"
                                values="2;3;0.5"
                                keyTimes="0;0.5;1"
                                dur="1.6s"
                                fill="freeze"
                            />
                        </circle>
                        <circle
                            cx={cx}
                            cy={cy}
                            r="0"
                            fill="none"
                            stroke={hx(GOLD, 0.6)}
                            strokeWidth="1"
                            opacity="0.6"
                        >
                            <animate
                                attributeName="r"
                                from="0"
                                to={maxR * 1.9}
                                dur="2s"
                                begin="0.2s"
                                fill="freeze"
                                calcMode="spline"
                                keySplines="0.22 1 0.36 1"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.6;0.3;0"
                                keyTimes="0;0.5;1"
                                dur="2s"
                                begin="0.2s"
                                fill="freeze"
                            />
                        </circle>
                    </g>
                )}
            </svg>
            {allDone && indice !== null && !suppressIndice && (
                <motion.div
                    ref={indiceRef}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: isMobile ? "42%" : "50%",
                        transform: "translate(-50%,-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                >
                    <span
                        style={{
                            fontSize: isMobile ? 46 : 58,
                            fontWeight: 100,
                            lineHeight: 1,
                            color:
                                indice < 40
                                    ? "rgba(255,120,120,0.92)"
                                    : indice < 70
                                      ? accent
                                      : GOLD,
                            fontFamily: "'Inter',sans-serif",
                            letterSpacing: "0.02em",
                            /* #4 Telemetría viva — el Índice de Luz late
                               sutil (breath de escala) además del glow. Dos
                               keyframes CSS sobre props distintas (transform
                               + text-shadow) → no chocan. */
                            /* inline-block para que el transform:scale del
                               breath aplique (transform no afecta a inline). */
                            display: "inline-block",
                            transformOrigin: "center",
                            animation:
                                "esc-number-glow 3s ease-in-out infinite, esc-indice-breath 4.6s ease-in-out infinite",
                        }}
                    >
                        {indice}
                    </span>
                    <span
                        style={{
                            fontSize: 8,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.32)",
                            fontFamily: "'Inter',sans-serif",
                            marginTop: 4,
                        }}
                    >
                        Índice de Luz
                    </span>
                </motion.div>
            )}
            {!allDone && loaded && (cc > 0 || showEmptyHint) && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        pointerEvents: "none",
                        textAlign: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 300,
                            letterSpacing: "0.1em",
                            fontFamily: "'Inter',sans-serif",
                            textTransform: "uppercase",
                            lineHeight: 1.6,
                            whiteSpace: "pre-line",
                            animation: "esc-hint-glow 4s ease-in-out infinite",
                        }}
                    >
                        {cc === 0
                            ? "Toca un nodo\npara iniciar"
                            : `${cc}/6 pilares`}
                    </span>
                </div>
            )}
        </div>
    )
}

/* ═══ CooldownView — timer minutos:segundos post-ciclo 6/6 ═══ */
function CooldownView({
    pillar,
    ts,
    accent,
    onBack,
}: {
    pillar: PillarCfg
    ts: number
    accent: string
    onBack: () => void
}) {
    const [now, setNow] = useState(Date.now())
    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(i)
    }, [])
    const elapsed = (now - ts) / 1000,
        rem = Math.max(0, COOLDOWN_SEC - Math.floor(elapsed)),
        d = Math.floor(rem / 86400),
        h = Math.floor((rem % 86400) / 3600),
        m = Math.floor((rem % 3600) / 60)
    if (rem <= 0) {
        onBack()
        return null
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                width: "100%",
                height: "calc(100vh - 160px)",
                padding: "0 20px",
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: hx(accent, 0.08),
                    border: `1px solid ${hx(accent, 0.2)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accent,
                }}
            >
                {pillar.icon}
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 300,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "'Inter',sans-serif",
                }}
            >
                {pillar.label}
            </p>
            <p
                style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "'Inter',sans-serif",
                    textAlign: "center",
                    lineHeight: 1.7,
                }}
            >
                Tu biología necesita tiempo para integrar.
                <br />
                Próxima recalibración en:
            </p>
            {/* v2.7 — Timer en días/horas/minutos. El COOLDOWN es de
                7 días (604800s); mostrar segundos no aporta información
                útil al tripulante — sí aporta saber cuántos días/horas
                quedan. */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 42,
                            fontWeight: 100,
                            color: accent,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {String(d).padStart(2, "0")}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.2)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                        }}
                    >
                        días
                    </span>
                </div>
                <span
                    style={{
                        fontSize: 32,
                        fontWeight: 100,
                        color: "rgba(255,255,255,0.1)",
                    }}
                >
                    :
                </span>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 42,
                            fontWeight: 100,
                            color: accent,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {String(h).padStart(2, "0")}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.2)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                        }}
                    >
                        horas
                    </span>
                </div>
                <span
                    style={{
                        fontSize: 32,
                        fontWeight: 100,
                        color: "rgba(255,255,255,0.1)",
                    }}
                >
                    :
                </span>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 42,
                            fontWeight: 100,
                            color: accent,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {String(m).padStart(2, "0")}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.2)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                        }}
                    >
                        min
                    </span>
                </div>
            </div>
            <button
                onClick={onBack}
                style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "12px 24px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                    outline: "none",
                    minHeight: 44,
                }}
            >
                <IBack /> Volver al Radar
            </button>
        </motion.div>
    )
}

/* Textura de grano fino (fractalNoise) para dar tacto premium a las tarjetas
   de respuesta. Se aplica como overlay de muy baja opacidad con blend. */
const SONDA_NOISE =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/* ═══ Sonda — formulario de telemetría con persistencia DB + ritual ═══ */
function Sonda(props: {
    pillar: PillarCfg
    accent: string
    onComplete: (s: number) => void
    onProcChange: (v: boolean) => void
    isMobile: boolean
    onBack?: () => void
    clerkUserId?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
    isAuthed?: boolean
    onUnauthedAttempt?: () => void
}) {
    const {
        pillar,
        accent,
        onComplete,
        onProcChange,
        isMobile,
        onBack,
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
        isAuthed = true,
        onUnauthedAttempt,
    } = props
    if (!pillar.questions || pillar.questions.length === 0)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    flex: 1,
                    minHeight: 400,
                    textAlign: "center",
                    padding: "0 20px",
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: hx(accent, 0.08),
                        border: `1px solid ${hx(accent, 0.2)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accent,
                    }}
                >
                    {pillar.icon}
                </div>
                <h2
                    style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 200,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    {pillar.label}
                </h2>
                <p
                    style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.8,
                    }}
                >
                    Este pilar aún no tiene sondas configuradas.
                </p>
            </motion.div>
        )
    const [cq, setCq] = useState(0),
        [ans, setAns] = useState<number[]>([]),
        [proc, setProc] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [readyToSeal, setReadyToSeal] = useState(false)
    const [finalScore, setFinalScore] = useState<number | null>(null)
    const pilarKey = pillar.id.toUpperCase()
    const q = pillar.questions[cq],
        tot = pillar.questions.length
    const resolveClerkUid = useCallback((): string => {
        if (clerkUserId) return clerkUserId
        if (typeof window !== "undefined") {
            return (window as any).Clerk?.user?.id || ""
        }
        return ""
    }, [clerkUserId])
    useEffect(() => {
        const uid = resolveClerkUid()
        if (!uid || !supabaseUrl || !supabaseAnonKey) {
            console.log(
                "[Sonda] hydrate SKIP — faltan props:",
                "clerk:",
                !!uid,
                "url:",
                !!supabaseUrl,
                "key:",
                !!supabaseAnonKey
            )
            /* v2.1 — Para el invitado mobile (sin uid) marcamos
               hydrated=true igual; queremos que vea la pregunta entera
               y los nav buttons. Bloqueamos la escritura aparte vía
               isAuthed/onUnauthedAttempt. */
            setHydrated(true)
            return
        }
        console.log(
            "[Sonda] hydrate START — pilar:",
            pilarKey,
            "clerk:",
            uid.slice(0, 16)
        )
        let cancelled = false
        ;(async () => {
            try {
                const result = await sbRpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_sonda_progress",
                    {
                        p_clerk_user_id: uid,
                        p_pilar: pilarKey,
                    }
                )
                if (cancelled) return
                if (Array.isArray(result) && result.length > 0) {
                    const row = result[0]
                    const savedCq = Math.max(
                        0,
                        Math.min(tot - 1, row.current_question ?? 0)
                    )
                    const rawAns = row.answers_json
                    const savedAns: number[] = Array.isArray(rawAns)
                        ? rawAns
                        : typeof rawAns === "string"
                          ? JSON.parse(rawAns || "[]")
                          : []
                    setCq(savedCq)
                    setAns(savedAns)
                }
            } catch (e) {
                console.warn("[Sonda] get_sonda_progress error:", e)
            } finally {
                if (!cancelled) setHydrated(true)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey, pilarKey, tot])

    const saveProgress = useCallback(
        async (newCq: number, newAns: number[]) => {
            const uid = resolveClerkUid()
            if (!uid || !supabaseUrl || !supabaseAnonKey) return
            try {
                await sbRpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "save_sonda_progress",
                    {
                        p_clerk_user_id: uid,
                        p_pilar: pilarKey,
                        p_current_question: newCq,
                        p_answers: newAns,
                    }
                )
            } catch (e) {
                console.error("[Sonda] save FAIL:", e)
            }
        },
        [resolveClerkUid, supabaseUrl, supabaseAnonKey, pilarKey]
    )
    const clearProgress = useCallback(() => {
        const uid = resolveClerkUid()
        if (!uid || !supabaseUrl || !supabaseAnonKey) return
        sbRpc(supabaseUrl, supabaseAnonKey, "clear_sonda_progress", {
            p_clerk_user_id: uid,
            p_pilar: pilarKey,
        }).catch((e) => console.warn("[Sonda] clear error:", e))
    }, [resolveClerkUid, supabaseUrl, supabaseAnonKey, pilarKey])

    const pick = (v: number) => {
        /* BAM — Sexta Densidad: si el invitado intenta escribir, en
           el instante exacto del primer toque levantamos el bottom
           sheet y NO mutamos state ni guardamos. Al anclarse vuelve
           con la misma sonda intacta, sin haber consumido el primer
           dato. */
        if (!isAuthed) {
            if (onUnauthedAttempt) onUnauthedAttempt()
            return
        }
        const na = [...ans]
        na[cq] = v
        setAns(na)
        if (cq < tot - 1) {
            const nextCq = cq + 1
            setCq(nextCq)
            saveProgress(nextCq, na)
        } else {
            saveProgress(cq, na)
            setReadyToSeal(true)
        }
    }
    const finalizeSeal = useCallback(() => {
        clearProgress()
        setReadyToSeal(false)
        setProc(true)
        onProcChange(true)
    }, [clearProgress, onProcChange])
    const goPrev = () => {
        if (cq > 0) {
            if (readyToSeal) setReadyToSeal(false)
            const nextCq = cq - 1
            setCq(nextCq)
            saveProgress(nextCq, ans)
        }
    }
    const goNext = () => {
        if (cq < tot - 1 && ans[cq] !== undefined) {
            const nextCq = cq + 1
            setCq(nextCq)
            saveProgress(nextCq, ans)
        }
    }
    const canGoNext = cq < tot - 1 && ans[cq] !== undefined
    const canGoPrev = cq > 0

    const processDone = useCallback(() => {
        const avg = Math.round(ans.reduce((s, x) => s + x, 0) / ans.length)
        setFinalScore(avg)
    }, [ans])
    const frecuenciaDone = useCallback(() => {
        if (finalScore === null) return
        onProcChange(false)
        onComplete(finalScore)
    }, [finalScore, onComplete, onProcChange])
    if (finalScore !== null)
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: isMobile
                        ? "calc(100vh - 200px)"
                        : "calc(100vh - 120px)",
                    minHeight: 500,
                }}
            >
                <FrecuenciaAnclada
                    score={finalScore}
                    accent={accent}
                    isMobile={isMobile}
                    onComplete={frecuenciaDone}
                />
            </div>
        )
    if (readyToSeal && hydrated)
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isMobile ? 26 : 36,
                    width: "100%",
                    maxWidth: 520,
                    minHeight: isMobile ? 420 : 540,
                    padding: isMobile ? "60px 24px" : "80px 40px",
                    textAlign: "center",
                }}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            width: isMobile ? 52 : 64,
                            height: isMobile ? 52 : 64,
                            borderRadius: 14,
                            background: hx(accent, 0.08),
                            border: `1px solid ${hx(accent, 0.22)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: accent,
                        }}
                    >
                        {pillar.icon}
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 11 : 13,
                            fontWeight: 300,
                            letterSpacing: "0.32em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.5)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        Ritual de Sellado
                    </p>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 16 : 20,
                            fontWeight: 300,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.9)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {pillar.label}
                    </h3>
                </motion.div>
                <HoldToTransmit
                    accent={accent}
                    isMobile={isMobile}
                    onComplete={finalizeSeal}
                />
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setReadyToSeal(false)}
                    style={{
                        padding: isMobile ? "8px 18px" : "10px 22px",
                        borderRadius: 14,
                        background: "transparent",
                        border: `1px solid ${hx(accent, 0.22)}`,
                        color: "rgba(255,255,255,0.55)",
                        fontSize: isMobile ? 10 : 11,
                        fontWeight: 400,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontFamily: "'Inter',sans-serif",
                        cursor: "pointer",
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                    aria-label="Revisar antes de sellar"
                >
                    <svg
                        width={11}
                        height={11}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Revisar antes de sellar
                </motion.button>
            </motion.div>
        )
    if (proc)
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: isMobile
                        ? "calc(100vh - 200px)"
                        : "calc(100vh - 120px)",
                    minHeight: 500,
                }}
            >
                <ProcessingAnim accent={accent} onComplete={processDone} />
            </div>
        )
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: 700,
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 14 : 24,
                /* Mobile padding-top suma safe-area-inset-top para que en
                   PWA standalone el título "Sonda: X" + el ícono no queden
                   bajo el reloj de iOS. Sin esto, con viewport-fit=cover
                   el lienzo arrancaba en y=0 (físico) y los 12px caían
                   dentro de la franja del notch. */
                padding: isMobile
                    ? "calc(12px + env(safe-area-inset-top, 0px)) 0 calc(env(safe-area-inset-bottom, 0px) + 12px)"
                    : "60px 0 40px",
                position: "relative",
            }}
        >
            {onBack && !isMobile && (
                <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onBack}
                    style={{
                        position: "absolute",
                        top: 14,
                        left: 24,
                        zIndex: 20,
                        width: 68,
                        height: 32,
                        borderRadius: 16,
                        background: `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hx(accent, 0.06)}`,
                        border: `1px solid ${hx(accent, 0.38)}`,
                        color: hx(accent, 0.95),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        cursor: "pointer",
                        outline: "none",
                        backdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                        WebkitBackdropFilter:
                            "blur(20px) saturate(160%) brightness(1.08)",
                        boxShadow: [
                            `0 4px 14px ${hx(accent, 0.14)}`,
                            `0 1px 4px rgba(0,0,0,0.3)`,
                            `inset 0 0 14px ${hx(accent, 0.08)}`,
                            `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                            `0 0 0 0.5px ${hx(accent, 0.12)}`,
                        ].join(", "),
                        WebkitTapHighlightColor: "transparent",
                    }}
                    aria-label="Volver al Radar"
                >
                    <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                </motion.button>
            )}
            {onBack &&
                isMobile &&
                typeof document !== "undefined" &&
                createPortal(
                    <motion.button
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={onBack}
                        style={{
                            position: "fixed",
                            /* Top respeta safe-area-inset-top para que en
                               PWA standalone iOS no quede detrás del
                               reloj/batería. Con viewport-fit=cover el
                               lienzo se extiende hasta el borde físico. */
                            top: "calc(14px + env(safe-area-inset-top, 0px))",
                            left: 14,
                            zIndex: 100,
                            width: 60,
                            height: 30,
                            borderRadius: 14,
                            background: `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hx(accent, 0.06)}`,
                            border: `1px solid ${hx(accent, 0.38)}`,
                            color: hx(accent, 0.95),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            outline: "none",
                            backdropFilter:
                                "blur(20px) saturate(160%) brightness(1.08)",
                            WebkitBackdropFilter:
                                "blur(20px) saturate(160%) brightness(1.08)",
                            boxShadow: [
                                `0 4px 14px ${hx(accent, 0.14)}`,
                                `0 1px 4px rgba(0,0,0,0.3)`,
                                `inset 0 0 14px ${hx(accent, 0.08)}`,
                                `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                                `0 0 0 0.5px ${hx(accent, 0.12)}`,
                            ].join(", "),
                            WebkitTapHighlightColor: "transparent",
                            padding: 0,
                        }}
                        aria-label="Volver al Radar"
                    >
                        <svg
                            width={14}
                            height={14}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </motion.button>,
                    document.body
                )}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: hx(accent, 0.08),
                        border: `1px solid ${hx(accent, 0.2)}`,
                        color: accent,
                        marginBottom: 10,
                    }}
                >
                    {pillar.icon}
                </div>
                <h2
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 16 : 22,
                        fontWeight: 300,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "#fff",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Sonda: {pillar.label}
                </h2>
                <p
                    style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Pregunta {cq + 1} de {tot}
                </p>
            </div>
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
                    animate={{ width: `${(cq / tot) * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        height: "100%",
                        borderRadius: 2,
                        background: `linear-gradient(90deg,${hx(accent, 0.4)},${accent})`,
                        boxShadow: `0 0 12px ${hx(accent, 0.6)}`,
                    }}
                />
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={cq}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? 8 : 16,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 15 : 19,
                            fontWeight: 300,
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.8)",
                            fontFamily: "'Inter',sans-serif",
                            textAlign: "center",
                            padding: isMobile ? "4px 0 8px" : "8px 0 12px",
                        }}
                    >
                        {q.text}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: isMobile ? 10 : 14,
                        }}
                    >
                        {q.options.map((o, oi) => {
                            const isSelected = ans[cq] === o.value
                            /* Partimos "Lead. Resto." → lead en negrita +
                               resto en peso normal (jerarquía premium). */
                            const m = o.label.match(/^([^.]+\.)\s*([\s\S]*)$/)
                            const lead = m ? m[1] : o.label
                            const rest = m ? m[2] : ""
                            const letter = String.fromCharCode(65 + oi)
                            return (
                                <motion.button
                                    key={oi}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: oi * 0.05,
                                        duration: 0.32,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={() => pick(o.value)}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 13,
                                        padding: isMobile
                                            ? "14px 15px"
                                            : "18px 20px",
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        background: isSelected
                                            ? `radial-gradient(130% 90% at 50% -12%, ${hx(accent, 0.22)}, transparent 58%), linear-gradient(135deg, ${hx(accent, 0.16)} 0%, rgba(6,16,32,0.62) 70%)`
                                            : `radial-gradient(130% 90% at 50% -12%, ${hx(accent, 0.09)}, transparent 56%), linear-gradient(135deg, rgba(12,26,48,0.6) 0%, rgba(4,10,24,0.78) 100%)`,
                                        border: isSelected
                                            ? `1.5px solid ${hx(accent, 0.7)}`
                                            : `1px solid ${hx(accent, 0.14)}`,
                                        color: isSelected
                                            ? "#FFFFFF"
                                            : "rgba(255,255,255,0.82)",
                                        fontFamily: "'Inter',sans-serif",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        outline: "none",
                                        minHeight: 54,
                                        WebkitTapHighlightColor: "transparent",
                                        boxShadow: isSelected
                                            ? `0 0 26px ${hx(accent, 0.22)}, inset 0 1px 0 ${hx("#FFFFFF", 0.08)}`
                                            : `0 4px 14px rgba(0,0,0,0.3), inset 0 1px 0 ${hx("#FFFFFF", 0.04)}`,
                                        backdropFilter: "blur(6px)",
                                        WebkitBackdropFilter: "blur(6px)",
                                        transition:
                                            "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease",
                                    }}
                                >
                                    {/* textura de grano fino */}
                                    <span
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "inherit",
                                            backgroundImage: SONDA_NOISE,
                                            backgroundSize: "160px 160px",
                                            opacity: isSelected ? 0.07 : 0.05,
                                            mixBlendMode: "soft-light",
                                            pointerEvents: "none",
                                            zIndex: 0,
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                            flexShrink: 0,
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: `1.5px solid ${isSelected ? accent : hx(accent, 0.35)}`,
                                            background: isSelected
                                                ? accent
                                                : "transparent",
                                            color: isSelected
                                                ? "#04101F"
                                                : hx(accent, 0.8),
                                            fontSize: 12,
                                            fontWeight: 700,
                                            fontFamily:
                                                "'JetBrains Mono',monospace",
                                            boxShadow: isSelected
                                                ? `0 0 12px ${hx(accent, 0.6)}`
                                                : "none",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {isSelected ? (
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#04101F"
                                                strokeWidth="3.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            letter
                                        )}
                                    </span>
                                    <span
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: isMobile ? 14 : 16,
                                            fontWeight: 300,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <strong
                                            style={{
                                                fontWeight: 600,
                                                color: isSelected
                                                    ? "#FFFFFF"
                                                    : "rgba(255,255,255,0.95)",
                                            }}
                                        >
                                            {lead}
                                        </strong>
                                        {rest ? " " + rest : ""}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>
            {hydrated && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginTop: isMobile ? "auto" : 20,
                        padding: isMobile ? "0 4px" : "0 8px",
                    }}
                >
                    <motion.button
                        whileTap={{ scale: canGoPrev ? 0.95 : 1 }}
                        onClick={goPrev}
                        disabled={!canGoPrev}
                        aria-label="Pregunta anterior"
                        style={{
                            padding: isMobile ? "9px 16px" : "10px 20px",
                            borderRadius: isMobile ? 14 : 16,
                            background: canGoPrev
                                ? `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hx(accent, 0.06)}`
                                : "rgba(255,255,255,0.02)",
                            border: canGoPrev
                                ? `1px solid ${hx(accent, 0.38)}`
                                : "1px solid rgba(255,255,255,0.06)",
                            color: canGoPrev
                                ? hx(accent, 0.95)
                                : "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: canGoPrev ? "pointer" : "default",
                            outline: "none",
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 400,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter',sans-serif",
                            backdropFilter: canGoPrev
                                ? "blur(20px) saturate(160%) brightness(1.08)"
                                : "none",
                            WebkitBackdropFilter: canGoPrev
                                ? "blur(20px) saturate(160%) brightness(1.08)"
                                : "none",
                            boxShadow: canGoPrev
                                ? [
                                      `0 4px 14px ${hx(accent, 0.14)}`,
                                      `0 1px 4px rgba(0,0,0,0.3)`,
                                      `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                                  ].join(", ")
                                : "none",
                            WebkitTapHighlightColor: "transparent",
                            transition:
                                "opacity 0.2s ease, background 0.25s ease",
                            opacity: canGoPrev ? 1 : 0.4,
                        }}
                    >
                        <svg
                            width={12}
                            height={12}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Anterior</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: canGoNext ? 0.95 : 1 }}
                        onClick={goNext}
                        disabled={!canGoNext}
                        aria-label="Pregunta siguiente"
                        style={{
                            padding: isMobile ? "9px 16px" : "10px 20px",
                            borderRadius: isMobile ? 14 : 16,
                            background: canGoNext
                                ? `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hx(accent, 0.06)}`
                                : "rgba(255,255,255,0.02)",
                            border: canGoNext
                                ? `1px solid ${hx(accent, 0.38)}`
                                : "1px solid rgba(255,255,255,0.06)",
                            color: canGoNext
                                ? hx(accent, 0.95)
                                : "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: canGoNext ? "pointer" : "default",
                            outline: "none",
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 400,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter',sans-serif",
                            backdropFilter: canGoNext
                                ? "blur(20px) saturate(160%) brightness(1.08)"
                                : "none",
                            WebkitBackdropFilter: canGoNext
                                ? "blur(20px) saturate(160%) brightness(1.08)"
                                : "none",
                            boxShadow: canGoNext
                                ? [
                                      `0 4px 14px ${hx(accent, 0.14)}`,
                                      `0 1px 4px rgba(0,0,0,0.3)`,
                                      `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                                  ].join(", ")
                                : "none",
                            WebkitTapHighlightColor: "transparent",
                            transition:
                                "opacity 0.2s ease, background 0.25s ease",
                            opacity: canGoNext ? 1 : 0.4,
                        }}
                    >
                        <span>Siguiente</span>
                        <svg
                            width={12}
                            height={12}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </motion.button>
                </div>
            )}
        </motion.div>
    )
}

/* ═══ NodoCeroCeremony — modal Sexta Densidad de superconductividad ═══ */
function NodoCeroCeremony({ onClose }: { onClose: () => void }) {
    const particles = Array.from({ length: 20 }, () => ({
        x: 30 + Math.random() * 40,
        delay: Math.random() * 3,
        dur: 2 + Math.random() * 2,
        size: 2 + Math.random() * 3,
    }))
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483647,
                background: "rgba(0,0,0,0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 32,
                fontFamily: "'Inter',sans-serif",
                overflow: "hidden",
                padding: "0 24px",
            }}
        >
            {particles.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        bottom: "30%",
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: GOLD,
                        animation: `esc-particle-rise ${p.dur}s ease-out ${p.delay}s infinite`,
                        opacity: 0,
                    }}
                />
            ))}
            <div
                style={{
                    position: "relative",
                    width: 160,
                    height: 160,
                    animation: "esc-gold-glow 4s ease-in-out infinite",
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ position: "absolute", inset: 0 }}
                >
                    <svg viewBox="0 0 160 160" width="160" height="160">
                        <polygon
                            points="80,5 155,40 155,120 80,155 5,120 5,40"
                            fill="none"
                            stroke={GOLD}
                            strokeWidth="1"
                            opacity="0.4"
                        />
                    </svg>
                </motion.div>
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: GOLD,
                        boxShadow: `0 0 30px ${GOLD}`,
                    }}
                />
            </div>
            <div style={{ textAlign: "center" }}>
                <p
                    style={{
                        margin: "0 0 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                    }}
                >
                    Transmisión del Domo
                </p>
                <h1
                    style={{
                        margin: 0,
                        fontSize: 32,
                        fontWeight: 100,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: GOLD,
                    }}
                >
                    Estado Cero
                </h1>
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 300,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.4)",
                    textAlign: "center",
                    maxWidth: 400,
                }}
            >
                Tu Índice de Luz ha sostenido superconductividad durante 12
                ciclos. Eres un{" "}
                <span style={{ color: GOLD, fontWeight: 500 }}>Nodo Cero</span>.
            </p>
            <button
                onClick={onClose}
                style={{
                    padding: "12px 28px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                    outline: "none",
                    minHeight: 44,
                }}
            >
                Cerrar Transmisión
            </button>
        </motion.div>
    )
}

function EVRadar(): React.ReactNode {
    return null
}
const RadarPack = Object.assign(EVRadar, {
    PILLARS,
    Radar,
    Sonda,
    CooldownView,
    NodoCeroCeremony,
    ProcessingAnim,
    HoldToTransmit,
    FrecuenciaAnclada,
})
export default RadarPack
