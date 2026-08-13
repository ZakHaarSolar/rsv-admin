// HomePage.tsx
import * as React from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// ——— Helpers
const Section: React.FC<{
    id?: string
    style?: React.CSSProperties
    children: React.ReactNode
}> = ({ id, style, children }) => (
    <section
        id={id}
        style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "64px 24px",
            ...style,
        }}
    >
        {children}
    </section>
)

// ——— Main component
export default function HomePage(props: {
    siteTitle?: string
    logoText?: string

    // Hero
    heroTitle?: string
    heroSubtitle?: string
    ctaLabel?: string
    ctaLink?: string

    // Features
    feature1Title?: string
    feature1Desc?: string
    feature2Title?: string
    feature2Desc?: string
    feature3Title?: string
    feature3Desc?: string

    // Gallery (3 imgs)
    galleryImg1?: string
    galleryImg2?: string
    galleryImg3?: string

    // Testimonials (2)
    testimonial1?: string
    author1?: string
    testimonial2?: string
    author2?: string

    // Theme
    accent?: string
    darkBg?: string
    lightBg?: string
    textColor?: string
}) {
    const {
        siteTitle = "Red Solar Viva",
        logoText = "RSV",

        heroTitle = "Emerge desde el Núcleo Solar",
        heroSubtitle = "Una home vibral, estética y rápida — lista para editar en Framer.",
        ctaLabel = "Activar Nodo",
        ctaLink = "#cta",

        feature1Title = "Animaciones fluidas",
        feature1Desc = "Micro-interacciones con framer-motion, sin dependencias extras.",
        feature2Title = "Edita desde Framer",
        feature2Desc = "Todos los textos/links se exponen como props en el UI.",
        feature3Title = "Listo para SEO",
        feature3Desc = "Estructura semántica y secciones claras.",

        galleryImg1 = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
        galleryImg2 = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200",
        galleryImg3 = "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200",

        testimonial1 = "“Este portal sostiene el pulso cada semana.”",
        author1 = "Teresa V.",
        testimonial2 = "“La estética y la vibración son impecables.”",
        author2 = "Aqua’Riia",

        accent = "#F59E0B", // ámbar
        darkBg = "#0B0B0C",
        lightBg = "#0F0F12",
        textColor = "#EDEDED",
    } = props

    const navStyle: React.CSSProperties = {
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10,10,12,0.7)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
    }

    const grid3: React.CSSProperties = {
        display: "grid",
        gap: 24,
        gridTemplateColumns: "1fr",
    }
    // Responsive grid
    // Framer renderiza en un iframe; este CSS inline es suficiente y portable.
    // Para 960px+ cambiamos a 3 columnas:
    // Nota: no usamos Tailwind para máxima compatibilidad.
    React.useEffect(() => {
        const style = document.createElement("style")
        style.innerHTML = `
      @media (min-width: 960px) {
        .grid-3 { display: grid; gap: 24px; grid-template-columns: repeat(3, 1fr); }
        .grid-2 { display: grid; gap: 24px; grid-template-columns: repeat(2, 1fr); }
      }
      .card {
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 24px;
        background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
      }
      .imgwrap {
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .button {
        display:inline-block; padding:14px 20px; border-radius:14px; font-weight:600;
        text-decoration:none; border:1px solid rgba(255,255,255,0.15);
      }
    `
        document.head.appendChild(style)
        return () => {
            document.head.removeChild(style)
        }
    }, [])

    return (
        <div
            style={{
                background: `linear-gradient(180deg, ${darkBg}, ${lightBg})`,
                color: textColor,
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            {/* ——— Navbar */}
            <div style={navStyle}>
                <Section style={{ padding: "16px 24px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    background: accent,
                                    color: "#111",
                                    display: "grid",
                                    placeItems: "center",
                                    fontWeight: 800,
                                }}
                            >
                                {logoText}
                            </div>
                            <strong>{siteTitle}</strong>
                        </div>
                        <nav style={{ display: "flex", gap: 16, opacity: 0.9 }}>
                            <a href="#features" style={{ color: textColor }}>
                                Features
                            </a>
                            <a href="#gallery" style={{ color: textColor }}>
                                Galería
                            </a>
                            <a
                                href="#testimonials"
                                style={{ color: textColor }}
                            >
                                Reseñas
                            </a>
                            <a href="#cta" style={{ color: textColor }}>
                                CTA
                            </a>
                        </nav>
                    </div>
                </Section>
            </div>

            {/* ——— Hero */}
            <Section style={{ textAlign: "center", paddingTop: 96 }}>
                <motion.h1
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 12 }}
                >
                    {heroTitle}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    style={{
                        opacity: 0.85,
                        maxWidth: 760,
                        margin: "0 auto 28px",
                    }}
                >
                    {heroSubtitle}
                </motion.p>
                <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    href={ctaLink}
                    className="button"
                    style={{ background: accent, color: "#111" }}
                >
                    {ctaLabel}
                </motion.a>
            </Section>

            {/* ——— Features */}
            <Section id="features">
                <h2 style={{ fontSize: 28, marginBottom: 24 }}>Features</h2>
                <div className="grid-3" style={grid3}>
                    {[
                        { t: feature1Title, d: feature1Desc },
                        { t: feature2Title, d: feature2Desc },
                        { t: feature3Title, d: feature3Desc },
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            className="card"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                {f.t}
                            </div>
                            <div style={{ opacity: 0.85 }}>{f.d}</div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* ——— Gallery */}
            <Section id="gallery">
                <h2 style={{ fontSize: 28, marginBottom: 24 }}>Galería</h2>
                <div className="grid-3" style={grid3}>
                    {[galleryImg1, galleryImg2, galleryImg3].map((src, i) => (
                        <motion.div
                            key={i}
                            className="imgwrap"
                            whileHover={{ scale: 1.01 }}
                        >
                            <img
                                src={src}
                                alt={`gallery-${i + 1}`}
                                style={{
                                    width: "100%",
                                    height: 280,
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* ——— Testimonials */}
            <Section id="testimonials">
                <h2 style={{ fontSize: 28, marginBottom: 24 }}>Reseñas</h2>
                <div
                    className="grid-2"
                    style={{
                        display: "grid",
                        gap: 24,
                        gridTemplateColumns: "1fr",
                    }}
                >
                    {[
                        { q: testimonial1, a: author1 },
                        { q: testimonial2, a: author2 },
                    ].map((t, i) => (
                        <motion.div
                            key={i}
                            className="card"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <p style={{ fontSize: 18, marginBottom: 8 }}>
                                {t.q}
                            </p>
                            <div style={{ opacity: 0.75 }}>— {t.a}</div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* ——— CTA */}
            <Section id="cta" style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 32, marginBottom: 12 }}>
                    ¿Listos para activar el Nodo?
                </h2>
                <p style={{ opacity: 0.85, marginBottom: 16 }}>
                    Integra Stripe, Zapier o tu CMS sin romper el flujo.
                </p>
                <a
                    className="button"
                    href={ctaLink}
                    style={{ background: accent, color: "#111" }}
                >
                    {ctaLabel}
                </a>
            </Section>

            {/* ——— Footer */}
            <footer
                style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    padding: "28px 24px",
                    textAlign: "center",
                    opacity: 0.7,
                }}
            >
                © {new Date().getFullYear()} {siteTitle}. Todos los derechos
                reservados.
            </footer>
        </div>
    )
}

// ——— Property controls para editar desde Framer
addPropertyControls(HomePage, {
    siteTitle: { type: ControlType.String, title: "Site Title" },
    logoText: { type: ControlType.String, title: "Logo Text" },

    heroTitle: { type: ControlType.String, title: "Hero Title" },
    heroSubtitle: { type: ControlType.String, title: "Hero Subtitle" },
    ctaLabel: { type: ControlType.String, title: "CTA Label" },
    ctaLink: { type: ControlType.String, title: "CTA Link" },

    feature1Title: { type: ControlType.String, title: "Feature 1 Title" },
    feature1Desc: { type: ControlType.String, title: "Feature 1 Desc" },
    feature2Title: { type: ControlType.String, title: "Feature 2 Title" },
    feature2Desc: { type: ControlType.String, title: "Feature 2 Desc" },
    feature3Title: { type: ControlType.String, title: "Feature 3 Title" },
    feature3Desc: { type: ControlType.String, title: "Feature 3 Desc" },

    galleryImg1: { type: ControlType.Image, title: "Gallery Img 1" },
    galleryImg2: { type: ControlType.Image, title: "Gallery Img 2" },
    galleryImg3: { type: ControlType.Image, title: "Gallery Img 3" },

    testimonial1: { type: ControlType.String, title: "Testimonial 1" },
    author1: { type: ControlType.String, title: "Author 1" },
    testimonial2: { type: ControlType.String, title: "Testimonial 2" },
    author2: { type: ControlType.String, title: "Author 2" },

    accent: { type: ControlType.Color, title: "Accent" },
    darkBg: { type: ControlType.Color, title: "Dark BG" },
    lightBg: { type: ControlType.Color, title: "Light BG" },
    textColor: { type: ControlType.Color, title: "Text" },
})
