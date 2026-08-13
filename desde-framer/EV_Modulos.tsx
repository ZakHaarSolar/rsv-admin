// EV_Modulos.tsx v1.35 — Estado de ánimo del campo (#5): al ABRIR/poner
// en marcha un tomo de Calibración, una onda DORADA del campo irradia
// desde el centro del viewport (fireFieldWave) — momento distinto de la
// onda táctil #3 (que es al TOCAR la card o el acordeón). v1.34 —
// Resonancia táctil (#3): la card de pilar y el
// header del acordeón del tomo emiten una onda de luz desde el punto de
// contacto al tocarlas (fireTouchRipple). v1.33 — Libro de Calibración colapsable: cada elemento
// (Lectura, Directiva, cada Anclaje) arranca minimizado y se despliega al
// tocarlo (componente Collapse), para que el tomo no abra como un muro de
// texto. v1.32 — Libro de Calibración premium: más aire, encabezado
// con divisor de acento, secciones "Lectura del sistema" / "Directiva" /
// "Anclajes", y checkboxes con tema de acento (glow al completar).
// v1.31 — Fix del flash de pantalla vacía en desktop al primer check
// de un tomo (reportado por Zak el 2026-05-07). Causa: el campo `id`
// del objeto que retornaba `buildVisibleProtosForPillar` venía de
// `found.id` cuando había fila en estado_tripulante_protocolos, y de
// `p.id` (= protocolo_id de la librería) cuando no la había. Antes
// del primer toggle, `id = protocolo_id`. Después del POST a la DB,
// el handler actualizaba el `id` del optimistic con el id real de la
// fila de estado (distinto del protocolo_id). El re-render con el
// `id` cambiado rompía la condición `pr.id === openCodexId` del modal
// del tomo abierto, y como tampoco había otro tomo seleccionado, la
// pantalla mostraba solo el título del pilar.
// Fix: `pr.id` ahora es SIEMPRE el `protocolo_id` (estable entre
// renders, no cambia tras el upsert). El handler ya busca la fila
// en DB por `(clerk_user_id, protocolo_id)`, así que no necesitamos
// persistir el id de estado_tripulante_protocolos en memoria local.
// Ver EscanerVibracional v13.47 para la limpieza correspondiente del
// handler.
// v1.30 — Fix del checkbox de tareas que no respondía después del
// cambio v1.28. Bug: el onClick pasaba `pr.id` al handler, que en la
// nueva fuente de verdad (libreria_protocolos) es ambiguo — para
// protocolos sin fila en estado_tripulante_protocolos, `pr.id` es
// realmente el `protocolo_id` de la librería; para protocolos con
// fila, `pr.id` es el id de la tabla de estado. El handler buscaba
// por `id=eq.${estadoId}` y nunca encontraba nada porque la fila no
// existía todavía (el flujo del Enrutador post-pilar ya no la crea).
// Fix: el callsite ahora pasa `pr.protocolo_id` (siempre el id de
// libreria_protocolos), que es el identificador estable. El handler
// upserta por `(clerk_user_id, protocolo_id)`: si la fila no existe
// la inserta, si existe la actualiza. Ver EscanerVibracional v13.46.
// v1.29 — Fix del crash al abrir un tomo de Calibración (pantalla
// negra). Reportado por Zak el 2026-05-07. Causa raíz: el campo
// `tareas_json` en libreria_protocolos viene como string JSON crudo
// vía REST API de Supabase (no como array parseado), y el render del
// detail hacía `.map()` directo sobre el string → TypeError → React
// unmount el subtree → pantalla negra.
// Fix doble: (a) parseamos el string en buildVisibleProtosForPillar
// antes de armar el objeto que consume el render. (b) defensa
// adicional en el .map() del render con Array.isArray check, por si
// alguna otra fuente entrega tareas_json en otro formato.
// v1.28 — Cambio de lógica de desbloqueo de Calibraciones (decisión Zak
// 2026-05-07). Antes: cada pilar mostraba su calibración apenas el
// Tripulante cerraba ese pilar (vía el flujo de Enrutador post-pilar
// que insertaba en estado_tripulante_protocolos). Ahora: las
// Calibraciones quedan bloqueadas hasta que el Tripulante completa los
// 6 pilares del Radar (cuando arranca el cooldown de 7 días). En ese
// momento las 6 se desbloquean simultáneamente.
// Para cada pilar muestra todas las fases con score_min ≤ score del
// Tripulante. Con 10 fases por pilar (0-9% → fase 1, 10-19% → fase 2,
// ..., 90-100% → fase 10), un Tripulante que sacó 50% en Hardware ve
// fases 1, 2, 3, 4, 5, 6 de Hardware.
// La fuente de verdad pasa de `dbProtos` (estado_tripulante_protocolos)
// a `libreriaProtos` (libreria_protocolos completa) filtrada runtime.
// `dbProtos` solo se usa ahora para mergear `tareas_completadas` por
// protocolo_id — el progreso de cada tarea por Tripulante sigue
// guardándose en estado_tripulante_protocolos vía onToggleTask. Si una
// fila no existe todavía, las tareas arrancan vacías.
// Nuevas props: `libreriaProtos` (toda la librería, default []) y
// `cycleComplete` (boolean, default false).
// v1.27 — Modal del tomo de Calibración (cuando entras a un pilar y
// abres una calibración) gana presencia: background sube de 60-80 % a
// 92-96 % de opacidad, borde dorado-cyan al 28 % (antes 10 %), shadow
// interna sutil para sentir lift. Título centrado en blanco con realce
// dramatico de accent (text-shadow doble glow), tagline FASE X centrado
// en accent al 65 %. Texto del cuerpo (alerta + sugerencia + tareas) sube
// de 0.35-0.55 a 0.75-0.95 de opacidad blanca para que se lea con la
// misma luminosidad que la cabecera. Cero cambio en estructura — solo
// paleta y peso visual.
// v1.26 — Tres ajustes post-pegado del bloque PWA con viewport-fit=cover
// (reportados por Zak el 2026-05-07 noche):
//   (a) Botón "Volver" mobile portaleado al pillar detail respeta
//       env(safe-area-inset-top): pasa de top:14 a
//       calc(14px + env(safe-area-inset-top, 0px)) para no quedar
//       detrás del reloj iOS en PWA standalone.
//   (b) Padding-top del wrapper del pillar detail mobile pasa de
//       60px fijo a calc(60px + env(safe-area-inset-top, 0px)) para
//       que el ícono + título caigan debajo de la franja del notch.
//   (c) Grilla 2×3 PWA compactada: monSize 128 → 110, minHeight de
//       card 190 → 150, rowGap 36 → 14, columnGap 12 → 8. Las 3
//       filas + el porcentaje bajo cada pilar entran ahora sin
//       chocar contra el dock inferior, donde el último par
//       (Vector / Órbita) se cortaba antes.
// v1.25 — Re-publish trigger (sin cambios funcionales) para forzar
// invalidación del CDN de Framer tras reporte de Zak el 2026-05-07: la
// PWA seguía mostrando el layout 3×2 viejo aunque el watcher confirmó
// commit. La causa probable era cache CDN o de iOS PWA. Bump de versión
// dispara otro sync + publish, que invalida los assets del CDN.
// v1.24 — Calibración mobile en PWA standalone: la grilla de 6 pilares
// pasa de 3 columnas × 2 filas (compacta, pensada para web mobile que
// pierde altura por la URL bar de Safari) a 2 columnas × 3 filas, y el
// monumento de cada pilar crece de 86 a 128 (49 % más grande). En PWA
// hay más alto disponible y la altura mínima de cada card sube de 130
// a 190; el rowGap también se afloja de 28 a 36 para que el ojo separe
// las dos filas extra. Web mobile normal (no PWA) sigue exactamente
// igual que antes — el switch lee el nuevo hook useIsPWAStandalone de
// EV_Shared (display-mode: standalone OR navigator.standalone iOS).
// v1.22 — Botones "Volver" (desktop + mobile) llevan
// data-rsv-back-button="true" para que la navegación con flechas
// del teclado en NavegadorEstacion los detecte como sub-capa: al
// picar Arrow Left con un pilar/codex abierto, simula click en el
// botón Volver en lugar de rotar la pestaña activa.
// v1.21 — Desktop Calibración deja de tener scroll vertical vacío
// debajo de la grilla 3×2 de pilares. Antes el outer wrapper tenía
// `padding: "0 0 60px"` y nada limitaba la altura → el shell del
// Escáner habilitaba ~60px de espacio en blanco scroll-eable después
// del último pilar. Ahora padding-bottom 0 + minHeight calc(100vh -
// 240px) llena el viewport sin exceder. El comportamiento mobile no
// cambia (la columna stack vertical no tenía el problema).
// v1.20 — Botón "Volver" desktop (al entrar a un pilar de Calibración)
// pasa de position:absolute (anclado al container del ModuloDetail)
// a fixed top:18 left:24, alineado verticalmente con la barra superior
// de tabs RADAR/CALIBRACIÓN/HOLOTECA/NÚCLEO del shell del Escáner.
// Antes el botón quedaba flotando bajo la barra y se sentía
// desconectado. Tamaño sube de 68×32 a 100×44, SVG de 14 a 20 y
// stroke 2 → 2.2 para que el ojo lo lea como botón principal de
// back. zIndex 5 → 70 para que viva encima del shell. Mobile sin
// cambios (ya estaba portaled top:14 left:14).
// v1.19 — Cards de pilares (HARDWARE/PROCESADOR/MOTOR/GRAVEDAD/
// VECTOR/ÓRBITA) expuestos como drop-targets del press-and-drag de
// la barra de navegación del Centro de Mando. Agregado data-drag-
// target al motion.div del renderCard. NavegadorEstacion v4.21+
// busca este atributo en findContentTargetAt cuando el tripulante
// suelta el cursor encima — antes los cards eran <div> con onClick
// y no se detectaban (el handler busca BUTTON/A/role=button/
// data-drag-target).
// v1.18 — Dos fixes en pillar detail (libros sagrados):
//  1) Padding-top mobile pasa de 28 a 60 para bajar el título
//     del pillar (HARDWARE / PROCESADOR / etc) debajo del botón
//     "Volver" que vive portaleado a top:14.
//  2) Nueva prop hideForOverlay: cuando true salta el portal del
//     botón "Volver". Sin esto el botón persistía visible al
//     navegar a Holoteca/Núcleo desde el pillar detail (el
//     wrapper del Escáner se oculta con display:none pero el
//     portal vive en document.body). EscanerVibracional v13.21
//     ya pasa la flag.
// EV_Modulos.tsx v1.17
// v1.17 — Pilares centrados verticalmente otra vez en mobile.
// v1.15 había quitado el flex:grow del top-spacer para que los
// pilares quedaran arriba; con v1.16 mostrando los 6 siempre, ese
// layout dejaba un hueco grande abajo. Ahora top-spacer y bottom-
// spacer ambos flex:1 → grid centrado vertical en el espacio
// entre el título y el dock/BottomNav.
// EV_Modulos.tsx v1.16
// v1.16 — Calibración muestra SIEMPRE los 6 pilares. Los que tienen
// protocolos asignados van con su color/opacity normal y abren el
// detalle al tocar. Los que NO tienen protocolos van con opacity
// reducida (~0.35) y al tocarse abren un modal con el texto
// "Sondea un pilar en el Escáner para que el Enrutador active tu
// primera calibración." (mismo copy que tenía el ProtocolosEmptyState
// pero ahora contextualizado por pilar). El grid es la única vista
// — el ProtocolosEmptyState queda fuera del flujo principal.
// EV_Modulos.tsx v1.15
// v1.15 — Grid de pilares mobile arranca pegado debajo del título
// en vez de centrarse vertical. El top-spacer flex:3 que centraba
// el grid empujaba a los pilares al medio/bajo del viewport cuando
// había menos de 6 — el tripulante percibía "primera fila vacía".
// Ahora el spacer solo tiene minHeight:24 (sin flex grow); los
// pilares completados llenan desde top-left con gap mínimo respecto
// al título y el bottom-spacer absorbe el resto.
// EV_Modulos.tsx v1.14
// v1.14 — Empty state copy: "Sondea un pilar en el Radar" →
// "Sondea un pilar en el Escáner" (rename Radar → Escáner ya
// completado en el resto de la app).
// EV_Modulos.tsx v1.13
// v1.13 — Rename PROTOCOLOS QUIRÚRGICOS → CALIBRACIÓN: títulos mobile
// y desktop ahora muestran "Calibración" (una sola palabra). Desktop
// fontSize 72 + letterSpacing 0.4em (igual a MI NÚCLEO desktop).
// Empty state copy actualizado: "tu primer protocolo quirúrgico" →
// "tu primera calibración".
// EV_Modulos.tsx v1.12
// v1.12 — Animación de entrada del título mobile copia exacta del
// título HOLOTECA: transition con ease easeOut + CSS animation
// nuc-breath (en lugar de esc-nuc-breath). Los tres títulos del
// Lente respiran al mismo ritmo.
// v1.11 — Subtítulo "Selecciona un pilar" eliminado del header del
// mobile (la grilla de pilares es auto-explicativa, el texto sumaba
// ruido). Spacer top sube de flex 1.6 a flex 3 — los 6 pilares bajan
// más al centro vertical del viewport.
// v1.10 — Mobile: spacers asimétricos (top flex 1.6 vs bottom flex 1)
// para compensar el padding-bottom grande del esc-scroll del Escáner.
// El grid de los 6 pilares baja al centro visual del viewport.
// v1.9 — Defaults defensivos en props (scores, accent, dbProtos, etc)
// para evitar crash al instanciar standalone en Framer. Desktop:
// título con marginTop 8 para que su BASE coincida con la BASE del
// título "MI NÚCLEO" desktop (titleTopOffsetPx 102 vs esc-scroll
// padding-top 96 + delta).
// v1.8 — Mobile: título "PROTOCOLOS QUIRÚRGICOS" sube a la misma altura
// que HOLOTECA y DECODIFICADOR (padding-top wrapper 4px). Subtítulo
// "Selecciona un pilar" pasa a SEGUNDA fila debajo del título (antes
// estaban en la misma fila y se cortaban en pantallas chicas). Grid
// de los 6 pilares se centra verticalmente en el espacio restante:
// el wrapper toma flex:1 y dos spacers flex:1 envuelven el grid arriba
// y abajo. Desktop sin cambios.
// v1.7 — ModulosView acepta prop dbLoaded. Mientras la carga inicial
// de protocolos esté en curso, NO mostramos el ProtocolosEmptyState
// ("Aún sin protocolos asignados") ni el subtítulo "Selecciona un
// pilar" — quedan vacíos hasta que el padre confirme que dbProtos
// está hidratado. Esto elimina el flash que aparecía antes de que
// los pilares cargaran cuando el tripulante ya tenía protocolos.
// v1.6 — Mobile: el título "PROTOCOLOS QUIRÚRGICOS" pasa a navigation
// bar superior izquierda (textAlign left, fontSize 14, single-line).
// Subtítulo gris ahora vive en la misma fila a la derecha. Los pilares
// pueden subir y aprovechar la altura. Desktop sin cambios.
// v1.5 — Desktop fontSize del título 72 → 56 + letterSpacing 0.4em →
// 0.32em. La palabra "Quirúrgicos" estiraba demasiado la pantalla.
// Ahora cabe cómodo y mantiene la presencia visual.
// Capa de Protocolos Quirúrgicos del Escáner Vibracional. ModulosView
// pinta la grilla 3x2 de pilares con los 6 monumentos Mon*; al picar
// un pilar abre la vista detalle con CodexCarousel y los tomos
// quirúrgicos. ProtocolosEmptyState es la pantalla cuando aún no hay
// protocolos asignados. Default export: ModulosView.
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"
import Shared, {
    DBProtocol,
    PillarId,
    Scores,
} from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
import CodexCarousel from "./EV_Codex.tsx"
import RadarPack from "./EV_Radar.tsx"
const { hx, useIsPWAStandalone, fireTouchRipple, fireFieldWave } = Shared
const {
    CSvg,
    MonHardware,
    MonMental,
    MonEmocional,
    MonFinanciero,
    MonVector,
    MonOrbita,
    getPillarLabel,
} = Icons
const { PILLARS } = RadarPack

