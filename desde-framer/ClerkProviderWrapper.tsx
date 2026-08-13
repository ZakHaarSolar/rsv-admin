// Red Solar Viva — ClerkProviderWrapper.tsx v2.0
// Auto-switch entre instancia Prod (redsolarviva.com) e instancia Dev
// (localhost, ngrok, previews) basado en hostname. Una sola configuración
// en Framer para ambos entornos.

import { ClerkProvider } from "@clerk/clerk-react"
import { ReactNode } from "react"
import { addPropertyControls, ControlType } from "framer"

interface Props {
    children: ReactNode
    publishableKey: string /* pk_live_… para redsolarviva.com */
    devPublishableKey?: string /* pk_test_… para ngrok/localhost */
}

/* Hosts que se consideran "producción" y usan la key live.
   Cualquier otro host (ngrok, localhost, previews) usa la dev key. */
const PROD_HOSTS = new Set([
    "redsolarviva.com",
    "www.redsolarviva.com",
])

function pickKey(prodKey: string, devKey?: string): string {
    if (typeof window === "undefined") return prodKey /* SSR fallback */
    const host = window.location.hostname.toLowerCase()
    if (PROD_HOSTS.has(host)) return prodKey
    /* Dev/staging/preview/ngrok: si hay dev key, úsala */
    if (devKey && devKey.startsWith("pk_test_")) {
        console.log(
            `[Clerk] Host "${host}" \u2192 usando instancia Development`
        )
        return devKey
    }
    /* Sin dev key configurada: cae a prod key (que fallará en ngrok
       por origin mismatch, pero funcionará en localhost si está permitido) */
    console.warn(
        `[Clerk] Host "${host}" no es producción y no hay devPublishableKey. Login puede fallar.`
    )
    return prodKey
}

export default function ClerkProviderWrapper({
    children,
    publishableKey,
    devPublishableKey,
}: Props) {
    const effectiveKey = pickKey(publishableKey, devPublishableKey)

    if (!effectiveKey) {
        console.warn("⚠️ Clerk: No publishableKey provided")
        return <>{children}</>
    }

    return (
        <ClerkProvider
            publishableKey={effectiveKey}
            appearance={{
                variables: { colorPrimary: "#5ce0d6" }, // tu color teal
            }}
        >
            {children}
        </ClerkProvider>
    )
}

// ─── Property Controls ──────────────────────────────────────────────
addPropertyControls(ClerkProviderWrapper, {
    publishableKey: {
        type: ControlType.String,
        title: "Clerk Prod Key",
        defaultValue: "",
        description:
            "pk_live_… — se usa en redsolarviva.com / www.redsolarviva.com",
    },
    devPublishableKey: {
        type: ControlType.String,
        title: "Clerk Dev Key",
        defaultValue: "",
        description:
            "pk_test_… — se usa en ngrok, localhost y previews (Opción A)",
    },
})
