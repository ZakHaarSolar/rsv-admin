import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

/**
 * MEMBRANA - Ingeniería de Campo Corporal
 * Componente High-Fidelity para Framer
 * Autor: Gemini (Architect Role)
 */

export default function MembranaHero(props) {
    const { splineUrl, title, subtitle, tintColor } = props
    const [isLoaded, setIsLoaded] = React.useState(false)

    // 1. Inyección Dinámica del Script de Spline (Web Component Method)
    React.useEffect(() => {
        const existingScript = document.querySelector(
            'script[src="https://unpkg.com/@splinetool/viewer@1.9.75/build/spline-viewer.js"]'
        )

        if (!existingScript) {
            const script = document.createElement("script")
            script.type = "module"
            script.src =
                "https://unpkg.com/@splinetool/viewer@1.9.75/build/spline-viewer.js"
            script.onload = () => setIsLoaded(true)
            document.head.appendChild(script)
        } else {
            setIsLoaded(true)
        }
    }, [])

    // Variantes de Animación
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 1.5, ease: "easeOut" },
        },
    }

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { delay: 0.5, duration: 0.8, ease: "easeOut" },
        },
    }

    const floatAnimation = {
        y: [0, -10, 0],
        transition: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
        },
    }

    return (
        <motion.div
            style={containerStyle}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* --- CAPA 1: FONDO LUZ LÍQUIDA --- */}
            <div style={liquidBackgroundWrapper}>
                <motion.div
                    style={{
                        ...liquidGradient,
                        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, ${tintColor} 40%, #E8E9EB 100%)`,
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {/* Capa de ruido sutil para textura */}
                <div style={noiseOverlay} />
                {/* Efecto de refracción simulada */}
                <div style={refractionOverlay} />
            </div>

            {/* --- CAPA 2: CONTENIDO CENTRAL (3D) --- */}
            <div style={contentContainer}>
                {/* Títulos */}
                <motion.div style={headerStyle} variants={textVariants}>
                    <motion.h1 style={titleStyle} animate={floatAnimation}>
                        {title}
                    </motion.h1>
                    <p style={subtitleStyle}>{subtitle}</p>
                </motion.div>

                {/* Visor 3D Spline */}
                <div style={modelWrapper}>
                    {/* @ts-ignore */}
                    <spline-viewer
                        url={splineUrl}
                        loading-anim-type="spinner-small-light"
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </div>

            {/* --- CAPA 3: UI DOCK INFERIOR --- */}
            <motion.div
                style={dockContainer}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            >
                <DockCard label="Protección" sub="Escudo Táctico" icon="🛡️" />
                <DockCard label="Silueta" sub="Ajuste Fluido" icon="💧" />
                <DockCard label="Estructura" sub="Conexión Hídrica" icon="🧬" />
                <DockCard label="Visibilidad" sub="Reflejo Activo" icon="👁️" />
            </motion.div>

            {/* Overlay de UI (Bordes decorativos, esquinas, etc) */}
            <div style={uiOverlay} />
        </motion.div>
    )
}

/* --- COMPONENTE TARJETA DOCK (INTERNO) --- */
function DockCard({ label, sub, icon }) {
    return (
        <motion.div
            style={cardStyle}
            whileHover={{
                y: -10,
                backgroundColor: "rgba(255, 255, 255, 0.45)",
                boxShadow: "0 15px 30px rgba(0, 255, 255, 0.15)",
                backdropFilter: "blur(16px)",
            }}
            whileTap={{ scale: 0.98 }}
        >
            <div style={iconContainer}>{icon}</div>
            <div style={textContainer}>
                <span style={cardTitle}>{label}</span>
                <span style={cardSub}>{sub}</span>
            </div>
        </motion.div>
    )
}

/* --- ESTILOS CSS-IN-JS --- */

const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#E8E9EB", // Base Plata
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
}

const liquidBackgroundWrapper: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
}

const liquidGradient: React.CSSProperties = {
    width: "140%",
    height: "140%",
    position: "absolute",
    top: "-20%",
    left: "-20%",
    filter: "blur(60px)",
}

const noiseOverlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
}

const refractionOverlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,255,255,0.05) 100%)",
    pointerEvents: "none",
    mixBlendMode: "overlay",
}

const contentContainer: React.CSSProperties = {
    zIndex: 1,
    position: "relative",
    width: "100%",
    height: "80%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "60px",
}

const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "20px",
    zIndex: 2,
    pointerEvents: "none", // Deja pasar click al modelo 3D
}

const titleStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: 100,
    letterSpacing: "0.4em",
    color: "#333",
    margin: 0,
    textTransform: "uppercase",
    background: "linear-gradient(180deg, #333 0%, #666 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
}

const subtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 300,
    letterSpacing: "0.15em",
    color: "#666",
    marginTop: "10px",
    textTransform: "uppercase",
}

const modelWrapper: React.CSSProperties = {
    width: "100%",
    flex: 1,
    minHeight: "400px",
    position: "relative",
    // Ajuste negativo para solapar ligeramente y que la chaqueta "flote" en medio
    marginTop: "-40px",
}

/* --- DOCK UI STYLES --- */

const dockContainer: React.CSSProperties = {
    zIndex: 10,
    position: "absolute",
    bottom: "40px",
    display: "flex",
    gap: "16px",
    padding: "0 20px",
    maxWidth: "1000px",
    width: "100%",
    justifyContent: "center",
    flexWrap: "wrap",
}

const cardStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "180px",
    maxWidth: "240px",
    height: "100px",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)", // Soporte Safari
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
    transition: "border 0.3s ease",
}

const iconContainer: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    marginRight: "15px",
    boxShadow: "inset 0 0 10px rgba(255,255,255,0.8)",
}

const textContainer: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
}

const cardTitle: React.CSSProperties = {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888",
    fontWeight: 600,
    marginBottom: "4px",
}

const cardSub: React.CSSProperties = {
    fontSize: "13px",
    color: "#333",
    fontWeight: 400,
    letterSpacing: "0.02em",
}

const uiOverlay: React.CSSProperties = {
    position: "absolute",
    bottom: "0",
    width: "100%",
    height: "1px",
    background:
        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
    zIndex: 11,
}

/* --- PROPERTY CONTROLS --- */

addPropertyControls(MembranaHero, {
    splineUrl: {
        type: ControlType.String,
        title: "Spline URL",
        defaultValue:
            "https://prod.spline.design/TkxzWFaGqAFkMOcK/scene.splinecode",
        placeholder: "Pega tu .splinecode aquí",
    },
    title: {
        type: ControlType.String,
        title: "Título",
        defaultValue: "MEMBRANA",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Ingeniería de Campo Corporal",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tinte Líquido",
        defaultValue: "#D4F4F7", // Un cian muy pálido
    },
})
