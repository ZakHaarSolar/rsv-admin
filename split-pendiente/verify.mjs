// verify.mjs — prueba INDEPENDIENTE del generador, mirando solo el resultado.
//
// Parte el original en bloques top-level y parte cada archivo generado igual.
// Después exige que:
//   · cada bloque del original aparezca TEXTUALMENTE (comentarios incluidos) en
//     exactamente UN archivo generado;
//   · todo lo que aparece en los generados y no viene del original sea
//     únicamente andamiaje esperado (imports, el ghost wrapper, el Object.assign,
//     el export default y los espejos de tipos declarados a mano).
//
// Uso: node verify.mjs <original.tsx> <dirGenerado>

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(
    "/Users/diego/Documents/Red Solar Viva/escaner-app/package.json"
)
const ts = require("typescript")

const [, , origPath, genDir] = process.argv
if (!origPath || !genDir) {
    console.error("uso: node verify.mjs <original.tsx> <dirGenerado>")
    process.exit(1)
}

function blocksOf(p) {
    const src = fs.readFileSync(p, "utf8")
    const sf = ts.createSourceFile(
        path.basename(p),
        src,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    )
    return sf.statements.map((st) => ({
        // 🜂 ts.SyntaxKind[kind] NO sirve para clasificar: los valores están
        // aliasados (VariableStatement y FirstStatement comparten número), así
        // que la búsqueda inversa devuelve el alias. Se pregunta con los
        // predicados, que sí son exactos.
        isImport: ts.isImportDeclaration(st),
        // `const { a, b } = Otro` — andamiaje que se repite a propósito en cada
        // archivo (el destructuring de EV_Shared / MI_Shared y compañía).
        isDestructure:
            ts.isVariableStatement(st) &&
            st.declarationList.declarations.length === 1 &&
            ts.isObjectBindingPattern(st.declarationList.declarations[0].name) &&
            !!st.declarationList.declarations[0].initializer &&
            ts.isIdentifier(st.declarationList.declarations[0].initializer),
        isFunction: ts.isFunctionDeclaration(st),
        isVar: ts.isVariableStatement(st),
        isExpr: ts.isExpressionStatement(st),
        isExportAssign: ts.isExportAssignment(st),
        isType: ts.isTypeAliasDeclaration(st),
        text: src.slice(st.getFullStart(), st.getEnd()).trim(),
        head: src
            .slice(st.getStart(sf), Math.min(st.getEnd(), st.getStart(sf) + 60))
            .split("\n")[0],
    }))
}

const orig = blocksOf(origPath)
const origByText = new Map()
orig.forEach((b, i) => {
    if (!origByText.has(b.text)) origByText.set(b.text, [])
    origByText.get(b.text).push(i)
})

// El "aparece exactamente una vez" aplica solo a los bloques de CÓDIGO. Los
// imports y los destructurings de los módulos compartidos son andamiaje que se
// repite a propósito en cada archivo del split.
const esCodigo = (b) => !b.isImport && !b.isDestructure
const covered = new Map() // idx -> [archivos]
const extras = [] // bloques generados que no vienen del original

for (const f of fs.readdirSync(genDir).filter((x) => x.endsWith(".tsx")).sort()) {
    for (const b of blocksOf(path.join(genDir, f))) {
        if (!esCodigo(b)) continue // andamiaje: puede repetirse
        const hit = origByText.get(b.text)
        if (hit) {
            // si el mismo texto aparece varias veces en el original, consumimos
            // una ocurrencia por vez
            const idx = hit.find((i) => !covered.has(i)) ?? hit[0]
            if (!covered.has(idx)) covered.set(idx, [])
            covered.get(idx).push(f)
        } else {
            extras.push({ file: f, ...b })
        }
    }
}

let bad = 0
const missing = orig
    .map((b, i) => [i, b])
    .filter(([i, b]) => esCodigo(b) && !covered.has(i))
if (missing.length) {
    console.log(`✗ ${missing.length} bloques del original NO aparecen en el resultado:`)
    for (const [i, b] of missing.slice(0, 10)) console.log(`    #${i} ${b.head}`)
    bad = 1
}
const dup = [...covered.entries()].filter(([, fs_]) => fs_.length > 1)
if (dup.length) {
    console.log(`✗ ${dup.length} bloques DUPLICADOS en más de un archivo:`)
    for (const [i, fs_] of dup.slice(0, 10))
        console.log(`    #${i} ${orig[i].head} → ${fs_.join(", ")}`)
    bad = 1
}

// andamiaje permitido: imports, el ghost wrapper y su displayName, los
// destructurings, el Object.assign final, el export default y los espejos de
// tipo declarados a mano.
const weird = extras.filter(
    (e) =>
        !e.isImport &&
        !e.isFunction &&
        !e.isExpr &&
        !e.isVar &&
        !e.isExportAssign &&
        !e.isType
)
if (weird.length) {
    console.log(`✗ ${weird.length} bloques generados de tipo inesperado:`)
    for (const e of weird.slice(0, 10)) console.log(`    ${e.file}: ${e.head}`)
    bad = 1
}

if (!bad) {
    console.log(
        `✓ ${orig.filter(esCodigo).length}/${orig.filter(esCodigo).length} bloques de código del original presentes, sin duplicados` +
            ` · ${extras.length} bloques de andamiaje (imports, ghost wrapper, export)`
    )
}
process.exit(bad)
