#!/usr/bin/env node
// Diagnóstico one-shot: conecta a Framer, lista cambios pendientes,
// intenta publish() y vuelca el error COMPLETO para extraer los
// archivos con "blocking errors". NO llama deploy() — cero efecto live.
import { connect } from "framer-api"

const projectUrl = process.env.FRAMER_PROJECT_URL
const apiKey = process.env.FRAMER_API_KEY
if (!projectUrl || !apiKey) {
    console.error("Faltan FRAMER_PROJECT_URL / FRAMER_API_KEY")
    process.exit(1)
}

function dumpError(e) {
    console.log("\n===== ERROR DUMP =====")
    console.log("message:", e?.message)
    console.log("name:", e?.name)
    const props = e ? Object.getOwnPropertyNames(e) : []
    console.log("ownProps:", props.join(", "))
    for (const k of ["errors", "publishingErrors", "cause", "detail", "details", "data", "response", "body"]) {
        if (e && e[k] !== undefined) {
            let v = e[k]
            try { v = JSON.stringify(v, null, 2) } catch {}
            console.log(`--- e.${k} ---\n${String(v).slice(0, 6000)}`)
        }
    }
    // catch-all enumerable + non-enumerable
    try {
        const all = {}
        for (const k of props) { try { all[k] = e[k] } catch {} }
        console.log("--- full (own props) ---\n" + JSON.stringify(all, (key, val) => {
            if (typeof val === "function") return "[fn]"
            return val
        }, 2).slice(0, 8000))
    } catch (je) { console.log("json fail:", je?.message) }
    console.log("stack:", String(e?.stack || "").slice(0, 1500))
    console.log("===== END DUMP =====\n")
}

const framer = await Promise.race([
    connect(projectUrl, apiKey),
    new Promise((_, rej) => setTimeout(() => rej(new Error("connect timeout 20s")), 20000)),
]).catch((e) => { console.error("connect fail:", e?.message); process.exit(1) })

try {
    const changed = await framer.getChangedPaths()
    console.log("CHANGED PATHS:")
    console.log("  added:", JSON.stringify(changed.added || []))
    console.log("  modified:", JSON.stringify(changed.modified || []))
    console.log("  removed:", JSON.stringify(changed.removed || []))

    console.log("\nIntentando publish()...")
    try {
        const { deployment } = await framer.publish()
        console.log("PUBLISH OK (inesperado):", deployment?.id)
    } catch (e) {
        console.log("PUBLISH FALLÓ (esperado).")
        dumpError(e)
    }
} catch (e) {
    console.error("error general:", e?.message)
    dumpError(e)
} finally {
    await framer.disconnect().catch(() => {})
}
