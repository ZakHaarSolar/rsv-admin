// ════════════════════════════════════════════════════════════════════
// descargar-media (v1.0 — 2026-05-30) — proxy de descarga 1-click.
//
// PROBLEMA: el dominio público de R2 (pub-*.r2.dev) NO aplica la política
// CORS del bucket. Por eso el navegador puede MOSTRAR la imagen (<img> no
// usa CORS) pero NO leerla por código — `fetch()` falla con "Failed to
// fetch". Sin poder leerla por código, el cliente no puede forzar una
// descarga (el atributo `download` cross-origin se ignora y abre la
// imagen en vez de bajarla).
//
// SOLUCIÓN: este edge function trae el archivo server-side (entre
// servidores no hay CORS) y lo devuelve con `Content-Disposition:
// attachment`. Eso hace que el navegador lo DESCARGUE al navegar al link,
// en 1 click, sin depender de CORS ni del atributo download.
//
// USO (desde el Atelier):
//   <a href="<SUPABASE>/functions/v1/descargar-media?url=<r2url>&filename=<nombre>">
//
// DEPLOY: supabase functions deploy descargar-media --no-verify-jwt
//   (--no-verify-jwt es obligatorio: un <a href> no manda Authorization,
//    así que la descarga directa solo funciona sin verificación de JWT.
//    No expone nada sensible: solo proxie archivos públicos de R2.)
//
// SEGURIDAD: solo proxie hosts de R2 (no es un open proxy genérico).
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const CORS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS })
    }

    const reqUrl = new URL(req.url)
    const target = reqUrl.searchParams.get("url")
    const filename = (reqUrl.searchParams.get("filename") || "descarga")
        .replace(/[^\w.\-]/g, "_")
        .slice(0, 120)

    if (!target) {
        return new Response("Falta el parámetro url", {
            status: 400,
            headers: CORS,
        })
    }

    let parsed: URL
    try {
        parsed = new URL(target)
    } catch {
        return new Response("URL inválida", { status: 400, headers: CORS })
    }

    // Solo R2 — evita que esto se use como open proxy.
    const host = parsed.hostname.toLowerCase()
    if (
        !host.endsWith(".r2.dev") &&
        !host.endsWith(".r2.cloudflarestorage.com")
    ) {
        return new Response("Origen no permitido", {
            status: 403,
            headers: CORS,
        })
    }

    let upstream: Response
    try {
        upstream = await fetch(parsed.toString())
    } catch (e) {
        return new Response(`No se pudo traer el archivo: ${e}`, {
            status: 502,
            headers: CORS,
        })
    }

    if (!upstream.ok || !upstream.body) {
        return new Response(`Upstream respondió ${upstream.status}`, {
            status: 502,
            headers: CORS,
        })
    }

    const contentType =
        upstream.headers.get("content-type") || "application/octet-stream"

    return new Response(upstream.body, {
        status: 200,
        headers: {
            ...CORS,
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    })
})
