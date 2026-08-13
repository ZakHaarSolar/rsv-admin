// Red Solar Viva — MN_Codices.tsx v1.10.2
// v1.10.1 — Re-trigger del watcher tras pérdida de fs.watch event en macOS.
// v1.10 — Acceso directo al visor desde la fila del Códice. Una
// columna izquierda de 56px con un botón ojo dorado abre el
// LectorCodice al instante (cuando el Códice trae EPUB). Quitada
// la fecha de adquisición — ganamos espacio para el ojo + chevron.
// Pegada al pie del card una barra de progreso de lectura que se
// llena con el % real (RPC get_my_reading_progress, batch). Si el
// Tripulante nunca lo abrió, la barra es un trazo cyan tenue al
// 0%; al avanzar pasa al gradient dorado. Pill "Leer" del bloque
// expandido removida (el ojo cubre la acción).
// v1.9 — Botón "Leer" junto a "Descargar" cuando el Códice trae
// formato EPUB. Abre LectorCodice (visor EPUB nativo fullscreen
// portaled a document.body) sin sacar al Tripulante del Domo. Pill
// dorada (acción primaria de lectura) vs pill cyan de descarga.
// Lazy-load: epubjs solo se descarga cuando el visor se monta. La
// posición exacta de lectura persiste vía RPCs reading_progress
// (CFI + porcentaje) — al reabrir el mismo Códice arranca donde
// quedó.
// v1.8.1 — Re-trigger por waitForComponentLoader timeout sistémico.
// v1.8 — minHeight del empty state pasa de 70vh a 90dvh. Con 70vh el
// bloque solo ocupaba el 70% del viewport y, sumado al padding del
// shell mobile (60-100px arriba), el centro del bloque caía a ~785px
// del top mientras el centro real del viewport estaba a ~1037px →
// el título aparecía MÁS ARRIBA del centro real. 90dvh garantiza que
// el bloque cubra prácticamente todo el viewport visible (dvh se
// ajusta dinámicamente con la url bar de Brave/Safari mobile, así no
// hay desfase cuando la barra colapsa).
// v1.7 — Tres correcciones del empty state ("Aún no tienes códices")
// tras el feedback de Zak:
//   1. Mobile: el h1 del empty state se mostraba con fontSize 56
//      (estilo desktop) y rebotaba al borde superior. Ahora aplica
//      una media query @media max-width:767px que lo baja a
//      fontSize 28 + letterSpacing 0.2em (mismo lenguaje que el
//      HeroTitleBlock estándar mobile de MiNucleo). El subtítulo
//      "Aún no tienes códices" + descripción siguen en el mismo
//      bloque, todo centrado vertical respecto al viewport.
//   2. Centrado vertical: minHeight pasa de 100% a 70vh. Garantiza
//      altura mínima absoluta independiente del padre — funciona
//      tanto en mobile (donde el padre puede no tener altura) como
//      en desktop. Combinado con flex-center, el contenido queda
//      a la altura del centro vertical del viewport.
//   3. Desktop: agregado `height: 100%` al motion.div root del
//      CodicesSection para que la cadena de heights llegue hasta
//      el empty state interno. Sin esto el bloque quedaba en su
//      minHeight natural y el título se veía más arriba que el
//      "MI NÚCLEO" del WelcomeViewerDesktop.
// v1.6.1 — Re-trigger del watcher.
// v1.6 — Dos correcciones del empty state ("Aún no tienes códices"):
//   1. Mobile: el h1 grande del empty state ahora SÍ se muestra (antes
//      estaba oculto por @media max-width:767px display:none). El
//      shell de MiNucleo ahora oculta su HeroTitleBlock cuando el
//      tab es Códices y books está vacío, así que el único título
//      visible queda el del empty state — que vive dentro del bloque
//      flex-center y baja al centro vertical de la pantalla.
//   2. Desktop: el contenedor del empty state usa `minHeight: 100%`
//      (antes 480) para expandirse al alto del padre. Combinado con
//      el `height: 100%` que MiNucleo ahora aplica al motion.div
//      key=codices, el título "Mis Códices" termina centrado a la
//      MISMA altura visual que "MI NÚCLEO" del WelcomeViewerDesktop.
// v1.5.2 — Re-trigger por waitForComponentLoader timeout del watcher.
// v1.5.1 — Re-trigger del watcher para asegurar el sync a Framer.
// v1.5 — Dos correcciones del empty state ("Aún no tienes códices"):
//   1. Mobile: el h1 grande del empty state se ocultaba antes via
//      className mn-codices-title-desktop pero seguía apareciendo
//      porque el bloque empty estaba SIN className → mobile veía el
//      título arriba (pintado por MiNucleo via sectionLabelMap) Y el
//      título grande del centro a la vez. Ahora el h1 del empty state
//      lleva className mn-codices-empty-h1 con CSS @media max-width:
//      767px display:none. Mobile queda con UN solo título (el de
//      arriba del shell, ya centrado por HeroTitleBlock).
//   2. Desktop: el empty state vivía con minHeight 380 sin
//      height:100% — el título "Mis Códices" caía a la mitad superior
//      del visor, más arriba que el "MI NÚCLEO" del WelcomeViewerDesktop
//      del dashboard (minHeight 480 + height 100%). Ahora el empty
//      state usa la misma estructura → el título Mis Códices queda
//      a la MISMA altura visual que MI NÚCLEO en /nucleo.
// v1.4 — Restaura el título "MIS CÓDICES" arriba de la lista de
// libros en desktop. Antes solo aparecía en el empty state; al
// adquirir su primer Códice el header desaparecía. Header con el
// mismo lenguaje visual (h1 200 weight, letterSpacing 0.24em,
// gradient cyan→white por palabra, animation nuc-breath 7s) pero
// fontSize 38 (vs 56 del empty) para no competir con la lista.
// Solo desktop (>=768px); mobile ya pinta su propio título arriba
// vía MiNucleo.
// v1.3 — Empty state ("aún no tienes códices") deja de ser un
// recuadro glass. Ahora se renderiza como hero idéntico al
// WelcomeViewerDesktop de Mi Núcleo: h1 "MIS CÓDICES" en fontSize
// 56 con gradient cyan→white + esc-nuc-breath, debajo el copy de
// invitación a explorar la biblioteca como subtítulo. Centrado
// vertical y horizontal sin caja contenedora.
// v1.2.2 — Re-trigger por waitForComponentLoader timeout del watcher.
// v1.2.1 — Re-trigger por sync skip del watcher.
// v1.2 — Botón "Resetear códices (admin)" al final de la lista, visible
// solo cuando isAdmin=true. Dispara `adminResetMyCodices` (RPC
// SECURITY DEFINER) que borra todas las purchases del propio admin y
// re-arma los cristales canjeados con origen='manual'. Diseñado para
// que Zak repita el flujo de Cristales en pruebas sin manipular
// Supabase a mano. Tras éxito, dispatcha `rsv-purchases-changed` para
// que el shell refresque.
// v1.1.1 — Re-trigger por waitForComponentLoader timeout de Framer.
// v1.1 — Removida la fila redundante "Códices de Luz" + subtítulo
// "X libros en tu biblioteca" + ícono de libro. La sección ya tiene
// el header "Mis Códices" arriba (lo pinta MiNucleo.tsx vía
// sectionLabelMap), así que ese segundo título dentro del scope era
// duplicado. Limpieza pedida por Zak.
// v1.0 — CodicesSection — la lista de Códices comprados del tripulante (vista
// "Mis Códices" del Mi Núcleo). Parte del split de MiNucleo.tsx.
//
// Cumple regla 🜂: default export es Object.assign sobre el componente
// principal con propiedad CodicesSection. Consumir vía:
//   import MNCodices from "./MN_Codices.tsx"
//   const { CodicesSection } = MNCodices
import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