/* Acordeón colapsable del tomo de Calibración: cada elemento (Lectura,
   Directiva, cada Anclaje) arranca minimizado y se despliega al tocarlo, así
   el libro no abre como un muro de texto. `headerLeft` permite anidar un
   checkbox (Anclajes) que togglea su completado aparte del despliegue. */
function Collapse({
    open,
    onToggle,
    accent,
    title,
    titleColor,
    eyebrow = false,
    headerLeft,
    children,
}: {
    open: boolean
    onToggle: () => void
    accent: string
    title: React.ReactNode
    titleColor?: string
    eyebrow?: boolean
    headerLeft?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div
            style={{
                borderRadius: 13,
                overflow: "hidden",
                border: `1px solid ${hx(accent, open ? 0.32 : 0.12)}`,
                background: open
                    ? `linear-gradient(135deg, ${hx(accent, 0.09)}, rgba(6,16,32,0.45))`
                    : "rgba(255,255,255,0.025)",
                transition: "border-color 0.22s ease, background 0.22s ease",
            }}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                    fireTouchRipple(e.clientX, e.clientY, {
                        color: accent,
                        size: 150,
                    })
                    onToggle()
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 15px",
                    cursor: "pointer",
                    minHeight: 50,
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {headerLeft}
                <span
                    style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: eyebrow ? 10 : 13.5,
                        fontWeight: eyebrow ? 700 : 500,
                        letterSpacing: eyebrow ? "0.2em" : "0.01em",
                        textTransform: eyebrow ? "uppercase" : "none",
                        color: titleColor || hx(accent, 0.85),
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {title}
                </span>
                <motion.span
                    animate={{ rotate: open ? 90 : 0 }}
                    style={{
                        flexShrink: 0,
                        color: hx(accent, 0.75),
                        fontSize: 18,
                        fontWeight: 300,
                        lineHeight: 1,
                    }}
                >
                    ›
                </motion.span>
            </div>
            <motion.div
                initial={false}
                animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
            >
                <div style={{ padding: "2px 15px 16px" }}>{children}</div>
            </motion.div>
        </div>
    )
}

