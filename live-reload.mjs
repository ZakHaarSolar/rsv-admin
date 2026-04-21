#!/usr/bin/env node
// Red Solar Viva — Live Reload Server v1.0
// Levanta BrowserSync proxy a tu sitio Framer (live).
// El iPhone abre la URL de la LAN (la imprime al inicio) y se recarga
// automáticamente cuando el watcher publica una nueva versión.
//
// Uso:
//   node live-reload.mjs
//   node live-reload.mjs --target https://otro-sitio.com
//
// Variables de entorno (admin/.env):
//   LIVE_RELOAD_TARGET  = https://redsolarviva.com   (sitio a proxear)
//   LIVE_RELOAD_PORT    = 3000                        (puerto del proxy)
//   LIVE_RELOAD_HOOK_PORT = 3010                      (puerto del trigger interno)

import browserSync from "browser-sync"
import http from "node:http"
import { networkInterfaces } from "node:os"

const args = process.argv.slice(2)
const targetIdx = args.indexOf("--target")
const rawTarget =
    (targetIdx >= 0 ? args[targetIdx + 1] : null) ||
    process.env.LIVE_RELOAD_TARGET ||
    /* v1.1 \u2014 con www para evitar redirect 301 \u2192 www en cada GET */
    "https://www.redsolarviva.com"

/* v1.2 \u2014 Auto-saneo del target: el proxy SIEMPRE debe ser el origen,
   no una ruta. Si el usuario pone .../radar lo limpio. As\u00ed evitamos
   loops infinitos de 308 / 404 cascadas. */
let target = rawTarget
try {
    const u = new URL(rawTarget)
    const clean = `${u.protocol}//${u.host}`
    if (rawTarget !== clean) {
        console.warn(
            `⚠️  LIVE_RELOAD_TARGET ten\u00eda un path (${u.pathname}). Lo limpio a: ${clean}`
        )
        console.warn(
            `   Para aterrizar directo en /radar, abr\u00ed la URL ngrok con /radar al final, no en el target.`
        )
        target = clean
    }
    /* Si pus\u00edste sin www y el dominio es redsolarviva, le pegamos www
       para evitar el loop de redirect 308 que Framer impone. */
    if (/^redsolarviva\.com$/i.test(u.host)) {
        target = `${u.protocol}//www.${u.host}`
        console.warn(
            `⚠️  Target sin "www." \u2014 Framer redirige 308. Auto-arreglado a: ${target}`
        )
    }
} catch {
    console.error(`❌ LIVE_RELOAD_TARGET inv\u00e1lido: ${rawTarget}`)
    process.exit(1)
}

const port = Number(process.env.LIVE_RELOAD_PORT || 3000)
const hookPort = Number(process.env.LIVE_RELOAD_HOOK_PORT || 3010)

/* v1.3 \u2014 Polling-based reload. Mucho m\u00e1s confiable en iOS que WebSocket
   (que se suspende silencioso). El iPhone hace fetch /__rsv-version cada 2s
   y compara con la versi\u00f3n actual. Si cambia, recarga. */
let liveVersion = Date.now()

const ts = () =>
    new Date().toLocaleTimeString("es-MX", {
        timeZone: "America/Mexico_City",
        hour12: false,
    })

const lanIP = () => {
    const nets = networkInterfaces()
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === "IPv4" && !net.internal) return net.address
        }
    }
    return "localhost"
}

const ip = lanIP()

console.log(`
🛰️  Red Solar Viva — Live Reload Server
─────────────────────────────────────────
🌐 Proxy a:         ${target}
📡 Puerto local:    ${port}
🎣 Trigger hook:    POST http://localhost:${hookPort}/reload
📱 iPhone abrir:    http://${ip}:${port}
─────────────────────────────────────────
`)

const bs = browserSync.create("rsv-live")

