import * as React from "react"
import { useState, useEffect, useLayoutEffect } from "react"
import { motion } from "framer-motion"

/* ---------------------------------------------
   CSS WARP - Versión ULTRA VISIBLE (corregida)
--------------------------------------------- */
const WARP_CSS = String.raw`
.stars-warp-container {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    perspective: 600px;
    /* Viñeta mucho más suave (ya no es negro puro) */
    background: radial-gradient(circle at center, rgba(20,25,45,0.3) 0%, rgba(8,12,28,0.75) 100%);
}

.star-warp {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 
        0 0 8px 3px #fff,
        0 0 16px 6px #a5e0ff,
        0 0 28px 10px rgba(165, 224, 255, 0.7);
    animation: space-flight var(--dur) linear infinite;
    animation-delay: var(--delay);
    opacity: 0;
    will-change: transform, opacity;
}

@keyframes space-flight {
    0% {
        transform: translate3d(var(--x), var(--y), -1800px);
        opacity: 0;
    }
    18% {
        opacity: 1;
    }
    85% {
        opacity: 1;
    }
    100% {
        transform: translate3d(var(--x), var(--y), 500px);
        opacity: 0;
    }
}
`

/* ---------------------------------------------
   Inyección de CSS (forzada y más segura)
--------------------------------------------- */
function useInjectWarpCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return

        const id = "stars-warp-css-v3"
        let style = document.getElementById(id) as HTMLStyleElement | null

        if (!style) {
            style = document.createElement("style")
            style.id = id
            document.head.appendChild(style)
        }

        // Siempre actualizamos el contenido (evita problemas de caché o hot-reload)
        style.textContent = WARP_CSS
    }, [])
}

/* ---------------------------------------------
   Estrellas (más cantidad y más brillantes)
--------------------------------------------- */
const StarsBackground = React.memo(
    ({ num = 180, speed = 1.2 }: { num?: number; speed?: number }) => {
        const [stars, setStars] = useState<any[]>([])

        useEffect(() => {
            console.log(`🚀 Generando ${num} estrellas...`) // ← Debug en consola
            const arr: any[] = []
            const total = Math.floor(num * 1.8)
            for (let i = 0; i < total; i++) {
                const isBig = Math.random() > 0.75
                arr.push({
                    id: i,
                    size: isBig
                        ? Math.random() * 3.8 + 2.2
                        : Math.random() * 1.9 + 0.9,
                    x: (Math.random() - 0.5) * 340,
                    y: (Math.random() - 0.5) * 300,
                    baseDuration: 2.0 + Math.random() * 4.8,
                    delay: Math.random() * 8,
                })
            }
            setStars(arr)
        }, [num])

        return (
            <div className="stars-warp-container">
                {stars.map((s) => (
                    <div
                        key={s.id}
                        className="star-warp"
                        style={
                            {
                                "--size": `${s.size}px`,
                                "--x": `${s.x}vw`,
                                "--y": `${s.y}vh`,
                                "--dur": `${s.baseDuration / speed}s`,
                                "--delay": `${s.delay}s`,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
        )
    }
)

/* ---------------------------------------------
   NUESTRO WRAP CORREGIDO (solo estrellas)
--------------------------------------------- */
export function StarWarpWrapper({
    children,
    numStars = 180,
    warpSpeed = 1.3,
    backgroundColor = "#050911",
    debug = false,
    ...props
}: {
    children?: React.ReactNode
    numStars?: number
    warpSpeed?: number
    backgroundColor?: string
    debug?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
    useInjectWarpCss()

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minHeight: "100vh",
                background: backgroundColor,
                overflow: "hidden",
                color: "#fff",
            }}
            {...props}
        >
            {/* Fondo de estrellas */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            >
                <StarsBackground num={numStars} speed={warpSpeed} />
            </motion.div>

            {/* DEBUG: Estrella central brillante (para verificar que todo funciona) */}
            {debug && (
                <div
                    style={{
                        position: "fixed",
                        left: "50%",
                        top: "50%",
                        width: "18px",
                        height: "18px",
                        background: "#fff",
                        borderRadius: "50%",
                        boxShadow: "0 0 40px 20px #7ed3ff",
                        zIndex: 10,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Contenido que pongas tú (título, textarea, etc.) */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    minHeight: "100vh",
                }}
            >
                {children}
            </div>
        </div>
    )
}
