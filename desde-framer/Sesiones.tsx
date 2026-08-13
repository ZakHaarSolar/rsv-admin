// Sesiones.tsx v3.3 — hideSesiones: 2º flag app_flags:hide_sesiones, independiente de hideCamara. Cuando está ON el shell reemplaza TODA la oferta (grupales + 1:1) por una pantalla de cortesía a pantalla completa con CTA a /escaner. | v3.2 — hideCamara: el shell lee el flag app_flags:hide_camara_solar y lo pasa a desktop/mobile (oculta la Cámara Solar cuando el Motor la apaga; cache local anti-flash). | v3.1 — Pase: "Martes" sin "TODOS LOS" (no implica recurrencia)
// Shell delegador del split SE_ — bifurcación UA-first entre SesionesDesktop
// y SesionesMobile. La lógica completa vive en archivos siblings:
//   · SE_Shared.tsx       — utilities, hooks y componentes UI compartidos
//   · SE_Icons.tsx        — todos los SVG (TimelineIcon, BIcons, VIPIcons)
//   · SE_DesktopModals.tsx — modales y HoloCard del [CENTRO DE MANDO]
//   · SE_Desktop.tsx      — SesionesDesktop + sub-components desktop
//   · SE_Mobile.tsx       — SesionesMobile + sub-components mobile
//
// Esta es la única superficie que Domo coloca en Canvas — todo el resto es
// invisible para Framer (utility-only files con default export ghost). Las
// property controls de Diego siguen viviendo aquí porque viajan adheridas
// a la función `Sesiones`.
//
// v3.0 — Split SE_ completado (2026-04-30).
// v2.x — Versiones previas del monolítico de ~353KB (ver git history).

import * as React from "react"
import { useState, useEffect, useLayoutEffect } from "react"
import { ControlType, addPropertyControls } from "framer"
import Shared from "./SE_Shared.tsx"
import SesionesDesktop from "./SE_Desktop.tsx"
import SesionesMobile from "./SE_Mobile.tsx"

const { useViewportLocal, useInjectCSS, GoldenButton, hexToRgba } = Shared

/* ═══════════════════════════════════════════════════════════════════════════
   PANTALLA DE CORTESÍA — reemplaza TODA la oferta (grupales + 1:1) cuando el
   Motor apaga app_flags:hide_sesiones (2º flag, independiente del de Cámara
   Solar que solo apaga lo grupal). Fondo transparente: el cosmos del Domo se
   ve detrás. Centrada, premium y serena — no es una pantalla de error.
   ═══════════════════════════════════════════════════════════════════════════ */
function SesionesCourtesyScreen({
    accentColor,
    textColor,
}: {
    accentColor?: string
    textColor?: string
}) {
    const accent = accentColor || "#00C2FF"
    const ink = textColor || "#E6F7EF"
    const GOLD = "#D4A843"
    const goEscaner = () => {
        try {
            const nav = (window as any).rsvNavigate
            if (typeof nav === "function") {
                nav("/escaner")
                return
            }
        } catch {}
        try {
            window.location.assign("/escaner")
        } catch {}
    }
    return (
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                padding: "60px 24px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: 540,
                    width: "100%",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: `1px solid ${hexToRgba(GOLD, 0.4)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 24px ${hexToRgba(GOLD, 0.18)}`,
                    }}
                >
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: GOLD,
                            boxShadow: `0 0 12px ${GOLD}`,
                        }}
                    />
                </div>
                <h1
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 200,
                        fontSize: 30,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        lineHeight: 1.4,
                        margin: 0,
                        color: "transparent",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: `drop-shadow(0 0 14px ${hexToRgba(accent, 0.3)})`,
                        }}
                    >
                        POR AHORA NO HAY SESIONES ABIERTAS
                    </span>
                </h1>
                <p
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 300,
                        fontSize: 15,
                        lineHeight: 1.75,
                        letterSpacing: "0.01em",
                        color: hexToRgba(ink, 0.72),
                        margin: 0,
                        maxWidth: 440,
                    }}
                >
                    En este ciclo no estamos ofreciendo Cámara Solar ni
                    sesiones 1:1. Cuando se abra la próxima ventana, lo vas a
                    ver acá.
                </p>
                <div style={{ width: "100%", maxWidth: 280, marginTop: 10 }}>
                    <GoldenButton
                        text="EXPLORAR EL ESCÁNER"
                        onClick={goEscaner}
                    />
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT: Sesiones — UA-first desktop/mobile bifurcation
   ═══════════════════════════════════════════════════════════════════════════ */
