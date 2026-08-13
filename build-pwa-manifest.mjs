#!/usr/bin/env node
/*
 * build-pwa-manifest.mjs · v1.0
 *
 * Lee el JSON crudo del manifest dentro de PWA_EscanerVibracional.html
 * (bloque marcado entre ```json y ```), lo encodea en base64 y reescribe
 * el atributo href del <link rel="manifest"> en el bloque entre
 * <!-- BEGIN PWA BLOCK --> y <!-- END PWA BLOCK -->.
 *
 * Uso:
 *   cd "/Users/diego/Documents/Red Solar Viva/admin"
 *   node build-pwa-manifest.mjs
 *
 * Después abrir PWA_EscanerVibracional.html, copiar el bloque entre
 * BEGIN/END PWA BLOCK y pegarlo en Framer → Site Settings → General →
 * Custom Code → Start of <head> tag.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const HTML_PATH = resolve(__dirname, "PWA_EscanerVibracional.html")

const html = readFileSync(HTML_PATH, "utf8")

// 1. Extraer el JSON crudo (bloque ```json ... ```)
const jsonMatch = html.match(/```json\s*([\s\S]*?)\s*```/)
if (!jsonMatch) {
    console.error(
        "❌ No encontré el bloque ```json ... ``` en PWA_EscanerVibracional.html"
    )
    process.exit(1)
}

let parsed
try {
    parsed = JSON.parse(jsonMatch[1])
} catch (e) {
    console.error("❌ JSON inválido:", e.message)
    process.exit(1)
}

// 2. Validaciones mínimas
const requiredKeys = [
    "name",
    "short_name",
    "start_url",
    "scope",
    "display",
    "icons",
]
for (const k of requiredKeys) {
    if (!(k in parsed)) {
        console.error(`❌ Falta '${k}' en el manifest`)
        process.exit(1)
    }
}
if (!Array.isArray(parsed.icons) || parsed.icons.length === 0) {
    console.error("❌ icons debe ser array con al menos 1 entrada")
    process.exit(1)
}

// 3. Warning si hay placeholders sin reemplazar
const placeholderHits = parsed.icons.filter((i) =>
    /REEMPLAZAR-ICONO/i.test(i.src)
)
if (placeholderHits.length > 0) {
    console.warn(
        `⚠️  ${placeholderHits.length} icono(s) aún tienen URL placeholder:`
    )
    placeholderHits.forEach((i) => console.warn(`   · ${i.src}`))
    console.warn(
        "   El manifest se va a generar igual, pero el PWA va a fallar al instalar."
    )
}

// 4. Encodear en base64
const minified = JSON.stringify(parsed)
const base64 = Buffer.from(minified, "utf8").toString("base64")
const dataUrl = `data:application/manifest+json;base64,${base64}`

// 5. Reemplazar el href del <link rel="manifest"> en el bloque BEGIN/END
const linkRegex =
    /(<link rel="manifest" href=")data:application\/manifest\+json;base64,[^"]*(")/
if (!linkRegex.test(html)) {
    console.error(
        '❌ No encontré el <link rel="manifest" href="data:..."> en el HTML para reemplazar'
    )
    process.exit(1)
}
const newHtml = html.replace(linkRegex, `$1${dataUrl}$2`)
writeFileSync(HTML_PATH, newHtml, "utf8")

// 6. Reemplazar también las URLs de apple-touch-icon usando los iconos
//    192/512 del JSON (si existen).
const icon192 = parsed.icons.find((i) => /192/.test(i.sizes))
const icon512 = parsed.icons.find((i) => /512/.test(i.sizes))
let html2 = readFileSync(HTML_PATH, "utf8")
if (icon192) {
    html2 = html2.replace(
        /(<link rel="apple-touch-icon" href=")[^"]*(")/,
        `$1${icon192.src}$2`
    )
    html2 = html2.replace(
        /(<link rel="apple-touch-icon" sizes="192x192" href=")[^"]*(")/,
        `$1${icon192.src}$2`
    )
}
if (icon512) {
    html2 = html2.replace(
        /(<link rel="apple-touch-icon" sizes="512x512" href=")[^"]*(")/,
        `$1${icon512.src}$2`
    )
}
writeFileSync(HTML_PATH, html2, "utf8")

console.log("✅ Manifest regenerado.")
console.log(`   bytes JSON minificado: ${minified.length}`)
console.log(`   bytes base64:          ${base64.length}`)
console.log(`   icons: ${parsed.icons.length}`)
console.log("")
console.log("Próximo paso:")
console.log(
    "  Abrí PWA_EscanerVibracional.html, copiá el bloque entre"
)
console.log(
    "  <!-- BEGIN PWA BLOCK --> y <!-- END PWA BLOCK -->, y pegalo en"
)
console.log("  Framer → Site Settings → General → Custom Code → Start of <head>.")
