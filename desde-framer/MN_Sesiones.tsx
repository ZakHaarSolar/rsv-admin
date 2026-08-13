// Red Solar Viva — MN_Sesiones.tsx v2.2 — citas 1:1 por gateway user-action (cierra IDOR Zoom link+password+email, barrido 2026-06-13)
// v2.1.1 — Re-trigger por waitForComponentLoader timeout de Framer.
// v2.1 — Orden invertido en el wrapper mobile SesionesTabPanel:
// Cámara Solar arriba, Cámara de Resonancia abajo. Antes el 1:1
// abría primero — Zak pidió que la grupal vaya antes porque es la
// puerta de entrada al producto y la Resonancia es la profundización.
// v2.0 — Separado en 2 sub-secciones independientes para que el
// shell desktop renderice cada una como vista propia de la columna
// 3 del layout cascada:
//   · CamaraResonanciaSection — el bloque 1:1 (citas con Zak'Haar
//     vía EscaneoRelampago + CTA agendar si no hay citas).
//   · CamaraSection (vive en MN_Camara, importado acá) — el bloque
//     grupal con countdown + grabaciones + WhatsApp.
//
// SesionesTabPanel sigue existiendo como wrapper que monta ambas
// sub-secciones en stack vertical para la sub-pantalla mobile que
// arrastra todo en cascada de back-arrow. En desktop el shell
// renderiza CamaraSection o CamaraResonanciaSection individualmente
// según la selección de columna 2.
//
// Cumple regla 🜂: default export es Object.assign sobre componente
// fantasma + { SesionesTabPanel, CamaraResonanciaSection }.
import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"

import EscaneoRelampago from "./EscaneoRelampago.tsx"

import MNIcons from "./MN_Icons.tsx"
import MNCamara from "./MN_Camara.tsx"

const { IStar } = MNIcons
const { CamaraSection } = MNCamara

/* ════════════════════════════════════════════════════════════════
   CamaraResonanciaSection · v2.0
   Sesiones 1:1 con Zak'Haar. Si el Nodo tiene citas vivas, las
   muestra vía EscaneoRelampago. Si no, invita a agendar la primera.
   Carga vía RPC get_citas_1to1_de_tripulante (con fallback a la
   firma vieja sin email).
   ════════════════════════════════════════════════════════════════ */
