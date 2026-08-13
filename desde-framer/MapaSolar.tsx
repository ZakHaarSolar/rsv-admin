import * as React from "react"
import { useState } from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

export function MenuMapaSolar({ width, height, linkColor }) {
    const [abierto, setAbierto] = useState(false)

    const toggleMenu = () => setAbierto(!abierto)

    return (
        <Frame
            width={width}
            height={height}
            background="#fff8e6"
            style={{ fontFamily: "inherit", borderRadius: 16, padding: 20 }}
        >
            <button onClick={toggleMenu} style={estilos.boton}>
                {abierto ? "Cerrar el Mapa Solar" : "Abrir el Mapa Solar"}
            </button>

            {abierto && (
                <div style={estilos.menu}>
                    {enlaces.map(({ href, texto }) => (
                        <a
                            key={href}
                            href={href}
                            style={{ ...estilos.link, color: linkColor }}
                        >
                            ➤ {texto}
                        </a>
                    ))}
                </div>
            )}
        </Frame>
    )
}

// 🧩 Estilos internos (antes causaban el error por no estar definidos)
const estilos = {
    boton: {
        backgroundColor: "#fff2dc",
        color: "#3c2c1b",
        border: "none",
        padding: "14px 28px",
        fontSize: "1.1rem",
        borderRadius: "20px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    menu: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff8e6", // ya lo tienes
        opacity: 1, // 🔒 fuerza opacidad completa
        backdropFilter: "none", // 🔒 elimina efecto blur si existía
        padding: "20px",
        borderRadius: "16px",
        marginTop: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        zIndex: 10, // 🔝 por si hay stacking conflict
        position: "relative", // 🧩 por si lo necesitas
    },
    link: {
        textDecoration: "none",
        padding: "8px 0",
        fontWeight: 500,
        transition: "color 0.2s ease",
    },
}

// 🌞 Enlaces vibrales del menú solar
const enlaces = [
    { href: "#recibir", texto: "Recibir sin Esfuerzo" },
    { href: "#fragmentos", texto: "Fragmentos del Sol" },
    { href: "#bitacoras", texto: "Bitácoras Solares" },
    { href: "#cartografia", texto: "Cartografía Solar" },
    { href: "#vibral", texto: "Sesión 1:1" },
    { href: "#libros", texto: "Libros del Nodo" },
    { href: "#aqua", texto: "Eje Aqua’Riia" },
    { href: "#sobre", texto: "Sobre Red Solar Viva" },
]

// 📐 Controles en el panel derecho de Framer
addPropertyControls(MenuMapaSolar, {
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 300,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 300,
    },
    linkColor: {
        type: ControlType.Color,
        title: "Color Links",
        defaultValue: "#3c2c1b",
    },
})
