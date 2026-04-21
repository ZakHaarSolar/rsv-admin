#!/usr/bin/env node
// Red Solar Viva — Framer Sync v1.0
// Sube un .tsx local → actualiza el code file en Framer → publica → deploy a dominio custom.
//
// Uso:
//   node framer-sync.mjs EscanerVibracional.tsx
//   node framer-sync.mjs EscanerVibracional.tsx MobileNavigation.tsx Domo.tsx
//   node framer-sync.mjs --all      (sincroniza todos los .tsx de Code/)
//   node framer-sync.mjs --no-deploy EscanerVibracional.tsx   (solo publica preview)
//
// Requiere variables de entorno (en admin/.env):
//   FRAMER_PROJECT_URL = https://framer.com/projects/Red-Solar-Viva--jC7xxhLWMiFkzlbPe42f
//   FRAMER_API_KEY     = <tu key generada en Project Settings>

import { connect } from "framer-api"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { resolve, basename, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const CODE_DIR = resolve(__dirname, "..", "Code")

/* ── Args ───────────────────────────────────────────────── */
const args = process.argv.slice(2)
const noDeploy = args.includes("--no-deploy")
const syncAll = args.includes("--all")
const fileArgs = args.filter((a) => !a.startsWith("--"))

if (!syncAll && fileArgs.length === 0) {
    console.error(`
❌ Falta especificar archivo(s) o usar --all.

Uso:
  node framer-sync.mjs EscanerVibracional.tsx
  node framer-sync.mjs --all
  node framer-sync.mjs --no-deploy EscanerVibracional.tsx
`)
    process.exit(1)
}

const filesToSync = syncAll
    ? readdirSync(CODE_DIR).filter((f) => f.endsWith(".tsx"))
    : fileArgs.map((f) => (f.endsWith(".tsx") ? f : `${f}.tsx`))

/* Validar que existen en disco antes de tocar Framer */
const missing = filesToSync.filter(
    (f) => !existsSync(join(CODE_DIR, basename(f)))
)
if (missing.length > 0) {
    console.error(`❌ Archivos no encontrados en ${CODE_DIR}:`)
    missing.forEach((f) => console.error(`   - ${f}`))
    process.exit(1)
}

/* ── Env ────────────────────────────────────────────────── */
const projectUrl = process.env.FRAMER_PROJECT_URL
const apiKey = process.env.FRAMER_API_KEY

if (!projectUrl) {
    console.error("❌ Falta FRAMER_PROJECT_URL en el entorno.")
    process.exit(1)
}
if (!apiKey) {
    console.error("❌ Falta FRAMER_API_KEY en el entorno.")
    process.exit(1)
}

/* ── Helpers ────────────────────────────────────────────── */
const ts = () =>
    new Date().toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        hour12: false,
    })

const log = (emoji, msg) => console.log(`[${ts()}] ${emoji} ${msg}`)

/* ── Main ───────────────────────────────────────────────── */
log("🛰️ ", `Conectando a Framer (${projectUrl.split("/").pop()})…`)
log("ℹ️ ", `API key: ${apiKey.slice(0, 8)}…${apiKey.slice(-4)} (${apiKey.length} chars)`)

const framer = await Promise.race([
    connect(projectUrl, apiKey),
    new Promise((_, reject) =>
        setTimeout(
            () => reject(new Error("Timeout 20s conectando al Server API")),
            20_000
        )
    ),
]).catch((e) => {
    console.error(`\n❌ No se pudo conectar:\n   ${e.message}\n`)
    console.error(`Verificá:`)
    console.error(`   1. API key bien (sin espacios) — generada en ESTE proyecto`)
    console.error(`   2. URL del proyecto: ${projectUrl}`)
    console.error(`   3. Conexión a internet activa.\n`)
    process.exit(1)
})

try {
    /* 1) Listar code files del proyecto y mapear por nombre */
    const allCodeFiles = await framer.getCodeFiles()
    const byName = new Map(allCodeFiles.map((cf) => [cf.name, cf]))

    log(
        "📚",
        `Proyecto tiene ${allCodeFiles.length} code files. Sincronizando ${filesToSync.length}…`
    )

    /* 2) Para cada archivo local, actualizar contenido en Framer */
    let updated = 0
    let skipped = 0
    for (const fname of filesToSync) {
        const baseName = basename(fname)
        const localPath = join(CODE_DIR, baseName)
        const localContent = readFileSync(localPath, "utf-8")
        const remoteName = baseName.replace(/\.tsx$/, "")

        /* Framer puede listar code files con o sin extensión — probamos ambos */
        const cf =
            byName.get(baseName) ||
            byName.get(remoteName) ||
            allCodeFiles.find(
                (f) =>
                    f.name === baseName ||
                    f.name === remoteName ||
                    f.name.replace(/\.tsx$/, "") === remoteName
            )

        if (!cf) {
            console.warn(
                `   ⚠️  ${baseName}: no existe en Framer. Crea el componente primero, luego re-ejecuta.`
            )
            skipped++
            continue
        }

        /* Si el contenido es idéntico, no llamamos al API (evita deploys vacíos) */
        const remoteContent =
            typeof cf.fileContent === "string"
                ? cf.fileContent
                : (await framer.getCodeFile(cf.id))?.fileContent || ""

        if (remoteContent === localContent) {
            console.log(`   ⏭️  ${baseName}: sin cambios, omitido.`)
            skipped++
            continue
        }

        await cf.setFileContent(localContent)
        const sizeKB = (localContent.length / 1024).toFixed(1)
        console.log(`   ✅ ${baseName} → actualizado en Framer (${sizeKB} KB)`)
        updated++
    }

    if (updated === 0) {
        log("⛔", "Ningún archivo cambió. No se publica.")
        process.exit(0)
    }

    /* 3) Verificar cambios pendientes en el proyecto antes de publicar */
    const changed = await framer.getChangedPaths()
    const total =
        (changed.added?.length || 0) +
        (changed.modified?.length || 0) +
        (changed.removed?.length || 0)
    log("📝", `${total} cambio(s) pendiente(s) de publicar.`)

    /* 4) Publicar (build de deployment) */
    log("🚀", "Publicando a Framer…")
    const { deployment } = await framer.publish()
    log("✅", `Deployment listo → ${deployment.id}`)

    /* 5) Deploy a dominios custom */
    if (noDeploy) {
        log(
            "ℹ️ ",
            "Modo --no-deploy: la preview está lista; deploy a dominio custom omitido."
        )
    } else {
        log("🌐", "Deploy a dominio(s) custom…")
        const hosts = await framer.deploy(deployment.id)
        if (hosts.length === 0) {
            log(
                "ℹ️ ",
                "Sin dominios custom configurados — el sitio default ya está vivo."
            )
        } else {
            for (const h of hosts) {
                log("🟢", `Live → https://${h.hostname}`)
            }
        }
    }

    /* 6) Trigger reload del iPhone (si BrowserSync corre) */
    try {
        const reloadUrl = process.env.RELOAD_HOOK_URL
        if (reloadUrl) {
            const r = await fetch(reloadUrl, { method: "POST" }).catch(
                () => null
            )
            if (r?.ok) log("📱", "iPhone notificado para refrescar.")
        }
    } catch {
        /* sin hook de reload, no pasa nada */
    }
} catch (e) {
    console.error("\n❌ Error en el sync:")
    console.error(e?.message || e)
    process.exitCode = 1
} finally {
    await framer.disconnect()
}

log("🌟", "Sync completado.")
