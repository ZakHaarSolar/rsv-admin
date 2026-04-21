#!/usr/bin/env node
// Red Solar Viva — Framer Watcher v2.11
// Vigila Code/*.tsx — al detectar cambio (debounce 5s), abre conexión
// FRESCA al Server API, sincroniza, publica, deploya, cierra.
// Conexiones efímeras = sin zombies, sin timeouts misteriosos.
//
// v2.11 — Fail-fast, sin retries:
//   - connect: 1 intento, 15s timeout (antes 3×25s + backoff).
//   - upload por archivo: 1 intento, 90s timeout (antes 3×90s + backoff).
//   - Si un archivo falla → lo colectamos en failed[] y seguimos con
//     el resto del batch. No tiramos excepción que mate el sync.
//   - Receipt final reporta 3 listas: uploaded[], failed[], skipped_large[].
//   - Status "partial_success" cuando hubo mezcla de éxitos + fallos.
//   Motivo: la Framer API es flaky. Antes un batch de 3 archivos con
//   1 flaky = 9 intentos × 90s = ~13 min perdidos. Ahora: 3 × 90s =
//   4.5 min máximo y reporte claro de qué falló.
//
// v2.10 — Pre-filtro duro de 300KB ANTES del connect. Si el batch
//   completo son archivos >300KB, no intentamos conectar. Receipt
//   skipped_large inmediato.
//
// Uso:
//   node framer-watcher.mjs
//   node framer-watcher.mjs --no-deploy

import { connect } from "framer-api"
import {
    watch,
    readFileSync,
    readdirSync,
    existsSync,
    unlinkSync,
    writeFileSync,
} from "node:fs"
import { resolve, basename, join } from "node:path"
import { fileURLToPath } from "node:url"
import { exec as execCb } from "node:child_process"
import { promisify } from "node:util"
const exec = promisify(execCb)

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const CODE_DIR = resolve(__dirname, "..", "Code")
/* v2.1 \u2014 Marker file: si Claude crea este archivo antes del edit,
   el watcher hace el sync a Framer pero SKIPEA el reload del iPhone.
   \u00datil para cambios solo-desktop donde no necesitamos refrescar el m\u00f3vil.
   Es one-shot: el marker se borra despu\u00e9s de cada sync. */
const SKIP_IPHONE_MARKER = resolve(__dirname, ".skip-iphone-reload")
/* v2.3 \u2014 Hold marker: sticky (no one-shot). Mientras exista, cada sync a
   Framer skipea el reload del iPhone. Cuando Claude termina un lote de edits
   y borra el marker, el watcher detecta la ausencia y dispara 1 reload final
   que refleja TODOS los cambios del lote. Resuelve el patrón "N edits \u2192
   N reloads" cuando los gaps entre edits cruzan el debounce. */
const HOLD_IPHONE_MARKER = resolve(__dirname, ".hold-iphone-reload")
/* v2.7 \u2014 Receipt file: el watcher escribe aqu\u00ed el status de cada sync
   (success|failed|skipped) para que Claude pueda leer despu\u00e9s de un Edit
   y verificar si Framer recibi\u00f3 el cambio. Fix para la sorpresa de
   "el c\u00f3digo local est\u00e1 bien pero Framer tiene la versi\u00f3n vieja". */
const RECEIPT_PATH = resolve(__dirname, ".last-sync-status.json")
const DEBOUNCE_MS = 5000 /* v2.2 \u2014 5s para agrupar ediciones bursty de Claude (antes 2s pero ediciones consecutivas del Edit tool con gaps de 3-4s disparaban 5+ reloads). 5s es el sweet spot: junta ediciones AI y no se siente lento al editar manualmente. */
/* v2.9 \u2014 Umbral duro: archivos >300KB NO se suben a Framer v\u00eda API.
   Se saltan (skipped_large) y Claude debe instruir al user a copiar/pegar manual.
   Basado en Diego's finding: Framer API timeouta procesando uploads gigantes
   (EscanerVibracional.tsx a 437KB = 3 retries \u00d7 90s = 4.5min de espera para
   terminar en "failed" igual). Skipear desde el pique ahorra ese tiempo
   muerto. Los archivos <300KB se siguen sincronizando normal. */
const MAX_AUTO_SYNC_BYTES = 300_000
/* v2.3 \u2014 flag: true si hubo al menos 1 sync mientras el hold estuvo activo.
   Cuando el hold se borra, si esto es true, disparamos 1 reload final. */
