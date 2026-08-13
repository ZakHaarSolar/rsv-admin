import { motion } from "framer-motion"

export default function Toroid({
    width = 360,
    height = 640,
    draggable = false,
}) {
    return (
        <motion.div
            style={{ width, height }}
            {...(draggable ? { drag: true } : {})}
        >
            <svg
                viewBox="0 0 360 640"
                style={{ width: "100%", height: "100%", display: "block" }}
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
        </motion.div>
    )
}

// Tamaño intrínseco para que se pueda soltar desde Assets
Toroid.defaultProps = { width: 360, height: 640 }

export const __FramerMetadata__ = {
    exports: {
        default: {
            name: "Toroid",
            props: {
                width: { type: "number", defaultValue: 360, title: "Width" },
                height: { type: "number", defaultValue: 640, title: "Height" },
                draggable: {
                    type: "boolean",
                    defaultValue: false,
                    title: "Draggable",
                },
            },
            dimensions: { width: 360, height: 640 },
        },
    },
}
