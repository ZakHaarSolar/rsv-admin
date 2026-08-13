import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function SolarButton(props) {
    return (
        <button
            style={{
                padding: "10px 22px",
                borderRadius: "8px",
                background: "#E8C976",
                color: "#000",
                fontSize: "11px",
                cursor: "pointer",
                border: "none",
            }}
        >
            {props.texto}
        </button>
    )
}

addPropertyControls(SolarButton, {
    texto: {
        type: ControlType.String,
        title: "Texto del botón",
        defaultValue: "Comprar ahora",
    },
})
