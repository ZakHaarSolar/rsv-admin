import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// --- THEME & ASSETS ---
// Paleta de colores "Lujo Mexicano": Arena, Terracota suave, Azul Profundo, Piedra
const theme = {
    bg: "#F9F8F6", // Crema suave (Piedra caliza)
    text: "#2D2D2D", // Carbón suave
    primary: "#0E3D4D", // Azul Océano profundo
    accent: "#C69C6D", // Dorado/Arena
    white: "#FFFFFF",
    lightGrey: "#EAEAEA",
}

// Estilos de fuentes simulados (En Framer puedes asignar fuentes reales)
const fontHeading = { fontFamily: '"Playfair Display", serif', fontWeight: 600 }
const fontBody = { fontFamily: '"Inter", sans-serif', fontWeight: 400 }

// Placeholders de imágenes (REEMPLAZAR CON TUS FOTOS REALES)
// He seleccionado imágenes de stock que dan el "vibe" que buscas para la demo
const images = {
    hero: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop",
    about: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop",
    suites: {
        studio: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
        junior: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1974&auto=format&fit=crop",
        onebed: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2525&auto=format&fit=crop",
        master: "https://images.unsplash.com/photo-1616594039964-40891a913161?q=80&w=2670&auto=format&fit=crop",
        twobed: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2532&auto=format&fit=crop",
    },
    location:
        "https://images.unsplash.com/photo-1552074291-ad4dfd8b11c0?q=80&w=2670&auto=format&fit=crop",
}

// --- DATA FROM SCREENSHOTS ---

const suitesData = [
    {
        id: 1,
        title: "Studio Suite",
        desc: "Ideal para viajeros solitarios o parejas. Acogedora y equipada.",
        details: "Street View | 1 King Bed | Max 2 guests",
        img: images.suites.studio,
    },
    {
        id: 2,
        title: "Junior Suite",
        desc: "Luminosa y tranquila, con impresionantes vistas a la laguna.",
        details: "Lagoon View | 1 King Bed | Max 2 guests",
        img: images.suites.junior,
    },
    {
        id: 3,
        title: "One-Bedroom Suite",
        desc: "Espaciosa, perfecta para pequeñas familias o amigos.",
        details: "Street View | 2 Double Beds | Max 3 guests",
        img: images.suites.onebed,
    },
    {
        id: 4,
        title: "Master Suite",
        desc: "Elegancia pura. Elige entre vistas de ensueño y máximo confort.",
        details: "Lagoon View | 1 King or 2 Doubles | Max 3 guests",
        img: images.suites.master,
    },
    {
        id: 5,
        title: "Two-Bedroom Suite",
        desc: "El hogar lejos del hogar para familias grandes.",
        details: "Lagoon View | 1 King + 2 Doubles | Max 4 guests",
        img: images.suites.twobed,
    },
]

const amenitiesList = [
    "High speed Wi-Fi",
    "Cocina Equipada",
    "Aire Acondicionado",
    "Smart TV con Netflix",
    "Alberca frente a la laguna",
    "Estacionamiento (Limitado)",
    "Caja de seguridad",
    "Limpieza (cada 4 días)",
]

const nearbyPoints = [
    { name: "Playa Tortugas", distance: "Cruzando la calle", icon: "🏖️" },
    { name: "Ferry Isla Mujeres", distance: "3 min caminando", icon: "⛴️" },
    { name: "Restaurantes & OXXO", distance: "5 min caminando", icon: "🌮" },
    {
        name: "Parada de Autobús",
        distance: "2 min caminando (24/7)",
        icon: "🚌",
    },
]

const faqs = [
    {
        q: "¿Podemos hacer Check-in Online?",
        a: "Sí, recomendamos hacerlo antes de su llegada para agilizar su entrada.",
    },
    {
        q: "¿Tienen Late Check-out?",
        a: "Sujeto a disponibilidad. El check-out estándar es a las 11:00 AM.",
    },
    {
        q: "¿Aceptan visitas?",
        a: "Por seguridad y privacidad de nuestros huéspedes, NO se permiten visitas externas en la propiedad.",
    },
    {
        q: "¿Hay estacionamiento?",
        a: "Sí, contamos con estacionamiento limitado en el sitio. También hay opciones públicas cruzando la calle.",
    },
]

// --- COMPONENTS ---

