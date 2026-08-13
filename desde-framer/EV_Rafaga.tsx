// EV_Rafaga.tsx v1.0 — 🜂 MODO RÁFAGA · ALTO RENDIMIENTO (Zak 2026-08-09).
//
// Un modo ALTERNO del Espejo, solo en escritorio y solo si se pide. No cambia
// nada del comportamiento por defecto: se enciende con su interruptor y se
// apaga con Esc.
//
// LA TESIS. El cuello de botella entre una persona y un sistema no es el
// sistema: es que hablamos a ~150 palabras por minuto y leemos en una sola
// línea de tiempo. Este modo ataca los dos lados:
//   · SALIDA (Fase RÁFAGA): dictado externo a hiper-velocidad, la app solo
//     cronometra y devuelve las palabras por minuto REALES.
//   · ENTRADA (Fase MATRIZ): la respuesta deja de ser una columna que se lee
//     de arriba a abajo y se vuelve dos superficies simultáneas, texto a la
//     derecha y topología a la izquierda, ancladas entre sí.
//
// TRES DECISIONES QUE NO SON OBVIAS Y VALE DEJAR ESCRITAS:
//
// 1. LOS SILENCIOS SE DESCUENTAN EN VIVO, no recortando el audio al final.
//    Grabar y después podar los extremos deja adentro las pausas del medio,
//    que son justo las que inflan la métrica. Acá se mide la energía del
//    micrófono cuadro a cuadro y solo se acumula el tiempo con voz, con un
//    piso de ruido calibrado con el ambiente real de los primeros instantes.
//    Además nunca se guarda audio: se mide y se descarta.
//
// 2. EL COLOR NO ES ARCOÍRIS. Codificar conceptos con tonos de todo el
//    espectro obliga a discriminar matiz, que es lento y cansa. La paleta
//    viaja por una sola rampa de la casa (cian → verde → dorado) y lo que
//    de verdad separa un concepto de otro es la LUMINANCIA. Y el número de
//    colores vivos se capa en 9, que es donde la memoria de trabajo deja de
//    seguir el rastro.
//
// 3. AL SEÑALAR, SE APAGA EL RESTO en vez de encender el objetivo. Bajar lo
//    que no importa cambia menos la luminancia total de la pantalla que subir
//    lo que sí, y el ojo no tiene que readaptarse en cada gesto.
//
// La geometría no es decorativa: los nodos se colocan sobre una espiral de
// ángulo áureo (137.5°), que es la única distribución que reparte N puntos en
// un disco sin apelmazarlos ni dejar huecos. Sale sola de la fórmula.

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { useT } from "../../i18n"
import { LDS } from "../../lib/theme"

/* ═══════════════════════════════════════════════════════════════════
   PALETA — una rampa, no un arcoíris (ver decisión 2 del encabezado).
   ═══════════════════════════════════════════════════════════════════ */

/** Negro de trabajo. NO es #000 puro: blanco sobre negro absoluto produce
    halación (el texto sangra sobre el fondo) y es la combinación más cansada
    que existe para leer largo. Un negro con un punto de azul y un texto que
    no llega a blanco bajan la fatiga sin perder el drama. */
const FONDO = "#04060C"
const TINTA = "#C6D4E8"
const TINTA_TENUE = "rgba(198,212,232,0.52)"
const CIAN = "#00E5FF"
const ORO = "#D4A843"

/** Tope de colores vivos a la vez. Más allá de esto el rastreo se rompe y
    la matriz se lee como ruido en vez de como estructura. */
const MAX_NODOS = 9

/** Hue de la rampa de la casa: cian (188) a dorado (43), pasando por verde.
    `t` va de 0 (concepto más fuerte) a 1 (más débil). */
function colorConcepto(t: number, light: boolean): string {
    const hue = 188 + (43 - 188) * t
    const sat = light ? 62 - 10 * t : 72 - 14 * t
    const lum = light ? 38 + 8 * t : 70 - 14 * t
    return `hsl(${hue.toFixed(1)}, ${sat.toFixed(0)}%, ${lum.toFixed(0)}%)`
}

/* ═══════════════════════════════════════════════════════════════════
   MOTOR SEMÁNTICO — puro, sin React, sin red y sin costo.
   ═══════════════════════════════════════════════════════════════════
   La firma se calcula EN EL APARATO a partir del propio texto. Pedírsela a
   un modelo costaría dinero y segundos justo en el momento en que el modo
   promete lo contrario; y además nos dejaría sin control del anclaje, que es
   lo único que hace que las dos superficies se lean como una sola. */

const VACIAS = new Set(
    (
        "el la los las un una unos unas de del al a ante bajo con contra desde " +
        "durante en entre hacia hasta mediante para por segun sin sobre tras y " +
        "e ni o u pero mas sino que quien cual cuyo como cuando donde porque " +
        "pues si no se lo le les me te nos os mi tu su sus mis tus nuestro " +
        "vuestro este esta estos estas ese esa esos esas aquel aquella yo " +
        "ella ellos ellas usted ustedes ser estar haber tener hacer poder " +
        "decir ir ver dar saber querer llegar pasar deber poner parecer " +
        "quedar creer hablar llevar dejar seguir encontrar es son era eran " +
        "fue fueron sera seran hay habia tiene tienen tenia muy mas menos " +
        "tan tanto poco mucho todo toda todos todas cada otro otra otros " +
        "otras mismo misma ya aun tambien solo asi bien mal ahora antes " +
        "despues siempre nunca jamas entonces luego aqui alli ahi eso esto " +
        "aquello algo nada alguien nadie cosa cosas vez veces the of and to " +
        "in is are was were be been being have has had do does did will " +
        "would can could should may might must this that these those with " +
        "from for about into over under then than there their they them it " +
        "its his her our your you what which who whom whose when where why " +
        "how all any both each few more most other some such only own same " +
        "so too very just now also even still yet ever never one two three"
    ).split(" ")
)

