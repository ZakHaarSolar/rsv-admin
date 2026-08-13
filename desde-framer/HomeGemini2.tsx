import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// --- Estilos Solares Estelares ---
const styles = {
    // Contenedor Principal - El Campo Estelar
    portalContainer: (bgColor) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Alinea menú arriba, permite scroll si contenido excede
        minHeight: "100vh",
        width: "100%",
        // Fondo espacial sutil y dinámico
        background: `radial-gradient(ellipse at bottom, ${bgColor} 0%, #0a0a1a 100%)`, // Oscuro profundo
        overflow: "hidden", // Controla overflow general
        position: "relative",
        fontFamily: "'Inter', sans-serif",
    }),
    // Estrellas de fondo (Opcional, puede requerir más performance)
    starsBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Usar imagen o generar con JS/CSS si se quiere más dinámico
        // background: 'url(link_a_imagen_estrellas.png) repeat',
        opacity: 0.3,
        pointerEvents: "none",
        zIndex: 0,
    },
    // Navegación - Coordenadas Fijas
    navigation: (textColor, accentColor) => ({
        width: "100%",
        padding: "15px 5%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px 25px", // Espacio vertical y horizontal
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 10, 30, 0.5)", // Fondo espacial oscuro translúcido
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${accentColor}44`, // Borde solar muy sutil
    }),
    navLink: (textColor, accentColor) => ({
        color: textColor,
        textDecoration: "none",
        fontSize: "15px", // Ligeramente más pequeño
        padding: "6px 10px",
        borderRadius: "4px",
        transition: "color 0.3s ease",
        opacity: 0.85,
    }),
    navLinkHover: (accentColor) => ({
        color: accentColor,
        opacity: 1,
        // textShadow: `0 0 8px ${accentColor}55`, // Sutil brillo al link activo/hover
    }),

    // Contenedor Central - Sistema Solar
    solarSystemContainer: {
        flexGrow: 1, // Ocupa el espacio restante
        display: "flex",
        flexDirection: "column", // Coloca título y planetas verticalmente
        alignItems: "center",
        justifyContent: "center", // Centra el sistema vertical y horizontalmente
        width: "100%",
        padding: "40px 20px", // Espacio alrededor del sistema
        position: "relative", // Para posicionar planetas y sol
        minHeight: "calc(100vh - 80px)", // Altura mínima descontando nav aprox
    },
    // Pulso Central - Título (El Sol)
    centralPulse: (textColor, accentColor) => ({
        textAlign: "center",
        marginBottom: "60px", // Espacio entre título y planetas
        zIndex: 10, // Encima de los planetas si se solapan
    }),
    heroTitle: (textColor, accentColor) => ({
        fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
        fontWeight: 700,
        color: textColor,
        marginBottom: "15px",
        lineHeight: 1.2,
        // Efecto solar más pronunciado
        textShadow: `0 0 10px ${accentColor}33, 0 0 20px ${accentColor}22`,
    }),
    heroSubtitle: (textColor) => ({
        fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
        fontWeight: 300,
        color: textColor,
        maxWidth: "600px",
        margin: "0 auto",
        lineHeight: 1.6,
        opacity: 0.8,
    }),

    // Contenedor de Planetas/Nodos
    planetsContainer: {
        display: "flex",
        flexWrap: "wrap", // Permite que los planetas se reorganicen
        justifyContent: "center",
        alignItems: "center",
        gap: "50px 60px", // Espacio entre planetas
        width: "100%",
        maxWidth: "1000px", // Limita el ancho del sistema
        position: "relative", // Para órbitas (si se implementan)
        zIndex: 5,
    },
    // Planeta/Nodo Individual
    planetNode: (size, planetBgColor, accentColor) => ({
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: planetBgColor, // Color base del planeta
        position: "relative", // Necesario para el tooltip y efectos
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.4s ease, box-shadow 0.4s ease",
        // Sutil brillo base
        boxShadow: `0 0 15px ${planetBgColor}66, 0 0 25px ${accentColor}33`,
    }),
    planetNodeHover: (accentColor, planetBgColor) => ({
        transform: "scale(1.15)", // Aumenta tamaño al pasar el mouse
        // Brillo más intenso al hacer hover
        boxShadow: `0 0 25px ${planetBgColor}AA, 0 0 40px ${accentColor}77, 0 0 60px ${accentColor}44`,
    }),
    planetLabel: (textColor) => ({
        // Texto dentro o cerca del planeta
        fontSize: "14px",
        fontWeight: 500,
        color: textColor,
        textAlign: "center",
        position: "absolute", // Posicionar relativo al planeta
        bottom: "-30px", // Debajo del planeta
        width: "100px", // Ancho para centrar texto
        left: "50%",
        transform: "translateX(-50%)",
        opacity: 0.7,
        transition: "opacity 0.3s ease",
    }),
    planetLabelHover: {
        opacity: 1,
    },

    // Tooltip / Pulso Informativo (Aparece al hacer hover)
    tooltip: (accentColor, bgColor, textColor) => ({
        position: "absolute",
        bottom: "calc(100% + 15px)", // Encima del planeta
        left: "50%",
        transform: "translateX(-50%)",
        width: "280px", // Ancho del tooltip
        padding: "15px 20px",
        background: `rgba(10, 10, 30, 0.85)`, // Fondo oscuro translúcido
        backdropFilter: "blur(10px)",
        border: `1px solid ${accentColor}77`,
        borderRadius: "8px",
        color: textColor,
        textAlign: "center",
        zIndex: 110, // Encima de todo
        pointerEvents: "none", // No interfiere con el hover del planeta
        boxShadow: `0 5px 15px rgba(0,0,0,0.2)`,
    }),
    tooltipTitle: (accentColor) => ({
        fontSize: "1.1rem",
        fontWeight: 600,
        color: accentColor,
        marginBottom: "8px",
    }),
    tooltipDesc: (textColor) => ({
        fontSize: "0.9rem",
        fontWeight: 300,
        color: textColor,
        lineHeight: 1.5,
        opacity: 0.85,
    }),
}

// --- Componente React ---
export function PortalEstelarInicio(props) {
    const {
        bgColor,
        textColor,
        accentColor,
        // Planetas y Nodos
        p1_BgColor,
        p1_Size,
        p1_Title,
        p1_Desc,
        p1_Link,
        p1_TargetBlank,
        p2_BgColor,
        p2_Size,
        p2_Title,
        p2_Desc,
        p2_Link,
        p2_TargetBlank,
        p3_BgColor,
        p3_Size,
        p3_Title,
        p3_Desc,
        p3_Link,
        p3_TargetBlank,
        p4_BgColor,
        p4_Size,
        p4_Title,
        p4_Desc,
        p4_Link,
        p4_TargetBlank,
        p5_BgColor,
        p5_Size,
        p5_Title,
        p5_Desc,
        p5_Link,
        p5_TargetBlank,
        // Título Central
        heroTitleText,
        heroSubtitleText,
        // Navegación (Links y Textos)
        navPatreonLink,
        navPatreonText,
        navLibrosText,
        navInicioText,
        navMusicaLink,
        navMusicaText,
        navServiciosText,
        navFragmentosLink,
        navFragmentosText,
    } = props

    // Estado para manejar qué tooltip está visible
    const [activeTooltip, setActiveTooltip] = useState(null)

    // Estado local para el hover en los links de navegación
    const [hoveredLink, setHoveredLink] = useState(null)
    const [hoveredPlanet, setHoveredPlanet] = useState(null)

    // Datos de los planetas (Nodos) - Mapea props a un array para fácil renderizado
    const planetData = [
        {
            id: "libros",
            bgColor: p1_BgColor,
            size: p1_Size,
            title: p1_Title,
            desc: p1_Desc,
            link: p1_Link,
            targetBlank: p1_TargetBlank,
            navText: navLibrosText,
        },
        {
            id: "servicios",
            bgColor: p2_BgColor,
            size: p2_Size,
            title: p2_Title,
            desc: p2_Desc,
            link: p2_Link,
            targetBlank: p2_TargetBlank,
            navText: navServiciosText,
        },
        {
            id: "fragmentos",
            bgColor: p3_BgColor,
            size: p3_Size,
            title: p3_Title,
            desc: p3_Desc,
            link: navFragmentosLink,
            targetBlank: true,
            navText: navFragmentosText,
        }, // Usa link de nav
        {
            id: "musica",
            bgColor: p4_BgColor,
            size: p4_Size,
            title: p4_Title,
            desc: p4_Desc,
            link: navMusicaLink,
            targetBlank: true,
            navText: navMusicaText,
        }, // Usa link de nav
        {
            id: "patreon",
            bgColor: p5_BgColor,
            size: p5_Size,
            title: p5_Title,
            desc: p5_Desc,
            link: navPatreonLink,
            targetBlank: true,
            navText: navPatreonText,
        }, // Usa link de nav
    ]

    // Variantes para animación de tooltip
    const tooltipVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.2, ease: "easeOut" },
        },
        exit: {
            opacity: 0,
            y: 5,
            scale: 0.98,
            transition: { duration: 0.15, ease: "easeIn" },
        },
    }

    // Variantes entrada portal
    const portalVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 1, ease: "linear" } },
    }

    // Variantes entrada planetas (stagger)
    const planetsContainerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15, // Cada planeta aparece con un pequeño retraso
            },
        },
    }
    const planetVariants = {
        hidden: { opacity: 0, scale: 0.5, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    }

    return (
        <motion.div
            style={styles.portalContainer(bgColor)}
            initial="hidden"
            animate="visible"
            variants={portalVariants}
        >
            {/* <div style={styles.starsBackground}></div> */} {/* Opcional */}
            {/* Navegación Solar */}
            <motion.nav style={styles.navigation(textColor, accentColor)}>
                {/* Generar links de navegación dinámicamente si prefieres, o mantenerlos explícitos */}
                <motion.a
                    href={navPatreonLink}
                    target="_blank"
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
                    href={p1_Link}
                    target={p1_TargetBlank ? "_blank" : "_self"}
                    rel="noopener noreferrer"
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
                    href="#"
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
                    href={p2_Link}
                    target={p2_TargetBlank ? "_blank" : "_self"}
                    rel="noopener noreferrer"
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
            {/* Sistema Solar Central */}
            <div style={styles.solarSystemContainer}>
                {/* Pulso Central / Título */}
                <motion.div
                    style={styles.centralPulse(textColor, accentColor)}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                >
                    <h1 style={styles.heroTitle(textColor, accentColor)}>
                        {heroTitleText}
                    </h1>
                    <p style={styles.heroSubtitle(textColor)}>
                        {heroSubtitleText}
                    </p>
                </motion.div>

                {/* Planetas / Nodos */}
                <motion.div
                    style={styles.planetsContainer}
                    variants={planetsContainerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {planetData.map((planet) => (
                        <motion.a
                            key={planet.id}
                            href={planet.link}
                            target={planet.targetBlank ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            style={styles.planetNode(
                                planet.size,
                                planet.bgColor,
                                accentColor
                            )}
                            onHoverStart={() => {
                                setActiveTooltip(planet.id)
                                setHoveredPlanet(planet.id)
                            }}
                            onHoverEnd={() => {
                                setActiveTooltip(null)
                                setHoveredPlanet(null)
                            }}
                            whileHover="hover"
                            variants={planetVariants} // Aplica variante de entrada a cada planeta
                            animate={
                                hoveredPlanet === planet.id
                                    ? styles.planetNodeHover(
                                          accentColor,
                                          planet.bgColor
                                      )
                                    : {}
                            }
                            transition={{ duration: 0.4, ease: "circOut" }} // Transición suave para hover
                        >
                            {/* Label debajo del planeta */}
                            <motion.span
                                style={styles.planetLabel(textColor)}
                                animate={
                                    hoveredPlanet === planet.id
                                        ? styles.planetLabelHover
                                        : {}
                                }
                                transition={{ duration: 0.3 }}
                            >
                                {planet.title}{" "}
                                {/* O usar planet.navText si prefieres */}
                            </motion.span>

                            {/* Tooltip */}
                            <AnimatePresence>
                                {activeTooltip === planet.id && (
                                    <motion.div
                                        style={styles.tooltip(
                                            accentColor,
                                            bgColor,
                                            textColor
                                        )}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={tooltipVariants}
                                    >
                                        <h3
                                            style={styles.tooltipTitle(
                                                accentColor
                                            )}
                                        >
                                            {planet.title}
                                        </h3>
                                        <p
                                            style={styles.tooltipDesc(
                                                textColor
                                            )}
                                        >
                                            {planet.desc}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.a>
                    ))}
                </motion.div>
            </div>
        </motion.div>
    )
}

// --- Propiedades Editables en Framer ---
PortalEstelarInicio.defaultProps = {
    bgColor: "#050510", // Fondo espacial muy oscuro
    textColor: "#E0E0E0", // Texto claro grisáceo
    accentColor: "#FFD700", // Dorado Solar

    // Título Central
    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText:
        "Irradiamos desde el eje. Campo de activación y resonancia para nodos solares.",

    // Planeta 1 (Libros)
    p1_BgColor: "#FFAB40", // Naranja Solar
    p1_Size: 100,
    p1_Title: "Libros",
    p1_Desc: "Geometrías vivas en forma de palabra.",
    p1_Link: "#",
    p1_TargetBlank: false,

    // Planeta 2 (Servicios)
    p2_BgColor: "#40C4FF", // Azul Cristalino
    p2_Size: 90,
    p2_Title: "Servicios",
    p2_Desc: "Acompañamiento y recalibración vibral.",
    p2_Link: "#",
    p2_TargetBlank: false,

    // Planeta 3 (Fragmentos)
    p3_BgColor: "#FF5252", // Rojo/Magenta Pulsante
    p3_Size: 80,
    p3_Title: "Fragmentos",
    p3_Desc: "Pulsos visuales y sonoros no-narrativos.",
    p3_Link: "https://www.youtube.com/tu_canal", // Usará el de Nav
    p3_TargetBlank: true,

    // Planeta 4 (Música)
    p4_BgColor: "#1DE9B6", // Verde Esmeralda/Agua
    p4_Size: 85,
    p4_Title: "Música",
    p4_Desc: "Pineal Scores. Frecuencias para el campo.",
    p4_Link: "https://open.spotify.com/artist/tu_artista", // Usará el de Nav
    p4_TargetBlank: true,

    // Planeta 5 (Patreon)
    p5_BgColor: "#FFFFFF", // Blanco/Plata Brillante
    p5_Size: 75,
    p5_Title: "Patreon",
    p5_Desc: "Campo de sostenimiento e intercambio.",
    p5_Link: "https://www.patreon.com/tu_usuario", // Usará el de Nav
    p5_TargetBlank: true,

    // Navegación (Links y Textos) - Asegúrate que coincidan con los planetas externos
    navPatreonLink: "https://www.patreon.com/tu_usuario",
    navPatreonText: "Patreon",
    navLibrosText: "Libros",
    navInicioText: "Inicio",
    navMusicaLink: "https://open.spotify.com/artist/tu_artista",
    navMusicaText: "Música",
    navServiciosText: "Servicios",
    navFragmentosLink: "https://www.youtube.com/tu_canal",
    navFragmentosText: "Fragmentos",
}

addPropertyControls(PortalEstelarInicio, {
    bgColor: { type: ControlType.Color, title: "Fondo Estelar" },
    textColor: { type: ControlType.Color, title: "Texto Estelar" },
    accentColor: { type: ControlType.Color, title: "Acento Solar" },
    heroTitleText: { type: ControlType.String, title: "Título Central" },
    heroSubtitleText: {
        type: ControlType.String,
        title: "Subtítulo Central",
        defaultValue: PortalEstelarInicio.defaultProps.heroSubtitleText,
    },
    // Planeta 1
    p1_BgColor: { type: ControlType.Color, title: "P1 Color" },
    p1_Size: {
        type: ControlType.Number,
        title: "P1 Tamaño",
        min: 30,
        max: 200,
        step: 5,
    },
    p1_Title: { type: ControlType.String, title: "P1 Título" },
    p1_Desc: { type: ControlType.String, title: "P1 Descripción" },
    p1_Link: { type: ControlType.String, title: "P1 Link (Interno/Externo)" },
    p1_TargetBlank: {
        type: ControlType.Boolean,
        title: "P1 Abrir Nuevo Tab",
        defaultValue: false,
    },
    // Planeta 2
    p2_BgColor: { type: ControlType.Color, title: "P2 Color" },
    p2_Size: {
        type: ControlType.Number,
        title: "P2 Tamaño",
        min: 30,
        max: 200,
        step: 5,
    },
    p2_Title: { type: ControlType.String, title: "P2 Título" },
    p2_Desc: { type: ControlType.String, title: "P2 Descripción" },
    p2_Link: { type: ControlType.String, title: "P2 Link (Interno/Externo)" },
    p2_TargetBlank: {
        type: ControlType.Boolean,
        title: "P2 Abrir Nuevo Tab",
        defaultValue: false,
    },
    // Planeta 3
    p3_BgColor: { type: ControlType.Color, title: "P3 Color" },
    p3_Size: {
        type: ControlType.Number,
        title: "P3 Tamaño",
        min: 30,
        max: 200,
        step: 5,
    },
    p3_Title: { type: ControlType.String, title: "P3 Título" },
    p3_Desc: { type: ControlType.String, title: "P3 Descripción" },
    // p3_Link: Se usa el de Navegación
    // Planeta 4
    p4_BgColor: { type: ControlType.Color, title: "P4 Color" },
    p4_Size: {
        type: ControlType.Number,
        title: "P4 Tamaño",
        min: 30,
        max: 200,
        step: 5,
    },
    p4_Title: { type: ControlType.String, title: "P4 Título" },
    p4_Desc: { type: ControlType.String, title: "P4 Descripción" },
    // p4_Link: Se usa el de Navegación
    // Planeta 5
    p5_BgColor: { type: ControlType.Color, title: "P5 Color" },
    p5_Size: {
        type: ControlType.Number,
        title: "P5 Tamaño",
        min: 30,
        max: 200,
        step: 5,
    },
    p5_Title: { type: ControlType.String, title: "P5 Título" },
    p5_Desc: { type: ControlType.String, title: "P5 Descripción" },
    // p5_Link: Se usa el de Navegación
    // Navegación
    navPatreonLink: { type: ControlType.String, title: "Link Patreon" },
    navPatreonText: { type: ControlType.String, title: "Texto Nav Patreon" },
    navLibrosText: { type: ControlType.String, title: "Texto Nav Libros" },
    navInicioText: { type: ControlType.String, title: "Texto Nav Inicio" },
    navMusicaLink: { type: ControlType.String, title: "Link Música" },
    navMusicaText: { type: ControlType.String, title: "Texto Nav Música" },
    navServiciosText: {
        type: ControlType.String,
        title: "Texto Nav Servicios",
    },
    navFragmentosLink: { type: ControlType.String, title: "Link Fragmentos" },
    navFragmentosText: {
        type: ControlType.String,
        title: "Texto Nav Fragmentos",
    },
})
