import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function BotonVibral({ text }) {
    return (
        <div
            style={{
                backgroundColor: "#f7e7c4", // tono crema solar
                color: "#3e2f1c", // tono tierra luz
                padding: "11px 25px",
                borderRadius: "18px",
                fontSize: ".7rem",
                fontWeight: "bold",
                textDecoration: "none",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease-in-out",
                display: "inline-block",
                cursor: "pointer",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffeac2"
                e.currentTarget.style.transform = "scale(1.03)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f7e7c4"
                e.currentTarget.style.transform = "scale(1)"
            }}
        >
            {text}
        </div>
    )
}

// Props personalizables en el panel de la derecha
addPropertyControls(BotonVibral, {
    text: {
        type: ControlType.String,
        title: "Texto",
        defaultValue: "Portal Solar",
    },
})
