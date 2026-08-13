// checkrefs.mjs — prueba que ningún identificador perdió su definición al mover
// el código de archivo.
//
// Idea: los cuerpos viajan byte por byte, así que el alcance LOCAL (variables
// dentro de funciones) no cambió. Lo único que puede romperse son los nombres
// que en el ORIGINAL se resolvían a nivel de archivo: declaraciones top-level e
// imports. Ese es el conjunto de riesgo. Para cada archivo generado se exige que
// todo nombre de riesgo que usa esté declarado ahí o importado ahí.
//
// Uso: node checkrefs.mjs <original.tsx> <dirGenerado>

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(
    "/Users/diego/Documents/Red Solar Viva/escaner-app/package.json"
)
const ts = require("typescript")

const [, , origPath, genDir] = process.argv
if (!origPath || !genDir) {
    console.error("uso: node checkrefs.mjs <original.tsx> <dirGenerado>")
    process.exit(1)
}

const parse = (p) =>
    ts.createSourceFile(
        path.basename(p),
        fs.readFileSync(p, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    )

function declaredNames(sf) {
    const out = new Set()
    const addBinding = (name) => {
        if (!name) return
        if (ts.isIdentifier(name)) out.add(name.text)
        else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
            for (const el of name.elements)
                if (ts.isBindingElement(el)) addBinding(el.name)
    }
    for (const st of sf.statements) {
        if (ts.isImportDeclaration(st)) {
            const c = st.importClause
            if (!c) continue
            if (c.name) out.add(c.name.text)
            if (c.namedBindings) {
                if (ts.isNamespaceImport(c.namedBindings))
                    out.add(c.namedBindings.name.text)
                else
                    for (const e of c.namedBindings.elements) out.add(e.name.text)
            }
        } else if (
            ts.isFunctionDeclaration(st) ||
            ts.isClassDeclaration(st) ||
            ts.isTypeAliasDeclaration(st) ||
            ts.isInterfaceDeclaration(st) ||
            ts.isEnumDeclaration(st)
        ) {
            if (st.name) out.add(st.name.text)
        } else if (ts.isVariableStatement(st)) {
            for (const d of st.declarationList.declarations) addBinding(d.name)
        }
    }
    return out
}

function identsOf(sf) {
    const out = new Set()
    const walk = (n) => {
        if (ts.isIdentifier(n)) out.add(n.text)
        n.forEachChild(walk)
    }
    sf.statements.forEach(walk)
    return out
}

const orig = parse(origPath)
const risky = declaredNames(orig) // top-level + imports del original

const files = fs
    .readdirSync(genDir)
    .filter((f) => f.endsWith(".tsx"))
    .sort()

let bad = 0
for (const f of files) {
    const sf = parse(path.join(genDir, f))
    const diags = sf.parseDiagnostics || []
    if (diags.length) {
        const { line } = orig.getLineAndCharacterOfPosition(0)
        console.log(`✗ ${f} — ${diags.length} errores de parseo`)
        for (const d of diags.slice(0, 3)) {
            const lc = sf.getLineAndCharacterOfPosition(d.start)
            console.log(
                `    L${lc.line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`
            )
        }
        bad++
        continue
    }
    const have = declaredNames(sf)
    const used = identsOf(sf)
    const unresolved = [...used].filter((n) => risky.has(n) && !have.has(n))
    if (unresolved.length) {
        console.log(`✗ ${f} — ${unresolved.length} sin definir: ${unresolved.join(", ")}`)
        bad++
    } else {
        console.log(`✓ ${f}`)
    }
}
process.exit(bad ? 2 : 0)