bs.init(
    {
        proxy: {
            target,
            ws: true,
            /* v1.1 \u2014 evitar que el browser siga redirects fuera del proxy:
               cuando Framer responde 301/302 con Location absoluta a
               www.redsolarviva.com, lo reescribimos a path relativo. */
            proxyRes: [
                function rewriteLocation(proxyRes, req, res) {
                    const loc = proxyRes.headers["location"]
                    if (loc) {
                        proxyRes.headers["location"] = loc.replace(
                            /https?:\/\/(www\.)?redsolarviva\.com/gi,
                            ""
                        )
                    }
                    /* Anular HSTS para que el browser no cachee el dominio real */
                    delete proxyRes.headers["strict-transport-security"]
                },
            ],
        },
        port,
        ui: false,
        open: false,
        notify: false,
        logLevel: "info",
        logPrefix: "RSV",
        https: false,
        /* v1.3 \u2014 middleware para servir /__rsv-version desde el proxy */
        middleware: [
            (req, res, next) => {
                if (req.url === "/__rsv-version") {
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Cache-Control":
                            "no-store, no-cache, must-revalidate",
                        "Access-Control-Allow-Origin": "*",
                    })
                    res.end(String(liveVersion))
                    return
                }
                next()
            },
        ],
        snippetOptions: {
            /* v1.3 \u2014 reemplazamos el snippet de BrowserSync por nuestro
               propio polling reloader. Mucho m\u00e1s resiliente en iOS. */
            rule: {
                match: /<\/body>/i,
                fn: (snippet, match) => {
                    const pollingScript = `
<script>
(function(){
  var current = null;
  var failures = 0;
  function tick(){
    fetch('/__rsv-version', { cache: 'no-store' })
      .then(function(r){ return r.text(); })
      .then(function(v){
        failures = 0;
        v = (v || '').trim();
        if (current === null) { current = v; return; }
        if (v && v !== current) {
          console.log('[RSV] Nueva versi\u00f3n detectada \u2014 recargando…');
          window.location.reload();
        }
      })
      .catch(function(){
        failures++;
        if (failures > 30) console.warn('[RSV] live-reload: muchos fallos consecutivos');
      });
  }
  /* Tick inicial inmediato + intervalo cada 2s */
  tick();
  setInterval(tick, 2000);
  /* Tambi\u00e9n al volver al foreground (despu\u00e9s de bloqueo de pantalla) */
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) tick();
  });
})();
</script>`
                    return pollingScript + match
                },
            },
        },
        /* v1.1 \u2014 reescribir CUALQUIER absolute URL en el HTML/JS a path
           relativo. As\u00ed los clicks de men\u00fa no salen del proxy ngrok. */
        rewriteRules: [
            {
                match: /https?:\\?\/\\?\/(www\.)?redsolarviva\.com/gi,
                fn: () => "",
            },
            {
                match: /https?:\/\/(www\.)?redsolarviva\.com/gi,
                fn: () => "",
            },
        ],
    },
    (err) => {
        if (err) {
            console.error("❌ BrowserSync error:", err)
            process.exit(1)
        }
        console.log(`[${ts()}] ✅ Proxy listo. Esperando triggers de reload…`)
    }
)

/* Mini server interno para recibir el trigger del watcher */
const hook = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/reload") {
        liveVersion = Date.now()
        /* v1.4 \u2014 SOLO polling: quitamos bs.reload() que generaba
           refresh duplicado (un refresh por WS + otro por polling). */
        console.log(
            `[${ts()}] 📱 Polling version bumped \u2192 ${liveVersion}`
        )
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: true, ts: liveVersion }))
        return
    }
    if (req.method === "GET" && req.url === "/status") {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: true, target, port, version: liveVersion }))
        return
    }
    res.writeHead(404)
    res.end()
})

hook.listen(hookPort, "127.0.0.1", () => {
    console.log(
        `[${ts()}] 🎣 Hook escuchando en POST http://localhost:${hookPort}/reload`
    )
})

/* v1.3 \u2014 Endpoint pblico /__rsv-version sobre el puerto del proxy.
   El polling del iPhone consulta esto cada 2s. Lo enchufamos via
   middleware de BrowserSync para que pase por el mismo puerto pblico. */
const versionMiddleware = (req, res, next) => {
    if (req.url === "/__rsv-version") {
        res.writeHead(200, {
            "Content-Type": "text/plain",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
        })
        res.end(String(liveVersion))
        return
    }
    next()
}

const cleanup = () => {
    console.log(`\n[${ts()}] 👋 Cerrando…`)
    bs.exit()
    hook.close()
    process.exit(0)
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)