const Section = ({ id, children, className = "" }) => (
    <section
        id={id}
        style={{ padding: "80px 20px", position: "relative", ...fontBody }}
        className={className}
    >
        {children}
    </section>
)

const Button = ({ children, onClick, primary = true }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            padding: "14px 28px",
            backgroundColor: primary ? theme.primary : "transparent",
            color: primary ? theme.white : theme.primary,
            border: primary ? "none" : `1px solid ${theme.primary}`,
            borderRadius: "4px", // Bordes más suaves pero elegantes
            cursor: "pointer",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 600,
            ...fontBody,
        }}
    >
        {children}
    </motion.button>
)

const Heading = ({ children, subtitle, center = false, light = false }) => (
    <div
        style={{
            marginBottom: "40px",
            textAlign: center ? "center" : "left",
            color: light ? theme.white : theme.primary,
        }}
    >
        {subtitle && (
            <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    display: "block",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    marginBottom: "10px",
                    color: theme.accent,
                }}
            >
                {subtitle}
            </motion.span>
        )}
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
                fontSize: "42px",
                margin: 0,
                ...fontHeading,
                lineHeight: 1.2,
            }}
        >
            {children}
        </motion.h2>
        <div
            style={{
                width: "60px",
                height: "3px",
                backgroundColor: theme.accent,
                margin: center ? "20px auto 0" : "20px 0 0",
            }}
        />
    </div>
)

// --- MAIN COMPONENT ---

