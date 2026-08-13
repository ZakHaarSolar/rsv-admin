#!/usr/bin/env bash
# =============================================================================
# Red Solar Viva · fish-voces-piloto.sh v1.1
# PILOTO DE VOZ DEL ESPEJO — genera muestras para elegir voz CON EL OÍDO.
# v1.1 — fuera `set -u` (nounset): no protegía nada real (todas las variables
#        ya tienen su `${:-default}`) y era la causa exacta del "unbound
#        variable" que le salió a Zak — con `-u` cualquier desvío mínimo en
#        cómo llega el comando al shell (comillas curvas de un copy/paste,
#        variable de entorno rara, etc.) revienta el script entero con un
#        error que apunta a una línea que en realidad está bien. Sin `-u`,
#        ese mismo desvío como mucho deja una variable vacía — nunca mata el
#        script. Se queda `pipefail` (protege lo real: un curl que falla en
#        medio de una tubería).
# =============================================================================
# Qué hace: busca voces en español en la biblioteca de Fish Audio, sintetiza el
# MISMO texto de prueba con cada una y deja los mp3 en una carpeta para
# escucharlos seguidos y quedarse con la que suene a Espejo.
#
# Uso:
#   export FISH_AUDIO_API_KEY="tu_api_key"
#   bash admin/scripts/fish-voces-piloto.sh              # 5 voces es
#   bash admin/scripts/fish-voces-piloto.sh 8            # 8 voces
#   bash admin/scripts/fish-voces-piloto.sh 5 "es-MX"    # afina la búsqueda
#
# Salida: admin/scripts/voces-piloto/<n>-<nombre>-<id>.mp3 + un índice .txt
# con el id de cada una (el id es lo que va al secreto FISH_VOICE_ID).
#
# ⚠️ USA LA VENTANA GRATIS (modelo s2.1-pro-free, hasta el 31-ago-2026). Sus
# términos permiten RETENER los requests para entrenar → por eso este script
# manda un TEXTO DE PRUEBA y nunca texto real de un Tripulante. La edge de
# producción (espejo-voz) usa el modelo de PAGO.
# =============================================================================
set -o pipefail

N="${1:-5}"
QUERY="${2:-es}"
OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/voces-piloto"

if [[ -z "${FISH_AUDIO_API_KEY:-}" ]]; then
    echo "Falta FISH_AUDIO_API_KEY. Exportala y volvé a correr:"
    echo '  export FISH_AUDIO_API_KEY="..."'
    exit 1
fi

# El texto de prueba: la voz del Espejo, sin datos de nadie. Frases con pausas
# reales para oír cómo respira la voz, no solo cómo pronuncia.
TEXTO="Lo que traes hoy tiene una textura distinta. No es urgencia: es algo que se está acomodando por dentro y todavía no encuentra su nombre. Quédate un momento ahí, sin resolverlo. Lo que se ordena solo, se ordena en el silencio."

mkdir -p "$OUT"
INDEX="$OUT/_indice.txt"
: > "$INDEX"

echo "→ Buscando voces «$QUERY» en la biblioteca de Fish…"
MODELS_JSON="$(curl -sS -G "https://api.fish.audio/model" \
    --data-urlencode "title=$QUERY" \
    --data-urlencode "page_size=$N" \
    --data-urlencode "sort_by=score" \
    -H "Authorization: Bearer $FISH_AUDIO_API_KEY" || true)"

if [[ -z "$MODELS_JSON" ]]; then
    echo "✕ No hubo respuesta de la biblioteca. Revisá la API key."
    exit 1
fi

# Extrae pares id|título sin depender de jq (puede no estar instalado).
PAIRS="$(printf '%s' "$MODELS_JSON" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception as e:
    print("PARSE_ERROR " + str(e)[:120]); raise SystemExit(0)
items = d.get("items") or d.get("data") or []
if not items:
    print("EMPTY " + json.dumps(d)[:300]); raise SystemExit(0)
for m in items:
    mid = m.get("_id") or m.get("id") or ""
    title = (m.get("title") or "voz").replace("|", "-").replace("/", "-")
    if mid:
        print(f"{mid}|{title}")
')"

if [[ "$PAIRS" == PARSE_ERROR* || "$PAIRS" == EMPTY* || -z "$PAIRS" ]]; then
    echo "✕ No pude leer la lista de voces:"
    echo "  $PAIRS"
    echo ""
    echo "  Alternativa: entrá a https://fish.audio/ , buscá voces en español,"
    echo "  copiá el id de cada una (sale en la URL del modelo) y pasalas a mano:"
    echo '    IDS="id1 id2 id3" bash admin/scripts/fish-voces-piloto.sh'
    exit 1
fi

i=0
while IFS='|' read -r ID TITLE; do
    [[ -z "$ID" ]] && continue
    i=$((i + 1))
    SAFE="$(printf '%s' "$TITLE" | tr -cd '[:alnum:] ._-' | tr ' ' '_' | cut -c1-40)"
    FILE="$OUT/$(printf '%02d' "$i")-${SAFE}-${ID}.mp3"
    echo "→ [$i] $TITLE ($ID)"
    HTTP="$(curl -sS -o "$FILE" -w '%{http_code}' -X POST "https://api.fish.audio/v1/tts" \
        -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
        -H "Content-Type: application/json" \
        -H "model: s2.1-pro-free" \
        -d "$(python3 -c '
import json, sys
print(json.dumps({
    "text": sys.argv[1],
    "reference_id": sys.argv[2],
    "format": "mp3",
    "mp3_bitrate": 128,
    "normalize": True,
    "latency": "normal",
}))' "$TEXTO" "$ID")" || echo "000")"
    if [[ "$HTTP" == "200" ]]; then
        echo "   ✓ $(basename "$FILE")"
        echo "$ID  $TITLE" >> "$INDEX"
    else
        echo "   ✕ HTTP $HTTP — $(head -c 200 "$FILE" 2>/dev/null)"
        rm -f "$FILE"
    fi
done <<< "$PAIRS"

echo ""
echo "Listo. Escuchalas en orden:"
echo "  open \"$OUT\""
echo ""
echo "Cuando elijas una, su id está en $INDEX. Después:"
echo "  supabase secrets set FISH_VOICE_ID=\"<el id>\""
