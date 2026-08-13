import * as React from "react"
import { useState, useEffect, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// --- Estilos Solares (Reutilizados y Nuevos) ---
const styles = {
    // Contenedor Principal (de V4.11)
    portalContainer: (bgColor) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "100%",
        width: "100%",
        background: bgColor,
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        color: "#E0E0E0",
    }),
    // Estilos de Estrellas (de V4.11)
    starsContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
    },
    star: (size, top, left, delay) => ({
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        background: "white",
        borderRadius: "50%",
        opacity: 0,
        animation: `twinkle ${
            2 + Math.random() * 3
        }s infinite ${delay}s alternate ease-in-out`,
        top: `${top}%`,
        left: `${left}%`,
        boxShadow: `0 0 ${size * 2}px ${size * 0.5}px rgba(255, 255, 255, 0.4)`,
    }),
    keyframesTwinkle: `@keyframes twinkle { 0% { opacity: 0.1; } 50% { opacity: 0.8; } 100% { opacity: 0.1; } }`,

    // Estilos de Navegación (de V4.11)
    navigation: (textColor, accentColor) => ({
        width: "100%",
        padding: "10px 5%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px 25px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 10, 30, 0.6)",
        backdropFilter: "blur(15px)",
        borderBottom: `1px solid ${accentColor}44`,
    }),
    navLink: (textColor) => ({
        color: textColor,
        textDecoration: "none",
        fontSize: "15px",
        padding: "6px 10px",
        borderRadius: "4px",
        transition: "color 0.3s ease, text-shadow 0.3s ease",
        opacity: 0.85,
    }),
    navLinkHover: (accentColor) => ({
        color: accentColor,
        opacity: 1,
        textShadow: `0 0 8px ${accentColor}99, 0 0 15px ${accentColor}55`,
    }),

    // --- Nuevos Estilos para Archivo de Libros ---

    // Contenedor principal de esta página
    contentContainer: {
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center", // Centra verticalmente la consola y el carrusel
        width: "100%",
        padding: "2vh 20px 5vh 20px",
        position: "relative",
        zIndex: 1,
        gap: "4vh", // Espacio entre la consola y el carrusel
    },

    // 1. Consola Central (Panel principal)
    holographicConsole: (accentColor) => ({
        width: "clamp(350px, 65vw, 700px)", // Ancho adaptable
        minHeight: "400px", // Altura mínima
        background: "rgba(5, 10, 20, 0.9)",
        border: `1px solid ${accentColor}88`,
        borderRadius: "24px",
        backdropFilter: "blur(10px)",
        boxShadow: `
            0 0 6px ${accentColor}AA, 0 0 18px ${accentColor}77,
            0 0 40px ${accentColor}44, 0 5px 15px rgba(0,0,0,0.3)
        `,
        padding: "18px",
        zIndex: 2,
        color: "#E8E8E8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        overflow: "hidden",
        position: "relative", // Para decoraciones
    }),
    // Decoraciones del panel (reutilizadas de V4.11)
    panelDecorationLineVertical: (accentColor, leftOrRight) => ({
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [leftOrRight]: "15px",
        width: "2px",
        height: "40px",
        background: accentColor,
        borderRadius: "1px",
        boxShadow: `0 0 5px ${accentColor}AA`,
        opacity: 0.7,
    }),
    // Contenedor interno del panel (reutilizado)
    panelContentWrapper: (accentColor) => ({
        width: "100%",
        height: "100%",
        background: "rgba(10, 25, 45, 0.85)",
        borderRadius: "16px",
        padding: "60px 30px 30px 30px",
        marginTop: "-40px",
        position: "relative",
        zIndex: 1,
        border: `1px solid ${accentColor}33`,
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.6)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexGrow: 1, // Para que ocupe el espacio
    }),
    // Standby Text
    consoleStandbyText: (accentColor) => ({
        fontSize: "1.2rem",
        fontWeight: 300,
        color: `${accentColor}99`,
        margin: "auto", // Centra verticalmente
        fontFamily: "'Arizonia', cursive",
        letterSpacing: "1px",
    }),
    // Icono del libro (en consola)
    consoleBookIcon: (size, bgColor, shadowColor) => ({
        width: `${size * 1.2}px`, // Un poco más grande
        height: `${size * 1.2}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, #FFFFFF77, ${bgColor} 80%)`,
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.6), 0 0 25px ${shadowColor}BB`,
        position: "relative",
        zIndex: 5,
        marginTop: "-12px",
        marginBottom: "0px",
        border: `1.5px solid ${shadowColor}77`,
    }),
    // Título del libro (en consola)
    consoleBookTitle: (accentColor) => ({
        fontSize: "1.8rem",
        fontWeight: 600,
        color: accentColor,
        marginBottom: "12px",
        lineHeight: 1.25,
        textShadow: `0 0 12px ${accentColor}99`,
    }),
    // Descripción del libro (en consola)
    consoleBookDesc: (textColor) => ({
        fontSize: "1rem",
        fontWeight: 300,
        color: textColor,
        lineHeight: 1.6,
        opacity: 0.9,
        marginBottom: "30px",
        flexGrow: 1,
        maxWidth: "90%", // Para que no se pegue a los bordes
    }),
    // Contenedor de botones
    consoleButtonContainer: {
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    // Botón (reutilizado de V4.11)
    panelButton: (accentColor) => ({
        display: "inline-block",
        padding: "9px 20px",
        background: "transparent",
        color: accentColor,
        border: `1px solid ${accentColor}CC`,
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: 500,
        transition:
            "background-color 0.25s ease-out, color 0.25s ease-out, transform 0.2s ease-out, box-shadow 0.25s ease-out",
        cursor: "pointer",
        fontSize: "0.9rem",
        zIndex: 1,
        boxShadow: `0 0 6px ${accentColor}44`,
        transform: "scale(1)",
    }),
    panelButtonHoverStable: (accentColor) => ({
        backgroundColor: `${accentColor}28`,
        color: "#FFFFFF",
        scale: 1.05,
        boxShadow: `0 0 12px ${accentColor}88, 0 0 25px ${accentColor}55`,
    }),

    // 2. Carrusel de Nodos (Libros)
    carouselContainer: {
        width: "80vw", // Ancho de la "ventana" del carrusel
        overflow: "hidden", // Oculta los orbes que se salen
        position: "relative",
    },
    carouselDraggable: {
        display: "flex",
        gap: "30px", // Espacio entre orbes
        padding: "20px 10px", // Espacio para el glow
        width: "max-content", // Permite que el contenido se expanda
        cursor: "grab",
    },
    carouselOrb: (size, bgColor, shadowColor, isActive) => ({
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, #FFFFFF55, ${bgColor} 80%)`,
        boxShadow: isActive
            ? `0 0 15px ${shadowColor}CC, 0 0 30px ${shadowColor}88, inset 0 0 8px rgba(255,255,255,0.3)` // Glow activo
            : `0 0 8px ${shadowColor}55, inset 0 0 5px rgba(0,0,0,0.4)`, // Glow inactivo
        border: `1px solid ${bgColor}99`,
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        transform: isActive ? "scale(1.1)" : "scale(1)",
        flexShrink: 0, // Evita que los orbes se encojan
        cursor: "pointer",
    }),
}