export default function CasaTortugasReinvented() {
    const [scrolled, setScrolled] = useState(false)
    const [activeTab, setActiveTab] = useState(0) // For policies

    // Handle Scroll for Navbar styling
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollTo = (id) => {
        const element = document.getElementById(id)
        if (element) element.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <div
            style={{
                backgroundColor: theme.bg,
                color: theme.text,
                minHeight: "100vh",
                width: "100%",
                overflowX: "hidden",
            }}
        >
            {/* --- NAVBAR --- */}
            <motion.nav
                animate={{
                    backgroundColor: scrolled
                        ? "rgba(255, 255, 255, 0.95)"
                        : "transparent",
                    boxShadow: scrolled
                        ? "0 4px 20px rgba(0,0,0,0.05)"
                        : "none",
                    padding: scrolled ? "15px 40px" : "30px 40px",
                }}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backdropFilter: scrolled ? "blur(10px)" : "none",
                }}
            >
                <div
                    style={{
                        ...fontHeading,
                        fontSize: "24px",
                        fontWeight: 700,
                        color: scrolled ? theme.primary : theme.white,
                        cursor: "pointer",
                    }}
                    onClick={() => window.scrollTo(0, 0)}
                >
                    CASA TORTUGAS
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "30px",
                        alignItems: "center",
                    }}
                >
                    {["Suites", "Amenities", "Ubicación", "Reglas"].map(
                        (item) => (
                            <span
                                key={item}
                                onClick={() => scrollTo(item.toLowerCase())}
                                style={{
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: scrolled ? theme.text : theme.white,
                                    ...fontBody,
                                }}
                            >
                                {item}
                            </span>
                        )
                    )}
                    <Button
                        onClick={() =>
                            window.open("https://casatortugas.com", "_blank")
                        }
                    >
                        Reservar
                    </Button>
                </div>
            </motion.nav>

            {/* --- HERO SECTION --- */}
            <div
                style={{
                    position: "relative",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${images.hero})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        zIndex: 0,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(14, 61, 77, 0.4))",
                        zIndex: 1,
                    }}
                />

                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        textAlign: "center",
                        color: theme.white,
                        maxWidth: "800px",
                        padding: "0 20px",
                    }}
                >
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            ...fontBody,
                            fontSize: "14px",
                            letterSpacing: "4px",
                            textTransform: "uppercase",
                            marginBottom: "20px",
                        }}
                    >
                        Hidden Gem • Family Operated • Boutique Suites
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        style={{
                            ...fontHeading,
                            fontSize: "68px",
                            margin: "0 0 30px 0",
                            lineHeight: 1.1,
                        }}
                    >
                        Bienvenido a casa.
                        <br />
                        <span
                            style={{
                                fontSize: "40px",
                                fontStyle: "italic",
                                fontFamily: '"Playfair Display", serif',
                            }}
                        >
                            Lujo frente a la laguna.
                        </span>
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <Button onClick={() => scrollTo("suites")}>
                            Ver Habitaciones
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* --- ABOUT SECTION --- */}
            <Section id="about">
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center",
                        maxWidth: "1200px",
                        margin: "0 auto",
                        gap: "60px",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ flex: "1 1 400px" }}
                    >
                        <Heading subtitle="Nuestra Historia">
                            Más que un hotel, una familia.
                        </Heading>
                        <p
                            style={{
                                fontSize: "18px",
                                lineHeight: "1.8",
                                color: "#555",
                                marginBottom: "20px",
                            }}
                        >
                            Casa Tortugas es una joya escondida en la Zona
                            Hotelera de Cancún. Operado por nuestra familia,
                            ofrecemos un refugio de tranquilidad justo enfrente
                            del ferry a Isla Mujeres.
                        </p>
                        <p
                            style={{
                                fontSize: "16px",
                                lineHeight: "1.8",
                                color: "#555",
                            }}
                        >
                            Aquí no eres el huésped de una habitación, eres el
                            invitado de nuestra casa. Disfruta de atardeceres
                            espectaculares, suites espaciosas con cocina y esa
                            mezcla perfecta entre la exclusividad de un hotel
                            boutique y el calor de un hogar mexicano.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            flex: "1 1 400px",
                            height: "500px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        }}
                    >
                        <img
                            src={images.about}
                            alt="About"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </motion.div>
                </div>
            </Section>

            {/* --- SUITES SECTION --- */}
            <Section id="suites">
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <Heading center subtitle="Descanso Absoluto">
                        Nuestras Suites
                    </Heading>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(350px, 1fr))",
                            gap: "30px",
                            marginTop: "60px",
                        }}
                    >
                        {suitesData.map((suite, i) => (
                            <motion.div
                                key={suite.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                whileHover={{ y: -10 }}
                                style={{
                                    backgroundColor: theme.white,
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        height: "250px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        src={suite.img}
                                        alt={suite.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transition: "transform 0.5s",
                                        }}
                                    />
                                </div>
                                <div style={{ padding: "30px" }}>
                                    <h3
                                        style={{
                                            ...fontHeading,
                                            fontSize: "24px",
                                            color: theme.primary,
                                            marginTop: 0,
                                        }}
                                    >
                                        {suite.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: theme.accent,
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {suite.details}
                                    </p>
                                    <p
                                        style={{
                                            color: "#666",
                                            lineHeight: "1.6",
                                        }}
                                    >
                                        {suite.desc}
                                    </p>
                                    <div style={{ marginTop: "20px" }}>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: theme.primary,
                                                borderBottom: `1px solid ${theme.primary}`,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Ver Detalles
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* --- AMENITIES & LOCATION SPLIT --- */}
            <div
                id="amenities"
                style={{
                    backgroundColor: theme.primary,
                    color: theme.white,
                    padding: "80px 20px",
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "60px",
                    }}
                >
                    {/* Amenities Column */}
                    <div style={{ flex: "1 1 400px" }}>
                        <Heading light subtitle="Confort">
                            Amenidades
                        </Heading>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                            }}
                        >
                            {amenitiesList.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <span style={{ color: theme.accent }}>
                                        ✦
                                    </span>
                                    <span>{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Location Column */}
                    <div id="ubicación" style={{ flex: "1 1 400px" }}>
                        <Heading light subtitle="Explora Cancún">
                            Ubicación Privilegiada
                        </Heading>
                        <p style={{ opacity: 0.9, marginBottom: "30px" }}>
                            Estamos estratégicamente ubicados lejos del ruido de
                            las discotecas pero cerca de todo lo que necesitas.
                        </p>

                        <div
                            style={{
                                backgroundColor: "rgba(255,255,255,0.1)",
                                padding: "30px",
                                borderRadius: "8px",
                                backdropFilter: "blur(5px)",
                            }}
                        >
                            {nearbyPoints.map((point, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "15px",
                                        borderBottom:
                                            i !== nearbyPoints.length - 1
                                                ? "1px solid rgba(255,255,255,0.1)"
                                                : "none",
                                        paddingBottom: "10px",
                                    }}
                                >
                                    <div
                                        style={{ display: "flex", gap: "10px" }}
                                    >
                                        <span>{point.icon}</span>
                                        <strong>{point.name}</strong>
                                    </div>
                                    <span
                                        style={{
                                            opacity: 0.7,
                                            fontSize: "14px",
                                        }}
                                    >
                                        {point.distance}
                                    </span>
                                </div>
                            ))}
                            <div
                                style={{
                                    marginTop: "20px",
                                    textAlign: "right",
                                }}
                            >
                                <a
                                    href="https://maps.google.com"
                                    target="_blank"
                                    style={{
                                        color: theme.accent,
                                        textDecoration: "none",
                                        fontSize: "14px",
                                    }}
                                >
                                    Ver en Google Maps →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- POLICIES & FAQ (Clean Accordion Style) --- */}
            <Section id="reglas">
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <Heading center subtitle="Información Importante">
                        Guía del Huésped
                    </Heading>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "20px",
                            marginBottom: "40px",
                        }}
                    >
                        <Button
                            primary={activeTab === 0}
                            onClick={() => setActiveTab(0)}
                        >
                            Reglas de Casa
                        </Button>
                        <Button
                            primary={activeTab === 1}
                            onClick={() => setActiveTab(1)}
                        >
                            FAQs
                        </Button>
                    </div>

                    <div
                        style={{
                            minHeight: "300px",
                            backgroundColor: theme.white,
                            padding: "40px",
                            borderRadius: "8px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {activeTab === 0 ? (
                                <motion.div
                                    key="rules"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <h3
                                        style={{ ...fontHeading, marginTop: 0 }}
                                    >
                                        Para una estancia placentera
                                    </h3>
                                    <ul
                                        style={{
                                            paddingLeft: "20px",
                                            lineHeight: "2",
                                            color: "#555",
                                        }}
                                    >
                                        <li>
                                            <strong>Check-in:</strong> 3:00 PM |{" "}
                                            <strong>Check-out:</strong> 11:00 AM
                                        </li>
                                        <li>
                                            <strong>
                                                Horario de Silencio:
                                            </strong>{" "}
                                            A partir de las 10:00 PM.
                                        </li>
                                        <li>
                                            <strong>Seguridad:</strong> No se
                                            permiten visitas externas ni vidrio
                                            en el área de la alberca.
                                        </li>
                                        <li>
                                            <strong>Ambiente Familiar:</strong>{" "}
                                            No Spring Breakers, fiestas, ni
                                            drogas.
                                        </li>
                                        <li>
                                            <strong>Laguna:</strong> Prohibido
                                            nadar en la laguna (presencia de
                                            cocodrilos en el ecosistema
                                            natural).
                                        </li>
                                    </ul>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="faqs"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {faqs.map((faq, i) => (
                                        <div
                                            key={i}
                                            style={{ marginBottom: "20px" }}
                                        >
                                            <h4
                                                style={{
                                                    margin: "0 0 5px 0",
                                                    color: theme.primary,
                                                }}
                                            >
                                                {faq.q}
                                            </h4>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: "#666",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {faq.a}
                                            </p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Section>

            {/* --- CONTACT & FOOTER --- */}
            <div
                style={{
                    backgroundColor: theme.text,
                    color: theme.white,
                    padding: "80px 20px 40px",
                }}
            >
                <div
                    style={{
                        maxWidth: "600px",
                        margin: "0 auto",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            ...fontHeading,
                            fontSize: "36px",
                            color: theme.white,
                        }}
                    >
                        ¿Listo para relajarte?
                    </h2>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.6)",
                            marginBottom: "40px",
                        }}
                    >
                        Escríbenos o reserva directamente tu santuario.
                    </p>

                    <form
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "15px",
                            textAlign: "left",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Tu Nombre"
                            style={{
                                padding: "15px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "white",
                                ...fontBody,
                            }}
                        />
                        <input
                            type="email"
                            placeholder="Tu Email"
                            style={{
                                padding: "15px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "white",
                                ...fontBody,
                            }}
                        />
                        <textarea
                            rows={4}
                            placeholder="Mensaje"
                            style={{
                                padding: "15px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "white",
                                ...fontBody,
                            }}
                        />
                        <Button onClick={(e) => e.preventDefault()}>
                            Enviar Mensaje
                        </Button>
                    </form>

                    <div
                        style={{
                            marginTop: "80px",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            paddingTop: "20px",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        <p>
                            © 2025-2026 Casa Tortugas Boutique Suites. Operated
                            by CancunProperties.com
                        </p>
                        <p>
                            Cenzontle 4, Hotel Zone km 6.5, Cancun, Q. Roo,
                            México
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
