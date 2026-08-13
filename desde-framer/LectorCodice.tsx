// Red Solar Viva — LectorCodice.tsx v1.11
// v1.11 — Tema persistido en localStorage. La preferencia del
// Tripulante (claro / sepia / oscuro) se guarda en
// `rsv_lector_theme` cada vez que la cambia desde el panel Aa. Al
// abrir el visor de nuevo, el sistema lee primero esa preferencia;
// si no existe, cae al prefers-color-scheme del SO. Persistencia
// global para todos los Códices, no por libro — la preferencia de
// lectura es del Tripulante, no del título.
// v1.10 — Modo oscuro: el bg ya estaba bien (v1.9) pero el TEXTO
// se quedaba con el color hardcoded del CSS interno del EPUB
// (gris/negro sobre negro = invisible). El stylesheet con
// `* { color: ... !important }` perdía contra selectores más
// específicos del libro (ej. `body p span.cls { color: #2c2c2c
// !important }`). Solución: además del CSS, recorrer cada elemento
// de texto del iframe (p, span, em, strong, h*, blockquote, li,
// a, div) y aplicar `style.setProperty("color", t.text,
// "important")` INLINE. Inline + important gana sobre cualquier
// stylesheet rule sin importar la especificidad.
// v1.9 — Fix definitivo del bg al cambiar tema. themes.register +
// themes.override aplican reglas via stylesheet inyectado, pero el
// CSS interno del EPUB (que muchos libros traen con `body
// {background: #fff}` o similar) ganaba en cascada y dejaba el
// fondo blanco/cremita en sepia y oscuro. Ahora:
//   1. En cada `rendition.on("rendered", ...)` inyectamos CSS
//      directo al iframe via `view.contents.addStylesheetCss(...)`
//      con html/body bg del theme + estilo inline a html y body
//      DOM elements como triple seguridad.
//   2. Cuando el theme cambia, recorremos TODOS los views ya
//      renderizados y re-aplicamos el bg fix. Sin esto, el primer
//      view se pintaba con el theme nuevo pero los chunks ya
//      cacheados quedaban con el viejo.
// v1.8 — Cuatro afinaciones tras feedback Zak:
//   · Título centrado en X visualmente (left:50% translateX(-50%))
//     en lugar de flexbox con padding asimétrico — la X arriba
//     derecha ya no descentra el título.
//   · Tema oscuro forzaba bg pero el color del texto se quedaba en
//     el del libro (negro sobre negro = invisible). Themes ahora
//     incluyen regla universal `*` con !important + override múltiple
//     después de select.
//   · Indicador X/Y · % oculto hasta que `book.locations.generate()`
//     resuelve. Mientras eso pasa muestra solo el porcentaje
//     guardado. Sin flash "0/0" ni "1/1 0%".
//   · Padding-top del body bajado de 80 a 56 — el botón X se
//     mantiene en la zona safe sin chocar con el texto, así el
//     primer párrafo del libro arranca más arriba.
// v1.7 — Cuatro afinaciones más:
//   · Porcentaje correcto desde el primer frame al reabrir el libro:
//     leemos el `percentage` de get_reading_progress y lo seteamos
//     ANTES de display() — antes el "1 / 1 · 0%" se mostraba unos
//     segundos hasta que book.locations.generate terminaba.
//   · Padding-top del body interno aumentado a calc(safe-top + 56px)
//     para que el título flotante de arriba no choque con la primera
//     línea del texto.
//   · Header bar y footer bar con gradient bg del theme cuando los
//     controles están visibles. El texto debajo se opaca/desvanece
//     contra el bg como en Apple Books, en lugar de verse encima
//     del párrafo.
//   · Bug del cambio de tema: select + override("background-color"/
//     "color", !important) + display(cfi) — antes solo select +
//     display, no se propagaba al body interno consistentemente
//     en iOS Safari + blob iframes.
// v1.6.2 — Fix crítico TDZ: armHideTimer declarado ARRIBA del
// useEffect del auto-hide (antes vivía abajo y el effect crasheaba
// al mount con "Cannot access 'armHideTimer' before initialization"
// — el Tripulante veía pantalla de error en lugar del visor).
// v1.6.1 — Re-trigger del watcher tras waitForComponentLoader timeout.
// v1.6 — Cuatro afinaciones tipo Apple Books:
//   · Título del Códice arriba SIEMPRE visible (gris muted, ellipsis
//     si no cabe). Cuando aparece la X de cerrar, el área del título
//     reserva espacio a la derecha para no solapar.
//   · X y Aa con auto-hide. Al montar arrancan visibles + timer 6s.
//     Tap centro toggle. Al cambiar de página por tap izq/der los
//     controles permanecen como estén.
//   · Bug del cambio de tema arreglado: re-display de la página
//     actual después de themes.select(). Sin esto, switchear
//     claro→sepia→oscuro dejaba el body interno desincronizado del
//     bg del visor (uno cambiaba, el otro se quedaba en el último
//     theme renderizado).
//   · Indicador "X / Y" correcto al reabrir el libro en una página
//     guardada. Antes `book.locations.generate` corría en background
//     y el primer `relocated` event devolvía total=0 → "1 / 1 · 0%".
//     Ahora después del generate, leemos el cfi actual y forzamos
//     un recálculo de pageInfo + percentage.
// v1.5 — Redesign tipo Apple Books:
//   · Pantalla 100% completa, sin recuadro. El padding se aplica
//     ahora al body INTERNO del libro (vía themes.register), no al
//     container del iframe — antes el container tenía `padding: 5vh
//     6vw` que dejaba el iframe encogido y se veía un rectángulo
//     blanco con marco oscuro alrededor en modo oscuro.
//   · X arriba derecha SIEMPRE visible (no toggle). Apple Books la
//     muestra siempre.
//   · Botón Aa abajo derecha SIEMPRE visible.
//   · Contador "X / Y · Z%" centrado abajo SIEMPRE visible, encima
//     del libro (no debajo). Tipografía pequeña + color muted del
//     theme.
//   · Bug del modo oscuro arreglado: themes.select(theme) inicial
//     usa el state actual (antes hardcoded "claro" y el effect post
//     mount no llegaba a tiempo → iframe pintaba claro aunque el
//     visor estuviera oscuro).
//   · Tap-zones cubren TODO el alto (antes la central solo cubría
//     60%, dejando dead zones arriba/abajo). 30/40/30% width.
//   · Removido el listener interno del iframe (innecesario — las
//     zonas overlay capturan todo).
// v1.4 — Detect prefers-color-scheme al montar (iPhone en dark mode
// abre con tema oscuro automáticamente). Indicador "X / Y" siempre
// visible abajo (no toggleable con tap centro) — el Tripulante
// siempre ve en qué punto del Códice va. Tap-zone central agrandada
// a 100% del alto (antes 60%) para que el centro siempre toggle los
// controles sin importar dónde toque. Click handler dentro del
// iframe revisado (el listener se attachea al `documentElement` y al
// `body`, antes solo al document → algunos EPUBs con script tags no
// disparaban). Padding de las páginas reducido ligeramente para
// dejar espacio al indicador inferior persistente.
// v1.3 — Cargar JSZip ANTES de epubjs. Con el ArrayBuffer
// (v1.2) epubjs requiere JSZip global (window.JSZip) para
// descomprimir el .epub. El build UMD de jsdelivr no lo incluye
// → "JSZip lib not loaded" al instanciar. Solución: el loader
// ahora descarga jszip.min.js primero y después epub.min.js. Ambos
// cacheados en window para que el segundo open sea instantáneo.
// v1.2 — Fetch del .epub controlado por nosotros (AbortController +
// stream con progreso visible) en lugar de delegar el download a
// epubjs internal. Pasamos un ArrayBuffer ya armado a ePub() — así
// epubjs no hace ningún fetch adicional. Resuelve el "Tiempo agotado"
// que aparecía con archivos grandes (~8MB) en mobile sobre 4G donde
// el download tomaba más de 14s. Timeout total elevado a 60s. UI
// muestra "Descargando · 3.2 MB" mientras baja, después "Procesando…"
// mientras epubjs descomprime el ZIP. Si timeout: mensaje específico
// distinguiendo "no respondió" vs "respondió pero el archivo no es
// EPUB válido".
// v1.1 — Pre-flight HEAD a epubUrl + timeout 14s en book.ready para
// detectar URLs no-EPUB (caso típico: MediaFire devuelve HTML de la
// página de descarga, no el binario .epub). El visor antes se quedaba
// colgado en el orb cyan porque book.ready nunca rechaza con MediaFire.
// Ahora aborta con mensaje claro: "Este enlace no apunta al archivo
// .epub directo. Hay que subirlo a Supabase Storage (o R2) y usar la
// URL pública."
// v1.0 — Visor EPUB nativo dentro del Domo. Lazy-load de epubjs
// (Skypack ESM con fallback a script tag jsdelivr). Posición exacta
// persistida vía CFI + RPCs reading_progress. Themes claro / sepia /
// oscuro. Gestos mobile (swipe + tap zonas) y desktop (←/→ + ESC).
// Sin brillo, sin búsqueda, sin marcadores — Apple Books simplificado.
//
// Cumple regla 🜂: default export retorna JSX renderable. Cuando Framer
// instancia el componente standalone (sin props críticas), devuelve un
// <div hidden> que el componentLoader acepta sin side-effects. Todos
// los hooks viven ARRIBA del early return para respetar Rules of Hooks
// (regla del proyecto: useState/useEffect/useRef antes de cualquier
// `if (!cond) return`).
//
// Consumir desde MN_Codices.tsx:
//   import LectorCodice from "./LectorCodice.tsx"
//   {leerState && <LectorCodice {...leerState} onClose={...} />}

