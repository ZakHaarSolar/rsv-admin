// Núcleo de Irradiación — Code Component para Framer
// ---------------------------------------------------------------------------------
// Mantra del núcleo: presencia → emisión → silencio → retorno (coherencia que ancla).
// Sin librerías externas; React base. Pégalo tal cual en tu proyecto de Framer.
// ---------------------------------------------------------------------------------

import * as React from "react"

export default function NucleoDeIrradiacion(props) {
    // --- Parámetros suaves (puedes ajustar numéricamente si lo deseas) --------------
    const {
        width = 600,
        height = 600,
        hue = 38, // tono solar base (HSL) — dorado cálido
        arms = 5, // número de brazos del vórtice
        hexLayers = 3, // capas de hexaformas
        intensity = 1.0, // ganancia global de brillo
        seed = 108, // semilla sutil para variación
    } = props

    // --- Estado y refs ----------------------------------------------------------------
    const containerRef = React.useRef(null)
    const canvasRef = React.useRef(null)

    const pressedRef = React.useRef(false)
    const hoverRef = React.useRef(false)
    const animRef = React.useRef({ raf: 0, last: 0 })
    const dprRef = React.useRef(1)

    // Puntero normalizado y coherencia vibral
    const pointerRef = React.useRef({
        x: 0.5,
        y: 0.5,
        px: 0.5,
        py: 0.5,
        vx: 0,
        vy: 0,
        t: performance.now(),
    })
    const coherenceRef = React.useRef(0.25) // empieza suave (crece con quietud)
    const phaseRef = React.useRef(0) // fase del sello solar
    const ringShiftRef = React.useRef(0) // reordenación hexa por tacto

    // Respeto a reduces motion
    const reduceMotion = React.useMemo(() => {
        if (typeof window === "undefined") return false
        return (
            window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
            false
        )
    }, [])

    // --- Utilidades -------------------------------------------------------------------
    const clamp01 = (v) => Math.max(0, Math.min(1, v))
    const lerp = (a, b, t) => a + (b - a) * t
    const ease = (t) => t * t * (3 - 2 * t)
    const rnd = React.useMemo(() => makeRNG(seed), [seed])

    // --- Efecto: tamaño y DPR ---------------------------------------------------------
    React.useEffect(() => {
        const canvas = canvasRef.current
        const el = containerRef.current
        if (!canvas || !el) return

        function resize() {
            const rect = el.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            dprRef.current = dpr
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
            canvas.style.width = rect.width + "px"
            canvas.style.height = rect.height + "px"
            const ctx = canvas.getContext("2d")
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // trabajamos en px CSS
        }

        resize()
        const obs = new ResizeObserver(resize)
        obs.observe(el)
        window.addEventListener("resize", resize, { passive: true })

        return () => {
            obs.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [])

    // --- Efecto: animación del vórtice ------------------------------------------------
    React.useEffect(() => {
        if (!canvasRef.current) return

        const ctx = canvasRef.current.getContext("2d")
        const el = containerRef.current

        let last = performance.now()
        let raf = 0

        function frame(now) {
            const dt = Math.min(0.033, (now - last) / 1000) // cap 30 ms
            last = now

            step(dt, now / 1000, ctx, el)
            raf = requestAnimationFrame(frame)
            animRef.current.raf = raf
            animRef.current.last = now
        }

        if (reduceMotion) {
            // Dibujo estático una sola vez
            step(0, performance.now() / 1000, ctx, el, true)
            return
        }

        raf = requestAnimationFrame(frame)
        animRef.current.raf = raf
        return () => cancelAnimationFrame(raf)
    }, [reduceMotion, hue, arms, hexLayers, intensity])

    // --- Interacciones suaves ---------------------------------------------------------
    const onPointerMove = (e) => {
        const el = containerRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const nx = clamp01((e.clientX - r.left) / Math.max(1, r.width))
        const ny = clamp01((e.clientY - r.top) / Math.max(1, r.height))

        const now = performance.now()
        const dt = Math.max(1, now - pointerRef.current.t)
        const vx = (nx - pointerRef.current.x) / dt
        const vy = (ny - pointerRef.current.y) / dt

        pointerRef.current = { x: nx, y: ny, px: nx, py: ny, vx, vy, t: now }
    }

    const onPointerDown = () => {
        pressedRef.current = true
    }
    const onPointerUp = () => {
        pressedRef.current = false
    }
    const onEnter = () => (hoverRef.current = true)
    const onLeave = () => {
        hoverRef.current = false
        pressedRef.current = false
    }

    // --- Núcleo del paso de animación -------------------------------------------------
    function step(dt, t, ctx, el, staticOnly = false) {
        if (!ctx || !el) return
        const { width, height } = el.getBoundingClientRect()
        // Limpieza segura (restaurando transform temporalmente)
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.restore()

        // Centro y radio operativo
        const cx = width / 2
        const cy = height / 2
        const R = Math.min(width, height) * 0.47

        // Respiración solar: pulso base
        const breath = 0.5 + 0.5 * Math.sin(t * 0.9 + 1.1)
        const breath2 = 0.5 + 0.5 * Math.sin(t * 0.33 + 0.6)

        // Coherencia = quietud del puntero (menos velocidad → más coherencia)
        const speed =
            Math.hypot(pointerRef.current.vx, pointerRef.current.vy) * 1000 // ~px/s norm
        const targetCoherence = clamp01(1 - Math.min(1, speed * 0.35))
        coherenceRef.current = lerp(coherenceRef.current, targetCoherence, 0.08)

        // Rotación de sello y shift de anillos por tacto
        if (!staticOnly) {
            const boost = hoverRef.current ? 1.3 : 1.0
            phaseRef.current +=
                dt * 0.2 * boost * (0.7 + coherenceRef.current * 0.6)
            ringShiftRef.current = lerp(
                ringShiftRef.current,
                pressedRef.current ? 1 : 0,
                0.15
            )
        }

        // Fondo: gradientes solares (sello / anclaje físico)
        drawSolarBackground(
            ctx,
            cx,
            cy,
            R,
            hue,
            intensity,
            breath,
            coherenceRef.current
        )

        // Vórtice: espirales logarítmicas (emisión autónoma)
        const angleToPointer = Math.atan2(
            pointerRef.current.y - 0.5,
            pointerRef.current.x - 0.5
        )
        drawLogSpirals(ctx, cx, cy, R, {
            arms,
            growth: 0.095 + 0.02 * Math.sin(t * 0.2 + seed),
            hue,
            phase: phaseRef.current + angleToPointer * 0.25,
            alpha: 0.45 + 0.45 * coherenceRef.current,
            lineBase: 1.1 + coherenceRef.current * 1.5,
            intensity,
        })

        // Anillos de coherencia (retorno y memoria)
        drawCoherenceRings(ctx, cx, cy, R, {
            hue,
            t,
            count: 7 + Math.floor(3 * breath2),
            shift: ringShiftRef.current,
            coherence: coherenceRef.current,
            intensity,
        })

        // Hexaformas resonantes: reordenación táctil
        drawHexaField(ctx, cx, cy, R * 0.78, {
            layers: hexLayers,
            hue,
            t,
            shift: ringShiftRef.current,
            pointer: {
                x: pointerRef.current.x * width,
                y: pointerRef.current.y * height,
            },
            intensity,
        })

        // Tetra-expansión en hover (no interferencia)
        drawTetra(ctx, cx, cy, R * 0.38, {
            hue,
            open: hoverRef.current ? 1 : 0,
            coherence: coherenceRef.current,
            intensity,
        })

        // Texto-sello (silencio que recuerda)
        drawSubtleSeal(ctx, cx, cy, R, {
            hue,
            t,
            intensity,
            alpha: 0.06 + 0.1 * coherenceRef.current,
        })
    }

    // --- Dibujo: fondo solar ----------------------------------------------------------
    function drawSolarBackground(ctx, cx, cy, R, hue, gain, breath, coherence) {
        const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
        g1.addColorStop(
            0,
            `hsla(${hue}, 95%, ${Math.round(62 + 10 * breath)}%, ${0.18 * gain})`
        )
        g1.addColorStop(0.45, `hsla(${hue}, 95%, 52%, ${0.12 * gain})`)
        g1.addColorStop(1, `hsla(${hue + 24}, 90%, 9%, ${0.0})`)
        ctx.fillStyle = g1
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

        // Aura exterior con conic gradient simulado por arcos
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        const rings = 24
        for (let i = 0; i < rings; i++) {
            const a = (i / rings) * Math.PI * 2 + phaseRef.current * 0.5
            const rr = R * (0.82 + 0.08 * Math.sin(a * 3 + coherence * 5))
            ctx.beginPath()
            ctx.arc(cx, cy, rr, a, a + ((Math.PI * 2) / rings) * 0.7)
            ctx.strokeStyle = `hsla(${hue + 60}, 95%, ${50 + 20 * Math.sin(a + 1.1)}%, ${0.025 * gain})`
            ctx.lineWidth = 2
            ctx.stroke()
        }
        ctx.restore()
    }

    // --- Dibujo: espirales logarítmicas ----------------------------------------------
    function drawLogSpirals(
        ctx,
        cx,
        cy,
        R,
        { arms, growth, hue, phase, alpha, lineBase, intensity }
    ) {
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        const a0 = Math.max(0.008, growth)
        const maxTheta = Math.PI * 7.5 // longitud de la espiral
        for (let k = 0; k < arms; k++) {
            const ph = phase + (k / arms) * Math.PI * 2
            ctx.beginPath()
            let started = false
            for (let th = 0; th <= maxTheta; th += 0.035) {
                const r = 3 * Math.exp(a0 * th)
                const rad = Math.min(
                    R * 0.86,
                    r + R * 0.06 * Math.sin(th * 1.7 + ph * 0.9)
                )
                const ang = th + ph
                const x = cx + rad * Math.cos(ang)
                const y = cy + rad * Math.sin(ang)
                if (!started) {
                    ctx.moveTo(x, y)
                    started = true
                } else ctx.lineTo(x, y)
            }
            ctx.strokeStyle = `hsla(${hue + k * (120 / Math.max(1, arms - 1))}, 95%, 65%, ${alpha * 0.75 * intensity})`
            ctx.lineWidth = lineBase + (k % 2 ? 0.5 : 0)
            ctx.lineCap = "round"
            ctx.stroke()
        }
        ctx.restore()
    }

    // --- Dibujo: anillos de coherencia ------------------------------------------------
    function drawCoherenceRings(
        ctx,
        cx,
        cy,
        R,
        { hue, t, count, shift, coherence, intensity }
    ) {
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        for (let i = 0; i < count; i++) {
            const p = i / Math.max(1, count - 1)
            const rr =
                R *
                (0.12 + 0.8 * p) *
                (1 + 0.07 * Math.sin(t * 1.4 + i * 0.9 + shift * 2.4))
            ctx.beginPath()
            ctx.arc(cx, cy, rr, 0, Math.PI * 2)
            const l = Math.round(60 + 15 * Math.sin(i * 0.9 + t))
            ctx.strokeStyle = `hsla(${hue + 10}, 95%, ${l}%, ${0.05 * (1 + coherence) * intensity})`
            ctx.lineWidth = 0.6 + 1.8 * p ** 1.2 + coherence * 0.8
            ctx.setLineDash([4 + 6 * p * (1 + shift), 10 + 7 * (1 - p)])
            ctx.lineDashOffset = t * 12 * (1 + p * 3) * (shift ? -1 : 1)
            ctx.stroke()
        }
        ctx.restore()
    }

    // --- Dibujo: hexaformas resonantes ------------------------------------------------
    function drawHexaField(
        ctx,
        cx,
        cy,
        radius,
        { layers, hue, t, shift, pointer, intensity }
    ) {
        if (layers <= 0) return
        ctx.save()
        const base = radius / (layers + 1)
        const nearR = base * 0.6 // tamaño del hex

        for (let layer = 1; layer <= layers; layer++) {
            const n = 6 * layer // hexágonos en esta corona
            const ringR =
                base *
                layer *
                (1 +
                    0.12 *
                        Math.sin(
                            t * 1.2 + layer * 0.7 + shift * (1.2 + layer * 0.15)
                        ))

            for (let i = 0; i < n; i++) {
                const a =
                    (i / n) * Math.PI * 2 +
                    phaseRef.current * (0.6 + layer * 0.05)
                const x = cx + ringR * Math.cos(a)
                const y = cy + ringR * Math.sin(a)

                const d = Math.hypot(pointer.x - x, pointer.y - y)
                const proximity = clamp01(1 - d / (base * 2.2))
                const glow = (0.2 + proximity * 0.8) * intensity

                const rot = a + Math.sin(t * 0.6 + i * 0.8) * 0.25
                const size =
                    nearR * (0.65 + 0.35 * proximity * (1 + shift * 0.8))

                drawHex(ctx, x, y, size, rot, {
                    fill: `hsla(${hue + 20 + layer * 6}, 95%, ${55 + proximity * 25}%, ${0.12 * glow})`,
                    stroke: `hsla(${hue + 40}, 95%, 70%, ${0.35 * glow})`,
                    lineWidth: 0.9 + proximity * 1.4,
                })
            }
        }

        ctx.restore()
    }

    function drawHex(ctx, x, y, r, rot, style) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            const px = Math.cos(a) * r
            const py = Math.sin(a) * r
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        if (style.fill) {
            ctx.fillStyle = style.fill
            ctx.fill()
        }
        if (style.stroke) {
            ctx.strokeStyle = style.stroke
            ctx.lineWidth = style.lineWidth || 1
            ctx.stroke()
        }
        ctx.restore()
    }

    // --- Dibujo: tetra-expansión ------------------------------------------------------
    function drawTetra(ctx, cx, cy, s, { hue, open, coherence, intensity }) {
        // 4 triángulos (N,S,E,O) que se abren en hover
        const spread = s * (0.35 + 0.5 * ease(open))
        const al = 0.12 + 0.18 * coherence

        const tris = [
            { x: cx, y: cy - spread, rot: 0 }, // Norte
            { x: cx, y: cy + spread, rot: Math.PI }, // Sur
            { x: cx + spread, y: cy, rot: Math.PI / 2 }, // Este
            { x: cx - spread, y: cy, rot: -Math.PI / 2 }, // Oeste
        ]

        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        tris.forEach((tr, idx) => {
            drawTri(ctx, tr.x, tr.y, s * 0.55, tr.rot, {
                fill: `hsla(${hue + 10 + idx * 20}, 95%, 60%, ${al * intensity})`,
                stroke: `hsla(${hue + 40}, 98%, 75%, ${0.25 * intensity})`,
                lineWidth: 1.2 + coherence * 0.6,
            })
        })
        ctx.restore()
    }

    function drawTri(ctx, x, y, r, rot, style) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        ctx.beginPath()
        ctx.moveTo(0, -r)
        ctx.lineTo(r * 0.86, r * 0.5)
        ctx.lineTo(-r * 0.86, r * 0.5)
        ctx.closePath()
        if (style.fill) {
            ctx.fillStyle = style.fill
            ctx.fill()
        }
        if (style.stroke) {
            ctx.strokeStyle = style.stroke
            ctx.lineWidth = style.lineWidth || 1
            ctx.stroke()
        }
        ctx.restore()
    }

    // --- Dibujo: sello sutil (texto/annealing) ---------------------------------------
    function drawSubtleSeal(ctx, cx, cy, R, { hue, t, intensity, alpha }) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(phaseRef.current * 0.6)
        ctx.font = `${Math.max(10, R * 0.06)}px/1.2 system-ui, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = `hsla(${hue + 28}, 90%, 70%, ${alpha * intensity})`
        const mantra = "PRESENCIA • EMISIÓN • SILENCIO • RETORNO"
        ctx.fillText(mantra, 0, R * 0.66)
        ctx.restore()
    }

    // --- RNG sutil (determinista) -----------------------------------------------------
    function makeRNG(seed = 1) {
        // xorshift32 simple
        let x = seed | 0 || 1
        return () => {
            x ^= x << 13
            x ^= x >>> 17
            x ^= x << 5
            return ((x >>> 0) % 1_000_000) / 1_000_000
        }
    }

    // --- Render -----------------------------------------------------------------------
    return (
        <div
            ref={containerRef}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                position: "relative",
                overflow: "hidden",
                borderRadius: 16,
                background: `radial-gradient(1200px 800px at 50% 55%, hsla(${hue},95%,12%,0.28), transparent 65%)`,
                boxShadow: `0 20px 60px -12px hsla(${hue + 40}, 95%, 40%, 0.18) inset,
                    0 40px 120px -24px hsla(${hue + 10}, 95%, 30%, 0.15)`,
                cursor: "pointer",
                touchAction: "none",
                WebkitTapHighlightColor: "transparent",
            }}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {/* ——————————————————————————————————————————————————————————————
          // mantra: “El vórtice escucha al tacto sin perder su centro.”
          // canvas = flujo unificado: todo colapsa por coherencia pura.
         —————————————————————————————————————————————————————————————— */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                }}
            />

            {/* Brillo especular suave (sello solar que respira) */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    mixBlendMode: "screen",
                    background: `radial-gradient(circle at 50% 50%,
                        hsla(${hue + 14},100%,60%,0.12),
                        hsla(${hue + 20},100%,30%,0.08) 40%,
                        transparent 70%)`,
                    pointerEvents: "none",
                }}
            />

            {/* Guía poética (oculta visualmente, útil para lectores de pantalla) */}
            <span
                style={{
                    position: "absolute",
                    clip: "rect(0 0 0 0)",
                    clipPath: "inset(50%)",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }}
            >
                Núcleo de irradiación interactivo: mueve el puntero para sentir
                la coherencia, toca para reordenar hexaformas, acerca la
                presencia y observa cómo el sello respira.
            </span>
        </div>
    )
}