let pendingHoldedReload = false
const SYNC_TIMEOUT_MS = 90_000 /* timeout duro por sync */

const noDeploy = process.argv.includes("--no-deploy")
const projectUrl = process.env.FRAMER_PROJECT_URL
const apiKey = process.env.FRAMER_API_KEY
const reloadUrl = process.env.RELOAD_HOOK_URL

if (!projectUrl || !apiKey) {
    console.error("❌ Faltan FRAMER_PROJECT_URL o FRAMER_API_KEY en el entorno.")
    process.exit(1)
}

const ts = () =>
    new Date().toLocaleTimeString("es-MX", {
        timeZone: "America/Mexico_City",
        hour12: false,
    })
const log = (emoji, msg) => console.log(`[${ts()}] ${emoji} ${msg}`)

/* v2.7 \u2014 writeReceipt: serializa el resultado del sync a un JSON que
   Claude puede leer despu\u00e9s de un Edit. Si el sync fall\u00f3, Claude
   notifica al usuario para que haga el copy/paste manual a Framer en vez
   de seguir asumiendo que todo subi\u00f3 bien. */
const writeReceipt = (status, meta = {}) => {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            status, /* "success" | "failed" | "skipped" */
            ...meta,
        }
        writeFileSync(RECEIPT_PATH, JSON.stringify(payload, null, 2))
    } catch (e) {
        console.warn(
            "   \u26a0\ufe0f  receipt write failed:",
            e?.message || e
        )
    }
}

const projectId = projectUrl.split("/").pop() || projectUrl
log("🛰️ ", `Vigilando ${CODE_DIR}/*.tsx`)
log("ℹ️ ", `Project: ${projectId}`)
log("ℹ️ ", `API key: ${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`)
log("ℹ️ ", `Conexión a Framer: efímera (fresca por cada sync)`)

/* v2.8 \u2014 probe tolerante: si Framer API est\u00e1 lento al arranque, no
   matamos el watcher, solo logeamos warning y seguimos. El primer sync real
   va a intentar conectar con retries (v2.6). As\u00ed Diego puede iniciar
   aunque Framer API tenga un hiccup momentáneo. */
log("🧪", "Probando conexión inicial…")
const PROBE_ATTEMPTS = 3
const PROBE_TIMEOUT_MS = 25_000
let probeOk = false
for (let attempt = 1; attempt <= PROBE_ATTEMPTS && !probeOk; attempt++) {
    try {
        const probe = await Promise.race([
            connect(projectUrl, apiKey),
            new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                `Timeout ${PROBE_TIMEOUT_MS / 1000}s en probe (intento ${attempt}/${PROBE_ATTEMPTS})`
                            )
                        ),
                    PROBE_TIMEOUT_MS
                )
            ),
        ])
        const files = await probe.getCodeFiles()
        log(
            "✅",
            `Probe OK \u2014 proyecto tiene ${files.length} code files. Listo para vigilar.`
        )
        await probe.disconnect()
        probeOk = true
    } catch (e) {
        console.warn(
            `   \u26a0\ufe0f  probe intento ${attempt}/${PROBE_ATTEMPTS} fall\u00f3: ${e?.message || e}`
        )
        if (attempt < PROBE_ATTEMPTS) {
            const backoffMs = 3000 * attempt
            console.log(
                `   \u23f3 reintentando probe en ${backoffMs / 1000}s\u2026`
            )
            await new Promise((r) => setTimeout(r, backoffMs))
        }
    }
}
if (!probeOk) {
    console.warn(
        `\n⚠️  Probe fall\u00f3 tras ${PROBE_ATTEMPTS} intentos. Framer API inestable.`
    )
    console.warn(
        `   El watcher seguir\u00e1 corriendo. Los syncs reintentar\u00e1n autom\u00e1ticamente (v2.6).`
    )
    console.warn(
        `   Si ning\u00fan sync funciona, copiar/pegar manual al archivo en Framer.\n`
    )
}

