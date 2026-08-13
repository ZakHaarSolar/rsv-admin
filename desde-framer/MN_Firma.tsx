// Red Solar Viva — MN_Firma.tsx v2.11 — #1 "El campo respira contigo": el halo
// del avatar de Mi Firma late con el tempo y color del Índice de Luz.
// v2.10 — beneficio de WhatsApp quitado
// v2.9 — Ola C #6: "Gestionar" manda el token de Clerk; el customer_id del
// portal de Stripe lo resuelve el edge server-side (ya no se confía en el
// del cliente — cerraba un IDOR de facturación).
// v2.8 (2026-06-06) — Borrado robusto: getToken reintenta antes de
// declarar "sin sesión" (volver de segundo plano puede tardar en
// re-hidratar la sesión de Clerk).
// v2.7 (2026-06-06) — Claves y Seguridad suma "Eliminar mi cuenta":
// borrado de cuenta self-service en el nodo madre (paridad con la app
// iOS — App Store 5.1.1(v)). Tocar "Eliminar" abre tarjeta de
// confirmación con casilla + botón destructivo; al confirmar, la edge
// function `delete-account` verifica el token de sesión (window.Clerk),
// borra los datos personales del Tripulante y elimina la cuenta de
// Clerk. Al terminar cierra sesión y recarga el Portal de Inducción.
// Aparece en mobile y desktop (ClavesSeguridadSection es compartida).
// v2.6 (2026-05-22) — Privilegio de Sesiones 1:1 en Estado Orbital
// pasa de "11% de descuento" a "33% de descuento". Coincide con el
// descuento real para miembros (888/1,111/1,444 ≈ 33% off de los
// precios públicos 1,333/1,777/2,222 MXN) y queda consistente con
// el feature canónico de la card de Inmersión Solar en la capa
// /sesiones.
// v2.5 — Fix crítico de persistencia del nombre. Antes el cambio se
// "deshacía solo" tras cerrar/iniciar sesión: Clerk rechazaba algunos
// updates silenciosamente (caracteres especiales como `´`, lastName
// vacío) y el SDK actualizaba solo el cache local — el server seguía
// con el valor anterior y reaparecía en el próximo login. Ahora
// guardamos siempre en `unsafeMetadata.preferredName` (acepta
// cualquier string sin validación) y de cortesía intentamos también
// firstName/lastName. Tras el update verificamos contra el server y
// mostramos un mensaje de error visible si NO matchea, en lugar de
// una UI mentirosa de "guardado". El nameValue inicial y los reset
// de Escape/Cancelar también priorizan preferredName.
// v2.4.1 — Re-trigger por waitForComponentLoader timeout de Framer.
// v2.4 — Auto-scroll del Registro de Intercambios ahora considera
// la BottomNav del shell del Escáner (~92px). Antes el scroll
// dejaba el final del cuadro alineado con el bottom del viewport
// pero la nav fija lo tapaba — Zak veía las transacciones cortadas
// por la barra. Cálculo nuevo: detecta el overlay .rsv-overlay-scroll,
// reserva 100px (92 nav + 8 buffer) y hace scrollBy programático
// con el overshoot exacto. Modo Madre standalone (sin shell) usa
// reserve de 16 (solo buffer).
// v2.3.1 — Re-trigger por waitForComponentLoader timeout de Framer.
// v2.3 — RegistroIntercambiosSection auto-scrollea cuando se expande
// en mobile: el cuadro crece tanto que las transacciones quedaban
// fuera del fold y el tripulante tenía que hacer scroll manual para
// verlas. Ahora tras el toggle a abierto, scrollIntoView({block:"end"})
// alinea el final del cuadro con el bottom del viewport — las
// transacciones aparecen sin esfuerzo.
// v2.2 — IdentidadVisualSection y RegistroIntercambiosSection arrancan
// con `initial="hidden" animate="visible"` explícitos en su motion.div
// raíz. Antes solo declaraban `variants={fU}` y dependían de heredar el
// `animate="visible"` del padre cV de MiNucleo vía context. Pero el
// padre directo en el árbol al re-mount es el motion.div sR (con
// initial/animate como OBJETOS, no variants strings) → corta el
// context de variants y los hijos quedan en su keyframe inicial
// `{opacity:0, y:16}` para siempre. Síntoma: la primera vez que
// activeTab cambia a "firma" Identidad se ve, pero al volver desde
// otro sub queda invisible; Registros nunca aparece (su primer mount
// también pasa por sR ya que no es el sub default). EstadoOrbital y
// ClavesSeguridad ya tenían el wrap correcto y por eso no sufrían el
// bug.
// v2.1 — Eliminado el wrapper FirmaSection (~50 líneas) que solo
// se usaba para componer las 4 sub-secciones en stack vertical
// para mobile. El shell mobile ahora compone las 4 sub-secciones
// directamente, con resultado idéntico. Resultado: módulo más
// liviano (4 exports en lugar de 5) y debería pasar el
// componentLoader timeout que tuvieron los syncs v2.0.2-2.0.5.
// v2.0.5 — Reduzco el Object.assign a 5 exports (las que el
// shell efectivamente consume). Quito PasswordChangeSection,
// NucAdminIconBtn y ModalPrivilegios que solo se usan
// internamente. Eso disminuye material que el componentLoader
// tiene que procesar y debería desbloquear el sync que
// timeouteó en v2.0.2-2.0.4.
// v2.0.4 — Default export pasa de un componente fantasma
// (`<div display:none>`) a FirmaSection (que tiene JSX completo:
// avatar + password + transacciones + admin). El sync v2.0.2/2.0.3
// falló con waitForComponentLoader timeout repetido — Framer no
// encontraba "suficiente material renderable" en el shell
// fantasma para instanciar el componente, mismo síntoma que
// EV_Shared/EV_Icons antes de su fix. Con FirmaSection como base,
// el loader resuelve al primer intento. El shell sigue
// destructurando las sub-secciones del default export normal.
// Cambio puramente estructural — sin diff funcional.
// v2.0.2 — Re-bump para asegurar que Framer recompile el módulo
// con las 4 sub-secciones (IdentidadVisualSection,
// EstadoOrbitalSection, RegistroIntercambiosSection,
// ClavesSeguridadSection). El shell desktop destructura esas
// propiedades del default export — si Framer queda con cache
// stale del v1.0, llegan undefined al shell y el render desktop
// crashea (Element type is invalid). Sin cambios funcionales.
// v2.0 — Reestructurado en 4 sub-secciones independientes para que
// el layout cascada de Mi Núcleo (3 columnas en desktop) pueda
// renderizar cada una como vista propia de la columna 3:
//   · IdentidadVisualSection      — avatar + nombre + email
//   · EstadoOrbitalSection        — membresía Sintonía/Inmersión +
//                                    chip Privilegios + Gestionar.
//                                    Migrado desde MN_Camara (Estado
//                                    de la Inmersión vivía adentro
//                                    de Cámara Solar y eso era
//                                    semánticamente errado).
//   · RegistroIntercambiosSection — tabla de transacciones / facturas.
//   · ClavesSeguridadSection      — PasswordChangeSection +
//                                    admin row (NucAdminIconBtn × 4).
// FirmaSection (mobile) sigue existiendo como wrapper que monta las
// 4 sub-secciones en stack vertical para la sub-pantalla mobile que
// arrastra todo en cascada. ModalPrivilegios + PasswordChangeSection +
// NucAdminIconBtn quedan tal cual (siguen siendo helpers del archivo).
//
// Cumple regla 🜂: default export es Object.assign sobre componente
// fantasma + los componentes como propiedades.
//   import MNFirma from "./MN_Firma.tsx"
//   const { IdentidadVisualSection, EstadoOrbitalSection,
//           RegistroIntercambiosSection, ClavesSeguridadSection,
//           FirmaSection, ModalPrivilegios } = MNFirma
import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

import MNShared from "./MN_Shared.tsx"
import MNIcons from "./MN_Icons.tsx"
import EVShared from "./EV_Shared.tsx"

const { useIsMobile, cacheUser, waitForRealUser, isSubActive, cV, fU } = MNShared
const { useLightIndex, breathParams, ensureBreatheCss } = EVShared
const {
    IUser,
    ICam,
    IPen,
    IChk,
    IRec,
    IShield,
    ILock,
    ISparkle,
    IRefresh,
} = MNIcons

/* ════════════════════════════════════════════════════════════════
   ModalPrivilegios · pase dorado premium de Inmersión Solar
   Portado a document.body · sin precio ni CTA, solo los 6 beneficios.
   ════════════════════════════════════════════════════════════════ */