/** Quita acentos para comparar, sin tocar lo que se muestra. */
function pelar(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export interface NodoFirma {
    /** Llave estable, sin acentos ni mayúsculas. */
    id: string
    /** Forma que se muestra: la aparición más frecuente en el texto. */
    rotulo: string
    /** Peso relativo, 0 a 1. */
    peso: number
    /** Índices de los bloques donde vive. */
    bloques: number[]
    /** Posición en el disco, coordenadas normalizadas -1 a 1. */
    x: number
    y: number
    color: string
}

export interface AristaFirma {
    a: string
    b: string
    /** Cuántos bloques comparten. */
    fuerza: number
}

export interface Firma {
    nodos: NodoFirma[]
    aristas: AristaFirma[]
    bloques: string[]
}

/** Ángulo áureo en radianes: la distribución que reparte N puntos en un disco
    sin apelmazarlos. Es la misma que usa un girasol para colocar sus semillas;
    no se eligió por estética, es la única que no deja huecos ni cúmulos. */
const ANGULO_AUREO = Math.PI * (3 - Math.sqrt(5))

export function firmaSemantica(texto: string, light = false): Firma {
    const bloques = texto
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
    if (bloques.length === 0) return { nodos: [], aristas: [], bloques: [] }

    /* Conteo por concepto: en cuántos bloques aparece (extensión) y cuántas
       veces en total (insistencia). La EXTENSIÓN pesa más: una palabra que
       cruza tres párrafos es estructura; una que se repite cinco veces en uno
       solo puede ser un tic de redacción. */
    const total = new Map<string, number>()
    const enBloques = new Map<string, Set<number>>()
    const superficie = new Map<string, Map<string, number>>()

    bloques.forEach((bloque, i) => {
        const crudas = bloque.match(/[\p{L}\p{M}]{3,}/gu) || []
        for (const cruda of crudas) {
            const llave = pelar(cruda)
            if (llave.length < 4) continue
            if (VACIAS.has(llave)) continue
            total.set(llave, (total.get(llave) || 0) + 1)
            if (!enBloques.has(llave)) enBloques.set(llave, new Set())
            enBloques.get(llave)!.add(i)
            if (!superficie.has(llave)) superficie.set(llave, new Map())
            const m = superficie.get(llave)!
            m.set(cruda, (m.get(cruda) || 0) + 1)
        }
    })

    const puntuados = Array.from(total.entries())
        .map(([llave, veces]) => {
            const extension = enBloques.get(llave)!.size
            /* Extensión al cuadrado sobre insistencia lineal, más un empujón
               leve por longitud: las palabras largas cargan más significado
               por carácter que las cortas. */
            const puntaje =
                extension * extension * 1.9 +
                veces +
                Math.min(4, llave.length - 4) * 0.35
            return { llave, puntaje, extension, veces }
        })
        .filter((p) => p.extension > 1 || p.veces > 1)
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, MAX_NODOS)

    /* Si el texto es corto y nada se repite, se admite lo más largo para no
       devolver una matriz vacía: mejor poca estructura que ninguna. */
    if (puntuados.length === 0) {
        const sueltos = Array.from(total.entries())
            .sort((a, b) => b[0].length - a[0].length)
            .slice(0, Math.min(5, MAX_NODOS))
        for (const [llave, veces] of sueltos) {
            puntuados.push({
                llave,
                puntaje: veces,
                extension: enBloques.get(llave)?.size || 1,
                veces,
            })
        }
    }

    const maxPuntaje = puntuados[0]?.puntaje || 1
    const n = puntuados.length

    const nodos: NodoFirma[] = puntuados.map((p, i) => {
        const angulo = i * ANGULO_AUREO
        /* Raíz cuadrada del índice: es lo que mantiene la densidad constante
           del centro al borde. Sin ella el centro se apelmaza. */
        const radio = Math.sqrt((i + 0.62) / n) * 0.86
        const surf = superficie.get(p.llave)!
        let rotulo = p.llave
        let mejor = -1
        surf.forEach((c, forma) => {
            if (c > mejor) {
                mejor = c
                rotulo = forma
            }
        })
        return {
            id: p.llave,
            rotulo: rotulo.toLowerCase(),
            peso: p.puntaje / maxPuntaje,
            bloques: Array.from(enBloques.get(p.llave) || []).sort(
                (a, b) => a - b
            ),
            x: Math.cos(angulo) * radio,
            y: Math.sin(angulo) * radio,
            color: colorConcepto(n === 1 ? 0 : i / (n - 1), light),
        }
    })

    /* La topología ES la co-ocurrencia: dos ideas que viven en el mismo
       párrafo están conectadas en el texto, y verlo dibujado ahorra releer
       para descubrirlo.

       🜂 PERO SE PODA. Medido con un reflejo real de cuatro párrafos: unir
       todo par que comparte un bloque daba 23 aristas para 9 nodos (el techo
       son 36), porque los dos conceptos centrales cruzaban los cuatro
       párrafos y por lo tanto tocaban a todos. Eso no es una estructura, es
       una maraña: el ojo no puede seguir 23 líneas y la topología deja de
       informar. Se queda el ESQUELETO: cada nodo conserva sus dos vínculos
       más fuertes, y la unión de todos ellos es el grafo. Un nodo periférico
       nunca queda huérfano (siempre aporta los suyos) y el centro deja de
       ser un abanico ilegible. */
    const candidatas: AristaFirma[] = []
    for (let i = 0; i < nodos.length; i++) {
        for (let j = i + 1; j < nodos.length; j++) {
            const a = new Set(nodos[i].bloques)
            const comunes = nodos[j].bloques.filter((b) => a.has(b)).length
            if (comunes > 0)
                candidatas.push({
                    a: nodos[i].id,
                    b: nodos[j].id,
                    fuerza: comunes,
                })
        }
    }
    const pesoDe = new Map(nodos.map((n) => [n.id, n.peso]))
    const guardadas = new Set<string>()
    for (const nodo of nodos) {
        candidatas
            .filter((c) => c.a === nodo.id || c.b === nodo.id)
            .sort((x, y) => {
                if (y.fuerza !== x.fuerza) return y.fuerza - x.fuerza
                /* A igual co-ocurrencia gana el vínculo con el concepto más
                   pesado: si hay que elegir, se conserva el que estructura. */
                const otroX = x.a === nodo.id ? x.b : x.a
                const otroY = y.a === nodo.id ? y.b : y.a
                return (pesoDe.get(otroY) || 0) - (pesoDe.get(otroX) || 0)
            })
            .slice(0, 2)
            .forEach((c) => guardadas.add(`${c.a}|${c.b}`))
    }
    const aristas = candidatas.filter((c) => guardadas.has(`${c.a}|${c.b}`))

    return { nodos, aristas, bloques }
}

