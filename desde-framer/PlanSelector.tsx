// PlanSelector.tsx v1.1 — Suma "Afirmaciones diarias del Ritual" a los beneficios de Sintonía Solar. v1.0 — Espejo WEB del selector de planes del Escáner (variante Framer).
// Mismo look que la app (héroe Sintonía Solar 599 · RECOMENDADO · "Conocer todos los
// beneficios" arriba de "Ver más planes" · 3 tiers al expandir: Sintonía 599 ·
// Materia+Sueños 399 · Decodificador 199). En web TODA activación cae al Payment Link
// de Stripe vía Shared.withCheckoutIdentity(SINTONIA_SOLAR_LINK); el 199 usa
// DECODER_SOLAR_LINK si ya existe (hoy "" → cae a Sintonía). Sin StoreKit/RevenueCat.
// Disclaimer de auto-renovación + Privacidad/EULA conservados. Acepta las mismas props
// del componente de la app (onClose, cooldownLabel, title, subtitle, showBenefits,
// activePlan) para que EV_Freemium lo reuse como muro del Radar.

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import Shared from "./EV_Shared.tsx"
import BeneficiosSintonia from "./BeneficiosSintonia.tsx"

const { withCheckoutIdentity, SINTONIA_SOLAR_LINK, DECODER_SOLAR_LINK } = Shared

const GOLD = "#D4A843"
const GOLD_SOFT = "#F5D98C"
const CYAN = "#00E5FF"
const VIOLET = "#9B8CFF"

type PlanKey = "sintonia" | "dual" | "decoder"

interface PlanDef {
    key: PlanKey
    name: string
    tagline: string
    perks: string[]
    accent: string
    recommended?: boolean
    fallbackPrice: string
}

const PLANS: PlanDef[] = [
    {
        key: "sintonia",
        name: "Sintonía Solar",
        tagline: "Todo el ecosistema",
        perks: [
            "Radar Vibracional ilimitado cada 7 días",
            "Biblioteca de Calibraciones de los 6 pilares",
            "Decodificador de Materia y de Sueños sin límite",
            "Afirmaciones diarias del Ritual (catálogo + las tuyas)",
            "Dos Cristales de Extracción cada mes",
        ],
        accent: GOLD,
        recommended: true,
        fallbackPrice: "599 MXN/mes",
    },
    {
        key: "dual",
        name: "Materia + Sueños",
        tagline: "Los dos Decodificadores",
        perks: [
            "Decodificador de Materia sin límite",
            "Decodificador de Sueños sin límite",
        ],
        accent: VIOLET,
        fallbackPrice: "399 MXN/mes",
    },
    {
        key: "decoder",
        name: "Decodificador de Materia",
        tagline: "Empieza por aquí",
        perks: [
            "Escanea al instante la vibración de tus alimentos o productos de higiene y limpieza, y elimina el ruido de tu vida.",
        ],
        accent: CYAN,
        fallbackPrice: "199 MXN/mes",
    },
]

