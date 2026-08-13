// Privacy.tsx v1.6 — EL ESPEJO VE: el Espejo Vibracional acepta imágenes EFÍMERAS (bullet nuevo en "Qué Recopilamos" + párrafo en el bloque de IA): la imagen se interpreta con Google Gemini, se procesa en tiempo real y se DESTRUYE tras generar la respuesta — no se almacena en servidores; solo la lectura textual queda como parte de la conversación y la copia visual vive únicamente en el dispositivo del Tripulante. | v1.5 — modelo de consentimiento actualizado: el consentimiento por IA se otorga al ACEPTAR los términos al ingresar a la app (ya no hay popup de primer uso en el Decodificador de Materia), y se REVOCA desde Mi Núcleo · Ajustes · Procesamiento por IA (un solo interruptor que gobierna los dos Decodificadores + el Espejo). | v1.4 — bloque de IA: suma el Decodificador de SUEÑOS (el relato del sueño se envía a Google Gemini para su interpretación; se guarda en la Bóveda + se borra al eliminar la cuenta) — antes solo se declaraban las fotos de Materia + el Espejo. Cierre corregido: "fuera de los Decodificadores (Materia y Sueños) y del Espejo... ningún otro dato va a IA; escaneos/Calibración/Trayectoria/protocolos diarios viven solo en Supabase". | v1.3 — bloque de IA ampliado: suma el Espejo Vibracional (asistente de IA — el texto enviado a OpenRouter + Google embeddings, conversaciones guardadas, revisión anonimizada, borrado). Ajustado el cierre "ningún dato fuera del Decodificador" → "fuera del Decodificador y del Espejo".
// Privacy.tsx v1.2 — scroll interno propio (height 100dvh + overflowY auto) porque el shell de Domo tiene overflow:hidden y la política quedaba cortada.
// Política de Privacidad del Escáner Vibracional · Red Solar Viva.
// Componente standalone: Diego (Zak'Haar) lo coloca en el canvas /privacy
// de Framer y se sirve en https://www.redsolarviva.com/privacy.
// Lenguaje Sexta Densidad — adaptado al sello quántico del proyecto pero
// con cobertura legal completa para review de Apple, Google Play y GDPR.
// El texto declara qué datos recolectamos, a quién se envían, para qué
// se usan, cómo se solicitan borrado y consentimiento. El bloque de IA
// es explícito: el Decodificador envía fotografías a Google Cloud Vision
// y Google Gemini, sujeto a un AI Consent Screen al primer uso.

import * as React from "react"

const CYAN = "#00C2FF"
const GOLD = "#D4A83B"
const PLATINUM = "#E8EEF7"
const SHADOW = "rgba(0,0,0,0.45)"

function Section({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div
            style={{
                marginBottom: 36,
                paddingBottom: 28,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            <h2
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: GOLD,
                    margin: "0 0 14px",
                    textShadow: `0 0 18px ${GOLD}55`,
                }}
            >
                {title}
            </h2>
            <div
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    lineHeight: 1.78,
                    color: "rgba(232,238,247,0.82)",
                    fontWeight: 300,
                }}
            >
                {children}
            </div>
        </div>
    )
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <li style={{ marginBottom: 8 }}>
            <span style={{ color: CYAN, marginRight: 8 }}>·</span>
            <span>{children}</span>
        </li>
    )
}