export function Sesiones(props: any) {
    useInjectCSS()
    const localVp = useViewportLocal()
    const isMobile = props.forceIsMobile === true ? true : localVp.isMobile

    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const cl = document.documentElement.classList
        if (isMobile) cl.add("rsv-is-mobile")
        else cl.remove("rsv-is-mobile")
        return () => {
            cl.remove("rsv-is-mobile")
        }
    }, [isMobile])

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    /* Flags globales de la oferta de Sesiones. Dos flags INDEPENDIENTES:
       · hide_camara_solar — apaga SOLO la sección grupal (Cámara Solar);
         el 1:1 sigue vivo. Se pasa a desktop/mobile como `hideCamara`.
       · hide_sesiones — apaga TODA la oferta (grupales + 1:1); reemplaza
         SesionesDesktop/Mobile por la pantalla de cortesía.
       Ambos se siembran del cache local para render instantáneo en visitas
       repetidas (sin flash); en la 1ª visita sin cache esperan la lectura
       (o 1.2s) para no mostrar la oferta y ocultarla/reemplazarla después. */
    const cachedHide = (() => {
        try {
            return typeof localStorage !== "undefined"
                ? localStorage.getItem("rsv-hide-camara")
                : null
        } catch {
            return null
        }
    })()
    const cachedHideSesiones = (() => {
        try {
            return typeof localStorage !== "undefined"
                ? localStorage.getItem("rsv-hide-sesiones")
                : null
        } catch {
            return null
        }
    })()
    const [hideCamara, setHideCamara] = useState(cachedHide === "1")
    const [hideSesiones, setHideSesiones] = useState(
        cachedHideSesiones === "1"
    )
    const [flagResolved, setFlagResolved] = useState(
        cachedHide !== null && cachedHideSesiones !== null
    )
    useEffect(() => {
        let cancel = false
        const url = props.supabaseUrl
        const key = props.supabaseAnonKey
        if (!url || !key) {
            setFlagResolved(true)
            return
        }
        const fallback = setTimeout(() => {
            if (!cancel) setFlagResolved(true)
        }, 1200)
        const fetchFlag = (p_key: string) =>
            fetch(`${url}/rest/v1/rpc/get_app_flag`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ p_key }),
            })
                .then((r) => (r.ok ? r.json() : false))
                .catch(() => false)
        ;(async () => {
            try {
                const [vCamara, vSesiones] = await Promise.all([
                    fetchFlag("hide_camara_solar"),
                    fetchFlag("hide_sesiones"),
                ])
                if (!cancel) {
                    const hide = vCamara === true
                    const hideAll = vSesiones === true
                    setHideCamara(hide)
                    setHideSesiones(hideAll)
                    try {
                        localStorage.setItem(
                            "rsv-hide-camara",
                            hide ? "1" : "0"
                        )
                        localStorage.setItem(
                            "rsv-hide-sesiones",
                            hideAll ? "1" : "0"
                        )
                    } catch {}
                }
            } catch {}
            if (!cancel) {
                clearTimeout(fallback)
                setFlagResolved(true)
            }
        })()
        return () => {
            cancel = true
            clearTimeout(fallback)
        }
    }, [props.supabaseUrl, props.supabaseAnonKey])

    if (!mounted || !flagResolved)
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: "100vh",
                    background: props.bgColor || "transparent",
                }}
            />
        )

    if (hideSesiones)
        return (
            <SesionesCourtesyScreen
                accentColor={props.accentColor}
                textColor={props.textColor}
            />
        )

    if (isMobile)
        return <SesionesMobile {...props} hideCamara={hideCamara} />
    return <SesionesDesktop {...props} hideCamara={hideCamara} />
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNIFIED PROPERTY CONTROLS — sin tocar (las prop controls viajan adheridas
   a la función Sesiones; mover a otro archivo las desconectaría del canvas).
   ═══════════════════════════════════════════════════════════════════════════ */
