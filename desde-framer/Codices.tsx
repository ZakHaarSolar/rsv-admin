// Codices.tsx v5.3 — LA SALA GANA PRESENCIA (Zak): el título CÓDICES DE LUZ
// toma la misma medida que FRAGMENTOS DEL SOL (72px, peso 100, 0.4em — medido
// en producción; escalado a 44 en el teléfono), la invitación a acercarse a las
// obras baja a su propio renglón, el aire muerto bajo el último elemento se
// parte a la mitad, y la llamada al Escáner abre en la MISMA pestaña (como el
// planeta) con un destello que la cruza cada 4.2s.
//
// Codices.tsx v5.2 — 🜂 LA SALA VUELVE A DESPLAZARSE (Zak 2026-08-04: "en la
// pestaña de códices no nos deja scrollear hacia abajo, está bloqueado").
// Medido en producción: la sala llevaba `height: 100%`, que se resuelve contra
// un padre de alto automático → el porcentaje cae a `auto`, la sala crecía hasta
// 3452px y su propio `overflowY: auto` quedaba sin nada que desplazar
// (scrollHeight === clientHeight → maxScroll 0). Y como /codices es ruta de
// pantalla completa, el Domo bloquea el desplazamiento del documento
// (body/html overflow hidden), así que los 3232px de obras por debajo del
// primer pantallazo quedaban inalcanzables. Ahora usa un alto DEFINIDO de
// viewport (100dvh) → desplazamiento interno propio. Mismo patrón, verificado
// en vivo, de Privacy y de los paneles admin bajo el Domo.
// v5.1 — 🜂 LA SALA RESPIRA + EL ORDEN LO DA LA CASA (Zak
// 2026-08-03: "¿por qué solo están las obras de Aqua y las mías desaparecieron
// por completo?" + "le hace falta más dinamismo, más vida, más sentido épico").
//
// (1) EL ORDEN. No faltaba ningún Códice: la consulta ordenaba por autor y
// "Aqua´Riia" gana el alfabeto, así que sus dos obras ocupaban la primera
// pantalla y las NUEVE de Zak´Haar quedaban enterradas abajo. Ahora abre el ala
// de Zak´Haar —la voz principal de la casa— y las obras conservan el orden que
// Zak les da en la base (sort_order). Un autor nuevo entra sin tocar código.
//
// (2) LA VIDA. El material épico ya lo teníamos y estaba quieto: las portadas.
// Cada obra proyecta un AURA con su propio color (la misma portada, difuminada
// detrás — sin pedir una imagen más ni extraer color, que exigiría lienzo y
// CORS), la lámina se INCLINA hacia el cursor como un objeto que se puede mirar
// de lado, y un BARRIDO DE SEÑAL —el gesto del Escáner— la cruza al acercarse.
// Cada ala se enciende AL ENTRAR EN CUADRO: la línea del autor se dibuja y sus
// obras se materializan en cascada, así la sala se va habitando a medida que se
// recorre. Todo por compositor (transform/opacity) y respetando
// prefers-reduced-motion; a 10K tripulantes no se anima ni un layout.
//
// 🜂 NO entran trailers ni primeras páginas (Zak preguntó si convenían): leer
// aquí reabre justo lo que la v5.0 cerró —la casa dejó de ser sala de lectura y
// de tienda— y ninguno de los once libros tiene trailer hoy, así que la sección
// nacería vacía. El catálogo limpio se conserva: la obra se mira, se lee en el
// Escáner.
//
// Codices.tsx v5.0 — 🜂 LA SALA DE OBRA (Zak 2026-08-03: "Red Solar Viva deja
// de ser tienda y pasa a ser la casa que firma los productos"). La capa de
// Códices deja de vender: se retiran precios, pastillas de desbloquear,
// checkout de Stripe, Cristales, biblioteca del Tripulante, progreso de
// lectura y el lector integrado. Lo que queda son los once libros como OBRA
// EXPUESTA — portada protagonista, título, autor, de qué trata — y una sola
// llamada por libro y una general: leerlos dentro del Escáner Vibracional.
//
// Por qué: la web no vende (1 venta en 5 meses) y todo lo que se consume
// muchas veces vive en la app, que es donde la gente vuelve. Quien ya compró
// tiene su enlace y ya sabe que sus libros viven en el Escáner.
//
// Alcance: reestructuración LIGERA, no rediseño de identidad. Se conserva el
// lenguaje visual del sitio (cian de la casa, cristal, hairlines, respiración
// del título) y se le da aire: la portada es el centro de gravedad.
//
// Arquitectura: este archivo dejó de ser el despachador mobile/desktop hacia
// Co_Mobile/Co_Desktop (la implementación de la tienda, ~350 KB). Ahora trae
// la sala completa y NO los importa — así el sistema de compra no puede
// quedar a medias ni viajar en el bundle. Los Co_*.tsx quedan en disco, sin
// consumidores, por si alguna pieza se rescata después.
//
// La fuente de verdad del catálogo sigue siendo public.catalog_books en
// Supabase (Zak la edita ahí; el sitio la lee con la llave pública).
//
// Default export: ArchivoHolograficoLibros (también named export — Domo y
// AppNavegacionMobile lo importan por nombre).
//
// v4.0 — Shell post-split: wrapper fino que delegaba en Co_*.tsx.

