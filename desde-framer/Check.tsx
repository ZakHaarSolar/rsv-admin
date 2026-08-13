// MapaToroidal.tsx (o el nombre que uses)
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export default function MapaToroidal(props) {
    const { width, height } = props
    return (
        <div style={{ width, height }}>
            <svg
                viewBox="0 0 360 640"
                style={{ width: "100%", height: "100%", display: "block" }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="360" height="640" fill="black" />
                <defs>
                    <radialGradient
                        id="toroidGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                    >
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                        <stop
                            offset="100%"
                            stopColor="#FF4500"
                            stopOpacity="0"
                        />
                    </radialGradient>
                </defs>

                <ellipse
                    id="toroid"
                    cx="180"
                    cy="320"
                    rx="120"
                    ry="200"
                    fill="url(#toroidGradient)"
                    stroke="#FFD700"
                    strokeWidth="2"
                />
                <circle
                    cx="180"
                    cy="320"
                    r="20"
                    fill="#FF4500"
                    stroke="#FFD700"
                    strokeWidth="2"
                />
                <g stroke="#00FFFF" strokeWidth="1">
                    <path d="M180 120 C250 220, 250 420, 180 520" />
                    <path d="M180 120 C110 220, 110 420, 180 520" />
                </g>

                {/* usar href en lugar de xlink:href */}
                <animateTransform
                    href="#toroid"
                    attributeName="transform"
                    type="scale"
                    from="1 1"
                    to="1.05 1.05"
                    begin="0s"
                    dur="2s"
                    repeatCount="indefinite"
                    additive="sum"
                />
                <animateTransform
                    href="#toroid"
                    attributeName="transform"
                    type="rotate"
                    from="0 180 320"
                    to="360 180 320"
                    begin="0s"
                    dur="20s"
                    repeatCount="indefinite"
                    additive="sum"
                />
            </svg>
        </div>
    )
}

// Tamaño intrínseco para que Framer lo pueda soltar
MapaToroidal.defaultProps = { width: 360, height: 640 }

// Registrar como Code Component (aparecerá en "Components")
addPropertyControls(MapaToroidal, {
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 360,
        min: 50,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 640,
        min: 50,
    },
})