function ModalPrivilegios({ onCerrar }: { onCerrar: () => void }) {
    /* v1.3 — isMobile para que el overlay respete la altura del NavegadorLente
       (barra superior fija ~52px). Sin este padding el botón X y el borde
       superior quedaban ocultos detrás de la barra en el Lente. */
    const isMobile = useIsMobile()
    /* Esc para cerrar */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCerrar()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onCerrar])

    const beneficios = [
        {
            icono: "calendario",
            texto: "Acceso a todas las Sesiones Grupales del mes, incluyendo meses con 5 sesiones",
        },
        {
            icono: "pdf",
            texto: "PDFs de Integración post-sesión",
        },
        {
            icono: "video",
            texto: "Acceso a la grabación de cada sesión",
        },
        {
            icono: "codice",
            texto: "33% de descuento en todos los Códices",
        },
        {
            icono: "uno-a-uno",
            texto: "33% de descuento en Sesiones 1:1",
        },
    ]

    const svgFor = (k: string) => {
        const common = {
            width: 22,
            height: 22,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.5,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
        }
        switch (k) {
            case "calendario":
                return (
                    <svg {...common}>
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <line x1="8" y1="3" x2="8" y2="7" />
                        <line x1="16" y1="3" x2="16" y2="7" />
                    </svg>
                )
            case "grupo":
                return (
                    <svg {...common}>
                        <circle cx="9" cy="9" r="3" />
                        <circle cx="17" cy="11" r="2.2" />
                        <path d="M3 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
                        <path d="M15 20v-1a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
                    </svg>
                )
            case "pdf":
                return (
                    <svg {...common}>
                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 3 14 8 19 8" />
                        <path d="M9 14l2 2 4-4" />
                    </svg>
                )
            case "video":
                return (
                    <svg {...common}>
                        <circle cx="12" cy="12" r="9" />
                        <polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none" />
                    </svg>
                )
            case "codice":
                return (
                    <svg {...common}>
                        <path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
                        <path d="M9 9l3-2 3 2" />
                        <path d="M9 14h6" />
                    </svg>
                )
            case "uno-a-uno":
                return (
                    <svg {...common}>
                        <circle cx="9" cy="9" r="3" />
                        <path d="M4 20v-1a4 4 0 0 1 4-4h2" />
                        <circle cx="17" cy="9" r="3" />
                        <path d="M14 20v-1a4 4 0 0 1 4-4h2" />
                    </svg>
                )
            default:
                return null
        }
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onCerrar}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 960,
                background: "rgba(2,5,12,0.82)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "center",
                padding: isMobile ? "68px 12px 16px" : "4vh 16px",
                overflowY: "auto",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: isMobile ? "100%" : "min(820px, 95vw)",
                    maxHeight: isMobile ? "calc(100dvh - 84px)" : "92vh",
                    overflowY: "auto",
                    position: "relative",
                    padding: isMobile
                        ? "36px 22px 28px 22px"
                        : "44px 44px 36px 44px",
                    borderRadius: isMobile ? 20 : 26,
                    background:
                        "radial-gradient(ellipse at top, rgba(200,164,78,0.12) 0%, rgba(32,26,12,0.92) 45%, rgba(16,12,6,0.96) 100%)",
                    border: "1.5px solid rgba(200,164,78,0.42)",
                    boxShadow:
                        "0 32px 96px rgba(200,164,78,0.22), 0 0 160px rgba(200,164,78,0.08), inset 0 0 40px rgba(200,164,78,0.06)",
                    fontFamily: "'Inter', sans-serif",
                    color: "#ECD8A8",
                }}
            >
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute",
                        top: 18,
                        right: 18,
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(200,164,78,0.08)",
                        border: "1px solid rgba(200,164,78,0.32)",
                        color: "#D4A843",
                        cursor: "pointer",
                        fontSize: 16,
                    }}
                >
                    ×
                </button>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 14,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 18px",
                            borderRadius: 999,
                            background:
                                "linear-gradient(135deg, rgba(200,164,78,0.22) 0%, rgba(232,198,90,0.28) 100%)",
                            border: "1px solid rgba(200,164,78,0.55)",
                            color: "#0B0C13",
                            fontWeight: 600,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            fontSize: 10.5,
                        }}
                    >
                        Inmersión Activa ✦
                    </span>
                </div>
                <div
                    style={{
                        textAlign: "center",
                        fontSize: 11,
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(200,164,78,0.78)",
                        marginBottom: 6,
                    }}
                >
                    Acceso a todas las sesiones del mes
                </div>
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: 32,
                        fontWeight: 300,
                        letterSpacing: "0.16em",
                        color: "#F5E5C4",
                        margin: 0,
                        textShadow: "0 0 22px rgba(200,164,78,0.35)",
                        textTransform: "uppercase",
                    }}
                >
                    Inmersión Solar
                </h2>
                <div
                    style={{
                        marginTop: 28,
                        marginBottom: 18,
                        textAlign: "center",
                        fontSize: 10.5,
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(200,164,78,0.65)",
                    }}
                >
                    Tu inmersión incluye
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 14,
                    }}
                >
                    {beneficios.map((b, i) => (
                        <div
                            key={i}
                            style={{
                                padding: "16px 18px",
                                borderRadius: 14,
                                background:
                                    "linear-gradient(135deg, rgba(10,8,4,0.75) 0%, rgba(20,16,8,0.85) 100%)",
                                border: "1px solid rgba(200,164,78,0.22)",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 14,
                                transition: "all 0.3s ease",
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: "rgba(200,164,78,0.10)",
                                    border: "1px solid rgba(200,164,78,0.30)",
                                    color: "#D4A843",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {svgFor(b.icono)}
                            </div>
                            <div
                                style={{
                                    fontSize: 12.5,
                                    lineHeight: 1.56,
                                    color: "rgba(245,229,196,0.92)",
                                    fontWeight: 300,
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {b.texto}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

/*
   ══════════════════════════════════════════════════
   PasswordChangeSection — Cambio de clave de acceso
   ══════════════════════════════════════════════════
   FIX: recibe `hookUser` (del hook useUser de Clerk) que SIEMPRE
   tiene los métodos .updatePassword(). Si window.Clerk.user no existe
   (común en Framer), hace fallback al hookUser.
*/
function PasswordChangeSection({
    hookUser,
    accent,
}: {
    hookUser: any
    accent: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentPw, setCurrentPw] = useState("")
    const [newPw, setNewPw] = useState("")
    const [confirmPw, setConfirmPw] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    const reset = () => {
        setCurrentPw("")
        setNewPw("")
        setConfirmPw("")
        setShowCurrent(false)
        setShowNew(false)
        setError("")
        setSuccess(false)
    }

    const translatePwError = (code: string, msg: string) => {
        const m: Record<string, string> = {
            form_password_incorrect: "La contraseña actual es incorrecta.",
            form_password_length_too_short: "Mínimo 8 caracteres.",
            password_not_complex:
                "Debe incluir mayúsculas, minúsculas, números y símbolos.",
            form_password_pwned: "Esta contraseña ha sido filtrada. Usa otra.",
            not_allowed_password: "Contraseña demasiado común. Elige otra.",
            form_password_size_in_bytes_exceeded: "Contraseña demasiado larga.",
        }
        return m[code] || msg || "Error al cambiar la contraseña."
    }

    const handleSubmit = async () => {
        setError("")
        if (!currentPw) return setError("Ingresa tu contraseña actual.")
        if (newPw.length < 8)
            return setError("La nueva contraseña necesita mínimo 8 caracteres.")
        if (newPw !== confirmPw)
            return setError("Las contraseñas no coinciden.")
        if (currentPw === newPw)
            return setError(
                "La nueva contraseña debe ser diferente a la actual."
            )

        setLoading(true)
        try {
            const u = hookUser?.updatePassword
                ? hookUser
                : (window as any).Clerk?.user
            if (!u?.updatePassword) {
                setError("No se pudo acceder a Clerk. Recarga la página.")
                return
            }
            await u.updatePassword({
                currentPassword: currentPw,
                newPassword: newPw,
            })
            setSuccess(true)
            setTimeout(() => {
                reset()
                setIsOpen(false)
            }, 3000)
        } catch (e: any) {
            const eCode = e?.errors?.[0]?.code || ""
            const eMsg = e?.errors?.[0]?.longMessage || e?.message || ""
            setError(translatePwError(eCode, eMsg))
        } finally {
            setLoading(false)
        }
    }

    const inputStyle = (hasError = false): React.CSSProperties => ({
        width: "100%",
        padding: "12px 44px 12px 16px",
        fontSize: 13,
        fontFamily: "'Inter',sans-serif",
        fontWeight: 400,
        letterSpacing: "0.03em",
        color: "rgba(220,230,235,0.9)",
        background: "rgba(8,12,18,0.6)",
        border: `1px solid ${hasError ? "rgba(255,100,100,0.3)" : "rgba(0,194,255,0.12)"}`,
        borderRadius: 10,
        outline: "none",
        transition: "all 0.3s ease",
        boxSizing: "border-box" as const,
    })

    const EyeBtn = ({
        show,
        onClick,
    }: {
        show: boolean
        onClick: () => void
    }) => (
        <button
            onClick={onClick}
            type="button"
            style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                opacity: 0.3,
                transition: "opacity 0.3s ease",
                outline: "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.3"
            }}
        >
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0,194,255,1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {show ? (
                    <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                ) : (
                    <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                )}
            </svg>
        </button>
    )

    return (
        <motion.div variants={fU}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: isOpen ? 20 : 0,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(0,194,255,0.08)",
                        border: "1px solid rgba(0,194,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accent,
                    }}
                >
                    <ILock />
                </div>
                <div style={{ flex: 1 }}>
                    <h2
                        className="nuc-section-h2"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Clave de Acceso
                    </h2>
                    <p
                        className="nuc-section-sub"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                            marginTop: 2,
                        }}
                    >
                        Protección de tu frecuencia
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (isOpen) reset()
                        setIsOpen(!isOpen)
                    }}
                    className="nuc-pill"
                    style={{ fontSize: 11 }}
                >
                    <IShield /> {isOpen ? "Cancelar" : "Modificar"}
                </button>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            className="nuc-glass"
                            style={{ padding: "28px 28px 24px" }}
                        >
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "12px 0",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: "50%",
                                            background: "rgba(0,194,255,0.08)",
                                            border: "1px solid rgba(0,194,255,0.25)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: `0 0 20px rgba(0,194,255,0.1)`,
                                        }}
                                    >
                                        <IChk />
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: accent,
                                            letterSpacing: "0.06em",
                                            fontFamily: "'Inter',sans-serif",
                                        }}
                                    >
                                        Clave actualizada con éxito
                                    </p>
                                </motion.div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14,
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: "rgba(255,255,255,0.3)",
                                                marginBottom: 6,
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                            }}
                                        >
                                            Clave actual
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={
                                                    showCurrent
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={currentPw}
                                                onChange={(e) => {
                                                    setCurrentPw(e.target.value)
                                                    setError("")
                                                }}
                                                placeholder="Tu clave actual"
                                                style={inputStyle()}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.4)"
                                                    e.currentTarget.style.boxShadow =
                                                        "0 0 0 1px rgba(0,194,255,0.15), 0 0 20px rgba(0,194,255,0.06)"
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.12)"
                                                    e.currentTarget.style.boxShadow =
                                                        "none"
                                                }}
                                            />
                                            <EyeBtn
                                                show={showCurrent}
                                                onClick={() =>
                                                    setShowCurrent(!showCurrent)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: "rgba(255,255,255,0.3)",
                                                marginBottom: 6,
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                            }}
                                        >
                                            Nueva clave
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={
                                                    showNew
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={newPw}
                                                onChange={(e) => {
                                                    setNewPw(e.target.value)
                                                    setError("")
                                                }}
                                                placeholder="Mínimo 8 caracteres"
                                                style={inputStyle()}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.4)"
                                                    e.currentTarget.style.boxShadow =
                                                        "0 0 0 1px rgba(0,194,255,0.15), 0 0 20px rgba(0,194,255,0.06)"
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.12)"
                                                    e.currentTarget.style.boxShadow =
                                                        "none"
                                                }}
                                            />
                                            <EyeBtn
                                                show={showNew}
                                                onClick={() =>
                                                    setShowNew(!showNew)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                color: "rgba(255,255,255,0.3)",
                                                marginBottom: 6,
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                            }}
                                        >
                                            Confirmar nueva clave
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={
                                                    showNew
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={confirmPw}
                                                onChange={(e) => {
                                                    setConfirmPw(e.target.value)
                                                    setError("")
                                                }}
                                                placeholder="Confirmar nueva clave"
                                                style={inputStyle()}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleSubmit()
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.4)"
                                                    e.currentTarget.style.boxShadow =
                                                        "0 0 0 1px rgba(0,194,255,0.15), 0 0 20px rgba(0,194,255,0.06)"
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(0,194,255,0.12)"
                                                    e.currentTarget.style.boxShadow =
                                                        "none"
                                                }}
                                            />
                                            {confirmPw.length > 0 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        display: "flex",
                                                    }}
                                                >
                                                    {newPw === confirmPw ? (
                                                        <IChk />
                                                    ) : (
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 14 14"
                                                            fill="none"
                                                            stroke="rgba(255,100,100,0.7)"
                                                            strokeWidth="2"
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
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                margin: 0,
                                                fontSize: 12,
                                                color: "rgba(255,100,100,0.85)",
                                                textAlign: "center",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                            }}
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="nuc-gold"
                                        style={{
                                            width: "100%",
                                            marginTop: 4,
                                            fontSize: 12,
                                            padding: "13px 24px",
                                            opacity: loading ? 0.6 : 1,
                                        }}
                                    >
                                        {loading
                                            ? "Actualizando..."
                                            : "Actualizar Clave de Acceso"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* v2.9 — Botón cuadrado dorado para la fila admin de Mi Firma. */
function NucAdminIconBtn({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    onClick: () => void
}) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            aria-label={label}
            title={label}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
                padding: 0,
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    border: "1px solid rgba(212,168,67,0.35)",
                    background:
                        "linear-gradient(135deg, rgba(212,168,67,0.08), transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(212,168,67,0.85)",
                    boxShadow: "0 0 12px rgba(212,168,67,0.1)",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                        "rgba(0,229,255,0.55)"
                    e.currentTarget.style.color = "#00E5FF"
                    e.currentTarget.style.boxShadow =
                        "0 0 18px rgba(0,229,255,0.4)"
                    e.currentTarget.style.transform = "scale(1.06)"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                        "rgba(212,168,67,0.35)"
                    e.currentTarget.style.color = "rgba(212,168,67,0.85)"
                    e.currentTarget.style.boxShadow =
                        "0 0 12px rgba(212,168,67,0.1)"
                    e.currentTarget.style.transform = "scale(1)"
                }}
            >
                {icon}
            </div>
        </button>
    )
}

