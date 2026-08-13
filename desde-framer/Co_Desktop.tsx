// Red Solar Viva — Co_Desktop.tsx v1.8 — UN PAGO = EL CÓDICE COMPLETO (decisión de Zak 2026-08-01): los tiles de compra dicen "El Códice completo" en vez de "PDF + Ebook" — un pago (o un Cristal) entrega todos sus formatos, incluido el audiolibro cuando exista, y los que se sumen después llegan sin costo (migración 20260801b_codice_completo + stripe-webhook v2.5). El tile de venta suelta del audiolibro no se enciende (link_audio vacío en los 11 Códices). | Red Solar Viva — Co_Desktop.tsx v1.8 — anti-flash de los tiles digital/audio: un dueño ya no parpadea "DESBLOQUEAR" antes de "ADQUIRIDO" (gates digitalPending/audioPending en BookRow + activeDigitalPending/activeAudioPending en el visor profundo; placeholder neutro "·  ·  ·" con isDisabled mientras resuelve sin cache). purchasesResolved/hasOwnedSeed de useNodeStatus se hilvanan a BookDetailedList → BookRow
// v1.7 — muro de pago de Cristales en Códices: tocar "DESBLOQUEAR / PDF + Ebook" sin Cristal de Códice ya NO navega a Stripe — abre CodiceCristalGate (tryRedeemCodiceDesktop retorna true SIEMPRE → la pastilla cancela su navegación). Desktop siempre web (isNative=false) → no-miembros ven "Activar Sintonía Solar" (→ PlanSelector) + compra suelta 333 MXN; miembros sin cristales ven copy "próxima luna" + 333 MXN. (Los HoloCapsuleButton del visor profundo ~L3789/L3894 sin onIntercept quedan como pendiente conocido — no tocados.) Códices a precio completo (33% miembro eliminado)
// v1.5 (2026-05-21) — Coreografía de extracción del cristal igual
// a la del [LENTE]: cuando el Tripulante confirma el canje, el
// `ConfirmarCristalModal` cierra inmediato y arranca el
// `DCristalRitualOverlay` (anillos concéntricos + 12 partículas
// radiales + orb central + glyph ✦ + texto "Códice Anclado",
// 1.6s, portaled con zIndex max y pointerEvents:none). Después
// aparece el `DCristalSuccessModal` con el nombre del Códice,
// CTA "Abrir Mi Núcleo" (rutea contextual via
// goNucleoCodicesDesktop) y autocierre en 4.5s o por click.
// Mismo lenguaje visual que el mobile para que el ritual sea
// coherente cross-device. Dimensiones ligeramente más amplias
// (orb 240px, anillos 260px, partículas dist 340) por el aire
// extra del [CENTRO DE MANDO].
// v1.4 (2026-05-20) — Helper de módulo `goNucleoCodicesDesktop` que
// rutea contextual: desde `/codices` (modo Madre) → `/nucleo#codices`;
// desde `/escaner/*` preserva el modo Escáner. Reemplaza los 4 lugares
// que hardcodeaban `/escaner/nucleo#codices` (BookRow.goNucleo + 3
// HoloCapsuleButton del visor profundo). Consistencia con la regla
// "no enlaces a /escaner/* desde fuera de /escaner/*".
// v1.3 — Indicador del Cristal arriba a la izquierda crece a tamaño
// "lg" (svg 28px, font 16, padding más generoso). Antes se veía
// chico contra la dimensión del visor desktop. Mobile sigue tamaño
// "sm" default.
// v1.2 — Indicador de Cristales visible TAMBIÉN para Tripulantes
// Explorer (sin Sintonía / sin Inmersión). Antes el indicador se
// ocultaba cuando `cristalTierD.tier === "explorer"`; ahora se monta
// siempre con count 0. Picarlo abre `CristalesInfoModal` que explica
// qué son los Cristales y cómo se obtienen — gancho de conversión
// para que el invitado vea el privilegio antes de suscribirse.
// v1.1 — El descuento miembro (333 → 222 MXN, etiqueta TRIPULANTE ✦)
// se restringe a Inmersión Solar. Sintonía Solar deja de ver el
// precio rebajado y los chips dorados de "TRIPULANTE ✦" en los
// HoloActionTile / HoloCapsuleButton — ese diferencial es parte del
// salto $777 → $1,999. isMember pasa de derivarse de useNodeStatus
// (cualquier suscripción activa) a depender de cristalTierD.tier ===
// "inmersion". El promoCode tampoco viaja al checkout cuando viene
// de Sintonía, evitando que el Stripe Payment Link aplique un
// descuento que no le toca.
// v1.0 — Ecosistema escritorio completo del catálogo de Códices
// migrado desde Codices.tsx. Componente principal CodicesDesktop +
// el objeto S de styles + sub-components específicos del escritorio
// (PriceLabel, FloatingButtons, ExplorarCodiceBtn, BookRow,
// BookDetailedList, StickySideNav, StickySideNavItem,
// ConsoleAuthorToggle, SunMark/DropMark). Los 10 componentes hero
// (HoloEyeIcon, FragmentOpenFlare, DFichaTecnica, HoloBookCard,
// InfiniteMarquee, HoloActionTile, HoloCapsuleButton, TrailerModal,
// DFaqModal, CoverWithHoverOverlay) se importan desde
// Co_DesktopHolo.tsx — no se duplican aquí.
//
// Default export: CodicesDesktop (componente real, no ghost). Cumple
// el contrato del componentLoader de Framer porque CodicesDesktop YA
// es un React component renderable con body JSX.
//
// Consumidores: Codices.tsx (shell, decide mobile vs desktop según
// useViewportLocal + forceIsMobile prop).

import * as React from "react"
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useLayoutEffect,
} from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

import CoShared from "./Co_Shared.tsx"
import CoIcons from "./Co_Icons.tsx"
import CoDesktopHolo from "./Co_DesktopHolo.tsx"
import Cristales from "./Cristales.tsx"
import PlanSelectorModal from "./PlanSelector.tsx"

const {
    hexToRgba,
    makeFallbackDataUrl,
    normalizeMultiline,
    withAccentVar,
    alphaMix,
    readAccentFromCSS,
    readAccentNearest,
    playHoloHover,
    useClerkIdentity,
    checkoutHref,
    useNodeStatus,
    CristalInterceptContext,
} = CoShared

const {
    IconEye,
    IconTablet,
    IconHeadphones,
    IconBox,
    IconNucleo,
    IconSmTablet,
    IconSmHeadphones,
    IconSmBox,
    IconSmEye,
    IconSmPlay,
    IconSmNucleo,
    SideNavSunIcon,
    SideNavDropIcon,
} = CoIcons

const {
    FragmentOpenFlare,
    DFichaTecnica,
    HoloBookCard,
    InfiniteMarquee,
    HoloActionTile,
    HoloCapsuleButton,
    TrailerModal,
    DFaqModal,
    CoverWithHoverOverlay,
} = CoDesktopHolo

const {
    useCristales,
    useMembershipTier,
    CristalesIndicator,
    ConfirmarCristalModal,
    CodiceCristalGate,
    redeemCodiceWithCristal,
} = Cristales

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  S — Desktop Styles                                              ║
   ╚══════════════════════════════════════════════════════════════════╝ */

/* v1.5 (2026-05-20) — Helper canónico para "ir a Mis Códices" desde
   cualquier card del [CENTRO DE MANDO] de Códices. Rutea contextual:
   si el Tripulante está bajo `/escaner/*` mantiene modo Escáner; en
   `/codices` (modo Madre) navega al Núcleo Madre. Reutilizado por
   BookRow.goNucleo + los 3 HoloCapsuleButton del visor profundo. */
