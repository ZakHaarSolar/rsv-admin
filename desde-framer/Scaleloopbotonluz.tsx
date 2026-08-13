// Get Started: https://www.framer.com/developers

import { motion, useAnimation } from "framer-motion"
import { useEffect, ReactNode } from "react"

type Props = {
    children?: ReactNode
}

export function ScaleLoop({ children }: Props) {
    const controls = useAnimation()

    useEffect(() => {
        controls.start({
            scale: [0.96, 1.02, 0.96],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            },
        })
    }, [])

    return (
        <motion.div animate={controls} style={{ display: "inline-block" }}>
            {children}
        </motion.div>
    )
}