import * as React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTES
   ═══════════════════════════════════════════════════════════════════ */

/* La casa de descarga del Escáner: una sola página con los dos botones
   de tienda (App Store + Android). Destino de TODA llamada de esta capa. */
const ESCANER_LANDING_URL = "https://escanervibracional.com"

/* Versionado: el inyector es idempotente por id, así que sin subir el
   número el navegador seguiría sirviendo la hoja anterior. */
const CSS_ID = "rsv-codices-sala-v2"

/* ═══════════════════════════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════════════════════════ */

function hexToRgba(hex?: string, a = 1): string {
    const h = (hex || "#00C2FF").replace("#", "")
    if (h.length !== 6) return `rgba(0,194,255,${a})`
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0,194,255,${a})`
    return `rgba(${r},${g},${b},${a})`
}

/* Portada de respaldo cuando un Códice todavía no tiene imagen: una
   lámina de cristal con la inicial del título. Nunca un hueco roto. */
function makeFallbackCover(title: string, accent: string): string {
    const letter = (title || "?").trim().charAt(0).toUpperCase()
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0B1220"/><stop offset="1" stop-color="#050810"/>
</linearGradient></defs>
<rect width="400" height="600" fill="url(#g)"/>
<rect x="1" y="1" width="398" height="598" fill="none" stroke="${accent}" stroke-opacity="0.28"/>
<text x="200" y="330" font-family="Inter,sans-serif" font-size="150" font-weight="200"
 fill="${accent}" fill-opacity="0.5" text-anchor="middle">${letter}</text>
</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/* Viewport local. Un hook propio, sin dependencias de la tienda, para
   que la sala no arrastre su CSS ni sus contextos. */
function useIsMobileLocal(): boolean {
    const read = () => {
        if (typeof window === "undefined") return false
        const ua = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(
            navigator.userAgent || ""
        )
        return ua || window.innerWidth < 900
    }
    const [mobile, setMobile] = useState<boolean>(read)
    useEffect(() => {
        if (typeof window === "undefined") return
        const fn = () => setMobile(read())
        fn()
        window.addEventListener("resize", fn)
        return () => window.removeEventListener("resize", fn)
    }, [])
    return mobile
}

/* CSS propio de la sala. Idempotente por id. `nuc-breath` puede existir
   ya (lo usan otras capas); redeclararlo con el mismo cuerpo es inocuo. */
function useInjectSalaCSS() {
    useEffect(() => {
        if (typeof document === "undefined") return
        if (document.getElementById(CSS_ID)) return
        const el = document.createElement("style")
        el.id = CSS_ID
        el.textContent = `
@keyframes nuc-breath{0%,100%{opacity:.92}50%{opacity:1}}
@keyframes rsv-sala-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.rsv-sala-scroll{-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none}
.rsv-sala-scroll::-webkit-scrollbar{width:0;height:0;display:none}
.rsv-clamp3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* ── LA LLAMADA AL ESCÁNER ESTÁ VIVA ──────────────────────────────
   Un barrido de luz cruza el botón cada 4.2s: ocupa el 17% del ciclo
   y descansa el resto, así late en vez de parpadear. Mismo gesto que
   la puerta de escritorio de la landing del Escáner. */
.rsv-cod-shim{animation:rsv-cod-shim 4.2s cubic-bezier(.22,1,.36,1) 1.1s infinite}
@keyframes rsv-cod-shim{
  0%{left:-55%;opacity:.9}
  17%{left:118%;opacity:.9}
  17.01%,100%{left:-55%;opacity:0}}
@media(prefers-reduced-motion:reduce){.rsv-cod-shim{animation:none;opacity:0}}

/* ── LA OBRA RESPIRA ──────────────────────────────────────────────
   El aire de la sala lo pone el propio arte de las portadas. Todo
   corre por el compositor (transform/opacity): a 10K tripulantes no
   se anima ni un layout. */
.rsv-obra{cursor:pointer;position:relative;
  transition:transform .5s cubic-bezier(.22,1,.36,1)}
.rsv-obra:hover{transform:translateY(-9px)}

/* La lámina se inclina hacia donde está el cursor: la portada deja de
   ser una estampa y se vuelve un objeto que se puede mirar de lado. */
.rsv-obra-tilt{position:relative;transform-style:preserve-3d;
  transition:transform .45s cubic-bezier(.22,1,.36,1)}
.rsv-obra-lam{position:relative;z-index:1;
  transition:border-color .45s ease,box-shadow .45s ease}

/* AURA: la portada es la fuente de luz de la sala. En reposo apenas se
   insinúa; al acercarse, florece. */
/* El aura DESBORDA la lámina: si queda dentro, la portada opaca la tapa
   entera y no se ve nada. La luz tiene que caer alrededor de la obra. */
.rsv-obra-halo{position:absolute;left:-9%;right:-9%;top:-5%;bottom:-9%;
  border-radius:50%;filter:blur(42px);opacity:.28;z-index:0;
  pointer-events:none;
  transition:opacity .55s ease,transform .55s cubic-bezier(.22,1,.36,1)}
.rsv-obra:hover .rsv-obra-halo{opacity:.78;transform:scale(1.09)}

