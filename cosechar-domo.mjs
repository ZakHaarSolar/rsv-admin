#!/usr/bin/env node
// cosechar-domo.mjs v1.0 — saca de Framer los 77 valores guardados de <Domo />
// por cada una de las 26 páginas, y los deja listos para rsv-web.
//
// 🜂 POR QUÉ EXISTE Y POR QUÉ NO SE HIZO ANTES. El 2026-08-10 medí estas mismas
// instancias y dieron CERO perillas guardadas, y sobre esa medición se armó
// todo el plan de migración. La medición estaba MAL: en ese momento el archivo
// Domo.tsx de Framer estaba corrupto (tenía adentro el código de
// MotorDeIntervencion), y sin el componente correcto Framer no puede resolver
// el esquema de property controls, así que devuelve la lista vacía. No era que
// no hubiera valores: era que no se podían leer. Al restaurar Domo.tsx
// aparecieron los 77.
//
// LECCIÓN: un "no hay nada" leído de una API se confirma con una segunda vía
// antes de construir encima. Acá el síntoma en pantalla (logo ausente, portadas
// en blanco, textos distintos) fue el que delató el error.
//
// De los 77 valores, 73 son idénticos en las 26 páginas. Solo 4 cambian
// (sesionesBenefitsGrupal, sesionesPasses, explorationEmailWebhookUrl,
// simIntroVideoUrl), así que se guarda una BASE + excepciones por ruta.
//
// Salida:
//   admin/domo-perillas.json         (crudo, con las URLs de Framer)
//   admin/domo-assets.txt            (lista de archivos a bajar)
//
// Uso: cd admin && node --env-file=.env cosechar-domo.mjs

import { connect } from "framer-api"
import { writeFileSync } from "node:fs"

const framer = await connect(process.env.FRAMER_PROJECT_URL, process.env.FRAMER_API_KEY)

try {
    const pages = await framer.getNodesWithType("WebPageNode")
    const porRuta = {}
    for (const p of pages) {
        const ruta = p.path || p.name || "?"
        let comps = []
        try {
            comps = await p.getNodesWithType("ComponentInstanceNode")
        } catch {
            continue
        }
        const d = comps.find((c) =>
            String(c.componentIdentifier || "").includes("d6RMaTw")
        )
        if (!d) continue
        porRuta[ruta] = d.controls || {}
    }

    const rutas = Object.keys(porRuta)
    if (!rutas.length) throw new Error("no se encontró ninguna instancia de Domo")

    /* La base sale de "/" — es la página que Zak compara y la más representativa.
       Si no existiera, se toma la primera. */
    const rutaBase = porRuta["/"] ? "/" : rutas[0]
    const base = porRuta[rutaBase]

    /* 🜂 Las diferencias se guardan como { set, unset } y NO como un objeto
       suelto. Motivo: varias rutas difieren de la base porque NO tienen una
       perilla que la base sí trae (aquaImage es el caso), y `undefined`
       desaparece al serializar a JSON — el override quedaba `{}` y la ruta
       heredaba un valor que en Framer no tenía. `unset` lo dice explícito. */
    const overrides = {}
    for (const [ruta, vals] of Object.entries(porRuta)) {
        if (ruta === rutaBase) continue
        const set = {}
        const unset = []
        for (const k of new Set([...Object.keys(base), ...Object.keys(vals)])) {
            if (JSON.stringify(base[k]) === JSON.stringify(vals[k])) continue
            if (vals[k] === undefined) unset.push(k)
            else set[k] = vals[k]
        }
        if (Object.keys(set).length || unset.length)
            overrides[ruta] = { set, unset }
    }

    const salida = { rutaBase, base, overrides }
    writeFileSync("domo-perillas.json", JSON.stringify(salida, null, 2))

    const txt = JSON.stringify(salida)
    const urls = [
        ...new Set(txt.match(/https:\/\/framerusercontent\.com\/[^"\\?]+/g) || []),
    ]
    /* Con salto final: un archivo sin \n al final hace que `while read`
       se salte la ÚLTIMA línea, y ese archivo no se baja. */
    writeFileSync("domo-assets.txt", urls.join("\n") + "\n")

    console.log(`páginas con Domo: ${rutas.length}`)
    console.log(`perillas en la base (${rutaBase}): ${Object.keys(base).length}`)
    console.log(`rutas con excepciones: ${Object.keys(overrides).length}`)
    for (const [r, d] of Object.entries(overrides))
        console.log(
            `   ${r} → set: ${Object.keys(d.set).join(", ") || "-"} | unset: ${d.unset.join(", ") || "-"}`
        )
    console.log(`\narchivos del CDN de Framer a bajar: ${urls.length}`)
    console.log("escrito: admin/domo-perillas.json + admin/domo-assets.txt")
} finally {
    await framer.disconnect()
}
