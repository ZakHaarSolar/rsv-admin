#!/usr/bin/env node
// Lee el estado REMOTO real (forzando getCodeFile) de Privacy + Domo y
// compara vs local.
import { connect } from "framer-api"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const CODE_DIR = resolve(__dirname, "..", "Code")

const projectUrl = process.env.FRAMER_PROJECT_URL
const apiKey = process.env.FRAMER_API_KEY

const framer = await Promise.race([
    connect(projectUrl, apiKey),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000)),
]).catch((e) => { console.error("connect fail:", e?.message); process.exit(1) })

const head = (s) => (s || "").split("\n")[0].slice(0, 110)

async function realContent(framer, cf) {
    // Forzar fetch completo siempre (la lista trae fileContent vacío)
    const full = await framer.getCodeFile(cf.id)
    return full?.fileContent ?? ""
}

try {
    const all = await framer.getCodeFiles()
    for (const target of ["Privacy", "Domo"]) {
        const cf = all.find((f) => f.name === target || f.name === `${target}.tsx` || f.name.replace(/\.tsx$/, "") === target)
        if (!cf) { console.log(`${target}: NO existe en Framer\n`); continue }
        const remote = await realContent(framer, cf)
        let local = ""
        try { local = readFileSync(resolve(CODE_DIR, `${target}.tsx`), "utf-8") } catch {}
        console.log(`=== ${target} (id ${cf.id}) ===`)
        console.log(`  REMOTE head: ${head(remote)}`)
        console.log(`  LOCAL  head: ${head(local)}`)
        console.log(`  REMOTE bytes: ${remote.length} | LOCAL bytes: ${local.length} | MATCH: ${remote === local}\n`)
    }
} catch (e) {
    console.error("error:", e?.message)
} finally {
    await framer.disconnect().catch(() => {})
}
