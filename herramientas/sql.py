#!/usr/bin/env python3
# sql.py v1.0 — 🜂 EL SQL LO APLICA CLAUDE, CON CANDADOS (Zak 2026-10-24: «siempre que se tenga que hacer, hazlo, no me
# preguntes»). Reemplaza el «pega esto en SQL Editor». Cuatro caminos:
#
#   python3 admin/herramientas/sql.py leer "select …"          → solo lectura (la base rechaza cualquier escritura)
#   python3 admin/herramientas/sql.py aplicar <archivo.sql>    → aplica una migración de admin/supabase/migrations
#   python3 admin/herramientas/sql.py revisar <archivo.sql>    → solo pasa el candado, sin tocar la base
#   python3 admin/herramientas/sql.py probar "do $$ … $$"      → corre con escritura y lo DESHACE todo al final (probar
#                                                                 una función que escribe; lo que quieras leer, sácalo
#                                                                 con RAISE EXCEPTION '%', valor: sale impreso)
#
# EL CANDADO (antes de mandar nada): se niega a borrar o vaciar tablas, esquemas, columnas o la base; a DELETE o
# UPDATE sin WHERE (o con WHERE true); a CASCADE en un DROP; a escribir en auth, storage, vault, realtime o el registro
# de migraciones; y a apagar la seguridad por filas. El cuerpo de una función (CREATE FUNCTION … $$ … $$) no se ejecuta
# al aplicarla y no se revisa; el de un DO $$ … $$ sí. Lo que el candado niega NO tiene bandera para saltarlo: si de
# verdad hace falta, lo corre Zak en Supabase → SQL Editor, con su propia mano.
#
# ANTES DE APLICAR: guarda la definición actual de cada función que el archivo reemplaza en
# admin/supabase/respaldos_sql/<fecha>_<archivo>.sql (para volver atrás pegando ese archivo). Todo el archivo corre
# en una sola transacción: si una línea falla, no queda nada a medias. Al terminar: le pone «✅ » al nombre del archivo
# (la convención de Zak) y anota una línea en admin/supabase/bitacora_sql.md.
#
# La llave es la de la CLI de Supabase (llavero de la Mac, «Supabase CLI»); el proyecto, cobtsltrcsruzcusyqhi.

import base64
import datetime
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

PROYECTO = "cobtsltrcsruzcusyqhi"
ADMIN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRACIONES = os.path.join(ADMIN, "supabase", "migrations")
RESPALDOS = os.path.join(ADMIN, "supabase", "respaldos_sql")
BITACORA = os.path.join(ADMIN, "supabase", "bitacora_sql.md")


# ── El candado ─────────────────────────────────────────────────────────────────────────────────────────────────────
def _limpiar(sql: str, problemas: list) -> str:
    """Quita comentarios y textos entre comillas. El cuerpo de un DO se revisa aparte; el de una función, no."""
    out = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if sql.startswith("--", i):
            j = sql.find("\n", i)
            i = n if j < 0 else j
        elif sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            i = n if j < 0 else j + 2
        elif c == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'" and j + 1 < n and sql[j + 1] == "'":
                    j += 2
                elif sql[j] == "'":
                    break
                else:
                    j += 1
            out.append("''")
            i = j + 1
        elif c == '"':
            j = sql.find('"', i + 1)
            j = n if j < 0 else j
            out.append(sql[i : j + 1])
            i = j + 1
        elif c == "$":
            m = re.match(r"\$([A-Za-z_][A-Za-z0-9_]*)?\$", sql[i:])
            if not m:
                out.append(c)
                i += 1
                continue
            tag = m.group(0)
            j = sql.find(tag, i + len(tag))
            cuerpo = sql[i + len(tag) : (n if j < 0 else j)]
            previo = "".join(out)
            sentencia = previo[previo.rfind(";") + 1 :]
            if re.search(r"\bdo\s*(language\s+\w+\s*)?$", sentencia, re.I):
                problemas.extend(revisar(cuerpo))
            out.append("$cuerpo$")
            i = n if j < 0 else j + len(tag)
        else:
            out.append(c)
            i += 1
    return "".join(out)


ESQUEMAS_PROTEGIDOS = r'"?(auth|storage|vault|realtime|supabase_migrations|supabase_functions|extensions)"?\s*\.'