import MNShared from "./MN_Shared.tsx"
import MNIcons from "./MN_Icons.tsx"
import Cristales from "./Cristales.tsx"
import LectorCodice from "./LectorCodice.tsx"

const { cV, fU, hexToRgba } = MNShared
const { IBook, IDL, IChev } = MNIcons
const { adminResetMyCodices } = Cristales

const GOLD_LECTOR = "#D4A843"

const isEpubFormat = (f: any) => {
    const t = String(f?.format_type || "").toLowerCase()
    if (t === "epub") return true
    const url = String(f?.file_url || "").toLowerCase()
    return url.endsWith(".epub")
}

function CodicesSection({
    books,
    accent,
    loading = false,
    isAdmin = false,
    clerkUserId,
    supabaseUrl,
    supabaseAnonKey,
}: {
    books: any[]
    accent: string
    loading?: boolean
    isAdmin?: boolean
    clerkUserId?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    const [exp, setExp] = useState<string | null>(null)
    const [resetting, setResetting] = useState(false)
    const [resetMsg, setResetMsg] = useState<string | null>(null)
    const [lector, setLector] = useState<{
        bookId: string
        bookTitle: string
        epubUrl: string
    } | null>(null)
    /* v1.10 — Map<book_id, percentage> hidratado por
       get_my_reading_progress al montar y al cerrar el visor.
       Cero si el Tripulante nunca lo abrió. */
    const [progressMap, setProgressMap] = useState<
        Map<string, number>
    >(new Map())

    const fetchProgress = useCallback(async () => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) return
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            const r = await fetch(
                `${supabaseUrl}/functions/v1/user-action`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        action: "get_my_reading_progress",
                        params: {},
                    }),
                }
            )
            if (!r.ok) return
            const rows = await r.json()
            if (!Array.isArray(rows)) return
            const m = new Map<string, number>()
            for (const row of rows) {
                if (row?.book_id != null)
                    m.set(
                        String(row.book_id),
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(row.percentage) || 0
                            )
                        )
                    )
            }
            setProgressMap(m)
        } catch {}
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        fetchProgress()
    }, [fetchProgress])

    const sym = ["◇", "✦", "⬡"]
    const openLector = (b: any, fmt: any) => {
        const bid = b.book_id || b.id
        if (!bid || !fmt?.file_url) return
        setLector({
            bookId: String(bid),
            bookTitle: b.title || "",
            epubUrl: fmt.file_url,
        })
    }
    const closeLector = () => {
        setLector(null)
        // Refrescar la barra de progreso al cerrar — el visor ya
        // grabó el último CFI/porcentaje; tomamos esa info para
        // que la barra refleje el avance al instante.
        setTimeout(fetchProgress, 600)
    }
    const onAdminReset = async () => {
        if (
            !clerkUserId ||
            !supabaseUrl ||
            !supabaseAnonKey ||
            resetting
        )
            return
        const ok = window.confirm(
            "Vas a borrar TODAS tus compras de Códices y devolver los cristales canjeados al pool. ¿Confirmar?"
        )
        if (!ok) return
        setResetting(true)
        setResetMsg(null)
        const r = await adminResetMyCodices(
            clerkUserId,
            supabaseUrl,
            supabaseAnonKey
        )
        setResetting(false)
        if (r.success) {
            setResetMsg(
                `Reset OK · ${r.deletedPurchases ?? 0} compras borradas · ${r.resetCristales ?? 0} cristales devueltos`
            )
            setTimeout(() => setResetMsg(null), 4500)
        } else {
            setResetMsg(`Error: ${r.error || "desconocido"}`)
        }
    }
    return (
        <motion.div
            variants={cV}
            initial="hidden"
            animate="visible"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                /* v1.7 — height:100% completa la cadena desde el grid
                   del split-view en desktop, así el empty state interno
                   con minHeight:70vh y flex-center expande al alto
                   completo del visor. En mobile no hay padre con
                   altura definida, así que el minHeight:70vh manda. */
                height: "100%",
            }}
        >
            {/* v1.2 — Título "MIS CÓDICES" arriba de la lista cuando
                el Tripulante tiene libros. Antes ese título solo vivía
                en el empty state, así que al adquirir su primer Códice
                la sección se quedaba sin header en desktop — Zak había
                logrado este header en una iteración anterior y se
                perdió en la refactor. Mismo lenguaje del empty (h1
                fontSize 56, gradient cyan→white por palabra, animation
                nuc-breath 7s) pero más compacto (fontSize 38) para no
                competir con la lista de libros. Solo en desktop:
                mobile ya tiene su propio título grande arriba pintado
                por MiNucleo. */}
            {!loading && books.length > 0 && (
                <motion.h1
                    variants={fU}
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 38,
                        fontWeight: 200,
                        letterSpacing: "0.24em",
                        marginRight: "-0.24em",
                        textTransform: "uppercase",
                        margin: "0 0 8px",
                        lineHeight: 1.05,
                        color: "transparent",
                        textAlign: "left",
                        filter: `drop-shadow(0 0 14px ${hexToRgba(accent, 0.28)})`,
                        animation:
                            "nuc-breath 7s ease-in-out infinite",
                        display: "none",
                    }}
                    className="mn-codices-title-desktop"
                >
                    {["Mis", "Códices"].map((word, i, arr) => (
                        <React.Fragment key={i}>
                            <span
                                style={{
                                    background: `linear-gradient(180deg, ${accent}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {word}
                            </span>
                            {i < arr.length - 1 && " "}
                        </React.Fragment>
                    ))}
                </motion.h1>
            )}
            {/* v1.2 — Solo se muestra el título desktop. CSS inyectado
                a nivel global activa display:block en desktop. Mobile
                lo deja oculto porque Mi Núcleo ya pinta su propio
                título arriba con el mismo lenguaje del Hero.
                v1.6 — Removida la regla que ocultaba el h1 del empty
                state en mobile. Ahora el shell de MiNucleo es quien
                oculta su HeroTitleBlock cuando empty, dejando que el
                h1 del empty state quede solo y centrado vertical.
                v1.7 — Agregada media query mobile para reducir el
                fontSize del h1 del empty state de 56 → 28 en
                viewports menores a 768px. Con 56 el título se veía
                gigante (mobile/desktop usaban el mismo tamaño y
                Zak pidió alinear con el lenguaje tipográfico mobile
                del HeroTitleBlock). */}
            <style>{`
                @media (min-width: 768px) {
                    .mn-codices-title-desktop { display: block !important; }
                }
                @media (max-width: 767px) {
                    .mn-codices-empty-h1 {
                        font-size: 28px !important;
                        letter-spacing: 0.2em !important;
                        margin-right: -0.2em !important;
                        font-weight: 100 !important;
                    }
                    .mn-codices-empty-sub {
                        font-size: 11px !important;
                        margin-top: 16px !important;
                    }
                    .mn-codices-empty-desc {
                        font-size: 14px !important;
                        margin-top: 18px !important;
                        max-width: 320px !important;
                    }
                }
            `}</style>
            {/* v1.1 — Eliminada la fila "Códices de Luz" + ícono de
                libro + contador "X libros en tu biblioteca". El header
                "Mis Códices" arriba ya cumple esa función — duplicarlo
                aquí abajo era ruido. */}
            {/* v2.0 — Empty state SOLO cuando ya cargó (loading=false) y
               no hay libros. Antes flasheaba "Aún no tienes códices"
               por unos ms mientras la query a Supabase resolvía. Ahora
               durante loading mostramos un placeholder neutral; cuando
               loading termina y hay libros, se renderiza la lista.
               Cero fricción visual. */}
            {loading && books.length === 0 && (
                <motion.div
                    variants={fU}
                    className="nuc-glass"
                    style={{
                        padding: "40px 24px",
                        textAlign: "center",
                        opacity: 0.5,
                    }}
                >
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Sintonizando biblioteca…
                    </p>
                </motion.div>
            )}
            {!loading && books.length === 0 && (
                <motion.div
                    variants={fU}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        /* v1.8 — minHeight: 90dvh para garantizar
                           centrado vertical real respecto al viewport
                           visible (dvh = dynamic viewport height,
                           se ajusta con la url bar de mobile). 70vh
                           dejaba el título a ~25-30% del top porque
                           el bloque solo ocupaba 70% del viewport y
                           con el padding del shell quedaba descentrado
                           hacia arriba. */
                        minHeight: "90dvh",
                        height: "100%",
                        flex: 1,
                        textAlign: "center",
                        padding: "40px 32px 60px",
                    }}
                >
                    <h1
                        className="mn-codices-empty-h1"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 56,
                            fontWeight: 200,
                            letterSpacing: "0.28em",
                            marginRight: "-0.28em",
                            textTransform: "uppercase",
                            margin: 0,
                            lineHeight: 1.05,
                            color: "transparent",
                            whiteSpace: "nowrap",
                            filter: `drop-shadow(0 0 18px ${hexToRgba(accent, 0.3)})`,
                            animation:
                                "nuc-breath 7s ease-in-out infinite",
                        }}
                    >
                        {["Mis", "Códices"].map((word, i, arr) => (
                            <React.Fragment key={i}>
                                <span
                                    style={{
                                        background: `linear-gradient(180deg, ${accent}, #fff)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    {word}
                                </span>
                                {i < arr.length - 1 && " "}
                            </React.Fragment>
                        ))}
                    </h1>
                    <p
                        className="mn-codices-empty-sub"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 14,
                            fontWeight: 300,
                            letterSpacing: "0.22em",
                            color: "rgba(255,255,255,0.45)",
                            marginTop: 22,
                            textTransform: "uppercase",
                        }}
                    >
                        Aún no tienes códices
                    </p>
                    <p
                        className="mn-codices-empty-desc"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 16,
                            fontWeight: 300,
                            letterSpacing: "0.04em",
                            color: "rgba(255,255,255,0.55)",
                            marginTop: 22,
                            maxWidth: 460,
                            lineHeight: 1.6,
                        }}
                    >
                        Explora la biblioteca para adquirir tu primero.
                    </p>
                </motion.div>
            )}
            {books.map((b: any, i: number) => {
                const bid = b.book_id || b.id
                const fmts = Array.isArray(b.formats) ? b.formats : []
                const epubFmt = fmts.find(isEpubFormat)
                const readPct = progressMap.get(String(bid)) ?? 0
                const isStarted = readPct > 0
                return (
                    <motion.div key={bid} variants={fU}>
                        <div
                            className="nuc-glass"
                            style={{
                                padding: "16px 18px 0",
                                userSelect: "none",
                                overflow: "hidden",
                                position: "relative",
                            }}
                        >
                            {/* v1.10 — Fila principal con dos zonas:
                                · Izquierda: ojo dorado (acción Leer
                                  directa) cuando hay EPUB. Si no hay
                                  EPUB, renderiza un spacer del mismo
                                  ancho para mantener alineación.
                                · Derecha: zona clickeable que expande
                                  la lista de formatos (cover + texto +
                                  chevron). */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    paddingBottom: 14,
                                }}
                            >
                                {epubFmt ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openLector(b, epubFmt)
                                        }}
                                        title="Leer códice"
                                        aria-label={`Leer ${b.title}`}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            flexShrink: 0,
                                            borderRadius: "50%",
                                            border: `1px solid ${hexToRgba(GOLD_LECTOR, 0.55)}`,
                                            background: `linear-gradient(135deg, ${hexToRgba(GOLD_LECTOR, 0.22)}, ${hexToRgba(GOLD_LECTOR, 0.06)})`,
                                            color: GOLD_LECTOR,
                                            cursor: "pointer",
                                            display: "grid",
                                            placeItems: "center",
                                            outline: "none",
                                            boxShadow: `0 0 14px ${hexToRgba(GOLD_LECTOR, 0.22)}, inset 0 0 8px ${hexToRgba(GOLD_LECTOR, 0.18)}`,
                                            transition: "transform .18s ease",
                                        }}
                                    >
                                        <svg
                                            width={22}
                                            height={22}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.6}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                ) : (
                                    <div
                                        style={{
                                            width: 48,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <div
                                    onClick={() =>
                                        setExp(exp === bid ? null : bid)
                                    }
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        cursor: "pointer",
                                        minWidth: 0,
                                    }}
                                >
                                    {b.cover_url ? (
                                        <img
                                            src={b.cover_url}
                                            alt=""
                                            style={{
                                                width: 40,
                                                height: 54,
                                                borderRadius: 6,
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 40,
                                                height: 54,
                                                borderRadius: 6,
                                                flexShrink: 0,
                                                background:
                                                    "linear-gradient(135deg, rgba(0,194,255,0.12), rgba(0,100,180,0.08))",
                                                border: "1px solid rgba(0,194,255,0.18)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 16,
                                                color: accent,
                                            }}
                                        >
                                            {sym[i % 3]}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 15,
                                                fontWeight: 500,
                                                color: "#fff",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {b.title}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                marginTop: 3,
                                                fontSize: 12,
                                                color: "rgba(255,255,255,0.35)",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {b.author} · {fmts.length} formato
                                            {fmts.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <div
                                        style={{ flexShrink: 0 }}
                                    >
                                        <IChev open={exp === bid} />
                                    </div>
                                </div>
                            </div>
                            {/* v1.10 — Barra de progreso de lectura.
                                Pegada al pie del card. Cyan tenue al
                                0%, dorado lleno al 100%. Si nunca lo
                                abrió, queda como un trazo cyan apenas
                                visible. */}
                            <div
                                style={{
                                    height: 5,
                                    width: "100%",
                                    background: "rgba(0,194,255,0.07)",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    marginBottom: 0,
                                }}
                                aria-label={`Avance de lectura ${readPct}%`}
                            >
                                <div
                                    style={{
                                        width: `${Math.max(2, readPct)}%`,
                                        height: "100%",
                                        background: isStarted
                                            ? `linear-gradient(90deg, ${hexToRgba(GOLD_LECTOR, 0.7)}, ${GOLD_LECTOR})`
                                            : "rgba(0,194,255,0.25)",
                                        borderRadius: 3,
                                        boxShadow: isStarted
                                            ? `0 0 8px ${hexToRgba(GOLD_LECTOR, 0.4)}`
                                            : "none",
                                        transition: "width .35s ease",
                                    }}
                                />
                            </div>
                            <AnimatePresence>
                                {exp === bid && fmts.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 10,
                                                padding: "14px 0 18px",
                                                borderTop:
                                                    "1px solid rgba(255,255,255,0.06)",
                                                marginTop: 4,
                                            }}
                                        >
                                            {/* v1.10 — Removido el pill
                                                "Leer" (ahora vive como ojo
                                                dorado en la fila principal).
                                                Solo quedan los pills de
                                                descarga de cada formato. */}
                                            {fmts.map((f: any) => (
                                                <a
                                                    key={f.format_type}
                                                    href={f.file_url || "#"}
                                                    className="nuc-pill"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <IDL /> {f.format_label}
                                                    {f.file_size_mb && (
                                                        <span
                                                            style={{
                                                                fontSize: 10,
                                                                color: "rgba(0,194,255,0.5)",
                                                                marginLeft: 2,
                                                            }}
                                                        >
                                                            ({f.file_size_mb}{" "}
                                                            MB)
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )
            })}
            {/* v1.2 — Botón admin-only para resetear todas las
                purchases del propio caller. Visible solo si la sesión
                es admin (chequeado server-side por la RPC también). */}
            {isAdmin && (
                <motion.div
                    variants={fU}
                    style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop:
                            "1px dashed rgba(212,168,67,0.25)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <span
                        style={{
                            fontSize: 9,
                            letterSpacing: "0.32em",
                            textTransform: "uppercase",
                            color: "rgba(212,168,67,0.55)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        ✦ Modo Arquitecto · Pruebas
                    </span>
                    <button
                        type="button"
                        onClick={onAdminReset}
                        disabled={resetting}
                        style={{
                            padding: "10px 22px",
                            borderRadius: 999,
                            border: "1px solid rgba(212,168,67,0.4)",
                            background:
                                "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(120,80,20,0.08))",
                            color: "#D4A843",
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            cursor: resetting ? "wait" : "pointer",
                            outline: "none",
                            transition: "all 0.2s ease",
                            opacity: resetting ? 0.6 : 1,
                        }}
                    >
                        {resetting
                            ? "Reseteando…"
                            : "Resetear mis códices"}
                    </button>
                    {resetMsg && (
                        <span
                            style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.55)",
                                fontFamily: "'Inter',sans-serif",
                                letterSpacing: "0.04em",
                                textAlign: "center",
                            }}
                        >
                            {resetMsg}
                        </span>
                    )}
                </motion.div>
            )}
            {/* v1.9 — Visor EPUB integrado. Portaled a document.body con
                AnimatePresence para fade in/out limpio. Cierra al picar
                la X, ESC, o llamando setLector(null). */}
            <AnimatePresence>
                {lector && (
                    <LectorCodice
                        key={lector.bookId}
                        bookId={lector.bookId}
                        bookTitle={lector.bookTitle}
                        epubUrl={lector.epubUrl}
                        clerkUserId={clerkUserId || ""}
                        supabaseUrl={supabaseUrl || ""}
                        supabaseAnonKey={supabaseAnonKey || ""}
                        onClose={closeLector}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* Default export: componente principal + propiedad nominal. CodicesSection
   default-exporta su propio componente con body JSX (cumple regla 🜂). */
const MNCodices = Object.assign(CodicesSection, {
    CodicesSection,
})

export default MNCodices
