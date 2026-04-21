# RSV — Pipeline Claude Code → Framer → iPhone

Auto-sync de archivos `.tsx` editados por Claude Code hacia tu proyecto Framer, con publish automático y reload en vivo del iPhone.

## Flujo

```
Claude Code edita Code/EscanerVibracional.tsx
        ↓
framer-watcher.mjs detecta el cambio (debounce 1.2s)
        ↓
framer-api: setFileContent → publish → deploy a redsolarviva.com
        ↓
POST localhost:3010/reload
        ↓
BrowserSync ordena reload a todos los clientes conectados
        ↓
iPhone (en http://IP-LAN:3000) se refresca solo
```

---

## Setup inicial (una sola vez)

### 1. Generar la API key de Framer

1. Abrir el proyecto Framer en el browser.
2. **Project Settings** (engrane arriba-derecha) → **General** → **API Keys**.
3. Click **Generate new key**. Copiarlo (solo se muestra una vez).

### 2. Configurar variables

```bash
cd "/Users/diego/Documents/Red Solar Viva/admin"
cp .env.example .env
# Editar .env y pegar la API key real en FRAMER_API_KEY
```

### 3. Instalar dependencias

```bash
cd "/Users/diego/Documents/Red Solar Viva/admin"
npm install
```

Esto instala `framer-api`, `browser-sync` y `concurrently` (~50MB).

### 4. Asegurar que el iPhone y la Mac están en la **misma red WiFi**.

---

## Uso diario

### Modo COMPLETO (todo en uno)

```bash
cd "/Users/diego/Documents/Red Solar Viva/admin"
npm run dev
```

Esto arranca:
- `framer-watcher.mjs` — vigila `Code/*.tsx` y sincroniza con Framer al detectar cambios
- `live-reload.mjs` — proxy BrowserSync que recarga el iPhone

La consola imprimirá una URL como:
```
📱 iPhone abrir: http://192.168.1.42:3000
```

Abrí esa URL en Safari del iPhone, ponelo en el trípode. **Listo.**

A partir de ahora, cada vez que Claude Code edite un `.tsx`, en ~5-15 segundos el iPhone se refresca solo con la nueva versión.

### Modos individuales

**Solo sincronizar manualmente un archivo (sin watch):**
```bash
npm run sync EscanerVibracional.tsx
```

**Sincronizar TODOS los .tsx de Code/ una vez:**
```bash
npm run sync:all
```

**Solo watch sin live-reload (si no usás iPhone):**
```bash
npm run watch
```

**Solo preview (no deploy a custom domain):**
```bash
npm run watch:preview
```

**Solo el live-reload server (si querés sincronizar manual):**
```bash
npm run live
```

---

## Tiempos esperados

| Acción | Latencia típica |
|---|---|
| Detectar cambio en disco | <100ms |
| Subir contenido a Framer (`setFileContent`) | 1-3s |
| `publish()` (build de deployment) | 5-15s (depende del tamaño) |
| `deploy()` a custom domain | 1-3s |
| BrowserSync reload del iPhone | <500ms |
| **TOTAL: edit → iPhone refrescado** | **~10-20 segundos** |

---

## Troubleshooting

**"FRAMER_API_KEY no encontrada"**
→ Copiaste `.env.example` a `.env` y pegaste la key real?

**"no existe en Framer. Crea el componente primero"**
→ El archivo local no tiene un Code File equivalente en el proyecto Framer. Crealo manualmente en Framer la primera vez (con cualquier contenido), después el sync lo sobrescribe.

**iPhone no se refresca pero el deploy fue exitoso**
→ Verificá que ambos dispositivos están en la misma red WiFi. La URL del iPhone debe ser `http://IP-LAN:3000`, no `https://redsolarviva.com`.
→ Probá visitar `http://IP-LAN:3000/__browser_sync__` desde el iPhone — si carga la UI de BrowserSync, el proxy funciona.

**"BrowserSync error: EADDRINUSE"**
→ El puerto 3000 o 3010 ya está ocupado. Cambialos en `.env`.

**Framer rechaza el contenido (lint error)**
→ Recordá las reglas: no `env()`, no `color-mix()` en CSS; imports al mismo nivel; usar `createPortal(el, document.body)` para modales.

**El watcher dispara dos veces el mismo archivo**
→ El debounce de 1.2s lo evita. Si seguís viéndolo, subí `DEBOUNCE_MS` en `framer-watcher.mjs`.

---

## Hook con Claude Code (opcional)

Si querés que Claude Code dispare el sync automáticamente al terminar cada edición, añadí esto a `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd '/Users/diego/Documents/Red Solar Viva/admin' && node --env-file=.env framer-sync.mjs $(basename $CLAUDE_FILE_PATH) 2>&1 || true"
          }
        ]
      }
    ]
  }
}
```

Esto evita necesitar el `watcher` corriendo — Claude mismo dispara el sync.

(Pero el watcher es más confiable porque puede agrupar varias ediciones rápidas.)

---

## Archivos

| Archivo | Qué hace |
|---|---|
| `framer-sync.mjs` | Sube archivo(s) específico(s) a Framer + publica + deploy. CLI puntual. |
| `framer-watcher.mjs` | Demonio que vigila `Code/*.tsx` y dispara sync con debounce. |
| `live-reload.mjs` | Servidor BrowserSync proxy + endpoint para recargar iPhone. |
| `package.json` | Scripts y deps. |
| `.env.example` | Plantilla de variables — copiá a `.env` y completá. |
