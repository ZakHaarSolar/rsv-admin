import React, { useEffect, useState, useCallback, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* --- 1. SISTEMA DE ICONOS --- */
const Icons = {
    Activity: () => (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    Fingerprint: () => (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 12c0-3 2.5-5.5 5-5.5 4 0 7 2.5 7 5.5 0 4.5-5 10-12 10S0 16.5 0 12c0-3 2.5-5.5 5-5.5 1.5 0 3 .5 4 1.5" />
            <path d="M12 12v8" />
            <path d="M8 12v4" />
        </svg>
    ),
    Zap: () => (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    ArrowRight: () => (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    ),
    ArrowLeft: () => (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </svg>
    ),
}

/* --- 2. UTILIDADES Y SUBCOMPONENTES --- */

const renderSubheadline = (text) => {
    if (!text) return null
    const parts = String(text).split("\\n")
    return parts.map((part, index) => (
        <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && <br />}
        </React.Fragment>
    ))
}

/* Fondo WebGL */
const CrystallineBackground = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl")
        if (!gl) return

        const vsSource = `attribute vec4 aVertexPosition; void main() { gl_Position = aVertexPosition; }`
        const fsSource = `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution.xy;
                uv.x *= uResolution.x / uResolution.y;
                float t = uTime * 0.2;
                vec2 p = uv * 6.0;
                float brightness = 0.0;
                for(float i = 1.0; i <= 4.0; i++){
                    p.x += 0.3 / i * sin(i * 3.0 * p.y + t * 1.5) + 1.0;
                    p.y += 0.3 / i * cos(i * 3.0 * p.x + t * 1.5) + 1.0;
                }
                float r = cos(p.x + p.y + 1.0) * 0.5 + 0.5;
                vec3 color = vec3(0.96, 0.98, 1.0);
                float lightIntensity = pow(r, 6.0); 
                vec3 lightColor = vec3(0.2, 0.9, 1.0);
                color += lightColor * lightIntensity * 0.6;
                float centerLight = 1.0 - length(uv - vec2(0.5 * (uResolution.x/uResolution.y), 0.5)) * 0.5;
                color *= centerLight + 0.2;
                gl_FragColor = vec4(color, 1.0);
            }
        `

        const initShader = (type, source) => {
            const shader = gl.createShader(type)
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader)
                return null
            }
            return shader
        }
        const shaderProgram = gl.createProgram()
        gl.attachShader(shaderProgram, initShader(gl.VERTEX_SHADER, vsSource))
        gl.attachShader(shaderProgram, initShader(gl.FRAGMENT_SHADER, fsSource))
        gl.linkProgram(shaderProgram)
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) return

        const positionLocation = gl.getAttribLocation(
            shaderProgram,
            "aVertexPosition"
        )
        const timeLocation = gl.getUniformLocation(shaderProgram, "uTime")
        const resolutionLocation = gl.getUniformLocation(
            shaderProgram,
            "uResolution"
        )
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )

        let startTime = Date.now()
        const render = () => {
            if (!canvas) return
            const displayWidth = canvas.clientWidth
            const displayHeight = canvas.clientHeight
            if (
                canvas.width !== displayWidth ||
                canvas.height !== displayHeight
            ) {
                canvas.width = displayWidth
                canvas.height = displayHeight
                gl.viewport(0, 0, canvas.width, canvas.height)
            }
            gl.useProgram(shaderProgram)
            gl.enableVertexAttribArray(positionLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
            gl.uniform1f(timeLocation, (Date.now() - startTime) * 0.001)
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            requestAnimationFrame(render)
        }
        render()
    }, [])
    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
        />
    )
}

/* Indicador de Scroll */
const ScrollDots = () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
            }}
        >
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                    }}
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#22d3ee",
                        boxShadow: "0 0 12px #22d3ee",
                    }}
                />
            ))}
        </div>
    )
}

/* Item del Dock */
const DockItem = ({ icon, label }) => {
    const [isHovered, setHovered] = React.useState(false)
    return (
        <motion.div
            style={{
                position: "relative",
                cursor: "pointer",
                width: "80px",
                height: "70px",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: isHovered ? "rgba(255,255,255,0.4)" : "transparent",
                transition: "background 0.3s ease",
            }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ y: -10, scale: 1.05 }}
        >
            <motion.div
                style={{
                    width: "24px",
                    height: "24px",
                    color: isHovered ? "#0891b2" : "#64748b",
                }}
                animate={{ color: isHovered ? "#0891b2" : "#64748b" }}
            >
                {icon}
            </motion.div>
            <span
                style={{
                    fontSize: "9px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#475569",
                }}
            >
                {label}
            </span>
            {isHovered && (
                <motion.div
                    layoutId="glow"
                    style={{
                        position: "absolute",
                        bottom: "-10px",
                        width: "20px",
                        height: "2px",
                        background: "#22d3ee",
                        borderRadius: "4px",
                        boxShadow: "0 0 10px #22d3ee",
                    }}
                />
            )}
        </motion.div>
    )
}

