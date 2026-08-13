// partition.mjs — parte un .tsx en bloques top-level usando el parser REAL de
// TypeScript (no regex, no conteo de llaves, no búsqueda de patrones de cierre).
//
// Garantía dura: header + Σ(bloques) + tail === archivo original, byte por byte.
// Si esa igualdad falla, el script aborta ANTES de escribir nada.
//
// Uso: node partition.mjs <archivo.tsx>  → imprime manifiesto JSON en stdout
//      node partition.mjs <archivo.tsx> --dump <dir>  → además escribe cada bloque

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(
    "/Users/diego/Documents/Red Solar Viva/escaner-app/package.json"
)
const ts = require("typescript")

const file = process.argv[2]
if (!file) {
    console.error("uso: node partition.mjs <archivo.tsx> [--dump <dir>]")
    process.exit(1)
}
const dumpIdx = process.argv.indexOf("--dump")
const dumpDir = dumpIdx > -1 ? process.argv[dumpIdx + 1] : null

const text = fs.readFileSync(file, "utf8")
const sf = ts.createSourceFile(
    path.basename(file),
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
)

// ── nombres declarados por cada statement top-level ────────────────────────
function namesOf(st) {
    const out = []
    if (ts.isFunctionDeclaration(st) && st.name) out.push(st.name.text)
    else if (ts.isClassDeclaration(st) && st.name) out.push(st.name.text)
    else if (ts.isTypeAliasDeclaration(st)) out.push(st.name.text)
    else if (ts.isInterfaceDeclaration(st)) out.push(st.name.text)
    else if (ts.isEnumDeclaration(st)) out.push(st.name.text)
    else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
            if (ts.isIdentifier(d.name)) out.push(d.name.text)
            else if (
                ts.isObjectBindingPattern(d.name) ||
                ts.isArrayBindingPattern(d.name)
            ) {
                for (const el of d.name.elements) {
                    if (ts.isBindingElement(el) && ts.isIdentifier(el.name))
                        out.push(el.name.text)
                }
            }
        }
    }
    return out
}

const kindOf = (st) => {
    if (ts.isImportDeclaration(st)) return "import"
    if (ts.isExportAssignment(st)) return "export-default"
    if (ts.isExportDeclaration(st)) return "export"
    if (ts.isFunctionDeclaration(st)) return "function"
    if (ts.isClassDeclaration(st)) return "class"
    if (ts.isTypeAliasDeclaration(st)) return "type"
    if (ts.isInterfaceDeclaration(st)) return "interface"
    if (ts.isEnumDeclaration(st)) return "enum"
    if (ts.isVariableStatement(st)) return "var"
    return "stmt"
}

const stmts = sf.statements
if (!stmts.length) {
    console.error("!! sin statements top-level")
    process.exit(1)
}

// getFullStart() incluye la trivia previa (los comentarios de cabecera viajan
// pegados a su declaración, que es exactamente lo que queremos al mover código).
const blocks = stmts.map((st, i) => {
    const start = st.getFullStart()
    const end = st.getEnd()
    return {
        i,
        kind: kindOf(st),
        names: namesOf(st),
        start,
        end,
        line: sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1,
        text: text.slice(start, end),
    }
})

const header = text.slice(0, blocks[0].start)
const tail = text.slice(blocks[blocks.length - 1].end)

// ── LA VERIFICACIÓN QUE MANDA ─────────────────────────────────────────────
// Si esto no es idéntico byte a byte, la partición está mal y no se escribe nada.
const rebuilt = header + blocks.map((b) => b.text).join("") + tail
if (rebuilt !== text) {
    console.error("!! FALLO DE REENSAMBLE — la partición NO es lossless. Abortado.")
    console.error(`   original=${text.length}  reensamblado=${rebuilt.length}`)
    process.exit(2)
}

// contigüidad: cada bloque arranca donde terminó el anterior
for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].start !== blocks[i - 1].end) {
        console.error(`!! HUECO entre bloque ${i - 1} y ${i}. Abortado.`)
        process.exit(2)
    }
}

// errores de sintaxis del propio parser
const diags = sf.parseDiagnostics || []
if (diags.length) {
    console.error(`!! ${diags.length} errores de parseo en ${file}:`)
    for (const d of diags.slice(0, 5)) {
        const { line } = sf.getLineAndCharacterOfPosition(d.start)
        console.error(
            `   L${line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`
        )
    }
    process.exit(2)
}

if (dumpDir) {
    fs.mkdirSync(dumpDir, { recursive: true })
    fs.writeFileSync(path.join(dumpDir, "__header__.txt"), header)
    fs.writeFileSync(path.join(dumpDir, "__tail__.txt"), tail)
    for (const b of blocks) {
        const nm = (b.names[0] || `${b.kind}_${b.i}`).replace(/[^\w.-]/g, "_")
        fs.writeFileSync(
            path.join(dumpDir, `${String(b.i).padStart(3, "0")}__${nm}.txt`),
            b.text
        )
    }
}

console.log(
    JSON.stringify(
        {
            file,
            bytes: text.length,
            headerBytes: header.length,
            tailBytes: tail.length,
            count: blocks.length,
            lossless: true,
            blocks: blocks.map(({ text, ...b }) => ({
                ...b,
                bytes: text.length,
            })),
        },
        null,
        1
    )
)