function Privacy(_props: any) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100dvh",
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
                background:
                    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,194,255,0.05) 0%, transparent 60%), #02050E",
                color: PLATINUM,
                fontFamily: "'Inter',sans-serif",
                paddingTop: "calc(80px + env(safe-area-inset-top, 0px))",
                paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
                paddingLeft: 24,
                paddingRight: 24,
            }}
        >
            <div
                style={{
                    maxWidth: 760,
                    margin: "0 auto",
                }}
            >
                <header style={{ marginBottom: 56, textAlign: "center" }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 11,
                            fontWeight: 400,
                            letterSpacing: "0.42em",
                            textTransform: "uppercase",
                            color: "rgba(0,194,255,0.7)",
                            textShadow: `0 0 14px ${CYAN}33`,
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        Red Solar Viva · Escáner Vibracional
                    </p>
                    <h1
                        style={{
                            margin: "16px 0 12px",
                            fontSize: 32,
                            fontWeight: 200,
                            letterSpacing: "0.06em",
                            color: "#FFFFFF",
                            textShadow: `0 2px 24px ${SHADOW}, 0 0 40px ${CYAN}1A`,
                        }}
                    >
                        Política de Telemetría
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 300,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "rgba(232,238,247,0.45)",
                        }}
                    >
                        Última calibración · 8 de mayo de 2026
                    </p>
                </header>

                <Section title="Marco de Operación">
                    <p>
                        El Escáner Vibracional es una terminal de
                        telemetría biológica y espiritual. Para operar
                        necesita procesar datos del Tripulante: su
                        identidad básica, los resultados de sus escaneos
                        de los seis pilares, su historial de calibración,
                        las fotografías que envíe al Decodificador de
                        Materia y los pagos que realice. Esta política
                        declara qué información recibimos, quién la
                        procesa, durante cuánto tiempo y bajo qué
                        condiciones puede pedir su borrado.
                    </p>
                    <p style={{ marginTop: 14 }}>
                        Este texto aplica a la app móvil del Escáner
                        (iOS y Android), al sitio web{" "}
                        <span style={{ color: CYAN }}>
                            redsolarviva.com
                        </span>{" "}
                        y a cualquier comunicación transaccional emitida
                        por el sistema. El responsable del tratamiento
                        es la persona física que opera bajo el nombre
                        Red Solar Viva, con domicilio en México.
                    </p>
                </Section>

                <Section title="Datos que se Recolectan">
                    <p>
                        El sistema recibe únicamente lo necesario para
                        operar el Escáner. Ninguna telemetría se vende,
                        se cede a redes publicitarias ni se utiliza para
                        elaborar perfiles comerciales con terceros.
                    </p>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 16,
                        }}
                    >
                        <Bullet>
                            <strong>Identidad mínima.</strong> Nombre o
                            sello elegido, correo electrónico, foto de
                            perfil opcional. Recibidos vía Clerk al
                            momento del registro o login.
                        </Bullet>
                        <Bullet>
                            <strong>Telemetría del Avatar.</strong>{" "}
                            Resultados de los escaneos de los seis
                            pilares (Hardware Físico, Procesador
                            Mental, Motor Emocional, Gravedad
                            Financiera, Vector de Expansión, Órbita
                            Relacional), Índice de Luz derivado,
                            historial de ciclos, progreso de
                            Calibración. Almacenados en Supabase.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Fotografías del Decodificador.
                            </strong>{" "}
                            Imágenes que el Tripulante toma de
                            etiquetas, productos o sustancias para que
                            el Decodificador analice su composición y
                            toxicidad. Se procesan en tiempo real y se
                            descartan tras generar el dictamen — no se
                            almacenan en nuestros servidores. El
                            dictamen sí queda guardado en su cuenta.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Imágenes del Espejo Vibracional.
                            </strong>{" "}
                            Imágenes que el Tripulante comparte
                            voluntariamente en su conversación con el
                            Espejo. Se procesan en tiempo real y se
                            destruyen inmediatamente después de generar
                            la respuesta — no se almacenan en nuestros
                            servidores. Lo único que se conserva, como
                            parte de la conversación, es la lectura
                            textual que la IA hizo de la imagen; una
                            copia visual queda únicamente en el
                            dispositivo del Tripulante y se elimina al
                            borrar la conversación.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Datos de transacción.
                            </strong>{" "}
                            Compras de la membresía Sintonía Solar,
                            estado de suscripción, fechas de
                            renovación. Procesados directamente por
                            Apple App Store (a través de StoreKit y
                            RevenueCat) o por Stripe en el flujo web.
                            No vemos números de tarjeta ni datos de
                            cuenta bancaria.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Diagnóstico técnico mínimo.
                            </strong>{" "}
                            Tipo de dispositivo, navegador y errores
                            técnicos cuando ocurren. Sin identificadores
                            de tracking publicitario.
                        </Bullet>
                    </ul>
                </Section>

                <Section title="Procesamiento por Inteligencia Artificial">
                    <p>
                        El Decodificador de Materia utiliza modelos de
                        IA externos para analizar las fotografías que
                        envía el Tripulante. Específicamente:
                    </p>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 14,
                        }}
                    >
                        <Bullet>
                            <strong>
                                Google Cloud Vision API
                            </strong>{" "}
                            extrae el texto y los elementos visuales
                            de la fotografía.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Google Gemini (modelo Flash)
                            </strong>{" "}
                            recibe ese texto y produce el dictamen de
                            composición y toxicidad.
                        </Bullet>
                    </ul>
                    <p style={{ marginTop: 14 }}>
                        El Tripulante otorga su consentimiento para
                        este procesamiento al aceptar estos términos al
                        ingresar a la app. Google puede retener
                        temporalmente las fotografías según sus propias
                        políticas operativas; estas políticas son ajenas
                        a Red Solar Viva. El Tripulante puede revocar su
                        consentimiento en cualquier momento desde Mi
                        Núcleo · Ajustes · Procesamiento por IA; al
                        hacerlo, los Decodificadores y el Espejo dejan de
                        enviar datos a servicios de IA.
                    </p>
                    <p style={{ marginTop: 14 }}>
                        El <strong>Decodificador de Sueños</strong>{" "}
                        funciona de forma análoga, pero con texto en lugar
                        de fotografías: el relato del sueño que escribe el
                        Tripulante se envía a{" "}
                        <strong>Google Gemini</strong> para generar su
                        interpretación. El relato y su interpretación se
                        guardan ligados a la cuenta del Tripulante en su
                        Bóveda de Sueños y se eliminan si borra su cuenta.
                    </p>
                    <p style={{ marginTop: 14 }}>
                        El <strong>Espejo Vibracional</strong> es un
                        asistente de inteligencia artificial
                        conversacional. El texto que el Tripulante
                        escribe en el Espejo se envía a proveedores de
                        IA externos para generar la respuesta:{" "}
                        <strong>OpenRouter</strong> (que enruta el
                        mensaje a un modelo de lenguaje) y{" "}
                        <strong>Google</strong> (que convierte la
                        consulta en una representación numérica para
                        buscar el contenido relevante). Las
                        conversaciones se guardan ligadas a la cuenta del
                        Tripulante para mantener su historial; pueden
                        revisarse de forma anonimizada — sin nombre ni
                        correo — para mejorar la calidad del asistente, y
                        no se usan con fines publicitarios ni de
                        seguimiento. El Tripulante puede eliminar su
                        conversación en cualquier momento desde la propia
                        pantalla del Espejo.
                    </p>
                    <p style={{ marginTop: 14 }}>
                        El Espejo Vibracional también puede recibir{" "}
                        <strong>imágenes</strong> que el Tripulante
                        decida compartir. Cada imagen se envía a{" "}
                        <strong>Google Gemini</strong> únicamente para
                        interpretarla y se procesa en tiempo real: la
                        imagen se destruye en cuanto se genera la
                        respuesta y no se almacena en nuestros
                        servidores ni en servicios de almacenamiento
                        propios. Lo que sí se conserva, como parte de la
                        conversación del Tripulante, es la lectura
                        textual que la IA hizo de la imagen (para que el
                        Espejo pueda recordar lo que vio en mensajes
                        posteriores). Una copia visual de la imagen
                        permanece únicamente en el dispositivo del
                        Tripulante — nunca viaja de vuelta a nuestros
                        sistemas — y se elimina al borrar la
                        conversación. Google puede retener temporalmente
                        las imágenes según sus propias políticas
                        operativas, ajenas a Red Solar Viva.
                    </p>
                    <p style={{ marginTop: 14 }}>
                        Fuera de los Decodificadores (Materia y Sueños)
                        y del Espejo Vibracional, ningún otro dato del
                        Escáner se envía a modelos de IA. Los escaneos
                        de los seis pilares, el progreso de Calibración,
                        el historial de Trayectoria y los protocolos
                        diarios del Tripulante viven íntegramente en
                        Supabase y no se procesan con modelos externos.
                    </p>
                </Section>

                <Section title="A Quién se Envía">
                    <p>
                        Cada componente del sistema cumple un rol
                        técnico específico. Ningún dato se comparte
                        fuera de esta cadena.
                    </p>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 14,
                        }}
                    >
                        <Bullet>
                            <strong>Supabase</strong> — base de datos
                            principal. Almacena identidad, telemetría
                            del Avatar, dictámenes del Decodificador y
                            estado de membresía. Servidores en regiones
                            de Estados Unidos y la Unión Europea.
                        </Bullet>
                        <Bullet>
                            <strong>Clerk</strong> — gestión de
                            autenticación. Almacena credenciales,
                            sesiones y proveedores de login social
                            (Google, Apple).
                        </Bullet>
                        <Bullet>
                            <strong>
                                Apple App Store y RevenueCat
                            </strong>{" "}
                            — procesamiento de suscripciones in-app
                            cuando el Tripulante compra desde iOS.
                        </Bullet>
                        <Bullet>
                            <strong>Stripe</strong> — procesamiento de
                            pagos cuando el Tripulante compra desde el
                            sitio web.
                        </Bullet>
                        <Bullet>
                            <strong>
                                Google Cloud Vision y Gemini
                            </strong>{" "}
                            — procesamiento del Decodificador, sujeto
                            a consentimiento explícito.
                        </Bullet>
                        <Bullet>
                            <strong>
                                ProtonMail SMTP y Pipedream
                            </strong>{" "}
                            — envío de correos transaccionales
                            (bienvenida, cierre de ciclo, recordatorios
                            de calibración).
                        </Bullet>
                        <Bullet>
                            <strong>Cloudflare R2</strong> —
                            alojamiento de los Códices de Luz, las
                            Meditaciones y los recursos visuales del
                            Domo.
                        </Bullet>
                    </ul>
                </Section>

                <Section title="Cuánto Tiempo se Conserva">
                    <p>
                        Los datos de identidad y telemetría se
                        conservan mientras el Tripulante mantenga su
                        cuenta activa. Si elimina su cuenta, todos sus
                        registros en Supabase se borran permanentemente
                        en un plazo máximo de 30 días. Las fotografías
                        del Decodificador se procesan y descartan en
                        tiempo real — no se almacenan más allá del
                        momento del análisis. Los datos transaccionales
                        de Apple y Stripe se conservan según las
                        obligaciones legales fiscales aplicables (en
                        México, hasta 5 años).
                    </p>
                </Section>

                <Section title="Derechos del Tripulante">
                    <p>
                        En cualquier momento el Tripulante puede:
                    </p>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 14,
                        }}
                    >
                        <Bullet>
                            Acceder a todos sus datos almacenados
                            (export en formato JSON disponible bajo
                            solicitud).
                        </Bullet>
                        <Bullet>
                            Corregir información incorrecta.
                        </Bullet>
                        <Bullet>
                            Eliminar su cuenta y exigir el borrado de
                            todos los datos asociados.
                        </Bullet>
                        <Bullet>
                            Revocar el consentimiento de procesamiento
                            por IA (el Decodificador deja de operar
                            hasta que vuelva a otorgarlo).
                        </Bullet>
                        <Bullet>
                            Cancelar su suscripción en cualquier
                            momento (Apple Settings · Suscripciones
                            para iOS, Stripe customer portal para web).
                        </Bullet>
                        <Bullet>
                            Presentar una queja ante la autoridad de
                            protección de datos competente en su
                            jurisdicción.
                        </Bullet>
                    </ul>
                    <p style={{ marginTop: 14 }}>
                        Para ejercer cualquiera de estos derechos basta
                        escribir a{" "}
                        <span
                            style={{
                                color: CYAN,
                                fontFamily: "'JetBrains Mono',monospace",
                            }}
                        >
                            cuerpodeluz555@gmail.com
                        </span>
                        . Respondemos en un plazo máximo de 15 días
                        hábiles.
                    </p>
                </Section>

                <Section title="Menores de Edad">
                    <p>
                        El Escáner Vibracional está diseñado para
                        Tripulantes mayores de 16 años. No solicitamos
                        ni procesamos conscientemente datos de menores
                        de 16. Si detectamos que un menor abrió cuenta,
                        la eliminamos inmediatamente al recibir aviso.
                    </p>
                </Section>

                <Section title="Cambios en la Política">
                    <p>
                        Cuando hagamos cambios sustanciales en esta
                        política, lo notificaremos con un anuncio
                        dentro de la app y por correo electrónico. La
                        fecha de última calibración aparece al
                        principio de este documento.
                    </p>
                </Section>

                <Section title="Contacto">
                    <p>
                        Cualquier consulta, solicitud o reclamación
                        sobre esta política se atiende en:
                    </p>
                    <p
                        style={{
                            marginTop: 14,
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 13,
                            color: CYAN,
                            letterSpacing: "0.04em",
                        }}
                    >
                        cuerpodeluz555@gmail.com
                    </p>
                </Section>

                <footer
                    style={{
                        textAlign: "center",
                        marginTop: 48,
                        paddingTop: 32,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.36em",
                            textTransform: "uppercase",
                            color: "rgba(232,238,247,0.32)",
                            margin: 0,
                        }}
                    >
                        Red Solar Viva · Frecuencia Cero
                    </p>
                </footer>
            </div>
        </div>
    )
}

Privacy.displayName = "Privacy"

export default Privacy