/* BARRIDO DE SEÑAL: el gesto del Escáner cruzando la obra. */
.rsv-obra-scan{position:absolute;inset:0;z-index:2;pointer-events:none;
  opacity:0;transform:translateX(-130%);
  background:linear-gradient(104deg,transparent 36%,
    rgba(255,255,255,.15) 50%,transparent 64%)}
.rsv-obra:hover .rsv-obra-scan{opacity:1;
  animation:rsv-obra-scan 1.15s cubic-bezier(.32,.72,.36,1) both}
@keyframes rsv-obra-scan{from{transform:translateX(-130%)}
  to{transform:translateX(130%)}}

/* El título se enciende con la obra. */
.rsv-obra-tit{transition:color .45s ease,text-shadow .45s ease}

/* ── EL ALA SE ABRE AL ENTRAR EN CUADRO ───────────────────────────
   Las obras se materializan en cascada cuando su ala entra en la
   pantalla, así la sala se va habitando a medida que uno la recorre.

   🜂 LA SALA NACE VISIBLE. El estado oculto NO es el de reposo: lo
   ARMA el propio componente (clase rsv-armada) y solo cuando puede
   garantizar que algo lo va a encender. Al revés —ocultar de entrada y
   esperar al observador— basta con que el observador no dispare (una
   pestaña en segundo plano, un regreso de caché) para que el catálogo
   entero quede en blanco. Perder la cascada es un adorno; perder los
   once Códices es la capa rota. */
.rsv-ala.rsv-armada .rsv-ala-obra{opacity:0;transform:translateY(22px)}
.rsv-ala.rsv-armada.rsv-vista .rsv-ala-obra{
  animation:rsv-sala-in .72s cubic-bezier(.22,1,.36,1) both}
/* La línea del ala se dibuja sola. */
.rsv-ala.rsv-armada .rsv-ala-linea{transform:scaleX(0);
  transform-origin:left center;
  transition:transform 1.05s cubic-bezier(.22,1,.36,1) .1s}
.rsv-ala.rsv-armada.rsv-vista .rsv-ala-linea{transform:scaleX(1)}
.rsv-ala.rsv-armada .rsv-ala-cartela{opacity:0;transform:translateY(10px);
  transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1)}
.rsv-ala.rsv-armada.rsv-vista .rsv-ala-cartela{opacity:1;transform:none}

