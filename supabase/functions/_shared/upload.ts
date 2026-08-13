// Red Solar Viva · _shared/upload.ts v1.0 — validador de subidas a R2
// =============================================================================
// AUDITORÍA · PARTE 3. Cierra dos huecos que compartían las 18 edges de subida:
//
//   1) NINGUNA leía los bytes del archivo. Todas confiaban en el `image_mime`
//      que declara el cliente y se lo re-enviaban a R2 como header Content-Type.
//      Como el bucket es PÚBLICO (pub-*.r2.dev), una cuenta gratis podía subir
//      HTML/JS/SVG declarándolo "image/png" y quedarse con una URL bajo nuestro
//      dominio sirviendo su contenido. Ahora el tipo se deduce de los PRIMEROS
//      BYTES y lo declarado se ignora.
//
//   2) 15 de 18 no limitaban el tamaño, y las 3 que sí lo hacían decodificaban
//      el base64 ENTERO antes de medirlo — el pico de memoria ya había ocurrido.
//      Aquí el tamaño se estima desde la longitud del base64 y se corta ANTES
//      de decodificar.
//
// Uso (reemplaza a base64ToUint8 + extForMime + el chequeo de MAX_BYTES):
//
//     import { verifyUpload, IMAGE_KINDS } from "../_shared/upload.ts"
//
//     const v = verifyUpload(imageBase64, { allow: IMAGE_KINDS, maxBytes: 8 * 1024 * 1024 })
//     if (!v.ok) return jsonResponse(v.status, { error: v.error, detail: v.detail })
//     const key = `Avatares/${safeId(id)}/${crypto.randomUUID()}.${v.ext}`
//     const url = await uploadToR2(r2, v.bytes, key, v.mime)
//                                        ↑ bytes ya decodificados  ↑ mime REAL
//
// El `image_mime` del cliente deja de usarse. No hace falta pedirlo ni quitarlo
// del body: simplemente se ignora, así que el cliente no cambia ni requiere
// build de iOS.

export type UploadKind =
    | "png" | "jpg" | "webp" | "gif"
    | "mp4" | "mov" | "webm"
    | "m4a" | "mp3" | "ogg" | "wav"

/** Los cuatro formatos de imagen que la app produce hoy. */
export const IMAGE_KINDS: UploadKind[] = ["png", "jpg", "webp", "gif"]
/** Imágenes + audio (para la media de los mensajes privados). */
export const IMAGE_AUDIO_KINDS: UploadKind[] = [...IMAGE_KINDS, "m4a", "mp3", "ogg", "wav"]
/** Video (keyframes animados del Atelier). */
export const VIDEO_KINDS: UploadKind[] = ["mp4", "mov", "webm"]

const MIME_OF: Record<UploadKind, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
}

export interface VerifyOk {
    ok: true
    bytes: Uint8Array
    /** Tipo REAL deducido de los bytes. Es el que debe viajar a R2. */
    mime: string
    /** Extensión REAL, para el key del objeto. */
    ext: UploadKind
    size: number
    /** base64 ya limpio (sin el prefijo data:), por si hay que reenviarlo a una API. */
    b64: string
}
export interface VerifyErr {
    ok: false
    status: number
    error: string
    detail?: string
}
export type VerifyResult = VerifyOk | VerifyErr

export interface VerifyOpts {
    /** Formatos aceptados. Todo lo demás se rechaza aunque sea un archivo válido. */
    allow: UploadKind[]
    /** Tope en bytes del archivo YA decodificado. */
    maxBytes: number
}

const ascii = (b: Uint8Array, from: number, len: number): string => {
    let s = ""
    for (let i = from; i < from + len && i < b.length; i++) s += String.fromCharCode(b[i])
    return s
}
const startsWith = (b: Uint8Array, sig: number[]): boolean => {
    if (b.length < sig.length) return false
    for (let i = 0; i < sig.length; i++) if (b[i] !== sig[i]) return false
    return true
}

/**
 * Deduce el formato real leyendo la firma del archivo (magic bytes).
 * Devuelve null si no reconoce nada: en un bucket público, lo desconocido
 * se rechaza (lista blanca), nunca se acepta "por si acaso".
 */