/* Bloques de la Galería */
const ImageBlock = ({ item, width, ratio, isInView }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
        }
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
            width: width,
            aspectRatio: ratio,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.1)",
            backgroundColor: "rgba(255,255,255,0.1)",
            position: "relative",
            border: "1px solid rgba(255,255,255,0.4)",
            zIndex: 20,
        }}
    >
        {item.image && (
            <motion.img
                src={item.image}
                alt="Gallery"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />
        )}
        <div
            style={{
                position: "absolute",
                inset: 0,
                background:
                    "linear-gradient(to top, rgba(15, 23, 42, 0.2) 0%, transparent 40%)",
                pointerEvents: "none",
            }}
        />
        {item.caption && (
            <div style={{ position: "absolute", bottom: 10, right: 10 }}>
                <span
                    style={{
                        fontSize: "9px",
                        fontFamily: "monospace",
                        color: "#fff",
                        textTransform: "uppercase",
                        background: "rgba(0,0,0,0.3)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    {item.caption}
                </span>
            </div>
        )}
    </motion.div>
)

const TextBlock = ({ item, align, isInView }) => (
    <motion.div
        initial={{ opacity: 0, x: align === "left" ? 20 : -20 }}
        animate={
            isInView
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: align === "left" ? 20 : -20 }
        }
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        style={{
            maxWidth: "350px",
            textAlign: align,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 20,
        }}
    >
        {item.description && (
            <p
                style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#475569",
                    margin: 0,
                    fontWeight: 400,
                }}
            >
                {item.description}
            </p>
        )}
    </motion.div>
)

const TimeStreamItem = ({ item, index, vWidth, hWidth }) => {
    const isEven = index % 2 === 0
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" })
    const imageWidthValue = item.isVertical ? vWidth : hWidth
    const imageWidth = `${imageWidthValue}px`
    const aspectRatio = item.isVertical ? "2 / 3" : "16 / 9"

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                position: "relative",
                padding: "60px 0",
            }}
        >
            {/* NODO CENTRAL (SPINE) Z-INDEX: 10 */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={
                    isInView
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0, opacity: 0 }
                }
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    border: "2px solid #22d3ee",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                    boxShadow: "0 0 15px rgba(34, 211, 238, 0.8)",
                }}
            />
            {/* IZQUIERDA */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingRight: "60px",
                }}
            >
                {!isEven ? (
                    <ImageBlock
                        item={item}
                        width={imageWidth}
                        ratio={aspectRatio}
                        isInView={isInView}
                    />
                ) : (
                    <TextBlock item={item} align="right" isInView={isInView} />
                )}
            </div>
            {/* DERECHA */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-start",
                    paddingLeft: "60px",
                }}
            >
                {isEven ? (
                    <ImageBlock
                        item={item}
                        width={imageWidth}
                        ratio={aspectRatio}
                        isInView={isInView}
                    />
                ) : (
                    <TextBlock item={item} align="left" isInView={isInView} />
                )}
            </div>
        </div>
    )
}