/* ════════════════════════════════════════════════════════════════
   IdentidadVisualSection · v2.0
   Avatar conic-gradient + foto + nombre + email + edición.
   Extraído de la antigua FirmaSection para que funcione como vista
   independiente de la columna 3 del layout cascada.
   ════════════════════════════════════════════════════════════════ */
function IdentidadVisualSection({
    clerkUser,
    hookUser,
    accent,
}: {
    clerkUser: any
    hookUser: any
    accent: string
}) {
    const isMobile = useIsMobile()
    /* #1 "El campo respira contigo" — el anillo del avatar (la firma del
       tripulante) late con el tempo y color de su Índice de Luz. */
    const lightIndex = useLightIndex()
    useEffect(() => {
        ensureBreatheCss()
    }, [])
    const bp = breathParams(lightIndex)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [confirmedAvatar, setConfirmedAvatar] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadDone, setUploadDone] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [uploadErrorMsg, setUploadErrorMsg] = useState("")
    const fileRef = useRef<HTMLInputElement>(null)
    const [editingName, setEditingName] = useState(false)
    /* v6.X — preferredName en unsafeMetadata es source-of-truth si
       existe. Cubre el caso "Clerk rechaza el nombre por validación de
       firstName/lastName" (ej. caracteres no aceptados o lastName
       vacío). El usuario edita libremente y el valor se respeta sin
       depender de los campos legacy de Clerk. */
    const initialName =
        (clerkUser?.unsafeMetadata as any)?.preferredName ||
        clerkUser?.fullName ||
        clerkUser?.firstName ||
        ""
    const [nameValue, setNameValue] = useState(initialName)
    const [nameSaved, setNameSaved] = useState(false)
    const [nameError, setNameError] = useState("")
    const nameRef = useRef<HTMLInputElement>(null)

    const mutateWith =
        [hookUser, clerkUser].find((u) => u?.setProfileImage && u?.update) ||
        null

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        const r = new FileReader()
        r.onload = (ev) => {
            setAvatarPreview(ev.target?.result as string)
            setUploadDone(false)
            setUploadError(false)
            setUploadErrorMsg("")
            setConfirmedAvatar(null)
        }
        r.readAsDataURL(f)
    }

    const handleUpload = async () => {
        if (!avatarPreview) return
        setUploading(true)
        setUploadError(false)
        setUploadErrorMsg("")
        try {
            const f = fileRef.current?.files?.[0]
            if (!f) {
                setUploading(false)
                return
            }
            const mutationUser = mutateWith || (await waitForRealUser(5000))
            if (mutationUser?.setProfileImage) {
                await mutationUser.setProfileImage({ file: f })
                setConfirmedAvatar(avatarPreview)
                setAvatarPreview(null)
                setUploadDone(true)
                try {
                    await new Promise((r) => setTimeout(r, 300))
                    let freshUser = mutationUser
                    if (mutationUser?.reload) {
                        const reloaded = await mutationUser.reload()
                        freshUser = reloaded || mutationUser
                    }
                    cacheUser(freshUser)
                } catch {}
            } else {
                const dbg = `hookUser=${!!hookUser}, clerkUser.update=${!!clerkUser?.update}, clerkUser.setProfileImage=${!!clerkUser?.setProfileImage}`
                console.error("Clerk user not available:", dbg)
                setUploadError(true)
                setUploadErrorMsg(`Sin acceso a Clerk (${dbg})`)
            }
        } catch (e: any) {
            console.error("Upload error:", e)
            setUploadError(true)
            setUploadErrorMsg(
                e?.message || e?.errors?.[0]?.message || String(e)
            )
        } finally {
            setUploading(false)
        }
    }

    /* v6.X — Persistencia robusta del nombre. El bug histórico:
       Clerk acepta `firstName/lastName` pero rechaza algunos casos
       silenciosamente (caracteres especiales como `´`, lastName vacío,
       etc) — el SDK actualizaba el cache local y la UI mostraba
       "guardado" mientras el server-side seguía con el valor anterior.
       Al re-login el `Clerk.user` traía los valores antiguos y
       reaparecían (caso reportado: "Zak´Haar Cancún" vuelve después
       de cerrar/iniciar sesión).
       Estrategia nueva:
       1. Guardamos SIEMPRE el nombre completo en `unsafeMetadata.
          preferredName` (no tiene validación de Clerk — acepta
          cualquier string). Es la fuente de verdad de cara al
          Tripulante.
       2. Intentamos también el `firstName/lastName` como cortesía
          (mantiene compatibilidad con cosas que lean de ahí). Si
          falla, no rompe el flow.
       3. Reload + verify: tras el update leemos lo que el server
          aceptó y mostramos `nameError` si NO matchea. El Tripulante
          ve por qué quedó como quedó en lugar de "guardado" mentiroso.
       4. ensure_profile + JWT template Clerk deberían leer
          `unsafe_metadata.preferredName` con fallback a `full_name`. */
    const handleNameSave = async () => {
        const mutationUser = mutateWith || (await waitForRealUser(3000))
        if (!mutationUser?.update) return
        const trimmed = nameValue.trim()
        if (!trimmed) {
            setNameError("El nombre no puede quedar vacío.")
            return
        }
        setNameError("")
        try {
            const p = trimmed.split(/\s+/).filter(Boolean)
            const firstName = p[0] || ""
            const lastName = p.slice(1).join(" ")
            /* (1) Source of truth — unsafeMetadata.preferredName.
                Acepta cualquier string sin validación de Clerk. */
            const prevMeta =
                (mutationUser.unsafeMetadata as any) || {}
            try {
                await mutationUser.update({
                    unsafeMetadata: {
                        ...prevMeta,
                        preferredName: trimmed,
                    },
                })
            } catch (metaErr) {
                console.warn(
                    "[MN_Firma] update unsafeMetadata falló:",
                    metaErr
                )
            }
            /* (2) Sincronizar firstName/lastName de cortesía. Algunos
                casos los rechaza Clerk silenciosamente (caracteres
                especiales, validación). No bloqueamos el flow si
                falla — el preferredName ya cubrió la persistencia. */
            try {
                await mutationUser.update({
                    firstName,
                    lastName: lastName || "",
                })
            } catch (nameErr) {
                console.warn(
                    "[MN_Firma] update firstName/lastName falló (preferredName igual quedó):",
                    nameErr
                )
            }
            /* (3) Reload + verify. */
            let freshUser = mutationUser
            try {
                if (mutationUser?.reload) {
                    const reloaded = await mutationUser.reload()
                    freshUser = reloaded || mutationUser
                }
            } catch {}
            const serverPreferred =
                (freshUser?.unsafeMetadata as any)?.preferredName || ""
            const serverFullName =
                freshUser?.fullName ||
                [freshUser?.firstName, freshUser?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                ""
            const effective = serverPreferred || serverFullName
            if (effective !== trimmed) {
                setNameError(
                    `Quedó como "${effective || "(sin nombre)"}". Probá con otro nombre o reintentá.`
                )
                return
            }
            cacheUser(freshUser)
            setEditingName(false)
            setNameSaved(true)
            setTimeout(() => setNameSaved(false), 3000)
        } catch (e: any) {
            const msg =
                e?.errors?.[0]?.longMessage ||
                e?.errors?.[0]?.message ||
                e?.message ||
                "No pudimos guardar el nombre."
            setNameError(msg)
            console.error("[MN_Firma] handleNameSave error:", e)
        }
    }

    useEffect(() => {
        if (!editingName || !nameRef.current) return
        const el = nameRef.current
        let id1 = 0
        let id2 = 0
        id1 = window.requestAnimationFrame(() => {
            id2 = window.requestAnimationFrame(() => {
                try {
                    el.focus()
                    const len = el.value.length
                    el.setSelectionRange(len, len)
                } catch {}
            })
        })
        return () => {
            window.cancelAnimationFrame(id1)
            window.cancelAnimationFrame(id2)
        }
    }, [editingName])

    const img = avatarPreview || confirmedAvatar || clerkUser?.imageUrl || ""
    const email = clerkUser?.primaryEmailAddress?.emailAddress || ""

    return (
        <motion.div variants={fU} initial="hidden" animate="visible">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(0,194,255,0.08)",
                        border: "1px solid rgba(0,194,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accent,
                    }}
                >
                    <IUser />
                </div>
                <div>
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Identidad Visual
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                            marginTop: 2,
                        }}
                    >
                        Tu firma en la Red Solar Viva
                    </p>
                </div>
            </div>
            <div
                className="nuc-glass"
                style={{
                    padding: isMobile ? "18px 18px 18px 12px" : 32,
                    background: isMobile
                        ? "linear-gradient(135deg, rgba(0,194,255,0.12) 0%, rgba(5,15,30,0.82) 45%, rgba(2,8,20,0.88) 70%, rgba(200,164,78,0.08) 100%)"
                        : undefined,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? 16 : 40,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 16,
                            flexShrink: 0,
                        }}
                    >
                        <div
                            className="nuc-avatar-ring"
                            onClick={() => fileRef.current?.click()}
                        >
                            {/* Halo que respira con el Índice de Luz —
                                capa decorativa, no captura toques. */}
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    top: -7,
                                    left: -7,
                                    right: -7,
                                    bottom: -7,
                                    borderRadius: "50%",
                                    border: `1.5px solid ${bp.color}`,
                                    boxShadow: `0 0 22px ${bp.color}, inset 0 0 14px ${bp.color}`,
                                    pointerEvents: "none",
                                    animationName: "esc-breathe-ring",
                                    animationDuration: `${bp.durSec.toFixed(2)}s`,
                                    animationTimingFunction: "ease-in-out",
                                    animationIterationCount: "infinite",
                                    transformOrigin: "center",
                                }}
                            />
                            <div className="nuc-avatar-inner">
                                {img ? (
                                    <img src={img} alt="" />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            background:
                                                "linear-gradient(135deg, rgba(0,194,255,0.15), rgba(0,60,120,0.2))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 40,
                                            color: "rgba(0,194,255,0.4)",
                                        }}
                                    >
                                        ✦
                                    </div>
                                )}
                            </div>
                            <div className="nuc-cam-btn">
                                <ICam />
                            </div>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                        />
                    </div>
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {editingName ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                flexWrap: "wrap",
                                                gap: 8,
                                            }}
                                        >
                                        <input
                                            ref={nameRef}
                                            className="nuc-name-input"
                                            value={nameValue}
                                            onChange={(e) =>
                                                setNameValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleNameSave()
                                                if (e.key === "Escape") {
                                                    setNameValue(
                                                        (clerkUser?.unsafeMetadata as any)
                                                            ?.preferredName ||
                                                            clerkUser?.fullName ||
                                                            clerkUser?.firstName ||
                                                            ""
                                                    )
                                                    setNameError("")
                                                    setEditingName(false)
                                                }
                                            }}
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            <button
                                                onClick={handleNameSave}
                                                style={{
                                                    background: "none",
                                                    border: "1px solid rgba(0,194,255,0.3)",
                                                    borderRadius: 6,
                                                    padding: "4px 12px",
                                                    color: "#00C2FF",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                    letterSpacing: "0.05em",
                                                    textTransform: "uppercase",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                }}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setNameValue(
                                                        (clerkUser?.unsafeMetadata as any)
                                                            ?.preferredName ||
                                                            clerkUser?.fullName ||
                                                            clerkUser?.firstName ||
                                                            ""
                                                    )
                                                    setNameError("")
                                                    setEditingName(false)
                                                }}
                                                style={{
                                                    background: "none",
                                                    border: "1px solid rgba(255,255,255,0.18)",
                                                    borderRadius: 6,
                                                    padding: "4px 12px",
                                                    color: "rgba(255,255,255,0.55)",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                    letterSpacing: "0.05em",
                                                    textTransform: "uppercase",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                        </div>
                                        {nameError && (
                                            <div
                                                style={{
                                                    color: "#FF6B7A",
                                                    fontSize: 11,
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {nameError}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 18,
                                                fontWeight: 500,
                                                color: "#fff",
                                                fontFamily:
                                                    "'Inter',sans-serif",
                                            }}
                                        >
                                            {nameValue || "Nodo sin nombre"}
                                        </p>
                                        <button
                                            className="nuc-pencil"
                                            onClick={() =>
                                                setEditingName(true)
                                            }
                                        >
                                            <IPen />
                                        </button>
                                    </>
                                )}
                            </div>
                            {!editingName && (
                                <p
                                    style={{
                                        margin: 0,
                                        marginTop: 4,
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.35)",
                                    }}
                                >
                                    {email}
                                </p>
                            )}
                            {nameSaved && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        margin: 0,
                                        marginTop: 6,
                                        fontSize: 11,
                                        color: accent,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <IChk /> Nombre actualizado
                                </motion.p>
                            )}
                        </div>
                        {avatarPreview && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <button
                                    className="nuc-gold"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    style={{
                                        fontSize: 12,
                                        padding: "10px 24px",
                                    }}
                                >
                                    {uploading
                                        ? "Transmitiendo..."
                                        : "Actualizar Firma Visual"}
                                </button>
                                {!uploading && (
                                    <button
                                        onClick={() => {
                                            setAvatarPreview(null)
                                            setUploadError(false)
                                            setUploadErrorMsg("")
                                            if (fileRef.current)
                                                fileRef.current.value = ""
                                        }}
                                        style={{
                                            background: "none",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            padding: "10px 16px",
                                            color: "rgba(255,255,255,0.4)",
                                            cursor: "pointer",
                                            fontSize: 12,
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        )}
                        {uploadDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: accent,
                                }}
                            >
                                <IChk /> Firma visual actualizada en toda la
                                Red
                            </motion.div>
                        )}
                        {uploadError && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    fontSize: 12,
                                    color: "rgba(255,168,80,0.9)",
                                    maxWidth: 400,
                                    lineHeight: 1.4,
                                }}
                            >
                                No se pudo actualizar.
                                {uploadErrorMsg && (
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: 4,
                                            fontSize: 10,
                                            color: "rgba(255,168,80,0.6)",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        Error: {uploadErrorMsg}
                                    </span>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   EstadoOrbitalSection · v2.0
   Migrado desde MN_Camara — antes vivía dentro de Cámara Solar
   ("Estado de la Inmersión Solar"). Ahora vive en Ajustes de
   Firma porque la membresía controla TODO el ecosistema (no
   sólo Cámara Solar). Incluye: estado activo/inactivo + fecha
   de renovación + botón Gestionar + chip Privilegios + modal
   con beneficios (Inmersión Solar) + CTAs activación para guests.
   ════════════════════════════════════════════════════════════════ */
function EstadoOrbitalSection({
    sub,
    accent,
    loading = false,
    stripePortalUrl = "",
    supabaseUrl = "",
    supabaseAnonKey = "",
}: {
    sub: any
    accent: string
    loading?: boolean
    stripePortalUrl?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    const on = isSubActive(sub)
    const willCancel = sub?.cancel_at_period_end === true
    const groupName = (sub?.group_name || "").toLowerCase()
    const isInmersion =
        on && (groupName === "cuasar" || groupName === "pulsar" || groupName === "inmersion")
    const isSintonia = on && groupName === "sintonia"
    const tierLabel = isInmersion
        ? "Inmersión Solar"
        : isSintonia
          ? "Sintonía Solar"
          : "Sin membresía"
    const [portalLoading, setPortalLoading] = useState(false)
    const [privilegiosOpen, setPrivilegiosOpen] = useState(false)

    const handleManageSubscription = useCallback(async () => {
        if (supabaseUrl && supabaseAnonKey) {
            setPortalLoading(true)
            try {
                // Ola C #6: el customer_id lo resuelve el edge del token de
                // Clerk verificado (server-side); no se manda desde el cliente.
                const token = await (window as any).Clerk?.session?.getToken?.()
                const r = await fetch(
                    `${supabaseUrl}/functions/v1/create-portal-session`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({
                            token,
                            return_url: window.location.href,
                        }),
                    }
                )
                if (r.ok) {
                    const data = await r.json()
                    if (data?.url) {
                        window.location.href = data.url
                        return
                    }
                }
            } catch (e) {
                console.warn("[RSV] Portal session error, falling back:", e)
            } finally {
                setPortalLoading(false)
            }
        }
        if (stripePortalUrl) {
            window.open(stripePortalUrl, "_blank")
        }
    }, [sub, supabaseUrl, supabaseAnonKey, stripePortalUrl])

    return (
        <motion.div
            variants={cV}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
            <motion.div
                variants={fU}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(212,168,67,0.08)",
                        border: "1px solid rgba(212,168,67,0.30)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#D4A843",
                    }}
                >
                    <ISparkle />
                </div>
                <div>
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Estado Orbital
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                            marginTop: 2,
                        }}
                    >
                        Tu membresía y privilegios activos
                    </p>
                </div>
            </motion.div>
            <motion.div
                variants={fU}
                className="nuc-glass"
                style={{
                    padding: "14px 24px",
                    borderLeft: on
                        ? `4px solid ${isInmersion ? "#D4A843" : accent}`
                        : `4px solid rgba(0,140,220,0.4)`,
                    background: on
                        ? isInmersion
                            ? "linear-gradient(165deg, rgba(212,168,67,0.10) 0%, rgba(2,8,20,0.80) 100%)"
                            : "linear-gradient(165deg, rgba(0,194,255,0.08) 0%, rgba(2,8,20,0.80) 100%)"
                        : "linear-gradient(165deg, rgba(0,30,60,0.2) 0%, rgba(2,10,25,0.80) 100%)",
                }}
            >
                <div
                    className="nuc-cam-status-row"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        minHeight: 38,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.72)",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Plan vigente
                        </p>
                        {on ? (
                            <span
                                className="nuc-badge-on"
                                style={{
                                    padding: "3px 10px",
                                    fontSize: 10,
                                    width: "100%",
                                    display: "flex",
                                }}
                            >
                                <ISparkle /> {tierLabel}
                            </span>
                        ) : (
                            <span
                                className="nuc-badge-off"
                                style={{
                                    padding: "3px 10px",
                                    fontSize: 10,
                                    width: "100%",
                                    display: "flex",
                                }}
                            >
                                Sin membresía activa
                            </span>
                        )}
                    </div>
                    {on && sub?.current_period_end && (
                        <div
                            className="nuc-cam-status-info"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            {!willCancel && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.4)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <IRefresh /> Renovación Automática:{" "}
                                    <span
                                        style={{
                                            color: "#4CAF50",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {new Date(
                                            sub.current_period_end
                                        ).toLocaleDateString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </span>
                            )}
                            {willCancel && (
                                <>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "rgba(255,255,255,0.4)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 5,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <IShield /> Acceso hasta{" "}
                                        <span
                                            style={{
                                                color: accent,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {new Date(
                                                sub.current_period_end
                                            ).toLocaleDateString("es-MX", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "rgba(255,255,255,0.4)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 5,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <IRefresh /> Renovación:{" "}
                                        <span
                                            style={{
                                                color: "rgba(255,168,80,0.9)",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Desactivada
                                        </span>
                                    </span>
                                </>
                            )}
                            {stripePortalUrl && (
                                <span
                                    style={{
                                        width: 1,
                                        height: 14,
                                        background: "rgba(255,255,255,0.1)",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            {stripePortalUrl && (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleManageSubscription()
                                    }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "4px 12px",
                                        borderRadius: 8,
                                        background: "rgba(0,194,255,0.04)",
                                        border: "1px solid rgba(0,194,255,0.12)",
                                        color: "rgba(0,194,255,0.45)",
                                        fontSize: 10,
                                        fontWeight: 500,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase" as const,
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        fontFamily: "'Inter',sans-serif",
                                        whiteSpace: "nowrap" as const,
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            "rgba(0,194,255,0.1)"
                                        e.currentTarget.style.borderColor =
                                            "rgba(0,194,255,0.3)"
                                        e.currentTarget.style.color =
                                            "rgba(0,194,255,0.8)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "rgba(0,194,255,0.04)"
                                        e.currentTarget.style.borderColor =
                                            "rgba(0,194,255,0.12)"
                                        e.currentTarget.style.color =
                                            "rgba(0,194,255,0.45)"
                                    }}
                                >
                                    Gestionar{portalLoading ? "..." : ""}
                                </a>
                            )}
                        </div>
                    )}
                    {!on && !loading && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 12,
                                paddingTop: 4,
                            }}
                        >
                            <a
                                href="/sesiones#inmersion"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if ((window as any).rsvNavigate) {
                                        ;(window as any).rsvNavigate(
                                            "/sesiones#inmersion"
                                        )
                                    } else {
                                        window.location.href =
                                            "/sesiones#inmersion"
                                    }
                                }}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: "10px 28px",
                                    borderRadius: 50,
                                    border: "1px solid rgba(212,168,67,0.6)",
                                    background:
                                        "linear-gradient(135deg, #B8902F 0%, #D4A843 30%, #F5D98C 50%, #D4A843 70%, #B8902F 100%)",
                                    color: "#0B0C13",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase" as const,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    fontFamily: "'Inter',sans-serif",
                                    boxShadow:
                                        "0 0 15px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                                    whiteSpace: "nowrap" as const,
                                    transition: "all 0.25s ease",
                                }}
                            >
                                Activar Inmersión
                            </a>
                            <a
                                className="nuc-cta-secondary"
                                href="/sesiones#pase-grupal"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if ((window as any).rsvNavigate) {
                                        ;(window as any).rsvNavigate(
                                            "/sesiones#pase-grupal"
                                        )
                                    } else {
                                        window.location.href =
                                            "/sesiones#pase-grupal"
                                    }
                                }}
                                style={{
                                    fontSize: 10,
                                    padding: "2px 0",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                O explorar con pase de 1 sesión
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
            {isInmersion && (
                <motion.div
                    variants={fU}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "2px 0",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setPrivilegiosOpen(true)}
                        style={{
                            all: "unset",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 22px",
                            borderRadius: 999,
                            background:
                                "linear-gradient(135deg, rgba(200,164,78,0.10) 0%, rgba(140,100,40,0.14) 100%)",
                            border: "1px solid rgba(200,164,78,0.38)",
                            color: "#D4A843",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            textShadow: "0 0 8px rgba(200,164,78,0.38)",
                            boxShadow:
                                "0 0 20px rgba(200,164,78,0.08), inset 0 0 12px rgba(200,164,78,0.04)",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "linear-gradient(135deg, rgba(200,164,78,0.18) 0%, rgba(140,100,40,0.22) 100%)"
                            e.currentTarget.style.borderColor =
                                "rgba(200,164,78,0.60)"
                            e.currentTarget.style.boxShadow =
                                "0 0 28px rgba(200,164,78,0.18), inset 0 0 16px rgba(200,164,78,0.08)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "linear-gradient(135deg, rgba(200,164,78,0.10) 0%, rgba(140,100,40,0.14) 100%)"
                            e.currentTarget.style.borderColor =
                                "rgba(200,164,78,0.38)"
                            e.currentTarget.style.boxShadow =
                                "0 0 20px rgba(200,164,78,0.08), inset 0 0 12px rgba(200,164,78,0.04)"
                        }}
                    >
                        <span style={{ fontSize: 12 }}>✦</span> Privilegios
                        <span style={{ fontSize: 12 }}>✦</span>
                    </button>
                </motion.div>
            )}
            <AnimatePresence>
                {privilegiosOpen && (
                    <ModalPrivilegios
                        onCerrar={() => setPrivilegiosOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   RegistroIntercambiosSection · v2.1
   Tabla de pagos / facturas. Extraído del FirmaSection legacy.
   En desktop arranca abierta; en mobile colapsa por default.
   v2.1 — Auto-scroll al expandir (mobile): después de toggle a
   abierto, scrolleamos suavemente para que el final del cuadro
   quede visible — el tripulante no tiene que hacer scroll manual
   para encontrar las transacciones.
   ════════════════════════════════════════════════════════════════ */
function RegistroIntercambiosSection({
    payments,
    accent,
}: {
    payments: any[]
    accent: string
}) {
    const isMobile = useIsMobile()
    const [txOpen, setTxOpen] = useState(!isMobile)
    const bodyRef = useRef<HTMLDivElement | null>(null)
    /* v2.2 — Auto-scroll cuando el cuadro se expande en mobile,
       considerando la BottomNav del shell del Escáner. El v2.1
       usaba scrollIntoView({block:"end"}) que dejaba el final del
       cuadro alineado con el viewport — pero la BottomNav fija
       (~92px) tapaba la última fila. Ahora calculamos el overshoot
       exacto y reservamos 100px (BottomNav + buffer) cuando el
       cuadro vive dentro del overlay del shell (clase
       .rsv-overlay-scroll). Si no hay shell (Núcleo modo Madre
       standalone), el reserve baja a 16 — solo un buffer normal. */
    useEffect(() => {
        if (!txOpen || !isMobile) return
        const t = setTimeout(() => {
            const el = bodyRef.current
            if (!el || typeof window === "undefined") return
            const overlay = el.closest(
                ".rsv-overlay-scroll"
            ) as HTMLElement | null
            const inEscanerShell = !!overlay
            const bottomReserve = inEscanerShell ? 100 : 16
            const rect = el.getBoundingClientRect()
            const overshoot =
                rect.bottom + bottomReserve - window.innerHeight
            if (overshoot <= 0) return
            if (overlay) {
                overlay.scrollBy({ top: overshoot, behavior: "smooth" })
            } else {
                window.scrollBy({ top: overshoot, behavior: "smooth" })
            }
        }, 80)
        return () => clearTimeout(t)
    }, [txOpen, isMobile])
    return (
        <motion.div variants={fU} initial="hidden" animate="visible">
            <div
                onClick={() => setTxOpen((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setTxOpen((v) => !v)
                    }
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: txOpen ? 20 : 0,
                    cursor: "pointer",
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(200,164,78,0.08)",
                        border: "1px solid rgba(200,164,78,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#C8A44E",
                    }}
                >
                    <IRec />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                        className="nuc-section-h2"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Registro de Intercambios
                    </h2>
                    <p
                        className="nuc-section-sub"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                            marginTop: 2,
                        }}
                    >
                        Historial de pagos y adquisiciones
                    </p>
                </div>
                <div
                    aria-hidden
                    style={{
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.45)",
                        transition: "transform 0.3s ease",
                        transform: txOpen ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>
            {txOpen && (
                <div
                    ref={bodyRef}
                    className="nuc-glass"
                    style={{ padding: 0, overflow: "hidden" }}
                >
                    {payments.length === 0 ? (
                        <div
                            style={{
                                padding: "40px 24px",
                                textAlign: "center",
                            }}
                        >
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.3)",
                                    fontSize: 14,
                                }}
                            >
                                Aún no hay transacciones registradas.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                className="nuc-pay-head"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "1fr 120px 100px 100px 90px",
                                    padding: "12px 20px",
                                    borderBottom:
                                        "1px solid rgba(255,255,255,0.06)",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.25)",
                                }}
                            >
                                <span>Concepto</span>
                                <span>Fecha</span>
                                <span style={{ textAlign: "right" }}>
                                    Monto
                                </span>
                                <span style={{ textAlign: "right" }}>
                                    Estado
                                </span>
                                <span style={{ textAlign: "center" }}>
                                    Factura
                                </span>
                            </div>
                            {payments.map((p: any) => (
                                <div key={p.id} className="nuc-pay-row">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                                background:
                                                    p.payment_type ===
                                                    "subscription"
                                                        ? "rgba(200,164,78,0.6)"
                                                        : "rgba(0,194,255,0.6)",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "rgba(255,255,255,0.75)",
                                            }}
                                        >
                                            {p.description}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "rgba(255,255,255,0.35)",
                                        }}
                                    >
                                        {new Date(p.paid_at).toLocaleDateString(
                                            "es-MX",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "#fff",
                                            textAlign: "right",
                                        }}
                                    >
                                        $
                                        {((p.amount_cents || 0) / 100).toFixed(
                                            0
                                        )}{" "}
                                        {(p.currency || "usd").toUpperCase()}
                                    </span>
                                    <span style={{ textAlign: "right" }}>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 500,
                                                padding: "3px 10px",
                                                borderRadius: 12,
                                                background:
                                                    p.status === "succeeded"
                                                        ? "rgba(76,175,80,0.1)"
                                                        : "rgba(255,107,107,0.1)",
                                                color:
                                                    p.status === "succeeded"
                                                        ? "#4CAF50"
                                                        : "#FF6B6B",
                                                border: `1px solid ${p.status === "succeeded" ? "rgba(76,175,80,0.2)" : "rgba(255,107,107,0.2)"}`,
                                            }}
                                        >
                                            {p.status === "succeeded"
                                                ? "Pagado"
                                                : p.status}
                                        </span>
                                    </span>
                                    <span style={{ textAlign: "center" }}>
                                        {p.stripe_hosted_invoice_url ? (
                                            <a
                                                href={
                                                    p.stripe_hosted_invoice_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    padding: "4px 10px",
                                                    borderRadius: 6,
                                                    background:
                                                        "rgba(0,194,255,0.06)",
                                                    border: "1px solid rgba(0,194,255,0.18)",
                                                    color: "#00C2FF",
                                                    fontSize: 10,
                                                    fontWeight: 500,
                                                    letterSpacing: "0.04em",
                                                    textDecoration: "none",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    fontFamily:
                                                        "'Inter',sans-serif",
                                                }}
                                            >
                                                <svg
                                                    width="11"
                                                    height="11"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line
                                                        x1="12"
                                                        y1="15"
                                                        x2="12"
                                                        y2="3"
                                                    />
                                                </svg>
                                                Ver
                                            </a>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.12)",
                                                }}
                                            >
                                                —
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   EliminarCuentaSection · v1.0
   Borrado de cuenta self-service (paridad con la app iOS — App Store
   Guideline 5.1.1(v)). El Tripulante elimina su cuenta y sus datos
   personales de forma permanente desde Mi Firma → Claves y Seguridad.
   El flujo: "Eliminar" → tarjeta de confirmación con casilla
   obligatoria → botón destructivo → la edge function `delete-account`
   verifica el token de sesión, borra los datos y elimina la cuenta de
   Clerk. Al terminar cierra sesión y recarga el Portal de Inducción.

   Versión Framer: usa `window.Clerk` (la app móvil usa @clerk/clerk-react).
   SB_URL/SB_ANON van fijos (valores públicos) — la sección no recibe
   las credenciales por prop y threading por dos shells sería invasivo.
   ════════════════════════════════════════════════════════════════ */
