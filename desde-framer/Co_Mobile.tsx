// Red Solar Viva — Co_Mobile.tsx v1.14 — UN PAGO = EL CÓDICE COMPLETO (decisión de Zak 2026-08-01): la pastilla de compra deja de prometer un formato ("PDF + Ebook") y dice "El Códice completo" — un pago (o un Cristal) entrega todos sus formatos, incluido el audiolibro cuando exista, y los que se sumen después llegan sin costo (trigger trg_reparte_formato_nuevo, migración 20260801b_codice_completo + stripe-webhook v2.5). El tile de venta suelta del audiolibro queda marcado como código muerto (link_audio vacío en los 11 Códices). | Red Solar Viva — Co_Mobile.tsx v1.13 — anti-flash del pill digital: un dueño ya no parpadea "DESBLOQUEAR" antes de "ADQUIRIDO" (gate digitalPending vía purchasesResolved/hasOwnedSeed de useNodeStatus; placeholder neutro "·  ·  ·" mientras resuelve sin cache). MPurchasePill soporta prop `disabled`
// v1.12 — muro de pago de Cristales en Códices: tocar "DESBLOQUEAR / PDF + Ebook" sin Cristal de Códice ya NO navega a Stripe — abre CodiceCristalGate (tryRedeemCodiceMobile retorna true SIEMPRE → la pastilla cancela su navegación). Web siempre web (isNative=false) → no-miembros ven "Activar Sintonía Solar" (→ PlanSelector) + compra suelta 333 MXN; miembros sin cristales ven copy "próxima luna" + 333 MXN
// v1.10 — Indicador de Cristales con prop `hideCristalChip` (paridad app: un shell con contador doble propio lo oculta; standalone web lo deja visible) — inline, sin portal. Bloque de autores baja (top 60→132, "más centrado") y "Códices de Zak'Haar" asoma justo por encima de la nav (bottom 100→120)
// v1.8 — #2 Materialización: la portada del Códice cristaliza al abrirla (fireMaterialize; guard de rect sin-carga con ||)
// v1.7 — #2 Materialización: la portada del Códice cristaliza desde
// esquirlas de luz al abrir su Consola de Acceso (fireMaterialize, burst
// aditivo de compositor; no toca el slide-up del sheet).
// v1.6 (2026-05-20) — `goNucleoCodices` ahora rutea según contexto:
// desde `/codices` (modo Madre) navega a `/nucleo#codices`; desde
// `/escaner/*` preserva el modo Escáner. Antes siempre apuntaba a
// `/escaner/nucleo#codices`, sacando al Tripulante de su contexto
// si estaba en la ruta Madre.
// v1.5.2 — Indicador de Cristales se mueve a top-LEFT cuando el
// componente está en modo "centered" (raíz /codices). En esa ruta el
// SolarNav vive en la esquina superior derecha y antes tapaba el chip.
// Dentro del shell de Holoteca (modo "compact") el indicador sigue
// top-right como siempre.
// v1.5.1 — Re-trigger del watcher tras pérdida de fs.watch event en macOS.
// v1.5 — Coreografía afinada del canje:
//   1. Picar Extraer → modal de confirmación se cierra inmediato
//      (antes la animación corría con el modal todavía visible
//      detrás → choque visual).
//   2. Aparece la animación CristalRitualOverlay (1.6s).
//   3. Al terminar, aparece un modal pequeño de éxito ("Códice
//      Anclado · Disponible en Mi Núcleo") con CTA al Núcleo.
//      Auto-cierra en 4.5s o con tap.
// v1.4 — Estado real-time del botón post-canje + animación gamer al
// extraer. Tres cambios:
//   1. MConsolaDeAcceso y MBookThumb consumen useNodeStatus →
//      ownedFormats. Si el Tripulante ya posee el digital del libro,
//      el pill DESBLOQUEAR cambia a ADQUIRIDO con paleta dorada y
//      onClick que lleva a /escaner/nucleo#codices. La actualización
//      es automática (rsv-purchases-changed event listener interno).
//   2. CristalRitualOverlayMobile (overlay tipo videojuego) inline:
//      anillos concéntricos + 12 partículas radiales + orb central +
//      glyph cristal flotante + texto sellado. Mismo lenguaje del
//      overlay del Motor admin para sumar cristal. Se dispara
//      automático tras un canje exitoso, dura 1.6s.
//   3. Padre dispatcha rsv-purchases-changed después del redeem para
//      que el listener de useNodeStatus refresque sin necesidad de
//      recargar la página.
// v1.3 — Indicador de Cristales visible TAMBIÉN para Tripulantes
// Explorer (sin Sintonía / sin Inmersión). Antes el indicador se
// ocultaba cuando `cristalTierM.tier === "explorer"`; ahora se monta
// siempre con count 0. Picarlo abre `CristalesInfoModal` que
// explica qué son los Cristales y cómo se obtienen — gancho de
// conversión para Tripulantes invitados.
// v1.2 — Afinaciones del Portal de Inducción mobile en iPhone 13
// (Zak): bloque de autores subió ~50px (padding-top 110 → 60), las
// cards quedan centradas verticalmente en lugar de descolgadas hacia
// abajo. "Explorar autores" se acerca al card de Zak'Haar (marginBottom
// negativo que reduce el gap implícito 32 → 16). Y el padding-bottom
// del bloque sube 60 → 100 para que la sección "Códices de Zak'Haar"
// (donde empieza el primer libro) no asome arriba del fold antes de
// hacer scroll.
// v1.1 — Indicador del Cristal de Códices movido del top-left al
// top-right para liberar el costado izquierdo donde vive el título
// "HOLOTECA · CÓDICES DE LUZ" (ahí chocaba con el gradient cyan→white).
// La pill de avatar/auth y el botón ⬡ Escáner se ocultan dentro de
// las rutas /escaner/* (Domo v4.69 / Auth2Header v18.18), así que la
// esquina superior derecha queda libre.
// v1.0 — Ecosistema móvil completo del catálogo de Códices migrado
// desde Codices.tsx. Componente principal CodicesMobile + sub-
// components (MAuthorCard, MFichaTecnica, MPurchasePill, MBookThumb)
// + modales (MAmazonSheet, MFaqModal, MVideoModal, MPdfViewer,
// MConsolaDeAcceso). Parte del split de Codices.tsx (sello Co_).
//
// Default export: CodicesMobile (componente real, no ghost). Cumple
// el contrato del componentLoader de Framer porque CodicesMobile YA
// es un React component renderable con body JSX.
//
// Consumidores: Codices.tsx (shell, decide mobile vs desktop según
// useViewportLocal + forceIsMobile prop).

import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

import CoShared from "./Co_Shared.tsx"
import CoIcons from "./Co_Icons.tsx"
import Cristales from "./Cristales.tsx"
import Shared from "./EV_Shared.tsx"
import PlanSelectorModal from "./PlanSelector.tsx"

// #2 Materialización: la portada del Códice cristaliza desde esquirlas de
// luz al abrir su Consola de Acceso (burst aditivo, perf-compositor).
const { fireMaterialize } = Shared

const {
    hexToRgba,
    makeFallbackDataUrl,
    normalizeMultiline,
    useClerkIdentity,
    checkoutHref,
    CristalInterceptContext,
    useNodeStatus,
} = CoShared

const GOLD_OWNED = "#FFB800"

/* v1.4 — Helper: ¿el Tripulante posee el digital de este libro?
   ownedFormats es Map<title, string[]> con los formatos comprados.
   "Posee digital" = al menos pdf o epub. Idéntica heurística que el
   desktop. */
const ownsDigitalOf = (
    book: any,
    ownedFormats: Map<string, string[]> | undefined
) => {
    if (!ownedFormats || !book?.title) return false
    const fmts = ownedFormats.get(book.title)
    if (!Array.isArray(fmts)) return false
    return fmts.includes("pdf") || fmts.includes("epub")
}

/* v1.5 (2026-05-20) — Rutea según contexto: si el Tripulante está
   bajo `/escaner/*` mantiene modo Escáner; si está en `/codices`
   (modo Madre) lo lleva al Núcleo Madre. La regla "no enlaces a
   /escaner/* desde fuera de /escaner/*" se cumple sin importar
   qué shell esté envolviendo a Códices. */
const goNucleoCodices = () => {
    try {
        const inEscaner =
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/escaner")
        const target = inEscaner
            ? "/escaner/nucleo#codices"
            : "/nucleo#codices"
        window.location.assign(target)
    } catch {}
}

const {
    MIconTablet,
    MIconHeadphones,
    MIconBox,
    MIconEye,
    MIconChevronDown,
    MSunIcon,
    MDropIcon,
} = CoIcons