def revisar(sql: str) -> list:
    problemas: list = []
    limpio = _limpiar(sql, problemas)
    for cruda in limpio.split(";"):
        s = re.sub(r"\s+", " ", cruda).strip().lower()
        if not s:
            continue
        corto = s[:140]
        if re.match(r"truncate\b", s) or re.search(r"\btruncate\s+(table\s+)?[\w\".]+", s):
            problemas.append(f"vacía una tabla (TRUNCATE): {corto}")
        if re.search(r"\bdrop\s+(table|schema|database|owned|role|user|extension|sequence|materialized\s+view)\b", s):
            problemas.append(f"borra una tabla, esquema o algo que guarda datos (DROP): {corto}")
        if re.search(r"\bdrop\s+column\b", s):
            problemas.append(f"borra una columna con sus datos (DROP COLUMN): {corto}")
        if re.search(r"\bdrop\b", s) and re.search(r"\bcascade\b", s):
            problemas.append(f"borra en cascada (CASCADE): {corto}")
        for m in re.finditer(r"\bdelete\s+from\s+(only\s+)?[\w\".]+", s):
            resto = s[m.end() :]
            if not re.search(r"\bwhere\b", resto):
                problemas.append(f"borra filas sin WHERE: {corto}")
            elif re.search(r"\bwhere\s+(true|1\s*=\s*1|'t')\b", resto):
                problemas.append(f"borra todas las filas (WHERE true): {corto}")
        for m in re.finditer(r"(?<!do )\bupdate\s+(only\s+)?[\w\".]+(\s+(as\s+)?\w+)?\s+set\b", s):
            resto = s[m.end() :]
            if not re.search(r"\bwhere\b", resto):
                problemas.append(f"cambia todas las filas (UPDATE sin WHERE): {corto}")
            elif re.search(r"\bwhere\s+(true|1\s*=\s*1|'t')\b", resto):
                problemas.append(f"cambia todas las filas (WHERE true): {corto}")
        if re.search(r"\b(delete\s+from|update|truncate(\s+table)?|alter\s+table|drop\s+\w+)\s+(only\s+)?(if\s+exists\s+)?" + ESQUEMAS_PROTEGIDOS, s):
            problemas.append(f"toca un esquema del sistema (auth, storage, migraciones…): {corto}")
        if re.search(r"\bdisable\s+row\s+level\s+security\b", s):
            problemas.append(f"apaga la seguridad por filas: {corto}")
    return problemas


# ── La base ────────────────────────────────────────────────────────────────────────────────────────────────────────
def _token() -> str:
    raw = subprocess.check_output(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"]
    ).decode().strip()
    if raw.startswith("go-keyring-base64:"):
        raw = base64.b64decode(raw[len("go-keyring-base64:") :]).decode()
    return raw


def consulta(sql: str, solo_lectura: bool):
    body = {"query": sql}
    if solo_lectura:
        body["read_only"] = True
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROYECTO}/database/query",
        data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + _token(), "Content-Type": "application/json", "User-Agent": "rsv-sql"},
    )
    try:
        return True, json.loads(urllib.request.urlopen(req, timeout=180).read() or b"null")
    except urllib.error.HTTPError as e:
        txt = e.read().decode(errors="replace")
        try:
            txt = json.loads(txt).get("message", txt)
        except Exception:
            pass
        return False, txt


def _funciones(sql: str) -> list:
    nombres = re.findall(r"create\s+(?:or\s+replace\s+)?function\s+([\w\".]+)\s*\(", sql, re.I)
    vistos, out = set(), []
    for n in nombres:
        n = n.replace('"', "")
        esquema, _, nombre = n.rpartition(".")
        clave = (esquema or "public", nombre)
        if clave not in vistos:
            vistos.add(clave)
            out.append(clave)
    return out


def _anotar(linea: str) -> None:
    nuevo = not os.path.exists(BITACORA)
    with open(BITACORA, "a") as f:
        if nuevo:
            f.write("# Bitácora del SQL aplicado por Claude (admin/herramientas/sql.py)\n\n")
        f.write(linea + "\n")


