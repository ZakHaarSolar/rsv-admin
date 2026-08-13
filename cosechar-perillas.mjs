#!/usr/bin/env node
// cosechar-perillas.mjs v1.0 — saca de Framer los valores GUARDADOS de todas
// las perillas (property controls) y los deja en un JSON.
//
// 🜂 POR QUÉ EXISTE: los valores que Zak fue poniendo en el panel derecho de
// Framer NO viven en el código. El código solo tiene los `defaultValue`, y el
// valor guardado en el canvas le gana al default (es la trampa documentada como
// "hardcode-over-Framer-saved-state"). Para salir de Framer sin perder
// configuración hay que leer lo que el canvas tiene guardado HOY.
//
// Lee y no escribe nada: usa `node.controls`, que la API expone de solo lectura.
//
// Uso:  cd admin && node --env-file=.env cosechar-perillas.mjs
// Sale: admin/perillas-framer.json

import { connect } from "framer-api"
import { writeFileSync } from "node:fs"

const projectUrl = process.env.FRAMER_PROJECT_URL
const apiKey = process.env.FRAMER_API_KEY
if (!projectUrl || !apiKey) {
    console.error("Faltan FRAMER_PROJECT_URL o FRAMER_API_KEY en el entorno.")
    process.exit(1)
}

const framer = await connect(projectUrl, apiKey)

try {
    let nodos = []
    // Camino rápido si la API lo permite; si no, se recorre el canvas a mano.
    try {
        nodos = await framer.getNodesWithType("ComponentInstanceNode")
    } catch {
        const root = await framer.getCanvasRoot()
        const pendientes = [root]
        while (pendientes.length) {
            const n = pendientes.pop()
            if (!n) continue
            if (n?.controls) nodos.push(n)
            try {
                const hijos = await framer.getChildren(n)
                if (Array.isArray(hijos)) pendientes.push(...hijos)
            } catch {
                /* nodo sin hijos */
            }
        }
    }

    const salida = []
    for (const n of nodos) {
        const controls = n?.controls
        if (!controls || Object.keys(controls).length === 0) continue
        salida.push({
            componente: n.componentName || n.componentIdentifier || "(sin nombre)",
            nombreEnCanvas: n.name || null,
            identificador: n.componentIdentifier || null,
            perillas: controls,
        })
    }

    salida.sort((a, b) =>
        Object.keys(b.perillas).length - Object.keys(a.perillas).length
    )

    writeFileSync(
        new URL("./perillas-framer.json", import.meta.url),
        JSON.stringify({ generado: new Date().toISOString(), instancias: salida }, null, 2)
    )

    console.log(`Instancias con perillas: ${salida.length}`)
    for (const s of salida) {
        console.log(
            `  ${String(Object.keys(s.perillas).length).padStart(4)} · ${s.componente}${s.nombreEnCanvas ? ` (${s.nombreEnCanvas})` : ""}`
        )
    }
    console.log("\nEscrito: admin/perillas-framer.json")
} finally {
    await framer.disconnect()
}