const {
    useCristales,
    useMembershipTier,
    CristalesIndicator,
    ConfirmarCristalModal,
    CodiceCristalGate,
    redeemCodiceWithCristal,
} = Cristales

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MAuthorCard                                                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MAuthorCard = ({
    name,
    icon,
    accentColor,
    onSelect,
    delay = 0,
}: {
    name: string
    icon: "sun" | "drop"
    accentColor: string
    onSelect: () => void
    delay?: number
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    return (
        <motion.div
            className="m-author-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            onClick={onSelect}
            style={{
                width: "90%",
                maxWidth: "400px",
                height: "140px",
                borderRadius: "18px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${A(0.4)}`,
                background: `linear-gradient(135deg, ${A(0.1)}, ${A(0.04)}, ${A(0.08)})`,
                boxShadow: `0 12px 30px ${A(0.15)}, inset 0 0 30px ${A(0.08)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                transform: "scale(1)",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: "-20%",
                    height: "40%",
                    left: "-50%",
                    width: "60%",
                    background: `linear-gradient(115deg, transparent, ${A(0.4)}, transparent)`,
                    filter: "blur(6px)",
                    transform: "rotate(8deg)",
                }}
                animate={{ left: ["-50%", "130%"] }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: 14,
                    border: `1px solid ${A(0.3)}`,
                    pointerEvents: "none",
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                }}
            >
                {icon === "sun" ? (
                    <MSunIcon color={accentColor} />
                ) : (
                    <MDropIcon color={accentColor} />
                )}
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "1.3rem",
                        fontWeight: 600,
                        color: accentColor,
                        textShadow: `0 0 10px ${A(0.6)}, 0 0 20px ${A(0.3)}`,
                        letterSpacing: ".02em",
                    }}
                >
                    {name}
                </span>
            </div>
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MFichaTecnica                                                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MFichaTecnica = ({
    pageCount,
    year,
    accentColor,
}: {
    pageCount?: string | number
    year?: string | number
    accentColor: string
}) => {
    const hp = pageCount && String(pageCount).trim() !== ""
    const hy = year && String(year).trim() !== ""
    if (!hp && !hy) return null
    return (
        <div
            style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                padding: "6px 0",
                fontSize: ".75rem",
                color: "rgba(255,255,255,.4)",
                fontFamily: "'Inter',sans-serif",
                letterSpacing: ".03em",
            }}
        >
            {hy && (
                <span>
                    Año:{" "}
                    <span style={{ color: accentColor, fontWeight: 500 }}>
                        {year}
                    </span>
                </span>
            )}
            {hp && (
                <span>
                    {pageCount}{" "}
                    <span style={{ color: accentColor, fontWeight: 500 }}>
                        Páginas
                    </span>
                </span>
            )}
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MPurchasePill — soporta onIntercept (cristal flow)             ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MPurchasePill = ({
    icon: Icon,
    label,
    subLabel,
    href,
    onClick,
    onIntercept,
    accentColor,
    textColor,
    disabled,
}: any) => {
    const Tag: any = disabled ? "div" : href ? "a" : "button"
    const handleClick = (e: any) => {
        if (disabled) {
            e.preventDefault()
            return
        }
        if (onIntercept) {
            const cancel = onIntercept()
            if (cancel) {
                e.preventDefault()
                return
            }
        }
        if (onClick) onClick(e)
    }
    const lp: any = disabled
        ? {}
        : href
          ? { href, target: "_self", onClick: handleClick }
          : { onClick: handleClick }
    return (
        <Tag
            {...lp}
            className={disabled ? undefined : "m-pill"}
            style={
                {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    padding: "16px 20px",
                    background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.25)})`,
                    border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                    borderRadius: "16px",
                    color: textColor,
                    textDecoration: "none",
                    outline: "none",
                    cursor: disabled ? "default" : "pointer",
                    minHeight: "60px",
                    width: "100%",
                    opacity: disabled ? 0.45 : 1,
                    pointerEvents: disabled ? "none" : "auto",
                    boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}, inset 0 0 6px ${hexToRgba(accentColor, 0.05)}`,
                    ["--pill-glow" as any]: `0 0 24px ${hexToRgba(accentColor, 0.4)}`,
                    transform: "scale(1)",
                    fontSize: "1rem",
                    backdropFilter: "blur(6px)",
                } as React.CSSProperties
            }
        >
            <div
                style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%) scale(1.1)",
                    color: accentColor,
                    filter: `drop-shadow(0 0 8px ${accentColor})`,
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <Icon />
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    textAlign: "center",
                    width: "100%",
                }}
            >
                <span
                    style={{
                        fontSize: ".7rem",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        opacity: 0.8,
                        color: "#fff",
                    }}
                >
                    {label}
                </span>
                {subLabel && (
                    <span
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: textColor,
                            lineHeight: 1.1,
                            letterSpacing: ".02em",
                        }}
                    >
                        {subLabel}
                    </span>
                )}
            </div>
        </Tag>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MAmazonSheet — pull-to-close                                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MAmazonSheet = ({
    links,
    accentColor,
    textColor,
    onClose,
}: {
    links: any[]
    accentColor: string
    textColor: string
    onClose: () => void
}) => {
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                background: "rgba(0,0,0,.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "500px",
                    background:
                        "linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,10,20,.99))",
                    borderRadius: "20px 20px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                    borderBottom: "none",
                    padding: "20px 20px 32px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <div
                    style={{
                        width: "40px",
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.5)",
                        alignSelf: "center",
                        marginBottom: "8px",
                    }}
                />
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: ".85rem",
                        fontWeight: 600,
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        textAlign: "center",
                        marginBottom: "4px",
                        textShadow: "0 0 10px rgba(0,0,0,0.5)",
                    }}
                >
                    COMPRAR LIBRO IMPRESO
                </span>
                {links.map((l: any, i: number) => (
                    <a
                        key={i}
                        href={l.href}
                        target="_self"
                        className="m-amazon-pill"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "14px 18px",
                            borderRadius: "16px",
                            border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                            background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                            textDecoration: "none",
                            color: textColor,
                            transform: "scale(1)",
                            boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                        }}
                    >
                        <div style={{ color: accentColor, display: "flex" }}>
                            <MIconBox />
                        </div>
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: ".95rem",
                                fontWeight: 500,
                            }}
                        >
                            {l.label}
                        </span>
                    </a>
                ))}
                <button
                    onClick={onClose}
                    style={{
                        marginTop: "4px",
                        padding: "12px",
                        borderRadius: "12px",
                        border: `1px solid ${hexToRgba(accentColor, 0.15)}`,
                        background: "transparent",
                        color: hexToRgba(accentColor, 0.6),
                        fontFamily: "'Inter',sans-serif",
                        fontSize: ".85rem",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    Cerrar
                </button>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MFaqModal — pull-to-close + accordion                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MFaqModal = ({
    faqs,
    accentColor,
    textColor,
    onClose,
}: {
    faqs: any[]
    accentColor: string
    textColor: string
    onClose: () => void
}) => {
    const [exp, setExp] = useState<number | null>(null)
    if (!faqs || faqs.length === 0) return null
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxHeight: "92vh",
                    background:
                        "linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,10,20,.99))",
                    borderRadius: "20px 20px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.25)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "18px 20px 14px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexShrink: 0,
                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.12)}`,
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "3px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.5)",
                            position: "absolute",
                            top: "8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "1.05rem",
                            fontWeight: 200,
                            margin: 0,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".1em",
                        }}
                    >
                        Preguntas Frecuentes
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                            background: "rgba(255,255,255,.05)",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
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
                </div>
                <div
                    className="m-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px 16px 60px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    {faqs.map((faq, i) => {
                        const isOpen = exp === i
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isOpen
                                        ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.06)}, transparent)`
                                        : "linear-gradient(135deg, rgba(255,255,255,.02), transparent)",
                                    border: `1px solid ${isOpen ? hexToRgba(accentColor, 0.4) : hexToRgba(accentColor, 0.08)}`,
                                    borderRadius: "12px",
                                    overflow: "visible",
                                    cursor: "pointer",
                                    transition: "border-color .15s ease-out",
                                }}
                                onClick={() => setExp(isOpen ? null : i)}
                            >
                                <div
                                    style={{
                                        padding: "14px 16px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: ".9rem",
                                            fontWeight: 400,
                                            color: isOpen ? "#FFF" : textColor,
                                            opacity: isOpen ? 1 : 0.8,
                                            flex: 1,
                                            paddingRight: "8px",
                                        }}
                                    >
                                        {faq.q}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "1.1rem",
                                            color: accentColor,
                                            opacity: 0.8,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition:
                                                "transform .2s ease-out",
                                            flexShrink: 0,
                                        }}
                                    >
                                        +
                                    </span>
                                </div>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                duration: 0.25,
                                                ease: "easeInOut",
                                            }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div
                                                style={{
                                                    padding: "0 16px 16px 16px",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                    fontSize: ".85rem",
                                                    lineHeight: 1.7,
                                                    color: textColor,
                                                    opacity: 0.65,
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MVideoModal — fullscreen video con auto-close al ended         ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MVideoModal = ({
    videoUrl,
    accentColor,
    onClose,
}: {
    videoUrl: string
    accentColor: string
    onClose: () => void
}) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        v.play().catch(() => {})
        const handleEnded = () => onClose()
        v.addEventListener("ended", handleEnded)
        return () => v.removeEventListener("ended", handleEnded)
    }, [onClose])
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100002,
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    playsInline
                    controls
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#000",
                    }}
                />
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
                        right: "calc(env(safe-area-inset-right, 0px) + 12px)",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        border: `1.5px solid ${hexToRgba(accentColor, 0.5)}`,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: "none",
                        zIndex: 5,
                        fontSize: "1.4rem",
                    }}
                >
                    ×
                </button>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MPdfViewer — Google Docs viewer wrapper (CORS-safe + iOS)      ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MPdfViewer = ({
    pdfUrl,
    title,
    accentColor,
    onClose,
}: {
    pdfUrl: string
    title: string
    accentColor: string
    onClose: () => void
}) => {
    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.7)",
                backdropFilter: "blur(10px)",
                zIndex: 100001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "calc(env(safe-area-inset-top, 0px) + 6vh) calc(env(safe-area-inset-right, 0px) + 4vw) calc(env(safe-area-inset-bottom, 0px) + 6vh) calc(env(safe-area-inset-left, 0px) + 4vw)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                style={{
                    width: "96vw",
                    height: "88vh",
                    borderRadius: 18,
                    border: `2px solid ${accentColor}`,
                    boxShadow: `0 0 18px ${hexToRgba(accentColor, 0.6)}, 0 0 36px ${hexToRgba(accentColor, 0.33)}`,
                    overflow: "hidden",
                    background: "rgba(5,10,20,.95)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.98, opacity: 0.95 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0.9 }}
            >
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.35)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#fff",
                        fontSize: 14,
                    }}
                >
                    <div style={{ maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                height: 36,
                                padding: "0 16px",
                                borderRadius: 18,
                                border: `1px solid ${accentColor}`,
                                background: `linear-gradient(145deg, ${hexToRgba(accentColor, 0.2)}, ${hexToRgba(accentColor, 0.08)})`,
                                color: accentColor,
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.2)}`,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Abrir
                        </a>
                        <button
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                border: `1px solid ${accentColor}`,
                                color: accentColor,
                                background: "transparent",
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                fontSize: "1.3rem",
                            }}
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, background: "#000", overflow: "auto" }}>
                    <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                        title="PDF Preview"
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            display: "block",
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MCristalRitualOverlay — animación tipo videojuego al canjear   ║
   ╚══════════════════════════════════════════════════════════════════╝
   v1.4 — Replica el lenguaje del CristalRitualOverlay del Motor admin
   pero standalone aquí (Co_Mobile no debe importar del admin). Anillos
   concéntricos + 12 partículas radiales + orb central radiante + glyph
   cristal flotante + texto "✦ Códice Anclado ✦". Dura 1.6s. Portaled
   al body con zIndex max + pointerEvents:none — no bloquea taps. */

