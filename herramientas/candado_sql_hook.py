#!/usr/bin/env python3
# candado_sql_hook.py v1.0 — 🜂 EL CANDADO QUE NO DEPENDE DE CLAUDE (Zak 2026-10-24). Filtro de Claude Code (PreToolUse,
# registrado en ~/.claude/settings.json, vale en todas las salas): toda escritura a la base de producción pasa por
# admin/herramientas/sql.py, que tiene el candado de borrados. Aquí se niega cualquier otro camino:
#   · un comando que llame a la API de consultas de Supabase, a psql, a pg_restore, a `supabase db push/reset/…`,
#     a `supabase migration up/repair`, o un DELETE/PATCH directo a la REST de Supabase, si no es sql.py;
#   · escribir código nuevo (.py, .js, .mjs, .ts, .sh…) que hable con la API de consultas (así no nace un sql.py
#     paralelo sin candado). Los documentos (.md) sí pueden nombrarla.
# Lo que se niega le llega a Claude como motivo, con el camino correcto.

import json
import re
import sys

HERRAMIENTA = "herramientas/sql.py"
ESTE = "herramientas/candado_sql_hook.py"


def negar(motivo: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": motivo,
                }
            },
            ensure_ascii=False,
        )
    )
    sys.exit(0)


def main() -> None:
    try:
        datos = json.load(sys.stdin)
    except Exception:
        return
    herramienta = datos.get("tool_name", "")
    entrada = datos.get("tool_input") or {}

    if herramienta == "Bash":
        cmd = str(entrada.get("command", ""))
        if HERRAMIENTA in cmd and not re.search(r"database/query|\bpsql\b", cmd.replace(HERRAMIENTA, "")):
            return
        if re.search(
            r"database/query|\bpsql\b|\bpg_restore\b|supabase\s+db\s+(push|reset|execute|query)\b"
            r"|supabase\s+migration\s+(up|repair)\b",
            cmd,
        ) or re.search(r"-X\s*['\"]?(DELETE|PATCH|PUT)\b[^\n]*supabase\.co/rest/v1|supabase\.co/rest/v1[^\n]*-X\s*['\"]?(DELETE|PATCH|PUT)\b", cmd):
            negar(
                "El candado del SQL: la base de producción se toca solo con admin/herramientas/sql.py "
                "(leer · probar · aplicar <migración>). Escribe la migración en admin/supabase/migrations y aplícala con él."
            )
        return

    if herramienta in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        ruta = str(entrada.get("file_path") or entrada.get("notebook_path") or "")
        if ruta.endswith(HERRAMIENTA) or ruta.endswith(ESTE):
            return
        if not re.search(r"\.(py|js|mjs|cjs|ts|tsx|sh|zsh|bash|rb|go|ipynb)$", ruta):
            return
        texto = json.dumps(entrada, ensure_ascii=False)
        if "database/query" in texto:
            negar(
                "El candado del SQL: un programa nuevo no habla directo con la API de consultas de Supabase. "
                "Usa admin/herramientas/sql.py (leer · probar · aplicar), que pasa por el candado de borrados."
            )


if __name__ == "__main__":
    main()
