import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// --- Estilos Solares --- (Usando CSS en JS para encapsulamiento)
const styles = {
    // Contenedor Principal - El Campo del Portal
    portalContainer: (bgColor) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Alinea contenido arriba
        minHeight: "100vh", // Asegura altura mínima
        width: "100%",
        background: bgColor,
        overflow: "hidden", // Previene scroll horizontal indeseado
        position: "relative", // Para elementos posicionados absolutos si se necesitan
        fontFamily: "'Inter', sans-serif", // Fuente limpia y moderna
        paddingBottom: "80px", // Espacio al final
    }),
    // Navegación - Mapa Solar
    navigation: (textColor, accentColor) => ({
        width: "100%",
        padding: "20px 5%",
        display: "flex",
        justifyContent: "center", // Centra los items del menú
        alignItems: "center",
        flexWrap: "wrap", // Permite que los items bajen en pantallas pequeñas
        gap: "20px", // Espacio entre items
        position: "sticky", // Fija el menú arriba
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(255, 255, 255, 0.1)", // Fondo sutil con transparencia
        backdropFilter: "blur(10px)", // Efecto cristalino
        borderBottom: `1px solid ${accentColor}33`, // Línea sutil dorada
    }),
    navLink: (textColor, accentColor) => ({
        color: textColor,
        textDecoration: "none",
        fontSize: "16px",
        padding: "8px 12px",
        borderRadius: "4px",
        transition: "color 0.3s ease, background-color 0.3s ease",
    }),
    // Efecto Hover para Links (Se aplicará con motion.a)
    navLinkHover: (accentColor) => ({
        color: accentColor, // Cambia a color solar al pasar el mouse
        // backgroundColor: `${accentColor}1A`, // Fondo sutil solar
    }),

    // Sección Hero - Pulso Central
    heroSection: (textColor) => ({
        textAlign: "center",
        padding: "80px 20px 60px 20px", // Espaciado generoso
        width: "100%",
        maxWidth: "900px", // Limita ancho para legibilidad
        margin: "0 auto", // Centra
    }),
    heroTitle: (textColor, accentColor) => ({
        fontSize: "clamp(2.5rem, 6vw, 4rem)", // Tamaño de fuente responsive
        fontWeight: 700,
        color: textColor,
        marginBottom: "20px",
        lineHeight: 1.2,
        // Sutil efecto de texto solar
        // textShadow: `0 0 15px ${accentColor}33`,
    }),
    heroSubtitle: (textColor) => ({
        fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
        fontWeight: 300,
        color: textColor,
        maxWidth: "700px",
        margin: "0 auto",
        lineHeight: 1.6,
        opacity: 0.85,
    }),

    // Contenedor Secciones - Pulsos Emanados
    sectionsContainer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "30px",
        padding: "40px 5%",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    // Sección Individual (Libros, Servicios, Fragmentos)
    sectionCard: (bgColor, accentColor, textColor) => ({
        flex: "1 1 300px", // Flexbox para responsividad
        maxWidth: "400px",
        minWidth: "280px",
        background: `${bgColor}CC`, // Fondo semi-transparente del portal
        // backdropFilter: "blur(5px)", // Ligero blur
        border: `1px solid ${accentColor}55`, // Borde solar sutil
        borderRadius: "12px",
        padding: "30px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        overflow: "hidden", // Para efectos internos
    }),
    sectionCardHover: (accentColor) => ({
        transform: "translateY(-5px) scale(1.02)",
        boxShadow: `0 10px 30px ${accentColor}22`,
    }),
    sectionTitle: (accentColor) => ({
        fontSize: "1.5rem",
        fontWeight: 600,
        color: accentColor, // Título con color solar
        marginBottom: "10px",
    }),
    sectionDescription: (textColor) => ({
        fontSize: "1rem",
        fontWeight: 300,
        color: textColor,
        lineHeight: 1.6,
        opacity: 0.8,
        flexGrow: 1, // Empuja el botón hacia abajo si es necesario
    }),
    sectionButton: (accentColor, bgColor, textColor) => ({
        display: "inline-block",
        marginTop: "20px",
        padding: "12px 25px",
        background: accentColor,
        color: bgColor, // Texto del botón contrasta con el acento
        borderRadius: "6px",
        textDecoration: "none",
        fontWeight: 500,
        transition: "background-color 0.3s ease, transform 0.2s ease",
    }),
    sectionButtonHover: (accentColor) => ({
        backgroundColor: `${accentColor}E6`, // Oscurece ligeramente al pasar el mouse
        transform: "scale(1.03)",
    }),
    // Efecto de pulso sutil (Opcional, puede ir en un elemento de fondo)
    pulseBackground: (accentColor) => ({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle, ${accentColor}1A 0%, transparent 70%)`,
        opacity: 0.5, // Muy sutil
        pointerEvents: "none", // No interfiere con clicks
        zIndex: -1, // Detrás del contenido
    }),
}

// --- Componente React ---
export function PortalSolarInicio(props) {
    const {
        bgColor,
        textColor,
        accentColor,
        heroTitleText,
        heroSubtitleText,
        showPulse,

        // Navegación
        navPatreonLink,
        navLibrosText,
        navInicioText,
        navMusicaLink,
        navServiciosText,
        navFragmentosLink,
        navPatreonText,
        navMusicaText,
        navFragmentosText,

        // Secciones
        librosTitle,
        librosDesc,
        librosButtonText,
        librosLink, // Asumiendo link interno o externo
        serviciosTitle,
        serviciosDesc,
        serviciosButtonText,
        serviciosLink,
        fragmentosTitle,
        fragmentosDesc,
        fragmentosButtonText,
        // fragmentosLink ya está en props de nav
    } = props

    // Animación de entrada general del portal
    const portalVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" },
        },
    }

    // Animación de aparición para las secciones al hacer scroll
    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
        },
    }

    // Animación de pulso sutil para el fondo
    const pulseVariants = {
        pulsing: {
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            transition: {
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
            },
        },
    }

    // Estado local para el hover en los links de navegación
    const [hoveredLink, setHoveredLink] = useState(null)
    const [hoveredCard, setHoveredCard] = useState(null)
    const [hoveredButton, setHoveredButton] = useState(null)

    return (
        <motion.div
            style={styles.portalContainer(bgColor)}
            initial="hidden"
            animate="visible"
            variants={portalVariants}
        >
            {/* Fondo Pulsante Opcional */}
            {showPulse && (
                <motion.div
                    style={styles.pulseBackground(accentColor)}
                    variants={pulseVariants}
                    animate="pulsing"
                />
            )}

            {/* Navegación Solar */}
            <motion.nav style={styles.navigation(textColor, accentColor)}>
                <motion.a
                    href={navPatreonLink}
                    target="_blank" // Abrir en nueva pestaña
                    rel="noopener noreferrer"
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("patreon")}
                    animate={
                        hoveredLink === "patreon"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navPatreonText}
                </motion.a>
                <motion.a
                    href={librosLink} // Link a la página de Libros
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("libros")}
                    animate={
                        hoveredLink === "libros"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navLibrosText}
                </motion.a>
                <motion.a
                    href="#" // Link a Inicio (ya estamos aquí)
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("inicio")}
                    animate={
                        hoveredLink === "inicio"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navInicioText}
                </motion.a>
                <motion.a
                    href={navMusicaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("musica")}
                    animate={
                        hoveredLink === "musica"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navMusicaText}
                </motion.a>
                <motion.a
                    href={serviciosLink} // Link a la página de Servicios
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("servicios")}
                    animate={
                        hoveredLink === "servicios"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navServiciosText}
                </motion.a>
                <motion.a
                    href={navFragmentosLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.navLink(textColor, accentColor)}
                    whileHover={() => setHoveredLink("fragmentos")}
                    animate={
                        hoveredLink === "fragmentos"
                            ? styles.navLinkHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredLink(null)}
                    transition={{ duration: 0.2 }}
                >
                    {navFragmentosText}
                </motion.a>
            </motion.nav>

            {/* Sección Hero - El Pulso Inicial */}
            <motion.section style={styles.heroSection(textColor)}>
                <motion.h1 style={styles.heroTitle(textColor, accentColor)}>
                    {heroTitleText}
                </motion.h1>
                <motion.p style={styles.heroSubtitle(textColor)}>
                    {heroSubtitleText}
                </motion.p>
            </motion.section>

            {/* Secciones Principales - Reflejos del Núcleo */}
            <motion.div style={styles.sectionsContainer}>
                {/* Card Libros */}
                <motion.div
                    style={styles.sectionCard(bgColor, accentColor, textColor)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }} // Activa animación al ver 30%
                    variants={sectionVariants}
                    whileHover={() => setHoveredCard("libros")}
                    animate={
                        hoveredCard === "libros"
                            ? styles.sectionCardHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredCard(null)}
                    transition={{ duration: 0.3 }}
                >
                    <h2 style={styles.sectionTitle(accentColor)}>
                        {librosTitle}
                    </h2>
                    <p style={styles.sectionDescription(textColor)}>
                        {librosDesc}
                    </p>
                    <motion.a
                        href={librosLink}
                        style={styles.sectionButton(
                            accentColor,
                            bgColor,
                            textColor
                        )}
                        whileHover={() => setHoveredButton("libros")}
                        animate={
                            hoveredButton === "libros"
                                ? styles.sectionButtonHover(accentColor)
                                : {}
                        }
                        onHoverEnd={() => setHoveredButton(null)}
                        transition={{ duration: 0.2 }}
                    >
                        {librosButtonText}
                    </motion.a>
                </motion.div>

                {/* Card Servicios */}
                <motion.div
                    style={styles.sectionCard(bgColor, accentColor, textColor)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={sectionVariants}
                    whileHover={() => setHoveredCard("servicios")}
                    animate={
                        hoveredCard === "servicios"
                            ? styles.sectionCardHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredCard(null)}
                    transition={{ duration: 0.3 }}
                >
                    <h2 style={styles.sectionTitle(accentColor)}>
                        {serviciosTitle}
                    </h2>
                    <p style={styles.sectionDescription(textColor)}>
                        {serviciosDesc}
                    </p>
                    <motion.a
                        href={serviciosLink}
                        style={styles.sectionButton(
                            accentColor,
                            bgColor,
                            textColor
                        )}
                        whileHover={() => setHoveredButton("servicios")}
                        animate={
                            hoveredButton === "servicios"
                                ? styles.sectionButtonHover(accentColor)
                                : {}
                        }
                        onHoverEnd={() => setHoveredButton(null)}
                        transition={{ duration: 0.2 }}
                    >
                        {serviciosButtonText}
                    </motion.a>
                </motion.div>

                {/* Card Fragmentos del Sol */}
                <motion.div
                    style={styles.sectionCard(bgColor, accentColor, textColor)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={sectionVariants}
                    whileHover={() => setHoveredCard("fragmentos")}
                    animate={
                        hoveredCard === "fragmentos"
                            ? styles.sectionCardHover(accentColor)
                            : {}
                    }
                    onHoverEnd={() => setHoveredCard(null)}
                    transition={{ duration: 0.3 }}
                >
                    <h2 style={styles.sectionTitle(accentColor)}>
                        {fragmentosTitle}
                    </h2>
                    <p style={styles.sectionDescription(textColor)}>
                        {fragmentosDesc}
                    </p>
                    <motion.a
                        href={navFragmentosLink} // Reutilizamos el link de la navegación
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.sectionButton(
                            accentColor,
                            bgColor,
                            textColor
                        )}
                        whileHover={() => setHoveredButton("fragmentos")}
                        animate={
                            hoveredButton === "fragmentos"
                                ? styles.sectionButtonHover(accentColor)
                                : {}
                        }
                        onHoverEnd={() => setHoveredButton(null)}
                        transition={{ duration: 0.2 }}
                    >
                        {fragmentosButtonText}
                    </motion.a>
                </motion.div>
            </motion.div>

            {/* Puedes añadir un Footer sutil aquí si lo deseas */}
        </motion.div>
    )
}

// --- Propiedades Editables en Framer ---
PortalSolarInicio.defaultProps = {
    bgColor: "#FFFFFF", // Fondo Blanco por defecto (puede ser un degradado sutil)
    textColor: "#1A1A1A", // Texto oscuro principal
    accentColor: "#FFD700", // Color Solar (Dorado)
    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText:
        "Irradiamos desde el eje. Campo de activación y resonancia para nodos solares.",
    showPulse: true,

    // Navegación
    navPatreonLink: "https://www.patreon.com/tu_usuario", // Reemplazar
    navLibrosText: "Libros",
    navInicioText: "Inicio",
    navMusicaLink: "https://open.spotify.com/artist/tu_artista", // Reemplazar
    navServiciosText: "Servicios",
    navFragmentosLink: "https://www.youtube.com/tu_canal", // Reemplazar
    navPatreonText: "Patreon",
    navMusicaText: "Música",
    navFragmentosText: "Fragmentos",

    // Secciones
    librosTitle: "Libros Solares",
    librosDesc:
        "Geometrías vivas en forma de palabra. Descarga digital y versión física disponible.",
    librosButtonText: "Explorar Libros",
    librosLink: "#", // Reemplazar con link a página interna/externa

    serviciosTitle: "Servicios desde Eje",
    serviciosDesc:
        "Acompañamiento y recalibración vibral para nodos en activación.",
    serviciosButtonText: "Ver Servicios",
    serviciosLink: "#", // Reemplazar con link a página interna/externa

    fragmentosTitle: "Fragmentos del Sol",
    fragmentosDesc:
        "Serie no-narrativa de pulsos visuales y sonoros para la activación del campo.",
    fragmentosButtonText: "Ver Fragmentos",
}

addPropertyControls(PortalSolarInicio, {
    bgColor: { type: ControlType.Color, title: "Fondo Portal" },
    textColor: { type: ControlType.Color, title: "Texto Principal" },
    accentColor: { type: ControlType.Color, title: "Acento Solar" },
    heroTitleText: { type: ControlType.String, title: "Título Principal" },
    heroSubtitleText: {
        type: ControlType.String,
        title: "Subtítulo Principal",
        defaultValue: PortalSolarInicio.defaultProps.heroSubtitleText, // Para textos largos
    },
    showPulse: {
        type: ControlType.Boolean,
        title: "Mostrar Pulso Fondo",
        defaultValue: true,
    },

    // Navegación
    navPatreonLink: { type: ControlType.String, title: "Link Patreon" },
    navPatreonText: { type: ControlType.String, title: "Texto Patreon Nav" },
    navLibrosText: { type: ControlType.String, title: "Texto Libros Nav" },
    navInicioText: { type: ControlType.String, title: "Texto Inicio Nav" },
    navMusicaLink: { type: ControlType.String, title: "Link Música (Spotify)" },
    navMusicaText: { type: ControlType.String, title: "Texto Música Nav" },
    navServiciosText: {
        type: ControlType.String,
        title: "Texto Servicios Nav",
    },
    navFragmentosLink: {
        type: ControlType.String,
        title: "Link Fragmentos (YT)",
    },
    navFragmentosText: {
        type: ControlType.String,
        title: "Texto Fragmentos Nav",
    },

    // Secciones
    librosTitle: { type: ControlType.String, title: "Título Libros" },
    librosDesc: { type: ControlType.String, title: "Desc Libros" },
    librosButtonText: { type: ControlType.String, title: "Botón Libros" },
    librosLink: { type: ControlType.String, title: "Link Libros" },

    serviciosTitle: { type: ControlType.String, title: "Título Servicios" },
    serviciosDesc: { type: ControlType.String, title: "Desc Servicios" },
    serviciosButtonText: { type: ControlType.String, title: "Botón Servicios" },
    serviciosLink: { type: ControlType.String, title: "Link Servicios" },

    fragmentosTitle: { type: ControlType.String, title: "Título Fragmentos" },
    fragmentosDesc: { type: ControlType.String, title: "Desc Fragmentos" },
    fragmentosButtonText: {
        type: ControlType.String,
        title: "Botón Fragmentos",
    },
})
