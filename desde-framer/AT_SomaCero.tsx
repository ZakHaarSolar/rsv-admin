// AT_SomaCero.tsx v1.13 — RPC admin por gateway admin-action (cierra IDOR Atelier, barrido 2026-06-13)
// v1.12 — Conciencia: selector de PILAR (Automático · Azúcar · Gluten · Aceites
//         · Soya · Veganismo). Eliges el eje y el motor genera ese; 'Automático'
//         rota entre los cinco. Pareja del edge generate-soma-posts v1.14.
// v1.11 — Ola C #3: las llamadas a edge mandan el token de Clerk verificado.
// v1.10 — Soma Cero abre los DOMINGOS (antes viernes), horario 8:00am–2:00pm. Se
//         renombró a "Domingo" todo lo visible (categoría, tarjeta del tablero,
//         toggle de tono, intro). El identificador interno de la categoría sigue
//         siendo 'viernes' (sin migración); solo cambia lo que ve el Tripulante.
// v1.9 — Copy del modo "Solo prompts" alineado al motor v1.7: el prompt pide
//        reproducir el waffle EXACTAMENTE como en las fotos reales, sin inventar
//        emplatado (se quitó la mención de "crema en espiral + plátano al centro"
//        porque hacía que Nano Banana alucinara una espiral que no es el waffle
//        real). El botón "Copiar prompt" persistente se mantiene.
// v1.8 — Botón "Copiar prompt" sigue disponible aunque ya hayas subido la imagen
//        (antes el prompt desaparecía al subir foto y no se podía recuperar). +
//        Copy del modo "Solo prompts" alineado al motor v1.6: las fotos de
//        referencia son del waffle REAL sin emplatar; el prompt le pide a Nano
//        Banana montar la presentación (crema en espiral + 1 trozo de plátano al
//        centro).
// v1.7 — El error de generación ahora muestra el detalle real del motor (antes
//        solo decía "copy_generation_failed" y se tragaba la causa). Sirve para
//        diagnosticar por qué falla un copy sin abrir los logs del Dashboard.
// v1.6 — Nueva categoría VIERNES (anuncio de apertura semanal). Selector con 4
//        categorías + tarjeta de dashboard "Viernes mes" + pill de color propio.
//        Toggle de TONO (Festivo / Elegante / Sorpresa) cuando la categoría es
//        Viernes, para que haya variedad entre anuncios. El cierre fijo del menú
//        (3 tamaños + precios + horario + WhatsApp + transferencia) lo pega el
//        motor (generate-soma-posts v1.5). Migración 20260604_soma_viernes.sql.
// v1.5 — Tema claro "VTLI" (override al final del CSS): lienzo claro, tarjetas
//        blancas, botones dorados que destacan, texto en tinta. + Botón "Resubir"
//        para reemplazar la imagen manual subida (input persistente reuploadRef).
// v1.4 — Default "Solo prompts" (en vez de API) para ahorrar costos. Botón en
//        singular por categoría ("Generar 1 · Meme"). Memes con giro a humor
//        ilustrado de personaje (motor v1.4). Selector de modo con Solo prompts
//        primero.
// v1.3 — Línea corta de marca "0 azúcar · 0 gluten · 100% vegano" (sin aceites
//        industriales). Toggle de EJE para memes: guiado (ejes en prioridad) o
//        aleatorio (Gemini elige el ángulo). Pareja del motor
//        generate-soma-posts v1.3.
// v1.2 — 3 CATEGORÍAS DE CONTENIDO seleccionables (Waffle Cero · Conciencia ·
//        Memes) con selector arriba, pill por categoría y dashboard por
//        categoría. Aviso de fotos de referencia en modo Solo prompts. Pareja
//        del motor generate-soma-posts v1.2 (migración 20260603d).
// v1.1 — Genera de 1 en 1 (no 3). Copy del panel afinado al VIBE COMIDA cálido
//        (crema, dorado miel, verde fresco, madera) en vez del look cosmético.
//        El cambio fuerte de estilo vive en el motor generate-soma-posts v1.1.
// v1.0 — Sub-panel SOMA CERO del Atelier de Marketing. Genera posts de Instagram
//        para Soma Cero (alimentos de alta conductividad, Cancún) con la misma
//        anatomía que VTLI Instagram: botón Generar (Waffle Cero), toggle
//        "Con API / Solo prompts", grilla de cards con imagen 3:4 + caption +
//        hashtags + acciones (aprobar/reroll/descargar/texto/borrar), modo manual
//        con subida de imagen + Publicado, polling con auto-reintento, historial.
//        Identidad visual propia: blancos cremosos + dorado miel (sin cian).
//        Hermano default-export de AtelierMarketing.tsx; se renderiza cuando
//        activeSubTab === "soma_cero".
//
// Backend:
//   · generate-soma-posts (copy Gemini 3.5 + imagen Nano Banana 2 → soma_posts)
//   · upload-vtli-post-image (con table="soma_posts" para la subida manual)
//   · descargar-media (proxy de descarga R2)
//   · RPCs: get_recent_soma_posts · get_soma_posts_by_ids ·
//           update_soma_post_status · set_soma_post_published ·
//           get_soma_atelier_dashboard · delete_soma_post
//   · Migración 20260603c_soma_atelier.sql

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS · HELPERS
   ═══════════════════════════════════════════════════════════════ */

// Identidad SOMA CERO: dorado miel + crema cálida (reemplaza el cian de VTLI).
const GOLD = "#D2A24C"
const CREAM = "#EBD9A8"

const hx = (hex: string, a = 1) => {
    const h = hex.replace("#", "")
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

const MAX_AUTO_RETRIES = 5
const AUTO_RETRY_THRESHOLD_SEC = 90

type SomaStatus =
    | "draft"
    | "approved"
    | "rejected"
    | "rerolled"
    | "published"

// Categorías de CONTENIDO (no sabores). Los sabores futuros del waffle serán
// otro eje (selector de producto) cuando lleguen.
type SomaCategory = "waffle" | "conciencia" | "memes" | "viernes"

interface CategoryDef {
    key: SomaCategory
    label: string // etiqueta del pill / chip del selector
    single: string // singular para el botón "Generar 1 · ___"
    long: string // descripción corta para el selector
    glyph: string
}

const CATEGORIES: CategoryDef[] = [
    {
        key: "waffle",
        label: "Waffle Cero",
        single: "Waffle Cero",
        long: "Promo del producto",
        glyph: "🧇",
    },
    {
        key: "conciencia",
        label: "Conciencia",
        single: "Conciencia",
        long: "Los 0% + vegano · ¿Sabías que…?",
        glyph: "🌱",
    },
    {
        key: "memes",
        label: "Memes",
        single: "Meme",
        long: "Humor ilustrado de personaje",
        glyph: "😄",
    },
    {
        // Identificador interno 'viernes' (enum DB, sin migración); se muestra
        // como "Domingo" porque Soma Cero ahora abre los domingos.
        key: "viernes",
        label: "Domingo",
        single: "Domingo",
        long: "Anuncio de apertura + menú",
        glyph: "🗓️",
    },
]

function catSingle(c: SomaCategory): string {
    return CATEGORIES.find((x) => x.key === c)?.single ?? "Waffle Cero"
}

function catLabel(c: SomaCategory): string {
    return CATEGORIES.find((x) => x.key === c)?.label ?? "Waffle Cero"
}

interface SomaPost {
    id: string
    category: SomaCategory
    target: string
    aha_moment: string
    prompt_visual: string
    caption: string
    hashtags: string[]
    pulso_nucleo: string | null
    image_r2_url: string | null
    image_mode: string | null // "prompts" = manual (sin API); "api"/null = normal
    is_published: boolean
    status: SomaStatus
    generated_at: string
    generated_by_clerk_id: string
    reroll_count: number
    parent_post_id: string | null
    reviewed_at: string | null
    reviewed_by_clerk_id: string | null
}

interface SomaDashboard {
    is_admin: boolean
    month_generated_waffle: number
    month_generated_conciencia: number
    month_generated_memes: number
    month_generated_viernes: number
    month_generated_total: number
    month_approved: number
    month_published: number
    total_lifetime: number
}

interface Props {
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    isMobile?: boolean
}

async function rpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any> = {}
) {
    if (!url || !key) return null
    try {
        // Familia admin del Atelier por gateway admin-action (token verificado;
        // el server inyecta el id admin, descarta el del body). Fallback
        // transitorio a la llamada directa hasta el REVOKE.
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/admin-action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ token, action: fn, params }),
            })
            if (g.ok) return await g.json()
        }
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

