// LivingLens.tsx
import * as React from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

type Props = {
    intensity?: number // 0–1
    softness?: number // px blur
    tint?: string // color base
    opacity?: number // 0–1
    pointerScale?: number // 0.5–2
    blendMode?: React.CSSProperties["mixBlendMode"]
    zIndex?: number
}

export default function LivingLens({
    intensity = 0.5,
    softness = 120,
    tint = "rgba(120,200,255,1)",
    opacity = 0.08,
    pointerScale = 1.0,
    blendMode = "soft-light",
    zIndex = 2,
}: Props) {
    const ref = React.useRef<HTMLDivElement>(null)

    // base values [0..1]
    const mx = useMotionValue<number>(0.5)
    const my = useMotionValue<number>(0.5)

    // resorte sutil
    const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.2 })
    const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.2 })

    // centro del gradiente (en %)
    const cx = useTransform<number, string>(sx, (v: number) => `${v * 100}%`)
    const cy = useTransform<number, string>(sy, (v: number) => `${v * 100}%`)

    // background reactivo
    const bg = useTransform<[string, string], string>(
        [cx, cy],
        ([x, y]) =>
            `radial-gradient(
      circle at ${x} ${y},
      ${tint} ${12 * pointerScale}px,
      rgba(255,255,255,${0.25 * intensity}) ${60 * pointerScale}px,
      rgba(0,0,0,${0.35 * intensity}) ${220 * pointerScale}px,
      transparent ${360 * pointerScale}px
    )`
    )

    const handleMove = (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const p = "touches" in e ? e.touches[0] : e
        const x = (p.clientX - rect.left) / rect.width
        const y = (p.clientY - rect.top) / rect.height
        mx.set(Math.max(0, Math.min(1, x)))
        my.set(Math.max(0, Math.min(1, y)))
    }

    // auto-drift suave
    React.useEffect(() => {
        let t = 0
        let id = 0 as unknown as number
        const loop = () => {
            t += 0.008
            mx.set(0.5 + Math.sin(t) * 0.02)
            my.set(0.5 + Math.cos(t * 0.9) * 0.02)
            id = requestAnimationFrame(loop)
        }
        id = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                mixBlendMode: blendMode,
                filter: `blur(${softness}px)`,
                backgroundImage: bg,
                opacity,
                willChange: "background-image, opacity",
                zIndex,
            }}
        />
    )
}
