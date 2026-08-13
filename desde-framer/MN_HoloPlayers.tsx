// Red Solar Viva — MN_HoloPlayers.tsx v1.0
// Modales holográficos del Mi Núcleo: HoloCinePlayer (videos Wistia
// de Cámara Solar) + HoloPDFViewer (Sellos de Integración R2 vía
// Google Docs viewer). Parte del split de MiNucleo.tsx.
//
// Cumple regla 🜂: default export es Object.assign sobre componente
// fantasma + { HoloCinePlayer, HoloPDFViewer } como propiedades.
//   import MNHoloPlayers from "./MN_HoloPlayers.tsx"
//   const { HoloCinePlayer, HoloPDFViewer } = MNHoloPlayers
import * as React from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

import MNShared from "./MN_Shared.tsx"
import MNIcons from "./MN_Icons.tsx"

const { hexToRgba } = MNShared
const { ISello, IDL, CornerSVG } = MNIcons

function HoloCinePlayer({
    isOpen,
    onClose,
    wistiaVideoId,
    accentColor = "#00C2FF",
}: {
    isOpen: boolean
    onClose: () => void
    wistiaVideoId: string
    accentColor?: string
}) {
    useEffect(() => {
        if (!isOpen) return
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [isOpen, onClose])
    useEffect(() => {
        if (!isOpen) return
        /* v1.8 — Scroll lock robusto. Antes guardábamos `prev` y lo
           restaurábamos, pero si otro componente había puesto
           overflow:hidden antes (race condition con AnimatePresence
           re-mounts), el cleanup podía dejar overflow:hidden residual
           → el body quedaba sin scroll después de cerrar el modal. Ahora
           bloqueamos en BODY + HTML y forzamos cadena vacía en el
           cleanup. La cadena vacía deja al browser usar el default,
           que es lo que queremos siempre que no haya un modal abierto. */
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
            document.documentElement.style.overflow = ""
        }
    }, [isOpen])
    if (typeof document === "undefined") return null
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483647,
                        background: "rgba(2,4,8,0.98)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.div
                        className="holo-modal-cine"
                        initial={{ scale: 0.92, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 30 }}
                        transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                        }}
                        /* v1.9 — Antes este motion.div tenía
                           stopPropagation que bloqueaba el cierre al
                           picar fuera del video. Ahora dejamos que el
                           click propague al overlay padre (que llama
                           onClose); SOLO el div del video stopea
                           propagación, así tap en el espacio negro
                           arriba/abajo del video cierra el modal. */
                        style={{
                            position: "relative",
                            width: "calc(100vw - 60px)",
                            maxWidth: 1400,
                            height: "calc(100vh - 60px)",
                            background:
                                "linear-gradient(180deg, rgba(0,194,255,0.04) 0%, rgba(0,12,28,0.96) 40%, rgba(0,4,10,0.99) 100%)",
                            border: "1px solid rgba(0,194,255,0.3)",
                            borderRadius: 20,
                            boxShadow:
                                "0 0 80px rgba(0,194,255,0.1), inset 0 0 40px rgba(0,194,255,0.03), 0 20px 60px rgba(0,0,0,0.5)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column" as const,
                            padding: 24,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        <div className="holo-corner holo-corner-tl">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-tr">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-bl">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-br">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-scanline" />
                        <button
                            className="nuc-modal-close"
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                zIndex: 10,
                            }}
                        >
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="1" y1="1" x2="13" y2="13" />
                                <line x1="13" y1="1" x2="1" y2="13" />
                            </svg>
                        </button>
                        <div
                            className="holo-modal-cine-video"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                flex: 1,
                                width: "100%",
                                borderRadius: 14,
                                overflow: "hidden",
                                background: "#000",
                                border: "1px solid rgba(0,194,255,0.1)",
                                marginTop: 8,
                                position: "relative",
                            }}
                        >
                            {wistiaVideoId ? (
                                <iframe
                                    src={`https://fast.wistia.net/embed/iframe/${wistiaVideoId}?autoPlay=true&controlsVisibleOnLoad=true&playButton=false&playerColor=00C2FF&videoFoam=true`}
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
                                    title="Video"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "rgba(255,255,255,0.3)",
                                        fontSize: 14,
                                    }}
                                >
                                    Video no disponible
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/*
   ══════════════════════════════════════════════════
   HoloPDFViewer — Visor holográfico de PDFs (Sellos de Sesión)
   Estilo idéntico al HoloCinePlayer pero con iframe PDF + toolbar de descarga.
   ══════════════════════════════════════════════════
*/
function HoloPDFViewer({
    isOpen,
    onClose,
    pdfUrl,
    sessionTitle,
    accentColor = "#00C2FF",
}: {
    isOpen: boolean
    onClose: () => void
    pdfUrl: string
    sessionTitle?: string
    accentColor?: string
}) {
    useEffect(() => {
        if (!isOpen) return
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [isOpen, onClose])
    useEffect(() => {
        if (!isOpen) return
        /* v1.8 — Scroll lock robusto. Antes guardábamos `prev` y lo
           restaurábamos, pero si otro componente había puesto
           overflow:hidden antes (race condition con AnimatePresence
           re-mounts), el cleanup podía dejar overflow:hidden residual
           → el body quedaba sin scroll después de cerrar el modal. Ahora
           bloqueamos en BODY + HTML y forzamos cadena vacía en el
           cleanup. La cadena vacía deja al browser usar el default,
           que es lo que queremos siempre que no haya un modal abierto. */
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
            document.documentElement.style.overflow = ""
        }
    }, [isOpen])
    if (typeof document === "undefined") return null
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483647,
                        background: "rgba(2,4,8,0.98)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.div
                        className="holo-modal-pdf"
                        initial={{ scale: 0.92, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 30 }}
                        transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            width: "calc(100vw - 80px)",
                            maxWidth: 900,
                            height: "calc(100vh - 80px)",
                            background:
                                "linear-gradient(180deg, rgba(0,194,255,0.04) 0%, rgba(0,12,28,0.96) 40%, rgba(0,4,10,0.99) 100%)",
                            border: "1px solid rgba(0,194,255,0.3)",
                            borderRadius: 20,
                            boxShadow:
                                "0 0 80px rgba(0,194,255,0.1), inset 0 0 40px rgba(0,194,255,0.03), 0 20px 60px rgba(0,0,0,0.5)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column" as const,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {/* Esquinas holográficas */}
                        <div className="holo-corner holo-corner-tl">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-tr">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-bl">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-corner holo-corner-br">
                            <CornerSVG color={accentColor} />
                        </div>
                        <div className="holo-scanline" />

                        {/* Toolbar superior */}
                        {/* v1.8 — Estructura: [icono left] [h3 centrado] [descargar right].
                           El h3 toma flex:1 y text-align:center via .nuc-pdf-toolbar-title.
                           El padding-right del descargar deja espacio para el botón X
                           absoluto en la esquina superior derecha. */}
                        <div className="nuc-pdf-toolbar">
                            <div
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    background: "rgba(0,194,255,0.08)",
                                    border: "1px solid rgba(0,194,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: accentColor,
                                    flexShrink: 0,
                                }}
                            >
                                <ISello />
                            </div>
                            <h3
                                className="nuc-pdf-toolbar-title"
                                style={{
                                    margin: 0,
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 15,
                                    fontWeight: 200,
                                    letterSpacing: "0.25em",
                                    textTransform: "uppercase",
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: `drop-shadow(0 0 8px ${hexToRgba(accentColor || "#00C2FF", 0.3)})`,
                                    animation:
                                        "nuc-breath 7s ease-in-out infinite",
                                }}
                            >
                                Sello de Integración
                            </h3>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexShrink: 0,
                                    paddingRight: 44,
                                }}
                            >
                                <a
                                    href={pdfUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="nuc-pdf-dl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IDL /> Descargar
                                </a>
                            </div>
                        </div>

                        {/* v1.6 — Botón X separado de la toolbar, anclado a la
                           esquina superior derecha del modal (no junto al
                           botón Descargar). Misma estética del nuc-modal-close
                           con fondo oscuro semitransparente para que sea
                           visible siempre. */}
                        <button
                            className="nuc-modal-close"
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                zIndex: 11,
                                background: "rgba(0,0,0,0.55)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                            }}
                        >
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="1" y1="1" x2="13" y2="13" />
                                <line x1="13" y1="1" x2="1" y2="13" />
                            </svg>
                        </button>

                        {/* Contenido PDF */}
                        <div
                            className="holo-modal-pdf-content"
                            style={{
                                flex: 1,
                                width: "100%",
                                overflow: "hidden",
                                background: "#0A0E18",
                                border: "1px solid rgba(0,194,255,0.08)",
                                borderTop: "none",
                                borderRadius: "0 0 14px 14px",
                                position: "relative",
                                margin: "0 0 24px 0",
                            }}
                        >
                            {pdfUrl ? (
                                <iframe
                                    className="holo-modal-pdf-iframe"
                                    /* v1.7 — Google Docs Viewer: iOS Safari
                                       ignora los hash params (#view=FitH,
                                       #toolbar=0…) que ajustan el ancho del PDF
                                       nativo, por eso se veía con zoom y
                                       cortado. Google gView respeta el ancho
                                       del iframe en TODOS los browsers
                                       (incluido iOS) y entrega scroll vertical
                                       limpio. Requiere que el PDF esté en una
                                       URL pública — los Sellos viven en R2 que
                                       sí lo es. */
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                                    title="Sello PDF"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                        display: "block",
                                        background: "#0A0E18",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "rgba(255,255,255,0.3)",
                                        fontSize: 14,
                                    }}
                                >
                                    Sello no disponible
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* Default export: componente fantasma + players como propiedades. */
function MNHoloPlayersRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MNHoloPlayersRoot.displayName = "MN_HoloPlayers"

const HoloPlayers = Object.assign(MNHoloPlayersRoot, {
    HoloCinePlayer,
    HoloPDFViewer,
})

export default HoloPlayers