// Reduce la imagen a maxSide px (lado largo) → base64 JPEG. Mantiene el payload
// chico para el upload de la imagen manual del post.
function resizePostImageToBase64(
    file: File,
    maxSide = 1080
): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () =>
                reject(new Error("No se pudo cargar la imagen"))
            img.onload = () => {
                let w = img.naturalWidth || img.width
                let h = img.naturalHeight || img.height
                const scale = Math.min(1, maxSide / Math.max(w, h))
                w = Math.max(1, Math.round(w * scale))
                h = Math.max(1, Math.round(h * scale))
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("No se pudo procesar la imagen"))
                    return
                }
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
                const base64 = dataUrl.split(",")[1] || ""
                resolve({ base64, mime: "image/jpeg" })
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

/* ═══════════════════════════════════════════════════════════════
   2. CSS (clases sm- · aisladas de las at- del shell)
   ═══════════════════════════════════════════════════════════════ */

const CSS = `
.sm-root{max-width:1280px;margin:0 auto}
.sm-root *{box-sizing:border-box}
.sm-intro{margin:0 0 24px;padding:16px 20px;border-radius:14px;border:1px solid ${hx(GOLD, 0.22)};background:linear-gradient(135deg,${hx(GOLD, 0.06)},rgba(255,255,255,0.015));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.sm-intro-title{font-size:12px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GOLD};margin:0 0 6px;text-shadow:0 0 10px ${hx(GOLD, 0.3)}}
.sm-intro-text{font-size:11px;font-weight:400;color:rgba(255,255,255,0.7);margin:0;line-height:1.5;letter-spacing:0.02em}

.sm-dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px}
.sm-stat{padding:18px 16px;border-radius:14px;border:1px solid ${hx(GOLD, 0.18)};background:linear-gradient(135deg,${hx(GOLD, 0.04)},rgba(255,255,255,0.02));text-align:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.sm-stat-num{font-size:26px;font-weight:200;color:${GOLD};letter-spacing:-0.02em;margin:0 0 4px;text-shadow:0 0 10px ${hx(GOLD, 0.4)}}
.sm-stat-lbl{font-size:9px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0}

.sm-mode-toggle{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.sm-mode-label{font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5)}
.sm-mode-btn{padding:7px 16px;border-radius:9px;border:1px solid ${hx(GOLD, 0.3)};background:transparent;color:rgba(255,255,255,0.7);font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0.04em;cursor:pointer;transition:all 0.2s}
.sm-mode-btn:disabled{opacity:0.5;cursor:wait}
.sm-mode-btn.on{background:${hx(GOLD, 0.16)};border-color:${hx(GOLD, 0.6)};color:#fff}
.sm-mode-hint{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.4;flex-basis:100%}

.sm-gen-wrap{margin-bottom:34px}
.sm-gen-btn{width:100%;padding:24px 28px;border-radius:16px;border:1px solid ${hx(GOLD, 0.42)};background:linear-gradient(135deg,${hx(GOLD, 0.12)},${hx(GOLD, 0.04)});color:#fff;font-family:inherit;font-size:13px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none;text-align:left;display:flex;align-items:center;gap:16px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);position:relative;overflow:hidden}
.sm-gen-btn:hover:not(:disabled){border-color:${hx(GOLD, 0.75)};background:linear-gradient(135deg,${hx(GOLD, 0.2)},${hx(GOLD, 0.07)});box-shadow:0 0 28px ${hx(GOLD, 0.22)}}
.sm-gen-btn:disabled{opacity:0.6;cursor:wait}
.sm-gen-btn.busy::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,${hx(GOLD, 0.2)},transparent);background-size:200% 100%;animation:smShimmer 1.6s linear infinite;pointer-events:none}
@keyframes smShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.sm-gen-glyph{width:46px;height:46px;flex-shrink:0;border-radius:50%;border:1.5px solid ${hx(GOLD, 0.5)};display:flex;align-items:center;justify-content:center;font-size:22px}
.sm-gen-text{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1}
.sm-gen-main{font-size:14px;font-weight:600;letter-spacing:0.14em;color:#fff}
.sm-gen-sub{font-size:9px;font-weight:400;letter-spacing:0.02em;color:rgba(255,255,255,0.55);text-transform:none}

.sm-batch-header{margin:0 0 18px;padding:14px 18px;border-radius:12px;border:1px solid ${hx(CREAM, 0.3)};background:${hx(CREAM, 0.05)};display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sm-batch-title{font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${CREAM};margin:0}
.sm-batch-meta{font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);letter-spacing:0.04em}

.sm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;margin-bottom:42px}
.sm-card{border-radius:18px;border:1px solid rgba(255,255,255,0.16);background:linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015));overflow:hidden;display:flex;flex-direction:column;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s}
.sm-card:hover{border-color:${hx(GOLD, 0.35)};box-shadow:0 12px 36px rgba(0,0,0,0.45)}
.sm-card.status-approved{border-color:${hx(GOLD, 0.5)};box-shadow:0 0 24px ${hx(GOLD, 0.18)} inset}
.sm-card.status-rejected{opacity:0.55;border-color:rgba(255,100,100,0.25)}
.sm-card.status-rerolled{opacity:0.65;border-color:rgba(180,180,180,0.18)}
.sm-card.status-published{border-color:rgba(140,255,200,0.4);box-shadow:0 0 24px rgba(140,255,200,0.18) inset}
.sm-card.pending{border-color:${hx(GOLD, 0.32)};animation:smPendingPulse 2.6s ease-in-out infinite}
@keyframes smPendingPulse{0%,100%{box-shadow:0 0 0 ${hx(GOLD, 0)}}50%{box-shadow:0 0 28px ${hx(GOLD, 0.15)}}}
.sm-card.failed{border-color:rgba(255,120,120,0.4);opacity:0.7}

.sm-card-image{position:relative;width:100%;aspect-ratio:3/4;background:#0a0a14;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:zoom-in}
.sm-card-image img{width:100%;height:100%;object-fit:cover;display:block}
.sm-card-image-pending{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:${hx(GOLD, 0.85)};font-size:10px;letter-spacing:0.24em;text-transform:uppercase;font-weight:500;padding:24px;text-align:center}
.sm-card-image-spinner{width:38px;height:38px;border-radius:50%;border:2px solid ${hx(GOLD, 0.2)};border-top-color:${GOLD};animation:smSpin 1.1s linear infinite}
@keyframes smSpin{to{transform:rotate(360deg)}}
.sm-card-image-retry{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px}
.sm-card-image-retry-label{font-size:10px;color:rgba(255,180,180,0.78);letter-spacing:0.18em;text-transform:uppercase;font-weight:500;text-align:center;line-height:1.5}
.sm-card-image-retry-btn{padding:10px 18px;border-radius:8px;border:1px solid ${hx(GOLD, 0.55)};background:${hx(GOLD, 0.1)};color:${GOLD};font-family:inherit;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none}
.sm-card-image-retry-btn:hover:not(:disabled){background:${hx(GOLD, 0.2)};border-color:${hx(GOLD, 0.8)};box-shadow:0 0 16px ${hx(GOLD, 0.3)}}
.sm-card-image-retry-btn:disabled{opacity:0.45;cursor:wait}
.sm-card-image-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:24px;cursor:pointer;text-align:center;color:rgba(255,255,255,0.62);font-size:10px;letter-spacing:0.04em;line-height:1.4}
.sm-card-image-upload:hover{color:${GOLD}}
.sm-card-upload-icon{font-size:26px;color:${hx(GOLD, 0.85)}}
.sm-card-upload-hint{font-size:9px;color:rgba(255,255,255,0.4)}

.sm-card-status-pill{position:absolute;top:10px;right:10px;padding:5px 10px;border-radius:6px;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.sm-card-status-pill.draft{color:rgba(255,255,255,0.62);border:1px solid rgba(255,255,255,0.2)}
.sm-card-status-pill.approved{color:${GOLD};border:1px solid ${hx(GOLD, 0.5)}}
.sm-card-status-pill.rejected{color:rgba(255,140,140,0.85);border:1px solid rgba(255,140,140,0.4)}
.sm-card-status-pill.rerolled{color:rgba(200,200,200,0.7);border:1px solid rgba(200,200,200,0.3)}
.sm-card-status-pill.published{color:rgba(140,255,200,0.9);border:1px solid rgba(140,255,200,0.5)}
.sm-card-cat-pill{position:absolute;top:10px;left:10px;padding:5px 10px;border-radius:6px;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:${CREAM};border:1px solid ${hx(CREAM, 0.5)}}
.sm-card-cat-pill.cat-waffle{color:${GOLD};border-color:${hx(GOLD, 0.5)}}
.sm-card-cat-pill.cat-conciencia{color:#8FCF9E;border-color:rgba(143,207,158,0.5)}
.sm-card-cat-pill.cat-memes{color:#E8A86B;border-color:rgba(232,168,107,0.5)}
.sm-card-cat-pill.cat-viernes{color:#E89BA0;border-color:rgba(232,155,160,0.5)}

.sm-cat-select{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.sm-cat-btn{flex:1;min-width:150px;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:13px;border:1px solid rgba(255,255,255,0.16);background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));color:#fff;font-family:inherit;cursor:pointer;transition:all 0.25s;outline:none;text-align:left}
.sm-cat-btn:hover{border-color:${hx(GOLD, 0.4)}}
.sm-cat-btn.on{border-color:${hx(GOLD, 0.6)};background:${hx(GOLD, 0.1)};box-shadow:inset 0 0 14px ${hx(GOLD, 0.12)}}
.sm-cat-glyph{width:38px;height:38px;flex-shrink:0;border-radius:50%;border:1px solid ${hx(GOLD, 0.4)};display:flex;align-items:center;justify-content:center;font-size:18px}
.sm-cat-txt{display:flex;flex-direction:column;gap:3px;min-width:0}
.sm-cat-main{font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase}
.sm-cat-sub{font-size:9px;font-weight:400;color:rgba(255,255,255,0.55);letter-spacing:0.02em}

.sm-card-body{padding:16px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.sm-card-target{font-size:9px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:0}
.sm-card-aha{font-size:13px;font-weight:500;color:#fff;line-height:1.4;margin:0;font-style:italic}
.sm-card-caption{font-size:11px;font-weight:400;color:rgba(255,255,255,0.78);line-height:1.5;white-space:pre-wrap;margin:0;max-height:200px;overflow-y:auto;padding-right:4px}
.sm-card-hashtags{font-size:10px;color:${hx(CREAM, 0.85)};font-weight:400;line-height:1.5;letter-spacing:0.02em;margin:0}
.sm-card-pulso{font-size:10px;color:rgba(255,255,255,0.45);font-style:italic;border-left:2px solid ${hx(GOLD, 0.35)};padding:4px 0 4px 10px;margin:6px 0 0}
.sm-card-promptbox{background:rgba(0,0,0,0.25);border:1px solid ${hx(GOLD, 0.22)};border-radius:10px;padding:9px 10px;margin-bottom:4px}
.sm-card-promptbox-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.sm-card-promptbox-head span{font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${hx(GOLD, 0.85)};font-weight:600}
.sm-card-promptbox-copy{border:1px solid ${hx(GOLD, 0.4)};background:transparent;color:${GOLD};font-size:9px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit;flex-shrink:0}
.sm-card-promptbox-copy:hover{background:${hx(GOLD, 0.12)}}
.sm-card-prompt{font-size:10px;color:rgba(255,255,255,0.7);line-height:1.45;white-space:pre-wrap;margin:0;max-height:130px;overflow-y:auto;padding-right:4px}
.sm-card-prompt-recopy{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:8px;border:1px solid ${hx(GOLD, 0.4)};background:${hx(GOLD, 0.07)};color:${GOLD};font-family:inherit;font-size:10px;font-weight:600;letter-spacing:0.04em;cursor:pointer;transition:all 0.2s;outline:none}
.sm-card-prompt-recopy:hover{background:${hx(GOLD, 0.16)};border-color:${hx(GOLD, 0.7)}}

.sm-card-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.18)}
.sm-action{padding:9px 6px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#fff;font-family:inherit;font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none;display:flex;align-items:center;justify-content:center;gap:4px}
.sm-action:hover:not(:disabled){background:rgba(255,255,255,0.08)}
.sm-action:disabled{opacity:0.35;cursor:not-allowed}
.sm-action.approve:hover:not(:disabled){border-color:${hx(GOLD, 0.6)};color:${GOLD};background:${hx(GOLD, 0.08)}}
.sm-action.reroll:hover:not(:disabled){border-color:${hx(CREAM, 0.6)};color:${CREAM};background:${hx(CREAM, 0.08)}}
.sm-action.download:hover:not(:disabled){border-color:rgba(255,255,255,0.4);color:#fff}
.sm-action.copy:hover:not(:disabled){border-color:rgba(255,255,255,0.4);color:#fff}
.sm-action.delete:hover:not(:disabled){border-color:rgba(255,120,120,0.55);color:rgba(255,170,170,0.95);background:rgba(255,80,80,0.08)}
.sm-action.publish{border-color:rgba(255,255,255,0.18);color:rgba(255,255,255,0.6)}
.sm-action.publish:hover:not(:disabled){border-color:rgba(120,230,160,0.5);color:rgba(180,240,200,0.92)}
.sm-action.publish.on{border-color:rgba(80,220,130,0.6);color:#7fe6a0;background:rgba(80,220,130,0.14)}

.sm-section-header{font-size:11px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:${GOLD};margin:40px 0 18px;padding-bottom:10px;border-bottom:1px solid ${hx(GOLD, 0.2)};display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sm-section-header-count{font-size:10px;color:rgba(255,255,255,0.5);font-weight:400;letter-spacing:0.04em}
.sm-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.sm-filter{padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:rgba(255,255,255,0.75);font-family:inherit;font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none}
.sm-filter:hover{border-color:${hx(GOLD, 0.4)};color:${GOLD}}
.sm-filter.active{border-color:${hx(GOLD, 0.6)};background:${hx(GOLD, 0.08)};color:${GOLD}}

.sm-empty{padding:34px 20px;text-align:center;color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.06em;border-radius:12px;border:1px dashed rgba(255,255,255,0.12);font-style:italic}
.sm-error{padding:14px 18px;border-radius:10px;border:1px solid rgba(255,120,120,0.4);background:rgba(255,80,80,0.08);color:rgba(255,180,180,0.92);font-size:11px;line-height:1.5;margin-bottom:18px;letter-spacing:0.02em}

.sm-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:10px;background:${hx(GOLD, 0.96)};color:#1a1208;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;z-index:9999;box-shadow:0 8px 28px rgba(0,0,0,0.45);backdrop-filter:blur(10px)}
.sm-lightbox{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:32px;cursor:zoom-out;backdrop-filter:blur(8px)}
.sm-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 12px 60px rgba(0,0,0,0.7)}
.sm-lightbox-close{position:absolute;top:24px;right:24px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.6);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:200}

@media (max-width:768px){
    .sm-dashboard{grid-template-columns:repeat(2,1fr);gap:8px}
    .sm-stat{padding:14px 10px}
    .sm-stat-num{font-size:21px}
    .sm-grid{grid-template-columns:1fr;gap:16px}
    .sm-card-actions{grid-template-columns:repeat(3,minmax(0,1fr))}
}

/* ════════ TEMA CLARO "VTLI" (estilo veotuluzinterna.com) — overrides ════════ */
.sm-root{color:#2E333C}
.sm-intro{border:1px solid rgba(168,116,24,0.28);background:#FFFFFF;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 6px 22px rgba(60,82,115,0.08)}
.sm-intro-title{color:#A9781F;text-shadow:none}
.sm-intro-text{color:#545C66}
.sm-stat{background:#FFFFFF;border:1px solid rgba(60,82,115,0.12);box-shadow:0 8px 26px rgba(60,82,115,0.10);backdrop-filter:none;-webkit-backdrop-filter:none}
.sm-stat-num{color:#A9781F;text-shadow:none}
.sm-stat-lbl{color:#6B7480}
.sm-cat-btn{background:#FFFFFF;border:1px solid rgba(60,82,115,0.14);color:#3A3F48}
.sm-cat-btn:hover{border-color:${hx(GOLD, 0.5)}}
.sm-cat-btn.on{border-color:${hx(GOLD, 0.7)};background:${hx(GOLD, 0.12)};box-shadow:none}
.sm-cat-glyph{border-color:rgba(168,116,24,0.4)}
.sm-cat-main{color:#2E333C}
.sm-cat-sub{color:#6B7480}
.sm-mode-label{color:#6B7480}
.sm-mode-btn{color:#545C66;border:1px solid rgba(168,116,24,0.4);background:#FFFFFF}
.sm-mode-btn.on{background:${hx(GOLD, 0.16)};border-color:${hx(GOLD, 0.7)};color:#8A6418}
.sm-mode-hint{color:#6B7480}
.sm-gen-btn{color:#3A2E12;border:1px solid rgba(168,116,24,0.5);background:linear-gradient(135deg,#E6C470 0%,#D4A843 100%);box-shadow:0 8px 22px rgba(176,128,40,0.28);backdrop-filter:none;-webkit-backdrop-filter:none}
.sm-gen-btn:hover:not(:disabled){border-color:rgba(168,116,24,0.7);background:linear-gradient(135deg,#EBCD80 0%,#D9AE49 100%);box-shadow:0 10px 28px rgba(176,128,40,0.4)}
.sm-gen-glyph{border-color:rgba(58,46,18,0.4)}
.sm-gen-main{color:#3A2E12}
.sm-gen-sub{color:rgba(58,46,18,0.72)}
.sm-batch-header{border:1px solid rgba(94,137,176,0.35);background:rgba(94,137,176,0.10)}
.sm-batch-title{color:#3F6E96}
.sm-batch-meta{color:#5E6772}
.sm-card{background:#FFFFFF;border:1px solid rgba(60,82,115,0.12);box-shadow:0 8px 30px rgba(60,82,115,0.10);backdrop-filter:none;-webkit-backdrop-filter:none}
.sm-card:hover{border-color:${hx(GOLD, 0.55)};box-shadow:0 14px 36px rgba(60,82,115,0.16)}
.sm-card.status-published{border-color:rgba(70,190,140,0.55)}
.sm-card-image{background:#EAEEF2}
.sm-card-image-upload{color:#5E6772}
.sm-card-upload-hint{color:#9AA2AC}
.sm-card-promptbox{background:#F0F4F7;border:1px solid rgba(168,116,24,0.3)}
.sm-card-promptbox-head span{color:#A9781F}
.sm-card-promptbox-copy{border-color:rgba(168,116,24,0.4);color:#A9781F}
.sm-card-promptbox-copy:hover{background:rgba(168,116,24,0.1)}
.sm-card-prompt{color:#545C66}
.sm-card-prompt-recopy{border-color:rgba(168,116,24,0.4);background:rgba(168,116,24,0.08);color:#A9781F}
.sm-card-prompt-recopy:hover{background:rgba(168,116,24,0.16);border-color:rgba(168,116,24,0.7)}
.sm-card-actions{border-top:1px solid rgba(60,82,115,0.1);background:#FAFBFC}
.sm-action{color:#4A515B;border:1px solid rgba(60,82,115,0.16)}
.sm-action:hover:not(:disabled){background:rgba(60,82,115,0.06)}
.sm-action.approve:hover:not(:disabled){border-color:${hx(GOLD, 0.7)};color:#8A6418;background:${hx(GOLD, 0.1)}}
.sm-action.reroll:hover:not(:disabled){border-color:rgba(94,137,176,0.7);color:#3F6E96;background:rgba(94,137,176,0.1)}
.sm-action.download:hover:not(:disabled),.sm-action.copy:hover:not(:disabled){border-color:rgba(60,82,115,0.4);color:#2E333C}
.sm-action.publish{border-color:rgba(60,82,115,0.16);color:#6B7480}
.sm-card-target{color:#97A0AA}
.sm-card-aha{color:#2E333C}
.sm-card-caption{color:#4A515B}
.sm-card-hashtags{color:#3F6E96}
.sm-card-pulso{color:#7A828C;border-left-color:${hx(GOLD, 0.5)}}
.sm-section-header{color:#A9781F;border-bottom:1px solid rgba(168,116,24,0.3)}
.sm-section-header-count{color:#6B7480}
.sm-filter{background:#FFFFFF;color:#545C66;border:1px solid rgba(60,82,115,0.14)}
.sm-filter:hover{border-color:${hx(GOLD, 0.6)};color:#A9781F}
.sm-filter.active{background:${hx(GOLD, 0.14)};border-color:${hx(GOLD, 0.7)};color:#8A6418}
.sm-empty{color:#8A929C;border:1px dashed rgba(60,82,115,0.18)}
.sm-error{background:rgba(214,69,69,0.08);border:1px solid rgba(214,69,69,0.35);color:#B23A3A}
`

