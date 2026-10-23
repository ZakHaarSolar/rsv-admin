#!/usr/bin/env python3
# puertas.py v1.0 · Red Solar Viva (2026-10-23)
# El «Principio rector de todas las puertas» vive en el CLAUDE.md raíz, entre <!-- PUERTAS:inicio y <!-- PUERTAS:fin -->.
# Las salas que cargan la raíz lo leen ahí; las que la excluyen (claudeMdExcludes en su .claude/settings*.json) llevan
# una copia idéntica en su propio CLAUDE.md. Esta herramienta encuentra esas salas y revisa o pone su copia.
# Uso: python3 admin/herramientas/puertas.py              revisa: al día, vieja, sin bloque o sin CLAUDE.md
#      python3 admin/herramientas/puertas.py --escribir   pone el bloque de la raíz donde falta (antes de la primera
#                                                         sección ##) o donde se quedó viejo
import fnmatch
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAESTRO = os.path.join(RAIZ, "CLAUDE.md")
INICIO, FIN = "<!-- PUERTAS:inicio", "<!-- PUERTAS:fin -->"
SALTAR = {"node_modules", "dist", "build", "Pods", "DerivedData", "venv", "__pycache__"}
HONDURA = 3  # una sala vive a lo más tres carpetas abajo de la raíz (hoy, dos: Ludus Cero/prisma, Fotón Cero/Luzy)


def leer(ruta):
    with open(ruta, encoding="utf-8", newline="") as f:
        return f.read()


def guardar(ruta, texto):
    with open(ruta, "w", encoding="utf-8", newline="") as f:
        f.write(texto)


def tramo(texto, donde):
    """Dónde empieza y dónde termina el bloque (con sus marcas), o None si no lo tiene."""
    n_inicio, n_fin = texto.count(INICIO), texto.count(FIN)
    if n_inicio == n_fin == 0:
        return None
    a, b = texto.find(INICIO), texto.find(FIN)
    if n_inicio != 1 or n_fin != 1 or b < a:
        sys.exit(f"{donde}: el bloque tiene que estar una sola vez y en orden "
                 f"(inicios {n_inicio}, finales {n_fin}); arréglalo a mano")
    return a, b + len(FIN)


def excluye_raiz(carpeta):
    for nombre in ("settings.json", "settings.local.json"):
        try:
            ajustes = json.loads(leer(os.path.join(carpeta, ".claude", nombre)))
        except (OSError, ValueError):
            continue
        if any(p == MAESTRO or fnmatch.fnmatch(MAESTRO, p) for p in ajustes.get("claudeMdExcludes", [])):
            return True
    return False


def salas():
    for actual, carpetas, _ in os.walk(RAIZ):
        if actual != RAIZ and ".claude" in carpetas and excluye_raiz(actual):
            yield actual
        hondura = 0 if actual == RAIZ else len(os.path.relpath(actual, RAIZ).split(os.sep))
        # las carpetas ocultas quedan fuera: ahí viven .git y los worktrees de otras salas
        carpetas[:] = sorted(c for c in carpetas if hondura < HONDURA and not c.startswith(".") and c not in SALTAR)


def main():
    poner = "--escribir" in sys.argv[1:]
    maestro = leer(MAESTRO)
    t = tramo(maestro, "CLAUDE.md raíz")
    if t is None:
        sys.exit("El CLAUDE.md raíz no tiene el bloque de las puertas: recupéralo de la copia de cualquier proyecto.")
    fuente = maestro[t[0]:t[1]]
    encontradas = list(salas())
    if not encontradas:
        sys.exit("No encontré ninguna sala que excluya la raíz: revisa la ruta de RAIZ.")
    pendientes = 0
    for sala in encontradas:
        nombre = os.path.relpath(sala, RAIZ)
        md = os.path.join(sala, "CLAUDE.md")
        if not os.path.exists(md):
            print(f"{'sin CLAUDE.md':<20} {nombre} (excluye la raíz y no tiene contexto propio)")
            pendientes += 1
            continue
        texto = leer(md)
        t = tramo(texto, nombre + "/CLAUDE.md")
        if t and texto[t[0]:t[1]] == fuente:
            print(f"{'al día':<20} {nombre}")
            continue
        if t:
            estado, nuevo = "vieja", texto[:t[0]] + fuente + texto[t[1]:]
        else:
            seccion = re.search(r"^## ", texto, re.M)
            if seccion:
                nuevo = texto[:seccion.start()] + fuente + "\n\n" + texto[seccion.start():]
            else:
                nuevo = texto.rstrip("\n") + "\n\n" + fuente + "\n"
            estado = "sin bloque"
        if poner:
            guardar(md, nuevo)
            estado += " → puesta"
        else:
            pendientes += 1
        print(f"{estado:<20} {nombre}")
    sys.exit(1 if pendientes else 0)


if __name__ == "__main__":
    main()