/* ── Sync con timeout y fresh connection ── */
const syncFiles = async (files) => {
    const t0 = Date.now()

    /* v2.10 \u2014 Pre-filtro de tama\u00f1o ANTES del connect.
       Si el batch completo son archivos >300KB, el watcher los skipea y
       escribe un receipt `skipped_large` sin siquiera intentar abrir la
       sesi\u00f3n con Framer. Antes: 3 retries \u00d7 25s = hasta 75s de connect
       in\u00fatil + potencial error si Framer API se pone quisquillosa.
       Ahora: 0s \u2192 el user ve el skip inmediato y hace copy/paste manual.
       Si el batch es mixto (algunos <300KB + algunos >300KB), conectamos
       normal y los grandes se siguen skipeando en el loop interno. */
    const skippedLarge = []
    const toSync = []
    for (const fname of files) {
        try {
            const size = readFileSync(join(CODE_DIR, fname), "utf-8").length
            if (size > MAX_AUTO_SYNC_BYTES) {
                const kb = Number((size / 1024).toFixed(1))
                skippedLarge.push({ name: fname, size_kb: kb })
                console.warn(
                    `   \u26d4 ${fname}: ${kb} KB supera 300KB \u2192 skip auto-sync (copy/paste manual a Framer).`
                )
            } else {
                toSync.push(fname)
            }
        } catch {
            /* Si no podemos leer el archivo para medir tama\u00f1o, lo dejamos
               pasar al loop principal para que maneje el error all\u00e1. */
            toSync.push(fname)
        }
    }

    if (toSync.length === 0) {
        log(
            "\u26d4",
            `Batch 100% >300KB (${skippedLarge.length} archivo(s)) \u2014 skip connect, copy/paste manual.`
        )
        writeReceipt("skipped_large", {
            files,
            skipped_large: skippedLarge,
            reason: "All files exceed 300KB \u2014 skipped connect entirely (v2.10)",
            recommendation:
                "Copy/paste manual en Framer: Assets \u2192 Code \u2192 [archivo] \u2192 Cmd+A \u2192 Cmd+V desde /Users/diego/Documents/Red Solar Viva/Code/[archivo].tsx",
        })
        return
    }

    log(
        "\ud83d\udef0\ufe0f ",
        `Conectando para sync (${toSync.length} archivo(s)${skippedLarge.length > 0 ? `, ${skippedLarge.length} skipped >300KB` : ""})\u2026`
    )

    /* v2.11 \u2014 Sin retries. Si el primer intento de connect falla,
       marcamos TODO el batch como failed y salimos sin bloquear siguientes
       cambios. Antes: 3 retries \u00d7 25s + backoff = hasta 85s perdidos por
       batch cuando la API est\u00e1 flaky. Ahora: 15s m\u00e1ximo de espera,
       receipt inmediato, el pr\u00f3ximo edit puede intentar de nuevo. */
    const CONNECT_TIMEOUT_MS = 15_000
    let framer = null
    let connectErr = null
    try {
        framer = await Promise.race([
            connect(projectUrl, apiKey),
            new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                `Timeout ${CONNECT_TIMEOUT_MS / 1000}s connect`
                            )
                        ),
                    CONNECT_TIMEOUT_MS
                )
            ),
        ])
    } catch (e) {
        connectErr = e
        console.warn(`   \u26a0\ufe0f  connect fall\u00f3: ${e?.message || e}`)
    }
    if (!framer) {
        /* v2.11 \u2014 connect fall\u00f3 = todos los archivos del batch se
           reportan como "failed" con su raz\u00f3n. No tiramos excepci\u00f3n
           para que el watcher siga vivo para el siguiente edit. */
        const failedAll = toSync.map((name) => ({
            name,
            reason: connectErr?.message || "connect failed",
        }))
        log(
            "\u26a0\ufe0f ",
            `Connect fall\u00f3 \u2014 ${failedAll.length} archivo(s) no subidos. Copy/paste manual o reintentar en 1-2 min.`
        )
        writeReceipt("failed", {
            files,
            uploaded: [],
            failed: failedAll,
            skipped_large: skippedLarge,
            error: connectErr?.message || "connect failed",
            recommendation:
                "Framer API intermitente. Tocar el archivo de nuevo para re-disparar el sync, o copy/paste manual si urge.",
        })
        return
    }

    try {
        const allFiles = await framer.getCodeFiles()
        const byName = new Map(
            allFiles.map((cf) => [cf.name.replace(/\.tsx$/, ""), cf])
        )

        let updated = 0
        /* v2.10 \u2014 `skippedLarge` y `toSync` ya vienen pre-poblados desde
           el pre-filtro al inicio de syncFiles. Iteramos solo toSync (los
           que pasaron el gate de 300KB). El check interno sigue como red
           de seguridad por si un archivo creci\u00f3 entre medidas. */
        /* v2.11 \u2014 sin retries de upload. 1 intento por archivo; si
           falla, lo colectamos en failed[] y seguimos al siguiente. Al
           final del batch escribimos receipt con 3 listas: uploaded,
           failed, skipped_large. As\u00ed un solo archivo flaky no bloquea
           los dem\u00e1s del batch. */
        const uploaded = []
        const failed = []
        for (const fname of toSync) {
            const stripped = fname.replace(/\.tsx$/, "")
            const cf = byName.get(stripped) || byName.get(fname)
            if (!cf) {
                console.warn(
                    `   ⚠️  ${fname}: no existe en Framer. Crealo manualmente primero.`
                )
                failed.push({ name: fname, reason: "not found in Framer" })
                continue
            }

            const localPath = join(CODE_DIR, fname)
            const localContent = readFileSync(localPath, "utf-8")

            /* Skip si idéntico */
            const remote =
                typeof cf.fileContent === "string" ? cf.fileContent : ""
            if (remote === localContent) {
                console.log(`   ⏭️  ${fname}: sin cambios reales.`)
                continue
            }

            const kb = (localContent.length / 1024).toFixed(1)
            /* v2.9 \u2014 Hard gate 300KB: Framer API no procesa uploads grandes
               de forma confiable. Skippeamos y esperamos copy/paste manual. */
            if (localContent.length > MAX_AUTO_SYNC_BYTES) {
                console.warn(
                    `   \u26d4 ${fname}: ${kb} KB supera 300KB \u2192 skip auto-sync. Copy/paste manual a Framer.`
                )
                skippedLarge.push({ name: fname, size_kb: Number(kb) })
                continue
            }
            console.log(`   📤 ${fname}: subiendo ${kb} KB…`)
            const t1 = Date.now()
            try {
                await Promise.race([
                    cf.setFileContent(localContent),
                    new Promise((_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        `Timeout ${SYNC_TIMEOUT_MS / 1000}s en setFileContent`
                                    )
                                ),
                            SYNC_TIMEOUT_MS
                        )
                    ),
                ])
                const dt = ((Date.now() - t1) / 1000).toFixed(1)
                console.log(`   ✅ ${fname}: subido en ${dt}s`)
                uploaded.push({ name: fname, size_kb: Number(kb), seconds: Number(dt) })
                updated++
            } catch (e) {
                const dt = ((Date.now() - t1) / 1000).toFixed(1)
                console.warn(
                    `   \u274c ${fname} fall\u00f3 en ${dt}s: ${e?.message || e} \u2014 siguiendo con el resto del batch.`
                )
                failed.push({
                    name: fname,
                    reason: e?.message || String(e),
                })
            }
        }

        if (updated === 0) {
            /* v2.11 \u2014 nada publicado. Diferenciamos 3 casos: */
            if (failed.length > 0) {
                log(
                    "\u274c",
                    `Nada publicado \u2014 ${failed.length} archivo(s) fallaron. Revisar abajo.`
                )
                for (const f of failed) {
                    console.warn(`      \u2022 ${f.name}: ${f.reason}`)
                }
                writeReceipt("failed", {
                    files,
                    uploaded: [],
                    failed,
                    skipped_large: skippedLarge,
                    recommendation:
                        "Tocar los archivos fallidos para re-disparar el sync, o copy/paste manual si urge.",
                })
                return
            }
            if (skippedLarge.length > 0) {
                log(
                    "\u26d4",
                    `Nada publicado \u2014 ${skippedLarge.length} archivo(s) >300KB requieren copy/paste manual.`
                )
                writeReceipt("skipped_large", {
                    files,
                    skipped_large: skippedLarge,
                    reason: "files exceed 300KB auto-sync threshold",
                    recommendation:
                        "Copy/paste manual en Framer: Assets \u2192 Code \u2192 [archivo] \u2192 Cmd+A \u2192 Cmd+V desde /Users/diego/Documents/Red Solar Viva/Code/[archivo].tsx",
                })
                return
            }
            log("⛔", "Nada que publicar.")
            writeReceipt("skipped", { files, reason: "no changes" })
            return
        }

        log("🚀", "Publicando…")
        const t2 = Date.now()
        const { deployment } = await framer.publish()
        const dtPub = ((Date.now() - t2) / 1000).toFixed(1)
        log("✅", `Deployment ${deployment.id} (${dtPub}s)`)

        if (!noDeploy) {
            log("🌐", "Deploy a dominio custom…")
            const hosts = await framer.deploy(deployment.id)
            if (hosts.length > 0) {
                for (const h of hosts) log("🟢", `https://${h.hostname}`)
            } else {
                log("ℹ️ ", "Sitio default actualizado.")
            }
        }

        /* v2.4 \u2014 Auto-commit a git despu\u00e9s de cada sync exitoso.
           Cada sync a Framer = 1 commit en el repo local. As\u00ed cada versi\u00f3n
           de cada componente queda archivada para rollback futuro. Nunca
           falla el sync si git falla (try/catch suprime errores). */
        try {
            const filesStr = files.join(", ")
            const shortStamp = new Date()
                .toLocaleString("es-MX", {
                    timeZone: "America/Mexico_City",
                    hour12: false,
                })
                .replace(",", "")
            const msg = `Auto-sync: ${filesStr} @ ${shortStamp}`
            const { stdout } = await exec(
                `cd "${CODE_DIR}" && git add -A && git diff --cached --quiet || git commit -m ${JSON.stringify(msg)}`
            )
            if (stdout.includes("main")) {
                log("\ud83d\udcdd", `Commit: ${filesStr}`)
            }
        } catch (gitErr) {
            console.warn(
                "   \u26a0\ufe0f  git auto-commit fall\u00f3 (no bloquea sync):",
                gitErr?.message || gitErr
            )
        }

        /* v2.1 \u2014 Trigger iPhone reload (salvo que est\u00e9 el marker) */
        const skipIphone = existsSync(SKIP_IPHONE_MARKER)
        const holdIphone = existsSync(HOLD_IPHONE_MARKER)
        if (skipIphone) {
            log("\ud83d\udda5", "Marker desktop-only detectado \u2014 skip iPhone reload.")
            try {
                unlinkSync(SKIP_IPHONE_MARKER)
            } catch {}
        } else if (holdIphone) {
            /* v2.3 \u2014 durante un lote de edits de Claude, skipeamos reload
               pero marcamos que hay cambios pendientes para reloadear cuando
               el marker se borre. */
            pendingHoldedReload = true
            log("\u23f8\ufe0f ", "Hold marker activo \u2014 sync subido a Framer, iPhone reload postergado.")
        } else if (reloadUrl) {
            const r = await fetch(reloadUrl, { method: "POST" }).catch(
                () => null
            )
            if (r?.ok) log("📱", "iPhone notificado.")
        }

        const total = ((Date.now() - t0) / 1000).toFixed(1)
        /* v2.11 \u2014 resumen claro al final: cu\u00e1ntos subieron, cu\u00e1ntos
           fallaron, cu\u00e1ntos requieren copy/paste manual. */
        const summary =
            `\u2713 ${uploaded.length}` +
            (failed.length > 0 ? ` \u00b7 \u2717 ${failed.length}` : "") +
            (skippedLarge.length > 0 ? ` \u00b7 \u26d4 ${skippedLarge.length}` : "")
        log("🌟", `Sync completado en ${total}s (${summary})`)
        if (failed.length > 0) {
            console.warn("   Archivos fallidos:")
            for (const f of failed) {
                console.warn(`      \u2022 ${f.name}: ${f.reason}`)
            }
        }
        if (skippedLarge.length > 0) {
            console.log("   Archivos >300KB (copy/paste manual):")
            for (const s of skippedLarge) {
                console.log(`      \u2022 ${s.name}: ${s.size_kb} KB`)
            }
        }
        writeReceipt(
            failed.length > 0 ? "partial_success" : "success",
            {
                files,
                deployment_id: deployment.id,
                duration_s: Number(total),
                published: true,
                uploaded,
                failed,
                skipped_large: skippedLarge,
            }
        )
    } finally {
        await framer.disconnect().catch(() => {})
    }
}