/* ═══════════════════════════════════════════════════════════════
   3. POST CARD
   ═══════════════════════════════════════════════════════════════ */

interface PostCardProps {
    post: SomaPost
    isProcessing: boolean
    autoRetryCount: number
    autoRetriesExhausted: boolean
    onApprove: () => void
    onPublish: () => void
    onReroll: () => void
    onDownload: () => void
    onCopy: () => void
    onDelete: () => void
    onRetryImage: () => void
    onZoom: (url: string) => void
    onUploadImage: (file: File) => void
    onCopyPrompt: () => void
    onTogglePublished: () => void
    uploading: boolean
}

function PostCard({
    post,
    isProcessing,
    autoRetryCount,
    autoRetriesExhausted,
    onApprove,
    onPublish,
    onReroll,
    onDownload,
    onCopy,
    onDelete,
    onRetryImage,
    onZoom,
    onUploadImage,
    onCopyPrompt,
    onTogglePublished,
    uploading,
}: PostCardProps) {
    const isManual = post.image_mode === "prompts"
    const fileInputRef = useRef<HTMLInputElement>(null)
    // Input persistente para "Resubir" la imagen manual (reemplaza la que ya subiste).
    const reuploadRef = useRef<HTMLInputElement>(null)

    const isPendingImage =
        !post.image_r2_url && post.status !== "rejected" && !isManual
    const isFailedImage =
        !post.image_r2_url && post.status === "rejected" && !isManual
    const secondsSinceGenerated =
        (Date.now() - new Date(post.generated_at).getTime()) / 1000
    const isStuckPending =
        isPendingImage &&
        (autoRetriesExhausted ||
            secondsSinceGenerated >
                AUTO_RETRY_THRESHOLD_SEC * MAX_AUTO_RETRIES + 30)
    const cardClass = `sm-card status-${post.status}${isPendingImage && !isStuckPending ? " pending" : ""}${isFailedImage || isStuckPending ? " failed" : ""}`
    const statusLabel = (() => {
        switch (post.status) {
            case "draft":
                return isStuckPending ? "Atascado" : "Borrador"
            case "approved":
                return "Aprobado"
            case "rejected":
                return "Rechazado"
            case "rerolled":
                return "Reroll"
            case "published":
                return "Publicado"
        }
    })()
    const isFinal = post.status !== "draft" && post.status !== "approved"

    return (
        <div className={cardClass}>
            <div
                className="sm-card-image"
                onClick={() =>
                    post.image_r2_url && onZoom(post.image_r2_url)
                }
                style={
                    isPendingImage || isFailedImage
                        ? { cursor: "default" }
                        : undefined
                }
            >
                {post.image_r2_url ? (
                    <img
                        src={post.image_r2_url}
                        alt={post.target}
                        loading="lazy"
                    />
                ) : isManual ? (
                    <div
                        className="sm-card-image-upload"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!uploading) fileInputRef.current?.click()
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) onUploadImage(f)
                                if (fileInputRef.current)
                                    fileInputRef.current.value = ""
                            }}
                        />
                        {uploading ? (
                            <>
                                <div className="sm-card-image-spinner" />
                                <span>Subiendo…</span>
                            </>
                        ) : (
                            <>
                                <span className="sm-card-upload-icon">⬆</span>
                                <span>Sube tu imagen de Nano Banana</span>
                                <span className="sm-card-upload-hint">
                                    (registro de la pieza final)
                                </span>
                            </>
                        )}
                    </div>
                ) : isFailedImage || isStuckPending ? (
                    <div className="sm-card-image-retry">
                        <div className="sm-card-image-retry-label">
                            {isFailedImage ? "Imagen falló" : "Tiempo agotado"}
                        </div>
                        <button
                            className="sm-card-image-retry-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRetryImage()
                            }}
                            disabled={isProcessing}
                            title="Regenerar la imagen reusando el mismo prompt"
                        >
                            ↻ Reintentar imagen
                        </button>
                    </div>
                ) : (
                    <div className="sm-card-image-pending">
                        <div className="sm-card-image-spinner" />
                        <span>
                            {autoRetryCount > 0
                                ? `Reintentando ${autoRetryCount} de ${MAX_AUTO_RETRIES}`
                                : "Materializando"}
                        </span>
                    </div>
                )}
                <div className={`sm-card-cat-pill cat-${post.category}`}>
                    {catLabel(post.category)}
                </div>
                <div className={`sm-card-status-pill ${post.status}`}>
                    {statusLabel}
                </div>
            </div>

            {isManual && (
                <input
                    ref={reuploadRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onUploadImage(f)
                        if (reuploadRef.current) reuploadRef.current.value = ""
                    }}
                />
            )}

            <div className="sm-card-body">
                <p className="sm-card-target">
                    {post.target.replace(/_/g, " ")}
                </p>
                {isManual && !post.image_r2_url && (
                    <div className="sm-card-promptbox">
                        <div className="sm-card-promptbox-head">
                            <span>Prompt para Nano Banana</span>
                            <button
                                className="sm-card-promptbox-copy"
                                onClick={onCopyPrompt}
                            >
                                📋 Copiar prompt
                            </button>
                        </div>
                        <pre className="sm-card-prompt">
                            {post.prompt_visual}
                        </pre>
                    </div>
                )}
                {isManual && post.image_r2_url && post.prompt_visual && (
                    <button
                        type="button"
                        className="sm-card-prompt-recopy"
                        onClick={onCopyPrompt}
                        title="Copiar de nuevo el prompt de Nano Banana de este post (sigue disponible aunque ya hayas subido la imagen)"
                    >
                        📋 Copiar prompt de Nano Banana
                    </button>
                )}
                {post.aha_moment && (
                    <p className="sm-card-aha">"{post.aha_moment}"</p>
                )}
                <pre className="sm-card-caption">{post.caption}</pre>
                {post.hashtags.length > 0 && (
                    <p className="sm-card-hashtags">
                        {post.hashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                )}
                {post.pulso_nucleo && (
                    <p className="sm-card-pulso">Pulso: {post.pulso_nucleo}</p>
                )}
            </div>

            <div className="sm-card-actions">
                {isManual ? (
                    <>
                        <button
                            className={`sm-action publish${post.is_published ? " on" : ""}`}
                            onClick={onTogglePublished}
                            disabled={isProcessing}
                            title={
                                post.is_published
                                    ? "Marcado como publicado — pica para desmarcar"
                                    : "Marcar como publicado"
                            }
                        >
                            {post.is_published ? "✓ Publicado" : "○ Publicado"}
                        </button>
                        <button
                            className="sm-action reroll"
                            onClick={() => {
                                if (!uploading) reuploadRef.current?.click()
                            }}
                            disabled={uploading}
                            title="Subir otra imagen en lugar de la actual (reemplaza la que subiste)"
                        >
                            {uploading ? "…" : "⤵ Resubir"}
                        </button>
                        <button
                            className="sm-action download"
                            onClick={onDownload}
                            disabled={!post.image_r2_url}
                            title="Descargar la imagen que subiste"
                        >
                            ↓ Imagen
                        </button>
                        <button
                            className="sm-action copy"
                            onClick={onCopy}
                            title="Copiar caption + hashtags al portapapeles"
                        >
                            📋 Texto
                        </button>
                        <button
                            className="sm-action delete"
                            onClick={onDelete}
                            disabled={isProcessing}
                            title="Borrar este post de la base de datos"
                        >
                            ✕ Borrar
                        </button>
                    </>
                ) : (
                    <>
                        {post.status === "approved" ? (
                            <button
                                className="sm-action approve"
                                onClick={onPublish}
                                disabled={isProcessing}
                                title="Marcar como publicado en Instagram"
                            >
                                ↗ Publicar
                            </button>
                        ) : (
                            <button
                                className="sm-action approve"
                                onClick={onApprove}
                                disabled={
                                    isProcessing ||
                                    isFinal ||
                                    !post.image_r2_url
                                }
                                title="Aprobar para alimentar la memoria anti-repetición"
                            >
                                ✓ Aprobar
                            </button>
                        )}
                        <button
                            className="sm-action reroll"
                            onClick={onReroll}
                            disabled={
                                isProcessing || isFinal || !post.image_r2_url
                            }
                            title="Generar variante nueva apuntando a este como padre"
                        >
                            ↻ Reroll
                        </button>
                        <button
                            className="sm-action download"
                            onClick={onDownload}
                            disabled={!post.image_r2_url}
                            title="Descargar imagen 1080×1440"
                        >
                            ↓ Imagen
                        </button>
                        <button
                            className="sm-action copy"
                            onClick={onCopy}
                            title="Copiar caption + hashtags al portapapeles"
                        >
                            📋 Texto
                        </button>
                        <button
                            className="sm-action delete"
                            onClick={onDelete}
                            disabled={isProcessing}
                            title="Borrar este post de la base de datos"
                        >
                            ✕ Borrar
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   4. MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

const HISTORY_FILTERS: { key: SomaStatus | "all"; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "draft", label: "Borradores" },
    { key: "approved", label: "Aprobados" },
    { key: "published", label: "Publicados" },
    { key: "rejected", label: "Rechazados" },
]

function AtelierSomaCero({
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
}: Props) {
    const userId = clerkUserId
    const [category, setCategory] = useState<SomaCategory>("waffle")
    // Solo memes: eje guiado (false) vs aleatorio (true, Gemini elige el ángulo).
    const [memeRandomAxis, setMemeRandomAxis] = useState(false)
    // Solo viernes: tono del anuncio (festivo / elegante / sorpresa = variedad).
    const [viernesTone, setViernesTone] = useState<
        "festivo" | "elegante" | "sorpresa"
    >("sorpresa")
    // Solo conciencia: pilar a tratar (auto = rota; o uno fijo).
    const [concienciaPilar, setConcienciaPilar] = useState<
        "auto" | "azucar" | "gluten" | "aceites" | "soya" | "veganismo"
    >("auto")
    // Default "Solo prompts" (manual, $0) para ahorrar costos; API es opcional.
    const [imageMode, setImageMode] = useState<"api" | "prompts">("prompts")
    const [generating, setGenerating] = useState(false)
    const [processingPostId, setProcessingPostId] = useState<string | null>(
        null
    )
    const [uploadingPostId, setUploadingPostId] = useState<string | null>(
        null
    )
    const [currentBatch, setCurrentBatch] = useState<SomaPost[]>([])
    const [history, setHistory] = useState<SomaPost[]>([])
    const [dashboard, setDashboard] = useState<SomaDashboard | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const [histFilter, setHistFilter] = useState<SomaStatus | "all">("all")
    // Re-render tick para que las cards reciban los counts de auto-retry.
    const [, setRetryTick] = useState(0)

    // Refs para el polling (lee siempre el último estado sin recrear el interval)
    const currentBatchRef = useRef<SomaPost[]>([])
    const historyRef = useRef<SomaPost[]>([])
    const autoRetriedRef = useRef<Map<string, number>>(new Map())
    useEffect(() => {
        currentBatchRef.current = currentBatch
    }, [currentBatch])
    useEffect(() => {
        historyRef.current = history
    }, [history])

    const showToast = useCallback((msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 2200)
    }, [])

    /* ─── Inyección de CSS ─── */
    useEffect(() => {
        const id = "soma-cero-atelier-css-v1"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])

    /* ─── Loaders ─── */
    const loadDashboard = useCallback(async () => {
        if (!userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_soma_atelier_dashboard",
            { p_admin_clerk_id: userId }
        )
        if (r && r.is_admin) setDashboard(r as SomaDashboard)
    }, [userId, supabaseUrl, supabaseAnonKey])

    const loadHistory = useCallback(async () => {
        if (!userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_recent_soma_posts",
            {
                p_admin_clerk_id: userId,
                p_category: null,
                p_status: null,
                p_limit: 60,
            }
        )
        if (r && Array.isArray(r.posts)) setHistory(r.posts as SomaPost[])
    }, [userId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        if (userId) {
            loadDashboard()
            loadHistory()
        }
    }, [userId, loadDashboard, loadHistory])

    /* ─── Generate ─── */
    const handleGenerate = useCallback(async () => {
        if (!userId || generating) return
        setErrorMsg(null)
        setGenerating(true)
        try {
            const url = `${supabaseUrl}/functions/v1/generate-soma-posts`
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    admin_clerk_id: userId,
                    token: await (window as any).Clerk?.session?.getToken?.(),
                    category,
                    count: 1,
                    image_mode: imageMode,
                    meme_random_axis:
                        category === "memes" ? memeRandomAxis : false,
                    viernes_tone:
                        category === "viernes" ? viernesTone : undefined,
                    conciencia_pilar:
                        category === "conciencia"
                            ? concienciaPilar
                            : undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                const detail = data?.detail ? ` — ${data.detail}` : ""
                throw new Error(
                    `${data?.error || `HTTP ${res.status}`}${detail}`
                )
            }
            if (Array.isArray(data?.posts) && data.posts.length > 0) {
                setCurrentBatch(data.posts as SomaPost[])
                showToast(
                    imageMode === "prompts"
                        ? `Prompts listos · ${data.posts.length} para generar a mano`
                        : `Copy listo · ${data.posts.length} imágenes materializando`
                )
            } else {
                throw new Error("Respuesta vacía del motor")
            }
            loadDashboard()
            loadHistory()
        } catch (err: any) {
            console.error("[soma:gen]", err)
            setErrorMsg(
                `Error generando ${catLabel(category)}: ${err?.message ?? "desconocido"}`
            )
        } finally {
            setGenerating(false)
        }
    }, [
        userId,
        generating,
        category,
        memeRandomAxis,
        viernesTone,
        concienciaPilar,
        imageMode,
        supabaseUrl,
        supabaseAnonKey,
        loadDashboard,
        loadHistory,
        showToast,
    ])

    /* ─── Reroll ─── */
    const handleReroll = useCallback(
        async (postId: string) => {
            if (!userId || processingPostId) return
            setProcessingPostId(postId)
            setErrorMsg(null)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-soma-posts`
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        admin_clerk_id: userId,
                        token: await (window as any).Clerk?.session?.getToken?.(),
                        reroll_of_post_id: postId,
                    }),
                })
                const data = await res.json()
                if (!res.ok)
                    throw new Error(data?.error || `HTTP ${res.status}`)
                if (Array.isArray(data?.posts) && data.posts.length > 0) {
                    const newPost = data.posts[0] as SomaPost
                    setCurrentBatch((prev) =>
                        prev.map((p) => (p.id === postId ? newPost : p))
                    )
                    showToast("Reroll en curso · imagen materializando")
                }
                loadDashboard()
                loadHistory()
            } catch (err: any) {
                console.error("[soma:reroll]", err)
                setErrorMsg(`Reroll falló: ${err?.message ?? "desconocido"}`)
            } finally {
                setProcessingPostId(null)
            }
        },
        [
            userId,
            processingPostId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboard,
            loadHistory,
            showToast,
        ]
    )

    /* ─── Status (approve / publish) ─── */
    const handleUpdateStatus = useCallback(
        async (postId: string, newStatus: SomaStatus) => {
            if (!userId || processingPostId) return
            setProcessingPostId(postId)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "update_soma_post_status",
                    {
                        p_admin_clerk_id: userId,
                        p_post_id: postId,
                        p_new_status: newStatus,
                    }
                )
                if (r?.success) {
                    const apply = (prev: SomaPost[]) =>
                        prev.map((p) =>
                            p.id === postId
                                ? { ...p, status: newStatus }
                                : p
                        )
                    setCurrentBatch(apply)
                    setHistory(apply)
                    const labels: Record<SomaStatus, string> = {
                        draft: "Borrador",
                        approved: "Aprobado",
                        rejected: "Rechazado",
                        rerolled: "Reroll",
                        published: "Publicado",
                    }
                    showToast(labels[newStatus])
                    loadDashboard()
                    loadHistory()
                } else {
                    setErrorMsg(r?.error || "No se pudo actualizar el estado")
                }
            } finally {
                setProcessingPostId(null)
            }
        },
        [
            userId,
            processingPostId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboard,
            loadHistory,
            showToast,
        ]
    )

    /* ─── Download (proxy R2) ─── */
    const handleDownload = useCallback(
        (post: SomaPost) => {
            if (!post.image_r2_url) return
            const filename = `somacero_${post.target}_${post.id.slice(0, 8)}.png`
            const proxy = `${supabaseUrl}/functions/v1/descargar-media?url=${encodeURIComponent(
                post.image_r2_url
            )}&filename=${encodeURIComponent(filename)}`
            const a = document.createElement("a")
            a.href = proxy
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            showToast("Descargando imagen…")
        },
        [showToast, supabaseUrl]
    )

    const handleCopy = useCallback(
        async (post: SomaPost) => {
            try {
                const text = `${post.caption}\n\n${post.hashtags
                    .map((h) => `#${h}`)
                    .join(" ")}`
                await navigator.clipboard.writeText(text)
                showToast("Texto copiado")
            } catch (err: any) {
                setErrorMsg(`Copia falló: ${err?.message ?? "desconocido"}`)
            }
        },
        [showToast]
    )

    const handleCopyPrompt = useCallback(
        async (post: SomaPost) => {
            try {
                await navigator.clipboard.writeText(post.prompt_visual || "")
                showToast("Prompt copiado")
            } catch (err: any) {
                setErrorMsg(`Copia falló: ${err?.message ?? "desconocido"}`)
            }
        },
        [showToast]
    )

    const updatePostInState = useCallback(
        (postId: string, patch: Partial<SomaPost>) => {
            const apply = (prev: SomaPost[]) =>
                prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
            setCurrentBatch(apply)
            setHistory(apply)
        },
        []
    )

    /* ─── Manual upload (reusa upload-vtli-post-image con table=soma_posts) ─── */
    const handleUploadPostImage = useCallback(
        async (postId: string, file: File) => {
            if (!userId || uploadingPostId) return
            setUploadingPostId(postId)
            try {
                const { base64, mime } = await resizePostImageToBase64(
                    file,
                    1080
                )
                const url = `${supabaseUrl}/functions/v1/upload-vtli-post-image`
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        admin_clerk_id: userId,
                        token: await (window as any).Clerk?.session?.getToken?.(),
                        post_id: postId,
                        image_base64: base64,
                        image_mime: mime,
                        table: "soma_posts",
                    }),
                })
                const data = await res.json()
                if (res.ok && data?.image_r2_url) {
                    updatePostInState(postId, {
                        image_r2_url: data.image_r2_url,
                    })
                    showToast("Imagen guardada ✓")
                } else {
                    setErrorMsg(
                        `No se pudo subir la imagen: ${data?.error ?? res.status}`
                    )
                }
            } catch (err: any) {
                setErrorMsg(
                    `No se pudo subir la imagen: ${err?.message ?? err}`
                )
            } finally {
                setUploadingPostId(null)
            }
        },
        [
            userId,
            uploadingPostId,
            supabaseUrl,
            supabaseAnonKey,
            updatePostInState,
            showToast,
        ]
    )

    const handleTogglePublished = useCallback(
        async (post: SomaPost) => {
            if (!userId) return
            const next = !post.is_published
            updatePostInState(post.id, { is_published: next })
            const r = await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "set_soma_post_published",
                {
                    p_admin_clerk_id: userId,
                    p_post_id: post.id,
                    p_published: next,
                }
            )
            if (!r?.success) {
                updatePostInState(post.id, { is_published: !next })
                setErrorMsg("No se pudo cambiar Publicado")
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, updatePostInState]
    )

    const handleDelete = useCallback(
        async (post: SomaPost) => {
            if (!userId || processingPostId) return
            const preview = post.aha_moment
                ? `"${post.aha_moment.slice(0, 90)}${post.aha_moment.length > 90 ? "…" : ""}"`
                : `ángulo: ${post.target}`
            const confirmed =
                typeof window !== "undefined"
                    ? window.confirm(
                          `Borrar este post para siempre?\n\n${preview}\n\nLa imagen R2 queda huérfana en el bucket — no se borra automáticamente.`
                      )
                    : false
            if (!confirmed) return
            setProcessingPostId(post.id)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "delete_soma_post",
                    {
                        p_admin_clerk_id: userId,
                        p_post_id: post.id,
                    }
                )
                if (r?.success) {
                    setCurrentBatch((prev) =>
                        prev.filter((p) => p.id !== post.id)
                    )
                    setHistory((prev) => prev.filter((p) => p.id !== post.id))
                    showToast("Post borrado")
                    loadDashboard()
                } else {
                    setErrorMsg(r?.error || "No se pudo borrar el post")
                }
            } catch (err: any) {
                setErrorMsg(`Borrado falló: ${err?.message ?? "desconocido"}`)
            } finally {
                setProcessingPostId(null)
            }
        },
        [
            userId,
            processingPostId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboard,
            showToast,
        ]
    )

    /* ─── Retry image manual ─── */
    const handleRetryImage = useCallback(
        async (postId: string) => {
            if (!userId) return
            autoRetriedRef.current.delete(postId)
            setRetryTick((n) => n + 1)
            const nowIso = new Date().toISOString()
            const resetter = (prev: SomaPost[]) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              image_r2_url: null,
                              status: "draft" as SomaStatus,
                              generated_at: nowIso,
                          }
                        : p
                )
            setCurrentBatch(resetter)
            setHistory(resetter)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-soma-posts`
                await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        admin_clerk_id: userId,
                        token: await (window as any).Clerk?.session?.getToken?.(),
                        retry_image_only_for_post_id: postId,
                    }),
                })
                showToast("Reintentando imagen…")
            } catch (err: any) {
                setErrorMsg(`Reintento falló: ${err?.message ?? "desconocido"}`)
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, showToast]
    )

    /* ─── Polling unificado de imágenes pendientes + auto-retry ─── */
    useEffect(() => {
        if (!userId) return
        let hadPending = false
        let lastAnnouncedAt = 0

        const tick = async () => {
            const pendingSet = new Set<string>()
            for (const p of currentBatchRef.current) {
                if (
                    !p.image_r2_url &&
                    p.status !== "rejected" &&
                    p.image_mode !== "prompts"
                )
                    pendingSet.add(p.id)
            }
            for (const p of historyRef.current) {
                if (
                    !p.image_r2_url &&
                    p.status !== "rejected" &&
                    p.image_mode !== "prompts"
                )
                    pendingSet.add(p.id)
            }
            const pendingIds = Array.from(pendingSet)

            if (pendingIds.length === 0) {
                if (hadPending && Date.now() - lastAnnouncedAt > 8000) {
                    lastAnnouncedAt = Date.now()
                    showToast("Imágenes materializadas")
                    loadDashboard()
                    hadPending = false
                }
                return
            }
            hadPending = true

            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_soma_posts_by_ids",
                    { p_admin_clerk_id: userId, p_ids: pendingIds }
                )
                if (r?.posts && Array.isArray(r.posts)) {
                    const map = new Map<string, any>()
                    for (const u of r.posts) if (u?.id) map.set(u.id, u)
                    const merger = (prev: SomaPost[]) =>
                        prev.map((p) => {
                            const u = map.get(p.id)
                            if (!u) return p
                            if (u.image_r2_url || u.status === "rejected") {
                                return {
                                    ...p,
                                    image_r2_url: u.image_r2_url,
                                    status: u.status,
                                }
                            }
                            return p
                        })
                    setCurrentBatch(merger)
                    setHistory(merger)
                }

                // AUTO-RETRY: cards pending sin imagen + no rejected +
                // cupo no agotado → invocación fresca en modo retry_image_only.
                const allCards = [
                    ...currentBatchRef.current,
                    ...historyRef.current,
                ]
                const now = Date.now()
                let autoRetriedCount = 0
                const seen = new Set<string>()
                for (const p of allCards) {
                    if (seen.has(p.id)) continue
                    seen.add(p.id)
                    if (p.image_r2_url || p.status === "rejected") continue
                    if (p.image_mode === "prompts") continue
                    const currentRetries = autoRetriedRef.current.get(p.id) ?? 0
                    if (currentRetries >= MAX_AUTO_RETRIES) continue
                    const ageSec =
                        (now - new Date(p.generated_at).getTime()) / 1000
                    if (ageSec <= AUTO_RETRY_THRESHOLD_SEC) continue
                    const nextRetry = currentRetries + 1
                    autoRetriedRef.current.set(p.id, nextRetry)
                    autoRetriedCount++
                    const nowIso = new Date().toISOString()
                    const resetter = (prev: SomaPost[]) =>
                        prev.map((q) =>
                            q.id === p.id
                                ? {
                                      ...q,
                                      image_r2_url: null,
                                      status: "draft" as SomaStatus,
                                      generated_at: nowIso,
                                  }
                                : q
                        )
                    setCurrentBatch(resetter)
                    setHistory(resetter)
                    fetch(
                        `${supabaseUrl}/functions/v1/generate-soma-posts`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: supabaseAnonKey,
                                Authorization: `Bearer ${supabaseAnonKey}`,
                            },
                            body: JSON.stringify({
                                admin_clerk_id: userId,
                                token: await (window as any).Clerk?.session?.getToken?.(),
                                retry_image_only_for_post_id: p.id,
                            }),
                        }
                    ).catch(() => {})
                }
                if (autoRetriedCount > 0) {
                    setRetryTick((n) => n + 1)
                    showToast(
                        `Reintentando ${autoRetriedCount} imagen${autoRetriedCount > 1 ? "es" : ""} automáticamente`
                    )
                }
            } catch (err) {
                console.warn("[soma:poll]", err)
            }
        }

        const interval = setInterval(tick, 4000)
        return () => clearInterval(interval)
    }, [userId, supabaseUrl, supabaseAnonKey, loadDashboard, showToast])

    /* ─── Render ─── */
    const filteredHistory = useMemo(() => {
        const batchIds = new Set(currentBatch.map((p) => p.id))
        return history.filter(
            (p) =>
                !batchIds.has(p.id) &&
                (histFilter === "all" || p.status === histFilter)
        )
    }, [history, currentBatch, histFilter])

    return (
        <div className="sm-root">
            <div className="sm-intro">
                <p className="sm-intro-title">◯ Soma Cero · Cancún</p>
                <p className="sm-intro-text">
                    Alimentos de alta conductividad — 0 azúcar · 0 gluten ·
                    100% vegano. Elige la categoría (Waffle Cero, Conciencia,
                    Memes o Domingo) y genera de a 1 por vez, con fotografía
                    cálida y apetitosa. Los posts de Domingo cierran solos con el
                    menú completo (tamaños, precios, horario y WhatsApp). En modo
                    "Solo prompts", adjunta tus fotos del waffle real; el prompt
                    le pide a Nano Banana reproducirlo EXACTAMENTE como en tus
                    fotos, sin inventar emplatado. Imágenes 3:4.
                </p>
            </div>

            {dashboard && (
                <div className="sm-dashboard">
                    <div className="sm-stat">
                        <p className="sm-stat-num">
                            {dashboard.month_generated_waffle}
                        </p>
                        <p className="sm-stat-lbl">Waffle mes</p>
                    </div>
                    <div className="sm-stat">
                        <p className="sm-stat-num">
                            {dashboard.month_generated_conciencia}
                        </p>
                        <p className="sm-stat-lbl">Conciencia mes</p>
                    </div>
                    <div className="sm-stat">
                        <p className="sm-stat-num">
                            {dashboard.month_generated_memes}
                        </p>
                        <p className="sm-stat-lbl">Memes mes</p>
                    </div>
                    <div className="sm-stat">
                        <p className="sm-stat-num">
                            {dashboard.month_generated_viernes}
                        </p>
                        <p className="sm-stat-lbl">Domingo mes</p>
                    </div>
                    <div className="sm-stat">
                        <p className="sm-stat-num">
                            {dashboard.total_lifetime}
                        </p>
                        <p className="sm-stat-lbl">Total</p>
                    </div>
                </div>
            )}

            <div className="sm-cat-select">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        className={`sm-cat-btn${category === c.key ? " on" : ""}`}
                        onClick={() => setCategory(c.key)}
                        disabled={generating}
                    >
                        <span className="sm-cat-glyph">{c.glyph}</span>
                        <span className="sm-cat-txt">
                            <span className="sm-cat-main">{c.label}</span>
                            <span className="sm-cat-sub">{c.long}</span>
                        </span>
                    </button>
                ))}
            </div>

            {category === "memes" && (
                <div className="sm-mode-toggle">
                    <span className="sm-mode-label">Eje del meme:</span>
                    <button
                        className={`sm-mode-btn${!memeRandomAxis ? " on" : ""}`}
                        onClick={() => setMemeRandomAxis(false)}
                        disabled={generating}
                    >
                        Guiado
                    </button>
                    <button
                        className={`sm-mode-btn${memeRandomAxis ? " on" : ""}`}
                        onClick={() => setMemeRandomAxis(true)}
                        disabled={generating}
                    >
                        Aleatorio
                    </button>
                    <span className="sm-mode-hint">
                        {memeRandomAxis
                            ? "Aleatorio: Gemini elige un ángulo libre y sorpresivo (no rota siempre los mismos ejes)."
                            : "Guiado: se apoya en los ejes en prioridad (bajón vs estabilidad, inflamación, mente clara, antojo vs saciedad, presencia)."}
                    </span>
                </div>
            )}

            {category === "viernes" && (
                <div className="sm-mode-toggle">
                    <span className="sm-mode-label">Tono del domingo:</span>
                    <button
                        className={`sm-mode-btn${viernesTone === "festivo" ? " on" : ""}`}
                        onClick={() => setViernesTone("festivo")}
                        disabled={generating}
                    >
                        Festivo
                    </button>
                    <button
                        className={`sm-mode-btn${viernesTone === "elegante" ? " on" : ""}`}
                        onClick={() => setViernesTone("elegante")}
                        disabled={generating}
                    >
                        Elegante
                    </button>
                    <button
                        className={`sm-mode-btn${viernesTone === "sorpresa" ? " on" : ""}`}
                        onClick={() => setViernesTone("sorpresa")}
                        disabled={generating}
                    >
                        Sorpresa
                    </button>
                    <span className="sm-mode-hint">
                        {viernesTone === "festivo"
                            ? "Festivo: juguetón y con chispa del Waffle Cero personaje, energía de '¡por fin domingo!'."
                            : viernesTone === "elegante"
                              ? "Elegante: bienvenida cálida y sobria, bodegón apetitoso del waffle, menos broma y más belleza."
                              : "Sorpresa: el motor alterna entre festivo y elegante buscando variedad respecto a los domingos recientes."}
                    </span>
                </div>
            )}

            {category === "conciencia" && (
                <div className="sm-mode-toggle">
                    <span className="sm-mode-label">Pilar:</span>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "auto" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("auto")}
                        disabled={generating}
                    >
                        Automático
                    </button>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "azucar" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("azucar")}
                        disabled={generating}
                    >
                        Azúcar
                    </button>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "gluten" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("gluten")}
                        disabled={generating}
                    >
                        Gluten
                    </button>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "aceites" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("aceites")}
                        disabled={generating}
                    >
                        Aceites
                    </button>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "soya" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("soya")}
                        disabled={generating}
                    >
                        Soya
                    </button>
                    <button
                        className={`sm-mode-btn${concienciaPilar === "veganismo" ? " on" : ""}`}
                        onClick={() => setConcienciaPilar("veganismo")}
                        disabled={generating}
                    >
                        Veganismo
                    </button>
                    <span className="sm-mode-hint">
                        {concienciaPilar === "auto"
                            ? "Automático: el motor elige un pilar y rota entre los cinco sin repetir el reciente."
                            : "Pilar fijo: este post trata exclusivamente " +
                              (({
                                  azucar: "el 0% azúcar refinada",
                                  gluten: "el 0% gluten",
                                  aceites: "el 0% aceites industriales",
                                  soya: "el sin soya",
                                  veganismo: "el 100% vegano",
                              } as Record<string, string>)[
                                  concienciaPilar
                              ] ?? concienciaPilar) +
                              "."}
                    </span>
                </div>
            )}

            <div className="sm-mode-toggle">
                <span className="sm-mode-label">Imágenes:</span>
                <button
                    className={`sm-mode-btn${imageMode === "prompts" ? " on" : ""}`}
                    onClick={() => setImageMode("prompts")}
                    disabled={generating}
                >
                    Solo prompts
                </button>
                <button
                    className={`sm-mode-btn${imageMode === "api" ? " on" : ""}`}
                    onClick={() => setImageMode("api")}
                    disabled={generating}
                >
                    Con API
                </button>
                <span className="sm-mode-hint">
                    {imageMode === "prompts"
                        ? "Solo prompts ($0): el motor da el prompt; en los posts con waffle te pide usar EXACTAMENTE tus fotos del waffle real (varios ángulos) para que Nano Banana lo reproduzca tal cual, sin inventar emplatado. Lo generas a mano adjuntando esas fotos y subes la imagen al card."
                        : "Con API: el motor genera el copy y materializa la imagen 3:4 automáticamente."}
                </span>
            </div>

            <div className="sm-gen-wrap">
                <button
                    className={`sm-gen-btn${generating ? " busy" : ""}`}
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    <span className="sm-gen-glyph">
                        {CATEGORIES.find((c) => c.key === category)?.glyph ??
                            "🧇"}
                    </span>
                    <span className="sm-gen-text">
                        <span className="sm-gen-main">
                            {generating
                                ? "Generando…"
                                : `Generar 1 · ${catSingle(category)}`}
                        </span>
                        <span className="sm-gen-sub">
                            Copy + visual en la voz de Soma Cero
                        </span>
                    </span>
                </button>
            </div>

            {errorMsg && <div className="sm-error">{errorMsg}</div>}

            {currentBatch.length > 0 && (
                <>
                    <div className="sm-batch-header">
                        <p className="sm-batch-title">Tanda actual</p>
                        <p className="sm-batch-meta">
                            {currentBatch.length} post
                            {currentBatch.length > 1 ? "s" : ""} ·{" "}
                            {imageMode === "prompts"
                                ? "modo manual"
                                : "imagen por API"}
                        </p>
                    </div>
                    <div className="sm-grid">
                        {currentBatch.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isProcessing={processingPostId === post.id}
                                autoRetryCount={
                                    autoRetriedRef.current.get(post.id) ?? 0
                                }
                                autoRetriesExhausted={
                                    (autoRetriedRef.current.get(post.id) ??
                                        0) >= MAX_AUTO_RETRIES
                                }
                                uploading={uploadingPostId === post.id}
                                onApprove={() =>
                                    handleUpdateStatus(post.id, "approved")
                                }
                                onPublish={() =>
                                    handleUpdateStatus(post.id, "published")
                                }
                                onReroll={() => handleReroll(post.id)}
                                onDownload={() => handleDownload(post)}
                                onCopy={() => handleCopy(post)}
                                onDelete={() => handleDelete(post)}
                                onRetryImage={() => handleRetryImage(post.id)}
                                onZoom={(u) => setLightboxUrl(u)}
                                onUploadImage={(f) =>
                                    handleUploadPostImage(post.id, f)
                                }
                                onCopyPrompt={() => handleCopyPrompt(post)}
                                onTogglePublished={() =>
                                    handleTogglePublished(post)
                                }
                            />
                        ))}
                    </div>
                </>
            )}

            <div className="sm-section-header">
                <span>Historial</span>
                <span className="sm-section-header-count">
                    {filteredHistory.length} posts
                </span>
            </div>
            <div className="sm-filters">
                {HISTORY_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        className={`sm-filter${histFilter === f.key ? " active" : ""}`}
                        onClick={() => setHistFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
            {filteredHistory.length === 0 ? (
                <div className="sm-empty">
                    Aún no hay posts en este filtro. Genera tu primera tanda de
                    Waffle Cero arriba.
                </div>
            ) : (
                <div className="sm-grid">
                    {filteredHistory.slice(0, 60).map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isProcessing={processingPostId === post.id}
                            autoRetryCount={
                                autoRetriedRef.current.get(post.id) ?? 0
                            }
                            autoRetriesExhausted={
                                (autoRetriedRef.current.get(post.id) ?? 0) >=
                                MAX_AUTO_RETRIES
                            }
                            uploading={uploadingPostId === post.id}
                            onApprove={() =>
                                handleUpdateStatus(post.id, "approved")
                            }
                            onPublish={() =>
                                handleUpdateStatus(post.id, "published")
                            }
                            onReroll={() => handleReroll(post.id)}
                            onDownload={() => handleDownload(post)}
                            onCopy={() => handleCopy(post)}
                            onDelete={() => handleDelete(post)}
                            onRetryImage={() => handleRetryImage(post.id)}
                            onZoom={(u) => setLightboxUrl(u)}
                            onUploadImage={(f) =>
                                handleUploadPostImage(post.id, f)
                            }
                            onCopyPrompt={() => handleCopyPrompt(post)}
                            onTogglePublished={() =>
                                handleTogglePublished(post)
                            }
                        />
                    ))}
                </div>
            )}

            {lightboxUrl && (
                <div
                    className="sm-lightbox"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="sm-lightbox-close"
                        onClick={() => setLightboxUrl(null)}
                    >
                        ×
                    </button>
                    <img src={lightboxUrl} alt="preview" />
                </div>
            )}

            {toast && <div className="sm-toast">{toast}</div>}
        </div>
    )
}

AtelierSomaCero.displayName = "AT_SomaCero"

export default AtelierSomaCero
