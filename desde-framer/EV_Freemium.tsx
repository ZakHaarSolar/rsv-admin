// EV_Freemium.tsx v2.6 — #5 Estados de ánimo del campo: al ABRIRSE el muro de pago, el campo
// se abre con una onda DORADA (fireFieldWave desde el centro de la pantalla, apertura no alerta),
// disparada una sola vez al montar el modal. TODOS los muros duros (Radar · Calibración · Materia ·
// Sueños · Navegantes) reusan el PlanSelector unificado; solo cambia el título + texto principal
// por contexto (el soft nudge del decoder/sueños queda inline). Calibración con copy nuevo
// ("...y los demás pilares... desbloquea todas las calibraciones... Actívala aquí:").
// v2.4 — El muro "sintonia" se delega al PlanSelector (selector de
// planes con tarjeta RECOMENDADO + "Conocer todos los beneficios" carrusel + countdown
// del próximo escaneo). Los demás kinds siguen con el modal dorado inline; el carrusel
// de esos kinds ahora activa Sintonía vía onActivate. v2.3 — Muro "sintonia": copy nuevo ("tu vibración inicial ha
// sido registrada en nuestro radar... para medir transmutación real", sin
// "fluctuaciones estáticas" ni "geometría"). v2.2 — el muro de Sueños (kind="dream") soporta el modo
// invitación suave (soft): tras el 1er/2do sueño muestra "Te quedan X de 3
// lecturas" e invita sin bloquear, en vez del copy de límite alcanzado.
// v2.1 — Muro del Decodificador ofrece el tier 199 (Decodificador
// ilimitado) como CTA primario + upsell a Sintonía Solar 599, y modo
// invitación suave (props soft + shotsRemaining): tras el 1er/2º escaneo
// del invitado aparece "Te quedan X de 3 · desbloquea ilimitado por 199",
// cerrable y no bloqueante. En web el 199 usa DECODER_SOLAR_LINK; si está
// vacío (link de Stripe aún pendiente) degrada al CTA de Sintonía.
// v2.0 — Refinado de copy:
// (1) Modal "Membrana 1 cumplida" más conciso, sin EM dash, cierra con
//     "abre simultáneamente el ecosistema entero del Escáner Vibracional."
// (2) Decoder gate: "tres disparos" → "tres decodificaciones".
// EV_Freemium.tsx v1.9
// v1.9 — Cuatro cambios:
// (1) Nueva variante kind="navegantes" — gate disparado al picar Membrana
//     2+ del Navegante de la Red. Copy adaptado al simulador.
// (2) Botón secundario "Conocer todos los beneficios" debajo del CTA
//     dorado en TODOS los gates. Abre BeneficiosSintonia (modal premium
//     compartido con listado completo del ecosistema).
// (3) Cuando se abre el modal de beneficios, la fila correspondiente al
//     gate origen (radar/decoder/calibraciones/navegantes) se resalta en
//     dorado para anclar visualmente el "esto es lo que estabas pidiendo".
// (4) levelLabel del modal de beneficios va con eyebrow "INMERSIÓN ·
//     SINTONÍA SOLAR" para que se sepa qué tier abre.
// EV_Freemium.tsx v1.8
// v1.8 — Pulidos visuales del gate sintonia con cooldown:
// (1) "no fluctuaciones estáticas" pasa a línea propia (\n extra
//     entre "real," y "no").
// (2) Botón X de cierre sin border, tamaño font subido de 14 a
//     22 para compensar y mantener visibilidad. La X flota sin
//     marco.
// EV_Freemium.tsx v1.7
// v1.7 — Reorganización del gate sintonia cuando llega cooldownLabel
// (pilar bloqueado en cooldown global):
// (1) El eyebrow "INTENTO DE 2DO ESCANEO" se OCULTA. El título
//     "HOLOGRAMA BASE SELLADO" pasa a ser lo primero del modal.
// (2) Body separa las dos frases iniciales con \n para que
//     "Nuestro radar opera en ciclos..." arranque en línea propia
//     en lugar de seguir corriendo después de "registrada.".
// (3) El countdown se MUEVE de arriba (debajo del eyebrow) a abajo
//     (debajo del CTA). Texto extendido: "Próximo escaneo en X d
//     Y h al activar tu Sintonía Solar".
// (4) Mantiene el estilo dorado uppercase del eyebrow original
//     (Zak: "me gustó ese estilo de letra").
// EV_Freemium.tsx v1.6
// v1.6 — Prop opcional `cooldownLabel`. Cuando llega y kind es
// "sintonia", se renderiza un sub-eyebrow dorado con "Próximo
// escaneo en {cooldownLabel}". Lo dispara EscanerVibracional al
// abrir el gate desde un pilar bloqueado en cooldown global —
// el tripulante ve cuánto le falta para que el siguiente escaneo
// esté disponible al activar Sintonía Solar.
// EV_Freemium.tsx v1.5
// v1.5 — Botón "Activar Sintonía Solar" del gate centrado en
// desktop. El display:flex column lo hace bloque, y sin margin auto
// se alineaba a la izquierda en monitores anchos pese al text-align
// center del modal padre. Margin: 0 auto lo centra en cualquier
// ancho.
// EV_Freemium.tsx v1.4
// v1.4 — Eyebrow del gate sintonia acortado: "Intento de 2º escaneo
// registrado" → "Intento de 2do escaneo". El texto largo + las dos
// viñetas dejaba la última viñeta sola en una segunda línea. Ahora
// entra todo en una sola línea con viñetas a ambos lados.
// EV_Freemium.tsx v1.3
// v1.3 — Tres pulidos visuales:
// (1) CTA en dos filas: arriba "ACTIVAR SINTONÍA SOLAR" (uppercase),
//     abajo "777 MXN/mes" (font más chico, opacidad 0.78). Mismo
//     estilo en todos los gates (sintonia, decoder, protocolos).
// (2) Eyebrow superior con vi​ñeta inicial Y final (✦ · · · ✦)
//     para simetría visual en lugar de solo izquierda.
// (3) Rename "Tomo quirúrgico cifrado" → "Calibración cifrada" en el
//     gate de protocolos. Coherente con el rename Protocolos →
//     Calibraciones del resto del producto.
// EV_Freemium.tsx v1.2
// v1.2 — Rename copy "protocolos quirúrgicos" / "Protocolos Quirúrgicos"
// → "calibraciones" / "Calibraciones" en los bodies de los gates
// sintonia y decoder.
// EV_Freemium.tsx v1.1
// v1.1 — Defaults defensivos en props (kind, onClose) y fallback en
// COPY[kind] para que Framer no crashee al instanciar standalone con
// props undefined ("Cannot read properties of undefined (reading
// 'eyebrow')").
// EV_Freemium.tsx v1.0
// Compuerta dorada del Escáner Vibracional. Tres variantes de copy
// (sintonia/decoder/protocolos) según el disparador y CTA único al
// Payment Link de Sintonía Solar con identidad pre-rellenada. Default
// export es el componente para que otros Code Files lo importen como
// `import FreemiumGateModal from "./EV_Freemium.tsx"`.
import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"
import Shared from "./EV_Shared.tsx"
import BeneficiosSintonia from "./BeneficiosSintonia.tsx"
import PlanSelectorModal from "./PlanSelector.tsx"
const {
    withCheckoutIdentity,
    SINTONIA_SOLAR_LINK,
    DECODER_SOLAR_LINK,
    fireFieldWave,
} = Shared