/* ── Debounce + queue ── */
const pending = new Set()
let debounceTimer = null
let syncing = false

const flush = async () => {
    debounceTimer = null
    if (syncing) {
        /* v2.2 \u2014 durante un sync, NO re-schedulear flush ni timer.
           Los cambios nuevos quedan acumulados en `pending` y se despachan
           al finalizar el sync actual (ver finally). As\u00ed evitamos el
           patr\u00f3n "sync + reload" \u2192 "sync + reload" encadenado. */
        return
    }
    const files = [...pending]
    pending.clear()
    if (files.length === 0) return

    syncing = true
    try {
        log("📡", `Cambios: ${files.join(", ")}`)
        await syncFiles(files)
    } catch (e) {
        const errMsg = e?.message || String(e)
        console.error(`   ❌ ${errMsg}`)
        /* v2.7 \u2014 receipt: registrar el fallo para que Claude lo vea */
        writeReceipt("failed", {
            files,
            error: errMsg,
            recommendation: errMsg.includes("Timeout") && files.some(
                (f) => readFileSync(join(CODE_DIR, f), "utf-8").length > 300_000
            )
                ? "El archivo supera ~300KB. Framer API timeouta procesando archivos grandes. Copiar/pegar manualmente a Framer."
                : errMsg.includes("Timeout") || errMsg.includes("Internal")
                  ? "Framer API intermitente. Reintentar en 1-2 min o copiar/pegar manualmente."
                  : "Error desconocido. Revisar logs del watcher.",
        })
    } finally {
        syncing = false
        /* v2.2 \u2014 si llegaron cambios durante el sync, disparar un solo
           nuevo debounce (no uno por archivo). Colapsa N cambios \u2192 1 reload. */
        if (pending.size > 0) {
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(flush, DEBOUNCE_MS)
        }
    }
}

