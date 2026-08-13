// checkexports.mjs — verificación independiente del generador.
//
// Recorre los archivos generados y, por cada `const { A, B } = X` donde X es el
// default import de un archivo hermano del mismo directorio, comprueba que A y B
// estén REALMENTE en el Object.assign de ese archivo. Es el fallo que compila
// limpio, sube a Framer sin quejarse y revienta recién al renderizar, con el
// nombre llegando como `undefined`.
//
// Uso: node checkexports.mjs <dir1> [dir2 ...]

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(
    "/Users/diego/Documents/Red Solar Viva/escaner-app/package.json"
)
const ts = require("typescript")

const dirs = process.argv.slice(2)
if (!dirs.length) {
    console.error("uso: node checkexports.mjs <dir> [dir...]")
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

// nombres que un archivo expone por su default export Object.assign(...)
function exportedNames(sf) {
    const out = new Set()
    const visit = (n) => {
        if (
            ts.isCallExpression(n) &&
            ts.isPropertyAccessExpression(n.expression) &&
            n.expression.expression.getText() === "Object" &&
            n.expression.name.text === "assign"
        ) {
            for (const arg of n.arguments.slice(1)) {
                if (!ts.isObjectLiteralExpression(arg)) continue
                for (const p of arg.properties) {
                    if (ts.isShorthandPropertyAssignment(p)) out.add(p.name.text)
                    else if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name))
                        out.add(p.name.text)
                }
            }
        }
        n.forEachChild(visit)
    }
    sf.statements.forEach(visit)
    return out
}

let bad = 0
let checked = 0
for (const dir of dirs) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"))
    const cache = new Map()
    const exportsOf = (base) => {
        if (!cache.has(base)) {
            const p = path.join(dir, base + ".tsx")
            cache.set(base, fs.existsSync(p) ? exportedNames(parse(p)) : null)
        }
        return cache.get(base)
    }

    for (const f of files) {
        const sf = parse(path.join(dir, f))
        // alias local -> archivo hermano
        const alias = new Map()
        for (const st of sf.statements) {
            if (!ts.isImportDeclaration(st)) continue
            const spec = st.moduleSpecifier.text
            const m = /^\.\/(.+)\.tsx$/.exec(spec)
            if (!m) continue
            const c = st.importClause
            if (c?.name) alias.set(c.name.text, m[1])
        }
        for (const st of sf.statements) {
            if (!ts.isVariableStatement(st)) continue
            for (const d of st.declarationList.declarations) {
                if (!d.initializer || !ts.isIdentifier(d.initializer)) continue
                if (!ts.isObjectBindingPattern(d.name)) continue
                const base = alias.get(d.initializer.text)
                if (!base) continue
                const avail = exportsOf(base)
                if (avail === null) continue // hermano fuera de este dir
                for (const el of d.name.elements) {
                    const want = (el.propertyName || el.name).getText()
                    checked++
                    if (!avail.has(want)) {
                        console.log(
                            `✗ ${f}: destructura "${want}" de ${base}, que NO lo exporta`
                        )
                        bad++
                    }
                }
            }
        }
    }
}
console.log(
    bad
        ? `\n${bad} referencias rotas de ${checked} comprobadas`
        : `✓ ${checked} referencias entre archivos, todas exportadas`
)
process.exit(bad ? 2 : 0)