/* --- 3. COMPONENTE PRINCIPAL --- */
export default function MembranaLab(props) {
    const {
        showSpline = true,
        heroVideo,
        heroStaticImage,
        heroScale = 1.0,
        // NUEVA VARIABLE PARA OFFSET Y
        heroOffsetY = 0,

        showDock = true,
        splineUrl = "https://prod.spline.design/TkxzWFaGqAFkMOcK/scene.splinecode",
        splineUrl2,
        splineUrl3,
        headline = "MEMBRANA",
        headlineImage,
        headlineWidth = 350,
        headlineOffsetY = 0,
        logoImage,
        logoWidth = 60,
        logoGap = 30,
        subheadline = "Ingeniería de Campo Corporal",
        subheadlineOffsetY = 0,
        galleryItems = [],

        verticalImgWidth = 300,
        horizontalImgWidth = 500,
        scrollDotsPositionY = 250,

        style,
        className,
    } = props

    useEffect(() => {
        if (showSpline) {
            const scriptId = "spline-viewer-script"
            if (!document.getElementById(scriptId)) {
                const script = document.createElement("script")
                script.id = scriptId
                script.type = "module"
                script.src =
                    "https://unpkg.com/@splinetool/viewer@1.9.75/build/spline-viewer.js"
                document.head.appendChild(script)
            }
        }
    }, [showSpline])

    const [leftActive, setLeftActive] = useState(false)
    const [rightActive, setRightActive] = useState(false)
    const [currentIndex, setCurrentIndex] = React.useState(0)

    const splineUrls = [splineUrl, splineUrl2, splineUrl3].filter(
        (url) => typeof url === "string" && url.trim() !== ""
    )
    const safeIndex =
        splineUrls.length > 0 ? currentIndex % splineUrls.length : 0
    const currentSplineUrl =
        splineUrls.length > 0 ? splineUrls[safeIndex] : splineUrl

    const handleNext = useCallback(() => {
        if (splineUrls.length === 0) return
        setCurrentIndex((prev) => (prev + 1) % splineUrls.length)
    }, [splineUrls.length])

    const handlePrev = useCallback(() => {
        if (splineUrls.length === 0) return
        setCurrentIndex(
            (prev) => (prev - 1 + splineUrls.length) % splineUrls.length
        )
    }, [splineUrls.length])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return
            if (e.key === "ArrowLeft") {
                setLeftActive(true)
                handlePrev()
            } else if (e.key === "ArrowRight") {
                setRightActive(true)
                handleNext()
            }
        }
        const handleKeyUp = (e) => {
            if (e.key === "ArrowLeft") setLeftActive(false)
            else if (e.key === "ArrowRight") setRightActive(false)
        }
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
        }
    }, [handleNext, handlePrev])

    const floatingAnim = {
        animate: {
            y: [0, -15, 0],
            transition: { duration: 6, ease: "easeInOut", repeat: Infinity },
        },
    }

    return (
        <div style={style} className={className}>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowX: "hidden",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    fontFamily: '"Inter", sans-serif, system-ui',
                }}
            >
                {/* FONDO */}
                <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
                    <CrystallineBackground />
                </div>

                {/* HERO */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        width: "100%",
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "40px",
                    }}
                >
                    {/* Header */}
                    <motion.div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            textAlign: "center",
                            marginTop: "6vh",
                            width: "100%",
                            padding: "0 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <div
                            style={{
                                position: "relative",
                                top: `${headlineOffsetY}px`,
                            }}
                        >
                            <motion.div
                                variants={floatingAnim}
                                animate="animate"
                                style={{
                                    position: "relative",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {headlineImage ? (
                                    <img
                                        src={headlineImage}
                                        alt={headline}
                                        style={{
                                            width: `${headlineWidth}px`,
                                            height: "auto",
                                            objectFit: "contain",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <h1
                                        style={{
                                            fontSize: "clamp(40px, 8vw, 120px)",
                                            fontWeight: 200,
                                            letterSpacing: "-0.03em",
                                            color: "#0f172a",
                                            margin: 0,
                                            lineHeight: 0.9,
                                            textShadow:
                                                "0 0 40px rgba(255,255,255,0.8)",
                                        }}
                                    >
                                        {headline}
                                    </h1>
                                )}
                                {logoImage && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "100%",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            marginLeft: `${logoGap}px`,
                                            width: `${logoWidth}px`,
                                            height: "auto",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <img
                                            src={logoImage}
                                            alt="Logo"
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                objectFit: "contain",
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </div>
                        <motion.div
                            style={{
                                position: "relative",
                                top: `${subheadlineOffsetY}px`,
                                marginTop: "20px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.6em",
                                    color: "#64748b",
                                    margin: 0,
                                    fontFamily: "monospace",
                                    display: "block",
                                }}
                            >
                                {renderSubheadline(subheadline)}
                            </h3>
                        </motion.div>
                    </motion.div>

                    {/* Visual Central (Spline/Video) */}
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            position: "relative",
                            zIndex: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "400px",
                            padding: "20px 0",
                        }}
                    >
                        {/* Contenedor con Escala y Posición Y Independiente */}
                        <div
                            style={{
                                width: "100%",
                                height: "60vh",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: `scale(${heroScale})`, // Solo escala
                                position: "relative",
                                top: `${heroOffsetY}px`, // Posición Y independiente
                                transition: "transform 0.5s ease",
                            }}
                        >
                            {showSpline ? (
                                <div
                                    key={currentSplineUrl}
                                    style={{ width: "100%", height: "100%" }}
                                >
                                    {/* @ts-ignore */}
                                    <spline-viewer
                                        url={currentSplineUrl}
                                        width="100%"
                                        height="100%"
                                    ></spline-viewer>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {heroVideo ? (
                                        <video
                                            src={heroVideo}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 0 30px rgba(165, 243, 252, 0.6))",
                                            }}
                                        />
                                    ) : heroStaticImage ? (
                                        <img
                                            src={heroStaticImage}
                                            alt="Hero"
                                            style={{
                                                maxWidth: "90%",
                                                maxHeight: "100%",
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontFamily: "monospace",
                                                border: "1px dashed #cbd5e1",
                                                padding: "20px",
                                                borderRadius: "8px",
                                            }}
                                        >
                                            [CARGAR VIDEO O IMAGEN]
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scroll Dots (Posición absoluta independiente) */}
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 25,
                            left: "50%",
                            top: "50%",
                            transform: `translate(-50%, -50%) translateY(${scrollDotsPositionY}px)`,
                            pointerEvents: "none",
                        }}
                    >
                        <ScrollDots />
                    </div>

                    {/* Dock */}
                    {showDock && (
                        <motion.div
                            style={{ zIndex: 30, marginTop: "0" }}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                delay: 0.8,
                                type: "spring",
                                stiffness: 100,
                                damping: 20,
                            }}
                        >
                            <motion.div
                                style={{
                                    padding: "10px",
                                    borderRadius: "24px",
                                    background: "rgba(255,255,255,0.2)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.4)",
                                    boxShadow:
                                        "0 20px 40px -10px rgba(165, 243, 252, 0.2), inset 0 0 0 1px rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                                variants={floatingAnim}
                                animate="animate"
                            >
                                <motion.button
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "16px",
                                        border: "none",
                                        cursor: "pointer",
                                        background:
                                            "linear-gradient(135deg, #fff 0%, #f1f5f9 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#475569",
                                        outline: "none",
                                    }}
                                    animate={{
                                        scale: leftActive ? 0.95 : 1,
                                        boxShadow: leftActive
                                            ? "0 0 0 2px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.5)"
                                            : "0 4px 12px rgba(0,0,0,0.05), inset 0 2px 0 rgba(255,255,255,1)",
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow:
                                            "0 8px 20px rgba(34, 211, 238, 0.3)",
                                    }}
                                    onClick={handlePrev}
                                >
                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                        }}
                                    >
                                        <Icons.ArrowLeft />
                                    </div>
                                </motion.button>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        flex: 1,
                                        justifyContent: "center",
                                    }}
                                >
                                    <DockItem
                                        icon={<Icons.Activity />}
                                        label="Frecuencia"
                                    />
                                    <DockItem
                                        icon={<Icons.Fingerprint />}
                                        label="Biometría"
                                    />
                                    <DockItem
                                        icon={<Icons.Zap />}
                                        label="Sincronía"
                                    />
                                    <div
                                        style={{
                                            width: "1px",
                                            height: "24px",
                                            background:
                                                "linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)",
                                            margin: "0 4px",
                                        }}
                                    />
                                </div>
                                <motion.button
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "16px",
                                        border: "none",
                                        cursor: "pointer",
                                        background:
                                            "linear-gradient(135deg, #fff 0%, #f1f5f9 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#475569",
                                        outline: "none",
                                    }}
                                    animate={{
                                        scale: rightActive ? 0.95 : 1,
                                        boxShadow: rightActive
                                            ? "0 0 0 2px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.5)"
                                            : "0 4px 12px rgba(0,0,0,0.05), inset 0 2px 0 rgba(255,255,255,1)",
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow:
                                            "0 8px 20px rgba(34, 211, 238, 0.3)",
                                    }}
                                    onClick={handleNext}
                                >
                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                        }}
                                    >
                                        <Icons.ArrowRight />
                                    </div>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </div>

                {/* GALERÍA */}
                {galleryItems && galleryItems.length > 0 ? (
                    <div
                        style={{
                            width: "100%",
                            position: "relative",
                            zIndex: 15,
                            paddingBottom: "100px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: "transparent",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "150px",
                                background:
                                    "linear-gradient(to bottom, transparent, rgba(241, 245, 249, 0.5))",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: "50%",
                                width: "2px",
                                background:
                                    "linear-gradient(to bottom, transparent 0%, rgba(34, 211, 238, 0.3) 20%, rgba(34, 211, 238, 0.3) 80%, transparent 100%)",
                                transform: "translateX(-50%)",
                                zIndex: 1,
                            }}
                        />
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "1200px",
                                position: "relative",
                                zIndex: 2,
                                display: "flex",
                                flexDirection: "column",
                                gap: "0px",
                            }}
                        >
                            {galleryItems.map((item, index) => (
                                <TimeStreamItem
                                    key={index}
                                    item={item}
                                    index={index}
                                    vWidth={verticalImgWidth}
                                    hWidth={horizontalImgWidth}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: "50px",
                            opacity: 0.5,
                            fontSize: "10px",
                            color: "#64748b",
                        }}
                    >
                        (Galería vacía - Añade items en la UI)
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(MembranaLab, {
    // HEADER
    headline: {
        type: ControlType.String,
        title: "Título Texto",
        defaultValue: "MEMBRANA",
    },
    headlineImage: { type: ControlType.Image, title: "Título (PNG)" },
    headlineWidth: {
        type: ControlType.Number,
        title: "Ancho Título",
        defaultValue: 350,
        min: 50,
        max: 800,
    },
    headlineOffsetY: {
        type: ControlType.Number,
        title: "Pos Y Título",
        defaultValue: 0,
        min: -300,
        max: 300,
    },

    // LOGO
    logoImage: { type: ControlType.Image, title: "Logo Lateral" },
    logoWidth: {
        type: ControlType.Number,
        title: "Ancho Logo",
        defaultValue: 60,
        min: 10,
        max: 300,
    },
    logoGap: {
        type: ControlType.Number,
        title: "Gap Título-Logo",
        defaultValue: 30,
        min: -200,
        max: 200,
    },

    // SUBTÍTULO
    subheadline: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Ingeniería de Campo Corporal",
    },
    subheadlineOffsetY: {
        type: ControlType.Number,
        title: "Pos Y Subtítulo",
        defaultValue: 0,
        min: -300,
        max: 300,
    },

    // VISUAL HERO
    showSpline: {
        type: ControlType.Boolean,
        title: "Mostrar 3D (Spline)",
        defaultValue: true,
    },
    heroVideo: {
        type: ControlType.File,
        title: "Video Hero (MP4)",
        allowedFileTypes: ["mp4"],
        hidden: (props) => props.showSpline === true,
    },
    heroStaticImage: {
        type: ControlType.Image,
        title: "Fallback Imagen",
        hidden: (props) => props.showSpline === true || props.heroVideo,
    },
    heroScale: {
        type: ControlType.Number,
        title: "Escala Visual",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
        displayStepper: true,
    },
    // NUEVA VARIABLE: POSICION Y DEL VIDEO/SPLINE
    heroOffsetY: {
        type: ControlType.Number,
        title: "Pos Y Video/3D",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 5,
        displayStepper: true,
    },

    showDock: {
        type: ControlType.Boolean,
        title: "Mostrar Dock",
        defaultValue: true,
    },

    // SCROLL DOTS
    scrollDotsPositionY: {
        type: ControlType.Number,
        title: "Pos Y Puntos",
        defaultValue: 250,
        min: -500,
        max: 800,
    },

    // SPLINE URLS
    splineUrl: {
        type: ControlType.String,
        title: "Spline 1 URL",
        hidden: (props) => props.showSpline === false,
    },
    splineUrl2: {
        type: ControlType.String,
        title: "Spline 2 URL",
        hidden: (props) => props.showSpline === false,
    },
    splineUrl3: {
        type: ControlType.String,
        title: "Spline 3 URL",
        hidden: (props) => props.showSpline === false,
    },

    // GALERÍA
    verticalImgWidth: {
        type: ControlType.Number,
        title: "Ancho Img Vertical",
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 10,
    },
    horizontalImgWidth: {
        type: ControlType.Number,
        title: "Ancho Img Horizontal",
        defaultValue: 500,
        min: 200,
        max: 1000,
        step: 10,
    },

    galleryItems: {
        type: ControlType.Array,
        title: "Galería Temporal",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Imagen" },
                isVertical: { type: ControlType.Boolean, title: "¿Vertical?" },
                caption: { type: ControlType.String, title: "Etiqueta (Img)" },
                description: {
                    type: ControlType.String,
                    title: "Texto Lateral",
                    displayTextArea: true,
                },
            },
        },
    },
})