def aplicar(ruta: str) -> int:
    ruta = os.path.abspath(ruta)
    nombre = os.path.basename(ruta)
    if os.path.dirname(ruta) != MIGRACIONES or not nombre.endswith(".sql"):
        print("✗ Solo se aplican archivos .sql de admin/supabase/migrations (así queda su historia en el repo).")
        return 2
    if nombre.startswith("✅"):
        print(f"✗ {nombre} ya tiene ✅: ya se aplicó. Si hace falta otra vez, que sea una migración nueva.")
        return 2
    sql = open(ruta).read()
    problemas = revisar(sql)
    if problemas:
        print("✗ El candado lo detuvo. Esto lo corre Zak a mano en Supabase → SQL Editor si de verdad hace falta:")
        for p in problemas:
            print("   ·", p)
        _anotar(f"- {datetime.datetime.now():%Y-%m-%d %H:%M} · DETENIDO · `{nombre}` · {len(problemas)} motivo(s)")
        return 3

    os.makedirs(RESPALDOS, exist_ok=True)
    marca = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    respaldo = None
    funcs = _funciones(sql)
    if funcs:
        filtro = " or ".join(
            f"(n.nspname = '{e}' and p.proname = '{f}')" for e, f in funcs if re.fullmatch(r"\w+", e + f)
        )
        ok, filas = consulta(
            "select pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on n.oid = p.pronamespace "
            f"where p.prokind = 'f' and ({filtro})",
            True,
        )
        if not ok:
            print("✗ No pude respaldar las funciones de antes; no se aplicó nada:", filas)
            return 4
        if filas:
            respaldo = os.path.join(RESPALDOS, f"{marca}_{nombre}")
            with open(respaldo, "w") as f:
                f.write(f"-- Respaldo antes de aplicar {nombre} ({marca}). Pegarlo en SQL Editor deja las funciones como estaban.\n\n")
                for fila in filas:
                    f.write(fila["def"].rstrip() + ";\n\n")

    ok, res = consulta("set statement_timeout = '120s';\n" + sql, False)
    if not ok:
        print("✗ La base lo rechazó y no quedó nada a medias (todo corre en una transacción):")
        print("  ", str(res)[:1500])
        _anotar(f"- {datetime.datetime.now():%Y-%m-%d %H:%M} · FALLÓ · `{nombre}` · {str(res)[:200]}")
        return 5

    hecho = os.path.join(MIGRACIONES, "✅ " + nombre)
    os.rename(ruta, hecho)
    rel = os.path.relpath(respaldo, ADMIN) if respaldo else "sin funciones que respaldar"
    _anotar(f"- {datetime.datetime.now():%Y-%m-%d %H:%M} · APLICADO · `{nombre}` · respaldo: {rel}")
    print(f"✓ Aplicado: {nombre} → «✅ {nombre}»")
    if respaldo:
        print(f"  Respaldo de {len(funcs)} función(es) de antes: {rel}")
    if isinstance(res, list) and res:
        print("  Lo que devolvió:", json.dumps(res, ensure_ascii=False, default=str)[:1500])
    return 0


def main() -> int:
    if len(sys.argv) < 3 or sys.argv[1] not in ("leer", "aplicar", "revisar", "probar"):
        print("uso: sql.py leer \"select …\" | aplicar <archivo.sql> | revisar <archivo.sql> | probar \"sql\"")
        return 1
    accion, arg = sys.argv[1], sys.argv[2]
    if accion == "probar":
        sql = open(arg).read() if arg.endswith(".sql") and os.path.exists(arg) else arg
        problemas = revisar(sql)
        if problemas:
            print("✗ El candado lo detuvo (ni en prueba):\n   · " + "\n   · ".join(problemas))
            return 3
        marca = "rsv-probar-deshecho"
        ok, res = consulta(sql.rstrip().rstrip(";") + f";\ndo $rsvp$ begin raise exception '{marca}'; end $rsvp$;", False)
        msg = str(res)
        if ok:
            print("✗ La prueba no terminó en error: revisa que nada haya quedado escrito.", msg[:500])
            return 5
        if marca in msg:
            print("✓ Corrió sin errores y se deshizo todo.")
            return 0
        cuerpo = msg.split("P0001: ", 1)[1].split("\nCONTEXT:", 1)[0] if "P0001: " in msg else msg
        print("↩ Deshecho. Lo que salió:", cuerpo.strip()[:20000])
        return 0
    if accion == "leer":
        sql = open(arg).read() if arg.endswith(".sql") and os.path.exists(arg) else arg
        ok, res = consulta(sql, True)
        print(json.dumps(res, ensure_ascii=False, indent=1, default=str) if ok else "✗ " + str(res))
        return 0 if ok else 5
    if accion == "revisar":
        problemas = revisar(open(arg).read())
        print("✓ Pasa el candado." if not problemas else "✗ El candado lo detendría:\n   · " + "\n   · ".join(problemas))
        return 0 if not problemas else 3
    return aplicar(arg)


if __name__ == "__main__":
    sys.exit(main())
