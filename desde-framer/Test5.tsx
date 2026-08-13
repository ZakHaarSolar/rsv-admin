import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Props = {
    width: number
    height: number
    background: string
    onClickCore?: () => void
    onClickInner?: () => void
    onClickOuter?: () => void
    onClickUp?: () => void
    onClickDown?: () => void
}

export default function MapaToroidal({
    width = 360,
    height = 640,
    background = "transparent",
    onClickCore,
    onClickInner,
    onClickOuter,
    onClickUp,
    onClickDown,
}: Props) {
    return (
        <div style={{ width, height, background }}>
            <svg
                viewBox="0 0 360 640"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", display: "block" }}
            >
                <defs>
                    <radialGradient
                        id="toroidalGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                    >
                        <stop offset="0%" stopColor="#fffbcc" stopOpacity="1" />
                        <stop
                            offset="50%"
                            stopColor="#ffd27f"
                            stopOpacity="0.8"
                        />
                        <stop
                            offset="100%"
                            stopColor="#ff8800"
                            stopOpacity="0"
                        />
                    </radialGradient>
                    <radialGradient
                        id="pulseGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#ffffff"
                            stopOpacity="0.9"
                        />
                        <stop
                            offset="100%"
                            stopColor="#ffd27f"
                            stopOpacity="0"
                        />
                    </radialGradient>
                </defs>

                {/* Campo toroidal */}
                <circle
                    cx="180"
                    cy="320"
                    r="140"
                    fill="none"
                    stroke="url(#toroidalGradient)"
                    strokeWidth="2"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 180 320"
                        to="360 180 320"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                </circle>

                {/* Núcleo Zero-Point */}
                <g
                    onClick={onClickCore}
                    style={{ cursor: onClickCore ? "pointer" : "default" }}
                >
                    <circle cx="180" cy="320" r="20" fill="url(#pulseGradient)">
                        <animate
                            attributeName="r"
                            values="20;25;20"
                            dur="2.5s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>

                {/* Anillo interno */}
                <g
                    onClick={onClickInner}
                    style={{ cursor: onClickInner ? "pointer" : "default" }}
                >
                    <circle
                        cx="180"
                        cy="320"
                        r="60"
                        fill="none"
                        stroke="#ffd27f"
                        strokeWidth="1"
                        strokeOpacity="0.6"
                    >
                        <animate
                            attributeName="r"
                            values="60;65;60"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>

                {/* Anillo externo */}
                <g
                    onClick={onClickOuter}
                    style={{ cursor: onClickOuter ? "pointer" : "default" }}
                >
                    <circle
                        cx="180"
                        cy="320"
                        r="100"
                        fill="none"
                        stroke="#ffcc88"
                        strokeWidth="0.8"
                        strokeOpacity="0.5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 180 320"
                            to="-360 180 320"
                            dur="20s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>

                {/* Flujo ascendente */}
                <g
                    onClick={onClickUp}
                    style={{ cursor: onClickUp ? "pointer" : "default" }}
                >
                    <path
                        d="M180 500 Q150 400 180 320 Q210 240 180 140"
                        fill="none"
                        stroke="#ffddaa"
                        strokeWidth="1"
                        strokeOpacity="0.7"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.7;0.3;0.7"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>

                {/* Flujo descendente */}
                <g
                    onClick={onClickDown}
                    style={{ cursor: onClickDown ? "pointer" : "default" }}
                >
                    <path
                        d="M180 140 Q210 240 180 320 Q150 400 180 500"
                        fill="none"
                        stroke="#ffeecc"
                        strokeWidth="1"
                        strokeOpacity="0.7"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.3;0.7;0.3"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
            </svg>
        </div>
    )
}

// Tamaño intrínseco para poder arrastrar desde Assets
MapaToroidal.defaultProps = {
    width: 360,
    height: 640,
    background: "transparent",
}

// Registrar controles para que aparezca en "Components"
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
    background: { type: ControlType.Color, title: "Background" },
    onClickCore: { type: ControlType.EventHandler, title: "Click → Núcleo" },
    onClickInner: {
        type: ControlType.EventHandler,
        title: "Click → Anillo interno",
    },
    onClickOuter: {
        type: ControlType.EventHandler,
        title: "Click → Anillo externo",
    },
    onClickUp: {
        type: ControlType.EventHandler,
        title: "Click → Flujo ascendente",
    },
    onClickDown: {
        type: ControlType.EventHandler,
        title: "Click → Flujo descendente",
    },
})
