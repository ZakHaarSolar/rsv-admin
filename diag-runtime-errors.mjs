#!/usr/bin/env node
// Enumera los RUNTIME errors que bloquean el publish (no typecheck).
// Vía 1: getRuntimeErrorForModule(identifier) por code file.
// Vía 2: getNodesWithType("ComponentInstanceNode") + node.getRuntimeError().
// Vía 3: getPublishInfo() para ver antigüedad del sitio live.
import { connect } from "framer-api"

const framer = await Promise.race([
    connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY),
    new Promise((_, rej) => setTimeout(() => rej(new Error("connect timeout 25s")), 25000)),
]).catch((e) => { console.error("connect fail:", e?.message); process.exit(1) })

const safe = async (label, fn) => {
    try { return await fn() } catch (e) { console.log(`  (${label} fail: ${e?.message})`); return null }
}

try {
    // ── Vía 3: estado del publish live ──
    const pub = await safe("getPublishInfo", () => framer.getPublishInfo())
    if (pub) {
        const p = pub.production, s = pub.staging
        console.log("=== PUBLISH INFO ===")
        console.log("  production:", p ? `${p.url || "?"} @ ${p.publishedAt || p.time || "?"}` : "null")
        console.log("  staging:   ", s ? `${s.url || "?"} @ ${s.publishedAt || s.time || "?"}` : "null")
        console.log("  RAW:", JSON.stringify(pub, (k, v) => typeof v === "string" && v.length > 90 ? v.slice(0, 90) + "…" : v).slice(0, 600))
    }

    // ── Vía 1: runtime error por módulo ──
    const all = await framer.getCodeFiles()
    console.log(`\n=== RUNTIME ERROR POR MÓDULO (${all.length} code files) ===`)
    // Inspeccionar shape de un code file para hallar el identificador correcto
    const sample = all[0]
    const idCandidates = {}
    for (const k of ["id", "name", "moduleUrl", "url", "identifier", "moduleIdentifier", "path"]) {
        try { const v = sample?.[k]; if (v !== undefined) idCandidates[k] = String(v).slice(0, 60) } catch {}
    }
    console.log("  sample code file props:", JSON.stringify(idCandidates))

    const offenders = []
    for (const cf of all) {
        const name = cf.name || cf.id
        // probar identificador = id, luego name, luego name sin .tsx
        const ids = [cf.id, cf.name, (cf.name || "").replace(/\.tsx$/, "")].filter(Boolean)
        let err = null, usedId = null
        for (const ident of ids) {
            const r = await safe(`mod ${name}`, () => framer.getRuntimeErrorForModule(ident))
            if (r) { err = r; usedId = ident; break }
        }
        if (err) {
            offenders.push({ name, err: String(err).slice(0, 200) })
            console.log(`  ✗ ${name} [via ${usedId}]: ${String(err).slice(0, 180)}`)
        }
    }
    console.log(`\n  → módulos con runtime error: ${offenders.length}`)

    // ── Vía 2: runtime error por nodo de canvas ──
    const instances = await safe("getNodesWithType", () => framer.getNodesWithType("ComponentInstanceNode"))
    console.log(`\n=== RUNTIME ERROR POR NODO (${instances ? instances.length : 0} ComponentInstanceNodes) ===`)
    const nodeOffenders = []
    if (instances) {
        for (const node of instances) {
            const cname = await safe("name", () => node.componentName) || node.id
            const rerr = await safe(`node ${cname}`, () => node.getRuntimeError())
            if (rerr) {
                nodeOffenders.push({ node: node.id, cname, type: rerr.type, message: String(rerr.message).slice(0, 200) })
                console.log(`  ✗ [${cname}] ${rerr.type}: ${String(rerr.message).slice(0, 180)}`)
            }
        }
    }
    console.log(`\n  → nodos con runtime error: ${nodeOffenders.length}`)
    console.log("\n========== RESUMEN ==========")
    console.log("módulos:", JSON.stringify(offenders.map(o => o.name)))
    console.log("nodos:", JSON.stringify(nodeOffenders.map(o => o.cname)))
} catch (e) {
    console.error("error general:", e?.message, e?.stack?.split("\n").slice(0, 3).join(" | "))
} finally {
    await framer.disconnect().catch(() => {})
}
