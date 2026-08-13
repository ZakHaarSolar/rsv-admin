#!/usr/bin/env node
// Reintenta publish+deploy para testear si los 24 Clerk-CDN errors son transitorios.
import { connect } from "framer-api"

const framer = await Promise.race([
    connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY),
    new Promise((_, rej) => setTimeout(() => rej(new Error("connect timeout 25s")), 25000)),
]).catch((e) => { console.error("connect fail:", e?.message); process.exit(1) })

try {
    const before = await framer.getPublishInfo().catch(() => null)
    if (before?.production) {
        console.log("ANTES production:", before.production.url, "@", before.production.deploymentTime)
    }
    console.log("Intentando publish()…")
    const t = Date.now()
    const { deployment } = await framer.publish()
    console.log(`✅ PUBLISH OK — deployment ${deployment.id} (${((Date.now()-t)/1000).toFixed(1)}s)`)
    console.log("Intentando deploy a dominio custom…")
    const hosts = await framer.deploy(deployment.id)
    if (hosts.length > 0) for (const h of hosts) console.log("🟢 https://" + h.hostname)
    else console.log("ℹ️ sitio default actualizado")
    const after = await framer.getPublishInfo().catch(() => null)
    if (after?.production) {
        console.log("DESPUÉS production:", after.production.url, "@", after.production.deploymentTime)
    }
    console.log("RESULT: SUCCESS")
} catch (e) {
    console.error("RESULT: BLOCKED —", e?.message)
} finally {
    await framer.disconnect().catch(() => {})
}