type GateKind = "sintonia" | "decoder" | "protocolos" | "navegantes" | "dream"
const HIGHLIGHT_FOR_KIND: Record<
    GateKind,
    "radar" | "decoder" | "calibraciones" | "navegantes" | null
> = {
    sintonia: "radar",
    decoder: "decoder",
    protocolos: "calibraciones",
    navegantes: "navegantes",
    dream: "decoder",
}

function FreemiumGateModal({
    /* v1.1 — Defaults defensivos contra Framer instanciando standalone
       con kind undefined (".eyebrow" sobre undefined). */
    kind = "sintonia",
    pillarLabel,
    cooldownLabel,
    soft = false,
    shotsRemaining,
    onClose = () => {},
}: {
    kind?: GateKind
    pillarLabel?: string
    /* v1.6 — Etiqueta opcional para el countdown del próximo escaneo
       (ej. "5d 12h"). Sólo se muestra en kind=sintonia y cuando viene
       definida — usar cuando el gate se dispara desde un pilar bloqueado
       en cooldown global. */
    cooldownLabel?: string
    /* v2.1 — Modo invitación suave (no bloqueante) del Decodificador.
       soft=true + shotsRemaining>0 presenta el muro como nudge gentil
       ("Te quedan X de 3") que el Tripulante cierra y sigue usando sus
       disparos restantes. Solo aplica a kind=decoder. */
    soft?: boolean
    shotsRemaining?: number
    link?: string
    onClose?: () => void
}) {
    /* v1.9 — Estado del modal de beneficios premium (overlay encima del gate). */
    const [benefitsOpen, setBenefitsOpen] = useState(false)
    /* #5 Estados de ánimo — el campo SE ABRE al aparecer el muro: una onda
       dorada irradia desde el centro de la pantalla (apertura, no alerta).
       El componente se monta sólo cuando el gate pasa a visible, así que una
       sola vez al montar = una sola vez por apertura. Guard por ref por si el
       efecto se re-ejecuta. */
    const moodFiredRef = useRef(false)
    useEffect(() => {
        if (moodFiredRef.current) return
        if (typeof window === "undefined") return
        moodFiredRef.current = true
        try {
            fireFieldWave?.(
                window.innerWidth / 2,
                window.innerHeight / 2,
                { color: "#D4A843" }
            )
        } catch {}
    }, [])
    /* v2.1 — Navegación a checkout. goSintonia: Payment Link de Sintonía
       (599). goDecoder: Payment Link del tier 199; si DECODER_SOLAR_LINK
       está vacío (aún no creado en Stripe) cae a Sintonía. */
    const goSintonia = () => {
        if (typeof window === "undefined") return
        const dest =
            withCheckoutIdentity(SINTONIA_SOLAR_LINK) || SINTONIA_SOLAR_LINK
        if (!dest) return
        try {
            window.location.href = dest
        } catch {
            try {
                window.location.assign(dest)
            } catch {}
        }
    }
    const goDecoder = () => {
        if (typeof window === "undefined") return
        const base = DECODER_SOLAR_LINK
        if (!base) {
            goSintonia()
            return
        }
        const dest = withCheckoutIdentity(base) || base
        if (!dest) return
        try {
            window.location.href = dest
        } catch {
            try {
                window.location.assign(dest)
            } catch {}
        }
    }
    /* Copy por variante:
       - sintonia: intento de 2º ciclo del Radar.
       - decoder: 4to disparo del Decodificador.
       - protocolos: tomo quirúrgico bloqueado, inserta nombre de pilar. */
    const pillarText = (pillarLabel || "este pilar").toUpperCase()
    const COPY: Record<
        GateKind,
        { eyebrow: string; title: string; body: string; cta: string; ctaSub: string }
    > = {
        sintonia: {
            eyebrow: "Intento de 2do escaneo",
            title: "Holograma base sellado",
            body: "Tu vibración inicial ha sido registrada.\n\nPara volver a calibrar tu campo la próxima semana, acceder a las calibraciones y más beneficios, requieres elevar tu frecuencia.",
            cta: "Activar Sintonía Solar",
            ctaSub: "599 MXN/mes",
        },
        decoder: {
            eyebrow: "Has decodificado 3 materias",
            title: "Continúa decodificando sin límite",
            body: "Tus tres decodificaciones iniciales ya fueron emitidas. Tu Sintonía Solar abre el Decodificador sin tope, los escaneos continuos del radar y la biblioteca completa de Calibraciones para alinear cada pilar.",
            cta: "Activar Sintonía Solar",
            ctaSub: "599 MXN/mes",
        },
        protocolos: {
            eyebrow: "Calibración cifrada",
            title: "Ruta maestra trazada",
            body: `La ruta maestra para alinear tu ${pillarText} y los demás pilares ha sido trazada. Tu Sintonía Solar desbloquea todas las calibraciones necesarias para transmutar los 6 pilares. Actívala aquí:`,
            cta: "Activar Sintonía Solar",
            ctaSub: "599 MXN/mes",
        },
        navegantes: {
            eyebrow: "Membrana 1 cumplida",
            title: "Las 19 membranas restantes esperan tu firma",
            body: "Tu primer campo ha sido atravesado. El simulador completo despliega 20 Membranas, cada una con un código geométrico distinto.\n\nTu Sintonía Solar desencripta el resto de la ruta y abre simultáneamente el ecosistema entero del Escáner Vibracional.",
            cta: "Activar Sintonía Solar",
            ctaSub: "599 MXN/mes",
        },
        dream: {
            eyebrow: "Has decodificado 3 sueños",
            title: "Continúa decodificando tus sueños",
            body: "Tus tres lecturas de estasis ya fueron emitidas. Tu Sintonía Solar abre el Decodificador de Sueños sin tope, junto con el Decodificador de Materia, el re-escaneo del Radar cada 7 días y la biblioteca completa de Calibraciones.",
            cta: "Activar Sintonía Solar",
            ctaSub: "599 MXN/mes",
        },
    }
    const copy = COPY[kind] || COPY.sintonia
    /* v2.1 — El tier Decodificador (199) se ofrece en web solo cuando ya
       existe su Payment Link; sin link degradamos al CTA de Sintonía para
       no dejar un botón muerto. */
    const isDecoder = kind === "decoder"
    const isDream = kind === "dream"
    const offerDecoderTier = isDecoder && !!DECODER_SOLAR_LINK
    const remainingLine =
        soft && typeof shotsRemaining === "number" && shotsRemaining > 0
            ? `Aún tienes ${shotsRemaining} decodificación${shotsRemaining === 1 ? "" : "es"} gratis. `
            : "Tus tres decodificaciones iniciales ya fueron emitidas. "
    /* Línea de cupo del muro de Sueños — espejo de remainingLine con el
       lenguaje de estasis. En modo invitación suave invita sin bloquear. */
    const dreamRemainingLine =
        soft && typeof shotsRemaining === "number" && shotsRemaining > 0
            ? `Aún tienes ${shotsRemaining} lectura${shotsRemaining === 1 ? "" : "s"} de estasis gratis. `
            : "Tus tres lecturas de estasis ya fueron emitidas. "
    const view: {
        eyebrow: string
        title: string
        body: string
        primaryLabel: string
        primarySub: string
        primaryHandler: () => void
        showSintoniaSecondary: boolean
    } = isDecoder
        ? offerDecoderTier
            ? {
                  eyebrow:
                      soft &&
                      typeof shotsRemaining === "number" &&
                      shotsRemaining > 0
                          ? `Te quedan ${shotsRemaining} de 3 decodificaciones`
                          : "Has decodificado 3 materias",
                  title: "Decodifica sin límite",
                  body:
                      remainingLine +
                      "Desbloquea el Decodificador de Materia sin tope por 199 MXN al mes. O activa Sintonía Solar y abre además el re-escaneo del Radar cada 7 días, las Calibraciones de los seis pilares y la Holoteca completa.",
                  primaryLabel: "Desbloquear ilimitado",
                  primarySub: "199 MXN/mes",
                  primaryHandler: goDecoder,
                  showSintoniaSecondary: true,
              }
            : {
                  eyebrow:
                      soft &&
                      typeof shotsRemaining === "number" &&
                      shotsRemaining > 0
                          ? `Te quedan ${shotsRemaining} de 3 decodificaciones`
                          : copy.eyebrow,
                  title: "Continúa decodificando sin límite",
                  body:
                      remainingLine +
                      "Tu Sintonía Solar abre el Decodificador sin tope, los escaneos continuos del radar y la biblioteca completa de Calibraciones.",
                  primaryLabel: "Activar Sintonía Solar",
                  primarySub: "599 MXN/mes",
                  primaryHandler: goSintonia,
                  showSintoniaSecondary: false,
              }
        : isDream
          ? {
                eyebrow:
                    soft &&
                    typeof shotsRemaining === "number" &&
                    shotsRemaining > 0
                        ? `Te quedan ${shotsRemaining} de 3 lecturas`
                        : "Has decodificado 3 sueños",
                title: "Continúa decodificando tus sueños",
                body:
                    dreamRemainingLine +
                    "Tu Sintonía Solar abre el Decodificador de Sueños sin tope, junto con el Decodificador de Materia, el re-escaneo del Radar cada 7 días y la biblioteca completa de Calibraciones.",
                primaryLabel: "Activar Sintonía Solar",
                primarySub: "599 MXN/mes",
                primaryHandler: goSintonia,
                showSintoniaSecondary: false,
            }
          : {
                eyebrow: copy.eyebrow,
                title: copy.title,
                body: copy.body,
                primaryLabel: copy.cta,
                primarySub: copy.ctaSub,
                primaryHandler: goSintonia,
                showSintoniaSecondary: false,
            }
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [onClose])
    /* v2.5 — Muro DURO unificado (Radar · Calibración · Materia · Sueños ·
       Navegantes): TODOS reusan el PlanSelector (modal oscuro + tarjeta
       RECOMENDADO + carrusel de beneficios), cambiando SOLO el título + texto
       principal por contexto. El countdown del próximo escaneo solo aplica al
       Radar. El soft nudge del decodificador/sueños (invitación gentil con
       disparos restantes) conserva el modal liviano inline de abajo.
       Va DESPUÉS de todos los hooks (regla de hooks). */
    if (!soft) {
        return (
            <PlanSelectorModal
                onClose={onClose}
                cooldownLabel={kind === "sintonia" ? cooldownLabel : undefined}
                title={copy.title}
                subtitle={copy.body}
                showBenefits
            />
        )
    }
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1200,
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
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "min(540px, 100%)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "60px 32px 32px",
                    borderRadius: 22,
                    background:
                        "radial-gradient(ellipse at top, rgba(200,164,78,0.14) 0%, rgba(30,22,8,0.95) 50%, rgba(12,8,4,0.98) 100%)",
                    border: "1.5px solid rgba(212,168,67,0.45)",
                    boxShadow:
                        "0 30px 80px rgba(212,168,67,0.22), 0 0 120px rgba(212,168,67,0.08)",
                    fontFamily: "'Inter', sans-serif",
                    color: "#F5E5C4",
                    textAlign: "center",
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        /* v1.8 — Sin contorno: la X queda flotando.
                           Tamaño subido a 22 para compensar la pérdida
                           del border y mantener la tap-area visible. */
                        border: "none",
                        background: "transparent",
                        color: "#D4A843",
                        cursor: "pointer",
                        fontSize: 22,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                    }}
                >
                    ×
                </button>
                {/* v1.7 — El eyebrow superior se OCULTA cuando llega
                    cooldownLabel (gate disparado desde un pilar bloqueado
                    en cooldown). En ese caso el título es lo primero
                    del modal y el countdown se renderiza abajo del CTA.
                    En los demás casos (decoder, protocolos, sintonia
                    sin cooldown) el eyebrow sigue arriba como antes. */}
                {!(kind === "sintonia" && cooldownLabel) && (
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(212,168,67,0.7)",
                            marginBottom: 10,
                        }}
                    >
                        ✦ {view.eyebrow} ✦
                    </div>
                )}
                <h2
                    style={{
                        margin: "0 0 16px",
                        fontSize: 22,
                        fontWeight: 300,
                        letterSpacing: "0.06em",
                        color: "#F5E5C4",
                        textShadow: "0 0 18px rgba(212,168,67,0.3)",
                        lineHeight: 1.3,
                    }}
                >
                    {view.title}
                </h2>
                <p
                    style={{
                        margin: "0 auto 26px",
                        fontSize: 13.5,
                        fontWeight: 300,
                        lineHeight: 1.7,
                        color: "rgba(236,216,168,0.78)",
                        maxWidth: 420,
                        whiteSpace: "pre-line",
                    }}
                >
                    {view.body}
                </p>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        view.primaryHandler()
                    }}
                    style={{
                        width: "100%",
                        maxWidth: 360,
                        margin: "0 auto",
                        padding: "12px 22px",
                        borderRadius: 14,
                        border: "1px solid rgba(212,168,67,0.55)",
                        background:
                            "linear-gradient(135deg, rgba(212,168,67,0.28), rgba(232,198,90,0.18))",
                        color: "#F5E5C4",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        boxSizing: "border-box",
                        cursor: "pointer",
                        outline: "none",
                        boxShadow:
                            "0 0 28px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,225,150,0.2)",
                        transition: "all 0.25s ease",
                    }}
                    aria-label={`${view.primaryLabel} · ${view.primarySub}`}
                >
                    <span>{view.primaryLabel}</span>
                    <span
                        style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            opacity: 0.78,
                        }}
                    >
                        {view.primarySub}
                    </span>
                </button>
                {/* v2.1 — Botón secundario, upsell a Sintonía Solar. Solo
                    en el muro del Decodificador cuando ofrecemos el tier
                    199: el primario desbloquea el Decodificador (199),
                    este abre el ecosistema completo (599). */}
                {view.showSintoniaSecondary && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            goSintonia()
                        }}
                        style={{
                            width: "100%",
                            maxWidth: 360,
                            margin: "10px auto 0",
                            padding: "11px 22px",
                            borderRadius: 14,
                            border: "1px solid rgba(125,239,255,0.4)",
                            background:
                                "linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,229,255,0.03))",
                            color: "#CFEFFA",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12.5,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
                            boxSizing: "border-box",
                            cursor: "pointer",
                            outline: "none",
                            transition: "all 0.25s ease",
                        }}
                        aria-label="Activar Sintonía Solar · 599 MXN/mes · todo incluido"
                    >
                        <span>Activar Sintonía Solar</span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: "0.08em",
                                opacity: 0.82,
                                textTransform: "none",
                            }}
                        >
                            Todo el ecosistema · 599 MXN/mes
                        </span>
                    </button>
                )}
                {/* v1.9 — Botón secundario "Conocer todos los beneficios"
                    debajo del CTA dorado. Abre BeneficiosSintonia (modal
                    premium con listado completo del ecosistema). Estilo
                    discreto cyan tenue para no competir con el CTA principal. */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setBenefitsOpen(true)
                    }}
                    style={{
                        display: "block",
                        margin: "14px auto 0",
                        padding: "8px 18px",
                        background: "transparent",
                        border: "1px solid rgba(125,239,255,0.3)",
                        borderRadius: 999,
                        color: "rgba(180,225,240,0.85)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10.5,
                        fontWeight: 500,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.22s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                            "rgba(125,239,255,0.7)"
                        e.currentTarget.style.color = "#7DEFFF"
                        e.currentTarget.style.boxShadow =
                            "0 0 14px rgba(0,229,255,0.25)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                            "rgba(125,239,255,0.3)"
                        e.currentTarget.style.color = "rgba(180,225,240,0.85)"
                        e.currentTarget.style.boxShadow = "none"
                    }}
                >
                    ◇ Conocer todos los beneficios
                </button>
                {/* v1.7 — Countdown debajo del CTA. Mismo estilo que el
                    eyebrow superior original (uppercase dorado tenue)
                    para mantener la jerarquía visual del modal. */}
                {kind === "sintonia" && cooldownLabel && (
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(212,168,67,0.7)",
                            marginTop: 18,
                            lineHeight: 1.55,
                        }}
                    >
                        ✦ Próximo escaneo en{" "}
                        <span style={{ color: "#FFE7B0" }}>
                            {cooldownLabel}
                        </span>{" "}
                        al activar tu Sintonía Solar ✦
                    </div>
                )}
            </motion.div>
            {/* v1.9 — Modal de beneficios encima del gate. zIndex superior. */}
            {benefitsOpen && (
                <BeneficiosSintonia
                    onClose={() => setBenefitsOpen(false)}
                    highlight={HIGHLIGHT_FOR_KIND[kind]}
                    onActivate={() => {
                        setBenefitsOpen(false)
                        goSintonia()
                    }}
                />
            )}
        </motion.div>,
        document.body
    )
}

export default FreemiumGateModal