export default function PlanSelector({
    onClose = () => {},
    activePlan: activePlanProp = null,
    cooldownLabel,
    title,
    subtitle,
    showBenefits = false,
}: {
    onClose?: () => void
    /* Tier que el Tripulante ya tiene (para marcarlo "Activado"). */
    activePlan?: PlanKey | null
    /* Modo "muro del Escáner": cuando el gate freemium del Radar (2do escaneo en
       cooldown) lo abre, pasa estos overrides para mostrar el countdown + los
       textos del muro ARRIBA de la tarjeta, conservando todo el estilo. */
    cooldownLabel?: string
    title?: string
    subtitle?: string
    /* Muestra el botón "Conocer todos los beneficios" (abre el carrusel). */
    showBenefits?: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const [benefitsOpen, setBenefitsOpen] = useState(false)
    const activePlan: PlanKey | null = activePlanProp

    /* Avisa a las capas con botón "Volver" portaleado que hay un overlay encima,
       para que lo oculten mientras el selector está abierto. */
    useEffect(() => {
        try {
            window.dispatchEvent(new CustomEvent("rsv-overlay-open"))
        } catch {}
        return () => {
            try {
                window.dispatchEvent(new CustomEvent("rsv-overlay-close"))
            } catch {}
        }
    }, [])

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [onClose])

    const priceLabel = (p: PlanDef) => p.fallbackPrice

    const handlePurchase = (key: PlanKey) => {
        if (key === activePlan) return
        /* Web: el Dual y el 199 caen a Sintonía mientras no tengan su propio
           Payment Link. El 199 usa su link si ya existe. */
        const base =
            key === "decoder" && DECODER_SOLAR_LINK
                ? DECODER_SOLAR_LINK
                : SINTONIA_SOLAR_LINK
        if (!base) return
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

    const hero = PLANS[0]

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
                zIndex: 1300,
                background: "rgba(2,5,12,0.9)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 16px",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "min(420px, 100%)",
                    maxHeight: "86vh",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    padding: "44px 22px 26px",
                    borderRadius: 24,
                    background:
                        "radial-gradient(130% 90% at 50% -8%, rgba(212,168,67,0.16), transparent 55%), radial-gradient(130% 90% at 50% 108%, rgba(0,229,255,0.08), transparent 55%), rgba(8,12,22,0.96)",
                    border: `1px solid ${GOLD}44`,
                    boxShadow:
                        "0 30px 90px rgba(212,168,67,0.16), 0 0 160px rgba(0,229,255,0.06), inset 0 0 60px rgba(0,0,0,0.5)",
                    color: "#EFE6CF",
                }}
            >
                {/* Cierre */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 14,
                        width: 32,
                        height: 32,
                        border: "none",
                        background: "transparent",
                        color: "#E8DBB8",
                        fontSize: 24,
                        fontWeight: 200,
                        lineHeight: 1,
                        cursor: "pointer",
                        opacity: 0.7,
                        padding: 0,
                    }}
                >
                    ×
                </button>

                {/* Encabezado — se OCULTA al expandir, así las 3 tarjetas
                    ocupan todo el alto desde arriba sin obligar a scroll. */}
                {!expanded && (
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        {/* Banner "Próximo escaneo" — solo cuando lo abre el muro
                            del Radar. Lo primero que ve el Tripulante. */}
                        {cooldownLabel && (
                            <div style={{ marginBottom: 16 }}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 7,
                                        padding: "8px 16px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(212,168,67,0.42)",
                                        background: "rgba(212,168,67,0.1)",
                                        fontSize: 11,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: "rgba(236,216,168,0.85)",
                                    }}
                                >
                                    ✦ Próximo escaneo en{" "}
                                    <b
                                        style={{
                                            color: "#FFE7B0",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        {cooldownLabel}
                                    </b>
                                </span>
                            </div>
                        )}
                        {/* Eyebrow "✦ Suscripción ✦" solo en modo planes puro; el
                            muro usa su propio banner + título arriba. */}
                        {!title && (
                            <div
                                style={{
                                    fontSize: 10,
                                    letterSpacing: "0.34em",
                                    textTransform: "uppercase",
                                    color: GOLD,
                                    opacity: 0.85,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                }}
                            >
                                ✦ Suscripción ✦
                            </div>
                        )}
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 25,
                                fontWeight: 200,
                                letterSpacing: "0.1em",
                                lineHeight: 1.15,
                                background: `linear-gradient(180deg, ${GOLD_SOFT}, #FFFFFF)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                textTransform: "uppercase",
                            }}
                        >
                            {title || "Desencripta el ecosistema"}
                        </h2>
                        <p
                            style={{
                                margin: "8px auto 0",
                                maxWidth: 340,
                                fontSize: 12.5,
                                fontWeight: 300,
                                lineHeight: 1.6,
                                color: "rgba(226,216,184,0.7)",
                                whiteSpace: "pre-line",
                            }}
                        >
                            {subtitle ||
                                "Cada herramienta deja de ser muestra y pasa a ser ruta."}
                        </p>
                    </div>
                )}

                {/* Sintonía (héroe) — SIEMPRE arriba. paddingTop al expandir
                    para que el badge RECOMENDADO no choque con la ×. */}
                <div style={{ paddingTop: expanded ? 22 : 0 }}>
                    <PlanCard
                        plan={hero}
                        price={priceLabel(hero)}
                        onActivate={() => handlePurchase(hero.key)}
                        hero
                        isActive={activePlan === hero.key}
                    />
                </div>

                {/* Conocer todos los beneficios — JUSTO debajo de Sintonía
                    (arriba de "Ver más planes" en colapsado, entre Sintonía y
                    las otras tarjetas en expandido). */}
                {showBenefits && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setBenefitsOpen(true)
                        }}
                        style={{
                            display: "block",
                            margin: "12px auto 0",
                            padding: "8px 20px",
                            background: "transparent",
                            border: "none",
                            color: "rgba(212,168,67,0.85)",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 10.5,
                            fontWeight: 500,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            outline: "none",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                        }}
                    >
                        ◇ Conocer todos los beneficios
                    </button>
                )}

                {/* Vista expandida: los tres niveles para elegir. */}
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                duration: 0.32,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ overflow: "hidden" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    /* Aire arriba para que el badge
                                       "RECOMENDADO" (top:-10 de la 1ª tarjeta)
                                       no lo recorte el overflow del acordeón. */
                                    paddingTop: 16,
                                }}
                            >
                                {PLANS.filter(
                                    (p) => p.key !== "sintonia"
                                ).map((p) => (
                                    <PlanCard
                                        key={p.key}
                                        plan={p}
                                        price={priceLabel(p)}
                                        onActivate={() => handlePurchase(p.key)}
                                        hero={!!p.recommended}
                                        isActive={activePlan === p.key}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle ver más / ver menos planes */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setExpanded((v) => !v)
                    }}
                    style={{
                        display: "block",
                        margin: "14px auto 0",
                        padding: "8px 20px",
                        background: "transparent",
                        border: "1px solid rgba(125,239,255,0.28)",
                        borderRadius: 999,
                        color: "rgba(180,225,240,0.85)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10.5,
                        fontWeight: 500,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    {expanded ? "Ver menos planes" : "Ver más planes"}
                </button>

                {/* Divulgación de suscripción (App Store 3.1.2 — válida también en
                    web). Sin botón "Restaurar compras" (eso es solo iOS). */}
                <div
                    style={{
                        marginTop: 16,
                        maxWidth: 340,
                        marginLeft: "auto",
                        marginRight: "auto",
                    }}
                >
                    <p
                        style={{
                            fontSize: 9.5,
                            lineHeight: 1.6,
                            color: "rgba(226,216,184,0.5)",
                            margin: "0 0 8px",
                            textAlign: "center",
                        }}
                    >
                        Cada plan es una suscripción mensual que se renueva
                        automáticamente por el mismo período y precio, salvo que
                        la canceles antes del fin del ciclo desde el portal de
                        suscripción.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <DiscLink
                            href="https://redsolarviva.com/privacy"
                            label="Política de Privacidad"
                        />
                        <DiscLink
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            label="Términos de Uso (EULA)"
                        />
                    </div>
                </div>

                {benefitsOpen && (
                    <BeneficiosSintonia
                        onClose={() => setBenefitsOpen(false)}
                        onActivate={() => {
                            setBenefitsOpen(false)
                            handlePurchase("sintonia")
                        }}
                    />
                )}
            </motion.div>
        </motion.div>,
        document.body
    )
}

/* Tarjeta de plan. En modo `hero` es prominente (borde dorado, badge
   "Recomendado", lista completa de beneficios + CTA grande). En modo
   compacto es seleccionable: toda la tarjeta dispara la activación. */
function PlanCard({
    plan,
    price,
    onActivate,
    hero,
    isActive = false,
}: {
    plan: PlanDef
    price: string
    onActivate: () => void
    hero: boolean
    isActive?: boolean
}) {
    const acc = plan.accent
    const ACTIVE_GREEN = "#3FCF8E"
    return (
        <button
            type="button"
            disabled={isActive}
            onClick={(e) => {
                e.stopPropagation()
                if (isActive) return
                onActivate()
            }}
            style={{
                position: "relative",
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: hero ? "18px 18px 16px" : "15px 16px",
                borderRadius: 18,
                border: `1px solid ${acc}${hero ? "66" : "33"}`,
                background: hero
                    ? `linear-gradient(165deg, ${acc}1F, ${acc}07 60%, rgba(8,12,22,0.6))`
                    : "rgba(255,255,255,0.025)",
                boxShadow: hero
                    ? `0 0 28px ${acc}26, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : "none",
                color: "#EFE6CF",
                cursor: isActive ? "default" : "pointer",
                opacity: 1,
                outline: "none",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.25s ease",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {isActive ? (
                <span
                    style={{
                        position: "absolute",
                        top: -10,
                        right: 14,
                        padding: "3px 12px",
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${ACTIVE_GREEN}, #2BA571)`,
                        color: "#04140C",
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        boxShadow: `0 0 14px ${ACTIVE_GREEN}66`,
                    }}
                >
                    ✓ Tu plan
                </span>
            ) : (
                plan.recommended && (
                    <span
                        style={{
                            position: "absolute",
                            top: -10,
                            right: 14,
                            padding: "3px 12px",
                            borderRadius: 999,
                            background: `linear-gradient(135deg, ${GOLD}, #B58E2C)`,
                            color: "#1A1208",
                            fontSize: 8.5,
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            boxShadow: `0 0 14px ${GOLD}66`,
                        }}
                    >
                        Recomendado
                    </span>
                )
            )}
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: hero ? 17 : 15,
                            fontWeight: 600,
                            color: hero ? GOLD_SOFT : "#FFFFFF",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {plan.name}
                    </div>
                    <div
                        style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: `${acc}`,
                            opacity: 0.8,
                            marginTop: 3,
                        }}
                    >
                        {plan.tagline}
                    </div>
                </div>
                <div
                    style={{
                        flexShrink: 0,
                        textAlign: "right",
                        fontSize: hero ? 15 : 13.5,
                        fontWeight: 700,
                        color: "#FFFFFF",
                        letterSpacing: "0.02em",
                    }}
                >
                    {price}
                </div>
            </div>
            <ul
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                {plan.perks.map((perk, i) => (
                    <li
                        key={i}
                        style={{
                            display: "flex",
                            gap: 8,
                            fontSize: 12,
                            lineHeight: 1.45,
                            color: "rgba(226,216,184,0.82)",
                        }}
                    >
                        <span
                            style={{
                                flexShrink: 0,
                                color: acc,
                                fontSize: 11,
                                marginTop: 1,
                            }}
                        >
                            ◈
                        </span>
                        <span>{perk}</span>
                    </li>
                ))}
            </ul>
            <div
                style={{
                    marginTop: 4,
                    width: "100%",
                    padding: hero ? "12px 18px" : "10px 16px",
                    borderRadius: 12,
                    textAlign: "center",
                    fontSize: hero ? 13 : 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: isActive
                        ? ACTIVE_GREEN
                        : hero
                          ? "#1A1208"
                          : acc,
                    background: isActive
                        ? `${ACTIVE_GREEN}14`
                        : hero
                          ? `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT} 50%, ${GOLD})`
                          : `${acc}14`,
                    border: isActive
                        ? `1px solid ${ACTIVE_GREEN}55`
                        : hero
                          ? "none"
                          : `1px solid ${acc}44`,
                    boxShadow:
                        isActive || !hero
                            ? "none"
                            : `0 0 22px ${GOLD}55, inset 0 -2px 6px rgba(0,0,0,0.18)`,
                }}
            >
                {isActive ? "✓ Activado" : `Activar · ${price}`}
            </div>
        </button>
    )
}

function DiscLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                try {
                    window.open(href, "_blank", "noopener,noreferrer")
                } catch {}
            }}
            style={{
                fontSize: 9.5,
                letterSpacing: "0.08em",
                color: "rgba(180,225,240,0.7)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                cursor: "pointer",
            }}
        >
            {label}
        </a>
    )
}
