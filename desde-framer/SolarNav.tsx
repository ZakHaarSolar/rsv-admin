// SolarNav.tsx v1.9 — 🜂 SESIONES SALE DEL MENÚ DEL CELULAR + EL BOTÓN DE
// PRODUCTO ATERRIZA EN LA LANDING (Zak 2026-08-03). Dos movimientos: (1)
// "SESIONES" era la última entrada viva de una capa ya retirada (el planeta lo
// apagó el interruptor del Motor y la pestaña de escritorio se quitó en julio);
// se oculta y además se blinda con RUTAS_RETIRADAS, que jamás pinta esas rutas
// aunque llegue una lista guardada por props. (2) El botón ⬡ ESCÁNER
// VIBRACIONAL deja de entrar a la ruta interna y va a escanervibracional.com,
// la landing que presenta el producto y reparte las tres puertas (App Store ·
// Android · escritorio) — mandar a alguien directo a la aplicación es soltarlo
// sin contexto. navigateSafe aprende a salir del dominio: un destino absoluto
// ya no pasa por el router interno del Domo.
//
// SolarNav.tsx v1.8 — 🜂 LA CASA DEJA DE SER TIENDA (Zak 2026-08-03). El HUD
// pierde la puerta de cuenta (avatar / INGRESAR / cerrar sesión): el acceso
// sale de la cara pública y queda solo como puerta de servicio de los paneles
// de administración. Y MEDITACIONES sale de la lista de capas: vive en la
// Holoteca del Escáner. El AuthCluster queda declarado sin montar por si
// alguna vez vuelve a hacer falta.
// v1.7.5 (2026-05-20) — Fallback de `handleAuth` rutea según
// contexto. Si el modal no atiende el evento, navegamos al Núcleo
// que corresponda al modo en uso: /nucleo en modo Madre,
// /escaner/nucleo si por alguna razón SolarNav vive bajo /escaner.
// Antes siempre mandaba al modo Escáner aunque el Tripulante
// estuviera en /sesiones, /codices o /meditaciones — quebraba la
// regla "no enlaces a /escaner/* desde fuera de /escaner/*".
// v1.7.4 — Devolvemos la pill estructural (border tenue + bg
// blanco 0.06 + backdrop blur) cuando la pill está en estado
// "estoy en /nucleo". El v1.7.3 había eliminado esos tres
// elementos cuando profileLit, y la pill "desaparecía"
// visualmente: solo quedaba el avatar + texto suelto. Ahora
// la pill conserva su forma siempre. La diferenciación se
// comunica únicamente con: (a) el avatar pequeño con su glow
// más intenso (ya estaba), (b) el color del texto del nombre
// pasa a cyan. Sin textShadow — sobre palabras cortas como
// "Zak'Haar" el glow de 14px del v1.7.3 creaba un halo
// rectangular que parecía un fondo cyan sólido detrás del
// texto. Eso era el "rectángulo" que Zak quería evitar.
// SolarNav.tsx v1.7.3
// HUD orbital móvil del Ecosistema Madre. Cambios v1.7.3:
//   1. Botón principal del menú renombrado a "ESCÁNER VIBRACIONAL"
//      (antes "ENTRAR AL ESCÁNER") para que el branding mobile
//      coincida con el del Centro de Mando, donde el CTA del
//      Auth2Header dice "ESCÁNER VIBRACIONAL". Una sola voz para
//      el mismo botón en ambos lentes.
//   2. Pill del avatar/nombre en estado lit (currentPath ==
//      "/nucleo") ya no muestra rectángulo iluminado. Antes el
//      border cyan saturado + boxShadow exterior creaba un trazo
//      visible alrededor del nombre. Ahora cuando estamos en
//      /nucleo, la pill pierde border y glow externo y solo
//      brilla (a) el avatar pequeño con su propio glow, (b) el
//      nombre en color cyan con textShadow sutil. Sensación más
//      etérea, sin marcos rectangulares.
//
// HUD orbital móvil del Ecosistema Madre — afinación Zak 2026-04-29 (madrugada).
// Diff vs v1.7.1:
//   1. Pill del avatar/nombre en estado lit (currentPath === "/nucleo")
//      pierde el background cyan tenue. Antes el bg `hexA(accent,0.12)`
//      pintaba un "rectángulo cyan" detrás del nombre que se sentía
//      pesado contra el resto del HUD etéreo. Ahora el lit se
//      comunica solo con border cyan saturado + glow exterior + el
//      avatar más encendido. Resultado: la pill activa se ve como un
//      halo luminoso, no como una etiqueta sobre fondo de color.
//   2. Botón ⬡ ENTRAR AL ESCÁNER con glow reducido. Antes el shadow
//      exterior 22px + intensidad 0.42 lo hacía dominar la pantalla
//      compitiendo con el wordmark. Ahora 14px + 0.28 — sigue
//      destacando como CTA principal pero deja respirar al resto.
//      drag-hover proporcionalmente reducido.
// Diff vs v1.6:
//   1. Pill del avatar/nombre se ilumina como "capa activa" cuando
//      currentPath === "/nucleo" (Mi Núcleo modo Madre). Mismo
//      tratamiento que un link de la lista en estado lit: background
//      cyan tenue, border cyan saturado, glow cyan y color del nombre
//      en cyan eléctrico. Confirmar visualmente que la pill ES la
//      pestaña del Núcleo, no solo un atajo de auth.
//
// Diff vs v1.5:
//   1. Lista del HUD centrada vertical (justifyContent: center) en
//      vez de pegada arriba — mejor balance ahora que solo hay 4
//      enlaces visibles (Origen, Códices, Meditaciones, Sesiones).
//   2. Botón [SELLO / LOG IN] → texto default "LOG IN / CREAR".
//   3. Hexágono ⬡ del CTA "Entrar al Escáner" bajado 2px (transform
//      translateY) para que no robe atención del texto.
//   4. Indicador "SISTEMA EN LÍNEA" bajo el CTA con punto cyan
//      pulsante (~2.6s ciclo). Conector visual tipo Mission
//      Control que confirma "el ecosistema responde". Al CTA se
//      le redujo el gap inferior para hacer espacio.
//
// Diff vs v1.4:
//   1. Lista reordenada: Origen → Códices → Meditaciones → Sesiones
//      → (Fragmentos hidden) → (Simuladores hidden). Orden resonante
//      de la Arquitectura a la Exploración.
//   2. Trigger contraído subido y alineado con el wordmark; hit zone
//      ampliada hasta la esquina absoluta superior derecha (top: 0
//      right: 0; padding interno respeta safe-area).
//   3. Press-and-drag fade-out instantáneo: al soltar sobre un link
//      se setea navigating=true → todos los lits se apagan en el
//      mismo frame, antes de que termine la onda de cierre.
//   4. Bloqueo de scroll robusto cuando open=true: html + body
//      overflow + html.touchAction="none". Lo que está detrás del
//      HUD ya no se mueve al scrollear sobre el overlay.
//   5. Pill del avatar es ahora un botón → navega a /nucleo (ruta
//      pública del Ecosistema Madre, no /escaner/nucleo). El
//      SolarNav se monta encima de MiNucleo standalone (Domo v4.58).

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"