const MCristalRitualOverlay = () => {
    if (typeof document === "undefined") return null
    const accent = "#00E5FF"
    const accentGold = "#F5D98C"
    const accentSoft = `${accent}b3`
    const accentGlow = `${accent}66`
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, times: [0, 0.15, 0.75, 1] }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483647,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `radial-gradient(circle at center, ${accent}22 0%, ${accent}0a 30%, transparent 60%)`,
            }}
        >
            {[0, 0.15, 0.3].map((delay) => (
                <motion.div
                    key={`ring-${delay}`}
                    initial={{ scale: 0.2, opacity: 0.85 }}
                    animate={{ scale: 4.2, opacity: 0 }}
                    transition={{
                        duration: 1.4,
                        delay,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                        position: "absolute",
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        border: `2px solid ${accentSoft}`,
                        boxShadow: `0 0 30px ${accentGlow}, inset 0 0 30px ${accentGlow}`,
                    }}
                />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2
                const dist = 280
                const dx = Math.cos(angle) * dist
                const dy = Math.sin(angle) * dist
                return (
                    <motion.div
                        key={`particle-${i}`}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                            x: dx,
                            y: dy,
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 1.2,
                            delay: 0.2,
                            ease: [0.16, 1, 0.3, 1],
                            times: [0, 0.2, 0.6, 1],
                        }}
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: accent,
                            boxShadow: `0 0 12px ${accent}, 0 0 22px ${accentSoft}`,
                        }}
                    />
                )
            })}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.4, 1.1, 1.6, 0],
                    opacity: [0, 1, 1, 0.7, 0],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.18, 0.5, 0.8, 1],
                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    position: "relative",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${accent} 28%, ${accentGold}99 60%, transparent 80%)`,
                    boxShadow: `0 0 80px ${accent}, 0 0 160px ${accentSoft}, inset 0 0 60px ${accentGlow}`,
                    filter: "blur(0.5px)",
                }}
            />
            <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                animate={{
                    scale: [0, 1.5, 1.2, 0.4],
                    opacity: [0, 1, 1, 0],
                    rotate: [-45, 0, 12, 35],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.25, 0.7, 1],
                    ease: "easeOut",
                }}
                style={{
                    position: "absolute",
                    fontSize: 64,
                    color: "#FFFFFF",
                    textShadow: `0 0 24px ${accent}, 0 0 48px ${accentSoft}`,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 200,
                    lineHeight: 1,
                }}
            >
                ✦
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    y: [50, 10, 0, -30],
                }}
                transition={{
                    duration: 1.6,
                    times: [0, 0.25, 0.75, 1],
                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    position: "absolute",
                    top: "62%",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.5em",
                    textTransform: "uppercase",
                    marginRight: "-0.5em",
                    color: accent,
                    textShadow: `0 0 16px ${accent}, 0 0 32px ${accentSoft}`,
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                }}
            >
                ✦ Códice Anclado ✦
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0] }}
                transition={{ duration: 1.6, times: [0, 0.3, 0.75, 1] }}
                style={{
                    position: "absolute",
                    top: "70%",
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                }}
            >
                Disponible en Mi Núcleo
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MCristalSuccessModal — confirmación post-animación             ║
   ╚══════════════════════════════════════════════════════════════════╝
   v1.5 — Aparece DESPUÉS del CristalRitualOverlay. Mismo lenguaje
   visual del ConfirmarCristalModal pero más compacto y con CTA
   "Abrir Mi Núcleo". Auto-cierra en 4.5s (controlado por el padre)
   o pico tap en cualquier lado. */

const MCristalSuccessModal = ({
    open,
    bookTitle,
    onClose,
}: {
    open: boolean
    bookTitle: string
    onClose: () => void
}) => {
    if (typeof document === "undefined") return null
    const accent = "#00E5FF"
    const accentSoft = `${accent}b3`
    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483646,
                        background: "rgba(2,5,12,0.78)",
                        backdropFilter: "blur(14px) saturate(140%)",
                        WebkitBackdropFilter: "blur(14px) saturate(140%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 12 }}
                        transition={{
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            background:
                                "linear-gradient(165deg, rgba(8,15,30,0.95) 0%, rgba(2,8,18,0.97) 100%)",
                            border: `1px solid ${accentSoft}55`,
                            borderRadius: 22,
                            padding: "32px 28px 26px",
                            boxShadow: `0 24px 80px rgba(0,0,0,0.6), inset 0 0 60px ${accent}22`,
                            position: "relative",
                            overflow: "hidden",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: `radial-gradient(circle at 50% 0%, ${accent}33 0%, transparent 60%)`,
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.55,
                                delay: 0.08,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            style={{
                                fontSize: 42,
                                color: "#FFFFFF",
                                textShadow: `0 0 24px ${accent}, 0 0 48px ${accentSoft}`,
                                fontWeight: 200,
                                lineHeight: 1,
                                marginBottom: 18,
                            }}
                        >
                            ✦
                        </motion.div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: "0.32em",
                                textTransform: "uppercase",
                                marginRight: "-0.32em",
                                color: accent,
                                textShadow: `0 0 16px ${accent}, 0 0 32px ${accentSoft}`,
                            }}
                        >
                            ✦ Códice Anclado ✦
                        </p>
                        <p
                            style={{
                                margin: "16px 0 0",
                                fontSize: 16,
                                fontWeight: 500,
                                color: "#fff",
                                lineHeight: 1.4,
                            }}
                        >
                            {bookTitle}
                        </p>
                        <p
                            style={{
                                margin: "10px 0 24px",
                                fontSize: 12,
                                color: "rgba(255,255,255,0.55)",
                                letterSpacing: "0.06em",
                                lineHeight: 1.5,
                            }}
                        >
                            Disponible en Mi Núcleo
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                onClose()
                                goNucleoCodices()
                            }}
                            style={{
                                width: "100%",
                                padding: "14px 22px",
                                borderRadius: 12,
                                border: `1px solid ${accent}80`,
                                background: `linear-gradient(135deg, ${accent}33, ${accent}10)`,
                                color: "#fff",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                outline: "none",
                                boxShadow: `0 0 20px ${accent}33, inset 0 0 12px ${accent}22`,
                            }}
                        >
                            Abrir Mi Núcleo
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                padding: "10px",
                                background: "transparent",
                                border: "none",
                                color: "rgba(255,255,255,0.45)",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 11,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Seguir explorando
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MConsolaDeAcceso — bottom sheet con pull-to-close físico       ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MConsolaDeAcceso = ({
    book,
    accentColor,
    textColor,
    longDescSize,
    onClose,
    onPreview,
    onPhysicalLinks,
    onTrailer,
    supabaseUrl,
    supabaseAnonKey,
}: any) => {
    const cristalIntercept = React.useContext(CristalInterceptContext)
    /* v1.4 — ownedFormats refresca automático ante rsv-purchases-changed.
       Permite cambiar el pill DESBLOQUEAR → ADQUIRIDO al instante tras
       un canje exitoso, sin esperar reload. */
    const { ownedFormats, purchasesResolved, hasOwnedSeed } = useNodeStatus(
        supabaseUrl,
        supabaseAnonKey
    )
    const owned = ownsDigitalOf(book, ownedFormats)
    /* Anti-flash: un dueño nunca parpadea "DESBLOQUEAR". Si todavía no
       resolvió el fetch Y no había cache de posesión para este usuario,
       el pill queda en placeholder neutro hasta resolver. */
    const digitalPending = !owned && !purchasesResolved && !hasOwnedSeed
    const identity = useClerkIdentity()
    const hasDig = !!(book.digitalLink && book.digitalLink.trim())
    const hasAud = !!(book.audiobookLink && book.audiobookLink.trim())
    const hasPhy = book.physicalLinks && book.physicalLinks.length > 0
    const hasPreview = !!book.pdfUrl
    const hasTrailer = !!(book.trailerUrl && book.trailerUrl.trim())
    const anyButton = hasDig || hasAud || hasPhy

    const scrollRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const coverRef = useRef<HTMLImageElement>(null)
    const materializedRef = useRef(false)
    const touchStartY = useRef(0)
    const dragOffset = useRef(0)
    const isDragging = useRef(false)
    const wasScrolling = useRef(false)
    const [dismissed, setDismissed] = useState(false)
    const DISMISS_THRESHOLD = 140
    const VELOCITY_THRESHOLD = 800
    const lastTouchY = useRef(0)
    const lastTouchTime = useRef(0)
    const velocity = useRef(0)

    const applyTransform = useCallback((offset: number) => {
        if (!sheetRef.current || !overlayRef.current) return
        const clamped = Math.max(0, offset)
        const transformed =
            clamped < 200 ? clamped : 200 + (clamped - 200) * 0.3
        sheetRef.current.style.transform = `translateY(${transformed}px)`
        const progress = Math.min(transformed / 400, 1)
        overlayRef.current.style.background = `rgba(0,0,0,${0.7 * (1 - progress * 0.6)})`
    }, [])

    const snapBack = useCallback(() => {
        if (!sheetRef.current || !overlayRef.current) return
        sheetRef.current.style.transition =
            "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)"
        sheetRef.current.style.transform = "translateY(0)"
        overlayRef.current.style.transition = "background 0.35s ease"
        overlayRef.current.style.background = "rgba(0,0,0,0.7)"
        isDragging.current = false
        dragOffset.current = 0
    }, [])

    const closedRef = useRef(false)
    const safeClose = useCallback(() => {
        if (closedRef.current) return
        closedRef.current = true
        onClose()
    }, [onClose])

    const dismiss = useCallback(() => {
        if (dismissed || closedRef.current) return
        setDismissed(true)
        isDragging.current = false
        dragOffset.current = 0
        const sheet = sheetRef.current
        const overlay = overlayRef.current
        if (!sheet || !overlay) {
            safeClose()
            return
        }
        const matrix = new DOMMatrixReadOnly(getComputedStyle(sheet).transform)
        const currentY = matrix.m42 || 0
        sheet.style.transition = "none"
        sheet.style.transform = `translateY(${currentY}px)`
        void sheet.offsetHeight
        sheet.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.7, 1)"
        sheet.style.transform = "translateY(105vh)"
        overlay.style.transition = "opacity 0.35s ease"
        overlay.style.opacity = "0"
        const cleanup = (e?: TransitionEvent) => {
            if (e && (e.propertyName !== "transform" || e.target !== sheet))
                return
            sheet.removeEventListener("transitionend", cleanup)
            safeClose()
        }
        sheet.addEventListener("transitionend", cleanup)
        setTimeout(safeClose, 500)
    }, [dismissed, safeClose])

    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0]
            touchStartY.current = t.clientY
            lastTouchY.current = t.clientY
            lastTouchTime.current = Date.now()
            velocity.current = 0
            wasScrolling.current = false
            if (sheetRef.current) sheetRef.current.style.transition = "none"
            if (overlayRef.current) overlayRef.current.style.transition = "none"
        },
        [dismissed]
    )

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (dismissed) return
            const t = e.touches[0]
            const scrollEl = scrollRef.current
            if (!scrollEl) return
            const deltaFromStart = t.clientY - touchStartY.current
            const atTop = scrollEl.scrollTop <= 1
            const now = Date.now()
            const dt = now - lastTouchTime.current
            if (dt > 0)
                velocity.current =
                    ((t.clientY - lastTouchY.current) / dt) * 1000
            lastTouchY.current = t.clientY
            lastTouchTime.current = now
            if (!isDragging.current && !atTop) {
                wasScrolling.current = true
                return
            }
            if (atTop && deltaFromStart > 0) {
                if (wasScrolling.current && !isDragging.current) {
                    touchStartY.current = t.clientY
                    wasScrolling.current = false
                    return
                }
                isDragging.current = true
                dragOffset.current = deltaFromStart
                e.preventDefault()
                applyTransform(deltaFromStart)
            } else if (isDragging.current && deltaFromStart <= 0) {
                isDragging.current = false
                dragOffset.current = 0
                snapBack()
            }
        },
        [dismissed, applyTransform, snapBack]
    )

    const handleTouchEnd = useCallback(() => {
        if (dismissed) return
        if (!isDragging.current) return
        const offset = dragOffset.current
        const vel = velocity.current
        if (offset > DISMISS_THRESHOLD || vel > VELOCITY_THRESHOLD) dismiss()
        else snapBack()
    }, [dismissed, dismiss, snapBack])

    useEffect(() => {
        const sheet = sheetRef.current
        if (!sheet) return
        const opts: AddEventListenerOptions = { passive: false }
        sheet.addEventListener("touchstart", handleTouchStart, opts)
        sheet.addEventListener("touchmove", handleTouchMove, opts)
        sheet.addEventListener("touchend", handleTouchEnd)
        sheet.addEventListener("touchcancel", handleTouchEnd)
        return () => {
            sheet.removeEventListener("touchstart", handleTouchStart)
            sheet.removeEventListener("touchmove", handleTouchMove)
            sheet.removeEventListener("touchend", handleTouchEnd)
            sheet.removeEventListener("touchcancel", handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    useEffect(() => {
        const sheet = sheetRef.current
        const overlay = overlayRef.current
        if (!sheet || !overlay) return
        const onSheetAnimEnd = (e: AnimationEvent) => {
            if (e.animationName === "consolaSheetIn") {
                sheet.style.animation = "none"
                sheet.style.transform = "translateY(0)"
            }
        }
        const onOverlayAnimEnd = (e: AnimationEvent) => {
            if (e.animationName === "consolaOverlayIn") {
                overlay.style.animation = "none"
                overlay.style.opacity = "1"
            }
        }
        sheet.addEventListener("animationend", onSheetAnimEnd)
        overlay.addEventListener("animationend", onOverlayAnimEnd)
        return () => {
            sheet.removeEventListener("animationend", onSheetAnimEnd)
            overlay.removeEventListener("animationend", onOverlayAnimEnd)
        }
    }, [])

    // #2 Materialización — la portada se ENSAMBLA desde esquirlas de luz al
    // abrir el Códice. Una sola vez por apertura (la Consola se monta fresca
    // por cada libro). Burst aditivo: no toca el slide-up CSS del sheet.
    useEffect(() => {
        if (materializedRef.current) return
        materializedRef.current = true
        const t = setTimeout(() => {
            const el = coverRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            /* Si la portada aún no cargó (rect sin alto), saltar el burst en
               vez de dispararlo en el borde superior (centro mal calculado). */
            if (r.width === 0 || r.height === 0) return
            fireMaterialize(r.left + r.width / 2, r.top + r.height / 2, {
                color: accentColor,
                count: 14,
                radius: 110,
            })
        }, 340)
        return () => clearTimeout(t)
    }, [accentColor])

    if (typeof document === "undefined") return null
    return createPortal(
        <div
            ref={overlayRef}
            onClick={dismissed ? undefined : dismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99998,
                background: "rgba(0,0,0,.7)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pointerEvents: dismissed ? "none" : "auto",
                animation: "consolaOverlayIn 0.2s ease forwards",
            }}
        >
            <div
                ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    height: "92vh",
                    background:
                        "linear-gradient(180deg,rgba(8,14,28,.98),rgba(5,10,20,.99))",
                    borderRadius: "22px 22px 0 0",
                    border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                    borderBottom: "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    willChange: "transform",
                    animation:
                        "consolaSheetIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: "14px 20px 12px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "3px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.5)",
                            position: "absolute",
                            top: "8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <span
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: ".7rem",
                            fontWeight: 300,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".15em",
                            opacity: 0.7,
                        }}
                    >
                        Consola de Acceso
                    </span>
                    <button
                        onClick={dismiss}
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                            background: "rgba(255,255,255,.05)",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
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
                </div>
                <div
                    ref={scrollRef}
                    className="m-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "18px",
                        padding: "0 20px 20px 20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: "16px",
                            width: "100%",
                        }}
                    >
                        <img
                            ref={coverRef}
                            src={
                                book.coverUrl ||
                                makeFallbackDataUrl(book.title, accentColor)
                            }
                            alt={book.title}
                            style={{
                                width: "110px",
                                borderRadius: "12px",
                                boxShadow: `0 8px 24px rgba(0,0,0,.5), 0 0 15px ${hexToRgba(accentColor, 0.08)}`,
                                flexShrink: 0,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                paddingTop: "4px",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: "1.25rem",
                                    fontWeight: 300,
                                    color: "#FFF",
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                {book.title}
                            </h2>
                            <span
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: ".8rem",
                                    color: accentColor,
                                    fontWeight: 400,
                                    opacity: 0.8,
                                }}
                            >
                                {book.author}
                            </span>
                            <MFichaTecnica
                                pageCount={book.pageCount}
                                year={book.year}
                                accentColor={accentColor}
                            />
                            {(hasPreview || hasTrailer) && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginTop: "8px",
                                        width: "100%",
                                        flex: 1,
                                        minHeight: 0,
                                    }}
                                >
                                    {hasPreview && (
                                        <button
                                            className="m-preview-btn"
                                            onClick={onPreview}
                                            style={{
                                                flex: 1,
                                                padding: "10px 6px",
                                                borderRadius: "12px",
                                                border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                                                background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                                                color: "#FFF",
                                                cursor: "pointer",
                                                outline: "none",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                fontSize: ".68rem",
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                                textAlign: "center",
                                                boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                                            }}
                                        >
                                            <MIconEye />
                                            <span>
                                                Leer Primeras
                                                <br />
                                                Páginas
                                            </span>
                                        </button>
                                    )}
                                    {hasTrailer && (
                                        <button
                                            className="m-preview-btn"
                                            onClick={onTrailer}
                                            style={{
                                                flex: 1,
                                                padding: "10px 6px",
                                                borderRadius: "12px",
                                                border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                                                background: `linear-gradient(145deg, rgba(10,20,35,0.9), ${hexToRgba(accentColor, 0.2)})`,
                                                color: "#FFF",
                                                cursor: "pointer",
                                                outline: "none",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                                fontSize: ".68rem",
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                                textAlign: "center",
                                                boxShadow: `0 0 12px ${hexToRgba(accentColor, 0.15)}`,
                                            }}
                                        >
                                            <span
                                                style={{ fontSize: "1.1rem" }}
                                            >
                                                🎬
                                            </span>
                                            <span>
                                                Ver
                                                <br />
                                                Trailer
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        style={{
                            width: "50px",
                            height: "1px",
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                            opacity: 0.3,
                            flexShrink: 0,
                        }}
                    />
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: `${longDescSize}px`,
                            lineHeight: 1.75,
                            color: textColor,
                            opacity: 0.8,
                            textAlign: "left",
                            margin: 0,
                            whiteSpace: "pre-line",
                            width: "100%",
                            paddingBottom: "10px",
                        }}
                    >
                        {book.synopsis || book.shortSynopsis}
                    </p>
                </div>
                {anyButton && (
                    <div
                        style={{
                            flexShrink: 0,
                            width: "100%",
                            padding: "20px 20px 30px 20px",
                            background: `linear-gradient(0deg, #050A14 40%, rgba(5,10,20,0.8) 80%, transparent)`,
                            borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            zIndex: 10,
                        }}
                    >
                        {hasDig &&
                            (owned ? (
                                <MPurchasePill
                                    icon={MIconTablet}
                                    label="ADQUIRIDO"
                                    subLabel="Abrir en Mi Núcleo"
                                    onClick={goNucleoCodices}
                                    accentColor={GOLD_OWNED}
                                    textColor={textColor}
                                />
                            ) : digitalPending ? (
                                <MPurchasePill
                                    icon={MIconTablet}
                                    label="·  ·  ·"
                                    subLabel="El Códice completo"
                                    disabled
                                    accentColor={accentColor}
                                    textColor={textColor}
                                />
                            ) : (
                                <MPurchasePill
                                    icon={MIconTablet}
                                    label="DESBLOQUEAR"
                                    subLabel="El Códice completo"
                                    href={checkoutHref(book.digitalLink, null, identity)}
                                    onIntercept={() =>
                                        cristalIntercept(book, ["pdf", "epub"])
                                    }
                                    accentColor={accentColor}
                                    textColor={textColor}
                                />
                            ))}
                        {/* v1.14 — el audiolibro YA NO se vende aparte: viene
                            incluido en el Códice (un pago / un Cristal entrega
                            todos sus formatos). Este tile solo se enciende con
                            `link_audio` del catálogo, que está VACÍO en los 11
                            Códices → hoy no se muestra. Si algún día se llena,
                            estaría cobrando dos veces lo mismo: retirarlo. */}
                        {hasAud && (
                            <MPurchasePill
                                icon={MIconHeadphones}
                                label="DESBLOQUEAR"
                                subLabel="Audiolibro"
                                href={checkoutHref(book.audiobookLink, null, identity)}
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                        {hasPhy && (
                            <MPurchasePill
                                icon={MIconBox}
                                label="MATERIALIZAR"
                                subLabel="Libro Impreso"
                                onClick={() =>
                                    onPhysicalLinks(book.physicalLinks)
                                }
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MBookThumb — card de scroll con consola de acceso              ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const MBookThumb = ({
    book,
    accentColor,
    textColor,
    shortDescSize,
    exploreLabel,
    onOpen,
    onPhysicalLinks,
    anchorId,
    supabaseUrl,
    supabaseAnonKey,
}: any) => {
    const identity = useClerkIdentity()
    const cristalIntercept = React.useContext(CristalInterceptContext)
    /* v1.4 — ownedFormats real-time para switchear DESBLOQUEAR
       → ADQUIRIDO post-canje. */
    const { ownedFormats, purchasesResolved, hasOwnedSeed } = useNodeStatus(
        supabaseUrl,
        supabaseAnonKey
    )
    const owned = ownsDigitalOf(book, ownedFormats)
    /* Anti-flash: dueño nunca parpadea "DESBLOQUEAR" (ver call site gemelo). */
    const digitalPending = !owned && !purchasesResolved && !hasOwnedSeed
    const hasDig = !!(book.digitalLink && book.digitalLink.trim())
    const hasAud = !!(book.audiobookLink && book.audiobookLink.trim())
    const hasPhy = book.physicalLinks && book.physicalLinks.length > 0
    const anyButton = hasDig || hasAud || hasPhy
    return (
        <motion.div
            id={anchorId}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                padding: "0 0 24px 0",
                scrollMarginTop: "90px",
            }}
        >
            <div style={{ width: "65vw", maxWidth: "260px" }} onClick={onOpen}>
                <img
                    src={
                        book.coverUrl ||
                        makeFallbackDataUrl(book.title, accentColor)
                    }
                    alt={book.title}
                    style={{
                        width: "100%",
                        borderRadius: "16px",
                        boxShadow: `0 15px 40px rgba(0,0,0,.5), 0 0 25px ${hexToRgba(accentColor, 0.08)}`,
                        display: "block",
                        cursor: "pointer",
                    }}
                />
            </div>
            <h2
                onClick={onOpen}
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 100,
                    color: "#FFF",
                    margin: 0,
                    textAlign: "center",
                    lineHeight: 1.25,
                    padding: "0 20px",
                    cursor: "pointer",
                    letterSpacing: ".08em",
                    textShadow: `0 0 18px ${hexToRgba(accentColor, 0.2)}`,
                }}
            >
                {book.title}
            </h2>
            <p
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: `${shortDescSize}px`,
                    lineHeight: 1.65,
                    color: textColor,
                    opacity: 0.6,
                    textAlign: "center",
                    padding: "0 28px",
                    margin: 0,
                    overflow: "visible",
                }}
            >
                {book.shortSynopsis || book.synopsis}
            </p>
            <button
                className="m-explore-btn"
                onClick={onOpen}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "14px 32px",
                    borderRadius: "16px",
                    border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                    background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.12)}, transparent, ${hexToRgba(accentColor, 0.08)})`,
                    color: accentColor,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: ".78rem",
                    fontWeight: 500,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    outline: "none",
                    marginTop: "6px",
                    boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.15)}, 0 0 40px ${hexToRgba(accentColor, 0.05)}, inset 0 1px 0 ${hexToRgba(accentColor, 0.2)}`,
                    transform: "scale(1)",
                    overflow: "hidden",
                    backdropFilter: "blur(4px)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "16px",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "60%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.2)}, transparent)`,
                            animation: "exploreShimmer 3s ease-in-out infinite",
                        }}
                    />
                </div>
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: "relative", zIndex: 1 }}
                >
                    <path d="M12 2L22 12L12 22L2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ position: "relative", zIndex: 1 }}>
                    {exploreLabel}
                </span>
            </button>
            {anyButton && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: "320px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "12px 20px 0 20px",
                    }}
                >
                    {hasDig &&
                        (owned ? (
                            <MPurchasePill
                                icon={MIconTablet}
                                label="ADQUIRIDO"
                                subLabel="Abrir en Mi Núcleo"
                                onClick={goNucleoCodices}
                                accentColor={GOLD_OWNED}
                                textColor={textColor}
                            />
                        ) : digitalPending ? (
                            <MPurchasePill
                                icon={MIconTablet}
                                label="·  ·  ·"
                                subLabel="El Códice completo"
                                disabled
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        ) : (
                            <MPurchasePill
                                icon={MIconTablet}
                                label="DESBLOQUEAR"
                                subLabel="El Códice completo"
                                href={checkoutHref(book.digitalLink, null, identity)}
                                onIntercept={() =>
                                    cristalIntercept(book, ["pdf", "epub"])
                                }
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        ))}
                    {hasAud && (
                        <MPurchasePill
                            icon={MIconHeadphones}
                            label="DESBLOQUEAR"
                            subLabel="Audiolibro"
                            href={checkoutHref(book.audiobookLink, null, identity)}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    )}
                    {hasPhy && (
                        <MPurchasePill
                            icon={MIconBox}
                            label="MATERIALIZAR"
                            subLabel="Libro Impreso"
                            onClick={() => onPhysicalLinks(book.physicalLinks)}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    )}
                </div>
            )}
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  CodicesMobile — componente principal                            ║
   ╚══════════════════════════════════════════════════════════════════╝ */

function CodicesMobile(props: any) {
    const {
        textColor = "#FFFFFF",
        accentColor: accentProp,
        pageTitleImage,
        pageTitleImageHeight = 60,
        pageTitleFallback = "ARCHIVOS",
        titleFallbackSize = 28,
        shortDescSize = 13,
        longDescSize = 14,
        pageSubtitle = "Explora el conocimiento estelar",
        exploreButtonLabel = "EXPLORAR CÓDICE",
        booksList = [],
        faqList = [],
        topPaddingPx = 70,
        cardGapPx = 44,
        bottomReservePx = 0,
        mobileTitleMode = "compact",
        supabaseUrl = "",
        supabaseAnonKey = "",
        // Paridad con la app: si un shell pinta su propio contador de cristales,
        // oculta el de este sub-tab. En la web standalone (default false) se ve.
        hideCristalChip = false,
    } = props

    const [accentColor, setAccentColor] = useState(accentProp || "#00C2FF")
    const containerRef = useRef<HTMLDivElement>(null)
    const zakRef = useRef<HTMLDivElement>(null)
    const aquaRef = useRef<HTMLDivElement>(null)
    const [consolaBook, setConsolaBook] = useState<any | null>(null)
    const [showFaq, setShowFaq] = useState(false)
    const [showAmazon, setShowAmazon] = useState<any[] | null>(null)
    const [pdfState, setPdfState] = useState<{
        url: string
        title: string
    } | null>(null)
    const [videoState, setVideoState] = useState<{ url: string } | null>(null)
    const [showDock, setShowDock] = useState(false)
    const [fetchedBooks, setFetchedBooks] = useState<any[]>([])

    const cristalIdentity = useClerkIdentity()
    const cristalesM = useCristales(
        cristalIdentity.clerkId,
        supabaseUrl,
        supabaseAnonKey
    )
    const cristalTierM = useMembershipTier(
        cristalIdentity.clerkId,
        supabaseUrl,
        supabaseAnonKey
    )
    const isMember =
        cristalTierM.tier === "sintonia" || cristalTierM.tier === "inmersion"
    const [cristalModalM, setCristalModalM] = useState<{
        open: boolean
        book: any | null
        formats: string[]
    }>({ open: false, book: null, formats: [] })
    // Muro de pago de Cristales: se abre cuando NO se puede canjear.
    const [codiceGate, setCodiceGate] = useState<{
        open: boolean
        book: any | null
    }>({ open: false, book: null })
    const [codicePaywallOpen, setCodicePaywallOpen] = useState(false)
    const tryRedeemCodiceMobile = useCallback(
        (book: any, formats: string[]): boolean => {
            // ¿Puede canjear con un Cristal de Códice? → abre el confirm.
            if (
                cristalIdentity.clerkId &&
                cristalesM.codiceCount > 0 &&
                book?.bookId
            ) {
                setCristalModalM({ open: true, book, formats })
                return true
            }
            // No puede canjear → abre el muro de pago en lugar de navegar a
            // Stripe. Retorna true SIEMPRE para que MPurchasePill cancele su
            // navegación nativa (la pastilla nunca dispara su <a href>).
            setCodiceGate({ open: true, book })
            return true
        },
        [cristalIdentity.clerkId, cristalesM.codiceCount]
    )
    /* v1.5 — Coreografía de la extracción:
         1. Modal confirma cierra inmediato (no esperar setTimeout
            interno del ConfirmarCristalModal — limpia el fondo).
         2. CristalRitualOverlay corre 1.6s.
         3. Modal de éxito aparece, autocierra en 4.5s o por tap. */
    const [cristalRitualOpen, setCristalRitualOpen] = useState(false)
    const [cristalSuccess, setCristalSuccess] = useState<{
        open: boolean
        title: string
    }>({ open: false, title: "" })
    const handleCristalConfirmMobile = useCallback(async () => {
        if (!cristalModalM.book || !cristalIdentity.clerkId) return
        if (!cristalModalM.book.bookId) {
            console.warn("[cristal] book.bookId missing — abort redeem")
            return
        }
        const bookTitle = cristalModalM.book.title || "Códice"
        const r = await redeemCodiceWithCristal(
            cristalIdentity.clerkId,
            cristalModalM.book.bookId,
            cristalModalM.formats,
            supabaseUrl,
            supabaseAnonKey
        )
        if (!r.success) {
            console.warn("[cristal] redeem error:", r.error)
            throw new Error(r.error || "redeem_failed")
        }
        // Cerrar modal de confirmación inmediato — el background
        // queda limpio para la animación.
        setCristalModalM({ open: false, book: null, formats: [] })
        setCristalRitualOpen(true)
        setTimeout(() => {
            setCristalRitualOpen(false)
            setCristalSuccess({ open: true, title: bookTitle })
        }, 1600)
        setTimeout(() => {
            setCristalSuccess({ open: false, title: "" })
        }, 1600 + 4500)
    }, [
        cristalModalM,
        cristalIdentity.clerkId,
        supabaseUrl,
        supabaseAnonKey,
    ])

    useEffect(() => {
        if (accentProp) {
            setAccentColor(accentProp)
            return
        }
        const t = setTimeout(() => {
            try {
                const v = getComputedStyle(document.documentElement)
                    .getPropertyValue("--accent")
                    .trim()
                if (v) setAccentColor(v)
            } catch {}
        }, 200)
        return () => clearTimeout(t)
    }, [accentProp])

    useEffect(() => {
        console.log("[Codices] mounted (Co_Mobile v1.0)")
        const el = containerRef.current
        if (!el) return
        const fn = () => setShowDock(el.scrollTop > window.innerHeight * 0.5)
        el.addEventListener("scroll", fn, { passive: true })
        return () => el.removeEventListener("scroll", fn)
    }, [])

    useEffect(() => {
        if (booksList && booksList.length > 0) return
        if (!supabaseUrl || !supabaseAnonKey) return
        let cancelled = false
        fetch(
            `${supabaseUrl}/rest/v1/catalog_books?select=*&is_active=eq.true&order=author_option.asc,sort_order.asc`,
            {
                headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
            }
        )
            .then((r) => (r.ok ? r.json() : []))
            .then((rows: any[]) => {
                if (cancelled || !Array.isArray(rows)) return
                setFetchedBooks(
                    rows.map((row: any) => ({
                        title: row.title,
                        authorOption: row.author_option,
                        cover: row.cover_url,
                        pdfFile: row.pdf_preview_url,
                        trailerVideo: row.trailer_url,
                        pageCount: row.page_count,
                        year: row.publication_year,
                        shortDesc: row.short_desc,
                        longDesc: row.long_desc,
                        linkDigital: row.link_digital,
                        linkAudio: row.link_audio,
                        linkAmazonES: row.link_amazon_es,
                        linkAmazonMX: row.link_amazon_mx,
                        linkAmazonUS: row.link_amazon_us,
                        linkAmazonDE: row.link_amazon_de,
                        bookId: row.book_id,
                    }))
                )
            })
            .catch((e) => {
                console.warn("[Codices] catalog_books fetch failed:", e)
            })
        return () => {
            cancelled = true
        }
    }, [booksList, supabaseUrl, supabaseAnonKey])

    const effectiveBooksList =
        booksList && booksList.length > 0 ? booksList : fetchedBooks

    const books = useMemo(
        () =>
            (effectiveBooksList || []).map((b: any, i: number) => ({
                id: String(i),
                bookId: b.bookId,
                title: b.title || "Sin título",
                author: b.authorOption || "Zak´Haar",
                coverUrl: b.cover,
                synopsis: b.longDesc,
                shortSynopsis: b.shortDesc,
                digitalLink: b.linkDigital,
                audiobookLink: b.linkAudio,
                pdfUrl: b.pdfFile,
                trailerUrl:
                    b.trailerFile || b.trailerUrl || b.trailerVideo || "",
                pageCount: b.pageCount || "",
                year: b.year || "",
                physicalLinks: [
                    b.linkAmazonES && {
                        label: "Amazon ES",
                        href: b.linkAmazonES,
                    },
                    b.linkAmazonMX && {
                        label: "Amazon MX",
                        href: b.linkAmazonMX,
                    },
                    b.linkAmazonUS && {
                        label: "Amazon US",
                        href: b.linkAmazonUS,
                    },
                    b.linkAmazonDE && {
                        label: "Amazon DE",
                        href: b.linkAmazonDE,
                    },
                ].filter(Boolean),
            })),
        [effectiveBooksList]
    )

    const zakBooks = useMemo(
        () => books.filter((b: any) => b.author.includes("Zak")),
        [books]
    )
    const aquaBooks = useMemo(
        () => books.filter((b: any) => !b.author.includes("Zak")),
        [books]
    )
    const orderedBooks = useMemo(
        () => [...zakBooks, ...aquaBooks],
        [zakBooks, aquaBooks]
    )
    const bookAnchorMap = useMemo(() => {
        const map: Record<string, number> = {}
        orderedBooks.forEach((b: any, i: number) => {
            map[b.id] = i + 1
        })
        return map
    }, [orderedBooks])

    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return
        const anchorNum = hash.replace("#", "")
        if (!anchorNum || isNaN(Number(anchorNum))) return
        const timer = setTimeout(() => {
            const el = document.getElementById(`book-anchor-${anchorNum}`)
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 600)
        return () => clearTimeout(timer)
    }, [orderedBooks])

    const resolvedSub = useMemo(
        () => normalizeMultiline(pageSubtitle),
        [pageSubtitle]
    )
    const handleAuthorScroll = useCallback((author: string) => {
        const ref = author === "Zak" ? zakRef : aquaRef
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [])
    const handlePreview = useCallback(() => {
        if (consolaBook?.pdfUrl)
            setPdfState({ url: consolaBook.pdfUrl, title: consolaBook.title })
    }, [consolaBook])
    const handleTrailer = useCallback(() => {
        if (consolaBook?.trailerUrl)
            setVideoState({ url: consolaBook.trailerUrl })
    }, [consolaBook])

    const renderAuthorSection = (
        authorBooks: any[],
        authorName: string,
        authorRef: React.RefObject<HTMLDivElement | null>,
        paddingTop: string
    ) => {
        if (authorBooks.length === 0) return null
        return (
            <div
                ref={authorRef}
                style={{ paddingTop, scrollMarginTop: "20px" }}
            >
                <div
                    style={{
                        padding: "0 20px 38px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: ".65rem",
                            fontWeight: 300,
                            color: accentColor,
                            textTransform: "uppercase",
                            letterSpacing: ".2em",
                            opacity: 0.45,
                        }}
                    >
                        Códices de
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            width: "100%",
                            maxWidth: "380px",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                height: "1px",
                                background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.5)})`,
                            }}
                        />
                        <h3
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: "1.1rem",
                                fontWeight: 200,
                                color: "#FFF",
                                margin: 0,
                                letterSpacing: ".22em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                textShadow: `0 0 20px ${hexToRgba(accentColor, 0.2)}`,
                            }}
                        >
                            {authorName}
                        </h3>
                        <div
                            style={{
                                flex: 1,
                                height: "1px",
                                background: `linear-gradient(90deg, ${hexToRgba(accentColor, 0.5)}, transparent)`,
                            }}
                        />
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: `${cardGapPx}px`,
                    }}
                >
                    {authorBooks.map((book: any) => (
                        <MBookThumb
                            key={book.id}
                            book={book}
                            accentColor={accentColor}
                            textColor={textColor}
                            shortDescSize={shortDescSize}
                            exploreLabel={exploreButtonLabel}
                            onOpen={() => setConsolaBook(book)}
                            onPhysicalLinks={(links: any[]) =>
                                setShowAmazon(links)
                            }
                            anchorId={`book-anchor-${bookAnchorMap[book.id]}`}
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <CristalInterceptContext.Provider value={tryRedeemCodiceMobile}>
        <div
            style={{
                position: "relative",
                width: "100%",
                height: bottomReservePx > 0 ? "100%" : "100vh",
                overflow: "hidden",
                background: "transparent",
                fontFamily: "'Inter',sans-serif",
                color: textColor,
            }}
        >
            {/* v1.3 — Indicador visible para todos (incluso Explorer).
                Cuenta 0 cristales si no es miembro; picarlo abre el
                modal explicativo.
                v1.5.2 — En modo "centered" (raíz /codices) el chip va
                a top-left para no chocar con el SolarNav. En el shell
                de Holoteca el modo es "compact" y queda a la derecha
                como antes (la esquina derecha del shell está libre).
                v1.10 — `hideCristalChip` (paridad con la app): un shell que
                pinte su propio contador doble oculta el de este sub-tab.
                Standalone (web /codices) lo deja visible. */}
            {!hideCristalChip && (
                <div
                    style={{
                        position: "fixed",
                        top: 14,
                        right:
                            mobileTitleMode === "centered" ? undefined : 14,
                        left:
                            mobileTitleMode === "centered" ? 14 : undefined,
                        zIndex: 9990,
                        pointerEvents: "auto",
                    }}
                >
                    <CristalesIndicator
                        codiceCount={cristalesM.codiceCount}
                        meditacionCount={cristalesM.meditacionCount}
                        onlyKind="codice"
                    />
                </div>
            )}
            <AnimatePresence>
                {showDock &&
                    !consolaBook &&
                    !showFaq &&
                    !showAmazon &&
                    !pdfState &&
                    !videoState && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: "fixed",
                                bottom: 40 + bottomReservePx,
                                right: 0,
                                zIndex: 99997,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            {faqList && faqList.length > 0 && (
                                <button
                                    className="m-faq-btn"
                                    onClick={() => setShowFaq(true)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "14px 0 0 14px",
                                        borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderBottom: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderLeft: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                        borderRight: `2px solid ${hexToRgba(accentColor, 0.5)}`,
                                        background: "rgba(8,12,20,0.95)",
                                        backdropFilter: "blur(12px)",
                                        color: hexToRgba(accentColor, 0.65),
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        outline: "none",
                                        boxShadow: `-4px 0 15px ${hexToRgba(accentColor, 0.05)}`,
                                        paddingRight: 4,
                                    }}
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <path d="M12 17h.01" strokeWidth="2" />
                                    </svg>
                                </button>
                            )}
                            <button
                                className="m-faq-btn"
                                onClick={() =>
                                    containerRef.current?.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    })
                                }
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "14px 0 0 14px",
                                    borderTop: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderBottom: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderLeft: `1px solid ${hexToRgba(accentColor, 0.1)}`,
                                    borderRight: `2px solid ${hexToRgba(accentColor, 0.5)}`,
                                    background: "rgba(8,12,20,0.95)",
                                    backdropFilter: "blur(12px)",
                                    color: hexToRgba(accentColor, 0.65),
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    outline: "none",
                                    boxShadow: `-4px 0 15px ${hexToRgba(accentColor, 0.05)}`,
                                    paddingRight: 4,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="18 15 12 9 6 15" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
            </AnimatePresence>

            <AnimatePresence>
                {showFaq && (
                    <MFaqModal
                        faqs={faqList}
                        accentColor={accentColor}
                        textColor={textColor}
                        onClose={() => setShowFaq(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showAmazon && (
                    <MAmazonSheet
                        links={showAmazon}
                        accentColor={accentColor}
                        textColor={textColor}
                        onClose={() => setShowAmazon(null)}
                    />
                )}
            </AnimatePresence>
            {consolaBook && (
                <MConsolaDeAcceso
                    book={consolaBook}
                    accentColor={accentColor}
                    textColor={textColor}
                    longDescSize={longDescSize}
                    onClose={() => setConsolaBook(null)}
                    onPreview={handlePreview}
                    onTrailer={handleTrailer}
                    onPhysicalLinks={(links: any[]) => setShowAmazon(links)}
                    supabaseUrl={supabaseUrl}
                    supabaseAnonKey={supabaseAnonKey}
                />
            )}
            <AnimatePresence>
                {pdfState && (
                    <MPdfViewer
                        pdfUrl={pdfState.url}
                        title={`Vista Previa: ${pdfState.title}`}
                        accentColor={accentColor}
                        onClose={() => setPdfState(null)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {videoState && (
                    <MVideoModal
                        videoUrl={videoState.url}
                        accentColor={accentColor}
                        onClose={() => setVideoState(null)}
                    />
                )}
            </AnimatePresence>

            <div
                ref={containerRef}
                className="m-scroll"
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    height:
                        bottomReservePx > 0
                            ? "100dvh"
                            : "100vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingBottom:
                        bottomReservePx > 0 ? `${bottomReservePx}px` : 0,
                    WebkitOverflowScrolling: "touch" as any,
                    overscrollBehavior: "none" as any,
                    overscrollBehaviorY: "none" as any,
                }}
            >
                {mobileTitleMode === "centered" ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        style={{
                            textAlign: "center",
                            /* env(safe-area-inset-top) suma la altura del
                               notch SOLO en PWA standalone iOS. Web normal:
                               env() = 0, queda igual. */
                            paddingTop: `calc(${Math.max(topPaddingPx, 60)}px + env(safe-area-inset-top, 0px))`,
                            paddingBottom: 8,
                            paddingLeft: 16,
                            paddingRight: 16,
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 32,
                                fontWeight: 200,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                margin: 0,
                                lineHeight: 1.1,
                                userSelect: "none",
                                color: "transparent",
                                filter: `drop-shadow(0 0 14px ${hexToRgba(accentColor, 0.35)})`,
                                WebkitFontSmoothing: "antialiased",
                                animation:
                                    "nuc-breath 7s ease-in-out infinite",
                            }}
                        >
                            <span
                                style={{
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
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
                            paddingLeft: 16,
                            paddingBottom: 0,
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
                                filter: `drop-shadow(0 0 10px ${hexToRgba(accentColor, 0.3)})`,
                                WebkitFontSmoothing: "antialiased",
                                animation:
                                    "nuc-breath 7s ease-in-out infinite",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <span
                                style={{
                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
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

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "32px",
                        /* v1.9 — top: 60 → 132 baja "Explorar autores" +
                           las cards de autor para que queden más al centro
                           óptico. bottom: 100 → 120 empuja la sección
                           "Códices de Zak'Haar" un poco más abajo: el
                           encabezado queda asomándose justo por encima de la
                           barra de navegación (señal de que hay más al hacer
                           scroll). */
                        padding: "132px 0 120px 0",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            paddingBottom: "10px",
                            /* v1.2 — marginBottom -16 acerca el
                               "Explorar autores" al card Zak'Haar
                               (gap implícito 32 → 16 efectivo). */
                            marginBottom: "-16px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: ".7rem",
                                color: textColor,
                                opacity: 0.5,
                                letterSpacing: ".1em",
                                textTransform: "uppercase",
                            }}
                        >
                            Explorar autores
                        </span>
                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <MIconChevronDown />
                        </motion.div>
                    </motion.div>
                    <MAuthorCard
                        name="Zak'Haar"
                        icon="sun"
                        accentColor="#00C2FF"
                        onSelect={() => handleAuthorScroll("Zak")}
                        delay={0.3}
                    />
                    <MAuthorCard
                        name="Aqua'Riia"
                        icon="drop"
                        accentColor="#00C2FF"
                        onSelect={() => handleAuthorScroll("Aqua")}
                        delay={0.5}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ paddingBottom: "100px" }}
                >
                    {renderAuthorSection(zakBooks, "Zak'Haar", zakRef, "40px")}
                    {renderAuthorSection(
                        aquaBooks,
                        "Aqua'Riia",
                        aquaRef,
                        "60px"
                    )}
                </motion.div>
            </div>
        </div>
        <ConfirmarCristalModal
            open={cristalModalM.open}
            kind="codice"
            itemTitle={cristalModalM.book?.title || ""}
            itemSubtitle={
                cristalModalM.formats.length > 0
                    ? cristalModalM.formats
                          .map((f) => f.toUpperCase())
                          .join(" + ")
                    : "El Códice completo"
            }
            countBefore={cristalesM.codiceCount}
            onConfirm={handleCristalConfirmMobile}
            onCancel={() =>
                setCristalModalM({
                    open: false,
                    book: null,
                    formats: [],
                })
            }
        />
        {/* v1.4 — Overlay tipo videojuego post-canje */}
        <AnimatePresence>
            {cristalRitualOpen && <MCristalRitualOverlay key="ritual" />}
        </AnimatePresence>
        {/* v1.5 — Modal de éxito que aparece tras el ritual */}
        <MCristalSuccessModal
            open={cristalSuccess.open}
            bookTitle={cristalSuccess.title}
            onClose={() =>
                setCristalSuccess({ open: false, title: "" })
            }
        />
        {/* v1.12 — Muro de pago de Cristales (no se puede canjear).
            Web siempre web → isNative=false: no-miembros ven Sintonía
            vía PlanSelector + la compra suelta de 333 MXN por Stripe. */}
        <CodiceCristalGate
            open={codiceGate.open}
            onClose={() => setCodiceGate({ open: false, book: null })}
            bookTitle={codiceGate.book?.title || "este Códice"}
            isMember={isMember}
            isNative={false}
            onSubscribe={() => setCodicePaywallOpen(true)}
            digitalStripeHref={
                codiceGate.book
                    ? checkoutHref(
                          codiceGate.book.digitalLink,
                          null,
                          cristalIdentity
                      )
                    : ""
            }
        />
        {codicePaywallOpen && (
            <PlanSelectorModal
                onClose={() => setCodicePaywallOpen(false)}
                showBenefits
                title="Desbloquea tus Cristales"
                subtitle="Con Sintonía Solar recibes dos Cristales de Extracción cada mes: uno para un Códice y otro para una Meditación, los que tú elijas."
            />
        )}
        </CristalInterceptContext.Provider>
    )
}

CodicesMobile.displayName = "RSV_Co_Mobile"

export default CodicesMobile
