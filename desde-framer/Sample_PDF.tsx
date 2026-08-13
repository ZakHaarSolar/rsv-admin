import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// Normaliza enlaces comunes
function normalizeUrl(u) {
    if (!u) return ""
    const url = u.trim()

    // MediaFire: bloquea embed → no recomendable
    if (/mediafire\.com/i.test(url)) return "MEDIAFIRE_BLOCKED"

    // Google Drive /file/d/FILE_ID/...
    if (/drive\.google\.com\/file\/d\//i.test(url)) {
        const m = url.match(/\/file\/d\/([^/]+)/i)
        if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`
    }

    // Google Drive uc?id=FILE_ID
    if (/drive\.google\.com\/uc\?id=/i.test(url)) {
        const m = url.match(/[?&]id=([^&]+)/i)
        if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`
    }

    // Dropbox share → raw
    if (/dropbox\.com\/s\//i.test(url)) {
        return url
            .replace("www.dropbox.com", "dl.dropboxusercontent.com")
            .replace("dl=0", "raw=1")
    }

    return url
}

function buildSrc(url, viewer, fit) {
    const enc = encodeURIComponent(url)
    if (viewer === "PDF.js") {
        const zoom = fit === "Page Width" ? "page-width" : "page-fit"
        return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${enc}#zoom=${zoom}`
    }
    // Raw (solo si tu host permite inline)
    if (viewer === "Raw") {
        // Sugerimos intento de ajuste para visores nativos
        const hash = fit === "Page Width" ? "#view=FitH" : "#view=FitV"
        return `${url}${url.includes("#") ? "" : hash}`
    }
    // Drive Preview (el zoom lo maneja Google)
    return url
}

export default function PDFPreview({
    url,
    viewer,
    fit,
    useViewportHeight,
    heightPx,
    heightVh,
    radius,
    showOpenLink,
}) {
    const norm = normalizeUrl(url)
    const height = useViewportHeight ? `${heightVh}vh` : `${heightPx}px`

    if (!url) {
        return (
            <Box height={height}>
                Inserta un PDF URL público (Drive/Dropbox)
            </Box>
        )
    }
    if (norm === "MEDIAFIRE_BLOCKED") {
        return (
            <Box height={height}>
                MediaFire fuerza descarga y bloquea el embed.
                <br />
                Súbelo a Google Drive (usa “/preview”) o Dropbox (raw) y pega
                ese enlace.
            </Box>
        )
    }

    const src = buildSrc(norm, viewer, fit)

    return (
        <div style={{ width: "100%" }}>
            <iframe
                src={src}
                width="100%"
                height={height}
                style={{ border: "none", borderRadius: radius }}
                allow="fullscreen"
            />
            {showOpenLink && (
                <div style={{ marginTop: 8, textAlign: "right" }}>
                    <a href={norm} target="_blank" rel="noreferrer">
                        Abrir en nueva pestaña ↗
                    </a>
                </div>
            )}
        </div>
    )
}

function Box({ height, children }) {
    return (
        <div
            style={{
                height,
                border: "1px dashed #ccc",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                padding: 16,
                textAlign: "center",
            }}
        >
            {children}
        </div>
    )
}

addPropertyControls(PDFPreview, {
    url: { type: ControlType.String, title: "PDF URL" },
    viewer: {
        type: ControlType.Enum,
        title: "Viewer",
        options: ["PDF.js", "Drive", "Raw"],
        optionTitles: [
            "PDF.js (recomendado)",
            "Google Drive",
            "Directo (si permite)",
        ],
        defaultValue: "PDF.js",
    },
    fit: {
        type: ControlType.Enum,
        title: "Ajuste",
        options: ["Page Width", "Page Fit"],
        optionTitles: ["A lo ancho", "Página completa"],
        defaultValue: "Page Width",
    },
    useViewportHeight: {
        type: ControlType.Boolean,
        title: "Altura en vh",
        defaultValue: true,
    },
    heightVh: {
        type: ControlType.Number,
        title: "vh",
        defaultValue: 80,
        min: 40,
        max: 100,
        hidden: (p) => !p.useViewportHeight,
    },
    heightPx: {
        type: ControlType.Number,
        title: "px",
        defaultValue: 800,
        min: 300,
        max: 2000,
        hidden: (p) => p.useViewportHeight,
    },
    radius: {
        type: ControlType.Number,
        title: "Borde",
        defaultValue: 16,
        min: 0,
        max: 32,
    },
    showOpenLink: {
        type: ControlType.Boolean,
        title: "Link externo",
        defaultValue: true,
    },
})