export function sniffKind(b: Uint8Array): UploadKind | null {
    if (b.length < 12) return null

    // ── Imagen
    if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png"
    if (startsWith(b, [0xff, 0xd8, 0xff])) return "jpg"
    if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp"
    if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return "gif"

    // ── Audio
    if (startsWith(b, [0x49, 0x44, 0x33])) return "mp3"                  // ID3
    if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return "mp3"            // frame sync
    if (ascii(b, 0, 4) === "OggS") return "ogg"
    if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return "wav"

    // ── Contenedor ISO-BMFF: mp4 / mov / m4a se distinguen por el brand.
    if (ascii(b, 4, 4) === "ftyp") {
        const brand = ascii(b, 8, 4)
        if (brand === "qt  ") return "mov"
        if (brand.startsWith("M4A") || brand === "M4B ") return "m4a"
        return "mp4"
    }

    // ── Video
    if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return "webm"          // Matroska/WebM

    return null
}

/**
 * Nombra lo que se coló, para poder decirlo con precisión en el log/respuesta.
 * Solo se usa cuando sniffKind ya devolvió null.
 */
function describeRejected(b: Uint8Array): string {
    const head = ascii(b, 0, 16).trim().toLowerCase()
    if (head.startsWith("<?xml") || head.startsWith("<svg")) return "svg_o_xml"
    if (head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<")) return "html"
    if (ascii(b, 0, 4) === "%PDF") return "pdf"
    if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return "zip_o_office"
    if (startsWith(b, [0x7f, 0x45, 0x4c, 0x46])) return "binario_ejecutable"
    if (startsWith(b, [0x4d, 0x5a])) return "binario_ejecutable"
    return "desconocido"
}

/** bytes reales que producirá un base64, sin decodificarlo. */
function decodedSize(b64: string): number {
    const n = b64.length
    if (n === 0) return 0
    let pad = 0
    if (b64.charCodeAt(n - 1) === 61) pad++
    if (n > 1 && b64.charCodeAt(n - 2) === 61) pad++
    return Math.floor((n * 3) / 4) - pad
}

function base64ToUint8(b64: string): Uint8Array {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
}

/**
 * Valida una subida en base64: tamaño primero (sin decodificar), después el
 * tipo real por magic bytes. Devuelve los bytes listos y el mime/ext REALES.
 */
export function verifyUpload(base64Raw: string, opts: VerifyOpts): VerifyResult {
    const b64 = String(base64Raw ?? "").replace(/^data:[^;]+;base64,/, "").trim()
    if (!b64) return { ok: false, status: 400, error: "missing_file" }

    // 1) Tamaño ANTES de decodificar: el pico de memoria nunca ocurre.
    const approx = decodedSize(b64)
    if (approx > opts.maxBytes) {
        return {
            ok: false,
            status: 413,
            error: "file_too_large",
            detail: `${approx} bytes (máximo ${opts.maxBytes})`,
        }
    }

    // 2) Decodificar.
    let bytes: Uint8Array
    try {
        bytes = base64ToUint8(b64)
    } catch {
        return { ok: false, status: 400, error: "invalid_base64" }
    }
    if (bytes.length > opts.maxBytes) {
        return { ok: false, status: 413, error: "file_too_large" }
    }
    if (bytes.length < 12) {
        return { ok: false, status: 400, error: "file_too_small" }
    }

    // 3) Tipo REAL. Lo que declaró el cliente no participa.
    const kind = sniffKind(bytes)
    if (!kind) {
        return {
            ok: false,
            status: 415,
            error: "unsupported_file_type",
            detail: describeRejected(bytes),
        }
    }
    if (!opts.allow.includes(kind)) {
        return {
            ok: false,
            status: 415,
            error: "file_type_not_allowed",
            detail: kind,
        }
    }

    return { ok: true, bytes, mime: MIME_OF[kind], ext: kind, size: bytes.length, b64 }
}

/**
 * Variante para multipart (subir-keyframe-video usa File, no base64).
 * Lee el archivo completo una sola vez, con el mismo criterio.
 */
export async function verifyUploadFile(file: File, opts: VerifyOpts): Promise<VerifyResult> {
    if (!file || file.size === 0) return { ok: false, status: 400, error: "missing_file" }
    if (file.size > opts.maxBytes) {
        return {
            ok: false,
            status: 413,
            error: "file_too_large",
            detail: `${file.size} bytes (máximo ${opts.maxBytes})`,
        }
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.length < 12) return { ok: false, status: 400, error: "file_too_small" }
    const kind = sniffKind(bytes)
    if (!kind) {
        return { ok: false, status: 415, error: "unsupported_file_type", detail: describeRejected(bytes) }
    }
    if (!opts.allow.includes(kind)) {
        return { ok: false, status: 415, error: "file_type_not_allowed", detail: kind }
    }
    let b64 = ""
    try {
        let bin = ""
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        b64 = btoa(bin)
    } catch {
        b64 = ""
    }
    return { ok: true, bytes, mime: MIME_OF[kind], ext: kind, size: bytes.length, b64 }
}
