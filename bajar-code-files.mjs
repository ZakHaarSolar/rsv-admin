#!/usr/bin/env node
// bajar-code-files.mjs v1.0 — trae de Framer TODOS los Code Files y los compara
// con la carpeta Code/ del disco.
//
// 🜂 POR QUÉ: el watcher solo EMPUJA. Nunca bajó nada, así que cualquier archivo
// creado o editado dentro de Framer vive únicamente allá. El primer build fuera
// de Framer lo destapó: AuthOverrides.tsx lo importan EscanerVibracional y
// NavegadorLente, y no está en Code/.
//
// No pisa nada: escribe en admin/desde-framer/ y sale un reporte.
import { connect } from "framer-api"
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const OUT = resolve("desde-framer")
const CODE = resolve("../Code")
mkdirSync(OUT, { recursive: true })

const framer = await connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY)
try {
    const lista = await framer.getCodeFiles()
    const faltan = [], distintos = [], iguales = []
    /* 🜂 getCodeFiles() devuelve MANIJAS: su `content` no está cargado y puede
       entregar el texto de otro archivo (verificado el 2026-08-10, Domo.tsx
       devolvía el contenido de MotorDeIntervencion). Hay que pedir cada archivo
       por su id para tener el texto real. */
    for (const h of lista) {
        const f = (await framer.getCodeFile(h.id)) || h
        const nombre = h.name
        const contenido = f.content ?? ""
        writeFileSync(resolve(OUT, nombre), contenido)
        const enDisco = resolve(CODE, nombre)
        if (!existsSync(enDisco)) faltan.push([nombre, contenido.length])
        else if (readFileSync(enDisco, "utf8") !== contenido)
            distintos.push([nombre, readFileSync(enDisco, "utf8").length, contenido.length])
        else iguales.push(nombre)
    }
    console.log(`Code Files en Framer: ${lista.length}`)
    console.log(`  idénticos a Code/: ${iguales.length}`)
    console.log(`  distintos        : ${distintos.length}`)
    console.log(`  NO están en Code/: ${faltan.length}`)
    if (faltan.length) {
        console.log("\n=== SOLO EN FRAMER (hay que traerlos) ===")
        for (const [n, b] of faltan.sort()) console.log(`  ${String(b).padStart(8)} B  ${n}`)
    }
    if (distintos.length) {
        console.log("\n=== DIFIEREN (disco vs Framer) ===")
        for (const [n, a, b] of distintos.sort()) console.log(`  disco=${String(a).padStart(7)}  framer=${String(b).padStart(7)}  ${n}`)
    }
    console.log("\nBajados a admin/desde-framer/")
} finally { await framer.disconnect() }