addPropertyControls(Sesiones, {
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#0B0C13",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Acento",
        defaultValue: "#00C2FF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#E6F7EF",
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 300,
        min: 0,
        max: 300,
        step: 5,
    },
    starSizeMultiplier: {
        type: ControlType.Number,
        title: "⭐ Tamaño Estrellas",
        defaultValue: 1,
        min: 0.01,
        max: 4,
        step: 0.01,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        step: 0.1,
    },
    textsUI: {
        type: ControlType.Object,
        title: "📝 Textos UI",
        controls: {
            durationTitle: {
                type: ControlType.String,
                title: "Título Duración",
                defaultValue: "DURACIÓN: 60 MINUTOS",
            },
            durationTitleSize: {
                type: ControlType.Number,
                title: "Tam Tít Duración",
                defaultValue: 22,
            },
            durationSub: {
                type: ControlType.String,
                title: "Sub Duración",
                defaultValue: "VIA ZOOM",
            },
            durationSubSize: {
                type: ControlType.Number,
                title: "Tam Sub Duración",
                defaultValue: 16,
            },
            experienceTitle: {
                type: ControlType.String,
                title: "Título Experiencia",
                defaultValue: "LO QUE VAS A EXPERIMENTAR EN CADA SESIÓN",
            },
            experienceTitleSize: {
                type: ControlType.Number,
                title: "Tam Tít Experiencia",
                defaultValue: 22,
            },
            entranceTitle: {
                type: ControlType.String,
                title: "Título Entradas",
                defaultValue: "ELIGE TU ENTRADA A LA CÁMARA SOLAR",
            },
            entranceTitleSize: {
                type: ControlType.Number,
                title: "Tam Tít Entradas",
                defaultValue: 28,
            },
            entranceSub: {
                type: ControlType.String,
                title: "Sub Entradas",
                defaultValue: "(SESIONES GRUPALES)",
            },
            entranceSubSize: {
                type: ControlType.Number,
                title: "Tam Sub Entradas",
                defaultValue: 18,
            },
        },
    },
    topMarginPx: {
        type: ControlType.Number,
        title: "Margen Top",
        defaultValue: 96,
    },
    contentMaxWidthPx: {
        type: ControlType.Number,
        title: "Ancho Max",
        defaultValue: 1120,
    },
    verticalGroupOffset: {
        type: ControlType.Number,
        title: "↕ Offset Grupo",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 10,
    },
    cardsGap: {
        type: ControlType.Number,
        title: "↔ Gap Tarjetas",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 5,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Título Hero",
        defaultValue: 72,
        min: 32,
        max: 120,
        step: 2,
    },
    sectionTitleSize: {
        type: ControlType.Number,
        title: "📐 Título Secciones",
        defaultValue: 42,
        min: 20,
        max: 80,
        step: 2,
    },
    sectionSubSize: {
        type: ControlType.Number,
        title: "📐 Sub Secciones",
        defaultValue: 15,
        min: 10,
        max: 30,
        step: 1,
    },
    mobileVideoHeight: {
        type: ControlType.Number,
        title: "📱🎥 Alto Video Mobile",
        defaultValue: 310,
        min: 0,
        max: 1200,
        step: 10,
    },
    mobileSolarTitleSize: {
        type: ControlType.Number,
        title: "📱 Título Solar",
        defaultValue: 36,
        min: 18,
        max: 50,
        step: 1,
    },
    mobileDurationTitleSize: {
        type: ControlType.Number,
        title: "📱 Título Duración",
        defaultValue: 26,
        min: 12,
        max: 36,
        step: 1,
    },
    mobileBenefitsTitleSize: {
        type: ControlType.Number,
        title: "📱 Título Beneficios",
        defaultValue: 26,
        min: 12,
        max: 30,
        step: 1,
    },
    mobileEligeTitleSize: {
        type: ControlType.Number,
        title: "📱 Título Elige",
        defaultValue: 26,
        min: 14,
        max: 36,
        step: 1,
    },
    mobileResonanciaTitleSize: {
        type: ControlType.Number,
        title: "📱 Título Resonancia",
        defaultValue: 36,
        min: 16,
        max: 40,
        step: 1,
    },
    camaraSolarVideo: {
        type: ControlType.String,
        title: "🎥 Video URL",
        defaultValue: "",
    },
    camaraSolarVideoWidth: {
        type: ControlType.Number,
        title: "🎥 Ancho Video Desktop",
        defaultValue: 560,
        min: 300,
        max: 900,
        step: 10,
    },
    calendarCropTop: {
        type: ControlType.Number,
        title: "Corte Cal Desktop",
        defaultValue: -50,
        min: -200,
        max: 0,
    },
    calendarModalWidth: {
        type: ControlType.Number,
        title: "Ancho Modal Cal",
        defaultValue: 1060,
        min: 400,
        max: 1400,
    },
    calendarHeight: {
        type: ControlType.Number,
        title: "Altura Cal Desktop",
        defaultValue: 750,
        min: 500,
        max: 1200,
    },
    calendarMaskBottomPx: {
        type: ControlType.Number,
        title: "Mask Inferior",
        defaultValue: 56,
        min: 0,
        max: 140,
        step: 1,
    },
    mobileCalendarCropTop: {
        type: ControlType.Number,
        title: "📱 Corte Cal",
        defaultValue: -10,
        min: -200,
        max: 0,
    },
    mobileCalendarHeight: {
        type: ControlType.Number,
        title: "📱 Altura Cal",
        defaultValue: 570,
        min: 400,
        max: 1000,
    },
    cardLeftTitle: {
        type: ControlType.String,
        title: "🟢 Grupal / Título",
        defaultValue: "SESIONES GRUPALES",
    },
    cardLeftSubHeader: {
        type: ControlType.String,
        title: "🟢 Grupal / Sub",
        defaultValue: "CÁMARA SOLAR",
    },
    cardLeftBtn: {
        type: ControlType.String,
        title: "🟢 Grupal / Botón",
        defaultValue: "Explorar Cámara Solar",
    },
    cardRightTitle: {
        type: ControlType.String,
        title: "🔵 1:1 / Título",
        defaultValue: "SESIONES 1:1",
    },
    cardRightSubHeader: {
        type: ControlType.String,
        title: "🔵 1:1 / Sub",
        defaultValue: "CÁMARA DE RESONANCIA",
    },
    cardRightBtn: {
        type: ControlType.String,
        title: "🔵 1:1 / Botón",
        defaultValue: "Explorar",
    },
    timelineItems: {
        type: ControlType.Array,
        title: "⏱️ Arquitectura",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                time: { type: ControlType.String, title: "Tiempo" },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
                descLarga: {
                    type: ControlType.String,
                    title: "Desc Larga",
                    displayTextArea: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icono",
                    options: ["anchor", "transmission", "resonance", "seal"],
                    optionTitles: [
                        "Anclaje",
                        "Transmisión",
                        "Resonancia",
                        "Sello",
                    ],
                },
            },
        },
        defaultValue: [
            {
                time: "Min 00-10",
                title: "ANCLAJE",
                desc: "Activación del campo energético y sincronización.",
                descLarga:
                    "Entramos en fase de coherencia. Pasamos de la alerta de supervivencia a la regeneración parasimpática silenciando el ruido externo para afinar nuestra receptividad.",
                icon: "anchor",
            },
            {
                time: "Min 10-30",
                title: "TRANSMISIÓN",
                desc: "Emisión del código de la semana.",
                descLarga:
                    "Aterrizamos la información cósmica en protocolos físicos reales: agua, alimentación, respiración y voluntad para alinear tu geometría a las leyes universales.",
                icon: "transmission",
            },
            {
                time: "Min 30-50",
                title: "RESONANCIA",
                desc: '"Hot Seats". Preguntas y respuestas del grupo.',
                descLarga:
                    "La duda de uno es la medicina de todos. Desbloqueamos patrones colectivos en tiempo real bajo la lupa del grupo.",
                icon: "resonance",
            },
            {
                time: "Min 50-60",
                title: "SELLO",
                desc: "Protocolo de acción para la semana.",
                descLarga:
                    "Cerramos el portal. Te llevas una indicación electro-energética precisa y clara para aplicar inmediatamente.",
                icon: "seal",
            },
        ],
    },
    benefitsGrupal: {
        type: ControlType.Array,
        title: "✦ Beneficios",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.Enum,
                    title: "Icono",
                    options: ["spiral", "prism", "antenna", "mirror"],
                },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                icon: "spiral",
                title: "Resonancia Colectiva",
                desc: "Al unirte a la Cámara Solar, tu campo energético se sincroniza con el de otros de una frecuencia similar a la tuya.\nLo que uno sana o comprende, se refleja y acelera en el resto del grupo.",
            },
            {
                icon: "antenna",
                title: "Acompañamiento Sostenido",
                desc: "La espiritualidad solitaria puede ser fría. En este espacio, estás sostenido.",
            },
            {
                icon: "prism",
                title: "Calibración en Tiempo Real",
                desc: 'Dejamos la teoría en los libros para pasar a la ingeniería práctica. Aquí traes tus "glitches" y los reestructuramos en vivo.',
            },
            {
                icon: "mirror",
                title: "Enfoque Láser\n(Cupos Limitados)",
                desc: "Para mantener la pureza de la transmisión, la Cámara Solar opera con un límite estricto de 22 operadores.",
            },
        ],
    },
    camaraSolarSubtitle: {
        type: ControlType.String,
        title: "☀ Solar / Subtítulo",
        displayTextArea: true,
        defaultValue:
            "Es tu estación de recarga. Todos los Martes, abrimos el portal para:",
    },
    elementosClave: {
        type: ControlType.Array,
        title: "🔑 Elementos Clave",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.String,
                    title: "Icono",
                    defaultValue: "◈",
                },
                title: { type: ControlType.String, title: "Título" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                icon: "◈",
                title: "Recalibrar tu Frecuencia",
                desc: "Pasamos de la alerta de supervivencia a la regeneración parasimpática.\nSilenciamos el ruido externo para escuchar tu propia voz.",
            },
            {
                icon: "◎",
                title: "Activar Códigos Internos",
                desc: "La coherencia de un grupo enfocado amplifica tu capacidad de manifestación.",
            },
            {
                icon: "🪞",
                title: "Presenciar el Espejo Fractal",
                desc: "En el segmento de preguntas, la duda de uno es la medicina de todos.",
            },
        ],
    },
    solarPasses: {
        type: ControlType.Array,
        title: "🎫 Pases Solar",
        maxCount: 2,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Nombre Tarjeta" },
                nameRight: {
                    type: ControlType.String,
                    title: "Nombre Derecha",
                },
                tag: { type: ControlType.String, title: "Etiqueta" },
                desc: {
                    type: ControlType.String,
                    title: "Descripción",
                    displayTextArea: true,
                },
                features: {
                    type: ControlType.String,
                    title: "Características",
                    displayTextArea: true,
                },
                btnText: { type: ControlType.String, title: "Botón" },
                calendlyUrl: {
                    type: ControlType.String,
                    title: "Calendly URL",
                },
                link: { type: ControlType.String, title: "Link Stripe" },
            },
        },
        defaultValue: [
            {
                name: "PASE DE\nEXPLORACIÓN",
                nameRight: "PASE DE EXPLORACIÓN",
                price: "555 MXN",
                tag: "Opción Flexible",
                desc: "Agenda individualmente tu sesión grupal.\\n\\nHorario: Martes 12:30pm (UTC-5).",
                features: "Acceso a 1 sesión grupal en vivo",
                btnText: "RESERVAR MI LUGAR",
                calendlyUrl: "",
                link: "",
            },
            {
                name: "INMERSIÓN SOLAR",
                nameRight: "INMERSIÓN SOLAR",
                price: "1,111 MXN / mes",
                tag: "Acceso a Todas las Sesiones del Mes",
                desc: "Tu lugar asegurado en cada transmisión semanal grupal.",
                features:
                    "Transmisión semanal en vivo (Cámara Solar)\nTodo lo de Sintonía Solar (Escáner, Decodificadores, Holoteca, Cristales)\n15% OFF en Códices y Sesiones 1:1\nSello de Integración post-sesión\nGrabación de cada transmisión",
                btnText: "ACTIVAR INMERSIÓN",
                calendlyUrl: "",
                link: "https://buy.stripe.com/00wcMY1eRcVc4WBh1O0RG0D",
            },
        ],
    },
    linkStripeMembSolar: {
        type: ControlType.String,
        title: "☀ Link Stripe",
        defaultValue: "#",
    },
    resSectionDesc: {
        type: ControlType.String,
        title: "🔮 Res / Descripción",
        defaultValue: "Precisión Láser para tu Geometría Personal.",
    },
    res30Name: {
        type: ControlType.String,
        title: "🔮 30min",
        defaultValue: "Afinación Rápida",
    },
    res45Name: {
        type: ControlType.String,
        title: "🔮 45min",
        defaultValue: "Recalibración",
    },
    res60Name: {
        type: ControlType.String,
        title: "🔮 60min",
        defaultValue: "Reconfiguración Profunda",
    },
    calUrlGroup: {
        type: ControlType.String,
        title: "📅 Grupal",
        defaultValue: "https://calendly.com/zakhaar/camara-solar-60-minutos",
    },
    calUrl30: {
        type: ControlType.String,
        title: "📅 30min",
        defaultValue: "https://calendly.com/zakhaar/15min",
    },
    calUrl45: {
        type: ControlType.String,
        title: "📅 45min",
        defaultValue: "https://calendly.com/zakhaar/30min",
    },
    calUrl60: {
        type: ControlType.String,
        title: "📅 60min",
        defaultValue: "https://calendly.com/zakhaar/60min",
    },
    supabaseUrl: {
        type: ControlType.String,
        title: "🔒 Supabase URL",
        defaultValue: "",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "🔒 Supabase Key",
        defaultValue: "",
    },
    memberCalUrl30: {
        type: ControlType.String,
        title: "🔒 30min VIP Cal",
        defaultValue: "",
    },
    memberCalUrl45: {
        type: ControlType.String,
        title: "🔒 45min VIP Cal",
        defaultValue: "",
    },
    memberCalUrl60: {
        type: ControlType.String,
        title: "🔒 60min VIP Cal",
        defaultValue: "",
    },
    faqs: {
        type: ControlType.Array,
        title: "❓ FAQs",
        control: {
            type: ControlType.Object,
            controls: {
                q: { type: ControlType.String, title: "Pregunta" },
                a: {
                    type: ControlType.String,
                    title: "Respuesta",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                q: "¿Cómo aprovecho al máximo mi sesión?",
                a: "No requieres preparación mental previa. Solo asegura un espacio silencioso, buena conexión a internet y audífonos.",
            },
            {
                q: "¿Quedan grabadas las sesiones?",
                a: "Las Cámaras Solares sí se graban y se envían a miembros activos. Las sesiones 1:1 NO se graban por defecto.",
            },
            {
                q: "¿Cuál es la diferencia entre Cámara Solar y Cámara de Resonancia?",
                a: "La Cámara Solar es afinación colectiva. La Cámara de Resonancia es sesión personalizada para temas específicos.",
            },
            {
                q: "¿Qué pasa si no puedo asistir?",
                a: "Puedes reagendar tu sesión 1:1 hasta 24 horas antes. Las grupales no son reembolsables, pero recibirás la grabación.",
            },
        ],
    },
})
