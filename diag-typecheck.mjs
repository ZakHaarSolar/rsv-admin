#!/usr/bin/env node
// Enumera errores de tipo por Code File usando CodeFile.typecheck() del SDK.
// Objetivo: identificar qué archivos cargan los "24 blocking errors" del publish.
import { connect } from "framer-api"

const framer = await Promise.race([
    connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY),
    new Promise((_, rej) => setTimeout(() => rej(new Error("connect timeout 25s")), 25000)),
]).catch((e) => { console.error("connect fail:", e?.message); process.exit(1) })

// ts.DiagnosticCategory: Warning=0, Error=1, Suggestion=2, Message=3
const CAT = { 0: "warn", 1: "ERROR", 2: "sugg", 3: "msg" }

async function tcOne(cf) {
    try {
        const full = await framer.getCodeFile(cf.id)
        const diags = await Promise.race([
            full.typecheck(),
            new Promise((_, rej) => setTimeout(() => rej(new Error("typecheck timeout 40s")), 40000)),
        ])
        return { name: cf.name, diags }
    } catch (e) {
        return { name: cf.name, err: e?.message }
    }
}

try {
    const all = await framer.getCodeFiles()
    console.log(`Code files: ${all.length}`)
    // primero mis dos archivos editados, después el resto
    const priority = ["Privacy", "Domo"]
    const sorted = [...all].sort((a, b) => {
        const ai = priority.findIndex((p) => (a.name || "").startsWith(p))
        const bi = priority.findIndex((p) => (b.name || "").startsWith(p))
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    let totalErrors = 0
    const offenders = []
    for (const cf of sorted) {
        const { name, diags, err } = await tcOne(cf)
        if (err) { console.log(`  · ${name}: ⚠️ ${err}`); continue }
        const errs = (diags || []).filter((d) => d.category === 1)
        const warns = (diags || []).filter((d) => d.category === 0)
        if (errs.length) {
            totalErrors += errs.length
            offenders.push({ name, count: errs.length })
            console.log(`\n=== ${name}: ${errs.length} ERROR(es), ${warns.length} warn ===`)
            for (const d of errs.slice(0, 12)) {
                const line = d.span?.start?.line ?? d.span?.line ?? "?"
                console.log(`   L${line} TS${d.code ?? "?"}: ${String(d.message).slice(0, 160)}`)
            }
            if (errs.length > 12) console.log(`   …(+${errs.length - 12} más)`)
        } else {
            console.log(`  · ${name}: ok (${warns.length} warn)`)
        }
    }
    console.log(`\n========== TOTAL ERRORES DE TIPO: ${totalErrors} ==========`)
    console.log("Por archivo:", JSON.stringify(offenders))
} catch (e) {
    console.error("error general:", e?.message)
} finally {
    await framer.disconnect().catch(() => {})
}