const enqueue = (fname) => {
    pending.add(fname)
    /* v2.2 \u2014 si estamos en medio de un sync, NO re-armar el timer;
       ya hay un flush pendiente que correr\u00e1 al finalizar el sync actual. */
    if (syncing) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(flush, DEBOUNCE_MS)
}

const knownFiles = new Set(
    readdirSync(CODE_DIR).filter((f) => f.endsWith(".tsx"))
)
log("👁️ ", `Archivos: ${[...knownFiles].join(", ")}`)

const watcher = watch(CODE_DIR, { persistent: true }, (event, fname) => {
    if (!fname || !fname.endsWith(".tsx")) return
    enqueue(fname)
})

/* v2.3 \u2014 watcher del hold marker: cuando desaparece y hubo syncs durante
   el hold, disparar un reload final al iPhone. As\u00ed Claude puede hacer
   N edits durante un batch y el iPhone s\u00f3lo recarga 1 vez al final.
   v2.5 \u2014 FIX: el reload ahora ESPERA a que no haya sync en curso NI debounce
   pendiente. Antes disparaba el reload inmediatamente al borrar el marker,
   incluso si el sync asociado al \u00faltimo edit a\u00fan no hab\u00eda terminado,
   provocando que el iPhone recargara con la versi\u00f3n VIEJA. */
