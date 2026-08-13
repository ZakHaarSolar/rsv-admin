#!/bin/bash
# promover-shells.sh — último paso del split del 2026-08-10.
#
# CORRERLO SOLO DESPUÉS de que los 17 archivos nuevos existan como Code File en
# Framer. Antes de eso, los tres shells importan archivos que Framer todavía no
# tiene y el sitio publicado se rompe.
#
# Los 17 nuevos ya viven en Code/ (para copiarlos a Framer). Esto mueve los tres
# shells, que son lo que hace el cambio efectivo.

set -euo pipefail
BASE="/Users/diego/Documents/Red Solar Viva"
SRC="$BASE/admin/split-pendiente"
DST="$BASE/Code"

NUEVOS=(MI_EditCommon MI_EditRituales MI_EditWallpapers MI_EditAvatares
        MI_EditComunidad MI_EditSistema MI_Navegacion MI_App MI_Growth
        MI_Correos MI_CropCircles MI_IAs MobileComun MobileHoloteca
        MobileFragmentos MobileSimuladores MobileCodigosFuente)

falta=0
for f in "${NUEVOS[@]}"; do
    [[ -f "$DST/$f.tsx" ]] || { echo "!! falta $f.tsx en Code/"; falta=1; }
done
[[ $falta -eq 0 ]] || { echo "Abortado: faltan archivos nuevos en Code/."; exit 1; }

echo "Los 17 archivos nuevos están en Code/."
read -r -p "¿Ya los creaste TODOS como Code File en Framer? (escribí SI): " ok
[[ "$ok" == "SI" ]] || { echo "Abortado. Creálos en Framer primero."; exit 1; }

for f in MI_Editores MotorDeIntervencion AppNavegacionMobile; do
    cp "$SRC/$f.tsx" "$DST/$f.tsx"
    echo "  → Code/$f.tsx  $(stat -f %z "$DST/$f.tsx")B"
done

rm -f "$BASE/admin/.hold-iphone-reload"
echo
echo "Listo. El watcher sincroniza los tres shells y publica."
echo "Revisá admin/.last-sync-status.json antes de dar por bueno el cambio."