@media (prefers-reduced-motion: reduce){
  .rsv-obra,.rsv-obra-tilt,.rsv-obra-halo,.rsv-obra-scan{
    transition:none!important;animation:none!important;transform:none!important}
  .rsv-ala .rsv-ala-obra,.rsv-ala .rsv-ala-cartela{opacity:1!important;
    transform:none!important;animation:none!important}
  .rsv-ala .rsv-ala-linea{transform:scaleX(1)!important;transition:none!important}
}
`
        document.head.appendChild(el)
    }, [])
}

/* ═══════════════════════════════════════════════════════════════════
   CATÁLOGO — public.catalog_books
   ═══════════════════════════════════════════════════════════════════ */

type Obra = {
    key: string
    title: string
    author: string
    cover?: string
    shortDesc?: string
    longDesc?: string
    year?: string | number
    pageCount?: string | number
}

function useCatalogo(
    supabaseUrl?: string,
    supabaseAnonKey?: string,
    fallbackList?: any[]
): { obras: Obra[]; cargando: boolean } {
    const [rows, setRows] = useState<Obra[] | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) {
            setCargando(false)
            return
        }
        let cancelado = false
        fetch(
            `${supabaseUrl}/rest/v1/catalog_books?select=*&is_active=eq.true&order=sort_order.asc`,
            {
                headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
            }
        )
            .then((r) => (r.ok ? r.json() : []))
            .then((data: any[]) => {
                if (cancelado) return
                if (Array.isArray(data) && data.length > 0) {
                    setRows(
                        data.map((row: any, i: number) => ({
                            key: String(row.book_id || row.title || i),
                            title: row.title || "Sin título",
                            author: row.author_option || "Zak´Haar",
                            cover: row.cover_url || undefined,
                            shortDesc: row.short_desc || undefined,
                            longDesc: row.long_desc || undefined,
                            year: row.publication_year || undefined,
                            pageCount: row.page_count || undefined,
                        }))
                    )
                }
                setCargando(false)
            })
            .catch(() => {
                if (!cancelado) setCargando(false)
            })
        return () => {
            cancelado = true
        }
    }, [supabaseUrl, supabaseAnonKey])

    /* Respaldo: si la lectura no devolvió nada y el canvas trae una
       lista vieja, se muestra igual — solo portada/título/sinopsis. Los
       campos de tienda de esa lista se ignoran por completo. */
    const obras = useMemo<Obra[]>(() => {
        if (rows && rows.length > 0) return rows
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
            return fallbackList.map((b: any, i: number) => ({
                key: String(b.bookId || b.title || i),
                title: b.title || "Sin título",
                author: b.authorOption || b.author || "Zak´Haar",
                cover: b.cover || b.coverUrl || undefined,
                shortDesc: b.shortDesc || undefined,
                longDesc: b.longDesc || b.synopsis || undefined,
                year: b.year || undefined,
                pageCount: b.pageCount || undefined,
            }))
        }
        return []
    }, [rows, fallbackList])

    return { obras, cargando }
}

/* ═══════════════════════════════════════════════════════════════════
   PIEZAS DE UI
   ═══════════════════════════════════════════════════════════════════ */

/* Llamada única de la capa: los Códices se leen dentro del Escáner. */
function LlamadaEscaner({
    accent,
    label,
    variant = "solida",
}: {
    accent: string
    label: string
    variant?: "solida" | "linea"
}) {
    const [hover, setHover] = useState(false)
    const solida = variant === "solida"
    return (
        <a
            href={ESCANER_LANDING_URL}
            /* 🜂 v5.3 — MISMA PESTAÑA, COMO EL PLANETA. Ir al Escáner desde
               Red Solar Viva es un viaje, no una consulta de referencia: el
               planeta del sistema solar siempre llevó en la misma pestaña y
               este botón abría una nueva, así que la casa se comportaba de
               dos maneras distintas para el mismo destino. Ahora es una sola,
               y el regreso existe: la landing del Escáner tiene su puente de
               vuelta a Red Solar Viva al pie. */
            rel="noopener"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                position: "relative",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: solida ? "14px 26px" : "11px 20px",
                borderRadius: 999,
                textDecoration: "none",
                fontFamily: "'Inter',sans-serif",
                fontSize: solida ? 12.5 : 11.5,
                fontWeight: 400,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                color: solida ? "#03070E" : hover ? "#FFFFFF" : accent,
                background: solida
                    ? `linear-gradient(135deg, ${accent}, #FFFFFF)`
                    : hover
                      ? hexToRgba(accent, 0.14)
                      : "rgba(255,255,255,0.04)",
                border: solida
                    ? "1px solid transparent"
                    : `1px solid ${hexToRgba(accent, hover ? 0.6 : 0.32)}`,
                boxShadow: solida
                    ? `0 0 ${hover ? 34 : 22}px ${hexToRgba(accent, hover ? 0.5 : 0.3)}`
                    : "none",
                transform: hover ? "translateY(-1px)" : "none",
                transition:
                    "background .3s ease, box-shadow .3s ease, color .3s ease, border-color .3s ease, transform .3s ease",
                cursor: "pointer",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {/* 🜂 v5.3 — DESTELLO VIVO. Un barrido de luz cruza el botón cada
                4.2s aunque nadie lo esté señalando, igual que la puerta de
                escritorio de la landing del Escáner: la llamada se lee como
                encendida y no como un rótulo apagado. Ocupa una fracción del
                ciclo y descansa el resto — un latido, no un estroboscopio. */}
            <span
                aria-hidden="true"
                className="rsv-cod-shim"
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "-55%",
                    width: "45%",
                    pointerEvents: "none",
                    transform: "skewX(-18deg)",
                    background: solida
                        ? "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)"
                        : `linear-gradient(100deg, transparent 0%, ${hexToRgba(accent, 0.34)} 50%, transparent 100%)`,
                }}
            />
            <span
                aria-hidden="true"
                style={{
                    position: "relative",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flex: "0 0 auto",
                    background: solida ? "#03070E" : accent,
                    opacity: solida ? 0.55 : 0.9,
                }}
            />
            <span style={{ position: "relative" }}>{label}</span>
        </a>
    )
}

/* Un ala de la sala. Se enciende cuando entra en cuadro: la línea del
   autor se dibuja y sus obras se materializan en cascada, así la sala se
   va habitando a medida que uno la recorre en vez de aparecer entera de
   golpe. La marca es una CLASE (el CSS hace todo el trabajo) → cero
   re-render por scroll.

   🜂 EL ALA NACE VISIBLE Y SE ARMA DESPUÉS. El ocultamiento previo a la
   cascada lo enciende este efecto (`rsv-armada`) y SOLO si hay
   observador, la pestaña está a la vista y no se pidió menos movimiento.
   Verificado en vivo: con la pestaña en segundo plano el observador NO
   dispara nunca, y con el ocultamiento como estado de reposo el catálogo
   entero se quedaba en blanco. Perder la cascada es perder un adorno;
   perder los once Códices es la capa rota. */
function Ala({
    children,
    style,
}: {
    children: React.ReactNode
    style?: React.CSSProperties
}) {
    const ref = useRef<HTMLElement>(null)
    useEffect(() => {
        const el = ref.current
        if (typeof window === "undefined" || !el) return
        let menos = false
        try {
            menos =
                typeof window.matchMedia === "function" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch {}
        /* Si no hay quien encienda, el ala se queda como nació: visible. */
        if (
            menos ||
            typeof IntersectionObserver === "undefined" ||
            document.hidden
        )
            return

        el.classList.add("rsv-armada")
        /* Al encender corre la cascada y, cuando termina, el ala DESARMA:
           vuelve al estado plano visible. Así el resultado final no queda
           colgado del relleno de la animación — si el navegador la congela
           a mitad (una pestaña que se va al fondo justo entonces), lo que
           sostiene el "from" es opacity 0 y la obra se quedaría invisible.
           Desarmada, no hay animación de la que depender. */
        let desarme = 0
        const encender = () => {
            if (el.classList.contains("rsv-vista")) return
            el.classList.add("rsv-vista")
            desarme = window.setTimeout(
                () => el.classList.remove("rsv-armada"),
                1800
            )
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return
                    encender()
                    io.unobserve(e.target)
                })
            },
            { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
        )
        io.observe(el)
        /* Red de seguridad: si a los 4s el ala sigue apagada (observador
           que no dispara, pestaña que se fue a segundo plano a media
           carga), se enciende igual. Nadie se queda sin obra. */
        const red = window.setTimeout(encender, 4000)
        return () => {
            io.disconnect()
            window.clearTimeout(red)
            window.clearTimeout(desarme)
        }
    }, [])
    return (
        <section ref={ref} className="rsv-ala" style={style}>
            {children}
        </section>
    )
}