/** Cuenta palabras de verdad: números y signos sueltos no cuentan. */
export function contarPalabras(texto: string): number {
    const m = texto.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)
    return m ? m.length : 0
}

/* ═══════════════════════════════════════════════════════════════════
   MEDIDOR — el micrófono como cronómetro, nunca como grabadora.
   ═══════════════════════════════════════════════════════════════════ */

interface Medida {
    /** Segundos de reloj, de principio a fin. */
    brutos: number
    /** Segundos CON VOZ, descontando silencios (los del medio también). */
    netos: number
    /** Amplitud actual 0 a 1, para que el círculo respire con la voz. */
    nivel: number
    /** El micrófono no se pudo abrir: se mide por reloj y se dice en pantalla. */
    sinMic: boolean
}

const MEDIDA_CERO: Medida = { brutos: 0, netos: 0, nivel: 0, sinMic: false }

function useMedidor() {
    const [estado, setEstado] = useState<Medida>(MEDIDA_CERO)
    const [activo, setActivo] = useState(false)
    const ref = useRef<{
        ctx: AudioContext | null
        stream: MediaStream | null
        rafId: number | null
        t0: number
        netos: number
        ultimo: number
        piso: number
        muestrasPiso: number[]
    }>({
        ctx: null,
        stream: null,
        rafId: null,
        t0: 0,
        netos: 0,
        ultimo: 0,
        piso: 0,
        muestrasPiso: [],
    })

    const parar = useCallback(() => {
        const r = ref.current
        if (r.rafId != null) cancelAnimationFrame(r.rafId)
        r.rafId = null
        try {
            r.stream?.getTracks().forEach((t) => t.stop())
        } catch {}
        try {
            void r.ctx?.close()
        } catch {}
        r.stream = null
        r.ctx = null
        setActivo(false)
    }, [])

    const arrancar = useCallback(async () => {
        const r = ref.current
        r.t0 = performance.now()
        r.netos = 0
        r.ultimo = r.t0
        r.piso = 0
        r.muestrasPiso = []
        setEstado({ ...MEDIDA_CERO })
        setActivo(true)

        let stream: MediaStream | null = null
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            })
        } catch {
            /* 🜂 Sin micrófono el modo NO se cae: se cronometra por reloj y la
               pantalla lo DICE, para que un número inflado por los silencios
               no se lea como una marca real. */
            const tick = () => {
                const ahora = performance.now()
                const brutos = (ahora - r.t0) / 1000
                setEstado({ brutos, netos: brutos, nivel: 0, sinMic: true })
                r.rafId = requestAnimationFrame(tick)
            }
            r.rafId = requestAnimationFrame(tick)
            return
        }

        const Ctx: typeof AudioContext =
            (window as any).AudioContext || (window as any).webkitAudioContext
        const ctx = new Ctx()
        const fuente = ctx.createMediaStreamSource(stream)
        const analizador = ctx.createAnalyser()
        /* Ventana corta: la envolvente de la voz importa, el espectro no. */
        analizador.fftSize = 1024
        analizador.smoothingTimeConstant = 0.55
        fuente.connect(analizador)
        /* Nada se conecta al destino: no se reproduce, no se graba, no se
           guarda. El micrófono acá es un cronómetro. */
        r.ctx = ctx
        r.stream = stream

        const buffer = new Float32Array(analizador.fftSize)

        const tick = () => {
            const ahora = performance.now()
            const dt = (ahora - r.ultimo) / 1000
            r.ultimo = ahora
            analizador.getFloatTimeDomainData(buffer)
            let suma = 0
            for (let i = 0; i < buffer.length; i++)
                suma += buffer[i] * buffer[i]
            const rms = Math.sqrt(suma / buffer.length)

            /* Los primeros ~450 ms calibran el ruido del cuarto. Un umbral fijo
               falla en las dos direcciones: en un estudio silencioso corta voz
               baja, y con un ventilador cuenta el ventilador como voz. */
            const transcurrido = (ahora - r.t0) / 1000
            if (transcurrido < 0.45) {
                r.muestrasPiso.push(rms)
            } else if (r.piso === 0) {
                const ord = [...r.muestrasPiso].sort((a, b) => a - b)
                const mediana = ord[Math.floor(ord.length / 2)] || 0
                r.piso = Math.max(mediana * 3.2, 0.006)
            }

            if (r.piso > 0 && rms > r.piso) r.netos += dt

            setEstado({
                brutos: transcurrido,
                netos: r.netos,
                /* Escala perceptual, no lineal: el oído es logarítmico y un
                   círculo que reacciona en lineal se ve muerto al hablar bajo. */
                nivel: Math.min(1, Math.pow(rms / 0.22, 0.55)),
                sinMic: false,
            })
            r.rafId = requestAnimationFrame(tick)
        }
        r.rafId = requestAnimationFrame(tick)
    }, [])

    useEffect(() => () => parar(), [parar])

    return { estado, activo, arrancar, parar }
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL IZQUIERDO — la topología.
   ═══════════════════════════════════════════════════════════════════ */

