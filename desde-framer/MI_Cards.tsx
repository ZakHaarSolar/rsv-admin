// MI_Cards.tsx v1.1
// Card del grid de Nodos Activos del Motor de Intervención.
// v1.1 — Defaults defensivos. Framer instancia componentes standalone
// al cargar; sin un default a `t` cualquier acceso a `t.in_flight_pilars`
// crasheaba con "Cannot read properties of undefined".
// Hex + nombre + meta (ciclos + estado), con tres variantes visuales:
//   · Sintonía Solar 777 → cyan cristalino
//   · Inmersión Solar 1,999 / admin → dorado
//   · Cortesía Solar (gift_*) → cyan + pill "Cortesía Solar" al pie
//
// Consumidor: MI_Tripulantes (grid).

import * as React from "react"
import Shared from "./MI_Shared.tsx"

const { TripulanteHex } = Shared

/* Reutilizamos la interfaz ya definida en MI_Shared para no duplicar. */
type TripulanteRow = {
    clerk_user_id: string
    full_name: string
    scan_count: number
    complete_cycles: number
    last_scan_ts: string | null
    history: any[]
    in_flight_pilars: string[] | null
}

function TripulanteCard({
    t,
    onClick = () => {},
    isGold = false,
    isSintonia = false,
    isGift = false,
    emailHint = "",
}: {
    t?: TripulanteRow
    onClick?: () => void
    isGold?: boolean
    isSintonia?: boolean
    isGift?: boolean
    emailHint?: string
}) {
    /* Defaults defensivos — Framer monta el componente standalone
       al cargar el Code File; sin guard, t es undefined y crashea. */
    if (!t || typeof t !== "object" || !t.clerk_user_id) {
        return <div style={{ display: "none" }} aria-hidden="true" />
    }
    const inFlight = (t.in_flight_pilars?.length ?? 0) > 0
    const hoursSinceLast = t.last_scan_ts
        ? (Date.now() - new Date(t.last_scan_ts).getTime()) /
          (1000 * 60 * 60)
        : Infinity
    const dotClass = inFlight
        ? "mi-trip-meta-dot"
        : hoursSinceLast < 48
          ? "mi-trip-meta-dot idle"
          : "mi-trip-meta-dot cold"
    const fullName = (t.full_name || "").trim()
    const emailLocalPart = emailHint
        ? emailHint.split("@")[0].slice(0, 22)
        : ""
    const shortName = fullName || emailLocalPart || "Tripulante"
    const metaLabel = `${t.complete_cycles} ciclo${
        t.complete_cycles !== 1 ? "s" : ""
    }`
    /* 🜂 v1.x — FUERA EL DORADO DE INMERSIÓN SOLAR (Zak 2026-08-06): las
       sesiones en línea ya no se dan, así que Inmersión Solar dejó de ser una
       membresía viva. El dorado marcaba a quien la tuviera —incluida la cuenta
       de administrador, que salía dorada aunque figure como Explorador— y eso
       ya no distingue nada real. Queda una sola señal de membresía:
         · Sintonía Solar → cian
         · todo lo demás   → normal
       `isGold` sigue llegando por la cadena (lo usan otros paneles y el
       filtro "Gratis"); acá simplemente no pinta. */
    const tierClass = isSintonia ? " cyan" : ""
    void isGold
    return (
        <button
            className={`mi-trip-card${tierClass}`}
            onClick={onClick}
            aria-label={`Abrir telemetría de ${shortName}`}
        >
            <div className="mi-trip-hex-wrap">
                <TripulanteHex />
            </div>
            <span className="mi-trip-name">{shortName}</span>
            {isGift ? (
                <span
                    style={{
                        marginTop: 2,
                        fontSize: 8,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#7DDCFF",
                        background:
                            "linear-gradient(135deg, rgba(0,194,255,0.16), rgba(0,150,200,0.10))",
                        border: "1px solid rgba(0,194,255,0.36)",
                        borderRadius: 999,
                        padding: "3px 9px",
                        textShadow: "0 0 8px rgba(0,194,255,0.4)",
                        boxShadow: "0 0 10px rgba(0,194,255,0.18)",
                    }}
                >
                    ✦ Cortesía Solar
                </span>
            ) : (
                <div className="mi-trip-meta">
                    <span className={dotClass} />
                    <span>{metaLabel}</span>
                </div>
            )}
        </button>
    )
}
TripulanteCard.displayName = "MI_Cards"

export default TripulanteCard