const CYAN = "#00E5FF"
const CYAN_DEEP = "#0091B5"
const GLASS_BG = "rgba(3,11,20,0.55)"
const GLASS_BLUR = "blur(30px) saturate(140%)"

type LinkRow = { label: string; href: string; hidden?: boolean }

// Orden resonante 2026-04-29 (Arquitectura → Exploración):
// Origen — ancla / centro del sistema solar.
// Códices de Luz — la arquitectura mental.
// Meditaciones — la frecuencia / cuerpo energético.
// Sesiones — el campo colectivo (Cámara Solar).
// Fragmentos del Sol — eco visual (oculto hasta afinar versión mobile).
// Simuladores — integración lúdica (oculto temporalmente).
/* 🜂 v1.8 — MEDITACIONES sale de la lista: vive en la Holoteca del
   Escáner y ya no tiene capa en la casa (Zak 2026-08-03).
   🜂 v1.9 — SESIONES sale del menú del CELULAR (Zak 2026-08-03): el
   planeta ya estaba apagado por el interruptor del Motor y la pestaña
   de escritorio se quitó en julio; esta era la última entrada viva. */
const DEFAULT_LINKS: LinkRow[] = [
    { label: "ORIGEN", href: "/" },
    { label: "CÓDICES DE LUZ", href: "/codices" },
    { label: "SESIONES", href: "/sesiones", hidden: true },
    { label: "FRAGMENTOS DEL SOL", href: "/fragmentos", hidden: true },
    { label: "SIMULADORES", href: "/simuladores", hidden: true },
]

