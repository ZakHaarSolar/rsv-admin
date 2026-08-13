// split.mjs — genera los archivos del split a partir de un plan declarativo.
//
// Invariantes que se verifican ANTES de escribir nada (si una falla, aborta):
//  1. La partición del origen es lossless (partition.mjs ya lo probó).
//  2. Cada bloque del origen se asigna a EXACTAMENTE un destino.
//  3. El texto de cada bloque viaja byte por byte (no se reescribe nada).
//  4. Toda referencia cruzada entre destinos queda cubierta por un import
//     generado Y por el export correspondiente del archivo dueño.
//  5. Ningún TIPO cruza de archivo (no viajan por el default Object.assign).
//  6. Nadie depende del shell (eso sería un ciclo).
//
// Los identificadores salen de un recorrido del AST, no de un scanner sobre el
// texto: el scanner crudo confunde el `/` de un cierre JSX con el inicio de una
// expresión regular y se traga identificadores por el camino.

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(
    "/Users/diego/Documents/Red Solar Viva/escaner-app/package.json"
)
const ts = require("typescript")

const planPath = process.argv[2]
const outDir = process.argv[3]
if (!planPath || !outDir) {
    console.error("uso: node split.mjs <plan.json> <outDir>")
    process.exit(1)
}
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"))
const srcPath = plan.source
const text = fs.readFileSync(srcPath, "utf8")
const die = (m) => {
    console.error("!! " + m)
    process.exit(2)
}

const sf = ts.createSourceFile(
    path.basename(srcPath),
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
)

function namesOf(st) {
    const out = []
    const addBinding = (name) => {
        if (!name) return
        if (ts.isIdentifier(name)) out.push(name.text)
        else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
            for (const el of name.elements)
                if (ts.isBindingElement(el)) addBinding(el.name)
    }
    if (ts.isFunctionDeclaration(st) && st.name) out.push(st.name.text)
    else if (ts.isClassDeclaration(st) && st.name) out.push(st.name.text)
    else if (ts.isTypeAliasDeclaration(st)) out.push(st.name.text)
    else if (ts.isInterfaceDeclaration(st)) out.push(st.name.text)
    else if (ts.isEnumDeclaration(st)) out.push(st.name.text)
    else if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations) addBinding(d.name)
    return out
}
const isTypeOnly = (st) =>
    ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st)

function identsOfNode(node) {
    const out = new Set()
    const walk = (n) => {
        if (ts.isIdentifier(n)) out.add(n.text)
        n.forEachChild(walk)
    }
    walk(node)
    return out
}

const stmts = sf.statements
const blocks = stmts.map((st, i) => ({
    i,
    names: namesOf(st),
    typeOnly: isTypeOnly(st),
    text: text.slice(st.getFullStart(), st.getEnd()),
    idents: identsOfNode(st),
}))
const tail = text.slice(stmts[stmts.length - 1].getEnd())

// ── asignación ────────────────────────────────────────────────────────────
const owner = new Map()
for (const t of plan.targets)
    for (const i of t.blocks) {
        if (i < 0 || i >= blocks.length)
            die(`bloque ${i} fuera de rango (0..${blocks.length - 1})`)
        if (owner.has(i))
            die(
                `bloque ${i} (${blocks[i].names.join(",")}) asignado dos veces: ${owner.get(i)} y ${t.file}`
            )
        owner.set(i, t.file)
    }
const missing = blocks.filter((b) => !owner.has(b.i))
if (missing.length)
    die(
        `${missing.length} bloques SIN asignar:\n` +
            missing
                .map((m) => `   ${m.i}  ${m.names.join(",") || "(anónimo)"}`)
                .join("\n")
    )

// `providedLocally` = nombres que CADA destino se provee solo (el destructuring
// de MI_Shared, que se repite en cada archivo). No generan dependencia.
const providedLocally = new Set(plan.providedLocally || [])
const nameHome = new Map()
const typeHome = new Map()
for (const b of blocks)
    for (const n of b.names) {
        if (providedLocally.has(n)) continue
        ;(b.typeOnly ? typeHome : nameHome).set(n, owner.get(b.i))
    }

// ── PASADA 1 — qué necesita cada destino de los demás ──────────────────────
const needOf = new Map()
for (const t of plan.targets) {
    const used = new Set()
    for (const i of t.blocks) for (const n of blocks[i].idents) used.add(n)

    const localTypes = new Set(t.localTypes || [])
    for (const n of localTypes)
        if (!(t.imports || "").includes(`type ${n} `))
            die(`${t.file} declara localType "${n}" pero no lo define en sus imports`)

    const leaks = [...used].filter(
        (n) => !localTypes.has(n) && typeHome.has(n) && typeHome.get(n) !== t.file
    )
    if (leaks.length)
        die(
            `${t.file} usa tipos de otro archivo: ${leaks
                .map((n) => `${n} (vive en ${typeHome.get(n)})`)
                .join(", ")}\n   Los tipos no cruzan por Object.assign. Reagrupá el plan.`
        )

    const need = new Map()
    for (const n of used) {
        const home = nameHome.get(n)
        if (home && home !== t.file) {
            if (!need.has(home)) need.set(home, new Set())
            need.get(home).add(n)
        }
    }
    needOf.set(t.file, need)
}

