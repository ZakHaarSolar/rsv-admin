#!/usr/bin/env bash
# Red Solar Viva · Oráculo — sube el corpus al indexador (oraculo-index)
# =====================================================================
# POSTea cada .txt de admin/oraculo/corpus/ a la edge function `oraculo-index`
# (ya desplegada), que lo chunkea, embebe con Gemini y lo guarda en oraculo_docs.
#
# REQUISITOS (NINGÚN secreto va dentro de este script):
#   · SUPABASE_URL   — p.ej. https://cobtsltrcsruzcusyqhi.supabase.co
#   · ANON_KEY       — la anon key pública del proyecto (de escaner-app/.env.local)
#   · ADMIN_TOKEN    — un token de SESIÓN de Clerk de una cuenta ADMIN
#                      (en la consola del navegador, logueado como admin:
#                       await window.Clerk.session.getToken()  → cópialo)
#
# USO (cualquiera de las dos formas):
#   1) Por variables de entorno:
#        SUPABASE_URL="https://....supabase.co" \
#        ANON_KEY="eyJ..." \
#        ADMIN_TOKEN="eyJ..." \
#        bash admin/oraculo/index_corpus.sh
#
#   2) Por argumentos posicionales:
#        bash admin/oraculo/index_corpus.sh <SUPABASE_URL> <ANON_KEY> <ADMIN_TOKEN>
#
# Para re-indexar: volver a correrlo. La edge borra las filas previas de cada
# `source` antes de insertar (reemplazo idempotente).
#
# Requiere: bash, curl, python3.

set -euo pipefail

SUPABASE_URL="${1:-${SUPABASE_URL:-}}"
ANON_KEY="${2:-${ANON_KEY:-}}"
ADMIN_TOKEN="${3:-${ADMIN_TOKEN:-}}"
# Alternativa al token de Clerk (que vive ~60s y no alcanza para 25 archivos):
# un secreto de servidor sin TTL. Set con `supabase secrets set ORACULO_INDEX_SECRET=...`
# y exportá el MISMO valor como INDEX_SECRET acá. Recomendado para el lote completo.
INDEX_SECRET="${INDEX_SECRET:-}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" || ( -z "$ADMIN_TOKEN" && -z "$INDEX_SECRET" ) ]]; then
  echo "ERROR: faltan credenciales." >&2
  echo "Necesitas SUPABASE_URL + ANON_KEY + (ADMIN_TOKEN ó INDEX_SECRET)." >&2
  echo "Recomendado para indexar TODO de un tiro: usar INDEX_SECRET (no caduca)." >&2
  echo "Ej: SUPABASE_URL=... ANON_KEY=... INDEX_SECRET=... bash $0" >&2
  exit 1
fi
if [[ -n "$INDEX_SECRET" ]]; then
  echo "Auth: secreto de servidor (INDEX_SECRET) — sin límite de tiempo."
else
  echo "Auth: token de admin de Clerk (ADMIN_TOKEN) — ⚠ vive ~60s, puede caducar a mitad del lote."
fi

# Quitar slash final de la URL si lo trae.
SUPABASE_URL="${SUPABASE_URL%/}"
ENDPOINT="${SUPABASE_URL}/functions/v1/oraculo-index"

# Carpeta del corpus (relativa a este script).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORPUS_DIR="${SCRIPT_DIR}/corpus"

if [[ ! -d "$CORPUS_DIR" ]]; then
  echo "ERROR: no existe el corpus en $CORPUS_DIR (corre extract_corpus.py primero)." >&2
  exit 1
fi

# title legible por archivo (source = nombre del archivo sin .txt).
title_for() {
  case "$1" in
    arquitecto-de-la-realidad) echo "Arquitecto de la Realidad" ;;
    cuerpo-de-silicio)         echo "Cuerpo de Silicio" ;;
    fisica-de-la-voluntad)     echo "La Física de la Voluntad" ;;
    la-muerte-no-existe)       echo "La Muerte no Existe" ;;
    lenguaje-holografico)      echo "Lenguaje Holográfico" ;;
    protocolo-de-entrada)      echo "Protocolo de Entrada" ;;
    singularidad-organica)     echo "Singularidad Orgánica" ;;
    sintiencia)                echo "Sintiencia" ;;
    terra-cristal)             echo "Terra Cristal" ;;
    nucleo-de-diamante)        echo "Núcleo de Diamante" ;;
    nucleo-extradimensional-*) echo "Núcleo Extradimensional" ;;
    nucleo-extradimensional)   echo "Núcleo Extradimensional" ;;
    *) echo "$1" ;;
  esac
}

shopt -s nullglob
files=("$CORPUS_DIR"/*.txt)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "ERROR: no hay .txt en $CORPUS_DIR." >&2
  exit 1
fi

echo "Indexando ${#files[@]} archivo(s) → $ENDPOINT"
echo ""

for f in "${files[@]}"; do
  base="$(basename "$f" .txt)"
  title="$(title_for "$base")"
  echo "→ $title  (source=$base)"

  # Construir el JSON con python3 (escapa UTF-8 y saltos de línea de forma
  # segura para textos grandes). Lee token/source/title/path del entorno para
  # no exponerlos en argv.
  body="$(
    ORA_TOKEN="$ADMIN_TOKEN" \
    ORA_SECRET="$INDEX_SECRET" \
    ORA_TITLE="$title" \
    ORA_SOURCE="$base" \
    ORA_PATH="$f" \
    python3 - <<'PY'
import json, os
with open(os.environ["ORA_PATH"], encoding="utf-8") as fh:
    text = fh.read()
print(json.dumps({
    "token":        os.environ.get("ORA_TOKEN", ""),
    "index_secret": os.environ.get("ORA_SECRET", ""),
    "title":        os.environ["ORA_TITLE"],
    "source":       os.environ["ORA_SOURCE"],
    "text":         text,
}))
PY
  )"

  # POST. --data-binary @- por stdin para no chocar con el límite de longitud
  # de argumentos del shell en libros grandes.
  printf '%s' "$body" | curl -sS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    --data-binary @- \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("   ", json.dumps(d, ensure_ascii=False))' \
  || echo "   (respuesta no-JSON o error de red)"
  echo ""
done

echo "Listo. Verifica en Supabase → Table Editor → oraculo_docs (debe tener filas con embedding)."