// --- Componente Estrellas (Sin Cambios) ---
const StarsBackground = memo(({ numStars }) => {
    const [stars, setStars] = useState([])
    useEffect(() => {
        setStars(generateStars(numStars))
    }, [numStars])
    return (
        <div style={styles.starsContainer}>
            <style>{styles.keyframesTwinkle}</style>
            {stars.map((star) => (
                <div
                    key={star.id}
                    style={styles.star(
                        star.size,
                        star.top,
                        star.left,
                        star.delay
                    )}
                />
            ))}
        </div>
    )
})

// --- Funciones Auxiliares (Sin Cambios) ---
const generateStars = (numStars) => {
    const starsArray = []
    for (let i = 0; i < numStars; i++) {
        starsArray.push({
            id: i,
            size: Math.random() * 1.5 + 0.5,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 5,
        })
    }
    return starsArray
}

// --- Componente React Principal ---
export function ArchivoHolograficoLibros(props) {
    const {
        bgColor,
        textColor,
        accentColor,
        bookDataJSON, // Prop JSON
        // Props de Navegación
        navPatreonLink,
        navLibrosText,
        navInicioText,
        navMusicaLink,
        navServiciosText,
        navFragmentosLink,
        navPatreonText,
        navMusicaText,
        navFragmentosText,
        // Links internos (si son necesarios)
        librosLink,
        serviciosLink,
    } = props

    const [selectedBookId, setSelectedBookId] = useState(null)
    const [hoveredLink, setHoveredLink] = useState(null)

    // Parsear el JSON de los libros de forma segura
    const bookData = useMemo(() => {
        try {
            return JSON.parse(bookDataJSON)
        } catch (e) {
            console.error("Error parsing Book Data JSON:", e)
            return [] // Devuelve array vacío en caso de error
        }
    }, [bookDataJSON])

    const activeBook = useMemo(() => {
        return bookData.find((b) => b.id === selectedBookId) || null
    }, [selectedBookId, bookData])

    // Variantes para el contenido del panel
    const consoleContentVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" },
        },
        exit: {
            opacity: 0,
            y: -10,
            scale: 0.98,
            transition: { duration: 0.2, ease: "easeIn" },
        },
    }

    return (
        <motion.div
            style={styles.portalContainer(bgColor)}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
        >
            {/* Componente Estrellas */}
            <StarsBackground numStars={150} />{" "}
            {/* Asumimos numStars o lo hardcodeamos */}
            {/* Navegación */}
            <motion.nav
                style={styles.navigation(textColor, accentColor)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <motion.a
                    href={navPatreonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.navLink(textColor)}
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
                    href={librosLink}
                    style={styles.navLink(textColor)}
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
                    style={styles.navLink(textColor)}
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
                    style={styles.navLink(textColor)}
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
                    href={serviciosLink}
                    style={styles.navLink(textColor)}
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
                    style={styles.navLink(textColor)}
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
            {/* Contenedor del Archivo (Consola + Carrusel) */}
            <div style={styles.contentContainer}>
                {/* 1. Consola Holográfica Central */}
                <motion.div
                    style={{ ...styles.holographicConsole(accentColor) }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    <div
                        style={styles.panelDecorationLineVertical(
                            accentColor,
                            "left"
                        )}
                    />
                    <div
                        style={styles.panelDecorationLineVertical(
                            accentColor,
                            "right"
                        )}
                    />

                    <AnimatePresence mode="wait">
                        {!activeBook ? (
                            // --- Estado Standby ---
                            <motion.div
                                key="standby"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexGrow: 1,
                                    width: "100%",
                                    height: "100%",
                                }}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={consoleContentVariants}
                            >
                                <h2
                                    style={styles.consoleStandbyText(
                                        accentColor
                                    )}
                                >
                                    Selecciona un pulso
                                </h2>
                            </motion.div>
                        ) : (
                            // --- Estado Libro Seleccionado ---
                            <motion.div
                                key={activeBook.id}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={consoleContentVariants}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={styles.consoleBookIcon(
                                        activeBook.size || 70,
                                        activeBook.color,
                                        accentColor
                                    )}
                                />
                                <div
                                    style={styles.panelContentWrapper(
                                        accentColor
                                    )}
                                >
                                    <h3
                                        style={styles.consoleBookTitle(
                                            accentColor
                                        )}
                                    >
                                        {activeBook.title}
                                    </h3>
                                    <p
                                        style={styles.consoleBookDesc(
                                            textColor
                                        )}
                                    >
                                        {activeBook.desc}
                                    </p>
                                    <div style={styles.consoleButtonContainer}>
                                        <motion.a
                                            href={activeBook.amazonLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={styles.panelButton(
                                                accentColor
                                            )}
                                            whileHover={styles.panelButtonHoverStable(
                                                accentColor
                                            )}
                                        >
                                            Nodo Físico →
                                        </motion.a>
                                        <motion.a
                                            href={activeBook.digitalLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={styles.panelButton(
                                                accentColor
                                            )}
                                            whileHover={styles.panelButtonHoverStable(
                                                accentColor
                                            )}
                                        >
                                            Nodo Digital →
                                        </motion.a>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 2. Carrusel de Nodos (Libros) */}
                <motion.div
                    style={styles.carouselContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <motion.div
                        style={styles.carouselDraggable}
                        drag="x"
                        dragConstraints={{
                            right: 0,
                            // Calcular el límite izquierdo dinámicamente si es posible,
                            // o poner un valor negativo grande.
                            // Para Framer, es mejor usar referencias si es posible.
                            // Por ahora, un límite manual:
                            left:
                                -(bookData.length * 110) +
                                window.innerWidth * 0.8, // 110 = 80 orb + 30 gap
                        }}
                        whileTap={{ cursor: "grabbing" }}
                    >
                        {bookData.map((book) => (
                            <motion.div
                                key={book.id}
                                style={styles.carouselOrb(
                                    book.size || 70, // Tamaño default del orbe
                                    book.color,
                                    accentColor,
                                    book.id === selectedBookId
                                )}
                                onClick={() => setSelectedBookId(book.id)}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    )
}

// --- Datos por Defecto para los Libros (en formato JSON string) ---
const defaultBookData = JSON.stringify(
    [
        {
            id: "nucleo_gestacion",
            title: "Núcleo de Gestación",
            desc: "Este espacio se abre para la gestación cristalina de nuevas geometrías solares.",
            color: "#FFAB40", // Naranja
            size: 70,
            amazonLink: "https://www.amazon.com/dp/B0D1QJ3333",
            digitalLink: "https://buy.stripe.com/14k16JcQA4s47wQ6ov",
        },
        {
            id: "libro_aquariia",
            title: "Libro Aqua'Riia", // Placeholder
            desc: "Pulsos y geometrías desde el eje de Aqua'Riia.", // Placeholder
            color: "#40C4FF", // Azul
            size: 70,
            amazonLink: "https://www.amazon.com", // Placeholder
            digitalLink: "https://buy.stripe.com", // Placeholder
        },
        {
            id: "libro_dos",
            title: "Título Libro 2", // Placeholder
            desc: "Geometrías vivas en forma de palabra. Pulsos de la conciencia encarnados.", // Placeholder
            color: "#FF5252", // Rojo
            size: 70,
            amazonLink: "https://www.amazon.com", // Placeholder
            digitalLink: "https://buy.stripe.com", // Placeholder
        },
        {
            id: "libro_tres",
            title: "Título Libro 3", // Placeholder
            desc: "Geometrías vivas en forma de palabra. Pulsos de la conciencia encarnados.", // Placeholder
            color: "#1DE9B6", // Verde/Agua
            size: 70,
            amazonLink: "https://www.amazon.com", // Placeholder
            digitalLink: "https://buy.stripe.com", // Placeholder
        },
        // Puedes añadir más libros aquí:
        // {
        //     "id": "libro_cuatro",
        //     "title": "Título Libro 4",
        //     "desc": "Descripción...",
        //     "color": "#E0E0E0", // Blanco
        //     "size": 70,
        //     "amazonLink": "https_link",
        //     "digitalLink": "https_link"
        // },
    ],
    null,
    2
) // El '2' formatea el JSON para que sea legible en el panel de props

// --- Props (DefaultProps y addPropertyControls) ---
ArchivoHolograficoLibros.defaultProps = {
    bgColor: "#01010A",
    textColor: "#F0F0F0",
    accentColor: "#00BFFF", // Azul Neón
    bookDataJSON: defaultBookData,
    // Props de Navegación (copiadas de Home)
    navPatreonLink: "https://www.patreon.com/tu_usuario",
    navLibrosText: "Libros",
    navInicioText: "Inicio",
    navMusicaLink: "https://open.spotify.com/artist/tu_artista",
    navServiciosText: "Servicios",
    navFragmentosLink: "https://www.youtube.com/tu_canal",
    navPatreonText: "Patreon",
    navMusicaText: "Música",
    navFragmentosText: "Fragmentos",
    librosLink: "#", // Link a esta misma página
    serviciosLink: "#", // Link a página de servicios
}

addPropertyControls(ArchivoHolograficoLibros, {
    bgColor: { type: ControlType.Color, title: "Fondo Estelar" },
    textColor: { type: ControlType.Color, title: "Texto General" },
    accentColor: { type: ControlType.Color, title: "Acento Neón" },

    bookDataJSON: {
        type: ControlType.String,
        title: "Book Data (JSON)",
        defaultValue: defaultBookData,
        control: "textarea", // Permite un campo de texto más grande
        rows: 10,
    },

    // Props de Navegación
    navPatreonLink: { type: ControlType.String, title: "Nav: Link Patreon" },
    navPatreonText: { type: ControlType.String, title: "Nav: Texto Patreon" },
    navLibrosText: { type: ControlType.String, title: "Nav: Texto Libros" },
    librosLink: { type: ControlType.String, title: "Nav: Link Libros" },
    navInicioText: { type: ControlType.String, title: "Nav: Texto Inicio" },
    navMusicaLink: { type: ControlType.String, title: "Nav: Link Música" },
    navMusicaText: { type: ControlType.String, title: "Nav: Texto Música" },
    navServiciosText: {
        type: ControlType.String,
        title: "Nav: Texto Servicios",
    },
    serviciosLink: { type: ControlType.String, title: "Nav: Link Servicios" },
    navFragmentosLink: {
        type: ControlType.String,
        title: "Nav: Link Fragmentos",
    },
    navFragmentosText: {
        type: ControlType.String,
        title: "Nav: Texto Fragmentos",
    },
})