// ── PASADA 2 — exports REALES de cada hermano = lo declarado ∪ lo que otros le
//    piden. Sin esto un import queda `undefined` en tiempo de ejecución: el
//    archivo compila, sube a Framer, y revienta al renderizar.
const requiredExports = new Map()
for (const t of plan.targets) requiredExports.set(t.file, new Set(t.exports || []))
for (const [, need] of needOf)
    for (const [home, names] of need)
        for (const n of names) requiredExports.get(home).add(n)

// el shell no exporta por Object.assign: nadie puede depender de él
const shellFile = plan.targets.find((t) => t.kind === "shell")?.file
for (const [who, need] of needOf)
    if (need.has(shellFile))
        die(
            `dependencia circular: ${who} importa ${[...need.get(shellFile)].join(", ")} del shell ${shellFile}`
        )

// ── generación ────────────────────────────────────────────────────────────
fs.mkdirSync(outDir, { recursive: true })
const report = []
const aliasFor = (file) => plan.aliases?.[file] || path.basename(file, ".tsx")

function importBlock(need) {
    const entries = [...need.entries()].sort()
    if (!entries.length) return ["", ""]
    const lines = entries
        .map(([f]) => `import ${aliasFor(f)} from "./${path.basename(f, ".tsx")}.tsx"`)
        .join("\n")
    const destr = entries
        .map(([f, names]) => `const { ${[...names].sort().join(", ")} } = ${aliasFor(f)}`)
        .join("\n")
    return [lines, destr]
}

for (const t of plan.targets) {
    const mine = t.blocks.slice().sort((a, b) => a - b)
    const body = mine.map((i) => blocks[i].text).join("")
    const need = needOf.get(t.file)
    const [impLines, impDestr] = importBlock(need)
    let out

    if (t.kind === "shell") {
        out = body
        if (impLines) {
            const anchor = plan.shellImportAnchor
            if (!anchor || !out.includes(anchor))
                die(`shellImportAnchor no encontrado en ${t.file}`)
            if (out.split(anchor).length !== 2)
                die(`shellImportAnchor NO es único en ${t.file}`)
            out = out.replace(anchor, anchor + "\n" + impLines + "\n\n" + impDestr)
        }
        out += tail
    } else {
        const owned = new Set(
            mine.flatMap((i) => (blocks[i].typeOnly ? [] : blocks[i].names))
        )
        const exports = [...requiredExports.get(t.file)]
        const notOwned = exports.filter((n) => !owned.has(n))
        if (notOwned.length)
            die(`${t.file} debería exportar ${notOwned.join(", ")} pero no los declara`)
        // orden estable: el mismo en que aparecen en el archivo
        exports.sort(
            (a, b) =>
                mine.findIndex((i) => blocks[i].names.includes(a)) -
                mine.findIndex((i) => blocks[i].names.includes(b))
        )
        out =
            t.header +
            "\n" +
            (t.imports || "") +
            (impLines ? "\n" + impLines + "\n\n" + impDestr + "\n" : "") +
            "\n" +
            body.replace(/^\n+/, "\n") +
            "\n" +
            `/* ═══ GHOST WRAPPER ═══\n` +
            `   Todo Code File de Framer default-exporta un componente renderable con\n` +
            `   cuerpo JSX real; un objeto plano o un fragment vacío rompen el\n` +
            `   componentLoader. Ver la regla de oro en CLAUDE.md. */\n` +
            `function ${t.shellFn}(_props: any) {\n` +
            `    return <div style={{ display: "none" }} aria-hidden="true" />\n` +
            `}\n` +
            `${t.shellFn}.displayName = "${path.basename(t.file, ".tsx")}"\n\n` +
            `const ${t.exportName} = Object.assign(${t.shellFn}, {\n` +
            exports.map((n) => `    ${n},`).join("\n") +
            `\n})\n\nexport default ${t.exportName}\n`
    }

    fs.writeFileSync(path.join(outDir, path.basename(t.file)), out)
    report.push({
        file: path.basename(t.file),
        kind: t.kind,
        bytes: Buffer.byteLength(out),
        exports:
            t.kind === "shell" ? null : [...requiredExports.get(t.file)].length,
        importsFrom: [...need.keys()].map((f) => path.basename(f)),
    })
}

// prueba final: los cuerpos asignados reconstruyen el original byte a byte
const rebuilt =
    plan.targets
        .flatMap((t) => t.blocks)
        .sort((a, b) => a - b)
        .map((i) => blocks[i].text)
        .join("") + tail
if (rebuilt !== text) die("los cuerpos asignados NO reconstruyen el original")

console.log(JSON.stringify({ source: srcPath, ok: true, report }, null, 1))