function Topologia({
    firma,
    activo,
    onActivar,
    light,
    reducido,
}: {
    firma: Firma
    activo: string | null
    onActivar: (id: string | null) => void
    light: boolean
    reducido: boolean
}) {
    const R = 300
    const cx = R
    const cy = R
    const px = (v: number) => cx + v * (R - 46)
    const py = (v: number) => cy + v * (R - 46)

    return (
        <svg
            viewBox={`0 0 ${R * 2} ${R * 2}`}
            /* `meet` centra y escala por el lado corto: nada se desborda sobre
               el panel del texto y el disco se ve entero en cualquier ventana.
               Los rótulos caben dentro del viewBox por construcción (el radio
               máximo llega a 554 y la etiqueta más baja a ~591 de 600). */
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
            role="img"
        >
            <defs>
                <radialGradient id="rafaga-centro">
                    <stop
                        offset="0%"
                        stopColor={light ? LDS.accent : CIAN}
                        stopOpacity={light ? 0.12 : 0.16}
                    />
                    <stop offset="100%" stopColor={CIAN} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Geometría de fondo: anillos concéntricos y radios. Da el marco
                espacial contra el que el ojo mide distancias; sin él los nodos
                flotan y las posiciones no significan nada. Muy tenue a
                propósito: es una regla, no un dibujo. */}
            <circle cx={cx} cy={cy} r={R - 40} fill="url(#rafaga-centro)" />
            {[0.32, 0.58, 0.84].map((f) => (
                <circle
                    key={f}
                    cx={cx}
                    cy={cy}
                    r={(R - 46) * f}
                    fill="none"
                    stroke={light ? LDS.hairline : "rgba(120,180,220,0.09)"}
                    strokeWidth="1"
                />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + Math.cos(a) * (R - 46)}
                        y2={cy + Math.sin(a) * (R - 46)}
                        stroke={
                            light ? LDS.hairline : "rgba(120,180,220,0.055)"
                        }
                        strokeWidth="1"
                    />
                )
            })}

            {/* 🜂 EL SEÑALADO VA POR CSS, NO POR framer-motion. El vínculo
                entre las dos superficies es LA promesa del modo, y una
                animación por cuadro (rAF) se detiene cuando el navegador
                decide ahorrar. Medido: con el reloj de animación detenido, el
                texto sí se atenuaba (transición CSS) y los nodos NO se movían
                un ápice. Una transición CSS la resuelve el compositor y no
                depende de que nadie corra un cuadro. La entrada escalonada
                sigue siendo framer-motion porque eso sí es adorno. */}
            {firma.aristas.map((ar) => {
                const na = firma.nodos.find((n) => n.id === ar.a)!
                const nb = firma.nodos.find((n) => n.id === ar.b)!
                const tocada = activo === ar.a || activo === ar.b
                const apagada = activo != null && !tocada
                return (
                    <line
                        key={`${ar.a}-${ar.b}`}
                        x1={px(na.x)}
                        y1={py(na.y)}
                        x2={px(nb.x)}
                        y2={py(nb.y)}
                        stroke={
                            tocada ? na.color : light ? "#8FA6C4" : "#5C7EA6"
                        }
                        strokeWidth={0.7 + ar.fuerza * 0.5}
                        style={{
                            opacity: apagada ? 0.06 : tocada ? 0.75 : 0.22,
                            transition: reducido
                                ? "none"
                                : "opacity 0.2s ease, stroke 0.2s ease",
                        }}
                    />
                )
            })}

            {firma.nodos.map((nodo, i) => {
                const tocado = activo === nodo.id
                const apagado = activo != null && !tocado
                const r = 7 + nodo.peso * 15
                return (
                    /* DOS CAPAS a propósito. La de fuera solo hace la entrada
                       escalonada; la de dentro lleva el estado de señalado.
                       Si compartieran elemento, la animación de entrada con
                       `fill-mode: both` ganaría en la cascada sobre la opacidad
                       normal y el nodo NUNCA podría atenuarse: el vínculo
                       quedaría muerto justo después de verse nacer. */
                    <g
                        key={nodo.id}
                        style={{
                            /* Entran por jerarquía, del más fuerte al más
                               débil: el orden de aparición enseña el peso
                               relativo sin escribir un solo número. */
                            animation: reducido
                                ? "none"
                                : `rafagaEntra 0.42s cubic-bezier(0.16,1,0.3,1) ${(
                                      i * 0.028
                                  ).toFixed(3)}s both`,
                        }}
                    >
                        <g
                            style={{
                                cursor: "pointer",
                                /* Se apaga lo que NO importa en vez de encender lo
                               que sí: menos cambio de luminancia total en la
                               pantalla, menos readaptación del ojo por gesto. */
                                opacity: apagado ? 0.2 : 1,
                                transform: tocado ? "scale(1.16)" : "scale(1)",
                                transformBox: "fill-box",
                                transformOrigin: "center",
                                transition: reducido
                                    ? "none"
                                    : "opacity 0.2s ease, transform 0.24s cubic-bezier(0.16,1,0.3,1)",
                            }}
                            onMouseEnter={() => onActivar(nodo.id)}
                            onMouseLeave={() => onActivar(null)}
                            onFocus={() => onActivar(nodo.id)}
                            onBlur={() => onActivar(null)}
                            tabIndex={0}
                        >
                            {tocado && (
                                <circle
                                    cx={px(nodo.x)}
                                    cy={py(nodo.y)}
                                    r={r + 11}
                                    fill="none"
                                    stroke={nodo.color}
                                    strokeWidth="1"
                                    opacity="0.45"
                                />
                            )}
                            <circle
                                cx={px(nodo.x)}
                                cy={py(nodo.y)}
                                r={r}
                                fill={nodo.color}
                                fillOpacity={light ? 0.2 : 0.16}
                                stroke={nodo.color}
                                strokeWidth={tocado ? 2.1 : 1.3}
                            />
                            <text
                                x={px(nodo.x)}
                                y={py(nodo.y) + r + 15}
                                textAnchor="middle"
                                fill={nodo.color}
                                style={{
                                    fontSize: 11.5 + nodo.peso * 3,
                                    letterSpacing: "0.06em",
                                    fontWeight: tocado ? 600 : 400,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            >
                                {nodo.rotulo}
                            </text>
                        </g>
                    </g>
                )
            })}
        </svg>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL DERECHO — el texto, con los conceptos anclados.
   ═══════════════════════════════════════════════════════════════════ */

function BloqueAnclado({
    texto,
    nodos,
    activo,
    onActivar,
    light,
}: {
    texto: string
    nodos: NodoFirma[]
    activo: string | null
    onActivar: (id: string | null) => void
    light: boolean
}) {
    const piezas = useMemo(() => {
        if (nodos.length === 0) return [{ t: texto, id: null as string | null }]
        const porLlave = new Map(nodos.map((n) => [n.id, n]))
        const out: { t: string; id: string | null }[] = []
        /* Se recorre el texto por palabras conservando TODO lo que hay entre
           ellas: partir con una expresión y volver a unir perdería espacios y
           puntuación, y el párrafo se leería mal. */
        const re = /[\p{L}\p{M}]{3,}/gu
        let ultimo = 0
        let m: RegExpExecArray | null
        while ((m = re.exec(texto)) !== null) {
            const llave = pelar(m[0])
            if (porLlave.has(llave)) {
                if (m.index > ultimo)
                    out.push({ t: texto.slice(ultimo, m.index), id: null })
                out.push({ t: m[0], id: llave })
                ultimo = m.index + m[0].length
            }
        }
        if (ultimo < texto.length)
            out.push({ t: texto.slice(ultimo), id: null })
        return out
    }, [texto, nodos])

    return (
        <p
            style={{
                margin: "0 0 26px",
                /* 66 caracteres por línea es el ancho donde el ojo salta de
                   renglón sin perderse ni volver a leer. Con altura de línea
                   generosa, porque acá se lee en paralelo a mirar la izquierda. */
                fontSize: 16.5,
                lineHeight: 1.78,
                color: light ? LDS.ink : TINTA,
                letterSpacing: "0.004em",
            }}
        >
            {piezas.map((p, i) => {
                if (!p.id) return <span key={i}>{p.t}</span>
                const nodo = nodos.find((n) => n.id === p.id)!
                const tocado = activo === p.id
                const apagado = activo != null && !tocado
                return (
                    <span
                        key={i}
                        data-nodo={p.id}
                        onMouseEnter={() => onActivar(p.id)}
                        onMouseLeave={() => onActivar(null)}
                        style={{
                            color: nodo.color,
                            /* El subrayado va por debajo de la línea base y
                               fino: marcar con fondo obligaría a leer sobre un
                               color, que es exactamente lo que cansa. */
                            borderBottom: `1px solid ${
                                tocado ? nodo.color : "transparent"
                            }`,
                            opacity: apagado ? 0.34 : 1,
                            transition:
                                "opacity 0.18s ease, border-color 0.18s ease",
                            cursor: "pointer",
                        }}
                    >
                        {p.t}
                    </span>
                )
            })}
        </p>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   EL MODO
   ═══════════════════════════════════════════════════════════════════ */

/** Latido de reposo. Nace y muere en el MISMO valor para que el ciclo no dé
    un salto al reiniciarse, y su período (4.2s ≈ 14 por minuto) va al ritmo de
    una respiración tranquila: el aro marca el paso antes de que empiece la
    ráfaga en vez de apurarla. */
function ensureRafagaCss() {
    if (typeof document === "undefined") return
    if (document.getElementById("rsv-rafaga-css-v1")) return
    const s = document.createElement("style")
    s.id = "rsv-rafaga-css-v1"
    s.textContent = `
@keyframes rafagaLatido { 0%,100% { transform:scale(1); opacity:.72 } 50% { transform:scale(1.028); opacity:1 } }
/* Entrada escalonada de la topología. Vive en CSS para que la opacidad de
   señalado (que sí es funcional) no tenga que pelearse con framer-motion por
   la misma propiedad en el mismo elemento. */
@keyframes rafagaEntra { from { opacity:0 } to { opacity:1 } }
`
    document.head.appendChild(s)
}

type Fase = "reposo" | "escuchando" | "pegar" | "matriz"

export interface RafagaProps {
    abierto: boolean
    onCerrar: () => void
    /** El último reflejo completo del Espejo (texto plano). */
    reflejo: string
    /** Lo que va llegando mientras el reflejo se escribe (null = nada en curso). */
    streaming: string | null
    /** true mientras el Espejo está pensando o escribiendo. */
    reflejando: boolean
    /** Manda el texto dictado al Espejo real. */
    onEnviar: (texto: string) => void
    light: boolean
}

const LLAVE_RECORD = "rsv-rafaga-record"

export default function RafagaOverlay({
    abierto,
    onCerrar,
    reflejo,
    streaming,
    reflejando,
    onEnviar,
    light,
}: RafagaProps) {
    const t = useT()
    const { estado, arrancar, parar } = useMedidor()
    const [fase, setFase] = useState<Fase>("reposo")
    const [ppm, setPpm] = useState<number | null>(null)
    const [palabras, setPalabras] = useState(0)
    const [record, setRecord] = useState(0)
    const [nodoActivo, setNodoActivo] = useState<string | null>(null)
    const medidaFinal = useRef<{ netos: number; sinMic: boolean }>({
        netos: 0,
        sinMic: false,
    })
    const textoRef = useRef<HTMLDivElement | null>(null)

    /* Quien pidió menos movimiento no debería recibir una ceremonia de
       expansión. La preferencia del sistema manda sobre la coreografía. */
    const reducido = useMemo(() => {
        try {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch {
            return false
        }
    }, [])

    useEffect(() => {
        ensureRafagaCss()
        try {
            const v = Number(localStorage.getItem(LLAVE_RECORD) || "0")
            if (Number.isFinite(v) && v > 0) setRecord(v)
        } catch {}
    }, [])

    /* Al cerrar, todo vuelve a cero: el modo no guarda estado entre entradas
       (y el micrófono se suelta siempre, pase lo que pase). */
    useEffect(() => {
        if (!abierto) {
            parar()
            setFase("reposo")
            setPpm(null)
            setNodoActivo(null)
        }
    }, [abierto, parar])

    const alternarEscucha = useCallback(() => {
        if (fase === "escuchando") {
            medidaFinal.current = {
                netos: estado.netos,
                sinMic: estado.sinMic,
            }
            parar()
            setFase("pegar")
        } else if (fase === "reposo" || fase === "pegar") {
            setPpm(null)
            void arrancar()
            setFase("escuchando")
        }
    }, [fase, estado.netos, estado.sinMic, arrancar, parar])

    /* Cmd+V: el gesto que cierra la ráfaga y abre la matriz. */
    useEffect(() => {
        if (!abierto) return
        const onPaste = (e: ClipboardEvent) => {
            const texto = e.clipboardData?.getData("text") || ""
            if (!texto.trim()) return
            e.preventDefault()
            /* Si todavía estaba escuchando, el pegado también detiene: nadie
               debería tener que acordarse de parar antes de pegar. */
            let netos = medidaFinal.current.netos
            let sinMic = medidaFinal.current.sinMic
            if (fase === "escuchando") {
                netos = estado.netos
                sinMic = estado.sinMic
                parar()
            }
            const n = contarPalabras(texto)
            setPalabras(n)
            if (netos > 0.6) {
                const v = Math.round(n / (netos / 60))
                setPpm(v)
                medidaFinal.current = { netos, sinMic }
                if (v > record) {
                    setRecord(v)
                    try {
                        localStorage.setItem(LLAVE_RECORD, String(v))
                    } catch {}
                }
            } else {
                setPpm(null)
            }
            setFase("matriz")
            onEnviar(texto)
        }
        window.addEventListener("paste", onPaste)
        return () => window.removeEventListener("paste", onPaste)
    }, [abierto, fase, estado.netos, estado.sinMic, parar, onEnviar, record])

    /* Espacio arranca y detiene; Esc sale del modo. */
    useEffect(() => {
        if (!abierto) return
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null
            const escribiendo =
                el &&
                (el.tagName === "INPUT" ||
                    el.tagName === "TEXTAREA" ||
                    el.isContentEditable)
            if (escribiendo) return
            if (e.key === "Escape") {
                e.preventDefault()
                onCerrar()
            }
            if (e.code === "Space" && fase !== "matriz") {
                e.preventDefault()
                alternarEscucha()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [abierto, fase, alternarEscucha, onCerrar])

    const textoVivo = streaming ?? reflejo
    const firma = useMemo(
        /* Mientras el reflejo se escribe no se recalcula la firma en cada
           fragmento: sería trabajo tirado y la topología bailaría. Se arma
           cuando el texto ya está entero. */
        () =>
            reflejando
                ? { nodos: [], aristas: [], bloques: [] }
                : firmaSemantica(reflejo, light),
        [reflejo, reflejando, light]
    )

    /* ANCLAJE ESPACIAL: al señalar un nodo, el texto viaja al párrafo del que
       nació esa idea. Solo si NO está ya a la vista, para que señalar no
       arrastre la lectura de quien ya estaba ahí. */
    useEffect(() => {
        if (!nodoActivo || !textoRef.current) return
        const nodo = firma.nodos.find((n) => n.id === nodoActivo)
        if (!nodo || nodo.bloques.length === 0) return
        const cont = textoRef.current
        const destino = cont.querySelector<HTMLElement>(
            `[data-bloque="${nodo.bloques[0]}"]`
        )
        if (!destino) return
        const cr = cont.getBoundingClientRect()
        const dr = destino.getBoundingClientRect()
        const dentro = dr.top >= cr.top + 8 && dr.bottom <= cr.bottom - 8
        if (dentro) return
        cont.scrollTo({
            top: cont.scrollTop + (dr.top - cr.top) - cr.height * 0.3,
            behavior: reducido ? "auto" : "smooth",
        })
    }, [nodoActivo, firma, reducido])

    if (!abierto) return null

    const seg = (v: number) => `${v.toFixed(1)}s`
    const enMatriz = fase === "matriz"

    /* 🜂 EL NEGRO NO SE ANIMA. La premisa del modo es que la pantalla entra en
       negro absoluto, así que el fondo vive en una capa SÓLIDA desde el primer
       cuadro y lo que se funde es solo el contenido de encima. Si el fundido se
       congela (pestaña oculta, app en segundo plano, un cuadro perdido en el
       momento exacto), lo peor que pasa es que el contenido tarde en aparecer:
       jamás que el modo de hiper-enfoque quede translúcido sobre la charla.
       Medido en el panel de vista: la raíz animada se quedaba en opacidad
       0.776 con document.hidden en true, y se veía el Espejo por debajo. */
    const cuerpo = (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                background: light ? "#F4F7FB" : FONDO,
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducido ? 0 : 0.32 }}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Salida. Discreta a propósito: en un modo de hiper-enfoque, un
                botón de cerrar prominente es una invitación a distraerse. */}
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label={t("espejo.rafaga.salirAria")}
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 24,
                        zIndex: 5,
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: `1px solid ${light ? LDS.hairline : "rgba(255,255,255,0.14)"}`,
                        background: "transparent",
                        color: light ? LDS.inkSoft : TINTA_TENUE,
                        fontSize: 15,
                        cursor: "pointer",
                    }}
                >
                    ✕
                </button>

                {/* 🜂 SIN `AnimatePresence mode="wait"` A PROPÓSITO. Esperar a que
                la fase anterior termine su salida metía un hueco muerto de
                240 ms en CADA pegado, en el modo que promete velocidad. Y peor:
                si el reloj de animación se detiene (ventana en segundo plano,
                ahorro de energía), la salida no termina nunca y la Matriz no
                monta jamás. Medido en el panel de vista: el pegado devolvía el
                texto correcto y la pantalla se quedaba en el círculo. El cambio
                de fase es ahora un condicional simple: instantáneo y sin
                depender de que ninguna animación termine. */}
                <>
                    {!enMatriz ? (
                        /* ── FASE RÁFAGA ─────────────────────────────────── */
                        <motion.div
                            key="rafaga"
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 34,
                            }}
                        >
                            <motion.button
                                type="button"
                                onClick={alternarEscucha}
                                aria-label={t("espejo.rafaga.circuloAria")}
                                animate={{
                                    /* El círculo respira con la voz real. Un aro
                                   que no reacciona es indistinguible de un aro
                                   muerto: si la feature RECIBE algo del mundo,
                                   ese algo se ve mientras entra. */
                                    scale:
                                        fase === "escuchando"
                                            ? 1 + estado.nivel * 0.13
                                            : 1,
                                }}
                                transition={{ duration: 0.09, ease: "linear" }}
                                style={{
                                    width: 224,
                                    height: 224,
                                    borderRadius: "50%",
                                    border: `1px solid ${
                                        fase === "escuchando"
                                            ? CIAN
                                            : light
                                              ? LDS.hairline
                                              : "rgba(150,190,225,0.22)"
                                    }`,
                                    background:
                                        fase === "escuchando"
                                            ? `radial-gradient(circle, rgba(0,229,255,${(
                                                  0.05 +
                                                  estado.nivel * 0.16
                                              ).toFixed(3)}), transparent 68%)`
                                            : "transparent",
                                    boxShadow:
                                        fase === "escuchando"
                                            ? `0 0 ${(
                                                  26 +
                                                  estado.nivel * 70
                                              ).toFixed(
                                                  0
                                              )}px rgba(0,229,255,0.28)`
                                            : "none",
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                    padding: 0,
                                    /* Sin respiración de fábrica: en reposo el aro
                                   se queda quieto para que el primer movimiento
                                   que se vea sea la propia voz. */
                                    animation:
                                        fase === "reposo" && !reducido
                                            ? "rafagaLatido 4.2s ease-in-out infinite"
                                            : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10.5,
                                        letterSpacing: "0.28em",
                                        textTransform: "uppercase",
                                        color:
                                            fase === "escuchando"
                                                ? CIAN
                                                : light
                                                  ? LDS.inkSoft
                                                  : TINTA_TENUE,
                                    }}
                                >
                                    {fase === "escuchando"
                                        ? t("espejo.rafaga.detener")
                                        : fase === "pegar"
                                          ? t("espejo.rafaga.pegar")
                                          : t("espejo.rafaga.hablar")}
                                </span>
                            </motion.button>

                            {/* El reloj vive chico y tenue. Un cronómetro grande
                            mete presión de tiempo, y la presión de tiempo es
                            justo lo que rompe el estado de flujo. */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 26,
                                    fontSize: 11,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: light ? LDS.inkSoft : TINTA_TENUE,
                                    minHeight: 16,
                                }}
                            >
                                {fase === "escuchando" && (
                                    <>
                                        <span>{seg(estado.brutos)}</span>
                                        <span style={{ color: CIAN }}>
                                            {t("espejo.rafaga.conVoz")}{" "}
                                            {seg(estado.netos)}
                                        </span>
                                    </>
                                )}
                                {fase === "pegar" && (
                                    <span>{t("espejo.rafaga.listoPegar")}</span>
                                )}
                                {fase === "reposo" && record > 0 && (
                                    <span>
                                        {t("espejo.rafaga.record")} {record}
                                    </span>
                                )}
                            </div>

                            {estado.sinMic && fase === "escuchando" && (
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        maxWidth: 380,
                                        textAlign: "center",
                                        lineHeight: 1.6,
                                        color: light
                                            ? LDS.inkSoft
                                            : TINTA_TENUE,
                                    }}
                                >
                                    {t("espejo.rafaga.sinMic")}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── FASE MATRIZ ─────────────────────────────────── */
                        <motion.div
                            key="matriz"
                            initial={
                                reducido
                                    ? false
                                    : {
                                          opacity: 0,
                                          scale: 0.94,
                                          filter: "blur(6px)",
                                      }
                            }
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            /* Expansión sin rebote. Un overshoot se lee como juego
                           y rompe el enfoque; una curva monótona se lee como
                           una compuerta que se abre. */
                            transition={{
                                duration: reducido ? 0 : 0.62,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            style={{
                                flex: 1,
                                minHeight: 0,
                                display: "grid",
                                gridTemplateColumns: "minmax(320px, 44%) 1fr",
                                gap: 0,
                            }}
                        >
                            {/* IZQUIERDA · topología */}
                            <div
                                style={{
                                    position: "relative",
                                    display: "grid",
                                    placeItems: "center",
                                    /* Pie ancho: ahí vive la métrica de la ráfaga
                                   y el disco no debe pisarla. */
                                    padding: "44px 30px 92px",
                                    borderRight: `1px solid ${
                                        light
                                            ? LDS.hairline
                                            : "rgba(120,180,220,0.10)"
                                    }`,
                                    minHeight: 0,
                                }}
                            >
                                {firma.nodos.length > 0 ? (
                                    /* 🜂 El disco llena el panel por su lado MÁS
                                   CORTO y se centra en el otro. Medido: atado
                                   solo al ancho ocupaba 309px en un panel de
                                   374×998, o sea el 31% del alto, y la
                                   topología quedaba de miniatura justo en el
                                   modo que promete leerla de un vistazo. El
                                   viewBox cuadrado con `meet` hace la cuenta
                                   solo, en cualquier proporción de pantalla. */
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "grid",
                                            placeItems: "center",
                                            minHeight: 0,
                                        }}
                                    >
                                        <Topologia
                                            firma={firma}
                                            activo={nodoActivo}
                                            onActivar={setNodoActivo}
                                            light={light}
                                            reducido={reducido}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            letterSpacing: "0.24em",
                                            textTransform: "uppercase",
                                            color: light
                                                ? LDS.inkSoft
                                                : TINTA_TENUE,
                                        }}
                                    >
                                        {reflejando
                                            ? t("espejo.rafaga.formando")
                                            : t("espejo.rafaga.sinFirma")}
                                    </div>
                                )}

                                {/* La métrica de la ráfaga, al pie de la topología:
                                cerrar el ciclo con el número es lo que hace que
                                el gesto se sienta una marca y no un trámite. */}
                                {ppm != null && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 26,
                                            left: 0,
                                            right: 0,
                                            textAlign: "center",
                                            fontSize: 11,
                                            letterSpacing: "0.18em",
                                            textTransform: "uppercase",
                                            color: light
                                                ? LDS.inkSoft
                                                : TINTA_TENUE,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: light
                                                    ? LDS.accentInk
                                                    : CIAN,
                                                fontSize: 22,
                                                letterSpacing: "0.04em",
                                                marginRight: 8,
                                            }}
                                        >
                                            {ppm}
                                        </span>
                                        {t("espejo.rafaga.ppm")}
                                        <span
                                            style={{
                                                margin: "0 10px",
                                                opacity: 0.4,
                                            }}
                                        >
                                            ·
                                        </span>
                                        {palabras} {t("espejo.rafaga.palabras")}
                                        <span
                                            style={{
                                                margin: "0 10px",
                                                opacity: 0.4,
                                            }}
                                        >
                                            ·
                                        </span>
                                        {seg(medidaFinal.current.netos)}
                                        {medidaFinal.current.sinMic && (
                                            <span
                                                style={{
                                                    display: "block",
                                                    marginTop: 6,
                                                    fontSize: 10,
                                                    letterSpacing: "0.1em",
                                                    textTransform: "none",
                                                    color: ORO,
                                                }}
                                            >
                                                {t("espejo.rafaga.sinMicNota")}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* DERECHA · el texto */}
                            <div
                                ref={textoRef}
                                style={{
                                    overflowY: "auto",
                                    padding: "60px 6vw 90px 4vw",
                                    minHeight: 0,
                                    scrollBehavior: reducido
                                        ? "auto"
                                        : "smooth",
                                }}
                            >
                                <div
                                    style={{ maxWidth: 640, margin: "0 auto" }}
                                >
                                    {(firma.bloques.length > 0
                                        ? firma.bloques
                                        : textoVivo
                                              .split(/\n{2,}/)
                                              .map((b) => b.trim())
                                              .filter(Boolean)
                                    ).map((bloque, i) => (
                                        <div key={i} data-bloque={i}>
                                            <BloqueAnclado
                                                texto={bloque}
                                                nodos={firma.nodos}
                                                activo={nodoActivo}
                                                onActivar={setNodoActivo}
                                                light={light}
                                            />
                                        </div>
                                    ))}
                                    {reflejando && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                letterSpacing: "0.24em",
                                                textTransform: "uppercase",
                                                color: light
                                                    ? LDS.inkSoft
                                                    : TINTA_TENUE,
                                            }}
                                        >
                                            {t("espejo.rafaga.reflejando")}
                                        </div>
                                    )}
                                    {!reflejando && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFase("reposo")
                                                setNodoActivo(null)
                                            }}
                                            style={{
                                                marginTop: 26,
                                                padding: "9px 20px",
                                                borderRadius: 999,
                                                border: `1px solid ${
                                                    light
                                                        ? LDS.hairline
                                                        : "rgba(150,190,225,0.22)"
                                                }`,
                                                background: "transparent",
                                                color: light
                                                    ? LDS.inkSoft
                                                    : TINTA_TENUE,
                                                fontSize: 10.5,
                                                letterSpacing: "0.2em",
                                                textTransform: "uppercase",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {t("espejo.rafaga.otraRafaga")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </>
            </motion.div>
        </div>
    )

    return createPortal(cuerpo, document.body)
}