/* 🜂 Rutas retiradas de la casa: aunque un día llegue una lista guardada
   por props, estas entradas NUNCA se pintan (hardcode-over-Framer-saved).
   Emparejado con Origen v5.16, que filtra el planeta en código. */
const RUTAS_RETIRADAS = ["/sesiones", "/meditaciones", "/nucleo"]

function hexA(hex: string, a: number): string {
    if (!hex || typeof hex !== "string") return `rgba(0,229,255,${a})`
    const h = hex.replace("#", "")
    if (h.length !== 6) return `rgba(0,229,255,${a})`
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some((n) => Number.isNaN(n)))
        return `rgba(0,229,255,${a})`
    return `rgba(${r},${g},${b},${a})`
}

function isMatchPath(current: string, target: string): boolean {
    if (!current || !target) return false
    if (target === "/") return current === "/" || current === "/home"
    return current === target
}

function isOrigenPath(current: string): boolean {
    return current === "/" || current === "/home"
}

/* 🜂 v1.9 — la casa del Escáner vive en OTRO dominio: su landing presenta el
   producto y reparte las tres puertas (App Store · Android · escritorio). */
const ESCANER_LANDING_URL = "https://escanervibracional.com"

function navigateSafe(href: string) {
    /* 🜂 v1.9 — un destino ABSOLUTO sale del dominio: el router interno del
       Domo no puede resolverlo (lo trataría como ruta y caería en "nodo no
       encontrado"). Se navega de verdad. */
    if (/^https?:\/\//i.test(href)) {
        try {
            window.location.assign(href)
        } catch {
            window.location.href = href
        }
        return
    }
    try {
        const nav = (window as any).rsvNavigate
        if (typeof nav === "function") {
            nav(href)
            return
        }
    } catch {}
    try {
        window.location.assign(href)
    } catch {
        window.location.href = href
    }
}