const goNucleoCodicesDesktop = () => {
    const inEscaner =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/escaner")
    const target = inEscaner
        ? "/escaner/nucleo#codices"
        : "/nucleo#codices"
    if ((window as any).rsvNavigate) (window as any).rsvNavigate(target)
    else window.location.href = target
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DCristalRitualOverlay — animación tipo videojuego al canjear   ║
   ╚══════════════════════════════════════════════════════════════════╝
   v1.5 (2026-05-21) — Port directo del MCristalRitualOverlay del
   [LENTE]. Anillos concéntricos + 12 partículas radiales + orb
   central radiante + glyph cristal flotante + texto "✦ Códice
   Anclado ✦". Dura 1.6s. Portaled al body con zIndex max +
   pointerEvents:none — no bloquea la UI subyacente. Mismo lenguaje
   visual que mobile para que el ritual sea coherente cross-device. */

const DCristalRitualOverlay = () => {
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
                        width: 260,
                        height: 260,
                        borderRadius: "50%",
                        border: `2px solid ${accentSoft}`,
                        boxShadow: `0 0 30px ${accentGlow}, inset 0 0 30px ${accentGlow}`,
                    }}
                />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2
                const dist = 340
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
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: accent,
                            boxShadow: `0 0 14px ${accent}, 0 0 26px ${accentSoft}`,
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
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${accent} 28%, ${accentGold}99 60%, transparent 80%)`,
                    boxShadow: `0 0 90px ${accent}, 0 0 180px ${accentSoft}, inset 0 0 70px ${accentGlow}`,
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
                    fontSize: 76,
                    color: "#FFFFFF",
                    textShadow: `0 0 28px ${accent}, 0 0 56px ${accentSoft}`,
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
                    fontSize: 15,
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
                    fontSize: 11,
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
   ║  DCristalSuccessModal — confirmación post-animación             ║
   ╚══════════════════════════════════════════════════════════════════╝
   v1.5 (2026-05-21) — Aparece DESPUÉS del DCristalRitualOverlay.
   Mismo lenguaje visual del MCristalSuccessModal pero un punto más
   amplio (maxWidth 480, padding generoso) porque tiene aire de
   pantalla. CTA "Abrir Mi Núcleo" rutea via goNucleoCodicesDesktop
   (respeta contexto Madre vs Escáner). */

const DCristalSuccessModal = ({
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
                        padding: 32,
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
                            maxWidth: 480,
                            background:
                                "linear-gradient(165deg, rgba(8,15,30,0.95) 0%, rgba(2,8,18,0.97) 100%)",
                            border: `1px solid ${accentSoft}55`,
                            borderRadius: 24,
                            padding: "40px 36px 32px",
                            boxShadow: `0 32px 100px rgba(0,0,0,0.6), inset 0 0 70px ${accent}22`,
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
                                fontSize: 52,
                                color: "#FFFFFF",
                                textShadow: `0 0 28px ${accent}, 0 0 56px ${accentSoft}`,
                                fontWeight: 200,
                                lineHeight: 1,
                                marginBottom: 22,
                                position: "relative",
                            }}
                        >
                            ✦
                        </motion.div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                letterSpacing: "0.32em",
                                textTransform: "uppercase",
                                marginRight: "-0.32em",
                                color: accent,
                                textShadow: `0 0 16px ${accent}, 0 0 32px ${accentSoft}`,
                                position: "relative",
                            }}
                        >
                            ✦ Códice Anclado ✦
                        </p>
                        <p
                            style={{
                                margin: "20px 0 0",
                                fontSize: 18,
                                fontWeight: 500,
                                color: "#fff",
                                lineHeight: 1.4,
                                position: "relative",
                            }}
                        >
                            {bookTitle}
                        </p>
                        <p
                            style={{
                                margin: "12px 0 28px",
                                fontSize: 13,
                                color: "rgba(255,255,255,0.55)",
                                letterSpacing: "0.06em",
                                lineHeight: 1.5,
                                position: "relative",
                            }}
                        >
                            Disponible en Mi Núcleo
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                onClose()
                                goNucleoCodicesDesktop()
                            }}
                            style={{
                                width: "100%",
                                padding: "16px 24px",
                                borderRadius: 14,
                                border: `1px solid ${accent}80`,
                                background: `linear-gradient(135deg, ${accent}33, ${accent}10)`,
                                color: "#fff",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                outline: "none",
                                boxShadow: `0 0 20px ${accent}33, inset 0 0 12px ${accent}22`,
                                position: "relative",
                            }}
                        >
                            Abrir Mi Núcleo
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                marginTop: 14,
                                width: "100%",
                                padding: "10px",
                                background: "transparent",
                                border: "none",
                                color: "rgba(255,255,255,0.45)",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 12,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                position: "relative",
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

const S: any = {
    pageHeaderWrap: {
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 2,
        marginTop: "4vh",
    },
    pageTitleImageWrapper: (h: number) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        height: `${h}px`,
        minHeight: `${h}px`,
        maxHeight: `${h}px`,
    }),
    pageTitleImageEl: {
        maxWidth: "90vw",
        maxHeight: "100%",
        objectFit: "contain",
        filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--accent, #00C2FF) 60%, transparent)) drop-shadow(0 0 18px color-mix(in oklab, var(--accent, #00C2FF) 30%, transparent))",
    },
    pageTitleFallback: (accent: string, heightPx: number, xOff: number) => ({
        fontFamily: "'Inter',sans-serif",
        fontSize: `${heightPx}px`,
        fontWeight: 100,
        textTransform: "uppercase",
        letterSpacing: "0.4em",
        marginRight: "-0.4em",
        transform: `translateX(${xOff}px)`,
        background: `linear-gradient(180deg, ${accent}, #fff)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: `drop-shadow(0 0 12px ${hexToRgba(accent, 0.25)})`,
        textAlign: "center",
        lineHeight: 1,
        margin: 0,
        maxWidth: "95vw",
        position: "relative",
        zIndex: 2,
        pointerEvents: "none",
        userSelect: "none",
        WebkitFontSmoothing: "antialiased",
    }),
    pageSubtitleText: (tc: string, mt: number) => ({
        color: tc,
        fontFamily: "'Inter',sans-serif",
        fontSize: "1rem",
        fontWeight: 300,
        lineHeight: 1.6,
        textAlign: "center",
        whiteSpace: "pre-line",
        opacity: 0.7,
        maxWidth: "800px",
        margin: `${mt}px auto 0 auto`,
        letterSpacing: "0.05em",
    }),
    authorSelectorContainer: (gap?: string, vhOff = 0) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: gap || "6vw",
        padding: "2vh 4vw",
        marginTop: `${vhOff}vh`,
        minHeight: "30vh",
        width: "100%",
        zIndex: 2,
        position: "relative",
    }),
    activeAuthorLayer: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 99999,
        background: "rgba(0,0,0,0.9)",
        overflowY: "auto",
        cursor: "pointer",
    },
    twoPanelWrap: (gVW = 3, vhOff = 0) => ({
        position: "relative",
        top: `${vhOff}vh`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: `${gVW}vw`,
        flexWrap: "nowrap",
        width: "100%",
        zIndex: 4,
        marginTop: "5vh",
        cursor: "default",
    }),
    previewPanel: (
        ac: string,
        wVW = 35,
        hVH = 75,
        cr = 20,
        op = 0.8,
        bl = 8
    ) => ({
        width: `${wVW}vw`,
        height: `${hVH}vh`,
        maxHeight: "120vh",
        background: `rgba(5,10,20,${op})`,
        border: `2px solid ${ac}`,
        borderRadius: `${cr}px`,
        boxShadow: `0 0 15px ${ac}77,0 0 30px ${ac}44,0 10px 20px rgba(0,0,0,.5)`,
        backdropFilter: `blur(${bl}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        gap: "16px",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
    }),
    previewImage: {
        width: "90%",
        height: "90%",
        maxHeight: "60vh",
        objectFit: "contain",
        borderRadius: "12px",
    },
    infoPanel: (ac: string, wVW = 45, hVH = 75, cr = 20, op = 0.8, bl = 8) => ({
        width: `${wVW}vw`,
        height: `${hVH}vh`,
        maxHeight: "120vh",
        background: `rgba(5,10,20,${op})`,
        border: `2px solid ${ac}`,
        borderRadius: `${cr}px`,
        boxShadow: `0 0 15px ${ac}77,0 0 30px ${ac}44,0 10px 20px rgba(0,0,0,.5)`,
        backdropFilter: `blur(${bl}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
    }),
    consoleDecoLine: (ac: string, pos: "left" | "right") =>
        ({
            position: "absolute",
            [pos]: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "2px",
            height: "80%",
            background: ac,
            borderRadius: "1px",
            boxShadow: `0 0 5px ${ac}AA`,
            opacity: 0.7,
            zIndex: 0,
        }) as any,
    consoleContent: (ac: string) => ({
        width: "90%",
        height: "90%",
        minHeight: 0,
        background: "rgba(10,25,45,0.85)",
        borderRadius: "16px",
        padding: "24px 30px",
        position: "relative",
        zIndex: 1,
        border: `1px solid ${ac}33`,
        boxShadow: "inset 0 0 12px rgba(0,0,0,.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "left",
        overflowY: "auto",
        scrollbarWidth: "none",
    }),
    pulseCarousel: (vhOff: number) => ({
        position: "relative",
        width: "100%",
        overflowX: "auto",
        padding: "20px 0",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        marginTop: `${vhOff}vh`,
        display: "flex",
        justifyContent: "center",
        zIndex: 4,
    }),
    pulseContainer: {
        display: "flex",
        gap: "15px",
        padding: "0 20px",
        position: "relative",
        justifyContent: "center",
    },
    pulseNode: (sz: number) => ({
        width: `${sz}px`,
        height: `${sz * 1.5}px`,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        outline: "none",
    }),
    pulseImage: (sz: number) => ({
        width: `${sz * 0.7}px`,
        height: `${sz * 1.05}px`,
        borderRadius: "8px",
        objectFit: "cover",
    }),
    holoBookWrap: (wVW?: number, hVH = 36) => ({
        width: wVW ? `${wVW}vw` : "min(28vw,420px)",
        minWidth: "160px",
        height: `${hVH}vh`,
        minHeight: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        perspective: "1000px",
        position: "relative",
    }),
    fichaTecnica: (ac: string) => ({
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        justifyContent: "center",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hexToRgba(ac, 0.15)}`,
        marginTop: "4px",
        marginBottom: "8px",
        width: "100%",
    }),
    fichaTecnicaItem: () => ({
        fontFamily: "'Inter',sans-serif",
        fontSize: "0.8rem",
        fontWeight: 300,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.06em",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    }),
    fichaTecnicaVal: (ac: string) => ({
        color: hexToRgba(ac, 0.7),
        fontWeight: 400,
    }),
    modalOverlay: (vhOff = 5) => ({
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: `${vhOff}vh 4vw`,
        cursor: "default",
    }),
    modalPanel: (ac: string) => ({
        width: "80vw",
        height: "85vh",
        maxWidth: "1200px",
        maxHeight: "90vh",
        background: "rgba(5,10,20,.85)",
        border: `2px solid ${ac}`,
        borderRadius: "20px",
        boxShadow: `0 0 20px ${ac}77,0 0 40px ${ac}44,0 20px 30px rgba(0,0,0,.8)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
    }),
    modalHeader: (ac: string, tc: string) => ({
        flexShrink: 0,
        padding: "12px 16px",
        borderBottom: `1px solid ${ac}55`,
        background: "rgba(0,0,0,.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: tc,
        fontSize: "0.9rem",
        lineHeight: 1.4,
    }),
    modalCloseButton: (ac: string) => ({
        width: "28px",
        height: "28px",
        minWidth: "28px",
        minHeight: "28px",
        borderRadius: "50%",
        border: `1px solid ${ac}`,
        background: "transparent",
        color: ac,
        fontSize: "16px",
        lineHeight: "16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 8px ${ac}66`,
    }),
    modalBody: {
        flexGrow: 1,
        position: "relative",
        background: "#000",
        color: "#fff",
        fontSize: "0.9rem",
        lineHeight: 1.5,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "0",
        overflow: "hidden",
    },
    modalPdfWrap: {
        flexGrow: 1,
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
    },
    modalPdfFrame: {
        width: "100%",
        height: "100%",
        border: "none",
        background: "#000",
    },
    modalFallbackText: (ac: string) => ({
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: ac,
        fontSize: "0.95rem",
        lineHeight: 1.4,
        textAlign: "center",
        whiteSpace: "pre-wrap",
    }),
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  PriceLabel — par tachado / con descuento miembro               ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const PriceLabel = ({
    original,
    discounted,
    color = "#FFB800",
}: {
    original: string
    discounted: string
    color?: string
}) => (
    <span
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1px",
            lineHeight: 1.1,
        }}
    >
        <span
            style={{
                textDecoration: "line-through",
                opacity: 0.45,
                fontSize: ".7rem",
                fontWeight: 300,
            }}
        >
            {original}
        </span>
        <span style={{ color, fontWeight: 600, fontSize: ".85rem" }}>
            {discounted}
        </span>
    </span>
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  FloatingButtons — botón FAQ + scroll-to-top                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const FloatingButtons = ({
    onFaqClick,
    onScrollTop,
    showFaq,
    showScrollTop,
    accent,
}: {
    onFaqClick: () => void
    onScrollTop: () => void
    showFaq: boolean
    showScrollTop: boolean
    accent: string
}) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [hasEverShown, setHasEverShown] = useState(false)
    const show = showFaq || showScrollTop
    useEffect(() => {
        if (show && !hasEverShown) setHasEverShown(true)
    }, [show])
    const FloatBtn = ({
        onClick,
        children,
        label,
    }: {
        onClick: () => void
        children: React.ReactNode
        label: string
    }) => {
        const [hovered, setHovered] = useState(false)
        return (
            <button
                className="float-btn"
                onClick={onClick}
                onMouseEnter={() => {
                    setHovered(true)
                    playHoloHover()
                }}
                onMouseLeave={() => setHovered(false)}
                style={
                    {
                        ["--fb-border" as any]: A(0.18),
                        ["--fb-border-h" as any]: A(0.5),
                        ["--fb-bl" as any]: A(0.35),
                        ["--fb-bl-h" as any]: accent,
                        ["--fb-bg" as any]: `linear-gradient(135deg, rgba(8,12,20,0.85), rgba(15,20,30,0.7))`,
                        ["--fb-bg-h" as any]: `linear-gradient(135deg, ${A(0.18)}, ${A(0.06)})`,
                        ["--fb-shadow" as any]: `-4px 0 14px rgba(0,0,0,0.4)`,
                        ["--fb-shadow-h" as any]: `0 0 24px ${A(0.3)}, -6px 0 20px rgba(0,0,0,0.4), inset 0 0 10px ${A(0.06)}`,
                        ["--fb-color" as any]: accent,
                        ["--fb-color-h" as any]: "#fff",
                        gap: hovered ? 10 : 0,
                        padding: hovered ? "0 14px 0 18px" : "0 14px",
                    } as React.CSSProperties
                }
            >
                {hovered && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: "-200%" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, transparent, ${A(0.12)}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <span
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {children}
                </span>
                {hovered && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        {label}
                    </motion.span>
                )}
            </button>
        )
    }
    if (!hasEverShown) return null
    return (
        <div
            style={{
                position: "fixed",
                bottom: 30,
                right: 0,
                zIndex: 99998,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
                opacity: show ? 1 : 0,
                transform: show ? "translateX(0)" : "translateX(50px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: show ? "auto" : "none",
            }}
        >
            {showFaq && (
                <FloatBtn onClick={onFaqClick} label="FAQ">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </FloatBtn>
            )}
            {showScrollTop && (
                <FloatBtn onClick={onScrollTop} label="Inicio">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </FloatBtn>
            )}
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  ExplorarCodiceBtn — botón "Explorar Códice" hexágono           ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const ExplorarCodiceBtn = ({
    accentColor,
    onClick,
}: {
    accentColor: string
    onClick: () => void
}) => {
    const A = (x: number) => hexToRgba(accentColor, x)
    return (
        <button
            className="explorar-codice-btn"
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            style={
                {
                    ["--ec-color" as any]: accentColor,
                    ["--ec-border" as any]: A(0.35),
                    ["--ec-border-hover" as any]: A(0.7),
                    ["--ec-bg" as any]: `linear-gradient(145deg, ${A(0.06)}, ${A(0.02)})`,
                    ["--ec-bg-hover" as any]: `linear-gradient(145deg, ${A(0.14)}, ${A(0.06)})`,
                    ["--ec-shadow" as any]: `0 0 12px ${A(0.1)}, inset 0 0 8px ${A(0.04)}`,
                    ["--ec-shadow-hover" as any]: `0 0 20px ${A(0.3)}, 0 0 40px ${A(0.15)}, inset 0 0 12px ${A(0.08)}`,
                } as React.CSSProperties
            }
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect
                    x="12"
                    y="1.5"
                    width="14.85"
                    height="14.85"
                    rx="2"
                    transform="rotate(45 12 1.5)"
                />
                <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span>Explorar Códice</span>
        </button>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  BookRow — fila libro + tiles desktop                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const BookRow = ({
    book,
    accentColor,
    textColor,
    isEven,
    onBookClick,
    registerBookRef,
    setBookHash,
    isMember,
    promoCode,
    ownedFormats,
    purchasesResolved,
    hasOwnedSeed,
    precioDigital,
    precioAudio,
    precioDigitalMiembro,
    precioAudioMiembro,
}: any) => {
    const identity = useClerkIdentity()
    const cristalIntercept = React.useContext(CristalInterceptContext)
    const [expAm, setExpAm] = useState(false)
    const bRefs = useRef<(HTMLElement | null)[]>([])
    const hasDig = !!(book.digitalLink && book.digitalLink.trim())
    const hasAud = !!(book.audiobookLink && book.audiobookLink.trim())
    const hasPhy = book.physicalLinks && book.physicalLinks.length > 0
    const availableTiles: any[] = []
    if (hasDig) availableTiles.push("digital")
    if (hasAud) availableTiles.push("audio")
    if (hasPhy) availableTiles.push("physical")
    const bookFormats = ownedFormats?.get(book.title) || []
    const ownsDigital = bookFormats.some(
        (f: string) => f === "pdf" || f === "epub"
    )
    const ownsAudio = bookFormats.some(
        (f: string) => f === "audiobook" || f === "audio"
    )
    const ownsAllDigital = ownsDigital && ownsAudio
    /* Anti-flash: un dueño nunca parpadea "DESBLOQUEAR" antes de "ADQUIRIDO".
       Si el fetch de compras aún no resolvió Y no había cache de posesión
       para este usuario, el tile queda en placeholder neutro (isDisabled). */
    const pending = !purchasesResolved && !hasOwnedSeed
    const digitalPending = !ownsDigital && pending
    const audioPending = !ownsAudio && pending
    useEffect(() => {
        bRefs.current = []
    }, [expAm])
    const hkd = (e: React.KeyboardEvent, i: number) => {
        const enabled = bRefs.current
            .map((el, idx) => ({ el, idx }))
            .filter(
                (x) => x.el && !x.el.classList.contains("holo-tile-disabled")
            )
        if (!enabled.length) return
        const ci = enabled.findIndex((x) => x.idx === i)
        if (e.key === "ArrowRight") {
            e.preventDefault()
            e.stopPropagation()
            const ni = ci === -1 ? 0 : (ci + 1) % enabled.length
            enabled[ni]?.el?.focus()
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            e.stopPropagation()
            const ni =
                ci === -1
                    ? enabled.length - 1
                    : (ci - 1 + enabled.length) % enabled.length
            enabled[ni]?.el?.focus()
        } else if (e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            bRefs.current[i]?.click()
        } else if (e.key === "Escape") {
            e.preventDefault()
            if (expAm) setExpAm(false)
            else (e.target as HTMLElement).blur()
        }
    }
    const rb = (el: HTMLElement | null, i: number) => {
        bRefs.current[i] = el
    }
    /* v1.5 (2026-05-20) — Rutea según contexto via helper canónico
       `goNucleoCodicesDesktop` (definido a nivel módulo). */
    const goNucleo = () => {
        setBookHash?.(book.id, "scroll")
        goNucleoCodicesDesktop()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8 }}
            style={{
                display: "flex",
                flexDirection: isEven ? "row" : "row-reverse",
                alignItems: "center",
                justifyContent: "center",
                gap: "6vw",
                flexWrap: "wrap",
            }}
            ref={(el: any) => {
                if (el) registerBookRef(book.id, el)
            }}
        >
            <div
                style={{
                    flex: "0 0 400px",
                    maxWidth: "100%",
                    position: "relative",
                    perspective: "1000px",
                }}
            >
                <CoverWithHoverOverlay
                    src={
                        book.coverUrl ||
                        makeFallbackDataUrl(book.title, book.colorHex)
                    }
                    alt={book.title}
                    accentColor={accentColor}
                    onClick={() => onBookClick(book)}
                />
            </div>
            <div
                style={{
                    flex: "1 1 400px",
                    minWidth: "400px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isEven ? "flex-start" : "flex-end",
                    textAlign: isEven ? "left" : "right",
                    gap: "20px",
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "2.5rem",
                        fontWeight: 200,
                        color: accentColor,
                        margin: 0,
                        textShadow: `0 0 20px ${hexToRgba(accentColor, 0.4)}`,
                        cursor: "pointer",
                    }}
                    onClick={() => onBookClick(book)}
                >
                    {book.title}
                </h2>
                <div
                    style={{
                        width: "60px",
                        height: "2px",
                        background: accentColor,
                        opacity: 0.5,
                    }}
                />
                <p
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "1rem",
                        lineHeight: 1.7,
                        color: textColor,
                        opacity: 0.85,
                        whiteSpace: "pre-line",
                    }}
                >
                    {book.shortSynopsis || book.synopsis}
                </p>
                <ExplorarCodiceBtn
                    accentColor={accentColor}
                    onClick={() => onBookClick(book)}
                />
                {ownsAllDigital ? (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: "22px",
                            marginTop: "4px",
                            justifyContent: isEven ? "flex-start" : "flex-end",
                            width: "100%",
                            minHeight: "168px",
                            alignItems: "center",
                        }}
                    >
                        <HoloActionTile
                            icon={IconNucleo}
                            label="ADQUIRIDO"
                            subLabel="Abrir en Mi Núcleo"
                            onClick={goNucleo}
                            accentColor="#FFB800"
                            colorOverride="#FFB800"
                            textColor={textColor}
                        />
                        {hasPhy && (
                            <HoloActionTile
                                ref={(el: any) => rb(el, 2)}
                                onKeyDown={(e: any) => hkd(e, 2)}
                                icon={IconBox}
                                label="MATERIALIZAR"
                                subLabel={
                                    <>
                                        Edición Física
                                        <br />
                                        <span
                                            style={{
                                                fontSize: ".55rem",
                                                opacity: 0.35,
                                                fontStyle: "italic",
                                                fontWeight: 300,
                                            }}
                                        >
                                            *Distribuido vía Amazon*
                                        </span>
                                    </>
                                }
                                onClick={() => setExpAm(true)}
                                accentColor={accentColor}
                                textColor={textColor}
                            />
                        )}
                    </div>
                ) : (
                    availableTiles.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: "22px",
                                marginTop: "4px",
                                justifyContent: isEven
                                    ? "flex-start"
                                    : "flex-end",
                                width: "100%",
                                minHeight: "168px",
                                alignItems: "center",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {!expAm ? (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: "flex",
                                            gap: "22px",
                                            flexWrap: "nowrap",
                                        }}
                                    >
                                        {hasDig &&
                                            (ownsDigital ? (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 0)}
                                                    onKeyDown={(e: any) =>
                                                        hkd(e, 0)
                                                    }
                                                    icon={IconNucleo}
                                                    label="ADQUIRIDO"
                                                    subLabel={
                                                        <>
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        ".65rem",
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                El Códice completo
                                                            </span>
                                                        </>
                                                    }
                                                    onClick={goNucleo}
                                                    accentColor="#FFB800"
                                                    colorOverride="#FFB800"
                                                    textColor={textColor}
                                                />
                                            ) : digitalPending ? (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 0)}
                                                    icon={IconTablet}
                                                    label="·  ·  ·"
                                                    subLabel={
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    ".65rem",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            El Códice completo
                                                        </span>
                                                    }
                                                    isDisabled
                                                    accentColor={
                                                        book.colorHex ||
                                                        accentColor
                                                    }
                                                    textColor={textColor}
                                                />
                                            ) : (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 0)}
                                                    onKeyDown={(e: any) =>
                                                        hkd(e, 0)
                                                    }
                                                    icon={IconTablet}
                                                    badge={
                                                        isMember
                                                            ? "TRIPULANTE ✦"
                                                            : undefined
                                                    }
                                                    label="DESBLOQUEAR"
                                                    subLabel={
                                                        isMember ? (
                                                            <PriceLabel
                                                                original={
                                                                    precioDigital ||
                                                                    "333 MXN"
                                                                }
                                                                discounted={
                                                                    precioDigitalMiembro ||
                                                                    "222 MXN"
                                                                }
                                                            />
                                                        ) : (
                                                            <>
                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "block",
                                                                        marginBottom:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    El Códice completo
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            ".75rem",
                                                                        opacity: 0.7,
                                                                    }}
                                                                >
                                                                    (
                                                                    {precioDigital ||
                                                                        "333 MXN"}
                                                                    )
                                                                </span>
                                                            </>
                                                        )
                                                    }
                                                    href={checkoutHref(
                                                        book.digitalLink,
                                                        isMember
                                                            ? promoCode
                                                            : null,
                                                        identity
                                                    )}
                                                    sameTab
                                                    onIntercept={() =>
                                                        cristalIntercept(
                                                            book,
                                                            ["pdf", "epub"]
                                                        )
                                                    }
                                                    onBeforeNavigate={() =>
                                                        setBookHash?.(
                                                            book.id,
                                                            "scroll"
                                                        )
                                                    }
                                                    accentColor={
                                                        book.colorHex ||
                                                        accentColor
                                                    }
                                                    textColor={textColor}
                                                />
                                            ))}
                                        {hasAud &&
                                            (ownsAudio ? (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 1)}
                                                    onKeyDown={(e: any) =>
                                                        hkd(e, 1)
                                                    }
                                                    icon={IconNucleo}
                                                    label="ADQUIRIDO"
                                                    subLabel={
                                                        <>
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        ".65rem",
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                Audiolibro
                                                            </span>
                                                        </>
                                                    }
                                                    onClick={goNucleo}
                                                    accentColor="#FFB800"
                                                    colorOverride="#FFB800"
                                                    textColor={textColor}
                                                />
                                            ) : audioPending ? (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 1)}
                                                    icon={IconHeadphones}
                                                    label="·  ·  ·"
                                                    subLabel={
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    ".65rem",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            Audiolibro
                                                        </span>
                                                    }
                                                    isDisabled
                                                    accentColor={accentColor}
                                                    textColor={textColor}
                                                />
                                            ) : (
                                                <HoloActionTile
                                                    ref={(el: any) => rb(el, 1)}
                                                    onKeyDown={(e: any) =>
                                                        hkd(e, 1)
                                                    }
                                                    icon={IconHeadphones}
                                                    badge={
                                                        isMember
                                                            ? "TRIPULANTE ✦"
                                                            : undefined
                                                    }
                                                    label="DESBLOQUEAR"
                                                    subLabel={
                                                        isMember ? (
                                                            <PriceLabel
                                                                original={
                                                                    precioAudio ||
                                                                    "333 MXN"
                                                                }
                                                                discounted={
                                                                    precioAudioMiembro ||
                                                                    "222 MXN"
                                                                }
                                                            />
                                                        ) : (
                                                            <>
                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "block",
                                                                        marginBottom:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    Audiolibro
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            ".75rem",
                                                                        opacity: 0.7,
                                                                    }}
                                                                >
                                                                    (
                                                                    {precioAudio ||
                                                                        "333 MXN"}
                                                                    )
                                                                </span>
                                                            </>
                                                        )
                                                    }
                                                    href={checkoutHref(
                                                        book.audiobookLink,
                                                        isMember
                                                            ? promoCode
                                                            : null,
                                                        identity
                                                    )}
                                                    sameTab
                                                    onBeforeNavigate={() =>
                                                        setBookHash?.(
                                                            book.id,
                                                            "scroll"
                                                        )
                                                    }
                                                    accentColor={
                                                        book.colorHex ||
                                                        accentColor
                                                    }
                                                    textColor={textColor}
                                                />
                                            ))}
                                        {hasPhy && (
                                            <HoloActionTile
                                                ref={(el: any) => rb(el, 2)}
                                                onKeyDown={(e: any) =>
                                                    hkd(e, 2)
                                                }
                                                icon={IconBox}
                                                label="MATERIALIZAR"
                                                subLabel={
                                                    <>
                                                        Edición Física
                                                        <br />
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    ".55rem",
                                                                opacity: 0.35,
                                                                fontStyle:
                                                                    "italic",
                                                                fontWeight: 300,
                                                            }}
                                                        >
                                                            *Distribuido vía
                                                            Amazon*
                                                        </span>
                                                    </>
                                                }
                                                onClick={() => setExpAm(true)}
                                                accentColor={accentColor}
                                                textColor={textColor}
                                            />
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="amazon"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: "flex",
                                            gap: "18px",
                                            flexWrap: "nowrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        {book.physicalLinks.map(
                                            (l: any, idx: number) => (
                                                <HoloActionTile
                                                    key={idx}
                                                    ref={(el: any) =>
                                                        rb(el, idx)
                                                    }
                                                    onKeyDown={(e: any) =>
                                                        hkd(e, idx)
                                                    }
                                                    icon={IconBox}
                                                    label="Amazon"
                                                    subLabel={l.label.replace(
                                                        "Amazon ",
                                                        ""
                                                    )}
                                                    href={l.href}
                                                    accentColor={accentColor}
                                                    textColor={textColor}
                                                />
                                            )
                                        )}
                                        <motion.button
                                            onClick={() => setExpAm(false)}
                                            style={{
                                                background: "transparent",
                                                border: `1px solid ${accentColor}55`,
                                                borderRadius: "50%",
                                                width: "40px",
                                                height: "40px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: accentColor,
                                                cursor: "pointer",
                                                flexShrink: 0,
                                            }}
                                            whileHover={{
                                                scale: 1.1,
                                                background: `${accentColor}22`,
                                            }}
                                        >
                                            &times;
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                )}
            </div>
        </motion.div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  BookDetailedList — alterna BookRow para todos los libros       ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const BookDetailedList = ({
    books,
    accentColor,
    textColor,
    onBookClick,
    registerBookRef,
    zakSectionRef,
    aquaSectionRef,
    setBookHash,
    isMember,
    promoCode,
    ownedFormats,
    purchasesResolved,
    hasOwnedSeed,
    precioDigital,
    precioAudio,
    precioDigitalMiembro,
    precioAudioMiembro,
}: any) => {
    const sorted = useMemo(() => {
        const z = books.filter((b: any) => b.author.includes("Zak"))
        const a = books.filter((b: any) => !b.author.includes("Zak"))
        return [...z, ...a]
    }, [books])
    const zakIdx = sorted.findIndex((b: any) => b.author.includes("Zak"))
    const aquaIdx = sorted.findIndex((b: any) => !b.author.includes("Zak"))
    return (
        <div
            style={{
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "5vh 5vw 15vh 5vw",
                display: "flex",
                flexDirection: "column",
                gap: "20vh",
            }}
        >
            {sorted.map((b: any, i: number) => {
                const refProp: any = {}
                if (i === zakIdx) refProp.ref = zakSectionRef
                if (i === aquaIdx) refProp.ref = aquaSectionRef
                return (
                    <div key={b.id} {...refProp}>
                        <BookRow
                            book={b}
                            accentColor={accentColor}
                            textColor={textColor}
                            isEven={i % 2 === 0}
                            onBookClick={onBookClick}
                            registerBookRef={registerBookRef}
                            setBookHash={setBookHash}
                            isMember={isMember}
                            promoCode={promoCode}
                            ownedFormats={ownedFormats}
                            purchasesResolved={purchasesResolved}
                            hasOwnedSeed={hasOwnedSeed}
                            precioDigital={precioDigital}
                            precioAudio={precioAudio}
                            precioDigitalMiembro={precioDigitalMiembro}
                            precioAudioMiembro={precioAudioMiembro}
                        />
                    </div>
                )
            })}
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  StickySideNavItem — item del sidenav left edge                 ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const StickySideNavItem = ({
    onClick,
    label,
    sublabel,
    iconContent,
    isActive,
    accent,
}: {
    onClick: () => void
    label: string
    sublabel: string
    iconContent: React.ReactNode
    isActive?: boolean
    accent: string
}) => {
    const A = (x: number) => hexToRgba(accent, x)
    const [hovered, setHovered] = useState(false)
    const lit = isActive === true
    return (
        <div
            className="sidenav-item"
            onMouseEnter={() => {
                setHovered(true)
                playHoloHover()
            }}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={
                {
                    ["--sn-accent" as any]: accent,
                    ["--sn-bg" as any]: lit
                        ? `linear-gradient(135deg, ${A(0.18)}, ${A(0.06)})`
                        : `linear-gradient(135deg, rgba(8,12,20,0.85), rgba(15,20,30,0.7))`,
                    ["--sn-bg-h" as any]: `linear-gradient(135deg, ${A(0.16)}, ${A(0.06)})`,
                    ["--sn-border" as any]: lit ? A(0.5) : A(0.18),
                    ["--sn-border-h" as any]: A(0.45),
                    ["--sn-bl" as any]: lit ? accent : A(0.35),
                    ["--sn-bl-h" as any]: A(0.7),
                    ["--sn-shadow" as any]: lit
                        ? `0 0 18px ${A(0.2)}, 6px 0 16px rgba(0,0,0,0.3)`
                        : `4px 0 16px rgba(0,0,0,0.4)`,
                    ["--sn-shadow-h" as any]: `0 0 28px ${A(0.45)}, 8px 0 24px rgba(0,0,0,0.4), inset 0 0 12px ${A(0.12)}, 0 0 48px ${A(0.2)}`,
                    ["--sn-icon-bg" as any]: `linear-gradient(145deg, ${A(0.12)}, ${A(0.04)})`,
                    ["--sn-icon-border" as any]: lit ? A(0.5) : A(0.2),
                    ["--sn-icon-border-h" as any]: A(0.5),
                    ["--sn-icon-shadow" as any]: lit
                        ? `0 0 16px ${A(0.3)}, inset 0 0 8px ${A(0.1)}`
                        : `0 0 6px ${A(0.1)}`,
                    ["--sn-icon-shadow-h" as any]: `0 0 20px ${A(0.5)}, 0 0 40px ${A(0.25)}, inset 0 0 10px ${A(0.15)}`,
                    ["--sn-text-glow" as any]: `0 0 10px ${A(0.4)}`,
                    ["--sn-sub-color" as any]: lit ? accent : A(0.7),
                } as React.CSSProperties
            }
        >
            {hovered && (
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(90deg, transparent, ${A(0.15)}, transparent)`,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}
            <div className="sn-icon-box">
                {iconContent}
                {hovered && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            inset: -4,
                            borderRadius: 16,
                            border: `1px solid ${A(0.5)}`,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <span
                    className="sn-label"
                    style={
                        lit
                            ? {
                                  color: "#fff",
                                  textShadow: `0 0 10px ${A(0.4)}`,
                              }
                            : undefined
                    }
                >
                    {label}
                </span>
                <span className="sn-sub">{sublabel}</span>
            </div>
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  StickySideNav — wrapper de los 2 items (Zak + Aqua)            ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const StickySideNav = ({
    show,
    onGoZak,
    onGoAqua,
    accent,
    activeSection,
}: {
    show: boolean
    onGoZak: () => void
    onGoAqua: () => void
    accent: string
    activeSection: "zak" | "aqua" | null
}) => {
    const [hasEverShown, setHasEverShown] = useState(false)
    useEffect(() => {
        if (show && !hasEverShown) setHasEverShown(true)
    }, [show])
    if (!hasEverShown) return null
    return (
        <div
            style={{
                position: "fixed",
                left: 0,
                top: "50%",
                transform: show
                    ? "translateY(-50%) translateX(0)"
                    : "translateY(-50%) translateX(-80px)",
                zIndex: 90,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                opacity: show ? 1 : 0,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: show ? "auto" : "none",
            }}
        >
            <StickySideNavItem
                onClick={onGoZak}
                label="Zak'Haar"
                sublabel="Códices"
                isActive={activeSection === "zak"}
                accent={accent}
                iconContent={<SideNavSunIcon color={accent} />}
            />
            <StickySideNavItem
                onClick={onGoAqua}
                label="Aqua'Riia"
                sublabel="Códices"
                isActive={activeSection === "aqua"}
                accent={accent}
                iconContent={<SideNavDropIcon color={accent} />}
            />
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  ConsoleAuthorToggle — switch Zak↔Aqua dentro de la consola     ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const ConsoleAuthorToggle = ({
    activeAuthorInConsole,
    accent,
    onSwitchAuthor,
    visible,
}: {
    activeAuthorInConsole: "zak" | "aqua"
    accent: string
    onSwitchAuthor: (author: "zak" | "aqua") => void
    visible: boolean
}) => {
    const A = (x: number) => hexToRgba(accent, x)
    const ToggleBtn = ({
        author,
        icon,
    }: {
        author: "zak" | "aqua"
        icon: React.ReactNode
    }) => {
        const isActive = activeAuthorInConsole === author
        const [hovered, setHovered] = useState(false)
        return (
            <button
                className="console-toggle-btn"
                onClick={(e) => {
                    e.stopPropagation()
                    onSwitchAuthor(author)
                }}
                onMouseEnter={() => {
                    setHovered(true)
                    if (!isActive) playHoloHover()
                }}
                onMouseLeave={() => setHovered(false)}
                style={
                    {
                        ["--ct-border" as any]: isActive ? A(0.6) : A(0.2),
                        ["--ct-border-h" as any]: A(0.5),
                        ["--ct-bl" as any]: isActive ? accent : A(0.35),
                        ["--ct-bl-h" as any]: A(0.7),
                        ["--ct-bg" as any]: isActive
                            ? `linear-gradient(145deg, ${A(0.2)}, ${A(0.08)})`
                            : `linear-gradient(145deg, rgba(8,12,20,0.9), rgba(15,20,30,0.75))`,
                        ["--ct-bg-h" as any]: `linear-gradient(145deg, ${A(0.16)}, ${A(0.06)})`,
                        ["--ct-shadow" as any]: isActive
                            ? `0 0 20px ${A(0.4)}, 0 0 40px ${A(0.15)}, inset 0 0 10px ${A(0.1)}`
                            : `0 2px 8px rgba(0,0,0,0.3)`,
                        ["--ct-shadow-h" as any]: `0 0 20px ${A(0.45)}, 0 0 40px ${A(0.2)}, inset 0 0 10px ${A(0.12)}`,
                        ["--ct-color" as any]: accent,
                    } as React.CSSProperties
                }
            >
                {hovered && !isActive && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, transparent, ${A(0.15)}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                {isActive && (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            inset: -3,
                            borderRadius: "0 19px 19px 0",
                            border: `1px solid ${A(0.4)}`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        filter: isActive
                            ? `drop-shadow(0 0 6px ${accent})`
                            : "none",
                    }}
                >
                    {icon}
                </div>
            </button>
        )
    }
    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                position: "fixed",
                left: 0,
                top: "50%",
                transform: visible
                    ? "translateY(-50%) translateX(0)"
                    : "translateY(-50%) translateX(-80px)",
                zIndex: 100000,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                opacity: visible ? 1 : 0,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: visible ? "auto" : "none",
            }}
        >
            <ToggleBtn author="zak" icon={<SideNavSunIcon color={accent} />} />
            <ToggleBtn
                author="aqua"
                icon={<SideNavDropIcon color={accent} />}
            />
        </div>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  CodicesDesktop — componente principal                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

function CodicesDesktop(props: any) {
    const {
        accentColor: accentProp = "#00C2FF",
        pageHeaderOffsetVH = 8,
        layoutTopOffsetVH = 0,
        bgColor = "transparent",
        textColor = "#FFFFFF",
        pageTitleImage,
        pageTitleImageHeight = 100,
        pageTitleFallback = "ARCHIVOS",
        pageTitleFallbackHeight = 72,
        pageTitleXOffsetPx = 0,
        pageTitleSubtitleGapPx = 12,
        pageSubtitle = "Explora el conocimiento estelar",
        booksList = [],
        modalOffsetVH = 7,
        screenOpacity = 0.8,
        screenBlurPx = 8,
        screenCornerRadius = 20,
        capsuleSize = 80,
        inertiaEnabled = true,
        twoPanelGapVW = 4,
        previewPanelVW = 25,
        infoPanelVW = 55,
        consoleOffsetVH = 0,
        panelHeightVH = 75,
        capsulesOffsetVH = 5,
        authorPanelGap = "8vw",
        authorOffsetVH = 4,
        authorPanelWidthVW = 16,
        authorPanelHeightVH = 36,
        hoverDelaySec = 0.2,
        authorTitleSizePx = 20,
        authorShimmerSpeedSec = 6,
        faqList = [],
        marqueeSpeed = 0.05,
        zakFeaturedTitle,
        aquaFeaturedTitle,
        supabaseUrl = "",
        supabaseAnonKey = "",
        precioDigital = "333 MXN",
        precioAudio = "333 MXN",
        precioDigitalMiembro = "222 MXN",
        precioAudioMiembro = "222 MXN",
    } = props

    const identity = useClerkIdentity()

    const cristalesD = useCristales(
        identity.clerkId,
        supabaseUrl,
        supabaseAnonKey
    )
    const cristalTierD = useMembershipTier(
        identity.clerkId,
        supabaseUrl,
        supabaseAnonKey
    )
    const [cristalModalD, setCristalModalD] = useState<{
        open: boolean
        book: any | null
        formats: string[]
    }>({ open: false, book: null, formats: [] })
    const isMemberGate =
        cristalTierD.tier === "sintonia" || cristalTierD.tier === "inmersion"
    // Muro de pago de Cristales: se abre cuando NO se puede canjear.
    const [codiceGate, setCodiceGate] = useState<{
        open: boolean
        book: any | null
    }>({ open: false, book: null })
    const [codicePaywallOpen, setCodicePaywallOpen] = useState(false)
    /* v1.5 (2026-05-21) — Coreografía de la extracción en [CENTRO DE
       MANDO] espejo del [LENTE]:
         1. ConfirmarCristalModal cierra inmediato (fondo limpio para
            la animación).
         2. DCristalRitualOverlay corre 1.6s (anillos + partículas +
            orb + glyph + texto "Códice Anclado").
         3. DCristalSuccessModal aparece, autocierra en 4.5s o por
            click. CTA "Abrir Mi Núcleo" navega contextual. */
    const [cristalRitualOpenD, setCristalRitualOpenD] = useState(false)
    const [cristalSuccessD, setCristalSuccessD] = useState<{
        open: boolean
        title: string
    }>({ open: false, title: "" })
    const tryRedeemCodiceDesktop = useCallback(
        (book: any, formats: string[]): boolean => {
            // ¿Puede canjear con un Cristal de Códice? → abre el confirm.
            if (
                identity.clerkId &&
                cristalesD.codiceCount > 0 &&
                book?.bookId
            ) {
                setCristalModalD({ open: true, book, formats })
                return true
            }
            // No puede canjear → abre el muro de pago en lugar de navegar a
            // Stripe. Retorna true SIEMPRE para que HoloActionTile cancele su
            // navegación nativa (la pastilla nunca dispara su <a href>).
            setCodiceGate({ open: true, book })
            return true
        },
        [identity.clerkId, cristalesD.codiceCount]
    )
    const handleCristalConfirmDesktop = useCallback(async () => {
        if (!cristalModalD.book || !identity.clerkId) return
        if (!cristalModalD.book.bookId) {
            console.warn("[cristal] book.bookId missing — abort redeem")
            return
        }
        const bookTitle = cristalModalD.book.title || "Códice"
        const r = await redeemCodiceWithCristal(
            identity.clerkId,
            cristalModalD.book.bookId,
            cristalModalD.formats,
            supabaseUrl,
            supabaseAnonKey
        )
        if (!r.success) {
            console.warn("[cristal] redeem error:", r.error)
            throw new Error(r.error || "redeem_failed")
        }
        /* Cierre inmediato del modal de confirmación → fondo limpio. */
        setCristalModalD({ open: false, book: null, formats: [] })
        setCristalRitualOpenD(true)
        setTimeout(() => {
            setCristalRitualOpenD(false)
            setCristalSuccessD({ open: true, title: bookTitle })
        }, 1600)
        setTimeout(() => {
            setCristalSuccessD({ open: false, title: "" })
        }, 1600 + 4500)
    }, [
        cristalModalD,
        identity.clerkId,
        supabaseUrl,
        supabaseAnonKey,
    ])

    const [fetchedBooks, setFetchedBooks] = useState<any[]>([])
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
                console.warn(
                    "[CodicesDesktop] catalog_books fetch failed:",
                    e
                )
            })
        return () => {
            cancelled = true
        }
    }, [booksList, supabaseUrl, supabaseAnonKey])
    const effectiveBooksList =
        booksList && booksList.length > 0 ? booksList : fetchedBooks

    const readAccent = (): string => {
        if (accentProp) return accentProp
        const c = readAccentFromCSS()
        if (c && c.length > 0) return c
        return "#00C2FF"
    }
    const [accentColor, setAccentColor] = useState<string>(() =>
        accentProp || (typeof window === "undefined" ? "#00C2FF" : readAccent())
    )

    useLayoutEffect(() => {
        if (accentProp) {
            setAccentColor(accentProp)
            return
        }
        const sync = () => {
            setAccentColor(readAccent())
        }
        sync()
        const polls = [0, 40, 120, 250, 500, 800].map((ms) =>
            setTimeout(sync, ms)
        )
        window.addEventListener("pageshow", sync)
        window.addEventListener("focus", sync)
        document.addEventListener("visibilitychange", sync)
        window.addEventListener("storage", sync)
        return () => {
            polls.forEach(clearTimeout)
            window.removeEventListener("pageshow", sync)
            window.removeEventListener("focus", sync)
            document.removeEventListener("visibilitychange", sync)
            window.removeEventListener("storage", sync)
        }
    }, [accentProp])

    const themeKey = "theme-neon"
    const { promoCode, ownedFormats, purchasesResolved, hasOwnedSeed } =
        useNodeStatus(supabaseUrl, supabaseAnonKey)
    /* v1.1 — El descuento miembro (333 → 222 MXN, etiqueta TRIPULANTE
       ✦) ahora se ata exclusivamente a Inmersión Solar. Sintonía Solar
       NO accede al precio rebajado: ese diferencial es parte de la
       propuesta de valor que separa el tier $1,999 del $777. Antes
       isMember venía de useNodeStatus (cualquier suscripción activa)
       y disparaba el precio rebajado para ambas membresías por igual.
       cristalTierD.tier === "inmersion" es la fuente de verdad nueva;
       el promoCode también se inyecta solo si es Inmersión, porque
       el código de descuento de Stripe está vinculado al pricing
       Inmersión y no debe aplicarse al checkout cuando viene de
       Sintonía. */
    /* 33% OFF en Códices eliminado (2026-06-09): los Códices se pagan
       completos. El beneficio de miembro es ahora 1 Códice gratuito por mes
       (Cristales de Extracción), no un descuento. Se mantiene el hook
       cristalTierD para no alterar el orden de hooks. */
    void cristalTierD
    const isMember = false
    const shellRef = useRef<HTMLDivElement | null>(null)
    const [isAccentReady, setIsAccentReady] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isRet, setIsRet] = useState(false)
    const retFocusId = useRef<string | null>(null)
    const retScrollY = useRef<number>(0)
    const bookRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const registerBookRef = (id: string, ref: HTMLDivElement) => {
        bookRefs.current.set(id, ref)
    }
    const [scrolledPastThreshold, setScrolledPastThreshold] = useState(false)
    const [activeAuthorSection, setActiveAuthorSection] = useState<
        "zak" | "aqua" | null
    >(null)
    const zakSectionRef = useRef<HTMLDivElement>(null)
    const aquaSectionRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const prevH = document.documentElement.style.overflow
        const prevB = document.body.style.overflow
        document.documentElement.style.overflow = "hidden"
        document.body.style.overflow = "hidden"
        return () => {
            document.documentElement.style.overflow = prevH
            document.body.style.overflow = prevB
        }
    }, [])

    useEffect(() => {
        if (accentProp) {
            setIsAccentReady(true)
            return
        }
        const v = readAccentNearest(shellRef.current)
        if (v) {
            setAccentColor((p) => (p !== v ? v : p))
        }
    }, [accentProp])
    useLayoutEffect(() => {
        if (accentProp) {
            setIsAccentReady(true)
            return
        }
        let c = false
        const fn = () => {
            if (c) return
            const a = readAccentNearest(shellRef.current as Element | null)
            if (a && a.length > 0) {
                setAccentColor((p) => (p !== a ? a : p))
                if (!c) setIsAccentReady(true)
                return
            }
            if (!c) setIsAccentReady(true)
        }
        fn()
        const ps = [16, 60, 120, 240, 480, 960].map((ms) => setTimeout(fn, ms))
        return () => {
            c = true
            ps.forEach(clearTimeout)
        }
    }, [accentProp])

    const [activeNode, setActiveNodeRaw] = useState<any | null>(null)
    const [selAuthor, setSelAuthor] = useState<string | null>(null)
    const activeNodeRef = useRef<any>(null)
    const effFilteredRef = useRef<any[]>([])
    const setActiveNode = useCallback((book: any) => {
        activeNodeRef.current = book
        setActiveNodeRaw(book)
    }, [])
    const [showPhyLinks, setShowPhyLinks] = useState(false)
    const [showTextModal, setShowTextModal] = useState(false)
    const [showTrailerModal, setShowTrailerModal] = useState(false)
    const [showFaqModal, setShowFaqModal] = useState(false)
    const [fragFlare, setFragFlare] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loadPdf, setLoadPdf] = useState(false)
    const [pdfErr, setPdfErr] = useState<string | null>(null)
    const streamRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const fn = () => {
            setScrolledPastThreshold(el.scrollTop > window.innerHeight * 0.8)
            const containerRect = el.getBoundingClientRect()
            const viewMid = containerRect.height * 0.5
            const zakEl = zakSectionRef.current
            const aquaEl = aquaSectionRef.current
            const zakTop = zakEl
                ? zakEl.getBoundingClientRect().top - containerRect.top
                : Infinity
            const aquaTop = aquaEl
                ? aquaEl.getBoundingClientRect().top - containerRect.top
                : Infinity
            if (aquaTop < viewMid && aquaEl) setActiveAuthorSection("aqua")
            else if (zakTop < viewMid && zakEl) setActiveAuthorSection("zak")
            else setActiveAuthorSection(null)
        }
        el.addEventListener("scroll", fn, { passive: true })
        return () => el.removeEventListener("scroll", fn)
    }, [])

    const hasFaqs = faqList && faqList.length > 0
    const isConsoleOpen = !!activeNode
    const showFaqBtn = hasFaqs && (isConsoleOpen || scrolledPastThreshold)
    const showScrollTopBtn = !isConsoleOpen && scrolledPastThreshold
    const showSideNav = !isConsoleOpen && activeAuthorSection !== null

    const scrollToSection = useCallback(
        (ref: React.RefObject<HTMLDivElement | null>) => {
            const el = ref.current
            const container = containerRef.current
            if (!el || !container) return
            const elRect = el.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            container.scrollTo({
                top:
                    container.scrollTop +
                    (elRect.top - containerRect.top) -
                    200,
                behavior: "smooth",
            })
        },
        []
    )

    const books = useMemo(
        () =>
            (effectiveBooksList || []).map((b: any, i: number) => ({
                id: String(i),
                bookId: b.bookId,
                title: b.title || "Sin título",
                author: b.authorOption || "Zak'Haar",
                coverUrl: b.cover,
                colorHex: accentColor,
                synopsis: b.longDesc,
                shortSynopsis: b.shortDesc,
                digitalLink: b.linkDigital,
                audiobookLink: b.linkAudio,
                pdfUrl: b.pdfFile,
                trailerUrl: b.trailerVideo,
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
        [effectiveBooksList, accentColor]
    )

    const resolvedSub = useMemo(
        () => normalizeMultiline(pageSubtitle),
        [pageSubtitle]
    )

    const setBookHash = useCallback(
        (bookId: string, context: "scroll" | "consola") => {
            const idx = books.findIndex((b: any) => b.id === bookId)
            if (idx < 0) return
            if (context === "consola") {
                const fromScroll = retFocusId.current !== null
                window.history.replaceState(
                    null,
                    "",
                    fromScroll
                        ? `#consola-${idx + 1}`
                        : `#consola-landing-${idx + 1}`
                )
            } else window.history.replaceState(null, "", `#libro-${idx + 1}`)
        },
        [books]
    )
    const clearHash = useCallback(() => {
        if (window.location.hash)
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            )
    }, [])

    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return
        const consolaScrollMatch = hash.match(/^#consola-(\d+)$/)
        const consolaLandingMatch = hash.match(/^#consola-landing-(\d+)$/)
        const libroMatch = hash.match(/^#libro-(\d+)$/)
        if (consolaLandingMatch) {
            const idx = parseInt(consolaLandingMatch[1], 10) - 1
            if (books[idx])
                setTimeout(() => {
                    retFocusId.current = null
                    retScrollY.current = 0
                    setActiveNode(books[idx])
                    setShowPhyLinks(false)
                    setIsRet(false)
                    clearHash()
                }, 150)
        } else if (consolaScrollMatch) {
            const idx = parseInt(consolaScrollMatch[1], 10) - 1
            if (books[idx])
                setTimeout(() => {
                    retFocusId.current = books[idx].id
                    retScrollY.current = 0
                    setActiveNode(books[idx])
                    setShowPhyLinks(false)
                    setIsRet(false)
                    clearHash()
                }, 150)
        } else if (libroMatch) {
            const idx = parseInt(libroMatch[1], 10) - 1
            if (!books[idx]) return
            let attempts = 0
            const tryScroll = () => {
                attempts++
                const el = bookRefs.current.get(books[idx].id)
                if (el && containerRef.current) {
                    const elRect = el.getBoundingClientRect()
                    const cRect = containerRef.current.getBoundingClientRect()
                    containerRef.current.scrollTo({
                        top:
                            containerRef.current.scrollTop +
                            (elRect.top - cRect.top) -
                            200,
                        behavior: "auto",
                    })
                    clearHash()
                } else if (attempts < 30) setTimeout(tryScroll, 100)
            }
            setTimeout(tryScroll, 300)
        }
    }, [books])

    const closeAuthorView = useCallback(() => {
        if (showTextModal || showTrailerModal) return
        setIsRet(true)
        clearHash()
        const savedFocusId = retFocusId.current
        setSelAuthor(null)
        if (savedFocusId) {
            if (retScrollY.current > 0 && containerRef.current)
                containerRef.current.scrollTop = retScrollY.current
            setActiveNode(null)
            setShowPhyLinks(false)
            retFocusId.current = null
            let att = 0
            const snap = () => {
                att++
                const el = bookRefs.current.get(savedFocusId)
                if (el && containerRef.current) {
                    const elRect = el.getBoundingClientRect()
                    const cRect = containerRef.current.getBoundingClientRect()
                    containerRef.current.scrollTop =
                        containerRef.current.scrollTop +
                        (elRect.top - cRect.top) -
                        200
                } else if (att < 15) setTimeout(snap, 50)
            }
            requestAnimationFrame(() => setTimeout(snap, 30))
        } else {
            setActiveNode(null)
            setShowPhyLinks(false)
            containerRef.current?.scrollTo({ top: 0, behavior: "auto" })
        }
    }, [showTextModal, showTrailerModal])

    const openTextViewer = useCallback(() => {
        if (activeNode) setShowTextModal(true)
    }, [activeNode])
    const closeTextViewer = useCallback(() => {
        setShowTextModal(false)
        if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
        setPdfErr(null)
        setLoadPdf(false)
    }, [pdfUrl])
    const openTrailerViewer = useCallback(() => {
        if (activeNode && (activeNode as any).trailerUrl)
            setShowTrailerModal(true)
    }, [activeNode])
    const closeTrailerViewer = useCallback(() => {
        setShowTrailerModal(false)
    }, [])
    const handleBookClick = useCallback((book: any) => {
        retScrollY.current = containerRef.current?.scrollTop || 0
        retFocusId.current = book.id
        setActiveNode(book)
        setShowPhyLinks(false)
        setIsRet(false)
    }, [])

    const effFiltered = useMemo(() => {
        if (selAuthor)
            return books.filter((b: any) => b.author.includes(selAuthor))
        if (activeNode) {
            const an = (activeNode as any).author.includes("Zak")
                ? "Zak"
                : "Aqua"
            return books.filter((b: any) => b.author.includes(an))
        }
        return []
    }, [selAuthor, activeNode, books])
    activeNodeRef.current = activeNode
    effFilteredRef.current = effFiltered

    const handleAuthorSelect = useCallback(
        (name: string) => {
            let tb = null
            if (name.includes("Zak"))
                tb = books.find((b: any) => b.title === zakFeaturedTitle)
            else tb = books.find((b: any) => b.title === aquaFeaturedTitle)
            if (!tb) tb = books.find((b: any) => b.author.includes(name))
            if (tb) {
                retFocusId.current = null
                setSelAuthor(name)
                setActiveNode(tb)
                setShowPhyLinks(false)
                setIsRet(false)
            }
        },
        [books, zakFeaturedTitle, aquaFeaturedTitle]
    )

    const consoleAuthorType = useMemo<"zak" | "aqua">(() => {
        if (!activeNode) return "zak"
        return (activeNode as any).author?.includes("Zak") ? "zak" : "aqua"
    }, [activeNode])
    const handleConsoleSwitchAuthor = useCallback(
        (author: "zak" | "aqua") => {
            if (consoleAuthorType === author) return
            const name = author === "zak" ? "Zak" : "Aqua"
            let tb = null
            if (name.includes("Zak"))
                tb = books.find((b: any) => b.title === zakFeaturedTitle)
            else tb = books.find((b: any) => b.title === aquaFeaturedTitle)
            if (!tb) tb = books.find((b: any) => b.author.includes(name))
            if (tb) {
                setSelAuthor(name)
                setActiveNode(tb)
                setShowPhyLinks(false)
            }
        },
        [consoleAuthorType, books, zakFeaturedTitle, aquaFeaturedTitle]
    )

    const showTextModalRef = useRef(false)
    showTextModalRef.current = showTextModal
    const showTrailerModalRef = useRef(false)
    showTrailerModalRef.current = showTrailerModal
    const showFaqModalRef = useRef(false)
    showFaqModalRef.current = showFaqModal
    const selAuthorRef = useRef<string | null>(null)
    selAuthorRef.current = selAuthor
    const closeTextViewerRef = useRef(closeTextViewer)
    closeTextViewerRef.current = closeTextViewer
    const closeTrailerViewerRef = useRef(closeTrailerViewer)
    closeTrailerViewerRef.current = closeTrailerViewer
    const closeAuthorViewRef = useRef(closeAuthorView)
    closeAuthorViewRef.current = closeAuthorView

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showTrailerModalRef.current) {
                    e.preventDefault()
                    e.stopPropagation()
                    closeTrailerViewerRef.current()
                    return
                }
                if (showFaqModalRef.current) {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowFaqModal(false)
                    return
                }
                if (showTextModalRef.current) {
                    e.preventDefault()
                    e.stopPropagation()
                    closeTextViewerRef.current()
                    return
                }
                if (activeNodeRef.current || selAuthorRef.current) {
                    e.preventDefault()
                    e.stopPropagation()
                    closeAuthorViewRef.current()
                    return
                }
            }
            const node = activeNodeRef.current
            const list = effFilteredRef.current
            if (node && list.length > 0) {
                const ci = list.findIndex((b: any) => b.id === node.id)
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    setActiveNode(list[ci > 0 ? ci - 1 : list.length - 1])
                    setShowPhyLinks(false)
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault()
                    setActiveNode(list[ci < list.length - 1 ? ci + 1 : 0])
                    setShowPhyLinks(false)
                }
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    const handleScroll = useCallback(
        (e: any) => {
            if (!streamRef.current) return
            streamRef.current.scrollLeft +=
                (e.deltaX || e.deltaY || 0) * (inertiaEnabled ? 0.9 : 1)
        },
        [inertiaEnabled]
    )
    useEffect(() => {
        const el = streamRef.current
        const fn = (e: any) => handleScroll(e)
        el?.addEventListener("wheel", fn, { passive: true } as any)
        el?.addEventListener("touchmove", fn, { passive: true } as any)
        return () => {
            el?.removeEventListener("wheel", fn)
            el?.removeEventListener("touchmove", fn)
        }
    }, [handleScroll])

    useEffect(() => {
        if (
            window.location.hash &&
            /^#(libro|consola-landing|consola)-\d+$/.test(window.location.hash)
        )
            return
        const reset = () => {
            if (containerRef.current) containerRef.current.scrollTop = 0
            window.scrollTo(0, 0)
        }
        reset()
        requestAnimationFrame(reset)
        const t1 = setTimeout(reset, 50)
        const t2 = setTimeout(reset, 150)
        const t3 = setTimeout(reset, 300)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [])

    useEffect(() => {
        const url = (activeNode as any)?.pdfUrl
        if (!showTextModal || !url) {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
            setPdfErr(null)
            setLoadPdf(false)
            return
        }
        let rev: string | null = null
        let cancel = false
        ;(async () => {
            try {
                setLoadPdf(true)
                setPdfErr(null)
                const r = await fetch(url)
                if (!r.ok) throw new Error("err")
                const b = await r.blob()
                const pb =
                    b.type === "application/pdf"
                        ? b
                        : new Blob([b], { type: "application/pdf" })
                const u = URL.createObjectURL(pb)
                if (!cancel) {
                    setPdfUrl(u)
                    rev = u
                    setLoadPdf(false)
                }
            } catch {
                if (!cancel) {
                    setPdfErr("No se pudo cargar la vista previa del PDF.")
                    setLoadPdf(false)
                }
            }
        })()
        return () => {
            cancel = true
            if (rev) URL.revokeObjectURL(rev)
        }
    }, [showTextModal, activeNode])

    const activeFormats =
        activeNode && ownedFormats
            ? ownedFormats.get((activeNode as any).title) || []
            : []
    const activeOwnsDigital = activeFormats.some(
        (f: string) => f === "pdf" || f === "epub"
    )
    const activeOwnsAudio = activeFormats.some(
        (f: string) => f === "audiobook" || f === "audio"
    )
    const activeOwnsAll = activeOwnsDigital && activeOwnsAudio
    /* Anti-flash en el visor profundo: un dueño nunca parpadea "DESBLOQUEAR"
       antes de "ADQUIRIDO" mientras el fetch de compras resuelve sin cache. */
    const activePending = !purchasesResolved && !hasOwnedSeed
    const activeDigitalPending = !activeOwnsDigital && activePending
    const activeAudioPending = !activeOwnsAudio && activePending
    const fragEnabled = !!(activeNode && (activeNode as any).pdfUrl)
    const trailerEnabled = !!(activeNode && (activeNode as any).trailerUrl)
    const aHasDig = !!(
        activeNode &&
        (activeNode as any).digitalLink &&
        (activeNode as any).digitalLink.trim()
    )
    const aHasAud = !!(
        activeNode &&
        (activeNode as any).audiobookLink &&
        (activeNode as any).audiobookLink.trim()
    )
    const aHasPhy = !!(
        activeNode &&
        (activeNode as any).physicalLinks &&
        (activeNode as any).physicalLinks.length > 0
    )
    const hasZakBooks = books.some((b: any) => b.author.includes("Zak"))
    const hasAquaBooks = books.some((b: any) => !b.author.includes("Zak"))
    const showConsoleAuthorToggle =
        hasZakBooks &&
        hasAquaBooks &&
        isConsoleOpen &&
        !showTextModal &&
        !showTrailerModal

    return (
        <CristalInterceptContext.Provider value={tryRedeemCodiceDesktop}>
        <LayoutGroup id={themeKey}>
            <div
                ref={shellRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                    background: bgColor,
                    fontFamily: "'Inter',sans-serif",
                    color: "#F0F0F0",
                    margin: 0,
                    visibility: isAccentReady ? "visible" : "hidden",
                }}
            >
                {/* v1.2 — Indicador visible para todos (incluso
                    Explorer). Cuenta 0 cristales si no es miembro;
                    picarlo abre el modal explicativo. */}
                <div
                    style={{
                        position: "fixed",
                        top: 18,
                        left: 24,
                        zIndex: 9990,
                        pointerEvents: "auto",
                    }}
                >
                    <CristalesIndicator
                        codiceCount={cristalesD.codiceCount}
                        meditacionCount={cristalesD.meditacionCount}
                        onlyKind="codice"
                        size="lg"
                    />
                </div>
                <AnimatePresence>
                    {fragFlare && (
                        <FragmentOpenFlare
                            flareColor={accentColor}
                            onDone={() => setFragFlare(false)}
                        />
                    )}
                </AnimatePresence>
                <FloatingButtons
                    onFaqClick={() => setShowFaqModal(true)}
                    onScrollTop={() =>
                        containerRef.current?.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        })
                    }
                    showFaq={showFaqBtn}
                    showScrollTop={showScrollTopBtn}
                    accent={accentColor}
                />
                <StickySideNav
                    show={showSideNav}
                    accent={accentColor}
                    activeSection={activeAuthorSection}
                    onGoZak={() => scrollToSection(zakSectionRef)}
                    onGoAqua={() => scrollToSection(aquaSectionRef)}
                />
                <ConsoleAuthorToggle
                    activeAuthorInConsole={consoleAuthorType}
                    accent={accentColor}
                    onSwitchAuthor={handleConsoleSwitchAuthor}
                    visible={showConsoleAuthorToggle}
                />
                <AnimatePresence>
                    {showFaqModal && (
                        <DFaqModal
                            faqs={faqList}
                            accentColor={accentColor}
                            textColor={textColor}
                            onClose={() => setShowFaqModal(false)}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {showTrailerModal &&
                        activeNode &&
                        (activeNode as any).trailerUrl && (
                            <TrailerModal
                                videoUrl={(activeNode as any).trailerUrl}
                                accentColor={accentColor}
                                textColor={textColor}
                                title={(activeNode as any).title}
                                onClose={closeTrailerViewer}
                            />
                        )}
                </AnimatePresence>

                <motion.div
                    key={themeKey}
                    ref={containerRef}
                    className="holo-scroll-container"
                    style={{
                        position: "relative",
                        zIndex: 2,
                        width: "100%",
                        height: "100vh",
                        overflowY: "auto",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: isRet ? 0.15 : 0.5,
                            ease: "linear",
                            delay: 0,
                        }}
                        style={{
                            width: "100%",
                            minHeight: "100vh",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            zIndex: 1,
                            paddingTop: `${layoutTopOffsetVH}vh`,
                        }}
                    >
                        {!selAuthor && !activeNode && (
                            <div
                                style={{
                                    ...S.pageHeaderWrap,
                                    marginTop: `${pageHeaderOffsetVH}vh`,
                                }}
                            >
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: isRet ? 0 : -30,
                                        filter: isRet
                                            ? "blur(0px)"
                                            : "blur(8px)",
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        filter: "blur(0px)",
                                    }}
                                    transition={{
                                        duration: isRet ? 0.15 : 1.2,
                                        ease: "easeOut",
                                        delay: isRet ? 0 : 0.2,
                                    }}
                                >
                                    {pageTitleImage ? (
                                        <div
                                            style={S.pageTitleImageWrapper(
                                                pageTitleImageHeight
                                            )}
                                        >
                                            <img
                                                src={pageTitleImage}
                                                alt="Título"
                                                style={S.pageTitleImageEl}
                                            />
                                        </div>
                                    ) : (
                                        <h1
                                            style={S.pageTitleFallback(
                                                accentColor,
                                                pageTitleFallbackHeight,
                                                pageTitleXOffsetPx
                                            )}
                                        >
                                            {(
                                                pageTitleFallback || "ARCHIVOS"
                                            ).replace(/\\n/g, "\n")}
                                        </h1>
                                    )}
                                </motion.div>
                                {resolvedSub && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: isRet ? 0 : 20,
                                        }}
                                        animate={{ opacity: 0.4, y: 0 }}
                                        transition={{
                                            duration: isRet ? 0.15 : 0.8,
                                            delay: isRet ? 0 : 0.5,
                                        }}
                                        style={S.pageSubtitleText(
                                            textColor,
                                            pageTitleSubtitleGapPx
                                        )}
                                    >
                                        {resolvedSub}
                                    </motion.div>
                                )}
                            </div>
                        )}
                        {!selAuthor && !activeNode && (
                            <motion.div
                                key={`${themeKey}-${(accentColor || "").trim()}`}
                                style={S.authorSelectorContainer(
                                    authorPanelGap,
                                    authorOffsetVH
                                )}
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: {},
                                    visible: {
                                        transition: {
                                            staggerChildren: isRet ? 0 : 0.3,
                                            delayChildren: isRet ? 0 : 0.6,
                                        },
                                    },
                                }}
                            >
                                <motion.div
                                    variants={{
                                        hidden: {
                                            opacity: 0,
                                            x: isRet ? 0 : -50,
                                            filter: isRet
                                                ? "blur(0px)"
                                                : "blur(5px)",
                                        },
                                        visible: {
                                            opacity: 1,
                                            x: 0,
                                            filter: "blur(0px)",
                                            transition: {
                                                duration: isRet ? 0.15 : 1,
                                                ease: "easeOut",
                                            },
                                        },
                                    }}
                                >
                                    <HoloBookCard
                                        accent={accentColor}
                                        widthVW={authorPanelWidthVW}
                                        heightVH={authorPanelHeightVH}
                                        titleText="Zak'Haar"
                                        icon="sun"
                                        shimmerDurationSec={
                                            authorShimmerSpeedSec
                                        }
                                        titleSizePx={authorTitleSizePx}
                                        hoverDelaySec={hoverDelaySec}
                                        onSelect={() =>
                                            handleAuthorSelect("Zak")
                                        }
                                    />
                                </motion.div>
                                <motion.div
                                    variants={{
                                        hidden: {
                                            opacity: 0,
                                            x: isRet ? 0 : 50,
                                            filter: isRet
                                                ? "blur(0px)"
                                                : "blur(5px)",
                                        },
                                        visible: {
                                            opacity: 1,
                                            x: 0,
                                            filter: "blur(0px)",
                                            transition: {
                                                duration: isRet ? 0.15 : 1,
                                                ease: "easeOut",
                                            },
                                        },
                                    }}
                                >
                                    <HoloBookCard
                                        accent={accentColor}
                                        widthVW={authorPanelWidthVW}
                                        heightVH={authorPanelHeightVH}
                                        titleText="Aqua'Riia"
                                        icon="drop"
                                        shimmerDurationSec={
                                            authorShimmerSpeedSec
                                        }
                                        titleSizePx={authorTitleSizePx}
                                        hoverDelaySec={hoverDelaySec}
                                        onSelect={() =>
                                            handleAuthorSelect("Aqua")
                                        }
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>

                    {!selAuthor && (
                        <motion.div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                width: "100%",
                                background:
                                    "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(5,10,20,.9) 20%)",
                                minHeight: "100vh",
                            }}
                        >
                            <div style={{ paddingTop: "10vh" }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-5%" }}
                                    transition={{
                                        duration: 1,
                                        ease: "easeOut",
                                    }}
                                    style={{
                                        textAlign: "center",
                                        padding: "0 4vw 4vh 4vw",
                                        position: "relative",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "24px",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: "0 1 200px",
                                                height: "1px",
                                                background: `linear-gradient(90deg, transparent, ${hexToRgba(accentColor, 0.2)})`,
                                            }}
                                        />
                                        <h2
                                            style={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                fontSize: "0.75rem",
                                                fontWeight: 300,
                                                letterSpacing: "0.45em",
                                                textTransform: "uppercase",
                                                color: hexToRgba(
                                                    accentColor,
                                                    0.35
                                                ),
                                                margin: 0,
                                                whiteSpace: "nowrap",
                                                userSelect: "none",
                                            }}
                                        >
                                            Transmisiones Disponibles
                                        </h2>
                                        <div
                                            style={{
                                                flex: "0 1 200px",
                                                height: "1px",
                                                background: `linear-gradient(-90deg, transparent, ${hexToRgba(accentColor, 0.2)})`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                                <InfiniteMarquee
                                    books={books}
                                    accentColor={accentColor}
                                    scrollRef={containerRef}
                                    speed={marqueeSpeed}
                                    onBookClick={handleBookClick}
                                    registerBookRef={registerBookRef}
                                    isPaused={!!activeNode}
                                />
                            </div>
                            <BookDetailedList
                                books={books}
                                accentColor={accentColor}
                                textColor={textColor}
                                onBookClick={handleBookClick}
                                registerBookRef={registerBookRef}
                                zakSectionRef={zakSectionRef}
                                aquaSectionRef={aquaSectionRef}
                                setBookHash={setBookHash}
                                isMember={isMember}
                                promoCode={promoCode}
                                ownedFormats={ownedFormats}
                                purchasesResolved={purchasesResolved}
                                hasOwnedSeed={hasOwnedSeed}
                                precioDigital={precioDigital}
                                precioAudio={precioAudio}
                                precioDigitalMiembro={precioDigitalMiembro}
                                precioAudioMiembro={precioAudioMiembro}
                            />
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {showTextModal && activeNode && (
                            <motion.div
                                style={S.modalOverlay(modalOffsetVH)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={closeTextViewer}
                            >
                                <motion.div
                                    layoutId="previewPanelShell"
                                    style={S.modalPanel(accentColor)}
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{ opacity: 0.95, scale: 1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 20,
                                    }}
                                >
                                    <div
                                        style={S.modalHeader(
                                            accentColor,
                                            textColor
                                        )}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                maxWidth: "80%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {(activeNode as any).title}
                                            </div>
                                        </div>
                                        <motion.button
                                            style={S.modalCloseButton(
                                                accentColor
                                            )}
                                            whileHover={{
                                                scale: 1.1,
                                                background: `${accentColor}22`,
                                            }}
                                            onClick={closeTextViewer}
                                        >
                                            &times;
                                        </motion.button>
                                    </div>
                                    <div style={S.modalBody}>
                                        {(activeNode as any).pdfUrl ? (
                                            loadPdf ? (
                                                <div
                                                    style={S.modalFallbackText(
                                                        accentColor
                                                    )}
                                                >
                                                    Cargando vista previa…
                                                </div>
                                            ) : pdfErr ? (
                                                <div
                                                    style={S.modalFallbackText(
                                                        accentColor
                                                    )}
                                                >
                                                    {pdfErr}
                                                </div>
                                            ) : pdfUrl ? (
                                                <div style={S.modalPdfWrap}>
                                                    <iframe
                                                        src={pdfUrl}
                                                        style={S.modalPdfFrame}
                                                        loading="lazy"
                                                        title={
                                                            (activeNode as any)
                                                                .title || "PDF"
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    style={S.modalFallbackText(
                                                        accentColor
                                                    )}
                                                >
                                                    Error en vista previa.
                                                </div>
                                            )
                                        ) : (
                                            <div
                                                style={S.modalFallbackText(
                                                    accentColor
                                                )}
                                            >
                                                Aún no hay PDF.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeNode && (
                        <motion.div
                            key="detail-view"
                            className="active-author-overlay"
                            style={S.activeAuthorLayer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeAuthorView}
                        >
                            <motion.div
                                style={S.twoPanelWrap(
                                    twoPanelGapVW,
                                    consoleOffsetVH
                                )}
                            >
                                <motion.div
                                    style={S.previewPanel(
                                        accentColor,
                                        previewPanelVW,
                                        panelHeightVH,
                                        screenCornerRadius,
                                        screenOpacity,
                                        screenBlurPx
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={
                                                (activeNode as any).id +
                                                "-cover"
                                            }
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "16px",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <motion.img
                                                src={
                                                    (activeNode as any)
                                                        .coverUrl ||
                                                    makeFallbackDataUrl(
                                                        (activeNode as any)
                                                            .title,
                                                        (activeNode as any)
                                                            .colorHex
                                                    )
                                                }
                                                alt={(activeNode as any).title}
                                                style={{
                                                    ...S.previewImage,
                                                    cursor: fragEnabled
                                                        ? "pointer"
                                                        : "default",
                                                    outline: "none",
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (fragEnabled)
                                                        openTextViewer()
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    width: "90%",
                                                    maxWidth: "90%",
                                                }}
                                            >
                                                {fragEnabled && (
                                                    <motion.button
                                                        className="console-twin-btn"
                                                        style={{
                                                            background: `linear-gradient(145deg,${hexToRgba(accentColor, 0.1)},rgba(5,10,20,.8))`,
                                                            border: `1px solid ${hexToRgba(accentColor, 0.5)}`,
                                                            color: accentColor,
                                                            boxShadow: `0 0 10px ${hexToRgba(accentColor, 0.15)}, inset 0 0 8px ${hexToRgba(accentColor, 0.05)}`,
                                                        }}
                                                        whileHover={{
                                                            boxShadow: `0 0 18px ${hexToRgba(accentColor, 0.4)}, inset 0 0 12px ${hexToRgba(accentColor, 0.1)}`,
                                                            borderColor:
                                                                accentColor,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.96,
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openTextViewer()
                                                        }}
                                                    >
                                                        <IconSmEye />
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    ".78rem",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            Leer Preview
                                                        </span>
                                                    </motion.button>
                                                )}
                                                {trailerEnabled && (
                                                    <motion.button
                                                        className="console-twin-btn"
                                                        style={{
                                                            background: `linear-gradient(145deg,${hexToRgba(accentColor, 0.06)},rgba(5,10,20,.7))`,
                                                            border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                                                            color: hexToRgba(
                                                                accentColor,
                                                                0.8
                                                            ),
                                                            boxShadow: `0 0 8px ${hexToRgba(accentColor, 0.1)}, inset 0 0 6px ${hexToRgba(accentColor, 0.03)}`,
                                                        }}
                                                        whileHover={{
                                                            boxShadow: `0 0 18px ${hexToRgba(accentColor, 0.35)}, inset 0 0 10px ${hexToRgba(accentColor, 0.08)}`,
                                                            borderColor:
                                                                hexToRgba(
                                                                    accentColor,
                                                                    0.7
                                                                ),
                                                            color: accentColor,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.96,
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openTrailerViewer()
                                                        }}
                                                    >
                                                        <IconSmPlay />
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    ".78rem",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            Trailer
                                                        </span>
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div
                                    style={{
                                        ...S.infoPanel(
                                            accentColor,
                                            infoPanelVW,
                                            panelHeightVH,
                                            screenCornerRadius,
                                            screenOpacity,
                                            screenBlurPx
                                        ),
                                        pointerEvents:
                                            showTextModal || showTrailerModal
                                                ? "none"
                                                : "auto",
                                    }}
                                    animate={{
                                        opacity:
                                            showTextModal || showTrailerModal
                                                ? 0
                                                : 1,
                                    }}
                                    transition={{
                                        duration: 0.25,
                                        ease: "easeOut",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        className="console-close-premium"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            closeAuthorView()
                                        }}
                                        style={
                                            {
                                                ["--cc-border" as any]:
                                                    hexToRgba(accentColor, 0.3),
                                                ["--cc-border-h" as any]:
                                                    accentColor,
                                                ["--cc-bg" as any]: `linear-gradient(145deg, ${hexToRgba(accentColor, 0.08)}, rgba(5,10,20,0.8))`,
                                                ["--cc-bg-h" as any]: `linear-gradient(145deg, ${hexToRgba(accentColor, 0.18)}, rgba(5,10,20,0.9))`,
                                                ["--cc-shadow" as any]: `0 0 10px ${hexToRgba(accentColor, 0.1)}, inset 0 0 6px ${hexToRgba(accentColor, 0.05)}`,
                                                ["--cc-shadow-h" as any]: `0 0 20px ${hexToRgba(accentColor, 0.4)}, 0 0 40px ${hexToRgba(accentColor, 0.15)}, inset 0 0 10px ${hexToRgba(accentColor, 0.1)}`,
                                                ["--cc-color" as any]:
                                                    hexToRgba(accentColor, 0.6),
                                                ["--cc-color-h" as any]:
                                                    accentColor,
                                            } as React.CSSProperties
                                        }
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        >
                                            <line
                                                x1="1"
                                                y1="1"
                                                x2="13"
                                                y2="13"
                                            />
                                            <line
                                                x1="13"
                                                y1="1"
                                                x2="1"
                                                y2="13"
                                            />
                                        </svg>
                                    </button>
                                    <div
                                        style={S.consoleDecoLine(
                                            accentColor,
                                            "left"
                                        )}
                                    />
                                    <div
                                        style={S.consoleDecoLine(
                                            accentColor,
                                            "right"
                                        )}
                                    />
                                    <div style={S.consoleContent(accentColor)}>
                                        <motion.div
                                            key={(activeNode as any).id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "flex-start",
                                                gap: "10px",
                                                width: "100%",
                                                height: "100%",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    color: textColor,
                                                    margin: "0 0 4px 0",
                                                    textAlign: "center",
                                                    letterSpacing: ".02em",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {(activeNode as any).title}
                                            </h2>
                                            <DFichaTecnica
                                                pageCount={
                                                    (activeNode as any)
                                                        .pageCount
                                                }
                                                year={(activeNode as any).year}
                                                accentColor={accentColor}
                                            />
                                            <div
                                                style={{
                                                    flexGrow: 1,
                                                    width: "100%",
                                                    minHeight: 0,
                                                    overflowY: "auto",
                                                    scrollbarWidth: "thin",
                                                    scrollbarColor: `${accentColor}55 transparent`,
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        color: textColor,
                                                        margin: 0,
                                                        opacity: 0.9,
                                                        fontSize: "1rem",
                                                        lineHeight: 1.6,
                                                        whiteSpace: "pre-line",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    {
                                                        (activeNode as any)
                                                            .synopsis
                                                    }
                                                </p>
                                            </div>
                                            {activeOwnsAll ? (
                                                <div
                                                    style={{
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        gap: "16px",
                                                        flexWrap: "wrap",
                                                        justifyContent:
                                                            "center",
                                                        width: "100%",
                                                        paddingTop: "8px",
                                                    }}
                                                >
                                                    <HoloCapsuleButton
                                                        icon={IconSmNucleo}
                                                        label="ADQUIRIDO"
                                                        subLabel="Abrir en Mi Núcleo"
                                                        onClick={(e: any) => {
                                                            e.stopPropagation()
                                                            setBookHash(
                                                                (
                                                                    activeNode as any
                                                                ).id,
                                                                "consola"
                                                            )
                                                            goNucleoCodicesDesktop()
                                                        }}
                                                        accentColor="#FFB800"
                                                        colorOverride="#FFB800"
                                                        textColor={textColor}
                                                    />
                                                    {aHasPhy && (
                                                        <HoloCapsuleButton
                                                            icon={IconSmBox}
                                                            label="MATERIALIZAR"
                                                            subLabel="Edición Física"
                                                            onClick={(
                                                                e: any
                                                            ) => {
                                                                e.stopPropagation()
                                                                setShowPhyLinks(
                                                                    true
                                                                )
                                                            }}
                                                            accentColor={
                                                                accentColor
                                                            }
                                                            textColor={
                                                                textColor
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                (aHasDig ||
                                                    aHasAud ||
                                                    aHasPhy) && (
                                                    <div
                                                        style={{
                                                            flexShrink: 0,
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "8px",
                                                            justifyContent:
                                                                "center",
                                                            width: "100%",
                                                            paddingTop: "8px",
                                                        }}
                                                    >
                                                        <AnimatePresence mode="wait">
                                                            {!showPhyLinks ? (
                                                                <motion.div
                                                                    key="pri"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                    }}
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: "24px",
                                                                        flexWrap:
                                                                            "wrap",
                                                                        justifyContent:
                                                                            "center",
                                                                        width: "100%",
                                                                    }}
                                                                >
                                                                    {aHasDig &&
                                                                        (activeOwnsDigital ? (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmNucleo
                                                                                }
                                                                                label="ADQUIRIDO"
                                                                                subLabel="El Códice completo"
                                                                                onClick={(
                                                                                    e: any
                                                                                ) => {
                                                                                    e.stopPropagation()
                                                                                    setBookHash(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .id,
                                                                                        "consola"
                                                                                    )
                                                                                    goNucleoCodicesDesktop()
                                                                                }}
                                                                                accentColor="#FFB800"
                                                                                colorOverride="#FFB800"
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ) : activeDigitalPending ? (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmTablet
                                                                                }
                                                                                label="·  ·  ·"
                                                                                subLabel="El Códice completo"
                                                                                isDisabled
                                                                                accentColor={
                                                                                    accentColor
                                                                                }
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmTablet
                                                                                }
                                                                                label="DESBLOQUEAR"
                                                                                subLabel={
                                                                                    isMember ? (
                                                                                        <PriceLabel
                                                                                            original={
                                                                                                precioDigital ||
                                                                                                "333 MXN"
                                                                                            }
                                                                                            discounted={
                                                                                                precioDigitalMiembro ||
                                                                                                "222 MXN"
                                                                                            }
                                                                                        />
                                                                                    ) : (
                                                                                        <>
                                                                                            <span
                                                                                                style={{
                                                                                                    display:
                                                                                                        "block",
                                                                                                    marginBottom:
                                                                                                        "4px",
                                                                                                }}
                                                                                            >
                                                                                                PDF
                                                                                                +
                                                                                                Ebook
                                                                                            </span>
                                                                                            <span
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        ".75rem",
                                                                                                    opacity: 0.7,
                                                                                                }}
                                                                                            >
                                                                                                (
                                                                                                {precioDigital ||
                                                                                                    "333 MXN"}

                                                                                                )
                                                                                            </span>
                                                                                        </>
                                                                                    )
                                                                                }
                                                                                href={
                                                                                    checkoutHref(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .digitalLink,
                                                                                        isMember
                                                                                            ? promoCode
                                                                                            : null,
                                                                                        identity
                                                                                    )
                                                                                }
                                                                                sameTab
                                                                                onBeforeNavigate={() =>
                                                                                    setBookHash(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .id,
                                                                                        "consola"
                                                                                    )
                                                                                }
                                                                                accentColor={
                                                                                    accentColor
                                                                                }
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ))}
                                                                    {aHasAud &&
                                                                        (activeOwnsAudio ? (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmNucleo
                                                                                }
                                                                                label="ADQUIRIDO"
                                                                                subLabel="Audiolibro"
                                                                                onClick={(
                                                                                    e: any
                                                                                ) => {
                                                                                    e.stopPropagation()
                                                                                    setBookHash(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .id,
                                                                                        "consola"
                                                                                    )
                                                                                    goNucleoCodicesDesktop()
                                                                                }}
                                                                                accentColor="#FFB800"
                                                                                colorOverride="#FFB800"
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ) : activeAudioPending ? (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmHeadphones
                                                                                }
                                                                                label="·  ·  ·"
                                                                                subLabel="Audiolibro"
                                                                                isDisabled
                                                                                accentColor={
                                                                                    accentColor
                                                                                }
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <HoloCapsuleButton
                                                                                icon={
                                                                                    IconSmHeadphones
                                                                                }
                                                                                label="DESBLOQUEAR"
                                                                                subLabel={
                                                                                    isMember ? (
                                                                                        <PriceLabel
                                                                                            original={
                                                                                                precioAudio ||
                                                                                                "333 MXN"
                                                                                            }
                                                                                            discounted={
                                                                                                precioAudioMiembro ||
                                                                                                "222 MXN"
                                                                                            }
                                                                                        />
                                                                                    ) : (
                                                                                        <>
                                                                                            <span
                                                                                                style={{
                                                                                                    display:
                                                                                                        "block",
                                                                                                    marginBottom:
                                                                                                        "4px",
                                                                                                }}
                                                                                            >
                                                                                                Audiolibro
                                                                                            </span>
                                                                                            <span
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        ".75rem",
                                                                                                    opacity: 0.7,
                                                                                                }}
                                                                                            >
                                                                                                (
                                                                                                {precioAudio ||
                                                                                                    "333 MXN"}

                                                                                                )
                                                                                            </span>
                                                                                        </>
                                                                                    )
                                                                                }
                                                                                href={
                                                                                    checkoutHref(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .audiobookLink,
                                                                                        isMember
                                                                                            ? promoCode
                                                                                            : null,
                                                                                        identity
                                                                                    )
                                                                                }
                                                                                sameTab
                                                                                onBeforeNavigate={() =>
                                                                                    setBookHash(
                                                                                        (
                                                                                            activeNode as any
                                                                                        )
                                                                                            .id,
                                                                                        "consola"
                                                                                    )
                                                                                }
                                                                                accentColor={
                                                                                    accentColor
                                                                                }
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        ))}
                                                                    {aHasPhy && (
                                                                        <HoloCapsuleButton
                                                                            icon={
                                                                                IconSmBox
                                                                            }
                                                                            label="MATERIALIZAR"
                                                                            subLabel="Edición Física"
                                                                            onClick={(
                                                                                e: any
                                                                            ) => {
                                                                                e.stopPropagation()
                                                                                setShowPhyLinks(
                                                                                    true
                                                                                )
                                                                            }}
                                                                            accentColor={
                                                                                accentColor
                                                                            }
                                                                            textColor={
                                                                                textColor
                                                                            }
                                                                        />
                                                                    )}
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    key="phy"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                    }}
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: "10px",
                                                                        flexWrap:
                                                                            "wrap",
                                                                        justifyContent:
                                                                            "center",
                                                                        width: "100%",
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {(
                                                                        (
                                                                            activeNode as any
                                                                        )
                                                                            .physicalLinks ||
                                                                        []
                                                                    ).map(
                                                                        (
                                                                            l: any
                                                                        ) => (
                                                                            <HoloCapsuleButton
                                                                                key={
                                                                                    l.label
                                                                                }
                                                                                icon={
                                                                                    IconSmBox
                                                                                }
                                                                                label="Amazon"
                                                                                subLabel={l.label.replace(
                                                                                    "Amazon ",
                                                                                    ""
                                                                                )}
                                                                                href={
                                                                                    l.href
                                                                                }
                                                                                accentColor={
                                                                                    accentColor
                                                                                }
                                                                                textColor={
                                                                                    textColor
                                                                                }
                                                                            />
                                                                        )
                                                                    )}
                                                                    <motion.button
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                            setShowPhyLinks(
                                                                                false
                                                                            )
                                                                        }}
                                                                        style={{
                                                                            background:
                                                                                "transparent",
                                                                            border: `1px solid ${accentColor}44`,
                                                                            borderRadius:
                                                                                "10px",
                                                                            padding:
                                                                                "8px 14px",
                                                                            color: `${textColor}AA`,
                                                                            cursor: "pointer",
                                                                            fontSize:
                                                                                ".8rem",
                                                                        }}
                                                                        whileHover={{
                                                                            borderColor:
                                                                                accentColor,
                                                                            color: textColor,
                                                                        }}
                                                                    >
                                                                        Volver
                                                                    </motion.button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            <AnimatePresence>
                                <motion.div
                                    key="carousel"
                                    style={{
                                        ...S.pulseCarousel(capsulesOffsetVH),
                                        pointerEvents:
                                            showTextModal || showTrailerModal
                                                ? "none"
                                                : "auto",
                                    }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{
                                        duration: 0.25,
                                        ease: "easeOut",
                                    }}
                                    ref={streamRef}
                                >
                                    <motion.div
                                        style={S.pulseContainer}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {effFiltered.map((book: any) => (
                                            <div
                                                key={book.id}
                                                className={`capsule-node${activeNode?.id === book.id ? " capsule-active" : ""}`}
                                                style={
                                                    {
                                                        ...S.pulseNode(
                                                            capsuleSize
                                                        ),
                                                        ["--cap-color" as any]:
                                                            accentColor,
                                                        ["--cap-bg" as any]:
                                                            hexToRgba(
                                                                accentColor,
                                                                0.33
                                                            ),
                                                        ["--cap-glow1" as any]:
                                                            hexToRgba(
                                                                accentColor,
                                                                0.67
                                                            ),
                                                        ["--cap-glow2" as any]:
                                                            hexToRgba(
                                                                accentColor,
                                                                0.27
                                                            ),
                                                    } as React.CSSProperties
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActiveNode(book)
                                                    setShowPhyLinks(false)
                                                }}
                                            >
                                                <img
                                                    src={
                                                        book.coverUrl ||
                                                        makeFallbackDataUrl(
                                                            book.title,
                                                            book.colorHex
                                                        )
                                                    }
                                                    alt={book.title}
                                                    style={S.pulseImage(
                                                        capsuleSize
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </LayoutGroup>
        <ConfirmarCristalModal
            open={cristalModalD.open}
            kind="codice"
            itemTitle={cristalModalD.book?.title || ""}
            itemSubtitle={
                cristalModalD.formats.length > 0
                    ? cristalModalD.formats
                          .map((f) => f.toUpperCase())
                          .join(" + ")
                    : "El Códice completo"
            }
            countBefore={cristalesD.codiceCount}
            onConfirm={handleCristalConfirmDesktop}
            onCancel={() =>
                setCristalModalD({
                    open: false,
                    book: null,
                    formats: [],
                })
            }
        />
        {/* v1.5 (2026-05-21) — Coreografía de la extracción espejo
           del [LENTE]: ritual overlay 1.6s → success modal autocierra
           en 4.5s o click. Cada uno portaled al body con zIndex max. */}
        <AnimatePresence>
            {cristalRitualOpenD && <DCristalRitualOverlay key="ritual" />}
        </AnimatePresence>
        <DCristalSuccessModal
            open={cristalSuccessD.open}
            bookTitle={cristalSuccessD.title}
            onClose={() =>
                setCristalSuccessD({ open: false, title: "" })
            }
        />
        {/* v1.7 — Muro de pago de Cristales (no se puede canjear).
            Desktop es siempre web → isNative={false}: los no-miembros
            ven Sintonía (PlanSelector) + la compra suelta de 333 MXN. */}
        <CodiceCristalGate
            open={codiceGate.open}
            onClose={() => setCodiceGate({ open: false, book: null })}
            bookTitle={codiceGate.book?.title || "este Códice"}
            isMember={isMemberGate}
            isNative={false}
            onSubscribe={() => setCodicePaywallOpen(true)}
            digitalStripeHref={
                codiceGate.book
                    ? checkoutHref(
                          codiceGate.book.digitalLink,
                          null,
                          identity
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

CodicesDesktop.displayName = "RSV_Co_Desktop"

export default CodicesDesktop
