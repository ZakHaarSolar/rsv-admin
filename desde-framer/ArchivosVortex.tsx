import * as React from "react"
import { useState, useRef, useMemo } from "react"
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useSpring,
} from "framer-motion"
import { ControlType, addPropertyControls } from "framer"

/* =========================================================================================
   ESTILOS CSS GLOBAL
========================================================================================= */
const GLOBAL_CSS = String.raw`
/* Contenedor de estrellas de fondo */
.holo-bg-fixed {
    position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0;
    pointer-events: none; background: radial-gradient(circle at center, #090a10 0%, #000000 100%);
}
.star-particle {
    position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%;
    box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.8);
    animation: warp-speed var(--duration) linear infinite;
    opacity: 0;
}
@keyframes warp-speed {
    0% { transform: translate3d(var(--x), var(--y), -1000px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translate3d(var(--x), var(--y), 100px); opacity: 0; }
}
/* Scrollbar estilizadp */
.scroll-viewport::-webkit-scrollbar { width: 8px; }
.scroll-viewport::-webkit-scrollbar-track { background: #000; }
.scroll-viewport::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
`

const hexToRgba = (hex: string, a = 1) => {
    if (!hex) return `rgba(0,0,0,${a})`
    const clean = hex.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const num = parseInt(full, 16)
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
}

/* =========================================================================================
   COMPONENTES
========================================================================================= */

const WarpField = React.memo(({ speed = 1 }) => {
    const stars = useMemo(
        () =>
            Array.from({ length: 80 }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 200 + "vw",
                y: (Math.random() - 0.5) * 200 + "vh",
                dur: (Math.random() * 3 + 2) / speed + "s",
            })),
        [speed]
    )
    return (
        <div className="holo-bg-fixed">
            {stars.map((s) => (
                <div
                    key={s.id}
                    className="star-particle"
                    style={
                        {
                            left: "50%",
                            top: "50%",
                            "--x": s.x,
                            "--y": s.y,
                            "--duration": s.dur,
                        } as any
                    }
                />
            ))}
        </div>
    )
})