function ProtocolosEmptyState({
    accent,
    isMobile,
}: {
    accent: string
    isMobile: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                padding: isMobile ? "60px 28px" : "80px 40px",
                maxWidth: 420,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: isMobile ? 64 : 84,
                    height: isMobile ? 64 : 84,
                    borderRadius: "50%",
                    border: `1px dashed ${hx(accent, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 30px ${hx(accent, 0.08)}`,
                }}
            >
                <div
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: hx(accent, 0.6),
                        boxShadow: `0 0 16px ${hx(accent, 0.6)}`,
                        animation: "esc-vertex-pulse 2.5s ease-in-out infinite",
                    }}
                />
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.04em",
                    fontFamily: "'Inter',sans-serif",
                    lineHeight: 1.6,
                }}
            >
                {
                    "Sondea un pilar en el Escáner para que el Enrutador active tu primera calibración."
                }
            </p>
        </motion.div>
    )
}

function ModulosView({
    /* v1.9 — Defaults defensivos contra Framer instanciando el módulo
       standalone con props undefined ("Cannot read properties of
       undefined (reading 'some')"). */
    scores = {} as Scores,
    accent = "#00C2FF",
    dbProtos = [],
    /* v1.28 — libreriaProtos: tabla libreria_protocolos completa
       (filtrada is_active=true). Fuente de verdad para mostrar las
       calibraciones disponibles según score del Tripulante. */
    libreriaProtos = [],
    /* v1.28 — cycleComplete: true cuando cycleScanned.size === 6
       (el Tripulante terminó los 6 pilares del Radar). Las
       calibraciones se desbloquean en bloque cuando este flag pasa
       a true. */
    cycleComplete = false,
    onToggleTask = () => {},
    selectedPillar = null,
    onSelectPillar = () => {},
    isMobile = false,
    isActiveMember = true,
    onFreemiumBlock,
    dbLoaded = true,
    hideForOverlay = false,
}: {
    scores?: Scores
    accent?: string
    dbProtos?: DBProtocol[]
    libreriaProtos?: any[]
    cycleComplete?: boolean
    onToggleTask?: (e: string, t: string) => void
    selectedPillar?: string | null
    onSelectPillar?: (v: string | null) => void
    isMobile?: boolean
    isActiveMember?: boolean
    onFreemiumBlock?: (pillarKey?: string) => void
    /* v1.7 — dbLoaded: el padre indica si la carga inicial de
       dbProtos terminó. Mientras false, NO mostramos el ProtocolosEmptyState
       ("Aún sin protocolos asignados") porque visibleCount === 0
       puede ser solo "todavía cargando" y no "el tripulante no
       tiene protocolos". Default true para retrocompatibilidad. */
    dbLoaded?: boolean
    /* v1.18 — hideForOverlay: cuando AppNavegacionMobile muestra
       Holoteca/Núcleo encima, el wrapper del Escáner se oculta con
       display:none, pero el botón "Volver" del pillar detail vive
       en createPortal a document.body y queda fuera del wrapper.
       Esta prop permite saltar el portal mientras el overlay esté
       activo. */
    hideForOverlay?: boolean
}) {
    /* En PWA standalone (mobile) tenemos más alto vertical disponible
       (sin URL bar de Safari) y reorganizamos la grilla a 2 columnas
       × 3 filas; el monumento crece a 110 (28 % de ganancia sobre el
       86 de la grilla 3×2 web). v1.26 — el monSize bajó de 128 a 110
       y el row spacing del grid se compactó porque las 3 filas se
       chocaban con el dock inferior y el % del último par de pilares
       (Vector / Órbita) quedaba clipeado. */
    const isPWA = useIsPWAStandalone()
    const monSize = isMobile ? (isPWA ? 110 : 86) : 180
    const pillarData: [string, string, string, PillarId, React.ReactNode][] = [
        [
            "FISICO",
            "HARDWARE",
            "FÍSICO",
            "fisico",
            <MonHardware s={monSize} ac={accent} />,
        ],
        [
            "MENTAL",
            "PROCESADOR",
            "MENTAL",
            "mental",
            <MonMental s={monSize} ac={accent} />,
        ],
        [
            "EMOCIONAL",
            "MOTOR",
            "EMOCIONAL",
            "emocional",
            <MonEmocional s={monSize} ac={accent} />,
        ],
        [
            "FINANCIERO",
            "GRAVEDAD",
            "FINANCIERA",
            "financiero",
            <MonFinanciero s={monSize} ac={accent} />,
        ],
        [
            "VECTOR",
            "VECTOR",
            "DE EXPANSIÓN",
            "vector",
            <MonVector s={monSize} ac={accent} />,
        ],
        [
            "ORBITA",
            "ÓRBITA",
            "RELACIONAL",
            "orbita",
            <MonOrbita s={monSize} ac={accent} />,
        ],
    ]

    const [openCodexId, setOpenCodexId] = useState<string | null>(null)
    /* v1.32 — Secciones colapsables dentro del tomo (Lectura, Directiva,
       cada Anclaje). Todo arranca minimizado: el Tripulante despliega lo
       que quiere leer en lugar de toparse con un muro de texto. */
    const [openSections, setOpenSections] = useState<Set<string>>(new Set())
    const toggleSection = (k: string) =>
        setOpenSections((prev) => {
            const next = new Set(prev)
            if (next.has(k)) next.delete(k)
            else next.add(k)
            return next
        })
    /* v1.16 — Modal del Enrutador para pilares sin calibraciones
       asignadas. Antes mostrábamos un empty state global; ahora
       cada pilar inactivo puede dispararlo individualmente. */
    const [showEnrutadorGate, setShowEnrutadorGate] = useState(false)
    useEffect(() => {
        setOpenCodexId(null)
    }, [selectedPillar])
    /* Al cambiar de tomo, todo vuelve a colapsarse (libro fresco). */
    useEffect(() => {
        setOpenSections(new Set())
    }, [openCodexId])
    /* v1.28 — Las calibraciones se desbloquean cuando el Tripulante
       cierra el ciclo de 6 pilares. Hasta entonces los 6 quedan en
       inactive (mismo render visual que antes con dbProtos vacío).
       Cuando cycleComplete pasa a true, los 6 se activan en bloque. */
    const pillarActivity = pillarData.map((row) => {
        return { row, inactive: !cycleComplete }
    })
    const visibleCount = pillarActivity.filter((p) => !p.inactive).length

    /* v1.28 — Helper: derivar la lista de calibraciones visibles para
       un pilar desde libreriaProtos. Filtra por pilar (mayúsculas
       según convención de libreria_protocolos) + score_min ≤ score
       del Tripulante. Mergea con dbProtos para arrastrar
       tareas_completadas. Si una fila de estado_tripulante_protocolos
       no existe todavía, las tareas arrancan vacías y onToggleTask
       las upsertará al primer toque.
       La forma del objeto retornado mantiene el shape que el render
       descendente espera (mismas keys que dbProtos[i]). */
    const pillarToUpper: Record<string, string> = {
        fisico: "FISICO",
        mental: "MENTAL",
        emocional: "EMOCIONAL",
        financiero: "FINANCIERO",
        vector: "VECTOR",
        orbita: "ORBITA",
    }
    const buildVisibleProtosForPillar = (
        pillarUpper: string,
        score: number | null
    ): DBProtocol[] => {
        if (!Array.isArray(libreriaProtos) || libreriaProtos.length === 0) {
            return []
        }
        const effectiveScore =
            score === null || score === undefined || isNaN(score)
                ? 100
                : score
        const list = libreriaProtos.filter((p: any) => {
            if (!p) return false
            if (p.is_active === false) return false
            if (p.pilar !== pillarUpper) return false
            const sm = typeof p.score_min === "number" ? p.score_min : 0
            return sm <= effectiveScore
        })
        const dbByProtocoloId = new Map<string, DBProtocol>()
        for (const dp of dbProtos) {
            if (dp && dp.protocolo_id) {
                dbByProtocoloId.set(String(dp.protocolo_id), dp)
            }
        }
        return list.map((p: any) => {
            const found = dbByProtocoloId.get(String(p.id))
            /* v1.29 — tareas_json puede venir como string JSON crudo
               desde el REST API de Supabase (jsonb serializado) o
               como array nativo. Normalizamos a array antes de pasar
               al consumidor para evitar `.map is not a function` en
               el render del tomo. */
            let tareasArr: any[] = []
            const raw = p.tareas_json
            if (Array.isArray(raw)) {
                tareasArr = raw
            } else if (typeof raw === "string" && raw.trim().length > 0) {
                try {
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed)) tareasArr = parsed
                } catch {}
            }
            return {
                /* v1.31 — `id` SIEMPRE igual a protocolo_id para
                   mantener estabilidad entre renders. El id real de
                   la fila estado_tripulante_protocolos NO se persiste
                   en memoria local — el handler hace upsert por
                   (clerk_user_id, protocolo_id). */
                id: p.id,
                protocolo_id: p.id,
                estado: found ? found.estado : "DESBLOQUEADO",
                pilar: p.pilar,
                fase: p.fase,
                titulo: p.titulo,
                descripcion_corta: p.descripcion_corta,
                alerta_text: p.alerta_text,
                sugerencia_text: p.sugerencia_text,
                tareas_json: tareasArr,
                tareas_completadas: Array.isArray(found?.tareas_completadas)
                    ? found.tareas_completadas
                    : [],
            } as DBProtocol
        })
    }

    if (selectedPillar) {
        /* v1.28 — pillarProtos ahora deriva de libreriaProtos en
           lugar de dbProtos. Si cycleComplete es false, retorna
           lista vacía y caemos al fallback hardcoded del Codex. */
        const pillarProtosFromLib = cycleComplete
            ? buildVisibleProtosForPillar(
                  pillarToUpper[selectedPillar.toLowerCase()] ||
                      selectedPillar.toUpperCase(),
                  scores[selectedPillar.toLowerCase() as PillarId]
              )
            : []
        const pillarProtos = pillarProtosFromLib
        const fullLabel = getPillarLabel(selectedPillar)
        const pillarScore = scores[selectedPillar.toLowerCase() as PillarId]
        const pid = selectedPillar.toLowerCase() as PillarId
        const hardcodedP = PILLARS.find((p) => p.id === pid)
        const useFallback =
            pillarProtos.length === 0 &&
            pillarScore !== null &&
            pillarScore < 75 &&
            hardcodedP
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    width: "100%",
                    /* Desktop: maxWidth 1180 + flex 1 + center vertical para
                       que CodexCarousel desktop (hasta 1100) entre sin
                       recortar y los libros se centren en pantalla.
                       v1.18 — Mobile padding-top 28 → 60 para bajar el
                       título del pillar detail debajo del botón
                       "Volver" (que vive en top:14 portaleado).
                       v1.26 — Padding-top mobile suma safe-area-inset-top
                       para que en PWA standalone el título no quede bajo
                       el notch. El botón "Volver" ahora también respeta
                       la safe-area así que ambos viven en la misma franja. */
                    maxWidth: isMobile ? 680 : 1180,
                    padding: isMobile
                        ? "calc(60px + env(safe-area-inset-top, 0px)) 0 16px"
                        : "44px 0 24px",
                    alignItems: "center",
                    justifyContent: isMobile ? "flex-start" : "center",
                    flex: isMobile ? "initial" : 1,
                    minHeight: isMobile ? "auto" : "calc(100vh - 200px)",
                    position: "relative",
                }}
            >
                {!isMobile &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.button
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                if (openCodexId) setOpenCodexId(null)
                                else onSelectPillar(null)
                            }}
                            style={{
                                /* v?.? — Botón back desktop pasa de
                                   position:absolute (anclado al
                                   container ModuloDetail) a fixed top:18
                                   left:24, alineado verticalmente con la
                                   barra superior de tabs RADAR / CALIBRACIÓN
                                   / HOLOTECA / NÚCLEO del shell. Antes
                                   quedaba flotando bajo la barra y se veía
                                   off del nav. Tamaño sube de 68×32 a
                                   100×44 (más grande para que el ojo lo
                                   detecte como botón principal de back). */
                                position: "fixed",
                                top: 18,
                                left: 24,
                                zIndex: 70,
                                width: 100,
                                height: 44,
                                borderRadius: 22,
                                background: `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hx(accent, 0.06)}`,
                                border: `1px solid ${hx(accent, 0.38)}`,
                                color: hx(accent, 0.95),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                cursor: "pointer",
                                outline: "none",
                                backdropFilter:
                                    "blur(20px) saturate(160%) brightness(1.08)",
                                WebkitBackdropFilter:
                                    "blur(20px) saturate(160%) brightness(1.08)",
                                boxShadow: [
                                    `0 6px 20px ${hx(accent, 0.18)}`,
                                    `0 2px 6px rgba(0,0,0,0.4)`,
                                    `inset 0 0 18px ${hx(accent, 0.1)}`,
                                    `inset 0 1px 0 ${hx("#FFFFFF", 0.22)}`,
                                    `0 0 0 0.5px ${hx(accent, 0.14)}`,
                                ].join(", "),
                                WebkitTapHighlightColor: "transparent",
                            }}
                            aria-label="Volver"
                            data-rsv-back-button="true"
                        >
                            <svg
                                width={20}
                                height={20}
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
                        </motion.button>,
                        document.body
                    )}
                {isMobile &&
                    !hideForOverlay &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.button
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                if (openCodexId) setOpenCodexId(null)
                                else onSelectPillar(null)
                            }}
                            style={{
                                position: "fixed",
                                /* v1.26 — top respeta safe-area-inset-top
                                   para que en PWA standalone iOS no quede
                                   detrás del reloj/batería. Sin esto, con
                                   viewport-fit=cover el lienzo se extiende
                                   hasta el borde físico y el botón a
                                   top:14 chocaba con la franja del notch. */
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
                                padding: 0,
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
                            aria-label="Volver"
                            data-rsv-back-button="true"
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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                    }}
                >
                    <h2
                        className="esc-titan-title"
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 22 : 28,
                            fontWeight: 200,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            textAlign: "center",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {fullLabel}
                    </h2>
                    {pillarScore !== null && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.28)",
                                fontFamily: "'Inter',sans-serif",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                            }}
                        >
                            Índice {pillarScore}%
                        </p>
                    )}
                </div>
                {pillarProtos.length > 0 && !openCodexId && (
                    <CodexCarousel
                        protos={[...pillarProtos].sort(
                            (a, b) => a.fase - b.fase
                        )}
                        accent={accent}
                        isMobile={isMobile}
                        onOpen={(id) => {
                            if (!isActiveMember) {
                                onFreemiumBlock?.(selectedPillar || undefined)
                                return
                            }
                            setOpenCodexId(id)
                            /* #5 mood — onda dorada del campo cuando el
                               Tripulante pone en marcha una Calibración (el
                               Enrutador la enciende). Momento distinto de la
                               onda táctil #3 (que es al TOCAR la card o el
                               acordeón). onOpen no trae el evento → centro del
                               viewport. */
                            fireFieldWave(
                                window.innerWidth / 2,
                                window.innerHeight / 2,
                                { color: "#D4A843" }
                            )
                        }}
                    />
                )}
                {pillarProtos.length > 0 && openCodexId ? (
                    pillarProtos
                        .filter((pr) => pr.id === openCodexId)
                        .map((pr) => {
                            const comp = Array.isArray(pr.tareas_completadas)
                                ? pr.tareas_completadas
                                : []
                            return (
                                <motion.div
                                    key={pr.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: isMobile
                                            ? "30px 18px 24px"
                                            : "40px 38px 32px",
                                        borderRadius: 18,
                                        /* v1.27 — modal del tomo más luminoso:
                                           background con más opacidad (0.78
                                           → 0.92), borde dorado-cyan al 28%
                                           (antes 10%), shadow interna sutil
                                           para sentir lift sin perder la
                                           paleta del Escáner. */
                                        background:
                                            "linear-gradient(165deg,rgba(10,28,52,0.92),rgba(6,18,38,0.96))",
                                        border: `1px solid ${hx(accent, 0.28)}`,
                                        boxShadow: `inset 0 1px 0 ${hx("#FFFFFF", 0.06)}, 0 18px 44px rgba(0,0,0,0.45), 0 0 0 0.5px ${hx(accent, 0.12)}`,
                                        position: "relative",
                                        overflow: "hidden",
                                        width: "100%",
                                    }}
                                >
                                    <div className="esc-corner esc-corner-tl">
                                        <CSvg color={hx(accent, 0.45)} />
                                    </div>
                                    <div className="esc-corner esc-corner-tr">
                                        <CSvg color={hx(accent, 0.45)} />
                                    </div>
                                    <div className="esc-corner esc-corner-bl">
                                        <CSvg color={hx(accent, 0.45)} />
                                    </div>
                                    <div className="esc-corner esc-corner-br">
                                        <CSvg color={hx(accent, 0.45)} />
                                    </div>
                                    {/* v1.27 — Título centrado, blanco
                                       con realce sutil de accent. Antes
                                       era cyan al 50% alineado a la
                                       izquierda; ahora hero centrado
                                       con peso dramatico para anclar la
                                       cabeza del tomo. */}
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: isMobile ? 15 : 16,
                                            fontWeight: 600,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: "#FFFFFF",
                                            fontFamily: "'Inter',sans-serif",
                                            marginBottom: 6,
                                            textAlign: "center",
                                            lineHeight: 1.4,
                                            textShadow: `0 0 12px ${hx(accent, 0.55)}, 0 0 22px ${hx(accent, 0.22)}`,
                                        }}
                                    >
                                        {pr.titulo}
                                    </p>
                                    <p
                                        style={{
                                            margin: "0 0 18px",
                                            fontSize: 11,
                                            color: hx(accent, 0.65),
                                            fontFamily: "'Inter',sans-serif",
                                            textAlign: "center",
                                            letterSpacing: "0.24em",
                                            textTransform: "uppercase",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Fase {pr.fase}
                                    </p>
                                    {/* Divisor de acento bajo el encabezado */}
                                    <div
                                        style={{
                                            height: 1,
                                            margin: "0 0 16px",
                                            background: `linear-gradient(90deg, transparent, ${hx(accent, 0.45)}, transparent)`,
                                        }}
                                    />
                                    {/* Secciones colapsables — todo arranca
                                        minimizado; el Tripulante despliega lo
                                        que quiere leer (no más muro de texto). */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {pr.alerta_text && (
                                            <Collapse
                                                open={openSections.has(
                                                    "lectura"
                                                )}
                                                onToggle={() =>
                                                    toggleSection("lectura")
                                                }
                                                accent={accent}
                                                eyebrow
                                                title="◈ Lectura del sistema"
                                            >
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: isMobile
                                                            ? 14.5
                                                            : 15,
                                                        fontWeight: 400,
                                                        lineHeight: 1.72,
                                                        color: "rgba(255,255,255,0.92)",
                                                        fontFamily:
                                                            "'Inter',sans-serif",
                                                    }}
                                                >
                                                    {pr.alerta_text}
                                                </p>
                                            </Collapse>
                                        )}
                                        {pr.sugerencia_text && (
                                            <Collapse
                                                open={openSections.has(
                                                    "directiva"
                                                )}
                                                onToggle={() =>
                                                    toggleSection("directiva")
                                                }
                                                accent={accent}
                                                eyebrow
                                                title="⌖ Directiva"
                                            >
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 13.5,
                                                        fontWeight: 300,
                                                        lineHeight: 1.78,
                                                        color: "rgba(255,255,255,0.78)",
                                                        fontFamily:
                                                            "'Inter',sans-serif",
                                                    }}
                                                >
                                                    {pr.sugerencia_text}
                                                </p>
                                            </Collapse>
                                        )}
                                    </div>
                                    {(Array.isArray(pr.tareas_json)
                                        ? pr.tareas_json
                                        : []
                                    ).length > 0 && (
                                        <>
                                            <div
                                                style={{
                                                    height: 1,
                                                    margin: "16px 0 14px",
                                                    background: `linear-gradient(90deg, transparent, ${hx(accent, 0.32)}, transparent)`,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: 9.5,
                                                    fontWeight: 700,
                                                    letterSpacing: "0.24em",
                                                    textTransform: "uppercase",
                                                    color: hx(accent, 0.7),
                                                    marginBottom: 12,
                                                }}
                                            >
                                                Anclajes ·{" "}
                                                {
                                                    (Array.isArray(
                                                        pr.tareas_json
                                                    )
                                                        ? pr.tareas_json
                                                        : []
                                                    ).length
                                                }
                                            </div>
                                        </>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {(Array.isArray(pr.tareas_json)
                                            ? pr.tareas_json
                                            : []
                                        ).map((t) => {
                                            const ch = comp.includes(t.id)
                                            /* Título corto para la fila
                                               colapsada (antes de ":" o de la
                                               1a frase); el resto se revela al
                                               desplegar. */
                                            const d = (t.desc || "").trim()
                                            const colon = d.indexOf(":")
                                            const dot = d.indexOf(". ")
                                            let tTitle = d
                                            let tRest = ""
                                            if (colon > 0 && colon <= 60) {
                                                tTitle = d.slice(0, colon).trim()
                                                tRest = d.slice(colon + 1).trim()
                                            } else if (dot > 0 && dot <= 80) {
                                                tTitle = d.slice(0, dot + 1).trim()
                                                tRest = d.slice(dot + 2).trim()
                                            }
                                            const tBody = tRest || d
                                            const k = "task-" + t.id
                                            return (
                                                <Collapse
                                                    key={t.id}
                                                    open={openSections.has(k)}
                                                    onToggle={() =>
                                                        toggleSection(k)
                                                    }
                                                    accent={accent}
                                                    titleColor={
                                                        ch
                                                            ? hx(accent, 0.85)
                                                            : "rgba(255,255,255,0.92)"
                                                    }
                                                    title={
                                                        <span
                                                            style={{
                                                                textDecoration:
                                                                    ch
                                                                        ? "line-through"
                                                                        : "none",
                                                            }}
                                                        >
                                                            {tTitle}
                                                        </span>
                                                    }
                                                    headerLeft={
                                                        <div
                                                            role="button"
                                                            aria-label="Marcar anclaje como completado"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onToggleTask(
                                                                    pr.protocolo_id,
                                                                    t.id
                                                                )
                                                            }}
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 8,
                                                                flexShrink: 0,
                                                                border: `1.5px solid ${ch ? accent : hx(accent, 0.3)}`,
                                                                background: ch
                                                                    ? accent
                                                                    : "transparent",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                boxShadow: ch
                                                                    ? `0 0 12px ${hx(accent, 0.6)}`
                                                                    : "none",
                                                                cursor: "pointer",
                                                                transition:
                                                                    "all 0.2s ease",
                                                            }}
                                                        >
                                                            {ch && (
                                                                <svg
                                                                    width="13"
                                                                    height="13"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="#04101F"
                                                                    strokeWidth="3.2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    }
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 13.5,
                                                            fontWeight: 400,
                                                            lineHeight: 1.65,
                                                            color: ch
                                                                ? hx(accent, 0.7)
                                                                : "rgba(255,255,255,0.82)",
                                                            fontFamily:
                                                                "'Inter',sans-serif",
                                                        }}
                                                    >
                                                        {tBody}
                                                    </p>
                                                </Collapse>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )
                        })
                ) : pillarProtos.length === 0 && useFallback ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: isMobile ? "18px 14px" : "28px 32px",
                            borderRadius: 16,
                            background:
                                "linear-gradient(165deg,rgba(5,15,30,0.6),rgba(2,8,20,0.8))",
                            border: `1px solid ${hx(accent, 0.1)}`,
                            position: "relative",
                            overflow: "hidden",
                            width: "100%",
                        }}
                    >
                        <div className="esc-corner esc-corner-tl">
                            <CSvg color={hx(accent, 0.3)} />
                        </div>
                        <div className="esc-corner esc-corner-tr">
                            <CSvg color={hx(accent, 0.3)} />
                        </div>
                        <div className="esc-corner esc-corner-bl">
                            <CSvg color={hx(accent, 0.3)} />
                        </div>
                        <div className="esc-corner esc-corner-br">
                            <CSvg color={hx(accent, 0.3)} />
                        </div>
                        <p
                            style={{
                                margin: "0 0 8px",
                                fontSize: 14,
                                fontWeight: 400,
                                lineHeight: 1.6,
                                color: "rgba(255,255,255,0.55)",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            {hardcodedP!.protocol.alert}
                        </p>
                        <p
                            style={{
                                margin: "0 0 16px",
                                fontSize: 13,
                                fontWeight: 300,
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.35)",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            {hardcodedP!.protocol.suggestion}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {hardcodedP!.protocol.tasks.map((t) => (
                                <div
                                    key={t.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 12,
                                        padding: "12px 14px",
                                        borderRadius: 10,
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.04)",
                                        minHeight: 44,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            border: "1.5px solid rgba(255,255,255,0.12)",
                                            flexShrink: 0,
                                            marginTop: 1,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 300,
                                            lineHeight: 1.6,
                                            color: "rgba(255,255,255,0.5)",
                                            fontFamily: "'Inter',sans-serif",
                                        }}
                                    >
                                        {t.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : pillarProtos.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <p
                            style={{
                                fontSize: 14,
                                fontWeight: 300,
                                color: "rgba(255,255,255,0.3)",
                                fontFamily: "'Inter',sans-serif",
                                lineHeight: 1.8,
                            }}
                        >
                            {pillarScore !== null && pillarScore >= 50
                                ? "Este pilar opera por encima del umbral de intervención."
                                : "Sondea este pilar para que el Enrutador asigne un protocolo."}
                        </p>
                    </div>
                ) : null}
            </motion.div>
        )
    }

    /* ═══ PILLAR CARD renderer (shared mobile & desktop) ═══ */
    const renderCard = (
        pilar: string,
        label1: string,
        label2: string,
        id: PillarId,
        svg: React.ReactNode,
        cardStyle?: React.CSSProperties,
        inactive: boolean = false
    ) => {
        const score = scores[id]
        return (
            <motion.div
                key={pilar}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                data-drag-target=""
                role="button"
                aria-label={`${label1} ${label2}`}
                onClick={(e) => {
                    fireTouchRipple(e.clientX, e.clientY, {
                        color: accent,
                        size: 150,
                    })
                    if (inactive) {
                        setShowEnrutadorGate(true)
                    } else {
                        onSelectPillar(pilar)
                    }
                }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: isMobile ? 6 : 10,
                    cursor: "pointer",
                    padding: isMobile ? "10px 2px" : "24px 20px",
                    borderRadius: isMobile ? 14 : 22,
                    border: "none",
                    background: "transparent",
                    position: "relative",
                    WebkitTapHighlightColor: "transparent",
                    /* v1.16 — Pilares sin protocolos quedan apagados
                       (~0.35) pero siguen siendo tappeables; el
                       onClick dispara el modal del Enrutador. */
                    opacity: inactive ? 0.35 : 1,
                    transition: "opacity 0.3s ease",
                    ...cardStyle,
                }}
            >
                <div
                    style={{
                        animation: "esc-mon-float 6s ease-in-out infinite",
                    }}
                >
                    {svg}
                </div>
                <div style={{ textAlign: "center" }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.9)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {label1}
                    </p>
                    <p
                        style={{
                            margin: "2px 0 0",
                            fontSize: isMobile ? 10 : 10,
                            fontWeight: 400,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.55)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {label2}
                    </p>
                </div>
                {score !== null && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 300,
                            color: "rgba(255,255,255,0.7)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {score}%
                    </p>
                )}
            </motion.div>
        )
    }

    if (isMobile) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    /* v1.8 — padding-top 4px para alinear el título a
                       la misma altura que el de HOLOTECA. flex:1 para
                       que el grid de pilares pueda centrarse vertical
                       en el espacio restante (margin-top auto).
                       2026-05-05 — env(safe-area-inset-top) empuja el
                       título por la altura del notch SOLO en PWA
                       standalone iOS. Web normal: env() = 0, queda 4px. */
                    padding:
                        "calc(4px + env(safe-area-inset-top, 0px)) 0 30px",
                    gap: 0,
                    flex: 1,
                }}
            >
                {/* v1.8 — Mobile: título en barra superior + subtítulo
                    en SEGUNDA fila debajo (antes los dos compartían
                    fila lo cual se salía de visión en pantallas chicas).
                    Padding-left 4 para que arranque a la misma distancia
                    del borde que HOLOTECA. */}
                <motion.div
                    /* v1.12 — Animación de entrada idéntica al título
                       de HOLOTECA en AppNavegacionMobile (mismo
                       initial, animate, transition con ease easeOut)
                       y CSS animation nuc-breath en lugar de
                       esc-nuc-breath: el ritmo de respiración es el
                       mismo en los tres títulos del Lente. */
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{
                        width: "100%",
                        textAlign: "left",
                        paddingLeft: 4,
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 14,
                            fontWeight: 200,
                            letterSpacing: "0.22em",
                            marginRight: "-0.22em",
                            textTransform: "uppercase",
                            margin: 0,
                            lineHeight: 1,
                            userSelect: "none",
                            color: "transparent",
                            filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                            WebkitFontSmoothing: "antialiased",
                            animation: "nuc-breath 7s ease-in-out infinite",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span
                            style={{
                                background: `linear-gradient(180deg, ${accent}, #fff)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Calibración
                        </span>
                    </h2>
                    {/* v1.11 — Subtítulo "Selecciona un pilar"
                        removido. La acción es obvia al ver los 6
                        pilares; el subtítulo solo agregaba ruido. Si
                        no hay protocolos cargados, ProtocolosEmptyState
                        ya cuenta su propio mensaje. */}
                </motion.div>
                {!dbLoaded ? null : (
                    <>
                        {/* v1.17 — Top-spacer flex:1 para centrar
                            el grid vertical en el espacio entre el
                            título y el dock. minHeight:24 garantiza
                            un colchón mínimo si el viewport es bajo. */}
                        <div style={{ flex: 1, minHeight: 24 }} />
                        <div
                            style={{
                                display: "grid",
                                /* En PWA standalone usamos 2 columnas
                                   × 3 filas. v1.26 — rowGap baja de 36
                                   a 14 y columnGap de 12 a 8 para que
                                   las 3 filas (con su nombre + porcentaje
                                   bajo el ícono) entren en la altura
                                   disponible sin que el último par
                                   chocara con el dock inferior. */
                                gridTemplateColumns: isPWA
                                    ? "repeat(2, minmax(0, 1fr))"
                                    : "repeat(3, minmax(0, 1fr))",
                                columnGap: isPWA ? 8 : 4,
                                rowGap: isPWA ? 14 : 28,
                                width: "100%",
                                maxWidth: "100%",
                                boxSizing: "border-box",
                                justifyItems: "center",
                                alignContent: "center",
                            }}
                        >
                            {pillarActivity.map(({ row, inactive }) => {
                                const [
                                    pilar,
                                    label1,
                                    label2,
                                    id,
                                    svg,
                                ] = row
                                return (
                                    <div
                                        key={pilar as string}
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            minWidth: 0,
                                        }}
                                    >
                                        {renderCard(
                                            pilar as string,
                                            label1 as string,
                                            label2 as string,
                                            id as PillarId,
                                            svg as React.ReactNode,
                                            {
                                                width: "100%",
                                                /* PWA: minHeight ajustado
                                                   a 150 para que las 3
                                                   filas + título + dock
                                                   quepan en iPhone mobile
                                                   PWA standalone. v1.26
                                                   bajó de 190 a 150 tras
                                                   reporte de Zak: la
                                                   última fila se cortaba
                                                   y el % de Vector/Órbita
                                                   no aparecía. */
                                                minHeight: isPWA ? 150 : 130,
                                            },
                                            inactive
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ flex: 1, minHeight: 16 }} />
                    </>
                )}
                {/* v1.16 — Modal del Enrutador para mobile (mismo
                    contenido que el de desktop pero contenido aquí
                    porque el branch mobile retorna early). */}
                {showEnrutadorGate &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            onClick={() => setShowEnrutadorGate(false)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 1500,
                                background: "rgba(2,5,12,0.88)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "24px 18px",
                            }}
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0, scale: 0.96 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 10, opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.28 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    maxWidth: 380,
                                    width: "100%",
                                    padding: "32px 28px",
                                    borderRadius: 18,
                                    border: `1px solid ${hx(accent, 0.4)}`,
                                    background: "rgba(5,10,20,0.95)",
                                    color: "#fff",
                                    textAlign: "center",
                                    boxShadow: `0 0 24px ${hx(accent, 0.25)}`,
                                }}
                            >
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        fontWeight: 300,
                                        color: "rgba(255,255,255,0.78)",
                                        lineHeight: 1.6,
                                        fontFamily: "'Inter',sans-serif",
                                    }}
                                >
                                    Sondea un pilar en el Escáner para que
                                    el Enrutador active tu primera
                                    calibración.
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowEnrutadorGate(false)
                                    }
                                    style={{
                                        marginTop: 24,
                                        padding: "10px 28px",
                                        borderRadius: 10,
                                        border: `1px solid ${hx(accent, 0.5)}`,
                                        background: hx(accent, 0.12),
                                        color: hx(accent, 0.95),
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        cursor: "pointer",
                                        outline: "none",
                                    }}
                                >
                                    Entendido
                                </button>
                            </motion.div>
                        </motion.div>,
                        document.body
                    )}
            </motion.div>
        )
    }

    /* Desktop: grilla 3x2 simultánea. v3.3 — Quitamos el padding-top
       del Modulos (antes 90, antes 128). El wrapper esc-scroll del
       Escáner ya aplica 96px arriba para librar la NavegadorEstacion;
       sumar 90 más caía al doble. Ahora padding-top 0 deja al
       título "Protocolos Quirúrgicos" a la misma altura visual que
       "MI NÚCLEO" (titleTopOffsetPx 102 — match aproximado). */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 40,
                width: "100%",
                /* v1.21 — padding-bottom 60→0 + minHeight para que la
                   vista llene el viewport sin generar scroll vacío
                   bajo la grilla. */
                padding: 0,
                minHeight: "calc(100vh - 240px)",
            }}
        >
            {/* v3.4 — Desktop: título con el MISMO estilo que MI NÚCLEO
                desktop (gradient text 180deg accent→#fff + drop-shadow
                cyan + esc-nuc-breath). fontSize 72 (igual que pageTitleSize
                default de Mi Núcleo), letterSpacing 0.4em + marginRight
                -0.4em para compensar tracking de la última letra,
                fontWeight 100. Subtítulo a 14px gris tenue.
                v1.9 — marginTop 8px para que la BASE del título quede
                a la misma altura que la BASE del título "MI NÚCLEO"
                (el esc-scroll del Escáner tiene padding-top 96; sumamos
                ~6-8 para llegar al offset 102 que usa MiNucleo). */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ textAlign: "center", marginTop: 8 }}
            >
                <h2
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        /* v1.13 — fontSize 72 (igual a MI NÚCLEO desktop
                           pageTitleSize). letterSpacing 0.4em vuelve al
                           default de MiNucleo. Una sola palabra
                           "Calibración" cabe cómoda sin estirar ancho. */
                        fontSize: 72,
                        fontWeight: 100,
                        letterSpacing: "0.4em",
                        marginRight: "-0.4em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        userSelect: "none",
                        color: "transparent",
                        filter: `drop-shadow(0 0 12px ${hx(accent, 0.25)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "esc-nuc-breath 7s ease-in-out infinite",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        Calibración
                    </span>
                </h2>
                <p
                    style={{
                        margin: "12px 0 0",
                        fontSize: 14,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Inter',sans-serif",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        minHeight: 18,
                    }}
                >
                    {dbLoaded ? "Selecciona un pilar" : ""}
                </p>
            </motion.div>
            {!dbLoaded ? null : (
                <>
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: 1100,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gridTemplateRows: "repeat(2, 1fr)",
                                rowGap: 28,
                                columnGap: 36,
                                width: "100%",
                                maxWidth: 960,
                                justifyItems: "center",
                            }}
                        >
                            {pillarActivity.map(({ row, inactive }) => {
                                const [pilar, label1, label2, id, svg] = row
                                return renderCard(
                                    pilar as string,
                                    label1 as string,
                                    label2 as string,
                                    id as PillarId,
                                    svg as React.ReactNode,
                                    { width: "100%" },
                                    inactive
                                )
                            })}
                        </motion.div>
                    </div>
                </>
            )}
            {/* v1.16 — Modal del Enrutador (compartido mobile/desktop)
                que se dispara al tocar un pilar inactivo. */}
            {showEnrutadorGate &&
                typeof document !== "undefined" &&
                createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={() => setShowEnrutadorGate(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1500,
                            background: "rgba(2,5,12,0.88)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 18px",
                        }}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.96 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 10, opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.28 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: 380,
                                width: "100%",
                                padding: "32px 28px",
                                borderRadius: 18,
                                border: `1px solid ${hx(accent, 0.4)}`,
                                background: "rgba(5,10,20,0.95)",
                                color: "#fff",
                                textAlign: "center",
                                boxShadow: `0 0 24px ${hx(accent, 0.25)}`,
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 300,
                                    color: "rgba(255,255,255,0.78)",
                                    lineHeight: 1.6,
                                    fontFamily: "'Inter',sans-serif",
                                }}
                            >
                                Sondea un pilar en el Escáner para que el
                                Enrutador active tu primera calibración.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowEnrutadorGate(false)}
                                style={{
                                    marginTop: 24,
                                    padding: "10px 28px",
                                    borderRadius: 10,
                                    border: `1px solid ${hx(accent, 0.5)}`,
                                    background: hx(accent, 0.12),
                                    color: hx(accent, 0.95),
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                Entendido
                            </button>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
        </motion.div>
    )
}

export default ModulosView
