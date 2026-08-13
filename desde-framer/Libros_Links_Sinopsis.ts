// Libros_Links_Sinopsis.ts
export type PhysicalLink = { label: string; href: string }

export interface LibroEntry {
    id: string
    title: string
    author: string // "Zak´Haar" | "Aqua´Riia" | otro
    synopsis: string
    digitalLink?: string
    physicalLinks: PhysicalLink[]
    // Opcionales (fallbacks si no se suben via UI/Framer)
    coverUrl?: string
    pdfUrl?: string
    // Decorativos
    colorHex?: string
    previewStyle?: string
    previewPages?: number
}

const libros: LibroEntry[] = [
    {
        id: "1",
        title: "Manual Solar: Despierta tus Habilidades Cuánticas",
        author: "Zak´Haar",
        synopsis:
            "Escribe aquí la sinopsis sdfsdfgsdfgdel libro #1. Puedes usar \\n para saltos de línea si te resulta cómodo en el editor.",
        digitalLink: "", // ← link de compra digital (Stripe, etc.)
        physicalLinks: [
            { label: "Amazon ES", href: "" },
            { label: "Amazon MX", href: "" },
            { label: "Amazon US", href: "" },
            { label: "Amazon DE", href: "" },
        ],
        // Fallbacks opcionales (si NO subes portada/PDF desde Framer)
        coverUrl: "", // opcional
        pdfUrl: "", // opcional
        // Decorativos
        colorHex: "#00FFCC",
        previewStyle: "#00C2FF",
        previewPages: 9,
    },
    {
        id: "2",
        title: "Manual del Nodo Solar Encarnado",
        author: "Zak´Haar",
        synopsis: "Sinopsis del libro #2...",
        digitalLink: "",
        physicalLinks: [
            { label: "Amazon ES", href: "" },
            { label: "Amazon MX", href: "" },
            { label: "Amazon US", href: "" },
            { label: "Amazon DE", href: "" },
        ],
        coverUrl: "",
        pdfUrl: "",
        colorHex: "#FF00CC",
        previewStyle: "#00FF00",
        previewPages: 8,
    },
    {
        id: "3",
        title: "El Agua que Recuerda",
        author: "Aqua´Riia",
        synopsis: "Sinopsis del libro #3...",
        digitalLink: "",
        physicalLinks: [
            { label: "Amazon ES", href: "" },
            { label: "Amazon MX", href: "" },
            { label: "Amazon US", href: "" },
            { label: "Amazon DE", href: "" },
        ],
        coverUrl: "",
        pdfUrl: "",
        colorHex: "#CC00FF",
        previewStyle: "#00C2FF",
        previewPages: 8,
    },
    {
        id: "4",
        title: "Tecnología del Espíritu",
        author: "Zak´Haar",
        synopsis: "Sinopsis del libro #4...",
        digitalLink: "",
        physicalLinks: [
            { label: "Amazon ES", href: "" },
            { label: "Amazon MX", href: "" },
            { label: "Amazon US", href: "" },
            { label: "Amazon DE", href: "" },
        ],
        coverUrl: "",
        pdfUrl: "",
        colorHex: "#FFCC00",
        previewStyle: "#00FF00",
        previewPages: 7,
    },
]

export default libros