function SolarNav(props: any) {
    const accentColor: string =
        typeof props?.accentColor === "string" ? props.accentColor : CYAN
    const accentDeep: string =
        typeof props?.accentDeep === "string"
            ? props.accentDeep
            : CYAN_DEEP
    const wordmark: string =
        typeof props?.wordmark === "string"
            ? props.wordmark
            : "R E D  S O L A R  V I V A"
    const ctaLabel: string =
        typeof props?.ctaLabel === "string"
            ? props.ctaLabel
            : "ESCÁNER VIBRACIONAL"
    /* 🜂 v1.9 — el botón de producto aterriza en la LANDING del Escáner, no en
       la aplicación (Zak 2026-08-03: mandar a alguien directo a la app es
       soltarlo sin contexto). La landing presenta el producto y ofrece las tres
       puertas: App Store, Android y versión de escritorio. Destino forzado al
       render (hardcode-over-Framer-saved): el canvas puede tener "/escaner/
       radar" guardado, una ruta que ya no existe en la casa. */
    const ctaHref: string = ESCANER_LANDING_URL
    const profileHref: string =
        typeof props?.profileHref === "string"
            ? props.profileHref
            : "/nucleo"
    const loginLabel: string =
        typeof props?.loginLabel === "string"
            ? props.loginLabel
            : "LOG IN / CREAR"
    const links: LinkRow[] = (
        Array.isArray(props?.links) && props.links.length > 0
            ? props.links
            : DEFAULT_LINKS
    ).filter(
        (l) => l && !l.hidden && !RUTAS_RETIRADAS.includes(l.href)
    )
    const currentPath: string =
        typeof props?.currentPath === "string" ? props.currentPath : ""

    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [navigating, setNavigating] = useState(false)
    const [authName, setAuthName] = useState<string | null>(null)
    const [authImg, setAuthImg] = useState<string | null>(null)
    const [avatarBroken, setAvatarBroken] = useState(false)
    const [dragHoverHref, setDragHoverHref] = useState<string | null>(null)
    const [dragHoverAction, setDragHoverAction] = useState<string | null>(
        null
    )

    useEffect(() => {
        setMounted(true)
    }, [])

    // Bloqueo de scroll robusto: html + body overflow + touchAction.
    // El listener de touchmove no-passive es la red de seguridad para
    // contenedores internos con scroll propio que ignoran el overflow
    // del documento (algunos componentes usan overflow:auto interno).
    useEffect(() => {
        if (typeof document === "undefined") return
        if (!open) return
        const html = document.documentElement
        const body = document.body
        const prevHtmlOverflow = html.style.overflow
        const prevBodyOverflow = body.style.overflow
        const prevHtmlTouchAction = html.style.touchAction
        html.style.overflow = "hidden"
        body.style.overflow = "hidden"
        html.style.touchAction = "none"
        return () => {
            html.style.overflow = prevHtmlOverflow
            body.style.overflow = prevBodyOverflow
            html.style.touchAction = prevHtmlTouchAction
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open])

    // Reset al cambiar ruta: cierra HUD + apaga el flag navigating.
    useEffect(() => {
        if (open) setOpen(false)
        setNavigating(false)
    }, [currentPath])

    // Scroll capture global — fade del wordmark.
    useEffect(() => {
        if (typeof window === "undefined") return
        const onScroll = (e: any) => {
            const t = e?.target
            const top =
                t && typeof t === "object" && "scrollTop" in t
                    ? Number(t.scrollTop) || 0
                    : window.scrollY || 0
            setScrolled(top > 12)
        }
        window.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        } as any)
        return () =>
            window.removeEventListener("scroll", onScroll, {
                capture: true,
            } as any)
    }, [])

    const refreshAuth = useCallback(() => {
        try {
            const u = (window as any)?.Clerk?.user
            if (u) {
                const name =
                    (u.firstName && String(u.firstName).trim()) ||
                    (u.username && String(u.username).trim()) ||
                    "Tripulante"
                setAuthName(name)
                setAuthImg(
                    typeof u.imageUrl === "string" ? u.imageUrl : null
                )
                setAvatarBroken(false)
            } else {
                setAuthName(null)
                setAuthImg(null)
            }
        } catch {
            setAuthName(null)
            setAuthImg(null)
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        refreshAuth()
        window.addEventListener("rsv-auth-changed", refreshAuth)
        window.addEventListener("rsv-signout-complete", refreshAuth)
        return () => {
            window.removeEventListener("rsv-auth-changed", refreshAuth)
            window.removeEventListener(
                "rsv-signout-complete",
                refreshAuth
            )
        }
    }, [refreshAuth])

    useEffect(() => {
        if (open) refreshAuth()
    }, [open, refreshAuth])

    // closeWithDelay setea navigating=true PRIMERO para apagar el
    // brillo del link actual al instante. La acción real se ejecuta
    // 360ms después, cuando el HUD termina de contraerse.
    const closeWithNavigate = useCallback((cb: () => void) => {
        setNavigating(true)
        setOpen(false)
        setTimeout(cb, 360)
    }, [])

    const closeWithoutNavigate = useCallback((cb: () => void) => {
        setOpen(false)
        setTimeout(cb, 360)
    }, [])

    const handleLink = useCallback(
        (href: string) => {
            closeWithNavigate(() => navigateSafe(href))
        },
        [closeWithNavigate]
    )

    const handleAuth = useCallback(() => {
        closeWithoutNavigate(() => {
            try {
                window.dispatchEvent(
                    new CustomEvent("rsv-open-auth-modal")
                )
            } catch {}
            const stamp = Date.now()
            window.setTimeout(() => {
                const m = (window as any).__rsvAuthModalStamp || 0
                if (m >= stamp) return
                /* v1.7.5 — Fallback rutea según contexto. */
                const inEscaner =
                    typeof window !== "undefined" &&
                    window.location.pathname.startsWith("/escaner")
                navigateSafe(inEscaner ? "/escaner/nucleo" : "/nucleo")
            }, 250)
        })
    }, [closeWithoutNavigate])

    const handleSignOut = useCallback(() => {
        closeWithNavigate(async () => {
            try {
                const clerk = (window as any).Clerk
                if (clerk?.session?.end) {
                    await clerk.session.end()
                }
            } catch {}
            try {
                window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
                window.dispatchEvent(
                    new CustomEvent("rsv-signout-complete")
                )
            } catch {}
            navigateSafe("/")
        })
    }, [closeWithNavigate])

    const handleProfile = useCallback(() => {
        closeWithNavigate(() => navigateSafe(profileHref))
    }, [closeWithNavigate, profileHref])

    const handleEnter = useCallback(() => {
        handleLink(ctaHref)
    }, [handleLink, ctaHref])

    // ─── Press-and-drag desde el trigger
    const dragRef = useRef<{
        active: boolean
        startX: number
        startY: number
        moved: boolean
        wasOpenAtStart: boolean
        hoverEl: HTMLElement | null
    }>({
        active: false,
        startX: 0,
        startY: 0,
        moved: false,
        wasOpenAtStart: false,
        hoverEl: null,
    })

    const findActionEl = (x: number, y: number): HTMLElement | null => {
        try {
            let el = document.elementFromPoint(
                x,
                y
            ) as HTMLElement | null
            while (el && !el.dataset?.rsvAction) {
                el = el.parentElement as HTMLElement | null
            }
            return el
        } catch {
            return null
        }
    }

    const onTriggerPointerDown = (e: any) => {
        if (e.button !== undefined && e.button !== 0) return
        try {
            ;(e.currentTarget as HTMLButtonElement).setPointerCapture(
                e.pointerId
            )
        } catch {}
        dragRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
            wasOpenAtStart: open,
            hoverEl: null,
        }
        if (!open) setOpen(true)
    }

    const onTriggerPointerMove = (e: any) => {
        const d = dragRef.current
        if (!d.active) return
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        if (!d.moved && Math.hypot(dx, dy) > 8) {
            d.moved = true
        }
        if (!d.moved) return
        const target = findActionEl(e.clientX, e.clientY)
        if (target !== d.hoverEl) {
            d.hoverEl = target
            const action = target?.dataset?.rsvAction || null
            const href = target?.dataset?.rsvHref || null
            setDragHoverAction(action)
            setDragHoverHref(href)
        }
    }

    const onTriggerPointerUp = (e: any) => {
        const d = dragRef.current
        const moved = d.moved
        const wasOpen = d.wasOpenAtStart
        const target = d.hoverEl
        d.active = false
        d.hoverEl = null
        setDragHoverAction(null)
        setDragHoverHref(null)
        try {
            ;(e.currentTarget as HTMLButtonElement).releasePointerCapture(
                e.pointerId
            )
        } catch {}
        if (moved && target) {
            const action = target.dataset?.rsvAction
            const href = target.dataset?.rsvHref
            if (action === "auth") return handleAuth()
            if (action === "signout") return handleSignOut()
            if (action === "profile") return handleProfile()
            if (action === "scanner") return handleEnter()
            if (action === "link" && href) return handleLink(href)
            if (action === "trigger") setOpen(false)
            return
        }
        if (!moved && wasOpen) {
            setOpen(false)
        }
    }

    const onTriggerPointerCancel = () => {
        const d = dragRef.current
        d.active = false
        d.hoverEl = null
        setDragHoverAction(null)
        setDragHoverHref(null)
    }

    // Tap-fuera robusto.
    const onOverlayClick = (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        let cur: HTMLElement | null = e.target as HTMLElement
        while (cur) {
            if (cur.dataset?.rsvAction) return
            cur = cur.parentElement
        }
        setOpen(false)
    }

    if (!mounted || typeof document === "undefined") {
        return <div style={{ display: "none" }} aria-hidden="true" />
    }

    const isAuthed = !!authName
    const initial = (authName?.[0] || "T").toUpperCase()
    const showInitial = !authImg || avatarBroken
    const hideWordmark = isOrigenPath(currentPath)

    // ─── Trigger glyph: 2 líneas → X.
    const TriggerGlyph = (
        <div
            aria-hidden="true"
            style={{
                width: 26,
                height: 22,
                position: "relative",
                pointerEvents: "none",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    left: 0,
                    top: open ? 11 : 7,
                    width: 26,
                    height: 2,
                    borderRadius: 1.5,
                    background: "rgba(255,255,255,0.96)",
                    transformOrigin: "center",
                    transform: open ? "rotate(45deg)" : "rotate(0deg)",
                    transition:
                        "transform 0.34s cubic-bezier(0.22,1,0.36,1), top 0.34s ease",
                }}
            />
            <span
                style={{
                    position: "absolute",
                    left: open ? 0 : 8,
                    top: open ? 11 : 14,
                    width: open ? 26 : 18,
                    height: 1.6,
                    borderRadius: 1.2,
                    background: open
                        ? "rgba(255,255,255,0.96)"
                        : accentDeep,
                    boxShadow: open
                        ? "none"
                        : `0 0 6px ${hexA(accentDeep, 0.7)}, 0 0 12px ${hexA(accentDeep, 0.32)}`,
                    transformOrigin: "center",
                    transform: open ? "rotate(-45deg)" : "rotate(0deg)",
                    transition:
                        "transform 0.34s cubic-bezier(0.22,1,0.36,1), top 0.34s ease, left 0.34s ease, width 0.34s ease, background 0.34s ease, box-shadow 0.34s ease",
                }}
            />
        </div>
    )

    // ─── Wordmark — absolute, scrolleable, oculto en Origen.
    const Wordmark = !hideWordmark && (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                top: "calc(env(safe-area-inset-top, 0px) + 14px)",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 2147483598,
                opacity: open ? 0 : scrolled ? 0 : 1,
                transform:
                    !open && scrolled
                        ? "translateY(-12px)"
                        : "translateY(0px)",
                transition:
                    "opacity 0.32s ease, transform 0.32s ease",
            }}
        >
            <span
                style={{
                    fontFamily:
                        "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontSize: 10.5,
                    letterSpacing: "0.34em",
                    color: "rgba(255,255,255,0.78)",
                    textShadow: `0 0 14px ${hexA(accentColor, 0.55)}`,
                    fontWeight: 300,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                {wordmark}
            </span>
        </div>
    )

    // ─── Trigger: hit zone hasta la esquina absoluta superior derecha.
    // El button arranca en (0,0) hasta width=64, height=safe+44.
    // El glyph se posiciona alineado al borde derecho (paddingRight 14)
    // y centrado verticalmente dentro del espacio post-safe-area
    // (paddingTop=safe). El centro vertical del glyph cae a env+22px,
    // que es ~2px más alto que el centro del wordmark (env+20.5px).
    // Ajuste fino: paddingTop reducido en 4px para subir el glyph y
    // alinearlo exactamente con la línea visual del wordmark.
    const Trigger = (
        <button
            onPointerDown={onTriggerPointerDown}
            onPointerMove={onTriggerPointerMove}
            onPointerUp={onTriggerPointerUp}
            onPointerCancel={onTriggerPointerCancel}
            data-rsv-action="trigger"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: 72,
                height: "calc(env(safe-area-inset-top, 0px) + 50px)",
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingRight: 16,
                paddingLeft: 0,
                paddingBottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "transparent",
                border: "none",
                margin: 0,
                cursor: "pointer",
                zIndex: 2147483602,
                WebkitTapHighlightColor: "transparent",
                outline: "none",
                touchAction: "none",
            }}
        >
            {TriggerGlyph}
        </button>
    )

    /* v1.7 — La pill se ilumina como "pestaña activa" cuando
       el tripulante está en /nucleo (Mi Núcleo modo Madre).
       Mismo comportamiento que un link de la lista en estado lit.
       Si está dragHovered durante press-and-drag, también enciende.
       navigating apaga el lit instantáneo al soltar el dedo sobre
       otro destino, igual que con los links. */
    const profileLit =
        (!navigating && currentPath === "/nucleo") ||
        dragHoverAction === "profile"
    // ─── Auth cluster (pill clickeable o botón login).
    const AuthCluster = isAuthed ? (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
            }}
        >
            <button
                onClick={handleProfile}
                data-rsv-action="profile"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 16px 8px 8px",
                    borderRadius: 999,
                    /* v1.7.2 — En estado lit el bg pasa a transparent
                       (antes hexA(accent,0.12) → "rectángulo cyan"
                       detrás del nombre que rompía la sensación
                       etérea del HUD). El lit se comunica con border
                       cyan saturado + glow exterior, no con un fill
                       de color. El estado no-lit conserva su velo
                       blanco 0.06 (apenas perceptible). */
                    /* v1.7.4 — La pill estructural (border + bg
                       tenue + backdrop) se conserva SIEMPRE
                       (profileLit o no) para que el contenedor
                       siga siendo visible — antes el v1.7.3 los
                       eliminaba cuando lit y la pill "se
                       desvanecía". La diferenciación de "estoy en
                       /nucleo" se comunica únicamente con el
                       cambio de color del nombre (cyan en lugar
                       de blanco) — sin textShadow grande, que
                       sobre una palabra corta como "Zak'Haar"
                       creaba un halo cuadrado que parecía un
                       fondo sólido cyan. */
                    background:
                        dragHoverAction === "profile"
                            ? "rgba(255,255,255,0.10)"
                            : "rgba(255,255,255,0.06)",
                    border: `1px solid ${
                        dragHoverAction === "profile"
                            ? "rgba(255,255,255,0.32)"
                            : "rgba(255,255,255,0.16)"
                    }`,
                    boxShadow: "none",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    cursor: "pointer",
                    margin: 0,
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                    transition:
                        "background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
                }}
            >
                <span
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: hexA(accentColor, profileLit ? 0.22 : 0.12),
                        border: `1px solid ${hexA(accentColor, profileLit ? 0.85 : 0.55)}`,
                        boxShadow: profileLit
                            ? `0 0 14px ${hexA(accentColor, 0.7)}, 0 0 22px ${hexA(accentColor, 0.35)}`
                            : `0 0 10px ${hexA(accentColor, 0.35)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flex: "0 0 auto",
                        pointerEvents: "none",
                        transition:
                            "background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
                    }}
                >
                    {!showInitial && authImg ? (
                        <img
                            src={authImg}
                            alt=""
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setAvatarBroken(true)}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                fontFamily:
                                    "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                                fontSize: 12,
                                fontWeight: 500,
                                color: accentColor,
                                letterSpacing: "0.04em",
                            }}
                        >
                            {initial}
                        </span>
                    )}
                </span>
                <span
                    style={{
                        fontFamily:
                            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                        fontSize: 13,
                        letterSpacing: "0.12em",
                        color: profileLit
                            ? accentColor
                            : "rgba(255,255,255,0.92)",
                        fontWeight: profileLit ? 500 : 400,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        maxWidth: 180,
                        /* v1.7.4 — Sin textShadow. El v1.7.3 ponía
                           un glow de 14px alrededor del nombre que
                           sobre palabras cortas como "Zak'Haar" se
                           veía como un rectángulo de fondo cyan.
                           Ahora sólo cambia el color del texto. */
                        textShadow: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        pointerEvents: "none",
                    }}
                >
                    {authName}
                </span>
            </button>
            <button
                onClick={handleSignOut}
                data-rsv-action="signout"
                style={{
                    background: "transparent",
                    border: "none",
                    padding: "6px 12px",
                    color: "rgba(255,255,255,0.42)",
                    fontFamily:
                        "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.36em",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    margin: 0,
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                DESANCLAR
            </button>
        </div>
    ) : (
        <button
            onClick={handleAuth}
            data-rsv-action="auth"
            style={{
                background:
                    dragHoverAction === "auth"
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                border: `1px solid ${dragHoverAction === "auth" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.20)"}`,
                color:
                    dragHoverAction === "auth"
                        ? "rgba(255,255,255,1)"
                        : "rgba(255,255,255,0.78)",
                padding: "12px 24px",
                borderRadius: 999,
                fontFamily:
                    "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: 11,
                letterSpacing: "0.32em",
                fontWeight: 400,
                cursor: "pointer",
                margin: 0,
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                WebkitUserSelect: "none",
                transition:
                    "color 0.18s ease, border-color 0.18s ease, background 0.18s ease",
            }}
        >
            {loginLabel}
        </button>
    )

    // ─── HUD overlay con onda diagonal.
    const HUD = (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="solar-nav-hud"
                    initial={{
                        clipPath:
                            "circle(0% at calc(100% - 36px) 36px)",
                        opacity: 1,
                    }}
                    animate={{
                        clipPath:
                            "circle(160% at calc(100% - 36px) 36px)",
                        opacity: 1,
                    }}
                    exit={{
                        clipPath:
                            "circle(0% at calc(100% - 36px) 36px)",
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.62,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={onOverlayClick}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483601,
                        background: GLASS_BG,
                        backdropFilter: GLASS_BLUR,
                        WebkitBackdropFilter: GLASS_BLUR,
                        display: "flex",
                        flexDirection: "column",
                        paddingTop:
                            "calc(env(safe-area-inset-top, 0px) + 76px)",
                        paddingBottom:
                            "calc(env(safe-area-inset-bottom, 0px) + 28px)",
                        paddingLeft: 24,
                        paddingRight: 24,
                        touchAction: "none",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: `radial-gradient(ellipse at 50% 22%, ${hexA(accentColor, 0.10)} 0%, transparent 58%)`,
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 22,
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        {links.map((link, i) => {
                            const routeLit = isMatchPath(
                                currentPath,
                                link.href
                            )
                            const dragLit =
                                dragHoverAction === "link" &&
                                dragHoverHref === link.href
                            // navigating apaga el routeLit instantáneo:
                            // el brillo del link viejo desaparece al
                            // soltar el dedo, antes de que el HUD cierre.
                            const active =
                                (!navigating && routeLit) || dragLit
                            return (
                                <motion.button
                                    key={`${link.href}-${i}`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{
                                        duration: 0.46,
                                        delay: 0.18 + i * 0.05,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    onClick={() => handleLink(link.href)}
                                    data-rsv-action="link"
                                    data-rsv-href={link.href}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: "10px 16px",
                                        margin: 0,
                                        cursor: "pointer",
                                        color: active
                                            ? accentColor
                                            : "rgba(255,255,255,0.78)",
                                        fontFamily:
                                            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                                        fontSize: 18,
                                        letterSpacing: "0.24em",
                                        fontWeight: active ? 500 : 300,
                                        textTransform: "uppercase",
                                        textShadow: active
                                            ? `0 0 18px ${hexA(accentColor, 0.85)}, 0 0 30px ${hexA(accentColor, 0.45)}`
                                            : "none",
                                        WebkitTapHighlightColor:
                                            "transparent",
                                        outline: "none",
                                        whiteSpace: "nowrap",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                        transition:
                                            "color 0.18s ease, text-shadow 0.18s ease, font-weight 0.18s ease",
                                    }}
                                >
                                    {link.label}
                                </motion.button>
                            )
                        })}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.18 + links.length * 0.05 + 0.04,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 28,
                            paddingBottom: 12,
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        {/* 🜂 v1.8 — La puerta de cuenta salió del HUD
                            (Zak 2026-08-03: Red Solar Viva deja de ser
                            tienda y el acceso ya no vive en la cara
                            pública). Queda solo la entrada al Escáner,
                            que es a dónde va el visitante. AuthCluster
                            se conserva declarado, sin montar, por si
                            alguna vez vuelve a hacer falta. */}
                        <button
                            onClick={handleEnter}
                            data-rsv-action="scanner"
                            style={{
                                background:
                                    dragHoverAction === "scanner"
                                        ? hexA(accentColor, 0.14)
                                        : hexA(accentColor, 0.06),
                                border: `1.5px solid ${accentColor}`,
                                color: accentColor,
                                padding: "14px 28px",
                                borderRadius: 999,
                                fontFamily:
                                    "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                                fontSize: 13,
                                letterSpacing: "0.32em",
                                fontWeight: 500,
                                cursor: "pointer",
                                margin: 0,
                                outline: "none",
                                /* v1.7.2 — Glow reducido. Antes 22px
                                   + 0.42 dominaban la pantalla; ahora
                                   14px + 0.28 dejan respirar al resto
                                   del HUD sin perder presencia de CTA. */
                                boxShadow:
                                    dragHoverAction === "scanner"
                                        ? `0 0 22px ${hexA(accentColor, 0.45)}, inset 0 0 14px ${hexA(accentColor, 0.18)}`
                                        : `0 0 14px ${hexA(accentColor, 0.28)}, inset 0 0 10px ${hexA(accentColor, 0.10)}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                WebkitTapHighlightColor: "transparent",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                whiteSpace: "nowrap",
                                transition:
                                    "background 0.18s ease, box-shadow 0.18s ease",
                            }}
                        >
                            <svg
                                width={12}
                                height={12}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                style={{
                                    flex: "0 0 auto",
                                    transform: "translateY(2px)",
                                }}
                            >
                                <polygon
                                    points="12,2 22,7 22,17 12,22 2,17 2,7"
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {ctaLabel}
                        </button>

                        {/* SISTEMA EN LÍNEA — pulse vivo bajo el CTA.
                            Confirma que el ecosistema responde sin
                            robar atención: opacity media, punto cyan
                            que respira en ciclo lento (~2.6s). */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.6,
                                delay:
                                    0.18 +
                                    links.length * 0.05 +
                                    0.18,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                marginTop: -4,
                            }}
                        >
                            <motion.span
                                animate={{
                                    opacity: [1, 0.35, 1],
                                    scale: [1, 0.85, 1],
                                }}
                                transition={{
                                    duration: 2.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: accentColor,
                                    boxShadow: `0 0 8px ${hexA(accentColor, 0.85)}, 0 0 16px ${hexA(accentColor, 0.45)}`,
                                    flex: "0 0 auto",
                                }}
                            />
                            <span
                                style={{
                                    fontFamily:
                                        "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                                    fontSize: 9,
                                    letterSpacing: "0.42em",
                                    color: hexA(accentColor, 0.85),
                                    fontWeight: 400,
                                    textTransform: "uppercase",
                                    textShadow: `0 0 10px ${hexA(accentColor, 0.35)}`,
                                }}
                            >
                                SISTEMA EN LÍNEA
                            </span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <>
            {Wordmark && createPortal(Wordmark, document.body)}
            {createPortal(Trigger, document.body)}
            {createPortal(HUD, document.body)}
        </>
    )
}

SolarNav.displayName = "SolarNav"

export default SolarNav