/* Una obra en la sala: la portada manda, el texto acompaña. */
function ObraCard({
    obra,
    accent,
    isMobile,
    onOpen,
    index,
}: {
    obra: Obra
    accent: string
    isMobile: boolean
    onOpen: () => void
    index: number
}) {
    const cover = obra.cover || makeFallbackCover(obra.title, accent)
    const sinopsis = obra.shortDesc || obra.longDesc || ""
    const tiltRef = useRef<HTMLDivElement>(null)

    /* La lámina se inclina hacia el cursor: la portada deja de ser una
       estampa y se vuelve un objeto que se puede mirar de lado. Solo en
       computadora (en el teléfono no hay cursor y el gesto es el toque) y
       escribiendo el transform directo al nodo — cero re-render por frame. */
    const inclinar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = tiltRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.transform =
            `perspective(900px) rotateY(${(px * 9).toFixed(2)}deg) ` +
            `rotateX(${(-py * 7).toFixed(2)}deg)`
    }, [])
    const enderezar = useCallback(() => {
        const el = tiltRef.current
        if (el) el.style.transform = ""
    }, [])

    return (
        <div
            className="rsv-obra rsv-ala-obra"
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onOpen()
                }
            }}
            onMouseMove={isMobile ? undefined : inclinar}
            onMouseLeave={isMobile ? undefined : enderezar}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                outline: "none",
                animationDelay: `${Math.min(index, 9) * 0.07}s`,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {/* Lámina de la portada */}
            <div className="rsv-obra-tilt" ref={tiltRef}>
                {/* AURA — la propia portada, difuminada: cada obra ilumina la
                    sala con SU color real, sin pedir una imagen más ni tocar
                    el lienzo (nada de extraer color, que exigiría CORS). */}
                <div
                    className="rsv-obra-halo"
                    aria-hidden="true"
                    style={{
                        backgroundImage: `url(${cover})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div
                    className="rsv-obra-lam"
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "2 / 3",
                        borderRadius: 4,
                        overflow: "hidden",
                        background: "#050810",
                        border: `1px solid ${hexToRgba(accent, 0.16)}`,
                        boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
                    }}
                >
                    <img
                        src={cover}
                        alt={obra.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            userSelect: "none",
                        }}
                    />
                    {/* Velo inferior: asienta la portada, no la tapa. */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background:
                                "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(3,7,14,0.45) 100%)",
                        }}
                    />
                    {/* Barrido de señal — el gesto del Escáner sobre la obra. */}
                    <div className="rsv-obra-scan" aria-hidden="true" />
                </div>
            </div>

            {/* Cartela de la obra */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <h3
                    className="rsv-obra-tit"
                    style={{
                        margin: 0,
                        fontFamily: "'Inter',sans-serif",
                        fontSize: isMobile ? 16 : 17,
                        fontWeight: 300,
                        letterSpacing: "0.02em",
                        lineHeight: 1.25,
                        color: "rgba(255,255,255,0.95)",
                    }}
                >
                    {obra.title}
                </h3>
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 10.5,
                        fontWeight: 400,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: hexToRgba(accent, 0.78),
                    }}
                >
                    {obra.author}
                </span>
                {sinopsis ? (
                    <p
                        className="rsv-clamp3"
                        style={{
                            margin: "4px 0 0",
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 13,
                            fontWeight: 300,
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.5)",
                        }}
                    >
                        {sinopsis}
                    </p>
                ) : null}
            </div>
        </div>
    )
}

/* Ficha de la obra: se abre al acercarse a una pieza. Portaleada al
   body para no quedar atrapada por los transform de las capas
   animadas del Domo (regla del proyecto: fixed dentro de motion.div
   con animate se ancla al padre, no al viewport). */
function Ficha({
    obra,
    accent,
    isMobile,
    onClose,
}: {
    obra: Obra
    accent: string
    isMobile: boolean
    onClose: () => void
}) {
    useEffect(() => {
        if (typeof window === "undefined") return
        const fn = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", fn)
        return () => window.removeEventListener("keydown", fn)
    }, [onClose])

    if (typeof document === "undefined") return null

    const cover = obra.cover || makeFallbackCover(obra.title, accent)
    const texto = obra.longDesc || obra.shortDesc || ""
    const meta = [
        obra.year ? String(obra.year) : "",
        obra.pageCount ? `${obra.pageCount} páginas` : "",
    ].filter(Boolean)

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                alignItems: isMobile ? "flex-end" : "center",
                justifyContent: "center",
                padding: isMobile ? 0 : 32,
                background: "rgba(2,5,11,0.86)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: isMobile ? 40 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="rsv-sala-scroll"
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: isMobile ? "100%" : 940,
                    maxHeight: isMobile ? "88dvh" : "86vh",
                    overflowY: "auto",
                    borderRadius: isMobile ? "18px 18px 0 0" : 8,
                    padding: isMobile ? "26px 20px 34px" : 40,
                    background:
                        "linear-gradient(180deg, rgba(10,17,30,0.96), rgba(4,8,16,0.98))",
                    border: `1px solid ${hexToRgba(accent, 0.2)}`,
                    boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
                }}
            >
                {/* Cerrar */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute",
                        top: isMobile ? 14 : 18,
                        right: isMobile ? 14 : 18,
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                        fontSize: 17,
                        lineHeight: 1,
                        padding: 0,
                        zIndex: 2,
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    ✕
                </button>

                <div
                    style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 24 : 40,
                        alignItems: isMobile ? "center" : "flex-start",
                    }}
                >
                    {/* Portada */}
                    <div
                        style={{
                            flex: isMobile ? "0 0 auto" : "0 0 250px",
                            width: isMobile ? "min(200px, 55%)" : 250,
                            aspectRatio: "2 / 3",
                            borderRadius: 4,
                            overflow: "hidden",
                            background: "#050810",
                            border: `1px solid ${hexToRgba(accent, 0.2)}`,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                        }}
                    >
                        <img
                            src={cover}
                            alt={obra.title}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>

                    {/* Cartela larga */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            textAlign: isMobile ? "center" : "left",
                            alignItems: isMobile ? "center" : "stretch",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 10.5,
                                fontWeight: 400,
                                letterSpacing: "0.24em",
                                textTransform: "uppercase",
                                color: hexToRgba(accent, 0.8),
                            }}
                        >
                            {obra.author}
                        </span>
                        <h2
                            style={{
                                margin: 0,
                                fontFamily: "'Inter',sans-serif",
                                fontSize: isMobile ? 24 : 32,
                                fontWeight: 200,
                                letterSpacing: "0.01em",
                                lineHeight: 1.2,
                                color: "#FFFFFF",
                            }}
                        >
                            {obra.title}
                        </h2>
                        {meta.length > 0 ? (
                            <span
                                style={{
                                    fontFamily:
                                        "'JetBrains Mono', ui-monospace, monospace",
                                    fontSize: 10.5,
                                    letterSpacing: "0.14em",
                                    color: "rgba(255,255,255,0.34)",
                                }}
                            >
                                {meta.join("  ·  ")}
                            </span>
                        ) : null}
                        <div
                            aria-hidden="true"
                            style={{
                                height: 1,
                                width: isMobile ? 60 : 90,
                                background: `linear-gradient(90deg, ${hexToRgba(accent, 0.55)}, transparent)`,
                                margin: "4px 0",
                            }}
                        />
                        {texto ? (
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 14.5,
                                    fontWeight: 300,
                                    lineHeight: 1.75,
                                    color: "rgba(255,255,255,0.68)",
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {texto}
                            </p>
                        ) : null}
                        <div style={{ marginTop: 10 }}>
                            <LlamadaEscaner
                                accent={accent}
                                label="Léelo en el Escáner"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ═══════════════════════════════════════════════════════════════════
   ArchivoHolograficoLibros — la sala
   ═══════════════════════════════════════════════════════════════════ */

export function ArchivoHolograficoLibros(props: any) {
    const p = props || {}
    const accentColor = p.accentColor || "#00C2FF"
    const supabaseUrl = p.supabaseUrl || ""
    const supabaseAnonKey = p.supabaseAnonKey || ""
    const booksList = p.booksList
    const topPaddingPx = typeof p.topPaddingPx === "number" ? p.topPaddingPx : 0
    const bottomReservePx =
        typeof p.bottomReservePx === "number" ? p.bottomReservePx : 0
    /* "centered" = raíz /codices (título grande, sin prefijo). Cualquier
       otro valor = dentro del shell del Escáner (prefijo arriba a la
       izquierda). */
    const centered = p.mobileTitleMode === "centered"

    const accent =
        typeof accentColor === "string" && accentColor.startsWith("#")
            ? accentColor
            : "#00C2FF"

    /* 🜂 TODOS los hooks arriba, sin excepción, antes de cualquier return
       condicional. Un hook debajo de un return temprano deja a React
       contando hooks distintos entre renders (#310) y tumba la capa
       completa — es lo que dejó la portada en negro el 2026-08-03. */
    const isMobile = useIsMobileLocal()
    useInjectSalaCSS()
    const { obras, cargando } = useCatalogo(
        supabaseUrl,
        supabaseAnonKey,
        booksList
    )
    const [abierta, setAbierta] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    /* Las obras se agrupan por autor: la sala tiene dos alas y cada una
       lleva el nombre de quien firma. Con un solo autor la agrupación
       desaparece sola.

       🜂 EL ORDEN LO DA LA CASA, NO EL ALFABETO (Zak 2026-08-03: "¿por qué
       solo están las obras de Aqua y las mías desaparecieron?"). No faltaba
       ninguna: la consulta ordenaba por autor y "Aqua´Riia" gana el alfabeto,
       así que sus dos obras ocupaban la primera pantalla y las nueve de
       Zak´Haar quedaban enterradas abajo. Ahora el ala de Zak´Haar —la voz
       principal de la casa— abre la sala, y cualquier autor nuevo entra
       después sin tocar código. */
    const alas = useMemo(() => {
        const mapa = new Map<string, Obra[]>()
        obras.forEach((o) => {
            const k = o.author || "—"
            if (!mapa.has(k)) mapa.set(k, [])
            mapa.get(k)!.push(o)
        })
        const norm = (s: string) =>
            s
                .normalize("NFD")
                .replace(/[\u0300-\u036f\u00b4\u2019'`]/g, "")
                .toLowerCase()
        const peso = (a: string) => (norm(a).startsWith("zakhaar") ? 0 : 1)
        return Array.from(mapa.entries()).sort(
            (a, b) => peso(a[0]) - peso(b[0])
        )
    }, [obras])

    const obraAbierta = useMemo(
        () => obras.find((o) => o.key === abierta) || null,
        [obras, abierta]
    )

    const cerrarFicha = useCallback(() => setAbierta(null), [])

    /* Con la ficha abierta el fondo no scrollea. */
    useEffect(() => {
        if (typeof document === "undefined") return
        if (!obraAbierta) return
        const previo = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = previo
        }
    }, [obraAbierta])

    const columnas = isMobile ? 2 : 3
    const anchoMax = isMobile ? "100%" : 1080

    /* Gate de hidratación — DESPUÉS de todos los hooks. */
    if (!mounted)
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: "100vh",
                    background: "transparent",
                }}
            />
        )

    return (
        <div
            ref={scrollRef}
            className="rsv-sala-scroll"
            style={{
                position: "relative",
                width: "100%",
                /* 🜂 v5.2 — LA SALA VUELVE A DESPLAZARSE (Zak 2026-08-04: "en la
                   pestaña de códices no nos deja scrollear hacia abajo, está
                   bloqueado"). Medido en producción: con `height: 100%` el alto
                   se resolvía contra un padre de alto automático → el porcentaje
                   caía a `auto`, la sala crecía hasta 3452px y su
                   `overflowY: auto` quedaba sin nada que desplazar
                   (scrollHeight === clientHeight). Y como /codices es ruta de
                   pantalla completa, el Domo bloquea el desplazamiento del
                   documento (body/html overflow hidden) → los 3232px restantes
                   quedaban inalcanzables. Con un alto DEFINIDO de viewport la
                   sala vuelve a tener su propio desplazamiento interno. Mismo
                   patrón, ya probado en vivo, de Privacy y de los paneles. */
                height: "100dvh",
                minHeight: "100dvh",
                overflowY: "auto",
                overflowX: "hidden",
                background: "transparent",
                color: "#FFFFFF",
                WebkitFontSmoothing: "antialiased",
            }}
        >
            <div
                style={{
                    maxWidth: anchoMax,
                    margin: "0 auto",
                    /* 🜂 v5.3 — El aire bajo el último elemento se parte a la
                       mitad (96→48 en escritorio, 48→24 de extra en el
                       teléfono): al llegar al fondo de la sala quedaba un
                       vacío que se leía como "aquí falta algo". El colchón de
                       la barra inferior del teléfono (bottomReservePx) NO se
                       toca: eso no es aire, es el espacio que ocupa la barra. */
                    padding: isMobile
                        ? `0 18px calc(${bottomReservePx}px + 24px)`
                        : "0 32px 48px",
                }}
            >
                {/* ═══ Encabezado ═══ */}
                {centered ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.1,
                        }}
                        style={{
                            textAlign: "center",
                            paddingTop: `calc(${Math.max(
                                topPaddingPx,
                                isMobile ? 60 : 116
                            )}px + env(safe-area-inset-top, 0px))`,
                            paddingBottom: 6,
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                /* 🜂 v5.3 — MISMA PRESENCIA QUE FRAGMENTOS DEL
                                   SOL. Medido en producción: aquel título vive
                                   en 72px, peso 100 y 0.4em de separación; este
                                   estaba en 46/200/0.2em y al lado se leía como
                                   un subtítulo. En escritorio la receta es
                                   idéntica; en el teléfono el mismo cuerpo pero
                                   escalado (72px con 0.4em ocuparía tres
                                   renglones y se comería la primera pantalla de
                                   una sala que es, sobre todo, para recorrer). */
                                fontSize: isMobile ? 44 : 72,
                                fontWeight: 100,
                                letterSpacing: "0.4em",
                                paddingLeft: "0.4em",
                                textTransform: "uppercase",
                                margin: 0,
                                lineHeight: 1.1,
                                userSelect: "none",
                                color: "transparent",
                                filter: `drop-shadow(0 0 14px ${hexToRgba(accent, 0.35)})`,
                                animation: "nuc-breath 7s ease-in-out infinite",
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
                                CÓDICES DE LUZ
                            </span>
                        </h1>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        style={{
                            textAlign: "left",
                            paddingTop: `calc(${topPaddingPx}px + env(safe-area-inset-top, 0px))`,
                            paddingBottom: 4,
                        }}
                    >
                        <h1
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
                                filter: `drop-shadow(0 0 10px ${hexToRgba(accent, 0.3)})`,
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
                                HOLOTECA · CÓDICES DE LUZ
                            </span>
                        </h1>
                    </motion.div>
                )}

                {/* ═══ Cartela de sala ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.22,
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: centered ? "center" : "flex-start",
                        textAlign: centered ? "center" : "left",
                        gap: 18,
                        paddingTop: centered ? 14 : 18,
                        paddingBottom: isMobile ? 34 : 52,
                        maxWidth: 620,
                        marginLeft: centered ? "auto" : 0,
                        marginRight: centered ? "auto" : 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 10.5,
                            fontWeight: 400,
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: hexToRgba(accent, 0.62),
                        }}
                    >
                        Biblioteca de la Nueva Tierra
                    </span>
                    <p
                        style={{
                            margin: 0,
                            fontFamily: "'Inter',sans-serif",
                            fontSize: isMobile ? 14 : 15.5,
                            fontWeight: 300,
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.62)",
                        }}
                    >
                        Los Códices de Luz se leen y se escuchan dentro del
                        Escáner Vibracional.
                        {/* La invitación a recorrer la sala vive en su propio
                            renglón: es una instrucción de uso, no la
                            continuación de la frase anterior. */}
                        <span style={{ display: "block" }}>
                            Aquí están expuestos: acércate a cualquiera para ver
                            de qué trata.
                        </span>
                    </p>
                    <LlamadaEscaner
                        accent={accent}
                        label="Abrir el Escáner Vibracional"
                    />
                </motion.div>

                {/* ═══ Las obras ═══ */}
                {cargando && obras.length === 0 ? (
                    <div
                        style={{
                            padding: "60px 0",
                            textAlign: "center",
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 11.5,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: hexToRgba(accent, 0.45),
                            animation: "nuc-breath 2.4s ease-in-out infinite",
                        }}
                    >
                        Abriendo la sala…
                    </div>
                ) : (
                    alas.map(([autor, lista]) => (
                        <Ala
                            key={autor}
                            style={{ marginBottom: isMobile ? 46 : 74 }}
                        >
                            {alas.length > 1 ? (
                                <div
                                    className="rsv-ala-cartela"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                        marginBottom: isMobile ? 22 : 30,
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: isMobile ? 12 : 13,
                                            fontWeight: 300,
                                            letterSpacing: "0.24em",
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.72)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {autor}
                                    </h2>
                                    {/* Cuántas obras firma — le da peso de
                                        colección a cada ala. */}
                                    <span
                                        style={{
                                            fontFamily:
                                                "'JetBrains Mono',monospace",
                                            fontSize: 10,
                                            letterSpacing: "0.14em",
                                            color: hexToRgba(accent, 0.55),
                                            whiteSpace: "nowrap",
                                            flex: "0 0 auto",
                                        }}
                                    >
                                        {lista.length}{" "}
                                        {lista.length === 1 ? "OBRA" : "OBRAS"}
                                    </span>
                                    <div
                                        className="rsv-ala-linea"
                                        aria-hidden="true"
                                        style={{
                                            flex: 1,
                                            height: 1,
                                            background: `linear-gradient(90deg, ${hexToRgba(accent, 0.32)}, transparent)`,
                                        }}
                                    />
                                </div>
                            ) : null}
                            {/* Rieles de ancho fijo + centrado, y tantos
                                rieles como obras tenga el ala (hasta el
                                máximo): así un ala de dos queda centrada
                                en la pared sin que sus piezas cambien de
                                tamaño respecto a un ala de nueve. Con
                                rieles fijos en 3 el tercero vacío
                                empujaba el par a la izquierda. */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: isMobile
                                        ? `repeat(${columnas}, minmax(0, 1fr))`
                                        : `repeat(${Math.min(
                                              columnas,
                                              lista.length
                                          )}, minmax(0, 316px))`,
                                    justifyContent: "center",
                                    columnGap: isMobile ? 16 : 34,
                                    rowGap: isMobile ? 34 : 54,
                                }}
                            >
                                {lista.map((o, i) => (
                                    <ObraCard
                                        key={o.key}
                                        obra={o}
                                        accent={accent}
                                        isMobile={isMobile}
                                        index={i}
                                        onOpen={() => setAbierta(o.key)}
                                    />
                                ))}
                            </div>
                        </Ala>
                    ))
                )}

                {/* ═══ Cierre de sala ═══ */}
                {obras.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            gap: 18,
                            paddingTop: isMobile ? 10 : 24,
                            paddingBottom: 10,
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                width: 1,
                                height: 46,
                                background: `linear-gradient(180deg, transparent, ${hexToRgba(accent, 0.4)})`,
                            }}
                        />
                        <p
                            style={{
                                margin: 0,
                                maxWidth: 460,
                                fontFamily: "'Inter',sans-serif",
                                fontSize: isMobile ? 14 : 15,
                                fontWeight: 300,
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.6)",
                            }}
                        >
                            Todos viven dentro del Escáner Vibracional, con su
                            audiolibro cuando existe.
                        </p>
                        <LlamadaEscaner
                            accent={accent}
                            label="Léelos en el Escáner"
                        />
                    </div>
                ) : null}
            </div>

            {obraAbierta ? (
                <Ficha
                    obra={obraAbierta}
                    accent={accent}
                    isMobile={isMobile}
                    onClose={cerrarFicha}
                />
            ) : null}
        </div>
    )
}

ArchivoHolograficoLibros.displayName = "RSV_Codices_Sala"

export default ArchivoHolograficoLibros
