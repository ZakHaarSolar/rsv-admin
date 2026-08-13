import * as React from "react"
import { motion } from "framer-motion"

type Props = { title: string; subtitle?: string }

export function HoloTitle({ title, subtitle }: Props) {
    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
            }}
        >
            <motion.h1
                className="holo-title"
                initial={{ scale: 0.99, opacity: 0 }}
                animate={{ scale: [0.99, 1, 0.99], opacity: 1 }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {title}
            </motion.h1>
            {subtitle && (
                <p
                    className="holo-subtitle"
                    dangerouslySetInnerHTML={{
                        __html: subtitle.replace(/\n/g, "<br/>"),
                    }}
                />
            )}
        </div>
    )
}