const EV_DEL_SB_URL = "https://cobtsltrcsruzcusyqhi.supabase.co"
const EV_DEL_SB_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYnRzbHRyY3NydXpjdXN5cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzIyOTMsImV4cCI6MjA5MDMwODI5M30.-GKVel9fUxw2Lrp59QLqIvLrh9ubrHLgP44fkj8qI6U"
const DANGER = "#FF5C5C"

function ITrashCan() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    )
}

function EliminarCuentaSection({ accent }: { accent: string }) {
    void accent
    const [isOpen, setIsOpen] = useState(false)
    const [confirm, setConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState("")

    const reset = () => {
        setConfirm(false)
        setError("")
        setLoading(false)
    }

    const finishAndExit = useCallback(async () => {
        /* La cuenta ya fue borrada del lado servidor. Cerramos sesión
           best-effort y recargamos el Portal de Inducción para resetear
           todo el estado de auth cacheado. */
        try {
            await (window as any).Clerk?.signOut?.()
        } catch {
            /* la sesión ya no existe */
        }
        try {
            window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
            window.dispatchEvent(new CustomEvent("rsv-signout-complete"))
        } catch {
            /* noop */
        }
        try {
            window.location.assign("/")
        } catch {
            /* noop */
        }
    }, [])

    const handleDelete = async () => {
        setError("")
        setLoading(true)
        try {
            /* Token robusto: tras volver de segundo plano la sesión
               puede tardar un instante en re-hidratar. Reintentamos
               antes de declarar "sin sesión". */
            let token: string | null = null
            for (let i = 0; i < 5 && !token; i++) {
                try {
                    token =
                        (await (window as any).Clerk?.session?.getToken?.()) ||
                        null
                } catch {
                    token = null
                }
                if (!token) await new Promise((r) => setTimeout(r, 400))
            }
            if (!token) {
                setError(
                    "No se pudo validar tu sesión. Recarga la página e intenta de nuevo."
                )
                setLoading(false)
                return
            }
            const res = await fetch(
                `${EV_DEL_SB_URL}/functions/v1/delete-account`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: EV_DEL_SB_ANON,
                        Authorization: `Bearer ${EV_DEL_SB_ANON}`,
                    },
                    body: JSON.stringify({ token }),
                }
            )
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) {
                setError(
                    "No pudimos completar el borrado. Intenta de nuevo en un momento."
                )
                setLoading(false)
                return
            }
            setDone(true)
            setTimeout(() => {
                finishAndExit()
            }, 1600)
        } catch {
            setError(
                "No pudimos completar el borrado. Revisa tu conexión e intenta de nuevo."
            )
            setLoading(false)
        }
    }

    return (
        <motion.div variants={fU}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: isOpen ? 20 : 0,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(255,92,92,0.08)",
                        border: "1px solid rgba(255,92,92,0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: DANGER,
                        flexShrink: 0,
                    }}
                >
                    <ITrashCan />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                        className="nuc-section-h2"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 20,
                            fontWeight: 300,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        Eliminar mi cuenta
                    </h2>
                    <p
                        className="nuc-section-sub"
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                            marginTop: 2,
                        }}
                    >
                        Borra tu cuenta y tus datos de forma permanente
                    </p>
                </div>
                {!done && (
                    <button
                        onClick={() => {
                            if (isOpen) reset()
                            setIsOpen(!isOpen)
                        }}
                        type="button"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "8px 16px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,92,92,0.32)",
                            background: "rgba(255,92,92,0.06)",
                            color: DANGER,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter',sans-serif",
                            cursor: "pointer",
                            outline: "none",
                            flexShrink: 0,
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {isOpen ? "Cancelar" : "Eliminar"}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && !done && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            className="nuc-glass"
                            style={{
                                padding: "24px 24px 22px",
                                border: "1px solid rgba(255,92,92,0.18)",
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: "rgba(255,255,255,0.7)",
                                    fontFamily: "'Inter',sans-serif",
                                }}
                            >
                                Esto elimina de forma permanente tu cuenta y tus
                                datos personales: tu perfil, tus escaneos del
                                Radar, tu progreso, tus decodificaciones y tus
                                preferencias. Esta acción no se puede deshacer.
                            </p>
                            <p
                                style={{
                                    margin: "10px 0 0",
                                    fontSize: 11.5,
                                    lineHeight: 1.5,
                                    color: "rgba(255,255,255,0.4)",
                                    fontFamily: "'Inter',sans-serif",
                                }}
                            >
                                Tus comprobantes de pago se conservan solo el
                                tiempo que exige la ley fiscal. Tu suscripción se
                                administra y cancela desde tu proveedor de pago.
                            </p>

                            <button
                                type="button"
                                onClick={() => setConfirm((c) => !c)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    marginTop: 18,
                                    padding: 0,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    outline: "none",
                                    width: "100%",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <span
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        border: `1.5px solid ${
                                            confirm
                                                ? DANGER
                                                : "rgba(255,255,255,0.28)"
                                        }`,
                                        background: confirm
                                            ? "rgba(255,92,92,0.18)"
                                            : "transparent",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {confirm && (
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={DANGER}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12.5,
                                        color: "rgba(255,255,255,0.7)",
                                        fontFamily: "'Inter',sans-serif",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    Entiendo que esta acción es permanente y no
                                    se puede deshacer.
                                </span>
                            </button>

                            {error && (
                                <p
                                    style={{
                                        margin: "16px 0 0",
                                        fontSize: 12,
                                        color: DANGER,
                                        fontFamily: "'Inter',sans-serif",
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="button"
                                disabled={!confirm || loading}
                                onClick={handleDelete}
                                style={{
                                    marginTop: 18,
                                    width: "100%",
                                    padding: "14px 20px",
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,92,92,0.45)",
                                    background:
                                        !confirm || loading
                                            ? "rgba(255,92,92,0.08)"
                                            : "rgba(255,92,92,0.16)",
                                    color:
                                        !confirm || loading
                                            ? "rgba(255,92,92,0.5)"
                                            : "#FF8585",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    fontFamily: "'Inter',sans-serif",
                                    cursor:
                                        !confirm || loading
                                            ? "not-allowed"
                                            : "pointer",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                {loading
                                    ? "Eliminando…"
                                    : "Eliminar mi cuenta permanentemente"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {done && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="nuc-glass"
                    style={{
                        marginTop: 4,
                        padding: "22px 24px",
                        border: "1px solid rgba(255,92,92,0.18)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "center",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.85)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        Tu cuenta fue eliminada
                    </p>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.45)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        Cerrando tu sesión…
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   ClavesSeguridadSection · v2.0
   PasswordChangeSection (cambio de clave Clerk) + admin row
   colapsable (para perfiles is_admin=true). Reúne las dos
   herramientas de seguridad/permisos en una vista única.
   ════════════════════════════════════════════════════════════════ */
function ClavesSeguridadSection({
    hookUser,
    accent,
    isAdmin,
}: {
    hookUser: any
    accent: string
    isAdmin: boolean
}) {
    const [adminOpen, setAdminOpen] = useState(false)
    const navAdmin = useCallback((path: string) => {
        if (typeof window === "undefined") return
        const nav = (window as any).rsvNavigate
        if (typeof nav === "function") nav(path)
        else window.location.href = path
    }, [])
    return (
        <motion.div
            variants={cV}
            initial="hidden"
            animate="visible"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 32,
            }}
        >
            <PasswordChangeSection hookUser={hookUser} accent={accent} />
            <EliminarCuentaSection accent={accent} />
            {isAdmin && (
                <motion.div
                    variants={fU}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        paddingTop: 8,
                    }}
                >
                    <AnimatePresence mode="wait">
                        {!adminOpen ? (
                            <motion.button
                                key="admin-toggle"
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ duration: 0.22 }}
                                onClick={() => setAdminOpen(true)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: "10px 22px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(212,168,67,0.28)",
                                    background:
                                        "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.03))",
                                    color: "rgba(212,168,67,0.85)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    fontFamily: "'Inter',sans-serif",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                    boxShadow:
                                        "0 0 10px rgba(212,168,67,0.05)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        "linear-gradient(135deg, rgba(0,229,255,0.14), rgba(0,229,255,0.04))"
                                    e.currentTarget.style.borderColor =
                                        "rgba(0,229,255,0.55)"
                                    e.currentTarget.style.color = "#00E5FF"
                                    e.currentTarget.style.boxShadow =
                                        "0 0 18px rgba(0,229,255,0.4)"
                                    e.currentTarget.style.transform =
                                        "scale(1.06)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.03))"
                                    e.currentTarget.style.borderColor =
                                        "rgba(212,168,67,0.28)"
                                    e.currentTarget.style.color =
                                        "rgba(212,168,67,0.85)"
                                    e.currentTarget.style.boxShadow =
                                        "0 0 10px rgba(212,168,67,0.05)"
                                    e.currentTarget.style.transform =
                                        "scale(1)"
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-1.18-2.82H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.82-1.18V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.18 2.82H21a2 2 0 0 1 0 4h-.09" />
                                </svg>
                                Admin
                            </motion.button>
                        ) : (
                            <motion.div
                                key="admin-row"
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 12,
                                    flexShrink: 0,
                                }}
                            >
                                <NucAdminIconBtn
                                    label="Motor"
                                    onClick={() =>
                                        navAdmin("/motor-intervencion")
                                    }
                                    icon={
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
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                    }
                                />
                                <NucAdminIconBtn
                                    label="Telemetría"
                                    onClick={() => navAdmin("/telemetria")}
                                    icon={
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
                                            <circle cx="12" cy="12" r="2" />
                                            <path d="M12 2v4" />
                                            <path d="M12 18v4" />
                                            <path d="M4.93 4.93l2.83 2.83" />
                                            <path d="M16.24 16.24l2.83 2.83" />
                                            <path d="M2 12h4" />
                                            <path d="M18 12h4" />
                                            <path d="M4.93 19.07l2.83-2.83" />
                                            <path d="M16.24 7.76l2.83-2.83" />
                                        </svg>
                                    }
                                />
                                <NucAdminIconBtn
                                    label="Holograma"
                                    onClick={() => navAdmin("/holograma")}
                                    icon={
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
                                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                            <line
                                                x1="12"
                                                y1="22"
                                                x2="12"
                                                y2="15.5"
                                            />
                                            <polyline points="22 8.5 12 15.5 2 8.5" />
                                            <polyline
                                                points="2 15.5 12 8.5 22 15.5"
                                                opacity="0.4"
                                            />
                                            <line
                                                x1="12"
                                                y1="2"
                                                x2="12"
                                                y2="8.5"
                                            />
                                        </svg>
                                    }
                                />
                                <NucAdminIconBtn
                                    label="Observatorio"
                                    onClick={() => navAdmin("/observatorio")}
                                    icon={
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
                                            <circle cx="12" cy="12" r="3" />
                                            <line x1="12" y1="3" x2="12" y2="6" />
                                            <line
                                                x1="12"
                                                y1="18"
                                                x2="12"
                                                y2="21"
                                            />
                                            <line x1="3" y1="12" x2="6" y2="12" />
                                            <line
                                                x1="18"
                                                y1="12"
                                                x2="21"
                                                y2="12"
                                            />
                                        </svg>
                                    }
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    )
}

/* ════════════════════════════════════════════════════════════════
   FirmaSection · v2.0 (mobile wrapper)
   Stack vertical de las 4 sub-secciones para la sub-pantalla mobile
   donde todo se navega en cascada de back-arrow. En desktop, el
   shell renderiza cada sub-sección individualmente como vista de
   columna 3 — este wrapper no se usa.
   ════════════════════════════════════════════════════════════════ */
function FirmaSection({
    clerkUser,
    hookUser,
    payments,
    accent,
    isAdmin,
    sub,
    stripePortalUrl,
    supabaseUrl,
    supabaseAnonKey,
    nucleoLoading,
}: {
    clerkUser: any
    hookUser: any
    payments: any[]
    accent: string
    isAdmin: boolean
    sub: any
    stripePortalUrl: string
    supabaseUrl: string
    supabaseAnonKey: string
    nucleoLoading: boolean
}) {
    return (
        <motion.div
            variants={cV}
            initial="hidden"
            animate="visible"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 32,
                paddingBottom: 75,
            }}
        >
            <IdentidadVisualSection
                clerkUser={clerkUser}
                hookUser={hookUser}
                accent={accent}
            />
            <EstadoOrbitalSection
                sub={sub}
                accent={accent}
                loading={nucleoLoading}
                stripePortalUrl={stripePortalUrl}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
            />
            <RegistroIntercambiosSection payments={payments} accent={accent} />
            <ClavesSeguridadSection
                hookUser={hookUser}
                accent={accent}
                isAdmin={isAdmin}
            />
        </motion.div>
    )
}

/* Default export: FirmaSection (componente con JSX completo) +
   sub-secciones como propiedades. El shell desktop destructura
   las sub-secciones; el shell mobile usa FirmaSection directo. */
const Firma = Object.assign(FirmaSection, {
    FirmaSection,
    IdentidadVisualSection,
    EstadoOrbitalSection,
    RegistroIntercambiosSection,
    ClavesSeguridadSection,
})

export default Firma