import * as React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

// ─── Themes ─────────────────────────────────────────────────────────
const THEMES = {
    claro: {
        bg: "#FAFAF7",
        text: "#1A1A1F",
        muted: "rgba(26,26,31,0.55)",
        divider: "rgba(26,26,31,0.10)",
        sheet: "#FFFFFF",
    },
    sepia: {
        bg: "#F4ECD8",
        text: "#5B4936",
        muted: "rgba(91,73,54,0.6)",
        divider: "rgba(91,73,54,0.18)",
        sheet: "#FBF4E0",
    },
    oscuro: {
        bg: "#0A0E16",
        text: "#E6F2FF",
        muted: "rgba(230,242,255,0.55)",
        divider: "rgba(230,242,255,0.12)",
        sheet: "#11151F",
    },
} as const
type ThemeKey = keyof typeof THEMES

const FONT_SIZES = ["82%", "94%", "108%", "124%", "144%"]
const FONT_DEFAULT_IDX = 2

// ─── Lazy loader de epubjs + JSZip ──────────────────────────────────
// Ambos cacheados en window para que el segundo open sea instantáneo.
// Cargamos JSZip primero porque epubjs lo requiere global cuando le
// pasamos un ArrayBuffer (no URL).
const EPUBJS_VERSION = "0.3.93"
const JSZIP_VERSION = "3.10.1"
let depsPromise: Promise<any> | null = null

function loadScript(src: string, errorLabel: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
            `script[data-rsv-cdn="${src}"]`
        ) as HTMLScriptElement | null
        if (existing) {
            if ((existing as any).dataset.rsvLoaded === "1")
                return resolve()
            existing.addEventListener("load", () => resolve())
            existing.addEventListener("error", () =>
                reject(new Error(errorLabel))
            )
            return
        }
        const s = document.createElement("script")
        s.src = src
        s.async = true
        s.dataset.rsvCdn = src
        s.onload = () => {
            s.dataset.rsvLoaded = "1"
            resolve()
        }
        s.onerror = () => reject(new Error(errorLabel))
        document.head.appendChild(s)
    })
}