const HOLD_DIR = __dirname
const HOLD_NAME = basename(HOLD_IPHONE_MARKER)
const fireHoldedReload = async () => {
    if (syncing || debounceTimer) {
        /* esperar: hay un sync en curso o cambios pendientes en el debounce.
           cuando terminen, vuelvo a chequear. */
        setTimeout(fireHoldedReload, 400)
        return
    }
    if (!pendingHoldedReload) return
    pendingHoldedReload = false
    log(
        "\ud83d\udcf1",
        "Hold marker removido + sync completo \u2014 reload final."
    )
    if (reloadUrl) {
        const r = await fetch(reloadUrl, { method: "POST" }).catch(
            () => null
        )
        if (r?.ok) log("\ud83d\udcf1", "iPhone notificado (batch final).")
    }
}
const holdWatcher = watch(
    HOLD_DIR,
    { persistent: true },
    (event, fname) => {
        if (fname !== HOLD_NAME) return
        if (existsSync(HOLD_IPHONE_MARKER)) return /* creado o tocado, no borrado */
        if (!pendingHoldedReload) return /* no hubo syncs durante el hold */
        fireHoldedReload()
    }
)

const cleanup = async () => {
    log("👋", "Cerrando…")
    watcher.close()
    holdWatcher.close()
    if (debounceTimer) {
        clearTimeout(debounceTimer)
        if (pending.size > 0) await flush() /* sync final pendiente */
    }
    process.exit(0)
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)