const HeroCard = ({ title, icon, color, onClick }: any) => (
    <motion.div
        onClick={onClick}
        whileHover={{
            scale: 1.05,
            y: -10,
            boxShadow: `0 0 50px ${hexToRgba(color, 0.2)}`,
        }}
        whileTap={{ scale: 0.95 }}
        style={{
            width: "min(30vw, 280px)",
            height: "min(40vh, 400px)",
            borderRadius: "24px",
            background: `linear-gradient(170deg, ${hexToRgba(color, 0.05)} 0%, rgba(0,0,0,0.8) 100%)`,
            border: `1px solid ${hexToRgba(color, 0.3)}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
        }}
    >
        <div style={{ fontSize: "3.5rem", marginBottom: 20 }}>{icon}</div>
        <h2 style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 200 }}>
            {title}
        </h2>
        <motion.div
            style={{
                position: "absolute",
                bottom: 0,
                height: 2,
                width: "100%",
                background: color,
            }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    </motion.div>
)

const BookMonolith = ({ book, index, onOpen, containerRef }: any) => {
    const isEven = index % 2 === 0
    const ref = useRef(null)

    // Conectamos el scroll al contenedor específico
    const { scrollYProgress } = useScroll({
        target: ref,
        container: containerRef, // <--- CLAVE PARA QUE FUNCIONE EL SCROLL
        offset: ["start end", "end start"],
    })

    const y = useTransform(scrollYProgress, [0, 1], [100, -100])
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.2, 0.8, 1],
        [0, 1, 1, 0]
    )

    return (
        <motion.div
            ref={ref}
            style={{
                minHeight: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: isEven ? "row" : "row-reverse",
                    width: "100%",
                    maxWidth: "1200px",
                    gap: "5vw",
                    padding: "20px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <motion.div style={{ flex: "0 0 350px", y }}>
                    <div
                        onClick={() => onOpen(book)}
                        style={{
                            cursor: "pointer",
                            borderRadius: "16px",
                            border: `1px solid ${hexToRgba(book.color, 0.4)}`,
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={book.cover}
                            alt={book.title}
                            style={{ width: "100%", display: "block" }}
                        />
                    </div>
                </motion.div>
                <div
                    style={{
                        flex: 1,
                        minWidth: "300px",
                        textAlign: isEven ? "left" : "right",
                        color: "#fff",
                    }}
                >
                    <h3 style={{ color: book.color, letterSpacing: "0.2em" }}>
                        {book.author}
                    </h3>
                    <h1 style={{ fontSize: "3.5rem", fontWeight: 200 }}>
                        {book.title}
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "#ccc" }}>
                        {book.synopsis}
                    </p>
                    <motion.button
                        onClick={() => onOpen(book)}
                        whileHover={{ scale: 1.05 }}
                        style={{
                            padding: "12px 24px",
                            borderRadius: "50px",
                            background: "rgba(255,255,255,0.1)",
                            border: `1px solid ${book.color}`,
                            color: "#fff",
                            cursor: "pointer",
                            marginTop: 20,
                        }}
                    >
                        Abrir Consola
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}

const ConsoleModal = ({ book, onClose }: any) => (
    <div
        onClick={onClose}
        style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <div
            style={{
                width: "90%",
                maxWidth: "1000px",
                height: "80vh",
                background: "#111",
                border: `1px solid ${book.color}`,
                padding: 40,
                overflowY: "auto",
            }}
        >
            <h1 style={{ color: "#fff" }}>{book.title}</h1>
            <p style={{ color: "#ccc" }}>{book.synopsis}</p>
            <button
                onClick={onClose}
                style={{
                    marginTop: 20,
                    padding: "10px 20px",
                    background: "#333",
                    color: "white",
                    border: "none",
                }}
            >
                Cerrar
            </button>
        </div>
    </div>
)

/* =========================================================================================
   COMPONENTE PRINCIPAL
========================================================================================= */

export default function ArchivoVortex(props: any) {
    React.useLayoutEffect(() => {
        if (!document.getElementById("vortex-css")) {
            const s = document.createElement("style")
            s.id = "vortex-css"
            s.textContent = GLOBAL_CSS
            document.head.appendChild(s)
        }
    }, [])

    const { accentColor, books, faqs } = props
    const [activeBook, setActiveBook] = useState(null)
    const containerRef = useRef(null)

    const scrollToArchive = () => {
        const target = document.getElementById("the-archive")
        if (target) target.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background: "#050505",
                overflow: "hidden",
            }}
        >
            <WarpField speed={0.8} />

            {/* ESTE DIV MANEJA EL SCROLL */}
            <div
                ref={containerRef}
                className="scroll-viewport"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    scrollBehavior: "smooth",
                }}
            >
                <section
                    style={{
                        height: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "5rem",
                            color: "#fff",
                            fontWeight: 100,
                            textShadow: `0 0 50px ${accentColor}`,
                        }}
                    >
                        ARCHIVOS
                    </h1>
                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            marginTop: "40px",
                        }}
                    >
                        <HeroCard
                            title="Zak´Haar"
                            icon="☀"
                            color="#00FFCC"
                            onClick={scrollToArchive}
                        />
                        <HeroCard
                            title="Aqua´Riia"
                            icon="💧"
                            color="#00C2FF"
                            onClick={scrollToArchive}
                        />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 40,
                            color: "#fff",
                            cursor: "pointer",
                        }}
                        onClick={scrollToArchive}
                    >
                        Descender ↓
                    </div>
                </section>

                <div id="the-archive" style={{ paddingBottom: 100 }}>
                    {books.map((book: any, i: number) => (
                        <BookMonolith
                            key={i}
                            index={i}
                            book={book}
                            onOpen={setActiveBook}
                            containerRef={containerRef}
                        />
                    ))}
                </div>

                <section
                    style={{
                        maxWidth: "800px",
                        margin: "0 auto 100px",
                        color: "#fff",
                    }}
                >
                    <h2 style={{ textAlign: "center", color: accentColor }}>
                        FAQ
                    </h2>
                    {faqs.map((f, i) => (
                        <div
                            key={i}
                            style={{
                                padding: 20,
                                borderBottom: "1px solid #333",
                            }}
                        >
                            <strong>{f.q}</strong>
                            <br />
                            <span style={{ color: "#888" }}>{f.a}</span>
                        </div>
                    ))}
                </section>
            </div>

            {activeBook && (
                <ConsoleModal
                    book={activeBook}
                    onClose={() => setActiveBook(null)}
                />
            )}
        </div>
    )
}

addPropertyControls(ArchivoVortex, {
    accentColor: { type: ControlType.Color, defaultValue: "#00C2FF" },
    books: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, defaultValue: "Titulo" },
                author: { type: ControlType.String, defaultValue: "Autor" },
                color: { type: ControlType.Color, defaultValue: "#00C2FF" },
                cover: { type: ControlType.Image },
                synopsis: { type: ControlType.String },
                physical: { type: ControlType.String },
                digital: { type: ControlType.String },
                pdf: { type: ControlType.File },
            },
        },
        defaultValue: [
            {
                title: "Manual Solar",
                author: "Zak",
                color: "#00FFCC",
                synopsis: "...",
            },
        ],
    },
    faqs: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                q: { type: ControlType.String },
                a: { type: ControlType.String },
            },
        },
        defaultValue: [{ q: "?", a: "..." }],
    },
})