function loadEpubjs(): Promise<any> {
    if (typeof window === "undefined")
        return Promise.reject(new Error("no-window"))
    const w = window as any
    if (w.ePub && w.JSZip) return Promise.resolve(w.ePub)
    if (depsPromise) return depsPromise

    depsPromise = (async () => {
        // 1. JSZip primero (epubjs lo necesita global cuando se le pasa
        //    un ArrayBuffer). Si ya está cargado lo respetamos.
        if (!w.JSZip) {
            await loadScript(
                `https://cdn.jsdelivr.net/npm/jszip@${JSZIP_VERSION}/dist/jszip.min.js`,
                "No se pudo cargar JSZip"
            )
            if (!w.JSZip)
                throw new Error("JSZip cargó pero no quedó disponible")
        }
        // 2. epubjs (UMD). Define window.ePub.
        if (!w.ePub) {
            await loadScript(
                `https://cdn.jsdelivr.net/npm/epubjs@${EPUBJS_VERSION}/dist/epub.min.js`,
                "No se pudo cargar epub.js"
            )
            if (!w.ePub)
                throw new Error("epub.js cargó pero no quedó disponible")
        }
        return w.ePub
    })()
    return depsPromise
}

// ─── Supabase RPC inline ────────────────────────────────────────────
async function rpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any>,
    keepalive = false
) {
    if (!url || !key) return null
    try {
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            keepalive,
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

// ─── Componente principal ───────────────────────────────────────────
function LectorCodice({
    bookId = "",
    bookTitle = "",
    epubUrl = "",
    clerkUserId = "",
    supabaseUrl = "",
    supabaseAnonKey = "",
    onClose = () => {},
}: {
    bookId?: string
    bookTitle?: string
    epubUrl?: string
    clerkUserId?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
    onClose?: () => void
}) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const bookRef = useRef<any>(null)
    const renditionRef = useRef<any>(null)
    const cfiRef = useRef<string | null>(null)
    const pctRef = useRef<number>(0)
    const saveDebounceRef = useRef<any>(null)
    /* v1.9 — Ref al theme actual para que el handler de "rendered"
       (que se attachea una sola vez al mount) pueda leer el theme
       más reciente sin stale closure. */
    const themeRef = useRef<ThemeKey>("claro")

    const [loading, setLoading] = useState(true)
    const [stage, setStage] = useState<"download" | "parse" | "ready">(
        "download"
    )
    const [downloadedBytes, setDownloadedBytes] = useState(0)
    const [totalBytes, setTotalBytes] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [showSheet, setShowSheet] = useState(false)
    /* v1.6 — showControls toggle. Auto-hide en 6s al mostrar.
       Tap centro toggle. Inicial true para que al abrir el libro
       el Tripulante vea X y Aa, y se oculten solas. */
    const [showControls, setShowControls] = useState(true)
    const hideTimerRef = useRef<any>(null)

    /* v1.6.2 — armHideTimer y showControlsAndArm DECLARADOS antes
       de cualquier useEffect/useCallback que los referencie. Si
       quedan después, ReferenceError "Cannot access 'armHideTimer'
       before initialization" en runtime al ejecutar el effect que
       los lee como dep. */
    const armHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }
        hideTimerRef.current = setTimeout(() => {
            setShowControls(false)
        }, 6000)
    }, [])
    const showControlsAndArm = useCallback(() => {
        setShowControls(true)
        armHideTimer()
    }, [armHideTimer])
    /* v1.11 — Tema inicial: preferencia guardada > prefers-color-scheme
       > "claro" default. Esto permite que el Tripulante elija una vez
       y siempre arranque en su tema favorito sin tener que cambiar
       manualmente cada vez que abre un Códice. */
    const [theme, setTheme] = useState<ThemeKey>(() => {
        if (typeof window === "undefined") return "claro"
        try {
            const saved = localStorage.getItem("rsv_lector_theme")
            if (
                saved === "claro" ||
                saved === "sepia" ||
                saved === "oscuro"
            )
                return saved
        } catch {}
        try {
            return window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)")
                    .matches
                ? "oscuro"
                : "claro"
        } catch {
            return "claro"
        }
    })

    /* v1.11 — Persistir cada cambio de tema. */
    useEffect(() => {
        try {
            localStorage.setItem("rsv_lector_theme", theme)
        } catch {}
    }, [theme])
    const [fontIdx, setFontIdx] = useState(FONT_DEFAULT_IDX)
    const [percentage, setPercentage] = useState(0)
    /* v1.4 — Página actual / total dentro del libro. Hidratado por
       el evento "relocated" cuando book.locations ya generó. Antes
       de eso displayedPages = {current:0,total:0} → indicador
       muestra "—". */
    const [pageInfo, setPageInfo] = useState<{
        current: number
        total: number
    }>({ current: 0, total: 0 })
    /* v1.8 — Flag que indica que book.locations.generate() ya
       resolvió. Antes de eso el relocated event puede dar total=1
       falso, lo que pintaba "1 / 1 · 0%". Ahora el indicador queda
       oculto hasta que esto sea true (o hasta que tengamos un
       savedPct > 0 de la RPC inicial). */
    const [locationsReady, setLocationsReady] = useState(false)

    const themeCfg = THEMES[theme]

    /* v1.9 — Sincroniza themeRef con el state theme. El handler de
       "rendered" del rendition vive en un closure que captura un
       solo theme inicial; sin este ref, cuando cambia el theme y
       epubjs renderiza un view nuevo, aplicaría el theme viejo. */
    useEffect(() => {
        themeRef.current = theme
    }, [theme])

    /* v1.9 — Inyecta CSS al iframe de un view específico para que
       html/body tomen el bg del theme. Triple seguridad:
       1. addStylesheetCss (regla con !important)
       2. Style inline al documentElement
       3. Style inline al body
       Algunos EPUB traen estilos hardcoded que ganan en cascada
       con !important normal. La combinación de las 3 garantiza el
       cambio. */
    const applyBgFix = useCallback((view: any, themeKey: ThemeKey) => {
        try {
            const t = THEMES[themeKey]
            const css = `
                html, body {
                    background-color: ${t.bg} !important;
                    background: ${t.bg} !important;
                    color: ${t.text} !important;
                }
                * {
                    color: ${t.text} !important;
                }
            `
            try {
                view?.contents?.addStylesheetCss?.(
                    css,
                    "rsv-bg-override"
                )
            } catch {}
            const doc =
                view?.document || view?.iframe?.contentDocument
            if (doc) {
                try {
                    if (doc.documentElement) {
                        doc.documentElement.style.setProperty(
                            "background",
                            t.bg,
                            "important"
                        )
                        doc.documentElement.style.setProperty(
                            "background-color",
                            t.bg,
                            "important"
                        )
                        doc.documentElement.style.setProperty(
                            "color",
                            t.text,
                            "important"
                        )
                    }
                    if (doc.body) {
                        doc.body.style.setProperty(
                            "background",
                            t.bg,
                            "important"
                        )
                        doc.body.style.setProperty(
                            "background-color",
                            t.bg,
                            "important"
                        )
                        doc.body.style.setProperty(
                            "color",
                            t.text,
                            "important"
                        )
                    }
                    /* v1.10 — Inline style con !important a CADA
                       elemento de texto. Inline gana sobre cualquier
                       regla de stylesheet sin importar la
                       especificidad. Es la única forma de garantizar
                       que el texto tome el color del theme cuando el
                       libro trae estilos hardcoded en sus propias
                       clases (p ej `body p.calibre1 { color: #000
                       !important }`). */
                    const els = doc.querySelectorAll(
                        "p, span, em, strong, h1, h2, h3, h4, h5, h6, blockquote, li, a, div, td, th, dt, dd, figcaption, small, sub, sup, b, i, u"
                    )
                    for (let i = 0; i < els.length; i++) {
                        ;(els[i] as HTMLElement).style.setProperty(
                            "color",
                            t.text,
                            "important"
                        )
                    }
                } catch {}
            }
        } catch {}
    }, [])

    // ── Save helper (debounce + immediate) ──────────────────────────
    const flushSave = useCallback(
        (immediate = false) => {
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current)
                saveDebounceRef.current = null
            }
            const fire = () => {
                if (!cfiRef.current || !clerkUserId) return
                rpc(supabaseUrl, supabaseAnonKey, "save_reading_progress", {
                    p_clerk_id: clerkUserId,
                    p_book_id: bookId,
                    p_cfi: cfiRef.current,
                    p_pct: pctRef.current,
                })
            }
            if (immediate) fire()
            else saveDebounceRef.current = setTimeout(fire, 1500)
        },
        [clerkUserId, bookId, supabaseUrl, supabaseAnonKey]
    )

    // ── Mount: cargar epubjs + abrir libro + display CFI guardado ──
    useEffect(() => {
        // Guard: si el componente fue instanciado sin epubUrl (caso Framer
        // standalone), no cargamos epubjs ni hacemos fetch.
        if (!epubUrl || !bookId) return
        let cancelled = false
        const abortCtrl = new AbortController()
        let timeoutId: any = null
        ;(async () => {
            try {
                // ── Fase 1: descarga del .epub controlada por nosotros.
                //    Stream con progreso visible. Timeout 60s sobre la
                //    descarga completa (suficiente para 8MB en 4G lento).
                //    Si el bucket CORS bloquea el response, fetch tira
                //    TypeError "Failed to fetch" inmediato y vamos al
                //    catch con mensaje específico.
                timeoutId = setTimeout(() => {
                    abortCtrl.abort()
                }, 60000)

                let response: Response
                try {
                    response = await fetch(epubUrl, {
                        method: "GET",
                        signal: abortCtrl.signal,
                        cache: "default",
                    })
                } catch (fetchErr: any) {
                    if (cancelled) return
                    if (
                        fetchErr?.name === "AbortError" ||
                        abortCtrl.signal.aborted
                    ) {
                        throw new Error(
                            "El servidor tardó más de 60 segundos en responder. Verifica que el archivo esté accesible y que el bucket tenga CORS abierto al dominio."
                        )
                    }
                    throw new Error(
                        "No se pudo conectar al archivo. Causa probable: CORS no permite a este dominio leer el bucket. Revisa AllowedOrigins."
                    )
                }

                if (!response.ok) {
                    throw new Error(
                        `El servidor respondió ${response.status}. Verifica que el archivo sea público.`
                    )
                }

                const contentType = (
                    response.headers.get("content-type") || ""
                ).toLowerCase()
                if (
                    contentType.includes("text/html") ||
                    contentType.includes("application/xhtml")
                ) {
                    throw new Error(
                        "El enlace abre una página web, no el archivo .epub directo. Súbelo al bucket y usa la URL pública."
                    )
                }

                const totalHdr = response.headers.get("content-length")
                const total = totalHdr ? parseInt(totalHdr, 10) : 0
                if (!cancelled && total) setTotalBytes(total)

                // Stream chunks con progress
                let buffer: Uint8Array
                if (response.body && (response.body as any).getReader) {
                    const reader = (
                        response.body as any
                    ).getReader() as ReadableStreamDefaultReader<Uint8Array>
                    const chunks: Uint8Array[] = []
                    let received = 0
                    while (true) {
                        const { done, value } = await reader.read()
                        if (cancelled) {
                            try {
                                reader.cancel()
                            } catch {}
                            return
                        }
                        if (done) break
                        if (value) {
                            chunks.push(value)
                            received += value.length
                            setDownloadedBytes(received)
                        }
                    }
                    buffer = new Uint8Array(received)
                    let offset = 0
                    for (const c of chunks) {
                        buffer.set(c, offset)
                        offset += c.length
                    }
                } else {
                    // Fallback: navegadores sin streams API
                    const ab = await response.arrayBuffer()
                    buffer = new Uint8Array(ab)
                    setDownloadedBytes(buffer.length)
                }

                if (cancelled) return
                clearTimeout(timeoutId)
                timeoutId = null

                // Verificar firma ZIP del EPUB
                if (buffer.length < 4) {
                    throw new Error(
                        "El archivo descargado está vacío o corrupto."
                    )
                }
                if (
                    !(
                        buffer[0] === 0x50 &&
                        buffer[1] === 0x4b &&
                        buffer[2] === 0x03 &&
                        buffer[3] === 0x04
                    )
                ) {
                    throw new Error(
                        "El archivo descargado no es un EPUB válido (firma ZIP ausente). Verifica que el archivo en el bucket sea el .epub real."
                    )
                }

                // ── Fase 2: parse con epubjs sobre el ArrayBuffer
                setStage("parse")
                const ePub = await loadEpubjs()
                if (cancelled) return

                const book = ePub(buffer.buffer)
                bookRef.current = book

                if (!containerRef.current) return
                const rendition = book.renderTo(containerRef.current, {
                    width: "100%",
                    height: "100%",
                    flow: "paginated",
                    spread: "none",
                    manager: "default",
                    allowScriptedContent: false,
                })
                renditionRef.current = rendition

                // Themes — el padding INTERNO del libro lo controlamos
                // aquí (no en el container del iframe) para que la
                // página llene el visor sin recuadro alrededor.
                // v1.8: padding-top reducido a calc(safe-top + 56px).
                // El título es 28px de alto + ~16px gap + safe-top
                // del notch. 56px es suficiente sin desperdiciar
                // espacio. Antes 80 dejaba demasiado aire muerto.
                const bodyPadding =
                    "calc(env(safe-area-inset-top, 0px) + 56px) 6vw 72px 6vw"
                /* v1.8: regla universal `*` con color !important
                   garantiza que TODOS los descendientes hereden el
                   color del theme. Sin esta regla, elementos del
                   libro con color hardcoded (CSS interno del EPUB)
                   ganaban en cascada y dejaban texto invisible en
                   modo oscuro (negro sobre negro). */
                const themeRules = (t: typeof THEMES.claro) => ({
                    "html, body": {
                        background: `${t.bg} !important`,
                        "background-color": `${t.bg} !important`,
                        color: `${t.text} !important`,
                    },
                    body: {
                        "font-family":
                            "'Iowan Old Style','Iowan',Georgia,serif !important",
                        "line-height": "1.55 !important",
                        padding: `${bodyPadding} !important`,
                        "box-sizing": "border-box !important",
                        margin: "0 !important",
                    },
                    "*": {
                        color: `${t.text} !important`,
                    },
                    "p, span, em, strong, blockquote, li, td, th, div, section, article":
                        {
                            color: `${t.text} !important`,
                        },
                    "h1, h2, h3, h4, h5, h6": {
                        color: `${t.text} !important`,
                    },
                    "p": {
                        "font-family":
                            "'Iowan Old Style','Iowan',Georgia,serif !important",
                        "line-height": "1.55 !important",
                    },
                    a: { color: `${t.text} !important` },
                })
                rendition.themes.register("claro", themeRules(THEMES.claro))
                rendition.themes.register("sepia", themeRules(THEMES.sepia))
                rendition.themes.register("oscuro", themeRules(THEMES.oscuro))
                rendition.themes.fontSize(FONT_SIZES[fontIdx])
                // BUG FIX v1.5: usar el state actual del theme, no
                // un literal "claro". Si prefers-color-scheme detectó
                // oscuro, ya el state está en "oscuro" — debemos
                // arrancar con ese.
                rendition.themes.select(theme)

                // Posición guardada
                const saved = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_reading_progress",
                    { p_clerk_id: clerkUserId, p_book_id: bookId }
                )
                const savedCfi =
                    Array.isArray(saved) && saved[0]?.cfi
                        ? (saved[0].cfi as string)
                        : null
                // v1.7 — Hidratamos el porcentaje guardado ANTES de
                // display(). Así el indicador de abajo arranca con
                // "10%" en vez de "1 / 1 · 0%" mientras
                // book.locations.generate() corre en background.
                const savedPct =
                    Array.isArray(saved) &&
                    typeof saved[0]?.percentage === "number"
                        ? Math.max(
                              0,
                              Math.min(
                                  100,
                                  Math.round(saved[0].percentage)
                              )
                          )
                        : 0
                if (savedPct > 0) {
                    pctRef.current = savedPct
                    setPercentage(savedPct)
                }

                // book.ready ahora opera sobre ArrayBuffer en memoria,
                // así que no hay download pendiente — solo descompresión
                // ZIP + parse del OPF. Timeout 25s margen amplio.
                await Promise.race([
                    book.ready,
                    new Promise((_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        "El archivo se descargó pero no se pudo procesar como EPUB. El archivo podría estar dañado."
                                    )
                                ),
                            25000
                        )
                    ),
                ])
                // CFI percentage requiere generar locations (chunks de 1024
                // chars). Tarda 1-3s en libros medianos; lo disparamos en
                // paralelo para no bloquear el primer render.
                // v1.6: cuando termina el generate, recalcula pageInfo +
                // percentage usando el cfi actual. Sin esto, al reabrir
                // un libro en una página guardada el indicador mostraba
                // "1 / 1 · 0%" para siempre (porque el primer relocated
                // disparó antes que las locations estuvieran listas).
                book.locations
                    .generate(1600)
                    .then(() => {
                        if (cancelled) return
                        try {
                            const total = book.locations.length() || 0
                            let cfi = cfiRef.current
                            if (!cfi) {
                                const loc =
                                    renditionRef.current?.currentLocation?.()
                                cfi = loc?.start?.cfi || null
                            }
                            if (total > 0) setLocationsReady(true)
                            if (cfi && total > 0) {
                                const cur =
                                    book.locations.locationFromCfi(cfi) || 0
                                const pct = Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        Math.round(
                                            (book.locations.percentageFromCfi(
                                                cfi
                                            ) || 0) * 100
                                        )
                                    )
                                )
                                setPageInfo({
                                    current: Math.max(1, cur + 1),
                                    total,
                                })
                                pctRef.current = pct
                                setPercentage(pct)
                            }
                        } catch {}
                    })
                    .catch(() => {})

                if (savedCfi) {
                    await rendition.display(savedCfi).catch(() =>
                        rendition.display()
                    )
                } else {
                    await rendition.display()
                }

                /* v1.9 — Cada vez que epubjs renderiza un view
                   (chunk del libro en su propio iframe), inyectamos
                   el CSS bg + estilo inline. Sin esto el theme
                   nuevo solo se aplicaba al primer view; los
                   chunks subsiguientes pintaban con el viejo CSS
                   del libro. */
                rendition.on("rendered", (_section: any, view: any) => {
                    applyBgFix(view, themeRef.current)
                })

                rendition.on("relocated", (location: any) => {
                    if (cancelled) return
                    const cfi = location?.start?.cfi
                    if (cfi) {
                        cfiRef.current = cfi
                        try {
                            const pct = Math.max(
                                0,
                                Math.min(
                                    100,
                                    Math.round(
                                        (book.locations.percentageFromCfi(
                                            cfi
                                        ) || 0) * 100
                                    )
                                )
                            )
                            pctRef.current = pct
                            setPercentage(pct)
                        } catch {}
                        try {
                            const total = book.locations.length() || 0
                            const current =
                                book.locations.locationFromCfi(cfi) || 0
                            if (total > 0) {
                                setPageInfo({
                                    current: Math.max(1, current + 1),
                                    total,
                                })
                            }
                        } catch {}
                        flushSave(false)
                    }
                })

                // v1.5 — Removido el listener interno del iframe. Las
                // tap-zones overlay capturan los clicks (cubren todo
                // el alto en columnas 30/40/30). Eso evita problemas
                // cross-origin con blob: iframes en iOS Safari.

                if (!cancelled) {
                    setStage("ready")
                    setLoading(false)
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(
                        e?.message ||
                            "No se pudo abrir el códice. Intenta más tarde."
                    )
                    setLoading(false)
                }
            } finally {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }
        })()

        return () => {
            cancelled = true
            try {
                abortCtrl.abort()
            } catch {}
            if (timeoutId) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            // Save final keepalive (sobrevive el unmount).
            if (cfiRef.current && clerkUserId) {
                rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "save_reading_progress",
                    {
                        p_clerk_id: clerkUserId,
                        p_book_id: bookId,
                        p_cfi: cfiRef.current,
                        p_pct: pctRef.current,
                    },
                    true
                )
            }
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current)
                saveDebounceRef.current = null
            }
            try {
                renditionRef.current?.destroy?.()
            } catch {}
            try {
                bookRef.current?.destroy?.()
            } catch {}
            renditionRef.current = null
            bookRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epubUrl])

    // ── Re-aplicar tema sin perder posición ─────────────────────────
    // v1.9: además de select + override, recorremos TODOS los views
    // ya renderizados y les inyectamos el bg fix directo al iframe.
    // Sin esto, el primer view se actualizaba pero los chunks
    // cacheados se quedaban con el bg viejo (era el bug que en
    // sepia veías "sepia arriba/abajo, blanco en medio").
    useEffect(() => {
        const r = renditionRef.current
        if (!r) return
        try {
            const t = THEMES[theme]
            r.themes?.select?.(theme)
            r.themes?.override?.("background-color", t.bg, true)
            r.themes?.override?.("background", t.bg, true)
            r.themes?.override?.("color", t.text, true)
            // Recorrer views existentes y re-aplicar bg fix
            try {
                const views = r.views?.()
                if (views) {
                    const all =
                        typeof views.all === "function"
                            ? views.all()
                            : Array.isArray(views)
                              ? views
                              : []
                    all.forEach((v: any) => applyBgFix(v, theme))
                }
            } catch {}
            const cfi = cfiRef.current
            if (cfi) {
                setTimeout(() => {
                    try {
                        r.display(cfi)
                            .then(() => {
                                // Re-aplicar después del display
                                try {
                                    const views2 = r.views?.()
                                    const all2 =
                                        typeof views2?.all === "function"
                                            ? views2.all()
                                            : Array.isArray(views2)
                                              ? views2
                                              : []
                                    all2.forEach((v: any) =>
                                        applyBgFix(v, theme)
                                    )
                                } catch {}
                            })
                            .catch(() => {})
                    } catch {}
                }, 30)
            }
        } catch {}
    }, [theme, applyBgFix])

    // ── Re-aplicar tamaño letra sin perder posición ─────────────────
    useEffect(() => {
        try {
            renditionRef.current?.themes?.fontSize(FONT_SIZES[fontIdx])
        } catch {}
    }, [fontIdx])

    // ── Keyboard ←→ + ESC ───────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === "INPUT" || tag === "TEXTAREA") return
            if (e.key === "ArrowRight" || e.key === "PageDown")
                renditionRef.current?.next?.()
            else if (e.key === "ArrowLeft" || e.key === "PageUp")
                renditionRef.current?.prev?.()
            else if (e.key === "Escape") {
                flushSave(true)
                onClose()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose, flushSave])

    /* v1.6 — Auto-hide del control bar a los 6s del mount. Si el
       Tripulante toca el centro, el toggle re-arma el timer; al
       desmontar, limpiamos. */
    useEffect(() => {
        if (!epubUrl || !bookId) return
        if (loading) return
        armHideTimer()
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current)
                hideTimerRef.current = null
            }
        }
    }, [epubUrl, bookId, loading, armHideTimer])

    // ── Bloquear pinch-to-zoom + scroll de fondo mientras el visor
    //    está montado. Evita bounce en iOS y zoom accidental que
    //    descalibra el contenido del iframe. ────────────────────────
    useEffect(() => {
        if (!epubUrl || !bookId) return
        const prevent = (e: TouchEvent) => {
            if (e.touches && e.touches.length > 1) e.preventDefault()
        }
        document.addEventListener("touchmove", prevent, { passive: false })
        const prevOverflow = document.body.style.overflow
        const prevTouch = (document.body.style as any).touchAction
        document.body.style.overflow = "hidden"
        ;(document.body.style as any).touchAction = "none"
        return () => {
            document.removeEventListener("touchmove", prevent as any)
            document.body.style.overflow = prevOverflow
            ;(document.body.style as any).touchAction = prevTouch || ""
        }
    }, [epubUrl, bookId])

    // ── Touch swipe horizontal (cuando el evento llega al overlay
    //    porque el usuario tocó las zonas visibles fuera del iframe) ─
    const touchStartX = useRef<number | null>(null)
    const touchStartY = useRef<number | null>(null)
    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }
    }
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null)
            return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        const dy = e.changedTouches[0].clientY - touchStartY.current
        touchStartX.current = null
        touchStartY.current = null
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
            if (dx < 0) renditionRef.current?.next?.()
            else renditionRef.current?.prev?.()
        }
    }

    // ── Click handler de las zonas overlay ──────────────────────────
    // v1.6: izq/der nav, centro toggle controles. Si toggle ON arma
    // timer 6s; si OFF cancela el timer.
    const onZoneTap = (zone: "left" | "center" | "right") => {
        if (zone === "left") renditionRef.current?.prev?.()
        else if (zone === "right") renditionRef.current?.next?.()
        else {
            setShowControls((prev) => {
                const next = !prev
                if (next) armHideTimer()
                else if (hideTimerRef.current) {
                    clearTimeout(hideTimerRef.current)
                    hideTimerRef.current = null
                }
                return next
            })
        }
    }

    const requestClose = useCallback(() => {
        flushSave(true)
        onClose()
    }, [flushSave, onClose])

    // Guard final (después de TODOS los hooks): si Framer instancia el
    // componente standalone o si falta document, retornamos placeholder
    // oculto que satisface la regla 🜂 sin disparar el portal.
    if (!epubUrl || !bookId || typeof document === "undefined") {
        return (
            <div
                style={{ display: "none" }}
                aria-hidden="true"
                data-rsv-lector-codice-placeholder="true"
            />
        )
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483647,
                background: themeCfg.bg,
                overflow: "hidden",
                touchAction: "manipulation",
                fontFamily:
                    "'Iowan Old Style','Iowan',Georgia,serif",
                color: themeCfg.text,
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* v1.5 — EPUB container PANTALLA COMPLETA. Sin padding
                propio: el padding del libro lo controla themes.register
                en el body interno. Eso elimina el "rectángulo blanco
                con marco oscuro" del v1.4. */}
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    boxSizing: "border-box",
                    zIndex: 1,
                }}
            />

            {/* v1.6 — Tap-zones cubren TODO el alto. Izq/der nav,
                centro toggle de controles (auto-hide en 6s). */}
            <div
                onClick={() => onZoneTap("left")}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "30%",
                    bottom: 0,
                    zIndex: 2,
                    cursor: "w-resize",
                    background: "transparent",
                }}
                aria-label="Página anterior"
            />
            <div
                onClick={() => onZoneTap("center")}
                style={{
                    position: "absolute",
                    top: 0,
                    left: "30%",
                    width: "40%",
                    bottom: 0,
                    zIndex: 2,
                    cursor: "pointer",
                    background: "transparent",
                }}
                aria-label="Mostrar u ocultar controles"
            />
            <div
                onClick={() => onZoneTap("right")}
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "30%",
                    bottom: 0,
                    zIndex: 2,
                    cursor: "e-resize",
                    background: "transparent",
                }}
                aria-label="Página siguiente"
            />

            {/* Loading orb cyan pulsante + estado de descarga */}
            <AnimatePresence>
                {loading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 22,
                            zIndex: 50,
                            background: themeCfg.bg,
                            fontFamily: "'Inter',sans-serif",
                            color: themeCfg.muted,
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.45, 1],
                                opacity: [0.45, 1, 0.45],
                            }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                background: "#00C2FF",
                                boxShadow:
                                    "0 0 28px rgba(0,194,255,.7), 0 0 56px rgba(0,194,255,.35)",
                            }}
                        />
                        <div
                            style={{
                                fontSize: 11,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                textAlign: "center",
                                lineHeight: 1.6,
                            }}
                        >
                            {stage === "download"
                                ? totalBytes > 0
                                    ? `Descargando · ${(downloadedBytes / 1048576).toFixed(1)} / ${(totalBytes / 1048576).toFixed(1)} MB`
                                    : downloadedBytes > 0
                                      ? `Descargando · ${(downloadedBytes / 1048576).toFixed(1)} MB`
                                      : "Conectando…"
                                : stage === "parse"
                                  ? "Procesando códice…"
                                  : "Listo"}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error fallback */}
            {error && !loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        padding: 32,
                        textAlign: "center",
                        zIndex: 60,
                        background: themeCfg.bg,
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    <div style={{ maxWidth: 320 }}>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 16,
                                color: themeCfg.text,
                            }}
                        >
                            No se pudo abrir el códice
                        </p>
                        <p
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                color: themeCfg.muted,
                                lineHeight: 1.5,
                            }}
                        >
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                marginTop: 24,
                                padding: "10px 22px",
                                borderRadius: 999,
                                background: themeCfg.text,
                                color: themeCfg.bg,
                                border: "none",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 12,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* v1.8 — Título centrado EN EJE X visual (no en el espacio
                disponible entre la X y el borde izquierdo, que lo
                desplazaba a la izquierda). Apple Books usa este
                patrón: título exactamente al medio, ellipsis si
                colisiona con la X. */}
            {!loading && !error && bookTitle && (
                <div
                    style={{
                        position: "absolute",
                        top: "max(env(safe-area-inset-top), 16px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        maxWidth: "calc(100% - 140px)",
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 25,
                        pointerEvents: "none",
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 13,
                        letterSpacing: "0.02em",
                        color: themeCfg.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {bookTitle}
                </div>
            )}

            {/* v1.6 — Controles X y Aa con auto-hide 6s. */}
            {!loading && !error && (
                <React.Fragment>
                    {/* v1.7 — Bandas degradadas arriba y abajo que
                        opacan el texto del libro detrás de los
                        controles. Apple Books usa este patrón —
                        crea contraste sin tapar la página, el texto
                        se desvanece hacia el theme bg. Solo aparecen
                        cuando los controles están visibles. */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                key="top-veil"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height:
                                        "calc(env(safe-area-inset-top, 0px) + 76px)",
                                    background: `linear-gradient(180deg, ${themeCfg.bg} 0%, ${themeCfg.bg} 55%, ${themeCfg.bg}00 100%)`,
                                    zIndex: 22,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                key="bot-veil"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height:
                                        "calc(env(safe-area-inset-bottom, 0px) + 80px)",
                                    background: `linear-gradient(0deg, ${themeCfg.bg} 0%, ${themeCfg.bg} 55%, ${themeCfg.bg}00 100%)`,
                                    zIndex: 22,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {showControls && (
                            <motion.button
                                key="close-btn"
                                type="button"
                                aria-label="Cerrar"
                                onClick={requestClose}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 0.92, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    position: "absolute",
                                    top: "max(env(safe-area-inset-top), 12px)",
                                    right: 14,
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: `${themeCfg.text}1A`,
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    color: themeCfg.text,
                                    cursor: "pointer",
                                    fontSize: 22,
                                    lineHeight: 1,
                                    display: "grid",
                                    placeItems: "center",
                                    zIndex: 30,
                                    fontFamily: "'Inter',sans-serif",
                                    fontWeight: 300,
                                }}
                            >
                                ×
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showControls && (
                            <motion.button
                                key="aa-btn"
                                type="button"
                                aria-label="Ajustes"
                                onClick={() => {
                                    setShowSheet(true)
                                    armHideTimer()
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 0.92, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    position: "absolute",
                                    bottom: "max(env(safe-area-inset-bottom), 16px)",
                                    right: 14,
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: `${themeCfg.text}1A`,
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    color: themeCfg.text,
                                    cursor: "pointer",
                                    fontFamily:
                                        "'Iowan Old Style','Iowan',Georgia,serif",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    display: "grid",
                                    placeItems: "center",
                                    zIndex: 30,
                                }}
                            >
                                Aa
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* v1.8 — Indicador "X / Y · Z%" abajo centro.
                        Oculto hasta que las locations estén listas
                        (locationsReady). Si tenemos savedPct > 0 de
                        la RPC, mostramos solo el porcentaje desde el
                        inicio (sin el "X / Y" hasta que generate()
                        complete). Sin flash "0/0" ni "1/1 0%". */}
                    {(locationsReady || percentage > 0) && (
                        <div
                            style={{
                                position: "absolute",
                                bottom:
                                    "max(env(safe-area-inset-bottom), 24px)",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                zIndex: 25,
                                pointerEvents: "none",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 11,
                                letterSpacing: "0.08em",
                                color: themeCfg.muted,
                            }}
                            aria-live="polite"
                        >
                            {locationsReady && pageInfo.total > 0 && (
                                <React.Fragment>
                                    <span>
                                        {pageInfo.current} / {pageInfo.total}
                                    </span>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                </React.Fragment>
                            )}
                            <span>{percentage}%</span>
                        </div>
                    )}
                </React.Fragment>
            )}

            {/* Sheet de configuración — sube desde abajo */}
            <AnimatePresence>
                {showSheet && (
                    <motion.div
                        key="sheet-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setShowSheet(false)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.32)",
                            zIndex: 40,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                        }}
                    >
                        <motion.div
                            initial={{ y: 80 }}
                            animate={{ y: 0 }}
                            exit={{ y: 80 }}
                            transition={{
                                duration: 0.28,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: "min(92vw, 380px)",
                                margin: "0 0 28px",
                                padding: "20px 22px 22px",
                                borderRadius: 18,
                                background: themeCfg.sheet,
                                border: `1px solid ${themeCfg.divider}`,
                                boxShadow:
                                    "0 16px 56px rgba(0,0,0,0.22)",
                                color: themeCfg.text,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            {/* Tamaño */}
                            <div style={{ marginBottom: 22 }}>
                                <p
                                    style={{
                                        margin: "0 0 12px",
                                        fontSize: 10,
                                        opacity: 0.55,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.18em",
                                        color: themeCfg.text,
                                    }}
                                >
                                    Tamaño
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFontIdx((i) =>
                                                Math.max(0, i - 1)
                                            )
                                        }
                                        disabled={fontIdx === 0}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            border: `1px solid ${themeCfg.divider}`,
                                            background: "transparent",
                                            color: themeCfg.text,
                                            cursor:
                                                fontIdx === 0
                                                    ? "default"
                                                    : "pointer",
                                            opacity:
                                                fontIdx === 0 ? 0.4 : 1,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            fontFamily:
                                                "'Iowan Old Style','Iowan',Georgia,serif",
                                        }}
                                    >
                                        A−
                                    </button>
                                    <div
                                        style={{
                                            flex: 1,
                                            textAlign: "center",
                                            fontSize: 12,
                                            opacity: 0.65,
                                            color: themeCfg.text,
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        {fontIdx + 1} / {FONT_SIZES.length}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFontIdx((i) =>
                                                Math.min(
                                                    FONT_SIZES.length - 1,
                                                    i + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            fontIdx ===
                                            FONT_SIZES.length - 1
                                        }
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            border: `1px solid ${themeCfg.divider}`,
                                            background: "transparent",
                                            color: themeCfg.text,
                                            cursor:
                                                fontIdx ===
                                                FONT_SIZES.length - 1
                                                    ? "default"
                                                    : "pointer",
                                            opacity:
                                                fontIdx ===
                                                FONT_SIZES.length - 1
                                                    ? 0.4
                                                    : 1,
                                            fontSize: 18,
                                            fontWeight: 500,
                                            fontFamily:
                                                "'Iowan Old Style','Iowan',Georgia,serif",
                                        }}
                                    >
                                        A+
                                    </button>
                                </div>
                            </div>

                            {/* Tema */}
                            <div>
                                <p
                                    style={{
                                        margin: "0 0 12px",
                                        fontSize: 10,
                                        opacity: 0.55,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.18em",
                                        color: themeCfg.text,
                                    }}
                                >
                                    Tema
                                </p>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {(
                                        ["claro", "sepia", "oscuro"] as const
                                    ).map((t) => {
                                        const cfg = THEMES[t]
                                        const active = theme === t
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setTheme(t)}
                                                style={{
                                                    flex: 1,
                                                    padding: "13px 8px",
                                                    borderRadius: 12,
                                                    border: active
                                                        ? `2px solid ${themeCfg.text}`
                                                        : `1px solid ${themeCfg.divider}`,
                                                    background: cfg.bg,
                                                    color: cfg.text,
                                                    cursor: "pointer",
                                                    fontSize: 11,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.14em",
                                                    fontWeight: active
                                                        ? 600
                                                        : 400,
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                }}
                                            >
                                                {t}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    )
}

LectorCodice.displayName = "LectorCodice"
export default LectorCodice
