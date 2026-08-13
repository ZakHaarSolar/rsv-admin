#!/usr/bin/env node
import { connect } from "framer-api"
const framer = await connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY)
try {
    const all = await framer.getCodeFiles()
    const cf = all.find((f) => (f.name || "").startsWith("Domo"))
    console.log("LIST item keys:", Object.keys(cf))
    console.log("LIST item:", JSON.stringify(cf, (k, v) => typeof v === "string" && v.length > 80 ? v.slice(0, 80) + `…(${v.length})` : v, 2).slice(0, 1500))
    const full = await framer.getCodeFile(cf.id)
    console.log("\nFULL keys:", Object.keys(full || {}))
    console.log("FULL:", JSON.stringify(full, (k, v) => typeof v === "string" && v.length > 120 ? v.slice(0, 120) + `…(len ${v.length})` : v, 2).slice(0, 2500))
    // probar varias props de contenido
    for (const p of ["fileContent", "content", "code", "source", "text", "body"]) {
        const v = full?.[p]
        if (typeof v === "string") console.log(`full.${p}: len ${v.length} head="${v.split("\n")[0].slice(0,60)}"`)
    }
} catch (e) { console.error("err:", e?.message) } finally { await framer.disconnect().catch(() => {}) }
