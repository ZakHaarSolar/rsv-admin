import * as React from "react"
import { useEffect, useState } from "react"

export default function GraciasPorTuCompra() {
    const [estado, setEstado] = useState("verificando")

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get("session_id")

        // 🌞 Si no hay session_id en la URL:
        if (!sessionId) {
            setEstado("sin_sesion")
            return
        }

        // 🌞 Si hay session_id → enviamos al webhook de Pipedream:
        const enviarWebhook = async () => {
            try {
                const res = await fetch(
                    "https://eok5cc1s3yh0kfv.m.pipedream.net",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ session_id: sessionId }),
                    }
                )

                if (!res.ok) throw new Error("Error al contactar el servidor.")
                setEstado("exito")
            } catch (err) {
                console.error(err)
                setEstado("error")
            }
        }

        enviarWebhook()
    }, [])

    // --- Layout solar universal ---
    const styles = {
        contenedor: {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FDF7EE",
            color: "#4C3C2E",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            textAlign: "center",
            padding: "32px",
            lineHeight: 1.6,
        },
        titulo: {
            color: "#E8C976",
            fontSize: "1.8em",
            fontWeight: "600",
            marginBottom: "12px",
        },
        mensaje: {
            maxWidth: "600px",
            fontSize: "1.1em",
            marginBottom: "32px",
        },
        enlace: {
            backgroundColor: "#E8C976",
            color: "#4C3C2E",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: "bold",
            textDecoration: "none",
            transition: "all 0.3s ease",
        },
    }

    // --- Render solar según el estado ---
    if (estado === "verificando") {
        return (
            <div style={styles.contenedor}>
                <h2 style={styles.titulo}>☀️ Verificando tu pulso solar...</h2>
                <p style={styles.mensaje}>
                    Espera unos instantes mientras anclamos tu frecuencia de
                    compra en el nodo.
                </p>
            </div>
        )
    }

    if (estado === "sin_sesion") {
        return (
            <div style={styles.contenedor}>
                <h2 style={styles.titulo}>⚜️ Portal protegido</h2>
                <p style={styles.mensaje}>
                    Este espacio se abre solo después de una transacción solar
                    confirmada.
                    <br />
                    Si llegaste aquí por error, puedes volver al Origen.
                </p>
                <a href="/" style={styles.enlace}>
                    ← Volver al Origen
                </a>
            </div>
        )
    }

    if (estado === "error") {
        return (
            <div style={styles.contenedor}>
                <h2 style={styles.titulo}>⚠️ Hubo un pequeño desajuste</h2>
                <p style={styles.mensaje}>
                    No pudimos confirmar tu transacción. Si el pago fue
                    correcto, el correo de descarga llegará en breve. Si no,
                    contáctanos en{" "}
                    <a
                        href="mailto:zakhaar@redsolarviva.com"
                        style={{
                            color: "#E8C976",
                            textDecoration: "none",
                            fontWeight: "bold",
                        }}
                    >
                        zakhaar@redsolarviva.com
                    </a>
                </p>
            </div>
        )
    }

    if (estado === "exito") {
        return (
            <div style={styles.contenedor}>
                <h2 style={styles.titulo}>🌞 Gracias por tu compra</h2>
                <p style={styles.mensaje}>
                    Tu frecuencia ha sido recibida con gratitud. En los próximos
                    instantes recibirás un correo solar con tus descargas.
                </p>
                <p style={styles.mensaje}>
                    ☀️ Que tu sol interior siga irradiando.
                </p>
                <a href="/" style={styles.enlace}>
                    Volver al Origen
                </a>
            </div>
        )
    }

    return null
}