function CamaraResonanciaSection({
    user,
    supabaseUrl,
    supabaseAnonKey,
}: {
    user: any
    supabaseUrl: string
    supabaseAnonKey: string
}) {
    const clerkUserId = user?.id || null
    const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        null
    const [citas, setCitas] = useState<any[] | null>(null)

    const cargarCitas = useCallback(async () => {
        if (!clerkUserId || !supabaseUrl || !supabaseAnonKey) {
            setCitas([])
            return
        }
        const url = `${supabaseUrl}/rest/v1/rpc/get_citas_1to1_de_tripulante`
        const baseHeaders = {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
        }

        async function attempt(payload: any): Promise<any> {
            const r = await fetch(url, {
                method: "POST",
                headers: baseHeaders,
                body: JSON.stringify(payload),
            })
            if (!r.ok) {
                let body: any = null
                try {
                    body = await r.json()
                } catch {
                    try {
                        body = await r.text()
                    } catch {}
                }
                console.error("[nuc-citas] HTTP " + r.status, {
                    payload,
                    body,
                })
                return { ok: false, status: r.status, body, payload }
            }
            const data = await r.json()
            return { ok: true, data }
        }

        try {
            // Gateway user-action (token → el server inyecta el clerk id verificado).
            // Fallback transitorio a la RPC directa hasta el REVOKE de anon.
            try {
                const token = await (
                    window as any
                ).Clerk?.session?.getToken?.()
                if (token) {
                    const gw = await fetch(
                        `${supabaseUrl}/functions/v1/user-action`,
                        {
                            method: "POST",
                            headers: baseHeaders,
                            body: JSON.stringify({
                                token,
                                action: "get_citas_1to1_de_tripulante",
                                params: {},
                            }),
                        }
                    )
                    if (gw.ok) {
                        const data = await gw.json()
                        const arr = Array.isArray(data) ? data : []
                        console.log("[nuc-citas] gateway ok:", {
                            count: arr.length,
                        })
                        setCitas(arr)
                        return
                    }
                }
            } catch (gwErr) {
                console.warn(
                    "[nuc-citas] gateway user-action fail, fallback directo:",
                    gwErr
                )
            }
            /* Primero probamos con la firma nueva (con email). Si falla con
               404/400 (función no encontrada con esa signature), hacemos
               fallback a la firma vieja de solo clerk_user_id. */
            let res = await attempt({
                p_clerk_user_id: clerkUserId,
                p_email: userEmail,
            })

            if (!res.ok && (res.status === 404 || res.status === 400)) {
                console.warn(
                    "[nuc-citas] RPC con p_email falló, fallback a solo clerk_user_id:",
                    res
                )
                res = await attempt({ p_clerk_user_id: clerkUserId })
            }

            if (res.ok) {
                const arr = Array.isArray(res.data) ? res.data : []
                console.log("[nuc-citas] ok:", {
                    clerk_user_id: clerkUserId,
                    email: userEmail,
                    count: arr.length,
                    citas: arr,
                })
                setCitas(arr)
            } else {
                console.error("[nuc-citas] falló:", {
                    clerk_user_id: clerkUserId,
                    email: userEmail,
                    status: res.status,
                })
                setCitas([])
            }
        } catch (e) {
            console.error("[nuc-citas] throw:", e)
            setCitas([])
        }
    }, [clerkUserId, userEmail, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        cargarCitas()
    }, [cargarCitas])

    const tieneCitas = clerkUserId && citas !== null && citas.length > 0

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <motion.div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(200,164,78,0.10)",
                        border: "1px solid rgba(200,164,78,0.32)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#D4A843",
                    }}
                >
                    <IStar />
                </div>
                <div style={{ textAlign: "left" }}>
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
                        Cámara de Resonancia
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: "rgba(212,168,67,0.78)",
                            margin: 0,
                            marginTop: 2,
                            letterSpacing: "0.04em",
                            textAlign: "left",
                        }}
                    >
                        Sesiones 1:1 con Zak'Haar
                    </p>
                </div>
            </motion.div>
            {tieneCitas && (
                <EscaneoRelampago
                    supabaseUrl={supabaseUrl}
                    supabaseAnonKey={supabaseAnonKey}
                    clerkUserId={clerkUserId}
                    citas={citas}
                    onCitasActualizadas={cargarCitas}
                />
            )}
            {clerkUserId && citas !== null && citas.length === 0 && (
                <div
                    style={{
                        padding: "24px 28px",
                        borderRadius: 18,
                        background:
                            "linear-gradient(165deg, rgba(5,15,30,0.55) 0%, rgba(2,8,20,0.72) 100%)",
                        border: "1px dashed rgba(0,194,255,0.26)",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: 10.5,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "rgba(0,194,255,0.78)",
                            fontWeight: 500,
                        }}
                    >
                        Cámara de Resonancia · 1:1
                    </div>
                    <div
                        style={{
                            marginTop: 12,
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "rgba(232,238,247,0.78)",
                            maxWidth: 480,
                            margin: "12px auto 0",
                            fontWeight: 300,
                        }}
                    >
                        ¿Listo para una inmersión 1:1 con Zak'Haar? Agendá tu
                        coordenada temporal y sellá tu intención antes del
                        encuentro.
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if ((window as any).rsvNavigate) {
                                ;(window as any).rsvNavigate(
                                    "/sesiones#resonancia"
                                )
                            } else if (typeof window !== "undefined") {
                                window.location.href = "/sesiones#resonancia"
                            }
                        }}
                        style={{
                            marginTop: 18,
                            padding: "11px 26px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, #D4A843 0%, #E8C65A 50%, #C8A44E 100%)",
                            color: "#0B0C13",
                            border: "none",
                            fontSize: 11.5,
                            fontWeight: 600,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(200,164,78,0.28)",
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        Agendar Cámara de Resonancia
                    </button>
                    <div
                        style={{
                            marginTop: 18,
                            fontSize: 9.5,
                            letterSpacing: "0.08em",
                            color: "rgba(180,200,220,0.28)",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                        }}
                    >
                        id: {clerkUserId} · {userEmail || "(sin email)"}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   SesionesTabPanel · v2.1 (mobile wrapper)
   Stack vertical de Cámara Solar + Cámara de Resonancia para la
   sub-pantalla mobile (v2.1 — Zak pidió invertir el orden: la
   Solar va primero como ancla del producto grupal, la Resonancia
   1:1 queda debajo). En desktop, el shell renderiza cada
   sub-sección individualmente como vista de columna 3.
   ════════════════════════════════════════════════════════════════ */
function SesionesTabPanel({
    user,
    sessions,
    sub,
    accent,
    loading,
    stripePortalUrl,
    supabaseUrl,
    supabaseAnonKey,
}: any) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <CamaraSection
                sessions={sessions}
                sub={sub}
                accent={accent}
                loading={loading}
                stripePortalUrl={stripePortalUrl}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
            />
            <CamaraResonanciaSection
                user={user}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
            />
        </div>
    )
}

/* Default export: componente fantasma + componentes como propiedades. */
function MNSesionesRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MNSesionesRoot.displayName = "MN_Sesiones"

const Sesiones = Object.assign(MNSesionesRoot, {
    SesionesTabPanel,
    CamaraResonanciaSection,
})

export default Sesiones
