// TelemetriaDelNucleo.tsx v11.0
// Shell delegador del split TN_ — wrapping del Inner gateado por auth +
// addPropertyControls. La lógica completa vive en archivos siblings:
//   · TN_Shared.tsx     — utilities, hooks, constantes y tipos
//   · TN_UI.tsx         — primitivos UI (HoloCorners, EnergyRing, etc)
//   · TN_Forms.tsx      — AddExplorationPassForm + HistoryPanel
//   · TN_Cards.tsx      — DetailPanel + ExpCard
//   · TN_Dashboard.tsx  — AdminDashboard + TelemetriaDelNucleoInner
//
// Esta es la única superficie que Domo coloca en Canvas — todo el resto es
// invisible para Framer (utility-only files con default export ghost). Las
// property controls de Diego siguen viviendo aquí porque viajan adheridas
// a la función `TelemetriaDelNucleo`.
//
// v11.0 — Split TN_ completado (2026-04-30).
// v10.x — Versiones previas del monolítico de ~296KB (ver git history).

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import TelemetriaDelNucleoInner from "./TN_Dashboard.tsx"

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT: TelemetriaDelNucleo — wrapper que pasa props al Inner
   ═══════════════════════════════════════════════════════════════════════════ */
export function TelemetriaDelNucleo(props: any) {
    return (
        <TelemetriaDelNucleoInner
            supabaseUrl={props.supabaseUrl || ""}
            supabaseAnonKey={props.supabaseAnonKey || ""}
            explorationEmailWebhookUrl={props.explorationEmailWebhookUrl || ""}
        />
    )
}

addPropertyControls(TelemetriaDelNucleo, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Key",
        defaultValue: "",
    },
    /* v9.7 — webhook de Pipedream para disparar el email de bienvenida
       al registrar un pase manualmente desde la UI (reservas off-platform).
       Si queda vacío, el registro funciona igual pero sin email. */
    explorationEmailWebhookUrl: {
        type: ControlType.String,
        title: "Pipedream Email Webhook",
        placeholder: "https://…pipedream.net",
        defaultValue: "",
    },
})
