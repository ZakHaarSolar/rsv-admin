#!/usr/bin/env node
import { connect } from "framer-api"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
const __dirname = fileURLToPath(new URL(".", import.meta.url))
const CODE_DIR = resolve(__dirname, "..", "Code")
const framer = await connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY)
try {
    // métodos disponibles en la conexión
    const protoMethods = []
    let o = framer
    while (o && o !== Object.prototype) {
        for (const n of Object.getOwnPropertyNames(o)) {
            if (typeof framer[n] === "function" && n !== "constructor") protoMethods.push(n)
        }
        o = Object.getPrototypeOf(o)
    }
    console.log("framer methods:", [...new Set(protoMethods)].sort().join(", "))

    // confirmar Privacy remoto vs local con .content
    const all = await framer.getCodeFiles()
    for (const target of ["Privacy", "Domo"]) {
        const cf = all.find((f) => { try { return (f.name||"").replace(/\.tsx$/,"") === target } catch { return false } }) ||
                   all.find((f) => { try { return (f.name||"").startsWith(target) } catch { return false } })
        if (!cf) { console.log(`${target}: no encontrado`); continue }
        const full = await framer.getCodeFile(cf.id)
        const remote = full?.content ?? ""
        const local = readFileSync(resolve(CODE_DIR, `${target}.tsx`), "utf-8")
        console.log(`${target}: remote ${remote.length}b · local ${local.length}b · MATCH ${remote === local}`)
    }
} catch (e) { console.error("err:", e?.message) } finally { await framer.disconnect().catch(() => {}) }
